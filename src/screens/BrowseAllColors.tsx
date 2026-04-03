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
import { wadaTokens } from "@/styles/theme";

type BrowseAllColorsNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"BrowseAllColors"
>;

export function BrowseAllColors() {
	const [activeGroup, setActiveGroup] = useState("all");
	const navigation = useNavigation<BrowseAllColorsNav>();

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
			<View
				className="flex-row items-center justify-between px-4 pt-4 pb-2"
				style={{ paddingTop: 60 }}
			>
				<Pressable
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel="Back to Colors"
					className="min-h-[48px] flex-1 flex-row items-center"
					testID="browse-back-button"
				>
					<Text
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.7}
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 28,
							color: wadaTokens.textPrimary,
						}}
					>
						← Colors
					</Text>
				</Pressable>
			</View>
			<SwatchGroup
				colors={colors}
				onColorPress={handleColorPress}
				ListHeaderComponent={
					<SwatchGroupTabs
						activeGroup={activeGroup}
						onTabChange={setActiveGroup}
					/>
				}
			/>
		</View>
	);
}
