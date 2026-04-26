# Story 15.6: Copy changes — D1 home subtitle + D2 newLookCta title (ES + EN)

Status: done

## Story

As **Alejandro (product owner)** preparing the v1.4.0 launch (Epic 15, the last polish epic before App Store submit),
I want **two user-visible copy strings replaced in both locales — `home.subtitle` ("¿De qué color es tu ropa hoy?" → "¿Qué color de ropa quieres combinar?" / "What color are you wearing?" → "What color would you like to combine?") and `favorites.newLookCta.title` ("Empieza un look nuevo" → "Monta tu look" / "Start a new look" → "Build your look") — with their three pre-existing literal-string assertions in `src/i18n/__tests__/i18n.test.ts` updated to match**,
so that **the v1.4.0 home headline reframes the question from "what are you wearing right now?" (descriptive) to "what color do you want to combine?" (intent-driven, matches the way users actually approach the product per Alejandro's product instinct), and the Mis Looks CTA reads as an active prompt ("Monta tu look" / "Build your look") rather than a generic "start" verb that doesn't capture the curate-from-Wada-palettes loop**.

## Acceptance Criteria

1. **Given** `src/i18n/locales/es.json` lines 13–22 (`home` block) and lines 54–59 (`favorites.newLookCta` block), **When** Story 15.6 is implemented, **Then** the file contains EXACTLY these two value changes (and no other modifications):
    - `home.subtitle`: `"¿De qué color es tu ropa hoy?"` → `"¿Qué color de ropa quieres combinar?"` (preserve the existing `¿` Unicode-escape style for the inverted question mark — match the file's current encoding pattern at line 15; do NOT switch to a literal `¿` character).
    - `favorites.newLookCta.title`: `"Empieza un look nuevo"` → `"Monta tu look"`.
    - `favorites.newLookCta.a11yLabel` (currently `"Empezar un look nuevo"` at line 57) is INTENTIONALLY NOT CHANGED in this story — FR12 scope is `.title` only. Same applies to `subtitle` and `a11yHint`. Verify post-edit with `git diff src/i18n/locales/es.json` showing exactly 2 changed lines (15 + 55).

2. **Given** `src/i18n/locales/en.json` lines 13–22 (`home` block) and lines 54–59 (`favorites.newLookCta` block), **When** Story 15.6 is implemented, **Then** the file contains EXACTLY these two value changes (and no other modifications):
    - `home.subtitle`: `"What color are you wearing?"` → `"What color would you like to combine?"`.
    - `favorites.newLookCta.title`: `"Start a new look"` → `"Build your look"`.
    - `favorites.newLookCta.a11yLabel` (currently `"Start a new look"` at line 57 — same surface form as the old title but it is a SEPARATE key serving the VoiceOver label) is INTENTIONALLY NOT CHANGED. Verify post-edit with `git diff src/i18n/locales/en.json` showing exactly 2 changed lines (15 + 55).

3. **Given** `src/i18n/__tests__/i18n.test.ts` contains 3 literal-string assertions referencing the OLD `home.subtitle` values (audit verified at lines 52, 61, 71 on `epic-15` HEAD `c716a03`), **When** Story 15.6 is implemented, **Then** all 3 lines are updated to match the NEW values:
    - Line 52: `expect(tEN("home.subtitle")).toBe("What color are you wearing?");` → `expect(tEN("home.subtitle")).toBe("What color would you like to combine?");`
    - Line 61: `expect(tES("home.subtitle")).toContain("color es tu ropa");` → `expect(tES("home.subtitle")).toContain("color de ropa");` (preserve the `.toContain(...)` matcher style; pick a substring that uniquely identifies the new ES copy without depending on the inverted-question-mark encoding).
    - Line 71: `expect(tES("home.subtitle")).toContain("tu ropa hoy");` → `expect(tES("home.subtitle")).toContain("quieres combinar");` (same matcher-style preservation rule).
    - The `tES("home.browseAll")` assertion on the next line (72) is UNRELATED — do NOT touch.
    - The "AC #6 exact strings" comment at line 70 currently anchors on the old phrasing — update the comment to read `// AC #6 exact strings (D1 home subtitle Epic 15 — "Qué color de ropa quieres combinar")` to keep documentation honest. NOT load-bearing for tests but prevents future grep confusion.

4. **Given** the `favorites.newLookCta.title` value change does NOT have a literal-string assertion in the test suite (audit confirmed: `NewLookCtaCard.test.tsx` uses the t-key-as-mock-string pattern that returns `"favorites.newLookCta.title"` literally — value-agnostic; `FavoritesList.test.tsx:1047` references `accessibilityLabel` which maps to the `.a11yLabel` key NOT `.title`), **When** Story 15.6 is implemented, **Then** ZERO test files outside `i18n.test.ts` need changes. The dev agent MUST verify this by running `git grep "Empieza un look nuevo\|Start a new look" src/` AFTER editing the JSON files — the grep must return ONLY the two `a11yLabel` lines (`en.json:57` for "Start a new look" + an inadvertent match risk on `es.json:57` "Empezar un look nuevo" which is a different string but contains the substring root). If any other match appears, that file needs updating; if not, the change is structurally complete.

5. **Given** the test suite is the gate per CLAUDE.md ("Mandatory Code Review" + Epic 14 retro: "testing gaps main HIGH source"), **When** Story 15.6 is implemented, **Then** ALL of the following CI gates pass on the story branch:
    - `npx tsc --noEmit` is clean (expected: matches the 2 pre-existing errors heredados from epic-14 baseline that Story 15.1 inherited per `_bmad-output/implementation-artifacts/sprint-status.yaml` line 38 — `ArmarioSugerenciaArmoniaScreen.test.tsx` + `ArmarioTuLookScreen.test.tsx`. Capture the count BEFORE editing; the post-story count must equal that baseline, NOT zero).
    - `pnpm lint` shows no NEW errors (the 2 pre-existing format errors carry over from 15.1 — `FavoritesList.test.tsx` + `OutfitVisualizer.tsx`. Same baseline-capture-before rule).
    - `pnpm test` passes with the test count UNCHANGED at **954 passing / 3 pre-existing / 957 total** (15.1 baseline per sprint-status line 38). Net delta = 0: this story modifies 3 existing test assertions, adds none, deletes none.
    - `grep -rn 'test\.skip\|it\.skip\|xit\(' src/` count must not increase.

6. **Given** the v1.4.0 app is bilingual (Story 11.2) and CLAUDE.md mandates ES + EN coverage for every user-visible string, **When** Story 15.6 is implemented, **Then** running `node -e "const es = require('./src/i18n/locales/es.json'); const en = require('./src/i18n/locales/en.json'); function keys(o, p='') { return Object.entries(o).flatMap(([k,v]) => typeof v === 'object' ? keys(v, p+k+'.') : [p+k]); } const a = keys(es).sort(), b = keys(en).sort(); console.log(JSON.stringify(a) === JSON.stringify(b) ? 'PARITY_OK' : 'PARITY_DIFF');"` prints `PARITY_OK` (Story 14.7 introduced this parity invariant — it is asserted by `i18n.test.ts:34–41` "object key parity"; trivially preserved here since we change values not keys, but the test runs anyway and it MUST stay green).

## Tasks / Subtasks

- [x] **Task 1 — Edit 4 i18n string values (2 keys × 2 locales) + update 3 test assertions** (AC: #1, #2, #3, #4)
  - [x] In `src/i18n/locales/es.json` line 15, replace `"¿De qué color es tu ropa hoy?"` → `"¿Qué color de ropa quieres combinar?"` (preserve `¿` escape style — match the file's existing encoding convention).
  - [x] In `src/i18n/locales/es.json` line 55, replace `"Empieza un look nuevo"` → `"Monta tu look"`.
  - [x] In `src/i18n/locales/en.json` line 15, replace `"What color are you wearing?"` → `"What color would you like to combine?"`.
  - [x] In `src/i18n/locales/en.json` line 55, replace `"Start a new look"` → `"Build your look"`.
  - [x] In `src/i18n/__tests__/i18n.test.ts` line 52, update `tEN("home.subtitle")` `.toBe(...)` to the new EN string.
  - [x] In `src/i18n/__tests__/i18n.test.ts` line 61, update `tES("home.subtitle")` `.toContain("color es tu ropa")` → `.toContain("color de ropa")`.
  - [x] In `src/i18n/__tests__/i18n.test.ts` line 71, update `tES("home.subtitle")` `.toContain("tu ropa hoy")` → `.toContain("quieres combinar")`.
  - [x] In `src/i18n/__tests__/i18n.test.ts` line 70, update the `// AC #6 exact strings` comment to reflect the new D1 phrasing.
  - [x] Verify via grep guards: `git grep "De qué color es tu ropa hoy\|Empieza un look nuevo\|What color are you wearing\|Start a new look" src/` returns ONLY intentional residuals.

- [x] **Task 2 — AC verification + CI gates** (AC: #5, #6)
  - [x] Capture baselines on `epic-15` HEAD BEFORE any edit. Actual: tsc **0 errors** (better than spec — 15.1 cleaned them up), lint **2 errors**, tests **954/3/957**, skips **0**.
  - [x] Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` AFTER edits. Post-edit: tsc 0, lint 2, tests 954/3/957, skips 0 — all match baseline (delta 0).
  - [x] Skip count unchanged (0 → 0).
  - [x] Parity one-liner prints `PARITY_OK`.
  - [x] Each AC verified point-by-point — see Completion Notes.
  - [ ] Visual smoke in Expo simulator — **deferred to Alejandro on-device review** (per workflow: dev agent does not run interactive simulator smoke; Alejandro's manual smoke gates merge into `epic-15`).

## Dev Notes

### Architecture & patterns to follow (load-bearing)

- **Pure JSON + JS edit story** — NO native module touch, NO native rebuild. `expo start --clear` is sufficient for the simulator smoke; do NOT trigger `npx expo run:ios` (per `feedback_native_module_rebuild.md`, that's reserved for native module changes).
- **i18n parity invariant** — `src/i18n/__tests__/i18n.test.ts:34–41` enforces object-key parity between `es.json` and `en.json`. We are changing VALUES not keys, so this is trivially preserved, but DO NOT add a key to one locale and forget the other (the test will fail loudly).
- **`¿` Unicode escape preservation** — `es.json` uses `¿` (line 15) and `ñ` / similar across the file. The existing file follows JSON escape convention; do NOT switch to literal Unicode characters in the new ES string. Use `"¿Qué color de ropa quieres combinar?"` (literal: "¿Qué color de ropa quieres combinar?"). Editor copy-paste of literal `¿` will technically work in Node's JSON parser but it breaks the file's stylistic uniformity (not enforced by lint, just a consistency call). Mirror line 15's existing pattern byte-for-byte except for the substituted phrase.
- **t-key-as-mock-string test pattern** — `NewLookCtaCard.test.tsx:29–30` calls `screen.getByText("favorites.newLookCta.title")` because the test mocks i18next to return the key literal. This pattern is value-agnostic and survives any value change; do NOT touch this file. Same pattern in `NewLookCtaCard.test.tsx:51–52` for the a11y assertions. Confirmed by audit on `epic-15` HEAD `c716a03`.
- **`FavoritesList.test.tsx:1047`** — asserts `cta.props.accessibilityLabel === "Start a new look"` against the rendered React tree. The CTA reads from `favorites.newLookCta.a11yLabel` (NOT `.title`), so the test stays green. Confirmed by `NewLookCtaCard.tsx:23` (`accessibilityLabel={t("favorites.newLookCta.a11yLabel")}`). DO NOT preemptively rewrite this assertion.

### Why `a11yLabel` is NOT changed in this story

FR12 in `docs/planning/epic-15/epic-15.md:68` reads: `La string "Empieza un look nuevo" (key favorites.newLookCta.title) se reemplaza por "Monta tu look"`. The `a11yLabel` key is a separate string under the same `newLookCta` block; the epic spec scope is intentionally narrow to `.title`. The visible UI label and the VoiceOver label are now intentionally different — `"Monta tu look"` displayed, `"Empezar un look nuevo"` announced (ES) / `"Build your look"` displayed, `"Start a new look"` announced (EN). Acceptable for v1.4.0; if Alejandro requests parity post-smoke that becomes a follow-up edit (and remains a 2-line change). DO NOT pre-empt.

### Open question to confirm with Alejandro on visual smoke

Per `docs/planning/epic-15/epic-15.md:209` ("validar con Alejandro la EN exacta"), the EN string for `favorites.newLookCta.title` is currently spec'd as **"Build your look"**. This story uses that as the default. If Alejandro's smoke review prefers a different EN ("Style your look", "Curate your look", "Make your look", etc.), that's a 1-line follow-up edit on `en.json:55` with no test impact. Ship the default; Alejandro will redirect if needed.

The EN for `home.subtitle` is **"What color would you like to combine?"** per epic line 209, which is fine as-is.

### File layout

```
src/
  i18n/
    locales/
      es.json                       ← MOD (lines 15 + 55)
      en.json                       ← MOD (lines 15 + 55)
    __tests__/
      i18n.test.ts                  ← MOD (lines 52 + 61 + 70 + 71)
  screens/
    ColorHome.tsx                   ← READ-ONLY (line 297 reads t("home.subtitle"); auto-picks new value)
  components/armario/
    NewLookCtaCard.tsx              ← READ-ONLY (line 50 reads t("favorites.newLookCta.title"); auto-picks new value)
    NewLookCtaCard.test.tsx         ← READ-ONLY (uses t-key-as-mock pattern — value-agnostic)
```

### Reuse — do NOT reinvent

- **No new component, no new hook, no new test file.** This is pure value-replacement. Any temptation to add a "copy-changes-validation helper" or to centralize "all v1.4.0 copy in a constants file" is OUT OF SCOPE — the i18n JSON files ARE the centralization point.
- **Do not touch `tabs.favorites` / `tabs.favoritesTab`** (Story 14.7 changed these to "Mis Looks" / "My looks" — verified at `es.json:6` and `en.json:6`). Those are separate from `favorites.title` and the `newLookCta` block; only `newLookCta.title` is in scope.
- **Do not reformat the JSON file.** `pnpm lint` runs Biome; if your editor reflows the JSON on save, undo that reformat before commit. Diff-only-the-edits is a hard requirement (AC #1, AC #2 explicitly assert "exactly 2 changed lines per file").

### Branch + baseline

- Base branch: `epic-15` HEAD `c716a03` (post-15.1 merge per `sprint-status.yaml:37`).
- Story branch: `story/15-6-copy-changes-d1-d2`.
- Expected post-story baseline (must match exactly): tsc 2 errors / lint 2 errors / **954 passing / 3 pre-existing / 957 total**. Net delta from 15.1 done = 0.
- No native module changes → no `npx expo run:ios` rebuild required. `expo start --clear` is sufficient for the simulator smoke step.

### Project Structure Notes

- All edits stay inside `src/i18n/`. No new files. No file moves. No file deletes.
- The story does NOT trigger any AsyncStorage migration, navigation change, or paywall touch. It does not interact with the `@outfinder/coachmark:*` namespace reserved by Story 15.1 — those keys belong to 15.3 and 15.4.
- Marketing screenshot regeneration (Outcome A item #4 in `docs/planning/epic-15/epic-15.md:240`) is OUT OF SCOPE for this story but the new copy WILL appear in the next screenshot batch — no story coupling, just a flag for the marketing track.

### References

- [Source: docs/planning/epic-15/epic-15.md#Story-15.6 — D1+D2-Copy-changes-ES+EN] (lines 203–219)
- [Source: docs/planning/epic-15/epic-15.md#Functional-Requirements — FR12 + FR13] (lines 68–69)
- [Source: docs/planning/epic-15/epic-15.md#Decisiones-cerradas — none directly impact 15.6, but DEC-1 keeps Visualizer alive so the home funnel still routes there]
- [Source: _bmad-output/implementation-artifacts/sprint-status.yaml:37–39 — 15.1 baseline 954/3/957]
- [Source: src/i18n/locales/es.json:15,55] (current ES strings)
- [Source: src/i18n/locales/en.json:15,55] (current EN strings)
- [Source: src/i18n/__tests__/i18n.test.ts:52,61,70,71] (3 literal-string assertions to update + 1 comment)
- [Source: src/screens/ColorHome.tsx:297] (sole reader of `home.subtitle`)
- [Source: src/components/armario/NewLookCtaCard.tsx:50] (sole reader of `favorites.newLookCta.title`)
- [Source: src/screens/FavoritesList.test.tsx:1047] (asserts `a11yLabel` not `title` — confirms NewLookCta tests are agnostic)
- [Source: CLAUDE.md — "Story Scope: Maximum 4-5 tasks per story", "Acceptance Criteria Verification", "Testing Discipline"]
- [Source: feedback_native_module_rebuild.md] (no native rebuild required for pure JSON+JS edits)
- [Source: feedback_visual_review.md] (Expo simulator visual smoke before code-review handoff)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — bmad-dev-story workflow.

### Debug Log References

- Pre-edit baseline (epic-15 HEAD `c716a03`): tsc **0 errors** (note: spec said 2 — 15.1 cleaned them up; actual baseline is 0), lint **2 errors** (FavoritesList.test.tsx + OutfitVisualizer.tsx — pre-existing format issues), tests **954 passed / 3 failed / 957 total** (the 3 failures are pre-existing locale-detect mocking failures in `i18n.test.ts:131/138/144` — `detectLanguage()` returns "en" for `es-ES`/`es-MX` mocks, unrelated to this story's value changes), skips **0**.
- Post-edit (after Biome auto-format on the 2 newly-touched test files): tsc **0**, lint **2**, tests **954/3/957**, skips **0** → delta 0 vs baseline. All gates match.
- Biome reflowed two assertions onto multi-line form because the new EN strings exceeded the line-width threshold (`i18n.test.ts:52-54` and `ColorHome.test.tsx:197-199`). Applied `npx biome format --write` on those two files only — purely cosmetic, no behavioral change. The 2 pre-existing lint errors (FavoritesList.test.tsx:275-281/477-481 + OutfitVisualizer.tsx:96-98) were left untouched per "out of story scope".

### Completion Notes List

**AC verification (point-by-point per CLAUDE.md):**

- ✅ **AC #1** — `src/i18n/locales/es.json` diff shows EXACTLY 2 changed lines (15 + 55). `¿` and `é` Unicode escapes preserved (verified via `od -c` on raw bytes). `a11yLabel`/`subtitle`/`a11yHint` under `newLookCta` intentionally untouched.
- ✅ **AC #2** — `src/i18n/locales/en.json` diff shows EXACTLY 2 changed lines (15 + 55). `a11yLabel: "Start a new look"` (line 57) intentionally preserved per FR12 narrow scope.
- ✅ **AC #3** — `src/i18n/__tests__/i18n.test.ts` 3 literal-string assertions updated (lines 52, 61/63, 71/73 post-format) + comment at line 70/72 updated to anchor on new D1 phrasing. `home.browseAll` assertion at neighboring line UNTOUCHED.
- ✅ **AC #4** — Grep guard confirmed: `git grep "De qué color es tu ropa hoy\|Empieza un look nuevo\|What color are you wearing\|Start a new look" src/` returns only intentional residuals (`en.json:57` a11yLabel + `FavoritesList.test.tsx:1047` which asserts `accessibilityLabel` mapped to `.a11yLabel` key, NOT `.title`). However, the audit in the story spec MISSED `src/screens/ColorHome.test.tsx:197` which had a literal-string assertion `screen.getByText("What color are you wearing?")` against the OLD home subtitle EN value. Updated to new copy + appended to File List. Net effect: 1 extra test file modified vs spec, but ZERO new tests added/deleted (just an in-place value swap on an existing assertion). Test count unchanged.
- ✅ **AC #5** — All 4 CI gates pass: tsc 0 errors (= baseline), lint 2 errors (= baseline pre-existing), tests 954/3/957 (= baseline exactly, delta 0), skips 0 (= baseline).
- ✅ **AC #6** — `PARITY_OK` printed by the parity one-liner. Trivially preserved since values changed, not keys.

**Open follow-up (per Dev Notes Open Question):** EN string for `favorites.newLookCta.title` defaulted to "Build your look" per epic line 209. Alejandro can redirect to alt verb (Style/Curate/Make) as a 1-line follow-up after on-device smoke if the verb feels off.

**Visual smoke deferred** to Alejandro's on-device review (gate to merge into `epic-15`).

### File List

Modified:
- `src/i18n/locales/es.json` — 2 value changes (lines 15, 55)
- `src/i18n/locales/en.json` — 2 value changes (lines 15, 55)
- `src/i18n/__tests__/i18n.test.ts` — 3 assertion updates + 1 comment update (Biome reflowed line 52 onto 3 lines: 52-54)
- `src/screens/ColorHome.test.tsx` — 1 assertion update (Biome reflowed line 197 onto 3 lines: 197-199) — NOT in original spec audit, caught by post-edit grep guard

No new files. No file deletes. No file moves.

### Review Findings

- [x] [Review][Defer] `newLookCta.a11yHint` stale in EN + ES after title verb change [en.json:58, es.json:58] — deferred, pre-existing — EN hint still says "to start a look", ES says "para empezar un look" while title is now "Build/Monta"; copy drift, non-blocking
- [x] [Review][Defer] `newLookCta.subtitle` (EN) now echoes new title identically ("build your look" × 2) [en.json:56] — deferred, pre-existing — minor copy redundancy; pre-existed with old title "Start a new look" vs subtitle "...build your look", slightly more visible now
- [x] [Review][Defer] Design / doc drift: pencil-new.pen (7 occurrences), home-redesign-spec.md (3 occurrences), prd.md:106 reference old `home.subtitle` copy — deferred, no runtime impact

## Change Log

| Date       | Description                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-04-26 | Initial story spec created (create-story for D1+D2 v1.4.0 copy changes)                                           |
| 2026-04-26 | Implementation: 4 i18n value swaps (es+en, 2 keys) + 4 test assertion/comment updates. Baseline preserved (delta 0). |
| 2026-04-26 | Code review: 0 patches applied; 3 deferred (D-15.6-1 a11yHint verb drift EN+ES, D-15.6-2 subtitle redundancy, D-15.6-3 doc/design drift); ~9 dismissed (false positive, by-design a11yLabel divergence, pre-existing patterns). Status: done. |
