---
stepsCompleted: [step-01-document-discovery, step-02-prd-analysis, step-03-epic-coverage-validation, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]
focus: Epic 13 — Armario Virtual
inputDocuments:
  - docs/planning/epic-13-armario-virtual.md
  - docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md
  - docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md
  - docs/project-context.md
  - docs/planning/architecture-react-native-ios.md
status: complete
readiness: ready
blockers: 0
minor: 10
decisions:
  - 2026-04-17 — analytics scoped out per user (craft-driven, see feedback_no_analytics.md). FR18 deleted; §Gating rewritten to product-taste-driven.
  - 2026-04-17 — Story 13.3 split into 13.3a (capture UI) + 13.3b (persistence).
  - 2026-04-17 — Story 13.4 split into 13.4a (S0 + S2 + shared components) + 13.4b (S3 picker + assignment mechanics).
appliedEdits:
  - Epic grows 6 → 8 stories
  - FR17/18 reduced to 17 FRs, Coverage Map updated (17/17)
  - Epic Dependencies graph redrawn
  - All cross-story references renumbered to a/b variants
  - Gating section rewritten (no analytics dependency)
  - Open Questions updated (iPad, premium, escape-hatch added; analytics removed)
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-17
**Project:** Outfinder
**Scope:** Epic 13 — Armario Virtual (post-v1.3.0 candidate, gated on Epic 12 camera-usage analytics)

## Step 1 — Document Discovery

### Canonical documents used for Epic 13 assessment

| Role | Document | Size | Notes |
|------|----------|------|-------|
| Feature UX spec (Epic 13 PRD-incremental) | `docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md` | 19.4 KB | Screens S0–S5, data model, open questions |
| Epic breakdown + ACs | `docs/planning/epic-13-armario-virtual.md` | 54.2 KB | 18 FRs / 14 NFRs / 10 UX-DRs, 6 stories, coverage map |
| Technical research | `docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md` | 42.4 KB | Vision iOS 17+, WebP q=0.9, AsyncStorage split keys, Skia export |
| Project architecture (current) | `docs/project-context.md` | — | Live codebase architecture post-Epic 12, primary architecture source |
| Architecture (foundational) | `docs/planning/architecture-react-native-ios.md` | 53.8 KB | MVP-era architecture doc, superseded where it diverges from project-context.md |
| Mockups | `docs/planning/feature-armario-virtual/screens/*.png` | — | s0–s5 PNG references |

### Historical documents — explicitly excluded

- `docs/planning/prd-react-native-ios.md` (2026-03-12, greenfield MVP PRD) — shipped as v1.0.0. No FR applies to Epic 13.
- `docs/planning/prd.md` (2026-04-04, Epic 11 PRD v1.1) — **Epic 11 is shipped and validated by Apple**. User confirmed it does not belong in Epic 13 readiness.
- `docs/planning/epic-11.md`, `docs/planning/epics.md`, `docs/planning/epics-v2.md`, `docs/planning/epic-5-setup-guide.md` — historical epic docs for already-shipped work.
- `docs/planning/ux-design-specification-ios.md` (2026-03-13) — foundational UX spec for the MVP. Epic 13 has its own self-contained UX spec (`ARMARIO-VIRTUAL.md`). The master doc is not expected to be updated per-epic in this project's workflow.

### PRD gap ruling

Epic 13 has **no dedicated master PRD** — intentional. The project uses a brownfield-extension pattern (same as Epic 12 Color Capture): feature spec + epic breakdown + research doc jointly serve as PRD-incremental. This is consistent with CLAUDE.md and project-context.md conventions. **Not a blocker.**

### Duplicate / conflict resolution

None requiring action. The two PRDs cover different launched versions; neither governs Epic 13.

## Step 2 — PRD Analysis (adapted: epic-as-PRD)

Epic 13 has no dedicated master PRD. The requirements source of truth is `epic-13-armario-virtual.md` (epic breakdown), cross-referenced against `ARMARIO-VIRTUAL.md` (feature UX spec) and the 2026-04-16 technical research. Below is the extracted inventory plus cross-document reconciliation notes.

### Functional Requirements (18)

Canonical numbering from `epic-13-armario-virtual.md` §Requirements Inventory. All 18 are captured there and mapped to stories via the FR Coverage Map.

