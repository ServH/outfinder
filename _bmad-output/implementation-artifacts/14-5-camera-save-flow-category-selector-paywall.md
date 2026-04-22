# Story 14.5: Camera save flow — category selector bottom sheet + paywall gate + PostSave "¿Ahora qué?" screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user who tapped "Guardar en mi armario" on the `UnifiedCameraResultScreen` (Story 14.4) and now needs to (a) pick a category for this garment, (b) have it actually persist to the armario via `saveCutoutAsWardrobeItem`, (c) be shown `PremiumPaywall` if I'm a free user at the 10/10 `FREE_WARDROBE_LIMIT`, and (d) land on a small "¿Ahora qué?" PostSave screen that offers me the two coherent exits (ver combinaciones con this Wada tone OR volver a Mis Looks) instead of dropping me into a cul-de-sac**,
I want **the full save-path from "Guardar" tap through to PostSave wired end-to-end: (i) a reusable `CategoryPickerSheet` bottom-sheet component (under `src/components/armario/CategoryPickerSheet.tsx` — exported so Story 14.12b can reuse it per TD-6) that presents 4 rows (`top` / `bottom` / `footwear` / `accessory`) with SF-Symbols-or-emoji icons, a disabled-until-selection "Confirmar" button, swipe-down and tap-outside dismissal, a selected-state visual (muted Wada paper tint + 1.5pt leading indicator), `hapticLight` on row select, `hapticMedium` on Confirmar, full VoiceOver labeling and a `currentCategory?` prop for pre-selection in 14.12b reuse; (ii) Result screen's primary-CTA handler rewired from the 14.4 `navigation.push("PostSave")` stub + `__DEV__ console.warn` into `setCategorySheetVisible(true)`; (iii) on Confirmar, invoke `saveCutoutAsWardrobeItem({ cutoutUri, sourceUri, isPremium, category })` where `sourceUri` is plumbed through new `Capture→Result` route-param; (iv) catch `WardrobePersistenceError` by kind — `paywall` → dismiss sheet + show `PremiumPaywall` (reuse of `usePremiumGate` + exact props pattern from `ArmarioPreviewScreen.tsx:331-341`); `diskFull` / `encode` / `move` / `repoAdd` → show a dismissable error banner with copy from new `unifiedCamera.save.errorDiskFull` / `errorEncode` / `errorSaveFailed` keys; (v) on success, `hapticRigid` + `navigation.replace("PostSave", { wadaColorId, capturedHex, categoryKey })` (replace, not push, so back-gesture doesn't land on a stale Result); (vi) a real `UnifiedCameraPostSaveScreen` that replaces the 14.3a placeholder and renders "Guardado en tu armario como {category}" + two CTAs — primary "Ver combinaciones con {wadaName}" that cross-navigates to `Main → ColorsTab → Combinations { colorId, capturedHex }` (same pattern Result secondary link uses), secondary "Volver a Mis Looks" that cross-navigates to `Main → FavoritesTab` (tab is still named `FavoritesTab` in this story — Story 14.7 renames later; do NOT anticipate); (vii) on paywall dismiss-without-purchase user returns to Result with the sheet closed and no persistence; (viii) on paywall purchase success the save is re-triggered silently (per UX-DR1 line 252)**,
so that **the unified camera flow ships the first-use "magic moment" end-to-end in this story, Story 14.12b can reuse `CategoryPickerSheet` unchanged, the existing `saveCutoutAsWardrobeItem` contract (frozen by Epic 13 / TD-1 / Story 14.1) is consumed AS-IS (no signature edits), paywall visual is the existing `PremiumPaywall` sheet (zero redesign), and the PostSave "¿Ahora qué?" screen converts the end of the scan into the onward surface that prevents the dead-end Alejandro called out**.

## Acceptance Criteria

1. **Given** the Result screen's primary CTA currently routes to `navigation.push("PostSave")` with a `__DEV__ console.warn` stub (Story 14.4 line 107-115 in `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx`), **When** this story merges, **Then** that handler is rewired so tapping "Guardar en mi armario" opens the new `CategoryPickerSheet` modal (not a nav push) — **And** the `__DEV__` warn is removed, **And** `hapticMedium` still fires FIRST on tap (UX-DR1 haptics contract line 792 "Result screen primary CTA tap → `hapticMedium` → Commit-ish (opens category sheet)") BEFORE setting sheet-visible state, **And** all other Result-screen behavior (cutout render, Wada name stack, combinations count, tone-correction section, secondary link "ver combinaciones sin guardar", luminance-rule CTA color) stays byte-for-byte unchanged — no other lines of that file are edited except (a) the CTA onPress body, (b) a new `useState<boolean>(false)` for sheet visibility, (c) a new `useState<boolean>(false)` for paywall visibility, (d) a new `usePremiumGate` hook call (mirrors `ArmarioPreviewScreen.tsx:56`), (e) the addition of `<CategoryPickerSheet>` + `<PremiumPaywall>` JSX nodes at the end of the returned View tree, (f) `sourceUri` read from `route.params` (requires AC #3).

2. **Given** the current route-params contract `UnifiedCameraStackParamList.Result = { cutoutUri: string; dominantHex: string; wadaMatch: MatchResult }` in `src/navigation/types.ts:44-52`, **When** this story lands, **Then** the Result route type is extended to include a required `sourceUri: string` field (5th property, after `wadaMatch`), **And** `UnifiedCameraStackParamList.PostSave` is extended from `undefined` to `{ wadaColorId: string; capturedHex: string; categoryKey: WardrobeCategory }` with `WardrobeCategory` imported from `@/lib/wardrobeTypes`, **And** the comment above the type (currently lines 40-43) is updated to reflect the new contracts (PostSave no longer a placeholder), **And** `UnifiedCameraCaptureScreen.tsx:110` (`navigation.push("Result", { cutoutUri, dominantHex, wadaMatch })`) is updated to ALSO pass `sourceUri: photo.uri` (the `photo.uri` variable already exists on line 131-137 — plumb it through `runPipeline(sourceUri)` so it lives in closure for the `navigation.push` call).

3. **Given** the new `CategoryPickerSheet` component, **When** its file is inspected, **Then** it lives at `src/components/armario/CategoryPickerSheet.tsx` (path dictated by TD-6 — Story 14.12b imports from here), **And** its props interface is exactly:
    ```ts
    interface CategoryPickerSheetProps {
        visible: boolean;
        currentCategory?: WardrobeCategory;  // pre-selection for 14.12b reuse
        onConfirm: (category: WardrobeCategory) => void;
        onCancel: () => void;
        confirming?: boolean;  // disables Confirmar during save + shows ActivityIndicator
    }
    ```
    **And** the component is named-exported as `export function CategoryPickerSheet(...)` (no `export default`), **And** it does NOT call `saveCutoutAsWardrobeItem` itself — it is purely a selection sheet; persistence is the caller's responsibility (14.5 Result screen calls it; 14.12b just swaps `useMisLooksStore.updateItemCategory`). **And** internal `useState<WardrobeCategory | null>(currentCategory ?? null)` initializes the selected row; Confirmar is disabled (opacity 40%) until non-null. **And** the sheet supports EN + ES via `useTranslation`, not hard-coded copy.

