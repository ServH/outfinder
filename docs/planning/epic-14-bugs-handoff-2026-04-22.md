# Epic 14 post-release bugs — Handoff 2026-04-22

**Sesión:** parada en caliente porque Alejandro saturado. Retomar mañana con contexto completo desde aquí.

**Rama activa:** `story/14-13-epic14-ondevice-qa-happy-paths` (off `epic-14` HEAD `21534e0`).

**Último commit:** `068877b` — fix BUG-001.

---

## 1. Estado de la cola

| ID | Sev | Estado | Commit | Validación on-device |
|---|---|---|---|---|
| BUG-001 | high | ✅ fixed | `068877b` | pendiente (Metro reload — §D del plan de pruebas) |
| BUG-002 | polish | ✅ fixed | `90496df` | pendiente (§A) |
| BUG-003 | polish | ✅ fixed | `90496df` | pendiente (§B) |
| BUG-004 | medium | ✅ fixed | `2a5f590` | pendiente (§C) |
| BUG-005 | medium | 🟡 pending — probable follow-up (scope) | — | — |
| BUG-006 | medium | 🟡 triaged → follow-up v1.4.1 | — | se sigue viendo el flash; esperado por ahora |
| BUG-007 | polish | ✅ fixed | `90496df` | pendiente (§B) |
| BUG-008 | medium | 🔴 NEW (añadido en esta sesión) | — | — |
| BUG-009 | high | 🔴 NEW (lógica de producto) | — | — |
| BUG-010 | high | 🔴 NEW (lógica de producto) | — | — |

**CI en HEAD `068877b`:** tsc clean · lint 2 pre-existentes (FavoritesList.test.tsx + OutfitVisualizer.tsx — heredados pre-sesión) · pnpm test **942 passing / 3 pre-existing / 945 total** (baseline 14.12b done exacta).

---

## 2. Resumen de la sesión

**Fixed (5 bugs en 3 commits):**
- `90496df` — BUG-002 (contador "X combos" en headers ColorHome + Combinations) · BUG-003 (badge "X/N" en header Ficha Wada S2) · BUG-007 (colateral de BUG-003: label "No garments yet" en S2).
- `2a5f590` — BUG-004 (CTA duplicado dentro de la SuggestionCard en S5 Sugerencia Armonía).
- `068877b` — BUG-001 (navegación apilada post-guardar desde cámara: fix `navigate + goBack` para cerrar el modal `UnifiedCameraRoot` tras el cross-nav; aplicado en PostSave CTAs + Result secondary link).

**Diferido con rationale técnico (1 bug):**
- BUG-006 — flash de Mis Looks antes del picker en Visualizer. Diagnóstico: compound fade `TabNavigator` (300ms) + `FavoritesStack` (300ms), NO es el mismo root cause que BUG-001. Cualquier fix limpio excede los 30min de `fix-in-14.13` y pide UX-DR de la transición deseada. Candidato a story dedicada en Epic 14 polish o v1.4.1.

**Nuevos bugs capturados en la sesión (sin tocar):**
- BUG-005 (layout Mis Looks En curso / filtros) — pre-existente en el log, no trabajado.
- BUG-008, BUG-009, BUG-010 — añadidos por Alejandro mientras yo arreglaba la primera tanda.

---

## 3. Triage de los 4 bugs pendientes (sin implementación)

### BUG-005 — Mis Looks layout "En curso" vs filtros
**Severidad:** medium · **Scope estimado:** >30min → **follow-up probable**.

Toca:
- `src/screens/FavoritesList.tsx` — restructurar `listHeaderComponent` para introducir barra sticky de filtros + header "Todos tus looks".
- `src/components/armario/IncompleteLooksSection.tsx` — añadir contador al mini-header ("En curso · N").
- Posible lógica de scroll sticky (prop `stickyHeaderIndices` en FlatList).
- i18n keys nuevas para los dos mini-headers.
- Tests de integración en FavoritesList.test.tsx.

