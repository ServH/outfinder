import React from "react";
import {
	AbsoluteFill,
	Img,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
} from "remotion";

// ─── Canvas: 886 × 1920 @ 30fps = 600 frames (20 s) ─────────────────────────
// IMPORTANT: All components inside a <Sequence from={N}> receive frame = 0
// at the sequence start. Use relative frame numbers everywhere.

const FADE = 18;

const CUT = {
	INTRO_START: 0,
	INTRO_DUR: 72,
	S1_START: 55,
	S1_DUR: 172,
	S2_START: 210,
	S2_DUR: 170,
	S3_START: 363,
	S3_DUR: 178,
	OUT_START: 520,
	OUT_DUR: 80,
};

// Flash frames at scene transitions (absolute frame positions)
const FLASH = {
	F1: { start: 208, dur: 6, color: "#b06b5a" }, // cream → olive
	F2: { start: 361, dur: 6, color: "#4a6741" }, // olive → near-black
};

const PH = {
	w: 508,
	h: 1100,
	x: (886 - 508) / 2, // 189
	y: 700,
	r: 50,
	b: 11,
	ri: 42,
};

const C = {
	s1: {
		bg: "#f0ede4",
		text: "#1c1a16",
		muted: "#8a7d6e",
		swatches: [
			"#c9c4bc",
			"#b06b5a",
			"#8a7d6e",
			"#d4c5a9",
			"#6b5d4f",
			"#e8d5c0",
			"#4a3728",
		],
	},
	s2: {
		bg: "#3d3318",
		text: "#f0ede4",
		muted: "rgba(240,237,228,0.55)",
		swatches: [
			"#2d4a7a",
			"#8a4a3a",
			"#4a6741",
			"#c4a882",
			"#6b4c8a",
			"#c45a50",
			"#3d6b5a",
		],
	},
	s3: {
		bg: "#1d1b16",
		text: "#f0ede4",
		muted: "rgba(240,237,228,0.55)",
		swatches: [
			"#c45a50",
			"#2d4a7a",
			"#e8b830",
			"#8c6b45",
			"#4a4a6b",
			"#c4a882",
			"#6b3428",
		],
	},
};

