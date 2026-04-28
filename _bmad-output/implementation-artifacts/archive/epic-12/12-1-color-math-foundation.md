# Story 12.1: Color Math Foundation

Status: done

## Story

As an Outfinder developer,
I want a pure-JS color matching pipeline with pre-computed Wada L*a*b* values and CIEDE2000 distance,
so that any screen can match a captured hex against the 159 Wada colors with a single function call.

## Acceptance Criteria

1. **Given** a hex string (e.g. `#A3522B`), **When** `hexToLab(hex)` is called, **Then** it returns an `{ L, a, b }` object using the sRGB → linear RGB → XYZ (D65) → CIELAB pipeline (Bruce Lindbloom formulas).

2. **Given** an `{ L, a, b }` capture input and the 159 Wada colors with pre-computed L*a*b*, **When** `matchWadaColor(capturedLab)` is called, **Then** it returns a `WadaMatch[]` array of up to 3 results, each `{ color: Color, deltaE: number }`, sorted by `deltaE` ascending.

3. **Given** the `matchWadaColor` result, **When** `classifyMatch(matches)` is called, **Then** it returns one of three `MatchResult` discriminated unions:
   - `{ type: "direct", match: WadaMatch }` when top-1 `deltaE < 2.0`
   - `{ type: "confirm", top3: WadaMatch[] }` when top-1 `deltaE` is 2.0–15.0
   - `{ type: "out-of-coverage", bestMatch: WadaMatch }` when top-1 `deltaE > 15.0`

4. **Given** `colorConversion.test.ts`, **When** `hexToLab("#FFFFFF")` is called, **Then** it returns `{ L: 100, a: 0, b: 0 }` (±0.01). **When** `hexToLab("#000000")` is called, **Then** it returns `{ L: 0, a: 0, b: 0 }` (±0.01).

5. **Given** `colorMatch.test.ts`, **When** `matchWadaColor` is called with a Lab value close to a known Wada color, **Then** the closest color is returned first with the lowest `deltaE`. **When** called with a neon green Lab value (`L:88, a:-70, b:60`), **Then** `classifyMatch` returns `{ type: "out-of-coverage" }`.

6. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. New tests cover: `hexToLab` white/black/mid-tone accuracy, `matchWadaColor` sort order, `classifyMatch` all three branches.

## Tasks / Subtasks

