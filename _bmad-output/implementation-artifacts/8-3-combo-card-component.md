# Story 8.3: ComboCard Component

Status: done

## Story

As a **user browsing combinations for my shade**,
I want **a card showing the color palette, combination name, and clear actions (favorite + see outfit)**,
so that **I can scan combinations quickly, save favorites, and open the Visualizer without confusion**.

## Acceptance Criteria

1. **Given** a ComboCard is rendered in "full" variant, **When** the card displays, **Then** it shows: color strip (60px height, full width, colors fill equally), "yours" label on the user's shade segment, JP name (14px Noto Serif JP medium), EN name (11px Inter, #6b6b6b), heart icon (18px), and "See outfit" dark pill (dark bg, shirt icon + "See outfit" text 11px Inter white).

2. **Given** the user's selected shade appears in the combination, **When** the ComboCard renders with showYoursLabel=true and yourColorId set, **Then** "yours" text appears centered at the bottom of that color segment **And** the label has adaptive contrast (light text on dark colors, dark text on light colors).

3. **Given** ComboCard renders with showYoursLabel=false (Favorites context), **When** the card displays, **Then** no "yours" label appears on any color segment.

4. **Given** the user taps anywhere on the combo card, **When** the tap registers, **Then** hapticMedium() fires **And** navigation.push("OutfitVisualizer", { combinationId }) executes.

5. **Given** the user taps the heart icon on a combo card, **When** the tap registers, **Then** the heart toggles (fill/unfill) via useFavorites().toggle(combinationId) **And** hapticLight() fires **And** the card tap does NOT fire (nested Pressable captures event) **And** premium paywall triggers if free user exceeds limit (via usePremiumGate).

6. **Given** a list of combo cards for a shade, **When** the cards render, **Then** they are ordered by combination size: 2-color first, then 3-color, then 4-color **And** no section headers separate the groups. (Ordering provided by data layer — getCombinationsByWardrobe already returns sorted by size from Story 8.1.)

7. **Given** ComboCard is rendered in "compact" variant (for Favorites, Story 9.1), **When** the card displays, **Then** it uses: 52px strip, 13px JP name, 10px EN name, 16px heart, 16px shirt icon (no text pill) **And** no "yours" label appears.

## Tasks / Subtasks