4. **Given** the `CategoryPickerSheet` visual spec per UX-DR1 Screen 2B (lines 202-244 of `docs/planning/ux-design-epic-14.md`), **When** rendered, **Then**:
    - It uses React Native's built-in `Modal` (`animationType="slide"`, `transparent={true}`, `statusBarTranslucent`) with a dimmed backdrop `rgba(0,0,0,0.5)` — DO NOT introduce `@gorhom/bottom-sheet` (not in `package.json`; would pull in Reanimated worklet deps unnecessarily for this small sheet).
    - Inner sheet container: `backgroundColor: wadaTokens.bgPaper`, borderTopLeftRadius/borderTopRightRadius `24`, padding bottom equal to `useSafeAreaInsets().bottom + 16`, pinned to the bottom, approx 55% screen height (`maxHeight: Dimensions.get("window").height * 0.55`).
    - A 36pt wide / 4pt tall drag handle (`#d4ccc0` fill) centered at the top of the sheet.
    - A title Text *"¿Qué tipo de prenda es?"* (ES) / *"What type of garment is it?"* (EN) — NotoSerifJP_500Medium 22pt, `wadaTokens.textPrimary`, centered, 16pt top margin below handle.
    - 4 category rows, each 56pt tall, full-width with 20pt horizontal padding, `flex-row items-center gap-3`:
        - Left: icon at 24×24pt. Use `expo-symbols` `SymbolView` with SF Symbols fallback table: `top` → `"tshirt.fill"`, `bottom` → `"figure.stand"` (closest available SF Symbol for pants — Pencil TODO says "line 843 icon system SF Symbols vs custom line-art"; this story ships SF Symbols as the pragmatic default, per UX spec line 238 "use SF Symbols if matching glyphs exist"), `footwear` → `"shoe.fill"`, `accessory` → `"eyeglasses"`. `expo-symbols` is already in `package.json` (imported at `ArmarioPreviewScreen.tsx:7` — confirm via grep).
        - Middle: label Text in Inter_500Medium 16pt, `wadaTokens.textPrimary`.
        - Right: a checkmark icon (`checkmark.circle.fill`) visible ONLY when that row is the selected state, at `confirmedTone.hex`-ish but we use `wadaTokens.textPrimary` for neutrality.
    - Hairline divider (1pt `wadaTokens.hairline`) between rows.
    - Selected-row visual: background `rgba(45, 42, 38, 0.05)` (muted Wada paper tint) + 1.5pt leading vertical indicator on left edge in `wadaTokens.textPrimary` (a 1.5×56 absolute-positioned View).
    - Confirmar button: 48pt tall, full-width minus 24pt h-margin, 14pt radius, `backgroundColor: selected === null ? "rgba(45,42,38,0.25)" : wadaTokens.textPrimary` (disabled state = 25% dark; enabled = solid dark ink), label Text *"Confirmar"* / *"Confirm"* in Inter_500Medium 16pt, color `#faf7f2` (cream).
    - Confirming state (`confirming === true`): Confirmar shows a `<ActivityIndicator size="small" color="#faf7f2" />` in place of the label; the button is disabled; backdrop + sheet stay visible.
    - Dismissal: Pressable backdrop (not the sheet itself) calls `onCancel`; `Modal`'s `onRequestClose` also calls `onCancel` (Android-style back; harmless on iOS); swipe-down is NOT a hard requirement for this sheet (`Modal`'s iOS native slide-down works via the backdrop tap — no gesture handler needed).

5. **Given** the `CategoryPickerSheet` interactions, **When** exercised, **Then**:
    - Row tap: `hapticLight()` → `setSelected(category)` (NO auto-confirm; user must tap Confirmar).
    - Confirmar tap when a row is selected: `hapticMedium()` → `onConfirm(selected)`.
    - Confirmar tap when no selection (disabled state): pressable is `disabled={true}`; no haptic, no callback.
    - Backdrop tap: `onCancel()` (no persistence; parent closes the sheet).
    - VoiceOver: each row has `accessibilityRole="button"`, `accessibilityState={{ selected: isSelected }}`, `accessibilityLabel` = localized category label (e.g., *"Parte de arriba"*); Confirmar has `accessibilityRole="button"`, `accessibilityState={{ disabled: isDisabled, busy: confirming }}`, `accessibilityLabel` = *"Confirmar"* / *"Confirm"*; backdrop Pressable has `accessibilityLabel` = *"Cerrar hoja"* (ES) / *"Close sheet"* (EN) with `accessibilityRole="button"`.

6. **Given** the Result screen's primary-CTA handler is rewired per AC #1, **When** the user selects a category and taps Confirmar in the sheet, **Then** the following runs in `handleCategoryConfirm(category)` inside `UnifiedCameraResultScreen.tsx`:
    ```ts
    setConfirming(true);
    try {
        await saveCutoutAsWardrobeItem({ cutoutUri, sourceUri, isPremium, category });
        if (!isMounted.current) return;
        hapticRigid();
        setCategorySheetVisible(false);
        setConfirming(false);
        navigation.replace("PostSave", {
            wadaColorId: confirmedTone.id,
            capturedHex: dominantHex,
            categoryKey: category,
        });
    } catch (e) { /* AC #7 error branching */ }
    ```
    **And** `isMounted` guard ref follows the `ArmarioPreviewScreen.tsx:61-67` pattern, **And** `isPremium` is sourced from `usePremium()` (the hook from `@/contexts/PremiumContext`, precedent `ArmarioPreviewScreen.tsx:12`), **And** the `saveCutoutAsWardrobeItem` signature is consumed EXACTLY as frozen at `src/lib/armario/saveCutoutAsWardrobeItem.ts:57-59` with the 4-field args — do NOT add retries, timeouts, or defensive hydration (the helper handles it per its header doc lines 60-65), **And** on success `navigation.replace` (not push) is used so the back gesture from PostSave does NOT return the user to a stale Result screen they already committed on.

7. **Given** the save may throw a `WardrobePersistenceError` (from `@/lib/armario/wardrobeErrors`), **When** the catch block runs, **Then** the branching mirrors `ArmarioPreviewScreen.tsx:123-142` exactly, adapted:
    - `e.kind === "paywall"` → `setCategorySheetVisible(false)` + `setPaywallVisible(true)` + `setConfirming(false)` + EARLY return; nothing else runs. The sheet closes so the paywall has full-screen presence over Result (matches UX-DR1 line 249 "Sheet dismisses. Existing `PremiumPaywall` modal opens").
    - `e.kind === "diskFull"` → `setErrorCopy(t("unifiedCamera.save.errorDiskFull"))` + `setConfirming(false)` (sheet stays visible; error banner inline on Result — not inside sheet).
    - `e.kind === "encode"` → `setErrorCopy(t("unifiedCamera.save.errorEncode"))` + `setConfirming(false)`.
    - `e.kind === "move" || e.kind === "repoAdd"` → `setErrorCopy(t("unifiedCamera.save.errorSaveFailed"))` + `setConfirming(false)`.
    - Catch-all for future `WardrobePersistenceError` kinds → same `errorSaveFailed` copy.
    - Non-`WardrobePersistenceError` error → `setErrorCopy(t("unifiedCamera.save.errorSaveFailed"))` + `setConfirming(false)` + `if (__DEV__) console.warn("[UnifiedCameraResultScreen] save failed:", e)`.

    **And** an error banner View renders inside the Result screen's JSX (not inside the sheet, because the sheet closes on paywall anyway and we want a consistent error surface). The banner mirrors the `ArmarioPreviewScreen.tsx:295-328` shape: absolute-positioned `bottom: 200`, `backgroundColor: "rgba(0,0,0,0.82)"`, `borderRadius: 14`, padding 16pt, centered white Text + a "Dismiss" Pressable. Copy `unifiedCamera.save.errorDismiss` = *"Entendido"* / *"Got it"* (reusing the `armario.preview.errorDismiss` tone). `accessibilityRole="alert"`, `accessibilityLiveRegion="assertive"`.

8. **Given** the paywall flow, **When** a free user at 10/10 triggers the paywall from Confirmar, **Then** the flow uses the EXACT `usePremiumGate` + `PremiumPaywall` props pattern from `ArmarioPreviewScreen.tsx:55-56, 172-176, 331-341`:
    ```ts
    const favorites = useMisLooksStore((s) => s.favorites);
    const gate = usePremiumGate(favorites);
    // ... in JSX:
    <PremiumPaywall
        visible={paywallVisible}
        blockedCombination={undefined}
        favoriteCombinationIds={[...favorites]}
        priceString={gate.priceString}
        purchaseState={gate.purchaseState}
        errorMessage={gate.errorMessage}
        onPurchase={handlePurchase}
        onRestore={gate.handleRestore}
        onDismiss={handlePaywallDismiss}
    />
    ```
    **And** `handlePurchase = useCallback(() => { gate.handlePurchase(() => {}); }, [gate])` — the empty `toggleFavorite` arg matches the armario precedent (no combination to unlock), **And** `handlePaywallDismiss = useCallback(() => { setPaywallVisible(false); gate.handleDismiss(); }, [gate])` — on dismiss the user stays on Result with no persistence (UX-DR1 line 251 "On paywall dismiss/cancel → user returns to Result screen, garment not saved").

9. **Given** UX-DR1 line 252 "On paywall purchase success → re-trigger save silently", **When** the user completes an in-app purchase and the paywall auto-dismisses, **Then** the save is re-invoked silently with the user's originally-selected category. Implementation: capture the selected category in a ref (`pendingCategoryRef = useRef<WardrobeCategory | null>(null)`) when Confirmar fires; the paywall-dismiss handler checks `usePremium().isPremium` — if true AND `pendingCategoryRef.current !== null`, call `handleCategoryConfirm(pendingCategoryRef.current)` one more time; clear the ref. **And** if the user dismisses the paywall WITHOUT purchasing, `pendingCategoryRef.current` is cleared on dismiss (so a re-open of the sheet starts fresh). **And** this silent re-trigger is tested via a Jest case that flips `isPremium` from `false` → `true` across paywall dismiss and asserts a second `saveCutoutAsWardrobeItem` call.

