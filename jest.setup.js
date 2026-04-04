// Initialize i18n before all tests so useTranslation() works with English strings by default.
// expo-localization is mocked in __mocks__/expo-localization.js to return [{ languageCode: "en" }].
require("./src/i18n");
