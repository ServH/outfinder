import { useWardrobeStore } from "@/stores/wardrobeStore";
import {
	addItem,
	assign,
	cascadeDeleteAssignmentsForCombination,
	getAssignmentCount,
	getAssignmentsForCombination,
	getItems,
	isCombinationComplete,
	removeItem,
	unassign,
} from "./wardrobeRepo";
import { WardrobeLimitExceeded } from "./wardrobeTypes";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function seedItem(id: string, createdAt = 0) {
	return {
		id,
		localImagePath: `file:///items/${id}.png`,
		thumbnailPath: `file:///items/${id}.thumb.png`,
		createdAt,
	};
}

beforeEach(() => {
	useWardrobeStore.setState({
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
			},
			false,
		);

		expect(typeof created.id).toBe("string");
		expect(created.id.length).toBeGreaterThan(0);
		expect(created.localImagePath).toBe("file:///cutout.png");
		expect(created.thumbnailPath).toBe("file:///cutout.thumb.png");
		expect(created.createdAt).toBeGreaterThanOrEqual(before);
		expect(getItems()).toHaveLength(1);
	});

	it("succeeds for free tier when items.length is just under the limit", () => {
		const seeded = Array.from({ length: 9 }, (_, i) => seedItem(`item-${i}`));
		useWardrobeStore.setState({ items: seeded });

		expect(() =>
			addItem(
				{ localImagePath: "file:///x.png", thumbnailPath: "file:///x.t.png" },
				false,
			),
		).not.toThrow();
		expect(getItems()).toHaveLength(10);
	});

	it("throws WardrobeLimitExceeded for free tier at the limit", () => {
		const seeded = Array.from({ length: 10 }, (_, i) => seedItem(`item-${i}`));
		useWardrobeStore.setState({ items: seeded });

		expect(() =>
			addItem(
				{ localImagePath: "file:///x.png", thumbnailPath: "file:///x.t.png" },
				false,
			),
		).toThrow(WardrobeLimitExceeded);
		expect(getItems()).toHaveLength(10);
	});

	it("bypasses the limit for premium callers", () => {
		const seeded = Array.from({ length: 10 }, (_, i) => seedItem(`item-${i}`));
		useWardrobeStore.setState({ items: seeded });

		expect(() =>
			addItem(
				{ localImagePath: "file:///x.png", thumbnailPath: "file:///x.t.png" },
				true,
			),
		).not.toThrow();
		expect(getItems()).toHaveLength(11);
	});
});

describe("assign / unassign", () => {
	it("upserts a (combinationId, colorIndex) pair — second assign overwrites and never duplicates the item row", () => {
		const itemA = seedItem("item-a");
		const itemB = seedItem("item-b");
		useWardrobeStore.setState({ items: [itemA, itemB] });

		assign(42, 0, "item-a");
		assign(42, 0, "item-b");

		const rows = getAssignmentsForCombination(42);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.wardrobeItemId).toBe("item-b");

		expect(getItems()).toHaveLength(2);
		expect(getItems().map((i) => i.id)).toEqual(["item-a", "item-b"]);
	});

	it("allows the same wardrobe item to be reused across multiple combinations (FR6 reuse — never gated)", () => {
		const itemA = seedItem("item-a");
		useWardrobeStore.setState({ items: [itemA] });

		assign(1, 0, "item-a");
		assign(2, 1, "item-a");
		assign(3, 2, "item-a");

		expect(getAssignmentCount(1)).toBe(1);
		expect(getAssignmentCount(2)).toBe(1);
		expect(getAssignmentCount(3)).toBe(1);
		expect(getItems()).toHaveLength(1);
	});

	it("removes a single (combinationId, colorIndex) row via unassign", () => {
		const itemA = seedItem("item-a");
		useWardrobeStore.setState({ items: [itemA] });

		assign(7, 0, "item-a");
		assign(7, 1, "item-a");
		expect(getAssignmentCount(7)).toBe(2);

		unassign(7, 0);

		const rows = getAssignmentsForCombination(7);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.colorIndex).toBe(1);
	});

	it("isCombinationComplete reflects assignment count vs total colors", () => {
		const itemA = seedItem("item-a");
		useWardrobeStore.setState({ items: [itemA] });

		assign(9, 0, "item-a");
		assign(9, 1, "item-a");
		expect(isCombinationComplete(9, 3)).toBe(false);

		assign(9, 2, "item-a");
		expect(isCombinationComplete(9, 3)).toBe(true);
	});

	it("isCombinationComplete returns false when totalColors is 0", () => {
		expect(isCombinationComplete(99, 0)).toBe(false);
	});
});

describe("cascadeDeleteAssignmentsForCombination", () => {
	it("removes only matching-combo rows and leaves wardrobe items intact", () => {
		const itemA = seedItem("item-a");
		const itemB = seedItem("item-b");
		useWardrobeStore.setState({ items: [itemA, itemB] });

		assign(100, 0, "item-a");
		assign(100, 1, "item-b");
		assign(200, 0, "item-a");

		cascadeDeleteAssignmentsForCombination(100);

		expect(getAssignmentsForCombination(100)).toHaveLength(0);
		expect(getAssignmentsForCombination(200)).toHaveLength(1);
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
		useWardrobeStore.setState({ items: [itemA] });

		assign(50, 0, "item-a");
		removeItem("item-a");

		expect(getItems()).toHaveLength(0);
		const rows = getAssignmentsForCombination(50);
		expect(rows).toHaveLength(1);
		expect(rows[0]?.wardrobeItemId).toBe("item-a");
	});
});
