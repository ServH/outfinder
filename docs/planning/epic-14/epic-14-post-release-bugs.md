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
- **Estado:** fixed — 2026-04-23 · fix-in-14.13 (segundo intento — el primer fix `navigate+goBack` rompió los CTAs en device, reemplazado por `popTo`)
- **Notas:**
  - Huele al mismo patrón ya resuelto en Epic 12 (`replace` nav sin `fullScreenModal`) — revisar rutas implicadas: pantallas de resultado de cámara, detalle de prenda post-guardado, navegación a Combos y a Mis Looks.
  - Posible causa: uso de `navigation.navigate` (push) donde debería ser `navigation.replace` en los hand-offs post-guardado.
- **Solución (primer intento — NO TOCAR ESTA HISTORIA, documentada para aprender del error):**
  - **Root cause confirmado:** no era `push` vs `replace` dentro del stack; era que los CTAs de cross-nav del `UnifiedCameraRoot` (modal sobre RootStack) llamaban `rootNav.navigate("Main", {...})` para actualizar el tab destino, pero **nunca cerraban el modal**. React Navigation mantenía el `UnifiedCameraStack` montado encima de `Main`, así que el usuario veía Combinations (o Mis Looks) detrás de las capas apiladas del camera flow.
  - Primer parche intentado: añadir `rootNav?.goBack()` JUSTO DESPUÉS del `rootNav?.navigate(...)`. En tests unitarios pasaba (mocks de navigate + goBack correctos en orden), pero **en device los CTAs dispararon haptic y nada más** — sin destino visible. Alejandro lo reportó 2026-04-23.
  - **Por qué falló:** `rootNav.navigate("Main", { screen: "ColorsTab", params: { screen: "Combinations", ... } })` cambia el **focused navigator** al nested (Combinations dentro de ColorsStack). Cuando después se llama `rootNav?.goBack()`, React Navigation routea el `GO_BACK` al navigator focalizado actual (el nested), NO al que captura la referencia. Resultado: el goBack pop-a la Combinations recién pusheada en vez de dismissar el modal — efectivamente cancelando el navigate. User ve "nada" porque ambas acciones se neutralizan. Gotcha clásico de nested navigators: referencia capturada ≠ navigator que procesa el dispatch después de un navigate que cambia focus.