**Decisión recomendada mañana:** abrir follow-up story — NO `fix-in-14.13`. Implica UX-DR leve (¿sticky con qué bg? ¿hairline o elevation?). Bloquea BUG-006 juntos en el mismo sprint de polish.

### BUG-008 — Falta feedback visual tras "Usar esta foto" (~1s)
**Severidad:** medium · **Scope estimado:** 15-30min (mínimo viable) → **candidato `fix-in-14.13`** si Alejandro elige la opción A.

Archivo probable: `src/screens/armario/ArmarioPreviewScreen.tsx` (flow Ficha Wada → nueva foto → preview → "Usar esta foto") y/o `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` (si el gap también está en el flow post-cámara-FAB — las notas de Alejandro piden revisar paridad).

Opciones por coste:
- **A · Loading state en el botón** (spinner + disabled durante el procesamiento) → ~15min. Mínimo viable. Recomendada.
- **B · Overlay con copy "Procesando…"** → ~25min + i18n keys. Más rica.
- **C · Skeleton loader en la siguiente pantalla** → >30min, invasivo. Follow-up.

**Decisión a tomar mañana:** Alejandro elige A/B/C.

### BUG-009 — Prenda fotografiada no auto-rellena slot del combo (high)
**Severidad:** high · **Scope estimado:** >30min → **follow-up seguro** (lógica de producto, no polish).

Requisitos confirmados en el bug:
- Matching por **color Wada exacto** + **tipo de prenda compatible**.
- Si hay varias prendas matcheando, priorizar la recién creada en este flow.
- Edge: combo con 2 slots del mismo color Wada → auto-rellenar uno solo.
- Edge: tipo detectado vs tipo del slot divergente → NO auto-rellenar.

Toca:
- `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx` o entry point equivalente → necesita pasar el `wardrobeItemId` recién creado como route param adicional a Combinations → Visualizer → ArmarioFichaWada.
- `src/screens/armario/ArmarioFichaWadaScreen.tsx` — al mount, si detecta un "prendaJustCreated" compatible con algún slot del combo, auto-llamar a la misma función `assign()` que el usuario dispararía manualmente.
- `src/stores/misLooksStore.ts` — posiblemente nada si `assign()` ya existe.
- Tests de integración end-to-end de este flow.

**Decisión a tomar mañana:** confirmar criterios de matching antes de especar — especialmente el caso tipo-divergente (NO auto-rellenar) y priorización recién-creada.

### BUG-010 — Visualizer asigna prenda al slot equivocado por posición (high)
**Severidad:** high · **Scope estimado:** variable según solución elegida → **probablemente follow-up** pero con una opción rápida.

Root cause identificado en las notas: el Visualizer deriva el garment type del **índice posicional del color en el combo** (slot 0=top, slot 1=bottom, slot 2=shoes) en vez de respetar el tipo declarado por el usuario al guardar la prenda.

**Relación con BUG-009:** son las dos caras de la misma moneda (009 = "no rellena", 010 = "rellena mal"). **Fuerte candidato a especarlos juntos.**

Opciones:
- **A · Quick fix:** cuando el combo se instancia "desde una prenda real" (query string con wardrobeItemId), reordenar los colores del combo para que el color del wardrobe-item ocupe el slot correspondiente a su `category`. Los otros colores se muestran sin tipo forzado. Posiblemente 30-60min si el Visualizer acepta un "anchor" como route param.
- **B · Refactor:** el Visualizer deja de derivar tipo desde posición; siempre usa el `category` de la prenda asignada (o placeholder agnóstico cuando no hay). Cambio más profundo pero más correcto conceptualmente. >2h.

**Decisión a tomar mañana:** A o B. Mi recomendación: spec conjunta con BUG-009 como una story dedicada — ambos afectan al mismo hand-off cámara → combo → Visualizer.

