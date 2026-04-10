---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - docs/planning/prd.md
  - docs/planning/architecture-react-native-ios.md
  - docs/planning/ux-design-specification-ios.md
  - docs/project-context.md
---

# Outfinder Epic 11 — v1.1 Polish & Reach

## Overview

This document provides the complete epic and story breakdown for Outfinder Epic 11, decomposing requirements from the PRD into implementable stories. This is a brownfield extension of a published app (v1.0.2). All existing patterns from project-context.md apply.

## Requirements Inventory

### Functional Requirements

FR1: New users can view a focused first-launch walkthrough teaching the core Visualizer interaction (tapping a garment changes its color)
FR2: New users can learn garment navigation (swipe or arrow buttons) through a first-launch guided hint
FR3: Users can always see garment navigation arrow affordances in the Outfit Visualizer, regardless of onboarding state
FR4: The first-launch walkthrough appears exactly once — never repeats after completion or dismissal
FR5: Users can dismiss any coach mark overlay and proceed to use the app immediately
FR6: Users with a Spanish device locale can use the entire app UI in Spanish
FR7: Users with any non-Spanish locale experience the app UI in English by default
FR8: All user-visible interface strings are centralized in per-language translation files
FR9: Developers can add a new language by providing one translation file — no component changes required
FR10: The app detects and applies the user's device locale automatically; no in-app language selector
FR11: Sanzo Wada combination names (JP + EN transliterations) are displayed as brand identity — not translated in any locale
FR12: Users on iPad mini (8.3") can access all app screens with a correctly adapted layout
FR13: Users on iPad Air 11" can access all app screens with appropriate use of the larger screen
FR14: Users on iPad Pro 11" can access all app screens with appropriate use of the larger screen
FR15: Users on iPad Pro 13" can access all app screens with appropriate use of the larger screen
FR16: The Home wardrobe swatch grid adapts proportions to iPad screen dimensions
FR17: The Outfit Visualizer card maintains editorial proportions and visual hierarchy on iPad
FR18: The Favorites 2-column grid adapts card sizing and spacing to iPad screen dimensions
FR19: The Combinations combo card feed adapts card width and spacing to iPad screen dimensions
FR20: Tab bar, navigation headers, and modal elements display correctly across all iPad form factors
FR21: Users can browse 159 Wada colors by wardrobe family and shade (existing, maintained)
FR22: Users can view curated palette combinations for any selected color (existing, maintained)
FR23: Users can visualize palette combinations as tinted garments in the Outfit Visualizer (existing, maintained)
FR24: Users can save and retrieve favorite combinations across sessions (existing, maintained)
FR25: Users can share outfit visualizations via the native iOS share sheet (existing, maintained)
FR26: Free users can save up to 5 favorites; premium users have unlimited saves (existing, maintained)

### Non-Functional Requirements

NFR1: Device locale detection and language application completes before the first screen renders — no flash of untranslated content
NFR2: Coach mark overlays render without perceptible delay after the Visualizer loads
NFR3: iPad layout adaptations computed at render time via Dimensions API — no layout jumps after initial paint
NFR4: All Visualizer animations respect useReducedMotion() — skipped entirely when Reduce Motion is enabled
NFR5: All new interactive elements have accessibilityLabel and accessibilityRole (coach mark overlays, dismiss buttons, permanent nav arrows)
NFR6: Minimum touch target 44×44pt on both iPhone and iPad
NFR7: VoiceOver announces coach mark overlays correctly with dismiss action
NFR8: accessibilityLabel values use localized strings — VoiceOver reads in the user's language
NFR9: iPad-adapted layouts maintain correct VoiceOver reading order
NFR10: 100% of user-visible strings translated in EN + ES at launch — no English fallbacks in Spanish locale
NFR11: Missing translation keys produce a TypeScript or build error — not a silent empty string
NFR12: Locale-aware APIs used for any date, number, or list formatting — no hardcoded formats
NFR13: All 518 existing tests pass without modification post-Epic 11
NFR14: iPhone SE 3rd gen remains the baseline — no regressions on the smallest supported device
NFR15: iPad app is locked to portrait orientation — same as iPhone (expo-orientation applied globally in App.tsx)

### Additional Requirements

From Architecture (existing patterns — must follow):
- Function declarations with named exports (never export default, except App.tsx)
- NativeWind className for static styles — never StyleSheet.create
- style={{}} only for dynamic Wada color values
- Props interface required: interface {ComponentName}Props
- Haptics only through lib/haptics.ts — never import expo-haptics directly
- useReducedMotion() check before any animation
- Co-located test files next to source files
- testID attributes (React Native convention)
- AsyncStorage pattern established (favorites) — same pattern for first-launch flag
- All hooks called before any early returns

New for Epic 11:
- i18n: react-i18next + expo-localization. Translation files as JSON. TypeScript types for translation keys
- iPad: Dimensions API + platform checks per screen. No responsive grid library. iPhone SE always baseline. Portrait-only locked via expo-orientation (no landscape support on iPad)
- Coach marks: Overlay approach (Modal or absolute positioned View). Z-index must not conflict with Skia Canvas
- First-launch flag: AsyncStorage key @outfinder/onboarding-complete (boolean). Same pattern as favorites

No starter template — brownfield project extending existing codebase.

### FR Coverage Map

| FR | Epic.Story | Description |
|----|-----------|-------------|
| FR1 | 11.1 | First-launch coach mark — tap garment interaction |
| FR2 | 11.1 | First-launch coach mark — swipe/arrows navigation |
| FR3 | 11.1 | Permanent < > arrows in Visualizer |
| FR4 | 11.1 | AsyncStorage first-launch gate |
| FR5 | 11.1 | Dismiss coach marks |
| FR6 | 11.2 | Spanish locale full UI |
| FR7 | 11.2 | English default locale |
| FR8 | 11.2 | Centralized translation files |
| FR9 | 11.2 | Extensible by new JSON file |
| FR10 | 11.2 | Auto-detect device locale |
| FR11 | 11.2 | Wada names not translated |
| FR12 | 11.3a + 11.3b | iPad mini layout |
| FR13 | 11.3a + 11.3b | iPad Air 11" layout |
| FR14 | 11.3a + 11.3b | iPad Pro 11" layout |
| FR15 | 11.3a + 11.3b | iPad Pro 13" layout |
| FR16 | 11.3a | Home swatch grid adapts to iPad |
| FR17 | 11.3a | Visualizer card proportions on iPad |
| FR18 | 11.3a | Favorites grid adapts to iPad |
| FR19 | 11.3b | Combinations feed adapts to iPad |
| FR20 | 11.3b | Tab bar + headers on iPad |
| FR21-26 | existing | Maintained, no story needed |

**Coverage: 20/20 new FRs mapped. 6 existing FRs maintained without stories. iPad split into 11.3a (primary screens) + 11.3b (secondary screens). iPad orientation: portrait-only (locked).**

## Epic List

- **Epic 11:** v1.1 Polish & Reach
  - Story 11.1: Onboarding v2 — Coach Marks + Permanent Arrows
  - Story 11.2: Localization EN/ES
  - Story 11.3a: iPad Layout — Primary Screens (Home, Visualizer, Favorites)
  - Story 11.3b: iPad Layout — Secondary Screens (Combinations, Settings, Tab Bar)

---

## Epic 11: v1.1 Polish & Reach

Users experience a focused Visualizer-centric onboarding, a fully localized UI in English or Spanish, and a properly adapted layout on all iPad form factors — expanding Outfinder's reach and reducing new-user friction.

**FRs covered:** FR1–FR20  
**NFRs:** NFR1–NFR15

---

### Story 11.1: Onboarding v2 — Visualizer Coach Marks + Permanent Arrows

As a **new user opening the Outfit Visualizer for the first time**,
I want **a focused 2-step coach mark overlay that teaches me how to interact with garments and navigate between them**,
So that **I understand the core Visualizer interaction immediately without reading any documentation**.

**Acceptance Criteria:**

**Given** the user opens the OutfitVisualizer for the first time (AsyncStorage key `@outfinder/visualizer-introduced` is absent or false)
**When** the Visualizer finishes rendering
**Then** a coach mark overlay appears as an absolute-positioned View covering the screen (semi-transparent backdrop)
**And** Step 1 text reads "Tap any garment to change its color" centered over the garment area
**And** an "OK" button is shown below the instruction (min 44×44pt, accessibilityRole="button")

**Given** the user taps "OK" on Step 1
**When** the tap registers
**Then** hapticLight() fires
**And** the overlay transitions to Step 2 (same overlay, updated content)
**And** Step 2 text reads "Use the arrows or swipe to change garments"
**And** the < > arrows are visually highlighted/indicated in the overlay

**Given** the user taps "OK" on Step 2
**When** the tap registers
**Then** hapticLight() fires
**And** the overlay dismisses completely
**And** AsyncStorage.setItem('@outfinder/visualizer-introduced', 'true') is called
**And** the user can interact with the Visualizer freely

**Given** the user has previously completed or dismissed the coach marks (AsyncStorage key exists)
**When** they open the Visualizer on any subsequent visit
**Then** no coach mark overlay appears

**Given** the Visualizer renders (any visit, new or returning)
**When** the OutfitCard displays
**Then** the < > navigation arrows are always visible as permanent UI elements (not hidden until onboarding)
**And** they are styled consistently with the existing Visualizer aesthetic (subtle, non-intrusive)
**And** they have accessibilityLabel "Previous garment" / "Next garment" and accessibilityRole="button"

**Given** the existing Onboarding screen (Onboarding.tsx and onboarding/ preview components)
**When** Epic 11 ships
**Then** the existing 4-step full-screen onboarding flow is removed from the app
**And** App.tsx no longer shows Onboarding conditionally on first launch
**And** the onboarding/ component folder and Onboarding.tsx are deleted (dead code cleanup)

**Given** VoiceOver is active when coach marks appear
**When** the overlay renders
**Then** it announces "Tip: Tap any garment to change its color" with accessibilityRole="alert"
**And** the OK button is reachable and announces "Got it"

**Dev Notes:**
- Coach mark overlay: absolute-positioned View with `zIndex: 999` rendered at the OutfitVisualizer screen level — NOT inside the Skia Canvas
- AsyncStorage key: `@outfinder/visualizer-introduced` (string 'true' — same pattern as favorites)
- Permanent arrows: currently gated by onboarding state in OutfitVisualizer — remove the gate, always render them
- Existing onboarding AsyncStorage key `@outfinder/onboarding-seen` can be removed alongside the old screen
- Reduce Motion: coach mark appearance is instant (no animation) — no `useReducedMotion()` check needed for static overlay
- Tests: first-visit flag absent → overlay shown; flag present → no overlay; OK tap → flag saved; arrows always visible

---

### Story 11.2: Localization EN/ES

As a **user whose device is set to Spanish**,
I want **the entire app UI to appear in Spanish automatically**,
So that **I can use Outfinder comfortably in my native language without any manual setup**.

**Acceptance Criteria:**

**Given** the device locale is `es`, `es-ES`, `es-MX`, or any Spanish variant
**When** the app launches
**Then** all user-visible strings render in Spanish
**And** no English text is visible anywhere in the UI (tab labels, headers, buttons, empty states, error messages, settings)

**Given** the device locale is any non-Spanish locale (e.g., `en`, `fr`, `de`, `ja`)
**When** the app launches
**Then** all user-visible strings render in English (default fallback)

**Given** the i18n setup uses react-i18next + expo-localization
**When** a developer adds a new language
**Then** they only need to create one new JSON translation file in `src/i18n/locales/` — zero component changes required

**Given** a translation key exists in EN but is missing in ES (or vice versa)
**When** TypeScript compiles
**Then** a type error is produced — missing keys are caught at build time, not at runtime

**Given** Wada combination names (nameJp and nameEn fields from combinations.json)
**When** displayed anywhere in the app (WadaHeader, ComboCard, navigation title)
**Then** they are rendered as-is — not passed through t() — preserving them as brand identity in both locales

**Given** the Spanish locale is active
**When** the Home screen renders
**Then** the subtitle reads "¿De qué color es tu ropa hoy?" and the "Browse all 159 colors" link reads "Ver los 159 colores"

**Given** the Spanish locale is active
**When** the combo cards render
**Then** "See outfit" pill reads "Ver outfit" and sort pills read "Reciente", "A-Z", "Por tamaño"

**Given** the Spanish locale is active
**When** the Settings screen renders
**Then** all labels, buttons, and version text are in Spanish

**Given** the Spanish locale is active
**When** an IAP error or restore confirmation renders
**Then** the message is in Spanish (all PremiumPaywall strings localized)

**Given** VoiceOver is active with Spanish locale
**When** focusing on any interactive element
**Then** accessibilityLabel values use the Spanish translation (not hardcoded English)

**Dev Notes:**
- Library setup: `pnpm add react-i18next i18next expo-localization`
- Translation files: `src/i18n/locales/en.json` and `src/i18n/locales/es.json`
- TypeScript key types: generate a `TranslationKeys` type from the EN file — ES must satisfy the same type
- i18n init: `src/i18n/index.ts` — call `i18n.init()` synchronously before App renders (Expo managed, no lazy loading needed)
- Wada names exception: `nameJp`, `nameEn` from data layer are NEVER passed to `t()` — document this in a code comment where they're rendered
- `expo-localization` provides `getLocales()[0].languageCode` — use this to set i18next language on init
- All hardcoded user-visible strings in: ColorHome, Combinations, OutfitVisualizer, FavoritesList, Settings, PremiumPaywall, EmptyState, onboarding coach marks (Story 11.1), WadaHeader subtitle ("N colors · Sanzo Wada" → localized)
- Tests: mock expo-localization to return 'es' → verify Spanish strings; return 'en' → verify English strings; missing key → TypeScript error in CI

---

### Story 11.3a: iPad Layout — Primary Screens

As a **user on any iPad opening the main app screens**,
I want **Home, Visualizer, and Favorites to display correctly with layouts that make proper use of the larger screen**,
So that **I can use Outfinder on my tablet without broken or stretched UI**.

**Acceptance Criteria:**

**Given** the app launches on iPad (any form factor)
**When** the app initializes
**Then** orientation is locked to portrait (same as iPhone — no landscape mode)
**And** `useIsIPad()` returns true when `Dimensions.get('window').width ≥ 768pt`

**Given** the Home screen renders on iPad
**When** the swatch grid displays
**Then** FabricSwatch cards use 3 columns (vs 2 on iPhone), filling the screen naturally
**And** card sizing and spacing scale to the wider canvas

**Given** the Outfit Visualizer renders on iPad
**When** the editorial card displays
**Then** WarmBackground fills the full screen
**And** OutfitCard is centered and capped at ~520pt width — not stretched to screen width
**And** garment silhouettes maintain proportional scale (not disproportionately large)

**Given** the Favorites screen renders on iPad
**When** the combo card grid displays
**Then** large iPads (width ≥ 1024pt) use 3 columns; iPad mini/Air use 2 columns with wider cards
**And** spacing and padding adapt to the larger canvas

**Given** VoiceOver is active on iPad (any primary screen)
**When** navigating Home, Visualizer, or Favorites
**Then** reading order is logical and no elements are skipped or duplicated

**Dev Notes:**
- Create `useIsIPad()` hook (and `isIPad` boolean export) in `src/lib/device.ts`: `Dimensions.get('window').width >= 768`
- Lock portrait: use `expo-orientation` `lockAsync(OrientationLock.PORTRAIT_UP)` in App.tsx on mount — applies to both iPhone and iPad
- No responsive grid library — plain conditional: `numColumns={isIPad ? 3 : 2}`, `maxWidth={isIPad ? 520 : undefined}`
- OutfitCard: wrap in a centered container with `maxWidth: 520, alignSelf: 'center'` on iPad
- Favorites: `numColumns={width >= 1024 ? 3 : 2}` — use `Dimensions.get('window').width` directly here for the fine-grained split
- iPhone SE (375pt) always tested first — no regressions on smallest supported device
- Tests: mock `Dimensions.get` → width 768 → `isIPad` true → verify numColumns 3; width 375 → `isIPad` false → numColumns 2

---

### Story 11.3b: iPad Layout — Secondary Screens

As a **user on any iPad browsing combinations, settings, or navigating tabs**,
I want **Combinations, Settings, BrowseAllColors, and navigation chrome to display correctly on the larger screen**,
So that **every part of the app feels native and purposeful on iPad — not a stretched iPhone layout**.

**Acceptance Criteria:**

**Given** the Combinations / State 2 combo feed renders on iPad
**When** combo cards display in the horizontal scroll or list
**Then** card widths adapt to iPad screen width (not fixed iPhone width)
**And** padding and spacing scale proportionally

**Given** the Settings screen renders on iPad
**When** any iPad form factor is used
**Then** no element is stretched, clipped, or mis-aligned
**And** touch targets remain ≥44×44pt

**Given** the BrowseAllColors screen renders on iPad
**When** the color list or grid displays
**Then** layout uses available horizontal space without awkward stretching

**Given** the tab bar renders on iPad
**When** any tab is active
**Then** the tab bar displays correctly with appropriate sizing and spacing
**And** navigation headers render without overflow or truncation on any iPad width

**Given** the app runs on iPad mini 6th gen, iPad Air 11", iPad Pro 11", or iPad Pro 13"
**When** any secondary screen renders
**Then** no element is stretched, clipped, or positioned incorrectly
**And** the UI is balanced and readable across all form factors

**Given** VoiceOver is active on iPad (any secondary screen)
**When** navigating Combinations, Settings, or BrowseAllColors
**Then** reading order is logical and no elements are skipped or duplicated

**Dev Notes:**
- Reuse `isIPad` from `src/lib/device.ts` (created in Story 11.3a) — no new detection logic
- Combinations feed: apply `maxWidth` cap or percentage-based width to ComboCard on iPad; horizontal padding scales with screen width
- Settings: typically list-based — likely just needs horizontal padding guard (`paddingHorizontal: isIPad ? 40 : 16`)
- BrowseAllColors: check if it uses FlatList — if so, same `numColumns` or card width pattern as Home
- Tab bar: Expo Router / React Navigation default tab bar should render fine on iPad; verify labels don't truncate on iPad mini
- Tests: mock Dimensions → iPad width → verify Combinations card max-width applied; Settings padding; SE regression unchanged

