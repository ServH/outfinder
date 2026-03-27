import { render, screen } from "@testing-library/react-native";
import { ColorSpecimenPreview } from "./ColorSpecimenPreview";
import { OutfitPreview } from "./OutfitPreview";
import { PalettePreview } from "./PalettePreview";
import { SwatchGridPreview } from "./SwatchGridPreview";

const hidden = { includeHiddenElements: true } as const;

describe("SwatchGridPreview", () => {
	it("renders 15 color swatches", () => {
		render(<SwatchGridPreview />);

		const container = screen.getByTestId("swatch-grid-preview", hidden);
		expect(container).toBeTruthy();

		for (let i = 1; i <= 15; i++) {
			const id = `c${String(i).padStart(3, "0")}`;
			expect(screen.getByTestId(`swatch-grid-item-${id}`, hidden)).toBeTruthy();
		}
	});

	it("is decorative (accessibilityElementsHidden)", () => {
		render(<SwatchGridPreview />);

		const container = screen.getByTestId("swatch-grid-preview", hidden);
		expect(container.props.accessibilityElementsHidden).toBe(true);
	});
});

describe("ColorSpecimenPreview", () => {
	it("renders swatch with Japanese and English name", () => {
		render(<ColorSpecimenPreview />);

		expect(screen.getByTestId("color-specimen-preview", hidden)).toBeTruthy();
		expect(screen.getByTestId("specimen-swatch", hidden)).toBeTruthy();
		expect(screen.getByText("朱色", hidden)).toBeTruthy();
		expect(screen.getByText("Vermillion", hidden)).toBeTruthy();
	});

	it("is decorative (accessibilityElementsHidden)", () => {
		render(<ColorSpecimenPreview />);

		const container = screen.getByTestId("color-specimen-preview", hidden);
		expect(container.props.accessibilityElementsHidden).toBe(true);
	});
});

describe("PalettePreview", () => {
	it("renders 3 color segments", () => {
		render(<PalettePreview />);

		expect(screen.getByTestId("palette-preview", hidden)).toBeTruthy();
		expect(screen.getByTestId("palette-segment-#E8D8C4", hidden)).toBeTruthy();
		expect(screen.getByTestId("palette-segment-#1C1C1C", hidden)).toBeTruthy();
		expect(screen.getByTestId("palette-segment-#E34234", hidden)).toBeTruthy();
	});

	it("renders color names", () => {
		render(<PalettePreview />);

		expect(screen.getByText("Unbleached Silk", hidden)).toBeTruthy();
		expect(screen.getByText("Ink Black", hidden)).toBeTruthy();
		expect(screen.getByText("Vermillion", hidden)).toBeTruthy();
	});

	it("is decorative (accessibilityElementsHidden)", () => {
		render(<PalettePreview />);

		const container = screen.getByTestId("palette-preview", hidden);
		expect(container.props.accessibilityElementsHidden).toBe(true);
	});
});

describe("OutfitPreview", () => {
	it("renders TintedGarment components for 3 garments", () => {
		render(<OutfitPreview />);

		expect(screen.getByTestId("outfit-preview", hidden)).toBeTruthy();
		expect(
			screen.getByTestId("outfit-garment-top-tshirt", hidden),
		).toBeTruthy();
		expect(
			screen.getByTestId("outfit-garment-bottom-pants", hidden),
		).toBeTruthy();
		expect(
			screen.getByTestId("outfit-garment-shoes-sneakers", hidden),
		).toBeTruthy();
	});

	it("renders Skia canvases for garments", () => {
		render(<OutfitPreview />);

		const canvases = screen.getAllByTestId("skia-canvas", hidden);
		expect(canvases.length).toBe(3);
	});

	it("is decorative (accessibilityElementsHidden)", () => {
		render(<OutfitPreview />);

		const container = screen.getByTestId("outfit-preview", hidden);
		expect(container.props.accessibilityElementsHidden).toBe(true);
	});

	it("shows colored fallback when garment images have not loaded", () => {
		const skia = require("@shopify/react-native-skia");
		const originalUseImage = skia.useImage;
		skia.useImage.mockReturnValue(null);

		render(<OutfitPreview />);

		const tshirt = screen.getByTestId("outfit-garment-top-tshirt", hidden);
		expect(tshirt.props.style).toMatchObject({
			backgroundColor: "#E34234",
		});

		const pants = screen.getByTestId("outfit-garment-bottom-pants", hidden);
		expect(pants.props.style).toMatchObject({
			backgroundColor: "#1C1C1C",
		});

		const shoes = screen.getByTestId("outfit-garment-shoes-sneakers", hidden);
		expect(shoes.props.style).toMatchObject({
			backgroundColor: "#E8D8C4",
		});

		skia.useImage = originalUseImage;
	});
});