- FR1 — Assign a personal garment photo to each Wada color slot → 13.4
- FR2 — Capture new photos with in-app camera + guidance → 13.3
- FR3 — Select photos from iOS photo library → 13.3
- FR4 — Automatic background removal → 13.2 + 13.3
- FR5 — Preview + accept/retry cutout → 13.3
- FR6 — Reuse wardrobe item across multiple combos → 13.1 + 13.4
- FR7 — Browse full wardrobe in 3-col grid picker → 13.4
- FR8 — View completed outfit as 3-card polaroid cascade → 13.5
- FR9 — Share polaroid as 1080×1920 via native share sheet → 13.5
- FR10 — S5 partial-state with suggestion for missing color → 13.6
- FR11 — Favorites cards show completeness badge + thumbnails → 13.6
- FR12 — Complete favorites sort to top of list → 13.6
- FR13 — First-time S0 zero-state with pre-visualized S4 → 13.4
- FR14 — Remove assigned garment without deleting wardrobe item → 13.4
- FR15 — Unfavorite cascades assignments; wardrobe persists → 13.1
- FR16 — Feature-gated on iOS ≥17 (hidden, not broken) → 13.4
- FR17 — Share artifact footer `Outfinder · Sanzo Wada, 1933` → 13.5
- FR18 — Share event logged with destination + combo + ts → 13.5

### Non-Functional Requirements (14)

- NFR1 — Background removal < 1.5 s on iPhone 12+ for 3 MB HEIC
- NFR2 — S4 1080×1920 JPEG q=92 render + write < 1 s
- NFR3 — 100 wardrobe items (WebP masters + thumbs) < 50 MB
- NFR4 — All persistence ops handle disk-full / permission-denied gracefully, no orphans
- NFR5 — 44×44 pt min touch targets + a11y labels + roles
- NFR6 — VoiceOver can complete capture→preview→assign with live-region announcements
- NFR7 — Native module runs off JS thread
- NFR8 — Local-only storage; no network, no photo bytes in analytics
- NFR9 — Favorites continues to work unchanged for zero-wardrobe users (100% additive)
- NFR10 — Atomic file lifecycle (file move after DB commit; DB remove before file delete)
- NFR11 — Reduce Motion respected for S4 entry animation
- NFR12 — All new strings localized EN + ES at launch
- NFR13 — All existing tests pass; Epic 12 pipeline unregressed
- NFR14 — Skia S4 export pixel-identical across supported iPhones at same resolution

### UX Design Requirements (10)

UX-DR1–UX-DR10 as defined in §Requirements Inventory — S0–S5 screens, accessibility, localization, suggestion-copy heuristic.

### Additional constraints (from Epic §Additional Requirements)

Brownfield project rules (CLAUDE.md) — reproduced, no new constraints beyond what's already established in project-context.md + CLAUDE.md.

New for Epic 13:
- Local Expo module `modules/background-removal/` (mirrors `modules/white-balance/`), with `podspecPath` in `expo-module.config.json` to avoid Story 12.3 autolinking trap
- New deps: `expo-file-system` (new class-based API), `expo-image-manipulator`, `expo-image-picker`, `zustand`
- AsyncStorage split keys `@wardrobe:items` + `@wardrobe:assignments`
- `@shopify/react-native-skia 2.5.1` (already in repo) as sole render path for S4 + export — `react-native-view-shot` is NOT used for Armario Virtual
- WebP q=0.9 (masters) + q=0.75 (thumbnails), JPEG q=92 (S4 export)
- Vision: `VNGenerateForegroundInstanceMaskRequest` (iOS 17+) exclusively, no fallback
- Storage: `Paths.document + /wardrobe/<uuid>.webp` (master) + `<uuid>-thumb.webp` (thumb, `NSURLIsExcludedFromBackupKey=true`)

### Reconciliation — epic spec vs feature spec vs research

This is where readiness risk hides. Three divergences found:

**1. Share rendering stack — MAJOR, deliberate override (not yet reflected in feature spec)**

- `ARMARIO-VIRTUAL.md` §6.2 says S4 is "composición estática de React Native Views… NO se necesita Skia Canvas", shared via `react-native-view-shot` or `expo-image-manipulator`.
- `epic-13-armario-virtual.md` Story 13.5 and research §Share Artifact Rendering override this: Skia-only rendering with `drawPolaroidStack(canvas, props)` as single source of truth for preview AND offscreen export (`Surface.MakeOffscreen(1080*d, 1920*d)` → `makeNonTextureImage` → JPEG q=92).
- The epic is correct (better rationale, future-proof, single source of truth), but the feature spec is stale.
- **Risk:** a developer reading the feature spec first will see the wrong approach. Mitigation is trivial (the epic is the SoT), but flag for cleanup.

**2. iOS 15/16 fallback — deliberate removal (not yet reflected in feature spec)**

- `ARMARIO-VIRTUAL.md` §6.1 offers `VNGenerateForegroundMaskRequest` as fallback for iOS <17.
- Epic + research reject the fallback explicitly: feature gated on iOS ≥17 (hidden not broken — FR16 / NFR9).
- **Risk:** none (epic wins); but the feature spec says one thing and the epic another. Cleanup needed.

**3. Dependency status — stale info in feature spec**

