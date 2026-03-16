import { Text, View } from "react-native";

import { GARMENT_REGISTRY } from "@/components/garments/index";
import type { SlotState } from "@/hooks/useOutfitState";

export interface PaletteBarProps {
	slots: SlotState[];
}

export function PaletteBar({ slots }: PaletteBarProps) {
	const paletteLabel = `Color palette: ${slots
		.map(
			(slot) =>
				`${slot.color.nameEn} on ${GARMENT_REGISTRY[slot.garmentType].label}`,
		)
		.join(", ")}`;

	return (
		<View
			className="flex-row justify-center gap-4 py-3"
			accessibilityLabel={paletteLabel}
		>
			{slots.map((slot, index) => {
				const garmentLabel = GARMENT_REGISTRY[slot.garmentType].label;
				const swatchLabel = `${slot.color.nameEn}, assigned to ${garmentLabel}`;

				return (
					<View
						// biome-ignore lint/suspicious/noArrayIndexKey: slot position is stable; color.id moves on swap breaking animations
						key={index}
						className="items-center"
						accessibilityLabel={swatchLabel}
					>
						<View
							className="w-10 h-10 rounded-lg border border-black/10"
							style={{ backgroundColor: slot.color.hex }}
						/>
						<Text className="font-serif text-[11px] text-secondary mt-1">
							{slot.color.nameEn}
						</Text>
					</View>
				);
			})}
		</View>
	);
}
