# UX de Captura

Fecha: 2026-04-14

---

## Principio

Darle personalidad Wada a un proceso técnico. La guía y la espera se sienten como parte
de la experiencia — japonesa, calmada, curatoriall — no como un loader genérico.

---

## Los 3 momentos de la pantalla de captura

### Momento 1: Visor — overlay de captura

Overlay sutil **siempre visible** sobre el visor de la cámara.
No es onboarding (aparece una vez) — es contexto permanente porque la luz cambia cada uso.

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         [live camera view]          │
│                                     │
│                                     │
│  Busca luz natural                  │
│  Centra la prenda                   │
│                                     │
│            ◉                        │
└─────────────────────────────────────┘
```

- Texto: 2 líneas, fuente sans pequeña, color blanco con sombra sutil o fondo pill semitransparente
- Posición: esquina inferior izquierda, encima del botón de captura
- Slider WB manual: accesible via icono discreto (☀) en esquina superior — visible pero no protagonista

**Copy EN:**
> "Find natural light · Center the garment"

**Copy ES:**
> "Busca luz natural · Centra la prenda"

---

### Momento 2: Análisis — mensajes en rotación

Duración: ~1–2 segundos de procesamiento real.
En lugar de spinner genérico: mensajes en fade rotation con tono Wada.

**Mensajes ES (rotan con fade, ~400ms cada uno):**
- "Buscando tu combinación Wada..."
- "Calibrando matices..."
- "Consultando la paleta de 1933..."
- "Encontrando tu armonía..."

**Mensajes EN:**
- "Finding your Wada combination..."
- "Calibrating colour tones..."
- "Consulting the 1933 palette..."
- "Searching for your harmony..."

- Tipografía: cursiva serif (Noto Serif JP), tamaño medio, centrado
- Fondo: warm background oscurecido (mismo warmBg del Visualizer con opacity 0.9)
- Sin barra de progreso — el misterio forma parte del tono

---

### Momento 3: Resultado

→ Resuelto en `01-problema-neutros.md` (ColorMatchSheet top-3)
→ Resuelto en `04-resultado-negativo.md` (OutOfCoverageSheet)

---

## Flujo completo de pantalla

```
[ColorHome] → tap botón cámara
      ↓
[CaptureScreen]
  - Visor full screen
  - Overlay sutil: "Busca luz natural · Centra la prenda"
  - Botón captura centrado
  - Icono ☀ para slider WB manual (opcional, power user)
      ↓ tap captura
[AnalysisOverlay]
  - Fondo warm oscurecido sobre foto capturada (freeze frame)
  - Mensajes en fade rotation: "Calibrando matices..."
  - ~1–2s procesamiento real
      ↓
[ColorMatchSheet] o [OutOfCoverageSheet]
  - Top-3 swatches con nombre Wada + ΔE
  - Usuario elige o confirma
      ↓
[Combinations] — flujo normal de la app
```

---

## Especificación técnica

### Mensajes de análisis

```typescript
// src/i18n/locales/en.json — nuevas claves
"colorCapture": {
  "overlayHint": "Find natural light · Center the garment",
  "analyzing": [
    "Finding your Wada combination...",
    "Calibrating colour tones...",
    "Consulting the 1933 palette...",
    "Searching for your harmony..."
  ]
}

// src/i18n/locales/es.json
"colorCapture": {
  "overlayHint": "Busca luz natural · Centra la prenda",
  "analyzing": [
    "Buscando tu combinación Wada...",
    "Calibrando matices...",
    "Consultando la paleta de 1933...",
    "Encontrando tu armonía..."
  ]
}
```

### Componente AnalysisOverlay

```typescript
// Fade rotation entre mensajes durante el análisis
const [messageIndex, setMessageIndex] = useState(0);
const opacity = useSharedValue(1);

useEffect(() => {
  const interval = setInterval(() => {
    // Fade out → cambiar mensaje → fade in
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setMessageIndex)(i => (i + 1) % messages.length);
      opacity.value = withTiming(1, { duration: 200 });
    });
  }, 600);
  return () => clearInterval(interval);
}, []);

// Respeta reduceMotion — sin fade, mensaje estático
```

### Slider WB manual

```typescript
// Temperatura AVFoundation: 2700K (tungsteno) → 7000K (cielo nublado)
// Default: 5500K (luz natural)
// Solo visible tras tap en icono ☀
// Persiste durante la sesión, se resetea al cerrar la pantalla
```

---

## Estado

✅ Flujo completo definido
✅ Copy EN + ES
✅ Especificación técnica de animación
✅ Claves i18n definidas
⬜ Pendiente diseño visual detallado (Pencil)
⬜ Pendiente implementación
