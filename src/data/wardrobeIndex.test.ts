import { getCombinations } from "./colorIndex";
import colorsData from "./colors.json";
import type { WardrobeCategory } from "./types";
import { REPRESENTATIVE_SHADES, WARDROBE_MAP } from "./wardrobeData";
import {
	getColorsByWardrobe,
	getCombinationsByWardrobe,
	getDefaultShade,
	getRepresentativeShades,
} from "./wardrobeIndex";

const ALL_CATEGORIES: WardrobeCategory[] = [
	"white",
	"black",
	"blue",
	"grey",
	"brown",
	"green",
	"red",
	"pink",
	"yellow",
	"purple",
	"orange",
];

describe("wardrobeIndex", () => {
	describe("getColorsByWardrobe — AC #1: all 159 colors mapped", () => {
		it("maps every color in colors.json to exactly one category", () => {
			const allMappedIds = new Set<string>();

			for (const category of ALL_CATEGORIES) {
				const colors = getColorsByWardrobe(category);
				for (const color of colors) {
					expect(allMappedIds.has(color.id)).toBe(false);
					allMappedIds.add(color.id);
				}
			}

			expect(allMappedIds.size).toBe(159);
		});

		it("every color from colors.json appears in WARDROBE_MAP", () => {
			for (const raw of colorsData) {
				expect(WARDROBE_MAP[raw.id]).toBeDefined();
				expect(ALL_CATEGORIES).toContain(WARDROBE_MAP[raw.id]);
			}
		});

		it("returns colors with valid Color properties", () => {
			const colors = getColorsByWardrobe("blue");
			expect(colors.length).toBeGreaterThan(0);
			for (const color of colors) {
				expect(color.id).toBeTruthy();
				expect(color.hex).toMatch(/^#[A-Fa-f0-9]{6}$/);
				expect(color.nameEn).toBeTruthy();
			}
		});
	});

	describe("getRepresentativeShades — AC #2: 5 curated shades per category", () => {
		it("returns exactly 5 shades for each category", () => {
			for (const category of ALL_CATEGORIES) {
				const shades = getRepresentativeShades(category);
				expect(shades).toHaveLength(5);
			}
		});

		it("representative shades are ordered light-to-dark (luminance decreasing)", () => {
			function luminance(hex: string): number {
				const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
				const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
				const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
				return 0.2126 * r + 0.7152 * g + 0.0722 * b;
			}

			for (const category of ALL_CATEGORIES) {
				const shades = getRepresentativeShades(category);
				for (let i = 0; i < shades.length - 1; i++) {
					const lumCurrent = luminance(shades[i].hex);
					const lumNext = luminance(shades[i + 1].hex);
					expect(lumCurrent).toBeGreaterThanOrEqual(lumNext);
				}
			}
		});

		it("each shade belongs to its declared category", () => {
			for (const category of ALL_CATEGORIES) {
				const shades = getRepresentativeShades(category);
				for (const shade of shades) {
					expect(WARDROBE_MAP[shade.id]).toBe(category);
				}
			}
		});

		it("shades are visually distinct (no duplicate IDs)", () => {
			for (const category of ALL_CATEGORIES) {
				const shades = getRepresentativeShades(category);
				const ids = shades.map((s) => s.id);
				expect(new Set(ids).size).toBe(5);
			}
		});
	});

	describe("getDefaultShade — AC #3: highest combinationCount", () => {
		it("returns the shade with highest combinationCount among representatives", () => {
			for (const category of ALL_CATEGORIES) {
				const defaultShade = getDefaultShade(category);
				const shades = getRepresentativeShades(category);

				expect(defaultShade).toBeDefined();
				const maxCount = Math.max(...shades.map((s) => s.combinationCount));
				expect(defaultShade!.combinationCount).toBe(maxCount);
			}
		});

		it("returns a Color object with valid properties", () => {
			const shade = getDefaultShade("red");
			expect(shade).toBeDefined();
			expect(shade!.id).toBeTruthy();
			expect(shade!.hex).toMatch(/^#[A-Fa-f0-9]{6}$/);
			expect(shade!.nameEn).toBeTruthy();
			expect(shade!.combinationCount).toBeGreaterThan(0);
		});
	});

	describe("getCombinationsByWardrobe — AC #4: all combos for category", () => {
		it("returns combinations containing at least one color in the category", () => {
			for (const category of ALL_CATEGORIES) {
				const combos = getCombinationsByWardrobe(category);
				const categoryColorIds = new Set(
					getColorsByWardrobe(category).map((c) => c.id),
				);

				for (const combo of combos) {
					const hasMatch = combo.colors.some((c) => categoryColorIds.has(c.id));
					expect(hasMatch).toBe(true);
				}
			}
		});

		it("returns combinations ordered by size (2-color first, then 3, then 4)", () => {
			for (const category of ALL_CATEGORIES) {
				const combos = getCombinationsByWardrobe(category);
				for (let i = 0; i < combos.length - 1; i++) {
					expect(combos[i].colors.length).toBeLessThanOrEqual(
						combos[i + 1].colors.length,
					);
				}
			}
		});

		it("has no duplicate combinations", () => {
			for (const category of ALL_CATEGORIES) {
				const combos = getCombinationsByWardrobe(category);
				const ids = combos.map((c) => c.id);
				expect(new Set(ids).size).toBe(ids.length);
			}
		});

		it("is deterministic — same input returns same output", () => {
			const first = getCombinationsByWardrobe("brown");
			const second = getCombinationsByWardrobe("brown");

			expect(first).toHaveLength(second.length);
			for (let i = 0; i < first.length; i++) {
				expect(first[i].id).toBe(second[i].id);
			}
		});

		it("includes all combinations that contain a category color (completeness)", () => {
			const category: WardrobeCategory = "brown";
			const categoryColorIds = new Set(
				getColorsByWardrobe(category).map((c) => c.id),
			);
			const wardrobeCombos = getCombinationsByWardrobe(category);
			const wardrobeComboIds = new Set(wardrobeCombos.map((c) => c.id));

			// For each color in the category, every combo from colorIndex must appear
			for (const colorId of categoryColorIds) {
				for (const combo of getCombinations(colorId)) {
					expect(wardrobeComboIds.has(combo.id)).toBe(true);
				}
			}
		});
	});

	describe("shade-level filtering — AC #5: exact color ID", () => {
		it("getCombinations(shadeId) returns only combos with that exact color", () => {
			const shades = getRepresentativeShades("brown");
			for (const shade of shades) {
				const combos = getCombinations(shade.id);
				for (const combo of combos) {
					const hasShade = combo.colors.some((c) => c.id === shade.id);
					expect(hasShade).toBe(true);
				}
			}
		});

		it("shade-level results are a subset of category-level results", () => {
			const categoryCombos = getCombinationsByWardrobe("red");
			const categoryIds = new Set(categoryCombos.map((c) => c.id));

			const defaultShade = getDefaultShade("red");
			const shadeCombos = getCombinations(defaultShade!.id);

			for (const combo of shadeCombos) {
				expect(categoryIds.has(combo.id)).toBe(true);
			}
		});
	});

	describe("edge cases", () => {
		it("returns empty array for invalid category", () => {
			expect(getColorsByWardrobe("invalid" as WardrobeCategory)).toEqual([]);
			expect(getCombinationsByWardrobe("invalid" as WardrobeCategory)).toEqual(
				[],
			);
			expect(getRepresentativeShades("invalid" as WardrobeCategory)).toEqual(
				[],
			);
		});

		it("returns undefined for invalid category default shade", () => {
			expect(getDefaultShade("invalid" as WardrobeCategory)).toBeUndefined();
		});

		it("REPRESENTATIVE_SHADES has exactly 11 categories", () => {
			expect(Object.keys(REPRESENTATIVE_SHADES)).toHaveLength(11);
		});

		it("WARDROBE_MAP has exactly 159 entries", () => {
			expect(Object.keys(WARDROBE_MAP)).toHaveLength(159);
		});
	});
});
