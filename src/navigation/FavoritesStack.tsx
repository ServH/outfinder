import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FavoritesList } from "@/screens/FavoritesList";
import { OutfitVisualizer } from "@/screens/OutfitVisualizer";
import { wadaTokens } from "@/styles/theme";

import type { FavoritesStackParamList } from "./types";

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export function FavoritesStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="FavoritesList"
				component={FavoritesList}
				options={{
					title: "Favorites",
					headerStyle: { backgroundColor: wadaTokens.navBarBg },
					headerTintColor: wadaTokens.textPrimary,
					headerTitleStyle: {
						fontFamily: "NotoSerifJP_500Medium",
					},
				}}
			/>
			<Stack.Screen
				name="OutfitVisualizer"
				component={OutfitVisualizer}
				options={{
					title: "Outfit Visualizer",
					headerStyle: { backgroundColor: wadaTokens.navBarBg },
					headerTintColor: wadaTokens.textPrimary,
					headerTitleStyle: {
						fontFamily: "NotoSerifJP_500Medium",
					},
					headerBackTitle: "",
				}}
			/>
		</Stack.Navigator>
	);
}
