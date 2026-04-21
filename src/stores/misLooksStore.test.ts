import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import {
	ASSIGNMENTS_KEY,
	FAVORITES_KEY,
	hydrateMisLooksStore,
	ITEMS_KEY,
	useMisLooksStore,
} from "./misLooksStore";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

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
	useMisLooksStore.setState({
		items: [],
		assignments: [],
		favorites: new Set(),
		hydrated: false,
	});
});

describe("hydrateMisLooksStore", () => {
	it("populates state from seeded AsyncStorage on all three keys", async () => {
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([validItem]));
		await AsyncStorage.setItem(
			ASSIGNMENTS_KEY,
			JSON.stringify([validAssignment]),
		);
		await AsyncStorage.setItem(
			FAVORITES_KEY,
			JSON.stringify(["combo-a", "combo-b"]),
		);

		await hydrateMisLooksStore();

		const state = useMisLooksStore.getState();
		expect(state.items).toEqual([validItem]);
		expect(state.assignments).toEqual([validAssignment]);
		expect(state.favorites).toEqual(new Set(["combo-a", "combo-b"]));
		expect(state.hydrated).toBe(true);
	});

	it("falls back to empty arrays + console.warn when items JSON is corrupt", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(ITEMS_KEY, "not-valid-json{{{");
		await AsyncStorage.setItem(
			ASSIGNMENTS_KEY,
			JSON.stringify([validAssignment]),
		);

		await hydrateMisLooksStore();

		const state = useMisLooksStore.getState();
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

		await hydrateMisLooksStore();

		const state = useMisLooksStore.getState();
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

		await hydrateMisLooksStore();

		expect(warn).not.toHaveBeenCalled();

		warn.mockRestore();
		Object.defineProperty(globalThis, "__DEV__", {
			value: originalDev,
			configurable: true,
			writable: true,
		});
	});

	// TD-7: backfills category='top' on a legacy item missing the field.
	it("backfills category='top' on a legacy item missing the field", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		const legacyItem = {
			id: "uuid-legacy",
			localImagePath: "file:///items/uuid-legacy.png",
			thumbnailPath: "file:///items/uuid-legacy.thumb.png",
			createdAt: 1_700_000_000_000,
		};
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([legacyItem]));

		await hydrateMisLooksStore();

		const state = useMisLooksStore.getState();
		expect(state.items).toHaveLength(1);
		expect(state.items[0]?.category).toBe("top");
		expect(state.items[0]?.id).toBe("uuid-legacy");
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("backfilled category='top' on 1 legacy item"),
		);

		warn.mockRestore();
	});

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

		await hydrateMisLooksStore();

		const items = useMisLooksStore.getState().items;
		expect(items).toHaveLength(3);
		expect(items.find((i) => i.id === "uuid-a")?.category).toBe("bottom");
		expect(items.find((i) => i.id === "uuid-b")?.category).toBe("top");
		expect(items.find((i) => i.id === "uuid-c")?.category).toBe("accessory");
		const backfillWarns = warn.mock.calls.filter((args) =>
			String(args[0]).includes("backfilled category"),
		);
		expect(backfillWarns).toHaveLength(1);
		expect(String(backfillWarns[0]?.[0])).toContain("1 legacy item");

		warn.mockRestore();
	});

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

		await hydrateMisLooksStore();

		expect(useMisLooksStore.getState().items[0]?.category).toBe("top");
		expect(warn).not.toHaveBeenCalled();

		warn.mockRestore();
		Object.defineProperty(globalThis, "__DEV__", {
			value: originalDev,
			configurable: true,
			writable: true,
		});
	});

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

		await hydrateMisLooksStore();

		const state = useMisLooksStore.getState();
		expect(state.items).toEqual([]);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("items parse failed"),
			expect.any(Error),
		);

		warn.mockRestore();
	});

	// `category: null` is NOT a missing key — it must be treated as an invalid
	// value and fall through to the corrupt-payload path, NOT backfilled to "top".
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

		await hydrateMisLooksStore();

		const state = useMisLooksStore.getState();
		expect(state.items).toEqual([]);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("items parse failed"),
			expect.any(Error),
		);

		warn.mockRestore();
	});

	// AC #12(d): per-slice corrupt-payload isolation extended to favorites.
	it("isolates a corrupt favorites payload: items + assignments stay intact, favorites → empty Set", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify([validItem]));
		await AsyncStorage.setItem(
			ASSIGNMENTS_KEY,
			JSON.stringify([validAssignment]),
		);
		await AsyncStorage.setItem(FAVORITES_KEY, "garbage{{{");

		await hydrateMisLooksStore();

		const state = useMisLooksStore.getState();
		expect(state.items).toEqual([validItem]);
		expect(state.assignments).toEqual([validAssignment]);
		expect(state.favorites).toEqual(new Set());
		expect(state.hydrated).toBe(true);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("favorites parse failed"),
			expect.any(Error),
		);

		warn.mockRestore();
	});

	it("rejects a favorites payload that is an array of non-strings", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([1, 2, 3]));

		await hydrateMisLooksStore();

		expect(useMisLooksStore.getState().favorites).toEqual(new Set());
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("favorites parse failed"),
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
		useMisLooksStore.getState().setItems([validItem]);
		await Promise.resolve();

		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			ITEMS_KEY,
			JSON.stringify([validItem]),
		);
	});

	it("setAssignments writes the new array to AsyncStorage", async () => {
		useMisLooksStore.getState().setAssignments([validAssignment]);
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
			useMisLooksStore.getState().setItems([validItem]),
		).not.toThrow();
		expect(useMisLooksStore.getState().items).toEqual([validItem]);

		await Promise.resolve();
		await Promise.resolve();
		expect(warn).toHaveBeenCalled();

		warn.mockRestore();
	});
});

