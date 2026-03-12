import * as Haptics from "expo-haptics";

export function hapticLight(): void {
	try {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
	} catch {
		// Silently fail if haptics unavailable
	}
}

export function hapticMedium(): void {
	try {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
	} catch {
		// Silently fail if haptics unavailable
	}
}

export function hapticRigid(): void {
	try {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
	} catch {
		// Silently fail if haptics unavailable
	}
}
