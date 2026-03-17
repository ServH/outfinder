import { useCallback, useMemo } from "react";
import { FlatList, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PaletteStrip } from "@/components/PaletteStrip";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";

type FavoritesListProps = Record<string, never>;

function ItemSeparator() {
	return (
		<View className="my-3">
			<View className="h-[1px] bg-divider" testID="favorites-divider" />
		</View>
	);
}

export function FavoritesList(_props: FavoritesListProps) {
	const { favorites, toggleFavorite } = useFavorites();

	const combinations = useMemo(() => {
		const result: Combination[] = [];
		for (const id of favorites) {
			const combination = getCombination(id);
			if (combination) {
				result.push(combination);
			}
		}
		return result;
	}, [favorites]);

	const renderItem = useCallback(
		({ item }: { item: Combination }) => (
			<PaletteStrip
				combination={item}
				selectedColorId=""
				isFavorite={true}
				onToggleFavorite={() => toggleFavorite(item.id)}
			/>
		),
		[toggleFavorite],
	);

	if (combinations.length === 0) {
		return (
			<View
				testID="favorites-list"
				className="flex-1 bg-paper"
				accessibilityLabel="Favorites List screen"
			>
				<EmptyState
					title="No favorites yet"
					subtitle="Tap ♡ on any combination to save it here"
				/>
			</View>
		);
	}

	return (
		<FlatList
			testID="favorites-list"
			className="flex-1 bg-paper"
			data={combinations}
			keyExtractor={(item) => item.id}
			contentContainerStyle={{ padding: 16 }}
			ItemSeparatorComponent={ItemSeparator}
			renderItem={renderItem}
			accessibilityLabel="Favorites List screen"
		/>
	);
}
