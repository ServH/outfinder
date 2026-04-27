# Story 15.5: A1 — Visualizer paper-cream background + Aureola tune

Status: done

## Story

As **a user opening `OutfitVisualizer` from any entry point (Combinations, FavoritesList, ColorHome, BrowseAllColors)**,
I want **the screen canvas to read as the same paper-cream surface used by the rest of the app (`wadaTokens.bgPaper` `#fafaf8`) instead of the warm sand-beige (`wadaTokens.warmBg` `#ebe5da`) it inherits from the Epic 11 era — with the colored `Aureola` retuned so the halo behind the silhouettes still feels like a halo on the lighter canvas (not a faint smudge), without overpowering the tinted Wada garments**,
so that **the Visualizer feels visually coherent with `ColorHome`, `FavoritesList`, `BrowseAllColors`, the Mis Looks tab, the Armario flows, and the not-found branch of this very screen (line 202 already uses `bg-paper`) per Epic 15 DEC-1 ("Visualizer permanece — lo pulimos: background paper-cream + onboarding nuevo") and FR10/FR11 (paper-cream parent + Aureola tune for contrast on the new canvas)**.

## Acceptance Criteria

1. **Given** Epic 15 FR10 ("El background del `OutfitVisualizer` usa el token `wadaTokens.bgPaper` (paper cream global), no `warmBg`") and DEC-1 ("Visualizer permanece (NO se mata)"), **When** Story 15.5 is implemented, **Then** `src/screens/OutfitVisualizer.tsx`:
    - At line 220, the inline style `style={{ backgroundColor: wadaTokens.warmBg }}` on the root return `<View>` is changed to `style={{ backgroundColor: wadaTokens.bgPaper }}`. The `wadaTokens` import (line 37) is preserved (still used for `textPrimary`, `textTertiary`, `wadaMuted` elsewhere in the file).
    - At line 252, the JSX render `<WarmBackground />` is REMOVED entirely (delete the line). The `WarmBackground` import (line 23 — `import { WarmBackground } from "@/components/WarmBackground";`) is REMOVED entirely. Rationale: `WarmBackground` is a `Skia` `<Canvas>` painting an absolute-positioned warm radial gradient (`#f0ece4` base + radial center `#f5efe6 → #f0ece4 → #ebe5da` per `src/components/WarmBackground.tsx`) — leaving it in the tree while changing the parent `backgroundColor` to `bgPaper` would visually retain the warm look (the absolute Canvas paints OVER the parent), defeating FR10. The two changes (token swap + WarmBackground removal) MUST ship together; partial application = visual no-op.
    - The not-found branch at line 202 (`className="flex-1 items-center justify-center bg-paper"`) is UNTOUCHED — it already uses the paper-cream Tailwind utility, and now matches the happy-path branch's token-driven `wadaTokens.bgPaper`.
    - All other JSX, props, hook calls, handlers, and styling logic in `OutfitVisualizer.tsx` remain unchanged. NO refactoring beyond the two anchored deletions and the one-token swap. Story 15.4 (just merged at `baa31aa`) places the `<CoachMarkOverlay/>` at the END of the root `<View>` — DO NOT touch it. The bottom CTA at line 341 uses `slots[0].color.hex` as backgroundColor (Aureola color per UX-DR6) — DO NOT touch it.

2. **Given** Epic 15 FR11 ("La `Aureola` se ajusta para mantener contraste visible con el nuevo background claro (gradient opacity / colors revisados)") and the existing `Aureola` contract (`src/components/Aureola.tsx:12-32` — single `Skia` `<RadialGradient>` `c=center r=width*0.5 colors=[<hex>18, <hex>08, transparent]`), **When** Story 15.5 is implemented, **Then** `src/components/Aureola.tsx`:
    - The `RadialGradient` `colors` array changes from `[`${hex}18`, `${hex}08`, "transparent"]` to `[`${hex}40`, `${hex}1a`, "transparent"]` — i.e. the inner stop alpha rises from `0x18` (24/255 ≈ 9%) to `0x40` (64/255 ≈ 25%), and the mid stop alpha rises from `0x08` (8/255 ≈ 3%) to `0x1a` (26/255 ≈ 10%). Outer "transparent" stop is unchanged.
    - These specific values are the STARTING POINT — Alejandro validates visually on iPhone 16 Pro across at least 3 representative Wada combos (one with high-luminance pastel hex like `#f0d8a8`, one with mid-tone hex like `#c44a37`, one with low-luminance hex like `#1f2347`). If any of the three reads as "too strong" (halo competing with tinted garments) or "too weak" (halo invisible), Alejandro can ask for a one-line follow-up to bump the alpha pair (e.g. `0x33`/`0x14` if too strong; `0x4d`/`0x20` if too weak). The `0x40`/`0x1a` pair is the calibrated default — it preserves the soft-glow character (no hard edge) while restoring perceived presence on `#fafaf8` (the alpha gain compensates for the ~6% lower luminance contrast between `bgPaper` and a tinted halo vs. `warmBg` and the same halo).
    - `r=width * 0.5` (radius), `c=vec(width / 2, height / 2)` (center), `AUREOLA_TOP_OFFSET = 40` (vertical offset constant), the `<Canvas>` `position: "absolute"`/`alignSelf: "center"` style, and the `accessibilityLabel="Color aureola"` are ALL UNCHANGED. Only the two alpha bytes inside the `colors[]` array literal change.
    - The `AureolaProps` interface (`hex: string; width: number; height: number;`) is UNCHANGED — no new props (no `intensity`, `alpha`, `mode`). Adding props would force every caller to pass them and would invent abstractions for a hypothetical future variant per CLAUDE.md "Don't add features beyond what the task requires".
    - The doc comment at line 3 (`/** Vertical offset to center aureola behind the outfit card, accounting for WadaHeader height */`) is preserved. NO new comments narrating the alpha tune — the spec rationale lives in this story file and the git commit message, not in the source.