- **Solución real (segundo intento, aplicada 2026-04-23):**
  - Cambio de `navigate + goBack` a **`popTo("Main", nested)`** en un solo dispatch atómico. `popTo` es la API idiomática RN7 para "pop back hasta esta pantalla del stack actual aplicando estos params nested" — maneja atómicamente el modal-dismiss Y el nested-navigate, sin race de focus.
  - Archivos tocados (3 callsites, 1 patrón):
    - `src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx`: primary CTA ("Ver combinaciones con {{wadaName}}") + secondary CTA ("Mis Looks") — ambos `popTo("Main", {...})`.
    - `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx`: `handleSecondaryLink` ("ver combinaciones sin guardar" antes de guardar) — mismo patrón.
  - Comentarios en cada callsite explicando por qué popTo y no navigate+goBack (para futuros refactors).
  - Tests: actualizados los mocks de `getParent()` — `mockRootPopTo` en vez de `mockRootNavigate + mockRootGoBack`. 3 tests reescritos asertan `popTo("Main", {...nested correcto})` (1 en Result, 2 en PostSave). Baseline: **939 passing / 3 pre-existing / 942 total** (net −3 vs. 942 porque eliminé los tests duplicados que testeaban `navigate` separado del `goBack` — ahora un solo test por callsite cubre el comportamiento completo).
  - **Validación on-device pendiente** (tú): flow cámara → guardar prenda → tap "Ver combinaciones con {{nameEn}}" → modal se dismissa limpio, Combinations renderiza en primer plano sin capas, swipe-back lleva al ColorHome anterior (no al Camera). Ídem con "Mis Looks" secondary + con el link "ver combinaciones sin guardar" del Result screen.

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
- **Análisis deferred — 2026-04-22 (no aplicado en 14.13, candidato follow-up):**
  - **Root cause identificado, NO es el mismo que BUG-001.** BUG-001 era modal-stacking (fix trivial: `navigate + goBack`). BUG-006 es un compound-fade: `OutfitVisualizer.handleMakeMine` en `src/screens/OutfitVisualizer.tsx:195–206` llama `rootNav.navigate("Main", { screen: "FavoritesTab", params: { screen: "ArmarioFichaWada", params: { combinationId } } })` — RN aplica el nested state atomically, PERO el `TabNavigator` tiene `animation: "fade"` (300ms) + el `FavoritesStack` también tiene `animation: "fade"` (300ms). Durante esos ~600ms combinados, se alcanza a ver el estado root del FavoritesStack (FavoritesList) fade-out mientras ArmarioFichaWada fade-in, todo bajo el cross-fade del tab.
  - **Por qué NO se fixea en 14.13:** `TabNavigator.tsx` ya tiene `lazy: false` + `detachInactiveScreens: false` (correctos — no es un mount tardío). La solución limpia requiere uno de:
    1. **`CommonActions.reset`** con estado nested completo preparado (verboso, ~20 líneas, frágil si el orden de tabs cambia, rompe back-behavior si no se preserva FavoritesList en la stack).
    2. **Override local de `animation: "none"`** para esta transición específica — requiere una API que RN7 no expone limpiamente a un caller externo (habría que cambiar screenOptions globalmente del FavoritesStack — efecto colateral en otras transiciones).
    3. **Pre-dispatch del stack push seguido del tab switch** — dos dispatches separados, requiere research del timing exacto de RN7 batching.
  - Cualquier opción excede los 30min del contrato `fix-in-14.13` y merece su propia story con UX-DR de Alejandro sobre la transición deseada (¿fade corto? ¿slide? ¿spinner intermedio?).
  - **Disposición propuesta:** `follow-up` → abrir story dedicada en Epic 14 polish (o v1.4.1) con 3 tasks: (a) decidir UX de la transición en `feature-spec`, (b) implementar la opción elegida, (c) validar on-device. No bloquea v1.4.0 ship — es cosmético y el flash, aunque notable, NO rompe funcionalidad.

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
| BUG-001 | Navegación apilada tras guardar prenda               | high      | fixed  | fix-in-14.13      |
| BUG-002 | Contador "X combos" en header                        | polish    | fixed  | fix-in-14.13      |
| BUG-003 | Contador "1/3" en asignación (S2 Ficha Wada)         | polish    | fixed  | fix-in-14.13      |
| BUG-004 | CTA duplicado en sugerencia de prenda faltante       | medium    | fixed  | fix-in-14.13      |
| BUG-005 | Layout Mis Looks "En curso" vs filtros confuso       | medium    | new    | —                 |
| BUG-006 | Flash Mis Looks antes del selector desde Visualizer  | medium    | triaged | follow-up propuesto |
| BUG-007 | "Sin prendas" redundante en asignación               | polish    | fixed  | fix-in-14.13      |
| BUG-008 | Falta feedback visual tras "Usar esta foto" (~1s)    | medium    | fixed  | fix-in-14.13      |
| BUG-009 | Prenda fotografiada no auto-rellena slot del combo   | high      | new    | follow-up v1.4.1 (conjunta 010) |
| BUG-010 | Visualizer asigna prenda al slot equivocado por posición | high  | new    | follow-up v1.4.1 (conjunta 009) |
| BUG-011 | Paywall no contextualizado wardrobe vs favorites     | medium    | fixed  | fix-in-14.13      |
| BUG-012 | Crash Visualizer con combos de 5 colores (p346/p348) | high      | triaged | retomar después (root cause + opciones documentadas) |

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
- **Estado:** fixed — 2026-04-23 · fix-in-14.13 (opción A · spinner en botón)
- **Notas:**
  - Durante ese segundo se están ejecutando probablemente: recorte (Vision / Swift), extracción de color dominante (`react-native-image-colors`), y persistencia. Todo síncrono desde la UI aunque haya pasos async por debajo.
  - Posibles soluciones (elegir según arquitectura):
    - **Estado loading en el botón** `"Usar esta foto"` → spinner + disable durante el procesamiento (mínimo viable).
    - **Overlay full-screen** con mensaje breve ("Procesando…" / "Extrayendo color…") si queremos aprovechar para comunicar valor (opción más rica).
    - **Navegación inmediata** a la siguiente pantalla con skeleton loader para el preview de la prenda mientras se completa el procesamiento en background (óptimo pero más invasivo).
  - Revisar si este mismo gap existe en el flow equivalente de **cámara desde Home** (post-guardado de prenda inicial); si sí, aplicar el mismo patrón de feedback para mantener consistencia.
