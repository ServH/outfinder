/**
 * Determine whether a hex color is perceptually light (luminance > 224).
 * Used for contrast-aware UI (e.g. border on pale swatches, dot color in palette strips).
 */
export function isLightColor(hex: string): boolean {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	const luminance = (r * 299 + g * 587 + b * 114) / 1000;
	return luminance > 224;
}
