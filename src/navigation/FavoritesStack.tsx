import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ArmarioFichaWadaScreen } from "@/screens/armario/ArmarioFichaWadaScreen";
import { ArmarioZeroStateScreen } from "@/screens/armario/ArmarioZeroStateScreen";
import { FavoritesList } from "@/screens/FavoritesList";
import { OutfitVisualizer } from "@/screens/OutfitVisualizer";
import type { FavoritesStackParamList } from "./types";

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

/**
 * Armario S0/S2 screens live on FavoritesStack (not ArmarioStack) so that
 * back-swipe from S2 pops straight to FavoritesList and the tab bar stays
 * visible. ArmarioStack remains the root-modal capture flow used by Story
 * 13.4b's Nueva-foto path.
 */
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
			<Stack.Screen
				name="ArmarioZeroState"
				component={ArmarioZeroStateScreen}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="ArmarioFichaWada"
				component={ArmarioFichaWadaScreen}
				options={{ headerShown: false }}
			/>
		</Stack.Navigator>
	);
}
