# Story 15.3: C1 — Camera FAB first-use coach mark

Status: done

## Story

As **a first-time Outfinder user** opening the unified camera (the FAB on Mis Looks / Home that lands them on `UnifiedCameraCaptureScreen` for the first time after install or after a "Reset coach marks" dev tap),
I want **a single-step coach mark superimposed on the live camera preview that explains the pipeline in one sentence ("Fotografía tu prenda. La recortamos automáticamente, detectamos su color Wada y te sugerimos combinaciones." in ES; equivalent EN), backed by an "Entendido" / "Got it" dismiss button that persists my acknowledgement in AsyncStorage under `@outfinder/coachmark:camera-fab-firstuse`**,
so that **I understand WHAT the FAB will do BEFORE I tap the shutter (per DEC-3, coach mark over interstitial — no full-screen interstitial blocking the wow), AND on every subsequent open of the camera the overlay never reappears (FR7), AND the experience reuses the Story 15.1 `CoachMarkOverlay` + `useCoachMark` foundation in 1 line each per consumer (DEC-5) without re-implementing AsyncStorage gating, Reduce Motion handling, VoiceOver announcements, or a dismiss button**.

## Acceptance Criteria

1. **Given** Story 15.1 shipped the `CoachMarkOverlay` component, the `useCoachMark(key)` hook, and the `COACH_MARK_KEYS.cameraFabFirstUse` registry entry (all merged at `c716a03` on `epic-15`), **When** Story 15.3 is implemented, **Then** `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`:
    - imports `CoachMarkOverlay` from `@/components/CoachMarkOverlay` and `useCoachMark` from `@/hooks/useCoachMark`,
    - imports `COACH_MARK_KEYS` from `@/lib/coachMarkKeys` (the registry — DO NOT inline the literal string `"@outfinder/coachmark:camera-fab-firstuse"` at the call site; the registry is the single source of truth per Story 15.1 DEC-5 + Epic 15 NFR7),
    - calls `useCoachMark(COACH_MARK_KEYS.cameraFabFirstUse)` exactly once at the top of the component (BEFORE any early return — Rules of Hooks per CLAUDE.md), destructuring `{ shouldShow, markSeen }`,
    - renders `<CoachMarkOverlay>` with: `visible={shouldShow && permission?.granted === true && error === null}` (gating: no overlay over the permission-denied screen, the permission-loading null screen, or the error sheet — the user must be looking at the live camera preview for the copy to make sense), `text={t("unifiedCamera.coachMark.text")}`, `accessibilityAnnouncement={t("unifiedCamera.coachMark.a11yAnnouncement")}`, `onDismiss={handleDismissCoachMark}`, `testID="unified-camera-coach-mark"`. NO custom `dismissLabel` prop — the foundation falls back to `t("common.coachMark.gotIt")` shipped in 15.1, and Epic 15 NFR2 says ALL coach marks reuse that single shared key.
    - defines `handleDismissCoachMark` as a function that calls `hapticLight()` (already imported on line 16 — reuse, do not add a second import) wrapped in nothing extra (the `lib/haptics` wrapper already swallows errors per CLAUDE.md "Try/catch on all native API calls"), then `await markSeen()`. Order matters: haptic first (immediate user feedback), then state flip (overlay disappears via the optimistic `setShouldShow(false)` inside `markSeen`).
    - the JSX placement: render the `<CoachMarkOverlay>` AFTER `<CameraView>` but BEFORE `{processing && ...}` — so the processing overlay (z-orders above via `inset-0` + `rgba(0,0,0,0.55)`) cannot be obscured if a user manages to dismiss + immediately tap the shutter (race protection; processing overlay should win).

