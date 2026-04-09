import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { requestInAppReview } from "@/lib/storeReview";

const STORAGE_KEY = "@outfinder/visualizer-visit-count";
const PROMPT_THRESHOLD = 2;

/**
 * Counts Visualizer visits and triggers the in-app review sheet on the 2nd visit.
 * Must be called unconditionally (before any early returns) in the Visualizer component.
 */
export function useStoreReviewPrompt(): void {
	useEffect(() => {
		let cancelled = false;

		async function checkAndPrompt(): Promise<void> {
			try {
				const stored = await AsyncStorage.getItem(STORAGE_KEY);
				const count = stored ? parseInt(stored, 10) : 0;
				const next = count + 1;

				await AsyncStorage.setItem(STORAGE_KEY, String(next));

				if (!cancelled && next === PROMPT_THRESHOLD) {
					await requestInAppReview();
				}
			} catch {
				// Silently fail — review prompt is non-critical
			}
		}

		checkAndPrompt();

		return () => {
			cancelled = true;
		};
	}, []);
}
