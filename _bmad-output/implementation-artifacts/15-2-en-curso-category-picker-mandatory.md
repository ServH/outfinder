# Story 15.2: B1 — CategoryPicker mandatory in "En curso" flow (Foto nueva + Biblioteca)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user adding a garment to a Wada slot from the "En curso" flow (the `ArmarioPickerScreen` → "Foto nueva" or "Biblioteca" entry points),
I want the app to ask me which category the garment belongs to before persisting it,
so that every wardrobe item I create has a real, user-chosen category — coherent with the cámara FAB flow — and I never end up with garments silently saved as `"top"` due to the legacy TD-7 default.

This closes the last functional gap before v1.4.0 launch (DEC-2: categoría OBLIGATORIA en flujo "En curso") and retires the `category: "top"` hardcoded default at `ArmarioPreviewScreen.tsx:113`.

## Acceptance Criteria

1. **Sheet appears on Save tap (Foto nueva path).** From `ArmarioPicker → s3-footer-new-photo → ArmarioCapture` (camera shutter) → `ArmarioPreview`, when the user taps `armario-preview-use-button`, the **`CategoryPickerSheet` opens** and `saveCutoutAsWardrobeItem` is **NOT** called yet. The cutout image, Retake button, and Back chevron remain visible/usable while the sheet is open (sheet is a modal overlay, not a screen replacement).

2. **Sheet appears on Save tap (Biblioteca path).** Same behavior when entry was via `ArmarioCapture → armario-library-button → ImagePicker`. Confirmed via code inspection that both paths converge in `ArmarioCaptureScreen.handlePhoto()` (line ~118–149) and push the same `ArmarioPreview` route — a single change in `ArmarioPreviewScreen` covers both. No separate wiring needed for "Biblioteca".

3. **Confirm with selected category persists with that category.** Tapping a row in the sheet (e.g. `category-picker-row-footwear`) then `category-picker-sheet-confirm` invokes `saveCutoutAsWardrobeItem({ cutoutUri, sourceUri, isPremium, category: <selected> })` with the user-selected `WardrobeCategory` — **never the hardcoded `"top"`**. The TD-7 comment + literal at `ArmarioPreviewScreen.tsx:109–113` is removed.

4. **Cancel sheet without confirming → no save, no navigation.** Tapping `category-picker-sheet-backdrop` or pressing system Back while the sheet is open closes the sheet, restores the Preview screen with CTAs re-enabled, and **does not call** `saveCutoutAsWardrobeItem`, `goBack`, parent `goBack`, `onCutoutSaved`, or `File.delete`. The cutout tmp survives so the user can pick a different category or tap Retake.

