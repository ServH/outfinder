import type { WardrobeCategory } from "./types";

/**
 * Manual mapping of all 159 Wada color IDs to wardrobe categories.
 * Based on visual appearance and real-world garment color perception,
 * NOT Wada's artistic swatch groups.
 */
export const WARDROBE_MAP: Record<string, WardrobeCategory> = {
	// Group 0 — Pale & Light
	c001: "brown", // Luan-bird #E8D3B4 — warm beige
	c002: "white", // Eggshell #F5E6CC
	c003: "white", // Ivory #F2E8D5
	c004: "yellow", // Pale Yellow #EDDCB3
	c005: "brown", // Skin #F0D8A8 — warm peach/beige
	c006: "brown", // Wheat #E8C89E — tan
	c007: "white", // Light Incense #F5DEB3 — cream
	c008: "pink", // Cherry Blossom #E8D3D0
	c009: "pink", // Apricot #F2C9AC — soft peach
	c010: "white", // Off-white Silk #F5E1C0
	c011: "yellow", // Honey #F0CEA0
	c012: "brown", // Clove #E8CDA8 — warm tan
	c013: "white", // Flax #F0D5B0 — cream
	c014: "pink", // Coral Pink #F5D6C6
	c015: "white", // White Tea #E8DCC8
	c016: "white", // Pale Egg #F2DAB8
	c017: "pink", // Flesh #F0C8B4 — peach-pink
	c018: "pink", // Pale Cherry Blossom #F5E0D0
	c019: "brown", // Loquat Tea #E8D0B0 — warm beige
	c020: "white", // Faint Incense #F2DFC8
	c021: "brown", // Sand #E8C8A0 — sand/tan
	c022: "white", // Turmeric #F0DCC0 — very pale warm cream
	c023: "orange", // Mandarin Light #F5D0A8 — warm peach-orange
	c024: "brown", // Pale Persimmon #E8CCBA — warm beige
	c025: "pink", // Ash Cherry #F2E0D8 — pale pink
	c026: "white", // Unbleached Silk #E8D8C4
	c027: "pink", // Reddish White Oak #F0D0BC — warm peach

	// Group 1 — Red & Brown
	c028: "red", // Crimson #B91C26
	c029: "brown", // Chestnut #8B4513
	c030: "brown", // Burnt Brown #7B3F00
	c031: "brown", // Maroon Brown #6B2D2D — dark brown with red tint
	c032: "red", // Madder #B7282E
	c033: "brown", // Sienna #A0522D
	c034: "red", // Sappanwood #8B2252 — deep magenta-red
	c035: "brown", // Brick #9B4D2B
	c036: "brown", // Brown #704214
	c037: "red", // Carmine #B5495B
	c038: "red", // Red Brown #A52A2A
	c039: "brown", // Red Ochre #82422A
	c040: "orange", // Persimmon Juice #C75B38 — orange-red
	c041: "red", // Red Iron Oxide #993520
	c042: "red", // Adzuki Bean #78281F
	c043: "brown", // Kite Brown #8F3E2E
	c044: "red", // Red #C9171E
	c045: "brown", // Rust #6B3624
	c046: "red", // Red Birch #A84636
	c047: "brown", // Grape Brown #5C2018
	c048: "red", // Scarlet Red #B44C43
	c049: "red", // Purple Red #8E354A
	c050: "yellow", // Gold #C4A265
	c051: "yellow", // Yellow Ochre #D4A168
	c052: "brown", // Fox #9D5B2E
	c053: "brown", // Amber #7C4A2D

	// Group 2 — Blue & Lavender
	c054: "blue", // Pale Water #C1D8E8
	c055: "blue", // Sky Blue #A8C8E0
	c056: "blue", // Pale Flower #B0C4DE
	c057: "purple", // Wisteria #8B81C3
	c058: "purple", // Pale Wisteria #C8BFE7
	c059: "blue", // White Indigo #D3DEE8
	c060: "green", // Young Green #A8D8B8
	c061: "green", // Pale Sprout Green #B4D8C4
	c062: "green", // Pale Blue-Green #C0D8C0
	c063: "blue", // Moonlight White #C8D8E0
	c064: "grey", // Pale Mouse Gray #B0B8C8
	c065: "purple", // White Violet #C8C0D8
	c066: "blue", // Water Blue #A0C0D0
	c067: "green", // Celadon #9CC0B8
	c068: "grey", // Silver Gray #D0D0D8
	c069: "blue", // Jar-peek Blue #B8D0E0
	c070: "green", // White Green #C4D8D0
	c071: "blue", // Forget-me-not #A8B8D0
	c072: "grey", // Gray Blue #C8D0D8
	c073: "green", // Patina Celadon #B0C8B8
	c074: "blue", // Light Wisteria Blue #A0B0C8
	c075: "grey", // Indigo White #C0C8D0
	c076: "green", // Pale Green #98C8A8
	c077: "purple", // Pale Violet #B8C0D8
	c078: "blue", // Bottle-peek Blue #A8D0D8
	c079: "grey", // White Mouse #D0D8D0

	// Group 3 — Dark & Deep
	c080: "blue", // Indigo #164A84
	c081: "black", // Ink Black #1C1C1C
	c082: "green", // Deep Green #1B3D2F
	c083: "black", // Iron Navy #2E2E3A
	c084: "blue", // Dark Blue #3A3A50
	c085: "blue", // Indigo Iron #3C4452
	c086: "purple", // Purple Navy #4A3A5C
	c087: "green", // Evergreen #1E4D2B
	c088: "green", // Thousand Year Green #26453C
	c089: "green", // Blue-Green #354E4B
	c090: "black", // Jet Black #2C2C38
	c091: "blue", // Victory Blue #3C3C50
	c092: "blue", // Noble Tea #3A5068
	c093: "purple", // Faded Purple #4C3A60
	c094: "green", // Deep Blue-Green #2A4A34
	c095: "black", // Charcoal #424242
	c096: "blue", // Deep Navy #1A3050
	c097: "grey", // Iron #2E4040 — dark metallic teal
	c098: "black", // Soot #383838
	c099: "blue", // Fixed Navy #1C2D4A
	c100: "green", // Deep Pine #345038
	c101: "purple", // Deep Purple #3C2A4C
	c102: "green", // Dark Green #2A3A2A
	c103: "blue", // Dark Indigo #303848
	c104: "purple", // Eggplant Navy #504050
	c105: "blue", // Deep Azure #284050

	// Group 4 — Vivid & Bold
	c106: "red", // Vermillion #E34234
	c107: "orange", // Orange Red #FF6347
	c108: "red", // Chinese Red #E35562
	c109: "blue", // Lapis Lazuli #2050A0
	c110: "blue", // Ultramarine #3060A8
	c111: "green", // Young Grass #7BA23F
	c112: "green", // Emerald #3CB371
	c113: "pink", // Peony #DA508C
	c114: "pink", // Azalea #C850A0
	c115: "orange", // Japanese Gold #F0A030 — warmer/deeper orange tone
	c116: "yellow", // Sunflower #E8A020 — brighter, reads as golden-yellow in garments
	c117: "green", // Green #40A860
	c118: "blue", // Flower Blue #2878A8
	c119: "red", // Crested Ibis #D0504C
	c120: "purple", // Iris #8040B0
	c121: "orange", // Mandarin Orange #D06020
	c122: "blue", // Light Onion Blue #48B0D8
	c123: "red", // Scarlet #C84050
	c124: "green", // Sprouting Yellow-Green #50A030
	c125: "purple", // Purple #9050C8
	c126: "yellow", // Yellow #E8C818
	c127: "blue", // Dayflower Blue #3888C0
	c128: "red", // Rose #E0505C
	c129: "green", // Green Bamboo #20A078
	c130: "pink", // Red Plum #D84080
	c131: "orange", // Persimmon #F08030

	// Group 5 — Green & Olive
	c132: "green", // Grass #6B8E4E
	c133: "green", // Warbler #8B8455 — olive
	c134: "green", // Warbler Brown #6B6B50 — olive
	c135: "brown", // Clove Brown #8C7D5C
	c136: "green", // Sea Pine #807850 — olive
	c137: "brown", // Rikyu Tea #A09060 — warm olive-brown
	c138: "green", // Olive #686850
	c139: "brown", // Flaxen #B0A080 — warm beige
	c140: "brown", // Dried Grass #C0B090 — warm light
	c141: "brown", // Yellow Oak #A08858
	c142: "grey", // Mouse Gray #989078
	c143: "grey", // Lye #A09880 — warm grey
	c144: "brown", // Decayed Leaf #887860
	c145: "green", // Pine Needle #707860
	c146: "grey", // Smoked Bamboo #8C8070 — warm grey
	c147: "brown", // Powder Stone #B8A888 — warm beige
	c148: "brown", // Walnut #908068
	c149: "green", // Moss #788060
	c150: "grey", // Stone #A89880
	c151: "grey", // Pure Mouse #B0A898
	c152: "grey", // Tea Mouse #989080
	c153: "brown", // Dark Brown Mouse #686058
	c154: "brown", // Road Tea #807868
	c155: "brown", // White Oak #A09070
	c156: "green", // Willow Dye #90A080
	c157: "brown", // Egg Brown #C8B898 — warm beige
	c158: "grey", // Gray #787870
	c159: "brown", // Clove Mouse #706858
};

