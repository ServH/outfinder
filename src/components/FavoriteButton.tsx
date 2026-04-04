import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";
import { wadaTokens } from "@/styles/theme";

export interface FavoriteButtonProps {
	combinationId: string;
	combinationName?: string;
	isFavorite: boolean;
	onToggle: () => void;
	onPremiumGate?: () => void;
	size?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FavoriteButton({
	combinationId,
	combinationName,
	isFavorite,
	onToggle,
	onPremiumGate,
	size = 24,
}: FavoriteButtonProps) {
	const { t } = useTranslation();
	const scale = useSharedValue(1);
	const reducedMotion = useReducedMotion();

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	function handlePress() {
		if (onPremiumGate) {
			hapticLight();
			onPremiumGate();
			return;
		}
		hapticLight();
		if (!reducedMotion) {
			scale.value = withSpring(1.2, { damping: 15, stiffness: 300 }, () => {
				scale.value = withSpring(1, { damping: 15, stiffness: 300 });
			});
		}
		onToggle();
	}

	return (
		<AnimatedPressable
			testID={`favorite-button-${combinationId}`}
			accessibilityRole="button"
			accessibilityLabel={
				isFavorite
					? combinationName
						? t("favoriteButton.removeNamed", { name: combinationName })
						: t("favoriteButton.remove")
					: combinationName
						? t("favoriteButton.saveNamed", { name: combinationName })
						: t("favoriteButton.save")
			}
			className="min-w-[44px] min-h-[44px] items-center justify-center"
			style={animatedStyle}
			onPress={handlePress}
		>
			<SymbolView
				testID={`favorite-icon-${combinationId}`}
				name={isFavorite ? "heart.fill" : "heart"}
				style={{ width: size, height: size }}
				tintColor={
					isFavorite ? wadaTokens.favoriteRed : wadaTokens.textTertiary
				}
			/>
		</AnimatedPressable>
	);
}
