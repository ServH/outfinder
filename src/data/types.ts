export type SwatchGroup = 0 | 1 | 2 | 3 | 4 | 5;

export interface Color {
	id: string;
	hex: string;
	nameJp: string;
	nameEn: string;
	swatchGroup: SwatchGroup;
	combinationCount: number;
}

export interface Combination {
	id: string;
	colors: Color[];
	nameJp: string;
	nameEn: string;
}

export interface RawCombination {
	id: string;
	colorIds: string[];
	nameJp: string;
	nameEn: string;
}
