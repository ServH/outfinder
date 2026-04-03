import { Text, View } from "react-native";
import type { Color } from "@/data/types";

export interface ColorHeaderProps {
	color: Color;
	combinationCount: number;
}

export function ColorHeader({ color, combinationCount }: ColorHeaderProps) {
	return (
		<View
			testID="color-header"
			className="flex-row items-center px-4 py-3"
			accessibilityLabel={`${color.nameEn}, ${combinationCount} ${combinationCount === 1 ? "combination" : "combinations"}`}
		>
			<View
				className="mr-3 h-[40px] w-[40px] rounded-lg"
				style={{ backgroundColor: color.hex }}
				testID="color-header-swatch"
			/>
			<View className="flex-1">
				<Text className="font-serif-jp text-lg text-primary">
					{color.nameJp}
				</Text>
				<Text className="font-sans text-xs text-secondary">
					{color.nameEn}
				</Text>
			</View>
			<Text className="font-sans text-xs text-tertiary">
				{combinationCount}{" "}
				{combinationCount === 1 ? "combination" : "combinations"}
			</Text>
		</View>
	);
}
