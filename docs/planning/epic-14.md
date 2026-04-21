---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
  - tech-review-winston-2026-04-21
status: ready-for-sprint-planning
inputDocuments:
  - docs/epic-14-scope.md
  - docs/ideas.md
  - docs/planning/epic-13-armario-virtual.md
  - docs/planning/architecture-react-native-ios.md
  - docs/planning/ux-design-epic-14.md
  - docs/planning/epic-14-tech-review.md
  - docs/adrs/ADR-005-unified-mis-looks-store.md
  - CLAUDE.md
technicalReview: docs/planning/epic-14-tech-review.md
uxSpec: docs/planning/ux-design-epic-14.md
pencilDocument: designs/Epic14.pen
adrs:
  - docs/adrs/ADR-005-unified-mis-looks-store.md
---

# Outfinder — Epic 14: App Flow Reorganization (v1.4.0 pre-launch)

## Overview

Epic 14 reorganizes the app's activation and retention loops so the Armario Virtual (Epic 13) becomes discoverable on first use. Epic 13 is technically complete but validation with 5–6 users proved the current flow hides 80% of the app. Epic 14 is a **launch blocker** for v1.4.0 App Store submission.

Primary replacement of prior PRD: `docs/epic-14-scope.md` (approved 2026-04-21 via John/Alejandro PM session).

## 📦 Release context — Epic 13 + Epic 14 ship together as v1.4.0

> **Critical mental model for anyone working on this epic.** Epic 13 (Armario Virtual) was technically completed on `epic-13` branch at commit `eae624e` but **NEVER released to the App Store**. The current production release is **v1.3.0**. v1.4.0 will be the first release containing BOTH Epic 13 functionality (Armario, cutout pipeline, Ficha Wada, `WardrobeItem` model, assignments) AND Epic 14 functionality (unified camera, Mis Looks rename, flow reorganization).

**Implications for migrations (Story 14.2):**

- **Production users upgrading v1.3.0 → v1.4.0 have ZERO pre-existing wardrobe data.** They never had `WardrobeItem` entries, assignments, `category` fields, or `@wardrobe:*` storage keys. The **only user-data migration** that matters for production is `@outfinder/favorites` (Set<combinationId>) → the new `useMisLooksStore.favorites` slice.
- **The unified `useMisLooksStore` (TD-3 / ADR-005) is STILL required** — it is an internal code consolidation to support FR12 (auto-save on first garment assignment) without cross-store orchestration. It is NOT user-data migration and does not depend on any legacy production data existing.
- **TD-7 (legacy category default = `"top"`) is DEFENSIVE for internal testers only** — TestFlight/internal-beta users who installed Epic 13 builds may have `WardrobeItem` entries without `category`. The default-to-`"top"` code path is cheap safety and should remain, but it is **NOT load-bearing for production users** (who have zero legacy items).
- **Story 14.13 QA** does NOT need to certify "upgrade from Epic 13 internal beta" as a blocker. The blocker is "upgrade from v1.3.0 production → v1.4.0 preserving favorites" (see Ajuste 3 in the QA checklist).

**Implications for QA narrative (Story 14.13):**

- Epic 13 functionality enters production for the first time via v1.4.0 — QA must exercise it end-to-end even though it has existed in code since `epic-13` branch.
- "Upgrade path" testing reduces to a single user variable: `N` favorites in v1.3.0 where `N ∈ {0, 3, 5}`. No wardrobe-items-upgrade scenario exists in production.

This context was recognised by Alejandro on 2026-04-21 after Stories 14.1 and 14.2 were already implemented. The existing implementation of 14.1 + 14.2 is correct and does not need rework — the defensive code paths are cheap and protect internal testers. This release-context note simply clarifies the mental model for the remaining stories and for QA.

## ⚠️ Technical Decisions (post-review) — READ BEFORE IMPLEMENTING ANY STORY

> **Story agents and devs:** these are the load-bearing technical decisions closed by Alejandro + Winston (Architect) on 2026-04-21 after the full technical review documented at `docs/planning/epic-14-tech-review.md`. Every story below references the decision(s) it depends on via a **Technical notes** block. If any of the decisions below seem contradictory to a story's AC, the decision WINS and the story must be adjusted — not the other way around.

- **TD-1 · Dominant color extraction moves into Swift.** The `modules/background-removal` native module is modified to return `{ cutoutUri: string; dominantHex: string }` instead of just a URI. The Swift module computes the weighted RGB average of pixels with `alpha > 0.5` in the same pass as Vision segmentation. `react-native-image-colors` is NO LONGER called on the cutout — this eliminates the transparency trap (transparent pixels would otherwise bias dominant color toward black). Affects stories 14.3b, 14.4, 14.5.
- **TD-2 · Unified camera lives in `RootStack` as a modal nested navigator. `ArmarioCaptureScreen` is PRESERVED for in-context slot-assignment.** Create `UnifiedCameraRoot` at `RootStackParamList` level (sibling of `Main` and `ArmarioRoot`). Contents: `UnifiedCameraStackParamList` with `Capture`, `Result`, `PostSave` screens. Narrow deprecation: **delete only `CaptureScreen`** from `ColorsStackParamList`. `ArmarioCapture` + `ArmarioPreview` + `ArmarioRoot` + `ArmarioStackParamList` are **PRESERVED** — they serve a different UX context (in-Ficha-Wada slot-assignment, cutout-only pipeline, no Wada tone detection). The two cameras are semantically distinct: (a) global FAB = "add to armario" (scan → Wada tone + combinations + save/dismiss); (b) in-Ficha-Wada slot picker = "add a new prenda to this slot" (scan → cutout → assign to the already-known slot color). Armario workspace screens (ZeroState, FichaWada, Picker, TuLook, SugerenciaArmonia) stay in `FavoritesStackParamList` → renamed `MisLooksStackParamList` under Story 14.7. Affects stories 14.3a, 14.3b, 14.7.
- **TD-3 · Data model unification (ADR-005).** `FavoritesContext` is DEPRECATED. A new `useMisLooksStore` (Zustand, AsyncStorage-persisted) owns `items: WardrobeItem[]`, `assignments: CombinationAssignment[]`, and `favorites: Set<string>` as a single coherent store. This eliminates cross-boundary orchestration and supports the semantics of FR12 (auto-save look to Mis Looks on first garment assignment). See `docs/adrs/ADR-005-unified-mis-looks-store.md` for the full decision record. Affects stories 14.2, 14.8, 14.9.
- **TD-4 · Paywall-limbo resolution — disabled state + explanatory strip.** When a free user at 5/5 Mis Looks taps "Asignar" (Story 14.8) or "Guardar para luego" (Story 14.9) and dismisses the paywall without upgrading, the Ficha Wada remains visible but assignment affordances render in a disabled visual state (opacity 40%), tapping re-triggers the paywall, and a discrete explanatory strip appears at the top: *"Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."* Swipe-back works normally. NO automatic `goBack()`. NO blocking overlay. Affects stories 14.8 and 14.9.
- **TD-5 · Migration idempotency pattern (Story 14.2).** Migration uses a source-preserving, flag-gated pattern: (a) write each migrated record atomically to destination; (b) after the full batch, write idempotency flag `@outfinder/migration:favorites-to-mis-looks:v1` with value `"complete"`; (c) ONLY then clear legacy source key `@outfinder/favorites`. On re-run, detect destination records by ID and skip duplicates. Half-crashed migration leaves source intact — re-run is safe. Records referencing `combinationId`s that no longer exist in the Wada dataset are dropped with a single warn log per orphan.
- **TD-6 · Category is editable in v1.4.0 (not deferred).** Alejandro's decision 2026-04-21: after initial plan to defer to v1.5.0, product pulled this back into Epic 14 scope. Implemented via a new **Story 14.12b** (see below): in the delete edit mode (UX-DR3, Story 14.12a), each wardrobe thumbnail also gets a pencil icon (top-right corner) alongside the (−) icon. Tap pencil → reopens the category sheet from Story 14.5 (component reuse) → user picks new category → persists to the `WardrobeItem`.
- **TD-7 · Legacy `WardrobeItem` default category = `"top"` (DEFENSIVE for internal testers only).** For items that existed before the category field was introduced (edge: internal/TestFlight Epic 13 beta builds), the migration sets `category: "top"` as the pragmatic default. Users can correct via TD-6 edit mode. **NOT load-bearing for production** — production users upgrading v1.3.0 → v1.4.0 have no pre-existing wardrobe items (see "Release context" section above). Keep the code path as a cheap safety net; do NOT invest additional engineering in strengthening it. Rationale for `"top"` over `"unknown"`: most common category, avoids polluting the taxonomy with a 5th value.

