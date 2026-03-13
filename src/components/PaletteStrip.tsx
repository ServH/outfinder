import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";
import type { Combination } from "@/data/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";

export interface PaletteStripProps {
	combination: Combination;
	selectedColorId: string;
}

type CombinationsNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"Combinations"
>;

export function PaletteStrip({
	combination,
	selectedColorId,
}: PaletteStripProps) {
	const navigation = useNavigation<CombinationsNav>();
	const reducedMotion = useReducedMotion();
	const colorNames = combination.colors.map((c) => c.nameEn).join(", ");

	return (
		<View
			testID={`palette-strip-${combination.id}`}
			accessibilityLabel={`Combination: ${colorNames}`}
		>
			<View className="overflow-hidden rounded-lg">
				<View className="flex-row" style={{ height: 120 }}>
					{combination.colors.map((color, index) => {
						const isSelected = color.id === selectedColorId;

						return (
							<View key={color.id} className="flex-1 flex-row">
								{index > 0 && <View className="w-[0.5px] bg-hairline" />}
								<Pressable
									className="flex-1"
									testID={`palette-color-${color.id}`}
									disabled={isSelected}
									accessibilityRole={isSelected ? undefined : "link"}
									accessibilityLabel={
										isSelected
											? `Selected: ${color.nameEn}`
											: `View combinations for ${color.nameEn}`
									}
									onPress={() => {
										hapticLight();
										navigation.push("Combinations", { colorId: color.id });
									}}
								>
									{({ pressed }) => (
										<View
											className="flex-1 items-center justify-end"
											style={{
												backgroundColor: color.hex,
												opacity:
													pressed && !isSelected && !reducedMotion ? 0.88 : 1,
											}}
										>
											{isSelected && (
												<View
													className="mb-2 h-[6px] w-[6px] rounded-full bg-white"
													testID="selected-color-dot"
												/>
											)}
										</View>
									)}
								</Pressable>
							</View>
						);
					})}
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
