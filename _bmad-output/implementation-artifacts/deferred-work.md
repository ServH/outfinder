# Deferred work

Items parked during code review. Not blocking current features; pick up when the scope is right.

---

## Deferred from: code review of 13-3b-wardrobe-persistence-lifecycle (2026-04-20)

- **D1-13.3b** — `hydrateWardrobeStore` not guarded against concurrent invocations (`src/stores/wardrobeStore.ts`). Module import, App.tsx IIFE, AppState listener, and `saveCutoutAsWardrobeItem` all call `hydrateWardrobeStore()` without dedup guard. Could cause concurrent AsyncStorage reads + state overwrites. Pre-existing Story 13.1 debt — fix in a future hydration hardening story.

---

## Deferred from: code review of 13-3a-capture-background-removal-ui-flow (2026-04-19)

- **W1-13.3a** — `File.delete()` SDK 55 class-based API sync/async unclear: if `delete()` returns `Promise<void>`, `try/catch` in `deleteCutoutTmp` silently swallows rejections; verify SDK 55 types before 13.3b lands. [`src/screens/armario/ArmarioPreviewScreen.tsx`]
- **W2-13.3a** — `handlePaywallDismiss` unconditionally deletes cutout: if user upgrades mid-paywall and 13.3b's real save runs, `cutoutUri` will already be deleted. Documented as acceptable in Completion Notes. 13.3b owns the real fix with atomic move pattern.
- **W3-13.3a** — Stub happy-path leaves tmp file orphaned: on successful `saveCutoutAsWardrobeItem` the tmp PNG is never deleted. Explicitly documented in spec as acceptable for 13.3a. 13.3b adds cleanup inside the real atomic save path.
- **W4-13.3a** — `NSPhotoLibraryUsageDescription` duplicated in `ios.infoPlist` AND `expo-image-picker` plugin `photosPermission`. Intentional per spec as a backup; risk is both strings diverging in future. Clean up the redundant `infoPlist` entry after confirming the plugin writes it correctly post-prebuild.
- **W5-13.3a** — Test #1 permission re-render isolation gap: validates ref guard on same-state re-render but not on `undetermined → granted` state transition. Test currently passes and the guard is validated. Full variant coverage deferred.
- **W6-13.3a** — `handleRetake` synchronous double-goBack risk: native swipe-back + Retake tap in same frame could issue two `navigation.goBack()` calls. React Navigation handles duplicate pops gracefully. Pre-existing RN pattern.
- **W7-13.3a** — Missing `testID` on `ActivityIndicator` inside processing overlay. Tests assert the parent overlay container (`armario-processing-overlay`) but not the spinner directly.
- **W8-13.3a** — `AccessibilityInfo.announceForAccessibility` `useEffect` depends on `[t]` — theoretical re-fire if i18next re-creates `t` during a language switch mid-session. Extremely unlikely in practice.

## Deferred from: code review of 13-2-background-removal-native-module (2026-04-19)

