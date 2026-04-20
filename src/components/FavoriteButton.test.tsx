import { fireEvent, render, screen } from "@testing-library/react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useUnfavoriteCascade } from "@/lib/armario/confirmUnfavoriteWithCascade";
import { hapticLight } from "@/lib/haptics";
import { getAssignmentCount } from "@/lib/wardrobeRepo";
import { FavoriteButton } from "./FavoriteButton";

jest.mock("@/lib/haptics");

jest.mock("@/hooks/useReducedMotion");
const mockUseReducedMotion = useReducedMotion as jest.Mock;

jest.mock("@/lib/armario/confirmUnfavoriteWithCascade", () => ({
	useUnfavoriteCascade: jest.fn(),
}));
const mockShowConfirm = jest.fn();

jest.mock("@/lib/wardrobeRepo", () => ({
	getAssignmentCount: jest.fn(() => 0),
}));

jest.mock("expo-symbols", () => ({
	SymbolView: "SymbolView",
}));

jest.mock("react-native-reanimated");

describe("FavoriteButton", () => {
	const mockOnToggle = jest.fn();

	beforeEach(() => {
		mockOnToggle.mockClear();
		(hapticLight as jest.Mock).mockClear();
		mockUseReducedMotion.mockReturnValue(false);
		mockShowConfirm.mockReset();
		// Default behavior: cascade hook fires onConfirm immediately (matches
		// the real provider's count=0 / iOS<17 short-circuit). Tests that
		// exercise the gate override this.
		mockShowConfirm.mockImplementation((args: { onConfirm: () => void }) =>
			args.onConfirm(),
		);
		(useUnfavoriteCascade as jest.Mock).mockReturnValue(mockShowConfirm);
		(getAssignmentCount as jest.Mock).mockReturnValue(0);
	});

	it("renders outline heart when not favorite", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		const symbol = screen.getByTestId("favorite-icon-combo-1");
		expect(symbol.props.name).toBe("heart");
		expect(symbol.props.tintColor).toBe("#767676");
	});

	it("renders filled heart when favorite", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={true}
				onToggle={mockOnToggle}
			/>,
		);

		const symbol = screen.getByTestId("favorite-icon-combo-1");
		expect(symbol.props.name).toBe("heart.fill");
		expect(symbol.props.tintColor).toBe("#E74C3C");
	});

	it("calls onToggle when pressed", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));
		expect(mockOnToggle).toHaveBeenCalledTimes(1);
	});

	it("fires hapticLight on press", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));
		expect(hapticLight).toHaveBeenCalled();
	});

	it("has 'Save to favorites' accessibility label when not favorite", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		expect(screen.getByLabelText("Save to favorites")).toBeTruthy();
	});

	it("has 'Remove from favorites' accessibility label when favorite", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={true}
				onToggle={mockOnToggle}
			/>,
		);

		expect(screen.getByLabelText("Remove from favorites")).toBeTruthy();
	});

	it("has accessibilityRole button", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		const button = screen.getByTestId("favorite-button-combo-1");
		expect(button.props.accessibilityRole).toBe("button");
	});

	it("skips scale animation when Reduce Motion is enabled", () => {
		mockUseReducedMotion.mockReturnValue(true);

		const reanimated = require("react-native-reanimated");
		const withSpringSpy = jest.spyOn(reanimated, "withSpring");

		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));

		expect(mockOnToggle).toHaveBeenCalledTimes(1);
		expect(hapticLight).toHaveBeenCalled();
		expect(withSpringSpy).not.toHaveBeenCalled();

		withSpringSpy.mockRestore();
	});

	it("has 44x44px minimum hit area", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		const button = screen.getByTestId("favorite-button-combo-1");
		// NativeWind compiles min-w-[44px] min-h-[44px] into style
		// We verify the className contains the sizing classes
		expect(button.props.className).toMatch(/min-w-\[44px\]/);
		expect(button.props.className).toMatch(/min-h-\[44px\]/);
	});

	it("calls onPremiumGate instead of onToggle when gate exists", () => {
		const mockOnPremiumGate = jest.fn();
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
				onPremiumGate={mockOnPremiumGate}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));
		expect(mockOnPremiumGate).toHaveBeenCalledTimes(1);
		expect(mockOnToggle).not.toHaveBeenCalled();
	});

	it("calls onToggle normally when no premium gate", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));
		expect(mockOnToggle).toHaveBeenCalledTimes(1);
	});

	it("fires hapticLight even when premium gate intercepts", () => {
		const mockOnPremiumGate = jest.fn();
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
				onPremiumGate={mockOnPremiumGate}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));
		expect(hapticLight).toHaveBeenCalled();
	});

	// --- Story 13.4b: unfavorite cascade gate ---

	it("favorite tap (isFavorite=false → true) does NOT consult cascade gate", () => {
		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={false}
				onToggle={mockOnToggle}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));

		expect(mockShowConfirm).not.toHaveBeenCalled();
		expect(getAssignmentCount).not.toHaveBeenCalled();
		expect(mockOnToggle).toHaveBeenCalledTimes(1);
	});

	it("unfavorite tap consults cascade gate with current assignment count", () => {
		(getAssignmentCount as jest.Mock).mockReturnValue(2);
		// Override to a real "gate" that captures args without invoking onConfirm.
		mockShowConfirm.mockImplementation(() => {});

		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={true}
				onToggle={mockOnToggle}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));

		expect(mockShowConfirm).toHaveBeenCalledWith(
			expect.objectContaining({
				combinationId: "combo-1",
				count: 2,
				onConfirm: expect.any(Function),
			}),
		);
		// onToggle NOT called yet — the provider decides when to fire onConfirm.
		expect(mockOnToggle).not.toHaveBeenCalled();
	});

	it("unfavorite tap with count=0 → showConfirm invokes onConfirm immediately → onToggle fires", () => {
		(getAssignmentCount as jest.Mock).mockReturnValue(0);

		render(
			<FavoriteButton
				combinationId="combo-1"
				isFavorite={true}
				onToggle={mockOnToggle}
			/>,
		);

		fireEvent.press(screen.getByTestId("favorite-button-combo-1"));

		expect(mockShowConfirm).toHaveBeenCalledTimes(1);
		expect(mockOnToggle).toHaveBeenCalledTimes(1);
	});
});
