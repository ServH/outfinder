// Single source of truth for coach-mark AsyncStorage keys (Story 15.1 foundation).
// All keys live under `@outfinder/coachmark:*` per Epic 15 NFR7. Consumers (Story
// 15.3 + 15.4) import from here rather than re-typing the string at the call site,
// and the dev "Reset coach marks" row in Settings iterates this list to clear all
// flags in one tap.
export const COACH_MARK_KEYS = {
	cameraFabFirstUse: "@outfinder/coachmark:camera-fab-firstuse",
	visualizerSlotsFirstUse: "@outfinder/coachmark:visualizer-slots-firstuse",
} as const;

export const ALL_COACH_MARK_KEYS = Object.values(COACH_MARK_KEYS);
