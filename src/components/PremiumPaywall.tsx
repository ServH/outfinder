import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	ScrollView,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { PREMIUM_CONFIG } from "@/config/premium";
import { getAllCombinations, getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import type { PurchaseState } from "@/hooks/usePremiumGate";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";
import { wadaTokens } from "@/styles/theme";

const DISMISS_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

/**
 * Gating context. `"favorites"` drives the combo-collection framing (saved
 * palette previews, optional blocked strip, combination count in body copy)
 * used when the user hits `FREE_FAVORITES_LIMIT`. `"wardrobe"` drives the
 * garment-capture framing used when `FREE_WARDROBE_LIMIT` blocks a save —
 * no palette preview, wardrobe-specific copy + limit badge.
 */
export type PaywallContext = "favorites" | "wardrobe";

export interface PremiumPaywallProps {
	visible: boolean;
	context: PaywallContext;
	/**
	 * Current count toward the free-tier limit. For favorites this is the
	 * number of saved combinations; for wardrobe, the number of wardrobe
	 * items. The limit itself is derived from `PREMIUM_CONFIG` via context.
	 */
	currentCount: number;
	priceString: string;
	purchaseState?: PurchaseState;
	errorMessage?: string | null;
	onPurchase: () => void;
	onRestore: () => void;
	onDismiss: () => void;
	/**
	 * Favorites-only. The combination the user just tried to favorite that
	 * triggered the paywall; rendered as a faded "locked" strip below the
	 * saved palette previews.
	 */
	blockedCombination?: Combination;
	/**
	 * Favorites-only. IDs of the user's already-saved favorite combinations;
	 * drives the palette preview strip. In wardrobe context this is ignored.
	 */
	savedCombinationIds?: string[];
}

export function PremiumPaywall({
	visible,
	context,
	currentCount,
	priceString,
	purchaseState = "idle",
	errorMessage = null,
	onPurchase,
	onRestore,
	onDismiss,
	blockedCombination,
	savedCombinationIds = [],
}: PremiumPaywallProps) {
	const { t } = useTranslation();
	const { height: screenHeight } = useWindowDimensions();
	const sheetHeight = screenHeight * 0.7;
	const reducedMotion = useReducedMotion();
	const translateY = useSharedValue(sheetHeight);
	const overlayOpacity = useSharedValue(0);
	const blockedStripOpacity = useSharedValue(0);
	const ctaScale = useSharedValue(1);

	const totalCombinations = getAllCombinations().length;
	const limit =
		context === "favorites"
			? PREMIUM_CONFIG.FREE_FAVORITES_LIMIT
			: PREMIUM_CONFIG.FREE_WARDROBE_LIMIT;

	useEffect(() => {
		if (visible) {
			hapticLight();
			if (reducedMotion) {
				translateY.value = 0;
				overlayOpacity.value = 0.3;
				blockedStripOpacity.value = 0.35;
			} else {
				translateY.value = withSpring(0, {
					damping: 20,
					stiffness: 200,
				});
				overlayOpacity.value = withTiming(0.3, { duration: 200 });
				blockedStripOpacity.value = withDelay(
					200,
					withTiming(0.35, { duration: 300 }),
				);
			}
		} else {
			translateY.value = sheetHeight;
			overlayOpacity.value = 0;
			blockedStripOpacity.value = 0;
		}
	}, [
		visible,
		reducedMotion,
		sheetHeight,
		translateY,
		overlayOpacity,
		blockedStripOpacity,
	]);

	function dismiss() {
		if (reducedMotion) {
			translateY.value = sheetHeight;
			overlayOpacity.value = 0;
			onDismiss();
		} else {
			translateY.value = withSpring(
				sheetHeight,
				{ damping: 25, stiffness: 250 },
				(finished) => {
					if (finished) {
						runOnJS(onDismiss)();
					}
				},
			);
			overlayOpacity.value = withTiming(0, { duration: 150 });
		}
	}

	const isLoading =
		purchaseState === "purchasing" || purchaseState === "restoring";

	const panGesture = Gesture.Pan()
		.enabled(!isLoading)
		.onUpdate((event) => {
			if (event.translationY > 0) {
				translateY.value = event.translationY;
			}
		})
		.onEnd((event) => {
			if (
				event.translationY > DISMISS_THRESHOLD ||
				event.velocityY > VELOCITY_THRESHOLD
			) {
				runOnJS(dismiss)();
			} else {
				translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
			}
		});

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const overlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
	}));

	const blockedStripStyle = useAnimatedStyle(() => ({
		opacity: blockedStripOpacity.value,
	}));

	const ctaAnimStyle = useAnimatedStyle(() => ({
		transform: [{ scale: ctaScale.value }],
	}));

	// Resolve saved favorite combinations to their actual data. In wardrobe
	// context `savedCombinationIds` is unused (preview is hidden below).
	const savedCombinations = savedCombinationIds
		.map((id) => getCombination(id))
		.filter((c): c is Combination => c !== undefined);

	// Palette preview (saved combos + optional blocked strip) belongs to the
	// favorites framing. In wardrobe context we skip it entirely — the user
	// is trying to save a garment, not a palette, so showing palettes would
	// miscommunicate the gate.
	const showPalettePreview =
		context === "favorites" &&
		(currentCount > 0 || blockedCombination !== undefined);

	const badgeText = t(`paywall.${context}.limitBadge`, {
		count: currentCount,
		limit,
	});
	const headlineText = t(`paywall.${context}.headline`);
	const bodyText =
		context === "favorites"
			? t("paywall.favorites.body", {
					count: currentCount,
					remaining: totalCombinations - currentCount,
				})
			: t("paywall.wardrobe.body", { count: currentCount });
	const unlockLabel = t(`paywall.${context}.unlockLabel`, {
		price: priceString,
	});

	if (!visible) {
		return null;
	}

	return (
		<Modal
			testID="premium-paywall-modal"
			transparent
			visible={visible}
			animationType="none"
			statusBarTranslucent
		>
			<View className="flex-1" testID="premium-paywall">
				{/* Dim overlay */}
				<Pressable
					testID="paywall-overlay"
					className="absolute inset-0"
					accessibilityRole="button"
					accessibilityLabel={t("paywall.dismiss")}
					onPress={isLoading ? undefined : dismiss}
				>
					<Animated.View className="flex-1 bg-black" style={overlayStyle} />
				</Pressable>

				{/* Bottom sheet */}
				<GestureDetector gesture={panGesture}>
					<Animated.View
						testID="paywall-sheet"
						className="absolute bottom-0 left-0 right-0"
						style={[
							sheetStyle,
							{
								height: sheetHeight,
								backgroundColor: wadaTokens.bgPaper,
								borderTopLeftRadius: 20,
								borderTopRightRadius: 20,
							},
						]}
					>
						<ScrollView
							contentContainerStyle={{
								paddingHorizontal: 24,
								paddingBottom: 40,
							}}
							showsVerticalScrollIndicator={false}
						>
							{/* Drag handle */}
							<View
								className="self-center mt-[10px]"
								style={{
									width: 36,
									height: 4,
									borderRadius: 2,
									backgroundColor: wadaTokens.hairline,
								}}
								accessibilityElementsHidden
							/>

							{/* Saved Palettes Preview */}
							{showPalettePreview && (
								<View className="mt-6">
									{/* Header row */}
									<View
										className="flex-row justify-between"
										accessible
										accessibilityLabel={`${t("paywall.favorites.yourCollection")}. ${t("paywall.favorites.savedCount", { count: currentCount })}`}
									>
										<Text
											allowFontScaling
											className="font-sans text-[11px] text-tertiary"
										>
											{t("paywall.favorites.yourCollection")}
										</Text>
										<Text
											allowFontScaling
											className="font-sans text-[11px] text-favorite-red"
										>
											{t("paywall.favorites.savedCount", {
												count: currentCount,
											})}
										</Text>
									</View>

									{/* Palette strips */}
									<View className="mt-1 gap-[6px]">
										{savedCombinations.map((combo) => (
											<View
												key={combo.id}
												testID={`saved-palette-${combo.id}`}
												className="flex-row overflow-hidden"
												style={{ height: 32, borderRadius: 5 }}
												accessibilityLabel={`${combo.nameEn}. ${combo.colors.length} colors: ${combo.colors.map((c) => c.nameEn).join(", ")}`}
											>
												{combo.colors.map((color) => (
													<View
														key={color.id}
														className="flex-1"
														style={{ backgroundColor: color.hex }}
													/>
												))}
											</View>
										))}

										{/* Blocked strip (faded) */}
										{blockedCombination && (
											<Animated.View
												testID="blocked-palette-strip"
												className="flex-row overflow-hidden"
												style={[
													{ height: 32, borderRadius: 5 },
													blockedStripStyle,
												]}
												accessibilityLabel={t("paywall.lockedLabel")}
											>
												{blockedCombination.colors.map((color) => (
													<View
														key={color.id}
														className="flex-1"
														style={{ backgroundColor: color.hex }}
													/>
												))}
											</Animated.View>
										)}
									</View>
								</View>
							)}

							{/* Limit badge */}
							<View className="items-center mt-2 mb-5">
								<View
									testID="limit-badge"
									className="px-3 py-[5px] rounded-full"
									style={{
										backgroundColor: `${wadaTokens.premiumAccent}1A`,
									}}
									accessibilityRole="text"
								>
									<Text
										allowFontScaling
										className="font-sans text-[11px] font-medium text-premium-accent"
									>
										{badgeText}
									</Text>
								</View>
							</View>

							{/* Headline */}
							<Text
								testID="paywall-headline"
								allowFontScaling
								className="font-serif-jp text-[20px] text-center mb-[10px] text-primary"
								style={{ lineHeight: 28 }}
							>
								{headlineText}
							</Text>

							{/* Body text */}
							<Text
								testID="paywall-body"
								allowFontScaling
								className="font-sans text-[13px] font-light text-center px-2 mb-6 text-secondary"
								style={{ lineHeight: 21 }}
							>
								{bodyText}
							</Text>

							{/* Price + CTA row */}
							<View className="flex-row gap-3 items-center mb-4">
								{/* Price tag */}
								<View
									testID="price-tag"
									className="items-center bg-elevated rounded-[10px] px-4 py-3 shrink-0"
									accessibilityLabel={t("paywall.priceLabel", {
										price: priceString,
									})}
								>
									<Text
										allowFontScaling
										className="font-sans text-[22px] font-semibold text-primary"
									>
										{priceString}
									</Text>
									<Text
										allowFontScaling
										className="font-sans text-[10px] text-tertiary mt-[1px]"
									>
										{t("paywall.oneTime")}
									</Text>
								</View>

								{/* CTA button */}
								<Pressable
									testID="cta-unlock"
									className="flex-1 items-center rounded-[14px] py-4"
									style={{
										backgroundColor: wadaTokens.textPrimary,
										opacity: isLoading ? 0.7 : 1,
									}}
									accessibilityRole="button"
									accessibilityLabel={
										purchaseState === "purchasing"
											? t("paywall.purchasing")
											: unlockLabel
									}
									disabled={isLoading}
									onPressIn={() => {
										if (!reducedMotion) {
											ctaScale.value = withSpring(0.97, {
												damping: 15,
												stiffness: 300,
											});
										}
									}}
									onPressOut={() => {
										if (!reducedMotion) {
											ctaScale.value = withSpring(1, {
												damping: 15,
												stiffness: 300,
											});
										}
									}}
									onPress={onPurchase}
								>
									<Animated.View
										testID="cta-content"
										style={ctaAnimStyle}
										accessibilityLiveRegion="polite"
									>
										{purchaseState === "purchasing" ? (
											<ActivityIndicator
												testID="cta-loading"
												size="small"
												color={wadaTokens.bgSurface}
											/>
										) : (
											<Text
												allowFontScaling
												className="font-sans text-[15px] font-medium"
												style={{
													color: wadaTokens.bgPaper,
													letterSpacing: 0.3,
												}}
											>
												{t("paywall.unlockButton")}
											</Text>
										)}
									</Animated.View>
								</Pressable>
							</View>

							{/* Error banner */}
							{purchaseState === "error" && errorMessage && (
								<View
									testID="error-banner"
									accessibilityRole="alert"
									accessibilityLiveRegion="assertive"
									className="rounded-lg px-3 py-2 mb-3"
									style={{
										backgroundColor: `${wadaTokens.favoriteRed}14`,
									}}
								>
									<Text
										allowFontScaling
										className="font-sans text-[13px] text-center text-secondary"
									>
										{errorMessage}
									</Text>
								</View>
							)}

							{/* Secondary actions */}
							<View className="flex-row justify-center gap-6 mt-1">
								<Pressable
									testID="restore-purchase"
									className="min-h-[44px] justify-center"
									accessibilityRole="button"
									accessibilityLabel={
										purchaseState === "restoring"
											? t("paywall.restoring")
											: t("paywall.restoreButton")
									}
									disabled={isLoading}
									onPress={onRestore}
								>
									{purchaseState === "restoring" ? (
										<ActivityIndicator
											testID="restore-loading"
											size="small"
											color={wadaTokens.textTertiary}
										/>
									) : (
										<Text
											allowFontScaling
											className="font-sans text-[13px] text-tertiary"
										>
											{t("paywall.restoreButton")}
										</Text>
									)}
								</Pressable>
								<Pressable
									testID="not-now"
									className="min-h-[44px] justify-center"
									accessibilityRole="button"
									accessibilityLabel={t("paywall.dismiss")}
									disabled={isLoading}
									onPress={dismiss}
								>
									<Text
										allowFontScaling
										className="font-sans text-[13px] text-tertiary"
										style={{ opacity: isLoading ? 0.5 : 1 }}
									>
										{t("paywall.notNow")}
									</Text>
								</Pressable>
							</View>
						</ScrollView>
					</Animated.View>
				</GestureDetector>
			</View>
		</Modal>
	);
}
