import { render, screen } from "@testing-library/react-native";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
	it("renders title and subtitle text", () => {
		render(
			<EmptyState title="No favorites yet" subtitle="Tap on any combination" />,
		);

		expect(screen.getByText("No favorites yet")).toBeTruthy();
		expect(screen.getByText("Tap on any combination")).toBeTruthy();
	});

	it("has correct accessibilityLabel combining title and subtitle", () => {
		render(
			<EmptyState
				title="No favorites yet"
				subtitle="Tap on any combination to save it here"
			/>,
		);

		expect(
			screen.getByLabelText(
				"No favorites yet. Tap on any combination to save it here",
			),
		).toBeTruthy();
	});

	it("renders centered layout with testID and accessibilityRole", () => {
		render(<EmptyState title="Empty" subtitle="Nothing here" />);

		const container = screen.getByTestId("empty-state");
		expect(container).toBeTruthy();
		expect(container.props.accessibilityRole).toBe("summary");
	});
});
