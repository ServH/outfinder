import { Image, Pressable, Text, View } from "react-native";
import { hexToRgba } from "@/lib/color";
import { wadaTokens } from "@/styles/theme";

export interface PolaroidCardProps {
	variant: "empty" | "filled";
	color: { hex: string; nameEn: string };
	imageUri?: string;
	rotation: number;
	testID?: string;
	accessibilityLabel?: string;
	onPress?: () => void;
}

export function PolaroidCard({
	variant,
	color,
	imageUri,
	rotation,
	testID,
	accessibilityLabel,
	onPress,
}: PolaroidCardProps) {
	const isEmpty = variant === "empty";
	const tint60 = hexToRgba(color.hex, 0.6);
	const tintPlus = hexToRgba(color.hex, 0.55);
	const emptyBg = hexToRgba(color.hex, 0.12);

	const content = (
		<View
			className="rounded-[14px] items-center justify-center"
			style={{
				width: "92%",
				aspectRatio: 1.3,
				backgroundColor: isEmpty ? emptyBg : "#FFFFFF",
				borderWidth: isEmpty ? 2 : 0,
				borderStyle: isEmpty ? "dashed" : "solid",
				borderColor: isEmpty ? color.hex : "transparent",
				shadowColor: isEmpty ? "transparent" : "#000",
				shadowOffset: isEmpty ? undefined : { width: 0, height: 6 },
				shadowOpacity: isEmpty ? 0 : 0.12,
				shadowRadius: isEmpty ? 0 : 12,
			}}
		>
			{isEmpty ? (
				<>
					<Text
						testID={testID ? `${testID}-plus` : undefined}
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 28,
							color: tintPlus,
						}}
					>
						+
					</Text>
					<Text
						testID={testID ? `${testID}-label` : undefined}
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 13,
							color: tint60,
							marginTop: 8,
						}}
					>
						{color.nameEn}
					</Text>
				</>
			) : (
				<>
					<View
						className="items-center justify-center overflow-hidden"
						style={{
							backgroundColor: wadaTokens.bgElevated,
							borderRadius: 10,
							width: "86%",
							height: "76%",
							margin: 10,
						}}
					>
						{imageUri ? (
							<Image
								source={{ uri: imageUri }}
								resizeMode="contain"
								style={{ width: "100%", height: "100%" }}
								testID={testID ? `${testID}-image` : undefined}
							/>
						) : null}
					</View>
					<Text
						testID={testID ? `${testID}-label` : undefined}
						style={{
							fontFamily: "Inter_500Medium",
							fontSize: 13,
							color: wadaTokens.textSecondary,
						}}
					>
						{color.nameEn}
					</Text>
				</>
			)}
		</View>
	);

	const outerStyle = {
		width: "100%" as const,
		alignItems: "center" as const,
		transform: [{ rotate: `${rotation}deg` }],
	};

	if (!onPress) {
		return (
			<View
				testID={testID}
				accessible={!!accessibilityLabel}
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="none"
				style={outerStyle}
			>
				{content}
			</View>
		);
	}

	return (
		<Pressable
			testID={testID}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			onPress={onPress}
			style={outerStyle}
		>
			{content}
		</Pressable>
	);
}
