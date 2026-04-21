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

const mockGoBack = jest.fn();
const mockPush = jest.fn();
const mockPopToTop = jest.fn();
const mockReplace = jest.fn();
let mockRouteParams: { combinationId: string } = { combinationId: "combo-3" };
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		goBack: mockGoBack,
		push: mockPush,
		popToTop: mockPopToTop,
		replace: mockReplace,
	}),
	useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
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

let mockAssignments: Array<{
	combinationId: string;
	colorIndex: number;
	wardrobeItemId: string;
	assignedAt: number;
}> = [];
let mockItems: Array<{
	id: string;
	localImagePath: string;
	thumbnailPath: string;
	createdAt: number;
}> = [];
jest.mock("@/stores/wardrobeStore", () => ({
	useWardrobeStore: (
		selector: (s: {
			hydrated: boolean;
			assignments: typeof mockAssignments;
			items: typeof mockItems;
		}) => unknown,
	) =>
		selector({
			hydrated: true,
			assignments: mockAssignments,
			items: mockItems,
		}),
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

function makeItem(id: string) {
	return {
		id,
		localImagePath: `file:///items/${id}.webp`,
		thumbnailPath: `file:///items/${id}.thumb.webp`,
		createdAt: 1,
	};
}

function loadScreen() {
	const { ArmarioSugerenciaArmoniaScreen } =
		require("./ArmarioSugerenciaArmoniaScreen") as {
			ArmarioSugerenciaArmoniaScreen: React.ComponentType<
				Record<string, never>
			>;
		};
	return ArmarioSugerenciaArmoniaScreen;
}

async function flushEffects() {
	await act(async () => {
		await new Promise((r) => setImmediate(r));
	});
}

function setupPartial2of3() {
	mockItems = [makeItem("u1"), makeItem("u2")];
	mockAssignments = [
		{
			combinationId: "combo-3",
			colorIndex: 0,
			wardrobeItemId: "u1",
			assignedAt: 1,
		},
		{
			combinationId: "combo-3",
			colorIndex: 1,
			wardrobeItemId: "u2",
			assignedAt: 2,
		},
	];
}

function setupPartial2of3MidSlotMissing() {
	// Filled slots: 0 and 2 — missing slot is index 1 (middle).
	mockItems = [makeItem("u1"), makeItem("u3")];
	mockAssignments = [
		{
			combinationId: "combo-3",
			colorIndex: 0,
			wardrobeItemId: "u1",
			assignedAt: 1,
		},
		{
			combinationId: "combo-3",
			colorIndex: 2,
			wardrobeItemId: "u3",
			assignedAt: 3,
		},
	];
}

describe("ArmarioSugerenciaArmoniaScreen", () => {
	beforeEach(() => {
		mockGoBack.mockClear();
		mockPush.mockClear();
		mockPopToTop.mockClear();
		mockReplace.mockClear();
		(hapticLight as jest.Mock).mockClear();
		mockRouteParams = { combinationId: "combo-3" };
		mockCombination = threeColorCombo;
		setupPartial2of3();
	});

	it("renders back, combo title, badge, subtitle, Canvas, suggestion card, CTAs (2/3 partial)", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		expect(screen.getByTestId("s5-sugerencia-armonia-screen")).toBeTruthy();
		expect(screen.getByTestId("s5-back-button")).toBeTruthy();
		expect(screen.getByTestId("s5-combo-name").props.children).toBe(
			"Coral Triad",
		);
		expect(screen.getByTestId("s5-completeness-badge")).toBeTruthy();
		expect(screen.getByTestId("s5-subtitle")).toBeTruthy();
		expect(screen.getByTestId("s5-canvas")).toBeTruthy();
		expect(screen.getByTestId("s5-suggestion-card")).toBeTruthy();
		expect(screen.getByTestId("s5-primary-cta")).toBeTruthy();
		expect(screen.getByTestId("s5-secondary-cta")).toBeTruthy();
	});

	it("fires navigation.goBack when combination is missing (defensive)", async () => {
		mockCombination = undefined;
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		expect(mockGoBack).toHaveBeenCalled();
	});

	it("uses navigation.replace('ArmarioTuLook') when assignedCount === totalColors on mount (not goBack)", async () => {
		// Full 3/3 — if S5 somehow mounts for a complete combo, replace to S4.
		mockItems = [makeItem("u1"), makeItem("u2"), makeItem("u3")];
		mockAssignments = [0, 1, 2].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: `u${i + 1}`,
			assignedAt: i + 1,
		}));
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		expect(mockReplace).toHaveBeenCalledWith("ArmarioTuLook", {
			combinationId: "combo-3",
		});
		expect(mockGoBack).not.toHaveBeenCalled();
	});

	it("fires navigation.goBack when assignedCount === 0 on mount (defensive)", async () => {
		mockAssignments = [];
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		expect(mockGoBack).toHaveBeenCalled();
	});

	it("suggestion-card CTA tap → navigation.push('ArmarioPicker', ...) with lowest-index missing color + hapticLight", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		await act(async () => {
			fireEvent.press(screen.getByTestId("s5-suggestion-card"));
		});
		expect(hapticLight).toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("ArmarioPicker", {
			combinationId: "combo-3",
			colorIndex: 2, // only missing slot in the 2/3 fixture
		});
	});

	it("screen-footer primary CTA tap fires the same picker push as the suggestion-card CTA", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		await act(async () => {
			fireEvent.press(screen.getByTestId("s5-primary-cta"));
		});
		expect(mockPush).toHaveBeenCalledWith("ArmarioPicker", {
			combinationId: "combo-3",
			colorIndex: 2,
		});
	});

	it("screen-footer secondary CTA → navigation.goBack", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		await act(async () => {
			fireEvent.press(screen.getByTestId("s5-secondary-cta"));
		});
		expect(mockGoBack).toHaveBeenCalled();
	});

	it("back button tap → navigation.goBack + hapticLight", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		await act(async () => {
			fireEvent.press(screen.getByTestId("s5-back-button"));
		});
		expect(hapticLight).toHaveBeenCalled();
		expect(mockGoBack).toHaveBeenCalled();
	});

	it("2/3 mid-slot missing → suggestion copy is suggestionCopyLayer", async () => {
		setupPartial2of3MidSlotMissing();
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		const body = screen.getByTestId("s5-suggestion-card-body");
		// i18n EN default from test harness; the Layer copy contains "second
		// layer" phrase — stable sentinel without asserting the full string.
		expect(body.props.children).toContain("second layer");
	});

	it("auto-transition: 2/3 → 3/3 during screen lifetime → navigation.replace('ArmarioTuLook') fires once (ref guard)", async () => {
		const Screen = loadScreen();
		const { rerender } = render(<Screen />);
		await flushEffects();
		// Simulate store flipping to complete (missing slot 2 just assigned).
		mockItems = [makeItem("u1"), makeItem("u2"), makeItem("u3")];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u2",
				assignedAt: 2,
			},
			{
				combinationId: "combo-3",
				colorIndex: 2,
				wardrobeItemId: "u3",
				assignedAt: 3,
			},
		];
		await act(async () => {
			rerender(<Screen />);
		});
		await flushEffects();
		// Another rerender should NOT fire replace twice (ref guard).
		await act(async () => {
			rerender(<Screen />);
		});
		const replaceCallsForS4 = mockReplace.mock.calls.filter(
			(c) => c[0] === "ArmarioTuLook",
		);
		expect(replaceCallsForS4).toHaveLength(1);
	});
});
