import type { RouteProp } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { ScrollView, Text, View } from "react-native";

import { OutfitMannequin } from "@/components/OutfitMannequin";
import { getCombination } from "@/data/colorIndex";
import type { ColorsStackParamList } from "@/navigation/types";

type OutfitVisualizerRoute = RouteProp<
	ColorsStackParamList,
	"OutfitVisualizer"
>;

export function OutfitVisualizer() {
	const route = useRoute<OutfitVisualizerRoute>();
	const { combinationId } = route.params;
	const combination = getCombination(combinationId);

	if (!combination) {
		return (
			<View
				className="flex-1 items-center justify-center bg-paper"
				accessibilityLabel="Outfit Visualizer screen"
			>
				<Text className="font-sans text-base text-secondary">
					Combination not found
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			className="flex-1 bg-paper"
			contentContainerClassName="items-center px-6 py-8"
			accessibilityLabel="Outfit Visualizer screen"
		>
			<OutfitMannequin colors={combination.colors} />
		</ScrollView>
	);
}
