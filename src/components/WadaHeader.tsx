import { Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface WadaHeaderProps {
	nameJp: string;
	colorCount: number;
}

export function WadaHeader({ nameJp, colorCount }: WadaHeaderProps) {
	return (
		<View
			style={{ alignItems: "center", marginBottom: 12 }}
			accessibilityLabel={`${nameJp}, ${colorCount} color Wada combination`}
		>
			<Text
				style={{
					fontSize: 20,
					fontFamily: "NotoSerifJP_500Medium",
					color: wadaTokens.textPrimary,
					letterSpacing: 2,
				}}
			>
				{nameJp}
			</Text>
		</View>
	);
}
