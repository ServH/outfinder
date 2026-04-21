import type { WardrobeItem } from "@/lib/wardrobeTypes";
import { WardrobeLimitExceeded } from "@/lib/wardrobeTypes";
import { saveCutoutAsWardrobeItem } from "./saveCutoutAsWardrobeItem";
import { WardrobePersistenceError } from "./wardrobeErrors";

jest.mock("@/lib/wardrobeRepo", () => ({
	getItems: jest.fn(),
	addItem: jest.fn(),
	removeItem: jest.fn(),
}));

jest.mock("@/stores/wardrobeStore", () => ({
	hydrateWardrobeStore: jest.fn().mockResolvedValue(undefined),
	useWardrobeStore: {
		getState: jest.fn().mockReturnValue({ hydrated: true }),
	},
}));

jest.mock("@/lib/uuid", () => ({
	uuidv4: () => "test-uuid-0001",
}));

jest.mock("./wardrobeImages", () => ({
	encodeMaster: jest.fn(),
	encodeThumbnail: jest.fn(),
}));

jest.mock("./wardrobeFiles", () => ({
	ensureWardrobeDirectories: jest.fn(),
	moveToWardrobe: jest.fn(),
	rollbackWardrobeFiles: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
	File: jest.fn().mockImplementation((uri: string) => ({
		uri,
		delete: jest.fn(),
	})),
}));

const repoMock = jest.requireMock("@/lib/wardrobeRepo") as {
	getItems: jest.Mock<WardrobeItem[], []>;
	addItem: jest.Mock;
	removeItem: jest.Mock;
};
const storeMock = jest.requireMock("@/stores/wardrobeStore") as {
	hydrateWardrobeStore: jest.Mock;
	useWardrobeStore: { getState: jest.Mock };
};
const imagesMock = jest.requireMock("./wardrobeImages") as {
	encodeMaster: jest.Mock;
	encodeThumbnail: jest.Mock;
};
const filesMock = jest.requireMock("./wardrobeFiles") as {
	ensureWardrobeDirectories: jest.Mock;
	moveToWardrobe: jest.Mock;
	rollbackWardrobeFiles: jest.Mock;
};
const fsMock = jest.requireMock("expo-file-system") as {
	File: jest.Mock;
};

function makeItem(id: number): WardrobeItem {
	return {
		id: `item-${id}`,
		localImagePath: `file:///item-${id}.webp`,
		thumbnailPath: `file:///item-${id}-thumb.webp`,
		category: "top",
		createdAt: Date.now() - id,
	};
}

beforeEach(() => {
	repoMock.getItems.mockReset();
	repoMock.addItem.mockReset();
	repoMock.removeItem.mockReset();
	storeMock.hydrateWardrobeStore.mockReset().mockResolvedValue(undefined);
	storeMock.useWardrobeStore.getState.mockReset();
	storeMock.useWardrobeStore.getState.mockReturnValue({ hydrated: true });
	imagesMock.encodeMaster.mockReset();
	imagesMock.encodeThumbnail.mockReset();
	filesMock.ensureWardrobeDirectories.mockReset();
	filesMock.moveToWardrobe.mockReset();
	filesMock.rollbackWardrobeFiles.mockReset();
	fsMock.File.mockReset();
	fsMock.File.mockImplementation((uri: string) => ({
		uri,
		delete: jest.fn(),
	}));
});

