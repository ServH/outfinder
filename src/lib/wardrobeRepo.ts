import { PREMIUM_CONFIG } from "@/config/premium";
import { useMisLooksStore } from "@/stores/misLooksStore";
import { uuidv4 } from "./uuid";
import {
	type CombinationAssignment,
	type WardrobeItem,
	type WardrobeItemInput,
	WardrobeLimitExceeded,
} from "./wardrobeTypes";

function warnIfNotHydrated(action: string): void {
	if (__DEV__ && !useMisLooksStore.getState().hydrated) {
		console.warn(
			`wardrobeRepo.${action}: called before hydration completed — write may race AsyncStorage read`,
		);
	}
}

/** Returns the current wardrobe items array (read-only snapshot from the store). */
export function getItems(): WardrobeItem[] {
	return useMisLooksStore.getState().items;
}

/**
 * Adds a new wardrobe item. Free-tier callers (`isPremium === false`) are
 * blocked at `FREE_WARDROBE_LIMIT` and receive a `WardrobeLimitExceeded`
 * error — premium callers bypass the check entirely.
 *
 * Reuse (`assign`) is NEVER gated by this limit (FR6) — assigning an
 * existing item to additional combos does not pass through `addItem`.
 */
export function addItem(
	input: WardrobeItemInput,
	isPremium: boolean,
): WardrobeItem {
	warnIfNotHydrated("addItem");
	const { items, setItems } = useMisLooksStore.getState();

	if (!isPremium && items.length >= PREMIUM_CONFIG.FREE_WARDROBE_LIMIT) {
		throw new WardrobeLimitExceeded();
	}

	const item: WardrobeItem = {
		id: uuidv4(),
		createdAt: Date.now(),
		...input,
	};
	setItems([...items, item]);
	return item;
}

/**
 * Removes an item from `@wardrobe:items`. Assignments referencing the item
 * are intentionally left dangling — the repo does NOT cascade forward (UI
 * surfaces should re-resolve and skip orphans). This keeps the API minimal
 * and matches the cleanup pattern used by Story 13.4b.
 *
 * For the "delete and free assigned slots" flow, call
 * `cascadeDeleteAssignmentsForItem(id)` FIRST, then `removeItem(id)`.
 */
export function removeItem(id: string): void {
	warnIfNotHydrated("removeItem");
	const { items, setItems } = useMisLooksStore.getState();
	setItems(items.filter((item) => item.id !== id));
}

/**
 * Removes every assignment row referencing `wardrobeItemId` across every
 * combination. Paired with `removeItem` to implement "delete from wardrobe"
 * — call this BEFORE `removeItem` so every consumer (S2 Ficha Wada, S3
 * Picker, Favorites badges) sees the slots free in a single Zustand update
 * window. The `WardrobeItem` itself is NOT touched here.
 */
export function cascadeDeleteAssignmentsForItem(wardrobeItemId: string): void {
	warnIfNotHydrated("cascadeDeleteAssignmentsForItem");
	const { assignments, setAssignments } = useMisLooksStore.getState();
	setAssignments(
		assignments.filter((a) => a.wardrobeItemId !== wardrobeItemId),
	);
}

/** Returns all assignments for a given combination, in insertion order. */
export function getAssignmentsForCombination(
	combinationId: string,
): CombinationAssignment[] {
	return useMisLooksStore
		.getState()
		.assignments.filter((a) => a.combinationId === combinationId);
}

/**
 * Upserts a `(combinationId, colorIndex)` assignment. Any existing
 * assignment on the same slot is replaced; the previously-referenced
 * wardrobe item is NOT deleted (items are shared across combos — FR6).
 */
export function assign(
	combinationId: string,
	colorIndex: number,
	wardrobeItemId: string,
): void {
	warnIfNotHydrated("assign");
	const { assignments, setAssignments } = useMisLooksStore.getState();
	const filtered = assignments.filter(
		(a) => !(a.combinationId === combinationId && a.colorIndex === colorIndex),
	);
	filtered.push({
		combinationId,
		colorIndex,
		wardrobeItemId,
		assignedAt: Date.now(),
	});
	setAssignments(filtered);
}

/** Removes the assignment for a given `(combinationId, colorIndex)` slot. */
export function unassign(combinationId: string, colorIndex: number): void {
	warnIfNotHydrated("unassign");
	const { assignments, setAssignments } = useMisLooksStore.getState();
	setAssignments(
		assignments.filter(
			(a) =>
				!(a.combinationId === combinationId && a.colorIndex === colorIndex),
		),
	);
}

/** Number of slots currently assigned for a combination. */
export function getAssignmentCount(combinationId: string): number {
	return useMisLooksStore
		.getState()
		.assignments.filter((a) => a.combinationId === combinationId).length;
}

/** True when every color slot in the combination has a wardrobe assignment. */
export function isCombinationComplete(
	combinationId: string,
	totalColors: number,
): boolean {
	if (totalColors <= 0) return false;
	return getAssignmentCount(combinationId) === totalColors;
}

/**
 * Removes every assignment row tied to `combinationId` (called on unfavorite
 * by Story 13.3b). Wardrobe items are NOT touched — they remain available
 * for other combinations and for re-assignment if the user re-favorites.
 */
export function cascadeDeleteAssignmentsForCombination(
	combinationId: string,
): void {
	warnIfNotHydrated("cascadeDeleteAssignmentsForCombination");
	const { assignments, setAssignments } = useMisLooksStore.getState();
	setAssignments(assignments.filter((a) => a.combinationId !== combinationId));
}
