import { Text, View } from "react-native";
import type { Combination } from "@/data/types";

export interface PaletteStripProps {
	combination: Combination;
	selectedColorId: string;
}

export function PaletteStrip({
	combination,
	selectedColorId,
}: PaletteStripProps) {
	const colorNames = combination.colors.map((c) => c.nameEn).join(", ");

	return (
		<View
			testID={`palette-strip-${combination.id}`}
			accessibilityLabel={`Combination: ${colorNames}`}
		>
			<View className="overflow-hidden rounded-lg">
				<View className="flex-row" style={{ height: 120 }}>
					{combination.colors.map((color, index) => (
						<View key={color.id} className="flex-1 flex-row">
							{index > 0 && <View className="w-[0.5px] bg-hairline" />}
							<View
								className="flex-1 items-center justify-end"
								style={{ backgroundColor: color.hex }}
								testID={`palette-color-${color.id}`}
							>
								{color.id === selectedColorId && (
									<View
										className="mb-2 h-[6px] w-[6px] rounded-full bg-white"
										testID="selected-color-dot"
									/>
								)}
							</View>
						</View>
					))}
				</View>
			</View>
			<View className="mt-2 flex-row">
				{combination.colors.map((color) => (
					<View key={color.id} className="flex-1 items-center">
						<Text className="font-serif-jp text-[11px] text-text-primary">
							{color.nameJp}
						</Text>
						<Text className="font-sans text-[10px] text-text-secondary">
							{color.nameEn}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
