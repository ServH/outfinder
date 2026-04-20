import { Platform } from "react-native";

/**
 * True when the runtime is iOS 17 or newer. Used to gate Armario Virtual
 * entry points (capture, zero-state, ficha) — the Vision API
 * `VNGenerateForegroundInstanceMaskRequest` is iOS 17+ only.
 */
export function isIOS17OrNewer(): boolean {
	if (Platform.OS !== "ios") return false;
	const v = Platform.Version;
	const n = typeof v === "string" ? parseInt(v, 10) : v;
	return Number.isFinite(n) && (n as number) >= 17;
}

/**
 * Hook wrapper around `isIOS17OrNewer`. `Platform.Version` does not change
 * during a session, so this is a pure read — the hook exists for call-site
 * readability and to preserve a stable surface if future work ever needs
 * reactive device-capability state.
 */
export function useIsIOS17OrNewer(): boolean {
	return isIOS17OrNewer();
}
