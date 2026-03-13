import { fireEvent, render, screen } from "@testing-library/react-native";
import { GarmentPoC } from "./GarmentPoC";

describe("GarmentPoC", () => {
	it("renders the PoC title and decision", () => {
		render(<GarmentPoC />);
		expect(
			screen.getByText("Rendering PoC: PNG + tintColor (Approved)"),
		).toBeTruthy();
		expect(screen.getByText("Decision: PNG + tintColor")).toBeTruthy();
	});

	it("renders all 4 test color selectors", () => {
		render(<GarmentPoC />);
		expect(screen.getByLabelText("Select Eggshell (pale)")).toBeTruthy();
		expect(screen.getByLabelText("Select Lamp Black (dark)")).toBeTruthy();
		expect(screen.getByLabelText("Select Vermilion (vivid)")).toBeTruthy();
		expect(screen.getByLabelText("Select Steel Blue (muted)")).toBeTruthy();
	});

	it("changes current color when a selector is pressed", () => {
		render(<GarmentPoC />);
		fireEvent.press(screen.getByLabelText("Select Vermilion (vivid)"));
		expect(screen.getByText("Current Color: Vermilion (vivid)")).toBeTruthy();
	});

	it("starts with first color (Eggshell) selected", () => {
		render(<GarmentPoC />);
		expect(screen.getByText("Current Color: Eggshell (pale)")).toBeTruthy();
	});
});
