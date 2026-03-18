import { act, renderHook } from "@testing-library/react-native";

import type { Color } from "@/data/types";

import { getCycleForGarment, useOutfitState } from "./useOutfitState";

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

	describe("cycleVariant", () => {
		it("cycles top-tshirt forward to top-shirt in 2-color", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.cycleVariant(0, 1);
			});

			expect(result.current.slots[0].garmentType).toBe("top-shirt");
		});

		it("cycles top-shirt forward to layer-jacket in 2-color (extended)", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.cycleVariant(0, 1); // tshirt → shirt
			});
			act(() => {
				result.current.cycleVariant(0, 1); // shirt → jacket
			});

			expect(result.current.slots[0].garmentType).toBe("layer-jacket");
		});

		it("cycles full upper body in 3-color: tshirt → shirt → jacket → hoodie → tshirt", () => {
			const { result } = renderHook(() => useOutfitState([red, blue, green]));

			act(() => result.current.cycleVariant(0, 1)); // tshirt → shirt
			expect(result.current.slots[0].garmentType).toBe("top-shirt");

			act(() => result.current.cycleVariant(0, 1)); // shirt → jacket
			expect(result.current.slots[0].garmentType).toBe("layer-jacket");

			act(() => result.current.cycleVariant(0, 1)); // jacket → hoodie
			expect(result.current.slots[0].garmentType).toBe("layer-hoodie");

			act(() => result.current.cycleVariant(0, 1)); // hoodie → tshirt (wrap)
			expect(result.current.slots[0].garmentType).toBe("top-tshirt");
		});

		it("cycles backward: tshirt → hoodie in 2-color", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.cycleVariant(0, -1);
			});

			expect(result.current.slots[0].garmentType).toBe("layer-hoodie");
		});

		it("cycles bottom-pants to bottom-skirt", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.cycleVariant(1, 1);
			});

			expect(result.current.slots[1].garmentType).toBe("bottom-skirt");
		});

		it("keeps layer and top separate in 4-color: layer cycles jacket ↔ hoodie", () => {
			const { result } = renderHook(() =>
				useOutfitState([red, blue, green, yellow]),
			);

			act(() => {
				result.current.cycleVariant(0, 1); // jacket → hoodie
			});
			expect(result.current.slots[0].garmentType).toBe("layer-hoodie");

			act(() => {
				result.current.cycleVariant(0, 1); // hoodie → jacket (wraps, only 2)
			});
			expect(result.current.slots[0].garmentType).toBe("layer-jacket");
		});

		it("keeps layer and top separate in 4-color: top cycles tshirt ↔ shirt", () => {
			const { result } = renderHook(() =>
				useOutfitState([red, blue, green, yellow]),
			);

			act(() => {
				result.current.cycleVariant(1, 1); // tshirt → shirt
			});
			expect(result.current.slots[1].garmentType).toBe("top-shirt");

			act(() => {
				result.current.cycleVariant(1, 1); // shirt → tshirt (wraps, only 2)
			});
			expect(result.current.slots[1].garmentType).toBe("top-tshirt");
		});

		it("cycles shoes-sneakers to shoes-formal in 3-color", () => {
			const { result } = renderHook(() => useOutfitState([red, blue, green]));

			act(() => {
				result.current.cycleVariant(2, 1);
			});

			expect(result.current.slots[2].garmentType).toBe("shoes-formal");
		});

		it("preserves color assignment during cycle", () => {
			const { result } = renderHook(() => useOutfitState([red, blue]));

			act(() => {
				result.current.cycleVariant(0, 1);
			});

			expect(result.current.slots[0].color).toBe(red);
		});
	});
});

describe("getCycleForGarment", () => {
	it("returns full upper cycle for tops in 2-color combo", () => {
		const cycle = getCycleForGarment("top-tshirt", 2);
		expect(cycle).toEqual([
			"top-tshirt",
			"top-shirt",
			"layer-jacket",
			"layer-hoodie",
		]);
	});

	it("returns full upper cycle for tops in 3-color combo", () => {
		const cycle = getCycleForGarment("top-shirt", 3);
		expect(cycle).toEqual([
			"top-tshirt",
			"top-shirt",
			"layer-jacket",
			"layer-hoodie",
		]);
	});

	it("returns top-only cycle in 4-color combo", () => {
		const cycle = getCycleForGarment("top-tshirt", 4);
		expect(cycle).toEqual(["top-tshirt", "top-shirt"]);
	});

	it("returns layer-only cycle in 4-color combo", () => {
		const cycle = getCycleForGarment("layer-jacket", 4);
		expect(cycle).toEqual(["layer-jacket", "layer-hoodie"]);
	});

	it("returns lower cycle regardless of slot count", () => {
		expect(getCycleForGarment("bottom-pants", 2)).toEqual([
			"bottom-pants",
			"bottom-skirt",
		]);
		expect(getCycleForGarment("bottom-pants", 4)).toEqual([
			"bottom-pants",
			"bottom-skirt",
		]);
	});

	it("returns foot cycle regardless of slot count", () => {
		expect(getCycleForGarment("shoes-sneakers", 3)).toEqual([
			"shoes-sneakers",
			"shoes-formal",
		]);
	});
});