Any future technical deviation from TD-1 through TD-7 requires explicit sign-off from Alejandro. Story agents: treat this block as binding.

## Requirements Inventory

### Functional Requirements

**Unified camera**

- **FR1**: The app exposes a single unified camera reached from the Tab Bar FAB; `CaptureScreen` is removed from the codebase.
- **FR2**: The camera pipeline runs `removeBackground` (Vision iOS 17) followed by `getColors` on the background-free PNG, matched via `matchWadaColor`, to derive the dominant Wada tone.
- **FR3**: The camera result screen shows (a) the cutout, (b) the detected Wada tone name ("Es el tono Carmín"), and (c) a preview of combinations containing that tone.
- **FR4**: The result screen offers two explicit primary actions: "Guardar en mi armario" (persists the garment) and "Ver combinaciones y seguir sin guardar" (does not persist).
- **FR5**: The "Guardar" action triggers the existing `FREE_WARDROBE_LIMIT = 10` paywall when free users reach the cap.

**Tagging on save**

- **FR6**: On "Guardar", a mandatory category selector is shown offering four options: Parte de arriba / Parte de abajo / Calzado / Accesorio. The save cannot complete without a category.
- **FR7**: The `WardrobeItem` type is extended with a required `category` field of type `"top" | "bottom" | "footwear" | "accessory"`; `wardrobeRepo` persists it; existing v1.3.0 items receive a default/inferred value during migration.

**Visualizer as a bridge**

- **FR8**: The Outfit Visualizer's primary CTA becomes "Hacer este look mío"; the prior "Compartir Outfit" action is removed (or demoted if product decides otherwise during UX phase).
- **FR9**: Tapping "Hacer este look mío" navigates to the Ficha Wada in working mode **without** persisting to Mis Looks.
- **FR10**: The Visualizer is no longer shareable externally. Only the S4 polaroid (real garments) retains sharing.

**Mis Looks (rename + semantic shift)**

- **FR11**: The Favorites tab is renamed to "Mis Looks"; the heart icon is replaced by a wardrobe/hanger icon; all existing navigation routes / deeplinks remain valid.
- **FR12**: A look auto-saves into Mis Looks (consuming 1 of `FREE_FAVORITES_LIMIT = 5`) at the moment the user assigns their **first** garment to any color slot in Ficha Wada.
- **FR13**: A look can be saved into Mis Looks with zero assigned garments via an explicit "Guardar para luego" action on the Ficha Wada (consumes 1 slot; status `0/3 prendas asignadas`).
- **FR14**: Entering Ficha Wada and leaving without assigning a garment **or** tapping "Guardar para luego" consumes zero slots.

**Secondary entry point**

- **FR15**: The Mis Looks tab exposes a "+ Nuevo look" entry point (button or card) that navigates to the Wada palette catalog, allowing experienced users to start a new look without going through the camera.

**Lightweight retention**

- **FR16**: Incomplete looks (status `X/3 prendas asignadas`, `X < 3`) are surfaced prominently on Home **or** at the top of Mis Looks (exact placement is a UX-design output), reusing the S5 badges already built in Epic 13.

**Migration**

- **FR17**: Users upgrading from v1.3.0 to v1.4.0 preserve all existing Favorites data; each prior Favorite migrates to a Mis Looks entry with zero data loss. Users already at 5/5 are grandfathered (they retain all 5). Upgrade requires no user action.

**Delete discoverability**

- **FR18**: The user can delete a wardrobe item via a visually discoverable affordance in addition to the long-press gesture (long-press continues to function for backwards compatibility). The specific affordance (hint text / edit mode / always-visible (−) / iPhone-wiggle) is selected by UX design.

### Non-Functional Requirements

- **NFR1**: All new and modified UI meets accessibility standards per `CLAUDE.md`: `testID`, `accessibilityLabel`, `accessibilityRole`, 44pt min touch targets, VoiceOver coverage, Reduce Motion respected via `AccessibilityInfo`.
- **NFR2**: iPhone-only target (iPad deferred).
- **NFR3**: v1.3.0 → v1.4.0 upgrade must not require re-login, data restore, or manual user action. No breaking changes to existing storage keys.
- **NFR4**: Zero regressions on S4 polaroid export — must continue to work after Epic 14 lands.
- **NFR5**: On-device QA on iPhone 16 Pro passes before App Store submit.
- **NFR6**: `npx tsc --noEmit`, `pnpm lint`, `pnpm test` all pass green. Zero new test-skips.
- **NFR7**: First-use journey (open → FAB → scan → save → initiate look) completes in ≤2 minutes on iPhone 14 and newer.
- **NFR8**: No analytics SDK added. Feature decisions remain craft-driven (per `feedback_no_analytics.md`).
- **NFR9**: Haptics exclusively through `lib/haptics.ts`; no direct `expo-haptics` imports.

### Additional Requirements (Architecture-Inherited)

- `FREE_WARDROBE_LIMIT = 10` preserved (Epic 13 decision).
- `FREE_FAVORITES_LIMIT = 5` preserved (Epic 13 decision; explicitly reconfirmed 2026-04-21).
- Wardrobe paywall and Favorites paywall are independent; saving a look does NOT consume a wardrobe slot and vice versa.
- Vision iOS 17 cutout quality is trusted; no defensive "mal recorte" UX (`project_vision_cutout_quality.md`).
- Function declarations with named exports (never `export default`).
- NativeWind `className` for static styles; `style={{}}` only for dynamic Wada color values.
- Props interface required (`interface {Component}Props`).
- Tests co-located with source.
- Max 4–5 tasks per story; never combine stories from the epic plan (hard rule from 5 prior retros).

### UX Design Requirements

The following items are handed to Sally (UX designer) via `bmad-create-ux-design` **before** their respective stories are developed:

- **UX-DR1**: Design the **unified camera result screen** — cutout display, detected Wada tone presentation, combinations preview, category selector treatment, and the two primary CTAs ("Guardar en mi armario" / "Ver combinaciones y seguir sin guardar"). Dense screen — needs careful hierarchy.
- **UX-DR2**: Design the **Ficha Wada working-mode entry state and "Guardar para luego" affordance** — how the bookmark action surfaces, how the 0/3 status reads, and how the empty state communicates "trabajo en curso".
- **UX-DR3**: Design the **delete-garment discoverability mechanism**. Explore ≥3 alternatives (subtle header hint / always-visible (−) badge / iPhone-style edit mode with wiggle) with trade-offs documented; product selects one.
- **UX-DR4**: Design the **Mis Looks tab header** — new icon treatment, rename visuals, and the "+ Nuevo look" CTA placement (FAB vs. top card vs. list item).
- **UX-DR5**: Design the **incomplete-looks surface** on Home (or top of Mis Looks), reusing Epic 13 S5 badges.
- **UX-DR6**: Design the **Visualizer updated primary CTA** — visual treatment of "Hacer este look mío" and the disposition of the prior share action.

