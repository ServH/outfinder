---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
lastStep: 8
status: 'complete'
completedAt: '2026-03-12'
inputDocuments:
  - prd-react-native-ios.md
  - prd-react-native-ios-validation-report.md
  - product-brief-Project1-2026-03-12.md
  - ux-design-specification-ios.md
  - react-native-feature-priorities-2026-03-12.md
  - research/market-color-coordination-pwa-research-2026-03-12.md
  - project-context.md
  - architecture.md
workflowType: 'architecture'
project_name: 'Outfinder'
user_name: 'Alejandro'
date: '2026-03-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
44 FRs across 10 categories. The core architectural pattern is a local JSON lookup engine — a bundled dataset of 159 colors and 348 palettes powers all interactions client-side with zero network dependency. Key FR groups by architectural impact:

- **Color Discovery (FR1-FR4):** Grid rendering of 159 colors organized by 6 swatch families with tab filtering. Implies filterable data structure, performant FlatList rendering, and state for active tab
- **Combination Display (FR5-FR8):** Filtered palettes displayed as horizontal strips with JP/EN names, cross-navigation between colors. Implies graph-like data relationships (color → palettes → colors) and navigation stack management
- **Outfit Visualization (FR9-FR13):** SVG garment silhouettes with dynamic fill, tap-swap color reassignment, garment variant toggle, palette bar. Implies react-native-svg rendering, gesture state machine, and animation layer (Reanimated)
- **Social Sharing (FR14-FR18):** Image generation from Outfit Visualizer view, native Share Sheet, branding overlay ≤5% area, optimized for Instagram Stories 1080×1920. Implies react-native-view-shot or Skia capture, UIActivityViewController integration
- **Favorites & Collections (FR19-FR23):** Save/unsave combinations with local persistence, dedicated Favorites section. Implies AsyncStorage or MMKV layer, state management for favorites set across screens
- **Premium & Monetization (FR24-FR30):** Freemium gate, StoreKit 2 IAP, purchase restore, local premium status cache. Implies StoreKit 2 integration without backend, secure local storage for entitlements
- **Onboarding (FR31-FR33):** 4-slide first-time flow, skip, one-time display. Implies AsyncStorage flag, conditional rendering at app root
- **Accessibility (FR34-FR37):** VoiceOver full support, 44px touch targets, reduce motion, descriptive labels. Implies systematic accessibilityLabel/Role/State props on all components
- **Haptic Feedback (FR38-FR39):** 3-tier haptic vocabulary (.light/.medium/.rigid) via expo-haptics. Implies centralized haptic utility respecting system settings
- **Navigation & Offline (FR40-FR44):** Stack + tab navigation, back stack preservation, full offline, <2s cold start. Implies React Navigation native stack + bottom tabs, bundled JSON, performance optimization

**Non-Functional Requirements:**
27 NFRs across 5 categories driving architectural decisions:

- **Performance (NFR1-NFR8):** Grid render <500ms, combination load <300ms, Visualizer 60fps, cold start <2s, share image <1s, nav transitions <300ms, binary <30MB, memory <150MB. All achievable with bundled JSON + optimized FlatList + Reanimated. Binary budget is the tightest constraint (JSON + SVGs + 2 font families + app code)
- **Security (NFR9-NFR12):** Server-less IAP receipt validation, platform-secure premium storage, zero data collection, "Data Not Collected" privacy label. StoreKit 2's on-device validation enables this without backend
- **Accessibility (NFR13-NFR19):** WCAG 2.1 AA, VoiceOver with meaningful descriptions, state change announcements, 44×44pt targets, Dynamic Type support, Reduce Motion respect, color names always present. Systematic — affects every component
- **Reliability (NFR20-NFR23):** Zero crashes on critical path, identical offline behavior, favorites survive updates, IAP restore works. Implies defensive coding, data migration strategy for AsyncStorage
- **Compatibility (NFR24-NFR27):** iOS 16+, iPhone SE to 16 Pro Max, light mode only MVP, shared images render correctly on social platforms

**Scale & Complexity:**

- Primary domain: Mobile app (React Native iOS, Expo managed)
- Complexity level: Low-medium — JSON lookup engine with no backend, but App Store compliance, IAP integration, SVG rendering, and image generation add implementation complexity
- Estimated architectural components: 13 custom UI components, 2 React Navigation navigators, 1 data layer, 1 storage layer, 1 IAP module, 1 haptics module, 1 share module = ~20 discrete architectural units
- Screen count: 5 (Color Home, Combinations, Outfit Visualizer, Favorites, Settings)

### Technical Constraints & Dependencies

- **Separate project/repository:** Outfinder lives in its own directory/repo, completely separate from Project1 PWA. Clean Expo managed project — no shared code, deps, or configuration
- **Framework pre-selected:** React Native (Expo managed) + TypeScript + NativeWind v4 — confirmed in PRD and UX spec
- **Navigation pre-selected:** React Navigation v7 (native stack + bottom tabs) — confirmed in UX spec
- **Solo developer + Claude Code:** Architecture must minimize moving parts and operational overhead. Expo managed workflow reduces native build complexity
- **iOS only MVP:** iPhone SE 3rd gen to iPhone 16 Pro Max. Portrait only. iOS 16+ minimum. No iPad, no Android for MVP
- **No backend:** All logic runs on device. No server, no API, no database. Network only for: IAP transactions
- **No analytics in MVP:** Privacy label declares "Data Not Collected" — no tracking, no telemetry
- **Light mode only:** Wada's book aesthetic is white pages. Dark mode deferred to post-MVP
- **Dataset immutable:** 159 colors + 348 palettes. Static JSON bundled in binary. No user-generated content. No dynamic data
- **PWA as reference only:** The PWA (Project1) provides validated UX patterns and design tokens — not code to migrate or share
- **Font bundling:** Noto Serif JP + Inter bundled in app binary. No network font loading
- **SVG garments from PWA:** 8 garment SVGs already created in PWA prototype can be adapted (react-native-svg format)

### Cross-Cutting Concerns Identified

