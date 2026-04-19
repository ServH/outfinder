import type { BackgroundRemovalError } from "./index";

// Jest hoists `jest.mock()` above imports, so the mock factory runs BEFORE the
// `const mockRemoveBackground = jest.fn()` executes. If the factory referenced
// the const directly it would see TDZ / undefined at `./index`'s load-time call
// to `requireNativeModule`. Defer the lookup through a closure that only
// touches `mockRemoveBackground` at call time (which happens inside each test,
// long after module init) — see `feedback_local_expo_module.md` Regla 4.
const mockRemoveBackground = jest.fn<Promise<string>, [string]>();

jest.mock("expo-modules-core", () => ({
	requireNativeModule: () => ({
		removeBackground: (uri: string) => mockRemoveBackground(uri),
	}),
}));

import { removeBackground } from "./index";

describe("removeBackground", () => {
	beforeEach(() => {
		mockRemoveBackground.mockReset();
	});

	it("resolves with the native PNG URI on the happy path", async () => {
		mockRemoveBackground.mockResolvedValueOnce("file:///tmp/cutout-abc.png");

		await expect(removeBackground("file:///in.jpg")).resolves.toBe(
			"file:///tmp/cutout-abc.png",
		);
		expect(mockRemoveBackground).toHaveBeenCalledWith("file:///in.jpg");
	});

	it("maps native code 'noSubject' to BackgroundRemovalError.kind === 'noSubject'", async () => {
		mockRemoveBackground.mockRejectedValueOnce({
			code: "noSubject",
			message: "No foreground detected",
		});

		await expect(
			removeBackground("file:///in.jpg"),
		).rejects.toEqual<BackgroundRemovalError>({
			kind: "noSubject",
			message: "No foreground detected",
		});
	});

	it("maps native code 'visionFailed' to BackgroundRemovalError.kind === 'visionFailed'", async () => {
		mockRemoveBackground.mockRejectedValueOnce({
			code: "visionFailed",
			message: "Vision request failed",
		});

		await expect(
			removeBackground("file:///in.jpg"),
		).rejects.toEqual<BackgroundRemovalError>({
			kind: "visionFailed",
			message: "Vision request failed",
		});
	});

	it("maps native code 'ioFailed' to BackgroundRemovalError.kind === 'ioFailed'", async () => {
		mockRemoveBackground.mockRejectedValueOnce({
			code: "ioFailed",
			message: "Failed to write cutout PNG",
		});

		await expect(
			removeBackground("file:///in.jpg"),
		).rejects.toEqual<BackgroundRemovalError>({
			kind: "ioFailed",
			message: "Failed to write cutout PNG",
		});
	});

	it("defaults unrecognized / missing codes to 'visionFailed'", async () => {
		mockRemoveBackground.mockRejectedValueOnce({
			code: "wtf",
			message: "something",
		});
		await expect(
			removeBackground("file:///in.jpg"),
		).rejects.toEqual<BackgroundRemovalError>({
			kind: "visionFailed",
			message: "something",
		});

		mockRemoveBackground.mockRejectedValueOnce({ message: "boom" });
		await expect(
			removeBackground("file:///in.jpg"),
		).rejects.toEqual<BackgroundRemovalError>({
			kind: "visionFailed",
			message: "boom",
		});
	});
});
