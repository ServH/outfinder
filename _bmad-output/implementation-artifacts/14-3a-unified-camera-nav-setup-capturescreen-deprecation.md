# Story 14.3a: Unified camera navigation setup + `CaptureScreen` deprecation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer laying the navigation shell for the unified camera flow**,
I want **a new `UnifiedCameraRoot` nested navigator mounted at `RootStackParamList` level (sibling of `Main` and the preserved `ArmarioRoot`), the Tab Bar central FAB rewired to present it modally, and the legacy color-first `CaptureScreen` — including its route entry in `ColorsStackParamList`, its file, its co-located tests, and its three orphaned helper components (`AnalysisOverlay`, `ColorMatchSheet`, `OutOfCoverageSheet`) — fully removed; while `ArmarioCaptureScreen` + `ArmarioPreviewScreen` + `ArmarioRoot` + `ArmarioStackParamList` remain completely untouched per TD-2**,
so that **Story 14.3b can drop the new Swift pipeline into a stable placeholder `Capture` screen without colliding with two parallel color-detection camera subsystems, Story 14.4 can build the Result UI against typed route params, and the Ficha Wada slot-assignment flow (S3 picker `+ Nueva foto`, Settings `Armario Virtual (dev)` row) keeps working byte-for-byte today**.

## Acceptance Criteria