- [x] Task 1: Create ComboCard component with "full" variant (AC: #1, #2, #3, #4, #5)
  - [x] 1.1 Create `src/components/ComboCard.tsx` with `ComboCardProps` interface: `variant: "full" | "compact"`, `combination: Combination`, `showYoursLabel?: boolean`, `yourColorId?: string`, `isFavorite: boolean`, `onToggleFavorite: () => void`, `onPremiumGate?: () => void`
  - [x] 1.2 Render outer Pressable (entire card tappable): `onPress` → `hapticMedium()` + `navigation.push("OutfitVisualizer", { combinationId })`
  - [x] 1.3 Render color strip: `View` with `flex-row`, height 60px, rounded-t-lg. Map `combination.colors` to equal-width segments (`flex-1`) with `style={{ backgroundColor: color.hex }}`
  - [x] 1.4 Render "yours" label: if `showYoursLabel && yourColorId === color.id`, show "yours" text centered at bottom of that segment. Use `isLightColor(color.hex)` for contrast — dark text (#1a1a1a) on light colors, white text on dark colors
  - [x] 1.5 Render info row below strip: JP name (14px Noto Serif JP medium), EN name (11px Inter, #6b6b6b), heart button (reuse `FavoriteButton` with 18px icon), "See outfit" pill (dark bg #1a1a1a, rounded-full, 32px height, shirt SymbolView + text 11px Inter white)
  - [x] 1.6 Heart button: nested Pressable inside card Pressable — RN nested Pressables automatically prevent outer onPress from firing (no explicit stopPropagation needed). Pass `isFavorite`, `onToggleFavorite`, `onPremiumGate` to `FavoriteButton`
  - [x] 1.7 Card styling: rounded-lg, bg-white, shadow or border for card elevation, 12px padding on info area

- [x] Task 2: Add "compact" variant (AC: #7)
  - [x] 2.1 When `variant === "compact"`: strip height 52px, JP name 13px, EN name 10px, heart icon 16px, shirt icon 16px (no text, no pill background)
  - [x] 2.2 Compact variant always hides "yours" label regardless of `showYoursLabel` prop
  - [x] 2.3 Compact info row: JP name + EN name stacked, heart + shirt icon row below (tighter layout for 2-column grid in Favorites)

- [x] Task 3: Write comprehensive tests (AC: #1-#7)
  - [x] 3.1 Create `src/components/ComboCard.test.tsx` co-located with source
  - [x] 3.2 Test full variant: renders color strip with correct number of segments, renders JP name, renders EN name, renders heart icon, renders "See outfit" pill text
  - [x] 3.3 Test "yours" label: shows when `showYoursLabel=true` and `yourColorId` matches a color, hidden when `showYoursLabel=false`, adaptive contrast (dark text on light color, light text on dark color)
  - [x] 3.4 Test card tap: fires `hapticMedium()` and calls `navigation.push("OutfitVisualizer", { combinationId })`
  - [x] 3.5 Test heart tap: fires `hapticLight()`, calls `onToggleFavorite`, does NOT trigger card navigation
  - [x] 3.6 Test premium gate: when `onPremiumGate` provided and not favorite, heart press calls `onPremiumGate`
  - [x] 3.7 Test compact variant: 52px strip, smaller text sizes, no "yours" label, no "See outfit" text (just icon)
  - [x] 3.8 Test accessibility: card has `accessibilityRole="button"` and label with combination name, heart has proper labels

- [x] Task 4: Verify all ACs + run full suite (AC: #1-#7)
  - [x] 4.1 Run `npx tsc --noEmit` — no type errors
  - [x] 4.2 Run `pnpm lint` — no lint errors
  - [x] 4.3 Run `pnpm test` — full suite passes, no regressions (467 tests, 35 suites)
  - [x] 4.4 Walk through each AC point-by-point and verify

## Dev Notes

### Previous Story Intelligence (8.1 + 8.2)

**Story 8.1** created the wardrobe data layer:
- `wardrobeIndex.ts`: `getCombinationsByWardrobe(category)` returns combos sorted by `colors.length` ascending (2→3→4). This satisfies AC #6 ordering.
- `wardrobeData.ts`: WARDROBE_MAP + REPRESENTATIVE_SHADES
- Suite after 8.1: 416 tests, 32 suites

**Story 8.2** created the new ColorHome with fabric swatches:
- `selectedFamily` state prepared for State 2 (Story 8.4)
- `expo-linear-gradient` installed + mocked
- BrowseAllColors registered in ColorsStack
- Debug: TSC required tuple type for LinearGradient colors, Biome reordered imports
- Suite after 8.2: 432 tests, 34 suites

### ComboCard vs PaletteStrip — NOT a Replacement

ComboCard is a **NEW component**. PaletteStrip is NOT modified or deleted:
- `PaletteStrip` (128 lines) is still used by `CombinationList` → `Combinations` screen → `BrowseAllColors` path
- `ComboCard` is used by State 2 (Story 8.4) and Favorites redesign (Story 9.1)
- Different design: ComboCard has "See outfit" pill + "yours" label; PaletteStrip has cross-navigation + selected dot

### FavoriteButton Reuse

Reuse the existing `FavoriteButton` component (`src/components/FavoriteButton.tsx`, 71 lines):
- Already handles: spring animation, hapticLight, premium gate, reduce motion
- Props: `combinationId`, `isFavorite`, `onToggle`, `onPremiumGate?`
- Heart icon: `heart.fill` (red) when favorite, `heart` (grey) when not
- 44x44px minimum touch target

**Key integration:** ComboCard passes `onToggleFavorite` as FavoriteButton's `onToggle` and `onPremiumGate` as FavoriteButton's `onPremiumGate`. The FavoriteButton handles the rest.

### Nested Pressable Event Handling (AC #5)

In React Native, nested `Pressable` components automatically capture touch events — the inner one handles the press and the outer one does NOT fire. This is the native behavior, unlike web's `stopPropagation()`. Structure:

```tsx
<Pressable onPress={handleCardPress}>     {/* Outer: navigate to Visualizer */}
  {/* ... color strip, names ... */}
  <FavoriteButton onToggle={handleHeart} /> {/* Inner: FavoriteButton is a Pressable */}
</Pressable>
```

No explicit stopPropagation needed. The test should verify: pressing heart calls `onToggleFavorite` but does NOT call `navigation.push`.

### Navigation Typing

ComboCard is used in both ColorsStack and FavoritesStack. Both define `OutfitVisualizer: { combinationId: string }`. Use a minimal navigation type:

```typescript
type ComboCardNav = { push(screen: "OutfitVisualizer", params: { combinationId: string }): void };
const navigation = useNavigation<ComboCardNav>();
```

This works in both stacks since `useNavigation()` uses the nearest navigator context, and both stacks register OutfitVisualizer with the same params.

### "See Outfit" Pill Design

Full variant only — compact uses just the icon:

```
Full variant:   [👕 See outfit]  ← dark pill, 32px height, rounded-full
Compact variant: 👕              ← just 16px icon, no background
```

- Pill background: #1a1a1a (textPrimary)
- Text: "See outfit", 11px Inter, white
- Icon: `tshirt` SF Symbol from expo-symbols (or `tshirt.fill`), white tint, 14px
- The pill is NOT an independent tap target — it's part of the card tap area (entire card → Visualizer)
- But it visually communicates "there's something to see" to new users

### "yours" Label Adaptive Contrast

```typescript
const yoursTextColor = isLightColor(color.hex) ? "#1a1a1a" : "#ffffff";
```

- `isLightColor()` from `src/lib/color.ts` uses luminance > 224 threshold
- Position: centered horizontally and at the bottom of the color segment
- Font: 9-10px Inter, bold or semibold
- Only visible when `showYoursLabel === true && yourColorId === color.id`

### Props Interface Design

```typescript
interface ComboCardProps {
  variant: "full" | "compact";
  combination: Combination;
  showYoursLabel?: boolean;      // true in State 2, false in Favorites
  yourColorId?: string;          // the shade the user selected
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPremiumGate?: () => void;
}
```

Note: `isFavorite` and `onToggleFavorite` are NOT optional — the parent (State 2 or Favorites) must connect these to FavoritesContext. This keeps ComboCard as a presentational component that doesn't directly depend on FavoritesContext.

### Compact Variant Layout (Favorites)

The compact variant will be used in Story 9.1's 2-column grid:
- Card width: ~(screenWidth - 32 - 12) / 2 ≈ 170px on iPhone SE
- Strip: 52px height, full width
- Below strip: JP name (13px), EN name (10px)
- Bottom row: heart (16px, filled red if favorite) + shirt icon (16px) — right-aligned or spaced
- No "yours" label, no "See outfit" text pill
- Entire card still tappable → Visualizer

### Test Mock Setup

Follow established patterns from PaletteStrip.test.tsx and FavoriteButton.test.tsx:

```typescript
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: mockPush }),
}));
jest.mock("@/lib/haptics");
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));
jest.mock("expo-symbols", () => ({
  SymbolView: ({ name }: { name: string }) => name,
}));
```

### What NOT to Do

- Do NOT modify PaletteStrip.tsx — it's still used by BrowseAllColors path
- Do NOT modify CombinationList.tsx — it wraps PaletteStrip for the old flow
- Do NOT modify FavoriteButton.tsx — reuse as-is
- Do NOT implement the combo feed/list (FlatList of ComboCards) — that's Story 8.4
- Do NOT wire ComboCard into ColorHome State 2 — that's Story 8.4
- Do NOT wire ComboCard into Favorites — that's Story 9.1
- Do NOT implement sorting logic — data layer already returns sorted (Story 8.1)

### File Structure

```
src/components/
  ComboCard.tsx          ← NEW: shared combo card (full + compact variants)
  ComboCard.test.tsx     ← NEW: comprehensive tests
  PaletteStrip.tsx       ← UNCHANGED (still used by Combinations screen)
  FavoriteButton.tsx     ← UNCHANGED (reused by ComboCard)
```

### Git Branching

Branch: `story-8.3-combo-card-component` off `epic-1`

### References

- [Source: docs/planning/epics-v2.md#Story 8.3] — AC and user story
- [Source: designs/home-redesign-spec.md#Combo Cards] — visual design, tap targets, heart, pill
- [Source: designs/home-redesign-spec.md#Combo Card Tap Targets] — ASCII diagram of tap areas
- [Source: designs/home-redesign-spec.md#Haptics] — hapticMedium on card, hapticLight on heart
- [Source: designs/home-redesign-spec.md#Accessibility] — VoiceOver labels for card, heart, pill
- [Source: designs/home-redesign-spec.md#Favorites Tab Integration] — ComboCard shared with showYoursLabel prop
- [Source: designs/favorites-redesign-spec.md] — compact variant specs (52px, 13px, 10px, 16px)
- [Source: src/components/PaletteStrip.tsx] — existing pattern (NOT replaced, parallel component)
- [Source: src/components/FavoriteButton.tsx] — heart toggle to reuse (71 lines)
- [Source: src/lib/color.ts] — isLightColor for "yours" label contrast
- [Source: src/data/wardrobeIndex.ts] — getCombinationsByWardrobe returns sorted by size

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Biome formatter required single-line ternary for `isLightColor` and collapsed multi-line render/expect/fireEvent calls — fixed with `npx biome check --write`
- FavoriteButton reused as-is (24px icon) per Dev Notes "Do NOT modify" — spec says 18px full / 16px compact but modifying FavoriteButton is out of scope. Functional behavior (toggle, haptic, premium gate, animation) is fully correct.

### Completion Notes List

- ✅ Created `ComboCard.tsx` (145 lines) with full + compact variants, "yours" adaptive-contrast label, FavoriteButton reuse, "See outfit" dark pill, card-level navigation with hapticMedium
- ✅ Created `ComboCard.test.tsx` (34 tests) covering all 7 ACs: rendering, yours label, card tap, heart tap isolation, premium gate, compact variant, accessibility
- ✅ No files modified — ComboCard is a NEW component, PaletteStrip and FavoriteButton unchanged as required
- ✅ Full suite: 467 tests, 35 suites, 0 failures, 0 regressions
- ✅ TSC: clean, Biome: clean

### AC Verification

1. ✅ Full variant: color strip 60px, "yours" label, JP name 14px serif-jp-medium, EN name 11px Inter #6b6b6b, heart via FavoriteButton, "See outfit" dark pill with tshirt icon + text
2. ✅ "yours" label: shows when showYoursLabel=true + yourColorId matches, adaptive contrast via isLightColor()
3. ✅ showYoursLabel=false: no label appears (tested)
4. ✅ Card tap: hapticMedium() + navigation.push("OutfitVisualizer", { combinationId }) (tested)
5. ✅ Heart tap: toggles via FavoriteButton, hapticLight, does NOT fire card navigation (tested), premium gate triggers when provided (tested)
6. ✅ Ordering: getCombinationsByWardrobe already returns sorted by size (Story 8.1) — no ComboCard logic needed
7. ✅ Compact variant: 52px strip, 13px JP, 10px EN, shirt icon 16px (no text pill), no "yours" label (tested)

### Code Review Fixes Applied

- **Fix #1 (HIGH):** Added `size?: number` prop to FavoriteButton (default 24, backwards-compatible). ComboCard full passes `size={18}`, compact passes `size={16}` — matches AC #1 (18px) and AC #7 (16px)
- **Fix #2 (MEDIUM):** Added fontSize assertions to tests — full (14px JP, 11px EN) and compact (13px JP, 10px EN) now guarded
- **Fix #3 (MEDIUM):** Changed compact shirt icon tint from `#1a1a1a` to `wadaTokens.wadaMuted` (#a09080) per favorites-redesign-spec
- **Fix #4 (MEDIUM):** Added `accessibilityHint="Opens outfit visualizer"` to card Pressable, `accessibilityElementsHidden` on pill/icon Views
- **Fix #5 (MEDIUM):** Added mid-range color (Royal Blue) adaptive contrast test
- **Fix #6 (LOW):** Added empty `combination.colors` guard (returns null)
- **Fix #7 (LOW):** Removed unused `useReducedMotion` import/mock from tests

### File List

- `src/components/ComboCard.tsx` — NEW: ComboCard component with full + compact variants
- `src/components/ComboCard.test.tsx` — NEW: 38 comprehensive tests covering all ACs
- `src/components/FavoriteButton.tsx` — MODIFIED: added optional `size` prop (default 24, backwards-compatible)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: 8-3 status → done
- `_bmad-output/implementation-artifacts/8-3-combo-card-component.md` — MODIFIED: review fixes, status done
