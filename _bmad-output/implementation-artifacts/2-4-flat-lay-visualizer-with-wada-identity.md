# Story 2.4: Flat Lay Visualizer with Wada Identity

Status: review

## Story

As a user,
I want the Outfit Visualizer to display garments as equal-weight color cards in a flat-lay grid with Japanese color names and the Wada combination context,
so that the screen feels like part of Outfinder's Wada aesthetic, scales naturally with any number of garments, and produces shareable content.

## Acceptance Criteria

1. **Given** the OutfitVisualizer screen renders with any combination (2, 3, or 4 colors), **When** the user views the outfit, **Then** garments are displayed as equal-weight cards in a grid layout (2 colors: 1×2 vertical, 3 colors: 2+1 grid, 4 colors: 2×2 grid). Each card shows the garment silhouette PNG as a subtle watermark (white, ~12% opacity), the Wada color name in Japanese (Noto Serif JP), the English color name, and a variant toggle icon. All cards fit on screen without scrolling.

2. **Given** a garment card is displayed, **When** the user views it, **Then** the card background is the Wada color (`color.hex`), the card has 14px border-radius, the Japanese name is rendered in Noto Serif JP at ~10px in white (or dark for light colors), and the variant toggle (⇅) is positioned in the top-right corner. The garment silhouette PNG is centered as a watermark using `tintColor: "rgba(255,255,255,0.12)"` (or rgba(0,0,0,0.08) for light colors).

3. **Given** the combination has a name, **When** the screen renders, **Then** the combination's Japanese name (`combination.nameJp`) and a "Sanzo Wada" attribution line are displayed above the grid. Below the grid, a thin PaletteStrip shows the original Wada color combination as reference.

4. **Given** all existing interactions are preserved, **When** the user taps two cards, **Then** the tap-swap behavior works identically (hapticMedium, VoiceOver announcements, color swap between cards). **When** the user taps the ⇅ toggle on a card, **Then** the garment variant cycles (T-shirt↔Shirt, etc.) with hapticMedium and VoiceOver announcement. All accessibility labels, roles, and states are preserved.

5. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors and existing interaction tests are updated to work with the new layout.

## Tasks / Subtasks

