import { View } from "react-native";
import type { GarmentType } from "@/components/garments/index";
import { TintedGarment } from "@/components/TintedGarment";

type Props = Record<string, never>;

const CARD_WIDTH = 160;
const GARMENT_WIDTH = CARD_WIDTH - 28;

const CURATED_OUTFIT: {
	garmentType: GarmentType;
	hex: string;
	height: number;
	marginTop: number;
}[] = [
	{ garmentType: "top-tshirt", hex: "#E34234", height: 80, marginTop: 0 },
	{ garmentType: "bottom-pants", hex: "#8B6914", height: 100, marginTop: 4 },
	{
		garmentType: "shoes-sneakers",
		hex: "#E8D8C4",
		height: 60,
		marginTop: -14,
	},
];

export function OutfitPreview(_props: Props) {
	return (
		<View
			accessibilityElementsHidden
			testID="outfit-preview"
			style={{
				width: CARD_WIDTH,
				backgroundColor: "#fafaf8",
				borderRadius: 12,
				padding: 14,
				alignItems: "center",
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 8 },
				shadowOpacity: 0.08,
				shadowRadius: 20,
			}}
		>
			{CURATED_OUTFIT.map((item) => (
				<View
					key={item.garmentType}
					testID={`outfit-garment-${item.garmentType}`}
					style={{
						marginTop: item.marginTop,
						alignItems: "center",
						width: GARMENT_WIDTH,
						height: item.height,
					}}
				>
					<TintedGarment
						garmentType={item.garmentType}
						colorHex={item.hex}
						width={GARMENT_WIDTH}
						height={item.height}
					/>
				</View>
			))}
		</View>
	);
}
