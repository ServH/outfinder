import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SymbolView } from "expo-symbols";

import { wadaTokens } from "@/styles/theme";

import { ColorsStack } from "./ColorsStack";
import { FavoritesStack } from "./FavoritesStack";
import { SettingsStack } from "./SettingsStack";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: wadaTokens.tabBarBg,
					borderTopColor: wadaTokens.tabBarBorder,
				},
				tabBarActiveTintColor: wadaTokens.tabActive,
				tabBarInactiveTintColor: wadaTokens.tabInactive,
			}}
		>
			<Tab.Screen
				name="ColorsTab"
				component={ColorsStack}
				options={{
					tabBarLabel: "Colors",
					tabBarIcon: ({ color, size }) => (
						<SymbolView name="paintpalette" tintColor={color} size={size} />
					),
					tabBarAccessibilityLabel: "Colors tab",
				}}
			/>
			<Tab.Screen
				name="FavoritesTab"
				component={FavoritesStack}
				options={{
					tabBarLabel: "Favorites",
					tabBarIcon: ({ color, size }) => (
						<SymbolView name="heart" tintColor={color} size={size} />
					),
					tabBarAccessibilityLabel: "Favorites tab",
				}}
			/>
			<Tab.Screen
				name="SettingsTab"
				component={SettingsStack}
				options={{
					tabBarLabel: "Settings",
					tabBarIcon: ({ color, size }) => (
						<SymbolView name="gearshape" tintColor={color} size={size} />
					),
					tabBarAccessibilityLabel: "Settings tab",
				}}
			/>
		</Tab.Navigator>
	);
}
