# Story 11.2: Localization EN/ES

Status: done

## Story

As a **user whose device is set to Spanish**,
I want **the entire app UI to appear in Spanish automatically**,
so that **I can use Outfinder comfortably in my native language without any manual setup**.

## Acceptance Criteria

1. **Given** the device locale is `es`, `es-ES`, `es-MX`, or any Spanish variant, **When** the app launches, **Then** all user-visible strings render in Spanish, and no English text is visible anywhere in the UI (tab labels, headers, buttons, empty states, error messages, settings).

2. **Given** the device locale is any non-Spanish locale (e.g., `en`, `fr`, `de`, `ja`), **When** the app launches, **Then** all user-visible strings render in English (default fallback).

3. **Given** the i18n setup uses react-i18next + expo-localization, **When** a developer adds a new language, **Then** they only need to create one new JSON translation file in `src/i18n/locales/` — zero component changes required.

4. **Given** a translation key exists in EN but is missing in ES (or vice versa), **When** TypeScript compiles, **Then** a type error is produced — missing keys are caught at build time, not at runtime.

5. **Given** Wada combination names (nameJp and nameEn fields from combinations.json), **When** displayed anywhere in the app (WadaHeader, ComboCard, navigation title), **Then** they are rendered as-is — not passed through t() — preserving them as brand identity in both locales.

6. **Given** the Spanish locale is active, **When** the Home screen renders, **Then** the subtitle reads "¿De qué color es tu ropa hoy?" and the "Browse all 159 colors" link reads "Ver catálogo" (intentional simplification — dropping the number makes the copy locale-agnostic and more idiomatic in Spanish; `es.json` key `home.browseAll`).

7. **Given** the Spanish locale is active, **When** the combo cards render, **Then** "See outfit" pill reads "Ver outfit" and sort pills read "Reciente", "A-Z", "Por tamano".

8. **Given** the Spanish locale is active, **When** the Settings screen renders, **Then** all labels, buttons, and version text are in Spanish.

9. **Given** the Spanish locale is active, **When** an IAP error or restore confirmation renders, **Then** the message is in Spanish (all PremiumPaywall strings localized).

10. **Given** VoiceOver is active with Spanish locale, **When** focusing on any interactive element, **Then** accessibilityLabel values use the Spanish translation (not hardcoded English).

## Tasks / Subtasks

