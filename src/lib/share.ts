import * as Sharing from "expo-sharing";
import type { View } from "react-native";
import { PixelRatio } from "react-native";
import { captureRef } from "react-native-view-shot";

export async function captureShareImage(
	viewRef: React.RefObject<View | null>,
): Promise<string | null> {
	try {
		const uri = await captureRef(viewRef, {
			format: "png",
			quality: 1,
			pixelRatio: PixelRatio.get(),
		} as Parameters<typeof captureRef>[1]);
		return uri;
	} catch {
		return null;
	}
}

export async function shareOutfit(
	viewRef: React.RefObject<View | null>,
): Promise<boolean> {
	try {
		const available = await Sharing.isAvailableAsync();
		if (!available) return false;

		const uri = await captureShareImage(viewRef);
		if (!uri) return false;

		await Sharing.shareAsync(uri, {
			mimeType: "image/png",
			UTI: "public.png",
		});
		return true;
	} catch {
		return false;
	}
}
