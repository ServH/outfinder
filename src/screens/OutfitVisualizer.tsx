import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AccessibilityInfo,
	Pressable,
	ScrollView,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import ReanimatedAnimated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Aureola } from "@/components/Aureola";
import {
	GARMENT_REGISTRY,
	type GarmentType,
} from "@/components/garments/index";
import { MiniPaletteStrip } from "@/components/MiniPaletteStrip";
import { OutfitCard } from "@/components/OutfitCard";
import { WadaHeader } from "@/components/WadaHeader";
import { WarmBackground } from "@/components/WarmBackground";
import { getColor, getCombination } from "@/data/colorIndex";
import { getCycleForGarment, useOutfitState } from "@/hooks/useOutfitState";
import { useStoreReviewPrompt } from "@/hooks/useStoreReviewPrompt";
import { relativeLuminance } from "@/lib/color";
import { useIsIPad } from "@/lib/device";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { FAB_PROTRUSION } from "@/navigation/CustomTabBar";
import type {
	ColorsStackParamList,
	RootStackParamList,
} from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

// Shared with UnifiedCameraResultScreen (Story 14.4): Wada-hex CTA labels flip
// from dark pergamino ink (> 0.40) to cream (≤ 0.40). Aesthetic threshold tuned
// for the Wada palette, not a WCAG contrast rule.
const LUMINANCE_DARK_TEXT_THRESHOLD = 0.4;
const CTA_LABEL_CREAM = "#faf7f2";

type OutfitVisualizerRoute = RouteProp<
	ColorsStackParamList,
	"OutfitVisualizer"
>;

function getNextGarmentLabel(
	garmentType: GarmentType,
	direction: 1 | -1,
	slotCount: number,
): string {
	const cycle = getCycleForGarment(garmentType, slotCount);
	const pos = cycle.indexOf(garmentType);
	const next = (pos + direction + cycle.length) % cycle.length;
	return GARMENT_REGISTRY[cycle[next]].label;
}

