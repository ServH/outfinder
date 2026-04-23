# Epic 14 post-release bugs — Handoff 2026-04-23 (ready for review)

**Rama:** `story/14-13-epic14-ondevice-qa-happy-paths` (off `epic-14` HEAD `21534e0`).
**Estado:** in-progress → **review** (listo para code-review adversarial en fresh LLM context per CLAUDE.md).
**Autor sesiones:** Alejandro + Claude Opus 4.7 (sesiones 2026-04-22 y 2026-04-23).
**Supersede:** `epic-14-bugs-handoff-2026-04-22.md` (déjalo ahí como histórico, pero este es la fuente de verdad actualizada).

---

## 1. Resumen ejecutivo

Story 14.13 arrancó como **QA story pura** (deliverable: checklist markdown). Durante la ejecución on-device Alejandro descubrió 11 bugs post-release de Epic 14. 7 fueron cerrados como `fix-in-14.13` (código en esta rama). 4 quedan pendientes como follow-ups propuestos para v1.4.1.

**CI baseline al cierre:** tsc clean · lint 2 pre-existing (FavoritesList.test.tsx + OutfitVisualizer.tsx, heredados pre-sesión) · pnpm test **948 passing / 3 pre-existing failures / 951 total** (+9 vs 939 baseline de 14.12b por casos wardrobe context en PremiumPaywall).

**16 commits en la rama** (counting el de checklist + handoff del 22 + 14 fixes). Diff total: 25 archivos · +548 / −209 líneas.

---

## 2. Bugs cerrados en esta rama (7)

| ID | Sev | Título | Commits |
|---|---|---|---|
| BUG-001 | high | Navegación apilada tras guardar prenda | `068877b` (primer intento fallido) · `e39e899` (fix real con `popTo`) |
| BUG-002 | polish | Contador "X combos" en headers | `90496df` |
| BUG-003 | polish | Badge "X/N" en header Ficha Wada | `90496df` (+ extensión S5 en `23598fe`) |
| BUG-004 | medium | CTA duplicado en SuggestionCard (S5) | `2a5f590` |
| BUG-007 | polish | "Sin prendas" redundante en asignación | `90496df` (colateral de BUG-003) |
| BUG-008 | medium | Feedback visual "Usar esta foto" | `d63902c` |
| BUG-011 | medium | Paywall no contextualizado wardrobe vs favorites | `0b10f8f` (refactor API) · `e6cacdb` (thumb placeholder) · `aec7535` (loop fix) · `775bab7` (CTAs anchored) |

**Polish adicional sin bug ID** (decisiones post-validación on-device):
- Badge "2/3" en cards "En curso" sin fondo de color — `33e0d9a`. Implementado como `transparent: boolean` prop reusable en `CompletenessBadge`.
- Badge "3/3" en S4 "Tu Look" sin fondo de color — `1a4559a`. Mismo `transparent` prop.

**Utilidades dev-only añadidas** (quedan en producción pero inertes por `__DEV__` guard):
- `PremiumContext.__dev_resetPremium()` + Settings row `dev-reset-premium-row` — permite limpiar el SecureStore de premium para testear gates sin reinstalar. Commit `4cc03aa`.
- Settings row `dev-preview-wardrobe-paywall-row` — abre el paywall wardrobe en modo preview sin tener que llenar el armario a 10 prendas. Commit `c51c5ae`.

**Archivos tocados (25):** ver `git diff --stat epic-14..HEAD -- 'src/*'` — detalle en §6.

---

## 3. Bugs pendientes (4) — propuestos como follow-up v1.4.1

### BUG-005 — Mis Looks layout "En curso" vs filtros

- **Severidad:** medium
- **Estado actual:** `new` en bug log.
- **Razón para follow-up:** requiere UX-DR (sticky filter bar, mini-headers de sección "En curso · N" + "Todos tus looks", separación semántica). Toca `FavoritesList.tsx` + `IncompleteLooksSection.tsx` + posiblemente nuevo componente de sticky header. No es parche puntual.
- **Scope estimado spec + dev:** 2-3h.
- **Impacto si NO se arregla en v1.4.0:** IA confusa en Mis Looks cuando hay looks en curso + terminados mezclados con filtros. No rompe funcionalidad, solo confunde scope visual.
- **Decisión pendiente de Alejandro para la spec:** estilo del sticky bar (hairline vs elevation), copy de los mini-headers, comportamiento al scroll.

