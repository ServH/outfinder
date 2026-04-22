# Deferred work

Items parked during code review. Not blocking current features; pick up when the scope is right.

---

## Deferred from: code review of 14-12a-delete-garment-discoverable-affordance (2026-04-22)

- **D-14.12a-1** — `ArmarioPickerScreen.tsx` `exitEditMode` — `finished=false` cancellation branch never calls `runOnJS(setIsEditMode)(false)`, leaving `isEditMode` as stale `true` if animation is interrupted. Reanimated cancellation edge case; sheet navigates back on dismiss so stale state has no visible surface. Add `else { runOnJS(setIsEditMode)(false); }` or a mounted-ref guard when hardening the edit-mode state machine.
- **D-14.12a-2** — `ArmarioPickerScreen.tsx` `renderItem` — `deleteA11yLabel` (and its nested `t()` for category lookup) is computed unconditionally on every tile render regardless of `isEditMode`. Micro-optimization only. Move computation inside the `isEditMode && (...)` block or memoize per-item when grid performance becomes a concern.
- **D-14.12a-3** — `ArmarioPickerScreen.tsx` header ternary — `s3-edit-cancel` and `s3-edit-done` both wire to `exitEditMode` with no semantic distinction. Spec-mandated equivalence (AC #2). If Story 14.12b or later adds in-edit-mode state (e.g., selection) requiring commit vs. discard semantics, split into separate handlers at that point.
- **D-14.12a-4** — `ArmarioPickerScreen.tsx` `SymbolView name="minus"` — No fallback for iOS < 16. Pre-existing Epic 14 pattern (all 14.x SymbolView usages are unguarded). Revisit if minimum iOS target is raised or if SF Symbol availability issues surface in TestFlight.
- **D-14.12a-5** — `ArmarioPickerScreen.tsx` `enterEditMode` / `exitEditMode` — Toggling Reduce Motion while a fade animation is in progress starts a second concurrent `withTiming` on the same `editOpacity` shared value. Theoretical race; Reduce Motion toggle typically requires app foreground cycle. Matches pre-existing `translateY` animation risk in the same file.

## Deferred from: code review of 14-12b-edit-category-affordance (2026-04-22)

- **D-14.12b-1** — `ArmarioPickerScreen.test.tsx` `beforeEach` — `mockAddFavorite.mockReset()` vs `mockUpdateItemCategory.mockClear()` inconsistency, inherited from 14.12a's pattern. No test failures; normalize to `mockClear()` uniformly when cleaning up the test suite.
- **D-14.12b-2** — `ArmarioPickerScreen.tsx` `handleEditCategoryConfirm` — Stale `editingItem` closure if the item is deleted from the store while the CategoryPickerSheet is open. `updateItemCategory` silently no-ops for the orphaned id; no user feedback. Practically unreachable (Modal blocks the grid), but add a post-update existence check if the wardrobe gains background sync.
- **D-14.12b-3** — `ArmarioPickerScreen.tsx` `handleEditCategoryConfirm` — No `AccessibilityInfo.announceForAccessibility` call after category change persists. VoiceOver users get no auditory confirmation that the change was applied. Consider adding an announcement in a future accessibility polish pass.
- **D-14.12b-4** — `ArmarioPickerScreen.tsx` `exitEditMode` handler — Does not call `setEditingItem(null)` if `editingItem` is non-null when edit mode exits. Latent bug; not reachable via current UI (CategoryPickerSheet Modal blocks "Listo"/"Cancelar" header). Add defensive `setEditingItem(null)` when adding any `exitEditMode` call path that can fire without the sheet being closed first.
- **D-14.12b-5** — `CategoryPickerSheet.tsx:58` — `Dimensions.get("window").height` captured as module-level constant at import time. Stale on iPad split-screen or orientation change. Pre-existing in the reused component; fix when adding orientation/split-screen support.
- **D-14.12b-6** — `ArmarioPickerScreen.tsx` `renderItem` — `editCategoryA11yLabel` (and its nested `t()` calls) computed unconditionally for every tile on every FlatList render, regardless of `isEditMode`. Mirrors pre-existing D-14.12a-2 for `deleteA11yLabel`. Negligible at ≤10 items; move inside `isEditMode && (...)` block when optimizing renderItem.

## Deferred from: code review of 14-11-incomplete-looks-retention-surface (2026-04-22)

- **D-14.11-1** — `selectIncompleteLooks.ts` — Duplicate slot assignment counting not validated: `assignedCount` could be inflated if two CombinationAssignment records share the same `colorIndex` (data corruption path). Pre-existing store contract (same counting pattern as `sortFavoritesByCompleteness.ts`). Add deduplication by `(combinationId, colorIndex)` pair when hardening wardrobe assignment storage.
- **D-14.11-2** — `FavoritesList.tsx` — `isNavigating.current` not reset to `false` on navigation exception in `handleIncompleteTilePress`. Guard resets only via `useFocusEffect` on screen focus. Pre-existing shared behavior with `handleComboPress`. Add a try/finally reset if navigation is ever made async or fallible.
- **D-14.11-3** — `misLooksStore.ts` — Assignments for un-favorited combinations are never pruned from the store; `assignedCountByCombination` Map in `IncompleteLooksSection` silently holds stale entries. Pre-existing architecture concern — fix when adding a wardrobe cleanup sweep or migration.
- **D-14.11-4** — `IncompleteLooksSection.tsx` — `keyboardShouldPersistTaps` missing on horizontal `FlatList` inside vertical `FlatList`. Can swallow taps when iOS software keyboard is open. Advisory; not required by spec; consistent with existing horizontal FlatList pattern. Add if users report missed taps.

---

## Deferred from: code review of 14-4-camera-result-screen-ui (2026-04-21)

- **D-14.4-1** — `UnifiedCameraResultScreen.tsx:127` — `as never` cast en `navigate("Main", {...} as never)` — elude el tipado de React Navigation; si se renombra `ColorsTab` o `Combinations` falla en runtime sin error de compilación. Arreglar cuando se añada tipado completo de `CompositeNavigationProp` en Epic 15+.
- **D-14.4-2** — `UnifiedCameraResultScreen.tsx:52` — `wadaMatch.top3[0]` sin null-guard en `getInitialConfirmedTone`; crash teórico si el pipeline envía `top3 = []`. Teórico: pipeline 14.3b garantiza ≥3 candidatos cuando `type === "confirm"`. Añadir guard defensivo cuando se refactorice el pipeline.

---

## Deferred from: code review of 14-2-mis-looks-store-unification-migration (2026-04-21)

- **D-14.2-1** — `App.tsx:60` — AppState listener return value discarded; N Metro hot-reloads = N concurrent hydration handlers. Pre-existing from Epic 13. Fix when adding a module-level cleanup mechanism or when migrating bootstrap to a component.
- **D-14.2-2** — `App.tsx:42–73` — Cold-boot IIFE + AppState `active` race: OS can fire `active` during migration await, causing concurrent `hydrateMisLooksStore` calls and premature `hydrated: true` with empty `@mislooks:*` keys. Low probability on iOS cold launch. Fix with an in-flight guard (`let hydrating = false`).
- **D-14.2-3** — `misLooksStore.ts:180–189` — `toggleFavorite` persists fire-and-forget; a concurrent `hydrateMisLooksStore` (AppState `active`) can read pre-toggle storage and silently revert the toggle. Pre-existing fire-and-forget pattern from wardrobeStore. Fix by bumping a generation counter in setState and ignoring stale hydration results.
- **D-14.2-4** — `misLooksStore.ts:265` — `new Set(...)` on every hydration is never reference-equal to prior Set; all `favorites` subscribers re-render unconditionally on every app foreground. Fix by deep-comparing Set contents (sorted JSON) before calling setState.
- **D-14.2-5** — `misLooksStore.ts:49–53` — `isWardrobeItem` accepts empty strings for `localImagePath`/`thumbnailPath`; items pass validation but fail at render. Pre-existing from Story 13.1. Add `v.localImagePath.length > 0` to the guard when hardening data validation.

---

## Deferred from: code review of 13-5-s4-tu-look-skia-composition-share (2026-04-20)

- **D-13.5-1** — Stale `/share/look-*.jpg` accumulate on process crash — no sweep-on-mount. `exportLookImage.ts:219`. Risk is low (files excluded from iCloud backup; always deleted in `finally`). Implement a startup sweep if user reports storage growth.
- **D-13.5-2** — `drawSignatureInBand` — `font.getSize() ≤ 0` produces NaN coords (Skia silently renders nothing). `drawPolaroidStack.ts:118`. Theoretical; fonts loaded with explicit positive sizes. Add guard if font loading is ever made dynamic.
- **D-13.5-3** — `drawPolaroidStack.test.ts` "cascade spacing" test hardcodes `drawRRect` call indices `[1, 4, 7]`. `drawPolaroidStack.test.ts:91`. Documented brittleness; refactor if an extra drawRRect is ever added before the white card.
- **D-13.5-4** — `canvasSize = {w:0, h:0}` when share tapped before `onLayout` fires — export correct (hardcoded 1080×1920), preview blank briefly. `ArmarioTuLookScreen.tsx:166`. Visual flicker only; not worth the complexity of an explicit size guard.
- **D-13.5-5** — Defensive `goBack` races Zustand mid-share — `isSharing=true` on unmounted screen. `ArmarioTuLookScreen.tsx:158`. Theoretical; `finally` cleanup still runs; no practical scenario where wardrobe assignments change while user is actively sharing.
- **D-13.5-6** — `combinationId` undefined from route params not explicitly guarded. `ArmarioTuLookScreen.tsx:61`. Handled by existing guard chain (`combination === undefined → goBack`). Explicit guard is belt-and-braces.
- **D-13.5-7** — AC #4(h) `NSURLIsExcludedFromBackupKey` not set on `/share/`. `exportLookImage.ts:166`. Documented accepted debt in Completion Notes; expo-file-system SDK 55 does not expose this attribute; files deleted in `finally` so backup window is ~0.
- **D-13.5-8** — AC #10(t) partial-stub test uses `onViewLook` prop injection, not actual `defaultViewLook` path. `ArmarioFichaWadaScreen.test.tsx:261`. Behavioral regression covered; Story 13.6 replaces partial path entirely.
- **D-13.5-9** — `garmentImages` length diverges from `garmentDescriptors` between effect runs (consequence of P3 root cause; partial mitigation). Fixed by D-13.5 P3 reset; this entry tracks the strict-mode double-invoke variant specifically.

---

## Deferred from: code review of 13-6-s5-sugerencia-armonia-favorites-badges (2026-04-21)

- **D-13.6-1** — `sortFavoritesByCompleteness`: `NaN` en `assignedAt` contamina sort DESC — `isCombinationAssignment` en wardrobeStore solo valida `typeof === "number"` pero no `Number.isFinite`. Añadir `Number.isFinite(v.assignedAt)` al validador.
- **D-13.6-2** — `FavoritesList`: `cardWidth` puede ser 0 en el primer render antes del primer `onLayout`. Se auto-recupera; patrón común en RN. Guardar con `Math.max(1, ...)` si hay reporte de flash.
- **D-13.6-3** — `drawPolaroidStack`: sin `__DEV__` warning cuando `emptySlotPlusFont` es `undefined` pero `emptySlots` tiene entradas `true`. Añadir `console.warn` en `__DEV__` para detectar en desarrollo.
- **D-13.6-4** — `FavoritesList`: sin guard explícito `sortMode === "recent"` antes del bloque `sortFavoritesByCompleteness`. Actualmente seguro por early returns; añadir guard si se añade un nuevo sortMode en el futuro.
- **D-13.6-5** — `CompletenessBadge.test.tsx`: aserciones de strings exactas sin mock de i18n. Funcional con el harness actual que carga en.json. Añadir `jest.mock('react-i18next')` si CI empieza a fallar.
- **D-13.6-6** — `drawPolaroidStack`: dash intervals `[16, 10]` son fijos en puntos, independientes del tamaño de la tarjeta. Escalar a `cardW * 0.05` cuando se itere el look del empty polaroid post-épica.
- **D-13.6-7** — `ArmarioSugerenciaArmoniaScreen.test.tsx` test (p): aserta `"second layer"` (string renderizado) en vez de spy sobre la clave i18n. Funcional pero acoplado a la traducción EN. Refactorizar con spy en una sesión de limpieza de tests.
- **D-13.6-8** — `ArmarioSugerenciaArmoniaScreen`: `navigation.replace("ArmarioTuLook")` en auto-transición no pasa `animation: "none"` bajo Reduce Motion. React Navigation 7 native-stack no acepta override per-call. Investigar `StackActions.replace` con dispatch o screen option condicional en Epic 14.
- **D-13.6-9** — `ArmarioSugerenciaArmoniaScreen`: `garmentImages` puede tener longitud antigua durante el ciclo de reset async (strict-mode double-invoke). Parcialmente mitigado por P3 (length guard). Monitorear si aparece en tests con `--runInBand`.
- **D-13.6-10** — `drawPolaroidStack`: caller futuro que pase `emptySlots` sin `emptySlotPlusFont` dibujará el dashed border pero silenciará el glifo `+`. Añadir `__DEV__` assert en `drawPolaroidStack` cuando sea conveniente.

---

## Deferred from: code review of 13-4b-armario-picker-assignment-mechanics (2026-04-20)

- **D-13.4b-D** — `ArmarioCaptureScreen.test.tsx`: `mockRouteParams` declarado `const undefined` — el forwarding de `onCutoutSaved` Capture→Preview no está ejercitado en test. Spec dijo "no new tests" para este archivo; gap de cobertura aceptado.
- **D-13.4b-E** — `UnfavoriteCascadeProvider.handleConfirm`: si `onConfirm()` lanza, assignments ya borrados pero favorito intacto (sin mecanismo de rollback de cascade). Gap teórico estrecho, recuperable re-unfavoritando.
- **D-13.4b-F** — ES `armario.unfavoriteCascade.body_one`: `"la {{count}} prenda"` → `"la 1 prenda"` forzado. Omitir el numeral en `_one` form en UX polish post-épica.
- **D-13.4b-G** — `onCutoutSaved` función en route param: si OS recrea el modal desde params serializados, función queda `undefined` y asignación se silencia. Documentado en Dev Notes §Callback-via-params; contingencia: Zustand `pendingPreselect` slice.
- **D-13.4b-H** — `handleDeleteConfirm` no comprueba `isClosing.current`: delete puede ejecutar durante mid-dismiss; `setPendingDelete(null)` en componente mid-unmount (RN swallows). Baja probabilidad.
- **D-13.4b-I** — TOCTOU: count del delete dialog puede diferir del count real al confirmar (otra pantalla puede haber quitado la asignación entre render y confirm). Cosmético — cascade opera sobre live store.
- **D-13.4b-J** — `tileSize` usa `screenWidth` en lugar de `sheetWidth`: idénticos en iPhone (sheet full-width). Podría divergir si se añaden insets al sheet en Epic 14 iPad.
- **D-13.4b-K** — `ArmarioFichaWadaScreen.test.tsx`: ningún test aserta `testID="s2-quitar-confirm-sheet"` directamente (tests acceden a hijos del Modal). testID presente en prod code, gap menor de cobertura.

---

## Deferred from: code review of 13-3b-wardrobe-persistence-lifecycle (2026-04-20)

- **D1-13.3b** — `hydrateWardrobeStore` not guarded against concurrent invocations (`src/stores/wardrobeStore.ts`). Module import, App.tsx IIFE, AppState listener, and `saveCutoutAsWardrobeItem` all call `hydrateWardrobeStore()` without dedup guard. Could cause concurrent AsyncStorage reads + state overwrites. Pre-existing Story 13.1 debt — fix in a future hydration hardening story.

---

## Deferred from: code review of 13-3a-capture-background-removal-ui-flow (2026-04-19)

- **W1-13.3a** — `File.delete()` SDK 55 class-based API sync/async unclear: if `delete()` returns `Promise<void>`, `try/catch` in `deleteCutoutTmp` silently swallows rejections; verify SDK 55 types before 13.3b lands. [`src/screens/armario/ArmarioPreviewScreen.tsx`]
- **W2-13.3a** — `handlePaywallDismiss` unconditionally deletes cutout: if user upgrades mid-paywall and 13.3b's real save runs, `cutoutUri` will already be deleted. Documented as acceptable in Completion Notes. 13.3b owns the real fix with atomic move pattern.
- **W3-13.3a** — Stub happy-path leaves tmp file orphaned: on successful `saveCutoutAsWardrobeItem` the tmp PNG is never deleted. Explicitly documented in spec as acceptable for 13.3a. 13.3b adds cleanup inside the real atomic save path.
- **W4-13.3a** — `NSPhotoLibraryUsageDescription` duplicated in `ios.infoPlist` AND `expo-image-picker` plugin `photosPermission`. Intentional per spec as a backup; risk is both strings diverging in future. Clean up the redundant `infoPlist` entry after confirming the plugin writes it correctly post-prebuild.
- **W5-13.3a** — Test #1 permission re-render isolation gap: validates ref guard on same-state re-render but not on `undetermined → granted` state transition. Test currently passes and the guard is validated. Full variant coverage deferred.
- **W6-13.3a** — `handleRetake` synchronous double-goBack risk: native swipe-back + Retake tap in same frame could issue two `navigation.goBack()` calls. React Navigation handles duplicate pops gracefully. Pre-existing RN pattern.
- **W7-13.3a** — Missing `testID` on `ActivityIndicator` inside processing overlay. Tests assert the parent overlay container (`armario-processing-overlay`) but not the spinner directly.
- **W8-13.3a** — `AccessibilityInfo.announceForAccessibility` `useEffect` depends on `[t]` — theoretical re-fire if i18next re-creates `t` during a language switch mid-session. Extremely unlikely in practice.

## Deferred from: code review of 13-2-background-removal-native-module (2026-04-19)

- **W1-13.2** — Double CIImage pre-validation load in `BackgroundRemovalModule.process`: `guard CIImage(contentsOf:) != nil` decodes the full image just to validate readability, then discards it; Vision re-opens via URL. Spec-required (AC #3 ioFailed pattern mirrors WhiteBalance). Revisit in Story 13.5 when profiling the full composition pipeline.
- **W2-13.2** — Temp `cutout-*.png` files in `FileManager.default.temporaryDirectory` accumulate if Story 13.3a flow throws before cleanup. By-design: 13.3a owns cleanup on Repetir/paywall. Consider a startup sweep in Story 13.3b wardrobe persistence lifecycle.
- **W3-13.2** — Near-zero-extent CVPixelBuffer after `croppedToInstancesExtent: true` produces a valid but visually empty PNG (no error thrown). Add a minimum-dimensions guard (e.g. ≥10px) when full Armario flow is assembled in 13.4a.
- **W4-13.2** — `observation.allInstances` may include only background instance (index 0) on some OS builds → transparent PNG. Vision API subtlety; revisit if users report blank cutouts post-13.3a.

## Deferred from: code review of 13-1-wardrobe-data-model-repository-zustand-store (2026-04-19)

- **W1-13.1** — Type guards (`isWardrobeItem`) aceptan strings vacíos para `localImagePath`, `thumbnailPath`, e `id`. La validación de paths (mínimo length, `file://` prefix) pertenece a Story 13.3b cuando se escriben los paths reales — no al type guard de hydration.
- **W2-13.1** — `assign()` no valida que `wardrobeItemId` exista en la lista de items. Diseño intencional: el contrato "skip orphans" lo gestiona Story 13.4b al resolver assignments. Cambiar esto requeriría aclarar qué significa "borrar" un item frente a sus assignments.

---

## Deferred from: Epic 12 code review (2026-04-15)

Scope: Stories 12.1 + 12.2 + 12.3 + 12.4 (Color Capture feature). Full review in `_bmad-output/implementation-artifacts/epic-12-code-review.md`.

### Cluster A — Native-module typing hygiene (4 patches, ~1h + native rebuild)

**Impact:** LOW — feature works; we lose type-safety at the Swift↔JS bridge boundary. A refactor that changes the module API won't be caught at compile time.

- [ ] **P19** — `applyWhiteBalance` JS binding is wrapped by a manual cast because the ambient shim's generic is too loose. After P26 is done, tighten this to use the real `expo-modules-core` types. `modules/white-balance/src/index.ts`
- [ ] **P26** — Add `expo-modules-core` as a direct dependency (`pnpm add expo-modules-core`). Currently it's transitive through `expo`, so pnpm doesn't hoist it and TypeScript can't resolve its real types. **Risk:** version mismatch with what `expo` expects. Test with a full `expo prebuild --clean && expo run:ios` before trusting.
- [ ] **P27** — Remove `"modules/**"` from `tsconfig.json` exclude. Currently the local module's JS shim is not type-checked at all. After P26, the real types resolve correctly and this exclude becomes unnecessary.
- [ ] **P28** — Add a `@modules/*` path alias in `tsconfig.json` + `babel.config.js`. Change `CaptureScreen.tsx:18` from `import … from "../../modules/white-balance"` to `import … from "@modules/white-balance"`. Minor ergonomic win, depends on P27 being stable first.

**Fix order:** P26 → P27 → P28 → P19.

### Cluster B — CaptureScreen integration tests (1 patch, ~1-2h)

**Impact:** MEDIUM — CI won't catch a regression in the routing between CaptureScreen and the result sheets. Covered manually in the on-device test, but a future refactor of `takePicture` could silently break sheet props without failing tests.

- [ ] **P21** — `CaptureScreen.test.tsx` currently mocks both sheets as `() => null`. Replace with `jest.fn()` mocks that capture received props, then assert:
  - Direct match → `navigation.replace("Combinations", { colorId, capturedHex })` called with correct params
  - Confirm match → `ColorMatchSheet` receives `{ matches, visible: true, capturedHex }`
  - Out-of-coverage → `OutOfCoverageSheet` receives `{ bestMatch, visible: true }`
  - Sheet `onSelect(colorId)` → navigation called correctly
  - Sheet `onDismiss` → state reset (matchState=null, analysisVisible=false, analysisError=null, capturedHex=null)
  Consider rendering the real sheets and only mocking their native deps (Modal + safe-area).

### Defer list (not debt per se — policy/polish choices documented during review)

These were reviewed and deliberately left as-is. Revisit only if the surrounding context changes:

- **W1** — CIEDE2000 `dhp` branching when both chromas are 0. Numerical behavior benign today; matches Sharma et al. in practice because `dHp=0` kills the contribution.
- **W2** — Swift `averageColor` samples sRGB-encoded bytes without linearization. Acknowledged heuristic for the CCT estimate; research confirmed "good enough" for Tier 3 on-device accuracy.
- **W3** — `react-native` `Modal` nested inside a screen that used to be fullScreenModal (now card). iOS occasionally logs warnings. Would require migrating to `@gorhom/bottom-sheet` or portal solution. No reproducible issue.
- **W4** — `interpolateColor` in `CustomTabBar` captures `wadaTokens` lexically. Future dark-mode will need theme-reactive tokens. No current regression.
- **W5** — Dynamic Type at XXXL may clip `CaptureScreen` overlay hint / error pill text. Accessibility polish pass.
- **W6** — Landscape orientation uses portrait-only absolute positioning. Camera UX convention is portrait-lock; easier to enforce orientation lock on the screen.
- **W7** — No AppState listener / timeout around the native pipeline. Overlay could hang if `applyWhiteBalance` never resolves (e.g. app backgrounded mid-call on some iOS builds).
- **W8** — Reduce Motion toggled mid-cycle leaves the Reanimated interval branch asymmetric for one tick. Warning-only.
- **W9** — `useReducedMotion` returns `false` on first render (async hook). Pre-existing hook behavior, not Epic 12.
- **W10** — CustomTabBar camera FAB ignores `event.defaultPrevented` from `tabPress` listeners. No current listener guards.
- **W11** — 500ms WB-correction latency (Story 12.3 AC #1) not enforced or instrumented. Aspirational target, hard to verify in CI.
- **W12** — `colorMatch.test.ts` "neon green out-of-coverage" is a dataset-dependent test. Already documented as D4 during Story 12.1 review.
- **W13** — `matchWadaColor` assumes ≥3 colors in dataset. Invariant holds today (159); stronger type `readonly [WadaMatch, ...WadaMatch[]]` could lock it in.
- **W14** — `classifyMatch` boundary equality: exact ΔE=2.0 → confirm (not direct), exact ΔE=15.0 → confirm (not out-of-coverage). Matches spec reading of "2.0–15.0 inclusive". Boundary tests added (P37).
- **W15** — Dead `capturedHex` prop in both sheets (`_capturedHex` underscore-destructured). Intentional Epic 13 extensibility hook per Story 12.3 Dev Notes. UX for A/B captured-vs-match comparison is explicitly future scope.
- **W16** — Navigation `handleTryAgain` doesn't reset `wbTemperature`. Spec `00-discovery.md` says persist during session; current behavior matches spec intent.

## Deferred from: code review of 14-1-wardrobe-item-category-field (2026-04-21)

- **D-14.1-1** — `normalizeItems` parameter typed as `WardrobeItem[]` while some items may be missing `category` at runtime — an intermediate type (e.g. `Omit<WardrobeItem, "category"> & { category?: WardrobeCategory }`) would be more honest. Private helper; design follows from `parseItems` returning a partial shape. Story 14.2 refactors the store and is the right scope.
- **D-14.1-2** — Concurrent `hydrateWardrobeStore()` calls not serialized — two overlapping awaits could double-write state and double-emit the backfill warn. Pre-existing structural issue (not introduced by this story). Add an in-flight guard when the store is refactored in Story 14.2.
- **D-14.1-3** — Backfilled `category: "top"` items never auto-persisted on read-only sessions — re-backfills on every cold launch until a `setItems` write occurs. Acknowledged design choice ("sticks on first write"). Story 14.2's full store migration will resolve permanently.
- **D-14.1-4** — Five screen test files (`FavoritesList.test.tsx`, `ArmarioPickerScreen.test.tsx`, `ArmarioFichaWadaScreen.test.tsx`, `ArmarioTuLookScreen.test.tsx`, `ArmarioSugerenciaArmoniaScreen.test.tsx`) use anonymous `WardrobeItem` mocks missing `category`. Tests pass because `category` is not accessed; will produce silent `undefined` when downstream stories add `item.category` reads. Update each mock fixture in the story that first uses `item.category`.
- **D-14.1-5** — `ArmarioPreviewScreen.test.tsx` has no assertion that `category: "top"` is forwarded to `saveCutoutAsWardrobeItem`. Story 14.5 will add the real category selector and is the right place to add proper call-site assertions.
- **D-14.1-6** — No `addItem → AsyncStorage persist → hydrateWardrobeStore → getItems` category round-trip test. AC #2 behavioral requirement is satisfied in production code but not exercised by a cross-layer integration test. Story 14.2 integration test opportunity.

---

## Deferred from: code review of 14-3b-unified-camera-pipeline-swift-module (2026-04-21)

- **D-14.3b-1** — Back button disabled while error persists: if Vision fails repeatedly, user is in a retry loop with back button disabled (`disableControls = error !== null`). Pre-existing ArmarioCaptureScreen pattern; modal swipe-to-dismiss is the OS-level escape hatch. [`src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`]
- **D-14.3b-2** — `PixelLayout.init` default case silently treats all unknown 32-bit formats as BGRA. Vision only returns 32-bit formats today; future OS changes would silently corrupt color extraction. Documented in Dev Notes risk list. Add a `CVPixelBufferFormatType` allowlist guard if Vision changes behavior on iOS 18+. [`modules/background-removal/ios/BackgroundRemovalModule.swift:240`]
- **D-14.3b-3** — `runPipeline` has no timeout: Vision + `removeBackground` can theoretically hang indefinitely, leaving `processing=true` and the UI frozen. Pre-existing ArmarioCaptureScreen pattern. Add a `Task.sleep` timeout + `cancel()` wrapper if on-device complaints surface. [`src/screens/unifiedCamera/UnifiedCameraCaptureScreen.tsx`]
- **D-14.3b-4** — `UnifiedCameraResultScreen` diagnostic text (`dominantHex = #XXXX`, `wadaMatch.type = direct`) renders in production without `__DEV__` guard. Intentional per spec; Story 14.4 replaces this screen. Ship as-is; remove placeholder text in Story 14.4. [`src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx`]

---

## Deferred from: code review of 14-6-visualizer-bridge-cta-swap-share-removal (2026-04-22)

- **D-14.6-1** — `FavoritesTab: undefined` en TabParamList bloquea el tipado anidado del cross-nav a `ArmarioFichaWada`. Runtime funciona (React Navigation acepta los params en tiempo de ejecución); el `as never` silencia el error de TS. Fix correcto: `FavoritesTab: NavigatorScreenParams<FavoritesStackParamList> | undefined` en `src/navigation/types.ts:28`. Natural en Story 14.7 cuando se renombra FavoritesStack → MisLooksStack.
- **D-14.6-2** — `slots[0]` se accede sin null-guard cuando `combination.colors` es un array vacío (dataset malformado). Bug pre-existente: `<Aureola>`, `<OutfitCard>` y `<MiniPaletteStrip>` tienen el mismo riesgo. Añadir guard `if (slots.length === 0) return <NotFound>` cuando se endurezca el dataset en Epic 15+.
- **D-14.6-3** — `react-native-view-shot` permanece en `package.json` sin referencias en `src/` tras la eliminación de `share.ts`. Fuera de scope explícito (spec §Out of scope). Eliminar en una pasada de limpieza de dependencias post-epic con `expo run:ios` obligatorio.
- **D-14.6-4** — `CTA_LABEL_CREAM = "#faf7f2"` duplicado en `OutfitVisualizer.tsx` y su test; no exportado desde `styles/theme.ts`. Misma situación que `UnifiedCameraResultScreen`. Mover a `wadaTokens.ctaLabelCream` o `src/lib/color.ts` cuando se unifiquen las constantes de accesibilidad de color.

---

## Deferred from: code review of 14-5-camera-save-flow-category-selector-paywall (2026-04-22)

- **D-14.5-1** — `CategoryPickerSheet.tsx:58` — `SCREEN_HEIGHT = Dimensions.get("window").height` a nivel de módulo, no reactivo a orientación/multitasking. iPhone-only MVP minimiza el riesgo. Usar `useWindowDimensions()` si se añade soporte iPad o landscape.
- **D-14.5-2** — `UnifiedCameraPostSaveScreen.tsx:54,61` — casts `as never` en `navigate("Main", {...} as never)` eluden el tipado de React Navigation. Patrón existente en todo Epic 14 (mismo que D-14.4-1). Corregir con `CompositeNavigationProp` en Epic 15+.
- **D-14.5-3** — `UnifiedCameraPostSaveScreen.tsx:53-61` — `rootNav?.navigate(...)` silencia el fallo si `getParent()` es undefined. En prod el stack siempre tiene padre; añadir fallback defensivo (`navigation.goBack()`) si se añade deep-linking o isolated test harness.
- **D-14.5-4** — `UnifiedCameraResultScreen.tsx` — error banner `bottom: 200` es un magic number sin relación con safe-area insets. Coincide con el precedente de `ArmarioPreviewScreen.tsx:295`. Derivar de `insets.bottom + offset` en una pasada de polish.
- **D-14.5-5** — `src/lib/armario/saveCutoutAsWardrobeItem.ts` — `ensureWardrobeDirectories()` puede propagar un error raw de `diskFull` que no es instancia de `WardrobePersistenceError`, llegando al catch-all como `"repoAdd"`. Bug pre-existente en el helper; no introducido por esta story. Fix: añadir try/catch en `ensureWardrobeDirectories` que envuelva en `WardrobePersistenceError("diskFull")`.
- **D-14.5-6** — `UnifiedCameraPostSaveScreen.tsx:48` — `wadaName = ""` cuando `getColor(wadaColorId)` devuelve undefined, produciendo CTA con interpolación vacía. `wadaColorId` siempre válido desde el pipeline; añadir fallback solo si se permite deep-link directo a PostSave.
- **D-14.5-7** — `CategoryPickerSheet.tsx` — Confirmar button no aplica opacity reduced mientras `confirming=true` (solo muestra spinner). VoiceOver `busy: true` es correcto; riesgo visual bajo. Añadir `opacity: confirming ? 0.7 : 1` en una pasada de polish.

---

## Deferred from: code review of 14-3a-unified-camera-nav-setup-capturescreen-deprecation (2026-04-21)

- **D-14.3a-1** — Root modal slide animation plays even with Reduce Motion — `animation: isReducedMotion ? "none" : "fade"` in UnifiedCameraStack only suppresses intra-stack transitions; the iOS sheet slide on modal open/close is governed by `presentation: "modal"` on RootStack.Screen and has no Reduce Motion override. Pre-existing behavior identical to ArmarioRoot. Fix requires a `useNativeDriver`-compatible custom animation config at the RootStack level — non-trivial Reanimated work best paired with a dedicated accessibility polish story.
- **D-14.3a-2** — Result + PostSave placeholder screens have no dismiss button — intentional per spec (real navigation wiring lands in Story 14.4/14.5). Currently unreachable from any user flow. Story 14.4 owns Result UI + back-navigation; Story 14.5 owns PostSave flow.
- **D-14.3a-3** — FAB double-tap while UnifiedCameraRoot modal is open — `navigate("UnifiedCameraRoot")` when already on that modal resets inner-stack navigation to initial `Capture` screen. React Navigation 7 behavior; ArmarioRoot has same gap. Low probability. Add a `isPresenting` guard in Story 14.3b when the real Capture screen has navigation state worth preserving.
- **D-14.3a-4** — `pnpm test` exits non-zero (2 pre-existing suites fail: OutfitVisualizer.test.tsx `navigation.getState` mock missing + i18n.test.ts `detectLanguage` locale probe). Zero new failures in 14.3a. Fix OutfitVisualizer mock when the test infrastructure is refactored; i18n test fix tracked separately.
- **D-14.3a-5** — No test file for UnifiedCameraStack navigator wrapper — mirrors pre-existing ArmarioStack.tsx gap. Add a smoke test asserting the initial route is `Capture` and `useReducedMotion` controls the animation option when UnifiedCameraStack gets real content in Story 14.3b.
- **D-14.3a-6** — No CustomTabBar.test.tsx for FAB rewire — spec explicitly deferred (Task 3.4). Add a test asserting `camera-fab-phone` press calls `getParent().navigate("UnifiedCameraRoot")` when CustomTabBar unit tests are created (recommended before Story 14.3b ships the real camera pipeline).

---

## Deferred from: code review of 14-9-guardar-para-luego-ficha-wada (2026-04-22)

- **D-14.9-1** — `ArmarioFichaWadaScreen.tsx:446` — `accessibilityHint` estático no cambia bajo `needsLimitGate`; VoiceOver dice "Añade a Mis Looks" pero la acción abre el paywall. Consistente con el patrón de slot-tap de 14.8. Evaluar en pasada de polish de accesibilidad.
- **D-14.9-2** — `ArmarioFichaWadaScreen.tsx:458` — Cuando `hydrated=false` el CTA "Guardar para luego" muestra opacity 1 (solo `disabled` bloquea la tap); sighted users no ven indicación de estado loading. Patrón pre-existente igual que "Ver tu look". Añadir `opacity: !hydrated ? 0.5 : needsLimitGate ? 0.4 : 1` si se añade un loading state visual en una pasada futura.
- **D-14.9-3** — `ArmarioFichaWadaScreen.tsx:126-137` — `announceForAccessibility` se ejecuta fuera del try/catch; si `addFavorite` lanza, VoiceOver anuncia éxito con write fallido. Hereda D-14.8-2 explícitamente aceptado en spec AC #13(i). Fix: mover announce dentro del bloque success cuando addFavorite gane ruta async/fallible.
- **D-14.9-4** — `ArmarioFichaWadaScreen.tsx:436` — `marginHorizontal: -20` en el divider asume `paddingHorizontal: 20` fijo del contenedor padre. Patrón pre-existente en todos los screens armario. Extraer a `CONTAINER_H_PADDING = 20` como constante compartida si el padding cambia en el futuro.
- **D-14.9-5** — `ArmarioFichaWadaScreen.tsx:624` — La ruta post-compra desde esta pantalla (`onPurchase={() => gate.handlePurchase(addFavorite)}`) no tiene test dedicado que verifique `addFavorite(blockedCombinationId)` tras compra exitosa. Fuera del scope de AC #13. Cubrir en una historia de hardening de paywall si D-14.8-4 se aborda.

---

## Deferred from: code review of 14-8-auto-save-look-on-first-assignment (2026-04-22)

- **D-14.8-1** — `ArmarioPickerScreen.tsx:190-195` — `addFavorite` error swallowed silently in production (`__DEV__`-only guard). Synchronous Zustand setter won't throw in practice; addFavorite failure is theoretical. Fix if store gains async persistence path.
- **D-14.8-2** — `ArmarioPickerScreen.tsx:196-200` — `announceForAccessibility` fires outside inner try/catch; user would hear "Look saved" even if `addFavorite` threw. Theoretical. Move announce inside success branch if addFavorite ever gains async/fallible path.
- **D-14.8-3** — `MisLooksLimitStrip.tsx` — `accessibilityRole="alert"` is a static role descriptor on iOS; VoiceOver may not auto-announce the strip on dynamic appearance. Spec chose this over `accessibilityLiveRegion` intentionally. Evaluate in dedicated accessibility polish story.
- **D-14.8-4** — `usePremiumGate.ts:140,152,178` — internal `useCallback` hooks may capture stale `blockedCombinationId` if dep arrays are incomplete. Pre-existing in unchanged hook; validated by prior stories (14.4, 14.5, 14.6). Fix when refactoring usePremiumGate.
- **D-14.8-5** — `usePremiumGate.ts:153` — `handlePurchase` parameter named `toggleFavorite` while Story 14.8 (and future stories) pass `addFavorite`. Naming inconsistency. Rename parameter to `onFavoriteAction` or similar in a hook refactor.
- **D-14.8-6** — Pre-existing `pnpm lint` exit-code 1 due to formatting in `FavoritesList.test.tsx` (14.7) + `OutfitVisualizer.tsx` (14.6/D-14.7-4). Not introduced by 14.8. Fix in dedicated lint-cleanup pass.

## Deferred from: code review of 14-10-nuevo-look-entry-point-mis-looks (2026-04-22)

- **D-14.10-1** — `src/screens/FavoritesList.tsx:77–87` — Silent navigation failure when `rootNav` is undefined (two `getParent()` hops). Pre-existing pattern from Story 14.6 `OutfitVisualizer.handleMakeMine`; `?.` chains prevent crashes. Consider adding `__DEV__` console.warn guard when rootNav resolves to undefined, to catch nav tree depth changes early in development.
- **D-14.10-2** — `src/screens/FavoritesList.tsx:81–86` — `as never` cast suppresses TypeScript check on nested navigate payload; `TabParamList.ColorsTab` typed as `{ screen: keyof ColorsStackParamList } | undefined` not as `NavigatorScreenParams<ColorsStackParamList>`. Pre-existing from Story 14.6. Fix by widening TabParamList types in a navigation types cleanup story.
- **D-14.10-3** — `src/screens/FavoritesList.tsx:107–112` — `useFocusEffect` resets `isNavigating.current = false` on focus; a CTA tap + card tap race can slip past the guard if focus briefly toggles. Pre-existing issue in `handleComboPress` path; not introduced by this story.
- **D-14.10-4** — `src/screens/FavoritesList.test.tsx:936–956` — SymbolView sparkles test uses `toJSON()` traversal with `type === "SymbolView"` check rather than testID-based query. Works correctly with the string mock but would break silently if the mock strategy changes. Consider switching to `getByTestId("symbol-sparkles")` pattern from `NewLookCtaCard.test.tsx`.
- **D-14.10-5** — `src/screens/FavoritesList.tsx:72–75` — `handleSettingsPress` is not wrapped in `useCallback` unlike the new `handleNewLookPress`. Inconsistency in pre-existing code; not introduced by this story.
- **D-14.10-6** — `src/screens/FavoritesList.tsx:285, 307` — Dual `testID="favorites-list"` on the empty-state `<View>` and the populated `<FlatList>` is brittle under async hydration in tests. Currently safe because all test mocks are synchronous. Latent risk if hydration is made async in future test refactors.
