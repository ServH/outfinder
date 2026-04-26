# Epic 12 — Code Review (Color Capture)

**Date:** 2026-04-15
**Scope:** Stories 12.1 + 12.2 + 12.3 + 12.4 (full epic, branch diff `epic-1..epic-12`, 39 files, ~3500 lines code)
**Review mode:** full (4 story specs loaded as context)
**Layers run:** Blind Hunter + Edge Case Hunter + Acceptance Auditor
**Reviewer model:** Opus 4.6 (1M context) — fresh session
**Final status:** All decisions resolved, 37/38 actionable patches applied, feature validated on physical iPhone with high recognition accuracy.

---

## 🏆 Critical recognition-quality fix (applied post-review during device testing)

The code review plus the 6 HIGH patches brought the pipeline to clean architecture, but the first on-device test revealed recognition was still **consistently wrong** — a white shirt was matched to black/grey Wada colors. Two late discoveries fixed this decisively:

### Bug A — `react-native-image-colors.primary` is Apple-Music naming, not image-dominant naming

On iOS, the library wraps Apple's `UIImageColors`. The fields are:

| Field | Actual meaning |
|---|---|
| `background` | **Dominant pixel colour of the image** (what we actually wanted) |
| `primary` | Colour that *best contrasts* with background (for foreground text on album art) |
| `secondary` | Another contrasting colour |
| `detail` | Accent detail |

Story 12.3 Dev Notes said `"dominant = colors.primary"` — that's Apple Music semantics, not "image dominant" semantics. The whole pipeline was therefore matching against the **contrast colour** of the user's garment, not the garment itself. A red shirt → `primary` ≈ white/black → matched to Wada's white/black.

**Fix:** `CaptureScreen.tsx` reads `colors.background` on iOS (1-line JS change, no rebuild).

### Bug B — No region targeting; fondo / piel / sombras eran mayoría de píxeles

Even with `background`, the library averages over the whole frame. Without a targeting UI, the user didn't know where to point and the analysis absorbed background, skin, shadows. We needed a visible framing rectangle paired with a matching pipeline crop.

**Fix:** Two-sided constant `ANALYSIS_FRAME_FRACTION = 0.65` / `analysisFraction: CGFloat = 0.65`:
- **JS (`CaptureScreen.tsx`):** `AnalysisFrame` component draws 4 corner brackets centred on the screen at 65% of the shorter edge. `pointerEvents="none"` so taps pass through to the camera.
- **Swift (`WhiteBalanceModule.swift`):** new `centerCrop(image, fraction:)` helper. Pipeline now runs `load → downsample → auto-WB estimate on full frame → WB filter → center-crop to 65% → JPEG → getColors`. The `getColors` input therefore contains only pixels the user saw inside the brackets.
- **Sync invariant:** both constants doc-reference each other. If one changes, the other MUST change to keep visible framing aligned with analysis region.

### Pipeline architecture (final)

```
User taps capture
  ↓
takePictureAsync (quality 0.8, full-resolution JPEG)
  ↓  [JS CaptureScreen.takePicture, isMounted guards after each await]
applyWhiteBalance(uri, wbMode)
  ↓  [Swift WhiteBalanceModule.process]
  load CIImage (percent-decoded URL)
  ↓
  downsampleIfNeeded → max 2048px long edge (OOM guard)
  ↓
  estimateBorderTemperature (auto mode) OR clamp manual [2700, 7000]
  ↓  (auto-mode isLowVariance check → 6500 no-op for solid scenes)
  CITemperatureAndTint filter  ← full-frame context for better WB
  ↓
  centerCrop to 65% square     ← match on-screen frame
  ↓
  writeJPEGRepresentation to `wb-corrected.jpg` (deterministic slot)
  ↓  [JS]
getColors(uri, { fallback: EXTRACTION_FAILED_HEX })
  ↓
colors.background (iOS) | colors.dominant (fallback)
  ↓
normalizeHex → #RRGGBB canonical
  ↓
hexToLab → matchWadaColor → classifyMatch
  ↓
direct / confirm / out-of-coverage sheets
```

### Validation

- Tested on physical iPhone: white shirt now matches to light Wada shades correctly; recognition accuracy reported as high on typical garments.
- Lighting variance still matters (fundamental physics limit without a reference card) but UX framing dramatically reduces uncontrolled noise.

