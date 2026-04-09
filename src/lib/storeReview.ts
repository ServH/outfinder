import * as StoreReview from "expo-store-review";
import { Linking } from "react-native";

const APP_STORE_ID = "6761052821";
// itms-apps:// opens the App Store app directly (avoids Safari fallback)
export const APP_STORE_REVIEW_URL = `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`;

export async function requestInAppReview(): Promise<void> {
	try {
		const isAvailable = await StoreReview.isAvailableAsync();
		if (isAvailable) {
			await StoreReview.requestReview();
		}
	} catch {
		// Silently fail — review prompt is non-critical
	}
}

export function openAppStoreReview(): void {
	try {
		Linking.openURL(APP_STORE_REVIEW_URL).catch(() => {});
	} catch {
		// Silently fail
	}
}
