---
id: ADR-005
title: Unified `useMisLooksStore` — merge wardrobe items, assignments, and favorites into a single Zustand store
status: accepted
date: 2026-04-21
deciders:
  - Alejandro (Product / Tech Lead)
  - Winston (System Architect)
relatedEpic: Epic 14
relatedStories:
  - 14.2 (migration + store unification)
  - 14.8 (auto-save on first assignment)
  - 14.9 (Guardar para luego)
supersedes: none
---

# ADR-005 — Unified `useMisLooksStore`

## Status

**Accepted** · 2026-04-21

## Context

Epic 13 (Armario Virtual, shipped on `epic-13` branch, commit `eae624e`) introduced a Zustand-backed store `useWardrobeStore` persisted in AsyncStorage, owning:

- `items: WardrobeItem[]` — user-photographed garments with `localImagePath`, `thumbnailPath`.
- `assignments: CombinationAssignment[]` — per-slot assignments of items into Wada combinations (`combinationId` + `colorIndex` → `wardrobeItemId`).

Concurrently, since Epic 4, the app has had a React Context `FavoritesContext` owning:

- `favorites: Set<string>` — combinationIds marked as favorites by the user (persisted to AsyncStorage key `@outfinder/favorites`).
- API: `toggleFavorite(id)`, `isFavorite(id)`, `count`.

The two stores have **lived independently**. A "favorite" in v1.3.0 was a bookmark. A "look with assigned garments" in Epic 13 was a separate concept. The mental model was: *"favorite the paletas you like; separately, assign garments when you're in Ficha Wada."*

## Problem

Epic 14 introduces **FR12** (auto-save look to Mis Looks on first garment assignment). This reframes the semantic model: "Mis Looks" is now a single workspace that blends (a) the user's favorite combinations and (b) the garments they've assigned to those combinations.

Implementing FR12 requires that `wardrobeRepo.assign(combinationId, colorIndex, wardrobeItemId)` — currently a pure function touching only `useWardrobeStore` — now also:

1. Check whether `combinationId` is already in Favorites.
2. If not: attempt to add it, respecting the `FREE_FAVORITES_LIMIT = 5` paywall gate.
3. On paywall trip: reject the assignment.
4. On success: persist both the favorite and the assignment atomically.

The current architecture makes this impossible: `wardrobeRepo` is a pure module that cannot reach into a React Context (`FavoritesContext`). The available options were:

| Option | Shape | Pros | Cons |
|--------|-------|------|------|
| **A — Move Favorites to its own Zustand store** | `useFavoritesStore` + `useWardrobeStore` as siblings | Both are pure-JS stores; `wardrobeRepo` can read/write either. Low refactor cost. | Perpetuates the two-store split. Semantic mismatch: the rename to "Mis Looks" implies one concept, but we have two stores. |
| **B — Pure-JS orchestrator layer** | Keep `FavoritesContext` as public API; add `wardrobeActions.ts` that receives `{ addToFavorites, isPremium, ... }` as injected deps from the React call site | Smallest code change (~0.5 days). | Adds indirection; doesn't solve the root problem. Call sites become verbose and leaky. |
| **C — Unify everything into `useMisLooksStore`** | Rename `useWardrobeStore` → `useMisLooksStore`; add `favorites: Set<string>` as a new slice; delete `FavoritesContext` | Data model reflects the product mental model ("Mis Looks is the workspace"). Simpler consumers (one hook). Eliminates cross-store orchestration forever. | Higher refactor cost (~2 days). Migration of existing users needed. |

## Decision

**Option C: Unify into `useMisLooksStore`.**

The data layer MUST reflect the product's mental model. Epic 14 explicitly reframes the app around "Mis Looks = your workspace". Having `items + assignments + favorites` owned by three different abstractions (Zustand store + Zustand store slice + React Context) was a structural artifact of incremental development, not a deliberate design choice. Epic 14 is the cheapest moment to fix it because the rename `Favorites → Mis Looks` is already touching the UX and storage layer — we're already paying the migration cost.

