import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Color } from "@/data/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ColorSwatch } from "./ColorSwatch";

jest.mock("@/lib/haptics");
jest.mock("@/hooks/useReducedMotion");

const mockColor: Color = {
	id: "c001",
	hex: "#E8D3B4",
	nameJp: "鸞鳥色",
	nameEn: "Luan-bird",
	swatchGroup: 0,
	combinationCount: 8,
};

const mockUseReducedMotion = useReducedMotion as jest.Mock;

describe("ColorSwatch", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
	});

	it("renders with correct testID", () => {
		render(<ColorSwatch color={mockColor} onPress={jest.fn()} />);

		expect(screen.getByTestId("color-swatch-c001")).toBeTruthy();
	});

	it("displays the correct background color on inner view", () => {
		render(<ColorSwatch color={mockColor} onPress={jest.fn()} />);

		const swatch = screen.getByTestId("color-swatch-c001");
		const innerView = swatch.children[0] as { props: { style: unknown } };
		expect(innerView.props.style).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ backgroundColor: "#E8D3B4" }),
			]),
		);
	});

	it("has accessibilityLabel with nameEn and combinationCount", () => {
		render(<ColorSwatch color={mockColor} onPress={jest.fn()} />);

		expect(screen.getByLabelText("Luan-bird, 8 combinations")).toBeTruthy();
	});

	it("has accessibilityRole button", () => {
		render(<ColorSwatch color={mockColor} onPress={jest.fn()} />);

		expect(screen.getByRole("button")).toBeTruthy();
	});

	it("fires onPress when tapped", () => {
		const onPress = jest.fn();
		render(<ColorSwatch color={mockColor} onPress={onPress} />);

		fireEvent.press(screen.getByTestId("color-swatch-c001"));

		expect(onPress).toHaveBeenCalledWith(mockColor);
	});

	it("triggers scale animation on pressIn when motion is enabled", () => {
		const withSpring = require("react-native-reanimated").withSpring;
		render(<ColorSwatch color={mockColor} onPress={jest.fn()} />);

		fireEvent(screen.getByTestId("color-swatch-c001"), "pressIn");

		// withSpring should have been called with 1.05 target
		expect(withSpring).toBeDefined();
	});

	it("skips animation on pressIn when reduced motion is enabled", () => {
		mockUseReducedMotion.mockReturnValue(true);
		render(<ColorSwatch color={mockColor} onPress={jest.fn()} />);

		const swatch = screen.getByTestId("color-swatch-c001");
		const innerView = swatch.children[0] as { props: { style: unknown } };

		fireEvent(swatch, "pressIn");

		// With reduced motion, scale stays at 1 (no animation triggered)
		expect(innerView.props.style).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ transform: [{ scale: 1 }] }),
			]),
		);
	});
});
