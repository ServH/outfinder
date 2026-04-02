# Story 8.1: Wardrobe Data Layer

Status: done

## Story

As a **developer building the home redesign**,
I want **a wardrobe-first data layer that maps 159 Wada colors to 11 wardrobe categories with representative shades**,
so that **the new home screen can filter and display combinations by real-world garment color families**.

## Acceptance Criteria

1. **Given** the app has 159 Wada colors in colors.json, **When** the wardrobeIndex module is loaded, **Then** every color is mapped to exactly one WardrobeCategory from the union type ("white" | "black" | "blue" | "grey" | "brown" | "green" | "red" | "pink" | "yellow" | "purple" | "orange") **And** no color is left unmapped.

2. **Given** a WardrobeCategory (e.g., "brown"), **When** calling getRepresentativeShades("brown"), **Then** it returns exactly 5 Color objects ordered light-to-dark (e.g., Beige -> Tan -> Rust -> Chocolate -> Espresso) **And** the 5 shades are visually distinct within the family.

3. **Given** a WardrobeCategory, **When** calling getDefaultShade(category), **Then** it returns the shade with the highest combinationCount in that family.

4. **Given** a WardrobeCategory, **When** calling getCombinationsByWardrobe(category), **Then** it returns all Combination objects containing at least one color mapped to that category **And** results are deterministic (same input = same output).

5. **Given** a specific shade Color within a category, **When** filtering combinations for that shade, **Then** only combinations containing that exact color ID are returned.

## Tasks / Subtasks

