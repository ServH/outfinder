import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Color, Combination } from "@/data/types";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { ComboCard } from "./ComboCard";

jest.mock("expo-symbols", () => ({
	SymbolView: "SymbolView",
}));

jest.mock("react-native-reanimated");

const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ push: mockPush }),
}));

jest.mock("@/lib/haptics");

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

// --- Test fixtures ---

const lightColor: Color = {
	id: "c-white",
	hex: "#FFFFFF",
	nameJp: "白",
	nameEn: "White",
	swatchGroup: 0,
	combinationCount: 5,
};

const darkColor: Color = {
	id: "c-black",
	hex: "#1A1A1A",
	nameJp: "黒",
	nameEn: "Black",
	swatchGroup: 3,
	combinationCount: 4,
};

const midColor: Color = {
	id: "c-blue",
	hex: "#4169E1",
	nameJp: "藍色",
	nameEn: "Royal Blue",
	swatchGroup: 2,
	combinationCount: 3,
};

const fourthColor: Color = {
	id: "c-green",
	hex: "#2E8B57",
	nameJp: "緑色",
	nameEn: "Sea Green",
	swatchGroup: 5,
	combinationCount: 2,
};

const twoColorCombo: Combination = {
	id: "combo-2c",
	colors: [lightColor, darkColor],
	nameJp: "二色組",
	nameEn: "Two Color Set",
};

const threeColorCombo: Combination = {
	id: "combo-3c",
	colors: [lightColor, darkColor, midColor],
	nameJp: "三色組",
	nameEn: "Three Color Set",
};

const fourColorCombo: Combination = {
	id: "combo-4c",
	colors: [lightColor, darkColor, midColor, fourthColor],
	nameJp: "四色組",
	nameEn: "Four Color Set",
};

// --- Shared default props ---

const defaultProps = {
	variant: "full" as const,
	combination: threeColorCombo,
	isFavorite: false,
	onToggleFavorite: jest.fn(),
};

