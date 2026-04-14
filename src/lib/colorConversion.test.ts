import {
	hexToLab,
	hexToRgb,
	linearRgbToXyz,
	rgbToLinear,
	xyzToLab,
} from "./colorConversion";

describe("hexToRgb", () => {
	it("parses white correctly", () => {
		expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
	});

	it("parses black correctly", () => {
		expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
	});

	it("works without # prefix", () => {
		expect(hexToRgb("FF0000")).toEqual({ r: 255, g: 0, b: 0 });
	});

	it("throws RangeError on empty string", () => {
		expect(() => hexToRgb("")).toThrow(RangeError);
	});

	it("throws RangeError on 3-char shorthand (#FFF)", () => {
		expect(() => hexToRgb("#FFF")).toThrow(RangeError);
	});

	it("throws RangeError on invalid hex chars (#GGGGGG)", () => {
		expect(() => hexToRgb("#GGGGGG")).toThrow(RangeError);
	});
});

describe("rgbToLinear", () => {
	it("0 → 0.0 (black channel)", () => {
		expect(rgbToLinear(0)).toBeCloseTo(0, 5);
	});

	it("255 → 1.0 (white channel)", () => {
		expect(rgbToLinear(255)).toBeCloseTo(1.0, 5);
	});

	it("uses low-end linear branch for values ≤ 0.04045 * 255 ≈ 10.3", () => {
		// c/255 = 0.02 ≤ 0.04045 → linear = 0.02 / 12.92
		expect(rgbToLinear(5)).toBeCloseTo(5 / 255 / 12.92, 5);
	});
});

describe("linearRgbToXyz", () => {
	it("pure white linear (1,1,1) → X≈0.9505, Y≈1.0, Z≈1.0888", () => {
		const { X, Y, Z } = linearRgbToXyz(1, 1, 1);
		expect(X).toBeCloseTo(0.95047, 3);
		expect(Y).toBeCloseTo(1.0, 3);
		expect(Z).toBeCloseTo(1.08883, 3);
	});

	it("black (0,0,0) → (0,0,0)", () => {
		const { X, Y, Z } = linearRgbToXyz(0, 0, 0);
		expect(X).toBe(0);
		expect(Y).toBe(0);
		expect(Z).toBe(0);
	});
});

describe("xyzToLab", () => {
	it("D65 white point → L≈100, a≈0, b≈0", () => {
		const lab = xyzToLab(0.95047, 1.0, 1.08883);
		expect(lab.L).toBeCloseTo(100, 1);
		expect(lab.a).toBeCloseTo(0, 1);
		expect(lab.b).toBeCloseTo(0, 1);
	});

	it("black (0,0,0) → L≈0, a≈0, b≈0", () => {
		const lab = xyzToLab(0, 0, 0);
		expect(lab.L).toBeCloseTo(0, 1);
		expect(lab.a).toBeCloseTo(0, 1);
		expect(lab.b).toBeCloseTo(0, 1);
	});
});

describe("hexToLab", () => {
	it("white (#FFFFFF) → L≈100, a≈0, b≈0 (±0.01)", () => {
		const lab = hexToLab("#FFFFFF");
		expect(lab.L).toBeCloseTo(100, 2);
		expect(lab.a).toBeCloseTo(0, 2);
		expect(lab.b).toBeCloseTo(0, 2);
	});

	it("black (#000000) → L≈0, a≈0, b≈0 (±0.01)", () => {
		const lab = hexToLab("#000000");
		expect(lab.L).toBeCloseTo(0, 2);
		expect(lab.a).toBeCloseTo(0, 2);
		expect(lab.b).toBeCloseTo(0, 2);
	});

	it("red (#FF0000) → L≈53.2, a≈80.1, b≈67.2 (±1.0)", () => {
		const lab = hexToLab("#FF0000");
		expect(lab.L).toBeCloseTo(53.2, 0);
		expect(lab.a).toBeCloseTo(80.1, 0);
		expect(lab.b).toBeCloseTo(67.2, 0);
	});
});
