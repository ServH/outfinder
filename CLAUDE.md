# Outfinder - Claude Code Rules

## Project Overview

Outfinder — React Native iOS app for color coordination using Sanzo Wada's "A Dictionary of Color Combinations." React Native + Expo SDK 55 + NativeWind 4.2.2 + React Navigation 7. Static JSON dataset, no backend. Offline-first. iOS only MVP.

## Commands

- `pnpm start` — Metro bundler
- `pnpm lint` — Biome linter
- `pnpm test` — Jest tests
- `npx tsc --noEmit` — type check only

## Navigation map

- **`docs/README.md`** — índice de toda la documentación (PRD, arquitectura, UX specs, epics activos/archivados, research, assets). Leer primero para encontrar cualquier doc.
- **`docs/project-context.md`** — arquitectura, componentes, patrones actuales. Fuente de verdad para contexto técnico.
- **`_bmad-output/implementation-artifacts/`** — stories activas (raíz) + histórico en `archive/epic-NN/`. `sprint-status.yaml` y `deferred-work.md` viven en raíz.

### Docs maintenance contract (MANDATORY)

Cualquier agente que **cree, mueva, renombre o archive** un `.md` dentro de `docs/` DEBE actualizar `docs/README.md` en el mismo turno:
- **Nuevo .md** → añadir entrada en la sección correspondiente (Planning, Archive, Núcleo, Assets, etc.) con una línea descriptiva corta
- **Move / rename** → actualizar el path y descripción en la sección donde esté listado
- **Archivar** → mover la entrada de su sección activa a la sección "Archive"
- Mantener el tree visual y las secciones ordenadas por relevancia (activo antes que histórico)

No aplica a: story files dentro de `_bmad-output/implementation-artifacts/` (esos los gestiona la convención de epic-N/story-N naming y `sprint-status.yaml`).

## Agent Rules (from 5 PWA retrospectives)

### Story Scope

- Maximum 4-5 tasks per story. Never combine stories from the epic plan.
- Smaller scope = dramatically better agent quality. Stories with 7-10 tasks showed context degradation.

### Acceptance Criteria Verification

- Agent MUST verify each AC point-by-point before marking a story done.
- Include AC checklist verification as the final task in every story.

### Accessibility First

- Always use semantic elements with accessibilityLabel and accessibilityRole.
- 44px minimum touch targets.
- VoiceOver support on all interactive elements.
- Screen reader announcements for state changes (accessibilityLiveRegion).
- Respect Reduce Motion setting (AccessibilityInfo.isReduceMotionEnabled).

### Testing Discipline

- Every AC describing user interaction must have a corresponding test.
- Use `testID` attributes (not data-testid — React Native convention).
- Test interactions, not just rendering.
- Co-locate test files next to source files.

### Error Handling

- Try/catch on all native API calls (haptics, share, IAP, storage).
- Don't assume APIs always succeed.

### React Native Specifics

- Function declarations with named exports (never export default).
- NativeWind `className` for static styles (never StyleSheet.create).
- `style={{}}` ONLY for dynamic Wada color values.
- Haptics only through lib/haptics.ts (never import expo-haptics directly).
- Props interface required: `interface {ComponentName}Props`.

### Rules of Hooks

- All hooks must be called before any early returns in components.

### Mandatory Code Review

- Run adversarial code review (`/bmad-bmm-code-review`) after completing every story.
- Must pass before merging story branch into epic branch.
