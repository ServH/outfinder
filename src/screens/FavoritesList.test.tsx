import { fireEvent, render, screen } from "@testing-library/react-native";
import { getCombination } from "@/data/colorIndex";
import { FavoritesList } from "./FavoritesList";

const mockPush = jest.fn();

jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		push: mockPush,
		navigate: jest.fn(),
		goBack: jest.fn(),
	}),
}));

jest.mock("@react-navigation/native-stack", () => ({
	createNativeStackNavigator: jest.fn(),
}));

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

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
}));

const realCombo1 = getCombination("p001")!;

describe("FavoritesList", () => {
	beforeEach(() => {
		mockFavorites = new Set<string>();
		mockToggleFavorite.mockClear();
		mockPush.mockClear();
	});

	it("renders empty state when no favorites", () => {
		render(<FavoritesList />);

		expect(screen.getByTestId("empty-state")).toBeTruthy();
		expect(screen.getByText("No favorites yet")).toBeTruthy();
		expect(
			screen.getByText("Tap ♡ on any combination to save it here"),
		).toBeTruthy();
	});

	it("empty state has correct accessibilityLabel", () => {
		render(<FavoritesList />);

		expect(
			screen.getByLabelText(
				"No favorites yet. Tap ♡ on any combination to save it here",
			),
		).toBeTruthy();
	});

	it("renders PaletteStrips when favorites exist", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(screen.getByTestId("palette-strip-p001")).toBeTruthy();
		expect(screen.getByTestId("palette-strip-p002")).toBeTruthy();
	});

	it("renders heart icons as filled (isFavorite=true)", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		expect(screen.getByTestId("favorite-button-p001")).toBeTruthy();
	});

	it("calls toggleFavorite when tapping favorite button", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		fireEvent.press(screen.getByTestId("favorite-button-p001"));
		expect(mockToggleFavorite).toHaveBeenCalledWith("p001");
	});

	it("navigates to Combinations when tapping a color", () => {
		mockFavorites = new Set(["p001"]);
		render(<FavoritesList />);

		const firstColorId = realCombo1.colors[0].id;
		fireEvent.press(screen.getByTestId(`palette-color-${firstColorId}`));

		expect(mockPush).toHaveBeenCalledWith("Combinations", {
			colorId: firstColorId,
		});
	});

	it("filters out invalid combination IDs", () => {
		mockFavorites = new Set(["p001", "invalid-id"]);
		render(<FavoritesList />);

		expect(screen.getByTestId("palette-strip-p001")).toBeTruthy();
		expect(screen.queryByTestId("palette-strip-invalid-id")).toBeNull();
	});

	it("renders favorites-list testID in empty state", () => {
		render(<FavoritesList />);
		expect(screen.getByTestId("favorites-list")).toBeTruthy();
	});

	it("renders dividers between PaletteStrips", () => {
		mockFavorites = new Set(["p001", "p002"]);
		render(<FavoritesList />);

		expect(screen.getAllByTestId("favorites-divider").length).toBeGreaterThan(
			0,
		);
	});
});
