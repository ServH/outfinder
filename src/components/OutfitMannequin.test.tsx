import { render, screen } from "@testing-library/react-native";

import type { Color } from "@/data/types";

import { OutfitMannequin } from "./OutfitMannequin";

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

describe("OutfitMannequin", () => {
	describe("2-color combination", () => {
		it("renders top + bottom slots", () => {
			render(<OutfitMannequin colors={[red, blue]} />);

			expect(screen.getByLabelText("T-shirt, colored Red")).toBeTruthy();
			expect(screen.getByLabelText("Pants, colored Blue")).toBeTruthy();
		});

		it("assigns colors in top-to-bottom order", () => {
			const { toJSON } = render(<OutfitMannequin colors={[red, blue]} />);

			const mannequin = toJSON();
			const slots = mannequin.children;
			expect(slots).toHaveLength(2);

			// First slot: top-tshirt with red
			const topImage = slots[0].children[0];
			expect(topImage.props.style).toEqual(
				expect.objectContaining({ tintColor: "#ff0000" }),
			);

			// Second slot: bottom-pants with blue
			const bottomImage = slots[1].children[0];
			expect(bottomImage.props.style).toEqual(
				expect.objectContaining({ tintColor: "#0000ff" }),
			);
		});
	});

	describe("3-color combination", () => {
		it("renders top + bottom + shoes slots", () => {
			render(<OutfitMannequin colors={[red, blue, green]} />);

			expect(screen.getByLabelText("T-shirt, colored Red")).toBeTruthy();
			expect(screen.getByLabelText("Pants, colored Blue")).toBeTruthy();
			expect(screen.getByLabelText("Sneakers, colored Green")).toBeTruthy();
		});

		it("assigns colors in top-to-bottom order", () => {
			const { toJSON } = render(
				<OutfitMannequin colors={[red, blue, green]} />,
			);

			const mannequin = toJSON();
			const slots = mannequin.children;
			expect(slots).toHaveLength(3);

			const topImage = slots[0].children[0];
			expect(topImage.props.style).toEqual(
				expect.objectContaining({ tintColor: "#ff0000" }),
			);

			const shoesImage = slots[2].children[0];
			expect(shoesImage.props.style).toEqual(
				expect.objectContaining({ tintColor: "#00ff00" }),
			);
		});
	});

	describe("4-color combination", () => {
		it("renders layer + top + bottom + shoes slots", () => {
			render(<OutfitMannequin colors={[red, blue, green, yellow]} />);

			expect(screen.getByLabelText("Jacket, colored Red")).toBeTruthy();
			expect(screen.getByLabelText("T-shirt, colored Blue")).toBeTruthy();
			expect(screen.getByLabelText("Pants, colored Green")).toBeTruthy();
			expect(screen.getByLabelText("Sneakers, colored Yellow")).toBeTruthy();
		});

		it("assigns colors in top-to-bottom order", () => {
			const { toJSON } = render(
				<OutfitMannequin colors={[red, blue, green, yellow]} />,
			);

			const mannequin = toJSON();
			const slots = mannequin.children;
			expect(slots).toHaveLength(4);

			const jacketImage = slots[0].children[0];
			expect(jacketImage.props.style).toEqual(
				expect.objectContaining({ tintColor: "#ff0000" }),
			);

			const shoesImage = slots[3].children[0];
			expect(shoesImage.props.style).toEqual(
				expect.objectContaining({ tintColor: "#ffff00" }),
			);
		});
	});

	it("renders nothing for unsupported color count", () => {
		const single = makeColor({ hex: "#ff0000", nameEn: "Red" });
		const { toJSON } = render(<OutfitMannequin colors={[single]} />);

		expect(toJSON()).toBeNull();
	});

	it("has outfit mannequin accessibility label", () => {
		render(<OutfitMannequin colors={[red, blue]} />);

		expect(screen.getByLabelText("Outfit mannequin")).toBeTruthy();
	});
});
