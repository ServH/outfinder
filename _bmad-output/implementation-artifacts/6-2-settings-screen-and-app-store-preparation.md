# Story 6.2: Settings Screen & App Store Preparation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to access app settings and premium upgrade, so that I can manage my subscription and learn about the app.

## Acceptance Criteria

1. **Given** the user taps the Settings tab, **When** the Settings screen renders, **Then** the screen displays: Premium upgrade CTA (if free user) with `--premium-accent` styling, "Restore Purchases" button, app version, Wada attribution/credits, and privacy information. All interactive elements have `accessibilityLabel` and `accessibilityRole`. The Settings screen is lazy-loaded (already satisfied by SettingsStack navigation).

2. **Given** the user taps "Upgrade to Premium" in Settings, **When** the tap is registered, **Then** the PremiumPaywall is presented (reuses component from Epic 5). **ALREADY IMPLEMENTED in Story 5.2 — no work needed.**

3. **Given** the user taps "Restore Purchases" in Settings, **When** the restore flow executes, **Then** RevenueCat restores purchases (same flow as Epic 5 Story 5.2). **ALREADY IMPLEMENTED in Story 5.2 — no work needed.**

4. **Given** EAS Build is configured, **When** build profiles are defined in eas.json, **Then** three profiles exist: development (real device testing), preview (TestFlight), production (App Store). `app.json` contains: app name "Outfinder", slug "outfinder", version, iOS bundle identifier, minimum iOS 16.0 (NFR24), requires full screen (portrait only). App Store asset requirements are documented.

5. **Given** all Epic 6 stories are complete, **When** AC verification runs, **Then** Settings screen functions with premium integration + about/credits. EAS Build profiles are configured. `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass. Adversarial code review is run and findings resolved before merging story branch.

## Tasks / Subtasks

- [x] Task 1: Complete Settings screen with About section (AC: #1)
  - [x] 1.1 Replace the "More settings in 6.2" placeholder in `src/screens/Settings.tsx` with a new "About" section below the Premium section. Use the same card pattern (rounded `bg-elevated` container with rows separated by dividers). Rows: **Version** — "Version" label left, `Constants.expoConfig?.version ?? "1.0.0"` right (from `expo-constants`). `testID="settings-version-row"`. **Wada Attribution** — "Based on Sanzo Wada's 'A Dictionary of Color Combinations'" (Noto Serif JP for "和田三造", Inter for the rest). `testID="settings-wada-attribution"`. `accessibilityLabel="Based on A Dictionary of Color Combinations by Sanzo Wada"`. **Privacy** — "Privacy: No data collected" label. `testID="settings-privacy-row"`. `accessibilityLabel="Privacy policy: no data is collected"`.
  - [x] 1.2 Add `import Constants from "expo-constants"` at top of Settings.tsx. Use `Constants.expoConfig?.version` to display the app version dynamically.
  - [x] 1.3 Ensure all new rows meet 44px minimum touch target (`min-h-[44px]`), have `accessibilityLabel`, and follow existing NativeWind + `wadaTokens` styling pattern. Non-interactive rows (version, attribution, privacy) use `View` not `Pressable` — they are informational.

- [x] Task 2: Configure app.json for App Store submission (AC: #4)
  - [x] 2.1 Update `app.json` with App Store-ready configuration: `"name": "Outfinder"`, keep `"slug": "outfinder"`, `"version": "1.0.0"`. iOS section: `"bundleIdentifier": "com.outfinder.app"` (replace `com.anonymous.outfinder`), `"buildNumber": "1"`, `"infoPlist": { "ITSAppUsesNonExemptEncryption": false }` (avoids App Store export compliance prompt), remove `"ios.icon"` field pointing to non-existent `expo.icon`, keep `"icon": "./assets/images/icon.png"` at root level. Add `"supportsTablet": false` to iOS section.
  - [x] 2.2 Update `expo-splash-screen` plugin config: change `"backgroundColor"` from `"#208AEF"` to `"#fafaf8"` (bg-paper token) to match the Wada aesthetic. The splash image can remain as-is (will be replaced with actual branded asset before submission).
  - [x] 2.3 Remove `"userInterfaceStyle": "automatic"` and set to `"light"` (NFR26: light mode only for MVP). Clean up android section (leave minimal or remove — iOS only MVP, android config is harmless but noisy).
  - [x] 2.4 Add `"plugins"` entry for `expo-build-properties` with `{ "ios": { "deploymentTarget": "16.0" } }` to enforce iOS 16+ minimum (NFR24). Install `expo-build-properties` with `npx expo install expo-build-properties`.

- [x] Task 3: Create eas.json with build profiles (AC: #4)
  - [x] 3.1 Create `eas.json` at project root with three profiles: `"development"` — `{ "developmentClient": true, "distribution": "internal", "ios": { "simulator": false } }`, `"preview"` — `{ "distribution": "internal", "ios": { "simulator": false } }` (for TestFlight ad-hoc), `"production"` — `{ "distribution": "store", "autoIncrement": true }`. Set `"cli": { "version": ">= 16.0.0" }` and `"build"` as top-level key.
  - [x] 3.2 Document in this story's completion notes which assets still need to be created before actual App Store submission: app icon (1024x1024 with Outfinder branding), splash screen (branded), App Store screenshots (6.7" and 6.1" sizes), App Store description, keywords, and category selection.

- [x] Task 4: Tests and verification (AC: #5)
  - [x] 4.1 Update `src/screens/Settings.test.tsx` — add tests: renders version number, renders Wada attribution text, renders privacy info text, version row has correct accessibility label, about section has correct testIDs. Mock `expo-constants` to return controlled version value.
  - [x] 4.2 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all pass with 0 errors. Point-by-point AC verification against each AC. Verify File List matches `git diff --name-status`.

## Dev Notes

### What's Already Done (Story 5.2)

The Settings screen already has a **fully functional Premium section** from Story 5.2:
- Premium status badge (Active/Free Plan)
- Restore Purchases button with loading/success/error states and auto-dismiss timers
- Upgrade to Premium button (free users) with `gate.openPaywall()` bypass
- PremiumPaywall rendering at bottom of screen
- 13 existing tests in Settings.test.tsx

**AC #2 and AC #3 are already satisfied.** This story only adds the About/info section and App Store config.

### Current Settings.tsx Structure

```tsx
<View className="flex-1 bg-paper">
  <ScrollView contentContainerStyle={{ padding: 24 }}>
    {/* Premium section — KEEP AS-IS */}
    <View testID="premium-section">...</View>

    {/* REPLACE this placeholder with About section */}
    <View className="mt-8 items-center">
      <Text>More settings in 6.2</Text>  // ← DELETE THIS
    </View>
  </ScrollView>
  <PremiumPaywall ... />  // ← KEEP AS-IS