### FR Coverage Map

| FR | Epic / Theme | Description |
|----|--------------|-------------|
| FR1 | 14 / B | Single unified camera from Tab Bar FAB, `CaptureScreen` removed |
| FR2 | 14 / B | Pipeline `removeBackground` → `getColors` → `matchWadaColor` |
| FR3 | 14 / B | Result screen: cutout + Wada tone + combinations preview |
| FR4 | 14 / B | Two primary CTAs on result screen (save vs. continue-without-saving) |
| FR5 | 14 / B | Paywall `FREE_WARDROBE_LIMIT = 10` triggered on save |
| FR6 | 14 / B | Mandatory category selector on save |
| FR7 | 14 / A | `WardrobeItem.category` field extension + persistence |
| FR8 | 14 / C | Visualizer primary CTA = "Hacer este look mío" |
| FR9 | 14 / C | Tapping "Hacer este look mío" navigates to Ficha Wada without persisting |
| FR10 | 14 / C | Visualizer no longer shareable externally (S4 polaroid remains shareable) |
| FR11 | 14 / D | Favorites tab renamed "Mis Looks" + icon swap |
| FR12 | 14 / D | Auto-save to Mis Looks on first garment assignment |
| FR13 | 14 / D | Explicit "Guardar para luego" save without assigned garments |
| FR14 | 14 / D | Entering Ficha Wada without action consumes zero slots |
| FR15 | 14 / D | "+ Nuevo look" CTA inside Mis Looks navigating to palette catalog |
| FR16 | 14 / E | Incomplete looks surfaced prominently on Home or top of Mis Looks |
| FR17 | 14 / A | v1.3.0 → v1.4.0 data migration with zero data loss |
| FR18 | 14 / F | Delete garment discoverability (mechanism TBD by UX design) |

## Epic List

### Epic 14: App Flow Reorganization — Making the Armario Virtual Discoverable

**Epic Goal:** Reorganize the app's activation and retention loops so the Armario Virtual (built in Epic 13) becomes the natural destination of the first-use journey, and the two redundant cameras become one coherent "magic moment". This epic is a **launch blocker** for v1.4.0 App Store submission — Epic 13 is technically complete (commit `eae624e`) but cannot ship without this reorganization because user testing (n=5–6) confirms the current flow hides 80% of the app behind a heart icon and a generic-silhouette Visualizer cul-de-sac.

**User Outcome:** A new user downloads v1.4.0, opens the app, taps the camera FAB, scans a real garment, sees it cut-out and matched to a Sanzo Wada tone, optionally saves it to the armario with a category tag, and — via a renamed "Mis Looks" tab surfacing incomplete looks — has a clear reason to return the next day. The "Juan" color-first use case (browsing palettes without camera) is also supported via a "Guardar para luego" bookmark path. Existing v1.3.0 users upgrade without data loss.

**Success Criteria:**
- First-use journey to Armario + 1 look started in ≤2 min.
- v1.3.0 → v1.4.0 upgrade preserves all Favorites with zero data loss.
- S4 polaroid sharing works unchanged after Epic 14.
- On-device QA on iPhone 16 Pro passes.
- Both entry doors (Photo-first + Color-first) produce testable, coherent journeys.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18 (all 18).

**NFRs applied:** NFR1–NFR9 (all; accessibility, iPhone-only, upgrade safety, zero regressions, QA gate, tsc/lint/test gates, performance, analytics-free, haptics contract).

**UX Design Requirements handed to Sally:** UX-DR1–UX-DR6 (all six).

**Internal thematic decomposition (for story planning in Step 3):**
- **A. Data model foundation** — tagging schema + v1.3.0 migration. Prerequisite for all other themes.
- **B. Unified camera flow** — single camera, pipeline, result screen, CTAs, paywall. Depends on A.
- **C. Visualizer as bridge** — CTA + share removal + navigation into Ficha Wada. Depends on D (Ficha Wada working mode).
- **D. Mis Looks (rename + semantics)** — tab rename, auto-save derived from usage, explicit "Guardar para luego", new-look entry point. Depends on A.
- **E. Retention surface** — incomplete-looks surfacing. Depends on D.
- **F. Delete discoverability** — new affordance in S3 picker. Independent.

**Out of scope (deferred to v1.5.0+):** reverse outfit generator, push notifications, S3 filter pills, iCloud backup, free digitizing FAB, wardrobe analytics, Wada color correction selector, explicit onboarding tour.

---

## Epic 14 — Stories

> **Updated 2026-04-21 post-tech-review.** Story 14.3 is split into 14.3a + 14.3b. Story 14.12 is split into 14.12a + 14.12b. Total story count: **15** (was 13).

**Recommended dev order:** 14.1 → 14.2 (includes Finding 3/TD-3 store unification) → 14.3a (nav setup + legacy deprecation) → 14.3b (pipeline + Swift module change) → 14.7 → 14.4 → 14.5 → (14.8, 14.9, 14.10, 14.11 in any order) → 14.6 → 14.12a (delete) → 14.12b (edit category) → 14.13.

Stories annotated with `[UX]` require `bmad-create-ux-design` with Sally before dev. Stories annotated with `[DEP: 14.X]` depend on an earlier story being merged. Stories annotated with `[TD-N]` must honour the named Technical Decision from the block at the top of this doc.

---

### Story 14.1: Extend `WardrobeItem` with `category` field

**As a** developer implementing wardrobe tagging,
**I want** the `WardrobeItem` data model, `wardrobeRepo`, and Zustand store to include a required `category` field,
**So that** the unified camera save flow can persist per-garment categorization and v1.5.0 can later unlock filtering without a data migration.

**Covers:** FR7.

**Acceptance Criteria:**

**Given** a new wardrobe item is created
**When** `wardrobeRepo.addItem` is called with a `category` value of `"top" | "bottom" | "footwear" | "accessory"`
**Then** the item is persisted to `@wardrobe:items` with the `category` field present
**And** the item round-trips correctly through hydration.

**Given** a wardrobe item was created before the migration (edge: internal/TestFlight Epic 13 beta builds)
**When** the store hydrates on app start
**Then** any legacy item without `category` receives the pragmatic default `"top"` per **TD-7**
**And** no data is lost
**And** the user can later correct via Story 14.12b edit-category affordance.

**Given** a caller attempts `addItem` without providing `category`
**When** TypeScript compiles
**Then** the call fails compilation (`category` is required at the type level).

**Given** the category field is persisted
**When** downstream consumers (S3 picker, Ficha Wada) read items
**Then** they can read `category` without breaking existing layout.

**Tasks (≤5):**
1. Extend `WardrobeItem` type with `category: "top" | "bottom" | "footwear" | "accessory"` field (required, no union with `undefined`); update `wardrobeTypes.ts`.
2. Update `wardrobeRepo.addItem` signature + persistence; implement legacy-item default = `"top"` per TD-7.
3. Update Zustand store selectors; ensure hydration tolerates missing field and applies default.
4. Unit tests for persistence + legacy default + type-level enforcement.
5. Documentation comment in `wardrobeTypes.ts` citing TD-7 rationale.

**Dependencies:** none (foundational).
**Technical notes:** Implements **TD-7**. Blocks stories 14.2, 14.5, 14.12b.

---

### Story 14.2: Favorites v1.3.0 → Mis Looks store unification + data migration

**As a** user upgrading from v1.3.0 to v1.4.0,
**I want** all my existing Favorites to appear inside the new "Mis Looks" tab without any manual action, AND to have the underlying data layer unified so that future features (auto-save on assignment, retention surface) work coherently,
**So that** I don't lose the palettes I had already saved and the app has a single source of truth for my wardrobe + looks.

**Covers:** FR17. Implements **TD-3** (store unification per ADR-005) and **TD-5** (migration idempotency pattern).

