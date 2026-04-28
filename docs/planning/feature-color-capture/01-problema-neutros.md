# Problema: Colores Neutros

Fecha: 2026-04-14

---

## El problema

Los colores neutros (beige, gris, camel, blanco roto, crema) son los más comunes en ropa y los más difíciles de capturar con precisión. En L*a*b*, son casi acromáticos — valores `a*` y `b*` cercanos a 0. Un pequeño error de iluminación los desplaza proporcionalmente mucho más que a un color saturado.

---

## Análisis del dataset Wada

**55 de 159 colores Wada tienen chroma < 15** — un tercio exacto del dataset.

Distancia entre vecinos más cercanos dentro de los neutros (CIE76):

| Situación | Pares | Implicación |
|---|---|---|
| ΔE < 5 | 34 de 55 | Error de captura puede superar la distancia entre vecinos |
| ΔE 5–10 | 20 de 55 | Zona de riesgo bajo luz artificial |
| ΔE > 10 | 1 de 55 | Distancia suficiente para discriminar con fiabilidad |

**Casos extremos del dataset:**
- Iron Navy ↔ Jet Black: ΔE = 0.9 — indistinguibles incluso con espectrofotómetro
- White Tea ↔ Unbleached Silk: ΔE = 1.9 — ningún algoritmo los separaría con fiabilidad
- Media distancia al vecino más cercano: 4.5

El error de captura bajo luz artificial con iOS AWB es ΔE 3–8. **Para la mitad de los neutros, ese error es mayor que la distancia entre colores vecinos.**

---

## Conclusión clave

**Este no es un problema de captura que se resuelve con mejor código.** Es una característica del dataset — Wada intencionalmente incluye matices muy cercanos dentro de una misma familia.

Lo que importa no es distinguir "White Tea" de "Unbleached Silk" (ΔE 1.9) — sus combinaciones Wada serán similares y el usuario no nota la diferencia. Lo que importa es no cruzar familias cromáticas (warm → cool, light → dark).

---

## Solución

**Mostrar top-3 resultados con swatch visual de cada color, para que el usuario confirme el match.**

No es un fallo de la app — es honestidad sobre los límites de la captura por cámara. El usuario es el árbitro final.

```
[Captura] → [Top-3 matches ΔE]
                    ↓
    ┌──────────────────────────────────┐
    │  ¿Cuál se parece más a tu prenda?│
    │                                  │
    │  ○ [swatch] Ivory          ΔE 2.1│
    │  ○ [swatch] Unbleached Silk ΔE 3.4│
    │  ○ [swatch] Faint Incense  ΔE 4.8│
    │                                  │
    │  [Ver combinaciones →]           │
    └──────────────────────────────────┘
```

---

## Especificación técnica

**Sin cambios al pipeline de captura.** El CIEDE2000 matching ya devuelve scores ordenados. Solo cambia la presentación:

```typescript
// Misma función de matching, diferente UI
const matches = matchWadaColor(capturedLab, wadaColorsWithLab);
// matches = [{ color, deltaE }, ...] ordenado por deltaE ASC

// Para neutros (chroma < 15) Y para todos: mostrar top-3
const top3 = matches.slice(0, 3);

// UI: ColorSelectionSheet con 3 swatches
// Usuario toca uno → navega a sus combinaciones
```

**Umbral de presentación:**
- Si top-1 tiene ΔE < 2.0 → ir directo a combinaciones (match tan bueno que no vale la pena preguntar)
- Si top-1 tiene ΔE ≥ 2.0 → mostrar top-3 para confirmación del usuario

**Componente necesario:** `ColorMatchSheet` — bottom sheet con 3 filas: swatch (40×40px, color real), nombre Wada, badge ΔE, chevron.

**Sin lógica especial para neutros** — la solución es universal y más simple que detectar si un color es neutro.

---

## Estado

✅ Problema analizado
✅ Solución especificada
⬜ Pendiente de implementación (parte de la feature completa)
