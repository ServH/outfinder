import { View } from "react-native";

import {
	GARMENT_REGISTRY,
	type GarmentType,
} from "@/components/garments/index";

export interface GarmentSlotProps {
	garmentType: GarmentType;
	color: string;
	colorName: string;
}

export function GarmentSlot({
	garmentType,
	color,
	colorName,
}: GarmentSlotProps) {
	const config = GARMENT_REGISTRY[garmentType];
	const Component = config.component;
	const label = `${config.label}, colored ${colorName}`;

	return (
		<View
			className="min-h-[44px] items-center"
			accessibilityRole="image"
			accessibilityLabel={label}
		>
			<Component color={color} accessibilityLabel="" />
		</View>
	);
}
