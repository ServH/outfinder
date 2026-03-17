import { useCallback } from "react";
import { FlatList, View } from "react-native";
import type { Combination } from "@/data/types";
import { PaletteStrip } from "./PaletteStrip";

export interface CombinationListProps {
	combinations: Combination[];
	selectedColorId: string;
	isFavorite?: (id: string) => boolean;
	onToggleFavorite?: (id: string) => void;
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
	isFavorite,
	onToggleFavorite,
}: CombinationListProps) {
	const renderItem = useCallback(
		({ item }: { item: Combination }) => (
			<PaletteStrip
				combination={item}
				selectedColorId={selectedColorId}
				isFavorite={isFavorite?.(item.id)}
				onToggleFavorite={
					onToggleFavorite ? () => onToggleFavorite(item.id) : undefined
				}
			/>
		),
		[selectedColorId, isFavorite, onToggleFavorite],
	);

	return (
		<FlatList
			testID="combination-list"
			className="flex-1"
			data={combinations}
			keyExtractor={(item) => item.id}
			contentContainerStyle={{ padding: 16 }}
			ItemSeparatorComponent={ItemSeparator}
			renderItem={renderItem}
		/>
	);
}
