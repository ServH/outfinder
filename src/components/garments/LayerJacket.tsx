import { Image } from "react-native";

export interface LayerJacketProps {
	color: string;
	accessibilityLabel: string;
}

export function LayerJacket({ color, accessibilityLabel }: LayerJacketProps) {
	return (
		<Image
			className="w-full aspect-[0.97]"
			source={require("@/assets/garments/layer-jacket.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
