# Story 6.4: Code Quality & Performance Polish

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer and end user,
I want the codebase to follow established NativeWind patterns, produce zero test warnings, use reactive dimension hooks, and ship optimized image assets, so that the app is consistent, test-healthy, future-proof, and minimal in download size.

## Acceptance Criteria

1. **Given** the codebase pattern rule "NativeWind `className` for static styles, `style={{}}` ONLY for dynamic Wada color values", **When** reviewing `MiniPaletteStrip.tsx` and `WadaHeader.tsx`, **Then** all static layout styles (gap, alignItems, flexDirection, borderRadius, overflow, fontSize, letterSpacing, marginBottom, textAlign, flex) use NativeWind `className` instead of `style={{}}`. Only dynamic values (colors from props/tokens like `backgroundColor: c.hex`, `color: "#a09080"`) remain in `style={{}}`.

2. **Given** the PremiumContext test suite runs, **When** all tests execute, **Then** zero `act(...)` warnings appear in console output. The root cause — the multi-step async `init()` in PremiumContext that resolves state updates after the initial `act()` boundary — is properly awaited using `waitFor` or equivalent.

3. **Given** the garment PNG assets in `assets/garments/`, **When** measured after optimization, **Then** each file is under 200 KB while maintaining visual quality at the rendered sizes (width ~100-160px on 3x retina = max 480px source). The current assets are 1024px wide — resize to 512px wide (sufficient for 3x at ~170px rendered) and compress with quality optimization.

4. **Given** components that use `Dimensions.get("window")` at module level, **When** reviewed, **Then** all 5 usages are replaced with the `useWindowDimensions()` hook (reactive to dimension changes). The affected files are: `PremiumPaywall.tsx` (SCREEN_HEIGHT), `OutfitVisualizer.tsx` (SCREEN_W), `Onboarding.tsx` (SCREEN_WIDTH), `WarmBackground.tsx` (SCREEN_W), and `MiniPaletteStrip.tsx` (SCREEN_W). Each dimension value becomes a local const inside the component function, derived from the hook.

5. **Given** all tasks are complete, **When** verification runs, **Then** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass with 0 errors and 0 act() warnings. Existing tests continue to pass. Visual rendering at all garment sizes is preserved (Skia ColorMatrix tinting still works at reduced resolution).

## Tasks / Subtasks

