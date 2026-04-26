# Story 7.1: Onboarding Visual Refresh

Status: done

## Story

As a first-time user,
I want the onboarding slides to show real previews of the app's features instead of generic colored squares,
so that I immediately understand what the app does and feel excited to explore it.

## Acceptance Criteria

1. **Given** the user opens the app for the first time, **When** the onboarding screen displays, **Then** each of the 4 slides shows a real mini-preview component instead of the current 160x160 placeholder colored View. Slide 1: a mini 5x3 grid of real Wada color swatches. Slide 2: a single large color swatch with Japanese and English name. Slide 3: a palette strip showing a 3-color Wada combination with color names. Slide 4: a simplified outfit card showing 3 tinted garments. All mini-previews use real data from the existing JSON dataset.

2. **Given** the mini-previews render, **When** the user views each slide, **Then** the previews are non-interactive (no tap/press handlers), purely decorative, and centered on the slide with the same warm paper background (`bg-paper`). They respect Reduce Motion (no entrance animations if enabled). The previews have `accessibilityElementsHidden={true}` since they are decorative.

3. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. Existing Onboarding tests still pass. New tests verify each slide renders its preview component.

## Tasks / Subtasks

- [x] Task 1: Create 4 decorative mini-preview components (AC: #1, #2)
  - [x] 1.1 Create `src/components/onboarding/SwatchGridPreview.tsx` — renders a 5x3 grid of 15 real Wada swatches (first 15 from colors.json) as small colored squares (28x28px, 4px gap, rounded-sm). No press handlers, no accessibility labels. Wrapped in a View with `accessibilityElementsHidden={true}`. Max width 180px, centered.
  - [x] 1.2 Create `src/components/onboarding/ColorSpecimenPreview.tsx` — renders a single large swatch (100x100px, rounded-lg) with a curated Wada color (e.g., 朱色 Vermilion #D4534A). Below the swatch: Japanese name in Noto Serif JP 16px and English name in Inter 12px secondary gray. Non-interactive.
  - [x] 1.3 Create `src/components/onboarding/PalettePreview.tsx` — renders a horizontal palette strip (width 220px, height 64px, rounded-lg) showing 3 colors from a curated combination (e.g., #D4534A + #2B4570 + #E8D3B4). Below: color names in Inter 9px warm taupe. Non-interactive. Reuses visual pattern from PaletteStrip but simplified (no buttons, no press handlers).
  - [x] 1.4 Create `src/components/onboarding/OutfitPreview.tsx` — renders a simplified outfit card (width 160px) with 3 TintedGarment components (top-tshirt, bottom-pants, shoes-sneakers) colored with a curated Wada combination. Uses real garment PNGs from GARMENT_REGISTRY. Card has white background (#fafaf8), rounded corners (12px), subtle shadow. Non-interactive. If TintedGarment image hasn't loaded yet, show a placeholder colored View matching the target hex.

- [x] Task 2: Replace placeholder Views in Onboarding slides (AC: #1)
  - [x] 2.1 In `src/screens/Onboarding.tsx`, replace the `ONBOARDING_SLIDES` data structure to reference preview components instead of `placeholderColor`. Each slide gets a `preview` field pointing to the corresponding component.
  - [x] 2.2 Replace the current placeholder View (`w-[160px] h-[160px] rounded-3xl`) with the preview component for each slide. Remove `placeholderColor` field from slide data. Keep all text, pagination, skip, and CTA behavior unchanged.

- [x] Task 3: Tests and verification (AC: #3)
  - [x] 3.1 Create `src/components/onboarding/onboarding-previews.test.tsx` — tests: SwatchGridPreview renders 15 color views, ColorSpecimenPreview renders swatch + Japanese + English name, PalettePreview renders 3 color segments, OutfitPreview renders TintedGarment components.
  - [x] 3.2 Update `src/screens/Onboarding.test.tsx` — replace tests that assert placeholder colored Views with tests that assert preview components render on each slide. Existing skip/CTA/pagination tests unchanged.
  - [x] 3.3 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all pass with 0 errors.

## Dev Notes

### What Exists Now

The current onboarding renders 4 slides with `ONBOARDING_SLIDES` array:
```typescript
const ONBOARDING_SLIDES = [
  { id: "1", titleJp: "あなたの服を開いて", titleEn: "Open your wardrobe", placeholderColor: "#d4c4b0" },
  { id: "2", titleJp: "好きな一着を選んで", titleEn: "Pick your favorite piece", placeholderColor: "#b8c4b8" },
  { id: "3", titleJp: "その色を見つけて", titleEn: "Find its color", placeholderColor: "#c4b8c8" },
  { id: "4", titleJp: "組み合わせを発見しよう", titleEn: "Discover your combinations", placeholderColor: "#c8c0b0" },
];
```

Each slide renders: `<View style={{ width: 160, height: 160, borderRadius: 24, backgroundColor: slide.placeholderColor }} />`

This looks generic and doesn't communicate what the app does.

### Preview Components Use Real Data

The preview components are NOT mockups — they pull from the real dataset:
- `SwatchGridPreview`: first 15 colors from `colors.json`
- `ColorSpecimenPreview`: a hardcoded curated color (pick a visually striking one like Vermilion)
- `PalettePreview`: a hardcoded combination (pick one with visual contrast)
- `OutfitPreview`: uses real `TintedGarment` + `GARMENT_REGISTRY` with real garment PNGs

This means the onboarding shows the ACTUAL app content, creating continuity when the user enters the main app.

### OutfitPreview and TintedGarment Loading

TintedGarment uses Skia's `useImage()` which loads asynchronously. On first render it may return null. For the onboarding context:
- Show a simple colored View (matching the target hex, same dimensions) as fallback while loading
- This avoids a blank/broken look during the brief load time
- The Skia image should load within ~100ms from bundled assets

### Curated Content Selection

Pick visually diverse, striking examples:
- **Swatch grid**: first 15 colors cover Pale & Light range — good variety of warm tones
- **Color specimen**: 朱色 Vermilion (#D4534A) — visually striking, culturally resonant
- **Palette**: Combination with high contrast, e.g., Vermilion + Navy + Beige (#D4534A, #2B4570, #E8D3B4)
- **Outfit**: Same palette as above — creates visual continuity across slides 2→3→4

### What NOT to Do

- DO NOT make preview components interactive — they are decorative only
- DO NOT import navigation or context providers in preview components
- DO NOT add entrance animations to previews (keep onboarding simple, slides handle transitions)
- DO NOT change the slide text content, pagination, skip, or CTA behavior
- DO NOT create new data files — use existing colors.json and GARMENT_REGISTRY

### Git Branching

Create story branch `story-7.1-onboarding-visual-refresh` off `epic-1`.

### References

- [Source: src/screens/Onboarding.tsx] — current onboarding with placeholder Views
- [Source: src/data/colors.json] — color dataset for real previews
- [Source: src/components/garments/index.ts] — GARMENT_REGISTRY for outfit preview
- [Source: src/components/TintedGarment.tsx] — Skia garment rendering
- [Source: src/components/PaletteStrip.tsx] — visual reference for palette preview

## Dev Agent Record

### Implementation Plan
- Created 4 decorative preview components under `src/components/onboarding/`
- Used real dataset colors: 朱色 Vermillion (#E34234, c106) from colors.json, combination p046 "Ink and Vermillion" (Unbleached Silk #E8D8C4 + Ink Black #1C1C1C + Vermillion #E34234)
- OutfitPreview wraps each TintedGarment in a colored fallback View (same hex, same dimensions) so loading state shows tinted placeholder instead of empty space
- Replaced `placeholderColor` string field with `Preview: ComponentType` in ONBOARDING_SLIDES
- All preview components are non-interactive with `accessibilityElementsHidden={true}`
- Tests use `includeHiddenElements: true` to query inside accessibility-hidden containers

### Debug Log
- Lint fix: removed unused COLUMNS constant in SwatchGridPreview
- Lint fix: sorted imports in OutfitPreview and test file per Biome rules
- Lint fix: formatted long type annotation in OutfitPreview
- Test fix: added `includeHiddenElements: true` to all preview test queries — RNTL hides elements inside `accessibilityElementsHidden` wrappers by default

### Completion Notes
- All 3 tasks (10 subtasks) completed
- 4 new preview components created, Onboarding.tsx updated, 2 test files created/updated
- All 388 tests pass (31 suites), 0 regressions
- TypeScript, Biome lint, and full test suite all pass with 0 errors

### Code Review Fixes (AI)
- **[HIGH] OutfitPreview loading fallback**: Added `backgroundColor`, `width`, `height`, `borderRadius`, `overflow: "hidden"` to garment wrapper View so it serves as colored placeholder when TintedGarment returns null during async image load
- **[MEDIUM] Fallback test**: Added test verifying colored fallback Views are visible when Skia `useImage` returns null
- **[LOW] OutfitPreview borderRadius**: Changed card from 16 → 12 to match spec
- **[LOW] Removed unnecessary `useReducedMotion` mock** from preview tests (no preview component uses this hook)
- **Note**: `titleJp` removal from slides was intentional user decision (not a regression)

## File List

- src/components/onboarding/SwatchGridPreview.tsx (new)
- src/components/onboarding/ColorSpecimenPreview.tsx (new)
- src/components/onboarding/PalettePreview.tsx (new)
- src/components/onboarding/OutfitPreview.tsx (new, review-fixed)
- src/components/onboarding/onboarding-previews.test.tsx (new, review-fixed)
- src/screens/Onboarding.tsx (modified)
- src/screens/Onboarding.test.tsx (modified)

## Change Log

- 2026-03-25: Replaced generic placeholder colored Views in onboarding with 4 real mini-preview components showing actual app content (swatch grid, color specimen, palette strip, outfit card). All use real Wada dataset. Added comprehensive tests.
- 2026-03-25: Code review fixes — OutfitPreview loading fallback, borderRadius spec alignment, fallback test, removed stale mock.
