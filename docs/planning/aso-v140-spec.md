# ASO v1.4.0 — App Store Visual Spec

**Fecha:** 2026-04-26
**Owner:** Sally (UX) + Alejandro
**Estado:** Spec en redacción. Capturas pendientes (Alejandro las hace al final del polish v1.4). Pencil canvas en `docs/img_screenshot/appstore.pen` con placeholders del nuevo arco narrativo.
**Decisión-madre confirmada:** Camera-first narrative · A/B de wrappers en Pencil · Icono después de capturas.

---

## 1. Diagnóstico de partida

Las 7 capturas v1.3 actuales (`docs/img_screenshot/appstore/`) están bien crafteadas pero **no representan v1.4**. Faltan los 3 features clave de Epic 13/14: Armario Virtual, Mis Looks como workspace, y la sugerencia de armonía. Además `appstore-es/` contiene los mismos PNGs en inglés — pérdida directa de conversión en App Store ES.

### Features v1.4 que deben aparecer en las nuevas capturas

| Feature | Origen | Prioridad ASO |
|---|---|---|
| S4 Tu Look (Skia composition con prendas reales) | Epic 13 | ⭐⭐⭐ Hero |
| Cámara unificada con cutout + tono Wada detectado | Epic 14 | ⭐⭐⭐ Hero |
| Armario Virtual (grid con cutouts) | Epic 13 | ⭐⭐⭐ Hero |
| Mis Looks como workspace + badges incompletos | Epic 14 | ⭐⭐ Soporte |
| Sugerencia de armonía S5 | Epic 13 | ⭐⭐ Soporte |
| Combinations curated (mantener) | Epic 1 | ⭐ Refuerzo |
| Visualizer relegado | Epic 14 | ⭐ Cierre |

### Features que NO van en capturas
- Onboarding / coach marks (Epic 15) — meta del feature, no demostrable visualmente.
- Localización ES — se demuestra subiendo la versión ES del set entero, no como captura aparte.
- iPad — set propio con 3 capturas mínimo (1, 2, 3 del set iPhone).

---

## 2. Arco narrativo (camera-first, decisión confirmada)

### Orden definitivo del set iPhone (7 capturas)

| # | Surface real | Frame .pen | Mensaje núcleo |
|---|---|---|---|
| 1 | S4 Tu Look | `U7Zf7` | El payoff visual: outfit completo con prendas tuyas reales |
| 2 | Camera result + cutout + Wada tone | `l0QPx` | El gesto mágico: foto → tono Wada detectado |
| 3 | Armario Virtual grid | NEW (a crear) | La promesa de utilidad: tus prendas reales, color-coded |
| 4 | Mis Looks workspace | `L9Jf0` | La razón de volver mañana: looks en progreso, no archivo muerto |
| 5 | Combinations curated | `oO79j` | La autoridad: 348 combos de 100 años de teoría del color |
| 6 | Sugerencia armonía S5 | NEW (a crear) | La inteligencia: te dice qué falta |
| 7 | Visualizer relegado | NEW (a crear) | El cierre lúdico: pruébalo antes de ponértelo |

Frames retirados (movidos a `y=3200` en el .pen): Home v1.3, Color Pairs v1.3, Curated v1.3 — quedan archivados sin destruir histórico.

---

## 3. Copy A/B — 2 carriles paralelos

Producimos **2 variantes completas** del set en Pencil. No A/B testing en App Store (Apple no lo soporta nativamente para captures); el A/B es para **decidir nosotros visualmente** cuál sube.

### Carril A — Editorial actual (refresh del v1.3)

Mantiene el lenguaje de la app: serif blanco sobre fondo dark brown, copy largo, tono editorial pausado. Solo refrescamos copy y captura.

#### EN

| # | Kicker | Headline | Sub-headline |
|---|---|---|---|
| 1 | OUTFINDER | **Your clothes, color-matched.** | Built from a 100-year-old colour bible. |
| 2 | OUTFINDER | **Point. Shoot. It's Wada.** | Every garment, mapped to a colour name. |
| 3 | OUTFINDER | **Your wardrobe, color-coded.** | Real clothes. Real cutouts. No silhouettes. |
| 4 | OUTFINDER | **Looks in progress, not just saved.** | Pick up where yesterday left off. |
| 5 | OUTFINDER | **348 combos. Zero algorithms.** | Sanzo Wada's century-old theory, curated. |
| 6 | OUTFINDER | **It tells you what's missing.** | The colour you don't yet own. |
| 7 | OUTFINDER | **Try it before you wear it.** | A dressing room in your pocket. |

