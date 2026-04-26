---
stepsCompleted: [1, 2, 3, 4]
status: complete
inputDocuments:
  - designs/home-redesign-spec.md
  - designs/favorites-redesign-spec.md
  - designs/visualizer-adjustments-spec.md
  - docs/project-context.md
executionOrder: sequential (Epic 8 → Epic 9 → Epic 10)
---

# Outfinder v2.0 Redesign - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Outfinder v2.0 redesign, decomposing the validated design specifications into implementable stories. This is a redesign of an existing published app (v1.0.2, 7 epics completed), not a greenfield project.

## Requirements Inventory

### Functional Requirements

**Home Redesign:**
FR1: Home screen displays 6 wardrobe-first fabric swatch cards in a 2x3 grid (White, Black, Blue, Grey, Brown, Green) with header "What color are you wearing?"
FR2: Second page (horizontal swipe) shows 5 accent colors (Red, Pink, Yellow, Purple, Orange) + dashed "All 159 colors" escape hatch card
FR3: Page dots indicate current page between basics and accents
FR4: Peek of Red swatch visible on right edge of Page 1 to invite swipe discovery
FR5: Tapping a family fabric swatch transforms home in-place to State 2 (Reanimated animation, no navigation push)
FR6: State 2 header shows "← [Family]" back button + "[N] combos" count
FR7: State 2 shows shade picker with 5 representative shades per family, most popular shade preselected with gold ring border and bold label
FR8: Shade picker is sticky (remains visible when scrolling combo cards via stickyHeaderIndices)
FR9: Tapping a shade pill filters combo feed to that shade's combinations and updates combo count
FR10: Combo cards show color strip (60px), "yours" label on user's shade segment, JP name (14px Noto Serif JP) + EN name (11px Inter), heart button, "See outfit" dark pill with shirt icon
FR11: Entire combo card is tappable → pushes OutfitVisualizer with combinationId
FR12: Heart on combo card is independent tap target (stopPropagation) triggering favorite toggle or premium paywall
FR13: Combos ordered by size: 2-color first, then 3, then 4 (no section headers)
FR14: Back button "← [Family]" restores home to State 1 (reverse animation)
FR15: New static data mapping: 159 Wada colors → 11 wardrobe categories (WardrobeCategory union type)
FR16: For each WardrobeCategory: 5 representative shade IDs ordered light-to-dark, default = highest combinationCount
FR17: "Browse all 159 colors" link + dashed card push existing ColorHome grid as BrowseAllColors screen
FR18: Back from accent page always returns to Page 1

