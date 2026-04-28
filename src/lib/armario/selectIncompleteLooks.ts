import type { Combination } from "@/data/types";
import type { CombinationAssignment } from "@/lib/wardrobeTypes";

interface IncompleteEntry {
	combination: Combination;
	inputIndex: number;
	assignedCount: number;
	maxAssignedAt: number;
}

/**
 * Pure selector used by the "En curso" retention surface (UX-DR5) to surface
 * favorited Wada combinations whose garment assignment count is strictly less
 * than the combination's total color count. This captures BOTH partial looks
 * (0 < X < N — from auto-save in Story 14.8) AND empty "Guardar para luego"
 * looks (X === 0 — from Story 14.9).
 *
 * Ordering is **maxAssignedAt DESC** (most recent activity first). Entries
 * that share a timestamp — or the "Guardar para luego" empties whose
 * `maxAssignedAt` falls back to 0 — preserve the caller's input order
 * (stable Set-insertion "favoritedAt desc" proxy).
 *
 * Returns a new array; never mutates inputs.
 */
export function selectIncompleteLooks(
	combinations: Combination[],
	assignments: CombinationAssignment[],
): Combination[] {
	const byCombinationId = new Map<
		string,
		{ count: number; maxAssignedAt: number }
	>();
	for (const a of assignments) {
		const existing = byCombinationId.get(a.combinationId);
		if (existing) {
			existing.count += 1;
			if (a.assignedAt > existing.maxAssignedAt) {
				existing.maxAssignedAt = a.assignedAt;
			}
		} else {
			byCombinationId.set(a.combinationId, {
				count: 1,
				maxAssignedAt: a.assignedAt,
			});
		}
	}

	const incomplete: IncompleteEntry[] = [];
	combinations.forEach((combination, inputIndex) => {
		const totalColors = combination.colors.length;
		if (totalColors <= 0) return;
		const stats = byCombinationId.get(combination.id);
		const assignedCount = stats?.count ?? 0;
		if (assignedCount >= totalColors) return;
		incomplete.push({
			combination,
			inputIndex,
			assignedCount,
			maxAssignedAt: stats?.maxAssignedAt ?? 0,
		});
	});

	incomplete.sort((a, b) => {
		if (b.maxAssignedAt !== a.maxAssignedAt) {
			return b.maxAssignedAt - a.maxAssignedAt;
		}
		return a.inputIndex - b.inputIndex;
	});

	return incomplete.map((e) => e.combination);
}
