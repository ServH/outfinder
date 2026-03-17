import { forwardRef } from "react";
import { Image, type ImageSourcePropType, Text, View } from "react-native";

import { GARMENT_REGISTRY } from "@/components/garments/index";
import type { SlotState } from "@/hooks/useOutfitState";

export interface SharePreviewProps {
	slots: SlotState[];
	combination: {
		nameJp: string;
		colors: Array<{ hex: string; nameEn: string }>;
	};
}

export const SharePreview = forwardRef<View, SharePreviewProps>(
	function SharePreview({ slots, combination }, ref) {
		return (
			<View
				ref={ref}
				collapsable={false}
				testID="share-preview-container"
				style={{
					position: "absolute",
					left: -9999,
					width: 360,
					height: 640,
					backgroundColor: "#f0ece4",
				}}
			>
				{/* Semi-transparent overlay for subtle gradient effect */}
				<View
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						height: 80,
						backgroundColor: "#f5efe6",
						opacity: 0.6,
					}}
				/>

				{/* Wada header section (~10%) */}
				<View
					style={{
						alignItems: "center",
						paddingTop: 32,
						paddingBottom: 8,
					}}
				>
					<Text
						style={{
							fontSize: 20,
							fontFamily: "NotoSerifJP_500Medium",
							color: "#2c2c2c",
							letterSpacing: 2,
						}}
					>
						{combination.nameJp}
					</Text>
					<Text
						style={{
							fontSize: 10,
							color: "#a09080",
							letterSpacing: 1,
							marginTop: 2,
						}}
					>
						{combination.colors.length} colors · Sanzo Wada
					</Text>
				</View>

				{/* Outfit section (~60%) */}
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
						paddingHorizontal: 24,
					}}
				>
					<View
						style={{
							backgroundColor: "#fafaf8",
							borderRadius: 16,
							padding: 16,
							alignItems: "center",
							width: 280,
						}}
					>
						{slots.map((slot) => {
							const config = GARMENT_REGISTRY[slot.garmentType];
							return (
								<Image
									key={`${slot.garmentType}-${slot.color.hex}`}
									testID="share-garment-image"
									source={config.image as ImageSourcePropType}
									style={{
										width: 200,
										height: config.heightHint * 1.2,
										tintColor: slot.color.hex,
									}}
									resizeMode="contain"
								/>
							);
						})}
					</View>
				</View>

				{/* Color strip section (~8%) */}
				<View style={{ alignItems: "center", paddingVertical: 8 }}>
					<View
						style={{
							flexDirection: "row",
							borderRadius: 6,
							overflow: "hidden",
							height: 14,
							width: 240,
						}}
					>
						{combination.colors.map((c) => (
							<View key={c.hex} style={{ flex: 1, backgroundColor: c.hex }} />
						))}
					</View>
					<View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
						{combination.colors.map((c) => (
							<Text key={c.hex} style={{ fontSize: 9, color: "#a09080" }}>
								{c.nameEn}
							</Text>
						))}
					</View>
				</View>

				{/* Branding footer (≤80px / ≤5%) */}
				<View
					style={{
						alignItems: "center",
						paddingBottom: 20,
						height: 80,
						justifyContent: "center",
					}}
				>
					<Text
						style={{
							fontSize: 14,
							fontFamily: "Inter_500Medium",
							color: "#a09080",
						}}
					>
						Outfinder
					</Text>
				</View>
			</View>
		);
	},
);
