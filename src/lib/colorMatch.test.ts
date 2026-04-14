import { getAllColors } from "@/data/colorIndex";
import { hexToLab } from "./colorConversion";
import {
	COVERAGE_THRESHOLD,
	classifyMatch,
	DIRECT_THRESHOLD,
	matchWadaColor,
	WADA_COLORS_WITH_LAB,
} from "./colorMatch";
import type { WadaMatch } from "./colorTypes";

describe("WADA_COLORS_WITH_LAB", () => {
	it("contains exactly 159 entries", () => {
		expect(WADA_COLORS_WITH_LAB).toHaveLength(159);
	});

	it("each entry has valid L, a, b lab properties", () => {
		for (const c of WADA_COLORS_WITH_LAB) {
			expect(typeof c.lab.L).toBe("number");
			expect(typeof c.lab.a).toBe("number");
			expect(typeof c.lab.b).toBe("number");
			expect(Number.isFinite(c.lab.L)).toBe(true);
			expect(Number.isFinite(c.lab.a)).toBe(true);
			expect(Number.isFinite(c.lab.b)).toBe(true);
		}
	});
});

describe("matchWadaColor", () => {
	it("returns exactly 3 results", () => {
		const matches = matchWadaColor(hexToLab("#A3522B"));
		expect(matches).toHaveLength(3);
	});

	it("results are sorted by deltaE ascending", () => {
		const matches = matchWadaColor(hexToLab("#A3522B"));
		expect(matches[0].deltaE).toBeLessThanOrEqual(matches[1].deltaE);
		expect(matches[1].deltaE).toBeLessThanOrEqual(matches[2].deltaE);
	});

	it("exact Wada color hex returns that color first with near-zero deltaE", () => {
		const firstColor = getAllColors()[0];
		const matches = matchWadaColor(hexToLab(firstColor.hex));
		expect(matches[0].deltaE).toBeCloseTo(0, 1);
		expect(matches[0].color.id).toBe(firstColor.id);
	});

	it("all deltaE values are non-negative", () => {
		const matches = matchWadaColor({ L: 50, a: 20, b: -10 });
		for (const m of matches) {
			expect(m.deltaE).toBeGreaterThanOrEqual(0);
		}
	});
});

describe("classifyMatch", () => {
	it('returns { type: "direct" } when top-1 deltaE < DIRECT_THRESHOLD', () => {
		const color = getAllColors()[0];
		const matches: WadaMatch[] = [
			{ color, deltaE: 0.5 },
			{ color, deltaE: 1.0 },
			{ color, deltaE: 1.5 },
		];
		const result = classifyMatch(matches);
		expect(result.type).toBe("direct");
		if (result.type === "direct") {
			expect(result.match.deltaE).toBeLessThan(DIRECT_THRESHOLD);
		}
	});

	it('returns { type: "confirm" } when top-1 deltaE is between 2.0 and 15.0', () => {
		const color = getAllColors()[0];
		const matches: WadaMatch[] = [
			{ color, deltaE: 7.0 },
			{ color, deltaE: 10.0 },
			{ color, deltaE: 12.0 },
		];
		const result = classifyMatch(matches);
		expect(result.type).toBe("confirm");
		if (result.type === "confirm") {
			expect(result.top3).toHaveLength(3);
		}
	});

	it('returns { type: "out-of-coverage" } when top-1 deltaE > COVERAGE_THRESHOLD', () => {
		const color = getAllColors()[0];
		const matches: WadaMatch[] = [
			{ color, deltaE: 20.0 },
			{ color, deltaE: 25.0 },
			{ color, deltaE: 30.0 },
		];
		const result = classifyMatch(matches);
		expect(result.type).toBe("out-of-coverage");
		if (result.type === "out-of-coverage") {
			expect(result.bestMatch.deltaE).toBeGreaterThan(COVERAGE_THRESHOLD);
		}
	});

	it("neon green (L:88, a:-70, b:60) classifies as out-of-coverage", () => {
		const neonGreen = { L: 88, a: -70, b: 60 };
		const matches = matchWadaColor(neonGreen);
		const result = classifyMatch(matches);
		expect(result.type).toBe("out-of-coverage");
	});

	it("exact Wada color match classifies as direct", () => {
		const firstColor = getAllColors()[0];
		const matches = matchWadaColor(hexToLab(firstColor.hex));
		const result = classifyMatch(matches);
		expect(result.type).toBe("direct");
	});
});
