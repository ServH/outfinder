import "./src/global.css";

import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import {
	NotoSerifJP_400Regular,
	NotoSerifJP_500Medium,
} from "@expo-google-fonts/noto-serif-jp";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { PremiumProvider } from "@/contexts/PremiumContext";
import { TabNavigator } from "@/navigation/TabNavigator";
import { Onboarding } from "@/screens/Onboarding";

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = "@outfinder/onboarding_seen";

export function App() {
	const [fontsLoaded] = useFonts({
		NotoSerifJP_400Regular,
		NotoSerifJP_500Medium,
		Inter_400Regular,
		Inter_500Medium,
	});

	const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

	useEffect(() => {
		async function checkOnboarding() {
			try {
				const value = await AsyncStorage.getItem(ONBOARDING_KEY);
				setOnboardingSeen(value === "true");
			} catch {
				setOnboardingSeen(false);
			}
		}
		checkOnboarding();
	}, []);

	useEffect(() => {
		if (fontsLoaded && onboardingSeen !== null) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, onboardingSeen]);

	if (!fontsLoaded || onboardingSeen === null) {
		return null;
	}

	const handleOnboardingComplete = async () => {
		try {
			await AsyncStorage.setItem(ONBOARDING_KEY, "true");
		} catch {
			// If write fails, still navigate to app
		}
		setOnboardingSeen(true);
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				{onboardingSeen === false ? (
					<Onboarding onComplete={handleOnboardingComplete} />
				) : (
					<FavoritesProvider>
						<PremiumProvider>
							<NavigationContainer>
								<TabNavigator />
							</NavigationContainer>
						</PremiumProvider>
					</FavoritesProvider>
				)}
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

export default App;