/**
 * 5 manually curated representative shade IDs per wardrobe category.
 * Ordered light-to-dark. Default shade = highest combinationCount among the 5.
 */
export const REPRESENTATIVE_SHADES: Record<WardrobeCategory, string[]> = {
	white: ["c002", "c010", "c007", "c022", "c026"],
	// Eggshell(13) → Off-white Silk(10) → Light Incense(7) → Turmeric(7) → Unbleached Silk(16)

	black: ["c095", "c098", "c083", "c090", "c081"],
	// Charcoal(35) → Soot(11) → Iron Navy(3) → Jet Black(16) → Ink Black(42)

	blue: ["c055", "c122", "c109", "c080", "c084"],
	// Sky Blue(22) → Light Onion Blue(11) → Lapis Lazuli(16) → Indigo(20) → Dark Blue(24)

	grey: ["c068", "c064", "c150", "c142", "c158"],
	// Silver Gray(2) → Pale Mouse Gray(5) → Stone(6) → Mouse Gray(14) → Gray(7)

	brown: ["c005", "c012", "c137", "c035", "c029"],
	// Skin(14) → Clove(10) → Rikyu Tea(12) → Brick(15) → Chestnut(6)

	green: ["c060", "c111", "c132", "c094", "c087"],
	// Young Green(11) → Young Grass(13) → Grass(10) → Deep Blue-Green(8) → Evergreen(14)

	red: ["c106", "c037", "c041", "c028", "c044"],
	// Vermillion(19) → Carmine(25) → Red Iron Oxide(6) → Crimson(16) → Red(31)

	pink: ["c018", "c014", "c008", "c113", "c130"],
	// Pale Cherry Blossom(7) → Coral Pink(17) → Cherry Blossom(17) → Peony(6) → Red Plum(5)

	yellow: ["c004", "c011", "c126", "c116", "c050"],
	// Pale Yellow(3) → Honey(3) → Yellow(22) → Sunflower(4) → Gold(26)

	purple: ["c058", "c057", "c125", "c120", "c101"],
	// Pale Wisteria(6) → Wisteria(23) → Purple(14) → Iris(4) → Deep Purple(7)

	orange: ["c023", "c115", "c131", "c107", "c040"],
	// Mandarin Light(3) → Japanese Gold(14) → Persimmon(4) → Orange Red(7) → Persimmon Juice(3)
};
