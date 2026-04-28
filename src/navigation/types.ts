import type { NavigatorScreenParams } from "@react-navigation/native";
import type { MatchResult } from "@/lib/colorTypes";
import type { WardrobeCategory } from "@/lib/wardrobeTypes";

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

// Unified camera flow (Epic 14). `Capture` requires no params (camera-only
// entry). `Result` carries the Swift-pipeline output plus the original photo
// URI (`sourceUri`) which `saveCutoutAsWardrobeItem` needs as the re-encode
// source. `PostSave` carries the save outcome for the "¿Ahora qué?" screen.
export type UnifiedCameraStackParamList = {
	Capture: undefined;
	Result: {
		cutoutUri: string;
		dominantHex: string;
		wadaMatch: MatchResult;
		sourceUri: string;
	};
	PostSave: {
		wadaColorId: string;
		capturedHex: string;
		categoryKey: WardrobeCategory;
	};
};

export type RootStackParamList = {
	Main: undefined;
	ArmarioRoot: NavigatorScreenParams<ArmarioStackParamList> | undefined;
	UnifiedCameraRoot:
		| NavigatorScreenParams<UnifiedCameraStackParamList>
		| undefined;
};
