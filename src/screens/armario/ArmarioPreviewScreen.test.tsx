import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { saveCutoutAsWardrobeItem } from "@/lib/armario/saveCutoutAsWardrobeItem";
import { WardrobePersistenceError } from "@/lib/armario/wardrobeErrors";
import { hapticLight, hapticRigid } from "@/lib/haptics";
import { ArmarioPreviewScreen } from "./ArmarioPreviewScreen";

// ---- Mocks -----------------------------------------------------------------

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

jest.mock("expo-symbols", () => ({
	SymbolView: ({ name }: { name: string }) => {
		const { View } = require("react-native");
		return <View testID={`symbol-${name}`} />;
	},
}));

const mockFileDelete = jest.fn();
jest.mock("expo-file-system", () => ({
	File: jest.fn().mockImplementation((uri: string) => ({
		uri,
		delete: mockFileDelete,
	})),
}));

jest.mock("@/lib/armario/saveCutoutAsWardrobeItem", () => ({
	saveCutoutAsWardrobeItem: jest.fn(),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticRigid: jest.fn(),
}));

const mockGoBack = jest.fn();
const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ goBack: mockGoBack, push: mockPush }),
	useRoute: () => ({
		params: {
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
		},
	}),
}));

// Paywall is mocked as a minimal visible sentinel + dismiss triggerer.
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

jest.mock("@/hooks/usePremiumGate", () => ({
	usePremiumGate: () => ({
		isPremium: false,
		paywallVisible: false,
		blockedCombination: undefined,
		toastVisible: false,
		toastOpacity: { setValue: jest.fn() },
		favoriteCombinationIds: [],
		priceString: "€0.99",
		purchaseState: "idle",
		errorMessage: null,
		handlePremiumGate: jest.fn(),
		handleDismiss: jest.fn(),
		handlePurchase: jest.fn(),
		handleRestore: jest.fn(),
		openPaywall: jest.fn(),
	}),
}));

jest.mock("@/contexts/FavoritesContext", () => ({
	useFavorites: () => ({
		favorites: new Set<string>(),
		toggleFavorite: jest.fn(),
		isFavorite: jest.fn(),
		count: 0,
	}),
}));

jest.mock("@/contexts/PremiumContext", () => ({
	usePremium: () => ({
		isPremium: false,
		loading: false,
		paywallDismissedThisSession: false,
		setPaywallDismissedThisSession: jest.fn(),
		priceString: "€0.99",
		purchase: jest.fn(),
		restore: jest.fn(),
	}),
}));

// Spy on the global AccessibilityInfo.announceForAccessibility rather than
// replacing the module (nativewind's runtime imports other members).
const { AccessibilityInfo } = jest.requireActual(
	"react-native",
) as typeof import("react-native");
const mockAnnounce = jest
	.spyOn(AccessibilityInfo, "announceForAccessibility")
	.mockImplementation(() => undefined);

const saveMock = saveCutoutAsWardrobeItem as jest.Mock;

async function flushMicrotasks() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

// ---- Tests -----------------------------------------------------------------

describe("ArmarioPreviewScreen", () => {
	beforeEach(() => {
		mockGoBack.mockClear();
		mockPush.mockClear();
		mockFileDelete.mockReset();
		saveMock.mockReset();
		(hapticLight as jest.Mock).mockClear();
		(hapticRigid as jest.Mock).mockClear();
		mockAnnounce.mockClear();
	});

	it("1. Retake tap → File.delete called → navigation.goBack (delete failure still nav-safe)", async () => {
		// First: happy delete
		const { unmount: unmountFirst } = render(<ArmarioPreviewScreen />);
		fireEvent.press(screen.getByTestId("armario-preview-retake-button"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockFileDelete).toHaveBeenCalledTimes(1);
		expect(mockGoBack).toHaveBeenCalledTimes(1);
		unmountFirst();

		// Reset + simulate delete throwing — the nav must still fire.
		// unmountFirst() above already isolated the first render tree; no cleanup() needed.
		mockGoBack.mockClear();
		mockFileDelete.mockReset();
		(hapticLight as jest.Mock).mockClear();
		mockFileDelete.mockImplementationOnce(() => {
			throw new Error("FileSystemError: not found");
		});
		const { unmount } = render(<ArmarioPreviewScreen />);
		fireEvent.press(screen.getByTestId("armario-preview-retake-button"));
		expect(mockGoBack).toHaveBeenCalledTimes(1);
		unmount();
	});

	it("2. Usar happy path: save resolves → hapticRigid → goBack, submitting disables CTAs in-flight", async () => {
		let resolveSave: ((value: { id: string }) => void) | undefined;
		saveMock.mockImplementationOnce(
			() =>
				new Promise<{ id: string }>((resolve) => {
					resolveSave = resolve;
				}),
		);

		render(<ArmarioPreviewScreen />);
		const useBtn = screen.getByTestId("armario-preview-use-button");
		const retakeBtn = screen.getByTestId("armario-preview-retake-button");
		const backBtn = screen.getByTestId("armario-preview-back-button");

		await act(async () => {
			fireEvent.press(useBtn);
		});

		// In-flight: accessibilityState disabled on all three controls.
		expect(useBtn.props.accessibilityState).toEqual({ disabled: true });
		expect(retakeBtn.props.accessibilityState).toEqual({ disabled: true });
		expect(backBtn.props.accessibilityState).toEqual({ disabled: true });

		await act(async () => {
			resolveSave?.({ id: "__stub__" });
			await Promise.resolve();
			await Promise.resolve();
		});

		await waitFor(() => {
			expect(hapticRigid).toHaveBeenCalledTimes(1);
			expect(mockGoBack).toHaveBeenCalledTimes(1);
		});
	});

	it("3. Usar paywall path: save rejects with WardrobePersistenceError kind=paywall → paywall appears → CTAs re-enabled", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("paywall", "limit reached"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("paywall-mock")).toBeTruthy();
		});

		const useBtn = screen.getByTestId("armario-preview-use-button");
		const retakeBtn = screen.getByTestId("armario-preview-retake-button");
		expect(useBtn.props.accessibilityState).toEqual({ disabled: false });
		expect(retakeBtn.props.accessibilityState).toEqual({ disabled: false });
		expect(mockGoBack).not.toHaveBeenCalled();
	});

	it("4. Paywall onDismiss unmounts paywall, calls File.delete for tmp cleanup, keeps Preview CTAs enabled", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("paywall", "limit reached"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("paywall-mock")).toBeTruthy();
		});

		mockFileDelete.mockReset();

		await act(async () => {
			fireEvent.press(screen.getByTestId("paywall-mock-dismiss"));
		});

		await waitFor(() => {
			expect(screen.queryByTestId("paywall-mock")).toBeNull();
		});
		expect(mockFileDelete).toHaveBeenCalledTimes(1);

		// Preview CTAs still enabled → user can tap Repetir or Usar again.
		const retakeBtn = screen.getByTestId("armario-preview-retake-button");
		expect(retakeBtn.props.accessibilityState).toEqual({ disabled: false });
	});

	it("5. Back chevron behaves identically to Retake: File.delete + goBack", () => {
		render(<ArmarioPreviewScreen />);
		fireEvent.press(screen.getByTestId("armario-preview-back-button"));
		expect(hapticLight).toHaveBeenCalledTimes(1);
		expect(mockFileDelete).toHaveBeenCalledTimes(1);
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("announces cutoutReady via AccessibilityInfo on mount (a11y)", () => {
		render(<ArmarioPreviewScreen />);
		expect(mockAnnounce).toHaveBeenCalledWith(
			"Background removed. Check the cutout.",
		);
	});
});