export function OutfitVisualizer() {
	const { t } = useTranslation();
	const { width: screenW } = useWindowDimensions();
	const isTablet = useIsIPad();
	const route = useRoute<OutfitVisualizerRoute>();
	const navigation = useNavigation();
	const stackState = navigation.getState();
	const prevRoute =
		stackState && stackState.index > 0
			? stackState.routes[stackState.index - 1]
			: undefined;
	const { combinationId } = route.params;
	const combination = getCombination(combinationId);

	let backLabel = "";
	if (prevRoute?.name === "FavoritesList") {
		backLabel = t("favorites.title");
	} else if (prevRoute?.name === "Combinations") {
		const params = prevRoute.params as { colorId: string } | undefined;
		if (params?.colorId) {
			backLabel = getColor(params.colorId)?.nameEn ?? "";
		}
	} else if (prevRoute?.name === "ColorHome") {
		backLabel = t("tabs.colors");
	} else if (prevRoute?.name === "BrowseAllColors") {
		backLabel = t("browseAll.backButton");
	}

	// Coach mark state: 0 = hidden, 1 = step 1, 2 = step 2
	const [coachStep, setCoachStep] = useState(0);
	const reduceMotionRef = useRef(false);

	// Card animation values
	const cardOpacity = useSharedValue(0);
	const cardTranslateY = useSharedValue(20);

	const cardAnimStyle = useAnimatedStyle(() => ({
		opacity: cardOpacity.value,
		transform: [{ translateY: cardTranslateY.value }],
	}));

	const { slots, selectedSlotIndex, selectSlot, cycleVariant } = useOutfitState(
		combination?.colors ?? [],
	);

	// Read reduce motion preference once on mount
	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			reduceMotionRef.current = enabled;
		});
	}, []);

	// Animate card in whenever a step becomes active
	useEffect(() => {
		if (coachStep > 0) {
			if (reduceMotionRef.current) {
				cardOpacity.value = 1;
				cardTranslateY.value = 0;
			} else {
				cardOpacity.value = withTiming(1, { duration: 260 });
				cardTranslateY.value = withTiming(0, { duration: 280 });
			}
		}
	}, [coachStep, cardOpacity, cardTranslateY]);

	// Read visualizer-introduced flag on mount
	useEffect(() => {
		(async () => {
			try {
				const value = await AsyncStorage.getItem(
					"@outfinder/visualizer-introduced",
				);
				if (value !== "true") {
					setCoachStep(1);
					AccessibilityInfo.announceForAccessibility(
						t("visualizer.coachStep1Announce"),
					);
				}
			} catch {
				setCoachStep(1);
				AccessibilityInfo.announceForAccessibility(
					t("visualizer.coachStep1Announce"),
				);
			}
		})();
	}, [t]);

	const handleCoachOk = useCallback(() => {
		hapticLight();
		if (coachStep === 1) {
			const goToStep2 = () => {
				cardTranslateY.value = 18;
				setCoachStep(2);
				AccessibilityInfo.announceForAccessibility(
					t("visualizer.coachStep2Announce"),
				);
			};
			if (reduceMotionRef.current) {
				goToStep2();
			} else {
				// Animate card out upward, then swap to step 2 and animate back in
				cardOpacity.value = withTiming(0, { duration: 150 }, () => {
					runOnJS(goToStep2)();
				});
				cardTranslateY.value = withTiming(-10, { duration: 150 });
			}
		} else {
			const dismiss = () => {
				setCoachStep(0);
				AsyncStorage.setItem("@outfinder/visualizer-introduced", "true").catch(
					() => {},
				);
			};
			if (reduceMotionRef.current) {
				dismiss();
			} else {
				// Animate card out and dismiss overlay
				cardOpacity.value = withTiming(0, { duration: 200 }, () => {
					runOnJS(dismiss)();
				});
				cardTranslateY.value = withTiming(10, { duration: 200 });
			}
		}
	}, [coachStep, cardOpacity, cardTranslateY, t]);

	// Cross-stack nav to Ficha Wada via root. Must go through root because
	// OutfitVisualizer is registered in BOTH ColorsStack and FavoritesStack, but
	// ArmarioFichaWada only lives in FavoritesStack — a local push would fail
	// when the user entered via ColorsTab. Trade-off: swipe-back from Ficha Wada
	// lands on FavoritesList (not Visualizer). See Story 14.6 AC #3 rationale.
	const handleMakeMine = useCallback(() => {
		hapticMedium();
		const rootNav =
			navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
		rootNav?.navigate("Main", {
			screen: "FavoritesTab",
			params: {
				screen: "ArmarioFichaWada",
				params: { combinationId },
			},
		} as never);
	}, [navigation, combinationId]);

	const handleSlotTap = useCallback(
		(index: number) => {
			const tappedSlot = slots[index];
			const tappedLabel = GARMENT_REGISTRY[tappedSlot.garmentType].label;

			if (selectedSlotIndex === null) {
				hapticMedium();
				selectSlot(index);
				AccessibilityInfo.announceForAccessibility(
					t("visualizer.selectedForSwap", { label: tappedLabel }),
				);
			} else if (selectedSlotIndex === index) {
				selectSlot(index);
			} else {
				hapticMedium();
				const selectedSlot = slots[selectedSlotIndex];
				const selectedLabel = GARMENT_REGISTRY[selectedSlot.garmentType].label;
				const newColorA = tappedSlot.color.nameEn;
				const newColorB = selectedSlot.color.nameEn;
				selectSlot(index);
				AccessibilityInfo.announceForAccessibility(
					t("visualizer.swapResult", {
						selectedLabel,
						newColorA,
						newColorB,
						tappedLabel,
					}),
				);
			}
		},
		[slots, selectedSlotIndex, selectSlot, t],
	);

	const handleVariantCycle = useCallback(
		(index: number, direction: 1 | -1) => {
			hapticMedium();
			const newLabel = getNextGarmentLabel(
				slots[index].garmentType,
				direction,
				slots.length,
			);
			cycleVariant(index, direction);
			AccessibilityInfo.announceForAccessibility(
				t("visualizer.changedTo", { label: newLabel }),
			);
		},
		[slots, cycleVariant, t],
	);

	const handlePreviousGarment = useCallback(() => {
		hapticLight();
		const targetIndex = selectedSlotIndex ?? 0;
		const newLabel = getNextGarmentLabel(
			slots[targetIndex].garmentType,
			-1,
			slots.length,
		);
		cycleVariant(targetIndex, -1);
		AccessibilityInfo.announceForAccessibility(
			t("visualizer.changedTo", { label: newLabel }),
		);
	}, [selectedSlotIndex, slots, cycleVariant, t]);

	const handleNextGarment = useCallback(() => {
		hapticLight();
		const targetIndex = selectedSlotIndex ?? 0;
		const newLabel = getNextGarmentLabel(
			slots[targetIndex].garmentType,
			1,
			slots.length,
		);
		cycleVariant(targetIndex, 1);
		AccessibilityInfo.announceForAccessibility(
			t("visualizer.changedTo", { label: newLabel }),
		);
	}, [selectedSlotIndex, slots, cycleVariant, t]);

	// Trigger in-app review sheet on 2nd Visualizer visit (must be before early return)
	useStoreReviewPrompt();

	if (!combination) {
		return (
			<View
				className="flex-1 items-center justify-center bg-paper"
				accessibilityLabel={t("visualizer.screenLabel")}
			>
				<Text className="font-sans text-base text-secondary">
					{t("visualizer.notFound")}
				</Text>
			</View>
		);
	}

	const ctaLabelColor =
		relativeLuminance(slots[0].color.hex) > LUMINANCE_DARK_TEXT_THRESHOLD
			? wadaTokens.textPrimary
			: CTA_LABEL_CREAM;

	return (
		<View
			className="flex-1"
			style={{ backgroundColor: wadaTokens.warmBg }}
			accessibilityLabel={t("visualizer.screenLabel")}
		>
			{/* Back button */}
			<View className="px-4 pt-4 pb-1" style={{ paddingTop: 60 }}>
				<Pressable
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel={t("visualizer.goBack")}
					className="min-h-[48px] flex-row items-center"
					testID="visualizer-back-button"
				>
					<Text
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.7}
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 28,
							color: wadaTokens.textPrimary,
						}}
					>
						← {backLabel}
					</Text>
				</Pressable>
			</View>
			{/* ScrollView handles 4-garment outfits that exceed screen height */}
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-1">
					<WarmBackground />
					<View className="flex-1 items-center justify-center py-4">
						<Aureola
							hex={slots[0].color.hex}
							width={screenW}
							height={isTablet ? 600 : 500}
						/>
						<View
							testID="outfit-content-container"
							style={
								isTablet
									? { maxWidth: 520, alignSelf: "center", width: "100%" }
									: undefined
							}
						>
							<WadaHeader
								nameJp={combination.nameJp}
								nameEn={combination.nameEn}
								colorCount={combination.colors.length}
							/>
							<View className="relative items-center">
								<OutfitCard
									slots={slots}
									selectedSlotIndex={selectedSlotIndex}
									onSlotTap={handleSlotTap}
									onVariantCycle={handleVariantCycle}
									cardWidth={isTablet ? 320 : 220}
								/>
								<Pressable
									onPress={handlePreviousGarment}
									accessibilityRole="button"
									accessibilityLabel={t("visualizer.previousGarment")}
									testID="arrow-previous"
									className="absolute min-w-[44px] min-h-[44px] justify-center items-center"
									style={{
										left: isTablet ? -36 : -28,
										top: "50%",
										marginTop: -16,
									}}
								>
									<Text
										className="text-[28px]"
										style={{ color: wadaTokens.textTertiary, opacity: 0.5 }}
									>
										{"‹"}
									</Text>
								</Pressable>
								<Pressable
									onPress={handleNextGarment}
									accessibilityRole="button"
									accessibilityLabel={t("visualizer.nextGarment")}
									testID="arrow-next"
									className="absolute min-w-[44px] min-h-[44px] justify-center items-center"
									style={{
										right: isTablet ? -36 : -28,
										top: "50%",
										marginTop: -16,
									}}
								>
									<Text
										className="text-[28px]"
										style={{ color: wadaTokens.textTertiary, opacity: 0.5 }}
									>
										{"›"}
									</Text>
								</Pressable>
							</View>
							<View className="mt-4 items-center">
								<MiniPaletteStrip
									colors={slots.map((s) => ({
										hex: s.color.hex,
										nameEn: s.color.nameEn,
									}))}
								/>
							</View>
						</View>
						<Text
							allowFontScaling
							className="mt-6 font-sans-medium text-sm"
							style={{ color: wadaTokens.wadaMuted }}
						>
							Outfinder
						</Text>
					</View>
				</View>
			</ScrollView>
			{/* Primary CTA — bridge to Ficha Wada; replaces the Story 14.5 share button
			    and uses the Aureola hex as background per UX-DR6 (visual parity with
			    the halo already rendered behind the outfit card). */}
			<View
				className="px-4"
				style={{ paddingBottom: 12 + FAB_PROTRUSION, paddingTop: 8 }}
			>
				<Pressable
					onPress={handleMakeMine}
					accessibilityRole="button"
					accessibilityLabel={t("visualizer.makeMineA11yLabel")}
					accessibilityHint={t("visualizer.makeMineA11yHint")}
					testID="visualizer-make-mine"
					className="h-12 w-full flex-row items-center justify-center rounded-[14px]"
					style={{ backgroundColor: slots[0].color.hex }}
				>
					<Text
						allowFontScaling
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 16,
							color: ctaLabelColor,
							marginRight: 8,
						}}
					>
						{t("visualizer.makeMineButton")}
					</Text>
					<Text
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 16,
							color: ctaLabelColor,
						}}
					>
						{"→"}
					</Text>
				</Pressable>
			</View>
			{/* 2-step coach mark overlay — outside ScrollView, zIndex 999 */}
			{coachStep > 0 && (
				<View
					className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center"
					style={{ zIndex: 999, backgroundColor: "rgba(0,0,0,0.5)" }}
					accessibilityRole="alert"
					testID="coach-mark-overlay"
				>
					<ReanimatedAnimated.View
						style={[
							{
								borderRadius: 16,
								paddingHorizontal: 28,
								paddingVertical: 28,
								marginHorizontal: isTablet ? 80 : 40,
								maxWidth: isTablet ? 480 : 300,
								alignItems: "center",
								backgroundColor: wadaTokens.bgPaper,
							},
							cardAnimStyle,
						]}
					>
						<Text
							className="text-base text-center mb-5"
							style={{
								fontFamily: "NotoSerifJP_400Regular",
								color: wadaTokens.textPrimary,
							}}
							testID="coach-mark-text"
						>
							{coachStep === 1
								? t("visualizer.coachStep1")
								: t("visualizer.coachStep2")}
						</Text>
						<Pressable
							onPress={handleCoachOk}
							accessibilityRole="button"
							accessibilityLabel={t("visualizer.gotIt")}
							testID="coach-mark-ok"
							className="rounded-lg px-8 py-3 min-w-[44px] min-h-[44px] justify-center items-center"
							style={{ backgroundColor: wadaTokens.textPrimary }}
						>
							<Text
								className="text-sm"
								style={{
									color: wadaTokens.bgPaper,
									fontFamily: "Inter_500Medium",
								}}
							>
								{t("visualizer.gotIt")}
							</Text>
						</Pressable>
					</ReanimatedAnimated.View>
				</View>
			)}
		</View>
	);
}