- [ ] Task 1: Convert MiniPaletteStrip to NativeWind className (AC: #1)
  - [ ] 1.1 In `src/components/MiniPaletteStrip.tsx`, convert the outer View's `style={{ gap: 6, alignItems: "center" }}` to `className="items-center gap-[6px]"`.
  - [ ] 1.2 Convert the palette strip View's `style={{ flexDirection: "row", borderRadius: 6, overflow: "hidden", height: 18 }}` to `className="flex-row overflow-hidden"` + keep only `style={{ borderRadius: 6, height: 18, width: screenW * 0.6 }}` (width is dynamic from dimensions).
  - [ ] 1.3 Convert the color names container View's `style={{ flexDirection: "row", gap: 12 }}` to `className="flex-row gap-3"` (gap-3 = 12px per tailwind config).
  - [ ] 1.4 Convert each color name Text's `style={{ fontSize: 9, color: "#a09080" }}` to `className="text-[9px] text-center"` + keep `style={{ color: "#a09080" }}` (Wada color, dynamic). Add `className="flex-1"` to match previous layout.
  - [ ] 1.5 Verify visual output is identical — the component renders at the same proportions and positions.

- [ ] Task 2: Convert WadaHeader to NativeWind className (AC: #1)
  - [ ] 2.1 In `src/components/WadaHeader.tsx`, convert the outer View's `style={{ alignItems: "center", gap: 2, marginBottom: 4 }}` to `className="items-center gap-[2px] mb-1"` (mb-1 = 4px per tailwind config).
  - [ ] 2.2 Convert the Japanese name Text's `style={{ fontSize: 20, fontFamily: "NotoSerifJP_500Medium", color: "#2c2c2c", letterSpacing: 2 }}` to `className="font-serif-jp-medium text-[20px] tracking-[2px]"` + keep `style={{ color: "#2c2c2c" }}` (dynamic Wada color).
  - [ ] 2.3 Convert the subtitle Text's `style={{ fontSize: 10, color: "#a09080", letterSpacing: 1 }}` to `className="text-[10px] tracking-[1px]"` + keep `style={{ color: "#a09080" }}` (dynamic Wada color). Add `allowFontScaling` and `maxFontSizeMultiplier={1.5}` (small text, same pattern as MiniPaletteStrip from Story 6.3).
  - [ ] 2.4 Verify visual output matches — font, spacing, colors all identical.

- [ ] Task 3: Fix act() warnings in PremiumContext tests (AC: #2)
  - [ ] 3.1 Analyze the root cause: PremiumContext's `init()` function runs 4 sequential async steps (SecureStore read → setLoading → Purchases.configure → getCustomerInfo → setIsPremium → getOfferings → setPriceString). The bare `await act(async () => {})` pattern only flushes one microtask tick, but the init chain has multiple awaits that resolve across several ticks — causing state updates outside the act boundary.
  - [ ] 3.2 Replace all bare `await act(async () => {})` calls that wait for init to complete with `await waitFor(() => expect(result.current.loading).toBe(false))` (or equivalent assertion-based waiting). Import `waitFor` from `@testing-library/react-native`. This ensures the test waits until all async state updates from init have settled.
  - [ ] 3.3 For tests that don't check init (e.g., "initializes with isPremium false and loading true", "exposes paywallDismissedThisSession"), leave them synchronous — they intentionally test the pre-init state.
  - [ ] 3.4 For tests that call `purchase()` or `restore()` after init, use nested `await act(async () => { await result.current.purchase() })` — these are already correct but verify no warnings remain.
  - [ ] 3.5 Run `pnpm test -- --verbose src/contexts/PremiumContext.test.tsx 2>&1` and verify zero "not wrapped in act(...)" warnings in output.

- [ ] Task 4: Compress garment PNG assets (AC: #3)
  - [ ] 4.1 Resize all 8 garment PNGs from 1024px width to 512px width, maintaining aspect ratio. Use `sips` (built-in macOS tool): `sips --resampleWidth 512 assets/garments/*.png`. This preserves RGBA, transparency, and non-interlaced format.
  - [ ] 4.2 After resize, verify each file is under 200 KB with `ls -la assets/garments/`. If any exceed 200 KB, apply further compression with `sips --setProperty formatOptions high`.
  - [ ] 4.3 Verify visual quality: the TintedGarment component renders garments at `heightHint` sizes (85-160px) — at 3x retina that's max 480px. Source at 512px provides adequate resolution. Visually confirm in the OutfitVisualizer that tinted garments still look clean.
  - [ ] 4.4 Document the before/after sizes in the completion notes.

- [ ] Task 5: Replace Dimensions.get("window") with useWindowDimensions() (AC: #4)
  - [ ] 5.1 **MiniPaletteStrip.tsx**: Remove `import { Dimensions, ... }` and the module-level `const { width: SCREEN_W } = Dimensions.get("window")`. Add `useWindowDimensions` to the react-native import. Inside the component function, add `const { width: screenW } = useWindowDimensions()`. Replace all `SCREEN_W` references with `screenW`. The width is used in `style={{ width: screenW * 0.6 }}` on the palette strip.
  - [ ] 5.2 **WarmBackground.tsx**: Remove the module-level Dimensions call. This is a function component — add `useWindowDimensions` and derive `screenW` inside. Replace `SCREEN_W` references in the Skia `RadialGradient` props: `c={vec(screenW / 2, 100)}` and `r={screenW * 0.8}`.
  - [ ] 5.3 **OutfitVisualizer.tsx**: Remove the module-level Dimensions call. Add `useWindowDimensions` inside the component. Replace `SCREEN_W` with local `screenW`. It's used at line 143: `<Aureola hex={...} width={screenW} height={500} />`. **Important:** This is used inside the component function, so the hook placement is straightforward.
  - [ ] 5.4 **Onboarding.tsx**: Remove the module-level `const { width: SCREEN_WIDTH } = Dimensions.get("window")` (line 55). Add `useWindowDimensions` inside the `Onboarding` component. Derive `const { width: screenWidth } = useWindowDimensions()`. Replace `SCREEN_WIDTH` in `renderSlide` (line 105: `style={{ width: screenWidth }}`). **Note:** `renderSlide` is a nested function inside the component — it has closure access to the hook value.
  - [ ] 5.5 **PremiumPaywall.tsx**: This is the most complex case. The module-level `SCREEN_HEIGHT` (line 27) derives `SHEET_HEIGHT` (line 28) which is used in: animated value init (line 56), dismiss function (lines 83, 91, 96), and sheet style (line 190). Move both into the component function: `const { height: screenHeight } = useWindowDimensions(); const sheetHeight = screenHeight * 0.7;`. Replace all `SHEET_HEIGHT` with `sheetHeight`. Keep `DISMISS_THRESHOLD` and `VELOCITY_THRESHOLD` as module-level constants (they're fixed values, not dimension-dependent).
  - [ ] 5.6 Update any affected tests that mock `Dimensions.get`. Search for `Dimensions` in test files and update mocks to use `useWindowDimensions` mock pattern if needed. The standard jest mock for useWindowDimensions: `jest.mock('react-native', () => ({ ...jest.requireActual('react-native'), useWindowDimensions: () => ({ width: 390, height: 844 }) }))` — but check if tests actually mock Dimensions first.

- [ ] Task 6: Final verification (AC: #5)
  - [ ] 6.1 Run `npx tsc --noEmit` — 0 errors.
  - [ ] 6.2 Run `pnpm lint` — 0 errors, 0 warnings.
  - [ ] 6.3 Run `pnpm test 2>&1 | grep -i "act("` — 0 act() warnings.
  - [ ] 6.4 Run `pnpm test` — all tests pass (354+ existing + any new).
  - [ ] 6.5 Point-by-point AC verification.
  - [ ] 6.6 Verify File List matches `git diff --name-status`.

## Dev Notes

### Epic Context

Story 6.4 in Epic 6 (App Store Preparation). Addresses the 4 "Nice to Have" findings from the pre-launch adversarial code review (findings #11-#14). Story 6.3 (in review) covered findings #6-#10. These are polish/quality changes with low risk.

### Current State

354 tests pass across 29 suites (after Story 6.3). Lint and TypeScript clean. The codebase has 5 files using `Dimensions.get("window")` at module level and 2 components (`MiniPaletteStrip`, `WadaHeader`) with inline static styles.

### Task 1 & 2 Deep Dive: NativeWind Conversion

The CLAUDE.md rule is clear: "NativeWind `className` for static styles, `style={{}}` ONLY for dynamic Wada color values."

**MiniPaletteStrip.tsx current state** (post-6.3):
- Outer View: `style={{ gap: 6, alignItems: "center" }}` → static layout, should be className
- Palette strip: `style={{ flexDirection: "row", borderRadius: 6, overflow: "hidden", height: 18, width: SCREEN_W * 0.6 }}` → only `width` is dynamic
- Color names row: `style={{ flexDirection: "row", gap: 12 }}` → static
- Text: `style={{ fontSize: 9, color: "#a09080" }}` → color is Wada token, fontSize is static

**WadaHeader.tsx current state** (post-6.3):
- Outer View: `style={{ alignItems: "center", gap: 2, marginBottom: 4 }}` → static
- Japanese Text: `style={{ fontSize: 20, fontFamily: "NotoSerifJP_500Medium", color: "#2c2c2c", letterSpacing: 2 }}` → color is Wada, rest static
- Subtitle Text: `style={{ fontSize: 10, color: "#a09080", letterSpacing: 1 }}` → color is Wada, rest static

**Tailwind spacing config** (from tailwind.config.js):
```
1: "4px", 2: "8px", 3: "12px", 4: "16px", 6: "24px", 8: "32px", 12: "48px"
```

So `gap: 6` → `gap-[6px]` (not gap-6 which = 24px), `gap: 12` → `gap-3` (3 = 12px), `marginBottom: 4` → `mb-1` (1 = 4px).

**Font families in tailwind.config.js:**
- `font-serif-jp` = NotoSerifJP_400Regular
- `font-serif-jp-medium` = NotoSerifJP_500Medium
- `font-sans` = Inter_400Regular
- `font-sans-medium` = Inter_500Medium

### Task 3 Deep Dive: PremiumContext act() Warnings

The warnings come from `PremiumContext.test.tsx`. The `init()` function in PremiumProvider runs this chain:

```
SecureStore.getItemAsync → setIsPremium → setLoading(false)
→ Purchases.configure
→ Purchases.getCustomerInfo → setIsPremium → SecureStore.setItemAsync
→ Purchases.getOfferings → setPriceString
```

That's 4 awaits and 4+ setState calls. The current test pattern:
```tsx
const { result } = renderHook(() => usePremium(), { wrapper });
await act(async () => {});  // only flushes ONE microtask tick
```

This doesn't wait for the full chain. State updates from later steps (getCustomerInfo, getOfferings) resolve after the act boundary closes → warning.

**Fix:** Use `waitFor` which polls until the assertion passes:
```tsx
const { result } = renderHook(() => usePremium(), { wrapper });
await waitFor(() => {
    expect(result.current.loading).toBe(false);
});
```

Or for tests that need to wait for the full init including price:
```tsx
await waitFor(() => {
    expect(result.current.priceString).toBe("$1.99");
});
```

Tests that intentionally check pre-init state ("initializes with isPremium false and loading true") remain synchronous.

**Affected tests (using bare `await act(async () => {})`):**
- Lines 46, 56, 63, 78, 95, 107, 120, 134, 180, 200, 217, 245, 262 in `PremiumContext.test.tsx`

### Task 4 Deep Dive: PNG Compression

**Current garment assets:**

| File | Dimensions | Size |
|------|-----------|------|
| bottom-pants.png | 1024x1316 | 1.1 MB |
| top-tshirt.png | 1024x982 | 768 KB |
| layer-jacket.png | 1024x1008 | 804 KB |
| layer-hoodie.png | 1024x1007 | 756 KB |
| top-shirt.png | 1024x1058 | 752 KB |
| bottom-skirt.png | 1024x1005 | 656 KB |
| shoes-sneakers.png | 1024x744 | 384 KB |
| shoes-formal.png | 1024x744 | 320 KB |
| **Total** | | **5.4 MB** |

**Rendered sizes:** TintedGarment renders at `heightHint` (85-160px) within an OutfitCard. At 3x retina, max rendered pixel height is 480px. Width is computed from aspect ratio, max ~400px. Source images at 512px wide are more than sufficient.

**Compression approach:** `sips` (macOS built-in, no npm dependency):
```bash
sips --resampleWidth 512 assets/garments/*.png
```

Expected result: ~150-300 KB per file (50-70% reduction). If some still exceed 200 KB:
```bash
# Further optimize with pngquant if available, or accept near-200 KB
sips --setProperty formatOptions high <file>
```

**No code changes needed** — `require()` in GARMENT_REGISTRY resolves at build time. Metro handles the resized PNGs transparently.

### Task 5 Deep Dive: useWindowDimensions Migration

`Dimensions.get("window")` at module level captures a snapshot at import time. `useWindowDimensions()` is a React hook that re-renders when dimensions change.

**5 files to migrate:**

1. **MiniPaletteStrip.tsx** (line 3): Uses width only. Simple — move into component.
2. **WarmBackground.tsx** (line 4): Uses width for Skia RadialGradient. Simple — move into component.
3. **OutfitVisualizer.tsx** (line 28): Uses width for Aureola prop. Simple — move into component (after existing hooks).
4. **Onboarding.tsx** (line 55): Uses width for slide sizing. The width is referenced in `renderSlide` which is a nested function — closure access works. **Caution:** `viewabilityConfig` and `viewabilityConfigCallbackPairs` are at module/component level — they don't use dimensions, so no issue.
5. **PremiumPaywall.tsx** (line 27-28): Uses height → derives SHEET_HEIGHT. SHEET_HEIGHT is used in shared values (line 56), dismiss function (lines 83, 91, 96), pan gesture onEnd (no — not directly), and style (line 190). **Caution with Reanimated:** The `translateY.value = SHEET_HEIGHT` in the dismiss function and useEffect need the current value, not a stale closure. Since `useWindowDimensions` triggers re-render, the dismiss function will have the fresh value via closure. The `useEffect` deps should include `sheetHeight`.

**Test impact:** Check if any tests mock `Dimensions`. Quick grep needed. If tests use `jest.mock('react-native', ...)` overriding `Dimensions`, they need to provide `useWindowDimensions` instead. Most component tests don't mock dimensions — they use the default jest-expo environment dimensions (typically 750x1334).

### Patterns to Follow

- **Function declarations with named exports**
- **NativeWind `className`** for static styles, `style={{}}` only for dynamic Wada color values
- **`useWindowDimensions()`** hook inside component functions, before early returns
- **Co-located tests** — test files next to source files
- **`allowFontScaling`** on all Text components
- **All hooks called before any early returns** (Rules of Hooks)

### What NOT to Do

- DO NOT change any colors, spacing, fonts, or visual appearance — only move styles from inline to className
- DO NOT convert WebP — React Native supports WebP but Skia's `useImage` may have compatibility differences with garment PNGs. Stay with PNG.
- DO NOT add `getItemLayout` to FlatLists — the review noted it as NIT (finding #17-18), not needed at current dataset size
- DO NOT refactor the PremiumContext init flow — only fix the tests, not the production code
- DO NOT change component behavior or props — these are pure refactors
- DO NOT introduce new dependencies for image compression — use macOS `sips` or `pngquant` if already available

### Git Branching

Create story branch `story-6.4-quality-perf-polish` off `epic-1` (current main epic branch).

### Files to Create/Modify

- `src/components/MiniPaletteStrip.tsx` (MODIFIED) — NativeWind className conversion + useWindowDimensions
- `src/components/WadaHeader.tsx` (MODIFIED) — NativeWind className conversion
- `src/contexts/PremiumContext.test.tsx` (MODIFIED) — Fix act() warnings with waitFor
- `assets/garments/*.png` (MODIFIED) — Resized from 1024px to 512px, compressed
- `src/components/PremiumPaywall.tsx` (MODIFIED) — useWindowDimensions replacing Dimensions.get
- `src/screens/OutfitVisualizer.tsx` (MODIFIED) — useWindowDimensions replacing Dimensions.get
- `src/screens/Onboarding.tsx` (MODIFIED) — useWindowDimensions replacing Dimensions.get
- `src/components/WarmBackground.tsx` (MODIFIED) — useWindowDimensions replacing Dimensions.get

### References

- [Source: adversarial review findings #11-#14] — This story's origin
- [Source: CLAUDE.md] — NativeWind className rule, named exports, hooks before early returns
- [Source: React Native useWindowDimensions docs] — Reactive hook replacement for Dimensions.get
- [Source: Apple HIG image assets] — 3x retina maximum actual rendered sizes
- [Source: _bmad-output/implementation-artifacts/6-3-accessibility-polish-and-production-hygiene.md] — Previous story, current test count (354)
