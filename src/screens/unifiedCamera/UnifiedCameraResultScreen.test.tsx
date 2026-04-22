import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import type { Color } from "@/data/types";
import { WardrobePersistenceError } from "@/lib/armario/wardrobeErrors";
import type { MatchResult } from "@/lib/colorTypes";
import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics";

// Synthetic Wada-shaped colors keep the test independent of real data.
// Brick Red (#7a3f2b) is the luminance mockup canon (cream label, < 0.40).
// Pale Yellow (#f0e6c7) deliberately crosses the 0.40 threshold (dark label).
const BRICK_RED: Color = {
	id: "test-brick",
	hex: "#7a3f2b",
	nameJp: "煉瓦色",
	nameEn: "Brick Red",
	swatchGroup: 3,
	combinationCount: 5,
};

const CLAY_RED: Color = {
	id: "test-clay",
	hex: "#8a4b33",
	nameJp: "土色",
	nameEn: "Clay Red",
	swatchGroup: 3,
	combinationCount: 7,
};

const PALE_YELLOW: Color = {
	id: "test-pale",
	hex: "#f0e6c7",
	nameJp: "淡黄色",
	nameEn: "Pale Yellow",
	swatchGroup: 0,
	combinationCount: 3,
};

const MIDNIGHT_BLUE: Color = {
	id: "test-midnight",
	hex: "#0f1a3a",
	nameJp: "紺青",
	nameEn: "Midnight Blue",
	swatchGroup: 1,
	combinationCount: 1,
};

const ZERO_COUNT: Color = {
	id: "test-zero",
	hex: "#555555",
	nameJp: "灰色",
	nameEn: "Zero Gray",
	swatchGroup: 0,
	combinationCount: 0,
};

type MockRouteParams = {
	cutoutUri: string;
	dominantHex: string;
	wadaMatch: MatchResult;
	sourceUri: string;
};

const mockRouteHolder: { current: MockRouteParams } = {
	current: {
		cutoutUri: "file:///cutout.png",
		dominantHex: "#7a3f2b",
		sourceUri: "file:///source.jpg",
		wadaMatch: { type: "direct", match: { color: BRICK_RED, deltaE: 2 } },
	},
};

const mockRootNavigate = jest.fn();
const mockLocalPush = jest.fn();
const mockLocalReplace = jest.fn();
const mockGetParent = jest.fn(() => ({ navigate: mockRootNavigate }));

jest.mock("@react-navigation/native", () => ({
	useRoute: () => ({ params: mockRouteHolder.current }),
	useNavigation: () => ({
		push: mockLocalPush,
		replace: mockLocalReplace,
		getParent: mockGetParent,
	}),
}));

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 44, right: 0, bottom: 34, left: 0 }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
	hapticRigid: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => true,
}));

// Premium flags are mutable so the "silent re-trigger" test can flip
// `isPremium` mid-flight without re-mounting the component.
const mockPremiumState: { isPremium: boolean } = { isPremium: false };
jest.mock("@/contexts/PremiumContext", () => ({
	usePremium: () => ({
		isPremium: mockPremiumState.isPremium,
		loading: false,
		paywallDismissedThisSession: false,
		setPaywallDismissedThisSession: jest.fn(),
		priceString: "€0.99",
		purchase: jest.fn(),
		restore: jest.fn(),
	}),
}));

jest.mock("@/stores/misLooksStore", () => ({
	useMisLooksStore: (selector: (s: { favorites: Set<string> }) => unknown) =>
		selector({ favorites: new Set<string>() }),
}));

const mockGateDismiss = jest.fn();
const mockGatePurchase = jest.fn();
jest.mock("@/hooks/usePremiumGate", () => ({
	usePremiumGate: () => ({
		isPremium: mockPremiumState.isPremium,
		paywallVisible: false,
		blockedCombination: undefined,
		toastVisible: false,
		toastOpacity: { setValue: jest.fn() },
		favoriteCombinationIds: [],
		priceString: "€0.99",
		purchaseState: "idle",
		errorMessage: null,
		handlePremiumGate: jest.fn(),
		handleDismiss: mockGateDismiss,
		handlePurchase: mockGatePurchase,
		handleRestore: jest.fn(),
		openPaywall: jest.fn(),
	}),
}));

jest.mock("@/lib/armario/saveCutoutAsWardrobeItem", () => ({
	saveCutoutAsWardrobeItem: jest.fn(),
}));

import { saveCutoutAsWardrobeItem } from "@/lib/armario/saveCutoutAsWardrobeItem";

