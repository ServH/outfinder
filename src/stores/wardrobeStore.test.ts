import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { hydrateWardrobeStore, useWardrobeStore } from "./wardrobeStore";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const ITEMS_KEY = "@wardrobe:items";
const ASSIGNMENTS_KEY = "@wardrobe:assignments";

const validItem = {
	id: "uuid-1",
	localImagePath: "file:///items/uuid-1.png",
	thumbnailPath: "file:///items/uuid-1.thumb.png",
	category: "top" as const,
	createdAt: 1_700_000_000_000,
};

const validAssignment = {
	combinationId: "combo-17",
	colorIndex: 0,
	wardrobeItemId: "uuid-1",
	assignedAt: 1_700_000_000_000,
};

beforeEach(async () => {
	await AsyncStorage.clear();
	useWardrobeStore.setState({
		items: [],
		assignments: [],
		hydrated: false,
	});
});

describe("hydrateWardrobeStore", () => {
	it("populates state from seeded AsyncStorage on both keys", async () => {
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([validItem]));
		await AsyncStorage.setItem(
			ASSIGNMENTS_KEY,
			JSON.stringify([validAssignment]),
		);

		await hydrateWardrobeStore();

		const state = useWardrobeStore.getState();
		expect(state.items).toEqual([validItem]);
		expect(state.assignments).toEqual([validAssignment]);
		expect(state.hydrated).toBe(true);
	});

	it("falls back to empty arrays + console.warn when items JSON is corrupt", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(ITEMS_KEY, "not-valid-json{{{");
		await AsyncStorage.setItem(
			ASSIGNMENTS_KEY,
			JSON.stringify([validAssignment]),
		);

		await hydrateWardrobeStore();

		const state = useWardrobeStore.getState();
		expect(state.items).toEqual([]);
		expect(state.assignments).toEqual([validAssignment]);
		expect(state.hydrated).toBe(true);
		expect(warn).toHaveBeenCalled();

		warn.mockRestore();
	});

	it("falls back to empty arrays when assignments payload has wrong shape", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([validItem]));
		await AsyncStorage.setItem(
			ASSIGNMENTS_KEY,
			JSON.stringify([{ combinationId: 42 }]),
		);

		await hydrateWardrobeStore();

		const state = useWardrobeStore.getState();
		expect(state.items).toEqual([validItem]);
		expect(state.assignments).toEqual([]);
		expect(state.hydrated).toBe(true);
		expect(warn).toHaveBeenCalled();

		warn.mockRestore();
	});

	it("does not call console.warn in production mode (__DEV__ === false)", async () => {
		const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
		Object.defineProperty(globalThis, "__DEV__", {
			value: false,
			configurable: true,
			writable: true,
		});

		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(ITEMS_KEY, "garbage{{");

		await hydrateWardrobeStore();

		expect(warn).not.toHaveBeenCalled();

		warn.mockRestore();
		Object.defineProperty(globalThis, "__DEV__", {
			value: originalDev,
			configurable: true,
			writable: true,
		});
	});

	// AC #7(c): backfills category='top' on a legacy item missing the field
	it("backfills category='top' on a legacy item missing the field (TD-7)", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		const legacyItem = {
			id: "uuid-legacy",
			localImagePath: "file:///items/uuid-legacy.png",
			thumbnailPath: "file:///items/uuid-legacy.thumb.png",
			createdAt: 1_700_000_000_000,
		};
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([legacyItem]));

		await hydrateWardrobeStore();

		const state = useWardrobeStore.getState();
		expect(state.items).toHaveLength(1);
		expect(state.items[0]?.category).toBe("top");
		expect(state.items[0]?.id).toBe("uuid-legacy");
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("backfilled category='top' on 1 legacy item"),
		);

		warn.mockRestore();
	});

	// AC #7(d): mixed payload — preserve explicit + backfill only missing
	it("preserves explicit categories and backfills only the missing ones on a mixed payload", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		const seeded = [
			{
				id: "uuid-a",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.thumb.png",
				category: "bottom",
				createdAt: 1,
			},
			{
				id: "uuid-b",
				localImagePath: "file:///b.png",
				thumbnailPath: "file:///b.thumb.png",
				// legacy: no category
				createdAt: 2,
			},
			{
				id: "uuid-c",
				localImagePath: "file:///c.png",
				thumbnailPath: "file:///c.thumb.png",
				category: "accessory",
				createdAt: 3,
			},
		];
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(seeded));

		await hydrateWardrobeStore();

		const items = useWardrobeStore.getState().items;
		expect(items).toHaveLength(3);
		expect(items.find((i) => i.id === "uuid-a")?.category).toBe("bottom");
		expect(items.find((i) => i.id === "uuid-b")?.category).toBe("top");
		expect(items.find((i) => i.id === "uuid-c")?.category).toBe("accessory");
		// Single aggregate warn (count === 1)
		const backfillWarns = warn.mock.calls.filter((args) =>
			String(args[0]).includes("backfilled category"),
		);
		expect(backfillWarns).toHaveLength(1);
		expect(String(backfillWarns[0]?.[0])).toContain("1 legacy item");

		warn.mockRestore();
	});

	// AC #7(e): backfill warn is silenced when __DEV__ is false
	it("does not emit the backfill warn in production mode (__DEV__ === false)", async () => {
		const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
		Object.defineProperty(globalThis, "__DEV__", {
			value: false,
			configurable: true,
			writable: true,
		});

		const warn = jest.spyOn(console, "warn").mockImplementation();
		const legacyItem = {
			id: "uuid-legacy",
			localImagePath: "file:///a.png",
			thumbnailPath: "file:///a.thumb.png",
			createdAt: 1,
		};
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([legacyItem]));

		await hydrateWardrobeStore();

		expect(useWardrobeStore.getState().items[0]?.category).toBe("top");
		expect(warn).not.toHaveBeenCalled();

		warn.mockRestore();
		Object.defineProperty(globalThis, "__DEV__", {
			value: originalDev,
			configurable: true,
			writable: true,
		});
	});

	// AC #7(f): a foreign category value is rejected — backfill is ONLY for
	// missing keys, invalid values fall through to corrupt-payload path (F1).
	it("rejects records with an invalid category string and falls through to empty-array corrupt-payload path", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		const seeded = [
			{
				id: "uuid-bad",
				localImagePath: "file:///bad.png",
				thumbnailPath: "file:///bad.thumb.png",
				category: "hat",
				createdAt: 1,
			},
		];
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(seeded));

		await hydrateWardrobeStore();

		const state = useWardrobeStore.getState();
		expect(state.items).toEqual([]);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("items parse failed"),
			expect.any(Error),
		);

		warn.mockRestore();
	});

	// P2 (review patch): `category: null` is NOT a missing key — it must be treated as an
	// invalid value and fall through to the corrupt-payload path, NOT backfilled to "top".
	it("rejects records with category: null and falls through to empty-array corrupt-payload path", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		const seeded = [
			{
				id: "uuid-null-cat",
				localImagePath: "file:///null.png",
				thumbnailPath: "file:///null.thumb.png",
				category: null,
				createdAt: 1,
			},
		];
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(seeded));

		await hydrateWardrobeStore();

		const state = useWardrobeStore.getState();
		expect(state.items).toEqual([]);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("items parse failed"),
			expect.any(Error),
		);

		warn.mockRestore();
	});
});

