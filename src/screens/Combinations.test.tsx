import { render, screen } from "@testing-library/react-native";
import { getColor, getCombinations } from "@/data/colorIndex";
import { Combinations } from "./Combinations";

jest.mock("@react-navigation/native-stack", () => ({
	createNativeStackNavigator: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: jest.fn() }),
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

jest.mock("expo-symbols", () => ({
	SymbolView: "SymbolView",
}));

jest.mock("react-native-reanimated");

let mockToastVisible = false;
jest.mock("@/hooks/usePremiumGate", () => ({
	usePremiumGate: () => ({
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
	it("renders ColorHeader with the correct color name", () => {
		renderCombinations("c001");

		expect(screen.getByTestId("color-header")).toBeTruthy();
		expect(
			screen.getByLabelText(
				`${realColor.nameEn}, ${realCombinations.length} combinations`,
			),
		).toBeTruthy();
	});

	it("renders ColorHeader with correct combination count", () => {
		renderCombinations("c001");

		expect(
			screen.getByText(`${realCombinations.length} combinations`),
		).toBeTruthy();
	});

	it("renders CombinationList with combinations for selected color", () => {
		renderCombinations("c001");

		const flatList = screen.getByTestId("combination-list");
		expect(flatList.props.data).toHaveLength(realCombinations.length);
	});

	it("passes selectedColorId to CombinationList", () => {
		renderCombinations("c001");

		const flatList = screen.getByTestId("combination-list");
		const rendered = flatList.props.renderItem({
			item: realCombinations[0],
			index: 0,
		});
		expect(rendered.props.selectedColorId).toBe("c001");
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

	it("passes isFavorite and onToggleFavorite to CombinationList", () => {
		renderCombinations("c001");

		const flatList = screen.getByTestId("combination-list");
		const rendered = flatList.props.renderItem({
			item: realCombinations[0],
			index: 0,
		});
		expect(rendered.props.isFavorite).toBe(false);
		expect(rendered.props.onToggleFavorite).toBeDefined();
	});

	// accessibilityLiveRegion (Story 6.3)
	it("has polite liveRegion on premium toast", () => {
		mockToastVisible = true;
		renderCombinations("c001");

		const toast = screen.getByTestId("premium-toast");
		expect(toast.props.accessibilityLiveRegion).toBe("polite");
	});
});
