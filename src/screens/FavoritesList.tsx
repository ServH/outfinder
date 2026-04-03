import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { ComboCard } from "@/components/ComboCard";
import { EmptyState } from "@/components/EmptyState";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { hapticLight } from "@/lib/haptics";
import { wadaTokens } from "@/styles/theme";

type FavoritesListProps = Record<string, never>;

type SortMode = "recent" | "a-z" | "by-size";

const cardWidth = (Dimensions.get("window").width - 32 - 12) / 2;

const SORT_PILLS: { mode: SortMode; label: string; a11yLabel: string }[] = [
	{ mode: "recent", label: "Recent", a11yLabel: "Sort by recent" },
	{ mode: "a-z", label: "A-Z", a11yLabel: "Sort alphabetically" },
	{ mode: "by-size", label: "By size", a11yLabel: "Sort by size" },
];

export function FavoritesList(_props: FavoritesListProps) {
	const { favorites, toggleFavorite, isFavorite } = useFavorites();

	const gate = usePremiumGate(favorites);

	const [sortMode, setSortMode] = useState<SortMode>("recent");

	useFocusEffect(
		useCallback(() => {
			setSortMode("recent");
		}, []),
	);

	const combinations = useMemo(() => {
		const result: Combination[] = [];
		for (const id of favorites) {
			const combination = getCombination(id);
			if (combination) {
				result.push(combination);
			}
		}
		if (sortMode === "a-z") {
			return [...result].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
		}
		if (sortMode === "by-size") {
			return [...result].sort((a, b) => a.colors.length - b.colors.length);
		}
		return result;
	}, [favorites, sortMode]);

	const renderComboCard = useCallback(
		({ item }: { item: Combination }) => {
			const currentlyFav = isFavorite(item.id);
			return (
				<View style={{ width: cardWidth }}>
					<ComboCard
						variant="compact"
						combination={item}
						showYoursLabel={false}
						isFavorite={currentlyFav}
						onToggleFavorite={() => toggleFavorite(item.id)}
					/>
				</View>
			);
		},
		[isFavorite, toggleFavorite],
	);

	const listHeaderComponent = useMemo(
		() => (
			<View testID="sort-pills-row" className="flex-row gap-2 px-4 py-3">
				{SORT_PILLS.map(({ mode, label, a11yLabel }) => {
					const isActive = sortMode === mode;
					return (
						<Pressable
							key={mode}
							testID={`sort-pill-${mode}`}
							className={`px-3 py-2 min-h-[44px] justify-center rounded-full ${isActive ? "bg-primary" : "bg-elevated"}`}
							accessibilityRole="tab"
							accessibilityLabel={
								isActive ? `${a11yLabel}, selected` : a11yLabel
							}
							accessibilityState={{ selected: isActive }}
							onPress={() => {
								hapticLight();
								setSortMode(mode);
							}}
						>
							{({ pressed }) => (
								<Text
									className={`font-sans text-[13px] ${isActive ? "font-medium text-white" : "text-secondary"}`}
									style={{ opacity: pressed ? 0.7 : 1 }}
								>
									{label}
								</Text>
							)}
						</Pressable>
					);
				})}
			</View>
		),
		[sortMode],
	);

	const header = (
		<View className="px-4 pt-4 pb-2" style={{ paddingTop: 60 }}>
			<Text
				style={{
					fontFamily: "NotoSerifJP_500Medium",
					fontSize: 28,
					color: wadaTokens.textPrimary,
				}}
			>
				Favorites
			</Text>
		</View>
	);

	if (combinations.length === 0) {
		return (
			<View
				testID="favorites-list"
				className="flex-1 bg-paper"
				accessibilityLabel="Favorites List screen"
			>
				{header}
				<EmptyState
					title="No favorites yet"
					subtitle="Pick a color, explore combinations, and tap ♡ to save the ones you love"
				/>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-paper">
			{header}
			<FlatList
				testID="favorites-list"
				className="flex-1"
				data={combinations}
				numColumns={2}
				columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
				contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 20 }}
				keyExtractor={(item) => item.id}
				renderItem={renderComboCard}
				ListHeaderComponent={listHeaderComponent}
				accessibilityLabel="Favorites List screen"
			/>

			<PremiumPaywall
				visible={gate.paywallVisible}
				blockedCombination={gate.blockedCombination}
				favoriteCombinationIds={gate.favoriteCombinationIds}
				priceString={gate.priceString}
				purchaseState={gate.purchaseState}
				errorMessage={gate.errorMessage}
				onPurchase={() => gate.handlePurchase(toggleFavorite)}
				onRestore={gate.handleRestore}
				onDismiss={gate.handleDismiss}
			/>

		</View>
	);
}
