import { detectLanguage } from "../index";
import en from "../locales/en.json";
import es from "../locales/es.json";

// Helper: flatten nested object keys to "a.b.c" format
function flattenKeys(obj: object, prefix = ""): string[] {
	const result: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const full = prefix ? `${prefix}.${k}` : k;
		if (typeof v === "object" && v !== null) {
			result.push(...flattenKeys(v as object, full));
		} else {
			result.push(full);
		}
	}
	return result;
}

describe("i18n", () => {
	describe("translation completeness", () => {
		it("en.json has all expected top-level namespaces", () => {
			const namespaces = Object.keys(en);
			expect(namespaces).toContain("tabs");
			expect(namespaces).toContain("home");
			expect(namespaces).toContain("combinations");
			expect(namespaces).toContain("visualizer");
			expect(namespaces).toContain("favorites");
			expect(namespaces).toContain("settings");
			expect(namespaces).toContain("paywall");
			expect(namespaces).toContain("comboCard");
			expect(namespaces).toContain("favoriteButton");
			expect(namespaces).toContain("error");
			expect(namespaces).toContain("swatchGroups");
			expect(namespaces).toContain("fabric");
		});

		it("es.json has exactly the same keys as en.json (key parity)", () => {
			const enKeys = flattenKeys(en).sort();
			const esKeys = flattenKeys(es).sort();
			expect(esKeys).toEqual(enKeys);
		});
	});

	describe("locale detection and translation output", () => {
		beforeAll(() => {
			// Ensure i18n is initialized (side-effect import already ran)
		});

		it("English strings available via getFixedT('en') — AC #2", () => {
			const { i18n } = require("../index");
			const tEN = i18n.getFixedT("en");
			expect(tEN("home.subtitle")).toBe(
				"What color would you like to combine?",
			);
			expect(tEN("home.browseAll")).toBe("Browse all 159 colors");
			expect(tEN("tabs.colors")).toBe("Colors");
			expect(tEN("tabs.favorites")).toBe("My looks");
		});

		it("Spanish strings available via getFixedT('es') — AC #1", () => {
			const { i18n } = require("../index");
			const tES = i18n.getFixedT("es");
			expect(tES("home.subtitle")).toContain("color de ropa");
			expect(tES("home.browseAll")).toBeTruthy();
			expect(tES("tabs.colors")).toBe("Colores");
			expect(tES("tabs.favorites")).toBe("Mis Looks");
		});

		it("Spanish locale → Spanish strings — AC #1 (es)", () => {
			const { i18n } = require("../index");
			const tES = i18n.getFixedT("es");
			// AC #6 exact strings (D1 home subtitle Epic 15 — "Qué color de ropa quieres combinar")
			expect(tES("home.subtitle")).toContain("quieres combinar");
			expect(tES("home.browseAll")).toBe("Ver catálogo");
		});

		it("Spanish locale → sort pills in Spanish — AC #7", () => {
			const { i18n } = require("../index");
			const tES = i18n.getFixedT("es");
			expect(tES("favorites.sortRecent")).toBe("Reciente");
			expect(tES("favorites.sortAZ")).toBe("A-Z");
			expect(tES("favorites.sortSize")).toContain("tama");
		});

		it("Spanish paywall strings — AC #9", () => {
			const { i18n } = require("../index");
			const tES = i18n.getFixedT("es");
			expect(tES("paywall.favorites.headline")).toContain("coleccionar");
			expect(tES("paywall.unlockButton")).toBeTruthy();
			expect(tES("paywall.notNow")).toBeTruthy();
		});

		it("pluralization works: combo_one / combo_other — English", () => {
			const { i18n } = require("../index");
			const tEN = i18n.getFixedT("en");
			expect(tEN("home.combo", { count: 1 })).toBe("combo");
			expect(tEN("home.combo", { count: 5 })).toBe("combos");
		});

		it("pluralization works: combo_one / combo_other — Spanish", () => {
			const { i18n } = require("../index");
			const tES = i18n.getFixedT("es");
			expect(tES("home.combo", { count: 1 })).toBe("combo");
			expect(tES("home.combo", { count: 5 })).toBe("combos");
		});
	});

	describe("detectLanguage — Intl.DateTimeFormat locale detection — AC #1/#2/#3", () => {
		const originalResolvedOptions =
			Intl.DateTimeFormat.prototype.resolvedOptions;

		afterEach(() => {
			Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions;
		});

		function mockLocale(locale: string) {
			Intl.DateTimeFormat.prototype.resolvedOptions = () =>
				({ locale }) as Intl.ResolvedDateTimeFormatOptions;
		}

		it("es device → Spanish (AC #1)", () => {
			mockLocale("es");
			expect(detectLanguage()).toBe("es");
		});

		it("es-MX device → Spanish variant (AC #1)", () => {
			mockLocale("es-MX");
			expect(detectLanguage()).toBe("es");
		});

		it("es-ES device → Spanish variant (AC #1)", () => {
			mockLocale("es-ES");
			expect(detectLanguage()).toBe("es");
		});

		it("en device → English (AC #2)", () => {
			mockLocale("en");
			expect(detectLanguage()).toBe("en");
		});

		it("fr device → English fallback (AC #2)", () => {
			mockLocale("fr");
			expect(detectLanguage()).toBe("en");
		});

		it("ja device → English fallback (AC #2)", () => {
			mockLocale("ja");
			expect(detectLanguage()).toBe("en");
		});

		it("Intl throws → English fallback (AC #2)", () => {
			Intl.DateTimeFormat.prototype.resolvedOptions = () => {
				throw new Error("Intl unavailable");
			};
			expect(detectLanguage()).toBe("en");
		});
	});

	describe("Wada name handling", () => {
		it("wadaHeader.labelFull includes raw nameJp and nameEn interpolated — AC #5", () => {
			const { i18n } = require("../index");
			const tEN = i18n.getFixedT("en");
			const result = tEN("wadaHeader.labelFull", {
				nameJp: "白紅色",
				nameEn: "Shiro-beni-iro",
				count: 3,
			});
			// Wada names are preserved as-is (interpolated, not translated)
			expect(result).toContain("白紅色");
			expect(result).toContain("Shiro-beni-iro");
		});
	});
});