- `ARMARIO-VIRTUAL.md` §8 dependency table lists `react-native-view-shot: "No — dependencia nueva"`. It's already at `4.0.3` (project-context.md). Not load-bearing, but indicates the feature spec wasn't refreshed against the current codebase.

### Requirements from feature spec §10 not explicitly captured in epic

Success criteria as quality targets (neither FR nor NFR in epic):

- "El usuario puede asignar una prenda en menos de 3 taps desde S1" (UX velocity target). **Gap:** not in the epic. The S0→S2→S3 flow likely meets this but it's not measured.
- "La foto queda correctamente recortada en >85% de casos con fondo liso". **Gap:** not captured as an NFR or as a validation target for Story 13.2 / 13.3 on-device QA (research does say "10 sample photos" but not a pass threshold).
- "El estado del armario persiste entre sesiones" — covered implicitly by Story 13.1 ACs.

### Constraints / assumptions not fully surfaced in the epic

From research §Risks & unknowns, the following mitigations are mentioned but not captured as explicit ACs in a story:

- **Vision fallback copy** for dark-on-dark failures: research suggests "Usar sin recorte" escape hatch "(decide in story spec)". **Gap:** Story 13.3 only includes the `Repetir` path; no escape hatch if the cutout repeatedly fails. Worth a DoD check.
- **Pre-story analytics instrumentation** ("Instrumentation should ship BEFORE starting Epic 13 stories"). The epic's Gating section notes the analytics dependency but no analytics story exists (Story 13.5 talks about a local queue). **Gap:** analytics instrumentation is assumed but not owned.

### PRD Completeness Assessment (for epic-as-PRD)

- ✅ FR/NFR/UX-DR numbering is complete, traceable, mapped to stories
- ✅ Coverage map (18/18, 14/14, 10/10) is explicit — no orphans
- ✅ Brownfield constraints (CLAUDE.md + project-context.md) reproduced
- ⚠️ Feature spec (`ARMARIO-VIRTUAL.md`) not refreshed after research: Skia override + iOS 17 exclusivity + dep status drift
- ⚠️ Two quality targets (3-tap velocity, 85% recorte success) exist in spec §10 but not mirrored in epic
- ⚠️ Research's suggested escape hatch for Vision failure is not captured in Story 13.3 ACs
- ⚠️ Analytics instrumentation — gating dependency — has no explicit owner story

## Step 3 — Epic Coverage Validation

### FR Coverage Matrix (spot-checked against actual story ACs)

All 18 FRs have concrete ACs in the named story (not just aspirational mentions).

| FR | Mapped Story | AC evidence | Status |
|----|--------------|-------------|--------|
| FR1 | 13.4 | S2→S3→S2 loop AC, `wardrobeRepo.assign` call | ✅ |
| FR2 | 13.3 | Camera init + guidance overlay AC | ✅ |
| FR3 | 13.3 | "Choose from library" branch AC (expo-image-picker) | ✅ |
| FR4 | 13.2 + 13.3 | Native module AC + invocation AC | ✅ |
| FR5 | 13.3 | Preview screen Repetir/Usar AC | ✅ |
| FR6 | 13.1 + 13.4 | Reassignment-overwrite AC + picker "assigned elsewhere" AC | ✅ |
| FR7 | 13.4 | 3-col Mi Armario grid AC | ✅ |
| FR8 | 13.5 | Skia polaroid cascade AC | ✅ |
| FR9 | 13.5 | Offscreen surface → JPEG → Sharing AC | ✅ |
| FR10 | 13.6 | S5 partial polaroid + suggestion AC | ✅ |
| FR11 | 13.6 | Completeness badge + thumbs AC | ✅ |
| FR12 | 13.6 | Sort order AC | ✅ |
| FR13 | 13.4 | S0 screen + `s0_seen` flag AC | ✅ |
| FR14 | 13.4 | Quitar action AC + item persists | ✅ |
| FR15 | 13.1 | `cascadeDeleteAssignmentsForCombination` AC | ✅ |
| FR16 | 13.4 | iOS-17 gating AC for all entry points | ✅ |
| FR17 | 13.5 | Footer text-exact AC | ✅ |
| FR18 | 13.5 | `share_look` analytics event AC | ✅ |

**FR coverage: 18/18 (100%).**

### NFR Coverage Matrix

