---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - product-brief-Project1-2026-03-12.md
  - react-native-feature-priorities-2026-03-12.md
  - market-color-coordination-pwa-research-2026-03-12.md
  - project-context.md
  - brainstorming-session-2026-03-11-102638.md
  - ux-design-specification.md
  - prd.md
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 1
  projectDocs: 1
classification:
  projectType: mobile_app
  domain: general
  complexity: low-medium
  projectContext: greenfield
---

# Product Requirements Document — Outfinder (React Native iOS)

**Author:** Alejandro
**Date:** 2026-03-12

## Executive Summary

Outfinder is a React Native iOS app that transforms Sanzo Wada's 1930s color masterwork — "A Dictionary of Color Combinations" — into a visual outfit coordination tool for the pocket. Users select a garment color, see curated harmonious combinations from Wada's 348 palettes, and visualize them as customizable clothing silhouettes they can share on Instagram and TikTok. The product targets style-conscious professionals aged 25-35+ who face daily decision paralysis combining garment colors — whether choosing a morning outfit or validating a purchase. The core interaction completes in under 30 seconds: select color → browse combinations → visualize as outfit → decide or share. No wardrobe cataloging, no photo uploads, no AI — just proven color harmony made visual and shareable. Monetization follows a freemium model: free core color lookup and Outfit Visualizer, premium tier for favorites, outfit saving, and advanced features via iOS In-App Purchase. The app evolves from a validated PWA prototype (Project1, 5 completed epics) into a public, monetizable App Store product. Android follows within 3 months of iOS validation.

### What Makes This Special

- **Outfit Visualizer — no competitor has this.** Colors become clothing. Users see palettes rendered as garment silhouettes they can customize (tap-swap colors between garments, toggle garment types) and share as visually striking images. This is the feature that makes social media content irresistible and drives organic virality.
- **Curated authority over algorithms.** Wada's combinations are proven across nearly a century of artistic use — not generated, not random, not AI-predicted. The cultural momentum is real: Wada is actively trending on TikTok within the intentional dressing movement.
- **Zero complexity, zero setup.** Competitors fail by adding friction — wardrobe cataloging (2-3hr setup, 72% churn), AI photo analysis (inconsistent results), account requirements. Outfinder delivers value in seconds with zero onboarding.
- **Zero marginal cost at scale.** Pure JSON lookup engine with no backend, no API calls, no AI inference costs. The entire dataset ships bundled in the app binary. Full offline functionality from first launch.
- **Validated foundation.** Built on a working PWA prototype with 5 completed epics, proven UX patterns, market research confirming a blue ocean position at the intersection of high color sophistication + high fashion specificity + visual outfit representation.

### Project Classification

- **Project Type:** Mobile app — React Native iOS, App Store distribution
- **Domain:** Consumer fashion-tech (general complexity — no regulated industry constraints)
- **Complexity:** Low-medium — JSON lookup engine with no backend, but App Store compliance, In-App Purchase integration, and social sharing add implementation complexity
- **Project Context:** Greenfield — new native iOS app built from scratch. The existing PWA (Project1) serves as a validated reference for product decisions and UX patterns, not as a codebase to migrate.
- **Repository Strategy:** The React Native iOS app (Outfinder) will be developed in a separate project directory/repository from the existing Project1 PWA. The PWA remains as-is in its current repository and serves only as a UX/product reference — no code, dependencies, or configuration is shared between the two projects. The new project will be initialized as a clean Expo managed project.

## Success Criteria

### User Success

- Users discover harmonious garment combinations they never considered — the "why didn't I think of this?" moment happens within the first session
- The core interaction (select color → see combinations → visualize outfit) completes in under 30 seconds
- Users accumulate favorites organically over time, indicating ongoing discovery value
- Users save outfits from the Outfit Visualizer — they're making real wardrobe decisions, not just browsing
- Users share outfit visualizations to Instagram/TikTok without prompting — the content is beautiful enough to share on its own
- Users return out of real need (morning routine, pre-shopping) — not gamification or push notifications

### Business Success

- **3-month (validation):** App published on App Store, real users downloading and using organically. Success = live and functional, not revenue
- **6-month (traction):** Consistent organic downloads, weekly returning users, social shares generating new installs without paid acquisition
- **12-month (monetization signal):** At least one paying user validates the premium model. Revenue targets set from real conversion data, not assumptions
- **Android launch:** Within 3 months of iOS validation, leveraging React Native cross-platform

