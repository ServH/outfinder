import { Text, View } from "react-native";

type Props = Record<string, never>;

const CURATED_COLOR = {
	hex: "#E34234",
	nameJp: "朱色",
	nameEn: "Vermillion",
};

export function ColorSpecimenPreview(_props: Props) {
	return (
		<View
			accessibilityElementsHidden
			testID="color-specimen-preview"
			className="items-center"
		>
			<View
				testID="specimen-swatch"
				style={{
					width: 100,
					height: 100,
					backgroundColor: CURATED_COLOR.hex,
					borderRadius: 12,
				}}
			/>
			<Text className="mt-3 text-center font-serif-jp text-[16px] text-primary">
				{CURATED_COLOR.nameJp}
			</Text>
			<Text className="mt-1 text-center font-sans text-[12px] text-secondary">
				{CURATED_COLOR.nameEn}
			</Text>
		</View>
	);
}
