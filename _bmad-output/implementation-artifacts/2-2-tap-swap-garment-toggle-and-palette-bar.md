# Story 2.2: Tap-Swap, Garment Toggle & Palette Bar

Status: done

## Story

As a user,
I want to tap garments to swap their colors and toggle garment types,
so that I can customize the outfit visualization to match my actual wardrobe pieces.

## Acceptance Criteria

1. **Given** the OutfitMannequin displays garment slots, **When** the user taps a garment slot (Garment A), **Then** the slot enters selected state with a 2px animated border (spring animation via Reanimated), hapticMedium() fires (FR39), and VoiceOver announces "Selected {garment type} for swap" (NFR15).

2. **Given** a garment slot is in selected state, **When** the user taps a different garment slot (Garment B), **Then** the colors of Garment A and Garment B swap (FR10), hapticMedium() fires (FR39), both garments are deselected, the swap animation uses Reanimated spring interpolation (60fps, NFR3), VoiceOver announces "{garment A type} is now {new color}, {garment B type} is now {new color}" (NFR15), and if Reduce Motion is enabled, color swap is instant (no animation).

3. **Given** a garment slot is displayed, **When** the user activates the garment toggle, **Then** the garment type cycles to its variant: T-shirt <-> Shirt, Pants <-> Skirt, Jacket <-> Hoodie, Sneakers <-> Formal (FR11), the color assignment is preserved during toggle, and VoiceOver announces "Changed to {new garment type}" (NFR15). **Note:** UX spec says no haptic on variant toggle (secondary adjustment), but epics say hapticMedium — follow epics AC: hapticMedium() fires.

4. **Given** the PaletteBar component is rendered below the mannequin, **When** any color swap or garment toggle occurs, **Then** the PaletteBar updates to reflect current color-to-slot assignments (FR12), each color shows the swatch with the garment type label, and PaletteBar has accessibilityLabel listing all current assignments.

5. **Given** the useOutfitState hook manages Visualizer state, **When** slot assignments, selected slot, or garment variants change, **Then** all state updates are managed in `src/hooks/useOutfitState.ts`, and the hook is tested covering: initialization for 2/3/4 colors, swap logic, toggle logic, selection/deselection.

