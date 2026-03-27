---
title: 'Visualizer Interaction Affordances'
slug: 'visualizer-interaction-affordances'
created: '2026-03-27'
status: 'review'
stepsCompleted: [1, 2, 3, 4]
tech_stack: [react-native, reanimated-4, react-native-gesture-handler, asyncstorage, shopify-react-native-skia, nativewind-4]
files_to_modify: [src/components/OutfitCard.tsx, src/screens/OutfitVisualizer.tsx, src/components/OutfitCard.test.tsx, src/screens/OutfitVisualizer.test.tsx]
code_patterns: [reanimated-shared-values, useAnimatedStyle, withTiming, withRepeat, withSpring, reduce-motion-guard, asyncstorage-flags, pressable-render-children, gesture-detector-pan]
test_patterns: [react-native-testing-library, jest-mock-modules, fireEvent-press, accessibilityLabel-queries, asyncstorage-mock, useReducedMotion-mock]
---

# Tech-Spec: Visualizer Interaction Affordances

**Created:** 2026-03-27

## Overview

### Problem Statement

The Outfit Visualizer's core interactions — tap-to-swap garment colors and swipe-to-change garment style — are completely invisible to users. Two independent user reports confirm:
1. Abraham García: "Cuando eliges los colores me pierdo un poco, no sé si camiseta o pantalón o zapatillas" — can't tell which garment is active.
2. Second user: Believes you flat out cannot change the color of shirt or pants — didn't discover the swap mechanic at all.

The current selected-state indicator (2px pulsing black border) is too subtle and looks like a rendering artifact rather than an intentional affordance. There is zero indication that swiping changes garment variants.

### Solution

Three complementary affordance layers that teach and reinforce the Visualizer's interactions:
1. **First-visit tooltip** with dark scrim overlay teaching both mechanics (tap swap + swipe variant)
2. **Gold underline bar** replacing the current black border as the selected-garment indicator
3. **Chevron hints** outside the card showing swipe direction on the selected garment

### Scope

