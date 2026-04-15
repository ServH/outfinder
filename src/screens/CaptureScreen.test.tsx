import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { CaptureScreen } from "./CaptureScreen";

// Mock react-native-safe-area-context (used by ColorMatchSheet/OutOfCoverageSheet)
jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

// Mock ColorMatchSheet and OutOfCoverageSheet to avoid safe-area and Modal rendering complexity
jest.mock("@/components/ColorMatchSheet", () => ({
	ColorMatchSheet: () => null,
}));
jest.mock("@/components/OutOfCoverageSheet", () => ({
	OutOfCoverageSheet: () => null,
}));

// Mock expo-camera
let mockPermission: {
	granted: boolean;
	canAskAgain: boolean;
} | null = { granted: true, canAskAgain: true };
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

// Mock @react-native-community/slider
jest.mock("@react-native-community/slider", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		// biome-ignore lint/suspicious/noExplicitAny: slider mock for testing
		default: ({ testID, onValueChange }: any) => (
			<View testID={testID ?? "slider"} onValueChange={onValueChange} />
		),
	};
});

// Mock expo-symbols
jest.mock("expo-symbols", () => ({
	SymbolView: ({ name }: { name: string }) => {
		const { View } = require("react-native");
		return <View testID={`symbol-${name}`} />;
	},
}));

// Mock navigation
const mockGoBack = jest.fn();
const mockDispatch = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ goBack: mockGoBack, dispatch: mockDispatch }),
	CommonActions: {
		reset: jest.fn((config) => ({ type: "RESET", payload: config })),
	},
}));

// Mock haptics
jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

// Mock white-balance native module
jest.mock("../../modules/white-balance", () => ({
	applyWhiteBalance: jest
		.fn()
		.mockImplementation((uri: string) => Promise.resolve(uri)),
}));

// Mock react-native-image-colors
jest.mock("react-native-image-colors", () => ({
	getColors: jest.fn().mockResolvedValue({
		platform: "ios",
		primary: "#5A3E2B",
		secondary: "#A07050",
		background: "#F0E8D8",
		detail: "#C09070",
	}),
}));

// Track AnalysisOverlay visible prop history across renders
const mockOverlayVisibleCalls = jest.fn<void, [boolean]>();

// Mock AnalysisOverlay (Skia dependency)
jest.mock("@/components/AnalysisOverlay", () => ({
	AnalysisOverlay: ({ visible }: { visible: boolean }) => {
		mockOverlayVisibleCalls(visible);
		const { View } = require("react-native");
		return visible ? <View testID="analysis-overlay-mock" /> : null;
	},
}));

