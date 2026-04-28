# Epic 14 — App Flow Reorganization (v1.4.0 pre-launch)

**Status:** Scope approved by Alejandro on 2026-04-21. Ready for epic+story breakdown.
**Facilitated by:** John (PM) via `bmad-agent-pm`.
**Source conversation:** `docs/ideas.md`.
**Precondition:** Epic 13 (Armario Virtual, v1.4.0) is technically complete (commit `eae624e`, 13.1→13.5 done) but CANNOT ship to App Store until this epic lands — flow reorganization is a launch blocker, not an enhancement.

---

## Problem (validated with 5–6 users)

The app has a **feature-hierarchy problem**, not a feature-gap problem.

- The killer feature (Armario Virtual, completed in Epic 13) is hidden behind Favorites (heart → tab → card → enter).
- The Outfit Visualizer with generic silhouettes occupies the prime flow real estate but delivers less retentive value.
- There are two separate cameras (`CaptureScreen` detects color; `ArmarioCaptureScreen` removes background) that users actively perceive as redundant — a tester literally said: *"¿por qué escaneo el color y luego la ropa no puede ser todo a la vez?"*
- All testers finished the flow in the Visualizer feeling disappointed: *"poca gente guarda en favoritos si no tienen un por qué y mucho menos se ponen a investigar"* — they never discovered the Armario.

Net effect: users complete the flow without discovering 80% of the app. The Visualizer acts as a narrative cul-de-sac.

## Goal

Rebuild the activation loop so the first-use journey takes a new user from **camera/color → armario with a saved garment and an initiated look** in ≤2 minutes, with a clear a-ha moment and a soft reason to return tomorrow. This must happen **before** v1.4.0 submission to App Store.

## Two legitimate entry doors (both preserved)

- **Door A — Photo-first:** FAB → unified camera → scan garment → save (optional) → see Wada combinations. User starts from physical object.
- **Door B — Color-first (the "Juan" use case):** Home/palette catalog → select color → see combinations. Night-time use, no camera needed, exploratory intent. User starts from mental idea of a color.

## In-scope items

### 1. Unified Camera with explicit confirmation
- `CaptureScreen` is **deleted**. Single camera reached from the Tab Bar FAB.
- Flow: photo → `removeBackground` (Vision iOS 17) → `getColors` on the background-free PNG (more accurate than on full photo) → result screen showing cutout + detected Wada tone ("Es el tono Carmín de Sanzo Wada") + combinations preview + two explicit actions:
  - **"Guardar en mi armario"** (commits to wardrobe; triggers `FREE_WARDROBE_LIMIT` paywall at 10 free items).
  - **"Ver combinaciones y seguir sin guardar"** (Zara-shop-window use case — scan color without owning the garment).
- Respects user agency; prevents involuntary wardrobe bloat.

### 2. Minimal garment tagging on save
- When user taps "Guardar" on the camera result screen, a **mandatory category selector** appears: Parte de arriba / Parte de abajo / Calzado / Accesorio.
- `WardrobeItem` data model extended with a `category` field.
- Persistence layer migrates cleanly (existing items get a default or inferred value — design TBD).
- **Filter pills on S3 are NOT included.** Data is captured now so v1.5.0 can unlock filtering without a migration.

### 3. Visualizer as a bridge, not a destination
- "Compartir Outfit" button removed or relegated to a secondary affordance. The generic-silhouette Visualizer is **no longer shareable externally** — only S4 polaroid (real garments) is shared.
- Primary button becomes **"Hacer este look mío"**.
- Pressing it navigates to the Ficha Wada in working mode. **It does NOT yet save to Mis Looks** — protects slot consumption.
- Visualizer is now explicitly framed as a "dressing room / pre-commitment window", not as the end of the journey.

### 4. Favorites → "Mis Looks" rename + semantic shift
- Tab label: "Favoritos" → **"Mis Looks"**.
- Tab icon: heart → wardrobe/hanger.
- Mental model shift: from passive bookmark list to active workspace.
- `FREE_FAVORITES_LIMIT` stays at **5** (product decision: aggressive paywall to accelerate conversion on committed users).
- **Two save paths into Mis Looks (option c refined):**
  - **Path 1 (derived from usage):** user enters Ficha Wada in working mode → assigns first garment to any color → look auto-saves to Mis Looks (1/5). Applies to the photo-first flow.
  - **Path 2 (explicit bookmark):** user enters Ficha Wada but cannot assign garments right now (night-time Juan case) → taps explicit **"Guardar para luego"** → look saves to Mis Looks without garments (1/5, status `0/3 prendas asignadas`). Applies to Door B flow.
  - **No action = no save:** entering Ficha Wada and closing the app consumes zero slots. Only active engagement costs a slot.

