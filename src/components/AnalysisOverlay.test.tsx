import { act, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";
import { AnalysisOverlay } from "./AnalysisOverlay";

const announceSpy = jest.spyOn(AccessibilityInfo, "announceForAccessibility");

// Mock WarmBackground (Skia — already handled by __mocks__/@shopify/react-native-skia.js)
jest.mock("./WarmBackground", () => ({
	WarmBackground: () => {
		const { View } = require("react-native");
		return <View testID="warm-background" />;
	},
}));

// Mock useReducedMotion
const mockUseReducedMotion = jest.fn().mockReturnValue(false);
jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => mockUseReducedMotion(),
}));

describe("AnalysisOverlay — not visible", () => {
	it("renders nothing when visible=false", () => {
		render(<AnalysisOverlay visible={false} />);
		expect(screen.queryByTestId("analysis-overlay")).toBeNull();
	});
});

describe("AnalysisOverlay — visible, reduce motion OFF", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("renders overlay when visible=true", () => {
		render(<AnalysisOverlay visible={true} />);
		expect(screen.getByTestId("analysis-overlay")).toBeTruthy();
	});

	it("shows first message (analyzing0) on initial render", () => {
		render(<AnalysisOverlay visible={true} />);
		expect(screen.getByText("Finding your Wada combination...")).toBeTruthy();
	});

	it("announces first message once on visible rising edge (a11y)", () => {
		announceSpy.mockClear();
		render(<AnalysisOverlay visible={true} />);
		expect(announceSpy).toHaveBeenCalledWith(
			"Finding your Wada combination...",
		);
		// Should NOT spam VoiceOver every interval tick — only the first message.
		act(() => {
			jest.advanceTimersByTime(1200);
		});
		expect(announceSpy).toHaveBeenCalledTimes(1);
	});

	it("cycles to next message after 600ms", () => {
		render(<AnalysisOverlay visible={true} />);

		act(() => {
			jest.advanceTimersByTime(600);
		});

		expect(screen.getByText("Calibrating colour tones...")).toBeTruthy();
	});

	it("cycles through all 4 messages and wraps around", () => {
		render(<AnalysisOverlay visible={true} />);

		act(() => {
			jest.advanceTimersByTime(600 * 4);
		});

		// After 4 cycles, wraps back to message 0
		expect(screen.getByText("Finding your Wada combination...")).toBeTruthy();
	});
});

describe("AnalysisOverlay — visible, reduce motion ON", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(true);
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("cycles message without fade when reduceMotion=true", () => {
		render(<AnalysisOverlay visible={true} />);

		act(() => {
			jest.advanceTimersByTime(600);
		});

		// Message advances — no animation, just index increment
		expect(screen.getByText("Calibrating colour tones...")).toBeTruthy();
	});

	it("still announces first message on visible rising edge with reduced motion", () => {
		announceSpy.mockClear();
		render(<AnalysisOverlay visible={true} />);
		expect(announceSpy).toHaveBeenCalledWith(
			"Finding your Wada combination...",
		);
	});

	it("opacity stays at 1 throughout reduced-motion cycle (AC #4)", () => {
		render(<AnalysisOverlay visible={true} />);
		const msg = screen.getByTestId("analysis-message");

		act(() => {
			jest.advanceTimersByTime(600);
		});

		// In reduced-motion path withTiming is never called → opacity.value stays at 1.
		// If the guard were removed, the mock's withTiming(0) would leave opacity.value=0
		// after the outer assignment resolves, causing this assertion to fail.
		const flatStyle = StyleSheet.flatten(msg.props.style);
		expect(flatStyle.opacity).toBe(1);
	});
});
