# Story 2.3: Outfit Visualizer Layout & Proportions

Status: done

## Story

As a user,
I want the Outfit Visualizer to display garments with realistic body proportions that fit entirely on screen without scrolling,
so that I can see my complete outfit at a glance, like a store mannequin.

## Acceptance Criteria

1. **Given** the OutfitVisualizer screen renders with any combination (2, 3, or 4 colors), **When** the mannequin displays, **Then** all garment silhouettes are visible on screen simultaneously without vertical scrolling. The mannequin fills the available vertical space between the navigation bar and the PaletteBar, adapting to the device's screen height.

2. **Given** the mannequin renders garment silhouettes, **When** the user views the outfit, **Then** garments are sized with proportions that approximate a human body silhouette: layer/top occupies the upper portion, bottom occupies the mid-to-lower portion, and shoes are compact at the base. Garment widths create a coherent body shape (shoulders wider than waist for tops/layers, narrower for bottoms). Adjacent garments overlap slightly (-4px to -8px vertical margin) so the outfit feels connected, not stacked blocks.

3. **Given** the app runs on different iPhone screen sizes (SE 375px width, standard 390px, Pro Max 430px), **When** the mannequin renders, **Then** the mannequin scales proportionally to fill the available space without distortion. All garments remain visible and proportional on every supported device. No hardcoded pixel dimensions — sizing is relative to available container space.

4. **Given** all layout changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. Existing interaction tests (tap-swap, toggle, palette bar) continue to work unchanged. Accessibility labels and touch targets remain compliant.

## Tasks / Subtasks

