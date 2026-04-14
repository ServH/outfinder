import type { LabColor } from "./colorTypes";

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const cleaned = hex.startsWith("#") ? hex.slice(1) : hex;
	if (cleaned.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
		throw new RangeError(`Invalid hex color: "${hex}"`);
	}
	return {
		r: Number.parseInt(cleaned.slice(0, 2), 16),
		g: Number.parseInt(cleaned.slice(2, 4), 16),
		b: Number.parseInt(cleaned.slice(4, 6), 16),
	};
}

export function rgbToLinear(c: number): number {
	const normalized = c / 255;
	if (normalized <= 0.04045) {
		return normalized / 12.92;
	}
	return ((normalized + 0.055) / 1.055) ** 2.4;
}

export function linearRgbToXyz(
	r: number,
	g: number,
	b: number,
): { X: number; Y: number; Z: number } {
	return {
		X: 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
		Y: 0.2126729 * r + 0.7151522 * g + 0.072175 * b,
		Z: 0.0193339 * r + 0.119192 * g + 0.9503041 * b,
	};
}

const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

function labF(t: number): number {
	const delta = 6 / 29;
	if (t > delta ** 3) {
		return Math.cbrt(t);
	}
	return t / (3 * delta ** 2) + 4 / 29;
}

export function xyzToLab(X: number, Y: number, Z: number): LabColor {
	const fy = labF(Y / Yn);
	return {
		L: 116 * fy - 16,
		a: 500 * (labF(X / Xn) - fy),
		b: 200 * (fy - labF(Z / Zn)),
	};
}

export function hexToLab(hex: string): LabColor {
	const { r, g, b } = hexToRgb(hex);
	const rLin = rgbToLinear(r);
	const gLin = rgbToLinear(g);
	const bLin = rgbToLinear(b);
	const { X, Y, Z } = linearRgbToXyz(rLin, gLin, bLin);
	return xyzToLab(X, Y, Z);
}
