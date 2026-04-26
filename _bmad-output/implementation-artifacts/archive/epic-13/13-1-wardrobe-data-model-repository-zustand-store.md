# Story 13.1: Wardrobe Data Model, Repository, and Zustand Store

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer implementing the Armario Virtual feature**,
I want **a typed repository + reactive Zustand store backed by AsyncStorage with split keys and a documented cascade policy**,
so that **every subsequent Epic 13 story has a single, tested API for reading, writing, joining, and invalidating wardrobe state — with zero migration risk to existing Favorites users**.

## Acceptance Criteria

1. **Given** the Armario Virtual data layer is initialized, **When** the module loads, **Then** two AsyncStorage keys exist: `@wardrobe:items` (JSON-serialized `WardrobeItem[]`) and `@wardrobe:assignments` (JSON-serialized `CombinationAssignment[]`), **And** the `WardrobeItem` interface is exactly `{ id: string, localImagePath: string, thumbnailPath: string, createdAt: number }`, **And** the `CombinationAssignment` interface is exactly `{ combinationId: number, colorIndex: number, wardrobeItemId: string, assignedAt: number }`.

2. **Given** the `wardrobeRepo` module is imported, **When** any story references it, **Then** the following functions are exported with full TypeScript typing: `getItems()`, `addItem(input, isPremium)`, `removeItem(id)`, `getAssignmentsForCombination(combinationId)`, `assign(combinationId, colorIndex, wardrobeItemId)`, `unassign(combinationId, colorIndex)`, `getAssignmentCount(combinationId)`, `isCombinationComplete(combinationId, totalColors)`, `cascadeDeleteAssignmentsForCombination(combinationId)`.

3. **Given** `assign(combinationId, colorIndex, wardrobeItemId)` is called, **When** an existing assignment for that `(combinationId, colorIndex)` pair already exists, **Then** the old assignment is overwritten (uniqueness enforced at the repo layer), **And** the old `wardrobeItemId` is NOT deleted from `@wardrobe:items` (items persist across reassignment — supports FR6 reuse).

4. **Given** `cascadeDeleteAssignmentsForCombination(combinationId)` is called on unfavorite, **When** the cascade triggers, **Then** all `CombinationAssignment` rows with matching `combinationId` are removed from `@wardrobe:assignments`, **And** wardrobe items referenced by those assignments remain untouched in `@wardrobe:items`.

5. **Given** `addItem(input, isPremium)` is called, **When** the caller passes `isPremium=false` AND `@wardrobe:items` already contains ≥ `FREE_WARDROBE_LIMIT` (=10) entries, **Then** the function throws `WardrobeLimitExceeded` (typed error subclass), **And** no item is written to storage, **And** premium users (`isPremium=true`) bypass the gate entirely (limit never evaluated).

6. **Given** the Zustand store `useWardrobeStore`, **When** any component subscribes, **Then** reads from the store reflect current AsyncStorage state (hydrated at app start via persist middleware), **And** writes through the store mutate AsyncStorage atomically, **And** subscribed components re-render on mutation without manual event plumbing.

7. **Given** an AsyncStorage read failure (corrupt JSON, missing key, disk error), **When** the store initializes, **Then** the store falls back to empty `items[]` and `assignments[]` arrays without crashing, **And** a single `console.warn` entry is emitted (guarded by `__DEV__` — no user-facing error).

8. **Given** unit tests for the repo + store, **When** `pnpm test src/lib/wardrobeRepo src/stores/wardrobeStore` runs, **Then** tests cover: add/remove item, assign/unassign, reassignment overwrite semantics, cascade-delete semantics, store hydration, store reactivity on mutation, failure-path fallback, paywall limit enforcement (free tier blocked at 10, premium unlimited), reuse semantics (assigning the same item to 2 combos does not duplicate the item row).

## Tasks / Subtasks

