import type { Combination } from "@/data/types";
import type { CombinationAssignment } from "@/lib/wardrobeTypes";
import { selectIncompleteLooks } from "./selectIncompleteLooks";

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

describe("selectIncompleteLooks", () => {
	it("returns empty array when combinations is empty", () => {
		expect(selectIncompleteLooks([], [])).toEqual([]);
	});

	it("returns empty array when all combinations are fully assigned", () => {
		const combos = [makeCombo("full-a", 2), makeCombo("full-b", 3)];
		const assignments: CombinationAssignment[] = [
			makeAssignment("full-a", 0, 10),
			makeAssignment("full-a", 1, 20),
			makeAssignment("full-b", 0, 30),
			makeAssignment("full-b", 1, 40),
			makeAssignment("full-b", 2, 50),
		];
		expect(selectIncompleteLooks(combos, assignments)).toEqual([]);
	});

	it("returns combinations with assignedCount < total (partial)", () => {
		const combo = makeCombo("partial", 3);
		const assignments = [makeAssignment("partial", 0, 100)];
		const result = selectIncompleteLooks([combo], assignments);
		expect(result.map((c) => c.id)).toEqual(["partial"]);
	});

	it("returns combinations with assignedCount === 0 (empty / Guardar-para-luego case)", () => {
		const combo = makeCombo("bookmarked", 3);
		const result = selectIncompleteLooks([combo], []);
		expect(result.map((c) => c.id)).toEqual(["bookmarked"]);
	});

	it("orders by maxAssignedAt descending", () => {
		const combos = [makeCombo("older", 3), makeCombo("newer", 3)];
		const assignments: CombinationAssignment[] = [
			makeAssignment("older", 0, 100),
			makeAssignment("newer", 0, 200),
		];
		const result = selectIncompleteLooks(combos, assignments);
		expect(result.map((c) => c.id)).toEqual(["newer", "older"]);
	});

	it("empties (maxAssignedAt = 0) fall to end preserving input order", () => {
		const combos = [
			makeCombo("empty-a", 3),
			makeCombo("partial-b", 3),
			makeCombo("empty-c", 3),
		];
		const assignments = [makeAssignment("partial-b", 0, 100)];
		const result = selectIncompleteLooks(combos, assignments);
		expect(result.map((c) => c.id)).toEqual([
			"partial-b",
			"empty-a",
			"empty-c",
		]);
	});

	it("does not mutate inputs", () => {
		const combos = [makeCombo("a", 3), makeCombo("b", 3), makeCombo("c", 3)];
		const assignments: CombinationAssignment[] = [
			makeAssignment("a", 0, 100),
			makeAssignment("b", 0, 200),
			makeAssignment("b", 1, 210),
		];
		const combosSnapshot = JSON.parse(JSON.stringify(combos));
		const assignmentsSnapshot = JSON.parse(JSON.stringify(assignments));

		selectIncompleteLooks(combos, assignments);

		expect(combos).toEqual(combosSnapshot);
		expect(assignments).toEqual(assignmentsSnapshot);
	});
});