| NFR | Mapped Story | AC evidence | Status |
|-----|--------------|-------------|--------|
| NFR1 (< 1.5 s bg removal) | 13.2 | "median end-to-end latency < 1.5 s" AC | ✅ |
| NFR2 (< 1 s share render) | 13.5 | "total elapsed < 1 s" AC | ✅ |
| NFR3 (< 50 MB for 100 items) | 13.3 | **No owning AC** — WebP encoding is set but no storage-ceiling check | ⚠️ Gap |
| NFR4 (persistence error handling) | 13.1 + 13.3 | Disk-full AC in 13.3; fallback-to-empty AC in 13.1 | ✅ |
| NFR5 (a11y targets + labels) | all | A11y AC in every story | ✅ |
| NFR6 (VoiceOver live regions) | 13.3 + 13.4 + 13.5 + 13.6 | Live-region announcement ACs | ✅ |
| NFR7 (off-JS-thread native) | 13.2 | `AsyncFunction` AC | ✅ |
| NFR8 (local-only, no photo bytes) | 13.1 + 13.3 | Analytics event carries `{combinationId, destination, timestamp}` only; DoD §10 privacy grep | ✅ |
| NFR9 (zero migration) | 13.4 + 13.6 | "behaves exactly as pre-Epic-13 for iOS <17 / zero wardrobe" ACs | ✅ |
| NFR10 (atomic file lifecycle) | 13.3 | Atomic move + rollback AC | ✅ |
| NFR11 (Reduce Motion) | 13.5 | Reduce-motion AC on S4 cascade | ⚠️ Partial — S0's polaroid entry animations (UX-DR8) are not mentioned in 13.4 Reduce-Motion ACs |
| NFR12 (EN + ES at launch) | all | Dev Notes call out i18n keys for each new screen | ✅ |
| NFR13 (no regressions) | DoD §9 | Regression gate in epic-level DoD | ✅ |
| NFR14 (pixel-identical Skia export) | 13.5 | "pixel-identical across iPhones at same resolution" AC | ✅ |

**NFR coverage: 12/14 hard-covered, 2/14 with soft gaps (NFR3 no owning AC, NFR11 Reduce-Motion partial).**

### UX-DR Coverage

All 10 UX-DRs traced to stories per epic's own §UX-DR Coverage. Spot-checked UX-DR1 (S0), UX-DR6 (S4 Skia), UX-DR10 (suggestion copy heuristic) against concrete ACs — all match.

### Requirements in epic NOT in (superseded) feature spec

None that are orphaned. Three epic requirements explicitly override/extend the feature spec:
1. Skia-only S4 rendering (override §6.2 of feature spec)
2. iOS-17 exclusivity (override §6.1 fallback)
3. Atomic file lifecycle + orphan sweep (extension beyond feature spec)

### Requirements in feature spec NOT traced into epic (gaps)

| Source | Item | Severity | Recommendation |
|--------|------|----------|----------------|
| Feature §10 | "3 taps or fewer to assign from S1" | Low | Either drop as non-measured UX aspiration OR add as Story 13.4 validation checklist item |
| Feature §10 | ">85% recorte success rate on plain-background photos" | Medium | Add as Story 13.2 on-device QA pass criterion (currently "10 sample photos" is mentioned but no pass threshold) |
| Research §Error handling contract | "'Use photo without cutout' escape hatch if Vision repeatedly fails" | Medium | Decide: add AC to Story 13.3 OR explicitly scope out. Research flags as "decide in story spec" — this decision is pending |
| Research §Pre-story measurement | Analytics instrumentation **before** starting Epic 13 | **High** | Ownership unclear. Either (a) make instrumentation a Story 13.0 prerequisite, (b) verify it lives inside the Epic 12 post-launch work, or (c) declare it out-of-epic-scope with a separate chore |

### Coverage beyond FR/NFR/UX-DR — implicit requirements

| Area | Epic coverage | Gap / Risk |
|------|---------------|------------|
| iPad layout | Not mentioned | ⚠️ Epic 11.3 added iPad support for primary screens. Epic 13 screens (S0–S5) have no iPad layout guidance. 3-col grid in S2/S3 may not scale to 1024 pt canvas. **Medium risk**, needs explicit decision |
| Premium/IAP gating | Not mentioned | ⚠️ `FREE_FAVORITES_LIMIT` exists. Does wardrobe have a free cap (e.g., 10 items)? Epic assumes unlimited. Product decision needed |
| Photo library permission flow | Story 13.3 mentions `expo-image-picker` but no AC covers permission-denied | Minor gap, easy to add |
| Camera permission reuse | Story 13.3 does not clarify whether it reuses Epic 12 CaptureScreen permission gating or re-asks | Minor; resolve at story start |
| Version-upgrade first-launch | NFR9 says "zero migration" but no AC validates user's first foreground after updating | Low risk; covered implicitly by additive design |
| EN + ES string completeness check | DoD lists localization but no automated parity check (`AssertSameKeys` in `src/i18n/types.ts` already enforces this at compile time per project-context.md) | ✅ Caught by existing type system |
| Share artifact font loading on cold start | Story 13.5 Dev Notes require Noto Serif JP loaded before render; what if font load fails? | Minor gap; add AC for font-load failure fallback |

### Coverage Statistics

