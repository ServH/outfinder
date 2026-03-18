import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { usePremium } from "@/contexts/PremiumContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { hapticLight, hapticRigid } from "@/lib/haptics";

export interface PremiumGateState {
	paywallVisible: boolean;
	blockedCombination: Combination | undefined;
	toastVisible: boolean;
	toastOpacity: Animated.Value;
	favoriteCombinationIds: string[];
	priceString: string;
	handlePremiumGate: (combinationId: string) => void;
	handleDismiss: () => void;
	handlePurchase: (toggleFavorite: (id: string) => void) => Promise<void>;
	handleRestore: () => Promise<void>;
}

export function usePremiumGate(favorites: Set<string>): PremiumGateState {
	const {
		paywallDismissedThisSession,
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
	const toastOpacity = useRef(new Animated.Value(0)).current;
	const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	useEffect(() => {
		return () => {
			if (toastTimeout.current) {
				clearTimeout(toastTimeout.current);
			}
		};
	}, []);

	const showToast = useCallback(() => {
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

	const handlePremiumGate = useCallback(
		(combinationId: string) => {
			if (paywallDismissedThisSession) {
				showToast();
				return;
			}
			setBlockedCombinationId(combinationId);
			setPaywallVisible(true);
		},
		[paywallDismissedThisSession, showToast],
	);

	const handleDismiss = useCallback(() => {
		setPaywallVisible(false);
		setBlockedCombinationId(null);
		setPaywallDismissedThisSession(true);
	}, [setPaywallDismissedThisSession]);

	const handlePurchase = useCallback(
		async (toggleFavorite: (id: string) => void) => {
			try {
				await purchase();
				hapticRigid();
				if (blockedCombinationId) {
					toggleFavorite(blockedCombinationId);
				}
				setPaywallVisible(false);
				setBlockedCombinationId(null);
			} catch {
				// Purchase failed — paywall stays open for retry
			}
		},
		[purchase, blockedCombinationId],
	);

	const handleRestore = useCallback(async () => {
		try {
			await restore();
			hapticLight();
			setPaywallVisible(false);
			setBlockedCombinationId(null);
		} catch {
			// No previous purchase found — paywall stays open
		}
	}, [restore]);

	const blockedCombination = blockedCombinationId
		? getCombination(blockedCombinationId)
		: undefined;

	return {
		paywallVisible,
		blockedCombination,
		toastVisible,
		toastOpacity,
		favoriteCombinationIds: [...favorites],
		priceString,
		handlePremiumGate,
		handleDismiss,
		handlePurchase,
		handleRestore,
	};
}
