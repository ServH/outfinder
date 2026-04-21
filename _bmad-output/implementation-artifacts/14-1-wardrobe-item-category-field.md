# Story 14.1: Extend `WardrobeItem` with `category` field

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer implementing wardrobe tagging for Epic 14 (App Flow Reorganization, v1.4.0 launch blocker)**,
I want **the `WardrobeItem` data model, `wardrobeRepo`, and the Zustand store to include a required `category` field with pragmatic default-"top" backfill for legacy TestFlight items**,
so that **the unified camera save flow (Story 14.5), the Mis Looks store unification + migration (Story 14.2), and the edit-category affordance (Story 14.12b) can rely on a type-safe, fully populated `category` on every wardrobe item — with no ad-hoc `undefined` handling downstream and no v1.5.0 data migration later when filtering ships**.

## Acceptance Criteria

1. **Given** the `WardrobeItem` data shape in `src/lib/wardrobeTypes.ts`, **When** the module is inspected, **Then** a new exported type `WardrobeCategory = "top" | "bottom" | "footwear" | "accessory"` exists (no fifth `"unknown"` value per TD-7 rationale), **And** `interface WardrobeItem` is extended with a required field `category: WardrobeCategory` (no union with `undefined`, no `?`), **And** `type WardrobeItemInput = Omit<WardrobeItem, "id" | "createdAt">` continues to apply so `category` is ALSO required on the input side, **And** a JSDoc comment on the `category` field cites **TD-7** (legacy default `"top"`) and points at Story 14.12b for the edit affordance.

2. **Given** `wardrobeRepo.addItem(input, isPremium)` is called with `input.category = "top" | "bottom" | "footwear" | "accessory"`, **When** the call succeeds, **Then** the item is persisted to `@wardrobe:items` (the existing Epic-13 AsyncStorage key — NOT `@mislooks:items`; that rename lands in Story 14.2) with the `category` field present and preserved byte-for-byte, **And** `getItems()` returns the item with its `category` intact, **And** a subsequent `hydrateWardrobeStore()` restore from AsyncStorage yields the same `category` (round-trip).

