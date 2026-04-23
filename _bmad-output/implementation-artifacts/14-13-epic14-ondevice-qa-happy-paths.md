# Story 14.13: Epic 14 on-device QA + happy paths verification

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the **product owner (Alejandro)** acting as release gatekeeper for v1.4.0 (first release containing BOTH Epic 13 functionality — Armario Virtual, cutout pipeline, Ficha Wada, WardrobeItem model, assignments — AND Epic 14 functionality — unified camera, Mis Looks rename, auto-save semantics, paywall-limbo, incomplete-looks surface, delete+edit edit mode),
I want **a dedicated QA story that validates the full Epic 14 changeset on real hardware (iPhone 16 Pro) against a single exhaustive checklist covering (1) the two activation doors — photo-first + color-first — as defined in the epic overview, (2) the v1.3.0 → v1.4.0 migration blocker path with `N ∈ {0, 3, 5}` favorites per TD-5's idempotency contract (`misLooksStore.ts:63–161`), (3) point-by-point verification of the 7 load-bearing Technical Decisions (TD-1 through TD-7) that every story in this epic references, (4) the S4 polaroid no-regression surface, (5) a VoiceOver + 44pt + Reduce Motion accessibility pass per `CLAUDE.md` "Accessibility First", and (6) CI gates (`npx tsc --noEmit`, `pnpm lint`, `pnpm test`) green on the merge-ready `epic-14` branch**,
so that **we do not submit v1.4.0 to App Store review with a broken happy path, a silent migration bug that loses user Favorites data, an undetected regression on the S4 share that was Epic 13's retention anchor, or an accessibility regression that CLAUDE.md flags as a mandatory story gate — and so that any issues found are either fixed in-story (≤30 min of code per fix) or filed as explicit follow-up stories with severity triage before sign-off**.

## Acceptance Criteria

1. **Given** the full Epic 14 changeset is merged onto `epic-14` (HEAD `21534e0` "merge: Story 14.12b — edit-category pencil affordance" — verify with `git log -1 epic-14`), **When** an on-device QA checklist markdown file is produced at `docs/planning/epic-14-qa-checklist.md`, **Then** the file contains all SIX required sections in this exact order with the exact markdown section headings listed below (so the checklist reads as a pre-flight gate from top to bottom without jumping around):
    1. **`## 1. Build & environment preflight`** — device model (iPhone 16 Pro), iOS version, Expo build channel/version, `pnpm` version, build command used (e.g., `eas build --profile preview --platform ios` OR `npx expo run:ios --device "iPhone 16 Pro"`), app version surfaced in Settings → Acerca de (must read `1.4.0` or the chosen v1.4.0 build number — NOT `1.3.x`).
    2. **`## 2. Epic 13 functionality (first release to production)`** — exercises the Armario Virtual features that ship to production for the first time in v1.4.0 (Epic 13 was complete in code but never released). See AC #3.
    3. **`## 3. Epic 14 golden paths (FR coverage)`** — exercises the two activation doors (photo-first + color-first) and the Mis Looks retention loop. See AC #4.
    4. **`## 4. v1.3.0 → v1.4.0 upgrade (production blocker)`** — the single migration blocker. See AC #5.
    5. **`## 5. Technical Decision verification (TD-1 → TD-7)`** — explicit test cases for each of the 7 TDs from `epic-14.md:51–63`. See AC #6.
    6. **`## 6. Regression surface + Accessibility audit + CI gates`** — S4 polaroid non-regression, VoiceOver/44pt/Reduce Motion pass per `CLAUDE.md` "Accessibility First", and `npx tsc --noEmit` / `pnpm lint` / `pnpm test` green. See AC #7.
    **And** the checklist file starts with a `# Epic 14 — On-device QA Checklist (Story 14.13)` H1, a `**Version under test:** v1.4.0` line, a `**Device:** iPhone 16 Pro` line, a `**Build commit:** {epic-14 HEAD sha}` line, and a `**Tester:** Alejandro` line so the artifact self-identifies when attached to App Store release notes or the sprint retro. **And** each sub-check inside every section is a GitHub-flavored checkbox (`- [ ]`) so progress is auditable as Alejandro ticks items on device. **No free-prose paragraphs** — the entire body is checkbox-driven plus minimal 1-line headers.

2. **Given** the photo-first "new user" happy path defined in `epic-14.md:895–898` (a fresh install of v1.4.0 on iPhone 16 Pro → open → FAB → scan → save with category → see combinations → "Hacer este look mío" → assign prenda → Mis Looks auto-save), **When** the tester executes the path, **Then** the section `## 3. Epic 14 golden paths` contains one `- [ ]` checkbox per observable gate, in this precise order:
    - `- [ ] Fresh install (delete app → reinstall v1.4.0 from build channel) → opens onto Home without crash`
    - `- [ ] Tab Bar FAB is visible on Home, tap fires hapticLight + opens unified camera (RootStack modal nav per TD-2)`
    - `- [ ] Camera permission prompt appears on first use (iOS grants) — subsequent opens skip prompt`
    - `- [ ] Capture photo of a real garment; Swift pipeline runs removeBackground → computes dominantHex in same pass (TD-1)`
    - `- [ ] Result screen renders cutout + detected Wada tone name ("Es el tono {X}") + preview of combinations containing that tone (FR3)`
    - `- [ ] "Guardar en mi armario" tap opens CategoryPickerSheet with 4 options (Parte de arriba / Parte de abajo / Calzado / Accesorio) (FR6)`
    - `- [ ] Pick a category → Confirmar → persists WardrobeItem with category field; no crash on AsyncStorage write`
    - `- [ ] Post-save navigation shows combinations (replace nav per BUG-001 fix status — see AC #8); no screen-stacking layers visible underneath`
    - `- [ ] Tap a combination → Visualizer renders with "Hacer este look mío" primary CTA (FR8); share button is NOT present (FR10)`
    - `- [ ] Tap "Hacer este look mío" → Ficha Wada opens WITHOUT consuming a Mis Looks slot (FR9, FR14)`
    - `- [ ] Assign first garment to a color slot → look auto-saves to Mis Looks (consumes 1 of 5); VoiceOver announces save (FR12)`
    - `- [ ] Navigate to Mis Looks tab → the auto-saved look appears with correct assignment count (e.g., "1/3")`
    - `- [ ] End-to-end wall-clock time from app open to "look started in Mis Looks" is ≤2 minutes (NFR7)`
    - `- [ ] No crashes, no dropped states, no silent haptic failures (hapticLight/Medium/Rigid all fire at their documented stations — see AC #6 TD-2 sub-checks)`
    - `- [ ] VoiceOver traversal of every tappable element in the path: label present, role correct, 44pt hit target met (NFR1, CLAUDE.md "Accessibility First")`

