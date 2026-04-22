import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsIPad } from "@/lib/device";
import { hapticLight } from "@/lib/haptics";
import type { RootStackParamList } from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

const COLORS_DARK = "#1c1c1e";
const FAB_SIZE = 64;

// Exported so screens with content at their bottom edge can add paddingBottom to
// stay clear of the FAB's upper half, which protrudes above the tab bar.
export const FAB_PROTRUSION = FAB_SIZE / 2;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const isTablet = useIsIPad();

	const colorsIndex = state.routes.findIndex((r) => r.name === "ColorsTab");
	const favsIndex = state.routes.findIndex((r) => r.name === "FavoritesTab");
	const isColorsActive = state.index === colorsIndex;
	const isFavsActive = state.index === favsIndex;

	// Detect the active screen inside the ColorsStack so the bar background
	// matches each screen: OutfitVisualizer uses warmBg, all others use bgPaper.
	// biome-ignore lint/suspicious/noExplicitAny: nested nav state has no shared typed interface
	const colorsNestedState = (state.routes[colorsIndex] as any)?.state;
	const activeColorsScreen: string | undefined =
		colorsNestedState != null
			? colorsNestedState.routes?.[colorsNestedState.index ?? 0]?.name
			: undefined;
	const isWarmScreen =
		isColorsActive && activeColorsScreen === "OutfitVisualizer";

	// Crossfade the tab bar background in sync with the stack's fade animation
	// (React Navigation's default fade = ~250ms). Without this the bg snaps
	// abruptly when `activeColorsScreen` flips, breaking the otherwise smooth
	// Combinations ↔ OutfitVisualizer transition.
	const bgProgress = useSharedValue(isWarmScreen ? 1 : 0);
	useEffect(() => {
		bgProgress.value = withTiming(isWarmScreen ? 1 : 0, { duration: 250 });
	}, [isWarmScreen, bgProgress]);
	const animatedBgStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			bgProgress.value,
			[0, 1],
			[wadaTokens.bgPaper, wadaTokens.warmBg],
		),
	}));

	function handleColorsPress() {
		hapticLight();
		const route = state.routes[colorsIndex];
		const event = navigation.emit({
			type: "tabPress",
			target: route.key,
			canPreventDefault: true,
		});
		if (!isColorsActive && !event.defaultPrevented) {
			navigation.navigate("ColorsTab");
		}
	}

	function handleFavsPress() {
		hapticLight();
		const route = state.routes[favsIndex];
		const event = navigation.emit({
			type: "tabPress",
			target: route.key,
			canPreventDefault: true,
		});
		if (!isFavsActive && !event.defaultPrevented) {
			navigation.navigate("FavoritesTab");
		}
	}

	function handleCameraPress() {
		hapticLight();
		navigation
			.getParent<NativeStackNavigationProp<RootStackParamList>>()
			?.navigate("UnifiedCameraRoot");
	}

	// ─── iPad: flat 3-item tab bar ───────────────────────────────────────────
	if (isTablet) {
		return (
			<View
				style={{
					flexDirection: "row",
					backgroundColor: "#fafaf8",
					paddingBottom: insets.bottom,
					height: 56 + insets.bottom,
					alignItems: "center",
				}}
			>
				<Pressable
					onPress={handleColorsPress}
					accessibilityRole="tab"
					accessibilityLabel={t("tabs.colorsTab")}
					style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
				>
					<SymbolView
						name="paintpalette"
						size={22}
						tintColor={isColorsActive ? COLORS_DARK : wadaTokens.wadaMuted}
					/>
					<Text
						style={{
							fontFamily: "Inter_600SemiBold",
							fontSize: 10,
							letterSpacing: 0.5,
							marginTop: 3,
							color: isColorsActive ? COLORS_DARK : wadaTokens.wadaMuted,
						}}
					>
						{t("tabs.colors").toUpperCase()}
					</Text>
				</Pressable>

				<Pressable
					onPress={handleCameraPress}
					accessibilityRole="button"
					accessibilityLabel={t("colorCapture.cameraButtonLabel")}
					style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
					testID="camera-fab-ipad"
				>
					<SymbolView
						name="camera.fill"
						size={22}
						tintColor={wadaTokens.wadaMuted}
					/>
					<Text
						style={{
							fontFamily: "Inter_600SemiBold",
							fontSize: 10,
							letterSpacing: 0.5,
							marginTop: 3,
							color: wadaTokens.wadaMuted,
						}}
					>
						{t("tabs.camera").toUpperCase()}
					</Text>
				</Pressable>

				<Pressable
					onPress={handleFavsPress}
					accessibilityRole="tab"
					accessibilityLabel={t("tabs.favoritesTab")}
					style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
				>
					<SymbolView
						name="archivebox"
						size={22}
						tintColor={isFavsActive ? COLORS_DARK : wadaTokens.wadaMuted}
					/>
					<Text
						style={{
							fontFamily: "Inter_600SemiBold",
							fontSize: 10,
							letterSpacing: 0.5,
							marginTop: 3,
							color: isFavsActive ? COLORS_DARK : wadaTokens.wadaMuted,
						}}
					>
						{t("tabs.favorites").toUpperCase()}
					</Text>
				</Pressable>
			</View>
		);
	}

	// ─── iPhone: cradle FAB layout ───────────────────────────────────────────
	// Container measures ONLY the visible bar zone (tabZone + safe area) so
	// React Navigation reserves exactly that. Screens extend their real content
	// right up to the cut line — no "fake extension strip" which would mismatch
	// non-solid-bg content (Combinations white cards, Visualizer warmBg
	// transition). The FAB protrudes above via negative top + overflow: visible
	// and paints over the separator in the middle (cradle effect). Screens with
	// content near their bottom edge must apply paddingBottom: FAB_PROTRUSION
	// to stay clear of the FAB's upper half.
	// Total bar height = visible row + home-indicator inset. Use a smaller
	// bottom pad than the full safe-area so the icons visually sit closer to
	// the home indicator (iOS leaves too much empty room by default for our
	// taste). `bottomPad` is derived so devices without a home indicator
	// (insets.bottom = 0) still get enough breathing room.
	const tabZoneHeight = 48;
	const bottomPad = Math.max(8, insets.bottom - 12);
	return (
		<Animated.View
			style={[
				{
					width: "100%",
					height: tabZoneHeight + bottomPad,
					borderTopWidth: 1,
					borderTopColor: "rgba(0,0,0,0.08)",
					overflow: "visible",
				},
				animatedBgStyle,
			]}
		>
			{/* Tab row — flex layout, adapts to any screen width */}
			<View
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: bottomPad,
					height: tabZoneHeight,
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				{/* Colors tab */}
				<Pressable
					onPress={handleColorsPress}
					accessibilityRole="tab"
					accessibilityLabel={t("tabs.colorsTab")}
					style={{
						flex: 1,
						height: tabZoneHeight,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{({ pressed }) => (
						<View style={{ alignItems: "center", opacity: pressed ? 0.7 : 1 }}>
							<SymbolView
								name="paintpalette"
								size={22}
								tintColor={isColorsActive ? COLORS_DARK : wadaTokens.wadaMuted}
							/>
							<Text
								style={{
									fontFamily: "Inter_600SemiBold",
									fontSize: 10,
									letterSpacing: 0.5,
									marginTop: 3,
									color: isColorsActive ? COLORS_DARK : wadaTokens.wadaMuted,
								}}
							>
								{t("tabs.colors").toUpperCase()}
							</Text>
						</View>
					)}
				</Pressable>

				{/* Spacer — reserves horizontal room for the FAB button */}
				<View style={{ width: FAB_SIZE + 8 }} />

				{/* Favorites tab */}
				<Pressable
					onPress={handleFavsPress}
					accessibilityRole="tab"
					accessibilityLabel={t("tabs.favoritesTab")}
					style={{
						flex: 1,
						height: tabZoneHeight,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{({ pressed }) => (
						<View style={{ alignItems: "center", opacity: pressed ? 0.7 : 1 }}>
							<SymbolView
								name="archivebox"
								size={22}
								tintColor={isFavsActive ? COLORS_DARK : wadaTokens.wadaMuted}
							/>
							<Text
								style={{
									fontFamily: "Inter_600SemiBold",
									fontSize: 10,
									letterSpacing: 0.5,
									marginTop: 3,
									color: isFavsActive ? COLORS_DARK : wadaTokens.wadaMuted,
								}}
							>
								{t("tabs.favorites").toUpperCase()}
							</Text>
						</View>
					)}
				</Pressable>
			</View>

			{/* Camera FAB — centered on the cut line via negative top offset */}
			<View
				pointerEvents="box-none"
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: -FAB_PROTRUSION,
					height: FAB_SIZE,
					alignItems: "center",
					justifyContent: "flex-start",
				}}
			>
				<Pressable
					onPress={handleCameraPress}
					accessibilityRole="button"
					accessibilityLabel={t("colorCapture.cameraButtonLabel")}
					style={{
						width: FAB_SIZE,
						height: FAB_SIZE,
						borderRadius: FAB_SIZE / 2,
						backgroundColor: COLORS_DARK,
						alignItems: "center",
						justifyContent: "center",
						// Shadow below the circle — enforces "above the line" elevation
						shadowColor: "#000",
						shadowOpacity: 0.18,
						shadowRadius: 6,
						shadowOffset: { width: 0, height: 3 },
					}}
					testID="camera-fab-phone"
				>
					{({ pressed }) => (
						<View
							style={{
								transform: [{ scale: pressed ? 0.96 : 1 }],
								opacity: pressed ? 0.85 : 1,
							}}
						>
							<SymbolView name="camera.fill" size={28} tintColor="#ffffff" />
						</View>
					)}
				</Pressable>
			</View>
		</Animated.View>
	);
}
