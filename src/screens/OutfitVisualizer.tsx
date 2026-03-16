import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { AccessibilityInfo, Text, View } from "react-native";
import { GARMENT_REGISTRY } from "@/components/garments/index";
import { OutfitMannequin } from "@/components/OutfitMannequin";
import { PaletteBar } from "@/components/PaletteBar";
import { getCombination } from "@/data/colorIndex";
import { useOutfitState, VARIANT_PAIRS } from "@/hooks/useOutfitState";
import { hapticMedium } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";

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

	const [mannequinLayout, setMannequinLayout] = useState({
		height: 0,
		width: 0,
	});

	const handleMannequinAreaLayout = useCallback((e: LayoutChangeEvent) => {
		const { height, width } = e.nativeEvent.layout;
		setMannequinLayout({ height, width });
	}, []);

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
		<View
			className="flex-1 bg-paper"
			accessibilityLabel="Outfit Visualizer screen"
		>
			<View
				testID="mannequin-area"
				className="flex-1 items-center justify-center px-6"
				onLayout={handleMannequinAreaLayout}
			>
				{mannequinLayout.height > 0 && (
					<OutfitMannequin
						slots={slots}
						selectedSlotIndex={selectedSlotIndex}
						onSlotTap={handleSlotTap}
						onVariantToggle={handleVariantToggle}
						availableHeight={mannequinLayout.height}
						containerWidth={mannequinLayout.width}
					/>
				)}
			</View>
			<PaletteBar slots={slots} />
		</View>
	);
}
