import { requireNativeModule } from "expo-modules-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WhiteBalance: { applyWhiteBalance(imageUri: string, temperature: number): Promise<string> } =
	requireNativeModule("WhiteBalance");

export async function applyWhiteBalance(
	imageUri: string,
	temperature: number,
): Promise<string> {
	return WhiteBalance.applyWhiteBalance(imageUri, temperature);
}
