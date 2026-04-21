export type SuggestionCopyKey =
	| "armario.s5.suggestionCopyAccessory"
	| "armario.s5.suggestionCopyMain"
	| "armario.s5.suggestionCopyLayer";

export function getSuggestionCopy(
	colorIndex: number,
	totalColors: number,
): SuggestionCopyKey {
	if (
		totalColors <= 0 ||
		colorIndex < 0 ||
		colorIndex >= totalColors ||
		!Number.isFinite(colorIndex) ||
		!Number.isFinite(totalColors)
	) {
		if (__DEV__) {
			console.warn(
				`[getSuggestionCopy] invalid input colorIndex=${colorIndex} totalColors=${totalColors} — falling back to suggestionCopyMain`,
			);
		}
		return "armario.s5.suggestionCopyMain";
	}
	if (colorIndex === totalColors - 1) {
		return "armario.s5.suggestionCopyAccessory";
	}
	if (colorIndex === 0) {
		return "armario.s5.suggestionCopyMain";
	}
	return "armario.s5.suggestionCopyLayer";
}
