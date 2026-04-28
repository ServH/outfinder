import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

interface CoachMarkState {
	shouldShow: boolean;
	markSeen: () => Promise<void>;
}

// Reads + writes a per-coach-mark "seen" flag in AsyncStorage. Caller passes
// the FULL namespaced key (e.g. "@outfinder/coachmark:visualizer-slots-firstuse")
// so call sites are greppable. Fail-closed: if AsyncStorage cannot prove the
// user has NOT seen it, we do NOT show — protects v1.4.0 from re-prompting
// existing users on a transient read failure.
export function useCoachMark(key: string): CoachMarkState {
	const [shouldShow, setShouldShow] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function read(): Promise<void> {
			try {
				const stored = await AsyncStorage.getItem(key);
				if (!cancelled) {
					setShouldShow(stored !== "true");
				}
			} catch (error) {
				console.warn(`[useCoachMark] Failed to read ${key}:`, error);
			}
		}

		read();

		return () => {
			cancelled = true;
		};
	}, [key]);

	const markSeen = useCallback(async () => {
		setShouldShow(false);
		try {
			await AsyncStorage.setItem(key, "true");
		} catch (error) {
			console.warn(`[useCoachMark] Failed to persist ${key}:`, error);
		}
	}, [key]);

	return { shouldShow, markSeen };
}
