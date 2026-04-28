import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { hapticLight, hapticMedium } from "@/lib/haptics";

const mockIsIOS17OrNewer = jest.fn(() => true);
jest.mock("@/lib/platform", () => ({
	isIOS17OrNewer: () => mockIsIOS17OrNewer(),
	useIsIOS17OrNewer: () => mockIsIOS17OrNewer(),
}));

// ---- Mocks -----------------------------------------------------------------

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

let mockPermission: {
	granted: boolean;
	canAskAgain: boolean;
	status: "undetermined" | "granted" | "denied";
} | null = { granted: true, canAskAgain: true, status: "granted" };
const mockRequestPermission = jest.fn().mockResolvedValue({ granted: true });
const mockTakePictureAsync = jest
	.fn()
	.mockResolvedValue({ uri: "file:///mock-photo.jpg" });

jest.mock("expo-camera", () => {
	const React = require("react");
	const { View } = require("react-native");
	const CameraView = React.forwardRef(
		({ testID }: { testID?: string }, ref: React.Ref<unknown>) => {
			React.useImperativeHandle(ref, () => ({
				takePictureAsync: mockTakePictureAsync,
			}));
			return <View testID={testID ?? "camera-view"} />;
		},
	);
	CameraView.displayName = "CameraView";
	return {
		CameraView,
		useCameraPermissions: () => [mockPermission, mockRequestPermission],
	};
});

jest.mock("expo-symbols", () => ({
	SymbolView: ({ name }: { name: string }) => {
		const { View } = require("react-native");
		return <View testID={`symbol-${name}`} />;
	},
}));

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock("expo-image-picker", () => ({
	requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
		mockRequestMediaLibraryPermissionsAsync(...args),
	launchImageLibraryAsync: (...args: unknown[]) =>
		mockLaunchImageLibraryAsync(...args),
}));

const mockRemoveBackground = jest.fn();
jest.mock("../../../modules/background-removal", () => ({
	removeBackground: (...args: unknown[]) => mockRemoveBackground(...args),
}));

const mockGoBack = jest.fn();
const mockPush = jest.fn();
const mockRouteParams: { onCutoutSaved?: (id: string) => void } | undefined =
	undefined;
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ goBack: mockGoBack, push: mockPush }),
	useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

// ---- Helpers ---------------------------------------------------------------

function loadScreen() {
	// Require inside each test so the isolated module cache picks up
	// whatever Platform.Version we mocked for the iOS<17 gate test.
	const { ArmarioCaptureScreen } = require("./ArmarioCaptureScreen") as {
		ArmarioCaptureScreen: React.ComponentType;
	};
	return ArmarioCaptureScreen;
}

async function flushMicrotasks() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

// ---- Tests -----------------------------------------------------------------

