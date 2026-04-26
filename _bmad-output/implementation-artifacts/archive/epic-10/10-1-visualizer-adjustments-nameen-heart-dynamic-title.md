# Story 10.1: Visualizer Adjustments — nameEn, Heart, Dynamic Title

Status: done

## Story

As a **user viewing an outfit in the Visualizer**,
I want **to see the English combination name, save it to favorites without going back, and see a meaningful navigation title**,
so that **the experience feels continuous from the combo card and I can act on what I see immediately**.

## Acceptance Criteria

1. **nameEn in WadaHeader** — WadaHeader displays nameEn (14px, `font-sans-medium`, `textSecondary` color) on a new line between nameJp and the existing subtitle "N colors · Sanzo Wada". nameEn is inside `shareViewRef` (appears in shared images). The `accessibilityLabel` includes both names.

2. **Heart button next to Share** — A `FavoriteButton` appears to the LEFT of the "Share Outfit" button. Both buttons sit in a `flex-row` container with `gap-4` and centered alignment. The heart is OUTSIDE `shareViewRef` (does NOT appear in shared images). Heart reflects current `FavoritesContext` state (filled if already favorited). Tapping toggles via `useFavorites().toggleFavorite(combinationId)`. `hapticLight()` fires on toggle. Premium paywall triggers via `usePremiumGate` if free user exceeds limit.

3. **Dynamic nav title** — Navigation header title shows `combination.nameEn` (e.g., "Autumn Dusk") instead of static "Outfit Visualizer". Back button shows default iOS back chevron. Both `ColorsStack` and `FavoritesStack` screen options set empty initial title; `OutfitVisualizer` sets title dynamically via `navigation.setOptions()`.

4. **Back navigation preserved** — From Colors tab: back returns to State 2 (shade + scroll preserved). From Favorites tab: back returns to FavoritesList. No changes to navigation params or stack structure.

5. **VoiceOver accessibility** — WadaHeader label: `"[nameJp], [nameEn], [N] color Wada combination"`. Heart button: uses existing FavoriteButton a11y (`"Add [name] to favorites"` / `"Remove [name] from favorites"`). Dynamic title is announced by React Navigation natively.

## Tasks / Subtasks

