import { useCallback, useRef, useState } from "react";
import {
	Dimensions,
	FlatList,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	Text,
	View,
	type ViewabilityConfig,
	type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";

export interface OnboardingProps {
	onComplete: () => void;
}

interface SlideData {
	id: string;
	titleJp: string;
	titleEn: string;
	placeholderColor: string;
}

const ONBOARDING_SLIDES: SlideData[] = [
	{
		id: "1",
		titleJp: "あなたの服を開いて",
		titleEn: "Open your wardrobe",
		placeholderColor: "#d4c4b0",
	},
	{
		id: "2",
		titleJp: "好きな一着を選んで",
		titleEn: "Pick your favorite piece",
		placeholderColor: "#b8c4b8",
	},
	{
		id: "3",
		titleJp: "その色を見つけて",
		titleEn: "Find its color",
		placeholderColor: "#c4b8c8",
	},
	{
		id: "4",
		titleJp: "組み合わせを発見しよう",
		titleEn: "Discover your combinations",
		placeholderColor: "#c8c0b0",
	},
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const viewabilityConfig: ViewabilityConfig = {
	itemVisiblePercentThreshold: 50,
};

export function Onboarding({ onComplete }: OnboardingProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const insets = useSafeAreaInsets();
	const reducedMotion = useReducedMotion();

	const onViewableItemsChanged = useCallback(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			if (viewableItems.length > 0 && viewableItems[0].index != null) {
				setCurrentIndex(viewableItems[0].index);
			}
		},
		[],
	);

	const viewabilityConfigCallbackPairs = useRef([
		{ viewabilityConfig, onViewableItemsChanged },
	]);

	function handleSkip() {
		hapticLight();
		onComplete();
	}

	function handleCta() {
		hapticLight();
		onComplete();
	}

	const currentIndexRef = useRef(0);
	currentIndexRef.current = currentIndex;

	function handleScrollEndDrag(e: NativeSyntheticEvent<NativeScrollEvent>) {
		const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
		const maxOffset = contentSize.width - layoutMeasurement.width;
		if (currentIndexRef.current === 3 && contentOffset.x >= maxOffset) {
			hapticLight();
			onComplete();
		}
	}

	function renderSlide({ item, index }: { item: SlideData; index: number }) {
		return (
			<View
				className="flex-1 items-center justify-center bg-paper"
				style={{ width: SCREEN_WIDTH }}
				accessibilityLabel={`Slide ${index + 1} of 4: ${item.titleEn}`}
				testID={`onboarding-slide-${index}`}
			>
				<View
					className="h-40 w-40 rounded-3xl"
					style={{ backgroundColor: item.placeholderColor }}
				/>
				<Text className="mt-8 text-center text-primary font-serif-jp text-[24px]">
					{item.titleJp}
				</Text>
				<Text className="mt-3 text-center text-secondary font-sans text-[14px]">
					{item.titleEn}
				</Text>
				{index === 3 && (
					<Pressable
						className="mt-8 rounded-full px-8 min-h-[48px] items-center justify-center bg-primary"
						accessibilityRole="button"
						accessibilityLabel="Let's begin"
						testID="onboarding-cta"
						onPress={handleCta}
					>
						<Text className="text-center text-white font-serif-jp text-[18px]">
							始めましょう
						</Text>
						<Text
							className="mt-1 text-center font-sans text-[13px]"
							style={{ color: "rgba(255,255,255,0.8)" }}
						>
							Let's begin
						</Text>
					</Pressable>
				)}
			</View>
		);
	}

	return (
		<View className="flex-1 bg-paper" testID="onboarding-screen">
			{/* Skip button */}
			<Pressable
				className="absolute z-10 min-h-[44px] min-w-[44px] items-center justify-center"
				style={{ top: insets.top + 8, right: 16 }}
				accessibilityRole="button"
				accessibilityLabel="Skip onboarding"
				testID="onboarding-skip"
				onPress={handleSkip}
			>
				<Text className="text-tertiary font-sans text-[13px]">Skip</Text>
			</Pressable>

			{/* Slides */}
			<FlatList
				data={ONBOARDING_SLIDES}
				renderItem={renderSlide}
				keyExtractor={(item) => item.id}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				initialNumToRender={4}
				decelerationRate={reducedMotion ? "fast" : "normal"}
				viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
				onScrollEndDrag={handleScrollEndDrag}
			/>

			{/* Dot pagination */}
			<View
				className="flex-row items-center justify-center pb-4"
				style={{ paddingBottom: insets.bottom + 16 }}
			>
				{ONBOARDING_SLIDES.map((_, index) => (
					<View
						key={ONBOARDING_SLIDES[index].id}
						className={`mx-1 h-2 w-2 rounded-full ${index === currentIndex ? "bg-primary" : "bg-tertiary"}`}
						accessibilityLabel={`Slide ${index + 1} of 4`}
						testID={`onboarding-dot-${index}`}
					/>
				))}
			</View>
		</View>
	);
}
