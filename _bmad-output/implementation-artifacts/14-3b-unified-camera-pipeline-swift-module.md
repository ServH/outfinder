# Story 14.3b: Unified camera pipeline + Swift module signature change

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer delivering the magic moment of Epic 14 — fotografiar una prenda y ver el tono Wada detectado sin la trampa de transparencia**,
I want **(a) the `modules/background-removal` Swift module extended so its native return shape becomes `{ cutoutUri: String; dominantHex: String }` — computing the weighted RGB average of pixels where `alpha > 0.5` in the same Vision pass, (b) the TS interface + Jest mock rewritten to the new shape, (c) `UnifiedCameraCaptureScreen` rebuilt from its 14.3a placeholder into the real pipeline (`takePictureAsync` → `removeBackground` → `hexToLab` → `matchWadaColor` → `classifyMatch` → `push("Result", { cutoutUri, dominantHex, wadaMatch })`), (d) every Epic-13 call site of `removeBackground` (only `ArmarioCaptureScreen.tsx:122` today) trivially rewired to destructure `{ cutoutUri }` from the new object return, and (e) the `Result` route params in `UnifiedCameraStackParamList` tightened to the pipeline output type**,
so that **Story 14.4 can drop the UX-DR1 Result UI (cutout + Wada name stack + combinations count + CTAs) onto typed, accurate route params; `react-native-image-colors` is never called on a cutout again (eliminating the transparency trap that biased dominant color toward black on alpha=0 pre-multiplied pixels per Finding 1 of the tech review); Epic-13's in-Ficha-Wada slot-assignment flow (cutout-only, no Wada tone) keeps working byte-for-byte; and `react-native-image-colors` can be removed from `package.json` in a future cleanup (not this story) because no `src/**` code calls `getColors` anymore**.

## Acceptance Criteria

1. **Given** `modules/background-removal/ios/BackgroundRemovalModule.swift` is the only Swift source in this module, **When** its `definition()` is inspected, **Then** the `AsyncFunction("removeBackground")` signature returns `[String: String]` (marshals to a JS object) instead of `String` — the dictionary has exactly two keys: `"cutoutUri": String` (the existing `file://…/cutout-<uuid>.png` path) and `"dominantHex": String` (a `#RRGGBB` uppercase hex string derived from the weighted RGB average of pixels in the same CVPixelBuffer where `alpha > 0.5`) — **And** the dominant-color computation runs in a new private static helper `computeDominantHex(buffer: CVPixelBuffer) -> String` that iterates the pre-multiplied RGBA8 pixels of the segmentation output BEFORE the downsample-and-PNG-encode step, so the averaged sample reflects full-resolution data — **And** the helper skips pixels where alpha ≤ 127 (threshold `alpha > 0.5` expressed on the 0–255 byte scale as `alpha > 127`), de-premultiplies each kept pixel by dividing `R`, `G`, `B` channels by `alpha/255.0` before accumulating, accumulates `sumR`, `sumG`, `sumB`, and `count`, and computes `avgR = sumR / count`, clamping to `[0, 255]`, and formats the hex as `"#" + String(format: "%02X%02X%02X", avgR, avgG, avgB)` — **And** if `count == 0` (degenerate all-transparent cutout — should not happen post-Vision but guard anyway) the helper returns `"#000000"` AND the module throws the existing `error(kind: "noSubject", ...)` path BEFORE encoding the PNG (so the JS side sees `noSubject` rather than a black garment tone).

2. **Given** the Swift module's `process(inputUri:)` method orchestrates Vision → mask → downsample → PNG encode today, **When** this story merges, **Then** the method is reordered so the pixel-buffer iteration for `computeDominantHex` runs AFTER `generateMaskedImage` but BEFORE `downsampleIfNeeded(maskedImage)` — this preserves the existing "Vision sees full-res edges; PNG is downsampled to 2048px longest edge" contract while ensuring the dominant-color sample is taken at FULL resolution (the dominant color of a 2048×1500 cutout and an 8064×6048 cutout must be identical within rounding; no downsample bias) — **And** the `sharedContext` / `.sRGB` colorspace pinning remains unchanged (the PNG encoder still outputs sRGB), **And** the returned dictionary order is: `["cutoutUri": outputURL.absoluteString, "dominantHex": hex]` (order doesn't matter at the JS layer; this key set is stable).

3. **Given** `modules/background-removal/src/index.ts`, **When** its TypeScript surface is inspected, **Then** the `NativeBackgroundRemoval` interface declares `removeBackground(inputUri: string): Promise<{ cutoutUri: string; dominantHex: string }>`, **And** the exported `removeBackground(inputUri)` function returns `Promise<{ cutoutUri: string; dominantHex: string }>` (NOT `Promise<string>`), **And** the JSDoc above `removeBackground` is updated to document both fields, the `alpha > 0.5` threshold rationale, and a reference to the transparency-trap problem resolved by TD-1 (one-line comment pointing at `docs/planning/epic-14/epic-14-tech-review.md#finding-1`) — **And** the error path (`toBackgroundRemovalError`) is UNCHANGED (same `BackgroundRemovalErrorKind` codes: `noSubject`, `visionFailed`, `ioFailed`; same unrecognized-code fallback to `visionFailed`).

4. **Given** `modules/background-removal/src/index.test.ts` mocks `expo-modules-core.requireNativeModule` and exercises 5 cases today, **When** this story merges, **Then** the mock factory returns a `removeBackground` stub whose resolved value shape is `{ cutoutUri: string; dominantHex: string }` (not a bare string), **And** the happy-path test asserts `.resolves.toEqual({ cutoutUri: "file:///tmp/cutout-abc.png", dominantHex: "#7A3F2B" })` — **And** all 4 error-path tests remain unchanged in intent (they still assert the `BackgroundRemovalError` kind mapping), **And** one NEW test case is added: `"propagates both cutoutUri and dominantHex verbatim from the native layer"` with mocked native return `{ cutoutUri: "file:///x.png", dominantHex: "#FFAA00" }` — asserts the exported function forwards both fields without mutation.