- **Offline-first architecture:** No service worker needed — the dataset IS the app. JSON bundled in binary, SVGs bundled, fonts bundled. Only network dependency: StoreKit 2 IAP transactions. Favorites persist locally via AsyncStorage
- **Design token consistency:** Same tokens as PWA (--bg-paper #fafaf8, --hairline-color, --text-primary, etc.) adapted to NativeWind. Critical for maintaining Wada book aesthetic across platform migration
- **Accessibility (WCAG 2.1 AA):** Penetrates every component — VoiceOver labels, 44px targets, Dynamic Type, Reduce Motion. Not a bolt-on — must be built into component patterns from day one. App Store rejection risk without it
- **Performance budget:** <30MB binary (JSON ~60KB + SVGs + 2 fonts + app code), <150MB runtime memory, 60fps in Visualizer. Binary budget is tight — font subsetting and SVG optimization matter
- **Premium entitlement management:** StoreKit 2 without backend. Receipt validation on-device. Premium status cached in secure storage. Restore purchases must work across reinstall/device migration. Affects UI gating (FavoriteButton, PremiumPaywall) and storage layer
- **Share image quality:** react-native-view-shot capture at 1080×1920 for Instagram Stories. Image must look native on social platforms. Branding footer ≤5%. Generation <1s. Affects OutfitMannequin rendering architecture
- **State management surface:** Small but distributed — selected color in navigation params, active tab in component state, favorites set in AsyncStorage (loaded at launch), premium status in secure storage, onboarding flag in AsyncStorage. No global state library justified — React state + context + navigation params sufficient
- **Navigation stack depth:** Cross-navigation builds unlimited stack depth. Memory implications for deep chains. React Navigation handles this natively but worth monitoring

## Starter Template Evaluation

## Starter Template Evaluation

### Primary Technology Domain

Mobile app (React Native iOS, Expo managed workflow) based on project requirements analysis. Offline-first JSON lookup engine with SVG rendering, IAP monetization, and social sharing.

### Starter Options Considered

| Option | Description | Verdict |
|--------|-------------|---------|
| `create-expo-app --template default@sdk-55` | Official Expo starter with TypeScript, minimal boilerplate | **Selected** — always current, full control, no stale dependencies |
| Community NativeWind templates | Pre-configured with NativeWind + Expo Router + shadcn-style components | Include Expo Router (project uses React Navigation), impose opinions, risk of going stale |
| Premium starter kits (native-templates.com) | Production-ready with onboarding, checkout flows | Too opinionated, includes patterns we don't need, paid |

### Selected Starter: `create-expo-app` (Official Expo Template)

**Rationale for Selection:**
- Official Expo template is always aligned with the latest SDK (55)
- Adding dependencies manually ensures only what's needed is included (critical for <30MB binary budget)
- No risk of stale community templates or incompatible dependency versions
- Full control over configuration — important for the Wada aesthetic and specific navigation architecture
- Same approach validated in the PWA project (create vite + manual deps)

**Initialization Command:**

```bash
# Scaffold
npx create-expo-app@latest outfinder --template default@sdk-55
cd outfinder

# Styling
npx expo install nativewind@4.2.2 tailwindcss

# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# Animations & Haptics
npx expo install react-native-reanimated expo-haptics

# SVG & Image
npx expo install react-native-svg react-native-view-shot

# Storage
npx expo install @react-native-async-storage/async-storage expo-secure-store

# Sharing
npx expo install expo-sharing

# In-App Purchases (RevenueCat)
npx expo install react-native-purchases

# Fonts
npx expo install expo-font @expo-google-fonts/noto-serif-jp @expo-google-fonts/inter

# Linting
pnpm add -D @biomejs/biome
pnpm dlx @biomejs/biome init

# Testing
npx expo install -- --save-dev jest @testing-library/react-native @testing-library/jest-native
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript with React 19.2 — Expo SDK 55 default
- React Native 0.83 with New Architecture (mandatory in SDK 55)
- Expo managed workflow — EAS Build for App Store submissions

**Styling Solution:**
- NativeWind 4.2.2 (Tailwind CSS for React Native) — same syntax as PWA's Tailwind CSS 4
- Custom design tokens defined in tailwind.config.js matching PWA tokens (--bg-paper, --hairline, --font-jp, etc.)
- NativeWind 4 stable over v5 preview for production reliability

**Navigation:**
- React Navigation 7.1.33 — native stack + bottom tabs
- NOT Expo Router — React Navigation gives direct control over UINavigationController behavior needed for the cross-navigation pattern
- Native swipe-back gesture, stack-based push/pop, tab-based top-level navigation

**Animation:**
- React Native Reanimated 4.2.2 — spring-based animations, interpolateColor for garment swaps
- Requires react-native-worklets as peer dependency (new in v4)
- Compatible with New Architecture (SDK 55 requirement)

**Build Tooling:**
- EAS Build for iOS App Store submissions (replaces Xcode manual builds)
- EAS Submit for TestFlight and App Store submission automation
- Metro bundler (Expo default) — handles TypeScript, JSON imports, SVG transforms
- Over-the-air updates available via EAS Update (optional, post-MVP)

**Testing Framework:**
- Jest (React Native default test runner) + React Native Testing Library
- Same testing patterns as PWA (Testing Library API), different renderer
- `data-testid` via `testID` prop in React Native

**Linting & Formatting:**
- Biome (same as PWA) — single binary replacing ESLint + Prettier
- Works identically for React Native TypeScript code
- Same biome.json configuration transferable from PWA

**Package Manager:**
- pnpm (consistent with PWA) — compatible with Expo and Metro bundler
- Content-addressable store for disk efficiency

**In-App Purchases:**
- RevenueCat (react-native-purchases) over raw react-native-iap
- Server-side receipt validation without building a backend — critical for solo dev
- Free tier up to $2.5K monthly revenue — well beyond MVP needs
- Built-in Expo Go mock API for development, real StoreKit 2 in development builds
- Handles subscription management, restore purchases, and future Android IAP automatically

**Storage:**
- AsyncStorage for favorites and preferences (simple key-value)
- expo-secure-store for premium entitlement status (Keychain-backed on iOS, satisfies NFR10)
- No SQLite needed — data volume is minimal

**Fonts:**
- Expo Font for bundling Noto Serif JP + Inter in app binary
- No network font loading — offline guaranteed
- expo-google-fonts packages for convenient font file access

**Haptics:**
- expo-haptics wrapping UIImpactFeedbackGenerator
- .light / .medium / .rigid mapping to 3-tier interaction vocabulary

**Sharing:**
- expo-sharing wrapping UIActivityViewController
- Native Share Sheet with zero custom UI

**SVG Rendering:**
- react-native-svg for garment silhouettes in Outfit Visualizer
- Dynamic fill prop for color assignment
- 8 garment SVGs from PWA prototype adaptable to react-native-svg format

**Image Generation:**
- react-native-view-shot for capturing Outfit Visualizer as shareable PNG
- 1080×1920 for Instagram Stories, 1080×1080 for square format

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data import strategy: static ES module import (same as PWA)
- Data structure: pre-computed inverted index (colorHex → Combination[])
- State management: React state + Context (FavoritesContext, PremiumContext)
- Routing: React Navigation 7 with TabNavigator + 3 native stacks
- Storage: AsyncStorage for favorites, expo-secure-store for premium (Keychain)

**Important Decisions (Shape Architecture):**
- IAP management: RevenueCat SDK — server-side validation without backend
- Screen transitions: React Navigation native stack defaults (spring-damped)
- Share flow: react-native-view-shot → expo-sharing (UIActivityViewController)
- CI/CD: GitHub Action for lint/test on PR + EAS Build for iOS binary

**Deferred Decisions (Post-MVP):**
- Cloud sync architecture (Phase 2 — user accounts)
- Analytics platform (post-MVP — TelemetryDeck candidate)
- Android build configuration (3 months post-iOS)
- Dark mode adaptation strategy

### Data Architecture

**Dataset Import: Static ES Module Import**
- Wada dataset (~60KB JSON) imported as static ES module at build time
- Metro bundler includes it in the app binary — no async loading, no loading states
- Rationale: UX spec mandates "there are no loading states in Outfinder"; dataset is small enough for binary budget (<30MB total)

**Data Structure: Pre-computed Inverted Index**
- Raw data: 159 colors + 348 combinations (2-4 colors each)
- Pre-computed at module initialization: `Map<colorHex, Combination[]>`
- Every color lookup is O(1) — guarantees <300ms requirement (NFR2)
- Colors also indexed by swatch group (0-5) for tab filtering

**Data Validation:**
- TypeScript interfaces enforce data shape at compile time
- No runtime validation needed — dataset is static and bundled

**Storage Schema:**

| Key | Type | Storage | Purpose |
|-----|------|---------|---------|
| `@outfinder/favorites` | string[] (combination IDs) | AsyncStorage | Saved favorite combinations |
| `@outfinder/onboarding_seen` | boolean | AsyncStorage | First-time onboarding flow flag |
| `@outfinder/premium_status` | object | expo-secure-store (Keychain) | IAP entitlement cache (NFR10) |

- Favorites loaded at app launch into FavoritesContext — kept in memory during session
- Premium status loaded from SecureStore at launch — RevenueCat SDK verifies when online
- No `activeTab` persistence — UX spec mandates "All" tab default on every fresh app open

### Authentication & Security

**Not applicable for MVP.** No backend, no user accounts, no sensitive data, no API calls. All data is public (Wada's published color combinations) and runs client-side.

**IAP Security:**
- RevenueCat handles receipt validation server-side — no custom backend needed
- Premium status cached in expo-secure-store (iOS Keychain) — resistant to casual inspection (NFR10)
- RevenueCat SDK re-validates entitlements when network available
- Restore purchases: `Purchases.restorePurchases()` — works across reinstall and device migration (NFR23)

**Privacy:**
- App declares "Data Not Collected" on App Store Privacy Label (NFR12)
- No analytics, no tracking, no telemetry in MVP
- No user data stored on external servers (NFR11)

### API & Communication Patterns

**Not applicable for MVP.** Fully client-side application with zero network dependencies for core functionality. The only network calls are:
- RevenueCat SDK entitlement checks (non-blocking, cached locally)
- StoreKit 2 IAP transactions (user-initiated only)

### Frontend Architecture

**State Management: React State + Context**
- Selected color lives in navigation params (`route.params.colorId`) — source of truth for Combinations screen
- Active tab lives in component state (SwatchGroupTabs) — resets on app open per UX spec
- `FavoritesContext` holds Set<combinationId> — loaded from AsyncStorage at launch, persisted on change
- `PremiumContext` holds entitlement status — loaded from SecureStore + RevenueCat at launch
- `useOutfitState` hook manages Outfit Visualizer local state (slot assignments, selected garment, variants)
- No state management library — the state surface is too small to justify a dependency

**Routing: React Navigation 7**

```
TabNavigator (bottom tabs, 3 items)
├── ColorsStack (native stack)
│   ├── ColorHome (root — large title, grid + tabs)
│   ├── Combinations (push — params: colorId)
│   └── OutfitVisualizer (push — params: combinationId)
├── FavoritesStack (native stack)
│   ├── FavoritesList (root — large title, saved PaletteStrips)
│   ├── Combinations (push — reuses same screen component)
│   └── OutfitVisualizer (push — reuses same screen component)
└── SettingsStack (native stack)
    └── Settings (root — premium CTA, app info, preferences)
```

- Cross-navigation: each color tap pushes new Combinations screen to stack
- Back navigation: native swipe-right (UINavigationController via React Navigation native stack)
- Each tab maintains its own independent navigation stack
- Tab bar always visible — SF Symbols: `paintpalette` (Colors), `heart` (Favorites), `gearshape` (Settings)

**Screen Transitions:**
- React Navigation native stack defaults — spring-damped iOS transitions
- No custom transition configuration needed — native stack provides UINavigationController behavior
- All transitions respect `AccessibilityInfo.isReduceMotionEnabled()` — instant when enabled

**Performance Optimization:**
- FlatList for color grid and combination list — native scroll performance
- Reanimated shared values for spring animations — runs on UI thread
- react-native-svg renders on native layer — no JS bridge bottleneck
- Lazy loading: Settings screen (not needed until user navigates there)

### Infrastructure & Deployment

**Distribution: Apple App Store**
- EAS Build for iOS binary compilation (managed workflow, no Xcode project needed)
- EAS Submit for automated TestFlight and App Store submission
- Development builds for real device testing (IAP, haptics, camera)

**CI/CD Pipeline:**
- **Pre-merge checks:** GitHub Action running `biome check` + `jest --ci` + `npx tsc --noEmit`
- **Production builds:** EAS Build triggered manually for release candidates
- **Preview builds:** EAS Build on PR branches for device testing
- No additional CI complexity — solo developer, 5-screen app

**Environment Configuration:**
- `REVENUECAT_API_KEY` (public key, safe in binary) — via expo-constants
- Separate RevenueCat projects for development/production
- No secrets, no backend URLs, no API keys beyond RevenueCat
- `.env.development` / `.env.production` for environment separation

**Monitoring:**
- None in MVP — "Data Not Collected" privacy label commitment
- Post-MVP candidate: TelemetryDeck (privacy-first, App Store compliant)
- Crash reporting: Post-MVP candidate — Sentry or Bugsnag with privacy-compliant configuration

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffold (create-expo-app + all dependencies)
2. NativeWind configuration (tailwind.config.js + design tokens)
3. Data layer (JSON import + inverted index + TypeScript interfaces)
4. Navigation setup (React Navigation 7, TabNavigator + 3 stacks)
5. Core components (ColorSwatch → SwatchGroup → PaletteStrip → CombinationList)
6. Favorites infrastructure (FavoritesContext + AsyncStorage + FavoriteButton)
7. Outfit Visualizer (GarmentSlot → OutfitMannequin → PaletteBar → tap-swap logic)
8. Share flow (SharePreview + react-native-view-shot + expo-sharing)
9. Onboarding (4 slides + AsyncStorage flag)
10. Premium infrastructure (PremiumContext + RevenueCat SDK + PremiumPaywall)
11. Font bundling and optimization
12. CI/CD setup (GitHub Action + EAS Build configuration)
13. App Store assets (icon, screenshots, metadata)

**Cross-Component Dependencies:**
- Data layer must exist before any UI component can render
- Navigation must exist before screen transitions can be implemented
- FavoritesContext must exist before FavoriteButton can function
- PremiumContext must exist before PremiumPaywall can gate features
- OutfitMannequin must be complete before SharePreview can capture images
- RevenueCat configuration must exist before PremiumPaywall can show real prices

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
6 areas where AI agents could make different choices that would cause inconsistency. All patterns below are mandatory for any agent implementing Outfinder.

### Naming Patterns

**Code Naming Conventions:**

| Element | Convention | Example |
|---------|-----------|---------|
| Components (file) | PascalCase | `ColorSwatch.tsx` |
| Components (name) | PascalCase | `export function ColorSwatch()` |
| Hooks | camelCase with `use` prefix | `useOutfitState.ts` |
| Utilities/helpers | camelCase | `buildColorIndex.ts` |
| Types/Interfaces | PascalCase, descriptive | `Color`, `Combination`, `GarmentSlotData` |
| Constants | UPPER_SNAKE_CASE | `SWATCH_GROUPS`, `DEFAULT_TAB` |
| NativeWind tokens | kebab-case CSS custom properties | `--bg-paper`, `--font-jp` |
| Navigation routes | PascalCase (React Navigation convention) | `ColorHome`, `Combinations`, `OutfitVisualizer` |
| Navigation params | camelCase | `colorId`, `combinationId` |
| JSON fields (dataset) | camelCase | `nameJp`, `nameEn`, `hexValue` |
| Test files | same name + `.test` | `ColorSwatch.test.tsx` |
| Context providers | PascalCase + `Provider` | `FavoritesProvider`, `PremiumProvider` |
| AsyncStorage keys | prefixed kebab-case | `@outfinder/favorites` |

### Structure Patterns

**Project Organization: By Type**

Organization by type (not by feature) — consistent with PWA decision. With 5 screens and ~13 components, feature-based organization is over-engineering.

```
src/
├── components/          # 13 custom components
│   ├── ColorSwatch.tsx
│   ├── ColorSwatch.test.tsx
│   ├── SwatchGroup.tsx
│   ├── SwatchGroupTabs.tsx
│   ├── PaletteStrip.tsx
│   ├── CombinationList.tsx
│   ├── ColorHeader.tsx
│   ├── FavoriteButton.tsx
│   ├── OutfitMannequin.tsx
│   ├── GarmentSlot.tsx
│   ├── PaletteBar.tsx
│   ├── SharePreview.tsx
│   ├── PremiumPaywall.tsx
│   └── EmptyState.tsx
├── components/garments/  # SVG garment components (react-native-svg)
│   ├── TopTShirt.tsx
│   ├── TopShirt.tsx
│   ├── BottomPants.tsx
│   ├── BottomSkirt.tsx
│   ├── LayerJacket.tsx
│   ├── LayerHoodie.tsx
│   ├── ShoesSneakers.tsx
│   ├── ShoesFormal.tsx
│   └── index.ts          # Garment registry mapping type → component
├── contexts/             # React Context providers
│   ├── FavoritesContext.tsx
│   └── PremiumContext.tsx
├── data/                 # Dataset and access logic
│   ├── colors.json
│   ├── combinations.json
│   ├── colorIndex.ts     # Inverted index builder + public API
│   ├── colorIndex.test.ts
│   └── types.ts          # Color, Combination, GarmentType interfaces
├── hooks/                # Custom hooks
│   ├── useOutfitState.ts
│   ├── useOutfitState.test.ts
│   └── useReducedMotion.ts
├── lib/                  # Shared utilities
│   ├── haptics.ts        # Centralized haptic feedback (light/medium/rigid)
│   ├── storage.ts        # AsyncStorage + SecureStore wrappers
│   └── share.ts          # Image generation + share flow
├── navigation/           # React Navigation config
│   ├── TabNavigator.tsx
│   ├── ColorsStack.tsx
│   ├── FavoritesStack.tsx
│   └── SettingsStack.tsx
├── screens/              # Screen components (1 per route)
│   ├── ColorHome.tsx
│   ├── ColorHome.test.tsx
│   ├── Combinations.tsx
│   ├── Combinations.test.tsx
│   ├── OutfitVisualizer.tsx
│   ├── OutfitVisualizer.test.tsx
│   ├── FavoritesList.tsx
│   ├── FavoritesList.test.tsx
│   ├── Settings.tsx
│   └── Onboarding.tsx
└── styles/               # NativeWind config + global tokens
    └── theme.ts          # Design token constants for programmatic access
```

**File Structure Rules:**
- Tests co-located: `ColorSwatch.test.tsx` next to `ColorSwatch.tsx`
- One component per file — no barrel exports (`index.ts`) except for garments registry
- `screens/` = route-level screen components, `components/` = reusable pieces
- `contexts/` = React Context definitions with providers
- `navigation/` = React Navigation configuration only — no UI logic
- `lib/` = stateless utility functions (haptics, storage wrappers, share flow)

### Component Patterns

**Standard Component Pattern:**

```typescript
// ✅ CORRECT — function declaration, props interface, named export
interface ColorSwatchProps {
  color: Color
  onSelect: (color: Color) => void
}

export function ColorSwatch({ color, onSelect }: ColorSwatchProps) {
  return (
    <Pressable
      className="h-[62px] w-[62px] rounded"
      style={{ backgroundColor: color.hex }}
      onPress={() => onSelect(color)}
      accessibilityLabel={`${color.nameEn}, ${color.combinationCount} combinations`}
      accessibilityRole="button"
    >
      {/* Color fill only */}
    </Pressable>
  )
}
```

**Component Rules:**
- `function` declarations, not arrow functions for components
- Named exports always, never `export default`
- Props interface separated, named `{ComponentName}Props`
- NativeWind `className` for static styles — `style={{}}` only for dynamic values (Wada colors)
- `accessibilityLabel` mandatory on every interactive element
- `accessibilityRole` mandatory on every interactive element
- `testID` on elements that need test targeting

**Anti-Patterns:**
- ❌ Arrow functions for component definitions
- ❌ `export default`
- ❌ Inline type annotations on props
- ❌ `StyleSheet.create()` — use NativeWind `className` instead
- ❌ Missing `accessibilityLabel` on interactive elements
- ❌ Hooks called after early returns

### Data Access Patterns

**Pure Module + Direct Import (no hooks for static data):**

```typescript
// data/colorIndex.ts — pure module, no React
import colorsData from './colors.json'
import combinationsData from './combinations.json'

// Pre-computed at module load
const colorMap = new Map<string, Color>(/*...*/)
const colorToCombinations = new Map<string, Combination[]>(/*...*/)
const colorsBySwatchGroup = new Map<number, Color[]>(/*...*/)

// Public API — pure functions
export function getColor(colorId: string): Color | undefined
export function getCombinations(colorId: string): Combination[]
export function getColorsByGroup(group: number): Color[]
export function getAllColors(): Color[]
```

**Data Access Rules:**
- Do NOT create hooks for static data access — hooks are for reactive state
- Import data functions directly in components
- The dataset is immutable — pure functions are sufficient
- All lookups use the pre-computed inverted index (O(1))

### Styling Patterns

**NativeWind & Style Strategy:**

| Case | Approach | Example |
|------|---------|---------|
| Dynamic color backgrounds | `style={{ backgroundColor }}` | Wada swatch colors — must be inline |
| Layout and spacing | NativeWind `className` | `className="flex-1 gap-4 p-6"` |
| Design tokens | Theme constants in `styles/theme.ts` | `colors.bgPaper`, `colors.textPrimary` |
| Conditional classes | Template literal or ternary | `className={isActive ? "bg-elevated" : "bg-paper"}` |
| Animations | Reanimated shared values | `useAnimatedStyle(() => ({ transform: [{ scale }] }))` |
| Touch feedback | `Pressable` with `className` active state | `className="active:opacity-80"` |

**Styling Rules:**
- Never `StyleSheet.create()` — NativeWind `className` for all static styles
- Wada color values always via `style={{ backgroundColor: color.hex }}` — never NativeWind arbitrary values for dynamic colors
- Design tokens from UX spec defined in `tailwind.config.js` as custom theme values
- Programmatic token access via `styles/theme.ts` constants (for non-JSX contexts like Reanimated)

### Accessibility Patterns

**Standard Accessibility Pattern:**

```typescript
// ✅ CORRECT — all a11y props present
<Pressable
  accessibilityLabel={`${color.nameEn}, ${color.combinationCount} combinations`}
  accessibilityRole="button"
  accessibilityState={{ selected: isSelected }}
  onPress={handlePress}
>
```

**Accessibility Rules:**
- `accessibilityLabel` on ALL interactive elements — descriptive, not technical
- `accessibilityRole` on ALL interactive elements — `button`, `link`, `tab`, `image`
- `accessibilityState` on toggles and tabs — `{ selected }`, `{ checked }`
- `accessibilityHint` sparingly — only for non-obvious actions
- `accessibilityLiveRegion="polite"` on dynamic count updates
- Check `AccessibilityInfo.isReduceMotionEnabled()` — disable all animations when true
- All text: `allowFontScaling={true}` (NativeWind default)

### Process Patterns

**Error Handling:**
- Try/catch on all native API calls (haptics, share, IAP, storage)
- Don't assume APIs always succeed — expo-haptics may fail silently, that's OK
- RevenueCat errors: catch and show user-friendly message, never crash
- Storage errors: catch and log, use fallback defaults
- No error boundaries in MVP — there are no network calls that can fail in core flow

**Loading States:**
- There are NO loading states in Outfinder core flow — dataset is bundled
- Only potential loading: IAP product info from RevenueCat — show placeholder price until loaded
- Share image generation (~100ms) — no spinner, Share Sheet appears when ready

**Haptic Feedback (centralized in `lib/haptics.ts`):**

```typescript
// lib/haptics.ts
import * as Haptics from 'expo-haptics'

export async function hapticLight() {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) } catch {}
}
export async function hapticMedium() {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) } catch {}
}
export async function hapticRigid() {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid) } catch {}
}
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow naming conventions exactly as specified — no variations
2. Place files in the correct directory per the structure pattern
3. Use function declarations with named exports for all components
4. Access dataset via `data/colorIndex.ts` pure functions, never direct JSON import in components
5. Use NativeWind `className` for styling, `style={}` only for dynamic Wada colors
6. Include `accessibilityLabel` and `accessibilityRole` on every interactive element
7. Co-locate tests next to source files
8. Respect `AccessibilityInfo.isReduceMotionEnabled()` for all animations
9. Use centralized `lib/haptics.ts` — never call expo-haptics directly in components
10. Wrap all native API calls in try/catch