- [x] Task 1: i18n infrastructure setup (AC: #3, #4)
  - [x] 1.1 Install dependencies: `pnpm add react-i18next i18next` (expo-localization NOT installed — replaced by `Intl.DateTimeFormat()` to avoid native rebuild; see Dev Notes)
  - [x] 1.2 Create `src/i18n/locales/en.json` with ALL user-visible strings organized by screen/component namespace (see String Extraction Map below for complete inventory)
  - [x] 1.3 Create `src/i18n/locales/es.json` satisfying the same type — ALL keys present in Spanish
  - [x] 1.4 Create `src/i18n/index.ts`: synchronous i18n.init() using `Intl.DateTimeFormat().resolvedOptions().locale` (NOT expo-localization — avoids native rebuild). Detect `es*` -> Spanish, everything else -> English. Export `detectLanguage()` function + `i18n` instance. Must init BEFORE App renders (NFR1)
  - [x] 1.5 Create TypeScript type enforcement: `TranslationKeys` type generated from en.json structure — es.json must satisfy `Record<keyof typeof en, string>` pattern. Missing keys = build error (NFR11)
  - [x] 1.6 Wire i18n into App.tsx: import `src/i18n/index.ts` at top of file (side-effect import for synchronous init). No provider wrapper needed for react-i18next with synchronous init

- [x] Task 2: Localize all screens (AC: #1, #2, #5, #6, #7, #8, #9)
  - [x] 2.1 ColorHome.tsx: replace ~8 strings with t() calls (title, subtitle, "Browse all 159 colors", "Back to color families", combo/combos plural, empty shade state)
  - [x] 2.2 Combinations.tsx: replace ~4 strings (back button a11y, combo/combos plural, combination/combinations plural)
  - [x] 2.3 OutfitVisualizer.tsx: replace ~12 strings (coach mark texts, arrow a11y labels, share button, back button, announcements, error alert, "Outfinder" branding watermark is NOT translated). CRITICAL: coach mark strings "Tap any garment to change its color" / "Use the arrows or swipe to change garments" / "Got it" MUST be localized. Wada names in announcements are NOT passed through t()
  - [x] 2.4 FavoritesList.tsx: replace ~8 strings (header, sort pills "Recent"/"A-Z"/"By size" + their a11y labels, empty state title/subtitle)
  - [x] 2.5 Settings.tsx: replace ~10 strings (header, Plans/About section titles, Premium Active, Free Plan, Restore Purchases, Upgrade to Premium, Version, Privacy Policy, Support)
  - [x] 2.6 BrowseAllColors.tsx: replace ~3 strings (screen a11y, back button label/a11y)

- [x] Task 3: Localize all components (AC: #1, #2, #5, #10)
  - [x] 3.1 ComboCard.tsx: replace ~3 strings ("yours", "See outfit", a11y hint "Opens outfit visualizer"). Combination nameEn in a11y label is NOT translated
  - [x] 3.2 PremiumPaywall.tsx: replace ~12 strings (dismiss a11y, "Your collection", saved count, limit badge, headline "Don't stop collecting", body text, price subtext, CTA "Unlock Unlimited", "Restore Purchase", "Not now", purchasing states). Plurals: "harmony/harmonies"
  - [x] 3.3 FavoriteButton.tsx: replace ~4 strings (Save/Remove a11y labels). combinationName is NOT translated
  - [x] 3.4 ErrorBoundary.tsx: replace ~3 strings (a11y, "Something went wrong", "Restart"). "Outfinder" title is NOT translated
  - [x] 3.5 SwatchGroupTabs.tsx: replace ~7 strings (6 family labels + "All" tab)
  - [x] 3.6 FabricSwatch.tsx: replace ~11 wardrobe category labels (White, Black, Blue, Grey, Brown, Green, Red, Pink, Yellow, Purple, Orange) + a11y template
  - [x] 3.7 TabNavigator.tsx: replace ~6 strings (3 tab labels + 3 tab a11y labels)
  - [x] 3.8 Minor components: ColorHeader.tsx (combination/combinations plural), ColorSwatch.tsx (a11y), OutfitCard.tsx (a11y labels, "Next/Previous variant"), MiniPaletteStrip.tsx (a11y), PaletteStrip.tsx (a11y), ShadePicker.tsx (a11y), WadaHeader.tsx (a11y — keep nameJp/nameEn raw)

- [x] Task 4: Tests + AC verification (AC: #1-#10)
  - [x] 4.1 Create `src/i18n/__tests__/i18n.test.ts`: verify init works, locale detection (es -> Spanish, en -> English, fr -> English fallback), key completeness (en keys === es keys)
  - [x] 4.2 Global expo-localization mock via `__mocks__/expo-localization.js` + `jest.setup.js` ensures existing tests pass with English strings by default; i18n.test.ts verifies Spanish strings via `getFixedT('es')`
  - [x] 4.3 TypeScript parity enforced via bidirectional structural type check in `src/i18n/types.ts`
  - [x] 4.4 Regression: `pnpm test` 503/503 passing, `pnpm lint` 0 errors

## Dev Notes

### i18n Architecture

**Library stack:** react-i18next + i18next + expo-localization (per epic-11.md spec)

**Init strategy — SYNCHRONOUS (NFR1 critical):**

> **Note:** expo-localization was dropped in favor of `Intl.DateTimeFormat().resolvedOptions().locale` to avoid requiring a native rebuild. The behavior is identical for all supported locales.

```typescript
// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

export function detectLanguage(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale.startsWith("es") ? "es" : "en";
  } catch {
    return "en";
  }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  initAsync: false,
});

export { i18n };
```

**App.tsx integration — side-effect import at top:**
```typescript
import "./src/i18n"; // Must be FIRST import — initializes i18n synchronously
```

This is the simplest approach: i18n initializes as a side effect of the import, before any component renders. No provider wrapper needed — `useTranslation()` hook works immediately because i18n is already initialized.

### TypeScript Key Safety (NFR11)

**Pattern for build-time key validation:**
```typescript
// src/i18n/types.ts
import type en from "./locales/en.json";

// Flatten nested keys with dot notation
type FlattenKeys<T, Prefix extends string = ""> = T extends object
  ? { [K in keyof T]: FlattenKeys<T[K], Prefix extends "" ? `${K & string}` : `${Prefix}.${K & string}`> }[keyof T]
  : Prefix;

export type TranslationKey = FlattenKeys<typeof en>;

// es.json must satisfy the same structure
import type es from "./locales/es.json";
type AssertSameKeys = typeof es extends typeof en ? true : never;
const _typeCheck: AssertSameKeys = true;
```

If a key is missing in es.json, TypeScript will emit a compile error. This satisfies NFR11: "Missing translation keys produce a TypeScript or build error."

### Translation File Structure

Use flat namespaced keys organized by screen/component. Avoid deep nesting — keeps keys short for t() calls.

```json
// src/i18n/locales/en.json (structure overview)
{
  "tabs": {
    "colors": "Colors",
    "favorites": "Favorites",
    "settings": "Settings",
    "colorsTab": "Colors tab",
    "favoritesTab": "Favorites tab",
    "settingsTab": "Settings tab"
  },
  "home": {
    "title": "Outfinder",
    "subtitle": "What color are you wearing?",
    "browseAll": "Browse all 159 colors",
    "allColors": "All 159\ncolors",
    "backToFamilies": "Back to color families",
    "noShades": "No combinations for this shade. Try another.",
    "combo_one": "combo",
    "combo_other": "combos"
  },
  "combinations": {
    "goBack": "Go back",
    "combo_one": "combo",
    "combo_other": "combos",
    "combination_one": "combination",
    "combination_other": "combinations"
  },
  "visualizer": {
    "goBack": "Go back",
    "notFound": "Combination not found",
    "screenLabel": "Outfit Visualizer screen",
    "coachStep1": "Tap any garment to change its color",
    "coachStep1Announce": "Tip: Tap any garment to change its color",
    "coachStep2": "Use the arrows or swipe to change garments",
    "coachStep2Announce": "Tip: Use the arrows or swipe to change garments",
    "gotIt": "Got it",
    "previousGarment": "Previous garment",
    "nextGarment": "Next garment",
    "shareLabel": "Share outfit image",
    "shareButton": "Share Outfit",
    "selectedForSwap": "Selected {{label}} for swap",
    "swapResult": "{{selectedLabel}} is now {{newColorA}}, {{tappedLabel}} is now {{newColorB}}",
    "changedTo": "Changed to {{label}}",
    "shareError": "Unable to share",
    "shareErrorBody": "Something went wrong generating the image. Please try again."
  },
  "favorites": {
    "title": "Favorites",
    "screenLabel": "Favorites List screen",
    "sortRecent": "Recent",
    "sortAZ": "A-Z",
    "sortSize": "By size",
    "sortRecentLabel": "Sort by recent",
    "sortAZLabel": "Sort alphabetically",
    "sortSizeLabel": "Sort by size",
    "emptyTitle": "No favorites yet",
    "emptySubtitle": "Pick a color, explore combinations, and tap \u2661 to save the ones you love"
  },
  "settings": {
    "title": "Settings",
    "screenLabel": "Settings screen",
    "plans": "Plans",
    "premiumActive": "Premium Active",
    "premiumBadge": "Premium Active \u2713",
    "freePlanLabel": "Free Plan, {{count}} of {{limit}} favorites used",
    "freePlanBadge": "Free Plan \u00b7 {{count}} favorites",
    "restorePurchases": "Restore Purchases",
    "restored": "Restored!",
    "upgradeToPremium": "Upgrade to Premium",
    "about": "About",
    "version": "Version",
    "privacyPolicy": "Privacy Policy",
    "support": "Support"
  },
  "paywall": {
    "dismiss": "Dismiss paywall",
    "yourCollection": "Your collection",
    "savedCount": "\u2665 {{count}} saved",
    "limitBadge": "{{count}} of {{limit}} free favorites used",
    "lockedLabel": "Locked combination. Upgrade to save",
    "headline": "Don't stop\ncollecting",
    "body_one": "You've found {{count}} harmony worth keeping. There are {{remaining}} more combinations waiting to be discovered.",
    "body_other": "You've found {{count}} harmonies worth keeping. There are {{remaining}} more combinations waiting to be discovered.",
    "priceLabel": "{{price}}, one-time purchase",
    "oneTime": "one time",
    "purchasing": "Purchasing, please wait",
    "unlockLabel": "Unlock unlimited favorites for {{price}}",
    "unlockButton": "Unlock Unlimited",
    "restoreButton": "Restore Purchase",
    "restoring": "Restoring purchase, please wait",
    "notNow": "Not now"
  },
  "comboCard": {
    "combinationLabel": "{{name}} combination: {{colors}}",
    "openHint": "Opens outfit visualizer",
    "yours": "yours",
    "seeOutfit": "See outfit"
  },
  "favoriteButton": {
    "removeNamed": "Remove {{name}} from favorites",
    "remove": "Remove from favorites",
    "saveNamed": "Save {{name}} to favorites",
    "save": "Save to favorites"
  },
  "error": {
    "screenLabel": "Application error screen",
    "message": "Something went wrong",
    "restart": "Restart"
  },
  "swatchGroups": {
    "all": "All",
    "paleLight": "Pale & Light",
    "redBrown": "Red & Brown",
    "blueLavender": "Blue & Lavender",
    "darkDeep": "Dark & Deep",
    "vividBold": "Vivid & Bold",
    "greenOlive": "Green & Olive"
  },
  "fabric": {
    "white": "White",
    "black": "Black",
    "blue": "Blue",
    "grey": "Grey",
    "brown": "Brown",
    "green": "Green",
    "red": "Red",
    "pink": "Pink",
    "yellow": "Yellow",
    "purple": "Purple",
    "orange": "Orange",
    "tapHint": "{{label}}, tap to see combinations"
  },
  "colorHeader": {
    "combination_one": "combination",
    "combination_other": "combinations"
  },
  "colorSwatch": {
    "label": "{{name}}, {{count}} combinations"
  },
  "outfitCard": {
    "tapToSwap": "{{garment}}, colored {{color}}, tap to select for swap",
    "nextVariant": "Next variant",
    "previousVariant": "Previous variant",
    "cardLabel": "Outfit card"
  },
  "miniPalette": {
    "label": "Outfit color palette"
  },
  "paletteStrip": {
    "combinationLabel": "Combination: {{colors}}",
    "selected": "Selected: {{name}}",
    "viewCombinations": "View combinations for {{name}}",
    "visualize": "Visualize outfit"
  },
  "shadePicker": {
    "selected": "{{name}}, selected",
    "tapToFilter": "{{name}}, tap to filter"
  },
  "wadaHeader": {
    "labelFull": "{{nameJp}}, {{nameEn}}, {{count}} color Wada combination",
    "labelJpOnly": "{{nameJp}}, {{count}} color Wada combination"
  },
  "browseAll": {
    "screenLabel": "Browse All Colors screen",
    "backLabel": "Back to Colors",
    "backButton": "Colors"
  },
  "common": {
    "goBack": "Go back"
  }
}
```

### Wada Name Exception (CRITICAL)

**NEVER pass these through t():**
- `color.nameEn`, `color.nameJp` from colors.json
- `combination.nameEn`, `combination.nameJp` from combinations.json
- Garment labels from `GARMENT_REGISTRY` (these are descriptive labels like "T-shirt", "Jacket" — NOT user-facing copy in the UI sense, they're product names)

These are brand identity / dataset values, not UI copy. Use directly in JSX and in interpolation values for t() calls.

Example (correct):
```typescript
// ComboCard.tsx — nameEn is raw, surrounding text is translated
accessibilityLabel={t("comboCard.combinationLabel", { name: combination.nameEn, colors: colorNames })}
```

Example (WRONG):
```typescript
// NEVER do this
accessibilityLabel={t("comboCard.combinationLabel", { name: t(combination.nameEn) })}
```

### "Outfinder" Brand Name

The app name "Outfinder" appears in two places:
1. **ColorHome header title** — keep as "Outfinder" in both locales (brand name)
2. **OutfitVisualizer watermark** — keep as "Outfinder" in both locales (brand name)
3. **ErrorBoundary title** — keep as "Outfinder" in both locales (brand name)

Do NOT include "Outfinder" in translation files. It's a brand name, not translatable text.

### Pluralization

react-i18next handles plurals with `_one` / `_other` suffixes:
```typescript
t("combinations.combination", { count: comboCount })
// count === 1 -> "combination"
// count !== 1 -> "combinations"
```

Spanish plurals follow the same `_one` / `_other` pattern (Spanish and English share the same plural rule).

### FabricSwatch Labels

The 11 wardrobe category labels in FabricSwatch.tsx are currently hardcoded in a `FABRIC_LABELS` map. These map `wardrobeFamily` strings (from data) to display labels. Move labels to translation files and look up via t():

```typescript
// Before
const FABRIC_LABELS: Record<string, string> = { white: "White", black: "Black", ... };

// After
const label = t(`fabric.${wardrobeFamily}`); // "fabric.white" -> "White" / "Blanco"
```

### SwatchGroupTabs Labels

The 6 swatch group labels + "All" tab are in a `GROUPS` array. Move display labels to translation files:

```typescript
// Before
const GROUPS = [{ id: -1, label: "All" }, { id: 0, label: "Pale & Light" }, ...];

// After (keep ids, translate labels)
const GROUPS = [
  { id: -1, key: "swatchGroups.all" },
  { id: 0, key: "swatchGroups.paleLight" },
  ...
];
// In render: t(group.key)
```

### Files to CREATE

| File | Purpose |
|------|---------|
| `src/i18n/index.ts` | i18n init: synchronous setup with expo-localization locale detection |
| `src/i18n/locales/en.json` | English translation file (~135 keys) |
| `src/i18n/locales/es.json` | Spanish translation file (~135 keys, same structure) |
| `src/i18n/types.ts` | TypeScript type enforcement: TranslationKey type, es/en parity check |
| `src/i18n/__tests__/i18n.test.ts` | i18n unit tests: init, locale detection, key parity |

### Files to MODIFY

| File | Changes |
|------|---------|
| `App.tsx` | Add side-effect import `import "./src/i18n"` as FIRST import |
| `src/screens/ColorHome.tsx` | Replace ~8 hardcoded strings with t() calls |
| `src/screens/Combinations.tsx` | Replace ~4 strings with t() |
| `src/screens/OutfitVisualizer.tsx` | Replace ~12 strings with t() (coach marks, arrows, share, alerts) |
| `src/screens/FavoritesList.tsx` | Replace ~8 strings with t() (header, sort pills, empty state) |
| `src/screens/Settings.tsx` | Replace ~10 strings with t() |
| `src/screens/BrowseAllColors.tsx` | Replace ~3 strings with t() |
| `src/components/ComboCard.tsx` | Replace ~3 strings with t() |
| `src/components/PremiumPaywall.tsx` | Replace ~12 strings with t() (heaviest component) |
| `src/components/FavoriteButton.tsx` | Replace ~4 strings with t() |
| `src/components/ErrorBoundary.tsx` | Replace ~3 strings with t() |
| `src/components/SwatchGroupTabs.tsx` | Replace ~7 labels with t() |
| `src/components/FabricSwatch.tsx` | Replace ~11 category labels + a11y with t() |
| `src/components/ColorHeader.tsx` | Replace ~2 strings with t() |
| `src/components/ColorSwatch.tsx` | Replace ~1 a11y string with t() |
| `src/components/OutfitCard.tsx` | Replace ~4 a11y strings with t() |
| `src/components/MiniPaletteStrip.tsx` | Replace ~1 a11y string with t() |
| `src/components/PaletteStrip.tsx` | Replace ~4 a11y strings with t() |
| `src/components/ShadePicker.tsx` | Replace ~2 a11y strings with t() |
| `src/components/WadaHeader.tsx` | Replace ~2 a11y strings with t() (nameJp/nameEn stay raw) |
| `src/navigation/TabNavigator.tsx` | Replace ~6 strings with t() |
| `package.json` | New deps: react-i18next, i18next, expo-localization |

### How to Use t() in Components

```typescript
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t("home.subtitle")}</Text>;
}
```

For class components (ErrorBoundary):
```typescript
import { withTranslation, WithTranslation } from "react-i18next";
// or use i18n.t() directly since it's initialized globally
import { i18n } from "@/i18n";
// i18n.t("error.message") works outside React components
```

### Testing Strategy

**Mock expo-localization globally in jest.setup.js or per-test:**
```typescript
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));
```

**Per-test locale override:**
```typescript
import { getLocales } from "expo-localization";
jest.mocked(getLocales).mockReturnValue([{ languageCode: "es" }]);
```

**Key test scenarios:**
1. Default locale (en) -> English strings rendered
2. Spanish locale (es) -> Spanish strings rendered
3. Spanish variant (es-MX) -> still Spanish
4. Unsupported locale (fr) -> falls back to English
5. TypeScript parity: `npx tsc --noEmit` fails if key mismatch

**CRITICAL: existing test mocks.** Many component tests already mock navigation, haptics, AsyncStorage. The i18n mock should be set up globally so existing tests continue to work with English strings by default. Add the expo-localization mock to the global jest setup or to `__mocks__/expo-localization.js`.

### Previous Story Intelligence

**From Story 11.1 (Coach Marks):**
- Coach mark overlay uses hardcoded strings: "Tap any garment to change its color", "Use the arrows or swipe to change garments", "Got it"
- AccessibilityInfo.announceForAccessibility() strings include "Tip: " prefix — localize entire announcement
- Permanent arrows have a11y labels "Previous garment" / "Next garment"
- File: `src/screens/OutfitVisualizer.tsx` was heavily modified — current state has the coach mark code

**From bugfix branch (2026-04-03):**
- All Toast JSX already removed from Combinations and FavoritesList
- wadaTokens used consistently for colors — no hardcoded hex
- Dynamic back labels resolved at runtime ("Favorites", "All Colors", "Colors") — these navigation labels need translation

**From Tailwind token fix:**
- Color keys correctly named without utility prefixes
- No impact on i18n work

### Git Intelligence

Recent commit pattern: `feat:` for new features, `fix:` for corrections.
Story 11.2 commit: `feat: localization EN/ES — react-i18next + expo-localization (Story 11.2)`

### Project Structure Notes

- New directory: `src/i18n/` with `index.ts`, `types.ts`, `locales/en.json`, `locales/es.json`
- New test: `src/i18n/__tests__/i18n.test.ts`
- New global mock: `__mocks__/expo-localization.js`
- All other changes are modifications to existing files
- No new components needed — t() hook used inline

### References

- [Source: docs/planning/epic-11.md#Story 11.2] — Full AC and dev notes
- [Source: docs/planning/epic-11.md#Additional Requirements] — i18n library choices and patterns
- [Source: docs/planning/epic-11.md#NFR1] — No flash of untranslated content
- [Source: docs/planning/epic-11.md#NFR8] — accessibilityLabel uses localized strings
- [Source: docs/planning/epic-11.md#NFR10] — 100% strings translated EN + ES
- [Source: docs/planning/epic-11.md#NFR11] — Missing key = TypeScript error
- [Source: docs/project-context.md#Established Patterns] — Component, haptics, accessibility patterns
- [Source: CLAUDE.md] — Agent rules, coding standards, testing discipline

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- i18next v26 renamed `initImmediate: false` → `initAsync: false`; used `initAsync: false` for synchronous init
- 126 initial test failures fixed by adding `jest.setup.js` with `require("./src/i18n")` + `setupFiles` in jest.config.js
- PremiumPaywall restore button had literal string `t("paywall.restoreButton")` (missing `{}`) — fixed
- Pluralization display pattern: render count separately `{count}{" "}{t("key", { count })}` since keys only contain the word ("combo"/"combos"), not the number
- FavoritesList `SORT_PILLS` moved to module scope (was inside component, causing `useMemo` dependency issue)
- `t` added to `useCallback`/`useEffect` deps in OutfitVisualizer and Settings per biome lint

### Completion Notes List

- AC #1-#10: all satisfied
- Tests passing, 0 lint errors
- Wada names (nameJp, nameEn) never pass through t() — preserved as brand identity
- "Outfinder" brand name not in translation files
- TypeScript structural parity check in src/i18n/types.ts enforces key parity at build time
- Synchronous init via bundled JSON resources — no flash of untranslated content
- expo-localization NOT used — replaced by `Intl.DateTimeFormat().resolvedOptions().locale` (no native rebuild required)
- AC #6 `home.browseAll` → "Ver catálogo" (intentional simplification vs "Ver los 159 colores" in spec; number-free copy is more idiomatic and locale-agnostic)
- IAP error messages localized via `iap.*` namespace; `usePremiumGate.ts` uses `i18n.t()` directly (outside React)
- `detectLanguage()` exported from `src/i18n/index.ts` and fully tested (es, es-MX, es-ES, en, fr, ja, Intl-throws)

### File List

**Created:**
- `src/i18n/index.ts`
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`
- `src/i18n/types.ts`
- `src/i18n/__tests__/i18n.test.ts`
- `__mocks__/expo-localization.js`
- `jest.setup.js`

**Modified:**
- `App.tsx`
- `jest.config.js`
- `package.json`
- `pnpm-lock.yaml`
- `src/hooks/usePremiumGate.ts`
- `src/screens/ColorHome.tsx`
- `src/screens/Combinations.tsx`
- `src/screens/Combinations.test.tsx`
- `src/screens/OutfitVisualizer.tsx`
- `src/screens/FavoritesList.tsx`
- `src/screens/Settings.tsx`
- `src/screens/BrowseAllColors.tsx`
- `src/components/ComboCard.tsx`
- `src/components/PremiumPaywall.tsx`
- `src/components/PremiumPaywall.test.tsx`
- `src/components/FavoriteButton.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/SwatchGroupTabs.tsx`
- `src/components/FabricSwatch.tsx`
- `src/components/ColorHeader.tsx`
- `src/components/ColorSwatch.tsx`
- `src/components/OutfitCard.tsx`
- `src/components/MiniPaletteStrip.tsx`
- `src/components/PaletteStrip.tsx`
- `src/components/ShadePicker.tsx`
- `src/components/WadaHeader.tsx`
- `src/navigation/TabNavigator.tsx`