3. **Given** that `WarmBackground` has multiple consumers across runtime + tests + sibling navigation logic (verified via `git grep -n "WarmBackground\|\"Warm background\"" src/`), **When** Story 15.5 is implemented, **Then** ALL of the following deletions ship together (partial application = test failure):
    - **Component file**: `src/components/WarmBackground.tsx` is DELETED (entire 22-line file). Per CLAUDE.md "If you are certain that something is unused, you can delete it completely." After this story, `git grep -n "WarmBackground" src/` returns ZERO matches in `src/`.
    - **Component-level test**: in `src/components/presentation.test.tsx`, delete the `import { WarmBackground } from "./WarmBackground";` at line 6 + the entire `describe("WarmBackground", () => { ... })` block at lines 110-123 (14 lines including surrounding blank line). The other three describe blocks (`WadaHeader` line 8, `MiniPaletteStrip` line 29, `Aureola` line 90) are UNTOUCHED.
    - **Screen-level test assertions**: in `src/screens/OutfitVisualizer.test.tsx`, the WarmBackground component is asserted in TWO places that the dev MUST remove (otherwise the targeted regression run fails the moment Task 1 deletes the JSX):
        - **Line 231-243** — entire `it("renders warm background", () => { … expect(screen.getByLabelText("Warm background")).toBeTruthy(); });` test case (13 lines including the close brace and surrounding blank line). Delete the entire test case — the WarmBackground component no longer exists, the test's premise is gone. The siblings `it("renders Outfit card")` at line 215 and `it("fires hapticMedium when tapping a garment to select")` at line 245 stay UNTOUCHED.
        - **Line 685** — single line `expect(screen.getByLabelText("Warm background")).toBeTruthy();` inside the `it("renders all presentation components for 4-color combo", () => { … })` test that asserts a bundle of presentation components (Aureola, OutfitCard, MiniPaletteStrip, WadaHeader). DELETE only this single line; the surrounding `expect(... "Color aureola")` (line 686), `expect(... "Outfit card")` (line 687), `expect(... "Outfit color palette")` (line 688), and `expect(... "四色")` (line 689) stay UNTOUCHED — those components ARE still rendered.
    - **Sibling navigation logic**: `src/navigation/CustomTabBar.tsx` currently runs an active-screen-aware crossfade (lines 36-61) that animates the tab bar `backgroundColor` between `wadaTokens.bgPaper` and `wadaTokens.warmBg` based on `isWarmScreen = isColorsActive && activeColorsScreen === "OutfitVisualizer"` — i.e. the tab bar crossfades to warm sand-beige specifically when the Visualizer is mounted. After this story, the Visualizer canvas is `bgPaper`; if the crossfade stays, the tab bar would visibly mismatch the screen for ~250ms on transition AND settle on `warmBg` while the screen sits on `bgPaper`. The crossfade MUST collapse to a no-op. Specifically:
        - Delete the lines 39-45 (the `colorsNestedState` derivation + `activeColorsScreen` + `isWarmScreen` consts) — no consumer remains.
        - Delete the lines 51-61 (the `bgProgress` shared value + `useEffect` that drives it + the `animatedBgStyle` `useAnimatedStyle` block) — no consumer remains.
        - Find every JSX consumer of `animatedBgStyle` (likely on the tab bar's outer `<Animated.View>`). Replace `style={animatedBgStyle}` with `style={{ backgroundColor: wadaTokens.bgPaper }}` (or with `className="bg-paper"` if the surrounding View uses className for styling — match the file's existing convention; the dev should grep for `animatedBgStyle` to find the consumer site and adapt).
        - Update the comments: line 37 (`// matches each screen: OutfitVisualizer uses warmBg, all others use bgPaper.`) and line 188 (`// non-solid-bg content (Combinations white cards, Visualizer warmBg`) — both reference the obsolete warm-bg branch. Delete or rewrite to reflect that the tab bar is now uniformly paper-cream across the ColorsStack.
        - Remove the now-unused imports if any of `useSharedValue`, `withTiming`, `useAnimatedStyle`, `interpolateColor` from `react-native-reanimated` is no longer referenced anywhere in the file (TypeScript / Biome will flag them).
        - Run `pnpm test src/navigation/CustomTabBar.test.tsx` (if it exists) to confirm no test asserts the warm-screen crossfade. If a test does assert the crossfade behavior, delete that specific test — the crossfade has no remaining purpose. NOTE: the `project_tabbar_cradle_layout.md` memory entry (referenced in MEMORY.md) may need follow-up; out-of-scope to update memory in this story.
    - **Token NOT removed**: `wadaTokens.warmBg` stays exported from `src/styles/theme.ts:23` and asserted at `src/styles/theme.test.ts:26` (`expect(wadaTokens.warmBg).toBe("#ebe5da");`). DO NOT remove the token, the test, or the Tailwind alias `"warm-bg"` at `tailwind.config.js:25`. Reasons: (a) removal triggers ripple work outside the story's scope (the test, the Tailwind config, every commit-history grep), (b) the Wada palette aesthetic value of having the warm sand tone available for future surfaces is non-zero, (c) deleting unused tokens is a generic cleanup pass that belongs to the Epic 15 retro `update-context`/refactor track, NOT to a focused 4-task A1 story. After this story the only remaining runtime `warmBg` consumer is the test assertion — which is fine; the token is documented + asserted but not actively rendered.
    - **Stale doc references**: `docs/project-context.md` lines 98 + 190, and `docs/archive/project-context-distillate.md` lines 42 + 98 are NOT touched in this story — they will be cleaned up in the Epic 15 retrospective's `update-context` pass. DO NOT cleanup the doc here — that scope creep would re-open the Epic 14 doc lifecycle.
    - DO NOT mark `WarmBackground` as `@deprecated` and keep the file. DO NOT export it as a re-export from a barrel "for future use". DO NOT add a `// removed in Story 15.5` placeholder. Hard delete only — per `CLAUDE.md` and `feedback_no_patches.md`.

