import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MisLooksLimitStrip } from "@/components/armario/MisLooksLimitStrip";
import { WardrobeItemThumb } from "@/components/armario/WardrobeItemThumb";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { PREMIUM_CONFIG } from "@/config/premium";
import { usePremium } from "@/contexts/PremiumContext";
import { getCombination } from "@/data/colorIndex";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { i18n } from "@/i18n";
import { hexToRgba } from "@/lib/color";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { unassign } from "@/lib/wardrobeRepo";
import { FAB_PROTRUSION } from "@/navigation/CustomTabBar";
import type { FavoritesStackParamList } from "@/navigation/types";
import { useMisLooksStore } from "@/stores/misLooksStore";
import { wadaTokens } from "@/styles/theme";

type ArmarioFichaWadaNav = NativeStackNavigationProp<
	FavoritesStackParamList,
	"ArmarioFichaWada"
>;

type ArmarioFichaWadaRoute = NativeStackScreenProps<
	FavoritesStackParamList,
	"ArmarioFichaWada"
>["route"];

export interface ArmarioFichaWadaScreenProps {
	onViewLook?: (args: { combinationId: string }) => void;
}

// Horizontal columns — one column per color, per the UX spec at
// `docs/planning/feature-armario-virtual/screens/s2-ficha-wada.png`.
// Each column stacks: color swatch on top, garment thumb below,
// nameEn + Cambiar link at the bottom. Column width flexes with N
// (2/3/4-color combos) so every layout stays tight and legible.
const COLUMN_GAP_PX = 12;