3. **Given** a legacy wardrobe item was persisted by an Epic 13 internal / TestFlight build BEFORE this field existed (the payload's record has `{ id, localImagePath, thumbnailPath, createdAt }` but no `category` key), **When** the store hydrates via `hydrateWardrobeStore()` at app start, **Then** the `isWardrobeItem` type guard in `src/stores/wardrobeStore.ts` still accepts the record (treating `category` as optional at parse time), **And** a post-parse normalization step backfills `category: "top"` per **TD-7** for every record missing the field, **And** the in-memory `items` array is fully typed `WardrobeItem[]` (all records have `category`), **And** the next write (any subsequent `setItems(...)` call) persists the normalized shape with `category` present (i.e. the default "sticks" on first write), **And** a single `__DEV__` `console.warn` is emitted **once per hydration** (not per record) summarizing *"wardrobeStore: backfilled category='top' on N legacy item(s) per TD-7"* — no user-facing error, no per-record spam.

4. **Given** a TypeScript caller attempts `wardrobeRepo.addItem({ localImagePath, thumbnailPath }, isPremium)` WITHOUT passing `category`, **When** `npx tsc --noEmit` runs, **Then** compilation fails with a TypeScript error that names the missing `category` property (AC #3 of the epic — type-level enforcement), **And** the same is true for any construction of a `WardrobeItem` literal without `category`.

5. **Given** the Epic-13 caller `src/lib/armario/saveCutoutAsWardrobeItem.ts` currently calls `addItem({ localImagePath, thumbnailPath }, args.isPremium)` at line 96, **When** this story ships, **Then** `SaveCutoutArgs` is extended with a new **required** field `category: WardrobeCategory`, **And** the call at line 96 is updated to `addItem({ localImagePath, thumbnailPath, category: args.category }, args.isPremium)` — propagating the choice made by the caller rather than defaulting internally, **And** the Epic-13 caller `src/screens/armario/ArmarioPreviewScreen.tsx` (the in-Ficha-Wada `ArmarioCapture` flow preserved per TD-2) passes `category: "top"` verbatim as a temporary pragmatic default with a comment `// TD-7 temporary default — user can correct via Story 14.12b edit-category affordance` — the real user-selected category for the unified camera flow lands in Story 14.5 and is completely separate from this call site.

6. **Given** downstream consumers `ArmarioPickerScreen.tsx`, `ArmarioFichaWadaScreen.tsx`, `WardrobeItemThumb.tsx`, `FavoriteComboEnrichedCard.tsx`, `wardrobeFiles.ts` that read `WardrobeItem` today, **When** `npx tsc --noEmit` runs after this story, **Then** they continue to type-check WITHOUT visual or behavioral changes — `category` is ignored by all of them in Epic 14 Story 14.1 (only Story 14.5 + 14.12b use it), **And** no existing test snapshot is invalidated by this story (no component renders `category` yet).

7. **Given** co-located tests `src/lib/wardrobeRepo.test.ts` and `src/stores/wardrobeStore.test.ts`, **When** `pnpm test src/lib/wardrobeRepo src/stores/wardrobeStore` runs, **Then** the suite covers: (a) `addItem({ ..., category: "bottom" }, false)` persists `category="bottom"` on the returned item and in `getItems()`, (b) all four enum values round-trip (`"top"`, `"bottom"`, `"footwear"`, `"accessory"`), (c) hydration of a seeded AsyncStorage payload containing an item WITHOUT a `category` key yields `items[0].category === "top"` and fires one dev warn, (d) hydration of a seeded payload containing a mix of legacy (no category) + modern (with category) records preserves explicit values and backfills only the missing ones, (e) the warn is silenced when `__DEV__ === false`, (f) the `isWardrobeItem` type guard rejects a record whose `category` value is a foreign string (e.g. `"unknown"`) — the backfill ONLY activates on missing key, NOT on invalid value (invalid value falls through to the existing corrupt-payload path that zeroes the items list per Story 13.1's decision F1), (g) `pnpm test` full-suite regression is zero new failures vs. the Epic-13 post-merge baseline (`783 passing / 60 pre-existing debt` per project-context.md).

8. **Given** the Epic-13 legacy Jest mock for `saveCutoutAsWardrobeItem` in `src/screens/armario/ArmarioPreviewScreen.test.tsx`, **When** `pnpm test` runs, **Then** the existing test suite continues to pass WITHOUT changes (the mock replaces the entire module — the new `SaveCutoutArgs.category` field is simply part of the args object the mock ignores), **And** `src/lib/armario/saveCutoutAsWardrobeItem.test.ts` is extended by ONE new test asserting that `saveCutoutAsWardrobeItem({ ..., category: "footwear" })` forwards `category: "footwear"` to `addItem(...)` (spy on `addItem` — no new file mock needed, the existing test file already spies on the repo). No other test file in the repo needs to change.

9. **Given** the full quality gates `npx tsc --noEmit`, `pnpm lint`, `pnpm test`, **When** all three run on this story branch, **Then** all pass green, **And** zero new test-skips are introduced (NFR6), **And** Biome lint passes with tabs + double quotes + function-declared named exports (no `export default` additions).

## Tasks / Subtasks

- [x] **Task 1: Extend `WardrobeItem` + `WardrobeItemInput` types** (AC: #1, #4)
  - [x] 1.1 In `src/lib/wardrobeTypes.ts`, add `export type WardrobeCategory = "top" | "bottom" | "footwear" | "accessory"` just above the `WardrobeItem` interface. No fifth `"unknown"` value — per TD-7 rationale in the epic, legacy items backfill to `"top"` to avoid polluting the taxonomy.
  - [x] 1.2 Add `category: WardrobeCategory` as a required field on `interface WardrobeItem` (between `thumbnailPath` and `createdAt` so the persistence order reads naturally). JSDoc the field: `/** Garment category. Legacy Epic-13 items without this field backfill to "top" per TD-7 — users correct via Story 14.12b edit-category affordance. */`
  - [x] 1.3 Confirm `WardrobeItemInput = Omit<WardrobeItem, "id" | "createdAt">` automatically propagates `category` as required on the input shape — do NOT add an explicit `category?` override (type-level enforcement per AC #4 is the whole point).
  - [x] 1.4 Do NOT modify `WardrobeLimitExceeded` or `CombinationAssignment` — orthogonal to this story.

- [x] **Task 2: Update `wardrobeRepo.addItem` callers (Epic-13 compile gate)** (AC: #5)
  - [x] 2.1 Modify `src/lib/armario/saveCutoutAsWardrobeItem.ts`: extend `interface SaveCutoutArgs` with `category: WardrobeCategory` (required); import `WardrobeCategory` from `@/lib/wardrobeTypes`. Update the line-96 call `addItem({ localImagePath, thumbnailPath }, args.isPremium)` → `addItem({ localImagePath, thumbnailPath, category: args.category }, args.isPremium)`. No other logic change.
  - [x] 2.2 Modify `src/screens/armario/ArmarioPreviewScreen.tsx`: locate the `saveCutoutAsWardrobeItem({ cutoutUri, sourceUri, isPremium })` call at line 88, add `category: "top"` with an inline comment `// TD-7 temporary default — in-Ficha-Wada ArmarioCapture flow (preserved per TD-2); real user-selected category lands via Story 14.5 in the unified camera flow. User can correct via Story 14.12b.`
  - [x] 2.3 Do NOT update `wardrobeRepo.addItem`'s function body — `category` already flows through via the `...input` spread at the existing line 47 (`const item: WardrobeItem = { id: uuidv4(), createdAt: Date.now(), ...input }`). Verify manually. No repo code churn.
  - [x] 2.4 Run `npx tsc --noEmit` — if any OTHER file in the repo constructs a `WardrobeItem` literal without `category` (e.g. test fixtures), list them here and update to pass `category: "top"` as a pragmatic default. Expected files: test helpers only (`src/lib/wardrobeRepo.test.ts`, `src/stores/wardrobeStore.test.ts`, `src/lib/armario/wardrobeFiles.test.ts`, `src/lib/armario/saveCutoutAsWardrobeItem.test.ts`). Update each `seedItem(id)` / `itemWithUuid(uuid)` / `makeItem(i)` helper to emit `category: "top"` in its returned literal.

- [x] **Task 3: Store hydration backfill per TD-7** (AC: #3, #7)
  - [x] 3.1 In `src/stores/wardrobeStore.ts`, relax `isWardrobeItem` type guard: `category` is treated as OPTIONAL at parse time (allow missing key), but if present it MUST be one of the four valid values — reject records whose `category` is present with a foreign string (per AC #7(f)). Implementation: `v.category === undefined || v.category === "top" || v.category === "bottom" || v.category === "footwear" || v.category === "accessory"`.
  - [x] 3.2 Add a pure helper `normalizeItems(raw: unknown[]): { items: WardrobeItem[]; backfilledCount: number }` that maps over validated items and applies `category: "top"` to any record missing the key; returns both the array and the count for dev-warn aggregation. No per-record warn — the hydration site emits ONE summary line.
  - [x] 3.3 Inside `hydrateWardrobeStore()`, after the `parseItems(rawItems)` call succeeds, pipe the result through `normalizeItems(...)` and emit a single `if (__DEV__ && backfilledCount > 0) console.warn('wardrobeStore: backfilled category="top" on ' + backfilledCount + ' legacy item(s) per TD-7')`. Preserve the existing per-key try/catch isolation so an assignments parse failure still does not corrupt the items recovery path.
  - [x] 3.4 Do NOT touch `persist(...)`, `setItems(...)`, or `setAssignments(...)` — they pass through whatever shape they're given. The next write naturally sticks the normalized shape back to AsyncStorage (AC #3 "default sticks on first write").
  - [x] 3.5 Verify the existing `isWardrobeItem` strict-parse tests (Story 13.1 test suite) still pass — they test with the FULL shape so relaxing `category` to optional does not regress them.

- [x] **Task 4: Co-located tests** (AC: #7, #8)
  - [x] 4.1 Extend `src/lib/wardrobeRepo.test.ts`: update the existing `seedItem(id, createdAt)` helper to include `category: "top"` in the literal. Add 2 new tests in the `addItem` describe block: (a) "persists all four category enum values round-trip" — parameterized `test.each(["top", "bottom", "footwear", "accessory"])`, (b) "different items can carry different categories" — add two items with different categories, read back via `getItems()`, assert both survive.
  - [x] 4.2 Extend `src/stores/wardrobeStore.test.ts`: update the `validItem` literal to include `category: "top"`. Add 4 new hydration tests in the `hydrateWardrobeStore` describe block: (a) "backfills category='top' on a legacy item missing the field" — seed AsyncStorage with a legacy-shape record, hydrate, assert `items[0].category === "top"` and warn was called, (b) "preserves explicit categories and backfills only the missing ones on mixed payload" — seed 3 records (one `"bottom"`, one legacy, one `"accessory"`), assert backfill touches only the middle one, (c) "dev-warn is silenced when __DEV__ is false" — mirror the existing `__DEV__ = false` pattern from the corrupt-JSON test, (d) "rejects records with an invalid category string and falls through to empty-array corrupt-payload path" — seed a record with `category: "hat"`, assert `items === []` and warn fired (this confirms AC #7(f) — backfill is only for the MISSING key, not for invalid values).
  - [x] 4.3 Extend `src/lib/armario/saveCutoutAsWardrobeItem.test.ts`: add ONE new test "forwards the caller's category to addItem verbatim" — call `saveCutoutAsWardrobeItem({ ..., category: "footwear" })`, assert the spy on `addItem` received `{ localImagePath: ..., thumbnailPath: ..., category: "footwear" }`. Reuse the existing test harness — all other existing tests remain untouched beyond adding `category: "top"` to their `saveCutoutAsWardrobeItem({ ... })` args (plus `makeItem` helper update from Task 2.4).
  - [x] 4.4 Update `src/lib/armario/wardrobeFiles.test.ts`: its `itemWithUuid(uuid)` helper at line 98 needs `category: "top"` added so its literals type-check. No behavioral change — this file tests file-system operations, not category.
  - [x] 4.5 Update `src/screens/armario/ArmarioPreviewScreen.test.tsx`: the existing Jest `jest.mock("@/lib/armario/saveCutoutAsWardrobeItem", ...)` replaces the module, so the new `category` arg passes through unobserved. Verify no changes needed by running `pnpm test src/screens/armario/ArmarioPreviewScreen.test.tsx` — if a test literally constructs a `SaveCutoutArgs` object to compare, add `category: "top"` to the expected-args literal. Otherwise leave untouched.

- [x] **Task 5: Quality gates + AC walkthrough** (AC: #1–#9)
  - [x] 5.1 `npx tsc --noEmit` → clean. Any residual errors indicate an un-updated `WardrobeItem` literal — find via grep `grep -rn "localImagePath:" src --include='*.ts*' | head` and fix each.
  - [x] 5.2 `pnpm lint` → clean (Biome tabs, double quotes, no unused imports, no `export default`).
  - [x] 5.3 `pnpm test` → at least 783 + 7 new = ~790 passing, 60 pre-existing failures unchanged, zero new failures. Report concrete numbers in Completion Notes.
  - [x] 5.4 AC walkthrough in Completion Notes with one row per AC (#1–#9) citing the proving test or the modified file.
  - [x] 5.5 Visual smoke: this story ships ZERO user-visible change (data-model-only). The in-app behavior of every existing screen is byte-for-byte identical. Document this explicitly in Completion Notes — "no simulator screenshot needed, type checker + Jest exercise all modified paths; the next user-visible change is Story 14.4/14.5 where the unified camera result screen consumes `category`."

## Dev Notes

### Architecture context (brownfield — Epic 14 foundation)

- **Current branch:** `epic-14` (created 2026-04-21 off `epic-13`, itself off `epic-1` main). Epic 13 is **done** (commit `eae624e`) — this is the first live code story on `epic-14`. Every 14.X story branch should be `story/14-1-wardrobe-item-category-field` etc. Final merge path: `epic-14 → epic-1` (only after all 15 stories + code reviews + on-device QA via Story 14.13 pass).
- **Target version:** v1.4.0 App Store submission. Epic 14 is a **launch blocker** — Epic 13 is technically complete but validation (n=5–6) confirmed the flow hides 80% of the app.
- **This story ships zero user-visible change.** Data-model-only. The first user-visible Epic 14 milestone is Story 14.4 (camera result screen UI).
- **Scope boundaries:**
  - ✅ `WardrobeCategory` type, `WardrobeItem.category` required field, hydration backfill per TD-7, Epic-13 caller compile-gate fix, co-located tests.
  - ❌ NO UI, NO migration runner (Story 14.2 owns the `@outfinder/favorites → @mislooks:favorites` migration + store rename), NO `updateItemCategory` action (Story 14.12b adds it), NO category selector UI (Story 14.5 owns it), NO navigation changes, NO copy edits.
  - ❌ NO rename of `useWardrobeStore` → `useMisLooksStore` (Story 14.2 does that as part of TD-3 / ADR-005). In this story the store keeps its Epic-13 name and AsyncStorage key `@wardrobe:items`.

### TD-7 default = "top" — why not "unknown"

From the epic (lines 37–45 of `docs/planning/epic-14.md`): the initial instinct was a fifth sentinel value `"unknown"` to mark un-tagged legacy items. Alejandro explicitly rejected it: (a) it pollutes the taxonomy — every downstream filter (Story 14.5's selector, 14.12b's edit sheet, any v1.5.0 category-aware feature) would need special-case logic for `"unknown"`, (b) "top" is the most common garment type by a wide margin (camiseta / jersey / top account for the plurality of first-saved items in Epic 13 TestFlight dogfooding), (c) users can correct a wrong "top" default via Story 14.12b's pencil-icon edit affordance — pragmatic over purist. Encode the rationale as a JSDoc comment on the `category` field AND as the dev warn message so a future engineer reading the code understands the decision.

### Store rename coming in Story 14.2 — do NOT pre-empt

ADR-005 (`docs/adrs/ADR-005-unified-mis-looks-store.md`) mandates that Story 14.2 rename `useWardrobeStore` → `useMisLooksStore`, add `favorites: Set<string>` as a third slice, delete `FavoritesContext`, and migrate legacy AsyncStorage keys. **This story 14.1 deliberately does NONE of that.** We modify `src/stores/wardrobeStore.ts` IN PLACE keeping its current name + key. Story 14.2 will rename the file, rename the export, rename the key, and add the migration — doing both in 14.1 would (a) violate the hard rule from 5 retrospectives ("never combine stories from the epic plan"), (b) entangle the type-system change with a persistence-layer migration that has its own idempotency pattern (TD-5). Keep 14.1 surgical.

Practical consequence: the `isWardrobeItem` type guard and the hydration backfill you add here will be **moved and renamed** by Story 14.2 two stories from now — that's fine, it's the correct delivery order.

### Epic-13 `ArmarioCapture` flow is preserved per TD-2 — why its category is "top"

Epic 14's TD-2 decision (epic doc line 38) preserves the `ArmarioCaptureScreen` + `ArmarioPreview` + `ArmarioRoot` + `ArmarioStackParamList` for in-Ficha-Wada slot-assignment (a cutout-only pipeline, no Wada tone detection). That flow saves wardrobe items today via `saveCutoutAsWardrobeItem`. With `category` becoming required, the Epic-13 call site in `ArmarioPreviewScreen.tsx:88` MUST pass a value. Options:

1. **Require user to select category before saving in `ArmarioPreview`** — out of scope; would be a UI story, duplicating 14.5's selector for a fringe flow.
2. **Infer category from the slot color** — nonsensical; category is about garment type (shirt / pants / shoes / accessory), not color.
3. **Hardcode `"top"` with a TD-7 comment pointing at Story 14.12b** — ✅ chosen. Users can correct via the edit-category pencil affordance after the feature lands.

This is the minimum-surface-area fix to keep TD-2 backward compatibility without re-scoping 14.1.

### Hydration backfill — why "map after parse" vs. "relax then enforce-at-write"

Two shapes were considered:

**(A)** Parse accepts missing `category` → map backfills `"top"` → in-memory shape is fully typed. ✅ chosen.

**(B)** Parse remains strict → records missing `category` fall through to the all-or-nothing corrupt-payload path → user loses ALL Epic-13 items on upgrade.

(B) is disastrous — Epic 13 TestFlight users would lose their wardrobe on v1.4.0 upgrade. (A) is the obvious choice, but the subtlety is: if you also relax the type guard to accept arbitrary values for `category`, you lose schema discipline. Keep the guard strict on PRESENCE of valid values but permissive on ABSENCE — that's what AC #7(f) encodes. The result: a forward-only backfill that survives a clean parse, reports itself once via `__DEV__` warn, and re-persists on next write.

### Type-guard subtlety — `v.category === undefined` is correct (NOT `"category" in v`)

JavaScript distinguishes "missing key" from "key present with value `undefined`". `JSON.parse` produces objects where a missing key is genuinely absent (`"category" in obj === false`). The type guard we care about accepts BOTH `absent` and `valid-value`:

```ts
function isWardrobeItem(value: unknown): value is WardrobeItem {
  // ... existing checks for id/localImagePath/thumbnailPath/createdAt ...
  const c = (value as Record<string, unknown>).category;
  return (
    c === undefined ||
    c === "top" || c === "bottom" || c === "footwear" || c === "accessory"
  );
}
```

Do NOT write `"category" in v && ...` — redundant, and `in` has subtle prototype-chain semantics we don't want.

### Repo `addItem` — no logic change required

The existing implementation at `src/lib/wardrobeRepo.ts:32-50`:

```ts
const item: WardrobeItem = {
  id: uuidv4(),
  createdAt: Date.now(),
  ...input,
};
```

Because `category` lives on `WardrobeItemInput` (via `Omit<WardrobeItem, "id" | "createdAt">`), the spread at `...input` automatically carries it into the persisted item. No new field assignment, no new validation. This is a compile-time-only change for `addItem`.

### File layout (modified by this story)

```
src/
├── lib/
│   ├── wardrobeTypes.ts        # EDIT — add WardrobeCategory + category field
│   ├── wardrobeTypes.test.ts   # (not created — type-level test coverage handled by consumer tests)
│   ├── wardrobeRepo.test.ts    # EDIT — seedItem helper + 2 new tests (category round-trip)
│   └── armario/
│       ├── saveCutoutAsWardrobeItem.ts       # EDIT — add category to SaveCutoutArgs
│       ├── saveCutoutAsWardrobeItem.test.ts  # EDIT — makeItem helper + 1 new forward-test
│       ├── wardrobeFiles.test.ts             # EDIT — itemWithUuid helper only
├── stores/
│   ├── wardrobeStore.ts        # EDIT — relax type guard + add normalizeItems + warn
│   └── wardrobeStore.test.ts   # EDIT — validItem helper + 4 new hydration tests
└── screens/
    └── armario/
        ├── ArmarioPreviewScreen.tsx          # EDIT — pass category: "top" (TD-7 default)
        └── ArmarioPreviewScreen.test.tsx     # MAYBE EDIT — only if a test asserts on SaveCutoutArgs shape
```

No new files created. No navigation changes, no new dependencies, no native rebuild.

### Patterns to follow (MUST)

- Function declarations with named exports (never `export default`) — `CLAUDE.md`
- Biome: tabs, double quotes. Run `pnpm lint` before marking done
- `__DEV__` guard on the hydration warn — mirrors the existing `wardrobeStore` pattern
- Tests co-located, `{file}.test.ts` next to `{file}.ts`
- `pnpm test` is the entrypoint; jest-expo preset; zero new failures
- JSDoc cites TD numbers (`TD-7` here) so future engineers can trace the decision to the epic doc

### Known risks to guard against

- **Test-helper fanout:** ~5 helpers in 4 test files construct `WardrobeItem` literals. If you miss one, `tsc` will surface it in Task 5.1 — fix each one by adding `category: "top"`. Do NOT fix by making `category` optional on `WardrobeItemInput`; that defeats AC #4 (type-level enforcement).
- **Snapshot-test churn:** none expected — no existing component renders `category`, so no snapshot includes it. If `pnpm test` surfaces a snapshot diff, investigate rather than blindly update — a category leak into a UI component in this story is a scope violation.
- **Round-trip test isolation:** the `wardrobeStore.test.ts` `beforeEach` resets state via `useWardrobeStore.setState(...)` — your new round-trip test needs to also clear AsyncStorage (`await AsyncStorage.clear()`) between runs, matching the existing pattern at line 27.
- **Dev-warn under jest:** `__DEV__` is `true` under Jest in this repo. Your new tests for "warn was called" / "warn was NOT called when __DEV__ false" mirror the existing corrupt-JSON patterns in `wardrobeStore.test.ts` — copy the `Object.defineProperty(globalThis, "__DEV__", { value: false })` dance verbatim.

### References

- Epic source of truth — [docs/planning/epic-14.md](../../docs/planning/epic-14.md#story-141) (Story 14.1 section)
- Technical decisions TD-6 (edit category in v1.4.0) + TD-7 (legacy default "top") — [docs/planning/epic-14.md](../../docs/planning/epic-14.md#technical-decisions-post-review--read-before-implementing-any-story) (lines 42–43)
- ADR-005 store unification (landing in Story 14.2, not here) — [docs/adrs/ADR-005-unified-mis-looks-store.md](../../docs/adrs/ADR-005-unified-mis-looks-store.md)
- Prior `WardrobeItem` definition + type-guard pattern to extend — [src/lib/wardrobeTypes.ts](../../src/lib/wardrobeTypes.ts) + [src/stores/wardrobeStore.ts](../../src/stores/wardrobeStore.ts) (Story 13.1 provenance)
- Epic-13 caller that needs the compile-gate fix — [src/lib/armario/saveCutoutAsWardrobeItem.ts:96](../../src/lib/armario/saveCutoutAsWardrobeItem.ts) + [src/screens/armario/ArmarioPreviewScreen.tsx:88](../../src/screens/armario/ArmarioPreviewScreen.tsx)
- Story 13.1 review decision F1 (items parse is all-or-nothing on corrupt payload) — [_bmad-output/implementation-artifacts/13-1-wardrobe-data-model-repository-zustand-store.md#review-findings](./13-1-wardrobe-data-model-repository-zustand-store.md) — this story preserves that semantics for invalid-value records
- CLAUDE.md — §Story Scope (4–5 task cap), §React Native Specifics, §Testing Discipline

### Project Structure Notes

- This story modifies files only in `src/lib`, `src/stores`, `src/screens/armario`. No new directories, no new navigation routes.
- No changes to `App.tsx`. No changes to `jest.setup.js`. No changes to Metro, Babel, Biome, or tsconfig.
- No dependency bumps. No native module changes. No `expo run:ios` rebuild required — this is a pure TypeScript + in-memory logic change. Metro reload suffices.
- The `@wardrobe:items` AsyncStorage key remains unchanged. Story 14.2 will migrate it to `@mislooks:items` — which is why the hydration warn message uses the current key name (it'll be renamed along with the file in the next story).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (bmad-dev-story)

### Debug Log References

- `npx tsc --noEmit` → clean (0 errors)
- `pnpm lint` → clean (Biome: 156 files, 0 errors; autofix applied to organize imports + 2 test-file formatting nits)
- `pnpm test` → 795 passing / 60 pre-existing failures unchanged (baseline `783 passing / 60 debt` per project-context.md; net **+12 passing tests**, **0 new failures**)
- Targeted suites: `pnpm test src/lib/wardrobeRepo src/stores/wardrobeStore src/lib/armario/saveCutoutAsWardrobeItem src/lib/armario/wardrobeFiles` → 4 suites / 56 tests all green

### Completion Notes List

**AC walkthrough (proving tests / modified files):**

| AC | Status | Evidence |
| --- | --- | --- |
| #1 `WardrobeCategory` type + required field + JSDoc | ✅ | `src/lib/wardrobeTypes.ts` — `WardrobeCategory` union exported above the interface, required `category: WardrobeCategory` field between `thumbnailPath` and `createdAt`, JSDoc cites TD-7 + Story 14.12b |
| #2 `addItem` + repo round-trip persists all 4 enum values | ✅ | `src/lib/wardrobeRepo.test.ts` — `test.each(["top","bottom","footwear","accessory"])` proves round-trip on returned item + `getItems()` |
| #3 Legacy item hydration backfills `"top"` + single dev-warn | ✅ | `src/stores/wardrobeStore.ts` — new `normalizeItems(parsed)` helper, wired after `parseItems(...)`; single aggregate warn under `__DEV__`. Tests: `wardrobeStore.test.ts` "backfills category='top'…" + "preserves explicit categories and backfills only the missing ones…" |
| #4 Type-level enforcement on missing `category` | ✅ | `tsc --noEmit` fanout test: initial run surfaced 5 helper fixtures (`seedItem`, `itemWithUuid`, `makeItem`, Settings.tsx dev-stub, validItem) — each fixed by adding `category: "top"`. Subsequent `tsc` is clean. |
| #5 Epic-13 callers updated (`saveCutoutAsWardrobeItem` + `ArmarioPreviewScreen`) | ✅ | `src/lib/armario/saveCutoutAsWardrobeItem.ts` — `SaveCutoutArgs.category: WardrobeCategory` required; forwarded to `addItem(...)`. `src/screens/armario/ArmarioPreviewScreen.tsx` — passes `category: "top"` with TD-7 comment referencing Story 14.12b |
| #6 Downstream consumers unchanged, no snapshot churn | ✅ | `ArmarioPickerScreen`, `ArmarioFichaWadaScreen`, `WardrobeItemThumb`, `FavoriteComboEnrichedCard` type-check and test without edits — none render `category`. Full `pnpm test` run shows 0 new snapshot diffs |
| #7 Test coverage (a)–(g) | ✅ | (a) `addItem` "persists category on returned item + getItems()" (b) `test.each` over 4 enum values (c) "backfills category='top' on a legacy item" (d) "preserves explicit + backfills only missing" on mixed payload (e) "does not emit backfill warn when __DEV__=false" (f) "rejects records with invalid category string and falls through to corrupt-payload path" (g) full suite 795 passing / 60 pre-existing unchanged |
| #8 `ArmarioPreviewScreen.test.tsx` unchanged + 1 new forward test | ✅ | `ArmarioPreviewScreen.test.tsx` untouched — mock replaces module. `saveCutoutAsWardrobeItem.test.ts` extended with "forwards the caller's category to addItem verbatim" using `category: "footwear"` |
| #9 Full quality gates green + no new skips | ✅ | `tsc` clean · `pnpm lint` clean · `pnpm test` 795 pass / 60 pre-existing (unchanged debt) · 0 new `it.skip`/`test.skip` introduced · Biome passes with tabs + double quotes + named exports |

**Implementation notes:**

- Hydration backfill follows shape (A) from Dev Notes: parse accepts missing `category` → `normalizeItems` backfills `"top"` → in-memory shape fully typed. Foreign/invalid `category` values (e.g. `"hat"`) fail the guard and fall through to the Story 13.1 F1 all-or-nothing corrupt-payload path — preserving existing semantics.
- `isWardrobeItem` was relaxed ONLY on the `category` field: `c === undefined || c === "top" | "bottom" | "footwear" | "accessory"`. All other field type checks remain strict.
- The `addItem` repo body was **not** modified — `category` flows through the existing `...input` spread at `wardrobeRepo.ts:46`. Confirmed manually.
- Settings.tsx (non-test production file) contained a dev-mode wardrobe-stub generator that constructed `WardrobeItem` literals — updated in place with `category: "top" as const` so the dev override still type-checks.
- `makeItem`, `seedItem`, `itemWithUuid`, `validItem`, and all `mockReturnValue` literals in `saveCutoutAsWardrobeItem.test.ts` were updated to include `category: "top"` so the required-field invariant holds end-to-end. Zero test files now opt-out via `as any`.
- Visual smoke: **zero user-visible change**. This is a data-model-only story — next user-visible Epic 14 milestone lands in Story 14.4 (camera result screen UI).

### File List

**Modified:**

- `src/lib/wardrobeTypes.ts` — added `WardrobeCategory` type + required `category` field + JSDoc citing TD-7
- `src/stores/wardrobeStore.ts` — relaxed `isWardrobeItem` for missing `category`, added `normalizeItems` helper, wired aggregate backfill warn under `__DEV__`
- `src/stores/wardrobeStore.test.ts` — `validItem` helper updated + 4 new hydration tests (AC #7 c–f)
- `src/lib/wardrobeRepo.test.ts` — `seedItem` helper updated + `test.each` 4-enum round-trip + heterogeneous-categories test
- `src/lib/armario/saveCutoutAsWardrobeItem.ts` — `SaveCutoutArgs.category: WardrobeCategory` required, forwarded to `addItem(...)`
- `src/lib/armario/saveCutoutAsWardrobeItem.test.ts` — `makeItem` helper + all callsites + mock return values updated with `category`; new "forwards the caller's category to addItem verbatim" test (AC #8)
- `src/lib/armario/wardrobeFiles.test.ts` — `itemWithUuid` helper updated
- `src/screens/armario/ArmarioPreviewScreen.tsx` — `category: "top"` added with TD-7 / Story 14.12b comment (TD-2 preserved)
- `src/screens/Settings.tsx` — dev-mode wardrobe-stub override updated with `category: "top" as const`

**Created:** none
**Deleted:** none

### Review Findings

- [x] [Review][Patch] Warn message uses double-quotes `category="top"` instead of spec-literal single-quotes `category='top'` [src/stores/wardrobeStore.ts:149 + wardrobeStore.test.ts] — fixed
- [x] [Review][Patch] No test documents that `category: null` is intentionally treated as corrupt (not backfilled) — `isWardrobeItem` correctly rejects it but intent is undocumented [src/stores/wardrobeStore.test.ts] — fixed: added "rejects records with category: null and falls through to empty-array corrupt-payload path" test
- [x] [Review][Defer] `normalizeItems` parameter typed as `WardrobeItem[]` while some items may be missing `category` at runtime — intermediate type would be more honest — deferred, pre-existing type design; Story 14.2 refactors the store
- [x] [Review][Defer] Concurrent `hydrateWardrobeStore()` calls not serialized — double setState + double warn possible — deferred, pre-existing structural issue in hydrateWardrobeStore (not introduced by this story)
- [x] [Review][Defer] Backfilled items not auto-persisted on read-only sessions — re-backfills on every cold launch until next `setItems` write — deferred, acknowledged design choice; Story 14.2 migration will resolve permanently
- [x] [Review][Defer] Five screen test files (`FavoritesList`, `ArmarioPickerScreen`, `ArmarioFichaWadaScreen`, `ArmarioTuLookScreen`, `ArmarioSugerenciaArmoniaScreen`) use anonymous WardrobeItem mocks missing `category` — silent `undefined` if any future test accesses `item.category` — deferred, tech debt; tests don't use `category` yet, update when downstream stories access it
- [x] [Review][Defer] `ArmarioPreviewScreen.test.tsx` has no assertion that `category: "top"` is forwarded — deferred, Story 14.5 will add proper category flow tests
- [x] [Review][Defer] No `addItem → AsyncStorage persist → hydrateWardrobeStore → getItems` category round-trip test — deferred, Story 14.2 integration test opportunity

### Change Log

- 2026-04-21 — Story 14.1 implemented on branch `story/14-1-wardrobe-item-category-field`. Added `WardrobeCategory` type + required `category` field on `WardrobeItem` / `WardrobeItemInput`, hydration backfill per TD-7, Epic-13 caller compile-gate fixes, co-located tests (AC #7 a–f + AC #8 forward-test). Quality gates green: `tsc` clean, `pnpm lint` clean, `pnpm test` 795 pass / 60 pre-existing (unchanged), +12 net tests, 0 new failures.
