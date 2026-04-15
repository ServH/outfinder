import type { Color } from "@/data/types";

export interface LabColor {
	L: number;
	a: number;
	b: number;
}

export interface WadaMatch {
	color: Color;
	deltaE: number;
}

export type MatchResult =
	| { type: "direct"; match: WadaMatch }
	| { type: "confirm"; top3: WadaMatch[] }
	| { type: "out-of-coverage"; bestMatch: WadaMatch };
