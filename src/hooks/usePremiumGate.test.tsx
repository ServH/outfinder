import { act, renderHook } from "@testing-library/react-native";
import { PURCHASES_ERROR_CODE } from "react-native-purchases";
import { usePremium } from "@/contexts/PremiumContext";
import { hapticLight, hapticRigid } from "@/lib/haptics";
import { usePremiumGate } from "./usePremiumGate";

jest.mock("@/lib/haptics");
jest.mock("@/contexts/PremiumContext");
jest.mock("@/data/colorIndex", () => ({
	getCombination: (id: string) =>
		id === "combo-1"
			? {
					id: "combo-1",
					nameEn: "Test Combo",
					nameJp: "テスト",
					colors: [
						{
							id: "c1",
							hex: "#FF0000",
							nameEn: "Red",
							nameJp: "赤",
							swatchGroup: 1,
							combinationCount: 5,
						},
					],
				}
			: undefined,
}));

const mockUsePremium = usePremium as jest.Mock;

const basePremiumMock = {
	isPremium: false,
	loading: false,
	paywallDismissedThisSession: false,
	setPaywallDismissedThisSession: jest.fn(),
	priceString: "€0.99",
	purchase: jest.fn().mockResolvedValue(undefined),
	restore: jest.fn().mockResolvedValue(undefined),
};

function setup(overrides = {}) {
	mockUsePremium.mockReturnValue({ ...basePremiumMock, ...overrides });
	const favorites = new Set(["combo-1"]);
	return renderHook(() => usePremiumGate(favorites));
}