### BUG-006 — Flash Mis Looks antes del picker desde Visualizer

- **Severidad:** medium
- **Estado actual:** `triaged` (analizado + rationale en bug log).
- **Root cause confirmado:** compound fade entre `TabNavigator.animation="fade"` (300ms) y `FavoritesStack.animation="fade"` (300ms). El cross-nav `rootNav.navigate("Main", { screen: "FavoritesTab", params: { screen: "ArmarioFichaWada" } })` atomic aplica el nested state, pero ambas fade-animations compuestas dejan visible FavoritesList durante ~1s.
- **Razón para follow-up:** no tiene fix trivial. Opciones evaluadas:
  1. `CommonActions.reset` con estado nested completo — verboso, frágil si el orden de tabs cambia, rompe back-behavior.
  2. Override local `animation: "none"` solo para esta transición — no expuesto limpiamente por RN7.
  3. Dos dispatches separados (pre-push en FavoritesStack + luego switch tab) — requiere research de timing de RN7 batching.
- **Scope estimado spec + dev:** 1-2h + on-device iteration.
- **Impacto si NO se arregla en v1.4.0:** flash cosmético ~1s en el camino "Visualizer → Hacer este look mío". No rompe funcionalidad; baja calidad percibida.

### BUG-009 — Prenda fotografiada no auto-rellena slot del combo

- **Severidad:** high (lógica de producto, no polish)
- **Estado actual:** `new`.
- **Descripción:** tras fotografiar una prenda (ej. "camiseta Carmín"), el user elige una combinación que contiene Carmín, entra al Visualizer → "Hacer este look mío" → **el slot de camiseta aparece vacío** aunque la prenda ya existe en el armario. La app tiene toda la info para asociarla pero no lo hace.
- **Razón para follow-up:** NO es un bug de Epic 14 — es una **feature que falta**. El flow cámara → combo → Visualizer → FichaWada fue diseñado como pasos independientes; no pasa el `wardrobeItemId` recién creado como anchor al Visualizer / FichaWada.
- **Requisitos de matching** (para spec):
  - Color Wada exacto entre la prenda guardada y el slot.
  - Tipo de prenda compatible con el slot (camiseta → top).
  - Si hay varias prendas matcheando, priorizar la recién creada.
  - Edge: tipo detectado divergente al del slot → NO auto-rellenar.
  - Edge: combo con 2 slots del mismo color → auto-rellenar solo uno.
- **Scope estimado spec + dev:** 3-4h.
- **Dependencia:** conjunta con BUG-010.

### BUG-010 — Visualizer asigna prenda al slot equivocado por posición

- **Severidad:** high (lógica de producto)
- **Estado actual:** `new`.
- **Descripción:** el Visualizer deriva el garment type del **índice posicional del color en el combo Wada** (slot 0 = top, 1 = bottom, 2 = shoes). Cuando el combo se instancia con una prenda real del user, ignora el `category` declarado de esa prenda y la pinta en la posición incorrecta (ej. camiseta blanca renderizada como zapatilla porque White Mouse es el color 3 del combo).
- **Razón para follow-up:** es la **misma moneda que BUG-009** — ambos cosen el gap entre "prenda real guardada" y "Visualizer consume combo abstracto". Conviene spec conjunta.
- **Scope estimado spec + dev:** incluido en el scope de BUG-009 (refactor del Visualizer para respetar `category` de la prenda asignada en vez de derivarla por posición).

**Decisión pendiente para la story conjunta 009+010:** entre opción A (quick anchor-by-param al instanciar desde cámara, minimal refactor) vs B (refactor profundo: Visualizer siempre lee `category` de la prenda, nunca deriva por posición). Alejandro elige al momento de `feature-spec`.

---

## 4. Cambios arquitectónicos introducidos (contexto para el reviewer)

### 4.1 `PremiumPaywall` — API refactorizada (BUG-011)

**Antes:** prop `favoriteCombinationIds: string[]`, `limit: 5` hardcoded internamente, copy siempre asumía favoritos, preview siempre mostraba paletas guardadas.

**Después:** prop `context: "favorites" | "wardrobe"` requerida. `limit` derivado de `PREMIUM_CONFIG.FREE_FAVORITES_LIMIT` o `FREE_WARDROBE_LIMIT` según context. `currentCount` reemplaza la derivación interna. `savedCombinationIds` (renamed) + `blockedCombination` son favorites-only. Nueva `wardrobeItemThumbnails?: string[]` para el thumb row wardrobe-only. Todos los strings (headline, body, badge, unlockLabel, yourCollection, savedCount) derivan via `t("paywall.${context}.*")`.

