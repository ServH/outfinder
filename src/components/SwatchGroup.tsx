import type { ReactElement } from "react";
import { FlatList } from "react-native";
import type { Color } from "@/data/types";
import { ColorSwatch } from "./ColorSwatch";

export interface SwatchGroupProps {
	colors: Color[];
	onColorPress: (color: Color) => void;
	ListHeaderComponent?: ReactElement;
}

export function SwatchGroup({
	colors,
	onColorPress,
	ListHeaderComponent,
}: SwatchGroupProps) {
	return (
		<FlatList
			testID="swatch-group-list"
			data={colors}
			numColumns={5}
			keyExtractor={(item) => item.id}
			columnWrapperStyle={{ gap: 4 }}
			contentContainerStyle={{ gap: 4, padding: 16 }}
			ListHeaderComponent={ListHeaderComponent}
			renderItem={({ item }) => (
				<ColorSwatch color={item} onPress={onColorPress} />
			)}
		/>
	);
}
