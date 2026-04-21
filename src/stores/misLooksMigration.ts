import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCombination } from "@/data/colorIndex";
import type { CombinationAssignment, WardrobeItem } from "@/lib/wardrobeTypes";
import {
	isCombinationAssignment,
	isWardrobeItem,
	ASSIGNMENTS_KEY as MISLOOKS_ASSIGNMENTS,
	FAVORITES_KEY as MISLOOKS_FAVORITES,
	ITEMS_KEY as MISLOOKS_ITEMS,
	normalizeItems,
} from "./misLooksStore";

// v1.3.0 legacy key names — consumed once, cleared after flag is set.
const LEGACY_FAVORITES = "@outfinder/favorites";
const LEGACY_ITEMS = "@wardrobe:items";
const LEGACY_ASSIGNMENTS = "@wardrobe:assignments";

// Idempotency flag (TD-5). Versioned in the key so a future v2 migration can
// re-run regardless of the v1 flag state.
export const IDEMPOTENCY_KEY = "@outfinder/migration:favorites-to-mis-looks:v1";
const IDEMPOTENCY_DONE = "complete";

export interface MigrationCounts {
	items: number;
	assignments: number;
	favorites: number;
	orphansDropped: number;
}

export type MigrationResult =
	| { status: "already-complete" }
	| { status: "completed"; migratedCounts: MigrationCounts }
	| { status: "aborted"; error: unknown };

function parseLegacyItems(raw: string | null): WardrobeItem[] {
	if (raw === null) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		const valid = parsed.filter(isWardrobeItem);
		if (__DEV__ && valid.length !== parsed.length) {
			console.warn(
				`misLooksMigration: dropped ${
					parsed.length - valid.length
				} malformed legacy item(s)`,
			);
		}
		return valid;
	} catch (error) {
		if (__DEV__) {
			console.warn(
				"misLooksMigration: legacy items payload corrupt, migrating 0 items",
				error,
			);
		}
		return [];
	}
}

function parseLegacyAssignments(raw: string | null): CombinationAssignment[] {
	if (raw === null) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		const valid = parsed.filter(isCombinationAssignment);
		if (__DEV__ && valid.length !== parsed.length) {
			console.warn(
				`misLooksMigration: dropped ${
					parsed.length - valid.length
				} malformed legacy assignment(s)`,
			);
		}
		return valid;
	} catch (error) {
		if (__DEV__) {
			console.warn(
				"misLooksMigration: legacy assignments payload corrupt, migrating 0 assignments",
				error,
			);
		}
		return [];
	}
}

function parseLegacyFavorites(raw: string | null): string[] {
	if (raw === null) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === "string")) {
			if (__DEV__) {
				console.warn(
					"misLooksMigration: legacy favorites payload corrupt, migrating 0 favorites",
				);
			}
			return [];
		}
		return parsed as string[];
	} catch (_error) {
		if (__DEV__) {
			console.warn(
				"misLooksMigration: legacy favorites payload corrupt, migrating 0 favorites",
			);
		}
		return [];
	}
}

/**
 * One-shot data migration: drains legacy v1.3.0 keys (`@outfinder/favorites`,
 * `@wardrobe:items`, `@wardrobe:assignments`) into the unified `@mislooks:*`
 * namespace owned by `useMisLooksStore`. Runs once on cold boot BEFORE
 * hydration (App.tsx IIFE owns the ordering).
 *
 * Safety invariant (TD-5): legacy source keys are cleared ONLY after the
 * idempotency flag is written. A crash at any earlier phase leaves source
 * intact so the next launch re-runs from scratch and succeeds. Do NOT fold
 * phases 3–5 into a single `Promise.all` — sequential awaits ARE the safety
 * margin.
 *
 * Phase order (each awaited sequentially):
 *  1. Read flag → short-circuit if already complete
 *  2. multiGet the three legacy keys (single round-trip)
 *  3. Validate + normalize + orphan-filter in-memory (no I/O)
 *  4. multiSet the three destination keys (single atomic batch)
 *  5. setItem the idempotency flag (the guarantee-point)
 *  6. multiRemove the legacy keys
 */
export async function runMisLooksMigration(): Promise<MigrationResult> {
	try {
		const flag = await AsyncStorage.getItem(IDEMPOTENCY_KEY);
		if (flag === IDEMPOTENCY_DONE) {
			return { status: "already-complete" };
		}
	} catch (error) {
		// Flag read itself failed — treat as "not set" and proceed. If the
		// whole storage layer is broken the multiGet below will reject too
		// and we'll abort cleanly below.
		if (__DEV__) {
			console.warn("misLooksMigration: flag read failed, proceeding", error);
		}
	}

	try {
		const entries = await AsyncStorage.multiGet([
			LEGACY_FAVORITES,
			LEGACY_ITEMS,
			LEGACY_ASSIGNMENTS,
		]);
		const rawFavorites =
			entries.find(([k]) => k === LEGACY_FAVORITES)?.[1] ?? null;
		const rawItems = entries.find(([k]) => k === LEGACY_ITEMS)?.[1] ?? null;
		const rawAssignments =
			entries.find(([k]) => k === LEGACY_ASSIGNMENTS)?.[1] ?? null;

		// Each slice's parse/filter is independent — one corrupt slice does not
		// abort the whole migration (AC #11).
		const parsedItems = parseLegacyItems(rawItems);
		const { items } = normalizeItems(parsedItems);
		const assignments = parseLegacyAssignments(rawAssignments);

		const legacyFavoriteIds = parseLegacyFavorites(rawFavorites);
		const favorites: string[] = [];
		let orphansDropped = 0;
		for (const id of legacyFavoriteIds) {
			if (getCombination(id) === undefined) {
				orphansDropped += 1;
				if (__DEV__) {
					console.warn(
						`misLooksMigration: dropped orphan favorite combinationId="${id}" (no longer in Wada dataset)`,
					);
				}
				continue;
			}
			favorites.push(id);
		}

		// Phase 4: atomic batch write to destination. A rejection here means
		// the destination is in an indeterminate state, but legacy source +
		// flag are both untouched — next launch re-runs and overwrites.
		await AsyncStorage.multiSet([
			[MISLOOKS_ITEMS, JSON.stringify(items)],
			[MISLOOKS_ASSIGNMENTS, JSON.stringify(assignments)],
			[MISLOOKS_FAVORITES, JSON.stringify(favorites)],
		]);

		// Phase 5: the guarantee-point. Once this write resolves, the
		// destination is fully populated and the source becomes redundant.
		await AsyncStorage.setItem(IDEMPOTENCY_KEY, IDEMPOTENCY_DONE);

		// Phase 6: now safe to drop legacy. If this step fails the flag is
		// already set, so a re-run short-circuits; the legacy keys linger
		// harmlessly until the next OS-level AsyncStorage eviction.
		await AsyncStorage.multiRemove([
			LEGACY_FAVORITES,
			LEGACY_ITEMS,
			LEGACY_ASSIGNMENTS,
		]);

		return {
			status: "completed",
			migratedCounts: {
				items: items.length,
				assignments: assignments.length,
				favorites: favorites.length,
				orphansDropped,
			},
		};
	} catch (error) {
		if (__DEV__) {
			console.warn(
				"misLooksMigration: aborted mid-sequence, legacy source preserved — will retry on next launch",
				error,
			);
		}
		return { status: "aborted", error };
	}
}
