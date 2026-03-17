import { render, screen } from "@testing-library/react-native";

import type { Color } from "@/data/types";
import type { SlotState } from "@/hooks/useOutfitState";

import { PaletteBar } from "./PaletteBar";

function makeColor(
	overrides: Partial<Color> & { hex: string; nameEn: string; nameJp: string },
): Color {
	return {
		id: "c1",
		swatchGroup: 0,
		combinationCount: 1,
		...overrides,
	};
}

const red = makeColor({
	id: "c1",
	hex: "#ff0000",
	nameEn: "Red",
	nameJp: "赤",
});
const blue = makeColor({
	id: "c2",
	hex: "#0000ff",
	nameEn: "Blue",
	nameJp: "青",
});
const green = makeColor({
	id: "c3",
	hex: "#00ff00",
	nameEn: "Green",
	nameJp: "緑",
});
const yellow = makeColor({
	id: "c4",
	hex: "#ffff00",
	nameEn: "Yellow",
	nameJp: "黄",
});

function makeSlots(
	configs: { garmentType: string; color: Color }[],
): SlotState[] {
	return configs.map((c) => ({
		garmentType: c.garmentType as SlotState["garmentType"],
		color: c.color,
	}));
}

describe("PaletteBar", () => {
	it("renders correct number of swatches for 2 colors", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
		]);

		render(<PaletteBar slots={slots} />);

		expect(screen.getByText("Red")).toBeTruthy();
		expect(screen.getByText("Blue")).toBeTruthy();
	});

	it("renders correct number of swatches for 3 colors", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
			{ garmentType: "shoes-sneakers", color: green },
		]);

		render(<PaletteBar slots={slots} />);

		expect(screen.getByText("Red")).toBeTruthy();
		expect(screen.getByText("Blue")).toBeTruthy();
		expect(screen.getByText("Green")).toBeTruthy();
	});

	it("renders correct number of swatches for 4 colors", () => {
		const slots = makeSlots([
			{ garmentType: "layer-jacket", color: red },
			{ garmentType: "top-tshirt", color: blue },
			{ garmentType: "bottom-pants", color: green },
			{ garmentType: "shoes-sneakers", color: yellow },
		]);

		render(<PaletteBar slots={slots} />);

		expect(screen.getByText("Red")).toBeTruthy();
		expect(screen.getByText("Blue")).toBeTruthy();
		expect(screen.getByText("Green")).toBeTruthy();
		expect(screen.getByText("Yellow")).toBeTruthy();
	});

	it("displays garment labels on each swatch", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
		]);

		render(<PaletteBar slots={slots} />);

		expect(screen.getByLabelText("Red, assigned to T-shirt")).toBeTruthy();
		expect(screen.getByLabelText("Blue, assigned to Pants")).toBeTruthy();
	});

	it("has accessibility label listing all assignments", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
		]);

		render(<PaletteBar slots={slots} />);

		expect(
			screen.getByLabelText("Color palette: Red on T-shirt, Blue on Pants"),
		).toBeTruthy();
	});
});
