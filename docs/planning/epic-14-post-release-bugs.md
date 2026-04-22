# Epic 14 — Bug Log Post-Release

**Abierto:** 2026-04-22
**Contexto:** Bugs detectados por Alejandro usando la app tras cierre de Epic 14 (14.1–14.12b).
**Uso:** Captura libre. Cuando haya lote estable, convertir cada BUG en spec con `feature-spec` y meter al sprint.

---

## Leyenda

- **Severidad:** `blocker` · `high` · `medium` · `low` · `polish`
- **Estado:** `new` · `triaged` · `spec'd` · `in-dev` · `fixed` · `wontfix`

---

## Bugs

<!-- Plantilla a copiar para cada bug nuevo

### BUG-00X — [título corto]
- **Fecha:** 2026-04-22
- **Pantalla / Área:**
- **Qué observo:**
- **Esperado:**
- **Pasos para reproducir:**
  1.
- **Dispositivo / build:**
- **Severidad:**
- **Estado:** new
- **Notas:**

-->

### BUG-001 — Navegación apilada tras guardar prenda y abrir combinaciones
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Flow cámara → guardar prenda → "ver combinaciones de color" → Mis Looks
- **Qué observo:** Al entrar a ver las combinaciones de color después de guardar la prenda, las pantallas se apilan como "pestañas": al fondo se ve la página de color, encima la cámara, encima los combos. Si voy a Mis Looks, no entro a pantalla completa hasta que voy retrocediendo varias veces hacia atrás.
- **Esperado:** Cada transición sustituye la pantalla anterior (`replace`), de modo que al llegar a Combos / Mis Looks la pantalla se vea completa y limpia sin capas acumuladas debajo.
- **Pasos para reproducir:**
  1. Entrar a la cámara y tomar una foto de una prenda.
  2. Completar recorte + extracción de color.
  3. Guardar en el armario y elegir tipo de prenda.
  4. Pulsar "ver combinaciones de color".
  5. Observar que la pantalla de combos no cubre toda la vista — se intuyen capas de pantallas previas.
  6. Ir a Mis Looks y notar que tampoco está a pantalla completa hasta retroceder.
- **Dispositivo / build:** iPhone físico de Alejandro (build instalada — presumiblemente TestFlight v1.3.0 o build local de Epic 14; confirmar build exacta si hace falta)
- **Severidad:** `high` _(propuesta: rompe sensación de flow lineal en camino crítico post-Epic 14; confirmar)_
- **Estado:** new
- **Notas:**
  - Huele al mismo patrón ya resuelto en Epic 12 (`replace` nav sin `fullScreenModal`) — revisar rutas implicadas: pantallas de resultado de cámara, detalle de prenda post-guardado, navegación a Combos y a Mis Looks.
  - Posible causa: uso de `navigation.navigate` (push) donde debería ser `navigation.replace` en los hand-offs post-guardado.

<!-- Formato solución por bug cerrado (añadir al final del bug, NO editar el cuerpo original):

- **Estado:** fixed — {fecha} · commit {sha corto}
- **Solución:**
  - {1-2 líneas sobre los archivos tocados y el enfoque}
  - {tests: qué se borró/actualizó y por qué}

-->

### BUG-002 — Contador de combos en header sobra (polish)
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Pantalla de combinaciones tras guardar prenda (post-cámara → guardado → ver combos)
- **Qué observo:** Arriba a la izquierda aparece un contador tipo "2 combos" / "4 combos" según el caso.
- **Esperado:** Que no aparezca ese contador — el número de combos no aporta valor al usuario en ese header y ensucia la UI.
- **Pasos para reproducir:**
  1. Tomar foto en cámara, guardar prenda y abrir combinaciones.
  2. Observar el header superior izquierdo.
- **Dispositivo / build:** iPhone físico de Alejandro (misma build que BUG-001)
- **Severidad:** `polish` _(decisión de UX / estética, no rompe nada)_
- **Estado:** fixed — 2026-04-22 · fix-in-14.13
- **Notas:**
  - Cambio simple de header: quitar el contador del título/subtítulo.
  - **Alcance confirmado: en TODAS las pantallas de combos** donde aparezca (post-cámara, entrada desde Wada, desde familia, etc.). Revisar todos los puntos de entrada a la vista de combos y eliminar el contador del header de forma consistente.