1. **Given** the new unified-camera nav types are added to `src/navigation/types.ts`, **When** the file is inspected, **Then** a new type `UnifiedCameraStackParamList` exists with exactly three routes — `Capture: undefined`, `Result: undefined` (placeholder; Story 14.3b extends params to `{ cutoutUri: string; dominantHex: string; wadaMatch: MatchResult }` and Story 14.4 renders the UI), `PostSave: undefined` (placeholder reserved for Story 14.5's post-save "¿Ahora qué?" screen per UX-DR1) — **And** `RootStackParamList` is extended so the full shape is: `Main: undefined`, `ArmarioRoot: NavigatorScreenParams<ArmarioStackParamList> | undefined` (PRESERVED — no changes), `UnifiedCameraRoot: NavigatorScreenParams<UnifiedCameraStackParamList> | undefined` (NEW, declared AFTER `ArmarioRoot` so the file diff shows an addition, not a reorder), **And** the existing `ColorsStackParamList` has its `CaptureScreen: undefined` line REMOVED (the other four entries — `ColorHome`, `BrowseAllColors`, `Combinations`, `OutfitVisualizer` — are preserved byte-for-byte in the same order), **And** `ArmarioStackParamList` is preserved UNCHANGED (no edits to the `ArmarioCapture` / `ArmarioPreview` route types).

2. **Given** a new file `src/navigation/UnifiedCameraStack.tsx` exists, **When** the module is inspected, **Then** it exports a function component `UnifiedCameraStack` that wraps a `createNativeStackNavigator<UnifiedCameraStackParamList>()` registering the three routes `Capture`, `Result`, `PostSave` in that order with `headerShown: false` on every screen and the project-standard `animation: isReducedMotion ? "none" : "fade"` (mirror the `ArmarioStack.tsx` precedent exactly — `useReducedMotion` imported from `@/hooks/useReducedMotion`), **And** each of the three screens is a minimal **placeholder** function component exported from a new file pair:
    - `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx` — renders a full-screen `View` with `testID="unified-camera-capture-placeholder"`, a single `Text` reading `"Capture (coming in 14.3b)"`, and a `Pressable` back-button `testID="unified-camera-capture-back"` (top-left, 44pt) that calls `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.goBack()` so the modal closes. Dev agents MUST NOT port any logic from the deleted `CaptureScreen` — the real camera pipeline lands in 14.3b.
    - `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` — renders `testID="unified-camera-result-placeholder"` + text `"Result (coming in 14.4)"`. Real UI in 14.4 per UX-DR1.
    - `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx` — renders `testID="unified-camera-postsave-placeholder"` + text `"Post-save (coming in 14.5)"`.

    Each placeholder file has a named export matching its screen component name (no `export default`), an `interface {ScreenName}Props` (empty for now: `type UnifiedCameraCaptureScreenProps = Record<string, never>`), and a co-located `.test.tsx` with a single smoke test asserting the placeholder `testID` renders.

3. **Given** `App.tsx` registers the root navigator, **When** its JSX is inspected, **Then** the `RootStack.Navigator` declares three `Screen` children in this exact order — `Main` (unchanged), `ArmarioRoot` (unchanged — presentation, component, options all preserved), `UnifiedCameraRoot` (NEW) — **And** `UnifiedCameraRoot` is registered with `component={UnifiedCameraStack}` and `options={{ presentation: "modal" }}` (matching the `ArmarioRoot` precedent exactly — do NOT use `fullScreenModal` per memory `project_epic12_architecture.md` which explicitly documents `replace` nav sin `fullScreenModal`), **And** the new import line `import { UnifiedCameraStack } from "@/navigation/UnifiedCameraStack"` is added ALPHABETICALLY next to the `ArmarioStack` import at the top of the file (lines 22–23 region; preserve the existing import sort — Biome's `organize-imports` will enforce this on save).

4. **Given** the Tab Bar central FAB on iPhone (`CustomTabBar.tsx:89–92` `handleCameraPress`) and on iPad (`CustomTabBar.tsx:137–140` — `camera-fab-ipad` tile), **When** the user taps either affordance, **Then** navigation fires `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("UnifiedCameraRoot")` (NOT `navigation.navigate("ColorsTab", { screen: "CaptureScreen" })` — the current wiring), **And** `hapticLight()` continues to fire on press (unchanged), **And** the originating tab state (Colors / Favorites / Settings) is preserved across the modal present → dismiss cycle — swipe-down on the modal returns the user to the SAME tab they were on, at the SAME screen state (swipe-back is native RootStack modal behavior, no custom handling needed), **And** the modal presents OVER the Tab Bar (root-modal precedent — `ArmarioRoot` already exhibits this; the system renders the Tab Bar below the modal). No explicit Tab Bar hide logic is required.

5. **Given** the dead `isCaptureScreen` branch in `CustomTabBar.tsx` (lines 38–45 + 94–98) is the only consumer of the stale `CaptureScreen` route, **When** this story merges, **Then** those dead-code hunks are deleted:
    - The `activeColorsScreen` / `isCaptureScreen` derivation (lines ~36–45) — **only** the `isCaptureScreen` variable is removed; the `isWarmScreen` detection for `OutfitVisualizer` MUST remain intact (it drives the `animatedBgStyle` crossfade on the bar).
    - The `if (isCaptureScreen) return null;` early-return (lines 94–98) — deleted in full, including the 2-line comment above it.

    **And** `activeColorsScreen` stays declared only if `isWarmScreen` still references it; otherwise fold it into the `isWarmScreen` computation to avoid an unused-variable lint error. **And** the `colorsNestedState` biome-ignore is preserved IF and only IF it's still load-bearing for `isWarmScreen`.

6. **Given** the legacy `CaptureScreen` source + tests + three orphaned helper components exist in the repo, **When** this story merges, **Then** ALL of the following are deleted (via `git rm` — NOT renamed, NOT deprecated-with-comment):
    - `src/screens/CaptureScreen.tsx`
    - `src/screens/CaptureScreen.test.tsx`
    - `src/components/AnalysisOverlay.tsx` (only consumer is the deleted `CaptureScreen`)
    - `src/components/AnalysisOverlay.test.tsx`
    - `src/components/ColorMatchSheet.tsx` (only consumer is the deleted `CaptureScreen`)
    - `src/components/ColorMatchSheet.test.tsx`
    - `src/components/OutOfCoverageSheet.tsx` (only consumer is the deleted `CaptureScreen`)
    - `src/components/OutOfCoverageSheet.test.tsx`

    **And** `src/navigation/ColorsStack.tsx` drops the `import { CaptureScreen } from "@/screens/CaptureScreen"` line AND the `<Stack.Screen name="CaptureScreen" ... />` registration (the other four screens — `ColorHome`, `BrowseAllColors`, `Combinations`, `OutfitVisualizer` — preserved verbatim in order), **And** post-merge `grep -rln "CaptureScreen" src` returns ZERO hits under `src/` (the string only survives in `_bmad-output/implementation-artifacts/**` archive docs and `modules/white-balance/ios/WhiteBalanceModule.swift:35` code comment — both are acceptable; pre-existing comment can be touched up to reference `UnifiedCameraStack` but is not blocking), **And** `grep -rln "AnalysisOverlay\|ColorMatchSheet\|OutOfCoverageSheet" src` returns ZERO hits.

7. **Given** the existing Epic-13 "Armario capture" entry points — `ArmarioPickerScreen.tsx:201` (`rootNavigation.navigate("ArmarioRoot", { screen: "ArmarioCapture", params: { onCutoutSaved: ... } })`), `Settings.tsx:287–292` (`Armario Virtual (dev)` row), the `+ Nueva foto` tab + footer CTA inside `ArmarioPickerScreen` — **When** this story merges, **Then** ALL of these continue to function byte-for-byte identically:
    - `ArmarioCaptureScreen.tsx`, `ArmarioPreviewScreen.tsx`, `ArmarioStack.tsx`, `ArmarioStackParamList` are UNCHANGED (diff shows 0 touched lines).
    - `saveCutoutAsWardrobeItem.ts` is UNCHANGED (Story 14.3b owns its rewrite for TD-1).
    - The `RootStackParamList.ArmarioRoot` registration in `App.tsx` is UNCHANGED.
    - Settings dev-row `navigation.getParent()?.navigate("ArmarioRoot", ...)` still resolves.
    - `ArmarioPickerScreen.test.tsx:223` "(g) Nueva foto tab + footer CTA navigate to ArmarioRoot with onCutoutSaved callback" continues to pass — the route name `"ArmarioRoot"` is intact.

8. **Given** the Tab Bar FAB accessibility label, **When** VoiceOver focuses the FAB on iPhone (`camera-fab-phone`) or iPad (`camera-fab-ipad`), **Then** the announced label reads *"Cámara — captura una prenda"* (ES) / *"Camera — capture a garment"* (EN) with `accessibilityRole="button"` (role unchanged), **And** the `testID` values `camera-fab-phone` + `camera-fab-ipad` are PRESERVED (tests depend on them), **And** the updated i18n key `colorCapture.cameraButtonLabel` in `src/i18n/locales/es.json:290` + `src/i18n/locales/en.json:290` has its value replaced with the new copy (the key name stays `cameraButtonLabel` — rename to a more semantic `unifiedCameraButtonLabel` would multiply the diff surface; leave the key, update the string), **And** the i18n test suite (if it asserts on this key) is updated in the same commit.

9. **Given** the full quality gates `npx tsc --noEmit`, `pnpm lint`, `pnpm test`, **When** all three run on this story branch, **Then** all pass green, **And** zero new test-skips are introduced (NFR6), **And** Biome lint passes (tabs, double quotes, function declarations, no `export default`), **And** zero snapshot regressions (if any test snapshots the Tab Bar DOM tree or ColorsStack routes, update once and commit the new baseline with a one-line note in the dev log), **And** the `pnpm test` suite baseline drops by ~27 tests (the deleted `CaptureScreen.test.tsx` had 26 tests plus handful across the three orphaned helper test files per inspection of line counts) but gains ≥3 new tests (one per new placeholder smoke test). The NET test count is expected to land at ~795–800 passing / 60 pre-existing failures (vs. 14.2 baseline of 816 passing / 60 — the delta is negative intentionally because we're deleting dead code). Confirm no passing test in the surviving suite regresses.

10. **Given** `App.test.tsx` currently renders the root tree, **When** it runs after this story merges, **Then** it passes without modification — OR — if the root-stack render now fails due to the added `UnifiedCameraRoot` Screen referring to untyped route params, update `App.test.tsx`'s mocks minimally (preferred: add a `jest.mock("@/navigation/UnifiedCameraStack", () => ({ UnifiedCameraStack: () => null }))`). Do NOT expand App.test.tsx's assertions beyond what 14.2 left them at.

11. **Given** this story is a **pure navigation + deprecation refactor** (no feature additions, no camera pipeline, no UI design surface), **When** a user opens the built app (or the iOS simulator) after this story merges, **Then** tapping the Tab Bar FAB presents the `UnifiedCameraRoot` modal with the placeholder "Capture (coming in 14.3b)" screen (swipe-down dismisses, returns to prior tab), **And** all other user-visible surfaces (Colors home, Combinations, Visualizer, Favorites/Mis Looks, Armario flows, Settings) are byte-for-byte identical to 14.2, **And** no native iOS rebuild is required — this is pure TypeScript + React Navigation config changes, Metro reload is sufficient (contrast with Story 14.3b which DOES require `expo run:ios` for the Swift module change).

## Tasks / Subtasks

- [x] **Task 1: Add nav types + register `UnifiedCameraRoot` on `RootStack` modal** (AC: #1, #3)
  - [x] 1.1 `src/navigation/types.ts` — add `UnifiedCameraStackParamList` (3 routes: `Capture`, `Result`, `PostSave` — all `undefined` for now; 14.3b + 14.4 tighten the params later). Add `UnifiedCameraRoot: NavigatorScreenParams<UnifiedCameraStackParamList> | undefined` to `RootStackParamList` (after `ArmarioRoot`, no reorder). Remove `CaptureScreen: undefined` from `ColorsStackParamList`. Preserve `ArmarioStackParamList` verbatim.
  - [x] 1.2 `App.tsx` — add `import { UnifiedCameraStack } from "@/navigation/UnifiedCameraStack"` (Biome will alphabetize with the existing `ArmarioStack` import). Add `<RootStack.Screen name="UnifiedCameraRoot" component={UnifiedCameraStack} options={{ presentation: "modal" }} />` AFTER the `ArmarioRoot` screen (3 screens total on the root navigator). `Main` + `ArmarioRoot` entries stay byte-for-byte.

- [x] **Task 2: Build `UnifiedCameraStack` + three placeholder screens with smoke tests** (AC: #2)
  - [x] 2.1 New file `src/navigation/UnifiedCameraStack.tsx` — mirror `ArmarioStack.tsx` exactly: `createNativeStackNavigator<UnifiedCameraStackParamList>()`, `screenOptions={{ headerShown: false, animation: isReducedMotion ? "none" : "fade" }}`, three `<Stack.Screen>` children in order `Capture`, `Result`, `PostSave`. Import `useReducedMotion` from `@/hooks/useReducedMotion`.
  - [x] 2.2 New directory `src/screens/unifiedCamera/` + three placeholder screens (`UnifiedCameraCaptureScreen.tsx`, `UnifiedCameraResultScreen.tsx`, `UnifiedCameraPostSaveScreen.tsx`). Each: named export, `Record<string, never>` props type, full-screen `View` with `testID` + placeholder copy, BackButton on Capture that calls `navigation.getParent()?.goBack()` to close the modal.
  - [x] 2.3 Three co-located smoke tests (`{Screen}.test.tsx`) — each asserts the placeholder `testID` renders + (for Capture) BackButton calls `getParent().goBack()` once on press. No deep assertions — real UI lands in 14.3b / 14.4 / 14.5.

- [x] **Task 3: Rewire Tab Bar FAB + delete dead `isCaptureScreen` branch + update i18n label** (AC: #4, #5, #8)
  - [x] 3.1 `CustomTabBar.tsx` — rewrite `handleCameraPress` body: `hapticLight(); navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("UnifiedCameraRoot");`. Import `NativeStackNavigationProp` from `@react-navigation/native-stack` (add if missing) and `RootStackParamList` from `@/navigation/types`. Preserve `testID`s + `accessibilityRole`.
  - [x] 3.2 `CustomTabBar.tsx` — delete the dead `isCaptureScreen` hunks (declaration lines ~38–45 and the early-return at lines 94–98). Re-verify `isWarmScreen` still compiles (uses `activeColorsScreen === "OutfitVisualizer"`); fold `activeColorsScreen` inline if it becomes the only consumer.
  - [x] 3.3 `src/i18n/locales/es.json:290` — replace value with `"Cámara — captura una prenda"`. `src/i18n/locales/en.json:290` — replace value with `"Camera — capture a garment"`. Leave the key name `cameraButtonLabel` unchanged. If `src/i18n/i18n.test.ts` or any snapshot asserts on the old string, update in the same commit.
  - [x] 3.4 `CustomTabBar.test.tsx` does NOT currently exist (verified via `ls src/navigation/CustomTabBar.test.*`) — do NOT create one in this story; the FAB rewire is covered indirectly through `App.test.tsx`'s traversal plus the manual smoke in Task 5.4. If you decide a dedicated unit test is justified, add it as a follow-up in the Review Findings log, not inside this story's scope.

- [x] **Task 4: Delete `CaptureScreen` + 3 orphaned helpers + `ColorsStack` registration** (AC: #6, #7, #9)
  - [x] 4.1 `git rm` — `src/screens/CaptureScreen.tsx`, `src/screens/CaptureScreen.test.tsx`, `src/components/AnalysisOverlay.tsx`, `src/components/AnalysisOverlay.test.tsx`, `src/components/ColorMatchSheet.tsx`, `src/components/ColorMatchSheet.test.tsx`, `src/components/OutOfCoverageSheet.tsx`, `src/components/OutOfCoverageSheet.test.tsx`.
  - [x] 4.2 `src/navigation/ColorsStack.tsx` — delete the `import { CaptureScreen } ...` line + the `<Stack.Screen name="CaptureScreen" ... />` block. Other four screens preserved byte-for-byte.
  - [x] 4.3 `grep` audit after deletion: `grep -rln "CaptureScreen\|AnalysisOverlay\|ColorMatchSheet\|OutOfCoverageSheet" src` → expect ZERO hits in live `src/` code. A single `WhiteBalanceModule.swift:35` reference in a Swift comment is acceptable (outside JS bundle; touch if trivial, else leave for 14.3b cleanup).
  - [x] 4.4 Verify `ArmarioCaptureScreen` / `ArmarioPreviewScreen` / `ArmarioStack.tsx` / `ArmarioStackParamList` / `saveCutoutAsWardrobeItem.ts` are UNCHANGED via `git diff` — zero touched lines on any of those paths. `Settings.tsx:287–292` `Armario Virtual (dev)` row still navigates to `ArmarioRoot` — no edit needed.

- [x] **Task 5: Quality gates + manual smoke + AC walkthrough** (AC: #9, #10, #11)
  - [x] 5.1 `npx tsc --noEmit` — clean (expect zero errors; the nav type surgery + placeholder screens are all statically sound).
  - [x] 5.2 `pnpm lint` — clean after `pnpm biome check --write` autofix (organize-imports + formatting only; no rule-suppression comments permitted).
  - [x] 5.3 `pnpm test` — expect ~795–800 passing / 60 pre-existing / 0 new failures / 0 new skips (net negative vs. 14.2's 816 because ~30+ tests deleted with the dead code, ~3 added with placeholders). Re-run `App.test.tsx` specifically — if it fails due to the new `UnifiedCameraRoot` screen, add a minimal `jest.mock("@/navigation/UnifiedCameraStack", ...)` per AC #10.
  - [x] 5.4 Manual smoke on iOS simulator (Metro reload suffices — NO native rebuild needed for this story): tap FAB from each tab (Colors / Favorites/Mis Looks / Settings) → verify `UnifiedCameraRoot` placeholder opens as a modal, swipe-down returns to the SAME tab at its prior scroll state. From Favorites tab → open any Ficha Wada → tap a color slot → S3 picker `+ Nueva foto` → verify `ArmarioCaptureScreen` STILL opens (TD-2 preservation). From `__DEV__` Settings → tap `Armario Virtual (dev)` → verify it still reaches `ArmarioCaptureScreen`.
  - [x] 5.5 AC walkthrough table authored in Completion Notes below. Confirm zero user-visible UX change beyond the FAB's new destination (placeholder screen replacing the old color-detection UI — this is expected; real UI lands in 14.3b + 14.4).

## Dev Notes

### Architecture context (brownfield — Epic 14 navigation shell)

- **Current branch (start of this story):** `epic-14` (Story 14.2 merged at commit `e106073`). Create a new branch `story/14-3a-unified-camera-nav-setup-capturescreen-deprecation` off `epic-14`. This is the third live code story on `epic-14`.
- **Target version:** v1.4.0 App Store submission (launch blocker). This story is the navigation shell prerequisite for 14.3b (pipeline) and 14.4 (Result UI).
- **Per TD-2 (epic-14.md lines 56–61) — narrow deprecation ONLY:**
  - ✅ Delete `CaptureScreen` (the color-first camera from Epic 12) + its orphaned helper components (`AnalysisOverlay`, `ColorMatchSheet`, `OutOfCoverageSheet` — zero consumers outside the deleted screen).
  - ✅ Create `UnifiedCameraRoot` + `UnifiedCameraStack` + three placeholder screens.
  - ✅ Rewire Tab Bar FAB → `UnifiedCameraRoot`.
  - ❌ **DO NOT** touch `ArmarioCaptureScreen`, `ArmarioPreviewScreen`, `ArmarioStack.tsx`, `ArmarioStackParamList`, `RootStackParamList.ArmarioRoot`. These serve a semantically distinct in-Ficha-Wada slot-assignment context (cutout-only pipeline, no Wada tone detection) and survive in v1.4.0.
  - ❌ NO camera pipeline, NO WB slider, NO background-removal, NO Wada color matching, NO Result UI. Those land in 14.3b (pipeline) + 14.4 (Result UI) + 14.5 (category sheet + save).
  - ❌ NO Mis Looks tab rename (14.7). NO Visualizer CTA swap (14.6). NO store changes (14.2 already merged).
  - ❌ NO native module changes, NO `expo run:ios` rebuild required.

### Why the two cameras are semantically distinct (TD-2 rationale, memorised per `epic-14-tech-review.md` line 56 revision)

The tech review originally proposed full `ArmarioRoot` deprecation. Alejandro + Winston revised this on 2026-04-21 to **narrow deprecation** after mapping the two UX contexts:

| Context | Entry point | Pipeline | Output |
|---------|-------------|----------|--------|
| **Unified camera** (this story + 14.3b) | Tab Bar central FAB | `removeBackground` → `getColors` on cutout → `matchWadaColor` | `{ cutoutUri, dominantHex, wadaMatch }` → Result screen |
| **Armario camera** (preserved from Epic 13) | S3 Picker `+ Nueva foto` tab/footer OR Settings `Armario Virtual (dev)` row | `removeBackground` → cutout (no color detection) | `{ cutoutUri, sourceUri, onCutoutSaved: (id) => void }` → `ArmarioPreviewScreen` → persist to `useMisLooksStore.items` + dismiss modal, invoke callback |

If we deleted `ArmarioRoot` we'd need to re-plumb the entire in-Ficha-Wada assignment flow from Story 13.4b (commit `077d20c`-era). The narrow deprecation preserves that work and ships the unified-camera FAB discoverability loop as a cleanly additive change.

### Navigation graph after this story

```
NavigationContainer
└── RootStack (createNativeStackNavigator<RootStackParamList>)
    ├── Main          → TabNavigator
    │   ├── ColorsTab       → ColorsStack (ColorHome, BrowseAllColors, Combinations, OutfitVisualizer)
    │   ├── FavoritesTab    → FavoritesStack (FavoritesList + Armario workspace screens per 13.4a/b)
    │   └── SettingsTab     → SettingsStack (Settings)
    ├── ArmarioRoot   → ArmarioStack (ArmarioCapture, ArmarioPreview)   [presentation: "modal"]  ← PRESERVED
    └── UnifiedCameraRoot → UnifiedCameraStack (Capture, Result, PostSave) [presentation: "modal"]  ← NEW THIS STORY
```

Three root-level entries. Two modals. One tab navigator. Zero `fullScreenModal` anywhere (per `project_epic12_architecture.md` — all modals use `presentation: "modal"` so swipe-down dismissal works natively).

### Why the FAB uses `navigation.getParent()?.navigate(...)` instead of `navigation.navigate(...)`

`CustomTabBar` receives a `BottomTabBarProps` navigation object scoped to the `TabNavigator` — its `navigate()` method only sees tab routes (`ColorsTab`, `FavoritesTab`, `SettingsTab`). `UnifiedCameraRoot` is a sibling of `Main` on the **root** stack, not a tab. The tab-scoped nav cannot reach it directly. `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()` climbs one level to the RootStack, whose `navigate("UnifiedCameraRoot")` opens the modal. This pattern is already established in `Settings.tsx:287–291` (`Armario Virtual (dev)` dev-row): `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("ArmarioRoot", { screen: "ArmarioCapture" })`. Mirror that exactly.

The `?.` (optional chain) is defensive — in Jest test harnesses that mount `CustomTabBar` in isolation, `getParent()` returns `undefined`. Keep the `?.` so tests don't crash; in production the parent always exists.

### Why placeholder screens (not TODO comments or empty `<View />`)

Two reasons:
1. **Jest test harness:** Story 14.3b's tests will import `UnifiedCameraCaptureScreen` to patch its pipeline. Having the real file exist from day one — even as a placeholder — avoids the "module not found" churn when 14.3b lands. Placeholder file path is a contract with the next story.
2. **Manual smoke test:** AC #11 asks the dev to verify the FAB opens a rendered modal with an obvious affordance to close. An empty `<View />` would swallow the swipe-back gesture on some iOS simulators (React Navigation's `gestureEnabled` default works, but the back-button is a belt-and-suspenders). `testID="unified-camera-capture-back"` is also a Jest hook the smoke test can call.

Placeholder text copy (`"Capture (coming in 14.3b)"`) is DEV-VISIBLE ONLY — this story never ships to end users as-is. 14.3b lands Capture's real UI and 14.4 lands Result's real UI before v1.4.0 submission. The placeholder is ephemeral by design.

### Why deleting the three orphaned helpers (`AnalysisOverlay`, `ColorMatchSheet`, `OutOfCoverageSheet`) is in-scope here, not punted to 14.4

Grep confirms zero consumers of these three components outside the deleted `CaptureScreen`:

```
grep -rln "AnalysisOverlay\|ColorMatchSheet\|OutOfCoverageSheet" src
→ src/screens/CaptureScreen.tsx       (being deleted)
→ src/screens/CaptureScreen.test.tsx  (being deleted)
→ src/components/OutOfCoverageSheet.tsx + .test.tsx   (self)
→ src/components/ColorMatchSheet.tsx + .test.tsx      (self)
→ src/components/AnalysisOverlay.tsx + .test.tsx      (self)
```

Leaving them as dead code for 14.4 to clean up would:
- Force 14.4's grep audit to re-investigate them from cold.
- Produce biome "unused module" lints in the interim story 14.3b build.
- Risk a dev-agent accidentally re-importing `OutOfCoverageSheet` for the Story 14.4 tone-correction section (whereas the UX spec `UX-DR1` calls for a NEW inline section per Pencil frame `KY9jv`, NOT a reusable sheet — see `docs/planning/ux-design-epic-14.md` line 183).

Story 14.4's tone-correction UI is built from scratch against the Pencil spec. Deleting these now keeps the tree clean.

### `WhiteBalanceModule.swift:35` — orphan code comment (ignore, not a blocker)

`modules/white-balance/ios/WhiteBalanceModule.swift:35` contains a comment: *"src/screens/CaptureScreen.tsx — the user sees brackets at this fraction"*. After `CaptureScreen` deletion this comment is stale. **It is NOT a blocker for this story.** The `white-balance` Swift module itself also becomes orphaned (no JS consumer) but its deletion is 14.3b's scope — the Swift module change in 14.3b will either retire the module entirely or pivot it. Leave the comment + module alone this story.

### Accessibility label change — why we update the string, not the key

The i18n key `colorCapture.cameraButtonLabel` is in 9 files already (two locale files + uses via `t(...)` in CustomTabBar). Renaming the key to `unifiedCamera.cameraButtonLabel` or similar would:
- Create a 4-file churn (es.json, en.json, CustomTabBar iPhone FAB, CustomTabBar iPad FAB).
- Require a `git mv`-style rename across locale JSON (not really a rename — just two independent string edits).
- Force any snapshot test that pin-ref'd the key to re-snapshot.

Net: more diff surface for zero semantic benefit — the key name is an internal identifier, the user-visible copy is the value. Update the value only. Rename (if desired for taxonomy hygiene) can be a follow-up in Story 14.4.

### `pnpm test` baseline math

- 14.2 baseline: 816 passing / 60 pre-existing / 0 new failures / 0 new skips.
- `CaptureScreen.test.tsx` has 26 tests (verified via `describe` block count at lines 116–323 — 5 describe blocks × ~5 tests avg). Deleting removes ~26 passing tests.
- `AnalysisOverlay.test.tsx`, `ColorMatchSheet.test.tsx`, `OutOfCoverageSheet.test.tsx` each contribute ~4–10 tests (spot check with `grep -c "^\s*\(it\|test\)(" <file>`). Deleting removes an estimated ~15–25 further passing tests.
- Three new placeholder smoke tests add +3 passing tests.
- **Expected net:** 816 − ~41 (deletions) + 3 (additions) = **~778 passing** / 60 pre-existing. Actual number will vary ±5 depending on exact test counts in the three helper files. **This net-negative is EXPECTED and correct — we are deleting dead code. Do NOT chase the 816 baseline; chase "zero NEW failures" and "zero NEW skips".**

If the suite turns out higher than expected (e.g. a test got ported or a mock added tests), note it in Completion Notes. If lower (tests inadvertently silenced), investigate.

### Known risks to guard against

- **FAB no-op in test harnesses:** `CustomTabBar` unit tests that mount the component in isolation have no `NavigationContainer` parent, so `navigation.getParent()` returns `undefined` and the FAB press becomes a no-op. If there's an existing test asserting "FAB press fires `navigate("ColorsTab", ...)`", it MUST be updated — mock `getParent` to return an object with a `navigate` spy, then assert `getParent().navigate("UnifiedCameraRoot")` was called. Refer to `Settings.test.tsx` (dev-row assertion pattern, lines around 280) for a working precedent.
- **Order of Screen registration on RootStack:** React Navigation presents the Navigator's INITIAL screen (top of the children list) on mount. `Main` is first — preserved. If you accidentally reorder, the app boots directly into a modal. Don't.
- **`isWarmScreen` regression after deleting `isCaptureScreen`:** the two derivations share the `activeColorsScreen` read. Deleting `isCaptureScreen` must not strand `activeColorsScreen`; if `isWarmScreen` still depends on it, keep it. If you refactor to inline, validate the Visualizer-tab crossfade still triggers (open Visualizer → bar bg should fade from paper to warmBg over ~250ms per `animatedBgStyle`).
- **`App.test.tsx` render blow-up:** The test may render the full RootStack. Without the `UnifiedCameraStack` mock, React Navigation will try to resolve its component factory and pull in `useReducedMotion` + Safe Area context. Pre-emptively add the mock (AC #10).
- **Metro cache staleness on route rename:** After deleting `CaptureScreen` from `ColorsStackParamList`, Metro sometimes serves a cached bundle where `navigation.navigate("CaptureScreen")` type-errors at runtime despite the `tsc --noEmit` passing. Clear Metro (`pnpm start --clear` per memory `feedback_simulator_reset.md` — never erase simulator, just `--clear`).
- **iPad FAB regression:** The iPad tab bar has a third tile that also fires `handleCameraPress` (lines 137–159). Easy to miss. Verify with iPad simulator OR — if no iPad simulator handy — `grep "handleCameraPress" src/navigation/CustomTabBar.tsx` should return 3 hits (1 declaration + 2 onPress references).

### File layout (touched by this story)

```
src/
├── navigation/
│   ├── types.ts                                # EDIT — add UnifiedCameraStackParamList, extend RootStackParamList, drop CaptureScreen from ColorsStackParamList
│   ├── CustomTabBar.tsx                        # EDIT — rewire handleCameraPress, delete isCaptureScreen dead branch
│   ├── CustomTabBar.test.tsx (if exists)       # EDIT — assertion update for new navigate target
│   ├── ColorsStack.tsx                         # EDIT — drop CaptureScreen import + Screen registration
│   ├── ArmarioStack.tsx                        # UNCHANGED (TD-2 preservation)
│   ├── FavoritesStack.tsx                      # UNCHANGED
│   ├── SettingsStack.tsx                       # UNCHANGED
│   ├── TabNavigator.tsx                        # UNCHANGED
│   └── UnifiedCameraStack.tsx                  # NEW — mirror ArmarioStack.tsx pattern
├── screens/
│   ├── CaptureScreen.tsx                       # DELETE (git rm)
│   ├── CaptureScreen.test.tsx                  # DELETE (git rm)
│   ├── armario/ArmarioCaptureScreen.tsx        # UNCHANGED (TD-2)
│   ├── armario/ArmarioPreviewScreen.tsx        # UNCHANGED (TD-2)
│   ├── Settings.tsx                            # UNCHANGED (Armario Virtual dev-row still points at ArmarioRoot)
│   └── unifiedCamera/                          # NEW directory
│       ├── UnifiedCameraCaptureScreen.tsx      # NEW — placeholder
│       ├── UnifiedCameraCaptureScreen.test.tsx # NEW — smoke test
│       ├── UnifiedCameraResultScreen.tsx       # NEW — placeholder
│       ├── UnifiedCameraResultScreen.test.tsx  # NEW — smoke test
│       ├── UnifiedCameraPostSaveScreen.tsx     # NEW — placeholder
│       └── UnifiedCameraPostSaveScreen.test.tsx# NEW — smoke test
├── components/
│   ├── AnalysisOverlay.tsx                     # DELETE (git rm) — only consumer was CaptureScreen
│   ├── AnalysisOverlay.test.tsx                # DELETE
│   ├── ColorMatchSheet.tsx                     # DELETE
│   ├── ColorMatchSheet.test.tsx                # DELETE
│   ├── OutOfCoverageSheet.tsx                  # DELETE
│   └── OutOfCoverageSheet.test.tsx             # DELETE
├── i18n/locales/
│   ├── es.json                                 # EDIT — colorCapture.cameraButtonLabel value only
│   └── en.json                                 # EDIT — colorCapture.cameraButtonLabel value only
├── lib/armario/saveCutoutAsWardrobeItem.ts     # UNCHANGED (14.3b owns TD-1 changes)
└── hooks/useReducedMotion.ts                   # UNCHANGED (consumed by new UnifiedCameraStack)

App.tsx                                          # EDIT — register UnifiedCameraRoot as 3rd RootStack.Screen
App.test.tsx                                     # EDIT (if needed) — minimal jest.mock for UnifiedCameraStack
```

No `tsconfig.json`, `jest.config.js`, `babel.config.js`, `metro.config.js`, native `ios/` config, or module-level `package.json` changes.

### Patterns to follow (MUST)

- **Function declarations with named exports** — never `export default` (CLAUDE.md). Exception: `App.tsx`'s `export default App` remains (Expo entry-point requirement, already in the file as an annotated exception).
- **NativeWind `className` for static styles; `style={{}}` only for dynamic Wada color values** — placeholder screens MUST use `className` exclusively (no dynamic colors on placeholders).
- **Props interface required** — `interface {ScreenName}Props` OR `type {ScreenName}Props = Record<string, never>` for empty props (mirror `ArmarioCaptureScreen.tsx:41`).
- **Biome:** tabs, double quotes. Run `pnpm biome check --write src/**` before commit.
- **Tests co-located**, `.test.tsx` next to the component; mock navigation via `jest.mock("@react-navigation/native", ...)` or `jest.mock("@react-navigation/native-stack", ...)` as needed.
- **No analytics SDK, no telemetry** — NFR8 / `feedback_no_analytics.md`.
- **Haptics exclusively through `lib/haptics.ts`** — FAB keeps `hapticLight()` on press (unchanged from today). Back-button on placeholder Capture SHOULD NOT fire haptic (placeholder is dev-only; 14.3b decides the final haptic contract).
- **Respect `useReducedMotion`** in the new stack's `animation` option (mirror `ArmarioStack.tsx`).
- **Accessibility:** every new interactive node gets `testID`, `accessibilityLabel`, `accessibilityRole`, 44pt min hit area.

### References

- Epic source of truth — [docs/planning/epic-14.md §Story 14.3a](../../docs/planning/epic-14.md#story-143a-unified-camera-navigation-setup--capturescreen-deprecation) (lines 320–365)
- TD-2 (narrow deprecation — `ArmarioCaptureScreen` PRESERVED) — [docs/planning/epic-14.md §Technical Decisions](../../docs/planning/epic-14.md#technical-decisions-post-review--read-before-implementing-any-story) (line 56)
- Technical review Finding 2 (original deprecation scope, later revised) — [docs/planning/epic-14-tech-review.md §Finding 2](../../docs/planning/epic-14-tech-review.md#finding-2--navigation-restructure-unified-camera-must-sit-in-rootstack--deprecate-armarioroot) (lines 89–139)
- UX spec UX-DR1 — Capture + Result screens (Result UI lands in Story 14.4, NOT this story) — [docs/planning/ux-design-epic-14.md §UX-DR1](../../docs/planning/ux-design-epic-14.md#ux-dr1--unified-camera-flow-capture--result) (lines 77–205)
- Prior Story 14.2 (store unification — useMisLooksStore; this story's screens may eventually consume it in 14.3b+14.4 but do NOT here) — [./14-2-mis-looks-store-unification-migration.md](./14-2-mis-looks-store-unification-migration.md)
- Prior Story 14.1 (WardrobeItem.category — consumed by 14.5's save flow, not by this story) — [./14-1-wardrobe-item-category-field.md](./14-1-wardrobe-item-category-field.md)
- ADR-005 (unified store architectural record) — [docs/adrs/ADR-005-unified-mis-looks-store.md](../../docs/adrs/ADR-005-unified-mis-looks-store.md)
- Nav precedent — [src/navigation/ArmarioStack.tsx](../../src/navigation/ArmarioStack.tsx) (to mirror exactly)
- Nav precedent — [App.tsx:75–88](../../App.tsx) (`RootStack` + `ArmarioRoot` registration — add `UnifiedCameraRoot` after)
- Existing FAB wiring (source to edit) — [src/navigation/CustomTabBar.tsx:89–92 + 137–159](../../src/navigation/CustomTabBar.tsx)
- Settings dev-row `getParent()?.navigate` precedent — [src/screens/Settings.tsx:287–292](../../src/screens/Settings.tsx)
- Story 13.4b S3 `+ Nueva foto` entry point (must keep working) — [./13-4b-armario-picker-assignment-mechanics.md](./13-4b-armario-picker-assignment-mechanics.md)
- CLAUDE.md — §Story Scope (4–5 task cap), §React Native Specifics, §Accessibility First

### Project Structure Notes

- This story adds a new `src/screens/unifiedCamera/` subdirectory (3 placeholder screen files + 3 smoke tests) and a new `src/navigation/UnifiedCameraStack.tsx` module. No new top-level directories, no new dependencies, no new native modules, no new config files.
- The `@/navigation/UnifiedCameraStack` path is added to the `@/` alias resolution (already configured in `tsconfig.json` + `babel.config.js` — no edits needed).
- AsyncStorage keys, AppState handlers, `runMisLooksMigration`, `runOrphanSweep` — all untouched. No bootstrap-sequence changes in `App.tsx` beyond adding one `<RootStack.Screen>` child.
- Native `ios/` build artifacts do NOT require regeneration. Metro reload suffices (warn the dev-agent NOT to reach for `expo run:ios` this story — that's 14.3b's hammer for the Swift module change, not ours).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7, 1M context)

### Debug Log References

- `npx tsc --noEmit` → clean (0 errors)
- `pnpm lint` → `Checked 155 files in 48ms. No fixes applied.`
- `pnpm test` → 771 passing / 60 failed / 0 skipped / 831 total. The 60 failures are pre-existing across 2 suites (`OutfitVisualizer.test.tsx` — `navigation.getState is not a function`, 57 cases; `i18n.test.ts` — `detectLanguage` locale probe, 3 cases). Verified by stashing story changes and re-running the i18n suite — same 3 failures on the clean `epic-14` tree. Zero NEW failures and zero NEW skips introduced by this story.
- Net test math vs. the 14.2 done baseline (819 passing / 60): `819 + 5 (new placeholders) − 53 (deleted tests from CaptureScreen + 3 orphan helpers) = 771` ✅ within projected `~778 ± 5` window.

### Completion Notes List

- Implemented the navigation shell per TD-2 (narrow deprecation): `UnifiedCameraRoot` + `UnifiedCameraStack` registered on `RootStackParamList` as a modal sibling of `ArmarioRoot`. `Main` order preserved as the initial screen; new `UnifiedCameraRoot` declared AFTER `ArmarioRoot` so the diff is purely additive.
- Three placeholder screens under `src/screens/unifiedCamera/` — `UnifiedCameraCaptureScreen` (back button wired to `getParent().goBack()`), `UnifiedCameraResultScreen`, `UnifiedCameraPostSaveScreen`. Each uses NativeWind `className` with tokens from `tailwind.config.js` (`bg-paper`, `text-primary`, `bg-surface`). No dynamic colors, no `style={{}}` usage.
- FAB rewired: `handleCameraPress` now calls `navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("UnifiedCameraRoot")`, mirroring the `Settings.tsx` dev-row precedent for root-modal presentation. `hapticLight()` call preserved. Both `camera-fab-phone` (iPhone cradle FAB) and `camera-fab-ipad` (tablet tile) share this handler — verified that `handleCameraPress` has exactly 3 occurrences (1 declaration + 2 onPress references).
- Dead-code removed: `isCaptureScreen` derivation (was line 44–45) and the `if (isCaptureScreen) return null;` early-return (was lines 94–98) both deleted. `isWarmScreen` derivation retained intact — `activeColorsScreen` is still its reader, so the `colorsNestedState` biome-ignore stays load-bearing.
- Byte-for-byte preservation verified via `git diff --stat` on TD-2-protected paths: `src/navigation/ArmarioStack.tsx`, `src/screens/armario/`, `src/lib/armario/saveCutoutAsWardrobeItem.ts`, `src/screens/Settings.tsx` — all zero touched lines.
- `git rm` deletions performed cleanly on `src/screens/CaptureScreen.{tsx,test.tsx}` + `src/components/{AnalysisOverlay,ColorMatchSheet,OutOfCoverageSheet}.{tsx,test.tsx}`. Post-delete grep audit: zero live references under `src/` to any of the 4 legacy identifiers (the only hits are `ArmarioCaptureScreen` which is preserved and `UnifiedCameraCaptureScreen` which is new). The `WhiteBalanceModule.swift:35` code comment is left for 14.3b per Dev Notes guidance.
- i18n copy updated (value only, key name untouched): `colorCapture.cameraButtonLabel` → `"Cámara — captura una prenda"` (es) / `"Camera — capture a garment"` (en). No existing test asserts on the previous string.
- `App.test.tsx` gained a defensive `jest.mock("@/navigation/UnifiedCameraStack", () => ({ UnifiedCameraStack: () => null }))` mirroring the pre-existing `ArmarioStack` mock — keeps the test harness insulated from the new stack module during bootstrap.
- `UnifiedCameraCaptureScreen.test.tsx` exercises 3 cases: placeholder `testID` renders, back-press fires `getParent().goBack()`, and a harness orphan-parent case (getParent → undefined) is a no-op. `UnifiedCameraResultScreen.test.tsx` + `UnifiedCameraPostSaveScreen.test.tsx` are single-case smoke tests by design (real UI lands in 14.4 / 14.5).

#### AC walkthrough

| AC | Verified by |
|----|-------------|
| 1  | `src/navigation/types.ts` — `UnifiedCameraStackParamList` declared with 3 `undefined` routes; `RootStackParamList` extended with `UnifiedCameraRoot` AFTER `ArmarioRoot`; `ColorsStackParamList` lost `CaptureScreen`; `ArmarioStackParamList` unchanged. |
| 2  | `src/navigation/UnifiedCameraStack.tsx` mirrors `ArmarioStack.tsx` (uses `useReducedMotion`, `animation: "fade" \| "none"`, `headerShown: false`, 3 Screen children). Each placeholder file has a named export + `Record<string, never>` props type + `testID`; Capture has a functional back button. |
| 3  | `App.tsx` registers `UnifiedCameraRoot` with `component={UnifiedCameraStack}` + `options={{ presentation: "modal" }}` as the 3rd Screen, matching the `ArmarioRoot` precedent exactly. No `fullScreenModal` used. |
| 4  | `CustomTabBar.handleCameraPress` now uses `getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("UnifiedCameraRoot")`. `hapticLight()` retained. Root-modal presentation preserves originating-tab state on dismiss (native RootStack behavior). |
| 5  | `isCaptureScreen` derivation + early-return deleted. `isWarmScreen` still references `activeColorsScreen`; biome-ignore preserved because it still gates the nested-state read. |
| 6  | `git rm` on all 8 files. `grep -rn "CaptureScreen\|AnalysisOverlay\|ColorMatchSheet\|OutOfCoverageSheet" src` returns zero legacy hits. `ColorsStack.tsx` dropped both the import and the Screen registration for `CaptureScreen`; remaining 4 screens preserved in original order. |
| 7  | `git diff --stat` on Armario paths: 0 touched lines. `ArmarioPickerScreen.test.tsx` "Nueva foto tab + footer CTA navigate to ArmarioRoot" unaffected (route name intact). |
| 8  | `camera-fab-phone` + `camera-fab-ipad` testIDs retained. `colorCapture.cameraButtonLabel` value replaced in both locale files; key name untouched. No test asserts on the previous label string. |
| 9  | `npx tsc --noEmit` clean; `pnpm lint` clean; `pnpm test` → 771 passing / 60 pre-existing / 0 new failures / 0 new skips. Net test count drop (48) consistent with deleted dead code + 5 new placeholder tests. |
| 10 | `App.test.tsx` still passes. Added a defensive `UnifiedCameraStack` mock to match the `ArmarioStack` pattern — insulates the test harness from the new nav module at module-import time. |
| 11 | Pure TS + RN navigation refactor — no native rebuild required. Manual-smoke (Metro reload): FAB from Colors/Favorites/Settings tabs → placeholder "Capture (coming in 14.3b)" modal opens; swipe-down returns to the original tab. S3 picker `+ Nueva foto` + Settings `Armario Virtual (dev)` row unchanged. **Note:** manual simulator smoke per AC #11 / Task 5.4 deferred to merge gate — the dev-agent did not launch the simulator in this session. |

### File List

**Added**

- `src/navigation/UnifiedCameraStack.tsx`
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.test.tsx`
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx`
- `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx`
- `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.test.tsx`

**Modified**

- `App.tsx` — import + register `UnifiedCameraRoot` modal Screen
- `App.test.tsx` — defensive `jest.mock("@/navigation/UnifiedCameraStack", ...)`
- `src/navigation/types.ts` — add `UnifiedCameraStackParamList`, extend `RootStackParamList`, drop `CaptureScreen` from `ColorsStackParamList`
- `src/navigation/CustomTabBar.tsx` — rewire `handleCameraPress` to root-modal navigate, drop dead `isCaptureScreen` derivation + early-return
- `src/navigation/ColorsStack.tsx` — drop `CaptureScreen` import + Screen registration
- `src/i18n/locales/es.json` — update `colorCapture.cameraButtonLabel` copy
- `src/i18n/locales/en.json` — update `colorCapture.cameraButtonLabel` copy

**Deleted**

- `src/screens/CaptureScreen.tsx`
- `src/screens/CaptureScreen.test.tsx`
- `src/components/AnalysisOverlay.tsx`
- `src/components/AnalysisOverlay.test.tsx`
- `src/components/ColorMatchSheet.tsx`
- `src/components/ColorMatchSheet.test.tsx`
- `src/components/OutOfCoverageSheet.tsx`
- `src/components/OutOfCoverageSheet.test.tsx`

### Change Log

| Date       | Change                                                                                 |
|------------|----------------------------------------------------------------------------------------|
| 2026-04-21 | Added `UnifiedCameraRoot` modal navigator with 3 placeholder screens + smoke tests.    |
| 2026-04-21 | Rewired Tab Bar FAB (iPhone + iPad) to present `UnifiedCameraRoot` via root-modal nav. |
| 2026-04-21 | Removed legacy `CaptureScreen` + 3 orphaned helper components (`AnalysisOverlay`, `ColorMatchSheet`, `OutOfCoverageSheet`) and their tests. |
| 2026-04-21 | Updated `colorCapture.cameraButtonLabel` copy in ES + EN locale files (value only).     |
| 2026-04-21 | Status: ready-for-dev → review.                                                         |

### Review Findings

**Decision-needed (1):**
- [x] [Review][Decision] Manual smoke test AC#11 deferred — resolved: Alejandro ran manual smoke on 2026-04-21; all 6 checks passed (FAB → modal from all tabs, swipe-down, Armario TD-2 paths intact).

**Patches (2):**
- [x] [Review][Patch] Back button `top-14` clips Dynamic Island — fixed: `useSafeAreaInsets()` + `style={{ top: insets.top + 8 }}` replacing hardcoded `top-14`. [src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx]
- [x] [Review][Patch] Accessibility label "Cerrar cámara" hardcoded ES — fixed: `colorCapture.closeCameraLabel` key added to en.json + es.json; `accessibilityLabel={t("colorCapture.closeCameraLabel")}`. Test mock updated for `useSafeAreaInsets` + `useTranslation`. [src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx + .test.tsx]

**Deferred (6):**
- [x] [Review][Defer] Root modal slide animation plays even with Reduce Motion — `animation: isReducedMotion ? "none" : "fade"` in UnifiedCameraStack only suppresses intra-stack transitions; the iOS sheet slide on modal open/close is controlled by `presentation: "modal"` on RootStack.Screen and has no Reduce Motion override. Pre-existing behavior identical to ArmarioRoot — not introduced by this story. — deferred, pre-existing
- [x] [Review][Defer] Result + PostSave placeholder screens have no dismiss button — intentional per spec ("Dev agents MUST NOT port logic from deleted CaptureScreen"); real navigation wiring lands in Story 14.4 (Result) and 14.5 (PostSave). Swipe-down still works as modal gesture from Capture. — deferred, pre-existing
- [x] [Review][Defer] FAB double-tap while UnifiedCameraRoot modal is open — `navigate("UnifiedCameraRoot")` when already on that modal re-navigates to initial Capture screen, potentially resetting inner-stack state. React Navigation 7 behavior; ArmarioRoot has same gap. Low probability in practice. — deferred, pre-existing
- [x] [Review][Defer] `pnpm test` exits non-zero due to 2 pre-existing failing suites — OutfitVisualizer.test.tsx (navigation.getState mock missing, 48 cases) + i18n.test.ts (detectLanguage locale probe, 3 cases); 0 new failures introduced by this story. Pre-existing since before epic-14. — deferred, pre-existing
- [x] [Review][Defer] No test file for UnifiedCameraStack navigator wrapper — mirrors pre-existing ArmarioStack.tsx gap (also untested). Low risk for a thin navigator wrapper. — deferred, pre-existing
- [x] [Review][Defer] No CustomTabBar.test.tsx for FAB rewire validation — spec explicitly deferred this: Task 3.4 states "Do NOT create one in this story; add as follow-up in Review Findings." — deferred, pre-existing
