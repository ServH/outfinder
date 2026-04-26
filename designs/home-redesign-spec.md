# Home Screen Redesign — Validated Spec

## Status: FULL FLOW VALIDATED (Home + Transform + Visualizer)

## Problem Statement

The current ColorHome screen dumps 159 colors in a uniform grid. Users described it as "opening a Pantone book — lots of color but I don't know what to do with it." The grid is monotonous and doesn't guide the user toward the app's core value: outfit color coordination.

## Core Insight

Users don't think "I want to browse colors." They think **"I have a brown shirt — what goes with it?"** The home screen must answer that question, not present a catalog.

---

## The Flow: 2 Taps to Outfit

```
STATE 1 (Home)  →  tap family  →  STATE 2 (Transform)  →  tap combo  →  STATE 3 (Visualizer)
  6 fabric           1 tap          shade pills +            1 tap         existing screen
  swatches                          combo cards
```

**Total: 2 taps from opening the app to seeing an outfit visualized.**

---

## State 1: Home — "What color are you wearing?"

### Page 1 (visible on open): 6 wardrobe basics in 2x3 grid

| Position | Name | Covers | Maps to Wada |
|----------|------|--------|-------------|
| Top-left | **White** | whites, creams, ivory, off-white | Group 0 (light end) |
| Top-right | **Black** | blacks, charcoal, very dark | Group 3 (dark end) |
| Mid-left | **Blue** | navy, denim, sky, lavender, purple | Group 2 + parts of 3, 4 |
| Mid-right | **Grey** | greys, silver, slate | Cross-group |
| Bottom-left | **Brown** | tan, camel, rust, chocolate, beige | Group 1 + parts of 0 |
| Bottom-right | **Green** | olive, forest, sage, khaki | Group 5 |

### Page 2 (swipe right, peek visible): 5 accent colors + escape hatch

| Position | Name | Covers |
|----------|------|--------|
| Top-left | **Red** | reds, crimson, burgundy |
| Top-right | **Pink** | pinks, rose, blush |
| Mid-left | **Yellow** | yellows, gold, mustard |
| Mid-right | **Purple** | purples, violet, plum |
| Bottom-left | **Orange** | oranges, tangerine, peach |
| Bottom-right | **All 159 colors** | Dashed card with grid icon — escape hatch to full catalog |

### Visual Design

- Each family = **fabric swatch** card — rounded rect (16px), multi-tone gradient simulating cloth
- Color name: single word, 20px Inter semibold, top-left
- Page 1 shows a **peek** of Red swatch on right edge (invites swipe without text)
- Page dots between grid and "Browse all 159 colors" link
- Background: #fafaf8 (bg-paper token)

### Header

- "Outfinder" in 28px Noto Serif JP semibold
- "What color are you wearing?" in 15px Inter, #6b6b6b
- No search bar (removed — 2-tap journey faster than typing)

---

## State 2: Transform — Shade Picker + Combo Feed

When the user taps a family, the home **transforms in-place** (Reanimated animation, no navigation push). The 6 swatches morph into the combo view.

### Layout

```
← Brown                              12 combos
[Beige] [Tan] [Rust●] [Chocolate] [Espresso]     ← STICKY header
─────────────────────────────────────────────
  [combo card 1 — 2 colors]                       ← scrollable
  [combo card 2 — 3 colors]
  [combo card 3 — 3 colors]
  [combo card 4 — 4 colors]
  ...
─────────────────────────────────────────────
  Colors    Favorites    Settings                  ← tab bar
```

### Shade Picker

- **5 representative shades** per family — evenly spaced, light-to-dark
- Most popular shade **preselected** (gold ring border, bold label)
- No "All" button — 5 shades cover the spectrum adequately
- Tap a shade → combo feed filters to that shade's combinations
- Count label ("12 combos") updates dynamically
- **MUST be sticky** — stays fixed when scrolling combo feed (`stickyHeaderIndices`)

### Combo Cards

