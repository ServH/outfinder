# Pricing Strategy — Outfinder

Estrategia de pricing y plan de migración. Documentado 2026-04-16.

---

## Estado actual

- **Modelo**: Free + lifetime IAP único
- **Precio lifetime**: ~$1.10 (developer proceeds tras Apple cut)
- **Conversion D1 (download → paid)**: 6.45%
- **Conversion D7**: 9.09%
- **Revenue por install**: ~$0.07
- **Total revenue acumulado** (20 días): $2.22 (2 compras)

---

## Diagnóstico del precio actual

### Por qué $1.10 es demasiado bajo

1. **Por debajo del threshold psicológico premium** del nicho wardrobe/styling apps. Compradores esperan pagar $5-10 por apps de este tipo.
2. **Dispara sospecha de calidad**: en categoría premium, precios muy bajos transmiten "es low effort" o "no se valora".
3. **Bloquea cualquier canal paid**: con $0.07 revenue/install, ningún ad channel es rentable. CAC mínimo paid en Lifestyle es $0.50-2.
4. **Subestima el valor real entregado**: cámara + Wada + offline + sin signup = ticket premium objetivo.

### Comparables del nicho

| App | Pricing | Modelo |
|---|---|---|
| Stylebook (líder, 10+ años) | $4.99 lifetime | Lifetime único |
| Smart Closet | $9.99 lifetime Pro / $4.99/mes | Híbrido |
| Cladwell | $9.99/mes | Subscription |
| Acloset | $9.99/mes | Subscription |
| GetWardrobe | $19.99/año | Subscription |
| Save Your Wardrobe | Subscription | Subscription |

**Conclusión**: $4.99 lifetime está en la franja **media-baja** del nicho. No es premium, es estándar.

---

## Diferenciadores que justifican premium

| Feature | Único vs competencia |
|---|---|
| Sanzo Wada (1933) — 348 combinaciones probadas | 🏆 Ningún competidor lo tiene |
| Escaneo de prenda con cámara (v1.3.0) | 🏆 Único en categoría |
| Offline-first | 🏆 Vs apps que requieren cuenta + cloud |
| Sin signup, sin email, sin ads | 🏆 Diferenciador de respeto al usuario |
| 5.0 ⭐ rating con 4 valoraciones | 🟢 Calidad percibida alta (escalar) |
| PPV → Install 41% | 🟢 La ficha vende premium narrative |

---

## Análisis matemático: subir a $4.99

### Punto de breakeven

```
Conversión mínima necesaria a $4.99 = (revenue/install actual) / nuevo precio
                                    = $0.071 / $4.99
                                    = 1.42%
```

**Caída de conversión necesaria para perder dinero: de 6.45% → 1.42% = 78% drop**

Elasticidad típica entre $1 y $5 en apps lifestyle: **30-50% caída**, no 78%.

### Escenarios proyectados

| Conversión D1 post-subida | Caída vs actual | Revenue/install | Multiplicador |
|---|---|---|---|
| 6.45% (sin elasticidad) | 0% | $0.32 | **4.5×** 🚀 |
| 5.0% | 22% | $0.25 | **3.5×** |
| 4.0% | 38% | $0.20 | **2.8×** |
| 3.0% | 53% | $0.15 | **2.1×** |
| 2.0% | 69% | $0.10 | **1.4×** |
| 1.42% | 78% | $0.07 | **1.0× (breakeven)** |

**Hasta el escenario más pesimista realista, sale 2× revenue/install.**

---

## Plan de migración (3 fases)

### Fase 1 — Subir lifetime a $4.99 (esta semana)

**Acción**:
- App Store Connect → Compras dentro de la app → `outfinder_premium_lifetime` → cambiar tier a $4.99 USD (Tier 5)
- Usuarios que ya pagaron $1.10 conservan acceso (es lifetime)
- Sin anuncio público; usuarios nuevos ven precio normal

**Riesgo**: bajísimo (math arriba)
**Tiempo**: 5 min, sin código
**KPI a vigilar 14 días**:
- Conversion D1 (objetivo: >2%)
- Revenue/install (objetivo: >$0.10 = 1.4× actual)
- Si conversion cae a <1.5% en 14 días → revisar paywall (probable problema de UX, no de precio)

**Pre-requisitos antes de tirar el cambio**:
- [ ] Revisar **paywall actual**: ¿cuándo aparece? ¿qué bloquea? ¿cómo presenta valor?
- [ ] Re-escribir copy del paywall con narrativa premium (ver sección abajo)
- [ ] Anotar baseline: conversion D1 actual = 6.45%, revenue/install = $0.071

