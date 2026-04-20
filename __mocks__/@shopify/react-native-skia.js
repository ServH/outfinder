const React = require("react");
const { View } = require("react-native");

function createSkiaComponent(name) {
	const component = function SkiaComponent(props) {
		return React.createElement(
			View,
			{ testID: `skia-${name}`, ...props },
			props.children,
		);
	};
	component.displayName = name;
	return component;
}

function mockPaint() {
	return {
		setColor: jest.fn(),
		setAlphaf: jest.fn(),
		setMaskFilter: jest.fn(),
		setAntiAlias: jest.fn(),
		setStyle: jest.fn(),
		setStrokeWidth: jest.fn(),
	};
}

function mockCanvas() {
	return {
		save: jest.fn(),
		restore: jest.fn(),
		rotate: jest.fn(),
		translate: jest.fn(),
		scale: jest.fn(),
		drawRect: jest.fn(),
		drawRRect: jest.fn(),
		clipRect: jest.fn(),
		clipRRect: jest.fn(),
		drawImage: jest.fn(),
		drawImageRect: jest.fn(),
		drawText: jest.fn(),
		drawPaint: jest.fn(),
	};
}

function mockImage() {
	const img = {
		width: () => 1024,
		height: () => 1024,
		encodeToBytes: jest.fn(() => new Uint8Array([0, 1, 2, 3])),
		encodeToBase64: jest.fn(() => "ZmFrZS1qcGVn"),
	};
	img.makeNonTextureImage = jest.fn(() => img);
	return img;
}

function mockSurface() {
	const canvas = mockCanvas();
	const image = mockImage();
	return {
		getCanvas: () => canvas,
		flush: jest.fn(),
		makeImageSnapshot: jest.fn(() => image),
	};
}

const Skia = {
	Paint: jest.fn(mockPaint),
	Color: jest.fn((c) => c),
	XYWHRect: jest.fn((x, y, width, height) => ({ x, y, width, height })),
	RRectXY: jest.fn((rect, rx, ry) => ({ rect, rx, ry })),
	MaskFilter: {
		MakeBlur: jest.fn((style, sigma) => ({ style, sigma, __kind: "blur" })),
	},
	Data: {
		fromURI: jest.fn(async () => ({ __data: "from-uri", size: () => 4 })),
		fromBytes: jest.fn((bytes) => ({
			__data: "from-bytes",
			bytes,
			size: () => (bytes && bytes.length) || 0,
		})),
	},
	Image: {
		MakeImageFromEncoded: jest.fn(() => mockImage()),
	},
	Surface: {
		MakeOffscreen: jest.fn(mockSurface),
	},
};

module.exports = {
	Canvas: function Canvas(props) {
		return React.createElement(
			View,
			{ testID: "skia-canvas", ...props },
			props.children,
		);
	},
	Image: createSkiaComponent("Image"),
	Fill: createSkiaComponent("Fill"),
	ColorMatrix: createSkiaComponent("ColorMatrix"),
	RadialGradient: createSkiaComponent("RadialGradient"),
	RoundedRect: createSkiaComponent("RoundedRect"),
	Shadow: createSkiaComponent("Shadow"),
	Picture: createSkiaComponent("Picture"),
	Group: function Group(props) {
		return React.createElement(
			View,
			{ testID: "skia-group", ...props },
			props.children,
		);
	},
	useImage: jest.fn(() => ({ width: () => 1024, height: () => 1024 })),
	useFont: jest.fn(() => ({
		getSize: () => 14,
		measureText: () => ({ width: 60, height: 18 }),
	})),
	createPicture: jest.fn((draw) => {
		const canvas = mockCanvas();
		try {
			draw(canvas);
		} catch (_err) {
			// Swallow test-side draw errors; lib tests spy on their own canvas.
		}
		return { __picture: true, __canvas: canvas };
	}),
	vec: (x, y) => ({ x, y }),
	Skia,
	ImageFormat: { JPEG: 3, PNG: 4, WEBP: 6 },
	BlurStyle: { Normal: 0, Solid: 1, Outer: 2, Inner: 3 },
	ClipOp: { Difference: 0, Intersect: 1 },
	// Test helpers (not real Skia exports)
	__createMockCanvas: mockCanvas,
	__createMockSurface: mockSurface,
	__createMockImage: mockImage,
};