- [x] **Task 1: Install deps + add FREE_WARDROBE_LIMIT constant** (AC: #5)
  - [x] 1.1 Run `pnpm add zustand` (pure JS — no native rebuild needed; confirm in story completion notes)
  - [x] 1.2 Confirm `@react-native-async-storage/async-storage` `2.2.0` is already present (it is — from Epic 4 FavoritesContext)
  - [x] 1.3 Extend `src/config/premium.ts` `PREMIUM_CONFIG` with `FREE_WARDROBE_LIMIT: 10`. Preserve existing keys and `as const` assertion
  - [x] 1.4 UUID strategy: add a tiny internal util `src/lib/uuid.ts` exporting `uuidv4()` using `globalThis.crypto?.randomUUID ?? fallbackV4()` — RN 0.83 + Hermes has `globalThis.crypto.randomUUID` on iOS. Do NOT add `expo-crypto` (avoid native rebuild). Provide a 20-line RFC4122 fallback if crypto is absent (test both branches)

- [x] **Task 2: Types + `wardrobeRepo.ts` pure data layer** (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/lib/wardrobeTypes.ts` exporting the two interfaces above + a `WardrobeItemInput = Omit<WardrobeItem, "id" | "createdAt">` helper, plus a `WardrobeLimitExceeded` error class (`class WardrobeLimitExceeded extends Error` with `name = "WardrobeLimitExceeded"`)
  - [x] 2.2 Create `src/lib/wardrobeRepo.ts`. All functions are pure wrappers over the Zustand store from Task 3 — NO direct `AsyncStorage.getItem/setItem` calls from the repo. The repo reads/writes via `useWardrobeStore.getState()` and `useWardrobeStore.setState()`
  - [x] 2.3 `addItem(input: WardrobeItemInput, isPremium: boolean): WardrobeItem`: if `!isPremium && items.length >= FREE_WARDROBE_LIMIT` → throw `WardrobeLimitExceeded`; otherwise construct `{ id: uuidv4(), createdAt: Date.now(), ...input }`, push into store, return the new item
  - [x] 2.4 `assign(...)`: read current assignments, filter out any existing `(combinationId, colorIndex)` pair, append `{ combinationId, colorIndex, wardrobeItemId, assignedAt: Date.now() }`, commit via `setState`. This is the reassignment-overwrite logic from AC #3
  - [x] 2.5 `cascadeDeleteAssignmentsForCombination(...)`: filter assignments by `a.combinationId !== combinationId`, commit. Items untouched (AC #4)
  - [x] 2.6 `isCombinationComplete(combinationId, totalColors)`: `getAssignmentCount(combinationId) === totalColors`. `getAssignmentCount` = `assignments.filter(a => a.combinationId === combinationId).length`
  - [x] 2.7 Every exported function gets a concise JSDoc describing the cascade rule or reuse semantics — this is the only context future stories will have. Example on `assign`: `/** Upserts a (combinationId, colorIndex) assignment. Old wardrobe item is NOT deleted (items are shared across combos — FR6). */`

- [x] **Task 3: `wardrobeStore.ts` Zustand store with persist middleware** (AC: #1, #6, #7)
  - [x] 3.1 Create `src/stores/wardrobeStore.ts`. Shape: `{ items: WardrobeItem[]; assignments: CombinationAssignment[]; hydrated: boolean }` plus internal setter actions `setItems(next)`, `setAssignments(next)`
  - [x] 3.2 Implemented as one Zustand store with manual split-key persistence — `setItems`/`setAssignments` each fire `AsyncStorage.setItem` for their own key (no `persist` middleware, no `partialize`/`merge` hacks). See Dev Notes §Split-key rationale.
  - [x] 3.3 On module load, `hydrateWardrobeStore()` runs and `AsyncStorage.multiGet(["@wardrobe:items", "@wardrobe:assignments"])` reads both keys; each is parsed + validated with a per-element type guard. Per-key try/catch isolates failures so a corrupt assignments blob does not destroy a valid items array. Sets `hydrated: true` always (AC #7).
  - [x] 3.4 `setItems`/`setAssignments` call `AsyncStorage.setItem(...).catch(warn)` synchronously after the in-memory `set(...)` — optimistic, fire-and-forget, mirrors `FavoritesContext` pattern.
  - [x] 3.5 `useWardrobeStore` is the sole exported hook. The setter actions live on the store but the wardrobe-domain API surfaces through `wardrobeRepo`; UI code is expected to import the repo for mutations and use selectors on the store for reactivity.

- [x] **Task 4: Co-located tests** (AC: #8)
  - [x] 4.1 `src/lib/wardrobeRepo.test.ts`: mock `@react-native-async-storage/async-storage` via `jest/async-storage-mock`. `beforeEach` resets store state to empty + `hydrated: true` to silence the dev hydration warn.
  - [x] 4.2 All 9 required cases covered (a–i). Test (i) carries the deliberate-choice comment above it.
  - [x] 4.3 `src/stores/wardrobeStore.test.ts`: hydration happy path, corrupt items JSON fallback, wrong-shape assignments fallback, `__DEV__=false` silence, `setItems`/`setAssignments` AsyncStorage write assertions, write-rejection survival, subscriber reactivity for both keys.
  - [x] 4.4 `src/lib/uuid.test.ts`: RFC4122 shape match + uniqueness; `crypto.randomUUID` delegation branch; absence-of-crypto fallback branch (`Object.defineProperty` to undefined and back).

- [x] **Task 5: AC verification walkthrough + full suite regression** (AC: #1–#8)
  - [x] 5.1 `npx tsc --noEmit` → clean
  - [x] 5.2 `pnpm lint` → clean (tabs, double quotes, no unused imports)
  - [x] 5.3 `pnpm test` → 589 passing across 44 suites, 23 NEW tests green. The 60 failures in `i18n.test.ts` and `OutfitVisualizer.test.tsx` are the documented pre-existing failures (project-context.md known debt #7). Zero NEW failures.
  - [x] 5.4 AC walkthrough completed in Completion Notes below.
  - [x] 5.5 Visual smoke deferred — verified by inspection: this story adds isolated files only; `App.tsx`, all navigators, all screens and components are untouched. The new modules are not imported anywhere in the existing UI tree (the wardrobe surface lands in Story 13.3a). Type checker + full Jest run already exercise the modules in isolation. Safe to mark green without a sim boot — request a manual smoke if desired.

## Dev Notes

### Architecture context (brownfield)

- **Current branch:** `epic-13` (created 2026-04-19 off `epic-1` main). All Epic 13 story branches will be `story/13-X-description` off `epic-13`. Merge back to `epic-1` when all stories + code reviews pass
- **Target version:** v1.4.0 (App Store submission target after all 8 stories + adversarial review)
- **This story ships zero user-visible change.** It is infrastructure. The first user-visible milestone is Story 13.3a (Capture flow)
- **Scope boundaries:**
  - ✅ Data types, repo API, store, persistence, tests, paywall constant
  - ❌ NO UI, NO native module, NO camera, NO Skia, NO image files (the store only holds path strings to files that 13.3b will produce)
  - ❌ NO changes to `FavoritesContext` — Favorites data model stays untouched (NFR9 zero-migration guarantee)

### Split-key rationale (Task 3.2)

AsyncStorage has no atomic multi-key transaction. Using one JSON blob for `{ items, assignments }` has two failure modes we want to avoid:

1. A 100-item wardrobe + 300 assignments is ~50 KB. Writing the whole blob on every `assign` call is wasteful
2. Partial corruption of either half takes the whole wardrobe down

Split keys (`@wardrobe:items`, `@wardrobe:assignments`) keep writes scoped to the mutated half, and an assignments-parse failure can still recover an intact items list.

**Implementation approach:** one Zustand store, two AsyncStorage writes per mutation. Don't wrap in `Promise.all` and don't await before the in-memory setState — we want optimistic UI, matching FavoritesContext (see `src/contexts/FavoritesContext.tsx:55-72` — fire-and-forget persistence with `.catch` warn).

### Why repo calls store (not AsyncStorage directly)

The story could have two shapes: (a) repo = thin AsyncStorage wrapper, components consume via Zustand selectors that call repo getters; (b) repo = thin wrapper over Zustand store, store owns persistence. **Choose (b).** Reactivity comes for free because Zustand notifies subscribers on any state change; components don't need to re-call `getItems()`. Tests reset state via `useWardrobeStore.setState()` in a single line.

Consequence: `wardrobeRepo` is a *convenience facade* — it exists so future screens can write `wardrobeRepo.assign(...)` imperatively without importing the store directly, and so we can unit-test repo logic without mounting a renderer. But the store is authoritative.

### FREE_WARDROBE_LIMIT = 10 — product decision

Decided 2026-04-19 by the user, with full rationale in memory `project_epic13_decisions.md`:

- 10 lets a free user complete ~3 full Wada 3-color combos and experience FR6 reuse before the paywall
- 5 gates too early, kills the "aha"
- Unlimited under-monetizes the most expensive feature in the app
- Tunable constant — post-launch we can drop to 7 if conversion is weak without shipping code changes beyond the constant

**Critical:** reuse is NEVER gated. `assign()` does not pass through `addItem()`. A free user with 10 items can keep assigning them across unlimited combos. This preserves the "one garment serves many palettes" core value prop (FR6) for the free tier. Encode this in a test AND a JSDoc comment on `assign`.

### UUID strategy — avoid `expo-crypto`

`expo-crypto` would trigger a native rebuild (`expo prebuild --clean && expo run:ios`). We don't want that in a pure-data story. RN 0.83 + Hermes ships `globalThis.crypto.randomUUID` on iOS (per RN release notes 0.74+). Use it directly with a tiny fallback for defensiveness.

```ts
// src/lib/uuid.ts
export function uuidv4(): string {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // RFC4122 v4 fallback — bytes from Math.random (not crypto-secure, acceptable
  // for client-local entity IDs; no secrets involved)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

Stories 13.2+ that add native modules will do their own rebuild — no point adding `expo-crypto` here only to invalidate the build twice.

### Paywall UX sequencing (for downstream stories only — DO NOT implement here)

Documented so the paywall check in `addItem` is correctly positioned. The actual UI path is implemented in 13.3a:

1. User taps "Usar esta foto" on Preview screen (13.3a)
2. `saveCutoutAsWardrobeItem(cutoutUri)` called (stubbed in 13.3a, real in 13.3b)
3. Inside `saveCutoutAsWardrobeItem`, the real implementation catches `WardrobeLimitExceeded` from `wardrobeRepo.addItem(..., isPremium)` and re-throws as `WardrobePersistenceError.paywall`
4. Preview screen catches the `paywall` case and shows the existing `FREE_FAVORITES_LIMIT` paywall component (no new paywall UI in Epic 13)

In this story, all we do is make sure `addItem` throws `WardrobeLimitExceeded` with the correct gate.

### File layout (created by this story)

```
src/
├── config/
│   └── premium.ts              # EDIT — add FREE_WARDROBE_LIMIT
├── lib/
│   ├── uuid.ts                 # CREATE — RFC4122 v4 util
│   ├── uuid.test.ts            # CREATE
│   ├── wardrobeTypes.ts        # CREATE — interfaces + WardrobeLimitExceeded
│   ├── wardrobeRepo.ts         # CREATE — imperative facade over the store
│   └── wardrobeRepo.test.ts    # CREATE
└── stores/                     # CREATE directory (first Zustand store in repo)
    ├── wardrobeStore.ts        # CREATE — Zustand create() + hydrate + persist
    └── wardrobeStore.test.ts   # CREATE
```

No existing files modified except `src/config/premium.ts`. No `App.tsx` changes — the store is lazy (hydrates on first import). No navigation changes. No test config changes.

### Patterns to follow (MUST)

- Function declarations with named exports (never `export default` except `App.tsx`) — `CLAUDE.md`
- `interface {Name}Props` for any component (n/a here — no components)
- All exported functions get a concise JSDoc documenting cascade / reuse semantics
- Tests co-located: `{file}.test.ts(x)` next to `{file}.ts(x)`
- `pnpm test` is the entrypoint; jest-expo preset. Zero new failures
- Biome: tabs, double quotes. Run `pnpm lint` before marking done
- `__DEV__` guard on all `console.warn` / `console.error`

### Known risks to guard against

- **Race on hydration:** if a component mounts before the store hydrates, it will see empty arrays and potentially show "no items" flash. Downstream screens (13.4a+) must treat `hydrated === false` as a loading state. Export `hydrated` on the store and document this contract. Not a blocker for 13.1 tests since tests set state synchronously
- **Zustand persist middleware vs. custom hydration:** `zustand/middleware` `persist` can handle one key trivially. For two keys we roll our own hydration on store create. This is simpler than hacking `persist` to split — and it's the pattern the epic research doc (`project_armario_virtual_research.md` §Persistencia) explicitly picked
- **Type guard performance:** hydration runs once per app launch. It's fine to iterate and validate shapes; not a perf concern

### References

- Epic source of truth — [docs/planning/epic-13-armario-virtual.md](../../docs/planning/epic-13-armario-virtual.md#Story-131)
- Paywall decision — memory `project_epic13_decisions.md` (Decision 2)
- Research on persistence choice — [docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md](../../docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md#persistencia)
- Pattern to mirror — [src/contexts/FavoritesContext.tsx](../../src/contexts/FavoritesContext.tsx) (optimistic AsyncStorage writes with `.catch` warn)
- Existing paywall constant — [src/config/premium.ts](../../src/config/premium.ts)
- Wardrobe data layer precedent (different domain — static color→category map, but same testing rigor) — [src/data/wardrobeIndex.ts](../../src/data/wardrobeIndex.ts) + [.test.ts](../../src/data/wardrobeIndex.test.ts) (Story 8.1)
- CLAUDE.md §Story Scope (4–5 task cap), §React Native Specifics, §Testing Discipline

### Project Structure Notes

- This story introduces the first `src/stores/` directory. Previous feature state lived in `src/contexts/` (React Context). Zustand was picked deliberately (research §Persistencia) for (a) simpler persist middleware, (b) reactivity without provider plumbing, (c) clean migration target if wardrobe data ever moves to MMKV. No existing contexts are replaced — `FavoritesContext` and `PremiumContext` stay
- No changes to `App.tsx`. No changes to `jest.setup.js`. No changes to Metro or Babel config
- `@react-native-async-storage/async-storage` is already listed in `package.json` dependencies (v2.2.0) — no new version bump

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — bmad-dev-story workflow

### Debug Log References

- `pnpm test src/lib/uuid src/lib/wardrobeRepo src/stores/wardrobeStore` → 23/23 passing
- `pnpm test` → 589 passed, 60 pre-existing failures (i18n + OutfitVisualizer — debt #7)
- `pnpm lint` → clean (113 files)
- `npx tsc --noEmit` → clean

#### One iteration after first run

The store test suite initially failed 3 of 12 tests with `Cannot read properties of undefined (reading 'catch')`. Root cause: `jest.spyOn(AsyncStorage, "setItem")` on an already-mocked `jest.fn(async ...)` corrupted the default async implementation across test boundaries — once `mockRestore()` ran, subsequent calls returned `undefined` instead of the original `Promise.resolve()`, so `AsyncStorage.setItem(...).catch(...)` in `persist()` blew up. Fix: replaced `jest.spyOn(AsyncStorage, "setItem")` with the direct `(AsyncStorage.setItem as jest.Mock).mockClear()` / `.mockRejectedValueOnce()` pattern already established in `FavoritesContext.test.tsx`. No production code change required.

### Completion Notes List

#### Pre-implementation Q&A (3 decisions confirmed by user before coding)

1. **UUID strategy = story Option A** — `globalThis.crypto?.randomUUID ?? Math.random fallback`. Both branches unit-tested by monkey-patching `globalThis.crypto`.
2. **Repo/store contract = story default** — `wardrobeRepo` is the imperative facade for mutations + business rules; `useWardrobeStore` is the reactive state container with thin `setItems`/`setAssignments` setters. Components consume the repo for writes and subscribe to the store via selectors for reads.
3. **`hydrated` flag contract = Option A + DEV warn** — mutations are not blocked while `hydrated === false`; instead, every repo mutation function emits a `console.warn` under `__DEV__` if called before hydration completes. Pragmatic: hydration runs in milliseconds at boot and the first wardrobe mutation is several screens deep; the warn catches accidental races without complicating the call path.

#### Acceptance Criteria walkthrough

| AC | Proven by |
|----|-----------|
| #1 — Two AsyncStorage keys + interface shape | `wardrobeStore.test.ts` hydration tests use `@wardrobe:items` / `@wardrobe:assignments` literals; `wardrobeTypes.ts` defines the exact interface fields. |
| #2 — Full repo API exported with TS typing | `wardrobeRepo.ts` exports all 9 named functions. Compiles under `--strict` (tsc clean). |
| #3 — `assign` overwrites existing slot, leaves item row alone | `wardrobeRepo.test.ts › "upserts a (combinationId, colorIndex) pair — second assign overwrites and never duplicates the item row"`. |
| #4 — Cascade removes only matching combo, items untouched | `wardrobeRepo.test.ts › "removes only matching-combo rows and leaves wardrobe items intact"`. |
| #5 — `addItem` paywall semantics (free blocked at 10, premium bypass) | 4 test cases in `wardrobeRepo.test.ts › addItem` (empty, free@9, free@10, premium@10). `WardrobeLimitExceeded` defined in `wardrobeTypes.ts` with `name = "WardrobeLimitExceeded"`. |
| #6 — Store hydrates + reactive on mutation | `wardrobeStore.test.ts › hydrateWardrobeStore › "populates state from seeded AsyncStorage"`; `subscriber reactivity` describe block covers both keys via `renderHook` + `act`. |
| #7 — Read failure falls back to empty + `__DEV__`-guarded warn | 3 cases in `wardrobeStore.test.ts`: corrupt items JSON, wrong-shape assignments, `__DEV__=false` silence. Per-key try/catch isolates failures so corrupt assignments do NOT zero out a valid items list. |
| #8 — Test coverage on `pnpm test src/lib/wardrobeRepo src/stores/wardrobeStore` | 23/23 green across `uuid.test.ts` (5), `wardrobeRepo.test.ts` (10), `wardrobeStore.test.ts` (10). |

#### Implementation notes for downstream stories

- **Hydration race contract** (also in `wardrobeStore.ts` JSDoc): components should treat `hydrated === false` as a loading state. The repo emits a `__DEV__` warn if a mutation runs pre-hydration, but does not block — early calls will land in memory and persist; if hydration then loads stored data, the in-memory state is replaced by stored state. Story 13.4a should gate UI on `useWardrobeStore((s) => s.hydrated)` to avoid the flash.
- **`removeItem` does NOT cascade forward** into assignments. This is deliberate (test (i) carries the comment). Stories 13.4b / 13.5 must filter out orphan assignments when resolving `wardrobeItemId → WardrobeItem`.
- **`addItem` paywall path** throws `WardrobeLimitExceeded` synchronously. Stories 13.3a/13.3b should catch this and re-throw as `WardrobePersistenceError.paywall` per the Dev Notes paywall sequencing.
- **`assign` is never paywall-gated** — FR6 reuse for the free tier is preserved. A free user with 10 items can assign them across unlimited combinations.
- **No native rebuild required**: zustand is pure JS, `globalThis.crypto.randomUUID` is built into Hermes, AsyncStorage was already linked.
- **No `App.tsx` changes**: the store hydrates lazily on first import. Story 13.3a will be the first importer — no provider plumbing needed.

### File List

CREATED:
- `src/lib/uuid.ts`
- `src/lib/uuid.test.ts`
- `src/lib/wardrobeTypes.ts`
- `src/lib/wardrobeRepo.ts`
- `src/lib/wardrobeRepo.test.ts`
- `src/stores/wardrobeStore.ts`
- `src/stores/wardrobeStore.test.ts`

MODIFIED:
- `src/config/premium.ts` — added `FREE_WARDROBE_LIMIT: 10`
- `package.json` — added `zustand` (5.0.12)
- `pnpm-lock.yaml` — pinned zustand resolution
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `13-1-wardrobe-data-model-repository-zustand-store: ready-for-dev → review`

### Review Findings

- [x] [Review][Decision] **F1 — `parseItems`/`parseAssignments` all-or-nothing on partially corrupt arrays** — Decision: keep all-or-nothing (Option A). Dismissed.
- [x] [Review][Patch] **F2 — `isCombinationComplete(combinationId, 0)` returns `true` spuriously** [`src/lib/wardrobeRepo.ts:117`] — Fixed: `if (totalColors <= 0) return false;` guard added.
- [x] [Review][Patch] **F3 — Missing test: `isCombinationComplete` with `totalColors = 0`** [`src/lib/wardrobeRepo.test.ts`] — Fixed: test added, passing.
- [x] [Review][Patch] **F4 — Missing test: `uuidv4` when `crypto` object exists but `randomUUID` is `undefined`** [`src/lib/uuid.test.ts`] — Fixed: test added, passing. 25/25 green.
- [x] [Review][Defer] **F5 — Type guards accept empty strings for `localImagePath`/`thumbnailPath`/`id`** [`src/stores/wardrobeStore.ts:16`] — deferred, belongs in Story 13.3b path validation at write time
- [x] [Review][Defer] **F6 — `assign()` does not validate that `wardrobeItemId` exists in items** [`src/lib/wardrobeRepo.ts:78`] — deferred, intentional "skip orphans" contract per Dev Notes; Story 13.4b owns resolution

### Change Log

| Date | Change |
|------|--------|
| 2026-04-19 | Story 13.1 implemented end-to-end. Added `wardrobeTypes`, `wardrobeRepo`, `wardrobeStore`, `uuid` util + co-located tests. Added `FREE_WARDROBE_LIMIT = 10`. Installed `zustand@5.0.12`. 23 new tests, all green. Zero regressions, zero UI changes. Status → review. |
| 2026-04-19 | Code review: 1 decision-needed, 3 patches, 2 deferred, 9 dismissed. |
