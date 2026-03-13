import { Image } from "react-native";

export interface TopTShirtProps {
	color: string;
	accessibilityLabel: string;
}

export function TopTShirt({ color, accessibilityLabel }: TopTShirtProps) {
	return (
		<Image
			className="w-full aspect-[1.03]"
			source={require("@/assets/garments/top-tshirt.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
