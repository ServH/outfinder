# Problema: Prendas con Múltiples Colores

Fecha: 2026-04-14

---

## El problema

Prendas con patrones (rayas, cuadros, estampados) tienen múltiples colores en el frame.
`CIAreaAverage` hace media aritmética de píxeles → devuelve un color que no existe en la prenda.

**Demostrado con datos:**
- Camisa rayas azul (#2B4C7E) / blanco (#F5F5F5) 50/50 → CIAreaAverage devuelve #90A1BA (azul desaturado inexistente)
- Cuadros rojo/verde/azul → CIAreaAverage devuelve #584F4B (marrón sucio, inútil)

---

## Decisión de producto

**Filosofía A — El color principal:** La app identifica el color más prominente visualmente y busca combinaciones para ese. Sin gestión de múltiples colores. Cubre el 80% de los casos de uso real.

Razón: La mayoría de la ropa que necesita combinaciones tiene un color dominante claro. Y para Outfinder, el usuario busca "con qué combino este jersey azul", no "analiza todos los colores de mi estampado".

---

## Impacto en arquitectura Tier 3

`CIAreaAverage` falla para extracción de color dominante en prendas multicolor.
Necesitamos **clustering**, no averaging.

**`UIImageColors`** (usado por `react-native-image-colors`) ya implementa clustering perceptual internamente:
- Analiza la imagen completa por regiones
- Devuelve `primary`: color más prominente visualmente (no el más frecuente por píxel)
- Para una camisa a rayas azul/blanco, `primary` = azul — el color que el ojo percibe como dominante
- Maneja correctamente la mayoría de patrones de ropa real

### Arquitectura revisada (Tier 3)

```
[Custom Swift module]  → CIAreaAverage sobre píxeles de borde/fondo
                          → estima iluminante de la escena
                          → aplica corrección WB a imagen
                          → también expone slider WB manual al usuario

[UIImageColors]        → clustering perceptual sobre imagen WB-corregida
                          → devuelve primary: color dominante
                          → devuelve secondary: segundo color (ignorado en Filosofía A)
```

**Los dos módulos son complementarios:**
- `CIAreaAverage` resuelve el problema de iluminación (borde/fondo, no prenda)
- `UIImageColors` resuelve el problema de extracción dominante (clustering, no average)

---

## Casos límite asumidos / no resueltos

**Rayas finas (< 5px en imagen):** UIImageColors percibe el color predominante por área. Rayas finas de color minoritario pueden ser ignoradas. Comportamiento correcto para Filosofía A.

**Cuadros grandes iguales (50/50):** Ambos colores tienen el mismo peso. UIImageColors puede devolver cualquiera de los dos como `primary`. Edge case aceptado — el usuario ve el resultado y puede retomar la foto enfocando el color que le interesa.

**Estampado sobre fondo sólido:** Si el fondo ocupa más área, puede ganar. Mitigación: instrucción UX de capturar con el color principal centrado y prominente en el frame.

**Lo que NO cubrimos:** Análisis de todos los colores de la prenda (Filosofía B). Fuera de alcance en esta versión.

---

## Especificación técnica

```typescript
// Pipeline completo con arquitectura revisada

// 1. Captura con expo-camera
const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

// 2. Corrección WB (módulo Swift custom)
//    - CIAreaAverage sobre border pixels (10% margen) → illuminant estimation
//    - Aplica corrección a imagen completa
//    - Si slider manual activo, usa temperatura del slider en lugar de auto-estimación
const wbCorrectedUri = await applyWhiteBalance(photo.uri, wbTemperature);

// 3. Extracción de color dominante (UIImageColors / react-native-image-colors)
const colors = await getColors(wbCorrectedUri, { fallback: '#888888' });
const dominantHex = colors.platform === 'ios' ? colors.primary : colors.dominant;

// 4. ΔE matching contra 159 Wada colors (pre-computados en L*a*b*)
const capturedLab = hexToLab(dominantHex);
const matches = wadaColorsWithLab
  .map(c => ({ ...c, deltaE: ciede2000(capturedLab, c.lab) }))
  .sort((a, b) => a.deltaE - b.deltaE)
  .slice(0, 3); // top-3 siempre (ver: 01-problema-neutros.md)

// 5. Confirmación del usuario si top-1 ΔE ≥ 2.0
if (matches[0].deltaE >= 2.0) {
  showColorMatchSheet(matches); // usuario elige
} else {
  navigateToCombinations(matches[0].color.id); // match directo
}
```

**Dependencias:**
```bash
pnpm add react-native-image-colors ciede2000-color-matching
# + custom Swift module para WB (no existe en npm — a implementar)
```

**Rebuild requerido:** Sí — `npx expo prebuild` por react-native-image-colors + custom Swift module.

---

## Estado

✅ Problema analizado
✅ Impacto en arquitectura identificado y resuelto
✅ Arquitectura Tier 3 revisada — CIAreaAverage (WB) + UIImageColors (dominante)
⬜ Pendiente de implementación
