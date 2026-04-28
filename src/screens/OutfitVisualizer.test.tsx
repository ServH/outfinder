import {
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";

import { wadaTokens } from "@/styles/theme";
import { OutfitVisualizer } from "./OutfitVisualizer";

// Mock navigation. The deferred-lookup pattern (feedback_jest_native_module_mock.md)
// keeps `mockRootNavigate` observable across tests: the factory closure resolves
// it at runtime, not at hoist-time.
const mockRouteParams = { combinationId: "" };
const mockRootNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useRoute: () => ({ params: mockRouteParams }),
	useNavigation: () => ({
		goBack: mockGoBack,
		getParent: () => ({
			getParent: () => ({ navigate: mockRootNavigate }),
			getState: () => undefined,
		}),
		getState: () => undefined,
	}),
	useNavigationState: () => undefined,
}));

// Mock colorIndex
const mockGetCombination = jest.fn();
jest.mock("@/data/colorIndex", () => ({
	getCombination: (...args: unknown[]) => mockGetCombination(...args),
}));

// Mock haptics
const mockHapticLight = jest.fn();
const mockHapticMedium = jest.fn();
jest.mock("@/lib/haptics", () => ({
	hapticLight: (...args: unknown[]) => mockHapticLight(...args),
	hapticMedium: (...args: unknown[]) => mockHapticMedium(...args),
}));

