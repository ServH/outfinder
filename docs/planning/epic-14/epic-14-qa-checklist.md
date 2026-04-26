# Epic 14 — On-device QA Checklist (Story 14.13)

**Version under test:** v1.4.0
**Device:** iPhone 16 Pro
**Build commit:** `21534e09cc3b8d4400e21a33976c6758145d4e61` (epic-14 HEAD "merge: Story 14.12b — edit-category pencil affordance")
**Tester:** Alejandro

---

## 1. Build & environment preflight

- [ ] Device model: iPhone 16 Pro (NFR5 hardware-gate — no simulator substitution for §3, §4, §6)
- [ ] iOS version recorded: ___________________
- [ ] Expo SDK 55 build channel selected: `eas build --profile preview --platform ios` **OR** `npx expo run:ios --device "iPhone 16 Pro"` (mark choice): ___________________
- [ ] pnpm version recorded: ___________________
- [ ] Build command used recorded: ___________________
- [ ] App launches without crash on first run
- [ ] Settings → Acerca de surfaces version `1.4.0` (or chosen v1.4.0 build number — must NOT read `1.3.x`)
- [ ] Build commit sha matches AC #1 header line

---

## 2. Epic 13 functionality (first release to production)

Epic 13 shipped in code to `epic-13` branch but never reached production. v1.4.0 is the first production exposure. Re-exercise end-to-end per `epic-14.md:917`.

- [ ] From a FichaWada slot, tap "Nueva foto" → `ArmarioCaptureScreen` opens (NOT unified camera — TD-2 semantic preservation)
- [ ] Slot-bound cutout pipeline runs: capture → background removal → preview → save
- [ ] Saved garment appears in the slot with its cutout visible
- [ ] Delete a `WardrobeItem` (S3 picker edit mode → `(−)` badge → confirm) → `cascadeDeleteAssignmentsForItem` fires: all assignments referencing this item are removed without orphans
- [ ] Wardrobe paywall triggers at 10 items: attempt to save 11th garment → `PremiumPaywall` opens; dismiss → no item saved; purchase (if sandbox available) → item saves
- [ ] Warm gradient + aureola + Wada header visible in S4 polaroid (regression probe — full S4 verification in §6.1)
- [ ] No crash, no silent AsyncStorage write failure, no Metro warning banner in `__DEV__`

---

## 3. Epic 14 golden paths (FR coverage)

### 3.1 Photo-first "new user" happy path (`epic-14.md:895–898`)

- [ ] Fresh install (delete app → reinstall v1.4.0 from build channel) → opens onto Home without crash
- [ ] Tab Bar FAB is visible on Home, tap fires hapticLight + opens unified camera (RootStack modal nav per TD-2)
- [ ] Camera permission prompt appears on first use (iOS grants) — subsequent opens skip prompt
- [ ] Capture photo of a real garment; Swift pipeline runs removeBackground → computes dominantHex in same pass (TD-1)
- [ ] Result screen renders cutout + detected Wada tone name ("Es el tono {X}") + preview of combinations containing that tone (FR3)
- [ ] "Guardar en mi armario" tap opens CategoryPickerSheet with 4 options (Parte de arriba / Parte de abajo / Calzado / Accesorio) (FR6)
- [ ] Pick a category → Confirmar → persists WardrobeItem with category field; no crash on AsyncStorage write
- [ ] Post-save navigation shows combinations (replace nav per BUG-001 fix status — see §7 if unresolved); no screen-stacking layers visible underneath
- [ ] Tap a combination → Visualizer renders with "Hacer este look mío" primary CTA (FR8); share button is NOT present (FR10)
- [ ] Tap "Hacer este look mío" → Ficha Wada opens WITHOUT consuming a Mis Looks slot (FR9, FR14)
- [ ] Assign first garment to a color slot → look auto-saves to Mis Looks (consumes 1 of 5); VoiceOver announces save (FR12)
- [ ] Navigate to Mis Looks tab → the auto-saved look appears with correct assignment count (e.g., "1/3")
- [ ] End-to-end wall-clock time from app open to "look started in Mis Looks" is ≤2 minutes (NFR7) — recorded: ____:____
- [ ] No crashes, no dropped states, no silent haptic failures (hapticLight/Medium/Rigid all fire at their documented stations — see §5 TD-2 sub-checks)
- [ ] VoiceOver traversal of every tappable element in the path: label present, role correct, 44pt hit target met (NFR1, CLAUDE.md "Accessibility First")

**Evidence:** `![AC3 photo-first](../img_screenshot/qa-14.13/ac3-photo-first.mov)`

