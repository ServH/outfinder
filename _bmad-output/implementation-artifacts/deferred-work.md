# Deferred work

Items parked during code review. Not blocking current features; pick up when the scope is right.

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
