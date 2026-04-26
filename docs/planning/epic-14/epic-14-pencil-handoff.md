# Epic 14 — Pencil Handoff Briefing

**Propósito:** briefing que Alejandro copia-pega al abrir una ventana NUEVA de Claude Code para retomar el trabajo de UX de Epic 14 con Sally en modo Pencil (mockups pixel-perfect).

**Contexto de la sesión previa:** Alejandro + John (PM) + Sally (UX) cerraron el scope de Epic 14 el 2026-04-21. Docs canónicos en el repo. Sally tiene que ahora bajar a pixel con Pencil MCP.

---

## Copia-pega este prompt en la ventana nueva

```
Necesito que actives a Sally (bmad-agent-ux-designer) para continuar el trabajo de UX de Epic 14 de Outfinder — ahora en modo Pencil, para producir mockups pixel-perfect de las superficies críticas.

## Contexto — Sally NO puede empezar a diseñar sin leer esto primero

Todo el trabajo previo está documentado. Sally debe leer los 3 docs en orden:

1. `/Users/alejandrocamps/outfinder/docs/planning/ux-design-epic-14.md` — el UX spec completo que Sally misma produjo en la sesión anterior. Contiene las 6 UX-DRs con layouts ASCII, jerarquías, estados, accessibility, y 10 Pencil TODOs consolidados al final del doc.

2. `/Users/alejandrocamps/outfinder/docs/planning/epic-14/epic-14-scope.md` — el alcance de producto aprobado (decisiones cerradas: dos cámaras→una, guardado explícito con 4 categorías, Visualizer puente no destino, Mis Looks workspace, tope 5 favoritos, delete con long-press + (−) limpio sin wiggle, etc.). NO re-abrir estas decisiones.

3. `/Users/alejandrocamps/outfinder/docs/planning/epic-14/epic-14.md` — Epic doc con 13 stories y sus AC. Referencia para saber qué stories desbloquea cada mockup.

Opcional pero útil:
- `/Users/alejandrocamps/outfinder/docs/planning/ux-design-specification-ios.md` — sistema visual histórico (paper cream, Noto Serif JP, elevated simplicity, Color-first chrome-last, warm palette). Todos los mockups de Epic 14 deben ser coherentes con este sistema.
- Memoria `project_v140_epic13_start.md` y `project_s3_picker_ux_debt.md`.

## Qué necesito que Sally produzca en esta sesión

Mockups pixel-perfect en Pencil (.pen files vía el MCP pencil) de las **3 surfaces críticas** — priorizadas en este orden:

1. **UX-DR1 — Camera Result Screen** (pantalla 2 del flujo cámara unificada + la sheet modal de categoría + la pantalla post-save "¿ahora qué?"). Esta es la más importante visualmente porque es el nuevo momento mágico y tiene densidad compleja.

2. **UX-DR6 — Visualizer Primary CTA** ("Hacer este look mío" full-width anchored bottom con fondo Wada-tinted). Segunda en prioridad porque es una regresión visual del Visualizer actual y tiene que quedar cinematográfica.

3. **UX-DR4 — Mis Looks tab + tarjeta "+ Nuevo look"** (tarjeta narrativa arriba del grid + test visual de iconos Tab Bar: archivebox vs hanger vs sparkles vs tshirt-stacked).

Las otras 3 UX-DRs (2, 3, 5) pueden Pencilarse en una sesión posterior — el spec de texto actual es suficiente para iniciar dev de emergencia.

## Los 10 Pencil TODOs concretos que debo resolver

Los tienes detallados al final de `docs/planning/ux-design-epic-14.md`. Resumo los más críticos:

- **Cutout height sweet spot** en Result screen (180 / 220 / 260 pt) — afecta el peso emocional del momento.
- **Tint intensity en CTAs Wada-coloreadas** — riesgo real cuando el color detectado es pálido (Crema, Pergamino): la CTA se vuelve ilegible. Hay que establecer una regla.
- **Icono Mis Looks Tab Bar**: archivebox vs hanger vs sparkles vs tshirt-stacked. Comparar los 4 con los tokens reales de la app.
- **Iconos del sheet de categoría** (Parte de arriba / abajo / Calzado / Accesorio): SF Symbols vs custom line-art vs emoji.
- **Treatment visual de la narrative card** "+ Nuevo look": flat (hairline border) vs elevated (shadow) vs tinted (slight Wada accent).

## Cómo empezar en esta sesión

Sally debería:

1. Saludarme como siempre (empática, visual-first, storytelling Sally).
2. Confirmar que ha leído los 3 docs canónicos.
3. Usar el MCP pencil para:
   - `mcp__pencil__get_editor_state` para ver si hay .pen activo.
   - Si no hay ninguno: crear un nuevo .pen con `mcp__pencil__open_document('new')` o abrir uno existente del proyecto si prefiero yo.
4. Preguntarme si prefiero:
   - Empezar por UX-DR1 Result screen (recomendación de Sally) y hacer iteración rápida de variantes de cutout height + tint intensity.
   - Empezar por UX-DR4 Tab Bar icons porque tengo estándares del sistema visual que quiero ver alineados primero.
   - Abrir las 3 críticas en paralelo y ir navegando.
5. Trabajar en pases iterativos: Sally propone una variante → yo reviewo en screenshot → iteramos.

## Restricciones / reglas

- **Castellano** en conversación. Documentos técnicos (si los hay) pueden mantenerse en inglés.
- **Sally persona** todo el rato — no romper personaje.
- **NO re-abrir decisiones de producto** ya cerradas. Sally opera solo en el "cómo" visual.
- **Respeta los tokens existentes** del sistema (`src/styles/theme.ts`, `tailwind.config.js`). No introducir tokens nuevos salvo que sea crítico y justificado.
- **Accessibility first**: cada mockup debe poder defender VoiceOver traversal + touch targets ≥ 44pt.
- **Craft-driven, no data-driven**: no proponer tests A/B ni analytics hooks.

## Siguiente paso natural después de Pencil

Cuando tengamos los mockups aprobados, volvemos al flujo BMad y corremos `bmad-sprint-planning` sobre `docs/planning/epic-14/epic-14.md` para producir el plan de ejecución de las 13 stories. Las stories UX-dependientes (14.4, 14.5, 14.6, 14.9, 14.10, 14.11, 14.12) quedan plenamente desbloqueadas tras los mockups. Las UX-independientes (14.1, 14.2, 14.3, 14.7) pueden incluso empezar dev en paralelo a esta sesión de Pencil.

Pon a Sally en contexto y arranquemos.
```

