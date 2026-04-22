import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { deleteItemFiles } from "@/lib/armario/wardrobeFiles";
import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics";
import {
	assign,
	cascadeDeleteAssignmentsForItem,
	removeItem,
	unassign,
} from "@/lib/wardrobeRepo";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";

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
const mockNavigate = jest.fn();
let mockRouteParams: { combinationId: string; colorIndex: number } = {
	combinationId: "combo-3",
	colorIndex: 0,
};
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		goBack: mockGoBack,
		navigate: mockNavigate,
		push: jest.fn(),
	}),
	useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
	hapticRigid: jest.fn(),
}));

jest.mock("@/lib/wardrobeRepo", () => ({
	assign: jest.fn(),
	unassign: jest.fn(),
	removeItem: jest.fn(),
	cascadeDeleteAssignmentsForItem: jest.fn(),
}));

jest.mock("@/lib/armario/wardrobeFiles", () => ({
	deleteItemFiles: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => true, // commit-immediate path — skip animation
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
let mockCombination: typeof threeColorCombo | undefined = threeColorCombo;
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
	category: WardrobeCategory;
	createdAt: number;
}> = [];
let mockFavorites: Set<string> = new Set();
const mockAddFavorite = jest.fn();
jest.mock("@/stores/misLooksStore", () => {
	const state = () => ({
		hydrated: true,
		get assignments() {
			return mockAssignments;
		},
		get items() {
			return mockItems;
		},
		get favorites() {
			return mockFavorites;
		},
		addFavorite: mockAddFavorite,
	});
	const hook = (selector: (s: ReturnType<typeof state>) => unknown) =>
		selector(state());
	(hook as unknown as { getState: () => ReturnType<typeof state> }).getState =
		() => state();
	return { useMisLooksStore: hook };
});

import { AccessibilityInfo } from "react-native";

const mockAnnounce = jest
	.spyOn(AccessibilityInfo, "announceForAccessibility")
	.mockImplementation(() => undefined);

function loadScreen() {
	const { ArmarioPickerScreen } = require("./ArmarioPickerScreen") as {
		ArmarioPickerScreen: React.ComponentType<Record<string, never>>;
	};
	return ArmarioPickerScreen;
}

function sampleItem(id: string, category: WardrobeCategory = "top") {
	return {
		id,
		localImagePath: `file:///items/${id}.png`,
		thumbnailPath: `file:///items/${id}.thumb.png`,
		category,
		createdAt: 1,
	};
}

describe("ArmarioPickerScreen", () => {
	beforeEach(() => {
		mockGoBack.mockClear();
		mockNavigate.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
		(hapticRigid as jest.Mock).mockClear();
		(assign as jest.Mock).mockClear();
		(unassign as jest.Mock).mockClear();
		(removeItem as jest.Mock).mockClear();
		(cascadeDeleteAssignmentsForItem as jest.Mock).mockClear();
		(deleteItemFiles as jest.Mock).mockClear();
		mockAddFavorite.mockReset();
		mockAnnounce.mockClear();
		mockCombination = threeColorCombo;
		mockRouteParams = { combinationId: "combo-3", colorIndex: 0 };
		mockAssignments = [];
		mockItems = [];
		mockFavorites = new Set();
	});

	it("renders header, picker title and empty state when wardrobe is empty", () => {
		const Screen = loadScreen();
		render(<Screen />);
		expect(screen.getByTestId("s3-armario-picker-screen")).toBeTruthy();
		expect(screen.getByTestId("s3-sheet")).toBeTruthy();
		expect(screen.getByTestId("s3-picker-title").props.children).toBe(
			"Choose for Coral Pink",
		);
		expect(screen.getByTestId("s3-empty-state")).toBeTruthy();
	});

	it("no longer renders tab row (#6 — tabs deduplicated)", () => {
		const Screen = loadScreen();
		render(<Screen />);
		expect(screen.queryByTestId("s3-tab-wardrobe")).toBeNull();
		expect(screen.queryByTestId("s3-tab-new-photo")).toBeNull();
	});

	it("renders 3-column grid for non-empty wardrobe", () => {
		mockItems = [
			sampleItem("u1"),
			sampleItem("u2"),
			sampleItem("u3"),
			sampleItem("u4"),
		];
		const Screen = loadScreen();
		render(<Screen />);
		expect(screen.getByTestId("s3-wardrobe-grid")).toBeTruthy();
		expect(screen.getByTestId("s3-item-u1")).toBeTruthy();
		expect(screen.getByTestId("s3-item-u2")).toBeTruthy();
		expect(screen.getByTestId("s3-item-u3")).toBeTruthy();
		expect(screen.getByTestId("s3-item-u4")).toBeTruthy();
	});

	it("tap on tile commits assignment AND dismisses in a single gesture (#1)", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(assign).toHaveBeenCalledWith("combo-3", 0, "u1");
		expect(unassign).not.toHaveBeenCalled();
		expect(hapticLight).toHaveBeenCalled();
		// reduce-motion mocked true → dismiss is synchronous
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("move semantics: tapping an item assigned elsewhere unassigns old slot BEFORE new assign", async () => {
		mockItems = [sampleItem("u1")];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(unassign).toHaveBeenCalledWith("combo-3", 1);
		expect(assign).toHaveBeenCalledWith("combo-3", 0, "u1");
		const unassignOrder = (unassign as jest.Mock).mock.invocationCallOrder[0];
		const assignOrder = (assign as jest.Mock).mock.invocationCallOrder[0];
		expect(unassignOrder).toBeLessThan(assignOrder);
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("scrim tap dismisses without assigning (pure cancel)", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(
				screen.getByTestId("s3-scrim", { includeHiddenElements: true }),
			);
		});

		expect(assign).not.toHaveBeenCalled();
		expect(unassign).not.toHaveBeenCalled();
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("footer + Nueva foto navigates to ArmarioRoot with onCutoutSaved callback", async () => {
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-footer-new-photo"));
		});
		expect(mockNavigate).toHaveBeenCalledWith(
			"ArmarioRoot",
			expect.objectContaining({
				screen: "ArmarioCapture",
				params: expect.objectContaining({
					onCutoutSaved: expect.any(Function),
				}),
			}),
		);
	});

	it("onCutoutSaved commits the new item AND dismisses (single-action flow for capture path)", async () => {
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-footer-new-photo"));
		});

		const lastCall =
			mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1];
		const params = (
			lastCall as unknown as [
				string,
				{ params: { onCutoutSaved: (id: string) => void } },
			]
		)[1].params;

		await act(async () => {
			params.onCutoutSaved("newly-captured-id");
		});

		expect(assign).toHaveBeenCalledWith("combo-3", 0, "newly-captured-id");
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it("assigned-elsewhere tile renders reduced opacity + overlay label + a11y hint", () => {
		mockItems = [sampleItem("u1")];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);

		const tile = screen.getByTestId("s3-item-u1");
		expect(tile.props.style.opacity).toBe(0.5);
		expect(screen.getByTestId("s3-item-u1-assigned-elsewhere")).toBeTruthy();
		expect(tile.props.accessibilityLabel).toContain(
			"already assigned to another color",
		);
	});

	it("scrim exposes dismiss a11y label for VoiceOver", () => {
		const Screen = loadScreen();
		render(<Screen />);
		const scrim = screen.getByTestId("s3-scrim", {
			includeHiddenElements: true,
		});
		expect(scrim.props.accessibilityLabel).toBe("Dismiss picker");
	});

	it("root view sets accessibilityViewIsModal so VoiceOver does not leak to S2", () => {
		const Screen = loadScreen();
		render(<Screen />);
		// accessibilityViewIsModal must be on the root so VoiceOver can still
		// reach the scrim (a child of the root) while blocking access to S2.
		const root = screen.getByTestId("s3-armario-picker-screen");
		expect(root.props.accessibilityViewIsModal).toBe(true);
	});

	it("non-conflict tile uses default item a11y label", () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);
		const tile = screen.getByTestId("s3-item-u1");
		expect(tile.props.accessibilityLabel).toBe(
			"Garment. Double-tap to assign to Coral Pink. Long-press to delete.",
		);
	});

	it("empty-state announces copy via accessibilityLiveRegion", () => {
		const Screen = loadScreen();
		render(<Screen />);
		const empty = screen.getByTestId("s3-empty-state");
		expect(empty.props.accessibilityLiveRegion).toBe("polite");
		expect(empty.props.accessibilityLabel).toContain("Your wardrobe is empty");
	});

	it("renders drag handle inside the sheet", () => {
		const Screen = loadScreen();
		render(<Screen />);
		expect(
			screen.getByTestId("s3-drag-handle", { includeHiddenElements: true }),
		).toBeTruthy();
	});

	// --- Story 13.4b UX pass 2: long-press delete ---
	// Modal's sheet surface uses `accessibilityViewIsModal` for VoiceOver
	// focus isolation — so its testIDs are hidden from the default query
	// root. Each lookup inside the confirm sheet passes
	// `{ includeHiddenElements: true }`.

	// Story 14.12a replaces the direct long-press → confirm sheet path with
	// long-press → edit mode → (−) tap → confirm sheet. The confirm sheet
	// itself is reused byte-for-byte, so these legacy body/cancel assertions
	// still apply — they just open the sheet via the new (−) tap path.

	it("delete confirm body uses no-assignments copy when item is unassigned", async () => {
		mockItems = [sampleItem("u1")];
		mockAssignments = [];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-delete-u1"));
		});

		expect(
			screen.getByTestId("s3-delete-confirm-body", {
				includeHiddenElements: true,
			}).props.children,
		).toBe("The photo will be removed from your Wardrobe.");
	});

	it("delete confirm body includes assignment count when item is assigned", async () => {
		mockItems = [sampleItem("u1")];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
			{
				combinationId: "combo-99",
				colorIndex: 0,
				wardrobeItemId: "u1",
				assignedAt: 2,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-delete-u1"));
		});

		const body = screen.getByTestId("s3-delete-confirm-body", {
			includeHiddenElements: true,
		}).props.children;
		expect(body).toContain("2 palettes");
	});

	it("cancel dismisses sheet without any repo or file-system calls", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-delete-u1"));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByTestId("s3-delete-confirm-cancel", {
					includeHiddenElements: true,
				}),
			);
		});

		expect(cascadeDeleteAssignmentsForItem).not.toHaveBeenCalled();
		expect(removeItem).not.toHaveBeenCalled();
		expect(deleteItemFiles).not.toHaveBeenCalled();
		expect(
			screen.queryByTestId("s3-delete-confirm-title", {
				includeHiddenElements: true,
			}),
		).toBeNull();
	});

	// --- Story 14.8: commit auto-saves to Mis Looks + VoiceOver announce ---

	it("commit on fresh combo → addFavorite(combinationId) is called (AC #1)", async () => {
		mockItems = [sampleItem("u1")];
		mockFavorites = new Set();
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(assign).toHaveBeenCalledWith("combo-3", 0, "u1");
		expect(mockAddFavorite).toHaveBeenCalledWith("combo-3");
	});

	it("commit on already-favorited combo still calls addFavorite (idempotent no-op expected downstream, AC #2)", async () => {
		mockItems = [sampleItem("u1")];
		mockFavorites = new Set(["combo-3"]);
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(mockAddFavorite).toHaveBeenCalledWith("combo-3");
	});

	it("move-semantic branch still triggers auto-save addFavorite (AC #1 move case)", async () => {
		mockItems = [sampleItem("u1")];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
		];
		mockFavorites = new Set();
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(unassign).toHaveBeenCalledWith("combo-3", 1);
		expect(assign).toHaveBeenCalledWith("combo-3", 0, "u1");
		expect(mockAddFavorite).toHaveBeenCalledWith("combo-3");
	});

	it("VoiceOver announces ONCE on first assignment (combo not previously favorited, AC #12)", async () => {
		mockItems = [sampleItem("u1")];
		mockFavorites = new Set();
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(mockAnnounce).toHaveBeenCalledTimes(1);
		expect(mockAnnounce).toHaveBeenCalledWith("Look saved to My Looks");
	});

	it("VoiceOver silent on second assignment (combo already favorited, AC #12)", async () => {
		mockItems = [sampleItem("u1")];
		mockFavorites = new Set(["combo-3"]);
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(mockAnnounce).not.toHaveBeenCalled();
	});

	it("VoiceOver silent on move within already-favorited combo (AC #12)", async () => {
		mockItems = [sampleItem("u1")];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
		];
		mockFavorites = new Set(["combo-3"]);
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(mockAnnounce).not.toHaveBeenCalled();
	});

	it("addFavorite throwing does NOT throw out of commitAndDismiss — assignment still commits (AC #1 try/catch)", async () => {
		mockItems = [sampleItem("u1")];
		mockFavorites = new Set();
		mockAddFavorite.mockImplementationOnce(() => {
			throw new Error("simulated persist failure");
		});
		const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(assign).toHaveBeenCalledWith("combo-3", 0, "u1");
		expect(mockGoBack).toHaveBeenCalledTimes(1);
		warnSpy.mockRestore();
	});
});

