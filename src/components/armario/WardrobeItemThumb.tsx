import { Image, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

export interface WardrobeItemThumbProps {
	uri: string;
	size?: number;
	testID?: string;
	accessibilityLabel?: string;
}

const DEFAULT_SIZE = 96;

export function WardrobeItemThumb({
	uri,
	size = DEFAULT_SIZE,
	testID,
	accessibilityLabel,
}: WardrobeItemThumbProps) {
	const hasLabel =
		typeof accessibilityLabel === "string" && accessibilityLabel.length > 0;
	return (
		<View
			testID={testID}
			accessibilityLabel={hasLabel ? accessibilityLabel : undefined}
			accessibilityRole={hasLabel ? "image" : undefined}
			accessibilityElementsHidden={!hasLabel}
			importantForAccessibility={hasLabel ? "yes" : "no-hide-descendants"}
			className="items-center justify-center"
			style={{
				width: size,
				height: size,
				borderRadius: 10,
				backgroundColor: wadaTokens.bgElevated,
				overflow: "hidden",
			}}
		>
			<Image
				source={{ uri }}
				resizeMode="contain"
				style={{ width: size, height: size }}
				testID={testID ? `${testID}-image` : undefined}
			/>
		</View>
	);
}
