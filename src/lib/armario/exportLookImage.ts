import {
	ImageFormat,
	type SkCanvas,
	type SkFont,
	type SkImage,
	Skia,
} from "@shopify/react-native-skia";
import { Directory, File, Paths } from "expo-file-system";
import { uuidv4 } from "@/lib/uuid";
import type { PolaroidGarment } from "./drawPolaroidStack";
import { drawPolaroidStack } from "./drawPolaroidStack";

const EXPORT_W = 1080;
const EXPORT_H = 1920;
const JPEG_QUALITY = 92;
const SHARE_SUBDIR = "share";

// Chrome layout (absolute pixels at 1080×1920 canvas — brand signature, not scaled)
const BG_HEX = "#fafaf8";
const HEADER_TOP = 160;
const HEADER_PREFIX_FONT_SIZE = 32;
const HEADER_PREFIX_COLOR = "#8d8d8d";
const HEADER_PREFIX_LETTER_SPACING = 4;
const HEADER_COMBO_FONT_SIZE = 76;
const HEADER_COMBO_COLOR = "#1a1a1a";
const HEADER_COMBO_MARGIN_TOP = 14;
const HEADER_TOTAL_HEIGHT = 220;

// Bottom margin on the cascade — the last polaroid already carries the
// brand signature (Wada dots + "Outfinder") in its white band, so we just
// need a small breathing area below the last card.
const CASCADE_BOTTOM_MARGIN = 120;

/**
 * Typed error kinds thrown by `exportLookImage`. The screen's catch block
 * treats them uniformly (friendly alert); the union exists so future
 * targeted recovery (e.g. retry-on-encode-failure) can pattern-match without
 * string parsing. Mirrors `WardrobePersistenceError` in `wardrobeErrors.ts`.
 */
export type ExportLookErrorKind =
	| "surfaceCreate"
	| "snapshot"
	| "encode"
	| "fileWrite";

export class ExportLookError extends Error {
	override name = "ExportLookError";

	constructor(
		public kind: ExportLookErrorKind,
		public override cause?: unknown,
	) {
		super(kind);
		Object.setPrototypeOf(this, ExportLookError.prototype);
	}
}

export interface ExportLookResult {
	uri: string;
}

export interface ExportLookProps {
	garments: PolaroidGarment[];
	garmentImages: Array<SkImage | null>;
	combinationNameEn: string;
	headerPrefix: string; // e.g. "WADA PALETTE ·"
	/** Sans serif font used for the header prefix + the brand signature on the last polaroid. */
	sansFont: SkFont;
	/** Large serif font for the combo title (top of the export). */
	serifTitleFont: SkFont;
}

function drawLetterSpacedCentered(
	canvas: SkCanvas,
	text: string,
	centerX: number,
	baselineY: number,
	font: SkFont,
	paint: ReturnType<typeof Skia.Paint>,
	letterSpacing: number,
): void {
	if (letterSpacing === 0) {
		const measure = font.measureText(text);
		const w = measure?.width || 0;
		canvas.drawText(text, centerX - w / 2, baselineY, paint, font);
		return;
	}
	let totalW = 0;
	const widths: number[] = [];
	for (const ch of text) {
		const m = font.measureText(ch);
		const w = m?.width || 0;
		widths.push(w);
		totalW += w;
	}
	totalW += letterSpacing * Math.max(0, text.length - 1);
	let x = centerX - totalW / 2;
	let idx = 0;
	for (const ch of text) {
		canvas.drawText(ch, x, baselineY, paint, font);
		x += widths[idx] + letterSpacing;
		idx++;
	}
}

