import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
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
import { getCombination } from "@/data/colorIndex";
import { getCycleForGarment, useOutfitState } from "@/hooks/useOutfitState";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticMedium, hapticRigid } from "@/lib/haptics";
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
	const { width: screenW } = useWindowDimensions();
	const route = useRoute<OutfitVisualizerRoute>();
	const navigation = useNavigation();
	const { combinationId } = route.params;
	const combination = getCombination(combinationId);
	const reducedMotion = useReducedMotion();

	const shareViewRef = useRef<View>(null);

	const [sharing, setSharing] = useState(false);
	const [hasSwipedInSession, setHasSwipedInSession] = useState(false);
	const [hintSeen, setHintSeen] = useState(true);
	const dismissedRef = useRef(false);

	const { slots, selectedSlotIndex, selectSlot, cycleVariant } = useOutfitState(
		combination?.colors ?? [],
	);

	// Chevron animation
	const chevronOpacity = useSharedValue(0);
	const chevronStyle = useAnimatedStyle(() => ({
		opacity: chevronOpacity.value,
	}));

	useEffect(() => {
		if (selectedSlotIndex !== null && !hasSwipedInSession) {
			chevronOpacity.value = reducedMotion
				? 0.6
				: withTiming(0.6, { duration: 200 });
		} else {
			chevronOpacity.value = reducedMotion
				? 0
				: withTiming(0, { duration: 300 });
		}
	}, [selectedSlotIndex, hasSwipedInSession, reducedMotion, chevronOpacity]);

	// Tooltip animation
	const tooltipOpacity = useSharedValue(1);
	const tooltipAnimStyle = useAnimatedStyle(() => ({
		opacity: tooltipOpacity.value,
	}));

	// Read hint flag on mount
	useEffect(() => {
		(async () => {
			try {
				const value = await AsyncStorage.getItem("@outfinder/hintSeen");
				if (value !== "true") {
					setHintSeen(false);
					AccessibilityInfo.announceForAccessibility(
						"Tap a garment to swap its color. Swipe left or right to change garment style.",
					);
				}
			} catch {
				// AsyncStorage read failed — show tooltip as fallback
				setHintSeen(false);
				AccessibilityInfo.announceForAccessibility(
					"Tap a garment to swap its color. Swipe left or right to change garment style.",
				);
			}
		})();
	}, []);

	const dismissHint = useCallback(() => {
		if (dismissedRef.current) return;
		dismissedRef.current = true;
		setHintSeen(true);
		if (reducedMotion) {
			tooltipOpacity.value = 0;
		} else {
			tooltipOpacity.value = withTiming(0, { duration: 300 });
		}
		AsyncStorage.setItem("@outfinder/hintSeen", "true").catch(() => {
			// Best-effort persistence
		});
	}, [reducedMotion, tooltipOpacity]);

	// Auto-dismiss tooltip after 8s
	useEffect(() => {
		if (!hintSeen) {
			const timer = setTimeout(dismissHint, 8000);
			return () => clearTimeout(timer);
		}
	}, [hintSeen, dismissHint]);

	const handleShare = useCallback(async () => {
		if (sharing) return;
		hapticRigid();
		setSharing(true);
		const success = await shareOutfit(shareViewRef);
		setSharing(false);
		if (!success) {
			Alert.alert(
				"Unable to share",
				"Something went wrong generating the image. Please try again.",
			);
		}
	}, [sharing]);

	const handleSlotTap = useCallback(
		(index: number) => {
			const tappedSlot = slots[index];
			const tappedLabel = GARMENT_REGISTRY[tappedSlot.garmentType].label;

			if (selectedSlotIndex === null) {
				hapticMedium();
				selectSlot(index);
				AccessibilityInfo.announceForAccessibility(
					`Selected ${tappedLabel} for swap`,
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
					`${selectedLabel} is now ${newColorA}, ${tappedLabel} is now ${newColorB}`,
				);
			}
		},
		[slots, selectedSlotIndex, selectSlot],
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
			AccessibilityInfo.announceForAccessibility(`Changed to ${newLabel}`);
			if (!hasSwipedInSession) {
				setHasSwipedInSession(true);
			}
		},
		[slots, cycleVariant, hasSwipedInSession],
	);

	if (!combination) {
		return (
			<View
				className="flex-1 items-center justify-center bg-paper"
				accessibilityLabel="Outfit Visualizer screen"
			>
				<Text className="font-sans text-base text-secondary">
					Combination not found
				</Text>
			</View>
		);
	}

	return (
		<View
			className="flex-1"
			style={{ backgroundColor: wadaTokens.warmBg }}
			accessibilityLabel="Outfit Visualizer screen"
		>
			{/* Back button — matches State 2 custom style */}
			<View className="px-4 pt-4 pb-1" style={{ paddingTop: 60 }}>
				<Pressable
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel="Go back"
					className="min-h-[48px] flex-row items-center"
					testID="visualizer-back-button"
				>
					<Text
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 28,
							color: wadaTokens.textPrimary,
						}}
					>
						←
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
						<View style={{ position: "relative", overflow: "visible" }}>
							<OutfitCard
								slots={slots}
								selectedSlotIndex={selectedSlotIndex}
								onSlotTap={handleSlotTap}
								onVariantCycle={handleVariantCycle}
							/>
							{selectedSlotIndex !== null && !sharing && (
								<>
									<ReanimatedAnimated.View
										style={[
											{
												position: "absolute",
												left: -28,
												top: 0,
												bottom: 0,
												justifyContent: "center",
											},
											chevronStyle,
										]}
										accessibilityElementsHidden={true}
									>
										<Text
											style={{
												fontSize: 28,
												color: wadaTokens.premiumAccent,
											}}
										>
											{"‹"}
										</Text>
									</ReanimatedAnimated.View>
									<ReanimatedAnimated.View
										style={[
											{
												position: "absolute",
												right: -28,
												top: 0,
												bottom: 0,
												justifyContent: "center",
											},
											chevronStyle,
										]}
										accessibilityElementsHidden={true}
									>
										<Text
											style={{
												fontSize: 28,
												color: wadaTokens.premiumAccent,
											}}
										>
											{"›"}
										</Text>
									</ReanimatedAnimated.View>
								</>
							)}
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
			{/* Share button — in normal flow below capture area, never overlaps content */}
			<View className="items-center py-3">
				<Pressable
					onPress={handleShare}
					disabled={sharing}
					accessibilityLabel="Share outfit image"
					accessibilityRole="button"
					className="min-h-[48px] items-center justify-center rounded-full bg-bg-surface px-6 py-3"
					style={{ opacity: sharing ? 0.5 : 1 }}
				>
					<Text
						allowFontScaling
						className="font-sans text-sm font-medium text-primary"
					>
						Share Outfit
					</Text>
				</Pressable>
			</View>
			{/* First-visit tooltip overlay — outside shareViewRef */}
			{!hintSeen && (
				<ReanimatedAnimated.View
					style={[
						{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: 10,
						},
						tooltipAnimStyle,
					]}
				>
					<Pressable
						style={{
							flex: 1,
							backgroundColor: "rgba(0,0,0,0.5)",
							justifyContent: "center",
							alignItems: "center",
						}}
						onPress={dismissHint}
						accessibilityLabel="Tap a garment to swap its color. Swipe left or right to change garment style. Tap to dismiss."
						accessibilityRole="button"
					>
						<View
							style={{
								backgroundColor: "#1a1a1a",
								borderRadius: 12,
								padding: 24,
								marginHorizontal: 40,
								maxWidth: 300,
							}}
						>
							<Text
								style={{
									color: "#fafaf8",
									fontFamily: "Inter_500Medium",
									fontSize: 15,
									textAlign: "center",
									lineHeight: 22,
								}}
							>
								Tap a garment to swap its color{"\n\n"}Swipe left or right to
								change garment style
							</Text>
						</View>
					</Pressable>
				</ReanimatedAnimated.View>
			)}
		</View>
	);
}
