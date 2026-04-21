import { useMisLooksStore } from "@/stores/misLooksStore";
import {
	addItem,
	assign,
	cascadeDeleteAssignmentsForCombination,
	cascadeDeleteAssignmentsForItem,
	getAssignmentCount,
	getAssignmentsForCombination,
	getItems,
	isCombinationComplete,
	removeItem,
	unassign,
} from "./wardrobeRepo";
import { type WardrobeCategory, WardrobeLimitExceeded } from "./wardrobeTypes";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function seedItem(
	id: string,
	createdAt = 0,
	category: WardrobeCategory = "top",
) {
	return {
		id,
		localImagePath: `file:///items/${id}.png`,
		thumbnailPath: `file:///items/${id}.thumb.png`,
		category,
		createdAt,
	};
}

beforeEach(() => {
	useMisLooksStore.setState({
		items: [],
		assignments: [],
		hydrated: true,
	});
});

describe("addItem", () => {
	it("returns a wardrobe item with id, createdAt and the input fields", () => {
		const before = Date.now();
		const created = addItem(
			{
				localImagePath: "file:///cutout.png",
				thumbnailPath: "file:///cutout.thumb.png",
				category: "top",
			},
			false,
		);

		expect(typeof created.id).toBe("string");
		expect(created.id.length).toBeGreaterThan(0);
		expect(created.localImagePath).toBe("file:///cutout.png");
		expect(created.thumbnailPath).toBe("file:///cutout.thumb.png");
		expect(created.category).toBe("top");
		expect(created.createdAt).toBeGreaterThanOrEqual(before);
		expect(getItems()).toHaveLength(1);
	});

	it("succeeds for free tier when items.length is just under the limit", () => {
		const seeded = Array.from({ length: 9 }, (_, i) => seedItem(`item-${i}`));
		useMisLooksStore.setState({ items: seeded });

		expect(() =>
			addItem(
				{
					localImagePath: "file:///x.png",
					thumbnailPath: "file:///x.t.png",
					category: "top",
				},
				false,
			),
		).not.toThrow();
		expect(getItems()).toHaveLength(10);
	});

	it("throws WardrobeLimitExceeded for free tier at the limit", () => {
		const seeded = Array.from({ length: 10 }, (_, i) => seedItem(`item-${i}`));
		useMisLooksStore.setState({ items: seeded });

		expect(() =>
			addItem(
				{
					localImagePath: "file:///x.png",
					thumbnailPath: "file:///x.t.png",
					category: "top",
				},
				false,
			),
		).toThrow(WardrobeLimitExceeded);
		expect(getItems()).toHaveLength(10);
	});

	it("bypasses the limit for premium callers", () => {
		const seeded = Array.from({ length: 10 }, (_, i) => seedItem(`item-${i}`));
		useMisLooksStore.setState({ items: seeded });

		expect(() =>
			addItem(
				{
					localImagePath: "file:///x.png",
					thumbnailPath: "file:///x.t.png",
					category: "top",
				},
				true,
			),
		).not.toThrow();
		expect(getItems()).toHaveLength(11);
	});

	// AC #7(a): round-trip all four enum values
	test.each<WardrobeCategory>([
		"top",
		"bottom",
		"footwear",
		"accessory",
	])("persists category=%s on the returned item and via getItems()", (category) => {
		const created = addItem(
			{
				localImagePath: `file:///${category}.png`,
				thumbnailPath: `file:///${category}.thumb.png`,
				category,
			},
			true,
		);
		expect(created.category).toBe(category);
		expect(getItems()).toHaveLength(1);
		expect(getItems()[0]?.category).toBe(category);
	});

	// AC #7(b): different items can carry different categories and both survive
	it("preserves heterogeneous categories across multiple addItem calls", () => {
		const a = addItem(
			{
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.thumb.png",
				category: "bottom",
			},
			true,
		);
		const b = addItem(
			{
				localImagePath: "file:///b.png",
				thumbnailPath: "file:///b.thumb.png",
				category: "footwear",
			},
			true,
		);

		const items = getItems();
		expect(items).toHaveLength(2);
		expect(items.find((i) => i.id === a.id)?.category).toBe("bottom");
		expect(items.find((i) => i.id === b.id)?.category).toBe("footwear");
	});
});