---

## Triage summary

| Bucket | Count | Applied | Pending |
|---|---|---|---|
| `decision-needed` | 4 | 4 ✅ | 0 |
| `patch` (HIGH) | 8 | 8 ✅ (P7+P8 obviated) | 0 |
| `patch` (MEDIUM) | 15 | 14 | 1 (P21 test refactor) |
| `patch` (LOW) | 15+2 | 14 | 3 (P19/P26/P27/P28 native-module typing) |
| `defer` | 16 | doc'd | — |
| `dismiss` | 3 | — | — |
| **Total actionable applied** | **42** | **37/38** | **4 deferred** |

**Recognition-quality fix (post-review):** 2 additional patches applied on-device — `primary→background`, `AnalysisFrame` + `centerCrop` sync.

---

## 🔴 Decision-needed (4)

- [x] **[Review][Decision] D1 — RESOLVED: `navigation.replace` + remove `fullScreenModal` + hide tab bar on CaptureScreen (2026-04-15, validated in simulator)**
  Root cause: `presentation: "fullScreenModal"` on CaptureScreen forced iOS modal lifecycle. With `push`, 3 VCs stacked. With `reset`, hidden state corruption. With `replace` alone, modal dismiss revealed ColorHome for one frame ("flash"). Final fix:
  1. `CaptureScreen.tsx:54-60, 110-114` — `navigation.replace("Combinations", { colorId, capturedHex })` on both paths. Removed `CommonActions` import.
  2. `ColorsStack.tsx:30` — removed `presentation: "fullScreenModal"`. CaptureScreen is now a plain card stack screen.
  3. `CustomTabBar.tsx:44-45, 95-99` — early return `null` when `activeColorsScreen === "CaptureScreen"` (hides tab bar on both iPhone + iPad layouts).
  4. Test mock updated to `replace: mockReplace`. 22/22 CaptureScreen tests green; tsc + lint clean.
  P8 obviated. P9, P15, P21 simplified (deterministic sheet lifecycle now).

- [x] **[Review][Decision] D1 — Navigation strategy: `CommonActions.reset` still used where spec + prior review said `navigation.push`**
  Story 12.3 AC #5 and Story 12.4 AC #2 say `navigation.push("Combinations", …)`. Story 12.4 Review Findings explicitly documented the resolution: `"CommonActions.reset → navigation.push — resolved: push preferred so user can back to CaptureScreen"`. The committed code at `CaptureScreen.tsx:56-68` and `:119-133` still uses `CommonActions.reset` on BOTH the direct-match and sheet-selection paths. This wipes the stack history (user cannot back-swipe to the camera) and discards whatever ColorHome state (State 1 fabric grid vs State 2 shade picker) the user was in.
  **Options:** (a) Revert to `navigation.push` per spec — user keeps navigation history including CaptureScreen. (b) Keep `reset` and update both specs + story review findings to document the deliberate reversal. Current state is a silent regression.

- [x] **[Review][Decision] D2 — RESOLVED: silent manual-flip on first slider touch + sentinel `WB_AUTO_MODE = -1` + Swift throws on sample failure (2026-04-15, validated in simulator)**
  - `modules/white-balance/src/index.ts` — exports `WB_AUTO_MODE = -1` constant with doc comment.
  - `WhiteBalanceModule.swift:29` — `if temperature < 0.0` instead of `== 0.0`. `estimateBorderTemperature` now `throws`; replaces silent `return 5500` fallback with NSError code 5.
  - `CaptureScreen.tsx` — added `userAdjustedWb` ref. Slider `onValueChange` flips ref to `true`. `wbMode = userAdjustedWb.current ? wbTemperature : WB_AUTO_MODE`. Manual 5500K now distinguishable from default.
  - 22/22 tests green; tsc + lint clean. Native rebuild required (`expo prebuild --clean && expo run:ios`) — done.
  - Side effect: P7 (Swift fallback 5500 magic) closed by the same fix.