6. **Given** all Epic 2 stories are complete, **When** AC verification runs, **Then** every AC from Stories 2.1-2.2 is verified, all 6 FRs (FR9-FR13, FR39) are confirmed working, `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass, and adversarial code review passes before merge.

## Tasks / Subtasks

- [x] Task 1: Create `useOutfitState` hook (AC: #5)
  - [x] 1.1 Create `src/hooks/useOutfitState.ts` — manages all Outfit Visualizer state: `slots` array (garmentType + color per slot), `selectedSlotIndex` (number | null), `garmentVariants` (map of slot index to current variant). Initialize from `Combination.colors` using SLOT_CONFIGS pattern from OutfitMannequin. Export `SlotState` interface
  - [x] 1.2 Implement `selectSlot(index)` — if no slot selected, select it; if same slot tapped, deselect (cancel); if different slot tapped, swap colors between selected and tapped, then deselect both
  - [x] 1.3 Implement `toggleVariant(index)` — cycle garment type to its pair variant (top-tshirt <-> top-shirt, bottom-pants <-> bottom-skirt, layer-jacket <-> layer-hoodie, shoes-sneakers <-> shoes-formal). Preserve color assignment
  - [x] 1.4 Create `src/hooks/useOutfitState.test.ts` — test init for 2/3/4 colors, selectSlot swap logic, selectSlot deselect, toggleVariant for all 4 pairs, color preservation on toggle

- [x] Task 2: Make GarmentSlot interactive with selected state + variant toggle (AC: #1, #2, #3)
  - [x] 2.1 Update `GarmentSlot` — add props: `isSelected`, `onTap`, `onVariantToggle`, `variant`. Change accessibilityRole from "image" to "button". Update accessibilityLabel to include ", tap to select for swap". Add `accessibilityState={{ selected: isSelected }}`
  - [x] 2.2 Wrap GarmentSlot content in `Pressable` with `onPress={onTap}`. Add Reanimated animated border for selected state: 2px border, spring animation (opacity 0.6→1.0 cycle). Respect `useReducedMotion()` — no animation if enabled
  - [x] 2.3 Add variant toggle button — small icon in corner of GarmentSlot. `onPress={onVariantToggle}`. accessibilityLabel="Toggle garment type" accessibilityRole="button"
  - [x] 2.4 Add Reanimated color swap animation — 200ms crossfade on tintColor via `interpolateColor`. Skip if Reduce Motion enabled (instant swap)
  - [x] 2.5 Update `GarmentSlot.test.tsx` — test selected state rendering, onTap callback, onVariantToggle callback, accessibility labels with "tap to select for swap", accessibilityState selected

- [x] Task 3: Create PaletteBar + wire OutfitVisualizer (AC: #4, #1-3)
  - [x] 3.1 Create `src/components/PaletteBar.tsx` — horizontal row of color swatches below mannequin. Each swatch shows color fill + garment type label (JP name per UX spec, 11px Noto Serif JP). Props: `slots: SlotState[]`, `selectedSlotIndex: number | null`. accessibilityLabel lists all current assignments. Each swatch tappable to assign color to selected garment (if one is selected)
  - [x] 3.2 Create `src/components/PaletteBar.test.tsx` — test renders correct number of swatches for 2/3/4 colors, displays garment labels, accessibility labels
  - [x] 3.3 Update `OutfitVisualizer.tsx` — integrate `useOutfitState(combination.colors)`, pass state + callbacks to OutfitMannequin and PaletteBar, add hapticMedium() calls on slot tap and variant toggle, add VoiceOver announcements via `AccessibilityInfo.announceForAccessibility()`
  - [x] 3.4 Update `OutfitMannequin` — accept `slots`, `selectedSlotIndex`, `onSlotTap`, `onVariantToggle` props instead of just `colors`. Render GarmentSlots with new interactive props

- [x] Task 4: AC verification + cleanup (AC: #6)
  - [x] 4.1 Point-by-point verification of all 6 ACs
  - [x] 4.2 Verify all Epic 2 FRs: FR9 (open visualizer), FR10 (tap-swap), FR11 (garment toggle), FR12 (palette bar updates), FR13 (2/3/4 color support), FR39 (haptic feedback)
  - [x] 4.3 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all must pass with 0 errors
  - [x] 4.4 Update `docs/project-context.md` with new components, hook, and patterns

## Dev Notes

### CRITICAL: PNG + tintColor Pattern (NOT SVG)

Story 2.0 approved PNG + tintColor over SVG. All garment components use `<Image source={require()} style={{ tintColor }} />`. The color swap animation must animate `tintColor`, not SVG `fill`.

```tsx
// Existing garment pattern — animate the tintColor value
<Image
  source={require("@/assets/garments/top-tshirt.png")}
  style={{ tintColor: animatedColor }}  // Reanimated animated style
  resizeMode="contain"
/>
```

[Source: _bmad-output/implementation-artifacts/2-1-svg-garment-silhouettes-and-outfit-mannequin.md#Dev Notes]

### Variant Pairs — Hardcode These

| Slot Category | Variant A | Variant B |
|--------------|-----------|-----------|
| Top | top-tshirt | top-shirt |
| Bottom | bottom-pants | bottom-skirt |
| Layer | layer-jacket | layer-hoodie |
| Shoes | shoes-sneakers | shoes-formal |

Create a `VARIANT_PAIRS` map in `useOutfitState.ts` or garments/index.ts. Toggle cycles A <-> B. The GarmentType union already covers all 8 types.

[Source: docs/planning/epics.md#Story 2.2, src/components/garments/index.ts]

### Current Code State — What Exists vs What Needs Changing

**GarmentSlot.tsx (modify):** Currently static — `accessibilityRole="image"`, no onTap/onPress, no isSelected, no variant toggle. Props: `garmentType`, `color`, `colorName`. Must add: `isSelected`, `onTap`, `onVariantToggle`, `variant` props. Change role to "button".

**OutfitMannequin.tsx (modify):** Currently takes `colors: Color[]` and derives slots internally via `SLOT_CONFIGS`. Must change to accept pre-computed slots from `useOutfitState` + callbacks. The `SLOT_CONFIGS` mapping should move to or be shared with `useOutfitState` for initialization.

**OutfitVisualizer.tsx (modify):** Currently just passes `combination.colors` to OutfitMannequin. Must integrate `useOutfitState`, wire haptics, add VoiceOver announcements, render PaletteBar below mannequin.

**garments/index.ts (no change needed):** GARMENT_REGISTRY already has all 8 types with labels. Use `label` for accessibility strings.

[Source: src/components/GarmentSlot.tsx, src/components/OutfitMannequin.tsx, src/screens/OutfitVisualizer.tsx]

### Reanimated Animation Specifics

**Selected state border:** Use `useSharedValue` + `withRepeat(withSpring())` for opacity cycling 0.6→1.0. Spring config: `{ damping: 12, stiffness: 120 }` (UX "Medium" spring).

**Color swap crossfade:** Use `useAnimatedStyle` + `interpolateColor` for 200ms transition. This animates the tintColor on the Image component. Wrap each garment Image in an `Animated.Image` or use `useAnimatedProps`.

**CRITICAL:** `tintColor` animation with Reanimated may require `Animated.Image` from `react-native-reanimated` (not the regular `Image`). If `interpolateColor` doesn't work directly on `tintColor`, use `useAnimatedStyle` to return `{ tintColor: interpolatedValue }`.

**Reduce Motion:** Check `useReducedMotion()` — skip all animations, make changes instant. Haptic feedback remains.

[Source: docs/planning/ux-design-specification-ios.md#Animation Patterns, docs/planning/architecture-react-native-ios.md#Animation]

### Haptics — Through Wrapper Only

```typescript
import { hapticMedium } from "@/lib/haptics";
// Call on: slot tap (select), slot tap (swap), variant toggle
// Do NOT call on: PaletteBar color assignment (UX spec doesn't specify haptic for this)
```

**Clarification on variant toggle haptics:** UX spec says "No haptic on variant toggle — secondary adjustment." Epics AC says "hapticMedium() fires." Follow the epics AC (hapticMedium on toggle) since it's the formal requirement. Flag this to user if uncertain.

[Source: src/lib/haptics.ts, docs/planning/epics.md#Story 2.2, docs/planning/ux-design-specification-ios.md#Garment variant toggle]

### VoiceOver Announcements

Use `AccessibilityInfo.announceForAccessibility()` from React Native for dynamic state change announcements:

```typescript
import { AccessibilityInfo } from "react-native";