describe("ArmarioCaptureScreen", () => {
	beforeEach(() => {
		mockPermission = { granted: true, canAskAgain: true, status: "granted" };
		mockGoBack.mockClear();
		mockPush.mockClear();
		mockRequestPermission.mockClear();
		mockTakePictureAsync.mockClear();
		mockRequestMediaLibraryPermissionsAsync.mockReset();
		mockLaunchImageLibraryAsync.mockReset();
		mockRemoveBackground.mockReset();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
		mockIsIOS17OrNewer.mockReturnValue(true);
	});

	it("1. calls requestPermission exactly once when permission status is undetermined", () => {
		mockPermission = {
			granted: false,
			canAskAgain: true,
			status: "undetermined",
		};
		const Screen = loadScreen();
		const { rerender } = render(<Screen />);
		expect(mockRequestPermission).toHaveBeenCalledTimes(1);
		// Re-render: ref guard must prevent a second invocation.
		rerender(<Screen />);
		expect(mockRequestPermission).toHaveBeenCalledTimes(1);
	});

	it("2. renders armario-permission-denied-view and Settings button only when !canAskAgain", () => {
		mockPermission = { granted: false, canAskAgain: false, status: "denied" };
		const Screen = loadScreen();
		const { rerender } = render(<Screen />);
		expect(screen.getByTestId("armario-permission-denied-view")).toBeTruthy();
		expect(
			screen.getByTestId("armario-permission-settings-button"),
		).toBeTruthy();

		mockPermission = {
			granted: false,
			canAskAgain: true,
			status: "undetermined",
		};
		rerender(<Screen />);
		expect(screen.getByTestId("armario-permission-denied-view")).toBeTruthy();
		expect(
			screen.queryByTestId("armario-permission-settings-button"),
		).toBeNull();
	});

	it("3. granted + shutter → takePictureAsync → removeBackground → navigation.push to ArmarioPreview", async () => {
		mockRemoveBackground.mockResolvedValueOnce({
			cutoutUri: "file:///cutout.png",
			dominantHex: "#000000",
		});
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-capture-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(mockTakePictureAsync).toHaveBeenCalledWith({ quality: 0.8 });
			expect(mockRemoveBackground).toHaveBeenCalledWith(
				"file:///mock-photo.jpg",
			);
			expect(mockPush).toHaveBeenCalledWith("ArmarioPreview", {
				cutoutUri: "file:///cutout.png",
				sourceUri: "file:///mock-photo.jpg",
			});
		});
	});

	it("4. library branch routes through removeBackground → push (and cancel is a no-op)", async () => {
		// Cancel sub-case: permission granted, picker returns canceled.
		mockRequestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
			granted: true,
			canAskAgain: true,
		});
		mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true });
		mockRemoveBackground.mockResolvedValueOnce({
			cutoutUri: "file:///cutout-lib.png",
			dominantHex: "#000000",
		});

		const Screen = loadScreen();
		render(<Screen />);

		// Cancel path: no nav, no removeBackground.
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-library-button"));
		});
		await flushMicrotasks();
		expect(mockRemoveBackground).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();

		// Grant + pick path: removeBackground → navigation.push.
		mockRequestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
			granted: true,
			canAskAgain: true,
		});
		mockLaunchImageLibraryAsync.mockResolvedValueOnce({
			canceled: false,
			assets: [{ uri: "ph://library-photo.heic" }],
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-library-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(mockRemoveBackground).toHaveBeenCalledWith(
				"ph://library-photo.heic",
			);
			expect(mockPush).toHaveBeenCalledWith("ArmarioPreview", {
				cutoutUri: "file:///cutout-lib.png",
				sourceUri: "ph://library-photo.heic",
			});
		});
	});

	it("5. noSubject rejection → error sheet with correct copy → Dismiss clears and re-enables shutter", async () => {
		mockRemoveBackground.mockRejectedValueOnce({
			kind: "noSubject",
			message: "",
		});
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-capture-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("armario-error-sheet")).toBeTruthy();
			expect(
				screen.getByText(
					"We couldn't find the garment. Try a plain background with better light.",
				),
			).toBeTruthy();
		});

		// Dismiss clears the sheet.
		fireEvent.press(screen.getByTestId("armario-error-dismiss-button"));
		await waitFor(() => {
			expect(screen.queryByTestId("armario-error-sheet")).toBeNull();
		});

		// Shutter is re-enabled and its press-handler fires again.
		(mockTakePictureAsync as jest.Mock).mockClear();
		mockRemoveBackground.mockResolvedValueOnce({
			cutoutUri: "file:///cutout.png",
			dominantHex: "#000000",
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-capture-button"));
		});
		await flushMicrotasks();
		expect(mockTakePictureAsync).toHaveBeenCalled();
	});

	it("6. visionFailed / ioFailed / unknown-kind map to the correct copy", async () => {
		const cases = [
			{
				kind: "visionFailed",
				copy: "Background removal failed. Try again.",
			},
			{
				kind: "ioFailed",
				copy: "Couldn't read or save the photo. Try again.",
			},
			// Unknown kinds fall through to the visionFailed copy (defensive default).
			{
				kind: "unexpectedGarbage",
				copy: "Background removal failed. Try again.",
			},
		];

		for (const c of cases) {
			mockRemoveBackground.mockRejectedValueOnce({
				kind: c.kind,
				message: "",
			});
			const Screen = loadScreen();
			const { unmount } = render(<Screen />);

			await act(async () => {
				fireEvent.press(screen.getByTestId("armario-capture-button"));
			});
			await flushMicrotasks();

			await waitFor(() => {
				expect(screen.getByTestId("armario-error-sheet")).toBeTruthy();
				expect(screen.getByText(c.copy)).toBeTruthy();
			});

			unmount();
		}
	});

	it("7. iOS < 17 defensive gate — mount effect pops back and never mounts the capture-screen root", () => {
		mockIsIOS17OrNewer.mockReturnValue(false);
		const Screen = loadScreen();
		render(<Screen />);
		expect(mockGoBack).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId("armario-capture-screen")).toBeNull();
	});

	it("8. Unmount during an in-flight removeBackground does NOT trigger a state-update warning", async () => {
		let resolveRemoval:
			| ((value: { cutoutUri: string; dominantHex: string }) => void)
			| undefined;
		mockRemoveBackground.mockImplementationOnce(
			() =>
				new Promise<{ cutoutUri: string; dominantHex: string }>((resolve) => {
					resolveRemoval = resolve;
				}),
		);
		const Screen = loadScreen();
		const { unmount } = render(<Screen />);

		// Install spies BEFORE firing the action so early warnings are captured.
		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleWarn = jest
			.spyOn(console, "warn")
			.mockImplementation(() => {});

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-capture-button"));
		});
		await flushMicrotasks();

		unmount();
		await act(async () => {
			resolveRemoval?.({
				cutoutUri: "file:///cutout-late.png",
				dominantHex: "#000000",
			});
			await Promise.resolve();
			await Promise.resolve();
		});

		const lateStateUpdate = [
			...consoleError.mock.calls,
			...consoleWarn.mock.calls,
		].some((call) =>
			call.some(
				(arg) =>
					typeof arg === "string" &&
					arg.includes(
						"Can't perform a React state update on an unmounted component",
					),
			),
		);
		expect(lateStateUpdate).toBe(false);
		// Late-arriving resolve must NOT navigate either (unmount-guard).
		expect(mockPush).not.toHaveBeenCalled();

		consoleError.mockRestore();
		consoleWarn.mockRestore();
	});
});
