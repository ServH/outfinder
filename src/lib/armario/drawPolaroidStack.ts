import {
	BlurStyle,
	ClipOp,
	type SkCanvas,
	type SkFont,
	type SkImage,
	Skia,
} from "@shopify/react-native-skia";

/**
 * Fraction of a polaroid card that is overlapped by the next card in the
 * cascade (along the vertical axis). The TOP of card `i+1` lands `cardH *
 * (1 - OVERLAP_FRACTION)` below the TOP of card `i` — i.e. the overlap
 * covers the upper portion of card `i`, leaving the BOTTOM label band
 * visible. Expressed as a fraction so the cascade reads the same at any
 * card size.
 */
export const POLAROID_OVERLAP_FRACTION = 0.34;

/**
 * Degrees of rotation applied to each polaroid card in top-down order.
 * Cards beyond the array length cycle (for future N>3 combos). The outer
 * cards tilt outward; the middle card stays upright — classic scrapbook
 * cascade.
 */
export const POLAROID_ROTATIONS: readonly number[] = [2.4, -1.4, 1.6, -2.2];

/**
 * The bottom section of each card is a white "label band". Only the LAST
 * polaroid's band is populated (with the Wada dots + Outfinder brand) —
 * every other card's band is hidden under the next card's overlap, so
 * drawing anything there would be wasted and visually noisy.
 */
const LABEL_BAND_FRACTION = 0.22;

/**
 * Card aspect ratio (height / width). Polaroid-ish: slightly taller than
 * wide, to give room for both the image frame and the label band.
 */
const CARD_ASPECT_RATIO = 1.18;

const REFERENCE_WIDTH = 1080;
const REFERENCE_CARD_WIDTH = 840;

/**
 * Safety margin applied to computed card size so the ±2.4° rotation of
 * the outer cards cannot clip the cascade bounds.
 */
const ROTATION_SAFETY = 0.93;

const IMAGE_INSET_FRACTION = 0.05;
const CORNER_RADIUS_FRACTION = 0.018;
const SHADOW_OFFSET_Y_FRACTION = 0.014;
const SHADOW_BLUR_FRACTION = 0.035;

// Signature (dots + brand) metrics, expressed as fractions of cardH so
// they scale with the polaroid at any canvas size.
const SIG_DOT_RADIUS_FRACTION = 0.018;
const SIG_DOT_GAP_FRACTION = 0.015;
const SIG_BRAND_GAP_FRACTION = 0.026;
const SIG_BRAND_ALPHA = 0.7;
const SIG_BRAND_TEXT = "Outfinder";

export interface PolaroidGarment {
	imageFileUri: string;
	colorNameEn: string;
	colorHex: string;
}

export interface PolaroidStackProps {
	garments: PolaroidGarment[];
	/** Font used for the brand signature text on the last polaroid. */
	signatureFont: SkFont;
	garmentImages: Array<SkImage | null>;
	targetSize: { w: number; h: number };
	/**
	 * Optional padding around the cascade. Defaults to 0 — caller already
	 * reserves chrome space (titles, CTAs, etc.) outside targetSize.
	 */
	padding?: { top: number; right: number; bottom: number; left: number };
}

interface PolaroidCardParams {
	x: number;
	y: number;
	w: number;
	h: number;
	rotation: number;
	image: SkImage | null;
	cornerR: number;
	shadowOffsetY: number;
	shadowBlur: number;
	imageInset: number;
	labelBandH: number;
	signature: {
		colorHexes: string[];
		font: SkFont;
	} | null;
}