5. **In-flight UX during save.** While `saveCutoutAsWardrobeItem` is awaiting, the sheet stays mounted with `confirming={true}` (renders `category-picker-sheet-confirm-spinner` inside the sheet's confirm button — already implemented in `CategoryPickerSheet`). Preview's Retake + Back chevron + Use button get `accessibilityState={ disabled: true }` (Use additionally `busy: true`) for the same window. The sheet's backdrop tap is gated by `confirming` prop (already implemented).

6. **Happy path: save resolves → callback → root dismiss (preserves Test #9 invariant).** On `saveCutoutAsWardrobeItem` resolve: `hapticRigid()` fires → sheet closes (`categorySheetVisible=false`) → `onCutoutSaved?.(result.id)` is invoked **BEFORE** the navigation dismiss → if `onCutoutSaved` is present, `navigation.getParent()?.goBack()` dismisses the ArmarioRoot modal so the user lands back on `ArmarioPickerScreen` (which then runs `commitAndDismiss(result.id)` → assigns to slot). If `onCutoutSaved` is absent (DEV-menu Settings entry: `Settings.tsx:320`), local `navigation.goBack()` fires instead. The invocation order callback-before-parent-goBack is preserved (current Test #9 asserts this).

7. **Paywall path with category preservation.** When `saveCutoutAsWardrobeItem` rejects with `WardrobePersistenceError(kind: "paywall")`: the sheet hides (`categorySheetVisible=false`), `paywallVisible=true`, the user-selected category is **stashed in `pendingCategoryRef`** (mirrors `UnifiedCameraResultScreen.tsx:100` pattern), and the Preview CTAs re-enable. If the user purchases premium, the existing `paywallVisible || confirming` aftermath effect re-triggers `handleCategoryConfirm(pendingCategoryRef.current)` silently with the same category (no second sheet open). On dismiss-without-purchase, `pendingCategoryRef` clears and the user can retry from Preview's Use button.

8. **Error paths (encode / move / repoAdd / diskFull) flow through the sheet.** When `saveCutoutAsWardrobeItem` rejects with `kind in {"encode","move","repoAdd","diskFull"}`: sheet closes, `confirming=false`, the existing `armario-preview-error-sheet` renders with the matching copy (`armario.preview.errorEncode` / `errorSaveFailed` / `errorDiskFull`), and Preview CTAs re-enable. Tapping `armario-preview-error-dismiss-button` clears the error copy without calling `File.delete` (preserves existing Test #6 invariant: tmp cleanup belongs to Retake, not error dismissal).

9. **Auto-save flow downstream UNCHANGED.** Once the picker receives `onCutoutSaved(result.id)`, its existing `commitAndDismiss(wardrobeItemId)` continues to call `assign(combinationId, colorIndex, wardrobeItemId)` + `addFavorite(combinationId)` + `lookSavedAnnouncement` exactly as today (Story 14.8 auto-save behavior). **The `onCutoutSaved` callback signature stays `(id: string) => void`** — it does NOT receive `category`. (Deviation from epic spec line 119: the picker's only job is slot assignment; category is already persisted upstream by `saveCutoutAsWardrobeItem`. Adding a `category` arg would be dead-weight wiring with zero downstream consumer.)

10. **i18n: zero new keys.** The sheet reuses `unifiedCamera.categorySheet.*` keys (already shipped by Story 14.5 in `es.json:387–397` + `en.json` parallel). No new strings in this story → NFR2 satisfied with zero translation work.

11. **Accessibility (NFR1, NFR6).** All sheet interactions go through `CategoryPickerSheet`'s existing a11y wiring (testIDs, `accessibilityLabel`, `accessibilityState.selected`, `accessibilityRole="header"` on title) — no new a11y obligations on this story. Reduce Motion is handled by the underlying `Modal animationType="slide"` (system-respecting). VoiceOver users hear the existing `cutoutReady` announcement on Preview mount, then the sheet's title on slide-in.

12. **Regressions: zero.** All 11 existing `ArmarioPreviewScreen.test.tsx` cases continue to pass (with mechanical updates to inject the sheet step before save assertions). All 7+ existing `ArmarioPickerScreen.test.tsx` cases involving the capture path (Tests "footer + Nueva foto navigates…", "onCutoutSaved commits the new item AND dismisses…") pass UNCHANGED — picker is not modified.

13. **CI gates green.**
    - Pre-baseline on `epic-15` HEAD `56579b5`: tsc **0 errors**, lint **2 errors** (pre-existing `FavoritesList.test.tsx` + `OutfitVisualizer.tsx > handleMakeMine` Biome format — out-of-scope per `feedback_no_patches.md`), pnpm test **961 passing / 3 skips / 964 total**, skips **0 new**.
    - Expected post: tsc **0 unchanged**, lint **2 unchanged** (pre-existing only — do NOT auto-format), pnpm test **+5 to +7 net delta** (sheet-opens, cancel-without-save, confirm-with-category-X, paywall-pending-ref, error-paths-through-sheet — count adjustable, total ≥+5), skips **0 new**.

14. **On-device smoke (Alejandro, iPhone 16 Pro).** Both ES and EN locales:
    - From Mis Looks → tap a Wada combo → Picker → "Foto nueva" → take photo → tap "Usar esta foto" → sheet appears → tap "Calzado" → "Confirmar" → spinner → modal dismisses → return to Picker → garment lands in the slot with category "footwear" (verify in edit-category badge per Story 14.12b).
    - Same flow but Biblioteca path: Picker → "Foto nueva" (camera) → "Biblioteca" button → pick image → tap "Usar esta foto" → sheet → "Accesorio" → save → slot assigned.
    - Cancel path: Picker → "Foto nueva" → photo → tap "Usar esta foto" → sheet appears → tap backdrop → sheet closes, Preview still showing cutout, Retake + Use still tappable. Tap Retake → camera reopens.
    - Free-tier paywall: with 10 items already saved (pre-fill via DEV-menu), tap "Foto nueva" → cutout → "Usar esta foto" → sheet → "Parte de arriba" → "Confirmar" → paywall appears (sheet has hidden behind it) → dismiss without purchase → land back on Preview, CTAs enabled, tap Use again → sheet reopens (NOT auto-confirmed) → user starts over.

## Tasks / Subtasks

- [x] **Task 1 — Wire `CategoryPickerSheet` into `ArmarioPreviewScreen` (AC #1, #2, #3, #4, #5).**
  - [x] Import `CategoryPickerSheet` from `@/components/armario/CategoryPickerSheet` and `WardrobeCategory` from `@/lib/wardrobeTypes`.
  - [x] Add state: `const [categorySheetVisible, setCategorySheetVisible] = useState(false);`
  - [x] Add ref: `const pendingCategoryRef = useRef<WardrobeCategory | null>(null);` (mirror `UnifiedCameraResultScreen.tsx:100`).
  - [x] Refactor `handleUse` from "save now" → "open sheet now": `hapticMedium()` (instead of starting submit) + `setCategorySheetVisible(true)`. Remove the `setSubmitting(true)` from this handler — it now lives inside `handleCategoryConfirm`.
  - [x] Add `handleSheetCancel = useCallback(() => { setCategorySheetVisible(false); pendingCategoryRef.current = null; }, []);`
  - [x] Add `handleCategoryConfirm = useCallback(async (category: WardrobeCategory) => { … }, [cutoutUri, sourceUri, isPremium, navigation, onCutoutSaved, t])` that:
    1. `pendingCategoryRef.current = category;`
    2. `setSubmitting(true);`
    3. Calls `saveCutoutAsWardrobeItem({ cutoutUri, sourceUri, isPremium, category })` — **NO `category: "top"` literal anywhere; remove TD-7 comment + literal at lines 109–113**.
    4. On success: `hapticRigid()` → `pendingCategoryRef.current = null` → `setCategorySheetVisible(false)` → `setSubmitting(false)` → `onCutoutSaved?.(result.id)` → if `onCutoutSaved` truthy, `navigation.getParent()?.goBack() ?? navigation.goBack()`; else `navigation.goBack()`. **Order: callback BEFORE goBack (preserves Test #9 invocationCallOrder assertion).**
    5. On `WardrobePersistenceError(kind:"paywall")`: `setCategorySheetVisible(false)` → `setPaywallVisible(true)` → `setSubmitting(false)`. Leave `pendingCategoryRef.current` set for the aftermath effect.
    6. On other `WardrobePersistenceError` kinds: `setCategorySheetVisible(false)` → `setErrorCopy(...)` → `setSubmitting(false)`. Clear `pendingCategoryRef.current`.
    7. On unknown error: same as `errorSaveFailed` branch + `__DEV__` console warn.
  - [x] Render `<CategoryPickerSheet visible={categorySheetVisible} onConfirm={handleCategoryConfirm} onCancel={handleSheetCancel} confirming={submitting} />` as a sibling of the existing `<PremiumPaywall />` at the bottom of the JSX tree (after `errorCopy` block, before `<PremiumPaywall>`).
  - [x] Update Use button's `accessibilityState`: `{ disabled: submitting, busy: submitting }` — unchanged in form, but `submitting` now flips inside `handleCategoryConfirm`, not `handleUse`.
  - [x] Confirm Retake button still uses `submitting` for its disabled state (it already does).

- [x] **Task 2 — Paywall aftermath: silent re-trigger with stashed category (AC #7).**
  - [x] Add a `useEffect` mirroring `UnifiedCameraResultScreen.tsx:230–241`: when `!paywallVisible && !submitting && isPremium && pendingCategoryRef.current !== null`, capture the cat into a local, null the ref, then `void handleCategoryConfirm(cat)`. Also when `!isPremium`, just null the ref. **Order matters: ref MUST be cleared BEFORE the re-call to guard against reentry** (matches 14.5's documented invariant).
  - [x] Update `handlePaywallDismiss`: keep the existing `setPaywallVisible(false)` + `gate.handleDismiss()` + `deleteCutoutTmp(cutoutUri)`. **Do NOT clear `pendingCategoryRef` here** — the aftermath effect handles it deterministically based on `isPremium` after dismiss.
  - [x] Verify that `usePremiumGate(favorites).handlePurchase` still receives the no-op `() => {}` callback (current behavior, line ~190).

- [x] **Task 3 — Update `ArmarioPreviewScreen.test.tsx` (AC #12 + new AC coverage).**
  - [x] Add a `jest.mock("@/components/armario/CategoryPickerSheet", …)` at module scope mirroring `UnifiedCameraResultScreen.test.tsx:176–207` — exposes `category-sheet-mock`, `category-sheet-mock-confirm-top`, `category-sheet-mock-confirm-bottom`, `category-sheet-mock-confirm-footwear`, `category-sheet-mock-confirm-accessory`, `category-sheet-mock-cancel`. The mock reflects `confirming` via `accessibilityState.busy`.
  - [x] Update **Test 2 ("Usar happy path")**: `fireEvent.press(useBtn)` → assert `category-sheet-mock` appears + `saveMock` NOT yet called. Then `fireEvent.press(category-sheet-mock-confirm-top)` → assert sheet's `accessibilityState.busy=true`, Preview's `armario-preview-use-button-spinner` may be removed (the spinner now lives in the sheet — adjust assertion: keep the `accessibilityState.busy` check on Use button, drop the Preview-internal spinner assertion since it never renders in this flow). Resolve `saveMock` → assert `hapticRigid` + `mockGoBack`/parent goBack as before.
  - [x] Update **Test 3 ("paywall path")**: tap `armario-preview-use-button` → tap `category-sheet-mock-confirm-top` → assert sheet hidden + `paywall-mock` visible.
  - [x] Update **Tests 6 ("diskFull"), 7 ("encode"), 8 ("move"/"repoAdd")**: insert the sheet-confirm step between `fireEvent.press(armario-preview-use-button)` and the error-sheet assertion.
  - [x] Update **Test 9 ("onCutoutSaved fires before parent goBack")**: same — interpose the sheet-confirm. Order assertion (`callbackOrder < parentGoBackOrder`) still holds.
  - [x] Update **Test 10 ("no callback → local goBack")**: same interposition.
  - [x] **Add Test 11 — "Tap Use → CategoryPickerSheet appears, no save"**: `fireEvent.press(armario-preview-use-button)` → `expect(getByTestId("category-sheet-mock")).toBeTruthy()` + `expect(saveMock).not.toHaveBeenCalled()`.
  - [x] **Add Test 12 — "Sheet cancel → no save, no nav"**: tap Use → tap `category-sheet-mock-cancel` → assert sheet hidden + `saveMock` not called + `mockGoBack`/`mockParentGoBack`/`mockFileDelete` not called + Use button `accessibilityState.disabled=false`.
  - [x] **Add Test 13 — "Confirm category=footwear → save called with footwear (NOT top)"**: tap Use → tap `category-sheet-mock-confirm-footwear` (mock dispatches `onConfirm("footwear")`) → resolve save → assert `saveMock` was called with `expect.objectContaining({ category: "footwear" })`. **This is the regression-proof for the TD-7 removal.**
  - [x] **Add Test 14 — "Paywall pending-category retry on isPremium=true"**: configure `usePremium` mock to start `isPremium=false`, reject saveMock once with `kind:"paywall"`, tap Use → tap confirm-bottom → paywall opens → swap `usePremium` mock to `isPremium=true` (rerender or use a holder pattern like `mockRouteHolder`) + dismiss paywall → assert saveMock called a second time with `expect.objectContaining({ category: "bottom" })` AND sheet does NOT reopen during retry.
  - [x] Verify `cutoutReady` announce test still passes (sheet doesn't interfere with mount-effect).
  - [x] Verify Tests 1 ("Retake") + 4 ("Paywall onDismiss") + 5 ("Back chevron") still pass without modification — those paths never enter the sheet.

- [x] **Task 4 — Verify `ArmarioPickerScreen.test.tsx` regressions (AC #9, #12).**
  - [x] Run `pnpm test src/screens/armario/ArmarioPickerScreen.test.tsx` and confirm all existing cases pass UNCHANGED. Specifically:
    - "footer + Nueva foto navigates to ArmarioRoot with onCutoutSaved callback" — picker still passes `onCutoutSaved: expect.any(Function)`.
    - "onCutoutSaved commits the new item AND dismisses (single-action flow for capture path)" — invokes `onCutoutSaved("newly-captured-id")` (string only, no category arg) → asserts `assign("combo-3", 0, "newly-captured-id")`. **Signature stays `(id: string) => void` per AC #9.**
  - [x] No code changes to `ArmarioPickerScreen.tsx`. If a regression surfaces, **stop and re-evaluate** — the picker is intentionally untouched.

- [x] **Task 5 — CI gate sweep + AC verification + on-device smoke (AC #13, #14).**
  - [x] Run on the story branch (off `epic-15` HEAD `56579b5`):
    1. `npx tsc --noEmit` → expect **0 errors** (UNCHANGED from baseline).
    2. `pnpm lint` → expect **2 errors** (UNCHANGED — `FavoritesList.test.tsx` + `OutfitVisualizer.tsx > handleMakeMine` pre-existing per Epic 15 retro). **DO NOT auto-format these** (`feedback_no_patches.md` — keep diff scoped).
    3. `pnpm test` → expect **+5 to +7 net** new tests passing, **0 new skips**.
  - [x] Walk through each AC #1–#13 point-by-point in the Completion Notes List with the matching test IDs / file paths / line numbers proving compliance. Mark AC #14 as ⏸ pending Alejandro on-device smoke.
  - [x] **Self-checks before review:**
    - `grep "category: \"top\"" src/screens/armario/ArmarioPreviewScreen.tsx` → **0 matches** (TD-7 literal removed).
    - `grep "TD-7" src/screens/armario/ArmarioPreviewScreen.tsx` → **0 matches** (TD-7 comment block removed; the only legitimate TD-7 reference left is in `wardrobeTypes.ts:5,21` documenting the legacy backfill — out of scope).
    - `grep "CategoryPickerSheet" src/screens/armario/` → **2 matches** (ArmarioPickerScreen.tsx already imports it for the 14.12b edit-category affordance — that consumer stays unchanged; ArmarioPreviewScreen.tsx is the new consumer added by this story).
    - `grep "pendingCategoryRef" src/screens/armario/ArmarioPreviewScreen.tsx` → **≥3 matches** (declaration, paywall-stash, aftermath-effect, cancel-clear).
  - [x] Branch: `story/15-2-en-curso-category-picker-mandatory` off `epic-15` HEAD `56579b5`. Commit message style matches Epic 15 convention (`feat(15.2): …`). NO merge to `epic-15` until adversarial code review + Alejandro on-device smoke pass.

## Dev Notes

### Decision context (load-bearing — read first)

- **DEC-2 (epic-15.md line 34)**: Categoría OBLIGATORIA en flujo "En curso". Coherencia total con flujo principal cámara FAB. **No se permite guardar sin categoría.** This story is the implementation of DEC-2.
- **TD-7 (legacy)**: `wardrobeTypes.ts:5–6,20–22` documents the backfill of legacy Epic-13 items to `"top"`. **This story does NOT change TD-7 — it only retires the `category: "top"` *new-item default* at `ArmarioPreviewScreen.tsx:113`.** Legacy items hydrated without the field still backfill to `"top"` (the data-migration concern is out of scope; users correct via Story 14.12b edit affordance).
- **Scope discipline**: Touch ONLY `ArmarioPreviewScreen.tsx` + its test. **Do NOT modify** `ArmarioPickerScreen.tsx`, `ArmarioCaptureScreen.tsx`, `CategoryPickerSheet.tsx`, `saveCutoutAsWardrobeItem.ts`, navigation types, or i18n. The picker, capture, and library paths are all unchanged — they already converge on the Preview screen, and the sheet is already battle-tested by Story 14.5.

### Architecture intelligence — file-by-file

#### `src/screens/armario/ArmarioPreviewScreen.tsx` (THE one production file changed)

**Current shape (HEAD `56579b5`)** — relevant excerpt:

```tsx
// Line 60 — route params
const { cutoutUri, sourceUri, onCutoutSaved } = route.params;

// Line 75–77 — submit/error/paywall state
const [submitting, setSubmitting] = useState(false);
const [paywallVisible, setPaywallVisible] = useState(false);
const [errorCopy, setErrorCopy] = useState<string | null>(null);

// Line 101–173 — handleUse currently saves directly with hardcoded "top"
const handleUse = useCallback(async () => {
  if (submitting) return;
  setSubmitting(true);
  try {
    const result = await saveCutoutAsWardrobeItem({
      cutoutUri,
      sourceUri,
      isPremium,
      // TD-7 temporary default — in-Ficha-Wada ArmarioCapture flow
      // (preserved per TD-2); real user-selected category lands via
      // Story 14.5 in the unified camera flow. User can correct via
      // Story 14.12b edit-category affordance.
      category: "top",       // <-- LINE 113: this is what 15.2 retires
    });
    // ... success path: hapticRigid → onCutoutSaved → parent goBack/local goBack
  } catch (e) { /* paywall + diskFull + encode + move + repoAdd + catch-all */ }
}, [...]);
```

**Target shape after 15.2** — diff sketch (illustrative):

```tsx
import { CategoryPickerSheet } from "@/components/armario/CategoryPickerSheet";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";

const [categorySheetVisible, setCategorySheetVisible] = useState(false);
const pendingCategoryRef = useRef<WardrobeCategory | null>(null);

const handleUse = useCallback(() => {
  if (submitting) return;
  hapticMedium();                       // matches UnifiedCameraResultScreen.handlePrimaryCta
  setCategorySheetVisible(true);
}, [submitting]);

const handleSheetCancel = useCallback(() => {
  setCategorySheetVisible(false);
  pendingCategoryRef.current = null;
}, []);

const handleCategoryConfirm = useCallback(async (category: WardrobeCategory) => {
  pendingCategoryRef.current = category;
  setSubmitting(true);
  try {
    const result = await saveCutoutAsWardrobeItem({
      cutoutUri, sourceUri, isPremium, category,
    });
    if (!isMounted.current) return;
    hapticRigid();
    pendingCategoryRef.current = null;
    setCategorySheetVisible(false);
    setSubmitting(false);
    onCutoutSaved?.(result.id);                  // BEFORE goBack — Test #9 invariant
    if (onCutoutSaved) {
      const parent = navigation.getParent();
      if (parent) parent.goBack(); else navigation.goBack();
    } else {
      navigation.goBack();
    }
  } catch (e) {
    if (!isMounted.current) return;
    setSubmitting(false);
    if (e instanceof WardrobePersistenceError) {
      if (e.kind === "paywall") {
        setCategorySheetVisible(false);          // hide sheet behind paywall
        setPaywallVisible(true);
        return;                                  // KEEP pendingCategoryRef set
      }
      // diskFull / encode / move / repoAdd / catch-all → close sheet, surface errorCopy
      setCategorySheetVisible(false);
      pendingCategoryRef.current = null;
      if (e.kind === "diskFull")      setErrorCopy(t("armario.preview.errorDiskFull"));
      else if (e.kind === "encode")   setErrorCopy(t("armario.preview.errorEncode"));
      else                            setErrorCopy(t("armario.preview.errorSaveFailed"));
      return;
    }
    if (__DEV__) console.warn("[ArmarioPreviewScreen] save failed:", e);
    setCategorySheetVisible(false);
    pendingCategoryRef.current = null;
    setErrorCopy(t("armario.preview.errorSaveFailed"));
  }
}, [cutoutUri, sourceUri, isPremium, navigation, onCutoutSaved, t]);

// Aftermath: silent retry on purchase (mirror UnifiedCameraResultScreen.tsx:230–241)
useEffect(() => {
  if (paywallVisible || submitting) return;
  if (isPremium && pendingCategoryRef.current !== null) {
    const cat = pendingCategoryRef.current;
    pendingCategoryRef.current = null;     // clear BEFORE re-call (reentry guard)
    void handleCategoryConfirm(cat);
    return;
  }
  if (!isPremium) {
    pendingCategoryRef.current = null;
  }
}, [isPremium, paywallVisible, submitting, handleCategoryConfirm]);

// JSX — append after errorCopy block, before <PremiumPaywall>:
<CategoryPickerSheet
  visible={categorySheetVisible}
  onConfirm={handleCategoryConfirm}
  onCancel={handleSheetCancel}
  confirming={submitting}
/>
```

**What stays unchanged in `ArmarioPreviewScreen.tsx`:** the back chevron, the cutout `<Image>`, Retake button + `handleRetake`, the error-sheet `<View>` block, `deleteCutoutTmp`, `handlePaywallDismiss` (still calls `setPaywallVisible(false)` + `gate.handleDismiss()` + `deleteCutoutTmp(cutoutUri)`; the aftermath effect handles the ref), `handlePurchase`, the `cutoutReady` mount announce.

#### `src/components/armario/CategoryPickerSheet.tsx` (REUSE — NO CHANGES)

Already implements:
- Props `{ visible, currentCategory?, onConfirm, onCancel, confirming? }` — see line 17–23.
- 4 rows: `top`, `bottom`, `footwear`, `accessory`.
- Built-in spinner via `confirming` → `category-picker-sheet-confirm-spinner`.
- Backdrop dismiss (`category-picker-sheet-backdrop`) gated by `confirming`.
- A11y: `accessibilityRole="button"` + `accessibilityState.selected` per row + `accessibilityRole="header"` on title + `closeSheetA11y` on backdrop.
- i18n keys: `unifiedCamera.categorySheet.{title,rowTop,rowBottom,rowFootwear,rowAccessory,confirm,confirmA11yLabel,closeSheetA11y,rowA11yHint}` already in `es.json:387–397` + `en.json` mirror.

Story 15.2 reuses this exact component. **Do NOT pass `currentCategory`** — the picker is for a brand-new item with no pre-selection; the user must pick deliberately (DEC-2 spirit).

#### `src/screens/armario/ArmarioPickerScreen.tsx` (NO CHANGES)

The picker's relevant code (lines 226–241):

```tsx
const handleCutoutSaved = useCallback(
  (newItemId: string) => {
    commitAndDismiss(newItemId);
  },
  [commitAndDismiss],
);

const handleNewPhoto = useCallback(() => {
  hapticLight();
  rootNavigation.navigate("ArmarioRoot", {
    screen: "ArmarioCapture",
    params: { onCutoutSaved: handleCutoutSaved },
  });
}, [rootNavigation, handleCutoutSaved]);
```

The `(id: string) => void` callback signature is preserved. The picker continues to `assign(combinationId, colorIndex, wardrobeItemId)` — slot assignment is orthogonal to category. **No edits to this file.**

#### `src/screens/armario/ArmarioCaptureScreen.tsx` (NO CHANGES)

`handlePhoto(uri)` (line 118–149) calls `removeBackground(uri)` then `navigation.push("ArmarioPreview", { cutoutUri, sourceUri, onCutoutSaved })`. Both `takePicture()` (camera) and `pickFromLibrary()` (image picker) call `handlePhoto(...)`. **Single convergence point** = single fix in `ArmarioPreviewScreen` covers both AC #1 and AC #2.

#### `src/lib/armario/saveCutoutAsWardrobeItem.ts` (NO CHANGES)

Signature already accepts `category: WardrobeCategory` (line ~21). Type-level mandatory — TS will flag any caller that omits it. The `WardrobePersistenceError.kind` enum and rollback contract are unchanged.

#### `src/navigation/types.ts` (NO CHANGES)

`ArmarioStackParamList.ArmarioPreview` already has `onCutoutSaved?: (id: string) => void` (line 37). No signature change.

### Test patterns to mirror (from Story 14.5)

The canonical pattern is in `src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx`:
- **Sheet mock** at lines 173–207 — copy-paste the shape, adapting testIDs. Add a `confirm-footwear` row to enable AC #13 regression.
- **Pending-category re-trigger** assertion pattern — check the test cases in that file that exercise paywall + premium flip; mirror them for `ArmarioPreviewScreen.test.tsx`'s new Test 14.

### Deviations from epic spec (intentional)

1. **Spec line 119 says: "Modificar signature de `onCutoutSaved` callback (en `ArmarioPickerScreen`) para incluir `category` (ya pasado por la sheet)."** — we are NOT doing this. Rationale: `ArmarioPickerScreen.commitAndDismiss(wardrobeItemId)` only calls `assign(combinationId, colorIndex, wardrobeItemId)`. The category is persisted upstream by `saveCutoutAsWardrobeItem` and is read elsewhere from the store. Adding `category` to the callback creates dead-weight wiring with zero downstream consumer. **Saves ~6 LOC + zero behavior change.** Surfaced in AC #9 + Task 4.

2. **Spec line 117 says: "[la sheet aparece] dentro de Preview, como modal post-cutout, antes del botón 'Guardar'."** — interpreted as: the sheet opens **AFTER** the user taps Save (Use), not before. This matches Story 14.5's `UnifiedCameraResultScreen.handlePrimaryCta` exactly: tapping the Save CTA triggers the sheet, not the save. Rationale: showing the sheet automatically on Preview mount would block the cutout review (Retake decision). The user must first decide "this cutout is good enough", THEN pick category. (If the spec author meant the opposite, surface in code review.)

### Anti-patterns to AVOID

- **DON'T** mock `useCoachMark` or any 15.1 foundation — those are unrelated.
- **DON'T** add a `category` parameter to `onCutoutSaved`. Picker doesn't need it (see deviation #1).
- **DON'T** open the sheet on Preview mount. The user must review the cutout first.
- **DON'T** auto-pre-select a category via `currentCategory` prop on the sheet. Force a deliberate tap (DEC-2).
- **DON'T** clear `pendingCategoryRef` inside `handlePaywallDismiss`. The aftermath effect handles it deterministically based on `isPremium` post-dismiss — clearing it eagerly breaks the silent-retry contract.
- **DON'T** add new i18n keys. The sheet's existing keys cover this story.
- **DON'T** touch `ArmarioPickerScreen.tsx`, `ArmarioCaptureScreen.tsx`, `CategoryPickerSheet.tsx`, `saveCutoutAsWardrobeItem.ts`, or `navigation/types.ts`. Scope discipline = clean code review.
- **DON'T** auto-format the 2 pre-existing lint baseline errors (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx > handleMakeMine`) — keep diff scoped per `feedback_no_patches.md` (consistent with 15.3, 15.4, 15.5 dev pattern).
- **DON'T** stub the `cutoutReady` AccessibilityInfo announce — Test #11 in the existing suite asserts it; mocking it differently is a regression.

### Previous story intelligence (from 15.5 retro on `56579b5`)

- **CI baseline on `epic-15` HEAD `56579b5`**: tsc 0, lint 2 (pre-existing `FavoritesList.test.tsx` + `OutfitVisualizer.tsx > handleMakeMine` Biome format), pnpm test **961/3/964**, skips 0. Use this as your delta floor.
- **Lint pattern**: if Biome auto-formats a pre-existing baseline file during your lint pass, revert that hunk via `git checkout -- <path>` to keep diff scoped. Confirmed pattern across 15.3/15.4/15.5.
- **Implementation order delta from spec**: the 15.4 retro noted "handler placed AFTER `useCoachMark()` rather than before … to avoid forward-reference of const." Same caveat applies here: declare `pendingCategoryRef` BEFORE `handleCategoryConfirm`, declare `handleCategoryConfirm` BEFORE the aftermath `useEffect`, declare `handleSheetCancel` anywhere (no forward refs).
- **Mock pollution**: 15.3 retro hit a test-pollution lesson with `jest.spyOn(...).mockRestore()` leaving `jest.fn` mocks broken across tests. Avoid `mockRestore` on the `saveMock`; use `mockReset` in `beforeEach` (the existing test file already does this — preserve the pattern).
- **AC verification rigor**: 15.3 + 15.4 + 15.5 retros all show point-by-point AC verification in completion notes with grep proofs and exact test IDs. Match that rigor.

### Project Structure Notes

- File touches:
  - `src/screens/armario/ArmarioPreviewScreen.tsx` (MOD — primary).
  - `src/screens/armario/ArmarioPreviewScreen.test.tsx` (MOD — extend with sheet mock + 4 new test cases, modify ~6 existing test cases).
- File touches **prohibited** (scope guard):
  - `src/screens/armario/ArmarioPickerScreen.tsx` + `.test.tsx`.
  - `src/screens/armario/ArmarioCaptureScreen.tsx` + `.test.tsx`.
  - `src/components/armario/CategoryPickerSheet.tsx` + `.test.tsx`.
  - `src/lib/armario/saveCutoutAsWardrobeItem.ts` + `.test.ts`.
  - `src/navigation/types.ts`.
  - `src/i18n/locales/{es,en}.json`.
- Naming: `pendingCategoryRef`, `categorySheetVisible`, `handleSheetCancel`, `handleCategoryConfirm` — mirror `UnifiedCameraResultScreen` exactly so a future reader can grep across both screens.
- React Native conventions per CLAUDE.md: function declarations, named exports, `className` for static styles, `style={{}}` only for dynamic Wada values, `testID` (not `data-testid`), 44pt min on all interactive elements (sheet already complies), `accessibilityLabel` + `accessibilityRole` (sheet already complies).
- Hooks order: all `useState` / `useRef` / `useMemo` / `useCallback` / `useEffect` before any early returns (the existing component has no early returns; preserve that).

### References

- Epic spec: `docs/planning/epic-15/epic-15.md` § Story 15.2 (lines 112–135)
- DEC-2: `docs/planning/epic-15/epic-15.md` line 34
- Reference implementation pattern: `src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx` (Story 14.5) — sheet wiring, paywall pending-ref, aftermath effect.
- Reference test pattern: `src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx:173–207` — `CategoryPickerSheet` mock shape.
- TD-7 anchor: `src/lib/wardrobeTypes.ts:5–6,20–22` (legacy doc — out of scope, do not modify).
- Pre-existing TD-7 default to retire: `src/screens/armario/ArmarioPreviewScreen.tsx:109–113`.
- Save signature: `src/lib/armario/saveCutoutAsWardrobeItem.ts:18–22` (`SaveCutoutArgs`).
- Convergence point for camera + library: `src/screens/armario/ArmarioCaptureScreen.tsx:118–149` (`handlePhoto`).
- Picker capture invocation: `src/screens/armario/ArmarioPickerScreen.tsx:235–241` (`handleNewPhoto`).
- Picker single-action commit: `src/screens/armario/ArmarioPickerScreen.tsx:177–224` (`commitAndDismiss`) — DO NOT modify.
- DEV-only entry without callback: `src/screens/Settings.tsx:300–321` (smoke entry, no scope here).
- Project context (architecture conventions): `docs/project-context.md`.
- Memory: `feedback_no_patches.md` (root cause > patches), `feedback_visual_review.md` (flag visual changes), `feedback_jest_native_module_mock.md` (TDZ trap — N/A here, no native modules touched).

## Dev Agent Record

### Agent Model Used

Opus 4.7 (1M context) — `claude-opus-4-7[1m]`

### Debug Log References

- Branch: `story/15-2-en-curso-category-picker-mandatory` off `epic-15` HEAD `56579b5`.
- Pre-baseline confirmed: tsc 0, lint 2 pre-existing (`FavoritesList.test.tsx` + `OutfitVisualizer.tsx > handleMakeMine` Biome format), pnpm test **961 passed / 3 failed / 964 total**. **Note:** the story spec labelled the 3 as "skips"; actual baseline shows 3 **pre-existing failures** in `src/i18n/__tests__/i18n.test.ts` (Intl.DateTimeFormat locale mock — `es`, `es-MX`, `es-ES` device → expected `"es"`, received `"en"`). These predate Story 15.2 and were not introduced by it (`git stash`-clean repo on `56579b5` reproduces the same 3 failures). Out of scope per `feedback_no_patches.md`; preserved untouched.
- Post-CI: tsc **0 UNCHANGED**, lint **2 UNCHANGED** (no auto-format applied), pnpm test **966 passed / 3 failed / 969 total — net +5** (exactly the 5 new test cases listed below). Pre-existing 3 i18n failures unchanged.

### Completion Notes List

**Implementation summary**
- Single production file modified: `src/screens/armario/ArmarioPreviewScreen.tsx` (172 ↑/↓, 91 net change).
- Single test file modified: `src/screens/armario/ArmarioPreviewScreen.test.tsx` (12 → 17 tests; 5 new + 6 mechanically updated to interpose the sheet-confirm step).
- Reuses `@/components/armario/CategoryPickerSheet` (no edits) and follows the `UnifiedCameraResultScreen` (Story 14.5) wiring pattern verbatim — same prop shape on the sheet, same `pendingCategoryRef` paywall-stash, same aftermath-effect reentry guard.
- TD-7 hardcoded literal `category: "top"` at the prior `ArmarioPreviewScreen.tsx:113` and its 5-line preamble comment block are GONE. The legacy backfill in `wardrobeTypes.ts:5,21` is intentionally untouched (out of scope per Dev Notes).
- `ArmarioPickerScreen.tsx` / `ArmarioCaptureScreen.tsx` / `CategoryPickerSheet.tsx` / `saveCutoutAsWardrobeItem.ts` / `navigation/types.ts` / `i18n/locales/{es,en}.json`: ZERO edits. Picker `(id: string) => void` callback signature preserved.
- Hooks ordering: `pendingCategoryRef` declared before `handleCategoryConfirm`; `handleCategoryConfirm` declared before the aftermath `useEffect` (no forward-reference traps).

**AC verification (point-by-point)**

- **AC #1 ✓** — Tap `armario-preview-use-button` opens the `CategoryPickerSheet`; `saveCutoutAsWardrobeItem` is NOT called yet. Asserted by Test 11 (sheet-appears-no-save) and Test 2 (in-flight assertions before resolving the controlled save promise).
- **AC #2 ✓** — Both "Foto nueva" and "Biblioteca" entry points converge in `ArmarioCaptureScreen.handlePhoto()` (lines 118–149) before pushing `ArmarioPreview`, so the single change to `ArmarioPreviewScreen` covers both paths. No separate wiring needed.
- **AC #3 ✓** — Tapping a row + confirm calls `saveCutoutAsWardrobeItem({ ..., category: <selected> })` with the user-selected category. Asserted by Test 13 (`category-sheet-mock-confirm-footwear` → `expect.objectContaining({ category: "footwear" })`). The TD-7 comment + literal at the prior `ArmarioPreviewScreen.tsx:109–113` is removed (verified by `grep "category: \"top\"" src/screens/armario/ArmarioPreviewScreen.tsx` → 0 matches and `grep "TD-7" src/screens/armario/ArmarioPreviewScreen.tsx` → 0 matches).
- **AC #4 ✓** — Cancel via `category-sheet-mock-cancel` (mirrors `category-picker-sheet-backdrop`) closes the sheet without calling `saveCutoutAsWardrobeItem`, `goBack`, parent `goBack`, `onCutoutSaved`, or `File.delete`. Asserted by Test 12.
- **AC #5 ✓** — While `saveCutoutAsWardrobeItem` is pending, the sheet stays mounted with `confirming={submitting}` (mock surfaces this as `accessibilityState.busy=true`); Use button gets `accessibilityState={ disabled: true, busy: true }`; Retake + Back chevron get `accessibilityState={ disabled: true }`. Asserted by Test 2.
- **AC #6 ✓** — On save resolve: `hapticRigid()` fires, sheet closes (`category-sheet-mock` becomes null), `onCutoutSaved?.(result.id)` invokes BEFORE `parent.goBack()`. Test 9 asserts `callbackOrder < parentGoBackOrder` via `invocationCallOrder`. Test 10 asserts the `onCutoutSaved`-absent branch falls back to local `navigation.goBack()`.
- **AC #7 ✓** — On `WardrobePersistenceError(kind:"paywall")`: sheet hides (`category-sheet-mock` null), `paywall-mock` visible, `pendingCategoryRef.current` retains the user-selected category, Preview CTAs re-enabled. On premium flip + paywall dismiss, the aftermath effect silently re-fires `handleCategoryConfirm` with the stashed category — sheet does NOT reopen during retry. Asserted by Tests 3 (sheet hidden behind paywall, CTAs re-enabled) + 14 (silent retry path with `bottom`) + 15 (no-purchase dismiss path clears the ref).
- **AC #8 ✓** — Errors `encode` / `move` / `repoAdd` / `diskFull` close the sheet, set `confirming=false`, render the existing `armario-preview-error-sheet` with the matching i18n copy. Asserted by Tests 6 (diskFull), 7 (encode), 8 (move + repoAdd via `it.each`). The Dismiss tap still does NOT call `File.delete` (Test 6 reasserts the existing invariant).
- **AC #9 ✓** — `onCutoutSaved` signature stays `(id: string) => void`; `ArmarioPickerScreen.tsx` UNCHANGED. All 44 `ArmarioPickerScreen.test.tsx` cases pass UNCHANGED. Auto-save flow (`commitAndDismiss(wardrobeItemId)` → `assign + addFavorite + lookSavedAnnouncement`) is untouched.
- **AC #10 ✓** — Zero new i18n keys added. Sheet reuses `unifiedCamera.categorySheet.*` keys already shipped by Story 14.5.
- **AC #11 ✓** — All a11y wiring lives inside `CategoryPickerSheet` (unchanged). VoiceOver announce on Preview mount (`armario.preview.cutoutReady`) preserved (asserted by the existing "announces cutoutReady" test).
- **AC #12 ✓** — All 17 `ArmarioPreviewScreen.test.tsx` cases pass (12 pre-existing + 5 new). All 44 `ArmarioPickerScreen.test.tsx` cases pass UNCHANGED. The picker test file received zero edits.
- **AC #13 ✓** — Post-CI: tsc **0 UNCHANGED**, lint **2 UNCHANGED** (pre-existing `FavoritesList.test.tsx` + `OutfitVisualizer.tsx > handleMakeMine` Biome format errors NOT auto-formatted, per `feedback_no_patches.md`), pnpm test **966 / 3 / 969** (delta **+5 net** vs `961 / 3 / 964` baseline — exactly the 5 new test cases). The 3 baseline i18n locale-detection test failures are pre-existing on `epic-15` HEAD `56579b5` (verified on a clean checkout); the story spec mislabelled them as "skips" — they are pre-existing failures, NOT introduced by 15.2.
- **AC #14 ✓** — On-device smoke APPROVED by Alejandro on iPhone 16 Pro × ES+EN locales (2026-04-27): (a) Foto nueva happy path → category selection → slot assignment via Story 14.12b edit-category badge; (b) Biblioteca happy path; (c) Cancel path (sheet backdrop tap → no save, Retake still functional); (d) Free-tier paywall path (10-item DEV-menu pre-fill → confirm category → paywall → dismiss-without-purchase → Use re-tappable → sheet reopens, NOT auto-confirmed).

**Self-checks (executed before review)**

| Check | Expected | Actual |
| --- | --- | --- |
| `grep 'category: "top"' src/screens/armario/ArmarioPreviewScreen.tsx` | 0 | 0 ✓ |
| `grep "TD-7" src/screens/armario/ArmarioPreviewScreen.tsx` | 0 | 0 ✓ |
| `grep -ln "CategoryPickerSheet" src/screens/armario/` | 4 (Picker + Preview + their tests) | 4 ✓ |
| `grep -c "pendingCategoryRef" src/screens/armario/ArmarioPreviewScreen.tsx` | ≥ 3 | 11 ✓ |
| Picker test suite | 44 / 44 pass UNCHANGED | 44 / 44 ✓ |

**Intentional deviation from epic spec (line 119)**

`onCutoutSaved` signature stays `(id: string) => void`. The picker's `commitAndDismiss(wardrobeItemId)` only calls `assign(combinationId, colorIndex, wardrobeItemId)`; the category is persisted upstream by `saveCutoutAsWardrobeItem` and the picker has no downstream consumer that reads it. Adding `category` to the callback would be dead-weight wiring with zero behavior change. Saved ~6 LOC, zero risk surface. (Pre-flagged in story Dev Notes deviation #1.)

**Pending before merge**

1. Adversarial code review (`bmad-code-review`) — recommended a different LLM than the implementation model.
2. ✓ Alejandro on-device smoke (AC #14, 4 scenarios × 2 locales) — APPROVED 2026-04-27.
3. Visual review per `feedback_visual_review.md` (Expo simulator: confirm sheet animation feel, button label color in both locales, paywall layering when sheet was open).

### File List

- `src/screens/armario/ArmarioPreviewScreen.tsx` (MOD) — wires `CategoryPickerSheet` into the Use flow; refactors `handleUse` (now opens the sheet) and `handleCategoryConfirm` (the await-save handler) — the new path persists the user-selected `WardrobeCategory`, retires the TD-7 hardcoded `"top"` literal, preserves the existing paywall + error + Retake + cutoutReady invariants, and adds a paywall-aftermath `useEffect` for the silent purchase-retry path. New imports: `CategoryPickerSheet`, `WardrobeCategory`, `hapticMedium`. New state: `categorySheetVisible`. New ref: `pendingCategoryRef<WardrobeCategory | null>`. New JSX block: `<CategoryPickerSheet>` rendered as sibling of `<PremiumPaywall>` (one above, one below, both at the JSX bottom).
- `src/screens/armario/ArmarioPreviewScreen.test.tsx` (MOD) — added the `CategoryPickerSheet` mock (4 confirm rows + 1 cancel row, mirroring `UnifiedCameraResultScreen.test.tsx:176-207`) + `hapticMedium` mock + a `mockPremiumState` holder for flip-during-render of `isPremium`. 6 existing tests mechanically updated to interpose `category-sheet-mock-confirm-top` between the Use tap and the assertion. 5 new tests (Tests 11–15) covering: sheet-appears-no-save (DEC-2 invariant), sheet-cancel-no-save, confirm-footwear-NOT-top (regression-proof for TD-7 retirement), paywall pending-ref retry, paywall dismiss-without-purchase clears ref.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MOD) — `15-2-en-curso-category-picker-mandatory: ready-for-dev → in-progress → review` (single round-trip per workflow); `last_updated` annotated with the in-progress and post-implementation summaries.
- `_bmad-output/implementation-artifacts/15-2-en-curso-category-picker-mandatory.md` (MOD) — Status: review, Tasks/Subtasks all checked, Dev Agent Record + File List + Change Log filled.

### Review Findings

- [x] [Review][Patch] `handlePaywallDismiss` calls `deleteCutoutTmp(cutoutUri)` unconditionally — on the purchase path (isPremium flips true then user taps dismiss), the cutout file is deleted before the aftermath effect can retry the save, causing a file-not-found error after a successful IAP. Fixed: gated `deleteCutoutTmp` behind `if (pendingCategoryRef.current === null)`. Added `expect(mockFileDelete).not.toHaveBeenCalled()` to Test 14. Updated Test 4 title + assertion to reflect new behavior (file preserved for retry). [ArmarioPreviewScreen.tsx — handlePaywallDismiss]
- [x] [Review][Defer] Aftermath `useEffect` depends on `handleCategoryConfirm` identity — fires on every `isPremium`/`navigation` change, but guards prevent double-save. Same pattern as reference implementation. [ArmarioPreviewScreen.tsx — aftermath useEffect] — deferred, same pattern as UnifiedCameraResultScreen
- [x] [Review][Defer] Aftermath ordering is load-bearing — `pendingCategoryRef.current = null` (line 132) must precede `setSubmitting(false)` (line 134) or a double-save is possible. Currently correct; a single-line swap would break it silently. [ArmarioPreviewScreen.tsx:132–134] — deferred, code is correct; comment in-code is sufficient
- [x] [Review][Defer] Test 14 comment says "dismiss triggers retry" but `rerender(isPremium=true)` fires the aftermath effect (blocked by `paywallVisible=true`), and dismiss unblocks it — causation is reversed from what the comment implies. Behavior under test is correct. [ArmarioPreviewScreen.test.tsx — Test 14] — deferred, test verifies correct behavior regardless of comment

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-04-27 | Story marked `ready-for-dev` (bmad-create-story). | Bob (SM) |
| 2026-04-27 | Story implemented end-to-end. `CategoryPickerSheet` wired into `ArmarioPreviewScreen` "En curso" Save flow, retiring the TD-7 hardcoded `category: "top"` literal at line 113. Pattern mirrors Story 14.5 `UnifiedCameraResultScreen` (sheet open on Use tap → `handleCategoryConfirm` awaits save → success/paywall/error branches with `pendingCategoryRef` for silent paywall retry). 5 new tests (sheet-opens-no-save, sheet-cancel-no-save, confirm-footwear regression-proof, paywall pending-ref retry, paywall dismiss-without-purchase clears ref) + 6 mechanically updated. CI deltas: tsc 0 UNCHANGED, lint 2 UNCHANGED, pnpm test +5 net (961 → 966 passing). Status: in-progress → review. | Dev Agent (Opus 4.7) |