- Color strip (60px height) showing all combination colors
- The user's selected shade marked with subtle "yours" label (centered at bottom of that color segment)
- Name: Japanese (14px Noto Serif JP) + English (11px Inter)
- Actions: heart (favorite, independent tap target with stopPropagation) + **"See outfit" pill button** (dark pill, 32px height, shirt icon + text "See outfit" in 11px Inter white). NOT a mute icon — text label communicates the Visualizer feature to new users
- **Entire card is tappable** → navigates to Visualizer (not just the pill button)
- Heart and "See outfit" pill are the same on ALL cards — no special first-card CTA (consistency over onboarding)
- Ordered by combo size: 2-color first, then 3, then 4 — no section headers (only 38 two-color combos total in dataset, sections would feel sparse)

### Key Behaviors

- "← Brown" back button restores the home to State 1 (reverse animation)
- Changing shade preserves scroll position at top (new results)
- Heart triggers premium paywall for free users (existing behavior)

---

## State 3: Visualizer (Existing)

**No changes to OutfitVisualizer.** The combo card passes `combinationId` to the existing screen which renders:
- WarmBackground + Aureola
- OutfitCard with TintedGarments (Skia ColorMatrix)
- WadaHeader (combination name JP/EN)
- MiniPaletteStrip (color names)
- Share button
- Branding

Back navigation returns to State 2 with shade selection and scroll position preserved.

---

## Data Analysis: Wada Combinations

### Distribution by size

| Size | Count | % of 348 |
|------|-------|----------|
| 2-color | 38 | 11% |
| 3-color | 225 | 65% |
| 4-color | 83 | 24% |

### Unique combos per current swatch group

| Group | Colors | Unique combos |
|-------|--------|--------------|
| Pale & Light | 27 | 149 |
| Red & Brown | 26 | 146 |
| Blue & Lavender | 26 | 109 |
| Dark & Deep | 26 | 182 |
| Vivid & Bold | 26 | 133 |
| Green & Olive | 28 | 78 |

**Implication:** With wardrobe category remapping, each category will have 40-80 unique combos. Shade filtering (5 representative tones) reduces this to ~8-15 per shade — manageable for scrolling.

---

## Flow Audit: Comprehensive Step-by-Step Analysis

### Step 0: App opens → Home

| Check | Status | Notes |
|-------|--------|-------|
| First-time clarity | OK | "What color are you wearing?" + 6 large cards = obvious |
| Returning user | OK | Utility app — same 6 cards every time is fine |
| Peek discoverability | Low risk | "Browse all 159" at bottom catches edge cases |
| Inspiration seekers | OK | "Browse all 159" serves this secondary path |
| User without specific garment | OK | Can tap any family out of curiosity, or "Browse all" |

### Step 1: Tap family → Transform

| Check | Status | Notes |
|-------|--------|-------|
| Transformation clarity | Needs care | Animation must be smooth (Reanimated); "← Brown" header signals sub-state |
| Preselected shade mismatch | Not a problem | Users naturally scan pills and tap their shade; preselection gives immediate content |
| "yours" label accuracy | Minor risk | Label follows shade selection. If confusing in testing, remove — position (always left) is enough |
| Dynamic combo count | Good | "12 combos" updates per shade, reinforces filtering mental model |
| Shade picker sticky | **Must implement** | `stickyHeaderIndices` — must stay visible when scrolling combos |
| Back from accent page | Impl. detail | "← Red" always returns to Page 1 (default). User swipes again for Page 2. Simpler than tracking page origin |

### Step 2: Browse combo cards

| Check | Status | Notes |
|-------|--------|-------|
| "See outfit" pill discoverability | OK | Text pill with shirt icon on every card communicates the Visualizer feature to new users |
| Pill + card tap redundancy | Intentional | Pill exists to **communicate**, not as exclusive tap target. Like a "Buy" button on a tappable product card |
| Heart independence | OK | `stopPropagation` prevents card navigation on heart tap |
| Japanese names | OK | English name below; JP adds aesthetic value |
| Heart paywall | OK | Existing PremiumPaywall behavior, no changes |
| Combo ordering | OK | 2-color first, then 3, then 4 — natural progression, no section headers |
| Long JP names vs pill space | Impl. detail | `numberOfLines={1}` with truncation on EN name. ~226px available for name, longest combo names fit |

