import { Dimensions, Text, View } from "react-native";
import { wadaTokens } from "@/styles/theme";

const { width: SCREEN_W } = Dimensions.get("window");

export interface MiniPaletteStripProps {
	colors: Array<{ hex: string; nameEn: string }>;
}

export function MiniPaletteStrip({ colors }: MiniPaletteStripProps) {
	return (
		<View style={{ gap: 6, alignItems: "center" }}>
			<View
				style={{
					flexDirection: "row",
					borderRadius: 6,
					overflow: "hidden",
					height: 18,
					width: SCREEN_W * 0.6,
				}}
				accessibilityLabel="Outfit color palette"
			>
				{colors.map((c) => (
					<View
						key={c.nameEn}
						style={{ flex: 1, backgroundColor: c.hex }}
						accessibilityLabel={c.nameEn}
					/>
				))}
			</View>
			<View style={{ flexDirection: "row", width: SCREEN_W * 0.6 }}>
				{colors.map((c) => (
					<Text
						key={c.nameEn}
						style={{
							flex: 1,
							fontSize: 9,
							color: wadaTokens.wadaMuted,
							textAlign: "center",
						}}
					>
						{c.nameEn}
					</Text>
				))}
			</View>
		</View>
	);
}
