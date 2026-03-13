import { useState } from "react";
import {
	Image,
	type ImageSourcePropType,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";

const GARMENTS: {
	key: string;
	label: string;
	source: ImageSourcePropType;
}[] = [
	{
		key: "TopTShirt",
		label: "T-Shirt",
		source: require("@/assets/garments/top-tshirt.png"),
	},
	{
		key: "TopShirt",
		label: "Shirt",
		source: require("@/assets/garments/top-shirt.png"),
	},
	{
		key: "BottomPants",
		label: "Pants",
		source: require("@/assets/garments/bottom-pants.png"),
	},
	{
		key: "BottomSkirt",
		label: "Skirt",
		source: require("@/assets/garments/bottom-skirt.png"),
	},
	{
		key: "LayerJacket",
		label: "Jacket",
		source: require("@/assets/garments/layer-jacket.png"),
	},
	{
		key: "LayerHoodie",
		label: "Hoodie",
		source: require("@/assets/garments/layer-hoodie.png"),
	},
	{
		key: "ShoesSneakers",
		label: "Sneakers",
		source: require("@/assets/garments/shoes-sneakers.png"),
	},
	{
		key: "ShoesFormal",
		label: "Formal Shoes",
		source: require("@/assets/garments/shoes-formal.png"),
	},
];

const SAMPLE_COLORS = [
	{ hex: "#F5E6CC", name: "Eggshell" },
	{ hex: "#C75B3B", name: "Burnt Sienna" },
	{ hex: "#2B4560", name: "Indigo" },
	{ hex: "#5A7247", name: "Sage Green" },
	{ hex: "#8B5E3C", name: "Camel" },
	{ hex: "#2B2B2B", name: "Lamp Black" },
];

export function GarmentProposal() {
	const [selectedColorIndex, setSelectedColorIndex] = useState(2);
	const currentColor = SAMPLE_COLORS[selectedColorIndex];

	return (
		<ScrollView
			className="flex-1 bg-paper"
			contentContainerClassName="p-4 pb-12"
			accessibilityLabel="Garment proposal wall — all 8 garment types"
		>
			<Text className="font-serif-jp text-lg text-primary mb-1">
				Garment Silhouette Proposal
			</Text>
			<Text className="text-sm text-secondary mb-4">
				All 8 garment types with PNG tintColor — tap colors to evaluate
			</Text>

			{/* Color selector */}
			<View className="flex-row mb-5 gap-2 flex-wrap">
				{SAMPLE_COLORS.map((color, index) => (
					<Pressable
						key={color.hex}
						onPress={() => setSelectedColorIndex(index)}
						accessibilityLabel={`Select ${color.name}`}
						accessibilityRole="button"
						accessibilityState={{ selected: index === selectedColorIndex }}
					>
						<View
							style={{
								backgroundColor: color.hex,
								width: 44,
								height: 44,
								borderRadius: 22,
								borderWidth: index === selectedColorIndex ? 3 : 1,
								borderColor:
									index === selectedColorIndex ? "#1a1a1a" : "rgba(0,0,0,0.15)",
							}}
						/>
					</Pressable>
				))}
			</View>

			<Text className="text-xs text-tertiary mb-4">
				Showing: {currentColor.name} ({currentColor.hex})
			</Text>

			{/* Garment grid — 2 columns */}
			<View className="flex-row flex-wrap" style={{ gap: 12 }}>
				{GARMENTS.map((garment) => (
					<View
						key={garment.key}
						style={{ width: "48%" }}
						accessibilityLabel={`${garment.label} silhouette in ${currentColor.name}`}
					>
						<View
							className="bg-elevated rounded-xl items-center justify-center"
							style={{ padding: 16, aspectRatio: 0.85 }}
						>
							<Image
								source={garment.source}
								style={{
									width: "80%",
									height: "80%",
									tintColor: currentColor.hex,
								}}
								resizeMode="contain"
							/>
						</View>
						<Text className="text-xs text-primary text-center mt-2 mb-3">
							{garment.label}
						</Text>
						<Text className="text-xs text-tertiary text-center -mt-2 mb-2">
							{garment.key}
						</Text>
					</View>
				))}
			</View>

			{/* Evaluation section */}
			<View className="bg-surface rounded-xl p-4 mt-4">
				<Text className="text-sm font-medium text-primary mb-2">
					Evaluation Checklist
				</Text>
				<Text className="text-xs text-secondary leading-5">
					{`☐ Silhouette proportions feel balanced across all 8 types
☐ Visual weight is consistent (no type dominates or disappears)
☐ Pale colors: silhouettes visible on light backgrounds
☐ Dark colors: detail visible with dark fills
☐ Style is cohesive — all garments look like they belong together
☐ Shoes read clearly at small sizes
☐ Layer garments (jacket, hoodie) are distinguishable from tops`}
				</Text>
			</View>
		</ScrollView>
	);
}
