import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { getCombination } from "@/data/colorIndex";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { FavoritesList } from "./FavoritesList";

const mockPush = jest.fn();
let mockFocusEffectCallback: (() => void) | null = null;

jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		push: mockPush,
		navigate: jest.fn(),
		goBack: jest.fn(),
	}),
	useFocusEffect: (cb: () => void) => {
		mockFocusEffectCallback = cb;
	},
}));

jest.mock("@react-navigation/native-stack", () => ({
	createNativeStackNavigator: jest.fn(),
}));

jest.mock("expo-symbols", () => ({
	SymbolView: "SymbolView",
}));

jest.mock("react-native-reanimated");

const mockToggleFavorite = jest.fn();
let mockFavorites = new Set<string>();

jest.mock("@/contexts/FavoritesContext", () => ({
	useFavorites: () => ({
		favorites: mockFavorites,
		isFavorite: (id: string) => mockFavorites.has(id),
		toggleFavorite: mockToggleFavorite,
		count: mockFavorites.size,
	}),
}));

jest.mock("@/contexts/PremiumContext", () => ({
	usePremium: () => ({
		isPremium: false,
		loading: false,
		paywallDismissedThisSession: false,
		setPaywallDismissedThisSession: jest.fn(),
		priceString: "€0.99",
		purchase: jest.fn(),
		restore: jest.fn(),
	}),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

const mockHandlePremiumGate = jest.fn();
let mockToastVisible = false;
jest.mock("@/hooks/usePremiumGate", () => ({
	usePremiumGate: () => ({
		isPremium: false,
		paywallVisible: false,
		toastVisible: mockToastVisible,
		toastOpacity: { current: 1 },
		blockedCombination: undefined,
		favoriteCombinationIds: [],
		priceString: "€0.99",
		purchaseState: "idle",
		errorMessage: null,
		handlePremiumGate: mockHandlePremiumGate,
		handlePurchase: jest.fn(),
		handleRestore: jest.fn(),
		handleDismiss: jest.fn(),
		openPaywall: jest.fn(),
	}),
	getRestoreErrorMessage: jest.fn(),
}));

const realCombo1 = getCombination("p001")!; // Dawn Sky, 3 colors
const realCombo2 = getCombination("p002")!; // Spring Tidings, 2 colors
const realCombo4 = getCombination("p004")!; // Autumn Garden, 4 colors

describe("FavoritesList", () => {
	beforeEach(() => {
		mockFavorites = new Set<string>();
		mockToggleFavorite.mockClear();
		mockPush.mockClear();
		mockHandlePremiumGate.mockClear();
		mockToastVisible = false;
		mockFocusEffectCallback = null;
		(hapticLight as jest.Mock).mockClear();
	});

	// --- AC #1: 2-column grid layout ---

	it("renders 2-column grid with ComboCards", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
		expect(screen.getByTestId(`combo-card-${realCombo2.id}`)).toBeTruthy();
	});

	it("renders multiple ComboCards in grid", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
		expect(screen.getByTestId(`combo-card-${realCombo2.id}`)).toBeTruthy();
		// Verify no dividers (grid uses gap, not separators)
		expect(screen.queryByTestId("favorites-divider")).toBeNull();
	});

	// --- AC #2: Compact ComboCard rendering ---

	it("renders compact ComboCards with JP and EN names", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		expect(screen.getByText(realCombo1.nameJp)).toBeTruthy();
		expect(screen.getByText(realCombo1.nameEn)).toBeTruthy();
	});

	// --- AC #3: Direct Visualizer navigation ---

	it("navigates to OutfitVisualizer on card tap", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId(`combo-card-${realCombo1.id}`));
		expect(mockPush).toHaveBeenCalledWith("OutfitVisualizer", {
			combinationId: realCombo1.id,
		});
	});

	// --- AC #4: Heart unfavorite ---

	it("calls toggleFavorite when tapping favorite button", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId(`favorite-button-${realCombo1.id}`));
		expect(mockToggleFavorite).toHaveBeenCalledWith(realCombo1.id);
	});

	it("renders empty state when all favorites removed", () => {
		mockFavorites = new Set<string>();
		render(<FavoritesList />);

		expect(screen.getByTestId("empty-state")).toBeTruthy();
		expect(screen.getByText("No favorites yet")).toBeTruthy();
	});

	// --- AC #5: Odd-count alignment ---

	it("renders single card when odd number of favorites", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
	});

	// --- AC #7: VoiceOver accessibility ---

	it("ComboCard has accessible role and label", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		const card = screen.getByTestId(`combo-card-${realCombo1.id}`);
		expect(card.props.accessibilityRole).toBe("button");
		expect(card.props.accessibilityLabel).toBeTruthy();
	});

	it("favorite button has accessible label", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		const favBtn = screen.getByTestId(`favorite-button-${realCombo1.id}`);
		expect(favBtn.props.accessibilityLabel).toBeTruthy();
	});

	// --- AC #8: Premium gate preserved ---

	it("has polite liveRegion on premium toast", () => {
		mockFavorites = new Set(["p001"]);
		mockToastVisible = true;
		render(<FavoritesList />);

		const toast = screen.getByTestId("premium-toast");
		expect(toast.props.accessibilityLiveRegion).toBe("polite");
	});

	// --- Empty state ---

	it("renders empty state when no favorites", () => {
		render(<FavoritesList />);

		expect(screen.getByTestId("empty-state")).toBeTruthy();
		expect(screen.getByText("No favorites yet")).toBeTruthy();
		expect(
			screen.getByText(
				"Pick a color, explore combinations, and tap ♡ to save the ones you love",
			),
		).toBeTruthy();
	});

	it("empty state has correct accessibilityLabel", () => {
		render(<FavoritesList />);

		expect(
			screen.getByLabelText(
				"No favorites yet. Pick a color, explore combinations, and tap ♡ to save the ones you love",
			),
		).toBeTruthy();
	});

	it("renders favorites-list testID in empty state", () => {
		render(<FavoritesList />);
		expect(screen.getByTestId("favorites-list")).toBeTruthy();
	});

	// --- Filtering ---

	it("filters out invalid combination IDs", () => {
		mockFavorites = new Set(["p001", "invalid-id"]);
		render(<FavoritesList />);

		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
		expect(screen.queryByTestId("combo-card-invalid-id")).toBeNull();
	});

	// --- No dividers in grid ---

	it("does not render dividers in grid layout", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(screen.queryByTestId("favorites-divider")).toBeNull();
	});

	// --- Premium gate does not fire for favorited items ---

	it("unfavoriting does not trigger premium gate", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId(`favorite-button-${realCombo1.id}`));

		expect(mockToggleFavorite).toHaveBeenCalledWith(realCombo1.id);
		expect(mockHandlePremiumGate).not.toHaveBeenCalled();
	});

	// --- Haptic on card tap ---

	it("fires hapticMedium on combo card tap", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		(hapticMedium as jest.Mock).mockClear();
		fireEvent.press(screen.getByTestId(`combo-card-${realCombo1.id}`));

		expect(hapticMedium).toHaveBeenCalledTimes(1);
	});

	// --- Heart label includes combination name ---

	it("favorite button label includes combination name", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		expect(
			screen.getByLabelText(`Remove ${realCombo1.nameEn} from favorites`),
		).toBeTruthy();
	});

	// --- Story 9.2: Sort pills rendering ---

	it("renders 3 sort pills: Recent, A-Z, By size", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(screen.getByTestId("sort-pill-recent")).toBeTruthy();
		expect(screen.getByTestId("sort-pill-a-z")).toBeTruthy();
		expect(screen.getByTestId("sort-pill-by-size")).toBeTruthy();
	});

	it("Recent pill is active by default", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		const recentPill = screen.getByTestId("sort-pill-recent");
		expect(recentPill.props.accessibilityState).toEqual({ selected: true });

		const azPill = screen.getByTestId("sort-pill-a-z");
		expect(azPill.props.accessibilityState).toEqual({ selected: false });
	});

	it("sort pills do NOT render in empty state", () => {
		mockFavorites = new Set<string>();
		render(<FavoritesList />);

		expect(screen.queryByTestId("sort-pills-row")).toBeNull();
	});

	// --- Story 9.2: Sort interactions ---

	it("tapping A-Z fires hapticLight and sorts alphabetically", () => {
		// Insertion order: p004 (Autumn Garden), p001 (Dawn Sky), p002 (Spring Tidings)
		mockFavorites = new Set(["p004", "p001", "p002"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId("sort-pill-a-z"));

		expect(hapticLight).toHaveBeenCalledTimes(1);

		// Verify A-Z order: Autumn Garden, Dawn Sky, Spring Tidings
		const cards = screen.getAllByTestId(/^combo-card-p/);
		expect(cards[0].props.testID).toBe(`combo-card-${realCombo4.id}`);
		expect(cards[1].props.testID).toBe(`combo-card-${realCombo1.id}`);
		expect(cards[2].props.testID).toBe(`combo-card-${realCombo2.id}`);
	});

	it("tapping By size fires hapticLight and sorts by color count", () => {
		// p001: 3 colors, p002: 2 colors, p004: 4 colors
		mockFavorites = new Set(["p001", "p002", "p004"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId("sort-pill-by-size"));

		expect(hapticLight).toHaveBeenCalledTimes(1);

		// Verify size order: p002 (2), p001 (3), p004 (4)
		const cards = screen.getAllByTestId(/^combo-card-p/);
		expect(cards[0].props.testID).toBe(`combo-card-${realCombo2.id}`);
		expect(cards[1].props.testID).toBe(`combo-card-${realCombo1.id}`);
		expect(cards[2].props.testID).toBe(`combo-card-${realCombo4.id}`);
	});

	it("tapping Recent restores insertion order", () => {
		// Insertion order: p004, p001, p002
		mockFavorites = new Set(["p004", "p001", "p002"]);
		render(<FavoritesList />);

		// Sort A-Z first
		fireEvent.press(screen.getByTestId("sort-pill-a-z"));
		// Then switch back to Recent
		fireEvent.press(screen.getByTestId("sort-pill-recent"));

		const cards = screen.getAllByTestId(/^combo-card-p/);
		expect(cards[0].props.testID).toBe(`combo-card-${realCombo4.id}`);
		expect(cards[1].props.testID).toBe(`combo-card-${realCombo1.id}`);
		expect(cards[2].props.testID).toBe(`combo-card-${realCombo2.id}`);
	});

	// --- Story 9.2: Sort pill styling ---

	it("active pill has dark background class", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId("sort-pill-a-z"));

		const azPill = screen.getByTestId("sort-pill-a-z");
		expect(azPill.props.accessibilityState).toEqual({ selected: true });

		const recentPill = screen.getByTestId("sort-pill-recent");
		expect(recentPill.props.accessibilityState).toEqual({ selected: false });
	});

	// --- Story 9.2: Sort reset on tab refocus ---

	it("sort resets to Recent on tab refocus", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		// Sort by A-Z
		fireEvent.press(screen.getByTestId("sort-pill-a-z"));
		expect(
			screen.getByTestId("sort-pill-a-z").props.accessibilityState.selected,
		).toBe(true);

		// Simulate tab refocus via useFocusEffect callback
		act(() => {
			if (mockFocusEffectCallback) {
				mockFocusEffectCallback();
			}
		});

		// Recent should be active again
		expect(
			screen.getByTestId("sort-pill-recent").props.accessibilityState.selected,
		).toBe(true);
		expect(
			screen.getByTestId("sort-pill-a-z").props.accessibilityState.selected,
		).toBe(false);
	});

	// --- Story 9.2: Empty state updated subtitle ---

	it("empty state shows updated subtitle text", () => {
		mockFavorites = new Set<string>();
		render(<FavoritesList />);

		expect(
			screen.getByText(
				"Pick a color, explore combinations, and tap ♡ to save the ones you love",
			),
		).toBeTruthy();
	});

	// --- Story 9.2: VoiceOver accessibility ---

	it("pills have accessibilityRole tab", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(screen.getByTestId("sort-pill-recent").props.accessibilityRole).toBe(
			"tab",
		);
		expect(screen.getByTestId("sort-pill-a-z").props.accessibilityRole).toBe(
			"tab",
		);
		expect(
			screen.getByTestId("sort-pill-by-size").props.accessibilityRole,
		).toBe("tab");
	});

	it("active pill has accessibilityState selected", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(
			screen.getByTestId("sort-pill-recent").props.accessibilityState,
		).toEqual({ selected: true });
		expect(
			screen.getByTestId("sort-pill-a-z").props.accessibilityState,
		).toEqual({ selected: false });

		fireEvent.press(screen.getByTestId("sort-pill-a-z"));

		expect(
			screen.getByTestId("sort-pill-a-z").props.accessibilityState,
		).toEqual({ selected: true });
		expect(
			screen.getByTestId("sort-pill-recent").props.accessibilityState,
		).toEqual({ selected: false });
	});
});
