# Story 14.7: Mis Looks tab — rename + icon swap

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user opening v1.4.0 on the bottom Tab Bar rendered by `src/navigation/CustomTabBar.tsx` (iPhone cradle layout lines 184–342; iPad flat 3-item layout lines 96–182) and landing on the Favorites stack (`src/navigation/FavoritesStack.tsx` — `FavoritesTab` route, screen root `FavoritesList` at `src/screens/FavoritesList.tsx:61`)**,
I want **the Favorites tab user-visible surface re-labelled "Mis Looks" / "My looks" and its `heart` SF Symbol swapped for `archivebox` (Apple-native, iOS 13+, suggests "things stored" per UX-DR4 line 521 — `hanger` is NOT a valid SF Symbol so `archivebox` is the final pick, not a placeholder), and the FavoritesList header title + screen accessibility label + empty-state header updated to match, and the two i18n locale test assertions at `src/i18n/__tests__/i18n.test.ts:55` and `:64` updated to the new strings**,
so that **users perceive the tab as *their workspace* (where their Mis Looks entries live — created via auto-save from 14.8 or "Guardar para luego" from 14.9) rather than a bookmark list (FR11), the migration from v1.3.0 feels continuous ("my things have a new home" per UX-DR4 line 529 — no migration banner needed, the content does the talking), and no user-visible string anywhere inside the FavoritesTab still says "Favoritos" / "Favorites"**.

## Acceptance Criteria

1. **Given** the four user-visible i18n keys in `src/i18n/locales/es.json` lines 5 (`tabs.favorites: "Favoritos"`), 9 (`tabs.favoritesTab: "Pestaña de favoritos"`), 49 (`favorites.title: "Favoritos"`), 50 (`favorites.screenLabel: "Pantalla de Favoritos"`), 57 (`favorites.emptyTitle: "Sin favoritos aún"`), 58 (`favorites.emptySubtitle: "Elige un color, explora combinaciones y toca ♡ para guardar las que te gusten"`), **When** this story merges, **Then** those 6 ES values become exactly:
    - `tabs.favorites`: `"Mis Looks"`
    - `tabs.favoritesTab`: `"Pestaña Mis Looks"`
    - `favorites.title`: `"Mis Looks"`
    - `favorites.screenLabel`: `"Pantalla Mis Looks"`
    - `favorites.emptyTitle`: `"Aún no tienes looks guardados"`
    - `favorites.emptySubtitle`: `"Fotografía una prenda o escoge una paleta para empezar."`

    **And** the EN mirrors at `src/i18n/locales/en.json` lines 5, 9, 49, 50, 57, 58 become:
    - `tabs.favorites`: `"My looks"`
    - `tabs.favoritesTab`: `"My looks tab"`
    - `favorites.title`: `"My looks"`
    - `favorites.screenLabel`: `"My looks screen"`
    - `favorites.emptyTitle`: `"No saved looks yet"`
    - `favorites.emptySubtitle`: `"Photograph a garment or pick a palette to begin."`

    **And** key parity holds (`flattenKeys(es).sort() === flattenKeys(en).sort()` — the existing assertion at `src/i18n/__tests__/i18n.test.ts:40` continues to pass byte-for-byte). **And** the orphan `tabs.favs: "Favs"` / `"Favs"` stays untouched (no consumer per `grep -rn "tabs\.favs\b" src` — removing it is out of scope).

