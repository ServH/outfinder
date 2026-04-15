import ExpoModulesCore
import CoreImage
import Foundation

public class WhiteBalanceModule: Module {
    public func definition() -> ModuleDefinition {
        Name("WhiteBalance")

        AsyncFunction("applyWhiteBalance") { (imageUri: String, temperature: Double) -> String in
            return try WhiteBalanceModule.process(imageUri: imageUri, temperature: temperature)
        }
    }

    // MARK: - Shared CIContext
    // Constructing a CIContext compiles a Metal pipeline and is expensive — Apple
    // recommends reusing a single instance across renders. Pin to sRGB so border
    // sampling and JPEG encoding share one consistent color management path.
    private static let sharedContext: CIContext = {
        if let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) {
            return CIContext(options: [.workingColorSpace: colorSpace])
        }
        return CIContext()
    }()

    // Cap working resolution to bound peak memory on full-resolution captures
    // (iPhone 15 Pro emits ~8064×6048 JPEGs). Dominant-colour extraction does
    // not need the original detail, and the corrected JPEG is consumed by
    // `react-native-image-colors`, never shown to the user. 2048px on the long
    // edge keeps GPU buffers comfortably under 100MB even on 3GB devices.
    private static let maxProcessingDimension: CGFloat = 2048

    // Center-crop the WB-corrected image before dominant-colour extraction so
    // the analysis region matches the on-screen framing rectangle and ignores
    // background / skin / shadows. MUST equal `ANALYSIS_FRAME_FRACTION` in
    // src/screens/CaptureScreen.tsx — the user sees brackets at this fraction
    // of the shorter screen edge and expects the pixels inside them to be
    // what drives the match.
    private static let analysisFraction: CGFloat = 0.65

    // MARK: - Core Processing

    private static func process(imageUri: String, temperature: Double) throws -> String {
        // Resolve URI to a filesystem path. Prefer URL parsing so percent-encoded
        // paths (`file:///var/.../My%20Photo.jpg`) work; fall back to raw path.
        let sourceURL: URL = {
            if let parsed = URL(string: imageUri), parsed.isFileURL {
                return parsed
            }
            let stripped = imageUri.hasPrefix("file://")
                ? String(imageUri.dropFirst(7)).removingPercentEncoding ?? String(imageUri.dropFirst(7))
                : imageUri
            return URL(fileURLWithPath: stripped)
        }()

        guard let loadedImage = CIImage(contentsOf: sourceURL) else {
            throw NSError(domain: "WhiteBalance", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Failed to load image at \(imageUri)"])
        }

        // Downsample if needed before any further processing — guards against
        // OOM on 48MP captures and accelerates the whole pipeline. Aspect ratio
        // is preserved.
        let ciImage = downsampleIfNeeded(loadedImage)

        // Determine scene illuminant temperature.
        // Negative `temperature` (sentinel WB_AUTO_MODE in JS) requests auto-estimation
        // from border-pixel sampling. Any non-negative value is treated as manual Kelvin
        // and clamped to the same [2700, 7000] range that auto-mode produces, so the
        // two paths share one well-defined output domain.
        let sceneTemp: Double
        if temperature < 0.0 {
            sceneTemp = try estimateBorderTemperature(from: ciImage)
        } else {
            sceneTemp = max(2700, min(7000, temperature))
        }

        // Apply CITemperatureAndTint: inputNeutral = scene illuminant, inputTargetNeutral = daylight 6500K
        guard let filter = CIFilter(name: "CITemperatureAndTint") else {
            throw NSError(domain: "WhiteBalance", code: 2,
                          userInfo: [NSLocalizedDescriptionKey: "CITemperatureAndTint filter unavailable"])
        }
        filter.setValue(ciImage, forKey: kCIInputImageKey)
        filter.setValue(CIVector(x: CGFloat(sceneTemp), y: 0), forKey: "inputNeutral")
        filter.setValue(CIVector(x: 6500, y: 0), forKey: "inputTargetNeutral")

        guard let outputImage = filter.outputImage else {
            throw NSError(domain: "WhiteBalance", code: 3,
                          userInfo: [NSLocalizedDescriptionKey: "Filter produced no output"])
        }

        // Center-crop to the analysis region so the JPEG handed to JS contains
        // only the pixels inside the on-screen framing rectangle. This is the
        // single biggest quality lever — without it, the dominant-colour
        // extractor averages in background, skin, and shadows.
        let croppedOutput = centerCrop(outputImage, fraction: analysisFraction)

        // Render corrected image to JPEG using a single deterministic temp slot.
        // Each capture overwrites the previous file, so the temp directory grows
        // by at most one JPEG instead of accumulating UUID-named entries that
        // iOS only reaps on storage pressure.
        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("wb-corrected.jpg")
        try? FileManager.default.removeItem(at: outputURL)

        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
            throw NSError(domain: "WhiteBalance", code: 4,
                          userInfo: [NSLocalizedDescriptionKey: "Could not create sRGB color space"])
        }
        do {
            try sharedContext.writeJPEGRepresentation(of: croppedOutput, to: outputURL,
                                                       colorSpace: colorSpace, options: [:])
        } catch {
            throw NSError(domain: "WhiteBalance", code: 6,
                          userInfo: [NSLocalizedDescriptionKey: "Failed to write corrected JPEG: \(error.localizedDescription)"])
        }

        return outputURL.absoluteString
    }

    // MARK: - Downsampling

    /// Returns a CIImage scaled so the longest edge ≤ `maxProcessingDimension`.
    /// If the source is already small enough, returns it unchanged.
    private static func downsampleIfNeeded(_ image: CIImage) -> CIImage {
        let extent = image.extent
        // Reject infinite extents (generator CIImages) and non-positive sizes.
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

    // MARK: - Center Crop

    /// Crops to a centred square whose side is `fraction * min(width, height)`.
    /// Clamps to the source extent (never exceeds the image bounds) and
    /// translates the result to origin (0,0) so JPEG encoding produces a tight
    /// file without offset padding.
    private static func centerCrop(_ image: CIImage, fraction: CGFloat) -> CIImage {
        let extent = image.extent
        guard !extent.isInfinite,
              extent.width.isFinite, extent.height.isFinite,
              extent.width > 0, extent.height > 0 else {
            return image
        }
        let short = min(extent.width, extent.height)
        let side = short * fraction
        let rect = CGRect(
            x: extent.midX - side / 2,
            y: extent.midY - side / 2,
            width: side,
            height: side
        ).intersection(extent)
        guard !rect.isEmpty else { return image }
        return image
            .cropped(to: rect)
            .transformed(by: CGAffineTransform(translationX: -rect.origin.x,
                                               y: -rect.origin.y))
    }

    // MARK: - Border Temperature Estimation

    /// Samples the 4 border strips (10% margin), averages RGB, estimates CCT.
    /// Throws if no strip yields a usable sample (zero-extent image, all strips clamped out).
    private static func estimateBorderTemperature(from ciImage: CIImage) throws -> Double {
        let extent = ciImage.extent
        let w = extent.width
        let h = extent.height
        let margin = 0.1

        let strips: [CGRect] = [
            CGRect(x: 0,            y: 0,       width: w * margin, height: h),       // left
            CGRect(x: w * (1 - margin), y: 0,   width: w * margin, height: h),       // right
            CGRect(x: 0,            y: 0,       width: w,           height: h * margin), // top
            CGRect(x: 0,            y: h * (1 - margin), width: w, height: h * margin), // bottom
        ]

        var samples: [RGBSample] = []
        for rect in strips {
            if let avg = averageColor(of: ciImage, in: rect, context: sharedContext) {
                samples.append(avg)
            }
        }

        guard !samples.isEmpty else {
            throw NSError(domain: "WhiteBalance", code: 5,
                          userInfo: [NSLocalizedDescriptionKey: "Could not sample border pixels for auto white-balance estimation"])
        }

        // If all 4 border strips look nearly identical, the scene is likely a
        // monochrome / solid-colour subject. Auto-WB has no real signal to work
        // from, and "correcting" the perceived cast would actually shift the
        // subject's true colour toward neutral. Returning 6500 makes the filter
        // a no-op (input == target), preserving the original.
        if isLowVariance(samples) {
            return 6500
        }

        let count = Double(samples.count)
        let r = samples.reduce(0.0) { $0 + $1.r } / count
        let g = samples.reduce(0.0) { $0 + $1.g } / count
        let b = samples.reduce(0.0) { $0 + $1.b } / count

        return estimateCCT(r: r, g: g, b: b)
    }

    /// True when all border strips share nearly the same RGB (max per-channel
    /// range below 0.05 in [0,1] ≈ 13/255). Indicates a monochrome scene where
    /// auto white-balance would mis-correct.
    private static func isLowVariance(_ samples: [RGBSample]) -> Bool {
        guard samples.count >= 2 else { return true }
        let rs = samples.map { $0.r }
        let gs = samples.map { $0.g }
        let bs = samples.map { $0.b }
        let rRange = (rs.max() ?? 0) - (rs.min() ?? 0)
        let gRange = (gs.max() ?? 0) - (gs.min() ?? 0)
        let bRange = (bs.max() ?? 0) - (bs.min() ?? 0)
        let threshold: Double = 0.05
        return rRange < threshold && gRange < threshold && bRange < threshold
    }

    private struct RGBSample {
        let r, g, b: Double
    }

    /// Uses CIAreaAverage to compute the mean RGBA for a region.
    private static func averageColor(of image: CIImage, in rect: CGRect, context: CIContext) -> RGBSample? {
        guard rect.width > 0, rect.height > 0 else { return nil }
        let clampedRect = rect.intersection(image.extent)
        guard !clampedRect.isEmpty else { return nil }

        guard let filter = CIFilter(name: "CIAreaAverage",
                                    parameters: [kCIInputImageKey: image,
                                                 kCIInputExtentKey: CIVector(cgRect: clampedRect)]),
              let output = filter.outputImage else { return nil }

        // Read 1×1 RGBA pixel from the averaged output
        var pixel = [UInt8](repeating: 0, count: 4)
        context.render(output,
                       toBitmap: &pixel,
                       rowBytes: 4,
                       bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
                       format: .RGBA8,
                       colorSpace: CGColorSpace(name: CGColorSpace.sRGB))

        return RGBSample(r: Double(pixel[0]) / 255.0,
                         g: Double(pixel[1]) / 255.0,
                         b: Double(pixel[2]) / 255.0)
    }

    /// Simple empirical CCT estimation from linear RGB (0–1).
    /// Lower R/B ratio → cooler (higher K). Higher R/B ratio → warmer (lower K).
    private static func estimateCCT(r: Double, g: Double, b: Double) -> Double {
        let safeG = max(g, 0.001)
        let xRatio = r / safeG
        let yRatio = b / safeG

        // Simplified polynomial approximation (McCamy-inspired).
        // Coefficients tuned for daylight locus: maps bluish scene → high K,
        // yellowish → low K.
        let n = xRatio - yRatio * 0.5

        // n very close to zero would blow up `1/n`; both extremes (n slightly
        // positive → 7000K, n negative → 7000K) currently push the result to
        // the warm-output ceiling. That's wrong for a near-neutral scene —
        // default to neutral daylight instead.
        if abs(n) < 0.01 {
            return 5500
        }

        let t = n > 0
            ? 2700 + (1.0 / n) * 1800
            : 7000

        return max(2700, min(7000, t))
    }
}
