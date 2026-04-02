import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { Animated, FlatList, Text, View } from "react-native";
import { ComboCard } from "@/components/ComboCard";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getColor, getCombinations } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { isLightColor } from "@/lib/color";
import type { ColorsStackParamList } from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

type CombinationsProps = NativeStackScreenProps<
	ColorsStackParamList,
	"Combinations"
>;

function ComboSeparator() {
	return <View style={{ height: 12 }} />;
}

export function Combinations({ route }: CombinationsProps) {
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
					!gate.isPremium && !isFavorite(item.id)
						? () => gate.handlePremiumGate(item.id)
						: undefined
				}
			/>
		),
		[
			colorId,
			isFavorite,
			toggleFavorite,
			gate.isPremium,
			gate.handlePremiumGate,
		],
	);

	if (!color) {
		return null;
	}

	const comboCount = combinations.length;
	const needsBorder = isLightColor(color.hex);

	return (
		<View className="flex-1" style={{ backgroundColor: wadaTokens.bgPaper }}>
			{/* Header: color swatch + English name + combo count */}
			<View
				testID="color-header"
				className="flex-row items-center px-4 py-3"
				accessibilityLabel={`${color.nameEn}, ${comboCount} ${comboCount === 1 ? "combination" : "combinations"}`}
			>
				<View
					style={{
						width: 36,
						height: 36,
						borderRadius: 10,
						backgroundColor: color.hex,
						borderWidth: needsBorder ? 1 : 0,
						borderColor: "#e0dcd6",
						marginRight: 10,
					}}
					testID="color-header-swatch"
				/>
				<Text
					style={{
						fontFamily: "Inter_500Medium",
						fontSize: 17,
						color: wadaTokens.textPrimary,
						flex: 1,
					}}
				>
					{color.nameEn}
				</Text>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 14,
						color: wadaTokens.textSecondary,
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
