import { act, renderHook } from "@testing-library/react-native";

import type { Color } from "@/data/types";

import { useOutfitState } from "./useOutfitState";

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

describe("useOutfitState", () => {
	describe("initialization", () => {
		it("initializes with 2 colors — top-tshirt + bottom-pants", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			expect(result.current.slots).toHaveLength(2);
			expect(result.current.slots[0].garmentType).toBe("top-tshirt");
			expect(result.current.slots[0].color).toBe(red);
			expect(result.current.slots[1].garmentType).toBe("bottom-pants");
			expect(result.current.slots[1].color).toBe(blue);
		});

		it("initializes with 3 colors — top + bottom + shoes", () => {
			const { result } = renderHook(() => useOutfitState([red, blue, green]));

			expect(result.current.slots).toHaveLength(3);
			expect(result.current.slots[0].garmentType).toBe("top-tshirt");
			expect(result.current.slots[1].garmentType).toBe("bottom-pants");
			expect(result.current.slots[2].garmentType).toBe("shoes-sneakers");
		});

		it("initializes with 4 colors — layer + top + bottom + shoes", () => {
			const { result } = renderHook(() =>
				useOutfitState([red, blue, green, yellow]),
			);

			expect(result.current.slots).toHaveLength(4);
			expect(result.current.slots[0].garmentType).toBe("layer-jacket");
			expect(result.current.slots[1].garmentType).toBe("top-tshirt");
			expect(result.current.slots[2].garmentType).toBe("bottom-pants");
			expect(result.current.slots[3].garmentType).toBe("shoes-sneakers");
		});

		it("returns empty slots for unsupported color count", () => {
			const single = makeColor({ id: "c1", hex: "#ff0000", nameEn: "Red" });
			const { result } = renderHook(() => useOutfitState([single]));

			expect(result.current.slots).toHaveLength(0);
		});

		it("has no slot selected initially", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			expect(result.current.selectedSlotIndex).toBeNull();
		});
	});

	describe("selectSlot — selection and deselection", () => {
		it("selects a slot when none is selected", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.selectSlot(0);
			});

			expect(result.current.selectedSlotIndex).toBe(0);
		});

		it("deselects when tapping the same slot", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.selectSlot(0);
			});
			act(() => {
				result.current.selectSlot(0);
			});

			expect(result.current.selectedSlotIndex).toBeNull();
		});
	});

	describe("selectSlot — swap logic", () => {
		it("swaps colors between two different slots", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.selectSlot(0);
			});
			act(() => {
				result.current.selectSlot(1);
			});

			expect(result.current.slots[0].color).toBe(blue);
			expect(result.current.slots[1].color).toBe(red);
			expect(result.current.selectedSlotIndex).toBeNull();
		});

		it("swaps colors in 4-color combination", () => {
			const { result } = renderHook(() =>
				useOutfitState([red, blue, green, yellow]),
			);

			act(() => {
				result.current.selectSlot(0);
			});
			act(() => {
				result.current.selectSlot(3);
			});

			expect(result.current.slots[0].color).toBe(yellow);
			expect(result.current.slots[3].color).toBe(red);
			// Middle slots unchanged
			expect(result.current.slots[1].color).toBe(blue);
			expect(result.current.slots[2].color).toBe(green);
		});
	});

	describe("toggleVariant", () => {
		it("toggles top-tshirt to top-shirt", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.toggleVariant(0);
			});

			expect(result.current.slots[0].garmentType).toBe("top-shirt");
		});

		it("toggles top-shirt back to top-tshirt", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.toggleVariant(0);
			});
			act(() => {
				result.current.toggleVariant(0);
			});

			expect(result.current.slots[0].garmentType).toBe("top-tshirt");
		});

		it("toggles bottom-pants to bottom-skirt", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.toggleVariant(1);
			});

			expect(result.current.slots[1].garmentType).toBe("bottom-skirt");
		});

		it("toggles layer-jacket to layer-hoodie (4-color)", () => {
			const { result } = renderHook(() =>
				useOutfitState([red, blue, green, yellow]),
			);

			act(() => {
				result.current.toggleVariant(0);
			});

			expect(result.current.slots[0].garmentType).toBe("layer-hoodie");
		});

		it("toggles shoes-sneakers to shoes-formal (3-color)", () => {
			const { result } = renderHook(() => useOutfitState([red, blue, green]));

			act(() => {
				result.current.toggleVariant(2);
			});

			expect(result.current.slots[2].garmentType).toBe("shoes-formal");
		});

		it("preserves color assignment during toggle", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.toggleVariant(0);
			});

			expect(result.current.slots[0].color).toBe(red);
		});
	});
});
