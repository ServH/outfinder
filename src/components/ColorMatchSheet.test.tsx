import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Color } from "@/data/types";
import type { WadaMatch } from "@/lib/colorTypes";
import { hapticLight } from "@/lib/haptics";
import { ColorMatchSheet } from "./ColorMatchSheet";

// Mock expo-symbols
jest.mock("expo-symbols", () => ({
	SymbolView: ({ name }: { name: string }) => {
		const { View } = require("react-native");
		return <View testID={`symbol-${name}`} />;
	},
}));

// Mock safe area insets
jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

// Mock haptics
jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

const mockMatches: WadaMatch[] = [
	{
		color: {
			id: "color-1",
			nameEn: "Terre Verte",
			nameJp: "テール・ベルト",
			hex: "#4A7C59",
			swatchGroup: 5,
			combinationCount: 8,
		} as Color,
		deltaE: 1.8,
	},
	{
		color: {
			id: "color-2",
			nameEn: "Raw Umber",
			nameJp: "ローアンバー",
			hex: "#5C3A1E",
			swatchGroup: 1,
			combinationCount: 6,
		} as Color,
		deltaE: 5.5,
	},
	{
		color: {
			id: "color-3",
			nameEn: "Ivory White",
			nameJp: "象牙白",
			hex: "#FFFFF0",
			swatchGroup: 0,
			combinationCount: 10,
		} as Color,
		deltaE: 9.2,
	},
];

const defaultProps = {
	visible: true,
	matches: mockMatches,
	capturedHex: "#4A7C40",
	onSelect: jest.fn(),
	onDismiss: jest.fn(),
};

describe("ColorMatchSheet", () => {
	beforeEach(() => {
		defaultProps.onSelect.mockClear();
		defaultProps.onDismiss.mockClear();
		(hapticLight as jest.Mock).mockClear();
	});

	it("renders 3 rows when given 3 matches", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		expect(screen.getByTestId("match-row-color-1")).toBeTruthy();
		expect(screen.getByTestId("match-row-color-2")).toBeTruthy();
		expect(screen.getByTestId("match-row-color-3")).toBeTruthy();
	});

	it("renders color names for all matches", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		expect(screen.getByText("Terre Verte")).toBeTruthy();
		expect(screen.getByText("Raw Umber")).toBeTruthy();
		expect(screen.getByText("Ivory White")).toBeTruthy();
	});

	it("renders sheet title", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		expect(screen.getByText("Which is closest to your garment?")).toBeTruthy();
	});

	it("tapping row 0 fires hapticLight and calls onSelect with correct colorId (AC #2)", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		fireEvent.press(screen.getByTestId("match-row-color-1"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(defaultProps.onSelect).toHaveBeenCalledWith("color-1");
	});

	it("tapping row 1 calls onSelect with color-2", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		fireEvent.press(screen.getByTestId("match-row-color-2"));
		expect(defaultProps.onSelect).toHaveBeenCalledWith("color-2");
	});

	it("ΔE ≤ 3.0 → 'Excellent match' badge rendered (AC #3)", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		// deltaE 1.8 for color-1
		expect(screen.getByText("Excellent match")).toBeTruthy();
	});

	it("ΔE 5.0 (≤ 8.0) → 'Good match' badge rendered (AC #3)", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		// deltaE 5.5 for color-2
		expect(screen.getByText("Good match")).toBeTruthy();
	});

	it("ΔE 9.2 (> 8.0) → no badge rendered (AC #3)", () => {
		// Only the third match has deltaE > 8.0 — we isolate it
		const singleHighDeltaE = [mockMatches[2]];
		render(<ColorMatchSheet {...defaultProps} matches={singleHighDeltaE} />);
		expect(screen.queryByText("Excellent match")).toBeNull();
		expect(screen.queryByText("Good match")).toBeNull();
	});

	it("each row has accessibilityRole=button (AC #6)", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		const row1 = screen.getByTestId("match-row-color-1");
		expect(row1.props.accessibilityRole).toBe("button");
		const row2 = screen.getByTestId("match-row-color-2");
		expect(row2.props.accessibilityRole).toBe("button");
	});

	it("each row accessibilityLabel contains color name (AC #6)", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		const row1 = screen.getByTestId("match-row-color-1");
		expect(row1.props.accessibilityLabel).toContain("Terre Verte");
		const row2 = screen.getByTestId("match-row-color-2");
		expect(row2.props.accessibilityLabel).toContain("Raw Umber");
	});

	it("backdrop tap calls onDismiss (AC #5)", () => {
		render(<ColorMatchSheet {...defaultProps} />);
		fireEvent.press(
			screen.getByTestId("color-match-backdrop", {
				includeHiddenElements: true,
			}),
		);
		expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
	});

	it("does not render when visible=false", () => {
		render(<ColorMatchSheet {...defaultProps} visible={false} />);
		expect(screen.queryByTestId("color-match-sheet")).toBeNull();
	});
});