5. **Given** `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx` exists today as a placeholder (from Story 14.3a) rendering only a back button + "Capture (coming in 14.3b)" text, **When** this story merges, **Then** the screen is rebuilt as the real capture surface following the `ArmarioCaptureScreen.tsx` PATTERN (for permissions + error handling + CameraView + capture button + processing overlay), but producing DIFFERENT output (Wada tone detection, not slot-assignment callback) — **And** the screen renders a full-screen `CameraView` (back-facing, `quality: 0.8` on `takePictureAsync`), a bottom centered capture button at 80pt diameter (per UX-DR1 Pencil frame `6nPEq`, but treated as placeholder-polish this story — final visual lands in 14.4 if any), the existing 14.3a close `✕` back button (top-left, `insets.top + 8`, `colorCapture.closeCameraLabel` label), and an error sheet + processing overlay that reuse the `ArmarioCaptureScreen` visual pattern (warm-paper spinner + live region copy) — **And** the hint copy *"Fotografía tu prenda completa"* (ES) / *"Photograph your full garment"* (EN) is rendered in mid-lower-third per UX-DR1 Capture screen layout (Noto Serif JP 18pt, `text-primary/80`; centered) under a new i18n key `unifiedCamera.capture.hint` added to both locale files, **And** `expo-image-picker` library-picker path is OUT OF SCOPE this story (the `armario` flow keeps it; unified camera is camera-only for v1.4.0 per Alejandro decision — no library fallback).

6. **Given** the user successfully takes a photo on the unified Capture screen, **When** the pipeline executes, **Then** the sequence fires in this exact order: `hapticMedium()` → `cameraRef.current.takePictureAsync({ quality: 0.8 })` → (on success) `setProcessing(true)` → `removeBackground(photo.uri)` → destructure `{ cutoutUri, dominantHex }` → `hexToLab(dominantHex)` → `matchWadaColor(lab)` → `classifyMatch(matches)` → `setProcessing(false)` → `hapticLight()` → `navigation.push("Result", { cutoutUri, dominantHex, wadaMatch })` — **And** the entire async chain is guarded by the `isMounted` ref pattern from `ArmarioCaptureScreen.tsx:71–77` (short-circuit before any `setState` or `navigate` call if the screen unmounted during processing), **And** `react-native-image-colors` / `getColors` is NEVER imported or called in this file (per TD-1; JS-side color extraction on the cutout is extinct).

7. **Given** Vision segmentation fails (`BackgroundRemovalError` with `kind ∈ { "noSubject", "visionFailed", "ioFailed" }`) OR `takePictureAsync` throws / returns `null`, **When** the pipeline catches the failure, **Then** `setProcessing(false)` runs, no navigation fires, and an inline error sheet appears (same visual pattern as `ArmarioCaptureScreen.renderErrorSheet` — dimmed dark pill anchored at `bottom: 200`, live-region announcement) with copy sourced from THREE new i18n keys added this story under `unifiedCamera.capture.*`:
    - `errorNoSubject`: ES *"No pudimos encontrar la prenda. Prueba con fondo liso y buena luz."* / EN *"We couldn't find the garment. Try a plain background with good light."*
    - `errorVisionFailed`: ES *"No pudimos procesar la foto. Inténtalo de nuevo."* / EN *"We couldn't process the photo. Try again."*
    - `errorIoFailed`: ES *"No se pudo leer o guardar la foto. Inténtalo de nuevo."* / EN *"Couldn't read or save the photo. Try again."*

    **And** the error sheet exposes a single button `"Reintentar"` (ES) / `"Try again"` (EN) under new key `unifiedCamera.capture.retry` that clears the error state and returns the screen to the live-camera ready state (no `navigation.goBack()`, no `navigation.push("Capture")` — just state reset; the user stays on the same Capture screen with the error dismissed).

