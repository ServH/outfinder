---
type: bmad-distillate
sources:
  - "project-context.md"
downstream_consumer: "dev story implementation"
created: "2026-04-09"
token_estimate: 1820
parts: 1
---

## Stack
- React Native 0.83 + TypeScript; Expo SDK 55 managed workflow
- NativeWind 4.2.2; React Navigation 7 (native stacks); Reanimated 4.2.2
- @shopify/react-native-skia 2.5.1 (Canvas, ColorMatrix, RadialGradient)
- react-native-view-shot 4.0.3; expo-sharing ~55.0.11
- expo-symbols (SF Symbols); AsyncStorage (favorites); RevenueCat react-native-purchases (IAP)
- expo-secure-store (premium cache); react-i18next + i18next (EN/ES, sync init via Intl.DateTimeFormat)
- Biome 2.4.6 (tabs, double quotes); Jest ~29.7.0 + jest-expo + RNTL
- Fonts: Noto Serif JP (Regular/Medium) + Inter (Regular/Medium) via expo-font

## Architecture
- Client-side only; no backend/API/DB; ~60KB static JSON bundled at build time
- Offline-first; iOS + iPadOS; portrait only
- iPhone SE 3rd gen → iPhone 16 Pro Max + iPad Air/Pro (768pt+ breakpoint)
- Entry: App.tsx at root (NOT expo-router — migrated Story 1.2)

## Status
- Epic 1–9: DONE; Story 10.1: DONE
- Epic 11 IN-PROGRESS: 11.1 (coach marks + permanent arrows) DONE; 11.2 (EN/ES i18n, 135 keys) DONE; 11.3a (iPad: ColorHome, Favorites, OutfitVisualizer) DONE; 11.3b (iPad: Combinations, Settings, BrowseAllColors, SwatchGroup numColumns) DONE
- Tests: 539 across 37 suites (all passing)
- App Store: v1.0.0 (2026-03-26), v1.0.1, v1.0.2 build 4 live; version bump to 1.1.0 build 3 committed

## File Structure (key paths)
- App.tsx — font loading, FavoritesProvider, NavigationContainer, TabNavigator
- src/components/ColorSwatch.tsx — 62×62px Pressable, Reanimated spring scale 1.05x, pale border detection
- src/components/SwatchGroupTabs.tsx — horizontal ScrollView, 7 tabs, hapticLight on tap
- src/components/SwatchGroup.tsx — FlatList, numColumns default 5 / 7 on iPad, gap/padding scale with numColumns
- src/components/PaletteStrip.tsx — 2-4 color rects, cross-nav, haptics, selected dot, FavoriteButton
- src/components/CombinationList.tsx — FlatList of PaletteStrips, 24px spacing + dividers
- src/components/TintedGarment.tsx — Skia Canvas + ColorMatrix tinting
- src/components/OutfitCard.tsx — editorial card, stacked TintedGarments, tap-swap, variant toggle
- src/components/WarmBackground.tsx — full-screen Skia warm radial gradient
- src/components/Aureola.tsx — radial glow behind card using dominant color
- src/components/WadaHeader.tsx — JP combo name + "N colors · Sanzo Wada" subtitle
- src/components/MiniPaletteStrip.tsx — thin horizontal strip + names below card
- src/components/ComboCard.tsx — full + compact: color strip, "yours" label, heart, "See outfit" pill
- src/components/FavoriteButton.tsx — heart toggle, spring animation, hapticLight, a11y, configurable size
- src/components/garments/index.ts — GARMENT_REGISTRY, GarmentType union, GarmentConfig
- src/contexts/FavoritesContext.tsx — useFavorites(): toggle/isFavorite/favorites Set/count; AsyncStorage @outfinder/favorites
- src/contexts/PremiumContext.tsx — usePremium(): RevenueCat IAP, SecureStore cache, purchase/restore, isPremium/isLoading
- src/data/types.ts — Color, Combination, SwatchGroup types
- src/data/colors.json — 159 Wada colors (hex, nameJp, nameEn, id, swatchGroup, combinationCount)
- src/data/combinations.json — 348 Wada palettes (id, colorIds[], nameJp, nameEn)
- src/data/colorIndex.ts — pre-computed Map indexes: getColor, getCombination, getCombinations, getColorsByGroup, getAllColors, getAllCombinations; O(1)
- src/hooks/useOutfitState.ts — slots, selectedSlotIndex, selectSlot (tap-swap), toggleVariant
- src/hooks/usePremiumGate.ts — paywall trigger, IAP error messages via i18n.t()
- src/hooks/useReducedMotion.ts — AccessibilityInfo.isReduceMotionEnabled() + listener
- src/i18n/index.ts — sync init (initAsync: false), detectLanguage() via Intl.DateTimeFormat, exports i18n instance
- src/i18n/types.ts — TranslationKey flat type + AssertSameKeys (en↔es parity at build time)
- src/i18n/locales/en.json — ~140 keys, 22 namespaces
- src/i18n/locales/es.json — same structure, parity enforced
- src/lib/color.ts — isLightColor(hex): luminance-based
- src/lib/device.ts — useIsIPad() (768pt), isIPad() static, useFavoritesNumCols() (1024pt)
- src/lib/haptics.ts — hapticLight/hapticMedium/hapticRigid, all try/catch + .catch()
- src/lib/share.ts — captureShareImage(viewRef) + shareOutfit(viewRef)
- src/navigation/types.ts — ColorsStackParamList, FavoritesStackParamList, SettingsStackParamList, TabParamList
- src/navigation/TabNavigator.tsx — 3 tabs: Colors/paintpalette, Favorites/heart, Settings/gearshape
- src/screens/ColorHome.tsx — 159 colors grid + tab filtering
- src/screens/Combinations.tsx — ColorHeader + CombinationList
- src/screens/OutfitVisualizer.tsx — Skia tinting, editorial card, coach marks, permanent arrows, share, haptics, VoiceOver
- src/screens/FavoritesList.tsx — saved combos, CombinationList reuse, EmptyState
- src/screens/BrowseAllColors.tsx — full color catalog grid
- src/screens/Settings.tsx — version, privacy links, restore purchases, contact
- src/styles/theme.ts — 16 Wada design token constants (camelCase)
- tailwind.config.js — 16 Wada tokens, font families, 8px spacing scale
- __mocks__/react-native-reanimated.js — manual Reanimated v4 Jest mock
- __mocks__/@shopify/react-native-skia.js — manual Skia mock (renders as Views with testIDs)
- __mocks__/react-native-view-shot.js — returns "file:///mock-path.png"
- __mocks__/expo-localization.js — returns en locale
- jest.setup.js — global i18n init before all tests