**i18n reorganizado:** claves shared al root de `paywall.*` (dismiss, priceLabel, unlockButton, restoreButton, etc), context-specific bajo `paywall.favorites.*` y `paywall.wardrobe.*`.

**Layout:** CTAs anchored al bottom del sheet via `flexGrow: 1` en ScrollView contentContainer + Spacer `<View style={{ flex: 1 }} />` entre body y CTA row — garantiza que los CTAs queden a la misma altura vertical en ambos variants (favorites con N paletas vs wardrobe con 1 thumb row).

**Posible extensión futura:** añadir un 3er context (ej. "settings" como entry genérico de promo) = añadir sub-objeto en i18n + un branch en el component. Zero cambio en callsites existentes.

### 4.2 `CompletenessBadge` — nueva prop `transparent`

Prop opcional que dropea `backgroundColor` + paddings internos cuando `true`. Foreground color intacto (sigue usando variant colors para partial/complete/none). Usado en cards "En curso" + S4 "Tu Look" para que el badge lea como texto plain sobre la surface del parent en vez de pill con color.

Cero impacto en consumidores existentes (default `false` mantiene comportamiento previo).

### 4.3 Fix navegación `popTo` — patrón para cross-nav desde modals

El fix real de BUG-001 (segundo intento) cambió el patrón `navigate + goBack` por `popTo("Main", {nested})`. Este patrón resuelve una trampa sutil de RN7 con nested navigators: `navigate` cambia el focused navigator; un `goBack` posterior puede rutearse al nested (no al que captura la ref), cancelando el navigate. `popTo` es atómico y unfocuses correctamente.

Aplicado en 3 callsites: `UnifiedCameraPostSaveScreen.handlePrimary`, `.handleSecondary`, `UnifiedCameraResultScreen.handleSecondaryLink`.

### 4.4 Selectores Zustand — useMemo para derivaciones de array

Un selector que devuelve un array nuevo cada render (`slice().reverse().map()`) causa loop infinito en Zustand (Object.is detecta diff por ref). El patrón correcto es leer la referencia estable del store y derivar con `useMemo`:

```tsx
const wardrobeItems = useMisLooksStore((s) => s.items);   // stable ref
const wardrobeItemThumbnails = useMemo(
  () => wardrobeItems.slice(-5).reverse().map((i) => i.thumbnailPath),
  [wardrobeItems]
);
```

Aplicado en `Settings.tsx`, `ArmarioPreviewScreen.tsx`, `UnifiedCameraResultScreen.tsx`. Documentado con comentario explicativo en cada callsite para que futuros refactors no lo rompan.

### 4.5 Utilidades dev-only — `__dev_resetPremium` + paywall preview

Ambas están detrás de `__DEV__` guard y/o renderizadas solo bajo `{__DEV__ && (...)}` en Settings. En release builds se tree-shakean. No tocan lógica de producción — solo ayudan a testear gates premium sin reinstalar la app ni llenar manualmente el armario a 10 prendas.

---

## 5. Qué el reviewer debe validar

### 5.1 Code review gates (per CLAUDE.md "Mandatory Code Review")

- **Function declarations + named exports:** ✅ todos los cambios respetan CLAUDE.md (ninguna nueva `export default`).
- **NativeWind className / style dinámico:** ✅ respetado — `style={{}}` solo para valores dinámicos (Wada colors, opacity).
- **Haptics via lib/haptics.ts:** ✅ no se importa expo-haptics directo en ningún cambio.
- **Props interface:** ✅ `PremiumPaywallProps`, `CompletenessBadgeProps`, `IncompleteLooksSectionProps` actualizados con JSDoc.
- **Hooks before early returns:** ✅ pendiente de re-verificar en el review — screens tocados son `ArmarioPreviewScreen`, `UnifiedCameraResultScreen`, `Settings`. Los `useMemo` añadidos están antes de cualquier early return.
- **44pt touch targets + a11y labels:** ✅ paywall thumbs son decorativos (no tappables); todos los Pressables tocados mantienen `min-h-[44px]` o mayor.
- **VoiceOver:** ✅ nuevas i18n keys en ES + EN. Paywall wardrobe header tiene accessibilityLabel combinado. Thumbs son decorativos sin label (VoiceOver naturalmente los skip).
- **testID + tests:** ✅ +9 casos test (6 wardrobe context del paywall + 3 thumb row), 2 tests borrados (features removidas: badge S2 y swatches En curso), 5 tests actualizados.

