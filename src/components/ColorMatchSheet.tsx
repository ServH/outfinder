import { SymbolView } from "expo-symbols";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isLightColor } from "@/lib/color";
import type { WadaMatch } from "@/lib/colorTypes";
import { hapticLight } from "@/lib/haptics";

export interface ColorMatchSheetProps {
	visible: boolean;
	matches: WadaMatch[];
	capturedHex: string;
	onSelect: (colorId: string) => void;
	onDismiss: () => void;
}

export function ColorMatchSheet({
	visible,
	matches,
	capturedHex: _capturedHex,
	onSelect,
	onDismiss,
}: ColorMatchSheetProps) {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const selectGuard = useRef(false);

	function handleSelect(colorId: string) {
		if (selectGuard.current) return;
		selectGuard.current = true;
		hapticLight();
		onSelect(colorId);
	}

	function getDeltaEBadge(
		deltaE: number,
	): { label: string; bgColor: string; textColor: string } | null {
		if (deltaE <= 3.0) {
			return {
				label: t("colorCapture.matchExcellent"),
				bgColor: "#E8F5EE",
				textColor: "#4A7C59",
			};
		}
		if (deltaE <= 8.0) {
			return {
				label: t("colorCapture.matchGood"),
				bgColor: "#F3F4F6",
				textColor: "#4B5563",
			};
		}
		return null;
	}

	return (
		<Modal
			animationType="slide"
			transparent
			visible={visible}
			onRequestClose={onDismiss}
			testID="color-match-sheet-modal"
		>
			{/* Backdrop */}
			<Pressable
				className="flex-1 bg-black/40"
				onPress={onDismiss}
				accessibilityLabel={t("common.dismiss")}
				testID="color-match-backdrop"
			/>
			{/* Sheet */}
			<View
				className="absolute bottom-0 w-full bg-white rounded-t-3xl"
				style={{ paddingBottom: insets.bottom + 16 }}
				accessibilityViewIsModal
				testID="color-match-sheet"
			>
				{/* Handle bar */}
				<View
					className="self-center mt-3 mb-4"
					style={{
						width: 32,
						height: 4,
						borderRadius: 2,
						backgroundColor: "#D1D5DB",
					}}
					accessibilityElementsHidden
				/>
				{/* Header */}
				<Text className="font-serif-jp text-[18px] text-center px-6 pb-4">
					{t("colorCapture.matchSheetTitle")}
				</Text>
				{/* Match rows */}
				{matches.map((match) => {
					const badge = getDeltaEBadge(match.deltaE);
					const swatchBorderStyle = isLightColor(match.color.hex)
						? { borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" }
						: {};
					return (
						<Pressable
							key={match.color.id}
							onPress={() => handleSelect(match.color.id)}
							accessibilityRole="button"
							accessibilityLabel={`${match.color.nameEn}, ΔE ${match.deltaE.toFixed(1)}, select`}
							testID={`match-row-${match.color.id}`}
						>
							{({ pressed }) => (
								<View
									className="flex-row items-center px-6 gap-4"
									style={{ minHeight: 56, opacity: pressed ? 0.85 : 1 }}
								>
									<View
										style={{
											width: 40,
											height: 40,
											borderRadius: 8,
											backgroundColor: match.color.hex,
											...swatchBorderStyle,
										}}
									/>
									<Text className="font-serif-jp text-[16px] flex-1">
										{match.color.nameEn}
									</Text>
									{badge !== null && (
										<View
											className="px-2 rounded-full"
											style={{
												paddingVertical: 2,
												backgroundColor: badge.bgColor,
											}}
										>
											<Text style={{ fontSize: 12, color: badge.textColor }}>
												{badge.label}
											</Text>
										</View>
									)}
									<SymbolView
										name="chevron.right"
										size={16}
										tintColor="#9CA3AF"
									/>
								</View>
							)}
						</Pressable>
					);
				})}
			</View>
		</Modal>
	);
}
