import { Image, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface WardrobeItemThumbProps {
	uri: string;
	/**
	 * Fixed pixel size. Mutually exclusive with `fill`. When both are omitted
	 * the default is 96 pt.
	 */
	size?: number;
	/**
	 * When true, the thumb stretches to its parent via `flex: 1` — use inside
	 * a sized container (e.g. a slot whose `aspectRatio: 1` is enforced by
	 * the caller). The parent is expected to own `borderRadius` / clipping;
	 * the thumb drops its own radius / background in this mode.
	 */
	fill?: boolean;
	testID?: string;
	accessibilityLabel?: string;
}

const DEFAULT_SIZE = 96;

export function WardrobeItemThumb({
	uri,
	size,
	fill = false,
	testID,
	accessibilityLabel,
}: WardrobeItemThumbProps) {
	const hasLabel =
		typeof accessibilityLabel === "string" && accessibilityLabel.length > 0;
	const resolvedSize = size ?? DEFAULT_SIZE;
	const containerStyle = fill
		? ({ flex: 1 } as const)
		: ({
				width: resolvedSize,
				height: resolvedSize,
				borderRadius: 10,
				backgroundColor: wadaTokens.bgElevated,
				overflow: "hidden",
			} as const);
	const imageStyle = fill
		? ({ flex: 1, width: "100%" } as const)
		: ({ width: resolvedSize, height: resolvedSize } as const);
	return (
		<View
			testID={testID}
			accessibilityLabel={hasLabel ? accessibilityLabel : undefined}
			accessibilityRole={hasLabel ? "image" : undefined}
			accessibilityElementsHidden={!hasLabel}
			importantForAccessibility={hasLabel ? "yes" : "no-hide-descendants"}
			className="items-center justify-center"
			style={containerStyle}
		>
			<Image
				source={{ uri }}
				resizeMode="contain"
				style={imageStyle}
				testID={testID ? `${testID}-image` : undefined}
			/>
		</View>
	);
}