function drawChrome(
	canvas: SkCanvas,
	props: ExportLookProps,
	size: { w: number; h: number },
): void {
	const { w, h } = size;

	// Background paper — prevents JPEG from rendering transparent pixels as black.
	const bgPaint = Skia.Paint();
	bgPaint.setColor(Skia.Color(BG_HEX));
	canvas.drawRect(Skia.XYWHRect(0, 0, w, h), bgPaint);

	const centerX = w / 2;

	// Header: small uppercase prefix "WADA PALETTE ·"
	const prefixPaint = Skia.Paint();
	prefixPaint.setColor(Skia.Color(HEADER_PREFIX_COLOR));
	prefixPaint.setAntiAlias(true);
	const prefixBaseline = HEADER_TOP + HEADER_PREFIX_FONT_SIZE;
	drawLetterSpacedCentered(
		canvas,
		props.headerPrefix.toUpperCase(),
		centerX,
		prefixBaseline,
		props.sansFont,
		prefixPaint,
		HEADER_PREFIX_LETTER_SPACING,
	);

	// Combo name serif below
	const comboPaint = Skia.Paint();
	comboPaint.setColor(Skia.Color(HEADER_COMBO_COLOR));
	comboPaint.setAntiAlias(true);
	const comboBaseline =
		prefixBaseline + HEADER_COMBO_MARGIN_TOP + HEADER_COMBO_FONT_SIZE;
	drawLetterSpacedCentered(
		canvas,
		props.combinationNameEn,
		centerX,
		comboBaseline,
		props.serifTitleFont,
		comboPaint,
		0,
	);
}

/**
 * Renders the full Tu Look composition (paper background + header + polaroid
 * cascade with embedded brand signature on the last card) to a 1080×1920
 * offscreen Skia surface, encodes it as JPEG q=92, and writes it under
 * `Paths.document + /share/`. Returns the file URI for the caller to share
 * and then delete.
 *
 * Pixel density is pinned to 1 (target dims are absolute, not device-scaled)
 * so output is deterministic across iPhones (NFR14).
 */
export async function exportLookImage(
	props: ExportLookProps,
): Promise<ExportLookResult> {
	try {
		new Directory(Paths.document, SHARE_SUBDIR).create({
			intermediates: true,
			idempotent: true,
		});
	} catch (e) {
		throw new ExportLookError("fileWrite", e);
	}

	const surface = Skia.Surface.MakeOffscreen(EXPORT_W, EXPORT_H);
	if (!surface) {
		throw new ExportLookError("surfaceCreate");
	}

	const canvas = surface.getCanvas();

	drawChrome(canvas, props, { w: EXPORT_W, h: EXPORT_H });

	// Cascade fills the vertical band between the header and a small
	// bottom margin — brand signature lives INSIDE the last polaroid.
	const cascadeTop = HEADER_TOP + HEADER_TOTAL_HEIGHT;
	const cascadeBottomPadding = CASCADE_BOTTOM_MARGIN;
	drawPolaroidStack(canvas, {
		garments: props.garments,
		signatureFont: props.sansFont,
		garmentImages: props.garmentImages,
		targetSize: { w: EXPORT_W, h: EXPORT_H },
		padding: {
			top: cascadeTop,
			right: 0,
			bottom: cascadeBottomPadding,
			left: 0,
		},
	});

	// No `await` between flush() and makeImageSnapshot() — Skia produces
	// partial/black snapshots on iOS when the JS thread yields here.
	surface.flush();
	const snapshot = surface.makeImageSnapshot();
	if (!snapshot) {
		throw new ExportLookError("snapshot");
	}
	// REQUIRED — skipping this produces black exports (Skia #1513). Do not
	// remove. The raw snapshot is a GPU texture; Metal silently fails to
	// encode it in some contexts. makeNonTextureImage copies pixels to CPU.
	const nonTexture = snapshot.makeNonTextureImage();
	if (!nonTexture) {
		throw new ExportLookError("snapshot");
	}

	let base64: string;
	try {
		base64 = nonTexture.encodeToBase64(ImageFormat.JPEG, JPEG_QUALITY);
	} catch (e) {
		throw new ExportLookError("encode", e);
	}
	if (!base64) {
		throw new ExportLookError("encode");
	}

	const file = new File(Paths.document, SHARE_SUBDIR, `look-${uuidv4()}.jpg`);
	try {
		file.write(base64, { encoding: "base64" });
	} catch (e) {
		throw new ExportLookError("fileWrite", e);
	}

	return { uri: file.uri };
}
