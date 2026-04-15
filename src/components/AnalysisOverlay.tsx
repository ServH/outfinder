import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, {
	cancelAnimation,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { WarmBackground } from "./WarmBackground";

export interface AnalysisOverlayProps {
	visible: boolean;
}

export function AnalysisOverlay({ visible }: AnalysisOverlayProps) {
	const { t } = useTranslation();
	const reducedMotion = useReducedMotion();
	const [msgIndex, setMsgIndex] = useState(0);
	const opacity = useSharedValue(1);

	const messages = useMemo(
		() => [
			t("colorCapture.analyzing0"),
			t("colorCapture.analyzing1"),
			t("colorCapture.analyzing2"),
			t("colorCapture.analyzing3"),
		],
		[t],
	);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const msgCount = messages.length;

	// Detect rising edge of `visible` via a ref so the reset/announce only fires
	// on actual false→true transitions (not on every re-render where `messages`
	// identity changes — i18n's `t` is not always referentially stable).
	const wasVisible = useRef(false);
	useEffect(() => {
		if (visible && !wasVisible.current) {
			setMsgIndex(0);
			opacity.value = 1;
			// Announce only the first message — the rotating copy is decorative,
			// we don't want to spam VoiceOver every 600ms.
			AccessibilityInfo.announceForAccessibility(messages[0]);
		}
		wasVisible.current = visible;
	}, [visible, messages, opacity]);

	useEffect(() => {
		if (!visible) return;

		const interval = setInterval(() => {
			if (reducedMotion) {
				setMsgIndex((i) => (i + 1) % msgCount);
			} else {
				opacity.value = withTiming(0, { duration: 200 }, () => {
					runOnJS(setMsgIndex)((i: number) => (i + 1) % msgCount);
					opacity.value = withTiming(1, { duration: 200 });
				});
			}
		}, 600);

		return () => {
			clearInterval(interval);
			cancelAnimation(opacity);
		};
	}, [visible, reducedMotion, msgCount, opacity]);

	if (!visible) return null;

	// Defensive clamp: msgCount could change at runtime if i18n keys are
	// added/removed and the interval hasn't ticked yet.
	const safeMessage = messages[msgIndex % msgCount];

	return (
		<View style={StyleSheet.absoluteFill} testID="analysis-overlay">
			{/* Warm backdrop at 90% opacity */}
			<View style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}>
				<WarmBackground />
			</View>

			{/* Centered message */}
			<View
				className="flex-1 items-center justify-center px-8"
				testID="analysis-message-container"
			>
				<Animated.Text
					style={[styles.message, animatedStyle]}
					testID="analysis-message"
				>
					{safeMessage}
				</Animated.Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	message: {
		fontFamily: "NotoSerifJP_400Regular",
		fontStyle: "italic",
		fontSize: 18,
		color: "#FFFFFF",
		textAlign: "center",
	},
});
