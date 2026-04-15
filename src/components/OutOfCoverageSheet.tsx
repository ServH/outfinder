import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isLightColor } from "@/lib/color";
import type { WadaMatch } from "@/lib/colorTypes";
import { hapticLight, hapticMedium } from "@/lib/haptics";

export interface OutOfCoverageSheetProps {
	visible: boolean;
	bestMatch: WadaMatch | undefined;
	capturedHex: string;
	onSelect: (colorId: string) => void;
	onTryAgain: () => void;
	onDismiss: () => void;
}

export function OutOfCoverageSheet({
	visible,
	bestMatch,
	capturedHex: _capturedHex,
	onSelect,
	onTryAgain,
	onDismiss,
}: OutOfCoverageSheetProps) {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();

	function handleCTA() {
		if (!bestMatch) return;
		hapticMedium();
		onSelect(bestMatch.color.id);
	}

	function handleTryAgain() {
		hapticLight();
		onTryAgain();
	}

	const swatchBorderStyle =
		bestMatch && isLightColor(bestMatch.color.hex)
			? { borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" }
			: {};

	return (
		<Modal
			animationType="slide"
			transparent
			visible={visible}
			onRequestClose={onDismiss}
			testID="out-of-coverage-sheet-modal"
		>
			{/* Backdrop */}
			<Pressable
				className="flex-1 bg-black/40"
				onPress={onDismiss}
				accessibilityLabel={t("common.dismiss")}
				testID="out-of-coverage-backdrop"
			/>
			{/* Sheet */}
			<View
				className="absolute bottom-0 w-full bg-white rounded-t-3xl px-6 pt-4"
				style={{ paddingBottom: insets.bottom + 16 }}
				accessibilityViewIsModal
				testID="out-of-coverage-sheet"
			>
				{/* Handle bar */}
				<View
					className="self-center mb-4"
					style={{
						width: 32,
						height: 4,
						borderRadius: 2,
						backgroundColor: "#D1D5DB",
					}}
					accessibilityElementsHidden
				/>
				{/* Education copy */}
				<Text
					className="font-serif-jp text-[15px] text-center opacity-80"
					style={{ lineHeight: 22 }}
					testID="out-of-coverage-message"
				>
					{t("colorCapture.outOfCoverageMessage")}
				</Text>
				{/* Best match row */}
				<View
					className="flex-row items-center gap-4 mt-6"
					testID="best-match-row"
				>
					<View
						style={{
							width: 40,
							height: 40,
							borderRadius: 8,
							backgroundColor: bestMatch?.color.hex,
							...swatchBorderStyle,
						}}
						testID="best-match-swatch"
					/>
					<Text className="font-serif-jp text-[16px]" testID="best-match-name">
						{bestMatch?.color.nameEn}
					</Text>
				</View>
				{/* Primary CTA */}
				<Pressable
					onPress={handleCTA}
					accessibilityRole="button"
					accessibilityLabel={t("colorCapture.outOfCoverageAction", {
						name: bestMatch?.color.nameEn ?? "",
					})}
					className="mt-6 rounded-2xl overflow-hidden"
					style={{ height: 52 }}
					testID="out-of-coverage-cta"
				>
					{({ pressed }) => (
						<View
							className="flex-1 items-center justify-center"
							style={{
								backgroundColor: "#5C3A1E",
								opacity: pressed ? 0.85 : 1,
							}}
						>
							<Text
								className="font-serif-jp text-[17px]"
								style={{ color: "white" }}
							>
								{t("colorCapture.outOfCoverageAction", {
									name: bestMatch?.color.nameEn ?? "",
								})}
							</Text>
						</View>
					)}
				</Pressable>
				{/* Try again link */}
				<Pressable
					onPress={handleTryAgain}
					accessibilityRole="button"
					accessibilityLabel={t("colorCapture.tryAgain")}
					className="mt-3 pb-2 items-center justify-center min-h-[44px]"
					testID="try-again-button"
				>
					<Text className="font-sans text-[14px] text-center">
						{t("colorCapture.tryAgain")}
					</Text>
				</Pressable>
			</View>
		</Modal>
	);
}
