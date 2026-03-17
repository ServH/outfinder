import { render, screen } from "@testing-library/react-native";
import React from "react";
import type { View } from "react-native";

import type { SlotState } from "@/hooks/useOutfitState";
import { SharePreview } from "./SharePreview";

function makeSlot(
	garmentType: SlotState["garmentType"],
	hex: string,
	nameEn: string,
): SlotState {
	return {
		garmentType,
		color: {
			id: `c-${nameEn}`,
			hex,
			nameJp: "",
			nameEn,
			swatchGroup: 0,
			combinationCount: 1,
		},
	};
}

const twoSlots: SlotState[] = [
	makeSlot("top-tshirt", "#ff0000", "Red"),
	makeSlot("bottom-pants", "#0000ff", "Blue"),
];

const threeSlots: SlotState[] = [
	makeSlot("top-tshirt", "#ff0000", "Red"),
	makeSlot("bottom-pants", "#0000ff", "Blue"),
	makeSlot("shoes-sneakers", "#00ff00", "Green"),
];

const fourSlots: SlotState[] = [
	makeSlot("layer-jacket", "#ff0000", "Red"),
	makeSlot("top-tshirt", "#0000ff", "Blue"),
	makeSlot("bottom-pants", "#00ff00", "Green"),
	makeSlot("shoes-sneakers", "#ffff00", "Yellow"),
];

const baseCombination = {
	nameJp: "秋の装い",
	colors: [
		{ hex: "#ff0000", nameEn: "Red" },
		{ hex: "#0000ff", nameEn: "Blue" },
	],
};

describe("SharePreview", () => {
	it("renders Wada header with combination nameJp", () => {
		render(<SharePreview slots={twoSlots} combination={baseCombination} />);

		expect(screen.getByText("秋の装い")).toBeTruthy();
	});

	it("renders color count subtitle", () => {
		render(<SharePreview slots={twoSlots} combination={baseCombination} />);

		expect(screen.getByText("2 colors · Sanzo Wada")).toBeTruthy();
	});

	it("renders garment images for each slot", () => {
		render(<SharePreview slots={twoSlots} combination={baseCombination} />);

		const images = screen.getAllByTestId("share-garment-image");
		expect(images).toHaveLength(2);
	});

	it("renders color strip with color names", () => {
		render(<SharePreview slots={twoSlots} combination={baseCombination} />);

		expect(screen.getByText("Red")).toBeTruthy();
		expect(screen.getByText("Blue")).toBeTruthy();
	});

	it("renders Outfinder branding text", () => {
		render(<SharePreview slots={twoSlots} combination={baseCombination} />);

		expect(screen.getByText("Outfinder")).toBeTruthy();
	});

	it("forwards ref to container View", () => {
		const ref = React.createRef<View>();
		render(
			<SharePreview ref={ref} slots={twoSlots} combination={baseCombination} />,
		);

		expect(ref.current).toBeTruthy();
	});

	it("renders for 3-color combination", () => {
		const combo3 = {
			nameJp: "三色",
			colors: [
				{ hex: "#ff0000", nameEn: "Red" },
				{ hex: "#0000ff", nameEn: "Blue" },
				{ hex: "#00ff00", nameEn: "Green" },
			],
		};

		render(<SharePreview slots={threeSlots} combination={combo3} />);

		const images = screen.getAllByTestId("share-garment-image");
		expect(images).toHaveLength(3);
		expect(screen.getByText("3 colors · Sanzo Wada")).toBeTruthy();
	});

	it("renders for 4-color combination", () => {
		const combo4 = {
			nameJp: "四色",
			colors: [
				{ hex: "#ff0000", nameEn: "Red" },
				{ hex: "#0000ff", nameEn: "Blue" },
				{ hex: "#00ff00", nameEn: "Green" },
				{ hex: "#ffff00", nameEn: "Yellow" },
			],
		};

		render(<SharePreview slots={fourSlots} combination={combo4} />);

		const images = screen.getAllByTestId("share-garment-image");
		expect(images).toHaveLength(4);
		expect(screen.getByText("4 colors · Sanzo Wada")).toBeTruthy();
	});
});
