---
status: ready-for-sprint-planning
created: 2026-04-26
owner: Alejandro
pm: John
inputDocuments:
  - docs/planning/epic-15-ideas-pre-launch.md
  - docs/planning/epic-14/epic-14.md
  - docs/planning/architecture-react-native-ios.md
  - CLAUDE.md
audit_session: 2026-04-26 (Explore agent — 5 áreas)
---

# Outfinder — Epic 15: Pre-launch polish (v1.4.0)

## Overview

Epic 15 es el **último epic antes del launch v1.4.0**. Cierra 3 gaps detectados al revisar Epic 14 feature-complete: (1) un gap funcional en el flujo "En curso → Foto nueva/Biblioteca" del armario, (2) onboarding anticuado que no refleja la app actual, (3) inconsistencias menores de estilo y copy. Se acompaña en paralelo de la regeneración de marketing screenshots (track separado).

**Launch trigger:** todas las stories en `done` + on-device QA + screenshots marketing nuevos → `release-manager` para submit App Store.

## 📦 Release context

- v1.3.0 = producción actual (Epic 1–11 shipped).
- v1.4.0 = Epic 13 (Armario Virtual) + Epic 14 (App Flow Reorganization) + **Epic 15 (este)** ship juntos.
- Epic 14 entra en epic-15 con 14.13 ya merged (QA on-device pasada, 7 bugs cerrados, paywall context-aware).
- Branch base: **`epic-14` HEAD post-merge de 14.13**. Epic 15 se desarrolla en branch `epic-15`. Merge final: `epic-15` → `epic-1` (main) para release.

## ⚠️ Decisiones cerradas (PM session 2026-04-26)

> **Story agents y devs:** estas son las decisiones load-bearing cerradas por Alejandro + John tras la auditoría Explore. Si una AC contradice una decisión, la decisión gana.

- **DEC-1 · Visualizer permanece (NO se mata).** v2-strategy-brief deja la decisión hybrid/kill abierta para el futuro; en v1.4.0 mantenemos Visualizer y lo pulimos (background paper-cream + onboarding nuevo). Implicación: A1 + A2 entran en Tier 1 del epic.
- **DEC-2 · Categoría OBLIGATORIA en flujo "En curso".** Cuando un user agrega una prenda desde Foto nueva o Biblioteca dentro del flujo "En curso", debe pasar por `CategoryPickerSheet` antes de guardar. Coherencia total con flujo principal cámara FAB. No se permite guardar sin categoría.
- **DEC-3 · Coach mark sobre interstitial.** Para C1 (cámara FAB first-use): coach mark superpuesto, NO interstitial pantalla completa. Razón: interstitial = fricción antes del "wow"; coach mark deja ver la cámara real al fondo.
- **DEC-4 · A2 doble affordance.** Coach mark first-use **+** underline pulse permanente (quitar gate `isSelected` en `OutfitCard.tsx`). Razón: coach mark se skipea, pulse permanente garantiza descubribilidad continua.
- **DEC-5 · Sistema de coach marks reutilizable.** Crear `CoachMarkOverlay` + `useCoachMark(key)` en Story 15.1. Razón: 2 coach marks nuevos en el epic (C1 + A2). Sin foundation, duplicaríamos AsyncStorage logic.
- **DEC-6 · Onboarding antiguo del Visualizer SE BORRA.** No se preserva. Story 11.1 implementó coach marks ad-hoc en `OutfitVisualizer.tsx` (líneas 93–188 + 465–519) — todo eso fuera. Lo reemplaza el A2 nuevo construido sobre la foundation de 15.1.

Cualquier desviación de DEC-1 a DEC-6 requiere sign-off de Alejandro.

## Requirements Inventory

### Functional Requirements

**Reusable onboarding foundation**
- **FR1**: La app dispone de un componente `CoachMarkOverlay` reutilizable y un hook `useCoachMark(key)` que gestiona persistencia de "ya visto" vía AsyncStorage.
- **FR2**: El coach mark anterior del Visualizer (Story 11.1) se elimina del código y de las traducciones (claves `visualizer.coachStep1*`, `coachStep2*`, `gotIt`).

