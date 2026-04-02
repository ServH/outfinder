import { Pressable, Text, View } from "react-native";
import type { Color } from "@/data/types";
import { wadaTokens } from "@/styles/theme";

export interface ShadePickerProps {
	shades: Color[];
	selectedShadeId: string;
	onShadePress: (shade: Color) => void;
}

export function ShadePicker({
	shades,
	selectedShadeId,
	onShadePress,
}: ShadePickerProps) {
	return (
		<View
			className="flex-row"
			style={{
				paddingVertical: 12,
				justifyContent: "space-evenly",
				backgroundColor: wadaTokens.bgPaper,
			}}
			accessibilityRole="tablist"
			testID="shade-picker"
		>
			{shades.map((shade) => {
				const isSelected = shade.id === selectedShadeId;
				return (
					<Pressable
						key={shade.id}
						onPress={() => onShadePress(shade)}
						accessibilityRole="tab"
						accessibilityState={{ selected: isSelected }}
						accessibilityLabel={
							isSelected
								? `${shade.nameEn}, selected`
								: `${shade.nameEn}, tap to filter`
						}
						testID={`shade-pill-${shade.id}`}
					>
						<View className="items-center" style={{ minWidth: 56 }}>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: 18,
									backgroundColor: shade.hex,
									borderWidth: 3,
									borderColor: isSelected
										? wadaTokens.premiumAccent
										: "transparent",
								}}
								testID={isSelected ? "shade-pill-selected-ring" : undefined}
							/>
							<Text
								className={isSelected ? "font-sans-medium" : "font-sans"}
								style={{
									fontSize: 11,
									color: wadaTokens.textSecondary,
									marginTop: 4,
								}}
								numberOfLines={1}
							>
								{shade.nameEn}
							</Text>
						</View>
					</Pressable>
				);
			})}
		</View>
	);
}
