import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SwatchGroup } from "@/components/SwatchGroup";
import { SwatchGroupTabs } from "@/components/SwatchGroupTabs";
import { getAllColors, getColorsByGroup } from "@/data/colorIndex";
import type { Color, SwatchGroup as SwatchGroupType } from "@/data/types";
import { useIsIPad } from "@/lib/device";
import { hapticLight } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

type BrowseAllColorsNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"BrowseAllColors"
>;

export function BrowseAllColors() {
	const { t } = useTranslation();
	const [activeGroup, setActiveGroup] = useState("all");
	const navigation = useNavigation<BrowseAllColorsNav>();
	const isTablet = useIsIPad();

	const colors =
		activeGroup === "all"
			? getAllColors()
			: getColorsByGroup(Number(activeGroup) as SwatchGroupType);

	function handleColorPress(color: Color) {
		hapticLight();
		navigation.push("Combinations", { colorId: color.id });
	}

	return (
		<View
			className="flex-1 bg-paper"
			accessibilityLabel={t("browseAll.screenLabel")}
		>
			<View
				className="flex-row items-center pb-2"
				style={{ paddingTop: 60, paddingHorizontal: isTablet ? 24 : 16 }}
			>
				<Pressable
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel={t("browseAll.backLabel")}
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
						← {t("browseAll.backButton")}
					</Text>
				</Pressable>
			</View>
			<SwatchGroup
				colors={colors}
				onColorPress={handleColorPress}
				numColumns={isTablet ? 7 : 5}
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
