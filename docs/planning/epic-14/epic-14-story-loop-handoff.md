# Epic 14 — Story Loop Handoff

**Purpose:** operate Epic 14 as a three-phase loop (create-story → dev-story → code-review), one story at a time, each phase in its own Claude Code window. This doc is the single source of truth for how to brief each window.

**Active branch:** `epic-14` (already checked out locally).
**Merge target (main):** `epic-1`.
**Scope doc (product):** `docs/planning/epic-14/epic-14-scope.md`.
**Epic doc (stories + TDs):** `docs/planning/epic-14/epic-14.md`.
**UX spec:** `docs/planning/ux-design-epic-14.md`.
**Tech review:** `docs/planning/epic-14/epic-14-tech-review.md`.
**ADR:** `docs/adrs/ADR-005-unified-mis-looks-store.md`.
**Pencil:** `designs/Epic14.pen`.

---

## Story execution order (recommended)

Follow this sequence strictly. Each story must be **merged to `epic-14`** before starting the next one that depends on it. Stories marked `[parallel]` can be developed in parallel with the preceding one if you have bandwidth.

| # | Story | Depends on | UX blocked? | Notes |
|---|-------|------------|-------------|-------|
| 1 | **14.1** | — | No | Foundational schema. Start here. |
| 2 | **14.2** | 14.1 | No | Critical — store unification (ADR-005) + migration. Must merge before 14.7/14.8/14.9. |
| 3 | **14.3a** | — | No | Can run in parallel with 14.2 if separate dev. Navigation refactor — mechanical. |
| 4 | **14.3b** | 14.3a | No | Swift module change (TD-1). Requires full Expo rebuild. |
| 5 | **14.7** | 14.2 | No (UX-DR4 preferred but not blocking) | Tab rename. Can use `archivebox` as placeholder icon. |
| 6 | **14.4** | 14.3b | Yes (UX-DR1) | Camera result screen UI. |
| 7 | **14.5** | 14.1, 14.4 | Yes (UX-DR1) | Save flow + category sheet + paywall. Exports `CategoryPickerSheet` for reuse. |
| 8 | **14.6** | — | Yes (UX-DR6) | Visualizer CTA. Independent. |
| 9 | **14.8** | 14.2 | No | Auto-save + paywall limbo (TD-3, TD-4). |
| 10 | **14.9** | 14.2, 14.8 | Yes (UX-DR2) | Guardar para luego + paywall limbo mirror. |
| 11 | **14.10** | — | Yes (UX-DR4) | + Nuevo look. |
| 12 | **14.11** | 14.8, 14.9 | Yes (UX-DR5) | Incomplete-looks retention surface. |
| 13 | **14.12a** | — | Yes (UX-DR3) | Delete edit mode. |
| 14 | **14.12b** | 14.5, 14.12a | Yes (UX-DR3) | Edit category (TD-6). |
| 15 | **14.13** | all prior | No | On-device QA. Final before merge to `epic-1`. |

**Parallel-work heuristic:** while one story is in dev (Window 2), you can use Window 1 to prepare the next story spec. Window 3 (review) is the blocker — a story cannot proceed to the next one in the chain until review passes.

---

## Branching convention (per `CLAUDE.md` + project history)

- **Story branches:** flat naming, off `epic-14`. Pattern: `story-14.X-short-description`.
  - Examples: `story-14.1-wardrobe-schema-category`, `story-14.3a-unified-camera-nav-setup`, `story-14.12b-edit-category-pencil`.
- **Commit pattern:** `feat: <description> (Story 14.X)` · `fix: code review — <details> (Story 14.X)`.
- **Merge:** story branch → `epic-14` via PR (or fast-forward if solo dev). Never merge directly to `epic-1` until Story 14.13 QA passes.

---

## Window 1 — CREATE STORY (briefing template)

Copy-paste into a **fresh Claude Code window** when you want to create the detailed story spec for story `14.X`.

Replace `{{STORY_NUMBER}}` with the story identifier (e.g., `14.1`, `14.3a`, `14.12b`).