10. **Given** the new `UnifiedCameraPostSaveScreen`, **When** the file is rewritten (it currently is a 14.3a placeholder at `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx` lines 1-19), **Then** it renders the "¿Ahora qué?" screen per UX-DR1 lines 254-271:
    - Outer container: `flex-1` on `wadaTokens.bgPaper` with SafeAreaView/`useSafeAreaInsets`.
    - Top section (centered vertically via `flex-1 justify-center`): a title Text in NotoSerifJP_500Medium 22pt *"Guardado en tu armario"* (ES) / *"Saved to your armario"* (EN) at `wadaTokens.textPrimary`, centered. Below it (8pt gap) a subtitle Text in Inter_400Regular 15pt *"como {categoryLabel}"* (ES) / *"as {categoryLabel}"* (EN) at `wadaTokens.textSecondary`, where `categoryLabel` is the localized category from route params (e.g., *"Parte de arriba"* for `categoryKey === "top"`). Copy keys: `unifiedCamera.postSave.title`, `unifiedCamera.postSave.subtitle` (interpolated `{{categoryLabel}}`).
    - Bottom section (pinned above safe area, 32pt padding bottom above `insets.bottom`):
        - Primary CTA Pressable: 56pt tall, full-width minus 24pt h-margin, 14pt radius, `backgroundColor: wadaTokens.textPrimary` (dark ink), label Text *"Ver combinaciones con {wadaName}"* in Inter_500Medium 16pt, color `#faf7f2` (cream). `wadaName` = `getColor(wadaColorId)?.nameEn ?? ""` (sourced via `src/data/colorIndex::getColor`). `testID="unified-camera-postsave-primary-cta"`, `accessibilityRole="button"`, `accessibilityLabel` interpolated with `wadaName`.
        - Secondary CTA Pressable: 48pt tall, full-width minus 24pt, 12pt top margin, ghost/text-only (NO background, optional 1pt `wadaTokens.hairline` border for clarity), label *"Volver a Mis Looks"* / *"Back to Mis Looks"* in Inter_500Medium 16pt, color `wadaTokens.textPrimary`. `testID="unified-camera-postsave-secondary-cta"`, `accessibilityRole="button"`.
    - Copy keys: `unifiedCamera.postSave.primaryCta` (interpolated `{{wadaName}}`), `unifiedCamera.postSave.primaryCtaA11y` (interpolated `{{wadaName}}`), `unifiedCamera.postSave.secondaryCta`, `unifiedCamera.postSave.secondaryCtaA11y`.

11. **Given** the PostSave interactions, **When** the user taps either CTA, **Then**:
    - Primary tap: `hapticLight()` → cross-navigator `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", params: { colorId: wadaColorId, capturedHex } } } as never)` — IDENTICAL pattern to Result's secondary link (Story 14.4 AC #8 / `UnifiedCameraResultScreen.tsx:117-128`), just from PostSave.
    - Secondary tap: `hapticLight()` → `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Main", { screen: "FavoritesTab" } as never)` — the `FavoritesTab` name is still the current name (Story 14.7 rename is not yet merged; do NOT anticipate `MisLooksTab`). When 14.7 lands, a one-line update changes `"FavoritesTab"` to the new name everywhere consistently.

12. **Given** all new i18n keys land under a single `unifiedCamera.categorySheet.*`, `unifiedCamera.save.*`, and `unifiedCamera.postSave.*` block in both `src/i18n/locales/es.json` and `src/i18n/locales/en.json`, **When** the JSON is inspected after merge, **Then** these EXACTLY-NAMED keys exist (no extras — avoid the Epic 13 over-expansion pattern; Story 14.4 set the precedent of lean key sets):
    - **`unifiedCamera.categorySheet`:**
        - `title` → *"¿Qué tipo de prenda es?"* / *"What type of garment is it?"*
        - `rowTop` → *"Parte de arriba"* / *"Top"*
        - `rowBottom` → *"Parte de abajo"* / *"Bottom"*
        - `rowFootwear` → *"Calzado"* / *"Footwear"*
        - `rowAccessory` → *"Accesorio"* / *"Accessory"*
        - `confirm` → *"Confirmar"* / *"Confirm"*
        - `confirmA11yLabel` → *"Confirmar"* / *"Confirm"*
        - `closeSheetA11y` → *"Cerrar hoja"* / *"Close sheet"*
        - `rowA11yHint` → *"Tócalo dos veces para seleccionar esta categoría"* / *"Double-tap to select this category"*
    - **`unifiedCamera.save`:**
        - `errorDiskFull` → *"Tu dispositivo se quedó sin espacio"* / *"Your device is out of space"*
        - `errorEncode` → *"No pudimos procesar la foto. Inténtalo de nuevo."* / *"Couldn't process the photo. Please try again."*
        - `errorSaveFailed` → *"No pudimos guardar la prenda. Inténtalo de nuevo."* / *"Couldn't save the garment. Please try again."*
        - `errorDismiss` → *"Entendido"* / *"Got it"*
    - **`unifiedCamera.postSave`:**
        - `title` → *"Guardado en tu armario"* / *"Saved to your armario"*
        - `subtitle` → *"como {{categoryLabel}}"* / *"as {{categoryLabel}}"*
        - `primaryCta` → *"Ver combinaciones con {{wadaName}}"* / *"See combinations with {{wadaName}}"*
        - `primaryCtaA11y` → *"Ver combinaciones con {{wadaName}}"* / *"See combinations with {{wadaName}}"*
        - `secondaryCta` → *"Volver a Mis Looks"* / *"Back to Mis Looks"*
        - `secondaryCtaA11y` → *"Volver a Mis Looks"* / *"Back to Mis Looks"*

    **And** no existing `unifiedCamera.capture.*` or `unifiedCamera.result.*` key is modified (Stories 14.3b + 14.4 keys are frozen), **And** both locale files remain valid JSON with tab indentation matching the existing file style.

13. **Given** the Jest test surface after this story merges, **When** `pnpm test` runs, **Then** the following NEW test files exist:
    - `src/components/armario/CategoryPickerSheet.test.tsx` — 6–8 cases:
        - renders 4 rows with localized labels + icons
        - Confirmar is disabled when no selection
        - row tap selects + fires `hapticLight` + does NOT fire `onConfirm`
        - selected row shows the selected visual (border indicator + checkmark)
        - Confirmar tap with selection fires `hapticMedium` + `onConfirm(category)`
        - backdrop tap fires `onCancel`
        - `currentCategory` prop pre-selects the matching row
        - `confirming` prop disables Confirmar + shows ActivityIndicator
    - `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.test.tsx` — REWRITE from its current 1-case placeholder (`unified-camera-postsave-placeholder`) to 4–5 cases:
        - renders title + subtitle with interpolated category label for each of the 4 categories
        - renders primary CTA with interpolated Wada name from `getColor(wadaColorId)`
        - primary CTA tap fires `hapticLight` + cross-navigator `getParent().navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", params: { colorId, capturedHex } } })` (assert exact params)
        - secondary CTA tap fires `hapticLight` + cross-navigator `getParent().navigate("Main", { screen: "FavoritesTab" })`
    - `src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx` — EXTEND the existing Story 14.4 test (currently 12 cases) with 4–6 NEW cases covering the 14.5 wiring:
        - primary CTA tap opens `CategoryPickerSheet` (sheet `visible` prop true) + fires `hapticMedium` + does NOT call `navigation.push("PostSave")` anymore (asserts `mockLocalPush` NOT called for "PostSave")
        - sheet cancel closes sheet without save (no `saveCutoutAsWardrobeItem` call)
        - sheet confirm on success: calls `saveCutoutAsWardrobeItem` with exact args `{ cutoutUri, sourceUri, isPremium: false, category }` (mock `isPremium` via `usePremium` mock) → asserts `hapticRigid` + `navigation.replace("PostSave", { wadaColorId, capturedHex, categoryKey })` with exact params (mock `@/lib/armario/saveCutoutAsWardrobeItem`)
        - sheet confirm on paywall error: mock save to reject with `WardrobePersistenceError("paywall", ...)` → asserts sheet closes + paywall `visible` prop true
        - sheet confirm on diskFull error: mock save to reject with `WardrobePersistenceError("diskFull", ...)` → asserts error banner visible with "out of space" copy
        - paywall dismiss-after-purchase with `isPremium` now true + pendingCategory set → asserts a second `saveCutoutAsWardrobeItem` call (silent re-trigger per UX-DR1 line 252)

    **And** the mocks use the same closure-based deferred-lookup pattern as `UnifiedCameraResultScreen.test.tsx` from 14.4 (per `feedback_jest_native_module_mock.md`), **And** test count delta target: **+18 to +26 net** vs. the 14.4 done baseline (793 passing / 60 pre-existing / 0 new failures); minimum floor is **811 passing / 60 pre-existing / 0 new failures**.

