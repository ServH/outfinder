import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";

export async function captureShareImage(
	viewRef: React.RefObject<View>,
): Promise<string | null> {
	try {
		const uri = await captureRef(viewRef, {
			format: "png",
			quality: 1,
			width: 1080,
			height: 1920,
		});
		return uri;
	} catch {
		return null;
	}
}
