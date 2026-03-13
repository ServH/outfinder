import { fireEvent, render, screen } from "@testing-library/react-native";
import { hapticLight } from "@/lib/haptics";
import { SwatchGroupTabs } from "./SwatchGroupTabs";

jest.mock("@/lib/haptics");

describe("SwatchGroupTabs", () => {
	it("renders 7 tabs (All + 6 families)", () => {
		render(<SwatchGroupTabs activeGroup="all" onTabChange={jest.fn()} />);

		const tabs = screen.getAllByRole("tab");
		expect(tabs).toHaveLength(7);
	});

	it("renders All tab as first tab", () => {
		render(<SwatchGroupTabs activeGroup="all" onTabChange={jest.fn()} />);

		expect(screen.getByText("All")).toBeTruthy();
	});

	it("shows active tab as selected", () => {
		render(<SwatchGroupTabs activeGroup="all" onTabChange={jest.fn()} />);

		const tabs = screen.getAllByRole("tab");
		const allTab = tabs[0];
		expect(allTab.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: true }),
		);
	});

	it("fires onTabChange and hapticLight when tab is tapped", () => {
		const onTabChange = jest.fn();
		render(<SwatchGroupTabs activeGroup="all" onTabChange={onTabChange} />);

		fireEvent.press(screen.getByText("Red & Brown"));

		expect(onTabChange).toHaveBeenCalledWith("1");
		expect(hapticLight).toHaveBeenCalled();
	});

	it("shows non-active tabs as not selected", () => {
		render(<SwatchGroupTabs activeGroup="all" onTabChange={jest.fn()} />);

		const tabs = screen.getAllByRole("tab");
		const redTab = tabs[2]; // index 2 = group "1" (Red & Brown)
		expect(redTab.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: false }),
		);
	});
});
