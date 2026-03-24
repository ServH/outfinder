import { useCallback, useMemo } from "react";
import { Animated, FlatList, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PaletteStrip } from "@/components/PaletteStrip";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { usePremium } from "@/contexts/PremiumContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";

type FavoritesListProps = Record<string, never>;

function ItemSeparator() {
	return (
		<View className="my-3">
			<View className="h-[1px] bg-divider" testID="favorites-divider" />
		</View>
	);
}

export function FavoritesList(_props: FavoritesListProps) {
	const { favorites, toggleFavorite, isFavorite, count } = useFavorites();
	const { isPremium } = usePremium();

	const gate = usePremiumGate(favorites);

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
		({ item }: { item: Combination }) => {
			const isCurrentlyFav = isFavorite(item.id);
			const shouldGate = !isPremium && !isCurrentlyFav && count >= 5;

			return (
				<PaletteStrip
					combination={item}
					selectedColorId=""
					isFavorite={isCurrentlyFav}
					onToggleFavorite={() => toggleFavorite(item.id)}
					onPremiumGate={
						shouldGate ? () => gate.handlePremiumGate(item.id) : undefined
					}
				/>
			);
		},
		[toggleFavorite, isFavorite, isPremium, count, gate.handlePremiumGate],
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
		<View className="flex-1 bg-paper">
			<FlatList
				testID="favorites-list"
				className="flex-1"
				data={combinations}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16 }}
				ItemSeparatorComponent={ItemSeparator}
				renderItem={renderItem}
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