#### ES (escrito en ES, no traducido)

| # | Kicker | Headline | Sub-headline |
|---|---|---|---|
| 1 | OUTFINDER | **Tu ropa, en colores que casan.** | Basado en la biblia del color de Sanzo Wada. |
| 2 | OUTFINDER | **Apunta, dispara, descubre.** | Cada prenda, con su nombre de color real. |
| 3 | OUTFINDER | **Tu armario, ordenado por color.** | Prendas reales, recortadas. Sin siluetas genéricas. |
| 4 | OUTFINDER | **Looks a medias, no archivos muertos.** | Sigue donde lo dejaste ayer. |
| 5 | OUTFINDER | **348 combos. Cero algoritmo.** | Cien años de teoría del color, curados. |
| 6 | OUTFINDER | **Te dice qué te falta.** | El color que aún no tienes. |
| 7 | OUTFINDER | **Pruébalo antes de ponértelo.** | Un probador en tu bolsillo. |

### Carril B — Conversión (más directo, contraste alto)

Headline más corto + bullet utilitario + accent Wada por captura. Fondo crema (`#F5EFE6`) en lugar de dark, con tinte Wada por captura. Apuesta a comunicar utilidad en <2s.

#### EN

| # | Headline (≤4 palabras) | Bullet | Accent Wada |
|---|---|---|---|
| 1 | **Build the look.** | Your real clothes. Real cutouts. | Mouse Gray |
| 2 | **Scan any colour.** | iOS Vision finds the Wada tone. | Carmine |
| 3 | **Wardrobe, sorted.** | One photo per garment. | Iron Navy |
| 4 | **Pick up where you left off.** | 1/3 garments? Tomorrow's reminder. | Madder |
| 5 | **348 curated combos.** | Sanzo Wada · 1933. | Old Temple Wall |
| 6 | **What's missing?** | The colour you don't own yet. | Rapeseed Field |
| 7 | **Pre-wear preview.** | A dressing room in your pocket. | Smoked Bamboo |

#### ES

| # | Headline (≤4 palabras) | Bullet | Accent Wada |
|---|---|---|---|
| 1 | **Monta el look.** | Tus prendas. Recortes reales. | Mouse Gray |
| 2 | **Escanea cualquier color.** | Vision detecta el tono Wada. | Carmín |
| 3 | **Tu armario, ordenado.** | Una foto por prenda. | Iron Navy |
| 4 | **Sigue donde lo dejaste.** | ¿1/3 prendas? Mañana lo retomas. | Madder |
| 5 | **348 combos curados.** | Sanzo Wada · 1933. | Old Temple Wall |
| 6 | **¿Qué te falta?** | El color que aún no tienes. | Rapeseed |
| 7 | **Probador en bolsillo.** | Pruébalo antes de ponértelo. | Smoked Bamboo |

---

## 4. Sistema visual — Wrapper A vs B

### Carril A — Editorial (continuidad v1.3)

| Token | Valor |
|---|---|
| Fondo | `#1A1410` (dark brown actual) |
| Kicker text | `#A89580` (warm tan), letter-spacing 0.2em, uppercase, 28px serif |
| Underline kicker | 132×3px `#A89580` |
| Headline | Noto Serif JP 96px, line-height 1.05, fill `#F5EFE6` |
| Sub-headline | Noto Serif JP italic 32px, fill `#A89580` |
| Mock device | 988×2140 con border-radius 60px, sombra suave warm |
| Bottom fade | gradient `#1A1410` → transparent, 328px |

Ajustes vs v1.3:
- Acortar headline máximo a **3 líneas** (algunas v1.3 tienen 4 → menos legibles a thumbnail)
- Sub-headline en 1 línea siempre

### Carril B — Conversión (ruptura)

| Token | Valor |
|---|---|
| Fondo | `#F5EFE6` (paper cream) con overlay 8% del Wada accent de la captura |
| Headline | Noto Serif JP **bold** 120px, line-height 0.95, fill `#1A1410` |
| Bullet | SF Pro Text Medium 36px, fill `#1A1410` opacity 0.65 |
| Wada accent chip | Pill 280×72 con fill = color Wada exacto + texto del nombre del color en ES/EN según locale, posicionado top-right del headline |
| Mock device | Mismo 988×2140 pero con sombra **más fuerte** y tilt 2° (firma visual del carril B) |
| Bottom safe area | Fade crema → transparent |

