import {
	type NavigationProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import { deleteItemFiles } from "@/lib/armario/wardrobeFiles";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import {
	assign,
	cascadeDeleteAssignmentsForItem,
	removeItem,
	unassign,
} from "@/lib/wardrobeRepo";
import type { WardrobeItem } from "@/lib/wardrobeTypes";
import type {
	FavoritesStackParamList,
	RootStackParamList,
} from "@/navigation/types";
import { useWardrobeStore } from "@/stores/wardrobeStore";
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

	const items = useWardrobeStore((s) => s.items);
	const assignments = useWardrobeStore((s) => s.assignments);

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
	const isClosing = useRef(false);

	const [pendingDelete, setPendingDelete] = useState<WardrobeItem | null>(null);
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

	const handleLongPressItem = useCallback((item: WardrobeItem) => {
		hapticMedium();
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
								const a11yLabel = t(
									isConflict
										? "armario.s3.itemA11yAssignedElsewhere"
										: "armario.s3.itemA11y",
									{ color: wadaColor.nameEn },
								);
								return (
									<Pressable
										testID={`s3-item-${item.id}`}
										accessibilityRole="button"
										accessibilityLabel={a11yLabel}
										onPress={() => commitAndDismiss(item.id)}
										onLongPress={() => handleLongPressItem(item)}
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
