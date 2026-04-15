import { requireNativeModule } from "expo-modules-core";

/**
 * Sentinel value passed as `temperature` to request automatic
 * white-balance estimation from border-pixel sampling. Any negative
 * number is interpreted as auto by the native module.
 */
export const WB_AUTO_MODE = -1;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WhiteBalance: { applyWhiteBalance(imageUri: string, temperature: number): Promise<string> } =
	requireNativeModule("WhiteBalance");

/**
 * Apply white-balance correction to a JPEG.
 * @param imageUri  `file://` URI of the source JPEG.
 * @param temperature  Kelvin in [2700, 7000] for manual mode, or `WB_AUTO_MODE` (any negative) for auto.
 * @throws if the source image cannot be loaded, the filter fails, or auto-mode border sampling fails.
 */
export async function applyWhiteBalance(
	imageUri: string,
	temperature: number,
): Promise<string> {
	return WhiteBalance.applyWhiteBalance(imageUri, temperature);
}
