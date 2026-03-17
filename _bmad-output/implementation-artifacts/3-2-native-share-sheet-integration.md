# Story 3.2: Native Share Sheet Integration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to share my outfit image to Instagram, TikTok, or Messages in 2 taps,
so that my friends can see my outfit idea and discover Outfinder.

## Acceptance Criteria

1. **Given** a "Share Outfit" button is displayed on the Outfit Visualizer screen, **When** the user taps the share button (tap 1), **Then** the image is generated via `captureShareImage(shareViewRef)` from `lib/share.ts` (already implemented in Story 3.1), and `expo-sharing` opens the native iOS Share Sheet (UIActivityViewController) with the generated PNG image (FR15). The total flow from button tap to Share Sheet appearance is ≤2 taps (FR18): tap 1 = "Share Outfit" button, tap 2 = selecting destination in Share Sheet. If capture or sharing fails, a user-friendly `Alert.alert` is shown — never a crash (NFR20).

2. **Given** `lib/share.ts` already exports `captureShareImage`, **When** `shareOutfit(viewRef)` is added to the same file, **Then** it calls `captureShareImage(viewRef)` to get the image URI, then calls `Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png" })`. The entire function is wrapped in try/catch — on failure it returns `false`, on success it returns `true`. The function checks `Sharing.isAvailableAsync()` before attempting share.

3. **Given** the share button is rendered, **Then** it has `accessibilityLabel="Share outfit image"` and `accessibilityRole="button"`, minimum 44px touch target, and `hapticRigid()` fires on tap (rigid = confirm/action per haptic vocabulary). VoiceOver can discover and activate the button.

4. **Given** co-located tests exist for the share flow, **When** tests are executed, **Then** share button renders with correct accessibility props, `shareOutfit` calls `captureShareImage` then `Sharing.shareAsync`, error paths return false and don't throw, `hapticRigid` fires on press. All 5 FRs for Epic 3 are verified (FR14-FR18). `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass with 0 errors.

## Tasks / Subtasks

