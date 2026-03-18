# Story 5.2: In-App Purchase Flow & Restore

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to purchase premium with Face ID and restore my purchase on a new device,
so that I can unlock unlimited favorites securely and permanently.

## Acceptance Criteria

1. **Purchase flow with loading feedback** — When user taps "Unlock Unlimited" CTA on PremiumPaywall, the button shows an ActivityIndicator and is disabled while RevenueCat processes the purchase via StoreKit 2 (FR27). On success: `isPremium` updates to `true`, cached in SecureStore, paywall dismisses with `hapticRigid()`, and the blocked favorite is auto-saved (FR28, FR30).

2. **Purchase error handling** — When the purchase encounters an error (network failure, StoreKit error, IAP disabled), a user-friendly error message appears inline in the paywall below the CTA. The paywall remains visible for retry. All RevenueCat/StoreKit calls are wrapped in try/catch (NFR20). Error message auto-dismisses after 5 seconds.

3. **User cancellation is silent** — When the user cancels the StoreKit purchase sheet (Face ID/Apple Pay dismissal), no error message is shown. The paywall returns to idle state. Detection via `PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR`.

4. **Restore from paywall with feedback** — When user taps "Restore Purchase" on the paywall, a loading indicator replaces the link text while `Purchases.restorePurchases()` runs. On success: entitlement restored, `isPremium` updated, SecureStore refreshed, paywall dismisses with `hapticLight()` (FR29, NFR23). On failure: user-friendly message shown inline.

5. **Settings premium management** — Settings screen shows premium status ("Premium Active" badge vs "Free Plan"), a "Restore Purchases" button with loading/success/error states, and an "Upgrade to Premium" row for free users that opens PremiumPaywall (Settings entry point, no `blockedCombination`).

6. **Tests pass** — Updated tests cover: loading states on CTA and Restore, disabled buttons during loading, error message rendering and auto-dismiss, cancellation handling (no error shown), Settings premium section. `pnpm lint`, `npx tsc --noEmit`, `pnpm test` all pass.

7. **Epic 5 complete — FR24-FR30 verified** — All 7 functional requirements confirmed satisfied across Stories 5.1 and 5.2. Adversarial code review run and findings resolved before merging.

## Tasks / Subtasks