// Mock AsyncStorage
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
jest.mock("@react-native-async-storage/async-storage", () => ({
	getItem: (...args: unknown[]) => mockGetItem(...args),
	setItem: (...args: unknown[]) => mockSetItem(...args),
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
		mockHapticLight.mockReset();
		mockHapticMedium.mockReset();
		mockRootNavigate.mockReset();
		mockGoBack.mockReset();
		mockAnnounce.mockReset();
		mockGetItem.mockReset();
		mockSetItem.mockReset();
		// Default: already introduced (most tests don't need coach marks)
		mockGetItem.mockResolvedValue("true");
		mockSetItem.mockResolvedValue(undefined);
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

	it("renders Outfinder branding text", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByText("Outfinder")).toBeTruthy();
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

	it("renders nameEn in WadaHeader", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "秋の暮",
			nameEn: "Autumn Dusk",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByText("Autumn Dusk")).toBeTruthy();
	});

	it("WadaHeader a11y label includes nameEn", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "秋の暮",
			nameEn: "Autumn Dusk",
		});

		render(<OutfitVisualizer />);

		expect(
			screen.getByLabelText("秋の暮, Autumn Dusk, 2 color Wada combination"),
		).toBeTruthy();
	});

	// --- Permanent arrow tests (AC: #5, Task 4.3) ---

	it("always renders previous and next arrow buttons", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		expect(screen.getByTestId("arrow-previous")).toBeTruthy();
		expect(screen.getByTestId("arrow-next")).toBeTruthy();
	});

	it("arrows have correct accessibilityLabel and accessibilityRole", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		const prevArrow = screen.getByTestId("arrow-previous");
		const nextArrow = screen.getByTestId("arrow-next");

		expect(prevArrow.props.accessibilityLabel).toBe("Previous garment");
		expect(prevArrow.props.accessibilityRole).toBe("button");
		expect(nextArrow.props.accessibilityLabel).toBe("Next garment");
		expect(nextArrow.props.accessibilityRole).toBe("button");
	});

	it("next arrow fires hapticLight and cycles variant forward", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		fireEvent.press(screen.getByTestId("arrow-next"));

		expect(mockHapticLight).toHaveBeenCalledTimes(1);
		// Slot 0 (T-shirt) cycles forward → Shirt
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Shirt");
	});

	it("previous arrow fires hapticLight and cycles variant backward", () => {
		mockRouteParams.combinationId = "combo-2";
		mockGetCombination.mockReturnValue({
			id: "combo-2",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		fireEvent.press(screen.getByTestId("arrow-previous"));

		expect(mockHapticLight).toHaveBeenCalledTimes(1);
		// Slot 0 (T-shirt) cycles backward → wraps to Hoodie
		expect(mockAnnounce).toHaveBeenCalledWith("Changed to Hoodie");
	});

	// --- Make Mine CTA (Story 14.6) ---

	describe("Make Mine CTA (Story 14.6)", () => {
		it("renders 'Hacer mío este look' CTA with testID and a11y label", () => {
			mockRouteParams.combinationId = "combo-2";
			mockGetCombination.mockReturnValue({
				id: "combo-2",
				colors: [red, blue],
				nameJp: "テスト",
				nameEn: "Test",
			});

			render(<OutfitVisualizer />);

			const cta = screen.getByTestId("visualizer-make-mine");
			expect(cta).toBeTruthy();
			expect(cta.props.accessibilityLabel).toBe("Make this look mine");
		});

		it("CTA background is the Aureola color (first slot hex)", () => {
			mockRouteParams.combinationId = "combo-2";
			mockGetCombination.mockReturnValue({
				id: "combo-2",
				colors: [red, blue],
				nameJp: "テスト",
				nameEn: "Test",
			});

			render(<OutfitVisualizer />);

			const cta = screen.getByTestId("visualizer-make-mine");
			expect(cta.props.style).toEqual(
				expect.objectContaining({ backgroundColor: red.hex }),
			);
		});

		it.each<[string, ReturnType<typeof makeColor>, string]>([
			["high-luminance (yellow)", yellow, wadaTokens.textPrimary],
			["low-luminance (red)", red, "#faf7f2"],
		])("CTA label color adapts to Wada luminance: %s", (_label, firstSlotColor, expectedLabelColor) => {
			mockRouteParams.combinationId = "combo-luminance";
			mockGetCombination.mockReturnValue({
				id: "combo-luminance",
				colors: [firstSlotColor, blue],
				nameJp: "テスト",
				nameEn: "Test",
			});

			render(<OutfitVisualizer />);

			const cta = screen.getByTestId("visualizer-make-mine");
			// Inline style for the label color lives on the first <Text> child.
			const labelNode = cta.findByProps({
				children: "Make this look mine",
			});
			expect(labelNode.props.style).toEqual(
				expect.objectContaining({ color: expectedLabelColor }),
			);
		});

		it("tap fires hapticMedium and cross-navigates to Main → FavoritesTab → ArmarioFichaWada", () => {
			mockRouteParams.combinationId = "combo-cross-nav";
			mockGetCombination.mockReturnValue({
				id: "combo-cross-nav",
				colors: [red, blue],
				nameJp: "テスト",
				nameEn: "Test",
			});

			render(<OutfitVisualizer />);

			fireEvent.press(screen.getByTestId("visualizer-make-mine"));

			expect(mockHapticMedium).toHaveBeenCalledTimes(1);
			expect(mockRootNavigate).toHaveBeenCalledWith("Main", {
				screen: "FavoritesTab",
				params: {
					screen: "ArmarioFichaWada",
					params: { combinationId: "combo-cross-nav" },
				},
			});
		});

		it("CTA has correct a11y hint and role", () => {
			mockRouteParams.combinationId = "combo-2";
			mockGetCombination.mockReturnValue({
				id: "combo-2",
				colors: [red, blue],
				nameJp: "テスト",
				nameEn: "Test",
			});

			render(<OutfitVisualizer />);

			const cta = screen.getByTestId("visualizer-make-mine");
			expect(cta.props.accessibilityRole).toBe("button");
			expect(cta.props.accessibilityHint).toBe(
				"Opens this look in your wardrobe to assign garments",
			);
		});
	});
});