---

## Notas adicionales para Alejandro

**Sobre el MCP pencil:**
- Ya está configurado en este proyecto — Sally lo usará automáticamente.
- Si hay un `.pen` file del proyecto que quieras retomar (por ejemplo `designs/pencil-new.pen`), díselo explícitamente a Sally al principio de la sesión. Si no, ella creará uno nuevo para Epic 14.

**Sobre el contexto entre ventanas:**
- La ventana nueva NO hereda nada de esta conversación. El prompt de arriba le da todo lo necesario porque los docs del repo son el source of truth persistente.
- Si durante la sesión Pencil tomáis decisiones nuevas, pídele a Sally que las persista en `docs/planning/ux-design-epic-14.md` actualizando el doc (ella tiene permiso para editarlo).

**Sobre throughput paralelo:**
- Mientras Sally diseña en Pencil, puedes abrir una **tercera ventana** para arrancar `bmad-sprint-planning` o directamente `bmad-create-story 14.1` sobre las stories UX-independientes. Son flujos ortogonales — cero conflicto.

**Sobre duración de sesión:**
- Las 3 surfaces críticas probablemente llevan 2-3 pases de iteración cada una. Plan razonable: una sesión Pencil de ~90 min cubre UX-DR1 + UX-DR6, deja UX-DR4 para sesión siguiente. Ajusta según tu ritmo.

**Si quieres recuperar el hilo emocional de la visión:**
El *storytelling* de Marta (sábado tarde + domingo mañana) está al inicio de `ux-design-epic-14.md`. Pídeselo a Sally si quiere re-anclar el arco antes de pasar a mockups — ayuda mucho para no perder el sentido detrás de cada decisión visual.

---

*Fin del handoff briefing. Nos vemos en la otra ventana, Alejandro.*
