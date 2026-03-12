---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - prd-react-native-ios.md
  - architecture-react-native-ios.md
  - ux-design-specification-ios.md
---

# Outfinder - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Outfinder (React Native iOS), decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can view all 159 Wada colors displayed as a visual grid
FR2: User can filter colors by swatch family (6 groups) using tab navigation
FR3: User can tap a color to view all Wada palettes containing that color
FR4: User can scroll through the color grid to browse all available colors
FR5: User can view all palettes for a selected color as horizontal palette strips
FR6: User can see the Japanese and English name for each palette
FR7: User can tap any color within a palette to cross-navigate to that color's combinations
FR8: User can navigate back to the previous color's combinations after cross-navigating
FR9: User can open the Outfit Visualizer from any palette to see colors rendered as garment silhouettes
FR10: User can tap-swap colors between garment slots to reassign which color goes to which garment
FR11: User can toggle garment types (e.g., swap a sweater for a t-shirt, pants for a skirt)
FR12: User can see the palette bar with color assignments that updates as garments are swapped
FR13: User can visualize palettes of 2, 3, or 4 colors with appropriate garment combinations
FR14: User can generate a shareable image of the current outfit visualization
FR15: User can share the generated image via the device's native sharing interface (Instagram, TikTok, Messages, etc.)
FR16: Shared images include Outfinder branding (logo or watermark) occupying no more than 5% of image area, without obscuring the outfit visualization
FR17: Shared images are optimized for Instagram Stories dimensions (1080x1920)
FR18: User can complete the share flow in 2 taps or fewer from the Visualizer
FR19: User can save a color combination to Favorites
FR20: User can unsave a previously saved combination
FR21: User can view all saved favorites in a dedicated Favorites section
FR22: Favorites persist across app sessions via local storage
FR23: User can access Favorites from the main navigation
FR24: User can access the core color lookup and Outfit Visualizer for free (free tier)
FR25: User encounters a soft paywall when attempting to save more than 5 favorites (soft gate — first 5 free, paywall on 6th save)
FR26: User can view premium tier benefits and pricing from the paywall
FR27: User can subscribe to premium via iOS In-App Purchase (StoreKit 2)
FR28: User can complete the purchase flow using Face ID / Apple Pay
FR29: User can restore previous purchases on a new device or reinstall
FR30: Premium status is cached locally and persists across sessions
FR31: First-time user sees a 4-slide onboarding flow explaining the app concept and Wada's story
FR32: User can swipe through onboarding slides or skip the flow entirely
FR33: Onboarding only appears on first launch, not on subsequent sessions
FR34: User can navigate all screens and interactive elements using VoiceOver
FR35: All interactive elements have minimum 44px touch targets
FR36: User with reduced motion preferences sees no animations
FR37: All non-text elements (color swatches, garment silhouettes) have descriptive accessibility labels
FR38: User receives light haptic feedback on color selection and tab switching
FR39: User receives medium haptic feedback on Outfit Visualizer interactions (tap-swap, garment toggle)
FR40: User can navigate between Color Home, Combinations, Outfit Visualizer, and Favorites screens
FR41: User can return to the Color Home from any screen
FR42: App preserves navigation state during a session (back stack)
FR43: User can use all core features without network connectivity
FR44: App launches and displays the color grid within 2 seconds on target devices

### NonFunctional Requirements

