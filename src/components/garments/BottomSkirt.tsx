import { Image } from "react-native";

import type { GarmentComponentProps } from "./index";

export function BottomSkirt({
	color,
	accessibilityLabel,
	width,
	height,
}: GarmentComponentProps) {
	return (
		<Image
			source={require("@/assets/garments/bottom-skirt.png")}
			style={{ width, height, tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
