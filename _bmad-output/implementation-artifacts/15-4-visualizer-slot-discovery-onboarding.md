# Story 15.4: A2 — Visualizer slot-discovery onboarding (coach mark + permanent pulse)

Status: review

## Story

As **a first-time Outfinder user landing on `OutfitVisualizer`** (entered from `Combinations`, `FavoritesList`, `ColorHome`, or `BrowseAllColors` for the very first time after install or after a "Reset coach marks" dev tap),
I want **(a) a single-step coach mark superimposed on the Visualizer that explains the slot affordance in one sentence ("Toca cualquier prenda para cambiarla o conectarla con tu armario." in ES; "Tap any garment to swap it or connect it to your wardrobe." in EN), backed by an "Entendido" / "Got it" dismiss button that persists my acknowledgement in AsyncStorage under `@outfinder/coachmark:visualizer-slots-firstuse`, AND (b) a permanent, subtle pulse on the underline bar of every garment slot — not just the currently selected one — so the affordance survives even after I dismiss the coach mark**,
so that **I discover that the silhouettes are tappable BEFORE I bounce off the screen (per FR8 + DEC-4: coach mark se skipea, pulse permanente garantiza descubribilidad continua), AND on every subsequent open of the Visualizer the overlay never reappears (FR8 persistence), AND the experience reuses the Story 15.1 `CoachMarkOverlay` + `useCoachMark` foundation in 1 line each per consumer (DEC-5) without re-implementing AsyncStorage gating, Reduce Motion handling, VoiceOver announcements, or a dismiss button**.

## Acceptance Criteria

1. **Given** Story 15.1 shipped the `CoachMarkOverlay` component, the `useCoachMark(key)` hook, and the `COACH_MARK_KEYS.visualizerSlotsFirstUse` registry entry (all merged at `aac6c93` on `epic-15`, and Story 15.3 already ratified the wiring pattern at `c4a5c0f`), **When** Story 15.4 is implemented, **Then** `src/screens/OutfitVisualizer.tsx`:
    - imports `CoachMarkOverlay` from `@/components/CoachMarkOverlay` and `useCoachMark` from `@/hooks/useCoachMark` (group with the existing `@/`-prefixed imports — alphabetical inside the group).
    - imports `COACH_MARK_KEYS` from `@/lib/coachMarkKeys` (the registry — DO NOT inline the literal string `"@outfinder/coachmark:visualizer-slots-firstuse"` at the call site; the registry is the single source of truth per Story 15.1 DEC-5 + Epic 15 NFR7 — same rule that 15.3 review enforced via the patch `[Review][Patch] COACH_KEY literal duplicates registry`).
    - calls `const { shouldShow: shouldShowCoachMark, markSeen: markCoachMarkSeen } = useCoachMark(COACH_MARK_KEYS.visualizerSlotsFirstUse);` exactly once at the top of the component, AFTER `useStoreReviewPrompt()` (line 186) and BEFORE the `if (!combination)` early return at line 188 (Rules of Hooks per CLAUDE.md — `useCoachMark` does an internal `useEffect`+`useState`, both must run before any return).
    - defines `async function handleDismissCoachMark()` placed after `handleNextGarment` (line 183 close) and before `useStoreReviewPrompt()`. Body: exactly two lines — `hapticLight(); await markCoachMarkSeen();`. NO try/catch (per CLAUDE.md "Don't add error handling … for scenarios that can't happen": `lib/haptics` already swallows, `markSeen` already swallows; double-wrapping would violate `feedback_no_patches.md`). Use a function declaration, not an arrow — the file's handler convention is `function handleX()` (lines 95, 108, 141, 157, 171).
    - renders `<CoachMarkOverlay …/>` as the LAST child of the root `<View>` opened at line 207 — i.e. AFTER the bottom CTA `<View className="px-4" style={…}>` block that closes at line 364, BEFORE the root `</View>` at line 366. Rationale: the foundation overlay is `position: absolute; inset: 0; zIndex: 999`, and placing it last in the parent ensures z-order parity with how 15.3 placed it after `{renderErrorSheet()}`. Props per the contract below.
    - `<CoachMarkOverlay>` props: `visible={shouldShowCoachMark}` (no extra gating — the early-return at line 188 already prevents the overlay from mounting in the not-found branch, so `combination` is guaranteed non-null below it; no permission/error states exist on this screen the way they did on `UnifiedCameraCaptureScreen`), `text={t("visualizer.coachMark.text")}`, `accessibilityAnnouncement={t("visualizer.coachMark.a11yAnnouncement")}`, `onDismiss={handleDismissCoachMark}`, `testID="visualizer-coach-mark"`. NO `dismissLabel` prop — the foundation falls back to `t("common.coachMark.gotIt")` shipped in 15.1, and Epic 15 NFR2 says ALL coach marks reuse that single shared key.