### 3.2 Color-first "Juan" happy path (`epic-14.md:900–903`)

- [ ] From Home, browse the Sanzo Wada palette catalog (ColorHome) — tiles render correctly with Wada color dots + names
- [ ] Tap any palette → Combinations screen renders the containing combinations
- [ ] Tap a combination → Visualizer renders with "Hacer este look mío" primary CTA (FR8)
- [ ] Tap "Hacer este look mío" → Ficha Wada opens in working mode WITHOUT auto-save (FR9, FR14 — 0/3 status)
- [ ] Ficha Wada exposes "Guardar para luego" CTA with bookmark SF Symbol (Story 14.9 / FR13)
- [ ] Tap "Guardar para luego" → hapticMedium fires → look persists to Mis Looks with status "0/3 prendas asignadas" → CTA vanishes (CTA-vanish feedback — no toast, per 14.9 decision)
- [ ] Close app (swipe-up or force-quit) → reopen → Home shows the incomplete look in the "En curso" section at the TOP of Mis Looks OR on Home per UX-DR5 (Story 14.11 / FR16)
- [ ] Tap the incomplete look tile → navigates to ArmarioFichaWada (skips S0 — per Story 14.11)
- [ ] Assign all 3 garments (one per slot) → look transitions from "En curso" to the completed/standard Mis Looks section; the complete-section header only renders when BOTH lists are non-empty
- [ ] Navigate to Mis Looks → S4 polaroid "tu look" screen opens for the now-completed look → Compartir button is present and functional (NFR4 — S4 share not regressed by FR10)
- [ ] Same-path VoiceOver traversal: every label/role/hint fires correctly; Reduce Motion respected (animations skip to end state per AccessibilityInfo.isReduceMotionEnabled — CLAUDE.md)

**Evidence:** `![AC3 color-first](../img_screenshot/qa-14.13/ac3-color-first.mov)`

---

## 4. v1.3.0 → v1.4.0 upgrade (production blocker)

Per `epic-14.md:905–908` + `:47` — upgrade path testing reduces to `N ∈ {0, 3, 5}` favorites. **No wardrobe-items-upgrade scenario exists in production** — do NOT add a §4.4.

NFR3 (upgrade must not require re-login / data restore / manual action) is explicitly verified in each subsection.

### 4.0 Setup (shared across all three N values)

- [ ] v1.3.0 build reproducible: either (a) install v1.3.0 from App Store production OR (b) build v1.3.0 from git tag/branch (confirm tag exists with `git tag -l | grep 1.3`)
- [ ] AsyncStorage inspection tool available (e.g., Flipper + AsyncStorage plugin, or in-app DevMenu dump) — to verify legacy `@outfinder/favorites` key before upgrade AND `@outfinder/migration:favorites-to-mis-looks:v1` flag + new store state after upgrade

### 4.1 N=0 favorites (fresh v1.3.0 user, never saved any favorite)

- [ ] Install v1.3.0 → open → do NOT save any favorite → background the app
- [ ] Install v1.4.0 over v1.3.0 (App Store update OR `expo run:ios` upgrade path — whichever matches production install channel)
- [ ] Open v1.4.0 → Mis Looks tab renders empty state (NewLookCtaCard + empty-state messaging from Story 14.10 / 14.11)
- [ ] No crash, no spinner hang, no "missing data" UI
- [ ] AsyncStorage: `@outfinder/migration:favorites-to-mis-looks:v1` written with value `"complete"` (TD-5 flag)
- [ ] AsyncStorage: legacy `@outfinder/favorites` key is cleared (TD-5 step c — only after flag write)
- [ ] NFR3: no login screen, no data-restore prompt, no manual action

**Evidence:** `![AC4 N=0](../img_screenshot/qa-14.13/ac4-n0-mis-looks.png)`

### 4.2 N=3 favorites (typical v1.3.0 user with a handful of favorites)

- [ ] Install v1.3.0 → save 3 distinct favorites (3 different combinationIds) → background the app
- [ ] Install v1.4.0 over v1.3.0 (same install channel as §4.1)
- [ ] Open v1.4.0 → Mis Looks tab shows EXACTLY 3 looks with correct combinationIds matching the pre-upgrade favorites
- [ ] No crash, no spinner hang, no ghost extras, no missing favorites (FR17 — zero data loss)
- [ ] AsyncStorage: idempotency flag present; legacy key cleared; items array empty (no wardrobe-items-legacy scenario in production per epic-14.md:47)
- [ ] Re-run migration via dev menu OR force-kill + reopen 3× → state is idempotent; no duplicates appear; flag remains `"complete"` (TD-5 idempotency)
- [ ] NFR3: no login screen, no data-restore prompt, no manual action