**Favorites Redesign:**
FR19: Favorites displays 2-column grid of compact combo cards (numColumns=2, 12px gaps, 16px padding)
FR20: Sort pills row: Recent (default, dark fill), A-Z, By size — with hapticLight on tap
FR21: Active sort pill: dark fill (#1a1a1a) + white text; inactive: #F0F0EE fill + #6b6b6b text
FR22: Sort resets to "Recent" on every tab switch (no persistence)
FR23: Compact combo cards: 52px color strip, 13px JP name, 10px EN name, 16px heart (filled red), 16px shirt icon
FR24: Favorites count shown in header top-right (15px Inter, #a09080)
FR25: Updated empty state text: "No favorites yet" / "Pick a color, explore combinations, and tap ♡ to save the ones you love"
FR26: Remove Combinations screen from FavoritesStack — tap card pushes OutfitVisualizer directly

**Visualizer Adjustments:**
FR27: WadaHeader displays nameEn (14px, font-sans-medium) between nameJp and subtitle
FR28: Heart/favorite button placed next to Share button, outside shareViewRef capture area
FR29: Navigation title dynamically shows combination.nameEn instead of static "Outfit Visualizer"

**Shared Component:**
FR30: ComboCard component with variant prop ("full" | "compact") shared between State 2 and Favorites
FR31: ComboCard accepts showYoursLabel prop (true in State 2, false in Favorites) and yourColorId prop

### Non-Functional Requirements

NFR1: Transform animation (State 1 ↔ State 2) respects useReducedMotion() — skip entirely when enabled
NFR2: All interactive elements maintain 44px minimum touch targets (48px preferred)
NFR3: VoiceOver accessibilityLabels on all new elements per accessibility tables in each spec
NFR4: accessibilityRole assigned correctly: "button" on cards/hearts, "tab" on shade pills/sort pills, "tablist" on containers
NFR5: Haptic feedback pattern: hapticLight() on family tap, shade tap, sort pill, heart toggle; hapticMedium() on combo card → Visualizer
NFR6: FlatList virtualization for combo cards (8-15 items per shade, trivial count)
NFR7: Shade filtering must execute in <1ms (pre-indexed data via colorIndex)
NFR8: Fabric swatch gradients are static renders (no re-render on scroll)
NFR9: iPhone SE performance: transform animation must be simple (fade + scale, not complex layout morph)
NFR10: "yours" label needs adaptive contrast — white text on light colors will be invisible
NFR11: nameEn must appear in share capture image (inside shareViewRef)
NFR12: Heart button in Visualizer must NOT appear in share capture (outside shareViewRef)

### Additional Requirements

**From Existing Architecture/Patterns (project-context.md):**
- Function declarations with named exports (never export default)
- NativeWind className for static styles, style={{}} only for dynamic Wada color values
- Props interface required: interface {ComponentName}Props
- Haptics only through lib/haptics.ts wrappers
- Co-located test files next to source files
- testID attributes (not data-testid)
- useReducedMotion() check before any animation
- navigation.push() for stacking (not navigate())
- FavoritesContext and PremiumContext patterns already established
- Existing colorIndex.ts provides O(1) lookups — new wardrobe functions extend this

**New Data Layer Required:**
- New wardrobeIndex.ts (or extend colorIndex.ts) with: getColorsByWardrobe(), getRepresentativeShades(), getCombinationsByWardrobe(), getDefaultShade()
- Static WardrobeCategory type and manual color-to-category mapping for all 159 colors
- 5 representative shades per category (manually curated, visually distinct, light-to-dark order)

**Navigation Changes:**
- ColorHome refactored into State 1 + State 2 (transform, not push)
- Old ColorHome preserved as BrowseAllColors screen
- Combinations screen absorbed into ColorHome State 2
- FavoritesStack simplified: remove Combinations, direct to OutfitVisualizer
- Stack depth reduced from 3 to 2 in both Colors and Favorites stacks

**Testing Requirements:**
- Every AC describing user interaction must have a corresponding test
- Mock @react-navigation/native for navigation tests
- Mock @/lib/haptics for haptic verification
- Use getAllByText when text appears in multiple contexts
- FlatList virtualizes rendering — test via data prop

### FR Coverage Map

| FR | Epic.Story | Description |
|----|-----------|-------------|
| FR1 | 8.2 | 6 fabric swatches 2x3 grid |
| FR2 | 8.2 | Page 2 accents + escape hatch |
| FR3 | 8.2 | Page dots |
| FR4 | 8.2 | Peek of Red |
| FR5 | 8.4 | Transform in-place State 1 → State 2 |
| FR6 | 8.4 | State 2 header with back + count |
| FR7 | 8.4 | Shade picker 5 shades preselected |
| FR8 | 8.4 | Sticky shade picker |
| FR9 | 8.4 | Shade tap filters combo feed |
| FR10 | 8.3 | ComboCard layout (strip, names, heart, pill) |
| FR11 | 8.3 | Card tappable → Visualizer |
| FR12 | 8.3 | Heart independent with stopPropagation |
| FR13 | 8.3 | Combo order by size (2→3→4) |
| FR14 | 8.4 | Back button restores State 1 |
| FR15 | 8.1 | WardrobeCategory mapping 159 → 11 |
| FR16 | 8.1 | 5 representative shades per category |
| FR17 | 8.5 | BrowseAllColors screen |
| FR18 | 8.2 | Back from accent → Page 1 |
| FR19 | 9.1 | 2-col grid FlatList |
| FR20 | 9.2 | Sort pills |
| FR21 | 9.2 | Pill styling (active/inactive) |
| FR22 | 9.2 | Sort reset on tab switch |
| FR23 | 9.1 | Compact combo card specs |
| FR24 | 9.2 | Favorites count header |
| FR25 | 9.2 | Empty state text update |
| FR26 | 9.1 | Remove Combinations from FavoritesStack |
| FR27 | 10.1 | nameEn in WadaHeader |
| FR28 | 10.1 | Heart button next to Share |
| FR29 | 10.1 | Dynamic nav title |
| FR30 | 8.3 + 9.1 | ComboCard full + compact variants |
| FR31 | 8.3 | showYoursLabel + yourColorId props |

**Coverage: 31/31 FRs mapped. 12/12 NFRs distributed across relevant stories.**

## Epic List

### Epic 8: Home Redesign — Wardrobe-First Discovery
Users find outfit combinations for the color they're wearing in 2 taps instead of 3. The home transforms from a 159-color Pantone catalog into a wardrobe-first tool with 6 fabric swatches, shade picker, and combo cards.
**FRs covered:** FR1-FR18, FR30, FR31
**Stories:** 8.1, 8.2, 8.3, 8.4, 8.5

### Epic 9: Favorites Redesign — Compact Collection
Users browse and sort saved combinations efficiently in a compact 2-column grid (8 visible vs 3 current) with sort pills and direct Visualizer access.
**FRs covered:** FR19-FR26, FR30
**Stories:** 9.1, 9.2

### Epic 10: Visualizer Polish — Continuity & Save
Users see English combination names, save favorites directly from the Visualizer, and see contextual navigation titles.
**FRs covered:** FR27-FR29
**Stories:** 10.1

---

## Epic 8: Home Redesign — Wardrobe-First Discovery

Users find outfit combinations for the color they're wearing in 2 taps instead of 3. The home transforms from a 159-color Pantone catalog into a wardrobe-first tool with 6 fabric swatches, shade picker, and combo cards.

### Story 8.1: Wardrobe Data Layer

As a **developer building the home redesign**,
I want **a wardrobe-first data layer that maps 159 Wada colors to 11 wardrobe categories with representative shades**,
So that **the new home screen can filter and display combinations by real-world garment color families**.

**Acceptance Criteria:**

**Given** the app has 159 Wada colors in colors.json
**When** the wardrobeIndex module is loaded
**Then** every color is mapped to exactly one WardrobeCategory from the union type ("white" | "black" | "blue" | "grey" | "brown" | "green" | "red" | "pink" | "yellow" | "purple" | "orange")
**And** no color is left unmapped

**Given** a WardrobeCategory (e.g., "brown")
**When** calling getRepresentativeShades("brown")
**Then** it returns exactly 5 Color objects ordered light-to-dark (e.g., Beige → Tan → Rust → Chocolate → Espresso)
**And** the 5 shades are visually distinct within the family

**Given** a WardrobeCategory
**When** calling getDefaultShade(category)
**Then** it returns the shade with the highest combinationCount in that family

**Given** a WardrobeCategory
**When** calling getCombinationsByWardrobe(category)
**Then** it returns all Combination objects containing at least one color mapped to that category
**And** results are deterministic (same input = same output)

**Given** a specific shade Color within a category
**When** filtering combinations for that shade
**Then** only combinations containing that exact color ID are returned

### Story 8.2: Home State 1 — Fabric Swatch Grid with Pagination

As a **user opening Outfinder**,
I want **to see 6 large wardrobe-color categories as fabric swatches with the question "What color are you wearing?"**,
So that **I immediately understand this app helps me coordinate the color I'm actually wearing today**.

**Acceptance Criteria:**

**Given** the user opens the Colors tab
**When** the home screen renders
**Then** the header shows "Outfinder" (28px Noto Serif JP) and subtitle "What color are you wearing?" (15px Inter, #6b6b6b)
**And** 6 fabric swatch cards appear in a 2x3 grid: White, Black, Blue, Grey, Brown, Green
**And** each card shows a multi-tone gradient simulating cloth with a single-word label (20px Inter semibold, top-left)
**And** the Red swatch from Page 2 peeks visibly on the right edge (inviting swipe)

**Given** the user is on Page 1 (basics)
**When** swiping left
**Then** Page 2 scrolls in showing 5 accent swatches: Red, Pink, Yellow, Purple, Orange
**And** a dashed "All 159 colors" card with grid icon appears in bottom-right position
**And** page dots update to show current page

**Given** the user is on Page 2 (accents)
**When** tapping "All 159 colors" dashed card or the "Browse all 159 colors" link
**Then** the current ColorHome grid (with tabs) pushes as a new BrowseAllColors screen
**And** back navigation returns to the redesigned home

**Given** the user taps a fabric swatch card
**When** the tap registers
**Then** hapticLight() fires
**And** the home transitions to State 2 (Story 8.4)

**Given** the user navigated to an accent color (e.g., Red) and taps back from State 2
**When** the home restores to State 1
**Then** Page 1 (basics) is always shown (not the accents page)

**Given** VoiceOver is active
**When** focusing on a fabric swatch
**Then** it announces "[Family name], tap to see combinations" with accessibilityRole="button"

### Story 8.3: ComboCard Component

As a **user browsing combinations for my shade**,
I want **a card showing the color palette, combination name, and clear actions (favorite + see outfit)**,
So that **I can scan combinations quickly, save favorites, and open the Visualizer without confusion**.

**Acceptance Criteria:**

**Given** a ComboCard is rendered in "full" variant
**When** the card displays
**Then** it shows: color strip (60px height, full width, colors fill equally), "yours" label on the user's shade segment, JP name (14px Noto Serif JP medium), EN name (11px Inter, #6b6b6b), heart icon (18px), and "See outfit" dark pill (dark bg, shirt icon + "See outfit" text 11px Inter white)

**Given** the user's selected shade appears in the combination
**When** the ComboCard renders with showYoursLabel=true and yourColorId set
**Then** "yours" text appears centered at the bottom of that color segment
**And** the label has adaptive contrast (light text on dark colors, dark text on light colors)

**Given** ComboCard renders with showYoursLabel=false (Favorites context)
**When** the card displays
**Then** no "yours" label appears on any color segment

**Given** the user taps anywhere on the combo card
**When** the tap registers
**Then** hapticMedium() fires
**And** navigation.push("OutfitVisualizer", { combinationId }) executes

**Given** the user taps the heart icon on a combo card
**When** the tap registers
**Then** the heart toggles (fill/unfill) via useFavorites().toggle(combinationId)
**And** hapticLight() fires
**And** the card tap does NOT fire (stopPropagation)
**And** premium paywall triggers if free user exceeds limit (via usePremiumGate)

**Given** a list of combo cards for a shade
**When** the cards render
**Then** they are ordered by combination size: 2-color first, then 3-color, then 4-color
**And** no section headers separate the groups

**Given** ComboCard is rendered in "compact" variant (for Favorites, Story 9.1)
**When** the card displays
**Then** it uses: 52px strip, 13px JP name, 10px EN name, 16px heart, 16px shirt icon (no text pill)
**And** no "yours" label appears

### Story 8.4: Home State 2 — Shade Picker + Combo Feed + Transform

As a **user who tapped a wardrobe family**,
I want **to pick my specific shade and scroll through matching outfit combinations**,
So that **I find the right palette for the exact color I'm wearing and can jump to the Visualizer**.

**Acceptance Criteria:**

**Given** the user taps a family swatch in State 1 (e.g., "Brown")
**When** the transform triggers
**Then** the home animates in-place to State 2 using Reanimated (no navigation push)
**And** the header shows "← Brown" back button (left) and "12 combos" count (right)
**And** a shade picker appears with 5 representative shades for the family
**And** the most popular shade is preselected (gold ring border + bold label)
**And** combo cards appear below filtered to the preselected shade

**Given** useReducedMotion() returns true
**When** the transform triggers
**Then** the transition happens instantly without animation

**Given** the shade picker is visible
**When** the user scrolls the combo feed down
**Then** the shade picker row remains sticky at the top (stickyHeaderIndices)
**And** it does not scroll away

**Given** the user taps a different shade pill (e.g., "Chocolate")
**When** the shade changes
**Then** hapticLight() fires
**And** the selected pill gets gold ring border + bold label
**And** the combo feed filters to combinations containing "Chocolate"
**And** the combo count updates ("8 combos")
**And** scroll position resets to top

**Given** the user taps "← Brown" back button
**When** the back action triggers
**Then** State 2 animates back to State 1 (reverse transform)
**And** the home shows the 6 fabric swatches again

**Given** the user taps a combo card in State 2
**When** navigation.push("OutfitVisualizer") fires
**Then** the OutfitVisualizer renders with the correct combinationId
**And** pressing back returns to State 2 with shade selection and scroll position preserved

**Given** VoiceOver is active
**When** focusing on a shade pill
**Then** selected shade announces "[Name], selected" with accessibilityRole="tab"
**And** unselected shade announces "[Name], tap to filter" with accessibilityRole="tab"
**And** the shade picker container has accessibilityRole="tablist"

### Story 8.5: BrowseAllColors + Navigation Cleanup

As a **user who wants to explore all 159 colors freely**,
I want **to access the original full color grid from the redesigned home**,
So that **I have an escape hatch for specific color searches beyond the 11 wardrobe categories**.

**Acceptance Criteria:**

**Given** the user taps "Browse all 159 colors" link (Page 1) or dashed card (Page 2)
**When** the navigation fires
**Then** the existing ColorHome grid (SwatchGroupTabs + SwatchGroup + 5-column grid) pushes as a BrowseAllColors screen
**And** all current functionality works: tab filtering, color tap → Combinations → OutfitVisualizer

**Given** the user is in BrowseAllColors
**When** pressing back
**Then** navigation returns to the redesigned home (State 1)

**Given** the ColorsStack navigator
**When** inspecting the screen configuration
**Then** the main ColorHome uses the new redesigned component (State 1 + State 2)
**And** BrowseAllColors is a separate screen using the current ColorHome code (preserved/renamed)
**And** OutfitVisualizer is reachable from both paths (State 2 combo card OR BrowseAllColors → Combinations)

**Given** the navigation type definitions
**When** inspecting ColorsStackParamList
**Then** BrowseAllColors is registered with no required params
**And** the existing Combinations screen remains accessible from BrowseAllColors path

---

## Epic 9: Favorites Redesign — Compact Collection

Users browse and sort saved combinations efficiently in a compact 2-column grid (8 visible vs 3 current) with sort pills and direct Visualizer access.

### Story 9.1: Favorites 2-Column Grid + ComboCard Compact

As a **user with saved favorite combinations**,
I want **to see my favorites in a compact 2-column grid with color strips and names**,
So that **I can scan 8 favorites per screen instead of 3, find combinations faster, and jump directly to the Visualizer**.

**Acceptance Criteria:**

**Given** the user opens the Favorites tab with saved combinations
**When** the screen renders
**Then** favorites display in a 2-column FlatList grid (numColumns=2)
**And** each card uses ComboCard "compact" variant: 52px color strip, 13px JP name, 10px EN name, 16px heart (filled red), 16px shirt icon
**And** cards have 12px column gap, 12px row gap, 16px horizontal padding
**And** card width is approximately (screenWidth - 32 - 12) / 2

**Given** the user taps a compact combo card
**When** the tap registers
**Then** navigation.push("OutfitVisualizer", { combinationId }) fires directly (no Combinations screen)
**And** hapticMedium() fires

**Given** the user taps the heart icon on a Favorites combo card
**When** the tap registers
**Then** the combination is unfavorited (removed from FavoritesContext)
**And** the card disappears from the grid (FlatList re-renders)
**And** hapticLight() fires
**And** if 0 favorites remain, EmptyState shows

**Given** the user has an odd number of favorites
**When** the grid renders
**Then** the last row shows 1 card, left-aligned (FlatList native behavior)

**Given** VoiceOver is active
**When** focusing on a compact card
**Then** it announces "[Name], [N] colors, saved" with accessibilityRole="button"
**And** the heart announces "Remove [Name] from favorites" with accessibilityRole="button"
**And** the shirt icon announces "See outfit for [Name]" with accessibilityRole="button"

**Given** the FavoritesStack navigator
**When** inspecting the screen configuration
**Then** the Combinations screen is removed from the stack
**And** FavoritesList navigates directly to OutfitVisualizer (stack depth: 2)

### Story 9.2: Sort Pills + Favorites Count + Empty State

As a **user with many saved favorites**,
I want **to sort my collection by recency, alphabetically, or by palette size, and see my total count**,
So that **I can find specific combinations quickly as my collection grows**.

**Acceptance Criteria:**

**Given** the Favorites screen renders with saved combinations
**When** the header area is visible
**Then** "Favorites" shows in 34px Noto Serif JP bold (iOS large title)
**And** the total count appears top-right (15px Inter, #a09080, e.g. "8")
**And** a sort pills row shows below: "Recent" (active), "A-Z", "By size"

**Given** "Recent" pill is active (default)
**When** the favorites list renders
**Then** combinations display in chronological order, most recent first (Set insertion order from FavoritesContext)

**Given** the user taps "A-Z" pill
**When** the sort changes
**Then** hapticLight() fires
**And** "A-Z" pill gets dark fill (#1a1a1a) + white text
**And** "Recent" pill becomes inactive (#F0F0EE fill + #6b6b6b text)
**And** favorites sort alphabetically by nameEn (localeCompare)

**Given** the user taps "By size" pill
**When** the sort changes
**Then** hapticLight() fires
**And** favorites sort by combination size: 2-color first, then 3-color, then 4-color

**Given** the user switches away from the Favorites tab and returns
**When** the Favorites tab mounts again
**Then** the sort resets to "Recent" (default, no persistence)

**Given** the user has 0 favorites
**When** the empty state renders
**Then** it shows the heart icon and text: "No favorites yet" / "Pick a color, explore combinations, and tap heart to save the ones you love"

**Given** VoiceOver is active
**When** focusing on sort pills
**Then** active pill announces "Sort by recent, selected" with accessibilityRole="tab"
**And** inactive pills announce "Sort alphabetically" / "Sort by size" with accessibilityRole="tab"
**And** the count announces "[N] saved combinations" with accessibilityRole="text"

---

## Epic 10: Visualizer Polish — Continuity & Save

Users see English combination names, save favorites directly from the Visualizer, and see contextual navigation titles.

### Story 10.1: Visualizer Adjustments — nameEn, Heart, Dynamic Title

As a **user viewing an outfit in the Visualizer**,
I want **to see the English combination name, save it to favorites without going back, and see a meaningful navigation title**,
So that **the experience feels continuous from the combo card and I can act on what I see immediately**.

**Acceptance Criteria:**

**Given** the OutfitVisualizer renders with a combination
**When** the WadaHeader displays
**Then** it shows nameJp (existing), then nameEn (14px, font-sans-medium, textSecondary color) on a new line below nameJp, then the existing subtitle "N colors · Sanzo Wada"
**And** nameEn is inside the shareViewRef (appears in shared images)

**Given** the OutfitVisualizer renders
**When** the action area below the capture area displays
**Then** a heart/favorite button (FavoriteButton component) appears to the left of the "Share Outfit" button
**And** the buttons are in a flex-row container with gap-4 and centered alignment
**And** the heart is OUTSIDE shareViewRef (does NOT appear in shared images)

**Given** the heart button reflects the current FavoritesContext state
**When** the combination was already favorited before entering
**Then** the heart shows filled
**And** tapping it unfavorites (toggle)
**And** hapticLight() fires

**Given** the combination was not favorited
**When** the user taps the heart
**Then** it favorites the combination via useFavorites().toggle()
**And** premium paywall triggers if needed (via usePremiumGate)
**And** hapticLight() fires

**Given** the OutfitVisualizer screen loads
**When** the navigation header renders
**Then** the title shows the combination's nameEn (e.g., "Autumn Dusk") instead of "Outfit Visualizer"
**And** the back button shows the default iOS back chevron

**Given** the Visualizer is reached from State 2 (Colors tab)
**When** the user presses back
**Then** navigation returns to State 2 with shade and scroll preserved

**Given** the Visualizer is reached from Favorites tab
**When** the user presses back
**Then** navigation returns to FavoritesList
