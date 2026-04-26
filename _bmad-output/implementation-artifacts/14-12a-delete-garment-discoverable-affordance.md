# Story 14.12a: Delete garment discoverable affordance (edit mode)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **new user who has saved a few garments to my armario on the S3 picker (`ArmarioPickerScreen`) and wants to remove one I don't want anymore**,
I want **a discoverable edit mode — activated by long-pressing any thumbnail — that surfaces a clean `(−)` icon on every tile and a morphed nav bar ("Cancelar / Editar armario / Listo"), where tapping the `(−)` opens the existing confirmation sheet to cascade-delete the garment's assignments and remove it**,
so that **garment deletion is no longer an invisible gesture (pre-14.12a users had to guess that a long-press existed — per `project_user_feedback_v1.md`), the UI stays calmer than iOS's wiggle pattern (UX-DR3 decision baseline, approved 2026-04-21), and the same edit-mode shell from this story hosts the pencil icon that Story 14.12b adds in the opposite top-right corner of each tile (see UX-DR3 layout + epic-14.md:830 dual-icon coordination note)**.

## Acceptance Criteria

1. **Given** the user long-presses any thumbnail inside `src/screens/armario/ArmarioPickerScreen.tsx` (the S3 picker grid at lines 402–471) while `pendingDelete === null` AND `isEditMode === false`, **When** the `delayLongPress={450}` gesture completes on any `<Pressable testID={\`s3-item-${item.id}\`}>` (currently wired at line 428 via `onLongPress={() => handleLongPressItem(item)}`), **Then** the screen transitions into **edit mode** by setting a new `isEditMode` React state from `false` to `true`. **And** `hapticMedium()` fires exactly once at the moment of transition (reuses the existing `import { hapticLight, hapticMedium } from "@/lib/haptics"` at line 36; adds no new haptic type). **And** the existing `handleLongPressItem` callback at lines 230–233 is REPLACED — it no longer calls `setPendingDelete(item)` to open the legacy single-item confirmation sheet directly; instead it calls a new `enterEditMode()` handler. **And** the `<Pressable>`'s `onPress={() => commitAndDismiss(item.id)}` at line 427 is gated by `isEditMode` — when in edit mode, tapping the tile body is a no-op (does NOT assign, does NOT dismiss). **And** the old legacy direct-long-press-to-sheet path is retired in favor of the new edit-mode entry; the confirmation `<Modal>` component itself (lines 507–622) is PRESERVED byte-for-byte and reused unchanged when the user taps a `(−)` icon (AC #3). See **Dev Notes → "Backwards-compat interpretation (UX-DR3 vs epic AC)"** for why this single-path interpretation satisfies the epic AC at `docs/planning/epic-14/epic-14.md:813–815`.

