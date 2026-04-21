import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PolaroidCard } from "@/components/armario/PolaroidCard";
import { WadaColorDot } from "@/components/armario/WadaColorDot";
import { getCombination } from "@/data/colorIndex";
import { hapticLight } from "@/lib/haptics";
import type { FavoritesStackParamList } from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

type ArmarioZeroStateNav = NativeStackNavigationProp<
	FavoritesStackParamList,
	"ArmarioZeroState"
>;

type ArmarioZeroStateRoute = NativeStackScreenProps<
	FavoritesStackParamList,
	"ArmarioZeroState"
>["route"];

type ArmarioZeroStateScreenProps = Record<string, never>;

// PolaroidCard internals: inner card is 92% of wrapper width, aspectRatio
// 1.3 (width/height). We recompute here because the cascade must size
// itself to fit a flex container, not the other way round.
const POLAROID_INNER_FRACTION = 0.92;
const POLAROID_ASPECT_RATIO = 1.3;
// Overlap expressed as a fraction of card HEIGHT so the cascade looks
// identical at any scale. ~18% keeps the lower label + next card's top
// visible regardless of N.
const POLAROID_OVERLAP_FRACTION = 0.18;
// Rotation safety margin so the ±2/3° tilted outer cards never clip.
const ROTATION_SAFETY = 0.94;

function computeCascadeLayout(
	containerW: number,
	containerH: number,
	count: number,
): { wrapperWidth: number; overlapPx: number } {
	if (containerW <= 0 || containerH <= 0 || count <= 0) {
		return { wrapperWidth: 0, overlapPx: 0 };
	}
	// Height-constrained card height.
	// totalH = cardH * (1 + (N-1) * (1 - overlapFraction))
	const heightMultiplier = 1 + (count - 1) * (1 - POLAROID_OVERLAP_FRACTION);
	const cardHByHeight = (containerH * ROTATION_SAFETY) / heightMultiplier;
	// Width-constrained card height: wrapper_w * 0.92 / 1.3, where wrapper_w
	// ≤ containerW * ROTATION_SAFETY.
	const maxWrapperW = containerW * ROTATION_SAFETY;
	const cardHByWidth =
		(maxWrapperW * POLAROID_INNER_FRACTION) / POLAROID_ASPECT_RATIO;
	const cardH = Math.min(cardHByHeight, cardHByWidth);
	const cardW = cardH * POLAROID_ASPECT_RATIO;
	const wrapperWidth = cardW / POLAROID_INNER_FRACTION;
	const overlapPx = cardH * POLAROID_OVERLAP_FRACTION;
	return { wrapperWidth, overlapPx };
}

function computeRotations(count: number): number[] {
	if (count <= 0) return [];
	if (count === 1) return [0];
	if (count === 2) return [2, -2];
	if (count === 3) return [2, 0, -2];
	// Non-3-color defensive fallback — evenly distributed ±3° clamp.
	return Array.from({ length: count }, (_, i) => {
		const offset = (i - (count - 1) / 2) * 2;
		return Math.max(-3, Math.min(3, offset));
	});
}

