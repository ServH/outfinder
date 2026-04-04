# Project Context — Outfinder

## What is this project?

A React Native iOS app that transforms Sanzo Wada's 1930s color masterwork — "A Dictionary of Color Combinations" — into a visual outfit coordination tool. Users select a garment color, see curated harmonious combinations, and visualize them as realistic tinted clothing on an editorial card they can share on Instagram and TikTok.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.83 + TypeScript |
| Platform | Expo SDK 55 (managed workflow) |
| Styling | NativeWind 4.2.2 (Tailwind CSS for RN) |
| Navigation | React Navigation 7 (native stacks) |
| Animations | Reanimated 4.2.2 |
| 2D Rendering | @shopify/react-native-skia 2.5.1 (Canvas, ColorMatrix, RadialGradient) |
| Image Capture | react-native-view-shot 4.0.3 (captureRef for share images) |
| Sharing | expo-sharing ~55.0.11 (native iOS Share Sheet / UIActivityViewController) |
| Icons | expo-symbols (SF Symbols) |
| Storage | AsyncStorage (favorites persistence) |
| IAP | RevenueCat (react-native-purchases) — PremiumContext + purchase/restore flow |
| Secure Storage | expo-secure-store — premium status caching |
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

- **Epic 1: DONE** — Color Discovery & Combination Exploration (6/6 stories)
- **Epic 2: DONE** — Outfit Visualization (4/4 stories — Story 2.4 descoped/rolled back, replaced by Story 2.5 Skia rewrite)
- **Epic 3: DONE** — Social Sharing (2/2 stories — share image capture + native share sheet)
- **Epic 4: DONE** — Favorites & Collections (2/2 stories — FavoritesContext + FavoritesList)
- **Epic 5: DONE** — Premium & In-App Purchases (2/2 stories — PremiumContext + IAP purchase/restore flow)
- **Epic 6: DONE** — Onboarding & App Store Launch (5/5 stories: 6.1 Onboarding, 6.2 Settings/EAS, 6.3 A11y polish, 6.4 Code quality, 6.5 Error boundary/privacy/IAP hardening)
- **Epic 7: IN-PROGRESS** — Post-launch polish (7.1 Onboarding visual refresh DONE, 7.2 Visualizer interaction affordances DONE, 7.3 Tinted garment fallback PENDING)
- **Epic 8: DONE** — Home redesign v2.0 (8.1–8.5 all stories complete, merged to epic-1)
- **Epic 9: DONE** — Favorites redesign (9.1 2-col grid + ComboCard compact, 9.2 Sort pills + empty state)
- **Story 10.1: DONE** — Visualizer adjustments (nameEn in WadaHeader + dynamic nav title)
- **Epic 11: IN-PROGRESS** — Story 11.1 DONE: Onboarding v2 — old 4-step onboarding removed, 2-step coach mark overlay in Visualizer, permanent ‹ › navigation arrows
- **Tests:** 493 across 35 suites (all passing)
- **Code Reviews:** Adversarial review on every story since Epic 1. Per-screen code analysis on 2026-04-03
- **Retrospectives:** Epic 1, 2, 3, 4 completed
- **App Store:** v1.0.0 submitted 2026-03-26, v1.0.1 onboarding refresh, v1.0.2 (build 4) visualizer affordances

### Epic Execution Order (non-sequential)

Epics were NOT executed in numerical order:
1. Epic 1 → Epic 2 → **Epic 4** → **Epic 3** → Epic 5 → Epic 6 → Epic 7 → Epic 8 → Epic 9 → Story 10.1 → bugfix polish

Epic 3 was postponed after Epic 2 because the Visualizer was visually flat for social sharing. Epic 4 (Favorites) was independent and executed first. Story 2.5 (Skia rewrite) + bugfix polish branch resolved the visual debt, unblocking Epic 3.

## Project Structure

