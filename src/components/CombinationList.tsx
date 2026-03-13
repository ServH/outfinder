import { FlatList, View } from "react-native";
import type { Combination } from "@/data/types";
import { PaletteStrip } from "./PaletteStrip";

export interface CombinationListProps {
	combinations: Combination[];
	selectedColorId: string;
}

function ItemSeparator() {
	return (
		<View className="my-3">
			<View className="h-[1px] bg-divider" testID="combination-divider" />
		</View>
	);
}

export function CombinationList({
	combinations,
	selectedColorId,
}: CombinationListProps) {
	return (
		<FlatList
			testID="combination-list"
			data={combinations}
			keyExtractor={(item) => item.id}
			contentContainerStyle={{ padding: 16 }}
			ItemSeparatorComponent={ItemSeparator}
			renderItem={({ item }) => (
				<PaletteStrip combination={item} selectedColorId={selectedColorId} />
			)}
		/>
	);
}
