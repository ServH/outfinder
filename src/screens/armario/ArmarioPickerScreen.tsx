import {
	type NavigationProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AccessibilityInfo,
	FlatList,
	Modal,
	Pressable,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WadaColorDot } from "@/components/armario/WadaColorDot";
import { WardrobeItemThumb } from "@/components/armario/WardrobeItemThumb";
import { getCombination } from "@/data/colorIndex";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { i18n } from "@/i18n";
import { deleteItemFiles } from "@/lib/armario/wardrobeFiles";
import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics";
import {
	assign,
	cascadeDeleteAssignmentsForItem,
	removeItem,
	unassign,
} from "@/lib/wardrobeRepo";
import type { WardrobeCategory, WardrobeItem } from "@/lib/wardrobeTypes";
import type {
	FavoritesStackParamList,
	RootStackParamList,
} from "@/navigation/types";
import { useMisLooksStore } from "@/stores/misLooksStore";
import { wadaTokens } from "@/styles/theme";

const DISMISS_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;
// Timing-based enter/exit keeps the sheet utilitarian — no spring bounce.
// PremiumPaywall intentionally bounces (conversion surface); the picker is
// repeated work so the motion must fade into the background.
const ENTER_DURATION = 280;
const EXIT_DURATION = 220;
const SHEET_HEIGHT_RATIO = 0.78;
const GRID_COLUMNS = 3;
const GRID_H_PADDING = 16;
const GRID_GAP = 12;
const EDIT_MODE_FADE_DURATION = 250;

const categoryLabelKey = {
	top: "rowTop",
	bottom: "rowBottom",
	footwear: "rowFootwear",
	accessory: "rowAccessory",
} as const satisfies Record<WardrobeCategory, string>;

type ArmarioPickerNav = NativeStackNavigationProp<
	FavoritesStackParamList,
	"ArmarioPicker"
>;

type ArmarioPickerRoute = NativeStackScreenProps<
	FavoritesStackParamList,
	"ArmarioPicker"
>["route"];

type ArmarioPickerScreenProps = Record<string, never>;