Ajustes vs A:
- B usa contraste invertido (texto oscuro sobre crema)
- B introduce el chip Wada como elemento de identidad, A lo omite
- B fuerza headlines de 1-2 palabras (escaneable a thumbnail)

---

## 5. Spec iPad (post-decisión, después de iPhone)

3 capturas mínimo replicando #1, #2, #3. Apple ahora pide formato 2048×2732 (iPad 12.9").
Wrapper se mantiene del carril ganador, headline misma copia, mock device escalado a iPad.

---

## 6. Icono v2 — 3 direcciones a explorar (post-capturas)

### Dirección A — Wada minimal
2 swatches solapados (rojo Carmín + azul Iron Navy) sobre crema. Simplifica de 3 a 2 elementos del icono actual.
- **Pro:** Continuidad del icono actual, mejor legibilidad a 60×60.
- **Contra:** Sigue siendo abstracto, no comunica "ropa".

### Dirección B — Prenda + color
Silueta de camiseta o percha minimal con un swatch de color saliendo (gota? bandera?).
- **Pro:** Comunica "ropa + color" inmediatamente.
- **Contra:** Riesgo de parecer app de retail genérico.

### Dirección C — Editorial tipográfico
Una "O" mayúscula serif construida con bandas concéntricas de colores Wada.
- **Pro:** Premium, distintivo, carga ADN editorial.
- **Contra:** A 60×60 puede parecer ilegible / genérico.

### Test obligatorio antes de elegir
Mock del icono final junto a competidores en grid App Store: **Cladwell · Whering · Smart Closet · Stylebook**. ¿Se distingue a 60×60? ¿Comunica algo en <0.5s?

---

## 7. Producción — secuencia de trabajo

### Hecho ✅
- Mapeo del .pen actual (7 frames).
- Decisiones-madre cerradas (camera-first, A/B, icono al final).
- Spec de copy A+B en EN+ES (este doc).

### Bloqueado por Pencil 🟡
- Reorganización del canvas (operaciones ya redactadas, esperando que `appstore.pen` sea editor activo).

### Bloqueado por capturas 🟡
- Capturas v1.4 frescas (Alejandro las hace al cerrar polish v1.4).

### Pendiente 🔴
- Carril A: aplicar copy nuevo + estilo editorial v1.3 a los 7 frames.
- Carril B: duplicar 7 frames a `y=2978`, aplicar wrapper crema + tilt + chip Wada.
- Versión ES: tema de Pencil con `device:phone, locale:es`.
- iPad: set 3 capturas tras decidir A vs B.
- Icono v2: 3 direcciones, test grid competidores, decisión.
- Export final: PNG `1320×2868` (iPhone 17 Pro Max) → ASC.

---

## 8. Checklist pre-submit ASC

Cuando todo esté listo:

- [ ] 7 capturas EN iPhone 17 Pro Max @ 1320×2868
- [ ] 7 capturas ES iPhone 17 Pro Max @ 1320×2868
- [ ] 3 capturas EN iPad 12.9" @ 2048×2732
- [ ] 3 capturas ES iPad 12.9" @ 2048×2732
- [ ] Icono 1024×1024 PNG sin alpha
- [ ] AppIcon.appiconset regenerado (todas las resoluciones)
- [ ] Splash screen icon coherente con icono final
- [ ] Subtítulo App Store ≤30 chars EN+ES alineado al headline #1 del carril ganador
- [ ] Keywords ASO revisadas vs nuevo enfoque (si carril B gana, "wardrobe", "color-matching", "outfit" suben prioridad)

---

## 9. Riesgos y notas

- **Riesgo principal:** capturas v1.4 muestran datos del simulador que pueden parecer "demo-y" (prendas de stock, looks vacíos). Mitigación: dataset cuidado antes de capturar (ver checklist en respuesta de Sally).
- **Decisión pendiente A vs B:** se toma viendo los 14 frames montados en Pencil al final, no antes.
- **Riesgo legal:** carril A menciona "100-year-old colour bible" y "Sanzo Wada · 1933" — verificar que no infringe ningún copyright (la obra es 1933, dominio público en la mayoría de jurisdicciones, pero confirmar con el texto exacto que aparece dentro de la app).
- **Coherencia con `project_release_tracking`:** ASO v1.3 tenía tono gen-Z "Scan. Style. Done." — ese ADN se preserva en carril B headlines (≤4 palabras) y se relaja en A (más editorial). Decisión final del carril determina si ASO subtítulo se mantiene o evoluciona.

