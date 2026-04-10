---
name: pre-release
description: Run pre-submission checklist before an App Store release. Validates tests, types, lint, version, and production readiness.
---

# Pre-Release Checklist

Run a comprehensive pre-submission validation before building for App Store.

## Process

Execute each check in sequence and report results as a checklist:

### 1. Tests
Run `pnpm test` and report: total suites, total tests, pass/fail count.

### 2. Linting
Run `pnpm lint` and report: error count, warning count.

### 3. Type Checking
Run `npx tsc --noEmit` and report: error count.

### 4. Version Check
Read `app.json` and check:
- `expo.version` — is it bumped from the last git tag? (`git tag -l 'v*' --sort=-v:refname | head -1`)
- `expo.ios.buildNumber` — is it incremented?
If not bumped, warn: "Version no actualizada desde el ultimo release."

### 5. Debug Code Scan
Search `src/` for `console.log`, `console.warn`, `console.error`, and `debugger` statements.
Report: file count with debug code. If found, list files.

### 6. Git Status
Run `git status --porcelain` to check for uncommitted changes.
Report: clean or list of uncommitted files.

### 7. Remote Sync
Run `git fetch` then `git status -sb` to check if branch is ahead/behind remote.
Report: sync status.

## Output Format

```
## Pre-Release Checklist — Outfinder v[version]

- [x/fail] Tests: [N] suites, [N] tests, all passing
- [x/fail] Lint: 0 errors, 0 warnings
- [x/fail] Types: 0 errors
- [x/fail] Version: [version] (build [buildNumber]) — bumped from [last tag]
- [x/fail] Debug code: none found in src/
- [x/fail] Git: working tree clean
- [x/fail] Remote: up to date with origin/epic-1

### Resultado: READY / NOT READY
[If NOT READY, list what needs fixing before release]
```
