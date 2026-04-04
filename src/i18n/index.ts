import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

// DEBUG: set to "es" to test Spanish, null for auto-detect
const DEBUG_LANGUAGE: "es" | "en" | null = null;

export function detectLanguage(): string {
	if (DEBUG_LANGUAGE) return DEBUG_LANGUAGE;
	try {
		const locale = Intl.DateTimeFormat().resolvedOptions().locale;
		return locale.startsWith("es") ? "es" : "en";
	} catch {
		return "en";
	}
}

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		es: { translation: es },
	},
	lng: detectLanguage(),
	fallbackLng: "en",
	interpolation: { escapeValue: false },
	initAsync: false,
});

export { i18n };
