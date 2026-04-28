import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";
import ReanimatedAnimated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { wadaTokens } from "@/styles/theme";

// Generic coach-mark overlay introduced in Story 15.1. Single-step by design;
// multi-step flows compose two overlays sequentially in their own state.
// Consumers fire haptics themselves on dismiss if desired (Outfinder rule:
// haptics only via lib/haptics.ts, never inside foundational components).
export interface CoachMarkOverlayProps {
	visible: boolean;
	text: string;
	onDismiss: () => void;
	testID?: string;
	accessibilityAnnouncement?: string;
	dismissLabel?: string;
}

const ENTRY_DURATION_OPACITY_MS = 260;
const ENTRY_DURATION_TRANSLATE_MS = 280;

export function CoachMarkOverlay({
	visible,
	text,
	onDismiss,
	testID = "coach-mark-overlay",
	accessibilityAnnouncement,
	dismissLabel,
}: CoachMarkOverlayProps) {
	const { t } = useTranslation();
	const reducedMotion = useReducedMotion();
	const announcedRef = useRef(false);

	const opacity = useSharedValue(reducedMotion ? 1 : 0);
	const translateY = useSharedValue(reducedMotion ? 0 : 20);

	const cardStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	useEffect(() => {
		if (!visible) {
			announcedRef.current = false;
			return;
		}

		if (reducedMotion) {
			opacity.value = 1;
			translateY.value = 0;
		} else {
			opacity.value = withTiming(1, { duration: ENTRY_DURATION_OPACITY_MS });
			translateY.value = withTiming(0, {
				duration: ENTRY_DURATION_TRANSLATE_MS,
			});
		}

		if (!announcedRef.current) {
			announcedRef.current = true;
			AccessibilityInfo.announceForAccessibility(
				accessibilityAnnouncement ?? text,
			);
		}
	}, [
		visible,
		reducedMotion,
		opacity,
		translateY,
		accessibilityAnnouncement,
		text,
	]);

	if (!visible) {
		return null;
	}

	const resolvedDismissLabel = dismissLabel ?? t("common.coachMark.gotIt");

	return (
		<View
			className="absolute inset-0 items-center justify-center"
			style={{ zIndex: 999, backgroundColor: "rgba(0,0,0,0.5)" }}
			accessibilityRole="alert"
			testID={testID}
		>
			<ReanimatedAnimated.View
				style={[
					{
						borderRadius: 16,
						paddingHorizontal: 28,
						paddingVertical: 28,
						marginHorizontal: 40,
						maxWidth: 320,
						alignItems: "center",
						backgroundColor: wadaTokens.bgPaper,
					},
					cardStyle,
				]}
			>
				<Text
					testID={`${testID}-text`}
					className="mb-5 text-center text-base"
					style={{
						fontFamily: "NotoSerifJP_400Regular",
						color: wadaTokens.textPrimary,
					}}
				>
					{text}
				</Text>
				<Pressable
					onPress={onDismiss}
					accessibilityRole="button"
					accessibilityLabel={resolvedDismissLabel}
					testID={`${testID}-dismiss`}
					className="min-w-[44px] min-h-[44px] items-center justify-center rounded-lg px-8 py-3"
					style={{ backgroundColor: wadaTokens.textPrimary }}
				>
					<Text
						className="text-sm"
						style={{
							fontFamily: "Inter_500Medium",
							color: wadaTokens.bgPaper,
						}}
					>
						{resolvedDismissLabel}
					</Text>
				</Pressable>
			</ReanimatedAnimated.View>
		</View>
	);
}
