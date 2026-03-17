# Story 4.2: Favorites List Screen & Navigation

Status: done

## Story

As a user,
I want to view all my saved favorites in a dedicated tab and navigate to their combinations,
so that I can quickly reference my curated color palette collection.

## Acceptance Criteria

1. **Given** the user taps the Favorites tab in the bottom bar, **When** the FavoritesList screen renders, **Then** a large title navigation bar displays "Favorites" (collapses to inline on scroll). All saved combinations are displayed as PaletteStrip components (same presentation as Combinations screen) (FR21). PaletteStrips in Favorites have heart icons (filled, since they are favorites). The screen is accessible from the main tab navigation at any time (FR23).

2. **Given** the user has zero saved favorites, **When** the FavoritesList screen renders, **Then** a centered EmptyState component displays: "No favorites yet" (Noto Serif JP, 18px) + "Tap ♡ on any combination to save it here" (Inter, 14px, --text-secondary). The empty state has appropriate accessibilityLabel.

3. **Given** the user taps a color within a PaletteStrip on the Favorites screen, **When** the tap is registered, **Then** the FavoritesStack pushes a Combinations screen for that color (same screen component reused). From there, the user can push to OutfitVisualizer. Back navigation returns to FavoritesList. The Favorites tab maintains its own independent navigation stack.

4. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. Existing 179 tests continue to work unchanged. New tests cover: FavoritesList rendering with favorites, FavoritesList empty state, EmptyState component rendering/accessibility, navigation from FavoritesList to Combinations.

## Tasks / Subtasks

