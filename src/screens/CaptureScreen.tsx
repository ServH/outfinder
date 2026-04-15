import Slider from "@react-native-community/slider";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getColors } from "react-native-image-colors";
import { AnalysisOverlay } from "@/components/AnalysisOverlay";
import { ColorMatchSheet } from "@/components/ColorMatchSheet";
import { OutOfCoverageSheet } from "@/components/OutOfCoverageSheet";
import { hexToLab } from "@/lib/colorConversion";
import { classifyMatch, matchWadaColor } from "@/lib/colorMatch";
import type { MatchResult } from "@/lib/colorTypes";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";
import { applyWhiteBalance } from "../../modules/white-balance";

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
	const [analysisVisible, setAnalysisVisible] = useState(false);
	const [matchState, setMatchState] = useState<MatchResult | null>(null);
	const [capturedHex, setCapturedHex] = useState<string | null>(null);
	const [analysisError, setAnalysisError] = useState<string | null>(null);
	const isCapturing = useRef(false);
	const hasRequestedPermission = useRef(false);

	// All hooks called before any early returns (Rules of Hooks)

	// Request permission once on mount if not yet granted (AC #3)
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

	function handleSelect(colorId: string) {
		setMatchState(null);
		navigation.dispatch(
			CommonActions.reset({
				index: 1,
				routes: [
					{ name: "ColorHome" },
					{
						name: "Combinations",
						params: { colorId, capturedHex: capturedHex ?? "" },
					},
				],
			}),
		);
	}

	function handleTryAgain() {
		setMatchState(null);
		setAnalysisVisible(false);
		setAnalysisError(null);
		setCapturedHex(null);
	}

	function handleDismiss() {
		handleTryAgain();
	}

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
		try {
			hapticMedium();
			const photo = await cameraRef.current!.takePictureAsync({ quality: 0.8 });
			setAnalysisVisible(true);
			setAnalysisError(null);

			// Determine WB mode: 5500K default → auto (0), user-adjusted → explicit value
			const wbMode = wbTemperature === 5500 ? 0 : wbTemperature;
			const correctedUri = await applyWhiteBalance(photo.uri, wbMode);

			const colors = await getColors(correctedUri, { fallback: "#888888" });
			// react-native-image-colors returns a platform-discriminated union — cast once
			// biome-ignore lint/suspicious/noExplicitAny: platform discriminated union without common typed interface
			const c = colors as any;
			const dominantHex: string =
				c.platform === "ios"
					? (c.primary as string)
					: ((c.dominant ?? "#888888") as string);

			const capturedLab = hexToLab(dominantHex);
			const matches = matchWadaColor(capturedLab);
			const result = classifyMatch(matches);

			setAnalysisVisible(false);

			if (result.type === "direct") {
				navigation.dispatch(
					CommonActions.reset({
						index: 1,
						routes: [
							{ name: "ColorHome" },
							{
								name: "Combinations",
								params: {
									colorId: result.match.color.id,
									capturedHex: dominantHex,
								},
							},
						],
					}),
				);
			} else {
				setCapturedHex(dominantHex);
				setMatchState(result);
			}
		} catch (err) {
			console.error("[CaptureScreen] analysis failed:", err);
			setAnalysisVisible(false);
			setAnalysisError(t("colorCapture.analysisError"));
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

	// Camera active state
	return (
		<View className="flex-1 bg-black" testID="capture-screen">
			{/* Full-screen camera preview */}
			<CameraView
				ref={cameraRef}
				facing="back"
				style={StyleSheet.absoluteFill}
				testID="camera-view"
			/>

			{/* Back button */}
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

			{/* White balance toggle */}
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

			{/* WB slider */}
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

			{/* Overlay hint pill */}
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

			{/* Inline error message (AC #6) */}
			{analysisError !== null && (
				<View
					className="absolute self-center"
					style={{ bottom: 160 }}
					testID="analysis-error-container"
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 14,
							color: "white",
							textAlign: "center",
						}}
						testID="analysis-error-text"
					>
						{analysisError}
					</Text>
				</View>
			)}

			{/* Capture button */}
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

			{/* Analysis overlay (AC #3, #4) */}
			<AnalysisOverlay visible={analysisVisible} />

			{/* Result sheets (Story 12.4) — always mounted so Modal exit animation plays */}
			<ColorMatchSheet
				visible={matchState?.type === "confirm"}
				matches={matchState?.type === "confirm" ? matchState.top3 : []}
				capturedHex={capturedHex ?? ""}
				onSelect={handleSelect}
				onDismiss={handleDismiss}
			/>
			<OutOfCoverageSheet
				visible={matchState?.type === "out-of-coverage"}
				bestMatch={
					matchState?.type === "out-of-coverage"
						? matchState.bestMatch
						: undefined
				}
				capturedHex={capturedHex ?? ""}
				onSelect={handleSelect}
				onTryAgain={handleTryAgain}
				onDismiss={handleDismiss}
			/>
		</View>
	);
}
