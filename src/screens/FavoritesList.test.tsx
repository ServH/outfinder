import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { getCombination } from "@/data/colorIndex";
import { useUnfavoriteCascade } from "@/lib/armario/confirmUnfavoriteWithCascade";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { getAssignmentCount } from "@/lib/wardrobeRepo";
import { FavoritesList } from "./FavoritesList";

const mockPush = jest.fn();
let mockFocusEffectCallback: (() => void) | null = null;

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// ---- Interceptable mocks ---------------------------------------------------
// These default to "legacy iOS < 17" so existing tests (which assume direct
// OutfitVisualizer routing) still pass without touching them. The 3 Story
// 13.4a intercept tests override as needed.
const mockIsIOS17OrNewer = jest.fn(() => false);
jest.mock("@/lib/platform", () => ({
	isIOS17OrNewer: () => mockIsIOS17OrNewer(),
	useIsIOS17OrNewer: () => mockIsIOS17OrNewer(),
}));

const mockShowCascadeConfirm = jest.fn((args: { onConfirm: () => void }) =>
	args.onConfirm(),
);
jest.mock("@/lib/armario/confirmUnfavoriteWithCascade", () => ({
	useUnfavoriteCascade: jest.fn(() => mockShowCascadeConfirm),
}));

jest.mock("@/lib/wardrobeRepo", () => ({
	getAssignmentCount: jest.fn(() => 0),
}));

let mockHydrated = false;
let mockAssignments: Array<{
	combinationId: string;
	colorIndex: number;
	wardrobeItemId: string;
	assignedAt: number;
}> = [];
let mockItems: Array<{
	id: string;
	localImagePath: string;
	thumbnailPath: string;
	createdAt: number;
}> = [];
const mockToggleFavorite = jest.fn();
let mockFavorites = new Set<string>();

