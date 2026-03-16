import { Image } from "react-native";

import type { GarmentComponentProps } from "./index";

export function ShoesSneakers({
	color,
	accessibilityLabel,
	width,
	height,
}: GarmentComponentProps) {
	return (
		<Image
			source={require("@/assets/garments/shoes-sneakers.png")}
			style={{ width, height, tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
