# Story 13.4a: Zero State + Ficha Wada + Shared Components

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user entering a favorited Wada combination for the first time (or with no assignments yet)**,
I want **a welcoming S0 zero-state screen, a clear S2 Ficha Wada that shows every color slot and my progress, and a per-combo entry point surfaced from Favorites**,
so that **I understand what I'm about to build, can see at a glance which slots are assigned, and can start — or resume — the assignment flow without leaving the Favorites surface**.

## Acceptance Criteria

1. **Given** the user taps a favorited combo from the Favorites grid AND `getAssignmentCount(combinationId) === 0` AND `@wardrobe:s0_seen_for_<combinationId>` is NOT set in AsyncStorage AND `Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 17`, **When** the navigation transition completes, **Then** the S0 Zero State screen renders with: top-left back chevron (`testID="s0-back-button"`, `top: 56, left: 20, 48×48`) labeled with the combination's `nameEn`, serif hero `t("armario.s0.heroTitle")` ("Viste esta paleta con tu ropa" / "Dress this palette with your clothes") in `NotoSerifJP_400Regular` at ~30pt, body subtitle `t("armario.s0.subtitle")` ("Asigna una prenda real a cada color. Cuando los tres estén listos, generamos tu look al instante." / EN equivalent), a row that pairs the Wada color dots with the combination `nameEn`, a vertical cascade of N empty `PolaroidCard`s (one per color in `combination.colors`, each tinted with its Wada `color.hex` at ~12% alpha, each showing a centered `+` glyph at 28pt and the Wada color `nameEn` label beneath, each card rotated `+2°, 0°, −2°` with ~32pt overlap to mirror the S4 silhouette), a primary CTA `t("armario.s0.primaryCta")` ("Empezar a asignar prendas" / "Start assigning garments") pinned near the bottom (min 44×44 pt, `testID="s0-primary-cta"`), and a secondary CTA `t("armario.s0.secondaryCta")` ("Ahora no" / "Not now") beneath it as a plain text button (`testID="s0-secondary-cta"`), **And** if `useReducedMotion() === true` the polaroid cascade renders in final position with **no** entry animation (no translate/fade in), **And** the screen's root carries `testID="s0-zero-state-screen"`, `accessibilityLabel={t("armario.s0.screenLabel")}`, and the VoiceOver reading order is: back chevron → hero title → subtitle → each polaroid (announced as "Placeholder for <Wada color nameEn>") → primary CTA → secondary CTA.

2. **Given** the user is on S0, **When** they tap the primary CTA `Empezar a asignar prendas`, **Then** `hapticLight()` fires (via `src/lib/haptics.ts` — never import `expo-haptics` directly), **And** `AsyncStorage.setItem("@wardrobe:s0_seen_for_<combinationId>", "1")` is fired-and-forget (try/catch + `__DEV__` warn on failure — never block the nav), **And** `navigation.replace("ArmarioFichaWada", { combinationId })` transitions to S2 **using `replace`, NOT `push`** so back-swipe from S2 pops directly to Favorites (no S0 intermediate on the stack), **And** when the user taps the secondary CTA `Ahora no` or the back chevron, `navigation.goBack()` fires and NO s0-seen flag is written (next entry with 0 assignments re-renders S0 — confirmed with the user as the desired behavior: the flag is written only on the "opt-in" path).

3. **Given** the user taps a favorited combo AND (`getAssignmentCount(combinationId) > 0` OR `@wardrobe:s0_seen_for_<combinationId>` is set), **When** the navigation resolves, **Then** S2 `ArmarioFichaWadaScreen` renders directly with NO S0 intermediate, **And** the screen's root carries `testID="s2-ficha-wada-screen"` and `accessibilityLabel={t("armario.s2.screenLabel")}`, **And** the nav row shows the top-left back chevron (48×48 pt, `testID="s2-back-button"`, `accessibilityLabel={t("common.goBack")}`) + the combination's `nameEn` in `NotoSerifJP_500Medium` at ~22pt + a `CompletenessBadge` (`testID="s2-completeness-badge"`) showing `✓ N/N` with the `wadaTokens.premiumAccent`-like green chip when `isCombinationComplete === true`, or `X/N` in amber (`#D4923C`) chip otherwise, **And** the body shows an instruction line `t("armario.s2.instruction")` ("Asigna tus prendas a cada color de la paleta" / "Assign your garments to each color of the palette"), a small section label `t("armario.s2.wardrobeLabel")` ("TU ARMARIO" / "YOUR WARDROBE" — all-caps tracking-wide), and a 3-column (or N-column for non-3-color combos; the Favorites set today is all 3-color combos, but render `combination.colors.length` columns defensively) row of `SlotCard`s, one per color.

4. **Given** each `SlotCard` in S2, **When** it renders for `colorIndex: i`, **Then** it stacks vertically: top tile = Wada color swatch (rectangular ~120×96 rounded-[14px], `backgroundColor: combination.colors[i].hex`), middle tile = `WardrobeItemThumb` if the slot is assigned (`<Image source={{ uri: assignedItem.thumbnailPath }}>` resized via `resizeMode="contain"` on a `wadaTokens.bgElevated` background) OR a dashed-border empty tile if unassigned (`borderWidth: 2, borderStyle: "dashed", borderColor: combination.colors[i].hex` + centered `+` 28pt in the same hex at 55% alpha), bottom = Wada color `nameEn` in `Inter_500Medium` 14pt + below it an affordance link `t("armario.s2.linkAssign")` ("Asignar →" / "Assign →") when unassigned, `t("armario.s2.linkChange")` ("Cambiar →" / "Change →") when assigned, **And** the whole card is a single `Pressable` with `testID={`s2-slot-${i}`}`, `accessibilityRole="button"`, and an `accessibilityLabel` that reads "`<Wada color nameEn>`, `<assigned/unassigned state>`. Double-tap to `<assign/change>`" (localized), **And** tapping the card fires `hapticLight()` then calls a navigation stub `onOpenPicker({ combinationId, colorIndex: i })` — the stub is implemented locally in this story and logs a `__DEV__` warn ("S3 Armario Picker — not implemented until Story 13.4b") AND calls an exposed `onOpenPicker` prop override in tests, **And** when the slot is assigned a separate small `Quitar` / `Remove` affordance is NOT rendered in this story (ACs only require the assign/change link in 13.4a per epic spec — `Quitar` is wired in 13.4b).

5. **Given** the user taps the footer primary CTA `t("armario.s2.viewLookCta")` on S2 (`testID="s2-view-look-cta"`, min 44×44 pt, pinned near the bottom with 16pt padding), **When** the combination is complete (`isCombinationComplete(combinationId, combination.colors.length) === true`), **Then** `hapticLight()` fires and a navigation stub `onViewLook({ combinationId })` is invoked — the stub logs `__DEV__` warn "S4 Tu Look — not implemented until Story 13.5", **And** when the combination is partial (0 < count < total), the same stub fires with a second `__DEV__` warn "S5 Sugerencia Armonía — not implemented until Story 13.6", **And** when the combination has 0 assignments the primary CTA is rendered but DISABLED (`disabled`, `accessibilityState={{ disabled: true }}`, opacity 0.5) — the user is expected to use the per-slot `Asignar →` links first, **And** both stubs (`onOpenPicker`, `onViewLook`) are exposed as optional props on `ArmarioFichaWadaScreen` for tests to intercept, defaulting to the `__DEV__`-warn no-op so production code does not crash when Story 13.4b / 13.5 / 13.6 replace the stubs.

6. **Given** the Favorites surface (`src/screens/FavoritesList.tsx`) AND the combo card's tap handler is the Armario entry point, **When** the user taps a favorited combo on iOS 17+ AND `useWardrobeStore((s) => s.hydrated) === true`, **Then** `ComboCard.onPress` is intercepted and routed to either S0 or S2 per AC #1/#3 decisioning, instead of the current `navigation.push("OutfitVisualizer", { combinationId })`, **And** the intercept lives in `FavoritesList.tsx` (NOT inside `ComboCard.tsx` — `ComboCard` must remain reusable by `Combinations` in Colors tab, which still routes to `OutfitVisualizer`), **And** when the device runs iOS < 17 OR `hydrated === false`, the intercept is a no-op and `ComboCard` navigates to `OutfitVisualizer` exactly as pre-Epic-13 (NFR9 parity — Favorites behaves unchanged for unsupported devices and during the hydration window), **And** any additional CTA variants on the card (`Ver tu look → / Completa tu look → / Asignar prendas →`) are explicitly OUT OF SCOPE for this story — those land in Story 13.6 with the badge + thumbnail strip.

7. **Given** the centralized iOS-17 gate helper, **When** any Epic 13 screen or entry point evaluates support, **Then** `src/lib/platform.ts` exports `isIOS17OrNewer(): boolean` (pure function reading `Platform.OS` + `Platform.Version`) AND a React hook `useIsIOS17OrNewer(): boolean` wrapping the pure function (non-reactive; `Platform.Version` never changes during a session, so a plain call inside a component is fine — the hook exists only to make the call site readable and to match future reactive needs), **And** `FavoritesList.tsx` imports the helper for AC #6, **And** `ArmarioStack` (the existing capture-modal stack from Story 13.3a) imports the helper too — replacing `ArmarioCaptureScreen`'s ad-hoc `parseInt(Platform.Version, 10) >= 17` parsing in a follow-up change inside this story (keep the screen's defensive `goBack` effect but swap to `useIsIOS17OrNewer()` to prove the helper is load-bearing for future stories too). Do NOT touch the actual string/number coercion semantics in the screen's existing test suite; just import and use the helper.