---

## 4. Plan propuesto para mañana

**Prioridad 1 — validar lo ya arreglado (Metro reload, ~15min):**
1. `pnpm start --clear` → abrir simulador o device conectado.
2. Ejecutar §A–§D del plan de pruebas que ya tienes (contador combos, contador X/N + "Sin prendas", CTA duplicado, nav apilada).
3. Si algo no funciona como esperado, anotar en BUG-00X nuevo y triage.

**Prioridad 2 — decisiones de producto (~10min, solo conversación):**
1. ¿BUG-008 opción A, B o C?
2. ¿BUG-009 + BUG-010 se especan juntos como una story? ¿A o B para 010?
3. ¿BUG-005 + BUG-006 se bundlean en un mini-sprint de "layout polish v1.4.1"?

**Prioridad 3 — ejecutar según decisiones:**
- Si BUG-008 sale como `fix-in-14.13` (opción A): lo aplico en 15-30min, commit, baseline nuevo.
- Si BUG-009/010 sale como follow-up story: abro spec con `feature-spec` (no código hoy).
- Si BUG-005/006 sale como follow-up: mismo patrón.

**Prioridad 4 — cierre de Story 14.13:**
- Si los 3 bugs restantes (005, 009, 010) quedan todos como follow-ups, la Story 14.13 puede pasar a sign-off Outcome A con la lista de follow-ups documentada en §7 del checklist (`docs/planning/epic-14-qa-checklist.md`).
- BUG-008 decide si se incluye en este branch o se posterga.

---

## 5. Archivos modificados en la sesión

**Committed:**
- `src/screens/Combinations.tsx` + `.test.tsx` — BUG-002
- `src/screens/ColorHome.tsx` + `.test.tsx` — BUG-002
- `src/screens/armario/ArmarioFichaWadaScreen.tsx` + `.test.tsx` — BUG-003 + BUG-007
- `src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx` — BUG-004
- `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx` + `.test.tsx` — BUG-001
- `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` + `.test.tsx` — BUG-001
- `docs/planning/epic-14-post-release-bugs.md` — status flips + soluciones documentadas + nuevos bugs 008/009/010
- `docs/planning/epic-14-qa-checklist.md` — artefacto de Story 14.13 (checklist-production phase)
- `docs/img_screenshot/qa-14.13/README.md` — evidence folder contract
- `_bmad-output/implementation-artifacts/14-13-epic14-ondevice-qa-happy-paths.md` — story file
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story status flip `ready-for-dev → in-progress`

**En staging sin commit (pending en esta última commit):**
- `docs/planning/epic-14-post-release-bugs.md` — los nuevos BUG-008/009/010 que añadiste + mi actualización de la tabla de triage.

---

## 6. Comandos rápidos mañana

```bash
# 1. Posicionarse en la rama correcta
git checkout story/14-13-epic14-ondevice-qa-happy-paths
git log --oneline -5  # verificar HEAD = commit de este handoff

# 2. Arrancar Metro con cache limpio
pnpm start --clear

# 3. Ya con Metro corriendo, abrir simulator
# (i para iOS simulator, luego Cmd+R para reload si hace falta)

# 4. Cuando quieras retomar trabajo de código con Claude:
# basta invocar de nuevo — este handoff + el bug log + el checklist de 14.13
# dan todo el contexto necesario.
```

---

## 7. Notas de estado que no deben perderse

- Regla acordada esta sesión: yo paro cuando un fix toca >2 pantallas o >30min, filo como follow-up.
- BUG-008 es el único candidato claro a seguir siendo `fix-in-14.13` (si Alejandro elige opción A).
- BUG-005/006/009/010 ya están mentalmente filed como candidatos follow-up — el criterio final lo das tú mañana.
- La Story 14.13 sigue `in-progress` en `sprint-status.yaml` hasta que pase a Outcome A o B del sign-off on-device.
