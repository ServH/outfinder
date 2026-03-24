import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Animated, Text, View } from "react-native";
import { ColorHeader } from "@/components/ColorHeader";
import { CombinationList } from "@/components/CombinationList";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { useFavorites } from "@/contexts/FavoritesContext";
import { usePremium } from "@/contexts/PremiumContext";
import { getColor, getCombinations } from "@/data/colorIndex";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import type { ColorsStackParamList } from "@/navigation/types";

type CombinationsProps = NativeStackScreenProps<
	ColorsStackParamList,
	"Combinations"
>;

export function Combinations({ route }: CombinationsProps) {
	const { colorId } = route.params;
	const color = getColor(colorId);
	const combinations = getCombinations(colorId);
	const { isFavorite, toggleFavorite, count, favorites } = useFavorites();
	const { isPremium } = usePremium();

	const gate = usePremiumGate(favorites);

	if (!color) {
		return null;
	}

	return (
		<View className="flex-1 bg-bg-paper">
			<ColorHeader color={color} combinationCount={combinations.length} />
			<CombinationList
				combinations={combinations}
				selectedColorId={colorId}
				isFavorite={isFavorite}
				onToggleFavorite={toggleFavorite}
				onPremiumGate={
					!isPremium && count >= 5 ? gate.handlePremiumGate : undefined
				}
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
