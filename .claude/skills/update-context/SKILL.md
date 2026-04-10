---
name: update-context
description: Scan the codebase and update docs/project-context.md with current architecture, components, and patterns. Use after completing an epic or major feature.
---

# Update Project Context

Scan the Outfinder codebase and update `docs/project-context.md` to reflect current state. This file is the single source of truth for ALL agents and sessions (imported via CLAUDE.md @import).

## Process

### 1. Read current state
Read `docs/project-context.md` to understand current documented state.

### 2. Scan source directories
List files in each source directory:
- `src/components/` — all .tsx files (including subdirectories)
- `src/screens/` — all .tsx files
- `src/hooks/` — all .ts files
- `src/contexts/` — all .tsx files
- `src/lib/` — all .ts files
- `src/navigation/` — all .tsx and .ts files
- `src/data/` — all files
- `src/styles/` — all files
- `assets/garments/` — all image files

### 3. Gather metrics
- Run `npx jest --ci 2>&1 | tail -8` to count tests and suites
- Read `app.json` for current version and build number
- Run `git log --oneline -30` to understand recent work
- Run `git tag -l 'v*' --sort=-v:refname | head -3` for recent releases
- Read `package.json` dependencies for tech stack versions

### 4. Update project-context.md

**Sections to UPDATE:**
- **Tech Stack** — verify versions match package.json
- **Current Status** — epic progress, test counts, version, App Store status
- **Project Structure** — add new files, remove deleted ones, update comments
- **Known Technical Debt** — check if items are resolved, add new ones

**Sections to PRESERVE (do not modify unless explicitly asked):**
- **What is this project?**
- **Architecture**
- **Established Patterns — MUST Follow** (all subsections)
- **Key Learnings from Retrospectives**
- **Swatch Group Labels**

### 5. Verify
- Ensure no patterns were accidentally removed
- Ensure file tree matches actual filesystem
- Ensure test count matches actual output
- Show a diff summary of what changed

## Rules

- NEVER remove established patterns — they are validated across multiple epics
- NEVER modify the Key Learnings section — retro learnings are permanent
- If a new pattern emerges (e.g., new component type, new mock needed), ADD it to Established Patterns
- If technical debt is resolved, remove it from the table
- Keep the file under 300 lines — if approaching limit, compress the Project Structure tree
- Communicate changes in Spanish: "Actualizado: [list of changes]"