**In Scope:**
- First-visit tooltip overlay with scrim (outside shareViewRef, AsyncStorage-persisted)
- Gold underline bar (#c4a265 premiumAccent) replacing current black border on selected garment
- Chevron indicators (‹ ›) outside the white outfit card for the selected garment
- Reduce Motion support for all animations
- Tests for all three components

**Out of Scope:**
- Text label/pill showing garment name (redundant — user can see it's a t-shirt)
- Any changes to the share flow or capturable area
- Changes to the tap-swap or swipe-variant logic itself
- Story 7.3 TintedGarment fallback (separate spec)

## Context for Development

### Codebase Patterns

**Animation pattern (Reanimated 4):**
- `useSharedValue` + `useAnimatedStyle` for all animations
- `useReducedMotion()` hook checked before every animation — skip entirely when enabled
- `withRepeat(withSpring(...), -1, true)` for pulsing/breathing effects
- `withTiming(value, { duration: N })` for transitions
- `Animated.View` wraps animated elements

**Selected state (current — to be replaced):**
- `CardSlot` in `OutfitCard.tsx:40-174` manages selection via `borderOpacity` shared value
- Current: `borderWidth: 2, borderColor: rgba(0,0,0, opacity*0.8)` with pulsing animation
- This is what users don't see — needs to become the gold underline bar

**Gesture handling:**
- `Gesture.Pan()` with `activeOffsetX` and `failOffsetY` thresholds
- `runOnJS(triggerCycle)` bridges worklet to JS for variant changes
- Slide animation: `translateX` + `slideOpacity` shared values for exit/enter effect

**AsyncStorage convention:**
- Keys prefixed `@outfinder/` followed by camelCase noun (e.g., `@outfinder/favorites`)
- Read on mount, write with try/catch
- Only one key currently: `@outfinder/favorites` in FavoritesContext

**Component structure:**
- `OutfitVisualizer.tsx` = screen (route params, state, handlers, layout)
- `OutfitCard.tsx` = card container + `CardSlot` sub-component (rendering, animation, gestures)
- `useOutfitState.ts` = slots, selection, swap, variant cycling logic
- Share button is already outside `shareViewRef` — tooltip follows same pattern

**Test patterns:**
- Module mocks at top: `@react-navigation/native`, `@/data/colorIndex`, `@/lib/haptics`, `@/hooks/useReducedMotion`
- `AccessibilityInfo` mock for VoiceOver announcements
- Queries by `accessibilityLabel` (not testID for these components)
- `fireEvent.press` for taps, `fireEvent(el, "accessibilityAction", ...)` for variant cycling
- `makeColor()` and `makeSlots()` helpers for test data

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/screens/OutfitVisualizer.tsx` | Screen: route params, outfit state, handlers (handleSlotTap, handleVariantCycle, handleShare), layout with shareViewRef |
| `src/components/OutfitCard.tsx` | Card + CardSlot: TintedGarment rendering, selection border animation, swipe gesture, variant slide animation |
| `src/hooks/useOutfitState.ts` | Slot state, selectSlot (swap logic), cycleVariant, getCycleForGarment |
| `src/hooks/useReducedMotion.ts` | AccessibilityInfo.isReduceMotionEnabled() + listener |
| `src/styles/theme.ts` | wadaTokens including premiumAccent (#c4a265), wadaMuted (#a09080), bgPaper (#fafaf8) |
| `src/components/TintedGarment.tsx` | Skia Canvas + ColorMatrix garment rendering |
| `src/screens/OutfitVisualizer.test.tsx` | 30 tests: rendering, swaps, haptics, VoiceOver, share |
| `src/components/OutfitCard.test.tsx` | 15 tests: slot rendering, tap/cycle callbacks, a11y |

### Technical Decisions

- **Tooltip placement:** Absolute overlay outside `shareViewRef`, same layer as Share button. Uses `position: "absolute"` with `zIndex: 10` covering the screen, with a semi-transparent black scrim (`rgba(0,0,0,0.5)`) and a centered instruction box.
- **Tooltip text:** English only. Two instructions: tap-to-swap + swipe-to-change-style.
- **Tooltip persistence:** `@outfinder/hintSeen` in AsyncStorage (camelCase, consistent with `@outfinder/favorites`). Read on mount, write after dismiss. Show once per install.
- **Tooltip dismiss:** Tap anywhere on scrim OR auto-dismiss after 8 seconds. Reduce Motion: same 8s duration (reduce motion ≠ reduce reading time), but show/hide instantly without fade animation.
- **Tooltip VoiceOver:** On tooltip appearance, call `AccessibilityInfo.announceForAccessibility("Tap a garment to swap its color. Swipe left or right to change garment style.")` so screen reader users hear the instructions. The Pressable wrapping the scrim has `accessibilityLabel` containing the full instructional text + "Tap to dismiss".
- **Underline bar:** Replaces the current border in CardSlot. See Task 1 for exact JSX before/after structure.
- **Chevrons position:** Rendered in `OutfitVisualizer.tsx` inside a wrapper View around `OutfitCard`. This avoids ScrollView overflow clipping issues entirely. Chevrons are positioned absolutely on left/right sides of the wrapper, vertically centered. `hasSwipedInSession` state lives in OutfitVisualizer.
- **Chevron lifecycle:** Session-only React state (`hasSwipedInSession`) in OutfitVisualizer. Appear when a garment is selected, disappear after first successful variant cycle. Reset on screen remount.

## Implementation Plan

### Tasks

- [x] Task 1: Replace black border with gold underline bar in CardSlot
  - File: `src/components/OutfitCard.tsx`
  - Action: In `CardSlot` component, transform the selected-state indicator:

  **BEFORE (current JSX structure in CardSlot return):**
  ```tsx
  <Pressable ... onPress={onTap}>
    {({ pressed }) => (
      <Animated.View style={[borderStyle, { opacity: pressed ? 0.88 : 1, alignItems: "center" }]}>
        <Animated.View style={slideStyle}>
          <TintedGarment ... />
        </Animated.View>
      </Animated.View>
    )}
  </Pressable>
  ```

  **AFTER (new JSX structure):**
  ```tsx
  <Pressable ... onPress={onTap}>
    {({ pressed }) => (
      <View style={{ opacity: pressed ? 0.88 : 1, alignItems: "center" }}>
        <Animated.View style={slideStyle}>
          <TintedGarment ... />
        </Animated.View>
        <Animated.View
          testID="underline-bar"
          style={[{
            height: 4,
            width: 132,
            alignSelf: "center",
            borderRadius: 2,
            backgroundColor: wadaTokens.premiumAccent,
            marginTop: 4,
          }, underlineStyle]}
        />
      </View>
    )}
  </Pressable>
  ```

  Animation changes:
  1. Rename `borderOpacity` → `underlineOpacity`, initialize with `useSharedValue(0.5)` (NOT 0).
  2. Replace `borderStyle` animated style with `underlineStyle`: `useAnimatedStyle(() => ({ opacity: underlineOpacity.value }))`
  3. Replace the `useEffect` animation:
     - When `isSelected` and NOT reducedMotion: `underlineOpacity.value = withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0.5, { duration: 800 })), -1)` — this pulses between 0.5 and 1.0.
     - When `isSelected` and reducedMotion: `underlineOpacity.value = 1` (static).
     - When NOT selected: `underlineOpacity.value = withTiming(0, { duration: 150 })`.
  4. Remove the outer `Animated.View` with `borderStyle` — replace with a plain `View`. The border is gone entirely (no transparent border hack needed). The Animated.View wrapper served no purpose beyond the border animation.
  5. Import `withSequence` from `react-native-reanimated`.

- [x] Task 2: Add chevron affordance indicators in OutfitVisualizer
  - File: `src/screens/OutfitVisualizer.tsx`
  - Action:
    1. Add `hasSwipedInSession` state (`useState(false)`) in `OutfitVisualizer`.
    2. Wrap the existing `<OutfitCard ... />` in a `<View style={{ position: "relative" }}>`. Inside this wrapper, after OutfitCard, conditionally render two chevron `Animated.Text` elements:
       ```tsx
       {selectedSlotIndex !== null && (
         <>
           <Animated.Text
             style={[{ position: "absolute", left: -20, top: "45%", fontSize: 20, color: wadaTokens.wadaMuted }, chevronStyle]}
             accessibilityElementsHidden={true}
           >
             ‹
           </Animated.Text>
           <Animated.Text
             style={[{ position: "absolute", right: -20, top: "45%", fontSize: 20, color: wadaTokens.wadaMuted }, chevronStyle]}
             accessibilityElementsHidden={true}
           >
             ›
           </Animated.Text>
         </>
       )}
       ```
    3. Add `chevronOpacity` shared value (`useSharedValue(0)`) and `chevronStyle` animated style: `useAnimatedStyle(() => ({ opacity: chevronOpacity.value }))`.
    4. Add `useEffect` watching `selectedSlotIndex` and `hasSwipedInSession`:
       - If `selectedSlotIndex !== null && !hasSwipedInSession`: animate `chevronOpacity` to 0.3 (`withTiming(0.3, { duration: 200 })`, or instant if reducedMotion).
       - Otherwise: animate to 0 (`withTiming(0, { duration: 300 })`, or instant if reducedMotion).
    5. Modify `handleVariantCycle` callback: after calling `cycleVariant(index, direction)`, also call `setHasSwipedInSession(true)` if not already true.
    6. Import `useReducedMotion` from `@/hooks/useReducedMotion` (not currently imported in OutfitVisualizer).
    7. Import `Animated, useSharedValue, useAnimatedStyle, withTiming` from `react-native-reanimated`.

- [x] Task 3: Add first-visit tooltip overlay to OutfitVisualizer
  - File: `src/screens/OutfitVisualizer.tsx`
  - Action:
    1. Add state: `const [hintSeen, setHintSeen] = useState(true)` (default true = hidden, prevents flash).
    2. Add a `dismissedRef = useRef(false)` to guard against double-dismiss (tap + setTimeout race).
    3. Add `useEffect` on mount (empty deps `[]`): read `AsyncStorage.getItem("@outfinder/hintSeen")`. If result is NOT `"true"`, call `setHintSeen(false)`. Wrap in try/catch.
    4. Add `dismissHint` function: check `if (dismissedRef.current) return`. Set `dismissedRef.current = true`. Set `hintSeen = true`. Write `AsyncStorage.setItem("@outfinder/hintSeen", "true")` (try/catch). If NOT reducedMotion, animate `tooltipOpacity` to 0 with `withTiming(0, { duration: 300 })`. If reducedMotion, set `tooltipOpacity.value = 0` instantly.
    5. Add `useEffect` for auto-dismiss with dependency `[hintSeen]`: when `!hintSeen`, start `const timer = setTimeout(dismissHint, 8000)`. Return cleanup `() => clearTimeout(timer)`. Same 8s for both regular and Reduce Motion (reduce motion ≠ reduce reading time).
    6. Add `tooltipOpacity` shared value (`useSharedValue(1)`) and `tooltipAnimStyle`: `useAnimatedStyle(() => ({ opacity: tooltipOpacity.value }))`.
    7. When `!hintSeen`, call `AccessibilityInfo.announceForAccessibility("Tap a garment to swap its color. Swipe left or right to change garment style.")` in the mount useEffect (after setting hintSeen to false).
    8. Render the tooltip **outside** `shareViewRef`, **after** the Share button View, as an absolute overlay:
       ```tsx
       {!hintSeen && (
         <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }, tooltipAnimStyle]}>
           <Pressable
             style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
             onPress={dismissHint}
             accessibilityLabel="Tap a garment to swap its color. Swipe left or right to change garment style. Tap to dismiss."
             accessibilityRole="button"
           >
             <View style={{ backgroundColor: "#1a1a1a", borderRadius: 12, padding: 24, marginHorizontal: 40, maxWidth: 300 }}>
               <Text style={{ color: "#fafaf8", fontFamily: "Inter_500Medium", fontSize: 15, textAlign: "center", lineHeight: 22 }}>
                 Tap a garment to swap its color{"\n\n"}Swipe left or right to change garment style
               </Text>
             </View>
           </Pressable>
         </Animated.View>
       )}
       ```
    9. Import `AsyncStorage` from `@react-native-async-storage/async-storage`.

- [x] Task 4: Tests for all three components
  - File: `src/components/OutfitCard.test.tsx`
  - Action:
    1. **Underline tests:** Add test "selected slot renders underline bar" — render with `selectedSlotIndex={0}`, query `screen.getByTestId("underline-bar")`, assert it exists. Add test "non-selected slot does not show underline bar" — render with `selectedSlotIndex={null}`, assert `screen.queryByTestId("underline-bar")` has opacity 0 (shared value at 0) or is not visible.
    2. Update existing "selected state renders correctly" test — `accessibilityState` assertions are unchanged (still `{ selected: true/false }`).
  - File: `src/screens/OutfitVisualizer.test.tsx`
  - Action:
    3. Add `AsyncStorage` mock at top: `const mockGetItem = jest.fn(); const mockSetItem = jest.fn(); jest.mock("@react-native-async-storage/async-storage", () => ({ getItem: (...args: unknown[]) => mockGetItem(...args), setItem: (...args: unknown[]) => mockSetItem(...args) }))`.
    4. **Tooltip tests:**
       - "shows hint tooltip on first visit" — mock `mockGetItem.mockResolvedValue(null)`, render, `await waitFor(() => expect(screen.getByText(/Tap a garment to swap/)).toBeTruthy())`.
       - "does not show hint when already seen" — mock `mockGetItem.mockResolvedValue("true")`, render, assert tooltip text is NOT visible.
       - "dismiss hint on press writes to AsyncStorage" — render with tooltip visible, `fireEvent.press` on the dismiss pressable (getByLabelText matching "Tap a garment to swap...")), assert `mockSetItem` called with `"@outfinder/hintSeen", "true"`.
    5. **Chevron tests:**
       - "chevrons render when a garment is selected" — render, tap a garment to select it, assert "‹" and "›" text elements exist.
       - "chevrons disappear after first variant cycle" — render, tap a garment, verify chevrons exist, then fire accessibilityAction increment, assert chevrons are gone (opacity 0 or not rendered).
    6. Reset `mockGetItem` and `mockSetItem` in `beforeEach`.

- [x] Task 5: Verification
  - Run `npx tsc --noEmit` — 0 errors
  - Run `pnpm lint` — 0 errors
  - Run `pnpm test` — all tests pass (existing + new)
  - Visual verification: open OutfitVisualizer in simulator, confirm tooltip appears on first visit, gold underline on selection, chevrons visible outside card

### Acceptance Criteria

- [x] AC 1: Given the user opens the Outfit Visualizer for the first time (no `@outfinder/hintSeen` in AsyncStorage), when the screen renders, then a dark scrim overlay appears with `zIndex: 10`, containing a centered instruction box with "Tap a garment to swap its color" and "Swipe left or right to change garment style". VoiceOver announces the instructional text. The overlay is NOT inside the share capture area.

- [x] AC 2: Given the tooltip is visible, when the user taps anywhere on the scrim OR 8 seconds elapse, then the tooltip fades out (300ms, or instant if Reduce Motion) and `@outfinder/hintSeen` is written to AsyncStorage as `"true"`. A `dismissedRef` guard prevents double-dismiss from tap+timeout race. On subsequent visits, the tooltip does not appear.

- [x] AC 3: Given the user taps a garment to select it, when the selected state activates, then a gold underline bar (4px height, premiumAccent #c4a265, 132px width, centered below garment, borderRadius 2) appears with a gentle pulse animation (opacity 0.5↔1.0 via `withSequence`+`withRepeat`). The previous black pulsing border is fully removed (no transparent border hack). If Reduce Motion: static opacity 1.0.

- [x] AC 4: Given the user taps a garment to select it and has not yet swiped in this session, when the selection activates, then thin chevron indicators (‹ ›) appear outside the white card area, rendered in OutfitVisualizer wrapper View (not inside OutfitCard), at 30% opacity. When the user performs their first swipe (variant cycle), the chevrons fade out (300ms) and do not reappear for the rest of the session. Chevrons reset on screen remount.

- [x] AC 5: Given Reduce Motion is enabled, when any affordance animation triggers (tooltip, underline, chevrons), then all transitions are instant (no fade, no pulse). Underline shows at static opacity 1.0. Chevrons appear/disappear instantly. Tooltip shows/hides without fade but keeps the same 8s auto-dismiss duration (reduce motion ≠ reduce reading time).

- [x] AC 6: Given all changes are applied, when `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, then all pass with 0 errors. New tests cover: tooltip renders/hides based on AsyncStorage, tooltip dismiss writes to AsyncStorage, underline bar renders on selection, chevrons render on selection and disappear after first swipe.

