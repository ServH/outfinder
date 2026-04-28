import AsyncStorage from "@react-native-async-storage/async-storage";
import { IDEMPOTENCY_KEY, runMisLooksMigration } from "./misLooksMigration";
import { ASSIGNMENTS_KEY, FAVORITES_KEY, ITEMS_KEY } from "./misLooksStore";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const LEGACY_FAVORITES = "@outfinder/favorites";
const LEGACY_ITEMS = "@wardrobe:items";
const LEGACY_ASSIGNMENTS = "@wardrobe:assignments";

// p001 / p002 / p003 are real combination ids in the bundled Wada dataset.
const REAL_COMBO_ID = "p001";
const ANOTHER_REAL_COMBO_ID = "p002";
const THIRD_REAL_COMBO_ID = "p003";
const ORPHAN_COMBO_ID = "combo-nonexistent-xyz";

function legacyItem(id: string, withCategory = true) {
	const base = {
		id,
		localImagePath: `file:///items/${id}.png`,
		thumbnailPath: `file:///items/${id}.thumb.png`,
		createdAt: 1_700_000_000_000,
	};
	return withCategory ? { ...base, category: "top" as const } : base;
}

function legacyAssignment(
	combinationId: string,
	colorIndex: number,
	itemId: string,
) {
	return {
		combinationId,
		colorIndex,
		wardrobeItemId: itemId,
		assignedAt: 1_700_000_000_000,
	};
}

beforeEach(async () => {
	await AsyncStorage.clear();
});

describe("runMisLooksMigration — idempotency", () => {
	it("short-circuits when the flag is already set (no legacy multiGet fires)", async () => {
		await AsyncStorage.setItem(IDEMPOTENCY_KEY, "complete");
		const multiGetSpy = jest.spyOn(AsyncStorage, "multiGet");

		const result = await runMisLooksMigration();

		expect(result).toEqual({ status: "already-complete" });
		// Flag short-circuit runs before the legacy multiGet — the batch read
		// never fires when the flag is set.
		// The flag read uses getItem (which the mock routes through multiGet internally),
		// so we assert multiGet was NOT called with the legacy batch — the flag short-
		// circuit prevents the legacy data read, which is the AC #3 safety property.
		expect(multiGetSpy).not.toHaveBeenCalledWith(
			expect.arrayContaining([LEGACY_FAVORITES]),
		);
	});

	it("runs when the flag is absent", async () => {
		const multiGetSpy = jest.spyOn(AsyncStorage, "multiGet");

		await runMisLooksMigration();

		expect(multiGetSpy).toHaveBeenCalledWith([
			LEGACY_FAVORITES,
			LEGACY_ITEMS,
			LEGACY_ASSIGNMENTS,
		]);
	});
});

describe("runMisLooksMigration — happy path", () => {
	it.each([
		{ n: 0, expected: [] },
		{
			n: 3,
			expected: [REAL_COMBO_ID, ANOTHER_REAL_COMBO_ID, THIRD_REAL_COMBO_ID],
		},
		{
			n: 5,
			expected: [
				REAL_COMBO_ID,
				ANOTHER_REAL_COMBO_ID,
				THIRD_REAL_COMBO_ID,
				"p004",
				"p005",
			],
		},
	])("migrates N=$n favorites into the new namespace and sets the flag", async ({
		expected,
	}) => {
		await AsyncStorage.setItem(LEGACY_FAVORITES, JSON.stringify(expected));
		await AsyncStorage.setItem(
			LEGACY_ITEMS,
			JSON.stringify([legacyItem("uuid-1")]),
		);
		await AsyncStorage.setItem(
			LEGACY_ASSIGNMENTS,
			JSON.stringify([legacyAssignment(REAL_COMBO_ID, 0, "uuid-1")]),
		);

		const result = await runMisLooksMigration();

		expect(result.status).toBe("completed");
		if (result.status === "completed") {
			expect(result.migratedCounts.favorites).toBe(expected.length);
			expect(result.migratedCounts.orphansDropped).toBe(0);
		}

		expect(await AsyncStorage.getItem(FAVORITES_KEY)).toBe(
			JSON.stringify(expected),
		);
		expect(await AsyncStorage.getItem(ITEMS_KEY)).toBe(
			JSON.stringify([legacyItem("uuid-1")]),
		);
		expect(await AsyncStorage.getItem(ASSIGNMENTS_KEY)).toBe(
			JSON.stringify([legacyAssignment(REAL_COMBO_ID, 0, "uuid-1")]),
		);
		expect(await AsyncStorage.getItem(IDEMPOTENCY_KEY)).toBe("complete");

		// Legacy keys cleared after flag set (phase 6).
		expect(await AsyncStorage.getItem(LEGACY_FAVORITES)).toBeNull();
		expect(await AsyncStorage.getItem(LEGACY_ITEMS)).toBeNull();
		expect(await AsyncStorage.getItem(LEGACY_ASSIGNMENTS)).toBeNull();
	});

	it("fresh install (all legacy keys null) writes empty '[]' to each destination + sets flag", async () => {
		const result = await runMisLooksMigration();

		expect(result.status).toBe("completed");
		expect(await AsyncStorage.getItem(ITEMS_KEY)).toBe("[]");
		expect(await AsyncStorage.getItem(ASSIGNMENTS_KEY)).toBe("[]");
		expect(await AsyncStorage.getItem(FAVORITES_KEY)).toBe("[]");
		expect(await AsyncStorage.getItem(IDEMPOTENCY_KEY)).toBe("complete");
	});
});

