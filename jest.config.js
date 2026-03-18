module.exports = {
	preset: "jest-expo",
	testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
	moduleNameMapper: {
		"^@/assets/(.*)": "<rootDir>/assets/$1",
		"\\.css$": "<rootDir>/__mocks__/styleMock.js",
	},
};
