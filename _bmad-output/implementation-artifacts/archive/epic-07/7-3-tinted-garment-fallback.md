# Story 7.3: TintedGarment Image Load Fallback

Status: pending

## Story

As a user viewing the Outfit Visualizer,
I want garment slots to show a graceful placeholder when images are loading or fail to load,
so that I never see an empty broken space where a garment should be.

## Acceptance Criteria

1. **Given** `TintedGarment` is rendering and the Skia image is still loading (`useImage()` returns null), **When** the component renders, **Then** instead of returning null (blank space), it renders a fallback View with the target color as background, matching the expected garment dimensions (width x height props), with rounded corners (6px) and 20% opacity — a subtle colored placeholder that communicates "something colored goes here." The fallback has `accessibilityLabel="Loading garment"`.

2. **Given** the Skia image loads successfully, **When** `useImage()` returns the image, **Then** the Skia Canvas renders normally (existing behavior unchanged) and the fallback is not shown.

3. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. Existing TintedGarment tests pass. New test: when useImage returns null, fallback placeholder renders with correct background color and dimensions.

## Tasks / Subtasks

- [ ] Task 1: Add fallback placeholder to TintedGarment (AC: #1, #2)
  - [ ] 1.1 In `src/components/TintedGarment.tsx`, replace the `if (!image) return null` with a fallback View:
    ```tsx
    if (!image) {
      return (
        <View
          accessibilityLabel="Loading garment"
          style={{
            width,
            height,
            backgroundColor: colorHex,
            opacity: 0.2,
            borderRadius: 6,
          }}
        />
      );
    }
    ```
  - [ ] 1.2 Verify that the Canvas rendering path (when image IS loaded) remains completely unchanged.

- [ ] Task 2: Tests and verification (AC: #3)
  - [ ] 2.1 Update `src/components/TintedGarment.test.tsx` — update the existing "null image returns null" test to instead assert: renders a View with the target colorHex as backgroundColor and opacity 0.2. Add test: fallback View has correct width/height matching props.
  - [ ] 2.2 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all pass with 0 errors.

## Dev Notes

### The Problem

`TintedGarment.tsx` currently has:
```typescript
const image = useImage(GARMENT_REGISTRY[garmentType].image);
if (!image) return null;
```

This means:
- While garment PNGs are loading (brief moment on first render): blank space
- If image fails to load (corrupted asset, edge case): permanent blank space
- The OutfitCard's border/shadow renders around an empty area — looks broken

### Why 20% Opacity Colored View

- Shows the TARGET color at low opacity — user sees "this slot will be red" before the garment loads
- Matches the garment's footprint (same width/height) so layout doesn't shift when the real image appears
- Low opacity (0.2) makes it clear this is a placeholder, not the final garment
- Zero performance cost — simple View, no Skia, no animations

### This Is a 1-Task Fix

Intentionally small story. The fix is ~5 lines of code but has outsized impact on perceived quality. No image loading should ever show blank space in a premium app.

### What NOT to Do

- DO NOT add a loading spinner — overkill for a ~100ms asset load from the bundle
- DO NOT add retry logic — bundled assets don't fail under normal conditions
- DO NOT add skeleton shimmer animations — too complex for this edge case
- DO NOT change the Skia Canvas rendering path

### Git Branching

Create story branch `story-7.3-tinted-garment-fallback` off `epic-1`.

### References

- [Source: src/components/TintedGarment.tsx] — current `if (!image) return null` on line ~42
- [Source: src/components/OutfitCard.tsx] — parent that renders TintedGarment in CardSlot
