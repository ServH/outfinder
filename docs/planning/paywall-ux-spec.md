# PremiumPaywall — "The Collector" UX/UI Specification

> Approved design direction: Proposal C from `outfinder_paywall_wada.html`.
> This spec defines every visual, interaction, and accessibility detail for the dev agent.

---

## Design Philosophy

The paywall is **not a gate — it's a mirror**. It shows the user what they've already built (their saved combinations) and invites them to keep building. The emotional trigger is ownership, not scarcity. The user sees their personal collection and feels: "I've curated these — I want to keep going."

**Core principles:**
- Shows the user's actual saved palettes — not generic marketing
- Price is always visible, never hidden behind the CTA
- "One-time purchase" is emphasized — reduces subscription anxiety
- Three escape routes: swipe down, tap "Not now", tap dim overlay
- Never reappears in the same session after dismissal
- Zero dark patterns: no countdowns, no "you'll lose your favorites", no urgency

---

## Trigger Conditions

| Condition | Behavior |
|-----------|----------|
| User taps ♡ on a combination AND `favorites.count < 5` | Normal favorite toggle — no paywall |
| User taps ♡ on a combination AND `favorites.count === 5` AND `isPremium === false` | PremiumPaywall bottom sheet appears instead of saving |
| User taps ♡ AND `isPremium === true` | Normal favorite toggle — no limit |
| Paywall was dismissed in current session | Do NOT show paywall again this session; the 6th+ favorite tap does nothing (heart stays outline) with a subtle toast: "Upgrade to save more" |
| User taps "Upgrade to Premium" in Settings | PremiumPaywall appears (regardless of favorites count) |

**Important:** The favorite is NOT saved when the paywall appears. The user must complete the purchase first, then the favorite is saved automatically after purchase confirmation.

---

## Layout Anatomy (Bottom Sheet)

The paywall is a bottom sheet that covers approximately 70% of the screen height, sliding up from the bottom with a spring animation.

### Behind the sheet (visible through dim)
- The Combinations screen the user was browsing remains visible
- Dim overlay: `rgba(0, 0, 0, 0.30)` — enough to focus attention, light enough to maintain context

### Sheet structure (top to bottom)

```
┌─────────────────────────────────────────┐
│              ── drag handle ──           │  4px × 36px, radius 2, rgba(0,0,0,0.12)
│                                         │  10px top margin
│  ┌─────────────────────────────────────┐│
│  │  "Your collection"    "♥ 5 saved"   ││  Left-right justified labels
│  │  ┌─────────────────────────────────┐││
│  │  │ ██████ ██████ ██████            │││  Saved palette strip 1 (32px tall)
│  │  ├─────────────────────────────────┤││
│  │  │ ██████ ██████ ██████            │││  Saved palette strip 2
│  │  ├─────────────────────────────────┤││
│  │  │ ██████ ██████ ██████            │││  Saved palette strip 3
│  │  ├─────────────────────────────────┤││
│  │  │ ██████ ██████ ██████ ██████     │││  Saved palette strip 4
│  │  ├─────────────────────────────────┤││
│  │  │ ██████ ██████ ██████            │││  Saved palette strip 5
│  │  ├─────────────────────────────────┤││
│  │  │ ░░░░░░ ░░░░░░ ░░░░░░ ░░░░░░   │││  Blocked palette (opacity 0.35)
│  │  └─────────────────────────────────┘││  — the 6th one they tried to save
│  └─────────────────────────────────────┘│
│                                         │
│        ┌─ 5 of 5 free favorites used ─┐ │  Badge: pill shape
│        └──────────────────────────────┘ │
│                                         │
│            Don't stop                   │  Headline: Noto Serif JP
│            collecting                   │
│                                         │
│    You've found 5 harmonies worth       │  Body text
│    keeping. There are N more            │
│    combinations waiting to be           │
│    discovered.                          │
│                                         │
│  ┌────────┐ ┌──────────────────────────┐│
│  │ €0.99  │ │    Unlock Unlimited      ││  Price tag + CTA side by side
│  │one time│ │                          ││
│  └────────┘ └──────────────────────────┘│
│                                         │
│     Restore Purchase      Not now       │  Secondary links, centered
│                                         │
└─────────────────────────────────────────┘
```

