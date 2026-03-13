import { Image } from "react-native";

export interface ShoesFormalProps {
	color: string;
	accessibilityLabel: string;
}

export function ShoesFormal({ color, accessibilityLabel }: ShoesFormalProps) {
	return (
		<Image
			className="w-full aspect-[2.44]"
			source={require("@/assets/garments/shoes-formal.png")}
			style={{ tintColor: color }}
			resizeMode="contain"
			accessibilityLabel={accessibilityLabel}
		/>
	);
}