```
Invoca a Bob (bmad-agent-sm) para producir el story spec detallado de la Story {{STORY_NUMBER}} de Epic 14 de Outfinder.

## Contexto mínimo obligatorio — Bob debe leer estos docs COMPLETOS antes de producir la story

1. `/Users/alejandrocamps/outfinder/docs/planning/epic-14/epic-14.md` — Epic doc con las 15 stories + frontmatter con referencias + **sección "⚠️ Technical Decisions"** al inicio (TD-1 a TD-7). La story {{STORY_NUMBER}} tiene su entry aquí con User Story, AC Given/When/Then, Tasks (≤5), Dependencies, Technical notes. **Este es el input primario para Bob.**

2. `/Users/alejandrocamps/outfinder/docs/planning/epic-14/epic-14-tech-review.md` — reporte técnico de Winston con los 5 HIGH findings y las 7 Technical Decisions detalladas. Leer al menos las secciones de los TDs que la story {{STORY_NUMBER}} implementa (listados en su bloque "Technical notes").

3. `/Users/alejandrocamps/outfinder/docs/planning/ux-design-epic-14.md` — UX spec de Sally. Si la story {{STORY_NUMBER}} tiene anotación `[UX]` con UX-DR bloqueante, Bob debe leer la sección correspondiente (UX-DR1/2/3/4/5/6).

4. `/Users/alejandrocamps/outfinder/docs/adrs/ADR-005-unified-mis-looks-store.md` — solo si la story implementa TD-3 (stories 14.2, 14.8, 14.9, 14.12b).

5. `/Users/alejandrocamps/outfinder/docs/project-context.md` — tech stack + patterns + known debt.

6. `/Users/alejandrocamps/outfinder/CLAUDE.md` — project rules.

7. **Código referenciado por la story** — Bob debe inspeccionar los ficheros fuente que la story toca antes de producir el spec (ej. `src/lib/wardrobeTypes.ts`, `src/stores/wardrobeStore.ts`, etc.).

## Memoria del proyecto relevante

- `project_v140_epic13_start.md`, `project_epic13_decisions.md` — decisiones Epic 13.
- `feedback_native_module_rebuild.md` — si la story toca Swift.
- `feedback_jest_native_module_mock.md` — si la story toca mocks de módulos nativos.
- `feedback_image_colors_library.md` — si la story toca detección de color.
- `feedback_always_validate.md` — ejecutar checklist validation en create-story.
- `feedback_agent_context.md` — rich context es obligatorio en Dev Notes.

## Qué necesito que Bob produzca

Un story spec completo en `/Users/alejandrocamps/outfinder/_bmad-output/implementation-artifacts/{{STORY_NUMBER}}-*.md` que:

1. Hereda TODAS las AC Given/When/Then de `epic-14.md` para esta story (copiar literalmente, no resumir).
2. Hereda las Tasks del epic doc (≤5 tasks, regla inquebrantable del proyecto).
3. Lista las **Technical Decisions aplicables** (copiar el texto literal del TD relevante — TD-1 a TD-7 — en el Dev Notes del spec, para que el agente de dev en la siguiente ventana NO tenga que subir a leer el epic doc).
4. Incluye **Dev Notes ricas** con referencias a ficheros fuente que hay que tocar (ej. `src/lib/wardrobeTypes.ts:L5-L20`), patterns a seguir, y riesgos conocidos.
5. Enumera los archivos previstos a crear / modificar / eliminar.
6. Incluye un **checklist de validation** al final (lo que dev+review tendrán que verificar).
7. Marca UX-DR bloqueantes si aplica + el pencil artifact relevante.
8. Frontmatter YAML con: `storyId`, `epic: 14`, `dependsOn: [story ids]`, `unblocks: [story ids]`, `tdsImplemented: [TD-N list]`, `status: ready-for-dev`.

## Reglas del proyecto que Bob DEBE honrar

- Max 4-5 tasks por story (no negociable — 5 retros previos confirmaron esto).
- Tests co-located (`Component.test.tsx` junto a `Component.tsx`).
- Function declarations + named exports (nunca `export default`).
- NativeWind className para estático, `style={{}}` solo para colores Wada dinámicos.
- Haptics solo vía `lib/haptics.ts`.
- Props interface obligatorio.
- Accessibility first (testID, accessibilityLabel, accessibilityRole, 44pt touch, VoiceOver, Reduce Motion).
- Hooks antes de early returns.

## Output esperado

Un fichero story spec listo para que el siguiente agente (en otra ventana) lo tome y haga dev directamente sin tener que re-leer el epic doc. El spec debe ser auto-contenido en términos de lo que hay que hacer.

## Idioma

Castellano conmigo; documento mixed (headers ES, AC/specs EN como el resto del proyecto).

## Arranca por

1. Bob confirma que ha leído los docs canónicos.
2. Lee la entry de story {{STORY_NUMBER}} en `epic-14.md` + los TDs que implementa.
3. Si hay ambigüedades técnicas o de producto, pregúntame antes de producir el spec.
4. Cuando esté confiado, produce el spec directamente.
```