**Acceptance Criteria:**

**Given** the new `useMisLooksStore` Zustand store is created
**When** the store is inspected
**Then** it owns three slices: `items: WardrobeItem[]`, `assignments: CombinationAssignment[]`, `favorites: Set<string>`
**And** AsyncStorage persistence is wired for all three slices
**And** the prior `useWardrobeStore` is renamed to `useMisLooksStore` (keeping items + assignments behavior) with `favorites` added as a new slice
**And** the prior `FavoritesContext` is deprecated and deleted.

**Given** a v1.3.0 user has N favorites stored under the legacy key `@outfinder/favorites` (where `0 ≤ N ≤ 5`)
**When** the app launches for the first time after upgrading to v1.4.0
**Then** each legacy favorite `combinationId` is migrated to the new `useMisLooksStore.favorites` Set
**And** the count equals N
**And** re-running the migration does not create duplicates (idempotent).

**Given** a v1.3.0 user already at 5/5 favorites
**When** they upgrade to v1.4.0
**Then** they are grandfathered: all 5 favorites remain accessible
**And** the user is not forced to delete any.

**Given** a legacy favorite references a `combinationId` that no longer exists in the Wada dataset
**When** migration runs
**Then** that record is skipped with a single warn log per orphan
**And** the remaining valid records migrate normally.

**Given** a fresh install (no v1.3.0 data present)
**When** the app launches
**Then** the migration executes without error and writes empty collections.

**Given** migration runs atomically with the TD-5 idempotency-flag pattern
**When** inspecting AsyncStorage after a successful run
**Then** the idempotency flag `@outfinder/migration:favorites-to-mis-looks:v1` has value `"complete"`
**And** the legacy key `@outfinder/favorites` has been cleared ONLY after the flag was written
**And** all destination records are visible.

**Given** migration crashes mid-batch or AsyncStorage write fails
**When** the failure is caught
**Then** the legacy source key is NOT cleared
**And** the idempotency flag is NOT written
**And** a warn is logged
**And** on next app launch the migration re-runs from where it left off (source data intact).

**Given** a dev-mode simulation toggle at `__DEV__` Settings screen
**When** the tester taps "Re-run migration"
**Then** the idempotency flag is cleared and migration runs again
**And** the test can verify idempotency end-to-end.

**Tasks (≤5):**
1. Create new `useMisLooksStore` (Zustand, AsyncStorage-persisted) with `items + assignments + favorites` slices; migrate all callers of `useWardrobeStore` + `FavoritesContext` to new store API. Delete `FavoritesContext`.
2. Implement migration fn: read `@outfinder/favorites`, transform to `favorites: Set<string>`, write to new store, drop orphan combinationIds with warn log.
3. Implement TD-5 idempotency pattern: atomic batch write → idempotency flag → only then clear legacy source key. Wire to app bootstrap.
4. Tests: N=0/3/5, orphan skip, corrupt record skip, double-run idempotency, mid-batch crash recovery.
5. Add `__DEV__` dev-menu entry "Re-run migration" to clear the flag for testing.

**Dependencies:** 14.1 (category field must be defined before store schema settles). Story 14.7 (rename UI) depends on this. Stories 14.8, 14.9 (auto-save + guardar para luego) consume the new store API.
**Technical notes:** Implements **TD-3** and **TD-5**. Critical foundational story — every other story touching Mis Looks data depends on the new store API. See `docs/adrs/ADR-005-unified-mis-looks-store.md` for the full architectural record.

---

### Story 14.3a: Unified camera navigation setup + `CaptureScreen` deprecation

**As a** developer preparing the unified camera flow,
**I want** a clean `UnifiedCameraRoot` nested navigator mounted at `RootStackParamList` level, with the legacy `CaptureScreen` removed,
**So that** Story 14.3b can implement the pipeline without colliding with two parallel color-detection camera subsystems.

**Covers:** FR1 (navigation portion). Implements **TD-2** (narrow deprecation — `ArmarioCaptureScreen` is PRESERVED).

**Acceptance Criteria:**

**Given** the new unified camera navigator is created
**When** nav types are inspected
**Then** `RootStackParamList` contains `UnifiedCameraRoot: NavigatorScreenParams<UnifiedCameraStackParamList>` (sibling of `Main` and existing `ArmarioRoot`)
**And** `UnifiedCameraStackParamList` exists with routes `Capture`, `Result`, `PostSave`
**And** the navigator is presented modally over any tab (matching prior `ArmarioRoot` precedent).

**Given** the user taps the Tab Bar central FAB
**When** navigation fires
**Then** the user enters `UnifiedCameraRoot` at the `Capture` screen (placeholder in this story; UI in Story 14.4)
**And** the originating tab state is preserved (swipe-down returns to the same tab).

**Given** the legacy `CaptureScreen` exists in the repo
**When** this story merges
**Then** `CaptureScreen` is deleted from `ColorsStackParamList`, its file removed, its co-located tests deleted
**And** all consumers of `navigation.push("CaptureScreen")` in the Colors stack are removed or rewired
**And** `grep "CaptureScreen"` only returns references in artefact docs / git history, not live imports
**And** `tsc` / `lint` / `test` pass green.

**Given** `ArmarioCaptureScreen` + `ArmarioPreview` + `ArmarioRoot` + `ArmarioStackParamList` exist from Epic 13
**When** this story merges
**Then** ALL of them are PRESERVED and continue to function for in-Ficha-Wada slot assignment (cutout-only pipeline)
**And** no changes are made to their route types, navigation, or behavior.

**Given** the new FAB routing is live
**When** VoiceOver is enabled and the user focuses the FAB
**Then** the announced label is *"Cámara — captura una prenda"* (ES) / *"Camera — capture a garment"* (EN) with `accessibilityRole="button"`.

**Tasks (≤5):**
1. Create `UnifiedCameraStackParamList` + `UnifiedCameraRoot` in `RootStackParamList`. Wire modal nav presentation.
2. Rewire Tab Bar FAB → `UnifiedCameraRoot`.
3. Delete `CaptureScreen` (file + type entry + imports + co-located tests). Confirm `ArmarioCaptureScreen` is untouched.
4. Scrub Colors-stack consumers + test mocks; `tsc` / `lint` / `test` green.
5. Manual smoke test: FAB opens placeholder `Capture` screen; swipe-down returns to prior tab; verify `ArmarioCaptureScreen` still reachable from Ficha Wada slot picker.

**Dependencies:** none (pure navigation refactor). Story 14.3b depends on this.
**Technical notes:** Implements **TD-2**. `ArmarioCaptureScreen` is DELIBERATELY preserved — do not mass-delete armario-camera references. Keep the commit focused on rename+delete of `CaptureScreen` only, no new logic.

---

### Story 14.3b: Unified camera pipeline + Swift module signature change

**As a** user tapping capture on the unified camera,
**I want** the pipeline to remove background, detect the dominant color of my garment accurately (no transparency trap), and match it against Wada's palette, landing me on the Result screen,
**So that** the detected tone reflects my actual garment color in all lighting conditions.

**Covers:** FR2. Implements **TD-1**.

**Acceptance Criteria:**

**Given** `modules/background-removal` Swift module
**When** its TypeScript interface is inspected
**Then** `removeBackground(inputUri)` returns `Promise<{ cutoutUri: string; dominantHex: string }>`
**And** the Swift implementation computes the weighted RGB average of pixels with `alpha > 0.5` threshold in the same pass as Vision segmentation
**And** the hex is returned in `#RRGGBB` format.

**Given** the updated pipeline in `src/lib/armario/saveCutoutAsWardrobeItem.ts` and the new unified camera `Capture` screen
**When** the user takes a photo
**Then** the pipeline runs: `takePictureAsync` → `removeBackground` → receives `{ cutoutUri, dominantHex }` → `hexToLab(dominantHex)` → `matchWadaColor(lab)` → `classifyMatch(matches)`
**And** `react-native-image-colors` is NO LONGER called on the cutout.

