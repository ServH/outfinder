/**
 * Wada design tokens for programmatic access (Reanimated, dynamic styles).
 * Static styles should use NativeWind className instead.
 */
export const wadaTokens = {
	bgPaper: "#fafaf8",
	bgSurface: "#ffffff",
	bgElevated: "#f5f5f3",
	textPrimary: "#1a1a1a",
	textSecondary: "#6b6b6b",
	textTertiary: "#9b9b9b",
	hairline: "rgba(0,0,0,0.08)",
	divider: "rgba(0,0,0,0.06)",
	premiumAccent: "#c4a265",
	interactiveHint: "rgba(0,0,0,0.04)",
	favoriteRed: "#E74C3C",
	tabActive: "#1a1a1a",
	tabInactive: "#9b9b9b",
	tabBarBg: "#fafaf8",
	tabBarBorder: "rgba(0,0,0,0.06)",
	navBarBg: "#fafaf8",
	wadaMuted: "#a09080",
	warmBg: "#ebe5da",
} as const;

export type WadaToken = keyof typeof wadaTokens;