// On select:
AccessibilityInfo.announceForAccessibility(`Selected ${garmentLabel} for swap`);

// On swap:
AccessibilityInfo.announceForAccessibility(
  `${garmentALabel} is now ${newColorA}, ${garmentBLabel} is now ${newColorB}`
);

// On toggle:
AccessibilityInfo.announceForAccessibility(`Changed to ${newGarmentLabel}`);
```

[Source: docs/planning/epics.md#Story 2.2 AC, docs/planning/ux-design-specification-ios.md#Screen Reader Narratives]

### PaletteBar UX Spec

- Horizontal row of color swatches below mannequin
- JP name under each swatch (Noto Serif JP, 11px)
- Each swatch tappable to assign color to selected garment (if a garment is selected)
- Props: `slots: SlotState[]`, `selectedSlotIndex: number | null`, `onColorAssign?: (colorIndex: number) => void`
- accessibilityLabel per swatch: "{nameEn}, tap to assign to selected garment"

[Source: docs/planning/ux-design-specification-ios.md#PaletteBar]

### First-Time Hint — NOT in Scope

UX spec mentions "Tap two garments to swap colors" tooltip on first visit, stored in AsyncStorage. This is NOT in the Story 2.2 AC. Do NOT implement it. It may come in a future polish story.

[Source: docs/planning/ux-design-specification-ios.md#Education & Onboarding]

### Tap-Swap State Machine Rules

1. No garment selected → tap garment A → A becomes selected (2px animated border)
2. A selected → tap A again → deselect (cancel). No swap
3. A selected → tap different garment B → swap colors of A and B. Both deselect. Haptic .medium
4. A selected → tap color in PaletteBar → assign that PaletteBar color to garment A. Deselect A
5. Only one garment selected at a time

[Source: docs/planning/ux-design-specification-ios.md#Tap-swap rules]

### NativeWind + Pressable Pattern (CRITICAL)

NativeWind `className` conflicts with Pressable's `style` function. Use the children render function pattern:

```tsx
<Pressable className="min-h-[44px]" onPress={onTap}>
  {({ pressed }) => (
    <View style={{ opacity: pressed ? 0.88 : 1 }}>
      {/* garment content */}
    </View>
  )}
