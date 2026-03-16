import { Image } from "react-native";

export interface BottomSkirtProps {
	color: string;
	accessibilityLabel: string;
}

export function BottomSkirt({ color, accessibilityLabel }: BottomSkirtProps) {
	return (
		<Image
			className="w-full aspect-[0.89]"
			source={require("@/assets/garments/bottom-skirt.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
