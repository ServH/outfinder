import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { CompletenessBadge } from "@/components/armario/CompletenessBadge";
import { WardrobeItemThumb } from "@/components/armario/WardrobeItemThumb";
import { getCombination } from "@/data/colorIndex";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hexToRgba } from "@/lib/color";
import { hapticLight } from "@/lib/haptics";
import { unassign } from "@/lib/wardrobeRepo";
import { FAB_PROTRUSION } from "@/navigation/CustomTabBar";
import type { FavoritesStackParamList } from "@/navigation/types";
import { useWardrobeStore } from "@/stores/wardrobeStore";
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

const defaultViewLook = (
	isComplete: boolean,
): NonNullable<ArmarioFichaWadaScreenProps["onViewLook"]> => {
	return () => {
		if (__DEV__) {
			console.warn(
				isComplete
					? "[ArmarioFichaWadaScreen] S4 Tu Look — not implemented until Story 13.5"
					: "[ArmarioFichaWadaScreen] S5 Sugerencia Armonía — not implemented until Story 13.6",
			);
		}
	};
};

export function ArmarioFichaWadaScreen({
	onViewLook,
}: ArmarioFichaWadaScreenProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioFichaWadaNav>();
	const route = useRoute<ArmarioFichaWadaRoute>();
	const { combinationId } = route.params;
	const reducedMotion = useReducedMotion();

	const combination = useMemo(
		() => getCombination(combinationId),
		[combinationId],
	);
	const allAssignments = useWardrobeStore((s) => s.assignments);
	const items = useWardrobeStore((s) => s.items);
	const hydrated = useWardrobeStore((s) => s.hydrated);

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
		navigation.push("ArmarioPicker", { combinationId, colorIndex });
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
		if (assignedCount === 0) return;
		hapticLight();
		const handler = onViewLook ?? defaultViewLook(isComplete);
		handler({ combinationId });
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
			style={{ backgroundColor: wadaTokens.bgPaper }}
		>
			<View
				style={{
					paddingTop: 56,
					paddingHorizontal: 20,
					paddingBottom: 12,
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
				<CompletenessBadge
					assigned={assignedCount}
					total={totalColors}
					testID="s2-completeness-badge"
				/>
			</View>

			<ScrollView
				contentContainerStyle={{
					paddingHorizontal: 20,
					paddingBottom: 140,
				}}
			>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 15,
						color: wadaTokens.textSecondary,
						marginTop: 8,
					}}
				>
					{t("armario.s2.instruction")}
				</Text>

				<Text
					style={{
						fontFamily: "Inter_500Medium",
						fontSize: 11,
						color: wadaTokens.textTertiary,
						letterSpacing: 2.5,
						marginTop: 24,
					}}
				>
					{t("armario.s2.wardrobeLabel")}
				</Text>

				<View className="flex-row" style={{ gap: 12, marginTop: 12 }}>
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
									minWidth: 44,
								}}
							>
								{/*
								 * Single 1:1 tile — the Wada color is conveyed exclusively
								 * as the tile's border (dashed when empty, solid when
								 * assigned). The old approach layered a separate color
								 * swatch above the thumb, which competed with the garment
								 * photo and produced a redundant visual.
								 */}
								<View style={{ aspectRatio: 1 }}>
									{isAssigned ? (
										<View
											style={{
												flex: 1,
												borderRadius: 14,
												borderWidth: 2,
												borderColor: color.hex,
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
												flex: 1,
												borderRadius: 14,
												borderWidth: 2,
												borderStyle: "dashed",
												borderColor: color.hex,
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
								</View>
								{isAssigned && (
									<Pressable
										testID={`s2-slot-${i}-remove`}
										onPress={(e) => {
											// Nested Pressable — stop propagation so the outer slot
											// tap (which pushes the Picker) does not also fire.
											// Optional chain guards against test-harness events that
											// don't include a nativeEvent.
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
											marginTop: 8,
											justifyContent: "center",
										}}
									>
										<Text
											style={{
												fontFamily: "Inter_400Regular",
												fontSize: 13,
												color: wadaTokens.textTertiary,
											}}
										>
											{t("armario.s2.linkRemove")}
										</Text>
									</Pressable>
								)}
								<Text
									style={{
										fontFamily: "Inter_400Regular",
										fontSize: 13,
										color: wadaTokens.textSecondary,
										marginTop: isAssigned ? 2 : 8,
									}}
								>
									{t(
										isAssigned
											? "armario.s2.linkChange"
											: "armario.s2.linkAssign",
									)}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</ScrollView>

			<Pressable
				testID="s2-view-look-cta"
				onPress={handleViewLook}
				disabled={!hydrated || assignedCount === 0}
				accessibilityRole="button"
				accessibilityLabel={t("armario.s2.viewLookCta")}
				accessibilityState={{ disabled: !hydrated || assignedCount === 0 }}
				className="absolute self-center items-center justify-center"
				style={{
					// Lift above the tab-bar FAB so the CTA never collides with the
					// camera-FAB that protrudes over the tab bar (Epic 12 cradle).
					bottom: 28 + FAB_PROTRUSION,
					minHeight: 44,
					minWidth: 44,
					paddingHorizontal: 24,
					paddingVertical: 14,
					borderRadius: 28,
					backgroundColor: wadaTokens.textPrimary,
					opacity: !hydrated || assignedCount === 0 ? 0.5 : 1,
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
		</View>
	);
}
