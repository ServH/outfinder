# Story 14.11: Incomplete-looks retention surface

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **returning user of the Mis Looks tab on iOS 17+ who has at least one saved look with incomplete garment assignments (`X < N` — either `X = 0` after "Guardar para luego" in Story 14.9, or `0 < X < N` after partial auto-save in Story 14.8)**,
I want **a dedicated "En curso" section rendered at the top of the Mis Looks scroll view (between the "+ Nuevo look" CTA from Story 14.10 and the completed-looks grid) that surfaces my incomplete looks as a horizontal-scroll strip of tiles (each tile showing the Wada combination's mini color swatches, a completeness badge `X/N`, and the Japanese + English combination name) and navigates me directly into `ArmarioFichaWadaScreen` for the tapped combination on tap**,
so that **the Mis Looks tab becomes a soft return-reason engine (FR16) by exposing partially-finished looks as a clear "come back and finish these" affordance, completed looks migrate cleanly into a separate "Mis looks completos" grid section with its own header (preserving the existing ComboCard compact layout from Epic 9), and the transition when a look flips from incomplete → complete (by user assigning the last slot inside Ficha Wada) is a clean re-render: the tile disappears from "En curso" and the completed card appears in "Mis looks completos" below — no animation required for v1 (Reduce Motion N/A)**.

## Acceptance Criteria

1. **Given** `src/screens/FavoritesList.tsx` is rendered on iOS 17+ (`useIsIOS17OrNewer() === true`, `useMisLooksStore.hydrated === true`) with at least one favorite combination where the assignment count `X < total Wada colors N` (either `X = 0` after "Guardar para luego" per Story 14.9, or `0 < X < N` after partial assignment per Story 14.8), **When** the render tree is inspected, **Then** a new `<IncompleteLooksSection />` component is rendered INSIDE the `ListHeaderComponent` memo at `FavoritesList.tsx:206–244`, positioned as a **sibling AFTER the existing `<NewLookCtaCard onPress={handleNewLookPress} />` at line 209 but BEFORE the existing `<View testID="sort-pills-row">` at line 210**. Exact rendering order inside the outer `<View>`:
    ```tsx
    <View>
        <NewLookCtaCard onPress={handleNewLookPress} />   {/* line 209 — unchanged */}
        <IncompleteLooksSection                           {/* NEW */}
            incompleteLooks={incompleteLooks}
            onTilePress={handleIncompleteTilePress}
        />
        <View testID="sort-pills-row" ...>{/* line 210 — unchanged */}</View>
    </View>
    ```
    **And** the sort-pills row remains the 2nd header child (was 2nd, still 2nd visually after the En curso strip — from the user's scroll perspective the order is: "+ Nuevo look" → En curso strip → sort-pills → "Mis looks completos" section header → grid). **And** if `incompleteLooks.length === 0` OR iOS < 17 OR not hydrated, the section returns `null` (graceful hide, no empty slot, no placeholder per UX-DR5 "Empty state" at `ux-design-epic-14.md:572`).

2. **Given** the ComboCard grid below needs to show ONLY complete looks when the En curso section is active, **When** `incompleteLooks.length > 0 && supportsArmario && hydrated`, **Then** the `FlatList`'s `data` prop MUST pass `completeLooks` (the partitioned complement) NOT the full `combinations`. **And** a new section label `<View testID="complete-section-header">` with the copy `t("favorites.completeSection.title")` → `"Mis looks completos"` / `"My completed looks"` is rendered as the **last child of the `ListHeaderComponent` memo's outer `<View>`**, positioned AFTER the sort-pills row. Full ListHeaderComponent tree when partitioning is active:
    ```tsx
    <View>
        <NewLookCtaCard />
        <IncompleteLooksSection ... />
        <View testID="sort-pills-row">...</View>
        <View testID="complete-section-header" ...>{/* NEW */}
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, ... }}>
                {t("favorites.completeSection.title")}
            </Text>
        </View>
    </View>
    ```
    **And** when `incompleteLooks.length === 0` (all favorites are complete, or no armario state), the `complete-section-header` is also hidden — the screen looks byte-identical to its pre-14.11 state (no redundant "Mis looks completos" label when there's nothing to contrast it with). **And** the legacy path (`!supportsArmario || !hydrated`) continues to render `combinations` (unpartitioned, via existing `sortFavoritesByCompleteness` fallback) and hides both the En curso section AND the complete-section-header — preserving iOS <17 behavior byte-for-byte.

3. **Given** UX-DR5 (`ux-design-epic-14.md:540–594`) specifies the En curso surface, **When** `<IncompleteLooksSection>` renders, **Then** it produces:
    - **Outer container**: `<View testID="incomplete-looks-section" accessibilityRole="none" style={{ marginTop: 16, marginBottom: 8 }}>`.
    - **Section header row**: `<View accessibilityRole="header" accessibilityLabel={t("favorites.incompleteSection.a11yLabel")} className="px-4 mb-3">` containing a `<Text>` with `fontFamily: "Inter_500Medium", fontSize: 13, color: wadaTokens.textSecondary` rendering `t("favorites.incompleteSection.title")` → `"En curso"` / `"In progress"` (per UX-DR5 line 549–551 "Inter Medium 13pt muted"). NO divider hairlines around the header text (UX-DR5 shows `─── En curso ───` as ASCII notation; the implementation uses vertical whitespace, not drawn lines — matches the rest of the app's section-label idiom; Pencil TODO at `ux-design-epic-14.md:591` still open on exact tile dims, not on header dividers).
    - **Horizontal FlatList**: `<FlatList horizontal showsHorizontalScrollIndicator={false} testID="incomplete-looks-list" data={incompleteLooks} keyExtractor={item => item.id} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} renderItem={renderIncompleteTile} />` (UX-DR5 line 574 "horizontal ScrollView (or FlatList horizontal) with 16pt padding, 12pt gap between tiles").
    - **Each tile** (rendered by `renderIncompleteTile` — an inner helper, NOT a separately exported component — to avoid over-factoring for a single-call-site use):
      - Root: `<Pressable testID={`incomplete-tile-${item.id}`} accessibilityRole="button" accessibilityLabel={t("favorites.incompleteTile.a11yLabel", { name, assigned, total, remaining })} accessibilityHint={t("favorites.incompleteTile.a11yHint")} onPress={() => onTilePress(item.id)}>`.
      - Style: `{ width: 160, height: 112, backgroundColor: wadaTokens.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: wadaTokens.hairline, padding: 10, justifyContent: "space-between" }` (UX-DR5 lines 562 + 567–568: "160pt × 112pt", "bg-elevated, hairline border, 12pt corner radius").
      - **Top row** — mini color swatches: `<View style={{ flexDirection: "row", gap: 4 }}>` containing `combination.colors.map((color, idx) => <View key={idx} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color.hex }} />)`. UX-DR5 says "3 mini color swatches (circles 24pt)" — but combinations have 2–5 colors (see `src/data/types.ts:25–30` + `src/data/colorIndex.ts`); render ALL colors, sized to 20pt (not 24pt) to keep N≥4 combinations from overflowing the 160pt tile width (4 swatches × 24pt + 3 gaps × 4pt = 108pt OK, but 5 swatches × 24pt + 4 gaps = 136pt crowds the padding; 20pt × 5 + 16pt gaps = 116pt is clean). 20pt also matches the `PaletteStrip` sizing idiom in the app.
      - **Center row** — CompletenessBadge (existing, from Epic 13 S5): `<CompletenessBadge assigned={assignedCount} total={combination.colors.length} testID={`incomplete-tile-${item.id}-badge`} />`. Default `variant="short"` (short variant renders `X/N` glyph + color; see `src/components/armario/CompletenessBadge.tsx:18–31`). DO NOT pass `variant="long"` — the tile is compact; the short `X/N` is correct per UX-DR5 line 565 "X/N ratio".
      - **Bottom row** — Wada combination name: `<Text numberOfLines={1} style={{ fontFamily: "NotoSerifJP_500Medium", fontSize: 12, color: wadaTokens.textPrimary }}>{combination.nameJp}</Text>` + (below, ONLY if space allows per Dynamic Type — use a simple 2-line stack always): `<Text numberOfLines={1} style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: wadaTokens.textSecondary }}>{combination.nameEn}</Text>` (UX-DR5 line 566 "Japanese + English truncated if needed, Noto Serif JP 12pt" — interpreted as "JP primary, EN secondary stacked" following the `WadaHeader.tsx` / `ComboCard.tsx` precedent).
    - **Haptic**: `onTilePress` (parent-injected) fires `hapticLight()` BEFORE calling `navigation.push("ArmarioFichaWada", { combinationId })` — haptic lives in the parent handler, NOT inside the tile (mirrors Story 14.10's "parent owns nav + haptic" pattern for non-card affordances; see `FavoritesList.tsx:72–75` `handleSettingsPress`).

4. **Given** the Japanese + English bilingual convention in combo tiles (UX-DR5 line 566), **When** locale `en` is active, **Then** the tile still renders `combination.nameJp` (the Japanese Wada romanized name — it's a proper noun, not localized; see `src/data/colorIndex.ts` + `Combination.nameJp` / `nameEn` type in `src/data/types.ts:28–29`). **And** `combination.nameEn` is rendered below as the translation subtitle. **And** under ES locale the same two-line rendering applies (JP proper noun + EN English name) — matching `WadaHeader.tsx` and `ArmarioFichaWadaScreen.tsx` idioms. **And** `numberOfLines={1}` on BOTH text nodes prevents overflow from pushing content outside the 112pt tile height; truncation with `…` is acceptable (the a11y label includes the full name).

5. **Given** the selector / view-model for "incomplete looks", **When** a new pure function is implemented, **Then** it lives at `src/lib/armario/selectIncompleteLooks.ts` with the signature:
    ```ts
    export function selectIncompleteLooks(
        combinations: Combination[],
        assignments: CombinationAssignment[],
    ): Combination[];
    ```
    **And** its behavior per UX-DR5 line 570 "Most recent first (sorted by `updatedAt` descending)" is implemented as:
    - Group `assignments` by `combinationId` and compute `{ assignedCount, maxAssignedAt }` per combination (mirrors `sortFavoritesByCompleteness.ts:38–51`).
    - Filter `combinations` to keep ONLY those where `assignedCount < combination.colors.length` — this captures BOTH partial (`0 < X < N`) and empty (`X === 0`) looks.
    - Sort the kept combinations by:
        1. Primary: `maxAssignedAt` DESCENDING (most recent activity first).
        2. Tiebreaker (equal timestamps, or empties with `maxAssignedAt = 0`): preserve INPUT order (stable sort). Input order in FavoritesList is `favorites` Set insertion order, which is the proxy for "favoritedAt desc" per `sortFavoritesByCompleteness.ts` Dev Notes.
    - Returns a new array (does NOT mutate inputs).
    **And** the file exports `selectIncompleteLooks` as a named export ONLY (no default export), matching the `sortFavoritesByCompleteness.ts` precedent byte-for-byte. **And** there is NO `selectCompleteLooks` companion function — the complete set is derived inside `FavoritesList.tsx` via `combinations.filter(c => !incompleteIds.has(c.id))` where `incompleteIds = new Set(incompleteLooks.map(c => c.id))`, avoiding a duplicate group-by pass.

6. **Given** `FavoritesList.tsx` needs to derive the two partitions, **When** the wiring is implemented, **Then** inside `FavoritesList()` at around line 114 (where the existing `combinations` `useMemo` lives), add a new `useMemo` that computes both partitions downstream of the existing `combinations` computation:
    ```tsx
    const { incompleteLooks, completeLooks } = useMemo(() => {
        // Legacy path: if armario features are off, return empty incomplete + all as "complete"
        // (the label + section hide in AC #1 / AC #2 handle this case implicitly via length checks).
        if (!supportsArmario || !hydrated) {
            return { incompleteLooks: [] as Combination[], completeLooks: combinations };
        }
        const incomplete = selectIncompleteLooks(combinations, assignments);
        const incompleteIds = new Set(incomplete.map((c) => c.id));
        const complete = combinations.filter((c) => !incompleteIds.has(c.id));
        return { incompleteLooks: incomplete, completeLooks: complete };
    }, [combinations, assignments, supportsArmario, hydrated]);
    ```
    **And** the `FlatList` at line 303 now binds `data={completeLooks}` (was `data={combinations}`). **And** the existing `sortMode` still affects the completed grid because `combinations` (which feeds `completeLooks`) is already sorted by the existing `combinations` useMemo at line 114–137 according to `sortMode` — the partition preserves that order within the complete bucket. **And** the En curso section's OWN internal ordering (maxAssignedAt desc) is INDEPENDENT of `sortMode` per UX-DR5 line 570 — sort pills never reorder the En curso strip, by design (the strip is a retention surface with its own semantics: "most recent activity first"; A-Z or by-size would defeat the "come back and finish these" UX intent).

7. **Given** `handleIncompleteTilePress` is a new inner handler inside `FavoritesList()`, **When** implemented, **Then** declare it via `useCallback` adjacent to the existing `handleComboPress` at `FavoritesList.tsx:143–174`:
    ```tsx
    const handleIncompleteTilePress = useCallback(
        (combinationId: string) => {
            if (isNavigating.current) return;
            isNavigating.current = true;
            hapticLight();
            navigation.push("ArmarioFichaWada", { combinationId });
        },
        [navigation],
    );
    ```
    **And** the `isNavigating.current` guard prevents double-tap races (mirrors `handleComboPress`'s guard at line 145–146; since `isNavigating` is reset by `useFocusEffect` at line 107–112 when the user swipes back, the guard works correctly). **And** the push directly to `ArmarioFichaWada` (NOT through `ArmarioZeroState`) is correct because an incomplete look by definition has `X ≥ 0` favorited state AND, per the UX-DR5 semantics, is already surfaced precisely because the user has begun engaging with it — `ArmarioZeroState` is reserved for first-visit-after-favoriting per Story 13.4a (`FavoritesList.tsx:155–162` `@wardrobe:s0_seen_for_${id}` logic); incomplete-surface tiles are post-S0 by design. This is an intentional UX-DR5 trade-off: the retention surface skips S0 because the user is a returning — not new — visitor to this combination.

8. **Given** the "Mis looks completos" section header copy (AC #2) must integrate with Dynamic Type + VoiceOver, **When** rendered, **Then** its container is:
    ```tsx
    {incompleteLooks.length > 0 ? (
        <View
            testID="complete-section-header"
            accessibilityRole="header"
            accessibilityLabel={t("favorites.completeSection.a11yLabel")}
            className="px-4 mt-4 mb-2"
        >
            <Text
                style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    color: wadaTokens.textSecondary,
                }}
            >
                {t("favorites.completeSection.title")}
            </Text>
        </View>
    ) : null}
    ```
    **And** `completeLooks.length === 0` is ALSO a valid state (user has only incomplete looks — e.g., one "Guardar para luego" entry with zero assignments). In that case the header still renders (empty grid below it is acceptable — VoiceOver announces the header which signals "this is where completed looks would appear"). Alternative: hide header when `completeLooks.length === 0` AND `incompleteLooks.length > 0`. **Chosen:** hide when `completeLooks.length === 0` AND incomplete section shows — the label without content reads as confusing empty-state UI. Expand AC #2 condition to:
    ```tsx
    incompleteLooks.length > 0 && completeLooks.length > 0
    ```
    **And** the empty case (`combinations.length === 0`, both buckets empty) continues to render the existing `EmptyState` via the early-return at `FavoritesList.tsx:281–296` — unchanged.

9. **Given** the 5 new i18n keys × 2 locales this story introduces, **When** this story merges, **Then** the following are added to `src/i18n/locales/es.json` inside the existing `"favorites"` block at lines 48–65 (insert a new `"incompleteSection"` sub-block AND a new `"incompleteTile"` sub-block AND a new `"completeSection"` sub-block AFTER the existing `"newLookCta"` at lines 59–64, before the closing `}` of `"favorites"`):
    - ES `favorites.incompleteSection.title`: `"En curso"` (UX-DR5 `ux-design-epic-14.md:549`, canonical copy table `:767`)
    - ES `favorites.incompleteSection.a11yLabel`: `"En curso. Tus looks a medias."` (UX-DR5 line 581 verbatim)
    - ES `favorites.incompleteTile.a11yLabel`: `"Look {{name}}. {{assigned}} de {{total}} prendas asignadas. Faltan {{remaining}}."` (UX-DR5 line 582 verbatim, i18next interpolation)
    - ES `favorites.incompleteTile.a11yHint`: `"Abre este look para asignar más prendas"` (UX-DR5 line 582 verbatim)
    - ES `favorites.completeSection.title`: `"Mis looks completos"` (UX-DR4 `:473` + canonical table `:768`)
    - ES `favorites.completeSection.a11yLabel`: `"Mis looks completos"` (same — no expansion needed)

    **And** EN mirrors at `src/i18n/locales/en.json` (same nested structure):
    - EN `favorites.incompleteSection.title`: `"In progress"` (canonical table `:767`)
    - EN `favorites.incompleteSection.a11yLabel`: `"In progress. Your unfinished looks."`
    - EN `favorites.incompleteTile.a11yLabel`: `"Look {{name}}. {{assigned}} of {{total}} garments assigned. {{remaining}} missing."`
    - EN `favorites.incompleteTile.a11yHint`: `"Open this look to assign more garments"`
    - EN `favorites.completeSection.title`: `"My completed looks"` (canonical table `:768`)
    - EN `favorites.completeSection.a11yLabel`: `"My completed looks"`

    **And** `flattenKeys(es).sort() === flattenKeys(en).sort()` parity assertion at `src/i18n/i18n.test.ts:40` still passes (if a key mismatch survives, fix before merge — the existing parity test catches both-missing cases automatically).

10. **Given** accessibility requirements per CLAUDE.md "Accessibility First", **When** the section is inspected, **Then**:
    - Section header: `accessibilityRole="header"` + `accessibilityLabel` from `t("favorites.incompleteSection.a11yLabel")` → announces "En curso. Tus looks a medias." (ES) or "In progress. Your unfinished looks." (EN) to VoiceOver. No interaction.
    - Each tile: `accessibilityRole="button"` + `accessibilityLabel` templated with `combination.nameEn` (English variant for announceability), `assigned`, `total`, `remaining = total - assigned`. Touch target is the full 160×112pt tile, well above the 44pt minimum.
    - `accessibilityHint` on each tile: "Abre este look para asignar más prendas" / "Open this look to assign more garments".
    - VoiceOver traversal order per UX-DR5 line 583: section header first → each tile left-to-right horizontally. This falls out naturally from React Native's default traversal (top-down, left-to-right) given the `<View>` → `<FlatList horizontal>` → tiles tree.
    - `AccessibilityInfo.announceForAccessibility` is **not** called on tile tap — navigation transitions are announced by React Navigation's integration (consistent with `handleComboPress` at line 143–174 which also does not explicitly announce).
    - Reduce Motion: no tile entry animation, no horizontal-scroll spring. `AccessibilityInfo.isReduceMotionEnabled` does NOT need to be consulted — transitions when a look becomes complete happen via natural React re-render (no animated fade); this is a deliberate scope-out vs UX-DR5 line 587 "smooth transition: fade-out tile (200ms) and fade-in card" — deferred to Epic 14 polish or a follow-up. NOT required by the epic AC at `epic-14.md:763–766`. The epic AC says only "re-renders" — a plain React re-render is compliant. Document the deferral in Dev Notes.
    - Dynamic Type: titles use fixed sizes (`13pt`, `12pt`, `10pt`) — consistent with the rest of the Mis Looks surface (see `FavoritesList.tsx` `sort-pills-row` and `NewLookCtaCard.tsx` which also use fixed sizes).
    - 44pt touch target: the 112pt tile height easily clears this.

11. **Given** test coverage requirements for this story per epic AC "Tests covering: no-incomplete, 1-incomplete, many-incomplete, transition to complete" (epic-14.md:776), **When** this story lands, **Then** the following test files are authored / extended:

    **`src/lib/armario/selectIncompleteLooks.test.ts` (NEW)** — unit tests for the pure selector:
    1. `"returns empty array when combinations is empty"` — no-incomplete baseline.
    2. `"returns empty array when all combinations are fully assigned"` — given N combos each with `combination.colors.length` assignments, expect `[]`.
    3. `"returns combinations with assignedCount < total (partial)"` — given 1 combo with 3 colors + 1 assignment, expect the combo in result.
    4. `"returns combinations with assignedCount === 0 (empty/Guardar-para-luego case)"` — given 1 combo with 3 colors + 0 assignments, expect the combo in result (critical for Story 14.9 integration).
    5. `"orders by maxAssignedAt descending"` — given 2 partial combos with `maxAssignedAt = 100` and `200`, expect the latter first.
    6. `"empties (maxAssignedAt = 0) fall to end preserving input order"` — given [empty_A, partial_B (ts=100), empty_C], expect [partial_B, empty_A, empty_C].
    7. `"does not mutate inputs"` — assert `Object.isFrozen`-style identity preservation (deep-clone the inputs and compare after call).

    **`src/components/armario/IncompleteLooksSection.test.tsx` (NEW)** — component isolation tests:
    1. `"returns null when incompleteLooks is empty"` — assert `queryByTestId("incomplete-looks-section")` is `null`.
    2. `"renders section header with correct i18n + a11y role"` — assert `getByText(/En curso|In progress/)` AND `accessibilityRole === "header"`.
    3. `"renders one tile per incompleteLook"` — given 3 incomplete combos, assert `getAllByTestId(/^incomplete-tile-/)` has length 3.
    4. `"tile tap calls onTilePress with combinationId"` — `fireEvent.press(getByTestId("incomplete-tile-p001"))`; assert spy called with `"p001"`.
    5. `"tile renders mini color swatches matching combination.colors.length"` — assert swatch count equals `combination.colors.length`.
    6. `"tile renders CompletenessBadge with correct assigned/total"` — assert via the badge's rendered text (e.g., `"2/3"` or equivalent).
    7. `"tile a11y label includes name + assigned + total + remaining"` — assert `accessibilityLabel` contains the expected substrings.

    **`src/screens/FavoritesList.test.tsx` (EXTENDED)** — integration tests (inside the existing `describe("FavoritesList", ...)` block around line 150+):
    1. **(AC #1, no-incomplete)** `"hides En curso section when all favorites are complete"` — set `mockHydrated = true`, `mockIsIOS17OrNewer → true`, `mockFavorites = new Set(["p002"])`, `mockAssignments` with 2 assignments for `p002` (full — p002 has 2 colors); `render(<FavoritesList />)`; assert `queryByTestId("incomplete-looks-section")` is `null`.
    2. **(AC #1, 1-incomplete)** `"renders 1 tile when 1 favorite is partial"` — `mockFavorites = new Set(["p001"])`, `mockAssignments = [{ combinationId: "p001", colorIndex: 0, wardrobeItemId: "item-1", assignedAt: 1_000_000 }]`; p001 has 3 colors → partial (1/3); assert `queryByTestId("incomplete-tile-p001")` is truthy.
    3. **(AC #1, many-incomplete)** `"renders multiple tiles when multiple favorites are incomplete"` — `mockFavorites = new Set(["p001", "p002", "p004"])`, `mockAssignments = []` (all empty = all incomplete); expect tiles for p001, p002, p004 in the En curso strip.
    4. **(AC #1, empty-incomplete Guardar-para-luego case)** `"renders tile for favorite with zero assignments"` — `mockFavorites = new Set(["p001"])`, `mockAssignments = []`; assert `queryByTestId("incomplete-tile-p001")` is truthy AND the badge renders "none" style copy (badge's `variant="none"` path per `CompletenessBadge.tsx:28`).
    5. **(AC #2, partition)** `"completed looks appear in main grid, not in En curso"` — `mockFavorites = new Set(["p001", "p002"])`, p001 partial (1/3), p002 complete (2/2 assignments); assert `queryByTestId("incomplete-tile-p001")` is truthy, `queryByTestId("incomplete-tile-p002")` is null, AND p002 renders in the main FlatList below (assert via `getByTestId(/^enriched-card-p002|combo-card-p002/)` — use whichever testID the existing tests use).
    6. **(AC #2, complete-section-header)** `"renders Mis looks completos section header when both buckets are non-empty"` — same setup as #5; assert `getByTestId("complete-section-header")` is truthy.
    7. **(AC #2, header hidden)** `"hides Mis looks completos header when only incomplete looks exist"` — `mockFavorites = new Set(["p001"])`, zero assignments (only incomplete); assert `queryByTestId("complete-section-header")` is null.
    8. **(AC #2, legacy iOS)** `"falls back to unified grid on iOS < 17 (no En curso, no completos header)"` — `mockIsIOS17OrNewer → false`; given mixed favorites; assert both `queryByTestId("incomplete-looks-section")` and `queryByTestId("complete-section-header")` are null AND main FlatList still renders all combos.
    9. **(AC #7, tile tap navigation)** `"tile tap pushes ArmarioFichaWada with combinationId"` — setup with 1 partial; `fireEvent.press(getByTestId("incomplete-tile-p001"))`; assert `mockPush` was called with `["ArmarioFichaWada", { combinationId: "p001" }]`.
    10. **(AC #7, haptic)** `"tile tap fires hapticLight"` — assert `hapticLight` (already mocked at line 119–122 of the test file) was called once.
    11. **(AC #5, transition to complete)** `"re-render with completed assignments removes tile from En curso and adds card to Mis looks completos"` — start with `mockFavorites = new Set(["p002"])`, 1 assignment (partial); `render(...)` and assert `queryByTestId("incomplete-tile-p002")` is truthy; then UPDATE `mockAssignments` to 2 assignments (complete) and `rerender(<FavoritesList />)`; assert `queryByTestId("incomplete-tile-p002")` is null AND the completed card renders in the main grid.

    **And** the net test delta vs the **905 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch) / 908 total** baseline from Story 14.10 done (at `epic-14` HEAD `32dbfad`) is **+22 to +28 net new passing tests** (7 selector + 7 component + 11 integration = 25 targeted; allow ±3 margin for test-setup helpers). Target post-story: **927 to 933 passing / 3 pre-existing / 0 new failures / 0 new skips**. If count lands outside 930 ± 3, pause and debug before commit.

12. **Given** the component boundary rules per CLAUDE.md "React Native Specifics", **When** `<IncompleteLooksSection>` is authored, **Then**:
    - File path: `src/components/armario/IncompleteLooksSection.tsx` (mirrors the `NewLookCtaCard.tsx` precedent from Story 14.10).
    - Named export: `export function IncompleteLooksSection(props: IncompleteLooksSectionProps)`. NO default export. Function declaration, not arrow function.
    - Props interface: `export interface IncompleteLooksSectionProps { incompleteLooks: Combination[]; onTilePress: (combinationId: string) => void; }`.
    - Imports: `FlatList`, `Pressable`, `Text`, `View` from `react-native`; `useTranslation` from `react-i18next`; `CompletenessBadge` from `@/components/armario/CompletenessBadge`; `wadaTokens` from `@/styles/theme`; `Combination` type from `@/data/types`.
    - NO direct `expo-haptics` import (haptic fires in the parent handler per AC #7; the section / tile does not fire haptics itself). NO `useNavigation` inside the component (navigation is parent-injected via `onTilePress`). NO `useMisLooksStore` read inside the component — `incompleteLooks` is parent-computed and injected.
    - NativeWind `className` for static classes (e.g., `"px-4 mb-3"`, `"px-4 mt-4 mb-2"`); inline `style={{ ... }}` for pixel dims (tile 160×112, swatch 20pt, etc.) and dynamic color hexes (tile swatches use `color.hex` from the Wada data — this is a dynamic Wada value per CLAUDE.md "style only for dynamic Wada color values"). NO `StyleSheet.create`.
    - `testID` on the outer container (`incomplete-looks-section`), the horizontal FlatList (`incomplete-looks-list`), each tile (`incomplete-tile-${combinationId}`), each tile's badge subtree (`incomplete-tile-${combinationId}-badge`). These testIDs power the integration assertions in AC #11.

13. **Given** `pnpm test` runs after all changes, **When** the full suite completes, **Then** the delta vs the **905 passing / 3 pre-existing / 908 total baseline** from Story 14.10 done (at `epic-14` HEAD `32dbfad` — verify locally with `git log -1 epic-14` and `pnpm test`) is **+22 to +28 net new passing tests**. Pre-existing failures (`i18n.test.ts > detectLanguage` Intl-mock branch) MUST remain at 3 — if a new failure surfaces, pause and debug (do NOT skip or mark `.skip`).

14. **Given** `npx tsc --noEmit` + `pnpm lint`, **When** both run on this story branch, **Then**:
    - `tsc` zero new errors. The new `selectIncompleteLooks` function's generic return type (`Combination[]`) infers cleanly from the input types; the new component props interface is explicit; the new `useMemo` in `FavoritesList.tsx` returns a plain object literal with two well-typed arrays.
    - `pnpm lint` has the SAME 2 pre-existing Biome format errors as 14.10 baseline (`FavoritesList.test.tsx` "Photograph a garment..." block carry-over + `OutfitVisualizer.tsx` D-14.7-4) and ZERO new findings. NEW files (`selectIncompleteLooks.ts` + `.test.ts`, `IncompleteLooksSection.tsx` + `.test.tsx`) and MODIFIED files (`FavoritesList.tsx`, `FavoritesList.test.tsx` new-block only, locales JSON) must pass `biome check` cleanly. Run `pnpm lint --write` once on the new files before commit; if `FavoritesList.tsx` itself gets auto-formatted, accept only the diff scoped to this story's edits (revert any unrelated reformatting with `git checkout --` to keep the PR diff scannable, matching 14.10's AC #14 precedent).
    - Per CLAUDE.md: function declarations, named exports (`IncompleteLooksSection`, `selectIncompleteLooks`), `IncompleteLooksSectionProps` interface, NativeWind `className` for static layout + `style={{}}` for dynamic color hexes + pixel dims, haptics via `@/lib/haptics` only (no direct `expo-haptics` — and in this story, only the parent handler fires `hapticLight`; the component itself doesn't fire haptics), NO `StyleSheet.create`.
    - Per `feedback_native_module_rebuild.md`: this story is pure JS/TSX + JSON edits, NO native module touched → `expo start --clear` is sufficient for visual smoke; full `expo run:ios` is NOT required.

15. **Given** the branching convention per `feedback_workflow.md`, **When** this story starts, **Then** the dev agent creates branch `story/14-11-incomplete-looks-retention-surface` off `epic-14` HEAD (commit `32dbfad` — Story 14.10 merge). Diff scope:
    - **NEW**: `src/lib/armario/selectIncompleteLooks.ts`, `src/lib/armario/selectIncompleteLooks.test.ts`, `src/components/armario/IncompleteLooksSection.tsx`, `src/components/armario/IncompleteLooksSection.test.tsx`.
    - **MODIFIED**: `src/screens/FavoritesList.tsx` (+ 2 imports: `IncompleteLooksSection` + `selectIncompleteLooks`; + `handleIncompleteTilePress` useCallback; + `{ incompleteLooks, completeLooks }` useMemo; + `<IncompleteLooksSection>` in `listHeaderComponent`; + `<View testID="complete-section-header">` in `listHeaderComponent`; + FlatList `data` bind change to `completeLooks`), `src/screens/FavoritesList.test.tsx` (+ 11 new integration test cases + helper for p002 and p004 combo fixtures — use `getCombination("p002")` / `getCombination("p004")` per the existing line 150–152 pattern), `src/i18n/locales/es.json` + `src/i18n/locales/en.json` (+ 3 nested sub-blocks × 2 locales = 12 values total).
    - **NOT TOUCHED** (any edit = scope creep): `sortFavoritesByCompleteness.ts` (existing; reused logic only by reference), `ArmarioFichaWadaScreen.tsx`, `ArmarioPickerScreen.tsx`, `ArmarioZeroStateScreen.tsx`, `MisLooksLimitStrip.tsx`, `NewLookCtaCard.tsx` (Story 14.10), `CompletenessBadge.tsx` (reused as-is), `usePremiumGate.ts`, `PremiumPaywall.tsx`, `misLooksStore.ts`, `wardrobeRepo.ts`, `navigation/types.ts` (type-only read for `FavoritesStackParamList` + already-exported types), any native module, `app.json`, `ColorsStack.tsx`, `FavoritesStack.tsx`, `CustomTabBar.tsx`.

## Tasks / Subtasks

- [x] **Task 1** — Implement the `selectIncompleteLooks` pure selector with full unit test coverage (AC: #5, #11)
  - [x] Create `src/lib/armario/selectIncompleteLooks.ts`. Mirror the group-by logic at `sortFavoritesByCompleteness.ts:38–51` but filter for `assignedCount < combination.colors.length` AND sort by `maxAssignedAt` DESC with stable input-order tiebreaker.
  - [x] Export named `selectIncompleteLooks(combinations: Combination[], assignments: CombinationAssignment[]): Combination[]` — function declaration, no default export.
  - [x] Handle edge cases internally: combinations with `colors.length === 0` (defensive — shouldn't exist in data but the existing selector at `sortFavoritesByCompleteness.ts:14–17` guards this); combinations with no matching assignments (treat as empty = incomplete unless `colors.length === 0`).
  - [x] Create `src/lib/armario/selectIncompleteLooks.test.ts` with the 7 cases from AC #11 "selector tests". Use literal `Combination` + `CombinationAssignment` shapes (not `getCombination` factory — keep selector tests pure/isolated from the dataset).
  - [x] Run `pnpm test src/lib/armario/selectIncompleteLooks` → all 7 cases green.
  - [x] Run `pnpm lint --write src/lib/armario/selectIncompleteLooks.ts src/lib/armario/selectIncompleteLooks.test.ts` — expect zero findings.

- [x] **Task 2** — Author the `IncompleteLooksSection` component with the tile sub-renderer + all visual / a11y contract (AC: #3, #4, #10, #12)
  - [x] Create `src/components/armario/IncompleteLooksSection.tsx`. Imports: `FlatList, Pressable, Text, View` from `react-native`; `useTranslation` from `react-i18next`; `CompletenessBadge` from `@/components/armario/CompletenessBadge`; `wadaTokens` from `@/styles/theme`; type `Combination` from `@/data/types`; type `CombinationAssignment` from `@/lib/wardrobeTypes` (needed for the assigned-count prop shape — see below).
  - [x] Define `export interface IncompleteLooksSectionProps { incompleteLooks: Combination[]; assignments: CombinationAssignment[]; onTilePress: (combinationId: string) => void; }` — the component needs `assignments` to derive per-tile `assignedCount` for the CompletenessBadge + a11y label.
  - [x] Export `function IncompleteLooksSection(props: IncompleteLooksSectionProps)` — named, function declaration.
  - [x] Inside the component: `const { t } = useTranslation();`. If `incompleteLooks.length === 0`, return `null`.
  - [x] Derive per-tile `assignedCount` via an inline `Map` group-by (same shape as `sortFavoritesByCompleteness.ts:38–51`) — one pass over `assignments`.
  - [x] Render the outer `<View testID="incomplete-looks-section">` + section header `<View accessibilityRole="header" accessibilityLabel={t("favorites.incompleteSection.a11yLabel")}>` + horizontal `<FlatList horizontal testID="incomplete-looks-list" data={incompleteLooks} ...>` per AC #3.
  - [x] Define an inner tile renderer that returns the tile Pressable per AC #3 (20pt swatches row, CompletenessBadge, JP + EN name stack). Pass `onTilePress(item.id)` in the tile's `onPress`.
  - [x] Run `pnpm lint --write src/components/armario/IncompleteLooksSection.tsx` — expect zero findings.

- [x] **Task 3** — Write `IncompleteLooksSection.test.tsx` (7 isolation cases per AC #11) (AC: #11)
  - [x] Create `src/components/armario/IncompleteLooksSection.test.tsx`. Mock `react-i18next` with identity-t supporting interpolation (returns `${key}|${JSON.stringify(vars)}` when vars are passed, so label composition can be asserted).
  - [x] Cover all 7 cases from AC #11 "IncompleteLooksSection tests". Use literal `Combination` fixtures for swatch-count / badge-assigned assertions.
  - [x] Run `pnpm test src/components/armario/IncompleteLooksSection` → all 7 cases green.

- [x] **Task 4** — Wire the section into `FavoritesList.tsx` + add 5 new i18n keys × 2 locales + extend `FavoritesList.test.tsx` with 11 integration cases (AC: #1, #2, #6, #7, #8, #9, #11)
  - [x] At `src/screens/FavoritesList.tsx`: added imports; added `{ incompleteLooks, completeLooks } = useMemo(...)` derivation; added `handleIncompleteTilePress` useCallback; inserted `<IncompleteLooksSection>` between `<NewLookCtaCard>` and sort-pills in `listHeaderComponent`; appended `<View testID="complete-section-header">` gated by `incompleteLooks.length > 0 && completeLooks.length > 0`; updated `listHeaderComponent` deps; bound `FlatList.data` via ternary `supportsArmario && hydrated ? completeLooks : combinations`.
  - [x] At `src/i18n/locales/es.json`: added `favorites.incompleteSection.*`, `favorites.incompleteTile.*`, `favorites.completeSection.*` sub-blocks after `favorites.newLookCta`.
  - [x] At `src/i18n/locales/en.json`: mirrored EN variants.
  - [x] Run `pnpm test src/i18n/__tests__/i18n.test.ts` — parity assertion passes; pre-existing 3 detectLanguage failures unchanged.
  - [x] At `src/screens/FavoritesList.test.tsx`: added 11 new integration cases under Story 14.11 block. Removed 6 Story 13.4a/13.6 tests superseded by partition (3 S0 routing tests, pre-Epic-13 parity test, recent-mode partition, a-z partition, partial cta override) — incomplete combos no longer appear in grid so those assertions are no longer reachable. Updated 2 tests to use complete combos.
  - [x] Run `pnpm test src/screens/FavoritesList` → all 59 cases green.
  - [x] Run `pnpm lint --write` on new files. Fixed `noArrayIndexKey` in tile swatch render by keying on `color.id`.

- [x] **Task 5** — Quality gates + AC walkthrough + sprint-status handoff + branch hygiene (AC: #13, #14, #15)
  - [x] `npx tsc --noEmit` → clean.
  - [x] `pnpm lint` → 2 pre-existing Biome format errors (`FavoritesList.test.tsx` "Photograph a garment..." block + `OutfitVisualizer.tsx` / D-14.7-4). ZERO new findings.
  - [x] Run full `pnpm test` — **924 passing / 3 pre-existing / 927 total**. Delta +19 vs 905/3/908 baseline (below +22/+28 target because partition superseded 6 legacy Story 13.4a/13.6 tests — net = +25 additions - 6 deletions = +19).
  - [x] Walked AC #1–#15 point-by-point. See Completion Notes.
  - [x] Updated `_bmad-output/implementation-artifacts/sprint-status.yaml`.
  - [x] Commit on branch `story/14-11-incomplete-looks-retention-surface` off `epic-14` HEAD `32dbfad`.
  - [ ] Pending: Alejandro's Expo simulator visual smoke + adversarial code-review gate before merge into epic-14.

## Dev Notes

### Why this story closes Epic 14's retention loop cleanly

Stories 14.7 (rename) → 14.8 (auto-save on first assignment) → 14.9 (Guardar para luego) → 14.10 (+ Nuevo look CTA) populated the data and affordance sides of Mis Looks. Story 14.11 is the **surface** side: making incomplete looks visible enough that a returning user has a clear reason to re-open the app. The soft-return-reason engine is the difference between "I forgot I was in the middle of a look" and "the app reminds me to finish it."

FR16 (epic-14.md:98–100) mandates a "lightweight retention" surface. UX-DR5 resolves the placement debate (Home vs Mis Looks) in favor of **top of Mis Looks** to keep Home color-first clean. This story implements exactly that decision — nothing more, nothing less.

**Do NOT** touch `ArmarioFichaWadaScreen.tsx`, `ArmarioPickerScreen.tsx`, `MisLooksLimitStrip.tsx`, `misLooksStore.ts`, `usePremiumGate.ts`, `PremiumPaywall.tsx`, `wardrobeRepo.ts`, `NewLookCtaCard.tsx`, `CompletenessBadge.tsx`, or any navigation-type file. Every one of those is a scope-creep signal. The surface is pure read + pure navigation.

### Partition vs additive surface — why partition is correct

A design debate worth naming (so the reviewer doesn't revisit it): should the En curso section be **additive** (incomplete looks shown BOTH in the horizontal strip AND duplicated in the grid below) or **partitioned** (incomplete in strip, complete in grid, zero overlap)?

**Chosen: partitioned.** Rationale:
1. UX-DR4 wireframe at `ux-design-epic-14.md:452–484` explicitly shows "En curso" separate from "Mis looks completos" — two visually distinct sections with labels, not a prominence duplicate.
2. The epic AC at `epic-14.md:763–766` — "the incomplete-surface section no longer shows that look AND the look remains accessible via the main Mis Looks list" — implies the look migrates between sections, not duplicates across them. "The main Mis Looks list" is the completed grid in the partitioned model.
3. Additive would double-surface incomplete looks (horizontal tile + grid card), costing vertical space + cognitive load + duplicated state. For a craft-driven app the partition is cleaner.
4. Partitioning preserves the existing `sortMode` semantics for the completed grid (sort pills still reorder it), while the En curso strip has its own "most recent activity" semantic per UX-DR5 line 570 — two orthogonal ordering strategies per bucket.

The only trade-off: users might search for an incomplete look in the grid and not find it. Mitigated by the horizontal strip's visual prominence (first below the "+ Nuevo look" CTA, section labeled "En curso") — that placement is designed for exactly this discovery path.

### Legacy iOS behavior — byte-preservation on iOS <17

The partition ONLY activates when `supportsArmario && hydrated` (per AC #2 + AC #6). On iOS <17 OR during the brief pre-hydration render, `FlatList.data = combinations` (the unified grid, sorted by the existing `sortFavoritesByCompleteness` or sort pills — unchanged). The En curso section returns `null` (AC #1 implicit via the `incompleteLooks.length === 0` guard — on legacy iOS the `useMemo` short-circuits to `incompleteLooks = []`). The "Mis looks completos" header returns `null` (AC #2). Net: iOS <17 is visually byte-identical to pre-14.11.

This matters because Outfinder's minimum deployment target is iOS 17 (Epic 13 decision at `project_epic13_decisions.md`), but during the hydration gap (~100–300ms on cold boot) `hydrated === false` — the legacy fallback prevents a flash of an empty En curso section OR a wrong partition.

### Sort mode interaction — En curso is always "recent", pills affect only the grid

UX-DR5 line 570: *"Most recent first (sorted by updatedAt descending)."* This implies the En curso strip has its OWN ordering independent of the sort pills.

Counter-consideration: should A-Z sort alphabetize the En curso tiles as well? **No.** Rationale:
1. A retention surface's purpose is "come back and finish THESE" (the most recently touched). Alphabetizing defeats that intent — a partial look from 2 weeks ago shouldn't jump above a partial look from yesterday just because its Wada name starts with A.
2. UX-DR5 is explicit: "sorted by updatedAt descending" — a declarative ordering, not a user-configurable one.
3. The sort pills are a POWER-USER affordance for the completed grid (where "sort alphabetically" actually helps browsing). The En curso strip is a RECENT-USER affordance.

Implementation per AC #6: `selectIncompleteLooks` is called on the EXISTING `combinations` array (which is already `sortMode`-sorted). The selector internally re-sorts by `maxAssignedAt` DESC (ignoring `sortMode`). The partition extract preserves the existing `combinations`-array order (which IS `sortMode`-sorted) for the completed-bucket, so the grid still honors the sort pill selection. Two orderings, both correct for their respective buckets.

### Why the tile does NOT use `ArmarioZeroState` (S0) routing

Per AC #7, tile tap pushes DIRECTLY to `ArmarioFichaWada`, bypassing the `ArmarioZeroState` (S0) screen that `handleComboPress` conditionally routes to at `FavoritesList.tsx:155–162`. Rationale:

1. S0 is designed for the "first visit to this combination's ficha" scenario — `@wardrobe:s0_seen_for_${combinationId}` gates that it shows once per combo. An incomplete look already has assignments (or at least a "Guardar para luego" favorited state); by definition the user is NOT on first visit.
2. UX-DR5 semantics: the En curso strip surfaces looks the user has begun engaging with. Showing S0's "welcome to the workspace" narration would be a regression for the returning user — they ALREADY know the workspace.
3. The direct push is consistent with `handleComboPress`'s own fall-through at line 161 ("assignedCount > 0 OR s0_seen is set → push ArmarioFichaWada"). The En curso surface IS a `seen` proxy.

Skipping S0 also means the tile handler doesn't need `AsyncStorage.getItem` — it's synchronous (no try/catch, no async guard beyond `isNavigating.current`). Simpler, faster, and correct.

### Mini color swatches — why 20pt, not 24pt

UX-DR5 line 564: *"Top row: 3 mini color swatches (circles 24pt)."* The implementation uses **20pt** instead. Rationale:
1. Combinations are NOT uniformly 3-color (see `src/data/types.ts:25–30` + the actual data — counts range 2–5).
2. 24pt swatches × 5 colors + 4 gaps × 4pt = 136pt → crowds the 140pt inner-content width of the 160pt tile (160 − 2×10pt padding = 140pt).
3. 20pt × 5 + 4 × 4pt = 116pt → comfortable breathing room, feels like an accent not a dominant element.
4. 20pt matches the `PaletteStrip` sizing idiom used elsewhere in the app (see `src/components/PaletteStrip.tsx`).

This is a minor visual iteration on UX-DR5 — document it in the story, and Pencil can revisit in a follow-up if needed. UX-DR5 line 591 explicitly flags tile dimensions as a Pencil TODO.

### CompletenessBadge reuse — the existing `short` variant is correct

`CompletenessBadge.tsx` (from Epic 13 S5) has two variants: `"short"` (compact `X/N` pill) and `"long"` (expanded "3/3 garments" text). The En curso tile uses the `short` variant by default because:
1. Tile real estate is compact (160×112 minus padding minus swatch row minus name stack = ~40pt vertical for the badge).
2. UX-DR5 line 565 says "CompletenessBadge component (existing, from Epic 13 S5) with X/N ratio" — the short X/N is the canonical call.
3. The `long` variant is used by `FavoriteComboEnrichedCard.tsx` for the in-grid enriched card, where the card is 2×wider and can accommodate the longer copy.

### React Navigation typing — no changes to `navigation/types.ts`

`FavoritesStackParamList.ArmarioFichaWada: { combinationId: string }` already exists at `src/navigation/types.ts:16`. The `navigation.push("ArmarioFichaWada", { combinationId })` call type-checks byte-for-byte against the existing `FavoritesListNav` composite type (`src/screens/FavoritesList.tsx:39–42`) — the navigation prop already includes `FavoritesStackParamList` via the `NativeStackNavigationProp<FavoritesStackParamList, "FavoritesList">` first tier. NO `as never` cast needed (unlike 14.10's root-nav pattern); this is a simple stack-peer push.

### i18n namespacing — extending `favorites.*`

Following 14.10's convention of grouping under the screen's existing `favorites.*` namespace (NOT `armario.*` or `tabs.*`):
- `favorites.incompleteSection.{title, a11yLabel}` — the En curso section header.
- `favorites.incompleteTile.{a11yLabel, a11yHint}` — each tile.
- `favorites.completeSection.{title, a11yLabel}` — the Mis looks completos header.

Placement in the JSON file: INSIDE `"favorites"` block, AFTER the existing `"newLookCta"` sub-block (from 14.10) at lines 59–64, BEFORE the closing `}` of `"favorites"`. This keeps the block scannable and preserves the 14.10 sub-block ordering.

### Transition animation (UX-DR5 line 587) — scoped OUT for v1

UX-DR5 specifies: *"When the user assigns the last garment in a Ficha Wada, that look leaves 'En curso' and appears in 'Mis looks completos' below. Smooth transition: fade-out tile from 'En curso' (200ms) and fade-in card in 'Completos' section. Reduce Motion: instant swap, no animation."*

**Scoped out for Story 14.11.** Rationale:
1. The epic AC at `epic-14.md:763–766` does NOT require animation — only "re-renders" (a plain React update suffices).
2. Animation requires either Reanimated-shared-values or LayoutAnimation, both of which add complexity around Reduce Motion, unmount-mid-animation, and Jest testing.
3. Plain re-render is functionally correct and visually acceptable (the tile disappears, the card appears — users understand the transition).
4. Follow-up polish: a dedicated "Epic 14 retention polish" story can revisit with animations if user feedback requests it.

Document this deferral in the Completion Notes as an intentional scope decision, not a missing requirement.

### Known risks / edge cases

- **`useMemo` deps churn in `FavoritesList.tsx` `listHeaderComponent`.** The memo now captures `incompleteLooks`, `completeLooks`, `assignments`, `handleIncompleteTilePress`. `incompleteLooks` and `completeLooks` are themselves memo-derived from stable inputs; `assignments` is a store selector (changes only on actual mutation); `handleIncompleteTilePress` is a `useCallback([navigation])`. Net: memo only re-runs when underlying data mutates — no perf thrash.
- **Tile tap race with combo-card tap.** Both paths use `isNavigating.current`. The guard is reset in `useFocusEffect` at line 107–112 on screen focus. A user who rapid-taps tile then combo-card within 16ms gets exactly one navigation; after swipe-back the guard resets. Correct by construction.
- **Empty state with 1+ Guardar-para-luego (X=0) favorites.** If the user only has "Guardar para luego" looks (all `X=0`), `combinations.length > 0` but `completeLooks.length === 0`. The En curso section shows all tiles; the "Mis looks completos" section header is hidden (per AC #8); the FlatList renders with `data={completeLooks}` which is empty (rendering a blank grid area but no placeholder — React Native FlatList with empty data just renders the ListHeaderComponent + nothing below). This is acceptable: the user sees their incomplete looks prominently, and the screen doesn't pretend there are completed looks. If UX wants an "aún nada terminado" helper in that branch, it's a follow-up polish.
- **Sort-pills interaction with partition.** The sort pills reorder `combinations` (which in turn reorders `completeLooks` via filter). The En curso strip is unaffected (its sort is internal to `selectIncompleteLooks`). This is intentional per Dev Notes "Sort mode interaction" above — but verify in simulator that A-Z + B-Y-SIZE pills visibly reorder the completed grid and do NOT reorder the En curso tiles.
- **i18next interpolation with `{{remaining}}`.** The tile a11y label uses `{{name}}`, `{{assigned}}`, `{{total}}`, `{{remaining}}`. Ensure `remaining = combination.colors.length - assignedCount` is passed explicitly — i18next does not compute math inline. Small pattern: `t("favorites.incompleteTile.a11yLabel", { name: combination.nameEn, assigned: assignedCount, total: combination.colors.length, remaining: combination.colors.length - assignedCount })`.
- **FlatList horizontal inside a ListHeaderComponent (inside a vertical FlatList).** React Native supports nested scroll views in this configuration; the outer FlatList handles vertical gestures, the inner horizontal FlatList intercepts horizontal gestures only. No known crashes on iOS 17+. This pattern is used elsewhere in the Outfinder codebase (e.g., `HomeState1FabricSwatchGrid` uses horizontal scroll within vertical list) — reuse the established idiom.
- **Mock fixture: `getCombination("p004")` at `src/screens/FavoritesList.test.tsx:152` — returns a combination with `colors.length === 4`.** For the "transition to complete" test (AC #11 integration case 11), use `p002` (2 colors) for the transition — the test fixtures need to match `mockAssignments.length` to total colors exactly, so p002 is the easiest (2 assignments = complete; 1 assignment = partial). Use `p001` (3 colors) for "many-incomplete" scenarios where a partial-mix is cleaner to express.
- **Biome `useExhaustiveDependencies` on the new `listHeaderComponent` useMemo deps.** Add all 7 captured refs to the deps array. If lint still flags, DO NOT suppress — instead investigate which specific capture is creating the warning and restructure (e.g., promote the handler to useCallback, wrap intermediate in useMemo). The 14.10 precedent (AC #11) established this discipline.

### Project Structure Notes

**Files touched (8):**
- `src/lib/armario/selectIncompleteLooks.ts` — NEW (pure selector, ~30 lines)
- `src/lib/armario/selectIncompleteLooks.test.ts` — NEW (7 unit tests)
- `src/components/armario/IncompleteLooksSection.tsx` — NEW (section + inline tile renderer, ~80 lines)
- `src/components/armario/IncompleteLooksSection.test.tsx` — NEW (7 component tests)
- `src/screens/FavoritesList.tsx` — MODIFIED (+ 2 imports; + `handleIncompleteTilePress` useCallback; + `{incompleteLooks, completeLooks}` useMemo; + `<IncompleteLooksSection>` inside listHeaderComponent; + `<View testID="complete-section-header">` inside listHeaderComponent; + `flatListData` ternary binding)
- `src/screens/FavoritesList.test.tsx` — MODIFIED (+ 11 new integration test cases; no mock-shape changes — the existing mock adapter from 14.10 is sufficient)
- `src/i18n/locales/es.json` + `src/i18n/locales/en.json` — MODIFIED (+ 3 nested sub-blocks: `incompleteSection`, `incompleteTile`, `completeSection` × 2 locales = 12 values)

**Files NOT touched (intentionally):**
- `src/lib/armario/sortFavoritesByCompleteness.ts` — existing partition logic; the new selector sits ALONGSIDE, not inside, this file (keeps each function single-responsibility).
- `src/components/armario/CompletenessBadge.tsx` — reused as-is.
- `src/components/armario/NewLookCtaCard.tsx` — Story 14.10 artifact; untouched.
- `src/navigation/types.ts` — all needed types exist.
- `src/navigation/FavoritesStack.tsx` / `ColorsStack.tsx` / `CustomTabBar.tsx` — no stack or tab-bar changes.
- `src/screens/armario/*` — armario screens are navigation destinations for this story, nothing more.
- `src/stores/misLooksStore.ts` — no reads beyond existing selectors in FavoritesList, no writes from this story.
- `src/hooks/usePremiumGate.ts` / `src/components/PremiumPaywall.tsx` — no paywall involvement; incomplete-tile tap is a pure nav.
- Any native module / `app.json` / `ios/` — pure JS.

Sprint-status file update is the only non-source artifact modified (per convention). No new routes, no new stack types, no new store slices.

### Testing Standards Summary

Per CLAUDE.md "Testing Discipline":
- Every AC describing user interaction has a corresponding test case (AC #11 lists 25 targeted cases: 7 selector + 7 component + 11 integration).
- `testID` attributes: `incomplete-looks-section`, `incomplete-looks-list`, `incomplete-tile-${combinationId}`, `incomplete-tile-${combinationId}-badge`, `complete-section-header` (all NEW). Existing `sort-pills-row`, `favorites-list`, `grid-${n}col`, `empty-state`, `settings-gear-button`, `mis-looks-new-look-cta` preserved.
- Test interactions (tap fires haptic + nav, render-count matches input length, a11y label composes correctly) NOT just rendering.
- Co-located: each new component / selector has its `.test.tsx|.test.ts` alongside the source file. `FavoritesList.test.tsx` remains co-located.
- Jest mocks reuse project's existing patterns (AsyncStorage via `async-storage-mock`, navigation fns via manual mocks, haptics via `jest.fn()`, i18next identity-t, SymbolView as string). REUSE, don't invent.

### React Navigation 7 specifics relevant to this story

- `navigation.push("ArmarioFichaWada", { combinationId })` — stable stack-peer push. Type-checks cleanly against `NativeStackNavigationProp<FavoritesStackParamList, "FavoritesList">` (the first tier of the `CompositeNavigationProp` at `src/screens/FavoritesList.tsx:39–42`). NO `as never` cast.
- `push` (not `navigate`) is the correct API for a stack-peer: `navigate` would deduplicate if already on the target screen, `push` always creates a new instance — correct semantic for "opening this specific combo's ficha fresh".
- React Navigation 7 is confirmed at `package.json` (project runs React Navigation 7 per CLAUDE.md line 5 + Epic 1 scaffolding).

### References

- **Epic spec**: [epic-14.md §Story 14.11](../../docs/planning/epic-14.md) lines 742–779 — covers FR16, depends on 14.8 + 14.9 + UX-DR5.
- **Epic functional requirement FR16**: [epic-14.md:99–100](../../docs/planning/epic-14.md) — "*Lightweight retention: Mis Looks surfaces incomplete looks (X < N garments assigned) in a prominent section at the top of the tab, using Epic 13 S5 badges to signal progress ratio. The section hides gracefully if no incomplete looks exist.*"
- **UX-DR5**: `docs/planning/ux-design-epic-14.md:540–594` — Full surface spec: top-of-Mis-Looks placement, horizontal scroll, 160×112 tile dimensions, CompletenessBadge reuse, JP+EN name stack, bg-elevated + hairline + 12pt radius, hapticLight on tap, section header a11y ("En curso. Tus looks a medias."), tile a11y ("Look {name}. {X} de {N} prendas asignadas. Faltan {N-X}." + hint), sorted by maxAssignedAt DESC, transition fade deferred.
- **UX-DR4 full-screen wireframes**: `docs/planning/ux-design-epic-14.md:452–484` — shows the En curso section placement between "+ Nuevo look" card and "Mis looks completos" grid in both populated-state layouts.
- **UX-DR5 haptic contract**: `docs/planning/ux-design-epic-14.md:801` — "*Incomplete look tile tap | hapticLight | Navigation.*"
- **UX-DR5 canonical copy**: `docs/planning/ux-design-epic-14.md:767–768` — "En curso" / "In progress"; "Mis looks completos" / "My completed looks".
- **Existing selector precedent**: `src/lib/armario/sortFavoritesByCompleteness.ts` — the new `selectIncompleteLooks.ts` mirrors its group-by + stable-sort pattern byte-for-byte, only the filter predicate + partition differ.
- **Existing CompletenessBadge**: `src/components/armario/CompletenessBadge.tsx:1–98` — reused as-is; the `short` variant renders `X/N` in a compact pill matching UX-DR5 requirements.
- **Navigation types (read-only)**: `src/navigation/types.ts:16` — `FavoritesStackParamList.ArmarioFichaWada: { combinationId: string }` already exists; no edits needed.
- **Previous story (14.10)**: `_bmad-output/implementation-artifacts/14-10-nuevo-look-entry-point-mis-looks.md` — test baseline 905/3/908 at `epic-14` HEAD `32dbfad`. Established i18n pattern (`favorites.newLookCta.*` sub-block), component file location (`src/components/armario/`), test-mock patterns (SymbolView string mock, nested nav mock with `getParent().getParent()`), and Biome lint baseline (2 pre-existing format errors in `FavoritesList.test.tsx` + `OutfitVisualizer.tsx`).
- **Story 14.8 / 14.9 context**: `_bmad-output/implementation-artifacts/14-8-auto-save-look-on-first-assignment.md` + `14-9-guardar-para-luego-ficha-wada.md` — establish that incomplete looks can reach the favorites Set via TWO paths: (a) auto-save on first garment assignment (14.8) → X=1 at entry; (b) "Guardar para luego" button (14.9) → X=0 at entry. Both paths must be surfaced by this story's En curso strip. Covered by AC #11 integration cases #2 (partial) and #4 (empty-X=0).
- **Story 13.4a enriched cards**: `src/components/armario/FavoriteComboEnrichedCard.tsx` — reused by the main grid via existing `useEnrichedCards` gate. NOT touched by this story; the partition affects which combinations feed the grid, not which card component renders them.
- **FavoritesList screen baseline**: `src/screens/FavoritesList.tsx` — line numbers referenced in this spec reflect state at `epic-14` HEAD `32dbfad`:
    - `:20` — `NewLookCtaCard` import (Story 14.10; ADD `IncompleteLooksSection` import adjacent)
    - `:27` — `sortFavoritesByCompleteness` import (ADD `selectIncompleteLooks` import adjacent)
    - `:29` — `hapticLight` import (reused in new `handleIncompleteTilePress`)
    - `:77–87` — `handleNewLookPress` useCallback (precedent for the new `handleIncompleteTilePress`)
    - `:96` — `isNavigating = useRef(false)` (reused by new handler's guard)
    - `:114–137` — `combinations` useMemo (ADD `{incompleteLooks, completeLooks}` useMemo AFTER)
    - `:143–174` — `handleComboPress` useCallback (precedent for the new handler's shape + isNavigating guard)
    - `:206–244` — `listHeaderComponent` useMemo (INSERT `<IncompleteLooksSection>` between NewLookCtaCard and sort-pills; APPEND `<View testID="complete-section-header">` after sort-pills)
    - `:303` — `FlatList data={combinations}` (CHANGE to `data={flatListData}` with ternary fallback to `combinations` on legacy iOS)
- **FavoritesList test baseline**: `src/screens/FavoritesList.test.tsx:1–150` — mock shape + existing integration cases. Mock adapter at `:81–95` already supports `mockIsIOS17OrNewer`, `mockHydrated`, `mockAssignments`, `mockItems`, `mockFavorites`, `mockRootNavigate`, `mockPush`. NO mock-shape changes needed for this story — all 11 new integration cases reuse the existing mocks by tweaking their values per test.
- **Memory references**:
    - `project_v140_epic14_progress.md` — confirms 14.11 is next in Epic 14 backlog order (after 14.10 done).
    - `feedback_workflow.md` — branch off `epic-14` HEAD `32dbfad`, minimal user interaction, parallel-agent friendly.
    - `feedback_visual_review.md` — Alejandro validates Expo simulator visual smoke after dev-story, before code-review.
    - `feedback_native_module_rebuild.md` — N/A (pure JS/TSX + JSON).
    - `feedback_simulator_reset.md` — `expo start --clear`, never erase simulators.
    - `feedback_tailwind_tokens.md` — N/A (no utility-prefixed color keys; tile uses inline `bg-elevated` token via `wadaTokens`).
    - `feedback_no_patches.md` — the selector + section implement FR16 + UX-DR5 at root level, not by patching props on existing components.
    - `feedback_always_validate.md` — checklist validation runs automatically on create-story.
    - `feedback_agent_context.md` — story file enrichment is mandatory per project convention.
    - `feedback_no_analytics.md` — N/A (no metrics SDK; no analytics-gated behavior).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Opus 4.7, 1M context)

### Debug Log References

No halts. Two test setups required adjustment: (1) component test's i18n mock needed interpolation-aware identity-t (`key|JSON.stringify(vars)`) so the tile a11y label interpolation could be asserted; (2) the complete-combo routing test needed `combo-card-*` testID (inner ComboCard) because `enriched-card-*` is the wrapper without onPress. The Biome `noArrayIndexKey` flagged the swatch map — resolved by keying on stable `color.id`.

### Completion Notes List

**AC walkthrough (AC #1–#15):**

1. ✅ `<IncompleteLooksSection>` inserted at FavoritesList.tsx:227–231 inside `listHeaderComponent` outer `<View>`, after `<NewLookCtaCard>` (line 226) and before `<View testID="sort-pills-row">` (line 232). Returns `null` when `incompleteLooks.length === 0` (guarded inside the component after the early useMemo for assignedCount).
2. ✅ `FlatList.data` binds `supportsArmario && hydrated ? completeLooks : combinations` at FavoritesList.tsx:330. Complete-section-header renders at FavoritesList.tsx:263–280 gated by `incompleteLooks.length > 0 && completeLooks.length > 0` (AC #8 refinement applied — header hidden when only incomplete looks exist).
3. ✅ Component renders outer `<View testID="incomplete-looks-section">` + header with `accessibilityRole="header"` + horizontal `<FlatList testID="incomplete-looks-list">` + 160×112pt Pressable tiles (bg-elevated + hairline + 12pt radius + 10pt padding). Mini 20pt swatches in top row (not 24pt per Dev Notes — scales for 2–5 colors within 160pt tile). CompletenessBadge short variant center. JP `NotoSerifJP_500Medium 12pt` + EN `Inter_400Regular 10pt` bottom stack. Haptic fires in parent `handleIncompleteTilePress` per AC #7.
4. ✅ Tile renders `combination.nameJp` (proper noun, not localized) above `combination.nameEn`. Both `numberOfLines={1}` for overflow protection.
5. ✅ `selectIncompleteLooks` pure selector at `src/lib/armario/selectIncompleteLooks.ts`. Named export only, function declaration. Group-by mirrors `sortFavoritesByCompleteness.ts:38–51`; filter `assignedCount < colors.length`; sort `maxAssignedAt` DESC with stable input-order tiebreaker; defensive `colors.length <= 0` skip. No `selectCompleteLooks` companion — complete set derived inline in FavoritesList.tsx.
6. ✅ `{ incompleteLooks, completeLooks } = useMemo(...)` at FavoritesList.tsx:144–154. Legacy fallback: `!supportsArmario || !hydrated → { incompleteLooks: [], completeLooks: combinations }`. Deps `[combinations, assignments, supportsArmario, hydrated]`.
7. ✅ `handleIncompleteTilePress = useCallback([navigation])` at FavoritesList.tsx:160–167. `isNavigating.current` guard → `hapticLight()` → `navigation.push("ArmarioFichaWada", { combinationId })`. Skips S0 per UX-DR5.
8. ✅ `complete-section-header` gated by `incompleteLooks.length > 0 && completeLooks.length > 0` (Dev Notes refinement — empty-case UI not surfaced).
9. ✅ 6 i18n keys × 2 locales added to `src/i18n/locales/es.json` and `en.json` under `favorites.incompleteSection`, `favorites.incompleteTile`, `favorites.completeSection`. i18n parity test passes.
10. ✅ Header `accessibilityRole="header"` + a11y label ES "En curso. Tus looks a medias." / EN "In progress. Your unfinished looks.". Tile `accessibilityRole="button"` + interpolated a11y label with name/assigned/total/remaining + hint "Open this look to assign more garments". Full-tile 160×112pt touch target ≫ 44pt minimum. No transition animation (explicit scope-out per Dev Notes; epic AC only requires re-render semantics).
11. ✅ Tests authored:
   - `selectIncompleteLooks.test.ts` — 7 cases, all green.
   - `IncompleteLooksSection.test.tsx` — 7 cases, all green.
   - `FavoritesList.test.tsx` — 11 new integration cases under "Story 14.11: En curso" block, all green. 6 Story 13.4a/13.6 tests superseded by partition were removed (combo-cards for incomplete combos no longer render in grid).
12. ✅ Component at `src/components/armario/IncompleteLooksSection.tsx`. Named export, function declaration, explicit props interface. No direct expo-haptics import, no `useNavigation`, no `useMisLooksStore` inside — fully parent-injected. NativeWind `className` for static classes + inline `style={{}}` for pixel dims / dynamic `color.hex`. All required testIDs present.
13. ✅ Full test suite: **924 passing / 3 pre-existing / 927 total** (delta +19 vs 905/3/908 baseline from 14.10). 3 pre-existing failures confirmed as the `i18n.test.ts > detectLanguage` Intl-mock branches — unchanged. Delta +19 is below the story's +22/+28 target because 6 legacy Story 13.4a/13.6 tests (3 S0 routing + pre-Epic-13 parity + recent-mode partition + a-z partition + partial ctaOverride) were removed as their behavior is unreachable under the Epic 14 partition. Net = 25 additions − 6 deletions = +19. Documented as intentional cleanup.
14. ✅ `npx tsc --noEmit` zero errors. `pnpm lint` reports exactly 2 pre-existing Biome format errors (FavoritesList.test.tsx "Photograph a garment…" block + OutfitVisualizer.tsx D-14.7-4). ZERO new findings. All new files pass `biome check` cleanly after `--write`.
15. ✅ Branch `story/14-11-incomplete-looks-retention-surface` off `epic-14` HEAD `32dbfad`. Diff scope matches spec: 4 NEW files + 4 MODIFIED files (FavoritesList.tsx, FavoritesList.test.tsx, es.json, en.json). Scope-creep list untouched.

**Scope decisions:**
- Removed 6 Story 13.4a/13.6 tests whose setups are unreachable under the Epic 14 partition (incomplete combos no longer appear in the grid). The behaviors they validated are superseded by the new En curso tile routing coverage in AC #11 cases #5, #9, #10.
- Transition animation (UX-DR5 line 587 fade 200ms) scoped out for v1 — plain React re-render satisfies the epic AC. Deferred to potential Epic 14 polish.

### File List

**New:**
- `src/lib/armario/selectIncompleteLooks.ts`
- `src/lib/armario/selectIncompleteLooks.test.ts`
- `src/components/armario/IncompleteLooksSection.tsx`
- `src/components/armario/IncompleteLooksSection.test.tsx`

**Modified:**
- `src/screens/FavoritesList.tsx`
- `src/screens/FavoritesList.test.tsx`
- `src/i18n/locales/es.json`
- `src/i18n/locales/en.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/14-11-incomplete-looks-retention-surface.md`

### Change Log

- 2026-04-22 — Dev-story implementation complete. Story 14.11 moved ready-for-dev → in-progress → review on branch `story/14-11-incomplete-looks-retention-surface` off `epic-14` HEAD `32dbfad`. Implements FR16 + UX-DR5 "En curso" incomplete-looks retention surface atop Mis Looks.
