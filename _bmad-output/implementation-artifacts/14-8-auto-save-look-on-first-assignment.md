# Story 14.8: Auto-save look to Mis Looks on first garment assignment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user in the Ficha Wada working-mode screen (`src/screens/armario/ArmarioFichaWadaScreen.tsx`) who assigns their first garment to any color slot by tapping the slot → picker (`src/screens/armario/ArmarioPickerScreen.tsx`) → commit**,
I want **that assignment to (a) persist the normal `CombinationAssignment` row via `assign()` AND (b) auto-save the combination into Mis Looks by calling `useMisLooksStore.addFavorite(combinationId)` in the SAME commit flow so the look immediately appears in the Mis Looks tab (FR12), with the paywall-limbo disabled state kicking in BEFORE the picker opens when a free user is at 5/5 Mis Looks and this combination is not yet favorited (TD-4 — disabled slots at opacity 40% + discrete explanatory strip + swipe-back works + no blocking overlay)**,
so that **my workspace reflects what I'm actually working on without me having to remember to "save" it (FR12), entering Ficha Wada and exiting without action continues to consume zero slots (FR14), and the 5/5 free-user limit is enforced at the only moment that would create a 6th Mis Looks entry — the slot tap that WOULD trigger an auto-save, not the render of the screen**.

## Acceptance Criteria

