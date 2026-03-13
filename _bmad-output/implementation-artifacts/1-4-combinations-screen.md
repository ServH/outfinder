# Story 1.4: Combinations Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see all Wada palettes containing my selected color as beautiful floating strips with Japanese and English names,
so that I can discover harmonious color combinations for my wardrobe.

## Acceptance Criteria

1. **Given** the user navigates to the Combinations screen with a colorId param, **when** the screen renders, **then:**
   - An inline navigation bar displays: back chevron (native swipe-back enabled), color preview swatch (40×40px, 8px radius), Japanese name (Noto Serif JP), and English name (Inter, --text-secondary)
   - The combination count is displayed right-aligned (e.g., "8 combinations", Inter, 12px, --text-tertiary) (NFR19)
   - The ColorHeader has `accessibilityLabel="{nameEn}, {count} combinations"` (FR34)
   - Background is --bg-paper (#fafaf8)

2. **Given** the Combinations screen is loaded, **when** the CombinationList renders, **then:**
   - All Wada palettes containing the selected color are displayed as PaletteStrip components in a vertical FlatList
   - Combinations are separated by 24px spacing and 1px --divider-color lines
   - No card containers — strips float directly on --bg-paper background
   - Palette lookup completes within 300ms (NFR2)

3. **Given** a PaletteStrip is displayed, **when** the user views a combination, **then:**
   - 2-4 color rectangles are shown side by side (flex: 1, height 120px) with 0.5px --hairline-color dividers between them (FR5)
   - The container has 8px border-radius on outer edges only
   - A white 6px dot appears at the bottom-center of the selected color's rectangle
   - Below each color rectangle: Japanese name (Noto Serif JP, 11px) and English name (Inter, 10px) are displayed (FR6)
   - Each PaletteStrip has `accessibilityLabel="Combination: {color names joined}"` (FR34, FR37)

4. **Given** the selected color has only 1-2 combinations (edge case), **when** the Combinations screen renders, **then:**
   - The available combinations are displayed normally without any error or empty state
   - The ColorHeader shows the accurate count

5. **Given** co-located tests exist for ColorHeader, PaletteStrip, CombinationList, and Combinations screen, **when** tests are executed, **then:**
   - Components render correctly for 2, 3, and 4 color combinations
   - Selected color dot appears on correct rectangle
   - Edge cases (1-2 combinations) render gracefully
   - All accessibility labels are present

## Tasks / Subtasks

- [x] Task 1: Create ColorHeader component (AC: #1)
  - [x] 1.1 Create `src/components/ColorHeader.tsx` — color preview swatch (40×40px, 8px radius), Japanese name (Noto Serif JP, 18px), English name (Inter, 12px, --text-secondary), combination count right-aligned (Inter, 12px, --text-tertiary). Props: `color: Color`, `combinationCount: number`. `accessibilityLabel="{nameEn}, {count} combinations"`
  - [x] 1.2 Create `src/components/ColorHeader.test.tsx` — renders color name, combination count, accessibility label, correct swatch color

- [x] Task 2: Create PaletteStrip component (AC: #3)
  - [x] 2.1 Create `src/components/PaletteStrip.tsx` — flex-row of 2-4 color rectangles (flex: 1, height 120px), 0.5px hairline dividers, 8px border-radius on outer container, white 6px dot on selected color rectangle, JP name (Noto Serif JP, 11px) + EN name (Inter, 10px) below each rectangle. Props: `combination: Combination`, `selectedColorId: string`. `accessibilityLabel="Combination: {color names joined}"`
  - [x] 2.2 Create `src/components/PaletteStrip.test.tsx` — renders correct number of color rectangles for 2/3/4 color combinations, selected dot on correct color, color names displayed, accessibility label present

- [x] Task 3: Create CombinationList and Combinations screen (AC: #1, #2, #4)
  - [x] 3.1 Create `src/components/CombinationList.tsx` — FlatList of PaletteStrip components, 24px spacing + 1px divider between items, no card wrappers. Props: `combinations: Combination[]`, `selectedColorId: string`
  - [x] 3.2 Replace placeholder `src/screens/Combinations.tsx` — reads colorId from route.params, calls `getColor(colorId)` and `getCombinations(colorId)`, renders ColorHeader + CombinationList, --bg-paper background
  - [x] 3.3 Update `src/navigation/ColorsStack.tsx` — configure Combinations screen with custom header using ColorHeader component (inline nav bar with color preview + names)
  - [x] 3.4 Create `src/components/CombinationList.test.tsx` — renders PaletteStrips, dividers present, edge case with 1-2 combinations
  - [x] 3.5 Create `src/screens/Combinations.test.tsx` — renders ColorHeader with correct color, renders CombinationList with combinations for selected color, accessibility labels present

- [x] Task 4: Lint, type-check, tests, and AC verification (AC: all)
  - [x] 4.1 Run `pnpm lint` — fix any Biome issues
  - [x] 4.2 Run `npx tsc --noEmit` — zero type errors
  - [x] 4.3 Run `pnpm test` — all tests green
  - [x] 4.4 Point-by-point AC verification of all 5 acceptance criteria

## Dev Notes

### Component Architecture

```
Combinations (screen)
├── ColorHeader (component — integrated in nav bar or screen top)
│   ├── Color preview swatch (40×40px)
│   ├── JP name + EN name
│   └── Combination count
└── CombinationList (component — FlatList)
    └── PaletteStrip × N (component — color rectangles)
        ├── Color rectangles (2-4, flex: 1, 120px)
        ├── Selected color dot (white, 6px)
        └── Color labels (JP + EN per rectangle)
```

### ColorHeader Implementation

Integrated as a custom header within the screen content (NOT in React Navigation's header bar — the nav bar stays inline with back chevron only).

```typescript
interface ColorHeaderProps {
  color: Color;
  combinationCount: number;
}

export function ColorHeader({ color, combinationCount }: ColorHeaderProps) {
  return (
    <View
      className="flex-row items-center px-4 py-3"
      accessibilityLabel={`${color.nameEn}, ${combinationCount} combinations`}
    >
      <View
        className="h-[40px] w-[40px] rounded-lg mr-3"
        style={{ backgroundColor: color.hex }}
      />
      <View className="flex-1">
        <Text className="font-serif-jp text-lg text-text-primary">{color.nameJp}</Text>
        <Text className="font-sans text-xs text-text-secondary">{color.nameEn}</Text>
      </View>
      <Text className="font-sans text-xs text-text-tertiary">
        {combinationCount} combinations
      </Text>
    </View>
  );
}
```

### PaletteStrip Implementation

```typescript
interface PaletteStripProps {
  combination: Combination;
  selectedColorId: string;
}

export function PaletteStrip({ combination, selectedColorId }: PaletteStripProps) {
  // Render 2-4 color rectangles in a row
  // Each rectangle: flex: 1, height 120px
  // 0.5px hairline divider between rectangles
  // 8px border-radius on outer container ONLY (overflow: "hidden")
  // White 6px dot at bottom-center of selected color's rectangle
  // Below rectangles: JP name (11px) + EN name (10px) per color
}
```

**Selected Color Dot:** The white dot uses absolute positioning within each color rectangle:
```typescript
{color.id === selectedColorId && (
  <View
    className="absolute bottom-2 self-center h-[6px] w-[6px] rounded-full bg-white"
  />
)}
```

**Outer Border Radius:** Use `overflow: "hidden"` on the container View with `rounded-lg` (8px) so inner rectangles are clipped to rounded corners.

**Hairline Dividers:** Between rectangles, use a 0.5px wide View with `bg-hairline`:
```typescript
// Between each color rectangle
<View className="w-[0.5px] bg-hairline" />
```

**Color Names Below Rectangles:** Each color gets a label column aligned below its rectangle:
```typescript
<View className="flex-row mt-2">
  {combination.colors.map(color => (
    <View key={color.id} className="flex-1 items-center">
      <Text className="font-serif-jp text-[11px] text-text-primary">{color.nameJp}</Text>
      <Text className="font-sans text-[10px] text-text-secondary">{color.nameEn}</Text>
    </View>
  ))}
</View>
```

### CombinationList Implementation

```typescript
interface CombinationListProps {
  combinations: Combination[];
  selectedColorId: string;
}

export function CombinationList({ combinations, selectedColorId }: CombinationListProps) {
  return (
    <FlatList
      data={combinations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => (
        <View className="my-6">
          <View className="h-[1px] bg-divider" />
        </View>
      )}
      renderItem={({ item }) => (
        <PaletteStrip combination={item} selectedColorId={selectedColorId} />
      )}
    />
  );
}
```

**IMPORTANT:** `my-6` = 24px margin top+bottom on the separator. Combined with the 1px divider line, this creates the 24px spacing + divider specified in AC #2.

### Combinations Screen Implementation

```typescript
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ColorsStackParamList } from "@/navigation/types";

type CombinationsProps = NativeStackScreenProps<ColorsStackParamList, "Combinations">;

export function Combinations({ route }: CombinationsProps) {
  const { colorId } = route.params;
  const color = getColor(colorId);
  const combinations = getCombinations(colorId);

  // Guard: if color not found (shouldn't happen with static data)
  if (!color) {
    return null;
  }

  return (
    <View className="flex-1 bg-bg-paper">
      <ColorHeader color={color} combinationCount={combinations.length} />
      <CombinationList combinations={combinations} selectedColorId={colorId} />
    </View>
  );
}
```

### Navigation Configuration

Update `ColorsStack.tsx` for the Combinations screen:

```typescript
<Stack.Screen
  name="Combinations"
  component={Combinations}
  options={{
    headerStyle: { backgroundColor: wadaTokens.navBarBg },
    headerTintColor: wadaTokens.textPrimary,
    headerTitle: "", // Empty — ColorHeader handles display
    headerBackTitleVisible: false,
  }}
/>
```

The ColorHeader is rendered as screen content (NOT as a custom header component), so it appears below the inline nav bar. The nav bar has only the back chevron + empty title.

### Scope Boundaries — DO NOT Rules

- ❌ Do NOT add cross-navigation (tapping colors in PaletteStrip) — that's Story 1.5
- ❌ Do NOT add FavoriteButton (heart icon) to PaletteStrip — that's Epic 4
- ❌ Do NOT add Outfit Visualizer button (hanger icon) to PaletteStrip — that's Epic 2
- ❌ Do NOT make color rectangles in PaletteStrip tappable/pressable — that's Story 1.5
- ❌ Do NOT use `export default` on any component
- ❌ Do NOT use `StyleSheet.create` — NativeWind className only (except dynamic Wada hex colors)
- ❌ Do NOT import expo-haptics directly — use `hapticLight()` from `@/lib/haptics` (no haptics needed in this story — haptics are added in Story 1.5 for cross-navigation)
- ❌ Do NOT create loading states — data is bundled and synchronous
- ❌ Do NOT create hooks for data access — import pure functions from `@/data/colorIndex`
- ❌ Do NOT call hooks after early returns

### Data Access — Pure Functions, No Hooks

```typescript
import { getColor, getCombinations } from "@/data/colorIndex";
import type { Color, Combination } from "@/data/types";

// In Combinations screen:
const color = getColor(colorId);        // O(1) lookup
const combinations = getCombinations(colorId);  // O(1) lookup
```

The data layer is already built (Story 1.2). `getCombinations()` returns `Combination[]` where each Combination has `{ id, colors: Color[], nameJp, nameEn }`. Colors is already resolved (not just IDs) — ready to render.

### Testing Strategy

**Mocking considerations:**
- Mock `@react-navigation/native` for route.params access
- Use actual data from `colorIndex.ts` — no need to mock static data
- Test with real color/combination data for realistic assertions
- Reanimated mock already exists at `__mocks__/react-native-reanimated.js`

**Test patterns:**
```typescript
// Combinations.test.tsx
const mockRoute = {
  params: { colorId: "some-real-color-id" },
};
jest.mock("@react-navigation/native", () => ({
  useRoute: () => mockRoute,
}));

// PaletteStrip.test.tsx — test with 2, 3, and 4 color combinations
const twoColorCombo: Combination = { id: "c1", colors: [color1, color2], nameJp: "...", nameEn: "..." };
const threeColorCombo: Combination = { id: "c2", colors: [color1, color2, color3], nameJp: "...", nameEn: "..." };
const fourColorCombo: Combination = { id: "c3", colors: [color1, color2, color3, color4], nameJp: "...", nameEn: "..." };
```

### Previous Story Intelligence (from Story 1.3)

**Key learnings to apply:**
- **Biome formatting:** Tabs and double quotes. Follow this convention.
- **Props pattern:** Use `type Props = Record<string, never>` for empty props; use `interface XProps` for actual props.
- **colorIndex patterns:** Import `getColor`, `getCombinations` directly — no hooks needed.
- **haptics.ts pattern:** Synchronous calls with internal `.catch()`. No haptics needed in this story.
- **NativeWind className for static styles**, `style={{}}` only for dynamic Wada hex values.
- **Reanimated mock:** Already exists at `__mocks__/react-native-reanimated.js` — no setup needed.
- **FlatList testing:** FlatList virtualizes rendering — test with data prop or initial items, not full count assertions.
- **accessibilityRole="tablist"** was added to SwatchGroupTabs — maintain same a11y rigor.
- **Git branch:** Create `story-1.4-combinations-screen` off `epic-1` (flat naming, not hierarchical).

### Git Intelligence

Recent commits show established patterns:
- Commit messages: `feat: <description> (Story X.Y)` for feature work
- Code review fixes as separate commits: `fix: code review — <details> (Story X.Y)`
- Branch naming: `story-1.3-color-home-screen` off `epic-1`

### Project Structure Notes

After this story, new/modified files:
```
src/
├── components/
│   ├── ColorHeader.tsx          (NEW)
│   ├── ColorHeader.test.tsx     (NEW)
│   ├── PaletteStrip.tsx         (NEW)
│   ├── PaletteStrip.test.tsx    (NEW)
│   ├── CombinationList.tsx      (NEW)
│   └── CombinationList.test.tsx (NEW)
├── navigation/
│   └── ColorsStack.tsx          (MODIFIED — Combinations screen header config)
└── screens/
    ├── Combinations.tsx         (MODIFIED — replace placeholder)
    └── Combinations.test.tsx    (NEW)
```

### References

- [Source: docs/planning/epics.md#Story 1.4: Combinations Screen]
- [Source: docs/planning/epics.md#Story 1.5: Cross-Navigation] (for scope boundary awareness)
- [Source: docs/planning/architecture-react-native-ios.md#Data Architecture]
- [Source: docs/planning/architecture-react-native-ios.md#Data Access Patterns]
- [Source: docs/planning/architecture-react-native-ios.md#Frontend Architecture]
- [Source: docs/planning/architecture-react-native-ios.md#Component Patterns]
- [Source: docs/planning/architecture-react-native-ios.md#Structure Patterns]
- [Source: docs/planning/architecture-react-native-ios.md#Routing — ColorsStack]
- [Source: docs/planning/ux-design-specification-ios.md#PaletteStrip Component]
- [Source: docs/planning/ux-design-specification-ios.md#CombinationList Component]
- [Source: docs/planning/ux-design-specification-ios.md#ColorHeader Component]
- [Source: docs/planning/ux-design-specification-ios.md#Viewing Combinations]
- [Source: docs/planning/ux-design-specification-ios.md#Screen 2 — Combinations]
- [Source: _bmad-output/implementation-artifacts/1-3-color-home-screen.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed Biome formatting issues (7 files auto-formatted)
- Fixed `headerBackTitleVisible` → `headerBackTitle: ""` (property doesn't exist in React Navigation 7 native-stack)

### Completion Notes List

- Task 1: ColorHeader component with 40×40 swatch, JP/EN names, right-aligned count, accessibility label. 6 tests.
- Task 2: PaletteStrip component with 2-4 color rectangles, hairline dividers, outer border-radius, selected dot, JP/EN labels. 8 tests.
- Task 3: CombinationList (FlatList with 24px spacing + dividers), Combinations screen (reads colorId, renders ColorHeader + CombinationList), ColorsStack nav config (empty title, back chevron). 10 tests.
- Task 4: Lint 0 errors, TypeScript 0 errors, 71/71 tests green, all 5 ACs verified point-by-point.

### Change Log

- 2026-03-13: Story 1.4 implementation complete — ColorHeader, PaletteStrip, CombinationList components + Combinations screen + navigation config + 24 new tests
- 2026-03-13: Code review fixes — separator spacing 49px→25px (H1), duplicate tests replaced with meaningful assertions (M1, M2), dot placement assertion strengthened (M3), .vscode/settings.json reverted (M4), combination count pluralization (L1)

### File List

- src/components/ColorHeader.tsx (NEW)
- src/components/ColorHeader.test.tsx (NEW)
- src/components/PaletteStrip.tsx (NEW)
- src/components/PaletteStrip.test.tsx (NEW)
- src/components/CombinationList.tsx (NEW)
- src/components/CombinationList.test.tsx (NEW)
- src/screens/Combinations.tsx (MODIFIED — replaced placeholder)
- src/screens/Combinations.test.tsx (NEW)
- src/navigation/ColorsStack.tsx (MODIFIED — Combinations header config)
