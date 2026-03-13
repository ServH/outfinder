import { View } from "react-native";

import type { SlotState } from "@/hooks/useOutfitState";

import { GarmentSlot } from "./GarmentSlot";

export interface OutfitMannequinProps {
	slots: SlotState[];
	selectedSlotIndex: number | null;
	onSlotTap: (index: number) => void;
	onVariantToggle: (index: number) => void;
}

export function OutfitMannequin({
	slots,
	selectedSlotIndex,
	onSlotTap,
	onVariantToggle,
}: OutfitMannequinProps) {
	if (slots.length === 0) {
		return null;
	}

	return (
		<View
			style={{ width: 192, alignSelf: "center" }}
			accessibilityLabel="Outfit mannequin"
		>
			{slots.map((slot, index) => (
				<GarmentSlot
					// biome-ignore lint/suspicious/noArrayIndexKey: slot position is stable; color.id moves on swap breaking animations
					key={index}
					garmentType={slot.garmentType}
					color={slot.color.hex}
					colorName={slot.color.nameEn}
					isSelected={selectedSlotIndex === index}
					onTap={() => onSlotTap(index)}
					onVariantToggle={() => onVariantToggle(index)}
				/>
			))}
		</View>
	);
}
