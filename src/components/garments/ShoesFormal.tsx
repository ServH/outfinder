import { Image } from "react-native";

import type { GarmentComponentProps } from "./index";

export function ShoesFormal({
	color,
	accessibilityLabel,
	width,
	height,
}: GarmentComponentProps) {
	return (
		<Image
			source={require("@/assets/garments/shoes-formal.png")}
			style={{ width, height, tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
