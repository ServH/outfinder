import { fireEvent, render, screen } from "@testing-library/react-native";
import { hapticLight } from "@/lib/haptics";
import { FabricSwatch } from "./FabricSwatch";

jest.mock("@/lib/haptics");

describe("FabricSwatch", () => {
	const mockOnPress = jest.fn();

	beforeEach(() => {
		mockOnPress.mockClear();
		(hapticLight as jest.Mock).mockClear();
	});

	it("renders the category label", () => {
		render(<FabricSwatch category="blue" onPress={mockOnPress} />);
		expect(screen.getByText("Blue")).toBeTruthy();
	});

	it("fires hapticLight and onPress when tapped", () => {
		render(<FabricSwatch category="brown" onPress={mockOnPress} />);

		fireEvent.press(screen.getByTestId("fabric-swatch-brown"));

		expect(hapticLight).toHaveBeenCalled();
		expect(mockOnPress).toHaveBeenCalledWith("brown");
	});

	it("has correct accessibility label and role", () => {
		render(<FabricSwatch category="green" onPress={mockOnPress} />);

		const swatch = screen.getByRole("button", {
			name: "Green, tap to see combinations",
		});
		expect(swatch).toBeTruthy();
	});

	it("renders gradient container", () => {
		render(<FabricSwatch category="red" onPress={mockOnPress} />);
		expect(screen.getByTestId("fabric-swatch-red")).toBeTruthy();
	});

	it("uses dark text on light categories", () => {
		render(<FabricSwatch category="white" onPress={mockOnPress} />);
		expect(screen.getByText("White").props.style.color).toBe("#1a1a1a");
	});

	it("uses dark text on grey, pink, yellow, orange", () => {
		const { unmount } = render(
			<FabricSwatch category="grey" onPress={mockOnPress} />,
		);
		expect(screen.getByText("Grey").props.style.color).toBe("#1a1a1a");
		unmount();

		render(<FabricSwatch category="pink" onPress={mockOnPress} />);
		expect(screen.getByText("Pink").props.style.color).toBe("#1a1a1a");
	});

	it("uses white text on dark categories", () => {
		render(<FabricSwatch category="black" onPress={mockOnPress} />);
		expect(screen.getByText("Black").props.style.color).toBe("#ffffff");
	});
});
