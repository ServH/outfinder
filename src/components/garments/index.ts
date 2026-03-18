import type { DataSourceParam } from "@shopify/react-native-skia";

export type GarmentType =
	| "top-tshirt"
	| "top-shirt"
	| "bottom-pants"
	| "bottom-skirt"
	| "layer-jacket"
	| "layer-hoodie"
	| "shoes-sneakers"
	| "shoes-formal";

export interface GarmentConfig {
	image: DataSourceParam;
	label: string;
	heightHint: number;
}

// To add a new garment type:
// 1. Add white-on-transparent flat-lay PNG to assets/garments/{type}.png
// 2. Add type to GarmentType union above
// 3. Add entry to GARMENT_REGISTRY with { image, label, heightHint }
// 4. Optionally add to VARIANT_PAIRS in useOutfitState.ts
// 5. Optionally add to SLOT_CONFIGS in useOutfitState.ts
// No component changes needed — TintedGarment tints any registered garment.
export const GARMENT_REGISTRY: Record<GarmentType, GarmentConfig> = {
	"top-tshirt": {
		image: require("@/assets/garments/top-tshirt.png"),
		label: "T-shirt",
		heightHint: 105,
	},
	"top-shirt": {
		image: require("@/assets/garments/top-shirt.png"),
		label: "Shirt",
		heightHint: 105,
	},
	"bottom-pants": {
		image: require("@/assets/garments/bottom-pants.png"),
		label: "Pants",
		heightHint: 160,
	},
	"bottom-skirt": {
		image: require("@/assets/garments/bottom-skirt.png"),
		label: "Skirt",
		heightHint: 100,
	},
	"layer-jacket": {
		image: require("@/assets/garments/layer-jacket.png"),
		label: "Jacket",
		heightHint: 110,
	},
	"layer-hoodie": {
		image: require("@/assets/garments/layer-hoodie.png"),
		label: "Hoodie",
		heightHint: 110,
	},
	"shoes-sneakers": {
		image: require("@/assets/garments/shoes-sneakers.png"),
		label: "Sneakers",
		heightHint: 85,
	},
	"shoes-formal": {
		image: require("@/assets/garments/shoes-formal.png"),
		label: "Formal shoes",
		heightHint: 85,
	},
};
