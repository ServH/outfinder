import { Text, View } from "react-native";

export interface EmptyStateProps {
	title: string;
	subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
	return (
		<View
			testID="empty-state"
			className="flex-1 items-center justify-center px-8"
			accessibilityRole="summary"
			accessibilityLabel={`${title}. ${subtitle}`}
		>
			<Text className="font-serif-jp text-lg text-primary text-center">
				{title}
			</Text>
			<Text className="font-sans text-sm text-secondary text-center mt-2">
				{subtitle}
			</Text>
		</View>
	);
}