const fio = (f: number, dur: number) =>
	interpolate(f, [0, FADE, dur - FADE, dur], [0, 1, 1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

// ─── Animated film grain ──────────────────────────────────────────────────────
const GrainOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
	const baseId = React.useRef(
		`gr${Math.random().toString(36).slice(2)}`,
	).current;
	const f = useCurrentFrame();
	const seed = f % 60;
	const filterId = `${baseId}-${seed}`;

	return (
		<AbsoluteFill
			style={{
				pointerEvents: "none",
				opacity,
				mixBlendMode: "overlay",
			}}
		>
			<svg width="100%" height="100%">
				<defs>
					<filter id={filterId} x="0" y="0" width="100%" height="100%">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.72"
							numOctaves="4"
							seed={seed}
							stitchTiles="stitch"
						/>
						<feColorMatrix type="saturate" values="0" />
					</filter>
				</defs>
				<rect width="100%" height="100%" filter={`url(#${filterId})`} />
			</svg>
		</AbsoluteFill>
	);
};

// ─── Color transition flash ───────────────────────────────────────────────────
const FlashFrame: React.FC<{ color: string }> = ({ color }) => {
	const f = useCurrentFrame();
	const opacity = interpolate(f, [0, 2, 4, 6], [0, 0.75, 0.5, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	return <AbsoluteFill style={{ background: color, opacity }} />;
};

// ─── Wada color swatches strip ────────────────────────────────────────────────
const WadaSwatches: React.FC<{ colors: string[]; dur: number }> = ({
	colors,
	dur,
}) => {
	const f = useCurrentFrame();
	const containerOp = interpolate(
		f,
		[FADE + 28, FADE + 48, dur - FADE - 10, dur - FADE],
		[0, 1, 1, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
	);
	const slideY = interpolate(f, [FADE + 28, FADE + 46], [52, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				position: "absolute",
				bottom: 0,
				left: 0,
				right: 0,
				display: "flex",
				opacity: containerOp,
				transform: `translateY(${slideY}px)`,
				overflow: "hidden",
			}}
		>
			{colors.map((c, i) => {
				const tileOp = interpolate(
					f,
					[FADE + 28 + i * 5, FADE + 44 + i * 5],
					[0, 1],
					{
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					},
				);
				return (
					<div
						key={c}
						style={{ flex: 1, height: 52, background: c, opacity: tileOp }}
					/>
				);
			})}
		</div>
	);
};

// ─── Headline with kinetic punch ──────────────────────────────────────────────
const Headline: React.FC<{
	lines: string[];
	color: string;
	start: number;
	size?: number;
}> = ({ lines, color, start, size = 92 }) => {
	const f = useCurrentFrame();
	return (
		<div
			style={{
				fontFamily: "'Georgia', 'Times New Roman', serif",
				fontSize: size,
				fontWeight: 400,
				lineHeight: 1.18,
				color,
				letterSpacing: "-0.025em",
			}}
		>
			{lines.map((line, i) => {
				const lf = start + i * 16;
				const opacity = interpolate(f, [lf, lf + 14], [0, 1], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				const y = interpolate(f, [lf, lf + 18], [22, 0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				const scale = interpolate(f, [lf, lf + 12], [1.07, 1.0], {
					extrapolateLeft: "clamp",
					extrapolateRight: "clamp",
				});
				return (
					<div
						key={i}
						style={{
							opacity,
							transform: `translateY(${y}px) scale(${scale})`,
							transformOrigin: "left center",
							display: "block",
						}}
					>
						{line}
					</div>
				);
			})}
		</div>
	);
};

// ─── Phone: 3D tilt entrance + Ken Burns on screen ───────────────────────────
const Phone: React.FC<{ image: string; dur: number }> = ({ image, dur }) => {
	const f = useCurrentFrame();

	const opacity = interpolate(
		f,
		[FADE, FADE + 20, dur - FADE, dur],
		[0, 1, 1, 0],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);
	// Rise on entry
	const rise = interpolate(f, [FADE, FADE + 30], [55, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	// 3D tilt that corrects to flat
	const tiltX = interpolate(f, [FADE, FADE + 36], [12, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const tiltY = interpolate(f, [FADE, FADE + 36], [-4, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	// Ken Burns: slow zoom-out over the entire scene
	const kbScale = interpolate(f, [0, dur], [1.05, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const kbPanY = interpolate(f, [0, dur], [0, -28], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				position: "absolute",
				left: PH.x,
				top: PH.y + rise,
				width: PH.w,
				height: PH.h,
				borderRadius: PH.r,
				overflow: "hidden",
				opacity,
				boxShadow:
					"0 80px 160px rgba(0,0,0,0.55), 0 24px 64px rgba(0,0,0,0.32)",
				transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
				transformOrigin: "center bottom",
			}}
		>
			{/* Bezel ring */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					borderRadius: PH.r,
					border: `${PH.b}px solid #1a1714`,
					zIndex: 10,
					pointerEvents: "none",
				}}
			/>
			{/* Screen with Ken Burns */}
			<div
				style={{
					position: "absolute",
					left: PH.b,
					top: PH.b,
					right: PH.b,
					bottom: PH.b,
					borderRadius: PH.ri,
					overflow: "hidden",
					background: "#1c1c1e",
				}}
			>
				<Img
					src={staticFile(image)}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "top center",
						display: "block",
						transform: `scale(${kbScale}) translateY(${kbPanY}px)`,
						transformOrigin: "top center",
					}}
				/>
			</div>
			{/* Dynamic island */}
			<div
				style={{
					position: "absolute",
					top: PH.b + 14,
					left: "50%",
					transform: "translateX(-50%)",
					width: 110,
					height: 32,
					borderRadius: 18,
					background: "#0a0a0a",
					zIndex: 20,
				}}
			/>
		</div>
	);
};

// ─── Scene ────────────────────────────────────────────────────────────────────
const Scene: React.FC<{
	dur: number;
	colors: { bg: string; text: string; muted: string; swatches: string[] };
	lines: string[];
	subtext: string;
	image: string;
}> = ({ dur, colors, lines, subtext, image }) => {
	const f = useCurrentFrame();
	const bgOp = fio(f, dur);

	const subtextOp = interpolate(f, [FADE + 50, FADE + 65], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const subtextY = interpolate(f, [FADE + 50, FADE + 65], [10, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const labelOp = interpolate(f, [FADE, FADE + 12], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const grainOpacity = colors.bg === "#f0ede4" ? 0.03 : 0.07;

	return (
		<AbsoluteFill style={{ background: colors.bg, opacity: bgOp }}>
			{/* Text block */}
			<div
				style={{
					position: "absolute",
					left: 60,
					right: 60,
					top: 0,
					height: PH.y,
					display: "flex",
					flexDirection: "column",
					justifyContent: "flex-end",
					paddingBottom: 60,
				}}
			>
				<div
					style={{
						fontFamily: "'Helvetica Neue', Arial, sans-serif",
						fontSize: 16,
						fontWeight: 500,
						letterSpacing: "0.22em",
						color: colors.muted,
						opacity: labelOp,
						marginBottom: 52,
					}}
				>
					OUTFINDER
				</div>
				<Headline lines={lines} color={colors.text} start={FADE + 8} />
				<div
					style={{
						fontFamily: "'Helvetica Neue', Arial, sans-serif",
						fontSize: 22,
						color: colors.muted,
						marginTop: 20,
						opacity: subtextOp,
						transform: `translateY(${subtextY}px)`,
						letterSpacing: "0.01em",
					}}
				>
					{subtext}
				</div>
			</div>

			<Phone image={image} dur={dur} />
			<WadaSwatches colors={colors.swatches} dur={dur} />
			<GrainOverlay opacity={grainOpacity} />
		</AbsoluteFill>
	);
};

// ─── Intro ────────────────────────────────────────────────────────────────────
const Intro: React.FC = () => {
	const f = useCurrentFrame();
	const dur = CUT.INTRO_DUR;

	const bgOp = fio(f, dur);
	const iconOp = interpolate(f, [8, 24], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const iconSc = interpolate(f, [8, 28], [0.8, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const titleOp = interpolate(f, [14, 30], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const titleY = interpolate(f, [14, 30], [18, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const titleSc = interpolate(f, [14, 26], [1.07, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const tagOp = interpolate(f, [28, 44], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const dotsOp = interpolate(f, [38, 52], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				background: "#1d1b16",
				opacity: bgOp,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 0,
			}}
		>
			<Img
				src={staticFile("icon.png")}
				style={{
					width: 140,
					height: 140,
					borderRadius: 32,
					opacity: iconOp,
					transform: `scale(${iconSc})`,
					marginBottom: 32,
				}}
			/>
			<div
				style={{
					fontFamily: "'Georgia', serif",
					fontSize: 72,
					fontWeight: 400,
					color: "#f0ede4",
					letterSpacing: "-0.02em",
					opacity: titleOp,
					transform: `translateY(${titleY}px) scale(${titleSc})`,
					marginBottom: 16,
				}}
			>
				Outfinder
			</div>
			<div
				style={{
					fontFamily: "'Helvetica Neue', Arial, sans-serif",
					fontSize: 18,
					color: "rgba(240,237,228,0.48)",
					letterSpacing: "0.16em",
					textTransform: "uppercase",
					opacity: tagOp,
					marginBottom: 40,
				}}
			>
				Colour theory for your wardrobe
			</div>
			<div style={{ display: "flex", gap: 12, opacity: dotsOp }}>
				{["#c45a50", "#2d4a7a", "#e8b830"].map((c) => (
					<div
						key={c}
						style={{ width: 14, height: 14, borderRadius: 7, background: c }}
					/>
				))}
			</div>
			<GrainOverlay opacity={0.07} />
		</AbsoluteFill>
	);
};

// ─── Outro ────────────────────────────────────────────────────────────────────
const Outro: React.FC = () => {
	const f = useCurrentFrame();
	const opacity = interpolate(f, [0, 20], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	return (
		<AbsoluteFill
			style={{
				background: "#1d1b16",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 28,
				opacity,
			}}
		>
			<Img
				src={staticFile("icon.png")}
				style={{ width: 156, height: 156, borderRadius: 36 }}
			/>
			<div
				style={{ width: 40, height: 1, background: "rgba(240,237,228,0.22)" }}
			/>
			<div style={{ textAlign: "center" }}>
				<div
					style={{
						fontFamily: "'Georgia', serif",
						fontSize: 52,
						color: "#f0ede4",
						letterSpacing: "-0.02em",
						marginBottom: 12,
					}}
				>
					Outfinder
				</div>
				<div
					style={{
						fontFamily: "'Helvetica Neue', Arial, sans-serif",
						fontSize: 20,
						color: "rgba(240,237,228,0.42)",
						letterSpacing: "0.1em",
						textTransform: "uppercase",
					}}
				>
					Free on the App Store
				</div>
			</div>
			<GrainOverlay opacity={0.07} />
		</AbsoluteFill>
	);
};

// ─── Root composition ─────────────────────────────────────────────────────────
export const AppStorePreview: React.FC = () => (
	<AbsoluteFill style={{ background: "#1d1b16" }}>
		<Sequence from={CUT.INTRO_START} durationInFrames={CUT.INTRO_DUR}>
			<Intro />
		</Sequence>

		<Sequence from={CUT.S1_START} durationInFrames={CUT.S1_DUR}>
			<Scene
				dur={CUT.S1_DUR}
				colors={C.s1}
				lines={["Every outfit", "starts with", "one color."]}
				subtext="Colour theory for your everyday wardrobe."
				image="sc-home.png"
			/>
		</Sequence>

		<Sequence from={FLASH.F1.start} durationInFrames={FLASH.F1.dur}>
			<FlashFrame color={FLASH.F1.color} />
		</Sequence>

		<Sequence from={CUT.S2_START} durationInFrames={CUT.S2_DUR}>
			<Scene
				dur={CUT.S2_DUR}
				colors={C.s2}
				lines={["Every colour", "finds its", "perfect match."]}
				subtext="Pick a colour, discover its palette."
				image="sc-combinations.png"
			/>
		</Sequence>

		<Sequence from={FLASH.F2.start} durationInFrames={FLASH.F2.dur}>
			<FlashFrame color={FLASH.F2.color} />
		</Sequence>

		<Sequence from={CUT.S3_START} durationInFrames={CUT.S3_DUR}>
			<Scene
				dur={CUT.S3_DUR}
				colors={C.s3}
				lines={["See it before", "you wear it."]}
				subtext="348 curated Wada combinations."
				image="sc-visualizer.png"
			/>
		</Sequence>

		<Sequence from={CUT.OUT_START} durationInFrames={CUT.OUT_DUR}>
			<Outro />
		</Sequence>
	</AbsoluteFill>
);
