import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Linking,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { getColors } from "react-native-image-colors";
import type { ImageColorsResult } from "react-native-image-colors/build/types";
import { AnalysisOverlay } from "@/components/AnalysisOverlay";
import { ColorMatchSheet } from "@/components/ColorMatchSheet";
import { OutOfCoverageSheet } from "@/components/OutOfCoverageSheet";
import { hexToLab, normalizeHex } from "@/lib/colorConversion";
import { classifyMatch, matchWadaColor } from "@/lib/colorMatch";
import type { MatchResult } from "@/lib/colorTypes";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import type { ColorsStackParamList } from "@/navigation/types";
import { applyWhiteBalance, WB_AUTO_MODE } from "../../modules/white-balance";

type CaptureScreenNav = NativeStackNavigationProp<
	ColorsStackParamList,
	"CaptureScreen"
>;

// Magenta sentinel for `getColors` fallback. Wada's 159 colors do not include
// a pure magenta, so receiving this value back unambiguously means extraction
// failed — distinguishable from any legitimate dominant colour the camera
// might capture (including grays that would collide with the library default).
const EXTRACTION_FAILED_HEX = "#FF00FF";

// Square frame the user sees and targets. MUST match the Swift-side center
// crop fraction in WhiteBalanceModule.swift — both are set to 65% of the
// shorter edge so the on-screen framing rectangle corresponds exactly to the
// region the analysis pipeline samples.
const ANALYSIS_FRAME_FRACTION = 0.65;

/** Corner brackets showing the user exactly what region the pipeline will
 *  analyse. Non-interactive (pointerEvents="none") so camera taps pass through.
 */
function AnalysisFrame({ size }: { size: number }) {
	const bracket = 24;
	const thick = 3;
	const color = "rgba(255,255,255,0.9)";
	return (
		<View
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<View style={{ width: size, height: size }}>
				<View
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: bracket,
						height: bracket,
						borderTopWidth: thick,
						borderLeftWidth: thick,
						borderColor: color,
					}}
				/>
				<View
					style={{
						position: "absolute",
						top: 0,
						right: 0,
						width: bracket,
						height: bracket,
						borderTopWidth: thick,
						borderRightWidth: thick,
						borderColor: color,
					}}
				/>
				<View
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						width: bracket,
						height: bracket,
						borderBottomWidth: thick,
						borderLeftWidth: thick,
						borderColor: color,
					}}
				/>
				<View
					style={{
						position: "absolute",
						bottom: 0,
						right: 0,
						width: bracket,
						height: bracket,
						borderBottomWidth: thick,
						borderRightWidth: thick,
						borderColor: color,
					}}
				/>
			</View>
		</View>
	);
}