- **Solución:**
  - Scope confirmado solo a **Flow A (ArmarioPreviewScreen)** tras auditar ambos flows de cámara:
    - Flow A (Armario: FichaWada slot → Nueva foto → ArmarioPreview → "Usar esta foto") → botón `armario-preview-use-button` invoca `handleUse` que `await saveCutoutAsWardrobeItem(...)` (~1s gap). Ya existía estado `submitting` con disabled + opacity 0.6 en los 3 CTAs del screen, pero SIN feedback visual de procesamiento. **Aquí se aplicó el fix.**
    - Flow B (FAB → UnifiedCameraResult → "Guardar en mi armario") abre un `CategoryPickerSheet`, NO hace save directo. El save async real vive dentro del sheet (`handleCategoryConfirm` disparado desde el botón "Confirmar" del sheet), y el `CategoryPickerSheet` **YA renderiza un `ActivityIndicator`** cuando su prop `confirming` es true — línea 257–262 del componente. Flow B ya tenía el patrón correcto. Zero cambios en flow B.
  - `src/screens/armario/ArmarioPreviewScreen.tsx`:
    - Import extendido: `ActivityIndicator` añadido al import destructurado de `react-native`.
    - Render prop del `<Pressable testID="armario-preview-use-button">` cambiado: cuando `submitting=true` muestra `<ActivityIndicator testID="armario-preview-use-button-spinner" size="small" color={wadaTokens.bgPaper} />` en lugar del `<Text>` con el label. Cuando `submitting=false` (default) muestra el label como antes. Ningún otro botón del screen (Retake, Back) cambia.
    - `accessibilityState` del Use CTA ampliado de `{ disabled: submitting }` a `{ disabled: submitting, busy: submitting }` — VoiceOver ahora anuncia estado "busy" durante el procesamiento (AX consistente con el patrón de CategoryPickerSheet).
  - `src/screens/armario/ArmarioPreviewScreen.test.tsx`:
    - Test #2 "Usar happy path" extendido con 2 aserciones BUG-008: (a) in-flight el spinner se renderiza por testID (`armario-preview-use-button-spinner`), (b) el `accessibilityState` del use CTA ahora incluye `{ disabled: true, busy: true }`.
    - Tests #3 (paywall path) + #6 (diskFull path) actualizados: las aserciones sobre `useBtn.props.accessibilityState` tras reset pasan de `{ disabled: false }` a `{ disabled: false, busy: false }`. Los `retakeBtn` assertions se mantienen en `{ disabled: false }` — solo el use CTA cambia su accessibilityState.
    - Cero tests borrados; cero tests nuevos necesarios como casos aislados (el spinner se valida dentro del happy-path existente).
  - Baseline tests: **939 passing / 3 pre-existing / 942 total** — idéntica a la baseline de `e39e899`. tsc clean. lint 2 pre-existentes.
  - **Validación on-device PENDIENTE:** flow FichaWada slot vacío → Nueva foto → snap → ArmarioPreview → tap "Usar esta foto" → durante ~1s botón muestra spinner blanco sobre fondo negro + botones Back/Retake deshabilitados con opacity 0.6 → al completar, back automático al slot del FichaWada con la prenda persistida.

### BUG-009 — La prenda recién fotografiada no auto-rellena el slot al hacer look desde combo
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Flow cámara → guardar prenda → combos → Outfit Visualizer → "Hacer este look mío" → look resultante en Mis Looks
- **Qué observo:** Flow completo:
  1. Foto a una camiseta, la app detecta un color Wada cercano (ej. Carmín).
  2. Acepto el color y guardo la prenda en el Armario como "camiseta Carmín".
  3. Post-guardado, la app me propone ver combinaciones. Elijo una de las N que contienen Carmín.
  4. Entro al Outfit Visualizer y pulso "Hacer este look mío".
  5. El look se crea, pero **el slot de camiseta (la prenda con color Carmín) aparece vacío**, aunque la camiseta guardada sí figura en el Armario si navego allí.