- [x] Task 1: Define WardrobeCategory type and color-to-category mapping data (AC: #1)
  - [x] 1.1 Add `WardrobeCategory` union type to `src/data/types.ts`
  - [x] 1.2 Create `src/data/wardrobeData.ts` with `WARDROBE_MAP: Record<string, WardrobeCategory>` mapping all 159 color IDs to one of 11 categories
  - [x] 1.3 Create `REPRESENTATIVE_SHADES: Record<WardrobeCategory, string[]>` with 5 manually curated shade IDs per category, ordered light-to-dark
  - [x] 1.4 Validate every color ID in colors.json appears in WARDROBE_MAP (no unmapped colors)

- [x] Task 2: Create wardrobeIndex.ts with 4 exported functions (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/data/wardrobeIndex.ts` following colorIndex.ts Map-based pattern
  - [x] 2.2 Build `wardrobeColorMap: Map<WardrobeCategory, Color[]>` at module load (pre-computed from WARDROBE_MAP + colorMap)
  - [x] 2.3 Implement `getColorsByWardrobe(category): Color[]` — all colors in a category
  - [x] 2.4 Implement `getRepresentativeShades(category): Color[]` — 5 curated shades, light-to-dark
  - [x] 2.5 Implement `getDefaultShade(category): Color` — shade with highest combinationCount among the 5 representatives (intentional: UI only shows 5 pills, so default must be one of them; matches FR16 "default = highest combinationCount")
  - [x] 2.6 Implement `getCombinationsByWardrobe(category): Combination[]` — all combos containing any color in category, ordered by size (2-color first, then 3, then 4)

- [x] Task 3: Write comprehensive tests in wardrobeIndex.test.ts (AC: #1-#5)
  - [x] 3.1 Create `src/data/wardrobeIndex.test.ts` co-located with source
  - [x] 3.2 Test: all 159 colors are mapped (loop through colors.json, assert each has a category)
  - [x] 3.3 Test: each category has exactly 5 representative shades
  - [x] 3.4 Test: representative shades are ordered light-to-dark (luminance decreasing)
  - [x] 3.5 Test: getDefaultShade returns shade with highest combinationCount
  - [x] 3.6 Test: getCombinationsByWardrobe returns only combos with at least one color in category
  - [x] 3.7 Test: getCombinations for a specific shade returns only combos with that exact color ID (uses getCombinations from colorIndex.ts)
  - [x] 3.8 Test: determinism — calling getCombinationsByWardrobe twice yields identical results
  - [x] 3.9 Test: edge cases — invalid category returns empty array

- [x] Task 4: Verify all ACs point-by-point and run full test suite (AC: #1-#5)
  - [x] 4.1 Run `npx jest src/data/wardrobeIndex.test.ts` — all tests pass (19/19)
  - [x] 4.2 Run `npx tsc --noEmit` — no type errors
  - [x] 4.3 Run `pnpm lint` — no lint errors
  - [x] 4.4 Run `pnpm test` — full suite passes (416/416, 32 suites, 0 regressions)
  - [x] 4.5 Walk through each AC and verify implementation matches

## Dev Notes

### Architecture Decision: Separate wardrobeIndex.ts

Create a new `src/data/wardrobeIndex.ts` rather than extending `colorIndex.ts`. Rationale:
- Keeps wardrobe logic isolated and testable
- colorIndex.ts remains unchanged (zero regression risk)
- wardrobeIndex.ts imports from colorIndex.ts for underlying data access
- Static data mapping lives in separate `wardrobeData.ts` for clean separation

### Existing Pattern to Follow: colorIndex.ts

The established data access pattern in `src/data/colorIndex.ts`:
- **Maps built at module load** (lines 5-9): `colorMap`, `combinationsByColor`, `colorsByGroup`
- **Initialization loop** (lines 11-41): iterate JSON, build Maps
- **Pure lookup functions** (lines 43-66): `export function getName(param): ReturnType`
- **Return defaults**: `undefined` for single-item miss, `[]` for collection miss
- **No hooks, no state, no effects** — import and call directly

### Category Mapping Strategy

The 11 categories map real wardrobe colors, NOT Wada's artistic swatch groups (0-5). One Wada group may span multiple wardrobe categories. Use the design spec's mapping guidance:

| Category | Covers | Wada source groups |
|----------|--------|-------------------|
| white | whites, creams, ivory, off-white | Group 0 (light end) |
| black | blacks, charcoal, very dark | Group 3 (dark end) |
| blue | navy, denim, sky, lavender | Group 2 + parts of 3, 4 |
| grey | greys, silver, slate | Cross-group |
| brown | tan, camel, rust, chocolate, beige | Group 1 + parts of 0 |
| green | olive, forest, sage, khaki | Group 5 |
| red | reds, crimson, burgundy | Group 1, 4 |
| pink | pinks, rose, blush | Group 0, 4 |
| yellow | yellows, gold, mustard | Group 4 |
| purple | purples, violet, plum | Group 2, 4 |
| orange | oranges, tangerine, peach | Group 1, 4 |

**The mapping MUST be manual** — examine each color's hex, nameEn, and visual appearance. Do NOT use algorithmic HSL classification; Wada's artistic colors defy simple hue rules (e.g., "Rust" is both red and brown depending on context).

### Representative Shades Curation

For each category, manually pick 5 color IDs that:
1. Are visually distinct within the family (not 5 near-identical shades)
2. Span light-to-dark range
3. Have reasonable combinationCount (so users see combos when they tap)
4. The default shade = whichever of the 5 has the highest `combinationCount`

### Combination Ordering

`getCombinationsByWardrobe` must return combinations ordered by size: 2-color first, then 3-color, then 4-color. This matches FR13 and the combo feed order in State 2.

### AC #5: Shade-Level Filtering

AC #5 (filtering by exact shade) does NOT require a new function in wardrobeIndex.ts — it's already covered by the existing `getCombinations(colorId)` in `colorIndex.ts`. The test should verify this existing function works correctly for shade-level filtering. The UI will call `getCombinations(shadeColorId)` directly.

### Data Files Structure

```
src/data/
  types.ts           ← ADD WardrobeCategory type
  colors.json        ← unchanged (read-only)
  combinations.json  ← unchanged (read-only)
  colorIndex.ts      ← unchanged (no modifications)
  colorIndex.test.ts ← unchanged
  wardrobeData.ts    ← NEW: WARDROBE_MAP + REPRESENTATIVE_SHADES static data
  wardrobeIndex.ts   ← NEW: 4 exported functions + pre-computed Maps
  wardrobeIndex.test.ts ← NEW: comprehensive tests
```

### What NOT to Do

- Do NOT modify `colorIndex.ts` — it must remain unchanged
- Do NOT create UI components or screens (data layer only)
- Do NOT use algorithmic color classification (manual mapping only)
- Do NOT import any UI/RN libraries (this is pure TypeScript data logic)
- Do NOT add more than 5 representative shades per category
- Do NOT create new JSON files — the mapping is TypeScript constants

### Testing Pattern from colorIndex.test.ts

Follow the exact pattern from `src/data/colorIndex.test.ts`:
```typescript
import { getColorsByWardrobe, getRepresentativeShades, ... } from "./wardrobeIndex";
import colorsData from "./colors.json";

describe("wardrobeIndex", () => {
  describe("getColorsByWardrobe", () => {
    it("maps all 159 colors to categories", () => { ... });
  });
});
```
- Use `describe` blocks per function
- Test edge cases (invalid input → empty array)
- Loop through `colorsData` for exhaustive coverage
- Assert specific values (not just `.toBeDefined()`)

### Git Branching

Branch: `story-8.1-wardrobe-data-layer` off `epic-1` (current main branch)

### References

- [Source: docs/planning/epics-v2.md#Story 8.1] — AC and user story
- [Source: designs/home-redesign-spec.md#Implementation Notes] — category mapping table, function signatures, data strategy
- [Source: designs/home-redesign-spec.md#Data Analysis] — combination distribution (38 two-color, 225 three-color, 83 four-color)
- [Source: src/data/colorIndex.ts] — Map-based index pattern to follow
- [Source: src/data/types.ts] — existing Color, Combination, SwatchGroup types
- [Source: docs/project-context.md#Data Access] — pure functions, no hooks

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Red category representative shades initially had incorrect luminance order (c044 Red < c028 Crimson < c041 Red Iron Oxide). Fixed by reordering to: c106 → c037 → c041 → c028 → c044.
- Biome formatter required import reordering and line-length adjustments — auto-fixed.

### Completion Notes List

- Created WardrobeCategory union type (11 categories) in types.ts
- Manually mapped all 159 Wada colors to wardrobe categories based on visual appearance, hex values, and English names — NOT algorithmic HSL classification
- Curated 5 representative shades per category, light-to-dark, with reasonable combinationCount distribution
- Created wardrobeIndex.ts with 4 pre-computed Map-based functions following colorIndex.ts pattern
- 19 comprehensive tests covering all 5 ACs plus edge cases
- Category distribution: white(10), black(5), blue(24), grey(13), brown(32), green(27), red(16), pink(10), yellow(6), purple(10), orange(6)
- Full suite: 415 tests, 32 suites, 0 regressions

### File List

- src/data/types.ts — MODIFIED (added WardrobeCategory type)
- src/data/wardrobeData.ts — NEW (WARDROBE_MAP + REPRESENTATIVE_SHADES static data)
- src/data/wardrobeIndex.ts — NEW (4 exported functions + pre-computed Maps)
- src/data/wardrobeIndex.test.ts — NEW (19 tests covering AC #1-#5 + edge cases)

## Change Log

- 2026-04-02: Story 8.1 implemented — wardrobe data layer with 159-color mapping, 4 index functions, 19 tests
- 2026-04-02: Code review fixes — pre-computed representative shades map (M2), completeness test for getCombinationsByWardrobe (M1), dev warning on unmapped colors (L2), tie-breaking comment (L3), c115/c116 distinction comment (L1). Suite: 416/416, 32 suites.
