# Story 6.1: Onboarding Flow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a first-time user,
I want to see a brief visual introduction explaining Wada's story and how the app works,
so that I understand the cultural context behind the color combinations.

## Acceptance Criteria

1. **Given** the user opens the app for the first time (no `@outfinder/onboarding_seen` in AsyncStorage), **When** the app loads, **Then** the Onboarding screen displays 4 swipeable slides on `bg-paper` background (FR31). Each slide has: Japanese text (Noto Serif JP, 24px, primary), English text (Inter, 14px, secondary), and a visual element. Dot pagination at the bottom indicates current slide position.

2. **Given** the onboarding is displayed, **When** the user swipes or taps to advance, **Then** slides transition with spring animation (Reanimated) respecting Reduce Motion (FR32). A "Skip" link is visible in top-right throughout the flow (Inter, 13px, `text-tertiary`) (FR32). All slides and controls have `accessibilityLabel` and `accessibilityRole`.

3. **Given** the user reaches slide 4 or taps "Skip", **When** they complete or skip the flow, **Then** `@outfinder/onboarding_seen: true` is stored in AsyncStorage (FR33). The user is navigated to Color Home. Onboarding is never shown again on subsequent launches (FR33). The final slide shows a CTA button "始めましょう" / "Let's begin".

4. **Given** tests exist for Onboarding, **When** tests run, **Then** all 4 slides render, skip works, completion sets AsyncStorage flag, component does not render when flag exists. `npx tsc --noEmit`, `pnpm lint`, and `pnpm test` all pass with 0 errors. Adversarial code review is run and findings resolved before merging story branch.

## Tasks / Subtasks

