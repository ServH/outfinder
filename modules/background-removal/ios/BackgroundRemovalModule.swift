import ExpoModulesCore
import CoreImage
import CoreVideo
import Foundation
import ImageIO
import Vision

public class BackgroundRemovalModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BackgroundRemoval")

        AsyncFunction("removeBackground") { (inputUri: String) -> [String: String] in
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
    // segmentation AND AFTER the dominant-hex sample is taken, only to keep
    // the encoded PNG small.
    private static let maxProcessingDimension: CGFloat = 2048

    // Alpha byte threshold equivalent to `alpha > 0.5` on the [0,1] scale.
    // Pixels at or below this are treated as transparent padding and excluded
    // from the dominant-color average — this is the root-cause fix for the
    // transparency trap (see docs/planning/epic-14-tech-review.md#finding-1
    // and feedback_js_swift_constant_sync.md).
    private static let minOpaqueAlphaByte: UInt8 = 127

    // MARK: - Core Processing

    private static func process(inputUri: String) throws -> [String: String] {
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

        // Sample the dominant hex BEFORE downsampling so the weighted average
        // reflects full-resolution pixels (TD-1). If the buffer has no opaque
        // pixels, treat it as a degenerate cutout and route through noSubject
        // rather than encoding a PNG with a misleading hex.
        guard let dominantHex = computeDominantHex(buffer: pixelBuffer) else {
            throw error(kind: "noSubject", message: "Cutout contained no opaque pixels")
        }

        // Wrap the masked CVPixelBuffer, downsample only now (AFTER segmentation
        // AND AFTER dominant-hex sampling) so the encoded PNG stays compact
        // while Vision saw the full-res edges.
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

        return [
            "cutoutUri": outputURL.absoluteString,
            "dominantHex": dominantHex,
        ]
    }

    // MARK: - Dominant Hex Extraction

    /// Iterates the pre-multiplied RGBA (or BGRA) pixels of a Vision mask
    /// buffer, keeps only pixels whose alpha byte exceeds `minOpaqueAlphaByte`
    /// (threshold `alpha > 0.5`), de-premultiplies each kept channel, and
    /// returns the weighted RGB average formatted as `#RRGGBB` uppercase.
    ///
    /// Returns `nil` when no pixel survives the alpha gate — the caller must
    /// treat this as a degenerate (all-transparent) cutout and throw the
    /// module's `noSubject` error BEFORE encoding the PNG, so the JS side
    /// never sees `#000000` on a real garment.
    ///
    /// Branches between `kCVPixelFormatType_32RGBA` and
    /// `kCVPixelFormatType_32BGRA` / `32ARGB` / `32ABGR` because Vision's
    /// `generateMaskedImage` may emit any of these depending on iOS version
    /// and device. Skipping this would flip red/blue on-device.
    private static func computeDominantHex(buffer: CVPixelBuffer) -> String? {
        CVPixelBufferLockBaseAddress(buffer, .readOnly)
        defer {
            CVPixelBufferUnlockBaseAddress(buffer, .readOnly)
        }

        let width = CVPixelBufferGetWidth(buffer)
        let height = CVPixelBufferGetHeight(buffer)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)
        guard let base = CVPixelBufferGetBaseAddress(buffer) else { return nil }

        let format = CVPixelBufferGetPixelFormatType(buffer)
        let layout = PixelLayout(format: format)

        var sumR: UInt64 = 0
        var sumG: UInt64 = 0
        var sumB: UInt64 = 0
        var count: UInt64 = 0

        let bytePtr = base.assumingMemoryBound(to: UInt8.self)

        for y in 0..<height {
            let row = bytePtr.advanced(by: y * bytesPerRow)
            for x in 0..<width {
                let pixel = row.advanced(by: x * 4)
                let a = pixel[layout.aOffset]
                if a <= minOpaqueAlphaByte { continue }
                // De-premultiply each channel by alpha/255 so antialiased edges
                // and partially-opaque shadow pixels contribute their TRUE RGB.
                // Clamp to [0, 255] after the divide in case rounding pushed a
                // premultiplied byte fractionally above its alpha.
                let aNorm = Double(a) / 255.0
                let r = min(255, Int(Double(pixel[layout.rOffset]) / aNorm + 0.5))
                let g = min(255, Int(Double(pixel[layout.gOffset]) / aNorm + 0.5))
                let b = min(255, Int(Double(pixel[layout.bOffset]) / aNorm + 0.5))
                sumR &+= UInt64(r)
                sumG &+= UInt64(g)
                sumB &+= UInt64(b)
                count &+= 1
            }
        }

        guard count > 0 else { return nil }

        let avgR = min(255, Int((Double(sumR) / Double(count)).rounded()))
        let avgG = min(255, Int((Double(sumG) / Double(count)).rounded()))
        let avgB = min(255, Int((Double(sumB) / Double(count)).rounded()))
        return String(format: "#%02X%02X%02X", avgR, avgG, avgB)
    }

    /// RGBA byte offsets for the common 32-bit pixel formats Vision can emit.
    private struct PixelLayout {
        let rOffset: Int
        let gOffset: Int
        let bOffset: Int
        let aOffset: Int

        init(format: OSType) {
            switch format {
            case kCVPixelFormatType_32RGBA:
                rOffset = 0; gOffset = 1; bOffset = 2; aOffset = 3
            case kCVPixelFormatType_32ARGB:
                aOffset = 0; rOffset = 1; gOffset = 2; bOffset = 3
            case kCVPixelFormatType_32ABGR:
                aOffset = 0; bOffset = 1; gOffset = 2; rOffset = 3
            default:
                // Default to BGRA — the most common Vision / Core Video layout
                // on iOS 17+. Covers kCVPixelFormatType_32BGRA explicitly and
                // also serves as the fallback for any unknown 32-bit format.
                bOffset = 0; gOffset = 1; rOffset = 2; aOffset = 3
            }
        }
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

    /// Builds an expo-modules-core `Exception` carrying `kind` as its `code`.
    /// `AsyncFunctionDefinition` catches `Exception` and routes it through
    /// `FunctionCallException`, which propagates `cause.code` — so the JS side
    /// sees `error.code = kind` ("noSubject" / "visionFailed" / "ioFailed").
    /// Using plain `NSError` would fall into `UnexpectedException`, which
    /// discards `userInfo` and always produces `code = "ERR_UNEXPECTED"`.
    private static func error(kind: String, message: String) -> Exception {
        return Exception(name: kind, description: message, code: kind)
    }
}