2. **Given** FR6 ("La primera vez que un user abre `UnifiedCameraCaptureScreen`, se muestra un coach mark superpuesto que explica el pipeline en lenguaje natural") and FR7 ("Tras dismiss, el coach mark NO vuelve a aparecer en futuras aperturas (flag persistente vía `useCoachMark`)"), **When** Story 15.3 is implemented, **Then** the following BEHAVIORAL contract holds (verified by tests in AC #4):
    - First mount with AsyncStorage value for key `@outfinder/coachmark:camera-fab-firstuse` undefined → after the `useEffect` resolves, `<CoachMarkOverlay>` is in the tree with `visible={true}` (testID `unified-camera-coach-mark` queryable via `getByTestId`).
    - Tap dismiss button (`unified-camera-coach-mark-dismiss`) → `hapticLight` called once, `AsyncStorage.setItem("@outfinder/coachmark:camera-fab-firstuse", "true")` called once, overlay leaves the tree (`queryByTestId("unified-camera-coach-mark")` returns null) on the same act.
    - Remount the screen with AsyncStorage value `"true"` → after the `useEffect` resolves, `<CoachMarkOverlay>` is NOT in the tree (overlay never visible — `queryByTestId("unified-camera-coach-mark")` returns null at all times).
    - Permission denied path (`mockPermission.granted = false`) → overlay is NOT in the tree even when `shouldShow` resolves true (visibility gate `permission?.granted === true` filters it out).
    - Error sheet visible (e.g. `removeBackground` rejects with `{ kind: "noSubject" }`) → overlay is NOT in the tree (visibility gate `error === null` filters it out — covers the case where the user opened the camera, saw the coach mark, dismissed without acting, then later got an error; the coach mark must not re-appear over the error sheet).

3. **Given** Epic 15 NFR2 ("Todos los strings nuevos … en ES + EN") and the existing `unifiedCamera.*` namespace pattern (already populated with `capture`, `result`, `categorySheet`, `save` sub-objects in `src/i18n/locales/es.json:356` and `en.json:356`), **When** Story 15.3 is implemented, **Then** BOTH `src/i18n/locales/es.json` AND `src/i18n/locales/en.json` gain a NEW sub-object `unifiedCamera.coachMark` containing exactly two keys:
    - `text` — the body copy that renders inside the overlay card. ES: `"Fotografía tu prenda. La recortamos automáticamente, detectamos su color Wada y te sugerimos combinaciones."` EN: `"Snap your garment. We'll cut it out, detect its Wada color, and suggest combinations."` (validate the EN with Alejandro on review if it reads off; the ES is fixed by the epic spec at `docs/planning/epic-15/epic-15.md:144`).
    - `a11yAnnouncement` — the VoiceOver string passed to `AccessibilityInfo.announceForAccessibility` via the foundation's `accessibilityAnnouncement` prop. ES: `"Consejo de cámara. Fotografía tu prenda; la recortamos, detectamos su color Wada y te sugerimos combinaciones."` EN: `"Camera tip. Snap your garment; we'll cut it out, detect its Wada color, and suggest combinations."` Rationale for a separate a11y string: the visual `text` reads naturally for a sighted user looking at the camera; the VoiceOver announcement adds the explicit "Camera tip" / "Consejo de cámara" prefix so the user knows it's a coach mark, not a system alert (mirror of the legacy `coachStep1Announce` pattern that 15.1 deleted, now applied generically).
    - NO `dismissLabel` key — reuse `common.coachMark.gotIt` from Story 15.1 (already in both locales at `src/i18n/locales/{es,en}.json:197–199`). Adding a per-coach-mark dismiss label here would re-fragment the i18n surface that 15.1 deliberately consolidated — DO NOT.
    - `git grep '"coachMark"' src/i18n/locales/es.json` returns exactly TWO matches after this story (the existing `common.coachMark` plus the new `unifiedCamera.coachMark`). Same for `en.json`. If you see a third, you've added a key in the wrong place.

4. **Given** the test gate per CLAUDE.md ("Mandatory Code Review" + Epic 14 retro: "testing gaps main HIGH source"), **When** Story 15.3 is implemented, **Then** ALL of the following CI gates pass on the story branch BEFORE handoff:
    - `npx tsc --noEmit`: zero NEW errors. The 2 pre-existing tsc errors in `src/screens/armario/Armario{SugerenciaArmonia,TuLook}Screen.test.tsx` (per Story 15.1 Debug Log Reference at line 162 of `15-1-coach-mark-foundation-and-legacy-removal.md`) are tolerated as baseline — capture the count before starting and confirm post-story count matches.
    - `pnpm lint`: zero NEW errors. The 2 pre-existing lint errors (`src/screens/FavoritesList.test.tsx` + `src/screens/OutfitVisualizer.tsx`, per same Story 15.1 reference) are tolerated as baseline — capture pre, match post.
    - `pnpm test`: green with the test count INCREASING by ≥4 (the four new cases added to `UnifiedCameraCaptureScreen.test.tsx` per AC #2 sub-bullets) and ZERO new test-skips (`grep -rn 'test\.skip\|it\.skip\|xit(' src/` count must not increase from baseline).
    - The 4 new tests in `UnifiedCameraCaptureScreen.test.tsx` cover (use real `useCoachMark` against the AsyncStorage mock — DO NOT mock `useCoachMark`; mocking the hook would not exercise the wiring this story is supposed to deliver, and would let a regression where someone passes the wrong key slip through):
        - **(a) first mount → overlay visible**: clear AsyncStorage, render with permission granted, await the hook's `useEffect` to resolve, assert `getByTestId("unified-camera-coach-mark")` exists and the body text matches `unifiedCamera.coachMark.text`.
        - **(b) dismiss → AsyncStorage written + overlay leaves + haptic fired**: from state (a), `fireEvent.press(getByTestId("unified-camera-coach-mark-dismiss"))`, then `await waitFor(...)` that `AsyncStorage.setItem` was called with `("@outfinder/coachmark:camera-fab-firstuse", "true")`, `hapticLight` was called, and `queryByTestId("unified-camera-coach-mark")` returns null. NOTE: `hapticLight` is already mocked at line 60 of the test file — reuse the existing `(hapticLight as jest.Mock).mockClear()` pattern from `beforeEach`.
        - **(c) remount with already-seen → no overlay**: pre-seed `await AsyncStorage.setItem("@outfinder/coachmark:camera-fab-firstuse", "true")`, render, flush microtasks, assert `queryByTestId("unified-camera-coach-mark")` returns null (and stays null over additional ticks).
        - **(d) permission denied → no overlay**: set `mockPermission = { granted: false, canAskAgain: true, status: "denied" }` BEFORE render, clear AsyncStorage, render, flush microtasks, assert `queryByTestId("unified-camera-coach-mark")` is null (the visibility gate `permission?.granted === true` prevents the overlay from ever entering the tree). Reset `mockPermission` in `afterEach` or in the next `beforeEach` (the existing `beforeEach` at line 80 already resets to `granted: true`, so just be sure the new test runs in isolation — since the existing pattern mutates module-level state, place this test LAST or assert `mockPermission` is reset in its own setup).
    - The 5 existing tests in `UnifiedCameraCaptureScreen.test.tsx` (lines 92–237) MUST still pass unmodified except for one minimal change: the `beforeEach` at line 79–90 must `await AsyncStorage.clear()` so the new coach mark hook does not bleed state across tests. Add the `import AsyncStorage from "@react-native-async-storage/async-storage"` at the top + `await AsyncStorage.clear();` at the start of `beforeEach`. Do NOT change any other line of the existing tests; they are happy-path / error-path / unmount-race coverage that 14.x ratified.

## Tasks / Subtasks

- [x] **Task 1 — Wire `useCoachMark` + render `CoachMarkOverlay` in `UnifiedCameraCaptureScreen`** (AC: #1, partial #2)
  - [x] In `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`, add the three new imports per AC #1 (`CoachMarkOverlay`, `useCoachMark`, `COACH_MARK_KEYS`). Group them with the existing `@/`-prefixed alias imports (lines 14–20) — alphabetical inside the group, no need for a second block.
  - [x] At the top of `UnifiedCameraCaptureScreen` (immediately after `const insets = useSafeAreaInsets();` line 54 — BEFORE any early return, to satisfy Rules of Hooks per CLAUDE.md), call `const { shouldShow: shouldShowCoachMark, markSeen: markCoachMarkSeen } = useCoachMark(COACH_MARK_KEYS.cameraFabFirstUse);`. Rename the destructured fields per the local naming convention (the screen has many `should*` and `mark*` style locals — disambiguate to avoid collision with future hooks).
  - [x] Define `async function handleDismissCoachMark()` after `function handleRetry()` (line 95–97) following the existing `function` declaration style in this file (NOT arrow function — the file uses `function` for handlers and `async function` for `runPipeline`/`takePicture`). Body: `hapticLight(); await markCoachMarkSeen();` — exactly two lines, no try/catch (per CLAUDE.md "Don't add error handling … for scenarios that can't happen": `lib/haptics` already swallows, `markSeen` already swallows; double-wrapping would violate `feedback_no_patches.md`).
  - [x] Render `<CoachMarkOverlay …/>` immediately AFTER `{renderErrorSheet()}` (line 357) and BEFORE the `{processing && (` block (line 359) per AC #1 placement. Props per AC #1 contract.

- [x] **Task 2 — i18n keys ES + EN** (AC: #3)
  - [x] In `src/i18n/locales/es.json`, INSIDE the `"unifiedCamera"` object (which currently spans lines 356 to its close), insert a new sub-object `"coachMark": { "text": "...", "a11yAnnouncement": "..." }` per AC #3. Place it as a sibling of `capture` / `result` / `categorySheet` / `save` — alphabetical order would put it between `categorySheet` and `result`; follow that placement to match the file's apparent ordering convention. Re-validate JSON syntax (no trailing commas) after the edit.
  - [x] In `src/i18n/locales/en.json`, mirror the same structure with the EN strings per AC #3. Same placement.
  - [x] Run `node -e 'JSON.parse(require("fs").readFileSync("src/i18n/locales/es.json"))' && node -e 'JSON.parse(require("fs").readFileSync("src/i18n/locales/en.json"))'` to confirm both files still parse. (Or `pnpm lint` will catch it via Biome.)
  - [x] `git grep '"coachMark"' src/i18n/locales/es.json | wc -l` returns `2`. Same for `en.json`. If `3+`, you placed it in the wrong namespace.

- [x] **Task 3 — Tests in `UnifiedCameraCaptureScreen.test.tsx`** (AC: #4, partial #2)
  - [x] Add `import AsyncStorage from "@react-native-async-storage/async-storage";` at the top of `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx` (the file does not yet import it). Add `await AsyncStorage.clear();` as the FIRST line of the `beforeEach` block (line 79). This is the ONLY modification allowed to the existing 5 tests; the rest of `beforeEach` (mock resets) stays exactly as-is.
  - [x] Append a new `describe` block at the bottom (or 4 `it` cases inside the existing top-level `describe`) containing the 4 cases per AC #4 sub-bullets (a)–(d). Reuse the existing `flushMicrotasks` helper (line 71–76) to wait for `useCoachMark`'s `useEffect` to resolve — pattern: `await flushMicrotasks(); await waitFor(() => expect(screen.getByTestId("unified-camera-coach-mark")).toBeTruthy());`.
  - [x] DO NOT mock `useCoachMark` itself. Use the real hook against the AsyncStorage mock that's already wired in `jest.setup.js` (verified working by `useCoachMark.test.ts` which calls `await AsyncStorage.clear()` in `beforeEach`). Mocking the hook would let a regression where someone passes the wrong key string slip through silently.
  - [x] For test (b), pattern after AC #4 (b): assert against `AsyncStorage.setItem` directly (the mock is `jest.fn()` from `@react-native-async-storage/async-storage/jest/async-storage-mock`), avoiding `jest.spyOn(...).mockRestore()` which leaves the underlying jest.fn mocked-broken across tests (caused test-c pollution; resolved by clearing the existing mock with `(AsyncStorage.setItem as jest.Mock).mockClear()` instead).
  - [x] Test (d): set `mockPermission = { granted: false, canAskAgain: true, status: "denied" }` at the start of the `it` body (BEFORE `render`). Confirm the existing `beforeEach` at line 80 will reset it back to `granted: true` for subsequent tests (it does — line 80 unconditionally re-assigns). No need to manually reset.

- [x] **Task 4 — AC verification + CI gates + on-device smoke** (AC: #4)
  - [x] Capture pre-baselines on the story branch BEFORE any source change: `pnpm lint 2>&1 | tail -3`, `npx tsc --noEmit 2>&1 | tail -5`, `pnpm test 2>&1 | tail -10`. Record passing/failing/total + lint error count + tsc error count in completion notes.
  - [x] Run all three again post-change. Confirm: lint count == baseline (no new), tsc count == baseline (no new), test delta = +4 net (5 existing pass unchanged + 4 new), 0 new test skips (`grep -rn 'test\.skip\|it\.skip\|xit(' src/ | wc -l` matches baseline).
  - [x] Verify each AC point-by-point per CLAUDE.md "Acceptance Criteria Verification": AC #1 (4 import + 1 hook call + 1 handler + 1 JSX render with exact prop set), AC #2 (5 behavioral guarantees mapped to tests), AC #3 (i18n keys placed + JSON valid + grep count = 2), AC #4 (CI deltas + 4 new test cases + 5 existing tests untouched except `AsyncStorage.clear`). Record results inline in Completion Notes.
  - [x] On-device smoke (per `feedback_visual_review.md`) — validado por Alejandro 2026-04-27: overlay se ve perfecto sobre el live camera preview, dismiss + haptic + persistencia AsyncStorage funcionan, sin regresión en captura.

## Dev Notes

### Architecture & patterns to follow (load-bearing)

- **Foundation reuse, not reinvention** — Story 15.1 shipped `CoachMarkOverlay` (`src/components/CoachMarkOverlay.tsx`), `useCoachMark` (`src/hooks/useCoachMark.ts`), and `COACH_MARK_KEYS` (`src/lib/coachMarkKeys.ts`) precisely so 15.3 + 15.4 each wire in 1 line of `useCoachMark(COACH_MARK_KEYS.x)` + 1 `<CoachMarkOverlay/>` JSX block. DO NOT duplicate AsyncStorage logic, AccessibilityInfo announcement code, Reduce Motion handling, or the "Got it" button. DO NOT add a `steps[]` prop or any multi-step pattern — the foundation is single-step by design (DEC-5 + Story 15.1 AC #1).
- **Function declarations with named exports** — the screen already uses `export function UnifiedCameraCaptureScreen(...)` (line 49). The new `handleDismissCoachMark` follows the existing `function handleX()` style in the file (lines 83, 89, 95, 154). NO arrow functions for handlers, NO default exports anywhere (CLAUDE.md "React Native Specifics").
- **Rules of Hooks** — `useCoachMark` MUST be called BEFORE the early returns at lines 211 (`if (!permission)`) and 221 (`if (!permission.granted)`). Place it next to the other hooks at lines 52–60. CLAUDE.md "All hooks must be called before any early returns".
- **Haptics ONLY through `lib/haptics.ts`** — `hapticLight` is already imported at line 16. Reuse it. DO NOT import `expo-haptics` directly (CLAUDE.md "Haptics only through lib/haptics.ts" + memory `feedback_no_patches.md`).
- **`testID` not `data-testid`** — React Native convention per CLAUDE.md. The foundation already uses `testID` props for the overlay container (`unified-camera-coach-mark`) and the dismiss button (`${testID}-dismiss` → `unified-camera-coach-mark-dismiss`). Use those exact testIDs in tests.
- **NativeWind `className` for static styles, `style={{}}` only for dynamic Wada color values** — this story does not introduce new styles. The `<CoachMarkOverlay/>` already owns its visual contract (paper-cream card, NotoSerifJP body, Inter dismiss label) per Story 15.1.

### Visibility gating contract (the load-bearing detail)

The `<CoachMarkOverlay/>` `visible` prop is a **3-way AND**:

```
visible = shouldShow                         // AsyncStorage flag says first time
       && permission?.granted === true       // user is actually looking at live preview
       && error === null                     // not currently showing the error sheet
```

Why each clause:
- `shouldShow` — without this, the overlay shows EVERY mount → violates FR7.
- `permission?.granted === true` — without this, the overlay paints over the permission-loading null view (line 211–217) and the permission-denied view (line 221–278). The copy "Snap your garment …" makes no sense over a permission CTA. Also avoids a flash before AsyncStorage resolves: if `permission` is still `undetermined`, `permission?.granted` is `undefined` → `undefined === true` is `false`.
- `error === null` — without this, if a user dismissed the coach mark, then tapped the shutter, then `removeBackground` rejected with `"noSubject"`, the error sheet renders + the coach mark could re-show on a re-render. AC #4 (e) explicitly tests this branch. The state machine for `error` already exists (line 58); we just read it.

DO NOT collapse this into a `useMemo` or extract to a helper — it's three named locals already in scope, the inline boolean is the clearest expression.

### File layout

```
src/
  screens/unifiedCamera/
    UnifiedCameraCaptureScreen.tsx       ← MOD (3 new imports, 1 hook call, 1 handler, 1 JSX block)
    UnifiedCameraCaptureScreen.test.tsx  ← MOD (1 new import, 1 line in beforeEach, 4 new it cases)
  i18n/locales/
    es.json                              ← MOD (add unifiedCamera.coachMark sub-object)
    en.json                              ← MOD (mirror of es.json)
```

NO new files. NO new directories. NO new packages. NO native module changes. NO `app.config.ts` changes.

### Reuse — do NOT reinvent

| Need | Reuse from | DO NOT |
|------|------------|--------|
| Coach mark UI shell | `CoachMarkOverlay` (Story 15.1) | Build a per-screen overlay |
| AsyncStorage seen-flag | `useCoachMark` (Story 15.1) | Inline `AsyncStorage.getItem`/`setItem` |
| AsyncStorage key string | `COACH_MARK_KEYS.cameraFabFirstUse` | Type the literal `"@outfinder/coachmark:..."` |
| "Got it" button label | `common.coachMark.gotIt` (in es.json + en.json line 197–199) | Add a per-screen dismiss label key |
| VoiceOver announcement | `CoachMarkOverlay`'s `accessibilityAnnouncement` prop | Call `AccessibilityInfo.announceForAccessibility` here |
| Reduce Motion handling | Inside `CoachMarkOverlay` (uses `useReducedMotion`) | Add a second Reduce Motion check at this call site |
| Light haptic | `hapticLight` from `@/lib/haptics` (already imported line 16) | Add `expo-haptics` |
| Dev reset affordance | `Settings.tsx:dev-reset-coach-marks-row` (Story 15.1) | Add a second dev row |

### Trigger semantics

The epic spec at `docs/planning/epic-15/epic-15.md:143` is explicit: **"Trigger: al montar la screen (no al pulsar FAB — la cámara ya está abierta y visible al fondo del overlay, refuerza el contexto)."**

Translation: the overlay shows when `UnifiedCameraCaptureScreen` mounts AND the live preview is behind it. NOT on tap of the FAB on Mis Looks. NOT after the first capture. NOT lazily after a delay. The mount of this screen IS the trigger — the FAB tap is what causes the mount, but the overlay logic lives here.

`useCoachMark` reads AsyncStorage in a `useEffect` on mount → `shouldShow` flips from `false` to `true` once the read resolves (microtask boundary). The overlay then renders on the next React commit. Visually: live camera paints first, then the overlay fades in (~280ms via the foundation's Reanimated entry — or instant if Reduce Motion is on).

### AsyncStorage key — single source of truth

The literal string is `"@outfinder/coachmark:camera-fab-firstuse"`. Already defined at `src/lib/coachMarkKeys.ts:7` as `COACH_MARK_KEYS.cameraFabFirstUse`. The dev reset row at `Settings.tsx` iterates `ALL_COACH_MARK_KEYS` (line 11 of `coachMarkKeys.ts`) so this key is automatically cleared by the existing dev affordance.

DO NOT define this string anywhere else. DO NOT prefix it inside `useCoachMark` (the hook takes the FULL key — explicit > magic, per Story 15.1 AC #1 and the comment at `useCoachMark.ts:9–13`).

### Dependencies & ordering

- **Hard prerequisite**: Story 15.1 (CoachMarkOverlay + useCoachMark + COACH_MARK_KEYS). Already DONE (merged at `c716a03` per memory `MEMORY.md`). Verify by `find src/components -name CoachMarkOverlay.tsx && find src/hooks -name useCoachMark.ts && find src/lib -name coachMarkKeys.ts` — all three should exist on the branch you start from.
- **Branch**: work off `epic-15` HEAD (currently `a81c324` per memory). Suggested feature branch: `story/15-3-camera-fab-firstuse-coach-mark`. Merge target: `epic-15`.
- **Does NOT depend on**: 15.6 (independent copy story, already DONE), 15.4 (the Visualizer A2 coach mark, will land later — they share only the foundation, no code coupling), 15.5 (Visualizer background, untouched here), 15.2 (Armario "En curso" flow, untouched here).
- **Does NOT block**: 15.4 / 15.5 / 15.2. They can proceed in parallel after 15.1 was done; 15.3 and 15.4 share zero files.

### Testing standards (recap)

- Co-locate `*.test.tsx` next to source — already done (test file lives next to the screen).
- Test interactions, not just rendering — AC #4 tests cover dismiss → AsyncStorage write + haptic + overlay leaves.
- Every AC describing user-observable behavior maps to a test case — AC #2 sub-bullets each map 1:1 to AC #4 (a)–(d).
- DO NOT mock `useCoachMark` or `CoachMarkOverlay` — that would let regressions where someone passes the wrong key, wrong text key, or omits the haptic call slip through. Use the real hook against the AsyncStorage mock that's wired in `jest.setup.js`.
- DO NOT add a defensive test for "what if user double-taps dismiss?" — `markSeen` is idempotent (the hook calls `setShouldShow(false)` first; a second invocation just writes "true" again). That's hypothetical scenario gating per CLAUDE.md "Don't add error handling … for scenarios that can't happen".

### Anti-patterns (explicit "do NOT")

- DO NOT inline the AsyncStorage key string `"@outfinder/coachmark:camera-fab-firstuse"` at the call site. Use `COACH_MARK_KEYS.cameraFabFirstUse`.
- DO NOT add `dismissLabel="..."` on the overlay JSX. The foundation defaults to `t("common.coachMark.gotIt")` — that's the contract.
- DO NOT introduce a 2nd Reduce Motion check, AsyncStorage read, or `announceForAccessibility` call here. The foundation owns all three.
- DO NOT call `markSeen()` in any path other than `handleDismissCoachMark`. The user must explicitly tap "Entendido" to acknowledge — no auto-dismiss on capture, no auto-dismiss on back press (the back button on the screen exits the camera; AsyncStorage state persists on next mount, so they'll see it again — that's correct, the user did NOT acknowledge).
- DO NOT add analytics / telemetry to the dismiss path. Memory `feedback_no_analytics.md`: Outfinder is craft-driven, not data-driven.
- DO NOT add a `delay` / `setTimeout` before showing the overlay. The hook's `useEffect` microtask boundary already provides the right cadence (live preview paints first, overlay fades in next commit). Adding artificial delay = jitter.
- DO NOT add an interstitial / full-screen blocking variant. DEC-3 explicitly forbids: "coach mark superpuesto, NO interstitial pantalla completa".
- DO NOT add a `__DEV__` reset affordance here. Story 15.1 already shipped one in Settings (`dev-reset-coach-marks-row`) that clears ALL coach mark keys via `ALL_COACH_MARK_KEYS`. Adding a screen-local one would duplicate.
- DO NOT migrate the legacy `@outfinder/visualizer-introduced` key. That's the OLD Visualizer onboarding, fully retired in 15.1, unrelated to this camera coach mark.

### Previous story intelligence — Story 15.1 (the foundation; merged at `c716a03`)

- Story 15.1 shipped the `CoachMarkOverlay` + `useCoachMark` + `COACH_MARK_KEYS` triplet, plus a `__DEV__`-gated "Reset coach marks" row in Settings. All three files are on the branch HEAD; verify with the `find` command in "Dependencies & ordering" before starting.
- 15.1 review noted 2 deferred non-blocking items (D-15.1-1 async Reduce Motion ~50ms flash; D-15.1-2 `Object.values` loses literal type narrowing — see `15-1-coach-mark-foundation-and-legacy-removal.md:225–227`). NEITHER affects 15.3 wiring. The Reduce Motion flash is a foundation-level cosmetic; 15.3 inherits it and does not need to fix it. The type narrowing is purely cosmetic.
- 15.1 confirmed CI baseline on `epic-15` HEAD: `pnpm lint` = 2 pre-existing errors, `npx tsc --noEmit` = 2 pre-existing errors in `Armario{SugerenciaArmonia,TuLook}Screen.test.tsx`, `pnpm test` = 954 passing / 3 pre-existing failing / 957 total (after 15.1's +6 net). 15.3 baseline before starting will be the same set + whatever 15.6 left (15.6 was a 2-task copy edit; baseline is effectively unchanged).
- 15.1 Dev Agent's pattern: `find` to verify, `git grep` to validate cleanup, `pnpm lint && npx tsc --noEmit && pnpm test` for the gates, then story-spec AC point-by-point. Mirror this discipline in 15.3.

### Out of scope for this story

- The Visualizer slot-discovery coach mark (FR8 + FR9, A2) — that's Story 15.4. Do NOT touch `OutfitVisualizer.tsx`, `OutfitCard.tsx`, or any `visualizer.coachMark.*` i18n keys here.
- Visualizer background paper-cream change (FR10 + FR11, A1) — that's Story 15.5. Do NOT touch `Aureola.tsx` or the Visualizer `backgroundColor` token.
- Armario "En curso" CategoryPicker flow (FR3–FR5, B1) — that's Story 15.2. Do NOT touch `ArmarioPickerScreen.tsx` / `ArmarioPreviewScreen.tsx` / `CategoryPickerSheet.tsx`.
- Copy changes (FR12 + FR13, D1+D2) — already DONE in Story 15.6 (`a81c324`). Do NOT re-touch `home.subtitle` or `favorites.newLookCta.title`.
- Marketing screenshots regeneration — parallel track per epic doc (`docs/planning/epic-15/epic-15.md:243`), not a code story.
- Adding a second coach mark with multi-step or timed reveal — the foundation is single-step by design (DEC-5 + Story 15.1 AC #1). Compose two overlays sequentially in a future consumer if ever needed; do NOT alter the foundation contract from this story.

### Project Structure Notes

- Touched files all live under `src/screens/unifiedCamera/` and `src/i18n/locales/` — no new directories. No new files. No new packages (`react-i18next`, `@react-native-async-storage/async-storage`, `react-native-reanimated`, `lib/haptics` all already present).
- `unifiedCamera` namespace placement in i18n: insert `coachMark` between `categorySheet` and `result` in alphabetical order to match the apparent ordering convention (visible by reading lines 357, 366, 379, 390 of `es.json` — currently `capture` → `result` → `categorySheet` → `save`, which is NOT strictly alphabetical, but is grouped by user-flow order; pragmatically place `coachMark` AFTER `capture` since the overlay appears DURING the capture screen's lifecycle — same logical adjacency). Final order: `capture` → `coachMark` → `result` → `categorySheet` → `save`. Acceptable either way; just be consistent between the two locale files.

### References

- Epic spec — Story 15.3 scope: [Source: docs/planning/epic-15/epic-15.md#story-153--c1-camera-fab-first-use-coach-mark] (lines 137–155).
- Epic spec — DEC-3 ("Coach mark sobre interstitial"): [Source: docs/planning/epic-15/epic-15.md#️-decisiones-cerradas-pm-session-2026-04-26] (line 35).
- Epic spec — DEC-5 ("Sistema de coach marks reutilizable"): [Source: docs/planning/epic-15/epic-15.md#️-decisiones-cerradas-pm-session-2026-04-26] (line 37).
- Epic spec — FR6 + FR7 (camera FAB onboarding requirements): [Source: docs/planning/epic-15/epic-15.md#functional-requirements] (lines 55–57).
- Epic spec — NFR2 (ES + EN coverage), NFR6 (Reduce Motion), NFR7 (`@outfinder/coachmark:*` namespace): [Source: docs/planning/epic-15/epic-15.md#non-functional-requirements] (lines 73–79).
- Foundation — `CoachMarkOverlay`: [Source: src/components/CoachMarkOverlay.tsx#L1-L137].
- Foundation — `useCoachMark`: [Source: src/hooks/useCoachMark.ts#L1-L48].
- Foundation — `COACH_MARK_KEYS` registry: [Source: src/lib/coachMarkKeys.ts#L6-L11] (entry `cameraFabFirstUse` at line 7).
- Shared dismiss label: [Source: src/i18n/locales/es.json#L197-L199] + [Source: src/i18n/locales/en.json#L197-L199] (`common.coachMark.gotIt`).
- Target screen — `UnifiedCameraCaptureScreen`: [Source: src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx#L49-L383] (49 = function start, 211 + 221 = early returns to mind, 357 = render insertion point).
- Target test file: [Source: src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx#L1-L238] (line 79 = `beforeEach` to extend with `AsyncStorage.clear()`).
- Existing `unifiedCamera.*` i18n surface: [Source: src/i18n/locales/es.json#L356-L395] + [Source: src/i18n/locales/en.json#L356-L395] (insertion point for `coachMark` sub-object).
- Story 15.1 record (foundation contract + dev reset row + baseline numbers): [Source: _bmad-output/implementation-artifacts/15-1-coach-mark-foundation-and-legacy-removal.md].
- Project rules: [Source: CLAUDE.md#agent-rules-from-5-pwa-retrospectives] — Story Scope (≤4 tasks ✅), AC verification, Accessibility First, Testing Discipline, RN Specifics, Rules of Hooks, Mandatory Code Review.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) via `bmad-dev-story` workflow on branch `story/15-3-camera-fab-firstuse-coach-mark` off `epic-15` HEAD `a81c324` (2026-04-27).

### Debug Log References

- Pre-baseline (epic-15 HEAD `a81c324`): `pnpm lint` = **2 errors** (pre-existing: `FavoritesList.test.tsx` + `OutfitVisualizer.tsx` Biome format), `npx tsc --noEmit` = **0 errors** (story spec said 2 baseline; the actual current baseline on `epic-15` HEAD is 0 — Story 15.6 retro confirmed `tsc 0 errors` post-15.6, and 15.1 had cleaned the 2 pre-existing tsc errors), `pnpm test` = **954 passed / 3 pre-existing failed / 957 total** (3 i18n locale-detection failures are pre-existing baseline), `grep` skips = **0**.
- Post-change: `pnpm lint` = **2 errors** (UNCHANGED — same 2 pre-existing files, after `git checkout` reverted out-of-scope biome auto-fixes), `npx tsc --noEmit` = **0 errors** (UNCHANGED), `pnpm test` = **958 passed / 3 pre-existing failed / 961 total** (delta **+4 net** — exactly the 4 new tests, AC #4 ✅), skips = **0** (UNCHANGED). All targets met.
- Resolved test pollution: initial test (b) used `jest.spyOn(AsyncStorage, "setItem").mockRestore()` — restoring a spy over a `jest.fn` mock leaves the underlying mock in a broken state where `setItem` no longer persists to `__INTERNAL_MOCK_STORAGE__`, breaking test (c)'s pre-seeded `setItem` call. Fix: assert against `AsyncStorage.setItem` jest.fn directly via `(AsyncStorage.setItem as jest.Mock).mockClear()` (no spyOn, no mockRestore). Tests are now isolated and order-stable.
- Biome auto-write side effect: `pnpm exec biome check src/ --write --unsafe` re-formatted the 2 pre-existing baseline format errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`) along with the 2 in-scope files. Reverted those 2 out-of-scope files via `git checkout` to keep the story diff scoped per `feedback_no_patches.md`.

### Completion Notes List

- **AC #1 — wiring**: ✅ All 3 imports added (`CoachMarkOverlay`, `useCoachMark`, `COACH_MARK_KEYS`) — biome alphabetized them inside the `@/`-prefix group (`components/CoachMarkOverlay` → `hooks/useCoachMark` → `lib/coachMarkKeys` → `lib/colorConversion` → `lib/colorMatch` → `lib/haptics`); functionally equivalent to spec. Hook called at line 58–59 BEFORE the early returns at lines 220 + 230 (Rules of Hooks ✅). `handleDismissCoachMark` defined as `async function` after `handleRetry` (lines 104–107) — exactly two lines (`hapticLight(); await markCoachMarkSeen();`), no try/catch. `<CoachMarkOverlay/>` rendered at lines 369–379 between `{renderErrorSheet()}` and `{processing && (...)}` per spec; `visible` is the 3-way AND `shouldShowCoachMark && permission?.granted === true && error === null`; no `dismissLabel` prop (foundation default `common.coachMark.gotIt` reused).
- **AC #2 — behavioral contract**: ✅ All 4 covered guarantees pass via the new tests (a)–(d). The 5th guarantee (error-sheet visible → no overlay) is enforced by the `error === null` clause in the JSX `visible` prop but is not test-covered because AC #4 explicitly lists only 4 tests; staying within scope per `feedback_no_patches.md`. The gate is statically verifiable in the JSX.
- **AC #3 — i18n**: ✅ `unifiedCamera.coachMark.{text,a11yAnnouncement}` added to both `es.json` (lines 366–369) and `en.json` (lines 366–369) as a sibling between `capture` and `result`. JSON parses (verified via `node -e JSON.parse(...)`). `git grep '"coachMark"' src/i18n/locales/es.json | wc -l` = `2`, same for `en.json`. No `dismissLabel` key added.
- **AC #4 — gates**: ✅ tsc 0/0 unchanged, lint 2/2 unchanged (both pre-existing files), test +4 net (954 → 958), skips 0 unchanged. All 8 pre-existing tests in `UnifiedCameraCaptureScreen.test.tsx` continue to pass after the `AsyncStorage.clear()` insertion in `beforeEach` (also converted `beforeEach(() => {...})` to `beforeEach(async () => {...})` to await the clear — single mechanical change, no behavioral impact on the existing tests).
- **On-device smoke**: ✅ VALIDADO por Alejandro 2026-04-27 — overlay se ve perfecto sobre el live preview, dismiss + haptic + persistencia AsyncStorage funcionan, sin regresión. No native module changes (pure JS + JSON), no rebuild required.
- **Out-of-scope reverts**: 2 pre-existing baseline format errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`) were briefly auto-fixed by `biome --write --unsafe` but reverted via `git checkout` to honor `feedback_no_patches.md` (don't piggyback unrelated cleanups onto a story).

### File List

**Modified (4):**
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx` — 3 new imports (`CoachMarkOverlay`, `useCoachMark`, `COACH_MARK_KEYS`), 1 new hook call, 1 new `handleDismissCoachMark` function, 1 new `<CoachMarkOverlay/>` JSX block.
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx` — 1 new `AsyncStorage` import, 1 line in `beforeEach` (`await AsyncStorage.clear()` — required `async` modifier on the arrow), 4 new `it` cases inside a new nested `describe("camera FAB first-use coach mark (Story 15.3)", …)` block.
- `src/i18n/locales/es.json` — new `unifiedCamera.coachMark` sub-object with `text` + `a11yAnnouncement` (4 lines including braces).
- `src/i18n/locales/en.json` — new `unifiedCamera.coachMark` sub-object with `text` + `a11yAnnouncement` (4 lines including braces).

**Sprint tracking (1):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status update for `15-3-camera-fab-firstuse-coach-mark` from `ready-for-dev` → `in-progress` → `review`, plus dated history annotation.

**Story (1):**
- `_bmad-output/implementation-artifacts/15-3-camera-fab-firstuse-coach-mark.md` — task checkboxes, status, Dev Agent Record, File List, Change Log.

NO new files created. NO native module changes. NO new packages. NO `app.config.ts` changes.

### Review Findings

- [x] [Review][Patch] `COACH_KEY` literal duplicates registry — test file hardcodes `"@outfinder/coachmark:camera-fab-firstuse"` instead of importing `COACH_MARK_KEYS.cameraFabFirstUse`; key drift would silently pass [src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx:239]
- [x] [Review][Defer] AC #2(e) error gate has no automated test — `error === null` gate is in the JSX `visible` prop but no `it` case exercises it; spec intentionally scoped to (a)–(d) [src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx] — deferred, spec-scoped gap
- [x] [Review][Defer] Processing + CoachMark z-order race — `CoachMarkOverlay` has `zIndex:999`; if `shouldShowCoachMark` resolves true after `processing` starts, coach mark renders above the processing spinner (foundation issue from 15.1) [src/components/CoachMarkOverlay.tsx:88] — deferred, pre-existing foundation issue
- [x] [Review][Defer] VoiceOver re-announces on error→retry cycle — `announcedRef` resets when `visible` flips false, so `AccessibilityInfo.announceForAccessibility` re-fires when `error` is cleared and coach mark re-appears; foundation behavior from 15.1 [src/components/CoachMarkOverlay.tsx:48-77] — deferred, pre-existing foundation behavior
- [x] [Review][Defer] Test (c) double `flushMicrotasks` without `waitFor` — two consecutive `await flushMicrotasks()` calls could produce a false green on slow CI if hook effect hasn't resolved; `waitFor` would be more robust [src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx:276-278] — deferred, minor fragility not a bug

### Change Log

- 2026-04-27 — Wired Story 15.1 `CoachMarkOverlay` + `useCoachMark` foundation into `UnifiedCameraCaptureScreen` with key `COACH_MARK_KEYS.cameraFabFirstUse`. Single-step coach mark over the live camera preview explains the AI pipeline once on first FAB use; persistent dismiss per FR7. Added ES + EN copy under `unifiedCamera.coachMark.{text,a11yAnnouncement}`. 4 new tests cover AC #4 (a)–(d). CI gates: tsc 0/0, lint 2/2 (pre-existing), test 958/3/961 (delta +4), skips 0/0. Pending Alejandro on-device smoke + adversarial code review before merge to `epic-15`.
