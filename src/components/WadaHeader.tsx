import { Text, View } from "react-native";

export interface WadaHeaderProps {
	nameJp: string;
	colorCount: number;
}

export function WadaHeader({ nameJp, colorCount }: WadaHeaderProps) {
	return (
		<View
			style={{ alignItems: "center", gap: 2, marginBottom: 4 }}
			accessibilityLabel={`${nameJp}, ${colorCount} color Wada combination`}
		>
			<Text
				style={{
					fontSize: 20,
					fontFamily: "NotoSerifJP_500Medium",
					color: "#2c2c2c",
					letterSpacing: 2,
				}}
			>
				{nameJp}
			</Text>
			<Text style={{ fontSize: 10, color: "#a09080", letterSpacing: 1 }}>
				{colorCount} colors · Sanzo Wada
			</Text>
		</View>
	);
}
