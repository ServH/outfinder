---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md
  - docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md
  - docs/planning/architecture-react-native-ios.md
  - docs/planning/ux-design-specification-ios.md
  - docs/project-context.md
status: draft — GATED by post-v1.3.0 analytics (camera usage signal from Epic 12)
epic: 13
---

# Outfinder Epic 13 — Armario Virtual

## Overview

This document provides the complete epic and story breakdown for Outfinder Epic 13 — Armario Virtual. It transforms Favorites from a collection of abstract color palettes into personal outfits: users assign real garment photos to each Wada color slot of a saved combination, and the app auto-composes a shareable "polaroid look". This is a brownfield extension of a published app (v1.3.0). All existing patterns from `project-context.md`, Epic 12 (`modules/white-balance/` local native module), and CLAUDE.md apply.

**Delivery Gate**  
Writing the epic now consolidates research momentum, but stories **MUST NOT start** until post-v1.3.0 camera-usage analytics have accumulated 2–4 weeks of data. The go decision for Epic 13 depends on whether the Epic 12 camera is actually adopted (`camera_opened`, `camera_captured`, retention signals). See `project_status.md` for the three-scenario decision framework.

**Input Source of Truth**  
- UX spec — `docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md` (screens S0–S5, flow, data model, open questions)
- Technical research — `docs/planning/research/technical-armario-virtual-feasibility-research-2026-04-16.md` (Vision iOS 17+, WebP q=0.9, AsyncStorage+Zustand split keys, Skia for share artifact, 6-story breakdown)

## Requirements Inventory

### Functional Requirements

FR1: Users can assign a personal garment photo to each Wada color slot of a saved favorite combination  
FR2: Users can capture new garment photos with the in-app camera, with on-screen guidance for background/lighting  
FR3: Users can select garment photos from the existing iOS photo library instead of capturing new ones  
FR4: The app automatically removes the background from every new garment photo, producing a transparent-background cutout  
FR5: Users can preview the background-removed result and either accept it or retry with a new photo before it's saved  
FR6: Users can re-use one wardrobe item across multiple favorited combinations (shared-repo model)  
FR7: Users can browse their full wardrobe in a grid picker when assigning, with previously added items surfaced for reuse  
FR8: Users can view a completed outfit look as a 3-card polaroid cascade in the S4 Tu Look screen  
FR9: Users can share the polaroid look as a 1080×1920 image via the native iOS share sheet  
FR10: Users can see a guided partial-state (S5 Sugerencia Armonía) when a combo has only 1/3 or 2/3 assignments, with a contextual suggestion for the missing color  
FR11: Users can see assignment status on every Favorites card via a badge (3/3 complete, X/3 partial, Sin prendas) and a row of thumbnails for assigned items  
FR12: Favorites with complete assignments are sorted to the top of the Favorites list (most actionable first)  
FR13: First-time users entering a non-assigned favorite see a dedicated S0 Zero State screen that pre-visualizes the S4 result with empty polaroid slots  
FR14: Users can remove an assigned garment from a specific color slot without deleting the underlying wardrobe item from their library  
FR15: Users who unfavorite a combination have their assignments for that combination cascade-deleted; wardrobe items persist in the shared repo  
FR16: Users on iOS < 17 do not see Armario Virtual entry points (feature-gated, not broken)  
FR17: The Armario Virtual share image contains the footer "Outfinder · Sanzo Wada, 1933" as a persistent anti-AI credibility signal  
FR19: Free-tier users can store up to `FREE_WARDROBE_LIMIT` (=10) wardrobe items. Attempting to add an 11th item surfaces the existing paywall sheet (mirror of `FREE_FAVORITES_LIMIT` UX). Reusing existing items across combos is unlimited on both tiers.

_(FR18 — share analytics event — removed 2026-04-17 per project decision to stay craft-driven, no analytics SDK. See `feedback_no_analytics.md`.)_

### Non-Functional Requirements