## Additional Context

### Dependencies

No new dependencies. All required libraries already installed:
- `react-native-reanimated` (animations, `withSequence` for pulse range)
- `@react-native-async-storage/async-storage` (tooltip persistence)
- `react-native-gesture-handler` (existing swipe gestures)
- `@/styles/theme.ts` — `premiumAccent` and `wadaMuted` tokens already defined

### Testing Strategy

**Unit tests (automated):**
- Tooltip: renders when AsyncStorage flag missing, hides when flag exists, dismiss writes to AsyncStorage (3 tests)
- Underline: renders with testID on selected slot, not visible when unselected (2 tests)
- Chevrons: render when selected, disappear after first swipe (2 tests)
- Total: ~7 new tests across 2 test files

**Manual testing checklist:**
- Open Visualizer for first time → tooltip appears with scrim, VoiceOver reads instructions
- Tap scrim → tooltip dismisses
- Re-open Visualizer → no tooltip
- Tap a garment → gold underline pulses (0.5→1.0) below it, no black border
- Chevrons visible outside card on left/right
- Swipe garment → variant changes, chevrons disappear
- Select another garment → underline moves, no chevrons (already swiped this session)
- Close and re-open Visualizer → chevrons reappear (session reset)
- Enable Reduce Motion → all animations are instant/static, tooltip stays 8s