- [x] **[Review][Decision] D2 — WB auto-mode sentinel collides with legitimate slider value**
  `CaptureScreen.tsx:100`: `const wbMode = wbTemperature === 5500 ? 0 : wbTemperature;`. If a user deliberately sets the slider to 5500K (the default daylight), they silently get auto-CCT instead of an explicit manual correction. Float rounding from the slider (5499.99) flips the mode invisibly. Also, Swift fallback `return 5500` on empty border strips reuses the same magic value — a total failure becomes indistinguishable from "manual daylight".
  **Options:** (a) Add separate `wbMode: "auto" | "manual"` state with explicit toggle on the slider (UX change). (b) Use negative sentinel (e.g. `-1`) over the bridge, never a value inside the valid domain. (c) Wire the WB slider's `onValueChange` to flip a `manualMode` ref — slider-at-5500-after-touch still counts as manual.

- [x] **[Review][Decision] D3 — RESOLVED: clarifying label "Scene light · {temp}K" / "Luz de escena · {temp}K" added to slider (2026-04-15, validated)**
  After re-verification, the existing Swift implementation already matches the Lightroom mental model (slider value = assumed scene light Kelvin → lower K cools the image, higher K warms it). The real issue was the bare `{temp}K` label gave no context. Fix: added `wbTempLabel` i18n key (EN+ES) with interpolation; CaptureScreen renders `t("colorCapture.wbTempLabel", { temp })` instead of bare numeric. No Swift change. Tests updated; 22/22 green.

- [x] **[Review][Decision] D3 — CITemperatureAndTint semantic direction is ambiguous in UX**
  `WhiteBalanceModule.swift:41-42` sets `inputNeutral: sceneTemp` and `inputTargetNeutral: 6500`. Apple's semantic: `inputNeutral` = "Kelvin the scene was shot at". But the UI shows `{temp}K` with no context — user doesn't know whether dialing 3000K means "the scene IS 3000K, normalize it" or "I want the output to feel 3000K (warm)". The slider needs a label (`t("colorCapture.wbSliderHint")` e.g. "Scene temperature" vs "Adjust warmth"). No integration test pushes a known-warm image through to verify the correction direction matches user intent.
  **Options:** (a) Add a UX hint label clarifying which mental model the slider uses. (b) Invert the semantic (user picks target, pass 6500 as inputNeutral and slider value as inputTargetNeutral). (c) Keep as-is if research confirms the current direction matches Tier 3 expectations.

- [ ] **[Review][Decision] D4 — Camera entry point moved from ColorHome to TabBar FAB unilaterally**
  Story 12.2 AC #1 requires a camera button on ColorHome with `accessibilityLabel={t("colorCapture.cameraButtonLabel")}`. Story 12.4 ("tab bar redesign") replaced this with a FAB in CustomTabBar using `accessibilityLabel={t("tabs.cameraTab")}` — a different string. Neither Story 12.2 nor Story 12.4 specs authorized retiring the ColorHome button or changing the a11y label. The FAB also introduces cross-stack navigation quirks (`navigation.navigate("ColorsTab", { screen: "CaptureScreen" })` — doesn't reset deeply nested ColorsStack when coming from FavoritesTab).
  **Options:** (a) Keep FAB, retro-update Story 12.2 AC #1 + bring the a11y label to `colorCapture.cameraButtonLabel`. (b) Restore ColorHome button as a secondary entry point. (c) Document intentional override in project-context.

---

## 🔴 Patch — HIGH (8)

- [ ] [Review][Patch] P1 — **State updates after unmount + no AbortController** [`CaptureScreen.tsx:90-144`]
  If the user taps back mid-analysis, in-flight promises (`applyWhiteBalance`, `getColors`) still resolve and fire `setAnalysisVisible`, `setCapturedHex`, `setMatchState`, `navigation.dispatch(reset)` on an unmounted component. React logs warnings; worse, the reset dispatch may yank the user back to Combinations even though they deliberately left. Use an `isMounted` ref (`useRef(true)` with cleanup) or scope an effect-local abort flag; short-circuit all state/nav mutations if unmounted.

- [ ] [Review][Patch] P2 — **`cameraRef.current!` non-null assertion + `photo` undefined hazard** [`CaptureScreen.tsx:95`]
  Non-null assertion on a nullable ref. If camera is mid-teardown or `takePictureAsync` resolves to `undefined` (iOS aborts shutter on backgrounding), `photo.uri` throws and the opaque "analysisError" masks the real cause. Replace with explicit null check and dedicated error key (`colorCapture.cameraNotReady`).

