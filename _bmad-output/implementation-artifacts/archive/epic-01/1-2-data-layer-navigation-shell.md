# Story 1.2: Data Layer & Navigation Shell

Status: done

## Story

As a user,
I want the app to have instant color lookups and native iOS tab navigation,
so that I can navigate between screens with zero delay and the app feels like a native iOS product.

## Acceptance Criteria

1. **Given** the Wada dataset JSON files (colors.json with 159 colors, combinations.json with 348 palettes) are placed in `src/data/`, **when** the data module loads, **then** the JSON is imported as a static ES module at build time (no async loading, no fetch), **and** no loading states exist for data access — data is available immediately (FR43).

2. **Given** TypeScript interfaces are defined in `src/data/types.ts`, **when** a developer references Color, Combination, or SwatchGroup types, **then:**
   - Color has: hex, nameJp, nameEn, id, swatchGroup (number 0-5), combinationCount
   - Combination has: id, colors (Color[]), nameJp, nameEn
   - SwatchGroup is a union type 0 | 1 | 2 | 3 | 4 | 5

3. **Given** `src/data/colorIndex.ts` builds the inverted index at module initialization, **when** the pre-computed maps are created, **then:**
   - `getColor(colorId)` returns a Color in O(1) time
   - `getCombinations(colorId)` returns Combination[] in O(1) time (NFR2: <300ms)
   - `getColorsByGroup(group)` returns only colors in that swatch group
   - `getAllColors()` returns all 159 colors
   - Unit tests in `colorIndex.test.ts` verify: all 159 colors indexed, all 348 combinations accessible, every color has ≥1 combination, O(1) lookup correctness

