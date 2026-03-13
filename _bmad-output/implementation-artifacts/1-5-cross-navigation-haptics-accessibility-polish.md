# Story 1.5: Cross-Navigation, Haptics & Accessibility Polish

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to tap any color within a combination to explore its palettes, navigate back through my history, and experience tactile feedback,
so that I can discover unexpected color relationships across Wada's collection with a native feel.

## Acceptance Criteria

1. **Given** a PaletteStrip displays multiple colors, **when** the user taps a color rectangle that is NOT the currently selected color, **then:**
   - The app pushes a new Combinations screen to the navigation stack with the tapped color's ID (FR7)
   - `hapticLight()` fires on the tap (FR38)
   - Each color rectangle has `accessibilityLabel="View combinations for {nameEn}"` and `accessibilityRole="link"` (FR34, FR37)
   - The tapped rectangle shows opacity 0.88 briefly via Pressable feedback before navigation
   - Tapping the currently selected color does nothing (no navigation, no haptic)

2. **Given** the user has navigated via cross-navigation (Color A → Color B), **when** the user performs a native swipe-right gesture or taps the back chevron, **then:**
   - The app pops one level from the navigation stack, returning to Color A's Combinations (FR8)
   - The navigation stack supports unlimited depth (FR42)
   - The back navigation transition uses React Navigation native stack defaults (spring-damped, FR36 respected)

3. **Given** the user is anywhere in the app, **when** they tap the Colors tab in the bottom bar, **then:**
   - The navigation returns to the Color Home root screen (FR41)
   - Navigation between all screens works: Color Home ↔ Combinations (FR40)
   - All transitions complete within 300ms (NFR6)

4. **Given** the iOS Reduce Motion setting is enabled, **when** animations would normally play, **then:**
   - All spring animations across all components are disabled (instant transitions) (FR36, NFR18)
   - Haptic feedback continues to work (tactile, not visual)
   - The PaletteStrip opacity press feedback is skipped (instant navigation)

5. **Given** co-located tests exist for PaletteStrip (updated) and Combinations screen (updated), **when** tests are executed, **then:**
   - Tapping a non-selected color calls `navigation.push("Combinations", { colorId })` and `hapticLight()`
   - Tapping the selected color does NOT trigger navigation or haptics
   - Accessibility labels "View combinations for {nameEn}" present on all color rectangles
   - Reduced motion disables opacity animation
   - `npx tsc --noEmit` passes with zero errors
   - `pnpm lint` passes with zero errors
   - `pnpm test` passes with all tests green

## Tasks / Subtasks

