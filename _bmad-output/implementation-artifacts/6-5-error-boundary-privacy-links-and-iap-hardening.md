# Story 6.5: Error Boundary, Privacy Links & IAP Hardening

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user and App Store reviewer,
I want the app to never show a blank white screen on unexpected errors, display accessible privacy and support links, and handle all IAP edge cases gracefully, so that the app is resilient, transparent, and App Store compliant.

## Acceptance Criteria

1. **Given** any unhandled JavaScript exception occurs during rendering in any screen, **When** React catches the error, **Then** a full-screen fallback UI is displayed instead of a white screen crash. The fallback shows an "Outfinder" heading, a "Something went wrong" message, and a "Restart" button that resets the app to its initial state. The ErrorBoundary wraps the main app content in `App.tsx` (both onboarding and main app paths). The ErrorBoundary is a class component (React requirement for `componentDidCatch`).

2. **Given** the user is on the Settings screen, **When** they view the About section, **Then** two new rows appear below the Version row: "Privacy Policy" (opens `https://servh.github.io/outfinder-legal/` in the system browser) and "Support" (opens `https://servh.github.io/outfinder-legal/support.html` in the system browser). Both rows are Pressable with `accessibilityRole="link"`, `accessibilityLabel`, `min-h-[44px]`, and a right-arrow chevron or external-link indicator.

