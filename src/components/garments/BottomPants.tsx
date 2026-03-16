import { Image } from "react-native";

import type { GarmentComponentProps } from "./index";

export function BottomPants({
	color,
	accessibilityLabel,
	width,
	height,
}: GarmentComponentProps) {
	return (
		<Image
			source={require("@/assets/garments/bottom-pants.png")}
			style={{ width, height, tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