export function ArmarioZeroStateScreen(_props: ArmarioZeroStateScreenProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioZeroStateNav>();
	const route = useRoute<ArmarioZeroStateRoute>();
	const { combinationId } = route.params;
	const insets = useSafeAreaInsets();
	const isNavigating = useRef(false);

	const [cascadeSize, setCascadeSize] = useState<{ w: number; h: number }>({
		w: 0,
		h: 0,
	});
	const handleCascadeLayout = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setCascadeSize((prev) => {
			if (Math.abs(prev.w - width) < 0.5 && Math.abs(prev.h - height) < 0.5) {
				return prev;
			}
			return { w: width, h: height };
		});
	}, []);

	// Reset navigation guard on unmount so future re-mounts start clean.
	useEffect(() => {
		return () => {
			isNavigating.current = false;
		};
	}, []);

	const combination = useMemo(
		() => getCombination(combinationId),
		[combinationId],
	);
	const rotations = useMemo(
		() => computeRotations(combination?.colors.length ?? 0),
		[combination?.colors.length],
	);
	const { wrapperWidth, overlapPx } = useMemo(
		() =>
			computeCascadeLayout(
				cascadeSize.w,
				cascadeSize.h,
				combination?.colors.length ?? 0,
			),
		[cascadeSize.w, cascadeSize.h, combination?.colors.length],
	);
	const missingOrEmpty = !combination || combination.colors.length === 0;

	useEffect(() => {
		if (missingOrEmpty) {
			navigation.goBack();
		}
	}, [missingOrEmpty, navigation]);

	if (!combination || combination.colors.length === 0) {
		return null;
	}

	function handleBack() {
		hapticLight();
		navigation.goBack();
	}

	function handleStart() {
		if (isNavigating.current) return;
		isNavigating.current = true;
		hapticLight();
		AsyncStorage.setItem(`@wardrobe:s0_seen_for_${combinationId}`, "1").catch(
			(err) => {
				if (__DEV__) {
					console.warn("[ArmarioZeroStateScreen] seen flag write failed", err);
				}
			},
		);
		navigation.replace("ArmarioFichaWada", { combinationId });
	}

	return (
		<View
			testID="s0-zero-state-screen"
			accessibilityLabel={t("armario.s0.screenLabel")}
			className="flex-1"
			style={{
				backgroundColor: wadaTokens.bgPaper,
				paddingTop: insets.top,
				paddingBottom: insets.bottom,
			}}
		>
			<View
				style={{
					paddingTop: 8,
					paddingHorizontal: 20,
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<Pressable
					testID="s0-back-button"
					onPress={handleBack}
					accessibilityRole="button"
					accessibilityLabel={combination.nameEn}
					accessibilityHint={t("common.goBack")}
					className="items-center justify-center"
					style={{ width: 48, height: 48, marginLeft: -12 }}
				>
					<SymbolView
						name="chevron.left"
						size={22}
						tintColor={wadaTokens.textPrimary}
					/>
				</Pressable>
			</View>

			{/* Hero header — fixed intrinsic height */}
			<View style={{ paddingHorizontal: 24, alignItems: "center" }}>
				<Text
					numberOfLines={2}
					style={{
						fontFamily: "NotoSerifJP_400Regular",
						fontSize: 26,
						lineHeight: 32,
						color: wadaTokens.textPrimary,
						textAlign: "center",
					}}
				>
					{t("armario.s0.heroTitle")}
				</Text>

				<Text
					numberOfLines={3}
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 14,
						lineHeight: 20,
						color: wadaTokens.textSecondary,
						textAlign: "center",
						marginTop: 12,
					}}
				>
					{t("armario.s0.subtitle")}
				</Text>

				<View
					className="flex-row items-center justify-center"
					style={{ marginTop: 16, gap: 8 }}
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
				>
					{combination.colors.map((color) => (
						<WadaColorDot
							key={color.id}
							hex={color.hex}
							size={10}
							testID={`s0-dot-${color.id}`}
						/>
					))}
					<Text
						numberOfLines={1}
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 13,
							color: wadaTokens.textPrimary,
							marginLeft: 6,
						}}
					>
						{combination.nameEn}
					</Text>
				</View>
			</View>

			{/* Polaroid cascade — fills remaining vertical space, no scroll.
			    `computeCascadeLayout` sizes each card so the stack fits
			    INSIDE this container for any N (2, 3, 4…). Card dimensions
			    derive from onLayout's measured (w, h), not fixed percentages. */}
			<View
				onLayout={handleCascadeLayout}
				style={{
					flex: 1,
					width: "100%",
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: 8,
				}}
				accessible={false}
			>
				{combination.colors.map((color, i) => {
					const measured = wrapperWidth > 0;
					return (
						<View
							key={color.id}
							style={{
								// Pre-layout: render at a fallback width with opacity 0
								// so testIDs are discoverable AND nothing flashes on
								// first paint. onLayout then triggers a second render
								// with the measured wrapperWidth + overlapPx.
								width: measured ? wrapperWidth : "62%",
								marginTop: i === 0 ? 0 : -(measured ? overlapPx : 26),
								opacity: measured ? 1 : 0,
							}}
						>
							<PolaroidCard
								variant="empty"
								color={{ hex: color.hex, nameEn: color.nameEn }}
								rotation={rotations[i] ?? 0}
								testID={`s0-polaroid-${i}`}
								accessibilityLabel={t("armario.s0.polaroidA11y", {
									color: color.nameEn,
								})}
							/>
						</View>
					);
				})}
			</View>

			{/* CTAs — fixed footer, never overlaps content. */}
			<View
				style={{
					paddingHorizontal: 24,
					paddingTop: 8,
					paddingBottom: 16,
					alignItems: "center",
				}}
			>
				<Pressable
					testID="s0-primary-cta"
					onPress={handleStart}
					accessibilityRole="button"
					accessibilityLabel={t("armario.s0.primaryCta")}
					className="items-center justify-center"
					style={{
						minHeight: 44,
						minWidth: 44,
						paddingHorizontal: 24,
						paddingVertical: 14,
						borderRadius: 28,
						backgroundColor: wadaTokens.textPrimary,
					}}
				>
					{({ pressed }) => (
						<Text
							style={{
								fontFamily: "Inter_500Medium",
								fontSize: 16,
								color: "#ffffff",
								opacity: pressed ? 0.85 : 1,
							}}
						>
							{t("armario.s0.primaryCta")}
						</Text>
					)}
				</Pressable>

				<Pressable
					testID="s0-secondary-cta"
					onPress={handleBack}
					accessibilityRole="button"
					accessibilityLabel={t("armario.s0.secondaryCta")}
					className="items-center justify-center"
					style={{ minHeight: 44, minWidth: 44, marginTop: 4 }}
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 14,
							color: wadaTokens.textSecondary,
						}}
					>
						{t("armario.s0.secondaryCta")}
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