```
outfinder/
├── App.tsx                          # Entry point — font loading, FavoritesProvider, NavigationContainer, TabNavigator
├── index.js                         # Registers App.tsx with Expo
├── __mocks__/
│   ├── react-native-reanimated.js   # Manual Reanimated v4 Jest mock (built-in imports native modules)
│   ├── react-native-gesture-handler.js # Gesture handler mock
│   ├── react-native-view-shot.js    # View-shot captureRef mock (returns "file:///mock-path.png")
│   └── @shopify/
│       └── react-native-skia.js     # Manual Skia Jest mock (Canvas, Image, Fill, etc.)
├── src/
│   ├── components/
│   │   ├── ColorSwatch.tsx          # 62x62px Pressable, Reanimated spring scale (1.05x), pale border detection
│   │   ├── SwatchGroupTabs.tsx      # Horizontal ScrollView, 7 tabs (All + 6 families), hapticLight on tap
│   │   ├── SwatchGroup.tsx          # FlatList numColumns=5, renders ColorSwatch grid
│   │   ├── ColorHeader.tsx          # 40x40 swatch + JP/EN names + combination count
│   │   ├── PaletteStrip.tsx         # 2-4 color rectangles, cross-navigation, haptics, selected dot, FavoriteButton
│   │   ├── CombinationList.tsx      # FlatList of PaletteStrips with 24px spacing + dividers
│   │   ├── TintedGarment.tsx        # Skia Canvas + ColorMatrix tinting for any garment photo
│   │   ├── OutfitCard.tsx           # White editorial card with stacked TintedGarments, tap-swap, variant toggle
│   │   ├── WarmBackground.tsx       # Full-screen Skia warm radial gradient (Japanese paper tones)
│   │   ├── Aureola.tsx              # Radial glow behind outfit card using dominant color
│   │   ├── WadaHeader.tsx           # Japanese combination name + "N colors · Sanzo Wada" subtitle
│   │   ├── MiniPaletteStrip.tsx     # Thin horizontal color strip with names below the card
│   │   ├── ComboCard.tsx             # Full + compact combo card: color strip, "yours" label, heart, "See outfit" pill
│   │   ├── FavoriteButton.tsx       # Heart toggle (SF Symbol), spring animation, hapticLight, a11y, configurable size
│   │   ├── EmptyState.tsx           # Empty favorites guidance with heart icon and message
│   │   ├── ErrorBoundary.tsx        # App-level error boundary with recovery UI
│   │   ├── PremiumPaywall.tsx       # Paywall modal — Wada-styled, RevenueCat purchase/restore
│   │   ├── presentation.test.tsx    # Shared presentation component tests
│   │   ├── onboarding/             # Onboarding step preview components
│   │   │   ├── ColorSpecimenPreview.tsx  # Mini color specimen for onboarding
│   │   │   ├── OutfitPreview.tsx         # Mini outfit preview for onboarding
│   │   │   ├── PalettePreview.tsx        # Mini palette preview for onboarding
│   │   │   └── SwatchGridPreview.tsx     # Mini swatch grid for onboarding
│   │   └── garments/
│   │       └── index.ts             # GARMENT_REGISTRY — GarmentType union, GarmentConfig (image, label, heightHint)
│   ├── contexts/
│   │   ├── FavoritesContext.tsx     # FavoritesProvider + useFavorites() — Set<combinationId>, AsyncStorage persistence, toggle/isFavorite/count
│   │   └── PremiumContext.tsx       # PremiumProvider + usePremium() — RevenueCat IAP, SecureStore cache, purchase/restore, isPremium/isLoading
│   ├── data/
│   │   ├── types.ts                 # Color, Combination, SwatchGroup types
│   │   ├── colors.json              # 159 Wada colors (hex, nameJp, nameEn, id, swatchGroup, combinationCount)
│   │   ├── combinations.json        # 348 Wada palettes (id, colorIds[], nameJp, nameEn)
│   │   └── colorIndex.ts            # Pre-computed Map indexes — O(1) lookups: getColor, getCombination, getCombinations, getColorsByGroup, getAllColors, getAllCombinations
│   ├── hooks/
│   │   ├── useOutfitState.ts        # Outfit state hook — slots, selectedSlotIndex, selectSlot (tap-swap), toggleVariant
│   │   ├── usePremiumGate.ts        # Gate hook — checks premium status, triggers paywall if needed
│   │   └── useReducedMotion.ts      # AccessibilityInfo.isReduceMotionEnabled() + listener
│   ├── lib/
│   │   ├── color.ts                 # isLightColor(hex) — luminance-based light color detection for contrast-aware UI
│   │   ├── haptics.ts               # hapticLight(), hapticMedium(), hapticRigid() — all with try/catch + .catch()
│   │   └── share.ts                 # captureShareImage(viewRef) + shareOutfit(viewRef) — view-shot capture + expo-sharing
│   ├── navigation/
│   │   ├── types.ts                 # ColorsStackParamList, FavoritesStackParamList, SettingsStackParamList, TabParamList
│   │   ├── TabNavigator.tsx         # 3 tabs: Colors (paintpalette), Favorites (heart), Settings (gearshape)
│   │   ├── ColorsStack.tsx          # ColorHome → Combinations → OutfitVisualizer (native stack)
│   │   ├── FavoritesStack.tsx       # FavoritesList with large title header
│   │   └── SettingsStack.tsx        # Placeholder stack
│   ├── screens/
│   │   ├── ColorHome.tsx            # Grid of 159 colors with tab filtering by swatch family
│   │   ├── Combinations.tsx         # ColorHeader + CombinationList for selected color
│   │   ├── OutfitVisualizer.tsx     # Outfit visualization with Skia tinting, editorial card, Wada identity, share button, branding, haptics, VoiceOver
│   │   ├── FavoritesList.tsx        # Saved combinations list, CombinationList reuse, EmptyState when empty
│   │   ├── Onboarding.tsx            # 4-step onboarding flow with real mini-previews, Wada styling
│   │   └── Settings.tsx             # Settings screen — version info, privacy links, restore purchases, contact
│   ├── styles/
│   │   └── theme.ts                 # 16 Wada design token constants (camelCase) for programmatic access
│   └── global.css                   # Tailwind directives (@tailwind base/components/utilities)
├── assets/
│   └── garments/                    # 8 real garment photo PNGs (white-on-transparent, AI-generated flat-lay)
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

### Garment System (Skia-based)
- `GARMENT_REGISTRY` in `garments/index.ts` is the single source of truth for all garments
- Each garment: `{ image: require(), label: string, heightHint: number }`
- `TintedGarment` applies Skia `ColorMatrix` to tint any white-on-transparent PNG
- To add a garment: add PNG + registry entry + optional variant pair. No component changes needed.

### Share Flow (On-Screen Capture)
- `lib/share.ts` provides `captureShareImage(viewRef)` and `shareOutfit(viewRef)`
- **Captures the on-screen Skia content directly** — NOT an off-screen duplicate view
- `shareViewRef` wraps the visible OutfitVisualizer content (WarmBackground + Aureola + WadaHeader + OutfitCard + MiniPaletteStrip + branding)
- Share button rendered as absolute overlay (`bottom: 48`) outside the capture area
- Uses `PixelRatio.get()` for device-native resolution (adapts to any iPhone)
- `collapsable={false}` on capturable View for RN optimization safety
- "Outfinder" branding text rendered inside capture area (subtle, #a09080)

### Favorites System (Context-based)
- `FavoritesContext` provides `useFavorites()` hook: `toggle(id)`, `isFavorite(id)`, `favorites` Set, `count`
- Persists to AsyncStorage key `@outfinder/favorites`
- `FavoriteButton` is a heart toggle embedded in `PaletteStrip` — works in both Colors and Favorites stacks
- `FavoritesProvider` wraps the app in `App.tsx`
- Sets the pattern for `PremiumContext` in Epic 5

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
import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics";
```
NEVER import expo-haptics directly. The wrapper has try/catch + `.catch()` for error handling.
- `hapticLight()` — selection feedback (tab switch, favorite toggle)
- `hapticMedium()` — swap/change feedback (garment color swap, variant cycle)
- `hapticRigid()` — confirm/action feedback (share initiation, purchase confirmation)

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
- `accessibilityElementsHidden` on off-screen/decorative content to prevent VoiceOver leaks
- 44px minimum touch targets (48px preferred — `min-h-[48px]`)
- Color never conveyed by color alone — names always present

