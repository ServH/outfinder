import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

// Sample Wada colors: pale, dark, vivid, muted
const TEST_COLORS = [
	{ hex: "#F5E6CC", name: "Eggshell (pale)" },
	{ hex: "#2B2B2B", name: "Lamp Black (dark)" },
	{ hex: "#E2553D", name: "Vermilion (vivid)" },
	{ hex: "#5B7E91", name: "Steel Blue (muted)" },
];

const tshirtPng = require("@/assets/garments/top-tshirt.png");

export function GarmentPoC() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const currentColor = TEST_COLORS[selectedIndex];

	return (
		<ScrollView
			className="flex-1 bg-paper"
			contentContainerClassName="p-4"
			accessibilityLabel="Garment rendering proof of concept"
		>
			<Text className="font-serif-jp text-lg text-primary mb-2">
				Rendering PoC: PNG + tintColor (Approved)
			</Text>
			<Text className="text-sm text-secondary mb-4">
				Validated approach — PNG silhouettes with React Native tintColor
			</Text>

			{/* Color selector */}
			<View className="flex-row mb-6 gap-3">
				{TEST_COLORS.map((color, index) => (
					<Pressable
						key={color.hex}
						onPress={() => setSelectedIndex(index)}
						accessibilityLabel={`Select ${color.name}`}
						accessibilityRole="button"
						accessibilityState={{ selected: index === selectedIndex }}
						className="items-center"
					>
						<View
							style={{
								backgroundColor: color.hex,
								width: 48,
								height: 48,
								borderRadius: 24,
								borderWidth: index === selectedIndex ? 3 : 1,
								borderColor:
									index === selectedIndex ? "#1a1a1a" : "rgba(0,0,0,0.15)",
							}}
						/>
						<Text
							className="text-xs text-secondary mt-1"
							style={{ maxWidth: 60, textAlign: "center" }}
						>
							{color.name}
						</Text>
					</Pressable>
				))}
			</View>

			{/* PNG with tintColor demo */}
			<View className="items-center mb-6">
				<View
					className="bg-elevated rounded-xl p-4 items-center justify-center"
					style={{ width: "70%", aspectRatio: 0.8 }}
				>
					<Image
						source={tshirtPng}
						style={{
							width: 140,
							height: 175,
							tintColor: currentColor.hex,
						}}
						resizeMode="contain"
						accessibilityLabel={`T-shirt in ${currentColor.name}`}
					/>
				</View>
			</View>

			{/* Color info */}
			<View className="bg-surface rounded-xl p-4 mb-6">
				<Text className="text-sm font-medium text-primary mb-2">
					Current Color: {currentColor.name}
				</Text>
				<Text className="text-xs text-secondary">{currentColor.hex}</Text>
			</View>

			{/* Decision record */}
			<View className="bg-surface rounded-xl p-4">
				<Text className="text-sm font-medium text-primary mb-3">
					Decision: PNG + tintColor
				</Text>
				<Text className="text-xs text-secondary leading-5">
					{`Approach chosen by product owner after visual comparison.

Pattern for Story 2.1:
<Image source={require("./garments/type.png")} style={{ tintColor: color.hex }} />

Garment components will be Image wrappers instead of SVG components.
Build pipeline uses standard Image require (no SVG transformer needed for garments).
Animations via Reanimated interpolateColor on tintColor style prop.`}
				</Text>
			</View>
		</ScrollView>
	);
}