function drawSignatureInBand(
	canvas: SkCanvas,
	params: {
		bandX: number;
		bandY: number;
		bandW: number;
		bandH: number;
		colorHexes: string[];
		font: SkFont;
		cardH: number;
	},
): void {
	const { bandX, bandY, bandW, bandH, colorHexes, font, cardH } = params;

	const dotRadius = cardH * SIG_DOT_RADIUS_FRACTION;
	const dotGap = cardH * SIG_DOT_GAP_FRACTION;
	const brandGap = cardH * SIG_BRAND_GAP_FRACTION;
	const fontSize = font.getSize();

	const dotsRowH = dotRadius * 2;
	const totalDotsW =
		colorHexes.length * dotRadius * 2 +
		Math.max(0, colorHexes.length - 1) * dotGap;
	const signatureH = dotsRowH + brandGap + fontSize;

	const centerX = bandX + bandW / 2;
	const signatureTop = bandY + (bandH - signatureH) / 2;

	// Dots row
	const dotsCenterY = signatureTop + dotRadius;
	let dotX = centerX - totalDotsW / 2 + dotRadius;
	for (const hex of colorHexes) {
		const paint = Skia.Paint();
		paint.setColor(Skia.Color(hex));
		paint.setAntiAlias(true);
		const rect = Skia.XYWHRect(
			dotX - dotRadius,
			dotsCenterY - dotRadius,
			dotRadius * 2,
			dotRadius * 2,
		);
		canvas.drawRRect(Skia.RRectXY(rect, dotRadius, dotRadius), paint);
		dotX += dotRadius * 2 + dotGap;
	}

	// Brand text below dots
	const measure = font.measureText(SIG_BRAND_TEXT);
	const brandW = measure?.width || 0;
	const brandBaseline = signatureTop + dotsRowH + brandGap + fontSize * 0.82;
	const brandPaint = Skia.Paint();
	brandPaint.setColor(Skia.Color("#1a1a1a"));
	brandPaint.setAlphaf(SIG_BRAND_ALPHA);
	brandPaint.setAntiAlias(true);
	canvas.drawText(
		SIG_BRAND_TEXT,
		centerX - brandW / 2,
		brandBaseline,
		brandPaint,
		font,
	);
}

function drawPolaroidCard(canvas: SkCanvas, params: PolaroidCardParams) {
	const {
		x,
		y,
		w,
		h,
		rotation,
		image,
		cornerR,
		shadowOffsetY,
		shadowBlur,
		imageInset,
		labelBandH,
		signature,
	} = params;

	const centerX = x + w / 2;
	const centerY = y + h / 2;

	canvas.save();
	canvas.rotate(rotation, centerX, centerY);

	// Drop shadow
	const shadowPaint = Skia.Paint();
	shadowPaint.setColor(Skia.Color("rgba(0,0,0,0.22)"));
	shadowPaint.setMaskFilter(
		Skia.MaskFilter.MakeBlur(BlurStyle.Normal, shadowBlur, true),
	);
	const shadowRect = Skia.XYWHRect(x, y + shadowOffsetY, w, h);
	canvas.drawRRect(Skia.RRectXY(shadowRect, cornerR, cornerR), shadowPaint);

	// White polaroid card
	const cardPaint = Skia.Paint();
	cardPaint.setColor(Skia.Color("#FFFFFF"));
	cardPaint.setAntiAlias(true);
	const cardRect = Skia.XYWHRect(x, y, w, h);
	canvas.drawRRect(Skia.RRectXY(cardRect, cornerR, cornerR), cardPaint);

	// Image frame (top section above the label band) — soft paper behind so
	// `contain` fit on portrait garments doesn't show harsh seams.
	const frameX = x + imageInset;
	const frameY = y + imageInset;
	const frameW = w - imageInset * 2;
	const frameH = h - imageInset - labelBandH;

	const framePaint = Skia.Paint();
	framePaint.setColor(Skia.Color("#f4f1ec"));
	framePaint.setAntiAlias(true);
	const frameRect = Skia.XYWHRect(frameX, frameY, frameW, frameH);
	canvas.drawRRect(Skia.RRectXY(frameRect, cornerR, cornerR), framePaint);

	if (image) {
		canvas.save();
		canvas.clipRRect(
			Skia.RRectXY(frameRect, cornerR, cornerR),
			ClipOp.Intersect,
			true,
		);

		const imgW = image.width();
		const imgH = image.height();
		const imgAspect = imgW / imgH;
		const frameAspect = frameW / frameH;

		let dstW = frameW;
		let dstH = frameH;
		if (imgAspect > frameAspect) {
			dstH = frameW / imgAspect;
		} else {
			dstW = frameH * imgAspect;
		}
		const dstX = frameX + (frameW - dstW) / 2;
		const dstY = frameY + (frameH - dstH) / 2;

		const srcRect = Skia.XYWHRect(0, 0, imgW, imgH);
		const dstRect = Skia.XYWHRect(dstX, dstY, dstW, dstH);
		const imgPaint = Skia.Paint();
		imgPaint.setAntiAlias(true);
		canvas.drawImageRect(image, srcRect, dstRect, imgPaint);
		canvas.restore();
	}

	// Signature (Wada dots + "Outfinder") only on the last polaroid — the
	// rest have their bottom band hidden under the next card's overlap.
	if (signature) {
		drawSignatureInBand(canvas, {
			bandX: x,
			bandY: y + h - labelBandH,
			bandW: w,
			bandH: labelBandH,
			colorHexes: signature.colorHexes,
			font: signature.font,
			cardH: h,
		});
	}

	canvas.restore();
}

