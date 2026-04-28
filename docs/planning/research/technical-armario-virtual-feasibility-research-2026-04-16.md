---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'Armario Virtual — feasibility & stack integration'
research_goals: 'Validate technical assumptions of the Armario Virtual spec (Epic 13 candidate) against the current Outfinder stack (RN 0.83.2 + Expo SDK 55 + iOS 17+) and resolve the 7 open questions in section 9 of the spec with rigorous source-verified answers.'
user_name: 'Alejandro'
date: '2026-04-16'
web_research_enabled: true
source_verification: true
---

# Research Report: Armario Virtual — Technical Feasibility

**Date:** 2026-04-16
**Author:** Alejandro
**Research Type:** technical
**Input spec:** `docs/planning/feature-armario-virtual/ARMARIO-VIRTUAL.md`

---

## Research Overview

Armario Virtual is the Epic 13 candidate that turns Outfinder Favorites into personal outfits: the user assigns real garment photos to each Wada color slot of a saved combination, and the app auto-composes a "polaroid look" for sharing. The spec (2026-04-16) is UX-complete; this research validates the technical stack decisions required before story breakdown.

### Already-known baseline (from codebase inspection, 2026-04-16)

| Item | State in repo | Implication for spec |
| --- | --- | --- |
| `react-native-view-shot` | ✅ installed `4.0.3`, used in `src/lib/share.ts` via `captureRef` | Section 9 Q7 effectively resolved — pattern already works with Expo SDK 55 |
| `expo-sharing` | ✅ installed `~55.0.11`, wraps native share sheet | Share flow for S4 already has a validated helper (`shareOutfit`) |
| `@react-native-async-storage/async-storage` | ✅ `2.2.0` | Default storage path for `WardrobeItems` + `CombinationAssignments` is available |
| `expo-file-system` | ❌ NOT installed (contradicts spec §9 Q1 assumption) | Must be added as a new dep OR image persistence design must change |
| Local Expo module pattern | ✅ `modules/white-balance/` working (Epic 12) with known autolinking workaround (`podspecPath` in `expo-module.config.json`) | Background-removal module can reuse the exact pattern |
| Native baseline | RN 0.83.2 + iOS 17 effective minimum (SwiftWhiteBalance already sets that floor) | `VNGenerateForegroundInstanceMaskRequest` (iOS 17+) is available to all supported devices — no iOS 15/16 fallback needed |
| Skia, Reanimated, NativeWind | Available | S4 is pure CSS layout; no Skia required (confirmed in spec §6.2) |

---

## Technical Research Scope Confirmation

**Research Topic:** Armario Virtual — feasibility & stack integration
**Research Goals:** Validate the spec's technical assumptions against the real stack and resolve section 9's 7 open questions with sourced answers, so the feature can be broken into an implementable Epic 13 story set.

**Technical Research Scope:**

- Architecture analysis — how Armario Virtual integrates with existing Favorites/Combinations stack
- Implementation approaches — background-removal pipeline as a local Expo module following the `WhiteBalanceModule` pattern
- Technology stack — Vision framework APIs, storage layer, view capture/share
- Integration patterns — data flow `AsyncStorage ↔ expo-file-system ↔ RN Views ↔ native module`
- Performance considerations — image size budget, PNG-with-alpha compression, grid rendering with 20+ items

**Research Methodology:**

- Multi-source web validation for every native/framework claim
- Confidence levels on uncertain items
- Cross-verification against the real `package.json` and `modules/` layout
- Direct answers to each of the spec's 7 open questions in the synthesis step

**Scope Confirmed:** 2026-04-16

---

<!-- Content is appended by subsequent research steps below -->

## Technology Stack Analysis

### Background Removal — Apple Vision Framework

**Recommendation: `VNGenerateForegroundInstanceMaskRequest` (iOS 17+) exclusively. Do not ship the iOS 15/16 fallback.**

`VNGenerateForegroundInstanceMaskRequest` uses a newer segmentation model with sub-pixel mask refinement along edges; demoed with clothing/product subjects at WWDC23 _Lift subjects from images in your app_ (same tech behind the Photos app "Lift Subject" long-press). The older `VNGenerateForegroundMaskRequest` is saliency-based, produces a coarse binary-ish alpha, and fails visibly on fringe/sleeves, dark-on-dark, and patterned garments.

