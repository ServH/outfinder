# Story 12.4: Result Sheets + Navigation

Status: done

## Story

As a user,
I want to see the top Wada color matches after photographing my garment — with swatches I can compare and choose from — or get an educational message when my color falls outside Wada's historical palette,
so that I can confirm the right match and browse its combinations.

## Acceptance Criteria

1. **Given** the pipeline returns `{ type: "confirm", top3 }` from Story 12.3, **When** `CaptureScreen` renders `matchState`, **Then** `ColorMatchSheet` is shown as a bottom sheet modal with up to 3 rows. Each row shows: a 40×40px color swatch (`style={{ backgroundColor: match.color.hex }}`), the Wada color name in NotoSerifJP 16px, and a ΔE badge. The active (first) row has no border; it is simply highlighted by its position.

2. **Given** the `ColorMatchSheet` is visible, **When** the user taps a row, **Then** `hapticLight()` fires and `navigation.push("Combinations", { colorId: selectedColor.id, capturedHex })` is called. The sheet closes.

3. **Given** the `ColorMatchSheet` is visible, **When** the ΔE value for a match is ≤ 3.0, **Then** the badge reads `t("colorCapture.matchExcellent")` in green (`#4A7C59`). When ΔE is 3.1–8.0, the badge reads `t("colorCapture.matchGood")` with neutral text. No badge shown for ΔE > 8.0.

4. **Given** the pipeline returns `{ type: "out-of-coverage", bestMatch }`, **When** `CaptureScreen` renders `matchState`, **Then** `OutOfCoverageSheet` is shown with:
   - Education copy: `t("colorCapture.outOfCoverageMessage")` in NotoSerifJP 15px
   - A single 40×40px swatch of `bestMatch.color.hex` + its Wada name
   - CTA button: `t("colorCapture.outOfCoverageAction")` → navigates to `Combinations` for that color
   - Secondary link: `t("colorCapture.tryAgain")` → dismisses both sheets and restores live preview

5. **Given** either sheet is visible, **When** the user swipes down or taps outside the sheet area, **Then** the sheet dismisses and the camera returns to live preview state (capture button re-enabled, `matchState = null`, `analysisVisible = false`, `analysisError = null`).

6. **Given** both sheets, **When** rendered, **Then** each row/button has `accessibilityRole="button"`, `accessibilityLabel` combining color name + ΔE text for screen readers. Minimum touch target height: 56px per row. Modal container has `accessibilityViewIsModal={true}`.

7. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. New tests cover: `ColorMatchSheet` renders 3 rows, row tap navigates with correct `colorId`, `OutOfCoverageSheet` shows education copy + best-match swatch, "try again" resets state, ΔE badge thresholds, accessibility labels.

## Tasks / Subtasks

