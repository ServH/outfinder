import type { WardrobeItem } from "@/lib/wardrobeTypes";
import { WardrobePersistenceError } from "./wardrobeErrors";
import {
	ensureWardrobeDirectories,
	moveToWardrobe,
	ORPHAN_GRACE_MS,
	ORPHAN_SWEEP_TTL_MS,
	rollbackWardrobeFiles,
	runOrphanSweep,
} from "./wardrobeFiles";

jest.mock("expo-file-system", () => {
	const directoryCreateSpy = jest.fn();
	const directoryListImpl: jest.Mock<unknown[], [string]> = jest.fn(
		(_dirUri: string) => [],
	);
	const fileMoveSpy = jest.fn();
	const fileDeleteSpy = jest.fn();

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
		list() {
			return directoryListImpl(this.uri);
		}
	}
	class MockFile {
		uri: string;
		modificationTime: number | null = null;
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
		delete() {
			fileDeleteSpy(this.uri);
		}
	}
	return {
		File: MockFile,
		Directory: MockDirectory,
		Paths: {
			cache: { uri: "file:///cache" },
			document: { uri: "file:///doc" },
		},
		__directoryCreateSpy: directoryCreateSpy,
		__directoryListImpl: directoryListImpl,
		__fileMoveSpy: fileMoveSpy,
		__fileDeleteSpy: fileDeleteSpy,
		__MockFile: MockFile,
	};
});

jest.mock("@react-native-async-storage/async-storage", () => ({
	getItem: jest.fn(),
	setItem: jest.fn(),
}));

const {
	__directoryCreateSpy: directoryCreateSpy,
	__directoryListImpl: directoryListImpl,
	__fileMoveSpy: fileMoveSpy,
	__fileDeleteSpy: fileDeleteSpy,
	__MockFile: MockFile,
} = jest.requireMock("expo-file-system") as {
	__directoryCreateSpy: jest.Mock;
	__directoryListImpl: jest.Mock;
	__fileMoveSpy: jest.Mock;
	__fileDeleteSpy: jest.Mock;
	__MockFile: new (
		...args: Array<{ uri?: string } | string>
	) => { uri: string; modificationTime: number | null; delete: jest.Mock };
};

const AsyncStorage = jest.requireMock(
	"@react-native-async-storage/async-storage",
) as { getItem: jest.Mock; setItem: jest.Mock };

function fileEntry(uri: string, modificationTime: number | null) {
	const instance = new MockFile(uri);
	instance.modificationTime = modificationTime;
	return instance;
}

function itemWithUuid(uuid: string): WardrobeItem {
	return {
		id: `repo-id-${uuid}`,
		localImagePath: `file:///doc/wardrobe/${uuid}.webp`,
		thumbnailPath: `file:///cache/wardrobe-thumbs/${uuid}.webp`,
		category: "top",
		createdAt: 0,
	};
}

beforeEach(() => {
	directoryCreateSpy.mockReset();
	directoryListImpl.mockReset();
	directoryListImpl.mockImplementation(() => []);
	fileMoveSpy.mockReset();
	fileDeleteSpy.mockReset();
	AsyncStorage.getItem.mockReset();
	AsyncStorage.setItem.mockReset();
	AsyncStorage.getItem.mockResolvedValue(null);
	AsyncStorage.setItem.mockResolvedValue(undefined);
});

