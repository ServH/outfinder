import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
	AccessibilityInfo,
	Alert,
	Dimensions,
	Pressable,
	Text,
	View,
} from "react-native";
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
import { hapticMedium, hapticRigid } from "@/lib/haptics";
import { shareOutfit } from "@/lib/share";
import type { ColorsStackParamList } from "@/navigation/types";

const { width: SCREEN_W } = Dimensions.get("window");

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
	const route = useRoute<OutfitVisualizerRoute>();
	const { combinationId } = route.params;
	const combination = getCombination(combinationId);

	const shareViewRef = useRef<View>(null);

	const [sharing, setSharing] = useState(false);

	const { slots, selectedSlotIndex, selectSlot, cycleVariant } = useOutfitState(
		combination?.colors ?? [],
	);

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
		},
		[slots, cycleVariant],
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
		<View className="flex-1" accessibilityLabel="Outfit Visualizer screen">
			{/* Capturable area — everything the user sees minus the share button */}
			<View ref={shareViewRef} collapsable={false} className="flex-1">
				<WarmBackground />
				<View className="flex-1 items-center justify-center">
					<Aureola hex={slots[0].color.hex} width={SCREEN_W} height={500} />
					<WadaHeader
						nameJp={combination.nameJp}
						colorCount={combination.colors.length}
					/>
					<OutfitCard
						slots={slots}
						selectedSlotIndex={selectedSlotIndex}
						onSlotTap={handleSlotTap}
						onVariantCycle={handleVariantCycle}
					/>
					<View className="mt-4">
						<MiniPaletteStrip
							colors={slots.map((s) => ({
								hex: s.color.hex,
								nameEn: s.color.nameEn,
							}))}
						/>
					</View>
					<Text
						className="mt-6 font-sans-medium text-sm"
						style={{ color: "#a09080" }}
					>
						Outfinder
					</Text>
				</View>
			</View>
			{/* Share button — positioned over the content but excluded from capture */}
			<Pressable
				onPress={handleShare}
				disabled={sharing}
				accessibilityLabel="Share outfit image"
				accessibilityRole="button"
				className="absolute bottom-12 self-center min-h-[48px] items-center justify-center rounded-full bg-bg-surface px-6 py-3"
				style={{ opacity: sharing ? 0.5 : 1 }}
			>
				<Text className="font-sans text-sm font-medium text-primary">
					Share Outfit
				</Text>
			</Pressable>
		</View>
	);
}