### Step 3: Tap combo → Visualizer

| Check | Status | Notes |
|-------|--------|-------|
| Back navigation | OK | Returns to State 2 with shade/scroll preserved |
| Combo data → Visualizer | OK | Passes `combinationId` to existing `OutfitVisualizer` |
| Cross-navigation lost | Accepted | Tapping individual colors in combo strip no longer navigates to that color's combos. Acceptable — app is now a tool, not exploration platform. "Browse all" covers this. Can re-add later via MiniPaletteStrip in Visualizer |

### Step 4: Back to State 2 / Home

| Check | Status | Notes |
|-------|--------|-------|
| Change shade | OK | Tap different pill → combos refresh, scroll resets to top |
| Return to home | OK | "← Brown" reverses transformation |
| Tab switching | OK | React Navigation preserves tab state — returning to Colors tab shows State 2 |
| Scroll position on back from Visualizer | **Must preserve** | Standard React Navigation behavior with FlatList |

### Combo Card Tap Targets

```
┌──────────────────────────────────────────────┐
│ [████ yours ████][████████████][████████████] │  ← card tap → Visualizer
│                                              │
│ 秋の暮                        ♡  See outfit  │  ← ♡ = favorite (independent)
│ Autumn Dusk                                  │  ← pill = Visualizer (redundant, communicative)
└──────────────────────────────────────────────┘
```

### Haptics

| Action | Haptic | Pattern |
|--------|--------|---------|
| Tap family swatch | `hapticLight()` | Selection |
| Tap shade pill | `hapticLight()` | Filter change |
| Tap combo card → Visualizer | `hapticMedium()` | Action — entering new screen |
| Tap heart | `hapticLight()` | Toggle |

### Favorites Tab Integration

| Scenario | Behavior |
|----------|----------|
| Favorite from State 2 | Heart fills (red), saved to FavoritesContext/AsyncStorage |
| Open Favorites tab | Same combo card design but **without "yours" label** (no shade context) |
| Tap combo in Favorites | Push Visualizer directly |
| Unfavorite from Favorites | Heart empties, combo removed from list |
| Card component reuse | Same `ComboCard` component with `showYoursLabel` prop — `true` in State 2, `false` in Favorites |

### Edge Cases

| # | Case | Handling |
|---|------|----------|
| 1 | Accent color with <3 combos per shade | Default to shade with most combos. Show "Few combinations for this shade" if <3 results |
| 2 | Shade with 0 combos | Show empty state: "No combinations for this shade. Try another." with pill links to adjacent shades |
| 3 | "Browse all" from Page 2 dashed card | Same `navigation.push("BrowseAllColors")` as text link on Page 1 |
| 4 | Screen color ≠ real fabric | Inherent limitation, not solvable |
| 5 | Onboarding screens outdated | Update in separate story post-redesign — not blocking |

### Accessibility

| Element | accessibilityLabel | accessibilityRole |
|---------|-------------------|-------------------|
| Fabric swatch | "Brown, tap to see combinations" | button |
| Shade pill (selected) | "Rust, selected" | tab |
| Shade pill (unselected) | "Chocolate, tap to filter" | tab |
| Shade picker container | — | tablist |
| Combo card | "Autumn Dusk, 3 colors" | button |
| Heart (unsaved) | "Save Autumn Dusk to favorites" | button |
| Heart (saved) | "Remove Autumn Dusk from favorites" | button |
| "See outfit" pill | "See outfit for Autumn Dusk" | button |
| Back button | "Back to color families" | button |
| "Browse all" link | "Browse all 159 colors" | link |

### Performance

| Concern | Risk | Mitigation |
|---------|------|------------|
| Transform animation (6 swatches → pills + cards) | Medium on iPhone SE | Reanimated layout animations + `useReducedMotion()` to skip |
| FlatList combo cards (8-15 items per shade) | Low | FlatList virtualizes, trivial count |
| Shade filtering (recalculate combos) | Low | Pre-indexed data, <1ms filter |
| Gradient fabric swatches | Low | Static renders, no re-render needed |

