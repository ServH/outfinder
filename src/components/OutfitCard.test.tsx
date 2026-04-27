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
	const mockOnVariantCycle = jest.fn();

	beforeEach(() => {
		mockOnSlotTap.mockReset();
		mockOnVariantCycle.mockReset();
	});

	it("renders correct number of TintedGarments for 2 slots", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
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
				onVariantCycle={mockOnVariantCycle}
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
				onVariantCycle={mockOnVariantCycle}
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
				onVariantCycle={mockOnVariantCycle}
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
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		fireEvent.press(
			screen.getByLabelText("Pants, colored Blue, tap to select for swap"),
		);
		expect(mockOnSlotTap).toHaveBeenCalledWith(1);
	});

	it("onVariantCycle fires via accessibility increment action", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		fireEvent(tshirt, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockOnVariantCycle).toHaveBeenCalledWith(0, 1);
	});

	it("onVariantCycle fires via accessibility decrement action", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		fireEvent(tshirt, "accessibilityAction", {
			nativeEvent: { actionName: "decrement" },
		});
		expect(mockOnVariantCycle).toHaveBeenCalledWith(0, -1);
	});

	it("selected state renders correctly", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={0}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
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
				onVariantCycle={mockOnVariantCycle}
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
				onVariantCycle={mockOnVariantCycle}
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

	it("onVariantCycle fires correct index for second slot", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		const pants = screen.getByLabelText(
			"Pants, colored Blue, tap to select for swap",
		);
		fireEvent(pants, "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(mockOnVariantCycle).toHaveBeenCalledWith(1, 1);
	});

	it("sequential slot taps fire correct indices", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
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

	it("all slots have adjustable accessibility role", () => {
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
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		const adjustables = screen.getAllByRole("adjustable");
		expect(adjustables).toHaveLength(3);
	});

	it("slots have accessibility actions for variant cycling", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		const tshirt = screen.getByLabelText(
			"T-shirt, colored Red, tap to select for swap",
		);
		expect(tshirt.props.accessibilityActions).toEqual([
			{ name: "increment", label: "Next variant" },
			{ name: "decrement", label: "Previous variant" },
		]);
	});

	it("selected slot renders underline bar", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={0}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		const underlines = screen.getAllByTestId("underline-bar");
		expect(underlines.length).toBe(2);
	});

	it("non-selected slots have underline bar permanently visible (post-15.4)", () => {
		const slots = makeSlots(["top-tshirt", red], ["bottom-pants", blue]);
		render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		const underlines = screen.getAllByTestId("underline-bar");
		expect(underlines).toHaveLength(2);
	});

	it("underline pulse runs for ALL slots regardless of selection (Story 15.4 / DEC-4)", () => {
		const slots = makeSlots(
			["top-tshirt", red],
			["bottom-pants", blue],
			["shoes-formal", green],
		);

		const { rerender } = render(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={null}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		expect(screen.getAllByTestId("underline-bar")).toHaveLength(3);

		rerender(
			<OutfitCard
				slots={slots}
				selectedSlotIndex={0}
				onSlotTap={mockOnSlotTap}
				onVariantCycle={mockOnVariantCycle}
			/>,
		);

		expect(screen.getAllByTestId("underline-bar")).toHaveLength(3);
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
				onVariantCycle={mockOnVariantCycle}
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
