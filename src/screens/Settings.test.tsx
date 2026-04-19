import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Settings } from "./Settings";

jest.mock("@/lib/haptics");
jest.mock("@/hooks/useReducedMotion");
jest.mock("react-native-reanimated");
jest.mock("@/stores/wardrobeStore", () => ({
	useWardrobeStore: Object.assign(
		() => ({ items: [], assignments: [], hydrated: true }),
		{
			getState: () => ({
				items: [],
				assignments: [],
				hydrated: true,
				setItems: jest.fn(),
				setAssignments: jest.fn(),
			}),
			setState: jest.fn(),
		},
	),
	hydrateWardrobeStore: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		getParent: () => ({ navigate: jest.fn() }),
	}),
}));
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
	getCombination: () => undefined,
	getAllCombinations: () => new Array(348),
}));

// Mock values we can control per test
const mockRestore = jest.fn().mockResolvedValue(undefined);
const mockPurchase = jest.fn().mockResolvedValue(undefined);
const mockToggleFavorite = jest.fn();
let mockIsPremium = false;
let mockCount = 3;

jest.mock("expo-constants", () => ({
	__esModule: true,
	default: {
		expoConfig: {
			version: "1.2.3",
		},
	},
}));

jest.mock("@/contexts/PremiumContext", () => ({
	usePremium: () => ({
		isPremium: mockIsPremium,
		loading: false,
		paywallDismissedThisSession: false,
		setPaywallDismissedThisSession: jest.fn(),
		priceString: "€0.99",
		purchase: mockPurchase,
		restore: mockRestore,
	}),
}));

jest.mock("@/contexts/FavoritesContext", () => ({
	useFavorites: () => ({
		favorites: new Set(["c1", "c2", "c3"]),
		toggleFavorite: mockToggleFavorite,
		isFavorite: jest.fn(),
		count: mockCount,
	}),
}));

const mockUseReducedMotion = useReducedMotion as jest.Mock;

function renderSettings() {
	return render(
		<GestureHandlerRootView>
			<Settings />
		</GestureHandlerRootView>,
	);
}

