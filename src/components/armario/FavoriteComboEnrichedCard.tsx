import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ComboCard } from "@/components/ComboCard";
import type { Combination } from "@/data/types";
import { useMisLooksStore } from "@/stores/misLooksStore";
import { WardrobeItemThumb } from "./WardrobeItemThumb";

export interface FavoriteComboEnrichedCardProps {
	combination: Combination;
	isFavorite: boolean;
	onToggleFavorite: () => void;
	onPress: (combinationId: string) => void;
	onPremiumGate?: () => void;
	cardWidth: number;
}

type Bucket = "complete" | "partial" | "empty";

const THUMB_SIZE = 32;

function resolveBucket(assigned: number, total: number): Bucket {
	if (total <= 0 || assigned === 0) return "empty";
	if (assigned >= total) return "complete";
	return "partial";
}

function ctaKeyFor(bucket: Bucket): string {
	switch (bucket) {
		case "complete":
			return "armario.favorites.ctaComplete";
		case "partial":
			return "armario.favorites.ctaPartial";
		case "empty":
			return "armario.favorites.ctaEmpty";
	}
}

export function FavoriteComboEnrichedCard({
	combination,
	isFavorite,
	onToggleFavorite,
	onPress,
	onPremiumGate,
	cardWidth,
}: FavoriteComboEnrichedCardProps) {
	const { t } = useTranslation();
	const assignments = useMisLooksStore((s) => s.assignments);
	const items = useMisLooksStore((s) => s.items);

	const thumbs = useMemo<Array<string | null>>(() => {
		const byItem = new Map(items.map((i) => [i.id, i]));
		const assignmentByIndex = new Map(
			assignments
				.filter((a) => a.combinationId === combination.id)
				.map((a) => [a.colorIndex, a]),
		);
		return combination.colors.map((_color, idx) => {
			const a = assignmentByIndex.get(idx);
			const item = a ? byItem.get(a.wardrobeItemId) : undefined;
			return item?.thumbnailPath || null;
		});
	}, [assignments, items, combination.id, combination.colors]);

	const assigned = thumbs.filter((thumb) => thumb !== null).length;
	const total = combination.colors.length;
	const bucket = resolveBucket(assigned, total);

	const ctaOverrideKey = ctaKeyFor(bucket);
	const accessibilityHintOverride =
		bucket === "complete"
			? t("armario.favorites.a11yHintComplete")
			: bucket === "partial"
				? t("armario.favorites.a11yHintPartial", {
						assigned,
						total,
					})
				: t("armario.favorites.a11yHintEmpty");

	const badgeText =
		bucket === "complete"
			? t("armario.favorites.badgeComplete", { assigned, total })
			: bucket === "partial"
				? t("armario.favorites.badgePartial", { assigned, total })
				: t("armario.favorites.badgeNone");

	return (
		<View
			testID={`enriched-card-${combination.id}`}
			style={{ width: cardWidth }}
		>
			<ComboCard
				variant="compact"
				combination={combination}
				showYoursLabel={false}
				isFavorite={isFavorite}
				onToggleFavorite={onToggleFavorite}
				onPress={onPress}
				onPremiumGate={onPremiumGate}
				ctaOverrideKey={ctaOverrideKey}
				accessibilityHintOverride={accessibilityHintOverride}
				bottomRowLeadingText={badgeText}
			/>
			{bucket !== "empty" ? (
				<View
					testID={`enriched-card-${combination.id}-thumbs`}
					accessibilityElementsHidden={true}
					importantForAccessibility="no-hide-descendants"
					style={{
						flexDirection: "row",
						gap: 6,
						paddingHorizontal: 10,
						paddingTop: 6,
					}}
				>
					{thumbs.map((thumb, idx) => {
						const key = `${combination.id}-thumb-${idx}`;
						if (thumb) {
							return (
								<WardrobeItemThumb
									key={key}
									uri={thumb}
									size={THUMB_SIZE}
									testID={`${key}-filled`}
								/>
							);
						}
						return (
							<View
								key={key}
								testID={`${key}-empty`}
								style={{
									width: THUMB_SIZE,
									height: THUMB_SIZE,
									borderRadius: 8,
									backgroundColor: "transparent",
								}}
							/>
						);
					})}
				</View>
			) : null}
		</View>
	);
}
