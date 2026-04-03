import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Settings } from "@/screens/Settings";
import { wadaTokens } from "@/styles/theme";

import type { SettingsStackParamList } from "./types";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
	return (
		<Stack.Navigator screenOptions={{ animation: "fade" }}>
			<Stack.Screen
				name="Settings"
				component={Settings}
				options={{ headerShown: false }}
			/>
		</Stack.Navigator>
	);
}