- **W1-13.2** — Double CIImage pre-validation load in `BackgroundRemovalModule.process`: `guard CIImage(contentsOf:) != nil` decodes the full image just to validate readability, then discards it; Vision re-opens via URL. Spec-required (AC #3 ioFailed pattern mirrors WhiteBalance). Revisit in Story 13.5 when profiling the full composition pipeline.
- **W2-13.2** — Temp `cutout-*.png` files in `FileManager.default.temporaryDirectory` accumulate if Story 13.3a flow throws before cleanup. By-design: 13.3a owns cleanup on Repetir/paywall. Consider a startup sweep in Story 13.3b wardrobe persistence lifecycle.
- **W3-13.2** — Near-zero-extent CVPixelBuffer after `croppedToInstancesExtent: true` produces a valid but visually empty PNG (no error thrown). Add a minimum-dimensions guard (e.g. ≥10px) when full Armario flow is assembled in 13.4a.
- **W4-13.2** — `observation.allInstances` may include only background instance (index 0) on some OS builds → transparent PNG. Vision API subtlety; revisit if users report blank cutouts post-13.3a.

## Deferred from: code review of 13-1-wardrobe-data-model-repository-zustand-store (2026-04-19)

- **W1-13.1** — Type guards (`isWardrobeItem`) aceptan strings vacíos para `localImagePath`, `thumbnailPath`, e `id`. La validación de paths (mínimo length, `file://` prefix) pertenece a Story 13.3b cuando se escriben los paths reales — no al type guard de hydration.
- **W2-13.1** — `assign()` no valida que `wardrobeItemId` exista en la lista de items. Diseño intencional: el contrato "skip orphans" lo gestiona Story 13.4b al resolver assignments. Cambiar esto requeriría aclarar qué significa "borrar" un item frente a sus assignments.

---

## Deferred from: Epic 12 code review (2026-04-15)

Scope: Stories 12.1 + 12.2 + 12.3 + 12.4 (Color Capture feature). Full review in `_bmad-output/implementation-artifacts/epic-12-code-review.md`.

### Cluster A — Native-module typing hygiene (4 patches, ~1h + native rebuild)

**Impact:** LOW — feature works; we lose type-safety at the Swift↔JS bridge boundary. A refactor that changes the module API won't be caught at compile time.

- [ ] **P19** — `applyWhiteBalance` JS binding is wrapped by a manual cast because the ambient shim's generic is too loose. After P26 is done, tighten this to use the real `expo-modules-core` types. `modules/white-balance/src/index.ts`
- [ ] **P26** — Add `expo-modules-core` as a direct dependency (`pnpm add expo-modules-core`). Currently it's transitive through `expo`, so pnpm doesn't hoist it and TypeScript can't resolve its real types. **Risk:** version mismatch with what `expo` expects. Test with a full `expo prebuild --clean && expo run:ios` before trusting.
- [ ] **P27** — Remove `"modules/**"` from `tsconfig.json` exclude. Currently the local module's JS shim is not type-checked at all. After P26, the real types resolve correctly and this exclude becomes unnecessary.
- [ ] **P28** — Add a `@modules/*` path alias in `tsconfig.json` + `babel.config.js`. Change `CaptureScreen.tsx:18` from `import … from "../../modules/white-balance"` to `import … from "@modules/white-balance"`. Minor ergonomic win, depends on P27 being stable first.

**Fix order:** P26 → P27 → P28 → P19.

### Cluster B — CaptureScreen integration tests (1 patch, ~1-2h)

**Impact:** MEDIUM — CI won't catch a regression in the routing between CaptureScreen and the result sheets. Covered manually in the on-device test, but a future refactor of `takePicture` could silently break sheet props without failing tests.

- [ ] **P21** — `CaptureScreen.test.tsx` currently mocks both sheets as `() => null`. Replace with `jest.fn()` mocks that capture received props, then assert:
  - Direct match → `navigation.replace("Combinations", { colorId, capturedHex })` called with correct params
  - Confirm match → `ColorMatchSheet` receives `{ matches, visible: true, capturedHex }`
  - Out-of-coverage → `OutOfCoverageSheet` receives `{ bestMatch, visible: true }`
  - Sheet `onSelect(colorId)` → navigation called correctly
  - Sheet `onDismiss` → state reset (matchState=null, analysisVisible=false, analysisError=null, capturedHex=null)
  Consider rendering the real sheets and only mocking their native deps (Modal + safe-area).

### Defer list (not debt per se — policy/polish choices documented during review)

These were reviewed and deliberately left as-is. Revisit only if the surrounding context changes:

- **W1** — CIEDE2000 `dhp` branching when both chromas are 0. Numerical behavior benign today; matches Sharma et al. in practice because `dHp=0` kills the contribution.
- **W2** — Swift `averageColor` samples sRGB-encoded bytes without linearization. Acknowledged heuristic for the CCT estimate; research confirmed "good enough" for Tier 3 on-device accuracy.
- **W3** — `react-native` `Modal` nested inside a screen that used to be fullScreenModal (now card). iOS occasionally logs warnings. Would require migrating to `@gorhom/bottom-sheet` or portal solution. No reproducible issue.
- **W4** — `interpolateColor` in `CustomTabBar` captures `wadaTokens` lexically. Future dark-mode will need theme-reactive tokens. No current regression.
- **W5** — Dynamic Type at XXXL may clip `CaptureScreen` overlay hint / error pill text. Accessibility polish pass.
- **W6** — Landscape orientation uses portrait-only absolute positioning. Camera UX convention is portrait-lock; easier to enforce orientation lock on the screen.
- **W7** — No AppState listener / timeout around the native pipeline. Overlay could hang if `applyWhiteBalance` never resolves (e.g. app backgrounded mid-call on some iOS builds).
- **W8** — Reduce Motion toggled mid-cycle leaves the Reanimated interval branch asymmetric for one tick. Warning-only.
- **W9** — `useReducedMotion` returns `false` on first render (async hook). Pre-existing hook behavior, not Epic 12.
- **W10** — CustomTabBar camera FAB ignores `event.defaultPrevented` from `tabPress` listeners. No current listener guards.
- **W11** — 500ms WB-correction latency (Story 12.3 AC #1) not enforced or instrumented. Aspirational target, hard to verify in CI.
- **W12** — `colorMatch.test.ts` "neon green out-of-coverage" is a dataset-dependent test. Already documented as D4 during Story 12.1 review.
- **W13** — `matchWadaColor` assumes ≥3 colors in dataset. Invariant holds today (159); stronger type `readonly [WadaMatch, ...WadaMatch[]]` could lock it in.
- **W14** — `classifyMatch` boundary equality: exact ΔE=2.0 → confirm (not direct), exact ΔE=15.0 → confirm (not out-of-coverage). Matches spec reading of "2.0–15.0 inclusive". Boundary tests added (P37).
- **W15** — Dead `capturedHex` prop in both sheets (`_capturedHex` underscore-destructured). Intentional Epic 13 extensibility hook per Story 12.3 Dev Notes. UX for A/B captured-vs-match comparison is explicitly future scope.
- **W16** — Navigation `handleTryAgain` doesn't reset `wbTemperature`. Spec `00-discovery.md` says persist during session; current behavior matches spec intent.
