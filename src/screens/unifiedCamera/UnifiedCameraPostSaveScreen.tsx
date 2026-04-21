import { Text, View } from "react-native";

type UnifiedCameraPostSaveScreenProps = Record<string, never>;

export function UnifiedCameraPostSaveScreen(
	_props: UnifiedCameraPostSaveScreenProps,
) {
	return (
		<View
			testID="unified-camera-postsave-placeholder"
			className="flex-1 items-center justify-center bg-paper px-6"
		>
			<Text className="text-center font-sans text-base text-primary">
				Post-save (coming in 14.5)
			</Text>
		</View>
	);
}