describe("runMisLooksMigration — orphan-drop", () => {
	it("drops favorites whose combinationId is no longer in the Wada dataset", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(
			LEGACY_FAVORITES,
			JSON.stringify([REAL_COMBO_ID, ORPHAN_COMBO_ID, ANOTHER_REAL_COMBO_ID]),
		);

		const result = await runMisLooksMigration();

		expect(result.status).toBe("completed");
		if (result.status === "completed") {
			expect(result.migratedCounts.favorites).toBe(2);
			expect(result.migratedCounts.orphansDropped).toBe(1);
		}
		expect(await AsyncStorage.getItem(FAVORITES_KEY)).toBe(
			JSON.stringify([REAL_COMBO_ID, ANOTHER_REAL_COMBO_ID]),
		);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining(
				`dropped orphan favorite combinationId="${ORPHAN_COMBO_ID}"`,
			),
		);

		warn.mockRestore();
	});
});

describe("runMisLooksMigration — crash recovery", () => {
	it("aborts with legacy source intact + flag absent when multiSet rejects", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(
			LEGACY_FAVORITES,
			JSON.stringify([REAL_COMBO_ID]),
		);
		await AsyncStorage.setItem(
			LEGACY_ITEMS,
			JSON.stringify([legacyItem("uuid-1")]),
		);
		await AsyncStorage.setItem(
			LEGACY_ASSIGNMENTS,
			JSON.stringify([legacyAssignment(REAL_COMBO_ID, 0, "uuid-1")]),
		);

		// Inject a one-shot rejection via the existing jest.fn() mock rather
		// than jest.spyOn — spyOn wraps the pre-existing jest.fn and that
		// wrapper's mockRestore has proved flaky under the async-storage mock
		// (the restore drops the internal storage handler, zeroing subsequent
		// multiSet calls).
		(AsyncStorage.multiSet as jest.Mock).mockImplementationOnce(() =>
			Promise.reject(new Error("disk full")),
		);

		const result = await runMisLooksMigration();

		expect(result.status).toBe("aborted");
		expect(await AsyncStorage.getItem(LEGACY_FAVORITES)).toBe(
			JSON.stringify([REAL_COMBO_ID]),
		);
		expect(await AsyncStorage.getItem(LEGACY_ITEMS)).toBe(
			JSON.stringify([legacyItem("uuid-1")]),
		);
		expect(await AsyncStorage.getItem(LEGACY_ASSIGNMENTS)).toBe(
			JSON.stringify([legacyAssignment(REAL_COMBO_ID, 0, "uuid-1")]),
		);
		expect(await AsyncStorage.getItem(IDEMPOTENCY_KEY)).toBeNull();
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("aborted mid-sequence, legacy source preserved"),
			expect.any(Error),
		);

		warn.mockRestore();
	});

	it("a subsequent re-run succeeds once the underlying failure clears", async () => {
		await AsyncStorage.setItem(
			LEGACY_FAVORITES,
			JSON.stringify([REAL_COMBO_ID]),
		);

		(AsyncStorage.multiSet as jest.Mock).mockImplementationOnce(() =>
			Promise.reject(new Error("disk full")),
		);

		const first = await runMisLooksMigration();
		expect(first.status).toBe("aborted");

		const second = await runMisLooksMigration();
		expect(second.status).toBe("completed");
		expect(await AsyncStorage.getItem(FAVORITES_KEY)).toBe(
			JSON.stringify([REAL_COMBO_ID]),
		);
		expect(await AsyncStorage.getItem(IDEMPOTENCY_KEY)).toBe("complete");
	});
});

