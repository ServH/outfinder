import { getAllColors } from "@/data/colorIndex";
import type { Color } from "@/data/types";
import { hexToLab } from "./colorConversion";
import type { LabColor, MatchResult, WadaMatch } from "./colorTypes";

export const DIRECT_THRESHOLD = 2.0;
export const COVERAGE_THRESHOLD = 15.0;

/**
 * CIEDE2000 color difference formula (Sharma et al., 2005).
 * Pure-JS implementation — no external dependency required.
 */
function ciede2000(lab1: LabColor, lab2: LabColor): number {
	const { L: L1, a: a1, b: b1 } = lab1;
	const { L: L2, a: a2, b: b2 } = lab2;

	const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
	const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
	const Cavg = (C1 + C2) / 2;
	const Cavg7 = Cavg ** 7;
	const G = 0.5 * (1 - Math.sqrt(Cavg7 / (Cavg7 + 25 ** 7)));

	const a1p = a1 * (1 + G);
	const a2p = a2 * (1 + G);

	const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
	const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);

	const hpAngle = (ap: number, bp: number): number => {
		if (ap === 0 && bp === 0) return 0;
		const h = Math.atan2(bp, ap) * (180 / Math.PI);
		return h >= 0 ? h : h + 360;
	};

	const h1p = hpAngle(a1p, b1);
	const h2p = hpAngle(a2p, b2);

	const dLp = L2 - L1;
	const dCp = C2p - C1p;

	let dhp: number;
	if (C1p * C2p === 0) {
		dhp = 0;
	} else if (Math.abs(h2p - h1p) <= 180) {
		dhp = h2p - h1p;
	} else if (h2p - h1p > 180) {
		dhp = h2p - h1p - 360;
	} else {
		dhp = h2p - h1p + 360;
	}

	const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);

	const Lp = (L1 + L2) / 2;
	const Cp = (C1p + C2p) / 2;

	let Hp: number;
	if (C1p * C2p === 0) {
		Hp = h1p + h2p;
	} else if (Math.abs(h1p - h2p) <= 180) {
		Hp = (h1p + h2p) / 2;
	} else if (h1p + h2p < 360) {
		Hp = (h1p + h2p + 360) / 2;
	} else {
		Hp = (h1p + h2p - 360) / 2;
	}

	const T =
		1 -
		0.17 * Math.cos(((Hp - 30) * Math.PI) / 180) +
		0.24 * Math.cos((2 * Hp * Math.PI) / 180) +
		0.32 * Math.cos(((3 * Hp + 6) * Math.PI) / 180) -
		0.2 * Math.cos(((4 * Hp - 63) * Math.PI) / 180);

	const SL = 1 + (0.015 * (Lp - 50) ** 2) / Math.sqrt(20 + (Lp - 50) ** 2);
	const SC = 1 + 0.045 * Cp;
	const SH = 1 + 0.015 * Cp * T;

	const Cp7 = Cp ** 7;
	const RT =
		-2 *
		Math.sqrt(Cp7 / (Cp7 + 25 ** 7)) *
		Math.sin((60 * Math.exp(-(((Hp - 275) / 25) ** 2)) * Math.PI) / 180);

	return Math.sqrt(
		(dLp / SL) ** 2 +
			(dCp / SC) ** 2 +
			(dHp / SH) ** 2 +
			RT * (dCp / SC) * (dHp / SH),
	);
}

interface WadaColorWithLab extends Color {
	lab: LabColor;
}

export const WADA_COLORS_WITH_LAB: ReadonlyArray<WadaColorWithLab> =
	getAllColors().map((c) => ({ ...c, lab: hexToLab(c.hex) }));

export function matchWadaColor(capturedLab: LabColor): WadaMatch[] {
	const results: WadaMatch[] = WADA_COLORS_WITH_LAB.map((c) => ({
		color: c,
		deltaE: ciede2000(capturedLab, c.lab),
	}));
	results.sort((a, b) => a.deltaE - b.deltaE);
	return results.slice(0, 3);
}

export function classifyMatch(matches: WadaMatch[]): MatchResult {
	if (!matches.length) {
		throw new RangeError("classifyMatch requires at least one match");
	}
	const top = matches[0];
	if (top.deltaE < DIRECT_THRESHOLD) {
		return { type: "direct", match: top };
	}
	if (top.deltaE > COVERAGE_THRESHOLD) {
		return { type: "out-of-coverage", bestMatch: top };
	}
	return { type: "confirm", top3: matches };
}
