import "./src/i18n"; // Must be FIRST import — initializes i18n synchronously before components render
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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
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

	if (!fontsLoaded) return null;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ErrorBoundary>
					<FavoritesProvider>
						<PremiumProvider>
							<NavigationContainer>
								<TabNavigator />
							</NavigationContainer>
						</PremiumProvider>
					</FavoritesProvider>
				</ErrorBoundary>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

// Required by Expo's entry point convention — intentional exception to the "no default export" rule
export default App;
