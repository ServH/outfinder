import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type {
	CombinationAssignment,
	WardrobeCategory,
	WardrobeItem,
} from "@/lib/wardrobeTypes";

// @mislooks:* namespace unifies items + assignments + favorites under a single
// store per ADR-005 / TD-3. Legacy keys (@wardrobe:*, @outfinder/favorites)
// are drained by misLooksMigration.ts on cold boot.
export const ITEMS_KEY = "@mislooks:items";
export const ASSIGNMENTS_KEY = "@mislooks:assignments";
export const FAVORITES_KEY = "@mislooks:favorites";

export interface MisLooksStoreState {
	items: WardrobeItem[];
	assignments: CombinationAssignment[];
	favorites: Set<string>;
	hydrated: boolean;
	setItems: (next: WardrobeItem[]) => void;
	setAssignments: (next: CombinationAssignment[]) => void;
	addFavorite: (id: string) => void;
	removeFavorite: (id: string) => void;
	toggleFavorite: (id: string) => void;
	isFavorite: (id: string) => boolean;
	updateItemCategory: (id: string, category: WardrobeCategory) => void;
}

/**
 * Parse-time guard. `category` is intentionally OPTIONAL here (Epic-14 Story
 * 14.1, TD-7): legacy Epic-13 items persisted before the field existed lack
 * the key and must survive hydration. A foreign `category` value (anything
 * other than undefined or one of the four enum strings) still fails the guard
 * and falls through to the corrupt-payload path — backfill is only for
 * MISSING keys, not invalid values (preserves Story 13.1 F1 semantics).
 */
