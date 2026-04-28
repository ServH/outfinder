import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
	type CompositeNavigationProp,
	useFocusEffect,
	useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	FlatList,
	Pressable,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { FavoriteComboEnrichedCard } from "@/components/armario/FavoriteComboEnrichedCard";
import { IncompleteLooksSection } from "@/components/armario/IncompleteLooksSection";
import { NewLookCtaCard } from "@/components/armario/NewLookCtaCard";
import { ComboCard } from "@/components/ComboCard";
import { EmptyState } from "@/components/EmptyState";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { selectIncompleteLooks } from "@/lib/armario/selectIncompleteLooks";
import { sortFavoritesByCompleteness } from "@/lib/armario/sortFavoritesByCompleteness";
import { useFavoritesNumCols, useIsIPad } from "@/lib/device";
import { hapticLight } from "@/lib/haptics";
import { useIsIOS17OrNewer } from "@/lib/platform";
import type {
	FavoritesStackParamList,
	RootStackParamList,
	TabParamList,
} from "@/navigation/types";
import { useMisLooksStore } from "@/stores/misLooksStore";
import { wadaTokens } from "@/styles/theme";

type FavoritesListNav = CompositeNavigationProp<
	NativeStackNavigationProp<FavoritesStackParamList, "FavoritesList">,
	BottomTabNavigationProp<TabParamList>
>;

type FavoritesListProps = Record<string, never>;

type SortMode = "recent" | "a-z" | "by-size";

const SORT_PILLS: { mode: SortMode; labelKey: string; a11yKey: string }[] = [
	{
		mode: "recent",
		labelKey: "favorites.sortRecent",
		a11yKey: "favorites.sortRecentLabel",
	},
	{
		mode: "a-z",
		labelKey: "favorites.sortAZ",
		a11yKey: "favorites.sortAZLabel",
	},
	{
		mode: "by-size",
		labelKey: "favorites.sortSize",
		a11yKey: "favorites.sortSizeLabel",
	},
];

