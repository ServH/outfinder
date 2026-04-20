import type { SkFont, SkImage } from "@shopify/react-native-skia";
import type { PolaroidGarment } from "./drawPolaroidStack";
import {
	ExportLookError,
	type ExportLookProps,
	exportLookImage,
} from "./exportLookImage";

jest.mock("@/lib/uuid", () => ({
	uuidv4: () => "fixed-uuid",
}));

jest.mock("@shopify/react-native-skia", () => {
	const mockEncode = jest.fn(() => "ZmFrZS1qcGVn");
	const mockMakeNonTextureImage = jest.fn(() => ({
		encodeToBase64: mockEncode,
	}));
	const mockMakeImageSnapshot = jest.fn(() => ({
		makeNonTextureImage: mockMakeNonTextureImage,
	}));
	const mockFlush = jest.fn();
	const mockCanvas = {
		save: jest.fn(),
		restore: jest.fn(),
		rotate: jest.fn(),
		drawRect: jest.fn(),
		drawRRect: jest.fn(),
		clipRRect: jest.fn(),
		drawImageRect: jest.fn(),
		drawText: jest.fn(),
	};
	const mockSurface = {
		getCanvas: jest.fn(() => mockCanvas),
		flush: mockFlush,
		makeImageSnapshot: mockMakeImageSnapshot,
	};
	const mockMakeOffscreen = jest.fn(() => mockSurface);

	return {
		ImageFormat: { JPEG: 3, PNG: 4 },
		BlurStyle: { Normal: 0 },
		ClipOp: { Intersect: 1 },
		Skia: {
			Paint: jest.fn(() => ({
				setColor: jest.fn(),
				setAlphaf: jest.fn(),
				setAntiAlias: jest.fn(),
				setMaskFilter: jest.fn(),
			})),
			Color: jest.fn((c) => c),
			XYWHRect: jest.fn((x, y, width, height) => ({ x, y, width, height })),
			RRectXY: jest.fn((rect, rx, ry) => ({ rect, rx, ry })),
			MaskFilter: { MakeBlur: jest.fn(() => ({})) },
			Surface: { MakeOffscreen: mockMakeOffscreen },
		},
		__mockEncode: mockEncode,
		__mockMakeNonTextureImage: mockMakeNonTextureImage,
		__mockMakeImageSnapshot: mockMakeImageSnapshot,
		__mockFlush: mockFlush,
		__mockMakeOffscreen: mockMakeOffscreen,
		__mockSurface: mockSurface,
		__mockCanvas: mockCanvas,
	};
});

jest.mock("expo-file-system", () => {
	const directoryCreateSpy = jest.fn();
	const fileWriteSpy = jest.fn();
	class MockDirectory {
		uri: string;
		constructor(...segments: Array<{ uri?: string } | string>) {
			this.uri = segments
				.map((s) => (typeof s === "string" ? s : (s.uri ?? "")))
				.filter(Boolean)
				.join("/");
		}
		create(options?: { intermediates?: boolean; idempotent?: boolean }) {
			directoryCreateSpy(this.uri, options);
		}
	}
	class MockFile {
		uri: string;
		constructor(...segments: Array<{ uri?: string } | string>) {
			this.uri = segments
				.map((s) => (typeof s === "string" ? s : (s.uri ?? "")))
				.filter(Boolean)
				.join("/");
		}
		write(content: string, options?: { encoding?: string }) {
			fileWriteSpy(this.uri, content, options);
		}
	}
	return {
		File: MockFile,
		Directory: MockDirectory,
		Paths: {
			cache: { uri: "file:///cache" },
			document: { uri: "file:///doc" },
		},
		__directoryCreateSpy: directoryCreateSpy,
		__fileWriteSpy: fileWriteSpy,
	};
});

const skiaMocks = jest.requireMock("@shopify/react-native-skia") as {
	__mockEncode: jest.Mock;
	__mockMakeNonTextureImage: jest.Mock;
	__mockMakeImageSnapshot: jest.Mock;
	__mockFlush: jest.Mock;
	__mockMakeOffscreen: jest.Mock;
	__mockSurface: {
		getCanvas: jest.Mock;
		flush: jest.Mock;
		makeImageSnapshot: jest.Mock;
	};
	__mockCanvas: {
		drawRect: jest.Mock;
		drawRRect: jest.Mock;
		drawText: jest.Mock;
		drawImageRect: jest.Mock;
		save: jest.Mock;
		restore: jest.Mock;
		rotate: jest.Mock;
		clipRRect: jest.Mock;
	};
};

const fsMocks = jest.requireMock("expo-file-system") as {
	__directoryCreateSpy: jest.Mock;
	__fileWriteSpy: jest.Mock;
};

function mockFont(size = 16): SkFont {
	return {
		getSize: () => size,
		measureText: (text: string) => ({
			width: (text?.length ?? 0) * (size * 0.55),
			height: size,
		}),
	} as unknown as SkFont;
}