---

**Siguiente acción de Sally:** ejecutar batch_design en Pencil cuando Alejandro active `appstore.pen`. Después, populate carril A con copy de tabla §3, duplicar a y=2978 para carril B, aplicar tokens §4.

---

## 10. Estado final (sesión 2026-04-28) ✅ CERRADO

> Esta sección documenta lo que **realmente se construyó** y se cerró durante la sesión de marketing del 28-abr-2026 (commits `049ffb8` → `cc07129` en `epic-15`). Reemplaza las decisiones y copy de §3 cuando difieran.

### 10.1 Decisiones cerradas

- **Carril ganador**: **B (cream BG + chip Wada + headline punch)** sube a App Store Connect. Carril A (editorial dark) **archivado** en el `.pen` como backup para v1.5+.
- **Audiencia**: target joven, voz punch directo (no editorial pausado).
- **ES nativo**: el copy ES se reescribió de cero, **no traducido** literal del EN. Cada slot tiene voz propia en castellano.
- **Visual narrative arc**: 8 slots (no 7 como el spec original) tras realizar que Camera Scan + Camera Result son tecnología clave de v1.4 que merecen frames separados.

### 10.2 Copy final por slot — Carril B (lo que sube a ASC)

| # | Slot | EN headline | EN bullet | ES headline | ES bullet |
|---|---|---|---|---|---|
| 1 | Tu Look | **Your style. Yours.** | Your wardrobe. Your call. Share away. | **Tu estilo. Tuyo de verdad.** | Tu ropa, tus ideas, tu look. |
| 2 | Camera Scan | **One tap. Real colour name.** | No typing. No tags. | **Una foto. Su tono real.** | Sin escribir nada. |
| 3 | Camera Result | **From photo to 7 outfits.** | Background out. Wada tone in. | **De foto a 7 outfits.** | Sin fondo. Con tono Wada. |
| 4 | Armario picker | **Your closet, in your pocket.** | Real garments. Real cutouts. | **Tu armario, en tu bolsillo.** | Recortes reales. Sin siluetas. |
| 5 | Mis Looks | **Always cooking.** | Looks you're still building. | **Tus looks, siempre en marcha.** | Sigue donde lo dejaste. |
| 6 | Combinations | **348 combos. Hand-picked.** | By Sanzo Wada. In 1933. | **Escogidos a mano. Desde 1933.** | Sanzo Wada · 348 combos. |
| 7 | Sugerencia | **Knows what to add.** | The colour your wardrobe asks for. | **Sabe qué falta.** | El color que tu armario pide. |
| 8 | Visualizer | **Vibe check first.** | Then make it yours. | **Prueba primero.** | Y hazlo tuyo después. |

