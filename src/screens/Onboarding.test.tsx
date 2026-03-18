import { fireEvent, render, screen } from "@testing-library/react-native";
import { Onboarding } from "./Onboarding";

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

const mockOnComplete = jest.fn();

describe("Onboarding", () => {
	beforeEach(() => {
		mockOnComplete.mockClear();
	});

	it("renders all 4 slides with Japanese and English text", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		expect(screen.getByTestId("onboarding-screen")).toBeTruthy();

		// Slide 1
		expect(screen.getByText("あなたの服を開いて")).toBeTruthy();
		expect(screen.getByText("Open your wardrobe")).toBeTruthy();

		// Slide 2
		expect(screen.getByText("好きな一着を選んで")).toBeTruthy();
		expect(screen.getByText("Pick your favorite piece")).toBeTruthy();

		// Slide 3
		expect(screen.getByText("その色を見つけて")).toBeTruthy();
		expect(screen.getByText("Find its color")).toBeTruthy();

		// Slide 4
		expect(screen.getByText("組み合わせを発見しよう")).toBeTruthy();
		expect(screen.getByText("Discover your combinations")).toBeTruthy();
	});

	it("renders 4 slides with testIDs", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		expect(screen.getByTestId("onboarding-slide-0")).toBeTruthy();
		expect(screen.getByTestId("onboarding-slide-1")).toBeTruthy();
		expect(screen.getByTestId("onboarding-slide-2")).toBeTruthy();
		expect(screen.getByTestId("onboarding-slide-3")).toBeTruthy();
	});

	it("renders dot pagination with 4 dots", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		expect(screen.getByTestId("onboarding-dot-0")).toBeTruthy();
		expect(screen.getByTestId("onboarding-dot-1")).toBeTruthy();
		expect(screen.getByTestId("onboarding-dot-2")).toBeTruthy();
		expect(screen.getByTestId("onboarding-dot-3")).toBeTruthy();
	});

	it("skip button calls onComplete", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		const skipButton = screen.getByTestId("onboarding-skip");
		fireEvent.press(skipButton);

		expect(mockOnComplete).toHaveBeenCalledTimes(1);
	});

	it("skip button has correct accessibility", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		const skipButton = screen.getByTestId("onboarding-skip");
		expect(skipButton.props.accessibilityRole).toBe("button");
		expect(skipButton.props.accessibilityLabel).toBe("Skip onboarding");
	});

	it("CTA button on slide 4 calls onComplete", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		const ctaButton = screen.getByTestId("onboarding-cta");
		fireEvent.press(ctaButton);

		expect(mockOnComplete).toHaveBeenCalledTimes(1);
	});

	it("CTA button has correct accessibility", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		const ctaButton = screen.getByTestId("onboarding-cta");
		expect(ctaButton.props.accessibilityRole).toBe("button");
		expect(ctaButton.props.accessibilityLabel).toBe("Let's begin");
	});

	it("slides have accessibility labels", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		expect(
			screen.getByLabelText("Slide 1 of 4: Open your wardrobe"),
		).toBeTruthy();
		expect(
			screen.getByLabelText("Slide 2 of 4: Pick your favorite piece"),
		).toBeTruthy();
		expect(screen.getByLabelText("Slide 3 of 4: Find its color")).toBeTruthy();
		expect(
			screen.getByLabelText("Slide 4 of 4: Discover your combinations"),
		).toBeTruthy();
	});

	it("calls hapticLight on skip press", () => {
		const { hapticLight } = require("@/lib/haptics");
		render(<Onboarding onComplete={mockOnComplete} />);

		fireEvent.press(screen.getByTestId("onboarding-skip"));

		expect(hapticLight).toHaveBeenCalled();
	});

	it("calls hapticLight on CTA press", () => {
		const { hapticLight } = require("@/lib/haptics");
		hapticLight.mockClear();
		render(<Onboarding onComplete={mockOnComplete} />);

		fireEvent.press(screen.getByTestId("onboarding-cta"));

		expect(hapticLight).toHaveBeenCalled();
	});

	it("pagination dots have accessibility labels", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		expect(
			screen.getByTestId("onboarding-dot-0").props.accessibilityLabel,
		).toBe("Slide 1 of 4");
		expect(
			screen.getByTestId("onboarding-dot-1").props.accessibilityLabel,
		).toBe("Slide 2 of 4");
		expect(
			screen.getByTestId("onboarding-dot-2").props.accessibilityLabel,
		).toBe("Slide 3 of 4");
		expect(
			screen.getByTestId("onboarding-dot-3").props.accessibilityLabel,
		).toBe("Slide 4 of 4");
	});

	it("CTA button shows Japanese and English text separately", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		expect(screen.getByText("始めましょう")).toBeTruthy();
		expect(screen.getByText("Let's begin")).toBeTruthy();
	});

	it("first pagination dot is highlighted initially", () => {
		render(<Onboarding onComplete={mockOnComplete} />);

		const dot0 = screen.getByTestId("onboarding-dot-0");
		const dot1 = screen.getByTestId("onboarding-dot-1");

		expect(dot0.props.className).toContain("bg-primary");
		expect(dot1.props.className).toContain("bg-tertiary");
	});
});
