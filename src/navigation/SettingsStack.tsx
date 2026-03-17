import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Settings } from "@/screens/Settings";
import { wadaTokens } from "@/styles/theme";

import type { SettingsStackParamList } from "./types";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="Settings"
				component={Settings}
				options={{
					title: "Settings",
					headerStyle: { backgroundColor: wadaTokens.navBarBg },
					headerTintColor: wadaTokens.textPrimary,
					headerTitleStyle: {
						fontFamily: "NotoSerifJP_500Medium",
					},
				}}
			/>
		</Stack.Navigator>
	);
}