describe("saveCutoutAsWardrobeItem", () => {
	it("happy path: encode → move → addItem → delete tmp → returns { id: <repoId> }", async () => {
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockResolvedValue(
			"file:///cache/wardrobe-tmp/test-uuid-0001.webp",
		);
		imagesMock.encodeThumbnail.mockResolvedValue(
			"file:///cache/wardrobe-tmp/test-uuid-0001-thumb.webp",
		);
		filesMock.moveToWardrobe.mockResolvedValue({
			localImagePath: "file:///doc/wardrobe/test-uuid-0001.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/test-uuid-0001.webp",
		});
		const deleteCutoutSpy = jest.fn();
		fsMock.File.mockImplementation((uri: string) => ({
			uri,
			delete: deleteCutoutSpy,
		}));
		repoMock.addItem.mockReturnValue({
			id: "repo-assigned-42",
			localImagePath: "file:///doc/wardrobe/test-uuid-0001.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/test-uuid-0001.webp",
			category: "top",
			createdAt: 0,
		});

		const result = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: false,
			category: "top",
		});

		expect(result).toEqual({ id: "repo-assigned-42" });
		expect(imagesMock.encodeMaster).toHaveBeenCalledWith(
			"file:///tmp/cutout.png",
			"test-uuid-0001",
		);
		expect(imagesMock.encodeThumbnail).toHaveBeenCalledWith(
			"file:///tmp/cutout.png",
			"test-uuid-0001",
		);
		expect(filesMock.moveToWardrobe).toHaveBeenCalledWith({
			tmpMasterUri: "file:///cache/wardrobe-tmp/test-uuid-0001.webp",
			tmpThumbUri: "file:///cache/wardrobe-tmp/test-uuid-0001-thumb.webp",
			uuid: "test-uuid-0001",
		});
		expect(repoMock.addItem).toHaveBeenCalledWith(
			{
				localImagePath: "file:///doc/wardrobe/test-uuid-0001.webp",
				thumbnailPath: "file:///cache/wardrobe-thumbs/test-uuid-0001.webp",
				category: "top",
			},
			false,
		);
		expect(fsMock.File).toHaveBeenCalledWith("file:///tmp/cutout.png");
		expect(deleteCutoutSpy).toHaveBeenCalledTimes(1);
		expect(filesMock.rollbackWardrobeFiles).not.toHaveBeenCalled();
	});

	it("paywall branch: free-tier at FREE_WARDROBE_LIMIT throws BEFORE any I/O", async () => {
		repoMock.getItems.mockReturnValue(
			Array.from({ length: 10 }, (_, i) => makeItem(i)),
		);

		const caught = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: false,
			category: "top",
		}).catch((e) => e);

		expect(caught).toBeInstanceOf(WardrobePersistenceError);
		expect(caught.kind).toBe("paywall");
		expect(imagesMock.encodeMaster).not.toHaveBeenCalled();
		expect(imagesMock.encodeThumbnail).not.toHaveBeenCalled();
		expect(filesMock.moveToWardrobe).not.toHaveBeenCalled();
		expect(repoMock.addItem).not.toHaveBeenCalled();
		expect(filesMock.rollbackWardrobeFiles).not.toHaveBeenCalled();
	});

	it("premium bypass: 10 items + isPremium=true → encode/move/commit all run", async () => {
		repoMock.getItems.mockReturnValue(
			Array.from({ length: 10 }, (_, i) => makeItem(i)),
		);
		imagesMock.encodeMaster.mockResolvedValue("file:///tmp-master");
		imagesMock.encodeThumbnail.mockResolvedValue("file:///tmp-thumb");
		filesMock.moveToWardrobe.mockResolvedValue({
			localImagePath: "file:///doc/wardrobe/test-uuid-0001.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/test-uuid-0001.webp",
		});
		repoMock.addItem.mockReturnValue({
			id: "premium-id",
			localImagePath: "file:///doc/wardrobe/test-uuid-0001.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/test-uuid-0001.webp",
			category: "top",
			createdAt: 0,
		});

		const result = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: true,
			category: "top",
		});

		expect(result).toEqual({ id: "premium-id" });
		expect(repoMock.addItem).toHaveBeenCalledWith(expect.any(Object), true);
	});

	it("encode failure → rollback called + repo not committed + re-throws kind=encode", async () => {
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockRejectedValue(
			new WardrobePersistenceError("encode", "libjpeg boom"),
		);

		const caught = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: false,
			category: "top",
		}).catch((e) => e);

		expect(caught).toBeInstanceOf(WardrobePersistenceError);
		expect(caught.kind).toBe("encode");
		expect(filesMock.rollbackWardrobeFiles).toHaveBeenCalledWith(
			"test-uuid-0001",
		);
		expect(repoMock.addItem).not.toHaveBeenCalled();
		expect(repoMock.removeItem).not.toHaveBeenCalled();
	});

	it("move failure (move kind) → rollback + re-throws kind=move", async () => {
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockResolvedValue("file:///tmp-m");
		imagesMock.encodeThumbnail.mockResolvedValue("file:///tmp-t");
		filesMock.moveToWardrobe.mockRejectedValue(
			new WardrobePersistenceError("move", "random hiccup"),
		);

		const caught = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: false,
			category: "top",
		}).catch((e) => e);

		expect(caught).toBeInstanceOf(WardrobePersistenceError);
		expect(caught.kind).toBe("move");
		expect(filesMock.rollbackWardrobeFiles).toHaveBeenCalledWith(
			"test-uuid-0001",
		);
		expect(repoMock.addItem).not.toHaveBeenCalled();
	});

	it("move failure (diskFull kind) → rollback + re-throws kind=diskFull", async () => {
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockResolvedValue("file:///tmp-m");
		imagesMock.encodeThumbnail.mockResolvedValue("file:///tmp-t");
		filesMock.moveToWardrobe.mockRejectedValue(
			new WardrobePersistenceError("diskFull", "not enough space"),
		);

		const caught = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: false,
			category: "top",
		}).catch((e) => e);

		expect(caught).toBeInstanceOf(WardrobePersistenceError);
		expect(caught.kind).toBe("diskFull");
	});

	it("addItem throws WardrobeLimitExceeded (race) → maps to kind=paywall + rollback called", async () => {
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockResolvedValue("file:///tmp-m");
		imagesMock.encodeThumbnail.mockResolvedValue("file:///tmp-t");
		filesMock.moveToWardrobe.mockResolvedValue({
			localImagePath: "file:///doc/wardrobe/x.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/x.webp",
		});
		repoMock.addItem.mockImplementation(() => {
			throw new WardrobeLimitExceeded();
		});

		const caught = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: false,
			category: "top",
		}).catch((e) => e);

		expect(caught).toBeInstanceOf(WardrobePersistenceError);
		expect(caught.kind).toBe("paywall");
		expect(filesMock.rollbackWardrobeFiles).toHaveBeenCalledWith(
			"test-uuid-0001",
		);
		expect(repoMock.removeItem).not.toHaveBeenCalled();
	});

	it("addItem throws generic Error → rollback + maps to kind=repoAdd", async () => {
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockResolvedValue("file:///tmp-m");
		imagesMock.encodeThumbnail.mockResolvedValue("file:///tmp-t");
		filesMock.moveToWardrobe.mockResolvedValue({
			localImagePath: "file:///doc/wardrobe/x.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/x.webp",
		});
		repoMock.addItem.mockImplementation(() => {
			throw new Error("storage write failed");
		});

		const caught = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: false,
			category: "top",
		}).catch((e) => e);

		expect(caught).toBeInstanceOf(WardrobePersistenceError);
		expect(caught.kind).toBe("repoAdd");
		expect(filesMock.rollbackWardrobeFiles).toHaveBeenCalledWith(
			"test-uuid-0001",
		);
	});

	it("hydration gate: if store.hydrated=false, awaits hydrateWardrobeStore before gate", async () => {
		storeMock.useWardrobeStore.getState.mockReturnValue({ hydrated: false });
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockResolvedValue("file:///tmp-m");
		imagesMock.encodeThumbnail.mockResolvedValue("file:///tmp-t");
		filesMock.moveToWardrobe.mockResolvedValue({
			localImagePath: "file:///doc/wardrobe/x.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/x.webp",
		});
		repoMock.addItem.mockReturnValue({
			id: "post-hydration",
			localImagePath: "",
			thumbnailPath: "",
			category: "top",
			createdAt: 0,
		});

		await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: true,
			category: "top",
		});

		expect(storeMock.hydrateWardrobeStore).toHaveBeenCalledTimes(1);
	});

	// AC #8: forwards the caller's category to addItem verbatim
	it("forwards the caller's category to addItem verbatim", async () => {
		repoMock.getItems.mockReturnValue([]);
		imagesMock.encodeMaster.mockResolvedValue("file:///tmp-m");
		imagesMock.encodeThumbnail.mockResolvedValue("file:///tmp-t");
		filesMock.moveToWardrobe.mockResolvedValue({
			localImagePath: "file:///doc/wardrobe/x.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/x.webp",
		});
		repoMock.addItem.mockReturnValue({
			id: "footwear-id",
			localImagePath: "file:///doc/wardrobe/x.webp",
			thumbnailPath: "file:///cache/wardrobe-thumbs/x.webp",
			category: "footwear",
			createdAt: 0,
		});

		await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///tmp/cutout.png",
			sourceUri: "file:///tmp/source.jpg",
			isPremium: true,
			category: "footwear",
		});

		expect(repoMock.addItem).toHaveBeenCalledWith(
			{
				localImagePath: "file:///doc/wardrobe/x.webp",
				thumbnailPath: "file:///cache/wardrobe-thumbs/x.webp",
				category: "footwear",
			},
			true,
		);
	});
});
