import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { AccessibilityInfo, Dimensions, Text, View } from "react-native";
import { Aureola } from "@/components/Aureola";
import { GARMENT_REGISTRY } from "@/components/garments/index";
import { MiniPaletteStrip } from "@/components/MiniPaletteStrip";
import { OutfitCard } from "@/components/OutfitCard";
import { WadaHeader } from "@/components/WadaHeader";
import { WarmBackground } from "@/components/WarmBackground";
import { getCombination } from "@/data/colorIndex";
import { useOutfitState, VARIANT_PAIRS } from "@/hooks/useOutfitState";
import { hapticMedium } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";

const { width: SCREEN_W } = Dimensions.get("window");

type OutfitVisualizerRoute = RouteProp<
	ColorsStackParamList,
	"OutfitVisualizer"
>;

export function OutfitVisualizer() {
	const route = useRoute<OutfitVisualizerRoute>();
	const { combinationId } = route.params;
	const combination = getCombination(combinationId);

	const { slots, selectedSlotIndex, selectSlot, toggleVariant } =
		useOutfitState(combination?.colors ?? []);

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

	const handleVariantToggle = useCallback(
		(index: number) => {
			hapticMedium();
			toggleVariant(index);
			const newType = VARIANT_PAIRS[slots[index].garmentType];
			if (newType) {
				const newLabel = GARMENT_REGISTRY[newType].label;
				AccessibilityInfo.announceForAccessibility(`Changed to ${newLabel}`);
			}
		},
		[slots, toggleVariant],
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
		<View style={{ flex: 1 }} accessibilityLabel="Outfit Visualizer screen">
			<WarmBackground />
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<Aureola hex={slots[0].color.hex} width={SCREEN_W} height={500} />
				<WadaHeader
					nameJp={combination.nameJp}
					colorCount={combination.colors.length}
				/>
				<OutfitCard
					slots={slots}
					selectedSlotIndex={selectedSlotIndex}
					onSlotTap={handleSlotTap}
					onVariantToggle={handleVariantToggle}
				/>
				<View style={{ marginTop: 16 }}>
					<MiniPaletteStrip
						colors={slots.map((s) => ({
							hex: s.color.hex,
							nameEn: s.color.nameEn,
						}))}
					/>
				</View>
			</View>
		</View>
	);
}
