import { fireEvent, render, screen } from "@testing-library/react-native";
import { getCombinations } from "@/data/colorIndex";
import type { Color, Combination } from "@/data/types";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { ColorHome } from "./ColorHome";

jest.mock("@/lib/haptics");

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: mockPush }),
}));

jest.mock("expo-symbols", () => ({
	SymbolView: "SymbolView",
}));

// Mock FavoritesContext
const mockToggleFavorite = jest.fn();
jest.mock("@/contexts/FavoritesContext", () => ({
	useFavorites: () => ({
		favorites: new Set<string>(),
		isFavorite: () => false,
		toggleFavorite: mockToggleFavorite,
		count: 0,
	}),
}));

// Mock usePremiumGate (prevents PremiumContext from loading)
const mockHandlePremiumGate = jest.fn();
jest.mock("@/hooks/usePremiumGate", () => ({
	usePremiumGate: () => ({
		isPremium: false,
		paywallVisible: false,
		blockedCombination: undefined,
		toastVisible: false,
		toastOpacity: { current: 1 },
		favoriteCombinationIds: [],
		priceString: "$2.99",
		purchaseState: "idle",
		errorMessage: null,
		handlePremiumGate: mockHandlePremiumGate,
		handleDismiss: jest.fn(),
		handlePurchase: jest.fn(),
		handleRestore: jest.fn(),
		openPaywall: jest.fn(),
	}),
	getRestoreErrorMessage: jest.fn(),
}));

// Mock useReducedMotion
jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

// Mock PremiumPaywall
jest.mock("@/components/PremiumPaywall", () => ({
	PremiumPaywall: () => null,
}));

// --- Mock wardrobe/color data ---

const mockDefaultShade: Color = {
	id: "c103",
	hex: "#A67C52",
	nameJp: "土色",
	nameEn: "Tan",
	swatchGroup: 1,
	combinationCount: 12,
};

const mockShades: Color[] = [
	{
		id: "c101",
		hex: "#F5E6D0",
		nameJp: "亜麻色",
		nameEn: "Flax",
		swatchGroup: 0,
		combinationCount: 10,
	},
	{
		id: "c102",
		hex: "#C4A882",
		nameJp: "小麦色",
		nameEn: "Wheat",
		swatchGroup: 1,
		combinationCount: 8,
	},
	mockDefaultShade,
	{
		id: "c104",
		hex: "#8B5E3C",
		nameJp: "栗色",
		nameEn: "Chestnut",
		swatchGroup: 1,
		combinationCount: 6,
	},
	{
		id: "c105",
		hex: "#4A2C17",
		nameJp: "焦茶",
		nameEn: "Chocolate",
		swatchGroup: 3,
		combinationCount: 4,
	},
];

const mockCombinations: Combination[] = [
	{
		id: "combo-1",
		nameJp: "配色一",
		nameEn: "Palette One",
		colors: [
			mockDefaultShade,
			{
				id: "c200",
				hex: "#5B8A5E",
				nameJp: "緑",
				nameEn: "Green",
				swatchGroup: 5,
				combinationCount: 5,
			},
		],
	},
	{
		id: "combo-2",
		nameJp: "配色二",
		nameEn: "Palette Two",
		colors: [
			mockDefaultShade,
			{
				id: "c201",
				hex: "#3D5C8B",
				nameJp: "青",
				nameEn: "Blue",
				swatchGroup: 2,
				combinationCount: 7,
			},
			{
				id: "c202",
				hex: "#D4A830",
				nameJp: "黄",
				nameEn: "Yellow",
				swatchGroup: 4,
				combinationCount: 3,
			},
		],
	},
];

jest.mock("@/data/wardrobeIndex", () => ({
	getRepresentativeShades: jest.fn(() => mockShades),
	getDefaultShade: jest.fn(() => mockDefaultShade),
	getCombinationsByWardrobe: jest.fn(() => []),
	getColorsByWardrobe: jest.fn(() => []),
}));

