import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { saveCutoutAsWardrobeItem } from "@/lib/armario/saveCutoutAsWardrobeItem";
import { WardrobePersistenceError } from "@/lib/armario/wardrobeErrors";
import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics";
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
	hapticMedium: jest.fn(),
	hapticRigid: jest.fn(),
}));

// CategoryPickerSheet is mocked to expose its confirm/cancel callbacks via
// testIDs so tests can exercise the Preview screen's save flow without
// reaching into the real sheet's internal state machine. Mirrors the pattern
// in `UnifiedCameraResultScreen.test.tsx:176-207` (Story 14.5).
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
				<Pressable
					testID="category-sheet-mock-confirm-footwear"
					onPress={() => onConfirm("footwear")}
				/>
				<Pressable
					testID="category-sheet-mock-confirm-accessory"
					onPress={() => onConfirm("accessory")}
				/>
				<Pressable testID="category-sheet-mock-cancel" onPress={onCancel} />
			</View>
		);
	},
}));

const mockGoBack = jest.fn();
const mockPush = jest.fn();
const mockParentGoBack = jest.fn();
let mockRouteParams: {
	cutoutUri: string;
	sourceUri: string;
	onCutoutSaved?: (id: string) => void;
} = {
	cutoutUri: "file:///tmp/cutout.png",
	sourceUri: "file:///tmp/source.jpg",
};
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		goBack: mockGoBack,
		push: mockPush,
		getParent: () => ({ goBack: mockParentGoBack }),
	}),
	useRoute: () => ({ params: mockRouteParams }),
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

jest.mock("@/stores/misLooksStore", () => ({
	useMisLooksStore: (
		selector: (s: { favorites: Set<string>; items: unknown[] }) => unknown,
	) => selector({ favorites: new Set<string>(), items: [] }),
}));