8. **Given** the shared Armario components are extracted, **When** Stories 13.4b, 13.5, 13.6 later import from `src/components/armario/`, **Then** four components exist as function-declared named exports (no `export default`): `PolaroidCard` with props `{ variant: "empty" | "filled"; color: { hex: string; nameEn: string }; imageUri?: string; rotation: number; testID?: string; accessibilityLabel?: string; onPress?: () => void }`, `WardrobeItemThumb` with props `{ uri: string; size?: number; testID?: string; accessibilityLabel?: string }`, `WadaColorDot` with props `{ hex: string; size?: number; testID?: string }`, `CompletenessBadge` with props `{ assigned: number; total: number; testID?: string }`, **And** each component has a co-located `.test.tsx` file covering empty/filled rendering, accessibility labels, and prop-driven variants, **And** none of these components import from `src/screens/armario/` — the dependency direction is screens → components (not the reverse), **And** `PolaroidCard.variant === "empty"` renders the tinted-color + `+` layout from AC #1, `variant === "filled"` renders the `<Image>` inside the polaroid frame on white with the Wada color label beneath (even though 13.4a only uses the `empty` variant on S0 and the `filled` variant via `WardrobeItemThumb` inside the S2 `SlotCard`, this story ships both variants so 13.5's `drawPolaroidStack` Skia function can be prototyped against the RN rendered version for visual parity checks).

9. **Given** VoiceOver is active across S0 and S2, **When** navigating with the rotor, **Then** every interactive element has a meaningful `accessibilityLabel` localized in the device locale (EN or ES), **And** the S0 polaroid pre-viz cards announce their Wada color `nameEn` inside the label (e.g., "Placeholder for Coral Pink. Double-tap to start assigning."), **And** the S2 slot cards announce their full state (e.g., "Coral Pink, unassigned. Double-tap to assign." OR "Coral Pink, assigned. Double-tap to change."), **And** the S2 completeness badge announces "`N of N` assigned" (or "`X of N` assigned" in the amber state), **And** 44×44 pt minimum touch targets are verified on all Pressables (back chevron, primary CTA, secondary CTA, slot cards, view-look CTA) via `minHeight` / `minWidth` styling.

10. **Given** co-located Jest tests for the new screens + helpers + shared components + the Favorites intercept + iOS-17 gate, **When** `pnpm test`, `npx tsc --noEmit`, and `pnpm lint` all run, **Then** these new/extended suites pass:
    - `src/lib/platform.test.ts` — CREATE, 4 tests: iOS ≥17 returns true, iOS <17 returns false, Android returns false, string-vs-number `Platform.Version` coercion works for both shapes.
    - `src/components/armario/PolaroidCard.test.tsx` — CREATE, 5 tests: empty variant renders swatch + `+` + color name, filled variant renders `<Image>` + color name, rotation prop reaches the transform, onPress fires haptic-free (the card itself does not fire haptics — parent controls), accessibilityLabel passes through.
    - `src/components/armario/WardrobeItemThumb.test.tsx` — CREATE, 3 tests: renders Image with uri, custom size overrides default, accessibilityLabel exposed.
    - `src/components/armario/WadaColorDot.test.tsx` — CREATE, 2 tests: default size, custom size.
    - `src/components/armario/CompletenessBadge.test.tsx` — CREATE, 4 tests: `3/3` → green + ✓ glyph, `2/3` → amber + no glyph, `0/3` → grey "Sin prendas" variant (per UX-DR2 — but note 13.4a only renders this inside the S2 nav; the Favorites surface wording is 13.6 scope), `0/0` defensive → grey no-prendas variant, all with localized text assertions.
    - `src/screens/armario/ArmarioZeroStateScreen.test.tsx` — CREATE, 6 tests: renders hero + subtitle + N polaroid cards + CTAs for a 3-color combo, primary CTA taps → haptic + AsyncStorage setItem + `navigation.replace("ArmarioFichaWada", {...})`, secondary CTA taps → goBack and NO storage write, back chevron taps → goBack and NO storage write, reduce-motion path renders cards without entry transition (assert via jest.mock of useReducedMotion returning true + a no-animation branch), unsupported color count (defensive — combination.colors.length = 0 would short-circuit to goBack).
    - `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — CREATE, 8 tests: renders N slot cards per combination, empty-slot card shows dashed border + `+`, filled-slot card shows `WardrobeItemThumb` + `Cambiar →`, slot tap fires `hapticLight` + `onOpenPicker({ combinationId, colorIndex })` stub, view-look CTA disabled when 0 assignments, view-look CTA fires `onViewLook` stub when 3/3, same CTA fires stub with partial-state arg when 2/3, CompletenessBadge renders `2/3` amber vs `3/3` green based on assignments.
    - `src/screens/FavoritesList.test.tsx` — EXTEND with 3 new tests (keep all existing): iOS 17+ hydrated → tap combo routes to S0 when 0 assignments + S0 not seen, tap combo routes to S2 when 1/3 assignments, iOS <16.x → tap combo still routes to `OutfitVisualizer` (regression check — NFR9 parity).
    - `src/screens/armario/ArmarioCaptureScreen.test.tsx` — EXTEND only the iOS-version mock assertion to go through the helper (not a new test, just swap the direct Platform.Version mock for a jest.mock of `@/lib/platform`); all 8 existing tests must still pass.
    **And** baseline regression: `pnpm test` shows zero NEW failures vs. Story 13.3b baseline (643 passing + 60 pre-existing debt #7), **And** `npx tsc --noEmit` is clean, **And** `pnpm lint` is clean (Biome tabs + double quotes, function-declared named exports, NativeWind `className` for static styles, `style={{}}` only for Wada `color.hex` dynamic values).

## Tasks / Subtasks

- [x] **Task 1: Reconcile `CombinationAssignment.combinationId` type + centralize iOS-17 gate** (AC: #6, #7)
  - [x] 1.1 **Fix the combinationId type mismatch (blocking prerequisite).** `Combination.id` is `string` (see `src/data/types.ts:25-30`) but `CombinationAssignment.combinationId` is typed as `number` across `src/lib/wardrobeTypes.ts:19` + `src/stores/wardrobeStore.ts:33` + `src/lib/wardrobeRepo.ts` signatures. Stories 13.2, 13.3a, 13.3b never touched `combinationId` (they only handle wardrobe items, not assignments), so the mismatch has been latent. Story 13.4a is the first story to join assignments to a combo, so it MUST reconcile. Change the type to `string` in these locations:
    - `src/lib/wardrobeTypes.ts:19` — `combinationId: number` → `combinationId: string`
    - `src/stores/wardrobeStore.ts:33` — the `typeof v.combinationId === "number"` guard → `typeof v.combinationId === "string"` (and update the test that seeds a numeric id).
    - `src/lib/wardrobeRepo.ts` — change `combinationId: number` to `combinationId: string` across `getAssignmentsForCombination`, `assign`, `unassign`, `getAssignmentCount`, `isCombinationComplete`, `cascadeDeleteAssignmentsForCombination`.
    - `src/lib/wardrobeRepo.test.ts` + `src/stores/wardrobeStore.test.ts` — update any numeric literal like `combinationId: 1` to `"combo-1"` (match the shape used by `getCombination(id: string)`).
    Rationale: this is a Story 13.1 oversight caught late. Mass-rename is safer and cheaper than a runtime coercion (`String(id)`) that would hide future drift. Any legacy AsyncStorage rows with a numeric `combinationId` stored pre-epic-13 cannot exist — 13.1 is the first story that wrote assignments and no user has shipped with it. Run `rg "combinationId: number|combinationId: 1"` to confirm zero hits in production code after the edit.
  - [x] 1.2 Create `src/lib/platform.ts` (new file) exporting two symbols:
    ```ts
    import { Platform } from "react-native";

    /**
     * True when the runtime is iOS 17 or newer. Used to gate Armario Virtual
     * entry points (capture, zero-state, ficha) — the Vision API
     * `VNGenerateForegroundInstanceMaskRequest` is iOS 17+ only.
     */
    export function isIOS17OrNewer(): boolean {
        if (Platform.OS !== "ios") return false;
        const v = Platform.Version;
        const n = typeof v === "string" ? parseInt(v, 10) : v;
        return Number.isFinite(n) && (n as number) >= 17;
    }

    /**
     * Hook wrapper around `isIOS17OrNewer`. `Platform.Version` does not change
     * during a session, so this is a pure read — the hook exists for call-site
     * readability and to preserve a stable surface if future work ever needs
     * reactive device-capability state.
     */
    export function useIsIOS17OrNewer(): boolean {
        return isIOS17OrNewer();
    }
    ```
    Both are function-declared named exports (CLAUDE.md §React Native Specifics). Co-locate `src/lib/platform.test.ts` with the 4 tests listed in AC #10. Mock `react-native`'s `Platform` via `jest.doMock("react-native", ...)` scoped per test to toggle `OS` and `Version`.
  - [x] 1.3 Sweep `src/screens/armario/ArmarioCaptureScreen.tsx`: replace the inline `supportsVision` parsing (per Story 13.3a AC #1 Task 2.9) with `useIsIOS17OrNewer()` and drop the local parse. The defensive `useEffect(() => { if (!supportsVision) navigation.goBack(); }, [supportsVision, navigation])` stays — only the computation of the boolean changes. Update `src/screens/armario/ArmarioCaptureScreen.test.tsx` existing "iOS < 17 defensive gate" test (test #7) to mock `@/lib/platform` instead of `Platform.Version`; all other 7 tests in that file must still pass untouched.

- [x] **Task 2: Shared Armario components** (AC: #8, #9, #10)
  - [x] 2.1 Create `src/components/armario/WadaColorDot.tsx`. `interface WadaColorDotProps { hex: string; size?: number; testID?: string; }`. Renders a `<View>` with circular `borderRadius: size/2`, `backgroundColor: hex`, default `size = 12`, `accessibilityElementsHidden={true}` + `importantForAccessibility="no-hide-descendants"` (decorative — the combination name carries semantic meaning). No `className` — the styling is entirely dynamic via `style={{}}` because the `hex` and `size` are props. Co-locate `WadaColorDot.test.tsx` with the 2 tests from AC #10.
  - [x] 2.2 Create `src/components/armario/WardrobeItemThumb.tsx`. `interface WardrobeItemThumbProps { uri: string; size?: number; testID?: string; accessibilityLabel?: string; }`. Renders `<Image source={{ uri }} resizeMode="contain" />` inside a `<View>` with `backgroundColor: wadaTokens.bgElevated`, `borderRadius: 10`, default `size = 96`, `testID` wired through, `accessibilityLabel` when provided else `accessibilityElementsHidden={true}`. Use NativeWind `className` for static layout (`className="items-center justify-center"`) and `style={{ width: size, height: size }}` for dynamic sizing. Co-locate `.test.tsx` with AC #10 tests.
  - [x] 2.3 Create `src/components/armario/CompletenessBadge.tsx`. `interface CompletenessBadgeProps { assigned: number; total: number; testID?: string; }`. Renders a small rounded chip (`borderRadius: 10`, ~24pt tall) with 3 variants keyed on `(assigned, total)`:
    - `total === 0` OR `assigned === 0` → grey chip (`wadaTokens.bgElevated`), text `t("armario.badge.none")` ("Sin prendas" / "No garments yet").
    - `assigned === total && total > 0` → green chip (`backgroundColor: "#D4F2D4"`, `color: "#1F6D1F"`), glyph `✓` + text `t("armario.badge.complete", { assigned, total })` ("N/N" — keep numeric formatting in the copy, NOT the word "complete").
    - `0 < assigned < total` → amber chip (`backgroundColor: "#F8E4C2"`, `color: "#8B5E1F"`), text `t("armario.badge.partial", { assigned, total })` ("N/N" — raw numbers).
    Use `Inter_500Medium` at 13pt. `accessibilityLabel={t("armario.badge.a11y", { assigned, total })}` ("N of N assigned" / "N de N asignadas"). Exports the color constants as `const COMPLETENESS_COLORS = { ... }` inline so tests can assert the mapping without hardcoding hex strings. Co-locate `.test.tsx` with AC #10's 4 tests.
  - [x] 2.4 Create `src/components/armario/PolaroidCard.tsx`. `interface PolaroidCardProps { variant: "empty" | "filled"; color: { hex: string; nameEn: string }; imageUri?: string; rotation: number; testID?: string; accessibilityLabel?: string; onPress?: () => void; }`. Outer `<Pressable>` wraps inner card `<View>`:
    - Empty variant: card `backgroundColor: color.hex + "1F"` (12% alpha — use `hexToRgba(color.hex, 0.12)` util; if not available, inline a 2-line converter), `borderWidth: 2, borderStyle: "dashed", borderColor: color.hex`, inner `+` glyph at `28pt` in `color.hex` (alpha 0.55) + `color.nameEn` label beneath in `Inter_500Medium` 13pt tinted 60% of `color.hex`.
    - Filled variant: card `backgroundColor: "white"`, a shadow (`shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12`), an inner `<Image source={{ uri: imageUri }} resizeMode="contain">` on a neutral `wadaTokens.bgElevated` background (rounded inset 10pt), color `nameEn` label beneath (same font/size as empty).
    Card rotation applied via `style={{ transform: [{ rotate: `${rotation}deg` }] }}` at the outer `<View>`. The card size is driven by `width: "92%", aspectRatio: 1.3` to keep it ~320×246 on iPhone 13 width (the cascade overlaps ~32pt — layout done in S0; this component only owns its own frame). When `onPress` is undefined, the outer `Pressable` still renders (as a `View`) — accept this quirk for simplicity. NativeWind `className="rounded-[14px] items-center justify-center"` for static, dynamic bg/border/transform via `style={{}}`. Co-locate `.test.tsx` with AC #10's 5 tests.
  - [x] 2.5 Extract a tiny util `src/lib/color.ts` addition: `export function hexToRgba(hex: string, alpha: number): string` — normalizes 3/6-digit hex to `rgba(r, g, b, a)` for RN style compatibility (RN 0.83 accepts 8-digit hex like `#RRGGBBAA`, but rgba is more universal and matches the codebase's existing `isLightColor` utility shape). Add inline unit test if not already covered by `color.test.ts`.

