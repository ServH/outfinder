# Outfinder v2 — Strategy Brief

**Abierto:** 2026-04-23
**Estado:** Ideación / pre-decisión — NO es plan de ejecución todavía.
**Autor:** Alejandro (ideas originales) + asistente (captura + análisis crítico).
**Relación:** Desactiva por diseño BUG-009, BUG-010 y BUG-011 del bug log post-Epic 14 (`epic-14-post-release-bugs.md`).

---

## Propósito de este doc

Recoger fielmente dos bloques de ideas estratégicas para Outfinder v2.x, con análisis crítico posterior. No es PRD ni epic — es material para decidir si invertir y, si sí, qué priorizar.

Bloques:
1. **Paleta Objetivo + Creación Directa de Looks** (UX rethink del flow post-cámara)
2. **Retención + Monetización + Arquitectura Zero-Cost**

---

## Bloque 1 — Paleta Objetivo y Creación Directa de Looks

### 1.1 Problema que intenta resolver

- Choque visual entre fotorealismo de prendas (Epic 13 cutouts) y siluetas genéricas tintadas del Outfit Visualizer (Epic 12). Sensación de "pegote" / producto inacabado.
- El Visualizer actúa como "callejón sin salida": obliga al usuario a memorizar qué color iba en qué slot y recrearlo manualmente en su armario.

### 1.2 Propuesta

Cambiar el modelo de "3 slots rígidos (top/bottom/shoes)" a **"paleta de ingredientes"**:
- La combinación Wada deja de ser un maniquí que rellenar; pasa a ser una **lista de colores** que el usuario aplica a la ropa que quiera.
- **La categoría anatómica de la prenda manda sobre el orden del color en el combo.**

### 1.3 Flow propuesto (caso zapatos Carmín)

1. Foto a zapatos Carmín → recorte + detección color → usuario etiqueta "Zapatos".
2. App sugiere paletas Wada con Carmín → usuario elige `[Navy, Carmín, Mostaza]`.
3. Al confirmar combo, **se elimina el paso del Visualizer** y se aterriza directamente en la pantalla "Mi Look":
   - Zapatos Carmín auto-colocados en slot inferior (porque etiqueta = zapato).
   - **Paleta Objetivo (chip horizontal)** arriba: 3 círculos de color, el de Carmín con `✓`.
   - Slots Top y Bottom vacíos con botón `[+]`.
4. Usuario completa (cámara / armario) o deja a medias → auto-guardado en "En curso".

### 1.4 Beneficios reclamados

- Estética 100% premium (fotorealismo consistente, sin siluetas mixtas).
- Retención por **efecto puzzle**: "Paleta Objetivo" incompleta = urgencia natural para abrir la app en tiendas / revisando armario.
- Escala a combos de 2, 3 o 4 colores sin lógica especial.
- Menos clics, más acción: directo a "Modo Creador".

### 1.5 Puntos ciegos identificados

- **Conflación de dos entradas distintas:**
  - **Post-cámara** (tengo prenda real): el diseño encaja perfecto.
  - **Wada exploration** (browseo familias sin intención): si cada tap en combo = empezar un look en curso, "En curso" se llena de basura en minutos. El Visualizer cumplía la función de "*ver sin comprometer*".
- **Pérdida del preview pre-commit.** Hoy se puede explorar sin ensuciar.
- **Coste de marketing.** Los screenshots actuales del App Store muestran Visualizer. v2.0 = rehacer assets + ASO + vídeo promo.
- **Ejecución de Paleta Objetivo.** Los chips con `✓` son una idea que depende mucho de cómo se materialice — puede verse premium o gimmick.

### 1.6 Recomendación (asistente)

**Hybrid, no kill.** Aplicar Paleta Objetivo **solo al flow post-cámara** en primera iteración. Mantener Visualizer (o preview abstracto ligero) en el flow **Wada exploration** hasta validar que nadie lo echa de menos.

---

## Bloque 2 — Retención, Monetización, Arquitectura Zero-Cost

### 2.1 Principio arquitectónico: Zero-Cost (Backend-Free)

Invariante: **0,00€ de coste de servidor**. Todo procesamiento en dispositivo.

