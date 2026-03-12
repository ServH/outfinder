import {
	getAllColors,
	getAllCombinations,
	getColor,
	getColorsByGroup,
	getCombinations,
} from "./colorIndex";
import colorsData from "./colors.json";
import type { SwatchGroup } from "./types";

describe("colorIndex", () => {
	describe("getAllColors", () => {
		it("returns all 159 colors", () => {
			expect(getAllColors()).toHaveLength(159);
		});
	});

	describe("getColor", () => {
		it("returns a color by ID in O(1) time", () => {
			const color = getColor("c001");
			expect(color).toBeDefined();
			expect(color?.id).toBe("c001");
			expect(color?.hex).toMatch(/^#[A-Fa-f0-9]{6}$/);
			expect(color?.nameJp).toBeTruthy();
			expect(color?.nameEn).toBeTruthy();
			expect(typeof color?.swatchGroup).toBe("number");
			expect(typeof color?.combinationCount).toBe("number");
		});

		it("returns undefined for nonexistent color", () => {
			expect(getColor("c999")).toBeUndefined();
		});

		it("indexes every color from the dataset", () => {
			for (const raw of colorsData) {
				const color = getColor(raw.id);
				expect(color).toBeDefined();
				expect(color?.hex).toBe(raw.hex);
			}
		});
	});

	describe("getAllCombinations", () => {
		it("returns all 348 combinations", () => {
			expect(getAllCombinations()).toHaveLength(348);
		});
	});

	describe("getCombinations", () => {
		it("returns combinations for a color in O(1) time", () => {
			const combinations = getCombinations("c001");
			expect(Array.isArray(combinations)).toBe(true);
			expect(combinations.length).toBeGreaterThan(0);
		});

		it("returns empty array for nonexistent color", () => {
			expect(getCombinations("c999")).toEqual([]);
		});

		it("ensures every color has at least one combination", () => {
			for (const raw of colorsData) {
				const combos = getCombinations(raw.id);
				expect(combos.length).toBeGreaterThanOrEqual(1);
			}
		});

		it("resolves color references to full Color objects", () => {
			const combinations = getCombinations("c001");
			const first = combinations[0];
			expect(first.colors.length).toBeGreaterThanOrEqual(2);
			for (const color of first.colors) {
				expect(color.id).toBeTruthy();
				expect(color.hex).toBeTruthy();
				expect(color.nameEn).toBeTruthy();
			}
		});
	});

	describe("getColorsByGroup", () => {
		it("returns colors for each swatch group (0-5)", () => {
			for (let group = 0; group <= 5; group++) {
				const colors = getColorsByGroup(group as SwatchGroup);
				expect(colors.length).toBeGreaterThan(0);
				for (const color of colors) {
					expect(color.swatchGroup).toBe(group);
				}
			}
		});

		it("returns empty array for invalid group", () => {
			expect(getColorsByGroup(6 as SwatchGroup)).toEqual([]);
		});

		it("total colors across all groups equals 159", () => {
			let total = 0;
			for (let group = 0; group <= 5; group++) {
				total += getColorsByGroup(group as SwatchGroup).length;
			}
			expect(total).toBe(159);
		});
	});
});