- **Esperado:** Al "Hacer este look mío" partiendo de un combo en el que una de las prendas del look es el color Wada que el usuario acaba de declarar (y guardar como prenda real en el Armario), ese slot se debería **auto-rellenar con la prenda recién creada**, dejando solo los slots restantes para que el usuario los complete. El usuario ya le ha dicho a la app "esta camiseta es Carmín" — la app tiene información suficiente para hacer la asociación.
- **Pasos para reproducir:**
  1. Armario vacío o sin camisetas Carmín previas.
  2. Cámara → foto de camiseta roja → la app propone Carmín (o una variante cercana) → aceptar.
  3. Guardar como camiseta Carmín.
  4. "Ver combinaciones" → elegir uno que incluya Carmín.
  5. Visualizer → "Hacer este look mío".
  6. Observar: el slot de camiseta del look aparece vacío.
- **Dispositivo / build:** iPhone 14 físico de Alejandro
- **Severidad:** `high` _(rompe una promesa implícita fuerte del flow: "ya te dije qué prenda tengo en ese color"; además es el happy path de descubrimiento de la app)_
- **Estado:** new
- **Notas:**
  - Este bug es **lógica de producto**, no polish: el sistema tiene toda la info para hacer la asociación (prenda recién creada con color X + slot del look que pide color X + mismo tipo de prenda si está determinado).
  - Requisitos de matching (a confirmar con arquitectura de Epic 13/14):
    - **Color Wada exacto** entre la prenda guardada y el slot del combo.
    - **Tipo de prenda** compatible con el slot (si la prenda guardada es "camiseta" y el slot pide "top", debería matchear; si pide "pantalón", no).
  - Si hay **varias prendas del Armario que matchean** (ej. el usuario ya tiene otra camiseta Carmín), priorizar la **recién creada en este flow** — es la que el usuario tiene en mente.
  - Casos edge a pensar al espec-ar:
    - ¿Qué pasa si el combo tiene 2 slots del mismo color Wada y el usuario solo ha fotografiado una prenda? Auto-rellena uno, el otro queda vacío.
    - ¿Qué pasa si el tipo de prenda detectado por la app es distinto al del slot del combo? Probablemente NO auto-rellenar (evita matches raros).
  - Relacionado con BUG-001 y BUG-006: los tres están en la misma secuencia de hand-offs cámara → combo → Visualizer → Mis Looks. Al espec-ar conviene mirar el flow end-to-end como unidad, no cada bug aislado.

### BUG-010 — Outfit Visualizer asigna la prenda al slot equivocado según posición del color en el combo
- **Fecha:** 2026-04-22
- **Pantalla / Área:** Outfit Visualizer tras elegir combinación derivada de una prenda guardada desde cámara
- **Qué observo:** Flow:
  1. Foto a una camiseta blanca → la app detecta **White Mouse** (sin variación).
  2. Guardo la prenda en el Armario **declarando tipo = camiseta**.
  3. La app me propone 2 combinaciones con White Mouse (ej. White Mouse + Pure White Snow + Misty Morning).
  4. Elijo una y entro al Outfit Visualizer.
  5. **White Mouse aparece en la tercera posición del combo (slot de zapatilla) y el Visualizer renderiza la prenda del usuario como zapatilla**, no como camiseta.
- **Esperado:** El Visualizer debe respetar el **tipo de prenda declarado por el usuario** (camiseta) como anchor. Al presentar el combo, White Mouse (= la camiseta del usuario) se sitúa en el slot de camiseta del Visualizer; los otros dos colores del combo (Pure White Snow + Misty Morning) se asignan a los slots restantes sin imponer semántica incorrecta (o quedan como sugerencia para que el usuario elija qué prenda ponerles).
- **Pasos para reproducir:**
  1. Cámara → foto de camiseta blanca.
  2. Aceptar detección "White Mouse".
  3. Guardar como camiseta.
  4. Pulsar "ver combinaciones".
  5. Elegir cualquier combo donde White Mouse aparezca en la posición 3.
  6. Entrar al Visualizer → observar que la camiseta blanca del usuario se muestra como zapatilla.