14. **Given** the quality gates, **When** `npx tsc --noEmit`, `pnpm lint`, `pnpm test` run on this story branch, **Then** all pass green, **And** Biome is clean (tabs, double quotes, named exports, no `export default`, `organize-imports` applied), **And** zero new test skips are introduced (NFR6), **And** the pre-existing 60 failures (48 `OutfitVisualizer.getState` + 12 `i18n.test.ts` detectLanguage) stay exactly at 60 — this story does NOT touch those surfaces.

15. **Given** NO native module changes in THIS story (pure JS/TSX + i18n + tests), **When** the dev-agent prepares the build, **Then** `npx expo run:ios` is NOT required — Metro reload (`pnpm start --clear` per `feedback_simulator_reset.md`) suffices. **And** on-device smoke (optional but recommended before marking review → done): (a) mid-tone garment capture → Result → tap "Guardar" → category sheet opens → pick "Parte de arriba" → Confirmar → PostSave lands showing *"Guardado en tu armario como Parte de arriba"* + primary CTA highlighting the detected Wada tone name → tap primary → land on `Combinations` for that tone; (b) paywall path: manually set the test device to free + 10 items in armario, run the same flow, verify the paywall sheet appears after Confirmar and the garment is NOT saved on dismiss. These on-device checks are NOT AC-blocking — they are release-gate polish.

16. **Given** TD-6 (Category editable in v1.4.0 — Story 14.12b reuses `CategoryPickerSheet`), **When** the component is exported, **Then** it is importable from `@/components/armario/CategoryPickerSheet` via a named export (no `export default`, no barrel index added), **And** the `currentCategory?: WardrobeCategory` prop is present from day one so 14.12b can wire it without a prop-addition commit, **And** the `onConfirm(category)` callback shape matches what 14.12b will need — it receives the new `WardrobeCategory` and delegates persistence to the caller (14.12b will call `useMisLooksStore.updateItemCategory(id, category)` from its onConfirm), **And** the sheet does NOT assume a specific caller — it does NOT import `saveCutoutAsWardrobeItem`, `useMisLooksStore`, or `wardrobeRepo` anywhere in its file. The component is pure-presentation + selection state only.

17. **Given** the `ArmarioPreviewScreen.tsx` still exists and represents the Epic 13 in-Ficha-Wada slot-assignment flow (preserved per TD-2), **When** this story merges, **Then** it is UNCHANGED byte-for-byte: `ArmarioPreviewScreen` still hard-codes `category: "top"` at line 96 (the TD-7 default), still calls `saveCutoutAsWardrobeItem` with the same args, still surfaces the same `PremiumPaywall`. This story is surgical — it only edits the UNIFIED CAMERA flow files (Result + PostSave + Capture route-params line + nav types + new CategoryPickerSheet component + i18n), **And** the Armario flow tests `src/screens/armario/ArmarioPreviewScreen.test.tsx` remain green without a single test line modified, **And** `grep "category:" src/screens/armario/ArmarioPreviewScreen.tsx` returns the same `"top"` literal.

## Tasks / Subtasks

