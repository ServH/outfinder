import { Text, View } from "react-native";

type OutfitVisualizerProps = Record<string, never>;

export function OutfitVisualizer(_props: OutfitVisualizerProps) {
	return (
		<View
			className="flex-1 items-center justify-center bg-paper"
			accessibilityLabel="Outfit Visualizer screen"
		>
			<Text className="font-serif-jp text-lg text-primary">
				Outfit Visualizer — Story 2.1
			</Text>
		</View>
	);
}
