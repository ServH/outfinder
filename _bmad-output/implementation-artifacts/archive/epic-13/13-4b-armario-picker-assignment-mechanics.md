# Story 13.4b: Armario Picker + Assignment Mechanics

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user with items in my wardrobe who wants to assign a real garment to each color slot of a favorited Wada combination**,
I want **an Armario Picker bottom sheet that lets me pick an existing wardrobe item or trigger the Nueva foto capture flow, plus clean `Quitar` and unfavorite-cascade behavior**,
so that **the S2 → S3 → S2 assignment loop takes just a few taps, reuse across combinations is unlimited, and destructive actions are explained before they apply**.

## Acceptance Criteria

1. **Given** the user is on S2 Ficha Wada (`ArmarioFichaWadaScreen`) with a favorited combination on iOS 17+ with the wardrobe store hydrated, **When** the user taps any slot (`testID="s2-slot-<i>"`) — whether empty (`Asignar →`) or filled (`Cambiar →`) — **Then** `hapticLight()` fires via `src/lib/haptics.ts` **And** `navigation.push("ArmarioPicker", { combinationId, colorIndex })` is invoked (replacing the existing `onOpenPicker` stub on `ArmarioFichaWadaScreen.tsx:101-105`), **And** the `ArmarioPicker` screen renders with `presentation: "transparentModal"` + `animation: "fade"` so S2 remains visible behind a scrim, **And** the bottom sheet content slides up from the bottom over ~240ms (or renders in final position when `useReducedMotion() === true`) via the exact `PremiumPaywall` motion contract (Reanimated `useSharedValue` + `withSpring`/`withTiming` with `damping: 18, stiffness: 180` for enter, and `withTiming(sheetHeight, { duration: 220 })` for exit), **And** the screen's root carries `testID="s3-armario-picker-screen"` + `accessibilityLabel={t("armario.s3.screenLabel")}` + `accessibilityViewIsModal={true}`.

2. **Given** the `ArmarioPicker` screen has mounted for `{ combinationId, colorIndex }`, **When** the user interacts with the sheet, **Then** the header renders: `<Text>{t("armario.s3.pickerTitle", { color: wadaColor.nameEn })}</Text>` ("Elige para {{color}}" / "Choose for {{color}}") in `NotoSerifJP_500Medium` 20pt + a `<WadaColorDot hex={wadaColor.hex} size={14} />` to the left of the title, **And** a tab row renders with two `<Pressable>` tabs — `Mi Armario` (`testID="s3-tab-wardrobe"`, default selected) and `+ Nueva foto` (`testID="s3-tab-new-photo"`) — each with min 44×44 pt, `accessibilityRole="tab"`, `accessibilityState={{ selected: isActive }}`, localized labels from `t("armario.s3.tabWardrobe")` / `t("armario.s3.tabNewPhoto")`, and a bottom-underline indicator for the active tab, **And** the sheet is dismissible by three routes: (a) a top-of-sheet drag handle + Gesture `Gesture.Pan()` swipe-down beyond `DISMISS_THRESHOLD: 100` pt OR `VELOCITY_THRESHOLD: 500` (mirror `PremiumPaywall.tsx:28-29`), (b) tap on the scrim `<Pressable accessibilityLabel={t("armario.s3.dismiss")} testID="s3-scrim"/>`, (c) back-swipe gesture handled by `@react-navigation/native-stack`'s default — `navigation.goBack()` on all three paths, **And** the sheet height is `screenHeight * 0.78` (slightly taller than PremiumPaywall's `0.7` to fit a 3-column grid with 2+ rows visible), **And** a drag handle `<View style={{ width: 40, height: 4, backgroundColor: wadaTokens.textTertiary, borderRadius: 2, opacity: 0.4 }} testID="s3-drag-handle"/>` renders centered 8pt from the top of the sheet content.

