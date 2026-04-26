# Story 2.0: Garment SVG Research & Selection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the product owner,
I want to evaluate and approve garment silhouette assets for the Outfit Visualizer,
so that Story 2.1 can implement OutfitMannequin with validated, high-quality garment graphics.

## Acceptance Criteria

1. A visual proposal wall (HTML or React Native preview) displays candidate garment silhouettes for all 8 types: TopTShirt, TopShirt, BottomPants, BottomSkirt, LayerJacket, LayerHoodie, ShoesSneakers, ShoesFormal — each filled with sample Wada colors to evaluate visual impact.
2. The rendering approach (SVG with `fill` vs PNG with `tintColor`) is validated with a proof-of-concept showing dynamic color assignment works correctly on iOS.
3. Alejandro approves the final garment set and rendering approach before Story 2.1 begins.
4. Approved assets are placed in `assets/clothes_siluets/` (or renamed to `assets/garments/` if decided) with consistent naming matching the garment registry types.

## Context & Current State

Alejandro has curated 4 PNG silhouettes in `assets/clothes_siluets/` as a first test:

| File | Garment Type | Size |
|------|-------------|------|
| Tshirt.png | TopTShirt | 51KB |
| Button_down_shirt.png | TopShirt | 37KB |
| trousers.png | BottomPants | 25KB |
| Skirt.png | BottomSkirt | 21KB |

**Missing 4 types:** LayerJacket, LayerHoodie, ShoesSneakers, ShoesFormal.

**Visual characteristics:** White/light outline silhouettes on transparent background. Clean, minimalist style. Suitable for flat-fill coloring.

## Tasks / Subtasks

