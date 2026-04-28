# ASO v1.4.0 — Handoff para agente `app-store-aso`

**Fecha:** 2026-04-28
**Origen:** sesión de marketing visual (commits `049ffb8` → `cc07129` en `epic-15`)
**Destino:** agente `app-store-aso` en una nueva ventana de Claude Code
**Objetivo:** refinar **subtítulo + keywords + promotional text** EN+ES alineados con el nuevo posicionamiento de v1.4.0.

---

## Cómo usar este doc

Pega el siguiente prompt al activar el agente ASO en la otra ventana:

```
Necesito que actives el agente `app-store-aso` para refinar el ASO de Outfinder v1.4.0.

## Contexto previo — leer antes de proponer nada

Lee en orden:

1. `docs/planning/aso-v140-handoff-keywords.md` (este doc) — el resumen del cambio de posicionamiento y keywords sugeridos
2. `docs/planning/aso-v140-spec.md` §10 — estado final del set marketing visual (carril B locked, copy por slot, icono V16)
3. Memoria `project_release_tracking.md` — ASO actual de v1.3.0 (lo que vamos a evolucionar)
4. Memoria `project_aso_v140_complete.md` — resumen de la sesión visual

## Qué necesito que produzcas

1. **Subtítulo App Store Connect** EN (≤30 chars) + ES (≤30 chars) que alinee con el nuevo tono punch del Carril B
2. **Keywords ASO** EN+ES (≤100 chars) — versión refinada con prioridades nuevas
3. **Promotional Text** EN+ES (≤170 chars, editable sin review) que conecte con el icono V16 + el nuevo set de capturas
4. **Release Notes (What's New)** EN+ES para v1.4.0 — Armario Virtual + Camera unificada + Mis Looks workspace + Sugerencia armonía

## Restricciones

- **Tono punch directo, gen-Z** — heredado del Carril B locked
- **ES nativo, NO traducción** literal del EN — voz propia castellana (ver tabla copy en §10.2 del spec)
- **Wada va en keywords + description, NO en copy user-facing** — heredado de v1.3 (ver memoria release_tracking)
- **Anti-AI positioning** — "hand-picked", "curated by humans", "1933" son cards diferenciadoras que SÍ van en copy
- **No regresar copy locked** — si el usuario aprobó "Tu estilo. Tuyo de verdad." en el set visual, esa frase es el ancla del subtitulo ES
```

---

## Resumen del cambio de posicionamiento v1.3 → v1.4

### Estado v1.3 (lo que está vivo en App Store hoy)

- **Subtítulo EN**: `Scan. Style. Done.` (17 chars)
- **Subtítulo ES**: `Escanea. Combina. Listo.` (23 chars)
- **Keywords EN**: `camera,scan,color,outfit,style,match,closet,wardrobe,palette,fashion,aesthetic,mood,vibe`
- **Keywords ES**: `camara,escaner,color,combinar,atuendo,estilo,armario,paleta,moda,estetica,outfit,tendencia`
- **Promo EN**: `Scan any garment. See what goes with it. Offline, instant, and actually accurate.`
- **Promo ES**: `Escanea cualquier prenda. Ve con qué combina. Sin conexión, al instante, y preciso de verdad.`
- **App Name**: `Outfinder: Color Coordination` / `Outfinder: Coordina Colores` (sin cambio)

### Lo nuevo en v1.4 (Armario Virtual + camera unificada + Mis Looks workspace)

Features clave que debe reflejar el ASO:
- **Armario Virtual**: usuario fotografía sus prendas reales, app las recorta (Vision iOS) y las organiza por tono Wada → wedge anti-stock vs Cladwell/Whering/Smart Closet
- **Cámara unificada con detección de tono**: una foto → recorte limpio + tono Wada nombrado + 7 combinaciones disponibles
- **Mis Looks (era "Favoritos")**: workspace activo, no archivo muerto. Looks "in progress" (1/3, 2/3 prendas asignadas) son el hook de retención
- **Sugerencia de armonía**: la app detecta huecos en el outfit y sugiere qué color falta — "stylist consultant" mode
- **348 combos curados por Sanzo Wada (1933)**: anti-AI, hand-picked, no algoritmo

---

## Posicionamiento del nuevo set visual (Carril B locked)

Ver `aso-v140-spec.md §10.2` para tabla completa. Resumen del headline-de-cada-slot:

| # | EN | ES |
|---|---|---|
| 1 (hero Tu Look) | Your style. Yours. | Tu estilo. Tuyo de verdad. |
| 2 (Camera Scan) | One tap. Real colour name. | Una foto. Su tono real. |
| 3 (Camera Result) | From photo to 7 outfits. | De foto a 7 outfits. |
| 4 (Armario picker) | Your closet, in your pocket. | Tu armario, en tu bolsillo. |
| 5 (Mis Looks) | Always cooking. | Tus looks, siempre en marcha. |
| 6 (Combinations) | 348 combos. Hand-picked. | Escogidos a mano. Desde 1933. |
| 7 (Sugerencia) | Knows what to add. | Sabe qué falta. |
| 8 (Visualizer) | Vibe check first. | Prueba primero. |

**Brújula del tono**: outcome-first ("your style", "your closet"), punch directo (≤4 palabras), gen-Z ("vibe check", "always cooking"), ES nativo no traducido ("tu armario en tu bolsillo", "siempre en marcha").

