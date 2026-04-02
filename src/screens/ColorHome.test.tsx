import { fireEvent, render, screen } from "@testing-library/react-native";
import { hapticLight } from "@/lib/haptics";
import { ColorHome } from "./ColorHome";

jest.mock("@/lib/haptics");

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: mockPush }),
}));

describe("ColorHome", () => {
	beforeEach(() => {
		mockPush.mockClear();
		(hapticLight as jest.Mock).mockClear();
	});

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
});