/**
 * Imperatively draws a cascade of polaroid cards onto `canvas`. Pure and
 * synchronous. Card count is dynamic (2, 3, 4, …) — layout adapts so every
 * card fits within `targetSize` with room for the label band and a small
 * rotation safety margin.
 *
 * The last polaroid carries the brand signature (Wada dots + "Outfinder")
 * in its bottom white band; every other polaroid's band is covered by the
 * next card's overlap, so it stays blank. Color names are intentionally
 * NOT rendered — they'd be invisible under the cascade anyway.
 *
 * Caller is expected to reserve space for any chrome (titles, CTAs) OUTSIDE
 * targetSize. The function fills targetSize with the cascade; it does not
 * paint a background.
 */
export function drawPolaroidStack(
	canvas: SkCanvas,
	props: PolaroidStackProps,
): void {
	const { garments, signatureFont, garmentImages, targetSize } = props;
	const padTop = props.padding?.top ?? 0;
	const padRight = props.padding?.right ?? 0;
	const padBottom = props.padding?.bottom ?? 0;
	const padLeft = props.padding?.left ?? 0;

	const N = garments.length;
	if (N === 0) return;

	const availableW = targetSize.w - padLeft - padRight;
	const availableH = targetSize.h - padTop - padBottom;

	const heightMultiplier = 1 + (1 - POLAROID_OVERLAP_FRACTION) * (N - 1);

	const scale = targetSize.w / REFERENCE_WIDTH;
	const idealCardW = REFERENCE_CARD_WIDTH * scale;
	const idealCardH = idealCardW * CARD_ASPECT_RATIO;
	const idealTotalH = idealCardH * heightMultiplier;

	let cardH: number;
	let cardW: number;
	if (idealTotalH > availableH * ROTATION_SAFETY) {
		cardH = (availableH * ROTATION_SAFETY) / heightMultiplier;
		cardW = cardH / CARD_ASPECT_RATIO;
	} else {
		cardH = idealCardH;
		cardW = idealCardW;
	}
	if (cardW > availableW * ROTATION_SAFETY) {
		cardW = availableW * ROTATION_SAFETY;
		cardH = cardW * CARD_ASPECT_RATIO;
	}

	const overlap = cardH * POLAROID_OVERLAP_FRACTION;
	const spacingY = cardH - overlap;
	const totalH = cardH + spacingY * (N - 1);

	const startX = padLeft + (availableW - cardW) / 2;
	const startY = padTop + (availableH - totalH) / 2;

	const cornerR = cardH * CORNER_RADIUS_FRACTION;
	const shadowOffsetY = cardH * SHADOW_OFFSET_Y_FRACTION;
	const shadowBlur = cardH * SHADOW_BLUR_FRACTION;
	const imageInset = cardH * IMAGE_INSET_FRACTION;
	const labelBandH = cardH * LABEL_BAND_FRACTION;

	const colorHexes = garments.map((g) => g.colorHex);

	for (let i = 0; i < N; i++) {
		const isLast = i === N - 1;
		drawPolaroidCard(canvas, {
			x: startX,
			y: startY + i * spacingY,
			w: cardW,
			h: cardH,
			rotation: POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length] ?? 0,
			image: garmentImages[i] ?? null,
			cornerR,
			shadowOffsetY,
			shadowBlur,
			imageInset,
			labelBandH,
			signature: isLast ? { colorHexes, font: signatureFont } : null,
		});
	}
}