NFR1: Color grid renders all 159 swatches within 500ms of screen mount
NFR2: Combination list for any color loads within 300ms
NFR3: Outfit Visualizer maintains 60fps during tap-swap and garment toggle animations
NFR4: App cold start to interactive color grid in under 2 seconds on iPhone 12+
NFR5: Share image generation completes within 1 second (no loading spinner)
NFR6: Navigation transitions between screens complete within 300ms
NFR7: App binary size under 30MB (including bundled JSON + SVG assets)
NFR8: Memory usage stays under 150MB during Outfit Visualizer interactions
NFR9: IAP receipt validation prevents unauthorized premium access without requiring server infrastructure
NFR10: Premium status stored in platform-secure storage resistant to casual inspection
NFR11: No user data collected, transmitted, or stored on any external server
NFR12: App declares "Data Not Collected" on App Store Privacy Label truthfully
NFR13: Full WCAG 2.1 AA compliance across all screens
NFR14: VoiceOver reads meaningful descriptions for all color swatches (color name, family)
NFR15: VoiceOver announces state changes in Outfit Visualizer (which garment received which color)
NFR16: All touch targets minimum 44x44 points
NFR17: App respects iOS Dynamic Type for text elements (minimum support, not full scaling)
NFR18: App respects iOS Reduce Motion setting — disables all animations when enabled
NFR19: Color information never conveyed by color alone — names and labels always present
NFR20: Zero crash tolerance on critical paths (color selection → combinations → Visualizer → share)
NFR21: App functions identically with airplane mode enabled (offline-first)
NFR22: Favorites data survives app updates without loss
NFR23: IAP purchase restoration succeeds after reinstall or device migration
NFR24: Supports iOS 16.0 and above
NFR25: Functions correctly on all iPhone screen sizes from iPhone SE (3rd gen) to iPhone 16 Pro Max
NFR26: Light mode only for MVP (Wada's book aesthetic is white pages). Dark mode adaptation deferred to post-MVP
NFR27: Shared images render correctly when viewed on Instagram Stories, TikTok, and iMessage

### Additional Requirements

- **Starter template:** Architecture specifies `create-expo-app --template default@sdk-55` as the project scaffold. Project initialization should be the first implementation story
- **Separate repository:** Outfinder lives in its own directory/repo, completely separate from Project1 PWA. No shared code, deps, or configuration
- **Dependency installation:** 15 specific dependencies with exact versions specified (NativeWind 4.2.2, React Navigation 7.1.33, Reanimated 4.2.2, RevenueCat, expo-haptics, react-native-svg, react-native-view-shot, expo-sharing, expo-secure-store, AsyncStorage, expo-font)
- **NativeWind configuration:** tailwind.config.js with Wada design tokens (--bg-paper, --hairline, --font-jp, etc.)
- **Data layer:** Static ES module import of Wada JSON dataset, pre-computed inverted index Map<colorHex, Combination[]>, O(1) lookups. Pure functions in data/colorIndex.ts
- **Navigation architecture:** React Navigation 7 with TabNavigator (3 tabs: Colors/Favorites/Settings) + 3 native stacks (ColorsStack, FavoritesStack, SettingsStack). SF Symbols for tab icons
- **RevenueCat for IAP:** react-native-purchases (RevenueCat) over raw react-native-iap. Server-side receipt validation without backend. Free tier up to $2.5K revenue
- **Font bundling:** Noto Serif JP + Inter bundled via expo-font. No network font loading
- **CI/CD pipeline:** GitHub Action for lint + test + tsc on PR. EAS Build for iOS binary. EAS Submit for App Store
- **Implementation patterns:** Function declarations with named exports, NativeWind className (not StyleSheet.create), mandatory accessibilityLabel/accessibilityRole on all interactive elements, co-located tests, centralized haptics in lib/haptics.ts with try/catch
- **Biome linting:** Same configuration as PWA (Biome single binary replacing ESLint + Prettier)
- **Testing:** Jest + React Native Testing Library. testID prop (not data-testid) for targeting
- **Responsive layout:** iPhone SE (375px) minimum, iPhone 14/15 (390px) primary target, Pro Max (428px) maximum. Portrait only. No tablet/desktop
- **Onboarding flow:** 4-slide first-time experience explaining Wada's story. AsyncStorage flag for one-time display
- **Share image:** react-native-view-shot capture at 1080x1920 for Instagram Stories. Branding footer ≤5% of area
- **Storage separation:** AsyncStorage for favorites/preferences, expo-secure-store (Keychain) for premium entitlement status
- **Accessibility patterns from UX:** VoiceOver labels specified per component. Dynamic Type with allowFontScaling. Reduce Motion disables all animations. Color information never by color alone
- **Design tokens from UX:** 16 CSS custom properties (--bg-paper #fafaf8, --bg-surface #ffffff, --bg-elevated #f5f5f3, --text-primary #1a1a1a, --text-secondary #6b6b6b, --text-tertiary #9b9b9b, --hairline-color rgba(0,0,0,0.08), --divider-color rgba(0,0,0,0.06), --premium-accent #c4a265, --interactive-hint rgba(0,0,0,0.04), --favorite-red #E74C3C, --tab-active #1a1a1a, --tab-inactive #9b9b9b, --tab-bar-bg #fafaf8, --tab-bar-border rgba(0,0,0,0.06), --nav-bar-bg #fafaf8)
- **Spacing system:** 8px base unit with defined scale (4/8/12/16/24/32/48px)
- **Spring animations:** All transitions use spring damping via Reanimated, not linear easing. 200-300ms duration. Must respect Reduce Motion
- **Empty state for Favorites:** Centered illustration + "No favorites yet" + instructional text
- **Large title navigation:** iOS large title style for Color Home and Favorites, collapsing to inline on scroll
- **Settings screen:** Premium upgrade CTA, app info, preferences. Lazy loaded
- **App Store assets:** App icon (1024x1024), splash screen, screenshots, metadata for fashion audience
- **8 SVG garment silhouettes:** TopTShirt, TopShirt, BottomPants, BottomSkirt, LayerJacket, LayerHoodie, ShoesSneakers, ShoesFormal — accessed via garment registry index.ts

### FR Coverage Map

FR1: Epic 1 — Grid visual de 159 colores
FR2: Epic 1 — Filtrado por familia (6 tabs)
FR3: Epic 1 — Tap navega a combinaciones
FR4: Epic 1 — Scroll por grid de colores
FR5: Epic 1 — PaletteStrips horizontales
FR6: Epic 1 — Nombres JP/EN por paleta
FR7: Epic 1 — Cross-navigation entre colores
FR8: Epic 1 — Back navigation
FR9: Epic 2 — Outfit Visualizer desde paleta
FR10: Epic 2 — Tap-swap colores entre garments
FR11: Epic 2 — Toggle tipos de prenda
FR12: Epic 2 — Palette bar actualizable
FR13: Epic 2 — Paletas de 2, 3, 4 colores
FR14: Epic 3 — Generar imagen compartible
FR15: Epic 3 — Share via native Share Sheet
FR16: Epic 3 — Branding ≤5% del área
FR17: Epic 3 — Optimizado para Instagram Stories
FR18: Epic 3 — 2 taps máximo para compartir
FR19: Epic 4 — Save combinación a Favorites
FR20: Epic 4 — Unsave combinación
FR21: Epic 4 — Vista dedicada de Favorites
FR22: Epic 4 — Persistencia local
FR23: Epic 4 — Acceso desde main navigation
FR24: Epic 5 — Free tier (color lookup + Visualizer)
FR25: Epic 5 — Soft paywall al 6to favorito (5 gratis)
FR26: Epic 5 — Ver beneficios y precio premium
FR27: Epic 5 — Suscripción vía IAP (StoreKit 2)
FR28: Epic 5 — Face ID / Apple Pay
FR29: Epic 5 — Restore purchases
FR30: Epic 5 — Premium status cached local
FR31: Epic 6 — Onboarding 4 slides
FR32: Epic 6 — Swipe/skip onboarding
FR33: Epic 6 — Onboarding solo en first launch
FR34: Epic 1 — VoiceOver en todos los screens
FR35: Epic 1 — Touch targets mínimo 44px
FR36: Epic 1 — Reduce Motion sin animaciones
FR37: Epic 1 — Labels descriptivos en non-text
FR38: Epic 1 — Haptic light en selección
FR39: Epic 2 — Haptic medium en Visualizer
FR40: Epic 1 — Navegación entre screens
FR41: Epic 1 — Return a Color Home
FR42: Epic 1 — Back stack preservado
FR43: Epic 1 — Funciona offline
FR44: Epic 1 — Cold start <2s

## Epic List

### Epic 1: Color Discovery & Combination Exploration
Users can open Outfinder, see all 159 Wada colors in a native iOS grid organized by 6 swatch family tabs, tap any color to see its Wada combinations as PaletteStrips with JP/EN names, and cross-navigate between colors. Includes project scaffold, data layer, navigation architecture, Color Home, and Combinations screens with full VoiceOver support and haptic feedback. The app functions fully offline with bundled JSON data and launches in under 2 seconds.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR34, FR35, FR36, FR37, FR38, FR40, FR41, FR42, FR43, FR44

### Epic 2: Outfit Visualization
Users can open the Outfit Visualizer from any combination and see colors rendered as customizable garment silhouettes. Users can tap-swap colors between garments, toggle garment types (t-shirt/shirt, pants/skirt, jacket/hoodie, sneakers/formal), and see the palette bar update in real time. Supports 2, 3, and 4 color palettes with VoiceOver state change announcements and medium haptic feedback.
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR39

### Epic 3: Social Sharing
Users can generate a shareable outfit image optimized for Instagram Stories (1080x1920) with subtle Outfinder branding (≤5% area), and share it via the native iOS Share Sheet (UIActivityViewController) in 2 taps or fewer. The viral growth loop is complete.
**FRs covered:** FR14, FR15, FR16, FR17, FR18

### Epic 4: Favorites & Collections
Users can save/unsave color combinations with a heart icon on any PaletteStrip, view all saved favorites in a dedicated Favorites tab with its own navigation stack, and favorites persist across app sessions via AsyncStorage. Empty state guides first-time savers.
**FRs covered:** FR19, FR20, FR21, FR22, FR23

### Epic 5: Premium & Monetization
Users encounter a soft paywall when attempting premium features (favorites beyond free limit, outfit saving). They can view premium benefits and pricing, subscribe via iOS In-App Purchase (RevenueCat/StoreKit 2), complete purchase with Face ID/Apple Pay, and restore purchases across devices. Premium status cached in expo-secure-store (Keychain).
**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30

### Epic 6: Onboarding & App Store Launch
First-time users see a 4-slide onboarding flow explaining Wada's story and the app concept, with swipe navigation and skip option (shown once via AsyncStorage flag). Settings screen with premium CTA and app info. App Store assets (icon 1024x1024, screenshots, metadata), EAS Build configuration, and final CI/CD pipeline.
**FRs covered:** FR31, FR32, FR33

---

## Process Requirements (All Stories)

Every story in this project MUST follow these process rules, derived from 5 retrospectives on the PWA project:

1. **Git Branching:** Each epic gets its own branch (`epic-N`). Each story gets its own branch off the epic branch (`epic-N/story-N.M-description`). All commits on the story branch.
2. **Story Size:** Maximum 4-5 tasks per story. Never combine stories.
3. **Accessibility First:** Every UI component must include accessibilityLabel, accessibilityRole, 44px touch targets, and VoiceOver support from the start — not as polish.
4. **Testing Discipline:** Every AC describing user interaction must have a corresponding test using `testID`. Test interactions, not just rendering.
5. **Error Handling:** Try/catch on all native API calls (haptics, share, IAP, storage). Don't assume APIs always succeed.
6. **AC Verification:** Final task of every story is point-by-point verification of all Acceptance Criteria.
7. **Adversarial Code Review:** Run `/bmad-bmm-code-review` after completing each story. Must pass before merging story branch into epic branch. MUST be completed before starting the next story.
8. **Documentation:** Update project-context.md or relevant docs at the end of each story with what was built.

---

## Epic 1: Color Discovery & Combination Exploration

Users can open Outfinder, see all 159 Wada colors in a native iOS grid organized by 6 swatch family tabs, tap any color to see its Wada combinations as PaletteStrips with JP/EN names, and cross-navigate between colors. Includes project scaffold, data layer, navigation architecture, Color Home, and Combinations screens with full VoiceOver support and haptic feedback. The app functions fully offline with bundled JSON data and launches in under 2 seconds.

### Story 1.0: Workspace Setup & Agent Context (Pre-implementation)

**Type:** Configuration — must be completed before Story 1.1. This story is executed manually by Alejandro + Claude from the Project1 directory.

As a developer,
I want the Outfinder workspace fully self-contained with planning docs, BMAD workflows, agent rules, and memory,
So that all future stories can be developed entirely from the Outfinder repo without depending on Project1.

**Acceptance Criteria:**

**Given** the Outfinder project does not exist yet
**When** the workspace is initialized
**Then** the Expo project is created via `npx create-expo-app@latest outfinder --template default@sdk-55` in its own directory (sibling to Project1, not inside it)
**And** a git repository is initialized with an initial commit

**Given** the Outfinder repo exists
**When** planning artifacts are set up
**Then** the following are copied to `docs/planning/` in the Outfinder repo:
- `prd-react-native-ios.md`
- `architecture-react-native-ios.md`
- `epics.md`
- `ux-design-specification-ios.md`
- `implementation-readiness-report-2026-03-12.md`
**And** these are read-only reference copies (source of truth remains in Project1 if edits are needed during planning)

**Given** planning docs are in place
**When** BMAD is installed in the Outfinder repo
**Then** `_bmad/` is configured with workflows needed for development: `create-story`, `dev-story`, `code-review`, `sprint-status`
**And** `_bmad/bmm/config.yaml` is configured with Outfinder-specific values (project_name: Outfinder, planning_artifacts pointing to `docs/planning/`, implementation_artifacts to `_bmad-output/implementation-artifacts/`)

**Given** BMAD is installed
**When** CLAUDE.md is created at the repo root
**Then** it contains agent rules adapted from Project1 (story size 4-5 tasks, AC verification, a11y first, testing with testID, error handling try/catch, Radix→N/A for RN, hooks rules, mandatory code review)
**And** includes React Native-specific rules: NativeWind className, accessibilityLabel/accessibilityRole on all interactive elements, expo-haptics via lib/haptics.ts only, function declarations with named exports
**And** includes commands: `pnpm start`, `pnpm lint`, `pnpm test`, `npx tsc --noEmit`

**Given** CLAUDE.md exists
**When** agent memory is initialized for the Outfinder project
**Then** memory contains: development workflow (story cycle), key decisions (5 free favorites, icon pack research for Story 2.0, RevenueCat for IAP), and user profile (Alejandro, Spanish communication, intermediate skill level)

**Output:** A self-contained Outfinder repo ready for Story 1.1 (dependencies, design tokens, fonts, CI).

---

### Story 1.1: Project Scaffold & Configuration

As a developer,
I want all dependencies installed, design tokens configured, fonts bundled, and CI pipeline running,
So that all subsequent stories can build on a solid, tested foundation.

**Acceptance Criteria:**

**Given** the Outfinder project exists (from Story 1.0)
**When** the epic-1 branch is created from main
**Then** the story branch `epic-1/story-1.1-scaffold` is created from epic-1

**Given** the project is scaffolded
**When** all dependencies are installed via `npx expo install` and `pnpm add`
**Then** the following are present in package.json: nativewind@4.2.2, tailwindcss, @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs, react-native-screens, react-native-safe-area-context, react-native-reanimated, expo-haptics, react-native-svg, react-native-view-shot, @react-native-async-storage/async-storage, expo-secure-store, expo-sharing, react-native-purchases, expo-font
**And** devDependencies include @biomejs/biome, jest, @testing-library/react-native
**And** `pnpm start` launches Metro bundler without errors

**Given** NativeWind 4.2.2 is installed
**When** tailwind.config.js is configured
**Then** all 16 Wada design tokens are defined as custom theme values (--bg-paper #fafaf8, --bg-surface #ffffff, --bg-elevated #f5f5f3, --text-primary #1a1a1a, --text-secondary #6b6b6b, --text-tertiary #9b9b9b, --hairline-color rgba(0,0,0,0.08), --divider-color rgba(0,0,0,0.06), --premium-accent #c4a265, --interactive-hint rgba(0,0,0,0.04), --favorite-red #E74C3C, --tab-active #1a1a1a, --tab-inactive #9b9b9b, --tab-bar-bg #fafaf8, --tab-bar-border rgba(0,0,0,0.06), --nav-bar-bg #fafaf8)
**And** metro.config.js is configured for NativeWind and SVG support
**And** babel.config.js includes NativeWind and Reanimated plugins
**And** nativewind-env.d.ts provides TypeScript declarations
**And** styles/theme.ts exports token constants for programmatic access (Reanimated)

**Given** font files are bundled
**When** the app loads
**Then** Noto Serif JP (Regular, Medium) and Inter (Regular, Medium) are loaded via expo-font
**And** no network font loading occurs — fonts are bundled in the app binary
**And** Biome is configured (biome.json) and `pnpm lint` passes
**And** .github/workflows/ci.yml runs `pnpm lint`, `npx tsc --noEmit`, and `pnpm test -- --ci` on PRs
**And** a CLAUDE.md file exists with agent rules adapted for Outfinder (from Project1 rules + React Native specifics)

### Story 1.2: Data Layer & Navigation Shell

As a user,
I want the app to have instant color lookups and native iOS tab navigation,
So that I can navigate between screens with zero delay and the app feels like a native iOS product.

**Acceptance Criteria:**

**Given** the Wada dataset JSON files (colors.json with 159 colors, combinations.json with 348 palettes) are placed in src/data/
**When** the data module loads
**Then** the JSON is imported as a static ES module at build time (no async loading, no fetch)
**And** no loading states exist for data access — data is available immediately (FR43)

**Given** TypeScript interfaces are defined in src/data/types.ts
**When** a developer references Color, Combination, or SwatchGroup types
**Then** Color has: hex, nameJp, nameEn, id, swatchGroup (number 0-5), combinationCount
**And** Combination has: id, colors (Color[]), nameJp, nameEn
**And** SwatchGroup is a union type 0 | 1 | 2 | 3 | 4 | 5

**Given** src/data/colorIndex.ts builds the inverted index at module initialization
**When** the pre-computed maps are created
**Then** `getColor(colorId)` returns a Color in O(1) time
**And** `getCombinations(colorId)` returns Combination[] in O(1) time (NFR2: <300ms)
**And** `getColorsByGroup(group)` returns only colors in that swatch group
**And** `getAllColors()` returns all 159 colors
**And** unit tests in colorIndex.test.ts verify: all 159 colors indexed, all 348 combinations accessible, every color has ≥1 combination, O(1) lookup correctness

**Given** React Navigation 7 is configured
**When** App.tsx renders
**Then** a TabNavigator displays 3 bottom tabs: Colors (SF Symbol: paintpalette), Favorites (heart), Settings (gearshape)
**And** tab bar background is --tab-bar-bg (#fafaf8) with --tab-bar-border top border
**And** active tab uses --tab-active (#1a1a1a), inactive uses --tab-inactive (#9b9b9b)
**And** ColorsStack contains: ColorHome (root) → Combinations (push) → OutfitVisualizer (push, placeholder)
**And** FavoritesStack and SettingsStack render placeholder screens
**And** each tab maintains its own independent navigation stack (FR42)
**And** native swipe-back gesture works on all stacks

**Given** lib/haptics.ts is created
**When** hapticLight(), hapticMedium(), or hapticRigid() are called
**Then** expo-haptics fires the corresponding UIImpactFeedbackGenerator style
**And** each function wraps the call in try/catch (silently fails if API unavailable)
**And** no components call expo-haptics directly — always through lib/haptics.ts

### Story 1.3: Color Home Screen

As a user,
I want to see all 159 Wada colors organized by family in a beautiful grid with tab filtering,
So that I can quickly find the color closest to my garment.

**Acceptance Criteria:**

**Given** the user opens the app (Colors tab active)
**When** the ColorHome screen renders
**Then** a large title navigation bar displays "配色辞典" (or "Outfinder")
**And** the large title collapses to inline on scroll (iOS native behavior)
**And** horizontal SwatchGroupTabs are shown (All + 6 family tabs)
**And** the "All" tab is active by default showing all 159 colors grouped by family
**And** the grid renders within 500ms (NFR1)
**And** the background is --bg-paper (#fafaf8)

**Given** the color grid is displayed
**When** the user views the SwatchGroup component
**Then** colors are rendered in a 5-column layout via FlatList with 4px gap
**And** each ColorSwatch is 62×62px with 4px border-radius (exceeds 44px minimum, FR35)
**And** each swatch displays the color using `style={{ backgroundColor: color.hex }}` with Wada's original hex values
**And** each swatch has `accessibilityLabel="{nameEn}, {combinationCount} combinations"` and `accessibilityRole="button"` (FR34, FR37, NFR14)
**And** color names are always available via VoiceOver — color never conveyed by color alone (NFR19)

**Given** the user taps a swatch-group tab
**When** tab selection changes
**Then** the grid instantly filters to show only colors in that family
**And** the active tab shows --tab-active indicator, inactive tabs show --tab-inactive
**And** hapticLight() fires on tab switch (FR38)
**And** each tab has `accessibilityRole="tab"` and `accessibilityState={{ selected }}` (FR34)

**Given** a color swatch is tapped
**When** the tap is registered
**Then** hapticLight() fires (FR38)
**And** the swatch shows a spring scale animation to 1.05x (Reanimated, 150ms) as visual feedback
**And** the app navigates (push) to the Combinations screen with colorId as route param (FR3)
**And** if Reduce Motion is enabled, the scale animation is skipped (instant transition, FR36, NFR18)

**Given** co-located tests exist for ColorSwatch, SwatchGroup, SwatchGroupTabs, and ColorHome
**When** tests are executed
**Then** grid renders correct number of colors per group, tab filtering works, color selection triggers navigation, accessibility labels are present on all interactive elements

### Story 1.4: Combinations Screen

As a user,
I want to see all Wada palettes containing my selected color as beautiful floating strips with Japanese and English names,
So that I can discover harmonious color combinations for my wardrobe.

**Acceptance Criteria:**

**Given** the user navigates to the Combinations screen with a colorId param
**When** the screen renders
**Then** an inline navigation bar displays: back chevron (native swipe-back enabled), color preview swatch, Japanese name (Noto Serif JP), and English name (Inter, --text-secondary)
**And** the combination count is displayed (e.g., "8 combinations", Inter, --text-tertiary) (NFR19)
**And** the ColorHeader has `accessibilityLabel="{nameEn}, {count} combinations"` (FR34)

**Given** the Combinations screen is loaded
**When** the CombinationList renders
**Then** all Wada palettes containing the selected color are displayed as PaletteStrip components in a vertical FlatList
**And** combinations are separated by 24px spacing and 1px --divider-color lines
**And** no card containers are used — strips float directly on --bg-paper background
**And** palette lookup completes within 300ms (NFR2)

**Given** a PaletteStrip is displayed
**When** the user views a combination
**Then** 2-4 color rectangles are shown side by side (flex: 1, height 120px) with 0.5px --hairline-color dividers between them (FR5)
**And** the container has 8px border-radius on outer edges only
**And** a white 6px dot appears at the bottom-center of the selected color's rectangle
**And** below each color rectangle: Japanese name (Noto Serif JP, 11px) and English name (Inter, 10px) are displayed (FR6)
**And** each PaletteStrip has `accessibilityLabel="Combination: {color names joined}"` (FR34, FR37)

**Given** the selected color has only 1-2 combinations (edge case)
**When** the Combinations screen renders
**Then** the available combinations are displayed normally without any error or empty state
**And** the ColorHeader shows the accurate count

**Given** co-located tests exist for ColorHeader, PaletteStrip, CombinationList, and Combinations screen
**When** tests are executed
**Then** components render correctly for 2, 3, and 4 color combinations, selected color dot appears on correct rectangle, edge cases (1-2 combinations) render gracefully, all accessibility labels are present

### Story 1.5: Cross-Navigation, Haptics & Accessibility Polish

As a user,
I want to tap any color within a combination to explore its palettes, navigate back through my history, and experience tactile feedback,
So that I can discover unexpected color relationships across Wada's collection with a native feel.

**Acceptance Criteria:**

**Given** a PaletteStrip displays multiple colors
**When** the user taps a color rectangle that is NOT the currently selected color
**Then** the app pushes a new Combinations screen to the navigation stack with the tapped color's ID (FR7)
**And** hapticLight() fires on the tap (FR38)
**And** each color rectangle has `accessibilityLabel="View combinations for {nameEn}"` and `accessibilityRole="button"` (FR34)
**And** the tapped rectangle shows opacity 0.88 briefly via Pressable feedback before navigation

**Given** the user has navigated via cross-navigation (Color A → Color B)
**When** the user performs a native swipe-right gesture or taps the back chevron
**Then** the app pops one level from the navigation stack, returning to Color A's Combinations (FR8)
**And** the navigation stack supports unlimited depth (FR42)
**And** the back navigation transition uses React Navigation native stack defaults (spring-damped, FR36 respected)

**Given** the user is anywhere in the app
**When** they tap the Colors tab in the bottom bar
**Then** the navigation returns to the Color Home root screen (FR41)
**And** navigation between all screens works: Color Home ↔ Combinations ↔ OutfitVisualizer placeholder, Favorites placeholder, Settings placeholder (FR40)
**And** all transitions complete within 300ms (NFR6)

**Given** the useReducedMotion hook is implemented in src/hooks/useReducedMotion.ts
**When** the iOS Reduce Motion setting is enabled
**Then** all spring animations across all components are disabled (instant transitions) (FR36, NFR18)
**And** haptic feedback continues to work (tactile, not visual)
**And** the hook uses `AccessibilityInfo.isReduceMotionEnabled()` and listens for changes

**Given** all Epic 1 stories are complete
**When** the developer performs point-by-point AC verification
**Then** every AC from Stories 1.1-1.5 is verified as implemented
**And** all 18 FRs assigned to Epic 1 are confirmed working (FR1-FR8, FR34-FR38, FR40-FR44)
**And** `npx tsc --noEmit` passes with zero errors
**And** `pnpm lint` passes with zero errors
**And** `pnpm test` passes with all tests green
**And** adversarial code review (`/bmad-bmm-code-review`) is run and findings are resolved
**And** story branch is merged into epic-1 branch only after review passes

---

## Epic 2: Outfit Visualization

Users can open the Outfit Visualizer from any combination and see colors rendered as customizable garment silhouettes. Users can tap-swap colors between garments, toggle garment types, and see the palette bar update in real time. Supports 2, 3, and 4 color palettes with VoiceOver state change announcements and medium haptic feedback.

### Story 2.0: Garment SVG Research & Selection (Pre-implementation)

**Type:** Research / Design validation — must be completed before Story 2.1.

**Context:** PWA prototype SVGs had quality issues (shoes unrecognizable). Rather than converting problematic SVGs to react-native-svg, source a proper icon pack or create a visual proposal wall for Alejandro to validate.

**Tasks:**

1. Search icon packs (Flaticon, Noun Project, etc.) for garment/clothing silhouette sets with commercial license. Need 8 types: TopTShirt, TopShirt, BottomPants, BottomSkirt, LayerJacket, LayerHoodie, ShoesSneakers, ShoesFormal
2. Select 2-3 candidate icon packs with different styles (minimalist, fashion sketch, flat illustration)
3. Create an HTML visual wall with the candidates showing all 8 garment types side-by-side, filled with sample Wada colors, for Alejandro to evaluate and choose
4. Once approved, convert chosen SVGs to react-native-svg format and validate rendering

**Decision:** 5 free favorites before premium paywall (defined during implementation readiness review 2026-03-12).

**Output:** Approved garment SVG set ready for Story 2.1 implementation.

---

### Story 2.1: SVG Garment Silhouettes & Outfit Mannequin

As a user,
I want to see my color combination rendered as garment silhouettes arranged as an outfit,
So that I can visualize how the colors would look on actual clothing.

**Acceptance Criteria:**

**Given** the Outfit Visualizer screen is navigated to with a combinationId param
**When** the screen renders
**Then** an inline navigation bar displays "Outfit Visualizer" with back chevron
**And** the OutfitMannequin component displays garment silhouettes arranged vertically (top → bottom → shoes)
**And** colors from the combination are auto-assigned top-to-bottom: 1st color → first visible slot, 2nd → second, etc.
**And** the background is --bg-paper (#fafaf8)

**Given** 8 SVG garment components exist in src/components/garments/
**When** garments are rendered
**Then** TopTShirt, TopShirt, BottomPants, BottomSkirt, LayerJacket, LayerHoodie, ShoesSneakers, ShoesFormal are available as react-native-svg components
**And** each accepts a `fill` prop for dynamic color assignment
**And** each garment has `accessibilityLabel="{garment type}, colored {color nameEn}"` (FR37, NFR15)
**And** a garment registry in components/garments/index.ts maps garment type → component

**Given** the combination has 2, 3, or 4 colors
**When** auto-assignment occurs
**Then** 2-color: top + bottom slots visible
**And** 3-color: top + bottom + shoes slots visible
**And** 4-color: layer + top + bottom + shoes slots visible (FR13)
**And** each GarmentSlot displays the assigned garment SVG filled with the assigned color

**Given** co-located tests exist for GarmentSlot, OutfitMannequin, and garment SVGs
**When** tests are executed
**Then** correct slot configurations render for 2, 3, and 4 color palettes, colors are assigned correctly, accessibility labels are present on all garment slots
**And** adversarial code review is run and findings resolved before merging story branch

### Story 2.2: Tap-Swap, Garment Toggle & Palette Bar

As a user,
I want to tap garments to swap their colors and toggle garment types,
So that I can customize the outfit visualization to match my actual wardrobe pieces.

**Acceptance Criteria:**

**Given** the OutfitMannequin displays garment slots
**When** the user taps a garment slot (Garment A)
**Then** the slot enters selected state with a 2px animated border (spring animation via Reanimated)
**And** hapticMedium() fires (FR39)
**And** VoiceOver announces "Selected {garment type} for swap" (NFR15)

**Given** a garment slot is in selected state
**When** the user taps a different garment slot (Garment B)
**Then** the colors of Garment A and Garment B swap (FR10)
**And** hapticMedium() fires (FR39)
**And** both garments are deselected
**And** the swap animation uses Reanimated spring interpolation (60fps, NFR3)
**And** VoiceOver announces "{garment A type} is now {new color}, {garment B type} is now {new color}" (NFR15)
**And** if Reduce Motion is enabled, color swap is instant (no animation)

**Given** a garment slot is displayed
**When** the user activates the garment toggle (e.g., button or gesture on the slot)
**Then** the garment type cycles to its variant: T-shirt ↔ Button Shirt, Pants ↔ Skirt, Jacket ↔ Hoodie, Sneakers ↔ Formal (FR11)
**And** hapticMedium() fires (FR39)
**And** the color assignment is preserved during toggle
**And** VoiceOver announces "Changed to {new garment type}" (NFR15)

**Given** the PaletteBar component is rendered below the mannequin
**When** any color swap or garment toggle occurs
**Then** the PaletteBar updates to reflect current color-to-slot assignments (FR12)
**And** each color in the bar shows the color swatch with the garment type label
**And** PaletteBar has `accessibilityLabel` listing all current assignments

**Given** the useOutfitState hook manages Visualizer state
**When** slot assignments, selected slot, or garment variants change
**Then** all state updates are managed in src/hooks/useOutfitState.ts
**And** the hook is tested in useOutfitState.test.ts covering: initialization for 2/3/4 colors, swap logic, toggle logic, selection/deselection

**Given** all Epic 2 stories are complete
**When** the developer performs point-by-point AC verification
**Then** every AC from Stories 2.1-2.2 is verified as implemented
**And** all 6 FRs assigned to Epic 2 are confirmed working (FR9-FR13, FR39)
**And** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass
**And** adversarial code review is run and findings resolved before merging story branch

---

## Epic 3: Social Sharing

Users can generate a shareable outfit image optimized for Instagram Stories (1080x1920) with subtle Outfinder branding (≤5% area), and share it via the native iOS Share Sheet in 2 taps or fewer. The viral growth loop is complete.

### Story 3.1: Share Image Generation & Branding

As a user,
I want to generate a beautiful shareable image of my outfit visualization,
So that I can share it on Instagram Stories and TikTok to show friends my outfit idea.

**Acceptance Criteria:**

**Given** the user is on the Outfit Visualizer screen
**When** the SharePreview component renders (off-screen or on-demand)
**Then** a capture-ready view is composed at 1080×1920 resolution (Instagram Stories format, FR17)
**And** the view includes: the outfit mannequin with current color assignments, color name labels, and a branding footer
**And** the branding footer occupies ≤5% of the total image area (≤96px of 1920px height) and does not obscure the outfit visualization (FR16)
**And** the branding includes "Outfinder" text and/or logo in a subtle, on-brand style (--text-tertiary)

**Given** react-native-view-shot is configured
**When** the image capture is triggered
**Then** `captureRef()` captures the SharePreview view as a PNG file
**And** the capture completes within 1 second with no loading spinner (NFR5)
**And** the generated image is saved to a temporary file path for sharing
**And** try/catch wraps the capture call — errors are handled gracefully without crash (NFR20)

**Given** co-located tests exist for SharePreview
**When** tests are executed
**Then** SharePreview renders with branding, correct dimensions, and current outfit state
**And** adversarial code review is run and findings resolved before merging story branch

### Story 3.2: Native Share Sheet Integration

As a user,
I want to share my outfit image to Instagram, TikTok, or Messages in 2 taps,
So that my friends can see my outfit idea and discover Outfinder.

**Acceptance Criteria:**

**Given** a "Share Outfit" button is displayed on the Outfit Visualizer screen
**When** the user taps the share button (tap 1)
**Then** the image is generated via react-native-view-shot (if not already captured)
**And** expo-sharing opens the native iOS Share Sheet (UIActivityViewController) with the generated image (FR15, tap 2 = selecting destination)
**And** the total flow from button tap to Share Sheet open is ≤2 taps (FR18)

**Given** lib/share.ts contains the share utility function
**When** `shareOutfit(viewRef)` is called
**Then** it captures the view, generates the image file, and calls `Sharing.shareAsync(fileUri)`
**And** the entire function is wrapped in try/catch — errors show a user-friendly message, never crash (NFR20)
**And** the share button has `accessibilityLabel="Share outfit image"` and `accessibilityRole="button"`

**Given** the shared image is received by the recipient
**When** viewed on Instagram Stories, TikTok, or iMessage
**Then** the image renders correctly at full resolution without cropping or distortion (NFR27)
**And** the Outfinder branding is visible but subtle

**Given** co-located tests exist for the share flow
**When** tests are executed
**Then** share button triggers the flow, share utility handles errors gracefully, accessibility labels are present
**And** all 5 FRs for Epic 3 are verified (FR14-FR18)
**And** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass
**And** adversarial code review is run and findings resolved before merging story branch

---

## Epic 4: Favorites & Collections

Users can save/unsave color combinations with a heart icon on any PaletteStrip, view all saved favorites in a dedicated Favorites tab with its own navigation stack, and favorites persist across app sessions via AsyncStorage. Empty state guides first-time savers.

### Story 4.1: Favorites Context & FavoriteButton

As a user,
I want to tap a heart icon on any combination to save it to my favorites,
So that I can quickly find combinations I love without searching again.

**Acceptance Criteria:**

**Given** FavoritesContext is implemented in src/contexts/FavoritesContext.tsx
**When** the app launches
**Then** favorites are loaded from AsyncStorage key `@outfinder/favorites` into a Set<combinationId> in memory
**And** FavoritesProvider wraps the app in App.tsx (above NavigationContainer)
**And** `useFavorites()` hook exposes: favorites Set, isFavorite(id), toggleFavorite(id)

**Given** toggleFavorite(id) is called
**When** the combination is not yet a favorite
**Then** it is added to the favorites Set and persisted to AsyncStorage immediately (FR19)
**And** when the combination is already a favorite, it is removed and AsyncStorage is updated (FR20)
**And** AsyncStorage write is wrapped in try/catch — errors logged, not thrown (NFR22)
**And** favorites data format supports app updates without data loss (NFR22)

**Given** a FavoriteButton component is displayed on each PaletteStrip
**When** the user taps the heart icon
**Then** the heart fills with --favorite-red (#E74C3C) and scales via spring animation (Reanimated) (FR19)
**And** hapticLight() fires on tap
**And** a second tap unfills the heart (returns to outline) (FR20)
**And** the button has `accessibilityLabel="Save to favorites"` / `"Remove from favorites"` based on state
**And** the hit area is minimum 44×44px (icon 24px with 10px padding each side) (FR35)

**Given** FavoritesContext has tests in FavoritesContext.test.tsx
**When** tests run
**Then** add/remove/toggle operations work correctly, persistence to AsyncStorage is verified, initial load from storage works
**And** adversarial code review is run and findings resolved before merging story branch

### Story 4.2: Favorites List Screen & Navigation

As a user,
I want to view all my saved favorites in a dedicated tab and navigate to their combinations,
So that I can quickly reference my curated color palette collection.

**Acceptance Criteria:**

**Given** the user taps the Favorites tab in the bottom bar
**When** the FavoritesList screen renders
**Then** a large title navigation bar displays "Favorites" (collapses to inline on scroll)
**And** all saved combinations are displayed as PaletteStrip components (same presentation as Combinations screen) (FR21)
**And** PaletteStrips in Favorites have heart icons (filled, since they are favorites)
**And** the screen is accessible from the main tab navigation at any time (FR23)

**Given** the user has zero saved favorites
**When** the FavoritesList screen renders
**Then** a centered EmptyState component displays: illustration + "No favorites yet" + "Tap ♡ on any combination to save it here"
**And** the empty state has appropriate accessibilityLabel

**Given** the user taps a color within a PaletteStrip on the Favorites screen
**When** the tap is registered
**Then** the FavoritesStack pushes a Combinations screen for that color (same screen component reused)
**And** from there, the user can push to OutfitVisualizer (once implemented)
**And** back navigation returns to FavoritesList
**And** the Favorites tab maintains its own independent navigation stack

**Given** all Epic 4 stories are complete
**When** the developer performs AC verification
**Then** all 5 FRs are confirmed (FR19-FR23)
**And** favorites persist across app restart (close and reopen)
**And** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass
**And** adversarial code review is run and findings resolved before merging story branch

---

## Epic 5: Premium & Monetization

Users encounter a soft paywall when attempting premium features. They can view premium benefits and pricing, subscribe via iOS In-App Purchase (RevenueCat/StoreKit 2), complete purchase with Face ID/Apple Pay, and restore purchases across devices.

### Story 5.1: Premium Context & Paywall UI

As a user,
I want to see a clear, non-intrusive paywall that explains what premium offers,
So that I understand the value before deciding to upgrade.

**Acceptance Criteria:**

**Given** PremiumContext is implemented in src/contexts/PremiumContext.tsx
**When** the app launches
**Then** premium status is loaded from expo-secure-store (Keychain, key `@outfinder/premium_status`) (NFR10)
**And** RevenueCat SDK is initialized with the API key (from environment config)
**And** `Purchases.getCustomerInfo()` verifies entitlements when online (non-blocking)
**And** `usePremium()` hook exposes: isPremium boolean, loading state
**And** PremiumProvider wraps the app in App.tsx (below FavoritesProvider)

**Given** the user is on the free tier
**When** they attempt to use a premium feature (e.g., favorites beyond free limit)
**Then** a PremiumPaywall bottom sheet or modal appears (FR25)
**And** the paywall displays: premium benefits list, subscription price (loaded from RevenueCat offering), "Subscribe" CTA button in --premium-accent, and "Restore Purchases" link (FR26)
**And** the paywall has `accessibilityLabel` on all interactive elements
**And** the core color lookup and Outfit Visualizer remain free (FR24)

**Given** the free tier allows some favorites
**When** the user has not exceeded the free favorites limit
**Then** favorites work normally without paywall interruption
**And** the paywall only appears when the limit is reached (soft gate, not hard block)

**Given** co-located tests exist for PremiumPaywall
**When** tests run
**Then** paywall renders with benefits, price placeholder, subscribe CTA, and restore link
**And** adversarial code review is run and findings resolved before merging story branch

### Story 5.2: In-App Purchase Flow & Restore

As a user,
I want to purchase premium with Face ID and restore my purchase on a new device,
So that I can unlock all features securely and permanently.

**Acceptance Criteria:**

**Given** the user taps "Subscribe" on the PremiumPaywall
**When** the purchase flow initiates
**Then** RevenueCat SDK presents the StoreKit 2 purchase sheet (FR27)
**And** the user can authenticate via Face ID / Apple Pay to complete the purchase (FR28)
**And** on successful purchase, PremiumContext updates isPremium to true
**And** premium status is cached in expo-secure-store (Keychain) (FR30, NFR10)
**And** the paywall dismisses and premium features are unlocked immediately

**Given** the purchase flow encounters an error (user cancels, network failure, StoreKit error)
**When** the error is caught
**Then** a user-friendly message is displayed (not a crash, not a technical error)
**And** the paywall remains visible for retry
**And** all RevenueCat/StoreKit calls are wrapped in try/catch (NFR20)

**Given** the user taps "Restore Purchases" on the paywall or in Settings
**When** `Purchases.restorePurchases()` is called
**Then** previously purchased entitlements are restored (FR29)
**And** PremiumContext updates and SecureStore is refreshed (NFR23)
**And** works across reinstall and device migration

**Given** the app launches with a cached premium status
**When** PremiumContext loads
**Then** premium features are available immediately from cache (no network wait) (FR30)
**And** RevenueCat re-validates in the background when online (non-blocking)

**Given** all Epic 5 stories are complete
**When** AC verification runs
**Then** all 7 FRs are confirmed (FR24-FR30)
**And** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass
**And** adversarial code review is run and findings resolved before merging story branch

---

## Epic 6: Onboarding & App Store Launch

First-time users see a 4-slide onboarding flow explaining Wada's story and the app concept. Settings screen with premium CTA and app info. App Store assets and EAS Build configuration.

### Story 6.1: Onboarding Flow

As a first-time user,
I want to see a brief visual introduction explaining Wada's story and how the app works,
So that I understand the cultural context behind the color combinations.

**Acceptance Criteria:**

**Given** the user opens the app for the first time (no `@outfinder/onboarding_seen` in AsyncStorage)
**When** the app loads
**Then** the Onboarding screen displays 4 swipeable slides on --bg-paper background (FR31)
**And** each slide has: Japanese text (Noto Serif JP, primary), English text (Inter, secondary), and a visual element
**And** dot pagination at the bottom indicates current slide position

**Given** the onboarding is displayed
**When** the user swipes or taps to advance
**Then** slides transition with spring animation (Reanimated) respecting Reduce Motion (FR32)
**And** a "Skip" link is visible throughout the flow (FR32)
**And** all slides and controls have accessibilityLabel and accessibilityRole

**Given** the user reaches slide 4 or taps "Skip"
**When** they complete or skip the flow
**Then** `@outfinder/onboarding_seen: true` is stored in AsyncStorage (FR33)
**And** the user is navigated to Color Home
**And** onboarding is never shown again on subsequent launches (FR33)

**Given** tests exist for Onboarding
**When** tests run
**Then** all 4 slides render, skip works, completion sets AsyncStorage flag, component does not render when flag exists
**And** adversarial code review is run and findings resolved before merging story branch

### Story 6.2: Settings Screen & App Store Preparation

As a user,
I want to access app settings and premium upgrade,
So that I can manage my subscription and learn about the app.

**Acceptance Criteria:**

**Given** the user taps the Settings tab
**When** the Settings screen renders
**Then** the screen displays: Premium upgrade CTA (if free user) with --premium-accent styling, "Restore Purchases" button, app version, Wada attribution/credits, and privacy information
**And** the Settings screen is lazy-loaded (not included in initial bundle)
**And** all interactive elements have accessibilityLabel and accessibilityRole

**Given** the user taps "Upgrade to Premium" in Settings
**When** the tap is registered
**Then** the PremiumPaywall is presented (reuses component from Epic 5)

**Given** the user taps "Restore Purchases" in Settings
**When** the restore flow executes
**Then** RevenueCat restores purchases (same flow as Epic 5 Story 5.2)

**Given** EAS Build is configured
**When** build profiles are defined in eas.json
**Then** three profiles exist: development (real device testing), preview (TestFlight), production (App Store)
**And** app.json contains: app name "Outfinder", slug, version, iOS bundle identifier, minimum iOS 16.0 (NFR24), requires full screen (portrait only)
**And** App Store assets are prepared: icon (1024×1024), splash screen, and screenshot guidelines documented

**Given** all Epic 6 stories are complete
**When** AC verification runs
**Then** all 3 FRs are confirmed (FR31-FR33)
**And** Settings screen functions with premium integration
**And** EAS Build profiles are configured
**And** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass
**And** adversarial code review is run and findings resolved before merging story branch