## Resulting architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    useMisLooksStore (Zustand)                │
│                  persisted to AsyncStorage                   │
├─────────────────────────────────────────────────────────────┤
│  items: WardrobeItem[]          → @mislooks:items            │
│  assignments: CombinationAssignment[]  → @mislooks:assignments│
│  favorites: Set<string>         → @mislooks:favorites        │
│                                                              │
│  actions:                                                    │
│    addItem(input, isPremium)                                 │
│    removeItem(id)                                            │
│    updateItemCategory(id, category)        [NEW for TD-6]    │
│    assign(combinationId, colorIndex, wardrobeItemId, isPremium)
│      → atomically: checks paywall, adds to favorites if needed, │
│                    writes assignment                         │
│    unassign(combinationId, colorIndex)                       │
│    cascadeDeleteAssignmentsForItem(id)                       │
│    cascadeDeleteAssignmentsForCombination(combinationId)     │
│    addFavorite(id, isPremium)      [formerly FavoritesContext]│
│    removeFavorite(id)              [formerly FavoritesContext]│
│    toggleFavorite(id, isPremium)   [formerly FavoritesContext]│
│    isFavorite(id): boolean                                    │
└─────────────────────────────────────────────────────────────┘
```

**Deleted abstractions:**
- `src/contexts/FavoritesContext.tsx` — removed entirely.
- `FavoritesProvider` from `App.tsx` — removed.
- All imports of `useFavorites()` → rewired to `useMisLooksStore` selectors.

**Renamed abstractions:**
- `src/stores/wardrobeStore.ts` → `src/stores/misLooksStore.ts` (keeps existing file moved + renamed).
- `useWardrobeStore` → `useMisLooksStore`.
- AsyncStorage keys `@wardrobe:*` → `@mislooks:*` (migrated by Story 14.2).
- Legacy `@outfinder/favorites` → migrated into `useMisLooksStore.favorites` slice by Story 14.2.

## Consequences

### Positive

- **Semantic coherence:** the code matches the product mental model. A new engineer reading the app understands "Mis Looks owns X, Y, Z" in one place.
- **No cross-store orchestration:** `assign` is atomic within a single Zustand `setState` call. FR12 (auto-save on first assignment) is trivial to implement correctly.
- **Simpler paywall integration:** `FREE_FAVORITES_LIMIT` gate lives in one place (the unified store's `addFavorite` action), consumed by both the explicit "Guardar para luego" and the implicit auto-save from `assign`.
- **Eliminates FavoritesContext + Provider plumbing:** less code, fewer rerenders, one less abstraction.
- **Future features scale naturally:** adding v1.5.0 features (reverse outfit generator, category filters, wardrobe analytics) is trivial — they all read from a single store.

### Negative

- **Refactor cost:** ~2 days of focused work (Story 14.2). Touches roughly 10–15 files.
- **Breaking change for any external reader of AsyncStorage:** any hypothetical debug tool or internal script that read `@wardrobe:*` or `@outfinder/favorites` directly would break. (None known; this is theoretical.)
- **User migration risk:** migrating v1.3.0 users' favorites into the new store shape introduces a one-time risk of data loss if not implemented with the TD-5 idempotency pattern. Mitigated by exhaustive tests + dev-menu re-run capability.
- **Higher blast radius if bug:** a single store owning all persistent user data means a bug in one action can corrupt multiple slices. Mitigated by unit tests covering each action + AC coverage in Story 14.2.

### Neutral

- **Zustand selector performance:** the new store has ~3 slices instead of 2 + Context. Selector granularity is preserved via `useMisLooksStore((s) => s.items)` etc. No performance change expected.

## Implementation path

1. **Story 14.1** — extend `WardrobeItem` with `category` field (prerequisite for store schema).
2. **Story 14.2** — implement the unification and migration. This is where ADR-005 lands. AC covers:
   - Create `useMisLooksStore` with all three slices.
   - Migrate existing `useWardrobeStore` callers to new name/API.
   - Migrate existing `FavoritesContext` callers to new store API.
   - Delete `FavoritesContext` + `FavoritesProvider` + AsyncStorage `@outfinder/favorites` key.
   - Run TD-5 idempotency-flag-gated migration from legacy to new AsyncStorage keys.
3. **Story 14.8** — update `assign` to orchestrate auto-save into `favorites` slice with paywall gate.
4. **Story 14.9** — use new `addFavorite` with paywall gate for the explicit "Guardar para luego" path.
5. **Story 14.12b** — add `updateItemCategory(id, category)` action to the store for edit-category affordance.

## Alternatives considered (and rejected)

### Option A — `useFavoritesStore` alongside `useWardrobeStore`

Rejected because it perpetuates the two-store split at the very moment we're renaming Favorites to Mis Looks. The semantic mismatch between code and product would accumulate into technical debt over the next 6 months as v1.5.0 features are added.

### Option B — Orchestrator layer with injected dependencies

Rejected because it's a short-term fix that defers the structural problem. It would also create a confusing call-site pattern: `assignGarmentWithAutoFavorite({ combinationId, colorIndex, wardrobeItemId, addToFavorites, isPremium, getFavorites })` — every consumer has to thread through a growing list of dependencies.

### Option D (considered, not above) — Leave FavoritesContext, bypass via global side-door

E.g., export a mutable module-level reference to the setter function from `FavoritesContext`. Rejected because it creates a React-to-non-React leak that is an anti-pattern, fails under concurrent mode, and would confuse future engineers reading the code.

## Verification

- Story 14.2 tests must cover: all three slices persisted correctly, migration idempotent, grandfathering at 5/5, orphan combinationId drop with warn log, legacy source key cleared only after idempotency flag written.
- Story 14.8 tests must cover: `assign` triggers auto-favorite on first assignment, paywall trip rejects both writes atomically, second assignment to same combinationId does NOT re-add to favorites.
- Story 14.13 (on-device QA) verifies the end-to-end user experience post-migration.

## Related decisions

- **TD-1** (Swift module returns dominantHex directly) — orthogonal; does not affect store design.
- **TD-2** (Unified camera in RootStack) — orthogonal; navigation-only.
- **TD-4** (Paywall-limbo disabled state) — UI-layer consequence of this decision; no store impact beyond the existing paywall gate.
- **TD-5** (Migration idempotency pattern) — directly enabling the migration this ADR mandates.
- **TD-6** (Edit category in v1.4.0) — requires the new `updateItemCategory` action in this store.
- **TD-7** (Legacy category default "top") — applied during the migration orchestrated by this ADR.

---

*End of ADR-005.*