### Fase 2 — Introducir subscription opcional (mes 2-3)

**Modelo paralelo (mantener lifetime)**:

- **Free** (lo que hoy es free):
  - Ver combinaciones Wada
  - Favoritos limitados (10)
  - Cámara hasta X usos (TBD: 3? 5?)

- **Outfinder Plus** (nuevo tier):
  - $2.99/mes con trial 7 días
  - $19.99/año (~$1.66/mes — ahorro 45%)
  - $39.99 lifetime (ancla premium)

- **Beneficios Plus**:
  - Cámara ilimitada
  - Favoritos ilimitados
  - (futuro) Armario virtual completo
  - Sin watermark en exports
  - Acceso anticipado a nuevas features

**A/B test con RevenueCat**:
- 50% nuevos usuarios ven solo lifetime $4.99
- 50% ven paywall con sub + lifetime
- Comparar LTV a 60 días

**Tiempo**: 2-4h setup RevenueCat + paywall variant
**Riesgo**: medio (UX paywall debe ser sólido para sostener trial conversion)

### Fase 3 — Decidir modelo definitivo (mes 4+)

**Si la sub gana en LTV**:
- Mantener trial 7 días + sub mensual/anual
- Subir lifetime a $49.99 (ancla psicológica que hace la sub anual parecer "ganga")
- Posible retiro del lifetime si churn de subs es bajo

**Si lifetime sigue ganando**:
- Mantener lifetime $4.99 (o iterar a $6.99)
- Retirar la sub option
- Foco en escalar volumen vs LTV

---

## Copy del paywall (recomendaciones para Fase 1)

### ❌ NO hacer (genérico, no vende)

> Premium · $4.99
> Acceso a todas las funciones

### ✅ SÍ hacer (storytelling premium)

**Título**:
> Outfinder Plus — para siempre

**Subtítulo**:
> $4.99 una sola vez. Sin suscripciones.

**Bullets de valor** (5 máximo, orden importa):
> ✓ 348 combinaciones probadas en Japón en 1933
> ✓ Escaneo de cualquier prenda con la cámara
> ✓ Tus colores favoritos guardados sin límite
> ✓ Sin conexión, sin cuenta, sin anuncios
> ✓ Acceso para siempre, sin renovaciones

**CTA**:
> Desbloquear para siempre

**Secondary CTA** (link discreto):
> Restaurar compra

### Lecciones de copy

- "Para siempre" repetido 2× refuerza ausencia de subscription fatigue
- Mención explícita de "1933" + "Japón" = storytelling diferenciador
- "Sin suscripciones" = anti-pattern hacia competencia (Cladwell, Acloset)
- Bullets en orden: feature mágica (cámara) → valor cuantificado (348) → libertad (sin signup)

---

## Métricas para revisar mensualmente

| KPI | Baseline (16 abr 26) | Target M1 | Target M3 |
|---|---|---|---|
| Conversion D1 | 6.45% (a $1.10) | >2% (a $4.99) | >3% |
| Conversion D7 | 9.09% | >3% | >4% |
| Revenue/install | $0.07 | $0.15+ | $0.30+ |
| LTV (60 días) | ~$0.07 | ~$0.20 | ~$0.50 |
| Refund rate | desconocido | <5% | <3% |
| Paid users/mes | 2 | 5+ | 20+ |

---

## Decisiones pendientes

- [ ] **Fecha exacta de cambio Fase 1** (recomendado: ASAP, esta semana)
- [ ] **Revisar copy actual del paywall** antes de subir precio
- [ ] **Decidir si Fase 2 incluye sub o solo iteración de lifetime** (revisar con datos de Fase 1 al día 30)
- [ ] **Localizar pricing por mercado** (Apple sugiere ajustes por paridad de poder adquisitivo — ej. MX, BR podrían ir a tier $3.99 local)

---

## Riesgos identificados

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Conversión cae más del 50% | Baja | Math demuestra que aún rentable a 60% caída |
| Reseñas negativas por subida | Muy baja | Cambio silencioso, usuarios actuales conservan acceso |
| Competencia baja precios | Muy baja | Stylebook lleva $4.99 desde hace 10 años, mercado estable |
| Paywall no convierte por UX | Media | Pre-requisito: revisar paywall antes de subir precio |
| Apple rechaza cambio | Cero | Es un cambio de tier, autorizado nativamente |

---

## Reversibilidad

Si los datos de 30 días muestran que el cambio fue malo:
- Volver a Tier 1 ($1.10) toma 5 minutos en App Store Connect
- Usuarios que pagaron $4.99 conservan acceso (es lifetime)
- Datos del experimento siguen siendo valiosos input para Fase 2