### 5. "+ Nuevo look" CTA inside Mis Looks
- An entry point (button or card) inside the Mis Looks tab that navigates to the Wada palette catalog, letting experienced users start a new look without going through the camera first.
- Reinforces the "workspace" mental model.

### 6. Lightweight retention — incomplete looks surfaced
- In the Home (or top of Mis Looks), incomplete looks (status `X/3 garments assigned`) are promoted to primary visibility.
- Reuses the badges already built in S5 (Epic 13). No new components.
- Gives a soft return reason ("tengo cosas a medias") **without building the reverse outfit generator** — that stays in v1.5.0 pending real data.
- Supports the embassy use case: Juan saves a navy look at night, next morning sees it on Home, opens camera, scans the navy t-shirt, completes the look, a-ha moment.

### 7. v1.3.0 → v1.4.0 data migration
- Existing Favorites (heart-liked palettes) migrate cleanly to Mis Looks with no data loss.
- Users already at 5/5 Favorites are grandfathered — they keep all 5.
- Zero breaking changes on upgrade (no forced re-login, no lost wardrobe items).
- Treated as a mandatory release-hygiene task, not a feature.

### 8. Discoverability of "delete garment" gesture
- **Outcome only (the "how" is Sally's call during UX design):**
  > The user must be able to delete a garment from the wardrobe in a discoverable way. Long-press MUST keep working (v1.3.0 backwards compat); a visually discoverable alternative is added for new users.
- Sally will explore 3+ alternatives during `bmad-create-ux-design`:
  - Subtle header hint ("mantén pulsada una prenda para eliminarla") — cheapest.
  - Always-visible (−) badge on each thumbnail.
  - iPhone-style Edit mode (long-press → all thumbnails wiggle with (−)) — most discoverable but heaviest.
- Final decision is deferred to UX phase; product commits only to the outcome.

## Out of scope (moved to v1.5.0+)

- Reverse outfit generator ("¿Qué me pongo hoy?") — needs real-user data to design for.
- Push notifications / "color del día".
- Filter pills on S3 by garment category.
- iCloud backup (Premium feature, major platform work).
- "Free digitizing" FAB inside Mi Armario tab.
- Wardrobe analytics ("Spotify Wrapped"-style breakdown).
- Alternative Wada color selector when auto-detection is unconvincing.
- Explicit onboarding coach-marks tour.
- Full iPhone-style Edit mode with wiggle animation (depends on Sally's pick in item 8).

## Success criteria

- A new user reaches the armario with **one garment saved and one look initiated** in the first session.
- v1.3.0 users upgrade to v1.4.0 without data loss and without any visible regression.
- Zero regressions on S4 sharing (polaroid export still works on completed looks).
- On-device QA on iPhone 16 Pro passes before App Store submit.
- Both entry doors (Photo-first and Color-first/Juan) produce valid, testable user journeys.

## Key architectural invariants (inherited from Epic 13)

- `FREE_WARDROBE_LIMIT = 10` (prendas).
- `FREE_FAVORITES_LIMIT = 5` (looks) — unchanged.
- Two paywalls are independent; a saved look does NOT consume a wardrobe slot and vice versa.
- Vision iOS 17 cutout quality is excellent on-device (memory `project_vision_cutout_quality.md`) — no defensive UX for "mal recorte".
- iPhone-only (iPad deferred to Epic 15 or later).

## Open design questions deferred to UX phase (Sally)

- Visual execution of the delete-garment discoverability fix.
- Layout of the camera result screen (recorte + tono detectado + categoría + combinaciones preview + two primary CTAs — dense, needs care).
- How/where "+ Nuevo look" CTA surfaces in Mis Looks (FAB vs. top card vs. list item).
- Empty state of Ficha Wada when reached without any garments (Juan's path 2) — must make "Guardar para luego" obvious.

## Open product questions intentionally left unanswered

- None blocking. All remaining ambiguity is implementation-level and belongs in story specs or UX design.

---

*End of Epic 14 scope document.*
