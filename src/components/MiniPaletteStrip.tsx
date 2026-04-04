import { useTranslation } from "react-i18next";
import { Text, useWindowDimensions, View } from "react-native";
import { useIsIPad } from "@/lib/device";
import { wadaTokens } from "@/styles/theme";

export interface MiniPaletteStripProps {
	colors: Array<{ hex: string; nameEn: string }>;
}

export function MiniPaletteStrip({ colors }: MiniPaletteStripProps) {
	const { t } = useTranslation();
	const { width: screenW } = useWindowDimensions();
	const isTablet = useIsIPad();
	const stripHeight = isTablet ? 24 : 18;
	const labelFontSize = isTablet ? 11 : 9;
	return (
		<View className="items-center gap-[6px]">
			<View
				className="flex-row overflow-hidden rounded-[6px]"
				style={{ width: screenW * 0.6, height: stripHeight }}
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
						className="flex-1 text-center"
						allowFontScaling
						maxFontSizeMultiplier={1.5}
						style={{ color: wadaTokens.wadaMuted, fontSize: labelFontSize }}
					>
						{c.nameEn}
					</Text>
				))}
			</View>
		</View>
	);
}
