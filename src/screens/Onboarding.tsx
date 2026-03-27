import { type ComponentType, useCallback, useRef, useState } from "react";
import {
	FlatList,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	Text,
	useWindowDimensions,
	View,
	type ViewabilityConfig,
	type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ColorSpecimenPreview } from "@/components/onboarding/ColorSpecimenPreview";
import { OutfitPreview } from "@/components/onboarding/OutfitPreview";
import { PalettePreview } from "@/components/onboarding/PalettePreview";
import { SwatchGridPreview } from "@/components/onboarding/SwatchGridPreview";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";

export interface OnboardingProps {
	onComplete: () => void;
}

interface SlideData {
	id: string;
	titleEn: string;
	Preview: ComponentType;
}

const ONBOARDING_SLIDES: SlideData[] = [
	{
		id: "1",
		titleEn: "Open your wardrobe",
		Preview: SwatchGridPreview,
	},
	{
		id: "2",
		titleEn: "Pick your favorite piece",
		Preview: ColorSpecimenPreview,
	},
	{
		id: "3",
		titleEn: "Find its color",
		Preview: PalettePreview,
	},
	{
		id: "4",
		titleEn: "Discover your combinations",
		Preview: OutfitPreview,
	},
];

const viewabilityConfig: ViewabilityConfig = {
	itemVisiblePercentThreshold: 50,
};

export function Onboarding({ onComplete }: OnboardingProps) {
	const { width: screenWidth } = useWindowDimensions();
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
		const { Preview } = item;
		return (
			<View
				className="flex-1 items-center justify-center bg-paper"
				style={{ width: screenWidth }}
				accessibilityLabel={`Slide ${index + 1} of 4: ${item.titleEn}`}
				testID={`onboarding-slide-${index}`}
			>
				<Preview />
				<Text
					allowFontScaling
					className="mt-8 text-center text-primary font-serif-jp text-[24px]"
				>
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
						<Text
							allowFontScaling
							className="text-center text-white font-serif-jp text-[18px]"
						>
							始めましょう
						</Text>
						<Text
							allowFontScaling
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
				<Text allowFontScaling className="text-tertiary font-sans text-[13px]">
					Skip
				</Text>
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
