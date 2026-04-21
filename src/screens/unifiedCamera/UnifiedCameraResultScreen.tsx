import {
	type RouteProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AccessibilityInfo,
	Animated,
	Image,
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCombinations } from "@/data/colorIndex";
import type { Color } from "@/data/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { relativeLuminance } from "@/lib/color";
import type { MatchResult } from "@/lib/colorTypes";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import type {
	RootStackParamList,
	UnifiedCameraStackParamList,
} from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

// Luminance threshold (Pencil frame EZ4EA): Wada-hex CTAs above 0.40 relative
// luminance render dark pergamino ink; below or equal render cream. This is
// an aesthetic choice tuned on the Wada palette, NOT the WCAG 4.5:1 contrast
// threshold — both ink colors clear AAA contrast across the Wada gamut.
const LUMINANCE_DARK_TEXT_THRESHOLD = 0.4;
const CTA_LABEL_DARK = "#2d2a26";
const CTA_LABEL_CREAM = "#faf7f2";

// Tone-correction gate (Pencil frame KY9jv): only show the two-swatch picker
// when the top-2 candidates are both within 8 ΔE of the captured color.
const TONE_CORRECTION_DELTA_E_THRESHOLD = 8;

type ResultRoute = RouteProp<UnifiedCameraStackParamList, "Result">;

type UnifiedCameraNav = NativeStackNavigationProp<
	UnifiedCameraStackParamList,
	"Result"
>;

type UnifiedCameraResultScreenProps = Record<string, never>;

function getInitialConfirmedTone(match: MatchResult): Color {
	if (match.type === "direct") return match.match.color;
	if (match.type === "confirm") return match.top3[0].color;
	return match.bestMatch.color;
}

