import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { BrowseAllColors } from "@/screens/BrowseAllColors";
import { ColorHome } from "@/screens/ColorHome";
import { Combinations } from "@/screens/Combinations";
import { OutfitVisualizer } from "@/screens/OutfitVisualizer";
import { wadaTokens } from "@/styles/theme";

import type { ColorsStackParamList } from "./types";

const Stack = createNativeStackNavigator<ColorsStackParamList>();

export function ColorsStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="ColorHome"
				component={ColorHome}
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="BrowseAllColors"
				component={BrowseAllColors}
				options={{
					title: "All 159 Colors",
					headerStyle: { backgroundColor: wadaTokens.navBarBg },
					headerTintColor: wadaTokens.textPrimary,
					headerTitleStyle: {
						fontFamily: "NotoSerifJP_500Medium",
					},
					headerBackTitle: "",
				}}
			/>
			<Stack.Screen
				name="Combinations"
				component={Combinations}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="OutfitVisualizer"
				component={OutfitVisualizer}
				options={{ headerShown: false }}
			/>
		</Stack.Navigator>
	);
}
