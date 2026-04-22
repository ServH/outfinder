import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { hapticLight } from "@/lib/haptics";
import { wadaTokens } from "@/styles/theme";

export interface NewLookCtaCardProps {
	onPress: () => void;
}

export function NewLookCtaCard(props: NewLookCtaCardProps) {
	const { t } = useTranslation();

	function handlePress() {
		hapticLight();
		props.onPress();
	}

	return (
		<Pressable
			testID="mis-looks-new-look-cta"
			accessibilityRole="button"
			accessibilityLabel={t("favorites.newLookCta.a11yLabel")}
			accessibilityHint={t("favorites.newLookCta.a11yHint")}
			onPress={handlePress}
			className="mx-4 mt-3 mb-2 flex-row items-center bg-elevated rounded-xl"
			style={{
				minHeight: 48,
				paddingHorizontal: 16,
				paddingVertical: 16,
				borderWidth: 1,
				borderColor: wadaTokens.hairline,
			}}
		>
			<SymbolView
				name="sparkles"
				size={22}
				tintColor={wadaTokens.wadaMuted}
				style={{ marginRight: 12 }}
			/>
			<View style={{ flex: 1 }}>
				<Text
					style={{
						fontFamily: "NotoSerifJP_500Medium",
						fontSize: 16,
						color: wadaTokens.textPrimary,
						marginBottom: 2,
					}}
				>
					{t("favorites.newLookCta.title")}
				</Text>
				<Text
					style={{
						fontFamily: "Inter_400Regular",
						fontSize: 13,
						color: wadaTokens.textSecondary,
					}}
				>
					{t("favorites.newLookCta.subtitle")}
				</Text>
			</View>
			<SymbolView
				name="chevron.right"
				size={14}
				tintColor={wadaTokens.textSecondary}
				style={{ marginLeft: 8 }}
			/>
		</Pressable>
	);
}
