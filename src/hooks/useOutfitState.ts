import { useState } from "react";

import type { GarmentType } from "@/components/garments/index";
import type { Color } from "@/data/types";

export interface SlotState {
	garmentType: GarmentType;
	color: Color;
}

const SLOT_CONFIGS: Record<number, GarmentType[]> = {
	2: ["top-tshirt", "bottom-pants"],
	3: ["top-tshirt", "bottom-pants", "shoes-sneakers"],
	4: ["layer-jacket", "top-tshirt", "bottom-pants", "shoes-sneakers"],
};

export const VARIANT_PAIRS: Record<GarmentType, GarmentType> = {
	"top-tshirt": "top-shirt",
	"top-shirt": "top-tshirt",
	"bottom-pants": "bottom-skirt",
	"bottom-skirt": "bottom-pants",
	"layer-jacket": "layer-hoodie",
	"layer-hoodie": "layer-jacket",
	"shoes-sneakers": "shoes-formal",
	"shoes-formal": "shoes-sneakers",
};

function buildInitialSlots(colors: Color[]): SlotState[] {
	const garmentTypes = SLOT_CONFIGS[colors.length];
	if (!garmentTypes) {
		return [];
	}
	return garmentTypes.map((garmentType, index) => ({
		garmentType,
		color: colors[index],
	}));
}

export function useOutfitState(colors: Color[]) {
	const [slots, setSlots] = useState<SlotState[]>(() =>
		buildInitialSlots(colors),
	);
	const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
		null,
	);

	function selectSlot(index: number) {
		if (selectedSlotIndex === null) {
			setSelectedSlotIndex(index);
		} else if (selectedSlotIndex === index) {
			setSelectedSlotIndex(null);
		} else {
			setSlots((prev) => {
				const next = [...prev];
				const tempColor = next[selectedSlotIndex].color;
				next[selectedSlotIndex] = {
					...next[selectedSlotIndex],
					color: next[index].color,
				};
				next[index] = { ...next[index], color: tempColor };
				return next;
			});
			setSelectedSlotIndex(null);
		}
	}

	function toggleVariant(index: number) {
		setSlots((prev) => {
			const next = [...prev];
			const current = next[index];
			next[index] = {
				...current,
				garmentType: VARIANT_PAIRS[current.garmentType],
			};
			return next;
		});
	}

	return { slots, selectedSlotIndex, selectSlot, toggleVariant };
}
