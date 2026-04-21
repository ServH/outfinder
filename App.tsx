import "./src/i18n"; // Must be FIRST import — initializes i18n synchronously before components render
import "./src/global.css";

import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import {
	NotoSerifJP_400Regular,
	NotoSerifJP_500Medium,
} from "@expo-google-fonts/noto-serif-jp";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumProvider } from "@/contexts/PremiumContext";
import { UnfavoriteCascadeProvider } from "@/lib/armario/confirmUnfavoriteWithCascade";
import { runOrphanSweep } from "@/lib/armario/wardrobeFiles";
import { ArmarioStack } from "@/navigation/ArmarioStack";
import { TabNavigator } from "@/navigation/TabNavigator";
import type { RootStackParamList } from "@/navigation/types";
import { runMisLooksMigration } from "@/stores/misLooksMigration";
import { hydrateMisLooksStore, useMisLooksStore } from "@/stores/misLooksStore";

SplashScreen.preventAutoHideAsync();

// Cold-boot bootstrap — runs once at module load (covers fresh installs).
// Lives at module scope (not a React effect) so its lifetime is tied to the
// process, not any component's mount window.
//
// Order is load-bearing (per ADR-005 / TD-5):
//   1. runMisLooksMigration() — drains legacy @outfinder/favorites +
//      @wardrobe:* keys into the unified @mislooks:* namespace. Short-
//      circuits when the idempotency flag is set. MUST complete before
//      hydration so the store doesn't flash an empty state.
//   2. hydrateMisLooksStore() — reads the @mislooks:* keys into the store.
//   3. runOrphanSweep — reconciles durable wardrobe files against the
//      freshly-hydrated items list.
void (async () => {
	try {
		await runMisLooksMigration();
		await hydrateMisLooksStore();
		const items = useMisLooksStore.getState().items;
		requestIdleCallback(() => {
			void runOrphanSweep({ items });
		});
	} catch (error) {
		if (__DEV__) {
			console.warn("[App] initial bootstrap failed:", error);
		}
	}
})();

// AppState=active re-runs hydration only (migration is cold-boot-only; the
// idempotency flag would guard it anyway, but calling it here would be dead
// weight — we want pure re-read after backgrounding).
AppState.addEventListener("change", async (next) => {
	if (next !== "active") return;
	try {
		await hydrateMisLooksStore();
		const items = useMisLooksStore.getState().items;
		requestIdleCallback(() => {
			void runOrphanSweep({ items });
		});
	} catch (error) {
		if (__DEV__) {
			console.warn("[App] AppState orphan sweep failed:", error);
		}
	}
});

const RootStack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
	return (
		<RootStack.Navigator screenOptions={{ headerShown: false }}>
			<RootStack.Screen name="Main" component={TabNavigator} />
			<RootStack.Screen
				name="ArmarioRoot"
				component={ArmarioStack}
				options={{ presentation: "modal" }}
			/>
		</RootStack.Navigator>
	);
}

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
					<PremiumProvider>
						{/* UnfavoriteCascadeProvider lets FavoriteButton surface the cascade confirmation sheet when the user un-favorites a combo with assignments */}
						<UnfavoriteCascadeProvider>
							<NavigationContainer>
								<RootNavigator />
							</NavigationContainer>
						</UnfavoriteCascadeProvider>
					</PremiumProvider>
				</ErrorBoundary>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

// Required by Expo's entry point convention — intentional exception to the "no default export" rule
export default App;
