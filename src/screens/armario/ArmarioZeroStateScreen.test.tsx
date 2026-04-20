import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { hapticLight } from "@/lib/haptics";

jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("expo-symbols", () => ({
	SymbolView: ({ name }: { name: string }) => {
		const { View } = require("react-native");
		return <View testID={`symbol-${name}`} />;
	},
}));

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockGoBack = jest.fn();
const mockReplace = jest.fn();
let mockRouteParams: { combinationId: string } = { combinationId: "combo-3" };
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({ goBack: mockGoBack, replace: mockReplace }),
	useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

let mockReducedMotion = false;
jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => mockReducedMotion,
}));

let mockCombination:
	| {
			id: string;
			nameJp: string;
			nameEn: string;
			colors: Array<{
				id: string;
				hex: string;
				nameEn: string;
				nameJp: string;
			}>;
	  }
	| undefined;
jest.mock("@/data/colorIndex", () => ({
	getCombination: (_id: string) => mockCombination,
}));

const threeColorCombo = {
	id: "combo-3",
	nameJp: "三色",
	nameEn: "Coral Triad",
	colors: [
		{ id: "c1", hex: "#FF8080", nameEn: "Coral Pink", nameJp: "珊瑚" },
		{ id: "c2", hex: "#80D0FF", nameEn: "Sky Blue", nameJp: "空色" },
		{ id: "c3", hex: "#A8E4A0", nameEn: "Leaf Green", nameJp: "若葉" },
	],
};

function loadScreen() {
	const { ArmarioZeroStateScreen } = require("./ArmarioZeroStateScreen") as {
		ArmarioZeroStateScreen: React.ComponentType;
	};
	return ArmarioZeroStateScreen;
}

describe("ArmarioZeroStateScreen", () => {
	beforeEach(async () => {
		mockGoBack.mockClear();
		mockReplace.mockClear();
		(hapticLight as jest.Mock).mockClear();
		mockCombination = threeColorCombo;
		mockRouteParams = { combinationId: "combo-3" };
		mockReducedMotion = false;
		await AsyncStorage.clear();
	});

	it("renders hero + subtitle + CTAs + N polaroid cards for a 3-color combo", () => {
		const Screen = loadScreen();
		render(<Screen />);

		expect(screen.getByTestId("s0-zero-state-screen")).toBeTruthy();
		expect(screen.getByText(/Dress this palette/i)).toBeTruthy();
		expect(screen.getByText(/Assign a real garment/i)).toBeTruthy();
		expect(screen.getByTestId("s0-primary-cta")).toBeTruthy();
		expect(screen.getByTestId("s0-secondary-cta")).toBeTruthy();
		expect(screen.getByTestId("s0-polaroid-0")).toBeTruthy();
		expect(screen.getByTestId("s0-polaroid-1")).toBeTruthy();
		expect(screen.getByTestId("s0-polaroid-2")).toBeTruthy();
	});

	it("primary CTA tap → hapticLight + AsyncStorage.setItem(seen flag) + navigation.replace(ArmarioFichaWada)", async () => {
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s0-primary-cta"));
			await Promise.resolve();
		});

		expect(hapticLight).toHaveBeenCalled();
		expect(mockReplace).toHaveBeenCalledWith("ArmarioFichaWada", {
			combinationId: "combo-3",
		});
		expect(await AsyncStorage.getItem("@wardrobe:s0_seen_for_combo-3")).toBe(
			"1",
		);
	});

	it("secondary CTA tap → goBack + NO AsyncStorage write", async () => {
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s0-secondary-cta"));
		});

		expect(mockGoBack).toHaveBeenCalledTimes(1);
		expect(mockReplace).not.toHaveBeenCalled();
		expect(
			await AsyncStorage.getItem("@wardrobe:s0_seen_for_combo-3"),
		).toBeNull();
	});

	it("back chevron tap → goBack + NO AsyncStorage write", async () => {
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s0-back-button"));
		});

		expect(mockGoBack).toHaveBeenCalledTimes(1);
		expect(mockReplace).not.toHaveBeenCalled();
		expect(
			await AsyncStorage.getItem("@wardrobe:s0_seen_for_combo-3"),
		).toBeNull();
	});

	it("reduce-motion true → cascade still renders without any entry animation crash", () => {
		mockReducedMotion = true;
		const Screen = loadScreen();
		render(<Screen />);
		// No explicit animation ships; the screen must still render all 3 polaroids.
		expect(screen.getByTestId("s0-polaroid-0")).toBeTruthy();
		expect(screen.getByTestId("s0-polaroid-1")).toBeTruthy();
		expect(screen.getByTestId("s0-polaroid-2")).toBeTruthy();
	});

	it("defensive: combination with 0 colors short-circuits to goBack and renders null", () => {
		mockCombination = { ...threeColorCombo, colors: [] };
		const Screen = loadScreen();
		render(<Screen />);
		expect(mockGoBack).toHaveBeenCalled();
		expect(screen.queryByTestId("s0-zero-state-screen")).toBeNull();
	});
});