- [x] Task 1: Create EmptyState component (AC: #2)
  - [x] 1.1 Create `src/components/EmptyState.tsx` — centered layout with title (Noto Serif JP, 18px) and subtitle (Inter, 14px, --text-secondary). Props: `title: string`, `subtitle: string`. Use NativeWind className for all static styles. Add `accessibilityLabel` combining title and subtitle text.
  - [x] 1.2 Create `src/components/EmptyState.test.tsx` — test: renders title and subtitle text, has correct accessibilityLabel, renders centered layout.

- [x] Task 2: Implement FavoritesList screen (AC: #1, #2)
  - [x] 2.1 Replace placeholder `FavoritesList.tsx` — use `useFavorites()` to get `favorites` Set. Use `getCombination()` from `@/data/colorIndex` to resolve each favorite ID into a `Combination` object. Filter out any undefined results (deleted combinations). Render a FlatList of PaletteStrip components (reuse CombinationList pattern: 16px padding, ItemSeparator with divider). Pass `isFavorite={() => true}` and `onToggleFavorite` from context to each PaletteStrip. When `favorites.size === 0`, render EmptyState with title "No favorites yet" and subtitle "Tap ♡ on any combination to save it here".
  - [x] 2.2 PaletteStrip renders within FavoritesStack — the existing PaletteStrip uses `useNavigation<NativeStackNavigationProp<ColorsStackParamList>>()`. This works because FavoritesStackParamList has identical screen names ("Combinations", "OutfitVisualizer") with the same params. The `useNavigation` will resolve to the FavoritesStack navigator. **No changes needed to PaletteStrip.tsx** — verify this works by testing navigation.
  - [x] 2.3 Create `src/screens/FavoritesList.test.tsx` — test: renders empty state when no favorites, renders PaletteStrips when favorites exist, heart icons are filled (isFavorite=true), toggling unfavorite removes the strip, accessibilityLabel on empty state.

- [x] Task 3: Configure FavoritesStack large title navigation (AC: #1, #3)
  - [x] 3.1 Update `FavoritesStack.tsx` — add `headerLargeTitle: true` to FavoritesList screen options matching ColorsStack pattern (wadaTokens.navBarBg, NotoSerifJP_500Medium for large title, textPrimary tint). Add consistent header styles to Combinations and OutfitVisualizer screens (same as ColorsStack).
  - [x] 3.2 Verify navigation flow: FavoritesList → tap color in PaletteStrip → Combinations pushes → tap Visualizer icon → OutfitVisualizer pushes → back returns correctly through the stack.

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

### Previous Story Intelligence (Story 4.1)

From Story 4.1 implementation:
- **FavoritesContext** is fully working: `useFavorites()` exposes `favorites` (Set<string>), `isFavorite(id)`, `toggleFavorite(id)`, `count`. Located at `src/contexts/FavoritesContext.tsx`.
- **FavoriteButton** is fully working with spring animation, haptics, a11y. Located at `src/components/FavoriteButton.tsx`.
- **PaletteStrip** already integrates FavoriteButton with optional `isFavorite` and `onToggleFavorite` props.
- **CombinationList** passes through `isFavorite` and `onToggleFavorite` to PaletteStrip.
- Story 4.1 completed with 179 tests (22 new + 3 pre-existing fixes).
- **Navigation observation from 4.1:** PaletteStrip hardcodes `ColorsStackParamList` for navigation type. Since `FavoritesStackParamList` has identical screen names and params, `useNavigation` resolves correctly to whichever stack the component is rendered in. No changes needed.

### Current Code State

**FavoritesList.tsx** (placeholder): Simple centered text "Favorites — Story 4.1". Needs complete replacement with actual favorites list implementation.

**FavoritesStack.tsx**: Already configured with `FavoritesList → Combinations → OutfitVisualizer` screens. Missing: large title header styling on FavoritesList screen, consistent header styles on pushed screens.

**Navigation types.ts**: `FavoritesStackParamList` already defined with correct screens: `FavoritesList: undefined`, `Combinations: { colorId: string }`, `OutfitVisualizer: { combinationId: string }`.

**Combinations.tsx**: Uses `NativeStackScreenProps<ColorsStackParamList, "Combinations">` for its props type. Since both ColorsStackParamList and FavoritesStackParamList define `Combinations: { colorId: string }` identically, the screen works correctly in both stacks.

**colorIndex.ts**: Has `getCombination(combinationId: string): Combination | undefined` — use this to resolve favorite IDs to Combination objects.

### Architecture Decisions

**Favorites data flow:** `useFavorites().favorites` gives a `Set<string>` of combination IDs. To render PaletteStrips, iterate the Set, call `getCombination(id)` for each, filter out undefined, render as FlatList.

**No `selectedColorId` in FavoritesList:** PaletteStrip requires a `selectedColorId` prop (used for the white dot indicator). In FavoritesList there's no "selected color" context. Pass an empty string `""` — no dot will appear since no color ID will match, which is the correct behavior.

**EmptyState as reusable component:** The UX spec defines EmptyState for Favorites. Create it as a reusable component (title + subtitle props) since it may be needed for other empty states later (e.g., search results). But keep it simple — no illustration for now (illustration is described in UX spec as "line-art style matching onboarding" but onboarding isn't implemented yet, so skip illustration).

**Large title navigation:** Match `ColorsStack.tsx` pattern exactly: `headerLargeTitle: true`, `headerLargeStyle: { backgroundColor: wadaTokens.navBarBg }`, `headerLargeTitleStyle: { fontFamily: "NotoSerifJP_500Medium" }`.

### Patterns to Follow

- **Function declarations with named exports** — `export function FavoritesList(...)`, `export function EmptyState(...)`
- **Props interface required** — `interface FavoritesListProps`, `interface EmptyStateProps`
- **NativeWind className** for static styles — `style={{}}` only for dynamic values
- **Haptics through `@/lib/haptics`** — never import expo-haptics directly
- **Co-located tests** — `FavoritesList.test.tsx` next to `FavoritesList.tsx`, `EmptyState.test.tsx` next to `EmptyState.tsx`
- **testID attributes** — e.g., `testID="favorites-list"`, `testID="favorites-empty-state"`
- **accessibilityRole="button"** on all interactive elements
- **FlatList for lists** — not ScrollView (virtualization needed for potentially many favorites)

### What NOT to Do

- DO NOT modify PaletteStrip.tsx — it already works in both stacks without changes.
- DO NOT modify Combinations.tsx — it works in both ColorsStack and FavoritesStack as-is.
- DO NOT add illustration to EmptyState — onboarding illustrations don't exist yet. Text-only for now.
- DO NOT implement premium gating — Epic 5 handles that.
- DO NOT create a separate FavoritesPaletteStrip — reuse the existing PaletteStrip component.
- DO NOT use `StyleSheet.create` — use NativeWind className.
- DO NOT use `Animated` from react-native — use Reanimated if any animation needed (none expected in this story).

### Git Branching

Create story branch `story-4.2-favorites-list-screen-and-navigation` off `epic-1` (current main epic branch). Note: Story 4.1 was on `story-4.1-favorites-context-and-favorite-button` — that should have been merged into the epic branch before starting 4.2.

### Project Structure Notes

Files to create/modify follow established patterns:
- `src/components/EmptyState.tsx` (NEW) — alongside existing components
- `src/components/EmptyState.test.tsx` (NEW) — co-located test
- `src/screens/FavoritesList.tsx` (MODIFIED) — replace placeholder
- `src/screens/FavoritesList.test.tsx` (NEW) — screen tests
- `src/navigation/FavoritesStack.tsx` (MODIFIED) — header styling

### References

- [Source: docs/planning/epics.md#Story-4.2] — Story requirements and AC
- [Source: docs/planning/ux-design-specification-ios.md#EmptyState] — EmptyState component spec
- [Source: docs/planning/ux-design-specification-ios.md#Empty-States] — Empty state text and typography
- [Source: docs/planning/architecture-react-native-ios.md#Navigation] — FavoritesStack structure, large title
- [Source: docs/planning/architecture-react-native-ios.md#Favorites] — FR19-FR23 implementation map
- [Source: _bmad-output/implementation-artifacts/4-1-favorites-context-and-favorite-button.md] — Previous story patterns, 179 test count, navigation observation
- [Source: docs/project-context.md] — Current project structure, established patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Branch created from story-4.1 (not epic-1) because epic-1 was behind — missing stories 1.5, 2.x, 4.1 code.
- TypeScript error in EmptyState.test.tsx: ternary with `getByAccessibilityHint` always truthy — simplified to direct `getByLabelText`.
- Biome formatting fix: inline single-line render call.
- Navigation mock required for FavoritesList tests since PaletteStrip uses `useNavigation()` internally.

### Completion Notes List

- **Task 1:** Created EmptyState reusable component with title/subtitle props, NativeWind styling, combined accessibilityLabel, and accessibilityRole="summary". 3 tests.
- **Task 2:** Replaced FavoritesList placeholder with full implementation using useFavorites() + getCombination() + FlatList of PaletteStrips. Empty state renders EmptyState component. 9 tests cover empty state, rendering, favorites, toggle via fireEvent, navigation to Combinations via fireEvent, invalid ID filtering, and ItemSeparator dividers. PaletteStrip confirmed to work in FavoritesStack without changes (identical param list names).
- **Task 3:** FavoritesStack updated with large title navigation matching ColorsStack pattern exactly (wadaTokens.navBarBg, NotoSerifJP_500Medium, textPrimary tint). Consistent header styles on Combinations and OutfitVisualizer screens.
- **Task 4:** All quality gates pass — tsc 0 errors, lint 0 errors, 191/191 tests pass (179 existing + 12 new). All 4 ACs verified point-by-point.

### Change Log

- 2026-03-17: Story 4.2 implementation complete — EmptyState component, FavoritesList screen, FavoritesStack large title navigation, 10 new tests.
- 2026-03-17: Code review fixes — added navigation test (H1), replaced renderItem prop access with fireEvent interaction tests (H2), added accessibilityRole="summary" to EmptyState (L2), added ItemSeparator divider test (M3), fixed Biome lint on empty interface (M1). Test count: 179 + 12 = 191.

### File List

- `src/components/EmptyState.tsx` (NEW) — Reusable empty state component with title + subtitle + accessibilityRole
- `src/components/EmptyState.test.tsx` (NEW) — 3 tests for EmptyState (render, a11y label, a11y role + testID)
- `src/screens/FavoritesList.tsx` (MODIFIED) — Replaced placeholder with full FlatList + EmptyState implementation
- `src/screens/FavoritesList.test.tsx` (NEW) — 9 tests for FavoritesList (empty state, a11y, rendering, favorites, toggle, navigation, filtering, testID, dividers)
- `src/navigation/FavoritesStack.tsx` (MODIFIED) — Large title + consistent header styles
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) — Story status updated
- `_bmad-output/implementation-artifacts/4-2-favorites-list-screen-and-navigation.md` (MODIFIED) — Story file updated