- **Solución:**
  - `src/screens/Combinations.tsx:71–112`: eliminado el `<Text testID="combo-count">` (y la derivación `comboCount`); simplificado el `accessibilityLabel` del header de `"{{nameEn}}, {{N}} combinations"` a solo `{{nameEn}}`. `justify-between` → sin dependencia, removido porque el header queda con un único hijo `flex-1`.
  - `src/screens/ColorHome.tsx:607–617` (State 2 header tras seleccionar familia): eliminado el mismo `<Text testID="combo-count">`.
  - Keys i18n `combinations.combo` + `combinations.combination` + `home.combo` quedan en los JSON como huérfanas a propósito — las consume `i18n.test.ts` para verificar pluralización (plumbing), no el feature de render; borrarlas rompería esos tests sin beneficio.
  - Tests: borrado `Combinations › renders combo count in header` + `ColorHome › State 2 shows correct combo count`. Reescrito `ColorHome › shade change updates combo feed` para asertar via `combo-card-combo-*` testIDs en vez del contador. Actualizado `Combinations › renders header with accessibility label` al nuevo `accessibilityLabel` sin count.

### BUG-003 — Contador "1/3" en asignación de prendas sobra (polish)
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Flow de asignación de prendas a un look / combo (arriba a la izquierda del header)
- **Qué observo:** Aparece un contador tipo "1/3" en la esquina superior izquierda durante el proceso de asignar prendas.
- **Esperado:** Que no aparezca — el contador no aporta valor y ensucia la UI, igual que el contador de combos (BUG-002).
- **Pasos para reproducir:**
  1. Entrar al flow de asignar prendas a un look / combo.
  2. Observar el header superior izquierdo.
- **Dispositivo / build:** iPhone físico de Alejandro (misma build que BUG-001/002)
- **Severidad:** `polish`
- **Estado:** fixed — 2026-04-22 · fix-in-14.13 (scope S2; S4/S5 fuera por decisión conservadora — ver Solución)
- **Notas:**
  - Eliminar el indicador `X/N` del header en **todos los flows de asignación** (inicial multi-slot, reemplazo de prenda ya asignada, añadir una sola, etc.).
  - **Excepción confirmada:** mantener el contador `X/N` en las **cards de favoritos** — ahí sí aporta y se queda.
- **Solución:**
  - `src/screens/armario/ArmarioFichaWadaScreen.tsx:228–232`: eliminado el `<CompletenessBadge testID="s2-completeness-badge">` del header de la Ficha Wada (pantalla S2, flow principal de asignación activa). Eliminado también el `import { CompletenessBadge }` ya que la pantalla no tiene más usos del componente.
  - **Scope conservador:** NO se toca `ArmarioTuLookScreen.tsx:319` (S4 "Tu look" 3/3 final, post-completion — contexto informativo de un look ya completo) ni `ArmarioSugerenciaArmoniaScreen.tsx:416` (S5 Sugerencia — pantalla de recomendación, no de asignación activa). Si quieres que se quiten también en S4/S5, abre BUG-00X follow-up.
  - **Preservado** (por decisión del bug): `IncompleteLooksSection.tsx:102–106` (cards "En curso" de Mis Looks) y `FavoriteComboEnrichedCard.tsx:102` (cards enriquecidas de favoritos) mantienen el badge — es el mismo componente `CompletenessBadge` en contexto de card/grid, NO en header de flow activo.
  - Tests: borrado `ArmarioFichaWadaScreen › CompletenessBadge reflects 2/3 amber vs 3/3 green based on assignment count` (la feature ya no existe en esta pantalla). Los tests de `CompletenessBadge.test.tsx`, `IncompleteLooksSection.test.tsx`, `FavoriteComboEnrichedCard` se conservan intactos — el componente sigue siendo correcto en sus otros consumidores.

