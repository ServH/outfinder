import { useImage } from "@shopify/react-native-skia";
import { render, screen } from "@testing-library/react-native";

import { hexToTintMatrix, TintedGarment } from "./TintedGarment";

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

describe("hexToTintMatrix", () => {
	it("produces correct matrix for pure red (#ff0000)", () => {
		const matrix = hexToTintMatrix("#ff0000");
		expect(matrix).toEqual([
			1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
		]);
	});

	it("produces correct matrix for pure green (#00ff00)", () => {
		const matrix = hexToTintMatrix("#00ff00");
		expect(matrix).toEqual([
			0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
		]);
	});

	it("produces correct matrix for pure blue (#0000ff)", () => {
		const matrix = hexToTintMatrix("#0000ff");
		expect(matrix).toEqual([
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
		]);
	});

	it("produces correct matrix for white (#ffffff)", () => {
		const matrix = hexToTintMatrix("#ffffff");
		expect(matrix).toEqual([
			1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
		]);
	});

	it("always preserves alpha (row 4 = [0,0,0,1,0])", () => {
		const matrix = hexToTintMatrix("#965036");
		expect(matrix.slice(15)).toEqual([0, 0, 0, 1, 0]);
	});

	it("produces correct matrix for black (#000000)", () => {
		const matrix = hexToTintMatrix("#000000");
		expect(matrix).toEqual([
			0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
		]);
	});

	it("matrix always has exactly 20 elements", () => {
		const colors = ["#ff0000", "#00ff00", "#0000ff", "#804020", "#abcdef"];
		for (const hex of colors) {
			expect(hexToTintMatrix(hex)).toHaveLength(20);
		}
	});

	it("produces correct fractional values for mixed color (#804020)", () => {
		const matrix = hexToTintMatrix("#804020");
		const r = 0x80 / 255;
		const g = 0x40 / 255;
		const b = 0x20 / 255;
		expect(matrix[0]).toBeCloseTo(r, 5);
		expect(matrix[6]).toBeCloseTo(g, 5);
		expect(matrix[12]).toBeCloseTo(b, 5);
	});
});

describe("TintedGarment", () => {
	it("renders a Canvas for top-tshirt", () => {
		render(
			<TintedGarment
				garmentType="top-tshirt"
				colorHex="#ff0000"
				width={220}
				height={105}
			/>,
		);
		expect(screen.getByTestId("skia-canvas")).toBeTruthy();
	});

	it("renders a Canvas for each garment type", () => {
		const garments = [
			"top-tshirt",
			"top-shirt",
			"bottom-pants",
			"bottom-skirt",
			"layer-jacket",
			"layer-hoodie",
			"shoes-sneakers",
			"shoes-formal",
		] as const;

		for (const garmentType of garments) {
			const { unmount } = render(
				<TintedGarment
					garmentType={garmentType}
					colorHex="#0000ff"
					width={220}
					height={100}
				/>,
			);
			expect(screen.getByTestId("skia-canvas")).toBeTruthy();
			unmount();
		}
	});

	it("returns null when image is loading (useImage returns null)", () => {
		(useImage as jest.Mock).mockReturnValueOnce(null);

		const { queryByTestId } = render(
			<TintedGarment
				garmentType="top-tshirt"
				colorHex="#ff0000"
				width={220}
				height={105}
			/>,
		);
		expect(queryByTestId("skia-canvas")).toBeNull();
	});

	it("renders Canvas with specified dimensions", () => {
		render(
			<TintedGarment
				garmentType="shoes-formal"
				colorHex="#0000ff"
				width={180}
				height={65}
			/>,
		);
		const canvas = screen.getByTestId("skia-canvas");
		expect(canvas.props.style).toEqual(
			expect.objectContaining({ width: 180, height: 65 }),
		);
	});
});