- PRD FRs: 18 / 18 covered — 100%
- PRD NFRs: 12 / 14 strong + 2 partial — ~93% effective
- UX-DRs: 10 / 10 covered — 100%
- Feature-spec quality targets: 0 / 3 traced to story ACs — 0%
- Implicit cross-cutting (iPad, premium, permissions, upgrade): 4 open questions

## Step 4 — UX Alignment

### UX Document Status

**Found.** Epic 13 has a self-contained UX spec:

- `docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md` — 11 sections, 6 screens described functionally + visually
- `docs/planning/feature-armario-virtual/screens/` — 6 PNG mockups (s0, s1, s2, s3, s4, s5) referenced inline

The foundational `docs/planning/ux-design-specification-ios.md` is MVP-era and does not govern Epic 13 (per Step 1 ruling).

### UX ↔ Epic-PRD Alignment

| Aspect | Match? | Notes |
|--------|--------|-------|
| 6 screens (S0–S5) | ✅ | All appear in epic ACs and story sequencing |
| Flow diagram (S1→S0→S2→S3/S4/S5) | ✅ | Mirrors story 13.4 ACs |
| Data model (`WardrobeItem`, `CombinationAssignment`) | ✅ (refined) | Epic adds `thumbnailPath` field beyond feature spec §5 |
| S4 render stack (RN Views vs Skia) | ❌ divergence | Epic overrides; feature spec stale. Already flagged in Step 2 |
| iOS ≥17 gating | ❌ divergence | Epic drops iOS 15/16 fallback. Already flagged in Step 2 |
| Suggestion copy heuristic (§6.4) | ✅ | UX-DR10 faithfully captures `getSuggestionCopy` |
| Share artifact brand rules | ✅ (extended) | Epic + research extend with `Outfinder · Sanzo Wada, 1933` footer, 1080×1920 JPEG, no QR, no emoji |
| Mockups coverage | ✅ | 6/6 screens have a PNG reference |

### UX ↔ Architecture Alignment (against `docs/project-context.md`)

| UX need | Architecture support | Status |
|---------|---------------------|--------|
| Skia-rendered polaroid cascade + offscreen export | `@shopify/react-native-skia 2.5.1` already in repo; ColorMatrix pattern validated in Story 2.5; `createPicture`/`makeImageSnapshot`/`Surface.MakeOffscreen` APIs documented in research | ✅ |
| In-app camera capture | `expo-camera 55.0.15` in place (Epic 12) | ✅ |
| Iconography + typography (Noto Serif JP, Inter) | Already loaded via expo-font in App.tsx | ✅ |
| AsyncStorage-backed persistence | Pattern established by Favorites + Premium contexts | ✅ (with parallel keys) |
| Local Expo native module | `modules/white-balance/` (Epic 12) provides template + learned-traps (`podspecPath`, `expo-modules-core` type decl, pnpm rebuild) | ✅ |
| Haptics (`hapticLight/Medium/Rigid`) | `src/lib/haptics.ts` wrapper | ✅ |
| Reduce Motion + a11y plumbing | `useReducedMotion` hook + `AccessibilityInfo` conventions | ✅ |
| i18n EN/ES at launch | react-i18next + `TranslationKey` parity enforced in `types.ts` | ✅ |
| Bottom sheet (for S3 picker) | ❌ **not in current architecture** — project-context.md has no bottom-sheet library. Epic Dev Notes punt: `@gorhom/bottom-sheet if already in repo; else RN Modal` | ⚠️ Unresolved architectural decision |
| Analytics SDK (for `share_look` + Epic 13 go-gate) | ❌ **not in current architecture** — no SDK listed. Epic Story 13.5 punts with `@wardrobe:pending_analytics` local queue | ⚠️ Unresolved — also affects the gating dependency |
| Image library picker | `expo-image-picker` not installed — Epic adds in Story 13.3 | ✅ (planned) |
| New `expo-file-system` class-based API | Not installed — Epic adds in Story 13.3; pnpm rebuild required | ✅ (planned, risk flagged) |
| WebP encode | `expo-image-manipulator` — not installed — Epic adds in Story 13.3 | ✅ (planned) |

### Alignment gaps

1. **Bottom-sheet library decision is deferred to Story 13.4 start** — acceptable per epic ("decide at story start") but this is an architectural choice (new dep vs RN `Modal` workaround with swipe handlers), not purely implementation detail. Decide before sprint start to avoid Story 13.4 churn.
2. **No analytics SDK** is a load-bearing gap for **both** the go-gate (priority 1 post-launch per memory `project_status.md`) and for FR18. Story 13.5's "local queue" pattern is a coping mechanism, not a strategy. This should be resolved outside Epic 13 scope (separate chore) **before or in parallel with** Story 13.5.
3. **iPad layouts for S0–S5** are not in the UX spec (feature spec shows iPhone mockups only). Epic 11.3 added iPad for ColorHome/Favorites/OutfitVisualizer/Combinations/Settings/BrowseAllColors/SwatchGroup. New Epic 13 screens will need iPad treatment OR an explicit "iPhone-first, iPad later" scope decision.

