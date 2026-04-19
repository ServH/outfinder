import { PREMIUM_CONFIG } from "@/config/premium";
import { getItems } from "@/lib/wardrobeRepo";
import { WardrobePersistenceError } from "./wardrobeErrors";

export interface SaveCutoutArgs {
	cutoutUri: string;
	sourceUri: string;
	isPremium: boolean;
}

export interface SaveCutoutResult {
	id: string;
}

/**
 * Pre-flight paywall check for the Armario capture flow (Story 13.3a stub).
 * Mirrors the gate inside `wardrobeRepo.addItem` so the Preview screen can
 * surface the paywall WITHOUT writing a stub row that Story 13.3b would need
 * to migrate. The real save (13.3b) will run the same check, then re-encode
 * to WebP, atomically move files, commit to the repo, and return the real id.
 *
 * Hydration-race note: on a cold launch `getItems()` may return `[]` before
 * AsyncStorage hydration finishes. In practice the user cannot reach the
 * Preview screen in that sub-millisecond window (app boot → settings dev
 * row → navigate → camera permission → photo → ~1 s Vision call). Story
 * 13.3b will gate the real save with `await hydrateWardrobeStore()`.
 */
export async function saveCutoutAsWardrobeItem(
	args: SaveCutoutArgs,
): Promise<SaveCutoutResult> {
	if (
		!args.isPremium &&
		getItems().length >= PREMIUM_CONFIG.FREE_WARDROBE_LIMIT
	) {
		throw new WardrobePersistenceError(
			"paywall",
			"Free-tier wardrobe limit reached",
		);
	}
	return { id: "__stub__" };
}