### What Does NOT Change

| Feature | Status |
|---------|--------|
| OutfitVisualizer | Unchanged — receives `combinationId` |
| FavoritesContext | Unchanged — toggle/isFavorite/count |
| PremiumContext/Paywall | Unchanged — triggers on heart tap |
| Settings tab | Unchanged |
| Share flow (from Visualizer) | Unchanged |
| Onboarding | Needs update (separate story, not blocking) |

---

## Key Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | No search bar | 2-tap journey faster than typing; only 11 categories |
| 2 | No "Recent colors" | Conflicts with premium Favorites paywall |
| 3 | No "Color of the day" | New feature, doesn't solve core problem |
| 4 | No "Do these match?" | Great concept, separate future epic |
| 5 | Single-word names | Gen Z friendly: White, Black, Blue, Grey, Brown, Green |
| 6 | Wardrobe-first categories | Remapping Wada's artistic groups to real closet colors |
| 7 | Accent colors behind swipe | 93% wardrobe coverage on first view |
| 8 | Transform in-place (no push nav) | Keeps spatial context, feels like same screen evolving |
| 9 | 5 representative shades, no "All" | Prevents overwhelm; light-to-dark covers the spectrum |
| 10 | Preselect most popular shade | Immediate content on transform; not a forced choice |
| 11 | No combo detail screen | Visualizer already shows all info; fewer screens = less drop-off |
| 12 | No section headers for 2/3/4 | Only 38 two-color combos total — sections would feel empty |
| 13 | Entire combo card tappable | Not just the shirt button; reduces tap-target confusion |
| 14 | Sticky shade picker | Must stay visible when scrolling combos |
| 15 | "Browse all 159" reuses current grid | No new screen — existing ColorHome (grid + tabs) becomes the fallback view, pushed as a new screen |
| 16 | "See outfit" text pill on ALL cards | New users need to discover the Visualizer. A mute shirt icon doesn't communicate the feature. Text pill "See outfit" with shirt icon solves discoverability. Uniform on all cards — no special first-card CTA |
| 17 | Cross-navigation loss accepted | Tapping individual colors in combo strips no longer navigates to that color. App shifts from exploration to tool. Re-add later via MiniPaletteStrip in Visualizer if needed |
| 18 | Back from accent → Page 1 always | Simpler than tracking page origin. User swipes again for Page 2 |
| 19 | "yours" label contextual | Shows in State 2 only (follows shade selection). Hidden in Favorites (no shade context). Same component, `showYoursLabel` prop |

---

## Identified Gaps (Final Audit)

| # | Gap | Severity | Resolution |
|---|-----|----------|------------|
| 1 | Cross-navigation lost | Low | Accepted — "Browse all" covers exploration. Re-add in Visualizer later |
| 2 | Back from accent → always Page 1 | Impl. note | Simpler implementation, no user confusion |
| 3 | Long JP names vs pill space | Impl. note | `numberOfLines={1}` truncation on EN name |
| 4 | Accent colors with sparse combos | Medium | Default to most popular shade + "Few combinations" message if <3 |
| 5 | "yours" missing in Favorites cards | Low | Intentional — no shade context in Favorites. Same component with prop |
| 6 | Combo card design consistency | Impl. note | Shared `ComboCard` component used in State 2 and Favorites with `showYoursLabel` prop |
| 7 | Onboarding outdated | Deferred | Separate story post-redesign, not blocking |
| 8 | Performance on iPhone SE transform | Medium | Reanimated + `useReducedMotion()` skip. Test on device |

**No fundamental problems found. All gaps have clear resolutions.**

---

## Implementation Notes

### New Data Required

A new mapping from 159 Wada colors → 11 wardrobe categories. Static lookup, manually curated.

```typescript
type WardrobeCategory = "white" | "black" | "blue" | "grey" | "brown" | "green" | "red" | "pink" | "yellow" | "purple" | "orange";
```