### 5.2 Validación on-device adicional (ya hecha por Alejandro · 2026-04-23)

- BUG-001 (nav apilada): **verde** — ambos CTAs de PostSave + secondary link de Result navegan limpio sin capas.
- BUG-002 (combo counter): **verde** — headers sin contador en ColorHome + Combinations.
- BUG-003 (badge Ficha Wada + S5 + S4): **verde** — badges fuera donde toca, preservados donde se pidió.
- BUG-004 (CTA duplicado): **verde** — solo botón negro inferior.
- BUG-007 (sin prendas en asignación): **verde** (efecto colateral de BUG-003).
- BUG-011 (paywall contextualizado + thumb row + CTAs anchored): **verde** — dev preview valida ambos variants.

**Pendiente de validación on-device (reviewer puede pedirla a Alejandro):**
- BUG-008 (spinner "Usar esta foto") — implementado + test cubre, visual smoke on-device pendiente.

### 5.3 Cosas que NO se tocaron y deben permanecer

- Ningún archivo `modules/background-removal` ni `modules/white-balance` → no native rebuild required.
- Ningún store slice nuevo; solo lecturas adicionales de `useMisLooksStore.items`.
- Cero dependencias nuevas; cero config de Expo/app.json.
- El patrón existente de `usePremiumGate(favorites)` en pantallas favorites-context intacto.
- Los 2 errores pre-existentes de Biome (FavoritesList.test.tsx + OutfitVisualizer.tsx) son heredados pre-sesión — ninguno introducido por esta rama.

---

## 6. Archivos modificados (25)

```
docs/planning/epic-14-post-release-bugs.md           +230   (bug log actualizado con soluciones + tabla triage)
docs/planning/epic-14-qa-checklist.md                 +1    (mínimo — hay que cerrar §7/§8 en el review)
docs/planning/epic-14-bugs-handoff-2026-04-22.md    NEW    (handoff de la sesión del 22, histórico)
docs/planning/epic-14-bugs-handoff-2026-04-23.md    NEW    (este archivo — fuente de verdad actual)
docs/img_screenshot/qa-14.13/README.md              NEW    (evidence folder contract)
_bmad-output/implementation-artifacts/14-13-*.md    +220   (story file con Completion Notes)
_bmad-output/implementation-artifacts/sprint-status.yaml +2  (flip in-progress → review)

src/components/PremiumPaywall.tsx                   +145 −20  (context-aware refactor)
src/components/PremiumPaywall.test.tsx              +95 −5    (+9 nuevos casos wardrobe)
src/components/armario/CompletenessBadge.tsx        +10 −2    (transparent prop)
src/components/armario/IncompleteLooksSection.tsx   +1        (transparent=true en badge)
src/contexts/PremiumContext.tsx                     +20       (__dev_resetPremium)
src/i18n/__tests__/i18n.test.ts                     +1 −1     (key path update)
src/i18n/locales/en.json                            +20 −3    (paywall.favorites.* + paywall.wardrobe.*)
src/i18n/locales/es.json                            +20 −3    (idem)
src/screens/ColorHome.test.tsx                      +6 −12    (combo-count tests removed)
src/screens/ColorHome.tsx                           +3 −16    (counter removido + paywall context prop)
src/screens/Combinations.test.tsx                   +3 −10    (combo-count tests removed)
src/screens/Combinations.tsx                        +3 −20    (counter removido + paywall context prop)
src/screens/FavoritesList.tsx                       +3 −1     (paywall context prop)
src/screens/Settings.tsx                            +75 −12   (dev rows + paywall context + wardrobe preview)
src/screens/armario/ArmarioFichaWadaScreen.test.tsx −33      (badge 2/3 test removido)
src/screens/armario/ArmarioFichaWadaScreen.tsx      +3 −7     (badge removido + paywall context prop)
src/screens/armario/ArmarioPreviewScreen.test.tsx   +25 −7    (BUG-008 spinner cases + mock items)
src/screens/armario/ArmarioPreviewScreen.tsx        +45 −17   (spinner + wardrobe paywall props)
src/screens/armario/ArmarioSugerenciaArmoniaScreen.test.tsx −1  (s5 badge test removido)
src/screens/armario/ArmarioSugerenciaArmoniaScreen.tsx −20     (S5 badge removido + ctaText removido)
src/screens/armario/ArmarioTuLookScreen.tsx         +1        (transparent=true en badge)
src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.test.tsx +15 −4  (popTo assertions)
src/screens/unifiedCamera/UnifiedCameraPostSaveScreen.tsx    +7 −3    (popTo fix)
src/screens/unifiedCamera/UnifiedCameraResultScreen.test.tsx +15 −4   (popTo + mock items)
src/screens/unifiedCamera/UnifiedCameraResultScreen.tsx      +16 −7   (popTo fix + wardrobe paywall)
```

