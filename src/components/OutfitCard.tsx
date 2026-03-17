import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSpring,
	withTiming,
} from "react-native-reanimated";

import { GARMENT_REGISTRY } from "@/components/garments/index";
import { TintedGarment } from "@/components/TintedGarment";
import type { SlotState } from "@/hooks/useOutfitState";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface OutfitCardProps {
	slots: SlotState[];
	selectedSlotIndex: number | null;
	onSlotTap: (index: number) => void;
	onVariantToggle: (index: number) => void;
}

const CARD_WIDTH = 220;

interface CardSlotProps {
	slot: SlotState;
	index: number;
	isSelected: boolean;
	onTap: () => void;
	onVariantToggle: () => void;
}

function CardSlot({
	slot,
	index,
	isSelected,
	onTap,
	onVariantToggle,
}: CardSlotProps) {
	const config = GARMENT_REGISTRY[slot.garmentType];
	const label = `${config.label}, colored ${slot.color.nameEn}, tap to select for swap`;
	const reducedMotion = useReducedMotion();

	const borderOpacity = useSharedValue(0);

	useEffect(() => {
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
			borderOpacity.value = withTiming(0, { duration: 150 });
		}
	}, [isSelected, reducedMotion, borderOpacity]);

	const borderStyle = useAnimatedStyle(() => ({
		borderWidth: 2,
		borderColor: isSelected
			? `rgba(0, 0, 0, ${borderOpacity.value * 0.8})`
			: "transparent",
		borderRadius: 8,
	}));

	return (
		<View style={index > 0 ? { marginTop: -8 } : undefined}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={label}
				accessibilityState={{ selected: isSelected }}
				style={{ minHeight: 44 }}
				onPress={onTap}
			>
				{({ pressed }) => (
					<Animated.View
						style={[
							borderStyle,
							{
								opacity: pressed ? 0.88 : 1,
								alignItems: "center",
							},
						]}
					>
						<TintedGarment
							garmentType={slot.garmentType}
							colorHex={slot.color.hex}
							width={CARD_WIDTH}
							height={config.heightHint}
						/>
						<Pressable
							onPress={onVariantToggle}
							accessibilityLabel={`Change ${config.label} variant`}
							accessibilityRole="button"
							style={{
								position: "absolute",
								bottom: 0,
								right: 0,
								minWidth: 44,
								minHeight: 44,
								alignItems: "center",
								justifyContent: "center",
							}}
							hitSlop={8}
						>
							<View
								style={{
									width: 20,
									height: 20,
									borderRadius: 10,
									backgroundColor: "rgba(0,0,0,0.3)",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
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
		</View>
	);
}

export function OutfitCard({
	slots,
	selectedSlotIndex,
	onSlotTap,
	onVariantToggle,
}: OutfitCardProps) {
	return (
		<View
			accessibilityLabel="Outfit card"
			style={{
				backgroundColor: "#fafaf8",
				borderRadius: 16,
				padding: 14,
				alignItems: "center",
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 8 },
				shadowOpacity: 0.08,
				shadowRadius: 20,
			}}
		>
			{slots.map((slot, index) => (
				<CardSlot
					// biome-ignore lint/suspicious/noArrayIndexKey: slot position is stable; color.id moves on swap breaking animations
					key={index}
					slot={slot}
					index={index}
					isSelected={selectedSlotIndex === index}
					onTap={() => onSlotTap(index)}
					onVariantToggle={() => onVariantToggle(index)}
				/>
			))}
		</View>
	);
}
