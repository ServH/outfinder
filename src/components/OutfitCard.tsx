import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnJS,
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
	onVariantCycle: (index: number, direction: 1 | -1) => void;
}

const CARD_WIDTH = 220;
const SWIPE_THRESHOLD = 30;
const VELOCITY_THRESHOLD = 300;
const SLIDE_DISTANCE = 60;
const ANIM_DURATION = 150;

interface CardSlotProps {
	slot: SlotState;
	index: number;
	isSelected: boolean;
	onTap: () => void;
	onVariantCycle: (direction: 1 | -1) => void;
}

function CardSlot({
	slot,
	index,
	isSelected,
	onTap,
	onVariantCycle,
}: CardSlotProps) {
	const config = GARMENT_REGISTRY[slot.garmentType];
	const label = `${config.label}, colored ${slot.color.nameEn}, tap to select for swap`;
	const reducedMotion = useReducedMotion();

	const borderOpacity = useSharedValue(0);
	const translateX = useSharedValue(0);
	const slideOpacity = useSharedValue(1);

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

	const slideStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
		opacity: slideOpacity.value,
	}));

	function triggerCycle(direction: 1 | -1) {
		if (reducedMotion) {
			onVariantCycle(direction);
			return;
		}
		const exitDir = direction;
		translateX.value = withTiming(
			exitDir * SLIDE_DISTANCE,
			{ duration: ANIM_DURATION },
			(finished) => {
				if (finished) {
					runOnJS(onVariantCycle)(direction);
					translateX.value = -exitDir * SLIDE_DISTANCE;
					slideOpacity.value = 0;
					translateX.value = withTiming(0, { duration: ANIM_DURATION });
					slideOpacity.value = withTiming(1, {
						duration: ANIM_DURATION,
					});
				}
			},
		);
		slideOpacity.value = withTiming(0.3, { duration: ANIM_DURATION });
	}

	const panGesture = Gesture.Pan()
		.activeOffsetX([-SWIPE_THRESHOLD, SWIPE_THRESHOLD])
		.failOffsetY([-20, 20])
		.onEnd((event) => {
			"worklet";
			const isRightSwipe =
				event.translationX > SWIPE_THRESHOLD ||
				event.velocityX > VELOCITY_THRESHOLD;
			const isLeftSwipe =
				event.translationX < -SWIPE_THRESHOLD ||
				event.velocityX < -VELOCITY_THRESHOLD;

			if (isRightSwipe) {
				runOnJS(triggerCycle)(1);
			} else if (isLeftSwipe) {
				runOnJS(triggerCycle)(-1);
			}
		});

	return (
		<View style={index > 0 ? { marginTop: -8 } : undefined}>
			<GestureDetector gesture={panGesture}>
				<Pressable
					accessibilityRole="adjustable"
					accessibilityLabel={label}
					accessibilityState={{ selected: isSelected }}
					accessibilityActions={[
						{ name: "increment", label: "Next variant" },
						{ name: "decrement", label: "Previous variant" },
					]}
					onAccessibilityAction={(event) => {
						if (event.nativeEvent.actionName === "increment") {
							onVariantCycle(1);
						} else if (event.nativeEvent.actionName === "decrement") {
							onVariantCycle(-1);
						}
					}}
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
							<Animated.View style={slideStyle}>
								<TintedGarment
									garmentType={slot.garmentType}
									colorHex={slot.color.hex}
									width={CARD_WIDTH}
									height={config.heightHint}
								/>
							</Animated.View>
						</Animated.View>
					)}
				</Pressable>
			</GestureDetector>
		</View>
	);
}

export function OutfitCard({
	slots,
	selectedSlotIndex,
	onSlotTap,
	onVariantCycle,
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
			{slots.map((slot, i) => (
				<CardSlot
					// biome-ignore lint/suspicious/noArrayIndexKey: slot position is stable; color.id moves on swap breaking animations
					key={i}
					slot={slot}
					index={i}
					isSelected={selectedSlotIndex === i}
					onTap={() => onSlotTap(i)}
					onVariantCycle={(dir) => onVariantCycle(i, dir)}
				/>
			))}
		</View>
	);
}
