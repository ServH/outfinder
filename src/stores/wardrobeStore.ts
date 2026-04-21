import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { CombinationAssignment, WardrobeItem } from "@/lib/wardrobeTypes";

const ITEMS_KEY = "@wardrobe:items";
const ASSIGNMENTS_KEY = "@wardrobe:assignments";

interface WardrobeStoreState {
	items: WardrobeItem[];
	assignments: CombinationAssignment[];
	hydrated: boolean;
	setItems: (next: WardrobeItem[]) => void;
	setAssignments: (next: CombinationAssignment[]) => void;
}

/**
 * Parse-time guard. `category` is intentionally OPTIONAL here (Epic-14 Story
 * 14.1, TD-7): legacy Epic-13 items persisted before the field existed lack
 * the key and must survive hydration. A foreign `category` value (anything
 * other than undefined or one of the four enum strings) still fails the guard
 * and falls through to the corrupt-payload path — backfill is only for
 * MISSING keys, not invalid values (preserves Story 13.1 F1 semantics).
 */
function isWardrobeItem(value: unknown): value is WardrobeItem {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	const c = v.category;
	const categoryValid =
		c === undefined ||
		c === "top" ||
		c === "bottom" ||
		c === "footwear" ||
		c === "accessory";
	return (
		typeof v.id === "string" &&
		typeof v.localImagePath === "string" &&
		typeof v.thumbnailPath === "string" &&
		typeof v.createdAt === "number" &&
		categoryValid
	);
}

/**
 * Backfills `category: "top"` onto any parsed item missing the field (TD-7).
 * Returns the normalized array and the count of touched records so the
 * hydration site can emit a single summary warn instead of per-record spam.
 * The next `setItems(...)` write will persist the normalized shape, so the
 * default "sticks" on first write without requiring an explicit migration.
 */
function normalizeItems(parsed: WardrobeItem[]): {
	items: WardrobeItem[];
	backfilledCount: number;
} {
	let backfilledCount = 0;
	const items = parsed.map((item) => {
		if ((item as { category?: unknown }).category === undefined) {
			backfilledCount += 1;
			return { ...item, category: "top" as const };
		}
		return item;
	});
	return { items, backfilledCount };
}

function isCombinationAssignment(
	value: unknown,
): value is CombinationAssignment {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return (
		typeof v.combinationId === "string" &&
		typeof v.colorIndex === "number" &&
		typeof v.wardrobeItemId === "string" &&
		typeof v.assignedAt === "number"
	);
}

function parseItems(raw: string | null): WardrobeItem[] {
	if (raw === null) return [];
	const parsed: unknown = JSON.parse(raw);
	if (!Array.isArray(parsed) || !parsed.every(isWardrobeItem)) {
		throw new Error("Corrupt @wardrobe:items payload");
	}
	return parsed;
}

function parseAssignments(raw: string | null): CombinationAssignment[] {
	if (raw === null) return [];
	const parsed: unknown = JSON.parse(raw);
	if (!Array.isArray(parsed) || !parsed.every(isCombinationAssignment)) {
		throw new Error("Corrupt @wardrobe:assignments payload");
	}
	return parsed;
}

function persist(key: string, value: unknown): void {
	AsyncStorage.setItem(key, JSON.stringify(value)).catch((error) => {
		if (__DEV__) {
			console.warn(`wardrobeStore: failed to persist ${key}`, error);
		}
	});
}

/**
 * Reactive store for the Armario Virtual feature. State is split across two
 * AsyncStorage keys (`@wardrobe:items`, `@wardrobe:assignments`) to keep
 * writes scoped and to avoid losing the items list if the assignments blob
 * gets corrupted. Hydration runs once on first import (lazy, no provider).
 *
 * Components should read via selectors (`useWardrobeStore((s) => s.items)`)
 * and mutate via the `wardrobeRepo` facade — never call `setItems`/
 * `setAssignments` directly from UI code.
 */
export const useWardrobeStore = create<WardrobeStoreState>((set) => ({
	items: [],
	assignments: [],
	hydrated: false,
	setItems: (next) => {
		set({ items: next });
		persist(ITEMS_KEY, next);
	},
	setAssignments: (next) => {
		set({ assignments: next });
		persist(ASSIGNMENTS_KEY, next);
	},
}));

/**
 * Hydrates the store from AsyncStorage. Called automatically on module load;
 * exported for tests to re-trigger after resetting state. Failures fall back
 * to empty arrays (per AC #7) — no user-facing error.
 */
export async function hydrateWardrobeStore(): Promise<void> {
	try {
		const entries = await AsyncStorage.multiGet([ITEMS_KEY, ASSIGNMENTS_KEY]);
		const rawItems = entries.find(([k]) => k === ITEMS_KEY)?.[1] ?? null;
		const rawAssignments =
			entries.find(([k]) => k === ASSIGNMENTS_KEY)?.[1] ?? null;

		let items: WardrobeItem[] = [];
		let assignments: CombinationAssignment[] = [];

		try {
			const parsed = parseItems(rawItems);
			const normalized = normalizeItems(parsed);
			items = normalized.items;
			if (__DEV__ && normalized.backfilledCount > 0) {
				console.warn(
					`wardrobeStore: backfilled category='top' on ${normalized.backfilledCount} legacy item(s) per TD-7`,
				);
			}
		} catch (error) {
			if (__DEV__) {
				console.warn("wardrobeStore: items parse failed, falling back", error);
			}
		}

		try {
			assignments = parseAssignments(rawAssignments);
		} catch (error) {
			if (__DEV__) {
				console.warn(
					"wardrobeStore: assignments parse failed, falling back",
					error,
				);
			}
		}

		useWardrobeStore.setState({ items, assignments, hydrated: true });
	} catch (error) {
		if (__DEV__) {
			console.warn("wardrobeStore: hydration failed, using empty state", error);
		}
		useWardrobeStore.setState({ items: [], assignments: [], hydrated: true });
	}
}

// Kick off hydration on first import. Tests can reset state via setState and
// re-await `hydrateWardrobeStore()` to exercise the read path explicitly.
hydrateWardrobeStore();
