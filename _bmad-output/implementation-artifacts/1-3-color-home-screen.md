# Story 1.3: Color Home Screen

Status: done

## Story

As a user,
I want to see all 159 Wada colors organized by family in a beautiful grid with tab filtering,
so that I can quickly find the color closest to my garment.

## Acceptance Criteria

1. **Given** the user opens the app (Colors tab active), **when** the ColorHome screen renders, **then:**
   - A large title navigation bar displays "配色辞典" (or "Outfinder")
   - The large title collapses to inline on scroll (iOS native behavior)
   - Horizontal SwatchGroupTabs are shown (All + 6 family tabs)
   - The "All" tab is active by default showing all 159 colors grouped by family
   - The grid renders within 500ms (NFR1)
   - The background is --bg-paper (#fafaf8)

2. **Given** the color grid is displayed, **when** the user views the SwatchGroup component, **then:**
   - Colors are rendered in a 5-column layout via FlatList with 4px gap
   - Each ColorSwatch is 62×62px with 4px border-radius (exceeds 44px minimum, FR35)
   - Each swatch displays the color using `style={{ backgroundColor: color.hex }}` with Wada's original hex values
   - Each swatch has `accessibilityLabel="{nameEn}, {combinationCount} combinations"` and `accessibilityRole="button"` (FR34, FR37, NFR14)
   - Color names are always available via VoiceOver — color never conveyed by color alone (NFR19)

3. **Given** the user taps a swatch-group tab, **when** tab selection changes, **then:**
   - The grid instantly filters to show only colors in that family
   - The active tab shows --tab-active indicator, inactive tabs show --tab-inactive
   - hapticLight() fires on tab switch (FR38)
   - Each tab has `accessibilityRole="tab"` and `accessibilityState={{ selected }}` (FR34)

4. **Given** a color swatch is tapped, **when** the tap is registered, **then:**
   - hapticLight() fires (FR38)
   - The swatch shows a spring scale animation to 1.05x (Reanimated, 150ms) as visual feedback
   - The app navigates (push) to the Combinations screen with colorId as route param (FR3)
   - If Reduce Motion is enabled, the scale animation is skipped (instant transition, FR36, NFR18)

5. **Given** co-located tests exist for ColorSwatch, SwatchGroup, SwatchGroupTabs, and ColorHome, **when** tests are executed, **then:**
   - Grid renders correct number of colors per group
   - Tab filtering works
   - Color selection triggers navigation
   - Accessibility labels are present on all interactive elements

## Tasks / Subtasks

- [x] Task 1: Create useReducedMotion hook (AC: #4)
  - [x] 1.1 Create `src/hooks/useReducedMotion.ts` — uses `AccessibilityInfo.isReduceMotionEnabled()` + listener for changes
  - [x] 1.2 Create `src/hooks/useReducedMotion.test.ts` — tests initial value and listener cleanup

- [x] Task 2: Create ColorSwatch component (AC: #2, #4)
  - [x] 2.1 Create `src/components/ColorSwatch.tsx` — 62×62px Pressable with dynamic `style={{ backgroundColor: color.hex }}`, 4px border-radius via `className="rounded"`, accessibilityLabel/Role, spring scale animation (Reanimated useAnimatedStyle + withSpring), Reduce Motion check via useReducedMotion
  - [x] 2.2 Create `src/components/ColorSwatch.test.tsx` — renders with correct color, fires onPress, has accessibilityLabel with nameEn + combinationCount, has accessibilityRole="button", has testID

- [x] Task 3: Create SwatchGroupTabs and SwatchGroup components (AC: #1, #2, #3)
  - [x] 3.1 Create `src/components/SwatchGroupTabs.tsx` — horizontal ScrollView with 7 tab Pressables (All + 6 families), active/inactive styling with --tab-active/--tab-inactive tokens, accessibilityRole="tab" + accessibilityState={{ selected }}, hapticLight() on tap
  - [x] 3.2 Create `src/components/SwatchGroup.tsx` — FlatList with `numColumns={5}`, renders ColorSwatch items, 4px columnWrapperStyle gap, receives filtered Color[] based on active tab
  - [x] 3.3 Create `src/components/SwatchGroupTabs.test.tsx` — renders 7 tabs, active tab has selected state, tap fires onTabChange + hapticLight
  - [x] 3.4 Create `src/components/SwatchGroup.test.tsx` — renders correct number of swatches, uses FlatList with 5 columns

- [x] Task 4: Implement ColorHome screen (AC: #1, #3, #4)
  - [x] 4.1 Replace placeholder `src/screens/ColorHome.tsx` — large title nav bar "配色辞典", SwatchGroupTabs + SwatchGroup, state for activeGroup (default "all"), filters colors via getColorsByGroup/getAllColors from colorIndex.ts, onColorSelect navigates push to Combinations with colorId
  - [x] 4.2 Update `src/navigation/ColorsStack.tsx` — configure ColorHome with `headerLargeTitle: true`, large title style with Noto Serif JP font, --nav-bar-bg background
  - [x] 4.3 Create `src/screens/ColorHome.test.tsx` — renders grid with all 159 colors by default, tab filter reduces visible colors, color tap triggers navigation.push with colorId, all accessibility labels present

- [x] Task 5: Lint, type-check, tests, and AC verification (AC: all)
  - [x] 5.1 Run `pnpm lint` — fix any Biome issues
  - [x] 5.2 Run `npx tsc --noEmit` — zero type errors
  - [x] 5.3 Run `pnpm test` — all tests green
  - [x] 5.4 Point-by-point AC verification of all 5 acceptance criteria

## Dev Notes

### Component Architecture

```
ColorHome (screen)
├── SwatchGroupTabs (component — horizontal tab bar)
│   └── Pressable × 7 (All + 6 families)
└── SwatchGroup (component — FlatList grid)
    └── ColorSwatch × N (component — 62×62px pressables)
```

### ColorSwatch Animation Pattern

Use Reanimated `useSharedValue` + `useAnimatedStyle` + `withSpring` for the press scale animation. The animation must check `useReducedMotion()` — if true, skip animation entirely.

```typescript
// Pattern for ColorSwatch press animation
const scale = useSharedValue(1);
const reducedMotion = useReducedMotion();

function handlePressIn() {
  if (!reducedMotion) {
    scale.value = withSpring(1.05, { damping: 15, stiffness: 150 });
  }
}

function handlePressOut() {
  if (!reducedMotion) {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }
}

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));
```

**IMPORTANT:** Wrap the ColorSwatch inner View with `Animated.View` from Reanimated (not from react-native). The outer `Pressable` handles touch events, the inner `Animated.View` handles the scale transform.

### useReducedMotion Hook

```typescript
// src/hooks/useReducedMotion.ts
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => subscription.remove();
  }, []);

  return reducedMotion;
}
```

**Note:** Reanimated also exports `useReducedMotion()` — do NOT use it. Our custom hook is preferred because it integrates with React state and can be used in non-animated contexts. Name the file `useReducedMotion.ts` to match the hook convention.

**UPDATE:** Actually check if `react-native-reanimated` v4.2.2 provides `useReducedMotion()`. If it does and works correctly with `AccessibilityInfo`, you MAY use it instead of a custom hook — but verify it returns a boolean (not a shared value) usable in conditional JS logic. If it returns a SharedValue, use the custom hook above.

### SwatchGroupTabs Implementation

- Horizontal `ScrollView` (not FlatList — only 7 items, no virtualization needed)
- `showsHorizontalScrollIndicator={false}`
- Tab labels: "All", then 6 family names from swatch groups 0-5
- Swatch group names: Use descriptive names. The swatch groups (0-5) map to color families in the Wada dataset. Check `colors.json` for how colors are distributed across groups.
- Active tab: `text-text-primary font-sans-medium` + 2px bottom border `border-b-2 border-tab-active`
- Inactive tab: `text-tab-inactive font-sans`
- Container: `accessibilityRole="tablist"` (if supported by RN, otherwise omit)
- Each Pressable: `accessibilityRole="tab"`, `accessibilityState={{ selected: isActive }}`
- Tab Pressable minimum height 44px (touch target)

### SwatchGroup FlatList Configuration

```typescript
<FlatList
  data={filteredColors}
  numColumns={5}
  keyExtractor={(item) => item.id}
  columnWrapperStyle={{ gap: 4 }}
  contentContainerStyle={{ gap: 4, padding: 16 }}
  renderItem={({ item }) => (
    <ColorSwatch color={item} onPress={handleColorPress} />
  )}
/>
```

**IMPORTANT:** FlatList with `numColumns` requires a fixed column count — no dynamic columns. Each ColorSwatch must have a fixed width of 62px. The remaining space becomes margins.

### Large Title Navigation Configuration

Configure in `ColorsStack.tsx` screen options for ColorHome:

```typescript
<Stack.Screen
  name="ColorHome"
  component={ColorHome}
  options={{
    title: "配色辞典",
    headerLargeTitle: true,
    headerLargeStyle: { backgroundColor: wadaTokens.navBarBg },
    headerStyle: { backgroundColor: wadaTokens.navBarBg },
    headerTintColor: wadaTokens.textPrimary,
    headerLargeTitleStyle: {
      fontFamily: "NotoSerifJP_500Medium",
    },
  }}
/>
```

**Note:** `headerLargeTitle` is an iOS-only feature in React Navigation native stack. It works automatically — large title collapses to inline on scroll when the screen content is inside a ScrollView or FlatList. No extra setup needed.

### Data Access — No Hooks for Static Data

Import pure functions directly from `colorIndex.ts`:

```typescript
import { getAllColors, getColorsByGroup } from "@/data/colorIndex";
import type { Color, SwatchGroup } from "@/data/types";

// In ColorHome component:
const colors = activeGroup === "all"
  ? getAllColors()
  : getColorsByGroup(activeGroup as SwatchGroup);
```

**DO NOT** create a useColors hook or any React wrapper around static data. The data layer is pure functions with O(1) lookups — no state, no effects, no loading.

### Navigation from ColorHome to Combinations

Use React Navigation's typed navigation:

```typescript
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { ColorsStackParamList } from "@/navigation/types";

type ColorHomeNav = NativeStackNavigationProp<ColorsStackParamList, "ColorHome">;

// In component:
const navigation = useNavigation<ColorHomeNav>();

function handleColorPress(color: Color) {
  hapticLight();
  navigation.push("Combinations", { colorId: color.id });
}
```

### Swatch Group Family Names

The 6 swatch groups (0-5) need display labels for the tabs. Define these as a constant:

```typescript
const SWATCH_GROUP_LABELS: Record<SwatchGroup, string> = {
  0: "Red-Orange",
  1: "Yellow-Green",
  2: "Green-Blue",
  3: "Blue-Purple",
  4: "Purple-Pink",
  5: "Neutral",
};
```

**IMPORTANT:** Verify actual group distribution in `colors.json`. The labels above are placeholders — check the data and assign meaningful English names that describe the color family in each group. If the data doesn't have family names, derive them from the most common colors in each group.

### Testing Strategy

**Mocking considerations:**
- Mock `@react-navigation/native` for navigation tests (useNavigation)
- Mock `@/lib/haptics` to verify hapticLight() calls
- Mock `react-native-reanimated` — use `jest-expo` preset which includes Reanimated mock
- Mock `AccessibilityInfo` for useReducedMotion tests
- Use actual data from `colorIndex.ts` — no need to mock static data (it's fast and deterministic)

**Test patterns:**
```typescript
// ColorHome.test.tsx
jest.mock("@/lib/haptics");
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: mockPush }),
}));

// Verify grid renders all 159 colors
const swatches = screen.getAllByRole("button");
expect(swatches.length).toBe(159);

// Verify tab filtering
fireEvent.press(screen.getByText("Red-Orange"));
// After filter, fewer swatches visible
```

### Pale Swatch Border

Swatches lighter than `#e0e0e0` need a subtle 1px border for contrast against the --bg-paper background:

```typescript
// In ColorSwatch — determine if color needs border
const needsBorder = isLightColor(color.hex);

// Simple lightness check
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance > 224; // ~#e0e0e0 threshold
}
```

Apply border conditionally: `className={needsBorder ? "border border-hairline" : ""}` combined with the base classes.

### Previous Story Intelligence (from Story 1.2)

**Key learnings to apply:**
- **Git branch naming:** Use flat branch names — `story-1.3-color-home-screen` off `epic-1` (not hierarchical `epic-1/story-1.3`)
- **Biome formatting:** Files auto-formatted with tabs and double quotes. Follow this convention.
- **Props pattern:** Story 1.2 used `type Props = Record<string, never>` for empty props (Biome enforces this over empty interfaces)
- **expo-symbols works:** Tab icons use `SymbolView` from `expo-symbols` — confirmed working in tab bar context
- **colorIndex patterns established:** Import functions directly, no hooks needed for static data
- **haptics.ts pattern:** Synchronous function calls with internal `.catch()` — call as `hapticLight()` (not await)

### DO NOT Rules

- ❌ Do NOT use `export default` on any component
- ❌ Do NOT use `StyleSheet.create` — NativeWind className only
- ❌ Do NOT import expo-haptics directly — use `hapticLight()` from `@/lib/haptics`
- ❌ Do NOT create loading states — data is bundled and synchronous
- ❌ Do NOT create a useColors hook — import pure functions from colorIndex
- ❌ Do NOT use FlatList for tabs (only 7 items — use ScrollView)
- ❌ Do NOT add FavoriteButton to PaletteStrips yet (that's Epic 4)
- ❌ Do NOT implement the Combinations screen content (that's Story 1.4)
- ❌ Do NOT call hooks after early returns
- ❌ Do NOT add dynamic column count — FlatList numColumns must be static (5)

### Project Structure Notes

After this story, new/modified files:
```
src/
├── components/
│   ├── ColorSwatch.tsx          (NEW)
│   ├── ColorSwatch.test.tsx     (NEW)
│   ├── SwatchGroup.tsx          (NEW)
│   ├── SwatchGroup.test.tsx     (NEW)
│   ├── SwatchGroupTabs.tsx      (NEW)
│   └── SwatchGroupTabs.test.tsx (NEW)
├── hooks/
│   ├── useReducedMotion.ts      (NEW)
│   └── useReducedMotion.test.ts (NEW)
├── navigation/
│   └── ColorsStack.tsx          (MODIFIED — large title config)
└── screens/
    ├── ColorHome.tsx            (MODIFIED — replace placeholder)
    └── ColorHome.test.tsx       (NEW)
```

### References

- [Source: docs/planning/epics.md#Story 1.3: Color Home Screen]
- [Source: docs/planning/architecture-react-native-ios.md#Component Pattern]
- [Source: docs/planning/architecture-react-native-ios.md#Data Access Pattern]
- [Source: docs/planning/architecture-react-native-ios.md#Haptic Feedback]
- [Source: docs/planning/architecture-react-native-ios.md#Performance Budget]
- [Source: docs/planning/ux-design-specification-ios.md#Color Home Screen]
- [Source: docs/planning/ux-design-specification-ios.md#SwatchGroupTabs]
- [Source: docs/planning/ux-design-specification-ios.md#ColorSwatch Component]
- [Source: docs/planning/ux-design-specification-ios.md#Typography Scale]
- [Source: docs/planning/ux-design-specification-ios.md#Accessibility Patterns]
- [Source: docs/planning/ux-design-specification-ios.md#Animation Parameters]
- [Source: _bmad-output/implementation-artifacts/1-2-data-layer-navigation-shell.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Reanimated v4 requires manual Jest mock (`__mocks__/react-native-reanimated.js`) because built-in mock imports native modules
- FlatList virtualizes rendering in tests — cannot assert exact item count for 159 items, adjusted test to verify presence of initial items

### Completion Notes List

- Task 1: Created `useReducedMotion` hook using `AccessibilityInfo.isReduceMotionEnabled()` + listener. 5 tests covering initial value, dynamic changes, subscription, and cleanup.
- Task 2: Created `ColorSwatch` component — 62×62px Pressable with Reanimated spring scale animation (1.05x), reduce motion support, pale swatch border detection via luminance check. 5 tests.
- Task 3: Created `SwatchGroupTabs` (horizontal ScrollView, 7 tabs, hapticLight, accessibility) and `SwatchGroup` (FlatList, 5 columns, 4px gap). 8 tests total.
- Task 4: Replaced placeholder `ColorHome` with full implementation — tab filtering via `getColorsByGroup`/`getAllColors`, navigation push to Combinations, hapticLight on press. Updated `ColorsStack` with large title "配色辞典" and Noto Serif JP font. 5 tests.
- Task 5: Zero lint errors, zero type errors, 43 tests all green. All 5 ACs verified point-by-point.
- Swatch group labels derived from actual color data: Pale & Light, Red & Brown, Blue & Lavender, Dark & Deep, Vivid & Bold, Green & Olive.

### Code Review 2 — Fixes Applied

- **M1. Fixed no-op animation test** — `ColorSwatch.test.tsx` now spies on `withSpring` and asserts it was called with `(1.05, { damping: 15, stiffness: 150 })`.
- **M2. Added `accessibilityRole="tablist"`** to `SwatchGroupTabs.tsx` ScrollView container for VoiceOver tab group identification.
- **M3. Added round-trip filter test** — `ColorHome.test.tsx` now verifies All → filter → All restores full 159-color dataset.
- **L1. Removed unnecessary `jest.mock("@/lib/haptics")`** from `ColorSwatch.test.tsx` (component doesn't import haptics).

### Remaining LOW Severity Issues (Documented)

- **L1. `SwatchGroupTabsProps` uses `string` instead of `TabKey` type** — `activeGroup: string` and `onTabChange: (group: string) => void` should use the discriminated `TabKey` type already defined in the file. Minor type safety gap.
- **L2. Reanimated mock `createAnimatedComponent` uses identity function** — works for current tests but could break if Reanimated-specific animated props are used in the future.
- **L3. `isLightColor` is not exported or unit tested** — luminance threshold (224) matches ~#e0e0e0 intent but has no direct test coverage for boundary values.

### Change Log

- 2026-03-12: Story 1.3 implementation complete — Color Home screen with tab filtering, animated swatches, haptics, accessibility, and full test coverage.
- 2026-03-12: Code review fixes — added testID to SwatchGroupTabs tabs (H1), improved ColorHome test to verify full 159-color data pass-through via FlatList data prop (M1), added numColumns=5 test to SwatchGroup (M2), added reduced motion integration tests to ColorSwatch (M3). 46 tests, zero lint/type errors.
- 2026-03-13: Code review 2 fixes — fixed no-op animation test with withSpring spy (M1), added accessibilityRole="tablist" to SwatchGroupTabs (M2), added round-trip All→filter→All test (M3), removed unnecessary haptics mock from ColorSwatch tests (L1). 47 tests, zero lint/type errors.

### File List

New files:
- `src/hooks/useReducedMotion.ts`
- `src/hooks/useReducedMotion.test.ts`
- `src/components/ColorSwatch.tsx`
- `src/components/ColorSwatch.test.tsx`
- `src/components/SwatchGroupTabs.tsx`
- `src/components/SwatchGroupTabs.test.tsx`
- `src/components/SwatchGroup.tsx`
- `src/components/SwatchGroup.test.tsx`
- `src/screens/ColorHome.test.tsx`
- `__mocks__/react-native-reanimated.js`

Modified files:
- `src/screens/ColorHome.tsx` (replaced placeholder)
- `src/navigation/ColorsStack.tsx` (large title config)
