/**
 * Persistence errors raised by `saveCutoutAsWardrobeItem`. Widened from the
 * Story 13.3a `"paywall"`-only shape so the capture flow can distinguish
 * paywall (free-tier limit), encode failures (WebP re-encode threw),
 * file-move failures (permission / IO), disk-full conditions, and
 * repo-commit failures.
 */
export type WardrobePersistenceErrorKind =
	| "paywall"
	| "encode"
	| "move"
	| "repoAdd"
	| "diskFull";

export class WardrobePersistenceError extends Error {
	override name = "WardrobePersistenceError";

	constructor(
		public kind: WardrobePersistenceErrorKind,
		message?: string,
	) {
		super(message ?? kind);
		// Required for correct `instanceof` checks after TypeScript/Babel transpilation.
		Object.setPrototypeOf(this, WardrobePersistenceError.prototype);
	}
}
