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
| Camera | expo-camera 55.0.15 (CaptureScreen live preview + takePictureAsync) |
| Color Analysis | react-native-image-colors 2.6.0 (dominant color extraction from photo URI) |
| Sharing | expo-sharing ~55.0.11 (native iOS Share Sheet / UIActivityViewController) |
| Icons | expo-symbols (SF Symbols) |
| Storage | AsyncStorage (favorites persistence) |
| IAP | RevenueCat (react-native-purchases) — PremiumContext + purchase/restore flow |
| Secure Storage | expo-secure-store — premium status caching |
| i18n | react-i18next + i18next — EN/ES localization, sync init via Intl.DateTimeFormat |
| Linting | Biome 2.4.6 (tabs, double quotes) |
| Testing | Jest ~29.7.0 + jest-expo + React Native Testing Library |
| Fonts | Noto Serif JP (Regular/Medium) + Inter (Regular/Medium) via expo-font |

## Architecture

- **Client-side only** — no backend, no API, no database
- **Static JSON dataset** (~60KB) bundled in binary at build time
- **Offline-first** — full functionality without network
- **iOS + iPadOS** — iPhone SE 3rd gen to iPhone 16 Pro Max + iPad Air/Pro (768pt+ breakpoint), portrait only
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
- **Epic 11: DONE** — Story 11.1: Onboarding v2 (coach marks + permanent arrows). Story 11.2: EN/ES localization (react-i18next, 135 keys). Story 11.3a: iPad primary screens (ColorHome, Favorites, OutfitVisualizer). Story 11.3b: iPad secondary screens (Combinations, Settings, BrowseAllColors, SwatchGroup numColumns).
- **Epic 12: IN-PROGRESS** — Color Capture feature. Story 12.1 DONE: color math foundation (colorTypes, colorConversion, colorMatch — LAB, CIEDE2000). Story 12.2 DONE: camera entry point + CaptureScreen (expo-camera, permission flow, WB slider, haptics). Story 12.3 DONE: native WB Swift module (`modules/white-balance/`) + AnalysisOverlay component + full analysis pipeline wired in CaptureScreen (WB correction → getColors → hexToLab → matchWadaColor → classifyMatch → navigate). Story 12.4 READY: result sheets + navigation.
- **Tests:** 539 passing across 41 suites (60 pre-existing failures in i18n + OutfitVisualizer suites — unrelated to Epic 12)
- **Code Reviews:** Adversarial review on every story since Epic 1. Per-screen code analysis on 2026-04-03
- **Retrospectives:** Epic 1, 2, 3, 4 completed
- **App Store:** v1.0.0 submitted 2026-03-26 → v1.2.0 (build 4) current on epic-1

### Epic Execution Order (non-sequential)

Epics were NOT executed in numerical order:
1. Epic 1 → Epic 2 → **Epic 4** → **Epic 3** → Epic 5 → Epic 6 → Epic 7 → Epic 8 → Epic 9 → Story 10.1 → bugfix polish

Epic 3 was postponed after Epic 2 because the Visualizer was visually flat for social sharing. Epic 4 (Favorites) was independent and executed first. Story 2.5 (Skia rewrite) + bugfix polish branch resolved the visual debt, unblocking Epic 3.

## Project Structure