- [x] Task 1: Create Onboarding screen with slide data and layout (AC: #1)
  - [x] 1.1 Create `src/screens/Onboarding.tsx` — full-screen component with 4 slides rendered in a horizontal `FlatList` (pagingEnabled, horizontal, showsHorizontalScrollIndicator=false, `initialNumToRender={4}` to ensure all slides render for tests). Each slide: `View` with `className="flex-1 items-center justify-center bg-paper"` containing placeholder visual element area (colored View with rounded corners — illustrations not available yet), Japanese text (Noto Serif JP, 24px, `text-primary`), English text (Inter, 14px, `text-secondary`). Each slide container: `accessibilityLabel="Slide N of 4: {English text}"`, `testID="onboarding-slide-{index}"`. Props: `interface OnboardingProps { onComplete: () => void }`. Root view: `testID="onboarding-screen"`.
  - [x] 1.2 Slide data as const array inside component: `ONBOARDING_SLIDES` with `{ id, titleJp, titleEn, placeholderColor }` for each of the 4 slides: "あなたの服を開いて" / "Open your wardrobe" (placeholderColor: `#d4c4b0`), "好きな一着を選んで" / "Pick your favorite piece" (placeholderColor: `#b8c4b8`), "その色を見つけて" / "Find its color" (placeholderColor: `#c4b8c8`), "組み合わせを発見しよう" / "Discover your combinations" (placeholderColor: `#c8c0b0`).
  - [x] 1.3 Dot pagination — render 4 dots below the FlatList with bottom safe area padding via `useSafeAreaInsets()`. Current slide highlighted (`bg-primary` vs `bg-tertiary`). Track current index via `onViewableItemsChanged` + `viewabilityConfig`. Dots have `accessibilityLabel="Slide X of 4"`, `testID="onboarding-dot-{index}"`.

- [x] Task 2: Add swipe animation, skip, and CTA (AC: #2, #3)
  - [x] 2.1 "Skip" link — `Pressable` in top-right (absolute positioned, safe area insets via `useSafeAreaInsets` from react-native-safe-area-context). `min-h-[44px] min-w-[44px]` for touch target. Text "Skip" (Inter, 13px, `text-tertiary`). `accessibilityRole="button"`, `accessibilityLabel="Skip onboarding"`, `testID="onboarding-skip"`. On press calls `onComplete()`. `hapticLight()` on tap.
  - [x] 2.2 CTA on slide 4 — when `currentIndex === 3`, show a "始めましょう / Let's begin" button below the English text. `Pressable` with `className="mt-8 rounded-full px-8 min-h-[48px] items-center justify-center bg-primary"`, white text (Inter, 16px). `accessibilityRole="button"`, `accessibilityLabel="Let's begin"`, `testID="onboarding-cta"`. On press calls `onComplete()`. `hapticLight()` on tap.
  - [x] 2.3 Reduce Motion support — use `useReducedMotion()` from `@/hooks/useReducedMotion` (custom hook, NOT from react-native-reanimated). When reduced motion is enabled, disable spring-based scroll deceleration (use `decelerationRate="fast"` instead of spring). No additional animations to gate since FlatList paging handles transitions natively.

- [x] Task 3: Integrate onboarding into App.tsx with AsyncStorage gating (AC: #1, #3)
  - [x] 3.1 Add state management in `App.tsx`: `const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null)`. On mount, read `@outfinder/onboarding_seen` from AsyncStorage wrapped in try/catch (CLAUDE.md rule: try/catch on all native API calls). If `"true"`, set state to `true`. If null/missing or error, set to `false` (safe fallback: show onboarding). While `null` (loading), return `null` (splash screen still visible).
  - [x] 3.2 Conditional rendering: if `onboardingSeen === false`, render `<Onboarding onComplete={handleOnboardingComplete} />` instead of the NavigationContainer + TabNavigator. `handleOnboardingComplete` writes `@outfinder/onboarding_seen: "true"` to AsyncStorage (wrapped in try/catch — if write fails, still set state to `true` and navigate to Color Home) and sets state to `true`.
  - [x] 3.3 Ensure SplashScreen.hideAsync() is called after both fonts are loaded AND onboarding state is resolved (not just fonts). Update the existing `useEffect` deps to `[fontsLoaded, onboardingSeen]` and only call `SplashScreen.hideAsync()` when `fontsLoaded && onboardingSeen !== null`.

- [x] Task 4: Tests and verification (AC: #4)
  - [x] 4.1 Create `src/screens/Onboarding.test.tsx` — tests: renders all 4 slides with Japanese and English text, renders dot pagination, skip button calls onComplete, CTA button on slide 4 calls onComplete, accessibility labels on slides/skip/CTA, pagination dots update on swipe.
  - [x] 4.2 Update `App.tsx` tests (if they exist) or create `App.test.tsx` — tests: renders Onboarding when AsyncStorage flag is missing, renders TabNavigator when flag is `"true"`, onComplete handler writes to AsyncStorage and shows TabNavigator.
  - [x] 4.3 Run `npx tsc --noEmit`, `pnpm lint`, `pnpm test` — all pass with 0 errors. Point-by-point AC verification. Verify File List matches `git diff --name-status`.

## Dev Notes

### Epic 6 Context

Epic 6 is "Onboarding & App Store Launch." Story 6.1 (this story) handles the onboarding flow. Story 6.2 handles Settings screen and App Store preparation. **Epic 5 (Premium/IAP) is NOT being executed yet** — skip any premium-related integration. The onboarding flow is completely independent of premium features.

### UX Spec — Onboarding Design Rules

From `ux-design-specification-ios.md#First-Time Onboarding`:
- **Purpose:** Mindset frame, not UI tutorial. Connects the color grid to the wardrobe context.
- Full-screen, `--bg-paper` background, centered content.
- Minimal illustration style — **illustrations not available yet**, use placeholder colored Views with rounded corners matching the serene aesthetic.
- Japanese text primary (Noto Serif JP, 24px), English secondary (Inter, 14px, `--text-secondary`).
- Pagination: UX spec mentions "Native UIPageControl" but React Native has no built-in equivalent; custom dot indicators are the standard RN pattern. 4 dots at the bottom indicating current slide.
- "Skip" text in top-right (Inter, 13px, `--text-tertiary`).
- After slide 4: CTA "始めましょう" / "Let's begin" → transitions to Color Home.
- Never shown again after completion or skip. Stored in AsyncStorage.
- Spring-based swipe animations via Reanimated — but FlatList paging handles this natively, no custom Reanimated gesture handling needed.

### Slide Content (from UX spec)

| Slide | Japanese (primary) | English (secondary) |
|-------|-------------------|---------------------|
| 1 | あなたの服を開いて | Open your wardrobe |
| 2 | 好きな一着を選んで | Pick your favorite piece |
| 3 | その色を見つけて | Find its color |
| 4 | 組み合わせを発見しよう | Discover your combinations |

### Architecture — Onboarding Implementation

From architecture doc:
- **Screen file:** `src/screens/Onboarding.tsx` (single screen, not in any navigation stack)
- **AsyncStorage key:** `@outfinder/onboarding_seen` (boolean)
- **FR mapping:** FR31-FR33 → `screens/Onboarding.tsx` + `lib/storage.ts` (but don't create storage wrapper — AsyncStorage direct is fine, consistent with FavoritesContext pattern)
- Architecture mentions `assets/onboarding/` for slide images — **images don't exist yet**, use placeholder Views.

### Integration Pattern — App.tsx Gating

The onboarding is gated at the `App.tsx` level, NOT inside the navigation structure. This means:
- When `onboardingSeen === false`: render `<Onboarding onComplete={...} />` fullscreen (no NavigationContainer, no tabs)
- When `onboardingSeen === true`: render existing `<NavigationContainer><TabNavigator /></NavigationContainer>`
- This avoids adding Onboarding as a screen in any navigator, keeping the navigation structure clean.
- The `<GestureHandlerRootView>` wrapper should remain around both paths (needed for FlatList gestures in onboarding).
- The `<FavoritesProvider>` should only wrap the NavigationContainer path (not needed during onboarding).

### Current App.tsx Structure

```tsx
export function App() {
  const [fontsLoaded] = useFonts({...});
  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync(); }, [fontsLoaded]);
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FavoritesProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </FavoritesProvider>
    </GestureHandlerRootView>
  );
}
```

**After this story**, App.tsx will additionally:
1. Read `@outfinder/onboarding_seen` from AsyncStorage on mount
2. Delay SplashScreen.hideAsync() until both fonts AND onboarding state are resolved
3. Conditionally render Onboarding or the main app

### Previous Story Intelligence (Story 4.2)

From the last completed story (note: project-context.md reports **230 tests across 22 suites** as current baseline — use this number for regression check):
- **230 tests** — all passing. New tests must not break any. After this story, expect ~240+ tests.
- **AsyncStorage usage pattern:** FavoritesContext reads `@outfinder/favorites` at launch — same pattern for onboarding flag. Use `AsyncStorage.getItem()` / `AsyncStorage.setItem()`.
- **Mock requirements:** AsyncStorage mock is handled by `@react-native-async-storage/async-storage/jest/async-storage-mock` in jest setup. Verify it works for the new key.
- **Test approach:** Use `jest.spyOn` or mock AsyncStorage to control onboarding flag state in tests.
- **FlatList testing:** FlatList virtualizes rendering. For onboarding, all 4 slides should be renderable since `initialNumToRender` can be set to 4 (only 4 items total).

### Patterns to Follow

- **Function declarations with named exports** — `export function Onboarding(...)`
- **Props interface required** — `interface OnboardingProps { onComplete: () => void }`
- **NativeWind `className`** for static styles — `style={{}}` only for dynamic values
- **Haptics through `@/lib/haptics`** — `hapticLight()` on skip/CTA tap
- **Co-located tests** — `Onboarding.test.tsx` next to `Onboarding.tsx`
- **`testID` attributes** — e.g., `testID="onboarding-screen"`, `testID="onboarding-skip"`, `testID="onboarding-cta"`
- **`accessibilityRole="button"`** on Skip and CTA
- **`useReducedMotion()`** from `@/hooks/useReducedMotion` (custom hook, NOT from react-native-reanimated) — check before any animation

### What NOT to Do

- DO NOT create a navigation stack for onboarding — it's rendered directly in App.tsx, outside NavigationContainer.
- DO NOT create a `lib/storage.ts` wrapper — use AsyncStorage directly (same as FavoritesContext pattern).
- DO NOT implement illustrations — they don't exist yet. Use simple colored placeholder Views.
- DO NOT add premium-related anything — Epic 5 is not executed yet.
- DO NOT use `StyleSheet.create` — use NativeWind `className`.
- DO NOT use `ScrollView` with manual paging — use `FlatList` with `pagingEnabled`.
- DO NOT add an "advance/next" button — swipe and CTA on slide 4 are the advancement mechanisms per UX spec.
- DO NOT import `expo-haptics` directly — use `@/lib/haptics`.
- DO NOT import `useReducedMotion` from `react-native-reanimated` — use `@/hooks/useReducedMotion` (custom hook).
- DO NOT use `react-native-pager-view` or any third-party pager — `FlatList` with `pagingEnabled` is sufficient.

### Git Branching

Create story branch `story-6.1-onboarding-flow` off `epic-1` (current main epic branch).

### Project Structure Notes

Files to create/modify follow established patterns:
- `src/screens/Onboarding.tsx` (NEW) — Onboarding screen with 4 slides
- `src/screens/Onboarding.test.tsx` (NEW) — Co-located tests
- `App.tsx` (MODIFIED) — Add AsyncStorage gating for onboarding
- `App.test.tsx` (NEW or MODIFIED) — Tests for onboarding gating in App

### References

- [Source: docs/planning/epics.md#Story-6.1] — Story requirements and AC (FR31-FR33)
- [Source: docs/planning/ux-design-specification-ios.md#First-Time-Onboarding] — Slide content, design rules, typography, pagination
- [Source: docs/planning/ux-design-specification-ios.md#Journey-1] — First-time discovery flow with onboarding
- [Source: docs/planning/architecture-react-native-ios.md#Storage-Schema] — `@outfinder/onboarding_seen` AsyncStorage key
- [Source: docs/planning/architecture-react-native-ios.md#Requirements-to-Structure-Mapping] — FR31-FR33 → `screens/Onboarding.tsx`
- [Source: docs/planning/architecture-react-native-ios.md#Project-Structure] — `screens/Onboarding.tsx`, `assets/onboarding/`
- [Source: docs/project-context.md] — Current project structure, established patterns, 230 tests
- [Source: _bmad-output/implementation-artifacts/4-2-favorites-list-screen-and-navigation.md] — Previous story patterns, AsyncStorage usage, test count

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Biome lint required import reorder (ViewabilityConfig before ViewToken) and formatting adjustments in test file
- App.test.tsx needed CSS mock (`__mocks__/styleMock.js`) since App.tsx imports `global.css` — added `moduleNameMapper` to jest.config.js
- App.test.tsx needed `jest.mock("@react-native-async-storage/async-storage")` inline (not in jest setup) — same pattern as FavoritesContext.test.tsx
- `fireEvent.press()` required instead of `skipButton.props.onPress()` for Pressable components in App integration tests

### Completion Notes List

- ✅ Created `src/screens/Onboarding.tsx` — 4-slide horizontal FlatList with pagingEnabled, placeholder colored Views, Japanese/English text, dot pagination, Skip button, CTA on slide 4, haptics, accessibility labels, Reduce Motion support
- ✅ Modified `App.tsx` — AsyncStorage gating for onboarding (`@outfinder/onboarding_seen`), SplashScreen delayed until fonts + onboarding state resolved, conditional rendering (Onboarding vs NavigationContainer), FavoritesProvider only wraps main app path
- ✅ Created `src/screens/Onboarding.test.tsx` — 13 tests covering slides, pagination, skip, CTA, accessibility, haptics, dot highlight state, CTA text separation
- ✅ Created `App.test.tsx` — 6 tests covering onboarding gating, AsyncStorage read/write, error handling, SplashScreen timing
- ✅ Added `__mocks__/styleMock.js` and CSS moduleNameMapper to jest.config.js for App.test.tsx CSS import support
- ✅ 249 tests across 24 suites (up from 230/22) — zero regressions
- ✅ `npx tsc --noEmit` passes, `pnpm lint` passes (including root files), `pnpm test` passes

### Change Log

- 2026-03-18: Story 6.1 implementation — Onboarding flow with 4 slides, AsyncStorage gating in App.tsx, 16 new tests
- 2026-03-18: Code review fixes — Biome lint errors (unused import, import order, formatting), CTA button text separated (JP/EN), SplashScreen timing test, pagination dot highlight test, File List corrected

### File List

- `src/screens/Onboarding.tsx` (NEW) — Onboarding screen with 4 swipeable slides
- `src/screens/Onboarding.test.tsx` (NEW) — 13 tests for Onboarding component
- `App.tsx` (MODIFIED) — AsyncStorage gating, SplashScreen delay, conditional rendering
- `App.test.tsx` (NEW) — 6 tests for App onboarding integration
- `jest.config.js` (MODIFIED) — Added CSS moduleNameMapper
- `__mocks__/styleMock.js` (NEW) — CSS import mock for Jest
- `docs/project-context.md` (MODIFIED) — Updated project status and structure
- `_bmad-output/implementation-artifacts/6-1-onboarding-flow.md` (MODIFIED) — Story file updates
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) — Status: in-progress → review
