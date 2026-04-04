import { fireEvent, render, screen } from "@testing-library/react-native";
import { getAllColors, getColorsByGroup } from "@/data/colorIndex";
import { hapticLight } from "@/lib/haptics";
import { BrowseAllColors } from "./BrowseAllColors";

jest.mock("@/lib/haptics");

const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: mockPush }),
}));

describe("BrowseAllColors", () => {
	beforeEach(() => {
		mockPush.mockClear();
		(hapticLight as jest.Mock).mockClear();
	});

	it("passes all 159 colors to the grid by default (All tab)", () => {
		render(<BrowseAllColors />);

		const flatList = screen.getByTestId("swatch-group-list");
		expect(flatList.props.data).toHaveLength(getAllColors().length);
	});

	it("renders 7 tabs", () => {
		render(<BrowseAllColors />);

		const tabs = screen.getAllByRole("tab");
		expect(tabs).toHaveLength(7);
	});

	it("filters colors when a group tab is tapped", () => {
		render(<BrowseAllColors />);

		fireEvent.press(screen.getByText("Red & Brown"));

		const swatches = screen.getAllByRole("button");
		const expectedCount = getColorsByGroup(1).length;
		// +1 for the custom back button
		expect(swatches).toHaveLength(expectedCount + 1);
	});

	it("navigates to Combinations with colorId on swatch press", () => {
		render(<BrowseAllColors />);

		const firstSwatch = screen.getByTestId("color-swatch-c001");
		fireEvent.press(firstSwatch);

		expect(hapticLight).toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("Combinations", { colorId: "c001" });
	});

	it("restores all colors when returning to All tab after filtering", () => {
		render(<BrowseAllColors />);

		fireEvent.press(screen.getByText("Red & Brown"));
		const filteredCount = screen.getAllByRole("button").length;
		expect(filteredCount).toBeLessThan(getAllColors().length);

		fireEvent.press(screen.getByText("All"));
		const flatList = screen.getByTestId("swatch-group-list");
		expect(flatList.props.data).toHaveLength(getAllColors().length);
	});

	it("has accessibility labels on all swatches", () => {
		render(<BrowseAllColors />);

		const firstColor = getAllColors()[0];
		expect(
			screen.getByLabelText(
				`${firstColor.nameEn}, ${firstColor.combinationCount} combinations`,
			),
		).toBeTruthy();
	});
});

describe("BrowseAllColors iPad layout", () => {
	beforeEach(() => {
		jest.spyOn(require("@/lib/device"), "useIsIPad").mockReturnValue(true);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("uses 7 columns on iPad", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing internal FlatList props
		const { FlatList } = require("react-native") as any;
		const { UNSAFE_getByType } = render(<BrowseAllColors />);
		const flatList = UNSAFE_getByType(FlatList);
		expect(flatList.props.numColumns).toBe(7);
	});
});
