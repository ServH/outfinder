import type { NavigatorScreenParams } from "@react-navigation/native";

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
	ArmarioZeroState: { combinationId: string };
	ArmarioFichaWada: { combinationId: string };
	ArmarioPicker: { combinationId: string; colorIndex: number };
	ArmarioTuLook: { combinationId: string };
};

export type SettingsStackParamList = {
	Settings: undefined;
};

export type TabParamList = {
	ColorsTab: { screen: keyof ColorsStackParamList } | undefined;
	FavoritesTab: undefined;
	SettingsTab: undefined;
};

export type ArmarioStackParamList = {
	ArmarioCapture: { onCutoutSaved?: (id: string) => void } | undefined;
	ArmarioPreview: {
		cutoutUri: string;
		sourceUri: string;
		onCutoutSaved?: (id: string) => void;
	};
};

export type RootStackParamList = {
	Main: undefined;
	ArmarioRoot: NavigatorScreenParams<ArmarioStackParamList> | undefined;
};
