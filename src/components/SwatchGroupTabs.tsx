import { Pressable, ScrollView, Text } from "react-native";
import type { SwatchGroup } from "@/data/types";
import { hapticLight } from "@/lib/haptics";

const SWATCH_GROUP_LABELS: Record<SwatchGroup, string> = {
	0: "Pale & Light",
	1: "Red & Brown",
	2: "Blue & Lavender",
	3: "Dark & Deep",
	4: "Vivid & Bold",
	5: "Green & Olive",
};

type TabKey = "all" | `${SwatchGroup}`;

const TAB_KEYS: TabKey[] = ["all", "0", "1", "2", "3", "4", "5"];

function getTabLabel(key: TabKey): string {
	if (key === "all") return "All";
	return SWATCH_GROUP_LABELS[Number(key) as SwatchGroup];
}

export interface SwatchGroupTabsProps {
	activeGroup: string;
	onTabChange: (group: string) => void;
}

export function SwatchGroupTabs({
	activeGroup,
	onTabChange,
}: SwatchGroupTabsProps) {
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
									? "text-text-primary font-sans-medium"
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