// Mutable holder so individual tests can flip isPremium between renders
// (e.g. paywall pending-ref retry exercises isPremium=false → true).
const mockPremiumState = { isPremium: false };
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
		mockParentGoBack.mockClear();
		mockFileDelete.mockReset();
		saveMock.mockReset();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
		(hapticRigid as jest.Mock).mockClear();
		mockAnnounce.mockClear();
		mockRouteParams = {
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
		};
		mockPremiumState.isPremium = false;
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

	it("2. Usar happy path: tap Use → sheet appears (no save yet) → confirm category → submitting disables CTAs + sheet busy → resolve → hapticRigid → goBack", async () => {
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

		// Tap Use → sheet opens, save is NOT called yet (DEC-2 invariant).
		await act(async () => {
			fireEvent.press(useBtn);
		});
		expect(hapticMedium).toHaveBeenCalledTimes(1);
		expect(saveMock).not.toHaveBeenCalled();
		expect(screen.getByTestId("category-sheet-mock")).toBeTruthy();

		// Confirm a category from the sheet → save kicks off.
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});

		// In-flight: accessibilityState disabled + busy on the use CTA; the
		// other two CTAs stay `disabled` without `busy`. The sheet stays
		// mounted with `busy: true` so the in-sheet spinner is visible.
		expect(useBtn.props.accessibilityState).toEqual({
			disabled: true,
			busy: true,
		});
		expect(retakeBtn.props.accessibilityState).toEqual({ disabled: true });
		expect(backBtn.props.accessibilityState).toEqual({ disabled: true });
		expect(
			screen.getByTestId("category-sheet-mock").props.accessibilityState,
		).toEqual({ busy: true });

		await act(async () => {
			resolveSave?.({ id: "__stub__" });
			await Promise.resolve();
			await Promise.resolve();
		});

		await waitFor(() => {
			expect(hapticRigid).toHaveBeenCalledTimes(1);
			expect(mockGoBack).toHaveBeenCalledTimes(1);
		});
		// Sheet closes after success.
		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
	});

	it("3. Usar paywall path: confirm category → save rejects with kind=paywall → sheet hides + paywall appears → CTAs re-enabled", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("paywall", "limit reached"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("paywall-mock")).toBeTruthy();
		});
		// Sheet must be hidden behind the paywall.
		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();

		const useBtn = screen.getByTestId("armario-preview-use-button");
		const retakeBtn = screen.getByTestId("armario-preview-retake-button");
		expect(useBtn.props.accessibilityState).toEqual({
			disabled: false,
			busy: false,
		});
		expect(retakeBtn.props.accessibilityState).toEqual({ disabled: false });
		expect(mockGoBack).not.toHaveBeenCalled();
	});

	it("4. Paywall onDismiss unmounts paywall, preserves cutout tmp for retry, keeps Preview CTAs enabled", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("paywall", "limit reached"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
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
		// File must NOT be deleted on dismiss-without-purchase: pendingCategoryRef
		// is set, so the aftermath effect may still need the file for a retry.
		// The user lands back on Preview with Use re-enabled and can retry.
		expect(mockFileDelete).not.toHaveBeenCalled();

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

	it("6. Usar diskFull path: save rejects with kind=diskFull → sheet closes + errorDiskFull sheet + Dismiss re-enables CTAs", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("diskFull", "not enough space"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("armario-preview-error-sheet")).toBeTruthy();
		});
		expect(screen.getByText("Your device is out of space")).toBeTruthy();

		// Dismiss closes the sheet — CTAs remain enabled, tmp is NOT deleted on
		// error dismissal (Repetir still owns cutout cleanup).
		mockFileDelete.mockReset();
		await act(async () => {
			fireEvent.press(
				screen.getByTestId("armario-preview-error-dismiss-button"),
			);
		});
		await waitFor(() => {
			expect(screen.queryByTestId("armario-preview-error-sheet")).toBeNull();
		});
		expect(mockFileDelete).not.toHaveBeenCalled();

		const useBtn = screen.getByTestId("armario-preview-use-button");
		const retakeBtn = screen.getByTestId("armario-preview-retake-button");
		expect(useBtn.props.accessibilityState).toEqual({
			disabled: false,
			busy: false,
		});
		expect(retakeBtn.props.accessibilityState).toEqual({ disabled: false });
	});

	it("7. Usar encode path: save rejects with kind=encode → errorEncode sheet", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("encode", "libjpeg boom"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("armario-preview-error-sheet")).toBeTruthy();
		});
		expect(
			screen.getByText("Couldn't process the photo. Try again."),
		).toBeTruthy();
	});

	it("9. onCutoutSaved callback fires with saved id BEFORE dismissing; dismisses the ROOT modal (not just the stack pop)", async () => {
		const onCutoutSaved = jest.fn();
		mockRouteParams = {
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			onCutoutSaved,
		};
		saveMock.mockResolvedValueOnce({ id: "wardrobe-uuid-42" });
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(onCutoutSaved).toHaveBeenCalledWith("wardrobe-uuid-42");
			expect(mockParentGoBack).toHaveBeenCalledTimes(1);
		});
		// Callback must fire BEFORE the root dismiss so the picker's commit
		// lands before the modal closes.
		const callbackOrder = onCutoutSaved.mock.invocationCallOrder[0];
		const parentGoBackOrder = mockParentGoBack.mock.invocationCallOrder[0];
		expect(callbackOrder).toBeLessThan(parentGoBackOrder);
		// Local goBack should NOT be called when the root modal is closed.
		expect(mockGoBack).not.toHaveBeenCalled();
	});

	it("10. When route omits onCutoutSaved, local goBack fires (backwards-compatible single-pop)", async () => {
		saveMock.mockResolvedValueOnce({ id: "wardrobe-uuid-42" });
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(mockGoBack).toHaveBeenCalledTimes(1);
		});
		// Parent-level dismiss must NOT fire when no callback is present —
		// preserves the 13.3b direct-entry flow.
		expect(mockParentGoBack).not.toHaveBeenCalled();
	});

	it.each([
		["move"],
		["repoAdd"],
	] as const)("8. Usar %s path: save rejects → errorSaveFailed sheet", async (kind) => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError(kind, "synthetic failure"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-top"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("armario-preview-error-sheet")).toBeTruthy();
		});
		expect(
			screen.getByText("Couldn't save the garment. Try again."),
		).toBeTruthy();
	});

	it("11. Tap Use → CategoryPickerSheet appears, save NOT yet called (DEC-2 invariant)", async () => {
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});

		expect(screen.getByTestId("category-sheet-mock")).toBeTruthy();
		expect(saveMock).not.toHaveBeenCalled();
		expect(hapticMedium).toHaveBeenCalledTimes(1);
	});

	it("12. Sheet cancel → no save, no nav, no File.delete; Use button re-enabled", async () => {
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		expect(screen.getByTestId("category-sheet-mock")).toBeTruthy();

		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-cancel"));
		});

		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
		expect(saveMock).not.toHaveBeenCalled();
		expect(mockGoBack).not.toHaveBeenCalled();
		expect(mockParentGoBack).not.toHaveBeenCalled();
		expect(mockFileDelete).not.toHaveBeenCalled();

		const useBtn = screen.getByTestId("armario-preview-use-button");
		expect(useBtn.props.accessibilityState).toEqual({
			disabled: false,
			busy: false,
		});
	});

	it("13. Confirm category=footwear → saveCutoutAsWardrobeItem called with category 'footwear' (NOT hardcoded 'top')", async () => {
		saveMock.mockResolvedValueOnce({ id: "wardrobe-shoe-7" });
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByTestId("category-sheet-mock-confirm-footwear"),
			);
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(saveMock).toHaveBeenCalledTimes(1);
		});
		expect(saveMock).toHaveBeenCalledWith(
			expect.objectContaining({ category: "footwear" }),
		);
	});

	it("14. Paywall pending-category retry: free → confirm-bottom → paywall → flip premium → silent retry with same category, sheet does NOT reopen", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("paywall", "limit reached"),
		);
		const { rerender } = render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("category-sheet-mock-confirm-bottom"));
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("paywall-mock")).toBeTruthy();
		});
		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
		expect(saveMock).toHaveBeenCalledTimes(1);
		expect(saveMock).toHaveBeenLastCalledWith(
			expect.objectContaining({ category: "bottom" }),
		);

		// Simulate purchase: flip premium BEFORE dismissing the paywall, then
		// dismiss. The aftermath effect re-fires `handleCategoryConfirm` with
		// the stashed category — no second sheet is shown.
		saveMock.mockResolvedValueOnce({ id: "wardrobe-pants-9" });
		mockPremiumState.isPremium = true;
		rerender(<ArmarioPreviewScreen />);
		await act(async () => {
			fireEvent.press(screen.getByTestId("paywall-mock-dismiss"));
		});
		await flushMicrotasks();

		// On the purchase path, dismissing the paywall must NOT delete the cutout
		// tmp — the aftermath effect needs the file alive for the silent retry.
		expect(mockFileDelete).not.toHaveBeenCalled();

		await waitFor(() => {
			expect(saveMock).toHaveBeenCalledTimes(2);
		});
		expect(saveMock).toHaveBeenLastCalledWith(
			expect.objectContaining({ category: "bottom" }),
		);
		// Category sheet must NOT reopen during silent retry.
		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
	});

	it("15. Paywall dismissed without purchase: pending ref cleared, NO silent retry, Use re-enabled, sheet not reopened", async () => {
		saveMock.mockRejectedValueOnce(
			new WardrobePersistenceError("paywall", "limit reached"),
		);
		render(<ArmarioPreviewScreen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-preview-use-button"));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByTestId("category-sheet-mock-confirm-accessory"),
			);
		});
		await flushMicrotasks();

		await waitFor(() => {
			expect(screen.getByTestId("paywall-mock")).toBeTruthy();
		});
		expect(saveMock).toHaveBeenCalledTimes(1);

		// Dismiss the paywall WITHOUT flipping premium → aftermath effect must
		// clear the pending ref and NOT re-fire the save.
		await act(async () => {
			fireEvent.press(screen.getByTestId("paywall-mock-dismiss"));
		});
		await flushMicrotasks();

		expect(saveMock).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId("category-sheet-mock")).toBeNull();
		const useBtn = screen.getByTestId("armario-preview-use-button");
		expect(useBtn.props.accessibilityState).toEqual({
			disabled: false,
			busy: false,
		});
	});
});
