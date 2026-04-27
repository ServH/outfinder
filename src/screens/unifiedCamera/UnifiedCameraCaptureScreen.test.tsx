import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { hapticLight, hapticMedium } from "@/lib/haptics";

let mockPermission: {
	granted: boolean;
	canAskAgain: boolean;
	status: "undetermined" | "granted" | "denied";
} | null = { granted: true, canAskAgain: true, status: "granted" };
const mockRequestPermission = jest.fn().mockResolvedValue({ granted: true });
const mockTakePictureAsync = jest.fn();

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

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRemoveBackground = jest.fn();
jest.mock("../../../modules/background-removal", () => ({
	removeBackground: (...args: unknown[]) => mockRemoveBackground(...args),
}));

const mockGoBack = jest.fn();
const mockPush = jest.fn();
type ParentNav = { goBack: () => void } | undefined;
const mockGetParent = jest.fn<ParentNav, []>(() => ({ goBack: mockGoBack }));
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		push: mockPush,
		getParent: mockGetParent,
	}),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

// Use the real colorMatch/colorConversion — they are pure JS and produce
// deterministic output from a known hex. This keeps the assertion honest
// about the pipeline connecting removeBackground → hexToLab → matchWadaColor
// → classifyMatch → navigation.push.
import { UnifiedCameraCaptureScreen } from "./UnifiedCameraCaptureScreen";

async function flushMicrotasks() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

