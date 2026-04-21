import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import type { Color } from "@/data/types";
import type { MatchResult } from "@/lib/colorTypes";
import { hapticLight, hapticMedium } from "@/lib/haptics";

// Synthetic Wada-shaped colors keep the test independent of real data.
// Brick Red (#7a3f2b) is the luminance mockup canon (cream label, < 0.40).
// Pale Yellow (#f0e6c7) deliberately crosses the 0.40 threshold (dark label).
const BRICK_RED: Color = {
	id: "test-brick",
	hex: "#7a3f2b",
	nameJp: "煉瓦色",
	nameEn: "Brick Red",
	swatchGroup: 3,
	combinationCount: 5,
};

const CLAY_RED: Color = {
	id: "test-clay",
	hex: "#8a4b33",
	nameJp: "土色",
	nameEn: "Clay Red",
	swatchGroup: 3,
	combinationCount: 7,
};

const PALE_YELLOW: Color = {
	id: "test-pale",
	hex: "#f0e6c7",
	nameJp: "淡黄色",
	nameEn: "Pale Yellow",
	swatchGroup: 0,
	combinationCount: 3,
};

const MIDNIGHT_BLUE: Color = {
	id: "test-midnight",
	hex: "#0f1a3a",
	nameJp: "紺青",
	nameEn: "Midnight Blue",
	swatchGroup: 1,
	combinationCount: 1,
};

type MockRouteParams = {
	cutoutUri: string;
	dominantHex: string;
	wadaMatch: MatchResult;
};

const mockRouteHolder: { current: MockRouteParams } = {
	current: {
		cutoutUri: "file:///cutout.png",
		dominantHex: "#7a3f2b",
		wadaMatch: { type: "direct", match: { color: BRICK_RED, deltaE: 2 } },
	},
};

const mockRootNavigate = jest.fn();
const mockLocalPush = jest.fn();
const mockGetParent = jest.fn(() => ({ navigate: mockRootNavigate }));

jest.mock("@react-navigation/native", () => ({
	useRoute: () => ({ params: mockRouteHolder.current }),
	useNavigation: () => ({
		push: mockLocalPush,
		getParent: mockGetParent,
	}),
}));

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 44, right: 0, bottom: 34, left: 0 }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => true,
}));

// Mocking getCombinations by confirmedTone.id keeps count-plural assertions
// deterministic independent of the real Wada dataset.
const mockCombinationsById: Record<string, number> = {
	[BRICK_RED.id]: 5,
	[CLAY_RED.id]: 7,
	[PALE_YELLOW.id]: 1,
	[MIDNIGHT_BLUE.id]: 3,
	"test-zero": 0,
};
jest.mock("@/data/colorIndex", () => ({
	getCombinations: (colorId: string) => {
		const count = mockCombinationsById[colorId] ?? 0;
		// Return an array of plausible objects; only .length is consumed.
		return Array.from({ length: count }, (_, i) => ({
			id: `${colorId}-c${i}`,
			colors: [],
			nameJp: "",
			nameEn: "",
		}));
	},
}));

import { UnifiedCameraResultScreen } from "./UnifiedCameraResultScreen";

function setRoute(partial: Partial<MockRouteParams>) {
	mockRouteHolder.current = {
		cutoutUri: partial.cutoutUri ?? mockRouteHolder.current.cutoutUri,
		dominantHex: partial.dominantHex ?? mockRouteHolder.current.dominantHex,
		wadaMatch: partial.wadaMatch ?? mockRouteHolder.current.wadaMatch,
	};
}

