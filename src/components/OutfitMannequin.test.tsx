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
			/>,
		);

		expect(toJSON()).toBeNull();
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
			/>,
		);

		expect(screen.getByLabelText("Outfit mannequin")).toBeTruthy();
	});
});
