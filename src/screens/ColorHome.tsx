import { Text, View } from "react-native";

type ColorHomeProps = Record<string, never>;

export function ColorHome(_props: ColorHomeProps) {
	return (
		<View
			className="flex-1 items-center justify-center bg-paper"
			accessibilityLabel="Color Home screen"
		>
			<Text className="font-serif-jp text-lg text-primary">
				Color Home — Story 1.3
			</Text>
		</View>
	);
}
