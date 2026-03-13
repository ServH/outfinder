import type { ComponentType } from "react";

import { BottomPants } from "./BottomPants";
import { BottomSkirt } from "./BottomSkirt";
import { LayerHoodie } from "./LayerHoodie";
import { LayerJacket } from "./LayerJacket";
import { ShoesFormal } from "./ShoesFormal";
import { ShoesSneakers } from "./ShoesSneakers";
import { TopShirt } from "./TopShirt";
import { TopTShirt } from "./TopTShirt";

export type GarmentType =
	| "top-tshirt"
	| "top-shirt"
	| "bottom-pants"
	| "bottom-skirt"
	| "layer-jacket"
	| "layer-hoodie"
	| "shoes-sneakers"
	| "shoes-formal";

export interface GarmentComponentProps {
	color: string;
	accessibilityLabel: string;
}

export interface GarmentConfig {
	component: ComponentType<GarmentComponentProps>;
	label: string;
}

export const GARMENT_REGISTRY: Record<GarmentType, GarmentConfig> = {
	"top-tshirt": { component: TopTShirt, label: "T-shirt" },
	"top-shirt": { component: TopShirt, label: "Shirt" },
	"bottom-pants": { component: BottomPants, label: "Pants" },
	"bottom-skirt": { component: BottomSkirt, label: "Skirt" },
	"layer-jacket": { component: LayerJacket, label: "Jacket" },
	"layer-hoodie": { component: LayerHoodie, label: "Hoodie" },
	"shoes-sneakers": { component: ShoesSneakers, label: "Sneakers" },
	"shoes-formal": { component: ShoesFormal, label: "Formal shoes" },
};
