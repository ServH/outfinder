import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CompletenessBadge } from "@/components/armario/CompletenessBadge";
import { WardrobeItemThumb } from "@/components/armario/WardrobeItemThumb";
import { getCombination } from "@/data/colorIndex";
import { hexToRgba } from "@/lib/color";
import { hapticLight } from "@/lib/haptics";
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
	onOpenPicker?: (args: { combinationId: string; colorIndex: number }) => void;
	onViewLook?: (args: { combinationId: string }) => void;
}

const defaultOpenPicker: NonNullable<
	ArmarioFichaWadaScreenProps["onOpenPicker"]
> = () => {
	if (__DEV__) {
		console.warn(
			"[ArmarioFichaWadaScreen] S3 Armario Picker — not implemented until Story 13.4b",
		);
	}
};

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
	onOpenPicker,
	onViewLook,
}: ArmarioFichaWadaScreenProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioFichaWadaNav>();
	const route = useRoute<ArmarioFichaWadaRoute>();
	const { combinationId } = route.params;

	const combination = useMemo(
		() => getCombination(combinationId),
		[combinationId],
	);
	const allAssignments = useWardrobeStore((s) => s.assignments);
	const items = useWardrobeStore((s) => s.items);

	const assignments = useMemo(
		() => allAssignments.filter((a) => a.combinationId === combinationId),
		[allAssignments, combinationId],
	);
	const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
	const assignedCount = assignments.length;
	const totalColors = combination?.colors.length ?? 0;
	const isComplete = assignedCount === totalColors && totalColors > 0;

	if (!combination || combination.colors.length === 0) {
		return null;
	}

	function handleBack() {
		hapticLight();
		navigation.goBack();
	}

	function handleSlotTap(colorIndex: number) {
		hapticLight();
		const handler = onOpenPicker ?? defaultOpenPicker;
		handler({ combinationId, colorIndex });
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
					accessibilityLabel={t("armario.capture.goBack")}
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
								<View
									style={{
										backgroundColor: color.hex,
										aspectRatio: 1.25,
										borderRadius: 14,
									}}
								/>
								<View style={{ marginTop: 10, aspectRatio: 1 }}>
									{isAssigned ? (
										<WardrobeItemThumb
											uri={assignedThumb}
											size={96}
											testID={`s2-slot-${i}-thumb`}
											accessibilityLabel={color.nameEn}
										/>
									) : (
										<View
											testID={`s2-slot-${i}-empty`}
											className="items-center justify-center"
											style={{
												borderRadius: 14,
												borderWidth: 2,
												borderStyle: "dashed",
												borderColor: color.hex,
												backgroundColor: hexToRgba(color.hex, 0.08),
												width: "100%",
												height: "100%",
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
								<Text
									numberOfLines={1}
									ellipsizeMode="tail"
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
										color: wadaTokens.textSecondary,
										marginTop: 2,
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
				disabled={assignedCount === 0}
				accessibilityRole="button"
				accessibilityLabel={t("armario.s2.viewLookCta")}
				accessibilityState={{ disabled: assignedCount === 0 }}
				className="absolute self-center items-center justify-center"
				style={{
					bottom: 28,
					minHeight: 44,
					minWidth: 44,
					paddingHorizontal: 24,
					paddingVertical: 14,
					borderRadius: 28,
					backgroundColor: wadaTokens.textPrimary,
					opacity: assignedCount === 0 ? 0.5 : 1,
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
	);
}