- [x] Task 1: Add `shareOutfit` function to `src/lib/share.ts` (AC: #2)
  - [x] 1.1 Add `shareOutfit(viewRef: React.RefObject<View>): Promise<boolean>` to existing `src/lib/share.ts`:
    ```typescript
    import * as Sharing from "expo-sharing";
    // captureShareImage already in this file

    export async function shareOutfit(
      viewRef: React.RefObject<View>,
    ): Promise<boolean> {
      try {
        const available = await Sharing.isAvailableAsync();
        if (!available) return false;

        const uri = await captureShareImage(viewRef);
        if (!uri) return false;

        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          UTI: "public.png",
        });
        return true;
      } catch {
        return false;
      }
    }
    ```
  - [x] 1.2 Add tests to existing `src/lib/share.test.ts`:
    - `shareOutfit` checks `isAvailableAsync` first — returns false if unavailable
    - `shareOutfit` calls `captureShareImage` then `Sharing.shareAsync` with mimeType/UTI options
    - Returns `true` on successful share
    - Returns `false` if `captureShareImage` returns null (capture failure)
    - Returns `false` if `Sharing.shareAsync` throws (share cancelled or failed)
    - Mock: `jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }))`

- [x] Task 2: Add Share Outfit button to OutfitVisualizer screen (AC: #1, #3)
  - [x] 2.1 In `src/screens/OutfitVisualizer.tsx`:
    - Import `{ shareOutfit }` from `@/lib/share`, `{ hapticRigid }` from `@/lib/haptics`, `{ Alert }` from `react-native`, `{ useState }` from `react`
    - Add `const [sharing, setSharing] = useState(false)` to prevent double-tap
    - Add `handleShare` callback:
      ```typescript
      const handleShare = useCallback(async () => {
        if (sharing) return;
        hapticRigid();
        setSharing(true);
        const success = await shareOutfit(shareViewRef);
        setSharing(false);
        if (!success) {
          Alert.alert(
            "Unable to share",
            "Something went wrong generating the image. Please try again.",
          );
        }
      }, [sharing]);
      ```
    - Render share button below MiniPaletteStrip, inside the existing centered content View:
      ```tsx
      <Pressable
        onPress={handleShare}
        disabled={sharing}
        accessibilityLabel="Share outfit image"
        accessibilityRole="button"
        className="mt-4 rounded-full bg-elevated px-6 py-3"
        style={{ opacity: sharing ? 0.5 : 1 }}
      >
        <Text className="font-sans text-sm font-medium text-primary">
          Share Outfit
        </Text>
      </Pressable>
      ```
    - NOTE: Use `className` for static layout, `style` only for dynamic `opacity` based on `sharing` state
    - NOTE: Button uses `bg-elevated` (#ffffff) with rounded-full for the CTA style — keeps Wada aesthetic (no bright colors on buttons)
  - [x] 2.2 Add `Pressable` to the `react-native` import at top of file (already imports View, Text, etc.)
  - [x] 2.3 Add `useState` to the `react` import (already imports useCallback, useRef)

- [x] Task 3: Add/update tests for OutfitVisualizer share integration (AC: #4)
  - [x] 3.1 In existing `src/screens/OutfitVisualizer.test.tsx`:
    - Add mock for `@/lib/share`: `const mockShareOutfit = jest.fn(); jest.mock("@/lib/share", () => ({ shareOutfit: (...args) => mockShareOutfit(...args) }))`
    - Add mock for `hapticRigid`: extend existing haptics mock to include `hapticRigid`
    - Add mock for `Alert.alert`: already available from react-native mock
    - Tests to add:
      - "renders Share Outfit button with correct accessibility" — verify `accessibilityLabel="Share outfit image"` and `accessibilityRole="button"` exist
      - "fires hapticRigid when share button pressed" — press button, verify hapticRigid called
      - "calls shareOutfit when share button pressed" — press button, verify shareOutfit called with ref-like arg
      - "shows alert when shareOutfit returns false" — mockShareOutfit resolves false, press button, verify Alert.alert called with "Unable to share"
      - "does not show alert when shareOutfit succeeds" — mockShareOutfit resolves true, press button, verify Alert.alert NOT called
  - [x] 3.2 Reset new mocks in beforeEach block

- [x] Task 4: Verify all checks pass + AC verification (AC: #1, #2, #3, #4)
  - [x] 4.1 Run `npx tsc --noEmit` — 0 errors
  - [x] 4.2 Run `pnpm lint` — 0 errors
  - [x] 4.3 Run `pnpm test` — all tests pass, 0 failures (237 tests, 23 suites)
  - [x] 4.4 Point-by-point AC verification:
    - [x] AC1: Share button visible, tap triggers capture → Share Sheet in ≤2 taps, Alert on failure
    - [x] AC2: `shareOutfit` checks availability, captures image, calls shareAsync with mimeType/UTI, try/catch returns boolean
    - [x] AC3: Button has `accessibilityLabel="Share outfit image"`, `accessibilityRole="button"`, 44px+ target (py-3 = 12px×2 + text ~20px = 44px+), hapticRigid on press
    - [x] AC4: Tests cover button render, haptic, share flow, error alert, success path. tsc/lint/test all pass

## Dev Notes

### Architecture Evolution — What the Epics Reference vs Reality

The epics reference components that no longer exist after Story 2.5 Skia rewrite:

| Epics Reference | Current Implementation |
|----------------|----------------------|
| OutfitMannequin | **OutfitCard** (Skia-based, editorial card) |
| PaletteBar | **MiniPaletteStrip** |
| "Share Outfit" CTA | **Does not exist yet** — this story creates it |

### Dependencies Already Installed — NO `npx expo install` Needed

- `expo-sharing`: ~55.0.11 — already in package.json, provides `Sharing.shareAsync()` and `Sharing.isAvailableAsync()`
- `react-native-view-shot`: 4.0.3 — already installed, used by Story 3.1's `captureShareImage()`

### What Story 3.1 Already Built (DO NOT RECREATE)

- `src/components/SharePreview.tsx` — Off-screen 9:16 capture view with RN Image + tintColor
- `src/lib/share.ts` — `captureShareImage(viewRef)` function that calls `captureRef()` with 1080×1920 PNG config
- `__mocks__/react-native-view-shot.js` — Jest mock returning `"file:///mock-path.png"`
- SharePreview is already mounted in `OutfitVisualizer.tsx` with `shareViewRef` ref — ready to capture

### expo-sharing API (expo SDK 55)

```typescript
import * as Sharing from "expo-sharing";

// Check if sharing is available on device
await Sharing.isAvailableAsync(); // returns boolean

// Share a local file
await Sharing.shareAsync(fileUri, {
  mimeType: "image/png",   // MIME type for the file
  UTI: "public.png",       // iOS Uniform Type Identifier
});
// Opens native UIActivityViewController
// Resolves when user dismisses the Share Sheet (regardless of whether they shared)
// Throws if file doesn't exist or sharing unavailable
```

**CRITICAL**: `Sharing.shareAsync` requires a **local file URI** (not a base64 string, not a remote URL). `captureShareImage` already returns a local file URI from `captureRef`. The UTI `"public.png"` ensures iOS handles the file correctly for all share targets.

### Haptic Choice: `hapticRigid()` — NOT `hapticMedium()`

Per the project's haptic vocabulary (architecture doc + lib/haptics.ts):
- `hapticLight()` — selection feedback (tab switch, favorite toggle)
- `hapticMedium()` — swap/change feedback (garment color swap, variant cycle)
- `hapticRigid()` — confirm/action feedback (share initiation, purchase confirmation)

Share is a **confirm action**, not a selection or swap. Use `hapticRigid()`.

### Share Button Design — Wada Aesthetic

The UX spec says "Share Outfit" CTA prominent at bottom. For Wada aesthetic consistency:
- Use `bg-elevated` (#ffffff) with `rounded-full` — pill shape, clean
- `font-sans text-sm font-medium text-primary` — Inter medium, subtle
- `mt-4` spacing from MiniPaletteStrip
- `px-6 py-3` — comfortably exceeds 44px minimum touch target
- NO bright/accent colors — Wada aesthetic is subtle, warm, paper-like
- Position: below MiniPaletteStrip, above SharePreview (off-screen), inside the centered content View

### Double-Tap Prevention

Use `useState` boolean (`sharing`) to prevent multiple simultaneous share attempts. While `shareOutfit` is async (capture + Share Sheet), the user could tap again before it resolves. The `disabled` prop + opacity visual feedback prevent this.

### Error Handling Strategy

Three failure points, all handled:
1. **Device doesn't support sharing** → `isAvailableAsync()` returns false → `shareOutfit` returns false → Alert
2. **Image capture fails** → `captureShareImage` returns null → `shareOutfit` returns false → Alert
3. **Sharing.shareAsync throws** → try/catch → `shareOutfit` returns false → Alert

The Alert message is generic ("Unable to share") because the user doesn't need to know which step failed. They just need to know they can try again.

### Jest Mock for expo-sharing

Create the mock inline in test files (same pattern as existing mocks):
```typescript
const mockIsAvailable = jest.fn();
const mockShareAsync = jest.fn();
jest.mock("expo-sharing", () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailable(...args),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));
```

Do NOT create `__mocks__/expo-sharing.js` — the inline mock is sufficient and keeps mocks co-located with tests that use them.

### Testing Async Share Flow

The share button handler is async. In tests, use `waitFor` or `act` to handle the async state updates:
```typescript
import { act, fireEvent, waitFor } from "@testing-library/react-native";

// After pressing share button, need to flush promises
await act(async () => {
  fireEvent.press(shareButton);
});
// Now can assert on mock calls
```

### Files Modified/Created by This Story

- `src/lib/share.ts` — MODIFIED: Add `shareOutfit()` function (import expo-sharing)
- `src/lib/share.test.ts` — MODIFIED: Add tests for `shareOutfit()`
- `src/screens/OutfitVisualizer.tsx` — MODIFIED: Add share button + handler + imports
- `src/screens/OutfitVisualizer.test.tsx` — MODIFIED: Add share button tests

**NO new files.** This story only modifies existing files.

### Existing Test Patterns to Follow

- OutfitVisualizer.test.tsx has ~30 tests — mock pattern for navigation, colorIndex, haptics, AccessibilityInfo already established. Follow the same patterns.
- share.test.ts has 3 tests — extend with shareOutfit tests using same mock structure.
- Use `getAllByText` where text may be duplicated between visible screen and off-screen SharePreview.
- Use `includeHiddenElements: true` when querying elements inside `accessibilityElementsHidden` wrappers.

### What This Story Does NOT Include

- **No square (1:1) format** — UX spec mentions it but epics AC only specifies 9:16. Defer to future story.
- **No format picker UI** — Only one export format (9:16 Instagram Stories). No user choice needed.
- **No share count analytics** — Privacy label declares "Data Not Collected".
- **No custom share destinations** — Native Share Sheet handles all destinations automatically.

### Previous Story Intelligence (Story 3.1)

Key learnings from Story 3.1:
- **react-native-view-shot mock** already exists at `__mocks__/react-native-view-shot.js`
- **SharePreview accessibility**: Wrapped in `accessibilityElementsHidden` to prevent VoiceOver reading off-screen content — the share button must be OUTSIDE this wrapper
- **Test duplicate text**: Many tests use `getAllByText` because SharePreview duplicates visible text. This continues to be true — new tests should account for it.
- **Code review findings from 3.1**: VoiceOver leak was the only HIGH finding. This story's share button must have proper a11y labels.

### Git Intelligence

Branch: `story-3.1-share-image-generation` (current branch, Story 3.1 done). Create new branch `story-3.2-native-share-sheet` from `epic-3` branch, or continue on same branch if preferred.

Recent commits:
```
0ff2243 feat: SharePreview capture component and share utility with code review fixes (Story 3.1)
9cf2960 feat: swipe gesture variant cycling, extended garment rotation, and visual polish
```

### Project Structure Notes

- All modifications align with existing project structure — no new directories
- `src/lib/share.ts` is the planned architecture location for share flow (per architecture doc)
- Share button in OutfitVisualizer follows pattern of other interactive elements (Pressable + a11y + haptics)
- No conflicts with unified project structure

### References

- [Source: docs/planning/epics.md#Epic 3 Story 3.2] — Original AC and story definition
- [Source: docs/planning/prd-react-native-ios.md#FR14-FR18] — Functional requirements for sharing
- [Source: docs/planning/architecture-react-native-ios.md#Share flow] — `react-native-view-shot → expo-sharing (UIActivityViewController)`
- [Source: docs/planning/ux-design-specification-ios.md#10. SharePreview] — UX component spec
- [Source: docs/planning/ux-design-specification-ios.md#Outfit Visualizer flow] — "2-tap share" flow definition
- [Source: src/screens/OutfitVisualizer.tsx] — Current screen with shareViewRef ready
- [Source: src/lib/share.ts] — Existing captureShareImage function
- [Source: src/lib/haptics.ts] — hapticRigid for confirm/action feedback
- [Source: _bmad-output/implementation-artifacts/3-1-share-image-generation-and-branding.md] — Previous story with code review learnings
- [Source: docs/project-context.md] — Established patterns and project structure

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed TypeScript error: `RefObject<View | null>` needed for `useRef<View>(null)` compatibility (React 19 types)
- Fixed Biome lint: import ordering (expo-sharing before react-native) and formatting (jest.spyOn inline)
- Merged Story 3.1 branch into story-3.2 branch (was not yet merged into epic-3)

### Completion Notes List

- Added `shareOutfit()` function to `src/lib/share.ts` — checks `isAvailableAsync()`, captures image, calls `shareAsync` with PNG mimeType/UTI, full try/catch returning boolean
- Added "Share Outfit" Pressable button to OutfitVisualizer with Wada aesthetic (white pill, Inter medium)
- Share button positioned as absolute overlay (`bottom: 48`) to stay outside the capture area
- Double-tap prevention via `sharing` state + `disabled` prop + opacity feedback
- `hapticRigid()` fires on share tap (confirm/action vocabulary)
- `Alert.alert` shown on failure, never crashes
- 3 unit tests for `captureShareImage` + 5 for `shareOutfit` in `share.test.ts`
- 5 integration tests in `OutfitVisualizer.test.tsx` (a11y props, haptic, share flow, alert on failure, no alert on success)
- All 237 tests pass, 0 tsc errors, 0 lint errors

### Fix: Share Capture — On-Screen Instead of Off-Screen SharePreview

> **REVIEW NOTE**: This fix was applied during Story 3.2 development after manual QA testing.
>
> **Problem (Story 3.1 bug):** The off-screen `SharePreview` component (RN `Image` + `tintColor`)
> produced captures with no shadows, wrong proportions (fixed 360×640), and misaligned layout
> compared to the actual on-screen Skia-rendered content.
>
> **Root causes identified:**
> 1. `SharePreview` was a simplified RN-only recreation that couldn't match Skia rendering (no shadows, no aureola)
> 2. `useRenderInContext: true` in `captureRef` ignored `width`/`height` options → captured at 360×640 native size
> 3. Missing `collapsable={false}` caused RN to optimize away the off-screen view
>
> **Solution applied:**
> - **Removed off-screen SharePreview** from OutfitVisualizer render tree (component file preserved but unused)
> - **Moved `shareViewRef`** to wrap the on-screen visual content (WarmBackground + Aureola + WadaHeader + OutfitCard + MiniPaletteStrip + branding)
> - **Share button as absolute overlay** at `bottom: 48` so it's visually present but excluded from capture
> - **`captureRef` simplified**: removed `useRenderInContext` (not needed for on-screen content), uses `PixelRatio.get()` for device-native resolution (adapts to any iPhone)
> - **Added `collapsable={false}`** to capturable View for safety
> - **Added "Outfinder" branding** text inside capture area (replaces SharePreview's footer branding)
>
> **Files changed by fix:**
> - `src/screens/OutfitVisualizer.tsx` — restructured render tree, removed SharePreview import
> - `src/lib/share.ts` — simplified captureRef options, uses PixelRatio
> - `src/components/SharePreview.tsx` — added `collapsable={false}` (component now unused but preserved)
> - Tests updated to reflect new structure

### Change Log

- 2026-03-17: Implemented native share sheet integration — `shareOutfit()` function + Share Outfit button + 10 new tests (Story 3.2)
- 2026-03-17: Fix — replaced off-screen SharePreview capture with direct on-screen content capture for correct proportions, shadows, and device-adaptive resolution

### File List

- `src/lib/share.ts` — MODIFIED: Added `shareOutfit()`, `captureShareImage` uses `PixelRatio.get()` for device-native resolution
- `src/lib/share.test.ts` — MODIFIED: 8 tests (3 captureShareImage + 5 shareOutfit), expo-sharing mock
- `src/screens/OutfitVisualizer.tsx` — MODIFIED: Share button + handler, capture ref on on-screen content, removed SharePreview, added Outfinder branding
- `src/screens/OutfitVisualizer.test.tsx` — MODIFIED: 5 share button tests, replaced SharePreview test with branding test
- `src/components/SharePreview.tsx` — MODIFIED: Added `collapsable={false}` (component preserved but no longer imported)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Story 3-2 status → review
- `_bmad-output/implementation-artifacts/3-2-native-share-sheet-integration.md` — MODIFIED: Tasks, Dev Agent Record, File List, Change Log, Status
