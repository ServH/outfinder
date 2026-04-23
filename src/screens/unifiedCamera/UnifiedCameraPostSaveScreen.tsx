import {
	type RouteProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColor } from "@/data/colorIndex";
import { hapticLight } from "@/lib/haptics";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";
import type {
	RootStackParamList,
	UnifiedCameraStackParamList,
} from "@/navigation/types";
import { wadaTokens } from "@/styles/theme";

const CREAM = "#faf7f2";

type PostSaveRoute = RouteProp<UnifiedCameraStackParamList, "PostSave">;

type UnifiedCameraPostSaveScreenProps = Record<string, never>;

function categoryLabelKey(categoryKey: WardrobeCategory): string {
	switch (categoryKey) {
		case "top":
			return "unifiedCamera.categorySheet.rowTop";
		case "bottom":
			return "unifiedCamera.categorySheet.rowBottom";
		case "footwear":
			return "unifiedCamera.categorySheet.rowFootwear";
		case "accessory":
			return "unifiedCamera.categorySheet.rowAccessory";
	}
}

export function UnifiedCameraPostSaveScreen(
	_props: UnifiedCameraPostSaveScreenProps,
) {
	const { t } = useTranslation();
	const route = useRoute<PostSaveRoute>();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();

	const { wadaColorId, capturedHex, categoryKey } = route.params;
	const wadaColor = getColor(wadaColorId);
	const wadaName = wadaColor?.nameEn ?? "";
	const categoryLabel = t(categoryLabelKey(categoryKey));

	// BUG-001 (second pass): the previous `navigate + goBack` combo broke
	// both CTAs on device — goBack was routed to the nested focused nav
	// after navigate changed focus, popping the just-pushed Combinations
	// instead of dismissing the UnifiedCameraRoot modal. popTo is the
	// idiomatic RN7 API for "pop back to this root screen applying these
	// nested params" in a single atomic dispatch, no focus race.
	function handlePrimary() {
		hapticLight();
		const rootNav =
			navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
		rootNav?.popTo("Main", {
			screen: "ColorsTab",
			params: {
				screen: "Combinations",
				params: { colorId: wadaColorId, capturedHex },
			},
		} as never);
	}

	function handleSecondary() {
		hapticLight();
		const rootNav =
			navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
		rootNav?.popTo("Main", { screen: "FavoritesTab" } as never);
	}

	return (
		<View
			testID="unified-camera-postsave-screen"
			className="flex-1"
			style={{
				backgroundColor: wadaTokens.bgPaper,
				paddingTop: insets.top,
				paddingBottom: insets.bottom,
			}}
		>
			<View className="flex-1 items-center justify-center px-6">
				<Text
					testID="unified-camera-postsave-title"
					allowFontScaling
					className="text-center"
					style={{
						fontFamily: "NotoSerifJP_500Medium",
						fontSize: 22,
						color: wadaTokens.textPrimary,
					}}
				>
					{t("unifiedCamera.postSave.title")}
				</Text>
				<Text
					testID="unified-camera-postsave-subtitle"
					allowFontScaling
					className="text-center"
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 15,
						color: wadaTokens.textSecondary,
						marginTop: 8,
					}}
				>
					{t("unifiedCamera.postSave.subtitle", { categoryLabel })}
				</Text>
			</View>

			<View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
				<Pressable
					testID="unified-camera-postsave-primary-cta"
					onPress={handlePrimary}
					accessibilityRole="button"
					accessibilityLabel={t("unifiedCamera.postSave.primaryCtaA11y", {
						wadaName,
					})}
					style={{
						height: 56,
						borderRadius: 14,
						backgroundColor: wadaTokens.textPrimary,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text
						allowFontScaling
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 16,
							color: CREAM,
						}}
					>
						{t("unifiedCamera.postSave.primaryCta", { wadaName })}
					</Text>
				</Pressable>
				<Pressable
					testID="unified-camera-postsave-secondary-cta"
					onPress={handleSecondary}
					accessibilityRole="button"
					accessibilityLabel={t("unifiedCamera.postSave.secondaryCtaA11y")}
					style={{
						height: 48,
						borderRadius: 12,
						borderWidth: 1,
						borderColor: wadaTokens.hairline,
						alignItems: "center",
						justifyContent: "center",
						marginTop: 12,
					}}
				>
					<Text
						allowFontScaling
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 16,
							color: wadaTokens.textPrimary,
						}}
					>
						{t("unifiedCamera.postSave.secondaryCta")}
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
