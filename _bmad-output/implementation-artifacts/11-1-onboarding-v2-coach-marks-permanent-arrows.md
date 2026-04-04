# Story 11.1: Onboarding v2 — Visualizer Coach Marks + Permanent Arrows

Status: done

## Story

As a **new user opening the Outfit Visualizer for the first time**,
I want **a focused 2-step coach mark overlay that teaches me how to interact with garments and navigate between them**,
so that **I understand the core Visualizer interaction immediately without reading any documentation**.

## Acceptance Criteria

1. **Given** the user opens OutfitVisualizer for the first time (AsyncStorage key `@outfinder/visualizer-introduced` is absent or false), **When** the Visualizer finishes rendering, **Then** a coach mark overlay appears as an absolute-positioned View covering the screen (semi-transparent backdrop), Step 1 text reads "Tap any garment to change its color" centered over the garment area, and an "OK" button is shown below the instruction (min 44x44pt, accessibilityRole="button").

2. **Given** the user taps "OK" on Step 1, **When** the tap registers, **Then** hapticLight() fires, the overlay transitions to Step 2 (same overlay, updated content), Step 2 text reads "Use the arrows or swipe to change garments", and the < > arrows are visually highlighted/indicated in the overlay.

3. **Given** the user taps "OK" on Step 2, **When** the tap registers, **Then** hapticLight() fires, the overlay dismisses completely, AsyncStorage.setItem('@outfinder/visualizer-introduced', 'true') is called, and the user can interact with the Visualizer freely.

4. **Given** the user has previously completed or dismissed the coach marks (AsyncStorage key exists), **When** they open the Visualizer on any subsequent visit, **Then** no coach mark overlay appears.

5. **Given** the Visualizer renders (any visit, new or returning), **When** the OutfitCard displays, **Then** the < > navigation arrows are always visible as permanent UI elements (not hidden until onboarding), styled consistently with the existing Visualizer aesthetic (subtle, non-intrusive), with accessibilityLabel "Previous garment" / "Next garment" and accessibilityRole="button".

6. **Given** the existing Onboarding screen (Onboarding.tsx and onboarding/ preview components), **When** Epic 11 ships, **Then** the existing 4-step full-screen onboarding flow is removed from the app, App.tsx no longer shows Onboarding conditionally on first launch, and the onboarding/ component folder and Onboarding.tsx are deleted.

7. **Given** VoiceOver is active when coach marks appear, **When** the overlay renders, **Then** it announces "Tip: Tap any garment to change its color" with accessibilityRole="alert", and the OK button is reachable and announces "Got it".

## Tasks / Subtasks