describe("usePremiumGate", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("starts with idle purchaseState and null errorMessage", () => {
		const { result } = setup();
		expect(result.current.purchaseState).toBe("idle");
		expect(result.current.errorMessage).toBeNull();
	});

	// Purchase state transitions
	describe("handlePurchase", () => {
		it("transitions to purchasing on call", async () => {
			let resolvePromise: () => void;
			const purchase = jest.fn(
				() =>
					new Promise<void>((resolve) => {
						resolvePromise = resolve;
					}),
			);
			const { result } = setup({ purchase });
			const toggleFavorite = jest.fn();

			// Open paywall first
			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			act(() => {
				result.current.handlePurchase(toggleFavorite);
			});

			expect(result.current.purchaseState).toBe("purchasing");

			await act(async () => {
				resolvePromise!();
			});

			expect(result.current.purchaseState).toBe("idle");
			expect(hapticRigid).toHaveBeenCalled();
			expect(toggleFavorite).toHaveBeenCalledWith("combo-1");
		});

		it("resets to idle on user cancellation (not error)", async () => {
			const cancelError = {
				code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
			};
			const purchase = jest.fn().mockRejectedValue(cancelError);
			const { result } = setup({ purchase });
			const toggleFavorite = jest.fn();

			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			await act(async () => {
				await result.current.handlePurchase(toggleFavorite);
			});

			expect(result.current.purchaseState).toBe("idle");
			expect(result.current.errorMessage).toBeNull();
		});

		it("sets error state with network error message", async () => {
			const networkError = {
				code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
			};
			const purchase = jest.fn().mockRejectedValue(networkError);
			const { result } = setup({ purchase });
			const toggleFavorite = jest.fn();

			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			await act(async () => {
				await result.current.handlePurchase(toggleFavorite);
			});

			expect(result.current.purchaseState).toBe("error");
			expect(result.current.errorMessage).toBe(
				"Check your internet connection and try again.",
			);
		});

		it("sets error state with store problem message", async () => {
			const storeError = {
				code: PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR,
			};
			const purchase = jest.fn().mockRejectedValue(storeError);
			const { result } = setup({ purchase });

			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			await act(async () => {
				await result.current.handlePurchase(jest.fn());
			});

			expect(result.current.errorMessage).toBe(
				"The App Store is temporarily unavailable. Try again later.",
			);
		});

		it("sets error state with purchase not allowed message", async () => {
			const notAllowedError = {
				code: PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR,
			};
			const purchase = jest.fn().mockRejectedValue(notAllowedError);
			const { result } = setup({ purchase });

			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			await act(async () => {
				await result.current.handlePurchase(jest.fn());
			});

			expect(result.current.errorMessage).toBe(
				"In-app purchases are disabled on this device.",
			);
		});

		it("sets generic error message for unknown errors", async () => {
			const unknownError = new Error("No package available");
			const purchase = jest.fn().mockRejectedValue(unknownError);
			const { result } = setup({ purchase });

			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			await act(async () => {
				await result.current.handlePurchase(jest.fn());
			});

			expect(result.current.errorMessage).toBe(
				"Something went wrong. Please try again.",
			);
		});

		it("auto-clears error after 5 seconds", async () => {
			const purchase = jest
				.fn()
				.mockRejectedValue({ code: PURCHASES_ERROR_CODE.NETWORK_ERROR });
			const { result } = setup({ purchase });

			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			await act(async () => {
				await result.current.handlePurchase(jest.fn());
			});

			expect(result.current.purchaseState).toBe("error");

			act(() => {
				jest.advanceTimersByTime(5000);
			});

			expect(result.current.purchaseState).toBe("idle");
			expect(result.current.errorMessage).toBeNull();
		});
	});

	// Restore state transitions
	describe("handleRestore", () => {
		it("transitions to restoring on call", async () => {
			let resolvePromise: () => void;
			const restore = jest.fn(
				() =>
					new Promise<void>((resolve) => {
						resolvePromise = resolve;
					}),
			);
			const { result } = setup({ restore });

			act(() => {
				result.current.handleRestore();
			});

			expect(result.current.purchaseState).toBe("restoring");

			await act(async () => {
				resolvePromise!();
			});

			expect(result.current.purchaseState).toBe("idle");
			expect(hapticLight).toHaveBeenCalled();
		});

		it("sets error with no previous purchase message", async () => {
			const restore = jest
				.fn()
				.mockRejectedValue(new Error("No previous purchase found"));
			const { result } = setup({ restore });

			await act(async () => {
				await result.current.handleRestore();
			});

			expect(result.current.purchaseState).toBe("error");
			expect(result.current.errorMessage).toBe(
				"No previous purchase found for this Apple ID.",
			);
		});

		it("sets error with network message for restore network errors", async () => {
			const restore = jest.fn().mockRejectedValue({
				code: PURCHASES_ERROR_CODE.NETWORK_ERROR,
			});
			const { result } = setup({ restore });

			await act(async () => {
				await result.current.handleRestore();
			});

			expect(result.current.errorMessage).toBe(
				"Check your internet connection and try again.",
			);
		});

		it("auto-clears restore error after 5 seconds", async () => {
			const restore = jest
				.fn()
				.mockRejectedValue(new Error("No previous purchase found"));
			const { result } = setup({ restore });

			await act(async () => {
				await result.current.handleRestore();
			});

			expect(result.current.purchaseState).toBe("error");

			act(() => {
				jest.advanceTimersByTime(5000);
			});

			expect(result.current.purchaseState).toBe("idle");
			expect(result.current.errorMessage).toBeNull();
		});
	});

	// Dismiss clears error state
	describe("handleDismiss", () => {
		it("clears error state on dismiss", async () => {
			const purchase = jest
				.fn()
				.mockRejectedValue({ code: PURCHASES_ERROR_CODE.NETWORK_ERROR });
			const { result } = setup({ purchase });

			act(() => {
				result.current.handlePremiumGate("combo-1");
			});

			await act(async () => {
				await result.current.handlePurchase(jest.fn());
			});

			expect(result.current.purchaseState).toBe("error");

			act(() => {
				result.current.handleDismiss();
			});

			expect(result.current.purchaseState).toBe("idle");
			expect(result.current.errorMessage).toBeNull();
		});
	});
});
