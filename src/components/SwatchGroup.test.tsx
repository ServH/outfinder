import { render, screen } from "@testing-library/react-native";
import type { Color } from "@/data/types";
import { SwatchGroup } from "./SwatchGroup";

jest.mock("@/lib/haptics");

const mockColors: Color[] = [
	{
		id: "c001",
		hex: "#E8D3B4",
		nameJp: "鸞鳥色",
		nameEn: "Luan-bird",
		swatchGroup: 0,
		combinationCount: 8,
	},
	{
		id: "c002",
		hex: "#F5F0E1",
		nameJp: "卵殻",
		nameEn: "Eggshell",
		swatchGroup: 0,
		combinationCount: 5,
	},
	{
		id: "c003",
		hex: "#F3ECDA",
		nameJp: "象牙色",
		nameEn: "Ivory",
		swatchGroup: 0,
		combinationCount: 3,
	},
];

describe("SwatchGroup", () => {
	it("renders the correct number of swatches", () => {
		render(<SwatchGroup colors={mockColors} onColorPress={jest.fn()} />);

		const swatches = screen.getAllByRole("button");
		expect(swatches).toHaveLength(3);
	});

	it("renders swatches with correct testIDs", () => {
		render(<SwatchGroup colors={mockColors} onColorPress={jest.fn()} />);

		expect(screen.getByTestId("color-swatch-c001")).toBeTruthy();
		expect(screen.getByTestId("color-swatch-c002")).toBeTruthy();
		expect(screen.getByTestId("color-swatch-c003")).toBeTruthy();
	});

	it("renders the FlatList container", () => {
		render(<SwatchGroup colors={mockColors} onColorPress={jest.fn()} />);

		expect(screen.getByTestId("swatch-group-list")).toBeTruthy();
	});

	it("uses a 5-column layout", () => {
		const { UNSAFE_getByType } = render(
			<SwatchGroup colors={mockColors} onColorPress={jest.fn()} />,
		);
		// biome-ignore lint/suspicious/noExplicitAny: testing internal FlatList props
		const { FlatList } = require("react-native") as any;
		const flatList = UNSAFE_getByType(FlatList);
		expect(flatList.props.numColumns).toBe(5);
	});
});
