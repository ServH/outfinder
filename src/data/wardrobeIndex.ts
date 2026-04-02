import { getAllColors, getCombinations } from "./colorIndex";
import type { Color, Combination, WardrobeCategory } from "./types";
import { REPRESENTATIVE_SHADES, WARDROBE_MAP } from "./wardrobeData";

const wardrobeColorMap = new Map<WardrobeCategory, Color[]>();
const wardrobeCombinationMap = new Map<WardrobeCategory, Combination[]>();
const representativeShadeMap = new Map<WardrobeCategory, Color[]>();

for (const color of getAllColors()) {
	const category = WARDROBE_MAP[color.id];
	if (!category) {
		if (__DEV__)
			console.warn(`wardrobeIndex: color ${color.id} has no wardrobe mapping`);
		continue;
	}

	const colors = wardrobeColorMap.get(category) ?? [];
	colors.push(color);
	wardrobeColorMap.set(category, colors);
}

for (const category of Object.keys(
	REPRESENTATIVE_SHADES,
) as WardrobeCategory[]) {
	const colors = wardrobeColorMap.get(category) ?? [];
	const seen = new Set<string>();
	const combinations: Combination[] = [];

	for (const color of colors) {
		for (const combo of getCombinations(color.id)) {
			if (!seen.has(combo.id)) {
				seen.add(combo.id);
				combinations.push(combo);
			}
		}
	}

	combinations.sort((a, b) => a.colors.length - b.colors.length);
	wardrobeCombinationMap.set(category, combinations);

	// Pre-compute representative shades for O(1) lookups
	const shadeIds = REPRESENTATIVE_SHADES[category];
	const colorById = new Map(colors.map((c) => [c.id, c]));
	representativeShadeMap.set(
		category,
		shadeIds
			.map((id) => colorById.get(id))
			.filter((c): c is Color => c !== undefined),
	);
}

export function getColorsByWardrobe(category: WardrobeCategory): Color[] {
	return wardrobeColorMap.get(category) ?? [];
}

export function getRepresentativeShades(category: WardrobeCategory): Color[] {
	return representativeShadeMap.get(category) ?? [];
}

// Tie-breaking: if two shades share the highest combinationCount,
// the first in REPRESENTATIVE_SHADES order (lighter shade) wins.
export function getDefaultShade(category: WardrobeCategory): Color | undefined {
	const shades = getRepresentativeShades(category);
	if (shades.length === 0) return undefined;

	return shades.reduce((best, shade) =>
		shade.combinationCount > best.combinationCount ? shade : best,
	);
}

export function getCombinationsByWardrobe(
	category: WardrobeCategory,
): Combination[] {
	return wardrobeCombinationMap.get(category) ?? [];
}