**Evidence:** `![AC4 N=3](../img_screenshot/qa-14.13/ac4-n3-mis-looks.png)`

### 4.3 N=5 favorites (at the FREE_FAVORITES_LIMIT — grandfathered)

- [ ] Install v1.3.0 → save 5 distinct favorites (fills FREE_FAVORITES_LIMIT) → background the app
- [ ] Install v1.4.0 over v1.3.0
- [ ] Open v1.4.0 → Mis Looks shows EXACTLY 5 looks — grandfathered per epic overview paragraph "Users already at 5/5 are grandfathered"
- [ ] Attempt to save a 6th look via "Guardar para luego" → paywall triggers at 5/5 (FR5 mirror for Favorites; TD-4 paywall-limbo strip appears)
- [ ] Dismiss paywall → FichaWada shows limbo state: 40% opacity on affordances + explanatory strip "Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar." (TD-4)
- [ ] Swipe back works normally; no blocking overlay; no auto-goBack (TD-4)
- [ ] NFR3: no login screen, no data-restore prompt, no manual action

**Evidence:** `![AC4 N=5](../img_screenshot/qa-14.13/ac4-n5-mis-looks.png)`

> AsyncStorage inspection steps are optional-but-strongly-recommended — QA may use Flipper, Reactotron, or an in-app `__DEV__`-only dev menu dump; no new production UI is added for this checklist.
>
> **Explicitly NOT covered** (anti-invention guard): there is NO "v1.3.0 → v1.4.0 wardrobe-items migration scenario" — the wardrobe-items legacy scenario exists ONLY for internal testers / TestFlight Epic 13 beta users per TD-7, which is defensive not load-bearing.

---

## 5. Technical Decision verification (TD-1 → TD-7)

Per `epic-14.md:51–63` + `:929` — **any TD failure is a hard blocker for App Store submit**.

### TD-1 · Dominant color extraction in Swift

Decision: `modules/background-removal` returns `{ cutoutUri, dominantHex }` in a single Swift pass; no `react-native-image-colors` call on cutout; transparency-trap eliminated.

- [ ] Scan a TRANSPARENT garment (e.g., white chiffon on a dark bg) → dominantHex is NOT biased toward black; resulting Wada match is a pale tone, not a dark one
- [ ] Scan a very PALE garment (cream, off-white) → dominantHex reads a warm near-white; matched Wada tone is plausible (not pure white if palette lacks it)
- [ ] Scan a very DARK garment (black, navy) → dominantHex reads a dark tone; no transparency-bias artifact
- [ ] Single Swift pipeline pass — no `react-native-image-colors` call on the cutout (inspect Metro/console logs for absence OR verify `modules/background-removal` returns `{ cutoutUri, dominantHex }` shape)

### TD-2 · Unified camera in RootStack + ArmarioCaptureScreen preserved

Decision: FAB opens UnifiedCameraRoot (modal off RootStack, sibling of Main + ArmarioRoot); ArmarioCaptureScreen stays reachable from FichaWada slot picker for the in-context flow.

- [ ] Tab Bar FAB opens the unified camera (UnifiedCameraRoot modal off RootStack, sibling of Main + ArmarioRoot)
- [ ] Camera flow covers Capture → Result → PostSave (UnifiedCameraStackParamList)
- [ ] From a FichaWada slot picker, tapping "Nueva foto" opens the PRESERVED ArmarioCaptureScreen (in-context slot-assignment flow) — NOT the unified camera
- [ ] The two cameras are semantically distinct: FAB camera saves to armario + detects Wada tone + shows combinations; ArmarioCapture saves cutout bound to the already-known slot color
- [ ] Legacy `CaptureScreen` is NOT reachable from any UI path (removed from `ColorsStackParamList` per Story 14.3a)

### TD-3 · Data model unification (ADR-005)

Decision: single `useMisLooksStore` Zustand holds `items` + `assignments` + `favorites`; `FavoritesContext` deleted.

- [ ] No `FavoritesContext` reachable in the codebase (grep confirms deletion; runtime state in DevMenu / React DevTools shows only useMisLooksStore)
- [ ] `useMisLooksStore` holds `items` + `assignments` + `favorites` in a single Zustand store (inspect via React DevTools / Flipper)
- [ ] FR12 auto-save fires correctly from the single store (exercised in §3.1 photo-first path)

### TD-4 · Paywall-limbo resolution (disabled state + explanatory strip)

