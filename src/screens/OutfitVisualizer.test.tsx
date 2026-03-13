import { render, screen } from "@testing-library/react-native";

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

function makeColor(id: string, hex: string, nameEn: string) {
	return { id, hex, nameJp: "", nameEn, swatchGroup: 0, combinationCount: 1 };
}

const red = makeColor("c1", "#ff0000", "Red");
const blue = makeColor("c2", "#0000ff", "Blue");
const green = makeColor("c3", "#00ff00", "Green");
const yellow = makeColor("c4", "#ffff00", "Yellow");

describe("OutfitVisualizer", () => {
	beforeEach(() => {
		mockGetCombination.mockReset();
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
		expect(screen.getByLabelText("T-shirt, colored Red")).toBeTruthy();
		expect(screen.getByLabelText("Pants, colored Blue")).toBeTruthy();
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

		expect(screen.getByLabelText("T-shirt, colored Red")).toBeTruthy();
		expect(screen.getByLabelText("Pants, colored Blue")).toBeTruthy();
		expect(screen.getByLabelText("Sneakers, colored Green")).toBeTruthy();
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

		expect(screen.getByLabelText("Jacket, colored Red")).toBeTruthy();
		expect(screen.getByLabelText("T-shirt, colored Blue")).toBeTruthy();
		expect(screen.getByLabelText("Pants, colored Green")).toBeTruthy();
		expect(screen.getByLabelText("Sneakers, colored Yellow")).toBeTruthy();
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
});
