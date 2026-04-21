import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { hapticLight } from "@/lib/haptics";
import { unassign } from "@/lib/wardrobeRepo";

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
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockRouteParams: { combinationId: string } = { combinationId: "combo-3" };
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		goBack: mockGoBack,
		replace: mockReplace,
		push: mockPush,
	}),
	useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

jest.mock("@/lib/wardrobeRepo", () => ({
	unassign: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
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

function loadScreen() {
	const { ArmarioFichaWadaScreen } = require("./ArmarioFichaWadaScreen") as {
		ArmarioFichaWadaScreen: React.ComponentType<{
			onViewLook?: (args: { combinationId: string }) => void;
		}>;
	};
	return ArmarioFichaWadaScreen;
}

describe("ArmarioFichaWadaScreen", () => {
	beforeEach(() => {
		mockGoBack.mockClear();
		mockReplace.mockClear();
		mockPush.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(unassign as jest.Mock).mockClear();
		mockCombination = threeColorCombo;
		mockRouteParams = { combinationId: "combo-3" };
		mockAssignments = [];
		mockItems = [];
	});

	it("renders N slot cards for a 3-color combination", () => {
		const Screen = loadScreen();
		render(<Screen />);
		expect(screen.getByTestId("s2-ficha-wada-screen")).toBeTruthy();
		expect(screen.getByTestId("s2-slot-0")).toBeTruthy();
		expect(screen.getByTestId("s2-slot-1")).toBeTruthy();
		expect(screen.getByTestId("s2-slot-2")).toBeTruthy();
	});

	it("empty slot shows dashed `+` tile + Assign link with trailing arrow (matches UX spec)", () => {
		const Screen = loadScreen();
		render(<Screen />);
		expect(screen.getByTestId("s2-slot-0-empty")).toBeTruthy();
		expect(screen.getAllByText("Assign \u2192").length).toBeGreaterThan(0);
	});

	it("filled slot shows WardrobeItemThumb + Change link with trailing arrow (matches UX spec)", () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///items/uuid-1.png",
				thumbnailPath: "file:///items/uuid-1.thumb.png",
				createdAt: 1_700_000_000_000,
			},
		];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 0,
				wardrobeItemId: "uuid-1",
				assignedAt: 1_700_000_000_000,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);
		expect(screen.getByTestId("s2-slot-0-thumb")).toBeTruthy();
		expect(screen.getAllByText("Change \u2192").length).toBeGreaterThan(0);
	});

	it("filled slot renders the Wada color name inside the left identity strip (Story 13.6 S2 redesign)", () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///items/uuid-1.png",
				thumbnailPath: "file:///items/uuid-1.thumb.png",
				createdAt: 1_700_000_000_000,
			},
		];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 0,
				wardrobeItemId: "uuid-1",
				assignedAt: 1_700_000_000_000,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);
		// Post-redesign the color name IS a visible Text inside the slot
		// card's left identity stripe — carries the color identity without
		// competing with the garment thumbnail on the right.
		expect(screen.getByText("Coral Pink")).toBeTruthy();
	});

	it("slot tap fires hapticLight + navigation.push ArmarioPicker with correct args", async () => {
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-slot-1"));
		});

		expect(hapticLight).toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("ArmarioPicker", {
			combinationId: "combo-3",
			colorIndex: 1,
		});
	});

	it("view-look CTA is disabled when 0 assignments", () => {
		const Screen = loadScreen();
		render(<Screen />);
		const cta = screen.getByTestId("s2-view-look-cta");
		expect(cta.props.accessibilityState).toEqual({ disabled: true });
	});

	it("view-look CTA pushes ArmarioTuLook when 3/3 complete (no onViewLook prop)", async () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [0, 1, 2].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: "uuid-1",
			assignedAt: 1,
		}));
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-view-look-cta"));
		});
		expect(hapticLight).toHaveBeenCalled();
		expect(mockPush).toHaveBeenCalledWith("ArmarioTuLook", {
			combinationId: "combo-3",
		});
	});

	it("view-look CTA still defers to onViewLook prop when provided (test seam)", async () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [0, 1, 2].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: "uuid-1",
			assignedAt: 1,
		}));
		const onViewLook = jest.fn();
		const Screen = loadScreen();
		render(<Screen onViewLook={onViewLook} />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-view-look-cta"));
		});
		expect(onViewLook).toHaveBeenCalledWith({ combinationId: "combo-3" });
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("view-look CTA still defers to onViewLook prop when partial (2/3) — injection seam wins for both branches", async () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [0, 1].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: "uuid-1",
			assignedAt: 1,
		}));
		const onViewLook = jest.fn();
		const Screen = loadScreen();
		render(<Screen onViewLook={onViewLook} />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-view-look-cta"));
		});
		expect(onViewLook).toHaveBeenCalledWith({ combinationId: "combo-3" });
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("view-look CTA pushes ArmarioSugerenciaArmonia when partial (2/3) and no onViewLook prop (Story 13.6)", async () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [0, 1].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: "uuid-1",
			assignedAt: 1,
		}));
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-view-look-cta"));
		});
		expect(mockPush).toHaveBeenCalledWith("ArmarioSugerenciaArmonia", {
			combinationId: "combo-3",
		});
	});

	it("CompletenessBadge reflects 2/3 amber vs 3/3 green based on assignment count", () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [0, 1].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: "uuid-1",
			assignedAt: 1,
		}));
		const Screen = loadScreen();
		const { rerender } = render(<Screen />);
		expect(
			screen.getByTestId("s2-completeness-badge-label").props.children,
		).toBe("2/3");

		mockAssignments = [0, 1, 2].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: "uuid-1",
			assignedAt: 1,
		}));
		rerender(<Screen />);
		expect(
			screen.getByTestId("s2-completeness-badge-label").props.children,
		).toBe("3/3");
	});

	// --- Story 13.4b: Quitar affordance + confirmation ---

	it("filled slot renders Quitar link with 44pt touch target + accessibilityLabel", () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 0,
				wardrobeItemId: "uuid-1",
				assignedAt: 1,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);
		const removeBtn = screen.getByTestId("s2-slot-0-remove");
		expect(removeBtn).toBeTruthy();
		expect(removeBtn.props.style.minHeight).toBe(44);
		expect(removeBtn.props.style.minWidth).toBe(44);
		expect(removeBtn.props.accessibilityLabel).toBe(
			"Remove garment from Coral Pink",
		);
	});

	it("empty slot does NOT render Quitar link", () => {
		const Screen = loadScreen();
		render(<Screen />);
		expect(screen.queryByTestId("s2-slot-0-remove")).toBeNull();
	});

	it("Quitar tap opens confirmation sheet → confirm fires unassign + dismisses sheet", async () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 0,
				wardrobeItemId: "uuid-1",
				assignedAt: 1,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);

		// Sheet is not visible initially
		expect(screen.queryByTestId("s2-quitar-confirm-body")).toBeNull();

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-slot-0-remove"));
		});

		expect(screen.getByTestId("s2-quitar-confirm-body")).toBeTruthy();

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-quitar-confirm-yes"));
		});

		expect(unassign).toHaveBeenCalledWith("combo-3", 0);
		expect(screen.queryByTestId("s2-quitar-confirm-body")).toBeNull();
	});

	it("Quitar tap → Cancel dismisses sheet without calling unassign", async () => {
		mockItems = [
			{
				id: "uuid-1",
				localImagePath: "file:///a.png",
				thumbnailPath: "file:///a.t.png",
				createdAt: 1,
			},
		];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "uuid-1",
				assignedAt: 1,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-slot-1-remove"));
		});
		expect(screen.getByTestId("s2-quitar-confirm-body")).toBeTruthy();

		await act(async () => {
			fireEvent.press(screen.getByTestId("s2-quitar-confirm-cancel"));
		});

		expect(unassign).not.toHaveBeenCalled();
		expect(screen.queryByTestId("s2-quitar-confirm-body")).toBeNull();
	});
});
