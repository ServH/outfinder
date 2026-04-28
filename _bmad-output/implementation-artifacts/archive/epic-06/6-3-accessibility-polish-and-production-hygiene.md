# Story 6.3: Accessibility Polish & Production Hygiene

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user with accessibility needs or a standard user,
I want the app to meet WCAG AA contrast standards, announce async state changes to screen readers, scale text with Dynamic Type, and not leak debug logs to production, so that the app is inclusive and production-ready.

## Acceptance Criteria

1. **Given** a user with low vision views text styled with `text-tertiary`, **When** they read "Restore Purchase", "Not now", "Skip", or any other tertiary-colored text, **Then** the contrast ratio against `bg-paper` (#fafaf8) meets WCAG AA (minimum 4.5:1). The token `textTertiary` in `theme.ts` and `text-tertiary` in `tailwind.config.js` is `#767676` (or darker). The companion token `tabInactive` in `theme.ts` and `tab-inactive` in `tailwind.config.js` is updated to the same value.

2. **Given** the user is viewing a combination with light-colored swatches (luminance > 224), **When** the selected color dot renders in PaletteStrip, **Then** the dot is visible — use a dark color (e.g. `bg-black`) for light swatches instead of always `bg-white`. Reuse or inline the `isLightColor()` logic already present in `ColorSwatch.tsx`.

3. **Given** a VoiceOver user triggers a purchase, restore, or sees a premium toast, **When** the state changes (idle → purchasing → success/error, or toast appears), **Then** the screen reader is notified via `accessibilityLiveRegion="polite"` on the containing View of: the CTA button area in PremiumPaywall, the error banner in PremiumPaywall, the restore button content in Settings, the restore error message in Settings, and the premium toast in Combinations and FavoritesList.

4. **Given** a user has Dynamic Type set to a large size, **When** any screen renders, **Then** all Text components respect the setting. Specifically, add `allowFontScaling` to: all Text elements in `Onboarding.tsx` (slide titles Japanese/English, CTA text, Skip text), all Text elements in `OutfitVisualizer.tsx` ("Outfinder" brand text, "Share Outfit"), all Text elements in `WadaHeader.tsx` (Japanese name), all Text elements in `MiniPaletteStrip.tsx` (color name labels).

5. **Given** the app is running in a production build (`__DEV__ === false`), **When** any error or warning occurs in PremiumContext or FavoritesContext, **Then** no output is written to the console. All `console.warn(...)` and `console.error(...)` calls are guarded with `if (__DEV__)`.

6. **Given** all tasks are complete, **When** verification runs, **Then** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass with 0 errors. Existing tests continue to pass. New tests cover: the tertiary color token value, the dot color conditional in PaletteStrip, the accessibilityLiveRegion attributes, and the `__DEV__` guard behavior.

## Tasks / Subtasks

- [x] Task 1: Darken textTertiary to WCAG AA compliance (AC: #1)
  - [x] 1.1 In `src/styles/theme.ts`, change `textTertiary` from `"#9b9b9b"` to `"#767676"`. Also change `tabInactive` from `"#9b9b9b"` to `"#767676"`.
  - [x] 1.2 In `tailwind.config.js`, change `"text-tertiary"` from `"#9b9b9b"` to `"#767676"`. Also change `"tab-inactive"` from `"#9b9b9b"` to `"#767676"`.
  - [x] 1.3 Verify no other file hardcodes `#9b9b9b` — grep the `src/` directory. If found, replace with the token reference.

- [x] Task 2: Fix white dot contrast on light color swatches (AC: #2)
  - [x] 2.1 In `src/components/PaletteStrip.tsx`, import or inline the `isLightColor(hex)` function (already in `ColorSwatch.tsx`). Extract it to a shared location if preferred (e.g. `src/lib/color.ts`), or duplicate the 4-line function inline.
  - [x] 2.2 Inside the color map (line ~82-87), compute `isLightColor(color.hex)` and conditionally set the dot background: `bg-black` for light colors, `bg-white` for dark colors. The dot is: `<View className="mb-2 h-[6px] w-[6px] rounded-full bg-white" />`.
  - [x] 2.3 Add a test in `src/components/PaletteStrip.test.tsx`: render a PaletteStrip with a light-colored swatch selected → verify the dot View has the dark background style. Render with a dark-colored swatch selected → verify white background.

- [x] Task 3: Add accessibilityLiveRegion to async state containers (AC: #3)
  - [x] 3.1 In `src/components/PremiumPaywall.tsx`: add `accessibilityLiveRegion="polite"` to the View wrapping the CTA button's Animated content (the `<Animated.View style={ctaAnimStyle}>` at line ~380). Add `accessibilityLiveRegion="assertive"` to the error banner View (line ~405, already has `accessibilityRole="alert"`).
  - [x] 3.2 In `src/screens/Settings.tsx`: wrap the restore button content (`restoreButtonContent()` result, line ~151) in a View with `accessibilityLiveRegion="polite"`. Add `accessibilityLiveRegion="assertive"` to the restore error View (line ~156, already has `accessibilityRole="alert"`).
  - [x] 3.3 In `src/screens/FavoritesList.tsx` (line ~99-113) and `src/screens/Combinations.tsx` (line ~55-70): add `accessibilityLiveRegion="polite"` to the premium toast `Animated.View`.
  - [x] 3.4 Add tests: in PremiumPaywall tests verify the CTA area has `accessibilityLiveRegion="polite"` and error banner has `"assertive"`. In Settings tests verify restore area has `"polite"` and error has `"assertive"`.

- [x] Task 4: Add allowFontScaling to missing Text components (AC: #4)
  - [x] 4.1 In `src/screens/Onboarding.tsx`: add `allowFontScaling` to all 5 Text elements — Japanese title (line ~113), English title (line ~116), CTA button Japanese text (line ~127), CTA button English text (line ~130), Skip button text (line ~153).
  - [x] 4.2 In `src/screens/OutfitVisualizer.tsx`: add `allowFontScaling` to "Outfinder" text (line ~164) and "Share Outfit" text (line ~182).
  - [x] 4.3 In `src/components/WadaHeader.tsx`: add `allowFontScaling` to the Japanese name Text (line ~15).
  - [x] 4.4 In `src/components/MiniPaletteStrip.tsx`: add `allowFontScaling` to the color name Text (line ~33). Consider adding `maxFontSizeMultiplier={1.5}` since 9px text at 3x scale would break the layout.

- [x] Task 5: Guard console.warn/error with __DEV__ (AC: #5)
  - [x] 5.1 In `src/contexts/PremiumContext.tsx`, wrap the 4 `console.warn(...)` calls (lines 48, 58, 74, 86) with `if (__DEV__)`.
  - [x] 5.2 In `src/contexts/FavoritesContext.tsx`, wrap the 2 `console.error(...)` calls (lines 44, 63) with `if (__DEV__)`.
  - [x] 5.3 Add a test in PremiumContext.test.tsx: mock `__DEV__` as `false` → trigger an error path → verify `console.warn` is NOT called. (Note: `__DEV__` is a global in React Native — use `Object.defineProperty(global, '__DEV__', { value: false })` in a test block, then restore.)

- [x] Task 6: Final verification (AC: #6)
  - [x] 6.1 Run `npx tsc --noEmit` — 0 errors.
  - [x] 6.2 Run `pnpm lint` — 0 errors, 0 warnings.
  - [x] 6.3 Run `pnpm test` — all tests pass (354 tests, 29 suites).
  - [x] 6.4 Point-by-point AC verification: walk each AC and confirm it's met.
  - [x] 6.5 Verify File List matches `git diff --name-status`.

## Dev Notes

### Epic Context

This is Story 6.3 within Epic 6 (App Store Preparation). Stories 6.1 (Onboarding) and 6.2 (Settings + EAS config) are done. This story addresses 5 findings from the pre-launch adversarial code review, all classified as "Should Fix Before Submission." These are surgical, isolated changes with no architectural impact.

### Current State

All 338 tests pass. Lint and TypeScript are clean. The codebase is stable after Stories 6.1 and 6.2.

### Finding 1: textTertiary Contrast (#9b9b9b → #767676)

The token `#9b9b9b` on background `#fafaf8` yields ~2.8:1 contrast ratio — fails WCAG AA (requires 4.5:1). The replacement `#767676` on `#fafaf8` yields ~4.6:1 — passes AA.

**Two places to update** (they must stay in sync):
- `src/styles/theme.ts` — `wadaTokens.textTertiary` and `wadaTokens.tabInactive` (used in JS/Reanimated)
- `tailwind.config.js` — `"text-tertiary"` and `"tab-inactive"` (used in NativeWind className)

The `tabInactive` token uses the same `#9b9b9b` value. It's used in `TabNavigator.tsx` for inactive tab icons — update it to match.

Components using textTertiary/text-tertiary:
- PremiumPaywall: "one time" label, "Restore Purchase" text, "Not now" text, loading spinners
- Settings: restore loading spinner color
- Onboarding: "Skip" button (via `text-tertiary` class)
- TabNavigator: inactive tab tint (via `wadaTokens.tabInactive`)

### Finding 2: White Dot on Light Colors

`PaletteStrip.tsx:84` renders a white dot (`bg-white`) to indicate the selected color. On light swatches this is invisible.

`ColorSwatch.tsx:15-21` already has a `isLightColor(hex)` function:
```tsx
function isLightColor(hex: string): boolean {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    const luminance = (r * 299 + g * 587 + b * 114) / 1000;
    return luminance > 224;
}
```

**Option A (preferred):** Extract to `src/lib/color.ts` and import in both files.
**Option B:** Duplicate the function inline in PaletteStrip.tsx (4 lines, minimal duplication).

The fix is to conditionally set `bg-black` or `bg-white` on the dot View.

### Finding 3: accessibilityLiveRegion

React Native supports `accessibilityLiveRegion` prop on View: `"none"` | `"polite"` | `"assertive"`.
- `"polite"` — announces when the user is idle (good for loading state changes)
- `"assertive"` — interrupts current announcement (good for errors)

**Where to add:**

| File | Element | Value | Line ref |
|------|---------|-------|----------|
| PremiumPaywall.tsx | `<Animated.View style={ctaAnimStyle}>` (CTA content area) | `"polite"` | ~380 |
| PremiumPaywall.tsx | Error banner `<View testID="error-banner">` | `"assertive"` | ~405 |
| Settings.tsx | Restore button content area (wrap in View) | `"polite"` | ~151 |
| Settings.tsx | Restore error `<View testID="settings-restore-error">` | `"assertive"` | ~156 |
| FavoritesList.tsx | Premium toast `<Animated.View testID="premium-toast">` | `"polite"` | ~100 |
| Combinations.tsx | Premium toast `<Animated.View testID="premium-toast">` | `"polite"` | ~56 |

Note: The error banner in PremiumPaywall already has `accessibilityRole="alert"` — adding `liveRegion="assertive"` complements it. Same for Settings restore error.

### Finding 4: allowFontScaling

Several Text components are missing `allowFontScaling`. In React Native, `allowFontScaling` defaults to `true`, but many components in the codebase explicitly set it for consistency and clarity. Add it to match the established pattern.

For `MiniPaletteStrip.tsx`, the fontSize is `9` — at 3x Dynamic Type scale this becomes 27px which would overflow the strip. Use `maxFontSizeMultiplier={1.5}` to cap at 13.5px.

### Finding 5: __DEV__ Guard

React Native provides `__DEV__` as a global boolean. In production builds (`__DEV__ === false`), console statements should be silenced. The pattern:

```tsx
// Before:
console.warn("Failed to read premium status from SecureStore:", error);

// After:
if (__DEV__) {
    console.warn("Failed to read premium status from SecureStore:", error);
}
```

Files and lines:
- `src/contexts/PremiumContext.tsx:48,58,74,86` — 4 `console.warn` calls
- `src/contexts/FavoritesContext.tsx:44,63` — 2 `console.error` calls

### Patterns to Follow

- **Function declarations with named exports** — no `export default`
- **NativeWind `className`** for static styles, `style={{}}` only for dynamic Wada color values
- **`testID` attributes** on all testable elements
- **`accessibilityLabel`** on interactive elements
- **Co-located tests** — test files next to source files
- **`allowFontScaling`** on all Text components (established pattern from PremiumPaywall, Settings)
- **`interface ComponentNameProps`** for props

### What NOT to Do

- DO NOT refactor existing components beyond the scope of these 5 fixes
- DO NOT change color values other than textTertiary/tabInactive and the dot fix
- DO NOT modify the premium purchase/restore logic — only add accessibility attributes
- DO NOT add `allowFontScaling` to components that already have it (PremiumPaywall, Settings)
- DO NOT use `StyleSheet.create` — use NativeWind `className`
- DO NOT change any navigation, state management, or data layer code

### Git Branching

Create story branch `story-6.3-a11y-polish` off `epic-1` (current main epic branch).

### Files to Create/Modify

- `src/styles/theme.ts` (MODIFIED) — textTertiary and tabInactive → #767676
- `tailwind.config.js` (MODIFIED) — text-tertiary and tab-inactive → #767676
- `src/lib/color.ts` (NEW, optional) — extract isLightColor() shared utility
- `src/components/PaletteStrip.tsx` (MODIFIED) — conditional dot color for light swatches
- `src/components/PaletteStrip.test.tsx` (MODIFIED) — dot color tests
- `src/components/ColorSwatch.tsx` (MODIFIED, if extracting isLightColor) — import from shared lib
- `src/components/PremiumPaywall.tsx` (MODIFIED) — accessibilityLiveRegion on CTA area + error banner
- `src/components/PremiumPaywall.test.tsx` (MODIFIED) — liveRegion assertions
- `src/screens/Settings.tsx` (MODIFIED) — accessibilityLiveRegion on restore area + error
- `src/screens/Settings.test.tsx` (MODIFIED) — liveRegion assertions
- `src/screens/FavoritesList.tsx` (MODIFIED) — accessibilityLiveRegion on toast
- `src/screens/Combinations.tsx` (MODIFIED) — accessibilityLiveRegion on toast
- `src/screens/Onboarding.tsx` (MODIFIED) — allowFontScaling on all Text
- `src/screens/OutfitVisualizer.tsx` (MODIFIED) — allowFontScaling on 2 Text
- `src/components/WadaHeader.tsx` (MODIFIED) — allowFontScaling on Text
- `src/components/MiniPaletteStrip.tsx` (MODIFIED) — allowFontScaling + maxFontSizeMultiplier
- `src/contexts/PremiumContext.tsx` (MODIFIED) — __DEV__ guards on console.warn
- `src/contexts/PremiumContext.test.tsx` (MODIFIED) — __DEV__ guard test
- `src/contexts/FavoritesContext.tsx` (MODIFIED) — __DEV__ guards on console.error

## Dev Agent Record

### Implementation Plan

5 surgical fixes addressing pre-launch adversarial review findings. No architectural changes. Each finding mapped to a single task with isolated scope.

### Completion Notes

- **Task 1:** Changed textTertiary and tabInactive from #9b9b9b to #767676 in theme.ts + tailwind.config.js. Also updated hardcoded values in theme.test.ts and FavoriteButton.test.tsx. Zero hardcoded #9b9b9b remaining in src/.
- **Task 2:** Extracted `isLightColor()` to `src/lib/color.ts` (Option A from Dev Notes). Updated ColorSwatch.tsx and PaletteStrip.tsx to import from shared lib. PaletteStrip dot now conditionally uses bg-black for light swatches. Added 2 dot color tests + 6 isLightColor unit tests.
- **Task 3:** Added accessibilityLiveRegion="polite" to CTA content area (PremiumPaywall), restore content (Settings), premium toasts (FavoritesList, Combinations). Added "assertive" to error banner (PremiumPaywall) and restore error (Settings). Added testID="cta-content" and testID="restore-content" to enable direct testing of liveRegion props. Added 4 liveRegion tests.
- **Task 4:** Added allowFontScaling to 5 Text elements in Onboarding, 2 in OutfitVisualizer, 1 in WadaHeader, 1 in MiniPaletteStrip (with maxFontSizeMultiplier={1.5}).
- **Task 5:** Wrapped 4 console.warn calls (PremiumContext) and 2 console.error calls (FavoritesContext) with `if (__DEV__)`. Added test verifying no console output when __DEV__===false.
- **Task 6:** tsc 0 errors, lint 0 errors, 360/360 tests pass (19 new from 341 baseline).

## File List

- `src/styles/theme.ts` (MODIFIED) — textTertiary and tabInactive → #767676
- `src/styles/theme.test.ts` (MODIFIED) — updated assertion values to #767676
- `tailwind.config.js` (MODIFIED) — text-tertiary and tab-inactive → #767676
- `src/lib/color.ts` (NEW) — extracted isLightColor() shared utility
- `src/lib/color.test.ts` (NEW) — 6 unit tests for isLightColor
- `src/components/ColorSwatch.tsx` (MODIFIED) — imports isLightColor from @/lib/color
- `src/components/PaletteStrip.tsx` (MODIFIED) — conditional dot color for light swatches
- `src/components/PaletteStrip.test.tsx` (MODIFIED) — 2 dot color contrast tests
- `src/components/FavoriteButton.test.tsx` (MODIFIED) — updated #9b9b9b → #767676
- `src/components/PremiumPaywall.tsx` (MODIFIED) — accessibilityLiveRegion on CTA area + error banner, testID on CTA content
- `src/components/PremiumPaywall.test.tsx` (MODIFIED) — 2 liveRegion assertions
- `src/screens/Settings.tsx` (MODIFIED) — accessibilityLiveRegion on restore area + error, testID on restore content
- `src/screens/Settings.test.tsx` (MODIFIED) — 2 liveRegion assertions
- `src/screens/FavoritesList.tsx` (MODIFIED) — accessibilityLiveRegion on toast
- `src/screens/Combinations.tsx` (MODIFIED) — accessibilityLiveRegion on toast
- `src/screens/Onboarding.tsx` (MODIFIED) — allowFontScaling on 5 Text elements
- `src/screens/OutfitVisualizer.tsx` (MODIFIED) — allowFontScaling on 2 Text elements
- `src/components/WadaHeader.tsx` (MODIFIED) — allowFontScaling on Japanese name Text
- `src/components/MiniPaletteStrip.tsx` (MODIFIED) — allowFontScaling + maxFontSizeMultiplier
- `src/contexts/PremiumContext.tsx` (MODIFIED) — __DEV__ guards on 4 console.warn calls
- `src/contexts/PremiumContext.test.tsx` (MODIFIED) — __DEV__ guard test
- `src/contexts/FavoritesContext.tsx` (MODIFIED) — __DEV__ guards on 2 console.error calls
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) — story status update

## Change Log

- 2026-03-24: Story 6.3 implemented — 5 accessibility/production fixes from adversarial review. WCAG AA contrast (#767676), light swatch dot visibility, accessibilityLiveRegion on async state changes, allowFontScaling on 9 Text components, __DEV__ guards on 6 console calls. 19 new tests (360 total). All 6 ACs satisfied.
- 2026-03-24: Code review fixes — FavoritesContext __DEV__ guard test, isLightColor edge case tests, allowFontScaling on toast text, liveRegion tests for premium toasts, corrected test counts.

### References

- [Source: adversarial review findings #6-#10] — This story's origin
- [Source: WCAG 2.1 AA contrast requirements] — 4.5:1 for normal text
- [Source: React Native accessibilityLiveRegion docs] — "polite" and "assertive" values
- [Source: CLAUDE.md accessibility rules] — 44px touch targets, VoiceOver, liveRegion, Reduce Motion
