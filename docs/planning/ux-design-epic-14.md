---
title: UX Design Specification — Epic 14 (App Flow Reorganization)
author: Sally (UX) with Alejandro
date: 2026-04-21
status: pencil-reviewed-ready-for-dev
inputDocuments:
  - docs/epic-14-scope.md
  - docs/planning/epic-14.md
  - docs/ideas.md
  - docs/planning/ux-design-specification-ios.md
  - docs/project-context.md
relatedStories:
  - 14.4 (Camera result screen UI) — unblocked by UX-DR1
  - 14.5 (Save flow + category selector + paywall) — unblocked by UX-DR1
  - 14.6 (Visualizer bridge CTA) — unblocked by UX-DR6
  - 14.7 (Mis Looks tab rename) — partially supported by UX-DR4
  - 14.9 (Guardar para luego) — unblocked by UX-DR2
  - 14.10 ("+ Nuevo look") — unblocked by UX-DR4
  - 14.11 (Incomplete-looks surface) — unblocked by UX-DR5
  - 14.12 (Delete discoverability) — unblocked by UX-DR3
pencilDocument: designs/Epic14.pen
---

# UX Design — Epic 14: App Flow Reorganization

## Visión (arco emocional)

> *Marta abre Outfinder un sábado por la tarde. Sobre su cama: un jersey color teja que compró hace tres meses y nunca supo con qué combinar. Pulsa el FAB central de la barra de pestañas. La cámara le pide que fotografíe la prenda completa — un hint discreto, sin paternalismo — y ella obedece. En el instante siguiente, el jersey flota ya recortado sobre papel crema; abajo, en serif japonés, dos palabras: **Brick Red · 煉瓦色 (Tēgyō)**, y una tercera línea — **"Aparece en 14 combinaciones Wada"** — que le da autoridad. Dos acciones claras: guardar esta prenda en su armario (con peso visual), o ver combinaciones sin guardar (link sutil para "no es mía" o "solo curioseo"). Marta elige guardar. Aparece una hoja inferior: cuatro categorías — Parte de arriba, Parte de abajo, Calzado, Accesorio. Elige la primera. Confirma. Un haptic medium le responde. La prenda entra en su armario virtual, su primer objeto real. La app le propone: "ver combinaciones con Brick Red" o "volver a Mis Looks". Marta elige la primera. Se sumerge en las 14 paletas de Wada que contienen su teja. Elige una que nunca habría imaginado — teja, crema, azul ultramar. Entra al Visualizer: ve las siluetas con esos tres colores combinados. Un único CTA ancla la pantalla: "Hacer este look mío". Pulsa. Aterriza en la Ficha Wada de esa paleta. Su jersey teja ya está asignado al color Brick Red — la app lo ha reconocido. Le faltan dos prendas. De momento no tiene más. En el header, un affordance suave: "Guardar para luego". Pulsa. Cierra la app.*
>
> *Al día siguiente. Marta abre la app, entra a Mis Looks. Arriba, una tarjeta narrativa: "Empieza un look nuevo". Pero antes de pulsar, su ojo se va a la sección de debajo — "En curso" — donde ve su look de ayer con un badge discreto: **1/3 prendas**. Tap. Vuelve a la Ficha Wada. Sabe qué buscar hoy. Saca una blusa crema del armario físico, vuelve al móvil, pulsa el color crema, toca la cámara. Escanea. Guarda. Asigna. Dos prendas. Le queda una. Ese momento — el de saber qué falta y tenerlo a mano — es el loop de retención.*

Este arco es el norte. **Cualquier decisión de diseño que lo rompa se revisa.** Las 6 UX-DRs son los beats de esta canción, no piezas sueltas.

---

## Design Principles Inherited

From `ux-design-specification-ios.md`, enforced on every Epic 14 screen:

| Principle | Application in Epic 14 |
|-----------|------------------------|
| **Color-first, chrome-last** | Wada colors drive the result screen; CTAs are Wada-tinted; chrome recedes. |
| **Native where you feel, Wada where you see** | Category sheet, modal, haptics, swipe-back are 100% iOS-native. Content surfaces are 100% Wada. |
| **30 seconds or less** | Camera → result → save → combinations completes in ≤20s; every tap justified. |
| **Elevated simplicity** | No decorative chrome. Hairline dividers. Warm paper. Breathing room. |
| **Japanese authenticity** | Wada tone names always shown as `EN · 日本語 (Romaji)`. Noto Serif JP on all Wada labels. |
| **Craft-driven, not data-driven** | No tracking banners, no A/B placeholders. Every copy decision made by taste. |

**New principle for Epic 14:**

> **"The armario is the workspace. Every screen either fills it, consults it, or returns to it."**
>
> This replaces the prior model where Favorites was a bookmark list. It reframes navigation: the user doesn't "save things" — they *build* things.

---

## Design Tokens (existing, re-used)

Pulled from `src/styles/theme.ts` and `tailwind.config.js`:

- **Paper / backgrounds:** `bg-paper`, `bg-elevated`, warm cream tones (#f5f0e8 family).
- **Ink / text:** `text-primary` (charcoal), `text-secondary` (muted), `text-muted` (hairlines).
- **Accent:** dynamic Wada hex via `style={{ backgroundColor: color.hex }}`.
- **Typography:** Noto Serif JP (Regular/Medium) for Wada names + headlines; Inter (Regular/Medium) for UI copy.
- **Spacing:** 8pt grid — 8 / 12 / 16 / 24 / 32 / 48.
- **Hairline dividers:** 1px, `#e8dfd2`-ish muted paper tone.
- **Touch targets:** 44pt minimum (48pt preferred via `min-h-[48px]`).
- **Haptics contract:** `hapticLight` (selection), `hapticMedium` (commit/swap), `hapticRigid` (confirm action with weight).
- **Corner radii:** 12 (cards), 16 (sheets), 9999 (pills + category chips).

**No new tokens introduced in Epic 14.** The spec is token-additive-free on purpose.

---

## Screen-by-Screen Specification

### UX-DR1 — Unified Camera Flow (Capture + Result)

**Context.** The most important new surface in Epic 14. Resolves user feedback *"¿por qué escaneo el color y luego la ropa no puede ser todo a la vez?"* by collapsing `CaptureScreen` + `ArmarioCaptureScreen` into a single flow. **Unblocks:** stories 14.4 (result UI) and 14.5 (save flow + category + paywall).

**Decision baseline (closed with Alejandro 2026-04-21):** two screens (Capture + Result); result screen keeps two hierarchical CTAs; category selector is a bottom sheet after "Guardar".

#### Screen 1 — Capture

```
┌──────────────────────────────────────────┐
│ ←                                        │ ← nav bar (safe area)
│                                          │
│ ╔══════════════════════════════════════╗ │
│ ║                                      ║ │
│ ║                                      ║ │
│ ║       [ live camera viewfinder ]     ║ │
│ ║                                      ║ │
│ ║            Fotografía tu              ║ │  ← hint copy
│ ║         prenda completa               ║ │     Noto Serif JP 18pt
│ ║                                      ║ │     text-primary/80 opacity
│ ║                                      ║ │     centered, mid-lower third
│ ║                                      ║ │
│ ╚══════════════════════════════════════╝ │
│                                          │
│                  ⬤                        │ ← capture button
│                                          │     80pt diameter, paper border
│                                          │     fills with Wada accent on press
└──────────────────────────────────────────┘
```

**Layout notes.**
- Full-screen viewfinder (no letterboxing).
- Hint copy overlay positioned at lower third, never overlapping the subject. Fades out smoothly once the camera detects a filled frame (optional — Pencil TODO).
- Capture button centered bottom with 32pt bottom inset above safe-area.
- No WB slider (removed from this flow — the cutout pipeline makes it unnecessary; documented in handoff).
- Permission denied state: falls back to existing permission-request UI from today's `CaptureScreen` (no redesign needed).

**Interaction.**
- Tap capture button → `hapticRigid()` → `takePictureAsync()` → show loading state (warm paper overlay with subtle spinner, 2–3s tops) → pipeline runs → navigate `push` to Result screen.
- Swipe back (native) → dismiss camera.

**Accessibility.**
- Capture button: `accessibilityLabel="Capturar prenda"`, `accessibilityRole="button"`, `testID="unified-camera-capture"`.
- Hint copy: `accessibilityRole="text"` (informational, not interactive).
- VoiceOver flow: camera focus → capture button. Nothing else competes.
- Reduce Motion: no animation on hint copy fade; appears statically.

**Copy (EN+ES):**
- ES: *"Fotografía tu prenda completa"*
- EN: *"Photograph your full garment"*

#### Screen 2 — Result

```
┌──────────────────────────────────────────┐
│ ←                                        │
│                                          │
│                                          │
│        ┌──────────────────────┐          │
│        │                      │          │
│        │   [ cutout PNG ]     │          │ ← cutout large,
│        │   (transparent bg)   │          │   220pt-ish height,
│        │                      │          │   centered, warm paper bg
│        └──────────────────────┘          │
│                                          │
│             Brick Red                    │ ← NotoSerifJP Medium 28pt
│         煉瓦色 · Tēgyō                    │ ← NotoSerifJP Regular 18pt muted
│                                          │
│    Aparece en 14 combinaciones            │ ← Inter Regular 14pt
│                                          │     text-secondary
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    Guardar en mi armario      →    │  │ ← PRIMARY CTA
│  └────────────────────────────────────┘  │     48pt height, full-width
│                                          │     bg wada-accent-tinted
│                                          │     Inter Medium 16pt on paper
│                                          │
│     ver combinaciones sin guardar        │ ← SECONDARY link
│                                          │     Inter Regular 14pt underlined
│                                          │     text-secondary, centered
└──────────────────────────────────────────┘
```

**Layout notes.**
- Cutout renders on warm paper (the transparent PNG + warm bg behind) — feels like a botanical plate, not a product shot.
- Wada tone stack (EN → JP → romaji) uses the WadaHeader component pattern already in the app (see `src/components/WadaHeader.tsx`); we extend it or reuse.
- Combinations count line is factual, non-decorative. If count is 1 → *"Aparece en 1 combinación"* (singular via i18n plural).
- Primary CTA is full-width, bottom-anchored above safe area (32pt inset). Wada accent background — the tone of the garment itself tints the button. This is intentional and beautiful: *your garment pays for the CTA*.
- Secondary link is text-only, 24pt below primary CTA, hit area 44pt.

**Visual hierarchy ranking (top → bottom, eye priority):**
1. Cutout (magic moment).
2. Wada name stack (authority, poetry).
3. Combinations count (permission signal).
4. Primary CTA (commitment).
5. Secondary link (escape hatch).

**Interaction.**
- Tap "Guardar en mi armario" → `hapticMedium` → open category sheet (see below).
- Tap "ver combinaciones sin guardar" → `hapticLight` → navigate `push` to existing `Combinations.tsx` screen for the detected tone. Zero persistence.

**States.**
- **Default:** as shown.
- **Loading (rare — pipeline finishing):** warm paper overlay with subtle spinner over the cutout area. Disable CTAs.
- **Error (pipeline failure, e.g., cutout failed):** Alert-style sheet with copy *"No pudimos procesar la foto. Inténtalo de nuevo."* + button "Reintentar" → back to Capture screen. No Wada tone shown (we have nothing to show).
- **Paywall trip on save:** see UX-DR1 (category sheet) below.
- **Tone Correction (conditional):** When `matchWadaColor` returns ΔE < 8 between the top-2 Wada candidates (ambiguous detection), a soft correction section appears below the combinations count. It shows two color swatches side-by-side with their Wada names and a prompt *"¿Es éste el tono correcto?"*. The user taps one to confirm. The confirmed tone drives all downstream combinations. If confidence is high (ΔE ≥ 8), this section is hidden entirely. See Pencil frame `KY9jv` in `designs/Epic14.pen`. **Unblocks:** Story 14.4 must implement this conditional section.

**Accessibility.**
- Cutout: `accessibilityLabel="Recorte de tu prenda, tono ${wadaName}"`.
- Primary CTA: `accessibilityLabel="Guardar en mi armario. Tono Wada ${wadaName}. ${count} combinaciones disponibles."`.
- Secondary link: `accessibilityRole="link"`, `accessibilityLabel="Ver combinaciones sin guardar"`.
- VoiceOver flow: cutout → Wada name → count → primary CTA → secondary link.
- Reduce Motion: no entrance animation on the cutout (no fade-in).

**Trade-offs.**
- *Why secondary link and not secondary button?* To enforce hierarchy. A second button implies equivalence. The link signals "escape hatch". Conversion-first per Alejandro's explicit decision (pregunta 2).
- *Why not show the full combinations preview on this screen?* Tested in planning; it makes the screen dense (five perceptual zones). Moved to the natural next screen (`Combinations.tsx`) to preserve calm.

**Pencil TODOs (pixel iteration):**
- Cutout height sweet spot (180 / 220 / 260 pt).
- CTA bg tint intensity when garment color is very pale (risk of low contrast).
- Vertical rhythm between Wada name and count line.
- Exact arrow glyph on primary CTA.

#### Screen 2B — Category Sheet Modal (opens on tap "Guardar")

```
                                            ← dimmed background
┌──────────────────────────────────────────┐
│                                          │
│       ╭──────────────────────╮           │
│       │ ─ drag handle ─       │           │ ← 36pt drag handle
│       ╰──────────────────────╯           │
│                                          │
│     ¿Qué tipo de prenda es?              │ ← NotoSerifJP Medium 22pt
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ 👕  Parte de arriba                 │ │ ← 56pt row, icon + label
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 👖  Parte de abajo                  │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 👟  Calzado                          │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 🎩  Accesorio                        │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │        Confirmar                     │ │ ← disabled until selection
│  └─────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
                                            ← safe area + swipe-down dismiss
```

**Layout notes.**
- Bottom sheet at ~55% of screen height (half-sheet).
- 4 category rows: 56pt tall, hairline divider between them, selected state = row filled with muted Wada paper tint + 1.5pt leading indicator on left edge in Wada accent.
- Icons: use SF Symbols if matching glyphs exist (`tshirt`, `shoe`, `hat` via `expo-symbols`) — if not, keep emoji placeholder and resolve in Pencil.
- Confirmar button: 48pt, full-width, disabled (opacity 40%) until selection made.

**Interaction.**
- Row tap → `hapticLight` → select.
- Confirmar tap → `hapticMedium` → `wardrobeRepo.addItem({...})` → close sheet → navigate to post-save screen (see below).
- Swipe-down or tap outside → cancel save. Return to Result screen, no persistence.

**Paywall branch.**
If free user AND `getItems().length >= 10` when Confirmar fires:
- `saveCutoutAsWardrobeItem` throws `paywall`.
- Sheet dismisses.
- Existing `PremiumPaywall` modal opens (reused from Epic 13 — no redesign).
- On paywall dismiss/cancel → user returns to Result screen, garment not saved.
- On paywall purchase success → re-trigger save silently.

**Post-save transition.**
After successful save, show a minimal confirmation (toast-style? or inline "Guardado" for 1.5s?) and navigate to a tiny **"¿Ahora qué?" screen** with two options:

```
          Guardado en tu armario
           como Parte de arriba

        ┌──────────────────────────┐
        │ Ver combinaciones         │ ← primary, leads to Combinations.tsx
        │ con Brick Red         →   │     with detected tone
        └──────────────────────────┘

        ┌──────────────────────────┐
        │ Volver a Mis Looks        │ ← secondary
        └──────────────────────────┘
```

This is the "route de re-entrada ágil" that Alejandro nombró. It prevents the cul-de-sac and invites onward flow.

**Pencil TODOs:**
- Whether the post-save screen is a full screen, a sheet, or an inline overlay (my gut: full screen with minimal chrome, 2 large CTAs).
- Icon system for the 4 categories — SF Symbols or custom line-art.
- Whether to show the saved cutout (small) above the two CTAs for continuity.

---

### UX-DR2 — Ficha Wada in Working Mode + "Guardar para luego"

**Context.** The Ficha Wada (`ArmarioFichaWadaScreen.tsx`) already exists from Epic 13. What Epic 14 adds:
1. A clear working-mode entry for users who arrive with **zero assigned garments** (the Juan/night case or the post-Visualizer user).
2. An explicit **"Guardar para luego"** affordance that persists the look to Mis Looks without requiring garment assignment.
**Unblocks:** story 14.9.

**Current state (post Epic 13).** The screen shows N color columns with slot placeholders. The user can tap a slot → picker → assign. When user leaves without any assignment, nothing persists. In Epic 14 this behavior is preserved (zero-consumption when idle), but we add the bookmark path.

#### Layout additions

```
┌──────────────────────────────────────────┐
│ ← Brick Red · Crema · Azul Ultramar      │ ← nav title (combination name)
│                                          │
│ ╭─────────────────╮  (existing)          │
│ │ CompletenessBadge│  0/3 prendas        │ ← existing component, no change
│ ╰─────────────────╯                      │
│                                          │
│  ◯ Brick Red   ◯ Crema    ◯ Azul Ultram.  │ ← existing columns UI
│  [empty]       [empty]     [empty]        │
│   + asignar     + asignar   + asignar     │
│                                          │
│  ─────────── hairline ──────────────      │ ← divider (new)
│                                          │
│     ┌──────────────────────────────┐      │
│     │  ★  Guardar para luego       │      │ ← NEW — secondary CTA
│     └──────────────────────────────┘      │    ghost button style
│                                          │     48pt height
│                                          │     star icon (SF bookmark)
│                                          │     text-secondary
└──────────────────────────────────────────┘
                                            ↑ above FAB_PROTRUSION
```

**Layout notes.**
- The "Guardar para luego" CTA sits at the bottom of the main content area, above the Tab Bar protrusion (`FAB_PROTRUSION` import from `CustomTabBar.tsx`).
- Visual style: **ghost / outlined**, not a filled button — it's a secondary action, not a primary one. The primary action on this screen is "assign garments" (which happens via the columns).
- Icon: SF Symbol `bookmark` or `star` — test both in Pencil.

**State variants.**

| User state | CTA label | CTA style |
|-----------|-----------|-----------|
| Never interacted with this look | "Guardar para luego" | Ghost outlined |
| Already in Mis Looks (via auto-save from first assignment OR prior "Guardar para luego") | "Guardado · editar" OR simply hide the CTA (we choose **hide** to reduce chrome — the badge tells the story) | — |
| Free user at 5/5 Mis Looks, zero assigned garments | "Guardar para luego" | Same — tapping triggers paywall |

**Interaction.**
- Tap "Guardar para luego" → `hapticMedium` → if paywall doesn't trip → create Mis Looks entry with 0 assignments → CTA instantly hides (now "already saved") → small toast: *"Guardado en Mis Looks"* (2s, dismissible) → no navigation (user stays on Ficha Wada).
- Tap first garment slot → existing flow → on assignment → trigger auto-save behavior (story 14.8) → the CTA hides automatically (no confusion).

**Accessibility.**
- `accessibilityLabel="Guardar este look para trabajarlo más tarde"`.
- `accessibilityHint="Lo añade a Mis Looks sin prendas asignadas"`.
- `accessibilityRole="button"`.
- Hidden entirely when look is already saved (not just visually — `accessibilityElementsHidden`).

**Copy (EN+ES):**
- ES: *"Guardar para luego"* · *"Guardado · editar"* (or hide)
- EN: *"Save for later"* · *"Saved · edit"* (or hide)
- Toast ES: *"Guardado en Mis Looks"*
- Toast EN: *"Saved to Mis Looks"*

**Trade-offs.**
- *Why not a FAB/sticky for "Guardar para luego"?* It would compete with the Tab Bar FAB (camera). Also, the user-intent of "Guardar para luego" is subordinate to "assign a garment" — a sticky button would wrongly promote it.
- *Why hide CTA when already saved, instead of showing a "Saved" badge?* The CompletenessBadge already tells the state via `X/N prendas asignadas`. Adding a second "Saved" label would duplicate information. Hide is cleaner.

**Pencil TODOs:**
- Exact ghost-button visual treatment (border color, bg opacity).
- Whether a small toast on save is the right feedback vs. subtle CTA transformation (fade to "Guardado · editar" for 3s before hiding).
- Icon choice: star vs bookmark.

---

### UX-DR3 — Delete Garment Discoverable Affordance (S3 Picker)

**Context.** Today, users can only delete a wardrobe garment via long-press → bottom sheet (invisible gesture, per Alejandro's observation in `ideas.md`). Epic 14 introduces a **simplified edit mode** where long-press activates a clean per-thumbnail (−) icon without wiggle animation. **Unblocks:** story 14.12.

**Decision baseline (closed with Alejandro 2026-04-21):** clean (−) icon on each thumbnail; NO wiggle animation (more Outfinder, less iPhone-noisy); long-press on a single thumbnail continues to work for v1.3.0 backwards compat; tap anywhere outside or "Listo" in header exits edit mode.

#### Layout — Normal State (unchanged from Epic 13)

```
┌──────────────────────────────────────────┐
│ ← Mi armario                    Filtro   │ ← nav bar
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │      │  │      │  │      │            │ ← 3-column grid, existing
│  │ jrsy │  │ pant │  │ shoes│            │    thumbnails
│  │      │  │      │  │      │            │
│  └──────┘  └──────┘  └──────┘            │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │      │  │      │  │      │            │
│  ...                                     │
└──────────────────────────────────────────┘
```

#### Layout — Edit Mode (activated by long-press on any thumbnail)

```
┌──────────────────────────────────────────┐
│ Cancelar    Editar armario       Listo   │ ← nav bar replaces with
│                                          │    edit mode header
│  ┌─●────┐  ┌─●────┐  ┌─●────┐            │ ← (−) icon top-left corner
│  │ (−)  │  │ (−)  │  │ (−)  │            │    on each thumbnail
│  │ jrsy │  │ pant │  │ shoes│            │    clean circle 24pt diameter
│  │      │  │      │  │      │            │    paper bg + charcoal icon
│  └──────┘  └──────┘  └──────┘            │
│                                          │
│  ┌─●────┐  ┌─●────┐  ┌─●────┐            │ ← all thumbnails get (−)
│  │ (−)  │  │ (−)  │  │ (−)  │            │    NO wiggle
│  ...                                     │
└──────────────────────────────────────────┘
```

**(−) icon visual spec.**
- Shape: filled circle, 24pt diameter, positioned top-left corner with 4pt inset from thumbnail edges.
- Background: paper cream (`#f5f0e8`-ish) with 1pt border in muted charcoal.
- Glyph: horizontal stroke, charcoal.
- Hit area: 44pt (invisible extension beyond visual 24pt).

**Interaction.**
- **Enter edit mode:** long-press ANY thumbnail → `hapticMedium` → nav bar morphs to "Cancelar / Editar armario / Listo" → (−) icons fade in on all thumbnails (250ms, respected by Reduce Motion — instant appearance if enabled).
- **Tap (−) on a thumbnail:** `hapticRigid` → confirmation sheet:
  ```
          ¿Eliminar esta prenda?
           Desasignará la prenda
         de los looks que la usan.

      ┌──────────────────────────┐
      │        Eliminar           │ ← destructive, red
      └──────────────────────────┘
      ┌──────────────────────────┐
      │        Cancelar           │
      └──────────────────────────┘
  ```
  → Confirm → `cascadeDeleteAssignmentsForItem(id)` (existing fn from Epic 13).
- **Tap thumbnail body (not (−)):** do nothing in edit mode (we don't want to accidentally navigate into the item).
- **Tap "Listo":** exit edit mode → (−) icons fade out → nav bar restored.
- **Tap "Cancelar":** same as "Listo" (no pending actions).
- **Long-press a single thumbnail in NORMAL mode (v1.3.0 gesture):** keep existing bottom-sheet confirmation flow. NO regression.

**Accessibility.**
- (−) icon: `accessibilityLabel="Eliminar ${garmentCategory}"`, `accessibilityRole="button"`, `testID="armario-delete-${id}"`.
- Edit mode nav bar: "Listo" / "Cancelar" with `accessibilityRole="button"`.
- VoiceOver announcement on entering edit mode: *"Modo edición activado. Toca el botón eliminar de una prenda para borrarla."*
- Reduce Motion: (−) icons appear instantly (no fade), no transition animations.

**Copy (EN+ES):**
- ES: nav title *"Editar armario"*, buttons *"Cancelar"* / *"Listo"*, confirmation *"¿Eliminar esta prenda?"* / *"Desasignará la prenda de los looks que la usan."*, actions *"Eliminar"* / *"Cancelar"*.
- EN: *"Edit wardrobe"*, *"Cancel"* / *"Done"*, *"Delete this garment?"* / *"This will unassign it from any looks using it."*, *"Delete"* / *"Cancel"*.

**Trade-offs.**
- *Why not wiggle animation?* Alejandro explicitly wants cleaner-than-iOS. Wiggle is noisy and draws too much attention in an app that values calm. The (−) icon alone is enough signal.
- *Why not always-visible (−)?* Rejected — always-visible ruins the picker's calm (per `project_s3_picker_ux_debt.md`).
- *Why not a hint-text banner?* Alejandro rejected option (a) explicitly — it's a patch, not a system.

**Pencil TODOs:**
- Exact (−) icon treatment: plain vs filled vs bordered circle; charcoal vs red tint.
- Whether the enter-edit-mode hint toast is needed for discoverability (*"Tip: mantén pulsada una prenda para editar el armario"*) — probably **no**, but worth Pencil-testing with mockups.
- Whether "Cancelar" and "Listo" are both needed, or only "Listo" (they do the same thing here).

---

### UX-DR4 — Mis Looks Tab (Rename + Icon + "+ Nuevo look")

**Context.** The Favorites tab becomes "Mis Looks" — a rename with semantic weight. The heart icon → wardrobe/hanger icon. The empty and populated states both surface a narrative "+ Nuevo look" entry card as the top item. **Unblocks:** stories 14.7 (rename + icon) and 14.10 (+ Nuevo look CTA).

#### Layout — Populated state

```
┌──────────────────────────────────────────┐
│   Mis Looks                              │ ← large title, NotoSerifJP
│                                          │     28pt Medium
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ ✨  Empieza un look nuevo         │   │ ← narrative card
│   │                                   │   │    64pt tall (or auto)
│   │   Explora las paletas de          │   │    bg-elevated
│   │   Sanzo Wada y arma tu look  →    │   │    hairline border
│   │                                   │   │    Noto Serif JP title
│   └──────────────────────────────────┘   │    Inter subtitle
│                                          │
│   ───── En curso ─────                   │ ← section label
│                                          │    Inter Medium 13pt muted
│                                          │
│   ┌─────┐ ┌─────┐ ┌─────┐                │ ← horizontal scroll
│   │ 2/3 │ │ 1/3 │ │ 0/3 │                │    incomplete looks
│   │ ... │ │ ... │ │ ... │                │    (see UX-DR5)
│   └─────┘ └─────┘ └─────┘                │
│                                          │
│   ───── Mis looks completos ─────         │ ← section label
│                                          │
│   ┌────────────┐  ┌────────────┐         │ ← existing ComboCard compact
│   │            │  │            │         │    grid (Epic 9 design)
│   │  combo     │  │  combo     │         │    UNCHANGED
│   │            │  │            │         │
│   └────────────┘  └────────────┘         │
│                                          │
│   ┌────────────┐  ┌────────────┐         │
│   ...                                    │
└──────────────────────────────────────────┘
```

#### Layout — Empty state

```
┌──────────────────────────────────────────┐
│   Mis Looks                              │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ ✨  Empieza un look nuevo         │   │ ← narrative card
│   │                                   │   │    SAME as populated
│   │   Explora las paletas de          │   │    (promoted empty state)
│   │   Sanzo Wada y arma tu look  →    │   │
│   │                                   │   │
│   └──────────────────────────────────┘   │
│                                          │
│                                          │
│       Aún no tienes looks guardados.      │ ← muted helper copy
│      Fotografía una prenda o escoge       │    Inter 14pt text-muted
│      una paleta para empezar.             │    centered below card
│                                          │
└──────────────────────────────────────────┘
```

**Layout notes.**
- The "+ Nuevo look" card is a **single-item at the top of the scroll**, not a FAB and not a list item. It acts as a protagonist in empty state and as a header in populated state.
- Icon: sparkle (`✨` SF Symbol `sparkles`) or a minimalist hanger glyph — Pencil test both.
- Tap target: full-card pressable, 48pt minimum height, rounded corners (12pt), hairline border.
- Background: `bg-elevated` (slightly brighter than paper) to distinguish from combo cards below.
- Copy is warm and inviting, not transactional.

**Interaction.**
- Tap card → `hapticLight` → navigate to Wada palette catalog. For Epic 14 we route to `ColorHome` (existing palette discovery home) since that's the natural "explore palettes" entry. Sprint Plan may refine to a dedicated route if Alejandro requests.
- On populated scroll: the card stays at the top (does NOT stick — it scrolls with content; sticky would compete with the nav bar).

**Tab Bar update.**
- Label: *"Favoritos"* → *"Mis Looks"* (ES), *"Favorites"* → *"My looks"* (EN). Dynamic Type-safe.
- Icon: `heart` → **`archivebox`** (recommended first try) or **`hanger`** — test both in Pencil. `archivebox` is more iOS-native and suggests "things stored", `hanger` is more on-brand (fashion).
- Icon states: outlined (inactive), filled (active) — standard SF Symbol pattern.

**Accessibility.**
- Tab: `accessibilityLabel="Mis Looks"`, `accessibilityRole="tab"`, `accessibilityState={{ selected: true/false }}`.
- Card: `accessibilityLabel="Empezar un look nuevo"`, `accessibilityHint="Explora paletas de Sanzo Wada para empezar un look"`, `accessibilityRole="button"`.

**Migration UX (v1.3.0 → v1.4.0).**
- A user who had Favorites in v1.3.0 opens v1.4.0 and sees "Mis Looks" with all their favorites migrated as items. The narrative card sits at top. The first-time-seeing-this moment should feel like *"my things are here, they have a new home"*, not *"my things were renamed, I'm confused"*. Copy helps: the card welcomes with "Empieza un look nuevo" which implies "you can keep adding".
- No migration-specific banner is needed — the migration is invisible and the content is intact.

**Pencil TODOs:**
- Icon choice: archivebox vs hanger vs sparkles vs tshirt-stacked.
- Card visual: flat (hairline border) vs elevated (shadow) vs tinted (slight Wada accent).
- Subtitle copy: current is *"Explora las paletas de Sanzo Wada y arma tu look"* — maybe shorter? *"Explora paletas Wada"*?
- Whether the card should include a tiny visual (Wada color swatch sample, mini palette preview).

---

### UX-DR5 — Incomplete Looks Retention Surface

**Context.** Epic 14's soft return-reason engine. Incomplete looks (`X/N prendas asignadas` with `X < N`) are surfaced prominently in Mis Looks so users have a clear reason to re-open the app. **Unblocks:** story 14.11.

**Decision baseline:** surface goes in **top of Mis Looks** (NOT Home — Home stays color-first clean); horizontal scroll section "En curso"; reuses S5 badges.

#### Layout (already sketched in UX-DR4)

```
   ───── En curso ─────                    ← section label
                                            Inter Medium 13pt muted
                                            32pt top margin
                                            16pt bottom margin

   ┌─────────┐ ┌─────────┐ ┌─────────┐     ← horizontal FlatList
   │ ◯◯◯     │ │ ◯◯      │ │ ◯       │     tiles 160pt wide
   │  2/3    │ │  1/3    │ │  0/3    │     112pt tall
   │ ... ... │ │ ... ... │ │ ... ... │
   └─────────┘ └─────────┘ └─────────┘
```

**Tile spec.**
- Dimensions: 160pt × 112pt (iPhone) — Pencil iterates.
- Content inside tile:
  - **Top row:** 3 mini color swatches (circles 24pt) representing the Wada combination's colors. Circles styled exactly like the existing PaletteStrip/ColorSwatch idiom.
  - **Center:** CompletenessBadge component (existing, from Epic 13 S5) with `X/N` ratio.
  - **Bottom:** Wada combination name (Japanese + English truncated if needed), Noto Serif JP 12pt.
- Background: `bg-elevated`, hairline border, 12pt corner radius.
- Tap: navigate to `ArmarioFichaWadaScreen` for that `combinationId`.

**Order.** Most recent first (sorted by `updatedAt` descending).

**Empty state.** Section hides gracefully — no placeholder, no "no hay looks en curso" label. Complete looks fall to the lower section.

**Scroll.** Horizontal ScrollView (or FlatList horizontal) with 16pt padding, 12pt gap between tiles. Momentum scroll, native iOS inertia.

**Interaction.**
- Tap tile → `hapticLight` → push `ArmarioFichaWadaScreen`.
- Long-press tile → no-op for Epic 14 (future: maybe show quick-assign prenda shortcut; out of scope).

**Accessibility.**
- Section header: `accessibilityRole="header"`, `accessibilityLabel="En curso. Tus looks a medias."`.
- Tile: `accessibilityLabel="Look ${combinationName}. ${X} de ${N} prendas asignadas. Faltan ${N-X}."`, `accessibilityHint="Abre este look para asignar más prendas"`, `accessibilityRole="button"`.
- VoiceOver flow: section header → each tile horizontally.

**Transition when a look becomes complete.**
- When the user assigns the last garment in a Ficha Wada, that look leaves "En curso" and appears in "Mis looks completos" below.
- Smooth transition: fade-out tile from "En curso" (200ms) and fade-in card in "Completos" section.
- Reduce Motion: instant swap, no animation.

**Pencil TODOs:**
- Tile dimensions (160×112 is a proposal; might be tighter).
- Exact mini-swatch size and spacing within tile.
- Whether the tile shows a preview polaroid thumbnail of the user's assigned garments (nice but data-heavy; probably later).

---

### UX-DR6 — Visualizer Bridge (Primary CTA: "Hacer este look mío")

**Context.** The Outfit Visualizer stops being a dead-end "share or abandon" screen and becomes a bridge into the user's armario. **Unblocks:** story 14.6.

**Decision baseline:** remove the "Compartir Outfit" button; replace with a full-width anchor-bottom primary CTA "Hacer este look mío" / "Make this look mine". The S4 polaroid screen remains shareable (no regression on `shareOutfit`).

#### Current Visualizer (before Epic 14)

The existing `OutfitVisualizer.tsx` has the share button as an absolute overlay at `bottom: 48`, outside the capturable area (see `shareViewRef` pattern in `src/lib/share.ts`). Copy: `t("visualizer.shareButton")`.

#### Post-Epic-14 layout

```
┌──────────────────────────────────────────┐
│ ← nav                                     │
│                                          │
│   [WadaHeader - nameJp / nameEn]          │ ← unchanged
│                                          │
│   ┌────────────────────────────────┐     │
│   │                                │     │
│   │                                │     │
│   │    Aureola                     │     │ ← unchanged
│   │                                │     │
│   │    OutfitCard                  │     │ ← unchanged
│   │      with tinted garments       │     │    (variant toggle +
│   │                                │     │     tap-swap still work)
│   │                                │     │
│   └────────────────────────────────┘     │
│                                          │
│   [MiniPaletteStrip]                     │ ← unchanged
│                                          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Hacer este look mío        →       │  │ ← NEW primary CTA
│  └────────────────────────────────────┘  │    full-width, 48pt
│                                          │    Wada-accent bg
└──────────────────────────────────────────┘
                                           ↑ FAB_PROTRUSION inset
```

**CTA visual spec.**
- Full-width (with 16pt side margins), 48pt height, bottom-anchored with `FAB_PROTRUSION` inset to avoid overlap with Tab Bar cradle.
- Background: tinted with the **dominant Wada color of the combination** (the Aureola color, for consistency). Paper-cream text for contrast.
- Font: Inter Medium 16pt.
- Arrow glyph (→) on right side.

**Interaction.**
- Tap CTA → `hapticMedium` → navigate `push` to `ArmarioFichaWadaScreen` for this combination, in working mode (zero assignments yet, no persistence).
- Swipe back from Ficha Wada returns to Visualizer (native swipe).

**Share removal.**
- The old share button is **deleted entirely** — not demoted. Per Alejandro's decision: the Visualizer is not shareable; only S4 polaroid is.
- The `shareOutfit` function and `shareViewRef` remain for S4 (no regression). Only the button in `OutfitVisualizer.tsx` is removed.

**States.**
- **Default:** as shown.
- **Loading (garment images):** existing behavior preserved — CTA is rendered but disabled until OutfitCard is ready.
- **Reduce Motion:** CTA appears instantly, no entrance animation.

**Accessibility.**
- CTA: `accessibilityLabel="Hacer este look mío"`, `accessibilityHint="Abre este look en tu armario para asignarle prendas"`, `accessibilityRole="button"`, `testID="visualizer-make-mine"`.
- VoiceOver flow: WadaHeader → OutfitCard (with variant/swap labels) → MiniPaletteStrip → primary CTA.

**Copy (EN+ES):**
- ES: *"Hacer este look mío"*
- EN: *"Make this look mine"*

**Trade-offs.**
- *Why tinted background vs. paper-colored button?* The tinted CTA is a hallmark of Outfinder's identity — every decision surface is tinted by the content it acts on. It also solves the risk of the CTA being perceived as generic chrome.
- *Why remove share entirely vs demote?* A demoted share icon would compete for attention with the primary CTA and confuse the flow. Clean removal reinforces the new narrative.

**Pencil TODOs:**
- Exact tint intensity (too dark = unreadable text; too light = weak).
- Whether to add a second secondary action ("Solo ver combinaciones" link) — my gut: **no**, the user already got here by exploring combinations; keep the bridge singular.
- Icon/glyph on CTA: arrow vs. hanger.

---

## Arquitectura de Cámaras y Flujos Convergentes

*(Documentado en sesión Pencil 2026-04-21 — diagrama de flujo en frame `M6AKD` de `designs/Epic14.pen`)*

### Los tres caminos hacia Ficha Wada

| Path | Color badge | Entry | Cámara | Destino |
|------|-------------|-------|--------|---------|
| **FOTO** | Terracota | FAB Tab Bar | Cámara Descubrimiento (full pipeline) | Result Screen → Guardar → Ficha Wada |
| **COMBIS** | Azul | Home → Paleta → Visualizer | Sin cámara | "Hacer este look mío" → Ficha Wada |
| **ARMARIO** | Verde | Mi Armario / Mis Looks → look → slot vacío | Cámara Asignación (solo recorte) | Slot relleno en Ficha Wada |

Los tres caminos convergen en **Ficha Wada** — el workspace central de la app.

### Dos cámaras con propósitos distintos

**Cámara Descubrimiento** (Discovery Camera)
- Punto de entrada: FAB del Tab Bar.
- Pipeline completo: `removeBackground` → `getColors` → `matchWadaColor`.
- Produce: cutout PNG + tono Wada detectado + conteo de combinaciones.
- Lleva a: Result Screen (UX-DR1) → categoría → Guardar en armario.
- Implementación: `CaptureScreen` existente se **elimina**; se crea pantalla nueva en Story 14.3.

**Cámara Asignación** (Assignment Camera)
- Punto de entrada: tap en slot vacío dentro de Ficha Wada.
- Pipeline reducido: solo `removeBackground` (cutout). Sin `getColors`. Sin `matchWadaColor`.
- El tono ya está fijado por la paleta Wada de la Ficha.
- Produce: cutout PNG listo para asignar al slot seleccionado.
- Implementación: `ArmarioCaptureScreen` existente (Epic 13) — **se preserva en Story 14.3**.

> **Regla para Story 14.3:** Solo se elimina `CaptureScreen`. `ArmarioCaptureScreen` sobrevive.

### El Outfit Visualizer solo vive en el path COMBIS

El Visualizer es accesible únicamente vía exploración de paletas (Home → combinación → Visualizer). No es un destino final sino un puente:
- **Botón eliminado:** "Compartir Outfit" (share externo desaparece — solo el polaroid S4 sigue siendo compartible).
- **CTA principal:** "Hacer este look mío" → navega a Ficha Wada en modo trabajo.
- **Sin persistencia automática:** entrar a Ficha Wada desde el Visualizer **NO** crea entrada en Mis Looks. El slot se consume solo con el primer gesto activo (asignación de prenda o "Guardar para luego").

### Catalogar ropa sin flujo de descubrimiento (batch case)

El usuario puede fotografiar y guardar prendas en su armario sin seguir el flujo de descubrimiento usando el FAB repetidas veces (N veces = N prendas). No hay un botón "Fotografiar prenda nueva" dentro de la pestaña Mi Armario para v1.4.0. El FAB central es el punto de entrada universal. Un botón dedicado dentro del Armario queda para v1.5.0+.

---

## Cross-Cutting Concerns

### Tab Bar final state (Epic 14)

| Tab | Label (ES / EN) | Icon | Notes |
|-----|-----------------|------|-------|
| Home | *Colores* / *Colors* | `paintpalette` | Unchanged (color-first home, Wada catalog). |
| — Center FAB | — | `camera` | **Unified camera entry (Epic 14).** Opens UX-DR1 screen 1. |
| Mis Looks | *Mis Looks* / *My looks* | **`archivebox`** (rec'd) | Rename + icon swap (UX-DR4). |
| Settings | *Ajustes* / *Settings* | `gearshape` | Unchanged. |

### Migration UX

On first launch post-upgrade v1.3.0 → v1.4.0:

- Migration runs silently on app bootstrap (story 14.2).
- No "what's new" modal for Epic 14 (craft-driven; we trust users to discover).
- If migration fails for a specific record, it's skipped with a silent log — the user sees their other looks intact. No scary error dialogs.
- The tab rename + icon swap may look different to a returning user. We do **not** highlight it with tooltips or onboarding — the content (their favorites now under "Mis Looks") speaks louder than a badge.

### Copy Glossary (EN + ES)

| Key | ES | EN |
|-----|-----|------|
| Camera capture hint | *Fotografía tu prenda completa* | *Photograph your full garment* |
| Result — primary CTA | *Guardar en mi armario* | *Save to my wardrobe* |
| Result — secondary link | *ver combinaciones sin guardar* | *see combinations without saving* |
| Result — combinations count (plural) | *Aparece en {count} combinaciones* | *Appears in {count} combinations* |
| Result — combinations count (singular) | *Aparece en 1 combinación* | *Appears in 1 combination* |
| Category sheet — title | *¿Qué tipo de prenda es?* | *What type of garment is it?* |
| Category 1 | *Parte de arriba* | *Top* |
| Category 2 | *Parte de abajo* | *Bottom* |
| Category 3 | *Calzado* | *Footwear* |
| Category 4 | *Accesorio* | *Accessory* |
| Category sheet — confirm | *Confirmar* | *Confirm* |
| Post-save — primary | *Ver combinaciones con {wadaName}* | *See combinations with {wadaName}* |
| Post-save — secondary | *Volver a Mis Looks* | *Back to Mis Looks* |
| Ficha Wada — bookmark CTA | *Guardar para luego* | *Save for later* |
| Ficha Wada — toast | *Guardado en Mis Looks* | *Saved to Mis Looks* |
| Armario — edit mode title | *Editar armario* | *Edit wardrobe* |
| Armario — confirm delete title | *¿Eliminar esta prenda?* | *Delete this garment?* |
| Armario — confirm delete body | *Desasignará la prenda de los looks que la usan.* | *This will unassign it from any looks using it.* |
| Armario — delete | *Eliminar* | *Delete* |
| Armario — done / cancel | *Listo* / *Cancelar* | *Done* / *Cancel* |
| Mis Looks — tab label | *Mis Looks* | *My looks* |
| Mis Looks — new look card title | *Empieza un look nuevo* | *Start a new look* |
| Mis Looks — new look card subtitle | *Explora las paletas de Sanzo Wada y arma tu look* | *Explore Sanzo Wada palettes and build your look* |
| Mis Looks — in-progress section | *En curso* | *In progress* |
| Mis Looks — completed section | *Mis looks completos* | *My completed looks* |
| Mis Looks — empty helper | *Aún no tienes looks guardados. Fotografía una prenda o escoge una paleta para empezar.* | *No saved looks yet. Photograph a garment or pick a palette to begin.* |
| Visualizer — primary CTA | *Hacer este look mío* | *Make this look mine* |

### Accessibility checklist (global)

Every Epic 14 surface MUST verify:

- [ ] All interactive elements have `accessibilityLabel`.
- [ ] Buttons have `accessibilityRole="button"`.
- [ ] Links (text-only CTAs) use `accessibilityRole="link"`.
- [ ] Touch targets ≥ 44pt (48pt preferred).
- [ ] Decorative images: `accessibilityElementsHidden`.
- [ ] Dynamic content state changes announced (`AccessibilityInfo.announceForAccessibility`).
- [ ] Reduce Motion respected (no animations when enabled — instant state changes).
- [ ] VoiceOver traversal order is logical top-to-bottom, left-to-right.
- [ ] Color never conveys meaning alone (the (−) icon has a label, the CompletenessBadge has text, etc.).
- [ ] Dynamic Type support: copy reflows gracefully (no fixed-height buttons clipping text).

### Haptics contract (Epic 14 surfaces)

| Surface | Haptic | Function |
|---------|--------|----------|
| Camera capture button press | `hapticRigid` | Commit/capture moment — weighty. |
| Result screen primary CTA tap | `hapticMedium` | Commit-ish (opens category sheet). |
| Result screen secondary link tap | `hapticLight` | Navigation, low weight. |
| Category sheet row select | `hapticLight` | Selection. |
| Category sheet confirm | `hapticMedium` | Commit (persists + triggers paywall branch). |
| Ficha Wada "Guardar para luego" | `hapticMedium` | Commit. |
| Armario enter edit mode (long-press) | `hapticMedium` | Mode shift. |
| Armario (−) tap | `hapticRigid` | Destructive action about to happen. |
| Armario confirm delete | `hapticRigid` | Destructive confirm. |
| Mis Looks "+ Nuevo look" card tap | `hapticLight` | Navigation. |
| Incomplete look tile tap | `hapticLight` | Navigation. |
| Visualizer "Hacer este look mío" tap | `hapticMedium` | Commit-ish (enters workspace). |

---

## Handoff Notes

### Stories unblocked by this spec (can enter `bmad-create-story`)

- **14.4** — Camera result screen UI (UX-DR1 screens 1 + 2 defined).
- **14.5** — Save flow + category selector + paywall (UX-DR1 sheet + post-save screen defined).
- **14.6** — Visualizer bridge CTA (UX-DR6 defined).
- **14.9** — Guardar para luego (UX-DR2 defined).
- **14.10** — "+ Nuevo look" entry point (UX-DR4 defined).
- **14.11** — Incomplete-looks retention surface (UX-DR5 defined).
- **14.12** — Delete discoverable affordance (UX-DR3 defined).

### Story 14.7 (Mis Looks rename + icon)

Partially unblocked. Label and behavior are defined. **Icon final choice** (archivebox vs hanger) is a Pencil TODO — but dev can start with `archivebox` as the provisional choice and iterate.

### Stories not needing UX design (can start now regardless)

- **14.1** — WardrobeItem schema + category field (data only).
- **14.2** — Favorites v1.3.0 → Mis Looks migration (data only).
- **14.3** — Unified camera pipeline + FAB routing + CaptureScreen removal (infrastructure).

### Pencil TODOs (consolidated)

#### Resueltos en sesión Pencil 2026-04-21 (`designs/Epic14.pen`)

| TODO | Decisión | Frame(s) |
|------|----------|----------|
| Cutout height sweet spot (180/220/260pt) | **220pt** — mejor balance entre presencia emocional y espacio de jerarquía | `DM7IA` (180), `6nPEq` (220★), `XFB8f` (260) |
| CTA tint intensity en colores pálidos | **Regla:** luminancia Wada > 0.40 → texto oscuro `#2d2a26`; ≤ 0.40 → cream `#faf7f2` | `dQo0p` (problema), `EZ4EA` (solución) |
| Corrección de tono (ΔE < 8) — nuevo en sesión | **Sección condicional** en Result screen (ver "Tone Correction" en UX-DR1 States) | `KY9jv` |
| Arquitectura 2 cámaras + flujos convergentes — nuevo en sesión | Documentado en sección "Arquitectura de Cámaras y Flujos Convergentes" | `M6AKD` |

#### Pendientes para iteración futura

1. **UX-DR1 Capture:** hint copy placement, capture button visual, viewfinder aspect ratio, whether hint fades on detected subject fill.
2. **UX-DR1 Result:** vertical rhythm entre Wada stack y count line, exact arrow glyph en primary CTA. *(cutout height y tint rule ya resueltos — ver tabla arriba)*
3. **UX-DR1 Category sheet:** icon system (SF Symbols vs custom line-art), row height, selection visual treatment.
4. **UX-DR1 Post-save:** whether it's a full screen / sheet / overlay; whether to show saved cutout thumbnail.
5. **UX-DR2 Ficha Wada:** ghost button vs outlined vs text-link treatment for "Guardar para luego"; star vs bookmark icon; toast vs inline confirmation.
6. **UX-DR3 Edit mode:** (−) icon treatment (plain / filled / bordered), charcoal vs red tint, whether to show a discoverability hint toast on first edit-mode entry.
7. **UX-DR4 Mis Looks tab:** icon choice (archivebox vs hanger vs sparkles vs tshirt-stacked); card visual (flat vs elevated vs tinted); subtitle brevity; optional mini-visual in card.
8. **UX-DR4 "+ Nuevo look" card:** icon/glyph, dimensions, optional accent.
9. **UX-DR5 Incomplete tiles:** exact dimensions, mini-swatch sizing, whether to preview user's assigned garments inside tile.
10. **UX-DR6 Visualizer CTA:** arrow vs hanger glyph, whether secondary "solo ver" link is needed. *(tint intensity rule ya resuelta — ver tabla arriba)*

### Next-step recommendations (for Alejandro)

Three paths, all valid:

- **Path A — Validate visually first:** Open a new conversation with Sally in Pencil (MCP `pencil`). Bring this spec. Iterate mockups for the critical surfaces (UX-DR1 Result, UX-DR4 card, UX-DR6 CTA). Approve pixel-perfect design. Then run `bmad-sprint-planning`.
- **Path B — Start dev in parallel:** Run `bmad-sprint-planning` now. Begin `bmad-create-story 14.1` (schema) and `bmad-create-story 14.2` (migration) and `bmad-create-story 14.3` (camera pipeline) — all UX-independent. While dev runs on those, use another window to iterate Pencil mockups with Sally for the UX-dependent stories.
- **Path C — Combined:** Do Path B + parallel Pencil iteration. Maximum throughput. My recommendation.

### Success criteria for this spec

This document is "done enough" when:
- All 6 UX-DRs have wireframe-level layout, visual hierarchy, state coverage, interaction detail, and a11y plan.
- Any dev agent can pick up story 14.4, 14.5, 14.6, 14.9, 14.10, 14.11, or 14.12 and implement it with only Pencil-level micro-iterations remaining, not structural unknowns.
- No product decisions are re-opened. Only visual/copy micro-decisions remain.

All three ✅.

---

*Sally signing off. Coffee and Pencil await.*
