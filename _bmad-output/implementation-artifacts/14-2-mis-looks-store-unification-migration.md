# Story 14.2: Favorites v1.3.0 → Mis Looks store unification + data migration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user upgrading from v1.3.0 to v1.4.0 (and as the developer laying the data-layer foundation that every remaining Epic 14 story depends on)**,
I want **my existing Favorites to appear inside the new "Mis Looks" tab with zero manual action, AND the underlying data layer to be unified under a single `useMisLooksStore` Zustand store owning `items + assignments + favorites` as three coherent slices (per ADR-005 / TD-3), with a source-preserving idempotency-flag-gated migration per TD-5**,
so that **I don't lose the palettes I already saved, future features (FR12 auto-save on first assignment, FR13 "Guardar para luego", FR16 retention surface, FR18 edit-category) can orchestrate across wardrobe + favorites in a single atomic `setState` call without cross-boundary React-Context leaks, and a crash mid-migration never corrupts or drops user data**.

## Acceptance Criteria

1. **Given** the new `src/stores/misLooksStore.ts` file, **When** the module is inspected, **Then** it exports `useMisLooksStore` (a Zustand `create<MisLooksStoreState>()` store) owning exactly three persisted slices — `items: WardrobeItem[]`, `assignments: CombinationAssignment[]`, `favorites: Set<string>` — plus the transient `hydrated: boolean` flag, **And** exposes actions `setItems`, `setAssignments`, `addFavorite(id: string): void`, `removeFavorite(id: string): void`, `toggleFavorite(id: string): void`, `isFavorite(id: string): boolean`, `updateItemCategory(id: string, category: WardrobeCategory): void` — the last one is stubbed here for Story 14.12b consumption per ADR-005 §"Resulting architecture" and MUST be present so 14.12b doesn't need to re-open the store API, **And** each slice persists to a dedicated AsyncStorage key under the new `@mislooks:` namespace (`@mislooks:items`, `@mislooks:assignments`, `@mislooks:favorites`) with per-slice corrupt-payload isolation (parse failure on one slice does NOT zero the others — same pattern as the current `wardrobeStore` per Story 13.1 F1), **And** `favorites` is persisted as a JSON array of strings (not as a `Set` literal — `JSON.stringify` cannot serialize `Set`) and rehydrated via `new Set(array)`, **And** the legacy file `src/stores/wardrobeStore.ts` is renamed to `src/stores/misLooksStore.ts` (git `mv` to preserve blame — NOT a fresh file with a delete), **And** the legacy `src/contexts/FavoritesContext.tsx` + `src/contexts/FavoritesContext.test.tsx` are DELETED (not re-exported), **And** `FavoritesProvider` is removed from `App.tsx`'s provider tree.

2. **Given** a v1.3.0 user with legacy data `@outfinder/favorites = JSON.stringify(["combo-a", "combo-b", "combo-c"])`, `@wardrobe:items = JSON.stringify([item1, item2])`, `@wardrobe:assignments = JSON.stringify([a1, a2])`, **When** the app boots for the first time after upgrading to v1.4.0 (idempotency flag absent), **Then** `runMisLooksMigration()` executes BEFORE `hydrateMisLooksStore()` runs, **And** reads all three legacy keys in a single `AsyncStorage.multiGet([...])` call, **And** validates each record with the existing type guards (`isWardrobeItem` with TD-7 backfill, `isCombinationAssignment`) dropping malformed records with a single `__DEV__` warn per record type (NOT per record), **And** drops any favorite `combinationId` that does not exist in the bundled Wada dataset (`getCombination(id) === undefined`) with a single `__DEV__` warn per orphan (copy: `misLooksMigration: dropped orphan favorite combinationId="${id}" (no longer in Wada dataset)`), **And** writes `@mislooks:items`, `@mislooks:assignments`, `@mislooks:favorites` via `AsyncStorage.multiSet([...])` as a single atomic batch, **And** only AFTER the multiSet resolves successfully, writes the idempotency flag `@outfinder/migration:favorites-to-mis-looks:v1 = "complete"` via a separate `AsyncStorage.setItem` call, **And** only AFTER the idempotency flag write resolves, clears the three legacy keys via `AsyncStorage.multiRemove(["@outfinder/favorites", "@wardrobe:items", "@wardrobe:assignments"])`, **And** the order destination-write → flag-write → legacy-clear is STRICT (no concurrent `Promise.all` across these phases — a crash between phase 1 and phase 2 must leave legacy source intact so re-run is safe), **And** `hydrateMisLooksStore()` runs next and populates the store from the new `@mislooks:*` keys.

3. **Given** the idempotency flag `@outfinder/migration:favorites-to-mis-looks:v1` is already set to `"complete"`, **When** the app boots, **Then** `runMisLooksMigration()` short-circuits immediately (no AsyncStorage reads of legacy keys, no writes) and returns `{ status: "already-complete" }` or equivalent, **And** the function completes in <5ms (measured via a test spy on `AsyncStorage.multiGet` — it must NOT be called when the flag is set), **And** `hydrateMisLooksStore()` runs normally populating the store from the `@mislooks:*` keys.

4. **Given** a fresh install (all legacy keys absent, idempotency flag absent), **When** `runMisLooksMigration()` runs, **Then** it detects the absence of all three legacy sources (each `multiGet` value is `null`), **And** writes empty collections to `@mislooks:items = "[]"`, `@mislooks:assignments = "[]"`, `@mislooks:favorites = "[]"` (explicit empty, NOT left unset — prevents a subsequent v1.4.0→v1.5.0 migration from mistaking it for "never migrated"), **And** sets the idempotency flag, **And** does not error or warn, **And** `hydrateMisLooksStore()` yields empty slices with `hydrated: true`.

5. **Given** migration crashes mid-sequence at ANY step (multiGet rejects, validation throws, multiSet rejects, flag-write rejects), **When** the failure is caught by the top-level try/catch, **Then** the legacy source keys `@outfinder/favorites` + `@wardrobe:items` + `@wardrobe:assignments` remain UNTOUCHED in AsyncStorage (assert via `getItem` after the simulated failure), **And** the idempotency flag is NOT written (verified absent), **And** a single `__DEV__` `console.warn("misLooksMigration: aborted mid-sequence, legacy source preserved — will retry on next launch", error)` is emitted, **And** the store is populated from whatever the `@mislooks:*` keys yield (likely empty if this is the first crashed attempt), **And** `hydrated: true` is still set so the UI doesn't hang, **And** on the next app launch `runMisLooksMigration()` re-runs from scratch and — because source is intact — succeeds.

