# Análisis baseline — 2026-04-16

Diagnóstico completo del estado de Outfinder a 20 días del lanzamiento, antes de empezar acciones de growth conscientes.

## Contexto temporal

| Fecha | Evento |
|---|---|
| 12 mar 2026 | Initial commit del proyecto |
| 27 mar 2026 | v1.0.1 — primer release público |
| 28 mar 2026 | v1.0.2 — affordances visualizer |
| 15 abr 2026 | v1.3.0 submitted (Color Capture / cámara) |
| 16 abr 2026 | v1.3.0 aprobada por Apple (~11h UTC) |

**La app tiene 20 días de vida en App Store y cero marketing intencional.**

## Embudo (últimos 30 días, 16 mar – 15 abr)

```
397 impresiones (visibilidad ficha)
   ↓ 18.4%   [bench: 15-25%   ✅ sano]
73 product page views
   ↓ 41%     [bench: 25-35%   🏆 excelente]
30 first-time downloads
   ↓ 6.45% D1 / 9.09% D7   [bench freemium: 3-7%   ✅]
2 paid conversions × $1.10 lifetime
= $2.22 revenue
```

### Lectura

- **Cuello de botella**: impresiones (~13/día). Es el ÚNICO problema real, todo lo demás funciona mejor que benchmark.
- **Ficha**: vende muy bien. El icon, screenshots, descripción y nombre convierten el 41% de los visitantes en downloads.
- **Producto**: las 5.0 ⭐ y 3 reseñas positivas confirman match producto-mercado en escala micro.
- **Pricing**: lifetime a $1.10 limita el LTV brutalmente. Tema de Mes 2.

## Sources de tráfico (28 mar – 14 abr, primera vez con datos suficientes)

| Source | Downloads | % | Lectura |
|---|---|---|---|
| 🔍 App Store Search | 24 | 77% | **El motor orgánico es ASO** |
| 🌐 Web Referrer | 5 | 16% | Probablemente repo público en GitHub o algún post |
| 📱 App Store Browse | 1 | 3% | Sin Today/Stories featuring |
| 🔗 App Referrer | 1 | 3% | Tráfico desde otras apps |
| 🏢 Compra institucional | 0 | 0% | N/A para indie |

**Implicación**: invertir en ASO multiplica directamente el 77% del tráfico actual. Cualquier otro canal (TikTok, Reddit, web) es nuevo y aditivo.

## Distribución geográfica (30 días)

Top 5 territorios por descargas:
1. España
2. Estados Unidos
3. Canadá
4. Francia
5. Azerbaiyán

Devices: 97% iPhone, 2.9% iPad → ignorar iPad para optimizaciones.

**Implicaciones de localización**:
- Mercado principal hispano (ES + spillover en MX/US/CA con población hispana)
- Francia presente sin localización francesa → potencial para añadir fr-FR
- Brasil ausente pero mercado enorme con afinidad cultural → añadir pt-BR
- Italia idem → añadir it

## Voz del usuario (reseñas escritas)

| Fecha | Usuario | Mercado | Mensaje | Insight |
|---|---|---|---|---|
| 14 abr | tarregang | España | "Muy intuitiva y gran herramienta" | Validación UX |
| 11 abr | ErnestoVLC88 | España | "Resuelve bien mis dudas a la hora de vestir" | Validación job-to-be-done |
| 11 abr | Foto shot | México | "Recomendaría que le agregaras tomar foto de la prenda y te dé las variantes de color" | 🎯 **Pidió la feature de v1.3.0 antes de saber que existía** |

**Implicación**: la reseña de "Foto shot" es marketing gratuito. Responder anunciando que v1.3.0 ya entrega eso = social proof público de developer-listening.

## Lo que NO sabemos (gaps de instrumentación)

- ❓ Qué hacen los usuarios dentro de la app (no hay analytics in-app)
- ❓ Cuántos llegan al paywall vs cuántos se quedan en home
- ❓ Cuántos usan la cámara (recién lanzada) vs el visualizador clásico
- ❓ Retention D1/D7/D28 (Apple no muestra por falta de masa crítica con opt-in)
- ❓ Qué keywords concretos rankea ahora (necesita herramienta ASO externa)

**Acción derivada**: PostHog en Mes 1, AppTweak/SensorTower (al menos free tier) esta semana.

## Benchmarks comparativos

Apps Lifestyle indie sin marketing en primeros 30 días suelen mostrar:

| Métrica | Tu app | Benchmark típico | Veredicto |
|---|---|---|---|
| Installs/día | 1.5 | 0.5-3 | ✅ Sano |
| Conversion PPV→Install | 41% | 25-35% | 🏆 Top decile |
| % Search del total | 77% | 50-70% | 🏆 Bien indexado |
| Ratings/installs | 1/7 | 1/100 (sin prompt) | 🏆 El prompt in-app funciona |
| Revenue/install | $0.07 | $0.30-2 (Lifestyle freemium) | 🔴 Pricing muy bajo |

## Diagnóstico ejecutivo

**No tienes problemas. Tienes una sola palanca**: amplificar el embudo superior (impresiones).

Las 3 cosas que no se han probado todavía:
1. **ASO trabajado conscientemente** (el 77% Search se puede 2-3×)
2. **Tráfico externo** (TikTok/Reddit/web — actualmente despreciable)
3. **Apple Search Ads** (no usado, ROI testeable con $100-300/mes)

Las 2 cosas que limitan el techo:
1. **Pricing $1.10 lifetime** (mata LTV → cualquier campaña paid no rentabiliza)
2. **Mercados no localizados** (pt-BR, fr, it = 3-5× audiencia potencial)
