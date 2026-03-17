import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { FavoritesProvider, useFavorites } from "./FavoritesContext";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function wrapper({ children }: { children: ReactNode }) {
	return <FavoritesProvider>{children}</FavoritesProvider>;
}

describe("FavoritesContext", () => {
	beforeEach(() => {
		(AsyncStorage.getItem as jest.Mock).mockClear();
		(AsyncStorage.setItem as jest.Mock).mockClear();
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
	});

	it("initializes with empty favorites from empty storage", async () => {
		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});

		expect(result.current.favorites.size).toBe(0);
		expect(result.current.count).toBe(0);
	});

	it("loads existing favorites from AsyncStorage on mount", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
			JSON.stringify(["combo-1", "combo-2"]),
		);

		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});

		expect(result.current.favorites.size).toBe(2);
		expect(result.current.isFavorite("combo-1")).toBe(true);
		expect(result.current.isFavorite("combo-2")).toBe(true);
		expect(result.current.count).toBe(2);
	});

	it("adds a favorite via toggleFavorite", async () => {
		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});
		await act(async () => {
			result.current.toggleFavorite("combo-5");
		});

		expect(result.current.isFavorite("combo-5")).toBe(true);
		expect(result.current.count).toBe(1);
	});

	it("removes a favorite via toggleFavorite", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
			JSON.stringify(["combo-5"]),
		);

		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});
		expect(result.current.isFavorite("combo-5")).toBe(true);

		await act(async () => {
			result.current.toggleFavorite("combo-5");
		});

		expect(result.current.isFavorite("combo-5")).toBe(false);
		expect(result.current.count).toBe(0);
	});

	it("persists favorites to AsyncStorage on toggle", async () => {
		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});
		await act(async () => {
			result.current.toggleFavorite("combo-10");
		});

		expect(AsyncStorage.setItem).toHaveBeenCalledWith(
			"@outfinder/favorites",
			JSON.stringify(["combo-10"]),
		);
	});

	it("isFavorite returns false for non-favorited IDs", async () => {
		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});

		expect(result.current.isFavorite("nonexistent")).toBe(false);
	});

	it("count reflects the current number of favorites", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(
			JSON.stringify(["a", "b", "c"]),
		);

		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});

		expect(result.current.count).toBe(3);

		await act(async () => {
			result.current.toggleFavorite("d");
		});

		expect(result.current.count).toBe(4);

		await act(async () => {
			result.current.toggleFavorite("a");
		});

		expect(result.current.count).toBe(3);
	});

	it("handles AsyncStorage read errors gracefully", async () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();
		(AsyncStorage.getItem as jest.Mock).mockRejectedValue(
			new Error("Storage read error"),
		);

		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});

		expect(result.current.favorites.size).toBe(0);
		consoleSpy.mockRestore();
	});

	it("handles AsyncStorage write errors gracefully without throwing", async () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();
		(AsyncStorage.setItem as jest.Mock).mockRejectedValue(
			new Error("Storage write error"),
		);

		const { result } = renderHook(() => useFavorites(), { wrapper });

		await act(async () => {});
		await act(async () => {
			result.current.toggleFavorite("combo-1");
		});

		// State should still update even if persistence fails
		expect(result.current.isFavorite("combo-1")).toBe(true);
		consoleSpy.mockRestore();
	});
});
