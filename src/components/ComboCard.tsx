import { useNavigation } from "@react-navigation/native";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import type { Combination } from "@/data/types";
import { isLightColor } from "@/lib/color";
import { useIsIPad } from "@/lib/device";
import { hapticMedium } from "@/lib/haptics";
import { wadaTokens } from "@/styles/theme";
import { FavoriteButton } from "./FavoriteButton";

export interface ComboCardProps {
	variant: "full" | "compact";
	combination: Combination;
	showYoursLabel?: boolean;
	yourColorId?: string;
	isFavorite: boolean;
	onToggleFavorite: () => void;
	onPremiumGate?: () => void;
	/**
	 * Optional tap-press override. When provided, pre-empts the default
	 * `navigation.push("OutfitVisualizer", ...)` routing — e.g. the Favorites
	 * tab passes this to divert the tap into the Armario S0/S2 flow. Haptic
	 * is still fired by `ComboCard`, so overrides must not re-fire it.
	 */
	onPress?: (combinationId: string) => void;
	/**
	 * Story 13.6 — optional override for the compact-variant CTA copy. When
	 * provided, the CTA reads `t(ctaOverrideKey)` instead of the default
	 * `t("comboCard.seeOutfit")`. Currently only set by
	 * `FavoriteComboEnrichedCard` on iOS 17+ hydrated users. The full variant
	 * ignores this prop (its CTA pill lives in a different layout).
	 */
	ctaOverrideKey?: string;
	/**
	 * Story 13.6 — optional override for the outer Pressable's
	 * `accessibilityHint`. When provided, replaces the default
	 * `t("comboCard.openHint")` string — used by the enriched Favorites
	 * wrapper to communicate completeness + next-action in a single rotor
	 * stop.
	 */
	accessibilityHintOverride?: string;
	/**
	 * Story 13.6 — optional leading text for the compact-variant bottom row
	 * (same vertical line as the favorite heart + tshirt icon). When
	 * provided, the row switches to `justify-between` and renders the text
	 * to the left. Typical use: the enriched Favorites card's "N/N
	 * garments" badge.
	 */
	bottomRowLeadingText?: string;
}

type ComboCardNav = {
	push(screen: "OutfitVisualizer", params: { combinationId: string }): void;
};

