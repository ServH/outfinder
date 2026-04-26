# Problema: Punto de Entrada en la App

Fecha: 2026-04-14

---

## Decisión

**La feature vive en ColorHome** — la pantalla del grid de colores.

---

## Razonamiento

La captura de color es el inicio del journey de descubrimiento, no el final.
El usuario tiene una prenda y pregunta "¿con qué combina?". Eso ocurre antes de tener favoritos.

ColorHome ya responde exactamente esa pregunta — "¿qué color estás buscando?".
La cámara es una forma alternativa de responder lo mismo.

```
Tengo una prenda → entro a Colors →
  Opción A: busco el color en el grid manualmente
  Opción B: lo capturo con la cámara  ← misma intención, distinto método
→ veo combinaciones Wada
```

## Descartado: Favoritos

Favoritos es consulta, no descubrimiento. El usuario que entra ahí ya tomó una decisión.
Poner la cámara ahí interrumpe el flujo en lugar de facilitarlo.
La conversión a premium viene de que el usuario entienda el valor, no de dónde está el botón.

---

## Integración visual (a definir en UX)

Botón de cámara en ColorHome como punto de entrada alternativo al grid.
Posición exacta y tratamiento visual: pendiente de diseño.

---

## Estado

✅ Decisión tomada
⬜ Diseño UX pendiente
