import { useCallback } from "react";
import { FlatList, View } from "react-native";
import type { Combination } from "@/data/types";
import { PaletteStrip } from "./PaletteStrip";

export interface CombinationListProps {
	combinations: Combination[];
	selectedColorId: string;
	isFavorite?: (id: string) => boolean;
	onToggleFavorite?: (id: string) => void;
	onPremiumGate?: (id: string) => void;
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
	onPremiumGate,
}: CombinationListProps) {
	const renderItem = useCallback(
		({ item }: { item: Combination }) => {
			const isCurrentlyFav = isFavorite?.(item.id) ?? false;
			const shouldGate =
				onPremiumGate && !isCurrentlyFav
					? () => onPremiumGate(item.id)
					: undefined;

			return (
				<PaletteStrip
					combination={item}
					selectedColorId={selectedColorId}
					isFavorite={isCurrentlyFav}
					onToggleFavorite={
						onToggleFavorite ? () => onToggleFavorite(item.id) : undefined
					}
					onPremiumGate={shouldGate}
				/>
			);
		},
		[selectedColorId, isFavorite, onToggleFavorite, onPremiumGate],
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
