import { Image } from "react-native";

export interface ShoesSneakersProps {
	color: string;
	accessibilityLabel: string;
}

export function ShoesSneakers({
	color,
	accessibilityLabel,
}: ShoesSneakersProps) {
	return (
		<Image
			className="w-full aspect-[2.23]"
			source={require("@/assets/garments/shoes-sneakers.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