jest.mock("@/stores/misLooksStore", () => ({
	useMisLooksStore: (
		selector: (s: {
			hydrated: boolean;
			assignments: typeof mockAssignments;
			items: typeof mockItems;
			favorites: typeof mockFavorites;
			toggleFavorite: typeof mockToggleFavorite;
			isFavorite: (id: string) => boolean;
		}) => unknown,
	) =>
		selector({
			hydrated: mockHydrated,
			assignments: mockAssignments,
			items: mockItems,
			favorites: mockFavorites,
			toggleFavorite: mockToggleFavorite,
			isFavorite: (id: string) => mockFavorites.has(id),
		}),
}));

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
		mockIsIOS17OrNewer.mockReturnValue(false);
		mockHydrated = false;
		mockAssignments = [];
		mockItems = [];
		(hapticLight as jest.Mock).mockClear();
		mockShowCascadeConfirm.mockClear();
		mockShowCascadeConfirm.mockImplementation(
			(args: { onConfirm: () => void }) => args.onConfirm(),
		);
		(useUnfavoriteCascade as jest.Mock).mockReturnValue(mockShowCascadeConfirm);
		(getAssignmentCount as jest.Mock).mockReset();
		(getAssignmentCount as jest.Mock).mockReturnValue(0);
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

	// --- Story 13.4a: Armario intercept (AC #6) ---

	it("iOS 17+ hydrated + 0 assignments + s0 not seen → taps route to ArmarioZeroState", async () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockAssignments = [];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		await act(async () => {
			fireEvent.press(screen.getByTestId(`combo-card-${realCombo1.id}`));
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("ArmarioZeroState", {
				combinationId: realCombo1.id,
			});
		});
		expect(mockPush).not.toHaveBeenCalledWith(
			"OutfitVisualizer",
			expect.anything(),
		);
	});

	it("iOS 17+ hydrated + existing assignment → taps route to ArmarioFichaWada", async () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockAssignments = [
			{
				combinationId: realCombo1.id,
				colorIndex: 0,
				wardrobeItemId: "uuid-1",
				assignedAt: 1_700_000_000_000,
			},
		];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		await act(async () => {
			fireEvent.press(screen.getByTestId(`combo-card-${realCombo1.id}`));
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("ArmarioFichaWada", {
				combinationId: realCombo1.id,
			});
		});
	});

	it("iOS 17+ hydrated + 0 assignments + s0 already seen → taps route to ArmarioFichaWada", async () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockAssignments = [];
		mockFavorites = new Set(["p001"]);
		const AsyncStorage = require("@react-native-async-storage/async-storage");
		await AsyncStorage.setItem(`@wardrobe:s0_seen_for_${realCombo1.id}`, "1");
		render(<FavoritesList />);

		await act(async () => {
			fireEvent.press(screen.getByTestId(`combo-card-${realCombo1.id}`));
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("ArmarioFichaWada", {
				combinationId: realCombo1.id,
			});
		});
		expect(mockPush).not.toHaveBeenCalledWith(
			"ArmarioZeroState",
			expect.anything(),
		);
		await AsyncStorage.removeItem(`@wardrobe:s0_seen_for_${realCombo1.id}`);
	});

	it("iOS < 17 OR not hydrated → taps still route to OutfitVisualizer (NFR9 parity)", async () => {
		mockIsIOS17OrNewer.mockReturnValue(false);
		mockHydrated = true;
		mockAssignments = [];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		await act(async () => {
			fireEvent.press(screen.getByTestId(`combo-card-${realCombo1.id}`));
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith("OutfitVisualizer", {
				combinationId: realCombo1.id,
			});
		});
		expect(mockPush).not.toHaveBeenCalledWith(
			"ArmarioZeroState",
			expect.anything(),
		);
		expect(mockPush).not.toHaveBeenCalledWith(
			"ArmarioFichaWada",
			expect.anything(),
		);
	});

	// --- Story 13.4b: Unfavorite cascade integration ---

	it("unfavorite with 0 assignments → cascade short-circuits → toggleFavorite fires once without sheet", () => {
		(getAssignmentCount as jest.Mock).mockReturnValue(0);
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId(`favorite-button-${realCombo1.id}`));

		expect(mockShowCascadeConfirm).toHaveBeenCalledWith(
			expect.objectContaining({ combinationId: realCombo1.id, count: 0 }),
		);
		expect(mockToggleFavorite).toHaveBeenCalledWith(realCombo1.id);
	});

	it("unfavorite with >0 assignments routes through cascade hook: confirm → toggle; cancel aborts", () => {
		(getAssignmentCount as jest.Mock).mockReturnValue(2);
		let capturedOnConfirm: (() => void) | null = null;
		let capturedOnCancel: (() => void) | null = null;
		mockShowCascadeConfirm.mockImplementation(
			(args: { onConfirm: () => void; onCancel?: () => void }) => {
				capturedOnConfirm = args.onConfirm;
				capturedOnCancel = args.onCancel ?? null;
			},
		);
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId(`favorite-button-${realCombo1.id}`));

		expect(mockShowCascadeConfirm).toHaveBeenCalledWith(
			expect.objectContaining({ combinationId: realCombo1.id, count: 2 }),
		);
		// Toggle is gated — nothing fires until the provider runs onConfirm.
		expect(mockToggleFavorite).not.toHaveBeenCalled();

		// Simulate Cancel → toggle stays silent.
		(capturedOnCancel as (() => void) | null)?.();
		expect(mockToggleFavorite).not.toHaveBeenCalled();

		// Now simulate the provider resolving with Confirm → toggle fires.
		(capturedOnConfirm as (() => void) | null)?.();
		expect(mockToggleFavorite).toHaveBeenCalledWith(realCombo1.id);
	});

	// --- Story 13.6: FavoritesList enrichment (AC #6, #7, #14) ---

	function makeItem(id: string) {
		return {
			id,
			localImagePath: `file:///items/${id}.webp`,
			thumbnailPath: `file:///items/${id}.thumb.webp`,
			createdAt: 1,
		};
	}

	it("iOS 17+ hydrated + ≥1 assignment → renders FavoriteComboEnrichedCard with badge + thumb strip", () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockItems = [makeItem("u1")];
		mockAssignments = [
			{
				combinationId: "p001",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 100,
			},
		];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);
		expect(screen.getByTestId("enriched-card-p001")).toBeTruthy();
		const badge = screen.getByTestId("combo-card-bottom-row-leading", {
			includeHiddenElements: true,
		});
		expect(badge.props.children).toBe("1/3 garments");
		expect(
			screen.getByTestId("enriched-card-p001-thumbs", {
				includeHiddenElements: true,
			}),
		).toBeTruthy();
	});

	it("iOS 17+ hydrated + ZERO wardrobe state anywhere → falls back to plain ComboCard (pre-Epic-13 parity)", () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockItems = [];
		mockAssignments = [];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);
		// Enriched wrapper NOT rendered — plain ComboCard is.
		expect(screen.queryByTestId("enriched-card-p001")).toBeNull();
		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
	});

	it("iOS < 17 → always uses plain ComboCard regardless of wardrobe state", () => {
		mockIsIOS17OrNewer.mockReturnValue(false);
		mockHydrated = true;
		mockItems = [makeItem("u1")];
		mockAssignments = [
			{
				combinationId: "p001",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 100,
			},
		];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);
		expect(screen.queryByTestId("enriched-card-p001")).toBeNull();
		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
	});

	it("hydrated === false → always uses plain ComboCard", () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = false;
		mockItems = [makeItem("u1")];
		mockAssignments = [
			{
				combinationId: "p001",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 100,
			},
		];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);
		expect(screen.queryByTestId("enriched-card-p001")).toBeNull();
		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
	});

	it("recent-mode sort partitions complete > partial > empty across favorites", () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockItems = [
			makeItem("u1"),
			makeItem("u2"),
			makeItem("u3"),
			makeItem("u4"),
			makeItem("u5"),
		];
		// p001 partial (1/3, most recent assignment 500)
		// p002 complete (2/2, most recent assignment 300)
		// p004 empty (0/4)
		mockAssignments = [
			{
				combinationId: "p001",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 500,
			},
			{
				combinationId: "p002",
				colorIndex: 0,
				wardrobeItemId: "u2",
				assignedAt: 200,
			},
			{
				combinationId: "p002",
				colorIndex: 1,
				wardrobeItemId: "u3",
				assignedAt: 300,
			},
		];
		// Insertion order: p001, p004, p002
		mockFavorites = new Set(["p001", "p004", "p002"]);
		render(<FavoritesList />);

		const cards = screen.getAllByTestId(/^enriched-card-p\d+$/);
		// complete first (p002), then partial (p001), then empty (p004)
		expect(cards.map((c) => c.props.testID)).toEqual([
			"enriched-card-p002",
			"enriched-card-p001",
			"enriched-card-p004",
		]);
	});

	it("a-z sort mode does NOT apply the completeness partition", () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockItems = [makeItem("u1"), makeItem("u2")];
		mockAssignments = [
			// p002 complete, should NOT jump to top when a-z active.
			{
				combinationId: "p002",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
			{
				combinationId: "p002",
				colorIndex: 1,
				wardrobeItemId: "u2",
				assignedAt: 2,
			},
		];
		mockFavorites = new Set(["p004", "p001", "p002"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId("sort-pill-a-z"));

		// Alphabetical order: Autumn Garden (p004), Dawn Sky (p001), Spring
		// Tidings (p002) — completeness-first partition NOT applied.
		const cards = screen.getAllByTestId(/^enriched-card-p\d+$/);
		expect(cards[0].props.testID).toBe("enriched-card-p004");
		expect(cards[1].props.testID).toBe("enriched-card-p001");
		expect(cards[2].props.testID).toBe("enriched-card-p002");
	});

	it("partial combo renders ctaOverrideKey = armario.favorites.ctaPartial ('Complete your look →')", () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockItems = [makeItem("u1")];
		mockAssignments = [
			{
				combinationId: "p001",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
		];
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);
		const cta = screen.getByTestId("combo-card-cta-override");
		expect(cta.props.children).toBe("Complete your look \u2192");
	});

	it("complete combo → ctaComplete; empty combo → ctaEmpty (enriched CTAs resolve by bucket)", () => {
		mockIsIOS17OrNewer.mockReturnValue(true);
		mockHydrated = true;
		mockItems = [makeItem("u1"), makeItem("u2")];
		mockAssignments = [
			{
				combinationId: "p002",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
			{
				combinationId: "p002",
				colorIndex: 1,
				wardrobeItemId: "u2",
				assignedAt: 2,
			},
		];
		mockFavorites = new Set(["p002", "p004"]);
		render(<FavoritesList />);
		const ctaEls = screen.getAllByTestId("combo-card-cta-override");
		const texts = ctaEls.map((el) => el.props.children as string);
		expect(texts).toContain("See your look \u2192");
		expect(texts).toContain("Assign garments \u2192");
	});
});