### Testing
- Jest ~29.7.0 with jest-expo preset (NOT Jest 30.x — incompatible with Expo SDK 55)
- Manual Reanimated mock at `__mocks__/react-native-reanimated.js` (built-in mock fails)
- Manual Skia mock at `__mocks__/@shopify/react-native-skia.js` (renders as Views with testIDs)
- Manual view-shot mock at `__mocks__/react-native-view-shot.js`
- `pnpm test -- --ci` FAILS — use `npx jest --ci` in CI
- FlatList virtualizes rendering — test via `data` prop, not full item count assertions
- Mock `@react-navigation/native` for navigation tests
- Mock `@/lib/haptics` for haptic verification
- Use `testID` attributes (React Native convention, not `data-testid`)
- Use `getAllByText` when text appears in both visible and off-screen/capture elements
- Use `includeHiddenElements: true` when querying inside `accessibilityElementsHidden` wrappers
- Double-tap prevention patterns: test with `sharing` state guards

### Git Branching
- Epic branches: `epic-N`
- Story branches: `story-X.Y-description` off epic branch (flat naming, NOT `epic-N/story-X.Y`)
- Commit pattern: `feat: <description> (Story X.Y)`, `fix: code review — <details> (Story X.Y)`

## Known Technical Debt

| # | Item | Priority | Since |
|---|------|----------|-------|
| 1 | `biome.json` uses overrides workaround for CSS @tailwind | LOW | Epic 1 — Biome 2.4.6 bug, revisit on update |
| 2 | Reanimated mock `createAnimatedComponent` uses identity function | LOW | Epic 1 — could break with animated props |
| 3 | `usePremiumGate` still exports toast-related state (`toastVisible`, `toastOpacity`, `showToast`) but toast is never triggered after removing `paywallDismissedThisSession` guard | LOW | Bugfix 2026-04-03 — dead code in hook, screens already cleaned |
| 4 | `handleScroll` in ColorHome uses `useNativeDriver: false` for dot/link interpolations | LOW | Epic 8 — JS thread scroll tracking, fine for 2 pages |
| 5 | No StoreKit Configuration file for simulator IAP testing | MEDIUM | Since Epic 5 — purchases only testable on real device with sandbox |

