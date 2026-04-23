import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { CompletenessBadge } from "@/components/armario/CompletenessBadge";
import type { Combination } from "@/data/types";
import type { CombinationAssignment } from "@/lib/wardrobeTypes";
import { wadaTokens } from "@/styles/theme";

export interface IncompleteLooksSectionProps {
	incompleteLooks: Combination[];
	assignments: CombinationAssignment[];
	onTilePress: (combinationId: string) => void;
}

export function IncompleteLooksSection(props: IncompleteLooksSectionProps) {
	const { incompleteLooks, assignments, onTilePress } = props;
	const { t } = useTranslation();

	const assignedCountByCombination = useMemo(() => {
		const counts = new Map<string, number>();
		for (const a of assignments) {
			counts.set(a.combinationId, (counts.get(a.combinationId) ?? 0) + 1);
		}
		return counts;
	}, [assignments]);

	if (incompleteLooks.length === 0) {
		return null;
	}

	return (
		<View
			testID="incomplete-looks-section"
			accessibilityRole="none"
			style={{ marginTop: 16, marginBottom: 8 }}
		>
			<View
				accessibilityRole="header"
				accessibilityLabel={t("favorites.incompleteSection.a11yLabel")}
				className="px-4 mb-3"
			>
				<Text
					style={{
						fontFamily: "Inter_500Medium",
						fontSize: 13,
						color: wadaTokens.textSecondary,
					}}
				>
					{t("favorites.incompleteSection.title")}
				</Text>
			</View>
			<FlatList
				horizontal
				showsHorizontalScrollIndicator={false}
				testID="incomplete-looks-list"
				data={incompleteLooks}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
				renderItem={({ item }) => {
					const total = item.colors.length;
					const assigned = assignedCountByCombination.get(item.id) ?? 0;
					const remaining = total - assigned;
					const a11yLabel = t("favorites.incompleteTile.a11yLabel", {
						name: item.nameEn,
						assigned,
						total,
						remaining,
					});
					const a11yHint = t("favorites.incompleteTile.a11yHint");
					return (
						<Pressable
							testID={`incomplete-tile-${item.id}`}
							accessibilityRole="button"
							accessibilityLabel={a11yLabel}
							accessibilityHint={a11yHint}
							onPress={() => onTilePress(item.id)}
							style={{
								width: 160,
								height: 100,
								backgroundColor: wadaTokens.bgElevated,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: wadaTokens.hairline,
								padding: 12,
								justifyContent: "space-between",
							}}
						>
							<View>
								<Text
									numberOfLines={1}
									style={{
										fontFamily: "NotoSerifJP_500Medium",
										fontSize: 14,
										color: wadaTokens.textPrimary,
									}}
								>
									{item.nameJp}
								</Text>
								<Text
									numberOfLines={1}
									style={{
										fontFamily: "Inter_400Regular",
										fontSize: 11,
										color: wadaTokens.textSecondary,
										marginTop: 2,
									}}
								>
									{item.nameEn}
								</Text>
							</View>
							<View style={{ alignItems: "flex-start" }}>
								<CompletenessBadge
									assigned={assigned}
									total={total}
									testID={`incomplete-tile-${item.id}-badge`}
								/>
							</View>
						</Pressable>
					);
				}}
			/>
		</View>
	);
}
