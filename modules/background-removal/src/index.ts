import { requireNativeModule } from "expo-modules-core";

export type BackgroundRemovalErrorKind =
	| "noSubject"
	| "visionFailed"
	| "ioFailed";

export interface BackgroundRemovalError {
	kind: BackgroundRemovalErrorKind;
	message: string;
}

export interface BackgroundRemovalResult {
	/** `file://` URI of the transparent-background PNG written to tmp. */
	cutoutUri: string;
	/**
	 * Uppercase `#RRGGBB` hex of the weighted RGB average across pixels whose
	 * alpha exceeds `0.5` (on the [0,1] scale) in the full-resolution mask
	 * buffer. Computed in the same Vision pass that produced the cutout, so
	 * the sample is never polluted by transparent padding. See Finding 1 in
	 * `docs/planning/epic-14/epic-14-tech-review.md#finding-1` for the transparency-
	 * trap problem this fixes (TD-1 of Epic 14).
	 */
	dominantHex: string;
}

interface NativeBackgroundRemoval {
	removeBackground(inputUri: string): Promise<BackgroundRemovalResult>;
}

const BackgroundRemoval =
	requireNativeModule<NativeBackgroundRemoval>("BackgroundRemoval");

/**
 * Run iOS 17 Vision foreground-instance-mask segmentation on the image at
 * `inputUri` and, in the same Vision pass, sample the garment's weighted
 * dominant RGB average (alpha > 0.5 gate, de-premultiplied, full resolution).
 *
 * @param inputUri `file://` URI of the source JPEG/HEIC.
 * @returns Object with `cutoutUri` (PNG path) and `dominantHex` (`#RRGGBB`).
 *   The dominant hex is safe to feed directly into `hexToLab` → `matchWadaColor`
 *   without additional color extraction — calling `react-native-image-colors`
 *   on the cutout would re-introduce the transparency trap this API eliminates.
 * @throws {BackgroundRemovalError} `noSubject` when no foreground was detected
 *   (or the cutout contained no opaque pixels — this is how the Swift layer
 *   surfaces degenerate all-transparent outputs),
 *   `visionFailed` when Vision or the OS (<17) rejected the request,
 *   `ioFailed` when the source could not be loaded or the output could not be written.
 *
 * The caller is responsible for deleting the tmp cutout file after consuming
 * it (Story 13.3a does this on Repetir / paywall).
 */
export async function removeBackground(
	inputUri: string,
): Promise<BackgroundRemovalResult> {
	try {
		return await BackgroundRemoval.removeBackground(inputUri);
	} catch (e) {
		throw toBackgroundRemovalError(e);
	}
}

function toBackgroundRemovalError(e: unknown): BackgroundRemovalError {
	// expo-modules rejects Promises with an Error whose `code` property carries the
	// structured kind from Swift's NSError userInfo. Fall back to visionFailed for
	// unrecognized shapes so the UI can show a generic retry message.
	const anyE = e as { code?: unknown; message?: unknown };
	const code = typeof anyE?.code === "string" ? anyE.code : "";
	const message =
		typeof anyE?.message === "string"
			? anyE.message
			: "Background removal failed";
	if (code === "noSubject" || code === "visionFailed" || code === "ioFailed") {
		return { kind: code, message };
	}
	return { kind: "visionFailed", message };
}
