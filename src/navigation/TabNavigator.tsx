import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { ColorsStack } from "./ColorsStack";
import { CustomTabBar } from "./CustomTabBar";
import { FavoritesStack } from "./FavoritesStack";
import { SettingsStack } from "./SettingsStack";
import type { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
	return (
		<Tab.Navigator
			detachInactiveScreens={false}
			tabBar={(props) => <CustomTabBar {...props} />}
			screenOptions={{
				lazy: false,
				headerShown: false,
				animation: "fade",
			}}
		>
			<Tab.Screen name="ColorsTab" component={ColorsStack} />
			<Tab.Screen name="FavoritesTab" component={FavoritesStack} />
			<Tab.Screen name="SettingsTab" component={SettingsStack} />
		</Tab.Navigator>
	);
}
