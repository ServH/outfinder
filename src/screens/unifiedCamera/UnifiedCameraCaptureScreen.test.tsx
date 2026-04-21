import { fireEvent, render, screen } from "@testing-library/react-native";

const mockGoBack = jest.fn();
type ParentNav = { goBack: () => void } | undefined;
const mockGetParent = jest.fn<ParentNav, []>(() => ({ goBack: mockGoBack }));

jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		getParent: mockGetParent,
	}),
}));

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

import { UnifiedCameraCaptureScreen } from "./UnifiedCameraCaptureScreen";

describe("UnifiedCameraCaptureScreen (placeholder)", () => {
	beforeEach(() => {
		mockGoBack.mockClear();
		mockGetParent.mockClear();
	});

	it("renders the placeholder testID", () => {
		render(<UnifiedCameraCaptureScreen />);
		expect(
			screen.getByTestId("unified-camera-capture-placeholder"),
		).toBeTruthy();
	});

	it("closes the modal via getParent().goBack() when the back button is pressed", () => {
		render(<UnifiedCameraCaptureScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-capture-back"));
		expect(mockGetParent).toHaveBeenCalled();
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("no-ops safely when getParent() returns undefined (orphan test harness)", () => {
		mockGetParent.mockReturnValueOnce(undefined);
		render(<UnifiedCameraCaptureScreen />);
		expect(() =>
			fireEvent.press(screen.getByTestId("unified-camera-capture-back")),
		).not.toThrow();
		expect(mockGoBack).not.toHaveBeenCalled();
	});
});