describe("subscriber reactivity", () => {
	it("re-renders subscribed components when items mutate", () => {
		const { result } = renderHook(() => useMisLooksStore((s) => s.items));

		expect(result.current).toEqual([]);

		act(() => {
			useMisLooksStore.getState().setItems([validItem]);
		});

		expect(result.current).toEqual([validItem]);
	});

	it("re-renders subscribed components when assignments mutate", () => {
		const { result } = renderHook(() => useMisLooksStore((s) => s.assignments));

		expect(result.current).toEqual([]);

		act(() => {
			useMisLooksStore.getState().setAssignments([validAssignment]);
		});

		expect(result.current).toEqual([validAssignment]);
	});

	it("re-renders subscribed components when favorites mutate", () => {
		const { result } = renderHook(() => useMisLooksStore((s) => s.favorites));

		expect(result.current).toEqual(new Set());

		act(() => {
			useMisLooksStore.getState().addFavorite("combo-a");
		});

		expect(result.current).toEqual(new Set(["combo-a"]));
	});
});

// AC #12(a,b): favorites slice — port of the deleted FavoritesContext tests.
// `addFavorite` / `removeFavorite` / `toggleFavorite` / `isFavorite` preserve
// the exact semantics of the old useFavorites() hook.
describe("favorites slice actions", () => {
	beforeEach(() => {
		(AsyncStorage.setItem as jest.Mock).mockClear();
	});

	it("addFavorite adds an id and persists the new set as a JSON array", async () => {
		useMisLooksStore.getState().addFavorite("combo-a");

		expect(useMisLooksStore.getState().favorites).toEqual(new Set(["combo-a"]));
		await Promise.resolve();
		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			FAVORITES_KEY,
			JSON.stringify(["combo-a"]),
		);
	});

	it("addFavorite is a no-op when the id is already present (no new write)", async () => {
		useMisLooksStore.setState({ favorites: new Set(["combo-a"]) });
		(AsyncStorage.setItem as jest.Mock).mockClear();

		useMisLooksStore.getState().addFavorite("combo-a");

		await Promise.resolve();
		expect(AsyncStorage.setItem).not.toHaveBeenCalled();
	});

	it("removeFavorite removes an id and persists the new set", async () => {
		useMisLooksStore.setState({ favorites: new Set(["combo-a", "combo-b"]) });
		(AsyncStorage.setItem as jest.Mock).mockClear();

		useMisLooksStore.getState().removeFavorite("combo-a");

		expect(useMisLooksStore.getState().favorites).toEqual(new Set(["combo-b"]));
		await Promise.resolve();
		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			FAVORITES_KEY,
			JSON.stringify(["combo-b"]),
		);
	});

	it("removeFavorite is a no-op when the id is absent", async () => {
		useMisLooksStore.setState({ favorites: new Set(["combo-a"]) });
		(AsyncStorage.setItem as jest.Mock).mockClear();

		useMisLooksStore.getState().removeFavorite("combo-missing");

		await Promise.resolve();
		expect(AsyncStorage.setItem).not.toHaveBeenCalled();
	});

	it("toggleFavorite adds an absent id", async () => {
		useMisLooksStore.getState().toggleFavorite("combo-new");

		expect(useMisLooksStore.getState().favorites).toEqual(
			new Set(["combo-new"]),
		);
		await Promise.resolve();
		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			FAVORITES_KEY,
			JSON.stringify(["combo-new"]),
		);
	});

	it("toggleFavorite removes a present id", async () => {
		useMisLooksStore.setState({
			favorites: new Set(["combo-keep", "combo-drop"]),
		});
		(AsyncStorage.setItem as jest.Mock).mockClear();

		useMisLooksStore.getState().toggleFavorite("combo-drop");

		expect(useMisLooksStore.getState().favorites).toEqual(
			new Set(["combo-keep"]),
		);
		await Promise.resolve();
		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			FAVORITES_KEY,
			JSON.stringify(["combo-keep"]),
		);
	});

	it("isFavorite returns true when the id is in the set, false otherwise", () => {
		useMisLooksStore.setState({ favorites: new Set(["combo-a"]) });

		expect(useMisLooksStore.getState().isFavorite("combo-a")).toBe(true);
		expect(useMisLooksStore.getState().isFavorite("combo-b")).toBe(false);
	});

	it("favorites.size reflects the count of stored favorites", () => {
		useMisLooksStore.setState({
			favorites: new Set(["combo-a", "combo-b", "combo-c"]),
		});

		expect(useMisLooksStore.getState().favorites.size).toBe(3);
	});

	it("survives an AsyncStorage write rejection on favorites without throwing", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		(AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
			new Error("disk full"),
		);

		expect(() =>
			useMisLooksStore.getState().addFavorite("combo-a"),
		).not.toThrow();
		expect(useMisLooksStore.getState().favorites).toEqual(new Set(["combo-a"]));

		await Promise.resolve();
		await Promise.resolve();
		expect(warn).toHaveBeenCalled();

		warn.mockRestore();
	});

	it("favorites persist + hydrate round-trip preserves the full set", async () => {
		useMisLooksStore.getState().addFavorite("combo-a");
		useMisLooksStore.getState().addFavorite("combo-b");
		useMisLooksStore.getState().addFavorite("combo-c");

		// Flush the async persist side-effects.
		await Promise.resolve();
		await Promise.resolve();

		useMisLooksStore.setState({
			items: [],
			assignments: [],
			favorites: new Set(),
			hydrated: false,
		});
		await hydrateMisLooksStore();

		expect(useMisLooksStore.getState().favorites).toEqual(
			new Set(["combo-a", "combo-b", "combo-c"]),
		);
	});
});

