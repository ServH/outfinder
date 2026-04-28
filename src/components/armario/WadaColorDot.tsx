import { View } from "react-native";

export interface WadaColorDotProps {
	hex: string;
	size?: number;
	testID?: string;
}

const DEFAULT_SIZE = 12;

export function WadaColorDot({
	hex,
	size = DEFAULT_SIZE,
	testID,
}: WadaColorDotProps) {
	return (
		<View
			testID={testID}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: hex,
			}}
		/>
	);
}
