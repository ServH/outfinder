import type { WardrobeItem } from "@/lib/wardrobeTypes";
import { saveCutoutAsWardrobeItem } from "./saveCutoutAsWardrobeItem";
import { WardrobePersistenceError } from "./wardrobeErrors";

jest.mock("@/lib/wardrobeRepo", () => ({
	getItems: jest.fn(),
}));

const { getItems } = jest.requireMock("@/lib/wardrobeRepo") as {
	getItems: jest.Mock<WardrobeItem[], []>;
};

function makeItem(id: number): WardrobeItem {
	return {
		id: `item-${id}`,
		localImagePath: `file:///item-${id}.png`,
		thumbnailPath: `file:///item-${id}-thumb.png`,
		createdAt: Date.now() - id,
	};
}

describe("saveCutoutAsWardrobeItem", () => {
	beforeEach(() => {
		getItems.mockReset();
	});

	it("premium caller with 11 existing items resolves with stub id", async () => {
		getItems.mockReturnValue(
			Array.from({ length: 11 }, (_, i) => makeItem(i + 1)),
		);
		const result = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///cutout.png",
			sourceUri: "file:///source.jpg",
			isPremium: true,
		});
		expect(result).toEqual({ id: "__stub__" });
	});

	it("free caller with 9 existing items resolves under the limit", async () => {
		getItems.mockReturnValue(
			Array.from({ length: 9 }, (_, i) => makeItem(i + 1)),
		);
		const result = await saveCutoutAsWardrobeItem({
			cutoutUri: "file:///cutout.png",
			sourceUri: "file:///source.jpg",
			isPremium: false,
		});
		expect(result).toEqual({ id: "__stub__" });
	});

	it("free caller at the limit rejects with WardrobePersistenceError paywall kind", async () => {
		getItems.mockReturnValue(
			Array.from({ length: 10 }, (_, i) => makeItem(i + 1)),
		);
		let thrown: unknown;
		try {
			await saveCutoutAsWardrobeItem({
				cutoutUri: "file:///cutout.png",
				sourceUri: "file:///source.jpg",
				isPremium: false,
			});
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toBeInstanceOf(Error);
		expect(thrown).toBeInstanceOf(WardrobePersistenceError);
		expect((thrown as WardrobePersistenceError).kind).toBe("paywall");
	});

	it("paywall gate fires regardless of hydration source (guards hydration-race caveat)", async () => {
		// Simulates a pre-populated store (items seeded via `setItems` rather than
		// hydrated from AsyncStorage). The stub must block on count alone — it
		// does NOT inspect the `hydrated` flag, which is Story 13.3b's job.
		getItems.mockReturnValue(
			Array.from({ length: 10 }, (_, i) => makeItem(i + 1)),
		);
		await expect(
			saveCutoutAsWardrobeItem({
				cutoutUri: "file:///cutout.png",
				sourceUri: "file:///source.jpg",
				isPremium: false,
			}),
		).rejects.toBeInstanceOf(WardrobePersistenceError);
	});
});
