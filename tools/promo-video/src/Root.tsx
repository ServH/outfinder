import type React from "react";
import { Composition } from "remotion";
import { AppStorePreview } from "./AppStorePreview";
import { SocialPreview } from "./SocialPreview";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* iPhone 6.9" App Store Preview — 886×1920, 20s */}
			<Composition
				id="AppStorePreview"
				component={AppStorePreview}
				durationInFrames={600}
				fps={30}
				width={886}
				height={1920}
			/>
			{/* Social vertical — 1080×1920, 15s */}
			<Composition
				id="SocialPreview"
				component={SocialPreview}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
		</>
	);
};