## Bugfix Branch: `fix/premium-gate-and-home-polish` (2026-04-03)

Per-screen code review with targeted fixes:

### Premium Gate (Critical Bug)
- **Root cause:** `onPremiumGate` passed to ALL unfavorited items for free users — missing `favorites.size >= FREE_FAVORITES_LIMIT` check in Combinations, ColorHome, FavoritesList
- **Badge text:** PremiumPaywall hardcoded "5 of 5" from heart tap — now dynamic `${favCount} of 5`
- **Paywall repeat:** Removed `paywallDismissedThisSession` guard — paywall always shows on explicit heart taps (user-initiated action deserves purchase option)

### Home Layout
- **PEEK_WIDTH removed:** `PAGE_WIDTH = SCREEN_WIDTH - 28` was causing Page 2 cards to bleed through — now `PAGE_WIDTH = Dimensions.get("window").width`
- **pagingEnabled:** Replaced `snapToInterval` with native iOS `pagingEnabled` for proper page clipping
- **Symmetric padding:** Both pages use `paddingHorizontal: pagePadding` (was asymmetric)
- **Scroll restore:** Returns to correct page after State 2 back (was always resetting to Page 1)
- **Subtitle serif:** "What color are you wearing?" now `NotoSerifJP_400Regular` 18px (was Inter 16px)