</View>
```

### About Section Design

Follow the same card pattern as the Premium section:
- Section header: "About" (Inter, 16px, bold, `text-primary`)
- Card container: `bg-elevated`, borderRadius 12, overflow hidden
- Rows separated by 1px dividers (`wadaTokens.divider`, marginHorizontal 16)
- Each row: `px-4 py-3 min-h-[44px] justify-center`
- Version row: left label + right value on same line (flexDirection: row, justifyContent: space-between)
- Attribution row: single text block, multi-line
- Privacy row: single text line

### expo-constants Version Access

```tsx
import Constants from "expo-constants";
// Access: Constants.expoConfig?.version ?? "1.0.0"
```

`expo-constants` is already in package.json (`~55.0.7`). No new install needed.

### app.json Current State (Problems to Fix)

| Field | Current | Target |
|-------|---------|--------|
| `name` | `"outfinder"` | `"Outfinder"` (capitalize) |
| `ios.bundleIdentifier` | `"com.anonymous.outfinder"` | `"com.outfinder.app"` |
| `ios.icon` | `"./assets/expo.icon"` (non-existent) | Remove (use root `icon` field) |
| `userInterfaceStyle` | `"automatic"` | `"light"` (NFR26) |
| Splash `backgroundColor` | `"#208AEF"` (blue) | `"#fafaf8"` (bg-paper) |
| `ios.supportsTablet` | missing | `false` |
| `ios.buildNumber` | missing | `"1"` |
| `ios.infoPlist` | missing | `{ "ITSAppUsesNonExemptEncryption": false }` |
| Deployment target | default | `16.0` via `expo-build-properties` |

### eas.json — New File

No eas.json exists. Create with 3 profiles per architecture spec:
- **development**: Real device testing, development client
- **preview**: TestFlight distribution (ad-hoc/internal)
- **production**: App Store distribution with auto-increment build number

### App Store Assets Still Needed (Document Only)

These are NOT code tasks — document as "needed before submission":
- App icon: 1024x1024 PNG (no alpha, no transparency)
- Splash screen: Branded with Outfinder logo on bg-paper
- Screenshots: 6.7" (1290x2796) and 6.1" (1179x2556) — showing Color Home, Combinations, Outfit Visualizer, Share flow
- App Store metadata: Title "Outfinder", subtitle, description, keywords (outfit, color coordination, Wada, what to wear), category: Lifestyle
- Privacy URL (can be a simple static page)

### Previous Story Intelligence (Story 6.1)

From Story 6.1 completion:
- **249 tests across 24 suites** (after Epic 5 merge: 338 tests across 26 suites — use latest count from `pnpm test`)
- AsyncStorage mock handled by `@react-native-async-storage/async-storage/jest/async-storage-mock` in jest setup
- App.test.tsx uses `__mocks__/styleMock.js` for CSS import mock
- `jest.config.js` has `moduleNameMapper` for CSS → styleMock
- Biome lint checks `src/` only (not root files) — but root config files (eas.json, app.json) are JSON, no lint needed
- Settings.test.tsx wraps renders in `<GestureHandlerRootView>` because PremiumPaywall uses gestures

### Git Intelligence (Recent Commits)

```
8184f90 chore: mark Epic 5 as done in sprint status
3e0bea8 merge: Epic 5 complete + Story 6.1 — IAP purchase/restore flow, Settings premium, onboarding
7bb67a6 fix: code review — Settings upgrade bypass, overlay dismiss block, DRY errors, tests (Story 5.2)
5607c82 fix: code review — SecureStore key, un-favorite gate, purchase tests, lint, usePremiumGate hook (Story 5.1)
31b4934 fix: code review — lint errors, CTA text, SplashScreen test, dot pagination test (Story 6.1)
```

Epic 5 and Story 6.1 are merged into `epic-1`. Settings.tsx was last modified in Story 5.2. The premium section is stable and battle-tested through two code reviews.

### Patterns to Follow

- **Function declarations with named exports** — already established in Settings.tsx
- **Props interface required** — `type SettingsProps = Record<string, never>` already exists
- **NativeWind `className`** for static styles, `style={{}}` only for dynamic `wadaTokens` values
- **`testID` attributes** on all testable elements
- **`accessibilityLabel`** on all information elements
- **Co-located tests** — `Settings.test.tsx` next to `Settings.tsx`
- **`allowFontScaling`** on all Text components (Dynamic Type NFR17)

### What NOT to Do

- DO NOT rewrite the Premium section — it's complete and tested from Story 5.2
- DO NOT create links/buttons that open external URLs (no privacy policy URL exists yet, just display inline text)
- DO NOT add dark mode support — NFR26 mandates light-only for MVP
- DO NOT add any new navigation screens — Settings remains a single screen in SettingsStack
- DO NOT create actual App Store assets (icons, screenshots) — only configure the build system and document requirements
- DO NOT change the `lint` script — it only checks `src/`, root config files don't need linting
- DO NOT use `StyleSheet.create` — use NativeWind `className`
- DO NOT import `expo-haptics` directly — use `@/lib/haptics` (though no new haptic interactions needed in this story)

### Git Branching

Create story branch `story-6.2-settings-app-store` off `epic-1` (current main epic branch).

### Project Structure Notes

Files to create/modify:
- `src/screens/Settings.tsx` (MODIFIED) — Add About section, remove placeholder
- `src/screens/Settings.test.tsx` (MODIFIED) — Add about section tests
- `app.json` (MODIFIED) — App Store configuration
- `eas.json` (NEW) — EAS Build profiles
- `package.json` (MODIFIED) — expo-build-properties dependency added by `npx expo install`

### References

- [Source: docs/planning/epics.md#Story-6.2] — Story requirements and AC
- [Source: docs/planning/architecture-react-native-ios.md#Routing] — SettingsStack architecture, lazy loading
- [Source: docs/planning/architecture-react-native-ios.md#CI-CD-Pipeline] — EAS Build profiles and commands
- [Source: docs/planning/architecture-react-native-ios.md#Privacy] — "Data Not Collected" (NFR12)
- [Source: docs/planning/architecture-react-native-ios.md#Storage-Schema] — No new storage keys needed
- [Source: docs/planning/ux-design-specification-ios.md#Screen-5-Settings] — Premium CTA, app info, preferences
- [Source: docs/planning/prd-react-native-ios.md#App-Store-Compliance] — Age rating 4+, privacy label, StoreKit 2
- [Source: docs/planning/prd-react-native-ios.md#NFR24] — iOS 16.0+ support
- [Source: docs/planning/prd-react-native-ios.md#NFR26] — Light mode only MVP
- [Source: docs/project-context.md] — Current project structure, established patterns
- [Source: _bmad-output/implementation-artifacts/6-1-onboarding-flow.md] — Previous story patterns, test count
- [Source: _bmad-output/implementation-artifacts/5-2-in-app-purchase-flow-and-restore.md] — Settings premium section implementation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npx expo install expo-build-properties` accidentally removed `@shopify/react-native-skia` — re-installed pinned 2.5.1.
- Biome formatter required single-line import after removing `waitFor`, and `{" "}` → space in JSX.

