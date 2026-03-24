import { Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface WadaHeaderProps {
	nameJp: string;
	colorCount: number;
}

export function WadaHeader({ nameJp, colorCount }: WadaHeaderProps) {
	return (
		<View
			className="items-center mb-3"
			accessibilityLabel={`${nameJp}, ${colorCount} color Wada combination`}
		>
			<Text
				className="font-serif-jp-medium text-[20px] tracking-[2px]"
				allowFontScaling
				style={{ color: wadaTokens.textPrimary }}
			>
				{nameJp}
			</Text>
		</View>
	);
}