### Technical Success

- App approved by Apple review on first or second submission
- Cold start time under 2 seconds on iPhone 12+
- Outfit Visualizer renders at 60fps with smooth tap-swap interactions
- App binary size under 30MB (bundled JSON dataset + SVG assets)
- Full offline functionality from first launch — no network dependency for core features
- Zero crash rate on critical paths (color selection, combination display, outfit visualization)

### Measurable Outcomes

| Metric | Target | Timeframe |
|--------|--------|-----------|
| App Store rating | 4.5+ stars | Post-launch |
| Outfit Visualizer adoption | 60%+ of users who view combinations | 3 months |
| Share rate | 10%+ of Visualizer sessions | 6 months |
| Weekly active users (WAU) | Consistent growth trend | 6 months |
| 90-day retention | 35%+ | 6 months |
| Organic install trend | Positive without paid acquisition | 6 months |
| Free-to-paid conversion | 4-6% of active users | 12 months |

## User Journeys

### Journey 1: Marta — Morning Outfit Discovery (Primary, Happy Path)

Marta, 28, marketing manager. Has ~50 pieces in her wardrobe but wears the same 5-6 combinations on repeat. It's 7:15 AM, she's standing in front of her closet holding a terracotta blazer she bought last month but hasn't figured out how to wear beyond white jeans.

She opens Outfinder. The color grid loads instantly — no splash screen, no login. She scrolls to the warm tones and taps the terracotta closest to her blazer. Six Wada palettes appear as horizontal color strips. The third one catches her eye: terracotta, sage green, cream. She taps the Outfit Visualizer icon.

The screen transforms. Three garment silhouettes appear — a jacket in terracotta, a sweater in sage, pants in cream. She taps the sweater to swap it with a t-shirt. The outfit clicks. She owns all three pieces but never combined them. "Why didn't I think of this?"

She taps Share, the outfit renders as a clean image with subtle Outfinder branding, and she posts it to her Instagram Story. Three friends DM her asking what app that is. She gets dressed in under 2 minutes. Total time in app: 25 seconds.

**Capabilities revealed:** Color grid with instant load, swatch family filtering, combination display, Outfit Visualizer with garment variant toggle, tap-swap interaction, native share flow, shareable image generation with branding.

### Journey 2: David — Pre-Purchase Validation (Primary, Different Context)

David, 31, software engineer starting a new role. He's at Zara, holding a dusty rose shirt. He likes it but has no idea if it'll work with anything he owns. His wardrobe is mostly navy, charcoal, and black.

He opens Outfinder and navigates to the pinks. He finds the dusty rose and taps it. Four palettes appear. He scans them for navy — the second palette shows dusty rose + navy + warm gray. He taps the Visualizer: shirt in dusty rose, pants in navy, jacket in warm gray. That's exactly what he'd wear to work.

He buys the shirt with confidence. No second-guessing, no asking his partner. The next day he wears the combination and gets a compliment. He saves the palette to Favorites — his first save. The app asks if he wants to unlock unlimited favorites with Premium. He thinks "maybe later" and closes the app. He already got the value.

**Capabilities revealed:** Color search/browse in store context, combination filtering, Outfit Visualizer for purchase validation, favorites save action, premium paywall touchpoint (soft, non-blocking), offline functionality (cell signal may be weak in store).

### Journey 3: Elena — Purchase Regret Prevention (Primary, Edge Case / Error Recovery)

Elena, 26, UX designer. She's browsing Mango online at 11 PM, about to buy a mustard cardigan. She's been burned before — 30% of her online purchases don't combine with her existing wardrobe.

She opens Outfinder and selects mustard. She sees 5 palettes. She's looking for charcoal specifically — she knows her wardrobe staples. She scans the palettes but none contain her exact charcoal. She taps the darkest gray in one palette — cross-navigates to that color's combinations. Now she sees charcoal + mustard + white in a different palette. She opens the Visualizer: cardigan in mustard, pants in charcoal, top in white. That works.

But what about her dark green coat? She goes back, selects mustard again, looks for green. Finds a palette with mustard + forest green + cream. Opens Visualizer: cardigan in mustard, coat in green, scarf in cream. Two confirmed outfits from one purchase. She buys the cardigan with zero regret.

**Capabilities revealed:** Cross-navigation between colors (the "pivot" interaction), multiple palette exploration for the same color, back navigation, Visualizer used as validation tool not just inspiration, multi-session value from a single color query.

