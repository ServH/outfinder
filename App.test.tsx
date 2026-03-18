import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock modules before importing App
jest.mock("@react-navigation/native", () => ({
	NavigationContainer: ({ children }: { children: React.ReactNode }) =>
		children,
}));

jest.mock("@/navigation/TabNavigator", () => ({
	TabNavigator: () => {
		const { View } = require("react-native");
		return <View testID="tab-navigator" />;
	},
}));

jest.mock("@/contexts/FavoritesContext", () => ({
	FavoritesProvider: ({ children }: { children: React.ReactNode }) => children,
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
	useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

import { App } from "./App";

const SplashScreen = require("expo-splash-screen");

describe("App", () => {
	beforeEach(() => {
		(AsyncStorage.getItem as jest.Mock).mockReset();
		(AsyncStorage.setItem as jest.Mock).mockReset();
		(SplashScreen.hideAsync as jest.Mock).mockClear();
	});

	it("renders Onboarding when AsyncStorage flag is missing", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("onboarding-screen")).toBeTruthy();
		});

		expect(screen.queryByTestId("tab-navigator")).toBeNull();
	});

	it("renders TabNavigator when AsyncStorage flag is true", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue("true");

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("tab-navigator")).toBeTruthy();
		});

		expect(screen.queryByTestId("onboarding-screen")).toBeNull();
	});

	it("onComplete handler writes to AsyncStorage and shows TabNavigator", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
		(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("onboarding-screen")).toBeTruthy();
		});

		// Press the skip button to trigger onComplete
		const skipButton = screen.getByTestId("onboarding-skip");
		await act(async () => {
			fireEvent.press(skipButton);
		});

		await waitFor(() => {
			expect(AsyncStorage.setItem).toHaveBeenCalledWith(
				"@outfinder/onboarding_seen",
				"true",
			);
		});

		await waitFor(() => {
			expect(screen.getByTestId("tab-navigator")).toBeTruthy();
		});
	});

	it("shows onboarding when AsyncStorage read fails", async () => {
		(AsyncStorage.getItem as jest.Mock).mockRejectedValue(
			new Error("storage error"),
		);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("onboarding-screen")).toBeTruthy();
		});
	});

	it("navigates to app even when AsyncStorage write fails", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
		(AsyncStorage.setItem as jest.Mock).mockRejectedValue(
			new Error("write error"),
		);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("onboarding-screen")).toBeTruthy();
		});

		const skipButton = screen.getByTestId("onboarding-skip");
		await act(async () => {
			fireEvent.press(skipButton);
		});

		await waitFor(() => {
			expect(screen.getByTestId("tab-navigator")).toBeTruthy();
		});
	});

	it("calls SplashScreen.hideAsync after onboarding state resolves", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

		render(<App />);

		await waitFor(() => {
			expect(screen.getByTestId("onboarding-screen")).toBeTruthy();
		});

		expect(SplashScreen.hideAsync).toHaveBeenCalled();
	});
});
