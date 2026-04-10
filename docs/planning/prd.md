---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation-skipped, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
status: complete
inputDocuments:
  - docs/project-context.md
  - docs/planning/epics-v2.md
  - docs/planning/prd-react-native-ios.md
workflowType: prd
classification:
  projectType: mobile_app
  domain: general
  complexity: low-medium
  projectContext: brownfield
---

# Product Requirements Document — Outfinder Epic 11

**Author:** Alejandro  
**Date:** 2026-04-04  
**Version:** v1.1 target (Epic 11)  
**App Status:** v1.0.2 live on App Store

## Executive Summary

Outfinder is a published iOS app that transforms Sanzo Wada's "A Dictionary of Color Combinations" into a visual outfit coordination tool. Users select a garment color from a wardrobe-first interface (11 families, 159 Wada colors), explore curated harmonious palettes, and visualize them as Skia-tinted clothing photos in a shareable editorial card. The home redesign (Epics 8–9) and Visualizer adjustments (Epic 10) are complete and live.

Epic 11 extends Outfinder's reach across three dimensions: a focused Visualizer-centric onboarding, Spanish/English localization with automatic device language detection, and full iPad layout optimization across all iPad form factors.

### What Makes This Special

Sanzo Wada's 1930s academic color theory becomes immediately actionable when rendered as wearable outfit visualization — not abstract color wheels. The Outfit Visualizer (real garment photos, Skia ColorMatrix tinting, warm editorial aesthetic) is the feature that converts browsers into believers. Epic 11 unlocks this moment faster for new users (coach marks targeting the Visualizer), broadens the addressable audience (Spanish — ~500M native speakers), and eliminates the broken iPad experience that prevents tablet users from staying.

### Project Classification

- **Type:** Mobile App — React Native 0.83 + Expo SDK 55, iOS-only
- **Domain:** General — lifestyle / fashion / color coordination
- **Complexity:** Low-medium — no regulated domain, client-side only, static dataset
- **Context:** Brownfield — all existing patterns, architecture, and components are preserved and extended

## Success Criteria

### User Success

- New users grasp the Visualizer interaction (tap garment = change color, swipe/arrows = change garment) within the first session without reading any text
- Spanish-speaking users use the entire app UI in their native language with no English fallbacks visible
- iPad users (mini, Air, Pro 11", Pro 13") experience a layout that uses screen space appropriately — not a stretched iPhone UI
- Navigation arrows (< >) are permanently visible in the Visualizer, eliminating the discoverability gap reported by users

### Business Success

- App Store rating maintained ≥ 4.5 stars post-update
- App Store listing updated with screenshots reflecting the Epic 8–10 redesigned UI
- App surfaces to Spanish-language search queries via localized metadata
- No increase in crash rates or user-reported bugs vs v1.0.2 baseline

### Technical Success

- i18n architecture (react-i18next + expo-localization) allows adding a new language via one translation JSON file — no component changes
- All 518 existing tests pass without modification
- iPad layouts validated on Simulator: iPad mini 6th gen, iPad Air 11" M2, iPad Pro 11" M4, iPad Pro 13" M4
- Coach marks gated by first-launch AsyncStorage flag — never shown twice

### Measurable Outcomes

- 0 broken layouts on any supported iPad form factor
- 100% of user-visible strings translated in EN + ES at launch
- Onboarding completion in ≤ 2 coach mark steps before free exploration

## Product Scope

### MVP — Epic 11

1. **Onboarding v2** — 2-step coach mark overlay (tap garment + swipe/arrows) shown on first launch only; permanent < > arrows in Visualizer; existing 4-step onboarding replaced
2. **Localization EN/ES** — react-i18next + expo-localization; complete EN + ES translation files; auto-detect from device locale (EN default); Wada names kept as JP + EN brand identity (not translated); extensible by adding one JSON file per language
3. **iPad layouts** — All screens adaptive for iPad mini through iPad Pro 13"; no fixed-width layout assumptions; Visualizer card proportions adapted; portrait + landscape supported

### Growth (Post-Epic 11)

- 6 new App Store screenshots reflecting redesigned UI + Spanish metadata
- French (FR) localization — second priority European market

### Vision

- 5+ languages (FR, DE, IT, PT-BR, JA)
- Localized App Store presence in top 5 markets
- Contextual in-app tips beyond first-launch

## User Journeys

### Journey 1: New User — First Launch

