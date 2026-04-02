import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import {
	Animated,
	Dimensions,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FabricSwatch } from "@/components/FabricSwatch";
import type { WardrobeCategory } from "@/data/types";
import { hapticLight } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";

type ColorHomeNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"ColorHome"
>;

const BASICS: WardrobeCategory[] = [
	"white",
	"black",
	"blue",
	"grey",
	"brown",
	"green",
];
const ACCENTS: WardrobeCategory[] = [
	"red",
	"pink",
	"yellow",
	"purple",
	"orange",
];

const PEEK_WIDTH = 28;
const SCREEN_WIDTH = Dimensions.get("window").width;
const PAGE_WIDTH = SCREEN_WIDTH - PEEK_WIDTH;

export function ColorHome() {
	const navigation = useNavigation<ColorHomeNav>();
	const insets = useSafeAreaInsets();
	const scrollRef = useRef<ScrollView>(null);
	const scrollX = useRef(new Animated.Value(0)).current;
	const [currentPage, setCurrentPage] = useState(0);
	const [selectedFamily, setSelectedFamily] = useState<WardrobeCategory | null>(
		null,
	);

	function handleFamilyPress(category: WardrobeCategory) {
		setSelectedFamily(category);
	}

	function handleBrowseAllPress() {
		hapticLight();
		navigation.push("BrowseAllColors");
	}

	const handleScroll = Animated.event(
		[{ nativeEvent: { contentOffset: { x: scrollX } } }],
		{ useNativeDriver: false },
	);

	function handleMomentumEnd(event: {
		nativeEvent: { contentOffset: { x: number } };
	}) {
		const page = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
		setCurrentPage(page);
	}

	const linkOpacity = scrollX.interpolate({
		inputRange: [0, PAGE_WIDTH * 0.4],
		outputRange: [1, 0],
		extrapolate: "clamp",
	});

	const dot0Color = scrollX.interpolate({
		inputRange: [0, PAGE_WIDTH],
		outputRange: ["#1a1a1a", "#d4d4d4"],
		extrapolate: "clamp",
	});
	const dot1Color = scrollX.interpolate({
		inputRange: [0, PAGE_WIDTH],
		outputRange: ["#d4d4d4", "#1a1a1a"],
		extrapolate: "clamp",
	});

	// State 2 hook point — Story 8.4 will render shade picker + combo cards here
	// For now, selectedFamily is set but we always render State 1
	void selectedFamily;

	// Back-to-Page-1: when selectedFamily is cleared (back from State 2), scroll to Page 1
	useEffect(() => {
		if (selectedFamily === null) {
			scrollRef.current?.scrollTo({ x: 0, animated: false });
		}
	}, [selectedFamily]);

	const gap = 12;
	const pagePadding = 16;
	const cardWidth = (PAGE_WIDTH - pagePadding * 2 - gap) / 2;

	return (
		<View
			className="flex-1"
			style={{
				backgroundColor: "#fafaf8",
				paddingTop: insets.top,
			}}
		>
			{/* Custom header */}
			<View className="px-4 pt-4 pb-2">
				<Text
					style={{
						fontFamily: "NotoSerifJP_500Medium",
						fontSize: 28,
						color: "#1a1a1a",
					}}
				>
					Outfinder
				</Text>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 15,
						color: "#6b6b6b",
						marginTop: 4,
					}}
				>
					What color are you wearing?
				</Text>
			</View>

			{/* Paginated swatch grid */}
			<ScrollView
				ref={scrollRef}
				horizontal
				showsHorizontalScrollIndicator={false}
				snapToInterval={PAGE_WIDTH}
				decelerationRate="fast"
				onScroll={handleScroll}
				onMomentumScrollEnd={handleMomentumEnd}
				scrollEventThrottle={16}
				contentContainerStyle={{ paddingLeft: pagePadding }}
				testID="swatch-scroll"
			>
				{/* Page 1: Basics */}
				<View style={{ width: PAGE_WIDTH - pagePadding }} testID="page-basics">
					<View className="flex-row flex-wrap" style={{ gap }}>
						{BASICS.map((category) => (
							<View key={category} style={{ width: cardWidth }}>
								<FabricSwatch category={category} onPress={handleFamilyPress} />
							</View>
						))}
					</View>
				</View>

				{/* Page 2: Accents + "All 159 colors" */}
				<View
					style={{
						width: PAGE_WIDTH,
						paddingLeft: gap,
						paddingRight: pagePadding,
					}}
					testID="page-accents"
				>
					<View className="flex-row flex-wrap" style={{ gap }}>
						{ACCENTS.map((category) => (
							<View key={category} style={{ width: cardWidth }}>
								<FabricSwatch category={category} onPress={handleFamilyPress} />
							</View>
						))}

						{/* Dashed "All 159 colors" card */}
						<View style={{ width: cardWidth }}>
							<Pressable
								onPress={handleBrowseAllPress}
								accessibilityRole="button"
								accessibilityLabel="Browse all 159 colors"
								testID="browse-all-card"
							>
								{({ pressed }) => (
									<View
										className="items-center justify-center rounded-2xl"
										style={{
											aspectRatio: 1,
											borderWidth: 2,
											borderStyle: "dashed",
											borderColor: "#a09080",
											opacity: pressed ? 0.88 : 1,
										}}
									>
										{/* Simple 3x3 grid icon */}
										<View className="mb-2" style={{ gap: 4 }}>
											{[0, 1, 2].map((row) => (
												<View key={row} className="flex-row" style={{ gap: 4 }}>
													{[0, 1, 2].map((col) => (
														<View
															key={col}
															style={{
																width: 8,
																height: 8,
																borderRadius: 2,
																backgroundColor: "#a09080",
															}}
														/>
													))}
												</View>
											))}
										</View>
										<Text
											style={{
												fontFamily: "Inter_500Medium",
												fontSize: 13,
												color: "#a09080",
												textAlign: "center",
											}}
										>
											All 159{"\n"}colors
										</Text>
									</View>
								)}
							</Pressable>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* Page dots */}
			<View
				className="flex-row items-center justify-center py-4"
				style={{ gap: 8 }}
				testID="page-dots"
			>
				<Animated.View
					style={{
						width: 8,
						height: 8,
						borderRadius: 4,
						backgroundColor: dot0Color,
					}}
					testID="dot-0"
				/>
				<Animated.View
					style={{
						width: 8,
						height: 8,
						borderRadius: 4,
						backgroundColor: dot1Color,
					}}
					testID="dot-1"
				/>
			</View>

			{/* "Browse all 159 colors" link — fades out as user scrolls to Page 2 */}
			<Animated.View
				style={{ opacity: linkOpacity }}
				pointerEvents={currentPage === 0 ? "auto" : "none"}
			>
				<Pressable
					onPress={handleBrowseAllPress}
					className="items-center pb-4"
					testID="browse-all-link"
					accessibilityRole="link"
					accessibilityLabel="Browse all 159 colors"
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 14,
							color: "#6b6b6b",
							textDecorationLine: "underline",
						}}
					>
						Browse all 159 colors
					</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}
