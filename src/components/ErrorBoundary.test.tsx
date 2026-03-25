import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { ErrorBoundary } from "./ErrorBoundary";

jest.mock("react-native-safe-area-context", () => ({
	SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

function GoodChild() {
	return (
		<View testID="good-child">
			<Text>Working</Text>
		</View>
	);
}

function BadChild(): React.JSX.Element {
	throw new Error("Test render error");
}

describe("ErrorBoundary", () => {
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementation();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders children when no error occurs", () => {
		render(
			<ErrorBoundary>
				<GoodChild />
			</ErrorBoundary>,
		);

		expect(screen.getByTestId("good-child")).toBeTruthy();
		expect(screen.getByText("Working")).toBeTruthy();
	});

	it("renders fallback UI when a child throws during render", () => {
		render(
			<ErrorBoundary>
				<BadChild />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Outfinder")).toBeTruthy();
		expect(screen.getByText("Something went wrong")).toBeTruthy();
		expect(screen.getByTestId("error-boundary-restart")).toBeTruthy();
		expect(screen.getByText("Restart")).toBeTruthy();
	});

	it("restart button clears error state and re-renders children", () => {
		let shouldThrow = true;

		function ConditionalChild(): React.JSX.Element {
			if (shouldThrow) {
				throw new Error("Conditional error");
			}
			return (
				<View testID="recovered-child">
					<Text>Recovered</Text>
				</View>
			);
		}

		render(
			<ErrorBoundary>
				<ConditionalChild />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeTruthy();

		// Fix the error condition before pressing restart
		shouldThrow = false;

		fireEvent.press(screen.getByTestId("error-boundary-restart"));

		expect(screen.getByTestId("recovered-child")).toBeTruthy();
		expect(screen.getByText("Recovered")).toBeTruthy();
		expect(screen.queryByText("Something went wrong")).toBeNull();
	});

	it("logs error in __DEV__ mode", () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		render(
			<ErrorBoundary>
				<BadChild />
			</ErrorBoundary>,
		);

		expect(consoleSpy).toHaveBeenCalledWith(
			"ErrorBoundary caught:",
			expect.any(Error),
			expect.objectContaining({ componentStack: expect.any(String) }),
		);
	});

	it("has correct accessibility attributes on fallback UI", () => {
		render(
			<ErrorBoundary>
				<BadChild />
			</ErrorBoundary>,
		);

		expect(screen.getByLabelText("Application error screen")).toBeTruthy();
		expect(screen.getByLabelText("Restart")).toBeTruthy();
	});

	it("does not log error in production mode (__DEV__ === false)", () => {
		const originalDev = __DEV__;
		Object.defineProperty(globalThis, "__DEV__", {
			value: false,
			writable: true,
		});

		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		render(
			<ErrorBoundary>
				<BadChild />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeTruthy();
		expect(consoleSpy).not.toHaveBeenCalledWith(
			"ErrorBoundary caught:",
			expect.any(Error),
			expect.anything(),
		);

		consoleSpy.mockRestore();
		Object.defineProperty(globalThis, "__DEV__", {
			value: originalDev,
			writable: true,
		});
	});
});
