import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Dimensions,
	Modal,
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";
import { wadaTokens } from "@/styles/theme";

export interface CategoryPickerSheetProps {
	visible: boolean;
	currentCategory?: WardrobeCategory;
	onConfirm: (category: WardrobeCategory) => void;
	onCancel: () => void;
	confirming?: boolean;
}

interface CategoryRow {
	key: WardrobeCategory;
	labelKey: string;
	icon: string;
}

const ROWS: CategoryRow[] = [
	{
		key: "top",
		labelKey: "unifiedCamera.categorySheet.rowTop",
		icon: "tshirt.fill",
	},
	{
		key: "bottom",
		labelKey: "unifiedCamera.categorySheet.rowBottom",
		icon: "figure.stand",
	},
	{
		key: "footwear",
		labelKey: "unifiedCamera.categorySheet.rowFootwear",
		icon: "shoe.fill",
	},
	{
		key: "accessory",
		labelKey: "unifiedCamera.categorySheet.rowAccessory",
		icon: "eyeglasses",
	},
];

const CREAM = "#faf7f2";
const DISABLED_DARK = "rgba(45,42,38,0.25)";
const SELECTED_TINT = "rgba(45,42,38,0.05)";
const HANDLE_COLOR = "#d4ccc0";
const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;

export function CategoryPickerSheet(props: CategoryPickerSheetProps) {
	const { visible, currentCategory, onConfirm, onCancel, confirming } = props;
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const [selected, setSelected] = useState<WardrobeCategory | null>(
		currentCategory ?? null,
	);

	// Re-sync selection when the sheet opens (fresh flow) or currentCategory
	// changes (14.12b reuse with a different pre-selected row).
	useEffect(() => {
		if (visible) {
			setSelected(currentCategory ?? null);
		}
	}, [visible, currentCategory]);

	function handleRowPress(category: WardrobeCategory) {
		hapticLight();
		setSelected(category);
	}

	function handleConfirmPress() {
		if (selected === null || confirming) return;
		hapticMedium();
		onConfirm(selected);
	}

	const confirmDisabled = selected === null || confirming === true;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			statusBarTranslucent
			onRequestClose={onCancel}
		>
			<View style={{ flex: 1, justifyContent: "flex-end" }}>
				<Pressable
					testID="category-picker-sheet-backdrop"
					accessibilityRole="button"
					accessibilityLabel={t("unifiedCamera.categorySheet.closeSheetA11y")}
					onPress={onCancel}
					disabled={confirming}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
					}}
				/>
				<View
					testID="category-picker-sheet"
					style={{
						backgroundColor: wadaTokens.bgPaper,
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						paddingBottom: insets.bottom + 16,
						maxHeight: MAX_SHEET_HEIGHT,
					}}
				>
					{/* Drag handle (decorative) */}
					<View
						accessibilityElementsHidden
						importantForAccessibility="no-hide-descendants"
						style={{
							alignSelf: "center",
							width: 36,
							height: 4,
							borderRadius: 2,
							backgroundColor: HANDLE_COLOR,
							marginTop: 8,
						}}
					/>

					<Text
						allowFontScaling
						accessibilityRole="header"
						testID="category-picker-sheet-title"
						style={{
							fontFamily: "NotoSerifJP_500Medium",
							fontSize: 22,
							color: wadaTokens.textPrimary,
							textAlign: "center",
							marginTop: 16,
						}}
					>
						{t("unifiedCamera.categorySheet.title")}
					</Text>

					<View style={{ marginTop: 16 }}>
						{ROWS.map((row, index) => {
							const isSelected = selected === row.key;
							return (
								<Pressable
									key={row.key}
									testID={`category-picker-row-${row.key}`}
									onPress={() => handleRowPress(row.key)}
									accessibilityRole="button"
									accessibilityLabel={t(row.labelKey)}
									accessibilityHint={t(
										"unifiedCamera.categorySheet.rowA11yHint",
									)}
									accessibilityState={{ selected: isSelected }}
									style={{
										height: 56,
										paddingHorizontal: 20,
										flexDirection: "row",
										alignItems: "center",
										gap: 12,
										backgroundColor: isSelected ? SELECTED_TINT : "transparent",
									}}
								>
									{isSelected ? (
										<View
											accessibilityElementsHidden
											importantForAccessibility="no-hide-descendants"
											style={{
												position: "absolute",
												left: 0,
												top: 0,
												width: 1.5,
												height: 56,
												backgroundColor: wadaTokens.textPrimary,
											}}
										/>
									) : null}
									<SymbolView
										name={row.icon as never}
										size={24}
										tintColor={wadaTokens.textPrimary}
										style={{ width: 24, height: 24 }}
									/>
									<Text
										allowFontScaling
										style={{
											flex: 1,
											fontFamily: "Inter_500Medium",
											fontSize: 16,
											color: wadaTokens.textPrimary,
										}}
									>
										{t(row.labelKey)}
									</Text>
									{isSelected ? (
										<SymbolView
											testID={`category-picker-row-${row.key}-check`}
											name="checkmark.circle.fill"
											size={22}
											tintColor={wadaTokens.textPrimary}
											style={{ width: 22, height: 22 }}
										/>
									) : null}
									{index < ROWS.length - 1 ? (
										<View
											accessibilityElementsHidden
											importantForAccessibility="no-hide-descendants"
											style={{
												position: "absolute",
												left: 20,
												right: 20,
												bottom: 0,
												height: 1,
												backgroundColor: wadaTokens.hairline,
											}}
										/>
									) : null}
								</Pressable>
							);
						})}
					</View>

					<View style={{ paddingHorizontal: 12, marginTop: 16 }}>
						<Pressable
							testID="category-picker-sheet-confirm"
							onPress={handleConfirmPress}
							disabled={confirmDisabled}
							accessibilityRole="button"
							accessibilityLabel={t(
								"unifiedCamera.categorySheet.confirmA11yLabel",
							)}
							accessibilityState={{
								disabled: confirmDisabled,
								busy: confirming === true,
							}}
							style={{
								height: 48,
								borderRadius: 14,
								backgroundColor:
									selected === null ? DISABLED_DARK : wadaTokens.textPrimary,
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{confirming ? (
								<ActivityIndicator
									testID="category-picker-sheet-confirm-spinner"
									size="small"
									color={CREAM}
								/>
							) : (
								<Text
									allowFontScaling
									style={{
										fontFamily: "Inter_500Medium",
										fontSize: 16,
										color: CREAM,
									}}
								>
									{t("unifiedCamera.categorySheet.confirm")}
								</Text>
							)}
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}
