import { requireNativeModule } from "expo-modules-core";

export type BackgroundRemovalErrorKind =
	| "noSubject"
	| "visionFailed"
	| "ioFailed";

export interface BackgroundRemovalError {
	kind: BackgroundRemovalErrorKind;
	message: string;
}

interface NativeBackgroundRemoval {
	removeBackground(inputUri: string): Promise<string>;
}

const BackgroundRemoval =
	requireNativeModule<NativeBackgroundRemoval>("BackgroundRemoval");

/**
 * Run iOS 17 Vision foreground-instance-mask segmentation on the image at `inputUri`.
 *
 * @param inputUri `file://` URI of the source JPEG/HEIC.
 * @returns A `file://` URI of a transparent-background PNG in the tmp directory.
 * @throws {BackgroundRemovalError} `noSubject` when no foreground was detected,
 *   `visionFailed` when Vision or the OS (<17) rejected the request,
 *   `ioFailed` when the source could not be loaded or the output could not be written.
 *
 * The caller is responsible for deleting the tmp file after consuming it
 * (Story 13.3a does this on Repetir / paywall).
 */
export async function removeBackground(inputUri: string): Promise<string> {
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