2. **Given** edit mode is active (`isEditMode === true`), **When** the sheet header (currently the Wada color title row at `ArmarioPickerScreen.tsx:345–369`) renders, **Then** it is replaced by a new **edit-mode nav bar** rendered in the SAME header slot (same `paddingHorizontal: GRID_H_PADDING = 16`, same `paddingTop: 16`, same `paddingBottom: 16`, same `borderBottomWidth: 1` + `borderBottomColor: wadaTokens.hairline`) with a 3-column layout: left column = `<Pressable testID="s3-edit-cancel" onPress={exitEditMode}>` rendering `t("armario.s3.editMode.cancel")` → `"Cancelar"` / `"Cancel"` in `Inter_500Medium` 15pt with `color: wadaTokens.textSecondary`; center column = `<Text testID="s3-edit-title">` rendering `t("armario.s3.editMode.title")` → `"Editar armario"` / `"Edit wardrobe"` in `Inter_500Medium` 17pt with `color: wadaTokens.textPrimary`, `numberOfLines={1}`, `textAlign: "center"`, `flex: 1`; right column = `<Pressable testID="s3-edit-done" onPress={exitEditMode}>` rendering `t("armario.s3.editMode.done")` → `"Listo"` / `"Done"` in `Inter_500Medium` 15pt with `color: wadaTokens.textPrimary` (semibold-weight emphasis vs cancel's secondary-weight per UX-DR3 `ux-design-epic-14.md:430–432`). **And** both `"Cancelar"` and `"Listo"` invoke the SAME `exitEditMode()` handler — they are semantically equivalent ("no pending state to commit/discard" per UX-DR3 `:421`). **And** each cancel/done Pressable has `accessibilityRole="button"` and `minHeight: 44`. **And** the normal-mode header (Wada color dot + picker title at lines 356–368) is completely hidden when `isEditMode === true` (conditional render via ternary, NOT `display: "none"` — keep the DOM tree lean for VoiceOver). **And** edit mode is the ONLY UI state that replaces the normal header — the existing drag-handle at lines 330–343 remains visible above the header in BOTH states (consistent visual anchor for the modal sheet).

3. **Given** edit mode is active, **When** the grid at lines 402–471 renders each item, **Then** a new `<DeleteBadge />` overlay is rendered **absolutely-positioned inside the tile `Pressable` at lines 422–469**, with: `position: "absolute"`, `top: 4`, `left: 4`, `width: 24`, `height: 24`, `borderRadius: 12`, `backgroundColor: wadaTokens.bgPaper` (paper cream per UX-DR3 `:399`), `borderWidth: 1`, `borderColor: wadaTokens.textSecondary` (muted charcoal), `alignItems: "center"`, `justifyContent: "center"`, `zIndex: 2` (stacks above the `WardrobeItemThumb` + the `conflict` dark overlay at lines 441–467). **And** inside the badge, an SF Symbol via `<SymbolView name="minus" size={14} tintColor={wadaTokens.textPrimary} type="hierarchical" resizeMode="scaleAspectFit">` renders the horizontal stroke glyph. **And** the badge is wrapped in a **44pt touch-target extender** — a parent `<Pressable testID={\`armario-delete-${item.id}\`} hitSlop={10}>` that exposes the 44pt tappable area extending beyond the visible 24pt circle (per UX-DR3 `:401` "44pt (invisible extension beyond visual 24pt)"). **And** tapping the badge fires `hapticRigid()` (new import: `import { hapticLight, hapticMedium, hapticRigid } from "@/lib/haptics"` — extends line 36; precedent: `src/hooks/usePremiumGate.ts:8` and `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx:29`) AND calls `setPendingDelete(item)` which opens the existing confirmation `<Modal>` at lines 507–622 **unchanged byte-for-byte** (reuses `handleDeleteConfirm` at lines 235–255 which already calls `cascadeDeleteAssignmentsForItem(item.id) → removeItem(item.id) → deleteItemFiles(...)`). **And** the badge is ONLY rendered when `isEditMode === true`; in normal mode it does not exist in the tree (no `opacity: 0` preservation — render-null). **And** tapping the tile body around the badge (outside the 44pt hit area) remains the `isEditMode`-gated no-op from AC #1; the `Pressable` hitbox tree respects `Pressable` nesting (inner `<Pressable>` captures first, per React Native touch semantics).

4. **Given** the user enters or exits edit mode, **When** `isEditMode` toggles, **Then** the `(−)` badges fade in/out over **250ms** using a shared `Animated.Value` or `react-native-reanimated` shared-value — **REUSE the existing `react-native-reanimated` import at line 22** (`import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"`) and declare a new `editOpacity = useSharedValue(0)` at the top of the component adjacent to the existing `translateY = useSharedValue(sheetHeight)` at line 101. **And** `enterEditMode()` runs `editOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) })`; `exitEditMode()` runs `editOpacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) }, (finished) => { if (finished) runOnJS(setIsEditMode)(false); })` so that `isEditMode` state flips to `false` only AFTER the fade-out completes (preventing a frame-1 flash of badges at partial opacity). **And** when `useReducedMotion() === true` (hook already imported at line 33), the animation is SKIPPED — `editOpacity.value = reducedMotion ? 1 : withTiming(1, ...)` and `exitEditMode` sets `isEditMode = false` synchronously without awaiting the tween. Per UX-DR3 `:404`: "respected by Reduce Motion — instant appearance if enabled"; per `:428`: "Reduce Motion: (−) icons appear instantly (no fade), no transition animations". **And** the edit-mode nav bar (AC #2) is NOT animated — it swaps in/out via plain conditional render (discrete swap is cleaner than a cross-fade and matches iOS nav bar morphing behavior which is also instant).

5. **Given** the user taps `(−)` in edit mode and the confirmation `<Modal>` opens, **When** they press `"Eliminar"` (`<Pressable testID="s3-delete-confirm-yes">` at lines 576–598), **Then** the existing `handleDeleteConfirm` at lines 235–255 runs unchanged — it calls `cascadeDeleteAssignmentsForItem(item.id)`, then `removeItem(item.id)`, then `deleteItemFiles({ localImagePath, thumbnailPath })`, then `hapticLight()`, then `setPendingDelete(null)`. **And** the grid updates immediately — the next render sees `items` without the deleted row (via the `useMisLooksStore((s) => s.items)` subscription at line 86; the Zustand repo updates from `removeItem` propagate synchronously per `src/lib/wardrobeRepo.ts`). **And** the user REMAINS in edit mode after a successful delete (do NOT auto-exit — users often delete multiple items in one session per UX-DR3 `:420` which only exits on "Listo" / "Cancelar" taps). **And** if all items are deleted while in edit mode (`items.length === 0`), the grid transitions to the existing `isEmpty` branch at lines 371–400 (empty-state copy) AND all `(−)` badges disappear naturally (no items = no badges); the edit-mode nav bar stays visible until the user taps `"Listo"` or `"Cancelar"` to exit.

6. **Given** the user taps `"Cancelar"` or `"Listo"` in the edit-mode nav bar, **When** either Pressable's `onPress={exitEditMode}` fires, **Then** the badges fade out per AC #4 (250ms, or instant under Reduce Motion), the nav bar swaps back to the normal-mode header (Wada color dot + picker title at lines 356–368), `isEditMode` transitions to `false`, AND tile tap behavior is restored (normal `onPress={() => commitAndDismiss(item.id)}` resumes). **And** `exitEditMode()` does NOT dismiss the picker sheet itself — the user stays on the S3 picker and may resume assigning garments. **And** `exitEditMode()` does NOT fire a haptic (no explicit feedback is defined by UX-DR3 for exit — the visual swap is enough). **And** tapping the sheet's scrim (`<Pressable testID="s3-scrim">` at lines 298–311) while in edit mode continues to dismiss the picker (existing behavior) — this is acceptable because the scrim is outside the sheet; however, the `GestureDetector` pan-to-dismiss at lines 313 and 261–279 remains active in edit mode (no behavior change needed — the user can still dismiss by swiping down). Scope-out: no edit-mode-exit-before-dismiss interlock is required for this story.

7. **Given** a tile is in `conflict` state (assigned to a different slot of the current combination — see `conflictSet` at lines 114–122 + the dark overlay at lines 441–467), **When** edit mode is active, **Then** the `(−)` badge renders ABOVE the conflict overlay via `zIndex: 2` vs the overlay's implicit `zIndex: 0` (overlays stack in render order; badge is rendered AFTER the overlay so it stacks on top even without explicit `zIndex`). **And** the tile's `opacity: isConflict ? 0.5 : 1` (line 433) does NOT propagate to the `(−)` badge — absolute-positioned children inherit opacity from parent, so the badge will render at 50% opacity on conflict tiles. Accept this trade-off: the badge is still clearly visible at 50% opacity on the paper-cream background (charcoal 50% on cream still exceeds WCAG AA 4.5:1 per existing `wadaTokens` contrast pairings). No per-badge opacity override is needed. **And** tapping the `(−)` on a conflict tile still invokes the delete confirm sheet (per AC #3). **And** the `"Assigned elsewhere"` label at line 464 continues to render below the badge — no repositioning needed since the badge is top-left and the label is bottom-center.

8. **Given** VoiceOver is enabled, **When** edit mode activates, **Then** `AccessibilityInfo.announceForAccessibility(t("armario.s3.editMode.enterAnnouncement"))` is fired inside `enterEditMode()` (reuses existing `AccessibilityInfo` import at line 13; precedent pattern in `ArmarioPickerScreen.tsx:197–201` `commitAndDismiss` announcement). **And** the announcement string is: ES = `"Modo edición activado. Toca el botón eliminar de una prenda para borrarla."` (UX-DR3 `:427` verbatim); EN = `"Edit mode activated. Tap the delete button on a garment to remove it."`. **And** each `(−)` badge has `accessibilityLabel={t("armario.s3.editMode.deleteA11yLabel", { category: t(\`unifiedCamera.categorySheet.row${capitalizeCategory(item.category)}\`) })}` producing ES: `"Eliminar parte de arriba"` / `"Eliminar parte de abajo"` / `"Eliminar calzado"` / `"Eliminar accesorio"` per item's `WardrobeCategory` (see `src/lib/wardrobeTypes.ts:8` — `"top" | "bottom" | "footwear" | "accessory"`) mapping to the existing 4 category labels at `en.json:360–363` / `es.json:360–363` (`unifiedCamera.categorySheet.rowTop/rowBottom/rowFootwear/rowAccessory`); EN mirrors produce: `"Delete top"`, `"Delete bottom"`, `"Delete footwear"`, `"Delete accessory"`. **And** each badge has `accessibilityRole="button"` AND `testID={\`armario-delete-${item.id}\`}` (UX-DR3 `:425`). **And** the edit-mode nav bar buttons have `accessibilityRole="button"` + `accessibilityLabel={t("armario.s3.editMode.cancelA11yLabel")}` / `t("armario.s3.editMode.doneA11yLabel")` — label values = literal copy strings (`"Cancelar"` / `"Listo"` / `"Cancel"` / `"Done"`) with no extra decoration. **And** the tile `<Pressable>`'s existing `accessibilityLabel` at lines 416–421 (derived from `itemA11y` / `itemA11yAssignedElsewhere`) is REPLACED in edit mode with `t("armario.s3.editMode.tileA11yInEditMode")` → ES `"Prenda en modo edición. Usa el botón eliminar de la esquina para borrarla."` / EN `"Garment in edit mode. Use the delete button in the corner to remove it."` — this avoids VoiceOver announcing "double-tap to assign" while the body tap is disabled (per AC #1 no-op).

9. **Given** the capitalize helper for category-label lookup used in AC #8, **When** implementing the `accessibilityLabel` template, **Then** either inline a small lookup map `const categoryLabelKey = { top: "rowTop", bottom: "rowBottom", footwear: "rowFootwear", accessory: "rowAccessory" } as const;` INSIDE the component module (NOT exported — single-use helper), OR inline the ternary directly (`t(\`unifiedCamera.categorySheet.row${category === "top" ? "Top" : category === "bottom" ? "Bottom" : ...}\`)`). **Prefer the lookup map** — 4 cases, explicit, type-narrowed, reads cleanly. DO NOT create a new shared util file (no `src/lib/armario/categoryLabels.ts` or similar — this is a single-screen use; Story 14.12b may add its own mapping, and premature shared extraction risks divergent drift).

10. **Given** the new i18n keys this story introduces, **When** this story merges, **Then** the following are added to `src/i18n/locales/es.json` inside the existing `armario.s3` block at lines 285–301 (append a new `"editMode"` sub-block as the LAST key in `s3` — after `deleteConfirmYes` at line 300, before the closing `}` at line 301):

    ```json
    "editMode": {
        "title": "Editar armario",
        "cancel": "Cancelar",
        "done": "Listo",
        "cancelA11yLabel": "Cancelar",
        "doneA11yLabel": "Listo",
        "enterAnnouncement": "Modo edición activado. Toca el botón eliminar de una prenda para borrarla.",
        "deleteA11yLabel": "Eliminar {{category}}",
        "tileA11yInEditMode": "Prenda en modo edición. Usa el botón eliminar de la esquina para borrarla."
    }
    ```

    **And** EN mirrors at `src/i18n/locales/en.json` (same nested structure, same insertion point — inside `armario.s3` after `deleteConfirmYes`):

    ```json
    "editMode": {
        "title": "Edit wardrobe",
        "cancel": "Cancel",
        "done": "Done",
        "cancelA11yLabel": "Cancel",
        "doneA11yLabel": "Done",
        "enterAnnouncement": "Edit mode activated. Tap the delete button on a garment to remove it.",
        "deleteA11yLabel": "Delete {{category}}",
        "tileA11yInEditMode": "Garment in edit mode. Use the delete button in the corner to remove it."
    }
    ```

    **And** the existing ES/EN parity assertion at `src/i18n/__tests__/i18n.test.ts:40` (`flattenKeys(es).sort() === flattenKeys(en).sort()`) continues to pass — the 8 new keys are mirrored.

11. **Given** test coverage requirements per CLAUDE.md "Testing Discipline" + epic AC "Tests covering: enter edit mode, delete flow, exit via Listo/Cancelar, legacy single-item path, VoiceOver" (`epic-14.md:827`), **When** this story lands, **Then** the following test cases are added to `src/screens/armario/ArmarioPickerScreen.test.tsx` (see test file skeleton at lines 1–147):

    - **Enter edit mode**
        1. `"long-press on a thumbnail enters edit mode, fires hapticMedium, and fades in (−) badges"` — `mockItems = [sampleItem("u1"), sampleItem("u2")]`; `fireEvent(getByTestId("s3-item-u1"), "onLongPress")`; assert `hapticMedium` called once; assert `getByTestId("armario-delete-u1")` + `getByTestId("armario-delete-u2")` truthy; assert `getByTestId("s3-edit-title")` rendered; assert `queryByTestId("s3-picker-title")` is null (normal header hidden).
        2. `"long-press fires VoiceOver announcement"` — reuse `mockAnnounce` at line 109; after long-press, assert `mockAnnounce` called with the `enterAnnouncement` string value.
    - **Delete flow via (−)**
        3. `"(−) tap opens confirm sheet and fires hapticRigid"` — enter edit mode; `fireEvent.press(getByTestId("armario-delete-u1"))`; assert `hapticRigid` called; assert `getByTestId("s3-delete-confirm-sheet")` / `getByTestId("s3-delete-confirm-title")` visible.
        4. `"confirm sheet 'Eliminar' runs cascadeDeleteAssignmentsForItem → removeItem → deleteItemFiles"` — after (−) tap, press `s3-delete-confirm-yes`; assert `cascadeDeleteAssignmentsForItem("u1")` called; assert `removeItem("u1")` called; assert `deleteItemFiles` called with the item's paths; assert `hapticLight` called (from existing `handleDeleteConfirm`); assert `pendingDelete` returns to null (re-query — sheet Modal hidden).
        5. `"user remains in edit mode after successful delete"` — same setup as #4; assert `getByTestId("s3-edit-title")` still rendered after confirm; assert `(−)` badges on remaining items still rendered.
    - **Exit edit mode**
        6. `"tap 'Listo' exits edit mode, fades out (−) badges, restores normal header"` — enter edit mode; `fireEvent.press(getByTestId("s3-edit-done"))`; assert `queryByTestId("armario-delete-u1")` eventually null (after fade); assert `queryByTestId("s3-edit-title")` null; assert `getByTestId("s3-picker-title")` rendered again.
        7. `"tap 'Cancelar' exits edit mode identically to 'Listo'"` — mirror #6 using `s3-edit-cancel`.
    - **Edit-mode tap-body no-op**
        8. `"in edit mode, tapping tile body does NOT assign and does NOT dismiss"` — enter edit mode; `fireEvent.press(getByTestId("s3-item-u1"))`; assert `assign` NOT called; assert `mockGoBack` NOT called; assert `hapticLight` NOT called.
    - **Reduce Motion**
        9. `"under Reduce Motion, (−) badges appear instantly (no fade) on enter"` — `useReducedMotion()` mock is already true at line 53; assert `getByTestId("armario-delete-u1")` renders synchronously after long-press (use `act(() => { fireEvent.longPress(...) })` + immediate query — no `waitFor`).
        10. `"under Reduce Motion, 'Listo' exits synchronously (no fade-out delay)"` — similar; assert `isEditMode` flip synchronous via `queryByTestId("s3-edit-title")` returning null right after the tap.
    - **Accessibility**
        11. `"each (−) badge has accessibilityLabel interpolated with item category"` — add `category: "top"` to `sampleItem` test fixture (see AC #12 below); enter edit mode; assert `getByTestId("armario-delete-u1").props.accessibilityLabel === "Delete top"` (EN i18n active via test defaults).
        12. `"tile a11y label in edit mode switches to tileA11yInEditMode"` — enter edit mode; assert `getByTestId("s3-item-u1").props.accessibilityLabel === "Garment in edit mode. Use the delete button in the corner to remove it."`.
    - **Conflict preservation**
        13. `"(−) badge renders on conflict tiles (above 'Assigned elsewhere' overlay)"` — setup one conflict item; enter edit mode; assert both `armario-delete-u1` AND `s3-item-u1-assigned-elsewhere` render.

    **And** the net test delta vs the **924 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch) / 927 total** baseline from Story 14.11 done (at `epic-14` HEAD `821a4c2` — verify locally with `git log -1 epic-14`) is **+10 to +14 net new passing tests** (13 targeted; allow ±1 margin for test-setup helper consolidation). Target post-story: **934 to 938 passing / 3 pre-existing / 0 new failures / 0 new skips**. If count lands outside 936 ± 2, pause and debug before commit.

12. **Given** the existing `sampleItem` test fixture at `ArmarioPickerScreen.test.tsx:120–127` does NOT include a `category` field, **When** this story lands, **Then** `sampleItem` MUST be extended to accept an optional category parameter with default `"top"`:

    ```ts
    function sampleItem(id: string, category: WardrobeCategory = "top") {
        return {
            id,
            localImagePath: `file:///items/${id}.png`,
            thumbnailPath: `file:///items/${id}.thumb.png`,
            category,
            createdAt: 1,
        };
    }
    ```

    **And** import `WardrobeCategory` from `@/lib/wardrobeTypes` at the top of the test file. **And** the existing test calls `sampleItem("u1")` through `sampleItem("u4")` scattered across the file (lines 168–172 and throughout) continue to work unchanged (category defaults to `"top"`); only the AC #11 test #11 explicitly passes a category to verify the a11y-label interpolation. This fixture update is scope-creep-compliant because `category` is now required on `WardrobeItem` per Story 14.1 — the fixture was already stale vs the production type and this story simply aligns it.

13. **Given** the component boundary rules per CLAUDE.md "React Native Specifics" + "Rules of Hooks", **When** implementing the edit-mode additions, **Then**:
    - All new `useState` / `useSharedValue` / `useCallback` hooks are declared at the TOP of `ArmarioPickerScreen` adjacent to the existing hooks at lines 76–122 (before the `useEffect` at line 124). Specifically: `const [isEditMode, setIsEditMode] = useState(false)` adjacent to `pendingDelete` state at line 104; `const editOpacity = useSharedValue(0)` adjacent to `translateY` at line 101.
    - New handlers: `enterEditMode = useCallback(() => { ... }, [reducedMotion, editOpacity])` and `exitEditMode = useCallback(() => { ... }, [reducedMotion, editOpacity])` declared adjacent to existing `handleLongPressItem` / `handleDeleteConfirm` / `handleDeleteCancel` at lines 230–259.
    - Existing `handleLongPressItem` at lines 230–233 is REPLACED — new body is `enterEditMode()` ONLY (drop `setPendingDelete(item)`); since it no longer needs the item argument, rename to `handleLongPressTile = useCallback(() => { enterEditMode(); }, [enterEditMode])` and update the tile's `onLongPress={handleLongPressTile}` (was `onLongPress={() => handleLongPressItem(item)}`). This simplifies the closure and prevents stale-item capture.
    - NO StyleSheet.create. Use `className` (NativeWind) for static styles where possible (e.g., `"flex-row items-center justify-between"` for the edit nav bar row). Use `style={{}}` for pixel values (24pt badge, 44pt hitbox, border colors from `wadaTokens`).
    - Use `SymbolView` (existing Epic 14 pattern — see `src/screens/ArmarioFichaWadaScreen.tsx` + `src/components/armario/MisLooksLimitStrip.tsx` for `SymbolView` precedent) for the `(−)` glyph via `<SymbolView name="minus" size={14} tintColor={wadaTokens.textPrimary} type="hierarchical" resizeMode="scaleAspectFit" />`. Jest mock already in place at `ArmarioPickerScreen.test.tsx:15–20`.
    - Function declarations with named exports: NO new components are exported from this story (edit-mode UI is inlined within `ArmarioPickerScreen`); however, if the dev finds that the `(−)` badge warrants its own file for Story 14.12b reuse (pencil icon sibling), extract it to `src/components/armario/EditModeBadge.tsx` with `interface EditModeBadgeProps { testID: string; iconName: string; onPress: () => void; accessibilityLabel: string; }` — SEE Dev Notes "Shared vs inline badge" for trade-off. Default: inline for this story; extract in 14.12b if needed.
    - Haptics via `@/lib/haptics` only — extend the line 36 import to add `hapticRigid`. NO direct `expo-haptics` import.

14. **Given** `npx tsc --noEmit` + `pnpm lint`, **When** both run on this story branch, **Then**:
    - `tsc` zero new errors. New `isEditMode: boolean` state, new `editOpacity: SharedValue<number>`, new `WardrobeCategory`-typed `category` in `sampleItem` fixture all narrow cleanly.
    - `pnpm lint` has the SAME 2 pre-existing Biome format errors as Story 14.11 baseline (`FavoritesList.test.tsx` "Photograph a garment..." block + `OutfitVisualizer.tsx` / D-14.7-4) and ZERO new findings. NEW lines in `ArmarioPickerScreen.tsx`, `ArmarioPickerScreen.test.tsx`, and locales JSON must pass `biome check` cleanly. Run `pnpm lint --write src/screens/armario/ArmarioPickerScreen.tsx src/screens/armario/ArmarioPickerScreen.test.tsx src/i18n/locales/es.json src/i18n/locales/en.json` once before commit; if formatting-only auto-fixes land on pre-existing code, accept only the diff scoped to this story's edits (revert unrelated reformatting with `git checkout --`).
    - Per CLAUDE.md: all new hooks called BEFORE the `if (missingOrInvalid) return null;` early return at line 285 (Rules of Hooks). NativeWind `className` for static layout + `style={{}}` for pixel dims + `wadaTokens` colors; haptics via `@/lib/haptics` only; function declarations; named exports (no new ones); `testID` attributes (not `data-testid`).
    - Per `feedback_native_module_rebuild.md`: this story is pure JS/TSX + JSON edits, NO native module touched → `expo start --clear` is sufficient for visual smoke; full `expo run:ios` is NOT required.

15. **Given** the branching convention per `feedback_workflow.md`, **When** this story starts, **Then** the dev agent creates branch `story/14-12a-delete-garment-discoverable-affordance` off `epic-14` HEAD (verify with `git log -1 epic-14` — expect commit `821a4c2` or later if 14.11 merge has advanced). Diff scope:
    - **NEW**: (none at file level — inline additions only; DO NOT create `src/components/armario/EditModeBadge.tsx` unless the dev actively decides to extract per AC #13 "Shared vs inline badge" note, in which case add `EditModeBadge.tsx` + `.test.tsx`).
    - **MODIFIED**: `src/screens/armario/ArmarioPickerScreen.tsx` (+ `isEditMode` state, `editOpacity` shared value, `enterEditMode` / `exitEditMode` / renamed `handleLongPressTile` handlers, `capitalizeCategory` / `categoryLabelKey` lookup, header conditional render — edit nav bar vs picker title, inline `(−)` badge render inside tile map, extended `SymbolView` usage, `hapticRigid` import), `src/screens/armario/ArmarioPickerScreen.test.tsx` (+ ~13 new `it()` blocks, extended `sampleItem` to accept `category` param, extended `hapticRigid` mock in existing `jest.mock("@/lib/haptics", ...)` at line 37), `src/i18n/locales/es.json` + `src/i18n/locales/en.json` (+ 1 new `editMode` sub-block × 2 locales = 16 values total).
    - **NOT TOUCHED** (any edit = scope creep): `ArmarioFichaWadaScreen.tsx`, `ArmarioZeroStateScreen.tsx`, `FavoritesList.tsx`, `NewLookCtaCard.tsx`, `IncompleteLooksSection.tsx`, `MisLooksLimitStrip.tsx`, `CompletenessBadge.tsx`, `WardrobeItemThumb.tsx`, `selectIncompleteLooks.ts`, `usePremiumGate.ts`, `PremiumPaywall.tsx`, `misLooksStore.ts`, `wardrobeRepo.ts`, `navigation/types.ts`, `navigation/FavoritesStack.tsx`, any native module, `app.json`, `CustomTabBar.tsx`. Note: **Story 14.12b will add a sibling pencil icon in the SAME edit mode** — coordinate by keeping the badge rendering code clean + easy to clone (epic-14.md:830). Leave a `// Story 14.12b: pencil icon sibling added here` TODO comment adjacent to the `(−)` badge render to make the 14.12b diff trivially scannable.

## Tasks / Subtasks

- [x] **Task 1** — Implement edit-mode state machine + `enterEditMode` / `exitEditMode` handlers + Reanimated fade + Reduce Motion branch (AC: #1, #4, #6, #13)
  - [x] Add `const [isEditMode, setIsEditMode] = useState(false)` adjacent to `pendingDelete` state at `ArmarioPickerScreen.tsx:104`.
  - [x] Add `const editOpacity = useSharedValue(0)` adjacent to `translateY` at line 101.
  - [x] Declare `enterEditMode = useCallback(...)` with `hapticMedium()` + `setIsEditMode(true)` + `AccessibilityInfo.announceForAccessibility(i18n.t("armario.s3.editMode.enterAnnouncement"))` + reduced-motion-aware fade-in.
  - [x] Declare `exitEditMode = useCallback(...)` with reduced-motion fast-path + timed fade-out + `runOnJS(setIsEditMode)(false)` completion callback so the badge fade-out completes before the edit-mode shell tears down.
  - [x] Replace `handleLongPressItem` with `handleLongPressTile = useCallback(() => enterEditMode(), [enterEditMode])`; tile `<Pressable>` uses `onLongPress={handleLongPressTile}`.

- [x] **Task 2** — Swap normal header for edit-mode nav bar + add new `(−)` badge overlay on each tile + Reanimated fade wiring (AC: #2, #3, #7, #13)
  - [x] Header ternary: edit-mode renders 3-column nav bar (`s3-edit-cancel` / `s3-edit-title` / `s3-edit-done`); normal mode renders the existing Wada color dot + picker title.
  - [x] Extended haptics import to include `hapticRigid`.
  - [x] `(−)` badge rendered inside each tile `<Pressable>` with absolute positioning + animated opacity (`editBadgeAnimStyle`), 24pt circle, paper bg + muted border, `SymbolView name="minus"`, `hitSlop={10}`, `testID={armario-delete-${id}}`, `accessibilityLabel` interpolating category.
  - [x] `editBadgeAnimStyle = useAnimatedStyle(() => ({ opacity: editOpacity.value }))` declared next to `sheetStyle`.
  - [x] Inline `categoryLabelKey` lookup at module scope with `satisfies Record<WardrobeCategory, string>` for exhaustiveness.
  - [x] `// Story 14.12b: pencil icon sibling added here (top-right)` comment left adjacent to badge.

- [x] **Task 3** — Gate tile body `onPress` + tile `accessibilityLabel` by `isEditMode` (AC: #1, #8)
  - [x] Tile `<Pressable>` now uses `onPress={isEditMode ? undefined : () => commitAndDismiss(item.id)}` and `accessibilityLabel={isEditMode ? tileA11yInEditMode : baseA11yLabel}`.
  - [x] `onLongPress={handleLongPressTile}` remains active in both modes; re-entering edit mode while already in edit mode is an idempotent `setIsEditMode(true)` (acceptable per UX-DR3 silent scope-out).

- [x] **Task 4** — Add 8 new `armario.s3.editMode.*` i18n keys × 2 locales + extend `sampleItem` fixture with `category` param + add 13 new test cases (AC: #10, #11, #12)
  - [x] `src/i18n/locales/es.json`: `editMode` sub-block appended inside `armario.s3`.
  - [x] `src/i18n/locales/en.json`: EN mirror appended.
  - [x] Full test run confirms i18n parity assertion still passes.
  - [x] `sampleItem(id, category = "top")` fixture extended; `hapticRigid: jest.fn()` added to haptics mock; `WardrobeCategory` imported.
  - [x] 13 new test cases added under `describe("Story 14.12a — edit mode", ...)`; 3 legacy body/cancel assertions rerouted through the new `(−)` tap path; 2 superseded legacy tests deleted.

- [x] **Task 5** — Quality gates + AC walkthrough + sprint-status handoff + branch hygiene (AC: #14, #15)
  - [x] `npx tsc --noEmit` → clean.
  - [x] `pnpm lint` → 2 pre-existing Biome format errors unchanged (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`). Zero new findings. Auto-fix applied only to story-scoped files (pre-existing formatting reverted per AC #14).
  - [x] Full `pnpm test` → **935 passing / 3 pre-existing / 938 total** (delta +11 vs 924/3/927 baseline).
  - [x] AC #1–#15 walk-through in Completion Notes.
  - [x] `sprint-status.yaml` moved `14-12a` ready-for-dev → in-progress → review.
  - [ ] Commit on branch `story/14-12a-delete-garment-discoverable-affordance` (pending — by user).
  - [ ] Hand off for Alejandro's Expo simulator visual smoke + adversarial code-review gate before merge into `epic-14`.

## Dev Notes

### Previous Story Intelligence (Story 14.11)

- **Test baseline to beat**: 924 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch) / 927 total at `epic-14` HEAD `821a4c2` (Story 14.11 merge commit). Pre-existing failures must remain at 3.
- **Epic 14 `SymbolView` conventions**: Stories 14.8 (`MisLooksLimitStrip`), 14.9 (`ArmarioFichaWadaScreen` bookmark CTA), and 14.10 (`NewLookCtaCard` sparkles + chevron.right) established the app's reliance on `expo-symbols` for glyphs. The `minus` SF Symbol is standard and has a stable rendering across iOS 15+. Test mock at `ArmarioPickerScreen.test.tsx:15–20` already produces `<View testID="symbol-minus" />`.
- **Reanimated pattern**: Existing `translateY` + `sheetStyle` at lines 101 + 281–283 is the reference pattern for this story's `editOpacity` + `editBadgeAnimStyle`. Reduce-Motion branch at lines 132–139 is the reference for AC #4's conditional-skip.
- **Category field availability**: Story 14.1 added `category: WardrobeCategory` to `WardrobeItem` with legacy backfill to `"top"` for pre-Epic-14 items. All items have a valid category — the AC #8 i18n interpolation is safe.
- **Haptics**: All three variants (`hapticLight`, `hapticMedium`, `hapticRigid`) are supported by `@/lib/haptics`. `hapticRigid` is already used in `usePremiumGate.ts`, `UnifiedCameraResultScreen.tsx`, and `ArmarioPreviewScreen.tsx` — no new native setup required.

### Architecture compliance

- **Single-screen scope**: All edits happen inside `ArmarioPickerScreen.tsx` + its test file + locales. No navigation changes, no new routes, no store-slice additions, no repo changes. Delete semantics reuse the existing `cascadeDeleteAssignmentsForItem` + `removeItem` + `deleteItemFiles` path byte-for-byte (confirmed correct via the existing `handleDeleteConfirm` at lines 235–255 — the sheet's OK button already runs the right pipeline; this story just changes how the sheet is opened).
- **React Native + Reanimated**: Animated opacity via `useSharedValue` + `useAnimatedStyle` — NO `Animated` from `react-native` core. This is the same pattern as the existing `translateY` tween.
- **Rules of Hooks**: All 3 new hooks (`useState`, `useSharedValue`, 2× `useCallback`) declared BEFORE the `if (missingOrInvalid) return null;` early return at line 285.

### Backwards-compat interpretation (UX-DR3 vs epic AC)

**The spec has a surface-level contradiction**:

- UX-DR3 (`ux-design-epic-14.md:404`): "Enter edit mode: long-press ANY thumbnail → hapticMedium → nav bar morphs → (−) icons fade in on all thumbnails." This defines long-press = edit-mode entry, single source of truth.
- UX-DR3 (`ux-design-epic-14.md:422`): "Long-press a single thumbnail in NORMAL mode (v1.3.0 gesture): keep existing bottom-sheet confirmation flow. NO regression." This reads as if long-press simultaneously also opens the legacy sheet.
- Epic AC (`epic-14.md:813–815`): "the legacy single-item confirmation bottom sheet continues to work (backwards compat)."

**Interpretation chosen for this story**: the *confirmation sheet Modal component* at `ArmarioPickerScreen.tsx:507–622` is preserved byte-for-byte and reused unchanged — **that** is what "continues to work". The ENTRY gesture to the sheet changes: instead of long-press → sheet directly, the new path is long-press → edit mode → tap `(−)` → sheet. The sheet's internal behavior, copy, confirm/cancel semantics, and `handleDeleteConfirm` pipeline are unchanged. This is the only interpretation that avoids two simultaneous gestures firing on a single long-press (which would be broken UX).

**If Alejandro wants dual-path (long-press directly opens sheet AND edit mode, or long-press in edit mode still opens sheet for that one item)**: flag via `## Open Questions` before starting; default implementation follows the single-path interpretation above.

### Shared vs inline badge (Story 14.12b coordination)

- **Story 14.12b will add a pencil icon in the top-RIGHT corner of each tile during the SAME edit mode.** Both icons share the same base badge shape: 24pt circle, paper bg, 1pt muted border, centered SF Symbol, 44pt hit area.
- **Options**:
  - **(a) Inline in `ArmarioPickerScreen.tsx` this story, clone in 14.12b.** Simplest. Small duplication (10 lines). No shared abstraction.
  - **(b) Extract `<EditModeBadge>` now in this story** → file `src/components/armario/EditModeBadge.tsx` with props `{ testID, iconName, position: "left" | "right", onPress, accessibilityLabel, animatedStyle }`. 14.12b consumes it with `iconName="pencil" position="right"`.
- **Default: (a) inline.** Per CLAUDE.md "Don't add features… beyond what the task requires. Three similar lines is better than a premature abstraction." Two consumers is below the Rule of Three. 14.12b can extract if the duplication hurts — or keep inline if the clone is cheap. Leave the `// Story 14.12b: pencil icon sibling added here` comment to make the clone obvious.

### Shared i18n pattern

- The 8 new keys live in `armario.s3.editMode.*` (single sub-block), parallel to `armario.s3.deleteConfirmTitle/Body/Yes` already inside `armario.s3`. This keeps all S3 picker strings co-located for ease of future editing.
- `deleteA11yLabel` uses i18next interpolation `{{category}}` where the category value comes from the existing `unifiedCamera.categorySheet.row*` labels (added in Story 14.5). Reusing these labels avoids adding a second canonical category-noun vocabulary.

### References

- **Epic spec**: `docs/planning/epic-14/epic-14.md:783–830` (Story 14.12a definition).
- **UX spec**: `docs/planning/ux-design-epic-14.md:355–444` (UX-DR3 — Delete Garment Discoverable Affordance, full visual + interaction + copy + a11y spec).
- **Screen to modify**: `src/screens/armario/ArmarioPickerScreen.tsx` (625 lines) — hooks + handlers + header swap + grid renderItem badge overlay + Modal reuse.
- **Test file to extend**: `src/screens/armario/ArmarioPickerScreen.test.tsx` (616 lines) — add `describe("Story 14.12a — edit mode", ...)` group.
- **Locales**: `src/i18n/locales/es.json:285–301` + `src/i18n/locales/en.json:285–301` — append `editMode` sub-block inside `armario.s3`.
- **Types consumed**: `WardrobeCategory` from `src/lib/wardrobeTypes.ts:8` (`"top" | "bottom" | "footwear" | "accessory"`).
- **Haptics**: `src/lib/haptics.ts` — `hapticRigid` for destructive-action feedback precedent (`usePremiumGate.ts:158`, `UnifiedCameraResultScreen.tsx:157`).
- **Existing delete pipeline**: `cascadeDeleteAssignmentsForItem` + `removeItem` at `src/lib/wardrobeRepo.ts`; `deleteItemFiles` at `src/lib/armario/wardrobeFiles.ts`. All three called already by `handleDeleteConfirm` at `ArmarioPickerScreen.tsx:235–255` — no changes.
- **Accessibility precedent**: `AccessibilityInfo.announceForAccessibility` pattern at `ArmarioPickerScreen.tsx:197–201` (Story 14.8 auto-save announce).
- **Reanimated precedent**: `translateY = useSharedValue(sheetHeight)` + `useAnimatedStyle(() => ({ transform: ... }))` pattern at lines 101, 281–283 — mirror for `editOpacity` + `editBadgeAnimStyle`.
- **Branching**: `feedback_workflow.md` — `story/14-12a-delete-garment-discoverable-affordance` off `epic-14` HEAD (verify `git log -1 epic-14`).

### Project Structure Notes

- All new code lives inside `ArmarioPickerScreen.tsx` (screen module) — no new components, no new helpers in `src/lib/` or `src/components/`. This adheres to CLAUDE.md "Don't design for hypothetical future requirements" — Story 14.12b can extract if needed.
- The 8 new i18n keys are nested under the existing `armario.s3` sub-block, not at the top level — matches the existing S3-scoped pattern (`pickerTitle`, `deleteConfirmTitle`, etc. all live in `armario.s3`).
- `testID` naming convention mirrors UX-DR3 (`:425`): `armario-delete-${id}` for each badge. This specific `testID` shape is NOT namespaced under `s3-*` because UX-DR3 explicitly spells it out as `armario-delete-${id}` — stay faithful to the spec even though other S3 testIDs use the `s3-` prefix.
- `category` field on `sampleItem` fixture is a test-hygiene fix aligned with Story 14.1's type tightening — NOT a scope addition for this story. The field is required on `WardrobeItem` since Story 14.1 and the fixture was stale.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7, 1M context)

### Debug Log References

- `npx tsc --noEmit` → clean (no output).
- `pnpm test src/screens/armario/ArmarioPickerScreen.test.tsx` → 37/37 passing (24 pre-existing + 13 new edit-mode cases; 2 legacy long-press-opens-sheet cases deleted as superseded by new coverage).
- `pnpm test` → 935 passing / 3 pre-existing / 938 total (delta +11 vs 924/3/927 baseline from `epic-14@821a4c2`).
- `pnpm lint` → 2 pre-existing format errors unchanged (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`). No new findings. Biome `--write` on the 4 story-scoped files applied; unrelated auto-formats on pre-existing code were reverted per AC #14.

### Completion Notes List

**AC walk-through (#1–#15):**

1. ✅ Long-press `<Pressable testID="s3-item-*">` → `handleLongPressTile()` → `enterEditMode()` flips `isEditMode=false→true` and fires `hapticMedium()` exactly once. Tile `onPress` is `undefined` in edit mode (no-op body tap). Legacy direct-long-press-to-sheet path retired; confirmation `<Modal>` preserved byte-for-byte.
2. ✅ Edit-mode nav bar renders in the same header slot (same padding + hairline border) via conditional render (discrete swap, not animated). 3-column layout with `s3-edit-cancel` / `s3-edit-title` / `s3-edit-done` testIDs; both cancel & done route to `exitEditMode`; secondary vs primary text weight per UX-DR3. Drag handle still visible in both modes.
3. ✅ `(−)` badge: absolute top-4 left-4, 24pt circle, `wadaTokens.bgPaper` bg + 1pt `wadaTokens.textSecondary` border, `SymbolView name="minus" size={14}` centered, wrapping `<Pressable hitSlop={10}>` for 44pt hit target, `zIndex: 2` above conflict overlay, `hapticRigid()` on press → `setPendingDelete(item)` → existing confirmation modal. Only rendered when `isEditMode`.
4. ✅ Fade driven by `editOpacity = useSharedValue(0)` + `editBadgeAnimStyle = useAnimatedStyle`. Enter: `withTiming(1, 250ms, Easing.out.cubic)`. Exit: `withTiming(0, 250ms, Easing.in.cubic)` with `runOnJS(setIsEditMode)(false)` on completion — prevents frame-1 partial-opacity flash. Reduce Motion (`useReducedMotion()`) skips tween: enter sets value=1 and state synchronously; exit sets value=0 and state synchronously. Nav bar swap is a discrete conditional render.
5. ✅ Confirm `"Eliminar"` runs existing `handleDeleteConfirm` unchanged: `cascadeDeleteAssignmentsForItem → removeItem → deleteItemFiles → hapticLight → setPendingDelete(null)`. Edit mode is NOT exited on delete — user remains in edit mode (multi-delete flow).
6. ✅ `"Cancelar"` and `"Listo"` both call `exitEditMode()`; no haptic on exit; sheet remains open; pan-to-dismiss + scrim continue to work (no interlock).
7. ✅ `(−)` badge renders above conflict overlay. Tile's `opacity: 0.5` propagates to the absolute badge (accepted trade-off per AC #7). Overlay "Assigned elsewhere" label continues to render below the badge.
8. ✅ `AccessibilityInfo.announceForAccessibility(i18n.t("armario.s3.editMode.enterAnnouncement"))` fires on `enterEditMode()`. Badge `accessibilityLabel` interpolates `{{category}}` via existing `unifiedCamera.categorySheet.row*` labels, lowercased at interpolation site so EN "Delete top"/"Delete bottom"/... and ES "Eliminar parte de arriba"/... render correctly. Tile `accessibilityLabel` swaps to `tileA11yInEditMode` when edit mode is active; nav bar buttons have `accessibilityRole="button"` + labels.
9. ✅ Inline `categoryLabelKey` lookup declared at module scope with `satisfies Record<WardrobeCategory, string>` for exhaustiveness. No shared util file created.
10. ✅ 8 new keys per locale under `armario.s3.editMode` in ES + EN (title, cancel, done, cancelA11yLabel, doneA11yLabel, enterAnnouncement, deleteA11yLabel, tileA11yInEditMode). Existing i18n parity assertion passes.
11. ✅ 13 new tests added under `describe("Story 14.12a — edit mode", ...)` block covering: enter edit mode (haptic + badges + title swap + VoiceOver announce), `(−)` tap (hapticRigid + sheet opens), confirm pipeline, multi-delete retention in edit mode, exit via Listo, exit via Cancelar, tile-body no-op in edit mode, Reduce Motion synchronous enter/exit, a11y label interpolation, tile a11y swap, conflict-tile badge rendering. Delta +11 passing net (2 legacy long-press-opens-sheet tests superseded + 3 legacy body/cancel tests rerouted through new path + 13 new).
12. ✅ `sampleItem(id, category = "top")` extended; `WardrobeCategory` imported; `hapticRigid: jest.fn()` added to haptics mock; `mockItems` type updated to include `category`.
13. ✅ All new hooks (`isEditMode`, `editOpacity`, `enterEditMode`, `exitEditMode`, `handleLongPressTile`, `handleDeleteBadgePress`) declared BEFORE the `if (missingOrInvalid) return null;` early return. NativeWind `className` retained for layout; `style={{}}` used for pixel dims + `wadaTokens` colors. Haptics via `@/lib/haptics` only. No new component extracted (inline per Rule-of-Three; Story 14.12b can extract).
14. ✅ tsc clean. Lint 2 pre-existing errors unchanged, zero new. Rules of Hooks respected.
15. ✅ Branch `story/14-12a-delete-garment-discoverable-affordance` created off `epic-14@821a4c2`. Diff scope: 4 files modified (`ArmarioPickerScreen.tsx`, `ArmarioPickerScreen.test.tsx`, `es.json`, `en.json`), 0 new files. No components from the NOT-TOUCHED list modified. `// Story 14.12b: pencil icon sibling added here (top-right)` comment left for dual-icon coordination.

**Deferrals / Open Questions for Alejandro:**

- *Long-press-while-in-edit-mode behavior* (Open Q #1): chose implicit idempotency — a second long-press re-runs `enterEditMode()`, re-firing `hapticMedium` + the VoiceOver announcement. If this is audible/noisy in simulator smoke, trivial follow-up: gate `handleLongPressTile` with `if (isEditMode) return;`.
- *Scrim / pan-gesture behavior during edit mode* (Open Q #2): left active per spec scope-out. Tapping the scrim still dismisses the whole picker even mid-edit.
- *`"Cancelar"` vs `"Listo"` semantic equivalence* (Open Q #3): both rendered as separate Pressables (iOS convention). Trivial to drop `s3-edit-cancel` if Alejandro picks Listo-only in visual smoke.

### File List

- Modified: `src/screens/armario/ArmarioPickerScreen.tsx`
- Modified: `src/screens/armario/ArmarioPickerScreen.test.tsx`
- Modified: `src/i18n/locales/es.json`
- Modified: `src/i18n/locales/en.json`
- Modified: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Modified: `_bmad-output/implementation-artifacts/14-12a-delete-garment-discoverable-affordance.md` (story doc Status / Tasks / Dev Agent Record / File List)

## Open Questions

1. **Long-press-in-edit-mode behavior**: This story's default is "no-op gated implicitly — long-press while in edit mode re-calls `enterEditMode()` which is idempotent, just fires an extra `hapticMedium` and a redundant VoiceOver announcement." UX-DR3 does not specify this case. Alternatives: (a) gate `handleLongPressTile` by `!isEditMode`; (b) use long-press to EXIT edit mode. Current default = (a)-adjacent (implicit idempotency). Flag for Alejandro if the redundant haptic on a second long-press is a problem in visual smoke.
2. **Scrim / pan-gesture behavior during edit mode**: The scrim (`s3-scrim`) and pan-to-dismiss remain active — tapping the scrim dismisses the sheet entirely even if the user is mid-delete. This is consistent with the current S3 picker behavior (no modal-within-modal lock). If Alejandro wants the scrim/pan disabled during edit mode (force exit via "Listo" first), add an `isEditMode ? null : onPress={dismissWithAnimation}` gate on the scrim — out of scope for this story.
3. **`"Cancelar"` vs `"Listo"` semantic equivalence**: Both call `exitEditMode()` — functionally identical. UX-DR3 `:442` explicitly lists this as a Pencil TODO ("Whether 'Cancelar' and 'Listo' are both needed, or only 'Listo'"). Current default: render both for iOS convention compliance. If Alejandro picks Listo-only, remove the `s3-edit-cancel` Pressable.
4. **Edit-mode nav bar animation**: AC #4 says the nav bar swap is a discrete conditional render (not animated). If Alejandro wants a cross-fade between the Wada title row and the edit nav bar, add a second `headerOpacity` shared value — out of scope for this story.

### Review Findings

- [x] [Review][Patch] P1 — `enterEditMode` has no `isEditMode` guard — long-press while already in edit mode re-fires `hapticMedium` + VoiceOver announcement + restarts fade-in animation [ArmarioPickerScreen.tsx: `handleLongPressTile` / `enterEditMode`] — **applied**: added `if (isEditMode) return;` at start of `enterEditMode`; added `isEditMode` to useCallback deps
- [x] [Review][Patch] P2 — Delete pipeline ordering invariant test removed and not replaced — new test asserts mocks were called but doesn't verify `cascade < remove < files` via `invocationCallOrder` [ArmarioPickerScreen.test.tsx: `describe("Story 14.12a")` confirm test] — **applied**: added `invocationCallOrder` assertions to confirm test; 37/37 passing
- [x] [Review][Defer] D-14.12a-1 — `exitEditMode` `finished=false` branch (animation cancelled) never calls `runOnJS(setIsEditMode)(false)` — if the animation is interrupted, `isEditMode` stays `true` as stale state [ArmarioPickerScreen.tsx: `exitEditMode` callback] — deferred, Reanimated cancellation edge case; sheet navigates back on dismiss so stale state has no visible surface; matches existing `translateY` pattern in the same file
- [x] [Review][Defer] D-14.12a-2 — `deleteA11yLabel` computed unconditionally inside `renderItem` regardless of `isEditMode` — adds a nested `t()` call per tile render in non-edit-mode [ArmarioPickerScreen.tsx: `renderItem` deleteA11yLabel] — deferred, micro-optimization; not a correctness issue; typical wardrobe grid is small
- [x] [Review][Defer] D-14.12a-3 — `s3-edit-cancel` and `s3-edit-done` both call `exitEditMode` — architectural smell if future stories add in-edit-mode state requiring different commit/discard semantics [ArmarioPickerScreen.tsx: header ternary] — deferred, spec-mandated equivalence per AC #2 ("semantically equivalent, no pending state"); Story 14.12b can split if needed
- [x] [Review][Defer] D-14.12a-4 — `SymbolView name="minus"` has no fallback for iOS < 16 where some SF Symbol variants may not render [ArmarioPickerScreen.tsx: badge SymbolView] — deferred, pre-existing Epic 14 pattern; all other 14.x stories use SymbolView identically; iOS 15 market share declining; consistent with project conventions
- [x] [Review][Defer] D-14.12a-5 — `reducedMotion` changing mid-animation (user toggles in Settings while fade is in progress) could start a second concurrent `withTiming` on the same `editOpacity` shared value [ArmarioPickerScreen.tsx: `exitEditMode` / `enterEditMode`] — deferred, theoretical race; Reduce Motion toggle typically requires app foreground cycle; matches pre-existing `translateY` risk profile