---

## Window 2 — DEV STORY (briefing template)

Copy-paste into a **fresh Claude Code window** when you want to implement the story `14.X`.

Replace `{{STORY_NUMBER}}` with the story identifier.
Replace `{{STORY_SPEC_PATH}}` with the actual path (printed by Window 1 at the end of create-story).

```
Invoca a Amelia (bmad-agent-dev) para implementar la Story {{STORY_NUMBER}} de Epic 14 de Outfinder siguiendo el spec ya producido.

## Spec que Amelia debe seguir

`{{STORY_SPEC_PATH}}`

Amelia debe leer este spec COMPLETO antes de tocar nada. El spec es auto-contenido: contiene las AC, Tasks, Technical Decisions aplicables, Dev Notes con referencias a ficheros, y el checklist de validation.

## Contexto adicional (Amelia consulta si necesita)

- `/Users/alejandrocamps/outfinder/docs/planning/epic-14/epic-14.md` — Epic doc completo si el spec referencia algo y necesita más contexto.
- `/Users/alejandrocamps/outfinder/docs/adrs/ADR-005-unified-mis-looks-store.md` — si la story implementa TD-3.
- `/Users/alejandrocamps/outfinder/docs/project-context.md` — tech stack + patterns.
- `/Users/alejandrocamps/outfinder/CLAUDE.md` — project rules.

## Memoria del proyecto relevante

Los mismos feedback items listados en la plantilla de Window 1. Amelia consulta si tropieza con un tema que el spec no cubre.

## Protocolo de ejecución

1. Amelia crea branch `story-{{STORY_NUMBER}}-short-description` desde `epic-14`.
2. Implementa cada Task del spec en orden. NO combina tareas. NO añade tareas no listadas.
3. Por cada task: implementa → co-locate tests → corre tests de la task → verifica accessibility cuando aplique.
4. Al terminar todas las tasks: `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — los tres en verde sin skips ni warnings nuevos.
5. Commit pattern: `feat: <description> (Story {{STORY_NUMBER}})`.
6. NO hace push ni merge — eso es job del review (Window 3).
7. Marca el story spec con `status: ready-for-review` en el frontmatter.
8. Reporta a Alejandro: branch name, commits hechos, archivos tocados, tests añadidos, cualquier decisión técnica que el spec no cubrió explícitamente.

## Reglas del proyecto (no negociables)

- Tests co-located. Props interface obligatorio. Function declarations + named exports.
- NativeWind className, style={{}} solo para Wada dinámicos.
- Haptics solo vía `lib/haptics.ts`.
- Accessibility first.
- Hooks antes de early returns.
- **NO skippea tests ni los marca como `.skip`** — si un test falla, investiga la causa y arréglala.

## Si Amelia encuentra un spec gap

NO inventa. Para la sesión, me pregunta, y actualizamos el spec o el epic doc antes de continuar. La trazabilidad es crítica — cada cambio debe poder defenderse contra TDs y AC.

## Idioma

Castellano conmigo; commits en inglés (project convention).
```

---

## Window 3 — CODE REVIEW (briefing template)

Copy-paste into a **fresh Claude Code window** when Amelia ha terminado dev y quieres review adversarial.

Replace `{{STORY_NUMBER}}` with the story identifier.
Replace `{{BRANCH_NAME}}` with the actual branch name.
Replace `{{STORY_SPEC_PATH}}` with the story spec path.

```
Ejecuta `bmad-code-review` sobre la Story {{STORY_NUMBER}} de Epic 14 de Outfinder.

## Artefactos a revisar

- **Branch:** `{{BRANCH_NAME}}` (diff vs. `epic-14`).
- **Story spec:** `{{STORY_SPEC_PATH}}` — leer completo antes de revisar código. La review se basa en verificar que el código cumple la AC, las Tasks, las Technical Decisions, y los project rules.
- **Epic doc:** `/Users/alejandrocamps/outfinder/docs/planning/epic-14/epic-14.md` — especialmente la sección "⚠️ Technical Decisions" y la entry de la story {{STORY_NUMBER}}.

