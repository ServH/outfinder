---
title: Epic 14 — Technical Review (Winston)
author: Winston (System Architect)
reviewDate: 2026-04-21
status: findings-ready-for-alejandro-review
inputDocuments:
  - docs/epic-14-scope.md
  - docs/planning/epic-14.md
  - docs/planning/ux-design-epic-14.md
  - docs/project-context.md
  - docs/planning/architecture-react-native-ios.md
  - docs/planning/epic-13-armario-virtual.md
codeInspected:
  - src/lib/wardrobeTypes.ts
  - src/lib/wardrobeRepo.ts
  - src/lib/armario/saveCutoutAsWardrobeItem.ts
  - src/navigation/types.ts
  - src/contexts/FavoritesContext.tsx
  - src/config/premium.ts
  - modules/background-removal/src/index.ts
  - modules/white-balance/ (precedent)
reviewScope: "Option B — HIGH points deep-dive; MEDIUM/LOW as inline notes on stories"
---

# Epic 14 — Technical Review

Author: Winston (System Architect)
For: Alejandro (Product / Tech Lead)
Input artefacts: epic-14-scope, epic-14 (13 stories), ux-design-epic-14, plus direct code inspection
Review date: 2026-04-21

---

## Executive Summary

The epic is well-framed at the product and UX layers. Technically, it's buildable. But there are **5 HIGH-severity findings** that must be resolved or made explicit in the story specs before any dev agent picks up a story. Leaving them to "the dev will figure it out" is a recipe for context degradation, rework, and schedule slip.

**Top-line findings (all addressed below with severity + recommendation):**

1. **HIGH · Transparency trap in `getColors` over cutout PNG** — can produce false-positive dominant colors in production. Requires module-level architectural change.
2. **HIGH · Navigation restructure — unified camera must live in `RootStack`, not inside `ColorsStack`** — and the Armario capture subsystem (`ArmarioRoot`) should be fully deprecated at the same time.
3. **HIGH · Data-model coupling gap between `wardrobeRepo.assign` and `FavoritesContext`** — the new "auto-save on first assignment" semantics cross a store boundary that does not exist today. Requires an explicit orchestration decision.
4. **HIGH · Paywall-limbo "ghost state" on Ficha Wada** — user hits paywall after tapping "asignar", dismisses, and is stranded in an ambiguous screen. AC gap in stories 14.8 and 14.9.
5. **HIGH · v1.3.0 → v1.4.0 migration has no idempotency flag in the current design** — a half-crashed migration can produce duplicates, drops, or corruption on re-run.

**Go / no-go for sprint planning:** CONDITIONAL GO. If the 5 HIGH items are addressed via the concrete modifications proposed in this report (story AC additions + one architectural decision), sprint planning can proceed. Without addressing them, I'd recommend holding sprint planning back ~1 day and resolving in a focused working session with Alejandro.

---

## Finding 1 — `getColors` over transparent PNG: false-positive dominant color

**Severity:** HIGH
**Affected:** Story 14.3 (camera pipeline), all downstream consumers of detected Wada tone (14.4, 14.5, 14.8, 14.11).
**Confirmed by:** Alejandro's independent research.

**Problem.**
The pipeline specified by Epic 14 is: `takePictureAsync` → `removeBackground` (Vision iOS 17) → transparent PNG → `getColors` from `react-native-image-colors` (`.background` on iOS). The library samples `UIImage` pixel data directly. Transparent pixels in a premultiplied PNG retain RGB values (typically 0,0,0 for a pre-multiplied alpha=0 pixel). The dominant-color algorithm does NOT automatically skip them — they enter the statistical average.

**Real-world consequence.**
- A red sweater with tight bounding-box crop may still have ~20% transparent padding. Those transparent pixels pull the dominant color toward black.
- A pale garment (crema, pergamino) with transparent padding may produce a "dominant color" that is indistinguishable from the padding tone.
- Result: intermittent Wada match failures in production. Not a crash, but a UX lie: *"Es el tono Carmín"* when the jersey is, in fact, mustard.