### Warnings

- ⚠️ Feature spec (`ARMARIO-VIRTUAL.md`) has not been refreshed after the research's Skia / iOS 17 decisions. Dev agents reading the feature spec first will see obsolete guidance. **Recommendation:** add a top-of-doc banner pointing to epic + research as sources of truth, or refresh the feature spec.
- ⚠️ Mockups are present but not annotated with detailed a11y callouts (`accessibilityLabel`/`Role` hints). Accessibility requirements live only in epic UX-DR8. Low risk given CLAUDE.md discipline, but worth flagging.

## Step 5 — Epic Quality Review

### Epic-level checks

| Check | Result | Evidence |
|-------|--------|----------|
| Epic delivers user value (not a tech milestone) | ✅ | "Users transform their saved Wada combinations into personal outfits" |
| Epic can function independently of future epics | ✅ | Self-contained extension of Favorites + Capture (both shipped) |
| Epic has traceable FR/NFR/UX-DR coverage | ✅ | 18/18 + 14/14 + 10/10 maps |
| Brownfield integration points explicit | ✅ | Favorites (Epic 4), CaptureScreen (Epic 12), share pipeline (Epic 3) |
| No cross-epic forward dependency | ✅ | Depends only on shipped epics |

### Story-level checks

| Story | User value | Size (vs CLAUDE.md 4–5 cap) | AC structure (GWT, testable) | Forward deps | Severity |
|-------|-----------|------------------------------|------------------------------|--------------|----------|
| 13.1 Data model + repo + Zustand | 🟡 Pure infra | ✅ Within cap (7 AC groups collapse into ~4 tasks) | ✅ GWT, testable | ✅ none | 🟡 Minor (project-accepted pattern: mirrors Story 12.1 color-math foundation) |
| 13.2 BackgroundRemovalModule | 🟡 Pure infra | ✅ Within cap | ✅ GWT, includes perf targets | ✅ none | 🟡 Minor (mirrors Story 12.3 WhiteBalanceModule pattern) |
| 13.3 Capture flow | ✅ User-facing | 🟠 **Over cap — 9+ discrete tasks** (camera, picker branch, Vision invoke + error, preview, WebP encode, thumbnail, atomic move, orphan sweep, disk-full, iOS-17 gate, VoiceOver) | ✅ GWT, testable | ✅ backward-only | 🟠 **Major — split recommended** |
| 13.4 Assignment flow | ✅ User-facing | 🟠 **Over cap — 9+ discrete tasks** (S0, s0_seen flag, S2, S3 Mi Armario, S3 Nueva foto, Quitar, cascade confirm, iOS-17 gate, shared components) | ✅ GWT, testable | ✅ backward-only; S3 bottom-sheet lib deferred to story kickoff | 🟠 **Major — split recommended** |
| 13.5 S4 + Share + Analytics | ✅ User-facing | ✅ At cap (~5 tasks: draw function, on-screen Canvas, offscreen export, share+analytics, a11y) | ✅ GWT, testable | ✅ none in-epic | 🟠 Major (analytics SDK punt — local queue is band-aid) |
| 13.6 S5 + Favorites badges | ✅ User-facing | ✅ At cap | ✅ GWT, snapshot tests specified | ✅ reuses 13.5 + 13.4 | 🟢 Clean |

### 🔴 Critical violations

None. Epic is well-structured, traceable, and respects brownfield constraints.

### 🟠 Major issues

**M1 — Story 13.3 exceeds CLAUDE.md §Story Scope 4–5 task cap**

`epic-13-armario-virtual.md` Story 13.3 lists 12 distinct Given/When/Then blocks spanning camera, library picker, Vision invocation, preview, error paths, WebP + thumbnail encode, atomic move + rollback, orphan sweep, disk-full, iOS-17 gating, and VoiceOver. That is 9+ concrete tasks — roughly 2× the cap.

- **Why it matters:** per memory `feedback_epic1_retro.md` and `feedback_epic4_retro.md`, "stories with 7–10 tasks showed context degradation" and "small epics = predictable". Story 12.3 (WhiteBalanceModule + CaptureScreen wiring) was at the edge of this cap and still passed, but that story had a narrower surface.
- **Recommendation:** split along a natural seam. Two options:
  - **Option A (preferred):** 13.3a = camera + guidance + library picker + Vision invocation + preview + Repetir/Usar. 13.3b = WebP re-encode + thumbnail + atomic move + rollback + orphan sweep + error paths.
  - **Option B:** fold orphan sweep into Story 13.1 (it touches the data layer), and the rest stays in 13.3.
