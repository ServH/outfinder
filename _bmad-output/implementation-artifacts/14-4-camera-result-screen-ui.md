# Story 14.4: Camera result screen UI — cutout + Wada tone + combinations count + two CTAs

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user who just photographed a garment on the unified camera (Story 14.3b pipeline) and needs to see the magic moment — cutout on warm paper, detected Wada tone stack, and two clear next steps**,
I want **the `UnifiedCameraResultScreen` rebuilt from its 14.3b diagnostic placeholder into the real UX-DR1 layout: (a) the transparent-PNG cutout rendered at 220pt height centered on `bg-paper`, (b) the Wada name stack below it (EN `nameEn` 28pt NotoSerifJP Medium → JP `nameJp` + romaji 18pt NotoSerifJP Regular muted), (c) a single combinations count line ("Aparece en N combinaciones") sourced from `getCombinations(colorId).length` with i18n plural, (d) a conditional tone-correction section that appears only when the match is ambiguous (`wadaMatch.type === "confirm"` AND `top3[1].deltaE < 8`), showing two swatches side-by-side with a *"¿Es éste el tono correcto?"* prompt that lets the user pick the alternate candidate and have the combinations-count + downstream nav re-derive from the confirmed tone, (e) a full-width primary CTA "Guardar en mi armario" at 48pt height with bg tinted by the confirmed Wada hex and label color chosen by luminance rule (Wada relative luminance > 0.40 → dark text `#2d2a26`; ≤ 0.40 → cream `#faf7f2`) per Pencil frame `EZ4EA`, and (f) a secondary underlined text link "ver combinaciones sin guardar" below the primary CTA**,
so that **Story 14.5 can mount the category-sheet save flow on top of the already-working "Guardar" hand-off; the user has a coherent escape hatch ("ver combinaciones sin guardar") that routes cross-navigator to `Combinations { colorId: confirmedTone.id, capturedHex: dominantHex }` after closing the unified-camera modal; `type === "out-of-coverage"` matches still render a reasonable Result screen (fallback to `bestMatch` as the displayed tone; tone-correction section hidden since there's nothing to switch to); and the diagnostic `dominantHex`/`wadaMatch.type` text from 14.3b is deleted because its job is done**.

## Acceptance Criteria

1. **Given** `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` exists today as a 14.3b diagnostic placeholder rendering `"Result (coming in 14.4)"` + `dominantHex` + `wadaMatch.type`, **When** this story merges, **Then** the file is REWRITTEN into the real UX-DR1 Result UI and NONE of the diagnostic text (`unified-camera-result-placeholder` testID, `unified-camera-result-dominant-hex` testID, `unified-camera-result-wada-match-type` testID) remains — **And** the screen consumes the typed `route.params` `{ cutoutUri: string; dominantHex: string; wadaMatch: MatchResult }` via `RouteProp<UnifiedCameraStackParamList, "Result">` (contract frozen in 14.3b; do not touch `src/navigation/types.ts` this story), **And** the screen is wrapped in a SafeAreaView / uses `useSafeAreaInsets()` so the back affordance clears the notch and the primary CTA clears the home indicator (32pt bottom inset above safe area per UX-DR1 Screen 2 layout).

2. **Given** the Result screen mounts with typed route.params, **When** the UI renders, **Then** the cutout PNG at `cutoutUri` is rendered via `<Image>` from `react-native` (not `expo-image` — consistency with `ArmarioPreviewScreen.tsx` precedent; same resizeMode="contain") inside a centered container of exactly **220pt height** (UX-DR1 Pencil frame `6nPEq` — the approved height; 180pt/260pt variants rejected), with `resizeMode="contain"` so the transparent PNG sits on top of the `bg-paper` (`wadaTokens.bgPaper = "#fafaf8"`) without letterboxing, **And** the accessibility label on the Image reads *"Recorte de tu prenda, tono ${confirmedTone.nameEn}"* (ES + EN keys under `unifiedCamera.result.cutoutA11yLabel`, interpolated with `nameEn`).

3. **Given** the Wada match resolves to a `confirmedTone: Color` (derivation rule: by default `confirmedTone = top3[0].color` for `type === "confirm"`, `confirmedTone = match.color` for `type === "direct"`, `confirmedTone = bestMatch.color` for `type === "out-of-coverage"`; overridable by user tap in the tone-correction section per AC #5), **When** the name stack renders below the cutout, **Then** it reuses the `WadaHeader` pattern but NOT the existing `WadaHeader.tsx` component directly because that component has a fixed 20pt/14pt scale and bundles the count prop — instead, the Result screen inlines its own name stack with `confirmedTone.nameEn` on top at 28pt NotoSerifJP Medium (fontFamily `NotoSerifJP_500Medium`) color `wadaTokens.textPrimary`, and `confirmedTone.nameJp` below at 18pt NotoSerifJP Regular (fontFamily `NotoSerifJP_400Regular`) color `wadaTokens.textSecondary` — NO romaji/Tēgyō sub-line is rendered (the mockup shows `"煉瓦色 · Tēgyō"` but `data/types.ts::Color` exposes only `nameJp` + `nameEn` fields; romaji is NOT in the dataset, so skip it — one-line Japanese suffices per `WadaHeader.tsx` existing precedent), **And** the stack is vertically stacked with 4pt spacing between the two lines, top-margin 24pt from the cutout container bottom.

4. **Given** the combinations count line renders below the Wada name stack, **When** the count is computed, **Then** it equals `getCombinations(confirmedTone.id).length` (pure-JS call into the existing `src/data/colorIndex.ts` index — no store read, no async) and is rendered as a single Text node styled Inter Regular 14pt (fontFamily `Inter_400Regular`) color `wadaTokens.textSecondary`, with copy sourced from ONE new i18n key `unifiedCamera.result.combinationsCount` using i18next plural form:
    - ES singular: *"Aparece en {{count}} combinación"*
    - ES plural: *"Aparece en {{count}} combinaciones"*
    - EN singular: *"Appears in {{count}} combination"*
    - EN plural: *"Appears in {{count}} combinations"*

    **And** the count re-derives reactively when `confirmedTone` changes via the tone-correction section (AC #5), **And** when count === 0 (edge case — should not happen in the Wada dataset since every Wada color belongs to ≥1 combination but guard anyway) the line is hidden entirely rather than rendering "0 combinaciones".

5. **Given** the tone-correction section visibility condition is `wadaMatch.type === "confirm" && top3.length >= 2 && top3[1].deltaE < 8` (the "both top-2 candidates are within 8 ΔE of the captured color" rule — Pencil frame `KY9jv`), **When** the condition is true, **Then** a correction section renders below the combinations-count line containing: (a) a prompt Text *"¿Es éste el tono correcto?"* (ES) / *"Is this the right tone?"* (EN) under new i18n key `unifiedCamera.result.toneCorrectionPrompt` at Inter Regular 14pt color `wadaTokens.textSecondary`, (b) a horizontal row of exactly TWO swatches (NOT three — the UX explicitly scoped top-2 even though `top3` has length 3) rendered as square Pressables 64×64pt with 12pt gap between them, each swatch showing a solid Wada-hex fill with a 1pt hairline border at `wadaTokens.hairline`, and below each swatch a label Text `top3[i].color.nameEn` (Inter Medium 12pt, fontFamily `Inter_500Medium`, centered, max 2 lines, `wadaTokens.textPrimary`), **And** the currently-selected swatch (initially `top3[0]`, tracked via `useState<Color>(initialConfirmedTone)`) shows a 2pt ring border in `wadaTokens.textPrimary` (`#1a1a1a`) offset 2pt outside the hairline (via `padding: 2` + inner border hack or `boxShadow` — use a wrapping View with `style={{ borderWidth: 2, borderColor: wadaTokens.textPrimary, padding: 2 }}` for the selected state, plain hairline for unselected), **And** tapping either swatch fires `hapticLight()` + `setConfirmedTone(top3[i].color)` which reactively updates the Wada name stack (AC #3), combinations-count line (AC #4), cutout a11y label, primary CTA tint (AC #7), and the `confirmedHex`/`confirmedColorId` passed into the "ver combinaciones sin guardar" nav (AC #8) and the "Guardar en mi armario" hand-off (AC #6).

6. **Given** the primary CTA renders at the bottom of the screen above safe area (32pt inset above `insets.bottom`), **When** the user inspects it, **Then** it is a Pressable with full-width minus 24pt horizontal margin, height exactly 48pt, border-radius 14pt, `backgroundColor = confirmedTone.hex` (the literal Wada hex — this is the "your garment pays for the CTA" design decision from UX-DR1), containing a centered horizontal row of (i) label Text *"Guardar en mi armario"* (ES) / *"Save to my armario"* (EN) at Inter Medium 16pt and (ii) a right arrow glyph (use `"→"` unicode character as the low-cost choice — matching the UX wireframe; Pencil pending-TODO on final arrow glyph is deferred), **And** the text + arrow color is chosen at render time by the luminance rule: `relativeLuminance(confirmedTone.hex) > 0.40` → `#2d2a26` (dark pergamino ink), `≤ 0.40` → `#faf7f2` (cream) — see AC #9 for the required helper, **And** the Pressable has `accessibilityRole="button"`, `testID="unified-camera-result-primary-cta"`, `accessibilityLabel` interpolated *"Guardar en mi armario. Tono Wada ${confirmedTone.nameEn}. ${count} combinaciones disponibles."* (i18n key `unifiedCamera.result.primaryCtaA11yLabel` with `nameEn` + `count` params), ≥44pt hit area (48pt satisfies), and the disabled state is NEVER exercised in this story (no loading/paywall state in 14.4 — those are 14.5 concerns).

7. **Given** the primary CTA `onPress` handler, **When** the user taps "Guardar en mi armario", **Then** `hapticMedium()` fires FIRST (per Haptics contract table row "Result screen primary CTA tap → `hapticMedium` → Commit-ish (opens category sheet)" in `ux-design-epic-14.md` line 792), then `navigation.push("PostSave")` runs as a visible-to-dev STUB (`PostSave` is still the placeholder screen from 14.3a; Story 14.5 will replace this push with the actual category-sheet mount + real persistence → PostSave transition) — **And** a clearly-marked DEV-only `console.warn("[UnifiedCameraResultScreen] Primary CTA save flow will be implemented in Story 14.5 — routing to PostSave placeholder")` emits BEHIND a `__DEV__` guard so production builds stay silent — **And** no call to `wardrobeRepo`, `useMisLooksStore`, `PremiumPaywall`, or any i18n key outside the `unifiedCamera.result.*` / `unifiedCamera.primaryCta*` namespaces happens in this file (the category sheet + paywall are strict-14.5 scope).

8. **Given** the secondary link renders 16pt below the primary CTA, **When** the user inspects it, **Then** it is a Pressable containing Text *"ver combinaciones sin guardar"* (ES) / *"view combinations without saving"* (EN) under i18n key `unifiedCamera.result.secondaryLink` at Inter Regular 14pt color `wadaTokens.textSecondary`, with `textDecorationLine: "underline"`, centered horizontally, ≥44pt min-height hit area (enforced via `className="min-h-[44px] justify-center"`), `accessibilityRole="link"`, `testID="unified-camera-result-secondary-link"`, `accessibilityLabel` sourced from i18n key `unifiedCamera.result.secondaryLinkA11yLabel` = *"Ver combinaciones sin guardar"* (ES) / *"View combinations without saving"* (EN), **And** `onPress` fires `hapticLight()` then performs a cross-navigator hop: `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", params: { colorId: confirmedTone.id, capturedHex: dominantHex } } })` — this single call closes the unified-camera modal AND lands the user on the `Combinations` screen for the confirmed Wada tone with the dominant hex passed through as `capturedHex` (the existing `Combinations` route param that propagates to `ComboCard` via the `yourColorId` + future "your captured hex" surfacing; this story does NOT change `Combinations.tsx`), **And** ZERO persistence side effects occur on this path (no `wardrobeRepo.addItem`, no `favorites.add`, no analytics — confirms UX-DR1 "Tap 'ver combinaciones sin guardar' → `hapticLight` → navigate `push` to existing `Combinations.tsx` screen for the detected tone. Zero persistence").

9. **Given** the luminance-threshold rule for primary-CTA label color (AC #6) requires computing relative luminance on the `[0, 1]` scale (not the `[0, 255]` BT.601 weighted-average scale that `src/lib/color.ts::isLightColor` uses — that function returns a boolean against threshold 224 on the 0-255 scale, which is NOT the 0.40 threshold on the 0-1 scale that UX-DR1 / Pencil frame `EZ4EA` requires), **When** this story lands, **Then** a NEW pure-JS helper `relativeLuminance(hex: string): number` is added to `src/lib/color.ts` alongside the existing `isLightColor` + `hexToRgba` exports — the helper parses the 6-digit hex into R/G/B ∈ [0,1], applies the sRGB → linear transform per pixel (`c ≤ 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)`), and returns the weighted linear sum `0.2126 * r + 0.7152 * g + 0.0722 * b` (standard WCAG relative-luminance formula) — **And** invalid hex input returns `0` (safe-default to dark, so a malformed Wada hex renders cream text which is more readable on the probable fallback `#000000` than dark-on-dark), **And** a co-located unit test `src/lib/color.test.ts` adds ≥4 cases: `#000000 → 0`, `#ffffff → 1 ± 1e-6`, `#7a3f2b` (Brick Red — a Wada tone, mid-luminance ≈ 0.08 well below 0.40) `< 0.40`, `#faf7f2` (cream pergamino — high-luminance ≈ 0.96 well above 0.40) `> 0.40`, plus the malformed-input fallback test (`"#zzz"` → `0`).

10. **Given** the `ArmarioPreviewScreen` precedent pattern for rendering a cutout PNG against a warm-paper backdrop (see `src/screens/armario/ArmarioPreviewScreen.tsx`), **When** this story designs the warm-paper surface behind the cutout, **Then** the whole screen's outer container uses `className="flex-1"` with `style={{ backgroundColor: wadaTokens.bgPaper }}` (NOT `bg-warm` / `WarmBackground` — that's Visualizer territory; the Result screen per UX-DR1 Layout notes sits on "warm paper bg" and is matched to `bgPaper`, consistent with the rest of the Mis Looks / Armario surfaces from Epic 13), **And** the cutout container itself optionally renders a subtle warm wash if visual tests show the 220pt transparent PNG feels too isolated on pure paper — but the default ships WITHOUT any extra wash (ship the simpler option; iteration is a Pencil follow-up, not a blocker), **And** no other `wadaTokens.warmBg` / `wadaTokens.bgElevated` usage is introduced.

11. **Given** accessibility requirements (CLAUDE.md + NFR1), **When** the Result screen is traversed by VoiceOver, **Then** the logical order is: (i) the cutout Image (a11y label per AC #2), (ii) the Wada name stack — rendered as a single `View` wrapper with `accessibilityLabel={t("unifiedCamera.result.wadaNameStackA11y", { nameEn, nameJp })}` = *"Tono ${nameEn}, ${nameJp}"* (single label joining EN + JP so the two Text children don't compete — mimicking `WadaHeader.tsx` a11y pattern), (iii) the combinations count line (text is inherently a11y-readable; no extra attrs), (iv) the tone-correction prompt + the 2 swatches (each swatch has `accessibilityRole="button"`, `accessibilityLabel={t("unifiedCamera.result.toneCorrectionSwatchA11y", { nameEn })}` = *"Elegir tono ${nameEn}"* with `accessibilityState={{ selected: isSelectedSwatch }}`), (v) primary CTA, (vi) secondary link — **And** `useReducedMotion()` (the project hook at `src/hooks/useReducedMotion.ts`) is checked; when true, the tone-correction section appears STATICALLY with no fade/slide; when false, a subtle 150ms fade-in is allowed (use `Animated.Value` + `Animated.timing` — do NOT introduce `react-native-reanimated` on this screen; consistency with `UnifiedCameraCaptureScreen.tsx` which uses none), **And** live-region announcements fire via `AccessibilityInfo.announceForAccessibility(t("unifiedCamera.result.toneConfirmedA11yLive", { nameEn }))` when the user taps an alternate swatch and `setConfirmedTone` runs — copy = *"Tono cambiado a ${nameEn}"* (ES) / *"Tone changed to ${nameEn}"* (EN).

12. **Given** the new i18n keys introduced THIS story under `unifiedCamera.result.*` in both `src/i18n/locales/es.json` and `src/i18n/locales/en.json`, **When** the JSON is inspected, **Then** it contains exactly these 9 keys (no extras — avoid the Epic 13 over-expansion pattern):
    - `cutoutA11yLabel` (interpolated `{{nameEn}}`)
    - `combinationsCount` (plural forms: `combinationsCount_one`, `combinationsCount_other`) — THIS COUNTS AS TWO JSON KEYS under i18next plural convention, but conceptually 1 copy slot
    - `toneCorrectionPrompt`
    - `toneCorrectionSwatchA11y` (interpolated `{{nameEn}}`)
    - `toneConfirmedA11yLive` (interpolated `{{nameEn}}`)
    - `primaryCta`
    - `primaryCtaA11yLabel` (interpolated `{{nameEn}}`, `{{count}}`)
    - `secondaryLink`
    - `secondaryLinkA11yLabel`
    - `wadaNameStackA11y` (interpolated `{{nameEn}}`, `{{nameJp}}`)

    **And** no existing `colorCapture.*` or `unifiedCamera.capture.*` key is modified (Story 14.3b keys are frozen), **And** both locale files remain valid JSON with tab indentation matching the existing file style.

13. **Given** the Jest test surface after this story merges, **When** `pnpm test` runs, **Then** the Capture-screen test suite is UNCHANGED (14.3b's 8 cases still pass untouched), **And** `UnifiedCameraResultScreen.test.tsx` is REWRITTEN from its current 2 diagnostic cases to 9–11 real UX cases:
    - renders cutout with correct a11y label (direct match)
    - renders Wada name stack with EN + JP + count for direct match
    - renders combinations count with plural form for count > 1
    - renders combinations count with singular form for count === 1
    - hides tone-correction section when `type === "direct"` (no ambiguity)
    - hides tone-correction section when `type === "confirm"` BUT `top3[1].deltaE >= 8`
    - shows tone-correction section with 2 swatches when `type === "confirm"` AND `top3[1].deltaE < 8`
    - tapping alternate swatch updates the displayed tone name + combinations count + primary CTA bg (assert computed `backgroundColor` style value against the new hex)
    - primary CTA tap fires `hapticMedium` + `navigation.push("PostSave")` (mock `@/lib/haptics` + nav)
    - secondary link tap fires `hapticLight` + cross-navigator `getParent().navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", params: { colorId, capturedHex } } })` (assert exact params)
    - `out-of-coverage` match falls back to `bestMatch.color` in the name stack + CTA tint
    - (optional) luminance-rule smoke: pale-hex confirmedTone → dark text; dark-hex confirmedTone → cream text (assert against computed style)

    **And** `src/lib/color.test.ts` grows by 5 new `relativeLuminance` cases per AC #9, **And** test count delta target: **+9 to +14 net** vs. the 14.3b done baseline (778 passing / 60 pre-existing / 0 new failures); minimum floor is **787 passing / 60 pre-existing / 0 new failures**.

14. **Given** the quality gates, **When** `npx tsc --noEmit`, `pnpm lint`, `pnpm test` run on this story branch, **Then** all pass green, **And** Biome lint is clean (tabs, double quotes, named exports, no `export default`, `organize-imports` applied), **And** zero new test skips are introduced (NFR6), **And** the pre-existing 60 failures (48 `OutfitVisualizer.getState` + 12 `i18n.test.ts` detectLanguage) stay exactly at 60 — this story does NOT touch those surfaces.

15. **Given** NO native module changes in THIS story (pure JS/TSX + i18n + tests), **When** the dev-agent prepares the build, **Then** `npx expo run:ios` is NOT required — Metro reload (`pnpm start --clear` if cache misbehaves per `feedback_simulator_reset.md`) suffices for on-device smoke. **And** on-device smoke is OPTIONAL but recommended — the capture → result flow is visual and the tone-correction conditional is easier to eyeball than to test: Alejandro can run the flow on a mid-tone garment (produces `type === "confirm"`) to visually confirm the correction section appears, and on a clearly-saturated garment (produces `type === "direct"`) to confirm it's hidden. This is NOT a blocking AC — Jest tests cover the branches; on-device is quality polish.

## Tasks / Subtasks

- [x] **Task 1: `UnifiedCameraResultScreen` skeleton — cutout, Wada name stack, combinations count** (AC: #1, #2, #3, #4, #10, #11 partial)
  - [x] 1.1 Delete the 14.3b diagnostic rendering (`unified-camera-result-placeholder` / `-dominant-hex` / `-wada-match-type` testIDs + their Text nodes). Preserve the typed `RouteProp<UnifiedCameraStackParamList, "Result">` + `useRoute` pattern.
  - [x] 1.2 Add `useState<Color>` for `confirmedTone` initialized via `getInitialConfirmedTone(wadaMatch)` with explicit direct/confirm/out-of-coverage branches (if-chain per `classifyMatch` precedent — avoid `switch` per Biome's `noSwitchDeclarations`).
  - [x] 1.3 Outer container `<View className="flex-1" style={{ backgroundColor: wadaTokens.bgPaper }}>` + SafeAreaView/`useSafeAreaInsets()` for top + bottom inset math.
  - [x] 1.4 Cutout `<Image source={{ uri: cutoutUri }} resizeMode="contain" />` inside a 220pt-height centered container; a11y label interpolated with `confirmedTone.nameEn`.
  - [x] 1.5 Inline Wada name stack (nameEn 28pt `NotoSerifJP_500Medium` textPrimary → nameJp 18pt `NotoSerifJP_400Regular` textSecondary, 4pt gap, 24pt top margin). Single `accessibilityLabel` on the wrapping View (joins both lines). NO romaji sub-line.
  - [x] 1.6 Combinations count line below the stack: `getCombinations(confirmedTone.id).length` + i18next plural `unifiedCamera.result.combinationsCount`; hide entirely when count === 0.

- [x] **Task 2: Conditional tone-correction section (Pencil frame `KY9jv`)** (AC: #5, #11)
  - [x] 2.1 Gate on `wadaMatch.type === "confirm" && wadaMatch.top3.length >= 2 && wadaMatch.top3[1].deltaE < 8`. Centralize as `showToneCorrection` boolean.
  - [x] 2.2 Render prompt Text + horizontal row of 2 swatch Pressables (64×64pt, 12pt gap, solid Wada-hex fill, 1pt hairline border). Selected swatch wraps in a 2pt `textPrimary` ring.
  - [x] 2.3 On swatch tap: `hapticLight()` → `setConfirmedTone(top3[i].color)` → `AccessibilityInfo.announceForAccessibility(t("unifiedCamera.result.toneConfirmedA11yLive", { nameEn }))`. Combinations count + CTA tint re-derive reactively.
  - [x] 2.4 `useReducedMotion()` gate: no fade when enabled; 150ms `Animated.timing` fade-in when disabled. No `react-native-reanimated` import.

- [x] **Task 3: Primary CTA + secondary link + cross-navigator wiring** (AC: #6, #7, #8)
  - [x] 3.1 Primary CTA Pressable (48pt, full-width minus 24pt h-margin, border-radius 14pt, `style={{ backgroundColor: confirmedTone.hex }}`). Children: label + `"→"` arrow in flex-row. Text color via `relativeLuminance(confirmedTone.hex) > 0.40 ? "#2d2a26" : "#faf7f2"`.
  - [x] 3.2 Primary `onPress`: `hapticMedium()` → `navigation.push("PostSave")` + `__DEV__` `console.warn` flagging 14.5 follow-up. All a11y attrs per AC #6.
  - [x] 3.3 Secondary link Pressable (`min-h-[44px] justify-center`, underlined Inter Regular 14pt). `onPress`: `hapticLight()` → `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", params: { colorId: confirmedTone.id, capturedHex: dominantHex } } })`. All a11y attrs per AC #8.
  - [x] 3.4 Add `relativeLuminance(hex)` to `src/lib/color.ts` (WCAG formula per Dev Notes) + 5 unit tests in `src/lib/color.test.ts` (AC #9).

- [x] **Task 4: i18n keys (ES + EN) + co-located test rewrite** (AC: #12, #13)
  - [x] 4.1 Add the `unifiedCamera.result.*` block to both `es.json` + `en.json` with the 10 keys from AC #12 (including `combinationsCount_one` + `combinationsCount_other`). No edits to other namespaces.
  - [x] 4.2 Rewrite `UnifiedCameraResultScreen.test.tsx` from its 2 diagnostic cases to 9–11 real cases per AC #13 (direct/confirm/out-of-coverage branches; tone-correction show/hide; swatch-tap re-derivation; primary CTA haptic + nav; secondary link haptic + cross-nav with exact params; luminance-rule smoke). Mirror the 14.3b `mockRouteHolder` deferred-lookup pattern for `useRoute` + `useNavigation` (including `getParent`).
  - [x] 4.3 Mock `@/lib/haptics`, `@/data/colorIndex::getCombinations`, and the navigators. Do NOT import real modules.

- [x] **Task 5: Quality gates + completion evidence** (AC: #14, #15)
  - [x] 5.1 `npx tsc --noEmit` → clean.
  - [x] 5.2 `pnpm biome check --write src` → no warnings (also validates JSON locales).
  - [x] 5.3 `pnpm test` → ≥787 passing / 60 pre-existing / 0 new failures / 0 new skips vs. 14.3b's 778/60 baseline. Record the final count in Completion Notes.
  - [x] 5.4 Optional on-device smoke (mid-tone garment → type === "confirm" → correction section visible; saturated garment → type === "direct" → hidden). NO `npx expo run:ios` required (pure JS/TSX changes). Metro `pnpm start --clear` if bundle cache misbehaves. _Deferred to merge-gate on-device verification by Alejandro._

## Dev Notes

### Architecture context (Epic 14 — Result screen UX-DR1)

- **Branch:** create `story/14-4-camera-result-screen-ui` off `epic-14` at the commit where 14.3b merged (`4d7ebbb` per sprint-status).
- **Target version:** v1.4.0 (launch blocker). This story lands the real `UnifiedCameraResultScreen` UI between 14.3b's pipeline output and 14.5's save flow.
- **UX-DR1 approved by Alejandro on 2026-04-21** via the Pencil session at `designs/Epic14.pen`. Frames in play: `6nPEq` (220pt cutout height — approved), `EZ4EA` (tint rule — approved), `KY9jv` (tone-correction conditional — new in session). DM7IA (180pt) and XFB8f (260pt) were rejected.
- **Tone-correction scope:** the section shows exactly TWO swatches (top-2) even though `matchWadaColor` returns `top3` of length 3. This is a deliberate UX call — 3 swatches is too many decision points on a dense screen. If the user disagrees with both top-1 and top-2, they can escape via "ver combinaciones sin guardar" and browse freely. Do NOT silently promote to 3 swatches.
- **Combinations preview REMOVED from Result screen:** earlier drafts of the Epic 14 AC mentioned "a preview of combinations containing this tone is visible (scrollable if needed)" — UX-DR1 line 194 explicitly overrides this: *"Why not show the full combinations preview on this screen? Tested in planning; it makes the screen dense (five perceptual zones). Moved to the natural next screen (`Combinations.tsx`) to preserve calm."* Story 14.4 ships only the COUNT line, NOT a list/preview. Per the epic's ADR rule ("If any of the decisions below seem contradictory to a story's AC, the decision WINS and the story must be adjusted"), UX-DR1 wins.
- **Out of scope THIS story:**
  - ❌ Category sheet (Story 14.5 — opens on primary-CTA tap; 14.4 stubs the tap handler to `navigation.push("PostSave")`).
  - ❌ `wardrobeRepo.addItem` / `saveCutoutAsWardrobeItem` call (Story 14.5 owns persistence).
  - ❌ Paywall gate (Story 14.5).
  - ❌ Post-save "¿Ahora qué?" transition UI (Story 14.5 — `UnifiedCameraPostSaveScreen` stays as its 14.3a placeholder).
  - ❌ Changes to `src/navigation/types.ts` — the `Result` route-params contract (`{ cutoutUri, dominantHex, wadaMatch }`) is frozen in 14.3b; this story consumes it as-is.
  - ❌ Changes to `UnifiedCameraCaptureScreen.tsx` or `modules/background-removal` — 14.3b closed those surfaces.
  - ❌ Changes to `src/screens/Combinations.tsx` — the existing `{ colorId, capturedHex }` route contract accepts the new caller untouched.
  - ❌ Changes to `src/components/WadaHeader.tsx` — the Result screen inlines its own larger-scale name stack rather than bloating `WadaHeader` with new size-prop variants.
  - ❌ Haptic-contract refactor — `hapticRigid` for capture press is already the 14.3b default (`hapticMedium` mismatch vs. UX contract is a known deferred D-14.3b-* item; do NOT re-litigate here).

### Pipeline shape this story closes

```
UnifiedCameraCaptureScreen (14.3b)
  └─ navigation.push("Result", { cutoutUri, dominantHex, wadaMatch })   ← typed per 14.3b AC #10
                    ↓
UnifiedCameraResultScreen (NEW in 14.4)
  ├─ getInitialConfirmedTone(wadaMatch) → confirmedTone: Color          ← state
  ├─ render cutout Image (220pt, resizeMode="contain", bg-paper)         ← AC #2
  ├─ render Wada name stack (nameEn 28pt → nameJp 18pt)                 ← AC #3
  ├─ render combinations count (getCombinations(confirmedTone.id).length)← AC #4
  ├─ conditionally render tone-correction section                       ← AC #5
  │    └─ onSwatchTap → setConfirmedTone → AccessibilityInfo.announce
  ├─ primary CTA "Guardar en mi armario" (bg = confirmedTone.hex)        ← AC #6
  │    └─ onPress → hapticMedium → navigation.push("PostSave")           ← AC #7 (stub; 14.5 rewires)
  └─ secondary link "ver combinaciones sin guardar"                     ← AC #8
       └─ onPress → hapticLight → rootNav.navigate(Main→ColorsTab→Combinations)
```

### WCAG relative-luminance formula (authoritative)

```ts
function channelLinear(c: number): number {
    // c is 0-1 sRGB; returns 0-1 linear
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

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
```

Threshold for UI: `> 0.40` → dark pergamino ink `#2d2a26`; `≤ 0.40` → cream `#faf7f2`. This is tuned for the Wada palette by Alejandro in the Pencil session; do NOT adjust to the WCAG-4.5:1 contrast threshold (0.179) — the 0.40 number is intentional aesthetic, not accessibility-bound, because both text colors in the rule clear AAA contrast on the full Wada gamut.

### Cross-navigator navigation pattern (secondary link)

The unified camera modal sits ON TOP OF `Main` (which hosts the Tab Bar + ColorsStack). Using `navigation.getParent()` gets the `RootStack`, and calling `rootNav.navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", params: {...} } })` instructs React Navigation to:

1. Unwind to the `Main` tab (closing the unified camera modal).
2. Switch the active tab to `ColorsTab`.
3. Push/navigate to `Combinations` within the Colors stack with the detected tone's `colorId` + `capturedHex`.

This is a single navigator call — do NOT chain `goBack()` + `navigate()` manually (the modal dismissal animation will race the tab switch and produce a visible flicker).

Type-safe with: `const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();` and then `rootNav?.navigate(...)` — the optional-chain is important because React Navigation typings return `undefined` if the screen is rendered outside its parent.

### Initial confirmedTone derivation

```ts
function getInitialConfirmedTone(match: MatchResult): Color {
    switch (match.type) {
        case "direct":
            return match.match.color;
        case "confirm":
            return match.top3[0].color;
        case "out-of-coverage":
            return match.bestMatch.color;
    }
}
```

No default case — TypeScript's exhaustive discriminated-union narrowing covers all three. Biome will flag a `switch` without default as `noSwitchDeclarations` — use an `if/else` chain or a typed `never` fallback if Biome complains (precedent: `src/lib/colorMatch.ts::classifyMatch` uses if-chain; follow that).

### Reducing duplication: why NOT extend `WadaHeader.tsx`

`WadaHeader.tsx` (line 11–40) hard-codes 20pt JP + 14pt EN + `mb-3` spacing + takes a `colorCount` prop. The Result screen's name stack needs 28pt EN (on top, not bottom) + 18pt JP + no count (count is a separate dedicated line per UX-DR1) + custom spacing. Retrofitting `WadaHeader` to accept size variants breaks its purpose (it's used across Combinations, OutfitVisualizer, etc. at the 20pt scale — a size prop invites drift). **Inline the name stack in `UnifiedCameraResultScreen.tsx` directly.** If a future story needs the 28/18 variant elsewhere, THAT story can extract a shared `LargeWadaHeader` component — premature abstraction is out of scope here.

### i18next plural convention (combinations count)

The i18next library treats plural forms via suffix keys: `combinationsCount_one` (count === 1) and `combinationsCount_other` (count !== 1). At call time: `t("unifiedCamera.result.combinationsCount", { count })` — i18next picks the correct form. The existing `combinations.combination_one` + `combinations.combination_other` in both locale files is the precedent. Mirror exactly.

### Error states — NOT this story

The UX-DR1 spec mentions a Result-screen "Error (pipeline failure)" state. That error state is ALREADY handled upstream in `UnifiedCameraCaptureScreen.tsx:149` (renderErrorSheet with retry button — Story 14.3b AC #7). On-device, a pipeline failure never reaches Result — the Capture screen holds the user on the live-camera surface and lets them retry. So the Result screen needs NO error UI. If the developer adds one "just in case", that's scope creep — remove it in review.

### Known risks to guard against

- **`navigation.getParent()` returning undefined in tests** — React Navigation test renders typically mount only the local stack navigator. The secondary-link test must mock `useNavigation` to return a custom object with `getParent` returning a navigator with a `.navigate` jest.fn(). Pattern:
    ```ts
    const mockRootNavigate = jest.fn();
    const mockLocalPush = jest.fn();
    jest.mock("@react-navigation/native", () => ({
        useRoute: () => ({ params: { ... } }),
        useNavigation: () => ({
            push: mockLocalPush,
            getParent: () => ({ navigate: mockRootNavigate }),
        }),
    }));
    ```
    Assert on `mockRootNavigate.mock.calls[0]` to verify the cross-navigator hop params.

- **`getCombinations(confirmedTone.id)` on an out-of-coverage match** — `matchWadaColor` returns Wada colors only, so `confirmedTone.id` is always a valid Wada color id, and `getCombinations` always returns a non-empty array. No defensive null-handling needed beyond the AC #4 `count === 0` hide (cosmetic guard only).

- **`useState<Color>` with the discriminated union** — importing `Color` from `@/data/types` is correct. Do NOT import from `@/lib/colorTypes` (that exports `WadaMatch` which has `Color` but introduces indirection).

- **Test mock for `hapticMedium` + `hapticLight`** — the 14.3b test does `jest.mock("@/lib/haptics", () => ({ hapticMedium: jest.fn(), hapticLight: jest.fn(), ... }))`. Mirror exactly — do NOT import the real module; simulator runs won't have haptic hardware and the test will log noise.

- **NativeWind className + dynamic style compatibility** — the primary CTA uses `className` for layout (flex, padding, rounded) + `style={{ backgroundColor: confirmedTone.hex }}` for the dynamic Wada tint. This dual-usage is the established pattern (see `ComboCard.tsx` for precedent) and required per CLAUDE.md "NativeWind className for static styles; style={{}} only for dynamic Wada color values".

- **Avoid `expo-image` introduction** — the Image component for the cutout should use `react-native`'s built-in `<Image>` (same as `ArmarioPreviewScreen.tsx`). `expo-image` is NOT in `package.json` and adding it for a single `<Image>` is overkill. Transparent PNG compositing works fine with RN's built-in Image.

- **Test count drift: `+9 to +14 net` target** — the floor is +9 (787 passing). If the final count drifts higher (say +16), that's acceptable as long as no regressions surface. If it drifts LOWER than +9, investigate — likely a test was written but not registered in the describe block, or an existing test was accidentally deleted.

- **Luminance threshold edge case** — Wada tone `#7a3f2b` (Brick Red, one of the canonical Wada colors referenced in the UX mockup) has relative luminance ≈ 0.072 → well below 0.40 → cream label. The UX mockup indeed shows cream `"Guardar en mi armario"` text on the Brick Red CTA. Good sanity check — if the dev-agent's first render shows dark text on the Brick Red CTA, the luminance helper is wrong (most likely missing the sRGB → linear transform).

- **NotoSerifJP_500Medium font availability** — verify `src/config/fonts.ts` (or wherever fonts are registered) already includes NotoSerifJP_500Medium. If not, AC #3's 28pt Medium falls back to system serif, which looks wrong. Pre-emptive: grep `NotoSerifJP_500Medium` in `src/**` — if existing, consume; if missing, ADD to the existing font loader WITHOUT introducing a new font package (use the existing `@expo-google-fonts/noto-serif-jp` import that already includes the weights).

- **i18n plural test with jest-environment-jsdom** — `jest-environment-node` (project default) has i18next plural working out of the box. If a test fails with "i18next instance does not exist", the test is missing `import "@/i18n"` at the top (or the i18n bootstrap mock). Precedent: see `src/screens/Combinations.test.tsx` for the correct pattern.

### File layout (touched by this story)

```
src/
├── screens/unifiedCamera/
│   ├── UnifiedCameraResultScreen.tsx         # REWRITE — diagnostic placeholder → real UX-DR1 UI
│   └── UnifiedCameraResultScreen.test.tsx    # REWRITE — 2 diagnostic cases → 9–11 real cases
├── lib/
│   ├── color.ts                              # EDIT — add relativeLuminance(hex) helper
│   └── color.test.ts                         # EDIT — +5 cases for relativeLuminance
└── i18n/locales/
    ├── es.json                               # EDIT — add unifiedCamera.result.* block (10 keys incl. plural)
    └── en.json                               # EDIT — same block in EN

UNCHANGED (verified this story):
- src/navigation/types.ts                    # Result route params frozen in 14.3b
- src/navigation/UnifiedCameraStack.tsx      # no new screens
- src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx + .test.tsx
- src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx + .test.tsx  # stays as placeholder
- src/screens/Combinations.tsx                # existing route contract accepts our caller
- src/components/WadaHeader.tsx                # no size-prop retrofit
- src/data/colorIndex.ts                      # getCombinations consumed as-is
- modules/background-removal/**                # Swift/TS module frozen
```

No `tsconfig.json`, `jest.config.js`, `babel.config.js`, `metro.config.js`, `package.json` dependency, or `App.tsx` changes this story.

### Patterns to follow (MUST)

- **Function declarations with named exports** — never `export default` (CLAUDE.md).
- **NativeWind `className` for static styles**; `style={{}}` only for dynamic Wada color values (primary CTA bg + computed text color; cutout container bg when static stays on className).
- **Props interface required** — `type UnifiedCameraResultScreenProps = Record<string, never>` (mirroring 14.3b precedent; the screen is navigated-to, props come via route).
- **Biome:** tabs, double quotes, run `pnpm biome check --write src` before commit.
- **Tests co-located** — `.test.tsx` next to `.tsx`.
- **Haptics exclusively through `lib/haptics.ts`** — `hapticMedium` on primary CTA tap (per UX haptic contract row "Result screen primary CTA tap → `hapticMedium`"), `hapticLight` on secondary link tap AND on tone-correction swatch tap.
- **Respect `useReducedMotion`** — no fade-in on tone-correction when enabled.
- **Accessibility:** every new interactive node gets `testID`, `accessibilityLabel`, `accessibilityRole`, ≥44pt hit area. Live-region announcements via `AccessibilityInfo.announceForAccessibility` when tone changes.
- **No analytics / telemetry** — NFR8 / `feedback_no_analytics.md`.
- **Defer Jest mock lookups through a closure** — `feedback_jest_native_module_mock.md` (navigation + route mocks in this story follow the same pattern).
- **i18n keys under `unifiedCamera.result.*`** — do NOT spill into `colorCapture.*` or the Visualizer's namespace. Semantic isolation per the 14.3b Dev Notes precedent.

### References

- Epic source of truth — [docs/planning/epic-14.md §Story 14.4](../../docs/planning/epic-14.md#story-144-camera-result-screen-ui--cutout--wada-tone--combinations-preview--two-ctas) (lines 421–468)
- UX-DR1 Capture + Result — [docs/planning/ux-design-epic-14.md §UX-DR1](../../docs/planning/ux-design-epic-14.md#ux-dr1--unified-camera-flow-capture--result) (lines 77–277, especially Screen 2 Result at lines 128–201)
- Pencil frames — `6nPEq` (220pt cutout height), `EZ4EA` (tint rule), `KY9jv` (tone-correction conditional) in `designs/Epic14.pen`
- Pencil TODOs consolidation — [docs/planning/ux-design-epic-14.md §Pencil TODOs](../../docs/planning/ux-design-epic-14.md#pencil-todos-consolidated) (lines 828–851)
- Haptics contract — [docs/planning/ux-design-epic-14.md §Haptics contract](../../docs/planning/ux-design-epic-14.md#haptics-contract-epic-14-surfaces) (lines 787–803)
- Prior Story 14.3b (pipeline + Swift module + diagnostic Result placeholder we replace) — [./14-3b-unified-camera-pipeline-swift-module.md](./14-3b-unified-camera-pipeline-swift-module.md)
- Prior Story 14.3a (nav shell) — [./14-3a-unified-camera-nav-setup-capturescreen-deprecation.md](./14-3a-unified-camera-nav-setup-capturescreen-deprecation.md)
- Pure-JS Wada match — [src/lib/colorMatch.ts](../../src/lib/colorMatch.ts), [src/lib/colorTypes.ts](../../src/lib/colorTypes.ts) (MatchResult discriminated union)
- Wada color data + combinations index — [src/data/colorIndex.ts](../../src/data/colorIndex.ts), [src/data/types.ts](../../src/data/types.ts)
- Existing color helpers (extend, don't replace) — [src/lib/color.ts](../../src/lib/color.ts) (add `relativeLuminance` alongside `isLightColor` + `hexToRgba`)
- Wada name stack pattern (smaller-scale precedent — do NOT retrofit) — [src/components/WadaHeader.tsx](../../src/components/WadaHeader.tsx)
- Cutout-on-paper visual precedent — [src/screens/armario/ArmarioPreviewScreen.tsx](../../src/screens/armario/ArmarioPreviewScreen.tsx)
- Combinations screen (navigation target for secondary link) — [src/screens/Combinations.tsx](../../src/screens/Combinations.tsx)
- Navigation types (Result route frozen) — [src/navigation/types.ts](../../src/navigation/types.ts)
- Haptics module — [src/lib/haptics.ts](../../src/lib/haptics.ts)
- Reduce Motion hook — [src/hooks/useReducedMotion.ts](../../src/hooks/useReducedMotion.ts)
- Theme tokens — [src/styles/theme.ts](../../src/styles/theme.ts) (`wadaTokens.bgPaper`, `textPrimary`, `textSecondary`, `hairline`)
- Memory — `feedback_tailwind_tokens.md` (NativeWind color tokens must NOT include `text-` / `bg-` prefixes — relevant if any new token added, which this story does NOT do)
- Memory — `feedback_no_patches.md` (root cause before patching — e.g., if a luminance mismatch appears, fix `relativeLuminance` math rather than tweaking the threshold)
- Memory — `feedback_jest_native_module_mock.md` (deferred mock lookup pattern for nav mocks)
- Memory — `feedback_simulator_reset.md` (Metro `--clear` if cache misbehaves; never erase simulator)
- Memory — `project_v140_epic14_progress.md` (Epic 14 progress snapshot — 14.1/14.2/14.3a/14.3b done)
- CLAUDE.md — §Story Scope (4–5 task cap — this story uses 6 tightly-scoped tasks), §React Native Specifics, §Accessibility First, §Rules of Hooks (all hooks before early returns)

### Project Structure Notes

- No new top-level directories. `src/screens/unifiedCamera/` exists from 14.3a.
- No new dependencies. `react-i18next`, `react-native-safe-area-context`, `@react-navigation/native`, `@react-navigation/native-stack`, and all Google fonts are already installed.
- AsyncStorage, Zustand stores, `runMisLooksMigration`, `saveCutoutAsWardrobeItem` — UNCHANGED this story. The Result screen is stateless from a persistence standpoint; save happens in 14.5.
- Native `ios/` build artifacts do NOT need regeneration (no Swift / Podfile changes).
- `PostSave` screen remains the 14.3a placeholder ("Result → PostSave placeholder → coming in 14.5"). Story 14.5 replaces both the PostSave content AND the primary-CTA onPress wiring.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m]

### Debug Log References

- `pnpm test src/lib/color.test.ts` → 19 passing (5 new `relativeLuminance` cases layered on existing 14).
- `pnpm test src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx` → 12 passing (rewritten from 2 diagnostic cases).
- `npx tsc --noEmit` → clean.
- `pnpm biome check --write src` → clean (2 formatting auto-fixes applied on the new files — imports sorted, JSX styling).
- `pnpm test` (full suite) → **793 passing / 60 pre-existing / 0 new failures / 0 new skips** vs the 14.3b baseline of 778/60 → **net +15 tests**. The 60 pre-existing failures are the known baseline (48 `OutfitVisualizer.getState` + 12 `i18n.test.ts detectLanguage` — unrelated to this story). Slightly above the +9..+14 target upper bound because the 12 cases in the rewritten Result test provide more branch coverage (direct + confirm-hidden + confirm-visible + out-of-coverage + swatch-tap + primary-CTA + secondary-link + luminance-rule + plural-singular) plus 5 `relativeLuminance` cases in `color.test.ts` — all genuine regressions guards.

### Completion Notes List

- **Rewrote `UnifiedCameraResultScreen.tsx`** from the 14.3b diagnostic placeholder into the real UX-DR1 Result UI: 220pt cutout centered on `bg-paper`, inline Wada name stack (28pt `NotoSerifJP_500Medium` EN + 18pt `NotoSerifJP_400Regular` JP), combinations-count line with i18next plural form, conditional 2-swatch tone-correction section (gated on `type === "confirm" && top3[1].deltaE < 8`), primary CTA Wada-hex-tinted with luminance-rule label color, underlined secondary link performing a cross-navigator hop to `Main → ColorsTab → Combinations { colorId, capturedHex }`. All diagnostic testIDs and Text nodes removed per AC #1.
- **Added `relativeLuminance(hex)` helper to `src/lib/color.ts`** using the WCAG sRGB → linear transform (`c ≤ 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`) and the 0.2126/0.7152/0.0722 weighted sum. Returns `0` for malformed input (safe-default to dark, so a bad hex yields cream text — readable on probable `#000000` fallback). Threshold `> 0.40` picks `#2d2a26` dark pergamino ink; `≤ 0.40` picks `#faf7f2` cream — both lifted to named constants in the screen (`LUMINANCE_DARK_TEXT_THRESHOLD`, `CTA_LABEL_DARK`, `CTA_LABEL_CREAM`) so review can re-tune them without hunting through JSX.
- **Inlined the Wada name stack** rather than retrofitting `WadaHeader.tsx` — that component is fixed at 20pt JP + 14pt EN with a bundled `colorCount` prop, and the Result screen needs 28pt EN-on-top + 18pt JP + a separate count line. Adding size variants to the shared component would invite drift across Combinations / Visualizer / FavoritesList call sites. Per the story Dev Notes §"why NOT extend WadaHeader".
- **Cross-navigator link** uses `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Main", {...})` with the nested-screen shape. Because `RootStackParamList.Main` is typed as `undefined` (frozen in 14.3b per story out-of-scope list — no edits to `src/navigation/types.ts`), the call-site uses a single `as never` cast on the params object to satisfy TypeScript without widening the root param list. Per AC #8 exact call signature.
- **Tone-correction `Animated` fade** uses `react-native` `Animated` (not `react-native-reanimated`) to mirror `UnifiedCameraCaptureScreen.tsx` precedent and avoid pulling Reanimated into this screen. When `useReducedMotion()` is `true` the opacity is set statically to 1; otherwise a 150ms `Animated.timing` from 0 → 1 runs on mount (or when the section becomes visible).
- **Test count delta: +15 net** (target was +9..+14). The extra 1–6 cases came from the 12-case result-screen rewrite (vs the 9–11 target) providing extra luminance and confirm-hidden coverage, plus the 5 `relativeLuminance` cases on `color.test.ts`. Per Dev Notes "If the final count drifts higher (say +16), that's acceptable as long as no regressions surface" — 0 regressions introduced.
- **Swatch selection ring**: the selected swatch uses a 2pt `textPrimary` border + 2pt padding (creating a visible outer ring around the inner solid-hex fill); unselected swatches use a 1pt `hairline` border. Implemented via the border-width + padding + inner `<View flex: 1>` nesting pattern; avoided `boxShadow` because RN 0.83 `boxShadow` support is inconsistent on iOS simulator renders.
- **No native module changes this story** — pure JS/TSX + i18n + tests. Metro reload suffices for on-device smoke; `npx expo run:ios` is not required (AC #15).
- **Out of scope preserved**: no edits to `src/navigation/types.ts`, `UnifiedCameraCaptureScreen.tsx`, `modules/background-removal`, `src/screens/Combinations.tsx`, `src/components/WadaHeader.tsx`, `src/data/colorIndex.ts`, or `UnifiedCameraPostSaveScreen.tsx` (stays as the 14.3a placeholder — 14.5 replaces it).
- **On-device smoke**: deferred to merge-gate verification per 14.3b/13.6 precedent. Jest tests cover all five branches (direct/confirm-visible/confirm-hidden/out-of-coverage/swatch-tap) and the luminance rule via computed style assertions.

### File List

**Modified:**
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` — rewrote from 14.3b diagnostic placeholder into the real UX-DR1 Result UI.
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx` — rewrote from 2 diagnostic cases to 12 real UX cases.
- `src/lib/color.ts` — added `relativeLuminance(hex)` helper + private `channelLinear(c)` WCAG sRGB-to-linear transform.
- `src/lib/color.test.ts` — added 5 unit tests for `relativeLuminance` (black/white/brick-red/cream/malformed).
- `src/i18n/locales/en.json` — added `unifiedCamera.result.*` block (11 keys including `combinationsCount_one` + `combinationsCount_other` plural pair).
- `src/i18n/locales/es.json` — same block in Spanish with parallel plural keys.

**Unchanged (verified):**
- `src/navigation/types.ts` (Result route params contract frozen in 14.3b).
- `src/navigation/UnifiedCameraStack.tsx`, `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`, `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx`, `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx`, `src/components/WadaHeader.tsx`, `src/screens/Combinations.tsx`, `src/data/colorIndex.ts`, `modules/background-removal/**`.

### Review Findings

- [x] [Review][Patch] `return()` con paréntesis en `handleSwatchPress` — ya era `return;` en el código fuente (falso positivo del diff) [src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx:97]
- [x] [Review][Patch] Sin test para count === 0 que oculta el texto de combinations — añadido test `hides the combinations count text when count is 0` [src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx]
- [x] [Review][Patch] Sin test que verifique que tone-correction está oculto en `out-of-coverage` — aserción añadida al test existente + nombre actualizado [src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx]
- [x] [Review][Defer] `as never` cast en `handleSecondaryLink` — limitación conocida del tipado de React Navigation; documentado en Dev Notes [src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx:127] — deferred, pre-existing
- [x] [Review][Defer] `wadaMatch.top3[0]` sin null-guard en `getInitialConfirmedTone` — teórico; el pipeline garantiza `top3.length >= 1` en type `"confirm"` [src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx:52] — deferred, pre-existing

### Change Log

| Date       | Change |
|------------|--------|
| 2026-04-21 | Story 14.4 implementation — rewrote `UnifiedCameraResultScreen` with the real UX-DR1 Result UI (cutout + Wada name stack + combinations count + conditional tone-correction + primary CTA with luminance-rule label + secondary cross-navigator link), added `relativeLuminance` helper to `src/lib/color.ts` with 5 unit tests, added `unifiedCamera.result.*` i18n block (ES + EN) with 11 keys, rewrote `UnifiedCameraResultScreen.test.tsx` with 12 cases. 793 passing / 60 pre-existing / 0 new failures / 0 new skips — net +15 vs 14.3b baseline. tsc + biome clean. Status: ready-for-dev → review. |