**Given** `ArmarioCaptureScreen` (preserved, Epic 13) uses a different cutout-only flow that does NOT need dominant color
**When** that screen is invoked
**Then** it continues calling `removeBackground` as before
**And** (Swift module back-compat) the new signature still returns `cutoutUri` — the `dominantHex` extra field is simply ignored by Epic-13 consumers.

**Given** Vision segmentation fails (`visionFailed` / `noSubject` / `ioFailed`)
**When** the error bubbles
**Then** the UI shows a recoverable error state with copy *"No pudimos procesar la foto. Inténtalo de nuevo."* and a "Reintentar" button returning to Capture
**And** no partial record is created.

**Given** the pipeline completes successfully
**When** navigation advances
**Then** the user lands on the `Result` screen (placeholder UI here; full UI in Story 14.4) with `{ cutoutUri, dominantHex, wadaMatch }` as route params.

**Given** the Jest mock for `background-removal` at `__mocks__`
**When** tests run
**Then** the mock returns the new `{ cutoutUri, dominantHex }` shape
**And** both Epic-14 consumers (Unified Camera) and Epic-13 consumers (ArmarioCapture) pass their existing tests.

**Tasks (≤5):**
1. Modify Swift `BackgroundRemovalModule.swift` to compute weighted RGB average and return `NSDictionary` with both fields; preserve back-compat (Epic 13 consumers ignore the extra field).
2. Update `modules/background-removal/src/index.ts` TypeScript interface.
3. Update `src/lib/armario/saveCutoutAsWardrobeItem.ts` + new unified camera `Capture` screen to consume `{ cutoutUri, dominantHex }`; delete JS-side `getColors` call on cutout.
4. Update Jest mock and all consumer tests (Epic 13 + Epic 14).
5. On-device smoke test on iPhone 14+ to verify `dominantHex` accuracy on transparent/pale/dark garments; capture screenshots.

**Dependencies:** 14.3a (navigation shell must exist). Story 14.4 depends on this.
**Technical notes:** Implements **TD-1**. Swift module change requires full `expo run:ios` rebuild, not Metro reload — see memory `feedback_native_module_rebuild.md`. Warn Alejandro before installing. Back-compat with Epic 13 `ArmarioCaptureScreen` is a hard requirement.

---

### Story 14.4: Camera result screen UI — cutout + Wada tone + combinations preview + two CTAs

**As a** user who just photographed a garment,
**I want** to see the clean cutout, the detected Wada tone, a preview of combinations containing it, and two clear choices ("Guardar en mi armario" or "Ver combinaciones y seguir sin guardar"),
**So that** I understand what the app detected, can decide whether this garment is mine, and move forward without friction.

**Covers:** FR3, FR4.

**`[UX]` Prerequisite:** UX-DR1 design output approved — see `designs/Epic14.pen` for pixel-level frames. Cutout height: 220pt (frame `6nPEq`). Tint rule: dark text when Wada luminance > 0.40 (frame `EZ4EA`). Tone correction conditional state: frame `KY9jv`.

**Acceptance Criteria:**

**Given** the unified camera pipeline succeeds (Story 14.3)
**When** the result screen mounts
**Then** the cutout is rendered at a prominent size
**And** the detected Wada tone name (e.g., "Carmín") is shown prominently with its English name and reference if UX demands it
**And** a preview of Wada combinations containing this tone is visible (scrollable if needed).

**Given** the result screen is visible
**When** the user inspects the primary CTAs
**Then** exactly two primary CTAs are visible: "Guardar en mi armario" and "Ver combinaciones y seguir sin guardar"
**And** both are ≥44pt touch targets with correct `accessibilityLabel`, `accessibilityRole="button"`, and `testID`.

**Given** the user taps "Ver combinaciones y seguir sin guardar"
**When** the action fires
**Then** the user is navigated to the existing combinations view for the detected tone
**And** no wardrobe item is persisted
**And** no slot is consumed.

**Given** the user taps "Guardar en mi armario"
**When** the action fires
**Then** flow continues to the save sub-flow implemented in Story 14.5 (category selector + paywall + persist).

**Given** `matchWadaColor` returns ΔE < 8 between the top-2 Wada candidates (ambiguous detection)
**When** the result screen mounts
**Then** a tone correction section appears below the combinations count with both candidate swatches side-by-side and a *"¿Es éste el tono correcto?"* prompt
**And** the user taps one candidate to confirm; the confirmed tone updates the combinations preview
**And** when ΔE ≥ 8 (clear match), this section is hidden entirely.

**Tasks (≤5):**
1. Build result screen component per UX-DR1 (cutout, tone label, combinations preview, conditional tone-correction section per frame `KY9jv` in `designs/Epic14.pen`).
2. Wire "Ver combinaciones y seguir sin guardar" navigation to existing combinations view.
3. Wire "Guardar en mi armario" as hand-off to Story 14.5.
4. Accessibility: labels, roles, hit targets, Reduce Motion guard.
5. Snapshot + interaction tests co-located.

**Dependencies:** 14.3b (pipeline delivers data). UX-DR1 must be approved first.
**Technical notes:** Consumes `{ cutoutUri, dominantHex, wadaMatch }` from Story 14.3b per **TD-1**. No `getColors` JS call on cutout.

---

### Story 14.5: Camera save flow with category selector + paywall gate

