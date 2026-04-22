import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Color } from "@/data/types";
import { hapticLight } from "@/lib/haptics";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";

const BRICK_RED: Color = {
	id: "test-brick",
	hex: "#7a3f2b",
	nameJp: "煉瓦色",
	nameEn: "Brick Red",
	swatchGroup: 3,
	combinationCount: 5,
};

type MockRouteParams = {
	wadaColorId: string;
	capturedHex: string;
	categoryKey: WardrobeCategory;
};

const mockRouteHolder: { current: MockRouteParams } = {
	current: {
		wadaColorId: BRICK_RED.id,
		capturedHex: "#7a3f2b",
		categoryKey: "top",
	},
};

const mockRootNavigate = jest.fn();
const mockRootGoBack = jest.fn();
const mockGetParent = jest.fn(() => ({
	navigate: mockRootNavigate,
	goBack: mockRootGoBack,
}));

jest.mock("@react-navigation/native", () => ({
	useRoute: () => ({ params: mockRouteHolder.current }),
	useNavigation: () => ({
		getParent: mockGetParent,
	}),
}));

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 44, right: 0, bottom: 34, left: 0 }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
}));

const mockGetColorById: Record<string, Color> = { [BRICK_RED.id]: BRICK_RED };
jest.mock("@/data/colorIndex", () => ({
	getColor: (id: string) => mockGetColorById[id],
}));

import { UnifiedCameraPostSaveScreen } from "./UnifiedCameraPostSaveScreen";

function setRoute(partial: Partial<MockRouteParams>) {
	mockRouteHolder.current = {
		wadaColorId: partial.wadaColorId ?? mockRouteHolder.current.wadaColorId,
		capturedHex: partial.capturedHex ?? mockRouteHolder.current.capturedHex,
		categoryKey: partial.categoryKey ?? mockRouteHolder.current.categoryKey,
	};
}

describe("UnifiedCameraPostSaveScreen", () => {
	beforeEach(() => {
		mockRouteHolder.current = {
			wadaColorId: BRICK_RED.id,
			capturedHex: "#7a3f2b",
			categoryKey: "top",
		};
		mockRootNavigate.mockClear();
		mockRootGoBack.mockClear();
		mockGetParent.mockClear();
		(hapticLight as jest.Mock).mockClear();
	});

	it.each<[WardrobeCategory, string]>([
		["top", "Top"],
		["bottom", "Bottom"],
		["footwear", "Footwear"],
		["accessory", "Accessory"],
	])("renders title and subtitle with the localized label for category %s", (categoryKey, expectedLabel) => {
		setRoute({ categoryKey });
		render(<UnifiedCameraPostSaveScreen />);
		expect(
			screen.getByTestId("unified-camera-postsave-title"),
		).toHaveTextContent("Saved to your armario");
		expect(
			screen.getByTestId("unified-camera-postsave-subtitle"),
		).toHaveTextContent(`as ${expectedLabel}`);
	});

	it("renders the primary CTA with the interpolated Wada name from getColor", () => {
		render(<UnifiedCameraPostSaveScreen />);
		expect(
			screen.getByTestId("unified-camera-postsave-primary-cta"),
		).toHaveTextContent("See combinations with Brick Red");
	});

	it("primary CTA tap fires hapticLight and cross-navigates to Combinations with the exact params", () => {
		render(<UnifiedCameraPostSaveScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-postsave-primary-cta"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockGetParent).toHaveBeenCalled();
		expect(mockRootNavigate).toHaveBeenCalledWith("Main", {
			screen: "ColorsTab",
			params: {
				screen: "Combinations",
				params: { colorId: BRICK_RED.id, capturedHex: "#7a3f2b" },
			},
		});
	});

	// BUG-001: primary CTA must dismiss the UnifiedCameraRoot modal after
	// updating Main — navigate then goBack in that order.
	it("primary CTA dismisses the UnifiedCameraRoot modal via rootNav.goBack() after navigate", () => {
		render(<UnifiedCameraPostSaveScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-postsave-primary-cta"));
		expect(mockRootGoBack).toHaveBeenCalledTimes(1);
		const navigateOrder = mockRootNavigate.mock.invocationCallOrder[0];
		const goBackOrder = mockRootGoBack.mock.invocationCallOrder[0];
		expect(navigateOrder).toBeLessThan(goBackOrder);
	});

	it("secondary CTA tap fires hapticLight and cross-navigates to FavoritesTab", () => {
		render(<UnifiedCameraPostSaveScreen />);
		fireEvent.press(
			screen.getByTestId("unified-camera-postsave-secondary-cta"),
		);
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockRootNavigate).toHaveBeenCalledWith("Main", {
			screen: "FavoritesTab",
		});
	});

	// BUG-001: secondary CTA also dismisses the modal.
	it("secondary CTA dismisses the UnifiedCameraRoot modal via rootNav.goBack() after navigate", () => {
		render(<UnifiedCameraPostSaveScreen />);
		fireEvent.press(
			screen.getByTestId("unified-camera-postsave-secondary-cta"),
		);
		expect(mockRootGoBack).toHaveBeenCalledTimes(1);
		const navigateOrder = mockRootNavigate.mock.invocationCallOrder[0];
		const goBackOrder = mockRootGoBack.mock.invocationCallOrder[0];
		expect(navigateOrder).toBeLessThan(goBackOrder);
	});
});