**Pattern Enforcement:**
- Biome lint configuration enforces naming conventions and import patterns
- `npx tsc --noEmit` in CI catches type errors
- Code review checklist (CLAUDE.md rules) should verify pattern compliance
- Any new component must follow the standard component pattern template

## Project Structure & Boundaries

### Complete Project Directory Structure

**CRITICAL: Outfinder lives in its OWN directory, completely separate from Project1 (the PWA). No shared code, dependencies, or configuration.**

```
outfinder/                              # SEPARATE project root — NOT inside Project1
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.js                  # NativeWind 4 config + Wada design tokens
├── nativewind-env.d.ts                 # NativeWind TypeScript declarations
├── metro.config.js                     # Metro bundler config (NativeWind + SVG)
├── app.json                            # Expo app config (name, slug, version, ios)
├── babel.config.js                     # Babel config (NativeWind + Reanimated plugins)
├── biome.json                          # Biome linter config (same rules as PWA)
├── .env.development                    # RevenueCat dev API key
├── .env.production                     # RevenueCat prod API key
├── .env.example                        # Template for env vars
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                      # lint + test + tsc on PR
├── eas.json                            # EAS Build profiles (dev, preview, production)
├── App.tsx                             # Entry point: providers + navigation
├── src/
│   ├── components/                     # 13 custom UI components
│   │   ├── ColorSwatch.tsx
│   │   ├── ColorSwatch.test.tsx
│   │   ├── SwatchGroup.tsx
│   │   ├── SwatchGroup.test.tsx
│   │   ├── SwatchGroupTabs.tsx
│   │   ├── SwatchGroupTabs.test.tsx
│   │   ├── PaletteStrip.tsx
│   │   ├── PaletteStrip.test.tsx
│   │   ├── CombinationList.tsx
│   │   ├── CombinationList.test.tsx
│   │   ├── ColorHeader.tsx
│   │   ├── ColorHeader.test.tsx
│   │   ├── FavoriteButton.tsx
│   │   ├── FavoriteButton.test.tsx
│   │   ├── OutfitMannequin.tsx
│   │   ├── OutfitMannequin.test.tsx
│   │   ├── GarmentSlot.tsx
│   │   ├── GarmentSlot.test.tsx
│   │   ├── PaletteBar.tsx
│   │   ├── PaletteBar.test.tsx
│   │   ├── SharePreview.tsx
│   │   ├── SharePreview.test.tsx
│   │   ├── PremiumPaywall.tsx
│   │   ├── PremiumPaywall.test.tsx
│   │   └── EmptyState.tsx
│   ├── components/garments/            # SVG garment silhouettes (react-native-svg)
│   │   ├── TopTShirt.tsx
│   │   ├── TopShirt.tsx
│   │   ├── BottomPants.tsx
│   │   ├── BottomSkirt.tsx
│   │   ├── LayerJacket.tsx
│   │   ├── LayerHoodie.tsx
│   │   ├── ShoesSneakers.tsx
│   │   ├── ShoesFormal.tsx
│   │   └── index.ts                    # Garment registry: type → component mapping
│   ├── contexts/                       # React Context providers
│   │   ├── FavoritesContext.tsx
│   │   ├── FavoritesContext.test.tsx
│   │   └── PremiumContext.tsx
│   ├── data/                           # Static dataset + access logic
│   │   ├── colors.json                 # 159 colors (from PWA, same format)
│   │   ├── combinations.json           # 348 combinations (from PWA, same format)
│   │   ├── colorIndex.ts               # Inverted index builder + public API
│   │   ├── colorIndex.test.ts
│   │   └── types.ts                    # Color, Combination, GarmentType, SlotData
│   ├── hooks/                          # Custom hooks
│   │   ├── useOutfitState.ts
│   │   ├── useOutfitState.test.ts
│   │   └── useReducedMotion.ts
│   ├── lib/                            # Stateless utility functions
│   │   ├── haptics.ts                  # Centralized haptic feedback (light/medium/rigid)
│   │   ├── storage.ts                  # AsyncStorage + SecureStore wrappers
│   │   └── share.ts                    # react-native-view-shot + expo-sharing flow
│   ├── navigation/                     # React Navigation configuration
│   │   ├── TabNavigator.tsx            # Bottom tabs: Colors, Favorites, Settings
│   │   ├── ColorsStack.tsx             # ColorHome → Combinations → OutfitVisualizer
│   │   ├── FavoritesStack.tsx          # FavoritesList → Combinations → OutfitVisualizer
│   │   └── SettingsStack.tsx           # Settings (single screen)
│   ├── screens/                        # Route-level screen components
│   │   ├── ColorHome.tsx
│   │   ├── ColorHome.test.tsx
│   │   ├── Combinations.tsx
│   │   ├── Combinations.test.tsx
│   │   ├── OutfitVisualizer.tsx
│   │   ├── OutfitVisualizer.test.tsx
│   │   ├── FavoritesList.tsx
│   │   ├── FavoritesList.test.tsx
│   │   ├── Settings.tsx
│   │   └── Onboarding.tsx
│   └── styles/                         # Design tokens
│       └── theme.ts                    # Programmatic token access for Reanimated
├── assets/                             # Static assets
│   ├── fonts/                          # Noto Serif JP + Inter font files
│   ├── icon.png                        # App icon (1024×1024)
│   ├── splash.png                      # Splash screen
│   └── onboarding/                     # Onboarding slide images
└── docs/
    └── project-context.md              # Outfinder project context for AI agents
```