- [x] Task 1: Implement proportional mannequin layout system (AC: #1, #2, #3)
  - [x] 1.1 Refactor `OutfitVisualizer.tsx` — replace `ScrollView` with a `View` that measures available height (between nav bar and PaletteBar). Use `onLayout` to capture container dimensions. Pass available height to OutfitMannequin as a prop.
  - [x] 1.2 Refactor `OutfitMannequin.tsx` — accept `availableHeight` prop. Distribute height proportionally across slots using a fixed ratio system: 4-slot (layer 25%, top 20%, bottom 40%, shoes 15%), 3-slot (top 28%, bottom 45%, shoes 27%), 2-slot (top 40%, bottom 60%). Apply negative vertical margins between adjacent slots for overlap.
  - [x] 1.3 Refactor `GarmentSlot.tsx` — remove `getSlotWidth()` function. Accept `slotHeight` and `slotWidth` from parent instead. Remove `className="w-full aspect-[X]"` from all 8 garment components — replace with explicit `width` and `height` style props passed through. Use `resizeMode="contain"` to fit PNG within the allocated space.
  - [x] 1.4 Update all 8 garment components (`TopTShirt`, `TopShirt`, `BottomPants`, `BottomSkirt`, `LayerJacket`, `LayerHoodie`, `ShoesSneakers`, `ShoesFormal`) — remove hardcoded `aspect-[X]` className. Accept `width` and `height` props. Image fills the provided dimensions with `resizeMode="contain"`.

- [x] Task 2: Define coherent body-shape widths (AC: #2, #3)
  - [x] 2.1 Define width proportions relative to container width: layer 65%, top 55%, bottom 40%, shoes 50% (sneakers/formal are wide). These create a tapered silhouette: shoulders > hips > legs, feet spread. Widths are percentage-based so they scale with screen size.
  - [x] 2.2 Ensure garments are horizontally centered within the mannequin — the width variation creates the body shape naturally.

- [x] Task 3: Update tests + AC verification (AC: #4)
  - [x] 3.1 Update `OutfitMannequin.test.tsx` — verify proportional layout renders for 2/3/4 color configs. Adjust any snapshot or dimension-dependent assertions.
  - [x] 3.2 Update `GarmentSlot.test.tsx` — verify new props interface works. Accessibility labels and roles unchanged.
  - [x] 3.3 Run full suite: `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — verify 0 regressions on existing 163 tests.
  - [x] 3.4 Point-by-point AC verification on iPhone SE, standard, and Pro Max simulator sizes.

## Dev Notes

### The Problem This Story Solves

The current OutfitMannequin has no proportional system. Each garment sizes independently via hardcoded `aspect-[X]` CSS classes and arbitrary width percentages in `getSlotWidth()`. The result: pants dominate the screen (~126px tall), t-shirt is tiny (~93px), sneakers are squashed (~26px). The mannequin requires scrolling and garments feel like stacked boxes rather than an outfit.

**Root cause:** The UX spec defined OutfitMannequin in 3 lines ("vertically stacked, centered, 4px spacing") with no proportional system, no height constraints, and no responsive rules.

### Current Code to Refactor

**GarmentSlot.tsx** — `getSlotWidth()` function (lines 28-34):
```typescript
// DELETE THIS — arbitrary percentages unrelated to body proportions
function getSlotWidth(garmentType: GarmentType): number {
  if (garmentType.startsWith("layer-")) return MANNEQUIN_WIDTH * 0.65;
  if (garmentType.startsWith("top-")) return MANNEQUIN_WIDTH * 0.5;
  if (garmentType === "bottom-pants") return MANNEQUIN_WIDTH * 0.28;
  if (garmentType === "bottom-skirt") return MANNEQUIN_WIDTH * 0.4;
  return MANNEQUIN_WIDTH * 0.3;
}
```

**Garment components** — Each has a hardcoded aspect ratio:
- TopTShirt: `aspect-[1.03]`
- TopShirt: similar
- BottomPants: `aspect-[0.43]` ← this is why pants are so tall
- ShoesSneakers: `aspect-[2.23]` ← this is why shoes are squashed

These aspect ratios come from the PNG image dimensions and are correct for the image shape — but they should NOT drive the layout. The layout should be driven by the proportional system, and the PNG should `contain` within its allocated space.

**OutfitMannequin.tsx** — `width: 192` hardcoded (line 26):
```typescript
// DELETE — hardcoded width doesn't adapt to screen
<View style={{ width: 192, alignSelf: "center" }}>
```

**OutfitVisualizer.tsx** — Uses `ScrollView` (line 92):
```typescript
// REPLACE — ScrollView means mannequin can grow beyond screen
<ScrollView className="flex-1 bg-paper" contentContainerClassName="items-center px-6 py-8">
```

### Proportional Height System

The mannequin should fill the space between nav bar and PaletteBar. On a standard iPhone (812pt height):
- Status bar: ~54pt
- Nav bar: ~44pt
- PaletteBar + padding: ~100pt
- Tab bar: ~83pt
- **Available for mannequin: ~531pt**

Proportions by slot count:

| Config | Layer | Top | Bottom | Shoes |
|--------|-------|-----|--------|-------|
| 4-slot | 25%   | 20% | 40%    | 15%   |
| 3-slot | —     | 28% | 45%    | 27%   |
| 2-slot | —     | 40% | 60%    | —     |

### Width Proportions (Body Shape)

| Slot | Width % | Rationale |
|------|---------|-----------|
| Layer (jacket/hoodie) | 65% | Shoulders + layered bulk |
| Top (tshirt/shirt) | 55% | Shoulders, narrower than layer |
| Bottom (pants/skirt) | 40% | Hips narrower than shoulders |
| Shoes (sneakers/formal) | 50% | Feet spread wider than legs |

All percentages relative to mannequin container width, which itself is responsive (e.g., `width: "60%"` of screen).

### Overlap Between Garments

Use negative margins to connect garments visually:
```
marginTop: -4 to -8 (try -6 as default)
```
The first garment has no negative margin. Each subsequent garment overlaps slightly with the one above. This makes the outfit feel like one ensemble rather than separate pieces.

### Responsive Container Sizing

Instead of `width: 192` hardcoded, the mannequin width should be relative:
```typescript
// Mannequin container — responsive to screen
<View style={{ width: "55%", alignSelf: "center" }}>
```

On SE (375px): 55% = ~206px
On standard (390px): 55% = ~215px
On Pro Max (430px): 55% = ~237px

### What NOT to Change

- **PaletteBar** — stays below mannequin, no layout changes needed
- **Interaction logic** — tap-swap, toggle, selection state all stay in `useOutfitState`
- **Animation** — Reanimated border animation, color swap animation unchanged
- **Haptics** — unchanged
- **VoiceOver** — labels and announcements unchanged
- **PNG assets** — the actual garment PNGs stay as-is

### NFR25 Compliance

NFR25 requires the app to function correctly on all iPhone screen sizes from SE (3rd gen) to 16 Pro Max. The current hardcoded `width: 192` violates this. This story specifically addresses NFR25 for the Outfit Visualizer.

### Testing Strategy

This is primarily a layout refactor — functionality doesn't change. Tests should verify:
1. Components render with new props interface (width/height instead of aspect ratio)
2. Existing interaction tests pass unchanged (tap-swap, toggle, VoiceOver)
3. Visual verification on SE/standard/Pro Max simulators (manual, AC #3)

No new interaction tests needed — Story 2.2's 163 tests cover all functionality.

### References

- [Source: docs/planning/ux-design-specification-ios.md#OutfitMannequin] — original (sparse) spec
- [Source: docs/planning/epics.md#NFR25] — iPhone SE to Pro Max support
- [Source: src/components/GarmentSlot.tsx] — current getSlotWidth + hardcoded sizing
- [Source: src/components/OutfitMannequin.tsx] — current hardcoded width: 192
- [Source: src/screens/OutfitVisualizer.tsx] — current ScrollView layout
- [Source: docs/planning/outfinder_enriched_favorites_mockup.html] — future feature context (enriched favorites needs a solid Visualizer foundation)

### Git Intelligence

Create story branch `story-2.3-outfit-visualizer-layout-proportions` off `epic-2`.

### File List

- src/screens/OutfitVisualizer.tsx (MODIFIED — ScrollView → View with onLayout, passes availableHeight/containerWidth)
- src/components/OutfitMannequin.tsx (MODIFIED — proportional height/width system, responsive container)
- src/components/GarmentSlot.tsx (MODIFIED — accept slotHeight/slotWidth, removed getSlotWidth/MANNEQUIN_WIDTH)
- src/components/garments/index.ts (MODIFIED — added width/height to GarmentComponentProps)
- src/components/garments/TopTShirt.tsx (MODIFIED — removed aspect-[1.03], accepts width/height)
- src/components/garments/TopShirt.tsx (MODIFIED — removed aspect-[0.90], accepts width/height)
- src/components/garments/BottomPants.tsx (MODIFIED — removed aspect-[0.43], accepts width/height)
- src/components/garments/BottomSkirt.tsx (MODIFIED — removed aspect-[0.89], accepts width/height)
- src/components/garments/LayerJacket.tsx (MODIFIED — removed aspect-[0.97], accepts width/height)
- src/components/garments/LayerHoodie.tsx (MODIFIED — removed aspect-[0.87], accepts width/height)
- src/components/garments/ShoesSneakers.tsx (MODIFIED — removed aspect-[2.23], accepts width/height)
- src/components/garments/ShoesFormal.tsx (MODIFIED — removed aspect-[2.44], accepts width/height)
- src/components/garments/Garment.test.tsx (MODIFIED — pass width/height to garment components)
- src/components/OutfitMannequin.test.tsx (MODIFIED — pass availableHeight/containerWidth, added availableHeight=0 test)
- src/components/GarmentSlot.test.tsx (MODIFIED — pass slotWidth/slotHeight)
- src/screens/OutfitVisualizer.test.tsx (MODIFIED — trigger onLayout before querying mannequin elements)

## Dev Agent Record

### Implementation Plan
- Replaced ScrollView with flex View + onLayout in OutfitVisualizer for container measurement
- OutfitMannequin receives availableHeight/containerWidth, computes proportional slot sizes
- HEIGHT_RATIOS maps slot count → category percentages (4/3/2 slot configs)
- WIDTH_RATIOS maps garment category → width percentage for body silhouette
- Mannequin container width = 55% of available width (responsive)
- Overlap: marginTop=-6 between adjacent garments
- All 8 garment components accept explicit width/height, use resizeMode="contain"
- GarmentSlot receives slotWidth/slotHeight from parent, removed getSlotWidth()

### Completion Notes
- All 164 tests pass (1 new test for availableHeight=0 edge case)
- tsc, lint pass with 0 errors
- Existing interaction tests (tap-swap, toggle, VoiceOver, haptics) unchanged
- Accessibility labels and touch targets preserved
- No hardcoded pixel dimensions — all sizing relative to container

## Change Log

- 2026-03-13: Implemented proportional mannequin layout system — replaced ScrollView with measured container, proportional height/width ratios, responsive sizing, garment overlap. All 164 tests pass.
- 2026-03-16: Code review fixes — (H1) height ratios now subtract overlap before distributing to slots, (M1) removed unsafe `as 2|3|4` cast, (M2) 8 garment components now use shared GarmentComponentProps instead of duplicate interfaces, (M3) added proportional dimension tests for 2-slot and 4-slot configs, (L1) getSlotCategory typed with GarmentType. 166 tests pass.
