# Epic 15 — Ideas pre-launch (borrador)

**Creado:** 2026-04-25
**Estado:** Ideación — pendiente de priorización y scope final.
**Origen:** Sesión de planificación Alejandro + Claude antes de lanzar v1.4.0.
**Relación:** Epic 14 está feature-complete (14.1–14.13 done, en epic-14). Este doc recoge las ideas para decidir si hay Epic 15 antes del launch o si van post-launch.

---

## Ideas capturadas (en bruto)

### A. OutfitVisualizer — polish adaptativo

**A1. Background consistente con la app**
El fondo del Visualizer no sigue el lenguaje visual común del resto de la app (paper cream, elevated simplicity). Es un cambio de sintonía, no un rediseño.

**A2. Onboarding de descubrimiento dentro del OutfitVisualizer**
El OutfitVisualizer muestra siluetas PNG tintadas con los colores Wada del combo. El user nuevo no sabe que esas siluetas son interactivas — que puede cambiar la prenda o conectarla con su armario real. Se necesita algún tipo de onboarding dentro de esa pantalla (la que tiene los PNG tintados) que revele que los elementos son tocables y qué ocurre al hacerlo. El formato exacto queda a criterio del agente UX.

---

### B. Armario — gap funcional en flujo "En curso"

**B1. Foto nueva / biblioteca sin loop de clasificación**
Cuando un user tiene un look "en curso" y va a asignar una prenda que le falta, el armario se abre con 3 opciones:
1. Coger del armario existente ✅
2. Hacer una foto nueva ⚠️
3. Traer de la biblioteca ⚠️

Las opciones 2 y 3 lanzan el capture/picker pero **no pasan por el loop de clasificación** que sí tiene el flujo principal (cámara FAB → Result → CategoryPicker → PostSave). La prenda entra sin categoría o con flujo incompleto.

**Impacto:** inconsistencia de datos en `WardrobeItem.category` + UX incoherente con el flujo principal que Epic 14 construyó.

---

### C. Onboarding — cámara FAB (first-use)

**C1. Revelar la magia de la cámara antes de que la usen**
El user nuevo no sabe que la cámara hace algo especial: fotografías una prenda, la app la **recorta automáticamente** y detecta su **tono Wada**. Sin conocer esto de antemano, el resultado (cutout + color) sorprende pero no crea comprensión — el user no sabe qué acaba de pasar ni por qué volvería a hacerlo.
Queremos que antes o durante el primer uso de la cámara FAB, el user entienda la promesa: "Fotografía tu prenda → la recortamos → detectamos su color Wada → te sugerimos combinaciones".
El formato exacto (coach mark, hint card, animación, texto en la propia UI de la cámara) queda a criterio del agente UX.

---

### D. Copy — cambios puntuales

**D1.** `"Empieza un look nuevo"` → `"Monta tu look"`
Más coloquial y español. Menos corporativo.

**D2.** `"¿De qué color es tu ropa hoy?"` → `"¿Qué color de ropa quieres combinar?"`
El CTA actual asume que el user tiene ropa delante. El nuevo copy funciona en todos los contextos (exploratorio nocturno, en tienda, en casa).

---

### E. Ver catálogo — polish visual (baja prioridad)

**E1. Armonía visual de las fichas de color**
La pantalla del catálogo lleva desde las primeras epics sin pasar un polish. Los cuadrados de muestra podrían ser más consistentes en tamaño y tener más armonía visual. 

**Decisión de Alejandro:** baja prioridad, puede esperar al post-launch v1.4.1+.

---

### F. Marketing — track paralelo

**F1. ASO (App Store Optimization)**
La app ha cambiado radicalmente en Epic 13 + Epic 14 (Armario Virtual completo, cámara unificada, Mis Looks). El copy de App Store, screenshots y vídeo promo siguen describiendo una versión anterior. Necesitan rehacerse antes o justo después del launch de v1.4.0.

**Herramienta disponible:** `/app-store-aso` skill para generar copy optimizado.
**Assets:** screenshots en simulador + vídeo promo en `tools/promo-video/` (Remotion, 20s App Store Preview + 15s Social).

---

## Análisis — ¿qué va antes del launch?

### Tier 1 — Bloquean calidad de producto (Epic 15 pre-launch)

| ID | Descripción | Coste estimado |
|----|-------------|----------------|
| B1 | Foto nueva/biblioteca sin clasificación en flujo "En curso" | medium — requiere spec UX + dev |
| C1 | Onboarding first-use cámara FAB | small–medium |
| A2 | Onboarding descubrimiento Visualizer | small |
| D1 + D2 | Copy changes (2 strings) | trivial — 1 story, 30 min |

**Razonamiento:** B1 es un gap funcional real introducido por Epic 14 — el flujo de asignación desde "En curso" queda incompleto versus el flujo principal. Si lanzamos con esto, los users que asignen desde "En curso" via foto/biblioteca tendrán prendas sin categoría. C1 y A2 son directamente activación de nuevos usuarios — sin ellos, el potencial del armario sigue siendo invisible.

### Tier 2 — Mejoran pero no bloquean (hacer si el tiempo da)

| ID | Descripción | Coste estimado |
|----|-------------|----------------|
| A1 | Visualizer background consistente | small — CSS/style tweak |

### Tier 3 — Post-launch (v1.4.1+)

| ID | Descripción | Nota |
|----|-------------|------|
| E1 | Ver catálogo polish visual | Alejandro lo marcó como baja prio |
| F1 | Marketing / ASO | Puede hacerse en paralelo al launch |

---

## Preguntas abiertas para decidir scope de Epic 15

1. **B1** — ¿El flujo de foto nueva/biblioteca en "En curso" usa el mismo `UnifiedCameraRoot` de Epic 14 o es una implementación separada? Hay que auditar código antes de estimar.
2. **C1** — ¿Interstitial (pantalla completa, se muestra 1 sola vez) o coach mark superpuesto sobre la cámara?
3. **A2** — ¿Coach mark en el Visualizer o estado vacío del slot con hint inline?
4. **F1** — ¿Hacemos ASO antes del submit o post-launch como update de metadata?

---

## Próximos pasos sugeridos

1. Alejandro responde preguntas abiertas de scope.
2. Si se confirma Epic 15: `/bmad-create-story` para cada tier-1.
3. Marketing: `/app-store-aso` en sesión separada para generar copy nuevo.
4. QA on-device final (epic-14 checklist §1 + §4 + §6.3) → firma Outcome A → `release-manager`.