**Armario — gap "En curso" (B1)**
- **FR3**: Al agregar una prenda al flujo "En curso" vía Foto nueva, el sistema invoca `CategoryPickerSheet` antes de persistir el `WardrobeItem`. Sin categoría seleccionada, el guardado no procede.
- **FR4**: Al agregar una prenda al flujo "En curso" vía Biblioteca, el comportamiento es idéntico a FR3.
- **FR5**: La prenda guardada desde "En curso" tiene `WardrobeItem.category` poblado con uno de `"top" | "bottom" | "footwear" | "accessory"`.

**Cámara FAB onboarding (C1)**
- **FR6**: La primera vez que un user abre `UnifiedCameraCaptureScreen`, se muestra un coach mark superpuesto que explica el pipeline en lenguaje natural ("Fotografía tu prenda → la recortamos → detectamos su color Wada → te sugerimos combinaciones").
- **FR7**: Tras dismiss, el coach mark NO vuelve a aparecer en futuras aperturas (flag persistente vía `useCoachMark`).

**Visualizer onboarding (A2)**
- **FR8**: La primera vez que un user entra en `OutfitVisualizer`, un coach mark superpuesto explica que las siluetas son tocables y revelan armario / cambio de prenda.
- **FR9**: El underline pulse de los slots de `OutfitCard` está permanentemente activo (no condicionado a `isSelected`), ofreciendo affordance visual continuo de interactividad.

**Visualizer estilo (A1)**
- **FR10**: El background del `OutfitVisualizer` usa el token `wadaTokens.bgPaper` (paper cream global), no `warmBg`.
- **FR11**: La `Aureola` se ajusta para mantener contraste visible con el nuevo background claro (gradient opacity / colors revisados).

**Copy (D1, D2)**
- **FR12**: La string `"Empieza un look nuevo"` (key `favorites.newLookCta.title`) se reemplaza por `"Monta tu look"` en ES y por una versión EN equivalente.
- **FR13**: La string `"¿De qué color es tu ropa hoy?"` (key `home.subtitle`) se reemplaza por `"¿Qué color de ropa quieres combinar?"` en ES y por una versión EN equivalente.

### Non-Functional Requirements

- **NFR1**: Todos los nuevos elementos UI cumplen estándares de accesibilidad de `CLAUDE.md`: `testID`, `accessibilityLabel`, `accessibilityRole`, 44pt min, VoiceOver, Reduce Motion vía `AccessibilityInfo.isReduceMotionEnabled`.
- **NFR2**: Todos los strings nuevos (coach marks, copy) en ES + EN — la app es bilingüe desde Story 11.2.
- **NFR3**: `npx tsc --noEmit`, `pnpm lint`, `pnpm test` verde. Zero new test-skips.
- **NFR4**: Zero regresiones en flujo principal cámara FAB (UnifiedCameraStack), Visualizer (excepto cambios planificados), y Mis Looks.
- **NFR5**: On-device QA en iPhone 16 Pro pasa antes de submit App Store.
- **NFR6**: Coach marks respetan Reduce Motion (sin animaciones de entrada agresivas si está activo).
- **NFR7**: AsyncStorage keys de coach marks namespaced bajo `@outfinder/coachmark:*` para evitar colisión con keys existentes.

## Stories

> **Orden de ejecución sugerido:** 15.1 → 15.6 (en paralelo) → 15.3 → 15.4 → 15.5 → 15.2.
> **Razón:** 15.1 desbloquea 15.3 + 15.4 (foundation). 15.6 es trivial y no depende de nada. 15.5 antes de 15.2 para que A1 esté en QA del flujo armario. 15.2 al final por ser la más grande y tocar el flujo crítico.

---

### Story 15.1 — Reusable coach-mark foundation + remove legacy Visualizer onboarding

**Coste:** small · **Tasks:** 4