### Completion Notes List

- Task 1: Added About section (Version, Wada Attribution with 和田三造 in Noto Serif JP, Privacy) below Premium section using same card pattern. All rows use View (non-interactive), 44px min-h, accessibilityLabel. expo-constants for dynamic version.
- Task 2: app.json updated — name capitalized, bundleIdentifier "com.outfinder.app", buildNumber "1", supportsTablet false, ITSAppUsesNonExemptEncryption false, userInterfaceStyle "light", splash bg "#fafaf8", removed android section and web section (iOS only MVP), removed non-existent ios.icon, added expo-build-properties plugin with iOS 16.0 deployment target.
- Task 3: Created eas.json with development/preview/production profiles.
- Task 4: 5 new tests added (about section, version, attribution, privacy, no placeholder). 343 total tests pass across 28 suites. tsc and lint clean.
- **App Store assets still needed before submission:** App icon (1024x1024 PNG, no alpha), branded splash screen on bg-paper, App Store screenshots (6.7" 1290x2796 and 6.1" 1179x2556 — Color Home, Combinations, Outfit Visualizer, Share flow), App Store metadata (title "Outfinder", subtitle, description, keywords: outfit/color coordination/Wada/what to wear, category: Lifestyle), Privacy URL (static page).

### File List

- `src/screens/Settings.tsx` (MODIFIED) — Added About section with Version, Wada Attribution, Privacy rows; import expo-constants
- `src/screens/Settings.test.tsx` (MODIFIED) — Added 5 tests for About section; mock expo-constants
- `app.json` (MODIFIED) — App Store-ready config: name, bundleIdentifier, buildNumber, infoPlist, light mode, splash bg, deployment target
- `eas.json` (NEW) — EAS Build profiles: development, preview, production
- `package.json` (MODIFIED) — Added expo-build-properties dependency
- `pnpm-lock.yaml` (MODIFIED) — Lockfile updated for expo-build-properties
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) — Story status → review