- [x] Task 1: Create `src/components/ColorMatchSheet.tsx` (AC: #1, #2, #3, #6)
  - [x] 1.1 Props:
    ```typescript
    interface ColorMatchSheetProps {
      visible: boolean;
      matches: WadaMatch[];          // top-3 from matchWadaColor
      capturedHex: string;
      onSelect: (colorId: string) => void;
      onDismiss: () => void;
    }
    ```
  - [x] 1.2 Modal presentation: use React Native `<Modal animationType="slide" transparent visible={visible} onRequestClose={onDismiss} accessibilityViewIsModal>` with a backdrop `Pressable` (full-screen, bg-black opacity-40) that calls `onDismiss`
  - [x] 1.3 Sheet container: absolute bottom-0, width 100%, bg-white, rounded-t-3xl, pb-safe-offset-4 (`pb-[calc(theme(spacing.4)+env(safe-area-inset-bottom))]` or equivalent). `accessibilityRole="none"` on decorative handle bar (4×32px, bg-gray-300, rounded-full, mx-auto mb-4 mt-3)
  - [x] 1.4 Header: `t("colorCapture.matchSheetTitle")` in NotoSerifJP 18px, text-center, px-6 pb-4
  - [x] 1.5 Rows: for each `WadaMatch` in `matches`, render a `Pressable` row (min-h-[56px], flex-row, items-center, px-6, gap-4):
    - Swatch: `View` 40×40px, borderRadius 8, `style={{ backgroundColor: match.color.hex }}`, border 1px `rgba(0,0,0,0.08)` for light colors (use `isLightColor(match.color.hex)` from `@/lib/color`)
    - Name: `Text` NotoSerifJP 16px — `match.color.nameEn` (raw, never through `t()`)
    - ΔE badge: conditional (see AC #3): `View` px-2 py-0.5 rounded-full bg-green-100 / bg-gray-100 depending on ΔE threshold
    - Chevron: `SymbolView name="chevron.right"` 16px, text-gray-400, ml-auto
    - `accessibilityLabel={`${match.color.nameEn}, ΔE ${match.deltaE.toFixed(1)}, select`}`
    - `accessibilityRole="button"`

- [x] Task 2: Create `src/components/OutOfCoverageSheet.tsx` (AC: #4, #5, #6)
  - [x] 2.1 Props:
    ```typescript
    interface OutOfCoverageSheetProps {
      visible: boolean;
      bestMatch: WadaMatch;
      capturedHex: string;
      onSelect: (colorId: string) => void;
      onTryAgain: () => void;
      onDismiss: () => void;
    }
    ```
  - [x] 2.2 Same `<Modal>` + backdrop pattern as `ColorMatchSheet`
  - [x] 2.3 Sheet body (px-6 pt-4 pb-safe):
    - Education copy: `Text` NotoSerifJP Regular 15px, text-center, opacity-80, line-height 22: `t("colorCapture.outOfCoverageMessage")`
    - Best-match row: `View` flex-row items-center gap-4 mt-6 — 40×40 swatch + `Text` NotoSerifJP 16px `bestMatch.color.nameEn`
    - Primary CTA: `Pressable` mt-6 — NotoSerifJP 17px — `t("colorCapture.outOfCoverageAction", { name: bestMatch.color.nameEn })` — bg-[#5C3A1E] text-white rounded-2xl h-[52px]
    - Secondary link: `Pressable` mt-3 pb-2 — Inter 14px text-center — `t("colorCapture.tryAgain")` — calls `onTryAgain`
  - [x] 2.4 Primary CTA: `hapticMedium()` + `onSelect(bestMatch.color.id)`; Secondary link: `hapticLight()` + `onTryAgain()`

- [x] Task 3: i18n keys for result sheets (AC: #3, #4, #5)
  - [x] 3.1 Add to `src/i18n/locales/en.json`:
    ```json
    "colorCapture.matchSheetTitle": "Which is closest to your garment?",
    "colorCapture.matchExcellent": "Excellent match",
    "colorCapture.matchGood": "Good match",
    "colorCapture.outOfCoverageMessage": "This colour is too vibrant for Wada's palette — his combinations are based on natural pigments from 1930s Japan. The closest tone we found:",
    "colorCapture.outOfCoverageAction": "See {{name}}'s combinations",
    "colorCapture.tryAgain": "Try again"
    ```
  - [x] 3.2 Add equivalent keys to `src/i18n/locales/es.json` (exact copy from `04-resultado-negativo.md`):
    ```json
    "colorCapture.matchSheetTitle": "¿Cuál se parece más a tu prenda?",
    "colorCapture.matchExcellent": "Match exacto",
    "colorCapture.matchGood": "Buen match",
    "colorCapture.outOfCoverageMessage": "Este color es demasiado vibrante para la paleta de Wada — sus combinaciones se basan en pigmentos naturales del Japón de los años 30. El tono más cercano que encontramos:",
    "colorCapture.outOfCoverageAction": "Ver combinaciones de {{name}}",
    "colorCapture.tryAgain": "Intentar de nuevo"
    ```
  - [x] 3.3 Update `src/i18n/types.ts` `TranslationKey` union with all new keys (auto-derived from en.json via FlattenKeys — no manual edit needed)

- [x] Task 4: Wire sheets into `src/screens/CaptureScreen.tsx` + reset logic (AC: #5)
  - [x] 4.1 Import `ColorMatchSheet` + `OutOfCoverageSheet`
  - [x] 4.2 `handleSelect(colorId: string)`: dismiss sheet (`setMatchState(null)`) then `navigation.push("Combinations", { colorId, capturedHex: capturedHex ?? "" })`
  - [x] 4.3 `handleTryAgain()`: reset all state — `setMatchState(null)`, `setAnalysisVisible(false)`, `setAnalysisError(null)`, `setCapturedHex(null)` — camera resumes live preview
  - [x] 4.4 `handleDismiss()`: same as `handleTryAgain()`
  - [x] 4.5 Render in CaptureScreen JSX: conditional rendering for both sheet types

- [x] Task 5: Tests + verification (AC: #7)
  - [x] 5.1 Create `src/components/ColorMatchSheet.test.tsx`:
    - Mock `@/lib/haptics`
    - Test: renders 3 rows when given 3 matches
    - Test: tapping row 0 calls `onSelect` with correct `colorId`
    - Test: ΔE ≤ 3.0 → "Excellent match" badge rendered; ΔE 5.0 → "Good match"; ΔE 9.0 → no badge
    - Test: each row has `accessibilityRole="button"` and `accessibilityLabel` containing the color name
    - Test: backdrop tap calls `onDismiss`
  - [x] 5.2 Create `src/components/OutOfCoverageSheet.test.tsx`:
    - Test: education copy renders (`colorCapture.outOfCoverageMessage`)
    - Test: best-match swatch visible + nameEn rendered
    - Test: CTA tap calls `onSelect` with `bestMatch.color.id`
    - Test: "try again" tap calls `onTryAgain`
  - [x] 5.3 Run `npx tsc --noEmit && pnpm lint && npx jest --ci` — all suites pass (2 pre-existing failures unchanged)

## Dev Notes

### Context
This is the final story of Epic 12. It delivers the two result UI components that complete the user-facing loop: garment photo → analysis → choose Wada match → browse combinations. The sheet design is intentionally simple — consistent with the app's Wada editorial tone (warm, curated, Japanese restraint).

The `OutOfCoverageSheet` is a product storytelling moment: it converts a technical limitation into brand education. The copy in `04-resultado-negativo.md` is final and was carefully crafted — do not shorten or generalize it.

### Sheet Architecture
React Native's built-in `<Modal>` is used (not a third-party bottom sheet library) because:
- No new native dependency required (no rebuild)
- `animationType="slide"` gives the correct bottom-sheet feel
- The app already has precedent for modals (`PremiumPaywall.tsx`)

Pattern for bottom sheet with Modal:
```tsx
<Modal animationType="slide" transparent visible={visible} onRequestClose={onDismiss} accessibilityViewIsModal={true}>
  <Pressable className="flex-1 bg-black/40" onPress={onDismiss} accessibilityLabel="Dismiss" />
  <View className="absolute bottom-0 w-full bg-white rounded-t-3xl">
    {/* sheet content */}
  </View>
</Modal>
```

### ΔE Badge Thresholds
From `00-discovery.md`:
- ΔE 0–3.0 → "Excellent match" (green badge `#4A7C59` bg, `#E8F5EE`)
- ΔE 3.1–8.0 → "Good match" (neutral, bg-gray-100, text-gray-600)
- ΔE > 8.0 → no badge (the match is presented as a candidate, badge would add noise)

### i18n Interpolation
`outOfCoverageAction` uses i18next interpolation: `t("colorCapture.outOfCoverageAction", { name: bestMatch.color.nameEn })`. The `name` param replaces `{{name}}` in the string. This is the same pattern used in existing `comboCard.combinationLabel` key.

**Important:** Wada names (`nameEn`) are NEVER passed through `t()` — they are brand identity. Pass them as interpolation params, not as translation keys.

### Safe Area
Both sheets must account for the home indicator on iPhones without a home button. Use safe area bottom padding. The established pattern: `paddingBottom: insets.bottom + 16` via `useSafeAreaInsets()` from `react-native-safe-area-context`.

### isLightColor Detection for Swatch Border
```typescript
import { isLightColor } from "@/lib/color";
// Apply a 1px border only for light swatches:
const borderStyle = isLightColor(match.color.hex)
  ? { borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" }
  : {};
```
This is the same pattern used in `ColorSwatch.tsx`.

### Previous Story Intelligence
- **Reanimated mock:** No new Reanimated usage in this story — sheets use standard React Native Modal, no worklets.
- **NativeWind + Pressable conflict:** Use child render function `{({ pressed }) => <View style={{ opacity: pressed ? 0.85 : 1 }} />}` for pressed states on row items and CTAs.
- **`getAllByText` vs `getByText`:** If color names appear in both the sheet and off-screen elements, use `getAllByText` and check `[0]`.
- **`hapticMedium()` on primary CTA** (selecting a Wada color is a meaningful action), **`hapticLight()` on secondary "try again"** link.
- **Accessibility:** `accessibilityViewIsModal={true}` on the Modal's inner content View prevents VoiceOver from reading behind the sheet.

### Components to Reuse
- `src/components/PremiumPaywall.tsx` — reference for Modal bottom sheet pattern in this codebase
- `src/lib/color.ts:isLightColor(hex)` — swatch border detection
- `src/lib/haptics.ts` — `hapticLight()`, `hapticMedium()`
- `src/lib/colorTypes.ts` (Story 12.1) — `WadaMatch` type
- `src/i18n/index.ts` — `useTranslation()` hook

## Dev Agent Record

### Implementation Plan

- Task 1: Created `ColorMatchSheet` as a React Native `<Modal animationType="slide" transparent>` with backdrop Pressable + sheet View. ΔE badge logic: ≤3.0 green, 3.1–8.0 gray, >8.0 none. Safe area padding via `useSafeAreaInsets()`. Light-color swatch border via `isLightColor()`.
- Task 2: Created `OutOfCoverageSheet` with same Modal/backdrop pattern, NotoSerifJP education copy, best-match swatch row, primary CTA (hapticMedium + onSelect), secondary try-again link (hapticLight + onTryAgain).
- Task 3: Added 6 new keys to `en.json` + `es.json` in `colorCapture` namespace. `TranslationKey` auto-derived — no manual types.ts edit needed.
- Task 4: Wired sheets into `CaptureScreen`: imported components, added `handleSelect`/`handleTryAgain`/`handleDismiss`, conditional JSX for both sheet types, removed void suppressors.
- Task 5: 22 new tests across 2 files. Key learning: backdrop Pressable inside Modal needs `includeHiddenElements: true` in RNTL queries. Added `react-native-safe-area-context` mock + sheet mocks to `CaptureScreen.test.tsx` to prevent safe area errors from wired sheets.

### File List

- src/components/ColorMatchSheet.tsx (new)
- src/components/ColorMatchSheet.test.tsx (new)
- src/components/OutOfCoverageSheet.tsx (new)
- src/components/OutOfCoverageSheet.test.tsx (new)
- src/screens/CaptureScreen.tsx (modified — imports, handlers, JSX)
- src/screens/CaptureScreen.test.tsx (modified — added safe-area + sheet mocks)
- src/i18n/locales/en.json (modified — 6 new colorCapture keys)
- src/i18n/locales/es.json (modified — 6 new colorCapture keys)

### Change Log

- feat: Story 12.4 — ColorMatchSheet + OutOfCoverageSheet result sheets, i18n keys, CaptureScreen wiring (2026-04-14)

### Review Findings

- [x] [Review][Decision→Patch] `CommonActions.reset` → `navigation.push` — resolved: push preferred so user can back to CaptureScreen. Fixed in CaptureScreen.tsx + test mock updated. [CaptureScreen.tsx]
- [x] [Review][Patch] Sheet unmounts instead of toggling `visible={false}` — fixed: always render both sheets, control via `visible` prop; `OutOfCoverageSheet.bestMatch` made optional with guards. [CaptureScreen.tsx, OutOfCoverageSheet.tsx]
- [x] [Review][Patch] Double-tap race: `selectGuard` ref added to `ColorMatchSheet.handleSelect` to prevent double-fire. [ColorMatchSheet.tsx]
- [x] [Review][Patch] `accessibilityLabel="Dismiss"` → `t("common.dismiss")` — added key to en.json + es.json. [ColorMatchSheet.tsx, OutOfCoverageSheet.tsx, en.json, es.json]
- [x] [Review][Defer] `isLightColor` does not normalise hex strings shorter than 6 digits — pre-existing in lib/color.ts, not introduced by this story [lib/color.ts]
- [x] [Review][Defer] `top3` in `confirm` result may contain 1–2 items if dataset is thin — pre-existing edge case in colorMatch pipeline; ColorMatchSheet handles gracefully by rendering whatever it receives [colorMatch.ts]
