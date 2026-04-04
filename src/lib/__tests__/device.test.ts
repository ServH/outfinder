import { Dimensions } from "react-native";
import { isIPad, useFavoritesNumCols } from "../device";

describe("isIPad", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("returns true when width is 810 (iPad Air portrait)", () => {
		jest
			.spyOn(Dimensions, "get")
			.mockReturnValue({ width: 810, height: 1080, scale: 2, fontScale: 1 });
		expect(isIPad()).toBe(true);
	});

	it("returns false when width is 375 (iPhone SE portrait)", () => {
		jest
			.spyOn(Dimensions, "get")
			.mockReturnValue({ width: 375, height: 667, scale: 2, fontScale: 1 });
		expect(isIPad()).toBe(false);
	});

	it("returns true at exactly 768 (boundary)", () => {
		jest
			.spyOn(Dimensions, "get")
			.mockReturnValue({ width: 768, height: 1024, scale: 2, fontScale: 1 });
		expect(isIPad()).toBe(true);
	});

	it("returns false at 767 (just below boundary)", () => {
		jest
			.spyOn(Dimensions, "get")
			.mockReturnValue({ width: 767, height: 1024, scale: 2, fontScale: 1 });
		expect(isIPad()).toBe(false);
	});

	it("returns false when width is 430 (iPhone 16 Pro Max portrait)", () => {
		jest
			.spyOn(Dimensions, "get")
			.mockReturnValue({ width: 430, height: 932, scale: 3, fontScale: 1 });
		expect(isIPad()).toBe(false);
	});

	it("returns true when width is 1024 (iPad Pro 13 portrait)", () => {
		jest
			.spyOn(Dimensions, "get")
			.mockReturnValue({ width: 1024, height: 1366, scale: 2, fontScale: 1 });
		expect(isIPad()).toBe(true);
	});
});

describe("useFavoritesNumCols", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("returns 3 at exactly 1024pt (iPad Pro 13)", () => {
		jest
			.spyOn(require("react-native"), "useWindowDimensions")
			.mockReturnValue({ width: 1024, height: 1366, scale: 2, fontScale: 1 });
		expect(useFavoritesNumCols()).toBe(3);
	});

	it("returns 2 at 1023pt (just below large iPad threshold)", () => {
		jest
			.spyOn(require("react-native"), "useWindowDimensions")
			.mockReturnValue({ width: 1023, height: 1366, scale: 2, fontScale: 1 });
		expect(useFavoritesNumCols()).toBe(2);
	});

	it("returns 2 at 820pt (iPad Air portrait)", () => {
		jest
			.spyOn(require("react-native"), "useWindowDimensions")
			.mockReturnValue({ width: 820, height: 1180, scale: 2, fontScale: 1 });
		expect(useFavoritesNumCols()).toBe(2);
	});

	it("returns 2 at 375pt (iPhone SE)", () => {
		jest
			.spyOn(require("react-native"), "useWindowDimensions")
			.mockReturnValue({ width: 375, height: 667, scale: 2, fontScale: 1 });
		expect(useFavoritesNumCols()).toBe(2);
	});
});
