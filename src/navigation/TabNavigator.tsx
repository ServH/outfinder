import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";

import { wadaTokens } from "@/styles/theme";

import { ColorsStack } from "./ColorsStack";
import { FavoritesStack } from "./FavoritesStack";
import { SettingsStack } from "./SettingsStack";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
	const { t } = useTranslation();
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				animation: "fade",
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
					tabBarLabel: t("tabs.colors"),
					tabBarIcon: ({ color, size }) => (
						<SymbolView name="paintpalette" tintColor={color} size={size} />
					),
					tabBarAccessibilityLabel: t("tabs.colorsTab"),
				}}
			/>
			<Tab.Screen
				name="FavoritesTab"
				component={FavoritesStack}
				options={{
					tabBarLabel: t("tabs.favorites"),
					tabBarIcon: ({ color, size }) => (
						<SymbolView name="heart" tintColor={color} size={size} />
					),
					tabBarAccessibilityLabel: t("tabs.favoritesTab"),
				}}
			/>
			<Tab.Screen
				name="SettingsTab"
				component={SettingsStack}
				options={{
					tabBarLabel: t("tabs.settings"),
					tabBarIcon: ({ color, size }) => (
						<SymbolView name="gearshape" tintColor={color} size={size} />
					),
					tabBarAccessibilityLabel: t("tabs.settingsTab"),
				}}
			/>
		</Tab.Navigator>
	);
}