### BUG-004 — CTA duplicado en sugerencia de prenda faltante
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Completar look — sugerencia de prenda faltante (card de sugerencia + botón CTA)
- **Qué observo:** Dentro de la tarjeta de sugerencia aparece un texto tipo "ideal para bla bla… Añadir prenda en Rose", y justo debajo hay un **botón negro** con la misma frase ("Añadir prenda en Rose"). El CTA queda duplicado: una vez como texto dentro de la sugerencia y otra como botón.
- **Esperado:** Una sola aparición del CTA. Lo natural: que el texto de la sugerencia termine sin repetir el call-to-action, y que el botón negro sea el único sitio donde aparece "Añadir prenda en [Color]".
- **Pasos para reproducir:**
  1. Empezar a completar un look al que le falta al menos una prenda.
  2. Observar la tarjeta de sugerencia que propone añadir una prenda en un color concreto (ej. Rose).
  3. Ver que la frase CTA aparece dentro del texto de la sugerencia **y** en el botón inmediatamente debajo.
- **Dispositivo / build:** iPhone físico de Alejandro (misma build que BUG-001/002/003)
- **Severidad:** `medium` _(afecta claridad de copy en un camino frecuente; confirmar)_
- **Estado:** fixed — 2026-04-22 · fix-in-14.13
- **Notas:**
  - Revisar el componente de la card de sugerencia — probablemente el copy interno incluye el CTA como cierre y a la vez el botón lo renderiza como label propio.
  - **Decisión confirmada por Alejandro:** dejar el CTA **solo en el botón negro**; reescribir el texto de la sugerencia para que termine sin repetir la acción (ej. "Ideal para equilibrar tu look." sin "Añadir prenda en Rose" al final). El texto interno de la card no debe repetir el call-to-action — es redundante.
- **Solución:**
  - Diagnóstico: el copy interno de la card (`suggestionCopyAccessory/Main/Layer` en `es.json`/`en.json`) ya era limpio (no incluía el CTA) — la duplicación la causaba el propio componente `SuggestionCard` en `ArmarioSugerenciaArmoniaScreen.tsx`, que renderizaba un tercer `<Text testID="s5-suggestion-card-cta">` con la cadena `"Añadir prenda en {{color}}"` JUSTO sobre el botón negro que ya llevaba la misma label.
  - `src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx`: eliminado el bloque `<Text testID="s5-suggestion-card-cta">{ctaText}</Text>` dentro de `SuggestionCard`; quitado el prop `ctaText` de `SuggestionCardProps`, de la firma de la función y del call-site. La card queda con solo `titleText` + `bodyText`; el botón negro inferior (`s5-primary-cta`) sigue siendo el único CTA explícito.
  - **A11y preservada:** la card sigue siendo tappable (`<Pressable onPress={handleOpenPicker}>`) y su `accessibilityLabel` sigue siendo `"Añadir prenda en {{color}}"` — VoiceOver anuncia la acción al enfocar la card. No se pierde funcionalidad, solo redundancia visual.
  - Tests: cero borrados. Los tests existentes de `ArmarioSugerenciaArmoniaScreen.test.tsx` solo asertan sobre `s5-suggestion-card` (wrapper), `s5-suggestion-card-body` y los CTAs de pantalla — ningún test asertaba sobre el `s5-suggestion-card-cta` ahora removido. 10/10 tests del screen pasan.

### BUG-005 — Layout Mis Looks: relación entre "En curso" y filtros de ordenación confusa
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Mis Looks (tab) — cards "En curso" + filtros de ordenación justo debajo
- **Qué observo:** Las cards de "En curso" aparecen arriba y justo debajo están los filtros de ordenación, sin separación visual. Al no haber línea divisoria ni mini-header, parece raro visualmente; además los filtros parecen afectar también a "En curso", lo que confunde el scope.
- **Esperado:** Que el scope de los filtros quede claro y que "En curso" se sienta como sección propia (no mezclada con la grilla que ordenan los filtros).
- **Pasos para reproducir:**
  1. Ir al tab Mis Looks.
  2. Tener al menos un look "En curso" y varios terminados.
  3. Observar que "En curso" y los filtros están pegados sin separación clara.
