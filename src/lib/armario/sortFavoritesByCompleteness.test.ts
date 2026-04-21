import type { Combination } from "@/data/types";
import type { CombinationAssignment } from "@/lib/wardrobeTypes";
import { sortFavoritesByCompleteness } from "./sortFavoritesByCompleteness";

function makeCombo(id: string, colorCount = 3): Combination {
	return {
		id,
		nameJp: `${id}-jp`,
		nameEn: `${id}-en`,
		colors: Array.from({ length: colorCount }, (_, i) => ({
			id: `${id}-c${i}`,
			hex: "#808080",
			nameJp: "色",
			nameEn: "Color",
			swatchGroup: 0 as const,
			combinationCount: 1,
		})),
	};
}

function makeAssignment(
	combinationId: string,
	colorIndex: number,
	assignedAt: number,
): CombinationAssignment {
	return {
		combinationId,
		colorIndex,
		wardrobeItemId: `${combinationId}-item-${colorIndex}`,
		assignedAt,
	};
}

describe("sortFavoritesByCompleteness", () => {
	it("partitions 5 mixed combos into complete → partial → empty", () => {
		const combos = [
			makeCombo("a-empty"),
			makeCombo("b-complete"),
			makeCombo("c-partial"),
			makeCombo("d-complete"),
			makeCombo("e-partial"),
		];
		const assignments: CombinationAssignment[] = [
			makeAssignment("b-complete", 0, 100),
			makeAssignment("b-complete", 1, 110),
			makeAssignment("b-complete", 2, 120),
			makeAssignment("c-partial", 0, 130),
			makeAssignment("d-complete", 0, 200),
			makeAssignment("d-complete", 1, 210),
			makeAssignment("d-complete", 2, 220),
			makeAssignment("e-partial", 0, 50),
			makeAssignment("e-partial", 1, 60),
		];
		const result = sortFavoritesByCompleteness(combos, assignments);
		const ids = result.map((c) => c.id);
		// complete (d=220, b=120) then partial (c=130, e=60) then empty (a)
		expect(ids).toEqual([
			"d-complete",
			"b-complete",
			"c-partial",
			"e-partial",
			"a-empty",
		]);
	});

	it("within complete bucket sorts by max(assignedAt) DESC", () => {
		const combos = [makeCombo("old"), makeCombo("fresh")];
		const assignments: CombinationAssignment[] = [
			makeAssignment("old", 0, 10),
			makeAssignment("old", 1, 20),
			makeAssignment("old", 2, 30),
			makeAssignment("fresh", 0, 1000),
			makeAssignment("fresh", 1, 1010),
			makeAssignment("fresh", 2, 1020),
		];
		const result = sortFavoritesByCompleteness(combos, assignments);
		expect(result.map((c) => c.id)).toEqual(["fresh", "old"]);
	});

	it("within partial bucket sorts by max(assignedAt) DESC", () => {
		const combos = [makeCombo("older-partial"), makeCombo("newer-partial")];
		const assignments: CombinationAssignment[] = [
			makeAssignment("older-partial", 0, 100),
			makeAssignment("newer-partial", 0, 500),
		];
		const result = sortFavoritesByCompleteness(combos, assignments);
		expect(result.map((c) => c.id)).toEqual(["newer-partial", "older-partial"]);
	});

	it("within empty bucket preserves input order (Set iteration order proxy)", () => {
		const combos = [
			makeCombo("first-empty"),
			makeCombo("second-empty"),
			makeCombo("third-empty"),
		];
		const result = sortFavoritesByCompleteness(combos, []);
		expect(result.map((c) => c.id)).toEqual([
			"first-empty",
			"second-empty",
			"third-empty",
		]);
	});

	it("empty assignments array leaves input order untouched entirely", () => {
		const combos = [makeCombo("x"), makeCombo("y"), makeCombo("z")];
		const result = sortFavoritesByCompleteness(combos, []);
		expect(result.map((c) => c.id)).toEqual(["x", "y", "z"]);
	});

	it("totalColors === 0 (malformed combo) is treated as empty (last bucket)", () => {
		const combos = [makeCombo("zero", 0), makeCombo("good", 3)];
		const assignments: CombinationAssignment[] = [
			makeAssignment("good", 0, 1),
			makeAssignment("good", 1, 2),
			makeAssignment("good", 2, 3),
			// A stray assignment against the zero-color combo should not promote
			// it out of the empty bucket — totalColors is the authoritative
			// denominator (malformed data stays at the bottom).
			makeAssignment("zero", 0, 999),
		];
		const result = sortFavoritesByCompleteness(combos, assignments);
		expect(result.map((c) => c.id)).toEqual(["good", "zero"]);
	});
});
