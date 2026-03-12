import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ColorHome } from "@/screens/ColorHome";
import { Combinations } from "@/screens/Combinations";
import { OutfitVisualizer } from "@/screens/OutfitVisualizer";

import type { ColorsStackParamList } from "./types";

const Stack = createNativeStackNavigator<ColorsStackParamList>();

export function ColorsStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="ColorHome"
				component={ColorHome}
				options={{ title: "Colors" }}
			/>
			<Stack.Screen
				name="Combinations"
				component={Combinations}
				options={{ title: "Combinations" }}
			/>
			<Stack.Screen
				name="OutfitVisualizer"
				component={OutfitVisualizer}
				options={{ title: "Outfit" }}
			/>
		</Stack.Navigator>
	);
}
