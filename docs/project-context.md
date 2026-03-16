# Project Context — Outfinder

## What is this project?

A React Native iOS app that transforms Sanzo Wada's 1930s color masterwork — "A Dictionary of Color Combinations" — into a visual outfit coordination tool. Users select a garment color, see curated harmonious combinations, and visualize them as customizable clothing silhouettes they can share on Instagram and TikTok.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.83 + TypeScript |
| Platform | Expo SDK 55 (managed workflow) |
| Styling | NativeWind 4.2.2 (Tailwind CSS for RN) |
| Navigation | React Navigation 7 (native stacks) |
| Animations | Reanimated 4.2.2 |
| Icons | expo-symbols (SF Symbols) |
| IAP | RevenueCat (react-native-purchases) — not yet implemented |
| Storage | AsyncStorage + expo-secure-store — not yet implemented |
| Linting | Biome 2.4.6 (tabs, double quotes) |
| Testing | Jest ~29.7.0 + jest-expo + React Native Testing Library |
| Fonts | Noto Serif JP (Regular/Medium) + Inter (Regular/Medium) via expo-font |

## Architecture

- **Client-side only** — no backend, no API, no database
- **Static JSON dataset** (~60KB) bundled in binary at build time
- **Offline-first** — full functionality without network
- **iOS only MVP** — iPhone SE 3rd gen to iPhone 16 Pro Max, portrait only
- **Entry point:** `App.tsx` at project root (NOT expo-router — migrated to React Navigation 7 in Story 1.2)

## Current Status

- **Epic 1: DONE** — Color Discovery & Combination Exploration (6/6 stories, 77 tests)
- **Epic 2: IN PROGRESS** — Outfit Visualization
  - Story 2.0: DONE — Garment SVG research, PNG + tintColor approved
  - Story 2.1: DONE — PNG garment silhouettes + OutfitMannequin (132 tests total)
  - Story 2.2: DONE — Tap-swap, garment toggle, PaletteBar (157 tests total)
- Epics 3-6: Backlog
- 6 epics planned, 15+ stories total
- Planning validated: implementation readiness passed 2026-03-12
- Epic 1 retrospective completed: 2026-03-13

## Project Structure

```
outfinder/
├── App.tsx                          # Entry point — font loading, NavigationContainer, TabNavigator
├── index.js                         # Registers App.tsx with Expo
├── __mocks__/
│   └── react-native-reanimated.js   # Manual Reanimated v4 Jest mock (built-in imports native modules)
├── src/
│   ├── components/
│   │   ├── ColorSwatch.tsx          # 62x62px Pressable, Reanimated spring scale (1.05x), pale border detection
│   │   ├── SwatchGroupTabs.tsx      # Horizontal ScrollView, 7 tabs (All + 6 families), hapticLight on tap
│   │   ├── SwatchGroup.tsx          # FlatList numColumns=5, renders ColorSwatch grid
│   │   ├── ColorHeader.tsx          # 40x40 swatch + JP/EN names + combination count
│   │   ├── PaletteStrip.tsx         # 2-4 color rectangles, cross-navigation, haptics, selected dot
│   │   ├── CombinationList.tsx      # FlatList of PaletteStrips with 24px spacing + dividers
│   │   ├── GarmentSlot.tsx          # Interactive garment slot — Pressable with selected state border, variant toggle, Reanimated animations
│   │   ├── OutfitMannequin.tsx      # Vertically stacks GarmentSlots with interactive props from useOutfitState
│   │   ├── PaletteBar.tsx           # Horizontal row of color swatches with JP names, reflects slot assignments
│   │   └── garments/
│   │       ├── index.ts             # GARMENT_REGISTRY — GarmentType union, GarmentConfig, 8 garment mappings
│   │       ├── TopTShirt.tsx         # PNG + tintColor Image wrapper
│   │       ├── TopShirt.tsx          # PNG + tintColor Image wrapper
│   │       ├── BottomPants.tsx       # PNG + tintColor Image wrapper
│   │       ├── BottomSkirt.tsx       # PNG + tintColor Image wrapper
│   │       ├── LayerJacket.tsx       # PNG + tintColor Image wrapper
│   │       ├── LayerHoodie.tsx       # PNG + tintColor Image wrapper
│   │       ├── ShoesSneakers.tsx     # PNG + tintColor Image wrapper
│   │       └── ShoesFormal.tsx       # PNG + tintColor Image wrapper
│   ├── data/
│   │   ├── types.ts                 # Color, Combination, SwatchGroup types
│   │   ├── colors.json              # 159 Wada colors (hex, nameJp, nameEn, id, swatchGroup, combinationCount)
│   │   ├── combinations.json        # 348 Wada palettes (id, colorIds[], nameJp, nameEn)
│   │   └── colorIndex.ts            # Pre-computed Map indexes — O(1) lookups: getColor, getCombination, getCombinations, getColorsByGroup, getAllColors, getAllCombinations
│   ├── hooks/
│   │   ├── useOutfitState.ts        # Outfit state hook — slots, selectedSlotIndex, selectSlot (tap-swap), toggleVariant
│   │   └── useReducedMotion.ts      # AccessibilityInfo.isReduceMotionEnabled() + listener
│   ├── lib/
│   │   └── haptics.ts               # hapticLight(), hapticMedium(), hapticRigid() — all with try/catch + .catch()
│   ├── navigation/
│   │   ├── types.ts                 # ColorsStackParamList, FavoritesStackParamList, SettingsStackParamList, TabParamList
│   │   ├── TabNavigator.tsx         # 3 tabs: Colors (paintpalette), Favorites (heart), Settings (gearshape)
│   │   ├── ColorsStack.tsx          # ColorHome → Combinations → OutfitVisualizer (native stack)
│   │   ├── FavoritesStack.tsx       # Placeholder stack
│   │   └── SettingsStack.tsx        # Placeholder stack
│   ├── screens/
│   │   ├── ColorHome.tsx            # Grid of 159 colors with tab filtering by swatch family
│   │   ├── Combinations.tsx         # ColorHeader + CombinationList for selected color
│   │   ├── OutfitVisualizer.tsx     # Outfit visualization with tap-swap, garment toggle, PaletteBar, haptics, VoiceOver (Story 2.2)
│   │   ├── FavoritesList.tsx        # PLACEHOLDER — Epic 4 implements
│   │   └── Settings.tsx             # PLACEHOLDER — Epic 6 implements
│   ├── styles/
│   │   └── theme.ts                 # 16 Wada design token constants (camelCase) for programmatic access
│   └── global.css                   # Tailwind directives (@tailwind base/components/utilities)
├── tailwind.config.js               # 16 Wada tokens, font families, 8px spacing scale
├── metro.config.js                  # NativeWind + SVG transformer
├── babel.config.js                  # NativeWind jsxImportSource + Reanimated plugin
├── biome.json                       # Tabs, double quotes, CSS tailwind overrides
├── jest.config.js                   # jest-expo preset
└── .github/workflows/ci.yml        # lint + tsc + test on PRs to main
```