export function UnifiedCameraResultScreen(
	_props: UnifiedCameraResultScreenProps,
) {
	const { t } = useTranslation();
	const route = useRoute<ResultRoute>();
	const navigation = useNavigation<UnifiedCameraNav>();
	const insets = useSafeAreaInsets();
	const reducedMotion = useReducedMotion();

	const { cutoutUri, dominantHex, wadaMatch } = route.params;
	const [confirmedTone, setConfirmedTone] = useState<Color>(() =>
		getInitialConfirmedTone(wadaMatch),
	);

	const showToneCorrection =
		wadaMatch.type === "confirm" &&
		wadaMatch.top3.length >= 2 &&
		wadaMatch.top3[1].deltaE < TONE_CORRECTION_DELTA_E_THRESHOLD;

	// 150ms fade-in for the tone-correction section when Reduce Motion is off.
	// Built on Animated (not Reanimated) to mirror UnifiedCameraCaptureScreen.
	const correctionOpacity = useRef(
		new Animated.Value(reducedMotion ? 1 : 0),
	).current;
	useEffect(() => {
		if (!showToneCorrection) return;
		if (reducedMotion) {
			correctionOpacity.setValue(1);
			return;
		}
		Animated.timing(correctionOpacity, {
			toValue: 1,
			duration: 150,
			useNativeDriver: true,
		}).start();
	}, [showToneCorrection, reducedMotion, correctionOpacity]);

	const combinationsCount = getCombinations(confirmedTone.id).length;

	function handleSwatchPress(nextTone: Color) {
		if (nextTone.id === confirmedTone.id) return;
		hapticLight();
		setConfirmedTone(nextTone);
		AccessibilityInfo.announceForAccessibility(
			t("unifiedCamera.result.toneConfirmedA11yLive", {
				nameEn: nextTone.nameEn,
			}),
		);
	}

	function handlePrimaryCta() {
		hapticMedium();
		if (__DEV__) {
			console.warn(
				"[UnifiedCameraResultScreen] Primary CTA save flow will be implemented in Story 14.5 — routing to PostSave placeholder",
			);
		}
		navigation.push("PostSave");
	}

	function handleSecondaryLink() {
		hapticLight();
		const rootNav =
			navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
		rootNav?.navigate("Main", {
			screen: "ColorsTab",
			params: {
				screen: "Combinations",
				params: { colorId: confirmedTone.id, capturedHex: dominantHex },
			},
		} as never);
	}

	const ctaLabelColor =
		relativeLuminance(confirmedTone.hex) > LUMINANCE_DARK_TEXT_THRESHOLD
			? CTA_LABEL_DARK
			: CTA_LABEL_CREAM;

	const swatches =
		wadaMatch.type === "confirm" ? wadaMatch.top3.slice(0, 2) : [];

	return (
		<View
			testID="unified-camera-result-screen"
			className="flex-1"
			style={{
				backgroundColor: wadaTokens.bgPaper,
				paddingTop: insets.top,
				paddingBottom: insets.bottom,
			}}
		>
			<View className="flex-1 px-6">
				{/* Cutout — 220pt tall centered frame on warm paper (Pencil 6nPEq). */}
				<View
					testID="unified-camera-result-cutout"
					className="items-center justify-center"
					style={{ height: 220, marginTop: 24 }}
				>
					<Image
						source={{ uri: cutoutUri }}
						resizeMode="contain"
						accessibilityLabel={t("unifiedCamera.result.cutoutA11yLabel", {
							nameEn: confirmedTone.nameEn,
						})}
						style={{ width: "100%", height: "100%" }}
					/>
				</View>

				{/* Wada name stack — inline at 28/18 (inlined rather than bloating WadaHeader). */}
				<View
					testID="unified-camera-result-name-stack"
					accessible
					accessibilityLabel={t("unifiedCamera.result.wadaNameStackA11y", {
						nameEn: confirmedTone.nameEn,
						nameJp: confirmedTone.nameJp,
					})}
					className="items-center"
					style={{ marginTop: 24 }}
				>
					<Text
						testID="unified-camera-result-name-en"
						allowFontScaling
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 28,
							color: wadaTokens.textPrimary,
						}}
					>
						{confirmedTone.nameEn}
					</Text>
					<Text
						testID="unified-camera-result-name-jp"
						allowFontScaling
						style={{
							fontFamily: "NotoSerifJP_400Regular",
							fontSize: 18,
							color: wadaTokens.textSecondary,
							marginTop: 4,
						}}
					>
						{confirmedTone.nameJp}
					</Text>
				</View>

				{/* Combinations count — hidden when 0 (defensive; Wada dataset never hits this). */}
				{combinationsCount > 0 ? (
					<Text
						testID="unified-camera-result-combinations-count"
						allowFontScaling
						className="text-center"
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 14,
							color: wadaTokens.textSecondary,
							marginTop: 12,
						}}
					>
						{t("unifiedCamera.result.combinationsCount", {
							count: combinationsCount,
						})}
					</Text>
				) : null}

				{/* Conditional tone-correction (Pencil KY9jv). */}
				{showToneCorrection ? (
					<Animated.View
						testID="unified-camera-result-tone-correction"
						style={{ opacity: correctionOpacity, marginTop: 24 }}
					>
						<Text
							allowFontScaling
							className="text-center"
							style={{
								fontFamily: "Inter_400Regular",
								fontSize: 14,
								color: wadaTokens.textSecondary,
							}}
						>
							{t("unifiedCamera.result.toneCorrectionPrompt")}
						</Text>
						<View className="flex-row justify-center" style={{ marginTop: 12 }}>
							{swatches.map((candidate, index) => {
								const isSelected = candidate.color.id === confirmedTone.id;
								return (
									<Pressable
										key={candidate.color.id}
										testID={`unified-camera-result-tone-swatch-${index}`}
										onPress={() => handleSwatchPress(candidate.color)}
										accessibilityRole="button"
										accessibilityLabel={t(
											"unifiedCamera.result.toneCorrectionSwatchA11y",
											{ nameEn: candidate.color.nameEn },
										)}
										accessibilityState={{ selected: isSelected }}
										hitSlop={8}
										style={{
											marginLeft: index === 0 ? 0 : 12,
											alignItems: "center",
										}}
									>
										<View
											style={{
												width: 64,
												height: 64,
												borderRadius: 4,
												borderWidth: isSelected ? 2 : 1,
												borderColor: isSelected
													? wadaTokens.textPrimary
													: wadaTokens.hairline,
												padding: isSelected ? 2 : 0,
											}}
										>
											<View
												style={{
													flex: 1,
													backgroundColor: candidate.color.hex,
													borderRadius: isSelected ? 2 : 3,
												}}
											/>
										</View>
										<Text
											allowFontScaling
											numberOfLines={2}
											style={{
												fontFamily: "Inter_500Medium",
												fontSize: 12,
												color: wadaTokens.textPrimary,
												marginTop: 6,
												maxWidth: 84,
												textAlign: "center",
											}}
										>
											{candidate.color.nameEn}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</Animated.View>
				) : null}
			</View>

			{/* Primary CTA + secondary link pinned to the bottom above safe area. */}
			<View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
				<Pressable
					testID="unified-camera-result-primary-cta"
					onPress={handlePrimaryCta}
					accessibilityRole="button"
					accessibilityLabel={t("unifiedCamera.result.primaryCtaA11yLabel", {
						nameEn: confirmedTone.nameEn,
						count: combinationsCount,
					})}
					style={{
						height: 48,
						borderRadius: 14,
						backgroundColor: confirmedTone.hex,
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text
						allowFontScaling
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 16,
							color: ctaLabelColor,
						}}
					>
						{t("unifiedCamera.result.primaryCta")}
					</Text>
					<Text
						allowFontScaling
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 16,
							color: ctaLabelColor,
							marginLeft: 8,
						}}
					>
						→
					</Text>
				</Pressable>
				<Pressable
					testID="unified-camera-result-secondary-link"
					onPress={handleSecondaryLink}
					accessibilityRole="link"
					accessibilityLabel={t("unifiedCamera.result.secondaryLinkA11yLabel")}
					className="min-h-[44px] justify-center"
					style={{ marginTop: 16 }}
				>
					<Text
						allowFontScaling
						className="text-center"
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 14,
							color: wadaTokens.textSecondary,
							textDecorationLine: "underline",
						}}
					>
						{t("unifiedCamera.result.secondaryLink")}
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
