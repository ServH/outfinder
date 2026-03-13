import { Image } from "react-native";

export interface TopShirtProps {
	color: string;
	accessibilityLabel: string;
}

export function TopShirt({ color, accessibilityLabel }: TopShirtProps) {
	return (
		<Image
			className="w-full aspect-[0.90]"
			source={require("@/assets/garments/top-shirt.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
