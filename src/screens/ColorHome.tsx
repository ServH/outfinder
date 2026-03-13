import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
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
		<SwatchGroup
			colors={colors}
			onColorPress={handleColorPress}
			ListHeaderComponent={
				<View>
					<SwatchGroupTabs
						activeGroup={activeGroup}
						onTabChange={setActiveGroup}
					/>
					{/* TODO: Remove after Story 2.0 — temporary PoC entry points */}
					<View className="mx-4 mb-3 flex-row gap-2">
						<Pressable
							className="flex-1 rounded-lg bg-elevated py-2 px-3"
							onPress={() => navigation.push("GarmentPoC")}
							accessibilityLabel="Open garment rendering proof of concept"
							accessibilityRole="link"
						>
							<Text className="text-xs text-secondary text-center">
								DEV: PoC →
							</Text>
						</Pressable>
						<Pressable
							className="flex-1 rounded-lg bg-elevated py-2 px-3"
							onPress={() => navigation.push("GarmentProposal")}
							accessibilityLabel="Open garment proposal wall"
							accessibilityRole="link"
						>
							<Text className="text-xs text-secondary text-center">
								DEV: Proposal →
							</Text>
						</Pressable>
					</View>
				</View>
			}
		/>
	);
}
