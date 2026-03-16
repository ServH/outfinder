export type ColorsStackParamList = {
	ColorHome: undefined;
	Combinations: { colorId: string };
	OutfitVisualizer: { combinationId: string };
};

export type FavoritesStackParamList = {
	FavoritesList: undefined;
	Combinations: { colorId: string };
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
