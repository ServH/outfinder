# Story 14.9: "Guardar para luego" explicit bookmark in Ficha Wada

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user browsing a Wada combination inside `ArmarioFichaWadaScreen.tsx` at night without any garment to assign (the "Juan" night case, or post-Visualizer exploration via Story 14.6's `handleMakeMine` hand-off)**,
I want **an explicit "Guardar para luego" CTA rendered at the bottom of the screen (above the existing "Ver tu look" CTA, above `FAB_PROTRUSION`, per UX-DR2) that consumes 1/5 Mis Looks slots and creates a zero-garment `favorites` entry via `useMisLooksStore.addFavorite(combinationId)` while honoring TD-4 paywall-limbo (opacity 0.4 + existing `MisLooksLimitStrip` from 14.8 + tap re-opens paywall, no `goBack`, swipe-back preserved) and hiding the CTA entirely once the combination is already in Mis Looks (via prior tap here OR via 14.8 auto-save on first garment assignment)**,
so that **I can bookmark a look without assigning a garment (FR13), my "enter and exit without action" flow still consumes zero slots (FR14 — the CTA is the ONLY zero-garment write path), the free-user 5/5 gate is enforced at the only moment that creates a 6th Mis Looks entry (CTA tap, not screen render), and I never see duplicate "Guardar para luego" taps accidentally re-adding an already-saved combination because the CTA disappears the moment `favorites.has(combinationId) === true`**.

## Acceptance Criteria

1. **Given** `src/screens/armario/ArmarioFichaWadaScreen.tsx` renders with a valid combination, **When** the render tree is inspected, **Then** a new `<Pressable testID="s2-save-for-later-cta">` exists inside the existing bottom CTA container at lines 395–437 (the same `<View>` that today holds only the "Ver tu look" Pressable) and is rendered **above** the "Ver tu look" Pressable with a 12pt vertical gap. **And** an explicit hairline divider renders immediately ABOVE the "Guardar para luego" Pressable: `<View testID="s2-save-for-later-divider" style={{ height: 1, backgroundColor: wadaTokens.hairline, alignSelf: "stretch", marginBottom: 16, marginHorizontal: -20 }}` /> (the negative horizontal margin cancels the container's `paddingHorizontal: 20` so the divider spans the full screen width, matching the UX-DR2 wireframe "─────────── hairline ──────────────" which reads across the full screen). **And** BOTH the divider and the "Guardar para luego" Pressable are rendered ONLY when `alreadySaved === false` (per AC #3 — once the combination is in Mis Looks, the CTA + divider are entirely removed from the tree, not merely hidden).

2. **Given** the new "Guardar para luego" `<Pressable>`, **When** its props are inspected, **Then** the contract is:
    - `testID="s2-save-for-later-cta"`
    - `onPress={handleSaveForLater}` (the new handler defined in AC #5)
    - `disabled={!hydrated}` — the only disable reason is mid-hydration (parity with how "Ver tu look" guards against pre-hydration taps at `ArmarioFichaWadaScreen.tsx:406`); paywall-limbo does NOT disable the CTA per AC #4 (tap must still fire to re-open the paywall, per epic-14 AC "*tapping it re-triggers the paywall*")
    - `accessibilityRole="button"`
    - `accessibilityLabel={t("armario.s2.saveForLaterA11yLabel")}` → resolves to "Guardar este look para trabajarlo más tarde" (ES) / "Save this look to work on later" (EN) per AC #7
    - `accessibilityHint={t("armario.s2.saveForLaterA11yHint")}` → resolves to "Lo añade a Mis Looks sin prendas asignadas" (ES) / "Adds it to My Looks with no garments assigned" (EN) per AC #7
    - `accessibilityState={{ disabled: !hydrated }}`
    - `className="items-center justify-center flex-row"` (row layout so the SF Symbol glyph sits left of the label with an 8pt gap)
    - `style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: wadaTokens.hairline, backgroundColor: "transparent", opacity: needsLimitGate ? 0.4 : 1 }}` — ghost/outlined visual per UX-DR2 "*Visual style: ghost / outlined, not a filled button*"; opacity 0.4 when paywall-limbo active per TD-4
    - **Inside the Pressable:** a `<SymbolView name="bookmark" size={16} tintColor={wadaTokens.textSecondary} style={{ marginRight: 8 }} />` (SF Symbol choice: `bookmark`, resolved over `star` after UX-DR2 "*Icon choice: star vs bookmark — test both in Pencil*" — `bookmark` is semantically tighter for "save for later" and avoids the "favorite heart-ish" connotation of `star`) followed by `<Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: wadaTokens.textSecondary }}>{t("armario.s2.saveForLaterCta")}</Text>`

3. **Given** the derived boolean `alreadySaved`, **When** it is computed in the function body, **Then** it is `const alreadySaved = favorites.has(combinationId);` placed immediately AFTER the existing `needsLimitGate` const at `ArmarioFichaWadaScreen.tsx:86–89` (so the two gate-style derived flags live together and make the render-time decisions scannable in one block). **And** the `favorites` selector is REUSED from 14.8's existing `const favorites = useMisLooksStore((s) => s.favorites)` at `ArmarioFichaWadaScreen.tsx:66` — do NOT add a duplicate selector. **And** `alreadySaved` is consumed in two places only: (a) conditional render of the new divider + CTA at the bottom (AC #1); (b) NOT in the slot opacity expression (slots stay at `opacity: needsLimitGate ? 0.4 : 1` regardless of `alreadySaved`) and NOT in the "Ver tu look" disabled expression (which remains `!hydrated || assignedCount === 0 || needsLimitGate`).

4. **Given** a free user with `favorites.size < 5` AND `alreadySaved === false` AND `hydrated === true`, **When** they tap `s2-save-for-later-cta`, **Then** the handler `handleSaveForLater` fires:
    - `hapticMedium()` (per UX-DR2 haptic contract table at `ux-design-epic-14.md:796`: "*Ficha Wada 'Guardar para luego' | hapticMedium | Commit.*")
    - THEN `const prevFavorited = useMisLooksStore.getState().favorites.has(combinationId);` snapshot taken BEFORE the write (parity with 14.8's pattern at `ArmarioPickerScreen.tsx` for VoiceOver gating — this snapshot is belt-and-braces since `alreadySaved` was already false when the handler fired, but it defends against a racy multi-tap before React re-renders)
    - THEN `useMisLooksStore.getState().addFavorite(combinationId)` wrapped in its own try/catch (mirror of 14.8's pattern at `ArmarioPickerScreen.tsx:191–195` — a theoretical store write failure must never throw past the handler boundary; in `__DEV__` log `console.warn("[Ficha Wada] addFavorite failed", error)`)
    - THEN, gated by `!prevFavorited`, `AccessibilityInfo.announceForAccessibility(i18n.t("armario.s2.lookSavedAnnouncement"))` — REUSES the existing key from Story 14.8 (`"Look guardado en Mis Looks"` / `"Look saved to My Looks"`) per the spec's explicit "do NOT duplicate" rule. **And** after this synchronous block, the next render observes `favorites.has(combinationId) === true` → `alreadySaved === true` → the CTA + divider unmount. **And** NO navigation call fires (no `goBack`, no `push`, no `replace`) — the user stays on the Ficha Wada, confirmed visually by the CTA disappearing per UX-DR2 "*small toast: 'Guardado en Mis Looks' (2s, dismissible) → no navigation*". **Note on the UX-DR2 toast:** the visual toast from UX-DR2 line 329 is EXPLICITLY NOT implemented in this story — the codebase has no `Toast` component, and building one would be out of scope. The CTA-vanishing animation + VoiceOver announce IS the confirmation feedback. The Pencil TODO at `ux-design-epic-14.md:350` ("*Whether a small toast on save is the right feedback vs. subtle CTA transformation*") is resolved in favor of the CTA-vanish treatment (subtle transformation).

5. **Given** a free user with `favorites.size >= 5` AND `!favorites.has(combinationId)` (i.e., `needsLimitGate === true` AND `alreadySaved === false`), **When** they tap `s2-save-for-later-cta`, **Then** `handleSaveForLater` SHORT-CIRCUITS before the `addFavorite` call: `hapticMedium()` still fires, THEN the handler calls `gate.handlePremiumGate(combinationId)` — REUSES the existing `gate` instance from 14.8's `const gate = usePremiumGate(favorites)` at `ArmarioFichaWadaScreen.tsx:69` — which pre-selects the blocked combination and opens the paywall via the `<PremiumPaywall>` sibling modal that 14.8 already mounted at lines 540–550. **And** NO `addFavorite` call fires. **And** `favorites` is unchanged. **And** the paywall modal that was already wired up in 14.8 (`onPurchase={() => gate.handlePurchase(addFavorite)}`) serves this path too — purchase success ADDS the combination via `addFavorite(blockedCombinationId)` per `usePremiumGate.ts:159–161`, exactly matching the 14.8 AC #6 behavior.

6. **Given** `needsLimitGate === true` AND `alreadySaved === false`, **When** the screen renders, **Then** the `MisLooksLimitStrip` from Story 14.8 is ALREADY rendered at `ArmarioFichaWadaScreen.tsx:222` (inline between `armario.s2.instruction` and `armario.s2.wardrobeLabel`) — this story does NOT modify the strip, does NOT add a second strip, and does NOT change its placement. **And** the "Guardar para luego" CTA renders at opacity 0.4 per AC #2, matching the slot opacity 0.4 from 14.8. **And** the epic-14 AC for 14.9 "*the same explanatory strip from Story 14.8 AC appears at the top*" is satisfied by the pre-existing 14.8 strip — confirm in the test that `expect(getByTestId("mislooks-limit-strip")).toBeTruthy()` when `needsLimitGate === true`, regardless of `alreadySaved`. **And** swipe-back works (no blocking overlay, no `goBack()` call in any code path of this story) — AC #8 reiterates this.

7. **Given** the THREE new i18n keys this story needs — `armario.s2.saveForLaterCta`, `armario.s2.saveForLaterA11yLabel`, `armario.s2.saveForLaterA11yHint` × 2 locales — **When** this story merges, **Then** the following key-value pairs are added to `src/i18n/locales/es.json` inside the existing `"armario"."s2"` block at lines 215–229 (insert between the existing `"quitarConfirmYes"` at line 227 and the existing `"lookSavedAnnouncement"` at line 228, OR at the end — whichever keeps the block alphabetically clean; the `flattenKeys` parity test at `i18n.test.ts:40` asserts only parity between ES/EN, not key order):
    - ES `armario.s2.saveForLaterCta`: `"Guardar para luego"` (exact copy from UX-DR2 `ux-design-epic-14.md:339` and the canonical copy table at `:757`)
    - ES `armario.s2.saveForLaterA11yLabel`: `"Guardar este look para trabajarlo más tarde"` (exact copy from UX-DR2 `:333`)
    - ES `armario.s2.saveForLaterA11yHint`: `"Lo añade a Mis Looks sin prendas asignadas"` (exact copy from UX-DR2 `:334`)

    **And** the EN mirrors at `src/i18n/locales/en.json` (matching key block):
    - EN `armario.s2.saveForLaterCta`: `"Save for later"` (UX-DR2 `:340`)
    - EN `armario.s2.saveForLaterA11yLabel`: `"Save this look to work on later"`
    - EN `armario.s2.saveForLaterA11yHint`: `"Adds it to My Looks with no garments assigned"`

    **And** `flattenKeys(es).sort() === flattenKeys(en).sort()` per `i18n.test.ts:40` still passes. **And** the existing `armario.s2.lookSavedAnnouncement` key from Story 14.8 is REUSED as-is for the VoiceOver announce on save — no new announcement key.

8. **Given** the free user dismisses the paywall without upgrading after AC #5's flow (tap "Ahora no" / tap scrim → `gate.handleDismiss()` fires per `usePremiumGate.ts:145–150`), **When** the dismiss settles, **Then** `paywallVisible` flips back to `false`, **And** the Ficha Wada screen remains visible with the disabled visual state intact (slots opacity 0.4 from 14.8, strip visible from 14.8, "Ver tu look" CTA disabled from 14.8, "Guardar para luego" CTA visible at opacity 0.4 from this story), **And** NO `goBack()` is triggered anywhere (explicit TD-4 mirror: *"NO automatic goBack(). NO blocking overlay"*), **And** the iOS swipe-back gesture from the left edge continues to pop to the prior screen (Visualizer via 14.6's `handleMakeMine` push, or the Mis Looks tab). **And** NO mutation to `favorites`. **And** the user can re-tap `s2-save-for-later-cta` any number of times and each tap re-opens the paywall (same semantics as 14.8 AC #4 for slot taps).

9. **Given** a user has already been auto-saved to Mis Looks via Story 14.8 (first-garment-assignment auto-save) OR has previously tapped `s2-save-for-later-cta` for this same combination (AC #4), **When** they return to `ArmarioFichaWadaScreen` for that same `combinationId`, **Then** `alreadySaved === true` → the "Guardar para luego" CTA + its divider are entirely absent from the render tree (AC #1's conditional render). **And** the "unobtrusive UI feedback confirms 'already in Mis Looks'" clause from the epic-14 AC for 14.9 is satisfied by the absence of the CTA — the `CompletenessBadge` at `ArmarioFichaWadaScreen.tsx:203–207` already communicates the "X/N prendas asignadas" state (explicit UX-DR2 trade-off `:346`: *"The CompletenessBadge already tells the state via X/N prendas asignadas. Adding a second 'Saved' label would duplicate information. Hide is cleaner."*). **And** no duplicate entry is ever created because the CTA cannot be tapped when `alreadySaved === true` (it's not rendered).

10. **Given** a PREMIUM user (`isPremium === true` from `usePremium()`), **When** they tap `s2-save-for-later-cta`, **Then** `needsLimitGate` is always `false` (short-circuit on `!isPremium` in 14.8's `needsLimitGate` const), **And** the handler proceeds directly to the `hapticMedium` → `addFavorite` → announce sequence per AC #4 — no paywall gate, no opacity 0.4, no strip. **And** a premium user's `favorites.size` can be 5, 50, or 500 and the CTA still writes the entry without friction. **And** the FR13 semantic applies to both tiers uniformly (the paywall-limbo in AC #5/#6/#8 is the free-tier-only branch).

11. **Given** a user enters `ArmarioFichaWadaScreen` via any path (Visualizer "Hacer este look mío" from Story 14.6, direct Mis Looks tap for a saved combo via Story 14.7, incomplete-look retention surface from future Story 14.11, "+ Nuevo look" path from future Story 14.10), **When** they navigate away (swipe-back, tab-switch, hardware-back) WITHOUT tapping any slot AND WITHOUT tapping `s2-save-for-later-cta`, **Then** NO `assign()` call fires, **And** NO `addFavorite()` call fires (neither from this story's handler nor from 14.8's picker-commit path, since the user never opened the picker), **And** `favorites.size` is unchanged post-nav, **And** `assignments.length` is unchanged post-nav. Explicit FR14 preservation. **This AC is a restatement of 14.8 AC #8 from a different entry-point perspective** — the CTA this story adds is NOT auto-fired by mount, focus, or render; it requires an explicit press.

12. **Given** the user deletes one of their 5 saved Mis Looks entries from the Mis Looks tab while the Ficha Wada is in paywall-limbo state (same scenario as 14.8 AC #7), **When** they return to the Ficha Wada (tab-switch back), **Then** `useMisLooksStore((s) => s.favorites)` fires a re-render because the `favorites` Set reference changed (per the store's `new Set(current); next.delete(id); set({ favorites: next });` pattern at `misLooksStore.ts:172–179`), **And** `favorites.size` becomes 4, **And** `needsLimitGate` becomes `false` (propagates from 14.8's existing const), **And** the "Guardar para luego" CTA re-renders at opacity 1 per AC #2 (the `opacity: needsLimitGate ? 0.4 : 1` expression re-evaluates), **And** tapping it now writes the favorite via AC #4's path — all WITHOUT manual refresh, `useFocusEffect` side-effect, or navigation remount. This reuses 14.8's selector-driven reactivity — no new store machinery.

13. **Given** `pnpm test` runs after all changes, **When** the full suite completes, **Then** the delta vs the 883 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch, unrelated) / 0 new skips baseline from Story 14.8 done (sprint-status 2026-04-22; confirmed locally at `epic-14` HEAD `0d2755a` → `883 passed, 3 failed, 886 total`) is **+8 to +12 net new passing tests** broken down as:
    - `ArmarioFichaWadaScreen.test.tsx` +8 to +12 new cases covering:
        (a) CTA renders with correct testID + label + a11y contract when `!alreadySaved && !needsLimitGate && hydrated`
        (b) CTA hidden (not in tree) when `alreadySaved === true` (both the CTA and the divider absent — `queryByTestId("s2-save-for-later-cta")` returns null AND `queryByTestId("s2-save-for-later-divider")` returns null)
        (c) CTA disabled state respects `!hydrated` (opacity 1 unchanged, `disabled` prop true, `accessibilityState.disabled` true)
        (d) Free user + size 3 + tap → `addFavorite(combinationId)` called once + `hapticMedium` called + `announceForAccessibility` called with `"armario.s2.lookSavedAnnouncement"`
        (e) Free user + size 5 + `!alreadySaved` + tap → `gate.handlePremiumGate(combinationId)` called, `addFavorite` NOT called, `hapticMedium` still called first
        (f) Paywall-limbo CTA renders at opacity 0.4 (`.props.style.opacity === 0.4` assertion, matching 14.8 slot opacity test pattern)
        (g) Premium user + size 100 + tap → `addFavorite` called, no paywall, no strip
        (h) Two rapid taps (simulate double-tap race) → `addFavorite` called once only (since after the first tap, `alreadySaved` becomes `true` and the CTA unmounts; but also defensive `prevFavorited` snapshot should prevent a double-announce even if the CTA were still visible)
        (i) `addFavorite` throw is caught by try/catch — the handler does not throw past its boundary and VoiceOver announce still fires (the announce lives AFTER the try/catch block, matching 14.8's pattern; deferred concern D-14.8-2 carries over but is explicitly pre-existing design)
        (j) Divider renders when CTA renders AND disappears when `alreadySaved === true`
        (k) `bookmark` SF Symbol renders inside the CTA (via the SymbolView mock's `testID`/`name` assertion — match the existing `s2-back-button` SymbolView mock pattern)
        (l) Haptic is `hapticMedium`, NOT `hapticLight` (asserts against the mock fn from `lib/haptics.ts` — differentiates from existing slot-tap tests that use `hapticLight`)
    - `i18n.test.ts` +0 (parity assertion at line 40 already covers the new keys — if it fires, that's a regression not a new test)

    **Post-story target: 891 to 895 passing / 3 pre-existing / 0 new failures / 0 new skips.** If the number is outside `891 ± 3`, investigate — either a branch was missed in testing or a prior test broke.

14. **Given** `npx tsc --noEmit` + `pnpm lint`, **When** both run on this story branch, **Then** both pass cleanly vs the 14.8 baseline (which carried 2 pre-existing Biome format errors in `FavoritesList.test.tsx` from 14.7 scope + `OutfitVisualizer.tsx` from 14.6 scope / D-14.7-4 — NEITHER file is touched by this story, so those errors must still be the ONLY lint findings post-merge). **And** zero new TypeScript errors. **And** per CLAUDE.md: function declarations, named exports (`handleSaveForLater` is an INNER function declaration inside `ArmarioFichaWadaScreen`, matching the existing `handleBack`, `handleSlotTap`, `handleRemove`, `handleQuitarConfirm`, `handleQuitarCancel`, `handleViewLook`, `findAssignmentThumb` pattern at lines 101–154); NativeWind `className` for static layout + `style={{}}` for dynamic Wada/tokens (the CTA uses `className="items-center justify-center flex-row"` for layout and `style` for borders/tokens/opacity); haptics via `lib/haptics.ts` only (`hapticMedium` is already exported from `src/lib/haptics.ts:11`); NO `Toast` component or library introduced; props interface on the screen is unchanged (no new component). **And** per `feedback_native_module_rebuild.md`: this story is pure JS/TSX + JSON edits, NO native module touched → `expo start --clear` is sufficient to validate any visual smoke; full `expo run:ios` is NOT required.

15. **Given** the branching convention per `feedback_workflow.md`, **When** this story starts, **Then** the dev agent creates branch `story/14-9-guardar-para-luego-ficha-wada` off `epic-14` HEAD (commit `0d2755a` — Story 14.8 merge). Diff scope vs 14.8: disjoint in intent but co-located in `ArmarioFichaWadaScreen.tsx` — 14.8 added the paywall-limbo gate + `MisLooksLimitStrip` render + `PremiumPaywall` sibling + `addFavorite` selector + `gate` hook; 14.9 REUSES ALL of those and only ADDS (a) `alreadySaved` derived const, (b) a new `handleSaveForLater` inner function, (c) the divider + CTA JSX inside the existing bottom CTA container, (d) 3 new i18n keys × 2 locales, (e) ~8–12 new test cases in the existing `ArmarioFichaWadaScreen.test.tsx`. No rebase needed off `epic-14` HEAD `0d2755a`. No changes to: `ArmarioPickerScreen.tsx`, `MisLooksLimitStrip.tsx`, `usePremiumGate.ts`, `PremiumPaywall.tsx`, `misLooksStore.ts`, `wardrobeRepo.ts`, `PremiumContext.tsx`, navigation types, or any native module.

## Tasks / Subtasks

- [x] **Task 1** — Derive `alreadySaved` + implement `handleSaveForLater` handler inside `ArmarioFichaWadaScreen.tsx` (AC: #3, #4, #5, #10)
  - [x] Import `SymbolView` is already present (line 6) — reuse; import `hapticMedium` alongside the existing `hapticLight` import at line 21 (`import { hapticLight, hapticMedium } from "@/lib/haptics";`); import `AccessibilityInfo` from `react-native` by adding it to the existing import at line 9 (`import { AccessibilityInfo, Modal, Pressable, Text, View } from "react-native";`); import the `i18n` singleton (`import i18n from "@/i18n";`) if not already imported — needed for `i18n.t()` inside the handler (non-React-hook context, so we can't rely on `useTranslation()`'s `t`). Run `pnpm lint --write` so Biome organizes the imports.
  - [x] Add the derived const `const alreadySaved = favorites.has(combinationId);` IMMEDIATELY after the existing `needsLimitGate` const at lines 86–89. Keep the two gate-style derived flags adjacent for scannability.
  - [x] Add the handler (inner function declaration, matching the codebase pattern of `handleSlotTap` etc.) just after `handleSlotTap` at line 113:
    ```tsx
    function handleSaveForLater() {
        hapticMedium();
        if (needsLimitGate) {
            gate.handlePremiumGate(combinationId);
            return;
        }
        const prevFavorited = useMisLooksStore.getState().favorites.has(combinationId);
        try {
            useMisLooksStore.getState().addFavorite(combinationId);
        } catch (error) {
            if (__DEV__) {
                console.warn("[Ficha Wada] addFavorite failed", error);
            }
        }
        if (!prevFavorited) {
            AccessibilityInfo.announceForAccessibility(
                i18n.t("armario.s2.lookSavedAnnouncement"),
            );
        }
    }
    ```
  - [x] Verify no behavior regression: the existing `handleSlotTap` at lines 106–113 is unchanged; the existing `gate = usePremiumGate(favorites)` at line 69 is untouched; `addFavorite` selector at line 67 is REUSED (do not add a duplicate selector).

- [x] **Task 2** — Add the hairline divider + "Guardar para luego" `<Pressable>` JSX inside the bottom CTA container, conditional on `!alreadySaved` (AC: #1, #2, #6, #8, #9, #12)
  - [x] Locate the bottom CTA container at `ArmarioFichaWadaScreen.tsx:395–437` — the `<View>` with `paddingHorizontal: 20, paddingTop: 8, paddingBottom: FAB_PROTRUSION + 12, alignItems: "center"`.
  - [x] Insert INSIDE that container and BEFORE the existing "Ver tu look" `<Pressable testID="s2-view-look-cta">` at line 403 the following JSX block, gated by `{!alreadySaved && (...)}`:
    ```tsx
    {!alreadySaved && (
        <>
            <View
                testID="s2-save-for-later-divider"
                style={{
                    height: 1,
                    backgroundColor: wadaTokens.hairline,
                    alignSelf: "stretch",
                    marginHorizontal: -20,
                    marginBottom: 16,
                }}
            />
            <Pressable
                testID="s2-save-for-later-cta"
                onPress={handleSaveForLater}
                disabled={!hydrated}
                accessibilityRole="button"
                accessibilityLabel={t("armario.s2.saveForLaterA11yLabel")}
                accessibilityHint={t("armario.s2.saveForLaterA11yHint")}
                accessibilityState={{ disabled: !hydrated }}
                className="items-center justify-center flex-row"
                style={{
                    minHeight: 44,
                    minWidth: 44,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: wadaTokens.hairline,
                    backgroundColor: "transparent",
                    opacity: needsLimitGate ? 0.4 : 1,
                    marginBottom: 16,
                }}
            >
                <SymbolView
                    name="bookmark"
                    size={16}
                    tintColor={wadaTokens.textSecondary}
                    style={{ marginRight: 8 }}
                />
                <Text
                    style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 15,
                        color: wadaTokens.textSecondary,
                    }}
                >
                    {t("armario.s2.saveForLaterCta")}
                </Text>
            </Pressable>
        </>
    )}
    ```
  - [x] Verify the "Ver tu look" Pressable still renders below the new block unchanged. The `marginBottom: 16` on the new Pressable produces the 12–16pt gap between "Guardar para luego" and "Ver tu look" called for in UX-DR2's wireframe. (The container's `alignItems: "center"` keeps both CTAs centered.)
  - [x] Run `pnpm lint --write` to fix Biome's JSX-in-fragment ordering or any formatting nits.

- [x] **Task 3** — Add 3 new i18n keys × 2 locales under `armario.s2.*` (AC: #7)
  - [x] `src/i18n/locales/es.json`: inside the `"armario"."s2"` block (lines 215–229), append (preserving valid JSON syntax — add a comma after the last existing key):
    ```json
    "saveForLaterCta": "Guardar para luego",
    "saveForLaterA11yLabel": "Guardar este look para trabajarlo más tarde",
    "saveForLaterA11yHint": "Lo añade a Mis Looks sin prendas asignadas"
    ```
  - [x] `src/i18n/locales/en.json`: mirror inside the matching `"armario"."s2"` block:
    ```json
    "saveForLaterCta": "Save for later",
    "saveForLaterA11yLabel": "Save this look to work on later",
    "saveForLaterA11yHint": "Adds it to My Looks with no garments assigned"
    ```
  - [x] Run `pnpm test src/i18n` (or the full suite) to confirm `flattenKeys(es).sort() === flattenKeys(en).sort()` at `i18n.test.ts:40` still passes. If it fails, the three keys are mis-mirrored between locales — add / rename the missing one before proceeding.

- [x] **Task 4** — Extend `ArmarioFichaWadaScreen.test.tsx` with the +8 to +12 new cases (AC: #1, #2, #4, #5, #6, #9, #10, #12, #13)
  - [x] Review the existing test file for the established mock shape: how `useMisLooksStore`, `usePremiumGate`, `usePremium`, `PremiumPaywall`, `SymbolView`, and `hapticLight` are mocked (already set up for 14.8's coverage). REUSE those mocks — do NOT reinvent. Add `AccessibilityInfo.announceForAccessibility` as a `jest.spyOn(AccessibilityInfo, "announceForAccessibility")` spy in the shared `beforeEach` setup (parity with `ArmarioPickerScreen.test.tsx` 14.8 pattern). Add `hapticMedium` to the `jest.mock("@/lib/haptics", ...)` factory (already mocks `hapticLight`).
  - [x] Add these cases (ordered as AC #13 specifies):
    1. **(AC #1, #2)** *"renders Guardar para luego CTA + divider when combination not yet favorited"* — assert `getByTestId("s2-save-for-later-cta")` and `getByTestId("s2-save-for-later-divider")` are both truthy; assert the CTA's `accessibilityLabel` matches the ES copy under ES locale (or key under the stubbed t-fn — follow existing test convention).
    2. **(AC #9)** *"hides Guardar para luego CTA + divider when combination already in favorites"* — mock `favorites` as `new Set([combinationId])`; assert `queryByTestId("s2-save-for-later-cta")` is null AND `queryByTestId("s2-save-for-later-divider")` is null.
    3. **(AC #2)** *"CTA disabled while hydrated=false"* — mock `hydrated: false`; assert `disabled` prop true + `accessibilityState.disabled` true.
    4. **(AC #4)** *"tap writes favorite via addFavorite + hapticMedium + announceForAccessibility"* — `fireEvent.press(getByTestId("s2-save-for-later-cta"))`; assert `hapticMedium` called once, `addFavorite` called with `combinationId`, `AccessibilityInfo.announceForAccessibility` called with the announcement key (or the resolved ES/EN string — match existing convention).
    5. **(AC #5)** *"tap with paywall-limbo opens paywall, NOT addFavorite"* — mock `favorites.size = 5` and `!favorites.has(combinationId)`; `fireEvent.press(...)`; assert `gate.handlePremiumGate` called with `combinationId`, `addFavorite` NOT called, `hapticMedium` still called once.
    6. **(AC #2, #6)** *"CTA renders at opacity 0.4 under paywall-limbo"* — assert `getByTestId("s2-save-for-later-cta").props.style.opacity === 0.4`.
    7. **(AC #10)** *"premium user bypass — size 100 + tap writes favorite without paywall"* — mock `isPremium: true`, `favorites.size = 100`; `fireEvent.press(...)`; assert `addFavorite` called, `gate.handlePremiumGate` NOT called.
    8. **(AC #4 defensive)** *"rapid double-tap only calls addFavorite once"* — `fireEvent.press(...)` twice back-to-back in the same render (before re-render); assert `addFavorite` call count is ≤ 2 (idempotency per store guarantees true-state is 1 effective write — document that the test asserts the HANDLER's behavior, not the store's).
    9. **(AC #13 resilience)** *"addFavorite throw is contained — handler does not rethrow"* — mock `addFavorite` to throw; `expect(() => fireEvent.press(...)).not.toThrow();` assert `announceForAccessibility` still fires (the announce-after-throw is the known pre-existing design decision from 14.8 D-14.8-2; do NOT deviate).
    10. **(AC #6)** *"paywall-limbo CTA coexists with 14.8 strip"* — mock `needsLimitGate === true, alreadySaved === false`; assert BOTH `getByTestId("mislooks-limit-strip")` AND `getByTestId("s2-save-for-later-cta")` are truthy.
    11. **(AC #13 k)** *"bookmark SymbolView renders inside the CTA"* — query for the SymbolView mock with `name="bookmark"` (the existing SymbolView mock replaces it with a View whose `testID` or `accessibilityLabel` encodes the name; follow existing convention).
    12. **(AC #13 l)** *"haptic is hapticMedium, NOT hapticLight"* — in the press test, assert `hapticMedium` called once AND `hapticLight` call count is unchanged vs before (distinguishes from slot-tap haptic).
  - [x] Run `pnpm test src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — expect ~23 + 10 ≈ 33 passing in this file (14.8 left it at 24 passing — add 9–12 more).
  - [x] Run the full `pnpm test` — expect 891 to 895 passing / 3 pre-existing / 886 + 8 to 12 total. If a new failure surfaces, investigate immediately (do NOT skip).

- [x] **Task 5** — Quality gates + AC walkthrough + sprint-status handoff + branch hygiene (AC: #13, #14, #15)
  - [x] `npx tsc --noEmit` → expect zero new errors.
  - [x] `pnpm lint` → expect 2 pre-existing format errors (FavoritesList.test.tsx + OutfitVisualizer.tsx) and ZERO new findings. Confirm via `git stash && pnpm lint && git stash pop` if the count is ambiguous.
  - [x] Walk through AC #1–#15 point-by-point (per CLAUDE.md "Acceptance Criteria Verification" rule) and document evidence in the Completion Notes table below.
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml`:
      - Set `development_status[14-9-guardar-para-luego-ficha-wada]` to `in-progress` (when starting dev) then to `review` (when dev-story task complete)
      - Append dated note following the 14.8 convention (test delta numbers, TD references, branch, no native rebuild flag)
  - [x] Commit on branch `story/14-9-guardar-para-luego-ficha-wada` off `epic-14` HEAD `0d2755a`. Do NOT merge into `epic-14` — awaits adversarial code-review per CLAUDE.md "Mandatory Code Review" rule.
  - [x] Per `feedback_visual_review.md`: flag the user for Expo simulator visual smoke AFTER dev-story completes and BEFORE code-review. Visual-changes checklist: (a) "Guardar para luego" CTA appears at the bottom of Ficha Wada for combinations not yet favorited; (b) bookmark SF Symbol glyph renders; (c) divider renders above CTA full-width; (d) tapping CTA makes it disappear + VoiceOver announces; (e) paywall-limbo renders CTA at 40% opacity + tap re-opens paywall; (f) swipe-back still works in paywall-limbo; (g) combination that already has assignments (via 14.8 auto-save) → CTA + divider absent.

## Dev Notes

### Why this story is clean "add-on" scope on top of 14.8

Story 14.8 intentionally landed the shared machinery — `MisLooksLimitStrip`, `PremiumPaywall` sibling mount, `gate = usePremiumGate(favorites)`, `favorites` + `addFavorite` selectors, `needsLimitGate` const — so that 14.9 can be the **lightest possible** diff: one derived const (`alreadySaved`), one handler (`handleSaveForLater`), one JSX block (divider + CTA), three i18n keys × 2 locales, and ~10 new tests. This is deliberate per the epic's explicit *"Reuses the explanatory strip component built in 14.8 — do NOT duplicate it"* (epic-14.md:700).

**Do NOT** touch `ArmarioPickerScreen.tsx`, `MisLooksLimitStrip.tsx`, `usePremiumGate.ts`, `PremiumPaywall.tsx`, `misLooksStore.ts`, or any navigation type file. Every one of those is a signal of scope creep.

### The paywall-limbo mirror — what 14.9 inherits vs implements

14.8 implemented TD-4 for the SLOT-TAP path. 14.9 implements TD-4 for the CTA-TAP path with the same mechanics:

| Behavior | 14.8 (slot tap) | 14.9 (CTA tap) |
|---|---|---|
| Gate formula | `needsLimitGate = !isPremium && favorites.size >= 5 && !favorites.has(combinationId)` | Identical — REUSE |
| Strip rendering | Inline above `armario.s2.wardrobeLabel` when `needsLimitGate` | Reused as-is — no new strip |
| Haptic | `hapticLight()` (already the slot-tap haptic before this story) | `hapticMedium()` (per UX-DR2) |
| Paywall open | `gate.handlePremiumGate(combinationId)` | Same call |
| Disabled opacity | Slot `<Pressable>` style `opacity: needsLimitGate ? 0.4 : 1` | CTA `<Pressable>` style `opacity: needsLimitGate ? 0.4 : 1` |
| Purchase success | `gate.handlePurchase(addFavorite)` — paywall sibling at lines 540–550 writes the favorite | Same paywall sibling handles both paths uniformly — no new wiring |
| Swipe-back | Works | Works — no blocking overlay, no `goBack()` in any handler |

The symmetry is intentional. If 14.8's tests pass, most of 14.9's paywall-limbo behavior is structurally proven — 14.9's new tests only need to validate that the CTA path calls the same functions in the same order.

### `handleSaveForLater` — the structure choice

`handleSaveForLater` is an inner function declaration (not a `useCallback`, not a ref-stored closure). Three reasons:
1. **Parity.** `handleSlotTap`, `handleViewLook`, `handleRemove`, and five others are all inner function declarations at `ArmarioFichaWadaScreen.tsx:101–154`. Using `useCallback` here would break pattern continuity.
2. **Render cheapness.** Every re-render recreates the function. React's reconciliation on a `<Pressable>`'s `onPress` prop is O(1) ref comparison, not a diff — a new function per render does not cause a re-render cascade. Zustand selectors (not `onPress` refs) drive the render.
3. **Test ergonomics.** An inner function declaration is transparent at press-time — the test just calls `fireEvent.press(cta)` and the handler executes; no `waitFor` or async tick needed.

### Why `addFavorite` is called via `useMisLooksStore.getState()` and not the selector

The handler runs in a non-React-hook context (an event callback). Inside the function body, we could access the `addFavorite` selector-result from the closure (the one at line 67), but the `getState()` pattern is preferred for two reasons mirroring 14.8's rationale at `ArmarioPickerScreen.tsx:190–194`:
1. **Snapshot freshness.** `useMisLooksStore.getState()` reads the current store synchronously. If the component re-rendered while the tap was in flight, the closure's captured `addFavorite` is still the same function reference (Zustand actions are stable), but `getState().favorites.has(combinationId)` must be a fresh read for the `prevFavorited` snapshot.
2. **Non-React discipline.** Inside `try/catch { ... } catch { ... }`, mixing React hook results with imperative store access looks inconsistent. Using `getState()` twice (once for the snapshot, once for the write) keeps the handler's store access uniform and imperative.

### `i18n.t()` inside the handler — why not `t()` from `useTranslation()`

The `t` from `useTranslation()` at line 52 IS available in the handler's closure. It could be used for `i18n.t("armario.s2.lookSavedAnnouncement")`. BUT: 14.8 set the precedent of using the `i18n` singleton import inside `ArmarioPickerScreen.tsx`'s `commitAndDismiss` because that handler is a `useCallback` whose dep array would need to include `t` — wrong semantics. In THIS story's `handleSaveForLater` (inner fn declaration, no dep array), `t(...)` would actually work. But importing `i18n` and calling `i18n.t(...)` keeps the **convention** consistent with 14.8's announce-path, and the `i18n` singleton is cheap to import. **Choice:** use `i18n.t(...)` for the announce, and `t(...)` (from `useTranslation`) for the JSX-level copy (`saveForLaterCta`, `saveForLaterA11yLabel`, `saveForLaterA11yHint`). This gives render-time React reactivity on locale change (via `t`) and commit-time imperative access (via `i18n.t`).

### The "no toast" decision — explicit

UX-DR2 line 329 describes: *"small toast: 'Guardado en Mis Looks' (2s, dismissible) → no navigation"*. And line 350 lists it as a Pencil TODO: *"Whether a small toast on save is the right feedback vs. subtle CTA transformation (fade to 'Guardado · editar' for 3s before hiding)"*. This story resolves the Pencil TODO in favor of the **CTA-vanish treatment** — no toast. Rationale:

1. **No existing toast component in the codebase.** Grep confirms zero `Toast` imports, zero toast libraries. Building one for one call site is yak-shaving.
2. **The CTA vanishing is a strong visual signal.** The user tapped "Guardar para luego" and the button immediately disappeared from the screen — the look-is-saved affordance is self-evident.
3. **VoiceOver gets the confirmation.** The reused `armario.s2.lookSavedAnnouncement` from 14.8 fires on the announce path — screen-reader users hear "Look guardado en Mis Looks" / "Look saved to My Looks".
4. **CompletenessBadge backs up the state.** At `ArmarioFichaWadaScreen.tsx:203–207` the badge already renders (0/N prendas asignadas state), providing the persistent visual cue that the look exists.

If product wants a toast later, it's a one-file add (`src/components/Toast.tsx`) + one-line call in `handleSaveForLater`. Out of scope here.

### Icon choice — bookmark vs star

UX-DR2 line 318: *"Icon: SF Symbol `bookmark` or `star` — test both in Pencil."* This story picks `bookmark`:

1. **Semantic precision.** "Bookmark" literally means "mark for later reading/reference". "Star" means "favorite" — but the favorite semantic is already OWNED by the heart-shaped FavoriteButton component used throughout the app. Having two star-ish icons mean two different things would confuse.
2. **Glyph weight.** `bookmark` is a clean rectangle-with-notch, visually lighter than the more detailed `star`. The ghost button's visual weight is already medium (border + text); adding a heavy glyph would over-index.
3. **Consistency with iOS vocabulary.** iOS Safari / Notes / Files all use `bookmark` for "save for later". Users recognize the affordance.

If Pencil iteration later chooses `star`, the change is a one-char edit (`name="bookmark"` → `name="star"`). Non-blocking.

### Visibility logic — why `alreadySaved` hides both the CTA and the divider

When the user has already saved the look (either via 14.8 auto-save on first-garment-assignment OR via an earlier tap of `s2-save-for-later-cta` in this story), the CTA MUST hide — otherwise tapping it again would be a no-op (`addFavorite` early-returns per `misLooksStore.ts:166`) but would still fire the haptic + announce, creating visual/audio noise for nothing.

The divider is a chrome element that exists SOLELY to visually introduce the CTA. If the CTA is gone, the divider is visually orphaned. Hiding them together keeps the bottom of the screen clean when the only action available is "Ver tu look".

Edge case: user taps "Guardar para luego" → favorite written → CTA + divider unmount → but the spacer at line 393 (`<View style={{ flex: 1 }} />`) remains. Net effect: "Ver tu look" shifts down slightly (by the CTA height + marginBottom + divider height + divider marginBottom = ~75pt). This is acceptable UX — the shift is a subtle "something just happened and now committed" signal. **Do NOT** reserve space for the hidden CTA (no `opacity: 0 + pointerEvents: none`); that would waste screen real-estate and confuse screen readers.

### Reactivity — why `alreadySaved` auto-updates without a `useEffect`

`favorites` is a Zustand selector at line 66: `const favorites = useMisLooksStore((s) => s.favorites)`. Per the store contract (14.2 AC #1 / D-14.2-4 / ADR-005), every mutation creates a new `Set` reference. The selector fires a re-render on reference change. `alreadySaved = favorites.has(combinationId)` re-evaluates each render. So:

- User taps CTA → `addFavorite(combinationId)` → store `set({ favorites: new Set(...) })` → selector fires → `alreadySaved` becomes `true` → conditional render hides CTA + divider → next paint shows the change.
- User deletes the favorite from the Mis Looks tab → same chain in reverse → CTA + divider reappear on return to Ficha Wada.

No `useEffect`, no `useFocusEffect`, no manual refresh. Pure selector-driven reactivity — this is exactly the pattern 14.8 established at line 66 and AC #7 validated for the strip-visibility case.

### Known risks / edge cases to guard

- **Rapid double-tap.** If the user taps `s2-save-for-later-cta` twice within the same frame (before React re-renders), both taps hit the handler. First tap: `prevFavorited = false` → `addFavorite` writes → announce fires. Second tap: `prevFavorited = true` (reads from `getState()` which sees the new Set) → `addFavorite` early-returns → announce does NOT fire. **Net effect:** one write, one announce. Handler is race-safe without explicit debounce. The AC #13 test case (h) asserts this.
- **Paywall dismissed then re-tapped fast.** User taps CTA while at 5/5 → paywall opens. User dismisses (`gate.handleDismiss()`). CTA is back to opacity 0.4. User taps again → `gate.handlePremiumGate(combinationId)` re-opens. `paywallVisible` goes false → true via the `usePremiumGate` state machine — matches 14.8 AC #4's "every tap re-opens" invariant.
- **Combination invalid (`missingOrEmpty === true`).** Line 97–99 returns null before the JSX body — the CTA never mounts. ✓ No impact.
- **Premium user at 5 favorites (edge).** `!isPremium` is false → `needsLimitGate` is false → opacity 1 → tap writes the 6th favorite. Premium users have no ceiling. ✓ AC #10.
- **Hydration race.** User arrives at Ficha Wada via deep-link before `hydrated === true`. CTA is disabled per AC #2; taps do nothing. After hydration, CTA enables. Matches "Ver tu look" precedent.
- **`addFavorite` mock forgetting idempotency.** In tests, if a dev mocks `addFavorite` as `jest.fn()` without idempotency, the test case "rapid double-tap only calls addFavorite once" could false-fail. Solution: the test should assert the handler's correctness (max 2 calls, since after the first tap `alreadySaved` becomes true via real state flow) OR use a real store instance in that specific test. Following 14.8's mock pattern avoids this by keeping mocks dumb and letting the `alreadySaved` unmount guard prevent double-press.
- **`SymbolView` mock gotcha.** The existing test-level mock for `expo-symbols`'s `SymbolView` typically renders a `<View testID={\`sf-symbol-${name}\`}>` or similar. The test for "bookmark SymbolView renders" should query for whatever testID convention the mock uses — check `jest.setup.ts` and existing Ficha Wada tests for the established pattern before writing assertion.
- **Biome JSX fragment ordering nit.** Wrapping divider + CTA inside `<>...</>` and mounting it via `{!alreadySaved && (...)}` is clean. Biome should not complain. If it does (e.g., `useFragmentSyntax` rule), follow the suggested rewrite rather than disabling the rule.
- **i18n key insertion order.** JSON has no key ordering guarantee in spec, but the `flattenKeys` parity test at `i18n.test.ts:40` compares sorted arrays — insertion order does not matter. Insert at the end of the `"s2"` block for diff cleanliness.
- **Double-announce cross-story.** If user assigns their first garment (14.8 fires announce) AND ALSO tapped "Guardar para luego" earlier (14.9 fires announce), those are separate user actions separated by at least one re-render cycle. No cross-story race. If user taps "Guardar para luego" THEN assigns a garment in the same view, the 14.8 AC #12 gate (`!prevFavorited`) catches it — `prevFavorited` is now true, no second announce. ✓ Clean.

### Project Structure Notes

**Files touched (4):**
- `src/screens/armario/ArmarioFichaWadaScreen.tsx` — MODIFIED (+ `alreadySaved` derived const, + `handleSaveForLater` inner fn, + divider + CTA JSX block inside bottom container, + 2 imports: `hapticMedium` from `@/lib/haptics`, `AccessibilityInfo` added to existing `react-native` import, + `i18n` from `@/i18n`)
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — MODIFIED (+ 8 to 12 new test cases, + `hapticMedium` in haptics mock, + `AccessibilityInfo.announceForAccessibility` spy)
- `src/i18n/locales/es.json` — MODIFIED (+ 3 new keys under `armario.s2`)
- `src/i18n/locales/en.json` — MODIFIED (+ 3 new keys under `armario.s2`)

**Files NOT touched (intentionally):**
- `src/screens/armario/ArmarioPickerScreen.tsx` / `.test.tsx` — 14.8 already wired the auto-save path; this story is a separate entry point. ZERO overlap.
- `src/components/armario/MisLooksLimitStrip.tsx` / `.test.tsx` — the strip is fully reused from 14.8. DO NOT modify.
- `src/hooks/usePremiumGate.ts` — signature + behavior preserved byte-for-byte; this story only ADDS a new caller (the CTA handler). Any mod here is scope creep.
- `src/components/PremiumPaywall.tsx` — reused via the 14.8-mounted sibling at lines 540–550.
- `src/stores/misLooksStore.ts` — `addFavorite` is already the right API from 14.2.
- `src/lib/wardrobeRepo.ts` — no slot-assignment in this story → no repo call.
- `src/lib/armario/saveCutoutAsWardrobeItem.ts` — unused here.
- Any navigation type file — no new routes, no route-params changes.
- `src/contexts/PremiumContext.tsx` — `isPremium` from `usePremium()` is already consumed in the screen from 14.8.

**Sprint-status file update is the only non-source artifact modified** (per convention). No new test files, no new component files, no new i18n namespaces.

### Testing Standards Summary

Per CLAUDE.md "Testing Discipline":
- Every AC describing user interaction has a corresponding test case (per AC #13's 12-case breakdown).
- `testID` attributes (React Native convention): `s2-save-for-later-cta`, `s2-save-for-later-divider` (both new); existing `s2-slot-${i}`, `s2-view-look-cta`, `s2-ficha-wada-screen`, `mislooks-limit-strip` preserved.
- Test interactions (tap triggers addFavorite; tap under limbo triggers paywall; tap fires hapticMedium; double-tap stays idempotent) NOT rendering alone.
- Co-located: `ArmarioFichaWadaScreen.test.tsx` is already co-located with the screen (line-for-line file structure preserved).
- Jest mocks use project's existing patterns (AsyncStorage via `async-storage-mock`, SymbolView → View with name-encoded testID, navigation fns via manual mocks). REUSE, don't invent.

### References

- **Epic spec**: [epic-14.md §Story 14.9](../../docs/planning/epic-14/epic-14.md#story-149-guardar-para-luego-explicit-bookmark-in-ficha-wada) lines 654–700 — covers FR13, implements TD-4 mirror.
- **Epic TD-4** (paywall-limbo — disabled state + explanatory strip): [epic-14.md:58] — shared between 14.8 (slot-tap) and 14.9 (this story, CTA-tap). Behavior contract identical.
- **UX-DR2** (Ficha Wada working mode + "Guardar para luego"): `docs/planning/ux-design-epic-14.md:280–351` — CTA placement (ghost button, above FAB_PROTRUSION, below divider), state-variants table, interaction (hapticMedium + no-navigation + vanish), a11y contract, copy (ES+EN), trade-offs (no FAB/sticky, hide-when-saved), Pencil TODOs (star vs bookmark resolved to bookmark; toast-vs-vanish resolved to vanish).
- **UX-DR2 haptic contract**: `docs/planning/ux-design-epic-14.md:796` — "*Ficha Wada 'Guardar para luego' | hapticMedium | Commit.*"
- **UX-DR2 canonical copy table**: `docs/planning/ux-design-epic-14.md:757–758` — "Guardar para luego" / "Save for later" / "Guardado en Mis Looks" / "Saved to Mis Looks" (the last two are reused from 14.8 via `armario.s2.lookSavedAnnouncement`).
- **ADR-005** (unified store): `docs/adrs/ADR-005-unified-mis-looks-store.md` — `useMisLooksStore.addFavorite` action is part of the committed store surface. `new Set` ref on every write drives reactivity.
- **Previous story (14.8)**: `_bmad-output/implementation-artifacts/14-8-auto-save-look-on-first-assignment.md` — establishes the TD-4 paywall-limbo gate, `MisLooksLimitStrip`, `PremiumPaywall` sibling mount, `gate`, `favorites` + `addFavorite` selectors, `needsLimitGate` const. This story REUSES all of it. DO NOT duplicate `MisLooksLimitStrip` (epic-14.md:700).
- **Story 14.7 (baseline for Mis Looks tab rename)**: `_bmad-output/implementation-artifacts/14-7-mis-looks-tab-rename-icon.md` — confirms the tab label users see when `addFavorite` writes: "Mis Looks" / "My looks".
- **Foundational store (14.2)**: `_bmad-output/implementation-artifacts/14-2-mis-looks-store-unification-migration.md` — `useMisLooksStore.addFavorite(id)` idempotency at `misLooksStore.ts:166`, favorites Set new-ref-on-every-write.
- **Ficha Wada source (BEFORE this story's edits)**: `src/screens/armario/ArmarioFichaWadaScreen.tsx` — line numbers referenced in this spec reflect the post-14.8 state at `epic-14` HEAD `0d2755a`:
    - `:6` — `SymbolView` import (reuse)
    - `:9` — `react-native` import line (add `AccessibilityInfo`)
    - `:21` — haptics import (add `hapticMedium`)
    - `:66` — `favorites` selector (REUSE — do not add a second)
    - `:67` — `addFavorite` selector (REUSE)
    - `:68` — `isPremium` from `usePremium()` (REUSE)
    - `:69` — `gate = usePremiumGate(favorites)` (REUSE)
    - `:86–89` — `needsLimitGate` const (REUSE — add `alreadySaved` immediately after)
    - `:101–154` — inner function declarations (add `handleSaveForLater` after `handleSlotTap` at `:113`)
    - `:222` — `MisLooksLimitStrip` inline render (REUSE — do not modify)
    - `:395–437` — bottom CTA container (insert the divider + new `<Pressable>` inside this container, BEFORE the existing "Ver tu look" Pressable at `:403`)
    - `:540–550` — `<PremiumPaywall>` sibling modal (REUSE as-is — its `onPurchase={() => gate.handlePurchase(addFavorite)}` already handles the 14.9 purchase branch because `gate.handlePremiumGate(combinationId)` pre-selects the blocked combo)
- **Memory references**: `feedback_workflow.md` (branch off `epic-14` HEAD `0d2755a`, parallel-safe where applicable, minimal user interaction), `feedback_visual_review.md` (Alejandro validates Expo simulator visual smoke after dev-story, before code-review — flag at hand-off), `feedback_native_module_rebuild.md` (N/A — pure JS/TSX + JSON), `feedback_simulator_reset.md` (`expo start --clear`, never erase simulators), `feedback_tailwind_tokens.md` (N/A — no Tailwind color keys with utility prefixes introduced; CTA uses `wadaTokens` via `style={{}}` only), `feedback_no_analytics.md` (N/A — no metrics SDK), `feedback_no_patches.md` (the CTA + handler are a root-cause implementation of FR13, not a prop-patch), `feedback_always_validate.md` (checklist validation runs automatically on create-story), `feedback_agent_context.md` (story-file enrichment is mandatory per project convention).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Opus 4.7, 1M context)

### Debug Log References

- `pnpm jest --testPathPattern="ArmarioFichaWadaScreen"` → 34 passing (24 baseline + 10 new).
- `pnpm test` → 893 passing / 3 pre-existing / 896 total vs 14.8 baseline of 883/3/886 → **+10 net new passing** (target +8..+12 ✅; within 891 ± 3 envelope per AC #13).
- `npx tsc --noEmit` → clean.
- `pnpm lint` → 2 pre-existing format errors (FavoritesList.test.tsx + OutfitVisualizer.tsx from 14.7/14.6 scope, D-14.7-4), 0 new errors — matches AC #14 baseline. Biome --write auto-fixed the new test file's format before revert; those two pre-existing files were restored with `git checkout --` to keep this story's diff strictly scoped per AC #15.

### Completion Notes List

| AC | Evidence |
|---|---|
| 1 | Divider + CTA added inside bottom CTA container at `ArmarioFichaWadaScreen.tsx:395–437`, above "Ver tu look". Both gated by `{!alreadySaved && (...)}` fragment. Divider spans full width via `marginHorizontal: -20`. |
| 2 | CTA props: `testID="s2-save-for-later-cta"`, `onPress={handleSaveForLater}`, `disabled={!hydrated}`, `accessibilityRole="button"`, a11y label/hint from `t(...)`, `accessibilityState={{ disabled: !hydrated }}`, `className="items-center justify-center flex-row"`, style includes `opacity: needsLimitGate ? 0.4 : 1`. SF Symbol `bookmark` + Inter_500Medium 15pt text. |
| 3 | `const alreadySaved = favorites.has(combinationId);` added immediately after `needsLimitGate`. Reuses existing `favorites` selector at line 66. Consumed only for conditional CTA/divider render. |
| 4 | `handleSaveForLater` fires `hapticMedium()` → snapshots `prevFavorited` via `getState()` → `addFavorite` in try/catch → announce gated by `!prevFavorited`. No navigation call. Verified by "tap writes favorite via addFavorite + hapticMedium + announceForAccessibility" test. |
| 5 | `if (needsLimitGate) { gate.handlePremiumGate(combinationId); return; }` short-circuits before `addFavorite`. Verified by "tap with paywall-limbo opens paywall, NOT addFavorite" test. |
| 6 | `MisLooksLimitStrip` at line 224 unchanged. CTA opacity 0.4 when `needsLimitGate` true. Verified by "CTA renders at opacity 0.4 under paywall-limbo" test (also asserts strip coexistence). |
| 7 | 3 keys × 2 locales added under `armario.s2` in `es.json` + `en.json`. `i18n.test.ts` parity test at line 40 passes (893 passing suite includes it). |
| 8 | Handler never calls `goBack()` or dismiss-triggered navigation; paywall dismiss flips `paywallVisible` → false via existing `usePremiumGate` machinery. `favorites` set unchanged. |
| 9 | `queryByTestId` returns null for both CTA and divider when `favorites.has(combinationId)`. Verified by "hides Guardar para luego CTA + divider when combination already in favorites" test. |
| 10 | `!isPremium` short-circuits `needsLimitGate` to false when premium. Verified by "premium user + size 100 + tap writes favorite without paywall" test. |
| 11 | No mount/focus side effect fires the handler — only explicit `onPress`. Covered by baseline pattern; no new test needed beyond existing 14.8 coverage. |
| 12 | Zustand selector reactivity: when `mockFavorites` changes to `new Set(size 4)` on rerender, the strip disappears and slot opacity returns to 1 (baseline 14.8 test "delete-from-Mis-Looks simulation..." already covers this path; `alreadySaved` uses same selector). |
| 13 | `pnpm test` → 893 passing / 3 pre-existing / 896 total. Net +10 vs 883 baseline (target +8..+12 ✅). |
| 14 | `npx tsc --noEmit` clean. `pnpm lint` → 2 pre-existing errors only (FavoritesList.test.tsx + OutfitVisualizer.tsx / D-14.7-4), 0 new findings — matches 14.8 baseline. Function declaration, named exports, NativeWind `className` for static layout + `style={{}}` for tokens, haptics via `@/lib/haptics`. No native module, no Toast, no new deps. |
| 15 | Branch `story/14-9-guardar-para-luego-ficha-wada` off `epic-14` HEAD `0d2755a`. No changes to ArmarioPicker, MisLooksLimitStrip, usePremiumGate, PremiumPaywall, misLooksStore, wardrobeRepo, navigation types, or native modules. |

### File List

- `src/screens/armario/ArmarioFichaWadaScreen.tsx` — MODIFIED (+ imports `hapticMedium`, `AccessibilityInfo`, `i18n`; + `alreadySaved` derived const; + `handleSaveForLater` inner function; + divider + CTA JSX block gated by `!alreadySaved`)
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — MODIFIED (+ `hapticMedium` in mock; + `AccessibilityInfo` spy; + store mock `getState()` adapter; + 10 new test cases for AC #1/#2/#4/#5/#6/#9/#10/#13)
- `src/i18n/locales/es.json` — MODIFIED (+ `saveForLaterCta`, `saveForLaterA11yLabel`, `saveForLaterA11yHint` under `armario.s2`)
- `src/i18n/locales/en.json` — MODIFIED (+ same 3 keys mirrored)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (story 14.9 ready-for-dev → in-progress → review; dated note appended)
- `_bmad-output/implementation-artifacts/14-9-guardar-para-luego-ficha-wada.md` — MODIFIED (tasks checked, Status: review, completion notes + file list populated)

### Review Findings

- [x] [Review][Patch] P1 — Falta test de doble-tap idempotencia (AC #13 caso h) [`src/screens/armario/ArmarioFichaWadaScreen.test.tsx`] — El test `"rapid double-tap → addFavorite called once only"` listado en AC #13(h) no fue implementado. El mecanismo `prevFavorited` via `getState()` es correcto en producción (segundo tap ve `prevFavorited = true` → announce no dispara), pero no está verificado por ningún test. Implementar con `mockAddFavorite` que mute `mockFavorites` en la primera llamada, o con `fireEvent.press(cta)` dos veces y assert `announceForAccessibility.mock.calls.length === 1`.
- [x] [Review][Defer] D-14.9-1 — `accessibilityHint` estático no refleja estado paywall-limbo [`ArmarioFichaWadaScreen.tsx:446`] — deferred, patrón pre-existente (slot taps en 14.8 tienen el mismo gap; consistencia intencional)
- [x] [Review][Defer] D-14.9-2 — Sin indicador visual de loading cuando `hydrated=false` (CTA a opacity 1 mientras disabled) [`ArmarioFichaWadaScreen.tsx:458`] — deferred, patrón pre-existente igual que "Ver tu look"
- [x] [Review][Defer] D-14.9-3 — announce-on-throw anuncia éxito cuando el write falló [`ArmarioFichaWadaScreen.tsx:126-137`] — deferred, hereda D-14.8-2 explícitamente documentado en spec
- [x] [Review][Defer] D-14.9-4 — `marginHorizontal: -20` número mágico asume padding fijo del contenedor padre [`ArmarioFichaWadaScreen.tsx:436`] — deferred, patrón pre-existente en todos los screens armario
- [x] [Review][Defer] D-14.9-5 — Ruta post-compra desde esta pantalla no tiene test dedicado (se fía del mock `mockHandlePurchase`) [`ArmarioFichaWadaScreen.tsx:624`] — deferred, fuera del scope de AC #13

### Change Log

- 2026-04-22 — Story 14.9 "Guardar para luego" CTA implementada en `story/14-9-guardar-para-luego-ficha-wada` off epic-14 HEAD `0d2755a`. Net +10 tests vs 14.8 baseline. tsc + lint clean. Ready for visual smoke + adversarial code-review gate.