function makeProps(): ExportLookProps {
	const garments: PolaroidGarment[] = [
		{
			imageFileUri: "file:///a.webp",
			colorNameEn: "Coral Pink",
			colorHex: "#FF8080",
		},
		{
			imageFileUri: "file:///b.webp",
			colorNameEn: "Sky Blue",
			colorHex: "#80D0FF",
		},
		{
			imageFileUri: "file:///c.webp",
			colorNameEn: "Leaf Green",
			colorHex: "#A8E4A0",
		},
	];
	return {
		garments,
		garmentImages: [
			{ width: () => 1024, height: () => 1024 } as unknown as SkImage,
			{ width: () => 1024, height: () => 1024 } as unknown as SkImage,
			{ width: () => 1024, height: () => 1024 } as unknown as SkImage,
		],
		combinationNameEn: "Coral Triad",
		headerPrefix: "Wada Palette ·",
		serifTitleFont: mockFont(76),
		sansFont: mockFont(28),
	};
}

describe("exportLookImage", () => {
	beforeEach(() => {
		skiaMocks.__mockEncode.mockClear();
		skiaMocks.__mockEncode.mockReturnValue("ZmFrZS1qcGVn");
		skiaMocks.__mockMakeNonTextureImage.mockClear();
		skiaMocks.__mockMakeNonTextureImage.mockReturnValue({
			encodeToBase64: skiaMocks.__mockEncode,
		});
		skiaMocks.__mockMakeImageSnapshot.mockClear();
		skiaMocks.__mockMakeImageSnapshot.mockReturnValue({
			makeNonTextureImage: skiaMocks.__mockMakeNonTextureImage,
		});
		skiaMocks.__mockFlush.mockClear();
		skiaMocks.__mockMakeOffscreen.mockClear();
		skiaMocks.__mockMakeOffscreen.mockReturnValue(skiaMocks.__mockSurface);
		skiaMocks.__mockCanvas.drawRect.mockClear();
		skiaMocks.__mockCanvas.drawRRect.mockClear();
		skiaMocks.__mockCanvas.drawText.mockClear();
		skiaMocks.__mockCanvas.drawImageRect.mockClear();
		skiaMocks.__mockCanvas.save.mockClear();
		skiaMocks.__mockCanvas.restore.mockClear();
		skiaMocks.__mockCanvas.rotate.mockClear();
		skiaMocks.__mockCanvas.clipRRect.mockClear();
		fsMocks.__directoryCreateSpy.mockClear();
		fsMocks.__fileWriteSpy.mockClear();
	});

	it("happy path resolves with a file:// URI under Paths.document + /share/", async () => {
		const result = await exportLookImage(makeProps());
		expect(result.uri).toBe("file:///doc/share/look-fixed-uuid.jpg");
		expect(fsMocks.__fileWriteSpy).toHaveBeenCalledWith(
			"file:///doc/share/look-fixed-uuid.jpg",
			"ZmFrZS1qcGVn",
			{ encoding: "base64" },
		);
	});

	it("/share/ directory is created with intermediates+idempotent", async () => {
		await exportLookImage(makeProps());
		expect(fsMocks.__directoryCreateSpy).toHaveBeenCalledWith(
			"file:///doc/share",
			{ intermediates: true, idempotent: true },
		);
	});

	it("paints a paper background rect BEFORE any polaroid is drawn (no black JPEG)", async () => {
		await exportLookImage(makeProps());
		// First drawRect call is the bg paper — full 1080×1920 rect.
		const firstRect = skiaMocks.__mockCanvas.drawRect.mock.calls[0]?.[0];
		expect(firstRect).toBeDefined();
		expect(firstRect.width).toBe(1080);
		expect(firstRect.height).toBe(1920);
	});

	it("draws the combo title in the chrome AND 'Outfinder' inside the last polaroid", async () => {
		const props = makeProps();
		await exportLookImage(props);
		const texts = skiaMocks.__mockCanvas.drawText.mock.calls.map(
			(args) => args[0] as string,
		);
		// Header prefix letter-spaced (char-by-char), combo title whole, and
		// "Outfinder" whole (drawn inside the polaroid signature).
		expect(texts).toContain("Coral Triad");
		expect(texts).toContain("Outfinder");
		expect(texts.join("")).toContain("WADA PALETTE");
	});

	it("calls makeNonTextureImage BEFORE encodeToBase64 (GPU texture → CPU copy guard)", async () => {
		await exportLookImage(makeProps());
		expect(skiaMocks.__mockMakeNonTextureImage).toHaveBeenCalledTimes(1);
		expect(skiaMocks.__mockEncode).toHaveBeenCalledTimes(1);
		const nonTextureOrder =
			skiaMocks.__mockMakeNonTextureImage.mock.invocationCallOrder[0];
		const encodeOrder = skiaMocks.__mockEncode.mock.invocationCallOrder[0];
		expect(nonTextureOrder).toBeLessThan(encodeOrder);
	});

	it("encodes as JPEG with quality exactly 92", async () => {
		await exportLookImage(makeProps());
		expect(skiaMocks.__mockEncode).toHaveBeenCalledWith(3, 92);
	});

	it("Skia surface creation failure rejects with a typed ExportLookError.surfaceCreate", async () => {
		skiaMocks.__mockMakeOffscreen.mockReturnValueOnce(null);
		let caught: unknown;
		try {
			await exportLookImage(makeProps());
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(ExportLookError);
		expect((caught as ExportLookError).kind).toBe("surfaceCreate");
	});
});