Decision: at 5/5 Favorites, paywall dismiss keeps FichaWada visible in a disabled-state with opacity:40% + explanatory strip; no auto-goBack; swipe-back works; re-tap re-triggers paywall.

- [ ] At 5/5 favorites, tap "Guardar para luego" OR "Asignar" → paywall opens
- [ ] Dismiss paywall without upgrading → Ficha Wada remains visible (NO auto-goBack)
- [ ] Slot tiles + save CTAs render at 40% opacity (visually disabled)
- [ ] Explanatory strip appears at top: "Alcanzaste el límite de 5 looks guardados. Elimina uno para continuar."
- [ ] Tapping a disabled slot re-triggers the paywall (not a no-op; not a crash)
- [ ] Swipe-back gesture works normally (no blocking overlay)

**Evidence:** `![AC5 TD-4](../img_screenshot/qa-14.13/ac5-td4-paywall-limbo.png)`

### TD-5 · Migration idempotency pattern

Decision: `@outfinder/migration:favorites-to-mis-looks:v1` flag gates batch write + legacy-key clear; re-run safe by ID-match; orphan combinationIds dropped with `__DEV__` warn (see `src/stores/misLooksStore.ts:63–161`).

- [ ] `@outfinder/migration:favorites-to-mis-looks:v1` flag is written as `"complete"` exactly once, after full batch success
- [ ] Legacy `@outfinder/favorites` key is cleared ONLY after flag write (order verified via mid-migration force-kill — see next bullet)
- [ ] Mid-migration force-kill (airplane mode + force-quit between batch write and flag write, if reproducible in dev menu) → source `@outfinder/favorites` remains intact; re-run succeeds and writes flag
- [ ] Re-running migration by clearing the flag (dev menu) → duplicates are NOT created (idempotency by ID match in destination)
- [ ] Orphan combinationIds (favorites referencing combos that no longer exist in the Wada dataset) are dropped with a single `__DEV__` warn log per orphan; no crash

### TD-6 · Category is editable in v1.4.0 (Story 14.12b — pencil icon)

Decision: S3 picker edit mode renders `(−)` delete badge + pencil edit badge; pencil tap opens CategoryPickerSheet pre-selected; confirm persists and user remains in edit mode.

- [ ] In S3 picker (ArmarioPicker), long-press any tile → enters edit mode (14.12a scaffold)
- [ ] Each tile renders BOTH a `(−)` badge (top-left) AND a pencil badge (top-right) — 24pt circles, symmetric mirror
- [ ] Tap pencil → hapticLight fires + CategoryPickerSheet opens with current category PRE-SELECTED (checkmark visible on the correct row)
- [ ] Pick a different category → Confirmar → hapticMedium (fired by sheet) + persists to WardrobeItem.category + sheet dismisses + USER REMAINS IN EDIT MODE (multi-edit retention)
- [ ] Backdrop-tap / swipe-down dismiss → NO store write; user remains in edit mode
- [ ] VoiceOver on pencil badge reads: "Editar categoría de parte de arriba" (ES) / "Edit category of top" (EN) + hint "Abre el selector..." / "Opens the category picker..."
- [ ] Same-category Confirmar: pick the currently-assigned category → Confirmar → still persists (no short-circuit) + sheet dismisses

### TD-7 · Legacy WardrobeItem default category = "top" (defensive for internal testers)

Decision: defensive backfill for TestFlight Epic 13 beta installs only; production users have zero pre-existing wardrobe data.

- [ ] This decision is DEFENSIVE ONLY — do NOT construct a production migration test case for it. Confirm via code inspection that `wardrobeRepo` / `misLooksStore` reads backfill missing `category` with `"top"` (grep `category: "top"` near the migration or item-hydration site — no runtime test required unless TestFlight Epic 13 beta install is available)
- [ ] If a TestFlight Epic 13 beta device IS available (optional), install Epic 13 beta → save ≥1 wardrobe item → upgrade to v1.4.0 → verify the item's category defaults to "top" and is editable via TD-6 pencil flow

---

## 6. Regression surface + Accessibility audit + CI gates

### 6.1 S4 polaroid non-regression (NFR4)

- [ ] Complete a look (3/3 garments assigned) → navigate to S4 "tu look" screen via the appropriate CTA
- [ ] S4 polaroid renders: 3 real-garment photos composited on the warm gradient background + aureola + Wada header (per Story 2.5)
- [ ] Tap "Compartir" → native share sheet opens with the polaroid image + app branding
- [ ] Share via at least 2 channels (e.g., Messages + save to Photos) → image is correctly generated + saved
- [ ] NO "Compartir Outfit" button on the intermediary OutfitVisualizer screen (FR10 — only S4 retains sharing)
- [ ] Skia composition path works (not blank, no silent failure, no crash)

