import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Linking,
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hexToLab } from "@/lib/colorConversion";
import { classifyMatch, matchWadaColor } from "@/lib/colorMatch";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import type {
	RootStackParamList,
	UnifiedCameraStackParamList,
} from "@/navigation/types";
import {
	type BackgroundRemovalError,
	type BackgroundRemovalErrorKind,
	removeBackground,
} from "../../../modules/background-removal";

type UnifiedCameraNav = NativeStackNavigationProp<
	UnifiedCameraStackParamList,
	"Capture"
>;

type UnifiedCameraCaptureScreenProps = Record<string, never>;

const BACKGROUND_REMOVAL_ERROR_KINDS = new Set<BackgroundRemovalErrorKind>([
	"noSubject",
	"visionFailed",
	"ioFailed",
]);

function isBackgroundRemovalError(e: unknown): e is BackgroundRemovalError {
	if (!e || typeof e !== "object") return false;
	const kind = (e as { kind?: unknown }).kind;
	return (
		typeof kind === "string" &&
		BACKGROUND_REMOVAL_ERROR_KINDS.has(kind as BackgroundRemovalErrorKind)
	);
}

export function UnifiedCameraCaptureScreen(
	_props: UnifiedCameraCaptureScreenProps,
) {
	const { t } = useTranslation();
	const navigation = useNavigation<UnifiedCameraNav>();
	const insets = useSafeAreaInsets();
	const cameraRef = useRef<CameraView>(null);
	const [permission, requestPermission] = useCameraPermissions();
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<BackgroundRemovalErrorKind | null>(null);
	const isCapturing = useRef(false);
	const hasRequestedPermission = useRef(false);
	// Flipped false on unmount so the async pipeline below can short-circuit
	// before touching state or navigation on a screen the user already left.
	const isMounted = useRef(true);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

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

	function handleBack() {
		navigation
			.getParent<NativeStackNavigationProp<RootStackParamList>>()
			?.goBack();
	}

	function handleOpenSettings() {
		Linking.openSettings().catch(() => {
			// Settings unavailable — the user can still tap back.
		});
	}

	function handleRetry() {
		setError(null);
	}

	async function runPipeline(sourceUri: string) {
		setProcessing(true);
		setError(null);
		try {
			const { cutoutUri, dominantHex } = await removeBackground(sourceUri);
			if (!isMounted.current) return;
			const lab = hexToLab(dominantHex);
			const matches = matchWadaColor(lab);
			const wadaMatch = classifyMatch(matches);
			setProcessing(false);
			hapticLight();
			navigation.push("Result", { cutoutUri, dominantHex, wadaMatch });
		} catch (e) {
			if (!isMounted.current) return;
			setProcessing(false);
			if (isBackgroundRemovalError(e)) {
				setError(e.kind);
			} else {
				setError("visionFailed");
			}
		}
	}

	async function takePicture() {
		if (isCapturing.current || processing) return;
		isCapturing.current = true;
		try {
			hapticMedium();
			if (!cameraRef.current) {
				setError("visionFailed");
				return;
			}
			const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
			if (!isMounted.current) return;
			if (!photo) {
				setError("visionFailed");
				return;
			}
			await runPipeline(photo.uri);
		} catch (e) {
			if (__DEV__) {
				console.warn("[UnifiedCameraCaptureScreen] takePicture failed:", e);
			}
			if (!isMounted.current) return;
			setError("visionFailed");
		} finally {
			isCapturing.current = false;
		}
	}

	function renderErrorSheet() {
		if (error === null) return null;
		const copy =
			error === "noSubject"
				? t("unifiedCamera.capture.errorNoSubject")
				: error === "ioFailed"
					? t("unifiedCamera.capture.errorIoFailed")
					: t("unifiedCamera.capture.errorVisionFailed");
		return (
			<View
				testID="unified-camera-error-sheet"
				accessibilityRole="alert"
				accessibilityLiveRegion="assertive"
				className="absolute left-4 right-4 rounded-[14px]"
				style={{
					bottom: 200,
					backgroundColor: "rgba(0,0,0,0.82)",
					paddingHorizontal: 16,
					paddingVertical: 16,
				}}
			>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 14,
						color: "white",
						textAlign: "center",
						lineHeight: 20,
					}}
				>
					{copy}
				</Text>
				<View className="flex-row justify-center mt-3">
					<Pressable
						testID="unified-camera-error-retry-button"
						onPress={handleRetry}
						accessibilityRole="button"
						accessibilityLabel={t("unifiedCamera.capture.retry")}
						className="min-h-[44px] justify-center"
					>
						<Text
							style={{
								fontFamily: "Inter_500Medium",
								fontSize: 14,
								color: "white",
								textDecorationLine: "underline",
							}}
						>
							{t("unifiedCamera.capture.retry")}
						</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	// Permission loading
	if (!permission) {
		return (
			<View
				className="flex-1 bg-black"
				testID="unified-camera-permission-loading"
			/>
		);
	}

	// Permission denied
	if (!permission.granted) {
		return (
			<View
				className="flex-1 bg-black items-center justify-center px-8"
				testID="unified-camera-permission-denied-view"
			>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 14,
						color: "white",
						textAlign: "center",
						opacity: 0.75,
					}}
					testID="unified-camera-permission-denied-text"
				>
					{t("colorCapture.permissionDenied")}
				</Text>
				{permission.canAskAgain ? null : (
					<Pressable
						onPress={handleOpenSettings}
						accessibilityRole="button"
						accessibilityLabel={t("colorCapture.openSettings")}
						className="mt-4 min-h-[44px] justify-center"
						testID="unified-camera-permission-settings-button"
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
					accessibilityLabel={t("colorCapture.closeCameraLabel")}
					className="mt-4 min-h-[44px] justify-center"
					testID="unified-camera-permission-back-button"
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 16,
							color: "white",
						}}
					>
						{t("colorCapture.closeCameraLabel")}
					</Text>
				</Pressable>
			</View>
		);
	}

	const disableControls = processing || error !== null;

	return (
		<View className="flex-1 bg-black" testID="unified-camera-capture-screen">
			<CameraView
				ref={cameraRef}
				facing="back"
				style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
				testID="unified-camera-view"
			/>

			{/* Close button (preserves the 14.3a placeholder affordance). */}
			<Pressable
				testID="unified-camera-capture-back"
				accessibilityRole="button"
				accessibilityLabel={t("colorCapture.closeCameraLabel")}
				onPress={handleBack}
				hitSlop={12}
				className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-surface"
				style={{ top: insets.top + 8 }}
				disabled={disableControls}
				accessibilityState={{ disabled: disableControls }}
			>
				<Text className="text-lg text-primary">✕</Text>
			</Pressable>

			{/* Hint copy — centered mid-lower-third, per UX-DR1 Capture frame. */}
			<View
				testID="unified-camera-hint"
				className="absolute self-center"
				style={{ bottom: 200 }}
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
							fontFamily: "NotoSerifJP_400Regular",
							fontSize: 18,
							color: "white",
						}}
					>
						{t("unifiedCamera.capture.hint")}
					</Text>
				</View>
			</View>

			{/* Primary capture button (80pt per UX-DR1 frame 6nPEq). */}
			<Pressable
				testID="unified-camera-capture-button"
				onPress={takePicture}
				accessibilityRole="button"
				accessibilityLabel={t("unifiedCamera.capture.captureButtonLabel")}
				className="absolute self-center"
				style={{ bottom: 48, width: 80, height: 80 }}
				disabled={disableControls}
				accessibilityState={{ disabled: disableControls }}
			>
				{({ pressed }) => (
					<View
						className="flex-1 rounded-full bg-white items-center justify-center"
						style={{
							opacity: pressed ? 0.8 : disableControls ? 0.6 : 1,
							shadowColor: "#000",
							shadowOpacity: 0.3,
							shadowRadius: 8,
							shadowOffset: { width: 0, height: 2 },
						}}
					/>
				)}
			</Pressable>

			{renderErrorSheet()}

			{processing && (
				<View
					className="absolute inset-0 items-center justify-center"
					style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
					testID="unified-camera-processing-overlay"
				>
					<ActivityIndicator size="large" color="white" />
					<Text
						accessibilityLiveRegion="polite"
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 15,
							color: "white",
							marginTop: 16,
							textAlign: "center",
						}}
						testID="unified-camera-processing-text"
					>
						{t("unifiedCamera.capture.processing")}
					</Text>
				</View>
			)}
		</View>
	);
}