### Architectural Boundaries

```
┌─────────────────────────────────────────────────────┐
│                    App.tsx                           │
│  (FavoritesProvider → PremiumProvider → Navigator)  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ ColorsStack  │  │FavoritesStack│  │ Settings  │ │
│  │              │  │              │  │   Stack   │ │
│  │ ColorHome    │  │ FavoritesList│  │           │ │
│  │  ↓ push      │  │  ↓ push      │  │ Settings  │ │
│  │ Combinations │  │ Combinations │  │           │ │
│  │  ↓ push      │  │  ↓ push      │  └───────────┘ │
│  │ OutfitVis.   │  │ OutfitVis.   │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│               Component Layer                       │
│  ColorSwatch  SwatchGroup  PaletteStrip  ColorHeader│
│  OutfitMannequin  GarmentSlot  PaletteBar           │
│  FavoriteButton  SharePreview  PremiumPaywall        │
├─────────────────────────────────────────────────────┤
│               Data & Logic Layer                    │
│  colorIndex.ts   FavoritesContext   PremiumContext   │
│  useOutfitState   useReducedMotion                   │
├─────────────────────────────────────────────────────┤
│               Infrastructure Layer                  │
│  haptics.ts    storage.ts    share.ts               │
│  AsyncStorage  SecureStore   RevenueCat             │
│  expo-haptics  expo-sharing  view-shot              │
└─────────────────────────────────────────────────────┘
```