## Patterns — MUST Follow

### Components
- Named exports only (exception: App.tsx); `export default` NEVER used
- Props interface: `interface {ComponentName}Props` or `type Props = Record<string, never>`
- NativeWind `className` for static styles; NEVER StyleSheet.create
- `style={{}}` ONLY for dynamic Wada color values
- Co-located tests: Component.test.tsx next to Component.tsx

### Garment System
- GARMENT_REGISTRY sole source of truth; each entry: `{ image: require(), label: string, heightHint: number }`
- TintedGarment applies Skia ColorMatrix to white-on-transparent PNGs
- Add garment: PNG + registry entry + optional variant pair — no component changes

### Share Flow
- Captures on-screen Skia content directly (NOT off-screen duplicate)
- shareViewRef wraps: WarmBackground + Aureola + WadaHeader + OutfitCard + MiniPaletteStrip + branding
- Share button: absolute overlay `bottom: 48` outside capture area
- PixelRatio.get() for device-native resolution; `collapsable={false}` on capturable View
- Branding text inside capture area (subtle, #a09080)

### NativeWind + Pressable (CRITICAL)
- NativeWind 4 compiles className into style prop — conflicts with Pressable's `({ pressed }) => style` function
- Fix: `className` on Pressable for layout only; dynamic styles on child View via render-function children

### Data Access
- Import from `@/data/colorIndex` — pure functions, no hooks, no state/effects/loading
- O(1) Map lookups: getColor, getCombination, getCombinations, getColorsByGroup, getAllColors, getAllCombinations

### Haptics
- Always via `@/lib/haptics`; NEVER import expo-haptics directly
- hapticLight: selection (tab switch, favorite toggle); hapticMedium: swap/change; hapticRigid: confirm/action

### Animations
- Always check `useReducedMotion()` before any animation; skip entirely when enabled
- Reanimated spring: `withSpring(1.05, { damping: 15, stiffness: 150 })`

### Navigation
- Use `push()` not `navigate()` to allow stacking multiple instances
- Type: `NativeStackNavigationProp<ColorsStackParamList, "ColorHome">`

### Accessibility
- accessibilityLabel on all interactive elements; accessibilityRole ("button"/"tab"/"link")
- accessibilityState={{ selected }} on tabs; accessibilityElementsHidden on decorative content
- 44px min touch targets (48px preferred: `min-h-[48px]`)
- Color never conveyed by color alone — names always present

### Testing
- Jest ~29.7.0 + jest-expo (NOT Jest 30.x — incompatible with Expo SDK 55)
- `pnpm test -- --ci` FAILS; use `npx jest --ci` in CI
- FlatList virtualizes — test via `data` prop, not item count
- testID (not data-testid); getAllByText when text appears in visible + off-screen elements
- includeHiddenElements: true inside accessibilityElementsHidden wrappers
- Mock @react-navigation/native for nav tests; mock @/lib/haptics for haptic verification

### i18n
- `import "./src/i18n"` MUST be first line in App.tsx
- In components: `const { t } = useTranslation()`
- Outside components: `import { i18n } from "@/i18n"` → `i18n.t("key")`
- Wada names (nameJp, nameEn) NEVER through t() — always raw
- "Outfinder" brand NOT in translation files
- detectLanguage(): Intl.DateTimeFormat().resolvedOptions().locale — NOT expo-localization
- TranslationKey type + AssertSameKeys catches missing keys at build time

### Git
- Epic branches: epic-N; story branches: story-X.Y-description (flat, NOT epic-N/story-X.Y)
- Commit: `feat: <description> (Story X.Y)`, `fix: code review — <details> (Story X.Y)`

## Technical Debt
- biome.json CSS @tailwind overrides workaround — LOW (Biome 2.4.6 bug)
- Reanimated mock createAnimatedComponent uses identity function — LOW
- usePremiumGate exports dead toast state (toastVisible/toastOpacity/showToast) — LOW
- ColorHome handleScroll uses useNativeDriver: false — LOW
- No StoreKit config file for simulator IAP testing — MEDIUM (real device + sandbox only)

## Tailwind Tokens (Critical)
- Token keys must NOT include utility prefixes — use `primary` not `"text-primary"`; `bg-elevated` pattern fixed across 23 files in bugfix branch

## Swatch Groups
- 0: Pale & Light; 1: Red & Brown; 2: Blue & Lavender; 3: Dark & Deep; 4: Vivid & Bold; 5: Green & Olive

## iPad Layout
- useIsIPad(): 768pt breakpoint; useFavoritesNumCols(): 1024pt breakpoint
- SwatchGroup numColumns: default 5, 7 on iPad
