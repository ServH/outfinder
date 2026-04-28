import React from "react";
import {
	AbsoluteFill,
	Img,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
} from "remotion";

// ─── 1080 × 1920 @ 30fps — 450 frames = 15 s ─────────────────────────────────
// All frame numbers are RELATIVE inside each <Sequence>.

const FADE = 15;

const CUT = {
	INTRO_START: 0,
	INTRO_DUR: 58,
	S1_START: 44,
	S1_DUR: 130,
	S2_START: 158,
	S2_DUR: 135,
	S3_START: 275,
	S3_DUR: 150,
	CTA_START: 405,
	CTA_DUR: 45,
};

// Flash frames at cut points (absolute)
const FLASH = {
	F1: { start: 156, dur: 5, color: "#b06b5a" },
	F2: { start: 272, dur: 5, color: "#4a6741" },
};

const PH = {
	w: 600,
	h: 1300,
	x: (1080 - 600) / 2, // 240
	y: (1920 - 1300) / 2, // 310
	r: 56,
	b: 12,
	ri: 46,
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
	const opacity = interpolate(f, [0, 2, 3, 5], [0, 0.75, 0.5, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	return <AbsoluteFill style={{ background: color, opacity }} />;
};

// ─── Phone: 3D tilt entrance + Ken Burns + scroll reveal ─────────────────────
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
	const rise = interpolate(f, [FADE, FADE + 28], [40, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	// 3D tilt corrects to flat
	const tiltX = interpolate(f, [FADE, FADE + 34], [10, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	// Ken Burns: slow zoom-out
	const kbScale = interpolate(f, [0, dur], [1.05, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	// Scroll reveal: image scrolls up into view from inside phone
	const scrollY = interpolate(f, [FADE, FADE + 42], [90, 0], {
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
				boxShadow: "0 80px 160px rgba(0,0,0,0.7), 0 24px 64px rgba(0,0,0,0.45)",
				transform: `perspective(1200px) rotateX(${tiltX}deg)`,
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
			{/* Screen with Ken Burns + scroll reveal */}
			<div
				style={{
					position: "absolute",
					left: PH.b,
					top: PH.b,
					right: PH.b,
					bottom: PH.b,
					borderRadius: PH.ri,
					overflow: "hidden",
				}}
			>
				<Img
					src={staticFile(image)}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						objectPosition: "top center",
						transform: `translateY(${scrollY}px) scale(${kbScale})`,
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
					width: 128,
					height: 36,
					borderRadius: 20,
					background: "#0a0a0a",
					zIndex: 20,
				}}
			/>
		</div>
	);
};

// ─── Glassmorphism pill caption with scale punch ──────────────────────────────
const Pill: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
	const f = useCurrentFrame();
	const opacity = interpolate(
		f,
		[FADE + 20, FADE + 36, dur - FADE, dur],
		[0, 1, 1, 0],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);
	const y = interpolate(f, [FADE + 20, FADE + 36], [10, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const scale = interpolate(f, [FADE + 20, FADE + 32], [0.94, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				position: "absolute",
				bottom: 90,
				left: "50%",
				transform: `translateX(-50%) translateY(${y}px) scale(${scale})`,
				opacity,
				background: "rgba(240,237,228,0.1)",
				backdropFilter: "blur(16px)",
				WebkitBackdropFilter: "blur(16px)",
				border: "1px solid rgba(240,237,228,0.18)",
				borderRadius: 50,
				paddingLeft: 30,
				paddingRight: 30,
				paddingTop: 15,
				paddingBottom: 15,
				whiteSpace: "nowrap",
			}}
		>
			<span
				style={{
					fontFamily: "'Georgia', serif",
					fontSize: 28,
					color: "#f0ede4",
					letterSpacing: "-0.01em",
				}}
			>
				{text}
			</span>
		</div>
	);
};

// ─── PhoneScene: bg + grain + phone + pill ───────────────────────────────────
const PhoneScene: React.FC<{
	bg: string;
	image: string;
	caption: string;
	dur: number;
}> = ({ bg, image, caption, dur }) => {
	const f = useCurrentFrame();
	const grainOp = bg === "#f0ede4" ? 0.03 : 0.06;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{ background: bg, opacity: fio(f, dur) }} />
			<Phone image={image} dur={dur} />
			<Pill text={caption} dur={dur} />
			<GrainOverlay opacity={grainOp} />
		</AbsoluteFill>
	);
};

// ─── Intro ────────────────────────────────────────────────────────────────────
const Intro: React.FC = () => {
	const f = useCurrentFrame();
	const dur = CUT.INTRO_DUR;
	const bgOp = fio(f, dur);
	const iconOp = interpolate(f, [8, 22], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const iconSc = interpolate(f, [8, 22], [0.8, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const titleOp = interpolate(f, [14, 28], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const titleY = interpolate(f, [14, 28], [18, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const titleSc = interpolate(f, [14, 26], [1.07, 1.0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const tagOp = interpolate(f, [26, 40], [0, 1], {
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
				gap: 16,
			}}
		>
			<Img
				src={staticFile("icon.png")}
				style={{
					width: 120,
					height: 120,
					borderRadius: 28,
					opacity: iconOp,
					transform: `scale(${iconSc})`,
					marginBottom: 20,
				}}
			/>
			<div
				style={{
					fontFamily: "'Georgia', serif",
					fontSize: 80,
					color: "#f0ede4",
					letterSpacing: "-0.025em",
					opacity: titleOp,
					transform: `translateY(${titleY}px) scale(${titleSc})`,
				}}
			>
				Outfinder
			</div>
			<div
				style={{
					fontFamily: "'Helvetica Neue', Arial, sans-serif",
					fontSize: 20,
					color: "rgba(240,237,228,0.45)",
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					opacity: tagOp,
				}}
			>
				Find your colours
			</div>
			<GrainOverlay opacity={0.07} />
		</AbsoluteFill>
	);
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTA: React.FC = () => {
	const f = useCurrentFrame();
	const opacity = interpolate(f, [0, 18], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill
			style={{
				background: "#1d1b16",
				opacity,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 28,
			}}
		>
			<div
				style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden" }}
			>
				{[
					"#c9c4bc",
					"#b06b5a",
					"#2d3142",
					"#8a8680",
					"#c4a882",
					"#4a6741",
					"#8c6b45",
				].map((c) => (
					<div key={c} style={{ width: 50, height: 50, background: c }} />
				))}
			</div>
			<Img
				src={staticFile("icon.png")}
				style={{ width: 100, height: 100, borderRadius: 24 }}
			/>
			<div style={{ textAlign: "center" }}>
				<div
					style={{
						fontFamily: "'Georgia', serif",
						fontSize: 56,
						color: "#f0ede4",
						letterSpacing: "-0.02em",
						marginBottom: 10,
					}}
				>
					Outfinder
				</div>
				<div
					style={{
						fontFamily: "'Helvetica Neue', Arial, sans-serif",
						fontSize: 20,
						color: "rgba(240,237,228,0.42)",
						letterSpacing: "0.08em",
					}}
				>
					Free on the App Store
				</div>
			</div>
			<GrainOverlay opacity={0.07} />
		</AbsoluteFill>
	);
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export const SocialPreview: React.FC = () => (
	<AbsoluteFill style={{ background: "#1d1b16" }}>
		<Sequence from={CUT.INTRO_START} durationInFrames={CUT.INTRO_DUR}>
			<Intro />
		</Sequence>

		<Sequence from={CUT.S1_START} durationInFrames={CUT.S1_DUR}>
			<PhoneScene
				bg="#f0ede4"
				image="sc-home.png"
				caption="Every outfit starts with one color."
				dur={CUT.S1_DUR}
			/>
		</Sequence>

		<Sequence from={FLASH.F1.start} durationInFrames={FLASH.F1.dur}>
			<FlashFrame color={FLASH.F1.color} />
		</Sequence>

		<Sequence from={CUT.S2_START} durationInFrames={CUT.S2_DUR}>
			<PhoneScene
				bg="#3d3318"
				image="sc-combinations.png"
				caption="Every colour finds its perfect match."
				dur={CUT.S2_DUR}
			/>
		</Sequence>

		<Sequence from={FLASH.F2.start} durationInFrames={FLASH.F2.dur}>
			<FlashFrame color={FLASH.F2.color} />
		</Sequence>

		<Sequence from={CUT.S3_START} durationInFrames={CUT.S3_DUR}>
			<PhoneScene
				bg="#1d1b16"
				image="sc-visualizer.png"
				caption="See it before you wear it."
				dur={CUT.S3_DUR}
			/>
		</Sequence>

		<Sequence from={CUT.CTA_START} durationInFrames={CUT.CTA_DUR}>
			<CTA />
		</Sequence>
	</AbsoluteFill>
);
