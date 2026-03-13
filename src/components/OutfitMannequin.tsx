import { View } from "react-native";

import type { GarmentType } from "@/components/garments/index";
import type { Color } from "@/data/types";

import { GarmentSlot } from "./GarmentSlot";

interface SlotData {
	garmentType: GarmentType;
	color: Color;
}

export interface OutfitMannequinProps {
	colors: Color[];
}

const SLOT_CONFIGS: Record<number, GarmentType[]> = {
	2: ["top-tshirt", "bottom-pants"],
	3: ["top-tshirt", "bottom-pants", "shoes-sneakers"],
	4: ["layer-jacket", "top-tshirt", "bottom-pants", "shoes-sneakers"],
};

export function OutfitMannequin({ colors }: OutfitMannequinProps) {
	const garmentTypes = SLOT_CONFIGS[colors.length];
	if (!garmentTypes) {
		return null;
	}

	const slots: SlotData[] = garmentTypes.map((garmentType, index) => ({
		garmentType,
		color: colors[index],
	}));

	return (
		<View className="items-center gap-1" accessibilityLabel="Outfit mannequin">
			{slots.map((slot) => (
				<GarmentSlot
					key={slot.garmentType}
					garmentType={slot.garmentType}
					color={slot.color.hex}
					colorName={slot.color.nameEn}
				/>
			))}
		</View>
	);
}
