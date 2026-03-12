import { Text, View } from "react-native";

type FavoritesListProps = Record<string, never>;

export function FavoritesList(_props: FavoritesListProps) {
	return (
		<View
			className="flex-1 items-center justify-center bg-paper"
			accessibilityLabel="Favorites List screen"
		>
			<Text className="font-serif-jp text-lg text-primary">
				Favorites — Story 4.1
			</Text>
		</View>
	);
}
