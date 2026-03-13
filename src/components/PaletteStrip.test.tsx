import { render, screen } from "@testing-library/react-native";
import type { Color, Combination } from "@/data/types";
import { PaletteStrip } from "./PaletteStrip";

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
});