describe("Story 14.12a — edit mode", () => {
	beforeEach(() => {
		mockGoBack.mockClear();
		mockNavigate.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(hapticMedium as jest.Mock).mockClear();
		(hapticRigid as jest.Mock).mockClear();
		(assign as jest.Mock).mockClear();
		(unassign as jest.Mock).mockClear();
		(removeItem as jest.Mock).mockClear();
		(cascadeDeleteAssignmentsForItem as jest.Mock).mockClear();
		(deleteItemFiles as jest.Mock).mockClear();
		mockAddFavorite.mockReset();
		mockAnnounce.mockClear();
		mockCombination = threeColorCombo;
		mockRouteParams = { combinationId: "combo-3", colorIndex: 0 };
		mockAssignments = [];
		mockItems = [];
		mockFavorites = new Set();
	});

	it("long-press on a thumbnail enters edit mode, fires hapticMedium, and renders (−) badges on every tile", async () => {
		mockItems = [sampleItem("u1"), sampleItem("u2")];
		const Screen = loadScreen();
		render(<Screen />);

		expect(screen.queryByTestId("s3-edit-title")).toBeNull();
		expect(screen.queryByTestId("armario-delete-u1")).toBeNull();

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});

		expect(hapticMedium).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("armario-delete-u1")).toBeTruthy();
		expect(screen.getByTestId("armario-delete-u2")).toBeTruthy();
		expect(screen.getByTestId("s3-edit-title")).toBeTruthy();
		expect(screen.queryByTestId("s3-picker-title")).toBeNull();
	});

	it("long-press fires VoiceOver announcement with enterAnnouncement string", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});

		expect(mockAnnounce).toHaveBeenCalledWith(
			"Edit mode activated. Tap the delete button on a garment to remove it.",
		);
	});

	it("(−) tap opens confirm sheet and fires hapticRigid", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-delete-u1"));
		});

		expect(hapticRigid).toHaveBeenCalledTimes(1);
		expect(
			screen.getByTestId("s3-delete-confirm-title", {
				includeHiddenElements: true,
			}),
		).toBeTruthy();
	});

	it("confirm sheet 'Eliminar' runs cascadeDeleteAssignmentsForItem → removeItem → deleteItemFiles", async () => {
		const item = sampleItem("u1");
		mockItems = [item];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-delete-u1"));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByTestId("s3-delete-confirm-yes", {
					includeHiddenElements: true,
				}),
			);
		});

		expect(cascadeDeleteAssignmentsForItem).toHaveBeenCalledWith("u1");
		expect(removeItem).toHaveBeenCalledWith("u1");
		expect(deleteItemFiles).toHaveBeenCalledWith({
			localImagePath: item.localImagePath,
			thumbnailPath: item.thumbnailPath,
		});
		expect(hapticLight).toHaveBeenCalled();
		expect(
			screen.queryByTestId("s3-delete-confirm-title", {
				includeHiddenElements: true,
			}),
		).toBeNull();
	});

	it("user remains in edit mode after a successful delete (multi-delete flow)", async () => {
		mockItems = [sampleItem("u1"), sampleItem("u2")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-delete-u1"));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByTestId("s3-delete-confirm-yes", {
					includeHiddenElements: true,
				}),
			);
		});

		expect(screen.getByTestId("s3-edit-title")).toBeTruthy();
		expect(screen.getByTestId("armario-delete-u2")).toBeTruthy();
	});

	it("tap 'Listo' exits edit mode, removes (−) badges, and restores the normal header", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-edit-done"));
		});

		expect(screen.queryByTestId("s3-edit-title")).toBeNull();
		expect(screen.queryByTestId("armario-delete-u1")).toBeNull();
		expect(screen.getByTestId("s3-picker-title")).toBeTruthy();
	});

	it("tap 'Cancelar' exits edit mode identically to 'Listo'", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-edit-cancel"));
		});

		expect(screen.queryByTestId("s3-edit-title")).toBeNull();
		expect(screen.queryByTestId("armario-delete-u1")).toBeNull();
		expect(screen.getByTestId("s3-picker-title")).toBeTruthy();
	});

	it("in edit mode, tapping the tile body does NOT assign and does NOT dismiss", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-item-u1"));
		});

		expect(assign).not.toHaveBeenCalled();
		expect(hapticLight).not.toHaveBeenCalled();
		expect(mockGoBack).not.toHaveBeenCalled();
	});

	it("under Reduce Motion, (−) badges appear synchronously on enter edit mode", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});

		// useReducedMotion() mock returns true — badge renders immediately.
		expect(screen.getByTestId("armario-delete-u1")).toBeTruthy();
	});

	it("under Reduce Motion, 'Listo' exits synchronously without fade-out delay", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("s3-edit-done"));
		});

		// Reduce-motion branch flips isEditMode synchronously.
		expect(screen.queryByTestId("s3-edit-title")).toBeNull();
	});

	it("each (−) badge has accessibilityLabel interpolated with the item's category", async () => {
		mockItems = [sampleItem("u1", "top")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});

		const badge = screen.getByTestId("armario-delete-u1");
		expect(badge.props.accessibilityLabel).toBe("Delete top");
		expect(badge.props.accessibilityRole).toBe("button");
	});

	it("tile accessibilityLabel switches to tileA11yInEditMode when edit mode is active", async () => {
		mockItems = [sampleItem("u1")];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});

		expect(screen.getByTestId("s3-item-u1").props.accessibilityLabel).toBe(
			"Garment in edit mode. Use the delete button in the corner to remove it.",
		);
	});

	it("(−) badge renders on conflict tiles above the 'Assigned elsewhere' overlay", async () => {
		mockItems = [sampleItem("u1")];
		mockAssignments = [
			{
				combinationId: "combo-3",
				colorIndex: 1,
				wardrobeItemId: "u1",
				assignedAt: 1,
			},
		];
		const Screen = loadScreen();
		render(<Screen />);

		await act(async () => {
			fireEvent(screen.getByTestId("s3-item-u1"), "longPress");
		});

		expect(screen.getByTestId("armario-delete-u1")).toBeTruthy();
		expect(screen.getByTestId("s3-item-u1-assigned-elsewhere")).toBeTruthy();
	});
});
