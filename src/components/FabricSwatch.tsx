import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import type { WardrobeCategory } from "@/data/types";
import { hapticLight } from "@/lib/haptics";

type GradientColors = readonly [string, string, ...string[]];

export const FABRIC_GRADIENTS: Record<WardrobeCategory, GradientColors> = {
	white: ["#FFFFFF", "#F8F6F0", "#EDE8E0"],
	black: ["#4A4A4A", "#2C2C2C", "#1A1A1A"],
	blue: ["#7EB4D8", "#4A7FB5", "#2C5F8A"],
	grey: ["#C8C8C8", "#9E9E9E", "#707070"],
	brown: ["#D4B896", "#A67C52", "#6B4226"],
	green: ["#8FBC8F", "#5F8A5F", "#3D5C3D"],
	red: ["#E07070", "#C04040", "#8B2020"],
	pink: ["#F0B0C0", "#E07090", "#C04060"],
	yellow: ["#F0D080", "#D4A830", "#B08820"],
	purple: ["#B090D0", "#7B5EA7", "#5A3D7A"],
	orange: ["#F0A060", "#D07030", "#A04010"],
};

const DARK_TEXT_CATEGORIES: ReadonlySet<WardrobeCategory> = new Set([
	"white",
	"grey",
	"yellow",
	"pink",
	"orange",
]);

const FABRIC_LABELS: Record<WardrobeCategory, string> = {
	white: "White",
	black: "Black",
	blue: "Blue",
	grey: "Grey",
	brown: "Brown",
	green: "Green",
	red: "Red",
	pink: "Pink",
	yellow: "Yellow",
	purple: "Purple",
	orange: "Orange",
};

export interface FabricSwatchProps {
	category: WardrobeCategory;
	onPress: (category: WardrobeCategory) => void;
}

export function FabricSwatch({ category, onPress }: FabricSwatchProps) {
	const gradientColors = FABRIC_GRADIENTS[category];
	const label = FABRIC_LABELS[category];
	const useDarkText = DARK_TEXT_CATEGORIES.has(category);

	function handlePress() {
		hapticLight();
		onPress(category);
	}

	return (
		<Pressable
			onPress={handlePress}
			accessibilityRole="button"
			accessibilityLabel={`${label}, tap to see combinations`}
			testID={`fabric-swatch-${category}`}
		>
			{({ pressed }) => (
				<View
					className="overflow-hidden rounded-2xl"
					style={{
						aspectRatio: 1,
						opacity: pressed ? 0.88 : 1,
						borderWidth: category === "white" ? 1 : 0,
						borderColor: "#e0dcd6",
					}}
				>
					<LinearGradient
						colors={gradientColors}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{ flex: 1, padding: 12 }}
					>
						<Text
							style={{
								fontFamily: "Inter_500Medium",
								fontSize: 16,
								color: useDarkText ? "#1a1a1a" : "#ffffff",
							}}
						>
							{label}
						</Text>
					</LinearGradient>
				</View>
			)}
		</Pressable>
	);
}