NFR1: Background removal completes in under 1.5 s end-to-end on iPhone 12+ devices for a typical 3 MB HEIC photo  
NFR2: The S4 share image renders and writes to disk at 1080×1920 JPEG q=92 in under 1 s  
NFR3: Storage footprint for 100 wardrobe items (WebP q=0.9 masters + thumbnails) remains under 50 MB on disk  
NFR4: All persistence operations handle disk-full and permission-denied errors gracefully — no orphaned files, no orphaned DB rows  
NFR5: All interactive elements meet the 44×44 pt minimum touch target and have `accessibilityLabel` + `accessibilityRole`  
NFR6: VoiceOver users can complete the full capture → preview → assign flow, with live-region announcements for state changes (capture done, background removal complete, combo now complete)  
NFR7: The background-removal native module runs off the JS thread (expo-modules `AsyncFunction`), never blocks UI  
NFR8: User garment photos are stored only locally; no network upload ever, no analytics payload contains photo bytes or identifiable metadata  
NFR9: Existing Favorites screen continues to work unchanged for users with zero wardrobe items — Armario Virtual is 100% additive, zero migration  
NFR10: Atomic file lifecycle enforced: file moved into `wardrobe/` only AFTER DB insert commits; DB row removed AFTER its file is deleted  
NFR11: Reduce Motion setting respected — no animated transitions to S4 polaroid cascade when enabled  
NFR12: All new user-visible strings localized EN + ES at launch (project is already i18n'd from Epic 11.2)  
NFR13: All existing tests pass post-Epic 13 — no regressions on Epic 12 Color Capture pipeline  
NFR14: The Skia S4 composition function produces pixel-identical output across supported iPhones at the same resolution  

### Additional Requirements

From existing Architecture and CLAUDE.md (must follow):

- Function declarations with named exports (never `export default`, except `App.tsx`)
- `interface {ComponentName}Props` required for every component
- NativeWind `className` for static styles; `style={{}}` only for dynamic Wada color values and Skia dynamic props
- Haptics only through `src/lib/haptics.ts` — never import `expo-haptics` directly
- `useReducedMotion()` check before any animation
- All hooks called before any early returns
- Co-located test files next to source (`.test.ts(x)` next to the source file)
- `testID` attributes only (React Native convention — never `data-testid`)
- Mandatory adversarial code review (`/bmad-code-review`) before merge of every story
- Max 4–5 tasks per story (CLAUDE.md §Story Scope)
- `pnpm add` + `npx expo prebuild --clean && npx expo run:ios` for any native-module add (Metro reload is NOT enough — see `feedback_native_module_rebuild.md`)

New for Epic 13:

- **Local Expo module `modules/background-removal/`** — mirrors `modules/white-balance/` structure (Swift + `ExpoModulesCore` + CoreImage + Vision). MUST include `podspecPath: "background-removal.podspec"` in `expo-module.config.json` to avoid the Story 12.3 autolinking trap. Podspec lives at module root, not in `ios/`. See `feedback_local_expo_module.md`.
- **New dependencies**: `expo-file-system` (new class-based API `File`, `Directory`, `Paths`), `expo-image-manipulator` (WebP re-encode + thumbnails), `expo-image-picker` (library source branch), `zustand` (reactivity layer over AsyncStorage)
- **AsyncStorage split keys**: `@wardrobe:items` (WardrobeItem[]) + `@wardrobe:assignments` (CombinationAssignment[]). Joins performed in JS. Never a single mega-blob.
- **Zustand persist middleware** backed by an AsyncStorage adapter — drop-in for a future MMKV migration if wardrobe volume ever justifies it.
- **`@shopify/react-native-skia 2.5.1`** (already in repo, validated in Story 2.5 ColorMatrix) is the sole render path for the S4 composition AND its export. `react-native-view-shot` is NOT used for Armario Virtual — it remains only for the existing `src/lib/share.ts` color-combo share.
- **WebP q=0.9 with alpha** is the storage format for wardrobe masters (PNG rejected — ~3× larger). Thumbnails at 300×360 WebP q=0.75. JPEG q=92 is the export format for the S4 share artifact (flattened, no alpha needed).
- **Vision API**: `VNGenerateForegroundInstanceMaskRequest` (iOS 17+) exclusively — no `VNGenerateForegroundMaskRequest` fallback. Armario Virtual entry points gated with `Platform.Version >= 17`.
- **File layout**: masters at `Paths.document + /wardrobe/<uuid>.webp` (backed up — user data), thumbnails at `Paths.document + /wardrobe/<uuid>-thumb.webp` with `NSURLIsExcludedFromBackupKey=true` (regenerable). No use of `cachesDirectory` for masters.
- **Share artifact spec**: 1080×1920 JPEG q=92, warm-cream background, Noto Serif JP for combo name, footer `Outfinder · Sanzo Wada, 1933` at 60% opacity 3–4% from bottom, Wada color-dots row below the polaroid stack.

No starter template — brownfield project extending existing codebase.

### UX Design Requirements

UX-DR1: **S0 Zero State screen** — Nav `← [combo name]`, serif hero title `Viste esta paleta con tu ropa`, explanatory subtitle, Wada color-dots + combo-name row, 3 empty polaroid cards in vertical cascade each tinted subtly with their Wada color and `+` icon center (pre-visualizing S4 layout), primary CTA `Empezar a asignar prendas`, secondary escape `Ahora no`  
UX-DR2: **S1 Favorites enrichment** — add completeness badge component to every combo card (`3/3 prendas` green, `X/3 prendas` amber, `Sin prendas` gris), thumbnail strip of assigned items below the palette preview, contextual CTA (`Ver tu look →` for complete, `Completa tu look →` for partial), completeness-first sort order on the Favorites grid  
UX-DR3: **S2 Ficha Wada screen** — Nav with back + badge (`✓ 3/3` green or `X/3` amber), instruction line `Asigna tus prendas a cada color de la paleta`, 3-column row of color-slot cards (swatch + assigned photo or dashed empty slot + Wada color name + `Asignar →`/`Cambiar →` link), footer primary CTA `Ver tu look` (routes to S4 if complete, S5 if partial)  
UX-DR4: **S3 Armario Picker bottom sheet** — header `Elige para [color name]` + Wada color dot, tabs `Mi Armario` / `+ Nueva foto`, Mi Armario tab renders 3-column grid of transparent-background items with selection ring, Nueva foto tab opens camera or system photo picker, secondary footer CTA `Fotografiar prenda nueva`, sheet confirms selection on dismiss (swipe-down or tap-outside)  
UX-DR5: **Capture & preview flow** — camera screen with guidance overlay `Pon la prenda sobre fondo liso, buena luz`, after-capture preview screen shows background-removed result with `Repetir` / `Usar esta foto` CTAs, no manual retouch tool in MVP  
UX-DR6: **S4 Tu Look screen (Skia-rendered)** — Nav `← Paleta Wada ·`, serif combo name (Noto Serif JP), `✓ Look completo` green badge, 3 polaroid cards in vertical cascade with rotations `+2°, 0°, −2°` and ~32 pt overlap, each card showing its garment on white background with Wada color label underneath, Wada color-dots row + `Combinación Wada` label, footer `Outfinder · Sanzo Wada, 1933`, primary CTA `Compartir look`, secondary `Explorar más paletas`  
UX-DR7: **S5 Sugerencia Armonía screen** — Nav `← [combo name]` + partial badge (`2/3 prendas` amber), subtitle `Completa el look para ver la armonía completa`, polaroid cascade with assigned photos AND an empty-slot card (light-blue `#EEF2F8` background, Wada-colored dashed border, central `+`, `Añadir prenda en [Color]`), suggestion card at bottom (lateral accent in the missing color, title `Completa la armonía`, dataset-driven context copy, CTA `Añadir prenda en [Color]`)  
UX-DR8: **Accessibility across all screens** — 44×44 pt minimum touch targets, `accessibilityLabel` + `accessibilityRole` on every interactive element, `accessibilityLiveRegion` announcements for state transitions (capture done, background removal complete, combo now complete), VoiceOver reading order validated for S2 / S3 / S4 / S5, reduce-motion respected for any polaroid entry animations  
UX-DR9: **Localization EN + ES** — every user-visible string added in this epic MUST be keyed through `i18next` and provided in both locales at merge time. Wada color names remain untranslated per Epic 11.2 convention  
UX-DR10: **Suggestion copy logic (S5)** — `getSuggestionCopy(colorIndex, totalColors)` heuristic: last index → accessory framing (`Ideal para un accesorio: zapatos, bolso o cinturón`), first index → main piece (`Suele ser la pieza principal del look`), middle → layering (`Puede ser una segunda capa o prenda de punto`). Not hardcoded per-combination — dataset-agnostic heuristic  

### FR Coverage Map

| FR | Epic.Story | Description |
|----|-----------|-------------|
| FR1 | 13.4b | Assign a wardrobe item to a Wada color slot (S2 → S3 → S2 flow) |
| FR2 | 13.3a | Capture flow with in-app camera + guidance |
| FR3 | 13.3a | Library source branch (expo-image-picker) |
| FR4 | 13.2 + 13.3a | Native background-removal module + invocation in capture flow |
| FR5 | 13.3a | Preview screen with Repetir / Usar CTAs |
| FR6 | 13.1 + 13.4b | Data model supports reuse; picker surfaces all items |
| FR7 | 13.4b | S3 Armario tab with grid of all items |
| FR8 | 13.5 | S4 Skia polaroid cascade on-screen |
| FR9 | 13.5 | Share pipeline: offscreen Skia surface → JPEG → Sharing.shareAsync |
| FR10 | 13.6 | S5 partial-state screen with suggestion card |
| FR11 | 13.6 | Favorites badge + thumbnail strip component |
| FR12 | 13.6 | Favorites completeness sort |
| FR13 | 13.4a | S0 zero-state screen |
| FR14 | 13.4b | Unassign action from S2 / S3 |
| FR15 | 13.1 | Repo cascade logic on combo unfavorite |
| FR16 | 13.4a | iOS-17 entry-point gating |
| FR17 | 13.5 | Share artifact footer text |
| FR19 | 13.1 + 13.3a | Repo-level `FREE_WARDROBE_LIMIT` check + paywall UX in capture-flow Preview |

**NFR Coverage**  
NFR1 → 13.2 · NFR2 → 13.5 · NFR3 → 13.3b · NFR4 → 13.1 + 13.3b · NFR5 → all · NFR6 → 13.3a + 13.4a/b + 13.5 + 13.6 · NFR7 → 13.2 · NFR8 → 13.1 + 13.3b · NFR9 → 13.4a + 13.6 · NFR10 → 13.3b · NFR11 → 13.5 · NFR12 → all · NFR13 → all (regression gate) · NFR14 → 13.5

**UX-DR Coverage**  
UX-DR1 → 13.4a · UX-DR2 → 13.6 · UX-DR3 → 13.4a · UX-DR4 → 13.4b · UX-DR5 → 13.3a · UX-DR6 → 13.5 · UX-DR7 → 13.6 · UX-DR8 → all · UX-DR9 → all · UX-DR10 → 13.6

**Coverage: 18/18 FRs (FR1–FR17 + FR19; FR18 removed), 14/14 NFRs, 10/10 UX-DRs mapped. No orphans.**

## Epic List

- **Epic 13:** Armario Virtual (8 stories)
  - Story 13.1: Wardrobe data model, repository, and Zustand store
  - Story 13.2: BackgroundRemovalModule — local Expo native module (Swift + Vision)
  - Story 13.3a: Capture + Background Removal UI Flow (camera, library, Vision, preview)
  - Story 13.3b: Wardrobe Persistence & Lifecycle (WebP encode, atomic file ops, orphan sweep, error paths)
  - Story 13.4a: Zero State + Ficha Wada + Shared Components (S0, S2, shared cards, iOS-17 gate, Favorites entry)
  - Story 13.4b: Armario Picker + Assignment Mechanics (S3, Mi Armario grid, Nueva foto integration, Quitar, unfavorite cascade)
  - Story 13.5: S4 Tu Look — Skia composition (preview + 1080×1920 JPEG export) + share
  - Story 13.6: S5 Sugerencia Armonía + Favorites badges, thumbnails, and completeness sort

Stories 13.3 and 13.4 were split on 2026-04-17 from a single story each to stay within CLAUDE.md §Story Scope 4–5 task cap. Story 13.5 was also simplified by removing FR18 analytics event.

### Epic Dependencies

```
13.1 (data + repo + Zustand) ─────────────────┐
                                              │
13.2 (native bg-removal module) ──► 13.3a ──► 13.3b ──┐
                                                      │
                                              13.4a ──┼──► 13.4b ──► 13.5 ──► 13.6
                                                      │
                                              (13.4a depends on 13.1 only —
                                               can dev in parallel with 13.3a/b)
```

Sequencing:  
1. **13.1** is dep of everything (data shape, repo API, store hooks)  
2. **13.2** is dep of 13.3a (capture cannot invoke removal without the native module)  
3. **13.3a** delivers camera→preview→cutout as a standalone dev-previewable loop (Usar esta foto hits a persistence stub that 13.3b implements)  
4. **13.3b** turns the stub into real WebP persistence + rollback + orphan sweep. MUST land before any user can actually save a garment  
5. **13.4a** can be developed in parallel with 13.3a/b (it only depends on 13.1). But **13.4a MUST NOT merge** until 13.3b merges (S2 "Asignar →" would navigate to an un-wired S3). Sprint planning choice  
6. **13.4b** depends on 13.3a (Nueva foto branch) and 13.3b (so assignments reference real items)  
7. **13.5** and **13.6** are independent of each other and can ship in either order after 13.4b; 13.5 unlocks the shareable marketing surface, 13.6 polishes discovery & contextual guidance

## Epic 13: Armario Virtual

Users transform their saved Wada combinations into personal outfits — capturing their real clothes, letting the app cut them out cleanly, assigning them to each color slot, and sharing a high-quality polaroid-style look that carries a hand-curated 1933 color-theory credential everywhere it goes.

**FRs covered:** FR1–FR17 + FR19 (FR18 removed — see Requirements Inventory)  
**NFRs:** NFR1–NFR14  
**UX-DRs:** UX-DR1–UX-DR10  

---

### Story 13.1: Wardrobe Data Model, Repository, and Zustand Store

As a **developer implementing the Armario Virtual feature**,  
I want **a typed repository + reactive store backed by AsyncStorage with split keys and a documented cascade policy**,  
So that **all subsequent stories have a single, tested API for reading, writing, joining, and invalidating wardrobe state — with zero migration risk to existing Favorites users**.

**Acceptance Criteria:**

**Given** the Armario Virtual data model  
**When** the module initializes  
**Then** two AsyncStorage keys exist: `@wardrobe:items` (JSON-serialized `WardrobeItem[]`) and `@wardrobe:assignments` (JSON-serialized `CombinationAssignment[]`)  
**And** the `WardrobeItem` interface matches `{ id: string, localImagePath: string, thumbnailPath: string, createdAt: number }`  
**And** the `CombinationAssignment` interface matches `{ combinationId: number, colorIndex: number, wardrobeItemId: string, assignedAt: number }`

**Given** the `wardrobeRepo` module  
**When** any story imports it  
**Then** the following functions are exported with full TypeScript typing: `getItems()`, `addItem(input)`, `removeItem(id)`, `getAssignmentsForCombination(combinationId)`, `assign(combinationId, colorIndex, wardrobeItemId)`, `unassign(combinationId, colorIndex)`, `getAssignmentCount(combinationId)`, `isCombinationComplete(combinationId, totalColors)`, `cascadeDeleteAssignmentsForCombination(combinationId)`

**Given** the `assign(combinationId, colorIndex, wardrobeItemId)` call  
**When** an existing assignment for that `(combinationId, colorIndex)` already exists  
**Then** the old assignment is overwritten (uniqueness enforced at the repo layer, not storage)  
**And** the old `wardrobeItemId` is NOT deleted from `@wardrobe:items` (items persist across reassignment)

**Given** the `cascadeDeleteAssignmentsForCombination(combinationId)` call  
**When** triggered on unfavorite  
**Then** all `CombinationAssignment` rows with matching `combinationId` are removed from `@wardrobe:assignments`  
**And** wardrobe items referenced by those assignments remain untouched in `@wardrobe:items`

**Given** the `addItem(input)` call  
**When** the user is on the free tier AND `@wardrobe:items` already contains ≥ `FREE_WARDROBE_LIMIT` (=10) entries  
**Then** the function throws `WardrobeLimitExceeded` (typed error)  
**And** no item is written to storage  
**And** premium users bypass the gate entirely (limit never evaluated when `isPremium === true`)

**Given** the Zustand store `useWardrobeStore`  
**When** any component subscribes  
**Then** reads from the store reflect current AsyncStorage state (hydrated at app start via persist middleware)  
**And** writes through the store mutate AsyncStorage atomically  
**And** subscribed components re-render on mutation without manual event plumbing

**Given** an AsyncStorage read failure (corrupt JSON, key missing, disk error)  
**When** the store initializes  
**Then** the store falls back to empty `items[]` and `assignments[]` arrays without crashing  
**And** a single warn-level log entry is emitted (no user-facing error)

**Given** unit tests for the repo + store  
**When** `pnpm test` runs  
**Then** tests cover: add/remove item, assign/unassign, reassignment overwrite, cascade-delete semantics, store hydration, store reactivity on mutation, failure-path fallback, paywall limit enforcement (free tier blocked at 10, premium unlimited)

**Dev Notes:**
- File layout: `src/lib/wardrobeRepo.ts` (+ `.test.ts`), `src/stores/wardrobeStore.ts` (+ `.test.ts`)
- AsyncStorage keys: `@wardrobe:items`, `@wardrobe:assignments` — NEVER a mega-blob; see research §Persistence
- Zustand install: `pnpm add zustand` (pure JS, no native rebuild)
- Persist middleware uses `@react-native-async-storage/async-storage` as the storage adapter — swap is trivial later if MMKV is ever justified
- All functions are pure wrappers over the store — no direct AsyncStorage calls from components
- `WardrobeItem.id` is generated as a UUID v4 at creation time (`crypto.randomUUID()` from `expo-crypto` if not already available, else a tiny util)
- **Paywall gate:** export `FREE_WARDROBE_LIMIT = 10` as a named constant. `addItem()` checks `items.length >= FREE_WARDROBE_LIMIT && !isPremium` before inserting; throws `WardrobeLimitExceeded` (typed error). Reusing an existing wardrobe item across combos goes through `assign()`, NOT `addItem()` — so reuse is unlimited. Mirror the `FREE_FAVORITES_LIMIT` gating pattern already in the codebase.
- This story has NO UI work — purely data + tests. Zero visual changes.
- Docs: add a short JSDoc on every exported function describing the cascade rule and reuse semantics — critical context for future stories

---

### Story 13.2: BackgroundRemovalModule — Local Expo Native Module

As a **developer enabling the capture flow**,  
I want **a Swift-backed local Expo module that accepts an input image URI and returns a file URI to a transparent-background cutout**,  
So that **Story 13.3a has a validated, off-thread, iOS-17-native primitive to call without rolling its own bridge**.

**Acceptance Criteria:**

**Given** the module directory `modules/background-removal/`  
**When** the project builds  
**Then** the module structure mirrors `modules/white-balance/`: `expo-module.config.json` (with `podspecPath: "background-removal.podspec"` at the module root), `background-removal.podspec` at the root (NOT inside `ios/`), `ios/BackgroundRemovalModule.swift`, `src/index.ts`, `package.json`  
**And** `expo-modules-autolinking resolve` detects the module and lists `"class": "BackgroundRemovalModule"`

**Given** the Swift module `BackgroundRemovalModule`  
**When** JS calls `removeBackground(inputUri: string): Promise<string>`  
**Then** the Swift implementation loads the image via `CIImage(url:options:[.orientation])`, downsamples the long edge to 2048 px, runs `VNGenerateForegroundInstanceMaskRequest`, applies `generateMaskedImage(ofInstances: .all, croppedToInstancesExtent: true)`, encodes as PNG via a shared `static let sharedCIContext = CIContext()`, writes to a `tmp/cutout-<uuid>.png` path, and resolves the Promise with a `file://` URI  
**And** the Swift call executes on a background `DispatchQueue` (expo-modules `AsyncFunction` default) — never blocks the JS thread

**Given** a Vision failure (no subject detected, model load error, IO error)  
**When** `removeBackground` is called  
**Then** the Promise rejects with a structured error matching one of: `BackgroundRemovalError.noSubject`, `BackgroundRemovalError.visionFailed`, `BackgroundRemovalError.ioFailed`  
**And** the JS wrapper maps these to TypeScript-discriminated union types

**Given** repeated invocations of `removeBackground`  
**When** the module is called 5+ times in sequence  
**Then** the `sharedCIContext` singleton is reused across calls  
**And** peak RAM stays under ~100 MB for a 4000×3000 input (verified via Xcode Instruments on iPhone 12)  
**And** median end-to-end latency is under 1.5 s per call (NFR1) — excluding cold-start model load on the first call

**Given** the EXIF orientation of the input image  
**When** the module processes  
**Then** the output cutout respects the source orientation (no upside-down results for portrait-captured garments) — passed to `VNImageRequestHandler(url:, options:[.orientation])`

**Given** `src/index.ts` in the module package  
**When** consumers import it  
**Then** it exposes `requireNativeModule("BackgroundRemoval")` and re-exports a typed `removeBackground(inputUri: string): Promise<string>` plus the `BackgroundRemovalError` union

**Given** the module is added to the project  
**When** `npx expo prebuild --clean && npx expo run:ios` runs  
**Then** the iOS build succeeds  
**And** the module is usable in a dev-client build on an iPhone 12 or newer running iOS 17+

**Dev Notes:**
- Structural template: copy `modules/white-balance/` wholesale and rename. See `project_epic12_architecture.md` for the exact file tree and the known `podspecPath` autolinking trap.
- `AsyncFunction` in expo-modules runs off-main by default — no manual `DispatchQueue.global` needed at the top level, but any CIContext operations should still dispatch to a utility queue if we see main-thread warnings.
- Orientation trap: `VNImageRequestHandler` with `URL` init resolves EXIF orientation automatically ONLY if you pass `[.orientation: cgOrientation]`. Do NOT skip this — it's the most reported Vision bug.
- `generateMaskedImage(ofInstances:from:croppedToInstancesExtent:)` returns a composited `CVPixelBuffer`; wrap in `CIImage(cvPixelBuffer:)` → `CIContext.pngRepresentation(of:format:.RGBA8, colorSpace:CGColorSpaceCreateDeviceRGB())` → `Data.write(to:)`.
- Reject the Promise with `Exception` subclasses — expo-modules handles the JS rejection mapping. See `modules/white-balance/ios/WhiteBalanceModule.swift` for the exact exception pattern.
- This story has NO JS/RN UI work beyond the type wrapper. Visual validation is "a PNG file appears at the returned URI and it looks correctly cut out" — tested on-device with 10 sample photos.
- Rebuild reminder: per `feedback_native_module_rebuild.md`, Metro reload is NOT enough after any Swift change — full `expo run:ios` rebuild every time.
- Tests: mock the native module in Jest via `jest.mock('../../../modules/background-removal')` returning a fake URI; integration test is manual on-device (documented in story completion notes).

---

### Story 13.3a: Capture + Background Removal UI Flow

As a **user who wants to add a new garment to my wardrobe**,  
I want **a guided camera or library capture flow that produces a transparent-background cutout I can preview and decide whether to keep**,  
So that **I can see the result before committing and retry if the cutout is bad, with the same pipeline regardless of whether I took a new photo or picked an existing one**.

**Acceptance Criteria:**

**Given** the user opens the capture flow from S3 "Fotografiar prenda nueva" CTA OR "+ Nueva foto" tab  
**When** the camera screen renders  
**Then** `expo-camera` is initialized for the back camera  
**And** an on-screen guidance overlay reads "Pon la prenda sobre fondo liso, buena luz" (localized EN/ES)  
**And** a capture button is centered at the bottom with min 44×44 pt hit target and `accessibilityLabel="Capture photo"` / "Capturar foto"

**Given** the user selects "Choose from library" inside the capture flow  
**When** they tap it  
**Then** `expo-image-picker` opens the iOS system picker (permission prompt handled; if denied, a friendly sheet explains and exits the flow)  
**And** the returned image URI feeds into the same background-removal + preview pipeline as the camera path — single code path from this point on

**Given** the user captures (or selects) a photo  
**When** the photo URI is obtained  
**Then** the screen transitions to a processing state with a loading indicator and `accessibilityLiveRegion="polite"` announcement "Removing background…" / "Quitando el fondo…"  
**And** `BackgroundRemovalModule.removeBackground(inputUri)` is invoked  
**And** the UI remains responsive throughout (no frozen frames)

**Given** the module returns a cutout URI  
**When** the Promise resolves  
**Then** the user is navigated (stack push) to a dedicated Preview screen showing the cutout on a neutral background  
**And** the Preview screen shows two CTAs: `Repetir` (secondary, discards and returns to camera) and `Usar esta foto` (primary)  
**And** `hapticLight()` fires on arrival at the Preview

**Given** the module rejects with `BackgroundRemovalError.noSubject`  
**When** the Promise rejects  
**Then** a friendly error sheet is shown: "No pudimos encontrar la prenda. Prueba con fondo liso y buena luz." (EN equivalent)  
**And** the user returns to the camera with the same guidance overlay  
**And** no file is written to disk

**Given** the user taps `Repetir` on the Preview screen  
**When** the tap registers  
**Then** the tmp cutout file is deleted  
**And** the user returns to the camera screen (stack pop)

**Given** the user taps `Usar esta foto` on the Preview screen  
**When** the tap registers  
**Then** `saveCutoutAsWardrobeItem(cutoutUri)` is called (implemented in Story 13.3b; stubbed here as a pass-through resolving with a placeholder id for the purposes of this story's dev preview)  
**And** on success, `hapticSuccess()` fires  
**And** navigation returns to S3 with the just-saved item intended to be pre-selected (full wiring completed in Story 13.4b)

**Given** the user taps `Usar esta foto` on the Preview screen AND is on the free tier AND already has 10 wardrobe items  
**When** the tap registers  
**Then** `saveCutoutAsWardrobeItem` rejects with `WardrobePersistenceError.paywall` (wrapping the `WardrobeLimitExceeded` from Story 13.1's repo)  
**And** the Preview screen presents the existing `FREE_FAVORITES_LIMIT` paywall sheet pattern (upgrade CTA + "Later" dismissal)  
**And** the tmp cutout file is deleted on paywall dismissal — no orphans on disk  
**And** on "Later" dismissal the user returns to the Preview with Repetir still available; on successful upgrade, the save retries and succeeds

**Given** the user triggers the capture flow on iOS < 17  
**When** the entry point is evaluated  
**Then** the entry point is hidden (not disabled) per NFR9 / FR16 — see Story 13.4a gating logic

**Given** VoiceOver is active throughout the flow  
**When** transitioning between camera → processing → Preview  
**Then** each state change triggers a `accessibilityLiveRegion="polite"` announcement

**Dev Notes:**
- Files to create: `src/screens/armario/CaptureScreen.tsx`, `src/screens/armario/PreviewScreen.tsx`
- New deps: `pnpm expo install expo-image-picker` — requires native rebuild (`expo run:ios`). `expo-camera` already in repo at `^55.0.15` from Epic 12.
- `saveCutoutAsWardrobeItem(uri): Promise<{ id: string }>` is a stub in this story that Story 13.3b replaces with real WebP persistence + atomic move + repo commit. Keep the signature stable.
- **Paywall wiring:** `addItem()` in the repo throws `WardrobeLimitExceeded` on free tier > 10 items. Story 13.3b wraps that as `WardrobePersistenceError.paywall` in `saveCutoutAsWardrobeItem`. The Preview screen catches the `paywall` case specifically and reuses the existing `FREE_FAVORITES_LIMIT` paywall sheet component — no new paywall UI component in this epic.
- Preview screen is a stack screen (NOT a modal over the camera) — back-swipe from Preview returns to camera naturally
- Tests: mock `BackgroundRemovalModule.removeBackground`, `expo-camera`, `expo-image-picker` at the `jest.setup.ts` level (pattern from Epic 12). Integration-test the state machine of the screens with `@testing-library/react-native`.
- Visual QA: test with 10 real garment photos (mix of colors, patterns, difficult cases like dark-on-dark). Document results in the story completion notes.
- Photo-library permission denial: covered by the AC above — do not crash if `expo-image-picker` returns `canceled`.

---

### Story 13.3b: Wardrobe Persistence & Lifecycle

As a **developer completing the capture-to-wardrobe pipeline**,  
I want **a persistence layer that re-encodes the cutout to WebP, writes master + thumbnail atomically, commits to the repo, rolls back on failure, and sweeps orphaned files**,  
So that **Story 13.3a's "Usar esta foto" tap reliably turns a tmp cutout into a durable, reusable wardrobe item with zero orphans on disk and graceful handling of disk-full or permission errors**.

**Acceptance Criteria:**

**Given** the `saveCutoutAsWardrobeItem(cutoutUri)` function  
**When** it is called with a valid tmp cutout URI  
**Then** the cutout is re-encoded to WebP q=0.9 (via `expo-image-manipulator` `SaveFormat.WEBP`) preserving alpha — saved to `tmp/<uuid>.webp`  
**And** a 300×360 thumbnail is generated at WebP q=0.75 — saved to `tmp/<uuid>-thumb.webp`  
**And** both files are moved (atomic rename) to `Paths.document + /wardrobe/<uuid>.webp` and `Paths.document + /wardrobe/<uuid>-thumb.webp` respectively  
**And** `NSURLIsExcludedFromBackupKey` is set on the thumbnail path (regeneratable)  
**And** ONLY after both files are moved, `wardrobeRepo.addItem({ id, localImagePath, thumbnailPath, createdAt })` is called  
**And** the original tmp cutout file is deleted after the successful repo commit  
**And** the function resolves with `{ id }`

**Given** any failure during encode / move / repo-commit  
**When** the failure is caught  
**Then** any partially-written files in `/wardrobe/` for this uuid are deleted (rollback — no orphans on disk)  
**And** the repo is not left with a row pointing to a missing file  
**And** the Promise rejects with a typed error (`WardrobePersistenceError.encode | .move | .repoAdd | .diskFull`)

**Given** the app is launched and the user has >0 wardrobe items  
**When** the app transitions to foreground  
**Then** an orphan-sweep task runs (throttled to once per 24 h via AsyncStorage key `@wardrobe:last_sweep_at`): list files in `/wardrobe/`, compare to referenced IDs in `@wardrobe:items`, delete unreferenced files  
**And** the sweep runs off the main thread (via `InteractionManager.runAfterInteractions`)  
**And** the sweep never deletes files created within the last 60 s (grace window for in-flight saves)

**Given** disk is full or the wardrobe directory is not writable  
**When** `saveCutoutAsWardrobeItem` runs  
**Then** the Promise rejects with `WardrobePersistenceError.diskFull`  
**And** Story 13.3a's Preview screen shows a friendly error sheet: "No hay espacio en el dispositivo" (EN equivalent)  
**And** no partial files are left on disk  
**And** the user returns to the Preview with Repetir / Usar still available

**Given** the 100-item wardrobe case  
**When** 100 items × WebP q=0.9 masters + WebP q=0.75 thumbnails are on disk  
**Then** total occupied space in `/wardrobe/` is < 50 MB (NFR3) — verify with a dev-only script or instrumentation, documented in story completion notes

**Dev Notes:**
- Files to create: `src/lib/wardrobeImages.ts` (WebP re-encode + thumbnail utility), `src/lib/wardrobeFiles.ts` (atomic move + orphan sweep + backup-flag helper), `src/lib/wardrobeErrors.ts` (typed error union)
- New deps: `pnpm expo install expo-image-manipulator`, `pnpm expo install expo-file-system` — require native rebuild (`expo run:ios`)
- `expo-file-system` uses the NEW class-based API: `import { File, Directory, Paths } from 'expo-file-system'`. Fall back to `/legacy` only if a regression blocks us.
- Orphan-sweep timestamp key: `@wardrobe:last_sweep_at`
- This story has NO new screens — it replaces the stub from Story 13.3a with real persistence. Visual validation is: on-device, save 3 cutouts via 13.3a, verify files appear in `/wardrobe/`, kill the app, reopen, verify items persist and thumbnails render in S3 grid (once 13.4b lands).
- Tests: unit-test encode/move/rollback logic by mocking `expo-image-manipulator` + `expo-file-system`. Orphan sweep: seed the data layer with 3 items + 4 files, run sweep, assert 1 file deleted.
- The WebP q=0.9 choice is calibrated — raise to q=0.95 or fall back to PNG if alpha-edge artifacts are observed during Story 13.3a's visual QA.

---

### Story 13.4a: Zero State + Ficha Wada + Shared Components

As a **user entering a favorited Wada combination for the first time (or with no assignments yet)**,  
I want **a welcoming zero-state screen and a clear Ficha Wada showing each color slot and my progress**,  
So that **I understand what I'm about to build and can see at a glance which slots are assigned and which are still empty**.

**Acceptance Criteria:**

**Given** the user taps a favorited combo that has ZERO assignments AND has never been opened for assignment before  
**When** the screen renders  
**Then** the S0 Zero State screen appears: serif hero `Viste esta paleta con tu ropa`, subtitle explaining the flow, Wada dots + combo-name row, 3 empty polaroid cards (each tinted with its Wada color, center `+`), primary CTA `Empezar a asignar prendas`, escape `Ahora no`  
**And** tapping `Empezar a asignar prendas` transitions to S2 Ficha Wada  
**And** tapping `Ahora no` pops back to Favorites  
**And** a `@wardrobe:s0_seen_for_<combinationId>` flag is set on the first CTA tap (so S0 is skipped next time for that combo)  
**And** if Reduce Motion is enabled, S0's polaroid pre-viz appears without entry animation

**Given** the user taps a favorited combo that has >0 assignments OR has seen S0 before  
**When** the screen renders  
**Then** S2 Ficha Wada appears directly (no S0 intermediate)

**Given** the S2 Ficha Wada screen renders  
**When** it mounts  
**Then** the nav shows `← [combo name]` + a completeness badge (`✓ 3/3` green or `X/3` amber)  
**And** the body shows an instruction line and 3 color-slot cards (one per color in the combination)  
**And** each slot card displays: Wada color swatch, assigned-item photo thumbnail OR dashed empty slot, Wada color name, link `Asignar →` (empty) or `Cambiar →` (filled) / separate `Quitar` action (filled — wired in Story 13.4b)  
**And** a footer primary CTA `Ver tu look`  
**And** `Ver tu look` navigates to S4 Tu Look (Story 13.5) if complete, S5 Sugerencia Armonía (Story 13.6) if partial  
**And** tapping `Asignar →` or `Cambiar →` opens S3 Armario Picker (wired in Story 13.4b; for this story it may render a stub "Coming in 13.4b")

**Given** Armario Virtual entry points (S0, S2, plus future S3/S4/S5)  
**When** the device runs iOS < 17  
**Then** these entry points are not rendered at all (no "Asignar prendas" button on Favorites cards)  
**And** the Favorites screen behaves exactly as pre-Epic-13 for these users (NFR9 / FR16)  
**And** the iOS-17 gate helper is centralized at `src/lib/platform.ts` and all entry points use it

**Given** VoiceOver is active across S0 / S2  
**When** navigating with the rotor  
**Then** every interactive element has a meaningful `accessibilityLabel` localized in the device locale  
**And** reading order flows: nav → heading → body elements → footer CTA (no skipped or duplicated elements)

**Dev Notes:**
- Screens: `src/screens/armario/S0ZeroState.tsx`, `src/screens/armario/S2FichaWada.tsx`
- Shared components extracted in this story: `src/components/armario/PolaroidCard.tsx` (empty-tinted / filled variants), `src/components/armario/WardrobeItemThumb.tsx`, `src/components/armario/WadaColorDot.tsx`, `src/components/armario/CompletenessBadge.tsx`
- Navigation: extend existing `ColorsStackParamList` or add a new `ArmarioStack` — decide at story kickoff based on how deeply linked this flows into existing stacks
- iOS-17 gate: `Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 17` — centralize in `src/lib/platform.ts`; Story 13.4b, 13.5, 13.6 all reuse this helper
- Favorites card modification: add an `AssignButton` child on each combo card (hidden when `!isIOS17OrNewer`) — design matches existing affordances from Epic 11. Full CTA state variants (`Ver tu look` / `Completa tu look` / `Asignar prendas`) land in Story 13.6
- Copy in both EN and ES at merge time — append to `src/i18n/locales/en.json` and `.../es.json` under `armario.*`
- Tests: mock `wardrobeRepo` and `useWardrobeStore`. Snapshot S0 and S2 at 0/3, 1/3, 3/3 states. Regression-check Favorites renders unchanged when `wardrobe:items` is empty.
- **Merge coordination:** 13.4a MUST NOT merge before 13.3b. Without 13.3b, the `Asignar →` stub would be the only path and the story has no user-visible value on its own. Dev can proceed in parallel, merge sequencing is the gate.

---

### Story 13.4b: Armario Picker + Assignment Mechanics

As a **user with items in my wardrobe**,  
I want **an Armario Picker that lets me assign existing items or trigger the capture flow, plus clean unassign and unfavorite-cascade behavior**,  
So that **the assignment loop takes just a few taps and destructive actions are clearly explained before they apply**.

**Acceptance Criteria:**

**Given** the user taps `Asignar →` or `Cambiar →` on an S2 slot  
**When** the tap registers  
**Then** the S3 Armario Picker bottom sheet opens over S2  
**And** the sheet header shows `Elige para [Wada color name]` with a colored dot  
**And** tabs render: `Mi Armario` (default selected) and `+ Nueva foto`

**Given** the `Mi Armario` tab is active in S3  
**When** the tab content renders  
**Then** all wardrobe items are shown as a 3-column grid with transparent-background thumbnails  
**And** items already assigned to OTHER slots of this combo are rendered with reduced opacity + a subtle "assigned elsewhere" label (soft conflict, not a block — user can still pick to move the item)  
**And** tapping an item shows a selection ring affordance  
**And** dismissing the sheet (swipe-down or tap-outside) with a selection active: calls `wardrobeRepo.assign(combinationId, colorIndex, wardrobeItemId)`, fires `hapticLight()`, closes the sheet, and returns to S2 with the slot now filled

**Given** the `+ Nueva foto` tab is active in S3 OR the footer `Fotografiar prenda nueva` CTA is tapped  
**When** the tap registers  
**Then** the user navigates into the Story 13.3a capture flow (modal presentation over S3)  
**And** on successful `Usar esta foto` (backed by Story 13.3b persistence), the capture flow returns to S3 with the just-created item pre-selected  
**And** dismissing the sheet then assigns that item to the triggering slot

**Given** the user taps `Quitar` on a filled slot in S2  
**When** the tap registers  
**Then** `wardrobeRepo.unassign(combinationId, colorIndex)` is called  
**And** the slot reverts to dashed empty state  
**And** the underlying `WardrobeItem` is NOT deleted from `@wardrobe:items` (FR14)

**Given** the user unfavorites a combo that has assignments  
**When** they confirm the unfavorite (existing Favorites flow)  
**Then** a confirmation sheet reads "Se quitarán las X prendas que habías asignado a esta paleta. Las fotos seguirán en tu Armario." (EN equivalent)  
**And** on confirm, `wardrobeRepo.cascadeDeleteAssignmentsForCombination(combinationId)` is called  
**And** the wardrobe items remain available for other combos

**Given** VoiceOver is active on S3  
**When** navigating with the rotor  
**Then** every interactive element has a meaningful `accessibilityLabel` localized in the device locale  
**And** "assigned elsewhere" items announce their conflict state  
**And** the swipe-down-to-confirm gesture is documented via accessibility hint

**Dev Notes:**
- Screen: `src/screens/armario/S3ArmarioPicker.tsx`
- **Bottom sheet library decision (DECIDE BEFORE STORY KICKOFF, not at story start):** `@gorhom/bottom-sheet` (new dep, mature, VoiceOver-tested) vs RN `Modal` with swipe handler (no new dep, manual gesture plumbing). Recommendation: `@gorhom/bottom-sheet` — the gesture + backdrop behavior matches the UX spec §S3 and wrestling with Modal for this is a known rabbit hole.
- Shared components reused from Story 13.4a: `PolaroidCard`, `WardrobeItemThumb`, `WadaColorDot`
- Sheet dismissal semantics: confirming on swipe-down is non-standard but matches the UX spec §S3. Test VoiceOver announces the gesture.
- **Paywall semantics:** the `Mi Armario` tab (selecting an existing item) is NEVER gated — `assign()` does NOT pass through `addItem()`, so reuse across combos is unlimited even for free users who've already hit the 10-item cap. Only the `+ Nueva foto` branch can trigger the paywall (via Story 13.3a's capture flow). This preserves FR6 (one garment serves many palettes) as a free-tier value prop.
- Unfavorite cascade hooks into the existing `FavoritesContext.toggle()` flow — add an intercept that inspects `getAssignmentCount(id)` first and shows the confirmation sheet if >0
- Copy in both EN and ES — add under `armario.picker.*` and `armario.unfavorite_confirm.*`
- Tests: mock `wardrobeRepo` and `useWardrobeStore`. Integration-test the full S2 → S3 → S2 assignment loop with two existing items. Integration-test the Nueva foto branch with a mocked capture flow returning a pre-selected id. Test unfavorite cascade confirmation with X=1, X=2, X=3 items.

---

### Story 13.5: S4 Tu Look — Skia Composition + Share

As a **user who has completed all assignments for a Wada combination**,  
I want **to see my outfit as a beautiful polaroid cascade AND share it as a crisp 1080×1920 image carrying the "Outfinder · Sanzo Wada, 1933" signature**,  
So that **I can use the look as a real styling reference AND my shares carry a credible, editorial, anti-AI-slop credential everywhere they're posted**.

**Acceptance Criteria:**

**Given** the user taps `Ver tu look` on an S2 Ficha Wada with a complete combination (3/3)  
**When** the screen renders  
**Then** S4 Tu Look displays with: nav `← [combo name] ·`, serif combo name (Noto Serif JP), `✓ Look completo` green badge, the polaroid cascade rendered via `@shopify/react-native-skia <Canvas>`, Wada color-dots row, `Combinación Wada` label, footer `Outfinder · Sanzo Wada, 1933` at 60% opacity, primary CTA `Compartir look`, secondary CTA `Explorar más paletas`

**Given** the Skia polaroid cascade renders  
**When** `<Canvas>` paints  
**Then** 3 polaroid cards are drawn in vertical cascade with rotations `+2°, 0°, −2°` applied via `<Group transform origin={centerOfCard}>`  
**And** overlap between cards is ~32 pt (negative-offset equivalent in Skia absolute coords)  
**And** each polaroid is white on cream background with a drop shadow via `<Box box={rrect(...)}><BoxShadow dx={0} dy={8} blur={20} color="rgba(0,0,0,0.15)"/></Box>`  
**And** each garment image is drawn inside a rounded-rect clip via `<Group clip={rrect(rect(...), 8, 8)}><Image image={gImg} fit="contain"/></Group>`  
**And** the Wada color label beneath each image uses Noto Serif JP via `useFont(require('@expo-google-fonts/noto-serif-jp/NotoSerifJP_400Regular.ttf'), 14)`  
**And** the Canvas does not render until `font && allImages` have loaded (no empty first-frame flash)

**Given** the user taps `Compartir look`  
**When** the tap registers  
**Then** `hapticLight()` fires  
**And** an offscreen Skia surface is created: `Skia.Surface.MakeOffscreen(1080 * density, 1920 * density)`  
**And** the surface canvas is scaled via `canvas.scale(density, density)`  
**And** the SAME `drawPolaroidStack(canvas, props)` function used for on-screen preview is invoked on the offscreen canvas (single source of truth — zero drift)  
**And** `surface.flush()` is called  
**And** the snapshot goes through `.makeImageSnapshot().makeNonTextureImage().encodeToBytes(ImageFormat.JPEG, 92)`  
**And** the bytes are written via `File.write(Paths.document + /share/look-<uuid>.jpg, bytes, { encoding: Base64 })`  
**And** `Sharing.shareAsync(uri, { mimeType: "image/jpeg", UTI: "public.jpeg" })` opens the native iOS share sheet

**Given** the share sheet is dismissed (shared OR cancelled)  
**When** the dismissal completes  
**Then** the share file at `/share/look-<uuid>.jpg` is deleted via `File.delete()`

**Given** the offscreen render + encode + write pipeline  
**When** measured on iPhone 12+  
**Then** total elapsed time from tap to share sheet appearance is under 1 s (NFR2)  
**And** the JPEG q=92 artifact is between 180 KB and 420 KB (deterministic range per Skia encoder behavior at this resolution)

**Given** the Skia S4 composition renders on different iPhones at the same resolution  
**When** the same combo is rendered on iPhone 12 / 13 / 14 / 15 / 16  
**Then** the exported JPEGs are pixel-identical (byte-level diff acceptable to JPEG entropy coding variance only, not layout) — NFR14  
**And** the Canvas preview is visually identical too (zero drift between preview and exported artifact)

**Given** the share composition  
**When** inspected  
**Then** the footer reads EXACTLY `Outfinder · Sanzo Wada, 1933` (not localized — this is a brand signal, not a UI string, consistent with Epic 11.2 rule for Wada names)  
**And** the combo name at top IS localized: it uses the Wada name (itself not translated) but the surrounding frame uses localized strings where applicable  
**And** no emoji, gradient, or "AI"-connoting glyph appears anywhere in the artifact

**Given** Reduce Motion is enabled  
**When** the user navigates to S4  
**Then** the polaroid cascade appears instantly with no entry animation  
**And** standard Skia rendering still runs (Skia is a render engine, not an animation trigger — nothing to suppress)

**Given** VoiceOver is active on S4  
**When** the user focuses  
**Then** the `<Canvas>` is wrapped in an accessibility node with label `Outfit: <combo name>, 3 garments assigned. Double-tap the Share button to share your look.` (localized)  
**And** the `Compartir look` button announces `Compartir look. Botón.`  
**And** the `Explorar más paletas` button announces `Explorar más paletas. Botón.`

**Dev Notes:**
- Files to create: `src/screens/armario/S4TuLook.tsx` (the screen), `src/lib/share/drawPolaroidStack.ts` (the shared imperative render function — this is the heart of the story), `src/lib/share/exportLookImage.ts` (offscreen surface + encode + write pipeline)
- `drawPolaroidStack(canvas: SkCanvas, props: PolaroidStackProps): void` is called by BOTH the on-screen `<Canvas><Picture picture={picture}/></Canvas>` (wrapped via `createPicture(drawPolaroidStack)`) AND the offscreen export path. Do not duplicate layout logic.
- Font loading: reuse the Noto Serif JP font already loaded at App.tsx via `@expo-google-fonts/noto-serif-jp`. `useFont(require('@expo-google-fonts/noto-serif-jp/NotoSerifJP_400Regular.ttf'), 14)` — confirm the exact sub-path at story start.
- Garment image loading from disk: `Skia.Data.fromURI('file://' + path) → Skia.Image.MakeImageFromEncoded(data)` — NOT `useImage` for disk paths (see research §Skia Asset loading)
- `makeNonTextureImage()` before encode is MANDATORY — skipping it produces black exports. Comment this inline in `exportLookImage.ts`.
- Do NOT run `await`-heavy code (permission prompts, fetch, etc.) between `surface.flush()` and `makeImageSnapshot()` — known partial/black-snapshot bug (Skia issue #1513).
- Share file in `Paths.document + /share/` — excluded from backup; set `NSURLIsExcludedFromBackupKey` on the directory.
- No analytics — project is craft-driven, no SDK, no event queue. See `feedback_no_analytics.md`. The user-facing share UX is the entire product signal here.
- Tests: unit-test `drawPolaroidStack` by rendering to a headless offscreen surface and snapshotting the bytes (golden-image tests pattern from Story 2.5). Integration-test the S4 screen's share CTA with a mocked `Sharing.shareAsync`.
- Visual QA: manual review on 3 iPhones (12, 14 Pro, 16 Pro Max). Compare on-screen preview to shared artifact pixel-by-pixel (crop same region). Any drift is a blocker.

---

### Story 13.6: S5 Sugerencia Armonía + Favorites Badges, Thumbnails, Sort

As a **user with partially assigned or unassigned Wada combinations**,  
I want **to see clearly which combinations are closest to completion, which are missing pieces, and what color I still need — AND have the completed ones rise to the top of my Favorites list**,  
So that **I can spot my next styling opportunity at a glance and know exactly what's left to finish a look**.

**Acceptance Criteria:**

**Given** the user taps `Ver tu look` on an S2 Ficha Wada with a partial combination (1/3 or 2/3)  
**When** the screen renders  
**Then** S5 Sugerencia Armonía displays with: nav `← [combo name]` + amber partial badge (`X/3 prendas`), subtitle `Completa el look para ver la armonía completa` (localized)  
**And** a polaroid cascade identical in layout to S4 but with the UNASSIGNED slot(s) rendered as an empty card: light-blue background `#EEF2F8`, Wada-colored dashed border, central `+` icon, label `Añadir prenda en [color name]`  
**And** a suggestion card at the bottom shows: lateral vertical accent in the missing color, title `Completa la armonía`, dataset-driven body copy (per UX-DR10 / spec §6.4), CTA `Añadir prenda en [color name]`

**Given** the suggestion copy logic  
**When** `getSuggestionCopy(colorIndex, totalColors)` is called  
**Then** for the last color index it returns `Ideal para un accesorio: zapatos, bolso o cinturón.`  
**And** for the first color index it returns `Suele ser la pieza principal del look.`  
**And** for middle indices it returns `Puede ser una segunda capa o prenda de punto.`  
**And** EN equivalents exist for all three variants  
**And** unit tests cover all three branches and both locales

**Given** the user taps the suggestion card CTA or the empty polaroid  
**When** the tap registers  
**Then** S3 Armario Picker opens (Story 13.4b reuse) targeting the specific empty color slot  
**And** on successful assignment, the S5 screen re-renders; if the combo is now complete, a transition routes the user to S4 Tu Look

**Given** the Favorites list renders with wardrobe state present  
**When** each combo card renders  
**Then** a completeness badge appears in the top-right: `3/3 prendas` with green chip for complete, `X/3 prendas` with amber chip for partial, `Sin prendas` with grey chip for empty  
**And** for combos with >0 assignments, a thumbnail strip appears below the color palette preview showing small square previews of the assigned wardrobe item thumbnails  
**And** the contextual CTA changes: `Ver tu look →` for complete, `Completa tu look →` for partial, `Asignar prendas →` for empty (localized)

**Given** the Favorites list sorts  
**When** multiple combos with different completeness exist  
**Then** sort order is: complete first (sorted by `assignedAt` desc of the latest assignment in the combo), then partial (sorted by `assignedAt` desc), then empty (sorted by the original favoritedAt desc)  
**And** a user who has never assigned anything sees the same sort order as pre-Epic-13 (NFR9 parity)

**Given** the user has iOS < 17 OR zero wardrobe items  
**When** the Favorites list renders  
**Then** no completeness badge, thumbnail strip, or assign CTA appears — the card renders exactly as pre-Epic-13 (NFR9)  
**And** the sort order is unchanged from pre-Epic-13

**Given** VoiceOver is active on S5 and on the Favorites list  
**When** focusing  
**Then** the empty polaroid announces `Falta [Wada color name]. Doble-tap para añadir.`  
**And** the suggestion card CTA announces `Añadir prenda en [Wada color name]. Botón.`  
**And** each Favorites card announces its completeness state (e.g., `Red Plum Evening. 2 de 3 prendas asignadas.`)

**Given** unit tests for the sort logic  
**When** `pnpm test` runs  
**Then** tests cover: all-complete list sort, mixed list sort, empty-wardrobe baseline unchanged, iOS-17 gating flag respected  

**Dev Notes:**
- Files to create: `src/screens/armario/S5SugerenciaArmonia.tsx`, `src/lib/armario/getSuggestionCopy.ts` (+ `.test.ts`), `src/lib/armario/favoritesSort.ts` (+ `.test.ts`), `src/components/armario/CompletenessBadge.tsx`, `src/components/armario/AssignedThumbnails.tsx`
- Reuse `drawPolaroidStack` from Story 13.5 — add a `props.emptySlots: number[]` parameter so the same imperative function handles the empty-slot polaroid variant. This keeps S4 and S5 visually consistent.
- Reuse `PolaroidCard`, `WardrobeItemThumb`, `WadaColorDot`, `CompletenessBadge` extracted during Story 13.4a.
- Sort integration: extend existing Favorites list's sort pipeline with a prepend step that partitions by completeness. Do NOT replace the existing sort pills — stack on top of them.
- i18n keys: add under `armario.s5.*`, `armario.favorites_badge.*`, `armario.suggestion.*`. All three suggestion copy variants in EN + ES at merge time.
- Visual parity: ensure the empty-slot polaroid's dashed border color matches the Wada swatch for that color — stroke via Skia `<Path>` with `strokeWidth: 2` and `pathEffect={Skia.PathEffect.MakeDash([8, 6], 0)}`.
- The "transition to S4 when combo becomes complete on S5" is subtle: on successful `wardrobeRepo.assign` that flips `isCombinationComplete` to true, `navigation.replace('S4TuLook', { combinationId })` — use `replace`, not `push`, to prevent back-stack flicker (same pattern as Epic 12 capture → combinations).
- Tests: snapshot the S5 screen at 0/3, 1/3, 2/3 states. Unit-test the sort with a seeded list of 5 combos at mixed completeness states.

---

## Definition of Done (Epic 13)

A story in Epic 13 is merge-ready only when ALL of the following are true:

1. **All AC verified** point-by-point (CLAUDE.md §Acceptance Criteria Verification) — the story's final task includes this checklist
2. **Tests written** for every AC describing user interaction — `testID` attributes only, co-located `.test.ts(x)` files, `pnpm test` green
3. **Type check** passes — `npx tsc --noEmit` clean
4. **Lint** passes — `pnpm lint` clean
5. **Accessibility audit** — 44×44 pt touch targets, `accessibilityLabel` + `accessibilityRole` on every interactive element, VoiceOver live-region announcements on state transitions, `useReducedMotion()` respected
6. **Localization** — every new user-visible string present in EN + ES at merge time (Wada names exempt — see Epic 11.2)
7. **Adversarial code review** passes — `/bmad-code-review` run and all High/Medium findings addressed (CLAUDE.md §Mandatory Code Review)
8. **On-device validation** — manual smoke test on physical iPhone 12+ running iOS 17+ for any story touching camera, Vision, or Skia (Stories 13.2, 13.3a, 13.3b, 13.5). Document results in the story completion notes.
9. **Regression check** — all 518+ existing tests pass; Epic 12 Color Capture pipeline verified unchanged on a fresh simulator run
10. **Privacy sanity check** — grep for any accidental network call, analytics payload with photo bytes, or logging of user photo paths (NFR8)

### Epic-level DoD (before merging epic-13 → epic-1)

- All 6 stories shipped with their own DoD
- `docs/project-context.md` updated with Armario Virtual architecture notes (per `feedback_agent_context.md`)
- `project_armario_virtual_research.md` memory updated with any deviations discovered during implementation
- End-to-end manual playthrough recorded: new install → capture 3 photos → assign all → S4 share → Favorites shows 3/3 badge
- App Store metadata review: consider updating screenshots + keywords to reference "virtual wardrobe" / "armario" (separate from engineering scope — flag to release-manager agent)
- Retrospective (`/bmad-retrospective`) before closing the epic

## Gating & Sequencing

Writing this epic does NOT start the work. The go/no-go for Epic 13 is a **product-taste call by the user**, informed by their own use of v1.3.0 and qualitative feedback from friends/beta users. There is no metric gate (analytics were scoped out 2026-04-17 — Outfinder is craft-driven, not data-driven; see `feedback_no_analytics.md`).

When the user decides to proceed:

1. Invoke `bmad-create-epics-and-stories` to decompose each of the 8 stories into a dedicated story spec file with Dev Notes.
2. Run the stories sequentially per the Epic Dependencies graph above.
3. Bottom-sheet library decision for Story 13.4b must be resolved **before** sprint planning (recommendation in Story 13.4b Dev Notes: `@gorhom/bottom-sheet`).
4. Refresh `docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md` with a top-of-doc banner pointing to this epic + research as sources of truth (supersedes the feature spec's Skia-less and iOS-15-fallback guidance).

## Open Questions (to resolve at story start, not before)

These are flagged as non-blockers for writing the epic but should be addressed at Story N kickoff:

1. ~~**iPad layouts for S0–S5**~~ — **RESOLVED 2026-04-19**: iPhone-only for Epic 13. iPad base is ~2.5% of current downloads (1/40), insufficient to justify 20–30% scope increase per UI story. If Armario Virtual lands well and the iPad base grows, open a follow-up Epic 14 "Armario iPad polish". No `useResponsive()` or breakpoint logic in this epic — stretched iPad rendering is acceptable.
2. ~~**Premium gating for wardrobe**~~ — **RESOLVED 2026-04-19**: `FREE_WARDROBE_LIMIT = 10` (constant, tunable post-launch). Gate enforced at the data layer: `wardrobeRepo.addItem()` throws `WardrobeLimitExceeded` on free tier when `items.length >= 10`. Paywall UI surfaces after the Preview screen's "Usar esta foto" tap — mirrors the existing `FREE_FAVORITES_LIMIT` UX pattern. **Reusing existing items** from the armario across combos does NOT count against the limit — only adding new items via the capture flow does. Rationale: 10 lets the user complete ~3 combos and experience FR6 (one garment serves many palettes) before hitting paywall; 5 gates too early, killing the "aha".
3. **Orphan sweep frequency**: 24 h throttle is research-suggested. If post-launch we see disk bloat in the wild, lower to 12 h. No action pre-launch.
4. **Sort strategy for partial combos** (Story 13.6): "sorted by latest-assignment timestamp" is one option. Alternative: "sorted by proximity to completion (2/3 before 1/3)". Decide with visual prototype at Story 13.6 start.
5. **S0 seen flag granularity**: per-combo (`@wardrobe:s0_seen_for_<id>`) vs global (`@wardrobe:s0_seen`). Epic writes "per-combo" — revisit if UX testing shows the first-time UX is not distinctive enough to justify per-combo.
6. **"Use photo without cutout" escape hatch**: research suggests this as a fallback when Vision repeatedly fails on dark-on-dark garments. Decide at Story 13.3a kickoff whether to add this path or rely on Repetir only.
