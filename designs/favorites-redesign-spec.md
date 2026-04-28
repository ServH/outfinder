# Favorites Tab Redesign — Validated Spec

## Status: VALIDATED

## Problem Statement

The current Favorites tab is a flat list of PaletteStrips (120px each). With 15+ favorites, scrolling becomes excessive (~2500px). The design is visually inconsistent with the new home redesign combo cards, lacks combination names, and has a mute tshirt icon that doesn't communicate the Visualizer feature.

## Validated Design: Compact 2-Column Grid + Sort Pills

### Layout

```
Favorites                                    8
[Recent]  [A-Z]  [By size]

┌────────────┐  ┌────────────┐
│ [color strip] │  │ [color strip] │
│ 春の便り       │  │ 夜と炎        │
│ Spring Tid ♡👕│  │ Night Fla ♡👕│
└────────────┘  └────────────┘
┌────────────┐  ┌────────────┐
│ [color strip] │  │ [color strip] │
│ 森の小径       │  │ 夕暮れの庭     │
│ Forest Pa ♡👕│  │ Twilight  ♡👕│
└────────────┘  └────────────┘
     ... (scrollable)
```

### Header

- "Favorites" in 34px Noto Serif JP bold (iOS large title)
- Count "8" in 15px Inter, #a09080, top-right — shows total saved

### Sort Pills

| Pill | Behavior | Implementation |
|------|----------|---------------|
| **Recent** (default) | Chronological, most recent first | Current Set order from FavoritesContext |
| **A-Z** | Alphabetical by English name | `sort((a,b) => a.nameEn.localeCompare(b.nameEn))` |
| **By size** | 2-color first, then 3, then 4 | `sort((a,b) => a.colors.length - b.colors.length)` |

