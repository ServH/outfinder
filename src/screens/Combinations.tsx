import { Text, View } from "react-native";

type CombinationsProps = Record<string, never>;

export function Combinations(_props: CombinationsProps) {
	return (
		<View
			className="flex-1 items-center justify-center bg-paper"
			accessibilityLabel="Combinations screen"
		>
			<Text className="font-serif-jp text-lg text-primary">
				Combinations — Story 1.4
			</Text>
		</View>
	);
}
