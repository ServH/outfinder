import { Dimensions, useWindowDimensions } from "react-native";

const IPAD_BREAKPOINT = 768;
const IPAD_LARGE_BREAKPOINT = 1024;

/** Static check — use at module scope or outside React */
export function isIPad(): boolean {
	return Dimensions.get("window").width >= IPAD_BREAKPOINT;
}

/** Reactive hook — use inside React components */
export function useIsIPad(): boolean {
	const { width } = useWindowDimensions();
	return width >= IPAD_BREAKPOINT;
}

/**
 * Returns the number of columns for the Favorites grid.
 * AC#4: large iPads (>= 1024pt) use 3 columns; all others use 2.
 * Intentionally a different threshold than useIsIPad (768pt).
 */
export function useFavoritesNumCols(): number {
	const { width } = useWindowDimensions();
	return width >= IPAD_LARGE_BREAKPOINT ? 3 : 2;
}
