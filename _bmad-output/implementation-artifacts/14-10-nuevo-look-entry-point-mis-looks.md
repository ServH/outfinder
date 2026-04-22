# Story 14.10: "+ Nuevo look" entry point card in Mis Looks

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **returning user on the Mis Looks tab whose armario is already populated (or empty) and who wants to start a fresh look without launching the unified camera capture flow**,
I want **a narrative "+ Nuevo look" card rendered as the top-most item on the Mis Looks screen (both in the empty state and at the top of the `FlatList` when the list is populated) that, on tap, fires `hapticLight()` and cross-navigates to the Wada palette discovery home (`ColorsTab → ColorHome`) via the root navigator pattern Story 14.6 established**,
so that **the Mis Looks tab exposes an always-visible "start a new look" entry point (FR15), empty-state users have a protagonist CTA that frames the tab's purpose, populated-list users can start a new look without scrolling past completed looks to find the FAB camera, and the tap never mutates `favorites` / `assignments` (pure read-only navigation — the Mis Looks slot is consumed only when the user later assigns a garment or taps "Guardar para luego" per Stories 14.8 + 14.9)**.

## Acceptance Criteria

1. **Given** `src/screens/FavoritesList.tsx` renders with ANY state (empty OR populated), **When** the render tree is inspected, **Then** a new shared component `<NewLookCtaCard />` (or an inline `<Pressable testID="mis-looks-new-look-cta">` block — implementer's choice per AC #2 rationale) renders as the FIRST visible card below the existing `header` (the `<View>` at `FavoritesList.tsx:226–259` that carries "Mis Looks" + gear icon). **And** the card renders inside BOTH branches of the current state machine:
    - **Empty-state branch** (`FavoritesList.tsx:261–274`, rendered when `combinations.length === 0`): the card is inserted BETWEEN `{header}` and `<EmptyState .../>` so that the CTA sits as the "protagonist" above the muted helper copy (per UX-DR4 `ux-design-epic-14.md:487–506` empty-state wireframe).
    - **Populated-list branch** (`FavoritesList.tsx:277–313`): the card is the **first row of the `FlatList.ListHeaderComponent`** — it renders ABOVE the existing `sort-pills-row`. Specifically, wrap the existing `listHeaderComponent` memo's returned JSX in a `<View>` that renders the CTA card FIRST and THEN the existing `sort-pills-row` `<View>` as a sibling below. Do NOT remove or re-order the sort pills; they remain exactly where they are, just pushed down by the new card above. The card scrolls with content (non-sticky) per UX-DR4 line 517.

2. **Given** the card's implementation, **When** code is inspected, **Then** the implementation lives in a new standalone component file `src/components/armario/NewLookCtaCard.tsx` with a co-located `NewLookCtaCard.test.tsx`. Rationale: (a) the card is consumed in TWO places inside `FavoritesList.tsx` (empty branch + populated `ListHeaderComponent`) — DRY via a shared component avoids JSX duplication; (b) the Epic 14 memory `project_v140_epic14_progress.md` plus the CLAUDE.md "Story Scope" rule reward component extraction when two call-sites share the same JSX; (c) follows the 14.8 precedent of creating `src/components/armario/MisLooksLimitStrip.tsx` for a two-callsite reusable (even though 14.9 ended up only consuming it once, the discipline paid off). The component's props interface is:
    ```tsx
    export interface NewLookCtaCardProps {
        onPress: () => void;
    }
    ```
    **And** named export (per CLAUDE.md "React Native Specifics"). **And** NO default export. **And** function declaration (not arrow function) at the file top level. **And** colocate the test file in the same directory.

3. **Given** the `<NewLookCtaCard>` visual contract per UX-DR4 `ux-design-epic-14.md:452–513`, **When** rendered, **Then** the root `<Pressable>`:
    - `testID="mis-looks-new-look-cta"`
    - `accessibilityRole="button"`
    - `accessibilityLabel={t("favorites.newLookCta.a11yLabel")}` → resolves to `"Empezar un look nuevo"` (ES) / `"Start a new look"` (EN) per AC #7
    - `accessibilityHint={t("favorites.newLookCta.a11yHint")}` → resolves to `"Explora paletas de Sanzo Wada para empezar un look"` (ES) / `"Explore Sanzo Wada palettes to start a look"` (EN) per AC #7
    - `className="mx-4 mt-3 mb-2 flex-row items-center bg-elevated rounded-xl"` — Tailwind for static layout. `bg-elevated` resolves to `#f5f5f3` (verified at `tailwind.config.js:10`); `rounded-xl` = 12pt radius per UX-DR4 line 511.
    - `style={{ minHeight: 48, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: wadaTokens.hairline }}` — UX-DR4 "hairline border" + "48pt minimum height". `wadaTokens.hairline` resolves to `rgba(0,0,0,0.08)` per `src/styles/theme.ts:12`. Dynamic-ish tokens stay in `style`, layout stays in `className` (per CLAUDE.md "React Native Specifics": `className` for static, `style` only for dynamic Wada values — hairline is tokenized so it goes in `style`).
    - `onPress={handlePress}` where `handlePress = () => { hapticLight(); props.onPress(); }` — haptic centralized in the card component; navigation is `onPress`-injected by the parent (testable without navigation mocking inside the card's unit tests).
    - **Internally:** the root is a row layout (`flex-row items-center`) with three children: (a) `<SymbolView name="sparkles" size={22} tintColor={wadaTokens.wadaMuted} style={{ marginRight: 12 }} />` — UX-DR4 line 510 "sparkle (✨ SF Symbol `sparkles`) or a minimalist hanger glyph — Pencil test both." Implementer picks `sparkles` (resolves Pencil TODO in favor of sparkles; rationale in Dev Notes); (b) a text column `<View style={{ flex: 1 }}>` with two `<Text>` nodes stacked vertically:
        - title: `{t("favorites.newLookCta.title")}` → `"Empieza un look nuevo"` / `"Start a new look"`. Style: `{ fontFamily: "NotoSerifJP_500Medium", fontSize: 16, color: wadaTokens.textPrimary, marginBottom: 2 }` (Noto Serif JP per UX-DR4 "Noto Serif JP title" line 462).
        - subtitle: `{t("favorites.newLookCta.subtitle")}` → `"Explora las paletas de Sanzo Wada y arma tu look"` / `"Explore Sanzo Wada palettes and build your look"`. Style: `{ fontFamily: "Inter_400Regular", fontSize: 13, color: wadaTokens.textSecondary }` (Inter per UX-DR4 "Inter subtitle" line 463).
    - (c) a trailing chevron `<SymbolView name="chevron.right" size={14} tintColor={wadaTokens.textSecondary} style={{ marginLeft: 8 }} />` to reinforce "this goes somewhere" per UX-DR4 line 461 `→` arrow glyph in the wireframe.
    - **Do NOT** add a shadow. UX-DR4 line 512 states "bg-elevated" + "hairline border" — NOT a drop-shadow. The Pencil TODO "flat (hairline border) vs elevated (shadow) vs tinted (slight Wada accent)" at `ux-design-epic-14.md:534` is resolved in favor of **flat hairline**: (i) the sort-pills row already uses `bg-elevated` chips with no shadow, preserving visual consistency; (ii) iOS 17's design idiom favors ghost/flat affordances over skeuomorphic elevation; (iii) fewer GPU layers on a screen that already renders a 2-col ComboCard grid with shadow = perf sanity.

4. **Given** `FavoritesList.tsx` needs to wire the card's `onPress` to the cross-tab navigator, **When** the wiring is implemented, **Then** a new `handleNewLookPress` inner function is declared inside `FavoritesList()` (after the existing `handleSettingsPress` at line 67–70) that cross-navigates to `ColorsTab → ColorHome` via the **root navigator pattern Story 14.6 established** at `src/screens/OutfitVisualizer.tsx:195–206`:
    ```tsx
    function handleNewLookPress() {
        const rootNav =
            navigation
                .getParent()
                ?.getParent<NativeStackNavigationProp<RootStackParamList>>();
        rootNav?.navigate("Main", {
            screen: "ColorsTab",
            params: {
                screen: "ColorHome",
            },
        } as never);
    }
    ```
    **And** the import `import type { NativeStackNavigationProp } from "@react-navigation/native-stack"` is already present at `FavoritesList.tsx:8`; the `RootStackParamList` type must be added to the existing types import at line 30: `import type { FavoritesStackParamList, RootStackParamList, TabParamList } from "@/navigation/types"`. **And** `RootStackParamList` already exists at `src/navigation/types.ts:60–66` with `Main: undefined` — no type-file changes needed. **And** `ColorsTab: { screen: keyof ColorsStackParamList } | undefined` and `ColorHome: undefined` already exist at `types.ts:27` + `:6` — the navigate call type-checks byte-for-byte. **And** no `hapticLight()` call lives in `handleNewLookPress` (the card component fires the haptic before calling `props.onPress`). **And** no `testID` change; no `isNavigating` guard (this cross-nav doesn't deep-link into a heavy screen, and the one-shot navigate through root is idempotent — React Navigation dedupes rapid double-navs to the same route).

5. **Given** the tap is a **pure navigation action**, **When** `handlePress` fires, **Then** it MUST NOT write to `useMisLooksStore` (no `addFavorite`, no `toggleFavorite`, no `assign`, no `remove*`), MUST NOT call `AsyncStorage`, MUST NOT read or mutate `gate` (`usePremiumGate`), MUST NOT call `AccessibilityInfo.announceForAccessibility`, and MUST NOT trigger the paywall modal — regardless of `favorites.size` (free user at 5/5 still gets the navigation; the 5/5 gate only applies to Ficha Wada slot writes and "Guardar para luego" per Stories 14.8 + 14.9). **And** `combinations` / `favorites` / `assignments` are byte-identical before and after the press — the epic AC "*no Mis Looks entry is created by the mere act of navigating*" (epic-14.md:724) is satisfied structurally: the card has zero write paths.

6. **Given** the empty-state layout (UX-DR4 `ux-design-epic-14.md:488–505`), **When** `combinations.length === 0`, **Then** the empty-state branch renders:
    ```
    [Header — Mis Looks + gear]
    [NewLookCtaCard]              ← new, protagonist
    [EmptyState title="Aún no tienes looks guardados" subtitle="Fotografía una prenda o escoge una paleta para empezar."]
    ```
    **And** the existing `EmptyState` component at `FavoritesList.tsx:269–272` is UNCHANGED — no prop changes, no wrapper changes. **And** the card's `marginTop` (via `className="mt-3"` per AC #3) separates it from the header's `paddingBottom: 8`. **And** the `<EmptyState>` still renders below the card using its own `flex-1 items-center justify-center` layout — the card occupies its intrinsic height (~80pt including paddings) at the top; EmptyState takes the remaining flex. **And** the epic AC "*the '+ Nuevo look' affordance is still visible and prominent. And the empty state does NOT hide this entry point*" (epic-14.md:728–729) is satisfied.

7. **Given** the FOUR new i18n keys this story needs — `favorites.newLookCta.title`, `favorites.newLookCta.subtitle`, `favorites.newLookCta.a11yLabel`, `favorites.newLookCta.a11yHint` × 2 locales — **When** this story merges, **Then** the following key-value pairs are added to `src/i18n/locales/es.json` inside the existing `"favorites"` block at lines 48–59 (insert as a nested `"newLookCta"` sub-block AFTER `"emptySubtitle"` at line 58, so the block stays scannable):
    - ES `favorites.newLookCta.title`: `"Empieza un look nuevo"` (exact copy from UX-DR4 canonical table `ux-design-epic-14.md:765`)
    - ES `favorites.newLookCta.subtitle`: `"Explora las paletas de Sanzo Wada y arma tu look"` (exact copy from UX-DR4 `:766`)
    - ES `favorites.newLookCta.a11yLabel`: `"Empezar un look nuevo"` (UX-DR4 line 526 a11y label)
    - ES `favorites.newLookCta.a11yHint`: `"Explora paletas de Sanzo Wada para empezar un look"` (UX-DR4 line 526 a11y hint)

    **And** the EN mirrors at `src/i18n/locales/en.json` (matching key block):
    - EN `favorites.newLookCta.title`: `"Start a new look"` (UX-DR4 `:765`)
    - EN `favorites.newLookCta.subtitle`: `"Explore Sanzo Wada palettes and build your look"` (UX-DR4 `:766`)
    - EN `favorites.newLookCta.a11yLabel`: `"Start a new look"`
    - EN `favorites.newLookCta.a11yHint`: `"Explore Sanzo Wada palettes to start a look"`

    **And** `flattenKeys(es).sort() === flattenKeys(en).sort()` per `src/i18n/i18n.test.ts:40` still passes — if a key mismatch survives, fix it before merging (the parity test catches both missing-ES and missing-EN cases automatically).

8. **Given** accessibility requirements per CLAUDE.md "Accessibility First", **When** the card is inspected, **Then**:
    - The Pressable's effective touch target is ≥ 44×44pt — the `minHeight: 48` + full-card pressable satisfies this with margin to spare.
    - `accessibilityRole="button"` (per AC #3) — VoiceOver announces "botón" / "button" before the label.
    - `accessibilityLabel` + `accessibilityHint` resolved via `t(...)` (per AC #3/#7) — VoiceOver reads the label first and the hint after a pause.
    - `AccessibilityInfo.announceForAccessibility` is **not** called on tap — navigation transitions are announced by React Navigation's own screen-read integration (consistent with the rest of the app; see `FavoritesList.tsx:126–157` `handleComboPress` which also does not explicitly announce the nav).
    - Reduce Motion: the card is static (no entry animation, no transform). `AccessibilityInfo.isReduceMotionEnabled` does NOT need to be consulted — there's nothing to suppress.
    - Dynamic Type: the title uses `fontSize: 16` + subtitle `fontSize: 13` inline; iOS 17 handles font-size scaling on raw `Text` elements via `allowFontScaling` (default true). No override needed — consistent with the rest of `FavoritesList.tsx` where titles use the same pattern at lines 231–238.

9. **Given** the existing `FavoritesList.test.tsx` covers the populated + empty + settings-button + sort-pills cases (see lines 15–140 for mock shape), **When** this story lands, **Then** the test file is extended with the following cases (added inside the existing `describe("FavoritesList", ...)` block at line ~145+):
    1. **(AC #1, empty branch)** `"renders the Nuevo look CTA in empty state"` — with `mockFavorites = new Set()` so `combinations.length === 0`; `render(<FavoritesList />)`; assert `getByTestId("mis-looks-new-look-cta")` is truthy; assert `getByTestId("empty-state")` is still truthy; assert the CTA renders BEFORE the empty-state in the tree (compare `getAllByTestId(...)` index ordering or use `within()`).
    2. **(AC #1, populated branch)** `"renders the Nuevo look CTA as first ListHeader item when list is populated"` — with `mockFavorites = new Set(["sample-combo-id"])` + seed `getCombination` to return a valid combo; render; assert `getByTestId("mis-looks-new-look-cta")` is truthy AND `getByTestId("sort-pills-row")` is also truthy AND the CTA testID appears BEFORE the sort-pills testID in document order (use `toJSON()` traversal or an index query per RNTL conventions).
    3. **(AC #4, navigation)** `"tapping the CTA navigates to Main → ColorsTab → ColorHome via root"` — set up a nav mock that exposes `getParent().getParent().navigate` as a `jest.fn()`; `fireEvent.press(getByTestId("mis-looks-new-look-cta"))`; assert `rootNavigate` (the spied nested `navigate`) was called once with exact args `["Main", { screen: "ColorsTab", params: { screen: "ColorHome" } }]`.
    4. **(AC #3, haptic)** `"tapping the CTA fires hapticLight"` — `fireEvent.press(...)`; assert `hapticLight` (already mocked at line 113–116 of the test file) was called once.
    5. **(AC #5, no store mutation)** `"tapping the CTA does not call toggleFavorite / addFavorite / assign"` — the existing `mockToggleFavorite` spy must NOT be called; additionally add `mockAddFavorite = jest.fn()` (if not already present in the mock shape) and assert it was NOT called.
    6. **(AC #3, a11y)** `"CTA has correct accessibility attributes"` — assert the Pressable has `accessibilityRole === "button"`, `accessibilityLabel` matches the i18n ES/EN resolved string (check existing test convention — some tests assert on the key, some on the resolved string; mirror whichever the rest of the file uses), and the rendered minHeight is ≥ 44.
    7. **(AC #3, sparkles SF Symbol)** `"renders sparkles SymbolView inside the CTA"` — query the card subtree for the SymbolView mock with `name === "sparkles"`; follow the existing mock convention (the file mocks SymbolView at line 95–97 as `"SymbolView"` string, which renders as a host component; use a `toJSON()` traversal to find a node with prop `name: "sparkles"` inside the CTA subtree).

    **And** `src/components/armario/NewLookCtaCard.test.tsx` (new) covers the card **in isolation**:
    1. `"renders title + subtitle from i18n keys"` — assert both text nodes exist.
    2. `"tap fires hapticLight and calls onPress"` — assert both via spies.
    3. `"renders sparkles SF Symbol + chevron.right trailing glyph"` — assert via mock traversal.
    4. `"has correct accessibility contract"` — `accessibilityRole="button"`, label + hint.

    **And** the net test delta vs the 14.9 done baseline (**893 passing / 3 pre-existing (`i18n.test.ts > detectLanguage` Intl-mock branch) / 896 total** at `epic-14` HEAD `a222cdd`) is **+10 to +14 net new passing tests** — target post-story: **903 to 907 passing / 3 pre-existing / 0 new failures / 0 new skips**. If the count lands outside `905 ± 2`, investigate before commit.

10. **Given** the component-extraction discipline (AC #2), **When** `NewLookCtaCard.tsx` is authored, **Then** it must NOT re-implement `useTranslation` in a way that requires `Suspense` or alters the parent's `t` resolution — inside the card, call `const { t } = useTranslation();` at the top of the function body, matching the `FavoritesList.tsx:62` pattern. **And** the card MUST NOT import `useNavigation` or `NavigationContainer` — navigation is the parent's responsibility (parent injects `onPress`). **And** the card MUST NOT import `useMisLooksStore` or any store — it's display-only. This keeps the unit test trivially mockable without a full `NavigationContainer` wrap.

11. **Given** the populated-list mental model where the card sits above the sort-pills row, **When** the user scrolls down, **Then** the card scrolls off-screen with the rest of the content (non-sticky per UX-DR4 line 517). **And** the `FlatList`'s `ListHeaderComponent` prop receives a composition:
    ```tsx
    const listHeaderComponent = useMemo(
        () => (
            <View>
                <NewLookCtaCard onPress={handleNewLookPress} />
                <View testID="sort-pills-row" className="flex-row gap-2 px-4 py-3">
                    {/* existing pills unchanged */}
                </View>
            </View>
        ),
        [sortMode, t, handleNewLookPress],
    );
    ```
    **Note:** `handleNewLookPress` should be captured in the `useMemo` deps — but since React-Navigation's `navigation` object is stable across renders, the memo will not thrash. If lint complains about the missing dep, ADD `navigation` to the deps array rather than disabling the lint (the inner call chain `navigation.getParent()?.getParent()?.navigate` uses the current navigation reference, so correctness requires the stable ref).

12. **Given** UX-DR4's explicit guidance at `ux-design-epic-14.md:509–511`:
    > *"The '+ Nuevo look' card is a single-item at the top of the scroll, not a FAB and not a list item."*
    
    **When** the implementation is reviewed, **Then** the card MUST NOT be implemented as a FlatList `data`-row entry (which would mix it with `Combination` items and force type-union shenanigans in `renderItem`); MUST NOT be implemented as a floating FAB (which would conflict with the existing tab-bar cradle FAB for the camera); MUST NOT be implemented with `position: absolute`. It IS implemented as a `ListHeaderComponent` prefix + empty-state prefix only, as specified in AC #1 and AC #11.

13. **Given** `pnpm test` runs after all changes, **When** the full suite completes, **Then** the delta vs the **893 passing / 3 pre-existing / 896 total baseline** from Story 14.9 done (at `epic-14` HEAD `a222cdd` — verify locally with `git log -1 epic-14` and `pnpm test`) is **+10 to +14 net new passing tests**. Pre-existing failures (`i18n.test.ts > detectLanguage` Intl-mock branch) MUST remain at 3 — if a new failure surfaces, pause and debug (do NOT skip or mark `.skip`).

14. **Given** `npx tsc --noEmit` + `pnpm lint`, **When** both run on this story branch, **Then**:
    - `tsc` zero new errors.
    - `pnpm lint` has the SAME 2 pre-existing Biome format errors as 14.9 baseline (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx` / deferred D-14.7-4) and ZERO new findings. The NEW files (`NewLookCtaCard.tsx` + `NewLookCtaCard.test.tsx`) and MODIFIED file (`FavoritesList.tsx` + locales JSON) must pass `biome check` cleanly. Run `pnpm lint --write` once on the new files before commit; if `FavoritesList.tsx` itself gets auto-formatted, accept only the diff scoped to this story's edits (revert any unrelated reformatting with `git checkout --` to keep the PR diff scannable, per the 14.9 AC #14 precedent).
    - Per CLAUDE.md: function declarations, named exports (`NewLookCtaCard`), `NewLookCtaCardProps` interface, NativeWind `className` for static layout + `style={{}}` for dynamic/token values, haptics via `lib/haptics.ts` only (no direct `expo-haptics` import), NO `StyleSheet.create`.
    - Per `feedback_native_module_rebuild.md`: this story is pure JS/TSX + JSON edits, NO native module touched → `expo start --clear` is sufficient for visual smoke; full `expo run:ios` is NOT required.

15. **Given** the branching convention per `feedback_workflow.md`, **When** this story starts, **Then** the dev agent creates branch `story/14-10-nuevo-look-entry-point-mis-looks` off `epic-14` HEAD (commit `a222cdd` — Story 14.9 merge). Diff scope:
    - **NEW**: `src/components/armario/NewLookCtaCard.tsx`, `src/components/armario/NewLookCtaCard.test.tsx`
    - **MODIFIED**: `src/screens/FavoritesList.tsx` (+ `handleNewLookPress` inner fn, + `<NewLookCtaCard>` in both empty + populated branches, + `RootStackParamList` added to existing types import), `src/screens/FavoritesList.test.tsx` (+ ~6–8 new cases, + root-nav mock adapter for `getParent().getParent()`), `src/i18n/locales/es.json` + `src/i18n/locales/en.json` (+ `favorites.newLookCta.*` sub-block × 4 keys × 2 locales = 8 values)
    - **NOT TOUCHED** (any edit = scope creep): `ColorHome`, `ColorsStack`, `FavoritesStack`, `navigation/types.ts` (type-only read), `misLooksStore.ts`, `usePremiumGate.ts`, `PremiumPaywall.tsx`, `wardrobeRepo.ts`, `MisLooksLimitStrip.tsx`, `ArmarioFichaWadaScreen.tsx`, any native module, `app.json`.

## Tasks / Subtasks

- [x] **Task 1** — Create the shared `NewLookCtaCard` component with i18n + haptic + full a11y contract (AC: #2, #3, #8, #10)
  - [x] Create `src/components/armario/NewLookCtaCard.tsx`. Imports: `SymbolView` from `expo-symbols`; `Pressable, Text, View` from `react-native`; `useTranslation` from `react-i18next`; `hapticLight` from `@/lib/haptics`; `wadaTokens` from `@/styles/theme`.
  - [x] Define `export interface NewLookCtaCardProps { onPress: () => void }`.
  - [x] Export `function NewLookCtaCard(props: NewLookCtaCardProps)` — named export, function declaration.
  - [x] Inside the function body: `const { t } = useTranslation();` at line 1. Define `function handlePress() { hapticLight(); props.onPress(); }` as an inner declaration.
  - [x] Return the Pressable per AC #3: testID `mis-looks-new-look-cta`, role button, a11y label + hint from `t("favorites.newLookCta.a11yLabel")` + `t("favorites.newLookCta.a11yHint")`, `className="mx-4 mt-3 mb-2 flex-row items-center bg-elevated rounded-xl"`, `style={{ minHeight: 48, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: wadaTokens.hairline }}`, `onPress={handlePress}`.
  - [x] Children: (a) leading `<SymbolView name="sparkles" size={22} tintColor={wadaTokens.wadaMuted} style={{ marginRight: 12 }} />`; (b) text column `<View style={{ flex: 1 }}>` with Noto Serif JP title + Inter subtitle per AC #3; (c) trailing `<SymbolView name="chevron.right" size={14} tintColor={wadaTokens.textSecondary} style={{ marginLeft: 8 }} />`.
  - [x] Run `pnpm lint --write src/components/armario/NewLookCtaCard.tsx` — expect zero findings.

- [x] **Task 2** — Wire the card into `FavoritesList.tsx` (empty branch + populated `ListHeaderComponent`) + add `handleNewLookPress` cross-nav to `ColorsTab → ColorHome` (AC: #1, #4, #5, #6, #11, #12)
  - [x] At `src/screens/FavoritesList.tsx`:
    - Add `RootStackParamList` to the existing types import at line 30: `import type { FavoritesStackParamList, RootStackParamList, TabParamList } from "@/navigation/types";`
    - Add import for the new card: `import { NewLookCtaCard } from "@/components/armario/NewLookCtaCard";`
  - [x] Add inner function `handleNewLookPress` after `handleSettingsPress` at line ~70, implementing the exact body from AC #4 (root-nav through `getParent()?.getParent<NativeStackNavigationProp<RootStackParamList>>()` → `navigate("Main", { screen: "ColorsTab", params: { screen: "ColorHome" } } as never)`). NO `hapticLight()` call here (the card fires it).
  - [x] **Empty-state branch (FavoritesList.tsx:261–274)**: insert `<NewLookCtaCard onPress={handleNewLookPress} />` BETWEEN `{header}` and `<EmptyState ... />`. Do NOT modify the outer `<View testID="favorites-list" ...>` wrapper or the `<EmptyState>` props.
  - [x] **Populated-list branch (FavoritesList.tsx:189–224 `listHeaderComponent` useMemo)**: wrap the existing `sort-pills-row` `<View>` inside a new outer `<View>` that renders `<NewLookCtaCard onPress={handleNewLookPress} />` first, then the `sort-pills-row` `<View>` as its sibling. Update the `useMemo` deps to include `handleNewLookPress` (it closes over `navigation`, which is stable — no thrash) OR reference the navigation object directly in the deps array if the lint insists.
  - [x] Confirm zero regression to existing logic: `handleSettingsPress`, `handleComboPress`, `renderComboCard`, `listHeaderComponent`'s sort-pill mapping, FlatList columns — all unchanged in behavior.
  - [x] Run `pnpm lint --write src/screens/FavoritesList.tsx` and review the diff before staging — revert any formatting that Biome applies to pre-existing lines (to keep the PR diff minimal per AC #14).

- [x] **Task 3** — Add 4 new i18n keys × 2 locales under `favorites.newLookCta.*` (AC: #7)
  - [x] `src/i18n/locales/es.json`: inside the `"favorites"` block at lines 48–59, AFTER `"emptySubtitle"` at line 58, append the following nested object (add a trailing comma to the prior key):
    ```json
    "newLookCta": {
        "title": "Empieza un look nuevo",
        "subtitle": "Explora las paletas de Sanzo Wada y arma tu look",
        "a11yLabel": "Empezar un look nuevo",
        "a11yHint": "Explora paletas de Sanzo Wada para empezar un look"
    }
    ```
  - [x] `src/i18n/locales/en.json`: mirror inside the matching `"favorites"` block:
    ```json
    "newLookCta": {
        "title": "Start a new look",
        "subtitle": "Explore Sanzo Wada palettes and build your look",
        "a11yLabel": "Start a new look",
        "a11yHint": "Explore Sanzo Wada palettes to start a look"
    }
    ```
  - [x] Run `pnpm test src/i18n/i18n.test.ts` — confirm the `flattenKeys(es).sort() === flattenKeys(en).sort()` parity assertion still passes. If it fails, diff the two locale files until the keys match exactly.

- [x] **Task 4** — Write `NewLookCtaCard.test.tsx` (isolation tests) + extend `FavoritesList.test.tsx` (integration tests) per AC #9 (AC: #1, #3, #4, #5, #6, #8, #9, #13)
  - [x] Create `src/components/armario/NewLookCtaCard.test.tsx`. Mock `expo-symbols` (`SymbolView` as string), `react-i18next` (either use the real provider or mock `useTranslation` to return an identity `t` — mirror whichever shape the rest of `src/components/armario/*.test.tsx` uses), `@/lib/haptics` (`hapticLight` as `jest.fn()`). Render with a `onPress={jest.fn()}` spy; cover the 4 cases from AC #9.
  - [x] Extend `src/screens/FavoritesList.test.tsx` with the 7 new cases from AC #9 inside the existing `describe("FavoritesList", ...)` block. Add a `rootNavigate` spy adapter — the current mock at lines 80–89 returns a flat `{ push, navigate, goBack }` object, which means `getParent()` is `undefined`. Extend the mock shape:
    ```tsx
    const mockRootNavigate = jest.fn();
    jest.mock("@react-navigation/native", () => ({
        useNavigation: () => ({
            push: mockPush,
            navigate: jest.fn(),
            goBack: jest.fn(),
            getParent: () => ({
                getParent: () => ({
                    navigate: mockRootNavigate,
                }),
            }),
        }),
        useFocusEffect: (cb: () => void) => {
            mockFocusEffectCallback = cb;
        },
    }));
    ```
    This keeps existing tests green (they don't call `getParent`) while enabling the new "navigates to ColorHome" assertion.
  - [x] Run `pnpm test src/components/armario/NewLookCtaCard` + `pnpm test src/screens/FavoritesList` — both must be green before running the full suite.
  - [x] Run full `pnpm test` — expect **903 to 907 passing / 3 pre-existing / 906 to 910 total**. If a new failure surfaces, investigate immediately (do NOT skip or mark `.skip` per CLAUDE.md "Testing Discipline").

- [x] **Task 5** — Quality gates + AC walkthrough + sprint-status handoff + branch hygiene (AC: #13, #14, #15)
  - [x] `npx tsc --noEmit` → expect zero new errors.
  - [x] `pnpm lint` → expect 2 pre-existing Biome format errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx` / D-14.7-4) and ZERO new findings. Confirm via `git stash && pnpm lint && git stash pop` if the count is ambiguous.
  - [x] Walk through AC #1–#15 point-by-point (per CLAUDE.md "Acceptance Criteria Verification" rule) and document evidence in the Completion Notes table below.
  - [x] Update `_bmad-output/implementation-artifacts/sprint-status.yaml`:
      - Set `development_status[14-10-nuevo-look-entry-point-mis-looks]` to `in-progress` (when starting dev) then to `review` (when dev-story task complete).
      - Append dated note following the 14.9 convention (test delta numbers, FR/UX-DR refs, branch, no native rebuild flag).
  - [x] Commit on branch `story/14-10-nuevo-look-entry-point-mis-looks` off `epic-14` HEAD `a222cdd`. Do NOT merge into `epic-14` — awaits adversarial code-review per CLAUDE.md "Mandatory Code Review" rule.
  - [x] Per `feedback_visual_review.md`: flag Alejandro for Expo simulator visual smoke AFTER dev-story completes and BEFORE code-review. Visual-changes checklist: (a) "+ Nuevo look" card renders at top of Mis Looks tab in EMPTY state (above "Aún no tienes looks guardados" helper); (b) same card renders at top of Mis Looks tab in POPULATED state, above the sort-pills row and the combo grid; (c) sparkles SF Symbol glyph appears on the left, chevron.right on the right; (d) Noto Serif JP title + Inter subtitle typography; (e) hairline border + `bg-elevated` background (NO shadow); (f) tap fires a subtle haptic and cross-navigates to the ColorHome screen (palette catalog); (g) back-nav or tab-switch to Mis Looks after navigating away leaves Mis Looks unchanged (no new favorites written, no side effects).

## Dev Notes

### Why this story is a clean "additive surface" on top of Epic 14

Stories 14.7–14.9 reshaped the *semantics* of the Mis Looks tab (rename, auto-save, explicit save CTA). Story 14.10 reshapes its *geometry* — adding a single always-visible entry point card. The surface is small, the logic is pure-navigation, and the component boundary is clean (two call-sites → shared component).

**Do NOT** touch `ArmarioFichaWadaScreen.tsx`, `ArmarioPickerScreen.tsx`, `MisLooksLimitStrip.tsx`, `usePremiumGate.ts`, `PremiumPaywall.tsx`, `misLooksStore.ts`, or any navigation type file. Every one of those is a signal of scope creep. The only screen modified is `FavoritesList.tsx`.

### Cross-tab navigation — reusing Story 14.6's root-nav pattern

Story 14.6 established the root-nav pattern at `src/screens/OutfitVisualizer.tsx:195–206` for jumping from ColorsStack (or FavoritesStack) into a sibling tab. The reason (documented in that comment) is that sibling tab stacks share the root-stack parent but not each other's stacks directly — a local `navigation.navigate("ColorHome")` from `FavoritesList` would fail because `ColorHome` is registered in `ColorsStack`, not `FavoritesStack`. Going through root via `getParent()?.getParent()?.navigate("Main", { screen: "ColorsTab", params: { screen: "ColorHome" } })` is the idiomatic React Navigation 7 approach.

**Trade-off (inherited):** swipe-back from `ColorHome` after this navigation does NOT return to Mis Looks — it follows ColorsStack's own back behavior (whatever was on the stack before, or the tab's root). This is acceptable: the user explicitly navigated "start a new look", so landing on ColorHome and exploring is the goal; if they want to return to Mis Looks, they tap the tab icon. Matches 14.6's "Hacer este look mío" trade-off documented in its comments.

### Why a shared component (`NewLookCtaCard`) and not inline JSX

The card is rendered in TWO places inside `FavoritesList.tsx`:
1. In the empty-state branch at lines 261–274.
2. As the first child of the `ListHeaderComponent` in the populated branch at lines 189–224.

Inlining the ~40-line Pressable + children block twice would be a smell. Extracting to `src/components/armario/NewLookCtaCard.tsx` mirrors 14.8's discipline of extracting `MisLooksLimitStrip` (even though it ended up at one call-site post-scope-refine, the extraction paid off for test isolation). This story's card is guaranteed two call-sites — the extraction is unambiguous.

Component boundary design:
- **Responsibility:** render visual + fire haptic.
- **Not responsible for:** navigation, store mutation, i18n-lazy-loading, paywall.
- **Injected props:** `onPress` — the parent decides where it goes. The card is reusable even if a future screen wants a similar "explore palettes" entry (e.g., SettingsTab empty-state, or a deep-link landing page).

### Haptic placement — why inside the card, not the parent

Precedent: `FavoritesList.tsx:67–70` fires `hapticLight()` inside `handleSettingsPress` — a parent-level handler. That's fine because the settings button is owned by the parent.

For the CTA card, the haptic is a UX property of the card itself (tap = feedback, regardless of where onPress goes). Firing inside the card (per AC #3) means any future consumer of the component gets the haptic "for free" and cannot accidentally forget it. The parent handler becomes trivially testable — no haptic mocking needed for integration tests at the parent level (the parent test only checks `rootNavigate` was called; the card's unit test checks `hapticLight` was fired).

### SF Symbol choice — `sparkles` over `hanger`/`tshirt-stacked`

UX-DR4 line 510 lists three candidates and a Pencil TODO at line 533: *"Icon choice: archivebox vs hanger vs sparkles vs tshirt-stacked."* This story picks **sparkles** for the card (NOT the tab icon — the tab icon `archivebox` was set in Story 14.7 and is out of scope here). Rationale:

1. **Wireframe fidelity.** UX-DR4 lines 458 + 493 both draw `✨` in the card mockup. Sparkles is the default in the approved UX.
2. **Meaning.** Sparkles implies "possibility / inspiration" — matches the "start a new look" invitation. `hanger` would imply "store a new item" (which is what the camera tab does). `tshirt-stacked` implies "browse your wardrobe" (the wrong affordance).
3. **Glyph weight.** Sparkles is visually light — at 22pt it reads as an accent, not a dominant element. The serif title remains the protagonist. `hanger` as a solid glyph would fight the title for visual weight.
4. **SF Symbol validity.** `sparkles` is confirmed valid in iOS 17+ SF Symbols catalog. `hanger` is NOT a standard SF Symbol (same finding as Story 14.7, which fell back to `archivebox` for the tab). `tshirt-stacked` exists as `tshirt.fill` but rendering it at 22pt in a card header reads as "item" not "inspiration".

If Pencil iteration later swaps to another glyph, it's a one-char edit at one call-site. Non-blocking for this story.

### Shadow vs flat — resolving the Pencil TODO

UX-DR4 line 534: *"Card visual: flat (hairline border) vs elevated (shadow) vs tinted (slight Wada accent)."* This story picks **flat + hairline border** (no shadow, no tint). Rationale in AC #3 (iii) above: consistency with the sort-pills row, iOS 17 idioms, and perf on a screen that already renders shadowed ComboCards. If future UX iteration wants a tint or shadow, the card's `className`/`style` can absorb the change in one place.

### Card placement in `ListHeaderComponent` — NOT as a FlatList data row

Two alternative implementations were considered and rejected:

**Rejected A:** Make the card a data-row entry in `combinations`, with a special sentinel item at index 0 (e.g., `{ id: "__NEW_LOOK_CTA__", ... }`). `renderComboCard` branches on the sentinel. **Why rejected:** (a) pollutes the `Combination[]` type; (b) forces type-union shenanigans in `renderItem`; (c) breaks `sortFavoritesByCompleteness` and `sortMode` logic (the sentinel would need special handling in each sort branch); (d) conflicts with UX-DR4 "not a list item" guidance.

**Rejected B:** Make the card a floating FAB above the `FlatList`. **Why rejected:** (a) the CustomTabBar already owns a FAB for the camera entry; two FABs on the same screen is visual chaos; (b) UX-DR4 "not a FAB" guidance is explicit; (c) floating elements complicate scroll-hide or scroll-shrink patterns if added later.

**Chosen:** `ListHeaderComponent` prefix (per UX-DR4 line 509 "single-item at the top of the scroll"). Simpler, type-clean, and structurally correct.

### i18n key namespacing — why `favorites.newLookCta.*` and not a new top-level namespace

Options considered:
- `favorites.newLookCta.*` (chosen) — groups under the screen's existing namespace; ES key block stays cohesive at lines 48–59.
- `tabs.newLook.*` — would group under tab-related keys, but the CTA is screen content, not tab chrome. Wrong namespace.
- `armario.newLook.*` — the armario namespace is for Ficha Wada + picker content (see `armario.s2.*` used heavily in 14.8–14.9). The CTA isn't armario-specific; it navigates to Wada palette discovery, which is a ColorsTab affair.

`favorites.newLookCta.*` is the cleanest logical home. The post-14.7 i18n reality is that "favorites" is the internal namespace for the Mis Looks tab screen (the user-visible label changed to "Mis Looks" via the `title` value, but the key path preserves `favorites.*` for backward compat — see Story 14.7 D-14.7-3 on the orphan `tabs.favs` key which was deferred intentionally). This story follows the same convention.

### Navigation types — no types file edits needed

`RootStackParamList` already exists at `src/navigation/types.ts:60–66`. `TabParamList.ColorsTab` at line 27 already accepts `{ screen: keyof ColorsStackParamList }`. `ColorsStackParamList.ColorHome: undefined` at line 6 is already the right shape. The navigate call in `handleNewLookPress` type-checks exactly as written — verify with `npx tsc --noEmit` on the branch.

The `as never` cast on the `navigate` call mirrors the 14.6 `OutfitVisualizer.handleMakeMine` pattern — React Navigation's generated types for nested navigators require the cast due to a long-standing TS limitation in their type inference. NOT a workaround; it's the documented idiom.

### Testing strategy — why isolate the card AND cover it in FavoritesList

Two test files serve two distinct purposes:
- **`NewLookCtaCard.test.tsx` (unit)** — asserts the card's own contract: i18n text, haptic on tap, role/label/hint, SF Symbol glyphs. This is the regression firewall when Pencil iterates on the card's visual without touching `FavoritesList.tsx`.
- **`FavoritesList.test.tsx` (integration)** — asserts the wiring: empty-branch + populated-branch render the card, tap navigates through root to `ColorHome`, tap does NOT mutate state. This is the regression firewall when FavoritesList is refactored.

Avoiding duplicated assertions across the two files: the card's internal a11y label copy lives in the unit tests. The integration tests assert existence + tap-wired-correctly but NOT the exact copy strings (those belong in the card's unit tests and the i18n parity test).

### Known risks / edge cases

- **`getParent()?.getParent()` returning `undefined` in tests.** The current `FavoritesList.test.tsx` nav mock returns a flat object — calling `.getParent()` on it returns `undefined`. The new integration test for "navigates to ColorHome" extends the mock to nest `getParent: () => ({ getParent: () => ({ navigate: mockRootNavigate }) })`. Existing tests do NOT call `getParent`, so they are unaffected. Assert this assumption by running the full `FavoritesList.test.tsx` before and after the mock-shape extension.
- **Populated-state `useMemo` deps warning.** Wrapping the new card + the existing `sort-pills-row` inside a single header memo means `handleNewLookPress` is now a dependency. Because `handleNewLookPress` closes over `navigation`, and React Navigation 7 gives a stable `navigation` ref, the memo won't thrash. If Biome's `useExhaustiveDependencies` complains, add `navigation` to the deps array (NOT `handleNewLookPress` — React hooks lint will let you get away with just the ref the closure actually uses).
- **Empty-state layout shift.** The `<EmptyState>` component uses `flex-1 items-center justify-center` to center-fill its container. Inserting the card ABOVE it means EmptyState now sees less vertical space. Visually this should still look balanced (header ~80pt + card ~80pt leaves enough room for EmptyState's two short lines). Validate in simulator; if EmptyState crowds the card, adjust the card's `mb-2` to `mb-4`.
- **Double-tap race.** Two rapid taps on the CTA before React Navigation transitions could theoretically fire `rootNavigate` twice. React Navigation dedupes same-route navigates at the navigator level, so the net effect is one transition. No handler-level guard is needed (unlike `handleComboPress` at line 128–129 which uses `isNavigating.current` because that path does `AsyncStorage.getItem` + conditional `push`, a more expensive async chain that's worth guarding).
- **i18n ES-special-char encoding.** The existing es.json uses `\u00f1` for `ñ` + `\u00e9` for `é` (see lines 53/55). For consistency, the new ES keys should use the same Unicode escape convention. Alternative: write literal UTF-8 chars (`"Empieza un look nuevo"`) — the JSON parser handles both identically, but matching the file's existing style keeps the PR diff clean. Implementer choice; if Biome auto-formats, accept whatever it produces.
- **Biome JSON format nit.** Inserting a nested object literal after `"emptySubtitle"` requires a trailing comma on that line. Double-check the comma placement to avoid a parse error — the parity test at `i18n.test.ts:40` loads both files via `import` which will fail loudly on malformed JSON.
- **Sparkles SF Symbol fallback.** On iOS < 17 (pre-Story 13's iOS 17 minimum), `SymbolView` falls back to a placeholder. Outfinder's minimum deployment target is iOS 17 (see Epic 13's `project_epic13_decisions.md`), so this isn't a live concern — sparkles renders natively on all supported devices.

### Project Structure Notes

**Files touched (5):**
- `src/components/armario/NewLookCtaCard.tsx` — NEW (the shared card component, ~45 lines incl. interface + JSX)
- `src/components/armario/NewLookCtaCard.test.tsx` — NEW (4 unit tests)
- `src/screens/FavoritesList.tsx` — MODIFIED (+ 2 imports: `NewLookCtaCard` + `RootStackParamList`; + `handleNewLookPress` inner fn; + `<NewLookCtaCard>` in empty branch; + `<NewLookCtaCard>` wrapped around sort-pills inside `listHeaderComponent`)
- `src/screens/FavoritesList.test.tsx` — MODIFIED (+ `mockRootNavigate` + nav mock shape extension with `getParent().getParent().navigate`; + 7 new test cases)
- `src/i18n/locales/es.json` + `src/i18n/locales/en.json` — MODIFIED (+ nested `newLookCta` block with 4 keys × 2 locales = 8 values under `favorites.*`)

**Files NOT touched (intentionally):**
- `src/navigation/types.ts` — `RootStackParamList` already exists; type-only read.
- `src/navigation/ColorsStack.tsx` — `ColorHome` route already registered by Story 1.x; untouched here.
- `src/navigation/FavoritesStack.tsx` — no stack-shape changes.
- `src/navigation/CustomTabBar.tsx` — the Mis Looks tab icon + label were set in Story 14.7; unchanged here.
- `src/screens/armario/*` — armario screens own their own affordances (Stories 14.8 + 14.9); this story is a sibling surface, not a modification.
- `src/stores/misLooksStore.ts` — no reads, no writes (the card is pure navigation).
- `src/hooks/usePremiumGate.ts` + `src/components/PremiumPaywall.tsx` — no paywall involvement (pure nav, no slot consumption).
- `src/lib/wardrobeRepo.ts` + `src/lib/armario/*` — no wardrobe data paths.
- Any native module or `app.json` / `ios/` — pure JS.

**Sprint-status file update is the only non-source artifact modified** (per convention). No new i18n namespaces, no new routes, no new stack types, no new store slices.

### Testing Standards Summary

Per CLAUDE.md "Testing Discipline":
- Every AC describing user interaction has a corresponding test case (per AC #9's 7 integration cases + 4 unit cases = 11 new cases).
- `testID` attributes (React Native convention): `mis-looks-new-look-cta` (new, on the card's root Pressable). Existing `sort-pills-row`, `empty-state`, `favorites-list`, `grid-${n}col` preserved.
- Test interactions (tap fires haptic, tap calls onPress, tap does NOT mutate store, nav mock receives exact args) NOT just rendering.
- Co-located: `NewLookCtaCard.test.tsx` sits alongside `NewLookCtaCard.tsx` in `src/components/armario/`. `FavoritesList.test.tsx` is already co-located with its screen.
- Jest mocks reuse project's existing patterns (AsyncStorage via `async-storage-mock`, SymbolView → host-component string, navigation fns via manual mocks, haptics via `jest.fn()`). REUSE, don't invent.

### React Navigation 7 specifics relevant to this story

- `getParent<T>()` returns `undefined` when the current navigator is the root — robust code (and tests) must `?.`-chain. The CTA handler does this correctly.
- Nested navigate via `navigate("Main", { screen: "ColorsTab", params: { screen: "ColorHome" } })` uses the React Navigation 7 nested navigation API (stable since v6, unchanged in v7). The `as never` cast works around a TS inference limitation in the generic navigate signature — NOT a codebase-specific wart.
- React Navigation 7 is confirmed at `package.json` (project runs React Navigation 7 per CLAUDE.md line 5).

### References

- **Epic spec**: [epic-14.md §Story 14.10](../../docs/planning/epic-14.md#story-1410--nuevo-look-entry-point-in-mis-looks) lines 704–738 — covers FR15, depends on UX-DR4.
- **Epic functional requirement**: [epic-14.md:97](../../docs/planning/epic-14.md#functional-requirements) — "*The Mis Looks tab exposes a '+ Nuevo look' entry point (button or card) that navigates to the Wada palette catalog, allowing experienced users to start a new look without going through the camera.*"
- **UX-DR4**: `docs/planning/ux-design-epic-14.md:446–535` — Mis Looks tab layout (empty + populated wireframes), card visual contract (`bg-elevated`, hairline, 48pt min, 12pt radius), sparkles SF Symbol, Noto Serif JP + Inter typography, a11y (`accessibilityLabel="Empezar un look nuevo"`, `accessibilityHint="Explora paletas de Sanzo Wada para empezar un look"`), haptic (`hapticLight`), interaction (tap → ColorHome, scroll with content not sticky), Pencil TODOs resolved to sparkles + flat.
- **UX-DR4 haptic contract**: `docs/planning/ux-design-epic-14.md:800` — "*Mis Looks '+ Nuevo look' card tap | hapticLight | Navigation.*"
- **UX-DR4 canonical copy table**: `docs/planning/ux-design-epic-14.md:765–766` — "Empieza un look nuevo" / "Start a new look" + "Explora las paletas de Sanzo Wada y arma tu look" / "Explore Sanzo Wada palettes and build your look".
- **Cross-nav pattern precedent**: `src/screens/OutfitVisualizer.tsx:195–206` — Story 14.6's `handleMakeMine` establishes `navigation.getParent()?.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Main", { screen: "...", params: {...} } as never)` as the idiomatic cross-tab nav. This story uses the exact same pattern, only the target tab + screen differ.
- **Navigation types (read-only)**: `src/navigation/types.ts:5–6, :26–30, :60–66` — `ColorsStackParamList.ColorHome`, `TabParamList.ColorsTab`, `RootStackParamList.Main`. All exist; no type edits.
- **Previous story (14.9)**: `_bmad-output/implementation-artifacts/14-9-guardar-para-luego-ficha-wada.md` — test baseline 893/3/896 at `epic-14` HEAD `a222cdd`. Biome lint baseline: 2 pre-existing format errors in `FavoritesList.test.tsx` + `OutfitVisualizer.tsx` (deferred D-14.7-4 carry-over).
- **Foundational story (14.7)**: `_bmad-output/implementation-artifacts/14-7-mis-looks-tab-rename-icon.md` — establishes the "Mis Looks" label via `t("favorites.title")`; i18n convention for reusing the `favorites.*` namespace.
- **FavoritesList screen baseline**: `src/screens/FavoritesList.tsx` — line numbers referenced in this spec reflect the state at `epic-14` HEAD `a222cdd`:
    - `:8` — `@react-navigation/native-stack` import (reuse `NativeStackNavigationProp`)
    - `:9` — `SymbolView` import (reuse)
    - `:28` — `hapticLight` import from `@/lib/haptics` (reused inside the new card, NOT in the parent)
    - `:30` — types import (ADD `RootStackParamList`)
    - `:62` — `useTranslation` + `t` (already present; card has its own call)
    - `:63` — `useNavigation<FavoritesListNav>()` (already present; no shape change)
    - `:67–70` — `handleSettingsPress` (mirror its inner-function-declaration pattern for `handleNewLookPress`)
    - `:189–224` — `listHeaderComponent` useMemo (WRAP the existing sort-pills View inside a new outer View that renders the card first)
    - `:226–259` — `header` JSX (REUSE as-is; card renders BELOW it in both branches)
    - `:261–274` — empty-state branch (INSERT card between header and EmptyState)
    - `:277–313` — populated-list branch (NO structural edit — the card enters via `ListHeaderComponent`)
- **FavoritesList test baseline**: `src/screens/FavoritesList.test.tsx:1–140` — mock shape for `useMisLooksStore`, `useNavigation`, `expo-symbols`, haptics, `usePremium`, `usePremiumGate`. Extend nav mock to support `getParent().getParent()` for this story.
- **UX-DR4 tab bar decisions (out of scope here)**: UX-DR4 lines 519–523 set the tab icon (`archivebox`) and label via Story 14.7 — NOT re-touched by this story.
- **Memory references**:
    - `project_v140_epic14_progress.md` — confirms 14.10 is next in Epic 14 backlog order.
    - `feedback_workflow.md` — branch off `epic-14` HEAD `a222cdd`, minimal user interaction.
    - `feedback_visual_review.md` — Alejandro validates Expo simulator visual smoke after dev-story, before code-review.
    - `feedback_native_module_rebuild.md` — N/A (pure JS/TSX + JSON).
    - `feedback_simulator_reset.md` — `expo start --clear`, never erase simulators.
    - `feedback_tailwind_tokens.md` — N/A (no utility-prefixed color keys; card uses `bg-elevated` which is defined cleanly at `tailwind.config.js:10`).
    - `feedback_no_patches.md` — the CTA + handler implement FR15 at root-cause, not via prop-patching.
    - `feedback_always_validate.md` — checklist validation runs automatically on create-story.
    - `feedback_agent_context.md` — story-file enrichment is mandatory per project convention.
    - `feedback_no_analytics.md` — N/A (no metrics SDK; no analytics-gated behavior).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Opus 4.7, 1M context)

### Debug Log References

- Biome `useExhaustiveDependencies` flagged `handleNewLookPress` as a missing dep of `listHeaderComponent`'s `useMemo`. Resolved by promoting `handleNewLookPress` to `useCallback([navigation])` so the memo deps become `[sortMode, t, handleNewLookPress]` — stable, lint-clean, no suppression. Matches AC #11's fallback guidance.
- Pre-existing 14.9 baseline confirmed before edits: 893 passing / 3 pre-existing / 896 total at `epic-14` HEAD `a222cdd`. Post-story: 905 / 3 / 908 — delta **+12 net new passing tests** (inside AC #9/#13 target 905 ± 2 ✅).
- Biome lint: 2 pre-existing format errors remain (`FavoritesList.test.tsx` lines 273–277 + 477–481 `"Photograph a garment..."` block carry-over, `OutfitVisualizer.tsx` D-14.7-4 handleMakeMine block). New files (`NewLookCtaCard.tsx` + `.test.tsx`) and story edits pass `biome check` cleanly. 0 new findings. Matches AC #14.
- `npx tsc --noEmit`: zero errors.

### Completion Notes List

**Story 14.10 — "+ Nuevo look" entry-point card in Mis Looks — implementation complete, ready for adversarial code-review.**

Branch: `story/14-10-nuevo-look-entry-point-mis-looks` off `epic-14` HEAD `a222cdd`.

**AC evidence walkthrough:**

| AC | Verdict | Evidence |
| --- | --- | --- |
| #1 Card renders first below header in both branches | ✅ | Empty branch: `FavoritesList.tsx` renders `<NewLookCtaCard onPress={handleNewLookPress} />` between `{header}` and `<EmptyState />`. Populated branch: card is the first child of the `listHeaderComponent` memo's outer `<View>`, above `sort-pills-row`. Tests: `renders the Nuevo look CTA in empty state`, `renders the Nuevo look CTA as first ListHeader item when list is populated`. |
| #2 Shared component extraction + named export | ✅ | `src/components/armario/NewLookCtaCard.tsx` — `export function NewLookCtaCard(props: NewLookCtaCardProps)`, `export interface NewLookCtaCardProps { onPress: () => void }`. Consumed in two places in `FavoritesList.tsx`. Test co-located at `NewLookCtaCard.test.tsx`. |
| #3 Visual + haptic + a11y contract | ✅ | testID, role, label, hint, `className="mx-4 mt-3 mb-2 flex-row items-center bg-elevated rounded-xl"`, style (minHeight 48, paddings 16, hairline border), sparkles leading + chevron.right trailing SymbolViews, NotoSerifJP_500Medium title + Inter_400Regular subtitle, `handlePress` fires `hapticLight()` then `props.onPress()`. Verified by 4 unit tests. |
| #4 `handleNewLookPress` cross-nav via root | ✅ | Promoted to `useCallback([navigation])` (semantics identical to AC's inline function — needed for memo dep stability, see Debug Log). Test `tapping the CTA navigates to Main → ColorsTab → ColorHome via root` asserts `mockRootNavigate("Main", { screen: "ColorsTab", params: { screen: "ColorHome" } })`. |
| #5 Zero store mutation on press | ✅ | Test `tapping the CTA does not mutate favorites (no toggleFavorite, no premium gate)` asserts neither `mockToggleFavorite` nor `mockHandlePremiumGate` fires. Handler writes no state, touches no AsyncStorage, doesn't read `usePremiumGate`. |
| #6 Empty-state protagonist layout | ✅ | Header → card → EmptyState in that order. `EmptyState` props unchanged. |
| #7 4 new i18n keys × 2 locales | ✅ | `favorites.newLookCta.{title, subtitle, a11yLabel, a11yHint}` added after `emptySubtitle` in both `es.json` and `en.json` with exact UX-DR4 canonical copy. i18n parity test passes. |
| #8 Accessibility | ✅ | `minHeight: 48` + full-Pressable ≥44pt touch target. Role=button, label + hint from i18n. No `announceForAccessibility` on tap. No entry animation → no Reduce Motion gate needed. |
| #9 Test coverage | ✅ | `NewLookCtaCard.test.tsx`: 4 unit tests. `FavoritesList.test.tsx`: 7 new integration cases. Full suite: **905 passing / 3 pre-existing / 908 total** (delta +12). |
| #10 Component isolation | ✅ | Card only imports `expo-symbols`, `react-i18next`, `react-native`, `@/lib/haptics`, `@/styles/theme`. No `useNavigation`, no `useMisLooksStore`, no `Suspense`. |
| #11 ListHeaderComponent composition | ✅ | Memo returns outer `<View>` wrapping `<NewLookCtaCard>` + `<View testID="sort-pills-row">`. Deps `[sortMode, t, handleNewLookPress]` — lint-clean. |
| #12 NOT a FlatList row / NOT a FAB / NOT absolute | ✅ | Card is `ListHeaderComponent` prefix (populated) + inline prefix (empty). No `position: absolute`, no FAB, no sentinel `Combination` row. |
| #13 Test count delta | ✅ | 893 → 905 passing = +12 (inside +10..+14). 3 pre-existing unchanged. 0 new failures, 0 new skips. |
| #14 tsc + lint | ✅ | `npx tsc --noEmit` clean. `pnpm lint`: 2 pre-existing format errors (identical to 14.9 baseline). 0 new Biome findings. CLAUDE.md conventions honored: function declaration, named exports, `NewLookCtaCardProps` interface, `className` static + `style` tokens, haptics via `@/lib/haptics`, no `StyleSheet.create`. Pure JS/TSX + JSON → no `expo run:ios` rebuild required. |
| #15 Branch hygiene + diff scope | ✅ | Branch `story/14-10-nuevo-look-entry-point-mis-looks` off `a222cdd`. Diff scope respected byte-for-byte. |

**Implementation deviation from AC (documented):**
- AC #4 specifies `handleNewLookPress` as a function declaration. Implementation uses `useCallback([navigation])` instead because Biome's `useExhaustiveDependencies` required a stable ref inside `listHeaderComponent`'s `useMemo`. Semantics identical (handler closes over the stable `navigation` ref). AC #11 itself permits this ("OR reference the navigation object directly in the deps array if the lint insists" — equivalent outcome).

**Visual smoke (2026-04-22):** ✅ Validado por Alejandro en simulador Expo. Checklist (a)–(o) confirmado: card renderiza arriba en EMPTY entre header y EmptyState, arriba en POPULATED sobre sort-pills (scrollea con contenido, no sticky), glifos sparkles + chevron.right correctos, tipografía Noto Serif JP + Inter, `bg-elevated` + hairline sin shadow, tap dispara hapticLight + cross-nav a ColorHome, estado Mis Looks inalterado al volver, copias ES/EN correctas, VoiceOver lee label + hint con rol botón.

**Awaiting:** Adversarial code-review gate before merge into `epic-14`.

### Change Log

- 2026-04-22 — Dev-story complete. NEW `NewLookCtaCard.tsx` + `.test.tsx`. Wired into `FavoritesList.tsx` (empty branch + populated `ListHeaderComponent`). Added `handleNewLookPress` cross-nav through root to `Main → ColorsTab → ColorHome`. Added 4 i18n keys × 2 locales under `favorites.newLookCta.*`. Tests: 905/3/908 (delta +12 from 14.9 baseline 893/3/896). tsc clean; Biome baseline unchanged (2 pre-existing format errors carried over). Status: in-progress → review.

### File List

- **NEW** `src/components/armario/NewLookCtaCard.tsx` — shared Pressable card (sparkles leading + NotoSerifJP title + Inter subtitle + chevron.right trailing); fires `hapticLight` then calls injected `onPress`.
- **NEW** `src/components/armario/NewLookCtaCard.test.tsx` — 4 unit tests (renders i18n keys, haptic + onPress wiring, sparkles + chevron.right glyphs, a11y contract).
- **MODIFIED** `src/screens/FavoritesList.tsx` — added `NewLookCtaCard` + `RootStackParamList` imports; added `handleNewLookPress = useCallback([navigation])` cross-nav; card inserted in empty-state branch between header and EmptyState; `listHeaderComponent` memo now wraps card above existing `sort-pills-row` with deps `[sortMode, t, handleNewLookPress]`.
- **MODIFIED** `src/screens/FavoritesList.test.tsx` — added `mockRootNavigate` + nested `getParent().getParent().navigate` nav-mock adapter; added 7 new integration test cases inside the existing `describe("FavoritesList", ...)` block.
- **MODIFIED** `src/i18n/locales/es.json` — added nested `favorites.newLookCta` block (4 keys) after `favorites.emptySubtitle`.
- **MODIFIED** `src/i18n/locales/en.json` — mirror of the ES block (4 keys) after `favorites.emptySubtitle`.
- **MODIFIED** `_bmad-output/implementation-artifacts/sprint-status.yaml` — `14-10-...` transitioned `ready-for-dev → in-progress → review` with dated notes.
