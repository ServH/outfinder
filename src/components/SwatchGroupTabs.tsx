import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text } from "react-native";
import type { SwatchGroup } from "@/data/types";
import { hapticLight } from "@/lib/haptics";

type TabKey = "all" | `${SwatchGroup}`;

const TAB_KEYS: TabKey[] = ["all", "0", "1", "2", "3", "4", "5"];

const SWATCH_GROUP_KEY_MAP: Record<SwatchGroup, string> = {
	0: "swatchGroups.paleLight",
	1: "swatchGroups.redBrown",
	2: "swatchGroups.blueLavender",
	3: "swatchGroups.darkDeep",
	4: "swatchGroups.vividBold",
	5: "swatchGroups.greenOlive",
};

export interface SwatchGroupTabsProps {
	activeGroup: string;
	onTabChange: (group: string) => void;
}

export function SwatchGroupTabs({
	activeGroup,
	onTabChange,
}: SwatchGroupTabsProps) {
	const { t } = useTranslation();

	function getTabLabel(key: TabKey): string {
		if (key === "all") return t("swatchGroups.all");
		return t(SWATCH_GROUP_KEY_MAP[Number(key) as SwatchGroup]);
	}

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			accessibilityRole="tablist"
			className="shrink-0 border-b border-divider bg-paper"
			contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
		>
			{TAB_KEYS.map((key) => {
				const isActive = activeGroup === key;
				return (
					<Pressable
						key={key}
						testID={`tab-${key}`}
						accessibilityRole="tab"
						accessibilityState={{ selected: isActive }}
						onPress={() => {
							hapticLight();
							onTabChange(key);
						}}
						className={`min-h-[44px] justify-center ${isActive ? "border-b-2 border-tab-active" : ""}`}
					>
						<Text
							className={
								isActive
									? "text-primary font-sans-medium"
									: "text-tab-inactive font-sans"
							}
						>
							{getTabLabel(key)}
						</Text>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}
