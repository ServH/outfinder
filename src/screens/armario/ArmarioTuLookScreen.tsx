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
import { File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	type LayoutChangeEvent,
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompletenessBadge } from "@/components/armario/CompletenessBadge";
import { getCombination } from "@/data/colorIndex";
import {
	drawPolaroidStack,
	POLAROID_OVERLAP_FRACTION,
	type PolaroidGarment,
} from "@/lib/armario/drawPolaroidStack";
import { exportLookImage } from "@/lib/armario/exportLookImage";
import { hapticLight } from "@/lib/haptics";
import type { FavoritesStackParamList } from "@/navigation/types";
import { useWardrobeStore } from "@/stores/wardrobeStore";
import { wadaTokens } from "@/styles/theme";

type ArmarioTuLookNav = NativeStackNavigationProp<
	FavoritesStackParamList,
	"ArmarioTuLook"
>;

type ArmarioTuLookRoute = NativeStackScreenProps<
	FavoritesStackParamList,
	"ArmarioTuLook"
>["route"];

const SIDE_PADDING = 20;
const SERIF_MEDIUM_TTF = require("@expo-google-fonts/noto-serif-jp/500Medium/NotoSerifJP_500Medium.ttf");
const INTER_REGULAR_TTF = require("@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf");
const INTER_MEDIUM_TTF = require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf");

export interface ArmarioTuLookScreenProps {}