**Scope:**
- Crear `src/components/CoachMarkOverlay.tsx`: componente genérico (props: `visible`, `steps[]`, `onDismiss`, `testID`). Modal overlay con backdrop semi-transparente + tarjeta centrada + botón "Entendido". Respeta Reduce Motion (sin animación si activo).
- Crear `src/hooks/useCoachMark.ts`: hook que recibe key (`@outfinder/coachmark:<id>`), expone `{ shouldShow, markSeen }`. Lectura inicial de AsyncStorage en `useEffect`, write tras dismiss.
- Borrar todo el coach mark antiguo del Visualizer:
  - `src/screens/OutfitVisualizer.tsx` — eliminar `coachStep` state, `reduceMotionRef` setup, `cardOpacity/cardTranslateY/cardAnimStyle`, efecto AsyncStorage con key `@outfinder/visualizer-introduced`, `handleCoachOk`, render del overlay (líneas ~93-188 + 465-519 según audit).
  - `src/i18n/locales/es.json` + `en.json` — borrar `visualizer.coachStep1`, `coachStep1Announce`, `coachStep2`, `coachStep2Announce`, `gotIt`.
- Tests: `CoachMarkOverlay.test.tsx` (render, dismiss, a11y, reduce-motion path) + `useCoachMark.test.ts` (first read returns `shouldShow=true`, post-mark returns `false`, AsyncStorage error handled).

**Tareas:** (1) `CoachMarkOverlay` + tests; (2) `useCoachMark` + tests; (3) borrar legacy Visualizer onboarding + i18n cleanup; (4) AC verification.

**Files to touch:**
- NEW: `src/components/CoachMarkOverlay.tsx`, `src/components/CoachMarkOverlay.test.tsx`
- NEW: `src/hooks/useCoachMark.ts`, `src/hooks/useCoachMark.test.ts`
- MOD: `src/screens/OutfitVisualizer.tsx`
- MOD: `src/i18n/locales/es.json`, `src/i18n/locales/en.json`

**Dependencies:** none. Foundation story.

---

### Story 15.2 — B1: CategoryPicker mandatory in "En curso" flow (Foto nueva + Biblioteca)

**Coste:** medium · **Tasks:** 5

**Scope:**
- Cuando `ArmarioPickerScreen → handleNewPhoto` lanza `ArmarioCaptureScreen` y este produce un cutout, el flujo NO debe ir directo a `ArmarioPreviewScreen`. Debe interceptar y mostrar `CategoryPickerSheet` (componente existente reutilizado de Story 14.5).
- Implementación recomendada: añadir `CategoryPickerSheet` modal en `ArmarioPreviewScreen` antes de invocar `saveCutoutAsWardrobeItem`. La save call recibe la categoría seleccionada.
- Modificar signature de `onCutoutSaved` callback (en `ArmarioPickerScreen`) para incluir `category` (ya pasado por la sheet).
- Mismo flujo se aplica a la opción "Biblioteca" (image picker desde camera roll) — auditar si comparte path con "Foto nueva" o requiere wiring separado.
- Tests: AC tap "Foto nueva" → CategoryPickerSheet aparece tras cutout; tap categoría → save persiste con `category` correcta; dismiss sheet → no save; Biblioteca path mismo behavior.

**Tareas:** (1) audit fino del entry-point Biblioteca para confirmar shared vs separate path; (2) inyectar `CategoryPickerSheet` en `ArmarioPreviewScreen`; (3) modificar `handleCutoutSaved` signature en `ArmarioPickerScreen`; (4) tests de los 2 paths; (5) AC verification + on-device smoke.

**Files to touch:**
- MOD: `src/screens/armario/ArmarioPreviewScreen.tsx` (add CategoryPickerSheet state + modal)
- MOD: `src/screens/armario/ArmarioPickerScreen.tsx` (signature change)
- REUSE: `src/components/armario/CategoryPickerSheet.tsx` (existe, no se modifica)
- Tests: `ArmarioPreviewScreen.test.tsx` (extend), `ArmarioPickerScreen.test.tsx` (extend)

