import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { hapticLight } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";

type CaptureScreenNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"CaptureScreen"
>;

export function CaptureScreen() {
	const { t } = useTranslation();
	const navigation = useNavigation<CaptureScreenNav>();
	const cameraRef = useRef<CameraView>(null);
	const [permission, requestPermission] = useCameraPermissions();
	const [wbVisible, setWbVisible] = useState(false);
	const [wbTemperature, setWbTemperature] = useState(5500);
	const isCapturing = useRef(false);
	const hasRequestedPermission = useRef(false);

	// All hooks called before any early returns (Rules of Hooks)

	// Request permission once on mount if not yet granted (AC #3)
	// One-shot ref guard prevents re-firing if requestPermission is unstable across renders
	useEffect(() => {
		if (
			permission &&
			!permission.granted &&
			permission.canAskAgain &&
			!hasRequestedPermission.current
		) {
			hasRequestedPermission.current = true;
			requestPermission();
		}
	}, [permission, requestPermission]);

	function handleBack() {
		navigation.goBack();
	}

	function handleToggleWb() {
		hapticLight();
		setWbVisible((v) => !v);
	}

	async function takePicture() {
		if (isCapturing.current) return;
		isCapturing.current = true;
		hapticLight();
		try {
			const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
			if (photo) {
				// Story 12.3 will wire AnalysisOverlay here
				if (__DEV__) {
					console.log("[CaptureScreen] photo URI:", photo.uri);
				}
			}
		} catch (e) {
			console.warn("[CaptureScreen] takePictureAsync error:", e);
		} finally {
			isCapturing.current = false;
		}
	}

	// Permission loading state
	if (!permission) {
		return <View className="flex-1 bg-black" testID="permission-loading" />;
	}

	// Permission denied state (AC #3)
	if (!permission.granted) {
		return (
			<View
				className="flex-1 bg-black items-center justify-center px-8"
				testID="permission-denied-view"
			>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 14,
						color: "white",
						textAlign: "center",
						opacity: 0.6,
					}}
					testID="permission-denied-text"
				>
					{t("colorCapture.permissionDenied")}
				</Text>
				<Pressable
					onPress={handleBack}
					accessibilityRole="button"
					accessibilityLabel={t("common.goBack")}
					className="mt-4 min-h-[44px] justify-center"
					testID="permission-back-button"
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 16,
							color: "white",
						}}
					>
						{t("common.goBack")}
					</Text>
				</Pressable>
			</View>
		);
	}

	// Camera active state (AC #2, #4, #5, #6, #7)
	return (
		<View className="flex-1 bg-black" testID="capture-screen">
			{/* Full-screen camera preview */}
			<CameraView
				ref={cameraRef}
				facing="back"
				style={StyleSheet.absoluteFill}
				testID="camera-view"
			/>

			{/* Back button (AC #7) */}
			<Pressable
				onPress={handleBack}
				accessibilityRole="button"
				accessibilityLabel={t("common.goBack")}
				className="absolute items-center justify-center"
				style={{ top: 56, left: 20, width: 48, height: 48 }}
				testID="back-button"
			>
				{({ pressed }) => (
					<View
						className="flex-1 items-center justify-center"
						style={{ opacity: pressed ? 0.7 : 1 }}
					>
						<SymbolView name="chevron.left" size={22} tintColor="white" />
					</View>
				)}
			</Pressable>

			{/* White balance toggle (AC #5) */}
			<Pressable
				onPress={handleToggleWb}
				accessibilityRole="button"
				accessibilityLabel={t("colorCapture.wbSliderLabel")}
				className="absolute items-center justify-center"
				style={{ top: 56, right: 20, width: 48, height: 48 }}
				testID="wb-toggle-button"
			>
				{({ pressed }) => (
					<View
						className="flex-1 items-center justify-center"
						style={{ opacity: pressed ? 0.7 : 1 }}
					>
						<SymbolView name="sun.max" size={22} tintColor="white" />
					</View>
				)}
			</Pressable>

			{/* WB slider (AC #5) */}
			{wbVisible && (
				<View
					className="absolute left-0 right-0"
					style={{ top: 120 }}
					testID="wb-slider-container"
				>
					<Slider
						minimumValue={2700}
						maximumValue={7000}
						step={100}
						value={wbTemperature}
						onValueChange={setWbTemperature}
						minimumTrackTintColor="white"
						maximumTrackTintColor="rgba(255,255,255,0.4)"
						thumbTintColor="white"
						accessibilityLabel={t("colorCapture.wbSliderLabel")}
						testID="wb-slider"
						style={{ marginHorizontal: 20 }}
					/>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 12,
							color: "white",
							textAlign: "center",
							marginTop: 4,
						}}
						testID="wb-temperature-label"
					>
						{wbTemperature}K
					</Text>
				</View>
			)}

			{/* Overlay hint pill (AC #4) */}
			<View
				className="absolute self-center"
				style={{ bottom: 96 }}
				accessibilityElementsHidden
				testID="overlay-hint"
			>
				<View
					style={{
						backgroundColor: "rgba(0,0,0,0.6)",
						borderRadius: 12,
						paddingHorizontal: 16,
						paddingVertical: 8,
					}}
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 13,
							color: "white",
						}}
					>
						{t("colorCapture.overlayHint")}
					</Text>
				</View>
			</View>

			{/* Capture button (AC #6) */}
			<Pressable
				onPress={takePicture}
				accessibilityRole="button"
				accessibilityLabel={t("colorCapture.captureButtonLabel")}
				className="absolute self-center"
				style={{ bottom: 28, width: 56, height: 56 }}
				testID="capture-button"
			>
				{({ pressed }) => (
					<View
						className="flex-1 rounded-full bg-white items-center justify-center"
						style={{
							opacity: pressed ? 0.8 : 1,
							shadowColor: "#000",
							shadowOpacity: 0.3,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 2 },
						}}
					/>
				)}
			</Pressable>
		</View>
	);
}
