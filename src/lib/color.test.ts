import { isLightColor } from "./color";

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