### Journey 4: Content Creator — Viral Content Generation (Secondary)

Sofia, 24, fashion micro-influencer with 15K followers on TikTok. She creates "what to wear" content and is always looking for fresh angles. She discovers Outfinder through Marta's Instagram Story.

She downloads the app — no signup, instant access. She opens the onboarding, swipes through 4 slides, gets the concept immediately: Wada's 1930s color science applied to fashion. That's a content hook. She selects a trending color (butter yellow), opens the Visualizer, and starts customizing. She screen-records herself tapping through garment swaps — the interaction is visually satisfying. She shares the final outfit image to TikTok with the caption "A 1930s Japanese artist already knew what you should wear tomorrow."

The post gets 50K views. Her followers download Outfinder. She creates a series: "Wada Palette of the Week." She doesn't pay for Premium — she doesn't need favorites. But she drives 200+ downloads per video.

**Capabilities revealed:** Onboarding flow as content hook (Wada story), Visualizer as screen-recordable content, shareable image quality for TikTok, app branding on shared images (attribution), zero-friction download-to-value path for viral referrals.

### Journey 5: Marta — Premium Conversion (Retention & Monetization)

Two weeks after her first use, Marta has opened Outfinder 8 times. She's discovered 4 new combinations she loves and wants to save them. She taps the heart icon on a palette — a bottom sheet appears: "Save to Favorites — Premium Feature." She sees the value clearly: she's already using the app regularly, saving would let her build a personal palette library.

She taps "See Premium." The paywall shows what she gets: unlimited favorites, saved outfits, and outfit history. The price feels fair. She subscribes via Face ID + Apple Pay — two taps. Her saved palettes appear in a dedicated Favorites tab. The next morning she opens Favorites directly instead of browsing — her morning routine just got faster.

**Capabilities revealed:** Favorites as premium gate (soft paywall after proven value), In-App Purchase flow via StoreKit, Favorites tab as retention driver, paywall UX (clear value proposition, frictionless purchase), persistent local storage for favorites.

### Journey Requirements Summary

| Capability | Journeys | Priority |
|-----------|----------|----------|
| Color grid with swatch family tabs | 1, 2, 3, 4 | MVP |
| Combination display (PaletteStrips) | 1, 2, 3, 4 | MVP |
| Cross-navigation between colors | 3 | MVP |
| Outfit Visualizer (silhouettes + tap-swap) | 1, 2, 3, 4 | MVP |
| Garment variant toggle | 1 | MVP |
| Native Share API + image generation | 1, 4 | MVP |
| Shareable image with branding | 1, 4 | MVP |
| Onboarding flow (4 slides) | 4 | MVP |
| Haptic feedback on interactions | 1, 2, 3, 4 | MVP |
| Offline functionality | 2 | MVP |
| Favorites (save/unsave) | 2, 5 | MVP |
| Premium paywall (soft gate) | 2, 5 | MVP |
| In-App Purchase (StoreKit) | 5 | MVP |
| Favorites tab | 5 | MVP |
| VoiceOver / accessibility | All | MVP |

## Product Scope & Development Strategy

### MVP Strategy

**Approach:** Experience MVP — the product's value proposition is experiential (visual outfit coordination + social sharing), not feature-complete. The minimum viable experience must deliver the "aha moment" (abstract colors → clothing silhouettes) and the virality loop (share to Instagram/TikTok → organic downloads).

**Resource Requirements:** Solo developer using Claude Code as AI coding agent. React Native + Expo enables a single codebase. No backend infrastructure, no DevOps, no design team — the PWA provides validated UX patterns to reference.

**Timeline Target:** App Store submission within 8-10 weeks of development start.

### MVP Feature Set

**Rebuilt from PWA (native implementation):**
- Color Home: grid of 159 Wada colors organized by 6 swatch families with tab filtering
- Combinations: all palettes containing selected color as visual PaletteStrips with JP/EN names, cross-navigation
- Onboarding: 4-slide first-time framing flow adapted for native
- Haptic feedback: light/medium haptics via native APIs
- Accessibility (WCAG 2.1 AA): VoiceOver support, 44px touch targets, reduced motion respect
- Offline: bundled JSON dataset, full functionality without network
- Design system: same design tokens adapted to React Native / NativeWind

