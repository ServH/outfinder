import { getSuggestionCopy } from "./getSuggestionCopy";

describe("getSuggestionCopy", () => {
	it("(0, 3) → suggestionCopyMain", () => {
		expect(getSuggestionCopy(0, 3)).toBe("armario.s5.suggestionCopyMain");
	});

	it("(2, 3) → suggestionCopyAccessory (last slot)", () => {
		expect(getSuggestionCopy(2, 3)).toBe("armario.s5.suggestionCopyAccessory");
	});

	it("(1, 3) → suggestionCopyLayer (middle slot)", () => {
		expect(getSuggestionCopy(1, 3)).toBe("armario.s5.suggestionCopyLayer");
	});

	it("(0, 4) → suggestionCopyMain", () => {
		expect(getSuggestionCopy(0, 4)).toBe("armario.s5.suggestionCopyMain");
	});

	it("(3, 4) → suggestionCopyAccessory (last slot of 4)", () => {
		expect(getSuggestionCopy(3, 4)).toBe("armario.s5.suggestionCopyAccessory");
	});

	it("(1, 4) AND (2, 4) → suggestionCopyLayer (middle slots of 4)", () => {
		expect(getSuggestionCopy(1, 4)).toBe("armario.s5.suggestionCopyLayer");
		expect(getSuggestionCopy(2, 4)).toBe("armario.s5.suggestionCopyLayer");
	});

	it("invalid inputs fall back to suggestionCopyMain with a __DEV__ warn", () => {
		const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
		expect(getSuggestionCopy(-1, 3)).toBe("armario.s5.suggestionCopyMain");
		expect(getSuggestionCopy(3, 3)).toBe("armario.s5.suggestionCopyMain");
		expect(getSuggestionCopy(0, 0)).toBe("armario.s5.suggestionCopyMain");
		expect(getSuggestionCopy(Number.NaN, 3)).toBe(
			"armario.s5.suggestionCopyMain",
		);
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});