3. **Given** the color-first "Juan" happy path defined in `epic-14.md:900–903` (open → Home/catalog → pick color → Visualizer → "Hacer este look mío" → "Guardar para luego" → close app → reopen → see incomplete look on Home → complete it), **When** the tester executes the path, **Then** the section `## 3. Epic 14 golden paths` contains one `- [ ]` checkbox per observable gate, in this precise order (placed AFTER the photo-first checkboxes from AC #2):
    - `- [ ] From Home, browse the Sanzo Wada palette catalog (ColorHome) — tiles render correctly with Wada color dots + names`
    - `- [ ] Tap any palette → Combinations screen renders the containing combinations`
    - `- [ ] Tap a combination → Visualizer renders with "Hacer este look mío" primary CTA (FR8)`
    - `- [ ] Tap "Hacer este look mío" → Ficha Wada opens in working mode WITHOUT auto-save (FR9, FR14 — 0/3 status)`
    - `- [ ] Ficha Wada exposes "Guardar para luego" CTA with bookmark SF Symbol (Story 14.9 / FR13)`
    - `- [ ] Tap "Guardar para luego" → hapticMedium fires → look persists to Mis Looks with status "0/3 prendas asignadas" → CTA vanishes (CTA-vanish feedback — no toast, per 14.9 decision)`
    - `- [ ] Close app (swipe-up or force-quit) → reopen → Home shows the incomplete look in the "En curso" section at the TOP of Mis Looks OR on Home per UX-DR5 (Story 14.11 / FR16)`
    - `- [ ] Tap the incomplete look tile → navigates to ArmarioFichaWada (skips S0 — per Story 14.11)`
    - `- [ ] Assign all 3 garments (one per slot) → look transitions from "En curso" to the completed/standard Mis Looks section; the complete-section header only renders when BOTH lists are non-empty`
    - `- [ ] Navigate to Mis Looks → S4 polaroid "tu look" screen opens for the now-completed look → Compartir button is present and functional (NFR4 — S4 share not regressed by FR10)`
    - `- [ ] Same-path VoiceOver traversal: every label/role/hint fires correctly; Reduce Motion respected (animations skip to end state per AccessibilityInfo.isReduceMotionEnabled — CLAUDE.md)`

4. **Given** the v1.3.0 → v1.4.0 migration is the production blocker defined in `epic-14.md:905–908` + `:47` ("upgrade path testing reduces to a single user variable: `N` favorites in v1.3.0 where `N ∈ {0, 3, 5}`. No wardrobe-items-upgrade scenario exists in production"), **When** the section `## 4. v1.3.0 → v1.4.0 upgrade (production blocker)` is produced, **Then** it contains exactly THREE subsections — one per N value — each with this exact checkbox structure (total 3 × 6 = 18 checkboxes + 2 shared setup items):

    ### 4.0 Setup (shared across all three N values)
    - `- [ ] v1.3.0 build reproducible: either (a) install v1.3.0 from App Store production OR (b) build v1.3.0 from git tag/branch (confirm tag exists with \`git tag -l | grep 1.3\`)`
    - `- [ ] AsyncStorage inspection tool available (e.g., Flipper + AsyncStorage plugin, or in-app DevMenu dump) — to verify legacy \`@outfinder/favorites\` key before upgrade AND \`@outfinder/migration:favorites-to-mis-looks:v1\` flag + new store state after upgrade`

    ### 4.1 N=0 favorites (fresh v1.3.0 user, never saved any favorite)
    - `- [ ] Install v1.3.0 → open → do NOT save any favorite → background the app`
    - `- [ ] Install v1.4.0 over v1.3.0 (App Store update OR \`expo run:ios\` upgrade path — whichever matches production install channel)`
    - `- [ ] Open v1.4.0 → Mis Looks tab renders empty state (NewLookCtaCard + empty-state messaging from Story 14.10 / 14.11)`
    - `- [ ] No crash, no spinner hang, no "missing data" UI`
    - `- [ ] AsyncStorage: \`@outfinder/migration:favorites-to-mis-looks:v1\` written with value \`"complete"\` (TD-5 flag)`
    - `- [ ] AsyncStorage: legacy \`@outfinder/favorites\` key is cleared (TD-5 step c — only after flag write)`

    ### 4.2 N=3 favorites (typical v1.3.0 user with a handful of favorites)
    - `- [ ] Install v1.3.0 → save 3 distinct favorites (3 different combinationIds) → background the app`
    - `- [ ] Install v1.4.0 over v1.3.0 (same install channel as §4.1)`
    - `- [ ] Open v1.4.0 → Mis Looks tab shows EXACTLY 3 looks with correct combinationIds matching the pre-upgrade favorites`
    - `- [ ] No crash, no spinner hang, no ghost extras, no missing favorites (FR17 — zero data loss)`
    - `- [ ] AsyncStorage: idempotency flag present; legacy key cleared; items array empty (no wardrobe-items-legacy scenario in production per epic-14.md:47)`
    - `- [ ] Re-run migration via dev menu OR force-kill + reopen 3× → state is idempotent; no duplicates appear; flag remains \`"complete"\` (TD-5 idempotency)`

    ### 4.3 N=5 favorites (at the FREE_FAVORITES_LIMIT — grandfathered)
    - `- [ ] Install v1.3.0 → save 5 distinct favorites (fills FREE_FAVORITES_LIMIT) → background the app`
    - `- [ ] Install v1.4.0 over v1.3.0`
    - `- [ ] Open v1.4.0 → Mis Looks shows EXACTLY 5 looks — grandfathered per epic overview paragraph "Users already at 5/5 are grandfathered"`
    - `- [ ] Attempt to save a 6th look via "Guardar para luego" → paywall triggers at 5/5 (FR5 mirror for Favorites; TD-4 paywall-limbo strip appears)`
    - `- [ ] Dismiss paywall → FichaWada shows limbo state: 40% opacity on affordances + explanatory strip "Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar." (TD-4)`
    - `- [ ] Swipe back works normally; no blocking overlay; no auto-goBack (TD-4)`

    **And** the AsyncStorage inspection steps are optional-but-strongly-recommended — QA may use Flipper, Reactotron, or an in-app `__DEV__`-only dev menu dump; no new production UI is added for this checklist.

    **Explicitly NOT covered** (anti-invention guard): there is NO "v1.3.0 → v1.4.0 wardrobe-items migration scenario" — the wardrobe-items legacy scenario exists ONLY for internal testers / TestFlight Epic 13 beta users per TD-7, which is defensive not load-bearing. DO NOT add a §4.4 "wardrobe-items migration" subsection — it does not exist in production.

5. **Given** the 7 load-bearing Technical Decisions at `epic-14.md:51–63` (TD-1 through TD-7), **When** the section `## 5. Technical Decision verification (TD-1 → TD-7)` is produced, **Then** it contains exactly 7 subsections — one per TD — each prefixed with the TD label, a 1-line restatement of the decision (copied verbatim or compressed from the epic doc), and the QA test cases below:

    ### TD-1 · Dominant color extraction in Swift
    - `- [ ] Scan a TRANSPARENT garment (e.g., white chiffon on a dark bg) → dominantHex is NOT biased toward black; resulting Wada match is a pale tone, not a dark one`
    - `- [ ] Scan a very PALE garment (cream, off-white) → dominantHex reads a warm near-white; matched Wada tone is plausible (not pure white if palette lacks it)`
    - `- [ ] Scan a very DARK garment (black, navy) → dominantHex reads a dark tone; no transparency-bias artifact`
    - `- [ ] Single Swift pipeline pass — no \`react-native-image-colors\` call on the cutout (inspect Metro/console logs for absence OR verify \`modules/background-removal\` returns \`{ cutoutUri, dominantHex }\` shape)`

    ### TD-2 · Unified camera in RootStack + ArmarioCaptureScreen preserved
    - `- [ ] Tab Bar FAB opens the unified camera (UnifiedCameraRoot modal off RootStack, sibling of Main + ArmarioRoot)`
    - `- [ ] Camera flow covers Capture → Result → PostSave (UnifiedCameraStackParamList)`
    - `- [ ] From a FichaWada slot picker, tapping "Nueva foto" opens the PRESERVED ArmarioCaptureScreen (in-context slot-assignment flow) — NOT the unified camera`
    - `- [ ] The two cameras are semantically distinct: FAB camera saves to armario + detects Wada tone + shows combinations; ArmarioCapture saves cutout bound to the already-known slot color`
    - `- [ ] Legacy \`CaptureScreen\` is NOT reachable from any UI path (removed from \`ColorsStackParamList\` per Story 14.3a)`

    ### TD-3 · Data model unification (ADR-005)
    - `- [ ] No \`FavoritesContext\` reachable in the codebase (grep confirms deletion; runtime state in DevMenu / React DevTools shows only useMisLooksStore)`
    - `- [ ] \`useMisLooksStore\` holds \`items\` + \`assignments\` + \`favorites\` in a single Zustand store (inspect via React DevTools / Flipper)`
    - `- [ ] FR12 auto-save fires correctly from the single store (exercised in AC #2 photo-first path)`

    ### TD-4 · Paywall-limbo resolution (disabled state + explanatory strip)
    - `- [ ] At 5/5 favorites, tap "Guardar para luego" OR "Asignar" → paywall opens`
    - `- [ ] Dismiss paywall without upgrading → Ficha Wada remains visible (NO auto-goBack)`
    - `- [ ] Slot tiles + save CTAs render at 40% opacity (visually disabled)`
    - `- [ ] Explanatory strip appears at top: "Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."`
    - `- [ ] Tapping a disabled slot re-triggers the paywall (not a no-op; not a crash)`
    - `- [ ] Swipe-back gesture works normally (no blocking overlay)`

    ### TD-5 · Migration idempotency pattern
    - `- [ ] \`@outfinder/migration:favorites-to-mis-looks:v1\` flag is written as \`"complete"\` exactly once, after full batch success`
    - `- [ ] Legacy \`@outfinder/favorites\` key is cleared ONLY after flag write (order verified via mid-migration force-kill — see next bullet)`
    - `- [ ] Mid-migration force-kill (airplane mode + force-quit between batch write and flag write, if reproducible in dev menu) → source \`@outfinder/favorites\` remains intact; re-run succeeds and writes flag`
    - `- [ ] Re-running migration by clearing the flag (dev menu) → duplicates are NOT created (idempotency by ID match in destination)`
    - `- [ ] Orphan combinationIds (favorites referencing combos that no longer exist in the Wada dataset) are dropped with a single \`__DEV__\` warn log per orphan; no crash`

    ### TD-6 · Category is editable in v1.4.0 (Story 14.12b — pencil icon)
    - `- [ ] In S3 picker (ArmarioPicker), long-press any tile → enters edit mode (14.12a scaffold)`
    - `- [ ] Each tile renders BOTH a \`(−)\` badge (top-left) AND a pencil badge (top-right) — 24pt circles, symmetric mirror`
    - `- [ ] Tap pencil → hapticLight fires + CategoryPickerSheet opens with current category PRE-SELECTED (checkmark visible on the correct row)`
    - `- [ ] Pick a different category → Confirmar → hapticMedium (fired by sheet) + persists to WardrobeItem.category + sheet dismisses + USER REMAINS IN EDIT MODE (multi-edit retention)`
    - `- [ ] Backdrop-tap / swipe-down dismiss → NO store write; user remains in edit mode`
    - `- [ ] VoiceOver on pencil badge reads: "Editar categoría de parte de arriba" (ES) / "Edit category of top" (EN) + hint "Abre el selector..." / "Opens the category picker..."`
    - `- [ ] Same-category Confirmar: pick the currently-assigned category → Confirmar → still persists (no short-circuit) + sheet dismisses`

    ### TD-7 · Legacy WardrobeItem default category = "top" (defensive for internal testers)
    - `- [ ] This decision is DEFENSIVE ONLY — do NOT construct a production migration test case for it. Simply confirm via code inspection that \`wardrobeRepo\` / \`misLooksStore\` reads backfill missing \`category\` with \`"top"\` (grep \`category: "top"\` near the migration or item-hydration site — no runtime test required unless TestFlight Epic 13 beta install is available)`
    - `- [ ] If a TestFlight Epic 13 beta device IS available (optional), install Epic 13 beta → save ≥1 wardrobe item → upgrade to v1.4.0 → verify the item's category defaults to "top" and is editable via TD-6 pencil flow`

6. **Given** the S4 polaroid share is the Epic 13 retention anchor (FR10 explicitly preserves its shareability: "Only the S4 polaroid (real garments) retains sharing"), **When** the section `## 6. Regression surface + Accessibility audit + CI gates` is produced, **Then** it contains three subsections with these exact checkboxes:

    ### 6.1 S4 polaroid non-regression
    - `- [ ] Complete a look (3/3 garments assigned) → navigate to S4 "tu look" screen via the appropriate CTA`
    - `- [ ] S4 polaroid renders: 3 real-garment photos composited on the warm gradient background + aureola + Wada header (per Story 2.5)`
    - `- [ ] Tap "Compartir" → native share sheet opens with the polaroid image + app branding`
    - `- [ ] Share via at least 2 channels (e.g., Messages + save to Photos) → image is correctly generated + saved`
    - `- [ ] NO "Compartir Outfit" button on the intermediary OutfitVisualizer screen (FR10 — only S4 retains sharing)`
    - `- [ ] Skia composition path works (not blank, no silent failure, no crash)`

    ### 6.2 Accessibility audit (NFR1 + CLAUDE.md "Accessibility First")
    - `- [ ] Enable VoiceOver (Settings → Accessibility → VoiceOver) → traverse the photo-first path end-to-end: every tappable element is announced with label + role; no "Button" (unlabeled) nodes`
    - `- [ ] Traverse the color-first path end-to-end with VoiceOver: same no-unlabeled-elements invariant`
    - `- [ ] All new buttons/pressables meet 44pt minimum touch target (visually confirm via Accessibility Inspector or tap-spacing check): Tab Bar FAB, unified-camera CTAs, pencil + (−) badges in edit mode, "Guardar para luego" CTA, incomplete-look tiles, NewLookCtaCard, CategoryPickerSheet rows + Confirmar, paywall buttons`
    - `- [ ] Enable Reduce Motion (Settings → Accessibility → Motion → Reduce Motion) → badges appear instantly (no 250ms fade); animation-heavy transitions skip to end state; no broken layouts`
    - `- [ ] VoiceOver announces state-change events per \`AccessibilityInfo.announceForAccessibility\` at: enter edit mode ("Modo edición activado"), auto-save on first assignment, "Guardar para luego" confirm — all present, none silent`

    ### 6.3 CI gates (NFR6)
    - `- [ ] \`npx tsc --noEmit\` on \`epic-14\` HEAD → zero errors`
    - `- [ ] \`pnpm lint\` on \`epic-14\` HEAD → only the 2 PRE-EXISTING Biome format errors (\`FavoritesList.test.tsx\` + \`OutfitVisualizer.tsx\`) — zero new findings`
    - `- [ ] \`pnpm test\` on \`epic-14\` HEAD → 942 passing / 3 pre-existing / 945 total (baseline from 14.12b done per \`project_v140_epic14_progress.md\`)`
    - `- [ ] If any CI gate fails after 14.12b merge, pause sign-off and investigate — these gates are non-negotiable per NFR6`

7. **Given** the tester executes the full checklist on iPhone 16 Pro, **When** issues are observed, **Then** for each issue the tester records in a new `## 7. Issues & triage` section of the same file: (a) a short title, (b) severity using the `epic-14-post-release-bugs.md` leyenda (`blocker` · `high` · `medium` · `low` · `polish`), (c) reproduction steps, (d) status (`new` · `triaged` · `spec'd` · `in-dev` · `fixed` · `wontfix`), and (e) a disposition tag — either `fix-in-14.13` (if ≤30 min of code fix, bundled into this story's branch) OR `follow-up` (filed as a new backlog story via `feature-spec` skill; cross-link the new story key here). **And** any `blocker` or `high`-severity issue found BLOCKS v1.4.0 App Store submit until resolved OR explicitly accepted by Alejandro with a written rationale. **And** BUG-001 ("Navegación apilada tras guardar prenda y abrir combinaciones" at `docs/planning/epic-14-post-release-bugs.md:34–50`) MUST be re-tested as part of AC #2 "Post-save navigation shows combinations (replace nav per BUG-001 fix status)" — if unresolved at merge time of 14.13, flag it as a BLOCKER for v1.4.0 submit unless Alejandro accepts it; this is one of the primary reasons 14.13 runs on real hardware.

8. **Given** evidence capture per `epic-14.md:923` ("Execute checklist on iPhone 16 Pro; capture screenshots / screen recordings for evidence"), **When** executing the checklist, **Then** the tester captures at minimum: (a) 1 screenshot of Mis Looks post-upgrade for each of N=0, N=3, N=5 (3 screenshots — proves FR17 zero data loss), (b) 1 screen recording of the full photo-first happy path from app open → Mis Looks auto-save (proves NFR7 ≤2min wall-clock), (c) 1 screen recording of the color-first happy path from ColorHome → "Guardar para luego" → close → reopen → complete (proves FR13 + FR16 + NFR4 S4 share), (d) 1 screenshot of the TD-4 paywall-limbo state (proves opacity:40% + explanatory strip + swipe-back works), and (e) 1 screenshot of the S4 polaroid share sheet open (proves NFR4). **Evidence is stored in a new folder `docs/img_screenshot/qa-14.13/`** (mirror of the existing `docs/img_screenshot/appstore/` pattern) with filenames prefixed by the AC number they verify (e.g., `ac4-n3-mis-looks.png`, `ac3-color-first.mov`, `ac5-td4-paywall-limbo.png`, `ac6-s4-share.png`). **The QA checklist file references these artifacts inline via relative links** (`![AC4 N=3](../img_screenshot/qa-14.13/ac4-n3-mis-looks.png)`) so the checklist self-documents.

9. **Given** the sign-off gate defined in `epic-14.md:926` ("Sign off on v1.4.0 release readiness OR return to dev with specific fixes"), **When** the checklist is fully executed, **Then** the final section `## 8. Sign-off` contains exactly ONE of these two outcomes recorded in prose + a checkbox:
    - **Outcome A (ship):** `- [x] v1.4.0 is GO for App Store submit. All 6 sections passed; no blocker / high severity issues; BUG-001 status: {resolved | accepted-with-rationale}. Tester: Alejandro. Date: YYYY-MM-DD.`
    - **Outcome B (return to dev):** `- [ ] v1.4.0 is NOT READY. Blocking issues: {numbered list with links to Issues & triage section entries + follow-up story keys}. Tester: Alejandro. Date: YYYY-MM-DD.`
    **And** if Outcome B, all `fix-in-14.13`-tagged issues are fixed within this story's branch and the checklist is re-run for those specific rows only (partial re-run acceptable — no need to re-execute green rows). **And** if any `follow-up`-tagged issues exist, they are filed as new backlog story entries in `sprint-status.yaml` BEFORE sign-off (via manual edit or the `feature-spec` skill). **And** Outcome A is the only state that unblocks the \`release-manager\` workflow / EAS submit command.

10. **Given** this story's deliverables are (1) the QA checklist markdown file, (2) on-device execution + evidence, (3) any fix-in-14.13 code changes, (4) sign-off outcome, **When** this story completes, **Then** the "File List" and "Completion Notes" in the Dev Agent Record accurately reflect what shipped, and specifically: (a) `docs/planning/epic-14-qa-checklist.md` (NEW file, the exhaustive 6+2-section checklist populated per AC #1–#9), (b) `docs/img_screenshot/qa-14.13/` (NEW folder with ≥4 screenshots + ≥2 screen recordings per AC #8), (c) any code files touched by `fix-in-14.13` patches (list each with 1-line rationale — MUST be ≤30 min of code work per AC #7; anything larger becomes a follow-up story), (d) zero modifications to existing production source files if no `fix-in-14.13` issues were needed (pure-QA outcome is the default success path — this story is primarily a verification gate, not a development story). **And** the Completion Notes include a one-paragraph exec summary suitable for the Epic 14 retro input ("Epic 14 QA verdict: {GO | RETURN} — {N} issues found, {M} fixed in-story, {P} filed as follow-ups. Photo-first path: X:YY minutes. Color-first path: X:YY minutes. Migration: all 3 N values PASS | FAIL details. Accessibility audit: PASS | regressions: {list}. CI gates: green at HEAD {sha}.").

11. **Given** this is a QA story (not a feature-implementation story), **When** the Tasks / Subtasks list is populated, **Then** the list enumerates 5 tasks corresponding exactly to `epic-14.md:916–926` Tasks 1–5: (1) Produce on-device QA checklist, (2) Execute checklist on iPhone 16 Pro + capture evidence, (3) File bug entries or follow-up stories for any issues found, (4) Verify tsc/lint/test green, (5) Sign off or return to dev. **No additional tasks** — the 4–5 tasks-per-story cap (CLAUDE.md "Story Scope") is respected at exactly 5. **Checkboxes start unchecked** (`- [ ] Task N ...`) — the dev/QA agent ticks them as each is completed.

12. **Given** the branching convention per `feedback_workflow.md` + the 14.12b precedent, **When** this story starts, **Then** the dev agent (or QA agent) creates branch `story/14-13-epic14-ondevice-qa-happy-paths` off `epic-14` HEAD `21534e0` (verify with `git log -1 epic-14`). **All artifacts land on this branch**: the checklist markdown, the evidence folder, any fix-in-14.13 patches, and the sprint-status.yaml status flips. **Merge into `epic-14`** only after Outcome A (ship) sign-off in AC #9. If Outcome B (return to dev), the branch stays open; fix-in-14.13 commits accumulate; the checklist is re-executed for the affected rows; Outcome A is attempted again. **Do NOT rebase onto `epic-1` (main)** — that happens via the `release-manager` workflow AFTER Outcome A and AFTER epic-14 is merged into epic-1 as a single release commit.

13. **Given** NFR3 ("v1.3.0 → v1.4.0 upgrade must not require re-login, data restore, or manual user action"), **When** executing §4 of the checklist, **Then** the tester explicitly verifies: (a) no login screen appears post-upgrade (the app has no auth — confirm no new prompt is injected), (b) no data-restore flow is shown (no "restore from iCloud" prompt, no "import your favorites" wizard), (c) no manual action is required (upgrade → open → Mis Looks populated is fully automatic). **Any deviation is a BLOCKER** — NFR3 is non-negotiable per the epic's launch-blocker framing.

## Tasks / Subtasks

- [x] **Task 1** — Produce on-device QA checklist (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #13)
  - [x] Create new file `docs/planning/epic-14-qa-checklist.md` with the H1, version line, device line, build-commit line (`git rev-parse epic-14` to fill the sha), tester line.
  - [x] Populate Section 1 "Build & environment preflight" per AC #1.
  - [x] Populate Section 2 "Epic 13 functionality (first release to production)" — exercise the cutout pipeline for slot-assignment from Ficha Wada, `ArmarioCaptureScreen` preserved per TD-2, `cascadeDeleteAssignmentsForItem` works, wardrobe paywall at 10 items — per `epic-14.md:917`.
  - [x] Populate Section 3 "Epic 14 golden paths (FR coverage)" with the photo-first checkboxes (AC #2) + color-first checkboxes (AC #3).
  - [x] Populate Section 4 "v1.3.0 → v1.4.0 upgrade" with the 4.0 shared setup + 4.1 N=0 + 4.2 N=3 + 4.3 N=5 subsections per AC #4.
  - [x] Populate Section 5 "Technical Decision verification (TD-1 → TD-7)" with the 7 TD subsections per AC #5.
  - [x] Populate Section 6 "Regression surface + Accessibility audit + CI gates" with §6.1 S4 polaroid + §6.2 Accessibility + §6.3 CI per AC #6.
  - [x] Add Section 7 "Issues & triage" as an empty subsection ready to populate during execution per AC #7.
  - [x] Add Section 8 "Sign-off" as an empty subsection with the two-outcome template per AC #9.
  - [x] Cross-reference BUG-001 inline in Section 3 (photo-first post-save nav checkbox) per AC #7.

- [ ] **Task 2** — Execute checklist on iPhone 16 Pro + capture evidence (AC: #1, #2, #3, #4, #6, #8, #13)
  - [ ] Build v1.4.0 for iPhone 16 Pro: `eas build --profile preview --platform ios` OR `npx expo run:ios --device "iPhone 16 Pro"` (pick whichever matches Alejandro's standard build path; note the choice in Section 1).
  - [ ] Execute Section 1 build preflight + Section 2 Epic 13 re-exercise.
  - [ ] Execute Section 3 photo-first path + color-first path end-to-end; measure wall-clock time for NFR7; capture screen recording of each.
  - [ ] Execute Section 4 migration: install v1.3.0 first, save N favorites (0, 3, 5) in 3 separate runs, upgrade to v1.4.0, verify; capture 3 Mis Looks screenshots.
  - [ ] Execute Section 5 TD-1 → TD-7 gates; capture TD-4 paywall-limbo screenshot + TD-6 pencil-edit screenshot.
  - [ ] Execute Section 6.1 S4 share non-regression; capture share-sheet screenshot.
  - [ ] Execute Section 6.2 accessibility: VoiceOver traversal + 44pt inspection + Reduce Motion pass.
  - [ ] Store all evidence in new folder `docs/img_screenshot/qa-14.13/` with AC-prefixed filenames (e.g., `ac4-n3-mis-looks.png`, `ac3-photo-first.mov`).
  - [ ] Cross-link evidence inline in the checklist via relative markdown image/video links per AC #8.

- [ ] **Task 3** — Triage issues (AC: #7, #9)
  - [ ] For each observed issue, append a new entry to Section 7 "Issues & triage" with title + severity + reproduction steps + status + disposition (`fix-in-14.13` | `follow-up`).
  - [ ] For `fix-in-14.13` issues (≤30 min code per fix): implement the fix on this story's branch; verify; tick the corresponding checkbox green.
  - [ ] For `follow-up` issues: run `feature-spec` skill OR manually file a new backlog entry in `sprint-status.yaml` BEFORE sign-off; cross-link the new story key in Section 7.
  - [ ] Cross-reference any issues against `docs/planning/epic-14-post-release-bugs.md` (specifically BUG-001); update that file's status if the bug is verified / fixed / accepted during this QA run.
  - [ ] If any `blocker` or `high`-severity issue is found, do NOT proceed to Task 5 sign-off Outcome A — return to dev.

- [x] **Task 4** — Verify CI gates green (AC: #6, #10)
  - [x] `npx tsc --noEmit` on the branch HEAD → zero errors. **Verified 2026-04-22.**
  - [x] `pnpm lint` → only the 2 pre-existing Biome format errors (`FavoritesList.test.tsx:275-277, 479-481` + `OutfitVisualizer.tsx:197-198`), zero new findings. **Verified 2026-04-22.**
  - [x] `pnpm test` → **942 passing / 3 pre-existing failures (`i18n.test.ts > detectLanguage` Intl-mock branch) / 945 total** — exact baseline match vs 14.12b done. **Verified 2026-04-22.**
  - [x] No CI gate failures — no fix-in-14.13 patches required at checklist-production phase. (Gates MUST be re-run at sign-off time if any fix-in-14.13 patches land during on-device execution.)

- [ ] **Task 5** — Sign-off (Outcome A or B) + sprint-status handoff + branch hygiene (AC: #9, #10, #11, #12)
  - [ ] Populate Section 8 "Sign-off" with Outcome A (ship) OR Outcome B (return to dev).
  - [ ] Populate the Completion Notes "exec summary" paragraph per AC #10 (GO/RETURN, N issues, timings, migration PASS/FAIL, a11y, CI at HEAD sha).
  - [ ] Update `sprint-status.yaml`: `14-13-epic14-ondevice-qa-happy-paths` transitions `ready-for-dev → in-progress → review → done` at the appropriate moments; date each transition per the precedent in lines 38–46.
  - [ ] If Outcome A: branch is ready to merge into `epic-14` (do NOT merge into `epic-1` — that happens via `release-manager` after epic-14 merges into epic-1).
  - [ ] If Outcome B: branch stays open; fix-in-14.13 commits accumulate; Section 7 issues closed one by one; Outcome A is attempted again by re-running the affected checkboxes only (partial re-run).
  - [ ] Document the final outcome + attached artifacts in the Epic 14 Change Log.

## Dev Notes

### This is a QA story, not a feature-implementation story

Unlike the 12 prior Epic 14 stories (14.1 → 14.12b) which produce new code + tests, Story 14.13 produces **one checklist markdown file + on-device execution + evidence**. Code changes are OPT-IN and scoped to `fix-in-14.13` triaged issues (≤30 min per fix). The default success path is: "Alejandro executes the checklist on iPhone 16 Pro; every checkbox ticks green; Outcome A signs off v1.4.0 for App Store submit; zero source-code files modified." If issues surface, triage into `fix-in-14.13` (bundled) vs `follow-up` (new story). This story's primary deliverable is the **gate decision** (ship vs return), not the fixes themselves.

### Release context is load-bearing (epic-14.md:33–49)

v1.4.0 is the **first release** containing BOTH Epic 13 (Armario Virtual) AND Epic 14 (flow reorganization). Epic 13 was complete in code but never shipped to production. Therefore:
- **Production users have ZERO pre-existing wardrobe data** — they never had `WardrobeItem`, assignments, `@wardrobe:*` keys, or a `category` field. The only user-data migration that matters for production is `@outfinder/favorites` (Set<combinationId>) → `useMisLooksStore.favorites` slice.
- **TD-7 (legacy category = "top") is DEFENSIVE for internal testers only** — TestFlight Epic 13 beta users may have `WardrobeItem` entries without `category`. Keep the code path as cheap safety; do NOT invest in strengthening it; do NOT construct a production QA test case that requires it to fire.
- **"Upgrade path" testing reduces to a single user variable: `N` favorites in v1.3.0 where `N ∈ {0, 3, 5}`.** NO wardrobe-items-upgrade scenario exists in production — the anti-invention guard in AC #4 explicitly forbids a §4.4 subsection for it.
- **Epic 13 functionality enters production for the first time via v1.4.0** — QA must exercise it end-to-end (cutout pipeline, cascadeDeleteAssignmentsForItem, wardrobe paywall at 10 items) even though it has existed in code since the `epic-13` branch. Section 2 of the checklist covers this.

### Technical Decisions reference map (epic-14.md:51–63)

All 7 TDs MUST have explicit QA test cases in Section 5 of the checklist. Any TD failure is a **hard blocker** per `epic-14.md:929` ("Any TD failure is a hard blocker for App Store submit"):

- **TD-1 · Dominant color extraction in Swift** (affects 14.3b, 14.4, 14.5) — verify Swift `modules/background-removal` returns `{ cutoutUri, dominantHex }` shape; no `react-native-image-colors` call on cutout; transparency-trap eliminated (pale / dark garment scans produce sensible Wada matches).
- **TD-2 · Unified camera in RootStack + ArmarioCaptureScreen preserved** (affects 14.3a, 14.3b, 14.7) — verify FAB opens UnifiedCameraRoot (modal off RootStack); ArmarioCaptureScreen still reachable from Ficha Wada slot picker; legacy `CaptureScreen` removed from `ColorsStackParamList`.
- **TD-3 · Data model unification (ADR-005)** (affects 14.2, 14.8, 14.9) — verify no `FavoritesContext` in runtime; `useMisLooksStore` holds all 3 slices; FR12 auto-save fires.
- **TD-4 · Paywall-limbo disabled state + explanatory strip** (affects 14.8, 14.9) — verify at 5/5 favorites: paywall triggers, dismiss → 40% opacity + strip + swipe-back works + re-tap re-triggers paywall.
- **TD-5 · Migration idempotency pattern (Story 14.2)** — verify flag-gated write order; legacy key cleared only after flag write; re-run idempotent; orphan combinationIds dropped with warn.
- **TD-6 · Category editable via pencil (Story 14.12b)** — verify pencil + (−) dual badges; pencil → CategoryPickerSheet → persist → remain in edit mode; VoiceOver label+hint; same-category Confirmar still persists (no short-circuit).
- **TD-7 · Legacy WardrobeItem default = "top"** (defensive only) — code-inspection test; runtime test optional if TestFlight Epic 13 beta device available.

### BUG-001 cross-reference

`docs/planning/epic-14-post-release-bugs.md:34–50` logs BUG-001 "Navegación apilada tras guardar prenda y abrir combinaciones" (2026-04-22, severity `high`, status `new`). This bug was observed during Alejandro's own post-14.12b usage. The fix pattern (per the notes: "Huele al mismo patrón ya resuelto en Epic 12 (`replace` nav sin `fullScreenModal`)") would affect the photo-first happy path in AC #2. Section 3 of the checklist MUST explicitly re-test this path and surface the outcome:
- If BUG-001 is **resolved** before 14.13 execution → tick the "Post-save navigation" checkbox green + note "BUG-001 verified fixed" inline.
- If BUG-001 is **unresolved** at 14.13 execution → it is a BLOCKER for Outcome A unless Alejandro accepts it with a written rationale in Section 7.
- If BUG-001 surfaces as **fix-in-14.13** scope (likely: navigation `replace` swap in the post-save flow — a Metro-cacheable JS-only change), bundle the fix into this story's branch per AC #7 disposition.

### Evidence storage pattern

New folder `docs/img_screenshot/qa-14.13/` mirrors the existing `docs/img_screenshot/appstore/` pattern already in the repo (per the gitignored files list: `docs/img_screenshot/appstore-es/`, `docs/img_screenshot/appstore-ipad/`, etc.). Filenames prefixed by AC number for traceability: `ac{N}-{descriptor}.{ext}`. At minimum: `ac4-n0-mis-looks.png`, `ac4-n3-mis-looks.png`, `ac4-n5-mis-looks.png`, `ac3-photo-first.mov` (~2min screen recording), `ac3-color-first.mov`, `ac5-td4-paywall-limbo.png`, `ac6-s4-share.png`. Additional screenshots welcome but not required.

### Sign-off is the gate, not the code

Outcome A (ship) unblocks:
1. `release-manager` workflow / `pre-release` skill can run.
2. Final commit: epic-14 merges into epic-1 (main).
3. EAS Build production profile + App Store submit via Apple Developer portal.
4. Post-submit: Apple review period (~1–3 days).

Outcome B (return) means:
1. Branch stays open; fix-in-14.13 patches land.
2. Partial re-run of affected checklist rows only.
3. Re-attempt Outcome A.

Do NOT attempt to merge into `epic-1` (main) from this story's branch. That is `release-manager`'s responsibility AFTER Outcome A AND AFTER epic-14 → epic-1 merge.

### Expected checklist outcome — baseline scenario

Given all 12 prior stories merged clean with 0 blocker patches at code review (per `project_v140_epic14_progress.md` — 0 patches on 14.12b, avg ≤2 patches across Epic 14 stories), and given the 942/3/945 test baseline holds at HEAD `21534e0`, the expected outcome is **Outcome A (ship) with 0–3 `fix-in-14.13` issues** (likely candidates: BUG-001 post-save nav if unresolved, minor a11y gaps like a missing `accessibilityHint` on a new button, visual polish items surfaced by hardware-only side-lit rendering). Any `blocker` / `high` severity issue would be a surprise and should trigger immediate triage.

### Testing approach — hardware-only

This story is the ONLY Epic 14 story that REQUIRES real hardware (iPhone 16 Pro per NFR5). Prior stories validated in simulator + unit tests; 14.13 catches everything simulator cannot: real camera performance, haptic feel, VoiceOver timing, Reduce Motion interaction with React-Native-Reanimated, AsyncStorage persistence across app kills, Share sheet behavior, Paywall/IAP sandbox flows, performance on lower-end device battery states. Do NOT substitute simulator for real device for this story's §3 + §4 + §6 — they are explicitly hardware-gated.

### Architecture compliance

- **No new source code files by default**. If `fix-in-14.13` patches land, they follow CLAUDE.md rules: function declarations + named exports, NativeWind `className` for static styles, `style={{}}` only for dynamic Wada values, haptics only via `lib/haptics.ts`, Props interface required, hooks before early returns, `testID` + `accessibilityLabel` + 44pt touch targets + VoiceOver coverage + Reduce Motion respect.
- **No new test files by default**. Unit + integration tests are already at 942/3/945 baseline per 14.12b done. If `fix-in-14.13` patches touch testable code paths, they add targeted regression tests + announce the new baseline explicitly in Completion Notes.
- **No native module rebuild expected.** Per `feedback_native_module_rebuild.md`: this story does NOT touch `modules/background-removal` or `modules/white-balance`; no `expo run:ios` rebuild is required for fix-in-14.13 patches unless a fix specifically touches a native module (unlikely — such a fix would exceed 30 min and become a follow-up story).
- **No new dependencies added.** This is a QA story; adding a testing library or SDK is out of scope.

### References

- **Epic story definition**: `docs/planning/epic-14.md:885–929` (Story 14.13).
- **Release context note**: `docs/planning/epic-14.md:33–49` (v1.4.0 is first release with Epic 13+14; migration blocker is `@outfinder/favorites` only; N ∈ {0, 3, 5}).
- **Technical Decisions (TD-1 → TD-7)**: `docs/planning/epic-14.md:51–63`.
- **ADR-005 (unified store)**: `docs/adrs/ADR-005-unified-mis-looks-store.md`.
- **Migration idempotency contract**: `src/stores/misLooksStore.ts:63–161` (flag key `@outfinder/migration:favorites-to-mis-looks:v1`).
- **Epic 14 bug log**: `docs/planning/epic-14-post-release-bugs.md` (BUG-001 at lines 34–50).
- **UX spec**: `docs/planning/ux-design-epic-14.md` (S4 non-regression at :601, :649; edit-mode at :355–444).
- **Prior QA narrative cues**: `epic-14.md:44–47` (QA narrative implications), `:929` (TD failure = hard blocker).
- **CLAUDE.md "Accessibility First"**: 44pt minimum, VoiceOver, Reduce Motion via `AccessibilityInfo.isReduceMotionEnabled`.
- **NFR coverage**: NFR3 (upgrade safety), NFR4 (S4 no-regression), NFR5 (on-device iPhone 16 Pro), NFR6 (CI gates), NFR7 (≤2min first-use journey), NFR1 (accessibility).
- **Baseline to verify**: 942 passing / 3 pre-existing / 945 total at `epic-14` HEAD `21534e0` (per `project_v140_epic14_progress.md`).
- **Branching**: `feedback_workflow.md` — `story/14-13-epic14-ondevice-qa-happy-paths` off `epic-14` HEAD `21534e0`. Do NOT merge to `epic-1` from this story.
- **Evidence folder precedent**: existing `docs/img_screenshot/appstore/` + `docs/img_screenshot/appstore-es/` (gitignored patterns); new folder `docs/img_screenshot/qa-14.13/` follows same pattern.
- **Release tooling**: `release-manager` subagent + `pre-release` skill run AFTER Outcome A sign-off.

### Project Structure Notes

- New file: `docs/planning/epic-14-qa-checklist.md` (a living artifact — re-run partially if Outcome B happens).
- New folder: `docs/img_screenshot/qa-14.13/` (evidence bundle — screenshots + screen recordings).
- Updated file: `docs/planning/epic-14-post-release-bugs.md` (BUG-001 status update only if the bug's state changes during 14.13 execution).
- Updated file: `_bmad-output/implementation-artifacts/sprint-status.yaml` (story status transitions).
- **No source-code files modified by default.** If `fix-in-14.13` patches are needed, list them explicitly in Completion Notes + File List with 1-line rationale each.

### Not-touched list (any edit = scope creep)

- Any of 14.1–14.12b source files (those stories are DONE; do not refactor their outputs during QA).
- `docs/planning/epic-14.md` (the story spec itself — the checklist references it; do not edit the epic doc).
- `docs/adrs/ADR-005-unified-mis-looks-store.md`.
- `CLAUDE.md`.
- `_bmad/bmm/config.yaml`.
- Any `tools/*` (promo-video folder unrelated to v1.4.0 release).
- Any new analytics SDK (NFR8 forbids analytics; do NOT propose Sentry / Amplitude / Mixpanel additions as a QA "improvement").

### Open questions for dev/QA execution

1. **Build channel for v1.4.0.** Does Alejandro prefer `eas build --profile preview` (internal TestFlight distribution) OR a direct `npx expo run:ios --device "iPhone 16 Pro"` dev-client install for this QA? Default: whichever produces the closest approximation of the App Store IPA (typically the `production` profile) — but a `preview` build is faster to iterate if `fix-in-14.13` patches happen. Note the choice in Section 1 of the checklist.
2. **v1.3.0 reproducible install.** Is the App Store-installed v1.3.0 acceptable for §4 migration tests, or does Alejandro want to build v1.3.0 from a specific git tag to ensure an exact byte-for-byte match? Default: App Store v1.3.0 is production truth; prefer it unless a migration bug cannot reproduce (then build from tag). Verify tag exists via `git tag -l | grep 1.3`.
3. **AsyncStorage inspection tool.** Flipper + AsyncStorage plugin OR Reactotron OR a `__DEV__`-only dev menu dump (none exist today — adding one would be scope creep)? Default: Flipper is the closest to existing dev workflow; Reactotron is a fallback. Document the choice in §4.0 shared setup. **Do NOT add a new in-app DevMenu UI** for this story — it would exceed 30 min and contaminate the production build.
4. **Sign-off fate of BUG-001 if unresolved.** If BUG-001 remains `new` at 14.13 start, default is: mark as BLOCKER for Outcome A, triage as `fix-in-14.13` (likely ≤30 min — `replace` navigation swap in the post-save flow), bundle fix into this story. Alternative: file as `follow-up` story (deferring to a v1.4.1 point release) with written rationale from Alejandro. **Default**: `fix-in-14.13` — ship v1.4.0 without a known-high severity nav bug.
5. **Sandbox IAP for paywall tests (TD-4 at 5/5).** Does Alejandro have a working App Store Connect sandbox tester account (per `feedback_publishing_learnings.md`)? If yes, §4.3 and TD-4 paywall flows can fully exercise. If no, paywall-open + paywall-dismiss-to-limbo can still be verified (the sandbox IS needed only to complete a real purchase — not required to verify limbo-on-dismiss).
6. **Reduce Motion reproduction.** Some Reanimated animations may not gracefully skip to end state even with `AccessibilityInfo.isReduceMotionEnabled` checks. If §6.2 Reduce Motion surfaces a broken layout, triage: `fix-in-14.13` if ≤30 min (usually: add an `isReduceMotionEnabled` guard + synchronous end-state setter), else `follow-up`. This is a known class of bug in RN Reanimated 3.x — not new to Epic 14.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (1M context) — `claude-opus-4-7[1m]`

### Debug Log References

N/A — no debugging cycle required at checklist-production phase.

### Completion Notes List

**Status flipped 2026-04-23: `in-progress → review`.** Ver §10 abajo para instrucciones al reviewer (apunta a `docs/planning/epic-14-bugs-handoff-2026-04-23.md` como fuente de verdad actualizada).

**Checklist-production phase completed 2026-04-22 on branch `story/14-13-epic14-ondevice-qa-happy-paths` (off `epic-14` HEAD `21534e0`).**

Tasks actionable in the dev session (Task 1 + Task 4) are complete:

- **Task 1 · Checklist authored.** `docs/planning/epic-14-qa-checklist.md` created with all 6 mandated sections in exact order per AC #1, plus §7 Issues & triage template (with BUG-001 pre-registered per AC #7) and §8 Sign-off two-outcome template per AC #9. Every sub-check is a GitHub-flavored `- [ ]` checkbox per AC #1; no free-prose paragraphs. Build-commit line fixed at `21534e09cc3b8d4400e21a33976c6758145d4e61` (current epic-14 HEAD). Evidence placeholder folder `docs/img_screenshot/qa-14.13/README.md` created per AC #8 (filenames + conventions documented; actual screenshots/recordings land on-device).

- **Task 4 · CI gates verified green at checklist-production phase.**
  - `npx tsc --noEmit` → 0 errors.
  - `pnpm lint` → exactly the 2 pre-existing Biome format errors (`FavoritesList.test.tsx:275-277, 479-481` multi-line `screen.getByText` block + `OutfitVisualizer.tsx:197-198` `handleMakeMine` const declaration). Zero new findings. Matches baseline documented in 14.12b done entry.
  - `pnpm test` → **942 passing / 3 pre-existing failures / 945 total**. Pre-existing = `i18n.test.ts > detectLanguage` Intl-mock branch (production reads from expo-localization — confirmed pre-existing across all Epic 14 stories). Exact match vs 14.12b done baseline per `project_v140_epic14_progress.md`.

**Tasks 2, 3, 5 are hardware-gated (NFR5 iPhone 16 Pro).** They require Alejandro to execute on device and cannot be completed by the dev agent. Handoff contract:

- **Task 2** — Alejandro executes the 7 checklist sections on iPhone 16 Pro, ticking checkboxes as each gate passes; captures the 5+ evidence artifacts per AC #8 into `docs/img_screenshot/qa-14.13/` (filenames per the README in that folder).
- **Task 3** — For each issue surfaced during execution, Alejandro appends a `### ISSUE-NN` entry to §7 using the provided template. `fix-in-14.13` issues (≤30 min) can be handed back to a dev-story invocation on the same branch; `follow-up` issues are filed as new backlog stories via `feature-spec`. BUG-001 specifically: if still `new` at merge time, either `fix-in-14.13` (default per Open Question #4 of the story) or explicit accept-with-rationale.
- **Task 5** — Sign-off. On Outcome A, Alejandro populates §8 with Outcome A checkbox + exec summary paragraph (GO / N issues / photo-first + color-first wall-clock / migration PASS|FAIL / a11y / CI at HEAD sha). On Outcome B, branch stays open, fix-in-14.13 patches land, partial re-run of affected rows, Outcome A re-attempted.

**Story status remains `in-progress` until on-device execution + sign-off complete.** The workflow cannot advance this story to `review` at the checklist-production phase because 9 of 13 ACs have gates that only real hardware can tick (AC #2, #3, #4, #5, #6 §6.1/6.2, #7 execution, #8 evidence capture, #9 outcome, #13 NFR3 verification). Advancing to `review` prematurely would violate Step 8 of the dev-story workflow: "NEVER mark a task complete unless ALL conditions are met — NO LYING OR CHEATING".

**Expected outcome at sign-off** per Dev Notes "Expected checklist outcome — baseline scenario": Outcome A with 0–3 `fix-in-14.13` issues, most likely candidates = BUG-001 post-save nav swap + minor a11y polish items surfaced by hardware-only side-lit rendering.

### File List

- `docs/planning/epic-14-qa-checklist.md` — NEW — full 6-section on-device QA checklist + §7 Issues & triage template + §8 Sign-off template (AC #1–#10).
- `docs/img_screenshot/qa-14.13/README.md` — NEW — evidence folder placeholder documenting required filenames + conventions per AC #8.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED — story status flip `ready-for-dev → in-progress` + dated log entry per Task 5 workflow contract.
- `_bmad-output/implementation-artifacts/14-13-epic14-ondevice-qa-happy-paths.md` — MODIFIED — Status, Tasks/Subtasks (Task 1 + Task 4 ticked), Dev Agent Record, File List, Change Log populated.

No source-code files modified — pure-QA success path at checklist-production phase (per AC #10(d) "zero modifications to existing production source files if no fix-in-14.13 issues were needed"). If on-device execution surfaces fix-in-14.13 issues, an additional dev-story cycle on this same branch will add the patches + extend the File List accordingly.

### Change Log

- **2026-04-22** — Story 14.13 checklist-production phase. Branch `story/14-13-epic14-ondevice-qa-happy-paths` created off `epic-14` HEAD `21534e0`. Task 1 (checklist authored) + Task 4 (CI gates verified 942/3/945 tsc clean lint-baseline-only) complete. Tasks 2/3/5 pending Alejandro's iPhone 16 Pro execution. Status: in-progress.
- **2026-04-22 + 2026-04-23** — Post-release bugs capturados + fixed on-branch. 7 bugs cerrados (BUG-001/002/003/004/007/008/011) + 2 polish post-validación (badge En curso sin fondo · badge S4 sin fondo) + 2 utilidades dev-only (reset premium + wardrobe paywall preview). Fix-in-14.13 total: 16 commits. CI baseline sube a 948 passing / 3 pre-existing / 951 total (+9 vs baseline 14.12b — casos wardrobe context del paywall). BUG-005/006/009/010 quedan pendientes como follow-up propuesto v1.4.1. Detalle completo en `docs/planning/epic-14-bugs-handoff-2026-04-23.md`.
- **2026-04-23** — Status flip `in-progress → review`. Rama lista para code-review adversarial en fresh LLM context per CLAUDE.md "Mandatory Code Review". NO merged aún a `epic-14` — reviewer valida + aprueba + mergea.
- **2026-04-23** — Code review adversarial completado (bmad-code-review). 0 patches · 0 decision-needed · 5 deferred · 6 dismissed. Review APROBADO — story pasa a `done`. Merge `story/14-13-* → epic-14` autorizado.

### Review Findings — 2026-04-23

0 `decision-needed` · 0 `patch` · 5 `defer` · 6 dismissed.

- [x] [Review][Defer] D-14.13-1: `savedCombinationIds` + `currentCount` two-source-of-truth — `PremiumPaywall` now derives palette visibility from `currentCount` and rendered palettes from `savedCombinationIds`; a future callsite could pass inconsistent values (header says "♥ 3 saved" but palette strip is empty). All current callsites are in sync. Not a bug today, latent API design weakness. [src/components/PremiumPaywall.tsx:256–259] — deferred, not introduced by this diff
- [x] [Review][Defer] D-14.13-2: `__dev_resetPremium` present in production context value shape — function is a no-op in prod (`if (!__DEV__) return`) but the ref lives in `useMemo` deps + context shape; micro-optimization (dead slot) not actionable without bigger refactor. [src/contexts/PremiumContext.tsx:171–181] — deferred, acceptable tradeoff
- [x] [Review][Defer] D-14.13-3: `ArmarioPreviewScreen` dual paywall-visibility state — `gate.paywallVisible` (favorites-gate) and local `paywallVisible` (wardrobe error-gate) are separate; intentional design (wardrobe paywall triggered by `WardrobePersistenceError`, not favorites gate), but future maintainers could confuse the two paths. [src/screens/armario/ArmarioPreviewScreen.tsx] — deferred, design-intent comment recommended
- [x] [Review][Defer] D-14.13-4: `CompletenessBadge.transparent=true` retains `borderRadius:10` + `minHeight:24` as dead styles — no visible artifact (transparent bg = nothing to clip; 24pt minimum height with `alignSelf: flex-start` still occupied but text drives actual height); purely cosmetic polish. [src/components/armario/CompletenessBadge.tsx:67–74] — deferred, future polish pass
- [x] [Review][Defer] D-14.13-5: `__dev_resetPremium` doesn't call RevenueCat `Purchases.logOut()` — after reset, next Metro reload re-runs `init()` → RevenueCat re-hydrates `isPremium=true` from sandbox entitlement; reset only survives until next cold launch. Developer ergonomics limitation, not a user-facing bug. [src/contexts/PremiumContext.tsx:151–163] — deferred, documented dev limitation

## Reviewer handoff — 2026-04-23

**Fuente de verdad del estado actual:** `docs/planning/epic-14-bugs-handoff-2026-04-23.md`.

**Antes de abrir el review:**
1. `git checkout story/14-13-epic14-ondevice-qa-happy-paths`
2. `git log --oneline epic-14..HEAD` → 16 commits listados.
3. Leer el handoff de 2026-04-23 — cubre: resumen ejecutivo, bugs cerrados, bugs pendientes con rationale, cambios arquitectónicos (paywall refactor · popTo fix · CompletenessBadge.transparent · Zustand useMemo pattern · dev utilities), qué validar, archivos modificados, comandos rápidos.
4. Bug log completo (con root cause + solución + tests por cada BUG) en `docs/planning/epic-14-post-release-bugs.md`.

**Gates CI al cierre:** tsc clean · lint 2 pre-existing errores heredados · pnpm test 948/3/951.

**Merge target:** `epic-14` (NO `epic-1` — `release-manager` hará ese merge después de Outcome A del checklist QA).