describe("wardrobeFiles", () => {
	describe("ensureWardrobeDirectories", () => {
		it("creates /wardrobe/ and /wardrobe-thumbs/ with intermediates+idempotent", () => {
			ensureWardrobeDirectories();
			expect(directoryCreateSpy).toHaveBeenCalledWith("file:///doc/wardrobe", {
				intermediates: true,
				idempotent: true,
			});
			expect(directoryCreateSpy).toHaveBeenCalledWith(
				"file:///cache/wardrobe-thumbs",
				{ intermediates: true, idempotent: true },
			);
		});
	});

	describe("moveToWardrobe", () => {
		it("moves both files to correct destinations and resolves with canonical paths", async () => {
			const result = await moveToWardrobe({
				tmpMasterUri: "file:///cache/wardrobe-tmp/u1.webp",
				tmpThumbUri: "file:///cache/wardrobe-tmp/u1-thumb.webp",
				uuid: "u1",
			});
			expect(fileMoveSpy).toHaveBeenNthCalledWith(
				1,
				"file:///cache/wardrobe-tmp/u1.webp",
				"file:///doc/wardrobe/u1.webp",
			);
			expect(fileMoveSpy).toHaveBeenNthCalledWith(
				2,
				"file:///cache/wardrobe-tmp/u1-thumb.webp",
				"file:///cache/wardrobe-thumbs/u1.webp",
			);
			expect(result).toEqual({
				localImagePath: "file:///doc/wardrobe/u1.webp",
				thumbnailPath: "file:///cache/wardrobe-thumbs/u1.webp",
			});
		});

		it("master move throwing 'not enough space' → WardrobePersistenceError kind=diskFull", async () => {
			fileMoveSpy.mockImplementationOnce(() => {
				throw new Error("not enough space on device");
			});
			const caught = await moveToWardrobe({
				tmpMasterUri: "file:///cache/wardrobe-tmp/u1.webp",
				tmpThumbUri: "file:///cache/wardrobe-tmp/u1-thumb.webp",
				uuid: "u1",
			}).catch((e) => e);
			expect(caught).toBeInstanceOf(WardrobePersistenceError);
			expect(caught.kind).toBe("diskFull");
		});

		it("thumb move throwing permission message → kind=diskFull", async () => {
			fileMoveSpy
				.mockImplementationOnce(() => {
					/* master OK */
				})
				.mockImplementationOnce(() => {
					throw new Error("Operation not permitted");
				});
			const caught = await moveToWardrobe({
				tmpMasterUri: "file:///cache/wardrobe-tmp/u1.webp",
				tmpThumbUri: "file:///cache/wardrobe-tmp/u1-thumb.webp",
				uuid: "u1",
			}).catch((e) => e);
			expect(caught).toBeInstanceOf(WardrobePersistenceError);
			expect(caught.kind).toBe("diskFull");
		});

		it("master move with a generic message → kind=move", async () => {
			fileMoveSpy.mockImplementationOnce(() => {
				throw new Error("random filesystem hiccup");
			});
			const caught = await moveToWardrobe({
				tmpMasterUri: "file:///cache/wardrobe-tmp/u1.webp",
				tmpThumbUri: "file:///cache/wardrobe-tmp/u1-thumb.webp",
				uuid: "u1",
			}).catch((e) => e);
			expect(caught).toBeInstanceOf(WardrobePersistenceError);
			expect(caught.kind).toBe("move");
		});
	});

	describe("rollbackWardrobeFiles", () => {
		it("deletes all 4 candidate paths and survives a per-file delete throw", () => {
			fileDeleteSpy.mockImplementationOnce(() => {
				throw new Error("missing tmp master (rollback is fine)");
			});
			const warnSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => undefined);
			rollbackWardrobeFiles("u1");
			warnSpy.mockRestore();
			expect(fileDeleteSpy).toHaveBeenCalledTimes(4);
			const deletedUris = fileDeleteSpy.mock.calls.map((c) => c[0]);
			expect(deletedUris).toEqual(
				expect.arrayContaining([
					"file:///cache/wardrobe-tmp/u1.webp",
					"file:///cache/wardrobe-tmp/u1-thumb.webp",
					"file:///doc/wardrobe/u1.webp",
					"file:///cache/wardrobe-thumbs/u1.webp",
				]),
			);
		});
	});

	describe("runOrphanSweep", () => {
		it("happy path: 3 items + 4 files → 1 orphan deleted + last_sweep_at written", async () => {
			AsyncStorage.getItem.mockResolvedValue(null);
			const now = 10_000_000;
			jest.spyOn(Date, "now").mockReturnValue(now);

			directoryListImpl.mockImplementation((dirUri: string) => {
				if (dirUri === "file:///doc/wardrobe") {
					return [
						fileEntry(
							"file:///doc/wardrobe/u1.webp",
							now - ORPHAN_GRACE_MS - 1,
						),
						fileEntry(
							"file:///doc/wardrobe/u2.webp",
							now - ORPHAN_GRACE_MS - 1,
						),
						fileEntry(
							"file:///doc/wardrobe/orphan.webp",
							now - ORPHAN_GRACE_MS - 1,
						),
					];
				}
				if (dirUri === "file:///cache/wardrobe-thumbs") {
					return [
						fileEntry(
							"file:///cache/wardrobe-thumbs/u1.webp",
							now - ORPHAN_GRACE_MS - 1,
						),
					];
				}
				return [];
			});

			await runOrphanSweep({
				items: [itemWithUuid("u1"), itemWithUuid("u2"), itemWithUuid("u3")],
			});

			expect(fileDeleteSpy).toHaveBeenCalledTimes(1);
			expect(fileDeleteSpy).toHaveBeenCalledWith(
				"file:///doc/wardrobe/orphan.webp",
			);
			expect(AsyncStorage.setItem).toHaveBeenCalledWith(
				"@wardrobe:last_sweep_at",
				now.toString(),
			);
			(Date.now as jest.Mock).mockRestore();
		});

		it("skips when last_sweep_at is less than TTL ago", async () => {
			const now = 10_000_000;
			jest.spyOn(Date, "now").mockReturnValue(now);
			AsyncStorage.getItem.mockResolvedValue(
				(now - ORPHAN_SWEEP_TTL_MS + 1).toString(),
			);

			await runOrphanSweep({ items: [] });

			expect(directoryListImpl).not.toHaveBeenCalled();
			expect(AsyncStorage.setItem).not.toHaveBeenCalled();
			(Date.now as jest.Mock).mockRestore();
		});

		it("does NOT skip when last_sweep_at is older than TTL", async () => {
			const now = 10_000_000;
			jest.spyOn(Date, "now").mockReturnValue(now);
			AsyncStorage.getItem.mockResolvedValue(
				(now - ORPHAN_SWEEP_TTL_MS - 1).toString(),
			);

			await runOrphanSweep({ items: [] });

			expect(directoryListImpl).toHaveBeenCalled();
			expect(AsyncStorage.setItem).toHaveBeenCalled();
			(Date.now as jest.Mock).mockRestore();
		});

		it("respects 60s grace (fresh file NOT deleted, old file deleted)", async () => {
			const now = 10_000_000;
			jest.spyOn(Date, "now").mockReturnValue(now);
			AsyncStorage.getItem.mockResolvedValue(null);

			directoryListImpl.mockImplementation((dirUri: string) => {
				if (dirUri === "file:///doc/wardrobe") {
					return [
						// Fresh orphan — 30s old, within grace
						fileEntry("file:///doc/wardrobe/fresh.webp", now - 30_000),
						// Old orphan — 120s old, past grace
						fileEntry("file:///doc/wardrobe/stale.webp", now - 120_000),
					];
				}
				return [];
			});

			await runOrphanSweep({ items: [] });

			expect(fileDeleteSpy).toHaveBeenCalledTimes(1);
			expect(fileDeleteSpy).toHaveBeenCalledWith(
				"file:///doc/wardrobe/stale.webp",
			);
			(Date.now as jest.Mock).mockRestore();
		});

		it("listing error logs __DEV__ warn, does NOT update timestamp, resolves without throwing", async () => {
			const now = 10_000_000;
			jest.spyOn(Date, "now").mockReturnValue(now);
			AsyncStorage.getItem.mockResolvedValue(null);
			directoryListImpl.mockImplementation(() => {
				throw new Error("listing blew up");
			});
			const warnSpy = jest
				.spyOn(console, "warn")
				.mockImplementation(() => undefined);

			await expect(runOrphanSweep({ items: [] })).resolves.toBeUndefined();

			expect(AsyncStorage.setItem).not.toHaveBeenCalled();
			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
			(Date.now as jest.Mock).mockRestore();
		});

		it("file with null modificationTime is skipped (conservative — never delete unknown-age files)", async () => {
			const now = 10_000_000;
			jest.spyOn(Date, "now").mockReturnValue(now);
			AsyncStorage.getItem.mockResolvedValue(null);
			directoryListImpl.mockImplementation((dirUri: string) => {
				if (dirUri === "file:///doc/wardrobe") {
					return [fileEntry("file:///doc/wardrobe/ghost.webp", null)];
				}
				return [];
			});

			await runOrphanSweep({ items: [] });

			expect(fileDeleteSpy).not.toHaveBeenCalled();
			expect(AsyncStorage.setItem).toHaveBeenCalled();
			(Date.now as jest.Mock).mockRestore();
		});

		it("exports ORPHAN_SWEEP_TTL_MS=86400000 and ORPHAN_GRACE_MS=60000", () => {
			expect(ORPHAN_SWEEP_TTL_MS).toBe(86_400_000);
			expect(ORPHAN_GRACE_MS).toBe(60_000);
		});

		it("with 0 items + 2 old files → both deleted", async () => {
			const now = 10_000_000;
			jest.spyOn(Date, "now").mockReturnValue(now);
			AsyncStorage.getItem.mockResolvedValue(null);
			directoryListImpl.mockImplementation((dirUri: string) => {
				if (dirUri === "file:///doc/wardrobe") {
					return [fileEntry("file:///doc/wardrobe/a.webp", now - 120_000)];
				}
				if (dirUri === "file:///cache/wardrobe-thumbs") {
					return [
						fileEntry("file:///cache/wardrobe-thumbs/b.webp", now - 120_000),
					];
				}
				return [];
			});

			await runOrphanSweep({ items: [] });

			expect(fileDeleteSpy).toHaveBeenCalledTimes(2);
			(Date.now as jest.Mock).mockRestore();
		});

		it("empty directories → no-op with timestamp updated", async () => {
			AsyncStorage.getItem.mockResolvedValue(null);
			directoryListImpl.mockReturnValue([]);
			await runOrphanSweep({ items: [] });
			expect(fileDeleteSpy).not.toHaveBeenCalled();
			expect(AsyncStorage.setItem).toHaveBeenCalled();
		});
	});
});
