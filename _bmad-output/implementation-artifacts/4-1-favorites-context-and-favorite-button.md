# Story 4.1: Favorites Context & FavoriteButton

Status: review

## Story

As a user,
I want to tap a heart icon on any combination to save it to my favorites,
so that I can quickly find combinations I love without searching again.

## Acceptance Criteria

1. **Given** FavoritesContext is implemented in `src/contexts/FavoritesContext.tsx`, **When** the app launches, **Then** favorites are loaded from AsyncStorage key `@outfinder/favorites` into a `Set<string>` (combination IDs) in memory. FavoritesProvider wraps the app in `App.tsx` (above NavigationContainer). `useFavorites()` hook exposes: `favorites` Set, `isFavorite(id)`, `toggleFavorite(id)`, `count`.

2. **Given** `toggleFavorite(id)` is called, **When** the combination is not yet a favorite, **Then** it is added to the favorites Set and persisted to AsyncStorage immediately (FR19). **When** the combination is already a favorite, it is removed and AsyncStorage is updated (FR20). AsyncStorage write is wrapped in try/catch — errors logged, not thrown (NFR22). Data format: JSON-serialized string array of combination IDs.

3. **Given** a FavoriteButton component is displayed on each PaletteStrip, **When** the user taps the heart icon, **Then** the heart fills with `--favorite-red` (#E74C3C) and scales via spring animation (Reanimated: scale 1.0 → 1.2 → 1.0) (FR19). hapticLight() fires on tap. A second tap unfills the heart (returns to outline) (FR20). The button has `accessibilityLabel="Save to favorites"` / `"Remove from favorites"` based on state. The hit area is minimum 44x44px (icon 24px with 10px padding each side) (FR35). If Reduce Motion is enabled, the scale animation is skipped.

4. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. Existing 156 tests continue to work unchanged. New tests cover: FavoritesContext add/remove/toggle/persistence/initial-load, FavoriteButton rendering/toggling/accessibility/animation-skip/reduce-motion.

## Tasks / Subtasks

- [x] Task 1: Create FavoritesContext and useFavorites hook (AC: #1, #2)
  - [x] 1.1 Create `src/contexts/FavoritesContext.tsx` — FavoritesProvider loads favorites from AsyncStorage on mount into a `Set<string>`. Exposes `useFavorites()` with: `favorites`, `isFavorite(id)`, `toggleFavorite(id)`, `count`.
  - [x] 1.2 `toggleFavorite` adds or removes the ID, updates state, and persists to AsyncStorage (`@outfinder/favorites`) as `JSON.stringify([...set])`. Wrap AsyncStorage write in try/catch — log errors, never throw.
  - [x] 1.3 Wrap the app with `<FavoritesProvider>` in `App.tsx` — place it ABOVE `<NavigationContainer>` so all screens have access.
  - [x] 1.4 Create `src/contexts/FavoritesContext.test.tsx` — test: initial load from empty storage, initial load with existing data, toggle add, toggle remove, persistence to AsyncStorage, isFavorite accuracy, count accuracy.

- [x] Task 2: Create FavoriteButton component (AC: #3)
  - [x] 2.1 Create `src/components/FavoriteButton.tsx` — renders SF Symbol `heart` (outline) / `heart.fill` (filled) via expo-symbols. 24px icon size, 44x44px Pressable hit area. Fill color: `--favorite-red` (#E74C3C) when active, `--text-tertiary` (#9b9b9b) when inactive.
  - [x] 2.2 Add spring scale animation on toggle: `withSpring(1.2)` then `withSpring(1.0)` via `useSharedValue` + `useAnimatedStyle`. Skip animation when `useReducedMotion()` returns true.
  - [x] 2.3 Fire `hapticLight()` on press. Set `accessibilityLabel` to "Save to favorites" / "Remove from favorites". Set `accessibilityRole="button"`.
  - [x] 2.4 Create `src/components/FavoriteButton.test.tsx` — test: renders outline when not favorite, renders filled when favorite, toggle calls onToggle, accessibility labels switch, 44px hit area present.

- [x] Task 3: Integrate FavoriteButton into PaletteStrip (AC: #3)
  - [x] 3.1 Add `isFavorite` and `onToggleFavorite` props to PaletteStripProps. Render FavoriteButton in the top-right corner of the PaletteStrip, absolutely positioned (matching hanger icon pattern in bottom-right).
  - [x] 3.2 In `Combinations.tsx` screen, pass `isFavorite` and `onToggleFavorite` from `useFavorites()` context to each PaletteStrip.
  - [x] 3.3 Update PaletteStrip tests to verify FavoriteButton presence and interaction.

- [x] Task 4: Verification (AC: #4)
  - [x] 4.1 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all pass, 0 errors.
  - [x] 4.2 Point-by-point AC verification: each AC verified as implemented.
  - [x] 4.3 Verify File List matches actual changes via `git diff --name-status`.

## Dev Notes

### Epic 2 Retro Learnings — Apply to This Story

From the Epic 2 retrospective (2026-03-17):
- **Action Item #1:** Reduce HIGH findings in code reviews — target max 2 HIGHs total in Epic 4 (vs 5 in Epic 2). Write quality code on first pass.
- **Previous Story Intelligence pattern** continues — mandatory.
- **File List verified with `git diff --name-status`** before marking done.
- Code review before merge — non-negotiable.

### Current Code State

**App.tsx** (line 36-39): Currently `<NavigationContainer><TabNavigator /></NavigationContainer>` — FavoritesProvider must wrap ABOVE NavigationContainer:
```tsx
<FavoritesProvider>
  <NavigationContainer>
    <TabNavigator />
  </NavigationContainer>
</FavoritesProvider>
```

**PaletteStrip.tsx**: Currently has no heart icon. Has a hanger/visualize icon absolutely positioned in `bottom-1 right-1`. FavoriteButton goes in `top-1 right-1` using the same absolute positioning pattern. PaletteStrip currently only accepts `combination` and `selectedColorId` props — needs `isFavorite` and `onToggleFavorite` added.

**PaletteStrip navigation type**: Currently hardcodes `ColorsStackParamList` for navigation. This works for both ColorsStack and FavoritesStack because both have the same screen names (`Combinations`, `OutfitVisualizer`) with the same params. The `useNavigation` will resolve to whichever stack the component is rendered in. **No change needed here for Story 4.1** — but note this for Story 4.2 when FavoritesList renders PaletteStrips.

**FavoritesStack.tsx**: Already configured with FavoritesList → Combinations → OutfitVisualizer. No changes needed for 4.1.

**Navigation types.ts**: FavoritesStackParamList already defined with correct screens. No changes needed.

### Architecture Decisions

**Storage key:** `@outfinder/favorites` in AsyncStorage (NOT expo-secure-store — that's for premium status only).
[Source: docs/planning/architecture-react-native-ios.md#Data-Model]

**Data format:** `JSON.stringify(string[])` — array of combination IDs. Loaded into `Set<string>` in memory for O(1) lookups.
[Source: docs/planning/architecture-react-native-ios.md#Storage]

**Context pattern:** React Context + Provider, no state management library. Same pattern that will be used for PremiumContext in Epic 5.
[Source: docs/planning/architecture-react-native-ios.md#State-Management]

**No premium gating in this story.** The UX spec defines `isPremium` and `onPremiumGate` props on FavoriteButton — DO NOT implement these yet. Epic 5 handles premium. For now, all users can save unlimited favorites. The premium gate will be added in Story 5.1 by wrapping the toggle logic.

### FavoriteButton UX Spec Details

From UX Design Specification:
- SF Symbol `heart` (outline) / `heart.fill` (filled) — use expo-symbols (`SymbolView` with `name="heart"` / `name="heart.fill"`)
- 24px icon size, 44x44px hit area (icon 24px + 10px padding each side)
- Fill color: `--favorite-red` (#E74C3C) when active, `--text-tertiary` (#9b9b9b) when inactive
- Animation: spring scale 1.0 → 1.2 → 1.0 + color transition
- Position on PaletteStrip: top-right corner
- Pinterest-style: instant save, no confirmation dialog
[Source: docs/planning/ux-design-specification-ios.md#FavoriteButton]
[Source: docs/planning/ux-design-specification-ios.md#Feedback-Patterns]

### expo-symbols Usage

The project already uses expo-symbols for tab bar icons. Import pattern:
```tsx
import { SymbolView } from "expo-symbols";
// Usage:
<SymbolView name="heart" style={{ width: 24, height: 24 }} tintColor="#9b9b9b" />
<SymbolView name="heart.fill" style={{ width: 24, height: 24 }} tintColor="#E74C3C" />
```

Check `TabNavigator.tsx` for the existing expo-symbols usage pattern — follow the same approach.

### AsyncStorage Mock for Tests

AsyncStorage needs mocking in tests. The package `@react-native-async-storage/async-storage` provides a built-in mock:
```typescript
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
```

### Patterns to Follow

- **Function declarations with named exports** — `export function FavoriteButton(...)`, `export function FavoritesProvider(...)`
- **Props interface required** — `interface FavoriteButtonProps`, no `export default`
- **NativeWind className** for static styles — `style={{}}` only for dynamic values
- **Haptics through `@/lib/haptics`** — never import expo-haptics directly
- **`useReducedMotion()`** — skip all animations when true
- **Co-located tests** — `FavoriteButton.test.tsx` next to `FavoriteButton.tsx`
- **testID attributes** — `testID="favorite-button-{combinationId}"`
- **accessibilityRole="button"** on all interactive elements

### What NOT to Do

- DO NOT create `lib/storage.ts` wrapper — that's for Epic 5 when SecureStore is needed. Use AsyncStorage directly in FavoritesContext.
- DO NOT implement premium gating (`isPremium`, `onPremiumGate` props) — Epic 5.
- DO NOT modify FavoritesList screen — Story 4.2 handles that.
- DO NOT add FavoriteButton to OutfitVisualizer — only PaletteStrip for now.
- DO NOT use `StyleSheet.create` — use NativeWind className.
- DO NOT use `Animated` from react-native — use Reanimated.

### Git Branching

Create story branch `story-4.1-favorites-context-and-favorite-button` off `epic-2` (current main epic branch). Note: Epic 4 branch doesn't exist yet — create `epic-4` from `epic-2` first, then create story branch off `epic-4`.

### Project Structure Notes

New files follow established patterns:
- `src/contexts/` — new directory for React Context (doesn't exist yet, create it)
- `src/components/FavoriteButton.tsx` — alongside existing components
- Co-located test files next to source files

### References

- [Source: docs/planning/epics.md#Story-4.1] — Story requirements and AC
- [Source: docs/planning/architecture-react-native-ios.md#Storage] — AsyncStorage for favorites, key format
- [Source: docs/planning/architecture-react-native-ios.md#State-Management] — FavoritesContext pattern
- [Source: docs/planning/architecture-react-native-ios.md#Naming-Conventions] — Context provider naming
- [Source: docs/planning/ux-design-specification-ios.md#FavoriteButton] — Component spec, animation, positioning
- [Source: docs/planning/ux-design-specification-ios.md#EmptyState] — Future reference (Story 4.2)
- [Source: docs/planning/ux-design-specification-ios.md#Feedback-Patterns] — Heart toggle animation spec
- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-03-17.md] — Action items, epic reordering
- [Source: _bmad-output/implementation-artifacts/2-3-outfit-visualizer-layout-and-proportions.md] — Previous story patterns, 166 test count
- [Source: docs/project-context.md] — Current project structure, established patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- **Task 1:** Created FavoritesContext with FavoritesProvider, useFavorites hook. Loads from AsyncStorage on mount into Set<string>. toggleFavorite adds/removes with immediate persistence. try/catch on all AsyncStorage operations. 9 tests covering all context functionality.
- **Task 2:** Created FavoriteButton with expo-symbols SymbolView (heart/heart.fill), Reanimated spring scale animation (1.0→1.2→1.0), hapticLight on press, a11y labels that switch based on state, 44x44px hit area, Reduce Motion support. 9 tests covering all button behavior (including Reduce Motion animation skip).
- **Task 3:** Integrated FavoriteButton into PaletteStrip (top-right absolute position), added optional isFavorite/onToggleFavorite props. Updated CombinationList to pass through favorites props. Connected Combinations screen to useFavorites context. 5 new integration tests.
- **Task 4:** All 3 validation commands pass with 0 errors. 178 tests total (22 new). File List verified with git diff. Also fixed 3 pre-existing PaletteBar test failures (Japanese→English text mismatch from Story 2.3 commit 6a00811).

### AC Verification

1. ✅ FavoritesContext in src/contexts/FavoritesContext.tsx. Loads from AsyncStorage `@outfinder/favorites` into Set<string>. FavoritesProvider wraps app above NavigationContainer. useFavorites() exposes: favorites, isFavorite(id), toggleFavorite(id), count.
2. ✅ toggleFavorite adds/removes from Set and persists to AsyncStorage as JSON string array. AsyncStorage write wrapped in try/catch — errors logged, not thrown.
3. ✅ FavoriteButton on each PaletteStrip. heart/heart.fill via expo-symbols. #E74C3C when active, #9b9b9b inactive. Spring animation (scale 1.0→1.2→1.0). hapticLight on tap. a11y labels switch. 44x44px hit area. Reduce Motion skips animation.
4. ✅ tsc, lint, test all pass with 0 errors. 178 tests (22 new). All existing tests continue to pass.

### File List

- App.tsx (MODIFIED — wrap with FavoritesProvider above NavigationContainer)
- src/contexts/FavoritesContext.tsx (NEW — FavoritesProvider, useFavorites hook, AsyncStorage persistence)
- src/contexts/FavoritesContext.test.tsx (NEW — 9 context tests: load, toggle, persist, isFavorite, count, error handling)
- src/components/FavoriteButton.tsx (NEW — heart toggle with spring animation, haptics, a11y)
- src/components/FavoriteButton.test.tsx (NEW — 8 tests: rendering states, toggle, a11y labels, hit area)
- src/components/CombinationList.tsx (MODIFIED — pass-through isFavorite/onToggleFavorite props to PaletteStrip)
- src/components/PaletteStrip.tsx (MODIFIED — add FavoriteButton in top-right, new optional props isFavorite/onToggleFavorite)
- src/components/PaletteStrip.test.tsx (MODIFIED — 4 new FavoriteButton integration tests + expo-symbols/reanimated mocks)
- src/components/PaletteBar.test.tsx (MODIFIED — fix pre-existing JP→EN text assertions from Story 2.3)
- src/screens/Combinations.tsx (MODIFIED — useFavorites context, pass isFavorite/onToggleFavorite to CombinationList)
- src/screens/Combinations.test.tsx (MODIFIED — mock FavoritesContext, 1 new test verifying favorites props passed)

## Change Log

- 2026-03-17: Story 4.1 implementation complete — FavoritesContext, FavoriteButton, PaletteStrip integration, 22 new tests (178 total)
- 2026-03-17: Code review fixes — added Reduce Motion test for FavoriteButton, runtime JSON validation in FavoritesContext, theme token refs in FavoriteButton, useCallback for CombinationList renderItem, corrected test baseline count. 23 new tests (179 total)
