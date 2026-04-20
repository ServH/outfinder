// Global Jest mock for @react-native-async-storage/async-storage.
//
// Required because Story 13.4b makes FavoriteButton depend transitively on
// wardrobeStore -> AsyncStorage. Legacy test suites that render FavoriteButton
// (ComboCard, PaletteStrip, etc.) did not historically mock AsyncStorage and
// would now fail at module-load time without this shim.
module.exports = require("@react-native-async-storage/async-storage/jest/async-storage-mock");