**Notas tipográficas Carril B**:
- Headlines en Playfair Display 200pt por defecto, **160pt** para los que pasan de 2 líneas (#2, #4 EN; #1 #2 #4 #6 ES) para evitar overlap con sub-headline.
- Sub-headlines en Inter Medium 42pt opacity 0.65.
- Chips Wada en Inter SemiBold 34pt + bg color del Wada accent del slot.

### 10.3 Sistema visual cerrado — Carril B

| # | Chip Wada | Chip BG | Frame BG (cream + 8% accent) |
|---|---|---|---|
| 1 | Mouse Gray | `#9A9692` | `#EFEDEC` cream-grey |
| 2 | Carmine | `#9D2933` | `#F5E8E5` cream-pink |
| 3 | Gray | `#787870` | `#ECEEEC` cream-grey (cool) |
| 4 | Iron Navy | `#243140` | `#E8ECF1` cream-blue |
| 5 | Madder | `#A52E2C` | `#F0E2D6` warm rose-beige (rompe twin con #2) |
| 6 | Old Temple Wall | `#7E6F48` | `#F1EDE0` cream-olive |
| 7 | Rapeseed | `#C9B95A` | `#F4F0DA` cream-yellow |
| 8 | Smoked Bamboo | `#5B4F3A` | `#EFEAE0` cream-beige |

Journey cromático del set (slide rhythm en App Store): cool grey → pink → cool grey → blue → warm rose → olive → yellow → beige.

### 10.4 Icono v2 — V16 final

- **Concepto**: BG sólido **Carmine `#9D2933`** + serif Playfair Display capital "**O**" en cream `#FAFAF8`.
- **Razón**: convención iOS app icon (LinkedIn/Pinterest/Lyft style — color bg + mark cream encima). Diferencia totalmente de Opera browser (que tiene cream bg + O carmín — figura/fondo invertido).
- **A 60×60**: máximo contraste, lectura instantánea. Testado mentalmente vs Cladwell/Whering/Smart Closet/Stylebook — wedge claro (todos competidores usan siluetas figurativas).
- **Coherencia con set**: la O en Playfair Display amarra el icono a las headlines del Carril B (mismo typeface).

**Ubicaciones del icono (commit `cc07129`)**:
- `docs/img_screenshot/icon/outfinder-v140-icon.png` — fuente canónica archive
- `assets/images/icon.png` — Expo source (regenera AppIcon.appiconset al build)
- `ios/Outfinder/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` — baked actual (gitignored, regenera con `expo prebuild`)

### 10.5 Exports finales

**16 PNGs a 1320×2868 (iPhone 17 Pro Max)** exportados manualmente desde Pencil (la herramienta `mcp__pencil__export_nodes` está rota, devuelve error -32603):

- `docs/img_screenshot/appstore/new_v140/exports/appstoreEN/v1.4 B-#1..8 — *.png` (8 EN)
- `docs/img_screenshot/appstore/new_v140/exports/appstoreES/v1.4 ES B-#1..8 — *.png` (8 ES)

**Subir a ASC**: estos 16 reemplazan los 7 EN + 7 ES de v1.3.

### 10.6 Checklist pre-submit revisada

- [x] 8 capturas EN iPhone 17 Pro Max @ 1320×2868 — exportadas
- [x] 8 capturas ES iPhone 17 Pro Max @ 1320×2868 — exportadas
- [ ] iPad set 3 capturas — **fuera de scope v1.4.0** (ver §5)
- [x] Icono 1024×1024 PNG sin alpha — V16 instalado en 3 ubicaciones
- [ ] AppIcon.appiconset regenerado — **pendiente `npx expo prebuild --clean ios`** antes de EAS Build
- [ ] Splash screen icon — verificar coherencia con icono final V16
- [ ] **Subtítulo ASC**: actualizar de v1.3 `Scan. Style. Done.` / `Escanea. Combina. Listo.` a algo alineado con #1 del carril ganador (`Your style. Yours.` / `Tu estilo. Tuyo de verdad.`) o con headline más punch del set
- [ ] **Keywords ASO**: revisar — ahora "wardrobe", "outfit", "color-matching", "drafts", "looks-in-progress" suben prioridad. Ver `docs/planning/aso-v140-handoff-keywords.md` para el handoff al agente ASO.

### 10.7 Frame IDs en `appstore.pen` (referencia para futuro)

**Carril B EN (final)**: qg6hW (#1), xKRK0 (#2), 1CiWA (#3), Jc0VD (#4), 7renU (#5), gMdmx (#6), nkZaF (#7), 9gmA1 (#8).
**Carril B ES (final)**: UFXPi (#1), ithmd (#2), u0Otok (#3), hCkcQ (#4), whAEt (#5), xDFDq (#6), a22cRu (#7), u3DSf (#8).

**Carril A EN (archivado)**: U7Zf7, l0QPx, E3nCO, pYVpY, L9Jf0, oO79j, sLAEM, o0XTV.
**Carril A ES (archivado)**: KT6Ki, B0eR4, ejwRd, S1sSox, nEQrp, PeNxx, wsgqo, UMQjJ.

### 10.8 Iteración icónica (archivada en `.pen`)

Secciones de exploración del icono parqueadas en el canvas:
- `(-9064, 15956)` — primera tanda (V1 Wada minimal · V2 Prenda+color · V3 Editorial tipográfico)
- `(-9064, 18156)` — iteración mosaico-O (basada en propuesta de Alejandro)
- `(-9064, 20356)` — pivot O sin mosaico (V4–V7)
- `(-9064, 22555)` — refinamiento V4 (V8–V11)
- `(-9064, 24754)` — pivot tipográfico (V12–V14, V14 quasi-final)
- `(-9064, 26954)` — bg invertido LinkedIn-style (V15–V17, **V16 ganador**)

