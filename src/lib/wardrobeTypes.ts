/**
 * Garment category taxonomy. Epic 14 (v1.4.0) makes `category` required on
 * every `WardrobeItem` so downstream filters (Story 14.5 camera save, Story
 * 14.12b edit affordance) can rely on type-level exhaustiveness without
 * `undefined` handling. No fifth `"unknown"` value per TD-7 — legacy
 * Epic-13 items hydrated without the field backfill to `"top"`.
 */
export type WardrobeCategory = "top" | "bottom" | "footwear" | "accessory";

/**
 * A single garment photo saved by the user. `localImagePath` and `thumbnailPath`
 * point to files written by the capture/persistence flow (Story 13.3b); this
 * story only stores the strings.
 */
export interface WardrobeItem {
	id: string;
	localImagePath: string;
	thumbnailPath: string;
	/**
	 * Garment category. Legacy Epic-13 items without this field backfill to
	 * "top" per TD-7 — users correct via Story 14.12b edit-category affordance.
	 */
	category: WardrobeCategory;
	createdAt: number;
}

/**
 * Links a wardrobe item to a specific (combinationId, colorIndex) slot in a
 * Wada combination. The pair `(combinationId, colorIndex)` is unique — calling
 * `assign` twice on the same slot overwrites the previous row.
 */
export interface CombinationAssignment {
	combinationId: string;
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
