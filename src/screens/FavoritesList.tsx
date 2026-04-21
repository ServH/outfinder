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
import { ComboCard } from "@/components/ComboCard";
import { EmptyState } from "@/components/EmptyState";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { getCombination } from "@/data/colorIndex";
import type { Combination } from "@/data/types";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { sortFavoritesByCompleteness } from "@/lib/armario/sortFavoritesByCompleteness";
import { useFavoritesNumCols, useIsIPad } from "@/lib/device";
import { hapticLight } from "@/lib/haptics";
import { useIsIOS17OrNewer } from "@/lib/platform";
import type { FavoritesStackParamList, TabParamList } from "@/navigation/types";
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

	const hasAnyWardrobeState =
		wardrobeItems.length > 0 || assignments.length > 0;
	const useEnrichedCards = supportsArmario && hydrated && hasAnyWardrobeState;

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
		),
		[sortMode, t],
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
				data={combinations}
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