---

## 7. Próximos pasos tras el review

1. **Reviewer corre code-review adversarial** (fresh LLM context, diferente al que implementó). Spec: identificar cualquier regresión, código no-robust, patches mal aplicados, gotchas no cubiertos.
2. **Si review aprueba sin patches críticos** → merge `story/14-13-*` → `epic-14`. Story marca `review → done` en sprint-status.
3. **Alejandro ejecuta el checklist QA on-device final** (`docs/planning/epic-14-qa-checklist.md`) en iPhone 16 Pro — valida §1 preflight, §4 migración v1.3.0→v1.4.0, §6 a11y, §6.3 CI gates. §2/§3/§5 ya cubiertos por las sesiones de fixes.
4. **Con Outcome A firmado en §8 del checklist** → merge `epic-14` → `epic-1` vía `release-manager`.
5. **Apple Review v1.3.0** (actualmente en review) libera → Alejandro somete v1.4.0.

**Follow-ups v1.4.1 abiertos después del ship v1.4.0:**
- Story conjunta **BUG-009 + BUG-010** — "Visualizer usa prenda real como anchor al instanciarse desde cámara" (alta prioridad — eleva UX de funcional a notable).
- Story **BUG-005** — "Mis Looks layout En curso sección propia + filtros sticky" (medium).
- Story **BUG-006** — "Eliminar flash Mis Looks en cross-nav Visualizer → Ficha Wada" (medium).

---

## 8. Comandos rápidos para el reviewer

```bash
# 1. Posicionarse en la rama
git checkout story/14-13-epic14-ondevice-qa-happy-paths
git log --oneline -20  # ver los 16 commits de la sesión

# 2. Diff global desde la base
git diff epic-14..HEAD -- 'src/*'  # solo código fuente
git diff epic-14..HEAD -- 'docs/*' # solo docs

# 3. CI gates (baseline)
npx tsc --noEmit
pnpm lint     # 2 errores pre-existentes esperados
pnpm test     # 948/3/951

# 4. Explorar commit-by-commit si necesario
git show e39e899  # popTo fix (el "interesante")
git show 0b10f8f  # refactor context-aware paywall (el "grande")

# 5. On-device
pnpm start --clear
# Luego en simulador o device físico: Cmd+R
```

---

## 9. Notas finales para el reviewer

- **Un fix anulado documentado:** el primer intento de BUG-001 (`navigate + goBack`, commit `068877b`) rompió los CTAs de PostSave en device — tests unitarios pasaban pero el comportamiento real era incorrecto por gotcha de focused navigator en RN7. Fix real en `e39e899` con `popTo`. Si encuentras referencia a `goBack` en algún callsite de paywall o cross-nav, es residual — deberían haber sido reemplazadas todas. Grep `rootNav?.goBack()` y si aparece en callsites wardrobe/favorites cross-nav, flag como patch requerido.
- **i18n — keys huérfanas documentadas:** `paywall.lockedLabel` sigue al root aunque solo se usa en context favorites. Es intencional; dejar al root habilita añadir un 3er context (ej. promo genérica) que lo reutilice. No mover a sub-objeto sin plan de nuevo context.
- **CompletenessBadge.transparent:** solo usado actualmente en 2 callsites (IncompleteLooksSection + ArmarioTuLookScreen). Si el reviewer observa que S5 Sugerencia también podría beneficiarse de la prop si el badge se restaurara en el futuro, anotar en deferred.
- **Tests borrados (3) tienen justificación:** cada uno removido porque la feature que testeaba YA NO RENDERIZA (no es cobertura perdida, es cobertura estéril). Justificación por-test en bug log `epic-14-post-release-bugs.md` sección de cada BUG.
