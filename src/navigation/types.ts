import type { NavigatorScreenParams } from "@react-navigation/native";

export type ColorsStackParamList = {
	ColorHome: undefined;
	BrowseAllColors: undefined;
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
	ArmarioSugerenciaArmonia: { combinationId: string };
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

// Unified camera flow (Epic 14 — Story 14.3a navigation shell).
// Route params are intentionally `undefined` placeholders; Story 14.3b tightens
// `Result` to `{ cutoutUri, dominantHex, wadaMatch }` and Story 14.5 adds the
// post-save "¿Ahora qué?" params on `PostSave`.
export type UnifiedCameraStackParamList = {
	Capture: undefined;
	Result: undefined;
	PostSave: undefined;
};

export type RootStackParamList = {
	Main: undefined;
	ArmarioRoot: NavigatorScreenParams<ArmarioStackParamList> | undefined;
	UnifiedCameraRoot:
		| NavigatorScreenParams<UnifiedCameraStackParamList>
		| undefined;
};
