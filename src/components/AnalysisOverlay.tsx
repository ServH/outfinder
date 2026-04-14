import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, {
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

	const messages = [
		t("colorCapture.analyzing0"),
		t("colorCapture.analyzing1"),
		t("colorCapture.analyzing2"),
		t("colorCapture.analyzing3"),
	];

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const msgCount = messages.length;

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

		return () => clearInterval(interval);
	}, [visible, reducedMotion, msgCount, opacity]);

	if (!visible) return null;

	return (
		<View style={StyleSheet.absoluteFill} testID="analysis-overlay">
			{/* Warm backdrop at 90% opacity */}
			<View style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}>
				<WarmBackground />
			</View>

			{/* Centered message */}
			<View
				style={styles.center}
				accessibilityLiveRegion="polite"
				testID="analysis-message-container"
			>
				<Animated.Text
					style={[styles.message, animatedStyle]}
					testID="analysis-message"
				>
					{messages[msgIndex]}
				</Animated.Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	message: {
		fontFamily: "NotoSerifJP_400Regular",
		fontStyle: "italic",
		fontSize: 18,
		color: "#FFFFFF",
		textAlign: "center",
	},
});