| Capa | Tech |
|------|------|
| Storage & lógica | Zustand + AsyncStorage / MMKV |
| Imagen | Módulo Swift + APIs nativas iOS (Vision) |
| IA visual | CoreML (ej. MobileNetV2) para clasificar prendas + Vision para rostros/tonos de piel |
| Rendering | React Native Skia |
| Clima | WeatherKit (500k llamadas/mes gratis con cuenta Apple Dev) |
| Notificaciones | Local Notifications programadas (sin push servers) |

### 2.2 Motor de retención (features gratuitas)

#### 2.2.1 Sugerencia matutina por clima — "El Hábito"
- App cruza silenciosamente looks "Terminados" con previsión WeatherKit.
- Notificación local automática 7:30 AM: *"Hoy 14ºC y llueve 🌧️. Tu look Abrigo Navy + Botas Carmín es perfecto para hoy."*

#### 2.2.2 Efecto Zeigarnik + Lista de Deseos — "El Gancho Psicológico"
- Potenciar la Paleta Objetivo (Bloque 1): colores pendientes visibles = recordatorio pasivo.
- App se convierte en compañero de compras: abrir en tienda para recordar qué falta.

#### 2.2.3 Outfinder Wrapped — "Píldoras locales"
- Métricas derivadas localmente del inventario: *"Tu color más usado es Negro (45%)"*, *"3 prendas llevan 3 meses sin usarse"*.

### 2.3 Estrategia de monetización (Outfinder Pro)

Principio: features que **ahorran tiempo** o **reducen estrés** justifican paywall premium.

#### 2.3.1 Botón Mágico (Auto-completar Look) 🌟
- Algoritmo combinatorio local sobre `misLooksStore` que rellena slots vacíos de la Paleta Objetivo con prendas del armario que matchean color.
- **Keystone de monetización** — sin esto, lo Pro no tiene gancho real.

#### 2.3.2 Asistente de Viaje (Cápsula Inteligente) 🧳
- Usuario indica `N días de viaje` → app calcula grupo mínimo de prendas combinables que generan looks suficientes.
- High-anxiety use case = buena disposición a pagar.

#### 2.3.3 Análisis de Colorimetría Personal (Estaciones) 🎨
- Selfie frontal → Vision extrae subtono piel/ojos → asigna "Estación" (ej. Invierno Oscuro).
- Filtra/prioriza armonías Wada que favorecen al usuario.

### 2.4 Copywriting / posicionamiento

Usar **"Privacy-First"** como argumento central de paywall:

> **🛡️ Tu Armario es Privado y 100% Seguro**
>
> A diferencia de otras apps que suben tus fotos a servidores externos para entrenar sus IAs, Outfinder procesa toda la Inteligencia Artificial directamente en el chip de tu móvil. Ninguna foto de tu ropa ni de tu rostro abandona jamás tu dispositivo. La moda es tuya, tus datos también. (Funciona incluso en Modo Avión ✈️).

### 2.5 Roadmap propuesto (por Alejandro)

| Plazo | Hito |
|-------|------|
| Corto | **v1.4.0** — paywall básico (límite prendas Epic 14) para empezar a monetizar ya |
| Medio | **v2.0** — Paleta Objetivo + rediseño Visualizer vs Ficha Wada |
| Largo | **v2.x** — 1–2 features mágicas (Botón Mágico o Clima) para subir precio / introducir suscripción anual |

---

## Análisis crítico (asistente)

### Lo que es sólido

- **Backend-free como moat competitivo.** Casi todas las apps de moda suben fotos. "Privacy-first" no es greenwashing aquí — es literalmente la arquitectura. Esto es un diferenciador real que App Store y prensa tech pueden amplificar.
- **WeatherKit + Local Notifications** para la sugerencia matutina: arquitectura elegante, cero coste. Está muy bien pensado.
- **Zeigarnik + Paleta Objetivo** se refuerzan mutuamente. No son dos features, son una sola decisión de diseño con dos caras.
- **Botón Mágico** es exactamente la feature que justifica paid tier: alto valor percibido, zero infra cost. **Es la keystone** — sin esto el paywall de v2 es débil.
- **Cápsula de viaje** ataca un momento de ansiedad muy específico. Buena disposición a pagar para resolverlo.

### Puntos a pressure-test antes de construir