**As a** user who decided to save a scanned garment,
**I want** to pick a category (Top / Bottom / Footwear / Accessory) and have my garment persist to the armario (or be shown the paywall if I'm at the free limit),
**So that** my armario is organised from day one and the paywall fires on an action I actually committed to.

**Covers:** FR5, FR6.

**`[UX]` Prerequisite:** UX-DR1 design output includes the category selector treatment.

**Acceptance Criteria:**

**Given** the user tapped "Guardar en mi armario"
**When** the save flow begins
**Then** the category selector is presented with exactly four options: Parte de arriba, Parte de abajo, Calzado, Accesorio
**And** the user cannot complete the save without selecting exactly one.

**Given** the user selected a category
**When** they confirm the save
**Then** `wardrobeRepo.addItem` is called with `{ localImagePath, thumbnailPath, category, createdAt: Date.now() }`
**And** the item appears in the store
**And** the user is navigated to the next step (which may be the combinations view for the detected tone — decision to ratify during dev, but must be documented).

**Given** the user is on the free tier AND the armario already holds 10 items
**When** the save attempt runs
**Then** `saveCutoutAsWardrobeItem` throws its existing `paywall` error BEFORE any I/O
**And** the `WardrobeLimitExceeded` paywall sheet is shown (reusing the existing component)
**And** no item is persisted and no category is used up.

**Given** a premium user
**When** they save beyond 10 items
**Then** the save succeeds normally (no paywall trip).

**Tasks (≤5):**
1. Build category selector UI per UX-DR1 (modal / inline depending on design).
2. Wire `saveCutoutAsWardrobeItem` invocation with selected category.
3. Paywall branch integration (reuse existing sheet).
4. Haptics + VoiceOver announcement on success.
5. Tests covering: success path, paywall trip, premium bypass, required-category enforcement.

**Dependencies:** 14.1 (category field), 14.4 (result screen triggers this flow). UX-DR1 must be approved.
**Technical notes:** Category selector sheet component built here must be reusable from Story 14.12b (edit-category) — see **TD-6**. Export as a standalone component from day one (e.g. `src/components/armario/CategoryPickerSheet.tsx`) with a clear props interface so 14.12b can consume it without refactor.

---

### Story 14.6: Visualizer bridge CTA swap + share removal

**As a** user exploring a Wada combination in the Outfit Visualizer,
**I want** the primary action to be "Hacer este look mío" (which takes me into Ficha Wada in working mode) instead of a generic share action,
**So that** the Visualizer stops being a dead end and starts feeling like the doorway to my actual wardrobe.

**Covers:** FR8, FR9, FR10.

**`[UX]` Prerequisite:** UX-DR6 design output approved (new CTA treatment; disposition of prior share action).

**Acceptance Criteria:**

**Given** a user is viewing a Wada combination on the Outfit Visualizer
**When** they look at the primary action bar
**Then** the primary CTA reads "Hacer este look mío"
**And** no external-share (system share sheet) action is exposed from the Visualizer
**And** accessibility attributes are present on the new CTA.

**Given** the user taps "Hacer este look mío"
**When** the action fires
**Then** the user is navigated to Ficha Wada in working mode for that combination
**And** NO entry is persisted to Mis Looks yet
**And** no slot is consumed (that behaviour is enforced in Story 14.8/14.9).

**Given** the user reaches Ficha Wada and exits without assigning a garment or tapping "Guardar para luego"
**When** they navigate back
**Then** no Mis Looks entry exists.

**Given** the S4 polaroid share screen is reached after a completed look
**When** the user taps share
**Then** sharing still works exactly as today (no regression).

**Tasks (≤5):**
1. Replace "Compartir Outfit" button with "Hacer este look mío" per UX-DR6.
2. Remove Visualizer external-share invocation paths + clean up unused imports.
3. Wire navigation to Ficha Wada working-mode entry (pass palette id + detected tone if applicable).
4. Regression check for S4 share (manual + test).
5. Accessibility + Reduce Motion compliance.

**Dependencies:** UX-DR6 approved.

---

### Story 14.7: Mis Looks tab — rename + icon swap

**As a** user,
**I want** the Favorites tab to be re-labelled "Mis Looks" with a wardrobe/hanger icon instead of a heart,
**So that** I understand the tab is my workspace, not a bookmark list.

**Covers:** FR11.

**Acceptance Criteria:**

**Given** the user opens v1.4.0
**When** they look at the Tab Bar
**Then** the label reads "Mis Looks"
**And** the icon is a wardrobe/hanger glyph (exact asset per UX-DR4; placeholder acceptable if UX-DR4 not yet final, must be swapped before QA)
**And** the internal screen title also reads "Mis Looks".

**Given** existing navigation routes, deeplinks, and tests referencing the prior tab
**When** this story merges
**Then** all references are updated
**And** no dead imports / dead references remain.

**Given** VoiceOver is enabled
**When** the user focuses the tab
**Then** the announced label is "Mis Looks" (in the active locale — EN/ES).

**Tasks (≤5):**
1. Update Tab Bar label + accessibility label in EN + ES locales.
2. Swap icon asset (placeholder ok if final asset pending UX-DR4).
3. Update screen title + any internal headers referring to "Favoritos".
4. Update tests/snapshots referencing the old name.
5. Verify no downstream regressions (route names, deeplinks, analytics-free logs).

**Dependencies:** 14.2 (data migration must succeed so existing favorites show up under the new name). UX-DR4 preferred but not strictly blocking.

---

### Story 14.8: Auto-save look to Mis Looks on first garment assignment

**As a** user assigning my first garment to a colour slot in Ficha Wada,
**I want** that look to automatically land in Mis Looks,
**So that** my workspace reflects what I'm actually working on without me having to remember to "save" it.

**Covers:** FR12, FR14.

**Acceptance Criteria:**

**Given** a user is in Ficha Wada working mode with no Mis Looks entry for this combination yet
**When** they assign their first garment to any colour slot
**Then** a new Mis Looks entry is created consuming 1/5 slots (if free user)
**And** the entry's status reflects `X/N prendas asignadas` where X = 1 and N = total slots for the combination.

**Given** a free user is already at 5/5 Mis Looks
**When** they try to assign a garment that would create a 6th entry
**Then** the Favorites paywall sheet is shown
**And** no assignment is persisted until the user resolves the paywall (upgrade or remove a look).

**Given** the free user dismisses the paywall without upgrading (paywall-limbo per TD-4)
**When** they return to the Ficha Wada
**Then** NO Mis Looks entry is persisted
**And** NO assignment is persisted
**And** assignment affordances (slot CTAs) render in disabled visual state (opacity 40%, no border emphasis)
**And** tapping a disabled slot re-triggers the paywall
**And** a discrete explanatory strip appears at the top of the screen with copy *"Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."*
**And** swipe-back navigation works normally and returns to Visualizer.

**Given** the user upgrades via the paywall and returns to the Ficha Wada
**When** the upgraded state is detected
**Then** the disabled state is cleared and assignment proceeds normally.

**Given** the user goes to Mis Looks, deletes an entry to free a slot, and returns to the Ficha Wada
**When** the store state changes
**Then** the disabled state is cleared and assignment proceeds normally.

**Given** a user enters Ficha Wada and exits without assigning anything and without tapping "Guardar para luego"
**When** they navigate back
**Then** zero Mis Looks entries are created for this session.

**Given** a user assigns a second garment to the same look
**When** the assignment persists
**Then** the existing Mis Looks entry updates to status `2/N`
**And** no new entry is created (idempotency per combination).

**Tasks (≤5):**
1. Detect "first garment assignment" state in Ficha Wada.
2. Create-or-update Mis Looks entry on assignment with correct slot-counting semantics.
3. Favorites paywall gate on creation.
4. Tests covering: fresh look save, paywall trip, idempotent second-assignment, exit-without-assignment.
5. Accessibility announcement when look enters Mis Looks (VoiceOver hint).

**Dependencies:** 14.2 (storage shape settled; unified `useMisLooksStore` created).
**Technical notes:** Implements **TD-3** (assign is the primary auto-save trigger into the unified store's `favorites` slice) + **TD-4** (paywall-limbo disabled state). Cannot start dev before Story 14.2 is merged — the assign orchestration depends on the new store API.

---

### Story 14.9: "Guardar para luego" explicit bookmark in Ficha Wada

**As a** user browsing a Wada combination at night without my clothes in reach (the "Juan" use case),
**I want** an explicit "Guardar para luego" button inside Ficha Wada,
**So that** I can bookmark the look without having to assign a garment, and find it waiting for me tomorrow.

**Covers:** FR13.

**`[UX]` Prerequisite:** UX-DR2 design output approved.

**Acceptance Criteria:**

**Given** a user is in Ficha Wada working mode with zero garments assigned
**When** they tap "Guardar para luego"
**Then** a Mis Looks entry is created with status `0/N prendas asignadas`
**And** 1/5 Mis Looks slot is consumed (free user)
**And** the entry is visible when the user opens the Mis Looks tab.

**Given** a free user is already at 5/5 Mis Looks
**When** they tap "Guardar para luego"
**Then** the paywall sheet is shown and no entry is created.

**Given** the free user dismisses the paywall without upgrading (paywall-limbo per TD-4)
**When** they return to the Ficha Wada
**Then** the "Guardar para luego" button renders in disabled visual state (opacity 40%)
**And** tapping it re-triggers the paywall
**And** the same explanatory strip from Story 14.8 AC appears at the top: *"Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."*
**And** swipe-back navigation works normally.

**Given** a user has already created an auto-save entry for this combination (Story 14.8) and taps "Guardar para luego"
**When** the action fires
**Then** the existing entry is preserved (no duplicate)
**And** a clear but unobtrusive UI feedback confirms "already in Mis Looks".

**Given** VoiceOver is enabled
**When** the user navigates to the button
**Then** the label explains the action ("Guardar este look para trabajar más tarde").

**Tasks (≤5):**
1. Add "Guardar para luego" button per UX-DR2 (placement, visual treatment).
2. Wire creation path (zero-garment Mis Looks entry).
3. Duplicate detection for existing entries on same combination.
4. Paywall gate.
5. Tests + VoiceOver label.

**Dependencies:** 14.2, 14.8 (slot semantics consistent). UX-DR2 approved.
**Technical notes:** Implements **TD-4** (paywall-limbo disabled state mirror of Story 14.8). Reuses the explanatory strip component built in 14.8 — do NOT duplicate it.

---

### Story 14.10: "+ Nuevo look" entry point in Mis Looks

**As a** returning user whose armario is populated and who doesn't want to photograph a new garment,
**I want** a "+ Nuevo look" action inside the Mis Looks tab that takes me to the Wada palette catalog,
**So that** I can start a fresh look without going through the camera flow.

**Covers:** FR15.

**`[UX]` Prerequisite:** UX-DR4 design output approved (placement + visual treatment).

**Acceptance Criteria:**

**Given** the user is on the Mis Looks tab
**When** they look at the screen
**Then** a "+ Nuevo look" affordance is visible per UX-DR4 (FAB / top card / list item — one of these)
**And** it has correct accessibility attributes + ≥44pt touch target.

**Given** the user taps "+ Nuevo look"
**When** the action fires
**Then** the user is navigated to the Wada palette catalog / Home in exploration mode
**And** no Mis Looks entry is created by the mere act of navigating.

**Given** the Mis Looks tab is empty (zero entries)
**When** the screen renders
**Then** the "+ Nuevo look" affordance is still visible and prominent
**And** the empty state does NOT hide this entry point.

**Tasks (≤5):**
1. Implement "+ Nuevo look" component per UX-DR4.
2. Wire navigation to Wada palette catalog.
3. Empty-state integration (entry point must remain visible).
4. Accessibility + haptic.
5. Tests covering empty state + populated state.

**Dependencies:** UX-DR4 approved.

---

### Story 14.11: Incomplete-looks retention surface

**As a** user who started a look yesterday and didn't complete it,
**I want** to see my incomplete looks prominently on Home (or at the top of Mis Looks — per UX decision),
**So that** I have a clear reason to come back tomorrow and complete them.

**Covers:** FR16.

**`[UX]` Prerequisite:** UX-DR5 design output approved (exact placement: Home vs. top of Mis Looks vs. both).

**Acceptance Criteria:**

**Given** the user has ≥1 Mis Looks entry with `X/N prendas asignadas` where `X < N`
**When** they open the app
**Then** the incomplete look(s) are surfaced on the designated screen per UX-DR5
**And** the S5-style badge shows the progress ratio `X/N`.

**Given** an incomplete look is surfaced
**When** the user taps it
**Then** the user is navigated directly to Ficha Wada working mode for that combination.

**Given** a look becomes complete (`X == N`)
**When** the screen re-renders
**Then** the incomplete-surface section no longer shows that look
**And** the look remains accessible via the main Mis Looks list.

**Given** no incomplete looks exist
**When** the screen renders
**Then** the incomplete-surface section is gracefully hidden (no empty slot, no placeholder).

**Tasks (≤5):**
1. Add "incomplete looks" selector / view model backed by existing store + S5 badge logic.
2. Surface component per UX-DR5.
3. Navigation integration to Ficha Wada.
4. Tests covering: no-incomplete, 1-incomplete, many-incomplete, transition to complete.
5. Accessibility: section header + button semantics.

**Dependencies:** 14.8, 14.9 (there must be Mis Looks entries with partial status to surface). UX-DR5 approved.

---

### Story 14.12a: Delete garment discoverable affordance (edit mode)

**As a** new user who has just saved a few garments to my armario,
**I want** an obvious way to delete a garment I don't want,
**So that** I don't have to guess that a long-press gesture exists.

**Covers:** FR18 (delete portion).

**`[UX]` Prerequisite:** UX-DR3 design output approved (edit-mode with clean `(−)` icon, no wiggle).

**Acceptance Criteria:**

**Given** the user long-presses any thumbnail on the S3 picker
**When** the gesture completes
**Then** edit mode activates with `hapticMedium` feedback
**And** the nav bar morphs to "Cancelar / Editar armario / Listo"
**And** a clean `(−)` icon appears in the top-left corner of every thumbnail.

**Given** the user is in edit mode
**When** they tap a `(−)` icon
**Then** `hapticRigid` fires
**And** a confirmation sheet opens with copy per the UX spec
**And** confirming runs `cascadeDeleteAssignmentsForItem` followed by `removeItem`
**And** the UI updates immediately.

**Given** the user taps "Cancelar" or "Listo" in the edit-mode nav bar
**When** the action fires
**Then** edit mode exits
**And** all `(−)` icons disappear with a fade (no animation if Reduce Motion enabled).

**Given** an existing user familiar with v1.3.0 long-press-on-single-thumbnail (pre-edit-mode single-delete flow)
**When** they long-press in normal mode
**Then** the legacy single-item confirmation bottom sheet continues to work (backwards compat).

**Given** VoiceOver is enabled
**When** the user navigates edit mode
**Then** the announced state on activation is *"Modo edición activado. Toca el botón eliminar de una prenda para borrarla."*
**And** each `(−)` has `accessibilityLabel="Eliminar ${garmentCategory}"`.

**Tasks (≤5):**
1. Implement edit mode entry via long-press; morph nav bar; fade in `(−)` icons with Reduce Motion guard.
2. Implement delete confirmation sheet + wire `cascadeDeleteAssignmentsForItem` + `removeItem`.
3. Preserve v1.3.0 long-press single-delete path (backwards compat).
4. Accessibility labels + VoiceOver announcements.
5. Tests covering: enter edit mode, delete flow, exit via Listo/Cancelar, legacy single-item path, VoiceOver.

**Dependencies:** UX-DR3 approved.
**Technical notes:** Implements FR18 (delete portion). The pencil icon for edit-category (Story 14.12b) is added to the SAME edit-mode UI — coordinate sizing/placement with 14.12b dev so both icons fit top corners cleanly (`(−)` top-left, pencil top-right).

---

### Story 14.12b: Edit category affordance (edit mode)

**As a** user who accidentally saved a garment with the wrong category (or inherited a legacy item defaulted to "top" via TD-7),
**I want** an edit-category affordance inside the same edit mode that hosts the delete button,
**So that** I can fix mistakes without having to delete and re-photograph the garment.

**Covers:** FR18 (edit-category addition). Implements **TD-6**.

**`[UX]` Prerequisite:** UX-DR3 design output must include the pencil icon placement + treatment (top-right corner of each thumbnail, clean style matching the `(−)` aesthetic). Pencil validated in the same Pencil session that tunes the `(−)`.

**Acceptance Criteria:**

**Given** the user is in edit mode (entered per Story 14.12a)
**When** they inspect any thumbnail
**Then** a clean pencil icon is visible in the top-right corner of each thumbnail
**And** the icon has ≥44pt hit area and correct a11y attributes.

**Given** the user taps the pencil icon on a thumbnail
**When** the tap registers
**Then** `hapticLight` fires
**And** the category sheet component from Story 14.5 is presented (reused, not duplicated)
**And** the currently-assigned category is pre-selected in the sheet.

**Given** the sheet is open and user picks a new category
**When** they confirm
**Then** `hapticMedium` fires
**And** the `WardrobeItem.category` field is updated via `useMisLooksStore`
**And** the sheet dismisses
**And** the user remains in edit mode (not auto-exited).

**Given** the user dismisses the sheet without picking (swipe-down or tap outside)
**When** the sheet closes
**Then** NO change is persisted to the item
**And** the user remains in edit mode.

**Given** VoiceOver is enabled
**When** the user navigates to a pencil icon
**Then** the announced label is *"Editar categoría de ${garmentCategory}"* with `accessibilityHint="Abre el selector de categoría para cambiar el tipo de prenda"`.

**Tasks (≤5):**
1. Add pencil icon to each thumbnail in edit mode (top-right corner); coordinate with 14.12a for dual-icon layout.
2. Wire pencil tap → open reused `CategoryPickerSheet` component (exported from Story 14.5) with current category pre-selected.
3. Implement category update via `useMisLooksStore.updateItemCategory(id, newCategory)` — add this action to the store API.
4. Accessibility labels + VoiceOver announcements; pencil hit area ≥44pt.
5. Tests: open sheet, change category, persist change, cancel without change, VoiceOver.

**Dependencies:** 14.5 (`CategoryPickerSheet` must exist as a reusable component), 14.12a (edit mode infrastructure). UX-DR3 approved (pencil icon spec).
**Technical notes:** Implements **TD-6**. `CategoryPickerSheet` reuse is non-negotiable — do NOT create a second sheet variant. If the 14.5 component lacks a `currentCategory` prop for pre-selection, add it there (small API tweak) rather than forking the component.

---

### Story 14.13: Epic 14 on-device QA + happy paths verification

**As the** product owner (Alejandro),
**I want** a dedicated QA story that validates all Epic 14 changes on real hardware (iPhone 16 Pro) against a checklist covering the two entry doors, the migration path, and the no-regression surface,
**So that** we don't submit to App Store with a broken happy path or a migration bug that silently loses user data.

**Covers:** NFR3, NFR4, NFR5, NFR7, Success Criteria.

**Acceptance Criteria:**

**Given** a fresh install of v1.4.0 on iPhone 16 Pro
**When** the tester follows the "Photo-first new user" happy path (open → FAB → scan → save with category → see combinations → "Hacer este look mío" → assign prenda → Mis Looks auto-save)
**Then** all steps complete in ≤2 minutes
**And** no crashes, no dropped states, no missing haptics, no VoiceOver regressions.

**Given** a fresh install of v1.4.0 on iPhone 16 Pro
**When** the tester follows the "Color-first Juan" happy path (open → Home/catalog → pick color → Visualizer → "Hacer este look mío" → "Guardar para luego" → close app → reopen → see incomplete look on Home → complete it)
**Then** all steps complete without error
**And** the look is correctly persisted across app restarts.

**Given** a device running v1.3.0 with N favorites (0, 3, 5)
**When** the user upgrades to v1.4.0
**Then** all N favorites appear under Mis Looks
**And** no data is lost, no crash occurs, no user action is required.

**Given** the full Epic 14 changeset is merged
**When** `npx tsc --noEmit`, `pnpm lint`, `pnpm test` run in CI
**Then** all pass green
**And** the S4 polaroid share screen works unchanged on a completed look.

**Tasks (≤5):**
1. Produce on-device QA checklist covering:
   - **Epic 13 functionality (first release to production)**: cutout pipeline for slot-assignment from Ficha Wada, `ArmarioCaptureScreen` preserved per TD-2, `cascadeDeleteAssignmentsForItem` works, wardrobe paywall at 10 items.
   - **Epic 14 golden paths**: photo-first new-user journey (open → FAB → unified camera → scan → save with category → see combinations → "Hacer este look mío" → assign prenda → Mis Looks auto-save); color-first "Juan" journey (home → palette → Visualizer → "Hacer este look mío" → Ficha Wada empty state → "Guardar para luego" → close → reopen → see incomplete in retention surface → complete).
   - **v1.3.0 → v1.4.0 upgrade (production blocker)**: ONLY test variable is `N` favorites in v1.3.0 where `N ∈ {0, 3, 5}`. Verify: all N favorites appear under Mis Looks post-upgrade, zero data loss, orphan combinationId dropped with warn log, idempotency flag written, legacy `@outfinder/favorites` key cleared only after flag write, re-running migration is idempotent. **NO wardrobe-items-legacy scenario exists in production — do not invent one.**
   - **TD verification**: TD-1 (`dominantHex` accuracy on transparent/pale/dark garments), TD-2 (`ArmarioCaptureScreen` still reachable from Ficha Wada slot picker), TD-3 (unified store works post-migration), TD-4 (paywall-limbo disabled state + explanatory strip + swipe-back works), TD-5 (idempotency + crash recovery via dev-menu re-run), TD-6 (pencil icon edit-category flow persists + VoiceOver).
   - **S4 share regression** (polaroid export still works on completed look).
   - **Accessibility audit** (VoiceOver traversal, touch targets, Reduce Motion).
2. Execute checklist on iPhone 16 Pro; capture screenshots / screen recordings for evidence.
3. File bug entries (or follow-up stories) for any issue found.
4. Verify `tsc`, `lint`, `test` suites green.
5. Sign off on v1.4.0 release readiness OR return to dev with specific fixes.

**Dependencies:** all prior stories (14.1 → 14.12b).
**Technical notes:** QA checklist MUST verify all 7 Technical Decisions (TD-1 through TD-7) with explicit test cases. Any TD failure is a hard blocker for App Store submit.

---

## Story Dependency Graph (summary — updated post tech-review)

- **14.1** is foundational (category field); blocks 14.2 + 14.5 + 14.12b.
- **14.2** depends on 14.1; critical (store unification per TD-3); blocks 14.7, 14.8, 14.9 + all others that touch Mis Looks data.
- **14.3a** is independent (navigation shell + CaptureScreen deprecation); blocks 14.3b.
- **14.3b** depends on 14.3a (Swift module change per TD-1); blocks 14.4 + 14.5.
- **14.4** depends on 14.3b + UX-DR1.
- **14.5** depends on 14.1 + 14.4; exports `CategoryPickerSheet` component for 14.12b reuse.
- **14.6** depends only on UX-DR6.
- **14.7** depends on 14.2 (store renamed + migration succeeded).
- **14.8** depends on 14.2 (new store API); implements TD-3 + TD-4.
- **14.9** depends on 14.2 + 14.8 (paywall-limbo shared component); implements TD-4 mirror.
- **14.10** independent beyond UX-DR4.
- **14.11** depends on 14.8 + 14.9 (data to surface).
- **14.12a** independent beyond UX-DR3 (edit-mode + delete).
- **14.12b** depends on 14.5 (`CategoryPickerSheet` reuse) + 14.12a (edit-mode infrastructure); implements TD-6.
- **14.13** depends on all prior stories; QA verifies TD-1 through TD-7.

## UX Design Requirements → Story mapping

- **UX-DR1** → precondition for stories 14.4 + 14.5.
- **UX-DR2** → precondition for story 14.9.
- **UX-DR3** → precondition for stories 14.12a (delete `(−)`) + 14.12b (edit pencil icon — both icons coexist in edit mode, designed together).
- **UX-DR4** → precondition for story 14.10 (and useful for 14.7).
- **UX-DR5** → precondition for story 14.11.
- **UX-DR6** → precondition for story 14.6.

UX-DRs 1–6 covered in `docs/planning/ux-design-epic-14.md` (status `pencil-reviewed-ready-for-dev`). Pencil iteration happened in a separate session — reference `designs/Epic14.pen`. Any Pencil TODOs listed in the UX spec that affect a specific story are called out in that story's Technical notes.


---

## Extraction Summary for Product Owner Review

- **FRs extracted:** 18 — covering unified camera (5), tagging (2), visualizer bridge (3), Mis Looks (4), secondary entry (1), retention (1), migration (1), delete discoverability (1).
- **NFRs extracted:** 9 — accessibility, platform, upgrade safety, regressions, QA gate, type/lint/test gates, performance, analytics abstention, haptics contract.
- **Additional requirements:** 10 — all inherited architectural invariants from Epic 13 and project rules.
- **UX-DRs extracted:** 6 — camera result screen, Ficha Wada "Guardar para luego", delete discoverability, Mis Looks header, incomplete-looks surface, Visualizer CTA.
