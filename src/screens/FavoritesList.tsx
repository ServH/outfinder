import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Animated, Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";
import { ComboCard } from "@/components/ComboCard";
import { EmptyState } from "@/components/EmptyState";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { hapticLight } from "@/lib/haptics";

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
						onPremiumGate={
							!gate.isPremium && !currentlyFav
								? () => gate.handlePremiumGate(item.id)
								: undefined
						}
					/>
				</View>
			);
		},
		[isFavorite, toggleFavorite, gate.isPremium, gate.handlePremiumGate],
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
							className={`px-3 py-2 min-h-[44px] justify-center rounded-full ${isActive ? "bg-[#1a1a1a]" : "bg-[#F0F0EE]"}`}
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
									className={`font-sans text-[13px] ${isActive ? "font-medium text-white" : "text-[#6b6b6b]"}`}
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

	if (combinations.length === 0) {
		return (
			<View
				testID="favorites-list"
				className="flex-1 bg-paper"
				accessibilityLabel="Favorites List screen"
			>
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
				<EmptyState
					title="No favorites yet"
					subtitle="Pick a color, explore combinations, and tap ♡ to save the ones you love"
				/>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-paper">
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

			{gate.toastVisible && (
				<Animated.View
					testID="premium-toast"
					className="absolute bottom-12 left-6 right-6 items-center"
					style={{ opacity: gate.toastOpacity }}
					accessibilityLiveRegion="polite"
				>
					<View
						className="px-4 py-3 rounded-xl"
						style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
					>
						<Text
							allowFontScaling
							className="font-sans text-[13px] text-white text-center"
						>
							Upgrade to save more favorites
						</Text>
					</View>
				</Animated.View>
			)}
		</View>
	);
}