- [x] Task 1: Add nameEn to WadaHeader component (AC: #1, #5)
  - [x] 1.1 Add `nameEn` prop to `WadaHeaderProps` interface
  - [x] 1.2 Render nameEn as `<Text>` between nameJp and subtitle, with `font-sans-medium text-[14px]` className and `style={{ color: wadaTokens.textSecondary }}`
  - [ ] 1.3 ~~Render the subtitle line "N colors · Sanzo Wada"~~ — **DESCOPED**: user decided to omit subtitle
  - [x] 1.4 Update `accessibilityLabel` to include nameEn: `"[nameJp], [nameEn], [N] color Wada combination"`
  - [x] 1.5 Update WadaHeader call in `OutfitVisualizer.tsx` to pass `nameEn={combination.nameEn}`
  - [x] 1.6 Write/update WadaHeader tests: renders nameEn, a11y label includes both names

- [ ] ~~Task 2: Add FavoriteButton to OutfitVisualizer (AC: #2, #5)~~ — **DESCOPED**: user removed heart/premium gate from this story
  - [ ] ~~2.1 Import FavoriteButton, useFavorites, usePremiumGate, hapticLight~~
  - [ ] ~~2.2 Add hooks~~
  - [ ] ~~2.3 Wrap Share button area in flex-row~~
  - [ ] ~~2.4 Add FavoriteButton~~
  - [ ] ~~2.5 Add PremiumPaywall + toast overlay~~
  - [ ] ~~2.6 Write tests~~

- [x] Task 3: Dynamic navigation title (AC: #3, #4)
  - [x] 3.1 In `ColorsStack.tsx`: change OutfitVisualizer screen `title` to `""` (empty) so screen sets its own
  - [x] 3.2 In `FavoritesStack.tsx`: same change — `title: ""`
  - [x] 3.3 In `OutfitVisualizer.tsx`: add `useNavigation` import, add `useLayoutEffect` that calls `navigation.setOptions({ title: combination.nameEn })` when combination is available
  - [x] 3.4 Write tests: verify `navigation.setOptions` called with combination nameEn

- [x] Task 4: AC verification + final checks (AC: #1, #3-#5)
  - [x] 4.1 Verify AC #1: nameEn visible in WadaHeader (subtitle descoped)
  - [ ] ~~4.2 Verify AC #2: Heart button~~ — DESCOPED with Task 2
  - [x] 4.3 Verify AC #3: Dynamic title shows combination name
  - [x] 4.4 Verify AC #4: Back navigation from both stacks works (no changes to params/stack structure)
  - [x] 4.5 Verify AC #5: VoiceOver labels on WadaHeader (heart descoped)
  - [x] 4.6 Run `pnpm test`, `npx tsc --noEmit`, `pnpm lint` — all green, 0 regressions

## Dev Notes

### Architecture & Data Flow

```
OutfitVisualizer (screen)
    |-- route.params.combinationId → getCombination() → Combination
    |-- useNavigation().setOptions({ title: nameEn })  ← NEW
    |-- useFavorites() → isFavorite, toggleFavorite     ← NEW
    |-- usePremiumGate(favorites)                       ← NEW
    |
    |-- shareViewRef (capture area):
    |     WarmBackground + Aureola + WadaHeader(nameJp, nameEn, colorCount) + OutfitCard + MiniPaletteStrip + branding
    |
    |-- Below capture area (NOT in shareViewRef):
    |     <View flex-row gap-4>
    |       FavoriteButton(combinationId, isFavorite, onToggle, onPremiumGate)  ← NEW
    |       ShareOutfit Pressable (existing)
    |     </View>
    |     PremiumPaywall (modal, if triggered)  ← NEW
    |     Toast overlay (if triggered)          ← NEW
    |
    |-- Tooltip overlay (existing, unchanged)
```

### Critical Implementation Details

**WadaHeader currently does NOT render the subtitle:**
The current `WadaHeader` component accepts `colorCount` prop but does NOT render it. The spec (epics-v2.md) describes "N colors · Sanzo Wada" as the existing subtitle — but checking the actual code (`WadaHeader.tsx:9-24`), only `nameJp` text is rendered. The subtitle must be ADDED in this story. Final order: nameJp → nameEn → subtitle.

**WadaHeader layout (3 lines):**
```
秋の暮                  ← nameJp: font-serif-jp-medium text-[20px] tracking-[2px] textPrimary (existing)
Autumn Dusk             ← nameEn: font-sans-medium text-[14px] textSecondary (NEW)
3 colors · Sanzo Wada   ← subtitle: font-sans text-[11px] wadaMuted (NEW - uses colorCount prop)
```

**FavoriteButton + premium gate pattern (from FavoritesList.tsx + ComboCard.tsx):**
```tsx
const { isFavorite, toggleFavorite, favorites } = useFavorites();
const gate = usePremiumGate(favorites);

// In FavoriteButton onToggle:
const handleFavoriteToggle = useCallback(() => {
  if (!gate.isPremium && !isFavorite(combinationId)) {
    gate.handlePremiumGate(combinationId);
  } else {
    toggleFavorite(combinationId);
  }
}, [gate, isFavorite, toggleFavorite, combinationId]);
```
FavoriteButton's `onPremiumGate` prop is used when the user is NOT premium and wants to ADD a favorite. The button internally calls `hapticLight()` — no need to call it externally.

**PremiumPaywall + toast overlay (reuse from FavoritesList):**
The PremiumPaywall modal and toast overlay are already used in FavoritesList. Render them at the bottom of OutfitVisualizer's JSX (before the tooltip overlay), passing `gate` props. The `PremiumPaywall` needs: `visible`, `onDismiss`, `onPurchase`, `onRestore`, `blockedCombination`, `favoriteCombinationIds`, `priceString`, `purchaseState`, `errorMessage`.

**navigation.setOptions for dynamic title:**
Use `useLayoutEffect` (not `useEffect`) so the title updates before the paint. Must import `useNavigation` from `@react-navigation/native`. The navigation type needs to handle both `ColorsStackParamList` and `FavoritesStackParamList` — use a generic `useNavigation<NativeStackNavigationProp<{ OutfitVisualizer: { combinationId: string } }>>()`.

**Stack screen options change:**
Both `ColorsStack.tsx:50` and `FavoritesStack.tsx:30` currently have `title: "Outfit Visualizer"`. Change to `title: ""`. Keep `headerBackTitle: ""` and all other options unchanged. The `headerTitleStyle` with `NotoSerifJP_500Medium` remains — the dynamic title will use this font.

**Hooks order — all hooks before early return:**
The current OutfitVisualizer has an early return at ~line 198 (`if (!combination)`). The new hooks (`useFavorites`, `usePremiumGate`, `useNavigation`, `useLayoutEffect`) MUST be called BEFORE this early return. Place them with the other hooks near lines 52-68.

**shareViewRef boundary is critical:**
- WadaHeader with nameEn: INSIDE shareViewRef ✓ (nameEn appears in shared images)
- FavoriteButton: OUTSIDE shareViewRef ✓ (heart does NOT appear in shared images)
- The share button area is already outside shareViewRef (lines 304-320)

### Files to Modify

| File | Change |
|------|--------|
| `src/components/WadaHeader.tsx` | Add `nameEn` prop, render nameEn text, render subtitle "N colors · Sanzo Wada", update a11y label |
| `src/screens/OutfitVisualizer.tsx` | Add useFavorites + usePremiumGate hooks, add FavoriteButton next to Share, add PremiumPaywall + toast, pass nameEn to WadaHeader, add useLayoutEffect for dynamic title |
| `src/navigation/ColorsStack.tsx` | Change OutfitVisualizer title from "Outfit Visualizer" to "" |
| `src/navigation/FavoritesStack.tsx` | Change OutfitVisualizer title from "Outfit Visualizer" to "" |
| `src/screens/OutfitVisualizer.test.tsx` | Add tests for nameEn in WadaHeader, heart button, dynamic title, premium gate |

### Files NOT to Modify

| File | Reason |
|------|--------|
| `src/components/FavoriteButton.tsx` | Reuse as-is — already has size, combinationName, onPremiumGate props |
| `src/contexts/FavoritesContext.tsx` | No data layer changes |
| `src/hooks/usePremiumGate.ts` | Reuse as-is |
| `src/components/PremiumPaywall.tsx` | Reuse as-is |
| `src/navigation/types.ts` | No param changes — OutfitVisualizer already takes `{ combinationId: string }` |
| `src/lib/haptics.ts` | Already has hapticLight exported |
| `src/data/colorIndex.ts` | No changes |

### Existing Patterns to Follow

- **Haptics:** FavoriteButton internally calls `hapticLight()` — do NOT add external haptic calls
- **Premium gate:** Pattern from ComboCard: check `!gate.isPremium && !isFavorite(id)` before toggling, else call `gate.handlePremiumGate(id)`
- **PremiumPaywall render:** Copy pattern from FavoritesList — `gate.paywallVisible`, `gate.handleDismiss`, etc.
- **Navigation:** `useNavigation()` from `@react-navigation/native` + `useLayoutEffect` for `setOptions`
- **NativeWind:** `className` for static styles, `style={{}}` only for dynamic color values
- **Named exports:** All components use `export function X()`

### Testing Patterns

**Mock setup updates needed:**
```tsx
// Add to existing mock of @react-navigation/native:
const mockSetOptions = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useRoute: () => ({ params: mockRouteParams }),
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

// Add FavoritesContext mock:
const mockIsFavorite = jest.fn();
const mockToggleFavorite = jest.fn();
jest.mock("@/contexts/FavoritesContext", () => ({
  useFavorites: () => ({
    favorites: new Set(),
    isFavorite: (...args: unknown[]) => mockIsFavorite(...args),
    toggleFavorite: (...args: unknown[]) => mockToggleFavorite(...args),
    count: 0,
  }),
}));

// Add usePremiumGate mock:
const mockHandlePremiumGate = jest.fn();
jest.mock("@/hooks/usePremiumGate", () => ({
  usePremiumGate: () => ({
    isPremium: true,
    paywallVisible: false,
    blockedCombination: undefined,
    toastVisible: false,
    toastOpacity: { setValue: jest.fn() },
    favoriteCombinationIds: [],
    priceString: "$2.99",
    purchaseState: "idle",
    errorMessage: null,
    handlePremiumGate: (...args: unknown[]) => mockHandlePremiumGate(...args),
    handleDismiss: jest.fn(),
    handlePurchase: jest.fn(),
    handleRestore: jest.fn(),
    openPaywall: jest.fn(),
  }),
}));
```

**Key tests to add:**
1. "WadaHeader renders nameEn" — verify `screen.getByText("Autumn Dusk")` or similar
2. "WadaHeader renders subtitle with color count" — verify `screen.getByText(/colors · Sanzo Wada/)`
3. "renders FavoriteButton next to Share" — verify `screen.getByTestId("favorite-button-combo-2")`
4. "heart toggle calls toggleFavorite" — `fireEvent.press(heartButton)` → verify `mockToggleFavorite` called with combinationId
5. "navigation.setOptions called with combination nameEn" — verify `mockSetOptions({ title: "Test" })` or similar
6. "heart not visible when combination not found" — verify favorite button absent in error state

**Test baseline:** 490 tests across ~35 suites (from Story 9.2). This story should add ~8-12 new tests.

### Previous Story Intelligence (Story 9.2)

- **useFocusEffect for reset:** Story 9.2 used `useFocusEffect` to reset sort mode — not applicable here but confirms the pattern works
- **Hooks before early returns:** CRITICAL — Story 9.2 docs emphasize all hooks must be called before conditional returns. Current OutfitVisualizer has early return at ~line 198; all new hooks must go before it
- **FavoriteButton already has combinationName prop:** Added in 9.1 review for VoiceOver — pass `combination.nameEn` for accessible label
- **PremiumPaywall render pattern:** Already established in FavoritesList — copy the JSX block
- **isPremium guard in toggle handler:** Story 9.1 review found this was missing. Ensure the toggle handler checks `!gate.isPremium` before calling `gate.handlePremiumGate`
- **490 tests passing baseline:** No regressions allowed

### Git Intelligence (Recent Commits)

```
6d28fb1 feat: sort pills, empty state update + code review fixes (Story 9.2)
44f73dc feat: Favorites 2-col grid with ComboCard compact + code review fixes (Story 9.1)
5d24452 feat: ComboCard component — full + compact variants with code review fixes (Story 8.3)
```
- Current branch: `story-9.1-favorites-2col-grid` — will need new branch `story-10.1-visualizer-adjustments` off `epic-1`
- ComboCard and FavoriteButton components are stable and fully tested
- FavoritesList patterns for premium gate are the reference implementation

### Project Structure Notes

- All changes in existing files — no new component files needed
- WadaHeader enhancement is backward-compatible (nameEn + subtitle are additive)
- Navigation title is the only cross-file change (ColorsStack + FavoritesStack + OutfitVisualizer)
- No data layer changes — all data already available in Combination type

### References

- [Source: designs/visualizer-adjustments-spec.md — Complete spec for all 3 adjustments]
- [Source: docs/planning/epics-v2.md — Epic 10, Story 10.1, FR27-FR29, NFR11-NFR12]
- [Source: src/components/WadaHeader.tsx — Current implementation (nameJp only, no subtitle)]
- [Source: src/screens/OutfitVisualizer.tsx — Current implementation (share button area, shareViewRef boundary)]
- [Source: src/components/FavoriteButton.tsx — Reusable heart component with size, combinationName, onPremiumGate]
- [Source: src/screens/FavoritesList.tsx — Premium gate + paywall + toast render pattern]
- [Source: src/navigation/ColorsStack.tsx:50 — Current static title "Outfit Visualizer"]
- [Source: src/navigation/FavoritesStack.tsx:30 — Current static title "Outfit Visualizer"]
- [Source: _bmad-output/implementation-artifacts/9-2-sort-pills-favorites-count-empty-state.md — Previous story intelligence]
- [Source: docs/project-context.md — Component patterns, haptics, navigation, testing]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Biome formatting required line-breaking long type annotation and collapsing short getByLabelText call
- FavoriteButton on this branch lacks `combinationName` and `size` props (story spec assumed future branch state). Adapted to current API.
- `usePremiumGate` doesn't expose `isPremium` — used `usePremium()` directly, matching FavoritesList pattern.
- Added `getAllCombinations` to colorIndex mock (PremiumPaywall dependency) and `hapticLight` to haptics mock (FavoriteButton dependency).

### Completion Notes List

- ✅ Task 1: WadaHeader enhanced with `nameEn` prop (optional, backward-compatible), a11y label includes both names. 5 unit tests added in new `WadaHeader.test.tsx`. Subtitle "N colors · Sanzo Wada" descoped by user.
- ⏸️ Task 2: DESCOPED — FavoriteButton + premium gate removed from this story by user decision.
- ✅ Task 3: Navigation title changed from static "Outfit Visualizer" to dynamic `combination.nameEn` via `useLayoutEffect` + `navigation.setOptions()`. Both ColorsStack and FavoritesStack updated to `title: ""`. 2 new tests: setOptions called with nameEn, not called when invalid.
- ✅ Task 4: Implemented ACs verified (AC #1 partial, #3, #4, #5 partial). 405 tests passing (was ~396 baseline). TSC and lint clean. No regressions.

### Change Log

- 2026-04-02: Story 10.1 implemented — nameEn in WadaHeader, dynamic nav title. FavoriteButton + subtitle descoped by user.
- 2026-04-02: Code review — updated story to reflect descoped tasks, fixed sprint-status merge conflict, corrected test count (405 not 411).

### File List

**New files:**
- src/components/WadaHeader.test.tsx

**Modified files:**
- src/components/WadaHeader.tsx
- src/screens/OutfitVisualizer.tsx
- src/screens/OutfitVisualizer.test.tsx
- src/navigation/ColorsStack.tsx
- src/navigation/FavoritesStack.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/10-1-visualizer-adjustments-nameen-heart-dynamic-title.md
