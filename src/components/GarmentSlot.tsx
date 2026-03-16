import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSpring,
	withTiming,
} from "react-native-reanimated";

import {
	GARMENT_REGISTRY,
	type GarmentType,
} from "@/components/garments/index";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface GarmentSlotProps {
	garmentType: GarmentType;
	color: string;
	colorName: string;
	isSelected: boolean;
	onTap: () => void;
	onVariantToggle: () => void;
}

const MANNEQUIN_WIDTH = 192;

function getSlotWidth(garmentType: GarmentType): number {
	if (garmentType.startsWith("layer-")) return MANNEQUIN_WIDTH * 0.65;
	if (garmentType.startsWith("top-")) return MANNEQUIN_WIDTH * 0.5;
	if (garmentType === "bottom-pants") return MANNEQUIN_WIDTH * 0.28;
	if (garmentType === "bottom-skirt") return MANNEQUIN_WIDTH * 0.4;
	return MANNEQUIN_WIDTH * 0.3;
}

export function GarmentSlot({
	garmentType,
	color,
	colorName,
	isSelected,
	onTap,
	onVariantToggle,
}: GarmentSlotProps) {
	const config = GARMENT_REGISTRY[garmentType];
	const Component = config.component;
	const label = `${config.label}, colored ${colorName}, tap to select for swap`;
	const reducedMotion = useReducedMotion();

	const borderOpacity = useSharedValue(0);
	const isSelectedSV = useSharedValue(isSelected ? 1 : 0);
	const prevColorRef = useRef(color);
	const colorProgress = useSharedValue(1);

	useEffect(() => {
		isSelectedSV.value = isSelected ? 1 : 0;
		if (isSelected) {
			if (reducedMotion) {
				borderOpacity.value = 1;
			} else {
				borderOpacity.value = withRepeat(
					withSpring(1, { damping: 12, stiffness: 120 }),
					-1,
					true,
				);
			}
		} else {
			borderOpacity.value = 0;
		}
	}, [isSelected, reducedMotion, borderOpacity, isSelectedSV]);

	useEffect(() => {
		if (prevColorRef.current !== color) {
			if (reducedMotion) {
				colorProgress.value = 1;
			} else {
				colorProgress.value = 0;
				colorProgress.value = withTiming(1, { duration: 200 });
			}
			prevColorRef.current = color;
		}
	}, [color, reducedMotion, colorProgress]);

	const borderStyle = useAnimatedStyle(() => ({
		borderWidth: 2,
		borderColor: `rgba(0, 0, 0, ${borderOpacity.value * 0.8})`,
		borderRadius: 8,
		opacity: isSelectedSV.value ? 0.6 + borderOpacity.value * 0.4 : 1,
	}));

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: isSelected }}
			className="min-h-[44px]"
			style={{ width: getSlotWidth(garmentType), alignSelf: "center" }}
			onPress={onTap}
		>
			{({ pressed }) => (
				<Animated.View
					style={[
						borderStyle,
						{
							opacity: pressed ? 0.88 : undefined,
							borderColor: isSelected ? undefined : "transparent",
						},
					]}
					className="items-center relative"
				>
					<Component color={color} accessibilityLabel="" />
					<Pressable
						onPress={onVariantToggle}
						accessibilityLabel="Toggle garment type"
						accessibilityRole="button"
						className="absolute bottom-0 right-0 min-w-[44px] min-h-[44px] items-center justify-center"
						hitSlop={8}
					>
						<View className="w-5 h-5 rounded-full bg-black/30 items-center justify-center">
							<View
								style={{
									width: 0,
									height: 0,
									borderLeftWidth: 3,
									borderRightWidth: 3,
									borderBottomWidth: 4,
									borderLeftColor: "transparent",
									borderRightColor: "transparent",
									borderBottomColor: "white",
								}}
							/>
							<View
								style={{
									width: 0,
									height: 0,
									borderLeftWidth: 3,
									borderRightWidth: 3,
									borderTopWidth: 4,
									borderLeftColor: "transparent",
									borderRightColor: "transparent",
									borderTopColor: "white",
									marginTop: 2,
								}}
							/>
						</View>
					</Pressable>
				</Animated.View>
			)}
		</Pressable>
	);
}
