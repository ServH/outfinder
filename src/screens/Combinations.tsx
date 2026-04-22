import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { ComboCard } from "@/components/ComboCard";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { PREMIUM_CONFIG } from "@/config/premium";
import { getColor, getCombinations } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useIsIPad } from "@/lib/device";
import type { ColorsStackParamList } from "@/navigation/types";
import { useMisLooksStore } from "@/stores/misLooksStore";
import { wadaTokens } from "@/styles/theme";

type CombinationsProps = NativeStackScreenProps<
	ColorsStackParamList,
	"Combinations"
>;

export function Combinations({ route, navigation }: CombinationsProps) {
	const { t } = useTranslation();
	const { colorId } = route.params;
	const isTablet = useIsIPad();
	const color = getColor(colorId);
	const combinations = getCombinations(colorId).sort(
		(a, b) => a.colors.length - b.colors.length,
	);
	const favorites = useMisLooksStore((s) => s.favorites);
	const isFavorite = useMisLooksStore((s) => s.isFavorite);
	const toggleFavorite = useMisLooksStore((s) => s.toggleFavorite);
	const gate = usePremiumGate(favorites);

	const renderSeparator = useCallback(
		() => <View style={{ height: isTablet ? 16 : 12 }} />,
		[isTablet],
	);

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

	return (
		<View className="flex-1" style={{ backgroundColor: wadaTokens.bgPaper }}>
			{/* Header: ← ColorName */}
			<View
				testID="color-header"
				className="flex-row items-center pb-2"
				style={{ paddingTop: 60, paddingHorizontal: isTablet ? 24 : 16 }}
				accessibilityLabel={color.nameEn}
			>
				<Pressable
					onPress={() => navigation.goBack()}
					accessibilityRole="button"
					accessibilityLabel={t("combinations.goBack")}
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
			</View>

			{/* Combo cards feed */}
			<FlatList
				data={combinations}
				keyExtractor={(item) => item.id}
				renderItem={renderComboCard}
				contentContainerStyle={{
					paddingHorizontal: isTablet ? 24 : 16,
					paddingBottom: 24,
				}}
				ItemSeparatorComponent={renderSeparator}
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