- [x] Task 1: Technical proof-of-concept — PNG tintColor vs SVG fill (AC: #2)
  - [x] 1.1 Create a minimal PoC screen that renders one PNG with `<Image tintColor={wadaColor.hex}>` and one SVG equivalent with `<Svg fill={wadaColor.hex}>` side by side
  - [x] 1.2 Test with 3-4 different Wada colors (pale, dark, vivid) to confirm fidelity
  - [x] 1.3 Document rendering quality, edge anti-aliasing, and performance differences
  - [x] 1.4 Recommend approach (SVG vs PNG+tintColor) with rationale
- [x] Task 2: Visual proposal wall with all garment candidates (AC: #1)
  - [x] 2.1 Display the 4 existing PNGs filled with sample Wada colors in a grid
  - [x] 2.2 Source or create candidates for the missing 4 types (jacket, hoodie, sneakers, formal shoes)
  - [x] 2.3 Present all 8 types together for Alejandro to evaluate
- [x] Task 3: Alejandro reviews and approves garment set + approach (AC: #3)
  - [x] 3.1 Gather feedback on silhouette style, proportions, and visual weight
  - [x] 3.2 Confirm or iterate on any garments that don't meet quality bar
- [x] Task 4: Finalize approved assets with consistent naming (AC: #4)
  - [x] 4.1 Rename/organize files to match garment registry naming convention
  - [x] 4.2 If SVG chosen: convert PNGs to SVG format (trace or re-source) — N/A, PNG chosen
  - [x] 4.3 If PNG chosen: update architecture decision and document tintColor pattern for Story 2.1

## Dev Notes

### Critical Technical Decision: SVG fill vs PNG tintColor

**Architecture planned SVGs** (`react-native-svg` with `fill` prop) — see [Source: docs/planning/architecture-react-native-ios.md, SVG Rendering section]. However, Alejandro's curated assets are PNGs.

**Option A — SVG (architecture plan):**
- Each garment is a React component wrapping `<Svg><Path d="..." fill={color} /></Svg>`
- Dynamic `fill` prop for color assignment
- Requires converting PNGs to SVG paths (vector tracing)
- Already in `metro.config.js` SVG transformer pipeline
- Architecture expects `components/garments/TopTShirt.tsx` etc.

**Option B — PNG with tintColor:**
- `<Image source={require('./assets/garments/tshirt.png')} style={{ tintColor: color.hex }} />`
- React Native `tintColor` fills the entire non-transparent area with the specified color
- Simpler asset pipeline (no vector tracing needed)
- May have anti-aliasing artifacts on silhouette edges
- Would change architecture decision — garment components become Image wrappers instead of SVG components

**Impact on Story 2.1:** The chosen approach defines:
- `components/garments/*.tsx` component structure
- `fill` prop vs `tintColor` style
- Build pipeline (SVG transformer vs Image require)
- Performance characteristics in Reanimated animations (interpolateColor)

### Garment Type Registry (from Architecture)

```
TopTShirt, TopShirt, BottomPants, BottomSkirt,
LayerJacket, LayerHoodie, ShoesSneakers, ShoesFormal
```
[Source: docs/planning/epics.md#Story 2.0]
[Source: docs/planning/architecture-react-native-ios.md#Project Structure]

### File Naming Inconsistency

Current PNGs have inconsistent naming (mixed case, different conventions):
- `Tshirt.png`, `Button_down_shirt.png`, `Skirt.png`, `trousers.png`

Should align to architecture registry names: `top-tshirt.{ext}`, `top-shirt.{ext}`, etc.

### Previous Epic Learnings (Epic 1 Retro)

- NativeWind + Pressable style conflict is a known pattern — use render function children for dynamic styles
- `metro.config.js` already has SVG transformer configured (added in Story 1.1)
- Test with real device when possible — simulator may not show rendering artifacts
- Keep stories small (4-5 tasks max) — this story has 4 tasks, good scope

### Project Structure Notes

- `assets/clothes_siluets/` — current location, may rename to `assets/garments/` for consistency
- `src/components/garments/` — planned location for garment components (Story 2.1)
- `src/components/garments/index.ts` — garment registry barrel export (only barrel export allowed per architecture)

### References

- [Source: docs/planning/epics.md#Story 2.0] — Story definition, 8 garment types, visual proposal wall requirement
- [Source: docs/planning/architecture-react-native-ios.md#SVG Rendering] — react-native-svg for garment silhouettes
- [Source: docs/planning/architecture-react-native-ios.md#Project Structure] — components/garments/ directory, registry pattern
- [Source: docs/planning/ux-design-specification-ios.md#OutfitMannequin] — Outfit Visualizer component specs
- [Source: docs/project-context.md#Established Patterns] — NativeWind, haptics, accessibility patterns
- [Source: _bmad-output/implementation-artifacts/archive/epic-01/epic-1-retro-2026-03-13.md] — Epic 1 retrospective learnings

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- SVG mock ordering issue in jest.config.js — moduleNameMapper processes top-to-bottom, SVG mock must come before asset alias
- ColorHome test regression — temporary PoC button added extra `accessibilityRole="button"`, fixed by using `"link"` role instead

### Completion Notes List
- **Architecture Decision: PNG + tintColor** — Product owner (Alejandro) evaluated both approaches via PoC screen and strongly preferred PNG + tintColor over SVG + fill. This overrides the original architecture plan for SVG garments.
- **Pattern for Story 2.1:** `<Image source={require("./garments/type.png")} style={{ tintColor: color.hex }} />` — garment components will be Image wrappers, not SVG components
- **All 8 garment PNGs curated by Alejandro** — placed in `assets/garments/` with consistent kebab-case naming matching registry types
- **PoC and Proposal screens are temporary** — added to ColorHome with "DEV:" prefix links, navigation routes in ColorsStack. Must be removed when Epic 2 is complete.
- **jest.config.js updated** — added `@/assets/*` moduleNameMapper for asset imports in tests
- **88 tests pass** (5 new for PoC + Proposal screens), 0 regressions

### Change Log
- 2026-03-13: Story implementation complete — PNG + tintColor approved, 8 garments finalized
- 2026-03-13: Code review fixes — deleted duplicate clothes_siluets/, removed unused props interfaces, fixed 40px→44px touch targets, added ColorHome DEV link test, updated File List

### File List
- assets/garments/top-tshirt.png (new — renamed from clothes_siluets/Tshirt.png)
- assets/garments/top-shirt.png (new — renamed from clothes_siluets/Button_down_shirt.png)
- assets/garments/bottom-pants.png (new — renamed from clothes_siluets/trousers.png)
- assets/garments/bottom-skirt.png (new — renamed from clothes_siluets/Skirt.png)
- assets/garments/layer-jacket.png (new — from Alejandro)
- assets/garments/layer-hoodie.png (new — from Alejandro)
- assets/garments/shoes-sneakers.png (new — from Alejandro)
- assets/garments/shoes-formal.png (new — from Alejandro)
- src/screens/GarmentPoC.tsx (new — PoC comparison screen, temporary)
- src/screens/GarmentPoC.test.tsx (new — 4 tests)
- src/screens/GarmentProposal.tsx (new — proposal wall with all 8 garments, temporary)
- src/screens/GarmentProposal.test.tsx (new — 5 tests)
- src/screens/ColorHome.tsx (modified — added temporary DEV links to PoC/Proposal)
- src/navigation/ColorsStack.tsx (modified — added GarmentPoC and GarmentProposal routes)
- src/navigation/types.ts (modified — added GarmentPoC and GarmentProposal to ColorsStackParamList)
- jest.config.js (modified — added @/assets moduleNameMapper)
- docs/project-context.md (modified — updated post-Epic 1 with full project structure and patterns)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — status update)
- assets/clothes_siluets/ (deleted — replaced by assets/garments/ with consistent naming)
