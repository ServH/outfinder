import { Image } from "react-native";

import type { GarmentComponentProps } from "./index";

export function LayerHoodie({
	color,
	accessibilityLabel,
	width,
	height,
}: GarmentComponentProps) {
	return (
		<Image
			source={require("@/assets/garments/layer-hoodie.png")}
			style={{ width, height, tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