**New P0 features:**
- Favorites: save/unsave combinations with persistent local storage, dedicated favorites section
- Outfit Visualizer (polished): SVG garment silhouettes, tap-swap color interaction, garment variant toggle, palette bar assignment
- Social Sharing: shareable outfit image optimized for Instagram Stories/TikTok, subtle branding, 2-tap share via native Share API
- Brand Identity: "Outfinder" name, App Store icon, screenshots, metadata for fashion audience
- Premium Mode: freemium paywall with iOS In-App Purchase. Free: core color lookup + Visualizer. Premium: favorites, outfit saving, advanced features. Full StoreKit 2 integration ships at launch — pricing TBD

**Must-Have rationale (without these, the product fails):**

1. **Color Home grid** — the entry point
2. **Combination display** — the core lookup
3. **Outfit Visualizer** — the differentiator. Without it, Outfinder is just another color palette app
4. **Social Sharing** — the growth engine. Without it, there's no virality loop
5. **Favorites + Premium gate** — the monetization signal. Infrastructure ships at launch
6. **Offline functionality** — the reliability guarantee. Without it, the in-store use case breaks
7. **Onboarding** — the context setter. Wada's story is the content hook for sharing
8. **Haptic feedback** — the native feel. Without it, the app feels like a wrapped website
9. **VoiceOver accessibility** — the quality bar. App Store rejection risk without it

### Post-MVP Roadmap

**Phase 2 — Growth (P1, 1-3 months post-launch):**
- Filters by mood/occasion/season (LLM-assisted tagging of 348 combinations, then human review)
- Search by color name (text search across 159 color names JP/EN)
- User accounts + cloud sync (cross-device persistence, prepares for Android)
- Android launch (leverage React Native — primarily build/test/submit work)

**Phase 3 — Expansion (P2, 6+ months post-launch):**
- Educational content explaining why each combination works (harmony type, contrast theory)
- Community/social feed with user-submitted outfits organized by Wada palette
- Seasonal palettes tied to Fashion Week and Pantone Color of the Year
- Brand collaborations mapping fashion collections to Wada palettes
- Expanded palette systems beyond Wada — becoming the default "what colors go together for clothing" tool globally

### Confirmed NOT Doing

These exclusions are deliberate product decisions, not deferred features:

- **Wardrobe cataloging** — the #1 pain point in competitor apps (2-3hr setup, 72% churn). Outfinder's advantage is that it requires zero setup
- **AI color analysis (camera/selfie-based)** — competitors do this badly with inconsistent results. "Curated, Not Calculated" is the positioning moat
- **Personal color profiling (seasonal color analysis)** — not our differentiator. Wada's combinations work for everyone regardless of skin tone
- **Push notifications** — users return from real need (morning routine, pre-shopping), not from manufactured urgency
- **Dark mode (MVP)** — Wada's book aesthetic is white pages. Light-only for MVP preserves the design identity. Dark mode deferred to post-MVP

### Risk Mitigation

**Technical Risks:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| SVG rendering performance on older iPhones | Outfit Visualizer feels sluggish | Profile early on iPhone SE/12. Fallback: simplify garment SVGs or use PNG sprites |
| Image generation quality for sharing | Shared images look blurry on Instagram | Test react-native-view-shot vs Skia early. Target 1080x1920 @3x |
| StoreKit 2 integration complexity | Delays launch | Implement premium gate UI first, StoreKit last. Can soft-launch with paywall UI ready but free access while IAP is validated |
| App Store rejection | Delays launch by 1-2 weeks per rejection | Follow guidelines strictly. Submit early build for pre-review if available |

