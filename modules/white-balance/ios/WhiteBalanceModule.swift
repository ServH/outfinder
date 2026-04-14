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

    // MARK: - Core Processing

    private static func process(imageUri: String, temperature: Double) throws -> String {
        // Strip "file://" prefix for FileManager access
        let filePath = imageUri.hasPrefix("file://")
            ? String(imageUri.dropFirst(7))
            : imageUri

        guard let ciImage = CIImage(contentsOf: URL(fileURLWithPath: filePath)) else {
            throw NSError(domain: "WhiteBalance", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Failed to load image at \(imageUri)"])
        }

        // Determine scene illuminant temperature
        let sceneTemp: Double
        if temperature == 0.0 {
            sceneTemp = estimateBorderTemperature(from: ciImage)
        } else {
            sceneTemp = temperature
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

        // Render corrected image to JPEG in temp directory
        let context = CIContext(options: [.useSoftwareRenderer: false])
        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension("jpg")

        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
            throw NSError(domain: "WhiteBalance", code: 4,
                          userInfo: [NSLocalizedDescriptionKey: "Could not create sRGB color space"])
        }
        try context.writeJPEGRepresentation(of: outputImage, to: outputURL,
                                            colorSpace: colorSpace, options: [:])

        return outputURL.absoluteString
    }

    // MARK: - Border Temperature Estimation

    /// Samples the 4 border strips (10% margin), averages RGB, estimates CCT.
    private static func estimateBorderTemperature(from ciImage: CIImage) -> Double {
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

        var totalR: Double = 0
        var totalG: Double = 0
        var totalB: Double = 0
        var count = 0

        let context = CIContext(options: nil)

        for rect in strips {
            guard let avgColor = averageColor(of: ciImage, in: rect, context: context) else { continue }
            totalR += avgColor.r
            totalG += avgColor.g
            totalB += avgColor.b
            count += 1
        }

        guard count > 0 else { return 5500 }

        let r = totalR / Double(count)
        let g = totalG / Double(count)
        let b = totalB / Double(count)

        return estimateCCT(r: r, g: g, b: b)
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

        // Simplified polynomial approximation (McCamy-inspired)
        // Coefficients tuned for daylight locus: maps bluish scene → high K, yellowish → low K
        let n = xRatio - yRatio * 0.5
        let t = n > 0
            ? 2700 + (1.0 / n) * 1800
            : 7000

        return max(2700, min(7000, t))
    }
}
