import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

// biome-ignore lint/suspicious/noEmptyInterface: CLAUDE.md requires `interface {Component}Props`; strip has no configurable props in v1
export interface MisLooksLimitStripProps {}

export function MisLooksLimitStrip(_props: MisLooksLimitStripProps) {
	const { t } = useTranslation();
	return (
		<View
			testID="mislooks-limit-strip"
			accessibilityRole="alert"
			accessibilityLabel={t("armario.misLooksLimit.stripA11y")}
			className="items-center justify-center"
			style={{
				marginTop: 12,
				marginHorizontal: 20,
				paddingVertical: 10,
				paddingHorizontal: 14,
				borderRadius: 10,
				backgroundColor: wadaTokens.bgElevated,
				borderWidth: 1,
				borderColor: wadaTokens.hairline,
			}}
		>
			<Text
				style={{
					fontFamily: "Inter_400Regular",
					fontSize: 13,
					color: wadaTokens.textSecondary,
					textAlign: "center",
					lineHeight: 18,
				}}
			>
				{t("armario.misLooksLimit.strip")}
			</Text>
		</View>
	);
}