**Market Risks:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Wada TikTok trend fades before launch | Reduced organic discovery | Product value is independent of the trend. Trend accelerates, doesn't define |
| W.S. Colors adds outfit visualization | Competitive pressure | First-mover advantage + fashion positioning (they're design-focused). Execute fast |
| Users don't share outfit images | Virality loop breaks | Share flow must be 2 taps. Image quality must be Instagram-native. Test with real users |

**Resource Risks:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Solo dev burnout / scope creep | Timeline extends indefinitely | Strict 4-5 task stories (CLAUDE.md rule). Ship MVP, iterate post-launch |
| React Native / Expo learning curve | Slower initial velocity | PWA patterns transfer well. Expo simplifies native complexity. Claude Code assists |
| App Store review process delays | Launch date unpredictable | Submit TestFlight build early. Fix issues iteratively. Budget 2 weeks for review |

## Mobile App Technical Requirements

### Platform Requirements

- **Framework:** React Native (Expo managed workflow recommended for solo dev speed)
- **Target platform:** iOS only (MVP). Android deferred 3 months post-iOS validation
- **Minimum iOS version:** iOS 16+ (covers 95%+ of active iPhones, enables StoreKit 2)
- **Target devices:** iPhone 12 and newer (primary), iPhone SE 3rd gen (minimum)
- **Orientation:** Portrait only
- **Distribution:** Apple App Store (public listing)

### Device Permissions

| Permission | Usage | Required |
|-----------|-------|----------|
| None (core) | Color lookup, combinations, Outfit Visualizer | No permissions needed |
| Photo Library (write) | Save shared outfit image to camera roll | Optional, on-demand |
| Haptic Engine | Tactile feedback on interactions | No permission needed (system API) |
| Network | Future analytics, premium validation | Not required for core functionality |

- No camera, microphone, location, or contacts permissions
- Minimal permission footprint = faster App Store review, higher user trust

### Offline Mode

- Full offline-first architecture — the entire app functions without network connectivity
- Color dataset (159 colors, 348 palettes) bundled as JSON in the app binary (~60KB)
- SVG garment assets bundled in the app binary
- Premium status cached locally after initial purchase validation
- Network only needed for: In-App Purchase transactions, future analytics

### App Store Compliance

- **Review Guidelines:** Standard consumer app, no restricted content categories
- **In-App Purchase:** StoreKit 2 API for premium subscription. Auto-renewable subscription type. Apple's 15% commission (Small Business Program eligible)
- **Privacy:** App Privacy Label declares "Data Not Collected" — no tracking, no analytics in MVP, no user accounts
- **Content rights:** Sanzo Wada's color data is Creative Commons — no IP licensing required
- **Age rating:** 4+ (no objectionable content)
- **ASO:** Screenshots featuring Outfit Visualizer, keyword targeting for "outfit," "color coordination," "what to wear"

### Implementation Considerations

- **React Native + Expo:** Managed workflow for fast iteration. EAS Build for App Store submissions. Expo Router for navigation
- **SVG rendering:** react-native-svg for garment silhouettes in Outfit Visualizer
- **Image generation:** react-native-view-shot or Skia for rendering outfit visualization as shareable PNG (1080x1920 for Instagram Stories)
- **Local storage:** AsyncStorage or MMKV for favorites persistence (simple key-value, no SQLite needed)
- **Styling:** NativeWind (Tailwind CSS for React Native) to maintain design token consistency with PWA reference
- **Haptics:** expo-haptics for light/medium feedback on color selection and Visualizer interactions
- **StoreKit 2:** expo-in-app-purchases or react-native-iap for premium subscription management

## Functional Requirements

### Color Discovery

- **FR1:** User can view all 159 Wada colors displayed as a visual grid
- **FR2:** User can filter colors by swatch family (6 groups) using tab navigation
- **FR3:** User can tap a color to view all Wada palettes containing that color
- **FR4:** User can scroll through the color grid to browse all available colors

### Combination Display

- **FR5:** User can view all palettes for a selected color as horizontal palette strips
- **FR6:** User can see the Japanese and English name for each palette
- **FR7:** User can tap any color within a palette to cross-navigate to that color's combinations
- **FR8:** User can navigate back to the previous color's combinations after cross-navigating

### Outfit Visualization

- **FR9:** User can open the Outfit Visualizer from any palette to see colors rendered as garment silhouettes
- **FR10:** User can tap-swap colors between garment slots to reassign which color goes to which garment
- **FR11:** User can toggle garment types (e.g., swap a sweater for a t-shirt, pants for a skirt)
- **FR12:** User can see the palette bar with color assignments that updates as garments are swapped
- **FR13:** User can visualize palettes of 2, 3, or 4 colors with appropriate garment combinations

### Social Sharing

- **FR14:** User can generate a shareable image of the current outfit visualization
- **FR15:** User can share the generated image via the device's native sharing interface (Instagram, TikTok, Messages, etc.)
- **FR16:** Shared images include Outfinder branding (logo or watermark) occupying no more than 5% of image area, without obscuring the outfit visualization
- **FR17:** Shared images are optimized for Instagram Stories dimensions (1080x1920)
- **FR18:** User can complete the share flow in 2 taps or fewer from the Visualizer

### Favorites & Collections

- **FR19:** User can save a color combination to Favorites
- **FR20:** User can unsave a previously saved combination
- **FR21:** User can view all saved favorites in a dedicated Favorites section
- **FR22:** Favorites persist across app sessions via local storage
- **FR23:** User can access Favorites from the main navigation

### Premium & Monetization

- **FR24:** User can access the core color lookup and Outfit Visualizer for free (free tier)
- **FR25:** User encounters a soft paywall when attempting to save more than 5 favorites (soft gate — first 5 are free, paywall appears on 6th save attempt)
- **FR26:** User can view premium tier benefits and pricing from the paywall
- **FR27:** User can subscribe to premium via iOS In-App Purchase (StoreKit 2)
- **FR28:** User can complete the purchase flow using Face ID / Apple Pay
- **FR29:** User can restore previous purchases on a new device or reinstall
- **FR30:** Premium status is cached locally and persists across sessions

### Onboarding

- **FR31:** First-time user sees a 4-slide onboarding flow explaining the app concept and Wada's story
- **FR32:** User can swipe through onboarding slides or skip the flow entirely
- **FR33:** Onboarding only appears on first launch, not on subsequent sessions

### Accessibility

- **FR34:** User can navigate all screens and interactive elements using VoiceOver
- **FR35:** All interactive elements have minimum 44px touch targets
- **FR36:** User with reduced motion preferences sees no animations
- **FR37:** All non-text elements (color swatches, garment silhouettes) have descriptive accessibility labels

### Haptic Feedback

- **FR38:** User receives light haptic feedback on color selection and tab switching
- **FR39:** User receives medium haptic feedback on Outfit Visualizer interactions (tap-swap, garment toggle)

### Navigation & App Structure

- **FR40:** User can navigate between Color Home, Combinations, Outfit Visualizer, and Favorites screens
- **FR41:** User can return to the Color Home from any screen
- **FR42:** App preserves navigation state during a session (back stack)

### Offline & Performance

- **FR43:** User can use all core features without network connectivity
- **FR44:** App launches and displays the color grid within 2 seconds on target devices

## Non-Functional Requirements

### Performance

- **NFR1:** Color grid renders all 159 swatches within 500ms of screen mount
- **NFR2:** Combination list for any color loads within 300ms
- **NFR3:** Outfit Visualizer maintains 60fps during tap-swap and garment toggle animations
- **NFR4:** App cold start to interactive color grid in under 2 seconds on iPhone 12+
- **NFR5:** Share image generation completes within 1 second (no loading spinner)
- **NFR6:** Navigation transitions between screens complete within 300ms
- **NFR7:** App binary size under 30MB (including bundled JSON + SVG assets)
- **NFR8:** Memory usage stays under 150MB during Outfit Visualizer interactions

### Security

- **NFR9:** IAP receipt validation prevents unauthorized premium access without requiring server infrastructure
- **NFR10:** Premium status stored in platform-secure storage resistant to casual inspection
- **NFR11:** No user data collected, transmitted, or stored on any external server
- **NFR12:** App declares "Data Not Collected" on App Store Privacy Label truthfully

### Accessibility

- **NFR13:** Full WCAG 2.1 AA compliance across all screens
- **NFR14:** VoiceOver reads meaningful descriptions for all color swatches (color name, family)
- **NFR15:** VoiceOver announces state changes in Outfit Visualizer (which garment received which color)
- **NFR16:** All touch targets minimum 44x44 points
- **NFR17:** App respects iOS Dynamic Type for text elements (minimum support, not full scaling)
- **NFR18:** App respects iOS Reduce Motion setting — disables all animations when enabled
- **NFR19:** Color information never conveyed by color alone — names and labels always present

### Reliability

- **NFR20:** Zero crash tolerance on critical paths (color selection → combinations → Visualizer → share)
- **NFR21:** App functions identically with airplane mode enabled (offline-first)
- **NFR22:** Favorites data survives app updates without loss
- **NFR23:** IAP purchase restoration succeeds after reinstall or device migration

### Compatibility

- **NFR24:** Supports iOS 16.0 and above
- **NFR25:** Functions correctly on all iPhone screen sizes from iPhone SE (3rd gen) to iPhone 16 Pro Max
- **NFR26:** Light mode only for MVP (Wada's book aesthetic is white pages). Dark mode adaptation deferred to post-MVP
- **NFR27:** Shared images render correctly when viewed on Instagram Stories, TikTok, and iMessage
