# ASO Rewrite — v1.3.1

Propuesta de cambios en metadata para próxima release minor. Objetivo: capturar más volumen de búsqueda manteniendo conversión.

> ⚠️ **Validar con keyword research real** (AppTweak free, SensorTower trial) antes de subir. Las propuestas son hipótesis fundamentadas, no rankings confirmados.

---

## EN — English

### Antes (actual v1.3.0)

| Campo | Copy | Chars |
|---|---|---|
| App Name | Outfinder: Color Coordination | 29/30 |
| Subtitle | Scan. Style. Done. | 18/30 |
| Keywords | camera,scan,color,outfit,style,match,closet,wardrobe,palette,fashion,aesthetic,mood,vibe | ~95/100 |
| Promo text | Scan any garment. See what goes with it. Offline, instant, and actually accurate. | — |

### Problemas detectados

1. **Subtitle desperdicia ASO**: tono brand OK, pero 0 keywords con volumen real. Apple usa el subtitle para ranking, no solo el title.
2. **Keywords redundantes con title/subtitle**: `color`, `scan`, `style` ya están en title o subtitle → Apple los indexa de ahí, repetirlos malgasta ~25 chars.
3. **Keywords brutalmente competidos**: `outfit`, `fashion`, `wardrobe`, `closet` están dominados por apps grandes (Stylebook, Cladwell, Smart Closet) — tu app no tiene autoridad para rankear.
4. **Falta intent real**: el lenguaje del usuario al buscar es `what to wear`, `color matcher`, `combinations`, no `aesthetic` ni `mood` (esos tienen menos volumen).

### Después (propuesta v1.3.1)

| Campo | Copy | Chars |
|---|---|---|
| App Name | Outfinder: Color Coordination | 29/30 (sin cambios) |
| **Subtitle** | **Color matcher & outfit ideas** | 28/30 |
| **Keywords** | **matcher,combination,harmony,what to wear,palette,outfit ideas,wardrobe,fashion,closet,look** | ~99/100 |
| **Promo text** | **📷 NEW: Photograph any garment to instantly find matching colors from a 1933 color theory book. Offline, accurate, no signup.** | — |

### Justificación

- **Subtitle "Color matcher & outfit ideas"**: dos frases con volumen real (`color matcher`, `outfit ideas`) en orden natural. Mantiene cap de 30 chars.
- **Keywords reordenados por intent**:
  - `matcher`, `combination`, `harmony` → niche pero alta intención de compra
  - `what to wear`, `outfit ideas` → frases de búsqueda completas reales
  - `palette`, `wardrobe`, `closet`, `fashion`, `look` → cobertura long-tail
- **Promo text** anuncia la feature nueva (cámara) — se actualiza sin re-submission Apple.

---

## ES — Español

### Antes (actual v1.3.0)

| Campo | Copy | Chars |
|---|---|---|
| App Name | Outfinder: Coordina Colores | 27/30 |
| Subtitle | Escanea. Combina. Listo. | 24/30 |
| Keywords | camara,escaner,color,combinar,atuendo,estilo,armario,paleta,moda,estetica,outfit,tendencia | ~92/100 |
| Promo text | Escanea cualquier prenda. Ve con qué combina. Sin conexión, al instante, y preciso de verdad. | — |

### Problemas detectados

1. **Subtitle**: mismo problema que EN, frases tono brand pero sin keywords con volumen.
2. **Keywords redundantes**: `color`, `combinar`, `estilo` ya en title/subtitle.
3. **Falta intent en español**: la búsqueda real hispana usa `que ponerme`, `que me pongo`, `armario virtual`, `estilismo`, no `estetica` ni `tendencia`.

### Después (propuesta v1.3.1)

| Campo | Copy | Chars |
|---|---|---|
| App Name | Outfinder: Coordina Colores | 27/30 (sin cambios) |
| **Subtitle** | **Encuentra qué color combina** | 28/30 |
| **Keywords** | **que ponerme,combinaciones,armario virtual,paleta,outfit,look,estilismo,moda,inspiracion,prendas** | ~95/100 |
| **Promo text** | **📷 NUEVO: Fotografía cualquier prenda y descubre al instante con qué colores combina, basado en un libro japonés de 1933. Sin conexión, sin registro.** | — |

### Justificación

- **Subtitle "Encuentra qué color combina"**: frase exacta de búsqueda (intent + concepto).
- **Keywords reordenados**:
  - `que ponerme` → volumen brutal en mercado hispano (consulta diaria)
  - `armario virtual` → intent claro, define la categoría que el usuario MX pidió
  - `combinaciones`, `paleta`, `look` → niche con intent de compra
  - `outfit`, `moda`, `estilismo`, `inspiracion`, `prendas` → cobertura long-tail
- **Promo text** anuncia cámara — actualizar inmediatamente sin esperar a v1.3.1.

---

## Acción inmediata (no requiere release nueva)

Estos campos se cambian en App Store Connect en caliente, sin re-submission:

- ✅ **Promotional Text EN** — copiar la versión nueva de arriba
- ✅ **Promotional Text ES** — copiar la versión nueva de arriba

## Cambios para v1.3.1 (requiere submission)

- 🟨 **Subtitle EN + ES** — los nuevos
- 🟨 **Keywords EN + ES** — los nuevos
- 🟨 **(opcional)** Reordenar screenshots para que el de **cámara** sea el primero (es ahora la killer feature según review real)

## Métricas a vigilar después del cambio

Anotar baseline antes de subir v1.3.1:
- Impresiones promedio últimos 7 días: **~13/día**
- PPV promedio últimos 7 días: **~3-5/día**
- Conversion PPV→Install: **41%**

Esperar 14 días con la nueva metadata y re-medir. Indicador de éxito mínimo:
- Impresiones suben a **>30/día** (2.3× el baseline)
- PPV→Install se mantiene >35% (no debe caer por keywords más amplios)

Si impresiones no suben en 14 días → repetir keyword research, las hipótesis fallaron.