**Recommended fix (architectural):**

> **Move dominant-color extraction into the native `background-removal` Swift module.** Extend `removeBackground` signature from `Promise<string>` (URI-only) to `Promise<{ cutoutUri: string; dominantHex: string }>`. The Swift module already has access to the CGImage pixel data after Vision segmentation. It computes the RGB average of pixels where `alpha > 0.5` threshold (weighted average), returns the `#RRGGBB` hex alongside the cutout URI.

**Rationale for this over chroma-key approach:**
- Eliminates transparency trap entirely (no JS-side color extraction call).
- Reduces pipeline steps (one fewer native bridge crossing).
- Swift-native pixel iteration is measurably faster than RN-bridged `getColors`.
- No risk of chroma-bleed on antialiased edges (which `#FF00FF` chroma key has).

**Cost:** ~1 day in Swift (trivial algorithm); additional ~1 day to rewire `src/lib/armario/saveCutoutAsWardrobeItem.ts` and the camera pipeline to consume the new shape; zero additional test infrastructure (existing Jest mock pattern at `__mocks__` covers this).

**Fallback if preserving current module contract is desired:**
Swift module composites the cutout over a mid-grey `#808080` background before returning the PNG, and keeps signature as-is. Less ideal (wastes pixels, doesn't help lossy JPEG re-encoding if that happens downstream), but avoids touching the module API.

**Action required:**
- Add a new task to Story 14.3 (or split Story 14.3 into 14.3a nav + 14.3b pipeline) explicitly specifying the module change.
- Update `modules/background-removal/src/index.ts` type signature.
- Update the Jest mock (`__mocks__`) to return the new shape.
- Update `saveCutoutAsWardrobeItem.ts` to consume `dominantHex` directly (no `getColors` JS call).

**Alejandro decision needed:** approve module signature change, or fall back to Option 2 (composite on neutral background).

---

## Finding 2 — Navigation restructure: unified camera must sit in RootStack + deprecate ArmarioRoot

**Severity:** HIGH
**Affected:** Story 14.3, plus collateral deprecations not yet enumerated in epic-14.md.
**Confirmed by:** Alejandro's independent research (partially — he identified the RootStack modal requirement; my analysis extends the deprecation scope).

**Problem.**
Current `src/navigation/types.ts` contains **two separate camera subsystems**:

- `CaptureScreen` lives inside `ColorsStackParamList` (color-first capture via ColorHome FAB).
- `ArmarioCapture` + `ArmarioPreview` live inside `ArmarioStackParamList` under a root-level `ArmarioRoot` nested navigator (wardrobe-style capture via armario flows).

Epic 14 calls for a single unified camera from the Tab Bar FAB. But the epic doc's story 14.3 only specifies "delete `CaptureScreen`". It does not address the `ArmarioCapture` / `ArmarioPreview` / `ArmarioRoot` subsystem at all, which means the repository would end up with dead code and a redundant nested navigator post-Epic-14.

**Recommended fix (architectural):**

> **Create a new `UnifiedCameraRoot` nested navigator at `RootStackParamList` level** (sibling of `Main`; `ArmarioRoot` gets removed). Contents: `UnifiedCameraStackParamList` with `Capture`, `Result`, `PostSave` (if Sally's designs make it a full screen) screens.
>
> **Full deprecation list (Story 14.3 must own these):**
> - `CaptureScreen` → delete file + route type.
> - `ArmarioCapture` + `ArmarioPreview` → delete files + `ArmarioStackParamList` → delete type.
> - `ArmarioRoot` → remove from `RootStackParamList`.
> - All consumers (`navigation.push("CaptureScreen")`, `navigation.navigate("ArmarioRoot", { ... })`) → rewire to `UnifiedCameraRoot`.
> - Test mocks referencing the old routes → update or remove.

**Wardrobe-workspace screens (ArmarioZeroState, ArmarioFichaWada, ArmarioPicker, ArmarioTuLook, ArmarioSugerenciaArmonia) stay in `FavoritesStackParamList`** — which Epic 14 also renames to `MisLooksStackParamList` (Story 14.7).

**Navigation behavior (as Alejandro correctly stated):** the unified camera presents modally over whatever tab the user was in. Swipe-down or cancel returns the user to their previous tab state without disruption. This matches the existing `ArmarioRoot` precedent from Epic 13.

**Cost / risk:** the deprecation sweep touches ~10-15 files depending on import reach. It is a HIGH-impact refactor but the changes are mechanical (rename + delete). Test suites will surface broken mocks immediately. CI will catch dead imports.

**Action required:**

> **Split Story 14.3 into two stories:**
>
> - **Story 14.3a — Unified camera navigation setup + legacy route deprecations** (4 tasks max):
>   1. Create `UnifiedCameraRoot` in `RootStackParamList` with `UnifiedCameraStackParamList`.
>   2. Wire Tab Bar FAB to open `UnifiedCameraRoot` (modal presentation).
>   3. Delete `CaptureScreen` + remove from `ColorsStackParamList`. Delete `ArmarioCapture` + `ArmarioPreview` + `ArmarioStackParamList` + `ArmarioRoot` from `RootStackParamList`.
>   4. Update all consumers + test mocks; run `tsc` / `lint` / `test` green.
>
> - **Story 14.3b — Unified camera pipeline + integration with Result screen** (4 tasks max):
>   1. Port existing bg-removal pipeline into the new `Capture` screen.
>   2. Integrate with the Swift module signature change from Finding 1 (if approved).
>   3. Navigate to `Result` screen with pipeline output.
>   4. Integration tests (pipeline input → output).

This split also reduces the scope-creep risk that a single 5-task Story 14.3 was hiding.

**Alejandro decision needed:** approve the split of Story 14.3 into 14.3a + 14.3b and the extended deprecation scope.

---

## Finding 3 — Data-model coupling gap: `assign` ↔ Favorites

**Severity:** HIGH
**Affected:** Story 14.8 (auto-save on first assignment), Story 14.9 (Guardar para luego), Story 14.2 (migration).
**Confirmed by:** Winston via code inspection of `src/lib/wardrobeRepo.ts` + `src/contexts/FavoritesContext.tsx`.

**Problem.**
Today's model splits wardrobe data between two stores:

| Store | Shape | Owns |
|-------|-------|------|
| `useWardrobeStore` (Zustand, AsyncStorage `@wardrobe:items` and similar) | `items: WardrobeItem[]`, `assignments: CombinationAssignment[]` | physical garments, slot-level assignments |
| `FavoritesContext` (React Context, AsyncStorage `@outfinder/favorites`) | `favorites: Set<string>` | which combinationIds are "saved" |

`wardrobeRepo.assign(combinationId, colorIndex, wardrobeItemId)` today **writes only to `useWardrobeStore`**. It does NOT touch Favorites. It does NOT check `FREE_FAVORITES_LIMIT`.

Epic 14 Story 14.8 says: *"A look auto-saves into Mis Looks (consuming 1 of 5) at the moment the user assigns their first garment to any color slot in Ficha Wada."*

This semantic implies that `assign` must, from v1.4.0 onward:
1. Check whether `combinationId` is already in Favorites.
2. If not: attempt to add it (respecting `FREE_FAVORITES_LIMIT` paywall gate).
3. On paywall trip: reject the assignment (don't persist the assignment either — the look doesn't exist).
4. On success: persist both the Favorites add AND the assignment atomically.

**That requires `wardrobeRepo` to reach into `FavoritesContext`, a React Context** — impossible from a pure function in a non-React module.

**Recommended fix (architectural decision needed):**

Three options:

| Option | Description | Cost | Long-term hygiene |
|--------|-------------|------|-------------------|
| **A — Move Favorites to Zustand** | Deprecate `FavoritesContext`, create `useFavoritesStore` Zustand store with identical API. `wardrobeRepo` imports from it directly. | MEDIUM (~1.5 days). Refactor + migrate ~8 call sites. | **Best.** Unifies the data layer. Sets up future stores nicely. |
| **B — Add pure-JS orchestrator layer** | Keep `FavoritesContext` as the public API surface; create `src/lib/wardrobeActions.ts` with higher-level functions like `assignGarmentWithAutoFavorite(...)` that receive `{ isPremium, addToFavorites, getFavorites }` as injected dependencies from the React call site. | LOW (~0.5 days). | Adds indirection; doesn't solve the root problem. |
| **C — Migrate Favorites into `useWardrobeStore`** | Rename store to `useMisLooksStore`; add `favorites: Set<string>` as a store slice alongside `items` and `assignments`. Delete `FavoritesContext` entirely. | MEDIUM-HIGH (~2 days). Bigger ripple. | **Best for Epic 14 narrative.** Reflects the "Mis Looks = workspace" mental model at the code level. |

**My recommendation: Option C.**

Rationale:
- The product frame is clear: "Mis Looks is the workspace". Having the data model reflect that (one store owning items + assignments + favorites) is conceptually coherent.
- Epic 14's rename `Favorites` → `Mis Looks` is already touching the UX/UI layer of Favorites. Migrating the underlying store at the same time is the cheapest time to do it (the surface area is already "in play").
- Option B is technical debt: it pushes the split-store pain to a later release.
- Option A is a middle ground but doesn't rename anything — you end up with a `FavoritesStore` (misleading name) and a `wardrobeStore` in parallel forever.

**Cost of Option C:** Add a dedicated data-migration story. Call it **Story 14.2 (revised)** or split into **14.2a (schema migration to unified store) + 14.2b (user-facing UX of migration — no-op for the user)**. Either way, ~2 days of focused work.

**Action required:**
- Explicit story spec update for 14.2 (data migration) to cover the new unified-store destination.
- AC update for 14.8 to reference the paywall gate on the new auto-save path.
- Deprecate `FavoritesContext` as part of 14.2 or a dedicated 14.2a.

**Alejandro decision needed:** pick Option A, B, or C. If you trust me, go with C. If launch urgency is absolute, B ships faster.

---

## Finding 4 — Paywall-limbo "ghost state" on Ficha Wada

**Severity:** HIGH
**Affected:** Story 14.8, Story 14.9.
**Confirmed by:** Alejandro's independent research.

**Problem.**
Flow that breaks:
1. Free user already at 5/5 Mis Looks.
2. Opens Visualizer, taps "Hacer este look mío".
3. Lands in Ficha Wada (working mode, not yet persisted — correctly, per Epic 14 rules).
4. Taps "Asignar" on any color slot.
5. Because auto-save on first assignment would create a 6th Mis Looks entry → paywall sheet fires.
6. User dismisses paywall without upgrading.

**Current AC in Story 14.8 doesn't say what the screen does after step 6.** The user is stuck in working mode on a look that cannot be saved, with assignment buttons that would re-trigger the same paywall, and no signal explaining why.

**Recommended fix (AC addition):**

Add this AC block to **Story 14.8** (and mirror in **Story 14.9** for the "Guardar para luego" path):

```
Given a free user is at 5/5 Mis Looks entries
When they tap "Asignar" on any color slot in Ficha Wada working mode
Then the existing PremiumPaywall modal is shown
And if the user dismisses the paywall without upgrade:
  - NO Mis Looks entry is persisted
  - NO garment assignment is persisted
  - Assignment affordances (slot CTAs) render in a disabled visual state
    (reduced opacity, no border emphasis)
  - Tapping a disabled slot re-triggers the paywall
  - A discrete explanatory strip appears at the top of the screen:
    "Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."
  - Swipe-back navigation works normally and returns to Visualizer
  - The user can browse the Ficha Wada visually without further interaction

Given the user upgrades via the paywall and returns
Then the disabled state is cleared and assignment proceeds normally.

Given the user goes back and deletes a Mis Looks entry to free a slot
When they return to the Ficha Wada
Then the disabled state is cleared and assignment proceeds normally.
```

Same pattern applies to "Guardar para luego" (Story 14.9): if paywall fires and is dismissed, the button stays present but grayed, and tapping re-triggers the paywall.

**Rationale for disabled-state over goBack or blocking overlay:**
- `goBack()` on dismiss is surprising — the user didn't ask to leave.
- A blocking overlay feels paternalistic and hides the value the user was about to get.
- Disabled-state + explanatory strip is honest, reversible, and preserves the user's agency (upgrade or free a slot).

**Action required:**
- Update AC of Story 14.8 with the block above.
- Update AC of Story 14.9 with the mirrored "Guardar para luego" variant.
- Add a new copy entry to the glossary: `"Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."` / `"You've reached the 5-look free limit. Delete one to continue."`.
- Add the disabled-state visual to Sally's Pencil queue (non-blocking for dev to start if using placeholder styling).

**Alejandro decision needed:** approve the disabled-state approach (vs. goBack, vs. blocking overlay).

---

## Finding 5 — v1.3.0 → v1.4.0 migration lacks explicit idempotency flag in current AC

**Severity:** HIGH
**Affected:** Story 14.2 (data migration).
**Confirmed by:** Winston via story AC inspection.

**Problem.**
Story 14.2 says migration must be idempotent (AC: *"no duplicates are created on subsequent app launches"*). But the AC does not specify:
1. WHERE the "migration-done flag" is stored.
2. WHAT happens if the migration crashes halfway through.
3. WHAT happens if the user force-kills the app during migration.
4. WHAT happens if AsyncStorage runs out of disk space mid-write.

Without explicit handling, a half-crashed migration on re-run may:
- Detect the already-migrated entries, skip them (good).
- OR duplicate them (if the idempotency key is wrong).
- OR drop them (if the source-key is cleared before the destination is fully written — partial-failure erasure).

**Recommended fix (AC additions):**

Add to **Story 14.2**:

```
Given the migration has been designed
When migration code writes to the destination storage
Then writes are atomic at the per-record level
  (no partial record should exist; if a record would be malformed, skip it with a warn log)
And after each successful record migration, a per-record "migrated" marker is NOT stored
  (we rely on destination presence + idempotency-flag instead — cheaper & simpler)
And at the end of the batch, an idempotency flag is written under a
  dedicated key `@outfinder/migration:favorites-to-mis-looks:v1` with value `"complete"`
And the legacy source key `@outfinder/favorites` is ONLY cleared AFTER the idempotency flag is written
  (so a crash mid-sequence leaves the source intact and re-run is safe)

Given a previous migration run crashed
When the app launches
Then the migration re-runs
And existing destination entries are detected by ID and skipped, not duplicated
And any entries missing from destination are added

Given AsyncStorage write fails mid-migration
When the failure is caught
Then a warn is logged, the migration stops (does not clear the source key),
  and the user sees their data intact on next app launch (pre-migration state)
```

**Rationale:** "source-preserving, idempotency-flag-gated" migration is the established safe pattern for AsyncStorage on RN. It's ~3 lines of extra code and eliminates entire classes of crash-during-migration failures.

**Action required:**
- Update Story 14.2 AC with the block above.
- Explicit idempotency key name: `@outfinder/migration:favorites-to-mis-looks:v1` (the `:v1` suffix future-proofs future migrations).
- Add a migration-status dev-menu toggle (behind `__DEV__`) to simulate re-runs during testing.

**Alejandro decision needed:** approve the pattern, or propose alternative migration gating.

---

## Remaining sections — inline notes (MEDIUM + LOW)

Per Alejandro's Option B scope, these are captured as notes to fold into the story specs during `bmad-create-story`, rather than as full findings.

### Section 1 — Review of 13 stories (MEDIUM, per-story notes)

| Story | Note |
|-------|------|
| **14.1** (WardrobeItem schema extension) | Explicit policy for legacy items without `category`: recommend **default value `"top"`** (most common category, pragmatic fallback) rather than `"unknown"` — avoids a 5th category that clutters Pencil mockups and future filter pills. AC needs: "Migration default is `"top"` for existing items; documented as a pragmatic default subject to user correction via future category-edit flow (v1.5.0 backlog)." |
| **14.2** (Favorites → Mis Looks migration) | See Finding 5. Also: consider whether migration drops favorites referencing `combinationId`s that no longer exist in the Wada dataset (should be skipped with warn log, not migrated). AC: "Favorites referencing orphaned combinationIds are dropped with a single warn log per orphan; remaining favorites migrate normally." |
| **14.3 (split into 14.3a + 14.3b)** | See Finding 2. |
| **14.4** (Camera result screen UI) | Consumes outputs of 14.3b. If Finding 1 option A is approved, dominantHex comes directly from Swift module; no JS `getColors` call. |
| **14.5** (Save flow + category sheet + paywall) | Category is final for v1.4.0 (see Finding 3 / category editing note below). AC must say: *"Category selection is final; correction requires delete-and-rescan. Edit-category affordance is v1.5.0 backlog."* |
| **14.6** (Visualizer CTA) | No technical concerns. Copy + visuals from UX spec are sufficient. |
| **14.7** (Mis Looks rename) | `FavoritesStackParamList` → `MisLooksStackParamList` is a breaking rename; ~15 file-level imports. Consider a deprecation codemod or do it in one commit. Icon final choice deferred to Pencil — dev uses `archivebox` provisionally. |
| **14.8** (Auto-save on first assignment) | See Finding 3 (data coupling) + Finding 4 (paywall limbo). Cannot start dev until Finding 3 option is decided. |
| **14.9** (Guardar para luego) | See Finding 4. Can start after 14.8 architecture is settled. |
| **14.10** (+ Nuevo look CTA) | Navigation target in spec: navigates to `ColorHome`. Confirm with Alejandro — there's no dedicated "palette catalog" screen today. ColorHome already serves this function after Epic 8 (wardrobe-first redesign). |
| **14.11** (Incomplete looks retention surface) | Order: sort by `assignments[N].assignedAt` max per combinationId, descending. If no assignments: fall back to Favorites' `addedAt` (needs to be added to the new unified store — trivial). Limit: show all in a horizontal scroll — at 10+ incompletes, scroll is fine; at 50+ incompletes, performance regression is negligible (FlatList virtualizes horizontally). |
| **14.12** (Delete discoverability) | See category-editing note below. Also: explicitly document that long-press on a single thumbnail in NORMAL mode (pre-edit-mode) still triggers the single-item confirmation sheet from v1.3.0 — backwards compat. |
| **14.13** (On-device QA) | QA checklist must cover: paywall limbo (Finding 4), migration idempotency (Finding 5), orphaned favorites (migration), category default for legacy items. |

### Section 2 — Edit-category-post-save (MEDIUM, v1.5.0 backlog)

**From Alejandro's finding 3.** I recommend NOT adding to Epic 14. Workaround: delete + rescan via edit mode (UX-DR3). Document in Story 14.5 AC as "category is final for v1.4.0". Add a P0 entry to `v1.5.0 backlog`: *"Edit-category affordance on wardrobe items via S3 edit mode pencil icon; reuses category sheet component from 14.5."*

### Section 3 — Edge cases (MEDIUM-LOW)

- **Corruption mid-migration:** addressed in Finding 5.
- **`cascadeDeleteAssignmentsForItem` and 0/3 looks:** a look that becomes 0/N after cascade delete remains in Mis Looks (as a bookmarked look with no assigned garments). This is CORRECT behavior — the user explicitly saved the look, and deleting a prenda shouldn't unsave it. No AC change needed; but this should be called out in Story 14.12 as a desired side-effect test.
- **10+ incomplete looks in retention surface:** horizontal FlatList with virtualization handles this fine. No perf concern until 100+ looks, which is beyond the 5/5 free tier and even Premium users will rarely hit.
- **S4 polaroid with legacy items missing category:** no impact — S4 doesn't render category anywhere; it's a share image of garments with Wada colors. Zero visual glitch.

### Section 4 — Technical debt inventory (LOW, closure)

**Debt items that Epic 14 RESOLVES:**
- Two cameras in two nav subsystems → reduces to one (Finding 2).
- `CaptureScreen`'s WB slider "visible but effectively unused on iOS" (current debt #6 in `project-context.md`) → deprecated entirely with `CaptureScreen` removal.

**Debt items that Epic 14 INTRODUCES:**
- Post-save ("¿Ahora qué?") screen copy not yet finalized in Pencil — dev can use placeholder.
- Mis Looks icon final choice deferred to Pencil.
- Edit-category is v1.5.0 backlog (documented).
- Long-press-on-single-item fallback remains (backwards compat); slightly awkward that two gestures now exist for the same destructive action, but it's a compat tax we choose to pay for one release.

**Existing debt items NOT touched by Epic 14:** #1 (Biome CSS workaround), #2 (Reanimated mock identity), #4 (Home handleScroll JS-driver), #5 (no StoreKit config), #7 (pre-existing i18n test failures). All low-priority; Epic 14 does not worsen any of them.

### Section 5 — Formal architecture document? (LOW, closure)

**Recommendation: NO.** The review + story AC additions proposed here are sufficient. Creating a dedicated architecture doc would:
- Duplicate content that belongs in story specs (which devs actually read during implementation).
- Slow down sprint planning by a day or two.
- Create a maintenance burden (doc will rot as stories evolve).

**Exception:** If Finding 3 Option C (unified store refactor) is chosen, a **dedicated 1-page ADR (Architecture Decision Record)** at `docs/adrs/ADR-005-unified-mis-looks-store.md` documenting the decision + consequences + alternatives is worth creating. One page, not a full architecture document. Let me know.

---

## Recommended Path Forward

1. **Alejandro reviews this report.** Takes ~15 minutes.
2. **Alejandro makes 5 explicit decisions:**
   - Finding 1: Swift module change (yes/no) or composite fallback.
   - Finding 2: approve split of 14.3 into 14.3a + 14.3b and full `ArmarioRoot` deprecation.
   - Finding 3: pick Option A, B, or C (my vote: C) — and whether to write the ADR.
   - Finding 4: approve disabled-state UX for paywall-limbo resolution.
   - Finding 5: approve migration idempotency-flag pattern.
3. **Apply decisions to `docs/planning/epic-14.md`:**
   - Split 14.3 into 14.3a + 14.3b.
   - Update AC of stories 14.1, 14.2, 14.4, 14.5, 14.8, 14.9, 14.10, 14.12 with the notes above.
   - Add migration idempotency block to 14.2.
   - Add paywall-limbo block to 14.8 + 14.9.
4. **Run `bmad-sprint-planning`** to produce execution order + sprint assignments.
5. **Start dev on UX-independent stories** (14.1, 14.2, 14.3a, 14.7) in parallel with Sally's Pencil iteration for UX-DR-dependent stories.

---

## Final Verdict

**CONDITIONAL GO for sprint planning.**
- If the 5 HIGH findings are addressed via the proposed modifications, Epic 14 is buildable, coherent, and launch-ready.
- If any HIGH is deferred without resolution, sprint planning should pause and those items should be triaged first.
- No Epic 14 delay should be caused by MEDIUM/LOW items — those are routine story polish.

Estimated additional effort to address HIGHs: **1.5–2 dev-days of spec/architecture work + 1 ADR** before sprint planning. All HIGHs have concrete proposed resolutions — none require further discovery.

---

*End of technical review. Winston signing off.*