## Established Patterns — MUST Follow

### Component Pattern
- Function declarations with named exports (NEVER `export default`, exception: App.tsx)
- Props interface required: `interface {ComponentName}Props` (or `type Props = Record<string, never>` for empty)
- NativeWind `className` for static styles — NEVER `StyleSheet.create`
- `style={{}}` ONLY for dynamic Wada color values (e.g., `style={{ backgroundColor: color.hex }}`)
- Co-located test files: `Component.test.tsx` next to `Component.tsx`

### NativeWind + Pressable (CRITICAL)
NativeWind 4 compiles `className` into the `style` prop. This **conflicts** with Pressable's `({ pressed }) => style` function — NativeWind overwrites it, making dynamic styles invisible.

**Fix:** Use Pressable's render function children pattern:
```tsx
<Pressable className="flex-1" onPress={handler}>
  {({ pressed }) => (
    <View style={{ backgroundColor: color.hex, opacity: pressed ? 0.88 : 1 }} />
  )}
</Pressable>
```
Keep `className` on Pressable for layout only. Dynamic styles go on a child View.

### Data Access — Pure Functions, No Hooks
```typescript
import { getColor, getCombination, getCombinations, getColorsByGroup, getAllColors } from "@/data/colorIndex";
```
Data is bundled JSON with pre-computed Map indexes. O(1) lookups. No state, no effects, no loading states, no hooks. Import and call directly.

### Haptics — Always Through Wrapper
```typescript
import { hapticLight, hapticMedium } from "@/lib/haptics";
```
NEVER import expo-haptics directly. The wrapper has try/catch + `.catch()` for error handling.

### Animations — Reanimated + Reduce Motion
```typescript
const scale = useSharedValue(1);
const reducedMotion = useReducedMotion();

function handlePressIn() {
  if (!reducedMotion) {
    scale.value = withSpring(1.05, { damping: 15, stiffness: 150 });
  }
}
```
Always check `useReducedMotion()` before any animation. Skip entirely when enabled.

### Navigation — Push for Stacking
```typescript
const navigation = useNavigation<NativeStackNavigationProp<ColorsStackParamList, "ColorHome">>();
navigation.push("Combinations", { colorId: color.id }); // push, NOT navigate
```
Use `push()` to allow stacking multiple instances (cross-navigation). `navigate()` would reuse existing screen.

### Accessibility — From Day 1
- `accessibilityLabel` on all interactive elements
- `accessibilityRole` ("button", "tab", "link" as appropriate)
- `accessibilityState={{ selected }}` on tabs
- 44px minimum touch targets
- Color never conveyed by color alone — names always present

### Testing
- Jest ~29.7.0 with jest-expo preset (NOT Jest 30.x — incompatible with Expo SDK 55)
- Manual Reanimated mock at `__mocks__/react-native-reanimated.js` (built-in mock fails)
- `pnpm test -- --ci` FAILS — use `npx jest --ci` in CI
- FlatList virtualizes rendering — test via `data` prop, not full item count assertions
- Mock `@react-navigation/native` for navigation tests
- Mock `@/lib/haptics` for haptic verification
- Use `testID` attributes (React Native convention, not `data-testid`)

### Git Branching
- Epic branches: `epic-N`
- Story branches: `story-X.Y-description` off epic branch (flat naming, NOT `epic-N/story-X.Y`)
- Commit pattern: `feat: <description> (Story X.Y)`, `fix: code review — <details> (Story X.Y)`

## Known Technical Debt (LOW)

1. `biome.json` uses overrides workaround for CSS @tailwind — Biome 2.4.6 bug, revisit on update
2. `SwatchGroupTabsProps` uses `string` instead of `TabKey` type — minor type safety gap
3. Reanimated mock `createAnimatedComponent` uses identity function — may break with animated props
4. `isLightColor` in ColorSwatch not exported or unit tested — luminance threshold without coverage
5. Minimal test coverage on scaffold Story 1.1 (2 static value tests only)

## Swatch Group Labels

The 6 swatch groups (0-5) map to these family names (derived from actual color data):
- 0: Pale & Light
- 1: Red & Brown
- 2: Blue & Lavender
- 3: Dark & Deep
- 4: Vivid & Bold
- 5: Green & Olive
