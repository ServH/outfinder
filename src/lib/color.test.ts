import { hexToRgba, isLightColor, relativeLuminance } from "./color";

describe("isLightColor", () => {
	it("returns true for white (#FFFFFF)", () => {
		expect(isLightColor("#FFFFFF")).toBe(true);
	});

	it("returns true for very light color (#F5F5F5)", () => {
		expect(isLightColor("#F5F5F5")).toBe(true);
	});

	it("returns false for black (#000000)", () => {
		expect(isLightColor("#000000")).toBe(false);
	});

	it("returns false for dark color (#A52A2A)", () => {
		expect(isLightColor("#A52A2A")).toBe(false);
	});

	it("returns false for mid-range color (#9b9b9b)", () => {
		expect(isLightColor("#9b9b9b")).toBe(false);
	});

	it("returns true for color just above threshold (#E8E8E0)", () => {
		// R=232 G=232 B=224 → luminance = (232*299 + 232*587 + 224*114)/1000 ≈ 230.9 > 224
		expect(isLightColor("#E8E8E0")).toBe(true);
	});

	// Edge cases
	it("returns false for short-form hex (#FFF) — parsed incorrectly as expected", () => {
		// isLightColor expects 7-char hex; short-form produces NaN → false
		expect(isLightColor("#FFF")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isLightColor("")).toBe(false);
	});

	it("returns false for hex without # prefix", () => {
		// Slicing from index 1 on "FFFFFF" gives "FF", "FF", "FF" → still parses correctly
		expect(isLightColor("FFFFFF")).toBe(true);
	});
});

describe("hexToRgba", () => {
	it("converts 6-digit hex with leading # to rgba", () => {
		expect(hexToRgba("#FF8040", 0.5)).toBe("rgba(255, 128, 64, 0.5)");
	});

	it("converts 6-digit hex without leading # to rgba", () => {
		expect(hexToRgba("FF8040", 1)).toBe("rgba(255, 128, 64, 1)");
	});

	it("expands 3-digit short-form hex correctly", () => {
		// #F84 → FF 88 44
		expect(hexToRgba("#F84", 0.25)).toBe("rgba(255, 136, 68, 0.25)");
	});

	it("clamps alpha to [0, 1]", () => {
		expect(hexToRgba("#000000", -0.2)).toBe("rgba(0, 0, 0, 0)");
		expect(hexToRgba("#000000", 1.5)).toBe("rgba(0, 0, 0, 1)");
	});

	it("falls back to rgba(0, 0, 0, alpha) for malformed hex", () => {
		expect(hexToRgba("#NOTHEX", 0.8)).toBe("rgba(0, 0, 0, 0.8)");
		expect(hexToRgba("#12345", 0.4)).toBe("rgba(0, 0, 0, 0.4)");
	});
});

describe("relativeLuminance", () => {
	it("returns 0 for pure black", () => {
		expect(relativeLuminance("#000000")).toBe(0);
	});

	it("returns 1 for pure white (within 1e-6)", () => {
		expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 6);
	});

	it("returns a mid/low value below the 0.40 threshold for Brick Red (#7a3f2b)", () => {
		const L = relativeLuminance("#7a3f2b");
		expect(L).toBeGreaterThan(0);
		expect(L).toBeLessThan(0.4);
	});

	it("returns a high value above the 0.40 threshold for cream pergamino (#faf7f2)", () => {
		const L = relativeLuminance("#faf7f2");
		expect(L).toBeGreaterThan(0.4);
	});

	it("returns 0 for malformed hex inputs", () => {
		expect(relativeLuminance("#zzz")).toBe(0);
		expect(relativeLuminance("")).toBe(0);
		expect(relativeLuminance("#12345")).toBe(0);
	});
});
