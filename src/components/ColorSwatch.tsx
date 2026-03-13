import { Pressable } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import type { Color } from "@/data/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface ColorSwatchProps {
	color: Color;
	onPress: (color: Color) => void;
}

function isLightColor(hex: string): boolean {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	const luminance = (r * 299 + g * 587 + b * 114) / 1000;
	return luminance > 224;
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
		>
			<Animated.View
				className={`h-[62px] w-[62px] rounded ${needsBorder ? "border border-hairline" : ""}`}
				style={[{ backgroundColor: color.hex }, animatedStyle]}
			/>
		</Pressable>
	);
}
