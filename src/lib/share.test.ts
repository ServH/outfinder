import type { View } from "react-native";

import { captureShareImage } from "./share";

const mockCaptureRef = jest.fn();
jest.mock("react-native-view-shot", () => ({
	captureRef: (...args: unknown[]) => mockCaptureRef(...args),
}));

describe("captureShareImage", () => {
	beforeEach(() => {
		mockCaptureRef.mockReset();
	});

	it("calls captureRef with correct format, quality, width, height options", async () => {
		mockCaptureRef.mockResolvedValue("file:///tmp/share.png");
		const viewRef = { current: {} } as React.RefObject<View>;

		await captureShareImage(viewRef);

		expect(mockCaptureRef).toHaveBeenCalledWith(viewRef, {
			format: "png",
			quality: 1,
			width: 1080,
			height: 1920,
		});
	});

	it("returns URI string on success", async () => {
		mockCaptureRef.mockResolvedValue("file:///tmp/share.png");
		const viewRef = { current: {} } as React.RefObject<View>;

		const result = await captureShareImage(viewRef);

		expect(result).toBe("file:///tmp/share.png");
	});

	it("returns null on captureRef error", async () => {
		mockCaptureRef.mockRejectedValue(new Error("capture failed"));
		const viewRef = { current: {} } as React.RefObject<View>;

		const result = await captureShareImage(viewRef);

		expect(result).toBeNull();
	});
});