- **Blocker-level:** not a blocker to write stories, but a **blocker to skip** before `bmad-create-epics-and-stories` — do the split now or commit to smaller task buckets at story-creation time.

**M2 — Story 13.4 exceeds CLAUDE.md §Story Scope 4–5 task cap**

Same pattern: S0 screen, S0 `s0_seen` flag semantics, S2 ficha screen, S3 bottom sheet + Mi Armario grid, S3 Nueva foto integration with capture flow, Quitar action, unfavorite cascade confirmation, iOS-17 gating, shared-component extraction (PolaroidCard / WardrobeItemThumb / WadaColorDot). ~9 tasks.

- **Recommendation:** 13.4a = S0 + S2 + shared components + iOS-17 gate. 13.4b = S3 picker + Mi Armario grid + Nueva foto integration + Quitar + unfavorite cascade.
- The Dev Notes explicitly acknowledge this ("This story has a lot of screens but shared components… Extract them in a single pass to avoid rework"). Splitting formalizes that intent.

**M3 — Analytics SDK gap — RESOLVED 2026-04-17 (scoped out by user decision)**

~~FR18 requires `share_look` events. Story 13.5 ships a local queue. The Epic 13 go-gate itself is predicated on camera-usage analytics from Epic 12.~~

**User explicitly declined analytics** (see memory `feedback_no_analytics.md`): Outfinder is craft-driven, not data-driven. At ~60 DAU, qualitative feedback from friends/beta is the decision signal, not metric dashboards.

**Resulting changes needed in the epic:**
- **FR18** (`share_look` analytics event): scope out — delete from Requirements Inventory + FR Coverage Map, or re-scope to a no-op local counter (optional).
- **Story 13.5 Dev Notes**: remove the `@wardrobe:pending_analytics` local-queue pattern (no SDK coming).
- **Epic §Gating & Sequencing**: rewrite — the three-scenario decision framework (camera explodes / camera-but-not-Visualizer / low overall) no longer applies. Epic 13 go/no-go is a product-taste call by the user, informed by their own use + anecdotal feedback.
- **Research §Pre-story measurement** recommendation is waived.

### 🟡 Minor concerns

- **C1 — Stories 13.1 and 13.2 are pure-technical infrastructure stories.** Project has accepted this pattern (Story 12.1 color math, Story 12.3 WhiteBalanceModule). Acceptable, but worth calling out that they deliver no user-visible value on their own and cannot be demoed.
- **C2 — Performance ACs (NFR1, NFR2, NFR14) are manual-only verifications.** "Verified via Xcode Instruments on iPhone 12" and "pixel-identical across iPhones 12/13/14/15/16" cannot be automated in CI. Acceptable for a mobile-native project but note in DoD that skipping on-device validation is a High-severity miss.
- **C3 — Font-load failure on S4 has no AC.** Story 13.5 requires Noto Serif JP but no fallback AC exists if `useFont` returns null. Low risk (font already loaded in App.tsx) but worth an AC.
- **C4 — Bottom-sheet library decision deferred.** Epic Open Questions §1: `@gorhom/bottom-sheet` vs RN Modal. This is an architectural decision (new dep vs DIY) that should not wait until Story 13.4 kickoff — decide before sprint planning.
- **C5 — Feature spec drift** (already flagged Step 2): `ARMARIO-VIRTUAL.md` contradicts epic on Skia render stack + iOS 17 exclusivity + dependency status.
- **C6 — NFR3 storage ceiling (< 50 MB for 100 items) has no owning AC.** Acceptable if we trust WebP q=0.9 math; risky without an explicit check.
- **C7 — NFR11 Reduce Motion only covered on S4 cascade.** S0's polaroid pre-viz (UX-DR1) may also animate; epic doesn't say. Add AC to Story 13.4 if animation is used on S0.
- **C8 — Premium/IAP gating for Armario Virtual not mentioned.** `FREE_FAVORITES_LIMIT` exists. Does a `FREE_WARDROBE_LIMIT` apply? Product decision pending — may or may not be in scope.
- **C9 — iPad layouts for S0–S5 not specified.** Epic 11.3 delivered iPad for primary screens; Epic 13 screens would also need treatment. Either explicitly scope iPhone-first or add iPad NFR.
- **C10 — Photo library permission-denied flow** for `expo-image-picker` is implicit. Story 13.3 should include an AC for permission denial.

### Best Practices Compliance Checklist