export function ArmarioTuLookScreen(_props: ArmarioTuLookScreenProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioTuLookNav>();
	const route = useRoute<ArmarioTuLookRoute>();
	const { combinationId } = route.params;
	const insets = useSafeAreaInsets();

	const combination = useMemo(
		() => getCombination(combinationId),
		[combinationId],
	);
	const assignments = useWardrobeStore((s) => s.assignments);
	const items = useWardrobeStore((s) => s.items);

	const totalColors = combination?.colors.length ?? 0;
	const filteredAssignments = useMemo(
		() => assignments.filter((a) => a.combinationId === combinationId),
		[assignments, combinationId],
	);
	const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

	const garmentDescriptors = useMemo<PolaroidGarment[]>(() => {
		if (!combination) return [];
		return [...filteredAssignments]
			.sort((a, b) => a.colorIndex - b.colorIndex)
			.map((a) => {
				const item = itemById.get(a.wardrobeItemId);
				const color = combination.colors[a.colorIndex];
				if (!item || !color) return null;
				return {
					imageFileUri: item.localImagePath,
					colorNameEn: color.nameEn,
					colorHex: color.hex,
				} satisfies PolaroidGarment;
			})
			.filter((x): x is PolaroidGarment => x !== null);
	}, [combination, filteredAssignments, itemById]);

	const assignedCount = garmentDescriptors.length;
	const isComplete = totalColors > 0 && assignedCount === totalColors;

	// Canvas layout is driven by the natural flex size of the view it lives
	// in. We derive W/H from onLayout so the cascade reflows on rotation,
	// split-view, etc. without hardcoded aspect ratios.
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

	// Brand signature font (Inter) scaled to match drawPolaroidStack's
	// signature band — so the on-screen polaroid's "Outfinder" reads
	// proportional to what the exported JPEG renders.
	const signaturePreviewSize = useMemo(() => {
		if (canvasSize.h <= 0) return 12;
		const N = Math.max(garmentDescriptors.length, 1);
		const heightMultiplier = 1 + (1 - POLAROID_OVERLAP_FRACTION) * (N - 1);
		const approxCardH = canvasSize.h / heightMultiplier;
		return Math.max(10, Math.min(18, approxCardH * 0.04));
	}, [canvasSize.h, garmentDescriptors.length]);

	const previewSignatureFont = useFont(INTER_REGULAR_TTF, signaturePreviewSize);
	const exportSerifTitleFont = useFont(SERIF_MEDIUM_TTF, 76);
	const exportSansFont = useFont(INTER_REGULAR_TTF, 28);
	// Inter Medium pre-loaded for future chrome iterations (e.g. baked-in CTA).
	useFont(INTER_MEDIUM_TTF, 28);

	const [garmentImages, setGarmentImages] = useState<Array<SkImage | null>>(
		() => garmentDescriptors.map(() => null),
	);

	useEffect(() => {
		// Reset to null array first so the picture memo does not reuse stale
		// SkImage objects while new images are loading (e.g. garment reassigned).
		setGarmentImages(garmentDescriptors.map(() => null));
		let cancelled = false;
		async function loadAll() {
			const loaded: Array<SkImage | null> = await Promise.all(
				garmentDescriptors.map(async (g) => {
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
	}, [garmentDescriptors]);

	useEffect(() => {
		if (!combination || !isComplete) {
			navigation.goBack();
		}
	}, [combination, isComplete, navigation]);

	const picture = useMemo(() => {
		if (!previewSignatureFont) return null;
		if (canvasSize.w <= 0 || canvasSize.h <= 0) return null;
		if (garmentImages.some((i) => i === null)) return null;
		if (garmentDescriptors.length === 0) return null;
		return createPicture((canvas) => {
			drawPolaroidStack(canvas, {
				garments: garmentDescriptors,
				signatureFont: previewSignatureFont,
				garmentImages,
				targetSize: { w: canvasSize.w, h: canvasSize.h },
			});
		});
	}, [previewSignatureFont, garmentDescriptors, garmentImages, canvasSize]);

	const [isSharing, setIsSharing] = useState(false);

	const handleShare = useCallback(async () => {
		if (isSharing) return;
		if (!exportSerifTitleFont || !exportSansFont) return;
		if (garmentImages.some((i) => i === null)) return;
		if (!combination) return;
		setIsSharing(true);
		try {
			const available = await Sharing.isAvailableAsync();
			if (!available) {
				Alert.alert(t("armario.s4.shareError"));
				return;
			}
			const { uri } = await exportLookImage({
				garments: garmentDescriptors,
				garmentImages,
				combinationNameEn: combination.nameEn,
				headerPrefix: t("armario.s4.headerPrefix"),
				serifTitleFont: exportSerifTitleFont,
				sansFont: exportSansFont,
			});
			hapticLight();
			try {
				await Sharing.shareAsync(uri, {
					mimeType: "image/jpeg",
					UTI: "public.jpeg",
				});
			} finally {
				try {
					new File(uri).delete();
				} catch (err) {
					if (__DEV__) {
						console.warn("[ArmarioTuLook] share cleanup failed", err);
					}
				}
			}
		} catch (err) {
			if (__DEV__) {
				console.warn("[ArmarioTuLook] share failed", err);
			}
			Alert.alert(t("armario.s4.shareError"));
		} finally {
			setIsSharing(false);
		}
	}, [
		combination,
		exportSansFont,
		exportSerifTitleFont,
		garmentDescriptors,
		garmentImages,
		isSharing,
		t,
	]);

	const handleExplore = useCallback(() => {
		hapticLight();
		navigation.popToTop();
	}, [navigation]);

	const handleBack = useCallback(() => {
		hapticLight();
		navigation.goBack();
	}, [navigation]);

	if (!combination || !isComplete) {
		return null;
	}

	const canvasA11y = t("armario.s4.canvasA11y", {
		combo: combination.nameEn,
		count: totalColors,
	});

	return (
		<View
			testID="s4-tu-look-screen"
			accessibilityLabel={t("armario.s4.screenLabel")}
			className="flex-1"
			style={{
				backgroundColor: wadaTokens.bgPaper,
				paddingTop: insets.top,
				paddingBottom: insets.bottom,
			}}
		>
			{/* Nav row (fixed height) */}
			<View
				style={{
					paddingTop: 16,
					paddingHorizontal: SIDE_PADDING,
					paddingBottom: 12,
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<Pressable
					testID="s4-back-button"
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
				<View style={{ flex: 1, marginLeft: 4 }}>
					<Text
						testID="s4-header-prefix"
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 10,
							letterSpacing: 1.8,
							color: wadaTokens.textTertiary,
						}}
					>
						{t("armario.s4.headerPrefix").toUpperCase()}
					</Text>
					<Text
						testID="s4-combo-name"
						numberOfLines={1}
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 22,
							color: wadaTokens.textPrimary,
							marginTop: 2,
						}}
					>
						{combination.nameEn}
					</Text>
				</View>
				<CompletenessBadge
					assigned={assignedCount}
					total={totalColors}
					testID="s4-completeness-badge"
				/>
			</View>

			{/* Polaroid cascade — fills all vertical space between nav and chrome */}
			{/* NFR11: Reduce Motion trivially respected — Skia renders polaroids
			    in final position. No mount animation to suppress. */}
			<View
				testID="s4-canvas-wrapper"
				accessible
				accessibilityRole="image"
				accessibilityLabel={canvasA11y}
				onLayout={handleCanvasLayout}
				style={{
					flex: 1,
					marginHorizontal: SIDE_PADDING,
				}}
			>
				<Canvas testID="s4-canvas" style={{ flex: 1 }}>
					{picture ? <Picture picture={picture} /> : null}
				</Canvas>
			</View>

			{/* CTA row — fixed at the bottom, no absolute positioning. The brand
			    signature (Wada dots + Outfinder) lives INSIDE the last polaroid
			    rendered by Skia, so there is no native chrome between Canvas
			    and CTAs. */}
			<View
				style={{
					paddingHorizontal: SIDE_PADDING,
					paddingTop: 16,
					paddingBottom: 12,
				}}
			>
				<Pressable
					testID="s4-share-cta"
					onPress={handleShare}
					accessibilityRole="button"
					accessibilityLabel={t("armario.s4.shareCta")}
					accessibilityState={{
						disabled:
							isSharing ||
							!exportSerifTitleFont ||
							!exportSansFont ||
							garmentImages.some((i) => i === null),
					}}
					disabled={
						isSharing ||
						!exportSerifTitleFont ||
						!exportSansFont ||
						garmentImages.some((i) => i === null)
					}
					className="items-center justify-center"
					style={{
						minHeight: 52,
						paddingVertical: 14,
						borderRadius: 28,
						backgroundColor: wadaTokens.textPrimary,
						opacity:
							isSharing ||
							!exportSerifTitleFont ||
							!exportSansFont ||
							garmentImages.some((i) => i === null)
								? 0.5
								: 1,
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
							{t("armario.s4.shareCta")}
						</Text>
					)}
				</Pressable>
				<Pressable
					testID="s4-explore-cta"
					onPress={handleExplore}
					accessibilityRole="button"
					accessibilityLabel={t("armario.s4.exploreCta")}
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
						{t("armario.s4.exploreCta")}
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
