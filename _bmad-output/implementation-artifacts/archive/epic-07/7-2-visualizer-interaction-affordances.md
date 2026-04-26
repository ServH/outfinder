# Story 7.2: Visualizer Interaction Affordances

Status: pending

## Story

As a user viewing the Outfit Visualizer,
I want clear visual cues telling me I can tap garments to select them and swipe to change variants,
so that I discover the interactive features without guessing.

## Acceptance Criteria

1. **Given** the user opens the Outfit Visualizer for the first time (no `@outfinder/visualizer_hint_seen` in AsyncStorage), **When** the screen renders, **Then** a subtle hint overlay appears below the outfit card: "Tap a garment to select · Swipe to change style" in Inter 12px, warm taupe (#a09080), centered. The hint fades out after 4 seconds with a 500ms opacity animation. After dismissal, `@outfinder/visualizer_hint_seen: true` is stored in AsyncStorage. The hint never appears again on subsequent visits.

2. **Given** the user taps a garment and it becomes selected, **When** the selected state activates, **Then** the border indicator changes from the current subtle black pulsing border to a more visible treatment: the selected garment gets a **warm accent underline bar** (4px height, `premiumAccent` color #c4a265, centered below the garment, 60% garment width, rounded) that gently pulses opacity 0.5↔1.0. Additionally, small chevron icons (‹ ›) appear on the left and right sides of the selected garment at 30% opacity in warm taupe, indicating swipe direction. Chevrons disappear after the first successful swipe in the session.

3. **Given** the user has never swiped a garment, **When** they tap to select one, **Then** the chevrons animate in with a subtle 200ms fade. **When** they perform their first swipe (variant cycle), **Then** the chevrons fade out (300ms) and don't reappear for the rest of the session (tracked via React state, not persisted — resets on app restart to gently remind).

4. **Given** Reduce Motion is enabled, **When** the hint and chevrons display, **Then** the hint appears and disappears instantly (no fade animation). The underline bar shows at static opacity 1.0 (no pulse). Chevrons appear/disappear instantly.

5. **Given** all changes are applied, **When** `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` are executed, **Then** all pass with 0 errors. New tests cover: hint renders on first visit, hint does not render when AsyncStorage flag exists, selected garment shows underline bar, chevrons appear on selection, chevrons disappear after swipe.

## Tasks / Subtasks

- [ ] Task 1: Add first-time hint overlay to OutfitVisualizer (AC: #1, #4)
  - [ ] 1.1 In `src/screens/OutfitVisualizer.tsx`, add state for `hintSeen` (read from AsyncStorage `@outfinder/visualizer_hint_seen` on mount). If not seen, render a hint text View below the outfit card / above MiniPaletteStrip: "Tap a garment to select · Swipe to change style" in Inter 12px, color #a09080, centered, with `accessibilityLabel` and `accessibilityRole="text"`.
  - [ ] 1.2 After 4 seconds (using `setTimeout`), animate hint opacity to 0 (Reanimated `withTiming(0, { duration: 500 })`) and write `@outfinder/visualizer_hint_seen: "true"` to AsyncStorage (wrapped in try/catch). If Reduce Motion enabled, hide instantly (no delay, no animation).
  - [ ] 1.3 On subsequent visits, `hintSeen` state is `true` and the hint does not render at all.

- [ ] Task 2: Replace black border with warm underline indicator (AC: #2, #4)
  - [ ] 2.1 In `src/components/OutfitCard.tsx` (`CardSlot`), replace the current `borderWidth: 2, borderColor: rgba(0,0,0, opacity*0.8)` selected state with a new approach:
    - Remove the border animation entirely from the selected state
    - Add a new `Animated.View` below the TintedGarment (inside the slot, after the garment): height 4px, width 60% of CARD_WIDTH, centered, `borderRadius: 2`, `backgroundColor: #c4a265` (premiumAccent from theme).
    - Animate its opacity: `withRepeat(withSpring(1, { damping: 12, stiffness: 120 }), -1, true)` starting from 0.5. Same breathe pattern as before but on the underline, not the border.
    - When deselected: `withTiming(0, { duration: 150 })` to fade out.
    - If Reduce Motion: static opacity 1.0 when selected, 0 when not.
  - [ ] 2.2 Update `borderStyle` animated style to only show transparent border (no visual change) — keep the Animated.View wrapper for layout consistency but remove visual border indication.

- [ ] Task 3: Add swipe chevron affordance to selected garment (AC: #2, #3, #4)
  - [ ] 3.1 In `src/components/OutfitCard.tsx`, add state `hasSwipedInSession` (React useState, defaults false, resets on remount). When a variant cycle completes successfully, set to `true`.
  - [ ] 3.2 When `isSelected && !hasSwipedInSession`, render two chevron indicators:
    - Left chevron: "‹" or SF Symbol `chevron.left`, positioned absolute, left edge of garment slot, vertically centered. Color: #a09080 at 30% opacity. Size: 16px.
    - Right chevron: "›" or SF Symbol `chevron.right`, positioned absolute, right edge, same styling.
    - Both have `accessibilityElementsHidden={true}` (decorative).
  - [ ] 3.3 Chevrons animate in with `withTiming` opacity 0→0.3 (200ms). When `hasSwipedInSession` becomes true, animate out with `withTiming` opacity 0.3→0 (300ms). If Reduce Motion, appear/disappear instantly.
  - [ ] 3.4 Lift `hasSwipedInSession` state to `OutfitCard` parent and pass down to `CardSlot` via prop, so all slots share the same swipe-discovery state.

- [ ] Task 4: Tests and verification (AC: #5)
  - [ ] 4.1 Update `src/screens/OutfitVisualizer.test.tsx` — add tests: hint text renders when AsyncStorage flag missing, hint does not render when flag is "true", hint text content matches expected string.
  - [ ] 4.2 Update `src/components/OutfitCard.test.tsx` — add tests: selected slot renders underline bar (View with premiumAccent background), chevrons render when selected and hasSwipedInSession is false, chevrons do not render after swipe.
  - [ ] 4.3 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all pass with 0 errors.

## Dev Notes

### The Problem

Currently when a user taps a garment in the Outfit Visualizer:
1. The garment gets a **2px pulsing black border** — looks like a selection bug, not an affordance
2. There's **zero indication** that swiping left/right changes the garment variant (t-shirt ↔ shirt, pants ↔ skirt, etc.)
3. The tap-two-garments-to-swap-colors mechanic is completely hidden

The black border is the most jarring issue — it reads as "something broke" rather than "you selected this."

### Design Decision: Underline Bar vs Border

The warm gold underline bar (#c4a265, premiumAccent) solves multiple problems:
- **Communicates selection** without looking like a bug (gold = intentional, black = error)
- **Consistent with app identity** — premiumAccent is already used for premium features
- **Doesn't obscure the garment** — sits below instead of around it
- **Creates visual hierarchy** — user's eye goes: garment → underline → chevrons

### Chevron Lifecycle

The chevrons follow a "progressive disclosure" pattern:
1. First selection: chevrons appear (30% opacity, subtle)
2. First swipe: chevrons fade out permanently (for this session)
3. Next app launch: chevrons reappear on first selection (gentle reminder)
4. Power users never see them after first swipe

This avoids both extremes: never showing affordance (current) and permanently cluttering the UI.

### AsyncStorage Keys

- `@outfinder/visualizer_hint_seen` — one-time hint text. Written once, never shown again.
- Chevron state: React state only (resets per session). Not persisted. Intentional — mild reminders on each session are acceptable.

### Current Animation Code Being Replaced

In `OutfitCard.tsx` CardSlot:
```typescript
// CURRENT: black pulsing border
const borderStyle = useAnimatedStyle(() => ({
  borderWidth: 2,
  borderColor: isSelected
    ? `rgba(0, 0, 0, ${borderOpacity.value * 0.8})`
    : "transparent",
  borderRadius: 8,
}));
```

This becomes:
```typescript
// NEW: no visual border, selection shown via underline bar
const borderStyle = useAnimatedStyle(() => ({
  borderWidth: 2,
  borderColor: "transparent", // Keep for layout consistency
  borderRadius: 8,
}));
```

Plus a new underline `Animated.View` below the garment.

### What NOT to Do

- DO NOT add a full tutorial/coach-marks system — one hint line is enough
- DO NOT make the hint interactive (tappable/dismissable) — it auto-fades
- DO NOT persist chevron state — session-level reset is intentional
- DO NOT change the tap-to-swap or swipe-to-cycle logic — only add visual affordances
- DO NOT change the MiniPaletteStrip, WadaHeader, or share button

### Git Branching

Create story branch `story-7.2-visualizer-affordances` off `epic-1`.

### References

- [Source: src/components/OutfitCard.tsx] — current black border animation (lines 50-76)
- [Source: src/screens/OutfitVisualizer.tsx] — screen layout where hint goes
- [Source: src/styles/theme.ts] — premiumAccent: #c4a265
- [Source: src/hooks/useReducedMotion.ts] — accessibility check
- [Source: docs/planning/outfinder_gsap_animation_demo.html] — reference for animation feel