**Dependencies:** none directa (15.1 no requerido). Esta story puede moverse antes si conviene, pero por ser la más grande conviene al final tras estabilizar coach marks.

**Riesgo:** definir UX exacta — ¿la sheet aparece dentro de Preview o ANTES de Preview? Decisión de spec: dentro de Preview, como modal post-cutout, antes del botón "Guardar".

---

### Story 15.3 — C1: Camera FAB first-use coach mark

**Coste:** small · **Tasks:** 4

**Scope:**
- En `UnifiedCameraCaptureScreen.tsx`, integrar `useCoachMark("@outfinder/coachmark:camera-fab-firstuse")` y renderizar `CoachMarkOverlay` cuando `shouldShow`.
- Trigger: al montar la screen (no al pulsar FAB — la cámara ya está abierta y visible al fondo del overlay, refuerza el contexto).
- Copy (ES): "Fotografía tu prenda. La recortamos automáticamente, detectamos su color Wada y te sugerimos combinaciones." (EN equivalente).
- Single-step coach mark (no 2-step). Botón "Entendido" → `markSeen()`.
- Tests: primera apertura → overlay visible; tras dismiss + remount → no visible; AsyncStorage failure path.

**Tareas:** (1) wiring `useCoachMark` + render `CoachMarkOverlay` en Capture; (2) i18n keys nuevos `unifiedCamera.coachMark.*` ES+EN; (3) tests; (4) AC verification + on-device smoke.

**Files to touch:**
- MOD: `src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`
- MOD: `src/i18n/locales/es.json`, `src/i18n/locales/en.json`
- Tests: `UnifiedCameraCaptureScreen.test.tsx` (extend)

**Dependencies:** Story 15.1 (CoachMarkOverlay + useCoachMark).

---

### Story 15.4 — A2: Visualizer slot-discovery onboarding (coach mark + permanent pulse)

**Coste:** small · **Tasks:** 4

**Scope:**
- En `OutfitVisualizer.tsx`, integrar `useCoachMark("@outfinder/coachmark:visualizer-slots-firstuse")` y renderizar `CoachMarkOverlay` cuando `shouldShow`.
- Copy (ES): "Toca cualquier prenda para cambiarla o conectarla con tu armario." (EN equivalente).
- En `OutfitCard.tsx > CardSlot`: quitar el gate `isSelected` del underline pulse. El pulse anima permanentemente en todos los slots (ajustar opacity baseline para que sea sutil, no agresivo — si actual era `0 → 1`, considerar `0.3 → 0.7`).
- Validar a11y: el pulse no debe interferir con VoiceOver. Si la animación causa problema con Reduce Motion, freeze el pulse en su estado intermedio.
- Tests: coach mark first-use + dismiss persistente; pulse visible en TODOS los slots (no solo selected); reduce-motion respeta freeze.

**Tareas:** (1) wiring coach mark; (2) modificar pulse logic en `OutfitCard.tsx`; (3) i18n keys `visualizer.coachMark.*`; (4) tests + AC verification.

**Files to touch:**
- MOD: `src/screens/OutfitVisualizer.tsx`
- MOD: `src/components/OutfitCard.tsx`
- MOD: `src/i18n/locales/es.json`, `src/i18n/locales/en.json`
- Tests: `OutfitVisualizer.test.tsx`, `OutfitCard.test.tsx` (extend)

**Dependencies:** Story 15.1 (CoachMarkOverlay + useCoachMark).

---

### Story 15.5 — A1: Visualizer paper-cream background + Aureola tune

**Coste:** small · **Tasks:** 3

**Scope:**
- En `OutfitVisualizer.tsx` línea ~309, cambiar `backgroundColor: wadaTokens.warmBg` → `wadaTokens.bgPaper`.
- En `Aureola.tsx`: revisar gradient opacity y colors. Con fondo claro, el glow puede perder presencia. Ajustar para que siga creando sensación de "halo" detrás de las siluetas pero sin chocar con el contraste de las siluetas tintadas.
- Validar visualmente en simulador con varios combos (colores Wada claros + oscuros) que las siluetas siguen legibles y la composición se siente coherente con el resto de la app.

