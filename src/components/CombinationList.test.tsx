import { render, screen } from "@testing-library/react-native";
import type { Color, Combination } from "@/data/types";
import { CombinationList } from "./CombinationList";

jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

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

const combo1: Combination = {
	id: "combo-1",
	colors: [color1, color2],
	nameJp: "一",
	nameEn: "One",
};

const combo2: Combination = {
	id: "combo-2",
	colors: [color1, color2, color3],
	nameJp: "二",
	nameEn: "Two",
};

describe("CombinationList", () => {
	it("renders PaletteStrips for each combination", () => {
		render(
			<CombinationList
				combinations={[combo1, combo2]}
				selectedColorId="c001"
			/>,
		);

		const flatList = screen.getByTestId("combination-list");
		expect(flatList.props.data).toHaveLength(2);
	});

	it("renders with a single combination (edge case)", () => {
		render(<CombinationList combinations={[combo1]} selectedColorId="c001" />);

		const flatList = screen.getByTestId("combination-list");
		expect(flatList.props.data).toHaveLength(1);
	});

	it("passes selectedColorId to PaletteStrip components", () => {
		render(
			<CombinationList
				combinations={[combo1, combo2]}
				selectedColorId="c001"
			/>,
		);

		const flatList = screen.getByTestId("combination-list");
		const rendered = flatList.props.renderItem({ item: combo1, index: 0 });
		expect(rendered.props.selectedColorId).toBe("c001");
	});

	it("renders empty list without errors", () => {
		render(<CombinationList combinations={[]} selectedColorId="c001" />);

		const flatList = screen.getByTestId("combination-list");
		expect(flatList.props.data).toHaveLength(0);
	});

	it("has testID on the FlatList", () => {
		render(<CombinationList combinations={[combo1]} selectedColorId="c001" />);

		expect(screen.getByTestId("combination-list")).toBeTruthy();
	});
});
