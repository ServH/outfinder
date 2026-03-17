import {
	Canvas,
	ColorMatrix,
	Fill,
	Image,
	useImage,
} from "@shopify/react-native-skia";

import {
	GARMENT_REGISTRY,
	type GarmentType,
} from "@/components/garments/index";

/**
 * ColorMatrix that tints grayscale → target color.
 * Gray pixel (v, v, v, a) → (v*r, v*g, v*b, a)
 * Preserves shadows/texture as darker shades of the color.
 */
export function hexToTintMatrix(hex: string): number[] {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
	// prettier-ignore
	return [r, 0, 0, 0, 0, 0, g, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0];
}

export interface TintedGarmentProps {
	garmentType: GarmentType;
	colorHex: string;
	width: number;
	height: number;
}

export function TintedGarment({
	garmentType,
	colorHex,
	width,
	height,
}: TintedGarmentProps) {
	const config = GARMENT_REGISTRY[garmentType];
	const image = useImage(config.image);

	if (!image) return null;

	const matrix = hexToTintMatrix(colorHex);

	return (
		<Canvas style={{ width, height }}>
			<Fill color="#fafaf8" />
			<Image
				image={image}
				fit="contain"
				x={0}
				y={0}
				width={width}
				height={height}
			>
				<ColorMatrix matrix={matrix} />
			</Image>
		</Canvas>
	);
}
