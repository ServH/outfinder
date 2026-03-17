import "./src/global.css";

import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import {
	NotoSerifJP_400Regular,
	NotoSerifJP_500Medium,
} from "@expo-google-fonts/noto-serif-jp";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { TabNavigator } from "@/navigation/TabNavigator";

SplashScreen.preventAutoHideAsync();

export function App() {
	const [fontsLoaded] = useFonts({
		NotoSerifJP_400Regular,
		NotoSerifJP_500Medium,
		Inter_400Regular,
		Inter_500Medium,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<FavoritesProvider>
			<NavigationContainer>
				<TabNavigator />
			</NavigationContainer>
		</FavoritesProvider>
	);
}

export default App;