export function isWardrobeItem(value: unknown): value is WardrobeItem {
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
 * Also consumed by misLooksMigration.ts — single source of truth for TD-7.
 */
export function normalizeItems(parsed: WardrobeItem[]): {
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

export function isCombinationAssignment(
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

export function parseItems(raw: string | null): WardrobeItem[] {
	if (raw === null) return [];
	const parsed: unknown = JSON.parse(raw);
	if (!Array.isArray(parsed) || !parsed.every(isWardrobeItem)) {
		throw new Error("Corrupt @mislooks:items payload");
	}
	return parsed;
}

export function parseAssignments(raw: string | null): CombinationAssignment[] {
	if (raw === null) return [];
	const parsed: unknown = JSON.parse(raw);
	if (!Array.isArray(parsed) || !parsed.every(isCombinationAssignment)) {
		throw new Error("Corrupt @mislooks:assignments payload");
	}
	return parsed;
}

// Set → array: JSON.stringify cannot serialize Set (returns "{}"); rehydration
// reconstructs via new Set(parsed). A plain JSON array of strings is the
// wire format — no custom reviver, no drift surface.
export function parseFavorites(raw: string | null): Set<string> {
	if (raw === null) return new Set();
	const parsed: unknown = JSON.parse(raw);
	if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) {
		throw new Error("Corrupt @mislooks:favorites payload");
	}
	return new Set(parsed as string[]);
}

function persist(key: string, value: unknown): void {
	AsyncStorage.setItem(key, JSON.stringify(value)).catch((error) => {
		if (__DEV__) {
			console.warn(`misLooksStore: failed to persist ${key}`, error);
		}
	});
}

function persistFavorites(next: Set<string>): void {
	persist(FAVORITES_KEY, [...next]);
}

/**
 * Unified Mis Looks store (items + assignments + favorites) per ADR-005 / TD-3.
 * Three slices, each persisted under a dedicated `@mislooks:*` AsyncStorage
 * key so one corrupt payload never zeroes the others (Story 13.1 F1 pattern
 * extended to favorites).
 *
 * Components read via selectors — `useMisLooksStore((s) => s.items)` — and
 * mutate via the `wardrobeRepo` facade (items/assignments) or the store
 * actions directly (favorites). Non-React modules use
 * `useMisLooksStore.getState()` (unchanged from the prior `wardrobeStore`).
 *
 * Hydration is NOT auto-triggered at module import: `runMisLooksMigration()`
 * must run FIRST on cold boot so legacy data lands in the `@mislooks:*` keys
 * before `hydrateMisLooksStore()` reads them. App.tsx's bootstrap IIFE owns
 * the ordering; tests call both explicitly in `beforeEach`.
 */
export const useMisLooksStore = create<MisLooksStoreState>((set, get) => ({
	items: [],
	assignments: [],
	favorites: new Set(),
	hydrated: false,
	setItems: (next) => {
		set({ items: next });
		persist(ITEMS_KEY, next);
	},
	setAssignments: (next) => {
		set({ assignments: next });
		persist(ASSIGNMENTS_KEY, next);
	},
	addFavorite: (id) => {
		const current = get().favorites;
		if (current.has(id)) return;
		const next = new Set(current);
		next.add(id);
		set({ favorites: next });
		persistFavorites(next);
	},
	removeFavorite: (id) => {
		const current = get().favorites;
		if (!current.has(id)) return;
		const next = new Set(current);
		next.delete(id);
		set({ favorites: next });
		persistFavorites(next);
	},
	toggleFavorite: (id) => {
		const current = get().favorites;
		const next = new Set(current);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		set({ favorites: next });
		persistFavorites(next);
	},
	isFavorite: (id) => get().favorites.has(id),
	// Ships here per ADR-005 §"Resulting architecture" so Story 14.12b can
	// consume the action without re-opening the store API. Fully functional
	// (not a stub throw) — tests exercise it.
	updateItemCategory: (id, category) => {
		const next = get().items.map((it) =>
			it.id === id ? { ...it, category } : it,
		);
		set({ items: next });
		persist(ITEMS_KEY, next);
	},
}));

/**
 * Hydrates the store from the three `@mislooks:*` AsyncStorage keys. Each
 * slice is parsed in its own try/catch so one corrupt payload does not zero
 * the others (per-slice isolation — Story 13.1 F1 extended to favorites).
 * Exported for tests and for App.tsx's bootstrap IIFE to call AFTER
 * `runMisLooksMigration()` resolves.
 */
export async function hydrateMisLooksStore(): Promise<void> {
	try {
		const entries = await AsyncStorage.multiGet([
			ITEMS_KEY,
			ASSIGNMENTS_KEY,
			FAVORITES_KEY,
		]);
		const rawItems = entries.find(([k]) => k === ITEMS_KEY)?.[1] ?? null;
		const rawAssignments =
			entries.find(([k]) => k === ASSIGNMENTS_KEY)?.[1] ?? null;
		const rawFavorites =
			entries.find(([k]) => k === FAVORITES_KEY)?.[1] ?? null;

		let items: WardrobeItem[] = [];
		let assignments: CombinationAssignment[] = [];
		let favorites: Set<string> = new Set();

		try {
			const parsed = parseItems(rawItems);
			const normalized = normalizeItems(parsed);
			items = normalized.items;
			if (__DEV__ && normalized.backfilledCount > 0) {
				console.warn(
					`misLooksStore: backfilled category='top' on ${normalized.backfilledCount} legacy item(s) per TD-7`,
				);
			}
		} catch (error) {
			if (__DEV__) {
				console.warn("misLooksStore: items parse failed, falling back", error);
			}
		}

		try {
			assignments = parseAssignments(rawAssignments);
		} catch (error) {
			if (__DEV__) {
				console.warn(
					"misLooksStore: assignments parse failed, falling back",
					error,
				);
			}
		}

		try {
			favorites = parseFavorites(rawFavorites);
		} catch (error) {
			if (__DEV__) {
				console.warn(
					"misLooksStore: favorites parse failed, falling back",
					error,
				);
			}
		}

		useMisLooksStore.setState({
			items,
			assignments,
			favorites,
			hydrated: true,
		});
	} catch (error) {
		if (__DEV__) {
			console.warn("misLooksStore: hydration failed, using empty state", error);
		}
		useMisLooksStore.setState({
			items: [],
			assignments: [],
			favorites: new Set(),
			hydrated: true,
		});
	}
}
