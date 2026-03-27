import { Text, View } from "react-native";

type Props = Record<string, never>;

const CURATED_PALETTE = [
	{ hex: "#E8D8C4", nameEn: "Unbleached Silk" },
	{ hex: "#8B6914", nameEn: "Raw Umber" },
	{ hex: "#E34234", nameEn: "Vermillion" },
];

export function PalettePreview(_props: Props) {
	return (
		<View
			accessibilityElementsHidden
			testID="palette-preview"
			className="items-center"
		>
			<View
				className="flex-row overflow-hidden"
				style={{ width: 220, height: 64, borderRadius: 12 }}
			>
				{CURATED_PALETTE.map((color) => (
					<View
						key={color.hex}
						testID={`palette-segment-${color.hex}`}
						style={{ flex: 1, backgroundColor: color.hex }}
					/>
				))}
			</View>
			<View className="mt-2 flex-row" style={{ width: 220 }}>
				{CURATED_PALETTE.map((color) => (
					<View key={color.hex} className="flex-1 items-center">
						<Text className="font-sans text-[9px] text-tertiary">
							{color.nameEn}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
