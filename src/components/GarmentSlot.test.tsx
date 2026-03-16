import { fireEvent, render, screen } from "@testing-library/react-native";

import { GarmentSlot } from "./GarmentSlot";

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

describe("GarmentSlot", () => {
	const defaultProps = {
		garmentType: "top-tshirt" as const,
		color: "#ff0000",
		colorName: "Red",
		isSelected: false,
		onTap: jest.fn(),
		onVariantToggle: jest.fn(),
		slotWidth: 120,
		slotHeight: 100,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders garment with correct accessibility label", () => {
		render(<GarmentSlot {...defaultProps} />);

		expect(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		).toBeTruthy();
	});

	it("has accessibilityRole button", () => {
		render(<GarmentSlot {...defaultProps} />);

		const slot = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		expect(slot.props.accessibilityRole).toBe("button");
	});

	it("has accessibilityState selected when isSelected is true", () => {
		render(<GarmentSlot {...defaultProps} isSelected={true} />);

		const slot = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		expect(slot.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: true }),
		);
	});

	it("has accessibilityState selected false when not selected", () => {
		render(<GarmentSlot {...defaultProps} isSelected={false} />);

		const slot = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		expect(slot.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: false }),
		);
	});

	it("calls onTap when pressed", () => {
		const onTap = jest.fn();
		render(<GarmentSlot {...defaultProps} onTap={onTap} />);

		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);

		expect(onTap).toHaveBeenCalledTimes(1);
	});

	it("calls onVariantToggle when toggle button pressed", () => {
		const onVariantToggle = jest.fn();
		render(<GarmentSlot {...defaultProps} onVariantToggle={onVariantToggle} />);

		fireEvent.press(screen.getByLabelText("Toggle garment type"));

		expect(onVariantToggle).toHaveBeenCalledTimes(1);
	});

	it("variant toggle has accessibilityRole button", () => {
		render(<GarmentSlot {...defaultProps} />);

		const toggle = screen.getByLabelText("Toggle garment type");
		expect(toggle.props.accessibilityRole).toBe("button");
	});

	it("applies tintColor from color prop", () => {
		const { toJSON } = render(
			<GarmentSlot
				{...defaultProps}
				garmentType="shoes-sneakers"
				color="#00ff00"
				colorName="Green"
			/>,
		);

		const tree = JSON.stringify(toJSON());
		expect(tree).toContain("#00ff00");
	});
});
