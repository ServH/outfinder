import { View } from "react-native";

import type { GarmentType } from "@/components/garments/index";
import type { SlotState } from "@/hooks/useOutfitState";

import { GarmentSlot } from "./GarmentSlot";

export interface OutfitMannequinProps {
	slots: SlotState[];
	selectedSlotIndex: number | null;
	onSlotTap: (index: number) => void;
	onVariantToggle: (index: number) => void;
	availableHeight: number;
	containerWidth: number;
}

const SLOT_OVERLAP = -6;

const HEIGHT_RATIOS: Record<number, Record<string, number>> = {
	4: { layer: 0.25, top: 0.2, bottom: 0.4, shoes: 0.15 },
	3: { top: 0.28, bottom: 0.45, shoes: 0.27 },
	2: { top: 0.4, bottom: 0.6 },
};

const WIDTH_RATIOS: Record<string, number> = {
	layer: 0.65,
	top: 0.55,
	bottom: 0.4,
	shoes: 0.5,
};

function getSlotCategory(garmentType: GarmentType): string {
	if (garmentType.startsWith("layer-")) return "layer";
	if (garmentType.startsWith("top-")) return "top";
	if (garmentType.startsWith("bottom-")) return "bottom";
	return "shoes";
}

export function OutfitMannequin({
	slots,
	selectedSlotIndex,
	onSlotTap,
	onVariantToggle,
	availableHeight,
	containerWidth,
}: OutfitMannequinProps) {
	if (slots.length === 0 || availableHeight <= 0) {
		return null;
	}

	const slotCount = slots.length;
	const ratios = HEIGHT_RATIOS[slotCount] ?? HEIGHT_RATIOS[2];
	const mannequinWidth = containerWidth * 0.55;
	const overlapCount = Math.max(0, slots.length - 1);
	const usableHeight = availableHeight - overlapCount * Math.abs(SLOT_OVERLAP);

	return (
		<View
			style={{ width: mannequinWidth, alignSelf: "center" }}
			accessibilityLabel="Outfit mannequin"
		>
			{slots.map((slot, index) => {
				const category = getSlotCategory(slot.garmentType);
				const heightRatio = ratios[category] ?? 0.25;
				const widthRatio = WIDTH_RATIOS[category] ?? 0.5;
				const slotHeight = usableHeight * heightRatio;
				const slotWidth = mannequinWidth * widthRatio;

				return (
					<View
						// biome-ignore lint/suspicious/noArrayIndexKey: slot position is stable; color.id moves on swap breaking animations
						key={index}
						style={index > 0 ? { marginTop: SLOT_OVERLAP } : undefined}
					>
						<GarmentSlot
							garmentType={slot.garmentType}
							color={slot.color.hex}
							colorName={slot.color.nameEn}
							isSelected={selectedSlotIndex === index}
							onTap={() => onSlotTap(index)}
							onVariantToggle={() => onVariantToggle(index)}
							slotWidth={slotWidth}
							slotHeight={slotHeight}
						/>
					</View>
				);
			})}
		</View>
	);
}
