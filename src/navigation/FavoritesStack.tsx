import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FavoritesList } from "@/screens/FavoritesList";
import { OutfitVisualizer } from "@/screens/OutfitVisualizer";
import { wadaTokens } from "@/styles/theme";

import type { FavoritesStackParamList } from "./types";

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export function FavoritesStack() {
	return (
		<Stack.Navigator screenOptions={{ animation: "fade" }}>
			<Stack.Screen
				name="FavoritesList"
				component={FavoritesList}
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
