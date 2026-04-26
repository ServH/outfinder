import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Linking,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { PREMIUM_CONFIG } from "@/config/premium";
import { usePremium } from "@/contexts/PremiumContext";
import { getRestoreErrorMessage, usePremiumGate } from "@/hooks/usePremiumGate";
import { ALL_COACH_MARK_KEYS } from "@/lib/coachMarkKeys";
import { useIsIPad } from "@/lib/device";
import { openAppStoreReview } from "@/lib/storeReview";
import type { RootStackParamList } from "@/navigation/types";
import {
	IDEMPOTENCY_KEY as MISLOOKS_MIGRATION_FLAG,
	type MigrationResult,
	runMisLooksMigration,
} from "@/stores/misLooksMigration";
import { hydrateMisLooksStore, useMisLooksStore } from "@/stores/misLooksStore";
import { wadaTokens } from "@/styles/theme";

const PRIVACY_URL = "https://servh.github.io/outfinder-legal/";
const SUPPORT_URL = "https://servh.github.io/outfinder-legal/support.html";

type SettingsProps = Record<string, never>;

type RestoreState = "idle" | "loading" | "success" | "error";

export function Settings(_props: SettingsProps) {
	const { t } = useTranslation();
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { isPremium, restore, __dev_resetPremium } = usePremium();
	const favorites = useMisLooksStore((s) => s.favorites);
	const toggleFavorite = useMisLooksStore((s) => s.toggleFavorite);
	const count = useMisLooksStore((s) => s.favorites.size);
	const gate = usePremiumGate(favorites);
	const isTablet = useIsIPad();
	// Reactive read for the dev-menu wardrobe item count badge.
	// useMisLooksStore.getState() inside JSX is a stale snapshot — hook selector keeps it live.
	const wardrobeDevItems = useMisLooksStore((s) => s.items);
	const wardrobeDevItemCount = wardrobeDevItems.length;
	// Live slice of the 5 most-recent wardrobe item thumbnails, reused by
	// the wardrobe-paywall dev preview row to mirror the production variant.
	// MUST be memoized: deriving inside the Zustand selector returns a fresh
	// array ref every render → infinite re-render loop via Object.is diff.
	const wardrobeDevItemThumbnails = useMemo(
		() =>
			wardrobeDevItems
				.slice(-5)
				.reverse()
				.map((i) => i.thumbnailPath),
		[wardrobeDevItems],
	);
	const [lastMigrationRun, setLastMigrationRun] = useState<{
		at: string;
		status: MigrationResult["status"];
	} | null>(null);
	const [devWardrobePaywallVisible, setDevWardrobePaywallVisible] =
		useState(false);

	const [coachMarkResetAt, setCoachMarkResetAt] = useState<string | null>(null);

	const handleResetCoachMarks = useCallback(async () => {
		try {
			await AsyncStorage.multiRemove(ALL_COACH_MARK_KEYS);
			setCoachMarkResetAt(new Date().toISOString());
		} catch (error) {
			if (__DEV__) {
				console.warn("Settings: handleResetCoachMarks error", error);
			}
		}
	}, []);

	const handleRerunMigration = useCallback(async () => {
		try {
			await AsyncStorage.removeItem(MISLOOKS_MIGRATION_FLAG);
			const result = await runMisLooksMigration();
			await hydrateMisLooksStore();
			setLastMigrationRun({
				at: new Date().toISOString(),
				status: result.status,
			});
		} catch (error) {
			if (__DEV__) {
				console.warn("Settings: handleRerunMigration error", error);
			}
			setLastMigrationRun({
				at: new Date().toISOString(),
				status: "aborted",
			});
		}
	}, []);

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
			setRestoreMessage(t("settings.restored"));
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
	}, [restore, t]);

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
						{t("settings.restored")}
					</Text>
				);
			default:
				return (
					<Text allowFontScaling className="font-sans text-[14px] text-primary">
						{t("settings.restorePurchases")}
					</Text>
				);
		}
	};

	return (
		<View
			className="flex-1 bg-paper"
			accessibilityLabel={t("settings.screenLabel")}
		>
			<View
				className="pb-2"
				style={{ paddingTop: 60, paddingHorizontal: isTablet ? 24 : 16 }}
			>
				<Text
					style={{
						fontFamily: "NotoSerifJP_500Medium",
						fontSize: 28,
						color: wadaTokens.textPrimary,
					}}
				>
					{t("settings.title")}
				</Text>
			</View>
			<ScrollView
				contentContainerStyle={{ padding: isTablet ? 32 : 24 }}
				showsVerticalScrollIndicator={false}
			>
				<View
					testID="settings-content-container"
					style={
						isTablet
							? { maxWidth: 560, alignSelf: "center", width: "100%" }
							: undefined
					}
				>
					{/* Plans section */}
					<View testID="premium-section">
						<Text
							allowFontScaling
							className="font-sans text-[16px] font-bold mb-3 text-primary"
						>
							{t("settings.plans")}
						</Text>

						<View className="bg-elevated rounded-xl overflow-hidden">
							{/* Status row */}
							<View
								testID="premium-status-row"
								className="px-4 py-3"
								accessibilityLabel={
									isPremium
										? t("settings.premiumActive")
										: t("settings.freePlanLabel", {
												count,
												limit: PREMIUM_CONFIG.FREE_FAVORITES_LIMIT,
											})
								}
							>
								{isPremium ? (
									<Text
										testID="premium-active-badge"
										allowFontScaling
										className="font-sans text-[14px] font-medium text-premium-accent"
									>
										{t("settings.premiumBadge")}
									</Text>
								) : (
									<Text
										testID="free-plan-badge"
										allowFontScaling
										className="font-sans text-[14px] text-secondary"
									>
										{t("settings.freePlanBadge", { count })}
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
								accessibilityLabel={t("settings.restorePurchases")}
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
										className="font-sans text-[12px] text-secondary"
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
										accessibilityLabel={t("settings.upgradeToPremium")}
										onPress={gate.openPaywall}
									>
										<Text
											allowFontScaling
											className="font-sans text-[14px] font-medium text-premium-accent"
										>
											{t("settings.upgradeToPremium")}
										</Text>
									</Pressable>
								</>
							)}
						</View>
					</View>

					{/* __DEV__ menu — Armario Virtual smoke entry + limit override (Story 13.3a) */}
					{__DEV__ && (
						<View testID="dev-menu-section" className="mt-8">
							<Text
								allowFontScaling
								className="font-sans text-[16px] font-bold mb-3 text-primary"
							>
								DEV
							</Text>
							<View className="bg-elevated rounded-xl overflow-hidden">
								<Pressable
									testID="dev-armario-capture-row"
									className="px-4 py-3 min-h-[44px] justify-center"
									accessibilityRole="button"
									accessibilityLabel="Open Armario Virtual capture (dev)"
									onPress={() => {
										navigation
											.getParent<
												NativeStackNavigationProp<RootStackParamList>
											>()
											?.navigate("ArmarioRoot", { screen: "ArmarioCapture" });
									}}
								>
									<Text
										allowFontScaling
										className="font-sans text-[14px] text-primary"
									>
										Armario Virtual (dev)
									</Text>
								</Pressable>

								<View className="h-[1px] bg-divider mx-4" />

								<Pressable
									testID="dev-wardrobe-limit-override-row"
									className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
									accessibilityRole="button"
									accessibilityLabel="Toggle wardrobe @limit override"
									onPress={() => {
										const { items, setItems } = useMisLooksStore.getState();
										if (items.length === 0) {
											const now = Date.now();
											setItems(
												Array.from({ length: 10 }, (_, i) => ({
													id: `__dev-stub-${i}__`,
													localImagePath: "file:///dev-stub.png",
													thumbnailPath: "file:///dev-stub-thumb.png",
													category: "top" as const,
													createdAt: now - i * 1000,
												})),
											);
										} else {
											setItems([]);
										}
									}}
								>
									<Text
										allowFontScaling
										className="font-sans text-[14px] text-primary"
									>
										Wardrobe @limit override
									</Text>
									<Text
										allowFontScaling
										className="font-sans text-[12px] text-tertiary"
									>
										{wardrobeDevItemCount} /{" "}
										{PREMIUM_CONFIG.FREE_WARDROBE_LIMIT}
									</Text>
								</Pressable>

								<View className="h-[1px] bg-divider mx-4" />

								<Pressable
									testID="dev-rerun-mislooks-migration-row"
									className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
									accessibilityRole="button"
									accessibilityLabel="Re-run Mis Looks migration (dev)"
									onPress={handleRerunMigration}
								>
									<Text
										allowFontScaling
										className="font-sans text-[14px] text-primary"
									>
										Re-run Mis Looks migration
									</Text>
									{lastMigrationRun ? (
										<Text
											allowFontScaling
											className="font-sans text-[12px] text-tertiary"
										>
											last run: {lastMigrationRun.at} · status:{" "}
											{lastMigrationRun.status}
										</Text>
									) : null}
								</Pressable>

								<View className="h-[1px] bg-divider mx-4" />

								<Pressable
									testID="dev-preview-wardrobe-paywall-row"
									className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
									accessibilityRole="button"
									accessibilityLabel="Preview wardrobe paywall (dev)"
									onPress={() => setDevWardrobePaywallVisible(true)}
								>
									<Text
										allowFontScaling
										className="font-sans text-[14px] text-primary"
									>
										Preview wardrobe paywall
									</Text>
									<Text
										allowFontScaling
										className="font-sans text-[12px] text-tertiary"
									>
										context: wardrobe
									</Text>
								</Pressable>

								<View className="h-[1px] bg-divider mx-4" />

								<Pressable
									testID="dev-reset-premium-row"
									className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
									accessibilityRole="button"
									accessibilityLabel="Reset premium status (dev)"
									onPress={__dev_resetPremium}
								>
									<Text
										allowFontScaling
										className="font-sans text-[14px] text-primary"
									>
										Reset premium (dev)
									</Text>
									<Text
										allowFontScaling
										className="font-sans text-[12px] text-tertiary"
									>
										{isPremium ? "ON" : "OFF"}
									</Text>
								</Pressable>

								<View className="h-[1px] bg-divider mx-4" />

								<Pressable
									testID="dev-reset-coach-marks-row"
									className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
									accessibilityRole="button"
									accessibilityLabel="Reset coach marks (dev)"
									onPress={handleResetCoachMarks}
								>
									<Text
										allowFontScaling
										className="font-sans text-[14px] text-primary"
									>
										Reset coach marks (dev)
									</Text>
									<Text
										allowFontScaling
										className="font-sans text-[12px] text-tertiary"
									>
										{coachMarkResetAt ? "cleared" : "ready"}
									</Text>
								</Pressable>
							</View>
						</View>
					)}

					{/* About section */}
					<View testID="about-section" className="mt-8">
						<Text
							allowFontScaling
							className="font-sans text-[16px] font-bold mb-3 text-primary"
						>
							{t("settings.about")}
						</Text>

						<View className="bg-elevated rounded-xl overflow-hidden">
							{/* Version row */}
							<View
								testID="settings-version-row"
								className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
								accessibilityLabel={`${t("settings.version")} ${Constants.expoConfig?.version ?? "1.0.0"}`}
							>
								<Text
									allowFontScaling
									className="font-sans text-[14px] text-primary"
								>
									{t("settings.version")}
								</Text>
								<Text
									allowFontScaling
									className="font-sans text-[14px] text-secondary"
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
								accessibilityLabel={t("settings.privacyPolicy")}
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
									className="font-sans text-[14px] text-primary"
								>
									{t("settings.privacyPolicy")}
								</Text>
								<Text
									allowFontScaling
									className="font-sans text-[14px] text-tertiary"
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
								accessibilityLabel={t("settings.support")}
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
									className="font-sans text-[14px] text-primary"
								>
									{t("settings.support")}
								</Text>
								<Text
									allowFontScaling
									className="font-sans text-[14px] text-tertiary"
								>
									›
								</Text>
							</Pressable>

							{/* Divider */}
							<View className="h-[1px] bg-divider mx-4" />

							{/* Rate App row */}
							<Pressable
								testID="settings-rate-app-row"
								className="px-4 py-3 min-h-[44px] flex-row items-center justify-between"
								accessibilityRole="link"
								accessibilityLabel={t("settings.rateApp")}
								onPress={openAppStoreReview}
							>
								<Text
									allowFontScaling
									className="font-sans text-[14px] text-primary"
								>
									{t("settings.rateApp")}
								</Text>
								<Text
									allowFontScaling
									className="font-sans text-[14px] text-tertiary"
								>
									›
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* PremiumPaywall rendered at bottom */}
			<PremiumPaywall
				visible={gate.paywallVisible}
				context="favorites"
				currentCount={gate.favoriteCombinationIds.length}
				savedCombinationIds={gate.favoriteCombinationIds}
				priceString={gate.priceString}
				purchaseState={gate.purchaseState}
				errorMessage={gate.errorMessage}
				onPurchase={() => gate.handlePurchase(toggleFavorite)}
				onRestore={gate.handleRestore}
				onDismiss={gate.handleDismiss}
			/>

			{/* Dev-only: render the wardrobe-context paywall as a preview
			    triggered by the `dev-preview-wardrobe-paywall-row` button. No
			    real purchase — dismiss closes. */}
			{__DEV__ && (
				<PremiumPaywall
					visible={devWardrobePaywallVisible}
					context="wardrobe"
					currentCount={wardrobeDevItemCount}
					wardrobeItemThumbnails={wardrobeDevItemThumbnails}
					priceString={gate.priceString}
					onPurchase={() => setDevWardrobePaywallVisible(false)}
					onRestore={() => setDevWardrobePaywallVisible(false)}
					onDismiss={() => setDevWardrobePaywallVisible(false)}
				/>
			)}
		</View>
	);
}