export function ArmarioPickerScreen(_props: ArmarioPickerScreenProps) {
	const { t } = useTranslation();
	const pickerNavigation = useNavigation<ArmarioPickerNav>();
	const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
	const route = useRoute<ArmarioPickerRoute>();
	const { combinationId, colorIndex } = route.params;

	const insets = useSafeAreaInsets();
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const reducedMotion = useReducedMotion();

	const items = useMisLooksStore((s) => s.items);
	const assignments = useMisLooksStore((s) => s.assignments);

	const combination = useMemo(
		() => getCombination(combinationId),
		[combinationId],
	);
	const wadaColor = combination?.colors[colorIndex];
	const missingOrInvalid = !combination || !wadaColor;

	const sheetHeight = screenHeight * SHEET_HEIGHT_RATIO;
	const tileSize =
		(screenWidth - GRID_H_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
		GRID_COLUMNS;

	const translateY = useSharedValue(sheetHeight);
	const editOpacity = useSharedValue(0);
	const isClosing = useRef(false);

	const [pendingDelete, setPendingDelete] = useState<WardrobeItem | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const pendingDeleteAssignmentCount = useMemo(() => {
		if (!pendingDelete) return 0;
		return assignments.filter((a) => a.wardrobeItemId === pendingDelete.id)
			.length;
	}, [assignments, pendingDelete]);

	// Items in this combo that are already occupying a DIFFERENT slot. Soft
	// conflict: rendered at reduced opacity but still tappable — tap moves
	// the item to this slot (unassign old → assign new).
	const conflictSet = useMemo(() => {
		const set = new Set<string>();
		for (const a of assignments) {
			if (a.combinationId === combinationId && a.colorIndex !== colorIndex) {
				set.add(a.wardrobeItemId);
			}
		}
		return set;
	}, [assignments, combinationId, colorIndex]);

	useEffect(() => {
		if (missingOrInvalid) {
			pickerNavigation.goBack();
		}
	}, [missingOrInvalid, pickerNavigation]);

	useEffect(() => {
		if (missingOrInvalid) return;
		if (reducedMotion) {
			translateY.value = 0;
		} else {
			translateY.value = withTiming(0, {
				duration: ENTER_DURATION,
				easing: Easing.out(Easing.cubic),
			});
		}
	}, [missingOrInvalid, reducedMotion, translateY]);

	const dismissWithAnimation = useCallback(() => {
		if (isClosing.current) return;
		isClosing.current = true;
		if (reducedMotion) {
			pickerNavigation.goBack();
			return;
		}
		translateY.value = withTiming(
			sheetHeight,
			{ duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) },
			(finished) => {
				if (finished) {
					runOnJS(pickerNavigation.goBack)();
				}
			},
		);
	}, [pickerNavigation, reducedMotion, sheetHeight, translateY]);

	// Single commit point — tap on a tile (existing item) or `onCutoutSaved`
	// (item just created via the capture flow) both route through here.
	// Move semantics: if the item is already on another slot of the same
	// combo, unassign that slot first so the item ends on the target only.
	const commitAndDismiss = useCallback(
		(wardrobeItemId: string) => {
			// Guard against rapid double-tap: if dismissWithAnimation already
			// started, skip the second commit entirely rather than letting two
			// assign() calls race before the first goBack lands.
			if (isClosing.current) return;
			// Snapshot favorites BEFORE assign so the VoiceOver announce fires
			// once per first-assignment only (AC #12). Read via getState() since
			// this callback lives outside the React tree.
			const prevFavorited = useMisLooksStore
				.getState()
				.favorites.has(combinationId);
			try {
				const existing = assignments.find(
					(a) =>
						a.combinationId === combinationId &&
						a.wardrobeItemId === wardrobeItemId &&
						a.colorIndex !== colorIndex,
				);
				if (existing) {
					unassign(combinationId, existing.colorIndex);
				}
				assign(combinationId, colorIndex, wardrobeItemId);
				try {
					useMisLooksStore.getState().addFavorite(combinationId);
				} catch (err) {
					if (__DEV__) {
						console.warn(
							"[ArmarioPickerScreen] auto-save addFavorite failed",
							err,
						);
					}
				}
				if (!prevFavorited) {
					AccessibilityInfo.announceForAccessibility(
						i18n.t("armario.s2.lookSavedAnnouncement"),
					);
				}
				hapticLight();
			} catch (err) {
				if (__DEV__) {
					console.warn("[ArmarioPickerScreen] commit failed", err);
				}
			}
			dismissWithAnimation();
		},
		[assignments, combinationId, colorIndex, dismissWithAnimation],
	);

	const handleCutoutSaved = useCallback(
		(newItemId: string) => {
			// The user took a photo specifically for this slot and tapped
			// "Usar esta foto" — commit it immediately as the assignment.
			commitAndDismiss(newItemId);
		},
		[commitAndDismiss],
	);

	const handleNewPhoto = useCallback(() => {
		hapticLight();
		rootNavigation.navigate("ArmarioRoot", {
			screen: "ArmarioCapture",
			params: { onCutoutSaved: handleCutoutSaved },
		});
	}, [rootNavigation, handleCutoutSaved]);

	const enterEditMode = useCallback(() => {
		hapticMedium();
		setIsEditMode(true);
		AccessibilityInfo.announceForAccessibility(
			i18n.t("armario.s3.editMode.enterAnnouncement"),
		);
		if (reducedMotion) {
			editOpacity.value = 1;
		} else {
			editOpacity.value = withTiming(1, {
				duration: EDIT_MODE_FADE_DURATION,
				easing: Easing.out(Easing.cubic),
			});
		}
	}, [reducedMotion, editOpacity]);

	const exitEditMode = useCallback(() => {
		if (reducedMotion) {
			editOpacity.value = 0;
			setIsEditMode(false);
			return;
		}
		editOpacity.value = withTiming(
			0,
			{
				duration: EDIT_MODE_FADE_DURATION,
				easing: Easing.in(Easing.cubic),
			},
			(finished) => {
				if (finished) {
					runOnJS(setIsEditMode)(false);
				}
			},
		);
	}, [reducedMotion, editOpacity]);

	const handleLongPressTile = useCallback(() => {
		enterEditMode();
	}, [enterEditMode]);

	const handleDeleteBadgePress = useCallback((item: WardrobeItem) => {
		hapticRigid();
		setPendingDelete(item);
	}, []);

	const handleDeleteConfirm = useCallback(() => {
		if (!pendingDelete) return;
		const item = pendingDelete;
		try {
			// Cascade FIRST so every screen observing the assignments slice sees
			// freed slots before `items` loses the referenced row — prevents a
			// frame where a thumb would render from a stale id.
			cascadeDeleteAssignmentsForItem(item.id);
			removeItem(item.id);
			deleteItemFiles({
				localImagePath: item.localImagePath,
				thumbnailPath: item.thumbnailPath,
			});
			hapticLight();
		} catch (err) {
			if (__DEV__) {
				console.warn("[ArmarioPickerScreen] delete failed", err);
			}
		}
		setPendingDelete(null);
	}, [pendingDelete]);

	const handleDeleteCancel = useCallback(() => {
		setPendingDelete(null);
	}, []);

	const panGesture = Gesture.Pan()
		.onUpdate((e) => {
			if (e.translationY > 0) {
				translateY.value = e.translationY;
			}
		})
		.onEnd((e) => {
			if (
				e.translationY > DISMISS_THRESHOLD ||
				e.velocityY > VELOCITY_THRESHOLD
			) {
				runOnJS(dismissWithAnimation)();
			} else {
				translateY.value = withTiming(0, {
					duration: 180,
					easing: Easing.out(Easing.cubic),
				});
			}
		});

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const editBadgeAnimStyle = useAnimatedStyle(() => ({
		opacity: editOpacity.value,
	}));

	if (missingOrInvalid) {
		return null;
	}

	const isEmpty = items.length === 0;

	return (
		<View
			testID="s3-armario-picker-screen"
			accessibilityLabel={t("armario.s3.screenLabel")}
			accessibilityViewIsModal
			className="flex-1"
		>
			<Pressable
				testID="s3-scrim"
				onPress={dismissWithAnimation}
				accessibilityRole="button"
				accessibilityLabel={t("armario.s3.dismiss")}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0,0,0,0.5)",
				}}
			/>

			<GestureDetector gesture={panGesture}>
				<Animated.View
					testID="s3-sheet"
					style={[
						sheetStyle,
						{
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							height: sheetHeight,
							backgroundColor: wadaTokens.bgPaper,
							borderTopLeftRadius: 24,
							borderTopRightRadius: 24,
						},
					]}
				>
					<View style={{ alignItems: "center", paddingTop: 8 }}>
						<View
							testID="s3-drag-handle"
							accessibilityElementsHidden
							importantForAccessibility="no-hide-descendants"
							style={{
								width: 40,
								height: 4,
								backgroundColor: wadaTokens.textTertiary,
								borderRadius: 2,
								opacity: 0.4,
							}}
						/>
					</View>

					{isEditMode ? (
						<View
							className="flex-row items-center"
							style={{
								paddingHorizontal: GRID_H_PADDING,
								paddingTop: 16,
								paddingBottom: 16,
								borderBottomWidth: 1,
								borderBottomColor: wadaTokens.hairline,
							}}
						>
							<Pressable
								testID="s3-edit-cancel"
								onPress={exitEditMode}
								accessibilityRole="button"
								accessibilityLabel={t("armario.s3.editMode.cancelA11yLabel")}
								style={{ minHeight: 44, justifyContent: "center" }}
							>
								<Text
									style={{
										fontFamily: "Inter_500Medium",
										fontSize: 15,
										color: wadaTokens.textSecondary,
									}}
								>
									{t("armario.s3.editMode.cancel")}
								</Text>
							</Pressable>
							<Text
								testID="s3-edit-title"
								numberOfLines={1}
								style={{
									fontFamily: "Inter_500Medium",
									fontSize: 17,
									color: wadaTokens.textPrimary,
									textAlign: "center",
									flex: 1,
								}}
							>
								{t("armario.s3.editMode.title")}
							</Text>
							<Pressable
								testID="s3-edit-done"
								onPress={exitEditMode}
								accessibilityRole="button"
								accessibilityLabel={t("armario.s3.editMode.doneA11yLabel")}
								style={{ minHeight: 44, justifyContent: "center" }}
							>
								<Text
									style={{
										fontFamily: "Inter_500Medium",
										fontSize: 15,
										color: wadaTokens.textPrimary,
									}}
								>
									{t("armario.s3.editMode.done")}
								</Text>
							</Pressable>
						</View>
					) : (
						<View
							className="flex-row items-center"
							style={{
								paddingHorizontal: GRID_H_PADDING,
								paddingTop: 16,
								paddingBottom: 16,
								gap: 8,
								borderBottomWidth: 1,
								borderBottomColor: wadaTokens.hairline,
							}}
						>
							<WadaColorDot hex={wadaColor.hex} size={14} />
							<Text
								testID="s3-picker-title"
								numberOfLines={1}
								style={{
									fontFamily: "NotoSerifJP_500Medium",
									fontSize: 20,
									color: wadaTokens.textPrimary,
									flex: 1,
								}}
							>
								{t("armario.s3.pickerTitle", { color: wadaColor.nameEn })}
							</Text>
						</View>
					)}

					{isEmpty ? (
						<View
							testID="s3-empty-state"
							accessibilityLiveRegion="polite"
							accessibilityLabel={`${t("armario.s3.emptyTitle")}. ${t("armario.s3.emptySubtitle")}`}
							className="flex-1 items-center justify-center"
							style={{ paddingHorizontal: 24 }}
						>
							<Text
								style={{
									fontFamily: "NotoSerifJP_500Medium",
									fontSize: 18,
									color: wadaTokens.textPrimary,
									textAlign: "center",
								}}
							>
								{t("armario.s3.emptyTitle")}
							</Text>
							<Text
								style={{
									fontFamily: "Inter_400Regular",
									fontSize: 14,
									color: wadaTokens.textSecondary,
									textAlign: "center",
									marginTop: 8,
								}}
							>
								{t("armario.s3.emptySubtitle")}
							</Text>
						</View>
					) : (
						<FlatList
							testID="s3-wardrobe-grid"
							data={items}
							keyExtractor={(item) => item.id}
							numColumns={GRID_COLUMNS}
							columnWrapperStyle={{ gap: GRID_GAP }}
							contentContainerStyle={{
								paddingHorizontal: GRID_H_PADDING,
								paddingTop: 16,
								paddingBottom: insets.bottom + 80,
								gap: GRID_GAP,
							}}
							renderItem={({ item }) => {
								const isConflict = conflictSet.has(item.id);
								const baseA11yLabel = t(
									isConflict
										? "armario.s3.itemA11yAssignedElsewhere"
										: "armario.s3.itemA11y",
									{ color: wadaColor.nameEn },
								);
								const tileA11yLabel = isEditMode
									? t("armario.s3.editMode.tileA11yInEditMode")
									: baseA11yLabel;
								const deleteA11yLabel = t(
									"armario.s3.editMode.deleteA11yLabel",
									{
										category: t(
											`unifiedCamera.categorySheet.${categoryLabelKey[item.category]}`,
										).toLowerCase(),
									},
								);
								return (
									<Pressable
										testID={`s3-item-${item.id}`}
										accessibilityRole="button"
										accessibilityLabel={tileA11yLabel}
										onPress={
											isEditMode ? undefined : () => commitAndDismiss(item.id)
										}
										onLongPress={handleLongPressTile}
										delayLongPress={450}
										style={{
											width: tileSize,
											height: tileSize,
											opacity: isConflict ? 0.5 : 1,
										}}
									>
										<WardrobeItemThumb
											uri={item.thumbnailPath}
											size={tileSize}
											testID={`s3-item-${item.id}-thumb`}
										/>
										{isConflict && (
											<View
												pointerEvents="none"
												style={{
													position: "absolute",
													left: 0,
													right: 0,
													bottom: 0,
													backgroundColor: "rgba(26,26,26,0.7)",
													paddingVertical: 4,
													alignItems: "center",
													borderBottomLeftRadius: 10,
													borderBottomRightRadius: 10,
												}}
											>
												<Text
													testID={`s3-item-${item.id}-assigned-elsewhere`}
													style={{
														fontFamily: "Inter_400Regular",
														fontSize: 11,
														color: "#ffffff",
													}}
												>
													{t("armario.s3.assignedElsewhere")}
												</Text>
											</View>
										)}
										{/* Story 14.12b: pencil icon sibling added here (top-right) */}
										{isEditMode && (
											<Animated.View
												style={[
													editBadgeAnimStyle,
													{
														position: "absolute",
														top: 4,
														left: 4,
														zIndex: 2,
													},
												]}
											>
												<Pressable
													testID={`armario-delete-${item.id}`}
													onPress={() => handleDeleteBadgePress(item)}
													hitSlop={10}
													accessibilityRole="button"
													accessibilityLabel={deleteA11yLabel}
													style={{
														width: 24,
														height: 24,
														borderRadius: 12,
														backgroundColor: wadaTokens.bgPaper,
														borderWidth: 1,
														borderColor: wadaTokens.textSecondary,
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<SymbolView
														name="minus"
														size={14}
														tintColor={wadaTokens.textPrimary}
														type="hierarchical"
														resizeMode="scaleAspectFit"
													/>
												</Pressable>
											</Animated.View>
										)}
									</Pressable>
								);
							}}
						/>
					)}

					<Pressable
						testID="s3-footer-new-photo"
						onPress={handleNewPhoto}
						accessibilityRole="button"
						accessibilityLabel={t("armario.s3.footerNewPhoto")}
						className="items-center justify-center"
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							paddingVertical: 14,
							paddingBottom: insets.bottom + 12,
							minHeight: 44,
							backgroundColor: wadaTokens.bgPaper,
							borderTopWidth: 1,
							borderTopColor: wadaTokens.hairline,
						}}
					>
						<Text
							style={{
								fontFamily: "Inter_500Medium",
								fontSize: 14,
								color: wadaTokens.textPrimary,
								textDecorationLine: "underline",
							}}
						>
							{t("armario.s3.footerNewPhoto")}
						</Text>
					</Pressable>
				</Animated.View>
			</GestureDetector>

			<Modal
				testID="s3-delete-confirm-sheet"
				transparent
				visible={pendingDelete !== null}
				animationType={reducedMotion ? "none" : "fade"}
				onRequestClose={handleDeleteCancel}
				statusBarTranslucent
			>
				<View
					className="flex-1 items-center justify-end"
					style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
				>
					<Pressable
						testID="s3-delete-confirm-scrim"
						accessibilityRole="button"
						accessibilityLabel={t("common.cancel")}
						onPress={handleDeleteCancel}
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
						{pendingDelete !== null && (
							<>
								<Text
									testID="s3-delete-confirm-title"
									style={{
										fontFamily: "NotoSerifJP_500Medium",
										fontSize: 18,
										color: wadaTokens.textPrimary,
										textAlign: "center",
										marginBottom: 8,
									}}
								>
									{t("armario.s3.deleteConfirmTitle")}
								</Text>
								<Text
									testID="s3-delete-confirm-body"
									style={{
										fontFamily: "Inter_400Regular",
										fontSize: 14,
										color: wadaTokens.textSecondary,
										textAlign: "center",
										lineHeight: 20,
									}}
								>
									{pendingDeleteAssignmentCount > 0
										? `${t("armario.s3.deleteConfirmBodyNoAssignments")} ${t(
												"armario.s3.deleteConfirmBodyWithAssignments",
												{ count: pendingDeleteAssignmentCount },
											)}`
										: t("armario.s3.deleteConfirmBodyNoAssignments")}
								</Text>
								<Pressable
									testID="s3-delete-confirm-yes"
									onPress={handleDeleteConfirm}
									accessibilityRole="button"
									accessibilityLabel={t("armario.s3.deleteConfirmYes")}
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
										{t("armario.s3.deleteConfirmYes")}
									</Text>
								</Pressable>
								<Pressable
									testID="s3-delete-confirm-cancel"
									onPress={handleDeleteCancel}
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