- [x] Task 1: Create FlatLayCard component (AC: #1, #2, #4)
  - [x] 1.1 Create `src/components/FlatLayCard.tsx` — a Pressable card that displays: background color (color.hex), garment silhouette PNG as centered watermark (tintColor white/12% opacity or dark/8% for light colors), color nameJp (Noto Serif JP, ~10px, bottom-center), color nameEn (smaller, below nameJp), variant toggle button (⇅) in top-right corner. Props: `garmentType`, `color` (Color object), `isSelected`, `onTap`, `onVariantToggle`. Selected state uses same Reanimated breathe border animation from GarmentSlot. Card has 14px border-radius. Light color detection: use luminance threshold (R*0.299 + G*0.587 + B*0.114 > 186 → dark text/watermark).
  - [x] 1.2 Create `src/components/FlatLayCard.test.tsx` — test renders garment type label, color names (JP + EN), accessibility labels preserved ("T-shirt, colored Red, tap to select for swap"), onTap callback, onVariantToggle callback, selected state.

- [x] Task 2: Create FlatLayGrid component replacing OutfitMannequin (AC: #1, #3)
  - [x] 2.1 Create `src/components/FlatLayGrid.tsx` — replaces OutfitMannequin. Renders FlatLayCards in a responsive grid layout. Grid configurations: 2 cards → 1 column × 2 rows (each card flex:1), 3 cards → top row 2 cards + bottom row 1 card full-width, 4 cards → 2×2 grid. Uses `gap: 6` between cards. Accepts same props as OutfitMannequin: `slots`, `selectedSlotIndex`, `onSlotTap`, `onVariantToggle`. Container uses `flex:1` to fill available space — no `availableHeight`/`containerWidth` needed.
  - [x] 2.2 Create `src/components/FlatLayGrid.test.tsx` — test renders correct number of cards for 2/3/4 colors, accessibility label "Outfit flat lay", correct grid layout per slot count.

- [x] Task 3: Update OutfitVisualizer screen (AC: #3, #4)
  - [x] 3.1 Refactor `OutfitVisualizer.tsx` — replace OutfitMannequin with FlatLayGrid. Remove `onLayout`/`mannequinLayout` state (no longer needed). Add combination header above grid: `combination.nameJp` in Noto Serif JP + "N colors · Sanzo Wada" subtitle. Replace PaletteBar below grid with a thin inline PaletteStrip (just the color strip, no labels — the labels are now on the cards themselves). Keep all haptic/VoiceOver logic unchanged.
  - [x] 3.2 Update `OutfitVisualizer.test.tsx` — remove `triggerMannequinLayout()` calls (no longer needed). Update assertions to find FlatLayCards instead of mannequin garment slots. Verify combination name header renders. All interaction tests (swap, toggle, haptic, VoiceOver) must pass with updated selectors.

- [x] Task 4: Cleanup + AC verification (AC: #5)
  - [x] 4.1 Delete or deprecate OutfitMannequin component — it's fully replaced by FlatLayGrid. Keep GarmentSlot only if FlatLayCard reuses it internally, otherwise mark as unused. The 8 garment PNG components stay (FlatLayCard uses them as watermarks).
  - [x] 4.2 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all must pass with 0 errors.
  - [x] 4.3 Point-by-point AC verification.
  - [x] 4.4 Update `docs/project-context.md` with new components and flat lay pattern.

## Dev Notes

### What Story 2.3 Introduced (Current State)

Story 2.3 replaced the broken proportions with a responsive system:
- `OutfitVisualizer` uses `onLayout` to measure available space, passes `availableHeight`/`containerWidth` to OutfitMannequin
- `OutfitMannequin` distributes height/width via `HEIGHT_RATIOS` and `WIDTH_RATIOS`
- `GarmentSlot` accepts `slotWidth`/`slotHeight` from parent
- All 8 garment components accept `width`/`height` props, use `resizeMode="contain"`
- 164 tests pass

### Why Flat Lay Replaces Mannequin

1. **Scalability** — Adding future garment types (accessories, bags, hats) breaks vertical stacking. Flat lay grid adapts to any count.
2. **Wada identity** — Cards with Japanese names and color backgrounds feel like the rest of the app. Mannequin felt like a different app.
3. **Shareability** — Flat lay is Instagram-native content. Epic 3 (Social Sharing) benefits directly.
4. **Equal-weight cards** — No garment is "the main one". Users swap freely without feeling the auto-assignment is wrong.

### FlatLayCard — Key Design Decisions

**Garment PNG as watermark:**
```tsx
<Image
  source={require("@/assets/garments/top-tshirt.png")}
  style={{ tintColor: isLightColor ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)" }}
  resizeMode="contain"
/>
```
The PNG is NOT the focus — it's a subtle hint of what garment this card represents. The color and the Japanese name are the focus. This keeps it Wada-first, garment-second.

**Light color detection:**
```typescript
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = r * 0.299 + g * 0.587 + b * 0.114;
  return luminance > 186;
}
```
Light colors (#f0d5b0, whites, yellows) get dark text/watermark. Dark colors get white text/watermark. This already exists conceptually in PaletteBar's border logic — extend it.

**Variant toggle:**
Small ⇅ icon in top-right corner of card. Same `onVariantToggle` callback, same haptic, same VoiceOver. Just repositioned from GarmentSlot's bottom-right to card's top-right.

### Grid Layout Configurations

```
2 colors:        3 colors:        4 colors:
┌──────────┐    ┌─────┬─────┐    ┌─────┬─────┐
│  Card 1  │    │  1  │  2  │    │  1  │  2  │
├──────────┤    ├─────┴─────┤    ├─────┼─────┤
│  Card 2  │    │     3     │    │  3  │  4  │
└──────────┘    └───────────┘    └─────┴─────┘
```

For 2 colors: single column, each card takes flex:1
For 3 colors: top row flex with 2 cards, bottom row single card full-width (shorter height)
For 4 colors: 2×2 grid, all cards equal

Use `flexWrap: "wrap"` or nested flex rows. Cards use `flex:1` within their row so they auto-size.

### Combination Header

```tsx
<View className="items-center py-2">
  <Text className="font-serif-jp text-sm text-text-primary">
    {combination.nameJp}
  </Text>
  <Text className="font-sans text-[9px] text-text-tertiary">
    {combination.colors.length} colors · Sanzo Wada
  </Text>
</View>
```

This connects the outfit back to Wada's dictionary. The nameJp is already in the Combination type — just not displayed currently.

### Mini PaletteStrip Below Grid

Replace the current PaletteBar (swatches with JP names) with a thin horizontal strip:
```tsx
<View className="flex-row mx-4 my-2 rounded-md overflow-hidden" style={{ height: 20 }}>
  {slots.map((slot, i) => (
    <View key={i} style={{ flex: 1, backgroundColor: slot.color.hex }} />
  ))}
</View>
```
The JP names are already on the cards — the strip is just a compact color reference. This mirrors how PaletteStrip looks in the Combinations screen, creating visual consistency.

### What To Reuse vs Replace

| Component | Action | Reason |
|-----------|--------|--------|
| GarmentSlot | DELETE | Replaced by FlatLayCard |
| OutfitMannequin | DELETE | Replaced by FlatLayGrid |
| PaletteBar | DELETE | Replaced by mini strip in OutfitVisualizer |
| 8 garment PNGs | KEEP | Used as watermarks in FlatLayCard |
| garments/index.ts | KEEP | Registry still needed for labels + components |
| useOutfitState | KEEP | All state logic unchanged |
| GarmentSlot.test.tsx | DELETE | Replaced by FlatLayCard.test.tsx |
| OutfitMannequin.test.tsx | DELETE | Replaced by FlatLayGrid.test.tsx |
| PaletteBar.test.tsx | DELETE | Strip is too simple to need dedicated tests |

### Accessibility — Unchanged

- FlatLayCard: `accessibilityRole="button"`, `accessibilityLabel="{garment type}, colored {nameEn}, tap to select for swap"`, `accessibilityState={{ selected: isSelected }}`
- FlatLayGrid: `accessibilityLabel="Outfit flat lay"`
- VoiceOver announcements: identical to current (select, swap, toggle)
- Touch targets: each card is well above 44×44px minimum
- Reduce Motion: same Reanimated logic applies

### NativeWind + Pressable Pattern

Same pattern as GarmentSlot — use children render function for press state:
```tsx
<Pressable onPress={onTap}>
  {({ pressed }) => (
    <Animated.View style={[borderStyle, { opacity: pressed ? 0.88 : 1 }]}>
      {/* card content */}
    </Animated.View>
  )}
</Pressable>
```

### Testing Strategy

FlatLayCard tests mirror GarmentSlot tests (render, tap, toggle, a11y). FlatLayGrid tests mirror OutfitMannequin tests (2/3/4 configs). OutfitVisualizer tests update selectors but test the same interactions. Net test count should be similar (~164).

### Git Intelligence

Create story branch `story-2.4-flat-lay-visualizer` off `epic-2`.

### References

- [Source: docs/planning/outfinder_visualizer_proposals.html] — Proposal B mockup (flat lay)
- [Source: docs/planning/outfinder_enriched_favorites_mockup.html] — future feature context
- [Source: src/components/GarmentSlot.tsx] — current Reanimated animation to port to FlatLayCard
- [Source: src/components/OutfitMannequin.tsx] — current grid logic to replace with FlatLayGrid
- [Source: src/hooks/useOutfitState.ts] — state logic stays unchanged
- [Source: src/data/types.ts] — Combination type has nameJp/nameEn already available

### File List

- src/components/FlatLayCard.tsx (NEW — replaces GarmentSlot)
- src/components/FlatLayCard.test.tsx (NEW — replaces GarmentSlot.test.tsx)
- src/components/FlatLayGrid.tsx (NEW — replaces OutfitMannequin)
- src/components/FlatLayGrid.test.tsx (NEW — replaces OutfitMannequin.test.tsx)
- src/screens/OutfitVisualizer.tsx (MODIFIED — FlatLayGrid + combo header + mini strip)
- src/screens/OutfitVisualizer.test.tsx (MODIFIED — updated selectors, removed triggerMannequinLayout)
- src/components/GarmentSlot.tsx (DELETE — replaced by FlatLayCard)
- src/components/GarmentSlot.test.tsx (DELETE — replaced by FlatLayCard.test.tsx)
- src/components/OutfitMannequin.tsx (DELETE — replaced by FlatLayGrid)
- src/components/OutfitMannequin.test.tsx (DELETE — replaced by FlatLayGrid.test.tsx)
- src/components/PaletteBar.tsx (DELETE — replaced by inline mini strip)
- src/components/PaletteBar.test.tsx (DELETE — strip too simple for dedicated tests)
- src/components/garments/index.ts (NO CHANGE — registry still used)
- src/components/garments/*.tsx (NO CHANGE — PNGs used as watermarks)
- docs/project-context.md (MODIFIED — updated component list)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED — status updates)
- _bmad-output/implementation-artifacts/2-4-flat-lay-visualizer-with-wada-identity.md (MODIFIED — task checkboxes, dev record)

## Dev Agent Record

### Implementation Plan
- Created FlatLayCard component with Color object props, light/dark color detection, garment watermark via GarmentComponent, Reanimated breathe border animation, variant toggle, JP/EN color names
- Created FlatLayGrid with responsive grid layouts (2: 1×2, 3: 2+1, 4: 2×2) using nested flex rows
- Refactored OutfitVisualizer to use FlatLayGrid + combination header (nameJp + Wada attribution) + mini PaletteStrip
- Deleted GarmentSlot, OutfitMannequin, PaletteBar and their tests (fully replaced)
- All haptic/VoiceOver/accessibility logic preserved unchanged

### Completion Notes
- 164 tests pass (19 suites), same count as before — tests replaced, not reduced
- FlatLayCard: 12 tests (a11y, tap, toggle, watermark tint, light/dark detection)
- FlatLayGrid: 5 tests (2/3/4 card configs, empty state, a11y label)
- OutfitVisualizer: 15 tests (render configs, header, palette strip, haptics, VoiceOver, swap, deselect)
- `npx tsc --noEmit`: 0 errors
- `pnpm lint`: 0 errors
- Merged stories 2.1 + 2.2 into epic-2 (were done but unmerged) to get base code

### Debug Log
- No issues encountered

## Change Log
- 2026-03-16: Story 2.4 implemented — flat lay visualizer replacing mannequin layout, combo header with Wada identity, mini palette strip