describe("runMisLooksMigration — double-run idempotency", () => {
	it("second run after manual flag clear collapses destination to '[]' (legacy already cleared by first run)", async () => {
		await AsyncStorage.setItem(
			LEGACY_FAVORITES,
			JSON.stringify([REAL_COMBO_ID, ANOTHER_REAL_COMBO_ID]),
		);
		await AsyncStorage.setItem(
			LEGACY_ITEMS,
			JSON.stringify([legacyItem("uuid-a"), legacyItem("uuid-b")]),
		);

		await runMisLooksMigration();
		const firstFavs = await AsyncStorage.getItem(FAVORITES_KEY);
		const firstItems = await AsyncStorage.getItem(ITEMS_KEY);

		// Simulate the dev-menu "re-run migration" flow.
		await AsyncStorage.removeItem(IDEMPOTENCY_KEY);
		await runMisLooksMigration();

		const secondFavs = await AsyncStorage.getItem(FAVORITES_KEY);
		const secondItems = await AsyncStorage.getItem(ITEMS_KEY);

		// Second run found legacy keys cleared, so destination collapses to
		// the empty state — still byte-deterministic and non-crashing.
		expect(secondFavs).toBe("[]");
		expect(secondItems).toBe("[]");
		expect(await AsyncStorage.getItem(IDEMPOTENCY_KEY)).toBe("complete");

		// First run captured the real data — sanity-assert the test setup is
		// non-trivial (serialized arrays differ before/after re-run).
		expect(firstFavs).not.toBe(secondFavs);
		expect(firstItems).not.toBe(secondItems);
	});
});

describe("runMisLooksMigration — corrupt legacy payloads (AC #11)", () => {
	it("corrupt legacy favorites do not abort migration — items + assignments migrate normally", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(LEGACY_FAVORITES, "not-json-garbage{{{");
		await AsyncStorage.setItem(
			LEGACY_ITEMS,
			JSON.stringify([legacyItem("uuid-1")]),
		);
		await AsyncStorage.setItem(
			LEGACY_ASSIGNMENTS,
			JSON.stringify([legacyAssignment(REAL_COMBO_ID, 0, "uuid-1")]),
		);

		const result = await runMisLooksMigration();

		expect(result.status).toBe("completed");
		expect(await AsyncStorage.getItem(FAVORITES_KEY)).toBe("[]");
		expect(await AsyncStorage.getItem(ITEMS_KEY)).toBe(
			JSON.stringify([legacyItem("uuid-1")]),
		);
		expect(await AsyncStorage.getItem(ASSIGNMENTS_KEY)).toBe(
			JSON.stringify([legacyAssignment(REAL_COMBO_ID, 0, "uuid-1")]),
		);
		expect(await AsyncStorage.getItem(IDEMPOTENCY_KEY)).toBe("complete");
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("legacy favorites payload corrupt"),
		);

		warn.mockRestore();
	});

	it("numeric-id legacy favorites ('[1,2,3]') fall through to empty + warn", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(LEGACY_FAVORITES, JSON.stringify([1, 2, 3]));

		const result = await runMisLooksMigration();

		expect(result.status).toBe("completed");
		expect(await AsyncStorage.getItem(FAVORITES_KEY)).toBe("[]");
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("legacy favorites payload corrupt"),
		);

		warn.mockRestore();
	});

	it("object-instead-of-array legacy favorites ('{}') fall through to empty + warn", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation();
		await AsyncStorage.setItem(LEGACY_FAVORITES, "{}");

		const result = await runMisLooksMigration();

		expect(result.status).toBe("completed");
		expect(await AsyncStorage.getItem(FAVORITES_KEY)).toBe("[]");
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("legacy favorites payload corrupt"),
		);

		warn.mockRestore();
	});
});

describe("runMisLooksMigration — TD-7 backfill", () => {
	it("migrates a legacy item without `category` with category='top' backfilled (reuses normalizeItems)", async () => {
		await AsyncStorage.setItem(
			LEGACY_ITEMS,
			JSON.stringify([legacyItem("uuid-legacy", false)]),
		);

		const result = await runMisLooksMigration();

		expect(result.status).toBe("completed");
		const writtenItems = await AsyncStorage.getItem(ITEMS_KEY);
		expect(writtenItems).toBeTruthy();
		const parsed = JSON.parse(writtenItems as string);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].id).toBe("uuid-legacy");
		expect(parsed[0].category).toBe("top");
	});
});
