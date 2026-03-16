import { render, screen } from "@testing-library/react-native";

import {
	GARMENT_REGISTRY,
	type GarmentType,
} from "@/components/garments/index";

const ALL_GARMENT_TYPES: GarmentType[] = [
	"top-tshirt",
	"top-shirt",
	"bottom-pants",
	"bottom-skirt",
	"layer-jacket",
	"layer-hoodie",
	"shoes-sneakers",
	"shoes-formal",
];

describe("Garment Components", () => {
	it("registry contains all 8 garment types", () => {
		expect(Object.keys(GARMENT_REGISTRY)).toHaveLength(8);
		for (const type of ALL_GARMENT_TYPES) {
			expect(GARMENT_REGISTRY[type]).toBeDefined();
		}
	});

	for (const garmentType of ALL_GARMENT_TYPES) {
		describe(garmentType, () => {
			it("renders with tintColor applied", () => {
				const config = GARMENT_REGISTRY[garmentType];
				const Component = config.component;
				const testColor = "#ff0000";
				const label = `${config.label}, colored Red`;

				render(<Component color={testColor} accessibilityLabel={label} />);

				const image = screen.getByLabelText(label);
				expect(image).toBeTruthy();
				expect(image.props.style).toEqual(
					expect.objectContaining({ tintColor: testColor }),
				);
			});

			it("has accessibility label", () => {
				const config = GARMENT_REGISTRY[garmentType];
				const Component = config.component;
				const label = `${config.label}, colored Blue`;

				render(<Component color="#0000ff" accessibilityLabel={label} />);

				expect(screen.getByLabelText(label)).toBeTruthy();
			});

			it("registry has a human-readable label", () => {
				const config = GARMENT_REGISTRY[garmentType];
				expect(config.label).toBeTruthy();
				expect(typeof config.label).toBe("string");
			});
		});
	}
});
