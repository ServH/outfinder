import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useCoachMark } from "./useCoachMark";

const TEST_KEY = "@outfinder/coachmark:test-firstuse";

describe("useCoachMark", () => {
	let warnSpy: jest.SpyInstance;

	beforeEach(async () => {
		await AsyncStorage.clear();
		warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it("flips shouldShow to true on first mount when storage returns null", async () => {
		const { result } = renderHook(() => useCoachMark(TEST_KEY));

		expect(result.current.shouldShow).toBe(false);

		await waitFor(() => expect(result.current.shouldShow).toBe(true));
	});

	it("markSeen() writes 'true' to AsyncStorage and flips shouldShow to false", async () => {
		const setItemSpy = jest.spyOn(AsyncStorage, "setItem");
		const { result } = renderHook(() => useCoachMark(TEST_KEY));

		await waitFor(() => expect(result.current.shouldShow).toBe(true));

		await act(async () => {
			await result.current.markSeen();
		});

		expect(result.current.shouldShow).toBe(false);
		expect(setItemSpy).toHaveBeenCalledWith(TEST_KEY, "true");
	});

	it("keeps shouldShow=false on subsequent mount when key is already 'true'", async () => {
		await AsyncStorage.setItem(TEST_KEY, "true");

		const { result } = renderHook(() => useCoachMark(TEST_KEY));

		// Wait a microtask for the effect to resolve.
		await waitFor(() => {
			expect(result.current.shouldShow).toBe(false);
		});

		// Stays false for the lifetime of the hook.
		expect(result.current.shouldShow).toBe(false);
	});

	it("fails closed (shouldShow=false) when AsyncStorage.getItem rejects", async () => {
		const getItemSpy = jest
			.spyOn(AsyncStorage, "getItem")
			.mockRejectedValueOnce(new Error("disk full"));

		const { result } = renderHook(() => useCoachMark(TEST_KEY));

		// Give the effect a tick to settle.
		await act(async () => {
			await Promise.resolve();
		});

		expect(result.current.shouldShow).toBe(false);
		expect(warnSpy).toHaveBeenCalled();

		getItemSpy.mockRestore();
	});
});
