import { act, render, screen, waitFor } from "@testing-library/react-native";

// Mock modules before importing App
jest.mock("@react-navigation/native", () => ({
	NavigationContainer: ({ children }: { children: React.ReactNode }) =>
		children,
}));

// Root stack renders only the initial "Main" screen — TabNavigator — in tests.
jest.mock("@react-navigation/native-stack", () => {
	const React = require("react");
	const { View } = require("react-native");
	// biome-ignore lint/suspicious/noExplicitAny: test mock, props are ignored
	const Screen = (_props: any) => null;
	// biome-ignore lint/suspicious/noExplicitAny: test mock, children typed loosely
	const Navigator = ({ children }: { children: any }) => {
		const kids = React.Children.toArray(children);
		const initial = kids[0];
		if (!initial?.props?.component) {
			return <View testID="root-navigator-empty" />;
		}
		const Comp = initial.props.component;
		return <Comp />;
	};
	return {
		createNativeStackNavigator: () => ({ Navigator, Screen }),
	};
});

jest.mock("@/navigation/TabNavigator", () => ({
	TabNavigator: () => {
		const { View } = require("react-native");
		return <View testID="tab-navigator" />;
	},
}));

jest.mock("@/navigation/ArmarioStack", () => ({
	ArmarioStack: () => null,
}));

jest.mock("@/lib/armario/wardrobeFiles", () => ({
	runOrphanSweep: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/stores/misLooksStore", () => ({
	hydrateMisLooksStore: jest.fn().mockResolvedValue(undefined),
	useMisLooksStore: Object.assign(
		() => ({ items: [], assignments: [], favorites: new Set() }),
		{
			getState: jest.fn().mockReturnValue({
				items: [],
				assignments: [],
				favorites: new Set(),
			}),
			setState: jest.fn(),
		},
	),
}));

jest.mock("@/stores/misLooksMigration", () => ({
	runMisLooksMigration: jest.fn().mockResolvedValue({ status: "completed" }),
}));

jest.mock("@/contexts/PremiumContext", () => ({
	PremiumProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-font", () => ({
	useFonts: () => [true],
}));

jest.mock("expo-splash-screen", () => ({
	preventAutoHideAsync: jest.fn(),
	hideAsync: jest.fn(),
}));

jest.mock("react-native-gesture-handler", () => ({
	GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
		children,
}));

jest.mock("react-native-safe-area-context", () => ({
	SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
	SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
	useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

import { App } from "./App";

const SplashScreen = require("expo-splash-screen");

describe("App", () => {
	beforeEach(() => {
		(SplashScreen.hideAsync as jest.Mock).mockClear();
	});

	it("renders TabNavigator directly without onboarding", async () => {
		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("tab-navigator")).toBeTruthy();
		});
	});

	it("calls SplashScreen.hideAsync when fonts are loaded", async () => {
		render(<App />);

		await act(async () => {});

		expect(SplashScreen.hideAsync).toHaveBeenCalled();
	});

	it("shows ErrorBoundary fallback when a child throws during render", async () => {
		// Override TabNavigator mock to throw
		const TabNavigatorMock =
			require("@/navigation/TabNavigator") as typeof import("@/navigation/TabNavigator");
		const originalTabNavigator = TabNavigatorMock.TabNavigator;
		(TabNavigatorMock as Record<string, unknown>).TabNavigator = () => {
			throw new Error("Test crash");
		};

		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		render(<App />);

		await waitFor(() => {
			expect(screen.getByText("Something went wrong")).toBeTruthy();
		});

		expect(screen.getByText("Outfinder")).toBeTruthy();
		expect(screen.getByTestId("error-boundary-restart")).toBeTruthy();

		consoleSpy.mockRestore();
		(TabNavigatorMock as Record<string, unknown>).TabNavigator =
			originalTabNavigator;
	});
});
