import { render, screen } from "@testing-library/react-native";
import type { Color } from "@/data/types";
import { ColorHeader } from "./ColorHeader";

const mockColor: Color = {
	id: "c001",
	hex: "#E8D3B4",
	nameJp: "鸞鳥色",
	nameEn: "Luan-bird",
	swatchGroup: 0,
	combinationCount: 8,
};

describe("ColorHeader", () => {
	it("renders the Japanese color name", () => {
		render(<ColorHeader color={mockColor} combinationCount={5} />);

		expect(screen.getByText("鸞鳥色")).toBeTruthy();
	});

	it("renders the English color name", () => {
		render(<ColorHeader color={mockColor} combinationCount={5} />);

		expect(screen.getByText("Luan-bird")).toBeTruthy();
	});

	it("renders the combination count", () => {
		render(<ColorHeader color={mockColor} combinationCount={5} />);

		expect(screen.getByText("5 combinations")).toBeTruthy();
	});

	it("displays the correct swatch background color", () => {
		render(<ColorHeader color={mockColor} combinationCount={5} />);

		const swatch = screen.getByTestId("color-header-swatch");
		expect(swatch.props.style).toEqual(
			expect.objectContaining({ backgroundColor: "#E8D3B4" }),
		);
	});

	it("has correct accessibility label with nameEn and count", () => {
		render(<ColorHeader color={mockColor} combinationCount={8} />);

		expect(screen.getByLabelText("Luan-bird, 8 combinations")).toBeTruthy();
	});

	it("uses singular 'combination' when count is 1", () => {
		render(<ColorHeader color={mockColor} combinationCount={1} />);

		expect(screen.getByText("1 combination")).toBeTruthy();
		expect(screen.getByLabelText("Luan-bird, 1 combination")).toBeTruthy();
	});

	it("has testID on the header container", () => {
		render(<ColorHeader color={mockColor} combinationCount={5} />);

		expect(screen.getByTestId("color-header")).toBeTruthy();
	});
});
