import { useNavigation } from "@react-navigation/native";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import type { Combination } from "@/data/types";
import { isLightColor } from "@/lib/color";
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
}: ComboCardProps) {
	const navigation = useNavigation<ComboCardNav>();
	const isFull = variant === "full";
	const stripHeight = isFull ? 60 : 52;

	if (combination.colors.length === 0) {
		return null;
	}

	const colorNames = combination.colors.map((c) => c.nameEn).join(", ");

	function handleCardPress() {
		hapticMedium();
		navigation.push("OutfitVisualizer", {
			combinationId: combination.id,
		});
	}

	return (
		<Pressable
			testID={`combo-card-${combination.id}`}
			accessibilityRole="button"
			accessibilityLabel={`${combination.nameEn} combination: ${colorNames}`}
			accessibilityHint="Opens outfit visualizer"
			onPress={handleCardPress}
		>
			<View
				className="overflow-hidden rounded-lg bg-white"
				style={{
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
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
												fontSize: 9,
											}}
											testID="yours-label"
										>
											yours
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
									style={{ fontSize: 14, color: "#1a1a1a" }}
									numberOfLines={1}
									testID="combo-card-name-jp"
								>
									{combination.nameJp}
								</Text>
								<Text
									className="font-sans"
									style={{ fontSize: 11, color: "#6b6b6b" }}
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
										height: 32,
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
											fontSize: 11,
											color: "#ffffff",
											marginLeft: 4,
										}}
									>
										See outfit
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
							style={{ fontSize: 13, color: "#1a1a1a" }}
							numberOfLines={1}
							testID="combo-card-name-jp"
						>
							{combination.nameJp}
						</Text>
						<Text
							className="font-sans"
							style={{ fontSize: 10, color: "#6b6b6b" }}
							numberOfLines={1}
							testID="combo-card-name-en"
						>
							{combination.nameEn}
						</Text>
						<View className="mt-1 flex-row items-center justify-end">
							<FavoriteButton
								combinationId={combination.id}
								combinationName={combination.nameEn}
								isFavorite={isFavorite}
								onToggle={onToggleFavorite}
								onPremiumGate={onPremiumGate}
								size={16}
							/>
							<View
								className="ml-1 items-center justify-center"
								accessibilityElementsHidden={true}
							>
								<SymbolView
									name="tshirt"
									tintColor={wadaTokens.wadaMuted}
									style={{ width: 16, height: 16 }}
									testID="compact-shirt-icon"
								/>
							</View>
						</View>
					</View>
				)}
			</View>
		</Pressable>
	);
}