**Boundary Rules:**
- Screens import components — never the reverse
- Components import from `data/`, `hooks/`, `lib/` — never from `screens/` or `navigation/`
- `navigation/` imports from `screens/` only — never from `components/`
- `contexts/` provides state — consumed via `useContext()` in screens and components
- `lib/` functions are stateless — no React imports, no hooks
- `data/` functions are pure — no side effects, no storage calls
- SVG garment components (`components/garments/`) accessed only via registry `index.ts`

### Requirements to Structure Mapping

**FR Category → Files:**

| FR Category | Primary Files | Supporting Files |
|-------------|---------------|------------------|
| Color Discovery (FR1-FR4) | `screens/ColorHome.tsx` | `components/ColorSwatch.tsx`, `SwatchGroup.tsx`, `SwatchGroupTabs.tsx`, `data/colorIndex.ts` |
| Combination Display (FR5-FR8) | `screens/Combinations.tsx` | `components/PaletteStrip.tsx`, `CombinationList.tsx`, `ColorHeader.tsx`, `data/colorIndex.ts` |
| Outfit Visualization (FR9-FR13) | `screens/OutfitVisualizer.tsx` | `components/OutfitMannequin.tsx`, `GarmentSlot.tsx`, `PaletteBar.tsx`, `hooks/useOutfitState.ts`, `components/garments/*` |
| Social Sharing (FR14-FR18) | `lib/share.ts` | `components/SharePreview.tsx`, `screens/OutfitVisualizer.tsx` |
| Favorites (FR19-FR23) | `screens/FavoritesList.tsx` | `contexts/FavoritesContext.tsx`, `components/FavoriteButton.tsx`, `lib/storage.ts` |
| Premium (FR24-FR30) | `contexts/PremiumContext.tsx` | `components/PremiumPaywall.tsx`, `screens/Settings.tsx`, `lib/storage.ts` |
| Onboarding (FR31-FR33) | `screens/Onboarding.tsx` | `lib/storage.ts` |
| Accessibility (FR34-FR37) | All components | `hooks/useReducedMotion.ts` |
| Haptics (FR38-FR39) | `lib/haptics.ts` | All interactive components |
| Navigation (FR40-FR44) | `navigation/*` | All screens |

