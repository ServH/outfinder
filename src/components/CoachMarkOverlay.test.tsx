import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CoachMarkOverlay } from "./CoachMarkOverlay";

jest.mock("@/hooks/useReducedMotion");
const mockUseReducedMotion = useReducedMotion as jest.Mock;

describe("CoachMarkOverlay", () => {
	let announceSpy: jest.SpyInstance;

	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
		announceSpy = jest
			.spyOn(AccessibilityInfo, "announceForAccessibility")
			.mockImplementation(() => {});
	});

	afterEach(() => {
		announceSpy.mockRestore();
	});

	it("renders nothing when visible=false", () => {
		render(
			<CoachMarkOverlay
				visible={false}
				text="Hidden tip"
				onDismiss={jest.fn()}
			/>,
		);

		expect(screen.queryByTestId("coach-mark-overlay")).toBeNull();
		expect(screen.queryByText("Hidden tip")).toBeNull();
	});

	it("renders text and dismiss button when visible=true", () => {
		render(
			<CoachMarkOverlay
				visible={true}
				text="Tap any garment to change its color"
				onDismiss={jest.fn()}
			/>,
		);

		expect(screen.getByTestId("coach-mark-overlay")).toBeTruthy();
		expect(
			screen.getByText("Tap any garment to change its color"),
		).toBeTruthy();
		expect(screen.getByTestId("coach-mark-overlay-dismiss")).toBeTruthy();
	});

	it("calls onDismiss when dismiss button is pressed", () => {
		const onDismiss = jest.fn();
		render(
			<CoachMarkOverlay visible={true} text="Tip" onDismiss={onDismiss} />,
		);

		fireEvent.press(screen.getByTestId("coach-mark-overlay-dismiss"));

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it("uses accessibilityRole='alert' on container and 'button' on dismiss", () => {
		render(
			<CoachMarkOverlay visible={true} text="Tip" onDismiss={jest.fn()} />,
		);

		expect(
			screen.getByTestId("coach-mark-overlay").props.accessibilityRole,
		).toBe("alert");
		expect(
			screen.getByTestId("coach-mark-overlay-dismiss").props.accessibilityRole,
		).toBe("button");
	});

	it("respects custom testID on container and dismiss button", () => {
		render(
			<CoachMarkOverlay
				visible={true}
				text="Tip"
				onDismiss={jest.fn()}
				testID="visualizer-coach"
			/>,
		);

		expect(screen.getByTestId("visualizer-coach")).toBeTruthy();
		expect(screen.getByTestId("visualizer-coach-dismiss")).toBeTruthy();
	});

	it("uses default dismiss label from common.coachMark.gotIt", () => {
		render(
			<CoachMarkOverlay visible={true} text="Tip" onDismiss={jest.fn()} />,
		);

		// English default per jest.setup.js initializing i18n with "en".
		expect(
			screen.getByTestId("coach-mark-overlay-dismiss").props.accessibilityLabel,
		).toBe("Got it");
	});

	it("uses provided dismissLabel override", () => {
		render(
			<CoachMarkOverlay
				visible={true}
				text="Tip"
				onDismiss={jest.fn()}
				dismissLabel="Skip tour"
			/>,
		);

		expect(
			screen.getByTestId("coach-mark-overlay-dismiss").props.accessibilityLabel,
		).toBe("Skip tour");
	});

	it("skips entry animation when Reduce Motion is enabled", () => {
		mockUseReducedMotion.mockReturnValue(true);
		const reanimated = require("react-native-reanimated");
		const withTimingSpy = jest.spyOn(reanimated, "withTiming");

		render(
			<CoachMarkOverlay visible={true} text="Tip" onDismiss={jest.fn()} />,
		);

		expect(withTimingSpy).not.toHaveBeenCalled();

		withTimingSpy.mockRestore();
	});

	it("announces text via AccessibilityInfo when no override given", () => {
		render(
			<CoachMarkOverlay
				visible={true}
				text="Tap any garment"
				onDismiss={jest.fn()}
			/>,
		);

		expect(announceSpy).toHaveBeenCalledTimes(1);
		expect(announceSpy).toHaveBeenCalledWith("Tap any garment");
	});

	it("announces accessibilityAnnouncement override when provided", () => {
		render(
			<CoachMarkOverlay
				visible={true}
				text="Tap any garment"
				onDismiss={jest.fn()}
				accessibilityAnnouncement="Tip: Tap any garment to change its color"
			/>,
		);

		expect(announceSpy).toHaveBeenCalledTimes(1);
		expect(announceSpy).toHaveBeenCalledWith(
			"Tip: Tap any garment to change its color",
		);
	});

	it("announces only once per visible→true transition", () => {
		const { rerender } = render(
			<CoachMarkOverlay visible={true} text="Tip" onDismiss={jest.fn()} />,
		);

		// Re-render with the same visible=true: should not re-announce.
		rerender(
			<CoachMarkOverlay visible={true} text="Tip" onDismiss={jest.fn()} />,
		);

		expect(announceSpy).toHaveBeenCalledTimes(1);
	});
});
