# Story 13.6: S5 Sugerencia Armonía + Favorites Badges, Thumbnails, Completeness Sort

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user with partially assigned or unassigned Wada combinations in my Favorites**,
I want **to see a contextual "Sugerencia de Armonía" screen for partial combos AND have every Favorites card show its completeness at a glance — with complete combos rising to the top**,
so that **I can spot my next styling opportunity in one tap, know exactly which color is missing, and never lose a complete look under a pile of empty palettes**.

## Acceptance Criteria

1. **Given** the user is on `ArmarioFichaWadaScreen` (S2) with a combination where `0 < assignedCount < totalColors` (partial — 1/3, 2/3, 1/4, 2/4, 3/4), **When** the user taps the `Ver tu look` footer CTA (`testID="s2-view-look-cta"`), **Then** `hapticLight()` fires **And** `navigation.push("ArmarioSugerenciaArmonia", { combinationId })` replaces the current `defaultViewLook` partial-branch stub at `src/screens/armario/ArmarioFichaWadaScreen.tsx:36-43` and `ArmarioFichaWadaScreen.tsx:113-130`. **And** the complete-branch (13.5) continues to push `"ArmarioTuLook"` unchanged — the 13.5 behavior is preserved byte-for-byte. **And** the `onViewLook` prop remains the optional injection seam for tests — when host provides `onViewLook`, it still wins for BOTH branches. **And** the `defaultViewLook` constant + the console.warn stub is DELETED (it existed solely as the S5 placeholder and is now superseded). **And** `FavoritesStackParamList` is extended with `ArmarioSugerenciaArmonia: { combinationId: string }` in `src/navigation/types.ts` (placed after `ArmarioTuLook`) and the screen is registered in `src/navigation/FavoritesStack.tsx` with `options={{ headerShown: false, animation: "fade" }}` (standard push animation — matches ArmarioTuLook; NOT `transparentModal`, NOT `fullScreenModal`).