export function ArmarioFichaWadaScreen({
	onViewLook,
}: ArmarioFichaWadaScreenProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioFichaWadaNav>();
	const route = useRoute<ArmarioFichaWadaRoute>();
	const { combinationId } = route.params;
	const reducedMotion = useReducedMotion();
	const insets = useSafeAreaInsets();

	const combination = useMemo(
		() => getCombination(combinationId),
		[combinationId],
	);
	const allAssignments = useMisLooksStore((s) => s.assignments);
	const items = useMisLooksStore((s) => s.items);
	const hydrated = useMisLooksStore((s) => s.hydrated);
	const favorites = useMisLooksStore((s) => s.favorites);
	const addFavorite = useMisLooksStore((s) => s.addFavorite);
	const { isPremium } = usePremium();
	const gate = usePremiumGate(favorites);

	const [quitarConfirmSlot, setQuitarConfirmSlot] = useState<number | null>(
		null,
	);

	const assignments = useMemo(
		() => allAssignments.filter((a) => a.combinationId === combinationId),
		[allAssignments, combinationId],
	);
	const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
	const assignedCount = assignments.length;
	const totalColors = combination?.colors.length ?? 0;
	const isComplete = assignedCount === totalColors && totalColors > 0;

	const missingOrEmpty = !combination || combination.colors.length === 0;

	const needsLimitGate =
		!isPremium &&
		favorites.size >= PREMIUM_CONFIG.FREE_FAVORITES_LIMIT &&
		!favorites.has(combinationId);
	const alreadySaved = favorites.has(combinationId);

	useEffect(() => {
		if (missingOrEmpty) {
			navigation.goBack();
		}
	}, [missingOrEmpty, navigation]);

	if (missingOrEmpty) {
		return null;
	}

	function handleBack() {
		hapticLight();
		navigation.goBack();
	}

	function handleSlotTap(colorIndex: number) {
		hapticLight();
		if (needsLimitGate) {
			gate.handlePremiumGate(combinationId);
			return;
		}
		navigation.push("ArmarioPicker", { combinationId, colorIndex });
	}

	function handleSaveForLater() {
		hapticMedium();
		if (needsLimitGate) {
			gate.handlePremiumGate(combinationId);
			return;
		}
		const prevFavorited = useMisLooksStore
			.getState()
			.favorites.has(combinationId);
		try {
			useMisLooksStore.getState().addFavorite(combinationId);
		} catch (error) {
			if (__DEV__) {
				console.warn("[Ficha Wada] addFavorite failed", error);
			}
		}
		if (!prevFavorited) {
			AccessibilityInfo.announceForAccessibility(
				i18n.t("armario.s2.lookSavedAnnouncement"),
			);
		}
	}

	function handleRemove(colorIndex: number) {
		hapticLight();
		setQuitarConfirmSlot(colorIndex);
	}

	function handleQuitarConfirm() {
		if (quitarConfirmSlot === null) return;
		unassign(combinationId, quitarConfirmSlot);
		hapticLight();
		setQuitarConfirmSlot(null);
	}

	function handleQuitarCancel() {
		setQuitarConfirmSlot(null);
	}

	function handleViewLook() {
		if (totalColors === 0) return;
		if (assignedCount === 0) return;
		hapticLight();
		// `onViewLook` is the injection seam for tests — when provided it wins
		// for BOTH the complete and partial branches. Story 13.6 replaced the
		// partial-branch dev stub with a real S5 push.
		if (onViewLook) {
			onViewLook({ combinationId });
			return;
		}
		if (isComplete) {
			navigation.push("ArmarioTuLook", { combinationId });
			return;
		}
		navigation.push("ArmarioSugerenciaArmonia", { combinationId });
	}

	function findAssignmentThumb(colorIndex: number): string | undefined {
		const assignment = assignments.find((a) => a.colorIndex === colorIndex);
		if (!assignment) return undefined;
		const item = itemById.get(assignment.wardrobeItemId);
		return item?.thumbnailPath;
	}

	return (
		<View
			testID="s2-ficha-wada-screen"
			accessibilityLabel={t("armario.s2.screenLabel")}
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
					paddingBottom: 8,
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<Pressable
					testID="s2-back-button"
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
					testID="s2-combo-name"
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
			</View>

			<Text
				style={{
					fontFamily: "Inter_400Regular",
					fontSize: 15,
					color: wadaTokens.textSecondary,
					paddingHorizontal: 20,
					marginTop: 4,
				}}
			>
				{t("armario.s2.instruction")}
			</Text>

			{needsLimitGate && <MisLooksLimitStrip />}

			<Text
				style={{
					fontFamily: "Inter_500Medium",
					fontSize: 11,
					color: wadaTokens.textTertiary,
					letterSpacing: 2.5,
					paddingHorizontal: 20,
					marginTop: 16,
				}}
			>
				{t("armario.s2.wardrobeLabel")}
			</Text>

			{/* Columns — one per color (N = 2/3/4). Each column flexes so
			    the layout stays tight on 4-combos and breathes on 2-combos.
			    Inside each column the stack mirrors the UX spec screenshot:
			    color swatch (top), garment thumb or dashed "+" (middle),
			    nameEn + Cambiar/Asignar link (bottom). */}
			<View
				style={{
					flexDirection: "row",
					paddingHorizontal: 20,
					marginTop: 12,
					gap: COLUMN_GAP_PX,
				}}
			>
				{combination.colors.map((color, i) => {
					const assignedThumb = findAssignmentThumb(i);
					const isAssigned = typeof assignedThumb === "string";
					const a11y = t(
						isAssigned
							? "armario.s2.slotA11yAssigned"
							: "armario.s2.slotA11yUnassigned",
						{ color: color.nameEn },
					);
					return (
						<Pressable
							key={color.id}
							testID={`s2-slot-${i}`}
							accessibilityRole="button"
							accessibilityLabel={a11y}
							onPress={() => handleSlotTap(i)}
							style={{
								flex: 1,
								minHeight: 44,
								opacity: needsLimitGate ? 0.4 : 1,
							}}
						>
							{/* Color swatch — top of the column. */}
							<View
								style={{
									width: "100%",
									aspectRatio: 1.35,
									borderRadius: 14,
									backgroundColor: color.hex,
								}}
							/>

							{/* Garment slot — middle of the column. Filled → thumb;
							    empty → dashed tinted rectangle with "+". */}
							{isAssigned ? (
								<View
									style={{
										width: "100%",
										aspectRatio: 1,
										marginTop: 10,
										borderRadius: 14,
										overflow: "hidden",
										backgroundColor: wadaTokens.bgElevated,
									}}
								>
									<WardrobeItemThumb
										uri={assignedThumb}
										fill
										testID={`s2-slot-${i}-thumb`}
										accessibilityLabel={color.nameEn}
									/>
								</View>
							) : (
								<View
									testID={`s2-slot-${i}-empty`}
									className="items-center justify-center"
									style={{
										width: "100%",
										aspectRatio: 1,
										marginTop: 10,
										borderRadius: 14,
										borderWidth: 2,
										borderStyle: "dashed",
										borderColor: hexToRgba(color.hex, 0.55),
										backgroundColor: hexToRgba(color.hex, 0.08),
									}}
								>
									<Text
										style={{
											fontFamily: "Inter_500Medium",
											fontSize: 28,
											color: hexToRgba(color.hex, 0.55),
										}}
									>
										+
									</Text>
								</View>
							)}

							{/* Labels — bottom of the column. */}
							<Text
								numberOfLines={1}
								style={{
									fontFamily: "Inter_500Medium",
									fontSize: 14,
									color: wadaTokens.textPrimary,
									marginTop: 10,
								}}
							>
								{color.nameEn}
							</Text>
							<Text
								style={{
									fontFamily: "Inter_400Regular",
									fontSize: 13,
									color: wadaTokens.textTertiary,
									marginTop: 2,
								}}
							>
								{t(
									isAssigned
										? "armario.s2.linkChange"
										: "armario.s2.linkAssign",
								)}
								{" \u2192"}
							</Text>
							{isAssigned && (
								<Pressable
									testID={`s2-slot-${i}-remove`}
									onPress={(e) => {
										e?.stopPropagation?.();
										handleRemove(i);
									}}
									accessibilityRole="button"
									accessibilityLabel={t("armario.s2.slotRemoveA11y", {
										color: color.nameEn,
									})}
									style={{
										minHeight: 44,
										minWidth: 44,
										marginTop: 4,
										justifyContent: "center",
									}}
								>
									<Text
										style={{
											fontFamily: "Inter_400Regular",
											fontSize: 12,
											color: wadaTokens.textTertiary,
										}}
									>
										{t("armario.s2.linkRemove")}
									</Text>
								</Pressable>
							)}
						</Pressable>
					);
				})}
			</View>

			{/* Flex spacer pushes the CTA to the bottom while cards stay
			    anchored just under the "TU ARMARIO" label — preserves the
			    mockup's composition for 2/3/4-color combos alike. */}
			<View style={{ flex: 1 }} />

			<View
				style={{
					paddingHorizontal: 20,
					paddingTop: 8,
					paddingBottom: FAB_PROTRUSION + 12,
					alignItems: "center",
				}}
			>
				{!alreadySaved && (
					<>
						<View
							testID="s2-save-for-later-divider"
							style={{
								height: 1,
								backgroundColor: wadaTokens.hairline,
								alignSelf: "stretch",
								marginHorizontal: -20,
								marginBottom: 16,
							}}
						/>
						<Pressable
							testID="s2-save-for-later-cta"
							onPress={handleSaveForLater}
							disabled={!hydrated}
							accessibilityRole="button"
							accessibilityLabel={t("armario.s2.saveForLaterA11yLabel")}
							accessibilityHint={t("armario.s2.saveForLaterA11yHint")}
							accessibilityState={{ disabled: !hydrated }}
							className="items-center justify-center flex-row"
							style={{
								minHeight: 44,
								minWidth: 44,
								paddingHorizontal: 24,
								paddingVertical: 12,
								borderRadius: 24,
								borderWidth: 1,
								borderColor: wadaTokens.hairline,
								backgroundColor: "transparent",
								opacity: needsLimitGate ? 0.4 : 1,
								marginBottom: 16,
							}}
						>
							<SymbolView
								name="bookmark"
								size={16}
								tintColor={wadaTokens.textSecondary}
								style={{ marginRight: 8 }}
							/>
							<Text
								style={{
									fontFamily: "Inter_500Medium",
									fontSize: 15,
									color: wadaTokens.textSecondary,
								}}
							>
								{t("armario.s2.saveForLaterCta")}
							</Text>
						</Pressable>
					</>
				)}
				<Pressable
					testID="s2-view-look-cta"
					onPress={handleViewLook}
					disabled={!hydrated || assignedCount === 0 || needsLimitGate}
					accessibilityRole="button"
					accessibilityLabel={t("armario.s2.viewLookCta")}
					accessibilityState={{
						disabled: !hydrated || assignedCount === 0 || needsLimitGate,
					}}
					className="items-center justify-center"
					style={{
						minHeight: 44,
						minWidth: 44,
						paddingHorizontal: 28,
						paddingVertical: 14,
						borderRadius: 28,
						backgroundColor: wadaTokens.textPrimary,
						opacity:
							!hydrated || assignedCount === 0 || needsLimitGate ? 0.5 : 1,
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
							{t("armario.s2.viewLookCta")}
						</Text>
					)}
				</Pressable>
			</View>

			<Modal
				testID="s2-quitar-confirm-sheet"
				transparent
				visible={quitarConfirmSlot !== null}
				animationType={reducedMotion ? "none" : "fade"}
				onRequestClose={handleQuitarCancel}
				statusBarTranslucent
			>
				<View
					className="flex-1 items-center justify-end"
					style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
				>
					<Pressable
						testID="s2-quitar-confirm-scrim"
						accessibilityRole="button"
						accessibilityLabel={t("common.cancel")}
						onPress={handleQuitarCancel}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
						}}
					/>
					<View
						accessibilityViewIsModal
						style={{
							backgroundColor: wadaTokens.bgPaper,
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							paddingHorizontal: 24,
							paddingTop: 20,
							paddingBottom: 36,
							width: "100%",
						}}
					>
						{quitarConfirmSlot !== null && (
							<>
								<Text
									testID="s2-quitar-confirm-body"
									style={{
										fontFamily: "Inter_400Regular",
										fontSize: 15,
										color: wadaTokens.textPrimary,
										textAlign: "center",
										lineHeight: 22,
									}}
								>
									{t("armario.s2.quitarConfirmBody", {
										color: combination.colors[quitarConfirmSlot]?.nameEn ?? "",
									})}
								</Text>
								<Pressable
									testID="s2-quitar-confirm-yes"
									onPress={handleQuitarConfirm}
									accessibilityRole="button"
									accessibilityLabel={t("armario.s2.quitarConfirmYes")}
									className="items-center justify-center"
									style={{
										marginTop: 24,
										minHeight: 44,
										paddingVertical: 14,
										borderRadius: 14,
										backgroundColor: wadaTokens.favoriteRed,
									}}
								>
									<Text
										style={{
											fontFamily: "Inter_500Medium",
											fontSize: 15,
											color: "#ffffff",
										}}
									>
										{t("armario.s2.quitarConfirmYes")}
									</Text>
								</Pressable>
								<Pressable
									testID="s2-quitar-confirm-cancel"
									onPress={handleQuitarCancel}
									accessibilityRole="button"
									accessibilityLabel={t("common.cancel")}
									className="items-center justify-center"
									style={{ marginTop: 8, minHeight: 44 }}
								>
									<Text
										style={{
											fontFamily: "Inter_400Regular",
											fontSize: 14,
											color: wadaTokens.textSecondary,
										}}
									>
										{t("common.cancel")}
									</Text>
								</Pressable>
							</>
						)}
					</View>
				</View>
			</Modal>

			<PremiumPaywall
				visible={gate.paywallVisible}
				blockedCombination={gate.blockedCombination}
				favoriteCombinationIds={gate.favoriteCombinationIds}
				priceString={gate.priceString}
				purchaseState={gate.purchaseState}
				errorMessage={gate.errorMessage}
				onPurchase={() => gate.handlePurchase(addFavorite)}
				onRestore={gate.handleRestore}
				onDismiss={gate.handleDismiss}
			/>
		</View>
	);
}