---

## Keywords sugeridos (input para el agente ASO, NO finales)

### EN (priority shifts vs v1.3)

**SUBEN prioridad** (alineados con v1.4 features):
- `wardrobe` (era prioridad 8 → mover a top 5)
- `outfit-builder`, `outfit-planner` (Mis Looks workspace)
- `closet`, `closet-organizer` (Armario Virtual core)
- `color-matching`, `color-naming` (Camera Result + Wada tone)
- `cutout`, `background-remover` (cámara con Vision iOS)
- `drafts`, `looks-in-progress` (Mis Looks como workspace)
- `hand-picked`, `curated` (anti-AI wedge — combos por humano)
- `Sanzo-Wada`, `1933` (heritage authority)

**MANTIENEN** (siguen relevantes):
- `camera`, `scan`, `color`, `outfit`, `style`, `match`, `wardrobe`, `palette`, `fashion`, `aesthetic`

**BAJAN** (menos prioritarios para v1.4):
- `mood`, `vibe` (todavía relevantes pero no top)
- `tendencia` (genérico)

### ES (priority shifts vs v1.3)

**SUBEN**:
- `armario` (Armario Virtual)
- `prendas`, `recorte`, `recortar` (cámara cutout)
- `outfit`, `outfits` (Mis Looks)
- `combina`, `combinaciones` (sugerencia + 348 combos)
- `escogidos-a-mano`, `curados` (anti-IA)

**MANTIENEN**:
- `camara`, `escaner`, `color`, `combinar`, `atuendo`, `estilo`, `armario`, `paleta`, `moda`, `estetica`, `outfit`

**BAJAN**:
- `tendencia`, `estetica` (genéricos)

---

## Subtítulo — anclas posibles

Para el subtítulo (≤30 chars) hay 3 caminos posibles que tu ASO agent debería sopesar:

### A) Heredar la voz #1 del set (identity-first)
- EN: `Your style. Yours.` (17 chars) — coincide con headline #1
- ES: `Tu estilo. Tuyo de verdad.` (26 chars) — coincide con headline #1

**Pro**: coherencia 1:1 con el primer screenshot (alineación cognitiva en App Store).
**Contra**: muy abstracto para alguien que aún no ha visto las capturas.

### B) Outcome compacto (descriptive punch)
- EN: `Your closet, color-matched.` (27 chars)
- ES: `Tu armario, ya combinado.` (25 chars)

**Pro**: comunica utilidad clara antes del scroll.
**Contra**: pierde el toque "joven punch".

### C) Mantener ADN v1.3 evolucionado
- EN: `Scan. Style. Drafted.` (21 chars) — heredado pero con "Drafted" (Mis Looks)
- ES: `Escanea. Combina. Guarda.` (25 chars)

**Pro**: continuidad con v1.3, fácil para usuarios que ya conocen.
**Contra**: no aprovecha el cambio narrativo.

**Mi recomendación al agente ASO**: tirar **A para ES** (más nativo y memorable) y **B para EN** (más legible para audiencia internacional). Pero la decisión final es del agente ASO + Alejandro tras analizar competencia.

---

## Release Notes — narrativa sugerida

Features nuevas v1.4.0 a destacar en Release Notes:
1. **Armario Virtual** — "Photograph your wardrobe. We organize it by Wada tone."
2. **Cámara unificada** — "One tap. We name the color, suggest 7 outfits."
3. **Mis Looks workspace** — "Looks in progress, not just saved. Pick up tomorrow."
4. **Sugerencia de armonía** — "Knows what's missing. Tells you the color to add."

ES native:
1. "Tu armario, fotografiado y organizado solo."
2. "Una foto. Tono detectado. 7 combos listos."
3. "Tus looks siempre en marcha — sigue donde lo dejaste."
4. "Sabe qué te falta. Te dice qué color añadir."

---

## Riesgos / Notas

- **Riesgo legal**: "1933" y "Sanzo Wada" son OK (dominio público en mayoría de jurisdicciones), pero el agente ASO debería verificar que no hay claims que requieran TM.
- **Riesgo de keyword stuffing**: keywords ASC tiene 100 chars máximo. Priorizar es clave — no meter todos los nuevos.
- **Coherencia con icono V16**: el icono es serif "O" carmín — el subtítulo en EN podría jugar con esa "O" implícita ("**O**utfinder: your style. yours."). Idea para explorar.

---

## Outputs esperados del agente ASO

1. **Subtitle EN** + **Subtitle ES** finales (≤30 chars cada uno)
2. **Keywords EN** + **Keywords ES** finales (≤100 chars cada uno, comma-separated)
3. **Promotional Text EN** + **Promotional Text ES** (≤170 chars cada uno)
4. **Release Notes EN** + **Release Notes ES** (sin límite estricto, pero conciso)
5. **Recomendación de actualización para `project_release_tracking.md`** memoria

Cuando el agente ASO termine, los outputs deberían ir directo a `project_release_tracking.md` reemplazando la sección "ASO metadata actual" con el nuevo bloque v1.4.0.

---

*Fin del handoff. Una vez el agente ASO produzca los textos finales, el flujo de release continúa con el `feedback_appstore_release_checklist.md` (14 items pre-submit), luego `release-manager` para EAS Build + ASC submit.*