3. **Given** `purchase()` is called in PremiumContext, **When** any RevenueCat or SecureStore API call throws, **Then** the error is caught internally, SecureStore failures are handled gracefully (purchase still succeeds from the user's perspective if RevenueCat confirmed the entitlement), and the original purchase error is re-thrown so `usePremiumGate` can display the user-facing error message. The same applies to `restore()` — SecureStore cache failure does not prevent a successful restore from being recognized.

4. **Given** all tasks are complete, **When** verification runs, **Then** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass with 0 errors. New tests cover: ErrorBoundary rendering fallback on error, ErrorBoundary restart button, Settings privacy/support links, and purchase/restore try-catch behavior.

## Tasks / Subtasks

- [x] Task 1: Create ErrorBoundary component (AC: #1)
  - [x] 1.1 Create `src/components/ErrorBoundary.tsx`. It must be a class component (React's `componentDidCatch` API does not work with function components). Define `interface ErrorBoundaryProps { children: ReactNode }` and `interface ErrorBoundaryState { hasError: boolean }`.
  - [x] 1.2 Implement `static getDerivedStateFromError(): ErrorBoundaryState` returning `{ hasError: true }`. Implement `componentDidCatch(error, info)` — log to `console.error` only in `__DEV__` mode (same pattern as Story 6.3).
  - [x] 1.3 In the `render()` method: if `hasError` is true, return a fallback View filling the screen (`flex-1 bg-paper items-center justify-center px-6`). Show: "Outfinder" heading (font-serif-jp-medium, text-[20px], text-text-primary), "Something went wrong" message (font-sans, text-[14px], text-text-secondary, mt-3), and a "Restart" Pressable button (min-h-[48px], rounded-full, bg-text-primary, px-8, mt-6). The button calls `this.setState({ hasError: false })` to re-mount children. All elements have `accessibilityLabel` and `accessibilityRole`. All Text elements have `allowFontScaling`.
  - [x] 1.4 Create `src/components/ErrorBoundary.test.tsx`. Tests: renders children when no error, renders fallback when child throws, restart button clears error state and re-renders children, logs error in __DEV__ mode.

- [x] Task 2: Wrap App.tsx with ErrorBoundary (AC: #1)
  - [x] 2.1 In `App.tsx`, import `ErrorBoundary` from `@/components/ErrorBoundary`. Wrap the content inside `<SafeAreaProvider>` with `<ErrorBoundary>`. The ErrorBoundary should wrap both the Onboarding and the main app paths — place it inside SafeAreaProvider but outside the conditional.
  - [x] 2.2 Update `App.test.tsx` — add a test: when a child component throws during render, the ErrorBoundary fallback is displayed instead of crashing. Mock a component that throws and verify "Something went wrong" is shown.

- [x] Task 3: Add Privacy Policy and Support links to Settings (AC: #2)
  - [x] 3.1 In `src/screens/Settings.tsx`, import `Linking` from `react-native`. Define two constants at the top of the file: `PRIVACY_URL` and `SUPPORT_URL`.
  - [x] 3.2 In the About section's `bg-elevated` card (after the Version row), add a divider and two new Pressable rows: Privacy Policy and Support with correct testIDs, accessibilityRole="link", min-h-[44px], and "›" indicator.
  - [x] 3.3 Both rows follow the same pattern as the Version row: `px-4 py-3 min-h-[44px] flex-row items-center justify-between`.
  - [x] 3.4 Update `src/screens/Settings.test.tsx`: add tests verifying both rows render, have correct testIDs, have `accessibilityRole="link"`, and call `Linking.openURL` with the correct URL when pressed. Mock `Linking.openURL` with `jest.spyOn`.

- [x] Task 4: Add try-catch to purchase() and restore() (AC: #3)
  - [x] 4.1 In `src/contexts/PremiumContext.tsx`, wrap only `SecureStore.setItemAsync` in try-catch inside `purchase()`. RevenueCat calls still throw naturally.
  - [x] 4.2 Apply the same pattern to `restore()`: wrap `SecureStore.setItemAsync` in try-catch so a keychain failure doesn't prevent a successful restore.
  - [x] 4.3 Update `src/contexts/PremiumContext.test.tsx`: add tests for both purchase() and restore() — when SecureStore.setItemAsync throws, the purchase/restore still succeeds (isPremium is true) and the error is swallowed with a __DEV__ warning. Also fixed stale API key in existing test.

- [x] Task 5: Final verification (AC: #4)
  - [x] 5.1 Run `npx tsc --noEmit` — 0 errors.
  - [x] 5.2 Run `pnpm lint` — 0 errors, 0 warnings.
  - [x] 5.3 Run `pnpm test` — 371 tests pass across 30 suites (was 357 across 29).
  - [x] 5.4 Point-by-point AC verification — all 4 ACs satisfied.
  - [x] 5.5 File List matches `git diff --name-status`.

## Dev Notes

### Epic Context

Story 6.5 in Epic 6 (App Store Preparation). This story addresses the 3 remaining blockers/high-severity findings from the pre-launch adversarial review that require code changes. The RevenueCat API key replacement (finding #1) was already done manually by the developer. App Store Connect metadata (finding #5) is handled outside of code.

### Current State

357 tests pass across 29 suites (after Story 6.4). Lint and TypeScript clean. The privacy policy and support pages are live at:
- **Privacy:** https://servh.github.io/outfinder-legal/
- **Support:** https://servh.github.io/outfinder-legal/support.html

### Task 1 Deep Dive: ErrorBoundary

React requires a **class component** for error boundaries — `componentDidCatch` and `getDerivedStateFromError` are not available as hooks. This is the only class component in the codebase — document this exception.

The fallback UI should be minimal and match the Wada aesthetic:
- Background: `bg-paper` (#fafaf8)
- Heading: "Outfinder" in NotoSerifJP_500Medium
- Message: "Something went wrong" in Inter
- Button: dark bg (text-primary color) with white text, rounded-full

The "Restart" button calls `setState({ hasError: false })` which causes React to re-attempt rendering the children tree. This is the standard recovery pattern — if the error was transient (e.g., race condition), the app recovers. If the error persists, the boundary catches it again.

**Important:** The ErrorBoundary does NOT catch errors in:
- Event handlers (these need their own try-catch — already handled in usePremiumGate, haptics, share)
- Async code (covered by existing try-catch patterns)
- The ErrorBoundary itself

It DOES catch:
- Render-phase errors in any component in the subtree
- Lifecycle method errors
- Constructor errors

### Task 2 Deep Dive: ErrorBoundary Placement in App.tsx

Current App.tsx structure:
```
GestureHandlerRootView
  SafeAreaProvider
    Onboarding | (FavoritesProvider → PremiumProvider → NavigationContainer → TabNavigator)
```

The ErrorBoundary should wrap inside `SafeAreaProvider` (so the fallback can use safe area) but outside both conditional branches:
```
GestureHandlerRootView
  SafeAreaProvider
    ErrorBoundary
      Onboarding | (FavoritesProvider → PremiumProvider → NavigationContainer → TabNavigator)
```

### Task 3 Deep Dive: Settings Links

The About section currently has only the Version row. Add Privacy Policy and Support below it, separated by dividers, inside the same `bg-elevated` card.

Use `Linking.openURL()` — this is the standard React Native API for opening URLs in the system browser. No need for `expo-linking` or `expo-web-browser` since we just need the default browser.

The right arrow "›" is a simple text indicator. Alternatively, use `chevron.right` from expo-symbols if already available — but a text character is simpler and avoids a dependency check.

### Task 4 Deep Dive: purchase/restore try-catch

The adversarial review flagged that `purchase()` and `restore()` call `SecureStore.setItemAsync` without try-catch. If the keychain is full or corrupted, this would throw and the purchase would appear to fail from the user's perspective — even though RevenueCat already confirmed the entitlement.

**The fix is targeted:** Only wrap `SecureStore.setItemAsync` in try-catch. RevenueCat errors (`getOfferings`, `purchasePackage`, `restorePurchases`) must still propagate so `usePremiumGate` can show the user-facing error messages.

**Why this matters:** On the next app launch, `init()` will re-validate entitlements with RevenueCat and update the cache. So a transient SecureStore failure is self-healing.

### Patterns to Follow

- **Named exports** — `export function ErrorBoundary` (exception: class component, still named export)
- **NativeWind `className`** for static styles in the fallback UI
- **`accessibilityLabel`** and `accessibilityRole` on all interactive elements
- **`allowFontScaling`** on all Text elements
- **`min-h-[44px]`** touch targets
- **`testID`** on all testable elements
- **`if (__DEV__)`** guard on console.error/warn
- **Co-located tests** — test files next to source

### What NOT to Do

- DO NOT use a function component for ErrorBoundary — React requires a class component
- DO NOT wrap RevenueCat API calls in try-catch inside purchase/restore — they must propagate to usePremiumGate
- DO NOT use `expo-web-browser` or `expo-linking` — `Linking.openURL` from react-native is sufficient
- DO NOT add external link indicators that require new icon dependencies — use a text character ("›")
- DO NOT change the existing PremiumPaywall, usePremiumGate, or Settings restore flow — only add the SecureStore guard and the new About rows

### Git Branching

Create story branch `story-6.5-error-boundary-privacy-iap` off `epic-1` (current main epic branch).

### Files to Create/Modify

- `src/components/ErrorBoundary.tsx` (NEW) — React class component error boundary with Wada-styled fallback
- `src/components/ErrorBoundary.test.tsx` (NEW) — Tests for ErrorBoundary render, fallback, restart
- `App.tsx` (MODIFIED) — Wrap content with ErrorBoundary inside SafeAreaProvider
- `App.test.tsx` (MODIFIED) — Test ErrorBoundary integration
- `src/screens/Settings.tsx` (MODIFIED) — Privacy Policy and Support link rows in About section
- `src/screens/Settings.test.tsx` (MODIFIED) — Tests for new link rows
- `src/contexts/PremiumContext.tsx` (MODIFIED) — try-catch on SecureStore in purchase() and restore()
- `src/contexts/PremiumContext.test.tsx` (MODIFIED) — Tests for SecureStore failure resilience

### References

- [Source: adversarial review findings #2, #3, #5] — This story's origin
- [Source: React docs — Error Boundaries] — Class component requirement, getDerivedStateFromError
- [Source: CLAUDE.md] — Accessibility rules, try-catch on all native API calls, named exports
- [Source: Apple App Review Guidelines 5.1.1] — Privacy policy requirement
- [Privacy Policy URL] — https://servh.github.io/outfinder-legal/
- [Support URL] — https://servh.github.io/outfinder-legal/support.html

## Dev Agent Record

### Implementation Notes

- ErrorBoundary is the only class component in the codebase — required by React's `componentDidCatch` API.
- Fallback UI uses Wada aesthetic: bg-paper, NotoSerifJP heading, Inter body, dark rounded-full restart button.
- ErrorBoundary placed inside SafeAreaProvider but outside both conditional branches (onboarding/main app) in App.tsx.
- Privacy Policy and Support links added to Settings About section using `Linking.openURL` — no new dependencies needed.
- SecureStore try-catch in purchase/restore is targeted: only wraps `setItemAsync`, not RevenueCat calls. Self-healing on next app launch via `init()` entitlement revalidation.
- Fixed pre-existing stale API key in PremiumContext.test.tsx (placeholder → real key, was failing independently).

### Completion Notes

All 5 tasks complete. 373 tests across 30 suites (16 new tests added: 6 ErrorBoundary, 1 App integration, 7 Settings links, 2 PremiumContext resilience). TypeScript and lint clean. All 4 ACs verified point-by-point.

## File List

- `src/components/ErrorBoundary.tsx` (NEW) — React class component error boundary with SafeAreaView fallback
- `src/components/ErrorBoundary.test.tsx` (NEW) — 6 tests for ErrorBoundary render, fallback, restart, a11y, __DEV__ production guard
- `App.tsx` (MODIFIED) — Import ErrorBoundary, wrap content inside SafeAreaProvider
- `App.test.tsx` (MODIFIED) — 1 new test for ErrorBoundary integration, added PremiumProvider + SafeAreaView mocks
- `src/screens/Settings.tsx` (MODIFIED) — Privacy Policy and Support link rows with try-catch on Linking.openURL
- `src/screens/Settings.test.tsx` (MODIFIED) — 7 new tests for link rendering, a11y, URL opening, error resilience
- `src/contexts/PremiumContext.tsx` (MODIFIED) — try-catch on SecureStore.setItemAsync in purchase() and restore()
- `src/contexts/PremiumContext.test.tsx` (MODIFIED) — 2 new tests for SecureStore failure resilience, fixed stale API key
- `src/config/premium.ts` (MODIFIED) — RevenueCat API key placeholder replaced with real key (manual pre-story change)
- `app.json` (MODIFIED) — Bundle ID, expo-dev-client plugin, EAS projectId + owner (manual pre-story change)
- `package.json` (MODIFIED) — react-native-purchases 9.12→9.14, purchases-ui, expo-dev-client (manual pre-story change)
- `pnpm-lock.yaml` (MODIFIED) — Lockfile for package.json changes
- `docs/Privacy Policy.md` (NEW) — Privacy policy document for App Store compliance
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) — Status updated to done

## Change Log

- 2026-03-24: Implemented Story 6.5 — ErrorBoundary component, privacy/support links in Settings, SecureStore try-catch hardening in purchase/restore. 14 new tests added (371 total). Fixed pre-existing stale API key in PremiumContext test.
- 2026-03-24: Code review fixes — (H1) Added try-catch + .catch() on Linking.openURL in Settings, (M1) Updated File List with 5 missing files, (M3) Added __DEV__=false production test for ErrorBoundary, (L1) Wrapped ErrorBoundary fallback with SafeAreaView. Added SafeAreaView mock to App.test.tsx and ErrorBoundary.test.tsx. 373 tests pass (16 new total).