describe("UnifiedCameraResultScreen", () => {
	beforeEach(() => {
		mockRouteHolder.current = {
			cutoutUri: "file:///cutout.png",
			dominantHex: "#7a3f2b",
			wadaMatch: { type: "direct", match: { color: BRICK_RED, deltaE: 2 } },
		};
		mockRootNavigate.mockClear();
		mockLocalPush.mockClear();
		mockGetParent.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
	});

	it("renders the cutout image with an accessibility label for the confirmed tone", () => {
		render(<UnifiedCameraResultScreen />);
		const cutoutContainer = screen.getByTestId("unified-camera-result-cutout");
		expect(cutoutContainer).toBeTruthy();
		expect(
			screen.getByLabelText("Cutout of your garment, tone Brick Red"),
		).toBeTruthy();
	});

	it("renders the Wada name stack with EN + JP for a direct match", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Brick Red");
		expect(
			screen.getByTestId("unified-camera-result-name-jp"),
		).toHaveTextContent("煉瓦色");
		expect(screen.getByLabelText("Tone Brick Red, 煉瓦色")).toBeTruthy();
	});

	it("renders the combinations count in plural form when count > 1", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-combinations-count"),
		).toHaveTextContent("Appears in 5 combinations");
	});

	it("renders the combinations count in singular form when count === 1", () => {
		setRoute({
			wadaMatch: {
				type: "direct",
				match: { color: PALE_YELLOW, deltaE: 2 },
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-combinations-count"),
		).toHaveTextContent("Appears in 1 combination");
	});

	it("hides the tone-correction section for a direct match", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.queryByTestId("unified-camera-result-tone-correction"),
		).toBeNull();
	});

	it("hides the tone-correction section when type is confirm but top3[1] deltaE is not ambiguous", () => {
		setRoute({
			wadaMatch: {
				type: "confirm",
				top3: [
					{ color: BRICK_RED, deltaE: 2 },
					{ color: CLAY_RED, deltaE: 12 },
					{ color: MIDNIGHT_BLUE, deltaE: 30 },
				],
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.queryByTestId("unified-camera-result-tone-correction"),
		).toBeNull();
	});

	it("shows the tone-correction section with 2 swatches when type is confirm and top3[1] deltaE is ambiguous", () => {
		setRoute({
			wadaMatch: {
				type: "confirm",
				top3: [
					{ color: BRICK_RED, deltaE: 2 },
					{ color: CLAY_RED, deltaE: 4 },
					{ color: MIDNIGHT_BLUE, deltaE: 25 },
				],
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-tone-correction"),
		).toBeTruthy();
		expect(
			screen.getByTestId("unified-camera-result-tone-swatch-0"),
		).toBeTruthy();
		expect(
			screen.getByTestId("unified-camera-result-tone-swatch-1"),
		).toBeTruthy();
		expect(
			screen.queryByTestId("unified-camera-result-tone-swatch-2"),
		).toBeNull();
	});

	it("tapping the alternate swatch updates the Wada name, combinations count, and primary CTA background", () => {
		setRoute({
			wadaMatch: {
				type: "confirm",
				top3: [
					{ color: BRICK_RED, deltaE: 2 },
					{ color: CLAY_RED, deltaE: 4 },
					{ color: MIDNIGHT_BLUE, deltaE: 25 },
				],
			},
		});
		const announceSpy = jest
			.spyOn(AccessibilityInfo, "announceForAccessibility")
			.mockImplementation(() => {});

		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Brick Red");

		fireEvent.press(screen.getByTestId("unified-camera-result-tone-swatch-1"));

		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Clay Red");
		expect(
			screen.getByTestId("unified-camera-result-combinations-count"),
		).toHaveTextContent("Appears in 7 combinations");
		const cta = screen.getByTestId("unified-camera-result-primary-cta");
		const ctaStyle = Array.isArray(cta.props.style)
			? Object.assign({}, ...cta.props.style)
			: cta.props.style;
		expect(ctaStyle.backgroundColor).toBe(CLAY_RED.hex);
		expect(announceSpy).toHaveBeenCalledWith("Tone changed to Clay Red");
		announceSpy.mockRestore();
	});

	it("primary CTA tap fires hapticMedium and navigation.push('PostSave')", () => {
		const consoleWarn = jest
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		expect(hapticMedium).toHaveBeenCalledTimes(1);
		expect(mockLocalPush).toHaveBeenCalledTimes(1);
		expect(mockLocalPush).toHaveBeenCalledWith("PostSave");
		consoleWarn.mockRestore();
	});

	it("secondary link tap fires hapticLight and a cross-navigator navigation to Combinations with the confirmed tone params", () => {
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-secondary-link"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockGetParent).toHaveBeenCalled();
		expect(mockRootNavigate).toHaveBeenCalledTimes(1);
		expect(mockRootNavigate).toHaveBeenCalledWith("Main", {
			screen: "ColorsTab",
			params: {
				screen: "Combinations",
				params: { colorId: BRICK_RED.id, capturedHex: "#7a3f2b" },
			},
		});
	});

	it("out-of-coverage match falls back to bestMatch.color in the name stack and primary CTA tint", () => {
		setRoute({
			dominantHex: "#ff00ff",
			wadaMatch: {
				type: "out-of-coverage",
				bestMatch: { color: MIDNIGHT_BLUE, deltaE: 40 },
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Midnight Blue");
		const cta = screen.getByTestId("unified-camera-result-primary-cta");
		const ctaStyle = Array.isArray(cta.props.style)
			? Object.assign({}, ...cta.props.style)
			: cta.props.style;
		expect(ctaStyle.backgroundColor).toBe(MIDNIGHT_BLUE.hex);
		expect(
			screen.queryByTestId("unified-camera-result-tone-correction"),
		).toBeNull();
	});

	it("luminance rule: dark Wada tint renders a cream CTA label, pale tint renders dark ink", () => {
		setRoute({
			wadaMatch: {
				type: "direct",
				match: { color: MIDNIGHT_BLUE, deltaE: 2 },
			},
		});
		const { unmount } = render(<UnifiedCameraResultScreen />);
		const darkCtaLabels = screen.getAllByText("Save to my armario");
		const darkLabel = darkCtaLabels[0];
		const darkStyle = Array.isArray(darkLabel.props.style)
			? Object.assign({}, ...darkLabel.props.style)
			: darkLabel.props.style;
		expect(darkStyle.color).toBe("#faf7f2");
		unmount();

		setRoute({
			wadaMatch: {
				type: "direct",
				match: { color: PALE_YELLOW, deltaE: 2 },
			},
		});
		render(<UnifiedCameraResultScreen />);
		const paleCtaLabels = screen.getAllByText("Save to my armario");
		const paleLabel = paleCtaLabels[0];
		const paleStyle = Array.isArray(paleLabel.props.style)
			? Object.assign({}, ...paleLabel.props.style)
			: paleLabel.props.style;
		expect(paleStyle.color).toBe("#2d2a26");
	});
});