Plus: for each WardrobeCategory, 5 representative shade IDs (the most visually distinct within the family, ordered light-to-dark), with the default shade being the one with the highest `combinationCount`.

### New Data Functions

```typescript
// New functions needed in colorIndex.ts or new wardrobeIndex.ts
getColorsByWardrobe(category: WardrobeCategory): Color[]
getRepresentativeShades(category: WardrobeCategory): Color[] // 5 per category
getCombinationsByWardrobe(category: WardrobeCategory): Combination[] // all combos containing any color in category
getDefaultShade(category: WardrobeCategory): Color // most popular shade
```

### Component Changes

| Current | New |
|---------|-----|
| `ColorHome` screen | Refactor into new `ColorHome` (State 1 grid + State 2 transform). Old `ColorHome` preserved as `BrowseAllColors` screen |
| `SwatchGroupTabs` + `SwatchGroup` | Replace with `ColorFamilyGrid` (paged 2x3) + `ShadePicker` (horizontal pills) + `ComboFeed` (FlatList) |
| 7 tabs filtering same grid | 2 pages (basics + accents) as entry points |
| N/A | "Browse all 159 colors" → `navigation.push("BrowseAllColors")` — opens current ColorHome as-is (grid + tabs). Zero new UI for this path |
| Tap color → push Combinations | Tap family → transform home → tap combo → push Visualizer |
| `Combinations` screen | Absorbed into ColorHome State 2 — CombinationList reused as ComboFeed |

### Existing Patterns to Follow

- NativeWind `className` for static styles, `style={{}}` for dynamic gradients
- `hapticLight()` on family tap and shade tap; `hapticMedium()` on combo card tap
- Reanimated for transform animation (`useAnimatedStyle`, `withSpring`)
- `FlatList` with `stickyHeaderIndices` for sticky shade picker
- `accessibilityLabel` on each element, `accessibilityRole="button"` on tappable cards
- `useReducedMotion()` — skip transform animation when enabled

### Navigation Changes

```
Current:                          New:
ColorHome                        ColorHome (State 1 ↔ State 2)
  → push Combinations              → push OutfitVisualizer
    → push OutfitVisualizer

Stack depth: 3                   Stack depth: 2
```

The `Combinations` screen is effectively absorbed into `ColorHome`'s State 2. This reduces the navigation stack by 1.

---

## Screenshots

- `designs/colorhome-current-v1.0.2.png` — Current published version (reference)
- `designs/v4.1-home-basics.png` — Home Page 1: 6 wardrobe basics
- `designs/v4.1-home-accents.png` — Home Page 2: accent colors
- `designs/flow-state1-home.png` — Flow: State 1 Home
- `designs/flow-state2-transformed.png` — Flow: State 2 Transformed (initial version with icon-only shirt button)
- `designs/flow-state2-final.png` — Flow: State 2 FINAL (uniform "See outfit" pill on all cards)
- `designs/flow-state3-visualizer.png` — Flow: State 3 Visualizer (existing)

---

## Related Specs

- **Favorites redesign**: `designs/favorites-redesign-spec.md` — 2-col grid, sort pills, shared ComboCard component
- **Visualizer adjustments**: `designs/visualizer-adjustments-spec.md` — 3 minor fixes (nameEn, heart, nav title), no structural redesign

---

## Future Features (Parking Lot)

Ideas validated during design but deferred to avoid scope creep:

1. **"Do these colors match?"** — Two-color validation flow. Great UX concept, needs its own epic.
2. **Color of the day** — Daily featured color/combo. Needs deterministic algorithm or backend.
3. **Search by color name** — Fuzzy search across EN/JP names. Low value given 2-tap journey.
4. **Recent colors** — History of visited colors. Must not undermine premium Favorites.
5. **Garment suggestions per color** — "Try as: pants, jacket." Speculative data, deferred.
6. **Fabric texture on swatches** — Use garment PNGs with Skia tinting for real cloth texture. Enhancement.
