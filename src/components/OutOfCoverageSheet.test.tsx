import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Color } from "@/data/types";
import type { WadaMatch } from "@/lib/colorTypes";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { OutOfCoverageSheet } from "./OutOfCoverageSheet";

// Mock safe area insets
jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

// Mock haptics
jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

const mockBestMatch: WadaMatch = {
	color: {
		id: "color-brown",
		nameEn: "Raw Umber",
		nameJp: "ローアンバー",
		hex: "#5C3A1E",
		swatchGroup: 1,
		combinationCount: 6,
	} as Color,
	deltaE: 12.5,
};

const defaultProps = {
	visible: true,
	bestMatch: mockBestMatch,
	capturedHex: "#FF4500",
	onSelect: jest.fn(),
	onTryAgain: jest.fn(),
	onDismiss: jest.fn(),
};

describe("OutOfCoverageSheet", () => {
	beforeEach(() => {
		defaultProps.onSelect.mockClear();
		defaultProps.onTryAgain.mockClear();
		defaultProps.onDismiss.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
	});

	it("renders education copy (AC #4)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		expect(screen.getByTestId("out-of-coverage-message")).toBeTruthy();
		expect(
			screen.getByText(
				"This colour is too vibrant for Wada's palette — his combinations are based on natural pigments from 1930s Japan. The closest tone we found:",
			),
		).toBeTruthy();
	});

	it("renders best-match swatch visible (AC #4)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		expect(screen.getByTestId("best-match-swatch")).toBeTruthy();
	});

	it("renders best-match nameEn (AC #4)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		expect(screen.getByTestId("best-match-name")).toBeTruthy();
		expect(screen.getByText("Raw Umber")).toBeTruthy();
	});

	it("CTA tap fires hapticMedium and calls onSelect with bestMatch.color.id (AC #4)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		fireEvent.press(screen.getByTestId("out-of-coverage-cta"));
		expect(hapticMedium).toHaveBeenCalledTimes(1);
		expect(defaultProps.onSelect).toHaveBeenCalledWith("color-brown");
	});

	it("'try again' tap fires hapticLight and calls onTryAgain (AC #4, #5)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		fireEvent.press(screen.getByTestId("try-again-button"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(defaultProps.onTryAgain).toHaveBeenCalledTimes(1);
	});

	it("'try again' button renders correct text (AC #4)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		expect(screen.getByText("Try again")).toBeTruthy();
	});

	it("CTA has accessibilityRole=button (AC #6)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		const cta = screen.getByTestId("out-of-coverage-cta");
		expect(cta.props.accessibilityRole).toBe("button");
	});

	it("try-again button has accessibilityRole=button (AC #6)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		const btn = screen.getByTestId("try-again-button");
		expect(btn.props.accessibilityRole).toBe("button");
	});

	it("backdrop tap calls onDismiss (AC #5)", () => {
		render(<OutOfCoverageSheet {...defaultProps} />);
		fireEvent.press(
			screen.getByTestId("out-of-coverage-backdrop", {
				includeHiddenElements: true,
			}),
		);
		expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
	});

	it("does not render sheet when visible=false", () => {
		render(<OutOfCoverageSheet {...defaultProps} visible={false} />);
		expect(screen.queryByTestId("out-of-coverage-sheet")).toBeNull();
	});
});
