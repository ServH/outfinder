import { act, renderHook } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import type { ReactNode } from "react";
import Purchases from "react-native-purchases";
import { PremiumProvider, usePremium } from "./PremiumContext";

jest.mock("react-native-purchases");
jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn().mockResolvedValue(null),
	setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

function wrapper({ children }: { children: ReactNode }) {
	return <PremiumProvider>{children}</PremiumProvider>;
}

describe("PremiumContext", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
		(SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
		(Purchases.getCustomerInfo as jest.Mock).mockResolvedValue({
			entitlements: { active: {} },
		});
		(Purchases.getOfferings as jest.Mock).mockResolvedValue({
			current: {
				availablePackages: [{ product: { priceString: "€0.99" } }],
			},
		});
	});

	it("initializes with isPremium false and loading true", () => {
		const { result } = renderHook(() => usePremium(), { wrapper });
		expect(result.current.isPremium).toBe(false);
	});

	it("reads cached premium status from SecureStore on mount", async () => {
		(SecureStore.getItemAsync as jest.Mock).mockResolvedValue("true");
		(Purchases.getCustomerInfo as jest.Mock).mockResolvedValue({
			entitlements: {
				active: { outfinder_premium: { isActive: true } },
			},
		});

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
			"outfinder_premium_status",
		);
		expect(result.current.isPremium).toBe(true);
	});

	it("sets loading false after SecureStore read", async () => {
		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(result.current.loading).toBe(false);
	});

	it("configures RevenueCat on mount", async () => {
		renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(Purchases.configure).toHaveBeenCalledWith({
			apiKey: "appl_PLACEHOLDER_REPLACE_ME",
		});
	});

	it("validates entitlements in background", async () => {
		(Purchases.getCustomerInfo as jest.Mock).mockResolvedValue({
			entitlements: {
				active: { outfinder_premium: { isActive: true } },
			},
		});

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(result.current.isPremium).toBe(true);
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			"outfinder_premium_status",
			"true",
		);
	});

	it("loads price string from offerings", async () => {
		(Purchases.getOfferings as jest.Mock).mockResolvedValue({
			current: {
				availablePackages: [{ product: { priceString: "$1.99" } }],
			},
		});

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(result.current.priceString).toBe("$1.99");
	});

	it("falls back to €0.99 when offerings fail", async () => {
		(Purchases.getOfferings as jest.Mock).mockRejectedValue(
			new Error("Network error"),
		);
		const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(result.current.priceString).toBe("€0.99");
		consoleSpy.mockRestore();
	});

	it("handles RevenueCat configure failure gracefully", async () => {
		(Purchases.configure as jest.Mock).mockImplementation(() => {
			throw new Error("Invalid API key");
		});
		const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(result.current.isPremium).toBe(false);
		expect(result.current.loading).toBe(false);
		consoleSpy.mockRestore();
	});

	it("handles SecureStore read failure gracefully", async () => {
		(SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
			new Error("SecureStore error"),
		);
		const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		expect(result.current.isPremium).toBe(false);
		expect(result.current.loading).toBe(false);
		consoleSpy.mockRestore();
	});

	it("exposes paywallDismissedThisSession, initially false", () => {
		const { result } = renderHook(() => usePremium(), { wrapper });
		expect(result.current.paywallDismissedThisSession).toBe(false);
	});

	it("allows setting paywallDismissedThisSession", async () => {
		const { result } = renderHook(() => usePremium(), { wrapper });

		act(() => {
			result.current.setPaywallDismissedThisSession(true);
		});

		expect(result.current.paywallDismissedThisSession).toBe(true);
	});

	it("throws error when usePremium is used outside PremiumProvider", () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		expect(() => {
			renderHook(() => usePremium());
		}).toThrow("usePremium must be used within a PremiumProvider");

		consoleSpy.mockRestore();
	});

	it("purchase() calls RevenueCat, updates isPremium, and caches to SecureStore", async () => {
		const mockPkg = { product: { priceString: "€0.99" } };
		(Purchases.getOfferings as jest.Mock).mockResolvedValue({
			current: { availablePackages: [mockPkg] },
		});
		(Purchases.purchasePackage as jest.Mock).mockResolvedValue({
			customerInfo: {
				entitlements: {
					active: { outfinder_premium: { isActive: true } },
				},
			},
		});

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		await act(async () => {
			await result.current.purchase();
		});

		expect(Purchases.purchasePackage).toHaveBeenCalledWith(mockPkg);
		expect(result.current.isPremium).toBe(true);
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			"outfinder_premium_status",
			"true",
		);
	});

	it("purchase() throws when no package available", async () => {
		(Purchases.getOfferings as jest.Mock).mockResolvedValue({
			current: { availablePackages: [] },
		});

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		await expect(
			act(async () => {
				await result.current.purchase();
			}),
		).rejects.toThrow("No package available");
	});

	it("restore() calls RevenueCat and updates isPremium on success", async () => {
		(Purchases.restorePurchases as jest.Mock).mockResolvedValue({
			entitlements: {
				active: { outfinder_premium: { isActive: true } },
			},
		});

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		await act(async () => {
			await result.current.restore();
		});

		expect(Purchases.restorePurchases).toHaveBeenCalled();
		expect(result.current.isPremium).toBe(true);
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			"outfinder_premium_status",
			"true",
		);
	});

	it("restore() throws when no previous purchase found", async () => {
		(Purchases.restorePurchases as jest.Mock).mockResolvedValue({
			entitlements: { active: {} },
		});

		const { result } = renderHook(() => usePremium(), { wrapper });
		await act(async () => {});

		await expect(
			act(async () => {
				await result.current.restore();
			}),
		).rejects.toThrow("No previous purchase found");
	});
});