describe("assign / unassign", () => {
	it("upserts a (combinationId, colorIndex) pair — second assign overwrites and never duplicates the item row", () => {
		const itemA = seedItem("item-a");
		const itemB = seedItem("item-b");
		useMisLooksStore.setState({ items: [itemA, itemB] });

		assign("combo-42", 0, "item-a");
		assign("combo-42", 0, "item-b");

		const rows = getAssignmentsForCombination("combo-42");
		expect(rows).toHaveLength(1);
		expect(rows[0]?.wardrobeItemId).toBe("item-b");

		expect(getItems()).toHaveLength(2);
		expect(getItems().map((i) => i.id)).toEqual(["item-a", "item-b"]);
	});

	it("allows the same wardrobe item to be reused across multiple combinations (FR6 reuse — never gated)", () => {
		const itemA = seedItem("item-a");
		useMisLooksStore.setState({ items: [itemA] });

		assign("combo-1", 0, "item-a");
		assign("combo-2", 1, "item-a");
		assign("combo-3", 2, "item-a");

		expect(getAssignmentCount("combo-1")).toBe(1);
		expect(getAssignmentCount("combo-2")).toBe(1);
		expect(getAssignmentCount("combo-3")).toBe(1);
		expect(getItems()).toHaveLength(1);
	});

	it("removes a single (combinationId, colorIndex) row via unassign", () => {
		const itemA = seedItem("item-a");
		useMisLooksStore.setState({ items: [itemA] });

		assign("combo-7", 0, "item-a");
		assign("combo-7", 1, "item-a");
		expect(getAssignmentCount("combo-7")).toBe(2);

		unassign("combo-7", 0);

		const rows = getAssignmentsForCombination("combo-7");
		expect(rows).toHaveLength(1);
		expect(rows[0]?.colorIndex).toBe(1);
	});

	it("isCombinationComplete reflects assignment count vs total colors", () => {
		const itemA = seedItem("item-a");
		useMisLooksStore.setState({ items: [itemA] });

		assign("combo-9", 0, "item-a");
		assign("combo-9", 1, "item-a");
		expect(isCombinationComplete("combo-9", 3)).toBe(false);

		assign("combo-9", 2, "item-a");
		expect(isCombinationComplete("combo-9", 3)).toBe(true);
	});

	it("isCombinationComplete returns false when totalColors is 0", () => {
		expect(isCombinationComplete("combo-99", 0)).toBe(false);
	});
});

describe("cascadeDeleteAssignmentsForCombination", () => {
	it("removes only matching-combo rows and leaves wardrobe items intact", () => {
		const itemA = seedItem("item-a");
		const itemB = seedItem("item-b");
		useMisLooksStore.setState({ items: [itemA, itemB] });

		assign("combo-100", 0, "item-a");
		assign("combo-100", 1, "item-b");
		assign("combo-200", 0, "item-a");

		cascadeDeleteAssignmentsForCombination("combo-100");

		expect(getAssignmentsForCombination("combo-100")).toHaveLength(0);
		expect(getAssignmentsForCombination("combo-200")).toHaveLength(1);
		expect(getItems()).toHaveLength(2);
	});
});

describe("removeItem", () => {
	// Deliberate behavior: removeItem does NOT cascade forward into assignments.
	// Downstream UI (Story 13.4b) is responsible for resolving and skipping
	// orphan assignments. Keeping the API minimal avoids accidental data loss
	// and mirrors AsyncStorage's lack of foreign-key semantics.
	it("deletes the item row but leaves assignments referencing it dangling", () => {
		const itemA = seedItem("item-a");
		useMisLooksStore.setState({ items: [itemA] });

		assign("combo-50", 0, "item-a");
		removeItem("item-a");

		expect(getItems()).toHaveLength(0);
		const rows = getAssignmentsForCombination("combo-50");
		expect(rows).toHaveLength(1);
		expect(rows[0]?.wardrobeItemId).toBe("item-a");
	});
});

describe("cascadeDeleteAssignmentsForItem", () => {
	it("removes every assignment row for the given item across all combos", () => {
		const itemA = seedItem("item-a");
		const itemB = seedItem("item-b");
		useMisLooksStore.setState({ items: [itemA, itemB] });

		assign("combo-100", 0, "item-a");
		assign("combo-100", 1, "item-b");
		assign("combo-200", 0, "item-a");
		assign("combo-300", 2, "item-a");

		cascadeDeleteAssignmentsForItem("item-a");

		// Every combination that referenced item-a is now free in those slots.
		expect(getAssignmentsForCombination("combo-100")).toHaveLength(1);
		expect(getAssignmentsForCombination("combo-100")[0]?.wardrobeItemId).toBe(
			"item-b",
		);
		expect(getAssignmentsForCombination("combo-200")).toHaveLength(0);
		expect(getAssignmentsForCombination("combo-300")).toHaveLength(0);
		// Wardrobe items themselves are untouched — delete them via removeItem.
		expect(getItems()).toHaveLength(2);
	});

	it("is a no-op when the item has no assignments", () => {
		const itemA = seedItem("item-a");
		useMisLooksStore.setState({ items: [itemA] });
		assign("combo-100", 0, "item-a");

		cascadeDeleteAssignmentsForItem("item-never-assigned");

		expect(getAssignmentCount("combo-100")).toBe(1);
	});
});