## Senior Developer Review (AI)

**Reviewer:** Alejandro (via Claude Opus 4.6) | **Date:** 2026-03-23
**Outcome:** Approved (all issues fixed)

### Findings (5 total: 2 MEDIUM, 3 LOW — all resolved)

| # | Severity | File | Finding | Fix |
|---|----------|------|---------|-----|
| M1 | MEDIUM | Settings.tsx:277-278 | JSX line break inserted space before possessive 's — rendered "和田三造 's" instead of "和田三造's" | Used JSX expression `{'\'s "A Dictionary..."'}` to eliminate whitespace |
| M2 | MEDIUM | eas.json:13-17 | Preview profile used `"distribution": "internal"` (ad-hoc) but epic AC specifies TestFlight | Changed to `"distribution": "store"` for TestFlight compatibility |
| L1 | LOW | Settings.test.tsx:220-228 | Attribution test only checked testID + accessibilityLabel, not rendered text | Added regex assertions for 和田三造 and "A Dictionary of Color Combinations" |
| L2 | LOW | Settings.test.tsx:231-237 | Privacy test only checked testID + accessibilityLabel, not rendered text | Added assertion for "Privacy: No data collected" text |
| L3 | LOW | Settings.test.tsx:212-218 | Version test missing accessibility label assertion | Added `getByLabelText("Version 1.2.3")` assertion |

### Verification Post-Fix

- `npx tsc --noEmit` ✅
- `pnpm lint` ✅
- `pnpm test` ✅ (343 tests, 28 suites)

## Change Log

- 2026-03-23: Story 6.2 implementation — Settings About section, app.json App Store config, eas.json build profiles, 5 new tests (343 total)
- 2026-03-23: Code review — fixed attribution space bug, EAS preview→store distribution, strengthened 3 test assertions (Story 6.2)
