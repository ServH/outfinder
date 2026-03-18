# Story 3.1: Share Image Generation & Branding

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to generate a beautiful shareable image of my outfit visualization,
so that I can share it on Instagram Stories and TikTok to show friends my outfit idea.

## Acceptance Criteria

1. **Given** the user is on the Outfit Visualizer screen, **When** the SharePreview component renders (off-screen, positioned outside visible area), **Then** a capture-ready view is composed at 1080×1920 resolution (Instagram Stories 9:16 format, FR17). The view includes: the outfit card with current Skia-tinted garments and color assignments, color name labels via MiniPaletteStrip, a Wada identity header (combination nameJp + subtitle), and a branding footer. The branding footer occupies ≤5% of total image area (≤96px of 1920px height) and displays "Outfinder" text in a subtle, on-brand style using `--text-tertiary` color (#a09080). The branding does not obscure the outfit visualization (FR16).

2. **Given** react-native-view-shot is configured (already installed v4.0.3), **When** `captureShareImage(viewRef)` is called from `lib/share.ts`, **Then** `captureRef()` captures the SharePreview view as a PNG file at 1080×1920 resolution. The capture completes within 1 second with no loading spinner (NFR5). The generated image is saved to a temporary file path and returned as a URI string. Try/catch wraps the capture call — errors return `null` and are handled gracefully without crash (NFR20).

3. **Given** co-located tests exist for SharePreview and lib/share.ts, **When** tests are executed, **Then** SharePreview renders with branding footer, correct 9:16 aspect ratio layout, Wada header, outfit card, and MiniPaletteStrip for current outfit state. The share utility tests verify captureRef is called with correct options and error handling returns null on failure. `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass with 0 errors.

## Tasks / Subtasks

- [x] Task 1: Create SharePreview component (AC: #1)
  - [x] 1.1 Create `src/components/SharePreview.tsx` — a static, capture-optimized view at 9:16 aspect ratio. Props: `slots: SlotState[]`, `combination: { nameJp: string; colors: { hex: string; nameEn: string }[] }`, `viewRef: React.RefObject<View>`. The component renders inside a View with `ref={viewRef}` at logical dimensions 360×640 (9:16 ratio, captures at 3x = 1080×1920). It is positioned off-screen (`position: absolute, left: -9999`) so it doesn't affect the visible layout but remains in the view hierarchy for capture.
  - [x] 1.2 SharePreview internal layout (top to bottom):
    - **Warm background**: Solid fill `#f0ece4` (no Skia gradient — use plain View backgroundColor for capture compatibility). Apply a subtle vertical gradient effect using a semi-transparent overlay View at top (`#f5efe6` → transparent).
    - **Wada header section** (top ~10%): Combination nameJp in Noto Serif JP Medium 20px, `#2c2c2c`, letterSpacing 2. Below: "{N} colors · Sanzo Wada" in Inter 10px, `#a09080`, letterSpacing 1. Centered.
    - **Outfit section** (center ~60%): For each slot, render `<Image source={GARMENT_REGISTRY[slot.garmentType].image}>` with `tintColor={slot.color.hex}` and `resizeMode="contain"`. NOTE: Use regular RN `<Image>` with `tintColor` here — NOT Skia Canvas. This guarantees view-shot capture compatibility. The visual difference is minimal for a static share image. Stack garments vertically with proportional heights from `GARMENT_REGISTRY[type].heightHint`. Card container: white `#fafaf8`, borderRadius 16, centered.
    - **Color strip section** (~8%): Thin horizontal color strip (same as MiniPaletteStrip concept) showing outfit colors with English names below. Use plain Views with backgroundColor, not Skia.
    - **Branding footer** (bottom ≤96px / 5%): "Outfinder" text in Inter Medium 14px, color `#a09080` (--text-tertiary). Centered. Padding bottom 20px for safe area. Total footer height ≤80px to stay within ≤5% budget.
  - [x] 1.3 Create `src/components/SharePreview.test.tsx` — tests:
    - Renders Wada header with combination nameJp and color count subtitle
    - Renders garment images for each slot (verify Image components with correct source)
    - Renders color strip with color names
    - Renders "Outfinder" branding text
    - Renders with correct ref forwarded to container View
    - Renders for 2-color, 3-color, and 4-color combinations

- [x] Task 2: Create lib/share.ts capture utility (AC: #2)
  - [x] 2.1 Create `src/lib/share.ts` with `captureShareImage(viewRef: React.RefObject<View>): Promise<string | null>`:
    ```typescript
    import { captureRef } from "react-native-view-shot";

    export async function captureShareImage(
      viewRef: React.RefObject<View>,
    ): Promise<string | null> {
      try {
        const uri = await captureRef(viewRef, {
          format: "png",
          quality: 1,
          width: 1080,
          height: 1920,
        });
        return uri;
      } catch {
        return null;
      }
    }
    ```
  - [x] 2.2 Create `src/lib/share.test.ts` — tests:
    - Calls captureRef with correct format, quality, width, height options
    - Returns URI string on success
    - Returns null on captureRef error (try/catch)
    - Mock: `jest.mock("react-native-view-shot", () => ({ captureRef: jest.fn() }))`

- [x] Task 3: Integrate SharePreview into OutfitVisualizer + verify (AC: #1, #2, #3)
  - [x] 3.1 Add SharePreview to `src/screens/OutfitVisualizer.tsx`:
    - Add `useRef<View>(null)` for shareViewRef
    - Render `<SharePreview ref={shareViewRef} slots={slots} combination={combination} />` positioned off-screen (absolute, left: -9999). This mounts the capture-ready view in the component tree without affecting visible layout.
    - Do NOT add a share button yet (that's Story 3.2)
  - [x] 3.2 Add mock for `react-native-view-shot` at `__mocks__/react-native-view-shot.js` — export `captureRef` as `jest.fn().mockResolvedValue("file:///mock-path.png")`
  - [x] 3.3 Update `src/screens/OutfitVisualizer.test.tsx` — add test: "renders SharePreview off-screen" (verify SharePreview testID exists in tree)
  - [x] 3.4 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all must pass with 0 errors
  - [x] 3.5 Point-by-point AC verification checklist:
    - [x] AC1: SharePreview renders at 9:16 (360×640 logical → 1080×1920 capture) with outfit, color labels, Wada header, branding footer ≤96px
    - [x] AC2: captureShareImage calls captureRef with png/quality:1/1080×1920, try/catch returns null on error, returns URI on success
    - [x] AC3: SharePreview.test.tsx + share.test.ts + OutfitVisualizer.test.tsx updated, tsc/lint/test pass

## Dev Notes

### Architecture Evolution Since Epics Were Written

The epics reference "outfit mannequin" and "PaletteBar" — these no longer exist. Story 2.5 replaced the entire visualization layer:

| Epics Reference | Current Implementation |
|----------------|----------------------|
| OutfitMannequin | **OutfitCard** (Skia-based, editorial card) |
| GarmentSlot | Merged into **OutfitCard** |
| PaletteBar | Replaced by **MiniPaletteStrip** |
| tintColor silhouettes | **TintedGarment** (Skia ColorMatrix on real garment photos) |
| — | **WarmBackground** (Skia radial gradient) |
| — | **Aureola** (Skia radial glow behind card) |
| — | **WadaHeader** (Japanese name + subtitle) |

Additionally, the bugfix/outfit-visualizer-polish branch added swipe gesture variant cycling and shoe sizing fixes.

### Critical Technical Decision: RN Image vs Skia for SharePreview

**Decision: Use regular React Native `<Image>` with `tintColor` in SharePreview — NOT Skia Canvas.**

**Why:**
1. `react-native-view-shot` uses `UIView.drawViewHierarchyInRect` on iOS. While Skia Canvas renders to native views and *should* be capturable, there are known edge cases with offscreen Skia surfaces not flushing before capture.
2. The SharePreview is a static image — no animations, no interactions. The Skia ColorMatrix tinting advantage (preserving fabric texture/shadows) has minimal impact at Instagram Stories compression quality.
3. Using standard RN `<Image tintColor={hex}>` eliminates the entire Skia-in-offscreen-view risk while producing a visually acceptable share image.
4. If the visual difference matters later, we can upgrade to Skia rendering after validating capture compatibility. Start simple.

**Trade-off:** The share image will have slightly less texture detail than the on-screen Skia version. This is acceptable for MVP — Instagram compression would reduce the difference anyway.

### Dependencies Already Installed

Both libraries are already in `package.json` — no `npx expo install` needed:
- `react-native-view-shot`: 4.0.3 — provides `captureRef()` for PNG capture
- `expo-sharing`: ~55.0.11 — provides `Sharing.shareAsync()` (used in Story 3.2, NOT this story)

### Component Architecture

```
OutfitVisualizer (screen)
├── WarmBackground           ← visible (Skia)
├── Aureola                  ← visible (Skia)
├── WadaHeader               ← visible
├── OutfitCard               ← visible (Skia TintedGarment inside)
├── MiniPaletteStrip         ← visible
└── SharePreview             ← OFF-SCREEN (absolute, left: -9999)
    ├── Background (plain View, #f0ece4)
    ├── WadaHeader section (Text components)
    ├── Outfit card (RN Image + tintColor per garment)
    ├── Color strip (plain Views)
    └── Branding footer ("Outfinder" text)
```

SharePreview does NOT import or reuse the Skia-based components (OutfitCard, WarmBackground, etc.). It renders its own static layout using only standard React Native primitives for capture safety.

### SharePreview Dimensions & Scaling

- Logical render size: **360×640** (9:16 ratio at 1x scale)
- Capture output: **1080×1920** (3x via `captureRef({ width: 1080, height: 1920 })`)
- react-native-view-shot `width`/`height` options scale the output to the specified pixel dimensions

The 360×640 logical size is chosen because:
- It fits within any iPhone screen width
- The 3x scale matches Retina display density
- `captureRef` handles upscaling cleanly

### Branding Footer Specification

- Content: "Outfinder" text only (no logo for MVP)
- Font: Inter Medium, 14px
- Color: `#a09080` (--text-tertiary from theme tokens)
- Height: ≤80px (well within ≤96px / 5% budget)
- Position: Bottom of SharePreview, centered, paddingBottom 20
- **Do NOT include a URL** — app attribution is sufficient for MVP

### Testing Patterns to Follow

- **Jest mock for view-shot**: Create `__mocks__/react-native-view-shot.js` (same pattern as existing `__mocks__/react-native-reanimated.js` and `__mocks__/@shopify/react-native-skia.js`)
- **SharePreview tests**: Test structure/content, not pixel output. Verify components render, correct props passed.
- **share.ts tests**: Mock `captureRef`, verify it's called with correct config, test error path
- Use `testID` attributes for elements that need test targeting (React Native convention)

### Existing Patterns to Reuse

- `GARMENT_REGISTRY` from `src/components/garments/index.ts` — garment image sources and heightHints
- `SlotState` type from `src/hooks/useOutfitState.ts` — slot data interface with `garmentType` and `color`
- Theme tokens from `src/styles/theme.ts` and `tailwind.config.js` — color values
- Font families: `font-serif` (Noto Serif JP), `font-sans` (Inter) from NativeWind config
- `hapticRigid` from `src/lib/haptics.ts` — for share initiation in Story 3.2 (not this story)

### What This Story Does NOT Include

- **No share button** — that's Story 3.2
- **No expo-sharing integration** — that's Story 3.2
- **No haptic feedback** — that's Story 3.2
- **No square (1:1) format** — UX spec mentions it but epics AC only specifies 9:16. Defer to Story 3.2 or future story.

### Previous Story Intelligence (Story 2.5)

Key learnings from the last completed story:
- **Skia mock**: `__mocks__/@shopify/react-native-skia.js` already exists — renders Skia components as Views with testIDs. The new view-shot mock follows the same pattern.
- **ImageSourcePropType**: The garment registry uses `DataSourceParam` from Skia (not RN's `ImageSourcePropType`). For SharePreview's RN `<Image>`, cast or use the source directly — both accept `require()` values.
- **Test count**: Currently at ~167 tests across ~22 suites. This story should add ~12-15 tests (SharePreview: ~8, share.ts: ~4, OutfitVisualizer update: ~1).
- **Code review target**: ≤1 HIGH finding (per Epic 4 retro). Focus areas: error handling paths tested, no missing a11y, correct mock patterns.

### Git Intelligence

Recent commits show story 2.5 and bugfix branch work:
```
9cf2960 feat: swipe gesture variant cycling, extended garment rotation, and visual polish
494fb34 fix: outfit visualizer shoe sizing and variant transitions
98d83e6 merge: Epic 4 — Favorites
66773a4 feat: Skia real garment visualizer with code review fixes (Story 2.5)
```

Branch strategy: Create `story-3.1-share-image-generation` from `epic-3` branch (which should be created from latest codebase state per Epic 4 retro action item on branching hygiene).

### Project Structure Notes

- `src/components/SharePreview.tsx` — NEW file, follows established component pattern
- `src/components/SharePreview.test.tsx` — NEW co-located test
- `src/lib/share.ts` — NEW file at planned architecture location
- `src/lib/share.test.ts` — NEW co-located test
- `__mocks__/react-native-view-shot.js` — NEW Jest mock (follows pattern of existing mocks)
- `src/screens/OutfitVisualizer.tsx` — MODIFIED (add SharePreview ref + render)
- `src/screens/OutfitVisualizer.test.tsx` — MODIFIED (add SharePreview render test)

### References

- [Source: docs/planning/epics.md#Epic 3 Story 3.1] — Original AC and story definition
- [Source: docs/planning/prd-react-native-ios.md#FR14-FR18] — Functional requirements for sharing
- [Source: docs/planning/architecture-react-native-ios.md#SharePreview] — Planned architecture location
- [Source: docs/planning/ux-design-specification-ios.md#10. SharePreview] — UX component spec (9:16 + 1:1 formats, branding anatomy)
- [Source: src/screens/OutfitVisualizer.tsx] — Current screen implementation (Skia-based)
- [Source: src/components/garments/index.ts] — GARMENT_REGISTRY with image sources and heightHints
- [Source: src/hooks/useOutfitState.ts] — SlotState type definition
- [Source: _bmad-output/implementation-artifacts/2-5-skia-real-garment-visualizer.md] — Previous story with Skia implementation details
- [Source: docs/project-context.md] — Current project structure and established patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed TS2769: `DataSourceParam` → `ImageSourcePropType` cast needed for RN `<Image>` source in SharePreview (as predicted by Dev Notes)
- Fixed 6 existing OutfitVisualizer tests: `getByText` → `getAllByText` for texts duplicated by off-screen SharePreview

### Completion Notes List

- **Task 1**: Created SharePreview component with forwardRef, 9:16 layout (360×640), warm bg, Wada header, outfit card with RN Image+tintColor, color strip, branding footer (80px ≤ 96px budget). 9 tests covering all layout sections and 2/3/4-color combos.
- **Task 2**: Created lib/share.ts with `captureShareImage` — calls captureRef with png/quality:1/1080×1920, try/catch returns null on error. 3 tests covering success, error, and config validation.
- **Task 3**: Integrated SharePreview into OutfitVisualizer with useRef, added view-shot mock, added integration test, updated 6 existing tests for duplicate text tolerance. All 228 tests pass, tsc and lint clean.

### Change Log

- 2026-03-17: Story 3.1 implementation complete — SharePreview component, captureShareImage utility, OutfitVisualizer integration, 13 new tests (9 SharePreview + 3 share.ts + 1 integration)
- 2026-03-17: Code review fixes — 1 HIGH, 2 MEDIUM, 1 LOW resolved:
  - [H1] VoiceOver accessibility leak: wrapped SharePreview in `accessibilityElementsHidden` in OutfitVisualizer to prevent VoiceOver from reading off-screen duplicate content
  - [M1] Fixed ref forwarding test: replaced superficial testID check with actual `React.createRef` verification
  - [M2] Removed redundant 2-color test that duplicated earlier assertions
  - [L2] Changed color strip `key` from `nameEn` to `hex` for collision safety
  - Test count: 227 (removed 1 redundant), all passing. tsc + lint clean.

### File List

- `src/components/SharePreview.tsx` — NEW: Off-screen capture-ready component at 9:16 ratio, color strip keys use hex
- `src/components/SharePreview.test.tsx` — NEW: 8 tests for SharePreview layout, content, and ref forwarding
- `src/lib/share.ts` — NEW: captureShareImage utility with error handling
- `src/lib/share.test.ts` — NEW: 3 tests for capture utility
- `__mocks__/react-native-view-shot.js` — NEW: Jest mock for react-native-view-shot
- `src/screens/OutfitVisualizer.tsx` — MODIFIED: Added SharePreview ref + off-screen render with accessibilityElementsHidden wrapper
- `src/screens/OutfitVisualizer.test.tsx` — MODIFIED: Added SharePreview render test with includeHiddenElements, updated 6 tests for duplicate text tolerance
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Story status ready-for-dev → in-progress → review → done
- `_bmad-output/implementation-artifacts/3-1-share-image-generation-and-branding.md` — MODIFIED: Tasks marked complete, Dev Agent Record updated with code review fixes
