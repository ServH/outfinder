import { fireEvent, render, screen } from "@testing-library/react-native";
import { getColor, getCombinations } from "@/data/colorIndex";
import { hapticMedium } from "@/lib/haptics";
import { Combinations } from "./Combinations";

jest.mock("@/lib/haptics");

jest.mock("@react-navigation/native-stack", () => ({
	createNativeStackNavigator: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

const mockIsFavorite = jest.fn().mockReturnValue(false);
const mockToggleFavorite = jest.fn();

jest.mock("@/contexts/FavoritesContext", () => ({
	useFavorites: () => ({
		favorites: new Set(),
		isFavorite: mockIsFavorite,
		toggleFavorite: mockToggleFavorite,
		count: 0,
	}),
}));

jest.mock("expo-symbols", () => ({
	SymbolView: "SymbolView",
}));

jest.mock("react-native-reanimated");

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
		handlePremiumGate: jest.fn(),
		handlePurchase: jest.fn(),
		handleRestore: jest.fn(),
		handleDismiss: jest.fn(),
		openPaywall: jest.fn(),
	}),
	getRestoreErrorMessage: jest.fn(),
}));

const realColor = getColor("c001")!;
const realCombinations = getCombinations("c001");

function renderCombinations(colorId: string) {
	const mockRoute = {
		params: { colorId },
		key: "test",
		name: "Combinations" as const,
	};
	const mockNavigation = {} as never;
	return render(<Combinations route={mockRoute} navigation={mockNavigation} />);
}

describe("Combinations", () => {
	beforeEach(() => {
		mockPush.mockClear();
		mockToggleFavorite.mockClear();
		mockIsFavorite.mockReturnValue(false);
		(hapticMedium as jest.Mock).mockClear();
		mockToastVisible = false;
	});

	it("renders color header with swatch and English name", () => {
		renderCombinations("c001");

		expect(screen.getByTestId("color-header")).toBeTruthy();
		expect(screen.getByTestId("color-header-swatch")).toBeTruthy();
		expect(screen.getByText(realColor.nameEn)).toBeTruthy();
	});

	it("renders combo count in header", () => {
		renderCombinations("c001");

		expect(screen.getByTestId("combo-count")).toBeTruthy();
		expect(screen.getByText(`${realCombinations.length} combos`)).toBeTruthy();
	});

	it("renders header with accessibility label", () => {
		renderCombinations("c001");

		expect(
			screen.getByLabelText(
				`${realColor.nameEn}, ${realCombinations.length} combinations`,
			),
		).toBeTruthy();
	});

	it("renders ComboCards in the feed", () => {
		renderCombinations("c001");

		const feed = screen.getByTestId("combo-feed");
		expect(feed.props.data).toHaveLength(realCombinations.length);
	});

	it("ComboCard navigates to OutfitVisualizer on press", () => {
		renderCombinations("c001");

		const firstComboId = realCombinations.sort(
			(a, b) => a.colors.length - b.colors.length,
		)[0].id;
		fireEvent.press(screen.getByTestId(`combo-card-${firstComboId}`));

		expect(hapticMedium).toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("OutfitVisualizer", {
			combinationId: firstComboId,
		});
	});

	it("renders null for invalid colorId", () => {
		const mockRoute = {
			params: { colorId: "invalid-id" },
			key: "test",
			name: "Combinations" as const,
		};
		const { toJSON } = render(
			<Combinations route={mockRoute} navigation={{} as never} />,
		);

		expect(toJSON()).toBeNull();
	});

	it("shows 'yours' label on the user's color in combo card strip", () => {
		renderCombinations("c001");

		// The selected color should have a "yours" label in at least one combo card
		const yoursLabels = screen.queryAllByTestId("yours-label");
		expect(yoursLabels.length).toBeGreaterThanOrEqual(1);
	});

	it("has polite liveRegion on premium toast", () => {
		mockToastVisible = true;
		renderCombinations("c001");

		const toast = screen.getByTestId("premium-toast");
		expect(toast.props.accessibilityLiveRegion).toBe("polite");
	});
});
