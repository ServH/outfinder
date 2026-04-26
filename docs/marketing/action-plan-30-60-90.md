# Action Plan 30-60-90

Plan de tracción para Outfinder partiendo de baseline 16 abr 2026. Combina acciones gratis (tiempo bajo) y de pago (tiempo o dinero). Para detalle de canales paid ver [paid-and-time-channels.md](paid-and-time-channels.md).

---

## 🎯 Objetivos cuantificados

| KPI | Baseline (16 abr) | 30 días | 60 días | 90 días |
|---|---|---|---|---|
| Impresiones/día | 13 | 50 | 200 | 500 |
| Installs/día | 1.5 | 5 | 20 | 50 |
| Ratings totales | 4 | 15 | 50 | 150 |
| Revenue/mes | $2 | $10 | $50 | $300* |
| Mercados localizados | 2 (EN, ES) | 2 | 4 (+pt-BR, fr) | 5 (+it) |

*\*Asume que en mes 2-3 cambiamos pricing del lifetime $1 a $4.99 o sub $2.99/mes.*

---

## 📅 Días 0-30 — "Amplificar lo que ya funciona"

**Hipótesis**: el embudo medio funciona; con ASO bien hecho + analytics in-app + amplificación de v1.3.0, podemos 3× tráfico orgánico sin gastar.

### Esta semana (días 0-7)

| # | Acción | Coste | Owner | Status |
|---|---|---|---|---|
| 1 | Responder reseña usuario MX anunciando v1.3.0 | 5 min | Tú | ⏳ |
| 2 | Actualizar Promotional Text EN+ES (cámara) | 10 min | Tú | ⏳ |
| 3 | Validar keywords propuestos con AppTweak free | 30 min | Tú o yo | ⏳ |
| 4 | PR con metadata v1.3.1 | 30 min | Yo | ⏳ |
| 5 | Subir v1.3.1 con nueva metadata | 1h | Tú | ⏳ |
| 6 | Compartir launch v1.3.0 en tu red (twitter/dev.to si aplica) | 30 min | Tú | ⏳ |

### Semanas 2-4 (días 8-30)

| # | Acción | Coste | Owner | Status |
|---|---|---|---|---|
| 7 | Spec eventos PostHog (analytics in-app) | 1h spec + 4-6h impl | Yo + Tú | ⏳ |
| 8 | Setup Apple Search Ads Basic con $100-200 budget | 1h setup + presupuesto | Tú | ⏳ |
| 9 | 2-3 reels TikTok/IG demo cámara con narrativa Wada | 4h por reel | Tú | ⏳ |
| 10 | Localización inicial pt-BR de metadata (no IA only) | $50-100 traductor | Tú | ⏳ |
| 11 | Snapshot semanal de métricas (anotar en `data-snapshots.md`) | 5 min/sem | Tú | ⏳ |

**Salida esperada día 30**:
- ASO v1.3.1 publicado y midiendo
- PostHog instalado (≥3 eventos clave funcionando)
- ASA Basic activo con datos de 2 semanas
- pt-BR live
- 2-3 reels publicados

---

## 📅 Días 31-60 — "Diversificar canales y validar"

**Hipótesis**: con datos en mano de ASA + analytics + reels, sabemos qué canal escalar y qué keywords convierten. Localización amplía techno orgánico.

| # | Acción | Coste | Owner |
|---|---|---|---|
| 12 | Iterar keywords v1.3.2 con datos reales de search | 30 min | Yo |
| 13 | Localización fr-FR completa (ficha + screenshots) | $200-400 | Tú |
| 14 | Aumentar ASA Basic budget si CAC < $1 | $300-500/mes | Tú |
| 15 | 5-7 reels más TikTok/IG (serie "Wada combos") | tiempo | Tú |
| 16 | Submit a indie newsletters (Indie Hackers, Betalist, AppAdvice) | 4h | Tú |
| 17 | A/B test pricing con RevenueCat (lifetime $1 vs $4.99 vs sub $2.99/mes) | 2h setup | Yo + Tú |
| 18 | Outreach 5-10 micro-influencers moda (1k-50k followers) | 10h + $300-800 collabs | Tú |

**Salida esperada día 60**:
- 4 mercados localizados
- ASA escalando con CAC conocido
- Pricing experiment running con primeros datos
- 10+ reels publicados
- 1-2 features en newsletters indie

---

## 📅 Días 61-90 — "Empuje único y consolidación"

**Hipótesis**: con producto validado + canales con CAC conocido + pricing optimizado, hacer empuje grande de visibilidad (ProductHunt) tiene contexto y munición.

| # | Acción | Coste | Owner |
|---|---|---|---|
| 19 | Localización it (Italia) | $200-400 | Tú |
| 20 | ProductHunt launch preparado y ejecutado | 20h prep + día launch | Tú |
| 21 | Blog técnico Medium/dev.to ("Building a 1933 color theory app with Skia camera") | 6h | Tú |
| 22 | Reddit posts de valor en 5-7 subs (no spam) | 2h por post | Tú |
| 23 | Press outreach (TechCrunch indie, IndieAppsManiac, etc.) | 8h + $200 PR distro opcional | Tú |
| 24 | Decisión pricing definitivo basado en A/B | 1h analysis | Yo + Tú |

**Salida esperada día 90**:
- 5 mercados localizados
- ProductHunt launch ejecutado
- Pricing definitivo en lugar
- Canales con CAC y LTV conocidos → permite decidir si escalar paid mucho más

---

## 🚨 Reglas de freno (cuando parar y replanificar)

- Si día 14 (post v1.3.1) impresiones siguen <20/día → keyword hypothesis falló, **rehacer con AppTweak paid 1 mes ($69)**
- Si CAC en ASA Basic > $3 día 21 → **pausar ASA, revisar landing y ofertas**
- Si retention D7 < 15% (cuando tengamos PostHog datos día 30) → **freezar growth, foco en producto**
- Si pricing experiment no muestra mejora >2× LTV día 60 → **pivotar pricing model totalmente** (probar gating diferente)

---

## 🧮 Coste total estimado para 90 días

| Categoría | Mínimo | Recomendado | Agresivo |
|---|---|---|---|
| Apple Search Ads | $300 | $900 | $2.500 |
| Localización (3 idiomas) | $400 | $900 | $1.500 |
| Influencers/collabs | $0 | $500 | $2.000 |
| Tools (AppTweak, etc.) | $0 | $69 | $200 |
| PR distro / press | $0 | $0 | $500 |
| **TOTAL 90 días** | **$700** | **$2.370** | **$6.700** |

| Tiempo (tu tiempo) | Mínimo | Recomendado |
|---|---|---|
| Horas/semana | 4 | 8-10 |
| Total 90 días | 50h | 110h |

Ver [paid-and-time-channels.md](paid-and-time-channels.md) para desglose por canal.