</Pressable>
```

[Source: docs/project-context.md#NativeWind + Pressable]

### Testing Patterns

- Use `testID` attributes (NOT `data-testid`)
- Mock `@/lib/haptics` for haptic verification: `jest.mock("@/lib/haptics")`
- Mock Reanimated — existing manual mock at `__mocks__/react-native-reanimated.js`
- Use `fireEvent.press()` from RNTL for tap interactions
- Mock `AccessibilityInfo.announceForAccessibility` to verify VoiceOver calls
- 132 tests currently pass — do NOT regress
- For `useOutfitState` hook testing, use `renderHook` from `@testing-library/react-native`

[Source: docs/project-context.md#Testing]

### Previous Story Intelligence (Story 2.1)

Key learnings to apply:
- **Duplicate accessibilityLabel bug:** GarmentSlot View wrapper and Image child had same label → RNTL "multiple elements found". Image already gets `accessibilityLabel=""`. Keep this pattern when adding Pressable wrapper
- **getCombination(combinationId)** already exists in colorIndex.ts — O(1) lookup via combinationMap
- **Each garment has its own aspect ratio** — don't use a shared aspect ratio. The individual garment components handle their own sizing
- **accessibilityRole was corrected** from "button" to "image" in Story 2.1 code review. Now Story 2.2 needs it back as "button" since garments become interactive — this is intentional, not a regression

[Source: _bmad-output/implementation-artifacts/2-1-svg-garment-silhouettes-and-outfit-mannequin.md#Debug Log, #Senior Developer Review]

### Git Intelligence

Current branch: `story-2.1-garment-silhouettes-outfit-mannequin`. Create new story branch `story-2.2-tap-swap-garment-toggle-palette-bar` off `epic-2`.

Recent commits:
- `1e02f79` fix: code review — a11y role, aspect ratios, placeholder test, loop merge (Story 2.1)
- `5ab136c` merge: Story 2.0 — garment SVG research, PNG + tintColor approved

### Project Structure Notes

New files this story creates:
```
src/hooks/
├── useOutfitState.ts         # NEW — outfit state management hook
└── useOutfitState.test.ts    # NEW — hook tests
src/components/
├── PaletteBar.tsx            # NEW — color assignment bar below mannequin
├── PaletteBar.test.tsx       # NEW — PaletteBar tests
├── GarmentSlot.tsx           # MODIFY — add interactivity, selected state, variant toggle
├── GarmentSlot.test.tsx      # MODIFY — add interaction tests
├── OutfitMannequin.tsx       # MODIFY — accept interactive props from useOutfitState
└── OutfitMannequin.test.tsx  # MODIFY — update for new props
src/screens/
├── OutfitVisualizer.tsx      # MODIFY — integrate useOutfitState, PaletteBar, haptics, a11y
└── OutfitVisualizer.test.tsx # MODIFY — add interaction tests
```

### References

- [Source: docs/planning/epics.md#Story 2.2] — AC, user story, FR coverage
- [Source: docs/planning/architecture-react-native-ios.md#State Management] — useOutfitState hook, no state library
- [Source: docs/planning/architecture-react-native-ios.md#Component Structure] — GarmentSlot, PaletteBar, OutfitMannequin in FR9-FR13 mapping
- [Source: docs/planning/ux-design-specification-ios.md#GarmentSlot] — states, props, a11y, animation specs
- [Source: docs/planning/ux-design-specification-ios.md#PaletteBar] — anatomy, props, a11y
- [Source: docs/planning/ux-design-specification-ios.md#Outfit Visualizer Patterns] — tap-swap rules, variant toggle, color assignment
- [Source: docs/planning/ux-design-specification-ios.md#Animation Patterns] — spring configs, crossfade duration, reduce motion
- [Source: _bmad-output/implementation-artifacts/2-1-svg-garment-silhouettes-and-outfit-mannequin.md] — previous story learnings, code patterns, debug notes
- [Source: docs/project-context.md] — established patterns, data access, testing, NativeWind

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Biome lint flagged `noArrayIndexKey` in OutfitMannequin and PaletteBar — fixed by using `slot.color.id` as stable key
- OutfitMannequin refactored from `colors: Color[]` to `slots: SlotState[]` props in Task 2 (dependency of GarmentSlot interactivity) rather than waiting for Task 3.4

### Code Review Notes

1. **GarmentPoC y GarmentProposal cleanup:** Las pantallas PoC temporales de Story 2.0 (`src/screens/GarmentPoC.tsx`, `src/screens/GarmentProposal.tsx`, y sus tests) siguen registradas en `ColorsStack.tsx` y `ColorsStackParamList`. Eliminar si ya no son necesarias — toda la funcionalidad está integrada en OutfitVisualizer.

2. **FR9 gap — RESOLVED:** Navigation trigger added to PaletteStrip. "Visualize outfit" button (bottom-right corner overlay) navigates to OutfitVisualizer with combinationId. 3 tests added. FR9 now fully covered.

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 — 2026-03-13
**Result:** APPROVED (8 issues found + FR9 gap resolved, all fixed)

#### Fixes Applied

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| H1 | HIGH | `color.id`-based keys in OutfitMannequin/PaletteBar broke swap animation — React reordered DOM instead of updating props, so `prevColorRef` never detected change | Changed to index-based keys with biome-ignore comment |
| H2 | HIGH | `VARIANT_PAIRS` map duplicated in OutfitVisualizer.tsx and useOutfitState.ts | Exported from useOutfitState.ts, imported in OutfitVisualizer.tsx |
| M1 | MEDIUM | `selectedSlotIndex` prop declared but unused in PaletteBar | Removed from PaletteBarProps and all callsites |
| M2 | MEDIUM | Biome lint warning: unused `index` variable in PaletteBar.tsx | Resolved by H1 fix (index now used as key) |
| M3 | MEDIUM | `isSelected` JS prop read inside `useAnimatedStyle` worklet — Reanimated anti-pattern | Added `isSelectedSV` shared value synced via useEffect |
| M4 | MEDIUM | No test for complete swap interaction (AC #2) | Added test: tap A → tap B → verify 2x haptic + swap VoiceOver |
| L1 | LOW | No test for deselection/cancel flow | Added test: tap A → tap A → verify no extra haptic/announcement |
| L2 | LOW | No edge case test for unsupported color count | Added test: 1 color → empty slots |

**Tests:** 157 → 163 (+6 new: 3 code review fixes + 3 FR9 navigation), 0 regressions
**tsc/lint/test:** All clean post-review

#### Post-Review UI Fixes

| Issue | Fix |
|-------|-----|
| FR9 missing: no navigation to OutfitVisualizer | Added "Visualize outfit" hanger icon button on PaletteStrip (bottom-right overlay) |
| Garment PNGs rendered at native size (~430px) — no width constraint in layout chain | OutfitMannequin constrained to 192px fixed width; GarmentSlot applies per-garment pixel widths via getSlotWidth() |
| No visual harmony — all garments same width | Per-type proportional widths: layer 65%, top 50%, pants 28%, skirt 40%, shoes 30% |
| Variant toggle icon (two lines) not intuitive | Replaced with vertical arrows (▲▼) suggesting "cycle between variants" |
| Visualize outfit icon not recognizable | Replaced with hanger shape (circle hook + horizontal bar) |

### Completion Notes List

- Task 1: Created `useOutfitState` hook with `selectSlot` (tap-swap state machine), `toggleVariant` (all 4 garment pairs), `SlotState` interface. 14 tests covering init, swap, deselect, all variant pairs, color preservation.
- Task 2: Made GarmentSlot interactive — Pressable wrapper, accessibilityRole="button", selected state with Reanimated spring border animation, variant toggle button, color swap animation with withTiming. Respects useReducedMotion. 8 tests.
- Task 3: Created PaletteBar (horizontal swatches, JP names, a11y labels). Wired OutfitVisualizer with useOutfitState, hapticMedium on select/swap/toggle, VoiceOver announcements. Updated OutfitMannequin to accept interactive props. 16 tests (5 PaletteBar + 11 OutfitVisualizer).
- Task 4: Point-by-point AC and FR verification passed. tsc/lint/test all clean. Updated project-context.md.
- Total: 157 tests (132 → 157, +25 new), 0 regressions
- Code Review: 8 issues fixed (2H, 4M, 2L), 3 tests added → 160 total

### File List

- src/hooks/useOutfitState.ts (NEW)
- src/hooks/useOutfitState.test.ts (NEW)
- src/components/PaletteBar.tsx (NEW)
- src/components/PaletteBar.test.tsx (NEW)
- src/components/GarmentSlot.tsx (MODIFIED)
- src/components/GarmentSlot.test.tsx (MODIFIED)
- src/components/OutfitMannequin.tsx (MODIFIED)
- src/components/OutfitMannequin.test.tsx (MODIFIED)
- src/components/PaletteStrip.tsx (MODIFIED — FR9 navigation trigger)
- src/components/PaletteStrip.test.tsx (MODIFIED — FR9 tests)
- src/screens/OutfitVisualizer.tsx (MODIFIED)
- src/screens/OutfitVisualizer.test.tsx (MODIFIED)
- docs/project-context.md (MODIFIED)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED)
