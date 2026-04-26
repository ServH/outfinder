import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface CaptionProps {
	text: string;
	subtext?: string;
	startFrame: number;
	endFrame: number;
	align?: "left" | "center";
	size?: "sm" | "md" | "lg";
}

export const Caption: React.FC<CaptionProps> = ({
	text,
	subtext,
	startFrame,
	endFrame,
	align = "left",
	size = "md",
}) => {
	const frame = useCurrentFrame();

	const FADE_DURATION = 18;
	const fadeIn = interpolate(
		frame,
		[startFrame, startFrame + FADE_DURATION],
		[0, 1],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);
	const fadeOut = interpolate(
		frame,
		[endFrame - FADE_DURATION, endFrame],
		[1, 0],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);
	const slideY = interpolate(
		frame,
		[startFrame, startFrame + FADE_DURATION],
		[20, 0],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);

	const opacity = Math.min(fadeIn, fadeOut);

	const fontSizeMap = { sm: 28, md: 42, lg: 60 };
	const fontSize = fontSizeMap[size];

	return (
		<div
			style={{
				opacity,
				transform: `translateY(${slideY}px)`,
				textAlign: align,
				fontFamily: "'Georgia', 'Times New Roman', serif",
			}}
		>
			<div
				style={{
					fontSize,
					fontWeight: 500,
					color: "#1c1c1e",
					lineHeight: 1.2,
					letterSpacing: "-0.02em",
				}}
			>
				{text}
			</div>
			{subtext && (
				<div
					style={{
						fontSize: fontSize * 0.55,
						fontWeight: 400,
						color: "#6b6b6e",
						marginTop: 10,
						fontFamily: "'Helvetica Neue', Arial, sans-serif",
						letterSpacing: "0.02em",
					}}
				>
					{subtext}
				</div>
			)}
		</div>
	);
};
