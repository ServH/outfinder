import { type RouteProp, useRoute } from "@react-navigation/native";
import { Text, View } from "react-native";
import type { UnifiedCameraStackParamList } from "@/navigation/types";

type UnifiedCameraResultScreenProps = Record<string, never>;

type ResultRoute = RouteProp<UnifiedCameraStackParamList, "Result">;

// Diagnostic placeholder — Story 14.4 replaces this with the real UX-DR1
// Result UI (cutout + Wada name stack + combinations count + CTAs). Keeping
// the typed route-params here so 14.4 can drop the visuals onto a screen
// whose data contract is already proven.
export function UnifiedCameraResultScreen(
	_props: UnifiedCameraResultScreenProps,
) {
	const route = useRoute<ResultRoute>();
	const params = route.params;

	return (
		<View
			testID="unified-camera-result-placeholder"
			className="flex-1 items-center justify-center bg-paper px-6"
		>
			<Text className="text-center font-sans text-base text-primary">
				Result (coming in 14.4)
			</Text>
			{params ? (
				<View className="mt-4 items-center">
					<Text
						testID="unified-camera-result-dominant-hex"
						className="font-mono text-sm text-primary"
					>
						{`dominantHex = ${params.dominantHex}`}
					</Text>
					<Text
						testID="unified-camera-result-wada-match-type"
						className="font-mono text-sm text-primary"
					>
						{`wadaMatch.type = ${params.wadaMatch.type}`}
					</Text>
				</View>
			) : null}
		</View>
	);
}
