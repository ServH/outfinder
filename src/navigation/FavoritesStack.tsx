import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Combinations } from "@/screens/Combinations";
import { FavoritesList } from "@/screens/FavoritesList";
import { OutfitVisualizer } from "@/screens/OutfitVisualizer";

import type { FavoritesStackParamList } from "./types";

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export function FavoritesStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="FavoritesList"
				component={FavoritesList}
				options={{ title: "Favorites" }}
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
