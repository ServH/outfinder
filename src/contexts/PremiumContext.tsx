import * as SecureStore from "expo-secure-store";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import Purchases from "react-native-purchases";
import { PREMIUM_CONFIG } from "@/config/premium";

const SECURE_STORE_KEY = "outfinder_premium_status";

interface PremiumContextValue {
	isPremium: boolean;
	loading: boolean;
	paywallDismissedThisSession: boolean;
	setPaywallDismissedThisSession: (dismissed: boolean) => void;
	priceString: string;
	purchase: () => Promise<void>;
	restore: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export interface PremiumProviderProps {
	children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
	const [isPremium, setIsPremium] = useState(false);
	const [loading, setLoading] = useState(true);
	const [paywallDismissedThisSession, setPaywallDismissedThisSession] =
		useState(false);
	const [priceString, setPriceString] = useState("€0.99");

	useEffect(() => {
		async function init() {
			// 1. Load cached status from SecureStore (instant offline access)
			try {
				const cached = await SecureStore.getItemAsync(SECURE_STORE_KEY);
				if (cached === "true") {
					setIsPremium(true);
				}
			} catch (error) {
				console.warn("Failed to read premium status from SecureStore:", error);
			}
			setLoading(false);

			// 2. Initialize RevenueCat (graceful failure)
			try {
				Purchases.configure({
					apiKey: PREMIUM_CONFIG.REVENUECAT_API_KEY,
				});
			} catch (error) {
				console.warn("RevenueCat configure failed:", error);
				return;
			}

			// 3. Background-validate entitlements (non-blocking)
			try {
				const customerInfo = await Purchases.getCustomerInfo();
				const active =
					customerInfo.entitlements.active[PREMIUM_CONFIG.ENTITLEMENT_ID] !==
					undefined;
				setIsPremium(active);
				await SecureStore.setItemAsync(
					SECURE_STORE_KEY,
					active ? "true" : "false",
				);
			} catch (error) {
				console.warn("Failed to validate entitlements:", error);
			}

			// 4. Load offering for price
			try {
				const offerings = await Purchases.getOfferings();
				const price =
					offerings.current?.availablePackages[0]?.product.priceString;
				if (price) {
					setPriceString(price);
				}
			} catch (error) {
				console.warn("Failed to load offerings:", error);
			}
		}

		init();
	}, []);

	const purchase = useCallback(async () => {
		const offerings = await Purchases.getOfferings();
		const pkg = offerings.current?.availablePackages[0];
		if (!pkg) {
			throw new Error("No package available");
		}
		const { customerInfo } = await Purchases.purchasePackage(pkg);
		const active =
			customerInfo.entitlements.active[PREMIUM_CONFIG.ENTITLEMENT_ID] !==
			undefined;
		if (active) {
			setIsPremium(true);
			await SecureStore.setItemAsync(SECURE_STORE_KEY, "true");
		}
	}, []);

	const restore = useCallback(async () => {
		const customerInfo = await Purchases.restorePurchases();
		const active =
			customerInfo.entitlements.active[PREMIUM_CONFIG.ENTITLEMENT_ID] !==
			undefined;
		setIsPremium(active);
		await SecureStore.setItemAsync(SECURE_STORE_KEY, active ? "true" : "false");
		if (!active) {
			throw new Error("No previous purchase found");
		}
	}, []);

	const value = useMemo(
		() => ({
			isPremium,
			loading,
			paywallDismissedThisSession,
			setPaywallDismissedThisSession,
			priceString,
			purchase,
			restore,
		}),
		[
			isPremium,
			loading,
			paywallDismissedThisSession,
			priceString,
			purchase,
			restore,
		],
	);

	return (
		<PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
	);
}

export function usePremium(): PremiumContextValue {
	const context = useContext(PremiumContext);
	if (!context) {
		throw new Error("usePremium must be used within a PremiumProvider");
	}
	return context;
}
