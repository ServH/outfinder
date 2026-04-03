import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { ComboCard } from "@/components/ComboCard";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { PREMIUM_CONFIG } from "@/config/premium";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getColor, getCombinations } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import type { ColorsStackParamList } from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

type CombinationsProps = NativeStackScreenProps<
	ColorsStackParamList,
	"Combinations"
>;

function ComboSeparator() {
	return <View style={{ height: 12 }} />;
}

export function Combinations({ route, navigation }: CombinationsProps) {
	const { colorId } = route.params;
	const color = getColor(colorId);
	const combinations = getCombinations(colorId).sort(
		(a, b) => a.colors.length - b.colors.length,
	);
	const { isFavorite, toggleFavorite, favorites } = useFavorites();
	const gate = usePremiumGate(favorites);

	const renderComboCard = useCallback(
		({ item }: { item: Combination }) => (
			<ComboCard
				variant="full"
				combination={item}
				showYoursLabel
				yourColorId={colorId}
				isFavorite={isFavorite(item.id)}
				onToggleFavorite={() => toggleFavorite(item.id)}
				onPremiumGate={
					!gate.isPremium &&
					!isFavorite(item.id) &&
					favorites.size >= PREMIUM_CONFIG.FREE_FAVORITES_LIMIT
						? () => gate.handlePremiumGate(item.id)
						: undefined
				}
			/>
		),
		[
			colorId,
			isFavorite,
			toggleFavorite,
			favorites.size,
			gate.isPremium,
			gate.handlePremiumGate,
		],
	);

	if (!color) {
		return null;
	}

	const comboCount = combinations.length;

	return (
		<View className="flex-1" style={{ backgroundColor: wadaTokens.bgPaper }}>
			{/* Header: ← ColorName + combo count (matches State 2 style) */}
			<View
				testID="color-header"
				className="flex-row items-center justify-between px-4 pt-4 pb-2"
				style={{ paddingTop: 60 }}
				accessibilityLabel={`${color.nameEn}, ${comboCount} ${comboCount === 1 ? "combination" : "combinations"}`}
			>
				<Pressable
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel="Go back"
					className="min-h-[48px] flex-1 flex-row items-center"
					testID="combinations-back-button"
				>
					<Text
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.7}
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 28,
							color: wadaTokens.textPrimary,
						}}
					>
						← {color.nameEn}
					</Text>
				</Pressable>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 15,
						color: wadaTokens.textSecondary,
						flexShrink: 0,
					}}
					testID="combo-count"
				>
					{comboCount} {comboCount === 1 ? "combo" : "combos"}
				</Text>
			</View>

			{/* Combo cards feed */}
			<FlatList
				data={combinations}
				keyExtractor={(item) => item.id}
				renderItem={renderComboCard}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingBottom: 24,
				}}
				ItemSeparatorComponent={ComboSeparator}
				testID="combo-feed"
			/>

			{/* Premium paywall modal */}
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
