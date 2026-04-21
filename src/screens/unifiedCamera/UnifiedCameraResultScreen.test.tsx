import { render, screen } from "@testing-library/react-native";

type MockParams = {
	cutoutUri: string;
	dominantHex: string;
	wadaMatch: { type: string };
} | null;

const mockRouteHolder: { current: MockParams } = {
	current: {
		cutoutUri: "file:///x.png",
		dominantHex: "#ABCDEF",
		wadaMatch: { type: "direct" },
	},
};

jest.mock("@react-navigation/native", () => ({
	useRoute: () => ({ params: mockRouteHolder.current }),
}));

import { UnifiedCameraResultScreen } from "./UnifiedCameraResultScreen";

describe("UnifiedCameraResultScreen (diagnostic placeholder)", () => {
	beforeEach(() => {
		mockRouteHolder.current = {
			cutoutUri: "file:///x.png",
			dominantHex: "#ABCDEF",
			wadaMatch: { type: "direct" },
		};
	});

	it("renders the placeholder testID", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-placeholder"),
		).toBeTruthy();
	});

	it("renders the dominantHex + wadaMatch.type diagnostic given route.params", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-dominant-hex"),
		).toHaveTextContent("dominantHex = #ABCDEF");
		expect(
			screen.getByTestId("unified-camera-result-wada-match-type"),
		).toHaveTextContent("wadaMatch.type = direct");
	});
});
