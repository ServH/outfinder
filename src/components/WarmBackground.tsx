import { Canvas, Fill, RadialGradient, vec } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";

export function WarmBackground() {
	const { width: screenW } = useWindowDimensions();
	return (
		<Canvas
			style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
			accessibilityLabel="Warm background"
		>
			<Fill color="#f0ece4" />
			<Fill>
				<RadialGradient
					c={vec(screenW / 2, 100)}
					r={screenW * 0.8}
					colors={["#f5efe6", "#f0ece4", "#ebe5da"]}
				/>
			</Fill>
		</Canvas>
	);
}