// Mock PremiumPaywall as a minimal visible sentinel + dismiss triggerer.
jest.mock("@/components/PremiumPaywall", () => ({
	PremiumPaywall: ({
		visible,
		onDismiss,
	}: {
		visible: boolean;
		onDismiss: () => void;
	}) => {
		const { Pressable, View } = require("react-native");
		if (!visible) return null;
		return (
			<View testID="paywall-mock">
				<Pressable testID="paywall-mock-dismiss" onPress={onDismiss} />
			</View>
		);
	},
}));

// CategoryPickerSheet is mocked to expose its confirm/cancel callbacks via
// testIDs so tests can exercise the Result screen's save flow without
// reaching into the real sheet's internal state machine.
jest.mock("@/components/armario/CategoryPickerSheet", () => ({
	CategoryPickerSheet: ({
		visible,
		onConfirm,
		onCancel,
		confirming,
	}: {
		visible: boolean;
		onConfirm: (category: string) => void;
		onCancel: () => void;
		confirming?: boolean;
	}) => {
		const { Pressable, View } = require("react-native");
		if (!visible) return null;
		return (
			<View
				testID="category-sheet-mock"
				accessibilityState={{ busy: confirming === true }}
			>
				<Pressable
					testID="category-sheet-mock-confirm-top"
					onPress={() => onConfirm("top")}
				/>
				<Pressable
					testID="category-sheet-mock-confirm-bottom"
					onPress={() => onConfirm("bottom")}
				/>
				<Pressable testID="category-sheet-mock-cancel" onPress={onCancel} />
			</View>
		);
	},
}));

// Mocking getCombinations by confirmedTone.id keeps count-plural assertions
// deterministic independent of the real Wada dataset.
const mockCombinationsById: Record<string, number> = {
	[BRICK_RED.id]: 5,
	[CLAY_RED.id]: 7,
	[PALE_YELLOW.id]: 1,
	[MIDNIGHT_BLUE.id]: 3,
	"test-zero": 0,
};
jest.mock("@/data/colorIndex", () => ({
	getCombinations: (colorId: string) => {
		const count = mockCombinationsById[colorId] ?? 0;
		// Return an array of plausible objects; only .length is consumed.
		return Array.from({ length: count }, (_, i) => ({
			id: `${colorId}-c${i}`,
			colors: [],
			nameJp: "",
			nameEn: "",
		}));
	},
}));

import { UnifiedCameraResultScreen } from "./UnifiedCameraResultScreen";

const saveMock = saveCutoutAsWardrobeItem as jest.Mock;

function setRoute(partial: Partial<MockRouteParams>) {
	mockRouteHolder.current = {
		cutoutUri: partial.cutoutUri ?? mockRouteHolder.current.cutoutUri,
		dominantHex: partial.dominantHex ?? mockRouteHolder.current.dominantHex,
		sourceUri: partial.sourceUri ?? mockRouteHolder.current.sourceUri,
		wadaMatch: partial.wadaMatch ?? mockRouteHolder.current.wadaMatch,
	};
}

async function flushMicrotasks() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