- Active pill: dark fill (#1a1a1a) + white text
- Inactive pills: #F0F0EE fill + #6b6b6b text
- Sort does NOT persist between tab switches — always defaults to "Recent"
- "By color" was rejected — ambiguous for multi-color combinations

### Compact Combo Cards

Each card in the 2-column grid:

- **Color strip**: 52px height, rounded top corners (14px radius), colors fill equally
- **Info row**: 8px padding, contains:
  - Left: JP name (13px Noto Serif JP medium) + EN name (10px Inter, #6b6b6b)
  - Right: heart icon (16px, filled red) + shirt icon (16px, #a09080)
- **Card**: white fill, 14px corner radius, subtle shadow
- **Entire card tappable** → push OutfitVisualizer
- **Heart**: independent tap target with `stopPropagation`
- **No "yours" label** — no shade context in Favorites (decision #19)
- **Shirt icon is mute** (no text) — acceptable because users discover the Visualizer in the main flow first. Compact card can't fit "See outfit" text pill.

### Grid Specs

- 2 columns, 12px gap between columns, 12px gap between rows
- 16px horizontal padding
- Card width: `(390 - 32 - 12) / 2 = 173px` each
- **8 combos visible per screen** (vs 3 in current design)
- FlatList with `numColumns={2}`

### Empty State

Updated text for new flow:
```
"No favorites yet"
"Pick a color, explore combinations, and tap ♡ to save the ones you love"
```

---

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 2-column grid | 2.6x more density — 8 visible vs 3. Scales to 30+ favorites |
| 2 | "By color" → "A-Z" | "By color" is ambiguous for multi-color combos. A-Z is clear |
| 3 | Sort doesn't persist | Simplicity — always default to Recent on tab switch |
| 4 | Mute shirt icon (no text) | Compact cards can't fit text pill. Users learn Visualizer from main flow |
| 5 | No "yours" label | No shade context in Favorites |
| 6 | Shared ComboCard component | Same component for State 2 (full) and Favorites (compact) with variant prop |
| 7 | Remove Combinations from FavoritesStack | Cross-navigation removed. Stack simplifies to FavoritesList → OutfitVisualizer |

---

## Navigation Changes

```
Current FavoritesStack:              New:
  FavoritesList                        FavoritesList
  → Combinations (cross-nav)          → OutfitVisualizer
  → OutfitVisualizer

Stack depth: 3                       Stack depth: 2
```

---

## Shared ComboCard Component

```typescript
interface ComboCardProps {
  combination: Combination;
  variant: "full" | "compact";     // full = State 2, compact = Favorites
  showYoursLabel?: boolean;        // true in State 2, false in Favorites
  yourColorId?: string;            // selected shade ID for "yours" marker
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPremiumGate?: () => void;
  onPress: () => void;             // → push OutfitVisualizer
}
```

| Prop | State 2 value | Favorites value |
|------|--------------|-----------------|
| variant | "full" | "compact" |
| showYoursLabel | true | false |
| yourColorId | selected shade ID | undefined |
| isFavorite | from useFavorites | from useFavorites |
| onPress | push Visualizer | push Visualizer |

### Variant differences

| Property | full | compact |
|----------|------|---------|
| Strip height | 60px | 52px |
| JP name size | 14px | 13px |
| EN name size | 11px | 10px |
| Heart size | 18px | 16px |
| Visualizer CTA | "See outfit" pill (dark bg, shirt icon + text) | Shirt icon only (16px, #a09080) |
| "yours" label | Shown on matching color segment | Hidden |

---

## Premium Paywall

No changes to premium behavior:

- Free users: 5 favorites max
- 6th heart tap → PremiumPaywall modal via `usePremiumGate`
- Toast "Upgrade to save more favorites" — absolute positioned at bottom, works with 2-col grid
- Premium users: unlimited favorites

---

## Edge Cases

| # | Case | Handling |
|---|------|---------|
| 1 | Odd number of favorites | Last row has 1 card, left-aligned. FlatList handles natively |
| 2 | Unfavorite → card disappears | FlatList re-render. If 0 remaining → EmptyState |
| 3 | 30+ favorites (premium power user) | ~8 rows of scroll. Manageable. Sort helps find specific combos |
| 4 | Back from Visualizer | Returns to FavoritesList, scroll position preserved |
| 5 | Unfavorite from State 2 | Card disappears from Favorites on next tab visit (reactive via FavoritesContext) |

---

## Accessibility

| Element | accessibilityLabel | accessibilityRole |
|---------|-------------------|-------------------|
| Combo card | "[name], [N] colors, saved" | button |
| Heart | "Remove [name] from favorites" | button |
| Shirt icon | "See outfit for [name]" | button |
| Sort pill (active) | "Sort by recent, selected" | tab |
| Sort pill (inactive) | "Sort alphabetically" / "Sort by size" | tab |
| Sort container | — | tablist |
| Count | "[N] saved combinations" | text |
| Empty state | "No favorites yet. Pick a color, explore combinations, and tap heart to save" | summary |

---

## What Does NOT Change

| Feature | Status |
|---------|--------|
| FavoritesContext (Set, toggle, isFavorite, count) | Unchanged |
| AsyncStorage persistence (@outfinder/favorites) | Unchanged |
| PremiumContext / usePremiumGate | Unchanged |
| PremiumPaywall component | Unchanged |
| EmptyState component | Reuse with updated text |

---

## Implementation Complexity

| # | Change | Complexity | Notes |
|---|--------|-----------|-------|
| 1 | ComboCard shared component (full + compact) | Medium | New component, replaces PaletteStrip usage |
| 2 | FavoritesList → 2-col FlatList with ComboCard compact | Medium | Layout change |
| 3 | Sort pills UI + sort logic | Low | Client-side sort, 3 pills |
| 4 | Count in header | Trivial | `count` from useFavorites() |
| 5 | Remove Combinations from FavoritesStack | Trivial | Delete screen from navigator |
| 6 | EmptyState text update | Trivial | String change |

---

## Screenshots

- `designs/favorites-current.png` — Current published version
- `designs/favorites-redesign.png` — Redesigned 2-column grid with sort pills
