import { View } from "react-native";
import colors from "@/data/colors.json";

type Props = Record<string, never>;

const GRID_COLORS = colors.slice(0, 15);
const SWATCH_SIZE = 28;
const GAP = 4;

export function SwatchGridPreview(_props: Props) {
	return (
		<View
			accessibilityElementsHidden
			testID="swatch-grid-preview"
			style={{ maxWidth: 180, alignSelf: "center" }}
		>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
				{GRID_COLORS.map((color) => (
					<View
						key={color.id}
						testID={`swatch-grid-item-${color.id}`}
						style={{
							width: SWATCH_SIZE,
							height: SWATCH_SIZE,
							backgroundColor: color.hex,
							borderRadius: 2,
						}}
					/>
				))}
			</View>
		</View>
	);
}
