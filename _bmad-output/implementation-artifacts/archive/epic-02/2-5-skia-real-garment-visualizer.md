# Story 2.5: Skia Real Garment Visualizer

Status: done

## Story

As a user,
I want the Outfit Visualizer to display garments as realistic, textured clothing photos tinted with Wada colors on a warm editorial card with Japanese aesthetic identity,
so that the screen feels premium, immersive, and consistent with Outfinder's Wada-inspired design language while being scalable for future garment additions.

## Acceptance Criteria

1. **Given** the OutfitVisualizer screen renders with any combination (2, 3, or 4 colors), **When** the user views the outfit, **Then** garments are displayed as real clothing photos (AI-generated flat-lay photography) tinted with Wada colors using Skia's ColorMatrix, preserving fabric texture, folds, and shadows. Each garment is rendered inside a `<Canvas>` with `<Image>` + `<ColorMatrix>` filter. The card background is `#fafaf8` with `borderRadius: 16` and elevated shadow.

2. **Given** the screen renders, **When** the user views it, **Then** the background is a warm radial gradient (Japanese paper tones: `#f5efe6` → `#f0ece4` → `#ebe5da`) filling the entire screen behind the card. A subtle aureola (radial glow of the first slot's color at ~18% → 8% → transparent opacity) is visible behind the outfit card, following the dominant color.

3. **Given** the combination has a name, **When** the screen renders, **Then** a Wada identity header is displayed above the card showing the combination's Japanese name (`combination.nameJp`) in Noto Serif JP at 20px with 2px letter-spacing, plus a subtitle "{N} colors · Sanzo Wada" in 10px muted text. Below the card, a mini PaletteStrip shows the outfit colors as a thin horizontal strip (height: 18, border-radius: 6) with color names underneath.

4. **Given** all existing interactions are preserved, **When** the user taps two garments, **Then** tap-swap behavior works identically (hapticMedium, VoiceOver announcements, color swap between garments). **When** the user taps the variant toggle on a garment, **Then** the garment variant cycles (T-shirt↔Shirt, etc.) with hapticMedium and VoiceOver announcement. All `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, and live announcements are preserved unchanged from Story 2.2.

5. **Given** the garment system is refactored, **When** a developer wants to add a new garment type in the future, **Then** they only need to: (a) add a white-on-transparent flat-lay PNG to `assets/garments/`, (b) add an entry to `GARMENT_REGISTRY` with label and image source, (c) optionally add height hint and variant pair. No other component changes are required. The tinting, layout, and interactions adapt automatically.

6. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. Test count is maintained or increased from the current ~166 tests.

## Tasks / Subtasks

- [x] Task 1: Refactor garment registry for Skia + photo assets (AC: #1, #5)
  - [x] 1.1 Replace the 8 silhouette PNGs in `assets/garments/` with the validated real garment photo PNGs (currently `poc-*.png`). Rename to final names: `top-tshirt.png`, `top-shirt.png`, `bottom-pants.png`, `bottom-skirt.png`, `layer-jacket.png`, `layer-hoodie.png`, `shoes-sneakers.png`, `shoes-formal.png` (overwrite existing silhouettes). Keep original photos in `docs/planning/real_clothes/` as source backup.
  - [x] 1.2 Refactor `src/components/garments/index.ts` — the registry becomes the single source of truth for all garment metadata. New shape:
    ```typescript
    export interface GarmentConfig {
      image: ImageSourcePropType;  // require() for the photo PNG
      label: string;               // human-readable label for a11y
      heightHint: number;          // calibrated height for proportional layout
    }
    export const GARMENT_REGISTRY: Record<GarmentType, GarmentConfig> = { ... }
    ```
    Height hints calibrated from PoC: `top-tshirt: 105`, `top-shirt: 105`, `bottom-pants: 160`, `bottom-skirt: 120`, `layer-jacket: 110`, `layer-hoodie: 110`, `shoes-sneakers: 60`, `shoes-formal: 65`. Adding a new garment = adding one entry here + the PNG file. Export `GarmentType` union type as before.
  - [x] 1.3 Delete the 8 individual garment component files (`TopTShirt.tsx`, `TopShirt.tsx`, `BottomPants.tsx`, `BottomSkirt.tsx`, `LayerJacket.tsx`, `LayerHoodie.tsx`, `ShoesSneakers.tsx`, `ShoesFormal.tsx`) and `Garment.test.tsx` — they are fully replaced by the Skia tinting approach. The registry now holds `image` (source) instead of `component`.

- [x] Task 2: Create TintedGarment Skia component (AC: #1)
  - [x] 2.1 Create `src/components/TintedGarment.tsx` — core Skia rendering component. Props: `garmentType: GarmentType`, `colorHex: string`, `width: number`, `height: number`. Internally:
    - Uses `useImage()` with `GARMENT_REGISTRY[garmentType].image`
    - Applies `hexToTintMatrix(colorHex)` as a `<ColorMatrix>` child of `<Image>`
    - `<Canvas>` with `<Fill color="#fafaf8" />` behind the image
    - `fit="contain"` for proper scaling within allocated space
    - `hexToTintMatrix()` creates a 4×5 color matrix: `[r,0,0,0,0, 0,g,0,0,0, 0,0,b,0,0, 0,0,0,1,0]` — maps gray luminance to target RGB while preserving alpha (transparency)
  - [x] 2.2 Create `src/components/TintedGarment.test.tsx` — test that component renders a Canvas for each garment type, test that hexToTintMatrix produces correct matrix for known colors, test that null image returns null (loading state).

- [x] Task 3: Create OutfitCard component replacing OutfitMannequin + GarmentSlot (AC: #1, #4, #5)
  - [x] 3.1 Create `src/components/OutfitCard.tsx` — replaces both OutfitMannequin and GarmentSlot. Props interface mirrors OutfitMannequin: `slots: SlotState[]`, `selectedSlotIndex: number | null`, `onSlotTap: (index: number) => void`, `onVariantToggle: (index: number) => void`. Renders:
    - White card container (`#fafaf8`, borderRadius 16, padding 14, shadow)
    - For each slot: `<Pressable>` wrapping `<TintedGarment>` with variant toggle button
    - Height per garment from `GARMENT_REGISTRY[slot.garmentType].heightHint`
    - Card width: 220px (or responsive percentage)
    - Negative overlap between adjacent garments (`marginTop: -8` for non-first items)
    - Selected state: Reanimated breathe border animation (port from GarmentSlot — spring with damping:12, stiffness:120, repeat:-1, respects useReducedMotion)
    - Variant toggle: small chevron icon in corner, Pressable with hitSlop={8}
    - Color swap animation: Reanimated timing 200ms (port from GarmentSlot)
    - All accessibility preserved: `accessibilityRole="button"`, `accessibilityLabel="{garment label}, colored {colorNameEn}, tap to select for swap"`, `accessibilityState={{ selected }}` on each slot Pressable. Variant toggle: `accessibilityLabel="Change {garment label} variant"`, `accessibilityRole="button"`.
  - [x] 3.2 Create `src/components/OutfitCard.test.tsx` — test: renders correct number of TintedGarments for 2/3/4 slots, accessibility labels match pattern, onSlotTap fires with correct index, onVariantToggle fires with correct index, selected state renders correctly, card has "Outfit card" accessibility label.

- [x] Task 4: Create background and presentation components (AC: #2, #3)
  - [x] 4.1 Create `src/components/WarmBackground.tsx` — full-screen Skia Canvas positioned absolutely behind content. Renders `<Fill>` with warm paper color (`#f0ece4`) + `<RadialGradient>` from center-top for subtle warmth (`#f5efe6` → `#f0ece4` → `#ebe5da`). Props: none (uses screen dimensions from `Dimensions.get("window")`).
  - [x] 4.2 Create `src/components/Aureola.tsx` — Skia Canvas positioned absolutely behind the outfit card. Renders `<Fill>` with `<RadialGradient>` using the dominant color at low opacity: `["{hex}18", "{hex}08", "transparent"]`, radius 50% of width. Props: `hex: string`, `width: number`, `height: number`. The aureola follows the first slot's color, updating when colors are swapped.
  - [x] 4.3 Create `src/components/WadaHeader.tsx` — displays combination identity above the card. Props: `nameJp: string`, `colorCount: number`. Renders: nameJp in Noto Serif JP 500 weight, 20px, letterSpacing 2, color `#2c2c2c` + subtitle "{colorCount} colors · Sanzo Wada" in 10px, color `#a09080`, letterSpacing 1.
  - [x] 4.4 Create `src/components/MiniPaletteStrip.tsx` — thin horizontal color strip below the card. Props: `colors: Array<{ hex: string; nameEn: string }>`. Renders: flex-row of colored Views (flex:1 each) inside a rounded container (height 18, borderRadius 6), with color name labels below in 9px muted text. Width: 60% of screen.
  - [x] 4.5 Create `src/components/presentation.test.tsx` — test: WadaHeader renders nameJp and color count, MiniPaletteStrip renders correct number of color segments, Aureola renders (smoke test).

- [x] Task 5: Refactor OutfitVisualizer screen (AC: #1, #2, #3, #4)
  - [x] 5.1 Refactor `src/screens/OutfitVisualizer.tsx` — complete layout replacement:
    - Remove: `OutfitMannequin` import, `PaletteBar` import, `onLayout`/`mannequinLayout` state (no longer needed — card has fixed width, garment heights from registry)
    - Add: `WarmBackground`, `Aureola`, `WadaHeader`, `OutfitCard`, `MiniPaletteStrip` imports
    - New layout structure:
      ```
      <View flex-1>
        <WarmBackground />                          ← absolute, behind everything
        <View flex-1 items-center justify-center>
          <Aureola hex={slots[0].color.hex} />      ← absolute, behind card
          <WadaHeader nameJp={combination.nameJp}
                      colorCount={combination.colors.length} />
          <OutfitCard slots={slots}
                      selectedSlotIndex={selectedSlotIndex}
                      onSlotTap={handleSlotTap}
                      onVariantToggle={handleVariantToggle} />
          <MiniPaletteStrip colors={slots.map(s => ({
            hex: s.color.hex, nameEn: s.color.nameEn
          }))} />
        </View>
      </View>
      ```
    - Keep ALL haptic/VoiceOver logic in handleSlotTap/handleVariantToggle **unchanged**
    - Keep `useOutfitState` hook call **unchanged**
    - Keep `getCombination` data access **unchanged**
  - [x] 5.2 Update `src/screens/OutfitVisualizer.test.tsx` — remove `triggerMannequinLayout()` calls (no onLayout needed). Update selectors: find OutfitCard instead of OutfitMannequin, find TintedGarment instead of garment components, find WadaHeader/MiniPaletteStrip. All interaction tests (swap, toggle, haptic, VoiceOver announcements) must pass with updated selectors. Add new tests: WadaHeader renders combination name, MiniPaletteStrip renders, background renders.

- [x] Task 6: Cleanup, scalability verification + AC verification (AC: #5, #6)
  - [x] 6.1 Delete replaced components:
    - `src/components/OutfitMannequin.tsx` + `OutfitMannequin.test.tsx`
    - `src/components/GarmentSlot.tsx` + `GarmentSlot.test.tsx`
    - `src/components/PaletteBar.tsx` + `PaletteBar.test.tsx`
    - 8 garment component files in `src/components/garments/` (TopTShirt.tsx, etc.)
    - `src/components/garments/Garment.test.tsx`
    - Old silhouette PNGs from `assets/garments/` (replaced by photo PNGs)
  - [x] 6.2 Delete PoC files:
    - `src/components/SkiaGarmentPoC.tsx`
    - `src/screens/SkiaPoC.tsx`
    - Remove PoC route from `ColorsStack.tsx` (SkiaPoC screen + import)
    - Remove PoC type from `navigation/types.ts` (SkiaPoC entry)
    - Remove PoC button from `ColorHome.tsx` (Pressable + Text import cleanup)
    - Delete `assets/garments/poc-*.png` files (replaced by final-named files in 1.1)
  - [x] 6.3 Verify scalability — document in code comments how to add a new garment:
    ```
    // To add a new garment type:
    // 1. Add white-on-transparent flat-lay PNG to assets/garments/{type}.png
    // 2. Add type to GarmentType union
    // 3. Add entry to GARMENT_REGISTRY with { image, label, heightHint }
    // 4. Optionally add to VARIANT_PAIRS in useOutfitState.ts
    // 5. Optionally add to SLOT_CONFIGS in useOutfitState.ts
    // No component changes needed — TintedGarment tints any registered garment.
    ```
  - [x] 6.4 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all must pass with 0 errors.
  - [x] 6.5 Point-by-point AC verification.
  - [x] 6.6 Update `docs/project-context.md` with new components, Skia dependency, and architecture change.

## Dev Notes

### What Story 2.3 Introduced (Current State — Being Replaced)

Story 2.3 built a proportional mannequin system:
- `OutfitVisualizer` uses `onLayout` to measure available space, passes `availableHeight`/`containerWidth` to OutfitMannequin
- `OutfitMannequin` distributes height/width via `HEIGHT_RATIOS` and `WIDTH_RATIOS`
- `GarmentSlot` accepts `slotWidth`/`slotHeight` from parent, renders garment component + Reanimated animations
- 8 individual garment components (TopTShirt, etc.) accept `width`/`height` props, use `resizeMode="contain"` with `tintColor`
- `PaletteBar` shows color swatches at screen bottom
- 166 tests pass across 22 suites

### Why This Story Replaces Everything

1. **Visual quality** — Flat silhouettes with `tintColor` produce a single-color blob. Real garment photos with Skia ColorMatrix preserve fabric texture, folds, stitching, and shadows. The outfit looks like real clothes, not icons.
2. **Wada identity** — The warm gradient, aureola, Japanese header, and palette strip create a cohesive aesthetic that matches the rest of Outfinder. The mannequin felt like a different app.
3. **Simpler architecture** — 8 individual garment component files (TopTShirt.tsx, etc.) that each wrap a single `<Image>` tag are replaced by one `TintedGarment` component that works for any garment. The registry holds image sources instead of component references.
4. **Scalability** — Adding a garment was: create component file, export it, register it, add to configs. Now it's: drop a PNG, register it. The tinting and layout adapt automatically.
5. **No more onLayout dance** — The mannequin system required measuring available space, computing ratios, passing dimensions down 3 levels. The card system uses fixed widths and height hints from the registry. Simpler, more predictable.

### PoC Reference (Validated 2026-03-17)

The PoC code in `src/components/SkiaGarmentPoC.tsx` and `src/screens/SkiaPoC.tsx` has been validated by the user and serves as the implementation blueprint. Key patterns to port:

**Skia ColorMatrix tinting:**
```tsx
import { Canvas, ColorMatrix, Fill, Image, useImage } from "@shopify/react-native-skia";

function hexToTintMatrix(hex: string): number[] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, 0, 0, 0, 0, 0, g, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
}

// In render:
<Canvas style={{ width, height }}>
  <Fill color="#fafaf8" />
  <Image image={img} fit="contain" x={0} y={0} width={width} height={height}>
    <ColorMatrix matrix={hexToTintMatrix(colorHex)} />
  </Image>
</Canvas>
```

**Aureola (radial glow):**
```tsx
<Canvas style={{ position: "absolute", ... }}>
  <Fill>
    <RadialGradient
      c={vec(width / 2, height / 2)}
      r={width * 0.5}
      colors={[`${hex}18`, `${hex}08`, "transparent"]}
    />
  </Fill>
</Canvas>
```

**Warm background:**
```tsx
<Canvas style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
  <Fill color="#f0ece4" />
  <Fill>
    <RadialGradient
      c={vec(screenW / 2, 100)}
      r={screenW * 0.8}
      colors={["#f5efe6", "#f0ece4", "#ebe5da"]}
    />
  </Fill>
</Canvas>
```

### Garment Photo Specifications

All 8 garment photos were AI-generated with consistent specifications:
- **Style:** Product photography, flat-lay top-down view
- **Color:** Pure white garment (grayscale 191-224 range with shadows)
- **Background:** Transparent (RGBA PNG with alpha channel)
- **Lighting:** Studio, top-left at 45° (consistent shadow direction)
- **Resolution:** 1024px wide, varying heights (744-1316px)
- **Format:** PNG with alpha channel

Aspect ratios (important for height calibration):
| Garment | Size | Ratio | heightHint |
|---------|------|-------|------------|
| top-tshirt | 1024×982 | 1.04 | 105 |
| top-shirt | 1024×1058 | 0.96 | 105 |
| bottom-pants | 1024×1316 | 0.77 | 160 |
| bottom-skirt | 1024×1005 | 1.01 | 120 |
| layer-jacket | 1024×1008 | 1.01 | 110 |
| layer-hoodie | 1024×1007 | 1.01 | 110 |
| shoes-sneakers | 1024×744 | 1.37 | 60 |
| shoes-formal | 1024×1051 | 0.97 | 65 |

The `heightHint` values were calibrated in the PoC so that rendered widths (height × ratio) are visually balanced across garment types. Pants need extra height (160) because their narrow ratio (0.77) would otherwise make them look too small.

### Dependency: @shopify/react-native-skia

- **Version:** 2.5.1 (already installed during PoC)
- **Compatibility:** Expo SDK 55, RN 0.83.2, React 19 — all confirmed working
- **No Expo config plugin needed** — native binaries included via CocoaPods
- **iOS only** — matches our scope (no Android concerns)
- **Used for:** `Canvas`, `Image`, `Fill`, `ColorMatrix`, `RadialGradient`, `useImage`, `vec`
- **NOT used for:** Full Skia rendering pipeline, runtime shaders, complex paths. We use a small, focused subset.

### Reanimated Animations to Port

From current `GarmentSlot.tsx`, port to `OutfitCard.tsx`:

1. **Selected border breathe** — `useSharedValue` + `withRepeat(withSpring(...))` for border opacity 0.6→1.0. Damping: 12, stiffness: 120. Only when `isSelected`. Respects `useReducedMotion()`.
2. **Color swap transition** — `withTiming(200ms)` on color progress. `interpolateColor` from previous to new hex. Respects reduce motion (instant if enabled).
3. **NativeWind + Pressable pattern** — Use children render function for press state: `<Pressable>{({ pressed }) => <Animated.View style={{ opacity: pressed ? 0.88 : 1 }}>...}</Pressable>`.

### What Stays Unchanged

| Component/Hook | Status | Reason |
|----------------|--------|--------|
| `useOutfitState.ts` | NO CHANGE | All state logic stays: selectSlot, toggleVariant, SLOT_CONFIGS, VARIANT_PAIRS |
| `useOutfitState.test.ts` | NO CHANGE | State tests are independent of rendering |
| `useReducedMotion.ts` | NO CHANGE | Accessibility hook still used |
| `lib/haptics.ts` | NO CHANGE | Haptic wrappers still used |
| `data/colorIndex.ts` | NO CHANGE | Data access unchanged |
| `data/types.ts` | NO CHANGE | Color, Combination types unchanged |
| `navigation/types.ts` | MINOR (remove PoC route only) | |

### What To Delete vs Create

| Action | Files |
|--------|-------|
| **DELETE** | `OutfitMannequin.tsx` + test, `GarmentSlot.tsx` + test, `PaletteBar.tsx` + test |
| **DELETE** | 8× `garments/*.tsx` (TopTShirt, TopShirt, etc.) + `Garment.test.tsx` |
| **DELETE** | `SkiaGarmentPoC.tsx`, `SkiaPoC.tsx` (PoC cleanup) |
| **DELETE** | 8× old silhouette PNGs in `assets/garments/` |
| **RENAME** | 8× `poc-*.png` → final names (overwrite old PNGs) |
| **CREATE** | `TintedGarment.tsx` + test |
| **CREATE** | `OutfitCard.tsx` + test |
| **CREATE** | `WarmBackground.tsx`, `Aureola.tsx`, `WadaHeader.tsx`, `MiniPaletteStrip.tsx` + shared test |
| **MODIFY** | `garments/index.ts` (registry shape change) |
| **MODIFY** | `OutfitVisualizer.tsx` + test (new components, remove onLayout) |
| **MODIFY** | `ColorsStack.tsx`, `navigation/types.ts`, `ColorHome.tsx` (PoC cleanup) |
| **MODIFY** | `docs/project-context.md` |

### Testing Strategy

| Component | Tests | Focus |
|-----------|-------|-------|
| TintedGarment | 3-4 | Canvas renders, matrix correctness, null image handling |
| OutfitCard | 6-8 | 2/3/4 slot configs, a11y labels, tap/toggle callbacks, selected state |
| Presentation (shared) | 3-4 | WadaHeader renders nameJp, MiniPaletteStrip color count, Aureola smoke |
| OutfitVisualizer | ~15 | Updated from current 15: same interactions, new selectors, header/strip assertions |

Expected total: ~166 tests (similar to current — tests replaced, not reduced).

### Future Garment Scalability

The refactored registry makes adding garments trivial. Example of adding "hat-beanie":

```typescript
// 1. Add to GarmentType union
export type GarmentType = ... | "hat-beanie";

// 2. Add to GARMENT_REGISTRY
"hat-beanie": {
  image: require("@/assets/garments/hat-beanie.png"),
  label: "Beanie",
  heightHint: 55,
},

// 3. Optionally add variant pair
// In useOutfitState.ts VARIANT_PAIRS:
"hat-beanie": "hat-cap",
"hat-cap": "hat-beanie",

// 4. Optionally add to SLOT_CONFIGS for 5-color combos
// In useOutfitState.ts SLOT_CONFIGS:
// 5: ["hat-beanie", "layer-jacket", "top-tshirt", "bottom-pants", "shoes-sneakers"]
```

No changes to TintedGarment, OutfitCard, or any other component. The ColorMatrix tinting works with any white-on-transparent PNG.

### NativeWind + Pressable Pattern

Same pattern as GarmentSlot — use children render function for press state:
```tsx
<Pressable onPress={onTap}>
  {({ pressed }) => (
    <Animated.View style={[borderStyle, { opacity: pressed ? 0.88 : 1 }]}>
      <TintedGarment ... />
    </Animated.View>
  )}
</Pressable>
```

### Accessibility — Preserved

- OutfitCard: `accessibilityLabel="Outfit card"`
- Each garment slot: `accessibilityRole="button"`, `accessibilityLabel="{label}, colored {nameEn}, tap to select for swap"`, `accessibilityState={{ selected }}`
- Variant toggle: `accessibilityRole="button"`, `accessibilityLabel="Change {label} variant"`
- VoiceOver announcements: identical to current (select, swap, toggle) — logic stays in OutfitVisualizer screen
- Touch targets: Pressable areas well above 44×44px minimum
- Reduce Motion: Reanimated animations check `useReducedMotion()` — instant transitions if enabled
- WadaHeader: `accessibilityLabel="{nameJp}, {colorCount} color Wada combination"`

### Git Intelligence

Create story branch `story-2.5-skia-real-garment-visualizer` off `epic-2`.

### References

- [Source: src/components/SkiaGarmentPoC.tsx] — validated PoC implementation reference
- [Source: src/screens/SkiaPoC.tsx] — validated PoC screen with background, aureola, header
- [Source: docs/planning/real_clothes/] — original AI-generated garment photos
- [Source: docs/planning/Outfit Visualizer.png] — user's original vision mockup
- [Source: src/components/GarmentSlot.tsx] — Reanimated animations to port
- [Source: src/components/OutfitMannequin.tsx] — proportional system being replaced
- [Source: src/hooks/useOutfitState.ts] — state logic stays unchanged
- [Source: docs/planning/outfinder_visualizer_polish_proposals.html] — earlier proposals (aureola concept originated here)

### File List

- assets/garments/top-tshirt.png (REPLACED — photo PNG overwrites silhouette)
- assets/garments/top-shirt.png (REPLACED)
- assets/garments/bottom-pants.png (REPLACED)
- assets/garments/bottom-skirt.png (REPLACED)
- assets/garments/layer-jacket.png (REPLACED)
- assets/garments/layer-hoodie.png (REPLACED)
- assets/garments/shoes-sneakers.png (REPLACED)
- assets/garments/shoes-formal.png (REPLACED)
- assets/garments/poc-*.png (N/A — did not exist on epic-2 branch)
- src/components/garments/index.ts (MODIFIED — registry shape: image+label+heightHint, no component refs)
- src/components/garments/TopTShirt.tsx (DELETE)
- src/components/garments/TopShirt.tsx (DELETE)
- src/components/garments/BottomPants.tsx (DELETE)
- src/components/garments/BottomSkirt.tsx (DELETE)
- src/components/garments/LayerJacket.tsx (DELETE)
- src/components/garments/LayerHoodie.tsx (DELETE)
- src/components/garments/ShoesSneakers.tsx (DELETE)
- src/components/garments/ShoesFormal.tsx (DELETE)
- src/components/garments/Garment.test.tsx (DELETE)
- src/components/TintedGarment.tsx (NEW)
- src/components/TintedGarment.test.tsx (NEW)
- src/components/OutfitCard.tsx (NEW — replaces OutfitMannequin + GarmentSlot)
- src/components/OutfitCard.test.tsx (NEW)
- src/components/WarmBackground.tsx (NEW)
- src/components/Aureola.tsx (NEW)
- src/components/WadaHeader.tsx (NEW)
- src/components/MiniPaletteStrip.tsx (NEW)
- src/components/presentation.test.tsx (NEW — shared tests for WadaHeader, MiniPaletteStrip, Aureola)
- src/components/OutfitMannequin.tsx (DELETE)
- src/components/OutfitMannequin.test.tsx (DELETE)
- src/components/GarmentSlot.tsx (DELETE)
- src/components/GarmentSlot.test.tsx (DELETE)
- src/components/PaletteBar.tsx (DELETE)
- src/components/PaletteBar.test.tsx (DELETE)
- src/components/SkiaGarmentPoC.tsx (N/A — did not exist on epic-2 branch)
- src/screens/SkiaPoC.tsx (N/A — did not exist on epic-2 branch)
- src/screens/OutfitVisualizer.tsx (MODIFIED — new layout with Skia components)
- src/screens/OutfitVisualizer.test.tsx (MODIFIED — updated selectors and assertions)
- src/screens/ColorHome.tsx (N/A — PoC button not present on epic-2 branch)
- src/navigation/ColorsStack.tsx (N/A — PoC route not present on epic-2 branch)
- src/navigation/types.ts (N/A — PoC type not present on epic-2 branch)
- src/hooks/useOutfitState.ts (NO CHANGE)
- src/hooks/useOutfitState.test.ts (NO CHANGE)
- docs/project-context.md (MODIFIED — updated component list, Skia dependency)
- __mocks__/@shopify/react-native-skia.js (NEW — Jest mock for Skia)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED — status updates)

## Dev Agent Record

### Implementation Plan

- Task 1: Replaced 8 silhouette PNGs with real garment photos, refactored registry from component references to `{ image, label, heightHint }`, deleted 8 individual garment component files.
- Task 2: Created `TintedGarment` with Skia `Canvas > Fill + Image > ColorMatrix`. Exported `hexToTintMatrix()` utility. 12 tests (post-review).
- Task 3: Created `OutfitCard` combining OutfitMannequin + GarmentSlot functionality. Ported Reanimated breathe animation. 15 tests (post-review).
- Task 4: Created 4 presentation components — `WarmBackground` (Skia radial gradient), `Aureola` (radial glow), `WadaHeader` (JP name + subtitle), `MiniPaletteStrip` (color strip + labels). 16 tests (post-review).
- Task 5: Refactored `OutfitVisualizer` — removed onLayout/mannequinLayout state, replaced OutfitMannequin+PaletteBar with new components. 29 tests (post-review).
- Task 6: Deleted 15 replaced files + PoC. Updated project-context.md. All checks pass.

### Debug Log

- TS error: `ImageSourcePropType` incompatible with Skia `DataSourceParam` → changed registry type to `DataSourceParam` from `@shopify/react-native-skia`
- TS error: `swatchGroup: 0` in test too wide → added `as const`
- Biome: unused `GarmentType` import in OutfitCard → removed
- ColorsStack.tsx and types.ts already clean on epic-2 branch (PoC routes not present)
- ColorHome.tsx already clean on epic-2 branch (PoC button not present)

### Completion Notes

Story 2.5 replaces the entire outfit visualization layer (Stories 2.1-2.3) with a Skia-based system. 15 old component/test files deleted, 11 new files created. Test count: 167 (post code review — exceeds AC #6 threshold of ~166). All 6 ACs verified. `tsc`, `lint`, `test` all pass with 0 errors.

## Change Log

- 2026-03-17: Story 2.5 implementation — Skia real garment visualizer with editorial card, warm background, aureola, Wada header, and mini palette strip. Complete architecture replacement from tintColor silhouettes to Skia ColorMatrix real garment photos.
- 2026-03-17: Code review fixes — [C1] Added 34 tests to reach 167 (AC #6 compliance). [C2] Added null image loading test for TintedGarment. [H1] Removed dead colorProgress/prevColorRef code from OutfitCard, added smooth deselect withTiming(150ms). [H2] Added individual color accessibilityLabel to MiniPaletteStrip segments. [M1] Changed MiniPaletteStrip keys from c.hex to c.nameEn (unique per combination). [M2] Extracted Aureola magic number to named AUREOLA_TOP_OFFSET constant. [M3] Corrected File List (PoC files didn't exist on this branch). [L2] Deselection now animates smoothly instead of snapping. Skia mock useImage changed to jest.fn() for per-test override.