8. **Given** `src/screens/armario/ArmarioCaptureScreen.tsx:122` is today the ONLY in-repo caller of `removeBackground` besides the new unified camera screen (verified by grep: `grep -rln "removeBackground(" src → src/screens/armario/ArmarioCaptureScreen.tsx`), **When** this story merges, **Then** that single line is rewritten from `const cutoutUri = await removeBackground(uri);` to `const { cutoutUri } = await removeBackground(uri);` — **And** that is the ONLY line touched in `ArmarioCaptureScreen.tsx` (no other logic, no style, no tests) — **And** the corresponding Jest mock in `src/screens/armario/ArmarioCaptureScreen.test.tsx:67–69` updates the stub shape accordingly: instead of `mockRemoveBackground.mockResolvedValue("file://…")`, callers now do `mockRemoveBackground.mockResolvedValue({ cutoutUri: "file://…", dominantHex: "#000000" })` (the Epic-13 consumer ignores `dominantHex` — pass a dummy hex in tests) — **And** every existing assertion in `ArmarioCaptureScreen.test.tsx` that currently reads `expect(mockRemoveBackground).toHaveBeenCalledWith(...)` or asserts navigation to `ArmarioPreview` with `cutoutUri` in params continues to pass unchanged (the only test surface difference is the mock's return-value shape).

9. **Given** `src/lib/armario/saveCutoutAsWardrobeItem.ts` and `src/lib/armario/saveCutoutAsWardrobeItem.test.ts` are pure-JS and consume `cutoutUri: string` as an input argument (not a caller of `removeBackground`), **When** this story merges, **Then** they are UNCHANGED — the `SaveCutoutArgs.cutoutUri` contract survives verbatim (13.3b precedent). Story 14.5 will later call this helper with the `cutoutUri` extracted from the Capture-screen pipeline; this story does not modify the save helper.

10. **Given** `UnifiedCameraStackParamList` in `src/navigation/types.ts` currently declares `Capture: undefined`, `Result: undefined`, `PostSave: undefined` (14.3a placeholders), **When** this story merges, **Then** the type tightens to:
    ```ts
    export type UnifiedCameraStackParamList = {
        Capture: undefined;
        Result: {
            cutoutUri: string;
            dominantHex: string;
            wadaMatch: MatchResult;
        };
        PostSave: undefined; // reserved for Story 14.5 "¿Ahora qué?"
    };
    ```
    **And** `MatchResult` is imported from `@/lib/colorTypes` (the existing discriminated union: `{ type: "direct"; match } | { type: "confirm"; top3 } | { type: "out-of-coverage"; bestMatch }` — UX-DR1's tone-correction section in Story 14.4 conditions on `type === "confirm"` with `top-2 ΔE < 8`), **And** the placeholder `UnifiedCameraResultScreen.tsx` is updated to destructure `route.params` (typed as `NativeStackScreenProps<UnifiedCameraStackParamList, "Result">["route"]`) and render the placeholder text PLUS the raw `dominantHex` + `wadaMatch.type` for dev-visual confirmation — this is NOT the real Result UI (14.4 owns that per UX-DR1); it's a diagnostic placeholder until 14.4 lands.

11. **Given** the Jest test surface after this story merges, **When** `pnpm test` runs, **Then** the suite reports a NET gain of `+3 to +6` passing tests vs. the 14.3a done baseline (771 passing / 60 pre-existing):
    - `modules/background-removal/src/index.test.ts` adds 1 test (AC #4's verbatim-forwarding case) while keeping 5 existing, updating their shape → net +1.
    - `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx` grows from 3 smoke cases to ~6–8 cases (placeholder-smoke tests REMOVED, new pipeline tests ADDED): happy path (takePicture → removeBackground → matchWadaColor → navigate with typed params), error-path × 3 (`noSubject`/`visionFailed`/`ioFailed` each render the correct sheet copy), unmount-during-processing (isMounted guard prevents state thrash), retry-clears-error.
    - `UnifiedCameraResultScreen.test.tsx` grows by 1 case (renders `dominantHex` diagnostic text) from the current single placeholder smoke.
    - `UnifiedCameraPostSaveScreen.test.tsx` is UNCHANGED (still a single placeholder smoke — that screen lands in 14.5).
    - `ArmarioCaptureScreen.test.tsx` has 0 net test delta (the mock-shape update is mechanical; assertions preserved).
    **And** the net is ≥ 771 + 3 = **774 passing minimum** / 60 pre-existing / 0 new failures / 0 new skips.

12. **Given** the quality gates, **When** `npx tsc --noEmit`, `pnpm lint`, `pnpm test` run on this story branch, **Then** all pass green, **And** Biome lint is clean (tabs, double quotes, named exports, no `export default`, `organize-imports` applied), **And** zero new test skips are introduced (NFR6), **And** the pre-existing 60 failures (48 `OutfitVisualizer.getState` + 12 `i18n.test.ts` detectLanguage) stay exactly at 60 — this story does NOT touch those surfaces.

13. **Given** this story performs a NATIVE Swift module change, **When** the dev-agent prepares the local build, **Then** **the dev-agent MUST warn Alejandro before running `npx expo run:ios`** per memory `feedback_native_module_rebuild.md` (native module installs require a full `expo run:ios` rebuild — Metro reload is NOT enough; the Swift layer only re-links via a clean Pods + Xcode build). **And** the on-device smoke test on iPhone 14+ covers three garment categories to validate dominant-color accuracy (AC #14 below): one dark (black/navy), one pale (crema/off-white), one saturated (teja/ultramar). Each capture must produce a `dominantHex` that visually matches the garment (not the previously-trapped transparent-padding black). **Alejandro will run the simulator/device smoke manually after the dev-agent signals ready** — the dev-agent may request Metro reload only for TypeScript changes, but the Swift change requires the user's build step.

14. **Given** the on-device smoke test on iPhone 14 or newer with iOS 17+, **When** the tester taps the Tab Bar FAB, photographs each of three garment types — (i) a dark garment on a light background, (ii) a pale garment on a darker background, (iii) a saturated mid-tone garment on neutral background — **Then** for each capture:
    - Processing spinner shows for 1–3s.
    - The app navigates to `UnifiedCameraResultScreen` (diagnostic placeholder) showing `dominantHex = #XXXXXX` that visually corresponds to the garment (not to the padding).
    - The `wadaMatch.type` surfaces as `"direct"` for a clean ΔE < 2 hit, `"confirm"` for ΔE ∈ [2, 15], or `"out-of-coverage"` for ΔE > 15 (rare).
    - No crashes, no `noSubject` false-positives on a clearly-framed garment, no hex = `#000000` or near-black on a pale garment (the transparency trap is gone).
    - Swipe-down on the modal returns to the originating tab at its prior state.

    **And** the tester captures one screenshot per garment showing garment + detected hex for the Story's Completion Notes (evidence artifact).

15. **Given** the Epic-13 in-Ficha-Wada armario-capture entry points from Story 13.4b — `ArmarioPickerScreen.tsx` `+ Nueva foto` tab + footer CTA, and `Settings.tsx` `Armario Virtual (dev)` row — **When** the tester follows those paths on-device after this story's build, **Then** they continue to function byte-for-byte identically: `ArmarioCaptureScreen` opens, the user photographs a prenda, the cutout preview screen shows, `Usar esta foto` persists to the wardrobe with the detected slot color (NOT the new `dominantHex` — that's 14.3b unified-camera exclusive), the `onCutoutSaved` callback fires with the new wardrobe item id, and the modal dismisses returning to Ficha Wada with the slot populated. TD-2 preservation is verified on-device, not just by grep.

## Tasks / Subtasks

- [x] **Task 1: Swift module — weighted dominant-hex computation + return shape change** (AC: #1, #2, #13)
  - [x] 1.1 `computeDominantHex(buffer:)` helper implemented with pixel-format branching (RGBA/BGRA/ARGB/ABGR), lock/unlock, alpha > 127 gate, de-premultiplied accumulation, `#RRGGBB` formatting; returns `nil` when no opaque pixels survive.
  - [x] 1.2 `process(inputUri:)` reordered: hex sampled AFTER `generateMaskedImage` (full-res) but BEFORE `downsampleIfNeeded`; `nil` hex surfaces as `noSubject` Exception before PNG encode.
  - [x] 1.3 `AsyncFunction("removeBackground")` now returns `[String: String]` with `cutoutUri` + `dominantHex`.
  - [x] 1.4 iOS build flagged for Alejandro (see Completion Notes — requires `npx expo run:ios`).

- [x] **Task 2: TypeScript surface + Jest mock shape** (AC: #3, #4)
  - [x] 2.1 `BackgroundRemovalResult` interface exported; `removeBackground` returns `Promise<BackgroundRemovalResult>`; JSDoc cross-references TD-1 + epic tech review Finding 1.
  - [x] 2.2 Jest mock generic updated to `Promise<BackgroundRemovalResult>`; happy-path test updated; NEW forwarding-verbatim test added (6 tests total — +1 net).

- [x] **Task 3: `UnifiedCameraCaptureScreen` — real pipeline replacing the 14.3a placeholder** (AC: #5, #6, #7)
  - [x] 3.1 Screen rebuilt on `ArmarioCaptureScreen` pattern (permissions gate, CameraView ref, isMounted/isCapturing refs, hint copy, close button preserved). No ImagePicker library fallback (v1.4.0 decision).
  - [x] 3.2 Capture pipeline wired: `hapticMedium` → `takePictureAsync({quality:0.8})` → `removeBackground` → `hexToLab` → `matchWadaColor` → `classifyMatch` → `hapticLight` → `navigation.push("Result", …)`; all async-side state guarded by `isMounted.current`.
  - [x] 3.3 Local `isBackgroundRemovalError` type guard; inline error sheet with retry button clearing to ready state; no implicit navigation on error.
  - [x] 3.4 i18n keys added under `unifiedCamera.capture.*` in both `es.json` and `en.json` (`hint`, `processing`, `captureButtonLabel`, `errorNoSubject`, `errorVisionFailed`, `errorIoFailed`, `retry`).
  - [x] 3.5 Co-located tests rewritten (8 cases: permission-grant render, back → getParent.goBack, happy-path typed params, 3×error kinds + retry clears sheet, takePictureAsync-null → visionFailed, unmount-during-processing guard).

- [x] **Task 4: Epic-13 consumer back-compat — `ArmarioCaptureScreen` single-line destructure tweak** (AC: #8, #9, #15)
  - [x] 4.1 `ArmarioCaptureScreen.tsx` line 122 updated to `const { cutoutUri } = await removeBackground(uri);` — no other edits to the file.
  - [x] 4.2 `ArmarioCaptureScreen.test.tsx` mock return shapes updated (4 call sites: happy-path, library branch, retry-after-error, unmount-during-processing). All 8 tests pass with no behavioral assertion changes.
  - [x] 4.3 `saveCutoutAsWardrobeItem.ts` + test UNCHANGED (verified).
  - [x] 4.4 `ArmarioPreviewScreen.tsx` + test UNCHANGED (verified).

- [x] **Task 5: Nav types tightening, `Result` placeholder update, quality gates + on-device evidence** (AC: #10, #11, #12, #14)
  - [x] 5.1 `UnifiedCameraStackParamList.Result` tightened to `{ cutoutUri, dominantHex, wadaMatch }`; `MatchResult` imported from `@/lib/colorTypes`.
  - [x] 5.2 `UnifiedCameraResultScreen` now consumes typed `route.params` via `RouteProp<…, "Result">` + renders `dominantHex` + `wadaMatch.type` diagnostic monospace block.
  - [x] 5.3 Result screen test grown from 1 → 2 cases (placeholder render + diagnostic text with mock params).
  - [x] 5.4 Quality gates: `npx tsc --noEmit` clean, `pnpm biome check --write` clean, `pnpm test` → 778 passing / 60 pre-existing / 0 new failures / 0 new skips vs. 14.3a's 771/60 baseline → **+7 net** (within/above AC #11 target of +3 to +6, 0 regressions).
  - [x] 5.5 On-device smoke + evidence deferred to Alejandro (Swift change requires `npx expo run:ios`). See Completion Notes for the flagged request.

### Review Findings

- [x] [Review][Defer] D-14.3b-1 Back button disabled while error persists after repeated Vision failures — pre-existing ArmarioCaptureScreen pattern; modal swipe-to-dismiss is the escape hatch [src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx] — deferred, pre-existing
- [x] [Review][Defer] D-14.3b-2 PixelLayout default case handles all unknown 32-bit formats silently as BGRA — documented design decision per Dev Notes risk list; Vision only returns 32-bit formats [modules/background-removal/ios/BackgroundRemovalModule.swift:240] — deferred, design decision
- [x] [Review][Defer] D-14.3b-3 runPipeline has no timeout — native Vision call can hang indefinitely; pre-existing ArmarioCaptureScreen pattern; no practical hang observed in production [src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx] — deferred, pre-existing
- [x] [Review][Defer] D-14.3b-4 UnifiedCameraResultScreen diagnostic hex/type text visible in production without `__DEV__` guard — intentional per spec; Story 14.4 replaces this screen entirely [src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx] — deferred, intentional placeholder

## Dev Notes

### Architecture context (Epic 14 — unified camera pipeline)

- **Branch:** create `story/14-3b-unified-camera-pipeline-swift-module` off `epic-14` at the commit where 14.3a landed (`de6b052` per sprint-status).
- **Target version:** v1.4.0 (launch blocker). This story is the Swift + pipeline step between 14.3a (nav shell merged) and 14.4 (Result UI per UX-DR1).
- **TD-1 (epic-14.md §Technical Decisions, line 55) mandates:** dominant-color extraction moves INTO the Swift module. `react-native-image-colors`'s `getColors` is NEVER called on the cutout. The transparency trap (alpha=0 pre-multiplied pixels bias average toward black) is eliminated at the root.
- **TD-2 mandates:** `ArmarioCaptureScreen` + `ArmarioPreviewScreen` + `ArmarioStack` PRESERVED. Only a single-line destructure tweak on line 122 of `ArmarioCaptureScreen.tsx` to consume the new object return; NO behavioral change to the armario flow.
- **Out of scope THIS story:**
  - ❌ Result UI (14.4 owns per UX-DR1 — this story lands a DIAGNOSTIC placeholder).
  - ❌ Category sheet + save flow (14.5 owns).
  - ❌ `expo-image-picker` library fallback on unified camera (product decision: camera-only for v1.4.0).
  - ❌ Removal of `react-native-image-colors` from `package.json` (future cleanup; no `src/**` calls it anyway after this story, but the dependency is still listed).
  - ❌ Deletion of `modules/white-balance` (12-3 Swift module from v1.3.0 — no unified-camera consumer; cleanup is deferred to a later story or retro punch-list).

### Pipeline shape after this story

```
UnifiedCameraCaptureScreen (NEW implementation)
  ├─ takePictureAsync({ quality: 0.8 })
  │     └─ photo.uri (file:///…/camera-<uuid>.jpg)
  └─ removeBackground(photo.uri)                                        ← native module (Swift)
        ├─ Vision VNGenerateForegroundInstanceMaskRequest (full-res)
        ├─ generateMaskedImage → CVPixelBuffer                          ← full-res
        ├─ computeDominantHex(buffer)                                   ← NEW (TD-1)
        │     ├─ iterate RGBA8 pixels, alpha > 127
        │     ├─ de-premultiply, accumulate sumR/sumG/sumB/count
        │     └─ format "#%02X%02X%02X"
        ├─ downsampleIfNeeded → CIImage ≤ 2048px longest edge
        ├─ PNG encode (sRGB) → tmp/cutout-<uuid>.png
        └─ return ["cutoutUri": outputURL.absoluteString, "dominantHex": hex]
                          ↓
  const { cutoutUri, dominantHex } = await removeBackground(photo.uri)
  const lab      = hexToLab(dominantHex)
  const matches  = matchWadaColor(lab)                                  ← existing pure-JS (src/lib/colorMatch.ts)
  const wadaMatch = classifyMatch(matches)                              ← existing pure-JS
  navigation.push("Result", { cutoutUri, dominantHex, wadaMatch })      ← typed params per AC #10
```

The Epic-13 armario flow (`ArmarioCaptureScreen` → `removeBackground` → `ArmarioPreview` → `saveCutoutAsWardrobeItem`) is UNCHANGED in behavior: it still gets `cutoutUri` back; it simply destructures from the new return shape. `dominantHex` is fetched but unused on that path (cutout-only, no Wada tone detection — by design per TD-2).

### Why dominant-color extraction is in the SAME Vision pass (not a separate function)

Tech review Finding 1 considered three approaches: (a) JS-side `getColors` on the PNG (transparency trap — NOT viable), (b) Swift composite over neutral grey before returning PNG (wastes pixels, doesn't help lossy re-encoding), and (c) Swift reads pixel buffer directly after segmentation. Option (c) wins because:

- The CVPixelBuffer is ALREADY in memory post-`generateMaskedImage`; no second bridge crossing.
- Alpha threshold > 0.5 excludes transparent padding entirely.
- De-premultiplication recovers the true RGB of antialiased edges (important for pale/saturated garments where edge pixels carry partial alpha but full color).
- A single-pass iteration is ~10ms on iPhone 14 for a 2048×1500 image — immeasurable next to Vision's ~800ms segmentation.
- No Swift dependency (Core Graphics suffices; no `Accelerate` / BNNS needed).

### De-premultiplication math — why it matters

iOS Vision's `generateMaskedImage` returns pre-multiplied alpha: a pixel that's "70% opaque red" has R=178, G=0, B=0, A=178 (not R=255, G=0, B=0, A=178). If you average pre-multiplied pixels directly, opaque-but-dim pixels (e.g., shadowed fabric) contribute less weight than they should, skewing the dominant color darker.

**Correct formula** (de-premultiplied average):
```
for each pixel with alpha > 127:
    a_norm = alpha / 255.0
    r_true = R / a_norm
    g_true = G / a_norm
    b_true = B / a_norm
    sum_r += r_true; sum_g += g_true; sum_b += b_true; count += 1

avg_r = clamp(round(sum_r / count), 0, 255)
```

This ensures a 70%-opaque red pixel contributes `(255, 0, 0)` to the average (not `(178, 0, 0)`).

### Why we don't just use the center-pixel of the cutout

Prior approach (`CaptureScreen` from Epic 12, now deleted): center-pixel sampling + WB-slider correction. Fails on:
- Patterned garments (a polka-dot shirt's center pixel may be a dot, not the field color).
- Off-center compositions (the garment's bounding box isn't always centered in the frame post-Vision crop).
- Non-uniform fabrics (knits with visible loops or weaves average differently at pixel level).

Weighted average over ALL `alpha > 0.5` pixels is statistically robust against all three. For garments with genuine two-tone patterns (e.g., a red-and-white striped shirt), the result is a perceived "pink" Wada tone — which is correct for outfit coordination purposes (matching to a pink Wada combination still produces a sensible outfit). UX-DR1's "tone correction" affordance (ΔE < 8 between top-2 candidates) catches edge cases where the user disagrees; that's a Story 14.4 surface, not ours.

### i18n namespace decision — `unifiedCamera.*` not `colorCapture.*`

The `colorCapture.*` namespace was the home of Epic 12's deleted `CaptureScreen`. Story 14.3a updated `colorCapture.cameraButtonLabel` and `colorCapture.closeCameraLabel` for the FAB + placeholder back button (those keys were load-bearing for existing Tab Bar + placeholder code). New keys added THIS story for the unified camera's actual UI (hint, error copy, retry) go under a fresh `unifiedCamera.capture.*` namespace because:

- Semantic separation: `colorCapture` was Epic 12 color-first camera copy; `unifiedCamera` is Epic 14 garment-first camera copy. Conflating them ties future copy changes into a net.
- Story 14.4 will add `unifiedCamera.result.*` keys for the Result UI — having the namespace reserved now is cleaner than renaming mid-sprint.
- The existing `colorCapture.cameraButtonLabel` + `colorCapture.closeCameraLabel` keys stay in `colorCapture` (not migrated) — they're consumed by the Tab Bar FAB + close button, NOT by the capture screen's content. Semantic accuracy matters less than diff surface; leave them.

### Test mock closure pattern — deferred lookup (from memory `feedback_jest_native_module_mock.md`)

```ts
// ❌ WRONG — TDZ trap because jest.mock is hoisted ABOVE the const declaration
const mockFn = jest.fn();
jest.mock("expo-modules-core", () => ({ requireNativeModule: () => ({ removeBackground: mockFn }) }));

// ✅ RIGHT — defer the lookup through a closure; the factory captures the
// identifier, resolution happens at call-time (after init finishes)
const mockFn = jest.fn();
jest.mock("expo-modules-core", () => ({
    requireNativeModule: () => ({
        removeBackground: (uri: string) => mockFn(uri),
    }),
}));
```

`modules/background-removal/src/index.test.ts` already uses this pattern. Preserve it.

### Known risks to guard against

- **Dominant-hex returns `#000000` on a clearly-colored garment** — indicates de-premultiplication logic is wrong (likely dividing premultiplied R/G/B by alpha=0 or similar). First sanity check: unit-test the Swift helper on a known CVPixelBuffer (a 10×10 buffer of pure opaque red `(255, 0, 0, 255)` must return `#FF0000`). Add an XCTest file if Swift-test infrastructure exists in the module (check `modules/background-removal/` for an existing `Tests/` dir — if none, the Jest-level AC #14 on-device smoke is the verification layer).
- **Mock shape-mismatch in test suite cascade** — if Task 4.2's mock update misses a `mockResolvedValue("file://…")` call in `ArmarioCaptureScreen.test.tsx`, the destructure `const { cutoutUri } = await removeBackground(uri)` on line 122 will produce `cutoutUri = undefined`, which downstream navigates to `ArmarioPreview` with `cutoutUri: undefined` and the preview test fails opaquely. Grep `mockResolvedValue.*file://` and `mockResolvedValueOnce.*file://` before running tests; update in one pass.
- **`setState` after unmount** — a user who taps FAB, captures a photo, then immediately swipes the modal down while the 2–3s pipeline runs can race `setProcessing(false)` after unmount. The `isMounted` ref pattern from `ArmarioCaptureScreen.tsx` is the guard. Mirror it exactly; do NOT invent a new abort pattern.
- **Route-params type drift** — tightening `Result` params to `{ cutoutUri, dominantHex, wadaMatch }` makes the existing `UnifiedCameraResultScreen` placeholder a type error UNLESS AC #10 / Task 5.2 updates it in the same commit. TypeScript will surface this immediately in `tsc --noEmit`.
- **Color-space drift between Swift sRGB encode and JS hex-to-Lab** — `pngRepresentation` uses `.sRGB`, and `hexToLab` (`src/lib/colorConversion.ts`) converts hex → sRGB → linearized → XYZ → Lab via standard D65 transforms. The two halves are consistent; no action needed, but worth a mental note if Wada matches feel "off" on-device (the usual cause is WB, not color-space — and WB is now moot because Vision segmentation is scene-independent of WB slider).
- **Metro cache staleness post-Swift-rebuild** — after `npx expo run:ios`, sometimes Metro serves an old bundle where TS types haven't picked up the module return-shape change. If JS errors with "removeBackground is not an object", `pnpm start --clear` per `feedback_simulator_reset.md` — NEVER erase the simulator.
- **Pre-existing 48 OutfitVisualizer + 12 i18n failures** — these are documented baseline failures (from 14.2 / 14.3a dev logs). They MUST stay at 60 exactly. If the count changes, either a real regression was introduced by this story OR a pre-existing failure was masked/unmasked — investigate before signing off.
- **Expected behavior when `wadaMatch.type === "out-of-coverage"`** — a bright neon garment will land `ΔE > 15` against every Wada color. The diagnostic placeholder in Story 14.3b should still render (`dominantHex = #<neon>`, `wadaMatch.type = "out-of-coverage"`). The Result UI in 14.4 handles this case via UX-DR1's OutOfCoverageSheet-replacement inline section. Do NOT block or error this story on out-of-coverage; it's a legitimate output.
- **iOS `CVPixelBuffer` pixel format** — Vision's `generateMaskedImage` returns pre-multiplied BGRA or RGBA depending on the iOS version / device. The Swift helper must inspect `CVPixelBufferGetPixelFormatType(buffer)` and branch between `kCVPixelFormatType_32RGBA` and `kCVPixelFormatType_32BGRA` (swap R/B indices accordingly). Assume BGRA unless verified RGBA; on iPhone 14+ both are possible. Failing to branch here → blue/red color swap on-device (easy to spot: a red shirt detects as "teal"). Include both format branches defensively.

### File layout (touched by this story)

```
modules/
└── background-removal/
    ├── ios/BackgroundRemovalModule.swift       # EDIT — add computeDominantHex helper, change return shape to [String: String]
    └── src/
        ├── index.ts                             # EDIT — return type to Promise<{ cutoutUri, dominantHex }>, JSDoc update
        └── index.test.ts                        # EDIT — mock shape, happy-path assertion, +1 new forwarding test

src/
├── navigation/
│   └── types.ts                                 # EDIT — tighten UnifiedCameraStackParamList.Result, import MatchResult
├── screens/
│   ├── armario/
│   │   ├── ArmarioCaptureScreen.tsx             # EDIT (1 LINE ONLY) — destructure const { cutoutUri } = await removeBackground(uri)
│   │   ├── ArmarioCaptureScreen.test.tsx        # EDIT — mock return-value shape (bare string → { cutoutUri, dominantHex })
│   │   ├── ArmarioPreviewScreen.tsx             # UNCHANGED
│   │   └── ArmarioPreviewScreen.test.tsx        # UNCHANGED
│   └── unifiedCamera/
│       ├── UnifiedCameraCaptureScreen.tsx       # REWRITE — placeholder → real pipeline
│       ├── UnifiedCameraCaptureScreen.test.tsx  # REWRITE — 3 smoke cases → ~6–8 pipeline cases
│       ├── UnifiedCameraResultScreen.tsx        # EDIT — add typed route.params destructure + dominantHex diagnostic
│       ├── UnifiedCameraResultScreen.test.tsx   # EDIT — +1 case for diagnostic render with mock params
│       ├── UnifiedCameraPostSaveScreen.tsx      # UNCHANGED
│       └── UnifiedCameraPostSaveScreen.test.tsx # UNCHANGED
├── lib/
│   ├── colorMatch.ts                            # UNCHANGED (consumed as-is)
│   ├── colorConversion.ts                       # UNCHANGED (hexToLab consumed as-is)
│   ├── colorTypes.ts                            # UNCHANGED (MatchResult imported from here)
│   └── armario/
│       ├── saveCutoutAsWardrobeItem.ts          # UNCHANGED (consumes cutoutUri as input arg, not return of removeBackground)
│       └── saveCutoutAsWardrobeItem.test.ts     # UNCHANGED
└── i18n/locales/
    ├── es.json                                  # EDIT — add unifiedCamera.capture.{hint, errorNoSubject, errorVisionFailed, errorIoFailed, retry}
    └── en.json                                  # EDIT — same keys with EN copy
```

No `tsconfig.json`, `jest.config.js`, `babel.config.js`, `metro.config.js`, `package.json` dependency, or `App.tsx` changes this story. `modules/white-balance` is NOT deleted (separate story's call).

### Patterns to follow (MUST)

- **Function declarations with named exports** — never `export default` (CLAUDE.md).
- **NativeWind `className` for static styles**; `style={{}}` only for dynamic values (`insets.top + 8` in 14.3a precedent; extend with dynamic Wada accent colors ONLY when placed by 14.4 — not here).
- **Props interface required** — the new `UnifiedCameraCaptureScreen` keeps its `type UnifiedCameraCaptureScreenProps = Record<string, never>` from 14.3a.
- **Biome:** tabs, double quotes, run `pnpm biome check --write src/** modules/**` before commit.
- **Tests co-located** — each `.test.tsx` next to its source.
- **Haptics exclusively through `lib/haptics.ts`** — use `hapticMedium()` on capture press, `hapticLight()` on pipeline success before navigate. Error path: NO haptic (error sheet is already announced via live region).
- **Respect `useReducedMotion`** — the `UnifiedCameraStack`'s animation already honors it (14.3a). No in-screen animations this story.
- **Accessibility:** every new interactive node gets `testID`, `accessibilityLabel`, `accessibilityRole`, ≥44pt min hit area. Error sheet uses `accessibilityLiveRegion="assertive"`; processing overlay uses `accessibilityLiveRegion="polite"`.
- **No analytics / telemetry** — NFR8 / `feedback_no_analytics.md`.
- **Defer Jest mock lookups through a closure** — `feedback_jest_native_module_mock.md`.

### References

- Epic source of truth — [docs/planning/epic-14/epic-14.md §Story 14.3b](../../docs/planning/epic-14/epic-14.md#story-143b-unified-camera-pipeline--swift-module-signature-change) (lines 369–417)
- TD-1 (Swift-side dominant-color extraction) — [docs/planning/epic-14/epic-14.md §Technical Decisions](../../docs/planning/epic-14/epic-14.md#technical-decisions-post-review--read-before-implementing-any-story) (line 55)
- Technical review Finding 1 (transparency trap problem + Option A chosen) — [docs/planning/epic-14/epic-14-tech-review.md §Finding 1](../../docs/planning/epic-14/epic-14-tech-review.md#finding-1--getcolors-over-transparent-png-false-positive-dominant-color) (lines 50–85)
- UX spec UX-DR1 Capture + Result (real UI lands in 14.4; this story ships a diagnostic Result placeholder) — [docs/planning/ux-design-epic-14.md §UX-DR1](../../docs/planning/ux-design-epic-14.md#ux-dr1--unified-camera-flow-capture--result) (lines 77–205)
- Prior Story 14.3a (nav shell + CaptureScreen deprecation — placeholder screens this story rewrites) — [./14-3a-unified-camera-nav-setup-capturescreen-deprecation.md](./14-3a-unified-camera-nav-setup-capturescreen-deprecation.md)
- Armario camera precedent (permissions + error handling + processing overlay pattern to mirror) — [src/screens/armario/ArmarioCaptureScreen.tsx](../../src/screens/armario/ArmarioCaptureScreen.tsx)
- Swift module source — [modules/background-removal/ios/BackgroundRemovalModule.swift](../../modules/background-removal/ios/BackgroundRemovalModule.swift)
- TS module surface — [modules/background-removal/src/index.ts](../../modules/background-removal/src/index.ts)
- Color conversion + matching — [src/lib/colorConversion.ts](../../src/lib/colorConversion.ts), [src/lib/colorMatch.ts](../../src/lib/colorMatch.ts), [src/lib/colorTypes.ts](../../src/lib/colorTypes.ts)
- Nav types — [src/navigation/types.ts](../../src/navigation/types.ts)
- ADR-005 (data-layer architectural record — informs why `saveCutoutAsWardrobeItem` already consumes unified `useMisLooksStore`) — [docs/adrs/ADR-005-unified-mis-looks-store.md](../../docs/adrs/ADR-005-unified-mis-looks-store.md)
- Memory — `feedback_native_module_rebuild.md` (full `expo run:ios` required for Swift change)
- Memory — `feedback_jest_native_module_mock.md` (deferred mock lookup closure pattern)
- Memory — `feedback_image_colors_library.md` (historical: `react-native-image-colors` `.background` vs `.primary` — no longer relevant because JS-side `getColors` on cutout is extinct per TD-1)
- Memory — `feedback_js_swift_constant_sync.md` (if you add a Swift constant like `MIN_ALPHA_BYTE = 127` and a JS equivalent, cross-reference both in named comments — likely not needed this story since the threshold lives entirely in Swift)
- Memory — `feedback_simulator_reset.md` (clear Metro with `--clear`, never erase simulator)
- CLAUDE.md — §Story Scope (4–5 task cap), §React Native Specifics, §Accessibility First, §Error Handling (try/catch on native APIs — applies to Swift error bridge + JS catch around `removeBackground`)

### Project Structure Notes

- No new top-level directories. `src/screens/unifiedCamera/` already exists from 14.3a.
- No new dependencies. `expo-camera`, `expo-modules-core`, `react-i18next`, `react-native-safe-area-context` are all already present.
- `react-native-image-colors` stays in `package.json` (unused by `src/**` after this story but not deleted — future cleanup; listing it as "dead dep" in the retrospective punch-list is appropriate).
- AsyncStorage keys, AppState handlers, `runMisLooksMigration` — UNCHANGED this story. Pipeline is transient: camera → cutout PNG (tmp) → navigate; nothing persists.
- Native `ios/` build artifacts require regeneration. The dev-agent MUST flag Alejandro to run `npx expo run:ios` (per `feedback_native_module_rebuild.md`) before any on-device smoke.
- `modules/white-balance` (Epic 12's WB Swift module) is orphaned post-14.3a (its only JS consumer was the deleted `CaptureScreen`). Do NOT delete it in this story — that's a separate cleanup. If `pnpm test` or `tsc` surfaces any stray import of `modules/white-balance` from `src/**`, treat it as a bug: grep should already return zero hits (Story 14.3a verified this).

## Dev Agent Record

### Agent Model Used

Opus 4.7 (claude-opus-4-7, 1M context)

### Debug Log References

- `pnpm jest modules/background-removal/src/index.test.ts` → 6/6 passing (was 5, +1 for verbatim forwarding).
- `pnpm jest src/screens/unifiedCamera/` → 11/11 passing across 3 suites (Capture 8, Result 2, PostSave 1).
- `pnpm jest src/screens/armario/ArmarioCaptureScreen.test.tsx` → 8/8 passing (no delta; mock shapes updated only).
- `npx tsc --noEmit` → clean.
- `pnpm biome check --write src modules` → 162 files checked, 4 cosmetic fixes applied (none semantic).
- `pnpm test` → 778 passing / 60 pre-existing failures / 0 new failures / 0 new skips (baseline 771/60 from 14.3a done → **+7 net passing**).

### Completion Notes List

- **TD-1 delivered end-to-end.** Swift `computeDominantHex` samples the FULL-resolution masked CVPixelBuffer before the 2048px downsample step, gates by `alpha > 127` (== 0.5 on [0,1]), de-premultiplies each surviving channel, and formats `#RRGGBB` uppercase. The dominant color of a 2048-wide cutout and an 8064-wide cutout are guaranteed identical within rounding because the downsample now runs AFTER sampling.
- **Pixel-format defensiveness.** `PixelLayout(format:)` branches between `kCVPixelFormatType_32RGBA`, `kCVPixelFormatType_32BGRA` (default fallback), `32ARGB`, and `32ABGR`. Per Dev Notes "iOS CVPixelBuffer pixel format" risk, this prevents the red/blue swap that would turn a red shirt into teal on certain iOS builds.
- **Degenerate-cutout guard.** If no pixel survives the alpha gate, `computeDominantHex` returns `nil` and the outer `process(inputUri:)` throws `noSubject` Exception BEFORE encoding the PNG — so the JS side sees a correctly-mapped `BackgroundRemovalError` instead of a `#000000` cutout.
- **Return shape change isolated by TS types.** `BackgroundRemovalResult` interface exported from `modules/background-removal/src/index.ts`; call sites destructure at the source. Only two in-repo callers exist: `ArmarioCaptureScreen.tsx:122` (single-line tweak) and the new `UnifiedCameraCaptureScreen.tsx` (consumes both fields).
- **Epic-13 armario flow preserved byte-for-byte.** `saveCutoutAsWardrobeItem`, `ArmarioPreviewScreen`, `ArmarioStack`, and `ArmarioRoot` are UNCHANGED. Only the return-value destructure + test mock shape updated in `ArmarioCaptureScreen`. TD-2 verified.
- **Pipeline wiring follows UX-DR1 order exactly.** `hapticMedium` → `takePictureAsync({quality:0.8})` → (mount guard) → `removeBackground` → `{cutoutUri, dominantHex}` → `hexToLab` → `matchWadaColor` → `classifyMatch` → `setProcessing(false)` → `hapticLight` → `navigation.push("Result", {cutoutUri, dominantHex, wadaMatch})`. Error handling never navigates.
- **`react-native-image-colors` is unused by `src/**` after this story.** The dependency remains in `package.json` for future cleanup as stated in Dev Notes "Out of scope THIS story".
- **i18n namespace separation.** Per Dev Notes, added under fresh top-level `unifiedCamera.capture.*` rather than extending `colorCapture.*`. Existing `colorCapture.cameraButtonLabel` / `colorCapture.closeCameraLabel` / `colorCapture.openSettings` / `colorCapture.permissionDenied` keys are reused for the permission-denied fallback UI (consistent with 14.3a precedent — they're camera-permission copy, not capture-surface copy).
- **Test count delta = +7.** AC #11 targeted +3 to +6 minimum ≥774. Final count 778 exceeds the target by 1; the excess comes from the `it.each` block in the new Capture screen test generating 3 parameterized cases (one per BackgroundRemovalError kind) plus a null-photo case — effectively 5 new Capture tests (plus 3 smoke-equivalents preserved) instead of ~4. Zero regressions introduced.
- **🔴 `npx expo run:ios` REQUIRED before on-device smoke.** This is a native Swift module change — per memory `feedback_native_module_rebuild.md`, Metro reload is NOT enough. The Pods + Xcode build must regenerate. Alejandro: run `npx expo run:ios --device` (or simulator) to pick up the new return shape before running AC #14 + AC #15 garment captures on iPhone 14+/iOS 17+.
- **On-device AC #14 ✅ verified by Alejandro (2026-04-21).** Three-garment smoke passed: gray T-shirt → `dominantHex = #595D5D`, `wadaMatch.type = "confirm"` (ΔE ∈ [2,15] is expected for a neutral gray against Wada's 1933 organic-pigment palette, which is sparse in pure grays); pale + saturated garments both produced visually-matching hexes with no `#000000` near-black results. TD-1 transparency trap is extinct on-device. AC #15 (TD-2 armario path byte-for-byte preservation) pending final on-device pass.
- **Pre-existing 60 failures unchanged.** 48 `OutfitVisualizer.getState` + 12 `i18n.test.ts` detectLanguage — verified count exactly matches 14.3a baseline.

### File List

Modified:
- `modules/background-removal/ios/BackgroundRemovalModule.swift`
- `modules/background-removal/src/index.ts`
- `modules/background-removal/src/index.test.ts`
- `src/screens/armario/ArmarioCaptureScreen.tsx`
- `src/screens/armario/ArmarioCaptureScreen.test.tsx`
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx`
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx`
- `src/navigation/types.ts`
- `src/i18n/locales/es.json`
- `src/i18n/locales/en.json`

Unchanged (verified):
- `src/lib/armario/saveCutoutAsWardrobeItem.ts` + `.test.ts`
- `src/screens/armario/ArmarioPreviewScreen.tsx` + `.test.tsx`
- `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx` + `.test.tsx`
- `src/lib/colorMatch.ts`, `src/lib/colorConversion.ts`, `src/lib/colorTypes.ts`

### Change Log

| Date       | Change |
|------------|--------|
| 2026-04-21 | Story 14.3b implemented: Swift `removeBackground` returns `[String: String]` with `cutoutUri` + weighted dominant `dominantHex` (TD-1); TS surface + Jest mocks updated; `UnifiedCameraCaptureScreen` rewritten from 14.3a placeholder into full Vision pipeline (take → remove → hexToLab → matchWada → classify → navigate); `UnifiedCameraResultScreen` placeholder gained typed `route.params` + dev diagnostic; `ArmarioCaptureScreen` single-line destructure tweak (TD-2 preservation verified). Quality gates pass: tsc clean, biome clean, 778/60/0 tests. Branch: story/14-3b-unified-camera-pipeline-swift-module. Native rebuild (`npx expo run:ios`) required before on-device smoke. |
