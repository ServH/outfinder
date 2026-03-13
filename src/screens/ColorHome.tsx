import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { View } from "react-native";
import { SwatchGroup } from "@/components/SwatchGroup";
import { SwatchGroupTabs } from "@/components/SwatchGroupTabs";
import { getAllColors, getColorsByGroup } from "@/data/colorIndex";
import type { Color, SwatchGroup as SwatchGroupType } from "@/data/types";
import { hapticLight } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";

type ColorHomeNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"ColorHome"
>;

export function ColorHome() {
	const [activeGroup, setActiveGroup] = useState("all");
	const navigation = useNavigation<ColorHomeNav>();

	const colors =
		activeGroup === "all"
			? getAllColors()
			: getColorsByGroup(Number(activeGroup) as SwatchGroupType);

	function handleColorPress(color: Color) {
		hapticLight();
		navigation.push("Combinations", { colorId: color.id });
	}

	return (
		<View className="flex-1 bg-paper">
			<SwatchGroupTabs activeGroup={activeGroup} onTabChange={setActiveGroup} />
			<SwatchGroup colors={colors} onColorPress={handleColorPress} />
		</View>
	);
}