- [x] Task 1: Add purchase/restore loading and error states to paywall flow (AC: #1, #2, #3, #4)
  - [x] 1.1 Read existing `src/hooks/usePremiumGate.ts`, `src/contexts/PremiumContext.tsx`, `src/components/PremiumPaywall.tsx`, and `__mocks__/react-native-purchases.js` to understand current implementation
  - [x] 1.2 Update `__mocks__/react-native-purchases.js` — add `PURCHASES_ERROR_CODE` enum export (PURCHASE_CANCELLED_ERROR, NETWORK_ERROR, STORE_PROBLEM_ERROR, PURCHASE_NOT_ALLOWED_ERROR)
  - [x] 1.3 Add `purchaseState: 'idle' | 'purchasing' | 'restoring' | 'error'` and `errorMessage: string | null` to `usePremiumGate` return type. Update `handlePurchase`: set 'purchasing' → on cancel (detect via `error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR`) reset to 'idle' silently → on error set 'error' with mapped friendly message → auto-clear error after 5s. Update `handleRestore`: set 'restoring' → on success dismiss → on error set 'error' with message.
  - [x] 1.4 Add `purchaseState` and `errorMessage` props to `PremiumPaywallProps`. Update UI: CTA shows ActivityIndicator (white, small) when `purchaseState === 'purchasing'` (button disabled), "Restore Purchase" shows ActivityIndicator when `purchaseState === 'restoring'` (link disabled), error banner below CTA when `purchaseState === 'error'` (subtle red-tinted bg, 13px text, 5s auto-dismiss). Both CTA and Restore disabled during any loading state. Accessibility: error banner has `accessibilityRole="alert"`, loading states update button `accessibilityLabel`.
  - [x] 1.5 Update `src/screens/Combinations.tsx` and `src/screens/FavoritesList.tsx` — pass `purchaseState={gate.purchaseState}` and `errorMessage={gate.errorMessage}` to PremiumPaywall

- [x] Task 2: Add premium management section to Settings screen (AC: #5)
  - [x] 2.1 Read current `src/screens/Settings.tsx` to understand its state (may have been modified by Story 6.1)
  - [x] 2.2 Add premium status display — "Premium Active ✓" row (premiumAccent text) when `isPremium`, "Free Plan" badge when not. Use `usePremium()` hook.
  - [x] 2.3 Add "Restore Purchases" button with inline loading/error/success state (use `usePremium().restore()` directly, manage local loading/error state)
  - [x] 2.4 Add "Upgrade to Premium" row for free users — opens PremiumPaywall via `usePremiumGate` (Settings entry, no `blockedCombination`). Settings must import `useFavorites()` to pass `toggleFavorite` to `handlePurchase(toggleFavorite)` callback (consistent with Combinations.tsx pattern). Render PremiumPaywall in Settings.
  - [x] 2.5 Pass `purchaseState` and `errorMessage` from usePremiumGate to the Settings PremiumPaywall instance

- [x] Task 3: Tests for purchase/restore UX and Settings premium section (AC: #6)
  - [x] 3.1 Update `src/components/PremiumPaywall.test.tsx` — test: CTA shows ActivityIndicator when purchasing, CTA disabled during purchasing, Restore shows ActivityIndicator when restoring, both disabled during any loading, error message renders with correct text, error auto-dismiss, no error shown when purchaseState is 'idle' after cancellation
  - [x] 3.2 Create/update `src/hooks/usePremiumGate.test.tsx` — test: purchaseState transitions (idle → purchasing → idle on success/cancel, idle → purchasing → error on failure), restoreState transitions, cancellation detection sets idle (not error), error message content for different error codes, error auto-clear after 5s
  - [x] 3.3 Create `src/screens/Settings.test.tsx` — test: premium status badge (isPremium true vs false), restore button with loading state, upgrade button presence for free users, upgrade opens paywall
  - [x] 3.4 Run full test suite — `pnpm test`, `pnpm lint`, `npx tsc --noEmit` — verify no regressions

- [x] Task 4: AC verification and FR24-FR30 epic completion check (AC: #7)
  - [x] 4.1 Point-by-point AC verification for Story 5.2 (all 7 ACs)
  - [x] 4.2 FR24-FR30 cross-verification across Epic 5 (both stories 5.1 and 5.2)
  - [x] 4.3 Final `pnpm lint`, `npx tsc --noEmit`, `pnpm test` all pass

## Dev Notes

### Critical: This Is a MODIFICATION Story, Not a Creation Story

Story 5.1 already implemented the core purchase/restore infrastructure:
- `src/contexts/PremiumContext.tsx` — has `purchase()` and `restore()` async methods that call RevenueCat SDK
- `src/hooks/usePremiumGate.ts` — has `handlePurchase()` (calls context.purchase + hapticRigid + toggleFavorite) and `handleRestore()` (calls context.restore + hapticLight)
- `src/components/PremiumPaywall.tsx` — full bottom sheet UI with `onPurchase`, `onRestore`, `onDismiss` callback props
- `__mocks__/react-native-purchases.js` — Jest mock for RevenueCat SDK
- `src/config/premium.ts` — centralized config with placeholder API key

**What's MISSING (this story adds):**
1. **Loading states** during purchase/restore (no visual feedback currently — button fires async and user sees nothing until success/failure)
2. **User-friendly error messages** (errors are thrown/caught but no UI feedback — just console.warn)
3. **Cancellation detection** (user cancel is currently treated same as error)
4. **Settings screen premium management** (Settings.tsx is a placeholder)

**READ EXISTING CODE FIRST** before modifying. The existing patterns are well-established from Story 5.1.

### RevenueCat Error Handling — CRITICAL

`react-native-purchases` ^9.12.0 throws errors with typed error codes. Import and use:

```typescript
import Purchases, { PURCHASES_ERROR_CODE } from "react-native-purchases";

try {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
} catch (error) {
  if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    // User cancelled Face ID / Apple Pay sheet — SILENT, no error message
    return; // reset to idle
  }
  // Real error — show user-friendly message
  // NOTE: purchase() in PremiumContext may throw non-RevenueCat errors
  // (e.g., Error("No package available")) which lack .code property —
  // these hit the "Other / unknown" fallback message.
}
```

**User-friendly error message mapping:**

| Error Code | User Message |
|---|---|
| `PURCHASE_CANCELLED_ERROR` | *(no message — silent return to idle)* |
| `NETWORK_ERROR` | "Check your internet connection and try again." |
| `STORE_PROBLEM_ERROR` | "The App Store is temporarily unavailable. Try again later." |
| `PURCHASE_NOT_ALLOWED_ERROR` | "In-app purchases are disabled on this device." |
| Other / unknown | "Something went wrong. Please try again." |

**Restore-specific messages:**

| Scenario | User Message |
|---|---|
| No active entitlement after restore | "No previous purchase found for this Apple ID." |
| Network error | "Check your internet connection and try again." |
| Success | *(no message — paywall dismisses, hapticLight)* |

### Current PremiumPaywall Props Interface (Story 5.1)

```typescript
interface PremiumPaywallProps {
  visible: boolean;
  blockedCombination?: Combination;
  favoriteCombinationIds: string[];
  priceString: string;
  onPurchase: () => void;
  onRestore: () => void;
  onDismiss: () => void;
}
```

**Add these new props:**
```typescript
  purchaseState: 'idle' | 'purchasing' | 'restoring' | 'error';
  errorMessage: string | null;
```

Callback types (`onPurchase: () => void`) do NOT change. The paywall fires callbacks and receives state back through props — clean separation.

### Current usePremiumGate Return Type (Story 5.1)

```typescript
interface PremiumGateState {
  paywallVisible: boolean;
  blockedCombination: Combination | undefined;
  toastVisible: boolean;
  toastOpacity: Animated.Value;
  favoriteCombinationIds: string[];
  priceString: string;
  handlePremiumGate: (combinationId: string) => void;
  handleDismiss: () => void;
  handlePurchase: (toggleFavorite: (id: string) => void) => Promise<void>;
  handleRestore: () => Promise<void>;
}
```

**Add these new fields:**
```typescript
  purchaseState: 'idle' | 'purchasing' | 'restoring' | 'error';
  errorMessage: string | null;
```

### State Flow for handlePurchase

```
User taps CTA → purchaseState = 'purchasing'
  → Purchases.purchasePackage() called
  ├─ Success → hapticRigid(), toggleFavorite(), dismiss paywall, purchaseState = 'idle'
  ├─ Cancelled (PURCHASE_CANCELLED_ERROR) → purchaseState = 'idle' (NO error message)
  └─ Error → purchaseState = 'error', errorMessage = friendly text, auto-clear 5s
```

### State Flow for handleRestore

```
User taps Restore → purchaseState = 'restoring'
  → Purchases.restorePurchases() called
  ├─ Success (entitlement active) → hapticLight(), dismiss paywall, purchaseState = 'idle'
  ├─ No entitlement found → purchaseState = 'error', errorMessage = "No previous purchase..."
  └─ Error → purchaseState = 'error', errorMessage = friendly text, auto-clear 5s
```

### UI Design for Loading/Error States

**CTA Button loading state:**
- Replace "Unlock Unlimited" text with `<ActivityIndicator size="small" color="#ffffff" />`
- Button keeps same size/shape (prevents layout shift)
- `disabled={purchaseState !== 'idle'}` on CTA
- `accessibilityLabel="Purchasing, please wait"` when purchasing

**Restore link loading state:**
- Replace "Restore Purchase" text with small `<ActivityIndicator size="small" color={textTertiary} />`
- Disable both "Restore Purchase" and "Not now" during any loading state

**Error banner (below CTA, above secondary actions):**
- Background: `rgba(231, 76, 60, 0.08)` (subtle red tint — not alarming, fits Wada aesthetic)
- Text color: `textSecondary` (#6b6b6b), 13px Inter
- Padding: 8px 12px, rounded 8px
- `accessibilityRole="alert"` for VoiceOver immediate announcement
- Auto-dismiss: 5 seconds (use setTimeout, reset purchaseState to 'idle' and errorMessage to null)

### Settings Screen — Minimal Premium Section

`src/screens/Settings.tsx` is a placeholder (Epic 1). Story 6.1 (Onboarding) is done and may have added content. **Read the current file before modifying.**

Story 6.2 will build the full Settings screen. Story 5.2 adds ONLY a minimal premium management section:

**Design as a self-contained group** (easy for 6.2 to integrate):
- **Section header:** "Premium" (textPrimary, 16px bold)
- **Status row:** "Premium Active ✓" (premiumAccent text) when isPremium, or "Free Plan · 5 favorites" when not
- **"Restore Purchases" button** — with inline loading (ActivityIndicator replaces text), success ("Restored!"), error (inline message). Use `usePremium().restore()` directly with local state management.
- **"Upgrade to Premium" row** (only when !isPremium) — tapping opens PremiumPaywall via usePremiumGate (Settings entry point, no blockedCombination)
- Render PremiumPaywall at the bottom of Settings when visible

### Mock Updates Required

The existing `__mocks__/react-native-purchases.js` mock needs `PURCHASES_ERROR_CODE` added:

```javascript
// Add to existing mock exports:
const PURCHASES_ERROR_CODE = {
  PURCHASE_CANCELLED_ERROR: "PURCHASE_CANCELLED_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  STORE_PROBLEM_ERROR: "STORE_PROBLEM_ERROR",
  PURCHASE_NOT_ALLOWED_ERROR: "PURCHASE_NOT_ALLOWED_ERROR",
  PURCHASE_INVALID_ERROR: "PURCHASE_INVALID_ERROR",
  PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: "PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR",
};

module.exports = {
  ...existingExports,
  PURCHASES_ERROR_CODE,
};
```

### Apple Developer Account — Still Not Available

Same constraint as Story 5.1: placeholder API key `"appl_PLACEHOLDER_REPLACE_ME"` in `src/config/premium.ts`. This means:
- `Purchases.purchasePackage()` WILL throw in dev → this is exactly what Story 5.2 handles with error UX
- `Purchases.restorePurchases()` WILL throw in dev → same
- The error messages being added are what real users will see if anything goes wrong

### Files to Modify

| File | Changes |
|---|---|
| `src/hooks/usePremiumGate.ts` | Add purchaseState, errorMessage state; update handlePurchase/handleRestore with state transitions, cancellation detection, error message mapping, auto-clear timer |
| `src/components/PremiumPaywall.tsx` | Add purchaseState/errorMessage props; CTA loading + disabled, Restore loading, error banner, accessibility |
| `src/screens/Combinations.tsx` | Pass `purchaseState` and `errorMessage` from usePremiumGate to PremiumPaywall (2-line change) |
| `src/screens/FavoritesList.tsx` | Same as Combinations.tsx (2-line change) |
| `src/screens/Settings.tsx` | Add premium status section, restore button, upgrade button, PremiumPaywall rendering |
| `__mocks__/react-native-purchases.js` | Add PURCHASES_ERROR_CODE enum export |
| `src/components/PremiumPaywall.test.tsx` | Tests for loading states, error rendering, cancellation, disabled buttons |
| `src/screens/Settings.test.tsx` | Tests for premium section |

### Files NOT to Modify

- `src/contexts/PremiumContext.tsx` — purchase/restore methods work correctly as-is. Error detection happens in usePremiumGate, not the context.
- `src/config/premium.ts` — No changes needed
- `src/components/FavoriteButton.tsx` — No changes needed
- `src/components/PaletteStrip.tsx` — No changes needed
- `src/components/CombinationList.tsx` — No changes needed

### Existing Patterns to Follow

- **State management:** Follow `usePremiumGate.ts` existing pattern — hook encapsulates all state logic
- **Props interface:** Always `interface {ComponentName}Props`
- **NativeWind:** `className` for static, `style={{}}` only for dynamic colors
- **Haptics:** `hapticRigid()` on purchase success, `hapticLight()` on restore success (already in usePremiumGate)
- **Accessibility:** `accessibilityRole`, `accessibilityLabel` on all interactive elements, `accessibilityRole="alert"` for error messages, 44px touch targets
- **Animations:** `useReducedMotion()` check — error banner fade can be instant when reduced motion enabled
- **Tests:** Co-located `.test.tsx`, `testID` attributes, mock `@/lib/haptics`, mock `react-native-purchases`
- **Toast:** Existing toast pattern in usePremiumGate (3s auto-dismiss with Animated.Value) — error auto-dismiss follows similar 5s pattern

### Previous Story Learnings (from Story 5.1)

- SecureStore key is `outfinder_premium_status` (no @ or / — was bug in 5.1, fixed)
- Biome auto-fixes import ordering — let it run, don't fight it
- `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)` for React 19 type compat on timers
- Biome `noUselessCatch` rule — don't wrap try/catch just to rethrow. Catch at the usePremiumGate level.
- The `usePremiumGate` hook was extracted during 5.1 code review to eliminate ~50 lines duplication between Combinations and FavoritesList — this is the central place for all purchase/restore state logic

### Design Tokens (from src/styles/theme.ts)

- `bgPaper` (#fafaf8) — sheet/settings background
- `bgElevated` (#f5f5f3) — settings section background
- `textPrimary` (#1a1a1a) — section headers, CTA background
- `textSecondary` (#6b6b6b) — body text, error message text
- `textTertiary` (#9b9b9b) — secondary actions, restore link
- `premiumAccent` (#c4a265) — premium status badge, limit badge
- `favoriteRed` (#E74C3C) — error tint base (use at 0.08 opacity for banner bg)

### Branching

- Create branch `story-5.2-in-app-purchase-flow-and-restore` off `epic-1` (main branch)
- Story 5.1 is already merged into `epic-1`

### FR24-FR30 Reference (for Task 4 verification)

- **FR24:** Core features remain free (color exploration, outfit visualizer, social sharing) — verified in 5.1
- **FR25:** Paywall appears when exceeding free limit (5 favorites) — verified in 5.1
- **FR26:** Paywall shows details (palettes, price, CTA) — verified in 5.1
- **FR27:** RevenueCat/StoreKit 2 presents purchase sheet — purchase() calls Purchases.purchasePackage()
- **FR28:** Face ID / Apple Pay authentication — native StoreKit behavior
- **FR29:** Restore purchases across devices — restore() calls Purchases.restorePurchases()
- **FR30:** Cached premium status for instant unlock — SecureStore read on launch, background re-validation

### Project Structure Notes

- All files follow existing project structure
- No new files needed (only modifications)
- No new directories needed
- Settings.tsx premium section should be a self-contained group for easy integration into 6.2's full Settings redesign

### References

- [Source: docs/planning/epics.md#Story 5.2] — AC, BDD scenarios, FR27-FR30
- [Source: docs/planning/paywall-ux-spec.md] — Paywall visual spec (implemented in 5.1, reference for state additions)
- [Source: docs/planning/epic-5-setup-guide.md] — Setup guide, placeholder key, RevenueCat identifiers
- [Source: docs/planning/architecture-react-native-ios.md] — IAP architecture, RevenueCat integration patterns
- [Source: docs/project-context.md] — Established patterns, component conventions, haptics, accessibility
- [Source: _bmad-output/implementation-artifacts/5-1-premium-context-and-paywall-ui.md] — Story 5.1 full implementation details, code review findings, file list
- [Source: src/hooks/usePremiumGate.ts] — Primary file to modify (central state machine)
- [Source: src/components/PremiumPaywall.tsx] — Primary file to modify (UI states)
- [Source: src/screens/Settings.tsx] — File to modify (add premium section)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Branch created from `story-6.1-onboarding-flow` (not `epic-1`) because epic-1 was missing Epics 4-6 code
- Sprint-status.yaml on epic-1 was stale — updated to reflect actual completion state

### Completion Notes List

- Task 1: Added `PurchaseState` type and `purchaseState`/`errorMessage` to usePremiumGate. Implemented `getPurchaseErrorMessage()` and `getRestoreErrorMessage()` helper functions for error code → user-friendly message mapping. Added 5s auto-clear timer for errors. Updated PremiumPaywall with ActivityIndicator on CTA (purchasing) and Restore (restoring), error banner with `accessibilityRole="alert"`, all buttons disabled during loading. Passed new props through Combinations and FavoritesList screens.
- Task 2: Transformed Settings placeholder into premium management section with status badge (Premium Active / Free Plan), Restore Purchases button with loading/success/error states, and Upgrade to Premium row that opens PremiumPaywall via usePremiumGate. Self-contained section design for easy 6.2 integration.
- Task 3: Added 12 new PremiumPaywall tests (loading states, error states, disabled buttons, accessibility labels), 16 new usePremiumGate hook tests (state transitions, cancellation detection, error message mapping, auto-clear), 10 new Settings screen tests. Total: 334 tests, all passing.
- Task 4: All 7 ACs verified point-by-point. FR24-FR30 cross-verified across Epic 5. Lint, types, and tests all clean.
- Code Review (adversarial): 8 findings (2 HIGH, 5 MEDIUM, 1 LOW) — all fixed:
  - **H1** Settings "Upgrade to Premium" silently broken after paywall dismiss (paywallDismissedThisSession guard + missing toast). Fix: added `openPaywall()` method to usePremiumGate that bypasses session guard; Settings uses it directly.
  - **H2** Paywall overlay tap and swipe gesture allowed dismiss during active purchase/restore. Fix: overlay `onPress` disabled when `isLoading`; pan gesture `.enabled(!isLoading)`.
  - **M1** Settings restore error persisted indefinitely (no auto-dismiss). Fix: added 5s timeout for errors, 3s for success "Restored!" state.
  - **M2** Restore error message mapping duplicated between Settings and usePremiumGate. Fix: exported `getRestoreErrorMessage()` from usePremiumGate; Settings imports it.
  - **M3** Missing interaction test for Settings upgrade button opening paywall. Fix: added test.
  - **M4** usePremiumGate test didn't verify `toggleFavorite` called on purchase success. Fix: added assertion.
  - **M5** Missing tests for Settings restore success/error display. Fix: added 2 tests with deferred promise pattern.
  - **L1** "Restored!" state persisted indefinitely. Fix: 3s timeout resets to idle.

### File List

- `__mocks__/react-native-purchases.js` — Modified: added PURCHASES_ERROR_CODE enum export
- `src/hooks/usePremiumGate.ts` — Modified: added PurchaseState type, purchaseState/errorMessage state, error mapping functions, auto-clear timer, cancellation detection, `openPaywall()` method, exported `getRestoreErrorMessage()`
- `src/components/PremiumPaywall.tsx` — Modified: added purchaseState/errorMessage props, ActivityIndicator on CTA and Restore, error banner, disabled states, accessibility updates, overlay/gesture dismiss blocked during loading
- `src/screens/Combinations.tsx` — Modified: pass purchaseState and errorMessage to PremiumPaywall
- `src/screens/FavoritesList.tsx` — Modified: pass purchaseState and errorMessage to PremiumPaywall
- `src/screens/Settings.tsx` — Modified: replaced placeholder with premium management section (status, restore, upgrade via `openPaywall()`, paywall), uses shared `getRestoreErrorMessage()`, auto-dismiss on restore success/error
- `src/components/PremiumPaywall.test.tsx` — Modified: added 13 tests for loading/error/default states + overlay dismiss blocked during loading
- `src/hooks/usePremiumGate.test.tsx` — Created: 16 tests for hook state transitions, error mapping, auto-clear, toggleFavorite verification
- `src/screens/Settings.test.tsx` — Created: 13 tests for premium section rendering, interactions, restore success/error, upgrade opens paywall
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: story status updates
- `_bmad-output/implementation-artifacts/5-2-in-app-purchase-flow-and-restore.md` — Modified: task checkboxes, Dev Agent Record, status

## Change Log

- 2026-03-18: Story 5.2 implemented — purchase/restore loading states, error handling with user-friendly messages, silent cancellation, Settings premium management section. 36 new tests added (334 total). All ACs satisfied, FR24-FR30 verified across Epic 5.
- 2026-03-18: Code review — 8 findings (2H/5M/1L) all fixed. Key fixes: Settings upgrade uses `openPaywall()` bypassing session guard, overlay/gesture blocked during loading, restore auto-dismiss, DRY error messages, 4 new tests. 338 total tests passing.