jest.mock("@/data/colorIndex", () => ({
	getCombinations: jest.fn(() => mockCombinations),
	getAllColors: jest.fn(() => []),
	getAllCombinations: jest.fn(() => []),
	getColorsByGroup: jest.fn(() => []),
	getColor: jest.fn(),
	getCombination: jest.fn(),
}));

// --- Tests ---

describe("ColorHome", () => {
	beforeEach(() => {
		mockPush.mockClear();
		mockToggleFavorite.mockClear();
		mockHandlePremiumGate.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(getCombinations as jest.Mock).mockReturnValue(mockCombinations);
	});

	// === State 1 tests (existing) ===

	it("renders the Outfinder header", () => {
		render(<ColorHome />);
		expect(screen.getByText("Outfinder")).toBeTruthy();
		expect(screen.getByText("What color are you wearing?")).toBeTruthy();
	});

	it("renders 6 basic fabric swatches on Page 1", () => {
		render(<ColorHome />);
		expect(screen.getByTestId("fabric-swatch-white")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-black")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-blue")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-grey")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-brown")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-green")).toBeTruthy();
	});

	it("renders 5 accent swatches on Page 2", () => {
		render(<ColorHome />);
		expect(screen.getByTestId("fabric-swatch-red")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-pink")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-yellow")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-purple")).toBeTruthy();
		expect(screen.getByTestId("fabric-swatch-orange")).toBeTruthy();
	});

	it("renders the dashed 'All 159 colors' card", () => {
		render(<ColorHome />);
		expect(screen.getByTestId("browse-all-card")).toBeTruthy();
	});

	it("fires hapticLight when a swatch is tapped", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-blue"));
		expect(hapticLight).toHaveBeenCalled();
	});

	it("navigates to BrowseAllColors when 'All 159 colors' card is tapped", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("browse-all-card"));
		expect(hapticLight).toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("BrowseAllColors");
	});

	it("shows browse link on Page 1 and navigates to BrowseAllColors", () => {
		render(<ColorHome />);
		const link = screen.getByTestId("browse-all-link");
		fireEvent.press(link);
		expect(mockPush).toHaveBeenCalledWith("BrowseAllColors");
	});

	it("renders page dots", () => {
		render(<ColorHome />);
		expect(screen.getByTestId("page-dots")).toBeTruthy();
		expect(screen.getByTestId("dot-0")).toBeTruthy();
		expect(screen.getByTestId("dot-1")).toBeTruthy();
	});

	it("has accessibility labels on all fabric swatches", () => {
		render(<ColorHome />);
		expect(
			screen.getByLabelText("White, tap to see combinations"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Black, tap to see combinations"),
		).toBeTruthy();
		expect(screen.getByLabelText("Blue, tap to see combinations")).toBeTruthy();
	});

	it("has accessibility label on browse all card", () => {
		render(<ColorHome />);
		const browseButtons = screen.getAllByLabelText("Browse all 159 colors");
		expect(browseButtons.length).toBeGreaterThanOrEqual(1);
	});

	// === State 2 tests ===

	it("tapping swatch renders State 2 header with family name", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		expect(screen.getByTestId("state-2")).toBeTruthy();
		expect(screen.getByText("← Brown")).toBeTruthy();
	});

	it("State 2 renders shade picker", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		expect(screen.getByTestId("shade-picker")).toBeTruthy();
		expect(screen.getAllByRole("tab")).toHaveLength(5);
	});

	it("State 2 renders combo cards", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		expect(screen.getByTestId("combo-feed")).toBeTruthy();
		expect(screen.getByTestId("combo-card-combo-1")).toBeTruthy();
		expect(screen.getByTestId("combo-card-combo-2")).toBeTruthy();
	});

	it("State 2 shows correct combo count", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		expect(screen.getByTestId("combo-count")).toBeTruthy();
		expect(screen.getByText("2 combos")).toBeTruthy();
	});

	it("back button returns to State 1", () => {
		render(<ColorHome />);

		// Enter State 2
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));
		expect(screen.getByTestId("state-2")).toBeTruthy();

		// Press back
		fireEvent.press(screen.getByTestId("state2-back-button"));
		expect(screen.queryByTestId("state-2")).toBeNull();
		expect(screen.getByText("Outfinder")).toBeTruthy();
	});

	it("shade change updates combo feed", () => {
		const altCombos = [mockCombinations[0]];

		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		// Verify initial count
		expect(screen.getByText("2 combos")).toBeTruthy();

		// Change mock return for new shade
		(getCombinations as jest.Mock).mockReturnValue(altCombos);

		// Tap different shade
		fireEvent.press(screen.getByTestId("shade-pill-c101"));

		// Count should update
		expect(screen.getByText("1 combo")).toBeTruthy();
	});

	it("shade press fires hapticLight", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		// Clear haptic mock (FabricSwatch fires hapticLight on its own press)
		(hapticLight as jest.Mock).mockClear();

		// Press a different shade
		fireEvent.press(screen.getByTestId("shade-pill-c101"));

		expect(hapticLight).toHaveBeenCalledTimes(1);
	});

	it("combo card navigation pushes OutfitVisualizer", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		fireEvent.press(screen.getByTestId("combo-card-combo-1"));

		expect(mockPush).toHaveBeenCalledWith("OutfitVisualizer", {
			combinationId: "combo-1",
		});
	});

	it("State 2 back button has accessibility label", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		expect(screen.getByLabelText("Back to color families")).toBeTruthy();
	});

	it("shade picker shows selected state for default shade", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		// Default shade (c103, "Tan") should be selected
		expect(screen.getByLabelText("Tan, selected")).toBeTruthy();
	});

	it("combo card press fires hapticMedium", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		(hapticMedium as jest.Mock).mockClear();
		fireEvent.press(screen.getByTestId("combo-card-combo-1"));

		expect(hapticMedium).toHaveBeenCalledTimes(1);
	});

	it("empty state shown when shade has 0 combos", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		// Change mock to return 0 combos
		(getCombinations as jest.Mock).mockReturnValue([]);
		fireEvent.press(screen.getByTestId("shade-pill-c101"));

		expect(
			screen.getByText("No combinations for this shade. Try another."),
		).toBeTruthy();
		expect(screen.queryByTestId("combo-feed")).toBeNull();
	});
});

