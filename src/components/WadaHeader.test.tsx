import { render, screen } from "@testing-library/react-native";

import { WadaHeader } from "./WadaHeader";

describe("WadaHeader", () => {
	it("renders nameJp text", () => {
		render(<WadaHeader nameJp="秋の暮" colorCount={3} />);

		expect(screen.getByText("秋の暮")).toBeTruthy();
	});

	it("renders nameEn when provided", () => {
		render(<WadaHeader nameJp="秋の暮" nameEn="Autumn Dusk" colorCount={3} />);

		expect(screen.getByText("Autumn Dusk")).toBeTruthy();
	});

	it("does not render nameEn when not provided", () => {
		render(<WadaHeader nameJp="秋の暮" colorCount={3} />);

		expect(screen.queryByText("Autumn Dusk")).toBeNull();
	});

	it("accessibility label includes both names when nameEn provided", () => {
		render(<WadaHeader nameJp="秋の暮" nameEn="Autumn Dusk" colorCount={3} />);

		expect(
			screen.getByLabelText("秋の暮, Autumn Dusk, 3 color Wada combination"),
		).toBeTruthy();
	});

	it("accessibility label uses nameJp only when nameEn not provided", () => {
		render(<WadaHeader nameJp="秋の暮" colorCount={3} />);

		expect(
			screen.getByLabelText("秋の暮, 3 color Wada combination"),
		).toBeTruthy();
	});
});
