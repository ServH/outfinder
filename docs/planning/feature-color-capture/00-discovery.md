# Feature: Color Capture — Discovery Log

Documento vivo. Se actualiza a medida que avanza la investigación y discusión.
Última actualización: 2026-04-14

---

## Origen

Reseña real de usuario "Foto shot" en App Store (v1.2.0, México, 11 abr 2026, 5 estrellas):
> "recomendaría al desarrollador que le agregara algo y esta aplicación fuera perfecta que tuviera un punto o que puedas tomarle la fotografía a una prenda y que te dé las variantes de color que le queda, ya sean complementarios, adyacentes o la triada o todo el círculo cromático"

Validación externa de demanda. Alta intención del usuario.

---

## Decisión de producto: Opción A — Quedarse en Wada

**Descartado:** Implementar rueda cromática matemática (complementarios, triadas, adyacentes generados algorítmicamente).
**Razón:** Saldría del dataset Wada y cambiaría la propuesta de valor de la app. Outfinder es "las combinaciones de Sanzo Wada", no un generador cromático genérico.

**Decisión:** Usuario fotografía prenda → app detecta color dominante → busca los colores Wada más cercanos por distancia ΔE → muestra sus combinaciones Wada existentes.
El resultado: "Tu prenda es similar a *Rojo Venecia* de Wada, estas son sus combinaciones."

---

## Restricciones técnicas

- 100% on-device. Sin backend. Sin modelos ML externos.
- React Native + Expo SDK 55. iOS only.
- Ya se usa development build (no Expo Go) — native modules son viables.

---

## Hallazgo 1: El problema de iluminación

**Problema:** La cámara captura luz reflejada, no el color intrínseco. El mismo jersey bajo tungsteno (2700K) vs luz natural (6500K) puede producir un ΔE shift de 15–25 (CIE76) sin corrección. iOS AWB reduce esto a ΔE 3–8. Manual WB lo reduce a ΔE 1–3.

**Conclusión:** El problema no se resuelve, se gestiona. No existe solución perfecta on-device sin tarjeta de referencia física (como Pantone).

**Estrategia elegida:** Tier 3 — máxima precisión disponible on-device:
- Módulo nativo Swift con `CIAreaAverage` (GPU) para extracción de color
- Slider manual de balance de blancos (AVFoundation temperatura 2700K–7000K) expuesto al usuario
- CIEDE2000 para matching (estándar actual para textiles)
- Mitigación UX: instrucciones de captura ("prenda plana, fondo claro, luz natural")

**Razón para ir directo a Tier 3:** Ya se trabaja con development builds y native modules (ver: expo-store-review, react-native-purchases). El coste de subir de Tier 2 a Tier 3 es marginal comparado con el beneficio de no tener que iterar después.

---

## Arquitectura técnica (pipeline completo)

```
[Camera Preview — expo-camera]
        ↓ takePictureAsync()
[JPEG URI]
        ↓ Custom Swift module (CIAreaAverage, center ROI 40–60%)
[sRGB float: {r, g, b}]
        ↓ Pure JS color conversion
[L*a*b* (CIELAB, D65)]
        ↓ CIEDE2000 × 159 Wada colors (pre-computados en L*a*b*)
[Top 5 matches con ΔE score]
        ↓ Navigate
[Wada combinations del match más cercano]
```

### Componentes técnicos

| Componente | Solución | Nativo? |
|---|---|---|
| Captura de imagen | `expo-camera` | Ya existe |
| Extracción de color | `react-native-image-colors` (UIImageColors clustering) | Sí — rebuild |
| Balance de blancos | Custom Swift: `CIAreaAverage` borde/fondo + slider AVFoundation | Sí — nuevo |
| Conversión color space | Pure JS: sRGB → linear RGB → XYZ → L*a*b* | No |
| Matching | `ciede2000-color-matching` (0 deps, 3KB) | No |
| Dataset pre-computado | Bake L*a*b* values en colors.json | No |

### ΔE thresholds (CIEDE2000)

| ΔE | Interpretación | Acción |
|---|---|---|
| 0 – 3.0 | Excelente match | Badge "match exacto" |
| 3.1 – 8.0 | Buen match | Mostrar como candidato |
| 8.1 – 15.0 | Match aproximado | Mostrar si no hay mejores |
| > 15.0 | Color family diferente | Descartar |

---

## Apps de referencia analizadas

| App | Estrategia iluminación | Precisión | On-device |
|---|---|---|---|
| Pantone (con tarjeta) | Patches de referencia físicos en escena | Máxima | Sí |
| Swatches | Slider manual WB + exposición | Alta | Sí |
| Cone | Slider manual WB | Alta | Sí |
| Adobe Capture | Solo AWB automático | Media | Sí |
| ColorSnap | Solo AWB automático | Media | Sí |

**Referencia principal para implementar:** Swatches + Cone — ambas exponen slider de temperatura AVFoundation al usuario. Es el patrón a seguir.

---

## Problemas resueltos

- [x] **Neutros** → top-3 con confirmación visual del usuario — `01-problema-neutros.md`
- [x] **Prendas multicolor** → UIImageColors (clustering) en lugar de CIAreaAverage (average) — `02-problema-multicolor.md`
- [x] **Punto de entrada** → ColorHome, botón cámara alternativo al grid — `03-punto-de-entrada.md`
- [x] **Resultado negativo** → mensaje educativo sobre Wada + mejor match disponible — `04-resultado-negativo.md`
- [x] **UX de captura** → overlay sutil permanente + mensajes Wada en rotación durante análisis — `05-ux-captura.md`

---

## Decisión: gestión de la foto capturada

**Este epic — Opción B (temporal en sesión):**
La foto se usa solo para extraer el color. No se almacena. Se descarta al navegar a combinaciones.
No requiere aviso al usuario ni cambios en política de privacidad.

**Epic futuro — Armario Virtual (guardado de prenda):**
Feature separada. No entra en este scope.

**Preparación arquitectónica en este epic (extensibility hooks):**
- `ColorMatchSheet` acepta prop `onSavePhoto?: () => void` — undefined por ahora, ready para el armario
- Tipos de navegación: `capturedHex?: string` como parámetro opcional en Combinations/OutfitVisualizer
- Al resolver match, pasar `capturedHex` como parámetro de navegación — ignorado hasta el armario virtual

Objetivo: cuando llegue el Epic del armario virtual, los puntos de extensión ya existen — sin reescribir.

## Checklist de publicación

- [ ] Añadir `NSCameraUsageDescription` en `app.json` → `ios.infoPlist`
  - EN: "Outfinder uses your camera to identify garment colors and find Wada combinations."
  - Apple usa el idioma del sistema — un string es suficiente
- [ ] Revisión App Store normal (~1-2 días) — no requiere entitlements especiales
- [ ] Verificar que el permiso se pide solo cuando el usuario toca el botón de cámara (no al abrir la app)

## Fuente de investigación

Informe técnico completo: `docs/planning/research/technical-color-capture-accuracy-research-2026-04-14.md`
