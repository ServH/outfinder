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

const mockRootPopTo = jest.fn();
const mockGetParent = jest.fn(() => ({ popTo: mockRootPopTo }));

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
		mockRootPopTo.mockClear();
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
		).toHaveTextContent("Saved to your wardrobe");
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

	// BUG-001 (second pass): both CTAs use popTo to atomically pop the
	// UnifiedCameraRoot modal AND apply nested params on Main. Single
	// dispatch — no navigate/goBack race that would pop the wrong screen.
	it("primary CTA tap fires hapticLight and popTo('Main') with ColorsTab → Combinations nested params", () => {
		render(<UnifiedCameraPostSaveScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-postsave-primary-cta"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockGetParent).toHaveBeenCalled();
		expect(mockRootPopTo).toHaveBeenCalledTimes(1);
		expect(mockRootPopTo).toHaveBeenCalledWith("Main", {
			screen: "ColorsTab",
			params: {
				screen: "Combinations",
				params: { colorId: BRICK_RED.id, capturedHex: "#7a3f2b" },
			},
		});
	});

	it("secondary CTA tap fires hapticLight and popTo('Main') with FavoritesTab nested param", () => {
		render(<UnifiedCameraPostSaveScreen />);
		fireEvent.press(
			screen.getByTestId("unified-camera-postsave-secondary-cta"),
		);
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockRootPopTo).toHaveBeenCalledTimes(1);
		expect(mockRootPopTo).toHaveBeenCalledWith("Main", {
			screen: "FavoritesTab",
		});
	});
});