**Evidence:** `![AC6 S4 share](../img_screenshot/qa-14.13/ac6-s4-share.png)`

### 6.2 Accessibility audit (NFR1 + CLAUDE.md "Accessibility First")

- [ ] Enable VoiceOver (Settings → Accessibility → VoiceOver) → traverse the photo-first path end-to-end: every tappable element is announced with label + role; no "Button" (unlabeled) nodes
- [ ] Traverse the color-first path end-to-end with VoiceOver: same no-unlabeled-elements invariant
- [ ] All new buttons/pressables meet 44pt minimum touch target (visually confirm via Accessibility Inspector or tap-spacing check): Tab Bar FAB, unified-camera CTAs, pencil + (−) badges in edit mode, "Guardar para luego" CTA, incomplete-look tiles, NewLookCtaCard, CategoryPickerSheet rows + Confirmar, paywall buttons
- [ ] Enable Reduce Motion (Settings → Accessibility → Motion → Reduce Motion) → badges appear instantly (no 250ms fade); animation-heavy transitions skip to end state; no broken layouts
- [ ] VoiceOver announces state-change events per `AccessibilityInfo.announceForAccessibility` at: enter edit mode ("Modo edición activado"), auto-save on first assignment, "Guardar para luego" confirm — all present, none silent

### 6.3 CI gates (NFR6)

- [ ] `npx tsc --noEmit` on `epic-14` HEAD → zero errors
- [ ] `pnpm lint` on `epic-14` HEAD → only the 2 PRE-EXISTING Biome format errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx`) — zero new findings
- [ ] `pnpm test` on `epic-14` HEAD → 942 passing / 3 pre-existing / 945 total (baseline from 14.12b done per `project_v140_epic14_progress.md`)
- [ ] If any CI gate fails after 14.12b merge, pause sign-off and investigate — these gates are non-negotiable per NFR6

---

## 7. Issues & triage

Leyenda de severidad (alineada con `docs/planning/epic-14/epic-14-post-release-bugs.md`): `blocker` · `high` · `medium` · `low` · `polish`.
Status: `new` · `triaged` · `spec'd` · `in-dev` · `fixed` · `wontfix`.
Disposition: `fix-in-14.13` (≤30 min code bundled into this branch) · `follow-up` (new backlog story via `feature-spec`).

> Template per entry:
>
> ### ISSUE-NN · {short title}
> - **Severity:** {blocker | high | medium | low | polish}
> - **Repro steps:** {numbered list}
> - **Status:** {new | triaged | spec'd | in-dev | fixed | wontfix}
> - **Disposition:** {fix-in-14.13 | follow-up → story-key}
> - **Notes:** {inline}

### BUG-001 · Navegación apilada tras guardar prenda y abrir combinaciones

Pre-registered from `docs/planning/epic-14/epic-14-post-release-bugs.md:34–50`. MUST be re-tested as part of §3.1 "Post-save navigation shows combinations".

- **Severity:** high
- **Status:** {new | fixed | accepted-with-rationale} — fill during execution
- **Disposition:** default `fix-in-14.13` (replace-nav swap in post-save flow — likely Metro-cacheable JS-only change, ≤30 min). Alternative: `follow-up` → v1.4.1 with written rationale from Alejandro.
- **Note:** if unresolved at sign-off time → BLOCKER for Outcome A unless explicitly accepted.

---

## 8. Sign-off

Exactly ONE outcome below is checked + filled upon completion.

- [ ] **Outcome A (ship)** — v1.4.0 is GO for App Store submit. All 6 sections passed; no blocker / high severity issues; BUG-001 status: {resolved | accepted-with-rationale}. Tester: Alejandro. Date: YYYY-MM-DD.
- [ ] **Outcome B (return to dev)** — v1.4.0 is NOT READY. Blocking issues: {numbered list with links to §7 entries + follow-up story keys}. Tester: Alejandro. Date: YYYY-MM-DD.

**Sign-off rules:**

- Outcome A is the only state that unblocks the `release-manager` workflow / EAS submit command.
- If Outcome B: all `fix-in-14.13`-tagged issues are fixed within this story's branch; checklist is re-run for those specific rows only (partial re-run acceptable); Outcome A is attempted again.
- If any `follow-up`-tagged issues exist, they are filed as new backlog story entries in `sprint-status.yaml` BEFORE sign-off (manual edit or `feature-spec` skill).
- Do NOT merge to `epic-1` from this branch — `release-manager` handles that AFTER Outcome A + epic-14 → epic-1 merge.
