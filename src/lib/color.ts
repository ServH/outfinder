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

/**
 * WCAG sRGB → linear channel transform. Input `c` is in [0, 1] on the sRGB
 * scale; output is the corresponding linear-light intensity.
 */
function channelLinear(c: number): number {
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * WCAG relative luminance in [0, 1] for a 6-digit hex color.
 *
 * Used by the unified-camera Result screen (Story 14.4) to pick between
 * dark pergamino ink (#2d2a26) and cream (#faf7f2) for the primary-CTA label
 * against a Wada-hex background: threshold `> 0.40` → dark text, `≤ 0.40`
 * → cream. The threshold is an aesthetic choice — not WCAG contrast —
 * tuned for the Wada palette.
 *
 * Returns `0` for malformed input so a bad hex yields cream text, which
 * is more readable on the likely fallback `#000000` than dark-on-dark.
 */
export function relativeLuminance(hex: string): number {
	if (!hex || typeof hex !== "string") return 0;
	const stripped = hex.startsWith("#") ? hex.slice(1) : hex;
	if (stripped.length !== 6) return 0;
	const r = Number.parseInt(stripped.slice(0, 2), 16);
	const g = Number.parseInt(stripped.slice(2, 4), 16);
	const b = Number.parseInt(stripped.slice(4, 6), 16);
	if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
		return 0;
	}
	const R = channelLinear(r / 255);
	const G = channelLinear(g / 255);
	const B = channelLinear(b / 255);
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Converts a 3- or 6-digit hex (with or without leading `#`) to `rgba(r, g, b, a)`.
 * RN 0.83 accepts 8-digit hex, but the rgba form matches the codebase's
 * existing color-util style and avoids alpha-math foot-guns at call sites.
 *
 * Invalid inputs fall back to `rgba(0, 0, 0, alpha)` so a malformed Wada
 * hex never crashes a Skia or View style prop.
 */
export function hexToRgba(hex: string, alpha: number): string {
	const clampedAlpha = Math.max(0, Math.min(1, alpha));
	if (!hex || typeof hex !== "string") {
		return `rgba(0, 0, 0, ${clampedAlpha})`;
	}
	const stripped = hex.startsWith("#") ? hex.slice(1) : hex;
	let normalized = stripped;
	if (stripped.length === 3) {
		normalized = stripped
			.split("")
			.map((c) => c + c)
			.join("");
	}
	if (normalized.length !== 6) {
		return `rgba(0, 0, 0, ${clampedAlpha})`;
	}
	const r = Number.parseInt(normalized.slice(0, 2), 16);
	const g = Number.parseInt(normalized.slice(2, 4), 16);
	const b = Number.parseInt(normalized.slice(4, 6), 16);
	if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
		return `rgba(0, 0, 0, ${clampedAlpha})`;
	}
	return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}
