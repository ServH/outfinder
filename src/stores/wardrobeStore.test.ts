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
	createdAt: 1_700_000_000_000,
};

const validAssignment = {
	combinationId: 17,
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
			JSON.stringify([{ combinationId: "not-a-number" }]),
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