- [x] Task 1: Install `ciede2000-color-matching` and define shared types (AC: #1, #2, #3)
  - [x] 1.1 Run `pnpm add ciede2000-color-matching` — package does not exist on npm; CIEDE2000 implemented inline (see Task 3 note)
  - [x] 1.2 Create `src/lib/colorTypes.ts` — export `LabColor { L: number; a: number; b: number }`, `WadaMatch { color: Color; deltaE: number }`, `MatchResult` discriminated union (direct / confirm / out-of-coverage)

- [x] Task 2: Implement `src/lib/colorConversion.ts` — sRGB → L*a*b* (AC: #1, #4)
  - [x] 2.1 `hexToRgb(hex: string): { r: number; g: number; b: number }` — parse 6-digit hex, strip `#`
  - [x] 2.2 `rgbToLinear(c: number): number` — apply sRGB inverse gamma (c/255 ≤ 0.04045 → divide by 12.92, else `((c/255+0.055)/1.055)^2.4`)
  - [x] 2.3 `linearRgbToXyz(r: number, g: number, b: number): { X: number; Y: number; Z: number }` — standard D65 matrix (IEC 61966-2-1 coefficients)
  - [x] 2.4 `xyzToLab(X: number, Y: number, Z: number): LabColor` — CIE cube-root function with D65 white point (Xn=0.95047, Yn=1.00000, Zn=1.08883)
  - [x] 2.5 `hexToLab(hex: string): LabColor` — compose all steps

- [x] Task 3: Implement `src/lib/colorMatch.ts` — CIEDE2000 matching + classification (AC: #2, #3)
  - [x] 3.1 `ciede2000-color-matching` not on npm — implemented CIEDE2000 as internal pure-JS function (Sharma et al. 2005); no external dependency required; `getAllColors` from `@/data/colorIndex`
  - [x] 3.2 Build module-level constant `WADA_COLORS_WITH_LAB` — computed once at import: `getAllColors().map(c => ({ ...c, lab: hexToLab(c.hex) }))`
  - [x] 3.3 `matchWadaColor(capturedLab: LabColor): WadaMatch[]` — scan all 159 colors, compute CIEDE2000, sort ASC, return top 3
  - [x] 3.4 `classifyMatch(matches: WadaMatch[]): MatchResult` — apply thresholds: `<2.0` → direct, `>15.0` → out-of-coverage, else → confirm
  - [x] 3.5 Export `DIRECT_THRESHOLD = 2.0` and `COVERAGE_THRESHOLD = 15.0` constants

- [x] Task 4: Tests (AC: #4, #5)
  - [x] 4.1 Create `src/lib/colorConversion.test.ts` — test `hexToLab("#FFFFFF")` → L≈100, `hexToLab("#000000")` → L≈0, `hexToLab("#FF0000")` → L≈53.2 a≈80.1 b≈67.2 (±1.0)
  - [x] 4.2 Create `src/lib/colorMatch.test.ts` — test that `matchWadaColor` returns exactly 3 results sorted ASC; test `classifyMatch` for each of the 3 branches using crafted Lab values; verify `WADA_COLORS_WITH_LAB` length is 159

- [x] Task 5: Verification (AC: #6)
  - [x] 5.1 Run `npx tsc --noEmit` — 0 errors
  - [x] 5.2 Run `pnpm lint` — 0 errors
  - [x] 5.3 Run `npx jest --ci` — all new suites pass (24/24); 2 pre-existing failures in i18n + OutfitVisualizer (unrelated)

## Dev Notes

### Context
This story establishes the pure-JS color math layer for the Epic 12 Color Capture feature. All color matching logic is bundled code — no network, no backend. The 159-color linear scan takes < 0.1ms in Hermes (confirmed in research).

The full capture pipeline (camera → WB → extraction → this matching → navigation) is assembled in Stories 12.2 and 12.3. This story only delivers the math utilities.

### Architecture & Patterns
- Place all new files in `src/lib/` — this is the established pattern for pure utility functions (see `src/lib/color.ts`, `src/lib/haptics.ts`)
- Function declarations with named exports (NEVER `export default`)
- Data access via `getAllColors()` from `@/data/colorIndex` — O(1) lookups already available
- `WADA_COLORS_WITH_LAB` as a module-level constant means the Lab values are computed once at first import and cached in the JS module system — no `useEffect`, no `useState`

### Color Conversion Formulas
All from Bruce Lindbloom's authoritative site (widely ported to JS, results match ICC reference):

**sRGB → linear:**
```
if (c_norm ≤ 0.04045) → c_linear = c_norm / 12.92
else                   → c_linear = ((c_norm + 0.055) / 1.055) ^ 2.4
```

**linear RGB → XYZ (D65 adaptation matrix):**
```
X = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B
Y = 0.2126729 * R + 0.7151522 * G + 0.0721750 * B
Z = 0.0193339 * R + 0.1191920 * G + 0.9503041 * B
```

**XYZ → L*a*b* (D65 white point: Xn=0.95047, Yn=1.00000, Zn=1.08883):**
```
f(t) = t^(1/3)  if t > (6/29)^3
f(t) = t/(3*(6/29)^2) + 4/29  otherwise
L* = 116 * f(Y/Yn) - 16
a* = 500 * (f(X/Xn) - f(Y/Yn))
b* = 200 * (f(Y/Yn) - f(Z/Zn))
```

### `ciede2000-color-matching` API
```typescript
import { ciede2000 } from "ciede2000-color-matching";
// Accepts: { L, a, b } for both arguments
// Returns: number (scalar ΔE, always positive)
const deltaE = ciede2000({ L: 50, a: 20, b: -10 }, { L: 51, a: 21, b: -9 });
```

### Previous Story Intelligence
- `pnpm test -- --ci` FAILS — always use `npx jest --ci` in CI and verification steps
- Mock setup in `jest.setup.js` initializes i18n — this story doesn't touch i18n, no mock changes needed
- NativeWind: no component code in this story, no StyleSheet/className concerns

### Components to Reuse
- `src/data/colorIndex.ts` — `getAllColors()` returns all 159 `Color` objects
- `src/data/types.ts` — `Color` type (`{ id, hex, nameJp, nameEn, swatchGroup, combinationCount }`)
- `src/lib/color.ts:isLightColor(hex)` — pattern reference for pure color utility functions

## Dev Agent Record

### Implementation Plan

**Dependency deviation:** `ciede2000-color-matching` does not exist on npm (404). Decision: implement CIEDE2000 formula directly as an internal function in `colorMatch.ts`. This is the Sharma et al. (2005) algorithm — ~80 lines of pure math, zero dependencies, no license risk, and tested by AC #4/#5 values.

**Architecture:** All 3 new files placed in `src/lib/` per established pattern.
- `colorTypes.ts` — shared types, imported by both conversion and match modules
- `colorConversion.ts` — pure sRGB→Lab pipeline, Bruce Lindbloom formulas
- `colorMatch.ts` — CIEDE2000 inline + WADA_COLORS_WITH_LAB constant + match/classify exports

**Branch:** `epic-12` (created from `epic-1` at v1.2.0 on 2026-04-14) — all 4 Epic 12 stories will be developed here.

### File List

- `src/lib/colorTypes.ts` (new)
- `src/lib/colorConversion.ts` (new)
- `src/lib/colorMatch.ts` (new)
- `src/lib/colorConversion.test.ts` (new)
- `src/lib/colorMatch.test.ts` (new)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated — epic-12 added)

### Change Log

- 2026-04-14: Story 12-1 implemented — color math foundation (pure-JS CIEDE2000, 24 tests passing)
- 2026-04-14: Code review complete — 4 patches applied (hexToRgb guard + tests, classifyMatch guard, Readonly type, test tolerance fix); 36/36 tests passing

### Review Findings

- [x] [Review][Patch] P1: `hexToRgb` silently returns NaN on invalid/short hex — add length+chars validation, throw RangeError, add tests [colorConversion.ts:3]
- [x] [Review][Patch] P2: `classifyMatch` crashes with TypeError on empty matches array — add empty-array guard [colorMatch.ts:111]
- [x] [Review][Patch] P3: `WADA_COLORS_WITH_LAB` is a mutable exported array — change to `Readonly<WadaColorWithLab[]>` [colorMatch.ts:97]
- [x] [Review][Patch] P4: Test tolerance `toBeCloseTo(value, 1)` is ±0.05 but spec AC4 requires ±0.01 — use `toBeCloseTo(value, 2)` [colorConversion.test.ts:72-83]
- [x] [Review][Defer] D1: `WADA_COLORS_WITH_LAB` module-load risk if `getAllColors()` throws — deferred, pre-existing architectural pattern
- [x] [Review][Defer] D2: `WadaMatch.color` carries hidden `lab` field at runtime (WadaColorWithLab type leak) — deferred, no functional impact in current stories
- [x] [Review][Defer] D3: `rgbToLinear` accepts out-of-range values via direct call — deferred, only reachable outside normal pipeline (resolved if P1 is applied)
- [x] [Review][Defer] D4: "neon green out-of-coverage" test is a fragile dataset assumption — deferred, requires mock infrastructure