---

## Visual Specifications

### Sheet container
- Background: `wadaTokens.bgPaper` (#fafaf8)
- Border radius: 20px top-left, 20px top-right, 0 bottom
- Horizontal padding: 24px
- Bottom padding: 40px (accounts for home indicator safe area)

### Drag handle
- Size: 36px × 4px
- Border radius: 2px
- Color: `rgba(0, 0, 0, 0.12)`
- Top margin: 10px
- Centered horizontally

### Saved Palettes Preview section
- Top margin: 24px from drag handle
- **Header row** (flex row, space-between):
  - Left: "Your collection" — Inter 11px, weight 400, color `wadaTokens.textTertiary` (#9b9b9b)
  - Right: "♥ {count} saved" — Inter 11px, weight 400, color `wadaTokens.favoriteRed` (#E74C3C). The ♥ is a text character, not an SF Symbol here (for simplicity in the small size)
- **Palette strips**: vertical stack, gap 6px, margin-top 4px from header
  - Each strip: height 32px, border-radius 5px, overflow hidden
  - Colors are flex: 1 (equal width per color in the combination)
  - **Strips 1–5**: full opacity (1.0) — these are the user's actual saved combinations, rendered using their real hex colors from `getCombination(favoriteId).colors`
  - **Strip 6 (blocked)**: opacity 0.35 — this is the combination the user just tried to save. It appears faded/ghosted to communicate "this one didn't make it"
  - If the user has fewer than 5 saved (Settings entry point), only show actual saved palettes and omit the faded strip

### Limit badge
- Margin: 8px top, 20px bottom (centered)
- Shape: pill (border-radius 20px)
- Background: `rgba(196, 162, 101, 0.10)` (premiumAccent at 10% opacity)
- Text color: `wadaTokens.premiumAccent` (#c4a265)
- Font: Inter 11px, weight 500
- Padding: 5px horizontal 12px
- Content: "5 of 5 free favorites used"
- Uses `accessibilityRole="text"`

### Headline
- Font: Noto Serif JP 20px, weight 400
- Color: `wadaTokens.textPrimary` (#1a1a1a)
- Line height: 1.4 (28px)
- Text align: center
- Content: "Don't stop\ncollecting"
- Margin-bottom: 10px

### Body text
- Font: Inter 13px, weight 300
- Color: `wadaTokens.textSecondary` (#6b6b6b)
- Line height: 1.6 (~21px)
- Text align: center
- Horizontal padding: 8px (within the 24px sheet padding = 32px from edge)
- Content: "You've found 5 harmonies worth keeping. There are {totalCombinations - 5} more combinations waiting to be discovered."
  - `{totalCombinations}` = `getAllCombinations().length` (currently 348)
  - So the text reads: "There are 343 more combinations waiting to be discovered."
- Margin-bottom: 24px

### Price + CTA row
- Layout: flex row, gap 12px, align-items center
- Margin-bottom: 16px

**Price tag (left):**
- Background: `wadaTokens.bgElevated` (#f5f5f3)
- Border radius: 10px
- Padding: 12px horizontal 16px
- Flex-shrink: 0
- **Amount**: Inter 22px, weight 600, color `wadaTokens.textPrimary`
  - Content: loaded from RevenueCat offering (`offering.availablePackages[0].product.priceString`), fallback "€0.99"
- **Label**: Inter 10px, weight 400, color `wadaTokens.textTertiary`
  - Content: "one time"
  - Margin-top: 1px
- Text align: center within the tag

**CTA button (right):**
- Flex: 1 (fills remaining width)
- Padding: 16px vertical
- Background: `wadaTokens.textPrimary` (#1a1a1a)
- Border radius: 14px
- Text: "Unlock Unlimited" — Inter 15px, weight 500, color `wadaTokens.bgPaper` (#fafaf8), letter-spacing 0.3px
- `accessibilityRole="button"`
- `accessibilityLabel="Unlock unlimited favorites for {priceString}"`
- On press: triggers RevenueCat purchase flow (StoreKit 2 sheet)

### Secondary actions row
- Layout: flex row, justify-content center, gap 24px
- Margin-top: 4px

**"Restore Purchase":**
- Font: Inter 13px, weight 400, color `wadaTokens.textTertiary` (#9b9b9b)
- No underline, no button styling
- `accessibilityRole="button"`
- `accessibilityLabel="Restore previous purchase"`
- On press: calls `Purchases.restorePurchases()`

**"Not now":**
- Font: Inter 13px, weight 400, color `wadaTokens.textTertiary` (#9b9b9b)
- No underline, no button styling
- `accessibilityRole="button"`
- `accessibilityLabel="Dismiss paywall"`
- On press: dismisses the sheet + sets session flag to not show again

---

## Animations & Transitions

All animations respect `useReducedMotion()`. When reduced motion is enabled, transitions are instant (no spring, duration 0).

### Sheet entrance
- Slides up from below screen bottom
- Spring config: `damping: 20, stiffness: 200` (Reanimated)
- Duration: ~300ms
- Dim overlay: fades in parallel, `opacity 0 → 0.30`, duration 200ms (linear)

### Sheet dismissal (any of the 3 routes)
- Slides down with spring: `damping: 25, stiffness: 250`
- Dim overlay: fades out in parallel, `opacity 0.30 → 0`, duration 150ms
- On animation complete: unmount sheet, set `paywallDismissedThisSession = true`

### Swipe-to-dismiss gesture
- Sheet tracks vertical pan gesture (drag down)
- If dragged > 100px down from starting position → dismiss
- If dragged < 100px → spring back to original position
- Velocity threshold: if velocity > 500 → dismiss regardless of distance

### CTA button press
- Scale: `1.0 → 0.97` on press-in (spring), `0.97 → 1.0` on press-out
- Very subtle — not bouncy

### Blocked palette strip (strip 6)
- On sheet entrance, strips 1-5 appear immediately
- Strip 6 fades in after a 200ms delay: `opacity 0 → 0.35` over 300ms
- This creates a subtle "this one didn't make it" narrative beat

---

## Haptics

| Event | Haptic | Rationale |
|-------|--------|-----------|
| Paywall appears (sheet slides up) | `.light` | Gentle notification — something happened |
| CTA "Unlock Unlimited" tapped | None | StoreKit takes over with its own haptics |
| Purchase confirmed | `.rigid` | Definitive moment — money exchanged |
| "Not now" / dismiss | None | Quiet exit, no judgment |
| Restore purchase success | `.light` | Positive confirmation |
| Restore purchase failure | None | Error toast handles feedback |

---

## Accessibility

### VoiceOver flow (reading order)
1. Drag handle (no label — decorative)
2. "Your collection. {count} combinations saved" (the header row, grouped)
3. Each saved palette strip: "{combination.nameEn}. {color count} colors: {color names}" (e.g., "Combination 47. 3 colors: Crimson, Sand, Evergreen")
4. Blocked palette strip: "Locked combination. Upgrade to save"
5. Limit badge: "5 of 5 free favorites used"
6. Headline: "Don't stop collecting"
7. Body text (as written)
8. Price tag: "{priceString}, one-time purchase"
9. CTA: "Unlock unlimited favorites for {priceString}"
10. "Restore previous purchase" button
11. "Dismiss paywall" button

### Dynamic Type
- All text scales with Dynamic Type (`allowFontScaling: true`)
- If headline would exceed 2 lines at larger sizes, it remains 2 lines (no truncation needed — "Don't stop collecting" is short enough)
- If body text exceeds container, sheet becomes scrollable (ScrollView wrapping content)

### Minimum touch targets
- CTA button: full width, 48px+ tall — exceeds 44px minimum
- Price tag: not tappable (informational only)
- "Restore Purchase" and "Not now": 44px minimum hit area (padding around text)
- Dim overlay: tappable to dismiss (entire area)

---

## Component Interface

```typescript
interface PremiumPaywallProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** The combination the user tried to save (shown as faded strip 6) */
  blockedCombination?: Combination;
  /** User's currently saved favorite combination IDs */
  favoriteCombinationIds: string[];
  /** Price string from RevenueCat (e.g., "€0.99") */
  priceString: string;
  /** Called when user taps "Unlock Unlimited" */
  onPurchase: () => void;
  /** Called when user taps "Restore Purchase" */
  onRestore: () => void;
  /** Called when sheet is dismissed (any route) */
  onDismiss: () => void;
}
```

### Data flow

1. **FavoriteButton** detects `count === 5 && !isPremium` on tap
2. Instead of calling `toggleFavorite`, it calls `onPremiumGate(combinationId)`
3. Parent (Combinations screen) sets `paywallVisible: true` and stores `blockedCombinationId`
4. **PremiumPaywall** receives the favorite IDs, resolves each via `getCombination(id)` to get real hex colors
5. On purchase success: `PremiumContext` updates → `FavoritesContext.toggleFavorite(blockedCombinationId)` is called → paywall dismisses → the 6th favorite is saved

### Session flag

The "don't show again this session" flag lives in `PremiumContext` as a non-persisted state:

```typescript
// Inside PremiumContext
const [paywallDismissedThisSession, setPaywallDismissedThisSession] = useState(false);
```

This resets on app restart (not persisted to storage). Exposed via `usePremium().paywallDismissedThisSession`.

---

## Edge Cases

| Case | Behavior |
|------|----------|
| User has fewer than 5 favorites (Settings entry) | Show only the saved palettes (no faded strip 6). Badge shows "{count} of 5 free favorites used". Body text adjusts count accordingly |
| User has 0 favorites (Settings entry) | Palettes preview section is hidden entirely. Badge shows "0 of 5 free favorites used" |
| RevenueCat fails to load price | Fallback price string: "€0.99". Log error but don't block paywall |
| Purchase fails (network, cancel, StoreKit error) | Toast with user-friendly message: "Purchase couldn't be completed. Try again." Paywall stays open for retry |
| Restore finds no purchases | Toast: "No previous purchase found." Paywall stays open |
| Restore succeeds | Paywall dismisses with `.light` haptic. Toast: "Premium restored!" |
| User dismisses, then taps ♡ again in same session | Heart stays outline. Subtle toast: "Upgrade to save more favorites" (3s auto-dismiss). No paywall |
| App memory pressure | Sheet is lightweight — no images, no heavy computation. Only renders the hex color bars |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/PremiumPaywall.tsx` | Create | The bottom sheet component per this spec |
| `src/components/PremiumPaywall.test.tsx` | Create | Tests: renders saved palettes, blocked strip, badge, headline, CTA, restore, dismiss, accessibility |
| `src/components/FavoriteButton.tsx` | Modify | Add `onPremiumGate` prop, check free limit before calling `onToggle` |
| `src/contexts/PremiumContext.tsx` | Create | `isPremium`, `paywallDismissedThisSession`, RevenueCat init |
| `src/contexts/FavoritesContext.tsx` | Modify | Add awareness of premium status for limit enforcement |
| `src/screens/Combinations.tsx` | Modify | Wire up paywall visibility state and blocked combination |

---

*Spec created: 2026-03-18. Reference mockup: `docs/planning/outfinder_paywall_wada.html` (Proposal C).*