4. **Given** React Navigation 7 is configured, **when** the app renders, **then:**
   - A TabNavigator displays 3 bottom tabs: Colors (SF Symbol: paintpalette), Favorites (heart), Settings (gearshape)
   - Tab bar background is --tab-bar-bg (#fafaf8) with --tab-bar-border top border
   - Active tab uses --tab-active (#1a1a1a), inactive uses --tab-inactive (#9b9b9b)
   - ColorsStack contains: ColorHome (root) → Combinations (push) → OutfitVisualizer (push, placeholder)
   - FavoritesStack and SettingsStack render placeholder screens
   - Each tab maintains its own independent navigation stack (FR42)
   - Native swipe-back gesture works on all stacks

5. **Given** `lib/haptics.ts` is created, **when** hapticLight(), hapticMedium(), or hapticRigid() are called, **then:**
   - expo-haptics fires the corresponding UIImpactFeedbackGenerator style
   - Each function wraps the call in try/catch (silently fails if API unavailable)
   - No components call expo-haptics directly — always through lib/haptics.ts

## Tasks / Subtasks

- [x] Task 1: Replace expo-router with React Navigation 7 entry point (AC: #4)
  - [x] 1.1 Change `package.json` "main" field from `"expo-router/entry"` to `"./App.tsx"` (or `"expo/AppEntry"` pointing to App.tsx)
  - [x] 1.2 Remove `expo-router` plugin from `app.json` plugins array and remove `experiments.typedRoutes`
  - [x] 1.3 Delete `src/app/` directory entirely (expo-router pages: _layout.tsx, index.tsx, explore.tsx)
  - [x] 1.4 Delete expo-router template components no longer needed: `src/components/animated-icon.tsx`, `animated-icon.web.tsx`, `animated-icon.module.css`, `app-tabs.tsx`, `app-tabs.web.tsx`, `external-link.tsx`, `hint-row.tsx`, `themed-text.tsx`, `themed-view.tsx`, `web-badge.tsx`, `src/components/ui/collapsible.tsx`
  - [x] 1.5 Delete unused hooks: `src/hooks/use-color-scheme.ts`, `use-color-scheme.web.ts`, `use-theme.ts`
  - [x] 1.6 Delete `src/constants/theme.ts` (replaced by `src/styles/theme.ts` from Story 1.1)
  - [x] 1.7 Create `App.tsx` at project root with font loading (moved from _layout.tsx), NavigationContainer, and TabNavigator

- [x] Task 2: Create Wada dataset and data layer (AC: #1, #2, #3)
  - [x] 2.1 Create `src/data/types.ts` with Color, Combination, and SwatchGroup interfaces
  - [x] 2.2 Create `src/data/colors.json` with all 159 Wada colors (hex, nameJp, nameEn, id, swatchGroup 0-5, combinationCount)
  - [x] 2.3 Create `src/data/combinations.json` with all 348 Wada palettes (id, colorIds[], nameJp, nameEn)
  - [x] 2.4 Create `src/data/colorIndex.ts` with pre-computed inverted index Map and pure functions: getColor, getCombinations, getColorsByGroup, getAllColors
  - [x] 2.5 Create `src/data/colorIndex.test.ts` with tests: all 159 colors indexed, all 348 combinations accessible, every color has ≥1 combination, O(1) lookup correctness

- [x] Task 3: Create navigation shell, haptics utility, and placeholder screens (AC: #4, #5)
  - [x] 3.1 Create `src/lib/haptics.ts` with hapticLight(), hapticMedium(), hapticRigid() — all with try/catch
  - [x] 3.2 Create `src/navigation/TabNavigator.tsx` — 3 tabs with SF Symbols, Wada design token colors
  - [x] 3.3 Create `src/navigation/ColorsStack.tsx` — native stack: ColorHome → Combinations → OutfitVisualizer
  - [x] 3.4 Create `src/navigation/FavoritesStack.tsx` — native stack with placeholder root
  - [x] 3.5 Create `src/navigation/SettingsStack.tsx` — native stack with placeholder root
  - [x] 3.6 Create placeholder screens in `src/screens/`: ColorHome.tsx, Combinations.tsx, OutfitVisualizer.tsx, FavoritesList.tsx, Settings.tsx — each with accessibilityLabel and minimal content

- [x] Task 4: Tests, linting, type-check, and AC verification (AC: all)
  - [x] 4.1 Create `src/lib/haptics.test.ts` — test all three haptic functions + error handling
  - [x] 4.2 Verify `npx tsc --noEmit` passes with zero errors
  - [x] 4.3 Verify `pnpm lint` passes with zero errors
  - [x] 4.4 Verify `pnpm test` passes with all tests green
  - [x] 4.5 Point-by-point AC verification of all 5 acceptance criteria

## Dev Notes

### CRITICAL: Migration from expo-router to React Navigation

This story performs the most significant architectural change — replacing expo-router (file-based routing from the template) with React Navigation 7 (explicit navigation architecture required by the project). This is a **destructive migration**: all expo-router template files are deleted and replaced.

**Current state (from Story 1.1):**
- Entry point: `package.json` → `"main": "expo-router/entry"` → `src/app/_layout.tsx`
- `_layout.tsx` loads fonts via `useFonts`, manages SplashScreen, renders template `AppTabs`
- Template components in `src/components/` reference expo-router APIs and `src/constants/theme.ts`
- `app.json` has `"expo-router"` plugin and `"experiments": { "typedRoutes": true, "reactCompiler": true }`

**Target state (after this story):**
- Entry point: `package.json` → `"main": "expo/AppEntry"` → `App.tsx` at project root
- `App.tsx` loads fonts, manages SplashScreen, wraps in `NavigationContainer` + `TabNavigator`
- All template components deleted — replaced by custom Outfinder components
- `app.json` has `expo-router` plugin removed, `typedRoutes` removed

**Migration steps detail:**
1. The `"main"` field change tells Metro to use `App.tsx` instead of expo-router's entry
2. Removing `expo-router` from `app.json` plugins disables the file-based routing system
3. Font loading logic from `_layout.tsx` moves to `App.tsx` (same pattern, different location)
4. All template components are safe to delete — nothing in the project depends on them after migration

### Entry Point Pattern (App.tsx)

```typescript
// App.tsx — project root
import "./src/global.css";

import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { NotoSerifJP_400Regular, NotoSerifJP_500Medium } from "@expo-google-fonts/noto-serif-jp";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { TabNavigator } from "@/navigation/TabNavigator";

SplashScreen.preventAutoHideAsync();

export function App() {
  const [fontsLoaded] = useFonts({
    NotoSerifJP_400Regular,
    NotoSerifJP_500Medium,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}

export default App;
```

**IMPORTANT:** This is the ONE exception where `export default` is allowed — React Native requires a default export from the entry point. The named export `App` is still primary.

### Tab Navigator Configuration

```typescript
// src/navigation/TabNavigator.tsx
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ColorsStack } from "./ColorsStack";
import { FavoritesStack } from "./FavoritesStack";
import { SettingsStack } from "./SettingsStack";
import { colors } from "@/styles/theme";

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg, // #fafaf8
          borderTopColor: colors.tabBarBorder, // rgba(0,0,0,0.06)
        },
        tabBarActiveTintColor: colors.tabActive, // #1a1a1a
        tabBarInactiveTintColor: colors.tabInactive, // #9b9b9b
      }}
    >
      <Tab.Screen
        name="ColorsTab"
        component={ColorsStack}
        options={{
          tabBarLabel: "Colors",
          tabBarIcon: ({ color, size }) => (/* SF Symbol paintpalette */),
          tabBarAccessibilityLabel: "Colors tab",
        }}
      />
      {/* Favorites + Settings tabs */}
    </Tab.Navigator>
  );
}
```

### SF Symbols for Tab Icons

React Native does not have direct SF Symbols support. Use one of these approaches (in order of preference):
1. **expo-symbols** — already installed (`expo-symbols@~55.0.5` in package.json). Use `import { SymbolView } from "expo-symbols"` with `name="paintpalette"`, `name="heart"`, `name="gearshape"`. This is the ideal approach since it's already a dependency.
2. **Fallback:** If expo-symbols doesn't work in the tab bar context, use simple Unicode/emoji icons or `@expo/vector-icons` (Ionicons has equivalent icons: `color-palette-outline`, `heart-outline`, `settings-outline`).

**Research expo-symbols API** before implementing — check if `SymbolView` works as a `tabBarIcon` render function. If it requires a fixed size, wrap it appropriately.

### Data Layer Architecture

**JSON dataset structure:**

`colors.json` — Array of 159 color objects:
```json
[
  {
    "id": "c001",
    "hex": "#E8D3B4",
    "nameJp": "肌色",
    "nameEn": "Skin Color",
    "swatchGroup": 0,
    "combinationCount": 12
  }
]
```

`combinations.json` — Array of 348 palette objects:
```json
[
  {
    "id": "p001",
    "colorIds": ["c001", "c045", "c102"],
    "nameJp": "春の配色",
    "nameEn": "Spring Palette"
  }
]
```

**CRITICAL: Where to get the Wada data.**
The actual 159 colors and 348 combinations from Sanzo Wada's "A Dictionary of Color Combinations" must be sourced. The data should include:
- Exact hex values from the book
- Original Japanese names
- English translations
- Swatch group classification (6 groups, numbered 0-5)
- Combination count per color (pre-calculated)

If the exact dataset is not available in the repo, create the structure with a representative subset and add a TODO for Alejandro to verify/complete the data. The colorIndex module must work regardless of dataset size.

**colorIndex.ts pattern:**
```typescript
import colorsData from "./colors.json";
import combinationsData from "./combinations.json";
import type { Color, Combination, SwatchGroup } from "./types";

// Pre-computed at module initialization — O(1) lookups after this
const colorMap = new Map<string, Color>();
const combinationsByColor = new Map<string, Combination[]>();
const colorsByGroup = new Map<SwatchGroup, Color[]>();

// Build indexes...
for (const color of colorsData) {
  colorMap.set(color.id, color as Color);
}
// ... etc

export function getColor(colorId: string): Color | undefined {
  return colorMap.get(colorId);
}
export function getCombinations(colorId: string): Combination[] {
  return combinationsByColor.get(colorId) ?? [];
}
export function getColorsByGroup(group: SwatchGroup): Color[] {
  return colorsByGroup.get(group) ?? [];
}
export function getAllColors(): Color[] {
  return colorsData as Color[];
}
```

### Placeholder Screens Pattern

Each placeholder screen MUST follow the component pattern:

```typescript
// src/screens/ColorHome.tsx
import { View, Text } from "react-native";

interface ColorHomeProps {}

export function ColorHome({}: ColorHomeProps) {
  return (
    <View className="flex-1 items-center justify-center bg-paper">
      <Text className="font-serif-jp text-lg text-primary">
        Color Home — Story 1.3
      </Text>
    </View>
  );
}
```

Rules:
- Function declarations with named exports
- Props interface required (even if empty)
- NativeWind className for styling
- accessibilityLabel on screen root or primary content
- Use `bg-paper` and `text-primary` design tokens

### Navigation Type Definitions

Define navigation params for type-safe navigation:

```typescript
// src/navigation/types.ts
export type ColorsStackParamList = {
  ColorHome: undefined;
  Combinations: { colorId: string };
  OutfitVisualizer: { combinationId: string };
};

export type FavoritesStackParamList = {
  FavoritesList: undefined;
  Combinations: { colorId: string };
  OutfitVisualizer: { combinationId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type TabParamList = {
  ColorsTab: undefined;
  FavoritesTab: undefined;
  SettingsTab: undefined;
};
```

### Files to DELETE (from expo-router template)

These files exist from the `create-expo-app` template and are NO LONGER NEEDED after migration to React Navigation:

**Directories to delete entirely:**
- `src/app/` (all files: _layout.tsx, index.tsx, explore.tsx)

**Individual files to delete:**
- `src/components/animated-icon.tsx`
- `src/components/animated-icon.web.tsx`
- `src/components/animated-icon.module.css`
- `src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx`
- `src/components/external-link.tsx`
- `src/components/hint-row.tsx`
- `src/components/themed-text.tsx`
- `src/components/themed-view.tsx`
- `src/components/web-badge.tsx`
- `src/components/ui/collapsible.tsx` (and `src/components/ui/` directory if empty)
- `src/hooks/use-color-scheme.ts`
- `src/hooks/use-color-scheme.web.ts`
- `src/hooks/use-theme.ts`
- `src/constants/theme.ts`
- `src/constants/` (directory if empty after deletion)

**DO NOT delete:**
- `scripts/reset-project.js` — may be useful later
- Any file in `assets/` — still needed
- `src/styles/theme.ts` — created in Story 1.1, still needed
- `src/global.css` — Tailwind directives, still needed

### JSON Module Import Configuration

To import `.json` files as ES modules in TypeScript, ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

Check if the Expo base tsconfig already includes these. If not, add them.

### Previous Story Intelligence (from Story 1.1)

**Key learnings to apply:**
- **Git branch naming:** Story 1.1 used flat branch names (`story-1.1-scaffold`) due to ref conflict with hierarchical `epic-1/story-1.1-scaffold`. Use same pattern: `story-1.2-data-layer-navigation-shell` off `epic-1`.
- **Jest configuration:** Use `jest-expo` preset with Jest ~29.7.0 (not 30.x — incompatible with Expo SDK 55)
- **Biome formatting:** Files will be auto-formatted with tabs and double quotes. New files should follow this convention.
- **CI note:** CI uses `npx jest --ci` (not `pnpm test -- --ci`). No CI changes needed in this story.
- **Font loading pattern:** Preserved exactly from `_layout.tsx` — useFonts + SplashScreen.preventAutoHideAsync/hideAsync

**Files created in Story 1.1 (context for this story):**
- `tailwind.config.js` — 16 Wada tokens, font families, spacing scale
- `metro.config.js` — NativeWind + SVG transformer
- `babel.config.js` — NativeWind jsxImportSource + Reanimated plugin
- `src/styles/theme.ts` — camelCase token constants (import as `colors` from `@/styles/theme`)
- `src/global.css` — Tailwind directives
- `biome.json` — tabs, double quotes, CSS overrides
- `jest.config.js` — jest-expo preset

### Project Structure Notes

After this story, the `src/` directory should look like:
```
src/
├── data/
│   ├── types.ts
│   ├── colors.json
│   ├── combinations.json
│   ├── colorIndex.ts
│   └── colorIndex.test.ts
├── lib/
│   ├── haptics.ts
│   └── haptics.test.ts
├── navigation/
│   ├── types.ts
│   ├── TabNavigator.tsx
│   ├── ColorsStack.tsx
│   ├── FavoritesStack.tsx
│   └── SettingsStack.tsx
├── screens/
│   ├── ColorHome.tsx
│   ├── Combinations.tsx
│   ├── OutfitVisualizer.tsx
│   ├── FavoritesList.tsx
│   └── Settings.tsx
├── styles/
│   ├── theme.ts (from Story 1.1)
│   └── theme.test.ts (from Story 1.1)
├── hooks/ (empty — template hooks deleted, new hooks in later stories)
├── components/ (empty — template components deleted, new components in Story 1.3+)
└── global.css (from Story 1.1)
```

### DO NOT Rules

- ❌ Do NOT keep any expo-router files or imports
- ❌ Do NOT use `export default` (exception: App.tsx entry point)
- ❌ Do NOT use StyleSheet.create — NativeWind className only
- ❌ Do NOT import expo-haptics directly in components — use lib/haptics.ts
- ❌ Do NOT create UI components for Color Home (Story 1.3 handles ColorSwatch, SwatchGroup, etc.)
- ❌ Do NOT add loading states for data access — data is bundled and synchronous
- ❌ Do NOT create contexts (FavoritesContext is Epic 4, PremiumContext is Epic 5)
- ❌ Do NOT implement actual screen content — screens are placeholders only
- ❌ Do NOT uninstall expo-router package — it may have peer dependencies. Just remove the plugin and don't import it.

### References

- [Source: docs/planning/epics.md#Story 1.2: Data Layer & Navigation Shell]
- [Source: docs/planning/architecture-react-native-ios.md#Data Architecture]
- [Source: docs/planning/architecture-react-native-ios.md#Frontend Architecture — Routing]
- [Source: docs/planning/architecture-react-native-ios.md#Component Pattern]
- [Source: docs/planning/architecture-react-native-ios.md#Data Access Pattern]
- [Source: docs/planning/architecture-react-native-ios.md#Haptic Feedback]
- [Source: docs/planning/architecture-react-native-ios.md#Project Organization]
- [Source: docs/planning/ux-design-specification-ios.md#Tab Bar — SF Symbols]
- [Source: docs/planning/ux-design-specification-ios.md#Navigation Patterns]
- [Source: docs/planning/ux-design-specification-ios.md#Screen Architecture]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffold-configuration.md#Dev Notes]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Biome empty destructuring pattern → switched to `_props: Props` then auto-fixed to `type Props = Record<string, never>`
- Biome empty interface → auto-fixed to type alias
- Biome import ordering → auto-fixed with `biome check --write`
- combinations.json formatting → auto-fixed (inline short arrays)

### Completion Notes List
- Migrated entry point from expo-router (`expo-router/entry` → `expo/AppEntry` → App.tsx)
- Removed expo-router plugin from app.json, removed typedRoutes experiment
- Deleted 17 template files (src/app/*, src/components/*, src/hooks/*, src/constants/*)
- Created 159-color Wada dataset with 6 swatch groups and 348 combinations
- Built colorIndex with pre-computed Map indexes for O(1) lookups
- Created React Navigation 7 TabNavigator with 3 tabs using expo-symbols SF Symbols
- Created 3 native stacks (Colors, Favorites, Settings) with placeholder screens
- Created haptics utility module with try/catch error handling
- All 20 tests pass, tsc clean, lint clean

### Change Log
- 2026-03-12: Full story implementation — expo-router migration, data layer, navigation shell, haptics, tests
- 2026-03-12: Code review fixes — haptics.ts added .catch() for async promise handling, updated File List (added index.js, tsconfig.json)

### Code Review (AI)

**Reviewer:** Claude Opus 4.6 (adversarial review)
**Date:** 2026-03-12
**Verdict:** APPROVED with fixes applied

**Findings:**
1. **[FIXED][CRITICAL]** `src/app/index.tsx` appeared as modified (not deleted) in initial git snapshot — confirmed deleted on re-check. Likely stale git status at review start.
2. **[FIXED][MEDIUM]** `haptics.ts` — `Haptics.impactAsync()` returns Promise but was not handled. Added `.catch(() => {})` to prevent unhandled promise rejection.
3. **[DOCUMENTED][LOW]** `getAllCombinations()` added to colorIndex but not specified in AC#3 — minor scope creep, useful function, kept as-is.
4. **[DOCUMENTED][LOW]** `index.js` and `tsconfig.json` modifications were not listed in original File List — now documented.

### File List

**New files:**
- App.tsx
- index.js
- src/data/types.ts
- src/data/colors.json
- src/data/combinations.json
- src/data/colorIndex.ts
- src/data/colorIndex.test.ts
- src/lib/haptics.ts
- src/lib/haptics.test.ts
- src/navigation/types.ts
- src/navigation/TabNavigator.tsx
- src/navigation/ColorsStack.tsx
- src/navigation/FavoritesStack.tsx
- src/navigation/SettingsStack.tsx
- src/screens/ColorHome.tsx
- src/screens/Combinations.tsx
- src/screens/OutfitVisualizer.tsx
- src/screens/FavoritesList.tsx
- src/screens/Settings.tsx

**Modified files:**
- package.json (main field: expo-router/entry → expo/AppEntry)
- app.json (removed expo-router plugin, removed typedRoutes experiment)
- tsconfig.json (removed .expo/types and expo-env.d.ts from includes)
- src/lib/haptics.ts (added .catch() for unhandled promise rejection)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status update)

**Deleted files:**
- src/app/_layout.tsx
- src/app/index.tsx
- src/app/explore.tsx
- src/components/animated-icon.tsx
- src/components/animated-icon.web.tsx
- src/components/animated-icon.module.css
- src/components/app-tabs.tsx
- src/components/app-tabs.web.tsx
- src/components/external-link.tsx
- src/components/hint-row.tsx
- src/components/themed-text.tsx
- src/components/themed-view.tsx
- src/components/web-badge.tsx
- src/components/ui/collapsible.tsx
- src/hooks/use-color-scheme.ts
- src/hooks/use-color-scheme.web.ts
- src/hooks/use-theme.ts
- src/constants/theme.ts
