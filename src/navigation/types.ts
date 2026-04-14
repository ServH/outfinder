export type ColorsStackParamList = {
	ColorHome: undefined;
	BrowseAllColors: undefined;
	CaptureScreen: undefined;
	Combinations: { colorId: string };
	OutfitVisualizer: { combinationId: string };
};

export type FavoritesStackParamList = {
	FavoritesList: undefined;
	OutfitVisualizer: { combinationId: string };
};

export type SettingsStackParamList = {
	Settings: undefined;
};

export type TabParamList = {
	ColorsTab: undefined;
	FavoritesTab: undefined;
	SettingsTab: undefined;
};
