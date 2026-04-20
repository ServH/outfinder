import type { SkCanvas, SkFont, SkImage } from "@shopify/react-native-skia";
import {
	drawPolaroidStack,
	POLAROID_OVERLAP_FRACTION,
	POLAROID_ROTATIONS,
	type PolaroidStackProps,
} from "./drawPolaroidStack";

type SpiedCanvas = {
	save: jest.Mock;
	restore: jest.Mock;
	rotate: jest.Mock;
	drawRect: jest.Mock;
	drawRRect: jest.Mock;
	clipRRect: jest.Mock;
	drawImageRect: jest.Mock;
	drawText: jest.Mock;
};

// Non-signature polaroid: 3 drawRRect calls in order (shadow, card, frame).
const BASE_RRECTS_PER_CARD = 3;

function createMockCanvas(): SpiedCanvas {
	return {
		save: jest.fn(),
		restore: jest.fn(),
		rotate: jest.fn(),
		drawRect: jest.fn(),
		drawRRect: jest.fn(),
		clipRRect: jest.fn(),
		drawImageRect: jest.fn(),
		drawText: jest.fn(),
	};
}

function createMockFont(size = 14): SkFont {
	return {
		getSize: () => size,
		measureText: () => ({ width: 60, height: size + 4 }),
	} as unknown as SkFont;
}

function createMockImage(w = 1024, h = 1024): SkImage {
	return {
		width: () => w,
		height: () => h,
	} as unknown as SkImage;
}

function makeProps(
	count = 3,
	overrides: Partial<PolaroidStackProps> = {},
): PolaroidStackProps {
	const base = ["Coral Pink", "Sky Blue", "Leaf Green", "Sunset Gold"];
	const colors = ["#FF8080", "#80D0FF", "#A8E4A0", "#FFC971"];
	return {
		garments: Array.from({ length: count }, (_, i) => ({
			imageFileUri: `file:///${i}.webp`,
			colorNameEn: base[i] ?? `Color ${i}`,
			colorHex: colors[i] ?? "#888888",
		})),
		signatureFont: createMockFont(),
		garmentImages: Array.from({ length: count }, () => createMockImage()),
		targetSize: { w: 1080, h: 1920 },
		...overrides,
	};
}

describe("drawPolaroidStack", () => {
	it("draws N polaroid cards (one rotate per card)", () => {
		for (const n of [2, 3, 4]) {
			const canvas = createMockCanvas();
			drawPolaroidStack(canvas as unknown as SkCanvas, makeProps(n));
			expect(canvas.rotate).toHaveBeenCalledTimes(n);
		}
	});

	it("applies rotations from POLAROID_ROTATIONS in order for the first 3 cards", () => {
		const canvas = createMockCanvas();
		drawPolaroidStack(canvas as unknown as SkCanvas, makeProps(3));
		const angles = canvas.rotate.mock.calls.map((args) => args[0]);
		expect(angles).toEqual(POLAROID_ROTATIONS.slice(0, 3));
	});

	it("cascade spacing between consecutive cards equals cardH * (1 - POLAROID_OVERLAP_FRACTION)", () => {
		const canvas = createMockCanvas();
		drawPolaroidStack(canvas as unknown as SkCanvas, makeProps(3));
		// Base drawRRect order per card: [0] shadow, [1] white card, [2] frame.
		// White cards at absolute indices 1, 4, 7 (signature rects come AFTER
		// all cards, when drawn on the last one).
		const whiteCards = [1, 4, 7].map(
			(idx) => canvas.drawRRect.mock.calls[idx][0],
		);
		const y0 = whiteCards[0].rect.y;
		const y1 = whiteCards[1].rect.y;
		const y2 = whiteCards[2].rect.y;
		const cardH = whiteCards[0].rect.height;
		const expectedSpacing = cardH * (1 - POLAROID_OVERLAP_FRACTION);
		expect(y1 - y0).toBeCloseTo(expectedSpacing);
		expect(y2 - y1).toBeCloseTo(expectedSpacing);
	});

	it("missing garment image slot renders no drawImageRect for that slot", () => {
		const canvas = createMockCanvas();
		const props = makeProps(3);
		props.garmentImages = [createMockImage(), null, createMockImage()];
		drawPolaroidStack(canvas as unknown as SkCanvas, props);
		expect(canvas.drawImageRect).toHaveBeenCalledTimes(2);
	});

	it("cascade always fits within targetSize for N=2..4", () => {
		for (const n of [2, 3, 4]) {
			const canvas = createMockCanvas();
			const props = makeProps(n);
			drawPolaroidStack(canvas as unknown as SkCanvas, props);
			const whiteCardRRects: Array<{
				rect: { x: number; y: number; width: number; height: number };
			}> = [];
			for (let i = 0; i < n; i++) {
				const callIdx = i * BASE_RRECTS_PER_CARD + 1;
				whiteCardRRects.push(canvas.drawRRect.mock.calls[callIdx][0]);
			}
			const topmost = whiteCardRRects[0].rect;
			const bottommost = whiteCardRRects[whiteCardRRects.length - 1].rect;
			expect(topmost.y).toBeGreaterThanOrEqual(0);
			expect(bottommost.y + bottommost.height).toBeLessThanOrEqual(
				props.targetSize.h + 1,
			);
			expect(topmost.x).toBeGreaterThanOrEqual(0);
			expect(topmost.x + topmost.width).toBeLessThanOrEqual(
				props.targetSize.w + 1,
			);
		}
	});

	it("signature (dots + 'Outfinder') is drawn ONLY on the last polaroid", () => {
		const canvas = createMockCanvas();
		drawPolaroidStack(canvas as unknown as SkCanvas, makeProps(3));
		// drawText is called exactly once (the "Outfinder" brand on last card).
		expect(canvas.drawText).toHaveBeenCalledTimes(1);
		expect(canvas.drawText.mock.calls[0][0]).toBe("Outfinder");
		// Signature emits N additional drawRRect calls (dots) AFTER the 3*N
		// base card rects, so total drawRRect = 3N + N.
		const N = 3;
		expect(canvas.drawRRect).toHaveBeenCalledTimes(
			BASE_RRECTS_PER_CARD * N + N,
		);
	});

	it("color-name labels are NOT drawn on any card (covered by cascade overlap)", () => {
		const canvas = createMockCanvas();
		drawPolaroidStack(canvas as unknown as SkCanvas, makeProps(3));
		const texts = canvas.drawText.mock.calls.map((args) => args[0] as string);
		expect(texts).not.toContain("Coral Pink");
		expect(texts).not.toContain("Sky Blue");
		expect(texts).not.toContain("Leaf Green");
	});

	it("is fully synchronous — no Promise return, no awaits", () => {
		const canvas = createMockCanvas();
		const result = drawPolaroidStack(
			canvas as unknown as SkCanvas,
			makeProps(3),
		);
		expect(result).toBeUndefined();
		expect(
			typeof (drawPolaroidStack as unknown as { then?: unknown }).then,
		).toBe("undefined");
	});
});