**Persona:** Lucía, 28, downloads Outfinder after seeing an Instagram reel showing an outfit built from a Wada palette. No prior context.

Lucía taps "Blue" on the wardrobe home → shade picker + combo feed. She taps "Cobalt & Cream" → Visualizer opens. Two tinted garments appear on a warm editorial background. She's impressed but doesn't know what to do.

A coach mark overlay appears: *"Tap any garment to change its color."* She taps the shirt. Color changes. Second overlay: *"Use arrows or swipe to change garments."* She swipes right. Trousers swap for a jacket. She taps OK. From here she explores freely — tapping, swiping — without needing further guidance. She saves the combination and shares to Instagram. The arrows remain permanently visible on every future session.

**Requirements revealed:** First-launch AsyncStorage flag, 2-step coach mark overlay, permanent < > arrows in Visualizer.

---

### Journey 2: Spanish Speaker

**Persona:** Carlos, 35, iPhone set to Spanish (Spain). Finds Outfinder on the App Store.

Carlos opens the app: *"¿De qué color es tu ropa hoy?"* on home, *"Ver outfit"* on combo cards, *"Favoritos"* on tab. He explores *Marrón* combinations. The Wada header shows JP name + EN transliteration (brand identity, intentionally not translated). Navigation title and all UI chrome are in Spanish. Settings, error messages, and IAP confirmation dialogs are fully localized.

**Requirements revealed:** expo-localization auto-detect, complete ES translation file, Wada names kept bilingual.

---

### Journey 3: iPad User

**Persona:** María, 42, uses an iPad Pro 13" as her primary browsing device.

Currently (v1.0.2): stretched iPhone UI, tiny elements in a sea of white space. She nearly deletes the app.

Post-Epic 11: The home swatch grid adapts to the wider layout with richer card proportions. The Visualizer card is centered with appropriate editorial scale. The warm background fills the screen. María uses Outfinder regularly as a mood board before shopping trips.

**Requirements revealed:** Adaptive layouts for all iPad sizes, breakpoint-aware component sizing, Visualizer card proportions for larger screens.

---

### Journey 4: Returning User — Arrow Discovery

**Persona:** Diego, 31, uses Outfinder since v1.0.1. He discovered garment swap accidentally and forgets it exists between sessions.

Post-Epic 11: Diego opens the Visualizer. The < > arrows are always visible. He now uses garment swapping every session — jacket, trousers, shirt cycling through the registry.

**Requirements revealed:** Permanent < > arrows in Visualizer, not gated by onboarding completion.

### Journey → Capability Map

| Capability | Journeys | Priority |
|-----------|---------|---------|
| First-launch flag + coach mark overlay | J1 | MVP |
| Permanent Visualizer navigation arrows | J1, J4 | MVP |
| expo-localization + react-i18next | J2 | MVP |
| Complete EN + ES translation files | J2 | MVP |
| Wada names kept JP + EN (not translated) | J2 | MVP |
| Adaptive iPad layouts (all sizes) | J3 | MVP |
| Visualizer card proportions for iPad | J3 | MVP |

## Mobile App Requirements

### Platform Support