| Rule | Epic 13 | Notes |
|------|---------|-------|
| Each epic delivers user value | ✅ | |
| Epic functions independently | ✅ | |
| Stories appropriately sized (CLAUDE.md 4–5 cap) | 🟠 | 13.3 + 13.4 over cap |
| No forward dependencies | ✅ | |
| Storage/entities created when needed | ✅ | 13.1 owns data model |
| Clear AC (GWT, testable) | ✅ | |
| Traceability to FRs maintained | ✅ | |
| Brownfield integration points explicit | ✅ | |
| On-device validation planned for native/perf | ✅ | DoD §8 |
| Adversarial code review mandatory per story | ✅ | DoD §7 references `/bmad-code-review` |
| Localization EN+ES at merge | ✅ | DoD §6 |
| Regression gate for shipped epics (NFR13) | ✅ | DoD §9 |

## Step 6 — Final Assessment

### Overall Readiness Status

**🟠 READY-WITH-FIXES** — Epic 13 is structurally sound, has complete traceability, and respects brownfield constraints. After the 2026-04-17 analytics-out decision, only **two story splits remain** before invoking `bmad-create-epics-and-stories`.

The epic is NOT blocked by requirement gaps — it's blocked by scope-discipline gaps that memory (`feedback_epic1_retro.md`, `feedback_epic4_retro.md`) identifies as the single highest source of dev-agent context degradation.

### Critical Issues Requiring Immediate Action

**Blockers for `bmad-create-epics-and-stories`:**

1. **Split Story 13.3** into 13.3a (camera + picker + Vision + preview) and 13.3b (WebP + atomic file lifecycle + orphan sweep + error paths) — currently ~9 tasks, 2× the CLAUDE.md cap.
2. **Split Story 13.4** into 13.4a (S0 + S2 + shared components + iOS-17 gate) and 13.4b (S3 picker + Nueva foto integration + Quitar + unfavorite cascade) — currently ~9 tasks.

**Epic edits required (one-line changes, no blocker):**

3. **Scope out analytics** per user decision 2026-04-17 (see memory `feedback_no_analytics.md`): delete FR18 from Requirements Inventory + Coverage Map, remove `@wardrobe:pending_analytics` pattern from Story 13.5 Dev Notes, rewrite §Gating & Sequencing to be product-taste-driven not metric-driven.

**Recommended-but-not-blocking fixes:**

4. Refresh `ARMARIO-VIRTUAL.md` to reflect the epic's overrides (Skia render stack, iOS 17 exclusivity, dep status). Add a top-of-doc banner pointing to epic + research as sources of truth.
5. Decide bottom-sheet library (`@gorhom/bottom-sheet` vs RN `Modal`) before story kickoff, not at story start.
6. Decide iPad scope for S0–S5: explicitly iPhone-first or add iPad NFR.
7. Decide premium-gating for wardrobe (is there a `FREE_WARDROBE_LIMIT`?).

### Minor Recommendations (address at story-creation time, not before)

- Add AC to Story 13.3 for photo-library permission denied flow
- Add AC to Story 13.3 for "Usar sin recorte" escape hatch OR explicitly scope it out (research flags this as story-spec decision)
- Add AC to Story 13.5 for font-load failure fallback
- Add AC to Story 13.3 or 13.6 to validate NFR3 (< 50 MB wardrobe footprint)
- Add AC to Story 13.4 for Reduce-Motion on S0 polaroid pre-viz animation (if any)
- Add Story 13.2 on-device QA pass threshold ("≥85% success on plain-background photos")
- Add Story 13.4 UX-velocity checklist item ("≤3 taps from Favorites to assigned" per feature spec §10)

### Recommended Next Steps

1. **Today:** apply the analytics scope-out edits to `epic-13-armario-virtual.md` (delete FR18, update Coverage Map, rewrite §Gating & Sequencing, strip Story 13.5 local-queue notes).
2. **Today:** split Stories 13.3 and 13.4 (items #1 and #2 above). Update the FR Coverage Map and story dependency graph accordingly. The epic grows from 6 to 8 stories.
3. **This week:** refresh `ARMARIO-VIRTUAL.md` with banner + corrections; resolve bottom-sheet + iPad + premium decisions.
4. **When user decides to start:** invoke `bmad-create-epics-and-stories` targeting the 8-story Epic 13. No metric gate remains — the decision is a product-taste call.

### Final Note

This assessment identified **2 major issues** (both scope-cap violations — Stories 13.3 and 13.4 over the 4–5 task cap) and **10 minor concerns** across structural, scope, and architecture-decision categories. The third original major (analytics ownership gap) was resolved by user decision on 2026-04-17 to keep Outfinder craft-driven — see memory `feedback_no_analytics.md`. There are **no critical (red) issues**.

**Fixing the 2 major items before invoking `bmad-create-epics-and-stories`** is the shortest path to a clean epic decomposition and avoids the context-degradation pattern documented in prior retros. The minor items can be resolved during story creation without blocking.

---

**Report generated:** 2026-04-17
**Assessor:** Claude (Implementation Readiness skill)
**Target:** Epic 13 — Armario Virtual (gated on post-v1.3.0 camera-usage analytics)


