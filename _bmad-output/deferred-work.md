# Deferred Work

## Deferred from: code review of 12-1-color-math-foundation (2026-04-14)

- D1: `WADA_COLORS_WITH_LAB` module-load risk if `getAllColors()` throws — pre-existing architectural pattern across the app; consider lazy initialization or error boundary in a future hardening story
- D2: `WadaMatch.color` carries hidden `lab` field at runtime (WadaColorWithLab structural type leak) — no functional impact in current stories; consider stripping the field in a future type-hygiene pass
- D3: `rgbToLinear` / `linearRgbToXyz` accept out-of-range values via direct API call — negligible risk if P1 (hexToRgb guard) is applied; revisit if these functions are ever called outside the hexToLab pipeline
- D4: "neon green out-of-coverage" test in `colorMatch.test.ts` is a fragile dataset assertion — correct today but would break if palette ever gains a neon green entry; refactor to use mock match list instead of real data

## Deferred from: code review of 12-2-camera-entry-point-capture-screen (2026-04-14)

- D5: `CaptureScreen` — WB temperature state not wired to `CameraView`; `expo-camera` 55 doesn't support native WB control on device; `wbTemperature` is a session-local value intended for Story 12.3 analysis pipeline
- D6: `CaptureScreen` — `console.log("[CaptureScreen] photo URI:", photo.uri)` lacks `__DEV__` guard; explicit placeholder per AC #6 spec; replaced by Story 12.3 AnalysisOverlay wiring
- D7: `CaptureScreen` — silent null ref on `cameraRef.current?.takePictureAsync`; optional chaining masks null; placeholder behavior until Story 12.3 replaces entire takePicture flow
- D8: `CaptureScreen` — no AppState/useFocusEffect handler to pause camera when app goes to background; camera lifecycle managed by RN unmount; UX polish candidate
- D9: `CaptureScreen.test.tsx` — tests hardcode English translation strings; established project pattern; stable i18n keys
- D10: `CaptureScreen` — permission-loading state shows blank black screen with no spinner or text; near-instantaneous in practice; UX polish candidate
- D11: `ColorsStack.tsx` — `animation: "fade"` default stack option may visually conflict with `fullScreenModal`; fullScreenModal overrides animation on iOS natively; no functional impact confirmed
- D12: `CaptureScreen` — no explicit camera teardown on `goBack()`; expo-camera CameraView tears down automatically on unmount; React Navigation ensures unmount

## Deferred from: code review of 12-4-result-sheets-navigation (2026-04-14)

- D16: `isLightColor` does not normalise hex strings shorter than 6 digits (e.g. `#RGB`, `#RRGGBBAA`) — pre-existing in `src/lib/color.ts`; both sheets call it on Wada dataset hex values which are well-formed, but utility is fragile if called with other inputs
- D17: `top3` in `confirm` matchState may contain 1–2 items if Wada dataset is very sparse — `ColorMatchSheet` renders gracefully, but title "Which is closest?" implies 3 choices; revisit if dataset ever shrinks or a test dataset with <3 colors is used

## Deferred from: code review of 12-3-native-wb-module-analysis-pipeline (2026-04-14)

- D13: `WhiteBalanceModule.swift` — temp JPEG files written to `FileManager.default.temporaryDirectory` are never explicitly deleted; iOS GC handles periodically; one photo per session makes disk impact negligible
- D14: `modules/white-balance/src/index.ts` — `requireNativeModule("WhiteBalance")` called at module load time; will crash if native module not linked; guarded by prebuild requirement in story task 1.5
- D15: `AnalysisOverlay.tsx` — `msgIndex` not reset to 0 when `visible` goes false; overlay resumes from last message index on re-show; spec does not require starting from message 0