| Platform | Status | Notes |
|---------|--------|-------|
| iPhone SE 3rd gen → iPhone 16 Pro Max | Existing, maintained | Portrait only |
| iPad mini 6th gen (8.3") | New in Epic 11 | Portrait only (locked) |
| iPad Air 11" M2 | New in Epic 11 | Portrait only (locked) |
| iPad Pro 11" M4 | New in Epic 11 | Portrait only (locked) |
| iPad Pro 13" M4 | New in Epic 11 | Portrait only (locked) |
| Android | Out of scope | iOS-only MVP decision maintained |

- No new device permissions in Epic 11 (haptics + share sheet unchanged; expo-localization requires no permission)
- Full offline functionality maintained — translation strings bundled as JSON, no network required
- No new entitlements, capabilities, or privacy manifest changes needed

### Store Compliance

- App Store submission: updated screenshots required for Epic 8–10 redesigned UI
- Spanish App Store metadata (title, description, keywords) alongside EN
- iPad screenshots required once iPad support ships
- No new entitlements or privacy manifest changes

## Risk Mitigation

**i18n retrofit risk:** Missing strings on existing codebase. Mitigation: typed translation keys with TypeScript — missing key = build error, not silent empty string.

**iPad layout risk:** Significant refactoring across all screens. Mitigation: Dimensions API + platform checks per screen; no responsive grid library; test incrementally; iPhone SE is always baseline.

**Coach mark positioning risk:** z-index conflicts on different screen sizes. Mitigation: validate on iPhone SE (smallest) and iPad Pro 13" (largest) during development.

**Scope risk:** iPad story may grow beyond 4-5 task limit. Mitigation: split into "primary screens" (Home, Visualizer, Favorites) + "secondary screens" (Combinations, Settings, BrowseAllColors) if needed.

## Functional Requirements

### Onboarding & Discoverability

- FR1: New users can view a focused first-launch walkthrough teaching the core Visualizer interaction (tapping a garment changes its color)
- FR2: New users can learn garment navigation (swipe or arrow buttons) through a first-launch guided hint
- FR3: Users can always see garment navigation arrow affordances in the Outfit Visualizer, regardless of onboarding state
- FR4: The first-launch walkthrough appears exactly once — never repeats after completion or dismissal
- FR5: Users can dismiss any coach mark overlay and proceed to use the app immediately

### Localization

- FR6: Users with a Spanish device locale can use the entire app UI in Spanish
- FR7: Users with any non-Spanish locale experience the app UI in English by default
- FR8: All user-visible interface strings are centralized in per-language translation files
- FR9: Developers can add a new language by providing one translation file — no component changes required
- FR10: The app detects and applies the user's device locale automatically; no in-app language selector
- FR11: Sanzo Wada combination names (JP + EN transliterations) are displayed as brand identity — not translated in any locale

### iPad Layout Adaptation

- FR12: Users on iPad mini (8.3") can access all app screens with a correctly adapted layout
- FR13: Users on iPad Air 11" can access all app screens with appropriate use of the larger screen
- FR14: Users on iPad Pro 11" can access all app screens with appropriate use of the larger screen
- FR15: Users on iPad Pro 13" can access all app screens with appropriate use of the larger screen
- FR16: The Home wardrobe swatch grid adapts proportions to iPad screen dimensions
- FR17: The Outfit Visualizer card maintains editorial proportions and visual hierarchy on iPad
- FR18: The Favorites 2-column grid adapts card sizing and spacing to iPad screen dimensions
- FR19: The Combinations combo card feed adapts card width and spacing to iPad screen dimensions
- FR20: Tab bar, navigation headers, and modal elements display correctly across all iPad form factors

### Core Capabilities (Existing — Maintained)

- FR21: Users can browse 159 Wada colors by wardrobe family and shade
- FR22: Users can view curated palette combinations for any selected color
- FR23: Users can visualize palette combinations as tinted garments in the Outfit Visualizer
- FR24: Users can save and retrieve favorite combinations across sessions
- FR25: Users can share outfit visualizations via the native iOS share sheet
- FR26: Free users can save up to 5 favorites; premium users have unlimited saves

## Non-Functional Requirements

### Performance

- NFR1: Device locale detection and language application completes before the first screen renders — no flash of untranslated content
- NFR2: Coach mark overlays render without perceptible delay after the Visualizer loads
- NFR3: iPad layout adaptations are computed at render time via Dimensions API — no layout jumps after initial paint
- NFR4: All Visualizer animations respect `useReducedMotion()` — skipped entirely when Reduce Motion is enabled in iOS Settings

### Accessibility

- NFR5: All new interactive elements (coach mark overlays, dismiss buttons, permanent nav arrows) have `accessibilityLabel` and `accessibilityRole`
- NFR6: Minimum touch target 44×44pt on both iPhone and iPad
- NFR7: VoiceOver announces coach mark overlays correctly with dismiss action
- NFR8: `accessibilityLabel` values use localized strings — VoiceOver reads in the user's language
- NFR9: iPad-adapted layouts maintain correct VoiceOver reading order

### Localization Quality

- NFR10: 100% of user-visible strings translated in EN + ES at launch — no English fallbacks in Spanish locale
- NFR11: Missing translation keys produce a TypeScript or build error — not a silent empty string
- NFR12: Locale-aware APIs (expo-localization) used for any date, number, or list formatting — no hardcoded formats

### Compatibility

- NFR13: All 518 existing tests pass without modification post-Epic 11
- NFR14: iPhone SE 3rd gen remains the baseline — no regressions on the smallest supported device
- NFR15: iPad app is locked to portrait orientation via expo-orientation — same constraint as iPhone