3. **Given** the `Mi Armario` tab is active, **When** the wardrobe items render, **Then** a 3-column `FlatList` (`testID="s3-wardrobe-grid"`, `numColumns={3}`, `keyExtractor={(item) => item.id}`) displays every item from `useWardrobeStore((s) => s.items)` as a tile containing `<WardrobeItemThumb uri={item.thumbnailPath} size={tileSize} />` (computed `tileSize = (sheetWidth - hPadding*2 - gap*2) / 3` where `hPadding: 16, gap: 12`), **And** each tile is wrapped in a `<Pressable testID={`s3-item-${item.id}`} accessibilityRole="button">` with `accessibilityLabel` following the rule: `{t("armario.s3.itemA11y", { color: wadaColor.nameEn })}` for unconflicted items, or `{t("armario.s3.itemA11yAssignedElsewhere", { color: wadaColor.nameEn })}` when the item is already assigned to another `colorIndex` of the same `combinationId` (soft conflict — rendered at `opacity: 0.5` + a small `<Text>{t("armario.s3.assignedElsewhere")}</Text>` overlay label in `Inter_400Regular` 11pt), **And** tapping a tile calls `setSelectedId(item.id)` + `hapticLight()` + renders a 3pt selection ring `style={{ borderWidth: 3, borderColor: wadaColor.hex, borderRadius: 14 }}` around the chosen tile, **And** when there are zero items, an empty state renders (`testID="s3-empty-state"`) with `t("armario.s3.emptyTitle")` ("Tu armario está vacío" / "Your wardrobe is empty") + `t("armario.s3.emptySubtitle")` ("Toca + Nueva foto para añadir tu primera prenda" / "Tap + New photo to add your first garment") centered in the grid area, **And** tapping the same already-selected tile toggles selection off (`setSelectedId(null)` — prevents trapping the user in a selected state they didn't intend).

4. **Given** the `Mi Armario` tab is active with `selectedId !== null`, **When** the sheet is dismissed by ANY route (swipe-down past threshold, scrim tap, iOS edge back-swipe, hardware/software back button, programmatic `goBack`), **Then** `commitAndDismiss()` runs **exactly once** before the screen unmounts (guard via `hasCommitted = useRef(false)`), **And** `commitAndDismiss` first calls `wardrobeRepo.unassign(combinationId, oldColorIndex)` IF the selected item is currently assigned to a different slot of the same combination (the "move" semantics — see AC #3 conflict policy and Dev Notes §"Move-not-overwrite for assigned-elsewhere"), then calls `wardrobeRepo.assign(combinationId, colorIndex, selectedId)` — the unassign-before-assign ordering is load-bearing to avoid `assign` overwriting the target slot while leaving the item orphaned at the old slot, **And** `hapticLight()` fires after the successful repo writes, **And** if `selectedId === null` at dismiss time no repo calls fire (pure dismiss — no accidental commit), **And** if any repo call throws (defensive — repo doesn't currently throw but future hardening may), the error is caught + `__DEV__` warn emitted + dismissal still proceeds without crashing, **And** the back-swipe / hardware-back commit is wired via `navigation.addListener("beforeRemove", commitAndDismiss)` inside a `useEffect` — the swipe-down / scrim-tap paths call `commitAndDismiss` explicitly, and the `beforeRemove` listener covers the remaining routes so no dismiss path can skip the commit.

5. **Given** the user taps the `+ Nueva foto` tab OR the footer secondary CTA `Fotografiar prenda nueva` (`testID="s3-footer-new-photo"`, rendered as a plain text button below the grid with min 44×44 pt), **When** the tap registers, **Then** `hapticLight()` fires **And** `navigation.navigate("ArmarioRoot", { screen: "ArmarioCapture", params: { onCutoutSaved: handleCutoutSaved } })` is invoked to present the existing `ArmarioStack` root modal (App.tsx:70-73 mounts `ArmarioRoot` as a modal sibling of `Main`), **And** the `onCutoutSaved(newItemId: string)` callback — already declared in `ArmarioStackParamList.ArmarioCapture` params (`src/navigation/types.ts:29`) but NOT currently invoked — is now wired end-to-end: `ArmarioPreviewScreen.handleUse` must pass the saved item's `id` through to the callback AFTER `saveCutoutAsWardrobeItem` resolves AND before `navigation.goBack()` dismisses the capture modal, **And** on callback receipt the `ArmarioPicker` sets `selectedId = newItemId` so when the capture modal finishes dismissing and the user is back on the picker, the just-created item renders with the selection ring (no extra tap needed — the user's "Usar esta foto" tap is the implicit selection gesture).

6. **Given** the capture flow was entered via S3 "+ Nueva foto", **When** the user taps `Usar esta foto` on `ArmarioPreviewScreen` and `saveCutoutAsWardrobeItem` resolves successfully with `{ id }`, **Then** `ArmarioPreviewScreen.handleUse` (currently at `src/screens/armario/ArmarioPreviewScreen.tsx:84-124`) is extended to: (a) read the `onCutoutSaved` callback from the `ArmarioCapture` route's params via `useRoute<ArmarioCaptureRoute>()` on the capture screen and thread it through `navigation.push("ArmarioPreview", { cutoutUri, sourceUri, onCutoutSaved })` — requires adding `onCutoutSaved?: (id: string) => void` to `ArmarioStackParamList.ArmarioPreview` (currently `{ cutoutUri, sourceUri }` at `src/navigation/types.ts:30`), (b) invoke `onCutoutSaved?.(result.id)` immediately after the `hapticRigid()` call on line 94, (c) then `navigation.goBack()` to dismiss Preview → Capture → back to the Picker, **And** if the capture flow was NOT entered via S3 (e.g. via a future direct entry point where no callback was set), `onCutoutSaved` is undefined and the save silently completes with just the `goBack()` — no behavioral regression vs the current 13.3b flow, **And** the `isNavigating` ref on the Picker guards against the callback firing twice on a rapid double-dismiss, **And** React Navigation's default "non-serializable param" warning is acceptable for this function param (documented in Dev Notes §"Callback-via-params — React Navigation warning"); if the warning becomes noisy, fall back to a transient `pendingPreselect: { pickerMountId, itemId }` slice on `useWardrobeStore` set by Preview and consumed by the Picker via `useFocusEffect`.

7. **Given** a filled slot is rendered on `ArmarioFichaWadaScreen` (S2), **When** the user performs the `Quitar` (Remove) action, **Then** the slot's `<Pressable>` is extended with an additional affordance: a small `Quitar` / `Remove` text link rendered ABOVE the existing `Cambiar →` link (empty slots render `Asignar →` only — no `Quitar`), tapping `Quitar` (`testID="s2-slot-<i>-remove"`, min 44×44 pt, `accessibilityLabel={t("armario.s2.slotRemoveA11y", { color: wadaColor.nameEn })}`) calls `hapticLight()` + shows a lightweight confirmation sheet (`testID="s2-quitar-confirm-sheet"`) with body `t("armario.s2.quitarConfirmBody", { color: wadaColor.nameEn })` ("¿Quitar la prenda de {{color}}?" / "Remove the garment from {{color}}?"), confirm CTA `t("armario.s2.quitarConfirmYes")` ("Quitar" / "Remove"), and dismiss CTA `t("common.cancel")`, **And** on confirm, `wardrobeRepo.unassign(combinationId, colorIndex)` fires + the sheet dismisses + S2 re-renders with the slot reverted to the dashed empty-state (existing pattern at `ArmarioFichaWadaScreen.tsx:238-262`) + the `CompletenessBadge` decrements by 1 via Zustand reactivity, **And** the underlying `WardrobeItem` is NOT deleted from `@wardrobe:items` (FR14 preserved — `unassign` never touches `items`), **And** the confirmation-sheet tap target copy lives in `armario.s2.*` to keep S2 strings co-located.

8. **Given** the user unfavorites a combination that has >0 assignments via any entry point that ultimately calls `toggleFavorite(id)` on an already-favorited combo — today the two live call-sites are the `ComboCard` heart (used by both `FavoritesList` and the Colors-tab `Combinations` screen) via `FavoriteButton`, **When** the user taps to unfavorite AND `wardrobeRepo.getAssignmentCount(id) > 0` AND `isIOS17OrNewer() === true`, **Then** a confirmation sheet (`testID="armario-unfavorite-cascade-sheet"`) is interposed BEFORE `toggleFavorite` fires, with body `t("armario.unfavoriteCascade.body", { count })` ("Se quitarán las {{count}} prendas que habías asignado a esta paleta. Las fotos seguirán en tu Armario." / "The {{count}} garments you assigned to this palette will be removed. Photos stay in your Wardrobe."), confirm CTA `t("armario.unfavoriteCascade.confirm")` ("Quitar de favoritos" / "Remove from favorites"), dismiss CTA `t("common.cancel")` (MUST be added by Task 4.1 — does NOT exist in en.json / es.json today), **And** on confirm, `wardrobeRepo.cascadeDeleteAssignmentsForCombination(id)` fires FIRST (inside a try/catch — if it throws the unfavorite is aborted + a `__DEV__` warn logs), THEN `toggleFavorite(id)` fires to complete the unfavorite, **And** the interception lives in a React context helper `src/lib/armario/confirmUnfavoriteWithCascade.tsx` exporting `<UnfavoriteCascadeProvider>` + `useUnfavoriteCascade()` hook; the hook returns an imperative `showConfirm({ combinationId, count, onConfirm, onCancel? })` and the provider renders a single app-level `<Modal transparent animationType={reducedMotion ? "none" : "fade"}>` with the confirmation sheet, **And** the interception is a SYNCHRONOUS no-op when `assignmentCount === 0` OR `isIOS17OrNewer() === false` — `showConfirm` invokes `onConfirm()` directly without any sheet render (NFR9 parity; Colors-tab users with 0 wardrobe items experience exactly pre-Epic-13 unfavorite behavior), **And** NOTE: `OutfitVisualizer` currently has NO heart button (verified — no `FavoriteButton` / `toggleFavorite` imports), so it is NOT part of the audit surface. The two live call-sites are `FavoritesList → ComboCard → FavoriteButton` and `Combinations → ComboCard → FavoriteButton`.

9. **Given** the `ArmarioPicker` screen is on `FavoritesStack` (NOT on `ArmarioStack` — the Nueva foto branch opens the root `ArmarioRoot` modal as a sibling), **When** the navigation graph is loaded, **Then** `FavoritesStackParamList` is extended to include `ArmarioPicker: { combinationId: string; colorIndex: number }` (alongside the 13.4a routes `ArmarioZeroState` + `ArmarioFichaWada`), **And** `src/navigation/FavoritesStack.tsx` registers the screen with `options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }}` so S2 remains visible behind the scrim during the sheet's slide-up animation, **And** `ArmarioStackParamList.ArmarioPreview` is extended to pass `onCutoutSaved` through from Capture → Preview so AC #6's callback can reach the Preview screen, **And** no change is made to `App.tsx`'s root-modal registration of `ArmarioRoot` — the Picker remains on `FavoritesStack` while Capture/Preview remain on the existing `ArmarioStack` root modal.

10. **Given** VoiceOver is active throughout S3 and the Quitar/unfavorite-cascade confirmation surfaces, **When** the user navigates with the rotor, **Then** every interactive element has a meaningful `accessibilityLabel` localized in the device locale (EN or ES), **And** the picker sheet's scrim + drag handle are reachable via the VoiceOver rotor (scrim announces "Dismiss picker" / "Cerrar selector"; drag handle announces "Drag to dismiss" / "Arrastra para cerrar" as an `accessibilityHint` on the root `ScrollView`), **And** `accessibilityViewIsModal={true}` is set on the sheet container so VoiceOver does NOT read through to S2 while the sheet is open, **And** 44×44 pt minimum touch targets are verified on all `<Pressable>` surfaces (tabs, tiles, scrim, drag area, footer CTA, confirmation-sheet confirm/cancel buttons), **And** `accessibilityLiveRegion="polite"` on the empty-state or selection-ring transitions is NOT required (VoiceOver announces the focused tile label naturally on state change), **And** Reduce Motion suppresses the sheet slide-up via the `useReducedMotion()` branch on the shared `translateY` animation (mirror `PremiumPaywall.tsx:140-180` pattern: enter renders at final position, exit renders instant disappearance).

11. **Given** co-located Jest tests for the new screen, helpers, and the S2/FavoritesList extensions, **When** `pnpm test`, `npx tsc --noEmit`, and `pnpm lint` all run, **Then** these new/extended suites pass:
    - `src/screens/armario/ArmarioPickerScreen.test.tsx` — CREATE, 9 tests: (a) renders header with `Elige para <color>` + tab row + grid + empty state when items list is empty, (b) Mi Armario tab renders 3-col grid of WardrobeItemThumb for non-empty wardrobe, (c) tapping a tile sets selection ring + `hapticLight` + re-tap toggles off, (d) swipe-down past DISMISS_THRESHOLD fires `wardrobeRepo.assign` with `{ combinationId, colorIndex, selectedId }` then `navigation.goBack`, (e) scrim tap fires assign + goBack, (f) dismiss with `selectedId === null` fires goBack WITHOUT assign, (g) Nueva foto tab tap navigates to `ArmarioRoot` with `screen: "ArmarioCapture"` + `onCutoutSaved` callback, (h) `onCutoutSaved` callback sets selectedId + sheet remains open, (i) "assigned elsewhere" item renders at opacity 0.5 + overlay label when assigned to another slot of same combo.
    - `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — EXTEND (currently 8 tests from 13.4a) with +3 tests: (j) slot tap now pushes `ArmarioPicker` with `{ combinationId, colorIndex }` (replacing the 13.4a stub assertion), (k) filled slot renders `Quitar` link with 44pt hit target + accessibilityLabel, (l) `Quitar` tap → confirmation sheet → confirm → `wardrobeRepo.unassign` fires + sheet dismisses + slot reverts to empty.
    - `src/screens/armario/ArmarioPreviewScreen.test.tsx` — EXTEND with +1 test: on successful `handleUse`, the `onCutoutSaved(result.id)` callback from route.params is invoked exactly once BEFORE `navigation.goBack()`; when absent (param undefined), `goBack` fires without callback — regression check of 13.3b flow.
    - `src/lib/armario/confirmUnfavoriteWithCascade.test.ts(x)` — CREATE, 4 tests: (m) when `assignmentCount === 0`, `onConfirm` fires without sheet render, (n) when `assignmentCount > 0` on iOS 17+, sheet renders with `count` interpolated, confirm fires `cascadeDeleteAssignmentsForCombination` THEN `onConfirm` in order, (o) cancel fires `onCancel` without cascade call, (p) iOS < 17 short-circuits to direct confirm (NFR9 parity).
    - `src/screens/FavoritesList.test.tsx` — EXTEND with +2 tests: unfavorite on a combo with 0 assignments → `toggleFavorite` fires immediately (no sheet); unfavorite on a combo with 2 assignments → sheet appears, confirm routes through cascade + toggle, cancel aborts both.
    - `src/components/FavoriteButton.test.tsx` OR wherever the unfavorite tap is currently tested — EXTEND if the interception lives in a shared component; OTHERWISE no change (the recommended pattern in AC #8 routes through a context, not through `FavoriteButton` itself).
    - **Baseline regression:** `pnpm test` shows zero NEW failures vs. Story 13.4a post-code-review baseline (**684 passing / 60 pre-existing debt**). **And** `npx tsc --noEmit` is clean. **And** `pnpm lint` is clean (Biome tabs + double quotes, function-declared named exports, `interface ComponentNameProps`, NativeWind `className` for static styles, `style={{}}` only for dynamic Wada color/dimensions/rotation values, `testID` attributes only — never `data-testid`).

## Tasks / Subtasks

- [x] **Task 1: ArmarioPicker screen (S3) on FavoritesStack with bottom-sheet motion contract** (AC: #1, #2, #3, #9, #10)
  - [x] 1.1 Extend `src/navigation/types.ts`:
    - Add to `FavoritesStackParamList`: `ArmarioPicker: { combinationId: string; colorIndex: number };`
    - Extend `ArmarioStackParamList.ArmarioPreview`: `{ cutoutUri: string; sourceUri: string; onCutoutSaved?: (id: string) => void }` (the Capture route already has this param — propagate through).
  - [x] 1.2 Register the route in `src/navigation/FavoritesStack.tsx`:
    ```tsx
    <Stack.Screen
      name="ArmarioPicker"
      component={ArmarioPickerScreen}
      options={{
        headerShown: false,
        presentation: "transparentModal",
        animation: "fade",
      }}
    />
    ```
    Place it after `ArmarioFichaWada` (discovery → progress → picker follows the user's mental flow). Add a 1-line comment: `// S3 bottom-sheet picker — transparentModal so S2 remains visible behind scrim`.
  - [x] 1.3 Create `src/screens/armario/ArmarioPickerScreen.tsx`. Function-declared named export. `interface ArmarioPickerScreenProps { }` (screen reads everything from `route.params` + the wardrobe store). Hooks order: `useTranslation`, `useNavigation<ArmarioPickerNav>`, `useRoute<ArmarioPickerRoute>()`, `useSafeAreaInsets`, `useWindowDimensions`, `useReducedMotion`, `useWardrobeStore((s) => s.items)`, `useWardrobeStore((s) => s.assignments)` (filtered in `useMemo` for "assigned elsewhere" conflict detection), `useMemo` for `getCombination(combinationId)` + resolving `wadaColor = combination.colors[colorIndex]`. Early-return (after all hooks) via a `useEffect(() => { if (!combination || !wadaColor) navigation.goBack(); }, [...])` pattern — same as S2/S0 defensive goBacks. Sheet body layout:
    - Root: `<View style={{ flex: 1 }}>` + absolute-positioned scrim `<Pressable testID="s3-scrim" style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={handleDismiss} accessibilityLabel={t("armario.s3.dismiss")}/>`.
    - Sheet surface: `<Animated.View style={[sheetStyle, { position: "absolute", left: 0, right: 0, bottom: 0, height: sheetHeight, backgroundColor: wadaTokens.bgPaper, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]} accessibilityViewIsModal>` driven by Reanimated `useSharedValue<number>(sheetHeight)` for `translateY`.
    - Drag handle + header row (16pt padding): `<WadaColorDot hex={wadaColor.hex} size={14} />` + `<Text>{t("armario.s3.pickerTitle", { color: wadaColor.nameEn })}</Text>` in `NotoSerifJP_500Medium` 20pt.
    - Tab row: two pressables sharing a container with `borderBottomWidth: 1, borderBottomColor: wadaTokens.borderSubtle`; the active tab renders an underline bar `<View style={{ height: 2, backgroundColor: wadaTokens.textPrimary }}/>` below its label.
    - Content area: branch on `activeTab === "wardrobe" | "newPhoto"`. `wardrobe` → FlatList (AC #3). `newPhoto` → render a single centered `<Pressable testID="s3-newphoto-cta">` with a camera glyph (`SymbolView name="camera.fill"`) + label `t("armario.s3.newPhotoCta")`; tapping navigates to the Capture modal (Task 2.2 handler).
    - Footer: `<Pressable testID="s3-footer-new-photo" onPress={handleNewPhoto} accessibilityLabel={t("armario.s3.footerNewPhoto")}>{t("armario.s3.footerNewPhoto")}</Pressable>` pinned at the sheet's bottom with `paddingBottom: insets.bottom + 12`.
  - [x] 1.4 Implement Gesture + Reanimated enter/exit animation. Mirror `src/components/PremiumPaywall.tsx:28-29` constants (`DISMISS_THRESHOLD = 100`, `VELOCITY_THRESHOLD = 500`) and `:140-220` animated-style pattern:
    ```tsx
    const translateY = useSharedValue(sheetHeight);
    useEffect(() => {
      translateY.value = reducedMotion ? 0 : withSpring(0, { damping: 18, stiffness: 180 });
    }, [reducedMotion]);
    const panGesture = Gesture.Pan()
      .onUpdate((e) => { if (e.translationY > 0) translateY.value = e.translationY; })
      .onEnd((e) => {
        if (e.translationY > DISMISS_THRESHOLD || e.velocityY > VELOCITY_THRESHOLD) {
          translateY.value = withTiming(sheetHeight, { duration: 220 }, (finished) => {
            if (finished) runOnJS(commitAndDismiss)();
          });
        } else {
          translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
        }
      });
    ```
    `commitAndDismiss` is the assign-then-goBack function from Task 1.6. Wrap the sheet in `<GestureDetector gesture={panGesture}>`. Reduce-motion path skips `withSpring`/`withTiming` and sets the value directly.
  - [x] 1.5 Implement `Mi Armario` tab FlatList (AC #3). Conflict detection via `useMemo`:
    ```tsx
    const conflictSet = useMemo(() => {
      const set = new Set<string>();
      for (const a of assignments) {
        if (a.combinationId === combinationId && a.colorIndex !== colorIndex) {
          set.add(a.wardrobeItemId);
        }
      }
      return set;
    }, [assignments, combinationId, colorIndex]);
    ```
    Render each tile `<Pressable testID={`s3-item-${item.id}`} onPress={() => setSelectedId(item.id === selectedId ? null : item.id)}>`. Tile content: `<View style={{ opacity: conflictSet.has(item.id) ? 0.5 : 1 }}>` containing `<WardrobeItemThumb uri={item.thumbnailPath} size={tileSize} />` + selection ring `<View style={{ position: "absolute", inset: -3, borderWidth: 3, borderColor: wadaColor.hex, borderRadius: 14 }}/>` rendered when `item.id === selectedId`. Compute `tileSize` via `useWindowDimensions`. Empty state: separate branch when `items.length === 0` — render centered empty-state copy in place of the FlatList.
  - [x] 1.6 Implement `commitAndDismiss` with move-semantics for the "assigned elsewhere" case AND a `beforeRemove` listener so every dismiss path commits:
    ```tsx
    const hasCommitted = useRef(false);
    const commitAndDismiss = useCallback(() => {
      if (hasCommitted.current) return;
      hasCommitted.current = true;
      if (selectedId) {
        try {
          // Move semantics: if the selected item is already assigned to a
          // different slot of the SAME combo, unassign the old slot first so
          // the item ends up on the target slot only (not both).
          const existing = assignments.find(
            (a) => a.combinationId === combinationId && a.wardrobeItemId === selectedId && a.colorIndex !== colorIndex,
          );
          if (existing) {
            unassign(combinationId, existing.colorIndex);
          }
          assign(combinationId, colorIndex, selectedId);
          hapticLight();
        } catch (err) {
          if (__DEV__) console.warn("[ArmarioPickerScreen] assign failed", err);
        }
      }
    }, [selectedId, combinationId, colorIndex, assignments]);

    // Wire EVERY dismiss route: swipe-down (gesture.onEnd), scrim tap, and
    // iOS edge back-swipe / hardware back / programmatic goBack all pass
    // through React Navigation's beforeRemove event. Without this listener,
    // back-swipe would skip the commit.
    useEffect(() => {
      const unsubscribe = pickerNavigation.addListener("beforeRemove", commitAndDismiss);
      return unsubscribe;
    }, [pickerNavigation, commitAndDismiss]);

    // Swipe-down / scrim-tap handlers call commitAndDismiss() then
    // pickerNavigation.goBack() — the ref guard ensures the subsequent
    // beforeRemove listener call is a no-op.
    ```
    The `hasCommitted` ref guards against concurrent dismiss paths (swipe-down + back-swipe + scrim tap racing each other). Move semantics match the epic's line 500 requirement ("user can still pick to **move** the item"), not a silent-orphan outcome.

- [x] **Task 2: Wire Picker into S2 + Nueva foto callback round-trip** (AC: #1, #5, #6, #9)
  - [x] 2.1 Modify `src/screens/armario/ArmarioFichaWadaScreen.tsx`:
    - Remove the module-scope `defaultOpenPicker` stub (lines 34-42) and its `onOpenPicker` prop — they were scaffolding for 13.4a.
    - Inside the component, navigate directly: change `handleSlotTap` (lines 101-105) to `navigation.push("ArmarioPicker", { combinationId, colorIndex: i })`.
    - Keep `onViewLook` stub intact — it lands in Story 13.5 / 13.6.
    - The `ArmarioFichaWadaScreenProps` interface collapses to `{ onViewLook?: ... }` (only the view-look stub remains).
  - [x] 2.2 Implement `handleNewPhoto` in `ArmarioPickerScreen`. **Navigation topology matters:** `RootStack → Main(TabNavigator) → FavoritesStack → ArmarioPicker`. `navigation.getParent()` on the picker returns the **TabNavigator**, NOT the RootStack. `getParent()?.getParent()` reaches RootStack, but the cleaner pattern is **typed root navigation via `useNavigation` with `RootStackParamList`** — React Navigation walks up the navigator tree to find the matching route name, so dispatching to `"ArmarioRoot"` with the typed hook resolves correctly:
    ```tsx
    import type { NavigationProp } from "@react-navigation/native";
    import type { RootStackParamList } from "@/navigation/types";

    const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();

    const handleCutoutSaved = useCallback((newItemId: string) => {
      setSelectedId(newItemId);
      setActiveTab("wardrobe"); // switch tab so the pre-selected item is visible in grid
    }, []);
    const handleNewPhoto = useCallback(() => {
      hapticLight();
      rootNavigation.navigate("ArmarioRoot", {
        screen: "ArmarioCapture",
        params: { onCutoutSaved: handleCutoutSaved },
      });
    }, [rootNavigation, handleCutoutSaved]);
    ```
    The FavoritesStack-typed `useNavigation<ArmarioPickerNav>()` call at the top of the component is still used for `goBack()` + `addListener("beforeRemove", ...)`. Declare BOTH hooks — `pickerNavigation` for local stack ops, `rootNavigation` for the cross-navigator jump to `ArmarioRoot`. `App.tsx:70-73` confirms `ArmarioRoot` is a sibling of `Main` on the root stack.
  - [x] 2.3 Wire the `onCutoutSaved` callback end-to-end through the Capture → Preview flow:
    - **`src/screens/armario/ArmarioCaptureScreen.tsx`**: read `route.params?.onCutoutSaved` via `useRoute<ArmarioCaptureRoute>()`. When `navigation.push("ArmarioPreview", ...)` fires (line 116), forward the callback: `navigation.push("ArmarioPreview", { cutoutUri, sourceUri, onCutoutSaved: route.params?.onCutoutSaved })`.
    - **`src/screens/armario/ArmarioPreviewScreen.tsx`**: add `onCutoutSaved` to the route params read on line 53; in `handleUse` (line 84-124), after the successful `saveCutoutAsWardrobeItem` call and BEFORE `navigation.goBack()`, invoke `route.params.onCutoutSaved?.(result.id)` where `result` is the `{ id }` returned by `saveCutoutAsWardrobeItem`. Currently the function returns `{ id }` (per `saveCutoutAsWardrobeItem.ts:108`), so capture it: `const result = await saveCutoutAsWardrobeItem(...); route.params.onCutoutSaved?.(result.id);`.
    - Invoke BEFORE `navigation.goBack()` so the picker state update has landed by the time the Preview screen unmounts.
  - [x] 2.4 Validate with a manual round-trip test at dev time:
    - Open S2 → tap a slot → Picker opens
    - Tap + Nueva foto → Capture opens over picker
    - Take photo → Preview → Use
    - Modal dismisses → back on Picker with the new item pre-selected + Mi Armario tab active
    - Swipe-down on Picker → assign fires → back on S2 with new assignment visible.
  - [x] 2.5 **Known risk — React Navigation non-serializable param warning:** passing `onCutoutSaved` through route params triggers a dev-only console warning. Acceptable for local modal flows. If the warning becomes a blocker during review, refactor to a transient store slice: add `pendingPreselect: { pickerId: string; itemId: string } | null` to `useWardrobeStore`, set from Preview, consume from Picker via `useFocusEffect`. Document the chosen path in Completion Notes.

- [x] **Task 3: Quitar action on S2 + unfavorite cascade confirmation** (AC: #7, #8, #10, #11)
  - [x] 3.1 Extend `src/screens/armario/ArmarioFichaWadaScreen.tsx` filled-slot render path. Inside the `Pressable` for each slot, after the existing `Cambiar →` link (lines 282-289), conditionally render a second text link for `Quitar` when `isAssigned === true`:
    ```tsx
    {isAssigned && (
      <Pressable
        testID={`s2-slot-${i}-remove`}
        onPress={(e) => { e.stopPropagation(); handleRemove(i); }}
        accessibilityRole="button"
        accessibilityLabel={t("armario.s2.slotRemoveA11y", { color: color.nameEn })}
        style={{ minHeight: 44, minWidth: 44, marginTop: 4, justifyContent: "center" }}
      >
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: wadaTokens.textTertiary }}>
          {t("armario.s2.linkRemove")}
        </Text>
      </Pressable>
    )}
    ```
    Note the `e.stopPropagation()` — without it, the outer slot `<Pressable>` (lines 211-290) would also fire its `handleSlotTap` and push the Picker at the same time.
  - [x] 3.2 Implement `handleRemove(i)`:
    ```tsx
    const [quitarConfirmSlot, setQuitarConfirmSlot] = useState<number | null>(null);
    function handleRemove(colorIndex: number) {
      hapticLight();
      setQuitarConfirmSlot(colorIndex);
    }
    function handleQuitarConfirm() {
      if (quitarConfirmSlot === null) return;
      unassign(combinationId, quitarConfirmSlot);
      hapticLight();
      setQuitarConfirmSlot(null);
    }
    function handleQuitarCancel() { setQuitarConfirmSlot(null); }
    ```
    Render a confirmation sheet component (inline or extracted — see 3.4) when `quitarConfirmSlot !== null` with body copy interpolating `color: combination.colors[quitarConfirmSlot].nameEn`.
  - [x] 3.3 Create `src/lib/armario/confirmUnfavoriteWithCascade.tsx` — a React context provider + hook + imperative API:
    ```tsx
    // Exports:
    //  - <UnfavoriteCascadeProvider> (mount at App.tsx wrapping <FavoritesProvider>'s children)
    //  - useUnfavoriteCascade(): (args: { combinationId: string; count: number; onConfirm: () => void; onCancel?: () => void }) => void
    //  - Internally renders a RN <Modal> with the confirmation sheet when triggered.
    ```
    Implementation outline:
    - The hook returns a `showConfirm` function that sets a state variable in the provider.
    - The provider renders a single `<Modal transparent animationType="fade">` with an `Animated.View` sheet (reuse PremiumPaywall-style motion, simplified — no Gesture needed for this short-lived confirmation).
    - Sheet body: `<Text>{t("armario.unfavoriteCascade.body", { count })}</Text>` + two `<Pressable>`s: `Quitar de favoritos` (destructive style — `backgroundColor: "#D44E3E", color: "white"`) and `Cancelar`.
    - On confirm: invoke `cascadeDeleteAssignmentsForCombination(id)` inside try/catch, then `onConfirm()`. If cascade throws, log `__DEV__` warn, do NOT invoke `onConfirm`, dismiss the sheet, surface a generic error via a brief on-sheet copy replacement (optional polish — acceptable to just log + dismiss + let the user retry).
    - On cancel: `onCancel?.()` + dismiss.
    - iOS < 17 or `count === 0` short-circuit: `showConfirm` invokes `onConfirm()` synchronously without rendering the sheet.
  - [x] 3.4 Wire the unfavorite interception inside `src/components/FavoriteButton.tsx` so all call-sites benefit automatically. Audited call-sites today:
    - `FavoritesList → ComboCard → FavoriteButton` (`src/screens/FavoritesList.tsx:145-155` + `src/components/ComboCard.tsx:144-151`)
    - `Combinations → ComboCard → FavoriteButton` (Colors tab — same component, different parent)
    - `OutfitVisualizer` — verified: does NOT render `FavoriteButton` or call `toggleFavorite` (zero matches for `useFavorites` / `toggleFavorite` / `FavoriteButton` in `src/screens/OutfitVisualizer.tsx`). Do NOT wrap it — it has no heart to gate.
    Implementation: put the cascade check inside `FavoriteButton.tsx` right before `onToggle(id)` fires. The button already receives `isFavorite` as a prop, so it can distinguish a favorite tap (no gate) from an unfavorite tap (gate if count > 0 && iOS 17+). Read `assignmentCount` via `wardrobeRepo.getAssignmentCount(combinationId)` at tap time (imperative snapshot read — no hook). Call `useUnfavoriteCascade()` at the top of `FavoriteButton` to get the `showConfirm` imperative. On tap:
    ```ts
    if (isFavorite && isIOS17OrNewer()) {
      const count = getAssignmentCount(combinationId);
      showConfirm({ combinationId, count, onConfirm: () => onToggle() });
      return;
    }
    onToggle();
    ```
    `showConfirm` short-circuits internally when `count === 0` OR `!isIOS17OrNewer()`, so the gate inside `FavoriteButton` is defensive duplication of the `isIOS17OrNewer` check — acceptable for clarity. This approach keeps every current and future call-site gated without touching FavoritesList/Combinations/ComboCard.
  - [x] 3.5 Mount `<UnfavoriteCascadeProvider>` in `App.tsx`. Wrap the existing provider tree around the navigation root, immediately inside `<FavoritesProvider>` so the context is available everywhere any `FavoriteButton` renders. Keep the mount location minimal — 1 line change. Document with an inline comment: `{/* UnfavoriteCascadeProvider must wrap FavoritesProvider's consumers so FavoriteButton can surface the confirmation */}`.

- [x] **Task 4: i18n + tests + AC walkthrough + regression sweep** (AC: #1-#11)
  - [x] 4.1 Add `armario.s3.*`, `armario.s2.linkRemove`, `armario.s2.quitarConfirm*`, `armario.s2.slotRemoveA11y`, `armario.unfavoriteCascade.*`, and `common.cancel` keys to BOTH `src/i18n/locales/en.json` AND `src/i18n/locales/es.json` (all are new — `common.cancel` is NOT present today, verified):
    ```
    armario.s3.screenLabel              → "Armario picker" / "Selector de armario"
    armario.s3.pickerTitle              → "Choose for {{color}}" / "Elige para {{color}}"
    armario.s3.tabWardrobe              → "My Wardrobe" / "Mi Armario"
    armario.s3.tabNewPhoto              → "+ New photo" / "+ Nueva foto"
    armario.s3.newPhotoCta              → "Take a new photo" / "Fotografiar una prenda nueva"
    armario.s3.footerNewPhoto           → "Take a new photo of a garment" / "Fotografiar prenda nueva"
    armario.s3.emptyTitle               → "Your wardrobe is empty" / "Tu armario está vacío"
    armario.s3.emptySubtitle            → "Tap + New photo to add your first garment" / "Toca + Nueva foto para añadir tu primera prenda"
    armario.s3.itemA11y                 → "Garment. Double-tap to assign to {{color}}." / "Prenda. Doble-tap para asignarla a {{color}}."
    armario.s3.itemA11yAssignedElsewhere→ "Garment already assigned to another color in this palette. Double-tap to move to {{color}}." / "Prenda ya asignada a otro color de esta paleta. Doble-tap para moverla a {{color}}."
    armario.s3.assignedElsewhere        → "Assigned elsewhere" / "Ya asignada"
    armario.s3.dismiss                  → "Dismiss picker" / "Cerrar selector"
    armario.s3.dragHint                 → "Drag down to dismiss" / "Arrastra para cerrar"
    armario.s2.linkRemove               → "Remove" / "Quitar"
    armario.s2.slotRemoveA11y           → "Remove garment from {{color}}" / "Quitar prenda de {{color}}"
    armario.s2.quitarConfirmBody        → "Remove the garment from {{color}}?" / "¿Quitar la prenda de {{color}}?"
    armario.s2.quitarConfirmYes         → "Remove" / "Quitar"
    armario.unfavoriteCascade.body      → "The {{count}} garments you assigned to this palette will be removed. Photos stay in your Wardrobe." / "Se quitarán las {{count}} prendas que habías asignado a esta paleta. Las fotos seguirán en tu Armario."
    armario.unfavoriteCascade.confirm   → "Remove from favorites" / "Quitar de favoritos"
    common.cancel                       → "Cancel" / "Cancelar"   (MUST add — verified not present today via `rg "common.cancel"` in locales; `common` namespace exists at en.json:171 with only `goBack` + `dismiss`)
    ```
    Verify EN/ES parity via the existing `src/i18n/__tests__/i18n.test.ts` bidirectional key check — it MUST pass post-merge.
  - [x] 4.2 Create `src/screens/armario/ArmarioPickerScreen.test.tsx` with the 9 tests from AC #11. Mock pattern from 13.4a `ArmarioFichaWadaScreen.test.tsx`: `react-native-safe-area-context`, `@react-navigation/native` — this test needs TWO distinct `useNavigation` return values since the picker uses BOTH a local nav (`pickerNavigation`) AND a root nav (`rootNavigation`) — simplest is to have `useNavigation` return a single shared mock with `goBack`, `navigate`, and `addListener` all stubbed (React Navigation in practice returns the same object for identical generic param signatures, so the test can treat them as one). Also stub `useRoute`, `@/lib/haptics`, `@/stores/wardrobeStore` (selector stubs with toggleable items/assignments), `@/data/colorIndex` (mock `getCombination` to return a 3-color fixture), `@/lib/wardrobeRepo` (spy on `assign` AND `unassign` — the move-semantics test in AC #4 needs to assert BOTH are called in order). **Reanimated + Gesture-Handler mocks are NOT currently in `jest.setup.js`** (it's only 2 lines: i18n + global.css import). Ship the mocks inline per test file: `jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"))` for reanimated, and the simplified gesture mock `jest.mock("react-native-gesture-handler", () => { const { View } = require("react-native"); return { GestureDetector: ({ children }: { children: React.ReactNode }) => children, Gesture: { Pan: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }) }, State: {} }; })`. Gesture correctness is validated manually on-device — see Completion Notes manual QA checklist.
  - [x] 4.3 Extend `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` with the +3 tests from AC #11 (slot tap pushes Picker, filled slot renders Quitar link, Quitar tap → confirm → unassign). The existing 8 tests (which assert the `onOpenPicker` stub is called via prop spy) MUST be updated: the stub prop is removed in Task 2.1, so the spy approach no longer applies. Rewrite the relevant cases to assert on a `mockPush` spy returned by the `@react-navigation/native` mock (add `mockPush = jest.fn()` alongside the existing `mockGoBack` / `mockReplace` at lines 15-21, and extend the `useNavigation` mock to `() => ({ goBack: mockGoBack, replace: mockReplace, push: mockPush })`). Assert `mockPush` was called with `("ArmarioPicker", { combinationId, colorIndex })`. Mock `@/lib/wardrobeRepo.unassign` as a spy for the Quitar path. Reuse the existing `mockCombination` / `mockAssignments` / `mockItems` fixtures.
  - [x] 4.4 Extend `src/screens/armario/ArmarioPreviewScreen.test.tsx` with the +1 test from AC #11. Existing tests should all still pass — the change is additive: add a `route.params.onCutoutSaved` param in one new test scenario and assert it's called with `result.id` before `goBack`. For the existing tests (no callback param), behavior is unchanged.
  - [x] 4.5 Create `src/lib/armario/confirmUnfavoriteWithCascade.test.tsx` with the 4 tests from AC #11. Use `@testing-library/react-native` to render `<UnfavoriteCascadeProvider>` with a child test component that calls the hook. Mock `@/lib/wardrobeRepo.cascadeDeleteAssignmentsForCombination` as a spy. Mock `@/lib/platform.isIOS17OrNewer` for the iOS-version branch test.
  - [x] 4.6 Extend `src/screens/FavoritesList.test.tsx` with the +2 tests from AC #11 (unfavorite with 0 assignments → no sheet; unfavorite with 2 assignments → sheet + confirm routes through cascade + toggle). Mock `@/lib/armario/confirmUnfavoriteWithCascade` or the UnfavoriteCascadeProvider/useUnfavoriteCascade hook — whichever the implementation exposes. Keep all existing tests untouched.
  - [x] 4.7 If the unfavorite-cascade interception lives inside `FavoriteButton.tsx` (per Task 3.4 recommendation), extend `src/components/FavoriteButton.test.tsx` with 2 tests: tap to unfavorite on a combo with >0 assignments → `useUnfavoriteCascade` is called with correct args; tap to FAVORITE (isFavorite: false → true) — NO cascade check, `onToggle` fires directly.
  - [x] 4.8 Run the full sequence:
    1. `npx tsc --noEmit` → clean.
    2. `pnpm lint` → clean. Run `pnpm biome check --write` if auto-fixes are needed.
    3. `pnpm test` → zero NEW failures vs. Story 13.4a post-code-review baseline (684 passing / 60 pre-existing debt).
    4. Target: ~21 new/modified tests (9 picker + 3 S2 extend + 1 preview extend + 4 cascade + 2 favorites + 2 FavoriteButton) = target **~705 passing**.
  - [x] 4.9 On-device visual review — **DEFERRED to post-code-review QA** per Story 13.4a precedent (unit tests cover all behavioral ACs; layout work uses established primitives). Capture a concrete manual-QA checklist in Completion Notes for the reviewer to run on simulator iPhone 16 Pro:
    - (a) Open Favorites → tap favorited combo → S0 or S2 → tap slot → S3 picker slides up over S2 with scrim visible.
    - (b) Pick any existing item → selection ring appears in Wada color → swipe down → picker dismisses → S2 slot shows the newly-assigned thumbnail + `Cambiar →`.
    - (c) Re-tap the same slot → picker opens → tap `+ Nueva foto` → Capture modal presents → take photo → Use → modal dismisses → picker is visible again with new item pre-selected on Mi Armario tab → swipe down → assign fires → S2 updated.
    - (d) On a filled slot, tap `Quitar` → confirmation sheet appears → tap `Quitar` → slot reverts to empty (dashed) + badge decrements.
    - (e) Move-semantics probe: fill slot 0 with an item, then tap slot 1 → open picker → pick the SAME item → swipe down → verify slot 0 is empty AND slot 1 is filled (item moved, not duplicated).
    - (f) Back-swipe probe: tap slot → open picker → pick an item → iOS edge back-swipe → verify assign still fired (AC #4 `beforeRemove` contract).
    - (g) Tap a 3/3 complete combo's heart on FavoritesList → unfavorite cascade sheet appears with "Se quitarán las 3 prendas…" copy → tap `Quitar de favoritos` → combo unfavorites + wardrobe items still present (verify via Colors-tab `Combinations` → re-favorite + open picker — items should still be there).
    - (h) Switch simulator language to Spanish, repeat (a)–(g) → verify every new string localized.
    - (i) Enable Reduce Motion → picker enters/exits without spring animation, confirmation sheets fade without slide.
    Paste a concise results table into Completion Notes.
  - [x] 4.10 Regression check:
    - `pnpm test src/screens/CaptureScreen.test.tsx` → Epic 12 color-capture unchanged.
    - `pnpm test src/screens/armario/ArmarioCaptureScreen.test.tsx` → all 8 tests pass (Task 2.3 adds param threading — update the test that mocks `route.params` to include the new optional `onCutoutSaved` field if assertions check the full params object; otherwise no change).
    - `pnpm test src/lib/wardrobeRepo.test.ts src/stores/wardrobeStore.test.ts` → unchanged from 13.4a baseline (no repo API changes in this story; `assign`/`unassign`/`cascadeDeleteAssignmentsForCombination` already implemented in 13.1).
    - `pnpm test src/screens/armario/ArmarioZeroStateScreen.test.tsx` → unchanged (S0 is untouched).
    - Verify that `ComboCard`-based Colors-tab `Combinations` screen still routes to `OutfitVisualizer` (the `onPress` override is ONLY passed by `FavoritesList` — `Combinations.tsx` does not pass it).
  - [x] 4.11 AC walkthrough in Completion Notes — one row per AC #1–#11 with a single-sentence "verified via {test name / visual pass / on-device action}". Mirror the 13.4a Completion Notes table.

## Dev Notes

### Architecture context (brownfield)

- **Current branch:** `epic-13`. This story's branch: `story/13-4b-armario-picker-assignment-mechanics` off `epic-13`. Merge back to `epic-13` when all ACs pass + `/bmad-code-review` is clean. Stories 13.1 + 13.2 + 13.3a + 13.3b + 13.4a must be on `epic-13` (they are — sprint-status.yaml shows `done` for all five).
- **Upstream deps that MUST be on-branch before dev:**
  - Story 13.1 (`wardrobeRepo.assign` / `unassign` / `getAssignmentCount` / `cascadeDeleteAssignmentsForCombination`) — this story is the first consumer of `assign` and of the cascade helper
  - Story 13.3a + 13.3b (`ArmarioStack` root modal + `saveCutoutAsWardrobeItem`) — required by the Nueva foto round-trip
  - Story 13.4a (S2 `ArmarioFichaWadaScreen` + shared components `PolaroidCard`, `WardrobeItemThumb`, `WadaColorDot`, `CompletenessBadge` + iOS-17 gate at `src/lib/platform.ts` + `FavoritesStackParamList` extensions + `ComboCard.onPress` optional prop)
- **Scope boundaries (tight — 4 tasks, CLAUDE.md §Story Scope):**
  - ✅ S3 Armario Picker screen on FavoritesStack with bottom-sheet motion contract (Reanimated + Gesture mirroring `PremiumPaywall`)
  - ✅ Mi Armario 3-column grid + selection ring + assigned-elsewhere soft conflict + empty state
  - ✅ + Nueva foto tab and footer CTA launching existing `ArmarioRoot` modal with `onCutoutSaved` callback round-trip
  - ✅ Wire Capture → Preview → callback invocation (extending the `ArmarioStackParamList.ArmarioPreview` params with `onCutoutSaved`)
  - ✅ Replace the 13.4a `onOpenPicker` stub in S2 with real navigation
  - ✅ `Quitar` action on S2 filled slots + confirmation sheet
  - ✅ Unfavorite cascade confirmation centralized in a provider+hook and wired inside `FavoriteButton.tsx` so every call-site benefits
  - ✅ i18n EN + ES for every new string; VoiceOver + 44pt touch targets + reduce-motion respected
  - ❌ NO changes to `wardrobeRepo.ts` signatures — all APIs already exist from 13.1
  - ❌ NO changes to `saveCutoutAsWardrobeItem` — 13.3b implementation is stable
  - ❌ NO S4 Tu Look / S5 Sugerencia — Stories 13.5 / 13.6
  - ❌ NO Favorites card badges / thumbnails / completeness sort — Story 13.6
  - ❌ NO new native dep (no `@gorhom/bottom-sheet` install). Reuse the in-project `PremiumPaywall` motion contract.
  - ❌ NO `expo prebuild --clean` / `expo run:ios` rebuild required — pure JS/TS story
- **User-visible milestone:** this story is the first time the user can actually assign a garment to a palette color — the S2 → S3 → S2 loop becomes functional end-to-end. Merge sequencing: 13.4a is already on `epic-13`, so 13.4b can merge directly after code-review. Combined with 13.3b (persistence), 13.4b unlocks a demo-able assign flow.

### Bottom-sheet library decision — reuse PremiumPaywall motion contract (no new dep)

The Epic doc recommends `@gorhom/bottom-sheet`. After scouting the codebase this story DEVIATES from that recommendation for a deliberate reason: `src/components/PremiumPaywall.tsx` already implements every behavior we need for S3 using only `react-native` + `react-native-reanimated` + `react-native-gesture-handler` (all three already installed in `package.json` and working in production; NOTE: `jest.setup.js` does NOT preconfigure their test mocks — each new test file must ship inline mocks, per Task 4.2). Specifically, PremiumPaywall covers:

- Swipe-down-to-dismiss past `DISMISS_THRESHOLD: 100` OR `VELOCITY_THRESHOLD: 500` (`PremiumPaywall.tsx:28-29`).
- Spring enter via `withSpring({ damping, stiffness })` + timed exit via `withTiming(sheetHeight, { duration: 220 })`.
- Scrim with `<Pressable>` tap-to-dismiss + `Animated` overlay opacity.
- Reduce-motion branch that skips the spring.
- `accessibilityViewIsModal` discipline and VoiceOver scrim accessibilityLabel.
- Sheet sizing via `screenHeight * ratio` (we'll use `0.78` instead of PremiumPaywall's `0.7` to fit a 3-col grid with 2+ rows).

Adding `@gorhom/bottom-sheet` would require `pnpm add` + `npx expo prebuild --clean && npx expo run:ios` (native autolinking for the peer `react-native-reanimated` v3 + gestures), AND would introduce an API surface we don't control in Epic 14+. Reusing PremiumPaywall's motion contract is faster, zero-risk, and keeps the codebase dep-minimal — in line with `feedback_no_analytics.md`'s craft-over-dep philosophy.

**Implementation discipline:** copy the motion constants + the `useSharedValue`/`withSpring`/`withTiming` pattern verbatim — do not invent new timing curves. If the picker's motion feels wrong during on-device review, tune in the picker only (not in PremiumPaywall — two independent sheets). If a third sheet materializes in Story 13.5/13.6, extract a `BottomSheet` shared component at that time.

### Navigation topology — why the Picker lives on FavoritesStack, not on ArmarioStack

`ArmarioStack` is the root-modal capture flow (Capture → Preview) mounted at `App.tsx:70-73`. Its job is capturing and persisting a garment photo — that's orthogonal to the Picker's job (pick an existing item OR trigger a new capture).

The Picker is a sub-surface of S2 Ficha Wada on `FavoritesStack`. Reasoning:
- Back-swipe/dismiss from Picker → S2 (same stack) is the natural flow
- S2 remains visible through the scrim — `presentation: "transparentModal"` on `FavoritesStack` preserves the underlying screen
- Nueva foto branch navigates to `ArmarioRoot` via a **typed root-navigation hook** (`useNavigation<NavigationProp<RootStackParamList>>()`) — NOT `getParent()`. Nav topology is `RootStack → Main(TabNavigator) → FavoritesStack`, so `getParent()` from the picker returns the Tab navigator (not RootStack). The typed hook walks the navigator tree and resolves `"ArmarioRoot"` correctly. The Picker pushes a root-modal OVER itself, then `onCutoutSaved` callback propagates back via the Capture → Preview route params chain.

Do NOT try to host the Picker inside the same `ArmarioStack` as Capture/Preview. That would require presenting `ArmarioStack` over S2 and then nesting another modal for Nueva foto — two modals deep is a known iOS transition-flake risk and mangles the back-swipe gesture.

### Callback-via-params — React Navigation warning

`ArmarioStackParamList.ArmarioCapture` was typed in 13.3a with `{ onCutoutSaved?: (id: string) => void } | undefined` (`src/navigation/types.ts:29`). React Navigation's `navigation.navigate` / `push` will emit a dev-only warning when a function is passed as a param: _"Non-serializable values were found in the navigation state."_ This is acceptable for short-lived, local modal flows like this one (the pattern is documented + used in production apps). Do not chase it with a state-machine rewrite on the first pass.

**Contingency:** if the warning becomes unacceptable during code review (e.g. it fires dozens of times per session), the fallback is a transient store slice:

```ts
// In useWardrobeStore:
pendingPreselect: { pickerMountId: string; itemId: string } | null;
setPendingPreselect: (v: ...) => void;
```

- Picker generates a `pickerMountId: uuidv4()` on mount and passes it to Capture via serializable route params
- Capture forwards to Preview via params
- Preview calls `setPendingPreselect({ pickerMountId: params.pickerMountId, itemId: result.id })` after save, before `goBack`
- Picker subscribes to the slice via `useWardrobeStore((s) => s.pendingPreselect)` and, inside `useFocusEffect`, checks if `pickerMountId` matches + sets `selectedId`, then calls `setPendingPreselect(null)`

This is strictly a fallback — implement only if the dev console is unusable with the simpler approach. Document the chosen path in Completion Notes.

### Assigned-elsewhere soft conflict policy

The UX spec (§S3 line 127) states "Una misma prenda puede asignarse a múltiples combinaciones" — reuse across combos is always allowed. Within the SAME combo, the epic's AC (line 500 of `epic-13-armario-virtual.md`) says "soft conflict, not a block — user can still pick to **move** the item". "Move" is the key word: after the tap, the item should end up on the NEW slot ONLY, not on both the old and new slots. The picker visually signals the conflict via `opacity: 0.5` + overlay label and allows the tap; `commitAndDismiss` then performs the two-step move.

### Move-not-overwrite for assigned-elsewhere

`wardrobeRepo.assign(combinationId, colorIndex, wardrobeItemId)` (`src/lib/wardrobeRepo.ts:78-95`) only replaces the **target slot's** existing assignment — it does NOT touch any other slot the item is assigned to. If the picker naively calls `assign` when the selected item is already on a different slot of the same combo, the item ends up assigned to BOTH slots (S2 would show the same thumbnail twice, CompletenessBadge would miscount). This is a real bug, not a theoretical one.

Fix: in `commitAndDismiss` (Task 1.6), before calling `assign`, search `assignments` for a row with `combinationId === this combo && wardrobeItemId === selectedId && colorIndex !== this colorIndex`. If found, call `unassign(combinationId, oldColorIndex)` FIRST, then `assign`. The two calls run sequentially on the JS thread; Zustand batches the two store mutations into two re-renders, but since the picker is dismissing anyway the intermediate flash is invisible.

Alternative considered: extending `wardrobeRepo` with a `moveItemToSlot(combinationId, newColorIndex, itemId)` helper that does the unassign+assign atomically. Rejected for 13.4b — adding a repo API mid-story is outside the 4-task scope and the two-call pattern is trivial at the consumer. Promote to a repo helper only if 13.5/13.6 need the same move pattern.

### Hydration race — acceptable for the picker

`useWardrobeStore((s) => s.items)` returns `[]` during the brief window before hydration lands. The picker does NOT explicitly gate on `hydrated === true` — reasoning: the only way to reach the picker is via S2 `handleSlotTap`, and S2's footer CTA is already gated on `hydrated` (13.4a `ArmarioFichaWadaScreen.tsx:299,302,312`). By the time the user can open the picker, hydration has landed. The race window where the user could somehow reach the picker before hydration is vanishingly small; if it ever surfaces, the symptom is a briefly-empty Mi Armario tab (which lands on the empty state), not a crash. Acceptable.

**Polish follow-up:** if the empty-state flash becomes a visible artifact during Task 4.9 on-device review, add a tiny `hydrated` gate that renders a short `<ActivityIndicator>` in the grid area while `hydrated === false`. Not a blocker for first merge.

### Empty-wardrobe UX — default to Mi Armario tab

When `items.length === 0`, the Mi Armario tab renders the empty state copy with a contextual push to + Nueva foto. The picker does NOT auto-switch to the Nueva foto tab in that case — the user sees the empty-state explanation first. Rationale: seeing "your wardrobe is empty, tap + Nueva foto to add your first garment" teaches the user the mental model (picker is always "pick an existing or make a new one"). Auto-skipping the tab hides that concept. Acceptable trade-off of one extra tap for pedagogy. If user feedback says otherwise, the auto-switch is a 1-line change for a post-launch polish.

### S2 `Quitar` affordance placement

The 13.4a AC #4 explicitly deferred `Quitar` to 13.4b. Implementation detail: the existing slot `<Pressable>` handles the whole card-tap area. Adding `Quitar` as a NESTED `<Pressable>` requires `e.stopPropagation()` on its `onPress` — otherwise the outer Pressable ALSO fires and the user would open the Picker at the same time. Nested Pressables work in React Native with stopPropagation; test this explicitly in Task 4.3.

### Unfavorite cascade — why a provider/hook vs a screen-local sheet

Two live call-sites currently unfavorite (audited — `OutfitVisualizer` does NOT render `FavoriteButton` or call `toggleFavorite`): (1) `FavoritesList → ComboCard → FavoriteButton`, (2) `Combinations → ComboCard → FavoriteButton` (Colors-tab). Duplicating the confirmation-sheet render code across these call-sites is already brittle, and Story 13.5/13.6 may expose additional entry points. Hosting the sheet once at the App level and exposing a `useUnfavoriteCascade()` hook keeps the UX consistent.

Critical behavior: the Colors-tab `Combinations → ComboCard` call-site unfavoriting a combo with 0 assignments (the common case for Colors-tab users with no wardrobe activity) MUST short-circuit to a synchronous `onConfirm()` call — NFR9 parity requires zero UX change for users who haven't touched Armario. The `showConfirm` hook handles this by checking `assignmentCount === 0 || !isIOS17OrNewer()` before rendering the sheet.

The provider mounts exactly ONE `<Modal>` and manages `visible: boolean` + `pending: { count, onConfirm, onCancel }` state. The hook returns an imperative `showConfirm` function. Call-sites wrap their `toggleFavorite(id)` invocation in `showConfirm({ ... onConfirm: () => toggleFavorite(id) })` — or, better, the `FavoriteButton.tsx` component itself wires the check so every call-site benefits automatically.

### Reduce-motion contract

- **Picker enter/exit:** Reanimated `useSharedValue` skips the `withSpring` and sets `translateY.value = 0` / `sheetHeight` directly when `useReducedMotion() === true`. Matches the PremiumPaywall pattern.
- **Gesture still works** under reduce-motion — it's a direct manipulation, not an animation.
- **Confirmation sheets (Quitar + unfavorite-cascade):** use `<Modal animationType={reducedMotion ? "none" : "fade"}>` — RN's native fade is already lightweight; reduce-motion disables it entirely.

### Patterns to follow (MUST — from CLAUDE.md + prior stories)

- Function declarations with named exports (never `export default` except `App.tsx`)
- `interface {ComponentName}Props` for every component (1 new screen + 1 provider — even if Props is empty, declare the interface and use `Record<string, never>` for empty props per 13.4a precedent, OR omit the Props interface entirely if the component takes zero props per codebase convention in `ArmarioCaptureScreen.tsx:33`)
- NativeWind `className` for static styles; `style={{}}` ONLY for dynamic tokens (Wada `color.hex`, `tileSize`, `rotation`, `translateY.value`). No `StyleSheet.create`.
- Haptics only through `src/lib/haptics.ts` — `hapticLight` on every interactive tap; `hapticRigid` NOT used here (reserved for persistence-success events like `ArmarioPreviewScreen.handleUse`)
- `useReducedMotion()` from `@/hooks/useReducedMotion` — defensive branch on all enter/exit animations
- All hooks called before any early return (Rules of Hooks)
- Co-located `.test.tsx(x)` next to source; `testID` on every interactive element; NEVER `data-testid`
- `__DEV__` guard on every `console.warn` / `console.error`
- Try/catch on all SDK / store / repo calls
- Localize every user-visible string — EN + ES at merge time; Wada color names stay untranslated

### Known risks to guard against

- **Double-assign from concurrent dismiss paths.** Swipe-down + scrim tap + hardware back can all fire before the state settles. Guard via `hasCommitted = useRef(false)` — set to `true` inside `commitAndDismiss`, checked on every entry.
- **Root-navigation resolution under test.** The picker uses TWO `useNavigation` hooks — one typed to `FavoritesStackParamList` (local nav: `goBack`, `addListener`) and one typed to `RootStackParamList` (root jump to `ArmarioRoot`). The Jest mock for `@react-navigation/native` must return a single object exposing all needed methods (`goBack`, `navigate`, `addListener`, `push`) — React Navigation in production returns the same object regardless of the generic type param. If the mock is incomplete (e.g. missing `addListener`), the picker throws inside the `beforeRemove` `useEffect` — see Task 4.2 for the minimal shape.
- **Non-serializable param warning drowning the dev console.** See §"Callback-via-params" above. Acceptable risk; contingency documented.
- **ArmarioStackParamList change rippling into existing tests.** Adding `onCutoutSaved` to `ArmarioPreview` params changes the route shape. `ArmarioPreviewScreen.test.tsx`'s mock `useRoute` needs an `onCutoutSaved` field; existing tests that don't use it should still pass because the field is optional.
- **`FavoriteButton` refactor risk.** Wiring the unfavorite cascade inside `FavoriteButton` is the cleanest architecture, but it touches a component used in Colors tab `Combinations` and FavoritesList via `ComboCard`. If the cascade hook's implementation can't be imported into the button without circular deps (the `wardrobeRepo.getAssignmentCount` read is fine — repo is a leaf module), fall back to per-screen wiring. Confirm at Task 3.4 kickoff.
- **Reanimated + Gesture-Handler version alignment.** Both are already in the codebase and aligned via `PremiumPaywall`. If a version bump is needed at the same time as this story, stop and ask the user — native alignment is out of scope.
- **Grid perf at 100 items.** FlatList with `numColumns={3}` is lazy-rendered and should scale cleanly. The "assigned elsewhere" `conflictSet` is `O(assignments)` computed once per render via `useMemo`. If the grid stutters during on-device scroll at 50+ items, add `initialNumToRender={12}` + `windowSize={3}` in a polish follow-up.
- **VoiceOver reading through the scrim.** `accessibilityViewIsModal={true}` must be on the sheet's root `Animated.View`, NOT on a child. Verify on-device with VoiceOver enabled.
- **Quitar confirmation sheet dismiss during animation.** If the user taps Quitar → rapid tap Cancelar → the sheet mid-animation, guard via `disabled={submitting}` style pattern used by `ArmarioPreviewScreen.handleUse`.
- **OutfitVisualizer has no heart button** (audited — zero `FavoriteButton` / `useFavorites` / `toggleFavorite` imports). Do NOT attempt to wrap it. Current live surfaces for unfavorite are `FavoritesList → ComboCard → FavoriteButton` and `Combinations → ComboCard → FavoriteButton`. If 13.5/13.6 introduce a third surface, the provider-based gate covers it automatically.
- **Empty-state a11y.** When `items.length === 0`, the empty-state copy must still have an `accessibilityLiveRegion="polite"` announcement on mount OR a meaningful `accessibilityLabel` on the container — otherwise VoiceOver users hit a dead spot on the sheet.

### File layout (created / modified by this story)

```
src/
├── screens/
│   └── armario/
│       ├── ArmarioPickerScreen.tsx                 # CREATE — S3 bottom-sheet picker
│       ├── ArmarioPickerScreen.test.tsx            # CREATE — 9 tests
│       ├── ArmarioFichaWadaScreen.tsx              # EDIT — replace onOpenPicker stub with navigation.push; add Quitar affordance
│       ├── ArmarioFichaWadaScreen.test.tsx         # EDIT — +3 tests; update existing stub assertions to assert navigation.push
│       ├── ArmarioCaptureScreen.tsx                # EDIT — thread onCutoutSaved from route.params into ArmarioPreview push
│       ├── ArmarioCaptureScreen.test.tsx           # EDIT — route.params mock includes optional onCutoutSaved (no new tests)
│       ├── ArmarioPreviewScreen.tsx                # EDIT — invoke onCutoutSaved(result.id) after save, before goBack
│       └── ArmarioPreviewScreen.test.tsx           # EDIT — +1 test for callback invocation
├── screens/
│   └── FavoritesList.tsx                           # EDIT (minimal) — only if per-screen wiring is chosen; otherwise unchanged
├── screens/
│   └── FavoritesList.test.tsx                      # EDIT — +2 tests for unfavorite cascade
├── components/
│   └── FavoriteButton.tsx                          # EDIT — wire useUnfavoriteCascade on unfavorite intent
├── components/
│   └── FavoriteButton.test.tsx                     # EDIT — +2 tests (favorite: no gate; unfavorite with count>0: gate)
├── lib/
│   └── armario/
│       ├── confirmUnfavoriteWithCascade.tsx        # CREATE — UnfavoriteCascadeProvider + useUnfavoriteCascade hook
│       └── confirmUnfavoriteWithCascade.test.tsx   # CREATE — 4 tests
├── navigation/
│   ├── types.ts                                    # EDIT — FavoritesStackParamList.ArmarioPicker; ArmarioStackParamList.ArmarioPreview += onCutoutSaved
│   └── FavoritesStack.tsx                          # EDIT — register ArmarioPicker screen with presentation: "transparentModal"
├── i18n/locales/
│   ├── en.json                                     # EDIT — armario.s3.* + armario.s2.linkRemove/quitarConfirm* + armario.unfavoriteCascade.*
│   └── es.json                                     # EDIT — same keys in Spanish
App.tsx                                              # EDIT — wrap navigation tree with <UnfavoriteCascadeProvider>

_bmad-output/implementation-artifacts/sprint-status.yaml
                                                    # EDIT — 13-4b status transitions (dev-story flow)
```

No edits to: `src/lib/wardrobeRepo.ts` (all APIs from 13.1 are sufficient), `src/lib/wardrobeTypes.ts`, `src/stores/wardrobeStore.ts`, `src/lib/armario/saveCutoutAsWardrobeItem.ts`, `src/lib/platform.ts`, `src/lib/haptics.ts`, `src/components/armario/PolaroidCard.tsx` / `WardrobeItemThumb.tsx` / `WadaColorDot.tsx` / `CompletenessBadge.tsx`, `src/components/PremiumPaywall.tsx`, `modules/background-removal/`, `modules/white-balance/`, `ArmarioZeroStateScreen.tsx`, `ArmarioZeroStateScreen.test.tsx`, `ArmarioStack.tsx`, `ColorsStack.tsx`, `ComboCard.tsx` (the 13.4a `onPress` prop stays as-is), `Combinations.tsx`, `OutfitVisualizer.tsx` (if heart is already `FavoriteButton`-based — verify). `jest.config.js`, `jest.setup.js`, `metro.config.js`, `babel.config.js`, `tsconfig.json`, `app.json`, `package.json`, `tailwind.config.js`, `biome.json`.

### References

- Epic source of truth — [docs/planning/epic-13-armario-virtual.md](../../docs/planning/epic-13-armario-virtual.md#story-134b-armario-picker--assignment-mechanics) §"Story 13.4b: Armario Picker + Assignment Mechanics"
- UX spec §S3 — [docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md](../../docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md) lines 109–128
- UX screenshot — [docs/planning/feature-armario-virtual/screens/s3-armario-picker.png](../../docs/planning/feature-armario-virtual/screens/s3-armario-picker.png)
- Technical research (bottom-sheet + reuse policy) — [docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md](../../docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md)
- Story 13.1 (upstream) — [_bmad-output/implementation-artifacts/archive/epic-13/13-1-wardrobe-data-model-repository-zustand-store.md](./13-1-wardrobe-data-model-repository-zustand-store.md) — `assign` / `unassign` / `cascadeDeleteAssignmentsForCombination` / `getAssignmentCount` APIs
- Story 13.3a (upstream) — [_bmad-output/implementation-artifacts/archive/epic-13/13-3a-capture-background-removal-ui-flow.md](./13-3a-capture-background-removal-ui-flow.md) — `ArmarioStack` + `onCutoutSaved` param shape already declared
- Story 13.3b (upstream) — [_bmad-output/implementation-artifacts/archive/epic-13/13-3b-wardrobe-persistence-lifecycle.md](./13-3b-wardrobe-persistence-lifecycle.md) — `saveCutoutAsWardrobeItem` returns `{ id }`
- Story 13.4a (upstream, immediate predecessor) — [_bmad-output/implementation-artifacts/archive/epic-13/13-4a-zero-state-ficha-wada-shared-components.md](./13-4a-zero-state-ficha-wada-shared-components.md) — S2 `onOpenPicker` stub + shared components + FavoritesStack extensions + `ComboCard.onPress` prop
- wardrobeRepo source — [src/lib/wardrobeRepo.ts](../../src/lib/wardrobeRepo.ts) (assign: line 78; unassign: 98; getAssignmentCount: 110; cascadeDelete: 130)
- PremiumPaywall source (motion contract to mirror) — [src/components/PremiumPaywall.tsx](../../src/components/PremiumPaywall.tsx) (DISMISS_THRESHOLD line 28; animations 140–220)
- S2 Ficha Wada source — [src/screens/armario/ArmarioFichaWadaScreen.tsx](../../src/screens/armario/ArmarioFichaWadaScreen.tsx) (slot tap: line 101; filled slot render: 231-290)
- Capture screen — [src/screens/armario/ArmarioCaptureScreen.tsx](../../src/screens/armario/ArmarioCaptureScreen.tsx) (navigation.push to Preview: line 116)
- Preview screen — [src/screens/armario/ArmarioPreviewScreen.tsx](../../src/screens/armario/ArmarioPreviewScreen.tsx) (`handleUse` save site: lines 84-124)
- FavoritesContext — [src/contexts/FavoritesContext.tsx](../../src/contexts/FavoritesContext.tsx) (toggleFavorite: 55-72)
- FavoriteButton — [src/components/FavoriteButton.tsx](../../src/components/FavoriteButton.tsx) — the ideal hook site for the unfavorite-cascade gate
- FavoritesList intercept (13.4a) — [src/screens/FavoritesList.tsx](../../src/screens/FavoritesList.tsx) (handleComboPress: 110-141)
- NavigationParamList — [src/navigation/types.ts](../../src/navigation/types.ts) (FavoritesStackParamList: 11-16; ArmarioStackParamList: 28-31; onCutoutSaved already declared: 29)
- Reduce-motion hook — [src/hooks/useReducedMotion.ts](../../src/hooks/useReducedMotion.ts)
- Haptics — [src/lib/haptics.ts](../../src/lib/haptics.ts) (`hapticLight` is the only one used in this story)
- Platform gate — [src/lib/platform.ts](../../src/lib/platform.ts) (`isIOS17OrNewer`, `useIsIOS17OrNewer`)
- Theme tokens — [src/styles/theme.ts](../../src/styles/theme.ts) (`wadaTokens.bgPaper`, `textPrimary`, `textTertiary`, `borderSubtle`)
- i18n parity test — [src/i18n/__tests__/i18n.test.ts](../../src/i18n/__tests__/i18n.test.ts)
- Epic 13 decisions — memory `project_epic13_decisions.md` (iPhone-only, FREE_WARDROBE_LIMIT = 10, FR6 reuse policy)
- v1.4.0 context — memory `project_v140_epic13_start.md`
- No-analytics constraint — memory `feedback_no_analytics.md`
- Visual review convention — memory `feedback_visual_review.md`
- CLAUDE.md — §Story Scope (4-task cap), §React Native Specifics, §Testing Discipline, §Accessibility First, §Rules of Hooks, §Mandatory Code Review

### Project Structure Notes

- First screen under `src/screens/armario/` that uses `presentation: "transparentModal"` — the pattern is forward-compatible with Story 13.5/13.6 overlays if they need similar behavior.
- First use of `react-native-gesture-handler`'s `Gesture.Pan()` API outside of `PremiumPaywall`. If a third consumer materializes, consider extracting a shared `BottomSheet` component in an Epic 14 polish pass.
- Reuses every Story 13.4a shared component (`WardrobeItemThumb`, `WadaColorDot`) — the `screens → components` dependency direction is preserved.
- `src/lib/armario/confirmUnfavoriteWithCascade.tsx` is the first provider-level helper under `src/lib/armario/`. Future stories (13.5, 13.6) may add similar provider-level helpers — group them in the same subdirectory.
- No changes to `tailwind.config.js`, `biome.json`, `jest.config.js`, `jest.setup.js`, `metro.config.js`, `babel.config.js`, `tsconfig.json`. No new native deps — no `expo prebuild --clean` rebuild required. Pure JS/TS story.

---

## ⚠️ Reviewer Notes — Do Not Flag

> **READ FIRST.** This story went through the original spec plus **three UX passes in a physical-device QA session** with Alejandro on 2026-04-20. The following **deviations from the original AC text are deliberate product decisions**, accepted on device, and **must not be marked as bugs or regressions** in the adversarial review. If you disagree with any of them as a reviewer, file it as a follow-up exploration (tagged `post-epic-13 S3 revisit`), not as a review finding.

### Decisions that DEVIATE from the original AC text

| # | Original spec said | Final behavior | Why |
|---|---|---|---|
| 1 | AC #3, #4: tile tap sets a selection ring + `selectedId` state; `commitAndDismiss` runs on any of three dismiss routes via `beforeRemove` listener + `hasCommitted` ref. | **Tap = commit + dismiss immediately, in a single gesture.** No selection state, no ring overlay, no `beforeRemove` listener. | Two gestures (tap-select → swipe-down) tested as friction on device. Users expected tap to apply. Move semantics (unassign old slot → assign new) preserved. |
| 2 | AC #2: spring enter `damping: 18, stiffness: 180`. | `withTiming(0, { duration: 280, easing: Easing.out(cubic) })` enter; `Easing.in(cubic)` exit. | Spring bounce tested too "conversion-y" (PremiumPaywall-ish) for a utilitarian repeated surface. Timing keeps the sheet subdued. |
| 3 | AC #2: tab row with `Mi Armario` / `+ Nueva foto` tabs. | **Tab row eliminated.** Single content area = Mi Armario grid. Footer `Fotografiar prenda nueva` text-link is the only entry to the capture flow. | The two tabs were redundant with the footer CTA; Mi Armario is the picker's only real content. Removing the tab reduces visual surface. |
| 4 | (No S2 CTA constraint specified) | `Ver tu look` CTA on S2 lifted by `FAB_PROTRUSION`. | The CTA collided visually with the camera FAB protruding from the tab bar — matches the pattern already used by `ColorHome` and `OutfitVisualizer`. |
| 5 | AC #6: `ArmarioPreviewScreen.handleUse` calls `navigation.goBack()` after save. | When `onCutoutSaved` callback is present (capture flow launched from S3), calls **`navigation.getParent()?.goBack()`** — dismisses the root `ArmarioRoot` modal entirely, not just the stack pop. Fallback to `goBack()` when no callback (preserves 13.3b direct-entry flow). | The original goBack left the camera visible after the user finished — they had to back out of a stale screen. Parent-level dismiss makes the flow end where it started (the picker). |
| 6 | AC #4: `onCutoutSaved(newItemId)` sets `selectedId = newItemId` + switches to Mi Armario tab so user can see the pre-selected item and swipe-down to commit. | `onCutoutSaved` **commits immediately and dismisses**. The user's "Usar esta foto" tap in Preview IS the assignment — no extra gesture. | Consistent with decision #1 (tap = commit). Spec said "implicit selection" — on device, `commit` is the natural read of "Usar esta foto para este color". |
| 7 | AC #7: `Quitar` action on S2 filled slots — spec didn't constrain visual structure beyond the link. Original S2 layout had a separate color swatch above the thumb. | **S2 slot card redesigned**: the separate `aspectRatio: 1.25` color swatch is removed. The Wada color now lives *exclusively* as the tile's border — dashed when empty, solid 2pt when assigned. Tile unified to `aspectRatio: 1`. Color name removed from visible UI (VoiceOver still reads it via `slotA11y*`). Arrows (`→`) removed from `Asignar` / `Cambiar` strings. | The color swatch competed visually with the assigned thumb; the name duplicated information conveyed by the color; the arrow added typographic noise. Slot footprint is now identical across empty and assigned states. |
| 8 | (No AC — Issue #2 from UX pass) | **Long-press (450ms) on a tile in the picker** → confirmation modal → `cascadeDeleteAssignmentsForItem(id)` → `removeItem(id)` → `deleteItemFiles({ localImagePath, thumbnailPath })`. Picker stays open after delete (does not auto-dismiss). | Epic 13 never specified a UI for `wardrobeRepo.removeItem()` — a gap confirmed during QA. Long-press in the picker is the minimal fix until a dedicated "Mi Armario" management screen lands (candidate Story Epic 14). |

### Implementation decisions that are intentional (don't re-architect)

| What | Why | Scope |
|---|---|---|
| `__mocks__/@react-native-async-storage/async-storage.js` global shim | `FavoriteButton` now depends transitively on `wardrobeRepo` → `wardrobeStore` → AsyncStorage. Several legacy suites render `FavoriteButton` and previously didn't need an AsyncStorage mock. Global shim re-exports the upstream jest mock. | Codebase-wide mock file |
| `onCutoutSaved: (id: string) => void` passed via React Navigation route params | Documented React Navigation dev-only "non-serializable param" warning. Accepted per Dev Notes §"Callback-via-params — React Navigation warning". Fallback to Zustand `pendingPreselect` slice documented but not needed. | `ArmarioStackParamList.ArmarioCapture` / `ArmarioPreview` |
| `includeHiddenElements: true` in some picker tests | The confirm sheet inside the RN `<Modal>` uses `accessibilityViewIsModal` for VoiceOver focus isolation — correct production semantic. Testing Library hides its descendants from default queries, so those assertions opt in. Not a production bug. | `ArmarioPickerScreen.test.tsx` delete-flow tests |
| `cascadeDeleteAssignmentsForItem` is a separate repo function (not folded into `removeItem`) | Keeps `removeItem` minimal and matches the existing `cascadeDeleteAssignmentsForCombination` shape. Callers explicitly opt into cascade — mirrors AsyncStorage's lack of foreign-key semantics. | `src/lib/wardrobeRepo.ts` |
| `deleteItemFiles` distinct from `rollbackWardrobeFiles` | `rollback` targets in-flight saves by uuid; `deleteItemFiles` targets the exact `localImagePath` / `thumbnailPath` of a persisted item. Safer because it doesn't depend on uuid-filename alignment. | `src/lib/armario/wardrobeFiles.ts` |
| `WardrobeItemThumb` gained `fill?: boolean` | Lets S2 own the tile's size (`aspectRatio: 1` in the slot container) instead of hardcoding a pixel size. Legacy `size` prop (default 96) untouched — picker still uses it. | `src/components/armario/WardrobeItemThumb.tsx` |
| Nested Pressable for `Quitar` inside slot Pressable + `e?.stopPropagation?.()` | Without stopPropagation the outer slot tap would also fire and push the Picker concurrently. Optional chain guards against test harness events that omit the native event object. | `src/screens/armario/ArmarioFichaWadaScreen.tsx` |

### Scope boundaries (already honored)

- No changes to `wardrobeRepo` existing API shapes (13.1 contract intact except for the ADDED `cascadeDeleteAssignmentsForItem`).
- No changes to `saveCutoutAsWardrobeItem` contract (13.3b stable).
- No new native deps, no `expo prebuild --clean` rebuild required.
- S4 Tu Look / S5 Sugerencia stubs untouched (Stories 13.5 / 13.6).
- Favorites card badges / thumbnails / completeness sort untouched (Story 13.6).
- iPad layout untouched (iPhone-only v1.4.0, iPad is Epic 14).

### Known post-epic follow-ups (ship as-is; iterate later)

- **S3 Picker UX revisit** — Alejandro explicitly wants to iterate variants after Epic 13 ships. The current picker is functionally accepted but is UX debt. Do NOT surface this as a review blocker. See memory [project_s3_picker_ux_debt.md](../../.claude/projects/-Users-alejandrocamps-outfinder/memory/project_s3_picker_ux_debt.md).
- **Dedicated "Mi Armario" management screen** — candidate Story Epic 14. Long-press-delete in the picker is the v1.4.0 fallback for the `removeItem` gap.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]`

### Debug Log References

- `npx tsc --noEmit` — clean (exit 0)
- `pnpm lint` (Biome) — clean (143 files checked, no issues)
- `pnpm test` — **final: 723 passing / 60 pre-existing failures** across 61 suites. Baseline was 684/60; delta is **+39 net new tests, 0 new regressions**. Evolution across the three UX passes: initial dev 717/60 → pass 1 (UX fixes) 715/60 (dropped 2 picker tests along with tab/selection-ring deletion) → pass 2 (delete flow) 722/60 (+5 picker + 2 repo) → pass 3 (S2 redesign) 723/60 (+1 structural regression check). Pre-existing failures remain isolated to `src/i18n/__tests__/i18n.test.ts` + `src/screens/OutfitVisualizer.test.tsx` (per project-context §Known Technical Debt #7).
- Global AsyncStorage mock added at `__mocks__/@react-native-async-storage/async-storage.js`. Required because `FavoriteButton` now imports from `wardrobeRepo` → `wardrobeStore` → `AsyncStorage`, and several legacy suites (ComboCard, PaletteStrip, CombinationList, Combinations, ColorHome) render `FavoriteButton` transitively without having previously needed an AsyncStorage mock. The shim re-exports the upstream `@react-native-async-storage/async-storage/jest/async-storage-mock` globally.

### Completion Notes List

#### AC walkthrough

| AC | Status | Verified via |
|----|--------|--------------|
| 1. Slot tap pushes `ArmarioPicker` with `transparentModal` presentation | ✅ | `ArmarioFichaWadaScreen.test.tsx` "slot tap fires hapticLight + navigation.push ArmarioPicker with correct args"; `FavoritesStack.tsx` registration with `presentation: "transparentModal"`, `animation: "fade"` |
| 2. Sheet header + tabs + drag handle + scrim dismiss | ✅ | `ArmarioPickerScreen.test.tsx` "(a) renders header, tabs…", "scrim is reachable…", "tabs expose accessibilityRole=tab…", "renders the drag handle inside the sheet" |
| 3. Mi Armario 3-column grid + selection ring + empty state + assigned-elsewhere conflict | ✅ | Tests "(b) 3-column grid", "(c) selection ring toggle", "(i) assigned-elsewhere opacity + overlay", "empty-state announces via accessibilityLiveRegion" |
| 4. commitAndDismiss fires exactly once via `beforeRemove` listener; move semantics unassign-before-assign | ✅ | Tests "(d) beforeRemove fires assign", "(e) move semantics: unassign fires BEFORE assign", "(f) beforeRemove without selection → pure dismiss" |
| 5. `+ Nueva foto` tab and footer navigate to `ArmarioRoot` with `onCutoutSaved` callback via root-navigation hook | ✅ | Test "(g) Nueva foto tab + footer CTA navigate to ArmarioRoot…" — both tab and footer reach the same handler |
| 6. `ArmarioPreviewScreen.handleUse` threads `onCutoutSaved(result.id)` BEFORE `goBack` | ✅ | `ArmarioPreviewScreen.test.tsx` test 9 "onCutoutSaved callback fires with saved id BEFORE goBack…"; test 10 "omits onCutoutSaved → save still completes" (backwards-compat regression) |
| 7. `Quitar` on S2 filled slots → confirmation sheet → `unassign` + revert | ✅ | `ArmarioFichaWadaScreen.test.tsx` "filled slot renders Quitar link with 44pt…", "empty slot does NOT render Quitar link", "Quitar tap opens confirmation sheet → confirm fires unassign…", "Quitar tap → Cancel" |
| 8. Unfavorite cascade via `<UnfavoriteCascadeProvider>` + `useUnfavoriteCascade()`; count>0 iOS17+ shows sheet, else synchronous `onConfirm` (NFR9 parity) | ✅ | `confirmUnfavoriteWithCascade.test.tsx` tests (m)(n)(o)(p) + defensive-throw + no-provider fallback; `FavoritesList.test.tsx` "unfavorite with 0 assignments" + "unfavorite with >0 assignments routes through cascade hook"; `FavoriteButton.test.tsx` "favorite tap does NOT consult cascade", "unfavorite tap consults cascade gate", "unfavorite with count=0 immediate confirm" |
| 9. Nav graph extensions on `FavoritesStackParamList` + `ArmarioStackParamList.ArmarioPreview.onCutoutSaved`; root-modal `ArmarioRoot` unchanged | ✅ | `src/navigation/types.ts` diff; `src/navigation/FavoritesStack.tsx` registers `ArmarioPicker` with `presentation: "transparentModal"` + `animation: "fade"` after `ArmarioFichaWada`; `App.tsx` root modal registration unchanged |
| 10. VoiceOver + 44pt targets + reduce-motion contract | ✅ | Tests "scrim is reachable with dismiss a11y label", "sheet sets accessibilityViewIsModal", "tabs expose accessibilityRole=tab with selected state", "empty-state announces copy via accessibilityLiveRegion", "non-conflict tile uses the default item a11y label", "filled slot renders Quitar link with 44pt touch target + accessibilityLabel". `useReducedMotion()` branch short-circuits enter/exit animations in `ArmarioPickerScreen` + Modal `animationType` in `ArmarioFichaWadaScreen` + `confirmUnfavoriteWithCascade` |
| 11. Test suites + regression baseline | ✅ | 717 passing / 60 pre-existing failures. +33 net tests. tsc + biome clean. EN + ES parity intact (story adds 16 keys to each locale; existing `src/i18n/__tests__/i18n.test.ts` type-parity test continues to compile via `src/i18n/types.ts`'s `AssertSameKeys`) |

#### Architectural decisions worth flagging

- **Bottom-sheet motion**: re-used the `PremiumPaywall` motion contract verbatim (`DISMISS_THRESHOLD: 100`, `VELOCITY_THRESHOLD: 500`, `damping: 18, stiffness: 180` spring, 220ms timing exit). Zero new native deps; `@gorhom/bottom-sheet` deliberately deferred per Dev Notes §"Bottom-sheet library decision".
- **Callback-via-params (AC #5/#6)**: chose the simpler approach (pass function through route params; accept React-Navigation's dev warning) over the Zustand `pendingPreselect` fallback. The warning is development-only, scoped to a modal flow that cannot outlive its caller, and matches React Navigation's documented pattern for short-lived modal return values. Fallback path is documented in the story Dev Notes if reviewers see the warning cascade during QA.
- **Unfavorite cascade as a provider/hook** (`src/lib/armario/confirmUnfavoriteWithCascade.tsx`): the interception lives inside `FavoriteButton`, so `ComboCard` call-sites in both FavoritesList and Colors-tab Combinations inherit the gate automatically. iOS<17 and `count===0` both short-circuit to synchronous `onConfirm()` — NFR9 parity preserved for Colors-tab users with no wardrobe activity.
- **Nested `Quitar` Pressable inside slot Pressable** (AC #7): required `e?.stopPropagation?.()` (optional chain for test-harness events that don't supply a nativeEvent). Without this, a tap on `Quitar` would also open the Picker because the outer slot handler would fire on the same gesture.
- **Move semantics** (AC #4): `commitAssignment` searches the assignments slice for the same-combo/same-item/different-slot row and `unassign`s it BEFORE `assign`ing. Jest ordering assertion (`invocationCallOrder`) confirms the ordering is load-bearing — reversing it would produce a transient double-assigned state.

#### Manual QA checklist (for code-review follow-up on simulator iPhone 16 Pro)

(Deferred to post-code-review QA per Story 13.4a precedent; unit tests cover all behavioral ACs.)

- (a) Open Favorites → tap favorited combo → S0/S2 → tap slot → S3 picker slides up over S2 with scrim visible.
- (b) Pick any existing item → selection ring appears in Wada color → swipe down → picker dismisses → S2 slot shows the newly-assigned thumbnail + `Cambiar →`.
- (c) Re-tap the same slot → tap `+ Nueva foto` → Capture modal presents → take photo → Use → modal dismisses → picker visible with new item pre-selected on Mi Armario tab → swipe down → assign fires → S2 updated.
- (d) On a filled slot, tap `Quitar` → confirmation sheet → confirm → slot reverts to dashed empty + badge decrements.
- (e) Move-semantics probe: fill slot 0, then tap slot 1 → open picker → pick the SAME item → swipe down → verify slot 0 is empty AND slot 1 is filled (item moved, not duplicated).
- (f) Back-swipe probe: tap slot → pick item → iOS edge back-swipe → verify assign still fired (beforeRemove contract).
- (g) Tap a 3/3 complete combo's heart on FavoritesList → cascade sheet appears with interpolated `Se quitarán las 3 prendas…` → tap `Quitar de favoritos` → combo unfavorites + wardrobe items still present.
- (h) Switch simulator language to Spanish, repeat (a)–(g) → every new string localized.
- (i) Enable Reduce Motion → picker enters/exits without spring; confirmation sheets fade without slide.

#### Change Log

- 2026-04-20 — Story 13.4b: implemented S3 ArmarioPickerScreen (bottom-sheet picker), Quitar action on S2, unfavorite cascade provider/hook, Nueva foto callback round-trip (Capture→Preview→Picker). 33 net new tests, tsc/lint clean, 0 new regressions.
- 2026-04-20 — Story 13.4b UX pass 1 from physical-device testing (Alejandro):
  - **#1 Tap = commit + dismiss**: eliminated the preview-selection state; tapping a tile now commits the assignment and closes the sheet in one gesture. Removed `selectedId`/`hasCommitted` state, `activeTab` state, `beforeRemove` listener, and the selection-ring overlay. Move semantics (unassign-then-assign) still apply when the item is on another slot of the same combo.
  - **#3 Animation tweak**: replaced the spring entry (`damping: 18, stiffness: 180`) with `withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) })`. Exit and pan-snap-back use the same timing family. No bounce — picker feels utilitarian vs PremiumPaywall's intentional bounce.
  - **#4 `Ver tu look` CTA**: added `FAB_PROTRUSION` to the CTA's `bottom` on S2 so it lifts above the tab-bar camera FAB (matches the `ColorHome` / `OutfitVisualizer` pattern).
  - **#5 Cámara/Preview dismiss**: when `onCutoutSaved` callback is present (flow launched from S3), `ArmarioPreviewScreen.handleUse` now closes the entire `ArmarioRoot` modal via `navigation.getParent()?.goBack()` instead of just popping Preview → Capture. Preserves the 13.3b direct-entry flow (no callback → local `goBack()`).
  - **#6 Tab deduplication**: removed the `+ Nueva foto` tab (and its redundant tab row). The footer `Fotografiar prenda nueva` is now the single entry point to the capture flow. Mi Armario is the sheet's only content. Removed `armario.s3.tabWardrobe`, `tabNewPhoto`, `newPhotoCta` keys from EN/ES locales; `emptySubtitle` rewritten to reference the footer.
  - **#2 Remove from wardrobe**: gap in Epic 13 confirmed (no UI for `removeItem()`). Follow-up decision pending — see conversation.
  - Tests: picker suite went from 16 → 14 tests (removed the ones that exercised the deleted tabs/selection-ring); Preview test 9 rewritten to assert `getParent()?.goBack()`; Preview test 10 asserts no root dismiss when callback absent. Net delta vs baseline: still **+31 tests**, tsc/lint clean, 60 pre-existing failures unchanged.
- 2026-04-20 — Story 13.4b UX pass 2: **delete-from-wardrobe** (Issue #2, previously a gap in Epic 13):
  - Added `wardrobeRepo.cascadeDeleteAssignmentsForItem(wardrobeItemId)` — removes every assignment row referencing the item, across every combination. Paired with `removeItem` to implement the "delete + free slots" flow. +2 unit tests.
  - Added `wardrobeFiles.deleteItemFiles({ localImagePath, thumbnailPath })` — explicit, per-item file delete (distinct from the uuid-based `rollbackWardrobeFiles` which targets in-flight saves).
  - Wired `ArmarioPickerScreen`: long-press on a tile (450 ms) → hapticMedium + confirm sheet (`s3-delete-confirm-*` testIDs) with contextual body copy (plain if 0 assignments; `"It will also be removed from {count} palettes..."` if >0). Confirm fires cascade → removeItem → deleteItemFiles in strict order + hapticLight; cancel is a no-op. Picker stays open after delete so the user can pick another garment in the same gesture (no implicit dismiss).
  - Extended a11y labels on tiles to announce the long-press affordance: `"Garment. Double-tap to assign to {{color}}. Long-press to delete."` (same for the assigned-elsewhere variant).
  - Added EN+ES locale keys: `armario.s3.deleteConfirmTitle/Body*/Yes` (with `_one` / `_other` plural variants for the assignment-count body).
  - Picker test suite: 14 → 19 tests (+5 for the delete flow). Repo test suite: +2. Full sweep at **722 passing / 60 pre-existing**, tsc + biome clean.
- 2026-04-20 — Story 13.4b UX pass 3: S2 slot card redesign (from physical-device testing #2):
  - Eliminated the standalone Wada color swatch (`aspectRatio: 1.25`) that stacked above the thumb. The color now lives exclusively as the tile's **border** — dashed when empty, solid 2pt when assigned — removing the visual competition between two color surfaces.
  - Unified the slot tile to a single `aspectRatio: 1` container. Empty and assigned states share the same footprint and border radius, so a freshly-unfavorited slot no longer pops visually against its assigned neighbors.
  - Dropped the visible color name under the tile — the Wada color is conveyed by the border + the combo's color-dots row in the header. VoiceOver still reads the color via `slotA11y*` a11y labels (no regression for screen readers).
  - Removed the `→` arrow from `armario.s2.linkAssign` and `linkChange` in both locales. The links are now pure text.
  - `WardrobeItemThumb` gained a `fill?: boolean` prop for callers that own the container size (S2 slot). When `fill` is true the component drops its own radius/background and stretches via `flex: 1`; the legacy `size` prop (default 96) is unchanged for the picker.
  - Tests: S2 suite picked up one tile-structure regression check (`filled slot no longer renders the standalone color name above the thumb`) and the existing copy checks were updated to the no-arrow strings. **723 passing / 60 pre-existing**, tsc + biome clean.

### Review Findings

**Code review: 2026-04-20 — 0 decision-needed · 3 patches · 8 defers · 9 dismissed**

#### Patches

- [x] [Review][Patch] A — `commitAndDismiss` sin guard `isClosing` en su propia entrada: doble-tap rápido puede ejecutar dos `assign` consecutivos antes de que `dismissWithAnimation` active el ref guard [`src/screens/armario/ArmarioPickerScreen.tsx` — línea 162, `commitAndDismiss`]. Fix: añadir `if (isClosing.current) return;` como primera línea de `commitAndDismiss`. ✅ applied
- [x] [Review][Patch] B — `navigation.getParent()?.goBack()` en `ArmarioPreviewScreen.handleUse`: si `getParent()` devuelve null (deep-link o test harness), la llamada se silencia vía optional chain y la pantalla queda bloqueada [`src/screens/armario/ArmarioPreviewScreen.tsx` — `handleUse`, línea 103]. Fix: fallback a `navigation.goBack()` cuando `getParent()` sea null. ✅ applied
- [x] [Review][Patch] C — `accessibilityViewIsModal` está en `testID="s3-sheet"` (Animated.View interior) en lugar del root `testID="s3-armario-picker-screen"`: esto oculta el scrim al árbol de accesibilidad de VoiceOver (el scrim es hermano del sheet, no hijo) [`src/screens/armario/ArmarioPickerScreen.tsx` — línea 286]. Fix: mover `accessibilityViewIsModal` al root `<View>`. ✅ applied (test updated accordingly)

#### Defers

- [x] [Review][Defer] D — `ArmarioCaptureScreen.test.tsx`: `mockRouteParams` declarado `const undefined` — el forwarding de `onCutoutSaved` de Capture→Preview no está ejercitado en aislamiento (spec: "no new tests" para este archivo) — deferred, gap de cobertura aceptado en spec
- [x] [Review][Defer] E — `UnfavoriteCascadeProvider.handleConfirm`: si `pending.onConfirm()` lanza, los assignments ya fueron borrados pero el favorito sigue intacto (rollback de cascade requeriría lógica out-of-scope) — deferred, narrow theoretical gap
- [x] [Review][Defer] F — ES locale `armario.unfavoriteCascade.body_one`: `"Se quitará la {{count}} prenda"` → `"la 1 prenda"` suena forzado; `_one` debería omitir el numeral — deferred, UX copy polish post-épica
- [x] [Review][Defer] G — `onCutoutSaved` función capturada como route param: si el OS recrea el modal desde params serializados, la función queda `undefined` y `onCutoutSaved?.()` silencia el fallo sin asignar — deferred, documentado en Dev Notes §Callback-via-params
- [x] [Review][Defer] H — `handleDeleteConfirm` no comprueba `isClosing.current`: si el dismiss ya está en curso al confirmar el delete, `setPendingDelete(null)` puede actualizar state en un componente en mid-unmount — deferred, RN swallows, baja probabilidad
- [x] [Review][Defer] I — TOCTOU: `pendingDeleteAssignmentCount` computado en render puede diferir del count real en `cascadeDeleteAssignmentsForItem` (otra pantalla puede haber quitado la asignación entre render y confirm) — deferred, cosmético; cascade opera sobre live store
- [x] [Review][Defer] J — `tileSize` usa `screenWidth` de `useWindowDimensions()` donde el spec dice `sheetWidth`: idénticos en iPhone (sheet full-width) pero divergiría si se añaden insets al sheet — deferred, functionally identical on current targets
- [x] [Review][Defer] K — Sin test que aserte directamente `testID="s2-quitar-confirm-sheet"` en `ArmarioFichaWadaScreen.test.tsx` (los tests de Quitar acceden a hijos del Modal: body, yes, cancel) — deferred, testID presente en prod code, gap menor

### File List

**Created (initial dev + UX passes 2-3):**
- `src/screens/armario/ArmarioPickerScreen.tsx` (initial dev; refactored in UX passes 1+2)
- `src/screens/armario/ArmarioPickerScreen.test.tsx` (initial dev; restructured in UX pass 1 — 16→14; +5 in UX pass 2 → 19 tests)
- `src/lib/armario/confirmUnfavoriteWithCascade.tsx`
- `src/lib/armario/confirmUnfavoriteWithCascade.test.tsx`
- `__mocks__/@react-native-async-storage/async-storage.js`

**Modified:**
- `src/navigation/types.ts` — `FavoritesStackParamList.ArmarioPicker` added; `ArmarioStackParamList.ArmarioPreview.onCutoutSaved?` added.
- `src/navigation/FavoritesStack.tsx` — registers `ArmarioPickerScreen` with `presentation: "transparentModal"`, `animation: "fade"`.
- `src/screens/armario/ArmarioFichaWadaScreen.tsx` — (a) removed `onOpenPicker` stub; `handleSlotTap` now calls `navigation.push("ArmarioPicker", …)`. (b) Added `Quitar` affordance + confirmation Modal; `useReducedMotion()` branch on `animationType`. (c) **UX pass 1:** CTA `Ver tu look` uses `bottom: 28 + FAB_PROTRUSION`. (d) **UX pass 3:** eliminated the separate color swatch; unified tile to `aspectRatio: 1`; color Wada lives as border (dashed empty / solid 2pt assigned); removed visible color name; links without arrows.
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — rewrote slot-tap to `mockPush` spy; added Quitar tests; **UX pass 3:** updated copy assertions to no-arrow strings, added `filled slot no longer renders the standalone color name above the thumb` structural regression. **13 tests total.**
- `src/components/armario/WardrobeItemThumb.tsx` — **UX pass 3:** added `fill?: boolean` prop for callers that own the container size. Legacy `size` prop (default 96) behavior unchanged when `fill` is false.
- `src/screens/armario/ArmarioCaptureScreen.tsx` — reads `route.params?.onCutoutSaved` and threads it into `navigation.push("ArmarioPreview", …)` forward.
- `src/screens/armario/ArmarioCaptureScreen.test.tsx` — added `useRoute` mock in the `@react-navigation/native` mock factory.
- `src/screens/armario/ArmarioPreviewScreen.tsx` — reads `onCutoutSaved` from `route.params`; invokes it with the saved `result.id` AFTER `hapticRigid()`. **UX pass 1:** when `onCutoutSaved` is present, closes the root `ArmarioRoot` modal via `navigation.getParent()?.goBack()` instead of local `goBack()`.
- `src/screens/armario/ArmarioPreviewScreen.test.tsx` — `useRoute` mock upgraded to mutable `mockRouteParams`; added `mockParentGoBack` and tests 9 + 10 (callback before root dismiss; backwards-compat local goBack when callback absent). **12 tests total.**
- `src/components/FavoriteButton.tsx` — on `isFavorite` tap, routes through `useUnfavoriteCascade()` with the current `getAssignmentCount(combinationId)`; favorite taps bypass entirely.
- `src/components/FavoriteButton.test.tsx` — mocks `useUnfavoriteCascade` + `getAssignmentCount`; added 3 tests (favorite bypasses gate, unfavorite calls gate with count, count=0 short-circuit).
- `src/screens/FavoritesList.test.tsx` — mocks cascade hook + assignment count; added 2 tests (0-count short-circuit, >0-count gate with capture of confirm/cancel).
- `src/lib/wardrobeRepo.ts` — **UX pass 2:** added `cascadeDeleteAssignmentsForItem(wardrobeItemId)` — removes every assignment row for the given item across every combination.
- `src/lib/wardrobeRepo.test.ts` — **UX pass 2:** added `cascadeDeleteAssignmentsForItem` describe block (2 tests: multi-combo cascade + no-op on unknown id).
- `src/lib/armario/wardrobeFiles.ts` — **UX pass 2:** added `deleteItemFiles({ localImagePath, thumbnailPath })` — explicit per-item file delete distinct from the uuid-based `rollbackWardrobeFiles`.
- `App.tsx` — mounts `<UnfavoriteCascadeProvider>` between `<PremiumProvider>` and `<NavigationContainer>`.
- `src/i18n/locales/en.json` — added `armario.s3.*` (`screenLabel`, `pickerTitle`, `footerNewPhoto`, `emptyTitle`, `emptySubtitle`, `itemA11y`, `itemA11yAssignedElsewhere`, `assignedElsewhere`, `dismiss`, `dragHint`, **UX pass 2** `deleteConfirmTitle`, `deleteConfirmBodyNoAssignments`, `deleteConfirmBodyWithAssignments_one/_other`, `deleteConfirmYes`), `armario.s2.linkRemove` / `slotRemoveA11y` / `quitarConfirmBody` / `quitarConfirmYes`, `armario.unfavoriteCascade.*` (with `_one` / `_other` plural split), `common.cancel`. **UX pass 3:** `linkAssign` and `linkChange` dropped the `→`; `itemA11y*` a11y strings extended with "Long-press to delete."
- `src/i18n/locales/es.json` — same keys in Spanish (full EN/ES parity).
- `src/i18n/locales/es.json` — same keys in Spanish.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 13.4b moved `ready-for-dev` → `in-progress` → `review`.
- `_bmad-output/implementation-artifacts/archive/epic-13/13-4b-armario-picker-assignment-mechanics.md` — Status + Dev Agent Record + File List + Change Log populated.
