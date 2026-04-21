import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import {
	Canvas,
	createPicture,
	Picture,
	type SkImage,
	Skia,
	useFont,
} from "@shopify/react-native-skia";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompletenessBadge } from "@/components/armario/CompletenessBadge";
import { getCombination } from "@/data/colorIndex";
import {
	drawPolaroidStack,
	POLAROID_OVERLAP_FRACTION,
	type PolaroidGarment,
} from "@/lib/armario/drawPolaroidStack";
import {
	getSuggestionCopy,
	type SuggestionCopyKey,
} from "@/lib/armario/getSuggestionCopy";
import { hapticLight } from "@/lib/haptics";
import type { FavoritesStackParamList } from "@/navigation/types";
import { useWardrobeStore } from "@/stores/wardrobeStore";
import { wadaTokens } from "@/styles/theme";

type ArmarioSugerenciaArmoniaNav = NativeStackNavigationProp<
	FavoritesStackParamList,
	"ArmarioSugerenciaArmonia"
>;

type ArmarioSugerenciaArmoniaRoute = NativeStackScreenProps<
	FavoritesStackParamList,
	"ArmarioSugerenciaArmonia"
>["route"];

const SIDE_PADDING = 20;
const INTER_REGULAR_TTF = require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf");
const INTER_MEDIUM_TTF = require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf");

interface MissingColor {
	colorIndex: number;
	nameEn: string;
	hex: string;
}

interface SuggestionCardProps {
	titleText: string;
	bodyText: string;
	ctaText: string;
	colorHex: string;
	onPress: () => void;
	accessibilityLabel: string;
}

function SuggestionCard({
	titleText,
	bodyText,
	ctaText,
	colorHex,
	onPress,
	accessibilityLabel,
}: SuggestionCardProps) {
	return (
		<Pressable
			testID="s5-suggestion-card"
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			style={{
				backgroundColor: wadaTokens.bgElevated,
				borderRadius: 14,
				paddingLeft: 20,
				paddingRight: 16,
				paddingTop: 16,
				paddingBottom: 14,
				marginHorizontal: SIDE_PADDING,
				marginTop: 12,
				borderLeftWidth: 4,
				borderLeftColor: colorHex,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 3 },
				shadowOpacity: 0.08,
				shadowRadius: 6,
			}}
		>
			<Text
				testID="s5-suggestion-card-title"
				style={{
					fontFamily: "Inter_500Medium",
					fontSize: 15,
					color: wadaTokens.textPrimary,
				}}
			>
				{titleText}
			</Text>
			<Text
				testID="s5-suggestion-card-body"
				style={{
					fontFamily: "Inter_400Regular",
					fontSize: 14,
					color: wadaTokens.textSecondary,
					lineHeight: 20,
					marginTop: 4,
				}}
			>
				{bodyText}
			</Text>
			<Text
				testID="s5-suggestion-card-cta"
				style={{
					fontFamily: "Inter_500Medium",
					fontSize: 15,
					color: wadaTokens.textPrimary,
					marginTop: 12,
				}}
			>
				{ctaText}
			</Text>
		</Pressable>
	);
}

export type ArmarioSugerenciaArmoniaScreenProps = Record<string, never>;