export function CaptureScreen() {
	const { t } = useTranslation();
	const navigation = useNavigation<CaptureScreenNav>();
	const { width: winW, height: winH } = useWindowDimensions();
	const frameSize = Math.min(winW, winH) * ANALYSIS_FRAME_FRACTION;
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
	// Tracks whether the user has manually moved the WB slider this session.
	// Until then, the capture pipeline runs in auto mode regardless of the
	// slider's displayed value — so the default 5500K display does not collide
	// with a deliberate manual 5500K choice.
	const userAdjustedWb = useRef(false);
	// Flipped to false on unmount so the async pipeline below can short-circuit
	// before touching state or navigation on a screen the user already left.
	const isMounted = useRef(true);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	// All hooks called before any early returns (Rules of Hooks)

	// Request permission once when status is undetermined (AC #3). Gating on the
	// status enum is more reliable than `!granted && canAskAgain` — those flags
	// can briefly desync during the OS dialog. The ref guard prevents re-fire if
	// `requestPermission` identity is unstable across renders. Resets on
	// rejection so the user can retry from the denied view.
	useEffect(() => {
		if (
			permission?.status === "undetermined" &&
			!hasRequestedPermission.current
		) {
			hasRequestedPermission.current = true;
			requestPermission().catch(() => {
				hasRequestedPermission.current = false;
			});
		}
	}, [permission, requestPermission]);

	function handleSelect(colorId: string) {
		setMatchState(null);
		navigation.replace("Combinations", {
			colorId,
			capturedHex: capturedHex ?? undefined,
		});
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

	function handleOpenSettings() {
		Linking.openSettings().catch(() => {
			// If Settings cannot be opened, the user can still tap back.
		});
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
			// CameraView ref may be null during teardown / permission flips. Surface a
			// dedicated error rather than crashing inside the optional-chain.
			if (!cameraRef.current) {
				setAnalysisError(t("colorCapture.cameraNotReady"));
				return;
			}
			// Show overlay synchronously so the screen is visually locked while we
			// wait for `takePictureAsync` (200–800ms). Without this, the user sees
			// idle UI and can toggle WB / tap back during the silent gap.
			setAnalysisVisible(true);
			setAnalysisError(null);
			const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
			if (!isMounted.current) return;
			// iOS can resolve `takePictureAsync` to `undefined` when the shutter is
			// aborted (backgrounding, session torn down). Treat as not-ready, not
			// as a generic "analysis failed" — the user can simply try again.
			if (!photo) {
				setAnalysisVisible(false);
				setAnalysisError(t("colorCapture.cameraNotReady"));
				return;
			}

			// Auto-WB unless the user has explicitly moved the slider this session.
			const wbMode = userAdjustedWb.current ? wbTemperature : WB_AUTO_MODE;
			const correctedUri = await applyWhiteBalance(photo.uri, wbMode);
			if (!isMounted.current) return;

			const colors: ImageColorsResult = await getColors(correctedUri, {
				fallback: EXTRACTION_FAILED_HEX,
			});
			if (!isMounted.current) return;

			// `background` is the dominant pixel colour of the image on iOS (Apple
			// Music-style naming where `primary` = best *foreground text* colour
			// over the background). For clothing extraction we want the dominant
			// image pixels, not the contrasting text colour.
			const rawDominant =
				colors.platform === "ios" ? colors.background : colors.dominant;

			// Normalise for short-form / alpha hex variants the library may emit
			// across platforms or future versions, then verify extraction succeeded.
			const dominantHex = normalizeHex(rawDominant);
			if (!dominantHex || dominantHex === EXTRACTION_FAILED_HEX) {
				setAnalysisVisible(false);
				setAnalysisError(t("colorCapture.analysisError"));
				return;
			}

			const capturedLab = hexToLab(dominantHex);
			const matches = matchWadaColor(capturedLab);
			const result = classifyMatch(matches);

			setAnalysisVisible(false);

			if (result.type === "direct") {
				navigation.replace("Combinations", {
					colorId: result.match.color.id,
					capturedHex: dominantHex,
				});
			} else {
				setCapturedHex(dominantHex);
				setMatchState(result);
			}
		} catch (err) {
			if (__DEV__) console.error("[CaptureScreen] analysis failed:", err);
			if (!isMounted.current) return;
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
				{permission.canAskAgain ? null : (
					<Pressable
						onPress={handleOpenSettings}
						accessibilityRole="button"
						accessibilityLabel={t("colorCapture.openSettings")}
						className="mt-4 min-h-[44px] justify-center"
						testID="permission-settings-button"
					>
						<Text
							style={{
								fontFamily: "Inter_400Regular",
								fontSize: 16,
								color: "white",
								textDecorationLine: "underline",
							}}
						>
							{t("colorCapture.openSettings")}
						</Text>
					</Pressable>
				)}
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

			{/* Analysis framing guide — user centres garment inside these brackets.
			    Matched to the Swift-side center crop (65% of shorter edge). */}
			<AnalysisFrame size={frameSize} />

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
						onValueChange={(v) => {
							userAdjustedWb.current = true;
							setWbTemperature(v);
						}}
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
							opacity: 0.85,
						}}
						testID="wb-temperature-label"
					>
						{t("colorCapture.wbTempLabel", { temp: wbTemperature })}
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
