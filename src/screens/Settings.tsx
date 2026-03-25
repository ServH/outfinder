import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { usePremium } from "@/contexts/PremiumContext";
import { getRestoreErrorMessage, usePremiumGate } from "@/hooks/usePremiumGate";
import { wadaTokens } from "@/styles/theme";

const PRIVACY_URL = "https://servh.github.io/outfinder-legal/";
const SUPPORT_URL = "https://servh.github.io/outfinder-legal/support.html";

type SettingsProps = Record<string, never>;

type RestoreState = "idle" | "loading" | "success" | "error";

export function Settings(_props: SettingsProps) {
	const { isPremium, restore } = usePremium();
	const { favorites, toggleFavorite, count } = useFavorites();
	const gate = usePremiumGate(favorites);

	const [restoreState, setRestoreState] = useState<RestoreState>("idle");
	const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
	const restoreTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	useEffect(() => {
		return () => {
			if (restoreTimeout.current) {
				clearTimeout(restoreTimeout.current);
			}
		};
	}, []);

	const handleSettingsRestore = useCallback(async () => {
		setRestoreState("loading");
		setRestoreMessage(null);
		if (restoreTimeout.current) {
			clearTimeout(restoreTimeout.current);
		}
		try {
			await restore();
			setRestoreState("success");
			setRestoreMessage("Restored!");
			restoreTimeout.current = setTimeout(() => {
				setRestoreState("idle");
				setRestoreMessage(null);
			}, 3000);
		} catch (error) {
			setRestoreState("error");
			setRestoreMessage(getRestoreErrorMessage(error));
			restoreTimeout.current = setTimeout(() => {
				setRestoreState("idle");
				setRestoreMessage(null);
			}, 5000);
		}
	}, [restore]);

	const restoreButtonContent = () => {
		switch (restoreState) {
			case "loading":
				return (
					<ActivityIndicator
						testID="settings-restore-loading"
						size="small"
						color={wadaTokens.textTertiary}
					/>
				);
			case "success":
				return (
					<Text
						allowFontScaling
						className="font-sans text-[14px] text-premium-accent"
					>
						Restored!
					</Text>
				);
			default:
				return (
					<Text
						allowFontScaling
						className="font-sans text-[14px] text-text-primary"
					>
						Restore Purchases
					</Text>
				);
		}
	};

	return (
		<View className="flex-1 bg-paper" accessibilityLabel="Settings screen">
			<ScrollView
				contentContainerStyle={{ padding: 24 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Plans section */}
				<View testID="premium-section">
					<Text
						allowFontScaling
						className="font-sans text-[16px] font-bold mb-3 text-text-primary"
					>
						Plans
					</Text>

					<View className="bg-bg-elevated rounded-xl overflow-hidden">
						{/* Status row */}
						<View
							testID="premium-status-row"
							className="px-4 py-3"
							accessibilityLabel={
								isPremium
									? "Premium Active"
									: `Free Plan, ${count} of 5 favorites used`
							}
						>
							{isPremium ? (
								<Text
									testID="premium-active-badge"
									allowFontScaling
									className="font-sans text-[14px] font-medium text-premium-accent"
								>
									Premium Active ✓
								</Text>
							) : (
								<Text
									testID="free-plan-badge"
									allowFontScaling
									className="font-sans text-[14px] text-text-secondary"
								>
									Free Plan · {count} favorites
								</Text>
							)}
						</View>

						{/* Divider */}
						<View className="h-[1px] bg-divider mx-4" />

						{/* Restore Purchases button */}
						<Pressable
							testID="settings-restore-button"
							className="px-4 min-h-[44px] justify-center"
							accessibilityRole="button"
							accessibilityLabel="Restore purchases"
							disabled={restoreState === "loading"}
							onPress={handleSettingsRestore}
						>
							<View testID="restore-content" accessibilityLiveRegion="polite">
								{restoreButtonContent()}
							</View>
						</Pressable>

						{/* Restore error message */}
						{restoreState === "error" && restoreMessage && (
							<View
								testID="settings-restore-error"
								accessibilityRole="alert"
								accessibilityLiveRegion="assertive"
								className="px-4 pb-3"
							>
								<Text
									allowFontScaling
									className="font-sans text-[12px] text-text-secondary"
								>
									{restoreMessage}
								</Text>
							</View>
						)}

						{/* Upgrade row (free users only) */}
						{!isPremium && (
							<>
								<View className="h-[1px] bg-divider mx-4" />
								<Pressable
									testID="settings-upgrade-button"
									className="px-4 min-h-[44px] justify-center"
									accessibilityRole="button"
									accessibilityLabel="Upgrade to Premium"
									onPress={gate.openPaywall}
								>
									<Text
										allowFontScaling
										className="font-sans text-[14px] font-medium text-premium-accent"
									>
										Upgrade to Premium
									</Text>
								</Pressable>
							</>
						)}
					</View>
				</View>

				{/* About section */}
				<View testID="about-section" className="mt-8">
					<Text
						allowFontScaling
						className="font-sans text-[16px] font-bold mb-3 text-text-primary"
					>
						About
					</Text>

					<View className="bg-bg-elevated rounded-xl overflow-hidden">
						{/* Version row */}
						<View
							testID="settings-version-row"
							className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
							accessibilityLabel={`Version ${Constants.expoConfig?.version ?? "1.0.0"}`}
						>
							<Text
								allowFontScaling
								className="font-sans text-[14px] text-text-primary"
							>
								Version
							</Text>
							<Text
								allowFontScaling
								className="font-sans text-[14px] text-text-secondary"
							>
								{Constants.expoConfig?.version ?? "1.0.0"}
							</Text>
						</View>

						{/* Divider */}
						<View className="h-[1px] bg-divider mx-4" />

						{/* Privacy Policy row */}
						<Pressable
							testID="settings-privacy-row"
							className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
							accessibilityRole="link"
							accessibilityLabel="Privacy Policy"
							onPress={() => {
								try {
									Linking.openURL(PRIVACY_URL).catch((error: unknown) => {
										if (__DEV__) {
											console.warn("Failed to open URL:", error);
										}
									});
								} catch (error) {
									if (__DEV__) {
										console.warn("Failed to open URL:", error);
									}
								}
							}}
						>
							<Text
								allowFontScaling
								className="font-sans text-[14px] text-text-primary"
							>
								Privacy Policy
							</Text>
							<Text
								allowFontScaling
								className="font-sans text-[14px] text-text-tertiary"
							>
								›
							</Text>
						</Pressable>

						{/* Divider */}
						<View className="h-[1px] bg-divider mx-4" />

						{/* Support row */}
						<Pressable
							testID="settings-support-row"
							className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
							accessibilityRole="link"
							accessibilityLabel="Support"
							onPress={() => {
								try {
									Linking.openURL(SUPPORT_URL).catch((error: unknown) => {
										if (__DEV__) {
											console.warn("Failed to open URL:", error);
										}
									});
								} catch (error) {
									if (__DEV__) {
										console.warn("Failed to open URL:", error);
									}
								}
							}}
						>
							<Text
								allowFontScaling
								className="font-sans text-[14px] text-text-primary"
							>
								Support
							</Text>
							<Text
								allowFontScaling
								className="font-sans text-[14px] text-text-tertiary"
							>
								›
							</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>

			{/* PremiumPaywall rendered at bottom */}
			<PremiumPaywall
				visible={gate.paywallVisible}
				favoriteCombinationIds={gate.favoriteCombinationIds}
				priceString={gate.priceString}
				purchaseState={gate.purchaseState}
				errorMessage={gate.errorMessage}
				onPurchase={() => gate.handlePurchase(toggleFavorite)}
				onRestore={gate.handleRestore}
				onDismiss={gate.handleDismiss}
			/>
		</View>
	);
}