describe("UnifiedCameraCaptureScreen", () => {
	beforeEach(async () => {
		await AsyncStorage.clear();
		mockPermission = { granted: true, canAskAgain: true, status: "granted" };
		mockGoBack.mockClear();
		mockPush.mockClear();
		mockGetParent.mockClear();
		mockRequestPermission.mockClear();
		mockTakePictureAsync.mockReset();
		mockTakePictureAsync.mockResolvedValue({ uri: "file:///mock-photo.jpg" });
		mockRemoveBackground.mockReset();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
	});

	it("renders the capture screen when permission is granted", () => {
		render(<UnifiedCameraCaptureScreen />);
		expect(screen.getByTestId("unified-camera-capture-screen")).toBeTruthy();
		expect(screen.getByTestId("unified-camera-view")).toBeTruthy();
		expect(screen.getByTestId("unified-camera-capture-button")).toBeTruthy();
		expect(screen.getByText("unifiedCamera.capture.hint")).toBeTruthy();
	});

	it("closes the modal via getParent().goBack() when the back button is pressed", () => {
		render(<UnifiedCameraCaptureScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-capture-back"));
		expect(mockGetParent).toHaveBeenCalled();
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("happy path: takePicture → removeBackground → matchWadaColor → navigate with typed params", async () => {
		mockRemoveBackground.mockResolvedValueOnce({
			cutoutUri: "file:///cutout.png",
			dominantHex: "#7A3F2B",
		});

		render(<UnifiedCameraCaptureScreen />);
		await act(async () => {
			fireEvent.press(screen.getByTestId("unified-camera-capture-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(hapticMedium).toHaveBeenCalledTimes(1);
			expect(mockTakePictureAsync).toHaveBeenCalledWith({ quality: 0.8 });
			expect(mockRemoveBackground).toHaveBeenCalledWith(
				"file:///mock-photo.jpg",
			);
			expect(hapticLight).toHaveBeenCalledTimes(1);
			expect(mockPush).toHaveBeenCalledTimes(1);
		});

		const [routeName, params] = mockPush.mock.calls[0];
		expect(routeName).toBe("Result");
		expect(params.cutoutUri).toBe("file:///cutout.png");
		expect(params.dominantHex).toBe("#7A3F2B");
		expect(params.sourceUri).toBe("file:///mock-photo.jpg");
		expect(params.wadaMatch).toBeDefined();
		expect(["direct", "confirm", "out-of-coverage"]).toContain(
			params.wadaMatch.type,
		);
	});

	it.each([
		["noSubject", "unifiedCamera.capture.errorNoSubject"],
		["visionFailed", "unifiedCamera.capture.errorVisionFailed"],
		["ioFailed", "unifiedCamera.capture.errorIoFailed"],
	])("renders error sheet with correct copy when removeBackground rejects with kind=%s", async (kind, expectedCopyKey) => {
		mockRemoveBackground.mockRejectedValueOnce({ kind, message: "" });
		render(<UnifiedCameraCaptureScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("unified-camera-capture-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("unified-camera-error-sheet")).toBeTruthy();
			expect(screen.getByText(expectedCopyKey)).toBeTruthy();
		});
		expect(mockPush).not.toHaveBeenCalled();

		// Retry clears the sheet and returns to ready state (no navigation).
		fireEvent.press(screen.getByTestId("unified-camera-error-retry-button"));
		await waitFor(() => {
			expect(screen.queryByTestId("unified-camera-error-sheet")).toBeNull();
		});
		expect(mockGoBack).not.toHaveBeenCalled();
	});

	it("takePictureAsync returning null surfaces the visionFailed sheet", async () => {
		mockTakePictureAsync.mockResolvedValueOnce(null);
		render(<UnifiedCameraCaptureScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("unified-camera-capture-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("unified-camera-error-sheet")).toBeTruthy();
			expect(
				screen.getByText("unifiedCamera.capture.errorVisionFailed"),
			).toBeTruthy();
		});
		expect(mockRemoveBackground).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("unmount during in-flight removeBackground does not navigate or warn", async () => {
		let resolveRemoval:
			| ((value: { cutoutUri: string; dominantHex: string }) => void)
			| undefined;
		mockRemoveBackground.mockImplementationOnce(
			() =>
				new Promise<{ cutoutUri: string; dominantHex: string }>((resolve) => {
					resolveRemoval = resolve;
				}),
		);
		const { unmount } = render(<UnifiedCameraCaptureScreen />);

		const consoleError = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleWarn = jest
			.spyOn(console, "warn")
			.mockImplementation(() => {});

		await act(async () => {
			fireEvent.press(screen.getByTestId("unified-camera-capture-button"));
		});
		await flushMicrotasks();

		unmount();
		await act(async () => {
			resolveRemoval?.({
				cutoutUri: "file:///late.png",
				dominantHex: "#123456",
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
		expect(mockPush).not.toHaveBeenCalled();

		consoleError.mockRestore();
		consoleWarn.mockRestore();
	});

	describe("camera FAB first-use coach mark (Story 15.3)", () => {
		const COACH_KEY = "@outfinder/coachmark:camera-fab-firstuse";

		it("first mount with no AsyncStorage flag → overlay visible with body copy", async () => {
			render(<UnifiedCameraCaptureScreen />);
			await flushMicrotasks();

			await waitFor(() => {
				expect(screen.getByTestId("unified-camera-coach-mark")).toBeTruthy();
			});
			expect(screen.getByText("unifiedCamera.coachMark.text")).toBeTruthy();
		});

		it("dismiss → AsyncStorage.setItem(key,'true') + hapticLight + overlay leaves the tree", async () => {
			(AsyncStorage.setItem as jest.Mock).mockClear();
			render(<UnifiedCameraCaptureScreen />);
			await flushMicrotasks();

			await waitFor(() => {
				expect(screen.getByTestId("unified-camera-coach-mark")).toBeTruthy();
			});

			await act(async () => {
				fireEvent.press(
					screen.getByTestId("unified-camera-coach-mark-dismiss"),
				);
			});

			await waitFor(() => {
				expect(AsyncStorage.setItem).toHaveBeenCalledWith(COACH_KEY, "true");
				expect(hapticLight).toHaveBeenCalledTimes(1);
				expect(screen.queryByTestId("unified-camera-coach-mark")).toBeNull();
			});
		});

		it("remount with already-seen flag → overlay never appears", async () => {
			await AsyncStorage.setItem(COACH_KEY, "true");

			render(<UnifiedCameraCaptureScreen />);
			await flushMicrotasks();
			await flushMicrotasks();

			expect(screen.queryByTestId("unified-camera-coach-mark")).toBeNull();
		});

		it("permission denied → overlay never appears even with shouldShow true", async () => {
			mockPermission = {
				granted: false,
				canAskAgain: true,
				status: "denied",
			};

			render(<UnifiedCameraCaptureScreen />);
			await flushMicrotasks();
			await flushMicrotasks();

			expect(screen.queryByTestId("unified-camera-coach-mark")).toBeNull();
		});
	});
});
