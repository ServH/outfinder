import ExpoModulesCore
import CoreImage
import Foundation
import ImageIO
import Vision

public class BackgroundRemovalModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BackgroundRemoval")

        AsyncFunction("removeBackground") { (inputUri: String) -> String in
            return try BackgroundRemovalModule.process(inputUri: inputUri)
        }
    }

    // MARK: - Shared CIContext
    // Constructing a CIContext compiles a Metal pipeline and is expensive — Apple
    // recommends reusing a single instance across renders. Pin to sRGB so the
    // PNG encode shares a deterministic color-management path with the rest of
    // the capture pipeline (matches WhiteBalanceModule.sharedContext).
    private static let sharedContext: CIContext = {
        if let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) {
            return CIContext(options: [.workingColorSpace: colorSpace])
        }
        return CIContext()
    }()

    // Cap output resolution to bound peak memory on full-resolution captures
    // (iPhone 15 Pro emits ~8064×6048 HEICs). Vision still runs at full
    // resolution to preserve edge quality; the downsample is applied AFTER
    // segmentation, only to keep the encoded PNG small.
    private static let maxProcessingDimension: CGFloat = 2048

    // MARK: - Core Processing

    private static func process(inputUri: String) throws -> String {
        // Resolve URI to a filesystem URL. Prefer URL parsing so percent-encoded
        // paths (`file:///var/.../My%20Photo.heic`) work; fall back to raw path.
        let sourceURL: URL = {
            if let parsed = URL(string: inputUri), parsed.isFileURL {
                return parsed
            }
            let stripped = inputUri.hasPrefix("file://")
                ? String(inputUri.dropFirst(7)).removingPercentEncoding ?? String(inputUri.dropFirst(7))
                : inputUri
            return URL(fileURLWithPath: stripped)
        }()

        // Confirm the image is loadable before we spin up Vision. This also
        // surfaces a clean `ioFailed` for missing / unreadable files instead of
        // a Vision-internal error later.
        guard CIImage(contentsOf: sourceURL) != nil else {
            throw error(kind: "ioFailed", message: "Failed to load image at \(inputUri)")
        }

        // Resolve the source's CGImagePropertyOrientation from the file's EXIF
        // metadata and pass it to the Vision handler. Skipping this is the #1
        // reported Vision bug — portrait photos (EXIF 6 / 8) would be segmented
        // sideways.
        let orientation = resolveOrientation(for: sourceURL)

        // Vision segmentation is iOS 17+ only. The UI gate (Story 13.4a) hides
        // the Armario entry point on older OS; this is a belt-and-braces guard.
        guard #available(iOS 17.0, *) else {
            throw error(kind: "visionFailed", message: "iOS 17 is required for background removal")
        }

        let request = VNGenerateForegroundInstanceMaskRequest()
        let handler = VNImageRequestHandler(url: sourceURL, orientation: orientation, options: [:])

        do {
            try handler.perform([request])
        } catch {
            throw BackgroundRemovalModule.error(
                kind: "visionFailed",
                message: "Vision request failed: \(error.localizedDescription)"
            )
        }

        guard let observation = request.results?.first else {
            throw error(kind: "noSubject", message: "No foreground detected")
        }

        guard !observation.allInstances.isEmpty else {
            throw error(kind: "noSubject", message: "No foreground instances detected")
        }

        let pixelBuffer: CVPixelBuffer
        do {
            pixelBuffer = try observation.generateMaskedImage(
                ofInstances: observation.allInstances,
                from: handler,
                croppedToInstancesExtent: true
            )
        } catch {
            throw BackgroundRemovalModule.error(
                kind: "visionFailed",
                message: "generateMaskedImage failed: \(error.localizedDescription)"
            )
        }

        // Wrap the masked CVPixelBuffer, downsample only now (AFTER segmentation)
        // so the encoded PNG stays compact while Vision saw the full-res edges.
        let maskedImage = CIImage(cvPixelBuffer: pixelBuffer)
        let outputImage = downsampleIfNeeded(maskedImage)

        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
            throw error(kind: "ioFailed", message: "Could not create sRGB color space")
        }

        guard let pngData = sharedContext.pngRepresentation(
            of: outputImage,
            format: .RGBA8,
            colorSpace: colorSpace,
            options: [:]
        ) else {
            throw error(kind: "ioFailed", message: "Failed to encode cutout as PNG")
        }

        // UUID filename (not a deterministic slot) because Story 13.3a may call
        // removeBackground in rapid succession and the Preview screen may still
        // be reading the previous file. A deterministic slot would race.
        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("cutout-\(UUID().uuidString).png")

        do {
            try pngData.write(to: outputURL)
        } catch {
            throw BackgroundRemovalModule.error(
                kind: "ioFailed",
                message: "Failed to write cutout PNG: \(error.localizedDescription)"
            )
        }

        return outputURL.absoluteString
    }

    // MARK: - Orientation Resolution

    /// Reads the EXIF orientation from the source file and maps it to a
    /// `CGImagePropertyOrientation`. Defaults to `.up` when no orientation
    /// metadata is present. Passing this value to `VNImageRequestHandler` is
    /// required for portrait-captured JPEG/HEIC images — otherwise Vision
    /// segments the un-rotated raw pixels and the output comes out sideways.
    private static func resolveOrientation(for url: URL) -> CGImagePropertyOrientation {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let rawOrientation = properties[kCGImagePropertyOrientation] as? UInt32,
              let orientation = CGImagePropertyOrientation(rawValue: rawOrientation) else {
            return .up
        }
        return orientation
    }

    // MARK: - Downsampling

    /// Scales the image so the longest edge ≤ `maxProcessingDimension`.
    /// If the source is already small enough, returns it unchanged.
    private static func downsampleIfNeeded(_ image: CIImage) -> CIImage {
        let extent = image.extent
        guard !extent.isInfinite,
              extent.width.isFinite, extent.height.isFinite,
              extent.width > 0, extent.height > 0 else {
            return image
        }
        let longest = max(extent.width, extent.height)
        guard longest > maxProcessingDimension else { return image }
        let scale = maxProcessingDimension / longest
        return image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    }

    // MARK: - Error Helper

    /// Builds an NSError that carries the typed `kind` in `userInfo["code"]`.
    /// The expo-modules bridge surfaces both `NSLocalizedDescriptionKey`
    /// (as `error.message`) and `userInfo["code"]` (as `error.code`) on the
    /// JS side — the wrapper in `src/index.ts` reads `error.code` to build
    /// the `BackgroundRemovalError` discriminated union.
    private static func error(kind: String, message: String) -> NSError {
        return NSError(
            domain: "BackgroundRemoval",
            code: 0,
            userInfo: [
                NSLocalizedDescriptionKey: message,
                "code": kind,
            ]
        )
    }
}