export function ComboCard({
	variant,
	combination,
	showYoursLabel = false,
	yourColorId,
	isFavorite,
	onToggleFavorite,
	onPremiumGate,
	onPress,
	ctaOverrideKey,
	accessibilityHintOverride,
	bottomRowLeadingText,
}: ComboCardProps) {
	const { t } = useTranslation();
	const isTablet = useIsIPad();
	const navigation = useNavigation<ComboCardNav>();
	const isFull = variant === "full";
	const stripHeight = isFull ? (isTablet ? 68 : 60) : isTablet ? 60 : 52;

	if (combination.colors.length === 0) {
		return null;
	}

	const colorNames = combination.colors.map((c) => c.nameEn).join(", ");

	function handleCardPress() {
		hapticMedium();
		if (onPress) {
			onPress(combination.id);
			return;
		}
		navigation.push("OutfitVisualizer", {
			combinationId: combination.id,
		});
	}

	return (
		<Pressable
			testID={`combo-card-${combination.id}`}
			accessibilityRole="button"
			accessibilityLabel={t("comboCard.combinationLabel", {
				name: combination.nameEn,
				colors: colorNames,
			})}
			accessibilityHint={accessibilityHintOverride ?? t("comboCard.openHint")}
			onPress={handleCardPress}
		>
			<View
				className="overflow-hidden rounded-lg bg-white"
				style={{
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 3 },
					shadowOpacity: 0.12,
					shadowRadius: 8,
				}}
			>
				{/* Color Strip */}
				<View
					className="flex-row"
					style={{ height: stripHeight }}
					testID="combo-card-strip"
				>
					{combination.colors.map((color) => {
						const isYours =
							isFull && showYoursLabel && yourColorId === color.id;
						return (
							<View
								key={color.id}
								className="flex-1"
								style={{ backgroundColor: color.hex }}
								testID={`combo-color-${color.id}`}
							>
								{isYours && (
									<View className="absolute bottom-1 left-0 right-0 items-center">
										<Text
											className="font-sans-medium"
											style={{
												color: isLightColor(color.hex) ? "#1a1a1a" : "#ffffff",
												fontSize: isTablet ? 11 : 9,
											}}
											testID="yours-label"
										>
											{t("comboCard.yours")}
										</Text>
									</View>
								)}
							</View>
						);
					})}
				</View>

				{/* Info Area — Full Variant */}
				{isFull ? (
					<View className="px-3 py-2">
						<View className="flex-row items-center justify-between">
							<View className="mr-2 flex-1">
								<Text
									className="font-serif-jp-medium"
									style={{ fontSize: isTablet ? 16 : 14, color: "#1a1a1a" }}
									numberOfLines={1}
									testID="combo-card-name-jp"
								>
									{combination.nameJp}
								</Text>
								<Text
									className="font-sans"
									style={{ fontSize: isTablet ? 13 : 11, color: "#6b6b6b" }}
									numberOfLines={1}
									testID="combo-card-name-en"
								>
									{combination.nameEn}
								</Text>
							</View>
							<View className="flex-row items-center">
								<FavoriteButton
									combinationId={combination.id}
									combinationName={combination.nameEn}
									isFavorite={isFavorite}
									onToggle={onToggleFavorite}
									onPremiumGate={onPremiumGate}
									size={18}
								/>
								<View
									className="ml-1 flex-row items-center rounded-full"
									accessibilityElementsHidden={true}
									style={{
										backgroundColor: "#1a1a1a",
										height: isTablet ? 36 : 32,
										paddingHorizontal: 12,
									}}
									testID="see-outfit-pill"
								>
									<SymbolView
										name="tshirt"
										tintColor="#ffffff"
										style={{ width: 14, height: 14 }}
									/>
									<Text
										className="font-sans"
										style={{
											fontSize: isTablet ? 13 : 11,
											color: "#ffffff",
											marginLeft: 4,
										}}
									>
										{t("comboCard.seeOutfit")}
									</Text>
								</View>
							</View>
						</View>
					</View>
				) : (
					/* Info Area — Compact Variant */
					<View className="px-3 py-2">
						<Text
							className="font-serif-jp-medium"
							style={{ fontSize: isTablet ? 15 : 13, color: "#1a1a1a" }}
							numberOfLines={1}
							testID="combo-card-name-jp"
						>
							{combination.nameJp}
						</Text>
						<Text
							className="font-sans"
							style={{ fontSize: isTablet ? 12 : 10, color: "#6b6b6b" }}
							numberOfLines={1}
							testID="combo-card-name-en"
						>
							{combination.nameEn}
						</Text>
						{ctaOverrideKey ? (
							<Text
								testID="combo-card-cta-override"
								numberOfLines={1}
								className="font-sans-medium"
								style={{
									fontSize: isTablet ? 13 : 11,
									color: wadaTokens.textPrimary,
									marginTop: 6,
								}}
							>
								{t(ctaOverrideKey)}
							</Text>
						) : null}
						<View
							className={`mt-1 flex-row items-center ${bottomRowLeadingText ? "justify-between" : "justify-end"}`}
						>
							{bottomRowLeadingText ? (
								<Text
									testID="combo-card-bottom-row-leading"
									numberOfLines={1}
									style={{
										fontFamily: "Inter_400Regular",
										fontSize: 11,
										letterSpacing: 0.2,
										color: wadaTokens.textTertiary,
										flexShrink: 1,
										marginRight: 8,
									}}
									accessibilityElementsHidden={true}
								>
									{bottomRowLeadingText}
								</Text>
							) : null}
							<View className="flex-row items-center">
								<FavoriteButton
									combinationId={combination.id}
									combinationName={combination.nameEn}
									isFavorite={isFavorite}
									onToggle={onToggleFavorite}
									onPremiumGate={onPremiumGate}
									size={isTablet ? 20 : 16}
								/>
								<View
									className="ml-1 items-center justify-center"
									accessibilityElementsHidden={true}
								>
									<SymbolView
										name="tshirt"
										tintColor={wadaTokens.wadaMuted}
										style={{
											width: isTablet ? 20 : 16,
											height: isTablet ? 20 : 16,
										}}
										testID="compact-shirt-icon"
									/>
								</View>
							</View>
						</View>
					</View>
				)}
			</View>
		</Pressable>
	);
}
