import { Image } from "react-native";

export interface LayerHoodieProps {
	color: string;
	accessibilityLabel: string;
}

export function LayerHoodie({ color, accessibilityLabel }: LayerHoodieProps) {
	return (
		<Image
			className="w-full aspect-[0.87]"
			source={require("@/assets/garments/layer-hoodie.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
