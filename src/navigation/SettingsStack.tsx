import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Settings } from "@/screens/Settings";

import type { SettingsStackParamList } from "./types";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="Settings"
				component={Settings}
				options={{ title: "Settings" }}
			/>
		</Stack.Navigator>
	);
}
