# QA 14.13 Evidence Bundle

Ejecución on-device de Story 14.13 en iPhone 16 Pro.

## Archivos requeridos (AC #8)

- `ac3-photo-first.mov` — screen recording del flujo photo-first completo (FAB → scan → save → combinations → Ficha Wada → auto-save) — prueba NFR7 ≤2min.
- `ac3-color-first.mov` — screen recording del flujo color-first completo (ColorHome → Visualizer → Guardar para luego → reopen → complete) — prueba FR13 + FR16 + NFR4 S4 share.
- `ac4-n0-mis-looks.png` — Mis Looks vacío tras upgrade v1.3.0→v1.4.0 con N=0.
- `ac4-n3-mis-looks.png` — Mis Looks con 3 looks tras upgrade con N=3 (FR17 zero data loss).
- `ac4-n5-mis-looks.png` — Mis Looks con 5 looks tras upgrade con N=5 (grandfathered).
- `ac5-td4-paywall-limbo.png` — Ficha Wada en estado paywall-limbo (opacity 40% + strip explicativo).
- `ac6-s4-share.png` — Share sheet abierto con polaroid S4 (NFR4 non-regression).

Archivos adicionales bienvenidos pero no requeridos.

## Convención de nombres

`ac{N}-{descriptor}.{png|mov}` — el prefijo AC# garantiza trazabilidad del evidence contra el acceptance criteria que verifica.

## Políticas

- **No se sube .DS_Store** ni ficheros auto-generados por macOS.
- Los vídeos en `.mov` pueden comprimirse con `ffmpeg -i in.mov -crf 28 out.mov` si exceden 25 MB para que GitHub acepte el push.
- Una vez firmado Outcome A en `docs/planning/epic-14-qa-checklist.md §8`, este folder queda como artefacto permanente del release v1.4.0.
