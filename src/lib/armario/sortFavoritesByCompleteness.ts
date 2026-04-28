import type { Combination } from "@/data/types";
import type { CombinationAssignment } from "@/lib/wardrobeTypes";

type Bucket = "complete" | "partial" | "empty";

interface BucketEntry {
	combination: Combination;
	inputIndex: number;
	assignedCount: number;
	maxAssignedAt: number;
}

function classify(entry: BucketEntry, totalColors: number): Bucket {
	if (totalColors <= 0) return "empty";
	if (entry.assignedCount === 0) return "empty";
	if (entry.assignedCount >= totalColors) return "complete";
	return "partial";
}

/**
 * Pure partition-sort used by FavoritesList to surface complete looks first,
 * then partial, then empty. Within complete/partial buckets entries are
 * ordered by the combo's most recent assignment timestamp (DESC). Within
 * the empty bucket the caller's input order is preserved (our stable
 * "favoritedAt desc" proxy, per the story's Dev Notes trade-off).
 *
 * The function takes plain data — no store, no React — so it can be
 * unit-tested without providers and reused from any caller.
 */
export function sortFavoritesByCompleteness(
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

	const entries: BucketEntry[] = combinations.map((combination, inputIndex) => {
		const stats = byCombinationId.get(combination.id);
		return {
			combination,
			inputIndex,
			assignedCount: stats?.count ?? 0,
			maxAssignedAt: stats?.maxAssignedAt ?? 0,
		};
	});

	const complete: BucketEntry[] = [];
	const partial: BucketEntry[] = [];
	const empty: BucketEntry[] = [];
	for (const entry of entries) {
		const totalColors = entry.combination.colors.length;
		switch (classify(entry, totalColors)) {
			case "complete":
				complete.push(entry);
				break;
			case "partial":
				partial.push(entry);
				break;
			case "empty":
				empty.push(entry);
				break;
		}
	}

	// Stable DESC sort on maxAssignedAt. Equal timestamps preserve input order.
	complete.sort((a, b) => {
		if (b.maxAssignedAt !== a.maxAssignedAt) {
			return b.maxAssignedAt - a.maxAssignedAt;
		}
		return a.inputIndex - b.inputIndex;
	});
	partial.sort((a, b) => {
		if (b.maxAssignedAt !== a.maxAssignedAt) {
			return b.maxAssignedAt - a.maxAssignedAt;
		}
		return a.inputIndex - b.inputIndex;
	});

	return [...complete, ...partial, ...empty].map((e) => e.combination);
}
