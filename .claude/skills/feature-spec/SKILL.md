---
name: feature-spec
description: Generate an implementation-ready story spec from user feedback or a feature idea. Use when you have user feedback or a feature request that needs to become a story.
---

# Generate Feature Story Spec

Create an implementation-ready story spec from user feedback or a feature idea.

## Input

$ARGUMENTS — description of the user feedback, feature idea, or bug to address.

## Process

1. **Read context:**
   - Read `docs/project-context.md` for established patterns and component catalog
   - Read relevant existing components that will be affected
   - If referencing user feedback, check memory files in `~/.claude/projects/-Users-alejandrocamps-outfinder/memory/` for `project_user_feedback_*.md`

2. **Analyze impact:**
   - Which existing components need modification?
   - Which new components need creation?
   - What patterns from project-context.md apply?
   - What gotchas from retrospective learnings are relevant?

3. **Generate story spec** following the BMAD format below. Save to `_bmad-output/implementation-artifacts/` with naming convention `X-Y-short-description.md` where X is the current epic number and Y is the next story number.

4. **Output:** Show the file path and a brief summary of what was generated.

## Story Spec Template

```markdown
# Story X.Y: [Title]

Status: ready-for-dev

## Story

As a [user type],
I want [capability],
so that [benefit].

## Acceptance Criteria

1. **Given** [precondition], **When** [action], **Then** [expected result].
[Repeat for each AC — be specific with values, colors, sizes, timing]

[LAST AC must be]: **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. New tests cover: [list specific test scenarios].

## Tasks / Subtasks

- [ ] Task 1: [Description] (AC: #N, #M)
  - [ ] 1.1 [Specific implementation step with file path]
  - [ ] 1.2 [Next step]

[MAX 4-5 tasks. If more are needed, split into multiple stories.]

[LAST task must be]: Tests and verification (AC: #last)

## Dev Notes

### Context
[What problem this solves. Link to user feedback if applicable.]

### Architecture & Patterns
[Which existing components to reuse. Which patterns from project-context.md apply.]

### Previous Story Intelligence
[Relevant learnings from related stories. Known gotchas. NativeWind+Pressable conflict, Reanimated mock, etc.]

### Components to Reuse
- `src/components/[Component].tsx` — [why relevant]
- `src/lib/[utility].ts` — [why relevant]

## Dev Agent Record

### Implementation Plan
[Empty — filled by dev agent]

### File List
[Empty — filled by dev agent]

### Change Log
[Empty — filled by dev agent]
```

## Quality Rules

- MAX 4-5 tasks per story — if the feature is bigger, output multiple story specs
- Every AC describing user interaction must have a corresponding test scenario in the last AC
- Include specific values: colors as hex, sizes in px, timing in ms
- Reference components by full path: `src/components/ComponentName.tsx`
- Include accessibility requirements in the AC (touch targets, labels, roles)
- Include Reduce Motion handling if animations are involved
- Dev Notes MUST reference relevant patterns from project-context.md
- Always wrap AsyncStorage/haptics/share in try/catch in task descriptions