- **CoreML para clasificar prendas (MobileNetV2):** pre-entrenado con ImageNet NO separa limpio t-shirt vs. sweater vs. blouse. Necesita **fine-tuning con dataset de moda** (DeepFashion, Fashion-MNIST derivados) o transfer learning. No es zero-effort. Estimar coste real antes de vender "la app detecta el tipo de prenda sola".
- **Colorimetría estacional** es una tendencia TikTok *ahora*, pero el framework de las 12 estaciones es pseudo-científico y contestado. Riesgo de aging badly y de claims exagerados. Si se hace: (a) no prometer precisión, (b) enmarcarlo como *"sugerencia / juego"* no como *"análisis experto"*, (c) cuidar el copy en App Store para no prometer medical-grade.
- **Weather push**: para reaccionar al clima *del día actual*, una Local Notification programada la noche anterior no vale — el pronóstico puede cambiar. Requiere `BGTaskScheduler` (iOS background task) para despertar la app al amanecer, consultar WeatherKit, elegir look y disparar la local notif. Arquitectura resuelta pero **no trivial**. No es plug-and-play.
- **Privacy-first copy en App Store**: claim literal que Apple revisa. Hay que verificar que RevenueCat (ya integrado), Sentry (si se usa), o cualquier SDK tercero NO exfiltra data identificable. Tu memoria `feedback_no_analytics` ayuda aquí — no tienes SDKs de métricas. Pero hay que auditarlo explícitamente antes de usar ese copy.
- **Paywall v1.4.0 débil**: el paywall actual es límite de prendas (FREE_WARDROBE_LIMIT = 10 según `project_epic13_decisions`). Es un gate funcional aceptable pero no un pitch emocional. La **conversión real** va a llegar con el Botón Mágico y la Cápsula, no con "necesito más slots". Mi consejo: **no tomes los números de v1.4.0 como señal de willingness-to-pay**. Trátalo como "ship lo que está listo" y reserva el juicio de monetización para cuando salga el Botón Mágico.

### Sobre el sequencing

La propuesta es v1.4.0 → v2.0 (Paleta) → v2.x (magic features). Yo añadiría un matiz:

> **v2.0 = Paleta Objetivo + Botón Mágico** (juntos, como un chapter coherente).
>
> El Botón Mágico es el que convierte la Paleta Objetivo de idea elegante en feature con valor pagable. Separarlos en v2.0 / v2.x desinfla v2.0 de pitch y hace que v2.x tenga que sostenerse solo. Mejor bundle.

Features puras de retención (Weather, Wrapped) se pueden ship en v2.1 — son sencillas y no dependen de decisiones arquitectónicas nuevas.

### Lo que NO está en este doc y debería estar antes de comprometerse

1. **Decisión sobre Wada exploration flow** — ¿qué pasa con el Visualizer ahí? Sin esta respuesta, v2.0 tiene un agujero.
2. **Modelo de datos de "complemento"** (BUG-011) — gafas, bufandas, joyería. ¿Caben en la Paleta Objetivo? ¿Cómo?
3. **Plan de migración de usuarios existentes de v1.x a v2.0** — ¿cómo se ven sus looks antiguos hechos en Visualizer? ¿Se re-renderizan en nuevo modelo o se preservan?
4. **Precio de Pro** y estructura (mensual / anual / lifetime) — no tratado.
5. **Métricas de éxito (qualitative)** — tu memoria dice no-analytics. Entonces, ¿cómo se sabe que v2.0 funciona? Feedback de 5–10 usuarios testeadores antes de ship wide es lo mínimo viable.

---

## Próximos pasos sugeridos (no comprometidos)

1. **Decidir Bloque 1 (Paleta Objetivo): hybrid vs. full kill del Visualizer.** Esto es la decisión-madre.
2. **Si sí → product brief formal de v2.0** (usar `bmad-product-brief` en sesión dedicada, con Pencil para UX).
3. **Spike técnico de CoreML garment classifier** — 2–3 días de investigación antes de prometer "detecta el tipo sola". Ver si es viable en iPhone 14+ a latencia decente.
4. **Auditoría privacy-first** — listar todo SDK/librería y verificar que ninguno exfiltra data, para poder usar el copy con seguridad.
5. **Mantener v1.4.0 en su carril** — no contaminarlo con visión v2.0. Lo que está listo, se ship.

---

*Este doc es material vivo. Editar al aparecer nueva información. Cuando una decisión se fije, mover a epic doc o PRD.*
