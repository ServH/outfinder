import { Canvas, Fill, RadialGradient, vec } from "@shopify/react-native-skia";

/** Vertical offset to center aureola behind the outfit card, accounting for WadaHeader height */
const AUREOLA_TOP_OFFSET = 40;

export interface AureolaProps {
	hex: string;
	width: number;
	height: number;
}

export function Aureola({ hex, width, height }: AureolaProps) {
	return (
		<Canvas
			style={{
				width,
				height,
				position: "absolute",
				top: AUREOLA_TOP_OFFSET,
				alignSelf: "center",
			}}
			accessibilityLabel="Color aureola"
		>
			<Fill>
				<RadialGradient
					c={vec(width / 2, height / 2)}
					r={width * 0.5}
					colors={[`${hex}40`, `${hex}1a`, "transparent"]}
				/>
			</Fill>
		</Canvas>
	);
}