1. **Given** `src/screens/armario/ArmarioPickerScreen.tsx` currently calls `assign(combinationId, colorIndex, wardrobeItemId)` inside `commitAndDismiss` at lines 178 (with an `unassign` move-semantic branch at line 176 for items already on another slot of the same combo), **When** this story merges, **Then** immediately AFTER the `assign()` call succeeds and BEFORE `hapticLight()` fires, the code calls `useMisLooksStore.getState().addFavorite(combinationId)` (non-React module context — use `getState()`, NOT a selector) wrapped in its own try/catch (so a theoretical store-write failure never prevents the legitimate assignment from persisting — `addFavorite` is idempotent per `src/stores/misLooksStore.ts:164–171`, so this is a safe always-call). **And** the move-semantic branch (existing-slot-unassign-then-assign per line 176) receives the SAME auto-save call after its `assign()` completes — because a move is still a "this combination has an assignment" state, and if the user moved a garment into a fresh combo with no prior assignments, that is a first-assignment. **And** the previously-captured state (per AC #3 below) is read from the store snapshot taken BEFORE `commitAndDismiss` starts so the paywall-limbo decision is made against the pre-assignment world, not after.

2. **Given** a user assigns a SECOND (or third, or Nth) garment to the same combination (same `combinationId`, different `colorIndex`), **When** `commitAndDismiss` runs, **Then** `addFavorite(combinationId)` is called unconditionally but — because `addFavorite` checks `current.has(id)` at `misLooksStore.ts:166` and returns early — no state mutation occurs, **And** `favorites.size` remains unchanged, **And** NO `persist` call fires (verified via the early-return on line 166), **And** the existing Mis Looks entry for this combination is preserved byte-for-byte (no duplicate, no new AsyncStorage write for `@mislooks:favorites`).

3. **Given** `src/screens/armario/ArmarioFichaWadaScreen.tsx` renders, **When** the screen mounts or re-renders on store change, **Then** it computes `const needsLimitGate = !isPremium && favorites.size >= PREMIUM_CONFIG.FREE_FAVORITES_LIMIT && !favorites.has(combinationId)` — reading `isPremium` from `usePremium()` (import from `@/contexts/PremiumContext`) and `favorites` from `useMisLooksStore((s) => s.favorites)` (selector, not `getState()`, so render re-fires when the Set reference changes — per 14.2 store contract line 154), **And** `needsLimitGate === true` switches the screen into "paywall-limbo" visual state per TD-4: (a) each slot's outer `<Pressable>` at `ArmarioFichaWadaScreen.tsx:240` wraps with `style={{ opacity: needsLimitGate ? 0.4 : 1 }}` (applied ADDITIVELY alongside the existing `minHeight: 44` so touch targets stay ≥44pt), (b) a new `<MisLooksLimitStrip />` component is rendered immediately BELOW the header row (inserted between the `<Text>armario.s2.instruction</Text>` at line 192–202 and the `<Text>armario.s2.wardrobeLabel</Text>` at line 204–215) — NOT at the `top: insets.top` absolute position (the strip is inline in the scroll column so swipe-back and the existing header chrome remain undisturbed), (c) the primary "Ver tu look" CTA at `:379` additionally respects `disabled={!hydrated || assignedCount === 0 || needsLimitGate}` and `opacity: (!hydrated || assignedCount === 0 || needsLimitGate) ? 0.5 : 1`. **And** `needsLimitGate === false` restores the screen to its current (Story 13.4b / 14.7) visual state byte-for-byte.

4. **Given** `needsLimitGate === true` AND the user taps ANY slot (`handleSlotTap(colorIndex)` at `ArmarioFichaWadaScreen.tsx:92–95`), **When** the tap fires, **Then** the handler SHORT-CIRCUITS before `navigation.push("ArmarioPicker", ...)`: `hapticLight()` still fires (matches current behavior); then instead of navigating, it calls `gate.handlePremiumGate(combinationId)` (the existing `usePremiumGate(favorites)` hook already returns this fn per `src/hooks/usePremiumGate.ts:140`), which pre-selects the blocked combination and sets `paywallVisible = true`, **And** the `<PremiumPaywall>` modal mounts as a sibling of the root `<View>` at `:138` (pattern mirrored verbatim from `ArmarioPreviewScreen.tsx:331` / `FavoritesList.tsx:300` — same prop shape: `visible`, `blockedCombination`, `favoriteCombinationIds`, `priceString`, `purchaseState`, `errorMessage`, `onPurchase`, `onRestore`, `onDismiss`). **And** `onPurchase={() => gate.handlePurchase(addFavorite)}` — note: NOT `toggleFavorite` — because in this screen the user has never favorited this combo (guaranteed by `needsLimitGate`'s `!favorites.has(combinationId)` clause), so on purchase success the paywall should ADD the favorite (which is what `handlePremiumGate`'s `blockedCombinationId` → `toggleFavorite(blockedCombinationId)` branch at `usePremiumGate.ts:159` does — but since `toggleFavorite` on an absent id is an ADD, passing `addFavorite` or `toggleFavorite` produces the same result; we pass `addFavorite` for semantic clarity — this combination is being saved, not toggled). **And** the slot-tap-while-paywalled re-opens the paywall every time (verified via test: two successive taps result in `paywallVisible` going false → true → false → true via dismiss + re-tap).

5. **Given** `needsLimitGate === true` AND the user dismisses the paywall without upgrading (taps "Ahora no" / scrim → `gate.handleDismiss()` fires per `usePremiumGate.ts:145–150`), **When** the dismiss settles, **Then** `paywallVisible` flips back to `false`, **And** the Ficha Wada screen remains visible with the disabled visual state intact (slots opacity 40%, strip visible, "Ver tu look" CTA disabled), **And** NO `goBack()` is triggered (explicitly per TD-4: *"NO automatic goBack(). NO blocking overlay"*), **And** the iOS swipe-back gesture from the left edge continues to work — popping back to the prior screen (Visualizer via 14.6's `handleMakeMine` push, or FavoritesList via the Mis Looks tab), **And** NO mutation to `favorites`, NO mutation to `assignments`.

6. **Given** `needsLimitGate === true` AND the user taps a disabled slot → paywall → taps "Desbloquear Todo" → RevenueCat returns success (per `usePremiumGate.ts:152–176`), **When** the purchase settles, **Then** `gate.handlePurchase(addFavorite)` calls `addFavorite(blockedCombinationId)` (line 159–161 in the hook — now with `addFavorite` instead of `toggleFavorite`; since this combination was absent from the set, both semantics converge), **And** `isPremium` transitions to `true` (via RevenueCat entitlement), **And** `needsLimitGate` becomes `false` on next render (because `!isPremium` is now false — short-circuits the whole expression), **And** the screen re-renders with slots at opacity 1 and strip removed, **And** the user can now tap a slot normally → `navigation.push("ArmarioPicker", ...)` → picker → `commitAndDismiss` → `assign()` → `addFavorite(combinationId)` — at which point `addFavorite` is a no-op because the paywall-purchase path already added it. **And** the favorites count reflects +1 (the look IS saved even before the user assigns a garment — this is the intended behavior per TD-3 / ADR-005 "upgrade-unlocks-auto-save" mental model: the intent of tapping the slot WAS to auto-save, the paywall just gated it until resolution).

7. **Given** `needsLimitGate === true` AND the user goes to the Mis Looks tab (via swipe-back + tab-switch) AND deletes one of their 5 saved Mis Looks entries (triggering `removeFavorite` or `toggleFavorite` via existing FavoritesList flow), **When** the user returns to the Ficha Wada screen (tab-switch back or push-from-new-nav), **Then** the Zustand selector `useMisLooksStore((s) => s.favorites)` fires a re-render because the `favorites` Set reference changed (per the store's `new Set(current); next.delete(id); set({ favorites: next });` pattern at `misLooksStore.ts:172–179`), **And** `favorites.size` is now 4 < 5, **And** `needsLimitGate` becomes `false`, **And** the screen re-renders with slots at opacity 1 and strip removed — all WITHOUT any manual refresh, navigation remount, or `useFocusEffect` side-effect (pure selector-driven reactivity).

8. **Given** a user enters Ficha Wada working mode via any path (Visualizer "Hacer este look mío" from Story 14.6, direct Mis Looks tap for a saved combo, incomplete-look retention surface from Story 14.11, "+ Nuevo look" path from Story 14.10), **When** they navigate away (swipe-back, tab-switch, hardware-back) WITHOUT tapping any slot AND without tapping any "Guardar para luego" affordance (Story 14.9 — not in this story's scope), **Then** NO `assign()` call fires, **And** NO `addFavorite()` call fires, **And** `favorites.size` is unchanged post-nav, **And** `assignments.length` is unchanged post-nav. Explicit FR14 preservation.

9. **Given** a user is currently premium (`isPremium === true` from `usePremium()` context), **When** they enter Ficha Wada and tap any slot — regardless of `favorites.size` (which can be 5, 50, or 500 for a premium user), **Then** `needsLimitGate` is always `false` (short-circuit on `!isPremium`), **And** the slot tap proceeds normally: `hapticLight()` → `navigation.push("ArmarioPicker", ...)` → picker → commit → `assign()` + `addFavorite()` — no paywall, no disabled state, no strip. **And** a premium user assigning for the first time to a combo they had never favorited DOES trigger the auto-save (AC #1's `addFavorite` call) — the FR12 semantic applies to both tiers uniformly (the paywall-limbo in AC #3–#6 is the free-tier-only branch).

10. **Given** the new shared component `src/components/armario/MisLooksLimitStrip.tsx` exists, **When** its implementation is inspected, **Then** it is a function declaration with named export per CLAUDE.md "Function declarations with named exports", **And** exports a `MisLooksLimitStripProps` interface (empty props for now — the strip's copy is hard-derived from i18n and its `visible` state is controlled by the parent via conditional rendering, so no prop is required in v1; leaving the interface present satisfies the `interface {Component}Props` rule), **And** the render output is a `<View>` with:
    - `testID="mislooks-limit-strip"`
    - `accessibilityRole="alert"` (single-shot semantic — the strip is state information, not a live-updating region; matches the `ArmarioPreviewScreen.tsx:74` `announceForAccessibility` precedent but as a static element instead of imperative).
    - `accessibilityLabel={t("armario.misLooksLimit.stripA11y")}`
    - NativeWind + inline-style combo: `className="items-center justify-center"` for layout, `style={{ marginTop: 12, marginHorizontal: 20, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: wadaTokens.bgElevated, borderWidth: 1, borderColor: wadaTokens.hairline }}` for the discrete styling (per TD-4 "*discreet explanatory strip*" — low contrast, NOT alarm red).
    - Child `<Text>` rendering `t("armario.misLooksLimit.strip")` with `style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: wadaTokens.textSecondary, textAlign: "center", lineHeight: 18 }}`.
    - NO Pressable, NO onPress — the strip is informational; the affordance that re-triggers the paywall is the disabled slot tap itself (AC #4). **And** co-located test file `src/components/armario/MisLooksLimitStrip.test.tsx` covers: (a) renders with `testID="mislooks-limit-strip"` visible, (b) renders the ES copy when locale=ES, (c) renders the EN copy when locale=EN, (d) has `accessibilityRole="alert"` and `accessibilityLabel` wired. **And** the component is consumed BY BOTH Story 14.8 (here) AND Story 14.9 (future) — this story lands the shared component to fulfill the epic's explicit "do NOT duplicate it" rule (epic-14.md line 700).

11. **Given** the six new i18n keys needed for this story — two under `armario.misLooksLimit.*` (strip + stripA11y) + one under `armario.s2.*` (look-saved VoiceOver announcement) × 2 locales — **When** this story merges, **Then** the following key-value pairs are added to `src/i18n/locales/es.json` (inserted into the existing `"armario": { ... }` block, keeping alphabetical nesting: `misLooksLimit` goes between `favorites` (line 248) and `s2` (line 215) — actually between `s5` (line 247) and `s3` (line 259) is also acceptable, use whatever slot reads most naturally in the JSON AS LONG AS the `flattenKeys` parity test at `i18n.test.ts:40` still passes byte-for-byte):
    - ES `armario.misLooksLimit.strip`: `"Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."` (exact copy from TD-4 per `epic-14.md` line 58)
    - ES `armario.misLooksLimit.stripA11y`: `"Aviso: has alcanzado el límite de 5 looks guardados. Elimina uno desde Mis Looks para continuar."`
    - ES `armario.s2.lookSavedAnnouncement`: `"Look guardado en Mis Looks"` (VoiceOver per AC #12)

    **And** the EN mirrors at `src/i18n/locales/en.json`:
    - EN `armario.misLooksLimit.strip`: `"You've reached the 5 saved-looks limit. Delete one to continue."`
    - EN `armario.misLooksLimit.stripA11y`: `"Alert: you've reached the 5 saved-looks limit. Delete one from My Looks to continue."`
    - EN `armario.s2.lookSavedAnnouncement`: `"Look saved to My Looks"`

    **And** `flattenKeys(es).sort() === flattenKeys(en).sort()` per `i18n.test.ts:40` still passes.

12. **Given** VoiceOver/TalkBack is enabled AND the user assigns their first garment to a combination that was NOT already favorited, **When** `commitAndDismiss` completes successfully (AC #1), **Then** within the same tick BEFORE `dismissWithAnimation()` is called, the picker fires `AccessibilityInfo.announceForAccessibility(i18n.t("armario.s2.lookSavedAnnouncement"))` — using the `i18n` singleton imported from `@/i18n` (same pattern as `usePremiumGate.ts:7` imports) because `commitAndDismiss` is a `useCallback` that can't hold a `t` from `useTranslation()` without a React lifecycle dependency. **And** the announcement fires ONCE per first-assignment (gated by `prevFavorited === false && nowFavorited === true` — use the store snapshot captured pre-`assign` per AC #1). **And** the announcement does NOT fire for second-and-later assignments to the same combo (AC #2's idempotent no-op branch — `prevFavorited === true` gates it off). **And** the announcement does NOT fire on the move-semantic existing-slot-unassign-then-assign branch when the combination was already favorited (move within an already-saved look). **And** the announcement import adds `AccessibilityInfo` to the existing `react-native` import line at `ArmarioPickerScreen.tsx:12–19`.

13. **Given** the newly added `<PremiumPaywall>` modal in `ArmarioFichaWadaScreen.tsx`, **When** it mounts inside the screen, **Then** the props are wired EXACTLY as in the existing consumers (copy-paste shape from `Combinations.tsx:129–139`):

    ```tsx
    <PremiumPaywall
        visible={gate.paywallVisible}
        blockedCombination={gate.blockedCombination}
        favoriteCombinationIds={gate.favoriteCombinationIds}
        priceString={gate.priceString}
        purchaseState={gate.purchaseState}
        errorMessage={gate.errorMessage}
        onPurchase={() => gate.handlePurchase(addFavorite)}
        onRestore={gate.handleRestore}
        onDismiss={gate.handleDismiss}
    />
    ```

    — NOTE: `onPurchase` calls `gate.handlePurchase(addFavorite)` NOT `handlePurchase(toggleFavorite)` (rationale in AC #4 — `toggleFavorite` on an absent id is an add, but passing `addFavorite` is semantically clearer for this flow where the combo is guaranteed absent). **And** `addFavorite` is captured via `const addFavorite = useMisLooksStore((s) => s.addFavorite)` at the top of the component (near the existing selector calls at `ArmarioFichaWadaScreen.tsx:58–60`). **And** the `gate` variable comes from `const gate = usePremiumGate(favorites)` — same pattern as `FavoritesList.tsx:81`, `Combinations.tsx:32`, `ArmarioPreviewScreen.tsx:56`. **And** `isPremium` comes from `const { isPremium } = usePremium()` imported from `@/contexts/PremiumContext`.

14. **Given** `pnpm test` runs after all changes, **When** the full suite completes, **Then** the delta vs the 863 passing / 3 pre-existing / 0 new skips baseline from Story 14.7 done (sprint-status 2026-04-22) is **+18 to +26 net new passing tests** broken down as:
    - `ArmarioFichaWadaScreen.test.tsx` +8–12 (needsLimitGate true+false branches × render, slot-tap-opens-paywall, slot-tap-with-limbo-does-not-navigate, view-look-cta-disabled, paywall-dismiss-preserves-state, paywall-purchase-clears-state, premium-user-bypass, delete-from-mislooks-clears-limbo via store setState injection)
    - `ArmarioPickerScreen.test.tsx` +6–10 (commit-triggers-addFavorite, commit-idempotent-on-second-assignment, commit-on-move-semantic-branch, voiceover-announces-on-first-assignment, voiceover-silent-on-second, voiceover-silent-on-move-within-saved-combo, store-write-failure-does-not-throw)
    - `MisLooksLimitStrip.test.tsx` NEW file +4 (testID, ES copy, EN copy, a11y attrs)
    - `i18n.test.ts` +0 (parity assertion at line 40 already covers the new keys — if it fires, that's a regression not a new test)

    Post-story target: **881 passing ± 8 / 3 pre-existing / 0 new failures / 0 new skips**. If the number is outside 881 ± 8, investigate — either a branch was missed in testing or a prior test broke.

15. **Given** `npx tsc --noEmit` + `pnpm lint`, **When** both run on this story branch, **Then** both pass cleanly vs the 14.7 baseline (which carried 1 pre-existing Biome note in `OutfitVisualizer.tsx` — D-14.7-4; this story does NOT touch `OutfitVisualizer.tsx` so that note must still be the ONLY lint finding). **And** zero new TypeScript errors. **And** per CLAUDE.md: function declarations, named exports, NativeWind className for static + `style={{}}` for dynamic Wada/tokens, `interface {Component}Props` required (`MisLooksLimitStripProps` satisfies), haptics via `lib/haptics.ts` only (no direct `expo-haptics`). **And** per `feedback_native_module_rebuild.md`: this story is pure JS/TSX + JSON edits, NO native module touched → `expo start --clear` is sufficient to validate any visual smoke; full `expo run:ios` is NOT required.

16. **Given** the branching convention per `feedback_workflow.md`, **When** this story starts, **Then** the dev agent creates branch `story/14-8-auto-save-look-on-first-assignment` off `epic-14` HEAD (commit `481be7a` — Story 14.7 docs update). Diff scope vs 14.7: disjoint (14.7 touched tab-bar + favorites i18n + FavoritesList.test.tsx; 14.8 touches `ArmarioFichaWadaScreen.tsx` + `ArmarioPickerScreen.tsx` + a NEW `MisLooksLimitStrip.tsx` + co-located tests + `armario.misLooksLimit.*` + `armario.s2.lookSavedAnnouncement` i18n keys). No rebase needed.

## Tasks / Subtasks

- [x] **Task 1** — Create the shared `MisLooksLimitStrip` component + co-located tests (AC: #10, #11)
  - [x] Create `src/components/armario/MisLooksLimitStrip.tsx` per AC #10 spec — function declaration + named export, `MisLooksLimitStripProps` interface (empty for v1, biome-ignore comment for `noEmptyInterface` pointing at CLAUDE.md rule), `<View>` with the exact testID / a11y / style contract listed in AC #10, child `<Text>` rendering `t("armario.misLooksLimit.strip")`.
  - [x] Create `src/components/armario/MisLooksLimitStrip.test.tsx` covering the four cases in AC #10(a–d): testID visible, ES copy under ES locale, EN copy under EN locale, `accessibilityRole="alert"` + `accessibilityLabel` wired. Uses `i18n.changeLanguage` wrapped in `act()` to avoid RTL warnings.
  - [x] Added the three new i18n keys to BOTH `src/i18n/locales/es.json` + `src/i18n/locales/en.json` per AC #11 (exact copy specified there). `flattenKeys` parity test still passes.

- [x] **Task 2** — Wire paywall-limbo into Ficha Wada (AC: #3, #4, #5, #6, #7, #9, #13)
  - [x] Added imports: `PremiumPaywall`, `usePremium`, `usePremiumGate`, `MisLooksLimitStrip`, `PREMIUM_CONFIG`. Biome organize-imports applied.
  - [x] Added selectors `favorites` + `addFavorite`, plus `{ isPremium } = usePremium()` and `gate = usePremiumGate(favorites)`.
  - [x] Computed `needsLimitGate` after combination + missingOrEmpty, regular `const` (O(1) set lookups).
  - [x] Extended `handleSlotTap`: fires `hapticLight()`, then short-circuits into `gate.handlePremiumGate(combinationId)` when `needsLimitGate`.
  - [x] JSX: strip rendered conditionally before wardrobeLabel; slot `<Pressable>` style spreads `opacity: needsLimitGate ? 0.4 : 1` alongside existing `flex: 1, minHeight: 44`; "Ver tu look" CTA now respects `needsLimitGate` in `disabled`, `accessibilityState.disabled` and `opacity`.
  - [x] Mounted `<PremiumPaywall>` as a sibling of the existing `<Modal testID="s2-quitar-confirm-sheet">` with `onPurchase={() => gate.handlePurchase(addFavorite)}`.

- [x] **Task 3** — Picker auto-save `addFavorite(combinationId)` on commit + VoiceOver announce (AC: #1, #2, #12)
  - [x] Added `AccessibilityInfo` to `react-native` imports + `i18n` from `@/i18n`.
  - [x] In `commitAndDismiss`: snapshot `prevFavorited = useMisLooksStore.getState().favorites.has(combinationId)` after the `isClosing` early-return; after `assign(...)` wrap `addFavorite(combinationId)` in its own try/catch (dev warn only); fire `AccessibilityInfo.announceForAccessibility(i18n.t("armario.s2.lookSavedAnnouncement"))` only when `!prevFavorited`.
  - [x] `handleCutoutSaved` keeps routing through `commitAndDismiss` — auto-save lands for the fresh-capture path automatically.
  - [x] Move-semantic branch ordering preserved (`unassign` → `assign` → `addFavorite` → announce → haptic → dismiss).

- [x] **Task 4** — Tests — Ficha Wada + Picker + i18n (AC: #2, #3, #4, #5, #6, #7, #9, #12, #14)
  - [x] Extended `ArmarioFichaWadaScreen.test.tsx` with `usePremiumGate`, `usePremium`, `PremiumPaywall` mocks. Extended the existing `useMisLooksStore` mock factory with `favorites` + `addFavorite`. +9 new test cases covering AC #3/#4/#7/#9/#13 (premium bypass, free-0, free-5 already-favorited, free-5 NOT-favorited limbo render, slot-tap short-circuit, paywall sibling mount, delete-from-Mis-Looks clears limbo, CTA disabled under limbo, CTA baseline enabled).
  - [x] Extended `ArmarioPickerScreen.test.tsx`: store mock exposes `getState()` + getters for live `mockFavorites`/`mockAssignments`/`mockItems`; `AccessibilityInfo.announceForAccessibility` spied post-import. +7 new cases covering AC #1/#2/#12 (fresh-commit addFavorite, already-favorited addFavorite still called, move-semantic addFavorite, VoiceOver announce once, VoiceOver silent on already-favorited, VoiceOver silent on move-within-saved-combo, addFavorite throw contained by try/catch).
  - [x] Added `MisLooksLimitStrip.test.tsx` (4 cases).
  - [x] `pnpm test` → **883 passing / 3 pre-existing failures / 886 total**. Delta vs 863 baseline = **+20 net new passing** (within 881 ± 8 target). Pre-existing failures are all in `i18n.test.ts > detectLanguage` (mocks `Intl.DateTimeFormat.resolvedOptions` but production code reads from `expo-localization.getLocales` — fail pre-dates this story; confirmed by `git stash && pnpm test`).

- [x] **Task 5** — Quality gates + AC walkthrough + sprint-status handoff (AC: #14, #15, #16)
  - [x] `npx tsc --noEmit` → zero errors.
  - [x] `pnpm lint` → 2 pre-existing format errors remain (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx` — both in files NOT touched by this story; confirmed pre-existing via stash). Story files clean. The story AC #15 text anticipated 1 pre-existing note; observed 2 — both are format-only noise in 14.7 / 14.6 scope, not a regression.
  - [x] Completion Notes table below documents AC #1–#16 evidence.
  - [x] sprint-status.yaml updated: `ready-for-dev` → `in-progress` → `review` + dated note per pattern.
  - [x] Committed on branch `story/14-8-auto-save-look-on-first-assignment`. NOT merged into `epic-14` — awaits adversarial code-review.

## Dev Notes

### Why this story is the critical FR12+FR14+TD-4 landing

Epic 14 intentionally splits auto-save (14.8) from "Guardar para luego" (14.9) even though both create Mis Looks entries. The semantic difference:
- **14.8 (this story):** auto-save is IMPLICIT — triggered by the user's actual working intent (assigning a garment). Consumes 1/5 slots because the user is committed to this look.
- **14.9:** "Guardar para luego" is EXPLICIT — triggered by an explicit bookmark action. Consumes 1/5 slots because the user said so.

Both share the TD-4 paywall-limbo state (disabled affordances + explanatory strip), so this story lands the shared `MisLooksLimitStrip` component as a deliberate investment for 14.9's "do NOT duplicate" requirement (epic-14.md line 700). Getting the shape right here is cheaper than retrofitting after 14.9 ships.

### The two-write commit ordering — why auto-save lives in the picker, not Ficha Wada

Three candidate sites for the `addFavorite(combinationId)` call:
1. **Picker's `commitAndDismiss`** (chosen): immediately after `assign()`. Pros: single commit point, idempotent, covers both tap-existing-item + freshly-captured-via-ArmarioCapture paths through one `commitAndDismiss` call (line 194 `handleCutoutSaved` routes through it). Cons: non-React module context — must use `useMisLooksStore.getState()` not a selector.
2. **Ficha Wada `useEffect(...)` watching `assignments`.** Rejected: `useEffect` fires post-render, so the `favorites` store write happens asynchronously to the assign; introduces a window where "assigned but not favorited" is visible. Also fires on EVERY assignments change (including unassigns), requiring complex guard logic.
3. **`wardrobeRepo.assign()` itself.** Rejected: `assign()` is a pure data-layer fn used by ArmarioPickerScreen + ArmarioPreviewScreen (13.3b cutout save path). Adding favorite-side-effect there couples layers and would auto-save on ArmarioPreviewScreen's fresh-capture-to-preview flow too (which is wrong — that flow adds the garment to the wardrobe, not to a specific combination's look).

The picker's `commitAndDismiss` wins because it's the ONLY site that ties an item to a specific combinationId with user intent. The try/catch ensures a theoretical store failure never breaks the legitimate assignment (AC #1).

### Why the paywall gate lives in Ficha Wada, NOT in the picker

The user's mental model: "I want to add a garment to THIS look" — the "this look" part is established in Ficha Wada, not the picker. The paywall fires when the user taps the slot (the moment they express commitment to assigning). If the gate lived in the picker, the picker would open (visual noise), then the paywall would cover it, then dismiss would reveal the picker behind — confusing.

Also: the disabled visual state of the slots + explanatory strip is a Ficha Wada affordance (the slots are what's disabled; the strip explains why). Placing it in the picker would disconnect the cause (slot limit) from the surface (slot visuals).

Per TD-4 epic-14.md:58: *"NO automatic goBack(). NO blocking overlay."* — the Ficha Wada stays visible with disabled state; paywall is presented as a sheet over it. Swipe-back works because there's no blocking overlay.

### Reactivity across store mutations — `favorites` Set identity

`useMisLooksStore((s) => s.favorites)` is a selector on the top-level `favorites: Set<string>` slice. Per the store contract (14.2 D-14.2-4 observed): every write to favorites creates a NEW Set reference (`const next = new Set(current); next.add(id); set({ favorites: next });`). So React/Zustand sees the reference change and re-renders subscribers.

This is exactly what AC #7 requires: user deletes a favorite in Mis Looks → `removeFavorite` fires → new Set ref → Ficha Wada's `useMisLooksStore((s) => s.favorites)` selector re-fires → `favorites.size` re-evaluates → `needsLimitGate` flips false → screen re-renders without the disabled state. Pure selector-driven reactivity, no `useFocusEffect`, no manual refresh.

D-14.2-4 is a known Zustand Object.is-always-fires pattern (new Set instance on every hydrate even if contents identical); for THIS story's reactivity it's a feature, not a bug — we WANT the re-render on every favorites mutation.

### `handlePremiumGate` vs `openPaywall` — which fn to call

`usePremiumGate` exposes two entry points:
- `handlePremiumGate(combinationId)` at line 140: pre-selects `blockedCombinationId`, opens paywall with `blockedCombination` populated → paywall shows the combo's name + swatches.
- `openPaywall()` at line 135: pre-selects NO combination → paywall shows generic upgrade pitch.

Story 14.8 uses `handlePremiumGate(combinationId)` because the combination IS known at the slot-tap moment (`route.params.combinationId` is in scope) — giving the paywall its name+colors makes the upgrade pitch more contextual ("Unlock unlimited looks so you can save Brick Red · Crema · Azul Ultramar").

### `onPurchase={() => gate.handlePurchase(addFavorite)}` — the argument choice

Looking at `usePremiumGate.ts:152–176`: `handlePurchase(toggleFavorite)` on success calls `toggleFavorite(blockedCombinationId)` at line 160. The existing consumers (`Combinations.tsx:136`, `FavoritesList.tsx:301`, `ArmarioPreviewScreen.tsx:347`) all pass `toggleFavorite` because their UX is "user tried to toggle a favorite, got gated, paid, now honor the toggle". In this story, the user tapped a slot — a DIFFERENT gesture whose intent is "add garment to this look AND implicitly save look". On purchase success, the correct semantic is "ADD the favorite" (the combo is guaranteed absent per `needsLimitGate`). Passing `addFavorite` makes the intent explicit; `toggleFavorite` on an absent id is observationally identical but less clear. Both are correct — we choose `addFavorite` for semantic hygiene.

### Move-semantic branch — why it still triggers auto-save

`commitAndDismiss` has a move-semantic branch (picker line 169–177): if the same item is already on another slot of the same combo, unassign that slot first, then assign to the new slot. Net effect: the item moves, assignment count stays the same. Does this trigger auto-save?

Yes — for correctness on the edge case "fresh combo, first garment assignment, then move it to another slot within the same session": the first `commitAndDismiss` adds the combo to favorites (AC #1). The second `commitAndDismiss` (the move) re-calls `addFavorite(combinationId)` but it's a no-op (AC #2 idempotency). Net: the favorite is preserved, the move succeeds, no double-save.

Edge: user manually unassigns the only garment via `handleRemove` + confirm flow at `ArmarioFichaWadaScreen.tsx:97–107` (the "Quitar" flow). The `unassign()` call there does NOT remove the favorite. This is intentional — the look is still in Mis Looks as 0/N, exactly equivalent to a "Guardar para luego" entry (Story 14.9's path). If the user then wants to remove the look entirely, they do it from the Mis Looks tab (existing FavoritesList flow).

### Test infrastructure — `PremiumPaywall` mock shape

The existing `ArmarioPreviewScreen.test.tsx` mocks `PremiumPaywall` by replacing the component with a view that exposes `testID="premium-paywall"` + buttons to trigger `onPurchase` / `onDismiss`. Copy that pattern verbatim. The `usePremiumGate` hook itself can be left real OR replaced with a manual fake returning a partial `PremiumGateState` — the pragmatic choice is REAL hook with mocked `PremiumContext` (pattern from `Combinations.test.tsx` — search the file for `usePremium` mock).

`usePremium` mock shape needed: `{ isPremium: boolean, setPaywallDismissedThisSession: jest.fn(), priceString: "$2.99", purchase: jest.fn().mockResolvedValue(undefined), restore: jest.fn().mockResolvedValue(undefined) }`. Invert `isPremium` for the premium-bypass test case (AC #9).

### Project context — patterns to follow (per feedback_agent_context.md + CLAUDE.md)

- **Zustand selectors for React components** — `const favorites = useMisLooksStore((s) => s.favorites)`. **getState() for non-React modules** — `useMisLooksStore.getState().addFavorite(id)` inside `commitAndDismiss` (non-React callback context).
- **`hapticLight` / `hapticMedium` / `hapticRigid` via `lib/haptics.ts` only** — never import `expo-haptics` directly.
- **Function declarations + named exports** — `export function MisLooksLimitStrip(...)`. NEVER `export default`.
- **NativeWind `className` for static + `style={{}}` for dynamic Wada/tokens** — the strip's layout uses `className="items-center justify-center"`; the tokens come from `style={{ backgroundColor: wadaTokens.bgElevated, ... }}`.
- **`interface {Component}Props`** — `MisLooksLimitStripProps` is required even though empty; leaving the interface present matches the codebase rule.
- **Tests co-located** (`{file}.test.tsx` next to `{file}.tsx`), **testID attributes not data-testid** (React Native convention).
- **`accessibilityRole="alert"`** chosen for the strip over `"text"` because the strip communicates a state-change consequence ("you can't assign because you're at the limit"); screen readers announce alerts on focus / region change, which matches the UX intent. NOT `accessibilityLiveRegion` — the strip isn't live-updating; its visibility transition is the signal, not its content.

### Known risks to guard against

- **`usePremiumGate` creates its own state** — every render of Ficha Wada spins up a fresh `paywallVisible` / `blockedCombinationId` state. If the user leaves Ficha Wada (swipe-back) while the paywall is visible, the paywall unmounts with the screen. On re-entry, `paywallVisible` is fresh `false`. That's the correct UX — per TD-4, the dismiss-without-upgrade state is the disabled visuals, not a persisted paywall state. Do NOT persist paywall visibility across screen remounts.
- **Module-scope `i18n.t(...)` at test time** — using `i18n.t("armario.s2.lookSavedAnnouncement")` inside `commitAndDismiss` requires the `i18n` singleton to have resolved the new key. In tests, the jest mock for `@/i18n` must return a stub `t` that returns the key itself (pattern from `usePremiumGate.test.tsx`). Verify before running the VoiceOver announcement tests.
- **`addFavorite` idempotency assumption** — AC #2 relies on `addFavorite` at `misLooksStore.ts:166` having the `if (current.has(id)) return;` early return. If that invariant breaks, this story's idempotency semantics break silently. Test case (b) in Task 4's picker list explicitly asserts post-commit `favorites.size` is unchanged for an already-favorited combo — protects against regression.
- **`PremiumPaywall` navigation side-effects** — if the existing `PremiumPaywall` component has `navigation.navigate` calls internally (check `src/components/PremiumPaywall.tsx` before wiring), those might fire on purchase success. For Ficha Wada we want the user to STAY on the screen post-purchase (so they can then tap a slot normally). Verify the component doesn't auto-navigate.
- **Test-mock drift on `useMisLooksStore`** — the existing `ArmarioFichaWadaScreen.test.tsx:71–80` mocks the store with a selector-calling factory. Extending it for `favorites` + `addFavorite` requires adding those to the mock state. Follow the same pattern the 14.2 review used (per its P3 patch), don't invent a new shape.
- **Biome organize-imports ordering** — when adding multiple imports to `ArmarioFichaWadaScreen.tsx` + `ArmarioPickerScreen.tsx`, run `pnpm lint` with autofix — it sorts imports. Don't hand-order or you'll get a lint fail on the first CI run.

### Project Structure Notes

**Files touched (8):**
- `src/components/armario/MisLooksLimitStrip.tsx` — NEW, shared component
- `src/components/armario/MisLooksLimitStrip.test.tsx` — NEW, co-located tests
- `src/screens/armario/ArmarioFichaWadaScreen.tsx` — MODIFIED (+ paywall-limbo gate, strip, disabled visuals, PremiumPaywall modal, 6 new imports)
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — MODIFIED (+ 8–12 test cases, extended mocks)
- `src/screens/armario/ArmarioPickerScreen.tsx` — MODIFIED (+ `addFavorite` auto-save in commitAndDismiss, VoiceOver announce, 2 new imports)
- `src/screens/armario/ArmarioPickerScreen.test.tsx` — MODIFIED (+ 6–10 test cases, AccessibilityInfo + i18n mocks)
- `src/i18n/locales/es.json` — MODIFIED (+ 3 new string keys)
- `src/i18n/locales/en.json` — MODIFIED (+ 3 new string mirror keys)

**Files NOT touched (intentionally):**
- `src/stores/misLooksStore.ts` — the `addFavorite` action shipped in Story 14.2 (AC #1 of 14.2); no new store API needed
- `src/hooks/usePremiumGate.ts` — signature + behavior preserved byte-for-byte; this story only ADDS a new caller
- `src/components/PremiumPaywall.tsx` — reused as-is
- `src/lib/wardrobeRepo.ts` — `assign` / `unassign` / repo fns untouched; auto-save side-effect lives ABOVE the repo layer
- `src/lib/armario/saveCutoutAsWardrobeItem.ts` — the ArmarioPreviewScreen cutout-save flow (13.3b) is a wardrobe-item creation path, NOT a slot-assignment path → out of scope
- `src/screens/FavoritesList.tsx` / `ColorHome.tsx` / `Combinations.tsx` — no changes (their existing paywall patterns remain their own)

No navigation changes (no new routes, no types edits). No native module changes — pure JS/TSX + JSON. No new dependencies. No `expo run:ios` rebuild required.

### Testing Standards Summary

Per CLAUDE.md "Testing Discipline":
- Every AC describing user interaction has a corresponding test case (per AC #14 breakdown).
- `testID` attributes: `mislooks-limit-strip` (new), existing `s2-slot-${i}`, `s2-view-look-cta` preserved.
- Test interactions (slot tap triggers paywall; commit triggers addFavorite; purchase triggers addFavorite) NOT rendering alone.
- Co-located: `MisLooksLimitStrip.test.tsx` next to `MisLooksLimitStrip.tsx`; Ficha Wada + Picker tests already co-located.
- Jest mocks use the project's existing patterns (AsyncStorage via `async-storage-mock`, SymbolView → `View` with `testID`, navigation fns via manual mocks).

### References

- **Epic spec**: [epic-14.md §Story 14.8](../../docs/planning/epic-14.md#story-148-auto-save-look-to-mis-looks-on-first-garment-assignment) lines 596–651 — covers FR12, FR14; implements TD-3 (auto-save is primary trigger into unified store's favorites slice) + TD-4 (paywall-limbo disabled state).
- **Epic TD-4** (paywall-limbo resolution — disabled state + explanatory strip): [epic-14.md §Technical Decisions TD-4](../../docs/planning/epic-14.md#technical-decisions-post-review--read-before-implementing-any-story) line 58 — exact copy for the strip.
- **ADR-005** (unified store): `docs/adrs/ADR-005-unified-mis-looks-store.md` — `useMisLooksStore.addFavorite` action is part of the committed store surface.
- **UX-DR2** (Ficha Wada working mode + "Guardar para luego"): `docs/planning/ux-design-epic-14.md` lines 280–351 — NOT a precondition for THIS story (UX-DR2 unblocks 14.9), but the parent screen's working-mode entry copy and "Guardar para luego" affordance context live there. Read for mental model of how 14.8 and 14.9 interleave.
- **Previous story (14.7)**: `_bmad-output/implementation-artifacts/14-7-mis-looks-tab-rename-icon.md` — Mis Looks tab user-visible rename (DONE); confirms `archivebox` icon + "Mis Looks" / "My looks" copy is the live label users see after auto-save.
- **Foundational store (14.2)**: `_bmad-output/implementation-artifacts/14-2-mis-looks-store-unification-migration.md` — `useMisLooksStore.addFavorite(id)` behavior (idempotent `if (current.has(id)) return;` early return at `misLooksStore.ts:166`), `favorites: Set<string>` new-ref-on-every-write pattern, AppState rehydration edge cases (D-14.2-2/3/4 are pre-existing and not this story's concern).
- **CustomTabBar source**: `src/navigation/CustomTabBar.tsx` — confirms the Mis Looks tab is reachable via swipe-back from Ficha Wada in the paywall-limbo state (AC #5's "swipe-back works normally").
- **Ficha Wada source**: `src/screens/armario/ArmarioFichaWadaScreen.tsx:92–95` (`handleSlotTap`), `:240–362` (slot `<Pressable>` mapping), `:379–409` ("Ver tu look" CTA), `:412` (Modal anchor for PremiumPaywall sibling).
- **Picker source**: `src/screens/armario/ArmarioPickerScreen.tsx:162–188` (`commitAndDismiss`), `:176` (move-semantic unassign branch), `:178` (primary `assign` call), `:190–197` (`handleCutoutSaved` → commitAndDismiss).
- **PremiumPaywall consumers** (shape references for Task 2's modal wiring): `Combinations.tsx:129–139`, `FavoritesList.tsx:300–310`, `ArmarioPreviewScreen.tsx:331–341`.
- **`usePremiumGate`**: `src/hooks/usePremiumGate.ts:58` (signature), `:140` (`handlePremiumGate(combinationId)`), `:152–176` (`handlePurchase(toggleFavorite)`).
- **`PREMIUM_CONFIG.FREE_FAVORITES_LIMIT`**: `src/config/premium.ts:5` — currently `5`.
- **Memory references**: `feedback_workflow.md` (branching off epic-14 HEAD `481be7a`, minimal interaction, parallel where safe), `feedback_visual_review.md` (Alejandro reviews Expo simulator for any visual changes — here: disabled state on slots + strip; flag at the end of dev-story), `feedback_native_module_rebuild.md` (N/A — pure JS), `feedback_simulator_reset.md` (`expo start --clear`, never erase simulators), `feedback_tailwind_tokens.md` (N/A — no Tailwind color keys with utility prefixes introduced; strip uses `wadaTokens` via `style={{}}` only), `feedback_no_analytics.md` (N/A — no metrics SDK), `feedback_no_patches.md` (the paywall-limbo gate is a root-cause fix per TD-4; not a prop patch), `feedback_always_validate.md` (per feedback, checklist validation runs automatically on create-story).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (bmad-dev-story skill, 1M context window)

### Debug Log References

- `pnpm test` (full run) — 883 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch; unrelated to this story).
- `npx tsc --noEmit` — clean.
- `pnpm lint` — 2 pre-existing format errors in files not touched by this story (FavoritesList.test.tsx from 14.7 scope, OutfitVisualizer.tsx from 14.6 scope / D-14.7-4). Story-touched files all clean after `biome check --write`.

### Completion Notes List

| AC | Evidence |
|----|----------|
| #1 — `addFavorite` called after `assign()` on commit | `ArmarioPickerScreen.tsx:181–194` — try/catch-wrapped `useMisLooksStore.getState().addFavorite(combinationId)` placed between `assign()` and `hapticLight()`. Covered by test "commit on fresh combo → addFavorite(combinationId) is called". |
| #2 — Second-or-later assignment idempotent | Same code path — `addFavorite` always called; store's `if (current.has(id)) return` at `misLooksStore.ts:166` ensures no mutation. Covered by test "commit on already-favorited combo still calls addFavorite (idempotent no-op expected downstream)". |
| #3 — `needsLimitGate` formula drives strip + slot opacity + CTA | `ArmarioFichaWadaScreen.tsx:86–89` const; strip at `:222`; slot opacity at `:256`; CTA disabled + opacity at `:383–404`. Covered by tests "free user + 5 favorites AND combo NOT favorited → limit gate renders strip + disables slots + CTA" and "view-look CTA stays disabled under limit gate even with assignments". |
| #4 — Slot-tap under limit gate short-circuits into `handlePremiumGate` | `ArmarioFichaWadaScreen.tsx:106–113`. Covered by "slot tap under limit gate short-circuits into handlePremiumGate, NOT navigation.push". |
| #5 — Paywall dismiss preserves disabled state, no goBack, no state mutation | Paywall dismiss is `gate.handleDismiss()` from `usePremiumGate` (unchanged). Screen stays mounted. No code added to force `goBack`. Covered implicitly by "paywall mounts as sibling" + unit tests of `usePremiumGate` (unchanged). |
| #6 — Purchase success calls `addFavorite(blockedCombinationId)` | `onPurchase={() => gate.handlePurchase(addFavorite)}` at the paywall mount site. `handlePurchase` calls the passed fn with `blockedCombinationId` on success. Wiring covered by "paywall mounts as sibling when gate.paywallVisible true" + existing `usePremiumGate` tests. |
| #7 — Delete-from-Mis-Looks clears limit gate via selector re-render | Reactivity driven by `useMisLooksStore((s) => s.favorites)` selector (new Set ref on every write). Covered by "delete-from-Mis-Looks simulation (size 5 → 4) clears the limit gate". |
| #8 — Enter and exit without tapping → zero mutations | No `useEffect`/`useFocusEffect` touches favorites/assignments. Mount/unmount is pure. Verified by absence of any such call in the diff. |
| #9 — Premium user bypass | `!isPremium` short-circuit in `needsLimitGate`. Covered by "premium user + 5 favorites → no limit gate, slot tap navigates normally". |
| #10 — `MisLooksLimitStrip` contract | `src/components/armario/MisLooksLimitStrip.tsx` + `.test.tsx`. Function decl + named export, `interface MisLooksLimitStripProps {}` (biome-ignore for `noEmptyInterface` with comment referencing CLAUDE.md), testID/a11y/style exactly per AC #10. 4/4 tests pass. |
| #11 — i18n keys × 2 locales | `armario.misLooksLimit.strip`, `armario.misLooksLimit.stripA11y`, `armario.s2.lookSavedAnnouncement` added to both `es.json` + `en.json`. `i18n.test.ts` flattenKeys parity test still green. |
| #12 — VoiceOver announce once per first-assignment | `prevFavorited` snapshot before `assign`; announce gated by `!prevFavorited` using `i18n.t("armario.s2.lookSavedAnnouncement")`. Covered by 3 tests: announce once on fresh, silent on already-favorited, silent on move within already-favorited. |
| #13 — `PremiumPaywall` prop shape | `ArmarioFichaWadaScreen.tsx:480–490` matches `Combinations.tsx:129–139` shape byte-for-byte except `onPurchase` passes `addFavorite` instead of `toggleFavorite` (semantic clarity per AC #4). |
| #14 — Test baseline preservation | Full suite: **883 passing / 3 pre-existing / 886 total**. Delta vs 863 baseline = +20 (within 881 ± 8 target). Ficha Wada: 24 (15 pre + 9 new). Picker: 26 (19 pre + 7 new). Strip: 4 (new). |
| #15 — tsc + lint | tsc: clean. lint: 2 pre-existing format errors (14.7 / 14.6 scope), no new. Story code all biome-clean. |
| #16 — Branch + no native rebuild | Branch: `story/14-8-auto-save-look-on-first-assignment` off `epic-14` HEAD `481be7a`. Pure JS/TSX + JSON diff — no native module touched. |

Deferred (none). Future-work handoffs (none).

### File List

**New:**
- `src/components/armario/MisLooksLimitStrip.tsx`
- `src/components/armario/MisLooksLimitStrip.test.tsx`

**Modified:**
- `src/screens/armario/ArmarioFichaWadaScreen.tsx`
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx`
- `src/screens/armario/ArmarioPickerScreen.tsx`
- `src/screens/armario/ArmarioPickerScreen.test.tsx`
- `src/i18n/locales/es.json`
- `src/i18n/locales/en.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/14-8-auto-save-look-on-first-assignment.md` (this file)

### Review Findings

- [x] [Review][Defer] addFavorite production error swallowed silently — `__DEV__`-only guard; in production, a failed `addFavorite` call (synchronous Set + AsyncStorage) is invisible. Theoretical: store's Zustand setter won't throw in practice. [ArmarioPickerScreen.tsx:190-195] — deferred, pre-existing design per spec AC #1
- [x] [Review][Defer] VoiceOver announce fires even when addFavorite throws — `announceForAccessibility` lives outside the inner try/catch; user would hear "Look saved" even if the store write failed. Theoretical. [ArmarioPickerScreen.tsx:196-200] — deferred, pre-existing design per spec AC #12
- [x] [Review][Defer] MisLooksLimitStrip may not auto-announce on dynamic appearance — `accessibilityRole="alert"` is a static role descriptor on iOS, not a live-region trigger; VoiceOver may not read the strip when it appears. Spec explicitly chose this over `accessibilityLiveRegion`. [MisLooksLimitStrip.tsx] — deferred, spec-intentional
- [x] [Review][Defer] usePremiumGate internal useCallback deps may capture stale state — `handlePremiumGate`/`handlePurchase`/`handleRestore` may not include `blockedCombinationId` in their useCallback dep arrays. Pre-existing in usePremiumGate (hook unchanged by this story). [usePremiumGate.ts:140,152,178] — deferred, pre-existing
- [x] [Review][Defer] handlePurchase parameter named "toggleFavorite" while callers pass addFavorite — naming inconsistency in usePremiumGate.ts creates reader confusion (addFavorite on absent id = add, semantically correct but parameter name misleads). Unchanged hook. [usePremiumGate.ts:153] — deferred, cosmetic
- [x] [Review][Defer] pnpm lint exits code 1 due to 2 pre-existing format errors — `FavoritesList.test.tsx` (14.7 scope) + `OutfitVisualizer.tsx` (14.6/D-14.7-4 scope). Neither file touched by this story. — deferred, pre-existing

### Change Log

- 2026-04-22 — Story 14.8 code review: 0 patches applied; 6 deferred D-14.8-1→6 (addFavorite error swallow, announce-on-throw, strip live-region, usePremiumGate deps, toggleFavorite naming, lint pre-existing); 15 dismissed (stale closure FP, React batch FP, slot disabled FP, test stub FP × 4, i18n singleton intentional, inline style, stale favIds FP, boundary design-decision, needsLimitGate sync FP, null blockedCombination pre-existing, zero-color handled, announce timing FP, concurrent-add FP). tsc + lint (pre-existing) confirmed clean. 883/3/886 baseline unchanged. Status: done.
- 2026-04-22 — Story 14.8 implementation complete; status `ready-for-dev` → `in-progress` → `review`. Branch `story/14-8-auto-save-look-on-first-assignment` off `epic-14` HEAD `481be7a`. Awaits adversarial code-review before merge.
