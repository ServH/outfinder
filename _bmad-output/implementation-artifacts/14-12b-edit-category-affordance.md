# Story 14.12b: Edit category affordance (pencil icon in edit mode)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user who accidentally saved a garment with the wrong category on the S3 picker (`ArmarioPickerScreen`) — or inherited a legacy Epic-13 item that TD-7 backfilled with `category: "top"` as a safe default**,
I want **a pencil icon in the top-RIGHT corner of each thumbnail during the existing edit mode (entered per Story 14.12a via long-press) that — when tapped — reopens the existing `CategoryPickerSheet` component (built in Story 14.5 and already exported at `src/components/armario/CategoryPickerSheet.tsx`) with the garment's current category pre-selected; picking a new category persists via the already-shipped `useMisLooksStore.updateItemCategory(id, newCategory)` action (landed in Story 14.1, fully tested at `misLooksStore.test.ts:536–573`), the sheet dismisses, and I remain in edit mode so I can fix multiple mistakes in a row**,
so that **TD-6 closes (category is editable in v1.4.0, not deferred to v1.5.0 per Alejandro's 2026-04-21 pullback), FR18's edit portion ships, `CategoryPickerSheet` proves its reuse thesis (no second sheet variant, no forking), the dual-icon layout that Story 14.12a scaffolded at `ArmarioPickerScreen.tsx:598` ("// Story 14.12b: pencil icon sibling added here (top-right)") lands as a tight 12-line diff, and Alejandro's on-device QA checklist in Story 14.13 can tick TD-6 ("pencil icon edit-category flow persists + VoiceOver") as the final edit-mode behavior before App Store submit**.

## Acceptance Criteria

1. **Given** edit mode is active in `ArmarioPickerScreen` (`isEditMode === true`, entered per Story 14.12a at `src/screens/armario/ArmarioPickerScreen.tsx:241–256`), **When** the grid at lines 519–641 renders each tile, **Then** a new `<EditPencilBadge />`-shaped overlay is rendered **absolutely-positioned inside the tile `Pressable`** at the placeholder comment `// Story 14.12b: pencil icon sibling added here (top-right)` (line 598 — sibling of the existing `(−)` `Animated.View` at lines 599–637), with: `position: "absolute"`, `top: 4`, `right: 4` (mirror of the `(−)`'s `top: 4, left: 4`), `zIndex: 2`. The pencil badge uses the SAME 24pt circle shape and styling as the `(−)` badge (`width: 24`, `height: 24`, `borderRadius: 12`, `backgroundColor: wadaTokens.bgPaper`, `borderWidth: 1`, `borderColor: wadaTokens.textSecondary`, `alignItems: "center"`, `justifyContent: "center"`) to match the "clean style matching the `(−)` aesthetic" mandate (epic-14.md:842). **And** inside the badge, `<SymbolView name="pencil" size={14} tintColor={wadaTokens.textPrimary} type="hierarchical" resizeMode="scaleAspectFit" />` renders the glyph (reuses the existing `SymbolView` import at `ArmarioPickerScreen.tsx:10`; `pencil` is a standard SF Symbol, iOS 13+; jest mock at `ArmarioPickerScreen.test.tsx:16–28` already produces `<View testID="symbol-pencil" />` generically via its passthrough `name` prop, so no mock edit is required). **And** the badge is wrapped in a `<Pressable testID={\`armario-edit-category-${item.id}\`} hitSlop={10}>` to give it a 44pt hit target — matching the `(−)`'s `hitSlop={10}` pattern at line 614. **And** the pencil is wrapped in an `Animated.View` using the **existing `editBadgeAnimStyle` shared animated style at line 337–339** (same `editOpacity` shared value drives BOTH badges — no new animated value is introduced; both icons fade in/out together on enter/exit edit mode). **And** the pencil is ONLY rendered when `isEditMode === true` (conditional render via `{isEditMode && (...)}`, NOT `opacity: 0` preservation — mirrors the `(−)` pattern at line 599).

2. **Given** the two badges share the tile's `top` edge, **When** the layout renders in a grid where `tileSize` approaches its minimum (~100pt wide on iPhone SE 3rd gen at 375pt screen width: `(375 − 16·2 − 12·2) / 3 = 106.33pt`), **Then** there is sufficient horizontal space for both 24pt circles at their respective `top: 4, left: 4` and `top: 4, right: 4` positions without visual overlap (`24 + 4 + 24 + 4 = 56pt` used for both icons + margins vs. 106pt tile width — ~50pt of clear thumbnail visible between them). **And** neither badge covers the full-width "Assigned elsewhere" label at `ArmarioPickerScreen.tsx:586–596` (the label sits at `bottom: 0`, the badges at `top: 4` — vertically disjoint, no z-index collision). **And** the 44pt invisible hitSlop extensions on the two badges do NOT overlap at the tile's horizontal center (`(−)` hit area extends from `left:−6` to `left:34`; pencil hit area extends from `right:−6` to `right:34`, i.e. `left: 72` to `left: 112` on a 106pt tile — clear gap of 38pt between hit zones). **No extra spacing / tile-size adjustments are required.**

3. **Given** the user taps the pencil badge `<Pressable testID={\`armario-edit-category-${item.id}\`}>`, **When** the press registers, **Then** a new `handleEditCategoryBadgePress(item: WardrobeItem)` handler fires `hapticLight()` (NOT `hapticMedium` or `hapticRigid` — per epic AC at `epic-14.md:853`: *"`hapticLight` fires"*; this matches the non-destructive, "opens a sheet" semantic — contrast with `(−)`'s `hapticRigid` for destructive-action feedback). **And** the handler opens the existing `CategoryPickerSheet` component (imported from `@/components/armario/CategoryPickerSheet`) by toggling a new `editingItem` React state from `null` to `item` — i.e. `const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null)` declared adjacent to `pendingDelete` state at line 114. Opening the sheet is driven by `visible={editingItem !== null}`, symmetric to the `pendingDelete !== null` pattern already used for the delete confirmation Modal at line 680. **And** `<CategoryPickerSheet>` is rendered at the end of the returned View tree as a sibling of the delete confirmation `<Modal>` (after line 793, BEFORE the root-closing `</View>` at line 794) so both modals stack independently — they never coexist on screen because opening the pencil sheet only happens in edit mode and no delete-confirm is pending. **And** the `currentCategory` prop is passed from `editingItem.category` (every item has a valid `WardrobeCategory` since Story 14.1 backfilled legacy items to `"top"` per TD-7; the field is required on `WardrobeItem` per `src/lib/wardrobeTypes.ts:10–23`). **And** `confirming` is omitted (not needed — store write is synchronous per `misLooksStore.ts:195–201`; unlike Story 14.5 which awaits the async `saveCutoutAsWardrobeItem`, `updateItemCategory` is purely in-memory + fire-and-forget `persist()` — no spinner state is required).

4. **Given** the `CategoryPickerSheet` is open with the current category pre-selected, **When** the user picks a different category and taps **"Confirmar"**, **Then** the sheet's `onConfirm(category: WardrobeCategory)` callback fires (the sheet itself already runs `hapticMedium()` before invoking the callback per `CategoryPickerSheet.tsx:83–86` — do NOT fire a second `hapticMedium` in the parent handler; the sheet owns this haptic per its documented contract from Story 14.5 AC #5). **And** the parent `handleEditCategoryConfirm(category)` handler runs:
    ```ts
    const handleEditCategoryConfirm = useCallback(
      (category: WardrobeCategory) => {
        if (editingItem === null) return;
        useMisLooksStore.getState().updateItemCategory(editingItem.id, category);
        setEditingItem(null);
      },
      [editingItem],
    );
    ```
    **And** this updates the item via the already-shipped `useMisLooksStore.updateItemCategory` action at `src/stores/misLooksStore.ts:195–201` — a synchronous in-memory map + background `persist(ITEMS_KEY, next)` (fire-and-forget `AsyncStorage.setItem` with a `__DEV__` warn on failure per `misLooksStore.ts:123–129`). **And** the handler uses `useMisLooksStore.getState()` (NOT a `useMisLooksStore((s) => s.updateItemCategory)` subscription) because: (a) the action identity is stable across renders (zustand guarantee), and (b) the handler lives outside the React tree on the click path, consistent with the existing `useMisLooksStore.getState().favorites.has(...)` / `useMisLooksStore.getState().addFavorite(...)` precedents already in this file at lines 185 and 199. **And** `setEditingItem(null)` dismisses the sheet (sets `visible=false` which triggers the `Modal`'s `animationType="slide"` slide-down per `CategoryPickerSheet.tsx:91–93`). **And** the user **remains in edit mode** — `exitEditMode()` is NOT called; the badges remain visible; the nav bar still shows "Cancelar / Editar armario / Listo" (multi-edit flow mirrors Story 14.12a's multi-delete retention pattern). **And** the grid re-renders the updated tile automatically — the `items` subscription at line 95 re-reads `useMisLooksStore((s) => s.items)` on the next zustand notification and the tile's `deleteA11yLabel` (AC #8 below) recomputes with the new category; no manual rerender trigger is needed.

5. **Given** the sheet is open and the user dismisses it **without selecting** (taps the backdrop `category-picker-sheet-backdrop` at `CategoryPickerSheet.tsx:100` OR swipes the modal down on iOS OR presses Android back which calls `onRequestClose`), **When** the sheet closes, **Then** the parent `handleEditCategoryCancel` handler fires:
    ```ts
    const handleEditCategoryCancel = useCallback(() => {
      setEditingItem(null);
    }, []);
    ```
    **And** NO change is persisted — `updateItemCategory` is NEVER called. **And** the user remains in edit mode (same multi-edit guarantee as AC #4). **And** the sheet's internal `selected` state resets correctly on the next open — this is already handled by the `useEffect` at `CategoryPickerSheet.tsx:71–75` which syncs `selected` to `currentCategory ?? null` every time `visible` flips true; no work needed in the parent.

6. **Given** the user picks the SAME category that's already assigned (e.g., a `"top"` item pencil-opened → user taps `"top"` row → Confirmar), **When** `handleEditCategoryConfirm("top")` runs, **Then** `updateItemCategory` is still called (the store maps items uniformly — it doesn't compare old vs new per `misLooksStore.ts:195–200`); `AsyncStorage.setItem` is still called (fire-and-forget persist); the sheet still dismisses; the user still remains in edit mode. **No-op same-category is a silent success**, not an error, not a short-circuit — this matches the store's existing test `"leaves non-matching items untouched"` at `misLooksStore.test.ts:555–564` (which asserts other items are unaffected but doesn't short-circuit when id matches with same category). **Do NOT add** a `if (category === editingItem.category) return;` guard — it's a premature optimization and breaks the testability of the "Confirmar always persists" invariant.

7. **Given** VoiceOver is enabled, **When** the user navigates to a pencil badge in edit mode, **Then** the badge's `accessibilityLabel` is `t("armario.s3.editMode.editCategoryA11yLabel", { category: t(\`unifiedCamera.categorySheet.${categoryLabelKey[item.category]}\`).toLowerCase() })` — producing ES: `"Editar categoría de parte de arriba"` / `"Editar categoría de parte de abajo"` / `"Editar categoría de calzado"` / `"Editar categoría de accesorio"` and EN: `"Edit category of top"` / `"Edit category of bottom"` / `"Edit category of footwear"` / `"Edit category of accessory"`. **Reuse** the existing `categoryLabelKey` lookup map at `ArmarioPickerScreen.tsx:65–70` (already declared from Story 14.12a; `satisfies Record<WardrobeCategory, string>` is already in place) — do NOT create a duplicate lookup. The category label strings (`"parte de arriba"`, `"top"`, etc.) come from the existing `unifiedCamera.categorySheet.row*` keys at `en.json:371–374` / `es.json:371–374` — same source that Story 14.12a uses for its `(−)` `deleteA11yLabel`, so a single edit of a category label propagates to both badges uniformly.

    **And** the badge has `accessibilityRole="button"` AND an `accessibilityHint={t("armario.s3.editMode.editCategoryA11yHint")}` equal to ES: `"Abre el selector de categoría para cambiar el tipo de prenda."` / EN: `"Opens the category picker to change the garment type."` — adds a hint because unlike the `(−)` (self-explanatory destructive action), the pencil's outcome is not obvious without saying "opens a sheet" (per epic AC at `epic-14.md:871`). **And** the pencil badge's `hitSlop={10}` produces a 44pt hit target identical to `(−)` — both icons satisfy the CLAUDE.md "44px minimum touch targets" rule.

8. **Given** the new i18n keys this story introduces, **When** this story merges, **Then** the following are added to `src/i18n/locales/es.json` INSIDE the existing `armario.s3.editMode` sub-block (landed by Story 14.12a at `es.json:301–310`) — append the 2 new keys AFTER the existing `tileA11yInEditMode` (and inside the closing `}` of `editMode`):

    ```json
    "editCategoryA11yLabel": "Editar categoría de {{category}}",
    "editCategoryA11yHint": "Abre el selector de categoría para cambiar el tipo de prenda."
    ```

    **And** EN mirrors at `src/i18n/locales/en.json` INSIDE the existing `armario.s3.editMode` sub-block at `en.json:301–310`:

    ```json
    "editCategoryA11yLabel": "Edit category of {{category}}",
    "editCategoryA11yHint": "Opens the category picker to change the garment type."
    ```

    **And** the existing ES/EN parity assertion at `src/i18n/__tests__/i18n.test.ts` (`flattenKeys(es).sort() === flattenKeys(en).sort()`) continues to pass — the 2 new keys × 2 locales = 4 mirrored entries. **No new top-level or `armario.s3`-level keys are added.** All strings belong inside the already-established `armario.s3.editMode.*` scope for clean co-location with the 8 Story 14.12a keys.

9. **Given** the category label interpolation inside `editCategoryA11yLabel`, **When** implementing the parent handler that computes the label, **Then** it is built inline inside `renderItem` at `ArmarioPickerScreen.tsx:531–641` adjacent to the existing `deleteA11yLabel` computation at lines 542–549 — NOT extracted to a helper function. Pattern to mirror:
    ```ts
    const editCategoryA11yLabel = t(
      "armario.s3.editMode.editCategoryA11yLabel",
      {
        category: t(
          `unifiedCamera.categorySheet.${categoryLabelKey[item.category]}`,
        ).toLowerCase(),
      },
    );
    ```
    **And** the `.toLowerCase()` is critical because the base noun labels are Title-Cased (`"Top"`, `"Bottom"`, `"Footwear"`, `"Accessory"` / `"Parte de arriba"`, etc.) for headline use in the sheet but need to be lower-case when interpolated into a mid-sentence template like `"Edit category of {{category}}"` → `"Edit category of top"` (NOT `"Edit category of Top"`). This mirrors the existing lower-casing at `ArmarioPickerScreen.tsx:547` for Story 14.12a's `deleteA11yLabel`. **Do NOT** localize the casing separately — `.toLowerCase()` works for both ES and EN because neither language capitalizes common nouns mid-sentence. The user's device locale is irrelevant to this call.

10. **Given** test coverage requirements per CLAUDE.md "Testing Discipline" + epic AC "Tests: open sheet, change category, persist change, cancel without change, VoiceOver" (`epic-14.md:878`), **When** this story lands, **Then** the following test cases are added to `src/screens/armario/ArmarioPickerScreen.test.tsx` (append inside the existing `describe("Story 14.12a — edit mode", ...)` block starting at line 565 — add a nested `describe("Story 14.12b — edit category via pencil", ...)` block after the last 14.12a test, OR a flat sibling `describe` — flat sibling preferred for discoverability):

    **New `describe("Story 14.12b — edit category via pencil", ...)` block:**
    - `"pencil badge renders on every tile in edit mode"` — `mockItems = [sampleItem("u1", "top"), sampleItem("u2", "bottom")]`; long-press `s3-item-u1`; assert `getByTestId("armario-edit-category-u1")` + `getByTestId("armario-edit-category-u2")` truthy.
    - `"pencil badge does NOT render in normal mode"` — fresh render (no long-press); assert `queryByTestId("armario-edit-category-u1")` is null.
    - `"pencil tap fires hapticLight and opens CategoryPickerSheet with current category pre-selected"` — enter edit mode on an item with `category: "bottom"`; `fireEvent.press(getByTestId("armario-edit-category-u1"))`; assert `hapticLight` called once; assert `getByTestId("category-picker-sheet")` visible; assert the `"bottom"` row renders its `checkmark.circle.fill` (via `category-picker-row-bottom-check` testID defined at `CategoryPickerSheet.tsx:209`).
    - `"selecting a new category in the sheet calls updateItemCategory with the new value and dismisses the sheet"` — flow above; `fireEvent.press(getByTestId("category-picker-row-accessory"))` (row select — fires `hapticLight` + sets selected); `fireEvent.press(getByTestId("category-picker-sheet-confirm"))`; assert `mockUpdateItemCategory` called with `("u1", "accessory")`; assert `queryByTestId("category-picker-sheet")` eventually null (sheet closed); assert user is STILL in edit mode — `queryByTestId("s3-edit-title")` truthy + `queryByTestId("armario-delete-u1")` truthy.
    - `"dismissing the sheet via backdrop tap does NOT call updateItemCategory"` — open sheet; `fireEvent.press(getByTestId("category-picker-sheet-backdrop"))`; assert `mockUpdateItemCategory` NOT called; assert sheet closed; assert user still in edit mode.
    - `"pencil badge accessibilityLabel interpolates the item's category label"` — enter edit mode; assert `getByTestId("armario-edit-category-u1").props.accessibilityLabel === "Edit category of top"` (EN i18n is active by default in this test suite); assert `getByTestId("armario-edit-category-u1").props.accessibilityHint === "Opens the category picker to change the garment type."`.
    - `"picking the same category still calls updateItemCategory (no short-circuit)"` — `sampleItem("u1", "top")`; pencil-tap; confirm same `"top"`; assert `mockUpdateItemCategory` called with `("u1", "top")` (proves AC #6 no-short-circuit invariant).

    **Extend the existing `jest.mock("@/stores/misLooksStore", ...)` at line 89** to expose `updateItemCategory` — currently the mock exposes `items`, `assignments`, `favorites`, `addFavorite`, `toggleFavorite`, `isFavorite` (plus helpers). Add a new `mockUpdateItemCategory = jest.fn()` module-scope variable and wire `updateItemCategory: (...args: unknown[]) => mockUpdateItemCategory(...args)` into the `getState()` return at `ArmarioPickerScreen.test.tsx:89–121` (inspect the current mock body and add a single line). Clear the mock in the `beforeEach` at line 566 with `mockUpdateItemCategory.mockClear()`. **Do NOT** edit the `useMisLooksStore` subscription pattern — only `getState()` needs the new action.

    **Expected test count**: **+7 new passing tests** (7 new `it()` blocks listed above, no existing tests modified or removed). Baseline: **935 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch) / 938 total** at `epic-14` HEAD `b56c0eb` (Story 14.12a merge commit — verify with `git log -1 epic-14`). Target post-story: **942 passing / 3 pre-existing / 945 total** (delta exactly +7). If count lands outside 942 ± 1, pause and debug before commit.

11. **Given** the `sampleItem` fixture signature `sampleItem(id: string, category: WardrobeCategory = "top")` already exists (extended by Story 14.12a at `ArmarioPickerScreen.test.tsx:123–131`), **When** writing the new tests, **Then** reuse it with an explicit category where relevant (e.g., `sampleItem("u1", "bottom")` for the pre-selection test). The fixture already imports `WardrobeCategory` from `@/lib/wardrobeTypes` at line 3 — no new import required.

12. **Given** the component boundary rules per CLAUDE.md "React Native Specifics" + "Rules of Hooks", **When** implementing the pencil additions, **Then**:
    - The new `editingItem` state uses `useState<WardrobeItem | null>(null)` declared adjacent to `pendingDelete` at line 114 — i.e. INSIDE the component, BEFORE the `if (missingOrInvalid) return null;` early return at line 341 (Rules of Hooks).
    - The new handlers `handleEditCategoryBadgePress`, `handleEditCategoryConfirm`, `handleEditCategoryCancel` are declared as `useCallback` adjacent to the existing `handleDeleteBadgePress` / `handleDeleteConfirm` / `handleDeleteCancel` at lines 282–311. Mirror the cb signature style (1 arg or 0 args, `useCallback(fn, deps)`).
    - `handleEditCategoryBadgePress` captures the item via closure over the `renderItem` scope (same as `handleDeleteBadgePress` at line 613 which receives `item`) — declare as `useCallback((item: WardrobeItem) => { hapticLight(); setEditingItem(item); }, [])`.
    - `handleEditCategoryConfirm` receives `category` and reads the current `editingItem` from React state (the closure dependency means the callback must include `[editingItem]` in the deps array so it captures the latest item reference). Guard against the stale `editingItem === null` case (AC #4).
    - `handleEditCategoryCancel` takes no args — just `setEditingItem(null)` with empty deps.
    - The `<CategoryPickerSheet>` JSX node is rendered at the end of the returned tree. Placement: INSIDE the root `<View>` at line 348, AFTER the delete confirmation `<Modal>` at line 678–793, BEFORE the root `</View>` at line 794. Props: `visible={editingItem !== null}`, `currentCategory={editingItem?.category}`, `onConfirm={handleEditCategoryConfirm}`, `onCancel={handleEditCategoryCancel}`. **Do NOT** pass `confirming` (AC #3) — it defaults to `undefined` which the sheet treats as "not confirming."
    - NO `StyleSheet.create`. Use `style={{}}` inline for the pixel-valued badge (reuse the exact `style` object shape from the `(−)` `Pressable` at lines 617–626 — only change `left: 4` → `right: 4`). This duplicates ~10 lines; per CLAUDE.md "Three similar lines is better than a premature abstraction", do NOT extract `<EditModeBadge>` for this second consumer (would require 4 prop additions and introduce a new file + test file — the cost exceeds the benefit at the current duplication level; revisit only if a third badge variant lands).
    - Haptics via `@/lib/haptics` only. `hapticLight` is already imported at line 37 — no import edit needed.
    - `SymbolView` is already imported at line 10 — no import edit needed.
    - Function declarations with named exports: NO new components are exported from this story (all edits are inlined additions to `ArmarioPickerScreen`).
    - `testID` naming convention: `armario-edit-category-${id}` — mirrors the `armario-delete-${id}` shape from UX-DR3. Do NOT use `s3-edit-category-${id}` despite the rest of the S3 picker using `s3-*` prefixes; the dual-icon affordance IDs intentionally sit at the armario-scope per UX-DR3's precedent for the `(−)` badge.

13. **Given** `npx tsc --noEmit` + `pnpm lint`, **When** both run on this story branch, **Then**:
    - `tsc` zero new errors. New `editingItem: WardrobeItem | null` state, 3 new `useCallback` handlers, and the 2 new i18n key strings all narrow cleanly against existing types.
    - `pnpm lint` has the SAME 2 pre-existing Biome format errors as Story 14.12a baseline (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`) and ZERO new findings. NEW lines in `ArmarioPickerScreen.tsx`, `ArmarioPickerScreen.test.tsx`, and locales JSON must pass `biome check` cleanly. Run `pnpm lint --write src/screens/armario/ArmarioPickerScreen.tsx src/screens/armario/ArmarioPickerScreen.test.tsx src/i18n/locales/es.json src/i18n/locales/en.json` once before commit; if formatting-only auto-fixes land on pre-existing code, accept only the diff scoped to this story's edits (revert unrelated reformatting with `git checkout --`).
    - Per CLAUDE.md: all new hooks called BEFORE the `if (missingOrInvalid) return null;` early return at line 341 (Rules of Hooks).
    - Per `feedback_native_module_rebuild.md`: this story is pure JS/TSX + JSON edits, NO native module touched → `expo start --clear` is sufficient for visual smoke; full `expo run:ios` is NOT required.

14. **Given** the branching convention per `feedback_workflow.md`, **When** this story starts, **Then** the dev agent creates branch `story/14-12b-edit-category-affordance` off `epic-14` HEAD (verify with `git log -1 epic-14` — expect commit `b56c0eb` or later). Diff scope:
    - **NEW**: (none — no new files; all edits are inline additions to existing files. Do NOT create `src/components/armario/EditModeBadge.tsx` per AC #12 "three similar lines is better than a premature abstraction" — revisit only if Alejandro explicitly asks for the extraction during visual smoke.)
    - **MODIFIED**: `src/screens/armario/ArmarioPickerScreen.tsx` (+ `editingItem` useState; + 3 new `useCallback` handlers; + pencil `Animated.View` + inner `Pressable` rendered inside `renderItem` at the placeholder comment; + `<CategoryPickerSheet>` JSX node rendered as sibling of the delete Modal; + `CategoryPickerSheet` import at top), `src/screens/armario/ArmarioPickerScreen.test.tsx` (+ 7 new `it()` blocks in new flat `describe("Story 14.12b — edit category via pencil", ...)` block; + `mockUpdateItemCategory` module-scope jest.fn() + wiring into the existing `useMisLooksStore` mock at lines 89–121; + `.mockClear()` in the new block's `beforeEach`), `src/i18n/locales/es.json` + `src/i18n/locales/en.json` (+ 2 new keys each inside existing `armario.s3.editMode` sub-block = 4 values total).
    - **NOT TOUCHED** (any edit = scope creep): `CategoryPickerSheet.tsx` (the reused component is API-compatible as-is per Story 14.5 — do NOT tweak its props, do NOT add new i18n keys inside `unifiedCamera.categorySheet.*`), `CategoryPickerSheet.test.tsx`, `misLooksStore.ts` (`updateItemCategory` already ships), `misLooksStore.test.ts` (already covers `updateItemCategory`), `ArmarioFichaWadaScreen.tsx`, `ArmarioZeroStateScreen.tsx`, `FavoritesList.tsx`, `NewLookCtaCard.tsx`, `IncompleteLooksSection.tsx`, `MisLooksLimitStrip.tsx`, `CompletenessBadge.tsx`, `WardrobeItemThumb.tsx`, `selectIncompleteLooks.ts`, `usePremiumGate.ts`, `PremiumPaywall.tsx`, `wardrobeRepo.ts`, `navigation/types.ts`, `navigation/FavoritesStack.tsx`, any native module, `app.json`, `CustomTabBar.tsx`. **Critically: do NOT delete the `// Story 14.12b: pencil icon sibling added here (top-right)` comment at line 598 — replace it with the actual implementation (the comment served its coordination purpose; the code itself becomes the permanent marker).**

## Tasks / Subtasks

- [x] **Task 1** — Wire `editingItem` state + 3 `useCallback` handlers + `CategoryPickerSheet` import and JSX placement (AC: #3, #4, #5, #12)
  - [x] Import `CategoryPickerSheet` from `@/components/armario/CategoryPickerSheet` at the top of `ArmarioPickerScreen.tsx`.
  - [x] Add `const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null)` adjacent to `pendingDelete` state at line 114.
  - [x] Declare `handleEditCategoryBadgePress = useCallback((item: WardrobeItem) => { hapticLight(); setEditingItem(item); }, [])` adjacent to `handleDeleteBadgePress` at lines 282–285.
  - [x] Declare `handleEditCategoryConfirm = useCallback((category: WardrobeCategory) => { if (editingItem === null) return; useMisLooksStore.getState().updateItemCategory(editingItem.id, category); setEditingItem(null); }, [editingItem])` adjacent to `handleDeleteConfirm` at lines 287–307.
  - [x] Declare `handleEditCategoryCancel = useCallback(() => { setEditingItem(null); }, [])` adjacent to `handleDeleteCancel` at lines 309–311.
  - [x] Render `<CategoryPickerSheet visible={editingItem !== null} currentCategory={editingItem?.category} onConfirm={handleEditCategoryConfirm} onCancel={handleEditCategoryCancel} />` inside the root `<View>` at line 348, AFTER the delete `<Modal>` at lines 678–793, BEFORE the root `</View>` at line 794.

- [x] **Task 2** — Replace placeholder comment with pencil `Animated.View` + inner `Pressable` + `SymbolView` (AC: #1, #2, #7, #12)
  - [x] Locate the `// Story 14.12b: pencil icon sibling added here (top-right)` comment at `ArmarioPickerScreen.tsx:598`.
  - [x] Replace it with an `Animated.View` wrapping a `Pressable testID={\`armario-edit-category-${item.id}\`}` wrapping `<SymbolView name="pencil" size={14} tintColor={wadaTokens.textPrimary} type="hierarchical" resizeMode="scaleAspectFit" />`. Copy the entire `(−)` render block from lines 599–637 as a template; change `left: 4` → `right: 4`, `name="minus"` → `name="pencil"`, `testID={\`armario-delete-${item.id}\`}` → `testID={\`armario-edit-category-${item.id}\`}`, `onPress={() => handleDeleteBadgePress(item)}` → `onPress={() => handleEditCategoryBadgePress(item)}`, `accessibilityLabel={deleteA11yLabel}` → `accessibilityLabel={editCategoryA11yLabel}` + add `accessibilityHint={t("armario.s3.editMode.editCategoryA11yHint")}`.
  - [x] Reuse the existing `editBadgeAnimStyle` animated style (NO new `useSharedValue` / `useAnimatedStyle`) — both badges fade together on the same `editOpacity` shared value.
  - [x] Keep both badges wrapped in `{isEditMode && (...)}` — the `(−)` already is; the new pencil matches.

- [x] **Task 3** — Build `editCategoryA11yLabel` inside `renderItem` + add the 2 × 2 new i18n keys (AC: #7, #8, #9)
  - [x] Inside `renderItem` at lines 531–641, adjacent to the existing `deleteA11yLabel` computation at lines 542–549, add `const editCategoryA11yLabel = t("armario.s3.editMode.editCategoryA11yLabel", { category: t(\`unifiedCamera.categorySheet.${categoryLabelKey[item.category]}\`).toLowerCase() })`.
  - [x] `src/i18n/locales/es.json`: append `editCategoryA11yLabel` + `editCategoryA11yHint` inside the existing `armario.s3.editMode` sub-block (after `tileA11yInEditMode` at line 309).
  - [x] `src/i18n/locales/en.json`: mirror the 2 new keys inside the same sub-block.
  - [x] Run `pnpm test src/i18n/__tests__/i18n.test.ts` locally to confirm the ES/EN parity assertion still passes.

- [x] **Task 4** — Add 7 new tests + extend `useMisLooksStore` mock with `updateItemCategory` (AC: #10, #11)
  - [x] Inspect the existing `jest.mock("@/stores/misLooksStore", ...)` at `ArmarioPickerScreen.test.tsx:89–121`; add a module-scope `let mockUpdateItemCategory = jest.fn()` near the other module-scope mocks; wire it into the mock body's `getState()` return as a new `updateItemCategory: (...args: unknown[]) => mockUpdateItemCategory(...args)` entry.
  - [x] After the last test in `describe("Story 14.12a — edit mode", ...)` (closing brace currently around line 841), add a new flat sibling `describe("Story 14.12b — edit category via pencil", () => { ... })` block with its own `beforeEach` that clears `mockUpdateItemCategory` (+ `hapticLight`, + `mockAnnounce`).
  - [x] Add the 7 `it(...)` blocks enumerated in AC #10.
  - [x] Run `pnpm test src/screens/armario/ArmarioPickerScreen.test.tsx` locally → assert 44/44 passing (37 from 14.12a + 7 new from 14.12b).
  - [x] Run full `pnpm test` → assert 942 passing / 3 pre-existing / 945 total. If count off by more than ±1, pause and debug before commit.

- [x] **Task 5** — Quality gates + AC walkthrough + sprint-status handoff + branch hygiene (AC: #13, #14, #15)
  - [x] `npx tsc --noEmit` → clean.
  - [x] `pnpm lint` → 2 pre-existing Biome format errors unchanged (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`). Zero new findings. Auto-fix applied only to story-scoped files (pre-existing formatting reverted via `git checkout --` per AC #13).
  - [x] Full `pnpm test` → 942 passing / 3 pre-existing / 945 total (delta exactly +7 vs. 935/3/938 baseline from 14.12a done at `epic-14@b56c0eb`).
  - [x] AC #1–#14 walk-through documented in Completion Notes.
  - [x] `sprint-status.yaml` moved `14-12b-edit-category-affordance` ready-for-dev → in-progress → review.
  - [x] Commit on branch `story/14-12b-edit-category-affordance`; do NOT merge into `epic-14` yet.
  - [x] Hand off for Alejandro's Expo simulator visual smoke + adversarial code-review gate before merge into `epic-14`.

### Review Findings

- [x] [Review][Defer] D1: `mockAddFavorite.mockReset()` vs `mockUpdateItemCategory.mockClear()` inconsistency in test `beforeEach` [`ArmarioPickerScreen.test.tsx`] — deferred, inconsistencia heredada del patrón de 14.12a; no causa fallos de test
- [x] [Review][Defer] D2: Stale `editingItem` closure si el item es eliminado mientras el sheet está abierto [`ArmarioPickerScreen.tsx:320-327`] — deferred, imposible en práctica (CategoryPickerSheet Modal bloquea el grid); ghost-write silencioso teórico al store que hace no-op
- [x] [Review][Defer] D3: No hay `AccessibilityInfo.announceForAccessibility` tras confirmar cambio de categoría [`ArmarioPickerScreen.tsx:323`] — deferred, gap de accesibilidad no requerido por spec AC #7; mejora futura deseable para usuarios VoiceOver
- [x] [Review][Defer] D4: `exitEditMode` no limpia `editingItem` si es non-null al salir del modo edición [`ArmarioPickerScreen.tsx` - `exitEditMode` handler] — deferred, bug latente no alcanzable via UI actual (el sheet Modal bloquea header "Listo"/"Cancelar"); añadir `setEditingItem(null)` en future-proof pass
- [x] [Review][Defer] D5: `Dimensions.get("window").height` estático al cargar módulo en `CategoryPickerSheet` [`CategoryPickerSheet.tsx:58`] — deferred, pre-existente en el componente reutilizado (no introducido por esta story); riesgo de height incorrecto en iPad split-screen u orientación landscape
- [x] [Review][Defer] D6: `editCategoryA11yLabel` calculado unconditionally en `renderItem` para todos los tiles aunque `isEditMode=false` [`ArmarioPickerScreen.tsx:567-577`] — deferred, micro-observación de perf; negligible con ≤10 items (FREE_WARDROBE_LIMIT)

## Dev Notes

### Previous Story Intelligence (Story 14.12a)

- **Test baseline to beat**: 935 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch) / 938 total at `epic-14` HEAD `b56c0eb` (Story 14.12a merge commit). Pre-existing failures must remain at 3.
- **Edit-mode infrastructure is ALREADY shipped.** Story 14.12a installed: `isEditMode` state, `editOpacity` shared value, `editBadgeAnimStyle` animated style, `enterEditMode` / `exitEditMode` handlers, `handleLongPressTile`, the header conditional ternary at lines 401–486, and the `(−)` badge at lines 598–637 inside the tile `<Pressable>`. **Story 14.12b is a pure additive on top of this scaffolding** — no existing behavior is modified, no existing test is touched.
- **Dual-icon coordination.** Story 14.12a left `// Story 14.12b: pencil icon sibling added here (top-right)` at `ArmarioPickerScreen.tsx:598` — the dev agent for 14.12b should find that exact line and replace it with the pencil render block (see Task 2). Copy the `(−)` block structure verbatim and only change 4–5 values per Task 2 substeps; the diff is intentionally 12 lines of clone work — this is the approved design per AC #12 "three similar lines is better than a premature abstraction."
- **Shared `editOpacity`.** Both badges fade in/out on the SAME shared value — do NOT introduce a second `useSharedValue`. This is essential for visual coherence (both icons appear simultaneously; no stagger) AND correct Reduce-Motion behavior (skipping the tween on `editOpacity` already skips both icons together).
- **`updateItemCategory` action is ALREADY shipped and tested.** Story 14.1 landed it at `misLooksStore.ts:195–201` with full test coverage at `misLooksStore.test.ts:536–573`. The epic spec's Task 3 phrasing ("add this action to the store API") is stale — do NOT re-add it. Consume as-is via `useMisLooksStore.getState().updateItemCategory(id, category)`.
- **`CategoryPickerSheet` is ALREADY shipped and exported with the needed `currentCategory` prop.** Story 14.5 landed it at `src/components/armario/CategoryPickerSheet.tsx:17–23` with the full `CategoryPickerSheetProps` interface: `{ visible, currentCategory?, onConfirm, onCancel, confirming? }`. The `useEffect` at lines 71–75 re-syncs `selected` to `currentCategory ?? null` every time `visible` flips true — so opening the sheet again with a different pre-selected item "just works" with no extra work in the parent. This is the non-negotiable reuse per epic-14.md:881 "do NOT create a second sheet variant."
- **The sheet fires `hapticMedium` internally** on Confirmar per `CategoryPickerSheet.tsx:84` — do NOT fire a second `hapticMedium` in the parent `handleEditCategoryConfirm`. Row-tap `hapticLight` is also fired inside the sheet per line 78 — the parent's only haptic responsibility is the initial pencil-tap `hapticLight` (AC #3).
- **`pencil` SF Symbol is rendered generically by the jest mock.** The existing `jest.mock("expo-symbols", ...)` in `ArmarioPickerScreen.test.tsx:16–28` uses a passthrough `name` prop to build `testID={\`symbol-${name}\`}` — so `<SymbolView name="pencil" ... />` renders as `<View testID="symbol-pencil" />` with no mock edit required.

### Architecture compliance

- **Single-screen scope**: All production edits happen inside `ArmarioPickerScreen.tsx` + its test file + locales. No navigation changes, no new routes, no store-slice additions, no component extraction, no repo changes. Category-update persistence reuses the already-shipped `updateItemCategory` action byte-for-byte (the store action was explicitly shipped in 14.1 per ADR-005 "Resulting architecture" note at `misLooksStore.ts:192–194` precisely to keep this story's diff minimal).
- **React Native + Reanimated**: No new animation. Reuse the existing `editBadgeAnimStyle` animated style. Both badges share `editOpacity`. No new `useSharedValue` / `useAnimatedStyle` calls needed.
- **Rules of Hooks**: The single new `useState` + 3 new `useCallback` hooks all declared BEFORE the `if (missingOrInvalid) return null;` early return at line 341. Adjacent to the similarly-shaped 14.12a hooks (which all pass this rule).
- **i18n nesting discipline**: All 2 new keys live inside the already-established `armario.s3.editMode` sub-block (added by 14.12a). No new sub-block. Category noun labels are reused from `unifiedCamera.categorySheet.row*` — zero duplication.

### Reuse thesis (TD-6 closure)

**The whole point of this story is to validate the reuse thesis baked into Story 14.5.** Story 14.5's AC #3 explicitly required `CategoryPickerSheet` to be exported from `src/components/armario/` (not inlined inside the camera screen) specifically so that 14.12b could consume it without a refactor. The `currentCategory?: WardrobeCategory` prop was added at that time to support 14.12b's pre-selection requirement. This story proves the thesis by:
1. Importing the component from `@/components/armario/CategoryPickerSheet` (no copy).
2. Passing `currentCategory={editingItem?.category}` (uses the prop for the first time).
3. Using a different `onConfirm` handler (`updateItemCategory` instead of `saveCutoutAsWardrobeItem`) — proves the separation of selection-from-persistence that Story 14.5 AC #3 mandated.

**If the dev agent finds the reuse is NOT clean** (e.g., the sheet's layout assumptions don't fit the S3 picker context, or `currentCategory` doesn't pre-select correctly in practice), flag via `## Open Questions` before forking. Default expectation: the reuse is clean out of the box; this is a straightforward integration, not a redesign.

### Same-category no-op (AC #6)

The default implementation calls `updateItemCategory` on Confirmar regardless of whether the new category equals the current. Rationale:
- **Testability**: the "Confirmar always persists" invariant is simpler to assert than "Confirmar persists unless category unchanged."
- **Cost**: the no-op store write is effectively free — `items.map(...)` produces an identical (but new-reference) array; `persist()` writes the same JSON string to AsyncStorage.
- **Simplicity**: no edge case to reason about; no branching user surface (UX-DR3 does not specify this case — silence is the signal).

A guard like `if (category === editingItem.category) { setEditingItem(null); return; }` could be added as a micro-optimization in a follow-up if AsyncStorage write volume becomes a concern — currently the wardrobe has ≤10 items for free users (`FREE_WARDROBE_LIMIT`) and the store write is capped at one per confirm tap, so there is no plausible perf concern.

### `hapticLight` vs `hapticMedium` on pencil tap (AC #3)

Epic AC at `epic-14.md:853` explicitly specifies *"`hapticLight` fires"* on pencil tap — use this exact haptic, NOT `hapticMedium`. The reasoning (implied by the haptics taxonomy used elsewhere in the app):
- **`hapticLight`**: low-friction feedback for non-destructive, "reveals a new surface" actions (e.g., opens a sheet, expands a detail). Matches: tapping the pencil opens `CategoryPickerSheet`.
- **`hapticMedium`**: committal feedback for "starts a flow" or "opens a decision point" actions (e.g., Confirmar tap inside the sheet — fired by the sheet internally; long-press → edit mode — fired by `enterEditMode`).
- **`hapticRigid`**: destructive-action feedback (e.g., the `(−)` tap per 14.12a AC #3 — opens the delete confirmation which can irreversibly remove the garment).

The pencil is non-destructive (opens a sheet; cancelling persists nothing), so `hapticLight` is the correct taxonomy fit. This matches the haptic pattern at `ArmarioPickerScreen.tsx:234` (`hapticLight()` on tapping "Nueva foto" footer — another "opens a new surface" action).

### Testing strategy notes

- **Jest mock for `useMisLooksStore`** already covers `items`, `assignments`, `favorites`, plus `addFavorite`, `toggleFavorite`, `isFavorite`, `removeFavorite`. The existing pattern at `ArmarioPickerScreen.test.tsx:89–121` builds both a hook subscription (`useMisLooksStore(selector)`) AND a `getState()` accessor. Add `updateItemCategory` to the `getState()` return shape only (the hook subscription is unused for this action — the handler calls `getState()` directly per AC #4).
- **`fireEvent.press` on the pencil** won't go through `React Native`'s gesture system; it directly invokes `onPress`. Assert `hapticLight` called exactly once (not twice — the sheet's row-select `hapticLight` fires ONLY after the sheet opens and the user taps a row; mock it to observe the full sequence).
- **Sheet open detection in tests**: assert `getByTestId("category-picker-sheet")` visible (testID defined at `CategoryPickerSheet.tsx:115`). The sheet renders inside a `Modal`; React Native Testing Library treats Modals as queryable by default — no special setup needed.
- **Pre-selection verification**: assert the selected-row check icon renders via `getByTestId(\`category-picker-row-${expectedCategory}-check\`)` (testID defined at `CategoryPickerSheet.tsx:209`). This is more reliable than asserting the "selected" visual tint because the tint is a backgroundColor style that React Native Testing Library doesn't compare cleanly.

### Shared vs inline badge (revisited)

Story 14.12a's Dev Notes flagged this as a future decision: *"Two consumers is below the Rule of Three. 14.12b can extract if the duplication hurts — or keep inline if the clone is cheap."* Decision for 14.12b: **keep inline.** Rationale:
- The clone is 12 lines (the `(−)` render block at lines 599–637, minus comments, minus the opening/closing braces that stay the same); only 4 values differ (`left/right`, `name`, `testID`, `onPress`).
- Extraction would require: a new file `src/components/armario/EditModeBadge.tsx`, a new test file `EditModeBadge.test.tsx`, 4+ props on the interface (`side: "left" | "right"`, `iconName: "minus" | "pencil"`, `onPress`, `testID`, `accessibilityLabel`, `accessibilityHint?`, `animatedStyle`), and a consumer migration of the existing `(−)` render in this story's diff (scope creep).
- The badges are visually coupled inside the tile — inlining keeps the dual-icon layout visible in one code block (easier to reason about spacing, stacking, z-indices).
- If a third badge variant (e.g., a "favorite" heart in edit mode) ever lands, THAT story can refactor all three into `EditModeBadge`. Rule of Three satisfied at that point.

### References

- **Epic spec**: `docs/planning/epic-14/epic-14.md:834–881` (Story 14.12b definition).
- **UX spec**: `docs/planning/ux-design-epic-14.md:355–444` (UX-DR3 — covers the edit-mode shell; does NOT explicitly spell out the pencil treatment, which is inferred from epic-14.md:830 + :842 "clean style matching the `(−)` aesthetic, top-right corner"). Pencil document `designs/Epic14.pen` may contain pixel-level treatment — if dev finds ambiguity during implementation, flag via `## Open Questions` and use the symmetric mirror-of-`(−)` treatment as the fallback (which is what this spec mandates).
- **Screen to modify**: `src/screens/armario/ArmarioPickerScreen.tsx` (794 lines).
- **Test file to extend**: `src/screens/armario/ArmarioPickerScreen.test.tsx` (841 lines) — append new `describe("Story 14.12b — edit category via pencil", ...)` block AFTER the Story 14.12a block.
- **Component to reuse (do NOT modify)**: `src/components/armario/CategoryPickerSheet.tsx` — already exports `CategoryPickerSheet` with `currentCategory?: WardrobeCategory` prop per Story 14.5.
- **Store action to consume (do NOT modify)**: `src/stores/misLooksStore.ts:195–201` — `updateItemCategory(id, category)` already shipped by Story 14.1, fully tested at `misLooksStore.test.ts:536–573`.
- **Locales**: `src/i18n/locales/es.json:301–310` + `src/i18n/locales/en.json:301–310` — append 2 new keys inside existing `armario.s3.editMode` sub-block.
- **Types consumed**: `WardrobeCategory` from `src/lib/wardrobeTypes.ts:8` (`"top" | "bottom" | "footwear" | "accessory"`).
- **Haptics**: `src/lib/haptics.ts` — `hapticLight` for non-destructive "opens sheet" feedback (already imported at `ArmarioPickerScreen.tsx:37`).
- **SF Symbol**: `pencil` (iOS 13+, standard SF Symbol library — same generation mechanism as the existing `minus` / `tshirt.fill` / `figure.stand` / `shoe.fill` / `eyeglasses` / `checkmark.circle.fill` / `bookmark` symbols already used in the app).
- **Category-label source**: `unifiedCamera.categorySheet.row*` keys at `en.json:371–374` / `es.json:371–374`.
- **Accessibility precedent**: Story 14.12a's `(−)` `accessibilityLabel` interpolation at `ArmarioPickerScreen.tsx:542–549` — mirror for the pencil's `editCategoryA11yLabel`.
- **Branching**: `feedback_workflow.md` — `story/14-12b-edit-category-affordance` off `epic-14` HEAD `b56c0eb` (verify with `git log -1 epic-14`).

### Project Structure Notes

- All new code lives inside `ArmarioPickerScreen.tsx` (screen module). No new components, no new helpers in `src/lib/` or `src/components/`. This adheres to CLAUDE.md "Don't design for hypothetical future requirements."
- The 2 new i18n keys are nested inside the existing `armario.s3.editMode` sub-block — keeps all edit-mode strings co-located with the 8 Story 14.12a keys.
- `testID` naming convention: `armario-edit-category-${id}` — armario-scope prefix matches `armario-delete-${id}` (UX-DR3 precedent), NOT `s3-*` (which is used for the scrim, sheet, grid, title, confirm-sheet testIDs). Both badges live at armario-scope because they are per-item garment affordances, not sheet-structure elements.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — bmad-dev-story workflow.

### Debug Log References

- Initial lint run surfaced 2 new multi-line formatting issues (one in `useMisLooksStore` mock wiring in the test file, one in `handleEditCategoryConfirm` inside the screen) — both introduced by my edits. Hand-fixed to single-line form (matches Biome's printed output); the 2 pre-existing Biome formatting errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`) remain unchanged per AC #13 baseline contract.
- First test run failed on `category-picker-row-bottom-check` testID because the global `expo-symbols` jest mock overrides `testID` with `symbol-${name}`, so the check-glyph testID defined at `CategoryPickerSheet.tsx:209` is never rendered under test. Swapped the pre-selection assertion to `getByTestId("category-picker-row-bottom").props.accessibilityState` which carries `selected: true` — more reliable and still proves pre-selection per AC #3 (the row renders as selected after `useEffect` syncs `selected = currentCategory` on `visible` rising edge). No change to `CategoryPickerSheet.tsx` — reuse thesis intact per AC #14.

### Completion Notes List

- **AC #1** ✅ Pencil badge `<Animated.View>` + `<Pressable testID="armario-edit-category-${item.id}" hitSlop={10}>` + `<SymbolView name="pencil" size={14} tintColor={wadaTokens.textPrimary} type="hierarchical" resizeMode="scaleAspectFit" />` rendered absolutely at `top: 4, right: 4, zIndex: 2` — mirror of the `(−)` block. Gated by `{isEditMode && (...)}`. Reuses the existing `editBadgeAnimStyle` (same `editOpacity` shared value — no new `useSharedValue`).
- **AC #2** ✅ Badge positions are `top:4,left:4` vs `top:4,right:4`; 24pt circles on ≥106pt tile give ~50pt of clear thumbnail between them; `hitSlop={10}` hit zones have a 38pt gap at tile center. No tile-size adjustments.
- **AC #3** ✅ `handleEditCategoryBadgePress` fires `hapticLight()` + `setEditingItem(item)`. `<CategoryPickerSheet>` rendered as sibling of the delete `<Modal>` with `visible={editingItem !== null}`, `currentCategory={editingItem?.category}`, no `confirming` prop. Verified by "pencil tap fires hapticLight and opens CategoryPickerSheet with current category pre-selected".
- **AC #4** ✅ `handleEditCategoryConfirm` is a `useCallback([editingItem])` that guards against `editingItem === null`, calls `useMisLooksStore.getState().updateItemCategory(editingItem.id, category)`, then `setEditingItem(null)`. User remains in edit mode (no `exitEditMode()` call). Verified by "selecting a new category in the sheet calls updateItemCategory with the new value and dismisses the sheet" which also asserts `s3-edit-title` + `armario-delete-u1` still visible after confirm.
- **AC #5** ✅ `handleEditCategoryCancel = useCallback(() => setEditingItem(null), [])`. Backdrop-tap path exercised by "dismissing the sheet via backdrop tap does NOT call updateItemCategory" — asserts no store mutation and user still in edit mode.
- **AC #6** ✅ No short-circuit on same-category confirm. Verified by "picking the same category still calls updateItemCategory (no short-circuit)" — `mockUpdateItemCategory("u1", "top")` recorded.
- **AC #7** ✅ Pencil badge `accessibilityLabel = t("armario.s3.editMode.editCategoryA11yLabel", { category: lowerCased-label })`, `accessibilityHint = t("armario.s3.editMode.editCategoryA11yHint")`, `accessibilityRole = "button"`, `hitSlop={10}`. Verified by "pencil badge accessibilityLabel interpolates the item's category label and exposes a hint" — `"Edit category of top"` + hint + role "button".
- **AC #8** ✅ 2 new keys × 2 locales added inside existing `armario.s3.editMode` sub-block in both `es.json` and `en.json`. Parity assertion at `src/i18n/__tests__/i18n.test.ts` passes (14/17 pass; 3 failures are the pre-existing `detectLanguage` Intl-mock branch, unrelated).
- **AC #9** ✅ `editCategoryA11yLabel` built inline inside `renderItem` adjacent to `deleteA11yLabel`, with `.toLowerCase()` on the interpolated category noun. Reuses the Story-14.12a `categoryLabelKey` lookup — no duplicate.
- **AC #10** ✅ +7 new `it(...)` tests in new flat-sibling `describe("Story 14.12b — edit category via pencil", ...)` block. Full suite: **942 passing / 3 pre-existing / 945 total** — exact target hit (delta +7 vs 935/3/938 baseline). File-scoped: **44 passing / 44 total** in `ArmarioPickerScreen.test.tsx` (37 from 14.12a + 7 from 14.12b). Extended the `useMisLooksStore` jest mock with `mockUpdateItemCategory` wired into `getState()`.
- **AC #11** ✅ `sampleItem(id, category)` fixture reused as-is with explicit category (`sampleItem("u1", "bottom")` for the pre-selection test, `sampleItem("u1", "top")` for the same-category test, `sampleItem("u2", "bottom")` to prove every-tile coverage).
- **AC #12** ✅ New `useState` + 3 `useCallback` hooks declared BEFORE the `if (missingOrInvalid) return null;` early return (Rules of Hooks preserved). No `StyleSheet.create`; inline `style={{}}` for pixel values. No `<EditModeBadge>` extraction — two consumers stay below Rule of Three. `testID` uses the `armario-edit-category-${id}` shape (armario-scope, matches UX-DR3 precedent from `(−)` badge).
- **AC #13** ✅ `npx tsc --noEmit` clean. `pnpm lint` shows only the 2 pre-existing format errors in `FavoritesList.test.tsx` + `OutfitVisualizer.tsx` — zero new findings from this story's diff. No native module touched; `expo start --clear` is sufficient for visual smoke (AC #13 fourth bullet).
- **AC #14** ✅ Branch `story/14-12b-edit-category-affordance` off `epic-14` HEAD `b56c0eb` (Story 14.12a merge). Files modified: `ArmarioPickerScreen.tsx`, `ArmarioPickerScreen.test.tsx`, `es.json`, `en.json`. NO new files. NOT-TOUCHED list honored: `CategoryPickerSheet.tsx` / `.test.tsx`, `misLooksStore.ts` / `.test.ts`, all 14.x screen modules, navigation types, native modules, `app.json`. Placeholder comment at line 598 replaced by the actual pencil render block.

**Reuse thesis validated.** `CategoryPickerSheet` imported as-is from `@/components/armario/CategoryPickerSheet`, `currentCategory` prop consumed for the first time (pre-selection works via the internal `useEffect` that syncs `selected` to `currentCategory` on every `visible` rising edge), and the different `onConfirm` handler (`updateItemCategory` instead of `saveCutoutAsWardrobeItem`) proves the separation of selection from persistence that Story 14.5 AC #3 mandated. TD-6 closed.

**Open Questions** (from the story) — default choices held. All four are visual-smoke items for Alejandro:
1. Pencil icon pixel treatment — symmetric mirror of `(−)` as specced.
2. Same-category Confirmar short-circuit — NOT added; always persists (testable invariant).
3. Stacked Modals if pencil-tap while `pendingDelete !== null` — accepted (option b); no guard added.
4. Auto-exit on confirm — NOT applied; multi-edit retention preserved per `epic-14.md:862`.

### File List

- `src/screens/armario/ArmarioPickerScreen.tsx` (MODIFIED) — `CategoryPickerSheet` import; `editingItem` `useState`; 3 new `useCallback` handlers; pencil `<Animated.View>` + inner `<Pressable>` + `<SymbolView name="pencil">` render block (top-right sibling of the `(−)` badge); `<CategoryPickerSheet>` JSX as sibling of the delete `<Modal>`; `editCategoryA11yLabel` inline computation inside `renderItem`.
- `src/screens/armario/ArmarioPickerScreen.test.tsx` (MODIFIED) — `mockUpdateItemCategory = jest.fn()` module-scope + wired into `useMisLooksStore` mock's `getState()` return; new flat-sibling `describe("Story 14.12b — edit category via pencil", ...)` block with 7 `it(...)` cases covering render-in-edit-mode, hide-in-normal-mode, tap-opens-sheet-with-pre-selection, confirm-calls-updateItemCategory-and-dismisses (plus edit-mode retention), backdrop-cancel-does-not-persist, a11y-label-interpolation-with-hint, same-category-Confirmar-still-persists.
- `src/i18n/locales/es.json` (MODIFIED) — +2 keys (`armario.s3.editMode.editCategoryA11yLabel`, `armario.s3.editMode.editCategoryA11yHint`) inside existing sub-block.
- `src/i18n/locales/en.json` (MODIFIED) — +2 mirror keys.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) — story `14-12b-edit-category-affordance` transitioned `ready-for-dev → in-progress → review`.
- `_bmad-output/implementation-artifacts/14-12b-edit-category-affordance.md` (MODIFIED) — Tasks/Subtasks checkboxes, Dev Agent Record, File List, Change Log, Status.

### Change Log

- 2026-04-22 — Story 14.12b implementation — pencil edit-category badge sibling of `(−)` badge in S3 picker edit mode, CategoryPickerSheet reuse with `currentCategory` pre-selection, `updateItemCategory` store write, 2 new a11y i18n keys × 2 locales, +7 passing tests. Baseline: 942 passing / 3 pre-existing / 945 total. tsc clean. Lint baseline preserved (2 pre-existing format errors only). TD-6 closed. Reuse thesis validated.

## Open Questions

1. **Pencil icon treatment vs. `(−)` icon treatment.** Spec mandates "clean style matching the `(−)` aesthetic" (epic-14.md:842) but does NOT give pixel-level pencil specifics. This story implements a symmetric mirror: same 24pt circle, same paper-cream bg, same 1pt muted-charcoal border, same 14pt glyph inside — only the icon glyph (`pencil` vs `minus`) and the side (right vs left) differ. If Alejandro wants a distinct treatment for the pencil (e.g., filled vs outlined, different tint, smaller glyph), flag in visual smoke and iterate — but default to symmetric until otherwise signaled.
2. **Same-category Confirmar behavior.** AC #6 default: Confirmar ALWAYS calls `updateItemCategory` even if category is unchanged. If Alejandro prefers a short-circuit (micro-optimization for AsyncStorage writes), add `if (category === editingItem.category) { setEditingItem(null); return; }` as the first line of `handleEditCategoryConfirm`. Low-risk change, can be added post-review without refactor.
3. **Pencil behavior when tapped WHILE the delete confirm modal is open.** Theoretically impossible (edit mode disables tile-body `onPress`, but the pencil badge itself is still tappable inside edit mode when `pendingDelete !== null`). The default is: pencil tap still fires, sets `editingItem`, opens `CategoryPickerSheet` ON TOP of the delete Modal (stacked Modals). This may cause visual bewilderment. Mitigation options: (a) gate pencil tap by `pendingDelete === null` (simplest — one-line guard in `handleEditCategoryBadgePress`), (b) accept the stack and let both close independently. Default: (b) — not explicitly tested; file a follow-up only if visual smoke reveals a problem.
4. **Edit-mode exit after category change.** AC #4 default: user REMAINS in edit mode after Confirmar (multi-edit flow). Mirrors Story 14.12a's multi-delete retention. If Alejandro wants auto-exit-on-confirm (simpler mental model: "one action per edit-mode entry"), swap `setEditingItem(null)` for `setEditingItem(null); exitEditMode();` in `handleEditCategoryConfirm`. Spec at `epic-14.md:862` explicitly says "user remains in edit mode (not auto-exited)" — default is correct; flag only if visual smoke surfaces confusion.