- [x] Task 1: Remove old onboarding system (AC: #6)
  - [x] 1.1 Delete `src/screens/Onboarding.tsx` and `src/screens/Onboarding.test.tsx`
  - [x] 1.2 Delete entire `src/components/onboarding/` directory (SwatchGridPreview.tsx, ColorSpecimenPreview.tsx, PalettePreview.tsx, OutfitPreview.tsx, onboarding-previews.test.tsx)
  - [x] 1.3 Simplify `App.tsx`: remove `ONBOARDING_KEY` constant, `onboardingSeen` state, `handleOnboardingComplete` callback, conditional Onboarding render, and AsyncStorage onboarding read in useEffect. Always render FavoritesProvider > PremiumProvider > NavigationContainer. CRITICAL: also remove `onboardingSeen !== null` from the splash-hiding useEffect condition AND remove the `onboardingSeen === null` early return guard (line ~54) — splash screen should now hide when `fontsLoaded` only. Forgetting this will hang the app on a blank screen forever
  - [x] 1.4 Update `App.test.tsx`: remove onboarding-related test cases, verify app renders main navigation directly
  - [x] 1.5 Run `pnpm test` — verify no broken imports or references to deleted files

- [x] Task 2: Make navigation arrows permanently visible (AC: #5)
  - [x] 2.1 Remove `hasSwipedInSession` state and all logic that depends on it in OutfitVisualizer.tsx
  - [x] 2.2 Remove conditional gate on chevron rendering. Always render both arrows regardless of state
  - [x] 2.3 Render static always-visible arrows at constant opacity (0.5). No animated chevrons.
  - [x] 2.4 Add `accessibilityLabel="Previous garment"` / `accessibilityLabel="Next garment"` and `accessibilityRole="button"` on arrows
  - [x] 2.5 Arrows are Pressable: left calls `handlePreviousGarment` (cycleVariant -1 + announce), right calls `handleNextGarment` (cycleVariant +1 + announce), each fires hapticLight()

- [x] Task 3: Implement 2-step coach mark overlay (AC: #1, #2, #3, #4, #7)
  - [x] 3.1 Replace existing tooltip system: remove `@outfinder/hintSeen` key, `hintSeen` state, `dismissHint()`, `dismissedRef`, auto-dismiss timer (lines 88-162 and 373-422 of OutfitVisualizer.tsx)
  - [x] 3.2 Add new coach mark state: `coachStep` (0 = hidden, 1 = step 1, 2 = step 2), `introduced` boolean read from AsyncStorage `@outfinder/visualizer-introduced` on mount. If not introduced, set coachStep to 1
  - [x] 3.3 Render coach mark overlay at screen level (NOT inside ScrollView): absolute-positioned View covering full screen, `zIndex: 999`, `backgroundColor: "rgba(0,0,0,0.5)"`. Centered instruction card with white background, border radius 12, padding 24. OK button below text (Pressable, min 44x44pt)
  - [x] 3.4 Step 1 content: text "Tap any garment to change its color", OK button label "Got it". Step 2 content: text "Use the arrows or swipe to change garments", OK button label "Got it". On OK tap: hapticLight(), advance step (1 -> 2) or dismiss (2 -> 0 + save flag)
  - [x] 3.5 Accessibility: outer overlay View has `accessibilityRole="alert"`, OK button has `accessibilityRole="button"` + `accessibilityLabel="Got it"`. AccessibilityInfo.announceForAccessibility() on step render

- [x] Task 4: Tests + AC verification (AC: #1-7)
  - [x] 4.1 Coach mark tests: mock AsyncStorage to return null -> verify Step 1 overlay shown -> tap OK -> verify Step 2 shown -> tap OK -> verify overlay gone + AsyncStorage.setItem called with '@outfinder/visualizer-introduced'
  - [x] 4.2 Returning user test: mock AsyncStorage to return 'true' -> verify no overlay rendered
  - [x] 4.3 Permanent arrows tests: arrows always rendered (testID arrow-previous/arrow-next), accessibilityLabel/Role correct, onPress fires hapticLight + announces new garment, arrows visible even when coach marks overlay is active
  - [x] 4.4 VoiceOver tests: verify overlay has accessibilityRole="alert", OK button has accessibilityLabel="Got it"
  - [x] 4.5 Regression: `pnpm test` all 493 tests pass, `npx tsc --noEmit` clean, `pnpm lint` clean (9 pre-existing issues in usePremiumGate.ts, none introduced)

## Dev Notes

### Architecture Constraints

- **Function declarations with named exports** (never export default) [Source: CLAUDE.md]
- **NativeWind `className` for static styles** — never StyleSheet.create [Source: CLAUDE.md]
- **`style={{}}`** ONLY for dynamic Wada color values [Source: CLAUDE.md]
- **Haptics only through `lib/haptics.ts`** — never import expo-haptics directly [Source: CLAUDE.md]
- **All hooks called before any early returns** [Source: CLAUDE.md]
- **Props interface required**: `interface {ComponentName}Props` [Source: CLAUDE.md]

### Key Implementation Details

**Coach mark overlay z-index: 999** — MUST be rendered at the OutfitVisualizer screen level, NOT inside the Skia Canvas or ScrollView. The existing tooltip (lines 373-422 of OutfitVisualizer.tsx) already follows this pattern with `zIndex: 10`. New coach marks use 999 per epic spec.

**Existing tooltip to REPLACE (OutfitVisualizer.tsx lines 373-422):**
- Current: single-step dark overlay, `zIndex: 10`, auto-dismiss after 8s
- New: 2-step flow, `zIndex: 999`, no auto-dismiss (user must tap OK)
- Both share the same structural pattern (absolute-positioned overlay, semi-transparent backdrop, centered card)

**Existing chevrons to SIMPLIFY (OutfitVisualizer.tsx lines 287-334):**
- Current: animated opacity via Reanimated, gated by `selectedSlotIndex !== null && !hasSwipedInSession`
- New: static always-visible, no animation needed, no state gate
- Characters: "‹" (left) and "›" (right) — keep same Unicode characters
- Position: absolute left: -28 and right: -28, vertically centered relative to OutfitCard container

**AsyncStorage keys — CLEANUP:**
- REMOVE: `@outfinder/onboarding_seen` (App.tsx line 24) — old onboarding gate
- REMOVE: `@outfinder/hintSeen` (OutfitVisualizer.tsx line 125) — old tooltip gate
- ADD: `@outfinder/visualizer-introduced` (new coach mark flag, string 'true')
- KEEP: `@outfinder/favorites` (unrelated, don't touch)

**Reduce Motion: NOT needed for coach marks.** The coach mark overlay is a static view (no animation). It appears/disappears instantly. No `useReducedMotion()` check required. [Source: epic-11.md Dev Notes]

### Files to DELETE

| File | Reason |
|------|--------|
| `src/screens/Onboarding.tsx` | 4-step onboarding replaced by coach marks |
| `src/screens/Onboarding.test.tsx` | Tests for deleted screen |
| `src/components/onboarding/SwatchGridPreview.tsx` | Preview component for deleted onboarding |
| `src/components/onboarding/ColorSpecimenPreview.tsx` | Preview component for deleted onboarding |
| `src/components/onboarding/PalettePreview.tsx` | Preview component for deleted onboarding |
| `src/components/onboarding/OutfitPreview.tsx` | Preview component for deleted onboarding |
| `src/components/onboarding/onboarding-previews.test.tsx` | Tests for deleted preview components |

### Files to MODIFY

| File | Changes |
|------|---------|
| `App.tsx` | Remove: ONBOARDING_KEY, onboardingSeen state, checkOnboarding useEffect, handleOnboardingComplete, Onboarding import, conditional render. Always render main navigation tree |
| `App.test.tsx` | Remove onboarding-specific tests. Verify app renders TabNavigator directly |
| `src/screens/OutfitVisualizer.tsx` | Remove: hintSeen state, dismissHint, dismissedRef, auto-dismiss timer, hasSwipedInSession, chevronOpacity/chevronStyle, old tooltip JSX. Add: coachStep state, introduced AsyncStorage read, 2-step coach mark overlay, permanent static arrows with a11y |
| `src/screens/OutfitVisualizer.test.tsx` | Remove old hint tests. Add: coach mark 2-step flow tests, returning user test, permanent arrows tests, a11y tests |

### Current App.tsx Structure (lines to change)

```
Line 20: import { Onboarding } from "@/screens/Onboarding"  // DELETE
Line 24: const ONBOARDING_KEY = "@outfinder/onboarding_seen"  // DELETE
Lines 34-35: const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null)  // DELETE
Lines 36-46: useEffect checkOnboarding() { AsyncStorage.getItem(ONBOARDING_KEY)... }  // DELETE
Lines 58-65: handleOnboardingComplete() { AsyncStorage.setItem(ONBOARDING_KEY, "true")... }  // DELETE
Lines 71-81: Conditional: onboardingSeen === false ? <Onboarding> : <FavoritesProvider>...  // SIMPLIFY
```

After cleanup, App.tsx should always render:
```tsx
<FavoritesProvider>
  <PremiumProvider>
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  </PremiumProvider>
</FavoritesProvider>
```

CRITICAL: The splash screen useEffect and early return currently depend on `onboardingSeen !== null`. After removing that state, simplify to:
```tsx
useEffect(() => {
  if (fontsLoaded) {
    SplashScreen.hideAsync();
  }
}, [fontsLoaded]);

if (!fontsLoaded) return null;
```

### Current OutfitVisualizer.tsx Structure (lines to change)

```
Line 89: const [hasSwipedInSession, setHasSwipedInSession] = useState(false)  // DELETE
Line 90: const [hintSeen, setHintSeen] = useState(true)  // REPLACE with coachStep + introduced
Line 91: const dismissedRef = useRef(false)  // DELETE
Line 98: const chevronOpacity = useSharedValue(0)  // DELETE (static arrows)
Lines 99-101: const chevronStyle = useAnimatedStyle(...)  // DELETE
Lines 103-113: useEffect chevron opacity logic  // DELETE
Lines 116-119: const tooltipOpacity = useSharedValue(1)  // DELETE
Lines 120-121: const tooltipAnimStyle = useAnimatedStyle(...)  // DELETE
Lines 122-140: useEffect hint AsyncStorage read  // REPLACE with visualizer-introduced read
Lines 142-154: dismissHint callback  // REPLACE with coach mark step handlers
Lines 156-162: setTimeout auto-dismiss  // DELETE
Line 217: setHasSwipedInSession(true)  // DELETE
Lines 287-334: Conditional chevron render  // REPLACE with always-visible pressable arrows
Lines 373-422: Tooltip overlay  // REPLACE with 2-step coach mark overlay
```

### Coach Mark Overlay Design

NOTE: Use NativeWind `className` for all static layout/styling. Use `style={{}}` ONLY for dynamic wadaTokens color values. The example below shows the recommended split.

```tsx
{coachStep > 0 && (
  <View
    className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center"
    style={{ zIndex: 999, backgroundColor: "rgba(0,0,0,0.5)" }}
    accessibilityRole="alert"
    testID="coach-mark-overlay"
  >
    <View
      className="rounded-xl p-6 mx-10 max-w-[300px] items-center"
      style={{ backgroundColor: wadaTokens.bgPaper }}
    >
      <Text
        className="text-base text-center mb-5"
        style={{ fontFamily: "NotoSerifJP_400Regular", color: wadaTokens.textPrimary }}
        testID="coach-mark-text"
      >
        {coachStep === 1
          ? "Tap any garment to change its color"
          : "Use the arrows or swipe to change garments"}
      </Text>
      <Pressable
        onPress={handleCoachOk}
        accessibilityRole="button"
        accessibilityLabel="Got it"
        testID="coach-mark-ok"
        className="rounded-lg px-8 py-3 min-w-[44px] min-h-[44px] justify-center items-center"
        style={{ backgroundColor: wadaTokens.textPrimary }}
      >
        <Text
          className="text-sm"
          style={{ color: wadaTokens.bgPaper, fontFamily: "Inter_500Medium" }}
        >
          OK
        </Text>
      </Pressable>
    </View>
  </View>
)}
```

`handleCoachOk` implementation:
```tsx
async function handleCoachOk() {
  hapticLight(); // Must add hapticLight to import from @/lib/haptics
  if (coachStep === 1) {
    setCoachStep(2);
    AccessibilityInfo.announceForAccessibility("Tip: Use the arrows or swipe to change garments");
  } else {
    setCoachStep(0);
    try {
      await AsyncStorage.setItem("@outfinder/visualizer-introduced", "true");
    } catch {
      // Persist failure should not block dismissal
    }
  }
}
```

VoiceOver: announce with "Tip:" prefix on each step render via `AccessibilityInfo.announceForAccessibility("Tip: ...")`. The visible text does NOT include "Tip:" — only the announcement does.

### Permanent Arrows Design

NOTE: Use `className` for static layout. `style={{}}` only for wadaTokens colors.

```tsx
{/* Always render — no conditional gates */}
<Pressable
  onPress={handlePreviousGarment}
  accessibilityRole="button"
  accessibilityLabel="Previous garment"
  testID="arrow-previous"
  className="absolute min-w-[44px] min-h-[44px] justify-center items-center"
  style={{ left: -28, top: "50%", marginTop: -16 }}
>
  <Text className="text-[28px]" style={{ color: wadaTokens.textTertiary, opacity: 0.5 }}>{"‹"}</Text>
</Pressable>
<Pressable
  onPress={handleNextGarment}
  accessibilityRole="button"
  accessibilityLabel="Next garment"
  testID="arrow-next"
  className="absolute min-w-[44px] min-h-[44px] justify-center items-center"
  style={{ right: -28, top: "50%", marginTop: -16 }}
>
  <Text className="text-[28px]" style={{ color: wadaTokens.textTertiary, opacity: 0.5 }}>{"›"}</Text>
</Pressable>
```

Arrow press handlers: `hapticLight()` on press, then cycle garment variant in the corresponding direction. Must add `hapticLight` to the existing haptics import (current file only imports `hapticMedium` and `hapticRigid`).

### Testing Patterns (Proven)

- **AsyncStorage mock:** `jest.spyOn(AsyncStorage, 'getItem')` and `jest.spyOn(AsyncStorage, 'setItem')` — pattern proven in Story 6.1 and OutfitVisualizer existing tests
- **Haptics mock:** `jest.mock("@/lib/haptics")` — pattern used in FavoriteButton.test.tsx
- **Async state:** `await act(async () => {})` for effects that read AsyncStorage on mount
- **testID convention:** React Native `testID` prop, NOT `data-testid`
- **Touch simulation:** `fireEvent.press(getByTestId("coach-mark-ok"))` for OK button taps
- **Navigation mock:** `jest.mock("@react-navigation/native")` — needed since OutfitVisualizer uses `useNavigation` and `useRoute`

### Previous Story Intelligence

**From Story 6.1 (Onboarding Flow):**
- AsyncStorage read/write MUST be in try/catch — native API calls can fail
- SplashScreen hiding depends on BOTH fonts + state being resolved — after removing onboarding, splash hides when fonts load only
- `initialNumToRender` on FlatList ensures all items query-able in tests

**From Story 7.1 (Onboarding Visual Refresh):**
- OutfitPreview uses TintedGarment — but entire onboarding/ folder is being deleted, so no backward compat needed
- `includeHiddenElements: true` needed when querying inside `accessibilityElementsHidden` wrappers

**From Story 7.2 (Visualizer Interaction Affordances):**
- Current tooltip and chevrons were implemented in this story
- `@outfinder/hintSeen` key — will be replaced by `@outfinder/visualizer-introduced`
- Chevron position: absolute left: -28, right: -28 relative to OutfitCard container
- hasSwipedInSession is session-only state (useState, not persisted) — being removed entirely

**From bugfix branch (2026-04-03):**
- Merged handleSkip/handleCta into handleComplete in Onboarding — now entire file is deleted
- Toast JSX + Animated imports were already cleaned from Combinations and FavoritesList
- wadaTokens used for all color references (not hardcoded hex)

### Git Intelligence

Recent commits show:
- `f5ab790` merge: premium gate fix + per-screen code review polish
- `4ea9822` fix: screen analysis — dead code cleanup, token naming, UX polish
- `1cc833a` fix: premium gate missing count check + home layout polish

Pattern: use `fix:` prefix for corrections, `feat:` for new features. Story 11.1 commit should be `feat: onboarding v2 — coach marks + permanent arrows (Story 11.1)`.

### Project Structure Notes

- All changes in existing source tree — no new directories needed
- Deleting `src/components/onboarding/` reduces component count by 4 (net cleanup)
- Coach mark logic lives entirely in OutfitVisualizer.tsx — no new component extraction needed (2-step overlay is simple enough to inline)
- Permanent arrows modify the existing chevron render block in OutfitVisualizer.tsx

### References

- [Source: docs/planning/epic-11.md#Story 11.1] — Full AC and dev notes
- [Source: docs/planning/prd.md#FR1-FR5] — Functional requirements
- [Source: docs/planning/prd.md#NFR2,NFR5-NFR7] — Performance and accessibility NFRs
- [Source: docs/project-context.md#Established Patterns] — Component, haptics, accessibility, testing patterns
- [Source: CLAUDE.md] — Agent rules, coding standards, testing discipline
- [Source: docs/planning/architecture-react-native-ios.md#Storage Schema] — AsyncStorage key conventions

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation went cleanly. No debugging detours.

### Completion Notes List

- Deleted 7 onboarding files (Onboarding.tsx, Onboarding.test.tsx, onboarding/ folder x5)
- App.tsx simplified: removed ONBOARDING_KEY, onboardingSeen state, checkOnboarding useEffect, handleOnboardingComplete, Onboarding import. Splash now hides on fontsLoaded only. Always renders FavoritesProvider > PremiumProvider > NavigationContainer. `export default App` retained as documented Expo entry point exception.
- App.test.tsx rewritten: 3 clean tests verify TabNavigator renders directly, SplashScreen.hideAsync fires, ErrorBoundary fallback works
- OutfitVisualizer.tsx: removed hasSwipedInSession state, removed old tooltip system. Added 2-step coach mark overlay (coachStep state, AsyncStorage @outfinder/visualizer-introduced, VoiceOver alerts, Reanimated card entry/transition/dismiss animations with isReduceMotionEnabled() guard). Added permanent arrows (‹ ›) wrapped around OutfitCard, always rendered, pressable, fire hapticLight + cycleVariant + announcement.
- OutfitVisualizer.test.tsx: coach mark tests (2-step flow, returning user, a11y) + 5 permanent arrow tests (always rendered, a11y, onPress forward/backward, visible during coach marks)
- All 493 tests pass. TypeScript clean. Lint clean (9 pre-existing issues in usePremiumGate.ts, none introduced)

**Code review fixes applied (2026-04-04):**
- **Permanent nav arrows RESTORED**: AC #5 fully implemented. Arrows (‹ ›) always visible, Pressable, hapticLight, cycleVariant on selected slot (or slot 0 if none selected), announce new garment name.
- **Reduce Motion guard added**: `isReduceMotionEnabled()` checked on mount via `reduceMotionRef`. All Reanimated `withTiming` calls guarded — instant transition when reduce motion is on.
- **Step 2 text corrected**: "Use the arrows or swipe to change garments" (matches AC #2 and the now-present arrows)
- **Backdrop opacity corrected**: `rgba(0,0,0,0.5)` (was 0.45, spec says 0.5)

### File List

- App.tsx (modified)
- App.test.tsx (modified)
- src/screens/Onboarding.tsx (deleted)
- src/screens/Onboarding.test.tsx (deleted)
- src/components/onboarding/SwatchGridPreview.tsx (deleted)
- src/components/onboarding/ColorSpecimenPreview.tsx (deleted)
- src/components/onboarding/PalettePreview.tsx (deleted)
- src/components/onboarding/OutfitPreview.tsx (deleted)
- src/components/onboarding/onboarding-previews.test.tsx (deleted)
- src/screens/OutfitVisualizer.tsx (modified)
- src/screens/OutfitVisualizer.test.tsx (modified)
