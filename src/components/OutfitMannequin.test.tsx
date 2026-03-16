import { render, screen } from "@testing-library/react-native";

import type { Color } from "@/data/types";
import type { SlotState } from "@/hooks/useOutfitState";

import { OutfitMannequin } from "./OutfitMannequin";

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

function makeColor(
	overrides: Partial<Color> & { hex: string; nameEn: string },
): Color {
	return {
		id: "c1",
		nameJp: "",
		swatchGroup: 0,
		combinationCount: 1,
		...overrides,
	};
}

const red = makeColor({ id: "c1", hex: "#ff0000", nameEn: "Red" });
const blue = makeColor({ id: "c2", hex: "#0000ff", nameEn: "Blue" });
const green = makeColor({ id: "c3", hex: "#00ff00", nameEn: "Green" });
const yellow = makeColor({ id: "c4", hex: "#ffff00", nameEn: "Yellow" });

const mockOnSlotTap = jest.fn();
const mockOnVariantToggle = jest.fn();

const defaultLayoutProps = {
	availableHeight: 500,
	containerWidth: 390,
};

function makeSlots(
	configs: { garmentType: string; color: Color }[],
): SlotState[] {
	return configs.map((c) => ({
		garmentType: c.garmentType as SlotState["garmentType"],
		color: c.color,
	}));
}

describe("OutfitMannequin", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("2-color combination", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
		]);

		it("renders top + bottom slots", () => {
			render(
				<OutfitMannequin
					slots={slots}
					selectedSlotIndex={null}
					onSlotTap={mockOnSlotTap}
					onVariantToggle={mockOnVariantToggle}
					{...defaultLayoutProps}
				/>,
			);

			expect(
				screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
			).toBeTruthy();
			expect(
				screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
			).toBeTruthy();
		});
	});

	describe("3-color combination", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
			{ garmentType: "shoes-sneakers", color: green },
		]);

		it("renders top + bottom + shoes slots", () => {
			render(
				<OutfitMannequin
					slots={slots}
					selectedSlotIndex={null}
					onSlotTap={mockOnSlotTap}
					onVariantToggle={mockOnVariantToggle}
					{...defaultLayoutProps}
				/>,
			);

			expect(
				screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
			).toBeTruthy();
			expect(
				screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
			).toBeTruthy();
			expect(
				screen.getByLabelText(
					"Sneakers, colored Green, tap to select for swap",
				),
			).toBeTruthy();
		});
	});

	describe("4-color combination", () => {
		const slots = makeSlots([
			{ garmentType: "layer-jacket", color: red },
			{ garmentType: "top-tshirt", color: blue },
			{ garmentType: "bottom-pants", color: green },
			{ garmentType: "shoes-sneakers", color: yellow },
		]);

		it("renders layer + top + bottom + shoes slots", () => {
			render(
				<OutfitMannequin
					slots={slots}
					selectedSlotIndex={null}
					onSlotTap={mockOnSlotTap}
					onVariantToggle={mockOnVariantToggle}
					{...defaultLayoutProps}
				/>,
			);

			expect(
				screen.getByLabelText("Jacket, colored Red, tap to select for swap"),
			).toBeTruthy();
			expect(
				screen.getByLabelText("T-shirt, colored Blue, tap to select for swap"),
			).toBeTruthy();
			expect(
				screen.getByLabelText("Pants, colored Green, tap to select for swap"),
			).toBeTruthy();
			expect(
				screen.getByLabelText(
					"Sneakers, colored Yellow, tap to select for swap",
				),
			).toBeTruthy();
		});
	});

	it("renders nothing for empty slots", () => {
		const { toJSON } = render(
			<OutfitMannequin
				slots={[]}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
				{...defaultLayoutProps}
			/>,
		);

		expect(toJSON()).toBeNull();
	});

	it("renders nothing when availableHeight is 0", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
		]);

		const { toJSON } = render(
			<OutfitMannequin
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
				availableHeight={0}
				containerWidth={390}
			/>,
		);

		expect(toJSON()).toBeNull();
	});

	describe("proportional dimensions", () => {
		it("passes correct slot widths for 2-slot config", () => {
			const slots = makeSlots([
				{ garmentType: "top-tshirt", color: red },
				{ garmentType: "bottom-pants", color: blue },
			]);

			render(
				<OutfitMannequin
					slots={slots}
					selectedSlotIndex={null}
					onSlotTap={mockOnSlotTap}
					onVariantToggle={mockOnVariantToggle}
					availableHeight={500}
					containerWidth={390}
				/>,
			);

			// mannequinWidth = 390 * 0.55 = 214.5
			// top slotWidth = 214.5 * 0.55 = 117.975
			// bottom slotWidth = 214.5 * 0.4 = 85.8
			const tshirt = screen.getByLabelText(
				"T-shirt, colored Red, tap to select for swap",
			);
			expect(tshirt.props.style.width).toBeCloseTo(117.975, 1);

			const pants = screen.getByLabelText(
				"Pants, colored Blue, tap to select for swap",
			);
			expect(pants.props.style.width).toBeCloseTo(85.8, 1);
		});

		it("passes correct proportional dimensions in rendered tree for 4-slot config", () => {
			const slots = makeSlots([
				{ garmentType: "layer-jacket", color: red },
				{ garmentType: "top-tshirt", color: blue },
				{ garmentType: "bottom-pants", color: green },
				{ garmentType: "shoes-sneakers", color: yellow },
			]);

			const { toJSON } = render(
				<OutfitMannequin
					slots={slots}
					selectedSlotIndex={null}
					onSlotTap={mockOnSlotTap}
					onVariantToggle={mockOnVariantToggle}
					availableHeight={500}
					containerWidth={390}
				/>,
			);

			// 4-slot: 3 overlaps of 6px → usableHeight = 500 - 18 = 482
			// layer height: 25% of 482 = 120.5
			// shoes height: 15% of 482 = 72.3
			// mannequinWidth = 214.5, layer width = 214.5 * 0.65 = 139.425
			const tree = JSON.stringify(toJSON());
			expect(tree).toContain('"height":120.5');
			expect(tree).toContain('"height":72.3');
			expect(tree).toContain('"width":139.425');
		});
	});

	it("has outfit mannequin accessibility label", () => {
		const slots = makeSlots([
			{ garmentType: "top-tshirt", color: red },
			{ garmentType: "bottom-pants", color: blue },
		]);

		render(
			<OutfitMannequin
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
				{...defaultLayoutProps}
			/>,
		);

		expect(screen.getByLabelText("Outfit mannequin")).toBeTruthy();
	});
});
