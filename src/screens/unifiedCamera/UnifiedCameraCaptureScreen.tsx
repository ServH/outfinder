import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "@/navigation/types";

type UnifiedCameraCaptureScreenProps = Record<string, never>;

export function UnifiedCameraCaptureScreen(
	_props: UnifiedCameraCaptureScreenProps,
) {
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation();

	function handleBack() {
		navigation
			.getParent<NativeStackNavigationProp<RootStackParamList>>()
			?.goBack();
	}

	return (
		<View
			testID="unified-camera-capture-placeholder"
			className="flex-1 items-center justify-center bg-paper px-6"
		>
			<Pressable
				testID="unified-camera-capture-back"
				accessibilityRole="button"
				accessibilityLabel={t("colorCapture.closeCameraLabel")}
				onPress={handleBack}
				hitSlop={12}
				className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-surface"
				style={{ top: insets.top + 8 }}
			>
				<Text className="text-lg text-primary">✕</Text>
			</Pressable>
			<Text className="text-center font-sans text-base text-primary">
				Capture (coming in 14.3b)
			</Text>
		</View>
	);
}
