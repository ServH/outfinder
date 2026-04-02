import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Color } from "@/data/types";
import { ShadePicker } from "./ShadePicker";

const mockShades: Color[] = [
	{
		id: "c001",
		hex: "#F5E6D0",
		nameJp: "亜麻色",
		nameEn: "Flax",
		swatchGroup: 0,
		combinationCount: 10,
	},
	{
		id: "c002",
		hex: "#C4A882",
		nameJp: "小麦色",
		nameEn: "Wheat",
		swatchGroup: 1,
		combinationCount: 8,
	},
	{
		id: "c003",
		hex: "#A67C52",
		nameJp: "土色",
		nameEn: "Tan",
		swatchGroup: 1,
		combinationCount: 12,
	},
	{
		id: "c004",
		hex: "#8B5E3C",
		nameJp: "栗色",
		nameEn: "Chestnut",
		swatchGroup: 1,
		combinationCount: 6,
	},
	{
		id: "c005",
		hex: "#4A2C17",
		nameJp: "焦茶",
		nameEn: "Chocolate",
		swatchGroup: 3,
		combinationCount: 4,
	},
];

describe("ShadePicker", () => {
	const mockOnShadePress = jest.fn();

	beforeEach(() => {
		mockOnShadePress.mockClear();
	});

	it("renders 5 shade pills", () => {
		render(
			<ShadePicker
				shades={mockShades}
				selectedShadeId="c003"
				onShadePress={mockOnShadePress}
			/>,
		);

		expect(screen.getByTestId("shade-pill-c001")).toBeTruthy();
		expect(screen.getByTestId("shade-pill-c002")).toBeTruthy();
		expect(screen.getByTestId("shade-pill-c003")).toBeTruthy();
		expect(screen.getByTestId("shade-pill-c004")).toBeTruthy();
		expect(screen.getByTestId("shade-pill-c005")).toBeTruthy();
	});

	it("shows gold ring on selected shade", () => {
		render(
			<ShadePicker
				shades={mockShades}
				selectedShadeId="c003"
				onShadePress={mockOnShadePress}
			/>,
		);

		expect(screen.getByTestId("shade-pill-selected-ring")).toBeTruthy();
	});

	it("calls onShadePress when a shade pill is tapped", () => {
		render(
			<ShadePicker
				shades={mockShades}
				selectedShadeId="c003"
				onShadePress={mockOnShadePress}
			/>,
		);

		fireEvent.press(screen.getByTestId("shade-pill-c001"));

		expect(mockOnShadePress).toHaveBeenCalledWith(mockShades[0]);
	});

	it("has tablist role on container", () => {
		render(
			<ShadePicker
				shades={mockShades}
				selectedShadeId="c003"
				onShadePress={mockOnShadePress}
			/>,
		);

		const picker = screen.getByTestId("shade-picker");
		expect(picker.props.accessibilityRole).toBe("tablist");
	});

	it("has tab role on each shade pill", () => {
		render(
			<ShadePicker
				shades={mockShades}
				selectedShadeId="c003"
				onShadePress={mockOnShadePress}
			/>,
		);

		const tabs = screen.getAllByRole("tab");
		expect(tabs).toHaveLength(5);
	});

	it("announces selected state for the active shade", () => {
		render(
			<ShadePicker
				shades={mockShades}
				selectedShadeId="c003"
				onShadePress={mockOnShadePress}
			/>,
		);

		expect(screen.getByLabelText("Tan, selected")).toBeTruthy();
	});

	it("announces tap-to-filter for unselected shades", () => {
		render(
			<ShadePicker
				shades={mockShades}
				selectedShadeId="c003"
				onShadePress={mockOnShadePress}
			/>,
		);

		expect(screen.getByLabelText("Flax, tap to filter")).toBeTruthy();
		expect(screen.getByLabelText("Chocolate, tap to filter")).toBeTruthy();
	});
});
