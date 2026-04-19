/**
 * A single garment photo saved by the user. `localImagePath` and `thumbnailPath`
 * point to files written by the capture/persistence flow (Story 13.3b); this
 * story only stores the strings.
 */
export interface WardrobeItem {
	id: string;
	localImagePath: string;
	thumbnailPath: string;
	createdAt: number;
}

/**
 * Links a wardrobe item to a specific (combinationId, colorIndex) slot in a
 * Wada combination. The pair `(combinationId, colorIndex)` is unique — calling
 * `assign` twice on the same slot overwrites the previous row.
 */
export interface CombinationAssignment {
	combinationId: number;
	colorIndex: number;
	wardrobeItemId: string;
	assignedAt: number;
}

/** Caller-supplied fields for `addItem`; `id` and `createdAt` are repo-generated. */
export type WardrobeItemInput = Omit<WardrobeItem, "id" | "createdAt">;

/**
 * Thrown by `wardrobeRepo.addItem` when a free-tier user is at or above
 * `FREE_WARDROBE_LIMIT`. Catch this in the capture flow (Story 13.3b) and
 * surface the existing `FREE_FAVORITES_LIMIT` paywall.
 */
export class WardrobeLimitExceeded extends Error {
	override name = "WardrobeLimitExceeded";

	constructor(message = "Wardrobe limit reached for free tier") {
		super(message);
	}
}