describe("ComboCard", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// === Edge Cases ===

	describe("edge cases", () => {
		it("renders nothing when combination has empty colors", () => {
			const emptyCombo: Combination = {
				id: "combo-empty",
				colors: [],
				nameJp: "空",
				nameEn: "Empty",
			};
			render(<ComboCard {...defaultProps} combination={emptyCombo} />);

			expect(screen.queryByTestId("combo-card-combo-empty")).toBeNull();
		});
	});

	// === Full Variant Rendering (AC #1) ===

	describe("full variant rendering", () => {
		it("renders correct number of color segments for 2-color combo", () => {
			render(<ComboCard {...defaultProps} combination={twoColorCombo} />);

			expect(screen.getByTestId("combo-color-c-white")).toBeTruthy();
			expect(screen.getByTestId("combo-color-c-black")).toBeTruthy();
		});

		it("renders correct number of color segments for 3-color combo", () => {
			render(<ComboCard {...defaultProps} />);

			expect(screen.getByTestId("combo-color-c-white")).toBeTruthy();
			expect(screen.getByTestId("combo-color-c-black")).toBeTruthy();
			expect(screen.getByTestId("combo-color-c-blue")).toBeTruthy();
		});

		it("renders correct number of color segments for 4-color combo", () => {
			render(<ComboCard {...defaultProps} combination={fourColorCombo} />);

			expect(screen.getByTestId("combo-color-c-white")).toBeTruthy();
			expect(screen.getByTestId("combo-color-c-black")).toBeTruthy();
			expect(screen.getByTestId("combo-color-c-blue")).toBeTruthy();
			expect(screen.getByTestId("combo-color-c-green")).toBeTruthy();
		});

		it("renders color strip with 60px height", () => {
			render(<ComboCard {...defaultProps} />);

			const strip = screen.getByTestId("combo-card-strip");
			expect(strip.props.style).toEqual(
				expect.objectContaining({ height: 60 }),
			);
		});

		it("renders JP name with 14px font", () => {
			render(<ComboCard {...defaultProps} />);

			const jpName = screen.getByTestId("combo-card-name-jp");
			expect(jpName.props.children).toBe("三色組");
			expect(jpName.props.style).toEqual(
				expect.objectContaining({ fontSize: 14 }),
			);
		});

		it("renders EN name with 11px font", () => {
			render(<ComboCard {...defaultProps} />);

			const enName = screen.getByTestId("combo-card-name-en");
			expect(enName.props.children).toBe("Three Color Set");
			expect(enName.props.style).toEqual(
				expect.objectContaining({ fontSize: 11, color: "#6b6b6b" }),
			);
		});

		it("renders heart icon via FavoriteButton", () => {
			render(<ComboCard {...defaultProps} />);

			expect(screen.getByTestId("favorite-button-combo-3c")).toBeTruthy();
		});

		it("renders 'See outfit' pill text", () => {
			render(<ComboCard {...defaultProps} />);

			expect(
				screen.getByText("See outfit", { includeHiddenElements: true }),
			).toBeTruthy();
		});

		it("renders 'See outfit' pill container", () => {
			render(<ComboCard {...defaultProps} />);

			expect(
				screen.getByTestId("see-outfit-pill", {
					includeHiddenElements: true,
				}),
			).toBeTruthy();
		});

		it("applies correct background color to color segments", () => {
			render(<ComboCard {...defaultProps} />);

			const whiteSegment = screen.getByTestId("combo-color-c-white");
			expect(whiteSegment.props.style).toEqual(
				expect.objectContaining({ backgroundColor: "#FFFFFF" }),
			);

			const blackSegment = screen.getByTestId("combo-color-c-black");
			expect(blackSegment.props.style).toEqual(
				expect.objectContaining({ backgroundColor: "#1A1A1A" }),
			);
		});
	});

	// === "yours" Label (AC #2, #3) ===

	describe("yours label", () => {
		it("shows 'yours' label when showYoursLabel=true and yourColorId matches", () => {
			render(
				<ComboCard
					{...defaultProps}
					showYoursLabel={true}
					yourColorId="c-white"
				/>,
			);

			expect(screen.getByTestId("yours-label")).toBeTruthy();
			expect(screen.getByText("yours")).toBeTruthy();
		});

		it("does not show 'yours' label when showYoursLabel=false", () => {
			render(
				<ComboCard
					{...defaultProps}
					showYoursLabel={false}
					yourColorId="c-white"
				/>,
			);

			expect(screen.queryByTestId("yours-label")).toBeNull();
		});

		it("does not show 'yours' label when yourColorId does not match any color", () => {
			render(
				<ComboCard
					{...defaultProps}
					showYoursLabel={true}
					yourColorId="c-nonexistent"
				/>,
			);

			expect(screen.queryByTestId("yours-label")).toBeNull();
		});

		it("uses dark text on light color (adaptive contrast)", () => {
			render(
				<ComboCard
					{...defaultProps}
					showYoursLabel={true}
					yourColorId="c-white"
				/>,
			);

			const label = screen.getByTestId("yours-label");
			expect(label.props.style).toEqual(
				expect.objectContaining({ color: "#1a1a1a" }),
			);
		});

		it("uses light text on dark color (adaptive contrast)", () => {
			render(
				<ComboCard
					{...defaultProps}
					showYoursLabel={true}
					yourColorId="c-black"
				/>,
			);

			const label = screen.getByTestId("yours-label");
			expect(label.props.style).toEqual(
				expect.objectContaining({ color: "#ffffff" }),
			);
		});

		it("uses light text on mid-range color (adaptive contrast)", () => {
			render(
				<ComboCard
					{...defaultProps}
					showYoursLabel={true}
					yourColorId="c-blue"
				/>,
			);

			const label = screen.getByTestId("yours-label");
			expect(label.props.style).toEqual(
				expect.objectContaining({ color: "#ffffff" }),
			);
		});
	});

	// === Card Tap (AC #4) ===

	describe("card tap", () => {
		it("fires hapticMedium on card press", () => {
			render(<ComboCard {...defaultProps} />);

			fireEvent.press(screen.getByTestId("combo-card-combo-3c"));

			expect(hapticMedium).toHaveBeenCalledTimes(1);
		});

		it("navigates to OutfitVisualizer on card press", () => {
			render(<ComboCard {...defaultProps} />);

			fireEvent.press(screen.getByTestId("combo-card-combo-3c"));

			expect(mockPush).toHaveBeenCalledWith("OutfitVisualizer", {
				combinationId: "combo-3c",
			});
		});
	});

	// === Heart Tap (AC #5) ===

	describe("heart tap", () => {
		it("calls onToggleFavorite when heart is pressed", () => {
			const mockToggle = jest.fn();
			render(<ComboCard {...defaultProps} onToggleFavorite={mockToggle} />);

			fireEvent.press(screen.getByTestId("favorite-button-combo-3c"));

			expect(mockToggle).toHaveBeenCalledTimes(1);
		});

		it("fires hapticLight when heart is pressed", () => {
			render(<ComboCard {...defaultProps} />);

			fireEvent.press(screen.getByTestId("favorite-button-combo-3c"));

			expect(hapticLight).toHaveBeenCalled();
		});

		it("does NOT trigger card navigation when heart is pressed", () => {
			render(<ComboCard {...defaultProps} />);

			fireEvent.press(screen.getByTestId("favorite-button-combo-3c"));

			expect(mockPush).not.toHaveBeenCalled();
			expect(hapticMedium).not.toHaveBeenCalled();
		});

		it("shows filled heart when isFavorite is true", () => {
			render(<ComboCard {...defaultProps} isFavorite={true} />);

			const icon = screen.getByTestId("favorite-icon-combo-3c");
			expect(icon.props.name).toBe("heart.fill");
		});

		it("shows unfilled heart when isFavorite is false", () => {
			render(<ComboCard {...defaultProps} isFavorite={false} />);

			const icon = screen.getByTestId("favorite-icon-combo-3c");
			expect(icon.props.name).toBe("heart");
		});
	});

	// === Premium Gate (AC #5) ===

	describe("premium gate", () => {
		it("calls onPremiumGate when provided and heart is pressed", () => {
			const mockGate = jest.fn();
			const mockToggle = jest.fn();
			render(
				<ComboCard
					{...defaultProps}
					onToggleFavorite={mockToggle}
					onPremiumGate={mockGate}
				/>,
			);

			fireEvent.press(screen.getByTestId("favorite-button-combo-3c"));

			expect(mockGate).toHaveBeenCalledTimes(1);
			expect(mockToggle).not.toHaveBeenCalled();
		});
	});

	// === Compact Variant (AC #7) ===

	describe("compact variant", () => {
		const compactProps = {
			...defaultProps,
			variant: "compact" as const,
		};

		it("renders color strip with 52px height", () => {
			render(<ComboCard {...compactProps} />);

			const strip = screen.getByTestId("combo-card-strip");
			expect(strip.props.style).toEqual(
				expect.objectContaining({ height: 52 }),
			);
		});

		it("renders JP name with 13px font", () => {
			render(<ComboCard {...compactProps} />);

			const jpName = screen.getByTestId("combo-card-name-jp");
			expect(jpName.props.children).toBe("三色組");
			expect(jpName.props.style).toEqual(
				expect.objectContaining({ fontSize: 13 }),
			);
		});

		it("renders EN name with 10px font", () => {
			render(<ComboCard {...compactProps} />);

			const enName = screen.getByTestId("combo-card-name-en");
			expect(enName.props.children).toBe("Three Color Set");
			expect(enName.props.style).toEqual(
				expect.objectContaining({ fontSize: 10, color: "#6b6b6b" }),
			);
		});

		it("renders heart icon via FavoriteButton", () => {
			render(<ComboCard {...compactProps} />);

			expect(screen.getByTestId("favorite-button-combo-3c")).toBeTruthy();
		});

		it("renders compact shirt icon without 'See outfit' text", () => {
			render(<ComboCard {...compactProps} />);

			expect(
				screen.getByTestId("compact-shirt-icon", {
					includeHiddenElements: true,
				}),
			).toBeTruthy();
			expect(screen.queryByText("See outfit")).toBeNull();
			expect(screen.queryByTestId("see-outfit-pill")).toBeNull();
		});

		it("does not show 'yours' label even with showYoursLabel=true", () => {
			render(
				<ComboCard
					{...compactProps}
					showYoursLabel={true}
					yourColorId="c-white"
				/>,
			);

			expect(screen.queryByTestId("yours-label")).toBeNull();
		});

		it("navigates to OutfitVisualizer on card press", () => {
			render(<ComboCard {...compactProps} />);

			fireEvent.press(screen.getByTestId("combo-card-combo-3c"));

			expect(hapticMedium).toHaveBeenCalledTimes(1);
			expect(mockPush).toHaveBeenCalledWith("OutfitVisualizer", {
				combinationId: "combo-3c",
			});
		});

		it("heart tap works in compact variant", () => {
			const mockToggle = jest.fn();
			render(<ComboCard {...compactProps} onToggleFavorite={mockToggle} />);

			fireEvent.press(screen.getByTestId("favorite-button-combo-3c"));

			expect(mockToggle).toHaveBeenCalledTimes(1);
			expect(mockPush).not.toHaveBeenCalled();
		});
	});

	// === Accessibility (AC #1, all) ===

	describe("accessibility", () => {
		it("card has accessibilityRole button", () => {
			render(<ComboCard {...defaultProps} />);

			const card = screen.getByTestId("combo-card-combo-3c");
			expect(card.props.accessibilityRole).toBe("button");
		});

		it("card has accessibilityLabel with combination name and colors", () => {
			render(<ComboCard {...defaultProps} />);

			expect(
				screen.getByLabelText(
					"Three Color Set combination: White, Black, Royal Blue",
				),
			).toBeTruthy();
		});

		it("heart button has proper accessibility labels", () => {
			render(<ComboCard {...defaultProps} isFavorite={false} />);

			expect(
				screen.getByLabelText("Save Three Color Set to favorites"),
			).toBeTruthy();
		});

		it("heart button label changes when favorited", () => {
			render(<ComboCard {...defaultProps} isFavorite={true} />);

			expect(
				screen.getByLabelText("Remove Three Color Set from favorites"),
			).toBeTruthy();
		});

		it("card has accessibilityHint describing the action", () => {
			render(<ComboCard {...defaultProps} />);

			const card = screen.getByTestId("combo-card-combo-3c");
			expect(card.props.accessibilityHint).toBe("Opens outfit visualizer");
		});
	});
});
