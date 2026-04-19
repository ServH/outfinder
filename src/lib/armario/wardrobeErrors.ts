/**
 * Persistence errors raised by `saveCutoutAsWardrobeItem`. Story 13.3a only
 * defines `"paywall"`; Story 13.3b will widen the `kind` union with
 * `"encode" | "move" | "repoAdd" | "diskFull"`. Widening (not narrowing) keeps
 * this story's catch blocks type-safe when 13.3b lands.
 */
export class WardrobePersistenceError extends Error {
	override name = "WardrobePersistenceError";

	constructor(
		public kind: "paywall",
		message?: string,
	) {
		super(message ?? kind);
	}
}