- **Dispositivo / build:** iPhone físico de Alejandro
- **Severidad:** `medium` _(IA confusa, afecta entendimiento de la pantalla)_
- **Estado:** new
- **Notas:**
  - **Decisión confirmada por Alejandro:**
    - "En curso" deja de estar afectada por los filtros — se convierte en sección propia con mini-header (ej. "En curso · 2").
    - Los filtros pasan a ser **barra sticky sobre la grilla de looks terminados**, con su propio header de sección (ej. "Todos tus looks" o similar).
    - Separación semántica entre las dos zonas (no solo cosmética con una línea).
  - Opciones descartadas:
    - Solo añadir línea divisoria → resuelve lo visual pero mantiene la ambigüedad de scope.
    - Mover filtros arriba del todo → cambia el comportamiento para que afecten a "En curso", no es lo que queremos.

### BUG-006 — Flash de "Mis Looks" antes de abrir selector de prendas al hacer un look desde Visualizer
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Outfit Visualizer → CTA "Hacer este look mío" → Selector de prendas
- **Qué observo:** Al pulsar "Hacer este look mío" desde el Outfit Visualizer (flow: pantalla de colores → seleccionar Gris → elegir combinación → Visualizer → CTA), hay aproximadamente **1 segundo** en el que la pantalla aterriza en **Mis Looks** y justo después se abre el selector de prendas de ese combo. El flash es corto pero se aprecia.
- **Esperado:** Transición directa del Visualizer al selector de prendas sin que Mis Looks aparezca como estado intermedio visible.
- **Pasos para reproducir:**
  1. Abrir pantalla de colores y seleccionar una familia (ej. Gris).
  2. Elegir una combinación de esa familia.
  3. Entrar al Outfit Visualizer.
  4. Pulsar "Hacer este look mío".
  5. Observar el flash: durante ~1s se ve Mis Looks y luego aparece el selector de prendas.
- **Dispositivo / build:** iPhone físico de Alejandro (misma build que bugs previos)
- **Severidad:** `medium` _(glitch de percepción, no rompe flow, pero se nota y baja la calidad percibida)_
- **Estado:** new
- **Notas:**
  - Huele a race condition de navegación: parece que primero se navega al tab Mis Looks y después se apila el selector encima, en vez de abrir el selector directamente desde la pila actual (o con la transición escondida).
  - Posibles causas a investigar:
    - El handler de "Hacer este look mío" hace `navigation.navigate('MisLooks')` y luego encadena la apertura del selector, en vez de abrir el selector directamente.
    - Animación de cambio de tab visible antes del `present`/`push` del selector.
  - Relacionado con BUG-001 (problema de stack): ambos apuntan a hand-offs de navegación post-acción mal encadenados. Considerar revisar ambos juntos cuando se haga la spec.

### BUG-007 — Etiqueta "Sin prendas" redundante en asignación de prendas (polish)
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Flow de asignación de prendas (cuando aún no hay prendas asignadas a un slot o al look)
- **Qué observo:** Aparece una etiqueta / texto "Sin prendas" en la pantalla de asignación.
- **Esperado:** Que no aparezca — ya se entiende del contexto visual que la pantalla es para meter prendas; el texto "Sin prendas" es redundante.
- **Pasos para reproducir:**
  1. Entrar al flow de asignar prendas a un look o a un slot vacío.
  2. Observar la etiqueta "Sin prendas" en la zona correspondiente.
- **Dispositivo / build:** iPhone físico de Alejandro (misma build que bugs previos)
- **Severidad:** `polish`
- **Estado:** fixed — 2026-04-22 · fix-in-14.13 (resuelto como efecto colateral de BUG-003 al borrar el `<CompletenessBadge>` del header S2)
- **Notas:**
  - Eliminar el texto "Sin prendas" únicamente dentro del **flow de asignación de prendas** (header / área activa durante la asignación).
  - **Excepción confirmada:** mantener "Sin prendas" (y contadores tipo `2/3`) en las **cards de "En curso"** de Mis Looks — ahí sí aporta, porque de un vistazo el usuario ve qué le falta por completar.
  - Patrón consistente con BUG-003: los contadores/labels de estado se quitan en flows activos, pero se **conservan en cards de resumen** (favoritos, En curso).