- **Dispositivo / build:** iPhone 14 físico de Alejandro
- **Severidad:** `high` _(rompe el modelo mental: la app ignora una declaración explícita del usuario; además es contraintuitivo a nivel visual — una camiseta representada como zapato)_
- **Estado:** new
- **Notas:**
  - **Root cause probable:** el Visualizer está derivando el garment type del **índice de posición del color en el combo Wada** (slot 0 = top, slot 1 = bottom, slot 2 = shoes) en vez de usar el tipo declarado por el usuario en la prenda guardada.
  - El mapeo "posición → tipo de prenda" funciona para combos abstractos de Wada donde no hay prenda real asociada. Pero cuando el combo se instancia **desde una prenda real del usuario**, el tipo de esa prenda debe sobrescribir la posición.
  - **Relación con BUG-009:** son dos caras de la misma moneda. BUG-009 = "no rellena el slot con la prenda". BUG-010 = "rellena, pero en el slot equivocado porque ignora el tipo". Al espec-ar conviene tratarlos como una sola story: **"el Visualizer debe usar la prenda guardada (color + tipo) como anchor al instanciar un look desde combo post-cámara"**.
  - Posible solución de diseño:
    - Al construir el look visualizado, reordenar los 3 colores del combo para que el color de la prenda real del usuario ocupe el slot correspondiente a su tipo declarado (camiseta → top).
    - Los otros colores se muestran en los slots restantes sin forzar "esto es pantalón" o "esto es zapato" si no hay prenda real que lo respalde — pueden quedar como *placeholders de color sin tipo específico* o como *sugerencia abierta*.
  - Casos edge al especar:
    - Combo con 2 colores iguales al tipo de la prenda (ej. dos tonos blancos y el usuario tiene una camiseta blanca): usar el más cercano al declarado.
    - Si el combo solo tiene 2 posiciones (ej. top + bottom sin calzado), el mismo principio aplica.
  - Relacionado con BUG-001, BUG-006 y BUG-009: toda la secuencia cámara → combo → Visualizer → Mis Looks tiene varios agujeros. Conviene spec-arlos como bloque coherente.

### BUG-012 — Crash al abrir Visualizer con combos de 5 colores
- **Fecha:** 2026-04-25 (descubierto on-device por Alejandro)
- **Pantalla / Área:** Outfit Visualizer instanciado desde un combo de 5 colores. Solo afecta a **2 combos del dataset**: `p346 "Madder and Ink"` y `p348 "Stone Garden"`.
- **Qué observo:** Al entrar al Visualizer con uno de esos 2 combos la app crashea (TypeError). El resto del flow (ColorHome → Combinations → ComboCard) funciona — los 5 colores se renderizan en la card del listado, pero al tap → Visualizer → boom.
- **Esperado:** El Visualizer debería renderizar 5 slots (uno por color) sin crashear, igual que hace con 2/3/4 colores.
- **Pasos para reproducir:**
  1. Desde ColorHome, encontrar una familia que contenga uno de los colores de p346 o p348 (Madder, Ink, Stone, etc.).
  2. Entrar a Combinations de ese color.
  3. Localizar el combo de 5 colores en la lista (Combinations los ordena por `colors.length` ascendente, así que aparecen al final).
  4. Tap → Visualizer → crash.
- **Dispositivo / build:** iPhone físico de Alejandro (build local de la rama `story/14-13-*`).
- **Severidad:** `high` _(la app rompe en un camino alcanzable, aunque sean solo 2 combos de 348 = 0.6%; el crash es duro, no degradación)_
- **Estado:** triaged — diferido para arreglar después
- **Análisis técnico (root cause confirmado):**
  - **Archivo:** `src/hooks/useOutfitState.ts:11–15`
  - El mapa `SLOT_CONFIGS: Record<number, GarmentType[]>` solo tiene entradas para `2`, `3`, `4`. NO para `5`.
  - `buildInitialSlots(colors)` (líneas 59–68): cuando `colors.length === 5`, `SLOT_CONFIGS[5]` es `undefined` → return `[]` defensivo.
  - El consumer (`OutfitVisualizer.tsx:302`) accede `slots[0].color.hex` para la aureola sin guard — con `slots = []`, `slots[0]` es `undefined`, `.color` rompe.