export function FavoritesList(_props: FavoritesListProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<FavoritesListNav>();
	const { width: screenWidth } = useWindowDimensions();
	const isTablet = useIsIPad();

	function handleSettingsPress() {
		hapticLight();
		navigation.navigate("SettingsTab");
	}

	const handleNewLookPress = useCallback(() => {
		const rootNav = navigation
			.getParent()
			?.getParent<NativeStackNavigationProp<RootStackParamList>>();
		rootNav?.navigate("Main", {
			screen: "ColorsTab",
			params: {
				screen: "ColorHome",
			},
		} as never);
	}, [navigation]);
	const numCols = useFavoritesNumCols();
	const favorites = useMisLooksStore((s) => s.favorites);
	const toggleFavorite = useMisLooksStore((s) => s.toggleFavorite);
	const isFavorite = useMisLooksStore((s) => s.isFavorite);
	const supportsArmario = useIsIOS17OrNewer();
	const hydrated = useMisLooksStore((s) => s.hydrated);
	const assignments = useMisLooksStore((s) => s.assignments);
	const wardrobeItems = useMisLooksStore((s) => s.items);
	const isNavigating = useRef(false);

	const gate = usePremiumGate(favorites);

	const [sortMode, setSortMode] = useState<SortMode>("recent");

	const hPadding = isTablet ? 24 : 16;
	const cardGap = isTablet ? 16 : 12;
	const cardWidth =
		(screenWidth - hPadding * 2 - cardGap * (numCols - 1)) / numCols;

	useFocusEffect(
		useCallback(() => {
			setSortMode("recent");
			isNavigating.current = false;
		}, []),
	);

	const combinations = useMemo(() => {
		const result: Combination[] = [];
		for (const id of favorites) {
			const combination = getCombination(id);
			if (combination) {
				result.push(combination);
			}
		}
		if (sortMode === "a-z") {
			return [...result].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
		}
		if (sortMode === "by-size") {
			return [...result].sort((a, b) => a.colors.length - b.colors.length);
		}
		// "recent" mode → completeness partition when the user is on iOS 17+,
		// the wardrobe store is hydrated, and at least one combo has ≥ 1
		// assignment. Empty buckets fall back to Set-insertion order. The user-
		// facing label stays "Recent" (completeness-first is a refinement, not
		// a new sort dimension).
		if (supportsArmario && hydrated && assignments.length > 0) {
			return sortFavoritesByCompleteness(result, assignments);
		}
		return result;
	}, [favorites, sortMode, supportsArmario, hydrated, assignments]);

	const { incompleteLooks, completeLooks } = useMemo(() => {
		if (!supportsArmario || !hydrated) {
			return {
				incompleteLooks: [] as Combination[],
				completeLooks: combinations,
			};
		}
		const incomplete = selectIncompleteLooks(combinations, assignments);
		const incompleteIds = new Set(incomplete.map((c) => c.id));
		const complete = combinations.filter((c) => !incompleteIds.has(c.id));
		return { incompleteLooks: incomplete, completeLooks: complete };
	}, [combinations, assignments, supportsArmario, hydrated]);

	const hasAnyWardrobeState =
		wardrobeItems.length > 0 || assignments.length > 0;
	const useEnrichedCards = supportsArmario && hydrated && hasAnyWardrobeState;

	const handleIncompleteTilePress = useCallback(
		(combinationId: string) => {
			if (isNavigating.current) return;
			isNavigating.current = true;
			hapticLight();
			navigation.push("ArmarioFichaWada", { combinationId });
		},
		[navigation],
	);

	const handleComboPress = useCallback(
		async (combinationId: string) => {
			if (isNavigating.current) return;
			isNavigating.current = true;
			if (!supportsArmario || !hydrated) {
				navigation.push("OutfitVisualizer", { combinationId });
				return;
			}
			const assignedCount = assignments.filter(
				(a) => a.combinationId === combinationId,
			).length;
			try {
				const seen = await AsyncStorage.getItem(
					`@wardrobe:s0_seen_for_${combinationId}`,
				);
				if (assignedCount === 0 && seen === null) {
					navigation.push("ArmarioZeroState", { combinationId });
				} else {
					navigation.push("ArmarioFichaWada", { combinationId });
				}
			} catch (err) {
				if (__DEV__) {
					console.warn(
						"[FavoritesList] s0_seen read failed, defaulting to S2",
						err,
					);
				}
				navigation.push("ArmarioFichaWada", { combinationId });
			}
		},
		[navigation, assignments, supportsArmario, hydrated],
	);

	const renderComboCard = useCallback(
		({ item }: { item: Combination }) => {
			const currentlyFav = isFavorite(item.id);
			if (useEnrichedCards) {
				return (
					<FavoriteComboEnrichedCard
						combination={item}
						isFavorite={currentlyFav}
						onToggleFavorite={() => toggleFavorite(item.id)}
						onPress={handleComboPress}
						cardWidth={cardWidth}
					/>
				);
			}
			return (
				<View style={{ width: cardWidth }}>
					<ComboCard
						variant="compact"
						combination={item}
						showYoursLabel={false}
						isFavorite={currentlyFav}
						onToggleFavorite={() => toggleFavorite(item.id)}
						onPress={handleComboPress}
					/>
				</View>
			);
		},
		[isFavorite, toggleFavorite, cardWidth, handleComboPress, useEnrichedCards],
	);

	const listHeaderComponent = useMemo(
		() => (
			<View>
				<NewLookCtaCard onPress={handleNewLookPress} />
				<IncompleteLooksSection
					incompleteLooks={incompleteLooks}
					assignments={assignments}
					onTilePress={handleIncompleteTilePress}
				/>
				<View testID="sort-pills-row" className="flex-row gap-2 px-4 py-3">
					{SORT_PILLS.map(({ mode, labelKey, a11yKey }) => {
						const isActive = sortMode === mode;
						const a11yLabel = t(a11yKey);
						return (
							<Pressable
								key={mode}
								testID={`sort-pill-${mode}`}
								className={`px-3 py-2 min-h-[44px] justify-center rounded-full ${isActive ? "bg-primary" : "bg-elevated"}`}
								accessibilityRole="tab"
								accessibilityLabel={
									isActive ? `${a11yLabel}, selected` : a11yLabel
								}
								accessibilityState={{ selected: isActive }}
								onPress={() => {
									hapticLight();
									setSortMode(mode);
								}}
							>
								{({ pressed }) => (
									<Text
										className={`font-sans text-[13px] ${isActive ? "font-medium text-white" : "text-secondary"}`}
										style={{ opacity: pressed ? 0.7 : 1 }}
									>
										{t(labelKey)}
									</Text>
								)}
							</Pressable>
						);
					})}
				</View>
				{incompleteLooks.length > 0 && completeLooks.length > 0 ? (
					<View
						testID="complete-section-header"
						accessibilityRole="header"
						accessibilityLabel={t("favorites.completeSection.a11yLabel")}
						className="px-4 mt-4 mb-2"
					>
						<Text
							style={{
								fontFamily: "Inter_500Medium",
								fontSize: 13,
								color: wadaTokens.textSecondary,
							}}
						>
							{t("favorites.completeSection.title")}
						</Text>
					</View>
				) : null}
			</View>
		),
		[
			sortMode,
			t,
			handleNewLookPress,
			incompleteLooks,
			completeLooks,
			assignments,
			handleIncompleteTilePress,
		],
	);

	const header = (
		<View
			className="px-4 pb-2 flex-row items-start justify-between"
			style={{ paddingTop: 60 }}
		>
			<Text
				style={{
					fontFamily: "NotoSerifJP_500Medium",
					fontSize: isTablet ? 34 : 28,
					color: wadaTokens.textPrimary,
				}}
			>
				{t("favorites.title")}
			</Text>
			<Pressable
				onPress={handleSettingsPress}
				accessibilityRole="button"
				accessibilityLabel={t("tabs.settings")}
				style={{
					width: 44,
					height: 44,
					alignItems: "center",
					justifyContent: "center",
				}}
				testID="settings-gear-button"
			>
				<SymbolView
					name="gearshape"
					size={22}
					tintColor={wadaTokens.wadaMuted}
				/>
			</Pressable>
		</View>
	);

	if (combinations.length === 0) {
		return (
			<View
				testID="favorites-list"
				className="flex-1 bg-paper"
				accessibilityLabel={t("favorites.screenLabel")}
			>
				{header}
				<NewLookCtaCard onPress={handleNewLookPress} />
				<EmptyState
					title={t("favorites.emptyTitle")}
					subtitle={t("favorites.emptySubtitle")}
				/>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-paper">
			{header}
			{/* testID for column-count assertions in tests */}
			<View testID={`grid-${numCols}col`} style={{ height: 0 }} />
			<FlatList
				key={`grid-${numCols}`}
				testID="favorites-list"
				className="flex-1"
				data={supportsArmario && hydrated ? completeLooks : combinations}
				numColumns={numCols}
				columnWrapperStyle={{ gap: cardGap, paddingHorizontal: hPadding }}
				contentContainerStyle={{
					gap: cardGap,
					paddingTop: 12,
					paddingBottom: 20,
				}}
				keyExtractor={(item) => item.id}
				renderItem={renderComboCard}
				ListHeaderComponent={listHeaderComponent}
				accessibilityLabel={t("favorites.screenLabel")}
			/>

			<PremiumPaywall
				visible={gate.paywallVisible}
				context="favorites"
				currentCount={gate.favoriteCombinationIds.length}
				blockedCombination={gate.blockedCombination}
				savedCombinationIds={gate.favoriteCombinationIds}
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
