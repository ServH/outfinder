import { useTranslation } from "react-i18next";
import { Text, useWindowDimensions, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface MiniPaletteStripProps {
	colors: Array<{ hex: string; nameEn: string }>;
}

export function MiniPaletteStrip({ colors }: MiniPaletteStripProps) {
	const { t } = useTranslation();
	const { width: screenW } = useWindowDimensions();
	return (
		<View className="items-center gap-[6px]">
			<View
				className="flex-row overflow-hidden rounded-[6px] h-[18px]"
				style={{ width: screenW * 0.6 }}
				accessibilityLabel={t("miniPalette.label")}
			>
				{colors.map((c) => (
					<View
						key={c.nameEn}
						className="flex-1"
						style={{ backgroundColor: c.hex }}
						accessibilityLabel={c.nameEn}
					/>
				))}
			</View>
			<View className="flex-row" style={{ width: screenW * 0.6 }}>
				{colors.map((c) => (
					<Text
						key={c.nameEn}
						className="flex-1 text-[9px] text-center"
						allowFontScaling
						maxFontSizeMultiplier={1.5}
						style={{ color: wadaTokens.wadaMuted }}
					>
						{c.nameEn}
					</Text>
				))}
			</View>
		</View>
	);
}
