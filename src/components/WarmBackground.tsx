import { Canvas, Fill, RadialGradient, vec } from "@shopify/react-native-skia";
import { Dimensions } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

export function WarmBackground() {
	return (
		<Canvas
			style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
			accessibilityLabel="Warm background"
		>
			<Fill color="#f0ece4" />
			<Fill>
				<RadialGradient
					c={vec(SCREEN_W / 2, 100)}
					r={SCREEN_W * 0.8}
					colors={["#f5efe6", "#f0ece4", "#ebe5da"]}
				/>
			</Fill>
		</Canvas>
	);
}