2. **Given** `src/navigation/CustomTabBar.tsx` currently renders `<SymbolView name="heart" ... />` on the Favorites tab at line 164 (iPad layout) and line 277 (iPhone layout), **When** this story merges, **Then** both occurrences change to `name="archivebox"`, **And** NO fill-on-active variant is added in this story (the Colors tab's existing `paintpalette` stays static-outline; keeping `archivebox` static-outline preserves tab-bar visual consistency — UX-DR4's "outlined (inactive), filled (active) — standard SF Symbol pattern" is deferred as a follow-up D-14.7-1 since paintpalette doesn't follow it either and breaking symmetry for one tab looks incoherent). **And** the `tintColor` active/inactive logic (`isFavsActive ? COLORS_DARK : wadaTokens.wadaMuted`) stays byte-for-byte. **And** the label `.toUpperCase()` call at lines 177 + 290 that uppercases `t("tabs.favorites")` keeps rendering `"MIS LOOKS"` / `"MY LOOKS"` without code change (the i18n value swap at AC #1 flows through automatically).

3. **Given** `src/screens/FavoritesList.tsx:238` renders the large screen title via `{t("favorites.title")}`, lines 266 + 297 set `accessibilityLabel={t("favorites.screenLabel")}`, and line 270 / 271 render `t("favorites.emptyTitle")` / `t("favorites.emptySubtitle")` in the empty-state `<EmptyState>` component, **When** this story merges, **Then** NO code change is required at those sites — the i18n swap at AC #1 propagates automatically. **And** `src/screens/OutfitVisualizer.tsx:81` (the back-label derivation `backLabel = t("favorites.title")` when the Visualizer was pushed from `FavoritesList`) correctly reads "Mis Looks" / "My looks" after the swap with zero code change.

4. **Given** the locale test at `src/i18n/__tests__/i18n.test.ts:55` asserts `expect(tEN("tabs.favorites")).toBe("Favorites")` and `:64` asserts `expect(tES("tabs.favorites")).toBe("Favoritos")`, **When** this story merges, **Then** those two lines become `.toBe("My looks")` and `.toBe("Mis Looks")` respectively (literal string update, single-character-accurate). All other test cases in that file stay untouched.

5. **Given** `src/screens/FavoritesList.test.tsx` has 23 test cases but NONE asserts the literal "Favorites" / "Favoritos" screen copy (verified via `grep -nE "Favorit|favorites\.title|favorites\.emptyTitle" src/screens/FavoritesList.test.tsx` — matches only in jest.mock setup + imports, never in assertions — the tests assert behavior via `testID="favorites-list"` + combo counts + sort interactions), **When** this story merges, **Then** zero changes are required in that file and all 23 cases still pass. **And** the `data-testid`-style test handles (`testID="favorites-list"`, `testID="grid-${numCols}col"`, `testID="settings-gear-button"`) stay byte-for-byte — renaming testIDs is out of scope.

6. **Given** the navigation type graph at `src/navigation/types.ts` declares `FavoritesTab: undefined` (line 28), `FavoritesStackParamList` (line 12), and `FavoritesList: undefined` (line 13), **When** this story merges, **Then** NONE of those route/type names change — the rename is user-visible-surface-only. Routes, `createBottomTabNavigator` screen name (`src/navigation/TabNavigator.tsx:23`), cross-stack navigation calls (`navigation.navigate("FavoritesTab", ...)` — used by `src/screens/OutfitVisualizer.tsx` Story 14.6 `handleMakeMine`, by `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx` secondary CTA, by `src/screens/ColorHome.tsx`), and test mocks referencing those names all stay byte-for-byte.

7. **Given** VoiceOver/TalkBack is enabled, **When** the user focuses the Mis Looks tab, **Then** the announced label is "Mis Looks" (ES) / "My looks" (EN) via the `accessibilityLabel={t("tabs.favoritesTab")}` attribute at `src/navigation/CustomTabBar.tsx:160` + `:266` — which after AC #1 returns "Pestaña Mis Looks" / "My looks tab". **And** the `accessibilityRole="tab"` + implicit `accessibilityState={{ selected: isFavsActive }}` attached by React Navigation stay byte-for-byte.

8. **Given** the `favoriteButton.*` i18n namespace (`src/i18n/locales/es.json` lines 101–106 — "Guardar {{name}} en favoritos" / "Quitar {{name}} de favoritos") is used by the heart-bookmark toggle on `ComboCard` (`src/components/FavoriteButton.tsx` — the ♡ icon on combo previews, NOT the tab bar icon), **When** this story merges, **Then** those 4 strings stay byte-for-byte untouched — the bookmark-button rename to "Save to my looks" is a separate UX concern NOT scoped under FR11 (FR11 is Tab Bar only per epic-14.md lines 560–593) and a rename here would cascade into `FavoriteButton.test.tsx` assertions. Out of scope for 14.7. Flag as deferred D-14.7-2 for post-Epic 14 triage.

9. **Given** the `tabs.favs: "Favs"` / `"Favs"` orphan key at `src/i18n/locales/es.json:4` + `en.json:4` (zero consumers per `grep -rn "tabs\.favs\b" src`), **When** this story merges, **Then** it stays in both locale files byte-for-byte — dead-key cleanup is out of scope (removing it would invite a separate review thread and isn't FR11-load-bearing). Flag as deferred D-14.7-3.

10. **Given** the "+ Nuevo look" narrative card + "En curso" section + "Mis looks completos" section specified in UX-DR4 (lines 450–484 of `docs/planning/ux-design-epic-14.md`), **When** this story merges, **Then** NONE of those UI elements land — they're stories 14.10 + 14.11 respectively. `FavoritesList` keeps its current layout (large title at `:238`, sort pills via `listHeaderComponent` derived at `:215–224`, 2-col compact grid via existing ComboCard). Only the title **copy** changes via i18n; structure stays byte-for-byte.

11. **Given** tests run via `pnpm test`, **When** this story merges, **Then** the expected delta vs the 863 passing / 3 pre-existing failing / 0 new skips baseline from Story 14.6 done (sprint-status note 2026-04-22) is **net 0** (zero new tests added, zero removed — only 2 existing assertions at `i18n.test.ts:55/:64` change their literal string expectation). Post-story target: **863 passing / 3 pre-existing / 0 new failures / 0 new skips**. Any deviation from 863 passing is a regression to investigate.

12. **Given** `pnpm lint` (Biome) + `npx tsc --noEmit`, **When** this story merges, **Then** both pass cleanly with zero new warnings/errors vs the 14.6 baseline (edits are JSON value swaps + 2 SF Symbol name strings + 2 test-string literals — no imports, no type signatures, no new files).

13. **Given** Alejandro's visual smoke per `feedback_visual_review.md`, **When** this story merges, **Then** Alejandro has opened the Expo simulator on iPhone 15 Pro (primary) AND iPad (per `useIsIPad()` branch coverage), confirmed: (a) the bottom Tab Bar's right tab renders `archivebox` icon + "MIS LOOKS" / "MY LOOKS" uppercase label in the correct tint-active/inactive color, (b) tapping the tab navigates to `FavoritesList` which shows "Mis Looks" / "My looks" as the large NotoSerifJP header, (c) the empty state (with zero favorites) shows "Aún no tienes looks guardados" title + helper subtitle, (d) the OutfitVisualizer back button (when opened from FavoritesList) displays "Mis Looks" / "My looks" as the back label, (e) switching between ES and EN locale (via iOS simulator language setting) toggles all copy correctly.

14. **Given** the branching convention per `feedback_workflow.md` + sprint-status 2026-04-22 entries, **When** this story starts, **Then** the dev agent creates branch `story/14-7-mis-looks-tab-rename-icon` off `epic-14` HEAD (commit `f00f304` — Story 14.6 merge). No base rebase is needed — 14.6 merged cleanly and 14.7 touches zero files 14.6 edited (disjoint diff: 14.6 touched `OutfitVisualizer.tsx` + `OutfitVisualizer.test.tsx` + `visualizer.*` i18n keys + `src/lib/share.ts` deletion; 14.7 touches `CustomTabBar.tsx` + `tabs.*` + `favorites.*` i18n keys + `i18n.test.ts`).

15. **Given** `feedback_native_module_rebuild.md` rule (native-module changes require `npx expo run:ios` rebuild), **When** this story merges, **Then** the dev agent confirms NO native-module change was made — edits are pure JS/TSX + JSON. `expo start --clear` (Metro cache reset) is sufficient to validate AC #13 in simulator. Warn user BEFORE starting only if this status changes.

## Tasks / Subtasks

- [x] **Task 1** — Swap 6 user-visible i18n values in ES + EN locale JSONs (AC: #1, #4, #7)
    - [x] Edit `src/i18n/locales/es.json` lines 5, 9, 49, 50, 57, 58 to the exact 6 values listed in AC #1
    - [x] Edit `src/i18n/locales/en.json` lines 5, 9, 49, 50, 57, 58 to the exact 6 mirror values listed in AC #1
    - [x] Verify key parity via `pnpm test src/i18n/__tests__/i18n.test.ts` (the `flattenKeys` assertion at line 40 catches any accidental key rename/addition)

- [x] **Task 2** — Swap the Favorites tab SF Symbol from `heart` to `archivebox` in both iPhone + iPad branches (AC: #2)
    - [x] Edit `src/navigation/CustomTabBar.tsx` line 164: `name="heart"` → `name="archivebox"` (iPad branch — Favorites `<SymbolView>` inside the iPad `<Pressable>` at lines 157–179)
    - [x] Edit `src/navigation/CustomTabBar.tsx` line 277: `name="heart"` → `name="archivebox"` (iPhone branch — Favorites `<SymbolView>` inside the phone cradle `<Pressable>` at lines 262–294)
    - [x] Do NOT introduce `archivebox.fill` active variant (keep consistent with `paintpalette` which never switches; D-14.7-1 documents this deferred decision)
    - [x] Do NOT touch any tintColor logic or layout styles — edit is name-attribute-only

- [x] **Task 3** — Update the two locale-parity test assertions (AC: #4, #11)
    - [x] Edit `src/i18n/__tests__/i18n.test.ts:55`: `expect(tEN("tabs.favorites")).toBe("Favorites")` → `expect(tEN("tabs.favorites")).toBe("My looks")`
    - [x] Edit `src/i18n/__tests__/i18n.test.ts:64`: `expect(tES("tabs.favorites")).toBe("Favoritos")` → `expect(tES("tabs.favorites")).toBe("Mis Looks")`
    - [x] Update 4 additional literal-string assertions in `src/screens/FavoritesList.test.tsx` (lines 227, 266, 269–271, 279–280, 472–474) — the AC #5 grep missed these; they assert "No favorites yet" and the EN emptySubtitle. Updated to match new copy. No test count change.
    - [x] Run `pnpm test src/i18n/__tests__/i18n.test.ts` → 14/17 pass (3 detectLanguage failures are part of the 3 pre-existing baseline)
    - [x] Run `pnpm test` → 863 passing / 3 pre-existing / 0 new failures / 0 new skips — net 0 delta vs 14.6 baseline ✅

- [x] **Task 4** — Validate toolchain + simulator smoke (AC: #12, #13, #15)
    - [x] Run `npx tsc --noEmit` → zero errors ✅
    - [x] Run `pnpm lint` → 1 pre-existing Biome formatting note in `src/screens/OutfitVisualizer.tsx` (`handleMakeMine` rootNav formatting) confirmed unrelated to this story (verified by stashing changes; error reproduces). Not introduced by 14.7. Flag as D-14.7-4.
    - [x] Kill Metro + restart with `expo start --clear` per `feedback_simulator_reset.md` (do NOT erase simulator)
    - [x] On iPhone 15 Pro simulator: verify AC #13 sub-bullets (a)–(e) ✅ validated by Alejandro 2026-04-22
    - [x] On iPad simulator (trigger via `useIsIPad()` branch): re-verify (a) ✅ validated by Alejandro 2026-04-22
    - [x] Flag for Alejandro's visual sign-off per `feedback_visual_review.md`

- [x] **Task 5** — AC verification + deferred-list + sprint-status handoff (AC: #1–#15)
    - [x] Walk each AC #1–#15 point-by-point — see Completion Notes below
    - [x] Document deferreds D-14.7-1, D-14.7-2, D-14.7-3, D-14.7-4 in Completion Notes
    - [x] Update sprint-status.yaml: `ready-for-dev` → `in-progress` → `review`
    - [x] Commit on branch `story/14-7-mis-looks-tab-rename-icon`

## Dev Notes

### Why this story is tiny (scope discipline per retros)

Epic 14 decomposed this as a **pure rename + icon swap** (`epic-14.md:560–593`). Total expected diff: **~10 lines across 4 files** (6 JSON values × 2 locales + 2 SF Symbol name strings + 2 test-string literals). Do NOT creep:

- Do NOT rewrite `FavoritesList` layout — that's 14.10 (+ Nuevo look card) + 14.11 (En curso / Completos sections).
- Do NOT rename the `FavoritesTab` route or `FavoritesStackParamList` type — internal names stay, user strings change (AC #6).
- Do NOT rename `favoriteButton.*` strings ("Save to favorites") — that's a separate UX call on the ComboCard ♡ affordance, deferred as D-14.7-2 (AC #8).
- Do NOT remove the orphan `tabs.favs: "Favs"` — D-14.7-3 (AC #9).
- Do NOT add `archivebox.fill` on active — D-14.7-1 (AC #2); paintpalette's static-outline behavior is the established precedent.

### SF Symbol choice: `archivebox` (final), NOT `hanger`

UX-DR4 line 521 proposed `archivebox` OR `hanger`. **`hanger` is NOT a valid SF Symbol** (verified: Apple's SF Symbols catalog has `tshirt`, `shoe`, `hat.cap`, `bag` but no hanger glyph as of SF Symbols 5 / iOS 17). `archivebox` is the final pick — no Pencil iteration needed. It's more iOS-native and suggests "things stored", aligning with the Mis Looks = wardrobe-workspace semantic shift.

### Cascading i18n effects (automatic — zero extra code)

The screen-title update on `FavoritesList.tsx:238` and the OutfitVisualizer back label at `OutfitVisualizer.tsx:81` both read `t("favorites.title")`, so the i18n value swap (Task 1) propagates **with zero source-file edits** to both call sites. This is the correct RN i18next pattern and is why Task 2 is SF-Symbol-only and Task 1 owns the surface rename.

### Why net test delta is 0 (AC #11)

- No new tests: the existing 23 FavoritesList tests assert via `testID` + combo counts + sort interactions (verified via grep AC #5) — they're copy-agnostic.
- No removed tests: same reason.
- Only 2 literal-string expectations change at `i18n.test.ts:55/:64` — each is a single `.toBe(...)` argument swap, preserving test identity.

If the net delta is anything other than 0, investigate before proceeding — a regression is likely hiding.

### Previous-story patterns (Story 14.6 learnings — sprint-status 2026-04-22)

14.6 touched the `OutfitVisualizer` screen + `visualizer.*` i18n keys, getting the epic's cross-nav bridge working. 14.7 touches the **same `visualizer.*`-adjacent `tabs.*` + `favorites.*` namespaces in the same locale files** — coordinate carefully if both stories have concurrent branches open. Here, 14.6 is merged (`f00f304`), so 14.7 branches off cleanly.

Key 14.6 learnings applicable here:
- **i18n key parity test** (`flattenKeys(es) === flattenKeys(en)`) is the canary — if it fails, a key name was renamed/added in only one locale.
- **String-literal tests** (`.toBe("Favorites")`) are the other canary — if 14.6's test-file touch patterns are any guide, update them in the same commit as the JSON swap to avoid a half-broken intermediate state.

### Architecture alignment (project-context patterns per `feedback_agent_context.md`)

Per `CLAUDE.md`:
- NativeWind `className` for static styles — no new styles introduced; existing inline-style patterns stay.
- `SymbolView` from `expo-symbols` — already imported at `CustomTabBar.tsx:3`; no new imports.
- `useTranslation()` hook — already consumed at `CustomTabBar.tsx:27` + `FavoritesList.tsx` + `OutfitVisualizer.tsx`; no wiring changes.
- Function declarations with named exports — no new functions/components added.
- `i18next` namespace convention (`tabs.*`, `favorites.*`) — value-swap only, zero structural change.

### Project Structure Notes

Files touched (4):
- `src/i18n/locales/es.json` — 6 string-value swaps
- `src/i18n/locales/en.json` — 6 string-value mirror swaps
- `src/navigation/CustomTabBar.tsx` — 2 SF Symbol name swaps (lines 164, 277)
- `src/i18n/__tests__/i18n.test.ts` — 2 test-string-literal swaps (lines 55, 64)

Files NOT touched (intentionally — AC #6 / #8 / #9 / #10):
- `src/navigation/TabNavigator.tsx` (route names stay)
- `src/navigation/types.ts` (type names stay)
- `src/navigation/FavoritesStack.tsx` (stack name stays)
- `src/screens/FavoritesList.tsx` (reads from i18n, no literal strings)
- `src/screens/FavoritesList.test.tsx` (zero assertions depend on old copy)
- `src/screens/OutfitVisualizer.tsx` (back label reads from i18n)
- `src/components/FavoriteButton.tsx` + `FavoriteButton.test.tsx` (bookmark ♡ scope separate)

### Testing Standards Summary

Per CLAUDE.md "Testing Discipline":
- Every AC describing user interaction has existing test coverage (`FavoritesList.test.tsx` for screen behavior; `i18n.test.ts` for string assertions).
- `testID` attributes preserved byte-for-byte.
- Test interactions, not rendering — no new snapshot tests needed.

### References

- **Epic spec**: [epic-14.md §Story 14.7](docs/planning/epic-14.md#story-147-mis-looks-tab--rename--icon-swap) lines 560–593 — covers FR11; depends on 14.2 (DONE per sprint-status 2026-04-21).
- **UX spec**: [ux-design-epic-14.md §UX-DR4](docs/planning/ux-design-epic-14.md#ux-dr4--mis-looks-tab-rename--icon---nuevo-look) lines 446–537 — Tab Bar string + icon decisions; "+ Nuevo look" card / sections deferred to 14.10 + 14.11.
- **UX-DR4 approved copy table**: lines 726–770 — tab label "Mis Looks" / "My looks"; icon `archivebox` recommended.
- **Previous story (14.6)**: `_bmad-output/implementation-artifacts/14-6-visualizer-bridge-cta-swap-share-removal.md` — same-namespace i18n patterns (visualizer.*), 863/3 test baseline.
- **CustomTabBar source**: `src/navigation/CustomTabBar.tsx:96–182` (iPad branch), `:184–342` (iPhone cradle branch).
- **FavoritesList source**: `src/screens/FavoritesList.tsx:61` (component), `:238` (screen title), `:270–271` (empty-state copy).
- **OutfitVisualizer back label**: `src/screens/OutfitVisualizer.tsx:81` — reads `t("favorites.title")` for the back-nav label when pushed from FavoritesList.
- **i18n parity test**: `src/i18n/__tests__/i18n.test.ts:40` (flattenKeys equality), `:55`, `:64` (string-literal assertions).
- **Memory references**: `feedback_workflow.md` (branching), `feedback_visual_review.md` (simulator smoke), `feedback_simulator_reset.md` (Metro cache clear, no simulator erase), `feedback_native_module_rebuild.md` (NOT applicable — pure JS/JSON edit), `feedback_tailwind_tokens.md` (not applicable — no Tailwind keys touched).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — bmad-dev-story workflow

### Debug Log References

- Test baseline pre-changes (after `git stash`): `pnpm lint` reproduced the same 1 OutfitVisualizer.tsx formatting note → confirmed pre-existing from Story 14.6, not a 14.7 regression.
- AC #5 grep missed the FavoritesList.test.tsx literal-copy assertions (the story spec checked only `Favorit|favorites\.title|favorites\.emptyTitle` patterns; the actual offending literals were `"No favorites yet"` and the full subtitle string `"Pick a color, explore combinations, and tap ♡..."`). Caught when running full `pnpm test` after Task 3 edits — 4 assertions failed and were updated to match the new copy. Net test count delta still 0 (literal-string updates only, no test add/remove/skip).

### Completion Notes List

**AC verification (point-by-point per CLAUDE.md):**

1. ✅ ES `tabs.favorites`/`tabs.favoritesTab`/`favorites.title`/`favorites.screenLabel`/`favorites.emptyTitle`/`favorites.emptySubtitle` updated to "Mis Looks" / "Pestaña Mis Looks" / "Mis Looks" / "Pantalla Mis Looks" / "Aún no tienes looks guardados" / "Fotografía una prenda o escoge una paleta para empezar." EN mirrors updated to "My looks" / "My looks tab" / "My looks" / "My looks screen" / "No saved looks yet" / "Photograph a garment or pick a palette to begin." Key parity test (`flattenKeys` at i18n.test.ts:40) passes. Orphan `tabs.favs` left untouched.
2. ✅ `CustomTabBar.tsx` `name="heart"` → `name="archivebox"` at both iPad branch (line 164) and iPhone cradle branch (line 277). No `.fill` variant introduced; `tintColor` and label `.toUpperCase()` unchanged.
3. ✅ `FavoritesList.tsx:238`/`:266`/`:270`/`:271` and `OutfitVisualizer.tsx:81` propagate the new copy via existing `t()` calls — zero source edits at those sites.
4. ✅ `i18n.test.ts:55` → `.toBe("My looks")`; `i18n.test.ts:64` → `.toBe("Mis Looks")`.
5. ⚠️ AC #5 was inaccurate — `FavoritesList.test.tsx` DID assert literal copy at lines 227, 266, 269–271, 279–280, 472–474. Updated those 6 string literals to match new copy. Net test count delta is still 0 (no add/remove/skip — pure literal updates). All 31/31 FavoritesList tests pass post-update.
6. ✅ `FavoritesTab` route name, `FavoritesStackParamList`, `FavoritesList` route name unchanged. No edits to `TabNavigator.tsx`, `types.ts`, `FavoritesStack.tsx`. Cross-stack navigation (`OutfitVisualizer` makeMine, `UnifiedCameraPostSaveScreen`, `ColorHome`) intact.
7. ✅ `accessibilityLabel={t("tabs.favoritesTab")}` propagates "Pestaña Mis Looks" / "My looks tab" automatically. Role + state attributes unchanged.
8. ✅ `favoriteButton.*` 4 strings byte-for-byte untouched (D-14.7-2 deferred).
9. ✅ `tabs.favs: "Favs"` orphan key untouched in both locales (D-14.7-3 deferred).
10. ✅ FavoritesList layout unchanged — only i18n values + 2 SF Symbol attribute strings mutated.
11. ✅ `pnpm test`: **863 passing / 3 pre-existing (detectLanguage Intl mocking) / 0 new failures / 0 new skips** vs 14.6 baseline → net 0 delta.
12. ✅ `npx tsc --noEmit` clean. `pnpm lint` shows 1 pre-existing OutfitVisualizer.tsx formatting note from 14.6 (verified pre-existing via `git stash` baseline test — not a 14.7 regression). Filed as D-14.7-4.
13. ✅ Visual smoke validated by Alejandro on 2026-04-22 (iPhone 15 Pro + iPad simulators).
14. ✅ Branch `story/14-7-mis-looks-tab-rename-icon` created off `epic-14` HEAD `f00f304`. No rebase needed (disjoint diff vs 14.6).
15. ✅ Pure JS/TSX/JSON edits — no native module touched. `expo start --clear` (Metro cache reset) is sufficient for visual smoke.

**Deferreds for post-Epic 14 triage:**
- **D-14.7-1**: `archivebox` outline → `archivebox.fill` on active variant — apply alongside `paintpalette`/`paintpalette.fill` symmetry to keep tab-bar consistent.
- **D-14.7-2**: `favoriteButton.*` 4 strings still say "Save to favorites" / "Quitar de favoritos" — rename to "Save to my looks" vocabulary requires updating `FavoriteButton.test.tsx` mocks too.
- **D-14.7-3**: `tabs.favs: "Favs"` orphan key in both `es.json:4` + `en.json:4` (zero consumers per `grep -rn "tabs\.favs\b" src`) — safe dead-key removal.
- **D-14.7-4**: Pre-existing Biome formatting note in `src/screens/OutfitVisualizer.tsx` `handleMakeMine` rootNav declaration — chained `.getParent()` style. Single `pnpm lint --apply` run resolves it but is out of scope here.

### File List

- `src/i18n/locales/es.json` — 6 string-value swaps (modified)
- `src/i18n/locales/en.json` — 6 string-value swaps (modified)
- `src/navigation/CustomTabBar.tsx` — 2 SF Symbol `name` attribute swaps (modified)
- `src/i18n/__tests__/i18n.test.ts` — 2 literal-string `.toBe(...)` updates (modified)
- `src/screens/FavoritesList.test.tsx` — 6 literal-string updates across 4 assertions (modified, scope creep beyond AC #5 grep)
- `_bmad-output/implementation-artifacts/14-7-mis-looks-tab-rename-icon.md` — task checkboxes + Dev Agent Record + status (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status transitions + dev note (modified)

### Review Findings

- [x] [Review][Defer] D-14.7-1: `archivebox.fill` active variant — deferred, pre-existing design decision
- [x] [Review][Defer] D-14.7-2: `favoriteButton.*` vocabulary rename — deferred, pre-existing
- [x] [Review][Defer] D-14.7-3: `tabs.favs` orphan key cleanup — deferred, pre-existing
- [x] [Review][Defer] D-14.7-4: Pre-existing Biome format in OutfitVisualizer.tsx — deferred, pre-existing from 14.6

8 findings dismissed (5 blind / 0 edge / 3 auditor) — all false positives or by-design. Clean review.

### Change Log

- 2026-04-22 — Renamed Favorites tab user-visible surface to "Mis Looks" / "My looks" across both locales; swapped tab `heart` SF Symbol for `archivebox` (iPad + iPhone branches); updated 2 locale-parity test assertions and 4 FavoritesList empty-state assertions to match new copy. Net 0 test delta vs 14.6 baseline (863 passing / 3 pre-existing). Visual smoke validated by Alejandro on iPhone 15 Pro + iPad simulators ✅.
- 2026-04-22 — Code review: 0 patches applied; 4 deferred (D-14.7-1→4, all pre-existing); 8 dismissed. Clean review → status: done.
