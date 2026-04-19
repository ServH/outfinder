import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ArmarioCaptureScreen } from "@/screens/armario/ArmarioCaptureScreen";
import { ArmarioPreviewScreen } from "@/screens/armario/ArmarioPreviewScreen";
import type { ArmarioStackParamList } from "./types";

const Stack = createNativeStackNavigator<ArmarioStackParamList>();

export function ArmarioStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
			<Stack.Screen
				name="ArmarioCapture"
				component={ArmarioCaptureScreen}
				initialParams={undefined}
			/>
			<Stack.Screen name="ArmarioPreview" component={ArmarioPreviewScreen} />
		</Stack.Navigator>
	);
}
