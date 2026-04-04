// Global mock for expo-localization — defaults to English locale.
// Individual tests can override via:
//   jest.mocked(getLocales).mockReturnValue([{ languageCode: 'es' }])
module.exports = {
	getLocales: jest.fn(() => [{ languageCode: "en" }]),
};
