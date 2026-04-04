import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface WadaHeaderProps {
	nameJp: string;
	nameEn?: string;
	colorCount: number;
}

export function WadaHeader({ nameJp, nameEn, colorCount }: WadaHeaderProps) {
	const { t } = useTranslation();
	return (
		<View
			className="items-center mb-3"
			accessibilityLabel={
				nameEn
					? t("wadaHeader.labelFull", { nameJp, nameEn, count: colorCount })
					: t("wadaHeader.labelJpOnly", { nameJp, count: colorCount })
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