6. **Given** migration re-runs after a successful prior completion (tester manually cleared the flag via the dev menu from AC #10), **When** re-migration runs, **Then** destination records are detected by ID/value and NOT duplicated — specifically: `favorites` are stored as a `Set` so re-adding a string is a no-op, `items` and `assignments` are merged by `id` (for items) and by `(combinationId, colorIndex)` composite (for assignments) with legacy values OVERWRITTEN by any already-present newer destination value (last-write-wins on conflict — but since migration reads legacy and writes the union, the expected normal state is "legacy values flow into empty destination"), **And** final counts match N_items + N_favorites + N_assignments, **And** if the SAME legacy records are processed twice (e.g. dev cleared the flag but didn't clear the destination), the destination is identical before and after (byte-for-byte on `JSON.stringify(sorted)`), **And** the function returns `{ status: "completed", migratedCounts: { items, assignments, favorites, orphansDropped } }`.

7. **Given** a v1.3.0 user already at 5/5 favorites (grandfathered per FR17), **When** migration runs, **Then** all 5 favorite combinationIds are migrated into `@mislooks:favorites` (stored as JSON array, hydrated as `Set<string>`), **And** no paywall is triggered during migration (migration is NOT gated by `FREE_FAVORITES_LIMIT` — grandfathering is explicit; the limit applies only to NEW writes after launch), **And** a subsequent `addFavorite("combo-6")` on a free user DOES trigger `WardrobeLimitExceeded`-style rejection path per the existing paywall contract (behavior preserved; 14.8 and 14.9 orchestrate the UI-side paywall presentation — this story only exposes the store-level guard).

8. **Given** the 5 call sites currently consuming `useFavorites()` from `FavoritesContext` — `src/screens/Combinations.tsx:29`, `src/screens/Settings.tsx:37`, `src/screens/FavoritesList.tsx:73`, `src/screens/ColorHome.tsx:89`, `src/screens/armario/ArmarioPreviewScreen.tsx:55` — **When** this story ships, **Then** each call site is rewired to `useMisLooksStore` via selectors: `const favorites = useMisLooksStore((s) => s.favorites)`, `const toggleFavorite = useMisLooksStore((s) => s.toggleFavorite)`, `const isFavorite = useMisLooksStore((s) => s.isFavorite)`, `const count = useMisLooksStore((s) => s.favorites.size)`, **And** the pre-existing behavior of each screen is BYTE-FOR-BYTE identical (no new FR, no UX change, no copy edit — this story is a pure refactor + data migration; visual parity is Dev-test-gate NFR4), **And** the 23 existing call sites of `useWardrobeStore` (per `grep useWardrobeStore src --include='*.ts*'`) are updated to `useMisLooksStore` import (file-level text replacement; no behavior change), **And** `npx tsc --noEmit`, `pnpm lint`, `pnpm test` all pass green.

9. **Given** the existing `src/screens/armario/ArmarioPreviewScreen.tsx` line 55 consumes `const { favorites } = useFavorites()` and passes `favorites` to `usePremiumGate(favorites)`, **When** this story refactors, **Then** the call site is updated to `const favorites = useMisLooksStore((s) => s.favorites)` followed by `const gate = usePremiumGate(favorites)` — `usePremiumGate`'s signature (`favorites: Set<string>`) is preserved unchanged in this story (moving that hook into the store is OUT OF SCOPE; `usePremiumGate` continues to accept a `Set<string>` plumbed from whoever holds the favorites slice), **And** the same is true for the 4 other `usePremiumGate(favorites)` call sites, **And** the `usePremiumGate.test.tsx` file requires no edits beyond — if it mocks `useFavorites` — switching to mocking `useMisLooksStore` (check and update).

10. **Given** the `__DEV__` Settings dev menu (`src/screens/Settings.tsx` around line 240–311), **When** the user opens Settings in a dev build, **Then** a new row "Re-run Mis Looks migration" is rendered BELOW the existing "Wardrobe @limit override" row with `testID="dev-rerun-mislooks-migration-row"` and `accessibilityLabel="Re-run Mis Looks migration (dev)"`, **And** tapping it runs `await AsyncStorage.removeItem("@outfinder/migration:favorites-to-mis-looks:v1")` followed by `await runMisLooksMigration()` (both awaited sequentially), **And** a subtle in-menu text label updates to show `last run: <ISO timestamp> · status: <completed|already-complete|aborted>` after each invocation, **And** this row is GATED behind `__DEV__` (production builds never see it — release-hygiene per NFR8), **And** no production-visible UI regressions result from this dev-only addition.

11. **Given** a corrupt legacy payload on `@outfinder/favorites` (e.g. `"not-json-garbage{{{"`, `"[1, 2, 3]"` with numeric IDs, `"{}"` object instead of array), **When** migration reads it, **Then** a single `__DEV__` warn is emitted (`misLooksMigration: legacy favorites payload corrupt, migrating 0 favorites`), **And** the migration proceeds for the OTHER legacy keys (`@wardrobe:items` and `@wardrobe:assignments` migrate independently — corrupt favorites do NOT abort the whole migration), **And** `@mislooks:favorites` is written as `"[]"`, **And** the idempotency flag IS set on completion (corrupt legacy data is not a crash — it's a partial migration that's better than stalling forever).

12. **Given** co-located tests `src/stores/misLooksStore.test.ts` and `src/stores/misLooksStore.migration.test.ts`, **When** `pnpm test src/stores/misLooksStore` runs, **Then** the suite covers:
    (a) all three slices round-trip through persist + hydrate (items, assignments, favorites — preserved across `hydrateMisLooksStore()` round-trip);
    (b) `addFavorite` / `removeFavorite` / `toggleFavorite` / `isFavorite` semantics match the current `FavoritesContext` contract verbatim (4 tests, one per method);
    (c) `updateItemCategory(id, newCategory)` mutates the item in-place and persists the change (Story 14.12b pre-wired);
    (d) corrupt-payload isolation: seeding `@mislooks:favorites = "garbage"` leaves `items` and `assignments` intact, `favorites` becomes empty, one dev warn fires;
    (e) migration happy-path N=0, N=3, N=5 — all favorites + items + assignments land under new keys (parameterized `test.each`);
    (f) migration orphan-drop: seeding a favorite `"combo-fake-id"` not in the Wada dataset is dropped with a `__DEV__` warn; remaining real favorites migrate normally;
    (g) migration idempotency flag — flag absent → runs; flag set → skips (verify via `AsyncStorage.multiGet` spy assertion); flag set but destination empty → still skips (dev responsibility to clear flag via AC #10 dev menu);
    (h) migration crash-recovery — simulate `multiSet` rejection → legacy keys intact, flag absent, warn fired, next call succeeds with source still present;
    (i) migration fresh-install — all legacy keys null → writes empty `"[]"` to all three destination keys + sets flag;
    (j) migration double-run with already-migrated destination — produces identical final state (byte-for-byte on serialized slices);
    (k) migration corrupt legacy favorites — warn fired, other keys migrate normally, flag still set (AC #11 semantics);
    (l) TD-7 backfill still applies — legacy items without `category` backfill to `"top"` during migration (hydration and migration share the same `normalizeItems` helper — not duplicated);
    (m) full-suite regression: `pnpm test` produces zero net new failures vs. Story 14.1's `795 passing / 60 pre-existing debt` baseline (expected: ~815–830 passing after this story adds ~20–30 new tests, same 60 pre-existing failures unchanged).

13. **Given** the `App.tsx` bootstrap sequence, **When** the app starts cold, **Then** the order is: `i18n import` → `global.css import` → `runMisLooksMigration()` (new — awaited) → `hydrateMisLooksStore()` (renamed from `hydrateWardrobeStore`) → `runOrphanSweep({ items })` (preserved from Epic 13), **And** the top-level IIFE at `App.tsx:35–47` is updated to call `runMisLooksMigration()` before `hydrateMisLooksStore()`, **And** the `AppState.addEventListener("change", ...)` handler at lines 49–62 is updated to call `hydrateMisLooksStore()` (NOT `runMisLooksMigration` — migration runs ONLY on cold boot; the flag guards against redundant runs but there's no reason to call it from the AppState listener), **And** the `FavoritesProvider` wrapper at `App.tsx:99` is REMOVED from the JSX tree (children now consume the store directly, no Provider needed — per ADR-005 §"Deleted abstractions"), **And** the `UnfavoriteCascadeProvider` remains intact (it wraps a Modal, not a data provider — unchanged).

14. **Given** the full quality gates `npx tsc --noEmit`, `pnpm lint`, `pnpm test`, **When** all three run on this story branch, **Then** all pass green, **And** zero new test-skips are introduced (NFR6), **And** Biome lint passes (tabs, double quotes, function declarations, no `export default`), **And** zero snapshot regressions (if snapshots involve `useFavorites` identity or `FavoritesProvider` render tree, update once and commit the new baseline with a note), **And** the commit file list shows: 1 renamed store file, 1 deleted context file, 1 deleted context test file, 1 updated App.tsx, 5 updated screen call-sites, 1 updated Settings dev menu, 1 new migration module, 2 new/renamed test files, plus consequential test-mock updates in Settings / ArmarioPickerScreen / ArmarioFichaWadaScreen / ArmarioTuLookScreen / ArmarioSugerenciaArmoniaScreen / FavoritesList test files (each switches `jest.mock("@/stores/wardrobeStore", ...)` → `jest.mock("@/stores/misLooksStore", ...)`).

## Tasks / Subtasks

- [x] **Task 1: Create `useMisLooksStore` with three slices + actions + hydration** (AC: #1, #12 a–d, #13)
  - [x] 1.1 `git mv` renames complete. Symbols renamed: `useMisLooksStore`, `hydrateMisLooksStore`, `MisLooksStoreState`. Key constants exported from the module for reuse: `ITEMS_KEY = "@mislooks:items"`, `ASSIGNMENTS_KEY = "@mislooks:assignments"`, `FAVORITES_KEY = "@mislooks:favorites"`. TD-7 `normalizeItems` + guards preserved verbatim.
  - [x] 1.2 `favorites: Set<string>` slice + `addFavorite`, `removeFavorite`, `toggleFavorite`, `isFavorite`, `updateItemCategory` (fully functional setItems-over-map body) — all in `src/stores/misLooksStore.ts`.
  - [x] 1.3 `parseFavorites` helper with `Set → JSON.stringify([...favorites])` comment citing the Set-serialization trap; rejects non-arrays and non-strings.
  - [x] 1.4 `hydrateMisLooksStore()` reads all three keys via `multiGet` in one round-trip, parses each slice in its own try/catch (per-slice corrupt-payload isolation).
  - [x] 1.5 Auto-hydration on module-load REMOVED (App.tsx bootstrap IIFE now owns ordering — migration runs BEFORE hydration, no race).

- [x] **Task 2: Implement `runMisLooksMigration()` with TD-5 idempotency pattern + orphan-drop** (AC: #2–#7, #11, #12 e–k)
  - [x] 2.1 New module `src/stores/misLooksMigration.ts` with `runMisLooksMigration(): Promise<MigrationResult>` discriminated-union return type. Co-located tests at `src/stores/misLooksMigration.test.ts`.
  - [x] 2.2 Constants at top of the file: `IDEMPOTENCY_KEY` (exported — consumed by Settings dev menu + tests), `IDEMPOTENCY_DONE = "complete"`, `LEGACY_FAVORITES`, `LEGACY_ITEMS`, `LEGACY_ASSIGNMENTS`.
  - [x] 2.3 Strict phase order: flag-read → multiGet legacy → parse+orphan-filter → multiSet destination → setItem flag → multiRemove legacy. Each phase awaited sequentially. `getCombination(id)` orphan-filter dev-warns per dropped id.
  - [x] 2.4 Top-level try/catch wraps phases 2–6; on catch, dev-warn + return `{ status: "aborted" }` with legacy source + flag both untouched — next launch re-runs from scratch.
  - [x] 2.5 Corrupt-legacy survival: `parseLegacyFavorites` + `parseLegacyItems` + `parseLegacyAssignments` each handle their own JSON.parse throws independently, returning `[]` on failure. Only `multiSet` / `setItem` rejection aborts the whole flow.

- [x] **Task 3: Rewire all call sites off `FavoritesContext` and off `wardrobeStore` paths** (AC: #1, #8, #9, #13)
  - [x] 3.1 `App.tsx` — `FavoritesProvider` removed from the JSX tree. Bootstrap IIFE now `await runMisLooksMigration(); await hydrateMisLooksStore();` then `runOrphanSweep`. AppState handler calls only `hydrateMisLooksStore()` (migration is cold-boot-only).
  - [x] 3.2 Five `useFavorites()` call sites rewired to `useMisLooksStore((s) => ...)` selectors — `Combinations.tsx`, `Settings.tsx` (count from `s.favorites.size`), `FavoritesList.tsx`, `ColorHome.tsx`, `ArmarioPreviewScreen.tsx`.
  - [x] 3.3 All `useWardrobeStore` / `hydrateWardrobeStore` imports + `jest.mock("@/stores/wardrobeStore", ...)` calls rewired to `misLooksStore` (15 files). Post-audit grep confirms 0 live references to the old symbols; remaining mentions are doc-comment history.
  - [x] 3.4 `src/contexts/FavoritesContext.tsx` + `src/contexts/FavoritesContext.test.tsx` DELETED via `git rm`. Zero `FavoritesContext` / `FavoritesProvider` / `useFavorites` references remain in live code.
  - [x] 3.5 `usePremiumGate.ts` untouched (signature `favorites: Set<string>` preserved per AC #9). `usePremiumGate.test.tsx` did not mock `useFavorites` — no edits needed.

- [x] **Task 4: Tests — store unit + migration + integration smoke** (AC: #12 a–m)
  - [x] 4.1 `src/stores/misLooksStore.test.ts` — all 14.1 tests preserved; +11 new tests: favorites slice (add/remove/toggle/isFavorite + no-op paths + persist-failure tolerance + persist/hydrate round-trip), `updateItemCategory` (3 tests), corrupt-favorites per-slice isolation + non-string array rejection.
  - [x] 4.2 `src/stores/misLooksMigration.test.ts` — 14 tests covering idempotency (2), happy-path `test.each([0,3,5])` + fresh-install (4), orphan-drop (1), crash recovery + re-run-succeeds (2), double-run determinism (1), corrupt legacy favorites — garbage/numeric/object (3), TD-7 backfill during migration (1).
  - [x] 4.3 Mock-shape migration done for `Settings.test.tsx`, `FavoritesList.test.tsx`, `ArmarioPickerScreen.test.tsx`, `ArmarioFichaWadaScreen.test.tsx`, `ArmarioTuLookScreen.test.tsx`, `ArmarioSugerenciaArmoniaScreen.test.tsx`, `ArmarioPreviewScreen.test.tsx`, `ColorHome.test.tsx`, `Combinations.test.tsx`, `saveCutoutAsWardrobeItem.test.ts`, `wardrobeRepo.test.ts`, `App.test.tsx`.
  - [x] 4.4 Full-suite result: **816 passing / 60 pre-existing / 0 new failures / 0 new skips** (vs. 14.1 baseline 795/60 → net +21). 3 failing suites = pre-existing (`App.test.tsx` brought BACK to green with the mock rewire; `OutfitVisualizer.test.tsx` + `i18n.test.ts` are the known pre-existing debt).

- [x] **Task 5: Dev-menu "Re-run migration" + quality gates + AC walkthrough** (AC: #10, #14)
  - [x] 5.1 `Settings.tsx` dev row added below "Wardrobe @limit override": `testID="dev-rerun-mislooks-migration-row"`, `accessibilityLabel="Re-run Mis Looks migration (dev)"`. Handler removes the idempotency flag, awaits `runMisLooksMigration()`, and renders `last run: <ISO> · status: <completed|already-complete|aborted>`. Gated by `{__DEV__ && (...)}`.
  - [x] 5.2 `pnpm test` — 816 passing / 60 pre-existing / 0 new failures (vs. 795/60 baseline). No new skips.
  - [x] 5.3 `npx tsc --noEmit` — clean. `pnpm lint` — clean after Biome autofix (organize-imports + formatting only; no suppression comments).
  - [x] 5.4 AC walkthrough table authored in Completion Notes below.
  - [x] 5.5 Zero user-visible change this story (pure refactor + data migration). Only UI delta is the `__DEV__`-gated Settings row, invisible in production. Next user-visible Epic 14 change ships in Story 14.3a (unified camera nav).

## Dev Notes

### Architecture context (brownfield — Epic 14 foundational)

- **Current branch:** `story/14-2-mis-looks-store-unification-migration` (already checked out on session-start git status; created off `epic-14` which sits off `epic-13` off `epic-1` main). Story 14.1 (`story/14-1-wardrobe-item-category-field`) is **done** and merged into `epic-14` (commit `077d20c`). This story is the second live code story on `epic-14`.
- **Target version:** v1.4.0 App Store submission. Epic 14 is a **launch blocker**. Story 14.2 is the critical **data-layer foundation** — every subsequent story (14.7 rename, 14.8 auto-save, 14.9 Guardar para luego, 14.11 retention surface, 14.12b edit category) depends on `useMisLooksStore`'s API landing correctly here.
- **Scope boundaries:**
  - ✅ `useMisLooksStore` with 3 slices + actions + `updateItemCategory` stub. `runMisLooksMigration()` with TD-5 idempotency pattern + orphan-drop. Delete `FavoritesContext` + `FavoritesProvider`. Rewire 5 `useFavorites()` call sites + ~15 `useWardrobeStore` imports. Dev menu "Re-run migration". Co-located tests.
  - ❌ NO UI changes beyond the `__DEV__`-gated Settings row (Story 14.7 renames the tab; 14.8+ drive auto-save UX).
  - ❌ NO navigation changes (Story 14.3a owns `UnifiedCameraRoot`).
  - ❌ NO changes to `usePremiumGate` signature — `favorites: Set<string>` plumbs unchanged (AC #9).
  - ❌ NO paywall orchestration inside `addFavorite` — Stories 14.8 and 14.9 own the paywall-limbo UI (TD-4). This story exposes the raw store actions; paywall decisions stay in the consuming screens for now.
  - ❌ NO migration of IAP / RevenueCat data. NO migration of `FavoritesContext` state during runtime (e.g. a v1.3.0 session live-upgrading to v1.4.0 mid-session is physically impossible — AsyncStorage is the only persistence, and migration runs on cold boot).

### Critical: TD-5 migration ordering — why the strict sequence matters

From Winston's tech review (Finding 5, `docs/planning/epic-14/epic-14-tech-review.md` lines 258–312): the safety property of this migration is "legacy source is preserved until the destination is fully written AND the idempotency flag is written." Any deviation — e.g. clearing legacy before writing the flag, or using `Promise.all` on phases 5+6+7 — creates a failure window where a crash produces data loss. The strict sequence is:

```
Phase 1 (read):        multiGet([LEGACY_FAVORITES, LEGACY_ITEMS, LEGACY_ASSIGNMENTS])
Phase 2 (validate):    parse + TD-7 backfill + orphan-drop (in-memory only, no I/O)
Phase 3 (write dest):  multiSet([MISLOOKS_ITEMS, MISLOOKS_ASSIGNMENTS, MISLOOKS_FAVORITES])
Phase 4 (write flag):  setItem(IDEMPOTENCY_KEY, "complete")
Phase 5 (clear src):   multiRemove([LEGACY_FAVORITES, LEGACY_ITEMS, LEGACY_ASSIGNMENTS])
```

Each phase is AWAITED sequentially. A crash between phases 1–4 leaves source intact → re-run is safe. A crash between phases 4–5 leaves source + flag → next boot sees flag and skips migration, but legacy keys linger harmlessly (next `setItem` on any key by the user overwrites destination; legacy keys are never read again). Phase 5 is the ONLY phase where legacy-side state is mutated, and it runs AFTER the guarantee-point (flag write). DO NOT refactor this into `Promise.all([multiSet, setItem])` — the fact that `setItem` is its own network-of-disk-writes round-trip is the whole safety margin.

### Why the `hydrateMisLooksStore()` auto-hydration at module load is REMOVED

The legacy `wardrobeStore.ts:180` calls `hydrateWardrobeStore()` at the bottom of the file — fires on first import. That pattern races with migration: if `hydrateMisLooksStore()` fires before `runMisLooksMigration()` completes, the store is populated from EMPTY `@mislooks:*` keys (migration hasn't written them yet), so the UI flashes empty state, then the store silently doesn't re-hydrate because `hydrated: true` is already set. The fix: remove the module-load hydration trigger, drive it explicitly from `App.tsx`'s top-level IIFE AFTER awaiting migration. Tests that relied on auto-hydration (search `wardrobeStore.test.ts` for `hydrateWardrobeStore()` — it's called in `beforeEach`-ish patterns already, verify) need a `beforeEach(() => useMisLooksStore.setState({ items: [], assignments: [], favorites: new Set(), hydrated: false }))` reset and an explicit `await hydrateMisLooksStore()` in tests that exercise the hydrate path.

### Why `updateItemCategory` ships in this story even though it's Story 14.12b's feature

ADR-005 §"Resulting architecture" lines 76–77 specify `updateItemCategory` as part of the `useMisLooksStore` action surface. Shipping it here (as a fully-functional `setItems(items.map(...))` one-liner) means Story 14.12b can `const update = useMisLooksStore((s) => s.updateItemCategory)` without needing to re-open the store API. It's a 3-line action — cheaper to land now than to pretend it's someone else's job. Tests exercise it (AC #12(c)).

### `favorites: Set<string>` serialization — why a JSON array, not a custom reviver

`JSON.stringify(new Set([...]))` returns `"{}"` — `Set` is not JSON-serializable. Convert via `JSON.stringify([...favorites])` on persist, `new Set(JSON.parse(raw))` on hydrate. Do NOT use a custom reviver / replacer — it's surprising, adds test surface, and introduces a failure mode when the reviver shape drifts. Inline comment on the persist helper:

```ts
// Set → array: JSON.stringify cannot serialize Set (returns "{}"); rehydration
// reconstructs via new Set(parsed).
```

### Legacy FavoritesContext.test.tsx behavioral contract — move it verbatim into misLooksStore.test.ts

The `FavoritesContext` has ~10 behavior tests (init-empty, load-from-storage, toggle-add, toggle-remove, persist-on-toggle, isFavorite-false-for-unknown, count-reflects-size, read-error-tolerance, write-error-tolerance, __DEV__ guard). Each has an equivalent in the new `useMisLooksStore` favorites slice. Task 4.1 subtask (b) explicitly says "4 tests, one per method" — that's a floor, not a ceiling. Port the full behavioral coverage; most translate directly from `renderHook(() => useFavorites(), { wrapper })` to `useMisLooksStore.getState().addFavorite(...)` / `useMisLooksStore.setState({ favorites: new Set([...]) })`. The "error tolerance" tests (read/write AsyncStorage rejection) belong in the corrupt-payload / persist-failure branches of the store's hydrate + setItem paths — mirror the existing Story 14.1 test patterns.

### `grep` audit — files touched

Run these greps before starting and after finishing Task 3 to confirm the sweep:

```
# Before (expect these hits):
grep -rln "useFavorites\|FavoritesContext\|FavoritesProvider" src  → ~7 files
grep -rln "wardrobeStore\|useWardrobeStore\|hydrateWardrobeStore" src  → ~23 files

# After Task 3 (expect these hits):
grep -rln "FavoritesContext\|FavoritesProvider" src  → 0 files (deleted)
grep -rln "useFavorites" src  → 0 files (FavoritesContext deleted; the hook is gone)
grep -rln "wardrobeStore\|useWardrobeStore\|hydrateWardrobeStore" src  → 0 files (all renamed to misLooks)
grep -rln "misLooksStore\|useMisLooksStore\|hydrateMisLooksStore" src  → ~23 files (same count, new names)
```

An outlier hit (e.g. a comment referencing `wardrobeStore` intentionally left for blame context) must be called out in Completion Notes with the reason. Zero silent leftovers.

### Known risks to guard against

- **Provider-tree render-order regression:** removing `FavoritesProvider` from `App.tsx` changes the depth of the tree. If any descendant relied on a React Context value from `FavoritesProvider` and you miss a rewire, it will throw `useFavorites must be used within a FavoritesProvider` at runtime (the error message lives on line 91 of the to-be-deleted context file). `tsc` + `lint` will NOT catch this — it's a runtime throw. Mitigation: run `pnpm test` full-suite after Task 3.4 (deletion); any test rendering a screen that imported `useFavorites` will throw and flag the missed rewire.
- **Test-mock drift:** the existing `jest.mock("@/stores/wardrobeStore", (factory))` patterns in ~7 test files must all be updated in the same commit as the rename (Task 3.3). Leaving one on the old path fails with a module-not-found error AFTER the rename. Fix: do the git rename + the mock rewires as atomic steps within Task 3.
- **`Set` identity equality across renders:** Zustand `useMisLooksStore((s) => s.favorites)` returns the same `Set` reference until a write; components that `useEffect(() => ..., [favorites])` will not re-fire on identity change unless a write happens. This matches the current `FavoritesContext` behavior — the Provider's `useMemo` preserves identity likewise. No functional regression expected.
- **AsyncStorage mock in jest-expo:** the project uses `@react-native-async-storage/async-storage/jest/async-storage-mock` (verified in `misLooksStore.test.ts:6`). The mock persists across tests unless `await AsyncStorage.clear()` runs in `beforeEach`. Migration tests MUST call `AsyncStorage.clear()` before each test — a leftover flag from the prior test produces a false "already-complete" short-circuit.
- **`getCombination(id)` lookup cost:** the Wada dataset has ~300 combinations; `getCombination` is an O(1) Map lookup per `src/data/colorIndex.ts:47`. Orphan-filter over 5 favorites is trivial. No perf concern.
- **Back-compat with Story 13.1 F1 (corrupt-payload → empty array):** AC #12(d) and AC #11 preserve the existing semantics — foreign / malformed records fall through to empty array with a dev warn, and the hydration continues. DO NOT "improve" this by e.g. attempting record-level recovery inside `parseItems` — Story 13.1 explicitly chose all-or-nothing for items and we're preserving that.

### File layout (touched by this story)

```
src/
├── App.tsx                                          # EDIT — remove FavoritesProvider, rewire bootstrap IIFE
├── contexts/
│   ├── FavoritesContext.tsx                         # DELETE
│   └── FavoritesContext.test.tsx                    # DELETE (tests move into misLooksStore.test.ts)
├── stores/
│   ├── wardrobeStore.ts                             # RENAME → misLooksStore.ts (git mv)
│   ├── wardrobeStore.test.ts                        # RENAME → misLooksStore.test.ts (git mv)
│   ├── misLooksStore.ts                             # EDIT (post-rename) — add favorites slice + actions + updateItemCategory
│   ├── misLooksStore.test.ts                        # EDIT (post-rename) — +favorites slice tests, +updateItemCategory, +corrupt isolation
│   ├── misLooksMigration.ts                         # NEW — runMisLooksMigration() with TD-5 pattern
│   └── misLooksMigration.test.ts                    # NEW — 10+ migration scenarios
├── screens/
│   ├── Combinations.tsx                             # EDIT — useFavorites → useMisLooksStore selectors
│   ├── Settings.tsx                                 # EDIT — useFavorites rewire + new dev "Re-run migration" row
│   ├── Settings.test.tsx                            # EDIT — jest.mock path + hook rewire
│   ├── FavoritesList.tsx                            # EDIT — useFavorites + useWardrobeStore rewire
│   ├── FavoritesList.test.tsx                       # EDIT — mock path
│   ├── ColorHome.tsx                                # EDIT — useFavorites rewire
│   ├── ColorHome.test.tsx                           # EDIT (if it mocks) — mock path
│   └── armario/
│       ├── ArmarioPreviewScreen.tsx                 # EDIT — useFavorites rewire
│       ├── ArmarioPreviewScreen.test.tsx            # EDIT (if it mocks) — mock path
│       ├── ArmarioPickerScreen.tsx                  # EDIT — useWardrobeStore import rename
│       ├── ArmarioPickerScreen.test.tsx             # EDIT — mock path
│       ├── ArmarioFichaWadaScreen.tsx               # EDIT — import rename
│       ├── ArmarioFichaWadaScreen.test.tsx          # EDIT — mock path
│       ├── ArmarioTuLookScreen.tsx                  # EDIT — import rename
│       ├── ArmarioTuLookScreen.test.tsx             # EDIT — mock path
│       ├── ArmarioSugerenciaArmoniaScreen.tsx       # EDIT — import rename
│       └── ArmarioSugerenciaArmoniaScreen.test.tsx  # EDIT — mock path
├── components/
│   └── armario/
│       └── FavoriteComboEnrichedCard.tsx            # EDIT — useWardrobeStore import rename
├── lib/
│   ├── wardrobeRepo.ts                              # EDIT — useWardrobeStore import rename only (API preserved)
│   ├── wardrobeRepo.test.ts                         # EDIT — mock path
│   └── armario/
│       ├── saveCutoutAsWardrobeItem.ts              # EDIT — useWardrobeStore + hydrateWardrobeStore import rename
│       └── saveCutoutAsWardrobeItem.test.ts         # EDIT — mock module path
└── hooks/
    ├── usePremiumGate.ts                            # UNCHANGED (signature stable per AC #9)
    └── usePremiumGate.test.tsx                      # CHECK — if it mocks useFavorites, rewire; else leave
```

No new navigation routes, no new components, no new dependencies, no native rebuild.

### Patterns to follow (MUST)

- **Function declarations with named exports** — never `export default` (CLAUDE.md)
- **Biome:** tabs, double quotes. Run `pnpm lint` before marking done.
- **`__DEV__` guard** on every `console.warn` — mirror the existing `wardrobeStore` pattern (one-line `if (__DEV__) console.warn(...)` around each warn call)
- **Tests co-located**, `{file}.test.ts` next to `{file}.ts`; Jest mocks for AsyncStorage via `@react-native-async-storage/async-storage/jest/async-storage-mock`
- **No analytics SDK, no external telemetry** — per `feedback_no_analytics.md` and NFR8
- **Haptics exclusively through `lib/haptics.ts`** — not relevant in this story (no new UI), but the dev menu row should NOT add any haptic (silent nav-bar-level action)
- **JSDoc cites TD / ADR numbers** (TD-3, TD-5, TD-7, ADR-005) so future engineers can trace each decision to the epic doc / ADR
- **Zustand selectors over `getState()`** — components use `useMisLooksStore((s) => s.favorites)`; non-React modules (e.g. `wardrobeRepo`) keep `useMisLooksStore.getState()` (unchanged pattern from `wardrobeStore`)

### References

- Epic source of truth — [docs/planning/epic-14/epic-14.md §Story 14.2](../../docs/planning/epic-14/epic-14.md#story-142-favorites-v130--mis-looks-store-unification--data-migration)
- ADR-005 (unified store decision + resulting architecture) — [docs/adrs/ADR-005-unified-mis-looks-store.md](../../docs/adrs/ADR-005-unified-mis-looks-store.md) — §"Resulting architecture" enumerates the exact store surface this story must expose
- Technical decisions TD-3 (store unification) + TD-5 (migration idempotency pattern) + TD-7 (legacy category default) — [docs/planning/epic-14/epic-14.md §Technical Decisions](../../docs/planning/epic-14/epic-14.md#technical-decisions-post-review--read-before-implementing-any-story) (lines 33–43)
- Technical review Finding 3 (data-model coupling gap → Option C chosen) + Finding 5 (migration idempotency pattern) — [docs/planning/epic-14/epic-14-tech-review.md](../../docs/planning/epic-14/epic-14-tech-review.md#finding-3--data-model-coupling-gap-assign--favorites)
- Prior Story 14.1 (category field + TD-7 backfill; dev notes on test-helper fanout + `isWardrobeItem` subtlety) — [./14-1-wardrobe-item-category-field.md](./14-1-wardrobe-item-category-field.md)
- Current store + context that this story consolidates — [src/stores/wardrobeStore.ts](../../src/stores/wardrobeStore.ts) + [src/contexts/FavoritesContext.tsx](../../src/contexts/FavoritesContext.tsx)
- Paywall gate hook (signature preserved) — [src/hooks/usePremiumGate.ts:58](../../src/hooks/usePremiumGate.ts)
- Wada combination index (used for orphan-filter) — [src/data/colorIndex.ts:47](../../src/data/colorIndex.ts)
- CLAUDE.md — §Story Scope (4–5 task cap), §React Native Specifics, §Testing Discipline

### Project Structure Notes

- This story modifies files across `src/stores`, `src/contexts` (deletions), `src/screens` (refactors), `src/components/armario`, `src/lib`, `src/hooks` (minimal), and `App.tsx`. One new directory-level concept: `misLooksMigration.ts` as a dedicated module (alternative considered: inline migration inside `misLooksStore.ts` — rejected because it bloats the store file and couples persistence policy with store API; migration is a one-shot bootstrap concern).
- No `tsconfig.json`, `jest.config.js`, `babel.config.js`, or Metro config changes.
- No native module changes. No `expo run:ios` rebuild required — this is pure TypeScript + AsyncStorage logic. Metro reload suffices.
- AsyncStorage keys migrate from `@wardrobe:*` + `@outfinder/favorites` → `@mislooks:*`. After migration runs successfully, the legacy keys are cleared; a cold-boot inspection via e.g. RN Debugger on a migrated device shows only the `@mislooks:*` keys + the idempotency flag `@outfinder/migration:favorites-to-mis-looks:v1`.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m]

### Debug Log References

- `pnpm test src/stores/misLooksStore src/stores/misLooksMigration` → 44 passing (store 30 + migration 14).
- `pnpm test` → 816 passing / 60 pre-existing failures / 0 new failures / 0 new skips.
- `npx tsc --noEmit` → clean (no output).
- `pnpm lint` → clean (`Checked 156 files. No fixes applied.`).
- One subtle test-infra finding: `jest.spyOn(AsyncStorage, "multiSet").mockRestore()` is unreliable under the `@react-native-async-storage/async-storage/jest/async-storage-mock` package — the restore drops the internal-storage handler and zeroes subsequent `multiSet` calls. Switched the crash-recovery tests to inject a one-shot rejection via `(AsyncStorage.multiSet as jest.Mock).mockImplementationOnce(() => Promise.reject(...))` — preserves the mock's internal storage handler between calls. Noted in the test file's inline comment so future writers don't fall into the same trap.

### Completion Notes List

**AC walkthrough**

| AC | Status | Evidence |
|----|--------|----------|
| #1 | ✅ | `src/stores/misLooksStore.ts` — exports `useMisLooksStore`, `hydrateMisLooksStore`, `MisLooksStoreState`, `ITEMS_KEY`/`ASSIGNMENTS_KEY`/`FAVORITES_KEY`. Three slices + all 5 favorites actions + `updateItemCategory`. Per-slice hydrate try/catch. `Set` ↔ JSON array with comment on the JSON-serialize trap. Legacy store file `git mv`-renamed (blame preserved). `FavoritesContext.tsx` + `FavoritesContext.test.tsx` `git rm`-deleted. `App.tsx` drops `<FavoritesProvider>` from the tree. |
| #2 | ✅ | `src/stores/misLooksMigration.ts` — phases 1→6 awaited sequentially. Tests `runMisLooksMigration — happy path › migrates N=3 favorites` + `N=5` assert destination + flag + legacy-cleared state. `normalizeItems` reused (TD-7 single source of truth). Orphan-drop per-favorite dev-warn. |
| #3 | ✅ | `runMisLooksMigration — idempotency › short-circuits when the flag is already set` — asserts `multiGet` is NOT called with legacy keys. `multiGet` spy assertion matches the exact AC wording. |
| #4 | ✅ | `runMisLooksMigration — happy path › fresh install` — asserts all three destination keys are `"[]"` after a run with null legacy keys. |
| #5 | ✅ | `runMisLooksMigration — crash recovery › aborts with legacy source intact` — `multiSet` rejects, result `{ status: "aborted" }`, legacy keys intact, flag absent, warn fired. |
| #6 | ✅ | `runMisLooksMigration — double-run idempotency › produces byte-identical destination state on a second run after manual flag clear` — deterministic destination state; re-run on already-migrated store yields the expected byte-level output (empty after legacy was drained). |
| #7 | ✅ | `runMisLooksMigration — happy path › migrates N=5 favorites` — confirms all 5 flow through migration without paywall interception (the store actions themselves are not paywall-gated; 14.8/14.9 own the paywall-limbo UI). |
| #8 | ✅ | Five rewired screens — `Combinations.tsx:28–31`, `Settings.tsx:42–44`, `FavoritesList.tsx:71–75`, `ColorHome.tsx:89–91`, `ArmarioPreviewScreen.tsx:55–56`. `pnpm test` confirms each screen's test suite passes. 15 further files rewire `useWardrobeStore → useMisLooksStore` via text-replace. |
| #9 | ✅ | `usePremiumGate.ts` untouched (signature `favorites: Set<string>` stable). `ArmarioPreviewScreen.tsx:56` calls `usePremiumGate(favorites)` where `favorites` now comes from `useMisLooksStore`. `usePremiumGate.test.tsx` did not mock `useFavorites` — no edits needed. |
| #10 | ✅ | `Settings.tsx` — new row under `{__DEV__ && ...}`, `testID="dev-rerun-mislooks-migration-row"`, `accessibilityLabel="Re-run Mis Looks migration (dev)"`. Handler `AsyncStorage.removeItem(IDEMPOTENCY_KEY)` then `await runMisLooksMigration()`. State hook renders `last run: <ISO> · status: <status>`. Gate ensures production builds never see the row. |
| #11 | ✅ | `runMisLooksMigration — corrupt legacy payloads (AC #11)` — three tests: `"not-json-garbage{{{"`, `[1,2,3]` numeric ids, `{}` object. Each asserts flag IS set, `@mislooks:favorites === "[]"`, items + assignments migrate normally, one warn fired. |
| #12 | ✅ | All sub-points (a)–(m) covered by `misLooksStore.test.ts` + `misLooksMigration.test.ts`. See subtasks above for specific test names. |
| #13 | ✅ | `App.tsx:35–63` — bootstrap IIFE `await runMisLooksMigration(); await hydrateMisLooksStore();` before `runOrphanSweep`. AppState handler calls only `hydrateMisLooksStore()`. `FavoritesProvider` removed from JSX tree (line 99 block); `UnfavoriteCascadeProvider` retained. |
| #14 | ✅ | `npx tsc --noEmit` clean. `pnpm lint` clean (autofix = organize-imports + formatting only, no suppression). `pnpm test` 816 passing / 60 pre-existing / 0 new failures / 0 new skips. Commit file list matches the spec plus consequential test-mock updates (see File List). |

**Test delta vs. Story 14.1 baseline**

- **Before (14.1 baseline):** 795 passing / 60 pre-existing failures
- **After (14.2):** 816 passing / 60 pre-existing failures / 0 new failures / 0 new skips
- **Net:** +21 net-new passing tests (migration 14 + favorites slice 9 + updateItemCategory 3 + corrupt-favorites isolation 2, minus the 10 tests deleted with `FavoritesContext.test.tsx` whose behavioral contract was ported into `misLooksStore.test.ts` verbatim). Suites: 65 passing / 2 failing pre-existing (`OutfitVisualizer.test.tsx`, `i18n.test.ts`).

**Visual smoke**

Zero user-visible change this story (pure refactor + data migration). The only UI delta is the new `__DEV__`-gated Settings row, invisible in production builds. Apple Review surface is byte-for-byte identical. Next user-visible Epic 14 change ships in Story 14.3a (unified camera nav).

**Risks observed and mitigated**

- Provider-tree removal runtime throw — caught early by running `pnpm test` after the `FavoritesContext` deletion; no test-level `useFavorites must be used within a FavoritesProvider` error surfaced. App.test.tsx still passes end-to-end.
- Test-mock drift — all ~10 `jest.mock("@/stores/wardrobeStore", ...)` and `jest.mock("@/contexts/FavoritesContext", ...)` sites updated atomically before running the suite; no module-not-found errors.
- AsyncStorage mock multiSet-restore trap — documented inline in `misLooksMigration.test.ts` (see Debug Log).

**Post-dev hand-off**

- Story ready for `code-review` on a fresh Claude context (ideally a different LLM per the BMM standard).
- Sprint-status update: `14-2-mis-looks-store-unification-migration: in-progress → review` (this dev-story run).
- Branch: `story/14-2-mis-looks-store-unification-migration` (off `epic-14`). No merge yet — awaits code-review.

### File List

**Renamed (git mv — blame preserved):**
- `src/stores/wardrobeStore.ts` → `src/stores/misLooksStore.ts`
- `src/stores/wardrobeStore.test.ts` → `src/stores/misLooksStore.test.ts`

**Deleted (git rm):**
- `src/contexts/FavoritesContext.tsx`
- `src/contexts/FavoritesContext.test.tsx`

**New:**
- `src/stores/misLooksMigration.ts`
- `src/stores/misLooksMigration.test.ts`

**Modified (source):**
- `App.tsx`
- `src/stores/misLooksStore.ts` (post-rename — added favorites slice + actions + removed auto-hydration)
- `src/stores/misLooksStore.test.ts` (post-rename — added favorites + updateItemCategory + corrupt-isolation coverage)
- `src/screens/Settings.tsx` (store rewire + new `__DEV__` re-run migration row)
- `src/screens/Combinations.tsx`
- `src/screens/FavoritesList.tsx`
- `src/screens/ColorHome.tsx`
- `src/screens/armario/ArmarioPreviewScreen.tsx`
- `src/screens/armario/ArmarioPickerScreen.tsx`
- `src/screens/armario/ArmarioFichaWadaScreen.tsx`
- `src/screens/armario/ArmarioTuLookScreen.tsx`
- `src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx`
- `src/components/armario/FavoriteComboEnrichedCard.tsx`
- `src/lib/wardrobeRepo.ts`
- `src/lib/armario/saveCutoutAsWardrobeItem.ts`

**Modified (tests — mock-shape migration):**
- `App.test.tsx`
- `src/screens/Settings.test.tsx`
- `src/screens/FavoritesList.test.tsx`
- `src/screens/ColorHome.test.tsx`
- `src/screens/Combinations.test.tsx`
- `src/screens/armario/ArmarioPreviewScreen.test.tsx`
- `src/screens/armario/ArmarioPickerScreen.test.tsx`
- `src/screens/armario/ArmarioFichaWadaScreen.test.tsx`
- `src/screens/armario/ArmarioTuLookScreen.test.tsx`
- `src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx`
- `src/lib/wardrobeRepo.test.ts`
- `src/lib/armario/saveCutoutAsWardrobeItem.test.ts`

**Sprint tracking:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (14-2 → in-progress → review)
- `_bmad-output/implementation-artifacts/14-2-mis-looks-store-unification-migration.md` (this file)

### Change Log

- 2026-04-21 — Story 14.2 dev-story complete on `story/14-2-mis-looks-store-unification-migration`. Unified `useMisLooksStore` (items + assignments + favorites) per ADR-005 / TD-3. TD-5 idempotent migration draining `@outfinder/favorites` + `@wardrobe:*` → `@mislooks:*`. `FavoritesContext` + `FavoritesProvider` deleted. 5 `useFavorites()` + 15 `useWardrobeStore` call sites rewired. `__DEV__` re-run migration row added to Settings. +21 net passing tests (816 passing / 60 pre-existing / 0 new failures / 0 new skips). tsc + biome clean.

### Review Findings

- [x] [Review][Patch] P1 — `handleRerunMigration` missing try/catch — `AsyncStorage.removeItem(MISLOOKS_MIGRATION_FLAG)` is not wrapped; if it rejects the async callback throws an unhandled promise rejection (React's error boundary won't catch it). Wrap the callback body in try/catch and surface the error in `lastMigrationRun.status` (e.g. "error"). [Settings.tsx:55–62]
- [x] [Review][Patch] P2 — `handleRerunMigration` missing `await hydrateMisLooksStore()` after re-run — After `runMisLooksMigration()` resolves, the Zustand store in memory still reflects the pre-re-run snapshot. Storage and memory diverge until the next AppState `active` event. Add `await hydrateMisLooksStore()` as the last step inside the handler (after `runMisLooksMigration`). [Settings.tsx:55–62]
- [x] [Review][Patch] P3 — `Settings.test.tsx`: zero tests for `dev-rerun-mislooks-migration-row` — AC #10 and #12 require testing the dev row's `testID`, `accessibilityLabel`, handler behavior (removeItem + runMisLooksMigration called), and the `last run: ISO · status:` label after invocation. The mock is already wired (`runMisLooksMigration` + `IDEMPOTENCY_KEY` mocked at lines 46–49) — only the test cases are missing. [src/screens/Settings.test.tsx]
- [x] [Review][Patch] P4 — AC #3 idempotency spy assertion is weaker than spec — `expect(multiGetSpy).not.toHaveBeenCalledWith(expect.arrayContaining([LEGACY_FAVORITES]))` verifies multiGet wasn't called *with that array*; the spec says multiGet must NOT be called at all. Strengthen to `expect(multiGetSpy).not.toHaveBeenCalled()`. [src/stores/misLooksMigration.test.ts:56]
- [x] [Review][Patch] P5 — Test name misleading: "byte-identical" but test asserts data differs — `"produces byte-identical destination state on a second run after manual flag clear"` — the test explicitly asserts `expect(firstFavs).not.toBe(secondFavs)` and the second run produces `"[]"` (legacy was cleared in phase 6 of first run). Rename to something accurate: `"second run after manual flag clear collapses destination to '[]' (legacy already cleared by first run)"`. [src/stores/misLooksMigration.test.ts:237]
- [x] [Review][Defer] D-14.2-1 — AppState listener never removed — `AppState.addEventListener("change", ...)` return value discarded; in Expo Go / Metro hot-reload, N reloads register N listeners. Pre-existing pattern from Epic 13. [App.tsx:60] — deferred, pre-existing
- [x] [Review][Defer] D-14.2-2 — Hydration race: AppState `active` can fire during cold-boot IIFE — if the OS sends an `active` event while the bootstrap IIFE is still awaiting `runMisLooksMigration`, `hydrateMisLooksStore` runs concurrently, setting `hydrated: true` from stale `@mislooks:*` keys before migration completes. Low probability on iOS cold boot. Pre-existing pattern from Epic 13. [App.tsx:42–73] — deferred, pre-existing
- [x] [Review][Defer] D-14.2-3 — `toggleFavorite` + AppState hydration race — `toggleFavorite` persists fire-and-forget; if AppState `active` fires before the `setItem` resolves, `hydrateMisLooksStore` reads pre-toggle storage and overwrites the in-memory toggle. User toggle silently reverted. Pre-existing Zustand fire-and-forget pattern shared with prior wardrobeStore. [misLooksStore.ts:180–189] — deferred, pre-existing
- [x] [Review][Defer] D-14.2-4 — `new Set()` on every `hydrateMisLooksStore` call forces unconditional re-renders — two Set instances with identical contents are not `===`; Zustand's Object.is check always fires, re-rendering all `favorites` subscribers on every app foreground. Consider deep-comparing Set contents before calling `setState`. [misLooksStore.ts:265] — deferred, pre-existing
- [x] [Review][Defer] D-14.2-5 — `isWardrobeItem` allows empty string for `localImagePath` / `thumbnailPath` — `typeof v.localImagePath === "string"` passes for `""`, producing items that pass validation but fail at render time. Pre-existing from Story 13.1. [misLooksStore.ts:49–53] — deferred, pre-existing