_Quality on garments:_
- Plain garments on light background: excellent.
- Plaid / small prints: instance-mask preserves edge detail; foreground-mask chews edges.
- Semi-transparent (chiffon, lace): both fail — Vision returns near-binary alpha, no partial transparency through sheer fabric. Known limitation per Apple forums (https://developer.apple.com/forums/thread/737707).
- Contact shadows: both keep shadows attached. Mitigation = shoot on white background; the UX guidance in spec §4 already plans for this.
- Dark garment on dark background: weakest failure mode for both; instance-mask still usable.

_API ergonomics:_ observation exposes `.generateMaskedImage(ofInstances:from:croppedToInstancesExtent:)` returning a composited `CVPixelBuffer` → convert to `CIImage` → `CIContext.pngRepresentation` → disk. Recipe confirmed in Apple sample _Lifting a Subject From an Image_ (https://developer.apple.com/documentation/vision/lifting-a-subject-from-an-image).

_Performance (iPhone 12+, ~3 MB HEIC 4000×3000):_ 250–600 ms for the Vision request, +100–200 ms PNG encode. Cold-start spike to ~1.2 s on first call (model load). Confidence: medium — measure on target hardware.

_iOS 17 coverage (early 2026):_ ~96% per Mixpanel iOS trends; Apple's own App Store dashboard (Dec 2024 snapshot) showed 86% on recent iPhones. Confidence: medium on exact figure, high on "overwhelming majority."

_Sources:_
- https://developer.apple.com/videos/play/wwdc2023/10176/
- https://developer.apple.com/documentation/vision/vngenerateforegroundinstancemaskrequest
- https://developer.apple.com/documentation/vision/lifting-a-subject-from-an-image
- https://developer.apple.com/forums/thread/737707
- https://mixpanel.com/trends/ios-versions
- https://developer.apple.com/support/app-store/

### Share Artifact Rendering — Skia-only (REVISED, supersedes earlier view-shot recommendation)

**Recommendation: use `@shopify/react-native-skia 2.5.1` for both the on-screen S4 preview AND the offscreen export. `react-native-view-shot` stays in the codebase for other screens but is NOT used for the Armario Virtual share artifact.**

This revises the earlier "keep view-shot for S4" recommendation after two pieces of input: (1) the product framing that the share artifact is a marketing surface rather than a UI screenshot, and (2) a deep dive into Skia's `makeImageSnapshot` + offscreen surface pattern.

#### Why Skia wins for this specific use case

| Dimension | Skia | view-shot 4.0.3 |
| --- | --- | --- |
| Determinism across devices | ✅ pixel-identical | ❌ varies with PixelRatio, safe-area, iOS version |
| Export resolution independent of layout | ✅ `Skia.Surface.MakeOffscreen(1080, 1920)` arbitrary | ❌ bound to view-size × device density |
| Brand chrome (serif text at 1080×1920) | ✅ vector text, crisp at any resolution | ❌ rasterizes screen text → blurry at 3× |
| Anti-AI-slop signal integrity | ✅ "Sanzo Wada, 1933" rendered as editorial-grade type | ❌ rasterized RN Text has antialiasing artifacts |
| Future extensibility (vintage filter, watermark variants, multi-preset) | ✅ native: ColorMatrix, Shaders, BlendModes | ❌ not viable without re-architecting |
| Dev time for V1 | ~3–5 days | ~1 day |

The first five rows compound on every future share. The sixth is a one-time cost — and Outfinder already paid part of the Skia learning curve in Story 2.5 (ColorMatrix on garments).

#### The offscreen surface pattern

`makeImageSnapshot` on a `Canvas` ref only takes an optional crop rect — **there is no scale argument**. Arbitrary resolution requires rendering to a `Skia.Surface.MakeOffscreen(W*pd, H*pd)` and calling `canvas.scale(pd, pd)` on it. Confirmed against the current `types.ts` in the Skia main branch (https://github.com/Shopify/react-native-skia/blob/main/packages/skia/src/views/types.ts) and well-documented by Zawada (https://dev.to/dawidzawada/offscreen-drawing-with-react-native-skia-1m5e).

```ts
const surface = Skia.Surface.MakeOffscreen(1080 * density, 1920 * density);
const canvas = surface.getCanvas();
canvas.scale(density, density);
drawPolaroidStack(canvas, props);  // same draw ops used on-screen
surface.flush();
const snapshot = surface.makeImageSnapshot().makeNonTextureImage();
const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, 92);
await File.write(path, bytes);
```

`makeNonTextureImage()` is required to decouple the image from its GPU context before encoding — omission gives a black export.

#### Implementation pattern — single source of truth

One imperative composition function `drawPolaroidStack(canvas, props)`. Used in two places:

1. **On-screen preview (S4):** a declarative `<Canvas>` driving a `<Picture>` that wraps `drawPolaroidStack`.
2. **Share export:** `Skia.Surface.MakeOffscreen(1080, 1920)` → same `drawPolaroidStack(surface.getCanvas(), props)` → snapshot → encode → disk.

This guarantees zero drift between what the user sees and what they share — which is the single defect class users flag fastest ("this doesn't look like what I shared").

#### Skia composition specifics

- **Polaroid shadow:** `<Box box={rrect(...)}><BoxShadow dx={0} dy={8} blur={20} color="rgba(0,0,0,0.15)"/></Box>` — faster than the generic `<DropShadow>` image filter for rounded rectangles (https://shopify.github.io/react-native-skia/docs/shapes/box/).
- **Rounded image corners:** `<Group clip={rrect(rect(x,y,w,h), r, r)}><Image .../></Group>` (https://shopify.github.io/react-native-skia/docs/group/).
- **Transform + rotation:** `<Group transform={[{translateX},{translateY},{rotate}]} origin={{x,y}}>` — always pass `origin` or rotation is around top-left, not card center.
- **Text:** `y` is the baseline, not the top. Width is `font.measureText(str)` — use it for center alignment of "Outfinder · Sanzo Wada, 1933" and combo name.
- **Font loading:** `useFont(require('@expo-google-fonts/noto-serif-jp/NotoSerifJP_600SemiBold.ttf'), size)`. Gate the Canvas on `font && images` — `useFont` and `useImage` return `null` until loaded, first frame would draw empty otherwise.
- **Image loading from disk (user garment WebP with alpha):** `Skia.Data.fromURI('file://' + path)` → `Skia.Image.MakeImageFromEncoded(data)`. Not `useImage()` for disk paths on iOS (confirmed in issue #452).
- **Export format:** JPEG quality 92 at 1080×1920. WebP encoding in Skia produces larger files than PNG for some inputs (issue #2541) and no platform benefit here; PNG is ~3× JPEG for the same quality on a flattened card with solid background. **JPEG wins.**
- **Known trap:** don't run async work (permission prompts, fetch, etc.) between render and `makeImageSnapshot` — can produce partial/black snapshots (issue #1513). Snapshot first, request permissions after.

#### Performance envelope (iPhone 12+, 1080×1920 JPEG)

- Draw (3 images + 5 texts + shadows): <100 ms
- `makeNonTextureImage()` + `encodeToBytes(JPEG, 92)` + disk write: 200–500 ms
- Total: ~300–600 ms — within a share-sheet UX. Confidence: medium, verify on device.

#### Share surface design (synthesized with UX research below)

- **Canvas:** 1080×1920 (9:16) — single preset covers IG Stories, Pinterest, TikTok, WhatsApp, iMessage
- **Format:** JPEG q=92. Composition is flattened on a warm-cream background; alpha not needed in the output because garments have transparent backgrounds only WITHIN the polaroid cards (the polaroid itself is white on cream)
- **Layout:** polaroid stack centered, ~60% of canvas height, combo name serif ~7% from top, color-dots row below stack, footer "Outfinder · Sanzo Wada, 1933" at bottom ~3-4% of height, 60% opacity
- **Typography:** Noto Serif JP (already loaded in the app) for combo name; system semibold or Inter for the footer
- **Anti-AI signal bake-in:** the "1933" in the footer is the single most powerful credibility signal — dates predate deep learning by 80 years. This stays in every share forever. Retrofitting means old shares don't carry it

#### Sources

- https://shopify.github.io/react-native-skia/docs/canvas/overview/
- https://shopify.github.io/react-native-skia/docs/images/
- https://shopify.github.io/react-native-skia/docs/text/text/
- https://shopify.github.io/react-native-skia/docs/group/
- https://shopify.github.io/react-native-skia/docs/shapes/box/
- https://shopify.github.io/react-native-skia/docs/image-filters/shadows/
- https://shopify.github.io/react-native-skia/docs/snapshotviews/
- https://dev.to/dawidzawada/offscreen-drawing-with-react-native-skia-1m5e — offscreen pattern canonical
- https://github.com/Shopify/react-native-skia/blob/main/packages/skia/src/views/types.ts — confirms API
- https://github.com/Shopify/react-native-skia/issues/452 — load image from filesystem
- https://github.com/Shopify/react-native-skia/issues/1513 — async-before-snapshot trap
- https://github.com/Shopify/react-native-skia/issues/2541 — WebP encoder sizes
- https://github.com/Shopify/react-native-skia/discussions/1591 — resolution independence requires offscreen
- https://shopify.engineering/react-native-skia-shopify — production usage context

#### view-shot remains for other surfaces

`react-native-view-shot 4.0.3` stays in the codebase — `src/lib/share.ts` still serves the existing color-combo share card, and there is no reason to port that. The rule is: **Skia for artifacts where output quality, resolution independence, or brand chrome matters; view-shot for "screenshot a screen" use cases.** Document this boundary in the repo to prevent future drift.

### Image Storage — expo-file-system + WebP

**Recommendation: install `expo-file-system` (new class-based API), store garment masters as WebP lossy (quality 0.85–0.9) preserving alpha, thumbnails at 300×360 WebP 0.75.**

Since SDK 54, Expo promoted the former `expo-file-system/next` to the stable default and moved the classic API to `expo-file-system/legacy`. In SDK 55 use `import { File, Directory, Paths } from 'expo-file-system'`. Install with `npx expo install expo-file-system` — native module, so a dev-client rebuild is required (Metro reload is not enough). All required methods (`documentDirectory → Paths.document`, `makeDirectoryAsync → Directory.create`, `writeAsStringAsync → File.write`, `copyAsync → file.copy`, `deleteAsync → file.delete`, `getInfoAsync → file.info`) are available.

_Format choice:_
- PNG-with-alpha for a 1000×1200 garment: ~400 KB – 1.2 MB.
- JPEG doesn't support alpha — not viable.
- **WebP lossy with alpha: ~3× smaller than PNG at comparable quality** (Google study). iOS 14+ decodes WebP natively; `expo-image-manipulator` supports `SaveFormat.WEBP` directly. Quality ≥ 0.85 avoids visible alpha-edge artifacts. Confidence: high.

_Budget at 100 items:_ ~43 MB (WebP masters ~400 KB + thumb ~30 KB each). Within normal iOS app footprint. Apple sets no hard limit but warns against bloating iCloud backups of regeneratable media.

_Storage rules:_
- Masters live in `Paths.document/wardrobe/` (survives reinstall via backup).
- iOS does **not** purge `Documents/` (only `Library/Caches/` and `tmp/`).
- Thumbnails: exclude from backup (regeneratable) — set `NSURLIsExcludedFromBackupKey` or put them in `Library/Caches/`.
- **Do not use `cachesDirectory` for masters** — system may delete under disk pressure → data loss.

_Policy:_ no cap at 100 items; soft-warn at 150, hard-cap at 300 (~120 MB WebP).

_Orphan cleanup pattern:_ simple set-difference sweep on `AppState: active`, throttled to once / 24 h via AsyncStorage timestamp. Always delete the file in the same transaction as the DB row removal — the sweep is a safety net. Write to `tmp/` first, then atomic-rename into `wardrobe/` after DB insert commits (prevents half-written orphans on crash).

_Sources:_
- https://docs.expo.dev/versions/latest/sdk/filesystem/
- https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/
- https://expo.dev/blog/expo-file-system
- https://expo.dev/changelog/sdk-54
- https://docs.expo.dev/versions/latest/sdk/imagemanipulator/
- https://developers.google.com/speed/webp/docs/webp_study
- https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
- https://developer.apple.com/icloud/documentation/data-storage/

### Persistence Layer — AsyncStorage (stay) + Zustand

**Recommendation: stay on AsyncStorage for `WardrobeItems` + `CombinationAssignments`. Do NOT migrate to MMKV for this feature.**

_Volume reality:_ 100 wardrobe items + 300 assignments serialize to ~50 KB JSON. AsyncStorage on iOS is a custom Objective-C module — a `manifest.json` dictionary loaded once into memory, values ≤ 1024 chars inlined, larger values spill to individual files in `RCTAsyncLocalStorage_V1/`. Not SQLite or RocksDB on iOS (Android does use RocksDB). Warm-cache latency ~2.5 ms read / ~2.9 ms write at this volume — imperceptible.

_MMKV tradeoff:_ 5–20× faster (sub-millisecond, synchronous), Expo SDK 55 + New Arch compatible with no config plugin, but migrating partially is a trap (don't run both). A whole-app AsyncStorage → MMKV refactor for the sake of 50 KB of wardrobe data is not worth it. Revisit only if wardrobe exceeds ~1000 items or you need full-text search — at which point go directly to `expo-sqlite`, not MMKV.

_Access pattern — split keys, not mega-blob:_
- `@wardrobe:items` → `WardrobeItem[]`
- `@wardrobe:assignments` → `CombinationAssignment[]`
- Join in JS: `Map<wardrobeItemId, WardrobeItem>` plus assignments indexed by `${combinationId}:${colorIndex}`.
- Split keys avoid re-serializing the other list on every write, simplify migrations.

_Reactivity — Zustand with persist middleware backed by AsyncStorage._ Drop-in replacement of the storage adapter later if MMKV becomes justified. Avoid react-query for local state; avoid hand-rolled emitters.

_Sources:_
- https://github.com/react-native-async-storage/async-storage/blob/master/ios/RNCAsyncStorage.m
- https://rxdb.info/react-native-database.html
- https://reactnativeexpert.com/blog/mmkv-vs-asyncstorage-in-react-native/
- https://github.com/mrousavy/StorageBenchmark
- https://www.npmjs.com/package/react-native-mmkv
- https://github.com/mrousavy/react-native-mmkv/blob/main/docs/HOOKS.md
- https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md

---

## Integration Patterns

### End-to-end pipeline — new garment capture

```
S3 Armario Picker (RN)
  │
  ├─► Tab "+ Nueva foto"
  │
  └─► expo-camera takePictureAsync (quality 0.9, HEIC)
        │
        ▼
  BackgroundRemovalModule.process(fileUri) ← NEW local Expo module (Swift)
        │   load CIImage(url:, options: [.orientation])
        │   downsample long-edge → 2048px   (halves peak RAM)
        │   VNGenerateForegroundInstanceMaskRequest
        │   obs.generateMaskedImage(ofInstances: .all, croppedToInstancesExtent: true)
        │   CIContext.pngRepresentation (RGBA8)
        │   write → tmp/cutout-<uuid>.png
        │
        ▼
  Preview screen (RN)
   ├─► "Repetir" → re-invokes module
   └─► "Usar esta foto"
            │
            ▼
  expo-image-manipulator
   ├─► master: re-encode to WebP q=0.9 with alpha → tmp/<uuid>.webp
   └─► thumb:  resize 300x360 + WebP q=0.75 → tmp/<uuid>-thumb.webp
            │
            ▼
  File.move(tmp/<uuid>.webp → Paths.document/wardrobe/<uuid>.webp)
  File.move(tmp/<uuid>-thumb.webp → Paths.document/wardrobe/<uuid>-thumb.webp)
  Exclude thumb from iCloud backup (NSURLIsExcludedFromBackupKey)
            │
            ▼
  wardrobeRepo.addItem({ id: uuid, localImagePath, thumbnailPath, createdAt })
  → AsyncStorage @wardrobe:items (Zustand mutation → UI re-renders)
            │
            ▼
  S3 reopens with the new item selected
```

### Assignment flow — existing combination

```
S2 Ficha Wada → tap "Asignar →" → S3 as bottom sheet
S3 tap on existing item → close sheet
 → wardrobeRepo.assign(combinationId, colorIndex, wardrobeItemId)
 → AsyncStorage @wardrobe:assignments
 → S2 re-renders with photo in slot
```

### Share flow — S4 polaroid cascade (Skia-based)

```
S4 screen renders on-screen preview:
  <Canvas style={{aspectRatio: 9/16}}>
    <Picture picture={drawPolaroidStack(canvas, props)} />
  </Canvas>
User taps "Compartir look":
  → Skia.Surface.MakeOffscreen(1080 * density, 1920 * density)
  → canvas.scale(density, density)
  → drawPolaroidStack(canvas, props)   ← same function as on-screen
  → surface.flush()
  → surface.makeImageSnapshot().makeNonTextureImage()
  → .encodeToBytes(ImageFormat.JPEG, 92)
  → File.write(Paths.document + "/share/look-<uuid>.jpg", bytes, { encoding: Base64 })
  → Sharing.shareAsync(uri, { mimeType: "image/jpeg", UTI: "public.jpeg" })
  → cleanup: delete share file after share sheet dismiss
Analytics: log { event: "share_look", destination: share-sheet activityType, combinationId, timestamp }
```

### Data model (confirms spec §5)

No change from spec; two AsyncStorage keys:

```ts
// @wardrobe:items
interface WardrobeItem {
  id: string;           // UUID
  localImagePath: string; // Paths.document + /wardrobe/<id>.webp
  thumbnailPath: string;  // Paths.document + /wardrobe/<id>-thumb.webp
  createdAt: number;
}

// @wardrobe:assignments
interface CombinationAssignment {
  combinationId: number;
  colorIndex: number;   // 0..N-1
  wardrobeItemId: string;
  assignedAt: number;
}
```

Assignment uniqueness constraint (enforced in repo layer, not storage): `(combinationId, colorIndex)` is unique — reassigning overwrites.

### Compatibility with existing Favorites

Favorites today persists `combinationIds[]` under its own AsyncStorage key. Armario Virtual adds two parallel keys — zero migration, zero breakage. If no `CombinationAssignment` exists for a `combinationId`, that combo renders as it does today. Enrichment is 100% additive.

---

## Architectural Patterns

### Separation of concerns

| Layer | Responsibility | Lives in |
| --- | --- | --- |
| Native (Swift) | Vision segmentation, CIImage → PNG | `modules/background-removal/ios/BackgroundRemovalModule.swift` |
| Image utility (JS) | WebP re-encoding + thumbnail generation | `src/lib/wardrobeImages.ts` (new) |
| Storage utility (JS) | File move/atomic-rename, orphan sweep | `src/lib/wardrobeFiles.ts` (new) |
| Repository (JS) | AsyncStorage reads/writes, join logic | `src/lib/wardrobeRepo.ts` (new) |
| State (JS) | Zustand store — single source of truth for UI | `src/stores/wardrobeStore.ts` (new) |
| UI (RN) | S0, S2, S3, S4, S5 + Favorites badges | `src/screens/armario/*` (new) |

This mirrors the Epic 12 division: Swift does CPU/GPU work, JS orchestrates, the repo layer keeps UI dumb.

### Reusing the `WhiteBalanceModule` template

New module `modules/background-removal/` is a structural copy of `modules/white-balance/`:

```
modules/background-removal/
  expo-module.config.json   ← { platforms: ["ios"], ios: { modules: ["BackgroundRemovalModule"], podspecPath: "background-removal.podspec" } }
  background-removal.podspec ← same pattern, swap name/deps
  ios/BackgroundRemovalModule.swift
  src/index.ts               ← requireNativeModule("BackgroundRemoval") + exported types
  package.json               ← same minimal shape
```

**Do not forget** the `podspecPath` field in `expo-module.config.json` — the autolinking trap from Story 12.3 is identical here (`expo-modules-autolinking` only recurses into subdirectories for podspecs). Verify autolinking before rebuild with the same command documented in `project_epic12_architecture.md`.

Every Swift edit requires `npx expo prebuild --clean && npx expo run:ios`.

### Threading & memory

- `VNImageRequestHandler.perform` is synchronous and ANE/CPU-bound — dispatch on a background `DispatchQueue` (utility QoS). `AsyncFunction` in expo-modules already runs off the JS thread → safe by default.
- Downsample input to 2048 px long-edge **before** the Vision request. Reduces peak RAM by ~50%. Vision internally resamples anyway.
- `croppedToInstancesExtent: true` tightens the output bounds → less data to encode + smaller PNG.
- Pass `CGImagePropertyOrientation` to `VNImageRequestHandler` — the EXIF orientation trap from developer forums bit many projects (https://developer.apple.com/forums/thread/711612).
- Reuse a `static let sharedCIContext = CIContext()` singleton (same pattern as `WhiteBalanceModule.sharedContext`) across captures.

### Atomic file lifecycle

```
tmp/<uuid>.png (Vision output)
  → re-encode → tmp/<uuid>.webp
  → move → Paths.document/wardrobe/<uuid>.webp
  → THEN AsyncStorage.addItem(...) commits the DB row
  → if storage commit fails → delete the moved file
```

Guarantees no orphan master created without a DB record, and no record created without a file on disk.

### Error handling contract

Following CLAUDE.md rules + Epic 12 patterns:

- Native module returns structured errors (`BackgroundRemovalError.noSubject`, `.visionFailed`, `.ioFailed`) → JS maps to user-facing copy.
- Retry loop surfaced in the preview screen ("Repetir") — no exponential backoff (user-initiated).
- No silent fallback to a half-masked image. If Vision fails, show an error state with retry + "Use photo without cutout" escape hatch (decide in story spec).

---

## Implementation Research

### Dependencies to add

| Package / module | Source | Notes |
| --- | --- | --- |
| `expo-file-system` | `npx expo install expo-file-system` | Native module → requires prebuild rebuild |
| `expo-image-manipulator` | `npx expo install expo-image-manipulator` | For WebP re-encoding + thumbnails |
| `expo-image-picker` | `npx expo install expo-image-picker` | For "choose from library" branch of §4 |
| `zustand` | `npm i zustand` | Reactivity layer over AsyncStorage |
| `modules/background-removal/` | **new local Expo module** | Swift — mirrors `modules/white-balance/` |

**Already present, no action:** `@shopify/react-native-skia` 2.5.1, `expo-sharing`, `@react-native-async-storage/async-storage`, `expo-camera`, `@expo-google-fonts/noto-serif-jp`.

`react-native-view-shot` stays in the codebase for the existing `src/lib/share.ts` color-combo share — **not used for Armario Virtual**, see revised Share Artifact Rendering section.

### Story breakdown proposal (5 stories, CLAUDE.md §Story Scope cap)

Max 4–5 tasks per story per CLAUDE.md rules. Rough sequencing:

1. **Story 13.1 — Data model + repository + Zustand store.** AsyncStorage keys, `wardrobeRepo` API, Zustand store, unit tests. No UI.
2. **Story 13.2 — BackgroundRemovalModule native.** Swift module with `VNGenerateForegroundInstanceMaskRequest`, downsample, shared CIContext, orientation handling. JS wrapper. Test on device with sample photos.
3. **Story 13.3 — Capture flow (S3 picker + camera + preview).** Integrate camera, background-removal, preview with retry, WebP re-encode, thumbnail, atomic move, repo commit.
4. **Story 13.4 — Assignment flow (S2 ficha + S3 picker integration with existing items).** S2 screen, bottom-sheet picker, assignment writes, live updates.
5. **Story 13.5 — S4 Skia composition (preview + export).** Shared `drawPolaroidStack(canvas, props)`, declarative `<Canvas>` for on-screen, offscreen `Surface.MakeOffscreen(1080*pd, 1920*pd)` for export, JPEG q=92 write, `Sharing.shareAsync` + share-event analytics, cleanup. Isolated story because it's the highest-leverage marketing surface and benefits from dedicated visual QA.
6. **Story 13.6 — S5 incomplete state + Favorites badges (S1).** Partial-state polaroid card with `+` slot, suggestion card with copy logic from `getSuggestionCopy`, Favorites grid badges (`3/3`, `1/3`, `Sin prendas`), ordering by completeness.

Zero-state (S0) is folded into 13.4 (lightweight: 3 empty slots + CTA → enters 13.3).

### Risks & unknowns

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Vision fails on dark-on-dark garments enough to feel broken | Medium | UX guidance copy ("Pon la prenda sobre fondo liso, buena luz") + "Repetir" button. Consider fallback "Usar sin recorte" as escape. |
| WebP lossy at q=0.85 shows alpha-edge artifacts on certain garments | Low | Pre-ship visual QA on 20 sample photos. Raise to q=0.9 or switch to PNG if observed. |
| `captureRef` with rotated children produces clipping on specific iPhones | Low-medium | Turn on `useRenderInContext: true` as default for the S4 root. |
| AsyncStorage migration becomes painful later | Low | Split-key design already future-proofs migration to SQLite — each key becomes a table row set cleanly. |
| `expo-file-system` new API has undiscovered SDK 55 regressions | Low | Prototype Story 13.1 storage layer against the new API first; fall back to `/legacy` variant if blocked (same capabilities, no API churn). |
| Users with iOS < 17 hit the feature | Near-zero at ~96% coverage | Gate Armario Virtual entry points with `Platform.Version >= 17` check — hide, not error. |

### Pre-story measurement (per project memory priority)

Memory `project_status.md` priority 1 after launch is analytics on camera usage (Epic 13 vs UX polish decision). This research does NOT replace that: even if Armario Virtual is technically viable, the go/no-go depends on whether users actually use Epic 12 capture. Instrumentation should ship BEFORE starting Epic 13 stories.

---

## Share Artifact UX — Product Decisions

Parallel research into how users of comparable style/color apps actually share their artifacts and what the output should be to maximize both user satisfaction and organic acquisition (the app has ~60 DAU; every share is a meaningful growth event).

### Where users share (2026, ranked)

1. **Instagram Stories** — dominant for outfit/palette content; fashion verticals over-index on Stories ~2× vs Feed. ([Later 2025 benchmarks](https://later.com/blog/social-media-benchmarks/), [Hootsuite 2025 Trends](https://www.hootsuite.com/research/social-trends))
2. **Pinterest** — fastest-growing for aesthetic/palette 2024→2026, 553M MAU Q4 2024 +11% YoY. Particularly strong for "capsule wardrobe", "color story", "old money", "coquette" niches. ([Pinterest Q4 2024](https://investor.pinterestinc.com/press/press-releases/press-release-details/2025/Pinterest-Announces-Fourth-Quarter-and-Full-Year-2024-Results/))
3. **TikTok slideshow/carousel** — static-image format exploded 2024–2025, highly relevant for static polaroid.
4. **iMessage / WhatsApp** — ~84% of sharing happens on "dark social" (Branch). Invisible but enormous volume.
5. **IG Feed (4:5)** — declining for aesthetic content vs Stories + Pinterest.
6. TikTok video, X, BeReal — deprioritized.

### Format decision

**Single preset: 1080×1920 (9:16), JPEG quality 92.** This single geometry works on IG Stories, TikTok, Pinterest (acceptable — would prefer 2:3 but accepts 9:16), iMessage, WhatsApp. At 60 DAU the complexity cost of multi-preset UI (picker, testing, localization, analytics) dwarfs the marginal lift. Spotify Wrapped ships one 9:16 artifact and owns IG Stories — same pattern. Revisit 1:1 in V2 only if analytics show >15% of shares route to IG Feed.

### Branding pattern

Outfinder is a **content-first** app (the outfit is the point, not Outfinder), not a **content-about-the-app** app (Wrapped/Strava). Branding rule: <5% of artifact area, corner or bottom-center placement.

- **Footer:** `Outfinder · Sanzo Wada, 1933` — bottom-center, ~3-4% of height, 60% opacity black on the cream background, serif or semibold sans
- **Combination name:** Noto Serif JP, ~7% from top, centered
- **Color dots row:** below the polaroid stack, functional AND aesthetic — communicates color theory visually
- **No QR code** — kills aesthetics in fashion contexts (documented Branch finding)
- **No emoji, no gradient, no "AI" anywhere, no generative-feeling flourishes** — direct conflict with the anti-AI-slop positioning

### The anti-AI-slop signal

The single most powerful credibility signal in the artifact is the date **"1933"** next to Sanzo Wada. Deep learning was not a thing in 1933. An outfit built on a 93-year-old hand-curated color dictionary signals depth that no "AI outfit generator" can match. Fashion-credentialed audiences (Pinterest aesthetic accounts, Substack newsletters, TikTok color creators) respond strongly to this kind of sophistication. ([ASO positioning memory: anti-AI-slop tone in v1.3.0](../../project_release_tracking.md))

This is also why Skia is the correct tool: vector-crisp "1933" rendered at 1080p is an editorial-grade credential. Rasterized RN Text at the same resolution is a blurry watermark.

### Non-negotiables for V1 (expensive to change later)

1. **Bake "Sanzo Wada, 1933" into every share from day one.** Retrofitting means old shares don't carry the signal.
2. **Ship at 1080×1920 JPEG.** Changing dimensions later fragments the aesthetic across screenshots people took of old versions.
3. **Log share events with `destination`** (share-sheet activityType, combinationId, timestamp) from V1. Decisions about multi-preset V2 need data, not vibes.

### Future V2 hooks (enable without committing)

The Skia composition function architecture trivially enables these if analytics justify:

- **Variant renders** — same `drawPolaroidStack` with `props.preset: '9:16' | '1:1' | '4:5'`
- **Vintage filter toggle** — Skia ColorMatrix applied on the composition (pattern already validated in Story 2.5)
- **Animated Stories export** — Skia supports offscreen video rendering via frame-by-frame snapshots
- **Seasonal watermark variants** — "Wada 1933 · Spring '26" without touching core layout

None of these ship in V1; all become trivial once the Skia function exists.

### Sources

- https://later.com/blog/social-media-benchmarks/
- https://www.hootsuite.com/research/social-trends
- https://later.com/blog/pinterest-statistics/
- https://investor.pinterestinc.com/press/press-releases/press-release-details/2025/Pinterest-Announces-Fourth-Quarter-and-Full-Year-2024-Results/
- https://blog.hootsuite.com/tiktok-trends/
- https://branch.io/resources/aso-stack/
- https://help.instagram.com/1631821640426723
- https://help.pinterest.com/en/business/article/pinterest-product-specs
- https://engineering.atspotify.com/ — Wrapped case context

---

## Research Synthesis — Answers to Spec §9 Open Questions

**Q1. Is `expo-file-system` already in the project?**
→ **No, it is not installed.** Must add via `npx expo install expo-file-system`. SDK 55 uses the new class-based API (`File`, `Directory`, `Paths`) by default since the SDK 54 rewrite; import the legacy variant only if a regression blocks us. Requires dev-client rebuild (Metro reload insufficient). No reason not to add it.

**Q2. `VNGenerateForegroundInstanceMaskRequest` vs `VNGenerateForegroundMaskRequest`?**
→ **Use `VNGenerateForegroundInstanceMaskRequest` exclusively (iOS 17+).** iOS 17 coverage is ~96% early 2026; Outfinder already requires iOS 17 effectively for SwiftWhiteBalance. Quality delta on garments is large — the older API embarrasses the polaroid aesthetic on fringe/edges. Gate the feature entry with `Platform.Version >= 17` and hide (not error) on older OS.

**Q3. Image size budget (20 prendas × ~500 KB PNG ≈ 10 MB)?**
→ **Revise to ~40–80 MB at 100 items using WebP lossy q=0.9 with alpha** (not PNG). WebP is ~3× smaller than PNG at comparable quality, decoded natively by iOS 14+, and `expo-image-manipulator` writes it directly. No compression ceiling needed at 100 items. Soft-warn at 150, hard-cap at 300 (~120 MB). Thumbnails generated once at 300×360 WebP q=0.75 (~15–40 KB each).

**Q4. Preview after cutout — modal or own screen?**
→ **Own screen (stack navigation), not modal.** Preview has two non-trivial CTAs (Repetir / Usar esta foto) and potential for a retry loop that feels heavier than a sheet warrants. It's also the natural place to surface the "Usar sin recorte" escape for Vision-failure edge cases. Modal over S3 would crowd the sheet stack; a screen navigation keeps the back-stack clean.

**Q5. Re-use items across combinations — correct UX?**
→ **Yes, confirmed correct.** A single WardrobeItem referenced by multiple `CombinationAssignment` rows is the clean model. The wardrobe is a repo of photographed garments, orthogonal to the combos using them. Users will legitimately assign the same navy polo to multiple palettes that include a deep-blue tone. Prevents bloat and duplicate captures.

**Q6. Deleting a favorite with assigned items — what happens?**
→ **Cascade the assignment rows; keep the wardrobe items.** When the user un-favorites a combination, delete all `CombinationAssignment` rows where `combinationId = X`. Do NOT delete the referenced `WardrobeItem`s — they remain in the wardrobe, available to other combinations. This matches the semantic: the user removed the palette, not the garments. Surface this in a confirmation sheet only if assignments exist ("Se quitarán las X prendas que habías asignado a esta paleta. Las fotos seguirán en tu Armario."). Delete orphan wardrobe items only via explicit "Delete from wardrobe" action in a future wardrobe-management screen (not MVP).

**Q7. `react-native-view-shot` on Expo SDK 55 — confirmed?**
→ **view-shot stays in the codebase for existing surfaces but is NOT used for Armario Virtual.** See the revised "Share Artifact Rendering — Skia-only" section. The share artifact is a marketing surface, not a UI screenshot — deterministic output, resolution independence, and vector-crisp brand chrome (the "Sanzo Wada, 1933" anti-AI signal) make Skia the correct tool. view-shot 4.0.3 remains in `src/lib/share.ts` for the existing color-combo share and any "screenshot a screen" future needs.

### Go / no-go assessment

**Technical feasibility: GREEN.** Every core decision has a validated path:
- Vision API and coverage handle background removal cleanly.
- Local Expo module pattern is proven from Epic 12 (`WhiteBalanceModule`).
- View capture + share are already wired in the codebase.
- Storage budget is trivial with WebP; filesystem API is documented and stable.
- Persistence doesn't need a stack shift.

**Product decision still gated on analytics** (per project_status.md priority 1). This research validates _that Armario Virtual can be built well_, not _that it should be built now_. Ship camera-usage instrumentation in a pre-Epic-13 chore, observe 2–4 weeks post-launch of v1.3.0, then make the Epic 13 call informed.

### Effort estimate (orders of magnitude)

| Surface | Rough estimate |
| --- | --- |
| Native module (13.2) | 1–2 days of Swift + validation on device |
| Data layer + store (13.1) | 0.5–1 day |
| Capture + preview flow (13.3) | 2–3 days |
| Assignment flow (13.4) | 1.5–2 days |
| S4 Skia composition (13.5) | 3–5 days (isolated story — highest marketing leverage) |
| S5 incomplete + Favorites badges (13.6) | 1.5–2 days |
| **Total** | **~10–15 days solo dev with AI pair** |

Confidence: medium. The jump from the earlier ~8–12 day estimate reflects (a) splitting the previous Story 13.5 into two focused stories and (b) the Skia composition being explicit dev work rather than a view-shot shortcut. Doesn't include onboarding coach marks, analytics instrumentation beyond the share-event, localization, or visual QA cycles.

---

## Source Bibliography

**Apple Vision Framework**
- https://developer.apple.com/videos/play/wwdc2023/10176/ — WWDC23 "Lift subjects from images in your app"
- https://developer.apple.com/documentation/vision/vngenerateforegroundinstancemaskrequest
- https://developer.apple.com/documentation/vision/lifting-a-subject-from-an-image
- https://developer.apple.com/documentation/vision/vnimagerequesthandler
- https://developer.apple.com/forums/thread/737707 — sheer fabric alpha limitation
- https://developer.apple.com/forums/thread/711612 — EXIF orientation trap
- https://developer.apple.com/forums/thread/732769 — dark-on-dark failure reports

**iOS version adoption**
- https://mixpanel.com/trends/ios-versions
- https://developer.apple.com/support/app-store/

**Expo**
- https://docs.expo.dev/versions/latest/sdk/filesystem/
- https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/
- https://expo.dev/blog/expo-file-system
- https://expo.dev/changelog/sdk-54
- https://docs.expo.dev/versions/latest/sdk/imagemanipulator/
- https://docs.expo.dev/versions/latest/sdk/captureRef/

**react-native-view-shot**
- https://www.npmjs.com/package/react-native-view-shot
- https://github.com/gre/react-native-view-shot/blob/master/README.md
- https://github.com/gre/react-native-view-shot/issues/273
- https://github.com/gre/react-native-view-shot/issues/564
- https://github.com/gre/react-native-view-shot/issues/575

**Apple file system & storage**
- https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/FileSystemOverview/FileSystemOverview.html
- https://developer.apple.com/icloud/documentation/data-storage/

**WebP**
- https://developers.google.com/speed/webp/docs/webp_study
- https://developers.google.com/speed/webp/gallery2
- https://en.wikipedia.org/wiki/PNG

**Persistence**
- https://github.com/react-native-async-storage/async-storage/blob/master/ios/RNCAsyncStorage.m
- https://rxdb.info/react-native-database.html
- https://reactnativeexpert.com/blog/mmkv-vs-asyncstorage-in-react-native/
- https://github.com/mrousavy/StorageBenchmark
- https://www.npmjs.com/package/react-native-mmkv
- https://github.com/mrousavy/react-native-mmkv/blob/main/docs/HOOKS.md
- https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md