- [ ] [Review][Patch] P3 — **Two `CIContext` instances created per capture** [`WhiteBalanceModule.swift:50, 86`]
  One in `process()` (GPU-accelerated), another in `estimateBorderTemperature()` (default options). CIContext creation compiles a Metal pipeline — expensive. Apple explicitly recommends reusing. On rapid retries this spikes memory and adds ~100ms to first sample on older devices. Cache a single `private static let sharedContext = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])`.

- [ ] [Review][Patch] P4 — **`getColors` dominantHex: `as any` + fallback indistinguishable + hex form narrow** [`CaptureScreen.tsx:103-110`, `colorConversion.ts:3-12`]
  Three overlapping issues: (1) `as any` skips the real discriminated union from `react-native-image-colors`. (2) `fallback: "#888888"` is indistinguishable from a truly-gray garment — user sees "Neutral Gray 5" as confident result even when extraction failed. (3) If library ever returns `#RGB` shorthand or `rgba(…)`, `hexToRgb` throws `RangeError` → generic "analysisError". Fix: strongly type the result, detect failure via `undefined`/empty, normalize short-form hex before `hexToLab`, surface a dedicated "could not read color" message.

- [ ] [Review][Patch] P5 — **OOM risk on 48MP iPhone 15 Pro photos** [`WhiteBalanceModule.swift:22-60`]
  `takePictureAsync({ quality: 0.8 })` returns full resolution (up to 8064×6048). Full-res goes through `CIAreaAverage` + GPU render + JPEG re-encode. On iPhone SE 2nd gen (3GB RAM) this can OOM. Dominant-color extraction does not need full resolution — downsample the CIImage to max 2048px dimension before processing (`imageByApplyingTransform` with scaling).

- [ ] [Review][Patch] P6 — **Auto-WB mis-corrects solid-color / low-variance images** [`WhiteBalanceModule.swift:68-103`]
  If the user photographs a monochrome wall/fabric (foreground = background), border sampling returns the subject color, and the CCT estimate pushes the subject toward "neutralized daylight" — the image that needed zero correction gets the most aggressive one. Compute stdev across the 4 strips; if variance is below a threshold, short-circuit `sceneTemp = 6500` (no-op correction).

- [ ] [Review][Patch] P7 — **Empty border-temp estimation silently returns 5500** [`WhiteBalanceModule.swift:96`]
  `guard count > 0 else { return 5500 }` reuses the JS-side "auto" sentinel as an error code. Also silently swallows total CIAreaAverage failure. Throw a typed error, or return `Double.nan` and let JS surface a distinct error. Never overload 5500 as both a default and a failure signal.

- [ ] [Review][Patch] P8 — **`CommonActions.reset` regression vs spec'd `navigation.push`** (see D1)
  If D1 resolves toward "push", apply the fix in two places: `CaptureScreen.tsx:56-68` (handleSelect) and `:119-133` (direct-match path). Replace both reset dispatches with `navigation.push("Combinations", { colorId, capturedHex: capturedHex ?? undefined })`.

---

## 🟡 Patch — MEDIUM (15)

- [ ] [Review][Patch] P9 — **`selectGuard` ref never reset on visible change** [`ColorMatchSheet.tsx:27-34`]
  Once a row is tapped, guard stays `true` forever. Today works by accident because `CommonActions.reset` unmounts CaptureScreen. When P8 is fixed to `push`, sheet stays mounted → second open of same mount silently swallows all taps. Add `useEffect(() => { if (!visible) selectGuard.current = false; }, [visible])`.

- [ ] [Review][Patch] P10 — **OutOfCoverageSheet has no double-tap guard at all** [`OutOfCoverageSheet.tsx:28-37`]
  Inconsistent with ColorMatchSheet. Double-tap on CTA during modal slide-out → `onSelect` fires twice → double navigation.dispatch. Mirror the `selectGuard` pattern; extract as a reusable hook.

- [ ] [Review][Patch] P11 — **`hexToRgb` rejects 3-digit CSS shorthand** [`colorConversion.ts:3-12`]
  `hexToRgb("#fff")` throws. If `react-native-image-colors` ever returns short form (Android or library update), pipeline breaks. Normalize `#RGB` → `#RRGGBB` and strip alpha from `#RRGGBBAA`. Partial overlap with P4.

