import { Text, View } from "react-native";

type UnifiedCameraResultScreenProps = Record<string, never>;

export function UnifiedCameraResultScreen(
	_props: UnifiedCameraResultScreenProps,
) {
	return (
		<View
			testID="unified-camera-result-placeholder"
			className="flex-1 items-center justify-center bg-paper px-6"
		>
			<Text className="text-center font-sans text-base text-primary">
				Result (coming in 14.4)
			</Text>
		</View>
	);
}
