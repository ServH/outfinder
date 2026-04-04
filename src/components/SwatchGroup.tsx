import type { ReactElement } from "react";
import { FlatList } from "react-native";
import type { Color } from "@/data/types";
import { ColorSwatch } from "./ColorSwatch";

export interface SwatchGroupProps {
	colors: Color[];
	onColorPress: (color: Color) => void;
	ListHeaderComponent?: ReactElement;
	numColumns?: number;
}

export function SwatchGroup({
	colors,
	onColorPress,
	ListHeaderComponent,
	numColumns = 5,
}: SwatchGroupProps) {
	return (
		<FlatList
			testID="swatch-group-list"
			data={colors}
			numColumns={numColumns}
			key={`swatch-grid-${numColumns}`}
			keyExtractor={(item) => item.id}
			columnWrapperStyle={{ gap: numColumns > 5 ? 6 : 4 }}
			contentContainerStyle={{
				gap: numColumns > 5 ? 6 : 4,
				paddingHorizontal: numColumns > 5 ? 24 : 16,
				paddingBottom: 16,
				paddingTop: ListHeaderComponent ? 0 : 16,
			}}
			ListHeaderComponent={ListHeaderComponent}
			renderItem={({ item }) => (
				<ColorSwatch color={item} onPress={onColorPress} />
			)}
		/>
	);
}