4. **Given** Epic 15 NFR3 ("`npx tsc --noEmit`, `pnpm lint`, `pnpm test` verde. Zero new test-skips") and NFR4 ("Zero regresiones en flujo principal cámara FAB, Visualizer (excepto cambios planificados), y Mis Looks"), **When** Story 15.5 is implemented, **Then** ALL of the following CI gates pass on the story branch BEFORE handoff:
    - `npx tsc --noEmit`: zero NEW errors. Pre-existing baseline on `epic-15` HEAD `baa31aa` is **0 errors** (Story 15.4 retro confirmed `tsc 0`; Story 15.6 also confirmed; the original "2 baseline" cited in the 15.1 spec was cleaned by 15.1 itself). Capture pre-count, confirm post-count == 0.
    - `pnpm lint`: capture pre-baseline. Per Story 15.4 retro, baseline on `epic-15` HEAD `baa31aa` is **2 errors** in `src/screens/FavoritesList.test.tsx` + `src/screens/OutfitVisualizer.tsx` (Biome format issues, pre-existing, out-of-scope per `feedback_no_patches.md`). NOTE: this story TOUCHES `src/screens/OutfitVisualizer.tsx` (the parent backgroundColor + WarmBackground removal) — the pre-existing `OutfitVisualizer.tsx` format error was on the `handleMakeMine` block per the 15.4 retro and is NOT in the lines this story modifies. If `pnpm exec biome check --write` auto-fixes that pre-existing format error as a side-effect, accept it as a net win BUT keep the diff scoped: do NOT piggyback unrelated whitespace cleanups (`git checkout -p` to revert any auto-formatting outside the new diff regions). Post-story lint count: should be `≤ 2` (1 if the auto-fix happens, 2 if not). Either is acceptable; what's NOT acceptable is `> 2` (a NEW lint error introduced by this story).
    - `pnpm test`: green with the test count DECREASING by exactly **3** (the two `WarmBackground` describe-block test cases deleted from `presentation.test.tsx` + 1 `it("renders warm background", …)` test deleted from `OutfitVisualizer.test.tsx:231-243` per AC #3). The single-line deletion at `OutfitVisualizer.test.tsx:685` is INSIDE an existing `it(...)` block that still passes (asserts the bundle of remaining presentation components), so it does NOT change the test count — only the assertion count inside that one test. Net delta: **-3 tests**. ZERO new test-skips. Pre-baseline per 15.4 retro: **964 passing / 3 pre-existing failing / 967 total**. Post-baseline: **961 passing / 3 pre-existing failing / 964 total** (delta `-3` net). The 3 pre-existing failures are in `src/i18n/__tests__/i18n.test.ts:131-134` (mockLocale `es-ES` returning `en` — pre-existing per 15.3/15.4 retros). DO NOT touch them.
    - Targeted regression: `pnpm test src/screens/OutfitVisualizer.test.tsx` post-Task-1+3 runs **53 tests** (the original 54 minus the 1 deleted `renders warm background` test) and they ALL pass. Self-check: `grep -nE 'WarmBackground|"Warm background"' src/screens/OutfitVisualizer.test.tsx` MUST return zero matches after the deletions. The Visualizer test file does NOT assert anything about the parent View's `backgroundColor` (verified via `grep -nE 'wadaTokens\.(warmBg|bgPaper)|backgroundColor:' src/screens/OutfitVisualizer.test.tsx` — only one match on line 857 and that's the CTA backgroundColor `red.hex`, not the screen's). So no other Visualizer-test regressions are expected.
    - Sibling regression: `pnpm test src/navigation` (or `pnpm test src/navigation/CustomTabBar.test.tsx` if the file exists — `find src/navigation -name "*.test.*"` to confirm) runs UNCHANGED post-Task 5. If the test file does NOT exist, capture this as part of the AC #4 verification log so the reviewer knows there's no automated coverage of the tab bar crossfade collapse — visual smoke (AC #5) is the actual verification.
    - `grep -rn "test\.skip\|it\.skip\|xit(" src/ | wc -l` count is unchanged from baseline (no new skips).
    - Optional but encouraged: targeted `pnpm test src/components/presentation.test.tsx` runs the remaining describe blocks (`WadaHeader` 3 tests + `MiniPaletteStrip` 5 tests + `Aureola` 3 tests = 11 cases) and they ALL pass UNCHANGED — the Aureola tests at lines 90-108 only assert that the canvas mounts (`getByLabelText("Color aureola")`) and the dimensions style prop matches (`width: 200, height: 300`); they do NOT assert the gradient `colors` array, so the alpha tune does NOT break them.

5. **Given** CLAUDE.md "For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete" + Epic 15 spec "Risk: subjetivo. Requiere visual review de Alejandro tras cambio. Si Aureola queda mal, posible iteración" (line 199) + the calibration nature of FR11, **When** Story 15.5 is implemented, **Then** an on-device visual smoke step is REQUIRED before the story is marked done. The dev agent CANNOT verify FR11 ("Aureola contrast visible con nuevo background claro") via tests alone — the alpha values are a perceptual tune, not a measurable assertion. The smoke checklist:
    - Boot iPhone 16 Pro simulator (or device), launch Outfinder, navigate to `ColorHome → tap any color → tap a combination → OutfitVisualizer opens`.
    - Observe: parent canvas reads as paper-cream (`#fafaf8` — same surface as `ColorHome`), NOT sand-beige. The `Aureola` halo is visible behind the silhouettes but does NOT compete with the tinted Wada garments (the silhouettes still read as the foreground subject).
    - Repeat the smoke for AT LEAST 3 representative Wada combos covering luminance range: one bright/pastel first-slot hex, one mid-tone, one dark/saturated. Suggested combos to try (any of these from `src/data/combinations`): a "light" combo where slots[0].hex is `#e6c8a0`-ish, a "vibrant" combo around `#c44a37`, a "deep" combo around `#1f2347`. The halo MUST remain perceptible across all three without overpowering any of them.
    - Switch language to EN, repeat one combo to confirm no copy regressions (Story 15.6 + 15.4 strings still render correctly on the new canvas — the change is visual only, no string movement).
    - Verify the not-found branch by navigating to a deleted/invalid combination URL (or temporarily mock `getCombination` to return undefined via dev tooling) and confirm `bg-paper` still reads coherent — no change expected, this is a sanity check that the two branches now match.
    - If Alejandro deems the Aureola "too weak" or "too strong" on visual smoke, the dev agent applies a one-line tune to `Aureola.tsx:28` colors array (e.g. step alpha pair to `0x4d`/`0x20` for stronger, `0x33`/`0x14` for softer) and re-smokes. NO test changes needed — alpha values are not asserted.
    - On-device smoke approval is recorded in the `Completion Notes List` and `Change Log` of this story file (date + iPhone model + locales tested + final alpha pair shipped).

## Tasks / Subtasks

- [x] **Task 1 — Swap parent View backgroundColor + remove `WarmBackground` from `OutfitVisualizer.tsx`** (AC: #1, #3 partial)
  - [x] In `src/screens/OutfitVisualizer.tsx`, change line 220 `style={{ backgroundColor: wadaTokens.warmBg }}` → `style={{ backgroundColor: wadaTokens.bgPaper }}`. Confirm `wadaTokens` import at line 37 stays (other tokens still used in this file).
  - [x] Delete line 252 `<WarmBackground />` (the JSX render call). The surrounding `<View className="flex-1">` at line 251 stays; `<View className="flex-1 items-center justify-center py-4">` at line 253 stays.
  - [x] Delete line 23 `import { WarmBackground } from "@/components/WarmBackground";`. After this edit, run `git grep "WarmBackground" src/screens/OutfitVisualizer.tsx` — must return zero matches.
  - [x] Run `npx tsc --noEmit` to confirm no broken import references or type regressions.
  - [x] Visually inspect the diff via `git diff src/screens/OutfitVisualizer.tsx` — should be exactly 3 line touches (1 import deletion, 1 token swap, 1 JSX deletion). NO other changes — if Biome auto-formats other lines on save/lint, revert them via `git checkout -p` to keep diff scoped per `feedback_no_patches.md`.

- [x] **Task 2 — Tune `Aureola` gradient alpha** (AC: #2)
  - [x] In `src/components/Aureola.tsx:28`, change `colors={[`${hex}18`, `${hex}08`, "transparent"]}` → `colors={[`${hex}40`, `${hex}1a`, "transparent"]}`.
  - [x] Verify NO other line in `Aureola.tsx` is touched: `AUREOLA_TOP_OFFSET` (line 4) unchanged, `AureolaProps` interface (lines 6-10) unchanged, `<Canvas>` style (lines 14-22) unchanged, `<Fill>` wrapper (line 24) unchanged, `<RadialGradient>` `c` and `r` props (lines 26-27) unchanged.
  - [x] Confirm `git diff src/components/Aureola.tsx` shows exactly 1 line touch (the `colors` array literal).

- [x] **Task 3 — Delete `WarmBackground` component + all asserting tests** (AC: #3)
  - [x] Delete the file `src/components/WarmBackground.tsx` entirely (`git rm src/components/WarmBackground.tsx` or `rm` then `git add -A`).
  - [x] In `src/components/presentation.test.tsx`, delete the import `import { WarmBackground } from "./WarmBackground";` at line 6, then delete the entire `describe("WarmBackground", () => { ... })` block at lines 110-123 (14 lines including close brace + surrounding blank line). Verify 3 describe blocks remain: `WadaHeader`, `MiniPaletteStrip`, `Aureola`.
  - [x] In `src/screens/OutfitVisualizer.test.tsx`, delete the entire `it("renders warm background", () => { ... });` test case at lines 231-243 (13 lines — the `it(...)` opens at 231 and closes at 243). Sibling `it("…Outfit card")` at line 215 and `it("fires hapticMedium…")` at line 245 stay UNTOUCHED.
  - [x] In the same file, delete the SINGLE LINE `expect(screen.getByLabelText("Warm background")).toBeTruthy();` at line 685. The 4 surrounding `expect(...)` calls (Color aureola, Outfit card, Outfit color palette, the `四色` text) inside that test stay UNTOUCHED — those components still render.
  - [x] Run `grep -nE 'WarmBackground|"Warm background"' src/` — must return ZERO matches. If any match remains, fix BEFORE moving to Task 4.
  - [x] Run `grep -n "WarmBackground" docs/` — expect 2 matches in `docs/project-context.md` (lines 98 + 190) and 2 matches in `docs/archive/project-context-distillate.md` (lines 42 + 98). DO NOT modify these docs in this story (out-of-scope; will be cleaned in Epic 15 retro `update-context` pass).

- [x] **Task 4 — Collapse `CustomTabBar` warm-screen crossfade** (AC: #3 — sibling navigation logic bullet)
  - [x] In `src/navigation/CustomTabBar.tsx`, delete lines 39-45 (the `colorsNestedState` derivation, `activeColorsScreen` const, `isWarmScreen` const). All three are dead after this story — the only use of `isWarmScreen` is the crossfade we're collapsing.
  - [x] Delete lines 51-61 (the `bgProgress` `useSharedValue`, the `useEffect` that drives it via `withTiming`, the `animatedBgStyle` `useAnimatedStyle` block).
  - [x] At line 210 (the JSX consumer of `animatedBgStyle` inside the phone-branch `<Animated.View>` style array), replace `animatedBgStyle` with a static style object: `{ backgroundColor: wadaTokens.bgPaper }`. The surrounding style array structure stays — only the second element changes from a worklet-derived animated style to a plain object.
  - [x] Consider downgrading `<Animated.View>` (line 201) to `<View>` since no animated style remains on it — but ONLY if no OTHER `Animated.*` API on that node is in play (grep the file for other Reanimated usage on the same node first). If unsure, leave as `<Animated.View>` with the static style; it's functionally equivalent and avoids a wider import diff.
  - [x] Update or delete the now-stale comments: line 36-37 (`// Detect the active screen inside the ColorsStack so the bar background \n // matches each screen: OutfitVisualizer uses warmBg, all others use bgPaper.`) — DELETE entirely. Line 47-50 (the 4-line comment about crossfade ~250ms) — DELETE entirely. Line 188 (`// non-solid-bg content (Combinations white cards, Visualizer warmBg`) — verify post-edit context and either delete the `Visualizer warmBg` mention or rewrite the comment to drop it; keep any unrelated content of that comment intact.
  - [x] Remove now-unused Reanimated imports: run `grep -nE "useSharedValue|withTiming|useAnimatedStyle|interpolateColor" src/navigation/CustomTabBar.tsx` — if zero matches remain, drop those identifiers from the `from "react-native-reanimated"` import line. If `Animated.View` is preserved (previous bullet), keep the `Animated` default import. Biome's `noUnusedImports` will flag any miss.
  - [x] `find src/navigation -name "*.test.*"` — if a CustomTabBar test exists and asserts the warm-screen crossfade, delete that specific test (the crossfade no longer exists). If no test file exists, no action — visual smoke (Task 5) is the verification.
  - [x] Confirm `git diff src/navigation/CustomTabBar.tsx` is scoped to: removed crossfade derivation + animation block + style consumer swap + comment cleanup + import trim. NO changes to tab press handlers, FAB cradle layout, iPad branch, accessibility props, or anything else.

- [x] **Task 5 — CI gates + on-device visual smoke + AC verification** (AC: #4, #5)
  - [x] Capture pre-baselines on the story branch (`story/15-5-visualizer-paper-cream-background` off `epic-15` HEAD `baa31aa`): `npx tsc --noEmit` → expect 0 errors. `pnpm lint` → expect 2 pre-existing errors (FavoritesList.test.tsx + OutfitVisualizer.tsx Biome format). `pnpm test` → expect 964/3/967.
  - [x] After Tasks 1-4, run the same 3 commands. Expected post: `tsc` 0 (UNCHANGED), `lint` ≤ 2 (UNCHANGED, or -1 if Biome auto-fixed the pre-existing OutfitVisualizer format outside the story diff), `test` **961/3/964** (delta `-3` net — 2 WarmBackground describe-block tests in `presentation.test.tsx` + 1 `renders warm background` test case in `OutfitVisualizer.test.tsx`). Skips count UNCHANGED.
  - [x] Run targeted `pnpm test src/screens/OutfitVisualizer.test.tsx` — **52 tests pass** (53 pre - 1 deleted; spec said 53/54 — actual baseline was 53). Self-check: `grep -nE 'WarmBackground|"Warm background"' src/screens/OutfitVisualizer.test.tsx` returns ZERO matches.
  - [x] Run targeted `pnpm test src/components/presentation.test.tsx` — **11 tests pass** (3 WadaHeader + 5 MiniPaletteStrip + 3 Aureola, post-deletion of the 2 WarmBackground tests).
  - [x] Run targeted `pnpm test src/components/OutfitCard.test.tsx` — all 18 tests pass UNCHANGED (Story 15.4's permanent pulse refactor + structural test still valid; this story does not touch OutfitCard). [Spec said 19; actual baseline is 18.]
  - [x] If a CustomTabBar test file exists: run it; expect either UNCHANGED (no warm-screen-specific assertions) or `-N` net (whatever the deleted assertions sum to — record the delta in Completion Notes). [No test file exists — `find src/navigation -name "*.test.*"` returns empty; visual smoke is the verification.]
  - [x] On-device visual smoke per AC #5 — APPROVED by Alejandro on 2026-04-27 on iPhone 16 Pro across ES + EN locales and ≥3 luminance-spread Wada combos. Aureola halo perceptible without overpowering tinted garments on `bgPaper` canvas; tab bar transition Combinations ↔ Visualizer stays paper-cream throughout (no warm flash). Final Aureola alpha pair shipped: **`0x40`/`0x1a`** (calibrated default — no tune needed).
  - [x] AC verification (point-by-point): AC #1 ✓ (1 token swap + 1 import delete + 1 JSX delete in OutfitVisualizer.tsx). AC #2 ✓ (1 colors-array tune in Aureola.tsx, no other props/comments changed). AC #3 ✓ (WarmBackground.tsx deleted; presentation.test.tsx loses 1 import + 1 describe; OutfitVisualizer.test.tsx loses 1 it-block + 1 inner expect; CustomTabBar.tsx warm-screen crossfade collapsed; `git grep WarmBackground src/` returns 0; `wadaTokens.warmBg` token + Tailwind alias + theme.test.ts assertion preserved). AC #4 ✓ (tsc/lint/test deltas exact; no new skips; targeted regressions clean). AC #5 ✓ on-device smoke approved by Alejandro 2026-04-27 (iPhone 16 Pro, ES+EN, ≥3 luminance-spread combos, tab bar transition clean; final alpha `0x40`/`0x1a`).
  - [x] Mark story `Status: review` in this file + update `_bmad-output/implementation-artifacts/sprint-status.yaml` `15-5-visualizer-paper-cream-background: ready-for-dev → review` + write a one-line entry above with date/branch/summary. NO merge yet — adversarial code review + Alejandro on-device smoke gate entry to `epic-15`.

## Dev Notes

### Architecture & patterns to follow (load-bearing)

- **Token-driven theming, not hex literals** — `OutfitVisualizer.tsx` already imports `wadaTokens` (line 37). Use `wadaTokens.bgPaper` (`#fafaf8`), NOT the literal `"#fafaf8"`. Per CLAUDE.md "NativeWind `className` for static styles (never StyleSheet.create). `style={{}}` ONLY for dynamic Wada color values" — note that the parent View at line 218 already uses `style={{}}` because the backgroundColor was Wada-token-driven; we keep that pattern (token-driven dynamic style). DO NOT switch to `className="bg-paper"` — that would be inconsistent with the file's existing pattern (the rest of the file's backgrounds are token-driven through `wadaTokens.*`, e.g. `slots[0].color.hex` for the CTA at line 352).
  - **Caveat**: the not-found branch at line 202 USES `className="bg-paper"` (the Tailwind utility — `tailwind.config.js:8` maps `paper → "#fafaf8"`). This is fine because that branch has no dynamic Wada-color logic; it's pure "screen surface". Both `wadaTokens.bgPaper` and the `bg-paper` Tailwind utility resolve to the same hex; they're equivalent at runtime. This story does NOT unify the two; the happy-path branch uses the dynamic-style pattern (because it shares the View with the `accessibilityLabel`-bearing root), the not-found branch uses the Tailwind utility (because it's a static panel). Both are correct.
- **Function declarations with named exports** — `Aureola` already follows the pattern (`export function Aureola(...)`, line 12). NO refactor — the story does not touch the function signature, just the colors array literal inside it.
- **Skia gradient color encoding** — `react-native-skia`'s `RadialGradient` accepts color strings in standard CSS hex format including `#RRGGBB`, `#RRGGBBAA`, and named colors like `"transparent"`. The current code uses `${hex}18` interpolation (8-character `#RRGGBBAA`). The new alpha bytes `0x40` / `0x1a` are valid hex (`64` / `26` decimal). DO NOT switch to RGBA functional notation (`rgba(r,g,b,a)`) — that'd mean parsing the `hex` prop, which is more code for zero benefit.
- **`hex` prop format invariant** — callers (only `OutfitVisualizer.tsx:255`) pass `slots[0].color.hex` which is a 7-character `#RRGGBB` string from `src/data/combinations` (verified via `git grep '"hex":' src/data/combinations | head -3` — all entries are 7-char `#RRGGBB`). Concatenating `${hex}40` produces a 9-character `#RRGGBBAA` (with the leading `#` plus 6 RGB chars plus 2 alpha chars — total 9 — Skia accepts this). DO NOT add defensive parsing. Per CLAUDE.md "Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees."
- **No new state, hooks, props, or animation** — Aureola is a pure render. The story does not introduce a Reanimated transition between alpha values, a `useReducedMotion` check (gradient is static), or a `useColorScheme` adaptation (Outfinder is light-only — see `docs/project-context.md`). Keep it minimal.
- **No analytics, no telemetry, no flags** — per `feedback_no_analytics.md`. The token swap and Aureola tune are static visual changes; there's no "rollout" or "gate" needed.

### Visual rationale — why `0x40` / `0x1a` is the calibrated default

`Aureola` paints a soft halo behind the silhouettes. The current alpha pair (`0x18 ≈ 9%` / `0x08 ≈ 3%`) was tuned against `wadaTokens.warmBg` (`#ebe5da`, RGB ≈ 235/229/218 — darker beige). On that canvas, even a subtle tinted gradient pops because the canvas already absorbs warm light. On `wadaTokens.bgPaper` (`#fafaf8`, RGB ≈ 250/250/248 — near-pure cream), the same alpha pair would near-vanish: the canvas reflects almost all light in the visible spectrum, so a 9% tinted overlay reads as ~91% cream + ~9% color → barely perceptible.

Doubling-and-a-bit the alpha (`0x18 → 0x40` is a 2.67× jump on the inner stop; `0x08 → 0x1a` is a 3.25× jump on the mid stop) restores the perceived halo intensity to roughly match the warm-canvas era. The asymmetry (mid stop bumped slightly more than inner) compensates for the sharper RadialGradient falloff against the brighter canvas — without it, the halo would feel "edged" rather than soft. The outer "transparent" stop is unchanged because the gradient must terminate cleanly at the edge of the radius (`r = width * 0.5`).

This is a starting point, not a calibrated lab measurement — colorimetry on a P3 wide-gamut iPhone display under variable ambient light is not deterministic. Alejandro's eye on the simulator + device is the final gate. If the eye says "too strong" or "too weak", iterate one line.

### Why we delete `WarmBackground.tsx` instead of leaving it as dead code

CLAUDE.md "Avoid backwards-compatibility hacks like renaming unused _vars, re-exporting types, adding // removed comments for removed code, etc. If you are certain that something is unused, you can delete it completely."

`git grep "WarmBackground" src/` audit (post-Tasks 1-3): zero matches. The component has NO consumer in `src/`. The `docs/project-context.md` mentions are stale (the Story 14.5 share-button era — share button removed in Story 14.6 per `OutfitVisualizer.tsx:338-340` comment). Keeping a 21-line Skia component file alive "just in case" creates:
- A bundled-but-unused Skia Canvas in iOS app size (small but non-zero).
- A maintenance trap (anyone re-adding it would re-introduce the warm-canvas regression we're explicitly fixing).
- A test that passes but tests nothing the user sees.

Hard delete is correct. The Epic 15 retrospective's `update-context` skill will clean the doc references.

### Visibility / structural invariants preserved

- The root return `<View>` at line 218 still has `className="flex-1"` (unchanged) — the `flex-1` is what makes the View fill the screen; the inline `style={{ backgroundColor: ... }}` is what paints the canvas. Both are needed.
- The not-found early return at line 199 is BEFORE the parent View definition at line 218, so the not-found branch is structurally independent and uses its own `bg-paper` className. After this story, both branches paint `#fafaf8` — coherent.
- Story 15.4's `<CoachMarkOverlay/>` (the LAST child of the root View, lines 376-380 post-15.4) renders ABOVE the parent's backgroundColor; it has its own backdrop (per `CoachMarkOverlay.tsx` Story 15.1 contract), so the canvas color change does NOT affect the overlay's appearance. The overlay's text card is paper-cream itself (`bg-paper` per the foundation), so on the new canvas the overlay-card-vs-canvas contrast is intentionally subtle (matching the rest of the app's visual hierarchy).
- The `<ScrollView>` at line 247 is INSIDE the parent View, transparent by default. The content inside it — `<WadaHeader>`, `<OutfitCard>`, `<MiniPaletteStrip>`, the "Outfinder" branding text — all read against `bgPaper` after this story (no separate background painters between them and the parent). The `<Aureola>` halo at line 254 is the ONLY colored layer between the silhouettes and the canvas.

### File layout

```
src/
  screens/
    OutfitVisualizer.tsx       ← MOD (1 import delete, 1 token swap, 1 JSX delete)
    OutfitVisualizer.test.tsx  ← MOD (1 it-block delete @ L231-243, 1 inner expect delete @ L685)
  components/
    Aureola.tsx                ← MOD (1 colors array tune)
    WarmBackground.tsx         ← DELETE (entire file)
    presentation.test.tsx      ← MOD (1 import delete, 1 describe block delete)
  navigation/
    CustomTabBar.tsx           ← MOD (collapse warm-screen crossfade: delete derivation L39-45, animation block L51-61, swap consumer L210, prune comments + Reanimated imports)
```

NO new files. NO new directories. NO new packages. NO native module changes. NO `app.config.ts` changes. NO i18n changes. NO new tests added.

### Reuse — do NOT reinvent

| Need | Reuse from | DO NOT |
|------|------------|--------|
| Paper-cream canvas color | `wadaTokens.bgPaper` (already imported in OutfitVisualizer.tsx) | Hardcode `"#fafaf8"` as a string literal |
| Skia radial gradient infra | Existing `<RadialGradient>` in `Aureola.tsx` | Add a second gradient layer or switch to `LinearGradient` |
| Halo color source | `slots[0].color.hex` (already passed via `hex` prop) | Compute a derived "softened" hex |
| Canvas absolute positioning | Existing `position: "absolute"` style on `<Canvas>` in Aureola | Add a wrapper View |
| Reduce Motion handling | Not needed (gradient is static, no animation) | Add `useReducedMotion()` here |
| Tests for visual change | On-device smoke (AC #5) | Add Reanimated/Skia mock that asserts gradient colors (brittle, see below) |

### Trigger semantics

The change is structural: every `OutfitVisualizer` mount renders the new canvas + retuned Aureola. There is no flag, no rollout, no per-user gating. Returning users see the new look immediately on app update. No migration; the warmBg → bgPaper change does not affect any persisted state (no AsyncStorage key references the warm background — the only persisted Visualizer state is the Story 15.4 coach mark seen-flag at `@outfinder/coachmark:visualizer-slots-firstuse`, untouched here).

### Coordination with `CustomTabBar.tsx` (the hidden coupling)

`CustomTabBar.tsx` (lines 36-61 + line 210) currently runs a Reanimated crossfade specifically to MATCH the OutfitVisualizer's `warmBg`. That crossfade is documented in the memory `project_tabbar_cradle_layout.md` ("bg crossfades via Reanimated interpolateColor (250ms) to sync with stack fade"). Once the Visualizer canvas swaps to `bgPaper`, the crossfade has no purpose — it would actively introduce a 250ms warm-flash mismatch on every Combinations → OutfitVisualizer transition.

This is NOT an out-of-scope cleanup; it is an **integral consequence of FR10**. Task 4 collapses the crossfade. Without it, the visual smoke step (AC #5) would catch a regression that AC #1 silently introduced.

Memory `project_tabbar_cradle_layout.md` will be slightly stale post-merge ("bg crossfades via Reanimated interpolateColor (250ms)" no longer accurate) — that memory entry can be updated in the Epic 15 retro along with the project-context.md doc cleanup. DO NOT update memory in this dev pass — out of scope.

### Coordination with concurrently-active work

- **15.4 (DONE, merged at `baa31aa`)**: shipped `<CoachMarkOverlay/>` as the LAST child of the root View (`OutfitVisualizer.tsx:376-380` post-merge). Story 15.5 does NOT touch the overlay. The 15.4 retro flagged a small conflict surface here ("15.5 also touches `OutfitVisualizer.tsx:209` — small conflict surface, rebase whichever lands first") — 15.4 landed first, so 15.5 rebases on top. The line 209 reference in the 15.4 retro was for the warmBg backgroundColor (line shifted slightly post-15.4 — verify with `grep -n "warmBg" src/screens/OutfitVisualizer.tsx` on the actual story-branch state; expect line 220 per the current `epic-15 HEAD baa31aa`).
- **15.2 (BACKLOG)**: still pending after 15.5. Touches `ArmarioPickerScreen.tsx` + `ArmarioPreviewScreen.tsx` — completely separate file surface, zero conflict with this story.
- **Marketing screenshots track (parallel)**: paper-cream Visualizer changes the visual reference for App Store screenshots — but the marketing track is decoupled from this dev story. The release manager will regenerate screenshots AFTER all stories merge per `docs/planning/epic-15/epic-15.md:240-243`.

### Testing standards (recap)

- Co-locate `*.test.tsx` next to source — already done.
- Test interactions, not just rendering — this story has NO new interactions; the change is a static visual swap. The on-device smoke step IS the verification.
- Every AC describing user-observable behavior maps to a test case OR an on-device smoke item — AC #1/#2/#3 map to grep/diff structural verifications + the targeted regression run; AC #4 is the CI gates; AC #5 is the on-device smoke.
- DO NOT add a test that asserts the parent View's `backgroundColor` equals `wadaTokens.bgPaper` via `getByLabelText("...").props.style`. That would be a brittle assertion (the View's `style` is currently a single inline object — if a future refactor splits it across multiple `style` arrays, the assertion breaks for cosmetic reasons). The `git diff` in PR review is the source of truth that the token swap happened.
- DO NOT add a test that mounts `<Aureola/>` and asserts the gradient `colors` array via Skia internals. Skia in jest runs against the `react-native-skia` mock which does NOT preserve the actual color stops (verified: existing Aureola tests at `presentation.test.tsx:90-108` only assert mount + dimensions, never colors). Adding such an assertion would either: (a) require setting up a real Skia harness, which is out-of-scope and expensive, or (b) reach into mock internals, which is brittle.
- DO NOT mock `WarmBackground` to assert it's NOT rendered after the JSX deletion. The `git diff` shows the line gone; that's enough. A test that asserts "this thing is not in the tree" is testing the absence of a thing, which is fragile.
- DO NOT add a Reanimated test for animation regression — there is no animation in this story (Aureola is static; the parent View's color is static).
- The 2 deleted WarmBackground describe-block tests in `presentation.test.tsx` are TEST DELETIONS, not test rewrites. The component being tested no longer exists — the test cannot stay.

### Anti-patterns (explicit "do NOT")

- DO NOT switch the parent View backgroundColor from `style={{ backgroundColor: wadaTokens.bgPaper }}` to `className="bg-paper"`. Two reasons: (1) the file's existing pattern uses dynamic style for the screen-level surface (token-driven); switching to className for one screen creates inconsistency. (2) NativeWind + dynamic styles don't always merge cleanly; sticking with the existing inline style avoids the merge order debate.
- DO NOT introduce a new prop `backgroundColor?: keyof typeof wadaTokens` on `OutfitVisualizer`. The Visualizer is mounted by the navigator with no override; nobody needs to parametrize the canvas color. Premature abstraction per CLAUDE.md "Don't design for hypothetical future requirements."
- DO NOT add a tween / animated transition between `warmBg` and `bgPaper` for "smooth migration". The change ships at install time (next app update); there is no in-app transition to animate.
- DO NOT add a `useColorScheme()` check to flip Aureola alpha based on dark mode. Outfinder is light-only — `docs/project-context.md` confirms; no `dark:` Tailwind classes are used anywhere. Adding the check is dead branching.
- DO NOT add a "is `hex` prop a valid hex string?" guard in `Aureola.tsx`. The prop comes from `slots[0].color.hex` which is from `src/data/combinations` (static JSON, validated at parse time per Epic 1) — internal trust per CLAUDE.md "Trust internal code and framework guarantees."
- DO NOT extract the alpha bytes (`0x40`, `0x1a`) into named constants like `AUREOLA_INNER_ALPHA = "40"`. Two-character interpolations don't earn a constant; the readability cost of the extra import + indirection > the benefit of the name. (If Alejandro asks for a tune, edit the literal in place.)
- DO NOT update `docs/project-context.md` lines 98 + 190 in this story. Those edits belong to the Epic 15 retro `update-context` skill pass — out-of-scope here. The same applies to `docs/archive/project-context-distillate.md`.
- DO NOT bump the app version in `app.config.ts` for this story. Version bump happens once at end-of-epic via `release-manager`.
- DO NOT touch `Aureola`'s `accessibilityLabel`, `AUREOLA_TOP_OFFSET`, or the `<Canvas>` `style` block. The "halo" is decorative; VoiceOver users don't navigate into it. The label "Color aureola" is preserved for the existing presentation.test.tsx Aureola tests (lines 91-107).
- DO NOT touch `OutfitVisualizer.tsx`'s ScrollView, OutfitCard, MiniPaletteStrip, WadaHeader, the back button, the previous/next garment Pressables, the "Outfinder" branding text, or the bottom Make Mine CTA. Those are all out-of-scope.
- DO NOT add a `react-native-view-shot` snapshot test of the new look. Visual regression testing infra is not set up in this repo and adding it for one story is scope creep.
- DO NOT delete `WarmBackground.tsx` while leaving the import at OutfitVisualizer.tsx:23 — the build will fail. Tasks 1 and 3 must run together (or Task 1 first, Task 3 second; never Task 3 alone).
- DO NOT remove the `wadaTokens.warmBg` token from `src/styles/theme.ts:23`, the matching assertion at `src/styles/theme.test.ts:26`, OR the Tailwind alias `"warm-bg"` at `tailwind.config.js:25`. The token is preserved by design — only its OutfitVisualizer consumer is rewired. Three reasons: (a) removal triggers ripple work outside this story's scope, (b) the warm sand tone has aesthetic Wada-palette value for potential future surfaces, (c) generic dead-token cleanup belongs to the Epic 15 retro `update-context`/refactor track. After this story, the only remaining runtime `warmBg` consumer is the theme.test.ts assertion — fine; the token is documented and asserted but not actively rendered.
- DO NOT remove the `WarmBackground` component file's `expo-modules-core` / `react-native-skia` deps from `package.json` thinking they're unused. Skia is still used by `Aureola`; expo-modules-core is a transitive runtime dep. Leave the package manifest alone.
- DO NOT downgrade `<Animated.View>` to `<View>` in `CustomTabBar.tsx` without first grep-confirming no other Reanimated worklet style is layered on the same node. The safe move is to keep `<Animated.View>` with a static style object in its style array — it costs nothing at runtime and avoids an import-graph rabbit hole.

### Previous story intelligence — Story 15.4 (the most recently merged story; merged at `baa31aa`)

- Story 15.4 placed `<CoachMarkOverlay/>` as the LAST child of the root View at lines 376-380 (post-merge line numbers). Story 15.5 leaves the overlay UNTOUCHED — only the parent's backgroundColor swaps and `<WarmBackground/>` deletes.
- 15.4 retro confirmed CI baseline on `epic-15` HEAD post-15.4 (`baa31aa`): `pnpm lint` = 2 pre-existing errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx` Biome format — note the OutfitVisualizer.tsx error was on the `handleMakeMine` block, NOT on the lines this story touches), `npx tsc --noEmit` = 0 errors, `pnpm test` = 964/3/967 passing/failing/total (3 failures pre-existing in `i18n.test.ts:131-134`). 15.5 baseline before starting will be the same.
- 15.4 dev's discipline: capture pre-baselines, scope diff via `git diff`, revert Biome auto-formats outside the story's intended diff via `git checkout -p`, AC verification point-by-point. Mirror this in 15.5.
- 15.4 review enforced: keep diff scoped (do NOT piggyback unrelated cleanups), no new test-skips, no defensive guards for impossible states. Same rules apply to 15.5 review.
- 15.4 noted a small coordination point: "15.5 also touches `OutfitVisualizer.tsx:209` — small conflict surface, rebase whichever lands first." 15.4 landed first; 15.5 starts from `baa31aa` so no rebase needed. The actual line for the warmBg backgroundColor on `baa31aa` is 220 (verified by reading the current file), not 209 — line numbers shifted slightly with the 15.4 hook + handler additions.

### Aureola alpha sensitivity matrix (for on-device smoke iteration)

If Alejandro's smoke says "halo too weak":
- bump inner stop to `0x4d` (~30%), mid stop to `0x20` (~12.5%): `colors={[`${hex}4d`, `${hex}20`, "transparent"]}`.

If Alejandro's smoke says "halo too strong":
- ease inner stop to `0x33` (~20%), mid stop to `0x14` (~8%): `colors={[`${hex}33`, `${hex}14`, "transparent"]}`.

If Alejandro's smoke says "halo edged / hard transition":
- soften by widening the gradient: keep colors at `0x40`/`0x1a` but add a fourth stop — NO, this introduces complexity. Instead, ease the mid stop further (e.g. `0x10`) so the transition is smoother: `colors={[`${hex}40`, `${hex}10`, "transparent"]}`.

These iterations are 1-line edits to `Aureola.tsx:28`. NO test changes, NO new commit-message formatting, NO PR re-open.

### Out of scope for this story

- The Visualizer onboarding (FR8 + FR9, A2 — Story 15.4) — DONE in `baa31aa`. Do NOT touch the coach mark wiring, the underline pulse, or the i18n keys under `visualizer.coachMark.*`.
- Camera FAB onboarding (FR6 + FR7, C1 — Story 15.3) — DONE. Do NOT touch `UnifiedCameraCaptureScreen.tsx`.
- Coach mark foundation (FR1 + FR2 — Story 15.1) — DONE. Do NOT touch `CoachMarkOverlay.tsx`, `useCoachMark.ts`, `coachMarkKeys.ts`.
- Copy changes (FR12 + FR13, D1+D2 — Story 15.6) — DONE. Do NOT touch `home.subtitle` or `favorites.newLookCta.title`.
- Armario "En curso" CategoryPicker flow (FR3-FR5, B1 — Story 15.2) — backlog. Out-of-scope here; will land later.
- Marketing screenshots regeneration — parallel track, not a code story.
- Updating `docs/project-context.md` to reflect WarmBackground deletion — that's the Epic 15 retro `update-context` skill pass.
- Switching the not-found branch's `bg-paper` className to `wadaTokens.bgPaper` style — works fine as-is; both resolve to the same hex; no consistency win to be gained.
- Refactoring `Aureola` to expose intensity / alpha as props — premature; one consumer, no parametrization need.
- Aureola color-space considerations (P3 vs sRGB on iPhone displays) — Skia handles this internally; no story-level action required.
- Dark mode adaptation — Outfinder is light-only.

### Project Structure Notes

- All touched files live under `src/screens/` and `src/components/` — no new directories. One file deleted, no new files. No new packages. No native module changes.
- `wadaTokens.bgPaper` is the canonical paper-cream token (also used by `tabBarBg`, `navBarBg`, and the `paper` Tailwind utility). Already used by 8+ screens including `ColorHome`, `FavoritesList`, `BrowseAllColors`, `Settings`, the Mis Looks tab variants, and the `OutfitVisualizer.tsx:202` not-found branch. After this story, the happy-path Visualizer joins them — full app coherence on the canvas color.
- `Aureola.tsx` is a pure presentational component with one consumer. The colors array tune does not affect its API surface, so no other files need updating.

### References

- Epic spec — Story 15.5 scope: [Source: docs/planning/epic-15/epic-15.md#story-155--a1-visualizer-paper-cream-background--aureola-tune] (lines 182-199).
- Epic spec — DEC-1 ("Visualizer permanece (NO se mata)"): [Source: docs/planning/epic-15/epic-15.md#️-decisiones-cerradas-pm-session-2026-04-26] (line 33).
- Epic spec — FR10 + FR11 (Visualizer estilo A1): [Source: docs/planning/epic-15/epic-15.md#functional-requirements] (lines 64-66).
- Epic spec — NFR3 (CI green, zero new test-skips), NFR4 (zero regressions in main flow): [Source: docs/planning/epic-15/epic-15.md#non-functional-requirements] (lines 75-78).
- Target screen — `OutfitVisualizer`: [Source: src/screens/OutfitVisualizer.tsx#L23] (`WarmBackground` import to delete), [Source: src/screens/OutfitVisualizer.tsx#L218-L222] (parent View with backgroundColor on line 220 to swap), [Source: src/screens/OutfitVisualizer.tsx#L252] (`<WarmBackground />` JSX render to delete).
- Target component — `Aureola`: [Source: src/components/Aureola.tsx#L24-L31] (gradient `colors` array on line 28 to tune).
- Component to delete — `WarmBackground`: [Source: src/components/WarmBackground.tsx#L1-L21] (entire 21-line file to delete).
- Test file with WarmBackground tests to delete: [Source: src/components/presentation.test.tsx#L6] (import) + [Source: src/components/presentation.test.tsx#L110-L123] (describe block).
- Screen test file with WarmBackground assertions to delete: [Source: src/screens/OutfitVisualizer.test.tsx#L231-L243] (entire `it("renders warm background", …)` test case) + [Source: src/screens/OutfitVisualizer.test.tsx#L685] (single-line assertion inside `renders all presentation components for 4-color combo`).
- Sibling tab bar to retune: [Source: src/navigation/CustomTabBar.tsx#L36-L61] (warm-screen crossfade derivation + animation block to delete) + [Source: src/navigation/CustomTabBar.tsx#L210] (animatedBgStyle JSX consumer to swap to static `bgPaper`) + [Source: src/navigation/CustomTabBar.tsx#L188] (stale comment about Visualizer warmBg).
- Theme token assertion (preserved, NOT touched): [Source: src/styles/theme.test.ts#L26] (`expect(wadaTokens.warmBg).toBe("#ebe5da");`).
- Theme tokens: [Source: src/styles/theme.ts#L6] (`bgPaper: "#fafaf8"`) + [Source: src/styles/theme.ts#L23] (`warmBg: "#ebe5da"`).
- Tailwind palette parity: [Source: tailwind.config.js#L8] (`paper: "#fafaf8"`) + [Source: tailwind.config.js#L25] (`"warm-bg": "#ebe5da"`).
- Story 15.4 record (immediate predecessor — establishes baseline + coordination point): [Source: _bmad-output/implementation-artifacts/15-4-visualizer-slot-discovery-onboarding.md].
- Project rules: [Source: CLAUDE.md#agent-rules-from-5-pwa-retrospectives] — Story Scope (≤5 tasks ✅ — this story has 5; the 5th task is the CustomTabBar crossfade collapse, surfaced during checklist validation as a hidden coupling of FR10), AC verification, RN Specifics, Testing Discipline, Mandatory Code Review.
- Tab bar memory pointer: `project_tabbar_cradle_layout.md` (referenced from MEMORY.md) describes the 250ms Reanimated crossfade between bgPaper and warmBg. Story 15.5 collapses this. Memory entry update is out-of-scope here; will be handled in Epic 15 retro.
- Memory pointers: `feedback_no_patches.md` (find root cause; keep diff scoped; no piggyback cleanups), `feedback_visual_review.md` (visual change → Expo simulator review by Alejandro), `feedback_no_analytics.md` (no telemetry on visual changes), `feedback_tailwind_tokens.md` (Tailwind keys without `bg-`/`text-` prefixes — already correct; `paper` not `bg-paper` in `tailwind.config.js`).
- Project context: [Source: docs/project-context.md#L98] + [Source: docs/project-context.md#L190] — STALE references to `WarmBackground`; do NOT clean in this story.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) via `bmad-dev-story` skill — branch `story/15-5-visualizer-paper-cream-background` off `epic-15` HEAD `baa31aa`.

### Debug Log References

- Pre-baselines on `epic-15` HEAD `baa31aa`: `npx tsc --noEmit` = 0 errors; `pnpm lint` = 2 errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx` Biome format, both pre-existing per 15.4 retro); `pnpm test` = 964/3/967 (3 pre-existing failures in `i18n.test.ts:131-134`).
- Mid-implementation: `pnpm exec biome check --write src/components/presentation.test.tsx` ran once after the `WarmBackground` describe-block deletion to clean a transient organizeImports/format issue introduced by the removal — auto-fix is scoped to that single file (verified via `git diff --stat`).
- Post-baselines: `tsc` = 0 (UNCHANGED), `lint` = 2 (UNCHANGED — pre-existing `OutfitVisualizer.tsx > handleMakeMine` format error NOT auto-fixed by Biome since the format error sits outside the lines this story touched, per `feedback_no_patches.md` keep-diff-scoped), `pnpm test` = 961/3/964 (delta `-3` net, exact match: 2 `WarmBackground` describe-block tests in `presentation.test.tsx` + 1 `renders warm background` test case in `OutfitVisualizer.test.tsx`). Skips unchanged at 0.
- Targeted regressions: `pnpm test src/screens/OutfitVisualizer.test.tsx` = 52 passing (spec said 53/54; actual baseline before story was 53 → 52 post-deletion); `pnpm test src/components/presentation.test.tsx` = 11 passing (3 WadaHeader + 5 MiniPaletteStrip + 3 Aureola); `pnpm test src/components/OutfitCard.test.tsx` = 18 passing (spec said 19; actual baseline was 18, UNCHANGED).
- Self-checks: `grep -nE 'WarmBackground|"Warm background"' src/` returns ZERO matches (exit 1). `find src/navigation -name "*.test.*"` returns empty (no nav tests asserting the crossfade — visual smoke is the verification). `grep -nE "Animated|reanimated|warmBg" src/navigation/CustomTabBar.tsx` returns ZERO matches. Skip count `grep -rn "test\.skip\|it\.skip\|xit(" src/ | wc -l` = 0 (UNCHANGED).

### Completion Notes List

- ✅ **Task 1** — `OutfitVisualizer.tsx`: removed `WarmBackground` import, swapped parent View backgroundColor `wadaTokens.warmBg → wadaTokens.bgPaper`, deleted `<WarmBackground />` JSX. Diff = 3 line touches, exactly as specified. Story 15.4's `<CoachMarkOverlay/>` (LAST child) UNTOUCHED.
- ✅ **Task 2** — `Aureola.tsx`: tuned RadialGradient alpha pair `${hex}18`/`${hex}08` → `${hex}40`/`${hex}1a` (calibrated default for paper-cream canvas; ~25%/10% inner/mid alpha vs prior ~9%/3%). Diff = 1 line touch on the `colors` array literal; props/interface/canvas style/Fill/c/r unchanged. No new comment narrating the tune (per spec).
- ✅ **Task 3** — Deleted `src/components/WarmBackground.tsx` entirely (`git rm`). `presentation.test.tsx`: removed import + entire `describe("WarmBackground", …)` block (Biome auto-format applied to clean up trailing blank lines — scoped to that file only). `OutfitVisualizer.test.tsx`: removed entire `it("renders warm background", …)` test (lines 231-243) + single inner `expect(…"Warm background"…)` assertion at the 4-color combo bundle test. Zero `WarmBackground` refs remain in `src/`. Stale doc references in `docs/project-context.md` + `docs/archive/project-context-distillate.md` LEFT UNTOUCHED (out-of-scope; Epic 15 retro `update-context` pass).
- ✅ **Task 4** — `CustomTabBar.tsx`: collapsed warm-screen crossfade. Removed `useEffect` from React import + entire `react-native-reanimated` import block (no remaining consumers). Removed `colorsNestedState`/`activeColorsScreen`/`isWarmScreen` derivation + `bgProgress`/`useEffect`/`animatedBgStyle` animation block. Downgraded `<Animated.View>` to plain `<View>` (verified zero other `Animated.*` usage in this file — clean simplification). Replaced animated style with `backgroundColor: wadaTokens.bgPaper` static. Updated stale comment block at iPhone-cradle preamble to drop the "Visualizer warmBg transition" reference. Tab bar handlers, FAB cradle layout, iPad branch, accessibility props ALL UNTOUCHED.
- ✅ **Task 5** — CI gates green. AC #1/#2/#3/#4 ✓ structurally + via test deltas. AC #5 (on-device visual smoke) ⏸ PENDING Alejandro on iPhone 16 Pro.
- ✅ **AC #5 on-device smoke APPROVED by Alejandro on 2026-04-27** — iPhone 16 Pro, ES + EN locales, ≥3 luminance-spread Wada combos. Parent canvas reads as paper-cream `#fafaf8` (coherent with `ColorHome`/`FavoritesList`/`BrowseAllColors`). Aureola halo perceptible without overpowering tinted Wada garments. Tab bar bg stays paper-cream across Combinations ↔ OutfitVisualizer transition (no warm flash, no flicker). Final Aureola alpha pair shipped: **`0x40`/`0x1a`** (calibrated default — no tune needed). Branch ready for `bmad-code-review` adversarial pass before merge to `epic-15`.

### File List

- `src/screens/OutfitVisualizer.tsx` — MOD: removed `WarmBackground` import (L23), swapped parent View `backgroundColor: wadaTokens.warmBg → wadaTokens.bgPaper` (L220 pre-edit), removed `<WarmBackground />` JSX (L252 pre-edit). Net: -3 / +1.
- `src/components/Aureola.tsx` — MOD: tuned RadialGradient `colors` alpha pair (L28). Net: -1 / +1.
- `src/components/WarmBackground.tsx` — DELETE (entire 21-line file).
- `src/components/presentation.test.tsx` — MOD: removed `WarmBackground` import + `describe("WarmBackground", …)` block (Biome auto-format applied to clean trailing blank line). Net: -16 / 0.
- `src/screens/OutfitVisualizer.test.tsx` — MOD: removed `it("renders warm background", …)` test case (lines 231-243 pre-edit) + single inner `expect(…"Warm background"…)` at the 4-color-combo bundle test (line 685 pre-edit). Net: -15 / 0.
- `src/navigation/CustomTabBar.tsx` — MOD: collapsed warm-screen crossfade. Removed `useEffect` from React import, removed entire `react-native-reanimated` import block, removed `colorsNestedState`/`activeColorsScreen`/`isWarmScreen` derivation + `bgProgress`/animation block, downgraded `<Animated.View>` → `<View>`, replaced animated style with static `backgroundColor: wadaTokens.bgPaper`, updated stale iPhone-cradle preamble comment. Net: -47 / +9.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MOD: status `15-5-visualizer-paper-cream-background: ready-for-dev → review`, `last_updated` log entry appended.
- `_bmad-output/implementation-artifacts/15-5-visualizer-paper-cream-background.md` — MOD: status `ready-for-dev → review`, Tasks/Subtasks checkboxes filled, Dev Agent Record populated.

### Review Findings

Code review completed 2026-04-27 via `bmad-code-review` (3 parallel layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor).

**Result: 0 patches · 0 decision-needed · 2 deferred · 5 dismissed**

- [x] [Review][Defer] iPad branch hardcodes `"#fafaf8"` instead of `wadaTokens.bgPaper` [src/navigation/CustomTabBar.tsx:68] — deferred, pre-existing; explicitly noted as unchanged in spec Dev Note constraint; revisit in Epic 15 retro or dedicated token-consistency pass.
- [x] [Review][Defer] `wadaTokens.warmBg` has no runtime consumer after this story (only `theme.test.ts` assertion remains) [src/styles/theme.ts:23] — deferred, deliberate spec decision documented in AC#3 ("Token NOT removed" section) with explicit rationale; revisit in Epic 15 retro `update-context`/refactor track.

Dismissed (not actionable or false positive):
- `wadaTokens.tabBarBg` dead-token claim — token does not exist in `theme.ts`; Blind Hunter hallucination.
- Aureola alpha on dark colors — addressed by on-device smoke AC#5 (approved by Alejandro across luminance-spread combos including dark combinations).
- `React` import retained in CustomTabBar — false positive based on illustrative diff; actual file has no `import React`.
- No test for `bgPaper` backgroundColor — spec explicitly prohibits this assertion (Dev Notes "Testing standards").
- Hex format `#RRGGBB` assumption — pre-existing contract, not introduced by this story; Skia accepts 9-char `#RRGGBBAA`.

### Change Log

- 2026-04-27 — Story 15.5 implemented on branch `story/15-5-visualizer-paper-cream-background` off `epic-15` HEAD `baa31aa` by `bmad-dev-story` (Claude Opus 4.7). 5 tasks, 6 files touched (1 deleted). CI: tsc 0 unchanged, lint 2 pre-existing unchanged, pnpm test 961/3/964 (delta -3 net, exact). Aureola alpha tuned to calibrated default `0x40`/`0x1a`. CustomTabBar warm-screen crossfade fully collapsed. Status moved `ready-for-dev → review`. AC #1/#2/#3/#4 ✓; AC #5 (on-device visual smoke by Alejandro) PENDING.
- 2026-04-27 — AC #5 on-device visual smoke APPROVED by Alejandro on iPhone 16 Pro (ES + EN locales, ≥3 luminance-spread Wada combos, tab bar transition clean). Final Aureola alpha pair shipped: `0x40`/`0x1a` (calibrated default, no tune needed). Branch ready for adversarial code review before merge to `epic-15`.
