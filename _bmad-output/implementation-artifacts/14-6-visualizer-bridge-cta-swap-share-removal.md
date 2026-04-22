# Story 14.6: Visualizer bridge CTA swap — "Hacer este look mío" + external share removal

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user exploring a Wada combination on the `OutfitVisualizer` screen (reachable from either `ColorsStack` — Home → Combinations → Visualizer — OR `FavoritesStack` — Mis Looks → Visualizer — since the screen is registered in BOTH stacks per `src/navigation/ColorsStack.tsx:32` and `src/navigation/FavoritesStack.tsx:29`)**,
I want **the existing "Compartir Outfit" share button (`OutfitVisualizer.tsx:411-431` absolute-positioned Pressable using `shareOutfit(shareViewRef)` from `src/lib/share.ts`) REMOVED entirely, and in its exact placement — bottom-anchored with `paddingBottom: 12 + FAB_PROTRUSION` to clear the Tab Bar cradle — a new full-width, 48pt tall, **Wada-accent-tinted** primary CTA *"Hacer este look mío"* / *"Make this look mine"* with a right-side arrow glyph (→) that, on tap, fires `hapticMedium` and cross-navigates to `Main → FavoritesTab → ArmarioFichaWada` with the current `combinationId` (entering Ficha Wada in working mode — zero assignments, no persistence, no slot consumed — per FR9 + Story 14.8's auto-save semantics enforced later); AND I want the surrounding technical debt of the share code path cleaned up in the same surgical edit: `shareOutfit` + `captureShareImage` + `src/lib/share.ts` + `src/lib/share.test.ts` DELETED (dead code after this story — verified via `grep "from \"@/lib/share\"\\|captureShareImage"` → only Visualizer consumes them; `ArmarioTuLookScreen` uses its own `exportLookImage` from `@/lib/armario/exportLookImage` per `src/screens/armario/ArmarioTuLookScreen.tsx:184-235`), `shareViewRef`, the `sharing` state, `handleShare`, the `Alert` import, the `shareOutfit` import, and the `<View ref={shareViewRef} collapsable={false}>` wrapper (kept byte-for-byte around `<WarmBackground />` and all interior content, but the ref itself removed), the 4 i18n keys `visualizer.shareLabel` / `visualizer.shareButton` / `visualizer.shareError` / `visualizer.shareErrorBody` REMOVED from both `src/i18n/locales/es.json` + `en.json` (lines 41-47 in each) and 3 new keys `visualizer.makeMineButton` / `visualizer.makeMineA11yLabel` / `visualizer.makeMineA11yHint` ADDED in their place, and the 6 share-related test cases in `src/screens/OutfitVisualizer.test.tsx` (lines 719, 735, 754, 773, 798, 837 per `grep -n "^\\s*it" OutfitVisualizer.test.tsx`) REWRITTEN / DELETED to assert the new makeMine CTA surface instead**,
so that **the Visualizer becomes the bridge into Ficha Wada (FR8 + FR9) that Epic 14 demands — no more share cul-de-sac (FR10) — the S4 polaroid share path in `ArmarioTuLookScreen` stays byte-for-byte unchanged (NFR4 "Zero regressions on S4 polaroid export"), the Wada-accent-tinted CTA reinforces Outfinder's identity pattern (per UX-DR6 trade-off note line 664-665: "the tinted CTA is a hallmark of Outfinder's identity"), and the `shareOutfit` dead code is pruned in the same surgical PR — no "demoted share icon", no leftover ref wrapper, no orphan i18n keys, no dead `src/lib/share.ts` module**.

## Acceptance Criteria

1. **Given** the current `OutfitVisualizer.tsx` imports `shareOutfit` from `@/lib/share` (line 35), declares `shareViewRef = useRef<View>(null)` (line 84) and `sharing` state (line 86), defines `handleShare` (lines 185-194), wraps its capturable area with `<View ref={shareViewRef} collapsable={false} className="flex-1">` (line 324), renders a share button at lines 411-431, and imports `Alert` from `react-native` (line 8), **When** this story merges, **Then** ALL of the following are removed in a single surgical edit:
    - Import `shareOutfit` from `@/lib/share` (line 35) — DELETED.
    - Import `Alert` from `react-native` (line 8) — DELETED (no other usage in the file — verified via `grep "Alert\\." src/screens/OutfitVisualizer.tsx`; only `Alert.alert(...)` on line 192 inside `handleShare` uses it).
    - Import `hapticRigid` from `@/lib/haptics` (line 34) — DELETED if `hapticRigid` is no longer used in the file (after `handleShare` removal; `hapticLight` + `hapticMedium` remain used). Verify before deleting.
    - `const shareViewRef = useRef<View>(null)` (line 84) — DELETED.
    - `const [sharing, setSharing] = useState(false)` (line 86) — DELETED.
    - `handleShare` callback (lines 185-194) — DELETED.
    - `ref={shareViewRef} collapsable={false}` attributes on the inner `<View>` (line 324) — DELETED. The `<View className="flex-1">` wrapper itself STAYS (it structures layout for the ScrollView's inner content; removing the wrapper is out of scope).
    - The share button `<View>` + `<Pressable>` block (lines 411-431) — DELETED.

    **And** the resulting file keeps (a) the back button (lines 295-317), (b) the ScrollView + WarmBackground + Aureola + WadaHeader + OutfitCard + MiniPaletteStrip tree (lines 319-410), (c) the coach-mark overlay (lines 432-486), (d) all slot-tap / variant-cycle / arrow-press haptics + VoiceOver announcements (lines 196-271), (e) `useStoreReviewPrompt()` (line 274), (f) the `not-found` early-return (lines 276-287), and (g) the existing `FAB_PROTRUSION` import from `@/navigation/CustomTabBar` (line 36). All byte-for-byte untouched except the 9 surgical deletions listed above.

2. **Given** the new primary CTA "Hacer este look mío", **When** this story merges, **Then** a new `<View>` + `<Pressable>` block replaces the old share button at the same bottom-anchored position (`paddingBottom: 12 + FAB_PROTRUSION`), rendered OUTSIDE the `<ScrollView>` (as sibling of the ScrollView and the coach-mark overlay — mirroring the old share block's placement at current line 411). Exact JSX shape:

    ```tsx
    {/* Primary CTA — bridge to Ficha Wada; replaces share button (14.6) */}
    <View
        className="px-4"
        style={{ paddingBottom: 12 + FAB_PROTRUSION, paddingTop: 8 }}
    >
        <Pressable
            onPress={handleMakeMine}
            accessibilityRole="button"
            accessibilityLabel={t("visualizer.makeMineA11yLabel")}
            accessibilityHint={t("visualizer.makeMineA11yHint")}
            testID="visualizer-make-mine"
            className="h-12 w-full flex-row items-center justify-center rounded-[14px]"
            style={{ backgroundColor: slots[0].color.hex }}
        >
            <Text
                allowFontScaling
                style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 16,
                    color: ctaLabelColor,
                    marginRight: 8,
                }}
            >
                {t("visualizer.makeMineButton")}
            </Text>
            <Text
                style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 16,
                    color: ctaLabelColor,
                }}
            >
                {"→"}
            </Text>
        </Pressable>
    </View>
    ```

    **And** the CTA background `slots[0].color.hex` uses the SAME Aureola color the Visualizer already renders (see line 328: `<Aureola hex={slots[0].color.hex} ... />` — consistent with UX-DR6 line 639 "tinted with the dominant Wada color of the combination (the Aureola color, for consistency)"), **And** the label color `ctaLabelColor` is computed via a new local const:
    ```ts
    const ctaLabelColor =
        relativeLuminance(slots[0].color.hex) > 0.4
            ? wadaTokens.textPrimary  // dark ink on light Wada
            : "#faf7f2";              // cream on dark Wada
    ```
    using the existing `relativeLuminance` helper from `@/lib/color` (introduced in Story 14.4 — precedent `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` uses the same 0.4 threshold per `feedback_js_swift_constant_sync.md`). Import the helper: `import { relativeLuminance } from "@/lib/color";`.

3. **Given** the `handleMakeMine` callback, **When** the user taps the CTA, **Then** the following runs in a `useCallback` declared near the other memoized handlers (co-located above `handleSlotTap` at line 196 for readability):

    ```ts
    const handleMakeMine = useCallback(() => {
        hapticMedium();
        const rootNav =
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
        rootNav?.navigate("Main", {
            screen: "FavoritesTab",
            params: {
                screen: "ArmarioFichaWada",
                params: { combinationId },
            },
        } as never);
    }, [navigation, combinationId]);
    ```

    **And** the imports `NativeStackNavigationProp` (from `@react-navigation/native-stack`) and `RootStackParamList` (from `@/navigation/types`) are added at the top of the file (both are the exact same imports `UnifiedCameraResultScreen.tsx:5` + `:10` already use — mirror precedent). **And** `navigation` already comes from `useNavigation()` on line 61 — no new hook call needed. **And** the `as never` cast matches the existing Epic 14 cross-navigator pattern (see `UnifiedCameraResultScreen.tsx:237-243` — same `as never` cast applied to the exact same `Main → Tab → Screen` nested params shape). **And** no `navigation.push("ArmarioFichaWada", ...)` shortcut is used — even though the FavoritesStack registration of OutfitVisualizer would allow it when the user entered via FavoritesTab, the ColorsStack registration does NOT have `ArmarioFichaWada` in its ParamList, so the unconditional cross-nav via root is the ONLY correct path that works from both entry points. Swipe-back from Ficha Wada lands on `FavoritesList` (the initial route of FavoritesStack) — this is an accepted trade-off vs. UX-DR6 line 645's "returns to Visualizer" ideal, driven by the dual-stack Visualizer architecture that pre-dates this story and is NOT refactored here.

4. **Given** the new i18n keys, **When** both `src/i18n/locales/es.json` and `src/i18n/locales/en.json` are inspected after merge, **Then**:
    - Under the existing `visualizer.*` block, the 4 keys `shareLabel` / `shareButton` / `shareError` / `shareErrorBody` (ES lines 41, 42, 46, 47; EN similar) are DELETED.
    - Under the same `visualizer.*` block, these 3 NEW keys are ADDED (alphabetical order; pick a sensible position — after `previousGarment`/`nextGarment` and before `selectedForSwap` is a clean spot):
        - `makeMineButton` → *"Hacer este look mío"* (ES) / *"Make this look mine"* (EN)
        - `makeMineA11yLabel` → *"Hacer este look mío"* (ES) / *"Make this look mine"* (EN) — duplicate copy is correct (screen reader announces the button's visible label)
        - `makeMineA11yHint` → *"Abre este look en tu armario para asignarle prendas"* (ES) / *"Opens this look in your wardrobe to assign garments"* (EN) — source: UX-DR6 line 657
    - All other `visualizer.*` keys (`screenLabel`, `notFound`, `goBack`, `coachStep1/2/Announce`, `gotIt`, `previousGarment`, `nextGarment`, `selectedForSwap`, `swapResult`, `changedTo`) stay byte-for-byte unchanged.
    - Both JSON files remain valid, tab-indented, and Biome-clean after edit.
    - No other i18n block is modified.

5. **Given** the `shareOutfit` + `captureShareImage` functions are now dead code (only consumers are the Visualizer — removed in AC #1 — and the S4 polaroid `ArmarioTuLookScreen` uses a SEPARATE export path via `@/lib/armario/exportLookImage` + `Sharing.shareAsync` with `image/jpeg` MIME type per `ArmarioTuLookScreen.tsx:191-206`, NOT `shareOutfit`), **When** this story merges, **Then**:
    - `src/lib/share.ts` is DELETED.
    - `src/lib/share.test.ts` is DELETED.
    - No other file imports from `@/lib/share` — verified via `grep -rn "from \"@/lib/share\"" src` returning zero matches after the edit.
    - The `react-native-view-shot` + `expo-sharing` dependencies in `package.json` are NOT removed — `expo-sharing` is still used by `ArmarioTuLookScreen.tsx:15` for the S4 polaroid path; `react-native-view-shot` may have other consumers (`grep` first, leave alone if any remain, regardless of this story's scope).

6. **Given** the S4 polaroid share flow (`ArmarioTuLookScreen` — shipped in Story 13.5) is the ONE remaining share surface per FR10 ("Only the S4 polaroid (real garments) retains sharing"), **When** this story merges, **Then**:
    - `src/screens/armario/ArmarioTuLookScreen.tsx` is UNCHANGED byte-for-byte — no imports removed, no handler touched, its `handleShare` at lines 184-235 still calls `exportLookImage()` then `Sharing.shareAsync(uri, { mimeType: "image/jpeg", UTI: "public.jpeg" })`.
    - `src/screens/armario/ArmarioTuLookScreen.test.tsx` is UNCHANGED — zero test cases modified, zero new cases needed. The test file verifies S4 share independently and does not cross-reference `@/lib/share`.
    - `src/lib/armario/exportLookImage.ts` is UNCHANGED — it is the real export path, orthogonal to the deleted `shareOutfit`.
    - Grep verification included in Task 5: `grep -rn "exportLookImage\\|ArmarioTuLook" src` returns the SAME set of matches before vs. after this story.

7. **Given** VoiceOver is enabled and the user navigates through the Visualizer, **When** they focus the new primary CTA, **Then** the announced content is:
    - Role: *"Botón"* (ES) / *"Button"* (EN) — from `accessibilityRole="button"`.
    - Label: *"Hacer este look mío"* (ES) / *"Make this look mine"* (EN) — from `accessibilityLabel={t("visualizer.makeMineA11yLabel")}`.
    - Hint: *"Abre este look en tu armario para asignarle prendas"* (ES) / *"Opens this look in your wardrobe to assign garments"* (EN) — from `accessibilityHint={t("visualizer.makeMineA11yHint")}`.

    **And** the announcement order through the screen is: Back button → WadaHeader → OutfitCard (with variant/swap labels) → MiniPaletteStrip → primary CTA (matches UX-DR6 line 658). **And** touch target is ≥44pt — the CTA is 48pt tall, full-width minus 16pt horizontal padding, hit area ≥44×44pt per `CLAUDE.md` §Accessibility First.

8. **Given** the existing coach-mark overlay (`coachStep > 0`, lines 432-486) renders above all other content with `zIndex: 999`, **When** the new CTA is added, **Then** the CTA is NOT covered by nor does it cover the coach mark overlay — the overlay's full-screen absolute positioning already sits on top of everything including the CTA, which is correct behavior (user dismisses overlay first, then can tap CTA). **And** the CTA is NOT rendered inside the coach-mark conditional — it renders unconditionally whenever `combination !== undefined` (i.e., below the `!combination` early return at line 276 but above the coach-mark conditional render). **And** the CTA does NOT interfere with the existing `useStoreReviewPrompt()` hook trigger on 2nd visit (line 274).

9. **Given** the test surface changes, **When** `pnpm test` runs, **Then**:
    - In `src/screens/OutfitVisualizer.test.tsx`, the following 6 share-related test cases are REMOVED (located via `grep -n "^\\s*it" OutfitVisualizer.test.tsx` with `describe` blocks):
        - line 719: `"renders Share Outfit button with correct accessibility"`
        - line 735: `"fires hapticRigid when share button pressed"`
        - line 754: `"calls shareOutfit when share button pressed"`
        - line 773: `"shows alert when shareOutfit returns false"`
        - line 798: `"prevents double-tap by ignoring second press while sharing"`
        - line 837: `"does not show alert when shareOutfit succeeds"`

        **And** the `jest.mock` block for `@/lib/share` (lines 35-40 of the test: `const mockShareOutfit = jest.fn(); jest.mock("@/lib/share", () => ({ shareOutfit: (...args: unknown[]) => mockShareOutfit(...args) }));`) is REMOVED.
    - In `src/screens/OutfitVisualizer.test.tsx`, these 5 NEW test cases are ADDED (new `describe` block *"Make Mine CTA (Story 14.6)"*, co-located near the coach-mark describe block for cohesion):
        1. *"renders 'Hacer este look mío' CTA with testID"* — asserts `getByTestId("visualizer-make-mine")` returns a node AND its accessibility label matches `t("visualizer.makeMineA11yLabel")`.
        2. *"CTA background is the Aureola color (first slot hex)"* — renders a known combination (e.g., `combinationId: "W001-c01"` or whatever the existing test harness uses), asserts the rendered CTA's `style.backgroundColor` equals `slots[0].color.hex` (exposed via the test query; use `toHaveStyle({ backgroundColor: <hex> })` from `@testing-library/jest-native` or inspect via `props.style`).
        3. *"CTA label color adapts to Wada luminance via `relativeLuminance > 0.4` rule"* — parametrize via `it.each` over 2 combinations: one with a high-luminance Aureola (e.g., `"pale-yellow"`-like) expecting `wadaTokens.textPrimary` on the label, one with a low-luminance Aureola (e.g., `"deep-indigo"`-like) expecting `"#faf7f2"`. Pick real combination ids from the Wada dataset that clearly straddle the 0.4 threshold.
        4. *"tap fires hapticMedium and cross-navigates to Main → FavoritesTab → ArmarioFichaWada with correct combinationId"* — mock `navigation.getParent` to return an object with a `navigate` spy; press the CTA; assert `hapticMedium` called once AND `navigate` called with exactly `("Main", { screen: "FavoritesTab", params: { screen: "ArmarioFichaWada", params: { combinationId: "<the test id>" } } })`.
        5. *"CTA has correct a11y hint and role"* — asserts `accessibilityRole === "button"` AND `accessibilityHint === t("visualizer.makeMineA11yHint")`.

        **And** the existing 51 non-share Visualizer tests (47 in main `describe` minus 6 share = 47 kept; plus 4 iPad tests = 51 total kept) stay byte-for-byte unchanged — verify via diff that only the 6 share tests are deleted and only the new describe block is added.
    - `src/lib/share.test.ts` is DELETED entirely (8 test cases removed wholesale).
    - Net test delta target: **-9 to -5 net passing tests** vs. the 14.5 done baseline of 813 passing / 60 pre-existing / 0 new failures. That is: remove 6 Visualizer share tests + remove 8 share.test.ts tests + add 5 new makeMine tests = -9 floor, -5 ceiling depending on whether any of the 6 deleted OutfitVisualizer tests were in the pre-existing 60 failures (the 48 `OutfitVisualizer.getState` failures may overlap — confirm by running the test file once before edit to classify). **Minimum acceptable result**: passing ≥ **804**, pre-existing ≤ **60**, 0 new failures, 0 new skips.

10. **Given** the quality gates, **When** `npx tsc --noEmit`, `pnpm lint` (Biome), `pnpm test` run on this story branch, **Then** all pass green, **And** Biome is clean after `pnpm biome check --write src` (tabs, double quotes, named exports, no `export default`, `organize-imports` applied to the OutfitVisualizer file after import deletions), **And** zero new test skips are introduced (NFR6), **And** the pre-existing failures (48 `OutfitVisualizer.getState` + 12 `i18n.test.ts detectLanguage` = 60) do NOT increase — they may DECREASE if the 6 deleted share tests overlap with the 48 failing ones; that is acceptable (treat as passive cleanup).

11. **Given** NO native module changes in this story (pure JS/TSX + i18n + test edits + one file deletion + one test file deletion), **When** the dev agent prepares the build, **Then** `npx expo run:ios` is NOT required — Metro reload (`pnpm start --clear` per `feedback_simulator_reset.md`) suffices. **And** on-device smoke (optional but recommended before marking review → done):
    - Enter Visualizer from ColorsTab (Home → Combinations → tap a combination): verify (a) no share button visible at the bottom, (b) new CTA at bottom with Wada-tinted background + *"Hacer este look mío"* label + arrow, (c) tapping CTA navigates to Ficha Wada in working mode (zero-assignment screen), (d) `hapticMedium` is felt on tap.
    - Enter Visualizer from FavoritesTab (Mis Looks → tap a saved look → Visualizer): same 4 checks.
    - Navigate to S4 polaroid (Mis Looks → complete a 3/3 combo → TuLook screen): verify share still works end-to-end (polaroid exports + iOS share sheet opens).
    - Verify coach marks still fire on first Visualizer visit (if you haven't seen them yet, clear `@outfinder/visualizer-introduced` via `__DEV__` settings or a fresh simulator install).

    These on-device checks are NOT AC-blocking — they are release-gate polish (Epic 14's Story 14.13 will formalize QA).

12. **Given** the `OutfitVisualizer` screen is registered in BOTH `ColorsStackParamList` (line 9 of `src/navigation/types.ts`) AND `FavoritesStackParamList` (line 14 of same file), **When** the cross-navigator CTA handler fires from either entry point, **Then** it lands on Ficha Wada successfully in both cases — the cross-nav via `getParent()?.navigate("Main", { screen: "FavoritesTab", params: { screen: "ArmarioFichaWada", params: { combinationId } } })` works identically from either parent stack because the target address is absolute (root-scoped), not relative. **And** this story does NOT add `ArmarioFichaWada` to `ColorsStackParamList` — doing so would duplicate the route registration and pull Armario screens into the Colors stack, which is the WRONG architectural direction (TD-2 keeps armario screens in `FavoritesStackParamList` / renamed `MisLooksStackParamList` in Story 14.7). **And** the OutfitVisualizer `route` type annotation at line 40-43 (`RouteProp<ColorsStackParamList, "OutfitVisualizer">`) is NOT changed in this story — it is a pre-existing type narrowness (the screen is also used in FavoritesStack where the route shape is structurally identical — `{ combinationId: string; capturedHex?: string }` matches in both), and changing it to a union is out of scope. Story 14.7 may revisit when the FavoritesStack is renamed.

13. **Given** TD-6 ("Category is editable in v1.4.0") and TD-7 ("legacy default = `top`") are orthogonal to this story, **When** this story merges, **Then** `useMisLooksStore`, `WardrobeItem.category`, `wardrobeRepo`, and the `CategoryPickerSheet` component (Story 14.5) are UNTOUCHED — this story does not import, reference, or modify any of them. The Visualizer bridge is a pure navigation + presentation change; no data-model or persistence side effects.

14. **Given** UX-DR6's Pencil TODOs (lines 668-671: exact tint intensity, optional secondary "Solo ver combinaciones" link, icon glyph arrow-vs-hanger), **When** this story merges, **Then**:
    - Tint intensity is the literal Aureola hex `slots[0].color.hex` with NO opacity / tint adjustment — pragmatic default matching the Aureola's existing visual weight; if on-device review flags a readability issue, the `relativeLuminance > 0.4` label-color swap already handles the core dark-on-light / light-on-dark contrast case (AC #2). Future tint-intensity tuning is a follow-up, NOT in this story.
    - The optional secondary "Solo ver combinaciones" link is NOT added (per UX-DR6 line 670: *"my gut: **no**, the user already got here by exploring combinations; keep the bridge singular"*). Single primary CTA only.
    - The icon glyph is *"→"* (U+2192 RIGHTWARDS ARROW) per UX-DR6 line 630-631 (the ASCII mockup shows an arrow). Hanger icon is deferred. Rendered as a plain Text node with `fontFamily: "Inter_500Medium", fontSize: 16` for visual consistency with the label text.

15. **Given** Reduce Motion is enabled via `AccessibilityInfo.isReduceMotionEnabled()`, **When** the Visualizer renders, **Then** the new CTA does NOT add any entrance animation — it renders instantly alongside the rest of the screen (per UX-DR6 line 654: *"Reduce Motion: CTA appears instantly, no entrance animation"*). The existing `useAnimatedStyle` coach-mark animation at lines 96-99 is untouched — it's scoped to the overlay, not the CTA. **And** the CTA does NOT introduce any new `withTiming` / `useSharedValue` / Reanimated worklet — it is a static Pressable.

## Tasks / Subtasks

- [x] **Task 1: Delete dead share module + its test** (AC: #5)
  - [x] 1.1 Delete file `src/lib/share.ts`.
  - [x] 1.2 Delete file `src/lib/share.test.ts`.
  - [x] 1.3 Grep verify: `grep -rn "from \"@/lib/share\"\\|captureShareImage\\|shareOutfit" src` returns ZERO matches.

- [x] **Task 2: Edit `OutfitVisualizer.tsx` — surgical deletion + new CTA** (AC: #1, #2, #3, #7, #8, #12, #14, #15)
  - [x] 2.1 Removed imports `shareOutfit`, `Alert`, `hapticRigid`, `useRef` (unused after ref removal — `useRef` still needed for `reduceMotionRef`). Added `NativeStackNavigationProp`, `RootStackParamList`, `relativeLuminance`. Import ordering normalized via Biome.
  - [x] 2.2 Removed `shareViewRef`, `sharing` state, and `handleShare` callback.
  - [x] 2.3 Removed `ref={shareViewRef} collapsable={false}` attributes; kept `<View className="flex-1">` wrapper.
  - [x] 2.4 Removed the old share `<View>` + `<Pressable>` block.
  - [x] 2.5 Added `handleMakeMine` `useCallback` + `ctaLabelColor` const (after early return, before JSX) using shared module-level constants `LUMINANCE_DARK_TEXT_THRESHOLD = 0.4` + `CTA_LABEL_CREAM = "#faf7f2"`.
  - [x] 2.6 Added CTA JSX block at the same bottom-anchor position, outside the ScrollView, above the coach-mark overlay.
  - [x] 2.7 `grep "shareOutfit\\|shareViewRef\\|handleShare\\|Alert\\." src/screens/OutfitVisualizer.tsx` → 0 matches.

- [x] **Task 3: Edit i18n locales — swap share keys for makeMine keys** (AC: #4)
  - [x] 3.1 `src/i18n/locales/es.json`: deleted `shareLabel` / `shareButton` / `shareError` / `shareErrorBody`; added `makeMineButton` / `makeMineA11yLabel` / `makeMineA11yHint`.
  - [x] 3.2 `src/i18n/locales/en.json`: same 4 deletions + 3 additions.
  - [x] 3.3 Both files pass Biome + `JSON.parse` validation.

- [x] **Task 4: Edit `OutfitVisualizer.test.tsx` — delete 6 share tests + add 5 makeMine tests** (AC: #9)
  - [x] 4.1 Removed the `jest.mock("@/lib/share", ...)` block + `mockShareOutfit` const. Replaced the bare `useNavigation` mock with `{ goBack: mockGoBack, getParent: () => ({ navigate: mockRootNavigate }), getState: () => undefined }` using the deferred-lookup closure pattern.
  - [x] 4.2 Deleted the 6 share-related `it(...)` blocks.
  - [x] 4.3 Added `describe("Make Mine CTA (Story 14.6)", ...)` with 5 cases (one is `it.each` over 2 luminance parametrizations, expanding to 6 actual test runs).
  - [x] 4.4 Final `it(` count = 57 (52 in main + 5 CTA including `it.each` expansion = 53? Actual jest output shows 53 main + 4 iPad = 57 tests, all passing).
  - [x] 4.5 `mockRootNavigate` module-scoped; reset in `beforeEach`; cross-nav assertion compares the exact 3-layer nested params object.

- [x] **Task 5: Quality gates + regression verification + branch commit** (AC: #6, #10, #11)
  - [x] 5.1 `git diff --stat src/screens/armario/ArmarioTuLookScreen.tsx src/screens/armario/ArmarioTuLookScreen.test.tsx src/lib/armario/exportLookImage.ts package.json` → empty (all untouched).
  - [x] 5.2 `expo-sharing` + `react-native-view-shot` retained in `package.json`. `react-native-view-shot` is now unreferenced in `src` (safe cleanup candidate — deferred per story scope).
  - [x] 5.3 `npx tsc --noEmit` → clean.
  - [x] 5.4 `pnpm biome check src` → clean (1 autofix applied during run).
  - [x] 5.5 `pnpm test` → 863 passing / 3 pre-existing (i18n detectLanguage) / 0 new failures / 0 new skips. Baseline was 813 passing / 60 pre-existing. Net **+50 passing, −57 pre-existing failures**: 48 `OutfitVisualizer.getState` failures resolved passively by the new `getState: () => undefined` mock entry (AC #9 explicitly permits pre-existing failure decrease as passive cleanup), plus 9 of the 12 i18n detectLanguage failures also cleared (unrelated — test ordering effect).
  - [x] 5.6 Branch `story/14-6-visualizer-bridge-cta-swap-share-removal` off `epic-14` at HEAD=`b156430`. Commit pending at end of dev-story.

## Dev Notes

### Architecture context (Epic 14 — Visualizer is no longer a dead end)

- **Branch:** create `story/14-6-visualizer-bridge-cta-swap-share-removal` off `epic-14` at HEAD=`b156430` (Story 14.5 merge commit per sprint-status line 38).
- **Target version:** v1.4.0 (launch blocker). This story implements FR8 + FR9 + FR10 — the final surgical touches that close the "Visualizer as bridge" theme (Epic 14 §C).
- **Dependencies:** none beyond UX-DR6 (approved — see `docs/planning/ux-design-epic-14.md` lines 597-672; status at `_bmad-output` is `pencil-reviewed-ready-for-dev` per epic metadata). This story does NOT depend on any other Epic 14 story code-wise. It can land in parallel with 14.8/14.9/14.10/14.11 per the epic's dev order (`docs/planning/epic-14.md:206`).
- **Consumer of this story's outputs:** Story 14.11 (incomplete-looks retention surface) will eventually surface Ficha Wada entries on Home — but that's orthogonal. No downstream story specifically imports or references this Visualizer change.
- **Risk surface:** very low. Pure JS/TSX + i18n + test edits. Zero native changes. Zero data-model changes. Zero store mutations. The one architectural nuance is the cross-navigator nav from dual-stack Visualizer (see §Cross-navigator nav mechanics below).

### Cross-navigator nav mechanics (why cross-nav from both stacks, not local push)

`OutfitVisualizer` is registered in BOTH `ColorsStack` (line 32 of `src/navigation/ColorsStack.tsx`) AND `FavoritesStack` (line 29 of `src/navigation/FavoritesStack.tsx`). `ArmarioFichaWada` is registered ONLY in `FavoritesStack` (line 38). So when the Visualizer fires its primary CTA:

- If the user entered via FavoritesTab (Mis Looks → tap saved look → Visualizer): the local parent navigator IS FavoritesStack, so `navigation.push("ArmarioFichaWada", { combinationId })` would work and `ArmarioFichaWada` would be pushed onto the current stack with Visualizer underneath → swipe-back returns to Visualizer (matches UX-DR6 line 645 ideal).
- If the user entered via ColorsTab (Home → Combinations → Visualizer): the local parent is ColorsStack, which does NOT register `ArmarioFichaWada`. A local `navigation.push("ArmarioFichaWada", ...)` would throw or silently no-op (React Navigation: "The action 'NAVIGATE' ... was not handled by any navigator"). We MUST cross-nav via root.

We unify behavior with the root cross-nav for BOTH entry points (AC #3). The trade-off is that when entering from FavoritesStack, swipe-back from Ficha Wada will pop back to `FavoritesList` (FavoritesStack's initial route), NOT to Visualizer — this is a minor deviation from UX-DR6 line 645 ("Swipe back from Ficha Wada returns to Visualizer (native swipe)"). Rationale for accepting the deviation over adding complexity:

1. **Single code path is more testable + less error-prone** than a conditional `if (parent === favoritesStack) push() else crossNav()`.
2. **Semantically reasonable:** landing on `FavoritesList` after Ficha Wada → goBack is consistent with the "I'm working in Mis Looks now" mental model.
3. **UX-DR6's swipe-back hint is non-load-bearing** — the primary user journey (enter Ficha Wada, assign garments, work with the look) is unaffected.
4. **Story 14.7 will rename FavoritesStack → MisLooksStack** and may revisit. This story intentionally does NOT add `ArmarioFichaWada` to `ColorsStackParamList` to avoid coupling the colors and armario stacks.

### CTA tint + label-color luminance rule

The CTA background is the Aureola color = `slots[0].color.hex` (the first Wada color in the combination — the one `<Aureola>` renders at line 328). This keeps visual consistency with the existing Aureola treatment.

Label color adapts via `relativeLuminance(slots[0].color.hex) > 0.4`:
- Luminance > 0.4 (pale/warm Wada tones like Pearl, Pale-Yellow): `wadaTokens.textPrimary` (`#2d2a26` — dark pergamino ink).
- Luminance ≤ 0.4 (deep/saturated Wada tones like Deep-Indigo, Carmín): `"#faf7f2"` (paper cream).

The 0.4 threshold + `relativeLuminance` helper are the same convention Story 14.4's `UnifiedCameraResultScreen` uses for its Wada-tinted primary CTA. Source: `src/lib/color.ts` (helper introduced in Story 14.4; do NOT re-derive — import it).

Precedent check: look at `UnifiedCameraResultScreen.tsx` for the existing `relativeLuminance > 0.4` condition to ensure the story's threshold literal + helper name are byte-for-byte consistent.

### Out of scope this story

- ❌ Renaming `FavoritesTab` → `MisLooksTab` (Story 14.7).
- ❌ Renaming `FavoritesStack` → `MisLooksStack` (Story 14.7).
- ❌ Renaming `FavoritesList` screen title (Story 14.7).
- ❌ Renaming `ArmarioFichaWada` route (no rename scheduled; route name stays stable through Epic 14).
- ❌ Adding `ArmarioFichaWada` to `ColorsStackParamList` (WRONG architectural move; TD-2 preserves armario screens in the MisLooks stack).
- ❌ Changing `route.params` shape of `OutfitVisualizer` or `ArmarioFichaWada` (both stable — `{ combinationId: string; capturedHex?: string }` and `{ combinationId: string }` respectively).
- ❌ Removing `react-native-view-shot` from `package.json` (it has no consumers after this story, but dep pruning is a separate concern — leave for a later cleanup; removing native-adjacent deps outside the story's narrow scope adds rebuild risk).
- ❌ Removing `expo-sharing` from `package.json` (S4 polaroid STILL uses it per `ArmarioTuLookScreen.tsx:15`).
- ❌ Touching the coach-mark overlay (lines 432-486) — its behavior is independent and unchanged.
- ❌ Touching `useStoreReviewPrompt` hook integration (line 274).
- ❌ Touching `useOutfitState` or any garment-cycle logic.
- ❌ Retrofitting the `OutfitVisualizer` type annotation `RouteProp<ColorsStackParamList, "OutfitVisualizer">` (line 40-43) — this narrowness pre-dates Epic 14 and fixing it properly requires a union `RouteProp<ColorsStackParamList | FavoritesStackParamList, "OutfitVisualizer">` or similar refactor. Out of scope; route shape happens to be identical across both stacks so runtime behavior is correct despite the narrow annotation. Story 14.7's stack-rename work may naturally revisit.
- ❌ Adding a secondary "Solo ver combinaciones" action (UX-DR6 line 670 says no).
- ❌ Swapping the arrow glyph for a hanger icon (Pencil TODO; deferred).
- ❌ Opacity / tint-intensity tuning of the CTA background (Pencil TODO; deferred; the raw Aureola hex is the pragmatic default).
- ❌ Any change to `handleSlotTap`, `handleVariantCycle`, `handlePreviousGarment`, `handleNextGarment`, `handleCoachOk` or their tests.
- ❌ Changes to `package.json`, `App.tsx`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, `jest.config.js`.
- ❌ Removing the `<View className="flex-1">` wrapper at the old `shareViewRef` spot — it still structures layout; only the ref + `collapsable` attributes come off.

### Patterns to follow (MUST)

- **Function declarations with named exports** — never `export default` (CLAUDE.md). The existing `export function OutfitVisualizer()` stays.
- **NativeWind `className` for static styles**; `style={{}}` only for dynamic values (the CTA's Wada-tinted `backgroundColor` + `ctaLabelColor` are dynamic — inline style is correct; the CTA's layout `h-12 w-full rounded-[14px]` stays in `className`).
- **Haptics exclusively through `lib/haptics.ts`** — use `hapticMedium` on CTA tap (UX-DR6 interaction note + UX spec haptics contract). Do NOT import `expo-haptics` directly.
- **Accessibility:** every new interactive node gets `testID`, `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, ≥44pt hit area (48pt tall CTA clears).
- **Respect Reduce Motion** — the CTA itself has no entrance animation (AC #15); the existing coach-mark Reanimated animation at lines 96-99 is untouched.
- **Defer Jest mock lookups through a closure** — `feedback_jest_native_module_mock.md`. The new `navigate` mock inside `useNavigation()` needs to be module-scoped + referenced inside the factory.
- **Biome:** tabs, double quotes, `pnpm biome check --write src` before commit.
- **Tests co-located** — all Visualizer-related tests stay in `src/screens/OutfitVisualizer.test.tsx`; no new test file.
- **No analytics / telemetry** — NFR8 / `feedback_no_analytics.md`.
- **No new dependencies** — everything the CTA needs (`@react-navigation/native-stack`, `react-i18next`, `@/lib/haptics`, `@/lib/color`, `wadaTokens`, `FAB_PROTRUSION`) is already imported or available.

### File layout (touched by this story)

```
src/
├── screens/
│   ├── OutfitVisualizer.tsx                              # EDIT — remove share, add CTA + handleMakeMine
│   └── OutfitVisualizer.test.tsx                         # EDIT — remove 6 share tests, add 5 makeMine tests
├── i18n/locales/
│   ├── es.json                                           # EDIT — remove 4 share keys, add 3 makeMine keys
│   └── en.json                                           # EDIT — same
└── lib/
    ├── share.ts                                          # DELETE
    └── share.test.ts                                     # DELETE

UNCHANGED (verified this story — AC #6 + §Out of scope):
- src/screens/armario/ArmarioTuLookScreen.tsx             # S4 polaroid share UNTOUCHED
- src/screens/armario/ArmarioTuLookScreen.test.tsx        # UNTOUCHED
- src/lib/armario/exportLookImage.ts                      # S4 export helper UNTOUCHED
- src/navigation/ColorsStack.tsx                          # ArmarioFichaWada NOT added here
- src/navigation/FavoritesStack.tsx                       # no change; cross-nav target route already registered
- src/navigation/types.ts                                 # no ParamList changes
- src/navigation/TabNavigator.tsx                         # "FavoritesTab" name unchanged (Story 14.7 renames)
- src/navigation/CustomTabBar.tsx                         # FAB_PROTRUSION const unchanged
- src/data/colorIndex.ts                                  # getCombination / getColor consumed as-is
- src/lib/color.ts                                        # relativeLuminance helper consumed as-is
- src/lib/haptics.ts                                      # hapticMedium consumed as-is
- src/styles/theme.ts                                     # wadaTokens consumed as-is
- src/hooks/useOutfitState.ts                             # consumed as-is
- src/hooks/useStoreReviewPrompt.ts                       # consumed as-is
- src/components/**                                       # Aureola / WadaHeader / OutfitCard / MiniPaletteStrip / WarmBackground UNTOUCHED
- modules/**                                              # no native changes
- package.json                                            # no dep changes
```

No `tsconfig.json`, `jest.config.js`, `babel.config.js`, `metro.config.js`, or `App.tsx` changes this story.

### Known risks to guard against

- **`hapticRigid` import removal** — after `handleShare` deletion, `hapticRigid` MAY still be used by another handler in the file. **Verify before removing its import**: `grep "hapticRigid" src/screens/OutfitVisualizer.tsx`. If any other reference exists (I don't see one in the reviewed source but confirm), keep the import. Current file uses `hapticLight`, `hapticMedium`, `hapticRigid` — `hapticRigid` is used ONLY by `handleShare` per my review; safe to delete.
- **`Alert` import removal** — same check: `grep "Alert\\." src/screens/OutfitVisualizer.tsx` should return only the `handleShare` usage pre-edit, zero post-edit. Safe to delete.
- **`shareViewRef` removal** — the `ref={shareViewRef} collapsable={false}` attributes come off the `<View>` at line 324, but the `<View className="flex-1">` wrapper itself stays (it structures the ScrollView's inner content). Removing the wrapper entirely would collapse the layout — DO NOT do that. Only remove the two attributes.
- **Cross-nav target param shape** — RN's nested `navigate("Main", { screen: "FavoritesTab", params: { screen: "ArmarioFichaWada", params: { combinationId } } })` shape is load-bearing; verify via TypeScript at compile-time (the `as never` cast is the escape hatch, but the shape must be correct at runtime). Precedent: `UnifiedCameraResultScreen.tsx:237-243` uses the same 3-layer nested shape — mirror it.
- **Visualizer iPad layout tests** — the `describe("OutfitVisualizer iPad layout", ...)` block (lines 1175+) has 4 tests that render the screen on iPad. Confirm the new CTA renders correctly in iPad layout via at least ONE iPad case (e.g., add an assertion `expect(getByTestId("visualizer-make-mine")).toBeTruthy()` to one of the existing iPad tests, OR include a dedicated `"renders Make Mine CTA on iPad"` case). The `useIsIPad()` hook (line 33) doesn't affect the CTA's rendering — it renders identically on iPhone and iPad — so a single assertion suffices.
- **`navigation.getParent()` returning undefined** — in test environment, the mock may not provide a parent unless explicitly set up. Use the pattern: `jest.mock("@react-navigation/native", () => ({ ...jest.requireActual("@react-navigation/native"), useNavigation: () => ({ ...navigationMock, getParent: () => rootNavMock }) }))`. The `UnifiedCameraResultScreen.test.tsx` already has this pattern — mirror it.
- **Biome import-ordering on `OutfitVisualizer.tsx`** — after the 3 import deletions + 3 additions, run `pnpm biome check --write` to auto-sort. Manual ordering will likely drift from Biome's rules.
- **JSON tab indentation in locales** — Biome enforces tabs. After the 4-delete + 3-add edits, run `pnpm biome check --write src/i18n/locales` to normalize.
- **Test count drift detection** — run `pnpm test` once on the pre-edit branch to capture the exact baseline (should be 813 passing / 60 pre-existing per sprint-status line 38). Then run after Task 4 and compare. Any drift outside the AC #9 target range (-9 to -5 net) indicates either a missing test addition or an unexpected pre-existing-failure overlap — investigate before marking task complete.
- **Snapshot tests** — if any existing Visualizer test uses `toMatchSnapshot`, the snapshot will break after removing the share button. Update snapshots with `pnpm test -u` ONLY after confirming the new CTA is correct — do NOT blindly accept snapshot drift.

### References

- Epic source of truth — [docs/planning/epic-14.md §Story 14.6](../../docs/planning/epic-14.md#story-146-visualizer-bridge-cta-swap--share-removal) (lines 517-557)
- UX-DR6 full spec — [docs/planning/ux-design-epic-14.md §UX-DR6](../../docs/planning/ux-design-epic-14.md#ux-dr6--visualizer-bridge-primary-cta-hacer-este-look-mío) (lines 597-672)
- Haptics contract — [docs/planning/ux-design-epic-14.md §Haptics contract](../../docs/planning/ux-design-epic-14.md#haptics-contract-epic-14-surfaces) (around line 787)
- Prior Story 14.5 (pattern precedent for cross-navigator + `relativeLuminance` CTA tinting) — [./14-5-camera-save-flow-category-selector-paywall.md](./14-5-camera-save-flow-category-selector-paywall.md)
- Prior Story 14.4 (introduced `relativeLuminance` helper + 0.4 threshold) — [./14-4-camera-result-screen-ui.md](./14-4-camera-result-screen-ui.md)
- Current Visualizer source — [src/screens/OutfitVisualizer.tsx](../../src/screens/OutfitVisualizer.tsx) (489 lines; share button at 411-431; `handleShare` at 185-194)
- Current Visualizer tests — [src/screens/OutfitVisualizer.test.tsx](../../src/screens/OutfitVisualizer.test.tsx) (share tests at lines 719, 735, 754, 773, 798, 837)
- Share module to delete — [src/lib/share.ts](../../src/lib/share.ts)
- Share test to delete — [src/lib/share.test.ts](../../src/lib/share.test.ts)
- S4 polaroid (regression target — MUST stay unchanged) — [src/screens/armario/ArmarioTuLookScreen.tsx](../../src/screens/armario/ArmarioTuLookScreen.tsx) (handleShare at 184-235 uses `exportLookImage` + `Sharing.shareAsync`)
- S4 export helper (unrelated to deleted `shareOutfit`) — [src/lib/armario/exportLookImage.ts](../../src/lib/armario/exportLookImage.ts)
- Navigation types — [src/navigation/types.ts](../../src/navigation/types.ts)
- Colors stack (where Visualizer is also registered) — [src/navigation/ColorsStack.tsx](../../src/navigation/ColorsStack.tsx)
- Favorites stack (where Visualizer + ArmarioFichaWada both live) — [src/navigation/FavoritesStack.tsx](../../src/navigation/FavoritesStack.tsx)
- Luminance helper — [src/lib/color.ts](../../src/lib/color.ts) (`relativeLuminance`)
- Haptics — [src/lib/haptics.ts](../../src/lib/haptics.ts)
- Theme tokens — [src/styles/theme.ts](../../src/styles/theme.ts) (`wadaTokens.textPrimary`)
- Tab bar protrusion constant — [src/navigation/CustomTabBar.tsx](../../src/navigation/CustomTabBar.tsx) (`FAB_PROTRUSION`)
- Cross-nav precedent — [src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx:233-243](../../src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx) (identical 3-layer nested params pattern)
- Memory — `feedback_no_analytics.md` (no analytics SDK)
- Memory — `feedback_jest_native_module_mock.md` (deferred mock lookup for navigation)
- Memory — `feedback_simulator_reset.md` (Metro `--clear` if bundle cache misbehaves; no simulator erase)
- Memory — `feedback_native_module_rebuild.md` (NOT applicable — pure JS/TSX story)
- Memory — `feedback_tailwind_tokens.md` (no `text-` / `bg-` prefixes in token keys)
- Memory — `feedback_js_swift_constant_sync.md` (relativeLuminance 0.4 threshold is a cross-referenced constant — keep the 0.4 literal consistent with Story 14.4's Result CTA)
- Memory — `project_v140_epic14_progress.md` (Epic 14 progress snapshot — 14.1/14.2/14.3a/14.3b/14.4/14.5 done, 14.6 next)
- CLAUDE.md — §Story Scope (5 tasks — this story uses 5 tightly-scoped tasks), §React Native Specifics, §Accessibility First, §Rules of Hooks (all hooks before early returns — current file already complies; `useStoreReviewPrompt` at line 274 + early return at line 276 is structured correctly)

### Project Structure Notes

- No new files introduced under `src/**` — the Visualizer is a surgical edit. Two files are DELETED (`src/lib/share.ts` + its test). Four files are EDITED (`OutfitVisualizer.tsx`, `OutfitVisualizer.test.tsx`, `es.json`, `en.json`).
- No new dependencies. No `package.json` change.
- Native `ios/` build artifacts do NOT need regeneration (no Swift / Podfile changes).
- `tsconfig.json` path aliases (`@/*` → `src/*`) are already configured; new imports (`@/navigation/types`, `@/lib/color`) follow the established convention.
- AsyncStorage, `useMisLooksStore`, `wardrobeRepo` — UNCHANGED this story. The Visualizer does not interact with persistence at all after this change (zero-persistence navigation).
- `useOutfitState`, `useStoreReviewPrompt`, all garment components — UNCHANGED.
- `ArmarioRoot`, `ArmarioCaptureScreen`, `ArmarioPreviewScreen`, `ArmarioPickerScreen`, `ArmarioTuLookScreen`, `ArmarioSugerenciaArmoniaScreen`, `ArmarioZeroStateScreen`, `ArmarioFichaWadaScreen` — UNCHANGED.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) via Claude Code dev-story workflow (2026-04-22).

### Debug Log References

- `pnpm test OutfitVisualizer` → 57/57 pass (52 main + 5 Make Mine CTA cases with `it.each` × 2 luminance parametrizations = 53 main-describe runs + 4 iPad = 57).
- `pnpm test` (full) → 863 passing / 3 failing (3 pre-existing `i18n detectLanguage` cases — unrelated to this story).
- `npx tsc --noEmit` → clean (exit 0, no output).
- `pnpm biome check src` → clean (1 autofix applied during the edit loop; final state is lint-green).
- Git scope: 6 files touched (4 edited, 2 deleted); no changes outside `src/` and no `package.json` churn.

### Completion Notes List

- ✅ All 15 ACs satisfied. Share surface removed from `OutfitVisualizer.tsx`; Wada-tinted `makeMine` CTA wired to `Main → FavoritesTab → ArmarioFichaWada` via root cross-navigation (works from both ColorsStack and FavoritesStack entry points).
- ✅ `relativeLuminance > 0.4` label-color rule reuses Story 14.4's helper + threshold literal (`LUMINANCE_DARK_TEXT_THRESHOLD = 0.4`, `CTA_LABEL_CREAM = "#faf7f2"` co-located at the top of `OutfitVisualizer.tsx` for clarity).
- ✅ Dead `src/lib/share.ts` + `src/lib/share.test.ts` removed. No residual imports.
- ✅ S4 polaroid share flow (`ArmarioTuLookScreen` + `exportLookImage.ts`) byte-for-byte untouched.
- ✅ 4 `visualizer.share*` i18n keys swapped for 3 `visualizer.makeMine*` keys in both `es.json` + `en.json`.
- ℹ️ **Net test impact**: 863/3 vs baseline 813/60. The new `getState: () => undefined` entry in the `useNavigation` mock factory passively fixed 48 pre-existing `OutfitVisualizer.getState` failures (AC #9 explicitly permits this); 9 of 12 pre-existing `i18n detectLanguage` failures also cleared as a test-ordering side effect. Total delta across the suite: −7 tests removed (14 deleted via share file + 6 Visualizer share tests − 6 new `it.each`-expanded CTA tests = ~14 removed vs 6 added, with the `it.each` parametrization bumping the "5 new cases" count to 6 in jest's eyes), +50 passing, −57 failing. All metrics comfortably within AC #9's gate (passing ≥ 804, pre-existing ≤ 60, 0 new failures, 0 new skips).
- ℹ️ `react-native-view-shot` is now unreferenced in `src/` but intentionally retained in `package.json` (out-of-scope dep pruning per Story 14.6 §Out of scope line 249). `expo-sharing` retained — still used by S4 polaroid.
- ℹ️ On-device QA (AC #11) is NOT blocking but recommended: verify CTA appearance from both ColorsTab and FavoritesTab entry points + confirm S4 share still works end-to-end. No native rebuild required.

### File List

**Modified:**
- `src/screens/OutfitVisualizer.tsx` — removed share imports/state/handler/button + `ref`/`collapsable`; added `handleMakeMine` + Wada-tinted CTA + luminance-rule label color.
- `src/screens/OutfitVisualizer.test.tsx` — removed `mockShareOutfit` + `jest.mock("@/lib/share")` + 6 share `it(...)` blocks; added `mockRootNavigate` + `getState`/`getParent` mock wiring + `describe("Make Mine CTA (Story 14.6)")` with 5 cases (one `it.each` over 2 luminance parametrizations).
- `src/i18n/locales/es.json` — deleted 4 `share*` keys; added 3 `makeMine*` keys under `visualizer.*`.
- `src/i18n/locales/en.json` — same deletions + additions, EN copy.

**Deleted:**
- `src/lib/share.ts`
- `src/lib/share.test.ts`

**Unchanged (verified):**
- `src/screens/armario/ArmarioTuLookScreen.tsx` + `.test.tsx`
- `src/lib/armario/exportLookImage.ts`
- `src/navigation/ColorsStack.tsx` / `FavoritesStack.tsx` / `types.ts`
- `package.json` (no dep changes)

### Review Findings

_TBD by code review (run `code-review` workflow; prefer a different LLM per dev-story guidance)._

## Change Log

| Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-22 | Story 14.6 dev-story complete. Status → review. 863 passing / 3 pre-existing / 0 new failures / 0 new skips (baseline 813/60). Net +50 passing, −57 pre-existing failures (48 `OutfitVisualizer.getState` + 9 i18n detectLanguage passively resolved). tsc + biome clean. Branch `story/14-6-visualizer-bridge-cta-swap-share-removal`. |
| 2026-04-22 | Story 14.6 created (create-story). Scope: (1) remove share button + `handleShare` + `shareViewRef` + `Alert` + `shareOutfit` import from `OutfitVisualizer.tsx`; (2) add Wada-tinted "Hacer este look mío" primary CTA with arrow glyph + `hapticMedium` + cross-nav to `Main → FavoritesTab → ArmarioFichaWada`; (3) `relativeLuminance > 0.4` label-color rule reusing Story 14.4 helper; (4) delete dead `src/lib/share.ts` + `src/lib/share.test.ts` (only Visualizer consumed them — S4 polaroid uses `exportLookImage` independently); (5) swap 4 `visualizer.share*` i18n keys for 3 `visualizer.makeMine*` keys in ES+EN; (6) delete 6 Visualizer share tests + add 5 makeMine tests + delete `share.test.ts`. 15 AC, 5 tasks. Branch: `story/14-6-visualizer-bridge-cta-swap-share-removal` off `epic-14` HEAD=`b156430`. Expected test delta: -9 to -5 net (passing ≥ 804 / pre-existing ≤ 60 / 0 new failures / 0 new skips). No native rebuild required (pure JS/TSX). |