- [x] **Task 1: Route-param plumbing + Capture → Result `sourceUri` propagation** (AC: #2)
  - [x] 1.1 Edit `src/navigation/types.ts` — add `sourceUri: string` to `UnifiedCameraStackParamList.Result` (5th field after `wadaMatch`). Change `PostSave` from `undefined` to `{ wadaColorId: string; capturedHex: string; categoryKey: WardrobeCategory }`. Import `WardrobeCategory` from `@/lib/wardrobeTypes`. Update the comment block above the type (currently lines 40-43) to note that PostSave now carries params per Story 14.5.
  - [x] 1.2 Edit `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx` — plumb `sourceUri` through `runPipeline(sourceUri)` to the `navigation.push("Result", {...})` call at line 110. The `photo.uri` variable already exists in `takePicture` (line 131-137); pass it as a second `runPipeline` arg or close over it in the call. Add `sourceUri` as the 4th key in the `push` payload.
  - [x] 1.3 Update `UnifiedCameraCaptureScreen.test.tsx` — the existing navigation assertion (~line 45-75, however it's written in the 14.3b test) that checks `navigation.push("Result", ...)` now asserts a 4th `sourceUri` field.

- [x] **Task 2: `CategoryPickerSheet` component + co-located test** (AC: #3, #4, #5, #16)
  - [x] 2.1 Create `src/components/armario/CategoryPickerSheet.tsx` with the props interface from AC #3 (`visible`, `currentCategory?`, `onConfirm`, `onCancel`, `confirming?`). Named export. Modal-based bottom sheet per AC #4 visual spec. Use `expo-symbols.SymbolView` for icons (already imported at `ArmarioPreviewScreen.tsx:7`).
  - [x] 2.2 Internal state: `useState<WardrobeCategory | null>(currentCategory ?? null)`. Reset on visibility toggle via `useEffect` watching `visible` + `currentCategory`.
  - [x] 2.3 Row interactions: `hapticLight` + set selected (no auto-confirm). Confirmar: `hapticMedium` + `onConfirm(selected)`. Backdrop / `onRequestClose`: `onCancel()`.
  - [x] 2.4 Accessibility: every row `accessibilityRole="button"` + `accessibilityState={{ selected }}`, Confirmar `accessibilityState={{ disabled, busy: confirming }}`, backdrop `accessibilityLabel` localized.
  - [x] 2.5 Create `src/components/armario/CategoryPickerSheet.test.tsx` — 8 cases (exceeds floor of 6).

- [x] **Task 3: Rewire Result screen — open sheet, save, paywall, error banner, silent re-trigger** (AC: #1, #6, #7, #8, #9, #17)
  - [x] 3.1 Edit `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` — remove `navigation.push("PostSave")` stub + `__DEV__ console.warn` from `handlePrimaryCta`. Replace with `setCategorySheetVisible(true)`. Keep `hapticMedium` FIRST.
  - [x] 3.2 Add new local state: `categorySheetVisible`, `paywallVisible`, `confirming`, `errorCopy`. Add `isMounted` ref + cleanup `useEffect` per ArmarioPreview precedent.
  - [x] 3.3 Add `usePremium` + `usePremiumGate` + `useMisLooksStore((s) => s.favorites)` hooks near the top of the component (mirror `ArmarioPreviewScreen.tsx:54-56`). Also read `sourceUri` from `route.params`.
  - [x] 3.4 Implement `handleCategoryConfirm(category)` per AC #6 (full try/catch tree). Implement `handleSheetCancel()`. Implement `handlePaywallDismiss` + `handlePurchase` per AC #8.
  - [x] 3.5 Wire AC #9 silent re-trigger via `pendingCategoryRef` + `useEffect` watching `isPremium` + `paywallVisible` + `confirming`. The effect also clears the ref when `!isPremium && !paywallVisible && !confirming` so a dismiss-without-purchase does not leave a dangling pending save.
  - [x] 3.6 Add `<CategoryPickerSheet>` + `<PremiumPaywall>` + error-banner JSX at the end of the outer View tree.
  - [x] 3.7 Extend `UnifiedCameraResultScreen.test.tsx` with 6 new cases covering the 14.5 wiring (sheet open, cancel, success, paywall error, diskFull error, silent re-trigger).

- [x] **Task 4: Rewrite `UnifiedCameraPostSaveScreen` + rewrite its test** (AC: #10, #11)
  - [x] 4.1 Replaced the 14.3a placeholder with the real "¿Ahora qué?" screen: typed route params, `getColor` for Wada name, `categoryLabelKey` switch mapping `categoryKey` → localized label.
  - [x] 4.2 Wire primary + secondary CTA handlers using `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()` cross-navigator pattern.
  - [x] 4.3 Rewrote `UnifiedCameraPostSaveScreen.test.tsx` to 7 cases (`it.each` over 4 categories + 3 more).

- [x] **Task 5: i18n keys (ES + EN) + quality gates** (AC: #12, #14, #15)
  - [x] 5.1 Added `unifiedCamera.categorySheet.*` + `unifiedCamera.save.*` + `unifiedCamera.postSave.*` blocks to `src/i18n/locales/en.json` and `src/i18n/locales/es.json` with the exact keys from AC #12.
  - [x] 5.2 `npx tsc --noEmit` → clean.
  - [x] 5.3 `pnpm biome check --write src` → clean (no warnings).
  - [x] 5.4 `pnpm test` → 813 passing / 60 pre-existing / 0 new failures / 0 new skips vs. 14.4's 793/60 baseline → +20 net (inside +18..+26 target).
  - [ ] 5.5 (Optional) On-device smoke — deferred to release-gate polish per AC #15 (non-blocking).

## Dev Notes

### Architecture context (Epic 14 — Save flow closing the unified camera loop)

- **Branch:** create `story/14-5-camera-save-flow-category-selector-paywall` off `epic-14` at the commit where 14.4 merged (`0fba31b` per sprint-status `Recent commits`).
- **Target version:** v1.4.0 (launch blocker). This story closes the unified-camera golden path: Capture (14.3b) → Result (14.4) → **Category sheet + save + paywall + PostSave (THIS STORY)** → Combinations OR FavoritesTab.
- **Dependency:** Story 14.1 (required `category` field on `WardrobeItem`) + Story 14.4 (Result screen UX-DR1 UI + primary-CTA stub this story replaces). Neither needs any further work — their outputs are stable and frozen.
- **Consumer:** Story 14.12b imports the `CategoryPickerSheet` exported by this story (per TD-6). Do NOT fork the component later; it must be built reusable from day one.

### Save-path pipeline (this story's scope end-to-end)

```
UnifiedCameraResultScreen (Story 14.4, extended here)
  ├─ state: confirmedTone (from 14.4), cutoutUri, dominantHex, sourceUri (NEW route param)
  ├─ user taps primary CTA "Guardar en mi armario"
  │    └─ hapticMedium → setCategorySheetVisible(true)
  │
  └─ <CategoryPickerSheet visible={categorySheetVisible} ...>
         │
         ├─ user taps row → hapticLight → setSelected
         ├─ user taps Confirmar → hapticMedium → onConfirm(category)
         │    └─ Result's handleCategoryConfirm(category):
         │         ├─ pendingCategoryRef.current = category
         │         ├─ setConfirming(true)
         │         ├─ saveCutoutAsWardrobeItem({ cutoutUri, sourceUri, isPremium, category })
         │         │    ├─ SUCCESS → hapticRigid → navigation.replace("PostSave", {
         │         │    │              wadaColorId: confirmedTone.id,
         │         │    │              capturedHex: dominantHex,
         │         │    │              categoryKey: category
         │         │    │            })
         │         │    │
         │         │    └─ THROW WardrobePersistenceError:
         │         │         ├─ "paywall" → setCategorySheetVisible(false)
         │         │         │              + setPaywallVisible(true)
         │         │         │              + (useEffect watches isPremium; fires silent re-trigger on purchase)
         │         │         │
         │         │         └─ "diskFull"/"encode"/"move"/"repoAdd"
         │         │              → setErrorCopy(t(...))  (sheet stays visible)
         │         │
         │         └─ setConfirming(false)
         │
         └─ user taps backdrop → onCancel → setCategorySheetVisible(false)

UnifiedCameraPostSaveScreen (NEW in 14.5)
  ├─ route.params = { wadaColorId, capturedHex, categoryKey }
  ├─ wadaName = getColor(wadaColorId)?.nameEn
  ├─ categoryLabel = t(`unifiedCamera.categorySheet.row${capitalize(categoryKey)}`)
  ├─ render title + subtitle + 2 CTAs
  ├─ primary tap: rootNav.navigate("Main", { screen: "ColorsTab",
  │                  params: { screen: "Combinations",
  │                  params: { colorId: wadaColorId, capturedHex } } })
  └─ secondary tap: rootNav.navigate("Main", { screen: "FavoritesTab" })
```

### Why `navigation.replace` (not `push`) to PostSave

Using `push` would leave Result in the back stack; a back gesture on PostSave would land on Result showing a still-visible "Guardar en mi armario" CTA for a garment already saved, which is confusing (and would allow a double-save if the user re-taps). `replace` pops Result off and replaces with PostSave — correct UX. Precedent: the armario flow uses `parent.goBack()` to dismiss the entire modal after save (`ArmarioPreviewScreen.tsx:113`); we don't want that here because we want the user to land on PostSave, NOT back on their previous tab. So `replace` is the middle ground.

### Out of scope THIS story

- ❌ Edits to `src/lib/armario/saveCutoutAsWardrobeItem.ts` — the helper's signature is frozen; this story consumes it as-is.
- ❌ Edits to `src/lib/wardrobeRepo.ts`, `src/stores/misLooksStore.ts`, `src/lib/wardrobeTypes.ts` (beyond the type-import for route params).
- ❌ Edits to `src/screens/armario/ArmarioCaptureScreen.tsx` / `ArmarioPreviewScreen.tsx` / `ArmarioPicker*` — Epic 13 armario flow stays byte-for-byte unchanged (AC #17).
- ❌ Edits to `src/components/PremiumPaywall.tsx` — reuse the component as-is (UX-DR1 line 250 "no redesign").
- ❌ Edits to `UnifiedCameraResultScreen.tsx` beyond the 6 narrowly-scoped changes enumerated in AC #1.
- ❌ Changes to `src/data/colorIndex.ts` — `getColor` / `getCombinations` consumed as-is.
- ❌ Changes to `src/components/WadaHeader.tsx` — PostSave inlines its own name treatment rather than bloating WadaHeader.
- ❌ Tab rename to "MisLooksTab" — Story 14.7 does that; AC #11 explicitly uses `"FavoritesTab"` for now.
- ❌ Cross-nav target "MisLooksTab" for the secondary PostSave CTA — it navigates to `FavoritesTab` for now.
- ❌ Auto-save on assignment (Story 14.8) — this story does NOT touch Mis Looks / favorites semantics.
- ❌ Toast animation on save (the armario flow uses `hapticRigid` + screen-replace; we match that — no extra toast needed because PostSave itself says "Guardado en tu armario").
- ❌ `@gorhom/bottom-sheet` — not installed, not adding. RN Modal + absolute-positioned View is sufficient for the half-sheet and respects the "no new deps unless justified" rule.
- ❌ Edits to the secondary "ver combinaciones sin guardar" link on Result — its cross-navigator hop is 14.4's AC #8 and remains untouched.

### Why a Modal-based sheet (not a nav screen)

Presenting the category sheet as a navigation screen (e.g., `CategorySheet` as a new route in `UnifiedCameraStackParamList`) would require the `presentation: "transparentModal"` option and a back-stack entry that the user could swipe back to. The sheet is a transient selection UI — it should not live in the nav stack. A plain RN `Modal` is the lightweight, correct primitive. Precedent: the S3 picker in Epic 13 (`ArmarioPickerScreen.tsx`) uses `Modal` + `Animated.View` + `Gesture.Pan` for a similar purpose — we match the shape (sans pan gesture since the backdrop-tap dismiss is sufficient for this sheet).

### Silent-re-trigger-on-purchase mechanics (AC #9)

UX-DR1 line 252 says *"On paywall purchase success → re-trigger save silently."* The simplest implementation is a `useEffect` that watches `isPremium`:

```ts
const { isPremium } = usePremium();
const pendingCategoryRef = useRef<WardrobeCategory | null>(null);

useEffect(() => {
    // Fires only when isPremium FLIPS to true AND we have a pending category.
    if (isPremium && pendingCategoryRef.current !== null && paywallVisible === false) {
        const cat = pendingCategoryRef.current;
        pendingCategoryRef.current = null;
        void handleCategoryConfirm(cat);
    }
}, [isPremium, paywallVisible]);
```

The `paywallVisible === false` guard prevents firing mid-paywall (paywall dismisses AFTER purchase success via `usePremiumGate.handlePurchase`'s internal `setPaywallVisible(false)`). The ref is cleared BEFORE the re-call to avoid infinite loops if the second save also throws paywall (shouldn't — we just became premium — but defensive).

Caveat: `handlePaywallDismiss` (non-purchase close) should ALSO clear `pendingCategoryRef.current = null` so a dismiss-without-purchase doesn't keep the pending state around for the next `isPremium` flip (unlikely but tidier).

### `usePremiumGate` consumption notes

The hook takes `favorites: Set<string>` (from `useMisLooksStore`). In the Result screen context there is no "blocked combination" because we're gating on wardrobe items (not favorites) — pass `blockedCombination={undefined}` to `PremiumPaywall` per `ArmarioPreviewScreen.tsx:333`. The hook's `handlePurchase` takes a `toggleFavorite` fn — pass an empty `() => {}` arg (same precedent). The paywall purchase success clears `paywallVisible` inside the hook itself; consumers just observe the state flip.

### `expo-symbols` SF Symbol names (iOS 16+)

- `top` → `"tshirt.fill"` (iOS 17+ — verify with `SymbolView` availability; fallback to `"tshirt"` un-filled or 🥼 emoji if rendering fails).
- `bottom` → The SF Symbol for pants is `"pants"` (iOS 17+) or `"figure.stand"` (broader availability). Pick `"figure.stand"` for now; revisit in Pencil iteration.
- `footwear` → `"shoe.fill"` (iOS 16+).
- `accessory` → `"eyeglasses"` (iOS 13+, safe baseline).
- Color: `#2d2a26` (dark pergamino ink from the Story 14.4 constants — keep palette-consistent).
- Size: `SymbolView` defaults to `size={24}` width/height via `style={{ width: 24, height: 24 }}`.
- Do NOT introduce a custom icon library (`react-native-vector-icons`, `phosphor`, etc.) — `expo-symbols` is already in the project and works on iOS natively.

### Error-banner lifecycle

The banner is Result-scoped, not sheet-scoped — the sheet dismisses on paywall and the error would disappear with it, which is wrong. Keeping the banner on Result ensures the user sees the error whether the sheet is still open (diskFull case) or auto-closed (paywall case). Auto-dismiss: omit. User dismisses via the "Entendido" Pressable. Precedent: `ArmarioPreviewScreen.tsx:295-328` does the same manual-dismiss — no timer.

### Cross-navigator nav target caveat — `FavoritesTab` vs `MisLooksTab`

The tab is currently named `FavoritesTab` at `src/navigation/types.ts:27` + `TabNavigator.tsx:22-23`. Story 14.7 renames it; that story is sprint-scheduled AFTER 14.5 per the epic's dev order. Use `"FavoritesTab"` in this story's AC #11 secondary CTA + the test mocks. Story 14.7 will do a find-and-replace across the whole codebase; this story's `"FavoritesTab"` reference is one of many consumers that will update consistently in 14.7.

### Category label mapping (PostSave subtitle)

```ts
function categoryLabelKey(categoryKey: WardrobeCategory): string {
    switch (categoryKey) {
        case "top": return "unifiedCamera.categorySheet.rowTop";
        case "bottom": return "unifiedCamera.categorySheet.rowBottom";
        case "footwear": return "unifiedCamera.categorySheet.rowFootwear";
        case "accessory": return "unifiedCamera.categorySheet.rowAccessory";
    }
}
// ... in PostSave render:
const categoryLabel = t(categoryLabelKey(categoryKey));
t("unifiedCamera.postSave.subtitle", { categoryLabel })
// → "como Parte de arriba" / "as Top"
```

Exhaustive switch; TypeScript will error on a missing case if `WardrobeCategory` ever gains a 5th value. Prefer `switch` over an `if/else` chain here because the dispatch is pure-mapping with no early returns (Biome will NOT flag — no `noSwitchDeclarations` concern).

### Known risks to guard against

- **`saveCutoutAsWardrobeItem` is async and the screen may unmount mid-save** — mirror `ArmarioPreviewScreen.tsx:61-67`'s `isMounted` ref + cleanup effect. Check `isMounted.current` before EVERY state setter in the success + catch paths. Do NOT `setConfirming(true)` again after unmount (React will warn).
- **Silent re-trigger can double-fire if the paywall purchase callback races the `useEffect`** — clear `pendingCategoryRef` BEFORE the re-call, not after. The test asserts the callback fires exactly ONCE on purchase.
- **`useMisLooksStore.favorites` is the ONLY state `usePremiumGate` needs** — don't pass the entire store. The `(s) => s.favorites` selector avoids re-renders on `items`/`assignments` updates.
- **`WardrobePersistenceError` import path** — it's at `src/lib/armario/wardrobeErrors.ts`, NOT `src/lib/wardrobeErrors.ts`. Use `@/lib/armario/wardrobeErrors`.
- **`WardrobeCategory` import path** — `@/lib/wardrobeTypes` (not `@/data/types`). Precedent: `saveCutoutAsWardrobeItem.ts:6-8`.
- **`getColor` vs `getCombinations`** — PostSave needs the Wada NAME, use `getColor(wadaColorId)` (not `getCombinations`). `getColor` returns `Color | undefined`; guard with `?? ""` for the name interpolation, though in practice `wadaColorId` is always valid because it came from the Wada pipeline.
- **`Modal` on iOS renders over the StatusBar by default** — set `statusBarTranslucent` on the sheet's Modal so the dim backdrop extends to the notch area (matches the existing paywall modal behavior).
- **Test mock for `usePremium`** — don't import the real context. Mock with `jest.mock("@/contexts/PremiumContext", () => ({ usePremium: () => ({ isPremium: false, setPaywallDismissedThisSession: jest.fn(), priceString: "4,99 €", purchase: jest.fn(), restore: jest.fn() }) }))`. For the "silent re-trigger after purchase" test, use `jest.mock` with a mutable state object and update `isPremium` mid-test (or use `jest.mocked(usePremium).mockReturnValueOnce(...)`).
- **Test mock for `saveCutoutAsWardrobeItem`** — `jest.mock("@/lib/armario/saveCutoutAsWardrobeItem", () => ({ saveCutoutAsWardrobeItem: jest.fn() }))`. For error cases, `mockRejectedValueOnce(new WardrobePersistenceError("paywall", "limit reached"))` — DO import the real `WardrobePersistenceError` class for instanceOf to match.
- **Test mock for `expo-symbols`** — at the current state, the repo likely has a global or co-located mock. Check `__mocks__/expo-symbols.ts` or equivalent. If missing, add a minimal mock: `jest.mock("expo-symbols", () => ({ SymbolView: () => null }))` at the top of `CategoryPickerSheet.test.tsx`.
- **JSON tab indentation in locales** — Biome enforces tabs. When adding keys, match the existing tab-indent style. Biome's `--write` will auto-fix if wrong.
- **NativeWind dynamic background** — the Confirmar button's `backgroundColor` depends on `selected === null`. Use `style={{ backgroundColor: selected === null ? "..." : "..." }}` (dynamic = inline style per CLAUDE.md rule). Keep layout (`h-12 w-full rounded-[14px]`) in `className`.
- **Avoid `export default`** — the new component + screen are named exports per CLAUDE.md. Test files use `import { CategoryPickerSheet } from "@/components/armario/CategoryPickerSheet"`.
- **Test count drift: `+18 to +26 net` target** — the floor is +18 (811 passing). If the final count drifts HIGHER than +26, that's acceptable as long as no regressions. If LOWER than +18, investigate missing cases (probably CategoryPickerSheet tests not registered).

### File layout (touched by this story)

```
src/
├── navigation/
│   └── types.ts                                         # EDIT — Result.sourceUri, PostSave params
├── screens/unifiedCamera/
│   ├── UnifiedCameraCaptureScreen.tsx                   # EDIT — pass sourceUri to navigation.push
│   ├── UnifiedCameraCaptureScreen.test.tsx              # EDIT — assert sourceUri in push payload
│   ├── UnifiedCameraResultScreen.tsx                    # EDIT — primary CTA opens sheet; save flow; paywall; error banner; silent re-trigger; reads sourceUri from route
│   ├── UnifiedCameraResultScreen.test.tsx               # EXTEND — +4..+6 cases for 14.5 wiring
│   ├── UnifiedCameraPostSaveScreen.tsx                  # REWRITE — real "¿Ahora qué?" screen
│   └── UnifiedCameraPostSaveScreen.test.tsx             # REWRITE — 4..5 real cases
├── components/armario/
│   ├── CategoryPickerSheet.tsx                          # NEW — reusable for 14.12b
│   └── CategoryPickerSheet.test.tsx                     # NEW — 6..8 cases
└── i18n/locales/
    ├── es.json                                          # EDIT — add unifiedCamera.categorySheet.* + save.* + postSave.*
    └── en.json                                          # EDIT — same three blocks in EN

UNCHANGED (verified this story per AC #17):
- src/lib/armario/saveCutoutAsWardrobeItem.ts            # signature frozen; consumed as-is
- src/lib/armario/wardrobeErrors.ts                      # WardrobePersistenceError reused
- src/lib/wardrobeRepo.ts                                # addItem signature frozen
- src/lib/wardrobeTypes.ts                               # WardrobeCategory union reused
- src/stores/misLooksStore.ts                            # favorites selector consumed as-is
- src/contexts/PremiumContext.tsx                        # usePremium consumed as-is
- src/hooks/usePremiumGate.ts                            # consumed as-is
- src/components/PremiumPaywall.tsx                      # reused; no redesign (UX-DR1 line 250)
- src/screens/armario/ArmarioPreviewScreen.tsx           # Epic 13 in-Ficha-Wada flow preserved
- src/screens/armario/ArmarioCaptureScreen.tsx           # Epic 13 preserved (TD-2)
- src/navigation/UnifiedCameraStack.tsx                  # stack registration unchanged
- src/navigation/TabNavigator.tsx                        # "FavoritesTab" name unchanged (14.7 renames)
- src/data/colorIndex.ts                                 # getColor consumed as-is
- src/lib/color.ts                                       # relativeLuminance unchanged
- src/components/WadaHeader.tsx                          # not retrofitted for PostSave
- modules/background-removal/**                          # Swift/TS frozen
```

No `tsconfig.json`, `jest.config.js`, `babel.config.js`, `metro.config.js`, `package.json` dependency, or `App.tsx` changes this story.

### Patterns to follow (MUST)

- **Function declarations with named exports** — never `export default` (CLAUDE.md).
- **NativeWind `className` for static styles**; `style={{}}` only for dynamic values (selected-row tint, Confirmar disabled/enabled bg, PostSave CTA bg if needed).
- **Props interface required** — `CategoryPickerSheetProps` in `CategoryPickerSheet.tsx`; screen components use `Record<string, never>` (mirroring 14.4 precedent).
- **Biome:** tabs, double quotes, run `pnpm biome check --write src` before commit.
- **Tests co-located** — `.test.tsx` next to `.tsx`.
- **Haptics exclusively through `lib/haptics.ts`** — `hapticMedium` on primary-CTA tap (AC #1) + Confirmar tap (AC #5); `hapticLight` on row-select + PostSave CTA taps; `hapticRigid` on save success (mirrors `ArmarioPreviewScreen.tsx:99`).
- **Respect `useReducedMotion`** — Modal slide-in animation is iOS-native and does not require extra gating; no new Animated fades are needed in this story.
- **Accessibility:** every new interactive node gets `testID`, `accessibilityLabel`, `accessibilityRole`, ≥44pt hit area (sheet rows are 56pt tall — clears). Use `accessibilityLiveRegion="assertive"` on the error banner.
- **No analytics / telemetry** — NFR8 / `feedback_no_analytics.md`.
- **Defer Jest mock lookups through a closure** — `feedback_jest_native_module_mock.md` (navigation + route mocks in this story follow the same pattern as 14.4).
- **i18n keys under `unifiedCamera.*`** — do NOT spill into `colorCapture.*` / `armario.*` / `Visualizer`. Semantic isolation per the 14.4 Dev Notes precedent.
- **TD-6 reusability** — `CategoryPickerSheet` must work standalone for 14.12b. Do NOT assume a specific caller; do NOT import any store/repo in the component file.

### References

- Epic source of truth — [docs/planning/epic-14.md §Story 14.5](../../docs/planning/epic-14.md#story-145-camera-save-flow-with-category-selector--paywall-gate) (lines 472-513)
- UX-DR1 Category Sheet — [docs/planning/ux-design-epic-14.md §UX-DR1 Screen 2B](../../docs/planning/ux-design-epic-14.md#screen-2b--category-sheet-modal-opens-on-tap-guardar) (lines 202-277)
- UX-DR1 Post-save screen — same doc lines 254-271
- Haptics contract — [docs/planning/ux-design-epic-14.md §Haptics contract](../../docs/planning/ux-design-epic-14.md#haptics-contract-epic-14-surfaces) (lines 787-803)
- Copy glossary — [docs/planning/ux-design-epic-14.md §Copy Glossary](../../docs/planning/ux-design-epic-14.md#copy-glossary-en--es) (lines 740-770)
- Prior Story 14.4 (Result UI + primary-CTA stub this story rewires) — [./14-4-camera-result-screen-ui.md](./14-4-camera-result-screen-ui.md)
- Prior Story 14.3b (pipeline + route-params contract) — [./14-3b-unified-camera-pipeline-swift-module.md](./14-3b-unified-camera-pipeline-swift-module.md)
- Prior Story 14.1 (WardrobeItem.category field) — [./14-1-wardrobe-item-category-field.md](./14-1-wardrobe-item-category-field.md)
- Prior Story 14.2 (useMisLooksStore unification — source of `favorites` slice) — [./14-2-mis-looks-store-unification-migration.md](./14-2-mis-looks-store-unification-migration.md)
- Save helper (consumed as-is) — [src/lib/armario/saveCutoutAsWardrobeItem.ts](../../src/lib/armario/saveCutoutAsWardrobeItem.ts) (signature lines 18-23; error contract lines 50-55)
- Error union (consumed as-is) — [src/lib/armario/wardrobeErrors.ts](../../src/lib/armario/wardrobeErrors.ts)
- Epic 13 save precedent (mirror the try/catch shape) — [src/screens/armario/ArmarioPreviewScreen.tsx:84-156](../../src/screens/armario/ArmarioPreviewScreen.tsx)
- Paywall hook (consumed as-is) — [src/hooks/usePremiumGate.ts](../../src/hooks/usePremiumGate.ts)
- Paywall component (consumed as-is) — [src/components/PremiumPaywall.tsx](../../src/components/PremiumPaywall.tsx)
- Premium context (consumed as-is) — [src/contexts/PremiumContext.tsx](../../src/contexts/PremiumContext.tsx)
- Unified store (consumed as-is) — [src/stores/misLooksStore.ts](../../src/stores/misLooksStore.ts)
- Premium config (FREE_WARDROBE_LIMIT = 10) — [src/config/premium.ts](../../src/config/premium.ts)
- Category type — [src/lib/wardrobeTypes.ts](../../src/lib/wardrobeTypes.ts)
- Wada color lookups — [src/data/colorIndex.ts](../../src/data/colorIndex.ts) (`getColor` + `getCombinations`)
- Navigation types — [src/navigation/types.ts](../../src/navigation/types.ts)
- Unified camera stack — [src/navigation/UnifiedCameraStack.tsx](../../src/navigation/UnifiedCameraStack.tsx)
- Haptics module — [src/lib/haptics.ts](../../src/lib/haptics.ts)
- Theme tokens — [src/styles/theme.ts](../../src/styles/theme.ts) (`wadaTokens.bgPaper`, `textPrimary`, `textSecondary`, `hairline`)
- Expo Symbols (SF Symbols rendering) — already imported in ArmarioPreview — see `SymbolView` usage
- Memory — `feedback_tailwind_tokens.md` (no `text-`/`bg-` prefixes in token keys)
- Memory — `feedback_no_patches.md` (root cause before patching)
- Memory — `feedback_jest_native_module_mock.md` (deferred mock lookup pattern for nav/route mocks)
- Memory — `feedback_simulator_reset.md` (Metro `--clear` if bundle cache misbehaves; never erase simulator)
- Memory — `feedback_native_module_rebuild.md` (NOT applicable — this story has zero native changes)
- Memory — `feedback_no_analytics.md` (no analytics SDK, no metric-based flags)
- Memory — `project_v140_epic14_progress.md` (Epic 14 progress snapshot — 14.1/14.2/14.3a/14.3b/14.4 done)
- CLAUDE.md — §Story Scope (4–5 task cap — this story uses 5 tightly-scoped tasks), §React Native Specifics, §Accessibility First, §Rules of Hooks (all hooks before early returns)

### Project Structure Notes

- New directory `src/components/armario/` already exists (e.g., `CategoryPickerSheet.tsx` sits alongside any other Armario-scoped shared components). If it doesn't exist, create it — `src/components/armario/CategoryPickerSheet.tsx` is the required path per TD-6.
- No new dependencies. `react-i18next`, `react-native-safe-area-context`, `@react-navigation/native`, `@react-navigation/native-stack`, `expo-symbols`, and all Google fonts are already installed.
- Native `ios/` build artifacts do NOT need regeneration (no Swift / Podfile changes).
- `tsconfig.json` path aliases (`@/*` → `src/*`) are already configured; import paths in the new files follow the established convention.
- AsyncStorage, Zustand `misLooksStore` schema, `hydrateMisLooksStore` — UNCHANGED this story. The save helper handles hydration internally (lines 63-65 of `saveCutoutAsWardrobeItem.ts`).
- `PostSave` screen replaces the 14.3a placeholder and now carries real route params — Story 14.7 or later stories may further edit this screen, but 14.5 lands it in the shipping shape.
- `ArmarioRoot` + `ArmarioCaptureScreen` + `ArmarioPreviewScreen` + `ArmarioStackParamList` are UNTOUCHED per TD-2; the two-camera architecture documented in `ux-design-epic-14.md` §M6AKD is preserved.

## Dev Agent Record

### Agent Model Used

Opus 4.7 (claude-opus-4-7[1m])

### Debug Log References

- None. No HALT conditions triggered.

### Completion Notes List

- **Route-param contract updated** — `UnifiedCameraStackParamList.Result` gained `sourceUri: string`; `PostSave` gained `{ wadaColorId, capturedHex, categoryKey }`. `UnifiedCameraCaptureScreen` plumbs `photo.uri` through `runPipeline(sourceUri)` so the closure value is forwarded to `navigation.push("Result", {...})`. The Capture test updated with a single new assertion (`params.sourceUri`) — no new cases, net 0 tests delta for that file.
- **`CategoryPickerSheet`** shipped at `src/components/armario/CategoryPickerSheet.tsx` with the exact 5-field props interface from AC #3 — `visible`, `currentCategory?`, `onConfirm`, `onCancel`, `confirming?`. Named export, Modal-based (no `@gorhom/bottom-sheet`), `expo-symbols` SF-Symbol icons (`tshirt.fill`, `figure.stand`, `shoe.fill`, `eyeglasses`), all 4 localized rows, disabled-until-selection Confirmar button, backdrop + `onRequestClose` dismissal, localized `accessibilityLabel`/`accessibilityHint`/`accessibilityState` on every interactive node. Component imports zero store/repo — pure presentation + selection state, ready for 14.12b reuse per TD-6.
- **`UnifiedCameraResultScreen`** rewired per AC #1: the 14.4 `navigation.push("PostSave")` stub + `__DEV__ console.warn` removed; primary CTA now calls `hapticMedium()` then `setCategorySheetVisible(true)`. Added `usePremium`, `usePremiumGate`, `useMisLooksStore((s) => s.favorites)`, `isMounted` ref, and 4 new local state fields (`categorySheetVisible`, `paywallVisible`, `confirming`, `errorCopy`). `handleCategoryConfirm` mirrors `ArmarioPreviewScreen:84-156` try/catch tree verbatim, adapted: paywall → close sheet + show paywall; diskFull/encode/move/repoAdd → inline error banner (live-region alert). Success path: `hapticRigid` + `navigation.replace("PostSave", {...})` (replace, not push — see Dev Notes "Why `navigation.replace`"). `pendingCategoryRef` + a single `useEffect([isPremium, paywallVisible, confirming, handleCategoryConfirm])` drives both the silent re-trigger (isPremium=true + ref non-null) and the dismiss-without-purchase cleanup (isPremium=false clears ref). Error banner JSX is Result-scoped (not sheet-scoped) so it survives the paywall closing the sheet.
- **`UnifiedCameraPostSaveScreen`** rewritten from the 14.3a placeholder into the real "¿Ahora qué?" screen: flex-1 centered title + interpolated subtitle with localized category label (via an exhaustive `categoryLabelKey(categoryKey)` switch), pinned 56pt primary CTA (Wada-tinted dark ink + cream label) and 48pt ghost secondary CTA with hairline border. Primary CTA cross-navigates via `getParent().navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", params: { colorId, capturedHex } } })` — identical to Result's secondary link pattern. Secondary CTA navigates to `Main → FavoritesTab` (name preserved per AC #11 — Story 14.7 renames). `hapticLight` on both CTAs.
- **i18n keys** — 17 new keys across 3 blocks (`categorySheet.*` ×9, `save.*` ×4, `postSave.*` ×6 × ×2 = actually `categorySheet`: title/rowTop/rowBottom/rowFootwear/rowAccessory/confirm/confirmA11yLabel/closeSheetA11y/rowA11yHint = 9; `save`: errorDiskFull/errorEncode/errorSaveFailed/errorDismiss = 4; `postSave`: title/subtitle/primaryCta/primaryCtaA11y/secondaryCta/secondaryCtaA11y = 6. ✔ AC #12). Added to both `en.json` and `es.json`. Existing `unifiedCamera.capture.*` and `unifiedCamera.result.*` blocks are byte-for-byte untouched (14.3b + 14.4 freeze respected).
- **Armario flow preserved** — `ArmarioPreviewScreen.tsx` (still hard-codes `category: "top"`), `ArmarioCaptureScreen.tsx`, `ArmarioPreviewScreen.test.tsx`, `saveCutoutAsWardrobeItem.ts`, `wardrobeErrors.ts`, `wardrobeRepo.ts`, `wardrobeTypes.ts`, `misLooksStore.ts`, `PremiumContext.tsx`, `PremiumPaywall.tsx`, `usePremiumGate.ts`, `UnifiedCameraStack.tsx`, `TabNavigator.tsx`, `colorIndex.ts`, `color.ts`, `WadaHeader.tsx`, and all `modules/**` are UNCHANGED — AC #17 verified via search.
- **Quality gates** — `npx tsc --noEmit` clean; `pnpm biome check --write src` ran once in self-heal mode (fixed imports/formatting in 4 new/edited files); full `pnpm test` run: **813 passing / 60 pre-existing / 0 new failures / 0 new skips**. Delta vs 14.4 baseline of 793/60 = **+20 net**, inside the AC #13 target of +18..+26. Pre-existing 60 failures confirmed unchanged (48 `OutfitVisualizer.getState` + 12 `i18n.test.ts detectLanguage`).
- **No native rebuild required** — pure JS/TSX + i18n. Metro reload (`pnpm start --clear`) suffices. On-device smoke (AC #15) deferred to release-gate polish — non-AC-blocking.
- **Branch:** `story/14-5-camera-save-flow-category-selector-paywall` off `epic-14` at commit `0fba31b`.

### File List

**New:**
- `src/components/armario/CategoryPickerSheet.tsx`
- `src/components/armario/CategoryPickerSheet.test.tsx`

**Edited:**
- `src/navigation/types.ts`
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx`
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx`
- `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.test.tsx`
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`

### Review Findings

- [ ] [Review][Patch] P1: Backdrop de CategoryPickerSheet no está disabled cuando `confirming=true` — riesgo de limpiar `pendingCategoryRef` durante un save en vuelo [`src/components/armario/CategoryPickerSheet.tsx`, backdrop Pressable]
- [ ] [Review][Patch] P2: Falta test para error `encode` en UnifiedCameraResultScreen — AC#7 especifica el path + CLAUDE.md exige test por cada interacción de AC [`src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx`]
- [x] [Review][Defer] D-14.5-1: `SCREEN_HEIGHT = Dimensions.get("window").height` a nivel de módulo en CategoryPickerSheet — no reactivo a cambios de orientación; iPhone-only MVP minimiza riesgo [`src/components/armario/CategoryPickerSheet.tsx:58`] — deferred, pre-existing risk pattern
- [x] [Review][Defer] D-14.5-2: Casts `as never` en navegación de PostSave eluden TypeScript — patrón existente en todo Epic 14 [`src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx:54,61`] — deferred, pre-existing pattern
- [x] [Review][Defer] D-14.5-3: `rootNav?.navigate(...)` sin fallback si `getParent()` devuelve undefined — usuario queda bloqueado en PostSave [`src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx:53-61`] — deferred, nav hierarchy guaranteed by stack setup
- [x] [Review][Defer] D-14.5-4: Error banner `bottom: 200` es magic number sin relación con safe area insets — puede solaparse en iPhone SE [`src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx`] — deferred, matches ArmarioPreviewScreen precedent
- [x] [Review][Defer] D-14.5-5: `ensureWardrobeDirectories` puede lanzar un error de disk-full sin envolverlo en `WardrobePersistenceError("diskFull")` — llegaría al catch-all como `repoAdd` [`src/lib/armario/saveCutoutAsWardrobeItem.ts`] — deferred, pre-existing issue in save helper not introduced by this story
- [x] [Review][Defer] D-14.5-6: `wadaName=""` cuando `getColor(wadaColorId)` devuelve undefined — CTA muestra texto con nombre vacío [`src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx:48`] — deferred, wadaColorId always valid from pipeline
- [x] [Review][Defer] D-14.5-7: Sin estado visual desactivado durante `confirming=true` en Confirmar button (fondo sigue oscuro aunque hay spinner) [`src/components/armario/CategoryPickerSheet.tsx`] — deferred, VoiceOver `busy` state is correct; sighted UX acceptable for MVP

## Change Log

| Date       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-21 | Story 14.5 dev-story complete. Category sheet + paywall gate + PostSave screen wired end-to-end; Result CTA rewired from 14.4 stub to sheet-opener; Capture → Result now plumbs `sourceUri`; 17 new i18n keys (ES+EN); 813/60/0 tests vs 793/60 baseline (+20 net). tsc + biome clean. No native rebuild required. Armario flow + `saveCutoutAsWardrobeItem` signature preserved byte-for-byte (AC #17). Branch: `story/14-5-camera-save-flow-category-selector-paywall`. Status: ready-for-dev → in-progress → review. |
