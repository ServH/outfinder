import { render, screen } from "@testing-library/react-native";

import { Aureola } from "./Aureola";
import { MiniPaletteStrip } from "./MiniPaletteStrip";
import { WadaHeader } from "./WadaHeader";
import { WarmBackground } from "./WarmBackground";

describe("WadaHeader", () => {
	it("renders nameJp text", () => {
		render(<WadaHeader nameJp="秋の装い" colorCount={3} />);
		expect(screen.getByText("秋の装い")).toBeTruthy();
	});

	it("renders color count subtitle", () => {
		render(<WadaHeader nameJp="海の色合い" colorCount={4} />);
		expect(screen.getByText("4 colors · Sanzo Wada")).toBeTruthy();
	});

	it("has correct accessibility label", () => {
		render(<WadaHeader nameJp="冬の重ね着" colorCount={3} />);
		expect(
			screen.getByLabelText("冬の重ね着, 3 color Wada combination"),
		).toBeTruthy();
	});

	it("renders correct subtitle for 2 colors", () => {
		render(<WadaHeader nameJp="テスト" colorCount={2} />);
		expect(screen.getByText("2 colors · Sanzo Wada")).toBeTruthy();
	});

	it("accessibility label includes color count for 4 colors", () => {
		render(<WadaHeader nameJp="四色の美" colorCount={4} />);
		expect(
			screen.getByLabelText("四色の美, 4 color Wada combination"),
		).toBeTruthy();
	});

	it("always renders Sanzo Wada attribution", () => {
		render(<WadaHeader nameJp="テスト" colorCount={3} />);
		expect(screen.getByText(/Sanzo Wada/)).toBeTruthy();
	});
});

describe("MiniPaletteStrip", () => {
	it("renders correct number of color segments", () => {
		const colors = [
			{ hex: "#ff0000", nameEn: "Red" },
			{ hex: "#0000ff", nameEn: "Blue" },
			{ hex: "#00ff00", nameEn: "Green" },
		];
		render(<MiniPaletteStrip colors={colors} />);

		expect(screen.getByText("Red")).toBeTruthy();
		expect(screen.getByText("Blue")).toBeTruthy();
		expect(screen.getByText("Green")).toBeTruthy();
	});

	it("has palette accessibility label", () => {
		const colors = [
			{ hex: "#ff0000", nameEn: "Red" },
			{ hex: "#0000ff", nameEn: "Blue" },
		];
		render(<MiniPaletteStrip colors={colors} />);
		expect(screen.getByLabelText("Outfit color palette")).toBeTruthy();
	});

	it("renders 4-color palette with all names", () => {
		const colors = [
			{ hex: "#ff0000", nameEn: "Crimson" },
			{ hex: "#0000ff", nameEn: "Indigo" },
			{ hex: "#00ff00", nameEn: "Emerald" },
			{ hex: "#ffff00", nameEn: "Gold" },
		];
		render(<MiniPaletteStrip colors={colors} />);

		expect(screen.getByText("Crimson")).toBeTruthy();
		expect(screen.getByText("Indigo")).toBeTruthy();
		expect(screen.getByText("Emerald")).toBeTruthy();
		expect(screen.getByText("Gold")).toBeTruthy();
	});

	it("individual color segments have accessibility labels", () => {
		const colors = [
			{ hex: "#ff0000", nameEn: "Red" },
			{ hex: "#0000ff", nameEn: "Blue" },
		];
		render(<MiniPaletteStrip colors={colors} />);

		expect(screen.getByLabelText("Red")).toBeTruthy();
		expect(screen.getByLabelText("Blue")).toBeTruthy();
	});

	it("renders 2-color palette correctly", () => {
		const colors = [
			{ hex: "#ff0000", nameEn: "Vermillion" },
			{ hex: "#0000ff", nameEn: "Ultramarine" },
		];
		render(<MiniPaletteStrip colors={colors} />);

		expect(screen.getByText("Vermillion")).toBeTruthy();
		expect(screen.getByText("Ultramarine")).toBeTruthy();
	});
});

describe("Aureola", () => {
	it("renders without crashing", () => {
		render(<Aureola hex="#ff0000" width={390} height={500} />);
		expect(screen.getByLabelText("Color aureola")).toBeTruthy();
	});

	it("renders with blue hex", () => {
		render(<Aureola hex="#0000ff" width={390} height={500} />);
		expect(screen.getByLabelText("Color aureola")).toBeTruthy();
	});

	it("renders with different dimensions", () => {
		render(<Aureola hex="#00ff00" width={200} height={300} />);
		const aureola = screen.getByLabelText("Color aureola");
		expect(aureola.props.style).toEqual(
			expect.objectContaining({ width: 200, height: 300 }),
		);
	});
});

describe("WarmBackground", () => {
	it("renders without crashing", () => {
		render(<WarmBackground />);
		expect(screen.getByLabelText("Warm background")).toBeTruthy();
	});

	it("is positioned absolutely", () => {
		render(<WarmBackground />);
		const bg = screen.getByLabelText("Warm background");
		expect(bg.props.style).toEqual(
			expect.objectContaining({ position: "absolute" }),
		);
	});
});
