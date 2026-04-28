# Outfit Visualizer — Adjustments Spec

## Status: NO REDESIGN NEEDED — 3 minor adjustments validated

## Context

The OutfitVisualizer was reviewed in the context of the full home redesign flow. The Visualizer serves as State 3 — the destination when a user taps a combo card from State 2 (Colors tab) or from Favorites. It receives a `combinationId` and renders tinted garments.

**Conclusion:** The Visualizer works correctly as-is with the new flow. No structural changes needed. Only 3 consistency improvements identified.

---

## Adjustment 1: Add English name to WadaHeader

### Problem

The combo card shows "秋の暮 / Autumn Dusk" but the Visualizer's WadaHeader only shows "秋の暮". The English name disappears on entry, breaking continuity.

### Solution

Add `nameEn` prop to `WadaHeader` and render it below the subtitle.

```
Current:                    New:
  秋の暮                      秋の暮
  3 colors · Sanzo Wada       Autumn Dusk
                               3 colors · Sanzo Wada
```

### Implementation

```typescript
// WadaHeader.tsx — add nameEn prop
export interface WadaHeaderProps {
  nameJp: string;
  nameEn: string;  // NEW
  colorCount: number;
}

// Add Text element between nameJp and subtitle:
<Text className="font-sans-medium text-[14px]" style={{ color: wadaTokens.textSecondary }}>
  {nameEn}
</Text>
```

**Note:** `nameEn` must also appear in the share capture (it's inside `shareViewRef`). This is correct — it adds context to the shared image.

### Complexity: Trivial

---

## Adjustment 2: Heart button in Visualizer

### Problem

The user sees an outfit they love but can't favorite it without going back to State 2 or Favorites. This adds friction to the save flow.

### Solution

Add a heart/favorite button next to the "Share Outfit" button, **outside the `shareViewRef`** capture area (hearts should not appear in shared images).

```
Current:                    New:
  [Share Outfit]              ♡    [Share Outfit]
```

### Implementation

- Reuse existing `FavoriteButton` component
- Place in the same container as the share button (below capture area)
- Use `useFavorites()` context — `isFavorite(combinationId)` and `toggleFavorite(combinationId)`
- Premium paywall triggers via `usePremiumGate` if needed
- `hapticLight()` on toggle

```typescript
// In OutfitVisualizer.tsx, in the share button container:
<View className="flex-row items-center justify-center gap-4 py-3">
  <FavoriteButton
    combinationId={combinationId}
    isFavorite={isFav}
    onToggle={() => toggleFavorite(combinationId)}
    onPremiumGate={shouldGate ? handleGate : undefined}
  />
  <Pressable onPress={handleShare} ...>
    <Text>Share Outfit</Text>
  </Pressable>
</View>
```

### Edge cases

- Heart state syncs with FavoritesContext — if favorited from State 2 before entering, heart shows filled
- Unfavoriting from Visualizer updates Favorites tab reactively
- PremiumPaywall modal works over the Visualizer (existing pattern)

### Complexity: Low

---

## Adjustment 3: Nav title change

### Problem

"Outfit Visualizer" is a technical/feature name, not user-facing language. The combo card showed the combination name — the nav title should continue that context.

### Solution

Change the nav bar title from "Outfit Visualizer" to the combination's English name, or leave it empty with just the back button.

**Recommended:** Show the combination name.

```
Current:                    New:
  ← Outfit Visualizer         ← Autumn Dusk
```

### Implementation

In `ColorsStack.tsx` and `FavoritesStack.tsx`, the OutfitVisualizer screen options use a static title. Change to dynamic:

```typescript
<Stack.Screen
  name="OutfitVisualizer"
  component={OutfitVisualizer}
  options={{
    headerTitle: "",  // Let the screen set its own title
    headerBackTitle: "",
    // ... other options unchanged
  }}
/>
```

Then in `OutfitVisualizer.tsx`, use `navigation.setOptions`:

```typescript
useEffect(() => {
  if (combination) {
    navigation.setOptions({ title: combination.nameEn });
  }
}, [combination, navigation]);
```

### Complexity: Trivial

---

## What Does NOT Change

| Feature | Status |
|---------|--------|
| WarmBackground | Unchanged |
| Aureola | Unchanged |
| OutfitCard (tap-swap, variant cycle, Skia tinting) | Unchanged |
| MiniPaletteStrip | Unchanged |
| Share flow (view-shot + expo-sharing) | Unchanged |
| Branding text "Outfinder" | Unchanged |
| First-visit tooltip overlay | Unchanged |
| Chevron indicators | Unchanged |
| Gold underline on selected garment | Unchanged |
| ScrollView for 4-garment outfits | Unchanged |
| Accessibility (adjustable role, VoiceOver announcements) | Unchanged |

---

## Compatibility with New Flow

| Entry point | Behavior | Status |
|-------------|----------|--------|
| From State 2 (Colors tab) | Push with `combinationId` | Works — same as current |
| From Favorites tab | Push with `combinationId` | Works — same as current |
| From "Browse all 159" → old Combinations | Push with `combinationId` | Works — BrowseAllColors preserves current navigation |
| Back navigation | Pop to previous screen | Works — React Navigation stack |

---

## Screenshots

- `designs/visualizer-current.png` — Current published Visualizer screen

---

## Summary

The Outfit Visualizer is mature and well-built. The 3 adjustments are consistency improvements, not redesigns:

1. **nameEn in WadaHeader** — continuity from combo card → Visualizer
2. **Heart button** — save without going back, reduces friction
3. **Dynamic nav title** — combination name instead of "Outfit Visualizer"

Total implementation effort: ~30 minutes. Can be bundled into a single story or included as polish tasks in the home redesign epic.
