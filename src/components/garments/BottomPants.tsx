import { Image } from "react-native";

export interface BottomPantsProps {
	color: string;
	accessibilityLabel: string;
}

export function BottomPants({ color, accessibilityLabel }: BottomPantsProps) {
	return (
		<Image
			className="w-full aspect-[0.43]"
			source={require("@/assets/garments/bottom-pants.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
