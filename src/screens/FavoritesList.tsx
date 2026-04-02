import { useCallback, useMemo } from "react";
import { Animated, Dimensions, FlatList, Text, View } from "react-native";
import { ComboCard } from "@/components/ComboCard";
import { EmptyState } from "@/components/EmptyState";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";

type FavoritesListProps = Record<string, never>;

const cardWidth = (Dimensions.get("window").width - 32 - 12) / 2;

export function FavoritesList(_props: FavoritesListProps) {
	const { favorites, toggleFavorite, isFavorite } = useFavorites();

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
				numColumns={2}
				columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
				contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 20 }}
				keyExtractor={(item) => item.id}
				renderItem={renderComboCard}
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
