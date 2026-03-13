import { createNativeStackNavigator } from "@react-navigation/native-stack";

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
					title: "配色辞典",
					headerLargeTitle: true,
					headerLargeStyle: { backgroundColor: wadaTokens.navBarBg },
					headerStyle: { backgroundColor: wadaTokens.navBarBg },
					headerTintColor: wadaTokens.textPrimary,
					headerLargeTitleStyle: {
						fontFamily: "NotoSerifJP_500Medium",
					},
				}}
			/>
			<Stack.Screen
				name="Combinations"
				component={Combinations}
				options={{
					headerStyle: { backgroundColor: wadaTokens.navBarBg },
					headerTintColor: wadaTokens.textPrimary,
					headerTitle: "",
					headerBackTitle: "",
				}}
			/>
			<Stack.Screen
				name="OutfitVisualizer"
				component={OutfitVisualizer}
				options={{ title: "Outfit" }}
			/>
		</Stack.Navigator>
	);
}
