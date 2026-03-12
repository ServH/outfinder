import { Text, View } from "react-native";

type SettingsProps = Record<string, never>;

export function Settings(_props: SettingsProps) {
	return (
		<View
			className="flex-1 items-center justify-center bg-paper"
			accessibilityLabel="Settings screen"
		>
			<Text className="font-serif-jp text-lg text-primary">
				Settings — Story 6.2
			</Text>
		</View>
	);
}