- [x] Task 1: Make PaletteStrip color rectangles tappable with cross-navigation (AC: #1, #4)
  - [x] 1.1 Wrap each color rectangle in `Pressable` with `onPress` handler that calls `hapticLight()` then `navigation.push("Combinations", { colorId: color.id })`
  - [x] 1.2 Skip press handler when `color.id === selectedColorId` (disable Pressable or early-return in handler)
  - [x] 1.3 Add opacity 0.88 press feedback using Pressable's built-in `({ pressed })` style callback (simpler than Reanimated for brief opacity flash)
  - [x] 1.4 Respect `useReducedMotion()` — skip opacity animation when enabled (instant navigation, no visual feedback)
  - [x] 1.5 Add per-color `accessibilityRole="link"` and `accessibilityLabel="View combinations for {nameEn}"` on each Pressable
  - [x] 1.6 Add `testID={`palette-color-${color.id}`}` on each Pressable (moved from inner View to Pressable)

- [x] Task 2: Verify navigation stack behavior (AC: #2, #3)
  - [x] 2.1 Confirm `navigation.push()` (not `navigate()`) creates new stack entries for unlimited depth
  - [x] 2.2 Confirm native swipe-back and back chevron pop correctly (React Navigation native stack default)
  - [x] 2.3 Confirm tapping Colors tab resets stack to ColorHome root (already handled by React Navigation tab behavior)

- [x] Task 3: Update PaletteStrip tests (AC: #5)
  - [x] 3.1 Add test: tapping non-selected color calls `navigation.push("Combinations", { colorId })` — mock `useNavigation` returning `{ push: mockPush }`
  - [x] 3.2 Add test: tapping non-selected color calls `hapticLight()` — mock `@/lib/haptics`
  - [x] 3.3 Add test: tapping selected color does NOT call push or hapticLight
  - [x] 3.4 Add test: each color rectangle has `accessibilityLabel="View combinations for {nameEn}"`
  - [x] 3.5 Add test: reduced motion disables opacity animation — mock `useReducedMotion` returning true

- [x] Task 4: Lint, type-check, tests, and AC verification (AC: all)
  - [x] 4.1 Run `pnpm lint` — fix any Biome issues
  - [x] 4.2 Run `npx tsc --noEmit` — zero type errors
  - [x] 4.3 Run `pnpm test` — all tests green (77/77)
  - [x] 4.4 Point-by-point AC verification of all 5 acceptance criteria

## Dev Notes

### Scope — This Story is Surgical

Story 1.5 modifies **one component** (PaletteStrip) and **updates its tests**. Everything else is already built and working. No new files needed. No new screens. No navigation config changes.

### PaletteStrip — The Only File to Modify

**File:** `src/components/PaletteStrip.tsx` (55 lines currently)

**Current state:** Read-only display — color rectangles are plain `View` components inside a flex-row. No interactivity.

**Required changes:**
1. Add `useNavigation` hook (call before any early returns — Rules of Hooks)
2. Add `useReducedMotion` hook
3. Add Reanimated imports for opacity animation (`useSharedValue`, `withTiming`, `useAnimatedStyle`, `Animated`)
4. Wrap each color rectangle `View` in a `Pressable` → `Animated.View` structure
5. Handler: if `color.id !== selectedColorId` → `hapticLight()` + `navigation.push("Combinations", { colorId: color.id })`
6. Per-color accessibility: `accessibilityRole="link"`, `accessibilityLabel="View combinations for {nameEn}"`

**Navigation type for useNavigation:**
```typescript
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ColorsStackParamList } from "@/navigation/types";

type CombinationsNav = NativeStackNavigationProp<ColorsStackParamList, "Combinations">;
const navigation = useNavigation<CombinationsNav>();
```

**Opacity animation pattern (follows ColorSwatch established pattern):**
```typescript
// Per-color: use Pressable's built-in style callback for simplicity
// OR use Reanimated shared value per the ColorSwatch pattern
// Simplest approach: Pressable style prop with pressed state
<Pressable
  style={({ pressed }) => ({ opacity: pressed && color.id !== selectedColorId && !reducedMotion ? 0.88 : 1 })}
  onPress={() => {
    if (color.id === selectedColorId) return;
    hapticLight();
    navigation.push("Combinations", { colorId: color.id });
  }}
>
```

**Note:** Using Pressable's built-in `({ pressed })` style is simpler than Reanimated for a brief opacity flash and avoids creating shared values per color rectangle. If the team prefers Reanimated for consistency with ColorSwatch, use `withTiming` not `withSpring` (opacity, not scale).

### What NOT to Change — Scope Boundaries

- **Combinations.tsx** — No changes. New Combinations screens are pushed automatically via `navigation.push()`
- **ColorsStack.tsx** — No changes. Stack already supports unlimited depth, native transitions, and back gestures
- **ColorHome.tsx** — No changes. Tab reset to root is handled by React Navigation tab navigator default behavior
- **ColorHeader.tsx** — No changes
- **CombinationList.tsx** — No changes
- **Navigation types** — No changes. `ColorsStackParamList` already has `Combinations: { colorId: string }`
- **haptics.ts** — No changes. Already has `hapticLight()` ready to import
- **useReducedMotion.ts** — No changes. Already implemented and tested

### DO NOT Rules

- Do NOT add heart/favorite icon to PaletteStrip — that's Epic 4
- Do NOT add hanger/visualizer icon to PaletteStrip — that's Epic 2
- Do NOT use `navigation.navigate()` — use `navigation.push()` to allow stacking multiple Combinations screens
- Do NOT use `StyleSheet.create` — NativeWind className only (except dynamic hex colors via `style={{}}`)
- Do NOT import expo-haptics directly — use `hapticLight()` from `@/lib/haptics`
- Do NOT use `export default`
- Do NOT call hooks after early returns
- Do NOT add loading states — data is bundled and synchronous
- Do NOT add `onColorTap` prop to PaletteStrip — navigation is handled internally (PaletteStrip owns this interaction)

### Data Access — Already Built

```typescript
import { getColor, getCombinations } from "@/data/colorIndex";
// O(1) lookups, pure functions, no hooks needed
```

### Testing Strategy

**File to update:** `src/components/PaletteStrip.test.tsx` (8 existing tests)

**New mocks needed:**
```typescript
// Mock navigation
const mockPush = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: mockPush }),
}));

// Mock haptics (pattern from SwatchGroupTabs.test.tsx)
jest.mock("@/lib/haptics");

// Mock useReducedMotion (pattern from ColorSwatch.test.tsx)
jest.mock("@/hooks/useReducedMotion");
const mockUseReducedMotion = useReducedMotion as jest.Mock;
```

**Test cases to add (~5 tests):**
1. Press non-selected color → `mockPush("Combinations", { colorId: color.id })` called
2. Press non-selected color → `hapticLight()` called
3. Press selected color → `mockPush` NOT called, `hapticLight` NOT called
4. Each color has `accessibilityLabel="View combinations for {nameEn}"`
5. Reduced motion enabled → opacity animation skipped (if using Reanimated; if using Pressable built-in, this test may be simplified to checking the style callback)

**Existing test patterns to follow:**
- `fireEvent.press(screen.getByTestId("palette-color-{id}"))` for tapping
- `screen.getByLabelText("View combinations for {nameEn}")` for accessibility
- `beforeEach(() => { mockPush.mockClear(); })` for clean state

### Previous Story Intelligence (from Story 1.4)

**Key learnings:**
- Biome formatting: tabs + double quotes. Follow this convention
- `headerBackTitleVisible` doesn't exist in React Navigation 7 — use `headerBackTitle: ""`
- FlatList virtualizes rendering — test with data prop, not full count assertions
- Reanimated mock already exists at `__mocks__/react-native-reanimated.js`
- Code review found: duplicate tests, weak assertions, spacing math errors. Write distinct, meaningful test assertions from the start

**Files created in Story 1.4 (now available):**
- `src/components/PaletteStrip.tsx` — the file to modify
- `src/components/PaletteStrip.test.tsx` — the test file to update
- `src/components/ColorHeader.tsx`, `CombinationList.tsx` — not touched in this story
- `src/screens/Combinations.tsx` — not touched in this story

### Git Intelligence

**Branch pattern:** Create `story-1.5-cross-navigation-haptics-accessibility-polish` off `epic-1`
**Commit pattern:** `feat: <description> (Story 1.5)`
**Recent commits show:** flat branch naming (not hierarchical), code review fixes as separate `fix:` commits

### UX Spec Clarification

The UX spec lists `accessibilityRole="link"` for color rectangles (not "button"), because tapping navigates to another screen — semantically a link. Follow the UX spec: use `"link"`.

### Project Structure Notes

After this story, modified files:
```
src/
├── components/
│   ├── PaletteStrip.tsx          (MODIFIED — add Pressable, navigation, haptics, a11y)
│   └── PaletteStrip.test.tsx     (MODIFIED — add ~5 navigation/haptics/a11y tests)
```

No new files. No other modifications.

### References

- [Source: docs/planning/epics.md#Story 1.5: Cross-Navigation, Haptics & Accessibility Polish]
- [Source: docs/planning/epics.md#Story 1.4: Combinations Screen] (for scope boundary awareness)
- [Source: docs/planning/ux-design-specification-ios.md#PaletteStrip Component] (opacity 0.88, accessibilityRole="link")
- [Source: docs/planning/architecture-react-native-ios.md#Data Access Patterns]
- [Source: docs/planning/architecture-react-native-ios.md#Component Patterns]
- [Source: docs/planning/architecture-react-native-ios.md#Routing — ColorsStack]
- [Source: _bmad-output/implementation-artifacts/1-4-combinations-screen.md#Dev Notes]
- [Source: src/components/ColorSwatch.tsx] (reference for Pressable + animation + haptics pattern)
- [Source: src/screens/ColorHome.tsx] (reference for navigation.push pattern)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- Used Pressable's built-in `({ pressed })` style callback for opacity 0.88 feedback instead of Reanimated. This is simpler and avoids creating shared values per color rectangle (as suggested in Dev Notes).
- Added `useNavigation` and `useReducedMotion` hooks to PaletteStrip — called before any early returns per Rules of Hooks.
- Had to add `useNavigation` and `useReducedMotion` mocks to `Combinations.test.tsx` and `CombinationList.test.tsx` since PaletteStrip (rendered as child) now requires these hooks.
- All 5 new tests pass: navigation push, hapticLight, selected-no-op, accessibility labels, reduced motion.
- All 77 tests green, lint clean, type check clean.

### Change Log

- 2026-03-13: Story 1.5 implementation complete — cross-navigation, haptics, accessibility polish on PaletteStrip
- 2026-03-13: Code review fixes — disabled selected color Pressable for VoiceOver, added accessibilityRole test, improved reduced motion test, updated File List

### File List

- src/components/PaletteStrip.tsx (MODIFIED — added Pressable, useNavigation, useReducedMotion, hapticLight, a11y labels, disabled selected color)
- src/components/PaletteStrip.test.tsx (MODIFIED — added 7 new tests for navigation, haptics, a11y role, a11y labels, disabled selected, reduced motion opacity)
- src/screens/Combinations.test.tsx (MODIFIED — added useNavigation and useReducedMotion mocks for PaletteStrip child)
- src/components/CombinationList.test.tsx (MODIFIED — added useNavigation and useReducedMotion mocks for PaletteStrip child)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED — status updated to review)
