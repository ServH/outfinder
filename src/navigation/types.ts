export type ColorsStackParamList = {
	ColorHome: undefined;
	BrowseAllColors: undefined;
	CaptureScreen: undefined;
	Combinations: { colorId: string; capturedHex?: string };
	OutfitVisualizer: { combinationId: string; capturedHex?: string };
};

export type FavoritesStackParamList = {
	FavoritesList: undefined;
	OutfitVisualizer: { combinationId: string; capturedHex?: string };
};

export type SettingsStackParamList = {
	Settings: undefined;
};

export type TabParamList = {
	ColorsTab: undefined;
	FavoritesTab: undefined;
	SettingsTab: undefined;
};