2. **Given** `ArmarioSugerenciaArmoniaScreen` mounts for a partial combination, **When** the screen renders, **Then** the layout matches S4 structurally (so users learn one visual language): (a) nav row with back `←` button (`testID="s5-back-button"`, 48pt, `accessibilityLabel={t("common.goBack")}`), (b) serif combo name `combination.nameEn` in `NotoSerifJP_500Medium` 22pt (c) amber `<CompletenessBadge assigned={assignedCount} total={totalColors} testID="s5-completeness-badge" />` — the existing `partial` variant already paints amber (`#F8E4C2` / `#8B5E1F`), (d) subtitle line `t("armario.s5.subtitle")` ("Complete the look to see the full harmony." / "Completa el look para ver la armonía completa.") in `Inter_400Regular` 15pt, (e) the Skia polaroid cascade rendered inside `<Canvas>` where UNASSIGNED slots render as empty polaroid cards (see AC #3), (f) the suggestion card pinned near the bottom (see AC #4), (g) primary CTA `t("armario.s5.suggestionCta", { color })` ("Add garment in {{color}}" / "Añadir prenda en {{color}}") — the CTA text is derived from the FIRST missing color by `colorIndex` (lowest index wins when multiple are missing), (h) secondary CTA `t("armario.s5.backToFicha")` ("Back to palette" / "Volver a la paleta") which calls `navigation.goBack()`. **And** on mount, if `!combination || combination.colors.length === 0 || assignedCount === 0 || assignedCount >= totalColors`, a `useEffect` fires `navigation.goBack()` (defensive — S2 routes partial-only; but a background unassign/assign could mutate state between navigation and paint). **And** when the defensive `goBack` fires because `assignedCount >= totalColors` (user just completed the combo on another device / via auto-hydration), `navigation.replace("ArmarioTuLook", { combinationId })` is used INSTEAD of `goBack` — the same transition pattern Epic 12 uses for capture → combinations. `replace` (not `push`) prevents a back-stack flicker.

3. **Given** `ArmarioSugerenciaArmoniaScreen` renders the polaroid cascade via `@shopify/react-native-skia`, **When** `<Canvas>` paints, **Then** `drawPolaroidStack` from `src/lib/armario/drawPolaroidStack.ts` is extended with an optional `emptySlots: boolean[]` prop — index-aligned with `garments[]`; a `true` entry means "this slot is UNASSIGNED, paint as a tinted-border empty polaroid". **And** for EMPTY slots the card is drawn with: (i) background fill `#EEF2F8` (UX spec §S5 light-blue) via `Skia.Paint().setColor(Skia.Color("#EEF2F8"))`, (ii) dashed outer border in the Wada color for that slot using `Skia.Paint().setPathEffect(Skia.PathEffect.MakeDash([16, 10], 0))` + `strokeWidth: cardH * 0.012` + `setStyle(PaintStyle.Stroke)` + color `Skia.Color(colorHex)`, (iii) a central `+` glyph drawn via `canvas.drawText("+", centerX, centerY + fontSize*0.35, plusPaint, plusFont)` where `plusFont = useFont(INTER_MEDIUM_TTF, cardH * 0.18)` and `plusPaint` uses `hexToRgba(colorHex, 0.7)`, (iv) NO image draw call, NO shadow draw call (shadows suppressed on empty cards — they'd compete visually with the dashed border). **And** for FILLED slots the existing Iter-5 render path is unchanged (white card + shadow + image clipRect + signature band on the LAST card). **And** the signature band (Wada dots + "Outfinder") continues to render only on the LAST card regardless of whether it's empty or filled — if the last card is empty, the signature is drawn in its empty-card bottom band area using the same `drawSignatureInBand` helper at 0.5 alpha to stay subordinate to the dashed border. **And** the Canvas refuses to paint (returns `null`) until `signatureFont !== null && plusFont !== null && allFilledGarmentImages.every((i) => i !== null)`. Empty slots do NOT require an SkImage — `garmentImages[i]` for empty slots is passed as `null` and ignored by the draw path.

4. **Given** `ArmarioSugerenciaArmoniaScreen` renders the suggestion card, **When** the screen paints, **Then** the card is a native React Native `<View>` (NOT part of the Skia Canvas — it's interactive UI, not part of the shareable polaroid artifact), positioned ABOVE the CTA row and BELOW the Canvas, with layout: (i) lateral accent stripe 4pt wide in the missing color's `hex` pinned to the left edge via `borderLeftWidth: 4, borderLeftColor`, (ii) title `t("armario.s5.suggestionTitle")` ("Complete the harmony." / "Completa la armonía.") in `Inter_500Medium` 15pt, (iii) body text `t(suggestionCopyKey, { color: missingColor.nameEn })` where `suggestionCopyKey` comes from `getSuggestionCopy(colorIndex, totalColors)` (see AC #5), rendered in `Inter_400Regular` 14pt color `wadaTokens.textSecondary` with line-height 20, (iv) bottom-aligned primary CTA `t("armario.s5.suggestionCta", { color: missingColor.nameEn })` — this is the SAME label as the screen-level primary CTA (AC #2 item g); tapping EITHER the suggestion-card CTA OR the screen-footer primary CTA opens the S3 picker targeting the missing slot. **And** the card background is `wadaTokens.bgElevated` (the already-defined elevated surface token — kept consistent with the rest of the armario chrome, NOT the light-blue empty-polaroid color), border-radius 14pt, padding `{ top: 16, right: 16, bottom: 14, left: 20 }`, shadow `{ offset: {0, 3}, opacity: 0.08, radius: 6 }`. **And** tapping the primary CTA (either location) fires `hapticLight()` then `navigation.push("ArmarioPicker", { combinationId, colorIndex: missingColor.colorIndex })` — reusing the existing S3 Picker screen verbatim. No new picker logic is introduced. **And** if MULTIPLE slots are missing (e.g. 1/3 where two slots are empty), `missingColor = colors[smallestMissingIndex]` — the suggestion card always points at the lowest-index missing slot. Rationale: the first color of a Wada combo is typically the primary garment, so the copy heuristic (`getSuggestionCopy(0, ...) → "Suele ser la pieza principal del look."`) reads naturally for a user standing at a 0/3 → 1/3 threshold.

5. **Given** the suggestion copy heuristic `getSuggestionCopy(colorIndex, totalColors)` in `src/lib/armario/getSuggestionCopy.ts`, **When** called, **Then** it returns an i18n KEY (NOT the translated string — the screen interpolates `{{ color }}` via `t()` at render time): (a) `colorIndex === totalColors - 1` → `"armario.s5.suggestionCopyAccessory"` (EN: "Perfect for an accessory: shoes, bag, or belt.", ES: "Ideal para un accesorio: zapatos, bolso o cinturón."), (b) `colorIndex === 0` → `"armario.s5.suggestionCopyMain"` (EN: "This is usually the main piece of the look.", ES: "Suele ser la pieza principal del look."), (c) middle indices (`0 < colorIndex < totalColors - 1`) → `"armario.s5.suggestionCopyLayer"` (EN: "Consider a second layer or a knitted piece.", ES: "Puede ser una segunda capa o prenda de punto."). **And** the function is pure (no side effects, no async, no i18n lookup inside) — just a 3-branch return of a constant-string literal. **And** edge cases: `totalColors <= 0 || colorIndex < 0 || colorIndex >= totalColors` → `"armario.s5.suggestionCopyMain"` as the safest fallback (logged `__DEV__` warn). **And** unit tests cover all three branches at `totalColors ∈ {3, 4}`, the 2-color edge (`colorIndex = 0` AND `colorIndex = totalColors - 1` both reach branch (a) because `totalColors - 1 === 0` — explicitly test this reads as "accessory" for `colorIndex = totalColors - 1` as the heuristic's intended behavior), and all invalid-input fallbacks. **And** tests do NOT assert translated strings — only the i18n key returned. EN/ES parity is handled by the existing `src/i18n/__tests__/i18n.test.ts` key-parity test.

6. **Given** the FavoritesList screen in `src/screens/FavoritesList.tsx` renders combo cards, **When** the user is on **iOS 17+ AND `useWardrobeStore((s) => s.hydrated) === true`**, **Then** each `ComboCard` in the grid surfaces three new pieces of armario context via a NEW wrapper component `<FavoriteComboEnrichedCard />` that composes `<ComboCard variant="compact" />` + overlay chrome: (a) a **completeness badge** in the top-right of the card (absolute positioned so it does not perturb the compact layout) showing `3/3 prendas` / `X/3 prendas` / `Sin prendas` via a NEW `variant="long"` prop added to `CompletenessBadge` that renders `t("armario.favorites.badgeComplete", { assigned, total })` / `t("armario.favorites.badgePartial", { assigned, total })` / `t("armario.favorites.badgeNone")` — existing compact callsites in S2/S4 keep `variant="short"` (default) unchanged, (b) a **thumbnail strip** of the assigned items' `thumbnailPath` rendered just below the color strip using existing `<WardrobeItemThumb size={32} />` laid out in a `flex-row` with `gap: 6`, up to `totalColors` thumbs (one per assigned slot, empty slots render a transparent placeholder of the same 32×32 size to preserve row height), (c) the contextual CTA string in the existing `comboCard.seeOutfit` slot is replaced for iOS-17+ users with: `t("armario.favorites.ctaComplete")` ("See your look →" / "Ver tu look →") when complete, `t("armario.favorites.ctaPartial")` ("Complete your look →" / "Completa tu look →") when partial, `t("armario.favorites.ctaEmpty")` ("Assign garments →" / "Asignar prendas →") when zero-assigned. **And** the CTA substitution is implemented by passing a new optional `ctaOverrideKey?: string` prop through `ComboCard.tsx:12-27` — the existing `t("comboCard.seeOutfit")` is used ONLY when `ctaOverrideKey` is undefined, preserving the color-home / combinations-list behavior. **And** the `<FavoriteComboEnrichedCard />` wrapper is the ONLY consumer that sets `ctaOverrideKey`. **And** for users on **iOS < 17 OR `hydrated === false` OR zero wardrobe items AND no assignments** across ALL combos, the wrapper falls back to rendering `<ComboCard />` unchanged — zero visual regression for pre-Epic-13 users (NFR9 parity). **Rationale for the "zero wardrobe AND no assignments" fallback**: a user on iOS 17+ who has never opened Armario would otherwise see `Sin prendas` badges + `Asignar prendas →` CTAs on every card, which is noisy — we keep the pre-Epic-13 visual until the user creates ANY wardrobe state, then the enrichment kicks in.

7. **Given** the FavoritesList's sort pipeline in `src/screens/FavoritesList.tsx:93-108`, **When** `sortMode === "recent"` (the default — which is also reset on `useFocusEffect`), **Then** a NEW pre-sort step partitions combinations into three buckets using the same `useWardrobeStore((s) => s.assignments)` array already subscribed at line 74: (1) **complete**: `assignedCount === totalColors && totalColors > 0`, (2) **partial**: `0 < assignedCount < totalColors`, (3) **empty**: `assignedCount === 0`. **And** within each bucket, ordering is: complete + partial → sorted by `max(assignedAt)` DESC across that combo's assignments (`combination_assignments.filter(a => a.combinationId === combo.id).reduce((m, a) => Math.max(m, a.assignedAt), 0)`); empty → preserves the current `favorites` Set iteration order (Set iteration order is insertion order in JS spec — this is our stable "favoritedAt desc" proxy without adding a new AsyncStorage migration to `FavoritesContext`). **And** final order is concatenation `[...complete, ...partial, ...empty]`. **And** the partition is implemented in a NEW pure function `sortFavoritesByCompleteness(combinations, assignments)` at `src/lib/armario/sortFavoritesByCompleteness.ts` (+ co-located `.test.ts`). **And** the sort wrapper is ONLY applied when `supportsArmario && hydrated` AND at least one combination has ≥ 1 assignment — otherwise `FavoritesList` passes the `favorites` set through unchanged (pre-Epic-13 order). **And** when the user switches to `sortMode === "a-z"` or `"by-size"`, the completeness partition is NOT applied (user explicitly chose a different dimension — respect it verbatim). **And** the sort does NOT mutate the `assignments` array, does NOT allocate per-combo inside a hot render path (memo'd once per `(favorites, assignments, sortMode, hydrated)` tuple — confirm via `useMemo` deps at line 93–108 of the modified FavoritesList). **And** a pre-existing `"recent"` label remains accurate (completeness-first IS a refinement of "recent" — the user still gets "most recently actionable first"; we do NOT rename the pill).

8. **Given** the unfavorite cascade flow from Story 13.4b at `src/screens/armario/ArmarioFichaWadaScreen.tsx`'s integration with `FavoritesContext`, **When** the user unfavorites a combo that had assignments, **Then** the wardrobe-repo cascade (`cascadeDeleteAssignmentsForCombination`) removes the combo's assignments — this is unchanged from 13.4b. **And** the NEXT render of FavoritesList recomputes `sortFavoritesByCompleteness` with the updated assignments; the combo disappears from the list entirely (it was unfavorited) so the sort-partition effect is a non-issue. **And** the unfavorite-cascade confirmation modal from 13.4b is NOT re-opened or modified in this story. **And** regression test: unfavorite a 2/3 combo → the modal from 13.4b still fires; after confirm, `wardrobeRepo.cascadeDeleteAssignmentsForCombination` is called AND the list re-sorts (no residual partial entry; empty buckets move up).

9. **Given** VoiceOver is active on S5, **When** the user swipes through the rotor, **Then** reading order is: back button → combo title → amber completeness badge → subtitle → (Canvas wrapper with label `t("armario.s5.canvasA11y", { combo: combination.nameEn, assigned: assignedCount, total: totalColors, missing: missingColor.nameEn })` — EN: "Outfit: {{combo}}, {{assigned}} of {{total}} garments assigned. Missing: {{missing}}.", ES: "Look: {{combo}}, {{assigned}} de {{total}} prendas asignadas. Falta: {{missing}}.") → suggestion card title → suggestion card body → suggestion card CTA → screen-footer primary CTA → screen-footer secondary CTA. **And** the Canvas wrapper uses `<View accessible accessibilityRole="image" accessibilityLabel={…}>` — the inner Skia Canvas is decorative. **And** the empty-polaroid slots inside the Canvas are NOT individually focusable (they're Skia paint, not RN elements) — the Canvas wrapper's a11y label communicates the missing color. **And** every interactive element has a 44×44 pt minimum touch target + `accessibilityLabel` + `accessibilityRole="button"`. **And** the suggestion-card CTA + screen-footer primary CTA share the SAME `accessibilityLabel` (both open S3 for the same slot) — this is intentional duplication for discoverability, not a bug.

10. **Given** VoiceOver is active on FavoritesList, **When** the user focuses an enriched combo card (iOS 17+, hydrated, has any wardrobe state), **Then** `ComboCard`'s existing `accessibilityLabel` at `ComboCard.tsx:70-73` is extended via `comboCard.combinationLabel` i18n key interpolation — the `FavoriteComboEnrichedCard` wrapper passes an additional `accessibilityHint` through a new `ComboCard` prop `accessibilityHintOverride?: string` that reads `t("armario.favorites.a11yHintComplete")` / `a11yHintPartial({count, total})` / `a11yHintEmpty` based on completeness. **And** the NEW completeness badge inside the enriched wrapper is `accessibilityElementsHidden={true}` — its information is already announced by the hint override, so narrating both is redundant. **And** the thumbnail strip is `accessibilityElementsHidden={true}` (decorative — color identity is carried by the color strip which is already labeled). **And** the overall touch target stays ≥ 44pt (absolute-positioned badge does not reduce the underlying Pressable's hitSlop).

11. **Given** Reduce Motion is enabled (`useReducedMotion() === true`), **When** the user navigates to S5 OR the FavoritesList re-sorts after an assignment change, **Then** no animated transitions fire: the S5 polaroid cascade paints instantly in final position (Skia has no entry animation — verify no `withSpring`/`withTiming` is added); the FavoritesList re-sort uses FlatList's default reorder (the default `FlatList` in `FavoritesList.tsx:255` does NOT animate reorders by default — no `LayoutAnimation` or `Reanimated` layout transition is added in this story). **And** the "combo just completed → route to S4" behavior from the S5 auto-transition (AC #13) is gated on `!reducedMotion` for the transition-feel only — the navigation still fires; it's just that on Reduce Motion the `navigation.replace()` uses `animation: "none"` via a per-call override.

12. **Given** on-device validation (Reduce Motion, iPhone 16 Pro simulator, EN + ES locales) — documented in completion notes — the Task 4.7 checklist (paralleling 13.5 Task 4.7) covers the user flows: (a) create 2 favorites, assign 1/3 on one and 2/3 on the other, leave a third favorite at 0/3 → verify Favorites list shows sort partition: (2/3 partial with most recent assignment) → (1/3 partial) → (0/3 empty), with badges + thumb strips + correct CTAs; (b) tap the 2/3 card → S2 → `Ver tu look` → S5 appears with 1 empty polaroid (correct color), suggestion card points at THE missing slot with the accessory-heuristic copy (if last slot) or layer-heuristic (if middle), tap CTA → S3 picker opens targeting that colorIndex; (c) from S5, assign the missing garment → S5 screen updates in place; upon the combo becoming 3/3 (complete), `navigation.replace("ArmarioTuLook", ...)` routes user to S4 within 200ms; (d) complete combo → return to Favorites → the now-3/3 combo has RISEN to the top of the list; (e) switch sort to `a-z` → completeness partition is NOT applied, alphabetical order respected; switch back to `recent` → completeness partition returns; (f) unfavorite the 3/3 combo → 13.4b modal fires → confirm → combo disappears, list re-sorts cleanly; (g) iOS < 17 user (simulator set to iOS 16) → FavoritesList renders pre-Epic-13 style (no badges, no thumbs, no enrichment); (h) enable Reduce Motion → repeat (c) — the S5 → S4 auto-transition fires but with no animated slide; (i) switch to Spanish → verify all S5 + FavoritesList strings localize (suggestion copy variants, badge labels, CTA wording); (j) VoiceOver probe on S5 + FavoritesList per AC #9, #10. Paste concise results table into Completion Notes.

13. **Given** the user assigns the LAST missing garment from within S5's picker flow (user on S5 → tap suggestion CTA → S3 picker → pick an item → picker closes → assignment written via `wardrobeRepo.assign`), **When** the updated `assignments` store causes the combo to become COMPLETE (`isCombinationComplete(combinationId, totalColors) === true`) AND the current route is `ArmarioSugerenciaArmonia`, **Then** a `useEffect` in `ArmarioSugerenciaArmoniaScreen` observes this transition (`[assignedCount, totalColors]` deps) and fires `navigation.replace("ArmarioTuLook", { combinationId })` — `replace`, NOT `push` (the user already scrolled through the partial screen; returning to it on back-swipe would be confusing). **And** the transition is guarded by a `didReplaceRef.current` ref so a simultaneous hydration bounce cannot fire `replace` twice. **And** under Reduce Motion, the transition still fires but uses `animation: "none"` (documented in AC #11).

14. **Given** the pnpm test suite, **When** `pnpm test` runs at the end of the dev-story, **Then** the following new / extended test files pass:
    - `src/lib/armario/getSuggestionCopy.test.ts` — CREATE, 7 tests: (a) `(0, 3) → suggestionCopyMain`, (b) `(2, 3) → suggestionCopyAccessory`, (c) `(1, 3) → suggestionCopyLayer`, (d) `(0, 4) → suggestionCopyMain`, (e) `(3, 4) → suggestionCopyAccessory`, (f) `(1, 4)` AND `(2, 4) → suggestionCopyLayer`, (g) edge cases (`(-1, 3) || (3, 3) || (0, 0) → suggestionCopyMain` with `__DEV__` warn spy).
    - `src/lib/armario/sortFavoritesByCompleteness.test.ts` — CREATE, 6 tests: (a) 5 combos mixed (2 complete, 2 partial, 1 empty) → order complete→partial→empty; (b) within complete: sort by `max(assignedAt)` DESC; (c) within partial: sort by `max(assignedAt)` DESC; (d) within empty: preserves input order (Set iteration order); (e) empty `assignments` array → input order preserved entirely; (f) `totalColors === 0` edge (malformed combo) → treated as empty (last bucket).
    - `src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx` — CREATE, 10 tests: (h) renders back button + combo title + amber badge + subtitle + Canvas + suggestion card + CTAs (2/3 partial); (i) defensive `goBack` when `!combination`; (j) defensive `replace("ArmarioTuLook")` when `assignedCount === totalColors` on mount (not `goBack` — hit the replace path per AC #2); (k) defensive `goBack` when `assignedCount === 0` on mount; (l) suggestion card CTA tap → `navigation.push("ArmarioPicker", { combinationId, colorIndex: missingColorIndex })` with lowest-index missing color; (m) screen-footer primary CTA tap has identical effect as the suggestion-card CTA (same handler); (n) screen-footer secondary CTA tap → `navigation.goBack()`; (o) back button tap → `navigation.goBack()` + `hapticLight()`; (p) 1/3 mid-slot missing → suggestion copy is `suggestionCopyLayer` (assert `t` was called with that key); (q) 0→3 auto-transition: simulate `assignments` store flipping from 2/3 → 3/3 during the screen's lifetime → `navigation.replace("ArmarioTuLook", ...)` fires ONCE (ref guard).
    - `src/screens/FavoritesList.test.tsx` — EXTEND by **+8 tests** (current file already has tests for the pre-Epic-13 behavior): (r) iOS 17+ AND hydrated AND ≥1 assignment → renders `FavoriteComboEnrichedCard` with badge + thumb strip; (s) iOS 17+ AND hydrated AND ZERO assignments anywhere → still renders `FavoriteComboEnrichedCard` fallback to `<ComboCard />` unchanged (pre-Epic-13 parity); (t) iOS < 17 → always uses plain `<ComboCard />` regardless of wardrobe state; (u) `hydrated === false` → always uses plain `<ComboCard />`; (v) 3 combos with mixed completeness (0 partial + 1 complete + 1 empty + 1 partial) → assert rendered order matches `sortFavoritesByCompleteness` output; (w) sort pill `a-z` active → completeness partition NOT applied (order is pure alphabetical); (x) CTA override: 2/3 partial combo → CTA reads `t("armario.favorites.ctaPartial")` ("Complete your look →"); (y) 3/3 complete combo → CTA reads `t("armario.favorites.ctaComplete")` ("See your look →"), 0/3 empty combo → CTA reads `t("armario.favorites.ctaEmpty")` ("Assign garments →").
    - `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — EXTEND with **+1 test + 1 deletion**: (z) partial combo (2/3) → tap `Ver tu look` → `navigation.push("ArmarioSugerenciaArmonia", { combinationId: "combo-3" })` fires (replacing the 13.5 test that asserted `defaultViewLook` stub — see Dev Notes §"13.5 test delta"). DELETE the now-dead `defaultViewLook` warn-stub assertion (the function is being removed entirely from `ArmarioFichaWadaScreen.tsx`).
    - `src/components/armario/CompletenessBadge.test.tsx` — EXTEND with **+3 tests**: (aa) `variant="long"` + complete 3/3 → renders `t("armario.favorites.badgeComplete", { assigned: 3, total: 3 })` ("3/3 prendas"); (bb) `variant="long"` + partial 2/3 → "2/3 prendas"; (cc) `variant="long"` + none → renders `t("armario.favorites.badgeNone")` ("Sin prendas"). Existing short-variant tests (5+) MUST all still pass — `variant="short"` is the default so pre-change callsites are unaffected.
    - `src/lib/armario/drawPolaroidStack.test.ts` — EXTEND with **+2 tests**: (dd) `emptySlots = [false, true, false]` → the draw call for card index 1 does NOT issue an `drawImageRect`, DOES issue a `drawRRect` with a `PathEffect.MakeDash` paint (dashed border assertion); (ee) `emptySlots = [true, false, false]` with the LAST card filled → the signature band is still drawn on the last card (filled), not on the empty first card (confirms "signature only on last card" invariant holds regardless of emptiness).
    - **Baseline regression:** zero NEW failures vs. Story 13.5 post-code-review baseline (746 passing / 60 pre-existing debt). Target: **~777 passing** (+7 suggestion + 6 sort + 10 S5 + 8 FavoritesList + 1 S2 + 3 badge + 2 drawPolaroidStack + some inevitable ripple = +31 gross, minus the 1 deleted S2 test and any mock-ripple cleanups = ~+31 net).
    - `npx tsc --noEmit` clean. `pnpm lint` clean (Biome tabs + double-quotes, function-declared named exports, `interface ComponentNameProps`, NativeWind `className`, `style={{}}` only for dynamic values, `testID` only).

15. **Given** i18n keys are added for every new user-visible string, **When** `pnpm test` runs, **Then** `src/i18n/__tests__/i18n.test.ts` key-parity passes. NEW keys added under `armario.s5.*` and `armario.favorites.*` (the FIRST use of the `favorites` sub-namespace under `armario`):
    ```
    armario.s5.screenLabel              → "Harmony suggestion screen" / "Pantalla de sugerencia de armonía"
    armario.s5.subtitle                 → "Complete the look to see the full harmony." / "Completa el look para ver la armonía completa."
    armario.s5.suggestionTitle          → "Complete the harmony." / "Completa la armonía."
    armario.s5.suggestionCopyAccessory  → "Perfect for an accessory: shoes, bag, or belt." / "Ideal para un accesorio: zapatos, bolso o cinturón."
    armario.s5.suggestionCopyMain       → "This is usually the main piece of the look." / "Suele ser la pieza principal del look."
    armario.s5.suggestionCopyLayer      → "Consider a second layer or a knitted piece." / "Puede ser una segunda capa o prenda de punto."
    armario.s5.suggestionCta            → "Add garment in {{color}}" / "Añadir prenda en {{color}}"
    armario.s5.backToFicha              → "Back to palette" / "Volver a la paleta"
    armario.s5.canvasA11y               → "Outfit: {{combo}}, {{assigned}} of {{total}} garments assigned. Missing: {{missing}}." / "Look: {{combo}}, {{assigned}} de {{total}} prendas asignadas. Falta: {{missing}}."
    armario.favorites.badgeComplete     → "{{assigned}}/{{total}} garments" / "{{assigned}}/{{total}} prendas"
    armario.favorites.badgePartial      → "{{assigned}}/{{total}} garments" / "{{assigned}}/{{total}} prendas"
    armario.favorites.badgeNone         → "No garments" / "Sin prendas"
    armario.favorites.ctaComplete       → "See your look →" / "Ver tu look →"
    armario.favorites.ctaPartial        → "Complete your look →" / "Completa tu look →"
    armario.favorites.ctaEmpty          → "Assign garments →" / "Asignar prendas →"
    armario.favorites.a11yHintComplete  → "Complete look. Double-tap to see your look." / "Look completo. Doble-tap para ver tu look."
    armario.favorites.a11yHintPartial   → "{{count}} of {{total}} garments assigned. Double-tap to complete the look." / "{{count}} de {{total}} prendas asignadas. Doble-tap para completar el look."
    armario.favorites.a11yHintEmpty     → "No garments assigned yet. Double-tap to start assigning." / "Sin prendas asignadas. Doble-tap para empezar a asignar."
    ```
    Pre-existing `armario.badge.*` keys (from CompletenessBadge short variant — 13.4a) MUST remain unchanged for the S2 / S4 callsites. The `variant="long"` path reads the new `armario.favorites.*` keys instead.

## Tasks / Subtasks

- [x] **Task 1: Pure libs — `getSuggestionCopy` + `sortFavoritesByCompleteness`** (AC: #5, #7, #14)
  - [x] 1.1 Create `src/lib/armario/getSuggestionCopy.ts`. Export a named function `getSuggestionCopy(colorIndex: number, totalColors: number): SuggestionCopyKey` where `SuggestionCopyKey = "armario.s5.suggestionCopyAccessory" | "armario.s5.suggestionCopyMain" | "armario.s5.suggestionCopyLayer"`. Pure, synchronous, no side effects. Edge-case branch: invalid inputs → `"armario.s5.suggestionCopyMain"` + `if (__DEV__) console.warn(...)`.
  - [x] 1.2 Create `src/lib/armario/sortFavoritesByCompleteness.ts`. Export `sortFavoritesByCompleteness(combinations: Combination[], assignments: CombinationAssignment[]): Combination[]`. Pure. Algorithm: partition → `complete` (assignedCount === totalColors && totalColors > 0), `partial` (0 < assignedCount < totalColors), `empty` (assignedCount === 0) → within complete+partial sort by `max(assignedAt)` DESC — use `Math.max(...assignments.filter(a => a.combinationId === c.id).map(a => a.assignedAt), 0)` (the zero fallback short-circuits to original order for the degenerate case) → within empty preserve input order verbatim (stable sort by `Array#indexOf`-equivalent via index-preserving partition). Do NOT mutate either input argument. `totalColors === 0 || combination.colors.length === 0` → treat as empty.
  - [x] 1.3 Create `src/lib/armario/getSuggestionCopy.test.ts` with the 7 tests from AC #14 (a–g). Pure unit tests — no RN Testing Library.
  - [x] 1.4 Create `src/lib/armario/sortFavoritesByCompleteness.test.ts` with the 6 tests from AC #14 (a–f). Use plain combination fixtures (same shape as `threeColorCombo` in 13.5 tests). Do NOT import Zustand — the function takes `assignments` as a plain argument.
  - [x] 1.5 Add the 9 new i18n keys under `armario.s5.*` (see AC #15) to BOTH `src/i18n/locales/en.json` and `.../es.json`. Verify `src/i18n/__tests__/i18n.test.ts` key-parity passes (the 3 pre-existing language-detection failures are tracked as pre-existing debt #7 — ignored).

- [x] **Task 2: S5 Screen + drawPolaroidStack emptySlots extension** (AC: #1, #2, #3, #4, #9, #11, #13, #14)
  - [x] 2.1 Extend `src/lib/armario/drawPolaroidStack.ts`:
    - Add to `PolaroidStackProps`: `emptySlots?: boolean[]` (index-aligned with `garments[]`). Default `undefined` (treated as all-false — preserves S4 behavior byte-for-byte).
    - Add a new required-on-demand prop `emptySlotPlusFont?: SkFont` (pass the `useFont(INTER_MEDIUM_TTF, ...)` result — only the S5 screen passes this; S4 passes `undefined` since it never paints empty slots and the `+` glyph is never drawn).
    - In `drawPolaroidCard`, branch on `isEmpty = params.emptySlots?.[i]` (wire via a new field `isEmpty: boolean` in `PolaroidCardParams`). When `isEmpty === true`:
      - Skip the shadow draw call.
      - Fill with `#EEF2F8`.
      - Draw a dashed border: `strokePaint = Skia.Paint(); strokePaint.setColor(Skia.Color(colorHex)); strokePaint.setStyle(PaintStyle.Stroke); strokePaint.setStrokeWidth(cardH * 0.012); strokePaint.setPathEffect(Skia.PathEffect.MakeDash([16, 10], 0)); canvas.drawRRect(cardRRect, strokePaint);`
      - Skip the image frame + image clip.
      - Draw a central `+` glyph using the `emptySlotPlusFont` (fontSize ~ `cardH * 0.18`) in `hexToRgba(colorHex, 0.7)`.
      - If this card is ALSO the last card, still call `drawSignatureInBand` but pass `alpha = 0.5` instead of the normal `SIG_BRAND_ALPHA` (new optional 7th param to `drawSignatureInBand`).
    - Import `PaintStyle` from `@shopify/react-native-skia` at the top of the file.
    - Update the existing `drawPolaroidStack` doc-block to mention the new emptySlots contract.
  - [x] 2.2 Extend `__mocks__/@shopify/react-native-skia.js` (additive only — MUST NOT break the 13.5 mock surface):
    - Add `PaintStyle.Stroke = "Stroke"` string sentinel.
    - Add `Skia.PathEffect.MakeDash = jest.fn((intervals, phase) => ({ __dashIntervals: intervals, __dashPhase: phase }))`.
    - Add `setStyle`, `setStrokeWidth`, `setPathEffect` methods to the existing `Skia.Paint()` fake object (each a `jest.fn()` — tests in 1.3/2.4 assert they were called).
  - [x] 2.3 Extend `src/navigation/types.ts` — append `ArmarioSugerenciaArmonia: { combinationId: string };` to `FavoritesStackParamList` (placed right after `ArmarioTuLook`).
  - [x] 2.4 Register the screen in `src/navigation/FavoritesStack.tsx` — add the `<Stack.Screen name="ArmarioSugerenciaArmonia" component={ArmarioSugerenciaArmoniaScreen} options={{ headerShown: false, animation: "fade" }} />` block AFTER the `ArmarioTuLook` screen block.
  - [x] 2.5 Create `src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx`. Function-declared named export. `interface ArmarioSugerenciaArmoniaScreenProps {}` (all state from `route.params` + store). Mirror the 13.5 `ArmarioTuLookScreen.tsx` structure:
    - Hook order (ALL hooks before any early return per CLAUDE.md §Rules of Hooks): `useTranslation`, `useNavigation<Nav>`, `useRoute<Route>`, `useSafeAreaInsets`, `useMemo` for `combination = getCombination(combinationId)`, `useWardrobeStore((s) => s.assignments)`, `useWardrobeStore((s) => s.items)`, `useMemo` for `filteredAssignments`, `useMemo` for `itemById`, `useMemo` for `garmentDescriptors` (one entry per color slot — filled slots have `PolaroidGarment`, empty slots have a sentinel `PolaroidGarment` with `imageFileUri: ""` + correct color data; the `emptySlots[]` array is built in parallel), `useMemo` for `emptySlots` (array of booleans length=totalColors), `useMemo` for `missingColor` (first slot with `emptySlots[i] === true`, returns `{ colorIndex, nameEn, hex }`), `useMemo` for `suggestionCopyKey = getSuggestionCopy(missingColor.colorIndex, totalColors)`, `useState<{w,h}>` for canvas layout, `useFont(INTER_REGULAR_TTF, signatureSize)` for signatureFont, `useFont(INTER_MEDIUM_TTF, plusSize)` for emptySlotPlusFont, `useState<Array<SkImage | null>>` for garmentImages (null entries for empty slots), `useEffect` that loads filled-slot images via `Skia.Data.fromURI` + stale-ref guard (empty slots stay null), `useEffect` defensive guard (early route-away), `useEffect` auto-transition to S4 when combo flips complete (ref-guarded), `useMemo` for `picture` via `createPicture((c) => drawPolaroidStack(c, { ...props, emptySlots, emptySlotPlusFont }))`, `useCallback` for `handleOpenPicker(colorIndex)`, `useCallback` for `handleBack`, `useCallback` for `handleGoBackToS2`.
    - Layout (NativeWind + tokens): root `<View className="flex-1" style={{ backgroundColor: wadaTokens.bgPaper, paddingTop: insets.top, paddingBottom: insets.bottom }}>`. Nav row matches S4 (48pt back button + `NotoSerifJP_500Medium` 22pt title + amber `<CompletenessBadge testID="s5-completeness-badge" />`). Subtitle `<Text>{t("armario.s5.subtitle")}</Text>` in Inter_400Regular 15pt. `<View testID="s5-canvas-wrapper" accessible accessibilityRole="image" accessibilityLabel={t("armario.s5.canvasA11y", ...)} onLayout={handleCanvasLayout} style={{ flex: 1, marginHorizontal: SIDE_PADDING }}><Canvas testID="s5-canvas" style={{ flex: 1 }}>{picture ? <Picture picture={picture} /> : null}</Canvas></View>`. Suggestion card (see 2.6). Two CTAs pinned to bottom: primary (black pill, calls `handleOpenPicker(missingColor.colorIndex)`) + secondary ("Volver a la paleta" — plain text link calling `handleGoBackToS2 = navigation.goBack`).
    - Defensive `useEffect`: `if (!combination || combination.colors.length === 0 || assignedCount === 0) navigation.goBack();` AND `if (assignedCount >= totalColors) navigation.replace("ArmarioTuLook", { combinationId });` — split into two effects to keep dep arrays honest OR one effect with both branches + explicit comment on the dichotomy.
    - Auto-transition `useEffect` (AC #13): separate effect with `[assignedCount, totalColors]` deps — `if (!didReplaceRef.current && combination && assignedCount > 0 && assignedCount >= totalColors) { didReplaceRef.current = true; navigation.replace("ArmarioTuLook", { combinationId }); }`. The `didReplaceRef = useRef(false)` prevents a double-fire if hydration/store bounce re-triggers the effect.
  - [x] 2.6 Inside `ArmarioSugerenciaArmoniaScreen.tsx`, render the suggestion card as a dedicated inline `<SuggestionCard />` sub-component (keep it inside the screen file — not a separate exported component, scope is one-screen-only). Props: `{ colorName: string, colorHex: string, copyKey: SuggestionCopyKey, onPress: () => void, testID: string }`. Layout per AC #4: `<Pressable testID="s5-suggestion-card" onPress={onPress} accessibilityRole="button" accessibilityLabel={t("armario.s5.suggestionCta", { color: colorName })} style={{ flexDirection: "row", backgroundColor: wadaTokens.bgElevated, borderRadius: 14, paddingLeft: 20, paddingRight: 16, paddingTop: 16, paddingBottom: 14, marginHorizontal: SIDE_PADDING, marginVertical: 12, borderLeftWidth: 4, borderLeftColor: colorHex, shadowColor: "#000", shadowOffset: {width:0,height:3}, shadowOpacity: 0.08, shadowRadius: 6 }}>` with a `<View style={{ flex: 1 }}>` containing title + body text, then the bottom-aligned CTA text `{t("armario.s5.suggestionCta", { color: colorName })}` in `Inter_500Medium` 15pt color `wadaTokens.textPrimary`. `hapticLight()` fires in `onPress`.
  - [x] 2.7 Rewire `src/screens/armario/ArmarioFichaWadaScreen.tsx`:
    - Replace the `defaultViewLook` constant + its usage at `line 36-43` and `line 113-130` with a unified push-based implementation:
      ```tsx
      function handleViewLook() {
        if (assignedCount === 0) return;
        hapticLight();
        if (onViewLook) { onViewLook({ combinationId }); return; }
        if (isComplete) {
          navigation.push("ArmarioTuLook", { combinationId });
        } else {
          navigation.push("ArmarioSugerenciaArmonia", { combinationId });
        }
      }
      ```
    - DELETE the `defaultViewLook` constant entirely. DELETE the associated `__DEV__` console.warn. `onViewLook` remains as the only injection seam for tests.
  - [x] 2.8 Create `src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx` with the 10 tests from AC #14 (h–q). Mock pattern from `ArmarioTuLookScreen.test.tsx` (13.5 baseline): single shared nav mock (`goBack`, `push`, `popToTop`, `replace`, `addListener`), `useRoute` fixture, `@/lib/haptics` spy, `@/stores/wardrobeStore` selector mock, `@/data/colorIndex` `getCombination` mock, `expo-file-system`, `expo-sharing` N/A. Re-use the `flushEffects()` helper from 13.5. Use `require` for the screen module inside each test to keep mocks hermetic. The auto-transition test (q) uses the pattern: render at 2/3, then call `act(() => { mockAssignments.push({ combinationId: "combo-3", colorIndex: 2, wardrobeItemId: "u3", assignedAt: Date.now() }); rerender(); })` — the test asserts `navigation.replace` was called exactly once AND `push` was NOT called.
  - [x] 2.9 Extend `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` per AC #14 (z). DELETE the 13.5 assertion about `defaultViewLook` being called on partial branches. ADD a new assertion that `navigation.push("ArmarioSugerenciaArmonia", { combinationId: "combo-3" })` fires on the partial branch (when no `onViewLook` prop). Verify the existing complete-branch test from 13.5 still passes unchanged.
  - [x] 2.10 Extend `src/lib/armario/drawPolaroidStack.test.ts` with the 2 tests from AC #14 (dd–ee). The dashed-border assertion uses `expect(mockPaint.setPathEffect).toHaveBeenCalledWith(expect.objectContaining({ __dashIntervals: [16, 10] }))` against the Skia Jest mock.

- [x] **Task 3: FavoritesList enrichment — badge + thumbs + CTA + sort** (AC: #6, #7, #8, #10, #14)
  - [x] 3.1 Extend `src/components/armario/CompletenessBadge.tsx`:
    - Add `variant?: "short" | "long"` to `CompletenessBadgeProps`, default `"short"` (preserves 13.4a callsites in S2/S4 byte-for-byte).
    - When `variant === "long"`: render `t("armario.favorites.badgeComplete")` / `...badgePartial` / `...badgeNone` (with `{{assigned}}` / `{{total}}` interpolation for complete+partial). When `variant === "short"`: unchanged — reads `armario.badge.*`.
    - Visual: `"long"` variant uses the same color palette (green / amber / gray) but paddingHorizontal 12 instead of 10 to fit the longer text; height stays ≥ 24pt.
  - [x] 3.2 Extend `src/components/ComboCard.tsx`:
    - Add optional prop `ctaOverrideKey?: string` to `ComboCardProps`. When provided, the compact-variant CTA text reads `t(ctaOverrideKey)` instead of `t("comboCard.seeOutfit")`. For the "full" variant, `ctaOverrideKey` has no effect (ComboCard-full is not used in FavoritesList).
    - Add optional prop `accessibilityHintOverride?: string` to `ComboCardProps`. When provided, passed to the outer `Pressable` as `accessibilityHint` (replacing the current `t("comboCard.openHint")`).
    - Both props are backward-compatible: undefined → existing behavior. Do NOT refactor existing `comboCard.*` i18n keys — they remain the default when overrides are absent.
    - NO changes to the Pressable's `accessibilityLabel` — that stays as `t("comboCard.combinationLabel", { name, colors })`.
  - [x] 3.3 Create `src/components/armario/FavoriteComboEnrichedCard.tsx`. Function-declared named export. `interface FavoriteComboEnrichedCardProps { combination: Combination; isFavorite: boolean; onToggleFavorite: () => void; onPress: (combinationId: string) => void; cardWidth: number; }`. Implementation:
    - Hooks: `useTranslation`, `useWardrobeStore((s) => s.assignments)`, `useWardrobeStore((s) => s.items)`, `useMemo` for combo-specific filtered assignments, `useMemo` for completeness state (`{ assigned, total, bucket: "complete" | "partial" | "empty" }`), `useMemo` for the thumbs array (length `= totalColors`, each entry is either a `thumbnailPath: string` OR `null` for unassigned — preserves slot positions), `useMemo` for the `ctaOverrideKey`.
    - Layout: `<View style={{ width: cardWidth, position: "relative" }}>` wrapping:
      (a) the existing `<ComboCard variant="compact" ctaOverrideKey={…} accessibilityHintOverride={…} {...}/>`,
      (b) an absolute-positioned `<CompletenessBadge variant="long" assigned={assigned} total={total} testID="enriched-card-badge" />` with `style={{ position: "absolute", top: 8, right: 8 }}` + `accessibilityElementsHidden={true}` + `importantForAccessibility="no-hide-descendants"`,
      (c) a thumbnail strip rendered OUTSIDE the ComboCard's clip — below the ComboCard component — as a horizontal `<View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingTop: 6 }}>` containing N thumbnails (N = totalColors). Each thumb is `<WardrobeItemThumb uri={thumb} size={32} />` if assigned, or `<View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "transparent" }} />` if empty. `accessibilityElementsHidden={true}`.
    - The strip exists ONLY when `bucket !== "empty"` — when the combo has zero assignments the strip is not rendered (saves vertical space and avoids a row of 3 transparent placeholders).
  - [x] 3.4 Modify `src/screens/FavoritesList.tsx`:
    - Import `sortFavoritesByCompleteness` + `FavoriteComboEnrichedCard`.
    - Add a `useMemo` that derives the `combinations` array — after the existing `sortMode` branch at `line 101-107`, when `sortMode === "recent" && supportsArmario && hydrated && assignments.length > 0` → apply `sortFavoritesByCompleteness(result, assignments)`. The `a-z` and `by-size` branches are unchanged.
    - Modify `renderComboCard` at `line 143-160` to branch on `supportsArmario && hydrated && <any wardrobe state>`. When true → render `<FavoriteComboEnrichedCard combination={item} ... />`. When false → render existing `<ComboCard variant="compact" ... />` unchanged.
    - The `<any wardrobe state>` guard is `items.length > 0 || assignments.length > 0` — both derived via `useWardrobeStore`. (Subscribe to `items` in addition to `assignments`: add `const wardrobeItems = useWardrobeStore((s) => s.items);` near line 74.)
    - Wrap the render branch in `useCallback` with the updated deps.
    - Verify `useFocusEffect(() => { setSortMode("recent") })` at line 86 still runs — the completeness partition is applied ON TOP of "recent", so the reset behavior is preserved (user opens Favorites → always see completeness-first).
    - Do NOT add new sort pills. Do NOT change any pill label. The user-facing concept of "recent" is unchanged; "completeness first" is a refinement the user does not need to name.
  - [x] 3.5 Add the 9 new i18n keys under `armario.favorites.*` (see AC #15) to BOTH `src/i18n/locales/en.json` and `.../es.json`. Verify key-parity test passes.

- [x] **Task 4: Tests + on-device QA + AC walkthrough** (AC: #1–#15)
  - [x] 4.1 Run the full test sequence locally:
    1. `npx tsc --noEmit` → clean.
    2. `pnpm lint` → clean. Run `pnpm biome check --write` if auto-fixes are needed.
    3. `pnpm test` → zero NEW failures vs. Story 13.5 baseline (**746 passing / 60 pre-existing debt**). Target ≈ **777 passing** after +~31 net new/extended tests.
  - [x] 4.2 Create/extend the test files listed in AC #14:
    - CREATE `src/lib/armario/getSuggestionCopy.test.ts` (7 tests).
    - CREATE `src/lib/armario/sortFavoritesByCompleteness.test.ts` (6 tests).
    - CREATE `src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx` (10 tests).
    - EXTEND `src/screens/FavoritesList.test.tsx` (+8 tests — verify existing test file exists; if not, CREATE it with a comprehensive suite that also covers the pre-Epic-13 list render as a regression baseline).
    - EXTEND `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` (+1 test, -1 deleted).
    - EXTEND `src/components/armario/CompletenessBadge.test.tsx` (+3 tests — verify existing file exists; if not, CREATE with a short-variant baseline).
    - EXTEND `src/lib/armario/drawPolaroidStack.test.ts` (+2 tests).
  - [x] 4.3 Run the targeted regression sweep:
    - `pnpm test src/screens/armario/ArmarioFichaWadaScreen.test.tsx src/screens/armario/ArmarioPickerScreen.test.tsx src/screens/armario/ArmarioZeroStateScreen.test.tsx src/screens/armario/ArmarioCaptureScreen.test.tsx src/screens/armario/ArmarioPreviewScreen.test.tsx src/screens/armario/ArmarioTuLookScreen.test.tsx` → 100% pass rate post-change. Verify the S4 polaroid render path is unchanged (no accidental regression from the `drawPolaroidStack` extension).
    - `pnpm test src/components/ComboCard.test.tsx` (if exists) → `ctaOverrideKey` undefined path still renders `comboCard.seeOutfit`, `accessibilityHintOverride` undefined path still renders `comboCard.openHint`.
    - `pnpm test src/screens/ColorHome.test.tsx src/screens/Combinations.test.tsx` — these use `<ComboCard variant="full" />` and MUST be unaffected by the new optional props.
    - `pnpm test src/lib/share.test.ts src/screens/OutfitVisualizer.test.tsx` — Epic 3 share pipeline unchanged (this story does not touch `src/lib/share.ts`).
  - [x] 4.4 On-device visual QA — manual, iPhone 16 Pro simulator. Execute the checklist from AC #12 (a–j). Paste a concise results table into Completion Notes, mirroring the 13.5 completion-notes format. Flag ANY visual divergence between the S5 empty-polaroid cascade and the S5 screenshot at `docs/planning/feature-armario-virtual/screens/s5-sugerencia-armonia.png` — product will adjudicate.
  - [x] 4.5 Privacy + regression sanity:
    - Grep S5 + sort + enriched-card files for `fetch`, `axios`, `XMLHttpRequest`, `analytics` → zero results expected (NFR8, `feedback_no_analytics.md`).
    - Grep for any new `AsyncStorage.setItem` / `removeItem` in this story → zero expected (the sort partition does NOT persist; it's a render-time derivation).
    - Verify `src/lib/armario/sortFavoritesByCompleteness.ts` does NOT import Zustand or React — it MUST be a pure data-only function (keeps it trivial to unit-test + reusable from any caller).
  - [x] 4.6 AC walkthrough in Completion Notes — one row per AC #1–#15 with a one-sentence "verified via {test name / visual pass / on-device action}". Mirror the 13.5 Completion Notes table. Include a "Reviewer Notes — Do Not Flag" section if any product decision drifts from the ACs during dev-story (pattern from 13.5 iter 1–5 — Alejandro may iterate S5 on device).

## Dev Notes

### Architecture context (brownfield, current branch: `epic-13`, story branch: `story/13-6-s5-sugerencia-armonia-favorites-badges`)

- **Upstream deps already on-branch (verified 2026-04-20 via sprint-status.yaml):**
  - **13.1** — `wardrobeRepo` (`getAssignmentCount`, `isCombinationComplete`, `assign`) + `useWardrobeStore` hydration.
  - **13.4a** — shared components: `CompletenessBadge`, `PolaroidCard`, `WardrobeItemThumb`, `WadaColorDot`. iOS-17 gate at `src/lib/platform.ts`.
  - **13.4b** — `ArmarioPickerScreen` at route `ArmarioPicker: { combinationId, colorIndex }` — reused verbatim from S5 suggestion CTA. Unfavorite-cascade modal lives here.
  - **13.5** — `drawPolaroidStack` + `exportLookImage` + `ArmarioTuLookScreen` + extended Skia Jest mock. This story extends `drawPolaroidStack` (emptySlots prop), extends the Skia mock (PaintStyle + PathEffect.MakeDash), and rewires S2's partial branch (removing the `defaultViewLook` stub). NO changes to `exportLookImage` or `ArmarioTuLookScreen`.
- **Test baseline:** 746 passing / 60 pre-existing failures (post-13.5 code review). The 60 failures are `OutfitVisualizer.test.tsx` + `i18n.test.ts` legacy debt #7 — do NOT attempt to fix them in this story.

### Scope boundaries (tight — 4 tasks, CLAUDE.md §Story Scope)

- ✅ `getSuggestionCopy` + `sortFavoritesByCompleteness` pure libs.
- ✅ S5 `ArmarioSugerenciaArmoniaScreen` on FavoritesStack. Reuses `drawPolaroidStack` (+ `emptySlots` extension) + `ArmarioPicker`.
- ✅ `drawPolaroidStack` extension: `emptySlots[]` prop + dashed-border empty polaroid render.
- ✅ `FavoriteComboEnrichedCard` wrapper: badge + thumb strip + CTA override.
- ✅ FavoritesList sort: completeness partition on `"recent"` (not on `"a-z"` / `"by-size"`).
- ✅ S2 `handleViewLook` partial-branch rewire: push `ArmarioSugerenciaArmonia`. DELETE `defaultViewLook` stub.
- ✅ CompletenessBadge `variant="long"` + 9 new i18n keys.
- ✅ Reduce Motion + VoiceOver + 44pt touch targets + EN/ES parity.
- ❌ NO modifications to `exportLookImage` (S4 share path unchanged).
- ❌ NO new `wardrobeRepo` functions (existing API is sufficient — `assign`, `unassign`, `getAssignmentCount`, `isCombinationComplete` cover everything).
- ❌ NO changes to `src/lib/share.ts` (Epic 3 share path unaffected).
- ❌ NO new `accessibilityHintOverride`-style props on unrelated components (keep the `ComboCard` prop surface minimal).
- ❌ NO native module changes (no `expo prebuild --clean` / `expo run:ios` required).
- ❌ NO analytics — craft-driven. See `feedback_no_analytics.md`.
- ❌ NO MMKV / storage migration. Favorites remain a `Set<string>` in `FavoritesContext`. The "empty-bucket order via Set insertion" decision avoids a breaking migration.
- ❌ NO new bottom-sheet library. S5 is a full-screen stack push, NOT a modal.

### Previous story intelligence — what 13.5 taught us

- **Dev-story loop pattern:** Alejandro ran 5 successive UX polish iterations on 13.5 AFTER the initial dev-story. Expect the same here — the S5 empty-polaroid visual is the most likely candidate for iteration (dashed-border thickness, `+` glyph size, signature alpha on an empty last card, suggestion card padding, etc.). **Document every iteration inline in the story's "Reviewer Notes — Do Not Flag" section during dev-story** — pattern from 13.4b and 13.5 (both have these sections). It prevents code review from re-litigating accepted product decisions.
- **Skia Jest mock is additive-only:** the 13.5 mock surface covers the existing consumers (TintedGarment, Aureola, AnalysisOverlay). This story adds `PaintStyle.Stroke` + `Skia.PathEffect.MakeDash` + `setStyle` / `setStrokeWidth` / `setPathEffect` on the paint fake. Do NOT modify existing exports — break backward compat and the pre-existing 746-passing baseline collapses.
- **Font require path quirk (from 13.5 iter 1):** `@expo-google-fonts` exposes TTFs under `/<weight>Name/<FamilyName>_<weight>Name.ttf`. When loading Inter_500Medium for the empty-slot `+` glyph use `require("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf")` — NOT the root.
- **Hook order + defensive goBack pattern:** 13.5 AC #10(m) and (n) validated this pattern. Mirror it in S5: ALL hooks first, then defensive navigation in a `useEffect` (never a render-time conditional that would break Rules of Hooks). The 13.5 screen at `ArmarioTuLookScreen.tsx:161-165` is the template.
- **`createPicture` + `useMemo` memoization pattern:** the 13.5 screen creates the `picture` once per `(font, images, size)` change. S5 adds `emptySlots` to the dep array — ensure the memo re-runs when a slot flips from empty → filled mid-session (the S5 picker flow can do this without unmounting the screen).
- **Auto-transition at AC #13:** the pattern `navigation.replace()` (NOT `push`) on combo-complete is lifted directly from Epic 12's capture → combinations flow. The `didReplaceRef` guard protects against double-fire when Zustand's hydrated store bounces.

### 13.5 test delta (AC #14 z)

The 13.5 test file `ArmarioFichaWadaScreen.test.tsx` has two "view-look CTA" tests post-13.5:
- **Complete branch** (current state from 13.5): asserts `navigation.push("ArmarioTuLook", {combinationId})` fires when no `onViewLook` prop is provided AND when `onViewLook` IS provided, the prop wins.
- **Partial branch** (current state from 13.5): asserts the `defaultViewLook` stub (the console.warn) fires when no `onViewLook` prop is provided AND when `onViewLook` IS provided, the prop wins.

This story:
- LEAVES the complete branch test unchanged (13.5 behavior preserved).
- **REPLACES the partial-branch "defaultViewLook stub fires" assertion** with: `navigation.push("ArmarioSugerenciaArmonia", {combinationId})` fires. The `onViewLook`-prop-wins half of the partial branch test stays identical (the prop still wins when provided — it's just that the default is now a push instead of a warn).
- DELETES the `defaultViewLook` constant entirely from `ArmarioFichaWadaScreen.tsx` since it's no longer referenced. This is the "1 deletion" in AC #14 (z).

### Why the suggestion card duplicates the screen-footer primary CTA

AC #4 specifies that BOTH the suggestion-card CTA AND the screen-footer primary CTA open the S3 picker targeting the missing slot. This is intentional:
- The suggestion card is positioned mid-screen, anchored by the narrative (title + body text explaining WHY that color matters).
- The screen-footer primary CTA is a consistent bottom-of-screen affordance matching S4's footer CTA position — users who learned the S4 pattern ("primary action at the bottom") still find the primary action where they expect.
- Duplication is explicit, low-risk (same handler), and VoiceOver announces both with identical labels.
- The UX spec §S5 shows the suggestion card as the primary affordance but Alejandro's on-device testing with 13.4b showed users discover the bottom-anchored CTA faster on first exposure — so we keep both. If post-launch feedback says one is enough, delete the card-internal CTA in a follow-up (trivially removable).

### Why the empty-bucket is sorted by `favorites` Set insertion order (not a new AsyncStorage key)

The UX spec's epic Story 13.6 AC includes "empty (sorted by the original favoritedAt desc)". But the existing `FavoritesContext` at `src/contexts/FavoritesContext.tsx` persists favorites as a plain `string[]` JSON blob — NO per-favorite timestamp. Adding `favoritedAt` would require:
1. A storage migration (read-old-format + write-new-format on first launch).
2. A new `FavoritesContextValue` shape.
3. Ripple updates to every `toggleFavorite` callsite.

For a "which empty combo is most recently favorited" UX signal, this is not worth the blast radius. Trade-off:
- **Chosen**: use `Set` iteration order (which, per JS spec, is insertion order). New favorites appear at the BOTTOM of the Set → for "empty by favoritedAt desc" we iterate in insertion order = oldest-first = the OPPOSITE of desc. But for the EMPTY bucket specifically, this is a minor UX nit: all empty combos show `Sin prendas` and have identical "next action" value — relative order within the bucket is low-priority. The user's cognitive load comes from the partition (complete → partial → empty), not within-bucket order of the empty tail.
- If product pressure later demands "empty desc by favoritedAt", add the timestamp in a separate focused story — NOT here.

This decision should be captured in `project_v140_epic13_start.md` post-story for reviewer context.

### Why add `ctaOverrideKey` / `accessibilityHintOverride` to ComboCard instead of forking the component

The alternative is a dedicated `FavoriteComboCard` that shares 80% of `ComboCard`'s JSX. That forks the color-strip layout, the favorite button, and the Pressable wrapper — three things that already work AND are under test. Any future change to the color strip (e.g., add a hover state) would need to be applied in two places — same fragility as the Epic 3 share path that we explicitly kept isolated from S4's share path.

The two new props are additive, default to `undefined`, and preserve every existing callsite's behavior byte-for-byte. Eight callsites consume `<ComboCard variant="compact" />` currently (FavoritesList, Combinations, ColorHome, wardrobe examples) — none pass the new props, none change. The new FavoriteComboEnrichedCard is the ONLY consumer that sets them.

### Why the thumbnail strip uses a fixed `size={32}` (not responsive)

The compact combo card is 52-60pt tall (phone / iPad). The color strip takes the top 52-60pt. The info area (name + favorite button + CTA) takes the next ~40pt. Adding a strip of 32pt thumbs + 6pt padding = +44pt. The enriched card becomes ~136-144pt tall — still compact, still fits the 2-col grid on iPad and 1-col on phone without visual crowding.

A responsive size (28 on phone / 36 on iPad) was considered and rejected: the thumbs carry zero interactive value — they're decorative proof that the user has assigned garments. 32pt reads as "thumbnail" on both form factors.

### Navigation topology — S5 is a stack push on FavoritesStack

Same pattern as S4: push, not modal. Back-swipe from S5 returns to S2 naturally. `animation: "fade"` matches the rest of the stack (mirrors `FavoritesStack.tsx:19`'s default `screenOptions={{ animation: "fade" }}`). Do NOT use `transparentModal` (S3's pattern) — S5 is not an overlay on S2; it's a full replacement screen.

### Reduce Motion pattern (AC #11)

The S5 polaroid cascade paints in final position via Skia — no entry animation to suppress. The FavoritesList sort partition is computed at render time; FlatList's default reorder is "instant" on iOS — no `LayoutAnimation`, no Reanimated layout animation. The only transition that could animate is S5 → S4 on auto-complete (AC #13) — the navigation library's default `"fade"` is respected when Reduce Motion is ON only if we do NOT override it. Pass `navigation.replace("ArmarioTuLook", { combinationId }, { animation: reducedMotion ? "none" : "fade" })` via the `navigation` method's third-argument options — check `@react-navigation/native-stack` docs for the exact signature; if the API does not accept animation options per-call, fall back to unconditional `replace()` and document the divergence (Reduce Motion trivially respected at the Skia level).

### Test patterns borrowed from 13.5

- Single shared nav mock with `goBack`, `push`, `popToTop`, `replace` all as `jest.fn()`.
- `useRoute` mock returning a fixture `{ params: { combinationId: "combo-3" } }`.
- `mockCombination` / `mockAssignments` / `mockItems` let variables for in-test mutation.
- `flushEffects()` helper using `await act(async () => { await new Promise((r) => setImmediate(r)); })` — reused verbatim.
- Per-test-file `jest.mock` blocks for `react-native-safe-area-context`, `expo-symbols`, `@/lib/haptics`, `@/stores/wardrobeStore`, `@/data/colorIndex`, `@/lib/armario/exportLookImage` (not needed for S5 but mock is free).
- The AUTO-TRANSITION test for AC #13 uses a `rerender` pattern — NOT a real Zustand mutation (the mock is a function, not a subscribable store). Simulate by mutating the `mockAssignments` array then calling `rerender(<Screen />)`.

### Why `sortFavoritesByCompleteness` is pure (no store access, no React)

Three reasons:
1. **Testability** — a pure function with plain arguments is trivially unit-testable; no hooks, no providers, no `render` calls.
2. **Reusability** — if we later want to apply the same partition to a widget (e.g., home-screen "your looks" section), the function is drop-in.
3. **Memo correctness** — `FavoritesList` calls it inside a `useMemo` with `(favorites, assignments, sortMode, hydrated)` deps. If the function read from the store directly, the memo would be blind to store changes and could serve stale data.

The function takes `combinations: Combination[]` (derived upstream from the `favorites` Set) + `assignments: CombinationAssignment[]` — no other deps.

### Project Structure Notes

- **New files:**
  - `src/lib/armario/getSuggestionCopy.ts` + `.test.ts`
  - `src/lib/armario/sortFavoritesByCompleteness.ts` + `.test.ts`
  - `src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx` + `.test.tsx`
  - `src/components/armario/FavoriteComboEnrichedCard.tsx` (+ `.test.tsx` if existing FavoritesList.test.tsx does not cover the full consumer-level assertions per AC #14 r–y; otherwise tests live in FavoritesList.test.tsx per "co-locate tests with the highest-level consumer" pattern from 13.4a)
- **Modified files:**
  - `src/lib/armario/drawPolaroidStack.ts` + `.test.ts` — `emptySlots` prop + dashed-border branch.
  - `src/navigation/types.ts` — add `ArmarioSugerenciaArmonia` to `FavoritesStackParamList`.
  - `src/navigation/FavoritesStack.tsx` — register screen.
  - `src/screens/armario/ArmarioFichaWadaScreen.tsx` + `.test.tsx` — rewire partial branch, delete `defaultViewLook`.
  - `src/components/armario/CompletenessBadge.tsx` + `.test.tsx` — add `variant="long"` prop.
  - `src/components/ComboCard.tsx` — add `ctaOverrideKey` + `accessibilityHintOverride` optional props.
  - `src/screens/FavoritesList.tsx` + `.test.tsx` — sort pipeline + enriched-card branch.
  - `src/i18n/locales/en.json` + `es.json` — add `armario.s5.*` + `armario.favorites.*` (18 new keys total in each locale).
  - `__mocks__/@shopify/react-native-skia.js` — additive: `PaintStyle`, `Skia.PathEffect.MakeDash`, paint `setStyle`/`setStrokeWidth`/`setPathEffect`.
- **Naming:**
  - Screen filename `ArmarioSugerenciaArmoniaScreen.tsx` (matches `ArmarioTuLookScreen`, `ArmarioFichaWadaScreen` convention).
  - Route name `ArmarioSugerenciaArmonia` (matches `ArmarioTuLook`, `ArmarioFichaWada` convention — NO underscores, NO hyphens).
  - Lib files verb-prefixed: `getSuggestionCopy`, `sortFavoritesByCompleteness` (matches `drawPolaroidStack`, `exportLookImage`, `saveCutoutAsWardrobeItem`).
  - Component filename `FavoriteComboEnrichedCard.tsx` (noun + adjective + type, clear single-purpose).

### References

- Epic 13 doc — `docs/planning/epic-13-armario-virtual.md` §Story 13.6 (lines 617–679).
- UX spec — `docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md` §S1 (lines 73–83 — Favorites enrichment), §S5 (lines 153–172 — partial screen), §6.4 (lines 302–320 — suggestion copy heuristic).
- UX screenshot — `docs/planning/feature-armario-virtual/screens/s5-sugerencia-armonia.png` + `s1-favoritos.png` — reference during on-device QA.
- Story 13.5 — `_bmad-output/implementation-artifacts/13-5-s4-tu-look-skia-composition-share.md` — `drawPolaroidStack`, `ArmarioTuLookScreen` patterns, test baseline, Reviewer Notes structure.
- Story 13.4b — `_bmad-output/implementation-artifacts/13-4b-armario-picker-assignment-mechanics.md` — S3 picker route contract + unfavorite cascade pattern.
- Story 13.4a — `_bmad-output/implementation-artifacts/13-4a-zero-state-ficha-wada-shared-components.md` — `CompletenessBadge`, `PolaroidCard` props + i18n `armario.badge.*` keys.
- Memory — `project_v140_epic13_start.md`, `project_home_redesign.md`, `project_favorites_redesign.md`, `project_s3_picker_ux_debt.md`, `feedback_no_analytics.md`, `feedback_visual_review.md`, `feedback_no_patches.md`, `feedback_always_validate.md`.
- CLAUDE.md — Story Scope (4-5 tasks), Rules of Hooks, Function-declared named exports, NativeWind className discipline, Haptics via `src/lib/haptics.ts`, Testing Discipline (AC-driven tests, `testID`), Mandatory Code Review.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7[1m])

### Debug Log References

- `pnpm test --silent --testPathPattern='(getSuggestionCopy|sortFavoritesByCompleteness)'` → 13/13 pass
- `pnpm test --silent --testPathPattern='drawPolaroidStack'` → 10/10 pass (+2 emptySlots tests)
- `pnpm test --silent --testPathPattern='ArmarioFichaWadaScreen'` → 15/15 pass (+1 new partial-branch push test, -1 deleted stub assertion)
- `pnpm test --silent --testPathPattern='ArmarioSugerenciaArmoniaScreen'` → 10/10 pass
- `pnpm test --silent --testPathPattern='CompletenessBadge'` → 7/7 pass (+3 `variant="long"` tests)
- `pnpm test --silent --testPathPattern='FavoritesList'` → 47/47 pass (+8 enrichment tests)
- `pnpm test` (full suite) → **783 passing / 60 pre-existing debt** (baseline 746 → +37 net new)
- `npx tsc --noEmit` → clean
- `pnpm lint` → clean

### Completion Notes List

**Test baseline delta:** 746 passing (post-13.5) → 783 passing (post-13.6) = **+37 net new tests**, above the +31 target. Zero NEW failures. The 60 pre-existing failures (OutfitVisualizer debt + i18n locale-detection debt #7) are unchanged.

**AC walkthrough (1-row-per-AC):**

| AC | Verified via |
|----|--------------|
| #1 — S2 partial-branch push to S5 | `ArmarioFichaWadaScreen.test.tsx` "view-look CTA pushes ArmarioSugerenciaArmonia when partial (2/3) and no onViewLook prop"; `onViewLook` seam preserved for both branches (renamed existing test). `defaultViewLook` constant + console.warn deleted. Route registered on `FavoritesStack.tsx` after `ArmarioTuLook`. |
| #2 — S5 layout structure (nav, title, badge, subtitle, canvas, suggestion card, CTAs) + defensive mount effects | `ArmarioSugerenciaArmoniaScreen.test.tsx` "renders back, combo title, badge, subtitle, Canvas, suggestion card, CTAs" + "goBack when combination missing" + "replace('ArmarioTuLook') when assignedCount === totalColors on mount" + "goBack when assignedCount === 0 on mount". |
| #3 — `emptySlots[]` + dashed-border + `+` glyph + signature alpha split | `drawPolaroidStack.test.ts` "emptySlots — card index 1 empty emits no drawImageRect AND draws dashed-border paint" + "empty first card does NOT move signature band; last filled card still carries Outfinder brand". |
| #4 — Suggestion card layout + shared handler with footer primary CTA | `ArmarioSugerenciaArmoniaScreen.test.tsx` "suggestion-card CTA tap → push(ArmarioPicker, {colorIndex: lowest})" + "screen-footer primary CTA tap fires same picker push". |
| #5 — `getSuggestionCopy` branches + edge cases | `getSuggestionCopy.test.ts` 7 tests covering `(0,3)`, `(2,3)`, `(1,3)`, `(0,4)`, `(3,4)`, `(1,4)`/`(2,4)`, and 4 invalid-input fallbacks with `__DEV__` warn spy. |
| #6 — FavoritesList enriched wrapper: badge + thumb strip + CTA override + iOS<17/no-hydration/no-wardrobe-state fallbacks | `FavoritesList.test.tsx` 4 new tests for enrichment rendering + 3 new tests for CTA override copy. `FavoriteComboEnrichedCard.tsx` composes `<ComboCard variant="compact" ctaOverrideKey />` + overlay chrome. |
| #7 — Completeness partition sort in `"recent"` mode; NOT applied on `"a-z"` / `"by-size"`; pure function | `sortFavoritesByCompleteness.test.ts` 6 tests (5-combo mixed, complete-DESC, partial-DESC, empty-insertion-order, empty-assignments, malformed totalColors). `FavoritesList.test.tsx` "recent-mode sort partitions" + "a-z sort mode does NOT apply the completeness partition". Function is pure — no React/Zustand imports. |
| #8 — Unfavorite cascade (from 13.4b) unchanged; sort recomputes on assignment removal | Verified via code path: cascade lives in `FavoriteButton.tsx` (reused); `sortFavoritesByCompleteness` re-runs on assignments change because `assignments` is a `useMemo` dep in `FavoritesList.tsx`. No behavior change to cascade modal. |
| #9 — S5 VoiceOver reading order + Canvas wrapper a11y label + empty-slot decorative status + 44pt touch targets | `ArmarioSugerenciaArmoniaScreen.tsx` uses `<View accessible accessibilityRole="image" accessibilityLabel={t("armario.s5.canvasA11y", ...)}>` around Canvas. Back button 48pt, CTAs 44pt+, suggestion card is a Pressable with shared label as primary CTA. |
| #10 — Enriched card VoiceOver: badge + thumb strip `accessibilityElementsHidden`, `accessibilityHintOverride` carries completeness hint, Pressable ≥ 44pt | `FavoriteComboEnrichedCard.tsx` sets `accessibilityElementsHidden={true}` + `importantForAccessibility="no-hide-descendants"` on badge + thumbs wrappers; passes `accessibilityHintOverride` to ComboCard (new prop). Absolute-positioned badge does not shrink Pressable. |
| #11 — Reduce Motion: no entry animation on Skia cascade, FlatList default reorder, S5 → S4 uses standard `replace` (no per-call animation override in this story — the tab-bar fade is already honored) | Skia paints in final position — verified by reading `drawPolaroidStack.ts` (no `withSpring`/`withTiming`). FlatList reorder is instant. `navigation.replace` uses stack default `"fade"`. |
| #12 — On-device QA | Deferred to merge-gate per 13.5 pattern. Story file AC #12 checklist stands as the reviewer's on-device runbook on iPhone 16 Pro simulator. |
| #13 — Auto-transition S5 → S4 with `didReplaceRef` guard | `ArmarioSugerenciaArmoniaScreen.test.tsx` "auto-transition: 2/3 → 3/3 during screen lifetime → navigation.replace fires ONCE (ref guard)". The defensive mount effect and the auto-transition use a single consolidated effect gated by `didReplaceRef` so a hydration bounce cannot fire `replace` twice. |
| #14 — All new/extended test files present and passing; ~777 target met | 7 test files created or extended: getSuggestionCopy (+7), sortFavoritesByCompleteness (+6), ArmarioSugerenciaArmoniaScreen (+10), FavoritesList (+8), ArmarioFichaWadaScreen (+1, -1), CompletenessBadge (+3), drawPolaroidStack (+2). Total **+37 net**. Final: 783 passing (target 777). |
| #15 — i18n keys added under `armario.s5.*` + `armario.favorites.*`; parity test passes | 18 new keys in `en.json` + `es.json` each. `src/i18n/__tests__/i18n.test.ts` key-parity passes (the 3 pre-existing locale-detection failures per debt #7 are NOT key-parity failures — they're `Intl.DateTimeFormat` mock issues). Old `armario.badge.*` keys untouched — S2/S4 short-variant callsites unchanged. |

**Implementation decisions worth flagging to reviewer (Reviewer Notes — Do Not Flag):**

1. **Single consolidated defensive+auto-transition effect** — Story Task 2.5 originally suggested splitting the defensive goBack/replace and the auto-transition into two effects. During implementation I consolidated into one (both use `navigation.replace("ArmarioTuLook")` under the same `didReplaceRef` guard). This produces strictly one `replace` call regardless of whether S5 is mounted-at-3/3 or auto-transitioned mid-session. The test at AC #13 verifies the "fires once" invariant across three rerenders. If a reviewer prefers two effects, the split is trivial — but the single-effect form eliminates a race where both effects could fire in the same render pass.

2. **Skia Jest mock extension** — Added `PaintStyle.{Fill, Stroke}` sentinel strings, `Skia.PathEffect.MakeDash`, and `setPathEffect` on the paint fake. Additive-only — no existing 746-test path was modified. The empty-slot test in `drawPolaroidStack.test.ts` reaches INTO the real mock object to introspect which paint received the dash pattern — pattern works because `Skia.Paint` is itself `jest.fn(mockPaint)`.

3. **`FavoriteComboEnrichedCard` badge positioning uses `position: "absolute"`** — This keeps the enriched card's Pressable hitbox full-width; the 8pt top/right offset clears the color strip. The badge wrapper sets `accessibilityElementsHidden={true}` so VoiceOver's rotor does not stop on it — its info is already in the outer Pressable's `accessibilityHintOverride`. Testing library's `getByTestId` respects `accessibilityElementsHidden`; tests use `{ includeHiddenElements: true }` to verify mount.

4. **Compact `ComboCard` CTA text is additive, not replacement** — The story phrased AC #6 as "replaces `comboCard.seeOutfit`". Compact variant didn't previously render `seeOutfit` text at all (only the tshirt icon). Implementation adds a new `<Text testID="combo-card-cta-override">` only when `ctaOverrideKey` is provided. The tshirt icon (`compact-shirt-icon`) still renders — zero visual regression for the 4 non-enriched ComboCard callsites (Combinations, ColorHome, etc.).

5. **Empty-bucket ordering inherits `favorites` Set insertion order** — Per Dev Notes trade-off: no AsyncStorage migration; the Set's insertion order provides a "favoritedAt" proxy via JS spec-guaranteed iteration order. Memo at `FavoritesList.tsx:96-119` takes `favorites` as a dep so reordering triggers a re-sort.

6. **EN/ES "No garments" disambiguation** — `armario.badge.none` is "No garments yet" / "Aún sin prendas-style" (short-variant, used in S2/S4 chrome). `armario.favorites.badgeNone` is "No garments" / "Sin prendas" (long-variant, used in enriched Favorites cards). Both coexist deliberately.

7. **Lint debt resolved as side-effect** — `ArmarioTuLookScreen.tsx:55` had pre-existing `interface ArmarioTuLookScreenProps {}` which Biome now flags as `noEmptyInterface`. Biome's `--write` auto-converted it to `type ... = {}` which still flagged `noBannedTypes`. Normalized both S4 and S5 to `type ... = Record<string, never>` (pattern already used by `FavoritesList.tsx:40`). If reviewer prefers to keep S4 untouched, revert that single line — but the current form is the only one that lints clean under Biome 2.4.6.

---

### 🔥 Post-dev UX iterations (2026-04-20) — REVIEWER NOTES — DO NOT FLAG

Alejandro iterated on the device/simulator immediately after the initial dev-story completed. Each iteration was validated visually and accepted. The following drifts from the ACs / initial implementation are **intentional product decisions** and should NOT be raised as bugs, regressions, or scope gaps in code review:

#### Iter 1 — FavoritesList enriched card: badge chrome redesign (AC #6)

**Drift from AC:** AC #6 specified a pill-style `<CompletenessBadge variant="long" />` absolute-positioned at `top: 8, right: 8` on the enriched card (over the color strip).

**Accepted final state:** A fine `<Text>` (Inter_400Regular 11pt, `wadaTokens.textTertiary`, no bg, no pill) rendered on the SAME bottom row as the favorite heart + tshirt icon, left-aligned.

**Journey:**
1. Initial: pill badge top-right over strip → blocked the Wada palette's visibility (user feedback: "se pierde la visualización del color").
2. Moved to `top: stripHeight + 6` below strip → still pill-style, felt "modal/heavy".
3. Stripped to plain text (no bg, no colored variant), re-positioned `bottom: 12, left: 12` inside a relative sub-wrapper.
4. User feedback: "desalineado con el corazón e icono camiseta". Refactored by adding a NEW prop `bottomRowLeadingText?: string` to `ComboCard` — the compact-variant bottom row switches to `justifyContent: "space-between"` when the prop is present and renders the text flush-left on the same row as the favorite button + tshirt icon.

**Reviewer action:** `variant="long"` remains a first-class API on `CompletenessBadge` (with 3 passing tests) for future callsites, but the enriched card no longer consumes it. The 3 long-variant tests are retained as forward-compatibility coverage. The new `bottomRowLeadingText` prop on `ComboCard` is additive, defaults to `undefined`, and does NOT change any existing call-site.

**Modified files in this iter:**
- `src/components/ComboCard.tsx` — new `bottomRowLeadingText?: string` prop; bottom row swaps `justify-end` ↔ `justify-between`.
- `src/components/armario/FavoriteComboEnrichedCard.tsx` — removed absolute badge + `CompletenessBadge` import; now passes `bottomRowLeadingText={badgeText}` to `ComboCard`.
- `src/screens/FavoritesList.test.tsx` — one assertion rewired from `enriched-card-p001-badge-inner` to `combo-card-bottom-row-leading`.

---

#### Iter 2 — S0 Zero State: flex layout with dynamic cascade sizing

**Drift from pre-13.6 baseline:** Pre-13.6, `ArmarioZeroStateScreen` used a `ScrollView` + absolute-positioned CTAs. User reported on-device that (a) the "Empezar a asignar prendas" CTA was superpuesto with the polaroid cascade, and (b) the screen was not "pantalla fija adaptada siempre".

**Accepted final state:** Full flex layout — back-button row → hero header (title + subtitle + dots) → **flex:1 cascade with `onLayout` + `computeCascadeLayout`** → fixed footer with primary/secondary CTAs. No `ScrollView` anywhere.

**Key mechanic:** `computeCascadeLayout(containerW, containerH, count)` returns `{ wrapperWidth, overlapPx }` so that for any N (2/3/4/5), the stack fits inside the measured container. Card sizing is height-constrained OR width-constrained, whichever produces the smaller card (with a 94% rotation-safety margin). Overlap is proportional to card height (18%), not a fixed pixel — the cascade looks identical at any scale.

**Pre-layout render:** cards render at fallback width `"62%"` with `opacity: 0` so RN Testing Library can find testIDs and no first-frame flash reaches the user. `onLayout` triggers the real dimensions on the next render.

**Reviewer action:** The story file does NOT touch S0 in its ACs — this change is **adjacent scope**, justified by user's iteration feedback that S0 was broken on-device. It belongs to the same visual language push (S0/S4/S5 all use measured-cascade layouts now — consistent family).

**Modified files in this iter:**
- `src/screens/armario/ArmarioZeroStateScreen.tsx` — full rewrite of the body; removed `ScrollView` + `useReducedMotion` (no longer referenced); added `useSafeAreaInsets` + `onLayout` + `computeCascadeLayout` helper.
- Existing 6 tests pass unchanged.

---

#### Iter 3 — S2 Ficha Wada: layout rewrite → revert to UX spec

**Drift from the UX spec at `docs/planning/feature-armario-virtual/screens/s2-ficha-wada.png`:** In mid-iteration I explored a **vertical landscape-card cascade** (color strip on left, garment slot on right) as an alternative visual per the user's initial hypothesis that vertical might feel more consistent with S0/S4/S5.

**Accepted final state:** Reverted to the **horizontal-columns layout** that matches the UX spec screenshot exactly:
- One column per color (flex: 1, so N=2/3/4 all balance)
- Per column, stacked top→bottom: color swatch (aspectRatio 1.35) → garment thumb (aspectRatio 1) or dashed `+` tile → `nameEn` (Inter_500Medium 14pt) → `Cambiar →` / `Asignar →` (Inter 13pt tertiary, **arrow IS present** — user accepted this as per-mockup)
- No `ScrollView`; `<View flex:1 />` spacer below cards pushes the "Ver tu look" CTA to the bottom
- Filled columns additionally render a "Remove" Pressable (44pt touch target) below the Cambiar link

**Journey:**
1. Initial impl (story spec): preserved the pre-13.6 compact horizontal-slots layout with some polish. User reported "muy pegado" on N=3, "huecos" on N=2, cards shrunk on N=4.
2. Explored vertical cards (color-strip + right-slot landscape cards with `computeSlotLayout`) — iterated 2 times on dimensions.
3. User showed me the UX spec screenshot and pointed out the intended horizontal-column design — reverted.

**Reviewer action:** The pre-13.6 S2 layout used `flex-row` with `aspectRatio: 1` tiles + dashed border + `+` overlay. The redesigned S2 is also `flex-row` with per-column stacked content — same structural family as the UX spec. **Do NOT flag** the removed `TU ARMARIO` label re-addition, nor the arrow `→` on the Cambiar/Asignar links, nor the color-swatch-on-top composition — all intentional per the mockup.

**Notable changes:**
- Replaced `ScrollView` with flex layout + bottom-pinned CTA.
- Removed test `queryByText("Coral Pink") === null` (pre-13.6 behavior where color name was VoiceOver-only) → replaced with `getByText("Coral Pink")` — color name is now visibly rendered below the swatch per UX spec.
- Test `queryByText("Assign →") === null` removed; arrow is now intentional per mockup. New assertion: `getAllByText("Assign \u2192").length > 0` / `getAllByText("Change \u2192").length > 0`.
- Remove button `minHeight: 44 + minWidth: 44` kept (CLAUDE.md touch-target rule).

**Modified files in this iter:**
- `src/screens/armario/ArmarioFichaWadaScreen.tsx` — layout rewrite; keeps all navigation logic / handlers / defensive effects unchanged. Dropped: `ScrollView`, `useReducedMotion` still imported (used by modal animation), FAB_PROTRUSION still referenced for CTA bottom padding. Added: `useSafeAreaInsets`, "TU ARMARIO" label restored, arrow glyphs on link labels.
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — 2 assertions rewritten (see above).

---

#### Iteration files summary (delta from initial dev-story completion)

| File | Iter 1 (badge) | Iter 2 (S0) | Iter 3 (S2 layout) |
|------|----------------|-------------|---------------------|
| `src/components/ComboCard.tsx` | ✏️ new `bottomRowLeadingText` prop | — | — |
| `src/components/armario/FavoriteComboEnrichedCard.tsx` | ✏️ removed absolute badge + CompletenessBadge ref | — | — |
| `src/screens/FavoritesList.test.tsx` | ✏️ one testID rewired | — | — |
| `src/screens/armario/ArmarioZeroStateScreen.tsx` | — | ✏️ full body rewrite | — |
| `src/screens/armario/ArmarioFichaWadaScreen.tsx` | — | — | ✏️ layout rewrite |
| `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` | — | — | ✏️ 2 assertions rewritten |

All three iterations passed `pnpm test` / `pnpm lint` / `npx tsc --noEmit` at each step. Final suite: **783 passing / 60 pre-existing debt** — identical to post-initial-dev state.

---

**On-device QA checklist (AC #12 a-j) — DEFERRED TO MERGE GATE** (pattern from 13.5): reviewer runs the iPhone 16 Pro simulator checklist before merging `story/13-6-s5-sugerencia-armonia-favorites-badges` → `epic-13`.

### File List

**New files:**
- `src/lib/armario/getSuggestionCopy.ts`
- `src/lib/armario/getSuggestionCopy.test.ts`
- `src/lib/armario/sortFavoritesByCompleteness.ts`
- `src/lib/armario/sortFavoritesByCompleteness.test.ts`
- `src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx`
- `src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx`
- `src/components/armario/FavoriteComboEnrichedCard.tsx`

**Modified files:**
- `src/lib/armario/drawPolaroidStack.ts` — `emptySlots[]` + `emptySlotPlusFont` props, dashed-border / `+` glyph / suppressed shadow branch, signature alpha split (0.7 filled / 0.5 empty-last).
- `src/lib/armario/drawPolaroidStack.test.ts` — +2 tests for emptySlots (dd, ee).
- `src/navigation/types.ts` — `ArmarioSugerenciaArmonia: { combinationId }` added to `FavoritesStackParamList`.
- `src/navigation/FavoritesStack.tsx` — `<Stack.Screen name="ArmarioSugerenciaArmonia" />` registered.
- `src/screens/armario/ArmarioFichaWadaScreen.tsx` — partial-branch `handleViewLook` now pushes `ArmarioSugerenciaArmonia`; `defaultViewLook` constant + its `__DEV__` warn deleted.
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — replaced stub-assertion partial test with the `push("ArmarioSugerenciaArmonia", …)` test; kept the `onViewLook` seam-wins test renamed for clarity. Net +1 / -0 (the deleted stub assertion was rewired, not removed outright).
- `src/screens/armario/ArmarioTuLookScreen.tsx` — `ArmarioTuLookScreenProps` type shape normalized to `Record<string, never>` (Biome `noEmptyInterface`/`noBannedTypes` fix; no behavior change).
- `src/components/armario/CompletenessBadge.tsx` — `variant?: "short" | "long"` optional prop added (default `"short"`). Long variant reads `armario.favorites.badge*` keys.
- `src/components/armario/CompletenessBadge.test.tsx` — +3 tests for long variant (complete / partial / none).
- `src/components/ComboCard.tsx` — `ctaOverrideKey?` + `accessibilityHintOverride?` + **`bottomRowLeadingText?` (Iter 1)** optional props added. Compact variant renders a `combo-card-cta-override` Text when `ctaOverrideKey` is set; bottom row swaps `justify-end` ↔ `justify-between` when `bottomRowLeadingText` is present, rendering it left of the favorite heart + tshirt icon.
- `src/screens/FavoritesList.tsx` — wardrobe `items` subscription + completeness-partition sort in recent mode (gated to `supportsArmario && hydrated && assignments.length > 0`) + enriched-wrapper branch in `renderComboCard` (gated to `supportsArmario && hydrated && hasAnyWardrobeState`).
- `src/screens/FavoritesList.test.tsx` — +8 tests for enrichment / sort / CTA override. **(Iter 1)** one testID query rewired from `enriched-card-*-badge-inner` to `combo-card-bottom-row-leading`.
- **(Iter 2) `src/screens/armario/ArmarioZeroStateScreen.tsx`** — full body rewrite to flex layout: removed `ScrollView` + `useReducedMotion`, added `useSafeAreaInsets` + `onLayout` + `computeCascadeLayout` helper. No AC behavior change; fixes "CTA superpuesto + pantalla no fija" on-device feedback.
- **(Iter 3) `src/screens/armario/ArmarioFichaWadaScreen.tsx`** — layout rewrite to the horizontal-columns design in the UX spec (`docs/planning/feature-armario-virtual/screens/s2-ficha-wada.png`). Navigation + defensive-effect logic unchanged. Dropped `ScrollView` + absolute CTA; added `useSafeAreaInsets`, bottom-pinned CTA row, "TU ARMARIO" label, per-column composition (swatch + thumb/dashed + nameEn + "Cambiar →" / "Asignar →").
- **(Iter 3) `src/screens/armario/ArmarioFichaWadaScreen.test.tsx`** — 2 assertions rewritten to match the UX spec (color name now visibly rendered + arrow glyph on link labels).
- `src/i18n/locales/en.json` — +18 keys under `armario.s5.*` (9) and `armario.favorites.*` (9).
- `src/i18n/locales/es.json` — +18 parity keys.
- `__mocks__/@shopify/react-native-skia.js` — additive: `PaintStyle.{Fill, Stroke}`, `Skia.PathEffect.MakeDash`, `setPathEffect` on paint fake. Preserves pre-existing 13.5 mock surface.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-20 | Story 13.6 implementation complete. S5 Sugerencia Armonía screen + `drawPolaroidStack` emptySlots extension + FavoritesList completeness-partition sort + enriched cards (badge + thumbs + CTA override). +37 net new tests (746 → 783 passing). Status ready-for-dev → review. | Claude (Opus 4.7) |
| 2026-04-20 | **Post-dev Iter 1** — FavoritesList enriched-card badge redesigned from pill → fine text, and moved from absolute top-right to a shared row with the favorite heart + tshirt icon via new `bottomRowLeadingText` prop on `ComboCard`. User UX iteration; tests rewired, no regression. See "Reviewer Notes — Do Not Flag" § Iter 1. | Claude (Opus 4.7) |
| 2026-04-20 | **Post-dev Iter 2** — `ArmarioZeroStateScreen` (S0) rewritten from `ScrollView` + absolute CTAs to a flex layout with `onLayout`-measured cascade. Adjacent scope; fixes on-device feedback ("CTA superpuesto, no es pantalla fija"). 6/6 tests pass. See § Iter 2. | Claude (Opus 4.7) |
| 2026-04-20 | **Post-dev Iter 3** — `ArmarioFichaWadaScreen` (S2) rewritten to the horizontal-columns UX-spec composition (swatch + thumb/dashed + nameEn + Cambiar/Asignar →). Two test assertions updated (color name now visibly rendered + arrow glyph retained per mockup). 15/15 tests pass. See § Iter 3. | Claude (Opus 4.7) |

---

### Review Findings

Code review executed 2026-04-21. 3 parallel layers: Blind Hunter · Edge Case Hunter · Acceptance Auditor.
**Summary: 0 `decision-needed` · 12 `patch` · 10 `defer` · 10 dismissed as noise.**

#### Patches

- [ ] [Review][Patch][HIGH] FavoriteComboEnrichedCard: `thumbnailPath === ""` cuenta como ranura asignada — cambiar `?? null` a `|| null` en la derivación de `thumbs` para que strings vacíos caigan a `null` [src/components/armario/FavoriteComboEnrichedCard.tsx:~53,65]
- [ ] [Review][Patch][MEDIUM] FavoriteComboEnrichedCard: dos `useWardrobeStore` sin `shallow` → double re-render en hidratación — combinar en un selector con `shallow` [src/components/armario/FavoriteComboEnrichedCard.tsx:~36-37]
- [ ] [Review][Patch][MEDIUM] ArmarioSugerenciaArmoniaScreen: `picture` useMemo puede recibir `garmentImages[i] === undefined` (en vez de `null`) cuando el array se resetea async — añadir guard de longitud + cambiar `=== null` a `!garmentImages[i]` [src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx:~300-308]
- [ ] [Review][Patch][MEDIUM] ArmarioSugerenciaArmoniaScreen: back chevron + secondary CTA pueden ambos llamar `navigation.goBack()` en double-tap — añadir `isNavigating` ref (patrón de FavoritesList/ArmarioZeroStateScreen) [src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx:~777-780]
- [ ] [Review][Patch][MEDIUM] ArmarioZeroStateScreen: `accessible={false}` en el container NO propaga a hijos en React Native — VoiceOver puede enfocar tarjetas con `opacity: 0` antes del primer layout; añadir `accessibilityElementsHidden={!measured}` en cada wrapper `<View>` individual [src/screens/armario/ArmarioZeroStateScreen.tsx:~1940-1958]
- [ ] [Review][Patch][MEDIUM] i18n inconsistencia: `armario.favorites.a11yHintPartial` usa `{{count}}` pero las claves de badge usan `{{assigned}}` — renombrar a `{{assigned}}` en en.json/es.json y en `FavoriteComboEnrichedCard.tsx` para evitar confusión con pluralización i18next [src/i18n/locales/en.json:~295-296]
- [ ] [Review][Patch][LOW] getSuggestionCopy.test.ts: falta el test explícito de combo de 2 colores requerido por AC #5 — añadir `(1,2)→suggestionCopyAccessory` y `(0,2)→suggestionCopyMain` [src/lib/armario/getSuggestionCopy.test.ts]
- [ ] [Review][Patch][LOW] ArmarioFichaWadaScreen: `handleViewLook` no guarda `totalColors === 0` — flash de S5 antes del `goBack` defensivo; añadir `if (totalColors === 0) return;` [src/screens/armario/ArmarioFichaWadaScreen.tsx:~113-128]
- [ ] [Review][Patch][LOW] drawPolaroidStack: `plusFontSize` re-computado internamente (`h * 0.18`) puede divergir del tamaño con que se cargó la fuente en el screen → glifo `+` descentrado; usar el tamaño real de la fuente para el offset del baseline [src/lib/armario/drawPolaroidStack.ts:~424]
- [ ] [Review][Patch][LOW] drawPolaroidStack: `plusMeasure?.width || 0` falsifica anchos positivos pequeños — cambiar a `?? 0` [src/lib/armario/drawPolaroidStack.ts]
- [ ] [Review][Patch][LOW] FavoriteComboEnrichedCard: la variable `t` del callback `.filter((t) => t !== null)` sombrea `t` de `useTranslation` — renombrar a `thumb` [src/components/armario/FavoriteComboEnrichedCard.tsx:~65]
- [ ] [Review][Patch][LOW] ArmarioSugerenciaArmoniaScreen.test.tsx: fixture `setupPartial1of3MidSlotMissing` configura 2 asignaciones (2/3) pero el nombre dice "1of3" — renombrar a `setupPartial2of3MidSlotMissing` [src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx:~1079]

#### Deferred

- [x] [Review][Defer] sortFavoritesByCompleteness: `NaN` en `assignedAt` contamina el sort DESC — fix pertenece al validador `isCombinationAssignment` en wardrobeStore [src/lib/armario/sortFavoritesByCompleteness.ts:~42-43] — deferred, fix fuera de scope de esta story
- [x] [Review][Defer] FavoritesList: `cardWidth` puede ser 0 en el primer render — se auto-recupera en el siguiente evento de layout [src/screens/FavoritesList.tsx:~86-88] — deferred, pre-existing pattern
- [x] [Review][Defer] drawPolaroidStack: sin `__DEV__` warning cuando `emptySlotPlusFont` es `undefined` pero `emptySlots` tiene entradas `true` — degradación visual (sin glifo `+`), sin crash [src/lib/armario/drawPolaroidStack.ts] — deferred, dev-only guardrail
- [x] [Review][Defer] sortFavoritesByCompleteness: sin guard explícito `sortMode === "recent"` — actualmente seguro por early returns de a-z/by-size; riesgo de mantenimiento futuro [src/screens/FavoritesList.tsx:~1055-1057] — deferred, no bug actual
- [x] [Review][Defer] CompletenessBadge.test.tsx: aserciones de strings exactas sin mock de i18n — funciona porque el harness carga en.json; frágil en CI sin locale configurado [src/components/armario/CompletenessBadge.test.tsx] — deferred, test infrastructure
- [x] [Review][Defer] drawPolaroidStack: intervalos de dash fijos `[16, 10]` independientes del tamaño de la tarjeta — aspecto visual en dispositivos muy pequeños/iPad [src/lib/armario/drawPolaroidStack.ts:~422-424] — deferred, ajuste cosmético post-épica
- [x] [Review][Defer] S5 test (p): aserta string renderizado `"second layer"` en lugar de spy sobre la clave i18n `armario.s5.suggestionCopyLayer` — funcional pero acoplado a la traducción EN [src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx:~271] — deferred, minor spec deviation
- [x] [Review][Defer] Reduce Motion: `navigation.replace("ArmarioTuLook")` en auto-transición no pasa `animation: "none"` — escape hatch invocado per Dev Notes §Reduce Motion (API native-stack no acepta override per-call); documentado en AC #11 completion row [src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx:~296] — deferred, API limitation documented
- [x] [Review][Defer] Render-time TOCTOU: `garmentImages` puede tener longitud antigua durante el ciclo de reset async — parcialmente mitigado por P3 (length guard); la variante strict-mode double-invoke permanece teórica [src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx:~688-710] — deferred, pre-existing pattern from 13.5
- [x] [Review][Defer] drawPolaroidStack: si un caller futuro pasa `emptySlots` sin `emptySlotPlusFont`, el dashed border se dibuja pero el glifo `+` se silencia (sin crash) — añadir `__DEV__` assert cuando sea conveniente [src/lib/armario/drawPolaroidStack.ts] — deferred, future-caller guardrail
