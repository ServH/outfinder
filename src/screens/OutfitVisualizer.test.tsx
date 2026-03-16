import { fireEvent, render, screen } from "@testing-library/react-native";

import { OutfitVisualizer } from "./OutfitVisualizer";

// Mock navigation
const mockRouteParams = { combinationId: "" };
jest.mock("@react-navigation/native", () => ({
	useRoute: () => ({ params: mockRouteParams }),
}));

// Mock colorIndex
const mockGetCombination = jest.fn();
jest.mock("@/data/colorIndex", () => ({
	getCombination: (...args: unknown[]) => mockGetCombination(...args),
}));

// Mock haptics
const mockHapticMedium = jest.fn();
jest.mock("@/lib/haptics", () => ({
	hapticMedium: (...args: unknown[]) => mockHapticMedium(...args),
}));

// Mock useReducedMotion
jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

// Mock AccessibilityInfo
const mockAnnounce = jest.fn();
jest.mock(
	"react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo",
	() => ({
		__esModule: true,
		default: {
			announceForAccessibility: (...args: unknown[]) => mockAnnounce(...args),
			isReduceMotionEnabled: () => Promise.resolve(false),
			addEventListener: () => ({ remove: jest.fn() }),
		},
	}),
);

function makeColor(id: string, hex: string, nameEn: string, nameJp = "") {
	return { id, hex, nameJp, nameEn, swatchGroup: 0, combinationCount: 1 };
}

const red = makeColor("c1", "#ff0000", "Red", "赤");
const blue = makeColor("c2", "#0000ff", "Blue", "青");
const green = makeColor("c3", "#00ff00", "Green", "緑");
const yellow = makeColor("c4", "#ffff00", "Yellow", "黄");

describe("OutfitVisualizer", () => {
	beforeEach(() => {
		mockGetCombination.mockReset();
		mockHapticMedium.mockReset();
		mockAnnounce.mockReset();
	});

	it("renders 2-color combination with top + bottom", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test 2",
		});

		render(<OutfitVisualizer />);

		expect(mockGetCombination).toHaveBeenCalledWith("combo-2");
		expect(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		).toBeTruthy();
	});

	it("renders 3-color combination with top + bottom + shoes", () => {
		mockRouteParams.combinationId = "combo-3";
		mockGetCombination.mockReturnValue({
			id: "combo-3",
			colors: [red, blue, green],
			nameJp: "",
			nameEn: "Test 3",
		});

		render(<OutfitVisualizer />);

		expect(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Sneakers, colored Green, tap to select for swap"),
		).toBeTruthy();
	});

	it("renders 4-color combination with layer + top + bottom + shoes", () => {
		mockRouteParams.combinationId = "combo-4";
		mockGetCombination.mockReturnValue({
			id: "combo-4",
			colors: [red, blue, green, yellow],
			nameJp: "",
			nameEn: "Test 4",
		});

		render(<OutfitVisualizer />);

		expect(
			screen.getByLabelText("Jacket, colored Red, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("T-shirt, colored Blue, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Pants, colored Green, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Sneakers, colored Yellow, tap to select for swap"),
		).toBeTruthy();
	});

	it("shows not found message for invalid combinationId", () => {
		mockRouteParams.combinationId = "invalid";
		mockGetCombination.mockReturnValue(undefined);

		render(<OutfitVisualizer />);

		expect(screen.getByText("Combination not found")).toBeTruthy();
	});

	it("has Outfit Visualizer screen accessibility label", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByLabelText("Outfit Visualizer screen")).toBeTruthy();
	});

	it("passes correct combinationId to getCombination", () => {
		mockRouteParams.combinationId = "specific-combo-id";
		mockGetCombination.mockReturnValue(undefined);

		render(<OutfitVisualizer />);

		expect(mockGetCombination).toHaveBeenCalledWith("specific-combo-id");
	});

	it("renders PaletteBar with color swatches", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(
			screen.getByLabelText("Color palette: Red on T-shirt, Blue on Pants"),
		).toBeTruthy();
	});

	it("fires hapticMedium when tapping a garment to select", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);

		expect(mockHapticMedium).toHaveBeenCalledTimes(1);
	});

	it("announces selection for VoiceOver on tap", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);

		expect(mockAnnounce).toHaveBeenCalledWith("Selected T-shirt for swap");
	});

	it("fires hapticMedium on variant toggle", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const toggleButtons = screen.getAllByLabelText("Toggle garment type");
		fireEvent.press(toggleButtons[0]);

		expect(mockHapticMedium).toHaveBeenCalledTimes(1);
	});

	it("announces garment type change on variant toggle", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const toggleButtons = screen.getAllByLabelText("Toggle garment type");
		fireEvent.press(toggleButtons[0]);

		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Shirt");
	});

	it("swaps colors between two garments with haptic and VoiceOver", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		// Tap first garment to select
		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);
		// Tap second garment to swap
		fireEvent.press(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		);

		expect(mockHapticMedium).toHaveBeenCalledTimes(2);
		expect(mockAnnounce).toHaveBeenCalledWith(
			"T-shirt is now Blue, Pants is now Red",
		);
	});

	it("deselects garment on second tap without haptic or announcement", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);

		// Select
		fireEvent.press(tshirt);
		expect(mockHapticMedium).toHaveBeenCalledTimes(1);

		mockHapticMedium.mockReset();
		mockAnnounce.mockReset();

		// Deselect (tap same)
		fireEvent.press(tshirt);
		expect(mockHapticMedium).not.toHaveBeenCalled();
		expect(mockAnnounce).not.toHaveBeenCalled();
	});
});
