# Outfinder — Docs Index

Guía rápida de dónde vive cada cosa. Si lo que buscas no está aquí, pregúntate si vale la pena crear el archivo o archivar algo obsoleto.

## Núcleo del proyecto

- **[project-context.md](project-context.md)** — arquitectura, componentes, patrones. Fuente de verdad para LLM/humanos. 26KB, se actualiza por epic con `/update-context`.
- **[../CLAUDE.md](../CLAUDE.md)** — rules para agentes Claude Code (scope, accessibility, testing, native modules).
- **[../README.md](../README.md)** — onboarding del repo.
- **[../CHANGELOG.md](../CHANGELOG.md)** — versionado y releases.
- **[privacy-policy.md](privacy-policy.md)** — política de privacidad publicada.
- **[ideas.md](ideas.md)** — brainstorm activo (post v1.4.0).

## Planning

```
planning/
├── prd.md                              ← PRD actual (canónico)
├── architecture-react-native-ios.md    ← arquitectura técnica global
├── ux-design-specification-ios.md      ← UX spec global
├── ux-design-epic-14.md                ← UX spec específico Epic 14
├── epic-11.md                          ← Epic 11 (iPad + i18n, shipped)
├── epic-13-armario-virtual.md          ← Epic 13 Armario Virtual (feature-complete)
├── epic-15-ideas-pre-launch.md         ← ideas + análisis pre-Epic 15 (input para epic-15.md)
├── v2-strategy-brief.md                ← estrategia v2 (Paleta Objetivo, Zero-Cost, Botón Mágico)
├── epic-15/                            ← Epic 15 Pre-launch polish (activo, v1.4.0 launch blocker)
│   └── epic-15.md                      ← spec canónico Epic 15 (6 stories: foundation, B1, C1, A2, A1, copy)
├── epic-14/                            ← Epic 14 workstream (activo)
│   ├── epic-14.md                      ← spec canónico Epic 14
│   ├── epic-14-scope.md
│   ├── epic-14-tech-review.md          ← decisiones técnicas cerradas
│   ├── epic-14-qa-checklist.md         ← QA on-device
│   ├── epic-14-post-release-bugs.md    ← bug log actualizado
│   ├── epic-14-bugs-handoff-2026-04-22.md
│   ├── epic-14-bugs-handoff-2026-04-23.md  ← handoff actual al reviewer
│   ├── epic-14-story-loop-handoff.md
│   └── epic-14-pencil-handoff.md
├── feature-armario-virtual/            ← specs UX Epic 13 (pantallas S0–S5)
├── feature-color-capture/              ← specs UX Epic 12 (discovery)
├── research/                           ← research técnico por feature
│   ├── technical-armario-virtual-feasibility-research-2026-04-16.md
│   └── technical-color-capture-accuracy-research-2026-04-14.md
├── real_clothes/                       ← assets originales de prendas
└── archive/                            ← docs históricos (ver sección abajo)
```

## Archive (histórico — no editar)

- `planning/archive/` — PRDs viejos, epics rollups superseded, readiness reports, specs obsoletos
- `archive/project-context-distillate.md` — versión condensada pre-Epic 12 del project-context (snapshot temporal)

## Assets

- `img_screenshot/` — screenshots App Store (EN/ES/iPad), capturas, QA visual
- `marketing/` — planes de crecimiento, ASO, estrategia pricing
- `icon/` — app icons

## Implementation artifacts (fuera de docs/)

- `../_bmad-output/implementation-artifacts/` — story files, retros, code reviews, tech specs
  - **raíz** (activo): stories `14-*` de Epic 14 + `sprint-status.yaml` + `deferred-work.md`
  - `archive/epic-01/` → `archive/epic-12/` — stories + retro de cada epic shipped
  - `archive/epic-13/` — stories Epic 13 (Armario Virtual, feature-complete)
  - `archive/tech-specs/` — tech specs históricos
- `../_bmad-output/deferred-work.md` — backlog de tareas diferidas

## Designs (al root del repo)

- `../designs/` — mockups Penpot, redesign specs (home, favorites, visualizer), flows