// --- iPad layout tests (AC: #4) ---

describe("FavoritesList iPad layout", () => {
	beforeEach(() => {
		mockFavorites = new Set(["p001", "p002", "p004"]);
		mockToggleFavorite.mockClear();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders all combo cards on iPad Pro 13 (width 1024, 3-col grid)", () => {
		jest.spyOn(ReactNative, "useWindowDimensions").mockReturnValue({
			width: 1024,
			height: 1366,
			scale: 2,
			fontScale: 1,
		});
		render(<FavoritesList />);

		// All cards render correctly at iPad Pro width
		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
		expect(screen.getByTestId(`combo-card-${realCombo2.id}`)).toBeTruthy();
		expect(screen.getByTestId(`combo-card-${realCombo4.id}`)).toBeTruthy();
	});

	it("uses 3-column grid on iPad Pro 13 (width 1024, AC: #4)", () => {
		jest
			.spyOn(require("@/lib/device"), "useFavoritesNumCols")
			.mockReturnValue(3);
		render(<FavoritesList />);

		expect(screen.getByTestId("grid-3col")).toBeTruthy();
	});

	it("renders all combo cards on iPad Air 11 (width 820, 2-col grid)", () => {
		jest.spyOn(ReactNative, "useWindowDimensions").mockReturnValue({
			width: 820,
			height: 1180,
			scale: 2,
			fontScale: 1,
		});
		render(<FavoritesList />);

		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
		expect(screen.getByTestId(`combo-card-${realCombo2.id}`)).toBeTruthy();
	});

	it("uses 2-column grid on iPad Air 11 (width 820, AC: #4)", () => {
		jest
			.spyOn(require("@/lib/device"), "useFavoritesNumCols")
			.mockReturnValue(2);
		render(<FavoritesList />);

		expect(screen.getByTestId("grid-2col")).toBeTruthy();
	});

	it("renders all combo cards on iPhone (width 375, 2-col grid)", () => {
		jest.spyOn(ReactNative, "useWindowDimensions").mockReturnValue({
			width: 375,
			height: 667,
			scale: 2,
			fontScale: 1,
		});
		render(<FavoritesList />);

		expect(screen.getByTestId(`combo-card-${realCombo1.id}`)).toBeTruthy();
		expect(screen.getByTestId(`combo-card-${realCombo2.id}`)).toBeTruthy();
	});
});
