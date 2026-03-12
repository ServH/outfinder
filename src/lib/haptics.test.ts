import * as Haptics from "expo-haptics";

import { hapticLight, hapticMedium, hapticRigid } from "./haptics";

jest.mock("expo-haptics");

const mockedHaptics = jest.mocked(Haptics);

describe("haptics", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("hapticLight", () => {
		it("fires Light impact feedback", () => {
			hapticLight();
			expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(
				Haptics.ImpactFeedbackStyle.Light,
			);
		});

		it("silently catches errors", () => {
			mockedHaptics.impactAsync.mockImplementation(() => {
				throw new Error("Haptics unavailable");
			});
			expect(() => hapticLight()).not.toThrow();
		});
	});

	describe("hapticMedium", () => {
		it("fires Medium impact feedback", () => {
			hapticMedium();
			expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(
				Haptics.ImpactFeedbackStyle.Medium,
			);
		});

		it("silently catches errors", () => {
			mockedHaptics.impactAsync.mockImplementation(() => {
				throw new Error("Haptics unavailable");
			});
			expect(() => hapticMedium()).not.toThrow();
		});
	});

	describe("hapticRigid", () => {
		it("fires Rigid impact feedback", () => {
			hapticRigid();
			expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(
				Haptics.ImpactFeedbackStyle.Rigid,
			);
		});

		it("silently catches errors", () => {
			mockedHaptics.impactAsync.mockImplementation(() => {
				throw new Error("Haptics unavailable");
			});
			expect(() => hapticRigid()).not.toThrow();
		});
	});
});
