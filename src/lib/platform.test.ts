describe("isIOS17OrNewer / useIsIOS17OrNewer", () => {
	beforeEach(() => {
		jest.resetModules();
	});

	function mockPlatform(os: string, version: string | number) {
		jest.doMock("react-native", () => ({
			Platform: { OS: os, Version: version },
		}));
	}

	it("returns true when iOS 17.0 (numeric)", () => {
		mockPlatform("ios", 17);
		const { isIOS17OrNewer, useIsIOS17OrNewer } =
			require("./platform") as typeof import("./platform");
		expect(isIOS17OrNewer()).toBe(true);
		expect(useIsIOS17OrNewer()).toBe(true);
	});

	it("returns false when iOS < 17", () => {
		mockPlatform("ios", "16.4");
		const { isIOS17OrNewer } =
			require("./platform") as typeof import("./platform");
		expect(isIOS17OrNewer()).toBe(false);
	});

	it("returns false on Android regardless of Version", () => {
		mockPlatform("android", 34);
		const { isIOS17OrNewer } =
			require("./platform") as typeof import("./platform");
		expect(isIOS17OrNewer()).toBe(false);
	});

	it("handles both string and number shapes of Platform.Version", () => {
		mockPlatform("ios", "18.1");
		const mod1 = require("./platform") as typeof import("./platform");
		expect(mod1.isIOS17OrNewer()).toBe(true);

		jest.resetModules();
		mockPlatform("ios", 18);
		const mod2 = require("./platform") as typeof import("./platform");
		expect(mod2.isIOS17OrNewer()).toBe(true);
	});
});