**NFR Coverage:**

| NFR Category | Architectural Support |
|-------------|----------------------|
| Performance (NFR1-8) | FlatList native scroll, Reanimated UI thread animations, bundled JSON O(1) lookups, lazy Settings screen |
| Security (NFR9-12) | expo-secure-store (Keychain), RevenueCat server-side validation, zero data collection |
| Accessibility (NFR13-19) | Mandatory a11y props in component pattern, useReducedMotion hook, Dynamic Type via NativeWind |
| Reliability (NFR20-23) | Defensive try/catch on native APIs, offline-first bundled data, AsyncStorage persistence |
| Compatibility (NFR24-27) | iOS 16+ in app.json, safe area handling, light mode only, responsive layout |

### Data Flow

**Primary User Flow:**

```
User taps color (ColorHome)
  → hapticLight()
  → navigation.push('Combinations', { colorId })
  → getCombinations(colorId)  // O(1) lookup
  → FlatList renders PaletteStrip[]
  → User taps "Try outfit"
  → navigation.push('OutfitVisualizer', { combinationId })
  → useOutfitState initializes slots with combination colors
  → User taps garment → swaps color → hapticMedium()
  → User taps share → captureRef() → Sharing.shareAsync()
```

**Favorites Flow:**

```
User taps heart (FavoriteButton)
  → hapticLight()
  → FavoritesContext.toggle(combinationId)
  → AsyncStorage.setItem('@outfinder/favorites', [...])
  → UI updates via context re-render
```

