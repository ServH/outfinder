import { fireEvent, render, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { Combination } from "@/data/types";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { hapticLight } from "@/lib/haptics";
import { PremiumPaywall } from "./PremiumPaywall";

jest.mock("@/lib/haptics");
jest.mock("@/hooks/useReducedMotion");
jest.mock("react-native-reanimated");
jest.mock("react-native-gesture-handler", () => {
	const { View } = require("react-native");
	return {
		GestureHandlerRootView: View,
		Gesture: {
			Pan: () => ({
				enabled: jest.fn().mockReturnThis(),
				onUpdate: jest.fn().mockReturnThis(),
				onEnd: jest.fn().mockReturnThis(),
			}),
		},
		GestureDetector: ({ children }: { children: React.ReactNode }) => children,
	};
});

jest.mock("@/data/colorIndex", () => ({
	getCombination: (id: string) => {
		const combos: Record<string, Combination> = {
			"combo-1": {
				id: "combo-1",
				nameJp: "配色 1",
				nameEn: "Combination 1",
				colors: [
					{
						id: "c1",
						hex: "#FF0000",
						nameJp: "赤",
						nameEn: "Red",
						swatchGroup: 1 as const,
						combinationCount: 5,
					},
					{
						id: "c2",
						hex: "#00FF00",
						nameJp: "緑",
						nameEn: "Green",
						swatchGroup: 5 as const,
						combinationCount: 3,
					},
				],
			},
			"combo-2": {
				id: "combo-2",
				nameJp: "配色 2",
				nameEn: "Combination 2",
				colors: [
					{
						id: "c3",
						hex: "#0000FF",
						nameJp: "青",
						nameEn: "Blue",
						swatchGroup: 2 as const,
						combinationCount: 4,
					},
				],
			},
		};
		return combos[id];
	},
	getAllCombinations: () => new Array(348),
}));

const mockUseReducedMotion = useReducedMotion as jest.Mock;

const blockedCombo: Combination = {
	id: "combo-blocked",
	nameJp: "配色 6",
	nameEn: "Blocked Combo",
	colors: [
		{
			id: "c10",
			hex: "#AABBCC",
			nameJp: "灰",
			nameEn: "Gray",
			swatchGroup: 0,
			combinationCount: 2,
		},
		{
			id: "c11",
			hex: "#DDEEFF",
			nameJp: "白",
			nameEn: "White",
			swatchGroup: 0,
			combinationCount: 1,
		},
	],
};

const defaultProps = {
	visible: true,
	blockedCombination: blockedCombo,
	favoriteCombinationIds: ["combo-1", "combo-2"],
	priceString: "€0.99",
	onPurchase: jest.fn(),
	onRestore: jest.fn(),
	onDismiss: jest.fn(),
};

function renderPaywall(overrides = {}) {
	return render(
		<GestureHandlerRootView>
			<PremiumPaywall {...defaultProps} {...overrides} />
		</GestureHandlerRootView>,
	);
}

describe("PremiumPaywall", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseReducedMotion.mockReturnValue(false);
	});

	it("renders nothing when not visible", () => {
		renderPaywall({ visible: false });
		expect(screen.queryByTestId("premium-paywall")).toBeNull();
	});

	it("renders paywall when visible", () => {
		renderPaywall();
		expect(screen.getByTestId("premium-paywall")).toBeTruthy();
	});

	it("renders saved palette strips", () => {
		renderPaywall();
		expect(screen.getByTestId("saved-palette-combo-1")).toBeTruthy();
		expect(screen.getByTestId("saved-palette-combo-2")).toBeTruthy();
	});

	it("renders blocked palette strip with correct testID", () => {
		renderPaywall();
		expect(screen.getByTestId("blocked-palette-strip")).toBeTruthy();
	});

	it("renders limit badge with correct text", () => {
		renderPaywall();
		const badge = screen.getByTestId("limit-badge");
		expect(badge).toBeTruthy();
		expect(screen.getByText("2 of 5 free favorites used")).toBeTruthy();
	});

	it("renders headline", () => {
		renderPaywall();
		expect(screen.getByTestId("paywall-headline")).toBeTruthy();
		expect(screen.getByText("Don't stop\ncollecting")).toBeTruthy();
	});

	it("renders body text with remaining combinations count", () => {
		renderPaywall();
		const body = screen.getByTestId("paywall-body");
		expect(body).toBeTruthy();
	});

	it("renders price tag with priceString", () => {
		renderPaywall();
		expect(screen.getByText("€0.99")).toBeTruthy();
		expect(screen.getByText("one time")).toBeTruthy();
	});

	it("renders CTA button", () => {
		renderPaywall();
		expect(screen.getByText("Unlock Unlimited")).toBeTruthy();
	});

	it("calls onPurchase when CTA is pressed", () => {
		renderPaywall();
		fireEvent.press(screen.getByTestId("cta-unlock"));
		expect(defaultProps.onPurchase).toHaveBeenCalledTimes(1);
	});

	it("renders Restore Purchase link", () => {
		renderPaywall();
		expect(screen.getByText("Restore Purchase")).toBeTruthy();
	});

	it("calls onRestore when Restore Purchase is pressed", () => {
		renderPaywall();
		fireEvent.press(screen.getByTestId("restore-purchase"));
		expect(defaultProps.onRestore).toHaveBeenCalledTimes(1);
	});

	it("renders Not now link", () => {
		renderPaywall();
		expect(screen.getByText("Not now")).toBeTruthy();
	});

	it("calls onDismiss when Not now is pressed", () => {
		renderPaywall();
		fireEvent.press(screen.getByTestId("not-now"));
		expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
	});

	it("calls onDismiss when overlay is pressed", () => {
		renderPaywall();
		fireEvent.press(screen.getByTestId("paywall-overlay"));
		expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
	});

	it("fires hapticLight when paywall appears", () => {
		renderPaywall();
		expect(hapticLight).toHaveBeenCalled();
	});

	// Accessibility
	it("has accessible CTA label with price", () => {
		renderPaywall();
		expect(
			screen.getByLabelText("Unlock unlimited favorites for €0.99"),
		).toBeTruthy();
	});

	it("has accessible Restore label", () => {
		renderPaywall();
		expect(screen.getByLabelText("Restore Purchase")).toBeTruthy();
	});

	it("has accessible dismiss labels", () => {
		renderPaywall();
		const dismissLabels = screen.getAllByLabelText("Dismiss paywall");
		expect(dismissLabels.length).toBeGreaterThanOrEqual(1);
	});

	it("has accessible price tag label", () => {
		renderPaywall();
		expect(screen.getByLabelText("€0.99, one-time purchase")).toBeTruthy();
	});

	it("has accessibilityRole button on CTA", () => {
		renderPaywall();
		const cta = screen.getByTestId("cta-unlock");
		expect(cta.props.accessibilityRole).toBe("button");
	});

	it("has accessibilityRole button on Restore", () => {
		renderPaywall();
		const restore = screen.getByTestId("restore-purchase");
		expect(restore.props.accessibilityRole).toBe("button");
	});

	it("saved palette has accessibility label with color names", () => {
		renderPaywall();
		expect(
			screen.getByLabelText("Combination 1. 2 colors: Red, Green"),
		).toBeTruthy();
	});

	it("blocked palette has accessibility label", () => {
		renderPaywall();
		expect(
			screen.getByLabelText("Locked combination. Upgrade to save"),
		).toBeTruthy();
	});

	// Settings entry point
	it("omits blocked strip when no blockedCombination (Settings entry)", () => {
		renderPaywall({ blockedCombination: undefined });
		expect(screen.queryByTestId("blocked-palette-strip")).toBeNull();
	});

	it("shows dynamic badge text for Settings entry", () => {
		renderPaywall({ blockedCombination: undefined });
		expect(screen.getByText("2 of 5 free favorites used")).toBeTruthy();
	});

	it("hides palette preview when 0 favorites and no blocked combination", () => {
		renderPaywall({
			blockedCombination: undefined,
			favoriteCombinationIds: [],
		});
		expect(screen.queryByText("Your collection")).toBeNull();
	});

	// Reduced motion
	it("respects reduced motion setting", () => {
		mockUseReducedMotion.mockReturnValue(true);
		renderPaywall();
		// Should still render — just without animations
		expect(screen.getByTestId("premium-paywall")).toBeTruthy();
	});

	// Dynamic Type
	it("has allowFontScaling on all text elements", () => {
		renderPaywall();
		const headline = screen.getByTestId("paywall-headline");
		expect(headline.props.allowFontScaling).toBe(true);
	});

	// Minimum touch targets
	it("has 44px minimum touch target on secondary actions", () => {
		renderPaywall();
		const restore = screen.getByTestId("restore-purchase");
		expect(restore.props.className).toMatch(/min-h-\[44px\]/);
		const notNow = screen.getByTestId("not-now");
		expect(notNow.props.className).toMatch(/min-h-\[44px\]/);
	});

	// Loading states (Story 5.2)
	describe("purchase loading states", () => {
		it("shows ActivityIndicator on CTA when purchasing", () => {
			renderPaywall({ purchaseState: "purchasing" });
			expect(screen.getByTestId("cta-loading")).toBeTruthy();
			expect(screen.queryByText("Unlock Unlimited")).toBeNull();
		});

		it("disables CTA during purchasing", () => {
			renderPaywall({ purchaseState: "purchasing" });
			const cta = screen.getByTestId("cta-unlock");
			expect(cta.props.accessibilityState?.disabled).toBe(true);
		});

		it("shows ActivityIndicator on Restore when restoring", () => {
			renderPaywall({ purchaseState: "restoring" });
			expect(screen.getByTestId("restore-loading")).toBeTruthy();
			expect(screen.queryByText("Restore Purchase")).toBeNull();
		});

		it("disables CTA during restoring", () => {
			renderPaywall({ purchaseState: "restoring" });
			const cta = screen.getByTestId("cta-unlock");
			expect(cta.props.accessibilityState?.disabled).toBe(true);
		});

		it("disables Restore during purchasing", () => {
			renderPaywall({ purchaseState: "purchasing" });
			const restore = screen.getByTestId("restore-purchase");
			expect(restore.props.accessibilityState?.disabled).toBe(true);
		});

		it("disables Not now during any loading state", () => {
			renderPaywall({ purchaseState: "purchasing" });
			const notNow = screen.getByTestId("not-now");
			expect(notNow.props.accessibilityState?.disabled).toBe(true);
		});

		it("does not dismiss when overlay pressed during purchasing", () => {
			renderPaywall({ purchaseState: "purchasing" });
			fireEvent.press(screen.getByTestId("paywall-overlay"));
			expect(defaultProps.onDismiss).not.toHaveBeenCalled();
		});

		it("updates CTA accessibility label when purchasing", () => {
			renderPaywall({ purchaseState: "purchasing" });
			expect(screen.getByLabelText("Purchasing, please wait")).toBeTruthy();
		});

		it("updates Restore accessibility label when restoring", () => {
			renderPaywall({ purchaseState: "restoring" });
			expect(
				screen.getByLabelText("Restoring purchase, please wait"),
			).toBeTruthy();
		});
	});

	// Error states (Story 5.2)
	describe("error states", () => {
		it("renders error banner with message when purchaseState is error", () => {
			renderPaywall({
				purchaseState: "error",
				errorMessage: "Something went wrong. Please try again.",
			});
			expect(screen.getByTestId("error-banner")).toBeTruthy();
			expect(
				screen.getByText("Something went wrong. Please try again."),
			).toBeTruthy();
		});

		it("error banner has accessibilityRole alert", () => {
			renderPaywall({
				purchaseState: "error",
				errorMessage: "Network error",
			});
			const banner = screen.getByTestId("error-banner");
			expect(banner.props.accessibilityRole).toBe("alert");
		});

		it("does not render error banner when purchaseState is idle", () => {
			renderPaywall({ purchaseState: "idle", errorMessage: null });
			expect(screen.queryByTestId("error-banner")).toBeNull();
		});

		it("does not render error banner when errorMessage is null", () => {
			renderPaywall({ purchaseState: "error", errorMessage: null });
			expect(screen.queryByTestId("error-banner")).toBeNull();
		});
	});

	// accessibilityLiveRegion (Story 6.3)
	describe("accessibilityLiveRegion", () => {
		it("has polite liveRegion on CTA content area", () => {
			renderPaywall();
			const ctaContent = screen.getByTestId("cta-content");
			expect(ctaContent.props.accessibilityLiveRegion).toBe("polite");
		});

		it("has assertive liveRegion on error banner", () => {
			renderPaywall({
				purchaseState: "error",
				errorMessage: "Purchase failed",
			});
			const banner = screen.getByTestId("error-banner");
			expect(banner.props.accessibilityLiveRegion).toBe("assertive");
		});
	});

	// Default purchaseState (Story 5.2)
	it("defaults to idle purchaseState when not provided", () => {
		renderPaywall();
		expect(screen.queryByTestId("cta-loading")).toBeNull();
		expect(screen.queryByTestId("restore-loading")).toBeNull();
		expect(screen.queryByTestId("error-banner")).toBeNull();
		expect(screen.getByText("Unlock Unlimited")).toBeTruthy();
	});
});