// AC #12(c): updateItemCategory mutates the item in-place and persists.
// Story 14.12b will consume this action — shipping it here keeps the store
// API closed per ADR-005.
describe("updateItemCategory", () => {
	beforeEach(() => {
		(AsyncStorage.setItem as jest.Mock).mockClear();
	});

	it("swaps the category of the matching item and persists the items array", async () => {
		useMisLooksStore.setState({ items: [validItem] });
		(AsyncStorage.setItem as jest.Mock).mockClear();

		useMisLooksStore.getState().updateItemCategory(validItem.id, "bottom");

		expect(useMisLooksStore.getState().items[0]?.category).toBe("bottom");
		await Promise.resolve();
		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			ITEMS_KEY,
			JSON.stringify([{ ...validItem, category: "bottom" }]),
		);
	});

	it("leaves non-matching items untouched", () => {
		const other = { ...validItem, id: "uuid-other" };
		useMisLooksStore.setState({ items: [validItem, other] });

		useMisLooksStore.getState().updateItemCategory(validItem.id, "footwear");

		const items = useMisLooksStore.getState().items;
		expect(items.find((i) => i.id === validItem.id)?.category).toBe("footwear");
		expect(items.find((i) => i.id === other.id)?.category).toBe("top");
	});

	it("is a silent no-op when the id is missing (no throw)", () => {
		useMisLooksStore.setState({ items: [validItem] });

		expect(() =>
			useMisLooksStore.getState().updateItemCategory("uuid-ghost", "accessory"),
		).not.toThrow();
		expect(useMisLooksStore.getState().items).toEqual([validItem]);
	});
});
