# Problema: Resultado Negativo (Color Fuera de Cobertura Wada)

Fecha: 2026-04-14

---

## El problema

Colores de moda actual — neones, saturados, sintéticos — no tienen representación en el dataset Wada.
Wada trabajó en 1933 con pigmentos naturales. Su paleta refleja colores clásicos, apagados, orgánicos.

**Datos del dataset (CIE76 al mejor match Wada):**

| Color | ΔE mejor match | Wada más cercano |
|---|---|---|
| Naranja neón | 19.5 | Persimmon |
| Rosa fucsia | 21.8 | Red Plum |
| Verde lima neón | 41.6 | Yellow |
| Azul eléctrico | 32.7 | Purple |
| Amarillo chillón | 28.4 | Yellow |
| Morado intenso | 52.3 | Purple |
| Turquesa brillante | 28.4 | Light Onion Blue |
| Rosa baby | 19.8 | Flesh |

Colores clásicos de ropa (khaki, mostaza, navy, terracota) están bien cubiertos (ΔE < 10).

**Conclusión:** No es un bug — es coherente con la naturaleza histórica del dataset.

---

## Decisión

**No resolver lo irresoluble. Ser honesto con el usuario de forma que refuerce la identidad de la app.**

Umbral: si top-1 match tiene ΔE > 15 → modo "fuera de cobertura".

---

## Comportamiento

### Caso normal (ΔE ≤ 15)
→ Flujo estándar: top-3 con confirmación o match directo.

### Caso fuera de cobertura (ΔE > 15)
→ Mensaje educativo + mejor match disponible como fallback:

```
"Este color es demasiado vibrante para el
 universo Wada — su paleta está basada en
 pigmentos naturales de los años 30.

 El tono más cercano que encontramos es
 [swatch] Persimmon — ¿quieres ver sus
 combinaciones?"
```

**Por qué este enfoque:**
- Convierte una limitación en storytelling de producto
- Educa al usuario sobre qué es Wada — refuerza el valor de la curaduría
- No deja al usuario sin salida — siempre ofrece el mejor match disponible
- Diferencia Outfinder de una app de rueda cromática genérica

**Descartado:** Mensaje de error genérico "no se encontraron resultados" — dead end que frustra sin enseñar nada.

---

## Especificación técnica

```typescript
const WADA_COVERAGE_THRESHOLD = 15; // ΔE76 — cruce de familia cromática

const top3 = matchWadaColor(capturedLab, wadaColorsWithLab); // siempre devuelve 3
const bestMatch = top3[0];

if (bestMatch.deltaE > WADA_COVERAGE_THRESHOLD) {
  // Modo fuera de cobertura
  showOutOfCoverageSheet({
    bestMatch: bestMatch.color,
    deltaE: bestMatch.deltaE,
  });
} else if (bestMatch.deltaE >= 2.0) {
  // Confirmación top-3 (ver 01-problema-neutros.md)
  showColorMatchSheet(top3);
} else {
  // Match directo
  navigateToCombinations(bestMatch.color.id);
}
```

**Componente necesario:** `OutOfCoverageSheet` — variante del `ColorMatchSheet` con:
- Texto educativo sobre Wada (2 líneas, tono de marca)
- Swatch del mejor match disponible + nombre Wada
- CTA "Ver combinaciones de [nombre]"
- CTA secundario "Intentar de nuevo" (por si fue error de captura)

**Texto EN:**
> "This color is too vibrant for Wada's palette — his combinations are based on natural pigments from 1930s Japan. The closest tone we found is [name] — want to see its combinations?"

**Texto ES:**
> "Este color es demasiado vibrante para la paleta de Wada — sus combinaciones se basan en pigmentos naturales del Japón de los años 30. El tono más cercano que encontramos es [nombre] — ¿quieres ver sus combinaciones?"

Claves i18n a añadir: `colorCapture.outOfCoverage`, `colorCapture.outOfCoverageAction`.

---

## Estado

✅ Problema analizado con datos reales del dataset
✅ Solución especificada
✅ Copy EN + ES definido
⬜ Pendiente de implementación
