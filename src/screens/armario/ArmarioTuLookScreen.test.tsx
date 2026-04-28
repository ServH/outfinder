import { act, fireEvent, render, screen } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { exportLookImage } from "@/lib/armario/exportLookImage";
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
let mockRouteParams: { combinationId: string } = { combinationId: "combo-3" };
jest.mock("@react-navigation/native", () => ({
	useNavigation: () => ({
		goBack: mockGoBack,
		push: mockPush,
		popToTop: mockPopToTop,
	}),
	useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock("@/lib/haptics", () => ({
	hapticLight: jest.fn(),
	hapticMedium: jest.fn(),
}));

jest.mock("@/lib/armario/exportLookImage", () => ({
	exportLookImage: jest.fn(),
	ExportLookError: class ExportLookError extends Error {
		kind: string;
		constructor(kind: string, cause?: unknown) {
			super(kind);
			this.kind = kind;
			void cause;
		}
	},
}));

jest.mock("expo-sharing", () => ({
	isAvailableAsync: jest.fn(),
	shareAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => {
	const fileDeleteSpy = jest.fn();
	class MockFile {
		uri: string;
		constructor(uri: string) {
			this.uri = uri;
		}
		delete() {
			fileDeleteSpy(this.uri);
		}
	}
	return {
		File: MockFile,
		Directory: class MockDirectory {},
		Paths: {
			document: { uri: "file:///doc" },
			cache: { uri: "file:///cache" },
		},
		__fileDeleteSpy: fileDeleteSpy,
	};
});
const { __fileDeleteSpy: fileDeleteSpy } = jest.requireMock(
	"expo-file-system",
) as { __fileDeleteSpy: jest.Mock };

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
jest.mock("@/stores/misLooksStore", () => ({
	useMisLooksStore: (
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
	const { ArmarioTuLookScreen } = require("./ArmarioTuLookScreen") as {
		ArmarioTuLookScreen: React.ComponentType<Record<string, never>>;
	};
	return ArmarioTuLookScreen;
}

async function flushEffects() {
	// Drains the full microtask + macrotask queue so the async image-loader
	// useEffect resolves reliably across Node versions and promise-chain depths.
	await act(async () => {
		await new Promise((r) => setImmediate(r));
	});
}

describe("ArmarioTuLookScreen", () => {
	beforeEach(() => {
		mockGoBack.mockClear();
		mockPush.mockClear();
		mockPopToTop.mockClear();
		(hapticLight as jest.Mock).mockClear();
		(exportLookImage as jest.Mock).mockReset();
		(exportLookImage as jest.Mock).mockResolvedValue({
			uri: "file:///doc/share/look-test.jpg",
		});
		(Sharing.isAvailableAsync as jest.Mock).mockReset();
		(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
		(Sharing.shareAsync as jest.Mock).mockReset();
		(Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
		fileDeleteSpy.mockClear();
		mockRouteParams = { combinationId: "combo-3" };
		mockCombination = threeColorCombo;
		mockItems = [makeItem("u1"), makeItem("u2"), makeItem("u3")];
		mockAssignments = [0, 1, 2].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: `u${i + 1}`,
			assignedAt: 1,
		}));
	});

	it("renders combo title + completeness badge + polaroid Canvas + CTAs (signature lives inside the last polaroid, not as native chrome)", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();

		expect(screen.getByTestId("s4-tu-look-screen")).toBeTruthy();
		expect(screen.getByTestId("s4-combo-name").props.children).toBe(
			"Coral Triad",
		);
		expect(screen.getByTestId("s4-completeness-badge")).toBeTruthy();
		expect(screen.getByTestId("s4-canvas")).toBeTruthy();
		expect(screen.getByTestId("s4-share-cta")).toBeTruthy();
		expect(screen.getByTestId("s4-explore-cta")).toBeTruthy();
		// Chrome that used to live natively below the Canvas is now drawn
		// inside the last polaroid by Skia — these testIDs MUST NOT exist.
		expect(
			screen.queryByTestId("s4-wada-dots-row", { includeHiddenElements: true }),
		).toBeNull();
		expect(screen.queryByTestId("s4-footer-credential")).toBeNull();
	});

	it("useEffect fires navigation.goBack when combination is missing", async () => {
		mockCombination = undefined;
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		expect(mockGoBack).toHaveBeenCalled();
	});

	it("useEffect fires navigation.goBack when assignedCount < totalColors (partial combo)", async () => {
		// Only 2 of 3 slots assigned — incomplete.
		mockAssignments = [0, 1].map((i) => ({
			combinationId: "combo-3",
			colorIndex: i,
			wardrobeItemId: `u${i + 1}`,
			assignedAt: 1,
		}));
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();
		expect(mockGoBack).toHaveBeenCalled();
	});

	it("Compartir look tap → exportLookImage + hapticLight + shareAsync with JPEG+public.jpeg", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();

		await act(async () => {
			fireEvent.press(screen.getByTestId("s4-share-cta"));
		});
		await flushEffects();

		expect(exportLookImage).toHaveBeenCalledTimes(1);
		expect(hapticLight).toHaveBeenCalled();
		expect(Sharing.shareAsync).toHaveBeenCalledWith(
			"file:///doc/share/look-test.jpg",
			{ mimeType: "image/jpeg", UTI: "public.jpeg" },
		);
		expect(fileDeleteSpy).toHaveBeenCalledWith(
			"file:///doc/share/look-test.jpg",
		);
	});

	it("Explorar más paletas tap → navigation.popToTop + hapticLight", async () => {
		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();

		await act(async () => {
			fireEvent.press(screen.getByTestId("s4-explore-cta"));
		});

		expect(hapticLight).toHaveBeenCalled();
		expect(mockPopToTop).toHaveBeenCalledTimes(1);
	});

	it("exportLookImage rejection → alert shown, shareAsync NOT called, no haptic", async () => {
		(exportLookImage as jest.Mock).mockRejectedValueOnce(new Error("boom"));
		const alertSpy = jest
			.spyOn(Alert, "alert")
			.mockImplementation(() => undefined);

		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();

		await act(async () => {
			fireEvent.press(screen.getByTestId("s4-share-cta"));
		});
		await flushEffects();

		expect(alertSpy).toHaveBeenCalledWith(
			"Could not create share image. Try again.",
		);
		expect(Sharing.shareAsync).not.toHaveBeenCalled();
		expect(hapticLight).not.toHaveBeenCalled();
		alertSpy.mockRestore();
	});

	it("Sharing.isAvailableAsync === false → alert shown, exportLookImage NOT called", async () => {
		(Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
		const alertSpy = jest
			.spyOn(Alert, "alert")
			.mockImplementation(() => undefined);

		const Screen = loadScreen();
		render(<Screen />);
		await flushEffects();

		await act(async () => {
			fireEvent.press(screen.getByTestId("s4-share-cta"));
		});
		await flushEffects();

		expect(alertSpy).toHaveBeenCalledWith(
			"Could not create share image. Try again.",
		);
		expect(exportLookImage).not.toHaveBeenCalled();
		expect(Sharing.shareAsync).not.toHaveBeenCalled();
		alertSpy.mockRestore();
	});
});