describe("Settings", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsPremium = false;
		mockCount = 3;
		mockUseReducedMotion.mockReturnValue(false);
	});

	it("renders premium section", () => {
		renderSettings();
		expect(screen.getByTestId("premium-section")).toBeTruthy();
		expect(screen.getByText("Plans")).toBeTruthy();
	});

	it("shows Free Plan badge when not premium", () => {
		renderSettings();
		expect(screen.getByTestId("free-plan-badge")).toBeTruthy();
		expect(screen.getByText("Free Plan · 3 favorites")).toBeTruthy();
	});

	it("shows Premium Active badge when premium", () => {
		mockIsPremium = true;
		renderSettings();
		expect(screen.getByTestId("premium-active-badge")).toBeTruthy();
		expect(screen.getByText("Premium Active ✓")).toBeTruthy();
	});

	it("renders Restore Purchases button", () => {
		renderSettings();
		expect(screen.getByTestId("settings-restore-button")).toBeTruthy();
		expect(screen.getByText("Restore Purchases")).toBeTruthy();
	});

	it("shows loading indicator when restore is in progress", async () => {
		let resolveRestore!: () => void;
		mockRestore.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolveRestore = resolve;
				}),
		);
		renderSettings();

		await act(async () => {
			fireEvent.press(screen.getByTestId("settings-restore-button"));
		});
		expect(screen.getByTestId("settings-restore-loading")).toBeTruthy();

		// Clean up
		await act(async () => {
			resolveRestore();
		});
	});

	it("shows Upgrade to Premium button for free users", () => {
		renderSettings();
		expect(screen.getByTestId("settings-upgrade-button")).toBeTruthy();
		expect(screen.getByText("Upgrade to Premium")).toBeTruthy();
	});

	it("hides Upgrade button for premium users", () => {
		mockIsPremium = true;
		renderSettings();
		expect(screen.queryByTestId("settings-upgrade-button")).toBeNull();
	});

	it("has accessibility label on settings screen", () => {
		renderSettings();
		expect(screen.getByLabelText("Settings screen")).toBeTruthy();
	});

	it("has accessibility role button on restore", () => {
		renderSettings();
		const btn = screen.getByTestId("settings-restore-button");
		expect(btn.props.accessibilityRole).toBe("button");
	});

	it("has accessibility role button on upgrade", () => {
		renderSettings();
		const btn = screen.getByTestId("settings-upgrade-button");
		expect(btn.props.accessibilityRole).toBe("button");
	});

	it("opens paywall when upgrade button is pressed", async () => {
		renderSettings();
		await act(async () => {
			fireEvent.press(screen.getByTestId("settings-upgrade-button"));
		});
		expect(screen.getByTestId("premium-paywall")).toBeTruthy();
	});

	it("shows Restored text on successful restore", async () => {
		let resolveRestore!: () => void;
		mockRestore.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolveRestore = resolve;
				}),
		);
		renderSettings();
		await act(async () => {
			fireEvent.press(screen.getByTestId("settings-restore-button"));
		});
		await act(async () => {
			resolveRestore();
		});
		expect(screen.getByText("Restored!")).toBeTruthy();
	});

	it("shows error message on restore failure", async () => {
		let rejectRestore!: (error: Error) => void;
		mockRestore.mockImplementation(
			() =>
				new Promise<void>((_resolve, reject) => {
					rejectRestore = reject;
				}),
		);
		renderSettings();
		await act(async () => {
			fireEvent.press(screen.getByTestId("settings-restore-button"));
		});
		await act(async () => {
			rejectRestore(new Error("No previous purchase found"));
		});
		expect(screen.getByTestId("settings-restore-error")).toBeTruthy();
		expect(
			screen.getByText("No previous purchase found for this Apple ID."),
		).toBeTruthy();
	});

	// About section tests (Story 6.2)
	it("renders about section", () => {
		renderSettings();
		expect(screen.getByText("About")).toBeTruthy();
		expect(screen.getByTestId("about-section")).toBeTruthy();
	});

	it("renders version number from expo-constants", () => {
		renderSettings();
		const versionRow = screen.getByTestId("settings-version-row");
		expect(versionRow).toBeTruthy();
		expect(screen.getByText("Version")).toBeTruthy();
		expect(screen.getByText("1.2.3")).toBeTruthy();
		expect(screen.getByLabelText("Version 1.2.3")).toBeTruthy();
	});

	it("does not render old placeholder text", () => {
		renderSettings();
		expect(screen.queryByText("More settings in 6.2")).toBeNull();
	});

	// Privacy Policy and Support links (Story 6.5)
	describe("privacy and support links", () => {
		it("renders Privacy Policy row with correct testID", () => {
			renderSettings();
			expect(screen.getByTestId("settings-privacy-row")).toBeTruthy();
			expect(screen.getByText("Privacy Policy")).toBeTruthy();
		});

		it("renders Support row with correct testID", () => {
			renderSettings();
			expect(screen.getByTestId("settings-support-row")).toBeTruthy();
			expect(screen.getByText("Support")).toBeTruthy();
		});

		it("Privacy Policy row has accessibilityRole link", () => {
			renderSettings();
			const row = screen.getByTestId("settings-privacy-row");
			expect(row.props.accessibilityRole).toBe("link");
		});

		it("Support row has accessibilityRole link", () => {
			renderSettings();
			const row = screen.getByTestId("settings-support-row");
			expect(row.props.accessibilityRole).toBe("link");
		});

		it("Privacy Policy row opens correct URL", async () => {
			const openURLSpy = jest
				.spyOn(Linking, "openURL")
				.mockResolvedValue(undefined as never);
			renderSettings();

			await act(async () => {
				fireEvent.press(screen.getByTestId("settings-privacy-row"));
			});

			expect(openURLSpy).toHaveBeenCalledWith(
				"https://servh.github.io/outfinder-legal/",
			);
			openURLSpy.mockRestore();
		});

		it("Support row opens correct URL", async () => {
			const openURLSpy = jest
				.spyOn(Linking, "openURL")
				.mockResolvedValue(undefined as never);
			renderSettings();

			await act(async () => {
				fireEvent.press(screen.getByTestId("settings-support-row"));
			});

			expect(openURLSpy).toHaveBeenCalledWith(
				"https://servh.github.io/outfinder-legal/support.html",
			);
			openURLSpy.mockRestore();
		});

		it("handles Linking.openURL failure gracefully without crashing", async () => {
			const openURLSpy = jest
				.spyOn(Linking, "openURL")
				.mockRejectedValue(new Error("Cannot open URL"));
			const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
			renderSettings();

			await act(async () => {
				fireEvent.press(screen.getByTestId("settings-privacy-row"));
			});

			expect(openURLSpy).toHaveBeenCalledWith(
				"https://servh.github.io/outfinder-legal/",
			);

			openURLSpy.mockRestore();
			consoleSpy.mockRestore();
		});
	});

	// accessibilityLiveRegion (Story 6.3)
	describe("accessibilityLiveRegion", () => {
		it("has polite liveRegion on restore button content area", () => {
			renderSettings();
			const restoreContent = screen.getByTestId("restore-content");
			expect(restoreContent.props.accessibilityLiveRegion).toBe("polite");
		});

		it("has assertive liveRegion on restore error", async () => {
			let rejectRestore!: (error: Error) => void;
			mockRestore.mockImplementation(
				() =>
					new Promise<void>((_resolve, reject) => {
						rejectRestore = reject;
					}),
			);
			renderSettings();
			await act(async () => {
				fireEvent.press(screen.getByTestId("settings-restore-button"));
			});
			await act(async () => {
				rejectRestore(new Error("No previous purchase found"));
			});
			const errorView = screen.getByTestId("settings-restore-error");
			expect(errorView.props.accessibilityLiveRegion).toBe("assertive");
		});
	});
});

describe("Settings iPad layout", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsPremium = false;
		mockCount = 3;
		mockUseReducedMotion.mockReturnValue(false);
		jest.spyOn(require("@/lib/device"), "useIsIPad").mockReturnValue(true);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("wraps content in maxWidth container on iPad", () => {
		renderSettings();
		const container = screen.getByTestId("settings-content-container");
		expect(container.props.style).toMatchObject({
			maxWidth: 560,
			alignSelf: "center",
		});
	});
});
