import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Dimensions,
	FlatList,
	Pressable,
	Animated as RNAnimated,
	ScrollView,
	Text,
	View,
} from "react-native";
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComboCard } from "@/components/ComboCard";
import { FabricSwatch } from "@/components/FabricSwatch";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { ShadePicker } from "@/components/ShadePicker";
import { PREMIUM_CONFIG } from "@/config/premium";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getCombinations } from "@/data/colorIndex";
import type { Color, Combination, WardrobeCategory } from "@/data/types";
import { getDefaultShade, getRepresentativeShades } from "@/data/wardrobeIndex";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

type ColorHomeNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"ColorHome"
>;

const BASICS: WardrobeCategory[] = [
	"white",
	"black",
	"blue",
	"grey",
	"brown",
	"green",
];
const ACCENTS: WardrobeCategory[] = [
	"red",
	"pink",
	"yellow",
	"purple",
	"orange",
];

const PAGE_WIDTH = Dimensions.get("window").width;

function ComboSeparator() {
	return <View style={{ height: 12 }} />;
}

export function ColorHome() {
	const navigation = useNavigation<ColorHomeNav>();
	const insets = useSafeAreaInsets();
	const scrollRef = useRef<ScrollView>(null);
	const comboListRef = useRef<FlatList<Combination>>(null);
	const scrollX = useRef(new RNAnimated.Value(0)).current;
	const [currentPage, setCurrentPage] = useState(0);
	const [selectedFamily, setSelectedFamily] = useState<WardrobeCategory | null>(
		null,
	);
	const [selectedShade, setSelectedShade] = useState<Color | null>(null);
	const [isAnimating, setIsAnimating] = useState(false);

	// All hooks called before any early returns (Rules of Hooks)
	const { favorites, isFavorite, toggleFavorite } = useFavorites();
	const premiumGate = usePremiumGate(favorites);
	const reducedMotion = useReducedMotion();

	// Transform animation: 0 = State 1, 1 = State 2
	const transformProgress = useSharedValue(0);

	// Shade-level data
	const shades = useMemo(
		() => (selectedFamily ? getRepresentativeShades(selectedFamily) : []),
		[selectedFamily],
	);

	const combos = useMemo(
		() =>
			selectedShade
				? getCombinations(selectedShade.id).sort(
						(a, b) => a.colors.length - b.colors.length,
					)
				: [],
		[selectedShade],
	);

	const familyLabel = selectedFamily
		? selectedFamily.charAt(0).toUpperCase() + selectedFamily.slice(1)
		: "";

	function clearState2() {
		setSelectedFamily(null);
		setSelectedShade(null);
	}

	function handleFamilyPress(category: WardrobeCategory) {
		const shade = getDefaultShade(category);
		setSelectedFamily(category);
		setSelectedShade(shade ?? null);
		setIsAnimating(true);

		if (reducedMotion) {
			transformProgress.value = 1;
			setIsAnimating(false);
		} else {
			transformProgress.value = withTiming(1, { duration: 300 }, (finished) => {
				if (finished) runOnJS(setIsAnimating)(false);
			});
		}
	}

	function handleBackPress() {
		setIsAnimating(true);
		if (reducedMotion) {
			transformProgress.value = 0;
			clearState2();
			setIsAnimating(false);
		} else {
			transformProgress.value = withTiming(0, { duration: 250 }, (finished) => {
				if (finished) {
					runOnJS(clearState2)();
					runOnJS(setIsAnimating)(false);
				}
			});
		}
	}

	function handleShadePress(shade: Color) {
		hapticLight();
		setSelectedShade(shade);
		comboListRef.current?.scrollToOffset({ offset: 0, animated: false });
	}

	function handleBrowseAllPress() {
		hapticLight();
		navigation.push("BrowseAllColors");
	}

	const handleScroll = RNAnimated.event(
		[{ nativeEvent: { contentOffset: { x: scrollX } } }],
		{ useNativeDriver: false },
	);

	function handleMomentumEnd(event: {
		nativeEvent: { contentOffset: { x: number } };
	}) {
		const page = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
		setCurrentPage(page);
	}

	const linkOpacity = scrollX.interpolate({
		inputRange: [0, PAGE_WIDTH * 0.4],
		outputRange: [1, 0],
		extrapolate: "clamp",
	});

	const dot0Color = scrollX.interpolate({
		inputRange: [0, PAGE_WIDTH],
		outputRange: ["#1a1a1a", "#d4d4d4"],
		extrapolate: "clamp",
	});
	const dot1Color = scrollX.interpolate({
		inputRange: [0, PAGE_WIDTH],
		outputRange: ["#d4d4d4", "#1a1a1a"],
		extrapolate: "clamp",
	});

	// Animated styles for crossfade
	const state1AnimStyle = useAnimatedStyle(() => ({
		opacity: 1 - transformProgress.value,
		transform: [{ scale: 1 - transformProgress.value * 0.03 }],
	}));

	const state2AnimStyle = useAnimatedStyle(() => ({
		opacity: transformProgress.value,
	}));

	// Combo card render function
	const renderComboCard = useCallback(
		({ item }: { item: Combination }) => (
			<ComboCard
				variant="full"
				combination={item}
				showYoursLabel
				yourColorId={selectedShade?.id}
				isFavorite={isFavorite(item.id)}
				onToggleFavorite={() => toggleFavorite(item.id)}
				onPremiumGate={
					!premiumGate.isPremium &&
					!isFavorite(item.id) &&
					favorites.size >= PREMIUM_CONFIG.FREE_FAVORITES_LIMIT
						? () => premiumGate.handlePremiumGate(item.id)
						: undefined
				}
			/>
		),
		[
			selectedShade?.id,
			isFavorite,
			toggleFavorite,
			favorites.size,
			premiumGate.isPremium,
			premiumGate.handlePremiumGate,
		],
	);

	// Back-to-Page-1: when selectedFamily is cleared, scroll paginated view to Page 1
	useEffect(() => {
		if (selectedFamily === null) {
			scrollRef.current?.scrollTo({ x: 0, animated: false });
			setCurrentPage(0);
		}
	}, [selectedFamily]);

	const gap = 12;
	const pagePadding = 16;
	const cardWidth = (PAGE_WIDTH - pagePadding * 2 - gap) / 2;

	return (
		<View
			className="flex-1"
			style={{
				backgroundColor: wadaTokens.bgPaper,
				paddingTop: insets.top,
			}}
		>
			{/* State 1 — Fabric swatch grid with crossfade animation */}
			<Animated.View
				style={[{ flex: 1 }, state1AnimStyle]}
				pointerEvents={selectedFamily === null ? "auto" : "none"}
				testID="state-1"
			>
				{/* Custom header */}
				<View className="px-4 pt-4 pb-2">
					<Text
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 28,
							color: wadaTokens.textPrimary,
						}}
					>
						Outfinder
					</Text>
					<Text
						style={{
							fontFamily: "NotoSerifJP_400Regular",
							fontSize: 18,
							color: wadaTokens.textSecondary,
							marginTop: 6,
						}}
					>
						What color are you wearing?
					</Text>
				</View>

				{/* Grid + dots + link centered in remaining space */}
				<View style={{ flex: 1, justifyContent: "center", paddingBottom: 8 }}>
					{/* Paginated swatch grid */}
					<ScrollView
						ref={scrollRef}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						onScroll={handleScroll}
						onMomentumScrollEnd={handleMomentumEnd}
						scrollEventThrottle={16}
						testID="swatch-scroll"
					>
						{/* Page 1: Basics */}
						<View
							style={{
								width: PAGE_WIDTH,
								paddingHorizontal: pagePadding,
							}}
							testID="page-basics"
						>
							<View className="flex-row flex-wrap" style={{ gap }}>
								{BASICS.map((category) => (
									<View key={category} style={{ width: cardWidth }}>
										<FabricSwatch
											category={category}
											onPress={handleFamilyPress}
										/>
									</View>
								))}
							</View>
						</View>

						{/* Page 2: Accents + "All 159 colors" */}
						<View
							style={{
								width: PAGE_WIDTH,
								paddingHorizontal: pagePadding,
							}}
							testID="page-accents"
						>
							<View className="flex-row flex-wrap" style={{ gap }}>
								{ACCENTS.map((category) => (
									<View key={category} style={{ width: cardWidth }}>
										<FabricSwatch
											category={category}
											onPress={handleFamilyPress}
										/>
									</View>
								))}

								{/* Dashed "All 159 colors" card */}
								<View style={{ width: cardWidth }}>
									<Pressable
										onPress={handleBrowseAllPress}
										accessibilityRole="button"
										accessibilityLabel="Browse all 159 colors"
										testID="browse-all-card"
									>
										{({ pressed }) => (
											<View
												className="items-center justify-center rounded-2xl"
												style={{
													aspectRatio: 1,
													borderWidth: 2,
													borderStyle: "dashed",
													borderColor: wadaTokens.wadaMuted,
													opacity: pressed ? 0.88 : 1,
												}}
											>
												{/* Simple 3x3 grid icon */}
												<View className="mb-2" style={{ gap: 4 }}>
													{[0, 1, 2].map((row) => (
														<View
															key={row}
															className="flex-row"
															style={{ gap: 4 }}
														>
															{[0, 1, 2].map((col) => (
																<View
																	key={col}
																	style={{
																		width: 8,
																		height: 8,
																		borderRadius: 2,
																		backgroundColor: wadaTokens.wadaMuted,
																	}}
																/>
															))}
														</View>
													))}
												</View>
												<Text
													style={{
														fontFamily: "Inter_500Medium",
														fontSize: 13,
														color: wadaTokens.wadaMuted,
														textAlign: "center",
													}}
												>
													All 159{"\n"}colors
												</Text>
											</View>
										)}
									</Pressable>
								</View>
							</View>
						</View>
					</ScrollView>

					{/* Page dots */}
					<View
						className="flex-row items-center justify-center py-2"
						style={{ gap: 8 }}
						testID="page-dots"
					>
						<RNAnimated.View
							style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								backgroundColor: dot0Color,
							}}
							testID="dot-0"
						/>
						<RNAnimated.View
							style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								backgroundColor: dot1Color,
							}}
							testID="dot-1"
						/>
					</View>

					{/* "Browse all 159 colors" link — fades out as user scrolls to Page 2 */}
					<RNAnimated.View
						style={{ opacity: linkOpacity }}
						pointerEvents={currentPage === 0 ? "auto" : "none"}
					>
						<Pressable
							onPress={handleBrowseAllPress}
							className="items-center pb-2"
							testID="browse-all-link"
							accessibilityRole="link"
							accessibilityLabel="Browse all 159 colors"
						>
							<Text
								style={{
									fontFamily: "Inter_400Regular",
									fontSize: 14,
									color: wadaTokens.textSecondary,
									textDecorationLine: "underline",
								}}
							>
								Browse all 159 colors
							</Text>
						</Pressable>
					</RNAnimated.View>
				</View>
			</Animated.View>

			{/* State 2 — Shade picker + combo feed overlay */}
			{selectedFamily !== null && selectedShade !== null && (
				<Animated.View
					style={[
						{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							paddingTop: insets.top,
							backgroundColor: wadaTokens.bgPaper,
						},
						state2AnimStyle,
					]}
					testID="state-2"
					pointerEvents={isAnimating ? "none" : "auto"}
				>
					{/* State 2 header: ← Family + combo count */}
					<View className="flex-row items-center justify-between px-4 pt-4 pb-2">
						<Pressable
							onPress={handleBackPress}
							accessibilityRole="button"
							accessibilityLabel="Back to color families"
							className="min-h-[48px] flex-row items-center"
							testID="state2-back-button"
						>
							<Text
								style={{
									fontFamily: "NotoSerifJP_500Medium",
									fontSize: 28,
									color: wadaTokens.textPrimary,
								}}
							>
								← {familyLabel}
							</Text>
						</Pressable>
						<Text
							style={{
								fontFamily: "Inter_400Regular",
								fontSize: 15,
								color: wadaTokens.textSecondary,
							}}
							testID="combo-count"
						>
							{combos.length} {combos.length === 1 ? "combo" : "combos"}
						</Text>
					</View>

					{/* ShadePicker — fixed above scroll */}
					<ShadePicker
						shades={shades}
						selectedShadeId={selectedShade.id}
						onShadePress={handleShadePress}
					/>

					{/* Combo feed */}
					{combos.length === 0 ? (
						<View className="flex-1 items-center justify-center px-8 pt-12">
							<Text
								style={{
									fontFamily: "Inter_400Regular",
									fontSize: 15,
									color: wadaTokens.textSecondary,
									textAlign: "center",
								}}
							>
								No combinations for this shade. Try another.
							</Text>
						</View>
					) : (
						<FlatList
							ref={comboListRef}
							data={combos}
							keyExtractor={(item) => item.id}
							renderItem={renderComboCard}
							contentContainerStyle={{
								paddingHorizontal: 16,
								paddingBottom: 24,
							}}
							ItemSeparatorComponent={ComboSeparator}
							testID="combo-feed"
						/>
					)}
				</Animated.View>
			)}

			{/* Premium paywall modal */}
			<PremiumPaywall
				visible={premiumGate.paywallVisible}
				blockedCombination={premiumGate.blockedCombination}
				favoriteCombinationIds={premiumGate.favoriteCombinationIds}
				priceString={premiumGate.priceString}
				purchaseState={premiumGate.purchaseState}
				errorMessage={premiumGate.errorMessage}
				onPurchase={() => premiumGate.handlePurchase(toggleFavorite)}
				onRestore={premiumGate.handleRestore}
				onDismiss={premiumGate.handleDismiss}
			/>
		</View>
	);
}
