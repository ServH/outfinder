import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface CompletenessBadgeProps {
	assigned: number;
	total: number;
	testID?: string;
	/**
	 * Visual/copy variant. `"short"` (default) is the compact N/N pill used
	 * in S2/S4 chrome. `"long"` swaps the copy to the Favorites-enrichment
	 * strings ("3/3 garments" / "No garments") — used by
	 * `FavoriteComboEnrichedCard`.
	 */
	variant?: "short" | "long";
}

type Variant = "none" | "complete" | "partial";

export const COMPLETENESS_COLORS: Record<Variant, { bg: string; fg: string }> =
	{
		none: { bg: wadaTokens.bgElevated, fg: wadaTokens.textSecondary },
		complete: { bg: "#D4F2D4", fg: "#1F6D1F" },
		partial: { bg: "#F8E4C2", fg: "#8B5E1F" },
	};

function resolveVariant(assigned: number, total: number): Variant {
	if (total <= 0 || assigned <= 0) return "none";
	if (assigned === total) return "complete";
	return "partial";
}

export function CompletenessBadge({
	assigned,
	total,
	testID,
	variant: copyVariant = "short",
}: CompletenessBadgeProps) {
	const { t } = useTranslation();
	const variant = resolveVariant(assigned, total);
	const { bg, fg } = COMPLETENESS_COLORS[variant];

	const isLong = copyVariant === "long";
	const label = isLong
		? variant === "none"
			? t("armario.favorites.badgeNone")
			: variant === "complete"
				? t("armario.favorites.badgeComplete", { assigned, total })
				: t("armario.favorites.badgePartial", { assigned, total })
		: variant === "none"
			? t("armario.badge.none")
			: variant === "complete"
				? t("armario.badge.complete", { assigned, total })
				: t("armario.badge.partial", { assigned, total });

	const a11y = t("armario.badge.a11y", { assigned, total });

	return (
		<View
			testID={testID}
			accessibilityLabel={a11y}
			style={{
				backgroundColor: bg,
				borderRadius: 10,
				paddingHorizontal: isLong ? 12 : 10,
				paddingVertical: 4,
				flexDirection: "row",
				alignItems: "center",
				alignSelf: "flex-start",
				minHeight: 24,
			}}
		>
			{variant === "complete" ? (
				<Text
					testID={testID ? `${testID}-glyph` : undefined}
					style={{
						fontFamily: "Inter_500Medium",
						fontSize: 13,
						color: fg,
						marginRight: 4,
					}}
				>
					✓
				</Text>
			) : null}
			<Text
				testID={testID ? `${testID}-label` : undefined}
				style={{
					fontFamily: "Inter_500Medium",
					fontSize: 13,
					color: fg,
				}}
			>
				{label}
			</Text>
		</View>
	);
}