describe("UnifiedCameraResultScreen", () => {
	beforeEach(() => {
		mockRouteHolder.current = {
			cutoutUri: "file:///cutout.png",
			dominantHex: "#7a3f2b",
			sourceUri: "file:///source.jpg",
			wadaMatch: { type: "direct", match: { color: BRICK_RED, deltaE: 2 } },
		};
		mockRootNavigate.mockClear();
		mockLocalPush.mockClear();
		mockLocalReplace.mockClear();
		mockGetParent.mockClear();
		mockGateDismiss.mockClear();
		mockGatePurchase.mockClear();
		mockPremiumState.isPremium = false;
		saveMock.mockReset();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
		(hapticRigid as jest.Mock).mockClear();
	});

	it("renders the cutout image with an accessibility label for the confirmed tone", () => {
		render(<UnifiedCameraResultScreen />);
		const cutoutContainer = screen.getByTestId("unified-camera-result-cutout");
		expect(cutoutContainer).toBeTruthy();
		expect(
			screen.getByLabelText("Cutout of your garment, tone Brick Red"),
		).toBeTruthy();
	});

	it("renders the Wada name stack with EN + JP for a direct match", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Brick Red");
		expect(
			screen.getByTestId("unified-camera-result-name-jp"),
		).toHaveTextContent("煉瓦色");
		expect(screen.getByLabelText("Tone Brick Red, 煉瓦色")).toBeTruthy();
	});

	it("renders the combinations count in plural form when count > 1", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-combinations-count"),
		).toHaveTextContent("Appears in 5 combinations");
	});

	it("hides the combinations count text when count is 0", () => {
		setRoute({
			wadaMatch: {
				type: "direct",
				match: { color: ZERO_COUNT, deltaE: 2 },
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.queryByTestId("unified-camera-result-combinations-count"),
		).toBeNull();
	});

	it("renders the combinations count in singular form when count === 1", () => {
		setRoute({
			wadaMatch: {
				type: "direct",
				match: { color: PALE_YELLOW, deltaE: 2 },
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-combinations-count"),
		).toHaveTextContent("Appears in 1 combination");
	});

	it("hides the tone-correction section for a direct match", () => {
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.queryByTestId("unified-camera-result-tone-correction"),
		).toBeNull();
	});

	it("hides the tone-correction section when type is confirm but top3[1] deltaE is not ambiguous", () => {
		setRoute({
			wadaMatch: {
				type: "confirm",
				top3: [
					{ color: BRICK_RED, deltaE: 2 },
					{ color: CLAY_RED, deltaE: 12 },
					{ color: MIDNIGHT_BLUE, deltaE: 30 },
				],
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.queryByTestId("unified-camera-result-tone-correction"),
		).toBeNull();
	});

	it("shows the tone-correction section with 2 swatches when type is confirm and top3[1] deltaE is ambiguous", () => {
		setRoute({
			wadaMatch: {
				type: "confirm",
				top3: [
					{ color: BRICK_RED, deltaE: 2 },
					{ color: CLAY_RED, deltaE: 4 },
					{ color: MIDNIGHT_BLUE, deltaE: 25 },
				],
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-tone-correction"),
		).toBeTruthy();
		expect(
			screen.getByTestId("unified-camera-result-tone-swatch-0"),
		).toBeTruthy();
		expect(
			screen.getByTestId("unified-camera-result-tone-swatch-1"),
		).toBeTruthy();
		expect(
			screen.queryByTestId("unified-camera-result-tone-swatch-2"),
		).toBeNull();
	});

	it("tapping the alternate swatch updates the Wada name, combinations count, and primary CTA background", () => {
		setRoute({
			wadaMatch: {
				type: "confirm",
				top3: [
					{ color: BRICK_RED, deltaE: 2 },
					{ color: CLAY_RED, deltaE: 4 },
					{ color: MIDNIGHT_BLUE, deltaE: 25 },
				],
			},
		});
		const announceSpy = jest
			.spyOn(AccessibilityInfo, "announceForAccessibility")
			.mockImplementation(() => {});

		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Brick Red");

		fireEvent.press(screen.getByTestId("unified-camera-result-tone-swatch-1"));

		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Clay Red");
		expect(
			screen.getByTestId("unified-camera-result-combinations-count"),
		).toHaveTextContent("Appears in 7 combinations");
		const cta = screen.getByTestId("unified-camera-result-primary-cta");
		const ctaStyle = Array.isArray(cta.props.style)
			? Object.assign({}, ...cta.props.style)
			: cta.props.style;
		expect(ctaStyle.backgroundColor).toBe(CLAY_RED.hex);
		expect(announceSpy).toHaveBeenCalledWith("Tone changed to Clay Red");
		announceSpy.mockRestore();
	});

	it("primary CTA tap fires hapticMedium and opens the category sheet (no navigation.push to PostSave)", () => {
		render(<UnifiedCameraResultScreen />);
		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		expect(hapticMedium).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("category-sheet-mock")).toBeTruthy();
		expect(mockLocalPush).not.toHaveBeenCalledWith(
			"PostSave",
			expect.anything(),
		);
		expect(mockLocalPush).not.toHaveBeenCalledWith("PostSave");
	});

	it("sheet cancel closes the sheet and does not call saveCutoutAsWardrobeItem", () => {
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		fireEvent.press(screen.getByTestId("category-sheet-mock-cancel"));
		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
		expect(saveMock).not.toHaveBeenCalled();
	});

	it("sheet confirm on success calls save with exact args and navigates via replace to PostSave", async () => {
		saveMock.mockResolvedValueOnce({ id: "new-item-1" });
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(saveMock).toHaveBeenCalledTimes(1);
		});
		expect(saveMock).toHaveBeenCalledWith({
			cutoutUri: "file:///cutout.png",
			sourceUri: "file:///source.jpg",
			isPremium: false,
			category: "top",
		});
		expect(hapticRigid).toHaveBeenCalledTimes(1);
		expect(mockLocalReplace).toHaveBeenCalledWith("PostSave", {
			wadaColorId: BRICK_RED.id,
			capturedHex: "#7a3f2b",
			categoryKey: "top",
		});
	});

	it("sheet confirm on paywall error closes the sheet and shows the paywall mock", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("paywall", "limit reached"),
		);
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
			expect(screen.getByTestId("paywall-mock")).toBeTruthy();
		});
		expect(mockLocalReplace).not.toHaveBeenCalled();
	});

	it("sheet confirm on diskFull error shows the error banner with 'out of space' copy", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("diskFull", "no space"),
		);
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(
				screen.getByTestId("unified-camera-result-error-sheet"),
			).toBeTruthy();
		});
		expect(screen.getByText("Your device is out of space")).toBeTruthy();
		expect(mockLocalReplace).not.toHaveBeenCalled();
	});

	it("sheet confirm on encode error shows the error banner with encode copy", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("encode", "encode failed"),
		);
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(
				screen.getByTestId("unified-camera-result-error-sheet"),
			).toBeTruthy();
		});
		expect(
			screen.getByText("Couldn't process the photo. Please try again."),
		).toBeTruthy();
		expect(mockLocalReplace).not.toHaveBeenCalled();
	});

	it("silent re-trigger: after paywall dismiss with isPremium=true, save is re-invoked once with the pending category", async () => {
		// First save → paywall. Second save (silent re-trigger) → success.
		saveMock
			.mockRejectedValueOnce(
				new WardrobePersistenceError("paywall", "limit reached"),
			)
			.mockResolvedValueOnce({ id: "new-item-2" });

		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-primary-cta"));
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-bottom"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("paywall-mock")).toBeTruthy();
		});

		// Simulate IAP success: premium flips to true, user dismisses paywall.
		mockPremiumState.isPremium = true;
		await act(async () => {
			fireEvent.press(screen.getByTestId("paywall-mock-dismiss"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(saveMock).toHaveBeenCalledTimes(2);
		});
		expect(saveMock.mock.calls[1][0]).toEqual({
			cutoutUri: "file:///cutout.png",
			sourceUri: "file:///source.jpg",
			isPremium: true,
			category: "bottom",
		});
		expect(mockLocalReplace).toHaveBeenCalledWith("PostSave", {
			wadaColorId: BRICK_RED.id,
			capturedHex: "#7a3f2b",
			categoryKey: "bottom",
		});
	});

	it("secondary link tap fires hapticLight and a cross-navigator navigation to Combinations with the confirmed tone params", () => {
		render(<UnifiedCameraResultScreen />);
		fireEvent.press(screen.getByTestId("unified-camera-result-secondary-link"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockGetParent).toHaveBeenCalled();
		expect(mockRootNavigate).toHaveBeenCalledTimes(1);
		expect(mockRootNavigate).toHaveBeenCalledWith("Main", {
			screen: "ColorsTab",
			params: {
				screen: "Combinations",
				params: { colorId: BRICK_RED.id, capturedHex: "#7a3f2b" },
			},
		});
	});

	it("out-of-coverage match falls back to bestMatch.color in the name stack, primary CTA tint, and hides tone-correction", () => {
		setRoute({
			dominantHex: "#ff00ff",
			wadaMatch: {
				type: "out-of-coverage",
				bestMatch: { color: MIDNIGHT_BLUE, deltaE: 40 },
			},
		});
		render(<UnifiedCameraResultScreen />);
		expect(
			screen.getByTestId("unified-camera-result-name-en"),
		).toHaveTextContent("Midnight Blue");
		const cta = screen.getByTestId("unified-camera-result-primary-cta");
		const ctaStyle = Array.isArray(cta.props.style)
			? Object.assign({}, ...cta.props.style)
			: cta.props.style;
		expect(ctaStyle.backgroundColor).toBe(MIDNIGHT_BLUE.hex);
		expect(
			screen.queryByTestId("unified-camera-result-tone-correction"),
		).toBeNull();
	});

	it("luminance rule: dark Wada tint renders a cream CTA label, pale tint renders dark ink", () => {
		setRoute({
			wadaMatch: {
				type: "direct",
				match: { color: MIDNIGHT_BLUE, deltaE: 2 },
			},
		});
		const { unmount } = render(<UnifiedCameraResultScreen />);
		const darkCtaLabels = screen.getAllByText("Save to my armario");
		const darkLabel = darkCtaLabels[0];
		const darkStyle = Array.isArray(darkLabel.props.style)
			? Object.assign({}, ...darkLabel.props.style)
			: darkLabel.props.style;
		expect(darkStyle.color).toBe("#faf7f2");
		unmount();

		setRoute({
			wadaMatch: {
				type: "direct",
				match: { color: PALE_YELLOW, deltaE: 2 },
			},
		});
		render(<UnifiedCameraResultScreen />);
		const paleCtaLabels = screen.getAllByText("Save to my armario");
		const paleLabel = paleCtaLabels[0];
		const paleStyle = Array.isArray(paleLabel.props.style)
			? Object.assign({}, ...paleLabel.props.style)
			: paleLabel.props.style;
		expect(paleStyle.color).toBe("#2d2a26");
	});
});