```
outfinder/
├── App.tsx                          # Entry point — font loading, FavoritesProvider, NavigationContainer, TabNavigator
├── index.js                         # Registers App.tsx with Expo
├── modules/
│   └── white-balance/               # Local Expo native module (Swift/iOS only)
│       ├── ios/WhiteBalanceModule.swift  # CITemperatureAndTint filter + CIAreaAverage border sampling → CCT estimation
│       ├── src/index.ts             # JS bridge: requireNativeModule("WhiteBalance") → applyWhiteBalance(uri, temp)
│       ├── expo-module.config.json  # Autolinking config (platforms: ios, modules: ["WhiteBalanceModule"])
│       ├── package.json             # name: "white-balance", main: src/index.ts
│       └── white-balance.podspec   # CocoaPods spec — depends on ExpoModulesCore
├── __mocks__/
│   ├── react-native-reanimated.js   # Manual Reanimated v4 Jest mock (built-in imports native modules)
│   ├── react-native-gesture-handler.js # Gesture handler mock
│   ├── react-native-view-shot.js    # View-shot captureRef mock (returns "file:///mock-path.png")
│   ├── expo-localization.js         # Mock for expo-localization (returns en locale by default)
│   └── @shopify/
│       └── react-native-skia.js     # Manual Skia Jest mock (Canvas, Image, Fill, etc.)
├── src/
│   ├── types/
│   │   └── expo-modules-core.d.ts  # Ambient declaration for expo-modules-core (pnpm hoisting workaround)
│   ├── components/
│   │   ├── AnalysisOverlay.tsx      # Full-screen overlay during photo analysis: 4 Wada messages, 200ms fade cycle, reduce-motion guard
│   │   ├── ColorSwatch.tsx          # 62x62px Pressable, Reanimated spring scale (1.05x), pale border detection
│   │   ├── SwatchGroupTabs.tsx      # Horizontal ScrollView, 7 tabs (All + 6 families), hapticLight on tap
│   │   ├── SwatchGroup.tsx          # FlatList with optional numColumns (default 5, 7 on iPad), gap/padding scale with numColumns
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
│   │   ├── usePremiumGate.ts        # Gate hook — paywall trigger, IAP error messages via i18n.t()
│   │   └── useReducedMotion.ts      # AccessibilityInfo.isReduceMotionEnabled() + listener
│   ├── i18n/
│   │   ├── index.ts                 # Sync i18n init (initAsync: false), detectLanguage() via Intl.DateTimeFormat, exports i18n instance
│   │   ├── types.ts                 # TranslationKey flat type + bidirectional AssertSameKeys (en↔es parity at build time)
│   │   ├── locales/
│   │   │   ├── en.json              # English translation file (~140 keys, 22 namespaces)
│   │   │   └── es.json              # Spanish translation file (same structure, parity enforced by types.ts)
│   │   └── __tests__/
│   │       └── i18n.test.ts         # Key parity, locale detection (es/es-MX/es-ES/en/fr/ja/Intl-throws), plurals, Wada name handling
│   ├── lib/
│   │   ├── color.ts                 # isLightColor(hex) — luminance-based light color detection for contrast-aware UI
│   │   ├── colorTypes.ts            # WadaColor, RGBColor, LABColor, WadaColorWithLab, WadaMatch, MatchResult types (Epic 12)
│   │   ├── colorConversion.ts       # hexToRgb, hexToLab, rgbToLinear, linearRgbToXyz, xyzToLab (Epic 12)
│   │   ├── colorMatch.ts            # matchWadaColor(lab) + classifyMatch(matches) → MatchResult ("direct"|"confirm"|"out-of-coverage") (Epic 12)
│   │   ├── device.ts                # useIsIPad() hook (768pt breakpoint), isIPad() static, useFavoritesNumCols() (1024pt breakpoint)
│   │   ├── haptics.ts               # hapticLight(), hapticMedium(), hapticRigid() — all with try/catch + .catch()
│   │   ├── share.ts                 # captureShareImage(viewRef) + shareOutfit(viewRef) — view-shot capture + expo-sharing
│   │   └── storeReview.ts           # requestStoreReview() — expo-store-review wrapper with try/catch
│   ├── navigation/
│   │   ├── types.ts                 # ColorsStackParamList (+ CaptureScreen; Combinations + OutfitVisualizer have capturedHex? hook), FavoritesStackParamList, SettingsStackParamList, TabParamList
│   │   ├── TabNavigator.tsx         # 3 tabs: Colors (paintpalette), Favorites (heart), Settings (gearshape)
│   │   ├── ColorsStack.tsx          # ColorHome → CaptureScreen (fullScreenModal) → Combinations → OutfitVisualizer
│   │   ├── FavoritesStack.tsx       # FavoritesList with large title header
│   │   └── SettingsStack.tsx        # Placeholder stack
│   ├── screens/
│   │   ├── ColorHome.tsx            # Grid of 159 colors with tab filtering + camera entry button (bottom-right FAB)
│   │   ├── CaptureScreen.tsx        # Full-screen camera viewfinder — expo-camera, WB slider, full analysis pipeline: applyWhiteBalance → getColors → hexToLab → matchWadaColor → classifyMatch → navigate (Epic 12.2–12.3)
│   │   ├── Combinations.tsx         # ColorHeader + CombinationList for selected color
│   │   ├── OutfitVisualizer.tsx     # Outfit visualization with Skia tinting, editorial card, coach marks, permanent arrows, share, haptics, VoiceOver
│   │   ├── FavoritesList.tsx        # Saved combinations list, CombinationList reuse, EmptyState when empty
│   │   ├── BrowseAllColors.tsx      # Full color catalog grid accessible from Home "All 159 colors" link
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
├── jest.config.js                   # jest-expo preset, setupFiles: [jest.setup.js]
├── jest.setup.js                    # Global i18n init before all tests
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

### i18n — react-i18next (Story 11.2)
```typescript
import { useTranslation } from "react-i18next";
const { t } = useTranslation();
// Static string:  t("home.subtitle")
// Interpolated:   t("comboCard.combinationLabel", { name, colors })
// Plural:         t("home.combo", { count })  → "combo" / "combos"
```
- `src/i18n/index.ts` initializes synchronously at import — `import "./src/i18n"` MUST be first line in App.tsx
- Outside React components: `import { i18n } from "@/i18n"` → `i18n.t("key")`
- Wada names (`nameJp`, `nameEn`) are NEVER passed through `t()` — brand identity, always raw
- "Outfinder" brand name NOT in translation files
- `detectLanguage()` exported from index.ts — uses `Intl.DateTimeFormat().resolvedOptions().locale`, NOT expo-localization
- Type safety: `TranslationKey` type in `types.ts` + `AssertSameKeys` catches missing keys at build time
- Global Jest mock: `__mocks__/expo-localization.js` (legacy compat) + `jest.setup.js` inits i18n before all tests

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
| 6 | `CaptureScreen` WB slider sends temperature to native WB module but expo-camera 55 doesn't support real-time WB control; visible slider value is used only by `applyWhiteBalance` post-capture | LOW | Epic 12.2–12.3 — by design |
| 7 | Pre-existing test failures in `i18n.test.ts` (60) and `OutfitVisualizer.test.tsx` — unrelated to Epic 12, not regressions | MEDIUM | Pre-Epic 12 |

## Bugfix Branch: `fix/premium-gate-and-home-polish` (merged 2026-04-03)

Key fixes applied via per-screen adversarial review (see git history for details):
- **Premium gate:** `onPremiumGate` gating now checks `favorites.size >= FREE_FAVORITES_LIMIT`; badge dynamic; `paywallDismissedThisSession` guard removed
- **Home layout:** `pagingEnabled` replaces `snapToInterval`; symmetric padding; scroll-restore; subtitle → NotoSerifJP 18px
- **Tailwind tokens:** Renamed keys without utility prefixes (`primary` not `"text-primary"`) — fixes `text-primary`, `bg-elevated`, `bg-paper` across 23 files
- **Navigation:** Fade animation on all tabs + stacks; `adjustsFontSizeToFit` on all back buttons
- **Dead code:** Toast JSX removed from Combinations + FavoritesList; premium gate removed from FavoritesList render

## Implemented: v2.0 Redesign (All DONE)

- **Epic 8** — Home v2: wardrobe-first fabric swatches, 2-page paged scroll, shade picker + combo feed (`designs/home-redesign-spec.md`)
- **Epic 9** — Favorites v2: 2-col compact grid, sort pills, shared ComboCard (`designs/favorites-redesign-spec.md`)
- **Story 10.1** — Visualizer: nameEn in WadaHeader, dynamic nav title (`designs/visualizer-adjustments-spec.md`)
- **Design archive:** `designs/pencil-new.pen` — 30+ concepts → v4.1 validated. Deferred: "Do these match?", Wada's Journal

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
