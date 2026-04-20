import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { isIOS17OrNewer } from "@/lib/platform";
import { cascadeDeleteAssignmentsForCombination } from "@/lib/wardrobeRepo";
import {
	UnfavoriteCascadeProvider,
	useUnfavoriteCascade,
} from "./confirmUnfavoriteWithCascade";

jest.mock("@/lib/platform", () => ({
	isIOS17OrNewer: jest.fn(() => true),
}));

jest.mock("@/lib/wardrobeRepo", () => ({
	cascadeDeleteAssignmentsForCombination: jest.fn(),
}));

jest.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: () => false,
}));

interface HarnessProps {
	combinationId: string;
	count: number;
	onConfirm: () => void;
	onCancel?: () => void;
}

function Harness({ combinationId, count, onConfirm, onCancel }: HarnessProps) {
	const showConfirm = useUnfavoriteCascade();
	return (
		<Pressable
			testID="harness-trigger"
			onPress={() => showConfirm({ combinationId, count, onConfirm, onCancel })}
		>
			<Text>Trigger</Text>
		</Pressable>
	);
}

function renderWithProvider(props: HarnessProps) {
	return render(
		<UnfavoriteCascadeProvider>
			<Harness {...props} />
		</UnfavoriteCascadeProvider>,
	);
}

describe("UnfavoriteCascadeProvider", () => {
	beforeEach(() => {
		(cascadeDeleteAssignmentsForCombination as jest.Mock).mockClear();
		(isIOS17OrNewer as jest.Mock).mockClear();
		(isIOS17OrNewer as jest.Mock).mockReturnValue(true);
	});

	it("(m) count=0 short-circuits: onConfirm fires without rendering sheet", () => {
		const onConfirm = jest.fn();
		renderWithProvider({ combinationId: "combo-1", count: 0, onConfirm });

		fireEvent.press(screen.getByTestId("harness-trigger"));

		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(cascadeDeleteAssignmentsForCombination).not.toHaveBeenCalled();
		expect(screen.queryByTestId("armario-unfavorite-cascade-body")).toBeNull();
	});

	it("(n) count>0 iOS 17+: sheet renders with interpolated count; confirm cascades THEN fires onConfirm", async () => {
		const onConfirm = jest.fn();
		renderWithProvider({ combinationId: "combo-1", count: 2, onConfirm });

		await act(async () => {
			fireEvent.press(screen.getByTestId("harness-trigger"));
		});

		expect(
			screen.getByTestId("armario-unfavorite-cascade-body").props.children,
		).toContain("2 garments");

		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-unfavorite-cascade-confirm"));
		});

		expect(cascadeDeleteAssignmentsForCombination).toHaveBeenCalledWith(
			"combo-1",
		);
		expect(onConfirm).toHaveBeenCalledTimes(1);
		const cascadeOrder = (cascadeDeleteAssignmentsForCombination as jest.Mock)
			.mock.invocationCallOrder[0];
		const confirmOrder = onConfirm.mock.invocationCallOrder[0];
		expect(cascadeOrder).toBeLessThan(confirmOrder);
	});

	it("(o) cancel fires onCancel without cascading or confirming", async () => {
		const onConfirm = jest.fn();
		const onCancel = jest.fn();
		renderWithProvider({
			combinationId: "combo-1",
			count: 3,
			onConfirm,
			onCancel,
		});

		await act(async () => {
			fireEvent.press(screen.getByTestId("harness-trigger"));
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-unfavorite-cascade-cancel"));
		});

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onConfirm).not.toHaveBeenCalled();
		expect(cascadeDeleteAssignmentsForCombination).not.toHaveBeenCalled();
	});

	it("(p) iOS < 17 short-circuits even when count > 0 (NFR9 parity)", () => {
		(isIOS17OrNewer as jest.Mock).mockReturnValue(false);
		const onConfirm = jest.fn();
		renderWithProvider({ combinationId: "combo-1", count: 5, onConfirm });

		fireEvent.press(screen.getByTestId("harness-trigger"));

		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(cascadeDeleteAssignmentsForCombination).not.toHaveBeenCalled();
		expect(screen.queryByTestId("armario-unfavorite-cascade-body")).toBeNull();
	});

	it("cascade throw aborts before onConfirm fires (defensive guard)", async () => {
		(
			cascadeDeleteAssignmentsForCombination as jest.Mock
		).mockImplementationOnce(() => {
			throw new Error("synthetic failure");
		});
		const onConfirm = jest.fn();
		renderWithProvider({ combinationId: "combo-1", count: 2, onConfirm });

		await act(async () => {
			fireEvent.press(screen.getByTestId("harness-trigger"));
		});

		const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
		await act(async () => {
			fireEvent.press(screen.getByTestId("armario-unfavorite-cascade-confirm"));
		});

		expect(onConfirm).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

describe("useUnfavoriteCascade fallback (no provider)", () => {
	it("invokes onConfirm directly — preserves NFR9 parity outside provider tree", () => {
		const onConfirm = jest.fn();
		render(<Harness combinationId="combo-1" count={3} onConfirm={onConfirm} />);
		fireEvent.press(screen.getByTestId("harness-trigger"));
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});
});
