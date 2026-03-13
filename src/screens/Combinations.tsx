import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View } from "react-native";
import { ColorHeader } from "@/components/ColorHeader";
import { CombinationList } from "@/components/CombinationList";
import { getColor, getCombinations } from "@/data/colorIndex";
import type { ColorsStackParamList } from "@/navigation/types";

type CombinationsProps = NativeStackScreenProps<
	ColorsStackParamList,
	"Combinations"
>;

export function Combinations({ route }: CombinationsProps) {
	const { colorId } = route.params;
	const color = getColor(colorId);
	const combinations = getCombinations(colorId);

	if (!color) {
		return null;
	}

	return (
		<View className="flex-1 bg-bg-paper">
			<ColorHeader color={color} combinationCount={combinations.length} />
			<CombinationList combinations={combinations} selectedColorId={colorId} />
		</View>
	);
}
