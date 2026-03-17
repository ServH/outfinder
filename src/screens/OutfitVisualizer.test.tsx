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
			nameJp: "テスト",
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
			nameJp: "テスト",
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
			nameJp: "テスト",
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
			nameJp: "テスト",
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

	it("renders WadaHeader with combination name", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "秋の装い",
			nameEn: "Autumn Look",
		});

		render(<OutfitVisualizer />);

		expect(screen.getAllByText("秋の装い").length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("2 colors · Sanzo Wada").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("renders MiniPaletteStrip with color names", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByLabelText("Outfit color palette")).toBeTruthy();
	});

	it("renders OutfitCard", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByLabelText("Outfit card")).toBeTruthy();
	});

	it("renders warm background", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByLabelText("Warm background")).toBeTruthy();
	});

	it("fires hapticMedium when tapping a garment to select", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
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
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);

		expect(mockAnnounce).toHaveBeenCalledWith("Selected T-shirt for swap");
	});

	it("fires hapticMedium on variant cycle via accessibility action", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		fireEvent(tshirt, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});

		expect(mockHapticMedium).toHaveBeenCalledTimes(1);
	});

	it("announces garment type change on variant cycle forward", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		fireEvent(tshirt, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});

		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Shirt");
	});

	it("cycles through extended upper garments in 3-color combo", () => {
		mockRouteParams.combinationId = "combo-3";
		mockGetCombination.mockReturnValue({
			id: "combo-3",
			colors: [red, blue, green],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);

		// tshirt → shirt
		fireEvent(tshirt, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Shirt");

		// shirt → jacket
		const shirt = screen.getByLabelText(
			"Shirt, colored Red, tap to select for swap",
		);
		fireEvent(shirt, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Jacket");

		// jacket → hoodie
		const jacket = screen.getByLabelText(
			"Jacket, colored Red, tap to select for swap",
		);
		fireEvent(jacket, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Hoodie");

		// hoodie → tshirt (wraps)
		const hoodie = screen.getByLabelText(
			"Hoodie, colored Red, tap to select for swap",
		);
		fireEvent(hoodie, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to T-shirt");
	});

	it("cycles backward via decrement action", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		// tshirt decrement wraps to hoodie (full upper cycle in 2-color)
		fireEvent(tshirt, "accessibilityAction", {
			nativeEvent: { actionName: "decrement" },
		});
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Hoodie");
	});

	it("swaps colors between two garments with haptic and VoiceOver", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
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
			nameJp: "テスト",
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

	it("renders WadaHeader for 3-color combination", () => {
		mockRouteParams.combinationId = "combo-3";
		mockGetCombination.mockReturnValue({
			id: "combo-3",
			colors: [red, blue, green],
			nameJp: "春の三色",
			nameEn: "Spring Trio",
		});

		render(<OutfitVisualizer />);

		expect(screen.getAllByText("春の三色").length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("3 colors · Sanzo Wada").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("renders WadaHeader for 4-color combination", () => {
		mockRouteParams.combinationId = "combo-4";
		mockGetCombination.mockReturnValue({
			id: "combo-4",
			colors: [red, blue, green, yellow],
			nameJp: "四季の色",
			nameEn: "Four Seasons",
		});

		render(<OutfitVisualizer />);

		expect(screen.getAllByText("四季の色").length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getAllByText("4 colors · Sanzo Wada").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("renders MiniPaletteStrip color names for 3-color combo", () => {
		mockRouteParams.combinationId = "combo-3";
		mockGetCombination.mockReturnValue({
			id: "combo-3",
			colors: [red, blue, green],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getAllByText("Red").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Blue").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Green").length).toBeGreaterThanOrEqual(1);
	});

	it("haptic fires on variant cycle of second slot", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const pants = screen.getByLabelText(
			"Pants, colored Blue, tap to select for swap",
		);
		fireEvent(pants, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});

		expect(mockHapticMedium).toHaveBeenCalledTimes(1);
	});

	it("VoiceOver announces swap on 3-color combination", () => {
		mockRouteParams.combinationId = "combo-3";
		mockGetCombination.mockReturnValue({
			id: "combo-3",
			colors: [red, blue, green],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);
		fireEvent.press(
			screen.getByLabelText("Sneakers, colored Green, tap to select for swap"),
		);

		expect(mockAnnounce).toHaveBeenCalledWith(
			"T-shirt is now Green, Sneakers is now Red",
		);
	});

	it("variant cycle announces pants to skirt change", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const pants = screen.getByLabelText(
			"Pants, colored Blue, tap to select for swap",
		);
		fireEvent(pants, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});

		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Skirt");
	});

	it("renders aureola component", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByLabelText("Color aureola")).toBeTruthy();
	});

	it("renders SharePreview off-screen", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(
			screen.getByTestId("share-preview-container", {
				includeHiddenElements: true,
			}),
		).toBeTruthy();
	});

	it("not-found state has screen accessibility label", () => {
		mockRouteParams.combinationId = "invalid";
		mockGetCombination.mockReturnValue(undefined);

		render(<OutfitVisualizer />);

		expect(screen.getByLabelText("Outfit Visualizer screen")).toBeTruthy();
	});

	it("multiple swaps work correctly", () => {
		mockRouteParams.combinationId = "combo-3";
		mockGetCombination.mockReturnValue({
			id: "combo-3",
			colors: [red, blue, green],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		// First swap: T-shirt (Red) ↔ Pants (Blue)
		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);
		fireEvent.press(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		);

		// Verify first swap
		expect(
			screen.getByLabelText("T-shirt, colored Blue, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Pants, colored Red, tap to select for swap"),
		).toBeTruthy();

		// Second swap: T-shirt (Blue) ↔ Sneakers (Green)
		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Blue, tap to select for swap"),
		);
		fireEvent.press(
			screen.getByLabelText("Sneakers, colored Green, tap to select for swap"),
		);

		expect(
			screen.getByLabelText("T-shirt, colored Green, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Sneakers, colored Blue, tap to select for swap"),
		).toBeTruthy();
	});

	it("MiniPaletteStrip shows all color names for 4-color combo", () => {
		mockRouteParams.combinationId = "combo-4";
		mockGetCombination.mockReturnValue({
			id: "combo-4",
			colors: [red, blue, green, yellow],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getAllByText("Red").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Blue").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Green").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Yellow").length).toBeGreaterThanOrEqual(1);
	});

	it("haptic fires twice for complete swap interaction", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);
		fireEvent.press(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		);

		expect(mockHapticMedium).toHaveBeenCalledTimes(2);
	});

	it("renders all presentation components for 4-color combo", () => {
		mockRouteParams.combinationId = "combo-4";
		mockGetCombination.mockReturnValue({
			id: "combo-4",
			colors: [red, blue, green, yellow],
			nameJp: "四色",
			nameEn: "Four",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByLabelText("Warm background")).toBeTruthy();
		expect(screen.getByLabelText("Color aureola")).toBeTruthy();
		expect(screen.getByLabelText("Outfit card")).toBeTruthy();
		expect(screen.getByLabelText("Outfit color palette")).toBeTruthy();
		expect(screen.getAllByText("四色").length).toBeGreaterThanOrEqual(1);
	});

	it("4-color combo keeps layer and top cycles separate", () => {
		mockRouteParams.combinationId = "combo-4";
		mockGetCombination.mockReturnValue({
			id: "combo-4",
			colors: [red, blue, green, yellow],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		// Layer slot: jacket → hoodie (only 2 in layer cycle)
		const jacket = screen.getByLabelText(
			"Jacket, colored Red, tap to select for swap",
		);
		fireEvent(jacket, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Hoodie");

		// Top slot: tshirt → shirt (only 2 in top cycle)
		const tshirt = screen.getByLabelText(
			"T-shirt, colored Blue, tap to select for swap",
		);
		fireEvent(tshirt, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Shirt");
	});
});