describe("Slot-discovery coach mark (Story 15.4)", () => {
	beforeEach(() => {
		mockGetCombination.mockReset();
		mockHapticLight.mockReset();
		mockHapticMedium.mockReset();
		mockRootNavigate.mockReset();
		mockGoBack.mockReset();
		mockAnnounce.mockReset();
		mockGetItem.mockReset();
		mockSetItem.mockReset();
		mockSetItem.mockResolvedValue(undefined);
	});

	it("(a) first mount with cleared flag → coach mark visible", async () => {
		mockGetItem.mockResolvedValue(null);
		mockRouteParams.combinationId = "combo-coach-a";
		mockGetCombination.mockReturnValue({
			id: "combo-coach-a",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByTestId("visualizer-coach-mark")).toBeTruthy(),
		);
		const text = screen.getByTestId("visualizer-coach-mark-text");
		expect(text.props.children).toBe(
			"Tap any garment to swap it or connect it to your wardrobe.",
		);
	});

	it("(b) dismiss → AsyncStorage set + haptic + overlay leaves", async () => {
		mockGetItem.mockResolvedValue(null);
		mockRouteParams.combinationId = "combo-coach-b";
		mockGetCombination.mockReturnValue({
			id: "combo-coach-b",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByTestId("visualizer-coach-mark")).toBeTruthy(),
		);

		fireEvent.press(screen.getByTestId("visualizer-coach-mark-dismiss"));

		await waitFor(() =>
			expect(mockSetItem).toHaveBeenCalledWith(
				"@outfinder/coachmark:visualizer-slots-firstuse",
				"true",
			),
		);
		expect(mockHapticLight).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(screen.queryByTestId("visualizer-coach-mark")).toBeNull(),
		);
	});

	it("(c) remount with already-seen → no overlay", async () => {
		mockGetItem.mockResolvedValue("true");
		mockRouteParams.combinationId = "combo-coach-c";
		mockGetCombination.mockReturnValue({
			id: "combo-coach-c",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		await waitFor(() => expect(mockGetItem).toHaveBeenCalled());
		expect(screen.queryByTestId("visualizer-coach-mark")).toBeNull();
	});

	it("(d) not-found combination → no overlay even with cleared flag", async () => {
		mockGetItem.mockResolvedValue(null);
		mockRouteParams.combinationId = "combo-not-found";
		mockGetCombination.mockReturnValue(undefined);

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByText("Combination not found")).toBeTruthy(),
		);
		expect(screen.queryByTestId("visualizer-coach-mark")).toBeNull();
	});

	it("(e) overlay does NOT block the back button", async () => {
		mockGetItem.mockResolvedValue(null);
		mockRouteParams.combinationId = "combo-coach-e";
		mockGetCombination.mockReturnValue({
			id: "combo-coach-e",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByTestId("visualizer-coach-mark")).toBeTruthy(),
		);
		expect(screen.getByTestId("visualizer-back-button")).toBeTruthy();
	});
});

// --- iPad layout tests (AC: #3) ---

describe("OutfitVisualizer iPad layout", () => {
	beforeEach(() => {
		// Spy on useIsIPad in device module so the isTablet branch activates.
		// Mocking useWindowDimensions alone doesn't propagate into device.ts imports.
		jest.spyOn(require("@/lib/device"), "useIsIPad").mockReturnValue(true);
		mockGetItem.mockResolvedValue("true");
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders successfully on iPad", async () => {
		mockGetCombination.mockReturnValue({
			id: "combo-ipad",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByLabelText("Outfit card")).toBeTruthy(),
		);
	});

	it("renders correctly with 4-color combination on iPad", async () => {
		mockGetCombination.mockReturnValue({
			id: "combo-ipad-4",
			colors: [red, blue, green, yellow],
			nameJp: "四色",
			nameEn: "Four Colors",
		});

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByLabelText("Outfit card")).toBeTruthy(),
		);
	});

	it("applies centered maxWidth container on iPad (AC: #3)", async () => {
		mockGetCombination.mockReturnValue({
			id: "combo-ipad",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByTestId("outfit-content-container")).toBeTruthy(),
		);

		const container = screen.getByTestId("outfit-content-container");
		expect(container.props.style).toEqual(
			expect.objectContaining({ maxWidth: 520, alignSelf: "center" }),
		);
	});

	it("uses wider arrow offsets (-36) on iPad (AC: #3)", async () => {
		mockGetCombination.mockReturnValue({
			id: "combo-ipad",
			colors: [red, blue],
			nameJp: "テスト",
			nameEn: "Test",
		});

		render(<OutfitVisualizer />);

		await waitFor(() =>
			expect(screen.getByTestId("arrow-previous")).toBeTruthy(),
		);

		const arrowPrev = screen.getByTestId("arrow-previous");
		const arrowNext = screen.getByTestId("arrow-next");
		expect(arrowPrev.props.style).toEqual(
			expect.objectContaining({ left: -36 }),
		);
		expect(arrowNext.props.style).toEqual(
			expect.objectContaining({ right: -36 }),
		);
	});
});
