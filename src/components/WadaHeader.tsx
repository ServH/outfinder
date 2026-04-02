import { Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface WadaHeaderProps {
	nameJp: string;
	nameEn?: string;
	colorCount: number;
}

export function WadaHeader({ nameJp, nameEn, colorCount }: WadaHeaderProps) {
	return (
		<View
			className="items-center mb-3"
			accessibilityLabel={
				nameEn
					? `${nameJp}, ${nameEn}, ${colorCount} color Wada combination`
					: `${nameJp}, ${colorCount} color Wada combination`
			}
		>
			<Text
				className="font-serif-jp-medium text-[20px] tracking-[2px]"
				allowFontScaling
				style={{ color: wadaTokens.textPrimary }}
			>
				{nameJp}
			</Text>
			{nameEn && (
				<Text
					className="font-sans-medium text-[14px]"
					allowFontScaling
					style={{ color: wadaTokens.textSecondary }}
				>
					{nameEn}
				</Text>
			)}
		</View>
	);
}