2. **Given** FR8 ("La primera vez que un user entra en `OutfitVisualizer`, un coach mark superpuesto explica que las siluetas son tocables y revelan armario / cambio de prenda") and the persistence half of FR8 (the coach mark must NOT reappear after dismiss), **When** Story 15.4 is implemented, **Then** the following BEHAVIORAL contract holds (verified by tests in AC #5):
    - First mount with AsyncStorage value for key `@outfinder/coachmark:visualizer-slots-firstuse` undefined → after the hook's `useEffect` resolves, `<CoachMarkOverlay>` is in the tree with `visible={true}` (testID `visualizer-coach-mark` queryable via `getByTestId`).
    - Tap dismiss button (`visualizer-coach-mark-dismiss`) → `hapticLight` called once, `AsyncStorage.setItem("@outfinder/coachmark:visualizer-slots-firstuse", "true")` called once, overlay leaves the tree (`queryByTestId("visualizer-coach-mark")` returns null).
    - Remount the screen with AsyncStorage value `"true"` → after the hook's `useEffect` resolves, `<CoachMarkOverlay>` is NOT in the tree (`queryByTestId("visualizer-coach-mark")` returns null at all times).
    - Not-found branch (`combination` is `undefined` because `getCombination(combinationId)` returns nothing) → the early return at line 188 short-circuits BEFORE the overlay can render, so `queryByTestId("visualizer-coach-mark")` is null even with AsyncStorage cleared. This is structurally guaranteed by the placement (overlay below the early return) and does NOT need an explicit visibility gate.
    - Tap-then-swap interaction (the existing happy path) is NOT blocked by the overlay during dismissal: pressing dismiss flips `shouldShow` to `false` synchronously via the hook's optimistic `setShouldShow(false)`, so the next press on a slot lands on the slot, not on a stale overlay.

3. **Given** FR9 ("El underline pulse de los slots de `OutfitCard` está permanentemente activo (no condicionado a `isSelected`), ofreciendo affordance visual continuo de interactividad") and DEC-4 ("Coach mark first-use **+** underline pulse permanente (quitar gate `isSelected` en `OutfitCard.tsx`)"), **When** Story 15.4 is implemented, **Then** `src/components/OutfitCard.tsx > CardSlot` (lines 43–193):
    - removes the `isSelected` branching from the pulse `useEffect` at lines 63–81. The `useEffect` no longer reads `isSelected` to decide whether to animate; instead, the pulse runs permanently for ALL slots whenever the slot is mounted.
    - new pulse range — `0.3 ↔ 0.7` (permanent baseline, "subtle, never aggressive" per the epic spec at `docs/planning/epic-15/epic-15.md:166`). When `isSelected` is `true`, the pulse range AMPLIFIES to `0.5 ↔ 1.0` (preserves the existing visual cue that "this slot is currently selected for swap" — there is no other pre-swap visual differentiator on the card; removing it entirely would silently break the 2-tap swap UX that 15 existing tests rely on).
    - implementation shape (illustrative — adapt to keep the diff minimal):
      ```tsx
      useEffect(() => {
          const baseline = isSelected ? 0.5 : 0.3;
          const peak = isSelected ? 1.0 : 0.7;
          if (reducedMotion) {
              underlineOpacity.value = (baseline + peak) / 2;  // freeze at midpoint
              return;
          }
          underlineOpacity.value = baseline;
          underlineOpacity.value = withRepeat(
              withTiming(peak, {
                  duration: 1200,
                  easing: Easing.inOut(Easing.ease),
              }),
              -1,
              true,
          );
      }, [isSelected, reducedMotion, underlineOpacity]);
      ```
      The `else { underlineOpacity.value = withTiming(0, { duration: 150 }); }` clause at lines 78–80 is DELETED — there is no longer a "fade out" path because the pulse is permanent.
    - Reduce Motion (`useReducedMotion()` at line 57) freezes `underlineOpacity` at the midpoint of the active range (e.g. `0.5` for non-selected, `0.75` for selected) instead of pulsing. Per CLAUDE.md "Respect Reduce Motion setting" + Epic 15 NFR6.
    - `<Animated.View testID="underline-bar">` (lines 173–186) keeps its existing layout (height 4, width-relative-to-card, premiumAccent color, marginTop 4). Only the `underlineOpacity` driver changes. Do NOT change the bar geometry, color, or `testID`.

4. **Given** Epic 15 NFR2 ("Todos los strings nuevos … en ES + EN") and the existing `visualizer.*` namespace (already populated at `src/i18n/locales/es.json:30` and `en.json:30` with `goBack`, `notFound`, `screenLabel`, `previousGarment`, `nextGarment`, `makeMineButton`, `makeMineA11yLabel`, `makeMineA11yHint`, `selectedForSwap`, `swapResult`, `changedTo`), **When** Story 15.4 is implemented, **Then** BOTH `src/i18n/locales/es.json` AND `src/i18n/locales/en.json` gain a NEW sub-object `visualizer.coachMark` containing exactly two keys:
    - `text` — body copy that renders inside the overlay card. ES (fixed by epic spec at `docs/planning/epic-15/epic-15.md:165`): `"Toca cualquier prenda para cambiarla o conectarla con tu armario."` EN: `"Tap any garment to swap it or connect it to your wardrobe."` (validate the EN with Alejandro on visual smoke if it reads off; the ES is canonical).
    - `a11yAnnouncement` — VoiceOver string passed to `AccessibilityInfo.announceForAccessibility` via the foundation's `accessibilityAnnouncement` prop. ES: `"Consejo del Visualizador. Toca cualquier prenda para cambiarla o conectarla con tu armario."` EN: `"Visualizer tip. Tap any garment to swap it or connect it to your wardrobe."` Rationale (mirror of the 15.3 pattern): the `text` reads natural for a sighted user looking at the cards; the VoiceOver announcement adds an explicit "Visualizer tip" / "Consejo del Visualizador" prefix so the user knows it's a coach mark, not a system alert.
    - NO `dismissLabel` key — reuse `common.coachMark.gotIt` from Story 15.1 (already in both locales at `src/i18n/locales/{es,en}.json:197–199`). Adding a per-coach-mark dismiss label here would re-fragment the i18n surface that 15.1 deliberately consolidated — DO NOT.
    - Placement: insert `coachMark` as a sibling of `changedTo` at the END of the `visualizer` object (line 41 close in both locales). The `visualizer` object is currently NOT alphabetical (it's flow-ordered: nav → notFound → screen → buttons → a11y), so appending at the end matches the convention.
    - `git grep '"coachMark"' src/i18n/locales/es.json | wc -l` returns exactly THREE matches after this story (the existing `common.coachMark`, the existing `unifiedCamera.coachMark` shipped in 15.3, plus the new `visualizer.coachMark`). Same for `en.json`. If you see a fourth, you've added a key in the wrong place.

5. **Given** the test gate per CLAUDE.md ("Mandatory Code Review" + Epic 14 retro: "testing gaps main HIGH source"), **When** Story 15.4 is implemented, **Then** ALL of the following CI gates pass on the story branch BEFORE handoff:
    - `npx tsc --noEmit`: zero NEW errors. Pre-existing baseline on `epic-15` HEAD `c4a5c0f` is **0 errors** per the 15.3 Debug Log (the spec for 15.3 said "2 baseline" but actual current baseline is 0 — Story 15.1 cleaned the original 2 errors; Story 15.6 + 15.3 retros confirmed `tsc 0`). Capture the count before starting and confirm post-story count matches.
    - `pnpm lint`: zero NEW errors. Pre-existing baseline is **2 errors** in `src/screens/FavoritesList.test.tsx` + `src/screens/OutfitVisualizer.tsx` (Biome format issues, out-of-scope per `feedback_no_patches.md`). Capture pre, match post. NOTE: this story TOUCHES `src/screens/OutfitVisualizer.tsx` — if a Biome auto-fix runs on the file as a side-effect of `pnpm exec biome check --write`, the pre-existing format error may get cleaned up. That's acceptable and a net win, but DO NOT piggyback unrelated cleanups: keep the diff scoped to the lines this story actually requires (imports, hook call, handler, JSX block). If Biome rewrites unrelated whitespace in `OutfitVisualizer.tsx`, accept ONLY the changes inside the new diff regions; revert the rest via `git checkout -p`.
    - `pnpm test`: green with the test count INCREASING by ≥6 (the six new cases added across `OutfitVisualizer.test.tsx` and `OutfitCard.test.tsx` per AC #5 sub-bullets) and ZERO new test-skips (`grep -rn 'test\.skip\|it\.skip\|xit(' src/ | wc -l` count must not increase from baseline).
    - The existing 18 tests in `src/components/OutfitCard.test.tsx` must continue to pass UNMODIFIED. The two existing underline-related tests (`selected slot renders underline bar` line 334 and `non-selected slots have underline bar at opacity 0` line 349) only assert `getAllByTestId("underline-bar").length === 2`; they do NOT assert opacity values, so the opacity-range change does NOT break them. The latter test name is now misleading ("opacity 0" is no longer accurate post-15.4) — RENAME the `it("non-selected slots have underline bar at opacity 0", …)` description to `it("non-selected slots have underline bar permanently visible (post-15.4)", …)` to keep the test self-documenting, but DO NOT change its assertions.
    - The existing 49 tests in `src/screens/OutfitVisualizer.test.tsx` must continue to pass after one minimal change: the `beforeEach` at line 76–88 already mocks AsyncStorage `getItem` to return `"true"` (line 86 — Story 11.x dev who set this default left it as "already introduced"). KEEP that default for the existing 49 tests — they don't expect a coach mark. The new tests for AC #5 will OVERRIDE `mockGetItem` per-test to return `null` to exercise the first-mount path.
    - The 6 new tests in `OutfitVisualizer.test.tsx` (use the existing `mockGetItem` / `mockSetItem` pattern at lines 44–50 — DO NOT mock `useCoachMark`; mocking the hook would let a regression where someone passes the wrong key string slip through; Story 15.3 review explicitly enforced this rule):
        - **(a) first mount with cleared flag → coach mark visible**: in a new nested `describe("Slot-discovery coach mark (Story 15.4)", …)`, set `mockGetItem.mockResolvedValue(null);` per-test, render with a valid combination, `await waitFor(() => expect(screen.getByTestId("visualizer-coach-mark")).toBeTruthy())`, assert `screen.getByTestId("visualizer-coach-mark-text").props.children` matches `"Tap any garment to swap it or connect it to your wardrobe."` (EN — `i18n` is initialized to EN in `jest.setup.js`).
        - **(b) dismiss → AsyncStorage set + haptic + overlay leaves**: from state (a), `fireEvent.press(screen.getByTestId("visualizer-coach-mark-dismiss"))`, `await waitFor(...)` that `mockSetItem` was called with `("@outfinder/coachmark:visualizer-slots-firstuse", "true")`, `mockHapticLight` was called once, and `screen.queryByTestId("visualizer-coach-mark")` returns null. NOTE: `mockHapticLight` is already declared at line 37 — reuse the existing reset in `beforeEach` (line 78).
        - **(c) remount with already-seen → no overlay**: `mockGetItem.mockResolvedValue("true");` (the file's default — explicit re-statement for self-documentation), render, flush microtasks via `await waitFor(() => expect(mockGetItem).toHaveBeenCalled())`, assert `screen.queryByTestId("visualizer-coach-mark")` is null.
        - **(d) not-found combination → no overlay even with cleared flag**: `mockGetItem.mockResolvedValue(null);`, `mockGetCombination.mockReturnValue(undefined);`, render, await microtasks, assert `screen.queryByTestId("visualizer-coach-mark")` is null AND `screen.getByText("Combination not found")` is truthy. This test pins the structural guarantee that the overlay sits below the early return at line 188.
        - **(e) overlay does NOT block the back button** (defensive against z-order regressions in the foundation): from state (a), assert `screen.getByTestId("visualizer-back-button")` exists in the tree alongside the overlay (the back button is in the parent View at line 213 — the absolute-positioned overlay does not unmount it; this test catches a regression if a future refactor moves the back button INSIDE the overlay's area or the overlay's `position: fixed`-equivalent breaks the layout).
    - The 1 new test in `OutfitCard.test.tsx`:
        - **(f) underline pulse runs for ALL slots regardless of selection**: render with `selectedSlotIndex={null}`, assert `screen.getAllByTestId("underline-bar").length === N` for the slot count (existing tests already cover length); ADDITIONALLY assert that for each underline bar, `node.props.style` (after Reanimated's `useAnimatedStyle` wrapping) does not equal `{ opacity: 0 }`. NOTE: Reanimated worklets do not synchronously expose the live `opacity` value to the test renderer — testing the exact pulsed value is not feasible in `@testing-library/react-native` without a Reanimated-aware harness. INSTEAD, assert structurally: the existing `useEffect` is invoked (no `isSelected` short-circuit), `underlineOpacity.value` is mutated for all slots. Practical assertion: render, then `await waitFor(...)` and `expect(screen.getAllByTestId("underline-bar")).toHaveLength(N)` — same as existing — PLUS confirm that the pulsed driver is not gated by the `isSelected` prop by toggling `selectedSlotIndex` between `null` and `0` and asserting both renders show all underlines mounted (component does not unmount underline bars when no slot is selected). This is a structural test, not a pixel test — the visual smoke step in Task 4 is the actual verification.

## Tasks / Subtasks

- [x] **Task 1 — Wire `useCoachMark` + render `CoachMarkOverlay` in `OutfitVisualizer`** (AC: #1, partial #2)
  - [x] In `src/screens/OutfitVisualizer.tsx`, add the three new imports per AC #1 (`CoachMarkOverlay`, `useCoachMark`, `COACH_MARK_KEYS`). Group them with the existing `@/`-prefixed alias imports (lines 14–34) — alphabetical inside the group. Biome may re-order on `--write`; that's fine, functional equivalence is what matters.
  - [x] Insert the hook call AFTER `useStoreReviewPrompt()` (line 186) and BEFORE the `if (!combination)` early return at line 188: `const { shouldShow: shouldShowCoachMark, markSeen: markCoachMarkSeen } = useCoachMark(COACH_MARK_KEYS.visualizerSlotsFirstUse);`. Both `useStoreReviewPrompt` and `useCoachMark` are hooks → both must run before the early return per Rules of Hooks (CLAUDE.md).
  - [x] Define `async function handleDismissCoachMark()` immediately after `handleNextGarment` closing brace (line 183) and BEFORE `useStoreReviewPrompt()` (line 186). Body is exactly two lines: `hapticLight(); await markCoachMarkSeen();`. NO try/catch. **Dev note:** placed handler AFTER `useCoachMark()` instead of before `useStoreReviewPrompt()` to avoid forward-referencing the `markCoachMarkSeen` const (matches Story 15.3 proven order; runtime equivalent — handler still hoists; spec contract preserved: handler exists, hook runs before early return).
  - [x] Render `<CoachMarkOverlay … />` as the LAST child of the root View (the one opened at line 207, closed at line 366) — i.e. AFTER the bottom CTA View block that closes at line 364, BEFORE the root `</View>`. Props per AC #1.

- [x] **Task 2 — Permanent underline pulse in `OutfitCard.tsx > CardSlot`** (AC: #3)
  - [x] In `src/components/OutfitCard.tsx`, refactor the `useEffect` at lines 63–81 to drop the `isSelected` short-circuit. Implementation per AC #3 (illustrative shape provided). The `else { underlineOpacity.value = withTiming(0, { duration: 150 }); }` clause is DELETED.
  - [x] Reduce Motion path freezes the bar at the midpoint of the active range (`(baseline + peak) / 2`) instead of pulsing.
  - [x] Verify lines outside the `useEffect` body are untouched: `useReducedMotion()` call site (line 57), `underlineStyle` derivation (lines 83–85), `<Animated.View testID="underline-bar" …>` JSX (lines 173–186). DO NOT change geometry, color, or `testID`.

- [x] **Task 3 — i18n keys ES + EN** (AC: #4)
  - [x] In `src/i18n/locales/es.json`, INSIDE the `"visualizer"` object (lines 30–42), append a new sub-object `"coachMark": { "text": "...", "a11yAnnouncement": "..." }` per AC #4. Place it as the LAST sibling (after `changedTo` at line 41). Re-validate JSON syntax (no trailing commas) after the edit.
  - [x] In `src/i18n/locales/en.json`, mirror the same structure with the EN strings per AC #4. Same placement.
  - [x] Run `node -e 'JSON.parse(require("fs").readFileSync("src/i18n/locales/es.json"))' && node -e 'JSON.parse(require("fs").readFileSync("src/i18n/locales/en.json"))'` to confirm both files still parse. (Or `pnpm lint` will catch it via Biome.)
  - [x] `git grep '"coachMark"' src/i18n/locales/es.json | wc -l` returns `3` (common + unifiedCamera + visualizer). Same for `en.json`. If `4+`, you placed it in the wrong namespace.

- [x] **Task 4 — Tests + AC verification + CI gates + on-device smoke** (AC: #5)
  - [x] Add the 5 new tests to `src/screens/OutfitVisualizer.test.tsx` per AC #5 sub-bullets (a)–(e), inside a new nested `describe("Slot-discovery coach mark (Story 15.4)", …)` block placed AFTER the existing top-level `describe("OutfitVisualizer", …)` close and BEFORE the iPad layout describe. Reuse `mockGetItem` / `mockSetItem` (lines 44–50) and `mockHapticLight` (line 37). DO NOT mock `useCoachMark` (real hook against AsyncStorage mock).
  - [x] Add the 1 new test (f) to `src/components/OutfitCard.test.tsx` per AC #5. Placed AFTER the existing "non-selected slots have underline bar" test. RENAMED that adjacent test description to `"non-selected slots have underline bar permanently visible (post-15.4)"` per AC #5.
  - [x] Pre-baselines captured on story branch: lint **2** (FavoritesList.test + OutfitVisualizer.tsx pre-existing format), tsc **0**, pnpm test **958/3/961**, skips **0**.
  - [x] Post-change: lint **2 (UNCHANGED)**, tsc **0 (UNCHANGED)**, pnpm test **964/3/967 (delta +6 — exactly the 6 new tests across both files)**, skips **0 (UNCHANGED)**.
  - [x] AC verification (point-by-point): AC #1 ✓ (3 imports + hook + handler + JSX render). AC #2 ✓ (5 behaviors mapped to tests a–e). AC #3 ✓ (pulse range 0.3↔0.7 / 0.5↔1.0, Reduce Motion midpoint, underline-bar testID intact). AC #4 ✓ (keys placed at end of `visualizer` object, JSON parses, grep count = 3 per locale). AC #5 ✓ (CI deltas exact, 6 new test cases, all pre-existing tests untouched).
  - [x] On-device smoke approved by Alejandro 2026-04-27 (iPhone 16 Pro): Settings → "Reset coach marks" → Visualizer → overlay aparece sobre la card, "Entendido" descarta con haptic light, slots tap-ables, sin reaparición tras salir/entrar, todos los underlines pulsan sutilmente, EN OK.

## Dev Notes

### Architecture & patterns to follow (load-bearing)

- **Foundation reuse, not reinvention** — Story 15.1 shipped `CoachMarkOverlay` (`src/components/CoachMarkOverlay.tsx`), `useCoachMark` (`src/hooks/useCoachMark.ts`), and `COACH_MARK_KEYS` (`src/lib/coachMarkKeys.ts:8` already has `visualizerSlotsFirstUse`). Story 15.3 ratified the wiring pattern (3 imports + 1 hook call + 1 handler + 1 JSX block). 15.4 follows the EXACT SAME shape — DO NOT duplicate AsyncStorage logic, AccessibilityInfo announcement code, Reduce Motion handling, or the "Got it" button. DO NOT add a `steps[]` prop or any multi-step pattern — the foundation is single-step by design.
- **Function declarations with named exports** — the screen already uses `export function OutfitVisualizer()` (line 58) and `function getNextGarmentLabel()` (line 47). The new `handleDismissCoachMark` follows the existing handler convention (`function handleX()` — lines 95, 108, 141, 157, 171). Note that `handleSlotTap`, `handleVariantCycle`, `handlePreviousGarment`, `handleNextGarment` use `useCallback`. `handleDismissCoachMark` does NOT need `useCallback` — it's only passed once into a single child component and there's no re-render hot path from it. Keep it as a plain `async function`. Match the 15.3 pattern.
- **Rules of Hooks** — `useCoachMark` MUST be called BEFORE the `if (!combination)` early return at line 188. Place it AFTER `useStoreReviewPrompt()` (line 186) which is also a hook with the same constraint. CLAUDE.md "All hooks must be called before any early returns".
- **Haptics ONLY through `lib/haptics.ts`** — `hapticLight` is already imported at line 28. Reuse it. DO NOT import `expo-haptics` directly (CLAUDE.md "Haptics only through lib/haptics.ts" + memory `feedback_no_patches.md`).
- **`testID` not `data-testid`** — React Native convention per CLAUDE.md. The foundation already uses `testID` props for the overlay container (`visualizer-coach-mark`) and the dismiss button (`${testID}-dismiss` → `visualizer-coach-mark-dismiss`). Use those exact testIDs in tests.
- **NativeWind `className` for static styles, `style={{}}` only for dynamic Wada color values** — this story does not introduce new styles. The `<CoachMarkOverlay/>` already owns its visual contract (paper-cream card, NotoSerifJP body, Inter dismiss label) per Story 15.1. The OutfitCard underline bar already exists; only the `underlineOpacity` driver is changing.

### Visibility gating contract — simpler than 15.3

Unlike `UnifiedCameraCaptureScreen` (which has permission/error states gating the overlay via a 3-way AND), `OutfitVisualizer` has only ONE gating concern: the not-found branch. That branch is handled STRUCTURALLY by the early return at line 188 — the overlay is rendered BELOW that return, so it can never paint over the "Combination not found" view. Therefore the `visible` prop is just `shouldShowCoachMark` — no extra `&&`.

DO NOT introduce defensive checks like `visible={shouldShowCoachMark && combination !== undefined}`. The early return already guarantees that.

### Permanent pulse — design rationale (preserve in implementation)

The current pulse animates `0 → 1` ONLY when `isSelected`. The selected slot is the swap target during a 2-tap swap; the pulse signals "this is selected, tap another slot to complete the swap". Other slots have no underline at all (opacity 0).

After 15.4, ALL slots pulse permanently to advertise tap-ability. Keeping the selected slot at the SAME range as non-selected would erase the swap-selection visual cue, leaving only `accessibilityState.selected` (VoiceOver only) — which is bad UX for sighted users mid-swap.

The chosen ranges:
- **Non-selected:** `0.3 ↔ 0.7` — subtle, persistent, says "I'm tap-able"
- **Selected:** `0.5 ↔ 1.0` — brighter, persistent, says "I'm armed for swap"

Both stay within Easing.inOut(Easing.ease) at 1200ms duration to preserve the gentle rhythm. Reduce Motion freezes at the midpoint of the active range (`0.5` non-selected, `0.75` selected) — visually distinguishable without animation.

### File layout

```
src/
  screens/
    OutfitVisualizer.tsx       ← MOD (3 new imports, 1 hook call, 1 handler, 1 JSX block)
    OutfitVisualizer.test.tsx  ← MOD (1 new nested describe, 6 new it cases)
  components/
    OutfitCard.tsx             ← MOD (refactor pulse useEffect, drop isSelected gate)
    OutfitCard.test.tsx        ← MOD (1 rename + 1 new it case)
  i18n/locales/
    es.json                    ← MOD (add visualizer.coachMark sub-object)
    en.json                    ← MOD (mirror of es.json)
```

NO new files. NO new directories. NO new packages. NO native module changes. NO `app.config.ts` changes.

### Reuse — do NOT reinvent

| Need | Reuse from | DO NOT |
|------|------------|--------|
| Coach mark UI shell | `CoachMarkOverlay` (Story 15.1) | Build a per-screen overlay |
| AsyncStorage seen-flag | `useCoachMark` (Story 15.1) | Inline `AsyncStorage.getItem`/`setItem` |
| AsyncStorage key string | `COACH_MARK_KEYS.visualizerSlotsFirstUse` (already at line 8) | Type the literal `"@outfinder/coachmark:..."` |
| "Got it" button label | `common.coachMark.gotIt` (in es.json + en.json line 197–199) | Add a per-screen dismiss label key |
| VoiceOver announcement | `CoachMarkOverlay`'s `accessibilityAnnouncement` prop | Call `AccessibilityInfo.announceForAccessibility` here |
| Reduce Motion handling (overlay) | Inside `CoachMarkOverlay` (uses `useReducedMotion`) | Add a second Reduce Motion check at this call site |
| Reduce Motion handling (pulse) | `useReducedMotion()` already imported in `OutfitCard.tsx` line 17 | Call `AccessibilityInfo.isReduceMotionEnabled()` again |
| Light haptic | `hapticLight` from `@/lib/haptics` (already imported line 28) | Add `expo-haptics` |
| Dev reset affordance | `Settings.tsx:dev-reset-coach-marks-row` (line 446 — Story 15.1) | Add a second dev row |
| Pulse infrastructure | Existing `underlineOpacity` shared value, `withRepeat` + `withTiming`, `Easing.inOut(Easing.ease)` | Add a second animation driver |

### Trigger semantics

The coach mark shows when `OutfitVisualizer` mounts AND the user has not yet dismissed it. There is no FAB or button trigger — entering the screen IS the trigger. Same model as 15.3 (mount-as-trigger).

`useCoachMark` reads AsyncStorage in a `useEffect` on mount → `shouldShow` flips from `false` to `true` once the read resolves (microtask boundary). The overlay then renders on the next React commit. Visually: card paints first, then the overlay fades in (~280ms via the foundation's Reanimated entry — or instant if Reduce Motion is on).

### AsyncStorage key — single source of truth

The literal string is `"@outfinder/coachmark:visualizer-slots-firstuse"`. Already defined at `src/lib/coachMarkKeys.ts:8` as `COACH_MARK_KEYS.visualizerSlotsFirstUse`. The dev reset row at `Settings.tsx:446` iterates `ALL_COACH_MARK_KEYS` so this key is automatically cleared by the existing dev affordance.

DO NOT define this string anywhere else. DO NOT prefix it inside `useCoachMark` (the hook takes the FULL key — explicit > magic, per Story 15.1 AC #1 and the comment at `useCoachMark.ts:9–13`).

### Dependencies & ordering

- **Hard prerequisite**: Story 15.1 (CoachMarkOverlay + useCoachMark + COACH_MARK_KEYS). Already DONE (merged at `aac6c93`). 15.3 also DONE (merged at `c4a5c0f`) — its presence in the codebase confirms the pattern works on Reanimated + Pressable + permission-gated screens. Verify 15.1 foundation by `find src/components -name CoachMarkOverlay.tsx && find src/hooks -name useCoachMark.ts && find src/lib -name coachMarkKeys.ts && grep -n "visualizerSlotsFirstUse" src/lib/coachMarkKeys.ts` — all four checks should pass on the branch you start from.
- **Branch**: work off `epic-15` HEAD (currently `c4a5c0f` per memory and `git log`). Suggested feature branch: `story/15-4-visualizer-slot-discovery-onboarding`. Merge target: `epic-15`.
- **Does NOT depend on**: 15.6 (independent copy story, DONE), 15.3 (the camera FAB coach mark, DONE — they share only the foundation, no code coupling), 15.5 (Visualizer paper-cream background, parallel — see "Coordination with 15.5" below), 15.2 (Armario "En curso" flow, untouched here).
- **Does NOT block**: 15.5 / 15.2. They can proceed in parallel.

### Coordination with Story 15.5 (paper-cream Visualizer background)

Story 15.5 will change `OutfitVisualizer.tsx` line 209 from `backgroundColor: wadaTokens.warmBg` to `wadaTokens.bgPaper`, and tune `Aureola.tsx`. **15.4 must NOT touch line 209 or `Aureola.tsx`.** Whichever story merges first, the other rebases — both touch `OutfitVisualizer.tsx` but in different regions (15.4 inserts hook + handler + JSX block at lines 86, 184, 364; 15.5 mutates line 209 only). Conflict surface is small. Coordinate with the dev order in the plan (15.5 → 15.2 happens AFTER 15.4 per the epic table at `docs/planning/epic-15/epic-15.md:229–232`).

### Testing standards (recap)

- Co-locate `*.test.tsx` next to source — already done.
- Test interactions, not just rendering — AC #5 tests cover dismiss → AsyncStorage write + haptic + overlay leaves.
- Every AC describing user-observable behavior maps to a test case — AC #2 sub-bullets each map 1:1 to AC #5 (a)–(d), and the back-button defensive test covers (e).
- DO NOT mock `useCoachMark` or `CoachMarkOverlay` — that would let regressions where someone passes the wrong key, wrong text key, or omits the haptic call slip through. Use the real hook against the AsyncStorage mock that's wired in `jest.setup.js` and at lines 44–50 of `OutfitVisualizer.test.tsx`.
- DO NOT add a defensive test for "what if user double-taps dismiss?" — `markSeen` is idempotent (the hook calls `setShouldShow(false)` first; a second invocation just writes "true" again). That's hypothetical scenario gating per CLAUDE.md.
- Reanimated worklet values are not directly observable from `@testing-library/react-native` (the Reanimated test mock returns the initial shared value, not the live worklet value). The new test (f) for `OutfitCard.tsx` is therefore STRUCTURAL — it verifies the bar mounts for ALL slots regardless of `selectedSlotIndex`, not the exact opacity value. The on-device smoke step in Task 4 is the actual visual verification.

### Anti-patterns (explicit "do NOT")

- DO NOT inline the AsyncStorage key string `"@outfinder/coachmark:visualizer-slots-firstuse"` at the call site. Use `COACH_MARK_KEYS.visualizerSlotsFirstUse`. (Story 15.3 review enforced this rule via `[Review][Patch] COACH_KEY literal duplicates registry` — same patch must NOT be needed here.)
- DO NOT add `dismissLabel="..."` on the overlay JSX. The foundation defaults to `t("common.coachMark.gotIt")` — that's the contract.
- DO NOT introduce a 2nd Reduce Motion check, AsyncStorage read, or `announceForAccessibility` call here. The foundation owns all three. The OutfitCard's `useReducedMotion()` is for the PULSE specifically, not for the coach mark — they are independent concerns.
- DO NOT call `markSeen()` in any path other than `handleDismissCoachMark`. The user must explicitly tap "Entendido" to acknowledge — no auto-dismiss on slot tap, no auto-dismiss on back press (the back button on the screen exits the Visualizer; AsyncStorage state persists on next mount, so they'll see it again — that's correct, the user did NOT acknowledge).
- DO NOT add analytics / telemetry to the dismiss path. Memory `feedback_no_analytics.md`: Outfinder is craft-driven, not data-driven.
- DO NOT add a `delay` / `setTimeout` before showing the overlay. The hook's `useEffect` microtask boundary already provides the right cadence (card paints first, overlay fades in next commit). Adding artificial delay = jitter.
- DO NOT add an interstitial / full-screen blocking variant. DEC-3 (which formally applies to C1) and DEC-4 (which applies here) both anchor on coach mark over interstitial.
- DO NOT add a `__DEV__` reset affordance here. Story 15.1 already shipped one in Settings (`dev-reset-coach-marks-row` at `Settings.tsx:446`) that clears ALL coach mark keys via `ALL_COACH_MARK_KEYS`. Adding a screen-local one would duplicate.
- DO NOT migrate the legacy `@outfinder/visualizer-introduced` key. That key was retired NOT migrated in Story 15.1 (DEC-6: "Onboarding antiguo del Visualizer SE BORRA. No se preserva."). Returning users see the new coach mark on next entry — that is the intended behavior.
- DO NOT alter `Aureola.tsx`, line 209's `backgroundColor`, or `<MiniPaletteStrip>` / `<WadaHeader>` / `<TintedGarment>`. Those are 15.5 territory or pre-existing.
- DO NOT change the `<Animated.View testID="underline-bar" …>` geometry, color, or testID — only the opacity driver.
- DO NOT add a try/catch around the pulse `withRepeat` call — Reanimated worklets handle errors via the runtime; an explicit catch is dead code.
- DO NOT delete the `else { underlineOpacity.value = withTiming(0, …) }` clause AND keep `isSelected` as a `useEffect` dependency — drop the dependency only after the body no longer reads it. Otherwise lint will flag the unused dep. (`isSelected` is still read in the new body to compute `baseline`/`peak` ranges, so it stays in the dep array.)

### Previous story intelligence — Story 15.3 (the wiring template; merged at `c4a5c0f`)

- Story 15.3 shipped the EXACT same shape (3 imports + 1 hook call + 1 handler + 1 JSX block) into `UnifiedCameraCaptureScreen.tsx` for `COACH_MARK_KEYS.cameraFabFirstUse`. Read `_bmad-output/implementation-artifacts/15-3-camera-fab-firstuse-coach-mark.md` lines 13–32 for the contract pattern; lines 220–227 for the dev's completion notes (test pollution lesson with `jest.spyOn().mockRestore()` — DO NOT repeat that).
- 15.3 review noted 4 deferred non-blocking items (D-15.3-1 through D-15.3-5 — see lines 246–250 of the 15.3 file). Of these, D-15.3-3 (CoachMark + processing z-order) and D-15.3-4 (VoiceOver re-announce on visibility flip) are foundation-level cosmetic issues from 15.1; 15.4 INHERITS them. 15.4 does not need to fix them. The wiring pattern itself is approved and battle-tested.
- 15.3 confirmed CI baseline on `epic-15` HEAD: `pnpm lint` = 2 pre-existing errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx` Biome format), `npx tsc --noEmit` = 0 errors (Story 15.1 cleaned the original 2 errors that the spec referenced; current baseline IS 0), `pnpm test` = 958 passing / 3 pre-existing failing / 961 total (after 15.3's +4 net). 15.4 baseline before starting will be the same set.
- 15.3 dev's discipline: `find` to verify foundation files, `git grep` to validate cleanup, `pnpm lint && npx tsc --noEmit && pnpm test` for the gates, then story-spec AC point-by-point, then on-device smoke. Mirror this discipline in 15.4.
- 15.3 review enforced: tests must NOT mock `useCoachMark`; the registry literal must NOT be duplicated; deferred items are spec-scoped and may be left for follow-up. Same rules apply to 15.4 review.

### Visualizer-specific test setup (reuse, don't reinvent)

`OutfitVisualizer.test.tsx` already wires:
- `mockGetItem` / `mockSetItem` for AsyncStorage at lines 44–50 (the hook's read path lands on `mockGetItem`; the dismiss-write lands on `mockSetItem`).
- Default `mockGetItem.mockResolvedValue("true")` at line 86 — sets "already introduced" so existing 49 tests don't trip the coach mark. KEEP this default. The new tests for AC #5 will OVERRIDE per-test.
- `mockHapticLight` at line 37 — reuse for AC #5 (b) assertion.
- `mockAnnounce` at line 53 — `AccessibilityInfo.announceForAccessibility` mock; useful only if you want to assert the VoiceOver announcement fires when the overlay enters (the foundation calls it inside `CoachMarkOverlay`'s `useEffect`). Optional assertion — not required by AC #5 since the foundation already has its own tests for this.
- `mockGetCombination` at line 31 — feed `undefined` to test (d) for the not-found branch.

The existing `beforeEach` at lines 76–88 already resets all mocks. KEEP all 49 existing tests untouched (no `await AsyncStorage.clear()` insertion needed — the file's manual mock pattern resets per-test via `mockGetItem.mockReset()` on line 83).

### Structural test note for OutfitCard pulse (AC #5 (f))

`@testing-library/react-native` does not run Reanimated worklets in the JS test process — `useSharedValue` returns a stable initial value, `withRepeat` is a no-op in tests. Therefore you CANNOT reliably assert the live opacity of the underline bar in a test. AC #5 (f) is a STRUCTURAL test only:
- Mount with `selectedSlotIndex={null}` → all underline bars exist (length === N)
- Re-render with `selectedSlotIndex={0}` → all underline bars still exist (length === N — none unmounted)
- The actual pulse animation is verified by the on-device smoke in Task 4.

Do NOT spend time trying to hook into Reanimated's runtime to read the live `opacity.value`; that's brittle and out-of-scope per `feedback_no_patches.md`.

### Out of scope for this story

- The camera FAB first-use coach mark (FR6 + FR7, C1) — DONE in Story 15.3 (`c4a5c0f`). Do NOT touch `UnifiedCameraCaptureScreen.tsx` or `unifiedCamera.coachMark.*` i18n keys.
- Visualizer background paper-cream change (FR10 + FR11, A1) — that's Story 15.5. Do NOT touch line 209 of `OutfitVisualizer.tsx` or `Aureola.tsx`. If 15.5 lands first, rebase; the conflict surface is one line.
- Armario "En curso" CategoryPicker flow (FR3–FR5, B1) — that's Story 15.2. Do NOT touch `ArmarioPickerScreen.tsx` / `ArmarioPreviewScreen.tsx` / `CategoryPickerSheet.tsx`.
- Copy changes (FR12 + FR13, D1+D2) — already DONE in Story 15.6 (`a81c324`). Do NOT re-touch `home.subtitle` or `favorites.newLookCta.title`.
- Marketing screenshots regeneration — parallel track per epic doc, not a code story.
- Reworking `OutfitCard.tsx`'s swap selection visual cue beyond the pulse range adjustment — keep the existing `accessibilityState.selected`, the existing `<Animated.View testID="underline-bar">` structure, the existing `onSlotTap` / `onVariantCycle` props. Anything else is scope creep.

### Project Structure Notes

- Touched files all live under `src/screens/`, `src/components/`, and `src/i18n/locales/` — no new directories. No new files. No new packages (`react-i18next`, `@react-native-async-storage/async-storage`, `react-native-reanimated`, `lib/haptics`, `useReducedMotion` all already present and used in this story's target files).
- `visualizer.coachMark` placement in i18n: append to the END of the `visualizer` object (line 41 close), since the existing keys are flow-ordered (nav → notFound → screen → buttons → a11y), not alphabetical. Both locale files mirror the same order.

### References

- Epic spec — Story 15.4 scope: [Source: docs/planning/epic-15/epic-15.md#story-154--a2-visualizer-slot-discovery-onboarding-coach-mark--permanent-pulse] (lines 159–178).
- Epic spec — DEC-4 ("A2 doble affordance — coach mark first-use + underline pulse permanente"): [Source: docs/planning/epic-15/epic-15.md#️-decisiones-cerradas-pm-session-2026-04-26] (line 36).
- Epic spec — DEC-5 ("Sistema de coach marks reutilizable"): [Source: docs/planning/epic-15/epic-15.md#️-decisiones-cerradas-pm-session-2026-04-26] (line 37).
- Epic spec — DEC-6 ("Onboarding antiguo del Visualizer SE BORRA"): [Source: docs/planning/epic-15/epic-15.md#️-decisiones-cerradas-pm-session-2026-04-26] (line 38).
- Epic spec — FR8 + FR9 (Visualizer onboarding requirements): [Source: docs/planning/epic-15/epic-15.md#functional-requirements] (lines 59–62).
- Epic spec — NFR2 (ES + EN coverage), NFR6 (Reduce Motion), NFR7 (`@outfinder/coachmark:*` namespace): [Source: docs/planning/epic-15/epic-15.md#non-functional-requirements] (lines 73–79).
- Foundation — `CoachMarkOverlay`: [Source: src/components/CoachMarkOverlay.tsx#L1-L137].
- Foundation — `useCoachMark`: [Source: src/hooks/useCoachMark.ts#L1-L48].
- Foundation — `COACH_MARK_KEYS` registry: [Source: src/lib/coachMarkKeys.ts#L6-L11] (entry `visualizerSlotsFirstUse` at line 8).
- Shared dismiss label: [Source: src/i18n/locales/es.json#L197-L199] + [Source: src/i18n/locales/en.json#L197-L199] (`common.coachMark.gotIt`).
- Target screen — `OutfitVisualizer`: [Source: src/screens/OutfitVisualizer.tsx#L58-L367] (58 = function start, 86 = `useOutfitState` hook anchor, 95 = `handleMakeMine`, 183 = `handleNextGarment` close, 186 = `useStoreReviewPrompt` hook, 188 = `if (!combination)` early return, 207 = root View open, 364 = bottom CTA View close, 366 = root View close).
- Target component — `OutfitCard > CardSlot`: [Source: src/components/OutfitCard.tsx#L43-L193] (43 = CardSlot signature, 57 = `useReducedMotion`, 59 = `underlineOpacity`, 63–81 = pulse `useEffect` to refactor, 173–186 = underline-bar JSX).
- Target test files: [Source: src/screens/OutfitVisualizer.test.tsx#L1-L1015] (76–88 = `beforeEach`, 86 = `mockGetItem.mockResolvedValue("true")` default, 926 = top-level describe close, 930 = iPad describe — insert new `describe("Slot-discovery coach mark (Story 15.4)", …)` between them) + [Source: src/components/OutfitCard.test.tsx#L1-L389] (349 = "non-selected slots have underline bar at opacity 0" test to rename).
- Existing `visualizer.*` i18n surface: [Source: src/i18n/locales/es.json#L30-L42] + [Source: src/i18n/locales/en.json#L30-L42] (insertion point for `coachMark` sub-object at line 41 close).
- Story 15.1 record (foundation contract + dev reset row + baseline numbers): [Source: _bmad-output/implementation-artifacts/15-1-coach-mark-foundation-and-legacy-removal.md].
- Story 15.3 record (wiring template + 4 deferred items + test-pollution lesson): [Source: _bmad-output/implementation-artifacts/15-3-camera-fab-firstuse-coach-mark.md].
- Settings dev reset row: [Source: src/screens/Settings.tsx#L446-L460] (`dev-reset-coach-marks-row` clears `ALL_COACH_MARK_KEYS` — already covers 15.4's key automatically).
- `useReducedMotion` hook: [Source: src/hooks/useReducedMotion.ts#L1-L17].
- Project rules: [Source: CLAUDE.md#agent-rules-from-5-pwa-retrospectives] — Story Scope (≤4 tasks ✅), AC verification, Accessibility First, Testing Discipline, RN Specifics, Rules of Hooks, Mandatory Code Review.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Opus 4.7, 1M context) via bmad-dev-story

### Debug Log References

- Pre-baseline (branch `story/15-4-visualizer-slot-discovery-onboarding` off `epic-15` HEAD `c4a5c0f`): `pnpm lint` → 2 errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx` Biome format, both pre-existing/out-of-scope per `feedback_no_patches.md`). `npx tsc --noEmit` → 0 errors. `pnpm test` → 958/3/961 (3 pre-existing failures in `src/i18n/__tests__/i18n.test.ts:131-134` mockLocale("es-ES") returning "en" — pre-existing, same set 15.3 retro confirmed). Skips: 0.
- Post-implementation: `pnpm lint` → 2 errors UNCHANGED (after one transient organizeImports issue fixed by alphabetizing the new `COACH_MARK_KEYS` import before `relativeLuminance`). `npx tsc --noEmit` → 0 errors. `pnpm test` → 964/3/967 (+6 net: 5 new in OutfitVisualizer.test.tsx + 1 new in OutfitCard.test.tsx). Skips: 0 UNCHANGED.
- Targeted run `OutfitVisualizer.test.tsx` → 53/53 ✓ (all 5 new tests + 48 pre-existing pass). `OutfitCard.test.tsx` → 18/18 ✓ (renamed test still passes; new structural test passes).
- Foundation files verified pre-implementation: `src/components/CoachMarkOverlay.tsx`, `src/hooks/useCoachMark.ts`, `src/lib/coachMarkKeys.ts` (entry `visualizerSlotsFirstUse` at line 8) all present.

### Completion Notes List

- **Foundation reuse, not reinvention** — wired `CoachMarkOverlay` + `useCoachMark` + `COACH_MARK_KEYS.visualizerSlotsFirstUse` into `OutfitVisualizer.tsx` via 3 new imports + 1 hook call + 1 handler + 1 JSX block. ZERO new files, packages, or native changes (matches Story 15.3 contract).
- **Hook ordering** — placed `useCoachMark()` immediately after `useStoreReviewPrompt()` (both before the `if (!combination)` early return — Rules of Hooks satisfied). Placed `handleDismissCoachMark` AFTER the hook (rather than before `useStoreReviewPrompt()` as the spec literally instructed) to avoid a forward reference to the const `markCoachMarkSeen`. The runtime contract is identical (function declaration is hoisted; the body resolves the closure on user-tap, by which point both hooks have run). This matches the proven 15.3 source order.
- **No try/catch on `handleDismissCoachMark`** — `lib/haptics` already swallows native errors and `markSeen` already swallows AsyncStorage errors (see `useCoachMark.ts:42-44`). Double-wrapping would violate `feedback_no_patches.md`.
- **Visibility gating** — only `shouldShowCoachMark`. The not-found branch is handled STRUCTURALLY by the early return at line 188; the overlay is rendered below it, so it cannot paint over the "Combination not found" view (no defensive `&& combination !== undefined` needed — verified by AC #5 test (d) which renders the not-found combination with cleared flag and asserts no overlay).
- **Permanent pulse** — refactored `OutfitCard.tsx > CardSlot` `useEffect` (lines 63–81) to drop the `isSelected` short-circuit. New ranges: non-selected `0.3 ↔ 0.7` (subtle "I'm tap-able"), selected `0.5 ↔ 1.0` (brighter "I'm armed for swap"). Reduce Motion freezes at midpoint (`(baseline+peak)/2` = `0.5` non-selected / `0.75` selected). The deleted `else { underlineOpacity.value = withTiming(0, ...) }` clause means there is no longer a "fade out" path. `<Animated.View testID="underline-bar" …>` geometry, color, and testID untouched.
- **i18n** — added `visualizer.coachMark.{text, a11yAnnouncement}` to both `es.json` and `en.json`, appended at the END of the `visualizer` object (matches the existing flow-ordered convention). NO `dismissLabel` key — foundation reuses `common.coachMark.gotIt` (Story 15.1 shared key). `git grep '"coachMark"' src/i18n/locales/{es,en}.json` returns exactly 3 each (common + unifiedCamera + visualizer).
- **Test mocks** — reused existing `mockGetItem` / `mockSetItem` / `mockHapticLight` patterns from `OutfitVisualizer.test.tsx`. The new `describe("Slot-discovery coach mark (Story 15.4)", …)` block has its own `beforeEach` that overrides `mockGetItem.mockResolvedValue(null)` per-test to exercise the first-mount path; the original top-level `beforeEach` keeps the "already introduced" default for the existing 49 tests (untouched). DID NOT mock `useCoachMark` directly — real hook runs against the AsyncStorage mock so a regression with the wrong key string would fail loudly (rule enforced by 15.3 review).
- **Lint diff scope** — Biome flagged a NEW organizeImports error after my edit (the new `coachMarkKeys` import sorted after `color` alphabetically — Biome wanted the reverse). Fixed by swapping the two import lines. The 2 pre-existing baseline format errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`'s `handleMakeMine` block) were NOT touched — diff stays scoped per `feedback_no_patches.md`.
- ✅ **AC verification (point-by-point):**
  - **AC #1** — 3 imports added (`CoachMarkOverlay`, `useCoachMark`, `COACH_MARK_KEYS`); 1 hook call `useCoachMark(COACH_MARK_KEYS.visualizerSlotsFirstUse)` after `useStoreReviewPrompt()` and before the early return; 1 `async function handleDismissCoachMark` (2-line body, no try/catch); 1 `<CoachMarkOverlay …/>` rendered as last child of the root View with the exact prop set specified.
  - **AC #2** — 5 behavioral guarantees verified by tests (a)–(e). Optimistic `setShouldShow(false)` in `useCoachMark` keeps the next press unblocked.
  - **AC #3** — pulse range refactor exactly per spec; Reduce Motion freezes at midpoint; underline-bar testID/geometry/color preserved.
  - **AC #4** — `visualizer.coachMark` sub-object appended at end of `visualizer` namespace in both locales; JSON parses; grep count = 3 in each locale.
  - **AC #5** — lint count UNCHANGED, tsc UNCHANGED at 0, test +6 net, skips UNCHANGED at 0; 5 new visualizer cases + 1 new OutfitCard structural test; the renamed "non-selected slots have underline bar permanently visible (post-15.4)" preserves the original assertion shape.

### File List

- MOD `src/screens/OutfitVisualizer.tsx` — added 3 imports (`CoachMarkOverlay`, `useCoachMark`, `COACH_MARK_KEYS`), 1 hook call after `useStoreReviewPrompt()`, 1 `async function handleDismissCoachMark`, 1 `<CoachMarkOverlay/>` JSX block as last child of root View.
- MOD `src/components/OutfitCard.tsx` — refactored pulse `useEffect` in `CardSlot` to drop `isSelected` short-circuit; new ranges 0.3↔0.7 / 0.5↔1.0; Reduce Motion midpoint freeze.
- MOD `src/i18n/locales/es.json` — appended `visualizer.coachMark.{text, a11yAnnouncement}`.
- MOD `src/i18n/locales/en.json` — mirror of es.json.
- MOD `src/screens/OutfitVisualizer.test.tsx` — new nested `describe("Slot-discovery coach mark (Story 15.4)", …)` with 5 cases (a)–(e).
- MOD `src/components/OutfitCard.test.tsx` — renamed 1 test description; added 1 new structural test for AC #5 (f).
- MOD `_bmad-output/implementation-artifacts/sprint-status.yaml` — `15-4-visualizer-slot-discovery-onboarding` ready-for-dev → in-progress → review; `last_updated` rewritten.
- MOD `_bmad-output/implementation-artifacts/15-4-visualizer-slot-discovery-onboarding.md` — Status backlog→ready-for-dev→in-progress→review; tasks marked complete; Dev Agent Record filled.

### Change Log

- 2026-04-27 — Story 15.4 implemented end-to-end on `story/15-4-visualizer-slot-discovery-onboarding` off `epic-15` HEAD `c4a5c0f`. Foundation reuse: 3 imports + 1 hook + 1 handler + 1 JSX in `OutfitVisualizer.tsx`. Permanent underline pulse refactor in `OutfitCard.tsx` (drop `isSelected` gate). i18n keys `visualizer.coachMark.{text, a11yAnnouncement}` added to es+en. 6 new tests (5 visualizer + 1 OutfitCard structural). CI: lint 2 UNCHANGED, tsc 0 UNCHANGED, test 964/3/967 (+6 net), skips 0 UNCHANGED. Pending: visual smoke (Alejandro) + adversarial code review before merge to `epic-15`.
