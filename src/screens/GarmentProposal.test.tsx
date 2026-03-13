import { fireEvent, render, screen } from "@testing-library/react-native";
import { GarmentProposal } from "./GarmentProposal";

describe("GarmentProposal", () => {
	it("renders title and all 8 garment labels", () => {
		render(<GarmentProposal />);
		expect(screen.getByText("Garment Silhouette Proposal")).toBeTruthy();
		expect(screen.getByText("T-Shirt")).toBeTruthy();
		expect(screen.getByText("Shirt")).toBeTruthy();
		expect(screen.getByText("Pants")).toBeTruthy();
		expect(screen.getByText("Skirt")).toBeTruthy();
		expect(screen.getByText("Jacket")).toBeTruthy();
		expect(screen.getByText("Hoodie")).toBeTruthy();
		expect(screen.getByText("Sneakers")).toBeTruthy();
		expect(screen.getByText("Formal Shoes")).toBeTruthy();
	});

	it("renders all 8 garment registry keys", () => {
		render(<GarmentProposal />);
		expect(screen.getByText("TopTShirt")).toBeTruthy();
		expect(screen.getByText("TopShirt")).toBeTruthy();
		expect(screen.getByText("BottomPants")).toBeTruthy();
		expect(screen.getByText("BottomSkirt")).toBeTruthy();
		expect(screen.getByText("LayerJacket")).toBeTruthy();
		expect(screen.getByText("LayerHoodie")).toBeTruthy();
		expect(screen.getByText("ShoesSneakers")).toBeTruthy();
		expect(screen.getByText("ShoesFormal")).toBeTruthy();
	});

	it("renders 6 color selectors", () => {
		render(<GarmentProposal />);
		expect(screen.getByLabelText("Select Eggshell")).toBeTruthy();
		expect(screen.getByLabelText("Select Burnt Sienna")).toBeTruthy();
		expect(screen.getByLabelText("Select Indigo")).toBeTruthy();
		expect(screen.getByLabelText("Select Sage Green")).toBeTruthy();
		expect(screen.getByLabelText("Select Camel")).toBeTruthy();
		expect(screen.getByLabelText("Select Lamp Black")).toBeTruthy();
	});

	it("changes displayed color info when a selector is pressed", () => {
		render(<GarmentProposal />);
		fireEvent.press(screen.getByLabelText("Select Burnt Sienna"));
		expect(screen.getByText(/Burnt Sienna/)).toBeTruthy();
		expect(screen.getByText(/#C75B3B/)).toBeTruthy();
	});

	it("includes evaluation checklist", () => {
		render(<GarmentProposal />);
		expect(screen.getByText("Evaluation Checklist")).toBeTruthy();
	});
});