describe("CaptureScreen — permission granted", () => {
	beforeEach(() => {
		mockPermission = { granted: true, canAskAgain: true };
		mockGoBack.mockClear();
		mockDispatch.mockClear();
		mockRequestPermission.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
		mockTakePictureAsync.mockClear();
		mockOverlayVisibleCalls.mockClear();
	});

	it("renders camera view when permission is granted", () => {
		render(<CaptureScreen />);
		expect(screen.getByTestId("capture-screen")).toBeTruthy();
		expect(screen.getByTestId("camera-view")).toBeTruthy();
	});

	it("renders overlay hint text (AC #4)", () => {
		render(<CaptureScreen />);
		expect(
			screen.getByTestId("overlay-hint", { includeHiddenElements: true }),
		).toBeTruthy();
		expect(
			screen.getByText("Find natural light · Center the garment", {
				includeHiddenElements: true,
			}),
		).toBeTruthy();
	});

	it("capture button is present with correct accessibilityLabel (AC #6)", () => {
		render(<CaptureScreen />);
		const btn = screen.getByTestId("capture-button");
		expect(btn).toBeTruthy();
		expect(btn.props.accessibilityLabel).toBe("Take photo");
		expect(btn.props.accessibilityRole).toBe("button");
	});

	it("back button calls navigation.goBack (AC #7)", () => {
		render(<CaptureScreen />);
		fireEvent.press(screen.getByTestId("back-button"));
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("WB slider is hidden by default (AC #5)", () => {
		render(<CaptureScreen />);
		expect(screen.queryByTestId("wb-slider-container")).toBeNull();
	});

	it("tapping sun icon toggles WB slider (AC #5)", () => {
		render(<CaptureScreen />);
		expect(screen.queryByTestId("wb-slider-container")).toBeNull();
		fireEvent.press(screen.getByTestId("wb-toggle-button"));
		expect(screen.getByTestId("wb-slider-container")).toBeTruthy();
		expect(screen.getByTestId("wb-slider")).toBeTruthy();
	});

	it("WB temperature label shows default 5500K (AC #5)", () => {
		render(<CaptureScreen />);
		fireEvent.press(screen.getByTestId("wb-toggle-button"));
		expect(screen.getByTestId("wb-temperature-label")).toBeTruthy();
		expect(screen.getByText("5500K")).toBeTruthy();
	});

	it("tapping sun icon again hides WB slider (AC #5)", () => {
		render(<CaptureScreen />);
		fireEvent.press(screen.getByTestId("wb-toggle-button"));
		expect(screen.getByTestId("wb-slider-container")).toBeTruthy();
		fireEvent.press(screen.getByTestId("wb-toggle-button"));
		expect(screen.queryByTestId("wb-slider-container")).toBeNull();
	});

	it("WB toggle button has correct accessibilityLabel", () => {
		render(<CaptureScreen />);
		const btn = screen.getByTestId("wb-toggle-button");
		expect(btn.props.accessibilityLabel).toBe("White balance temperature");
	});

	it("tapping capture button fires hapticMedium (AC #5 — Story 12.3)", () => {
		render(<CaptureScreen />);
		fireEvent.press(screen.getByTestId("capture-button"));
		expect(hapticMedium as jest.Mock).toHaveBeenCalledTimes(1);
	});

	it("slider value change updates temperature label (AC #5)", () => {
		render(<CaptureScreen />);
		fireEvent.press(screen.getByTestId("wb-toggle-button"));
		fireEvent(screen.getByTestId("wb-slider"), "valueChange", 3000);
		expect(screen.getByText("3000K")).toBeTruthy();
	});

	it("AnalysisOverlay receives visible=true during capture pipeline (AC #3)", async () => {
		render(<CaptureScreen />);
		mockOverlayVisibleCalls.mockClear();

		await act(async () => {
			fireEvent.press(screen.getByTestId("capture-button"));
		});

		// After full pipeline completion, verify overlay was true at some point
		await waitFor(() => {
			const trueCalls = mockOverlayVisibleCalls.mock.calls.filter(
				([v]) => v === true,
			);
			expect(trueCalls.length).toBeGreaterThan(0);
		});
	});

	it("pipeline succeeds: no error shown to user (AC #3, #5)", async () => {
		render(<CaptureScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("capture-button"));
		});

		// After successful pipeline: overlay dismissed, no error regardless of match type
		await waitFor(() => {
			expect(screen.queryByTestId("analysis-overlay-mock")).toBeNull();
			expect(screen.queryByTestId("analysis-error-container")).toBeNull();
		});
	});

	it("shows analysis error text when applyWhiteBalance throws (AC #6)", async () => {
		const { applyWhiteBalance } = require("../../modules/white-balance");
		(applyWhiteBalance as jest.Mock).mockRejectedValueOnce(
			new Error("WB module error"),
		);

		render(<CaptureScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("capture-button"));
		});

		await waitFor(() => {
			expect(screen.getByTestId("analysis-error-container")).toBeTruthy();
			expect(
				screen.getByText("Could not analyse the photo. Please try again."),
			).toBeTruthy();
		});
	});
});

describe("CaptureScreen — permission denied, canAskAgain: true", () => {
	beforeEach(() => {
		mockPermission = { granted: false, canAskAgain: true };
		mockGoBack.mockClear();
		mockRequestPermission.mockClear();
	});

	it("calls requestPermission on mount when canAskAgain is true (AC #3)", () => {
		render(<CaptureScreen />);
		expect(mockRequestPermission).toHaveBeenCalledTimes(1);
	});

	it("renders denied fallback while awaiting permission", () => {
		render(<CaptureScreen />);
		expect(screen.getByTestId("permission-denied-view")).toBeTruthy();
	});
});

describe("CaptureScreen — permission denied", () => {
	beforeEach(() => {
		mockPermission = { granted: false, canAskAgain: false };
		mockGoBack.mockClear();
		mockRequestPermission.mockClear();
	});

	it("renders permission denied fallback (AC #3)", () => {
		render(<CaptureScreen />);
		expect(screen.getByTestId("permission-denied-view")).toBeTruthy();
		expect(screen.getByTestId("permission-denied-text")).toBeTruthy();
	});

	it("shows permission denied text (AC #3)", () => {
		render(<CaptureScreen />);
		expect(
			screen.getByText("Camera access is required to identify garment colors."),
		).toBeTruthy();
	});

	it("does NOT render camera view when permission denied", () => {
		render(<CaptureScreen />);
		expect(screen.queryByTestId("camera-view")).toBeNull();
		expect(screen.queryByTestId("capture-button")).toBeNull();
	});

	it("back button in denied state calls navigation.goBack", () => {
		render(<CaptureScreen />);
		fireEvent.press(screen.getByTestId("permission-back-button"));
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("does NOT call requestPermission when canAskAgain is false (AC #3)", () => {
		render(<CaptureScreen />);
		expect(mockRequestPermission).not.toHaveBeenCalled();
	});
});

describe("CaptureScreen — permission loading", () => {
	beforeEach(() => {
		mockPermission = null;
		mockGoBack.mockClear();
	});

	it("renders loading placeholder when permission is null", () => {
		render(<CaptureScreen />);
		expect(screen.getByTestId("permission-loading")).toBeTruthy();
	});
});