### Tailwind Token Naming (Systemic Fix)
- **Problem:** Color keys like `"text-primary"`, `"bg-elevated"` generated utilities `text-text-primary`, `bg-bg-elevated` — double prefix. `bg-paper` class never worked (key was `"bg-paper"`, utility would be `bg-bg-paper`)
- **Fix:** Renamed keys to `primary`, `secondary`, `tertiary`, `surface`, `elevated`, `paper` — now `text-primary`, `bg-elevated`, `bg-paper` resolve correctly
- **Impact:** 23 files, all className usages updated

### Navigation & Transitions
- **Fade on all tabs:** `animation: "fade"` in TabNavigator screenOptions
- **Fade on all stacks:** ColorsStack, FavoritesStack, SettingsStack `screenOptions={{ animation: "fade" }}`
- **Header auto-scale:** `adjustsFontSizeToFit` + `numberOfLines={1}` + `minimumFontScale={0.7}` on all back buttons (Combinations, ColorHome State 2, BrowseAllColors, OutfitVisualizer)

### Dead Code Cleanup
- Removed toast JSX + `Animated` imports from Combinations and FavoritesList (dead after paywall guard removal)
- Removed `isLightColor` import + `needsBorder` from Combinations
- Removed premium gate from FavoritesList `renderComboCard` (items always favorited — gate never triggers)
- Merged duplicate `handleSkip`/`handleCta` in Onboarding → `handleComplete`
- Extracted shared header in FavoritesList (was duplicated in empty/non-empty branches)

### Minor Polish
- FabricSwatch shadow: 2px offset, 8% opacity, 6px blur
- ComboCard shadow increased: offset 1→3, opacity 0.08→0.12, blur 4→8
- SwatchGroupTabs vertical alignment fix (`paddingTop: 0` when ListHeaderComponent present)
- Settings hardcoded "5" → `PREMIUM_CONFIG.FREE_FAVORITES_LIMIT`
- OutfitVisualizer tooltip colors → wadaTokens
- BrowseAllColors: removed redundant `justify-between`, added `accessibilityLabel`
- Combinations back button a11y: "Back to ColorName" → "Go back"
- ColorHome link `pointerEvents` driven by `scrollX` listener (instant during swipe)

## Implemented: v2.0 Redesign (All DONE)

### Home Redesign — Epic 8 (DONE, Stories 8.1–8.5)
- Wardrobe-first fabric swatches, 2-page paged scroll (6 basics + 5 accents + "All 159 colors" dashed card)
- State 2 crossfade: shade picker + combo feed
- Spec: `designs/home-redesign-spec.md`

### Favorites Redesign — Epic 9 (DONE, Stories 9.1–9.2)
- 2-column compact grid, sort pills (Recent, A-Z, By size), shared ComboCard
- Simplified stack: FavoritesList → OutfitVisualizer
- Spec: `designs/favorites-redesign-spec.md`

### Visualizer Adjustments — Story 10.1 (DONE)
- nameEn in WadaHeader, dynamic nav title
- Spec: `designs/visualizer-adjustments-spec.md`

### Design Exploration Archive
- Full design exploration (30+ concepts) in `designs/pencil-new.pen`
- Concepts A-F → G/H/I → H1-H3 → v3 flow → v4.1 (validated)
- Deferred features: "Do these match?" (future epic), Wada's Journal (premium content)

## Key Learnings from Retrospectives

Patterns validated across 4 epics:
- **Previous Story Intelligence** in Dev Notes prevents re-discovery of known issues
- **Adversarial code review** before every merge is non-negotiable
- **Stories capped at 4-5 tasks** — larger stories show context degradation
- **Small epics = predictable quality** (Epic 4: 2 stories, zero drama)
- **Validate visual paradigm changes with mockup before code** (Story 2.4 rollback lesson)
- **On-screen capture > off-screen duplicate** for share images (Story 3.1→3.2 pivot)

## Swatch Group Labels

The 6 swatch groups (0-5) map to these family names (derived from actual color data):
- 0: Pale & Light
- 1: Red & Brown
- 2: Blue & Lavender
- 3: Dark & Deep
- 4: Vivid & Bold
- 5: Green & Olive