- [ ] [Review][Patch] P12 — **`WADA_COLORS_WITH_LAB` typed `Readonly<T[]>` — doesn't actually freeze** [`colorMatch.ts:97`]
  `Readonly<Array<T>>` applies to assignment only; `.push()/.pop()` remain callable. Review patch P3 from Story 12.1 claimed to fix this but applied the wrong utility type. Use `readonly WadaColorWithLab[]` or `ReadonlyArray<...>`.

- [ ] [Review][Patch] P13 — **Temp JPEG files never cleaned up** [`WhiteBalanceModule.swift:51-62`]
  Each capture writes a UUID-named JPEG to `temporaryDirectory` with no cleanup. Heavy-session users accumulate ~1MB per capture. Delete the corrected temp file in JS `finally` (after `getColors` completes), OR adopt a "one slot" deterministic filename that overwrites.

- [ ] [Review][Patch] P14 — **`estimateCCT` n≈0 falls through to 7000K ceiling** [`WhiteBalanceModule.swift:141-148`]
  `safeG = max(g, 0.001)` guards division but `n = xRatio - yRatio * 0.5` can itself be near-zero. For n slightly positive → `1/n → ∞` → clamped 7000. For n slightly negative → fixed 7000. Both produce extreme warm correction from neutral input. Replace with `abs(n) < 0.01 → return 5500` (neutral daylight).

- [ ] [Review][Patch] P15 — **AnalysisOverlay doesn't reset `msgIndex`/opacity on visible rising edge** [`AnalysisOverlay.tsx:20-51`]
  On retry after error, overlay resumes from the previous message index mid-sentence. Cleanup also doesn't `cancelAnimation(opacity)` — in-flight `withTiming(1)` callbacks fire after unmount, leaving stale shared-value state. Add a rising-edge effect that resets `setMsgIndex(0); opacity.value = 1;` and a cleanup that calls `cancelAnimation(opacity)`.

