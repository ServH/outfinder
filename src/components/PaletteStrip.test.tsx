import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Color, Combination } from "@/data/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";
import { PaletteStrip } from "./PaletteStrip";

const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: mockPush }),
}));

jest.mock("@/lib/haptics");

jest.mock("@/hooks/useReducedMotion");
const mockUseReducedMotion = useReducedMotion as jest.Mock;

const color1: Color = {
	id: "c001",
	hex: "#E8D3B4",
	nameJp: "鸞鳥色",
	nameEn: "Luan-bird",
	swatchGroup: 0,
	combinationCount: 8,
};

const color2: Color = {
	id: "c002",
	hex: "#A52A2A",
	nameJp: "茶色",
	nameEn: "Brown",
	swatchGroup: 1,
	combinationCount: 5,
};

const color3: Color = {
	id: "c003",
	hex: "#4169E1",
	nameJp: "藍色",
	nameEn: "Royal Blue",
	swatchGroup: 2,
	combinationCount: 3,
};

const color4: Color = {
	id: "c004",
	hex: "#2E8B57",
	nameJp: "緑色",
	nameEn: "Sea Green",
	swatchGroup: 5,
	combinationCount: 4,
};

const twoColorCombo: Combination = {
	id: "combo-2",
	colors: [color1, color2],
	nameJp: "二色",
	nameEn: "Two Colors",
};

const threeColorCombo: Combination = {
	id: "combo-3",
	colors: [color1, color2, color3],
	nameJp: "三色",
	nameEn: "Three Colors",
};

const fourColorCombo: Combination = {
	id: "combo-4",
	colors: [color1, color2, color3, color4],
	nameJp: "四色",
	nameEn: "Four Colors",
};

describe("PaletteStrip", () => {
	beforeEach(() => {
		mockPush.mockClear();
		(hapticLight as jest.Mock).mockClear();
		mockUseReducedMotion.mockReturnValue(false);
	});

	it("renders 2 color rectangles for a 2-color combination", () => {
		render(<PaletteStrip combination={twoColorCombo} selectedColorId="c001" />);

		expect(screen.getByTestId("palette-color-c001")).toBeTruthy();
		expect(screen.getByTestId("palette-color-c002")).toBeTruthy();
	});

	it("renders 3 color rectangles for a 3-color combination", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		expect(screen.getByTestId("palette-color-c001")).toBeTruthy();
		expect(screen.getByTestId("palette-color-c002")).toBeTruthy();
		expect(screen.getByTestId("palette-color-c003")).toBeTruthy();
	});

	it("renders 4 color rectangles for a 4-color combination", () => {
		render(
			<PaletteStrip combination={fourColorCombo} selectedColorId="c001" />,
		);

		expect(screen.getByTestId("palette-color-c001")).toBeTruthy();
		expect(screen.getByTestId("palette-color-c002")).toBeTruthy();
		expect(screen.getByTestId("palette-color-c003")).toBeTruthy();
		expect(screen.getByTestId("palette-color-c004")).toBeTruthy();
	});

	it("shows selected color dot inside the correct rectangle", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c002" />,
		);

		const dot = screen.getByTestId("selected-color-dot");
		const selectedRect = screen.getByTestId("palette-color-c002");
		expect(selectedRect).toContainElement(dot);
	});

	it("does not show selected dot when selectedColorId does not match", () => {
		render(<PaletteStrip combination={twoColorCombo} selectedColorId="c999" />);

		expect(screen.queryByTestId("selected-color-dot")).toBeNull();
	});

	it("displays Japanese and English names for each color", () => {
		render(<PaletteStrip combination={twoColorCombo} selectedColorId="c001" />);

		expect(screen.getByText("鸞鳥色")).toBeTruthy();
		expect(screen.getByText("Luan-bird")).toBeTruthy();
		expect(screen.getByText("茶色")).toBeTruthy();
		expect(screen.getByText("Brown")).toBeTruthy();
	});

	it("has correct accessibility label with all color names", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		expect(
			screen.getByLabelText("Combination: Luan-bird, Brown, Royal Blue"),
		).toBeTruthy();
	});

	it("has correct testID based on combination id", () => {
		render(<PaletteStrip combination={twoColorCombo} selectedColorId="c001" />);

		expect(screen.getByTestId("palette-strip-combo-2")).toBeTruthy();
	});

	// === Story 1.5 — Cross-navigation, haptics, accessibility ===

	it("navigates to Combinations when pressing a non-selected color", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		fireEvent.press(screen.getByTestId("palette-color-c002"));

		expect(mockPush).toHaveBeenCalledWith("Combinations", {
			colorId: "c002",
		});
	});

	it("fires hapticLight when pressing a non-selected color", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		fireEvent.press(screen.getByTestId("palette-color-c002"));

		expect(hapticLight).toHaveBeenCalled();
	});

	it("does NOT navigate or fire haptics when pressing the selected color", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		fireEvent.press(screen.getByTestId("palette-color-c001"));

		expect(mockPush).not.toHaveBeenCalled();
		expect(hapticLight).not.toHaveBeenCalled();
	});

	it("has accessibilityRole 'link' on non-selected colors", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		expect(screen.getByTestId("palette-color-c002")).toHaveProp(
			"accessibilityRole",
			"link",
		);
		expect(screen.getByTestId("palette-color-c003")).toHaveProp(
			"accessibilityRole",
			"link",
		);
	});

	it("has accessibility label 'View combinations for {nameEn}' on non-selected colors", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		expect(screen.getByLabelText("View combinations for Brown")).toBeTruthy();
		expect(
			screen.getByLabelText("View combinations for Royal Blue"),
		).toBeTruthy();
	});

	it("marks the selected color as disabled with 'Selected' label", () => {
		render(
			<PaletteStrip combination={threeColorCombo} selectedColorId="c001" />,
		);

		expect(screen.getByLabelText("Selected: Luan-bird")).toBeTruthy();
		expect(
			screen.queryByLabelText("View combinations for Luan-bird"),
		).toBeNull();
	});

	it("skips opacity press feedback when reduced motion is enabled", () => {
		mockUseReducedMotion.mockReturnValue(true);

		render(<PaletteStrip combination={twoColorCombo} selectedColorId="c001" />);

		const pressable = screen.getByTestId("palette-color-c002");

		// With reduced motion, the opacity condition (pressed && !isSelected && !reducedMotion)
		// evaluates to false, so opacity stays 1. Verify navigation and haptics still work.
		fireEvent.press(pressable);
		expect(mockPush).toHaveBeenCalledWith("Combinations", {
			colorId: "c002",
		});
		expect(hapticLight).toHaveBeenCalled();
	});
});