- [x] **Task 3: ArmarioZeroStateScreen (S0) + ArmarioFichaWadaScreen (S2) + Favorites intercept + routing** (AC: #1–#6, #9, #10)
  - [x] 3.1 Extend `src/navigation/types.ts` `FavoritesStackParamList` to include the two new routes:
    ```ts
    export type FavoritesStackParamList = {
        FavoritesList: undefined;
        OutfitVisualizer: { combinationId: string; capturedHex?: string };
        ArmarioZeroState: { combinationId: string };
        ArmarioFichaWada: { combinationId: string };
    };
    ```
    Add both routes to `src/navigation/FavoritesStack.tsx`:
    ```tsx
    <Stack.Screen name="ArmarioZeroState" component={ArmarioZeroStateScreen} options={{ headerShown: false, animation: "fade" }} />
    <Stack.Screen name="ArmarioFichaWada" component={ArmarioFichaWadaScreen} options={{ headerShown: false, animation: "fade" }} />
    ```
    Rationale for hosting on FavoritesStack (not ArmarioStack): the Armario Virtual entry point is tapping a favorited combo. Back-swipe from S2 must pop to FavoritesList, which requires the screens to be on the same stack. `ArmarioStack` (root-modal) remains the capture surface — launched from S3 in Story 13.4b. Document this split inline in `FavoritesStack.tsx` with a 1-line comment.
  - [x] 3.2 Create `src/screens/armario/ArmarioZeroStateScreen.tsx`. Function-declared named export, `type ArmarioZeroStateScreenProps = Record<string, never>`. Hooks in order: `useTranslation`, `useNavigation<NativeStackNavigationProp<FavoritesStackParamList, "ArmarioZeroState">>`, `useRoute<...>` (to read `combinationId`), `useReducedMotion`, `useMemo` to resolve `getCombination(combinationId)` once. Early-return after all hooks: if `combination` is undefined OR `combination.colors.length === 0`, call `navigation.goBack()` in a `useEffect` and render `null` as the body (same pattern as `OutfitVisualizer` "notFound" flow). Body layout:
    - Back chevron (top-left, `testID="s0-back-button"`, `onPress={() => { hapticLight(); navigation.goBack(); }}`, 48×48, `accessibilityLabel={t("common.goBack")}`, `accessibilityHint={combination.nameEn}`).
    - Hero title `t("armario.s0.heroTitle")` — `NotoSerifJP_400Regular` at 30pt, `color: wadaTokens.textPrimary`, padding ~24pt horizontal.
    - Subtitle `t("armario.s0.subtitle")` — `Inter_400Regular` at 15pt, `color: wadaTokens.textSecondary`, `lineHeight: 22`.
    - Name row: `<View>` flex-row with `<WadaColorDot>` per color + a `<Text>` with `combination.nameEn` in `NotoSerifJP_500Medium` 14pt (mimics the UX reference `docs/planning/feature-armario-virtual/screens/s0-zero-state.png`).
    - Polaroid cascade: `<View style={{ alignItems: "center", marginTop: 24 }}>` containing N `<PolaroidCard variant="empty" color={...} rotation={rotations[i]} />` — `const rotations = [2, 0, -2]` for a 3-color combo; for N ≠ 3 default to evenly distributed rotations `[(i - (N-1)/2) * 2]` clamped to ±3°. Between cards use `marginTop: -32` (negative = overlap), but if `useReducedMotion() === true` skip any `withSpring`/`withTiming` animated entry (the card itself doesn't animate today — this is forward-looking since Story 13.5 will animate the cascade; keep the branch future-proof).
    - Primary CTA: `<Pressable testID="s0-primary-cta" onPress={handleStart}>` — black pill button (rounded-[28px]), `backgroundColor: wadaTokens.textPrimary`, text `t("armario.s0.primaryCta")` in `Inter_500Medium` 16pt white, min 44×44 pt, bottom: 80pt from safe-area.
    - Secondary CTA: `<Pressable testID="s0-secondary-cta" onPress={() => { hapticLight(); navigation.goBack(); }}>` — plain text, 44pt tall, `color: wadaTokens.textSecondary`, bottom: 28pt.
    `handleStart`: `hapticLight(); await AsyncStorage.setItem(\`@wardrobe:s0_seen_for_${combinationId}\`, "1").catch((err) => { if (__DEV__) console.warn("[S0] seen flag write failed", err); }); navigation.replace("ArmarioFichaWada", { combinationId });`. Do NOT `await` inside the tap handler without wrapping — use `.catch` + chained `navigation.replace` outside the await to keep the nav unblocking. Final production code either awaits or uses `.catch`+continue; either is acceptable — pick the pattern that matches existing code style. Screen root: `<View className="flex-1" style={{ backgroundColor: wadaTokens.bgPaper }} testID="s0-zero-state-screen" accessibilityLabel={t("armario.s0.screenLabel")}>`.
  - [x] 3.3 Create `src/screens/armario/ArmarioFichaWadaScreen.tsx`. Function-declared named export. `interface ArmarioFichaWadaScreenProps { onOpenPicker?: (args: { combinationId: string; colorIndex: number }) => void; onViewLook?: (args: { combinationId: string }) => void; }` — both optional, defaulting to `__DEV__`-warn no-op closures declared at module scope so tests can intercept via prop override. Hooks (in order): `useTranslation`, `useNavigation`, `useRoute`, `useCombination` (call `getCombination(combinationId)` inside `useMemo`), `useWardrobeStore((s) => s.hydrated)`, `useWardrobeStore((s) => s.assignments)`, `useWardrobeStore((s) => s.items)` — use three selectors so mutations on one slice don't over-render. Early-return (same pattern as S0) if combination is undefined. Derive:
    - `assignments = useMemo(() => allAssignments.filter((a) => a.combinationId === combinationId), [allAssignments, combinationId])`.
    - `assignedCount = assignments.length`.
    - `isComplete = assignedCount === combination.colors.length && combination.colors.length > 0`.
    - `itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])`.
    Render layout:
    - Nav row (top, padding-top: 56): back chevron + combination `nameEn` in `NotoSerifJP_500Medium` 22pt + `<CompletenessBadge assigned={assignedCount} total={combination.colors.length} testID="s2-completeness-badge" />`.
    - Instruction `t("armario.s2.instruction")` in `Inter_400Regular` 15pt `wadaTokens.textSecondary`.
    - Section label `t("armario.s2.wardrobeLabel")` — all-caps 11pt `Inter_500Medium` 2.5pt letter-spacing `wadaTokens.textTertiary`.
    - Slot grid: `<View className="flex-row" style={{ gap: 12 }}>` wrapping `combination.colors.map((color, i) => <Pressable testID={\`s2-slot-${i}\`} onPress={() => handleSlotTap(i)}>…</Pressable>)`. Each `Pressable` contains (vertically): Wada swatch (`<View style={{ backgroundColor: color.hex, aspectRatio: 1.25, borderRadius: 14 }}/>`), then either `<WardrobeItemThumb uri={assignedThumb} accessibilityLabel={...} />` (if `findAssignment(i)` resolves to a `WardrobeItem`) or an empty dashed tile mirroring `PolaroidCard`'s empty pattern (dashed border in `color.hex`, centered `+`), then color `nameEn` label, then `t("armario.s2.linkAssign")` or `linkChange` depending on assignment.
    - `handleSlotTap(i)`: `hapticLight(); onOpenPicker?.({ combinationId, colorIndex: i }) ?? defaultStub(i);` — the defaultStub is the module-scope `__DEV__` warn.
    - Footer CTA: `<Pressable testID="s2-view-look-cta" onPress={handleViewLook} disabled={assignedCount === 0}>` pinned at `bottom: 28`. Label `t("armario.s2.viewLookCta")`. `handleViewLook`: `hapticLight(); onViewLook?.({ combinationId }) ?? defaultStub(isComplete)`. Styling matches S0 primary CTA (black pill).
    Render the screen under `<View className="flex-1" style={{ backgroundColor: wadaTokens.bgPaper }} testID="s2-ficha-wada-screen" accessibilityLabel={t("armario.s2.screenLabel")}>`.
  - [x] 3.4 Modify `src/screens/FavoritesList.tsx` to intercept combo card taps on iOS 17+ hydrated. Add an inner `handleComboPress(combinationId: string)` that:
    1. Reads `const hydrated = useWardrobeStore((s) => s.hydrated);` + `const supported = useIsIOS17OrNewer();` (at top of component, with all other hooks).
    2. In `renderComboCard`, change the `ComboCard` prop `onTogglePaywallGate` / `onToggleFavorite` wiring to additionally pass an `onPress` override — OR (preferred) wrap the `ComboCard` in a `<Pressable>` that intercepts tap before delegation.
    3. **Cleaner approach (recommended):** keep `ComboCard` untouched; instead, override navigation by wrapping the combo item in a new tap handler. The existing `ComboCard` hard-codes `navigation.push("OutfitVisualizer")` on its own — changing that would affect Colors tab reuse. **Solution:** add an optional prop `onPress?: (id: string) => void` to `ComboCard` that, when provided, pre-empts the internal navigation. Default behavior unchanged. Document as one-line change: `onPress?.(combination.id) ?? navigation.push("OutfitVisualizer", { combinationId: combination.id });` with short JSDoc. Update ComboCard test file to assert the default navigation still fires when `onPress` is absent.
    4. In `FavoritesList`, pass `onPress={handleComboPress}` to every `ComboCard`. Inside `handleComboPress`:
        ```ts
        if (!supported || !hydrated) {
            // Fallback: legacy OutfitVisualizer route (iOS <17 or during hydration window).
            navigation.push("OutfitVisualizer", { combinationId });
            return;
        }
        const assignedCount = assignments.filter((a) => a.combinationId === combinationId).length;
        const seen = await AsyncStorage.getItem(`@wardrobe:s0_seen_for_${combinationId}`);
        if (assignedCount === 0 && seen === null) {
            navigation.push("ArmarioZeroState", { combinationId });
        } else {
            navigation.push("ArmarioFichaWada", { combinationId });
        }
        ```
        Wrap in try/catch; on AsyncStorage error default to S2 (less annoying than re-showing S0 every time). `handleComboPress` must be `async` — convert via `useCallback` with correct dep array (`[navigation, assignments, supported, hydrated]`). Haptic is fired by `ComboCard` itself today; do NOT duplicate.
    5. Import: `import AsyncStorage from "@react-native-async-storage/async-storage"; import { useWardrobeStore } from "@/stores/wardrobeStore"; import { useIsIOS17OrNewer } from "@/lib/platform";`.
    6. Update `src/screens/FavoritesList.test.tsx` with the 3 new tests in AC #10 (iOS17 + hydrated + 0 assignments + unseen → S0; iOS17 + hydrated + 1 assignment → S2; iOS <17 → OutfitVisualizer). Mock `@/lib/platform` and `@/stores/wardrobeStore` per test.
  - [x] 3.5 i18n keys — add to both `src/i18n/locales/en.json` AND `src/i18n/locales/es.json` under the existing `armario` namespace. Place under two new sub-objects `armario.s0` and `armario.s2`:
    ```
    armario.s0.screenLabel           → "Zero state screen" / "Pantalla de inicio"
    armario.s0.heroTitle             → "Dress this palette with your clothes" / "Viste esta paleta con tu ropa"
    armario.s0.subtitle              → "Assign a real garment to each color. Once all three are ready, we'll compose your look." / "Asigna una prenda real a cada color. Cuando los tres estén listos, generamos tu look al instante."
    armario.s0.primaryCta            → "Start assigning garments" / "Empezar a asignar prendas"
    armario.s0.secondaryCta          → "Not now" / "Ahora no"
    armario.s0.polaroidA11y          → "Placeholder for {{color}}. Double-tap to start assigning." / "Hueco para {{color}}. Doble-tap para empezar a asignar."
    armario.s2.screenLabel           → "Wada fiche screen" / "Pantalla Ficha Wada"
    armario.s2.instruction           → "Assign your garments to each color of the palette" / "Asigna tus prendas a cada color de la paleta"
    armario.s2.wardrobeLabel         → "YOUR WARDROBE" / "TU ARMARIO"
    armario.s2.linkAssign            → "Assign →" / "Asignar →"
    armario.s2.linkChange            → "Change →" / "Cambiar →"
    armario.s2.viewLookCta           → "See your look" / "Ver tu look"
    armario.s2.slotA11yUnassigned    → "{{color}}, unassigned. Double-tap to assign." / "{{color}}, sin asignar. Doble-tap para asignar."
    armario.s2.slotA11yAssigned      → "{{color}}, assigned. Double-tap to change." / "{{color}}, asignada. Doble-tap para cambiar."
    armario.badge.complete           → "{{assigned}}/{{total}}" / "{{assigned}}/{{total}}" (same — numeric format)
    armario.badge.partial            → "{{assigned}}/{{total}}" / "{{assigned}}/{{total}}" (same — numeric format)
    armario.badge.none               → "No garments yet" / "Sin prendas"
    armario.badge.a11y               → "{{assigned}} of {{total}} assigned" / "{{assigned}} de {{total}} asignadas"
    ```
    Wada color names (used inside `{{color}}` interpolation) are passed as raw strings — NEVER run them through `t()` (Epic 11.2 rule). Verify the EN/ES parity check in `src/i18n/__tests__/i18n.test.ts` still passes after adding all keys to both files (bidirectional `AssertSameKeys`).

- [x] **Task 4: Co-located tests + AC walkthrough + regression** (AC: #1–#10)
  - [x] 4.1 Create the 5 component tests from AC #10 under `src/components/armario/*.test.tsx`. Mocks: `@/lib/haptics` for any screen-level test; components themselves don't fire haptics so their tests don't need the haptics mock. For `PolaroidCard`, mock `react-native`'s `Pressable` only if the default mock causes flakiness — default works via `@testing-library/react-native`.
  - [x] 4.2 Create the 2 screen tests from AC #10 under `src/screens/armario/ArmarioZeroStateScreen.test.tsx` and `src/screens/armario/ArmarioFichaWadaScreen.test.tsx`. Mock pattern per Story 13.3a's `ArmarioCaptureScreen.test.tsx` header: `react-native-safe-area-context`, `@react-navigation/native` (`useNavigation`, `useRoute`), `@/lib/haptics`, `@react-native-async-storage/async-storage` (via `@react-native-async-storage/async-storage/jest/async-storage-mock`), `@/data/colorIndex` (mock `getCombination(id)` to return a 3-color combo fixture), `@/stores/wardrobeStore` (mock `useWardrobeStore` with selector stubs). For the reduce-motion path, `jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }))` scoped per test.
  - [x] 4.3 Create `src/lib/platform.test.ts` with the 4 tests from AC #10. Use `jest.resetModules() + jest.doMock("react-native", () => ({ Platform: { OS: "ios", Version: "17.0" } }))` inside each `it` for isolation.
  - [x] 4.4 Extend `src/screens/FavoritesList.test.tsx` with the 3 new tests from AC #10. Mock `@/lib/platform`, `@/stores/wardrobeStore`, `@react-native-async-storage/async-storage`, and the existing mocks — do NOT remove any existing test. The new tests must verify that `navigation.push` is called with `"ArmarioZeroState"` / `"ArmarioFichaWada"` / `"OutfitVisualizer"` correctly per state combination.
  - [x] 4.5 Extend `src/screens/armario/ArmarioCaptureScreen.test.tsx` test #7 only to swap the `Platform.Version` mock for a `@/lib/platform` mock. Zero other tests change. Verify all 8 tests still pass.
  - [x] 4.6 Extend `src/lib/wardrobeRepo.test.ts` + `src/stores/wardrobeStore.test.ts` to flip the `combinationId` type from `number` to `string` across the 10+ existing tests. Mechanical rename: `combinationId: 1` → `combinationId: "combo-1"`. Run `pnpm test src/lib/wardrobeRepo src/stores/wardrobeStore` to confirm 100% green post-rename.
  - [x] 4.7 Run the full sequence: `npx tsc --noEmit` → clean (the `combinationId: string` migration will surface any stray consumers — fix them in-PR; none should exist yet), `pnpm lint` → clean, `pnpm test` → zero NEW failures vs. Story 13.3b baseline (643 passing + 60 pre-existing debt #7). Document the new test count delta in Completion Notes (expected: +5 component + +2 screen + +4 platform + +3 Favorites regression + unchanged 23 repo/store (renames only, not new cases) = **~+14 net new tests**, target ~657 passing).
  - [x] 4.8 AC walkthrough in Completion Notes — one row per AC #1–#10 with a single-sentence "verified via {test name / visual pass / on-device action}". Mirror the Story 13.3b Completion Notes table.
  - [x] 4.9 On-device visual review — this story is the first UX-visible Armario milestone. Per `feedback_visual_review.md`, launch on simulator (iPhone 16 Pro preset): (a) open Favorites, tap any favorited combo → S0 renders correctly with polaroid cascade, (b) tap `Empezar a asignar prendas` → routes to S2 with N empty slot cards, `Asignar →` links visible, view-look CTA disabled, (c) back-swipe from S2 pops to Favorites (no S0 intermediate — verifying the `navigation.replace` contract from AC #2), (d) tap a combo that already has 1 assignment (seed via `__DEV__` dev-menu or direct `wardrobeRepo.assign` call in Settings) → S2 renders with 1 filled slot + `Cambiar →` + 2 empty slots + CompletenessBadge amber `1/3`, (e) tap `Ver tu look` at partial state → observe `__DEV__` warn in console for S5 stub, (f) switch simulator language to Spanish → reopen → all copy localized, (g) enable Reduce Motion in simulator → re-enter S0 → cascade renders final position without animation (no animation is visible today — the test passes if no jank is introduced in future stories that animate). Capture screenshots of S0 (EN + ES), S2 (0/3 amber, 2/3 amber, 3/3 green). Paste them into Completion Notes inline as base64-encoded images (matching the Epic 12 Story 12.2 screenshot policy).
  - [x] 4.10 Regression check — `pnpm test src/screens/CaptureScreen.test.tsx` (Epic 12) → 22/22 unchanged, `pnpm test src/screens/FavoritesList.test.tsx` → existing tests still pass, `pnpm test src/screens/armario/ArmarioCaptureScreen.test.tsx` → 8/8 unchanged (the Platform.Version mock swap in Task 1.3 is the only touch). Document in Completion Notes. Epic 12's color-capture flow and Epic 13's background-removal capture flow must both still work end-to-end.

## Dev Notes

### Architecture context (brownfield)

- **Current branch:** `epic-13`. This story's branch: `story/13-4a-zero-state-ficha-wada-shared-components` off `epic-13`. Merge back to `epic-13` when all ACs pass + `/bmad-code-review` is clean. Stories 13.1 + 13.2 + 13.3a + 13.3b must be on `epic-13` (they are — sprint-status.yaml shows `done` for all four).
- **Upstream deps that MUST be on-branch before dev:** Story 13.1 (`wardrobeRepo` assign/getAssignmentsForCombination/isCombinationComplete + `useWardrobeStore` hydration) — this story is the **first consumer** of those assignment APIs. Story 13.3a (`ArmarioStack`, the root-modal capture flow) — for the iOS-17 gate helper centralization (Task 1.3). No dependency on Story 13.3b persistence logic — S2 merely reads existing wardrobe items; creating new ones is the 13.4b Nueva-foto branch.
- **Scope boundaries (tight — 4 tasks, CLAUDE.md §Story Scope):**
  - ✅ Fix `combinationId` type mismatch (string, not number — Story 13.1 oversight caught late)
  - ✅ Centralize iOS-17 gate at `src/lib/platform.ts` + retrofit existing Armario capture screen
  - ✅ Build shared Armario components: `PolaroidCard`, `WardrobeItemThumb`, `WadaColorDot`, `CompletenessBadge`
  - ✅ Build S0 `ArmarioZeroStateScreen` + S2 `ArmarioFichaWadaScreen` on `FavoritesStack`
  - ✅ Intercept Favorites combo taps → route to S0/S2 on iOS 17+ hydrated; fall through to `OutfitVisualizer` otherwise
  - ✅ i18n EN + ES for every new string + per-component a11y labels + VoiceOver reading order
  - ❌ NO S3 Armario Picker — Story 13.4b (`Asignar →` tap renders a `__DEV__`-warn stub prop)
  - ❌ NO S4 Tu Look / S5 Sugerencia — Stories 13.5 / 13.6 (`Ver tu look` tap renders a `__DEV__`-warn stub prop)
  - ❌ NO Favorites card badges / thumbnails / CTA variants — Story 13.6 (`Asignar prendas →` / `Ver tu look →` / `Completa tu look →` CTAs are all 13.6 scope; this story only intercepts `ComboCard.onPress`)
  - ❌ NO `Quitar` action on filled slots — Story 13.4b (AC #4 note)
  - ❌ NO changes to `FavoritesContext`, `PremiumContext`, `ColorsStack`, existing `ArmarioStack`, `CaptureScreen` (Epic 12), `Combinations`, `OutfitVisualizer`, `src/lib/wardrobeRepo.ts` signatures beyond the `combinationId: number → string` migration in Task 1.1
- **First user-visible milestone:** this story IS the first Armario surface users see once 13.3b is also merged. 13.3b on its own is invisible (persistence layer + orphan sweep); 13.4a unlocks the discovery and progress-tracking surface from Favorites. Merge sequencing: 13.3b → 13.4a to keep the `Asignar →` stub's `__DEV__` warn benign.

### Navigation — why S0/S2 live on FavoritesStack (not ArmarioStack)

`ArmarioStack` today is a root-modal navigator (`presentation: "modal"` sibling of `Main`, see `App.tsx:72-74`) containing `ArmarioCapture` + `ArmarioPreview`. Its job: the capture flow that Story 13.4b will launch as a modal sheet from S3 "Nueva foto". Capture ≠ discovery — these are two different UX surfaces.

S0 and S2 are the discovery + progress-tracking surface triggered by tapping a favorited combo. They belong on `FavoritesStack` so:
- Back-swipe from S2 → FavoritesList naturally (same stack).
- The tab bar stays visible (Armario root-modal swallows the tab bar when presented).
- S0 `replace` → S2 keeps the back-stack clean (AC #2).

Story 13.4b's S3 Picker will be presented as a bottom-sheet modal OVER S2 (not stacked — per UX spec), and `+ Nueva foto` inside S3 will navigate to the existing `ArmarioRoot` modal. Two different modals, two different purposes, two different entry surfaces — no collision.

### combinationId type migration rationale

`Combination.id` is a `string` (`"combo-1"`, `"combo-2"`, …) defined in `src/data/types.ts:25-30`. Story 13.1 typed `CombinationAssignment.combinationId` as `number` — an oversight that was never caught because 13.2 / 13.3a / 13.3b only touched wardrobe items (not assignments). This story is the first to join the two entities (S2 reads assignments for the combo the user tapped from Favorites, whose id is a `string`).

Migration is mechanical: change the type + the store hydration guard + the repo signatures + the test seeds. No runtime coercion (`String(id)` shims are a footgun — they silently paper over future type drift). No production data exists with a numeric `combinationId` since 13.1 is the first assignment-writing story and no user has shipped it.

Run `rg -nU "combinationId: (?:number|\d)"` after the edit to verify zero regressions. If the search returns any match, fix it before proceeding.

### Favorites intercept — why this pattern vs. alternatives

Three alternatives considered:

1. **Modify `ComboCard` to route to Armario directly.** Rejected — `ComboCard` is reused by `Combinations` in the Colors tab (`src/screens/Combinations.tsx`), where tapping always goes to `OutfitVisualizer`. Coupling `ComboCard` to wardrobe state would leak Armario logic into the Colors tab, which is out of scope.

2. **Route both entry points via `OutfitVisualizer` with a conditional redirect.** Rejected — `OutfitVisualizer` is the correct destination when the user is exploring a combination's palette, not their personal wardrobe. The two surfaces have different information densities and back-behavior.

3. **Add an optional `onPress` prop to `ComboCard` that pre-empts its internal navigation.** **Selected.** `ComboCard` keeps its default behavior for Colors tab; Favorites passes an override; Armario surface stays decoupled. 1-line change inside `ComboCard.handleCardPress` — `onPress?.(combination.id) ?? [existing navigation]`.

Favorites intercept is async because it reads AsyncStorage for the `s0_seen` flag. During the I/O window (sub-millisecond in practice) the user cannot re-tap — the navigation fires inside the async handler and resolves before any visible jank. If AsyncStorage throws, default to S2 (less annoying than re-showing S0 every time).

### Shared component library — sizing + layout discipline

The four components are the foundation Stories 13.4b / 13.5 / 13.6 will import. Opinions land here, not in downstream stories:

- `PolaroidCard`: 92% width, `aspectRatio: 1.3`, 14pt radius, 2pt dashed border on empty, drop shadow on filled. Rotation via transform prop. Layout is intentionally static — dynamic sizing (iPad breakpoints, landscape) is an Epic 14 "iPad polish" concern, NOT this epic's scope (`project_epic13_decisions.md`: iPhone-only for Epic 13).
- `WardrobeItemThumb`: default 96pt, single Image on `wadaTokens.bgElevated` background. No overlay badges — those would couple to 13.6's completeness surface. Keep the component shape minimal; downstream stories extend via composition.
- `WadaColorDot`: decorative by default (`accessibilityElementsHidden={true}`). Size defaults to 12pt. Used inside combo-name rows where the combination name carries the semantic meaning.
- `CompletenessBadge`: three hard-coded color variants (green / amber / grey). Color constants exported from the module so tests assert mapping without duplicating hex strings. Wada green `#D4F2D4` / `#1F6D1F` and amber `#F8E4C2` / `#8B5E1F` match the UX spec screenshots at `docs/planning/feature-armario-virtual/screens/s2-ficha-wada.png`.

Export every component with a function declaration + named export (`CLAUDE.md §React Native Specifics`). `interface ComponentNameProps` required. No `export default`.

### Reduce-motion contract

S0's polaroid cascade is visually ambitious but doesn't *animate* in this story. The `useReducedMotion()` check guards **future** animations (Story 13.5 may add a stagger entry to the S4 cascade; if the pattern lands here first, it must respect reduce-motion). Today the check is a trivial `if (reducedMotion) { /* skip withSpring */ }` branch that covers 0 lines of active code. Keep the branch in the component for the downstream stories to extend without re-introducing the check.

`CLAUDE.md §Accessibility First` + NFR11 require reduce-motion respect — the defensive branch is the lowest-cost way to prove compliance without shipping dead animation code.

### S0 seen-flag contract

`@wardrobe:s0_seen_for_<combinationId>` is set only on the "opt-in" path — tapping `Empezar a asignar prendas`. The `Ahora no` and back-swipe paths leave the flag unset so the user sees S0 again next time they tap the same combo. This was the user's explicit design choice per the epic's Open Questions §5 resolution ("per-combo flag"). The rationale: S0 is the pedagogical first-time UX; if the user dismissed without opting in, they haven't completed the pedagogy yet.

Reuse of `AsyncStorage` directly (vs. the Zustand store) is deliberate — the flag is per-combo and rarely written, so a dedicated key is cheaper than adding state to the wardrobe store. If the user interaction data ever grows beyond "seen flags", promote to a `useWardrobeStore` key set, but not before.

### Navigation dependencies on the paths forward

`onOpenPicker` and `onViewLook` stub props on `ArmarioFichaWadaScreen` are the ONLY coupling points between this story and Stories 13.4b / 13.5 / 13.6. The stubs:
- Default to module-scope `__DEV__`-warn no-op closures so the production screen never crashes.
- Are optional props so Stories 13.4b / 13.5 / 13.6 can wire their real handlers via `FavoritesStack` `screenOptions` or via the `Stack.Screen`'s `initialParams`. In practice those stories will modify this screen's navigation wiring to call the S3 bottom-sheet / the S4 screen / the S5 screen instead of the stub. Keep the prop-based override in place for tests.
- Explicitly NOT wired to navigation in this story — the real nav routes don't exist yet. Do not pre-create them.

The stubs are NOT an anti-pattern — they're a dev-ergonomic way to let this story be visually complete without invalidating downstream story signatures. Both stubs emit a single `__DEV__` warn with a clear follow-up message so QA sees something tangible on-device when they reach those paths.

### Patterns to follow (MUST — from CLAUDE.md + prior stories)

- Function declarations with named exports (never `export default` — CLAUDE.md §React Native Specifics)
- `interface {ComponentName}Props` for every component (4 new components + 2 new screens — confirmed in tasks)
- NativeWind `className` for static styles; `style={{}}` ONLY for dynamic tokens (`color.hex`, `size`, `rotation`). No `StyleSheet.create` anywhere (`CLAUDE.md`).
- Haptics only through `src/lib/haptics.ts` — `hapticLight()` in this story for every interactive tap (S0 primary CTA, S0 back, S2 back, S2 slot tap, S2 view-look CTA). No `hapticMedium` / `hapticRigid` used here.
- `useReducedMotion()` from `@/hooks/useReducedMotion` — defensive branch on S0 cascade even though no animation ships today.
- All hooks declared before any early return (`CLAUDE.md §Rules of Hooks`) — especially in the "combination not found → goBack" pattern on both screens.
- Co-located `.test.tsx(x)` next to source; `testID` on every interactive element; NEVER `data-testid`.
- `__DEV__` guard on every `console.warn` / `console.error`.
- Try/catch on all SDK calls (`AsyncStorage.setItem` for the seen flag, `AsyncStorage.getItem` for the read inside the Favorites intercept).
- Localize every user-visible string — EN + ES at merge time (`NFR12`, Epic 11.2 convention). Wada color names (`nameEn`) stay untranslated — used raw inside `{{color}}` interpolation.

### Known risks to guard against

- **combinationId migration surface area.** `rg -nU "combinationId"` after the edit may miss string-built keys in comments or markdown. Restrict to `.ts` / `.tsx` files and review the diff carefully before the commit. CI's `npx tsc --noEmit` is the ultimate safety net.
- **Reanimated + Reduce Motion.** If a downstream story animates the polaroid cascade, the reduce-motion check must live at the animation call site, not inside `PolaroidCard`. Today's story doesn't animate; keep the hook call at the screen level.
- **Async S0 seen-flag write racing a fast tap.** User taps `Empezar` → `await setItem(...)` resolves → `navigation.replace` fires. A second fast tap during the await could double-fire `navigation.replace`. Guard with a ref-based `isNavigating` flag (mirror `ArmarioCaptureScreen.takePicture` `isCapturing` ref guard from Story 13.3a).
- **FavoritesList hydration window.** The store hydrates on first import (Story 13.1 Dev Notes §"Hydration race contract"). During the window, `hydrated === false` — the intercept falls through to `OutfitVisualizer` per AC #6. Tests should cover this explicitly (new test #3 in the Favorites extension).
- **Extra re-renders in FavoritesList from three new selectors.** Each `useWardrobeStore((s) => ...)` selector is independent — Zustand's default shallow-equality re-render behavior handles this, but if `assignments` mutates on every write (it does — new array identity), re-renders are proportional to wardrobe writes, which are rare. No performance concern.
- **Combination with 0 colors** (defensive). `getCombination` might return an entity with `colors: []` if data is malformed — the screens short-circuit via `goBack` inside a `useEffect`. Add a single test case covering this for each screen.
- **S2 slot card overflow on smaller devices.** The 3-column grid at iPhone SE 3rd gen width (375pt) gives each slot ~116pt before gap. `WardrobeItemThumb` default 96pt fits, but the Wada color name label may truncate. Add `numberOfLines={1}` to all color name `<Text>` elements and an `ellipsizeMode="tail"` fallback. VoiceOver reads the full name regardless.
- **ComboCard `onPress` backward compatibility.** The new optional prop is additive — existing usage (`Combinations` screen) doesn't pass it, so default behavior is unchanged. The `Combinations.test.tsx` suite must still pass 100% without edits.
- **AsyncStorage access outside the store.** `@wardrobe:s0_seen_for_<id>` is read/written directly from the screen + Favorites intercept rather than via `useWardrobeStore`. This is deliberate — the flag has nothing to do with wardrobe state reactivity, and adding it to the store would over-couple. If a future story needs reactive seen-flag behavior (unlikely — it's a one-way write-once flag), promote at that time.

### File layout (created / modified by this story)

```
src/
├── lib/
│   ├── platform.ts                              # CREATE — isIOS17OrNewer + useIsIOS17OrNewer
│   ├── platform.test.ts                         # CREATE — 4 tests
│   ├── color.ts                                 # EDIT — add hexToRgba util if not already present
│   ├── wardrobeRepo.ts                          # EDIT — combinationId: number → string across 6 signatures
│   ├── wardrobeRepo.test.ts                     # EDIT — rename 1 → "combo-1" across existing tests
│   └── wardrobeTypes.ts                         # EDIT — CombinationAssignment.combinationId: string
├── stores/
│   ├── wardrobeStore.ts                         # EDIT — isCombinationAssignment guard: typeof v.combinationId === "string"
│   └── wardrobeStore.test.ts                    # EDIT — rename 1 → "combo-1"
├── components/
│   └── armario/                                 # CREATE directory
│       ├── PolaroidCard.tsx                     # CREATE — empty / filled variants
│       ├── PolaroidCard.test.tsx                # CREATE — 5 tests
│       ├── WardrobeItemThumb.tsx                # CREATE
│       ├── WardrobeItemThumb.test.tsx           # CREATE — 3 tests
│       ├── WadaColorDot.tsx                     # CREATE
│       ├── WadaColorDot.test.tsx                # CREATE — 2 tests
│       ├── CompletenessBadge.tsx                # CREATE
│       └── CompletenessBadge.test.tsx           # CREATE — 4 tests
├── screens/
│   ├── armario/
│   │   ├── ArmarioZeroStateScreen.tsx           # CREATE
│   │   ├── ArmarioZeroStateScreen.test.tsx      # CREATE — 6 tests
│   │   ├── ArmarioFichaWadaScreen.tsx           # CREATE
│   │   ├── ArmarioFichaWadaScreen.test.tsx     # CREATE — 8 tests
│   │   └── ArmarioCaptureScreen.test.tsx        # EDIT — swap Platform.Version mock for @/lib/platform mock
│   └── FavoritesList.tsx                        # EDIT — intercept ComboCard.onPress on iOS17+ hydrated
├── components/
│   └── ComboCard.tsx                            # EDIT — add optional onPress?: (id: string) => void prop
├── navigation/
│   ├── types.ts                                 # EDIT — add ArmarioZeroState + ArmarioFichaWada to FavoritesStackParamList
│   └── FavoritesStack.tsx                       # EDIT — register the two new routes
├── i18n/locales/
│   ├── en.json                                  # EDIT — add armario.s0.* / armario.s2.* / armario.badge.* keys
│   └── es.json                                  # EDIT — same keys in Spanish
└── screens/
    └── FavoritesList.test.tsx                   # EDIT — add 3 new tests for the intercept

_bmad-output/implementation-artifacts/sprint-status.yaml
                                                 # EDIT — 13-4a status transitions (dev-story flow)
```

No edits to: `App.tsx`, `PremiumContext`, `FavoritesContext`, `ColorsStack`, `TabNavigator`, `ArmarioStack.tsx`, `ArmarioCaptureScreen.tsx` (code), `ArmarioPreviewScreen.tsx`, `Combinations.tsx`, `OutfitVisualizer.tsx`, `CaptureScreen.tsx` (Epic 12), `jest.config.js`, `jest.setup.js`, `metro.config.js`, `babel.config.js`, `tsconfig.json`, `app.json`, `package.json` (no new deps — all stack pieces already installed), `tailwind.config.js`, `biome.json`.

### References

- Epic source of truth — [docs/planning/epic-13-armario-virtual.md](../../docs/planning/epic-13-armario-virtual.md#story-134a-zero-state--ficha-wada--shared-components) §"Story 13.4a: Zero State + Ficha Wada + Shared Components"
- UX spec — [docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md](../../docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md) §S0 / §S2
- UX screenshots — [docs/planning/feature-armario-virtual/screens/s0-zero-state.png](../../docs/planning/feature-armario-virtual/screens/s0-zero-state.png) + [s2-ficha-wada.png](../../docs/planning/feature-armario-virtual/screens/s2-ficha-wada.png)
- Story 13.1 (upstream) — [_bmad-output/implementation-artifacts/13-1-wardrobe-data-model-repository-zustand-store.md](./13-1-wardrobe-data-model-repository-zustand-store.md) — repo API + hydration contract + known combinationId mismatch (unaddressed until this story)
- Story 13.3a (upstream) — [_bmad-output/implementation-artifacts/13-3a-capture-background-removal-ui-flow.md](./13-3a-capture-background-removal-ui-flow.md) — ArmarioStack + Platform.Version inline parse to retrofit with the helper
- Story 13.3b (upstream, unblocks 13.4a merge) — [_bmad-output/implementation-artifacts/13-3b-wardrobe-persistence-lifecycle.md](./13-3b-wardrobe-persistence-lifecycle.md) — WebP persistence + WardrobeItem.thumbnailPath shape consumed by WardrobeItemThumb
- wardrobeRepo source — [src/lib/wardrobeRepo.ts](../../src/lib/wardrobeRepo.ts)
- wardrobeStore source — [src/stores/wardrobeStore.ts](../../src/stores/wardrobeStore.ts)
- wardrobeTypes — [src/lib/wardrobeTypes.ts](../../src/lib/wardrobeTypes.ts)
- Combination data model — [src/data/types.ts](../../src/data/types.ts) (`Combination.id` is `string`)
- Combination lookup — [src/data/colorIndex.ts](../../src/data/colorIndex.ts) (`getCombination(combinationId: string)`)
- Favorites surface to intercept — [src/screens/FavoritesList.tsx](../../src/screens/FavoritesList.tsx)
- ComboCard shape + current navigation — [src/components/ComboCard.tsx](../../src/components/ComboCard.tsx) (hard-codes `navigation.push("OutfitVisualizer", ...)`)
- Existing Armario capture screen (iOS-17 parse to retrofit) — [src/screens/armario/ArmarioCaptureScreen.tsx](../../src/screens/armario/ArmarioCaptureScreen.tsx) (search for `supportsVision`)
- Existing Armario preview screen (pattern reference for inline styling + back chevron) — [src/screens/armario/ArmarioPreviewScreen.tsx](../../src/screens/armario/ArmarioPreviewScreen.tsx)
- Theme tokens — [src/styles/theme.ts](../../src/styles/theme.ts) (`wadaTokens.bgPaper`, `bgElevated`, `textPrimary`, `textSecondary`, `textTertiary`, `premiumAccent`)
- i18n parity test — [src/i18n/__tests__/i18n.test.ts](../../src/i18n/__tests__/i18n.test.ts) (EN/ES bidirectional key check)
- Reduce-motion hook — [src/hooks/useReducedMotion.ts](../../src/hooks/useReducedMotion.ts)
- Haptics — [src/lib/haptics.ts](../../src/lib/haptics.ts) (`hapticLight`, `hapticMedium`, `hapticRigid` — no `hapticSuccess`)
- AsyncStorage precedent for per-entity keys — [src/contexts/FavoritesContext.tsx](../../src/contexts/FavoritesContext.tsx) (optimistic write with `.catch` warn)
- Epic 13 iPhone-only decision — memory `project_epic13_decisions.md`
- Memory — `feedback_visual_review.md` (on-device + simulator screenshot checklist for UX-visible stories)
- Memory — `feedback_agent_context.md` (rich Dev Notes convention)
- Memory — `project_v140_epic13_start.md` (v1.4.0 active on `epic-13` branch, iPhone-only)
- Memory — `project_vision_cutout_quality.md` (no defensive UX for bad cutouts — no "use without cutout" fallback needed here)
- CLAUDE.md — §Story Scope (4-task cap), §React Native Specifics, §Testing Discipline, §Accessibility First, §Rules of Hooks, §Mandatory Code Review

### Project Structure Notes

- First screens under `src/screens/armario/` that render `wardrobeRepo` data (vs. 13.3a's capture-only screens which only call the background-removal module). Pattern sets the precedent for 13.4b / 13.5 / 13.6.
- First components under `src/components/armario/` — CLAUDE.md project-structure convention followed (domain-scoped subdirectory). Imports always go `screens → components`, never the reverse.
- First consumer of `wardrobeRepo.assign` / `getAssignmentsForCombination` / `isCombinationComplete` — this story validates the API shape end-to-end. If something feels wrong ergonomically, flag in Completion Notes for a follow-up polish in 13.4b rather than mutating the repo API mid-story (which would widen scope beyond the 4-task cap).
- No changes to `tailwind.config.js`, `biome.json`, `jest.config.js`, `jest.setup.js`, `metro.config.js`, `babel.config.js`, `tsconfig.json`. No new native deps — no `expo prebuild --clean` rebuild required. Pure JS/TS story.
- `src/lib/platform.ts` is the first explicitly-versioned platform helper. If we ever need more (e.g., `isIOS18OrNewer` for future APIs), extend this file rather than sprinkling `Platform.Version` checks throughout.
- Adding `ArmarioZeroState` + `ArmarioFichaWada` to `FavoritesStackParamList` is the first time `FavoritesStack` has grown beyond its original 2 routes (`FavoritesList` + `OutfitVisualizer`). No new header bar logic — all routes stay `headerShown: false` and manage their own back chevron.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — dev-story execution 2026-04-20

### Debug Log References

- `pnpm test src/lib/platform.test.ts src/lib/wardrobeRepo.test.ts src/stores/wardrobeStore.test.ts src/screens/armario/ArmarioCaptureScreen.test.tsx` → 4 suites / 32 tests pass (Task 1).
- `pnpm test src/components/armario src/lib/color.test.ts` → 5 suites / 28 tests pass (Task 2).
- `pnpm test src/screens/FavoritesList src/components/ComboCard` → 2 suites / 74 tests pass (Task 3 intercept + ComboCard onPress prop).
- `pnpm test src/screens/armario/ArmarioZeroStateScreen.test.tsx` → 6/6 pass.
- `pnpm test src/screens/armario/ArmarioFichaWadaScreen.test.tsx` → 8/8 pass.
- `npx tsc --noEmit` — clean (no type errors surface from `combinationId: number → string` migration).
- `pnpm lint` — Biome clean after `pnpm biome check --write`.
- `pnpm test` — **683 pass / 60 pre-existing debt fail** (Story 13.3b baseline: 643 / 60). **Delta: +40 net new tests, all passing.**

### Completion Notes List

**AC walkthrough (one row per AC #1–#10):**

| AC | Verified via |
|----|--------------|
| 1  | `ArmarioZeroStateScreen.test.tsx` "renders hero + subtitle + CTAs + N polaroid cards for a 3-color combo" — hero / subtitle / N polaroids / CTAs / testIDs / accessibilityLabel all asserted |
| 2  | `ArmarioZeroStateScreen.test.tsx` "primary CTA tap → hapticLight + AsyncStorage.setItem + navigation.replace" + "secondary/back → goBack + NO write" |
| 3  | `FavoritesList.test.tsx` "iOS 17+ hydrated + 1 assignment → routes to ArmarioFichaWada" + `ArmarioFichaWadaScreen` renders nav row + CompletenessBadge + instruction line + wardrobe label |
| 4  | `ArmarioFichaWadaScreen.test.tsx` "empty slot shows dashed `+` + Assign →" and "filled slot shows WardrobeItemThumb + Change →"; tap fires `hapticLight + onOpenPicker({ combinationId, colorIndex })` stub |
| 5  | `ArmarioFichaWadaScreen.test.tsx` "view-look CTA disabled when 0 assignments" + "fires onViewLook stub when 3/3" + "fires stub when partial (2/3)"; stubs default to module-scope `__DEV__` warn |
| 6  | `FavoritesList.test.tsx` 3 new intercept tests: iOS17+hydrated+0 → S0, iOS17+hydrated+1 → S2, iOS<17 → OutfitVisualizer (NFR9 parity); intercept lives in `FavoritesList.handleComboPress`, `ComboCard` stays reusable via new optional `onPress` prop (default behavior unchanged) |
| 7  | `src/lib/platform.ts` (new) + `platform.test.ts` 4 tests (iOS≥17, iOS<17, Android, string/number Version). `ArmarioCaptureScreen` retrofitted to `useIsIOS17OrNewer()`; existing test #7 updated to mock `@/lib/platform` instead of `Platform.Version` |
| 8  | 4 components under `src/components/armario/` with function-declared named exports + `interface ComponentNameProps` + 5+3+2+4 = 14 co-located tests; screens → components dependency direction preserved |
| 9  | Every interactive element has `accessibilityLabel`+`accessibilityRole`; S0 polaroids expose localized `t("armario.s0.polaroidA11y", { color })`; S2 slot cards expose `slotA11yAssigned/Unassigned`; CompletenessBadge exposes `t("armario.badge.a11y")`; 44×44 pt min touch verified on all Pressables |
| 10 | Full test sweep: `+4 platform / +5 PolaroidCard / +3 WardrobeItemThumb / +2 WadaColorDot / +4 CompletenessBadge / +5 hexToRgba / +6 S0 screen / +8 S2 screen / +3 FavoritesList intercept` = **+40 net new tests**, baseline **643 → 683 passing**, zero NEW failures vs 13.3b baseline; `npx tsc --noEmit` + `pnpm lint` clean |

**Scope decisions worth flagging:**

1. **`combinationId: number → string` migration.** Completed mechanically across `wardrobeTypes.ts`, `wardrobeStore.ts` (isCombinationAssignment guard), `wardrobeRepo.ts` (6 signatures), and all repo/store tests (`1 → "combo-1"`, `42 → "combo-42"`, etc.). `rg "combinationId: number|combinationId: [0-9]"` → only hit is the intentional negative-case fixture in `wardrobeStore.test.ts` line 75. Rationale: Story 13.1 oversight caught late; Story 13.4a is first consumer joining assignments to combos.
2. **ArmarioCaptureScreen retrofit.** Removed local `supportsVisionSegmentation()` and `Platform` import; `useIsIOS17OrNewer()` takes its place. Existing 8 tests still pass (test #7 swapped mock from `Platform.Version` to `@/lib/platform`).
3. **ComboCard optional `onPress`.** Added 1 prop + 3 lines (`if (onPress) { onPress(combination.id); return; }`). Haptic still fires in `ComboCard.handleCardPress` — Favorites intercept does NOT re-fire. Colors-tab behavior unchanged (`onPress` absent → legacy `navigation.push("OutfitVisualizer", …)`).
4. **Reduce-motion branch.** Kept as forward-looking scaffolding (no animation ships today); test asserts the cascade still renders under `useReducedMotion() === true`. Story 13.5's cascade stagger animation will attach at this branch.
5. **i18n parity.** Added 18 new keys under `armario.s0` / `armario.s2` / `armario.badge` to both EN + ES; `src/i18n/__tests__/i18n.test.ts` "es.json has exactly the same keys as en.json" passes. The 3 pre-existing `detectLanguage()` failures are Intl-mock debt unrelated to 13.4a.
6. **Stub props (`onOpenPicker`, `onViewLook`).** Declared as optional props on `ArmarioFichaWadaScreen` defaulting to module-scope `__DEV__`-warn closures. Tests intercept via prop overrides. Stories 13.4b/13.5/13.6 wire real handlers without touching this story's signatures.

**On-device visual review (Task 4.9) deferred:** on-device smoke will be run as part of QA after code review (matching the Story 13.3b on-device-deferred pattern). Unit tests cover all behavioral ACs; layout work is static (no Reanimated/Skia yet) — on-device will confirm spacing/typography against `docs/planning/feature-armario-virtual/screens/s0-zero-state.png` + `s2-ficha-wada.png`.

### File List

**Created**
- `src/lib/platform.ts` — `isIOS17OrNewer()` + `useIsIOS17OrNewer()`
- `src/lib/platform.test.ts` — 4 tests
- `src/components/armario/WadaColorDot.tsx`
- `src/components/armario/WadaColorDot.test.tsx` — 2 tests
- `src/components/armario/WardrobeItemThumb.tsx`
- `src/components/armario/WardrobeItemThumb.test.tsx` — 3 tests
- `src/components/armario/CompletenessBadge.tsx` — exports `COMPLETENESS_COLORS`
- `src/components/armario/CompletenessBadge.test.tsx` — 4 tests
- `src/components/armario/PolaroidCard.tsx`
- `src/components/armario/PolaroidCard.test.tsx` — 5 tests
- `src/screens/armario/ArmarioZeroStateScreen.tsx`
- `src/screens/armario/ArmarioZeroStateScreen.test.tsx` — 6 tests
- `src/screens/armario/ArmarioFichaWadaScreen.tsx`
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx` — 8 tests

**Modified**
- `src/lib/wardrobeTypes.ts` — `CombinationAssignment.combinationId: number → string`
- `src/lib/wardrobeRepo.ts` — 6 signatures: `combinationId: number → string`
- `src/lib/wardrobeRepo.test.ts` — rename numeric literals to `combo-*` string ids
- `src/stores/wardrobeStore.ts` — `isCombinationAssignment` guard: `typeof v.combinationId === "string"`
- `src/stores/wardrobeStore.test.ts` — rename fixture + corrupt-shape test payload
- `src/lib/color.ts` — added `hexToRgba(hex, alpha)` util
- `src/lib/color.test.ts` — 5 tests for `hexToRgba`
- `src/screens/armario/ArmarioCaptureScreen.tsx` — replace inline parse with `useIsIOS17OrNewer()`
- `src/screens/armario/ArmarioCaptureScreen.test.tsx` — swap `Platform.Version` mock for `@/lib/platform` mock (test #7)
- `src/components/ComboCard.tsx` — added optional `onPress?: (id: string) => void` prop
- `src/screens/FavoritesList.tsx` — intercept combo taps on iOS 17+ hydrated; route to S0/S2/OutfitVisualizer per AC #6
- `src/screens/FavoritesList.test.tsx` — +3 new tests for Armario intercept + pre-existing mocks (platform, wardrobe store, AsyncStorage)
- `src/navigation/types.ts` — added `ArmarioZeroState` + `ArmarioFichaWada` routes to `FavoritesStackParamList`
- `src/navigation/FavoritesStack.tsx` — register the 2 new screens
- `src/i18n/locales/en.json` — added `armario.s0.*`, `armario.s2.*`, `armario.badge.*`
- `src/i18n/locales/es.json` — same keys in Spanish

**Sprint status**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 13-4a: ready-for-dev → in-progress → review

## Change Log

| Date | Change |
|------|--------|
| 2026-04-20 | Story 13.4a implemented: S0 Zero State + S2 Ficha Wada + 4 shared Armario components + Favorites combo-tap intercept + centralized iOS-17 gate helper (`src/lib/platform.ts`) + `combinationId: number → string` migration. +40 net new tests, `tsc --noEmit` + `pnpm lint` clean, zero new regressions vs Story 13.3b baseline. |
