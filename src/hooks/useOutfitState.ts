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

// Ordered cycle arrays per garment category.
// In 2/3-color combos (no dedicated layer slot), tops and layers merge into one cycle.
// In 4-color combos (dedicated layer slot), they stay separate.
const UPPER_FULL: GarmentType[] = [
	"top-tshirt",
	"top-shirt",
	"layer-jacket",
	"layer-hoodie",
];
const UPPER_TOP: GarmentType[] = ["top-tshirt", "top-shirt"];
const UPPER_LAYER: GarmentType[] = ["layer-jacket", "layer-hoodie"];
const LOWER: GarmentType[] = ["bottom-pants", "bottom-skirt"];
const FOOT: GarmentType[] = ["shoes-sneakers", "shoes-formal"];

const ALL_UPPER = [...UPPER_TOP, ...UPPER_LAYER];

export function getCycleForGarment(
	garmentType: GarmentType,
	slotCount: number,
): GarmentType[] {
	if (LOWER.includes(garmentType)) return LOWER;
	if (FOOT.includes(garmentType)) return FOOT;
	// Upper body: merge tops+layers when no dedicated layer slot (< 4 colors)
	if (ALL_UPPER.includes(garmentType)) {
		if (slotCount < 4) return UPPER_FULL;
		if (UPPER_LAYER.includes(garmentType)) return UPPER_LAYER;
		return UPPER_TOP;
	}
	return [garmentType];
}

function cycleGarment(
	garmentType: GarmentType,
	direction: 1 | -1,
	slotCount: number,
): GarmentType {
	const cycle = getCycleForGarment(garmentType, slotCount);
	const pos = cycle.indexOf(garmentType);
	const next = (pos + direction + cycle.length) % cycle.length;
	return cycle[next];
}

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

	function cycleVariant(index: number, direction: 1 | -1) {
		setSlots((prev) => {
			const next = [...prev];
			const current = next[index];
			next[index] = {
				...current,
				garmentType: cycleGarment(current.garmentType, direction, prev.length),
			};
			return next;
		});
	}

	return { slots, selectedSlotIndex, selectSlot, cycleVariant };
}