- **Verificación de scope (otros archivos NO rompen con N=5, ya auditados):**
  - `OutfitVisualizer` slots map iteration → OK (N-agnóstico).
  - `ArmarioFichaWadaScreen` renderiza N columnas → OK.
  - `drawPolaroidStack` math `N` + rotaciones cíclicas `i % POLAROID_ROTATIONS.length` → OK escala hasta cualquier N.
  - `ArmarioSugerenciaArmoniaScreen`, `getSuggestionCopy`, `exportLookImage`, `IncompleteLooksSection`, `ComboCard`, `FavoriteComboEnrichedCard`, `data/types.ts` → todos N-agnósticos.
  - **Solo `useOutfitState.SLOT_CONFIGS` es el cuello rígido.**
- **Distribución del dataset Wada (`combinations.json`, 348 combos totales):**
  - 38 combos de 2 colores
  - 225 combos de 3 colores (mayoría)
  - 83 combos de 4 colores
  - **2 combos de 5 colores** — `p346 "Madder and Ink"` + `p348 "Stone Garden"`
  - 0 combos con 6+ colores (no existen en el dataset)
- **Garments disponibles** (`src/components/garments/index.ts` — 8 tipos, NO hay accessory):
  - `top-tshirt`, `top-shirt`, `bottom-pants`, `bottom-skirt`, `layer-jacket`, `layer-hoodie`, `shoes-sneakers`, `shoes-formal`
- **Opciones de fix evaluadas (decisión pendiente al retomar):**
  - **A · Double-layer (recomendado):** `["layer-jacket", "layer-hoodie", "top-tshirt", "bottom-pants", "shoes-sneakers"]` — chaqueta sobre hoodie sobre tshirt + pants + zapas. Look layered invernal, coherente con los tonos terrosos/oscuros de "Madder and Ink" + "Stone Garden".
  - **B · Double-top:** `["layer-jacket", "top-shirt", "top-tshirt", "bottom-pants", "shoes-sneakers"]` — chaqueta + camisa + tshirt + pants + zapas. Más mix formal-casual.
  - **C · Defensive guard sin nuevo slot config:** filtrar combos de 5c del catálogo visible (Combinations.tsx + ColorHome) hasta v1.4.1. Más rápido pero pierde 2 combos del catálogo Wada — anti-craft.
- **Edge case adicional (a discutir al especar):** dataset máximo es 5c hoy, pero el mapa rígido `SLOT_CONFIGS` reaparecería si Wada (o un dataset futuro) trae 6+. Considerar fallback genérico tipo `garments.length === N ? padCycle(N) : SLOT_CONFIGS[N]` para futuro-proof, o documentar que SLOT_CONFIGS se extiende manualmente cuando crece el dataset.
- **Tests requeridos al arreglar:**
  - `useOutfitState.test.ts` — caso `N=5` que asserta `slots.length === 5` y orden de garments.
  - Smoke test que abre Visualizer con `p346` y `p348` sin throw.
  - Cycle test: `cycleVariant` con prev.length === 5 invoca `cycleGarment(g, dir, 5)` — verificar que la rama `slotCount < 4` (UPPER_FULL) no se activa erróneamente para 5c (debería caer en `UPPER_LAYER` / `UPPER_TOP` separados como en 4c).
- **Scope estimado spec + dev:** 30-45 min con cualquiera de A/B (incluye test + on-device smoke en p346 y p348).
- **No requiere native rebuild** — pure JS/TSX.
- **Decisión de Alejandro 2026-04-25:** guardar para retomar después; NO bloquea v1.4.0 ship (severity high pero affecta 2/348 = 0.6% del catálogo, y los users pueden evitarlos hasta hot-fix v1.4.1).
