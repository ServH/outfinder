import { useNavigation, useRoute } from "@react-navigation/native";
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Linking,
	Pressable,
	Text,
	View,
} from "react-native";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { useIsIOS17OrNewer } from "@/lib/platform";
import type { ArmarioStackParamList } from "@/navigation/types";
import {
	type BackgroundRemovalError,
	type BackgroundRemovalErrorKind,
	removeBackground,
} from "../../../modules/background-removal";

type ArmarioCaptureNav = NativeStackNavigationProp<
	ArmarioStackParamList,
	"ArmarioCapture"
>;

type ArmarioCaptureRoute = NativeStackScreenProps<
	ArmarioStackParamList,
	"ArmarioCapture"
>["route"];

type ErrorSource =
	| { kind: BackgroundRemovalErrorKind }
	| { kind: "libraryPermissionDenied"; canAskAgain: boolean };

type ArmarioCaptureScreenProps = Record<string, never>;

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

export function ArmarioCaptureScreen(_props: ArmarioCaptureScreenProps) {
	const { t } = useTranslation();
	const navigation = useNavigation<ArmarioCaptureNav>();
	const route = useRoute<ArmarioCaptureRoute>();
	const onCutoutSaved = route.params?.onCutoutSaved;
	const cameraRef = useRef<CameraView>(null);
	const [permission, requestPermission] = useCameraPermissions();
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<ErrorSource | null>(null);
	const isCapturing = useRef(false);
	const hasRequestedPermission = useRef(false);
	// Flipped false on unmount so the async pipelines below can short-circuit
	// before touching state or navigation on a screen the user already left.
	const isMounted = useRef(true);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	// Primary gating for iOS 17+ happens upstream in Story 13.4a's entry points.
	// This effect is a secondary safety net: if a caller bypasses the gate, the
	// screen pops immediately so the user never sees a half-rendered flow.
	const supportsVision = useIsIOS17OrNewer();
	useEffect(() => {
		if (!supportsVision) {
			navigation.goBack();
		}
	}, [supportsVision, navigation]);

	// Request camera permission once when status is undetermined. Ref guard
	// prevents re-fire if `requestPermission` identity is unstable across
	// renders. Resets on rejection so the user can retry from the denied view.
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
		navigation.goBack();
	}

	function handleOpenSettings() {
		Linking.openSettings().catch(() => {
			// Settings unavailable — the user can still tap back.
		});
	}

	function handleErrorDismiss() {
		setError(null);
	}

	async function handlePhoto(uri: string) {
		setProcessing(true);
		setError(null);
		try {
			const cutoutUri = await removeBackground(uri);
			if (!isMounted.current) return;
			setProcessing(false);
			hapticLight();
			navigation.push("ArmarioPreview", {
				cutoutUri,
				sourceUri: uri,
				onCutoutSaved,
			});
		} catch (e) {
			if (!isMounted.current) return;
			setProcessing(false);
			if (isBackgroundRemovalError(e)) {
				const kind = e.kind;
				if (
					kind === "noSubject" ||
					kind === "visionFailed" ||
					kind === "ioFailed"
				) {
					setError({ kind });
				} else {
					setError({ kind: "visionFailed" });
				}
			} else {
				setError({ kind: "visionFailed" });
			}
		}
	}

	async function takePicture() {
		if (isCapturing.current || processing) return;
		isCapturing.current = true;
		try {
			hapticMedium();
			if (!cameraRef.current) {
				setError({ kind: "visionFailed" });
				return;
			}
			const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
			if (!isMounted.current) return;
			if (!photo) {
				setError({ kind: "visionFailed" });
				return;
			}
			await handlePhoto(photo.uri);
		} catch (e) {
			if (__DEV__) {
				console.warn("[ArmarioCaptureScreen] takePicture failed:", e);
			}
			if (!isMounted.current) return;
			setError({ kind: "visionFailed" });
		} finally {
			isCapturing.current = false;
		}
	}

	async function pickFromLibrary() {
		if (isCapturing.current || processing) return;
		try {
			const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!isMounted.current) return;
			if (!perm.granted) {
				setError({
					kind: "libraryPermissionDenied",
					canAskAgain: perm.canAskAgain,
				});
				return;
			}
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: false,
				quality: 1,
			});
			if (!isMounted.current) return;
			if (result.canceled) return;
			const asset = result.assets[0];
			if (!asset?.uri) return;
			await handlePhoto(asset.uri);
		} catch (e) {
			if (__DEV__) {
				console.warn("[ArmarioCaptureScreen] pickFromLibrary failed:", e);
			}
			if (!isMounted.current) return;
			setError({ kind: "visionFailed" });
		}
	}

	function renderErrorSheet() {
		if (!error) return null;
		const copy =
			error.kind === "libraryPermissionDenied"
				? t("armario.capture.libraryPermissionDenied")
				: error.kind === "noSubject"
					? t("armario.capture.errorNoSubject")
					: error.kind === "ioFailed"
						? t("armario.capture.errorIoFailed")
						: t("armario.capture.errorVisionFailed");

		const showSettings =
			error.kind === "libraryPermissionDenied" && !error.canAskAgain;

		return (
			<View
				testID="armario-error-sheet"
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
				<View className="flex-row justify-center mt-3 gap-6">
					{showSettings && (
						<Pressable
							testID="armario-error-settings-button"
							onPress={handleOpenSettings}
							accessibilityRole="button"
							accessibilityLabel={t("armario.capture.openSettings")}
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
								{t("armario.capture.openSettings")}
							</Text>
						</Pressable>
					)}
					<Pressable
						testID="armario-error-dismiss-button"
						onPress={handleErrorDismiss}
						accessibilityRole="button"
						accessibilityLabel={t("armario.capture.errorDismiss")}
						className="min-h-[44px] justify-center"
					>
						<Text
							style={{
								fontFamily: "Inter_500Medium",
								fontSize: 14,
								color: "white",
							}}
						>
							{t("armario.capture.errorDismiss")}
						</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	// iOS < 17 defensive gate — render nothing while the mount effect pops back.
	// Primary gating lives in Story 13.4a entry points.
	if (!supportsVision) {
		return <View className="flex-1 bg-black" />;
	}

	// Permission loading state
	if (!permission) {
		return (
			<View className="flex-1 bg-black" testID="armario-permission-loading" />
		);
	}

	// Permission denied state
	if (!permission.granted) {
		return (
			<View
				className="flex-1 bg-black items-center justify-center px-8"
				testID="armario-permission-denied-view"
			>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 14,
						color: "white",
						textAlign: "center",
						opacity: 0.75,
					}}
					testID="armario-permission-denied-text"
				>
					{t("armario.capture.permissionDenied")}
				</Text>
				{permission.canAskAgain ? null : (
					<Pressable
						onPress={handleOpenSettings}
						accessibilityRole="button"
						accessibilityLabel={t("armario.capture.openSettings")}
						className="mt-4 min-h-[44px] justify-center"
						testID="armario-permission-settings-button"
					>
						<Text
							style={{
								fontFamily: "Inter_400Regular",
								fontSize: 16,
								color: "white",
								textDecorationLine: "underline",
							}}
						>
							{t("armario.capture.openSettings")}
						</Text>
					</Pressable>
				)}
				<Pressable
					onPress={handleBack}
					accessibilityRole="button"
					accessibilityLabel={t("armario.capture.goBack")}
					className="mt-4 min-h-[44px] justify-center"
					testID="armario-permission-back-button"
				>
					<Text
						style={{
							fontFamily: "Inter_400Regular",
							fontSize: 16,
							color: "white",
						}}
					>
						{t("armario.capture.goBack")}
					</Text>
				</Pressable>
			</View>
		);
	}

	const disableControls = processing || error !== null;

	return (
		<View className="flex-1 bg-black" testID="armario-capture-screen">
			{/* Full-screen camera preview — stays mounted during processing so the
			    back branch can resume without a cold camera restart. */}
			<CameraView
				ref={cameraRef}
				facing="back"
				style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
				testID="armario-camera-view"
			/>

			{/* Back chevron */}
			<Pressable
				onPress={handleBack}
				accessibilityRole="button"
				accessibilityLabel={t("armario.capture.goBack")}
				className="absolute items-center justify-center"
				style={{ top: 56, left: 20, width: 48, height: 48 }}
				testID="armario-back-button"
				disabled={disableControls}
				accessibilityState={{ disabled: disableControls }}
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

			{/* Guidance pill — centered near the bottom, above the CTAs. */}
			<View
				className="absolute self-center"
				style={{ bottom: 160 }}
				accessibilityElementsHidden
				testID="armario-guidance-hint"
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
						{t("armario.capture.guidanceHint")}
					</Text>
				</View>
			</View>

			{/* Secondary library CTA */}
			<Pressable
				onPress={pickFromLibrary}
				accessibilityRole="button"
				accessibilityLabel={t("armario.capture.chooseLibraryButtonLabel")}
				className="absolute self-center min-w-[44px] min-h-[44px] px-4 items-center justify-center rounded-full"
				style={{
					bottom: 100,
					backgroundColor: "rgba(0,0,0,0.55)",
				}}
				testID="armario-library-button"
				disabled={disableControls}
				accessibilityState={{ disabled: disableControls }}
			>
				{({ pressed }) => (
					<Text
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 14,
							color: "white",
							opacity: pressed ? 0.7 : disableControls ? 0.6 : 1,
						}}
					>
						{t("armario.capture.chooseLibraryButtonLabel")}
					</Text>
				)}
			</Pressable>

			{/* Primary capture button */}
			<Pressable
				onPress={takePicture}
				accessibilityRole="button"
				accessibilityLabel={t("armario.capture.captureButtonLabel")}
				className="absolute self-center"
				style={{ bottom: 28, width: 56, height: 56 }}
				testID="armario-capture-button"
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

			{/* Inline error sheet (shared between library-permission-denied
			    and BackgroundRemovalError kinds per AC #3 + #6). */}
			{renderErrorSheet()}

			{/* Processing overlay — full-screen dim over the live preview. */}
			{processing && (
				<View
					className="absolute inset-0 items-center justify-center"
					style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
					testID="armario-processing-overlay"
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
						testID="armario-processing-text"
					>
						{t("armario.capture.removingBackground")}
					</Text>
				</View>
			)}
		</View>
	);
}
