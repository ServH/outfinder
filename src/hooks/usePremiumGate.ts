import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { PURCHASES_ERROR_CODE } from "react-native-purchases";
import { usePremium } from "@/contexts/PremiumContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { i18n } from "@/i18n";
import { hapticLight, hapticRigid } from "@/lib/haptics";

export type PurchaseState = "idle" | "purchasing" | "restoring" | "error";

export interface PremiumGateState {
	isPremium: boolean;
	paywallVisible: boolean;
	blockedCombination: Combination | undefined;
	toastVisible: boolean;
	toastOpacity: Animated.Value;
	favoriteCombinationIds: string[];
	priceString: string;
	purchaseState: PurchaseState;
	errorMessage: string | null;
	handlePremiumGate: (combinationId: string) => void;
	handleDismiss: () => void;
	handlePurchase: (toggleFavorite: (id: string) => void) => Promise<void>;
	handleRestore: () => Promise<void>;
	openPaywall: () => void;
}

function getPurchaseErrorMessage(error: unknown): string | null {
	const code = (error as { code?: string })?.code;
	if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
		return null; // Silent — user cancelled
	}
	if (code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
		return i18n.t("iap.networkError");
	}
	if (code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
		return i18n.t("iap.storeUnavailable");
	}
	if (code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
		return i18n.t("iap.purchasesDisabled");
	}
	return i18n.t("iap.genericError");
}

export function getRestoreErrorMessage(error: unknown): string {
	const message = (error as { message?: string })?.message;
	if (message === "No previous purchase found") {
		return i18n.t("iap.noPreviousPurchase");
	}
	const code = (error as { code?: string })?.code;
	if (code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
		return i18n.t("iap.networkError");
	}
	return i18n.t("iap.genericError");
}

export function usePremiumGate(favorites: Set<string>): PremiumGateState {
	const {
		isPremium,
		setPaywallDismissedThisSession,
		priceString,
		purchase,
		restore,
	} = usePremium();

	const [paywallVisible, setPaywallVisible] = useState(false);
	const [blockedCombinationId, setBlockedCombinationId] = useState<
		string | null
	>(null);
	const [toastVisible, setToastVisible] = useState(false);
	const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const toastOpacity = useRef(new Animated.Value(0)).current;
	const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const errorTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	useEffect(() => {
		return () => {
			if (toastTimeout.current) {
				clearTimeout(toastTimeout.current);
			}
			if (errorTimeout.current) {
				clearTimeout(errorTimeout.current);
			}
		};
	}, []);

	const clearError = useCallback(() => {
		setPurchaseState("idle");
		setErrorMessage(null);
		if (errorTimeout.current) {
			clearTimeout(errorTimeout.current);
			errorTimeout.current = undefined;
		}
	}, []);

	const setError = useCallback(
		(message: string) => {
			setPurchaseState("error");
			setErrorMessage(message);
			if (errorTimeout.current) {
				clearTimeout(errorTimeout.current);
			}
			errorTimeout.current = setTimeout(() => {
				clearError();
			}, 5000);
		},
		[clearError],
	);

	const _showToast = useCallback(() => {
		setToastVisible(true);
		Animated.timing(toastOpacity, {
			toValue: 1,
			duration: 200,
			useNativeDriver: true,
		}).start();
		if (toastTimeout.current) {
			clearTimeout(toastTimeout.current);
		}
		toastTimeout.current = setTimeout(() => {
			Animated.timing(toastOpacity, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}).start(() => setToastVisible(false));
		}, 3000);
	}, [toastOpacity]);

	const openPaywall = useCallback(() => {
		setBlockedCombinationId(null);
		setPaywallVisible(true);
	}, []);

	const handlePremiumGate = useCallback((combinationId: string) => {
		setBlockedCombinationId(combinationId);
		setPaywallVisible(true);
	}, []);

	const handleDismiss = useCallback(() => {
		setPaywallVisible(false);
		setBlockedCombinationId(null);
		setPaywallDismissedThisSession(true);
		clearError();
	}, [setPaywallDismissedThisSession, clearError]);

	const handlePurchase = useCallback(
		async (toggleFavorite: (id: string) => void) => {
			setPurchaseState("purchasing");
			setErrorMessage(null);
			try {
				await purchase();
				hapticRigid();
				if (blockedCombinationId) {
					toggleFavorite(blockedCombinationId);
				}
				setPurchaseState("idle");
				setPaywallVisible(false);
				setBlockedCombinationId(null);
			} catch (error) {
				const message = getPurchaseErrorMessage(error);
				if (message === null) {
					// User cancelled — silent return to idle
					setPurchaseState("idle");
				} else {
					setError(message);
				}
			}
		},
		[purchase, blockedCombinationId, setError],
	);

	const handleRestore = useCallback(async () => {
		setPurchaseState("restoring");
		setErrorMessage(null);
		try {
			await restore();
			hapticLight();
			setPurchaseState("idle");
			setPaywallVisible(false);
			setBlockedCombinationId(null);
		} catch (error) {
			setError(getRestoreErrorMessage(error));
		}
	}, [restore, setError]);

	const blockedCombination = blockedCombinationId
		? getCombination(blockedCombinationId)
		: undefined;

	return {
		isPremium,
		paywallVisible,
		blockedCombination,
		toastVisible,
		toastOpacity,
		favoriteCombinationIds: [...favorites],
		priceString,
		purchaseState,
		errorMessage,
		handlePremiumGate,
		handleDismiss,
		handlePurchase,
		handleRestore,
		openPaywall,
	};
}