- [ ] [Review][Patch] P16 — **AnalysisOverlay `accessibilityLiveRegion` announces every 600ms** [`AnalysisOverlay.tsx:64-67`]
  VoiceOver users hear 4 announcements per ~2.4s while the system should announce the *state* once. Announce once on `visible=true` via `AccessibilityInfo.announceForAccessibility(t("colorCapture.analyzing0"))` and drop `accessibilityLiveRegion` (or set it on an empty container that doesn't update).

- [ ] [Review][Patch] P17 — **Permanently-denied permission has no path to Settings** [`CaptureScreen.tsx:153-190`]
  When `canAskAgain === false`, user sees only a back button. No guidance. Show a secondary CTA "Open Settings" via `Linking.openSettings()` gated on `permission.status === "denied" && !permission.canAskAgain`.

- [ ] [Review][Patch] P18 — **Permission request race: ref guard + `permission.canAskAgain` both wobble** [`CaptureScreen.tsx:42-52`]
  `hasRequestedPermission` ref guard is a band-aid. If `requestPermission` reference is unstable across renders (expo-camera doesn't guarantee memoization), the effect can re-fire. Gate on `permission.status === "undetermined"` instead of a boolean ref.

- [ ] [Review][Patch] P19 — **`applyWhiteBalance` JS binding has weak typing + shim .d.ts override** [`modules/white-balance/src/index.ts`, `src/types/expo-modules-core.d.ts`]
  Ambient `.d.ts` shadows the real `expo-modules-core` types. Any future API additions (event emitters, typed proxy) go undetected. Root cause: pnpm non-hoisting. Proper fix: add `expo-modules-core` as a direct dependency, delete the shim, let TS resolve the real types.

- [ ] [Review][Patch] P20 — **`setAnalysisVisible(true)` fires AFTER takePictureAsync resolves** [`CaptureScreen.tsx:91-96`]
  Gap between button tap and overlay = ~200–800ms of no visual feedback, during which the user can toggle WB, tap back, etc. Set `setAnalysisVisible(true)` synchronously at the top of `takePicture()` (after `isCapturing` guard, before `takePictureAsync`). Guarantees full-window lock.

- [ ] [Review][Patch] P21 — **CaptureScreen tests mock sheets to `() => null` — no integration coverage** [`CaptureScreen.test.tsx`]
  The most important wiring (CaptureScreen → sheets) is never exercised. "pipeline succeeds: no error" test passes even if match routing is broken. `handleSelect`, `handleTryAgain`, `capturedHex` wiring are untested. Render real sheets (mock only native deps), or use `jest.fn()` mock capturing `props` and assert `{ matches, capturedHex, visible }` flow.

- [ ] [Review][Patch] P22 — **ColorMatchSheet / OutOfCoverageSheet don't announce open to VoiceOver** [`ColorMatchSheet.tsx`, `OutOfCoverageSheet.tsx`]
  `accessibilityViewIsModal` traps focus but doesn't announce context. VO user hears nothing when sheet opens — must swipe blindly. Call `AccessibilityInfo.announceForAccessibility(t("colorCapture.matchSheetTitle"))` on `visible` rising edge.

- [ ] [Review][Patch] P23 — **`OutOfCoverageSheet` renders blank row when `bestMatch` is undefined but visible** [`OutOfCoverageSheet.tsx`]
  Type was relaxed to `WadaMatch | undefined` to keep Modal always mounted. Early-return `null` at top if `visible && !bestMatch`, OR restore `bestMatch: WadaMatch` required and guard mounting in the parent with conditional rendering.

---

## 🟢 Patch — LOW (15)

- [ ] [Review][Patch] P24 — `AnalysisOverlay` `messages` recreated every render + `msgIndex` not clamped on count change [`AnalysisOverlay.tsx:23-34`]. Memoize via `useMemo`, clamp `msgIndex % msgCount` when reading.
- [ ] [Review][Patch] P25 — `colorId` silently dropped from `OutfitVisualizer` param type [`navigation/types.ts:6`]. Restore per Story 12.3 Dev Notes.
- [ ] [Review][Patch] P26 — Add `expo-modules-core` as direct dep, delete `src/types/expo-modules-core.d.ts` shim. Partial overlap with P19.
- [ ] [Review][Patch] P27 — `tsconfig.json` excludes `modules/**` — JS shim no longer type-checked [`tsconfig.json:4`]. Include `modules/*/src/**/*.ts` after P26.
- [ ] [Review][Patch] P28 — `CaptureScreen` imports local module via relative path `"../../modules/white-balance"` [`CaptureScreen.tsx:18`]. Add `@modules/*` tsconfig alias OR document.
- [ ] [Review][Patch] P29 — Cross-navigator `navigation.navigate("SettingsTab")` uses `as any` twice [`ColorHome.tsx`, `FavoritesList.tsx`]. Use `CompositeNavigationProp`.
- [ ] [Review][Patch] P30 — `AnalysisOverlay` uses `StyleSheet.create` for non-`absoluteFill` styles — violates CLAUDE.md [`AnalysisOverlay.tsx:79-93`]. Convert to `className`.
- [ ] [Review][Patch] P31 — `console.error` ships to production without `__DEV__` guard [`CaptureScreen.tsx:139`]. Wrap in `if (__DEV__) { … }` or pipe to telemetry sink.
- [ ] [Review][Patch] P32 — `OutOfCoverageSheet` CTA `accessibilityLabel` interpolates empty name when `bestMatch` undefined → VO reads "See 's combinations" [`OutOfCoverageSheet.tsx:108`]. Short-circuit render when `!bestMatch`.
- [ ] [Review][Patch] P33 — Swift `writeJPEGRepresentation` throws bare error without domain code [`WhiteBalanceModule.swift:59`]. Wrap in `do/catch`, throw with `code: 5`.
- [ ] [Review][Patch] P34 — Swift manual-mode `temperature` not clamped to [2700, 7000] (only auto path clamps) [`WhiteBalanceModule.swift:32, 148`]. Apply clamp consistently in both branches.
- [ ] [Review][Patch] P35 — Swift `URL(fileURLWithPath:)` doesn't handle percent-encoded paths [`WhiteBalanceModule.swift:18-22`]. Use `URL(string: imageUri) ?? URL(fileURLWithPath:)`, decode percent.
- [ ] [Review][Patch] P36 — Swift `estimateBorderTemperature` no guard on `extent.isInfinite` / zero-size [`WhiteBalanceModule.swift:68-72`]. Add `guard extent.isFinite, w > 0, h > 0`.
- [ ] [Review][Patch] P37 — `classifyMatch` boundary tests missing at exact ΔE=2.0 and ΔE=15.0 [`colorMatch.test.ts`]. Add 4 explicit tests using hand-built `WadaMatch[]`.
- [ ] [Review][Patch] P38 — `requestPermission()` promise rejection unhandled [`CaptureScreen.tsx:50`]. Wrap in try/catch or `.catch`.

Optional extras:
- [ ] [Review][Patch] — CustomTabBar duplicate `testID="camera-fab"` on iPad + iPhone variants [`CustomTabBar.tsx:133, 323`]. Rename `camera-fab-ipad` / `camera-fab-phone`.
- [ ] [Review][Patch] — CustomTabBar iPad camera button has no active tint when CaptureScreen is open [`CustomTabBar.tsx:128-151`]. Tint based on `activeColorsScreen === "CaptureScreen"`.

---

## ⚫ Deferred (16) — pre-existing / polish / intentional

- [x] [Review][Defer] W1 — CIEDE2000 `dhp` branching non-standard when `C1p*C2p === 0` — numerical behavior benign, matches Sharma et al. in practice; Hp value never exercises T/SH term because `dHp=0` kills the contribution.
- [x] [Review][Defer] W2 — Swift `averageColor` samples sRGB-encoded bytes without linearization — acknowledged Tier 3 heuristic, documented as acceptable in research.
- [x] [Review][Defer] W3 — `Modal` from react-native nested inside `presentation: "fullScreenModal"` stack — iOS may log warnings in rare timing; requires migrating to `@gorhom/bottom-sheet` or portal solution; not reproducible in current testing.
- [x] [Review][Defer] W4 — `interpolateColor` captures `wadaTokens` lexically — future dark mode will need theme-reactive tokens; no current regression.
- [x] [Review][Defer] W5 — Dynamic Type at XXXL may clip overlay hint / error text — accessibility polish, requires per-screen audit.
- [x] [Review][Defer] W6 — Landscape orientation uses portrait-only absolute positions — camera UX convention is portrait-lock; can lock `CaptureScreen` orientation instead.
- [x] [Review][Defer] W7 — No AppState listener / Promise.race timeout on native pipeline — overlay can hang if native call never resolves; requires timeout infrastructure.
- [x] [Review][Defer] W8 — Reduce Motion toggled mid-cycle leaves interval branch asymmetric — rare, warning only.
- [x] [Review][Defer] W9 — `useReducedMotion` returns `false` on first render (async resolution) — pre-existing hook behavior, not introduced by Epic 12.
- [x] [Review][Defer] W10 — CustomTabBar camera FAB ignores `event.defaultPrevented` from tabPress listeners — no current listener guards on Combinations; flag for future unsaved-changes patterns.
- [x] [Review][Defer] W11 — 500ms WB-correction deadline (AC #1) not enforced or instrumented — aspirational target, hard to verify in CI.
- [x] [Review][Defer] W12 — `colorMatch.test.ts` "neon green out-of-coverage" is dataset-dependent — marked D4 during Story 12.1 review.
- [x] [Review][Defer] W13 — `matchWadaColor` assumes ≥3 colors in dataset — invariant holds today (159 colors); stronger type `readonly [WadaMatch, ...WadaMatch[]]` could lock it in.
- [x] [Review][Defer] W14 — `classifyMatch` boundary equality: exact ΔE=2.0 → confirm (not direct), exact ΔE=15.0 → confirm (not out-of-coverage) — matches spec reading of "2.0–15.0 inclusive".
- [x] [Review][Defer] W15 — Dead `capturedHex` prop in both sheets (`_capturedHex` destructure) — intentional Epic 13 extensibility hook per Story 12.3 Dev Notes; UX for A/B captured-vs-match comparison is explicitly future scope.
- [x] [Review][Defer] W16 — Navigation `handleTryAgain` doesn't reset `wbTemperature` — spec `00-discovery.md` says persist during session; current behavior matches spec intent.

---

## ❌ Dismissed (3)

- CIEDE2000 identical-color numerical noise (~1e-10) — not reachable in practice.
- `activeColorsScreen` undefined on first render — falls through to `bgPaper` cleanly, handled.
- `useCameraPermissions` returns `null` briefly after returning from Settings — cosmetic flash, acceptable.

---

## Overarching observations (architectural)

1. **The navigation strategy is the #1 issue across the epic.** `CommonActions.reset` is load-bearing for the feature's exit UX but contradicts the spec and the prior review's resolution. Everything downstream — selectGuard lifetime, state-after-unmount warnings, scroll state loss — flows from this one decision. Resolve D1 first; many MEDIUM patches (P9, P15, P21) become simpler once the sheet lifecycle is deterministic.

2. **The WB module blurs the "sensor → pipeline → bridge" boundary.** Sentinel values (5500 as both "manual daylight" and "auto-mode request" and "sampling failure fallback") flow across three layers (JS state, JS→native bridge, Swift internals) without typed contracts. A single `enum WBMode { auto, manual(Double) }` encoded as a proper struct would eliminate D2, P7, P34 at once.

3. **`getColors` integration is the silent fragility.** It's the only place where the pipeline trusts an external library's stringly-typed result and feeds it into hex parsing that throws. P4 is the cluster that hides real user failures behind generic "analysisError".

4. **The native module is under-typed AND under-tested.** `expo-modules-core.d.ts` shim, `tsconfig` excluding `modules/**`, no Swift unit tests, CaptureScreen tests mocking `applyWhiteBalance` to pass-through — the Tier 3 accuracy claim is trust-based. The simplest strengthening is P21 (real integration asserts) + a Swift XCTest around `estimateBorderTemperature` with golden images.

5. **Accessibility is documented but shallow.** `accessibilityViewIsModal` + `accessibilityRole` attributes are present, but no sheet announces itself (P22), the analysis overlay spams liveRegion (P16), and Dynamic Type isn't audited (W5). The iPad code path is flatter but also has fewer active states (e.g., camera tab never lights up).

6. **Three commit boundaries but feature was tested as one.** 12.1+12.2 bundled, 12.3 alone, 12.4 alone. The "tab bar redesign" landed inside 12.4's scope unannounced — that's what produced D4 and the ColorHome camera button disappearing silently.

---

## Suggested resolution order (historical — already applied)

1. ✅ Resolve D1 (nav strategy) — blocker for P8, P9, P15, P21.
2. ✅ Resolve D2 (WB sentinel) — unblocks P7, P14, P34.
3. ✅ Resolve D3 (WB direction) — affects UX copy + optional test.
4. ✅ Resolve D4 (camera entry) — affects spec + a11y.
5. ✅ Apply HIGH patches P1–P6 in order.
6. ✅ Apply MEDIUM cluster.
7. ✅ Apply remaining LOW patches.
8. ✅ Post-review: primary→background + AnalysisFrame + centerCrop (device-test discovery).

---

## Follow-up work (deferred, not blocking)

These patches were intentionally skipped because they require focused effort outside the scope of this review pass and carry build/refactor risk:

- **P19 + P26 + P27 + P28** — Native module typing cluster. Currently `src/types/expo-modules-core.d.ts` shadows the real package types because pnpm doesn't hoist `expo-modules-core`. `tsconfig.json` excludes `modules/**`. The clean fix is: add `expo-modules-core` as a direct dep, delete the shim, include `modules/*/src/**` in tsconfig, add a `@modules/*` path alias. Risk: could break the pnpm install graph or native build until properly tested. Own session.

- **P21** — Replace `() => null` mocks for `ColorMatchSheet` and `OutOfCoverageSheet` in `CaptureScreen.test.tsx` with real sheet renders + prop-capturing `jest.fn()` mocks. The current tests don't verify the integration path from pipeline result → sheet props. This is a test-refactor effort, not a bug fix. Own session.

All other findings from the initial triage are either ✅ applied, marked `defer` (pre-existing polish, documented in `deferred-work.md`), or `dismiss`.

---

## Final verification

- `npx tsc --noEmit` → 0 errors
- `pnpm lint` → 0 errors
- `npx jest --ci` → Epic 12 suites: 84/84 green (CaptureScreen, AnalysisOverlay, ColorMatchSheet, OutOfCoverageSheet, colorMatch, colorConversion). 60 pre-existing failures (i18n + OutfitVisualizer) unchanged.
- Manual device test on physical iPhone: recognition accuracy high, no UI apilado, no flash, WB slider works with clarifying label, sheets dismiss cleanly.