- **Solución:**
  - La misma edición de BUG-003 en `ArmarioFichaWadaScreen.tsx:228–232` elimina el renderizado del label "No garments yet" / "Sin prendas" en S2, porque era el caso `variant === "none"` del mismo `<CompletenessBadge>` (la key i18n `armario.badge.none`). Al quitar el componente del header, desaparece tanto el `X/N` como el estado vacío.
  - **Preservado:** `IncompleteLooksSection.tsx:102–106` sigue mostrando "No garments yet" en cards "En curso" de Mis Looks usando el mismo componente con `variant="short"` por defecto. `FavoriteComboEnrichedCard.tsx:85` usa una key distinta (`armario.favorites.badgeNone` = "No garments", variant long) — también intacto.
  - Tests: la prueba `CompletenessBadge.test.tsx › renders grey none variant with 'No garments yet'` sigue pasando — el componente en sí no cambia, solo su uso en S2.

---

## Resumen de triage (se actualiza cuando cerremos lote)

| ID      | Título                                               | Severidad | Estado | Spec generada     |
|---------|------------------------------------------------------|-----------|--------|-------------------|
| BUG-001 | Navegación apilada tras guardar prenda               | high      | new    | —                 |
| BUG-002 | Contador "X combos" en header                        | polish    | fixed  | fix-in-14.13      |
| BUG-003 | Contador "1/3" en asignación (S2 Ficha Wada)         | polish    | fixed  | fix-in-14.13      |
| BUG-004 | CTA duplicado en sugerencia de prenda faltante       | medium    | fixed  | fix-in-14.13      |
| BUG-005 | Layout Mis Looks "En curso" vs filtros confuso       | medium    | new    | —                 |
| BUG-006 | Flash Mis Looks antes del selector desde Visualizer  | medium    | new    | —                 |
| BUG-007 | "Sin prendas" redundante en asignación               | polish    | fixed  | fix-in-14.13      |
| BUG-008 | Falta feedback visual tras "Usar esta foto" (~1s)    | medium    | new    | —                 |

### BUG-008 — Falta feedback visual tras pulsar "Usar esta foto" al añadir prenda a combo
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Flow de completar combinación — añadir prenda nueva → pantalla de preview de foto → botón "Usar esta foto"
- **Qué observo:** Al pulsar "Usar esta foto" tras hacer la foto de una prenda nueva (flow: completar combinación → cámara → preview), hay aproximadamente **1 segundo** de espera en un iPhone 14 sin ningún feedback visual. El usuario no sabe si se ha pulsado, si está procesando o si algo se ha colgado.
- **Esperado:** Feedback visual inmediato que indique que se está procesando (spinner / estado loading en el botón, overlay sutil, o transición animada) durante el tiempo entre la pulsación y el siguiente paso del flow.
- **Pasos para reproducir:**
  1. Entrar al flow de completar una combinación que necesita una prenda más.
  2. Abrir la cámara para añadir una prenda nueva.
  3. Tomar la foto → llegar a la pantalla de preview.
  4. Pulsar "Usar esta foto".
  5. Observar que durante ~1s no hay ninguna señal visual de que se esté procesando.
- **Dispositivo / build:** iPhone 14 físico de Alejandro (misma build que bugs previos)
- **Severidad:** `medium` _(afecta percepción de calidad/respuesta en un camino crítico; no rompe pero invita a pulsar de nuevo o dudar)_
- **Estado:** new
- **Notas:**
  - Durante ese segundo se están ejecutando probablemente: recorte (Vision / Swift), extracción de color dominante (`react-native-image-colors`), y persistencia. Todo síncrono desde la UI aunque haya pasos async por debajo.
  - Posibles soluciones (elegir según arquitectura):
    - **Estado loading en el botón** `"Usar esta foto"` → spinner + disable durante el procesamiento (mínimo viable).
    - **Overlay full-screen** con mensaje breve ("Procesando…" / "Extrayendo color…") si queremos aprovechar para comunicar valor (opción más rica).
    - **Navegación inmediata** a la siguiente pantalla con skeleton loader para el preview de la prenda mientras se completa el procesamiento en background (óptimo pero más invasivo).
  - Revisar si este mismo gap existe en el flow equivalente de **cámara desde Home** (post-guardado de prenda inicial); si sí, aplicar el mismo patrón de feedback para mantener consistencia.
