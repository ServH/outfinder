import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	FlatList,
	Pressable,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { ComboCard } from "@/components/ComboCard";
import { EmptyState } from "@/components/EmptyState";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useFavoritesNumCols, useIsIPad } from "@/lib/device";
import { hapticLight } from "@/lib/haptics";
import { wadaTokens } from "@/styles/theme";

type FavoritesListProps = Record<string, never>;

type SortMode = "recent" | "a-z" | "by-size";

const SORT_PILLS: { mode: SortMode; labelKey: string; a11yKey: string }[] = [
	{
		mode: "recent",
		labelKey: "favorites.sortRecent",
		a11yKey: "favorites.sortRecentLabel",
	},
	{
		mode: "a-z",
		labelKey: "favorites.sortAZ",
		a11yKey: "favorites.sortAZLabel",
	},
	{
		mode: "by-size",
		labelKey: "favorites.sortSize",
		a11yKey: "favorites.sortSizeLabel",
	},
];

export function FavoritesList(_props: FavoritesListProps) {
	const { t } = useTranslation();
	const { width: screenWidth } = useWindowDimensions();
	const isTablet = useIsIPad();
	const numCols = useFavoritesNumCols();
	const { favorites, toggleFavorite, isFavorite } = useFavorites();

	const gate = usePremiumGate(favorites);

	const [sortMode, setSortMode] = useState<SortMode>("recent");

	const hPadding = isTablet ? 24 : 16;
	const cardGap = isTablet ? 16 : 12;
	const cardWidth =
		(screenWidth - hPadding * 2 - cardGap * (numCols - 1)) / numCols;

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
		[isFavorite, toggleFavorite, cardWidth],
	);

	const listHeaderComponent = useMemo(
		() => (
			<View testID="sort-pills-row" className="flex-row gap-2 px-4 py-3">
				{SORT_PILLS.map(({ mode, labelKey, a11yKey }) => {
					const isActive = sortMode === mode;
					const a11yLabel = t(a11yKey);
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
									{t(labelKey)}
								</Text>
							)}
						</Pressable>
					);
				})}
			</View>
		),
		[sortMode, t],
	);

	const header = (
		<View className="px-4 pt-4 pb-2" style={{ paddingTop: 60 }}>
			<Text
				style={{
					fontFamily: "NotoSerifJP_500Medium",
					fontSize: isTablet ? 34 : 28,
					color: wadaTokens.textPrimary,
				}}
			>
				{t("favorites.title")}
			</Text>
		</View>
	);

	if (combinations.length === 0) {
		return (
			<View
				testID="favorites-list"
				className="flex-1 bg-paper"
				accessibilityLabel={t("favorites.screenLabel")}
			>
				{header}
				<EmptyState
					title={t("favorites.emptyTitle")}
					subtitle={t("favorites.emptySubtitle")}
				/>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-paper">
			{header}
			{/* testID for column-count assertions in tests */}
			<View testID={`grid-${numCols}col`} style={{ height: 0 }} />
			<FlatList
				key={`grid-${numCols}`}
				testID="favorites-list"
				className="flex-1"
				data={combinations}
				numColumns={numCols}
				columnWrapperStyle={{ gap: cardGap, paddingHorizontal: hPadding }}
				contentContainerStyle={{
					gap: cardGap,
					paddingTop: 12,
					paddingBottom: 20,
				}}
				keyExtractor={(item) => item.id}
				renderItem={renderComboCard}
				ListHeaderComponent={listHeaderComponent}
				accessibilityLabel={t("favorites.screenLabel")}
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