**Premium Flow:**

```
App launch
  → PremiumContext loads from SecureStore
  → RevenueCat.getCustomerInfo() verifies (when online)
  → Premium gates: FavoriteButton (>5 limit), outfit saving
User taps "Unlock Premium"
  → PremiumPaywall shows RevenueCat offering
  → User completes IAP → PremiumContext updates → SecureStore caches
```

### Integration Points

| Integration | Library | Direction | Boundary |
|------------|---------|-----------|----------|
| In-App Purchases | react-native-purchases (RevenueCat) | Outbound (IAP verify) | `contexts/PremiumContext.tsx` |
| Haptic Feedback | expo-haptics | Local (device) | `lib/haptics.ts` |
| Social Sharing | expo-sharing | Outbound (UIActivityVC) | `lib/share.ts` |
| Image Capture | react-native-view-shot | Local (capture) | `lib/share.ts` |
| Secure Storage | expo-secure-store | Local (Keychain) | `lib/storage.ts` |
| Async Storage | @react-native-async-storage | Local (UserDefaults) | `lib/storage.ts` |
| SVG Rendering | react-native-svg | Local (render) | `components/garments/*` |
| Animations | react-native-reanimated | Local (UI thread) | Components directly |
| Fonts | expo-font | Local (binary) | `App.tsx` (loaded at launch) |