// === Reduced motion tests ===

describe("ColorHome (reduced motion)", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(getCombinations as jest.Mock).mockReturnValue(mockCombinations);

		// Override useReducedMotion to return true
		jest
			.spyOn(require("@/hooks/useReducedMotion"), "useReducedMotion")
			.mockReturnValue(true);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("transforms instantly to State 2 when reduced motion enabled", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		// State 2 should appear immediately
		expect(screen.getByTestId("state-2")).toBeTruthy();
		expect(screen.getByText("← Brown")).toBeTruthy();
	});

	it("returns instantly to State 1 when reduced motion enabled", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));
		expect(screen.getByTestId("state-2")).toBeTruthy();

		fireEvent.press(screen.getByTestId("state2-back-button"));
		expect(screen.queryByTestId("state-2")).toBeNull();
		expect(screen.getByText("Outfinder")).toBeTruthy();
	});
});

// === Premium user tests ===

describe("ColorHome (premium user)", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(getCombinations as jest.Mock).mockReturnValue(mockCombinations);

		// Override usePremiumGate to return isPremium: true
		jest
			.spyOn(require("@/hooks/usePremiumGate"), "usePremiumGate")
			.mockReturnValue({
				isPremium: true,
				paywallVisible: false,
				blockedCombination: undefined,
				toastVisible: false,
				toastOpacity: { current: 1 },
				favoriteCombinationIds: [],
				priceString: "$2.99",
				purchaseState: "idle",
				errorMessage: null,
				handlePremiumGate: jest.fn(),
				handleDismiss: jest.fn(),
				handlePurchase: jest.fn(),
				handleRestore: jest.fn(),
				openPaywall: jest.fn(),
			});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("premium user can favorite without paywall gate", () => {
		render(<ColorHome />);
		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		// Tap favorite on first combo card
		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));

		// toggleFavorite should be called directly (no paywall gate)
		expect(mockToggleFavorite).toHaveBeenCalledWith("combo-1");
	});
});
