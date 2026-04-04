import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RouteProp } from "@react-navigation/native";
import {
	useNavigation,
	useNavigationState,
	useRoute,
} from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AccessibilityInfo,
	Alert,
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
import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics";
import { shareOutfit } from "@/lib/share";
import type { ColorsStackParamList } from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

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
	const route = useRoute<OutfitVisualizerRoute>();
	const navigation = useNavigation();
	const prevRoute = useNavigationState((state) =>
		state.index > 0 ? state.routes[state.index - 1] : undefined,
	);
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

	const shareViewRef = useRef<View>(null);

	const [sharing, setSharing] = useState(false);

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

	const handleShare = useCallback(async () => {
		if (sharing) return;
		hapticRigid();
		setSharing(true);
		const success = await shareOutfit(shareViewRef);
		setSharing(false);
		if (!success) {
			Alert.alert(t("visualizer.shareError"), t("visualizer.shareErrorBody"));
		}
	}, [sharing, t]);

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
				{/* Capturable area — everything the user sees minus the share button */}
				<View ref={shareViewRef} collapsable={false} className="flex-1">
					<WarmBackground />
					<View className="flex-1 items-center justify-center py-4">
						<Aureola hex={slots[0].color.hex} width={screenW} height={500} />
						<WadaHeader
							nameJp={combination.nameJp}
							nameEn={combination.nameEn}
							colorCount={combination.colors.length}
						/>
						<View className="relative">
							<OutfitCard
								slots={slots}
								selectedSlotIndex={selectedSlotIndex}
								onSlotTap={handleSlotTap}
								onVariantCycle={handleVariantCycle}
							/>
							<Pressable
								onPress={handlePreviousGarment}
								accessibilityRole="button"
								accessibilityLabel={t("visualizer.previousGarment")}
								testID="arrow-previous"
								className="absolute min-w-[44px] min-h-[44px] justify-center items-center"
								style={{ left: -28, top: "50%", marginTop: -16 }}
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
								style={{ right: -28, top: "50%", marginTop: -16 }}
							>
								<Text
									className="text-[28px]"
									style={{ color: wadaTokens.textTertiary, opacity: 0.5 }}
								>
									{"›"}
								</Text>
							</Pressable>
						</View>
						<View className="mt-4">
							<MiniPaletteStrip
								colors={slots.map((s) => ({
									hex: s.color.hex,
									nameEn: s.color.nameEn,
								}))}
							/>
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
			{/* Share button */}
			<View className="items-center py-3">
				<Pressable
					onPress={handleShare}
					disabled={sharing}
					accessibilityLabel={t("visualizer.shareLabel")}
					accessibilityRole="button"
					className="min-h-[48px] items-center justify-center rounded-full bg-surface px-6 py-3"
					style={{ opacity: sharing ? 0.5 : 1 }}
				>
					<Text
						allowFontScaling
						className="font-sans text-sm font-medium text-primary"
					>
						{t("visualizer.shareButton")}
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
								marginHorizontal: 40,
								maxWidth: 300,
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
