import type { View } from "react-native";

import { captureShareImage, shareOutfit } from "./share";

const mockCaptureRef = jest.fn();
jest.mock("react-native-view-shot", () => ({
	captureRef: (...args: unknown[]) => mockCaptureRef(...args),
}));

const mockIsAvailable = jest.fn();
const mockShareAsync = jest.fn();
jest.mock("expo-sharing", () => ({
	isAvailableAsync: (...args: unknown[]) => mockIsAvailable(...args),
	shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

describe("captureShareImage", () => {
	beforeEach(() => {
		mockCaptureRef.mockReset();
		mockIsAvailable.mockReset();
		mockShareAsync.mockReset();
	});

	it("calls captureRef with png format and device pixelRatio", async () => {
		mockCaptureRef.mockResolvedValue("file:///tmp/share.png");
		const viewRef = { current: {} } as React.RefObject<View>;

		await captureShareImage(viewRef);

		expect(mockCaptureRef).toHaveBeenCalledWith(viewRef, {
			format: "png",
			quality: 1,
			pixelRatio: expect.any(Number),
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

describe("shareOutfit", () => {
	beforeEach(() => {
		mockCaptureRef.mockReset();
		mockIsAvailable.mockReset();
		mockShareAsync.mockReset();
	});

	it("returns false if sharing is not available", async () => {
		mockIsAvailable.mockResolvedValue(false);
		const viewRef = { current: {} } as React.RefObject<View>;

		const result = await shareOutfit(viewRef);

		expect(result).toBe(false);
		expect(mockIsAvailable).toHaveBeenCalled();
		expect(mockCaptureRef).not.toHaveBeenCalled();
	});

	it("calls captureShareImage then Sharing.shareAsync with mimeType and UTI", async () => {
		mockIsAvailable.mockResolvedValue(true);
		mockCaptureRef.mockResolvedValue("file:///tmp/share.png");
		mockShareAsync.mockResolvedValue(undefined);
		const viewRef = { current: {} } as React.RefObject<View>;

		const result = await shareOutfit(viewRef);

		expect(result).toBe(true);
		expect(mockCaptureRef).toHaveBeenCalled();
		expect(mockShareAsync).toHaveBeenCalledWith("file:///tmp/share.png", {
			mimeType: "image/png",
			UTI: "public.png",
		});
	});

	it("returns true on successful share", async () => {
		mockIsAvailable.mockResolvedValue(true);
		mockCaptureRef.mockResolvedValue("file:///tmp/share.png");
		mockShareAsync.mockResolvedValue(undefined);
		const viewRef = { current: {} } as React.RefObject<View>;

		const result = await shareOutfit(viewRef);

		expect(result).toBe(true);
	});

	it("returns false if captureShareImage returns null", async () => {
		mockIsAvailable.mockResolvedValue(true);
		mockCaptureRef.mockRejectedValue(new Error("capture failed"));
		const viewRef = { current: {} } as React.RefObject<View>;

		const result = await shareOutfit(viewRef);

		expect(result).toBe(false);
		expect(mockShareAsync).not.toHaveBeenCalled();
	});

	it("returns false if Sharing.shareAsync throws", async () => {
		mockIsAvailable.mockResolvedValue(true);
		mockCaptureRef.mockResolvedValue("file:///tmp/share.png");
		mockShareAsync.mockRejectedValue(new Error("share cancelled"));
		const viewRef = { current: {} } as React.RefObject<View>;

		const result = await shareOutfit(viewRef);

		expect(result).toBe(false);
	});
});