## Layers de review (paralelos — `bmad-code-review` las orquesta)

1. **Blind Hunter** — búsqueda adversarial de bugs sin contexto del spec (para detectar defectos que el spec no previó).
2. **Edge Case Hunter** — cobertura de branching paths + boundary conditions + error states.
3. **Acceptance Auditor** — AC por AC del story spec, verifica que el código la satisface. Incluye verificación explícita de cada TD aplicable.

## Checklist mandatorio post-review

- [ ] `npx tsc --noEmit` pasa green.
- [ ] `pnpm lint` pasa green.
- [ ] `pnpm test` pasa green (cero skips nuevos).
- [ ] Todos los AC del spec cumplidos con evidencia en tests (cada AC con un test que la valide, como dice la regla del proyecto).
- [ ] TDs aplicables verificados en el código (no basta con que el spec lo mencione — el código tiene que reflejarlo).
- [ ] Accessibility audit mental: testID, accessibilityLabel, accessibilityRole, 44pt touch, Reduce Motion.
- [ ] No regresiones visibles en stories previas.
- [ ] Commit messages siguen el patrón del proyecto.
- [ ] Tests co-located, naming correcto.
- [ ] NO hay `// TODO`, `// HACK`, `// XXX` sin ticket linkeado.
- [ ] NO hay `console.log`, `debugger` residual.

## Triage output

Review produce categorías:
- **Must-fix (blocker):** bug, AC no cumplida, TD violada, test failure, lint error. Devuelve a Amelia (Window 2) para fix.
- **Should-fix:** mejora de calidad, hubiera sido mejor con X. Puede arreglarse en este ciclo o deferrir con ticket.
- **Nit:** estilo/taste. Opcional.

## Proceso si hay Must-fix

1. Reporte genera notas específicas.
2. Alejandro pasa las notas a una ventana de dev (Window 2 del mismo story o nueva).
3. Amelia aplica fixes, commits con `fix: code review — <details> (Story {{STORY_NUMBER}})`.
4. Vuelve a Window 3 para re-review (iterar hasta green).

## Proceso si review pasa limpia

1. Marca el story spec con `status: done` en frontmatter.
2. Merge branch → `epic-14` (fast-forward or PR — tu decides).
3. Actualiza el epic doc: añade checkmark en la story en la lista de execution order.
4. Arranca el siguiente story en el loop.

## Idioma

Castellano conmigo; review report puede ser mixed (findings en inglés para trazabilidad con código, narrativa explicativa en castellano).
```

---

## Tips operativos

- **Ventana 1 es barata**: crear specs es rápido y no bloquea. Puedes pre-cargar 2-3 stories si tienes momentum.
- **Ventana 2 es donde se quema tiempo**: una story típica lleva 1-3 horas de dev. Dedica una ventana por story sin multitasking.
- **Ventana 3 debe ser rigurosa**: no aceptes review blanda "todo OK". Un review que no pilla un bug luego cuesta 10x en QA o producción.
- **Si tropiezas con UX-DR sin pencil hecho**: para ese story y abre Pencil con Sally en paralelo (hay handoff en `epic-14-pencil-handoff.md`).
- **Si tropiezas con spec gap**: NO invente la dev. Párate, actualiza el epic doc o el story spec, sigue. La trazabilidad gana siempre.

---

## Checkpoint de salud del epic

Después de merge de 14.2 (foundational store unification), sugiero un **mini-checkpoint**:
- Verifica que la migración funciona con un test manual de upgrade (dev-menu "Re-run migration" + carga de una DB simulada v1.3.0).
- Si la foundational falla, para el loop — todas las stories posteriores dependen de 14.2.

Después de merge de 14.3b (pipeline unificado con Swift module change), sugiero otro checkpoint:
- On-device smoke test del cutout + dominantHex en iPhone real con varias prendas.
- Si dominantHex falla en algún caso de los Pencil TODOs (pale, dark, transparent-heavy), vuelves a Window 2 con un fix focused.

El resto son stories menos cargadas de riesgo.

---

*Fin del handoff. Con esto tienes todo lo que necesitas para ejecutar Epic 14 en modo loop de ventanas. Nos vemos al otro lado. — Winston.*
