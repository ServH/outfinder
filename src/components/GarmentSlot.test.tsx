import { render, screen } from "@testing-library/react-native";

import { GarmentSlot } from "./GarmentSlot";

describe("GarmentSlot", () => {
	it("renders garment with correct accessibility label", () => {
		render(
			<GarmentSlot garmentType="top-tshirt" color="#ff0000" colorName="Red" />,
		);

		expect(screen.getByLabelText("T-shirt, colored Red")).toBeTruthy();
	});

	it("has accessibilityRole image", () => {
		render(
			<GarmentSlot
				garmentType="bottom-pants"
				color="#0000ff"
				colorName="Blue"
			/>,
		);

		const slot = screen.getByLabelText("Pants, colored Blue");
		expect(slot.props.accessibilityRole).toBe("image");
	});

	it("applies tintColor from color prop", () => {
		const { toJSON } = render(
			<GarmentSlot
				garmentType="shoes-sneakers"
				color="#00ff00"
				colorName="Green"
			/>,
		);

		const tree = toJSON();
		const image = tree.children[0];
		expect(image.props.style).toEqual(
			expect.objectContaining({ tintColor: "#00ff00" }),
		);
	});

	it("wraps garment image in View container", () => {
		const { toJSON } = render(
			<GarmentSlot
				garmentType="layer-jacket"
				color="#ff0000"
				colorName="Red"
			/>,
		);

		const tree = toJSON();
		expect(tree.type).toBe("View");
		expect(tree.children).toHaveLength(1);
		expect(tree.children[0].type).toBe("Image");
	});
});
