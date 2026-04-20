import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { PolaroidCard } from "@/components/armario/PolaroidCard";
import { WadaColorDot } from "@/components/armario/WadaColorDot";
import { getCombination } from "@/data/colorIndex";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
	const reducedMotion = useReducedMotion();
	const isNavigating = useRef(false);

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
			style={{ backgroundColor: wadaTokens.bgPaper }}
		>
			<Pressable
				testID="s0-back-button"
				onPress={handleBack}
				accessibilityRole="button"
				accessibilityLabel={combination.nameEn}
				accessibilityHint={t("common.goBack")}
				className="absolute items-center justify-center"
				style={{ top: 56, left: 20, width: 48, height: 48, zIndex: 10 }}
			>
				<SymbolView
					name="chevron.left"
					size={22}
					tintColor={wadaTokens.textPrimary}
				/>
			</Pressable>

			<ScrollView
				contentContainerStyle={{
					paddingTop: 112,
					paddingBottom: 160,
					paddingHorizontal: 24,
					alignItems: "center",
				}}
				showsVerticalScrollIndicator={false}
			>
				<Text
					style={{
						fontFamily: "NotoSerifJP_400Regular",
						fontSize: 30,
						lineHeight: 38,
						color: wadaTokens.textPrimary,
						textAlign: "center",
					}}
				>
					{t("armario.s0.heroTitle")}
				</Text>

				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 15,
						lineHeight: 22,
						color: wadaTokens.textSecondary,
						textAlign: "center",
						marginTop: 16,
					}}
				>
					{t("armario.s0.subtitle")}
				</Text>

				<View
					className="flex-row items-center justify-center"
					style={{ marginTop: 24, gap: 8 }}
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
				>
					{combination.colors.map((color) => (
						<WadaColorDot
							key={color.id}
							hex={color.hex}
							size={12}
							testID={`s0-dot-${color.id}`}
						/>
					))}
					<Text
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 14,
							color: wadaTokens.textPrimary,
							marginLeft: 6,
						}}
					>
						{combination.nameEn}
					</Text>
				</View>

				<View
					style={{ alignItems: "center", marginTop: 24, width: "100%" }}
					// Reduce-motion branch: future-proofs Story 13.5 where the cascade
					// will animate in. Today the cards render statically regardless.
					accessible={false}
				>
					{combination.colors.map((color, i) => (
						<View
							key={color.id}
							style={{
								width: "90%",
								marginTop: i === 0 ? 0 : -32,
								opacity: reducedMotion ? 1 : 1,
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
					))}
				</View>
			</ScrollView>

			<Pressable
				testID="s0-primary-cta"
				onPress={handleStart}
				accessibilityRole="button"
				accessibilityLabel={t("armario.s0.primaryCta")}
				className="absolute self-center items-center justify-center"
				style={{
					bottom: 80,
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
				className="absolute self-center items-center justify-center"
				style={{ bottom: 28, minHeight: 44, minWidth: 44 }}
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
	);
}
