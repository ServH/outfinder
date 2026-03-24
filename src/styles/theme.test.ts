import { wadaTokens } from "./theme";

describe("wadaTokens", () => {
	it("exports all 18 Wada design tokens", () => {
		expect(Object.keys(wadaTokens)).toHaveLength(18);
	});

	it("contains correct color values", () => {
		expect(wadaTokens.bgPaper).toBe("#fafaf8");
		expect(wadaTokens.bgSurface).toBe("#ffffff");
		expect(wadaTokens.bgElevated).toBe("#f5f5f3");
		expect(wadaTokens.textPrimary).toBe("#1a1a1a");
		expect(wadaTokens.textSecondary).toBe("#6b6b6b");
		expect(wadaTokens.textTertiary).toBe("#9b9b9b");
		expect(wadaTokens.hairline).toBe("rgba(0,0,0,0.08)");
		expect(wadaTokens.divider).toBe("rgba(0,0,0,0.06)");
		expect(wadaTokens.premiumAccent).toBe("#c4a265");
		expect(wadaTokens.interactiveHint).toBe("rgba(0,0,0,0.04)");
		expect(wadaTokens.favoriteRed).toBe("#E74C3C");
		expect(wadaTokens.tabActive).toBe("#1a1a1a");
		expect(wadaTokens.tabInactive).toBe("#9b9b9b");
		expect(wadaTokens.tabBarBg).toBe("#fafaf8");
		expect(wadaTokens.tabBarBorder).toBe("rgba(0,0,0,0.06)");
		expect(wadaTokens.navBarBg).toBe("#fafaf8");
		expect(wadaTokens.wadaMuted).toBe("#a09080");
		expect(wadaTokens.warmBg).toBe("#ebe5da");
	});
});