describe("setItems / setAssignments", () => {
	beforeEach(() => {
		(AsyncStorage.setItem as jest.Mock).mockClear();
	});

	it("setItems writes the new array to AsyncStorage", async () => {
		useWardrobeStore.getState().setItems([validItem]);
		await Promise.resolve();

		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			ITEMS_KEY,
			JSON.stringify([validItem]),
		);
	});

	it("setAssignments writes the new array to AsyncStorage", async () => {
		useWardrobeStore.getState().setAssignments([validAssignment]);
		await Promise.resolve();

		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			ASSIGNMENTS_KEY,
			JSON.stringify([validAssignment]),
		);
	});

	it("survives an AsyncStorage write rejection without throwing", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		(AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
			new Error("disk full"),
		);

		expect(() =>
			useWardrobeStore.getState().setItems([validItem]),
		).not.toThrow();
		expect(useWardrobeStore.getState().items).toEqual([validItem]);

		await Promise.resolve();
		await Promise.resolve();
		expect(warn).toHaveBeenCalled();

		warn.mockRestore();
	});
});

describe("subscriber reactivity", () => {
	it("re-renders subscribed components when items mutate", () => {
		const { result } = renderHook(() => useWardrobeStore((s) => s.items));

		expect(result.current).toEqual([]);

		act(() => {
			useWardrobeStore.getState().setItems([validItem]);
		});

		expect(result.current).toEqual([validItem]);
	});

	it("re-renders subscribed components when assignments mutate", () => {
		const { result } = renderHook(() => useWardrobeStore((s) => s.assignments));

		expect(result.current).toEqual([]);

		act(() => {
			useWardrobeStore.getState().setAssignments([validAssignment]);
		});

		expect(result.current).toEqual([validAssignment]);
	});
});
