import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { UnifiedCameraCaptureScreen } from "@/screens/unifiedCamera/UnifiedCameraCaptureScreen";
import { UnifiedCameraPostSaveScreen } from "@/screens/unifiedCamera/UnifiedCameraPostSaveScreen";
import { UnifiedCameraResultScreen } from "@/screens/unifiedCamera/UnifiedCameraResultScreen";
import type { UnifiedCameraStackParamList } from "./types";

const Stack = createNativeStackNavigator<UnifiedCameraStackParamList>();

export function UnifiedCameraStack() {
	const isReducedMotion = useReducedMotion();
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				animation: isReducedMotion ? "none" : "fade",
			}}
		>
			<Stack.Screen name="Capture" component={UnifiedCameraCaptureScreen} />
			<Stack.Screen name="Result" component={UnifiedCameraResultScreen} />
			<Stack.Screen name="PostSave" component={UnifiedCameraPostSaveScreen} />
		</Stack.Navigator>
	);
}