### Development Workflow

**Commands:**

```bash
# Development
pnpm start                  # Start Metro bundler
pnpm ios                    # Run on iOS simulator
pnpm test                   # Jest test suite
pnpm lint                   # Biome check
npx tsc --noEmit            # Type check

# Building
eas build --profile development --platform ios   # Dev build (real device)
eas build --profile preview --platform ios       # Preview build (TestFlight)
eas build --profile production --platform ios    # Production build (App Store)

# Submission
eas submit --platform ios   # Submit to App Store Connect
```

**CI Pipeline (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: npx tsc --noEmit
      - run: pnpm test -- --ci
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices validated as compatible: Expo SDK 55 (New Architecture only) works with Reanimated 4.2.2, NativeWind 4.2.2, React Navigation 7.1.33, react-native-svg, and react-native-view-shot. RevenueCat SDK provides server-side IAP validation without a backend, consistent with the zero-backend constraint. expo-secure-store (Keychain) for premium status and AsyncStorage for favorites correctly separate security concerns.

**Pattern Consistency:**
All implementation patterns align with technology choices — NativeWind className for styling (not StyleSheet.create), function declarations with named exports, pure data access functions (not hooks), centralized haptics in lib/haptics.ts with try/catch. Patterns reinforce CLAUDE.md agent discipline rules (a11y first, testing discipline, error handling).

**Structure Alignment:**
Project structure supports all architectural decisions — by-type organization with co-located tests, clear boundary rules (screens → components → data/hooks/lib), garment registry pattern, separate navigation directory. The outfinder/ root is completely separate from Project1.

### Requirements Coverage ✅

**Functional Requirements (44/44 covered):**
All 10 FR categories mapped to specific files and directories. Color Discovery → ColorHome + ColorSwatch + SwatchGroup + colorIndex. Combination Display → Combinations + PaletteStrip + CombinationList. Outfit Visualization → OutfitVisualizer + OutfitMannequin + GarmentSlot + useOutfitState. Social Sharing → share.ts + SharePreview. Favorites → FavoritesList + FavoritesContext + FavoriteButton. Premium → PremiumContext + PremiumPaywall. Onboarding → Onboarding screen. Accessibility → all components (mandatory pattern). Haptics → haptics.ts. Navigation → TabNavigator + 3 stacks.

**Non-Functional Requirements (27/27 covered):**
Performance → FlatList, Reanimated UI thread, O(1) lookups, lazy loading. Security → SecureStore, RevenueCat, zero data collection. Accessibility → mandatory component pattern, useReducedMotion. Reliability → try/catch, offline-first, AsyncStorage persistence. Compatibility → iOS 16+, safe areas, light mode only.

### Implementation Readiness ✅

**Decision Completeness:** All critical decisions documented with exact version numbers. Initialization command provided. Storage schema defined. Navigation tree specified. CI/CD pipeline documented.

**Pattern Completeness:** 6 conflict points identified and resolved with explicit rules. Code examples provided for component pattern, data access, styling, accessibility, haptics. Anti-patterns listed.

**Structure Completeness:** Complete file tree with every file named. Boundary rules defined. FR-to-file mapping complete. Integration points table with library, direction, and boundary file.

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed (44 FRs, 27 NFRs)
- [x] Scale and complexity assessed (low-medium, ~20 architectural units)
- [x] Technical constraints identified (no backend, iOS only, solo dev, separate repo)
- [x] Cross-cutting concerns mapped (offline, a11y, tokens, performance, premium, sharing, state)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions (Expo 55, NativeWind 4.2.2, RN 7.1.33, Reanimated 4.2.2)
- [x] Technology stack fully specified (15 dependencies with exact versions)
- [x] Integration patterns defined (RevenueCat, expo-haptics, expo-sharing, view-shot, storage)
- [x] Performance considerations addressed (FlatList, Reanimated, O(1) lookup, <30MB binary)

**✅ Implementation Patterns**

- [x] Naming conventions established (8 element types with conventions)
- [x] Structure patterns defined (by-type, co-located tests, boundary rules)
- [x] Component patterns specified (function declarations, named exports, Props interface, a11y mandatory)
- [x] Process patterns documented (error handling, loading states, haptic centralization)

**✅ Project Structure**

- [x] Complete directory structure defined (every file named)
- [x] Component boundaries established (import direction rules)
- [x] Integration points mapped (9 external integrations with boundary files)
- [x] Requirements to structure mapping complete (44 FRs → specific files)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH — all requirements mapped, all decisions compatible, patterns comprehensive with examples

**Key Strengths:**

- Zero-backend simplicity — all logic client-side, only RevenueCat for IAP
- PWA-validated UX patterns provide proven design reference
- Same tooling ecosystem (Biome, pnpm, Testing Library, Tailwind tokens) reduces cognitive overhead
- Comprehensive a11y pattern built into component template — not an afterthought
- Clear boundary rules prevent architectural drift during implementation

**Areas for Future Enhancement:**

- Data migration strategy if storage schema evolves (post-MVP)
- Dark mode adaptation when implemented
- Android build configuration (3 months post-iOS launch)
- Analytics integration (TelemetryDeck candidate)
- OTA updates via EAS Update
- Deep linking for marketing/sharing flows

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundary rules
- Refer to this document for all architectural questions
- Initialize Outfinder in a SEPARATE directory from Project1 — never inside the PWA project

**First Implementation Priority:**
Run the initialization command from the Starter Template Evaluation section to scaffold the outfinder/ project with all dependencies.