### Notes

- User feedback source: 2 independent reports dated 2026-03-27
- Story 7.2 spec exists at `_bmad-output/implementation-artifacts/7-2-visualizer-interaction-affordances.md` — overlaps significantly but this spec supersedes it with refined requirements from user collaboration
- CARD_WIDTH constant is 220px (defined in OutfitCard.tsx:26), underline width = 132px (60%)
- The `selectedSlotIndex` lives in `useOutfitState` and is passed through OutfitVisualizer → OutfitCard → CardSlot
- `useReducedMotion` must be imported in OutfitVisualizer.tsx (currently only used in OutfitCard.tsx via CardSlot)

### Adversarial Review Fixes Applied

| Finding | Fix |
|---------|-----|
| F1+F3: Ambiguous/contradictory border removal | Rewritten Task 1 with explicit BEFORE/AFTER JSX. Outer Animated.View replaced with plain View. No transparent border hack. |
| F2: ScrollView clips overflow:visible | Chevrons moved to OutfitVisualizer wrapper View, outside OutfitCard entirely. No overflow:visible needed. |
| F4: Missing chevron-dismiss-after-swipe test | Added to Task 4.5: test fires accessibilityAction increment, asserts chevrons disappear. |
| F5: No VoiceOver for tooltip content | Added `AccessibilityInfo.announceForAccessibility()` on tooltip appearance. Pressable accessibilityLabel includes full instructional text. |
| F6: AsyncStorage key snake_case | Changed to `@outfinder/hintSeen` (camelCase, consistent with `@outfinder/favorites`). |
| F7: Pulse range 0→1 instead of 0.5→1 | Changed to `useSharedValue(0.5)` + `withRepeat(withSequence(withTiming(1, 800ms), withTiming(0.5, 800ms)))`. |
| F8: setTimeout double-dismiss race | Added `dismissedRef = useRef(false)` guard. Dependency array `[hintSeen]` ensures cleanup on state change. |
| F9: Tooltip z-order | Added `zIndex: 10` to tooltip overlay. |
| F10: 5s auto-dismiss too short | Increased to 8s for both regular and Reduce Motion. |
| F11: Missing useReducedMotion import | Noted in Tasks 2.6 and Notes section. |
| F12: Wrong Reanimated version | Removed specific version numbers from Dependencies. |
| F13: Stale line counts | Removed line counts from Files to Reference table. |
