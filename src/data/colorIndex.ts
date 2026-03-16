import colorsData from "./colors.json";
import combinationsData from "./combinations.json";
import type { Color, Combination, RawCombination, SwatchGroup } from "./types";

const colorMap = new Map<string, Color>();
const combinationsByColor = new Map<string, Combination[]>();
const colorsByGroup = new Map<SwatchGroup, Color[]>();
const allCombinations: Combination[] = [];
const combinationMap = new Map<string, Combination>();

for (const raw of colorsData) {
	const color = raw as Color;
	colorMap.set(color.id, color);

	const group = color.swatchGroup as SwatchGroup;
	const groupColors = colorsByGroup.get(group) ?? [];
	groupColors.push(color);
	colorsByGroup.set(group, groupColors);
}

for (const raw of combinationsData as RawCombination[]) {
	const colors = raw.colorIds
		.map((id) => colorMap.get(id))
		.filter((c): c is Color => c !== undefined);

	const combination: Combination = {
		id: raw.id,
		colors,
		nameJp: raw.nameJp,
		nameEn: raw.nameEn,
	};

	allCombinations.push(combination);
	combinationMap.set(combination.id, combination);

	for (const colorId of raw.colorIds) {
		const existing = combinationsByColor.get(colorId) ?? [];
		existing.push(combination);
		combinationsByColor.set(colorId, existing);
	}
}

export function getColor(colorId: string): Color | undefined {
	return colorMap.get(colorId);
}

export function getCombination(combinationId: string): Combination | undefined {
	return combinationMap.get(combinationId);
}

export function getCombinations(colorId: string): Combination[] {
	return combinationsByColor.get(colorId) ?? [];
}

export function getColorsByGroup(group: SwatchGroup): Color[] {
	return colorsByGroup.get(group) ?? [];
}

export function getAllColors(): Color[] {
	return colorsData as Color[];
}

export function getAllCombinations(): Combination[] {
	return allCombinations;
}