**Tareas:** (1) cambio token + Aureola tune; (2) visual smoke en simulador con 3+ combos representativos; (3) AC verification.

**Files to touch:**
- MOD: `src/screens/OutfitVisualizer.tsx`
- MOD: `src/components/Aureola.tsx`

**Dependencies:** none.

**Riesgo:** subjetivo. Requiere visual review de Alejandro tras cambio. Si Aureola queda mal, posible iteración.

---

### Story 15.6 — D1+D2: Copy changes ES+EN

**Coste:** trivial · **Tasks:** 2

**Scope:**
- `src/i18n/locales/es.json`: `home.subtitle` → `"¿Qué color de ropa quieres combinar?"`; `favorites.newLookCta.title` → `"Monta tu look"`.
- `src/i18n/locales/en.json`: `home.subtitle` → `"What color would you like to combine?"`; `favorites.newLookCta.title` → `"Build your look"` (validar con Alejandro la EN exacta).
- Tests: actualizar cualquier assertion literal en `*.test.tsx` que matchee los strings antiguos (audit reportó usos únicos en `ColorHome.tsx:297` y `NewLookCtaCard.tsx`).

**Tareas:** (1) edit 4 strings (2 keys × 2 locales) + actualizar tests; (2) AC verification.

**Files to touch:**
- MOD: `src/i18n/locales/es.json`, `src/i18n/locales/en.json`
- Tests: posiblemente `ColorHome.test.tsx` o similar si hay literal-string matches

**Dependencies:** none. Puede correr en paralelo con cualquier story.

---

## Story summary table

| Story | Tipo | Coste | Tasks | Deps | Order |
|-------|------|-------|-------|------|-------|
| 15.1 | Foundation | small | 4 | none | 1 |
| 15.6 | Copy | trivial | 2 | none | 2 (paralelo) |
| 15.3 | Onboarding C1 | small | 4 | 15.1 | 3 |
| 15.4 | Onboarding A2 + pulse | small | 4 | 15.1 | 4 |
| 15.5 | Visualizer style A1 | small | 3 | none | 5 |
| 15.2 | Armario gap B1 | medium | 5 | none | 6 |

**Total estimado:** 5–7 días dev + code review + on-device QA.

## Outcome A — Launch v1.4.0

Para considerar Epic 15 done y disparar `release-manager`:

1. ✅ Stories 15.1–15.6 todas en `done` (incluye code review pasada por cada una).
2. ✅ On-device QA en iPhone 16 Pro: validar los 6 flujos (coach marks first-use C1+A2, dismiss persistente, B1 categoría obligatoria foto+biblioteca, A1 visual coherente, D1+D2 strings nuevos visibles, regresión zero en flujo principal cámara FAB).
3. ✅ Test suite verde (`pnpm test`, `npx tsc --noEmit`, `pnpm lint`).
4. ✅ Marketing screenshots regenerados (track paralelo, no bloquea desarrollo pero sí submit).
5. → `release-manager` → bump versión → EAS build → App Store submit.

## Out of scope (post-launch / Tier 3)

- E1 Ver catálogo polish visual (baja prioridad, v1.4.1+).
- F1 Marketing/ASO (track paralelo, no es story de epic).
- Cualquier feature de v2 strategy (Paleta Objetivo, Botón Mágico, Cápsula, Colorimetría) — esos van en Epic 16+ post-launch.

## References

- Source ideas: `docs/planning/epic-15-ideas-pre-launch.md`
- Audit del 2026-04-26: transcript de la sesión PM (Explore agent) — paths absolutos de archivos a tocar incluidos en las secciones de cada story.
- Epic 14 spec: `docs/planning/epic-14/epic-14.md`
- Convención branching: `epic-15` off `epic-14` HEAD post-merge 14.13.
