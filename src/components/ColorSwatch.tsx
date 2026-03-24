import { Pressable } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import type { Color } from "@/data/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { isLightColor } from "@/lib/color";

export interface ColorSwatchProps {
	color: Color;
	onPress: (color: Color) => void;
}

export function ColorSwatch({ color, onPress }: ColorSwatchProps) {
	const scale = useSharedValue(1);
	const reducedMotion = useReducedMotion();

	function handlePressIn() {
		if (!reducedMotion) {
			scale.value = withSpring(1.05, { damping: 15, stiffness: 150 });
		}
	}

	function handlePressOut() {
		if (!reducedMotion) {
			scale.value = withSpring(1, { damping: 15, stiffness: 150 });
		}
	}

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const needsBorder = isLightColor(color.hex);

	return (
		<Pressable
			testID={`color-swatch-${color.id}`}
			accessibilityRole="button"
			accessibilityLabel={`${color.nameEn}, ${color.combinationCount} combinations`}
			onPress={() => onPress(color)}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			className="flex-1"
		>
			<Animated.View
				className={`aspect-square rounded ${needsBorder ? "border border-hairline" : ""}`}
				style={[{ backgroundColor: color.hex }, animatedStyle]}
			/>
		</Pressable>
	);
}
