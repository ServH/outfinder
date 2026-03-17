import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Combinations } from "@/screens/Combinations";
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
				options={{
					title: "Outfit Visualizer",
					headerStyle: { backgroundColor: wadaTokens.navBarBg },
					headerTintColor: wadaTokens.textPrimary,
					headerBackTitle: "",
				}}
			/>
		</Stack.Navigator>
	);
}
