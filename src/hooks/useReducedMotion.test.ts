import { act, renderHook } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

describe("useReducedMotion", () => {
	let mockListener: ((enabled: boolean) => void) | null = null;
	const mockRemove = jest.fn();

	beforeEach(() => {
		mockListener = null;
		mockRemove.mockClear();

		jest
			.spyOn(AccessibilityInfo, "isReduceMotionEnabled")
			.mockResolvedValue(false);
		jest
			.spyOn(AccessibilityInfo, "addEventListener")
			.mockImplementation((_event: unknown, handler: unknown) => {
				mockListener = handler as (enabled: boolean) => void;
				return { remove: mockRemove } as unknown as ReturnType<
					typeof AccessibilityInfo.addEventListener
				>;
			});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("returns false by default", () => {
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);
	});

	it("returns true when reduce motion is initially enabled", async () => {
		jest
			.spyOn(AccessibilityInfo, "isReduceMotionEnabled")
			.mockResolvedValue(true);

		const { result } = renderHook(() => useReducedMotion());

		await act(async () => {});

		expect(result.current).toBe(true);
	});

	it("updates when reduce motion setting changes", async () => {
		const { result } = renderHook(() => useReducedMotion());

		await act(async () => {});
		expect(result.current).toBe(false);

		act(() => {
			mockListener?.(true);
		});
		expect(result.current).toBe(true);

		act(() => {
			mockListener?.(false);
		});
		expect(result.current).toBe(false);
	});

	it("subscribes to reduceMotionChanged event", () => {
		renderHook(() => useReducedMotion());

		expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
			"reduceMotionChanged",
			expect.any(Function),
		);
	});

	it("cleans up listener on unmount", () => {
		const { unmount } = renderHook(() => useReducedMotion());

		unmount();

		expect(mockRemove).toHaveBeenCalledTimes(1);
	});
});
