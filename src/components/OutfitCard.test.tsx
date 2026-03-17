import { fireEvent, render, screen } from "@testing-library/react-native";

import type { SlotState } from "@/hooks/useOutfitState";
import { OutfitCard } from "./OutfitCard";

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

function makeColor(id: string, hex: string, nameEn: string) {
	return {
		id,
		hex,
		nameJp: "",
		nameEn,
		swatchGroup: 0 as const,
		combinationCount: 1,
	};
}

const red = makeColor("c1", "#ff0000", "Red");
const blue = makeColor("c2", "#0000ff", "Blue");
const green = makeColor("c3", "#00ff00", "Green");
const yellow = makeColor("c4", "#ffff00", "Yellow");

function makeSlots(
	...args: Array<[string, ReturnType<typeof makeColor>]>
): SlotState[] {
	return args.map(([garmentType, color]) => ({
		garmentType: garmentType as SlotState["garmentType"],
		color,
	}));
}

describe("OutfitCard", () => {
	const mockOnSlotTap = jest.fn();
	const mockOnVariantToggle = jest.fn();

	beforeEach(() => {
		mockOnSlotTap.mockReset();
		mockOnVariantToggle.mockReset();
	});

	it("renders correct number of TintedGarments for 2 slots", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
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

	it("renders correct number of TintedGarments for 3 slots", () => {
		const slots = makeSlots(
			["top-tshirt", red],
			["bottom-pants", blue],
			["shoes-sneakers", green],
		);
		render(
			<OutfitCard
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
			screen.getByLabelText("Sneakers, colored Green, tap to select for swap"),
		).toBeTruthy();
	});

	it("renders correct number of TintedGarments for 4 slots", () => {
		const slots = makeSlots(
			["layer-jacket", red],
			["top-tshirt", blue],
			["bottom-pants", green],
			["shoes-sneakers", yellow],
		);
		render(
			<OutfitCard
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
			screen.getByLabelText("Sneakers, colored Yellow, tap to select for swap"),
		).toBeTruthy();
	});

	it("has Outfit card accessibility label", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		expect(screen.getByLabelText("Outfit card")).toBeTruthy();
	});

	it("onSlotTap fires with correct index", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		fireEvent.press(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		);
		expect(mockOnSlotTap).toHaveBeenCalledWith(1);
	});

	it("onVariantToggle fires with correct index", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		const toggleButtons = screen.getAllByLabelText(/Change .* variant/);
		fireEvent.press(toggleButtons[0]);
		expect(mockOnVariantToggle).toHaveBeenCalledWith(0);
	});

	it("selected state renders correctly", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={0}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		expect(tshirt.props.accessibilityState).toEqual({ selected: true });

		const pants = screen.getByLabelText(
			"Pants, colored Blue, tap to select for swap",
		);
		expect(pants.props.accessibilityState).toEqual({ selected: false });
	});

	it("renders correct labels for variant garment types", () => {
		const slots = makeSlots(["top-shirt", red], ["bottom-skirt", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		expect(
			screen.getByLabelText("Shirt, colored Red, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Skirt, colored Blue, tap to select for swap"),
		).toBeTruthy();
	});

	it("selected state on second slot renders correctly", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={1}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		expect(tshirt.props.accessibilityState).toEqual({ selected: false });

		const pants = screen.getByLabelText(
			"Pants, colored Blue, tap to select for swap",
		);
		expect(pants.props.accessibilityState).toEqual({ selected: true });
	});

	it("onVariantToggle fires correct index for second slot", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		const toggleButtons = screen.getAllByLabelText(/Change .* variant/);
		fireEvent.press(toggleButtons[1]);
		expect(mockOnVariantToggle).toHaveBeenCalledWith(1);
	});

	it("sequential slot taps fire correct indices", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		fireEvent.press(
			screen.getByLabelText("T-shirt, colored Red, tap to select for swap"),
		);
		fireEvent.press(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		);

		expect(mockOnSlotTap).toHaveBeenNthCalledWith(1, 0);
		expect(mockOnSlotTap).toHaveBeenNthCalledWith(2, 1);
	});

	it("all slots have button accessibility role", () => {
		const slots = makeSlots(
			["top-tshirt", red],
			["bottom-pants", blue],
			["shoes-sneakers", green],
		);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		const buttons = screen.getAllByRole("button");
		// 3 slot pressables + 3 variant toggle pressables = 6
		expect(buttons.length).toBeGreaterThanOrEqual(6);
	});

	it("variant toggle labels match garment types", () => {
		const slots = makeSlots(["layer-hoodie", red], ["bottom-skirt", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		expect(screen.getByLabelText("Change Hoodie variant")).toBeTruthy();
		expect(screen.getByLabelText("Change Skirt variant")).toBeTruthy();
	});

	it("renders correctly with layer-hoodie and shoes-formal", () => {
		const slots = makeSlots(
			["layer-hoodie", red],
			["top-tshirt", blue],
			["bottom-pants", green],
			["shoes-formal", yellow],
		);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantToggle={mockOnVariantToggle}
			/>,
		);

		expect(
			screen.getByLabelText("Hoodie, colored Red, tap to select for swap"),
		).toBeTruthy();
		expect(
			screen.getByLabelText(
				"Formal shoes, colored Yellow, tap to select for swap",
			),
		).toBeTruthy();
	});
});
