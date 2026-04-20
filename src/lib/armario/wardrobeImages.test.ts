import { WardrobePersistenceError } from "./wardrobeErrors";
import { encodeMaster, encodeThumbnail } from "./wardrobeImages";

jest.mock("expo-file-system", () => {
	const directoryCreateSpy = jest.fn();
	const fileMoveSpy = jest.fn();
	class MockDirectory {
		uri: string;
		constructor(...segments: Array<{ uri?: string } | string>) {
			this.uri = segments
				.map((s) => (typeof s === "string" ? s : (s.uri ?? "")))
				.filter(Boolean)
				.join("/");
		}
		create(options?: { intermediates?: boolean; idempotent?: boolean }) {
			directoryCreateSpy(this.uri, options);
		}
	}
	class MockFile {
		uri: string;
		constructor(...segments: Array<{ uri?: string } | string>) {
			this.uri = segments
				.map((s) => (typeof s === "string" ? s : (s.uri ?? "")))
				.filter(Boolean)
				.join("/");
		}
		move(destination: { uri: string }) {
			fileMoveSpy(this.uri, destination.uri);
			this.uri = destination.uri;
		}
	}
	return {
		File: MockFile,
		Directory: MockDirectory,
		Paths: {
			cache: { uri: "file:///cache" },
			document: { uri: "file:///doc" },
		},
		// Helpers exposed so tests can assert behavior. Jest accepts extra exports.
		__directoryCreateSpy: directoryCreateSpy,
		__fileMoveSpy: fileMoveSpy,
	};
});

jest.mock("expo-image-manipulator", () => ({
	manipulateAsync: jest.fn(),
	SaveFormat: { WEBP: "webp", PNG: "png", JPEG: "jpeg" },
}));

const { manipulateAsync } = jest.requireMock("expo-image-manipulator") as {
	manipulateAsync: jest.Mock;
};
const { __directoryCreateSpy: directoryCreateSpy, __fileMoveSpy: fileMoveSpy } =
	jest.requireMock("expo-file-system") as {
		__directoryCreateSpy: jest.Mock;
		__fileMoveSpy: jest.Mock;
	};

beforeEach(() => {
	manipulateAsync.mockReset();
	directoryCreateSpy.mockReset();
	fileMoveSpy.mockReset();
});

describe("wardrobeImages", () => {
	describe("encodeMaster", () => {
		it("calls manipulateAsync with WebP q=0.9 + no resize actions and parks result at tmp/<uuid>.webp", async () => {
			manipulateAsync.mockResolvedValueOnce({
				uri: "file:///cache/ExponentImageManipulator-random.webp",
				width: 1920,
				height: 2560,
			});

			const uri = await encodeMaster("file:///tmp/cutout.png", "abc-123");

			expect(manipulateAsync).toHaveBeenCalledWith(
				"file:///tmp/cutout.png",
				[],
				{ compress: 0.9, format: "webp" },
			);
			expect(directoryCreateSpy).toHaveBeenCalledWith(
				"file:///cache/wardrobe-tmp",
				{ intermediates: true, idempotent: true },
			);
			expect(fileMoveSpy).toHaveBeenCalledWith(
				"file:///cache/ExponentImageManipulator-random.webp",
				"file:///cache/wardrobe-tmp/abc-123.webp",
			);
			expect(uri).toMatch(/\/wardrobe-tmp\/abc-123\.webp$/);
		});

		it("re-throws manipulateAsync failures as WardrobePersistenceError kind=encode carrying the original message", async () => {
			manipulateAsync.mockRejectedValueOnce(
				new Error("libjpeg-turbo: out of memory"),
			);

			const caught = await encodeMaster(
				"file:///tmp/cutout.png",
				"abc-123",
			).catch((e) => e);
			expect(caught).toBeInstanceOf(WardrobePersistenceError);
			expect(caught.kind).toBe("encode");
			expect(caught.message).toBe("libjpeg-turbo: out of memory");
		});

		it("re-throws non-Error rejections as WardrobePersistenceError kind=encode", async () => {
			manipulateAsync.mockRejectedValueOnce("string-thrown-reason");

			const caught = await encodeMaster("", "abc-123").catch((e) => e);
			expect(caught).toBeInstanceOf(WardrobePersistenceError);
			expect(caught.kind).toBe("encode");
			expect(caught.message).toBe("string-thrown-reason");
		});
	});

	describe("encodeThumbnail", () => {
		it("calls manipulateAsync with WebP q=0.75 + resize 300x360 and parks result at tmp/<uuid>-thumb.webp", async () => {
			manipulateAsync.mockResolvedValueOnce({
				uri: "file:///cache/ExponentImageManipulator-thumb.webp",
				width: 300,
				height: 360,
			});

			const uri = await encodeThumbnail(
				"file:///tmp/cutout.png",
				"deadbeef-cafe",
			);

			expect(manipulateAsync).toHaveBeenCalledWith(
				"file:///tmp/cutout.png",
				[{ resize: { width: 300, height: 360 } }],
				{ compress: 0.75, format: "webp" },
			);
			expect(fileMoveSpy).toHaveBeenCalledWith(
				"file:///cache/ExponentImageManipulator-thumb.webp",
				"file:///cache/wardrobe-tmp/deadbeef-cafe-thumb.webp",
			);
			expect(uri).toMatch(/-thumb\.webp$/);
		});

		it("rejects with kind=encode when the subsequent park-move throws (covers disk-full-at-tmp)", async () => {
			manipulateAsync.mockResolvedValueOnce({
				uri: "file:///cache/ExponentImageManipulator-thumb.webp",
				width: 300,
				height: 360,
			});
			fileMoveSpy.mockImplementationOnce(() => {
				throw new Error("not enough space on device");
			});

			const caught = await encodeThumbnail(
				"file:///tmp/cutout.png",
				"uuid-1",
			).catch((e) => e);
			expect(caught).toBeInstanceOf(WardrobePersistenceError);
			expect(caught.kind).toBe("encode");
			expect(caught.message).toBe("not enough space on device");
		});
	});
});