export function ArmarioSugerenciaArmoniaScreen(
	_props: ArmarioSugerenciaArmoniaScreenProps,
) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioSugerenciaArmoniaNav>();
	const route = useRoute<ArmarioSugerenciaArmoniaRoute>();
	const { combinationId } = route.params;
	const insets = useSafeAreaInsets();

	const combination = useMemo(
		() => getCombination(combinationId),
		[combinationId],
	);
	const assignments = useWardrobeStore((s) => s.assignments);
	const items = useWardrobeStore((s) => s.items);

	const filteredAssignments = useMemo(
		() => assignments.filter((a) => a.combinationId === combinationId),
		[assignments, combinationId],
	);
	const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

	const totalColors = combination?.colors.length ?? 0;
	const assignedCount = filteredAssignments.length;

	// One polaroid entry per color slot — filled slots carry the garment
	// image URI, empty slots use a sentinel with empty imageFileUri that the
	// draw path ignores (`emptySlots[i] === true` short-circuits the image
	// blit).
	const { garmentDescriptors, emptySlots } = useMemo(() => {
		if (!combination) {
			return {
				garmentDescriptors: [] as PolaroidGarment[],
				emptySlots: [] as boolean[],
			};
		}
		const assignmentByIndex = new Map(
			filteredAssignments.map((a) => [a.colorIndex, a]),
		);
		const descriptors: PolaroidGarment[] = [];
		const empties: boolean[] = [];
		combination.colors.forEach((color, idx) => {
			const a = assignmentByIndex.get(idx);
			const item = a ? itemById.get(a.wardrobeItemId) : undefined;
			if (item) {
				descriptors.push({
					imageFileUri: item.localImagePath,
					colorNameEn: color.nameEn,
					colorHex: color.hex,
				});
				empties.push(false);
			} else {
				descriptors.push({
					imageFileUri: "",
					colorNameEn: color.nameEn,
					colorHex: color.hex,
				});
				empties.push(true);
			}
		});
		return { garmentDescriptors: descriptors, emptySlots: empties };
	}, [combination, filteredAssignments, itemById]);

	const missingColor = useMemo<MissingColor | null>(() => {
		if (!combination) return null;
		for (let i = 0; i < emptySlots.length; i++) {
			if (emptySlots[i]) {
				const color = combination.colors[i];
				if (color) {
					return { colorIndex: i, nameEn: color.nameEn, hex: color.hex };
				}
			}
		}
		return null;
	}, [combination, emptySlots]);

	const suggestionCopyKey = useMemo<SuggestionCopyKey>(() => {
		if (!missingColor) return "armario.s5.suggestionCopyMain";
		return getSuggestionCopy(missingColor.colorIndex, totalColors);
	}, [missingColor, totalColors]);

	const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
		w: 0,
		h: 0,
	});
	const handleCanvasLayout = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setCanvasSize((prev) => {
			if (Math.abs(prev.w - width) < 0.5 && Math.abs(prev.h - height) < 0.5) {
				return prev;
			}
			return { w: width, h: height };
		});
	}, []);

	const signaturePreviewSize = useMemo(() => {
		if (canvasSize.h <= 0) return 12;
		const N = Math.max(garmentDescriptors.length, 1);
		const heightMultiplier = 1 + (1 - POLAROID_OVERLAP_FRACTION) * (N - 1);
		const approxCardH = canvasSize.h / heightMultiplier;
		return Math.max(10, Math.min(18, approxCardH * 0.04));
	}, [canvasSize.h, garmentDescriptors.length]);

	const plusFontSize = useMemo(() => {
		if (canvasSize.h <= 0) return 36;
		const N = Math.max(garmentDescriptors.length, 1);
		const heightMultiplier = 1 + (1 - POLAROID_OVERLAP_FRACTION) * (N - 1);
		const approxCardH = canvasSize.h / heightMultiplier;
		return Math.max(24, Math.min(96, approxCardH * 0.18));
	}, [canvasSize.h, garmentDescriptors.length]);

	const signatureFont = useFont(INTER_REGULAR_TTF, signaturePreviewSize);
	const emptySlotPlusFont = useFont(INTER_MEDIUM_TTF, plusFontSize);

	const [garmentImages, setGarmentImages] = useState<Array<SkImage | null>>(
		() => garmentDescriptors.map(() => null),
	);

	useEffect(() => {
		setGarmentImages(garmentDescriptors.map(() => null));
		let cancelled = false;
		async function loadAll() {
			const loaded: Array<SkImage | null> = await Promise.all(
				garmentDescriptors.map(async (g, i) => {
					if (emptySlots[i] || !g.imageFileUri) return null;
					try {
						const data = await Skia.Data.fromURI(g.imageFileUri);
						if (!data) return null;
						return Skia.Image.MakeImageFromEncoded(data) ?? null;
					} catch {
						return null;
					}
				}),
			);
			if (!cancelled) setGarmentImages(loaded);
		}
		loadAll();
		return () => {
			cancelled = true;
		};
	}, [garmentDescriptors, emptySlots]);

	// Defensive route-away + auto-transition to S4 on complete. Consolidated
	// into one effect so `didReplaceRef` guards BOTH the "mounted at 3/3"
	// defensive path AND the "assigned the last garment in S3 picker" auto-
	// transition path against double-fire from Zustand hydration bounces.
	// `replace` (not `push`) preserves the Epic-12 capture → combinations
	// transition pattern — the user already scrolled past S5.
	const didReplaceRef = useRef(false);
	useEffect(() => {
		if (!combination || combination.colors.length === 0) {
			navigation.goBack();
			return;
		}
		if (assignedCount === 0) {
			navigation.goBack();
			return;
		}
		if (assignedCount >= totalColors) {
			if (didReplaceRef.current) return;
			didReplaceRef.current = true;
			navigation.replace("ArmarioTuLook", { combinationId });
		}
	}, [combination, assignedCount, totalColors, navigation, combinationId]);

	const picture = useMemo(() => {
		if (!signatureFont) return null;
		if (!emptySlotPlusFont) return null;
		if (canvasSize.w <= 0 || canvasSize.h <= 0) return null;
		if (garmentDescriptors.length === 0) return null;
		const filledMissingImage = garmentDescriptors.some(
			(_g, i) => !emptySlots[i] && garmentImages[i] === null,
		);
		if (filledMissingImage) return null;
		return createPicture((canvas) => {
			drawPolaroidStack(canvas, {
				garments: garmentDescriptors,
				signatureFont,
				garmentImages,
				targetSize: { w: canvasSize.w, h: canvasSize.h },
				emptySlots,
				emptySlotPlusFont,
			});
		});
	}, [
		signatureFont,
		emptySlotPlusFont,
		garmentDescriptors,
		garmentImages,
		canvasSize,
		emptySlots,
	]);

	const handleBack = useCallback(() => {
		hapticLight();
		navigation.goBack();
	}, [navigation]);

	const handleOpenPicker = useCallback(() => {
		if (!missingColor) return;
		hapticLight();
		navigation.push("ArmarioPicker", {
			combinationId,
			colorIndex: missingColor.colorIndex,
		});
	}, [missingColor, combinationId, navigation]);

	const handleGoBackToS2 = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	if (!combination || combination.colors.length === 0) return null;
	if (assignedCount === 0 || assignedCount >= totalColors) return null;
	if (!missingColor) return null;

	const canvasA11y = t("armario.s5.canvasA11y", {
		combo: combination.nameEn,
		assigned: assignedCount,
		total: totalColors,
		missing: missingColor.nameEn,
	});
	const primaryCtaLabel = t("armario.s5.suggestionCta", {
		color: missingColor.nameEn,
	});

	return (
		<View
			testID="s5-sugerencia-armonia-screen"
			accessibilityLabel={t("armario.s5.screenLabel")}
			className="flex-1"
			style={{
				backgroundColor: wadaTokens.bgPaper,
				paddingTop: insets.top,
				paddingBottom: insets.bottom,
			}}
		>
			{/* Nav row */}
			<View
				style={{
					paddingTop: 16,
					paddingHorizontal: SIDE_PADDING,
					paddingBottom: 8,
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<Pressable
					testID="s5-back-button"
					onPress={handleBack}
					accessibilityRole="button"
					accessibilityLabel={t("common.goBack")}
					className="items-center justify-center"
					style={{ width: 48, height: 48, marginLeft: -12 }}
				>
					<SymbolView
						name="chevron.left"
						size={22}
						tintColor={wadaTokens.textPrimary}
					/>
				</Pressable>
				<Text
					testID="s5-combo-name"
					numberOfLines={1}
					style={{
						fontFamily: "NotoSerifJP_500Medium",
						fontSize: 22,
						color: wadaTokens.textPrimary,
						flex: 1,
						marginLeft: 4,
					}}
				>
					{combination.nameEn}
				</Text>
				<CompletenessBadge
					assigned={assignedCount}
					total={totalColors}
					testID="s5-completeness-badge"
				/>
			</View>

			<Text
				testID="s5-subtitle"
				style={{
					fontFamily: "Inter_400Regular",
					fontSize: 15,
					color: wadaTokens.textSecondary,
					paddingHorizontal: SIDE_PADDING,
					marginTop: 4,
				}}
			>
				{t("armario.s5.subtitle")}
			</Text>

			{/* Polaroid cascade */}
			<View
				testID="s5-canvas-wrapper"
				accessible
				accessibilityRole="image"
				accessibilityLabel={canvasA11y}
				onLayout={handleCanvasLayout}
				style={{
					flex: 1,
					marginHorizontal: SIDE_PADDING,
					marginTop: 12,
				}}
			>
				<Canvas testID="s5-canvas" style={{ flex: 1 }}>
					{picture ? <Picture picture={picture} /> : null}
				</Canvas>
			</View>

			{/* Suggestion card — mid-screen narrative affordance */}
			<SuggestionCard
				titleText={t("armario.s5.suggestionTitle")}
				bodyText={t(suggestionCopyKey, { color: missingColor.nameEn })}
				ctaText={primaryCtaLabel}
				colorHex={missingColor.hex}
				onPress={handleOpenPicker}
				accessibilityLabel={primaryCtaLabel}
			/>

			{/* Bottom-anchored CTAs */}
			<View
				style={{
					paddingHorizontal: SIDE_PADDING,
					paddingTop: 12,
					paddingBottom: 12,
				}}
			>
				<Pressable
					testID="s5-primary-cta"
					onPress={handleOpenPicker}
					accessibilityRole="button"
					accessibilityLabel={primaryCtaLabel}
					className="items-center justify-center"
					style={{
						minHeight: 52,
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
							{primaryCtaLabel}
						</Text>
					)}
				</Pressable>
				<Pressable
					testID="s5-secondary-cta"
					onPress={handleGoBackToS2}
					accessibilityRole="button"
					accessibilityLabel={t("armario.s5.backToFicha")}
					className="items-center justify-center"
					style={{ minHeight: 44, marginTop: 6, paddingVertical: 10 }}
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 14,
							color: wadaTokens.textSecondary,
						}}
					>
						{t("armario.s5.backToFicha")}
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
