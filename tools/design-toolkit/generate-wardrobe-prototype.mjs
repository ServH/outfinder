/**
 * Outfinder Design Toolkit — Virtual Wardrobe Prototype
 *
 * Generates a high-fidelity prototype of the "Enriched Favorites / Virtual Wardrobe"
 * feature showing 3 states: complete outfit, partial, and plain favorites.
 * Renders at 1284x2778 (App Store resolution) with production-quality compositing.
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");
mkdirSync(OUTPUT_DIR, { recursive: true });

const W = 1284;
const H = 2778;

// ── Design tokens ──
const PAPER = "#fafaf8";
const BG_WARM = "#f0ece4";
const TEXT_PRI = "#1a1a1a";
const TEXT_SEC = "#6b6b6b";
const TEXT_TER = "#9b9b9b";
const ACCENT = "#c4a265";
const FAV_RED = "#E74C3C";
const DIVIDER = "rgba(0,0,0,0.06)";
const HAIRLINE = "rgba(0,0,0,0.08)";

// ── Wada palette combos ──
const COMBO_1 = { colors: ["#c26b4a", "#7b9e7a", "#f0d5b0"], nameJp: "テラコッタ · 萌黄", nameEn: "Terracotta · Sage · Cream", garments: ["Jacket", "T-shirt", "Pants"], badge: "complete" };
const COMBO_2 = { colors: ["#2B4570", "#D4534A", "#E8D3B4"], nameJp: "紺碧 · 朱色", nameEn: "Navy · Vermilion · Beige", garments: ["Shirt", "—", "Sneakers"], badge: "partial" };
const COMBO_3 = { colors: ["#1a1a1a", "#c8d5e0", "#d4b896", "#8b4513"], nameJp: "墨色 · 砂色", nameEn: "Ink · Ice · Sand · Chestnut", garments: null, badge: null };

async function main() {
  console.log("Generating Virtual Wardrobe Prototype...\n");

  // ── SVG garment silhouettes ──
  const svgTshirt = `<path d="M12 0H28V4L32 8V18H28V52H12V18H8V8L12 4V0Z" fill="white" fill-opacity="0.85"/>`;
  const svgJacket = `<path d="M8 14C8 14 5 8 5 4C5 2 7 0 10 0H30C33 0 35 2 35 4C35 8 32 14 32 14L35 20V48C35 50 33 52 31 52H9C7 52 5 50 5 48V20L8 14Z" fill="white" fill-opacity="0.85"/>`;
  const svgPants = `<path d="M4 0H32L34 4V24L22 52H14L2 24V4L4 0Z" fill="white" fill-opacity="0.85"/>`;
  const svgShirt = `<path d="M10 0H30L36 8L28 14V52H12V14L4 8L10 0Z" fill="white" fill-opacity="0.85"/>`;
  const svgSneaker = `<path d="M4 20C4 12 10 4 20 4H32C36 4 38 8 38 12V28C38 36 32 42 24 42H14C8 42 4 36 4 30V20Z" fill="white" fill-opacity="0.85"/>`;

  function garmentSvg(type) {
    const map = { "Jacket": svgJacket, "T-shirt": svgTshirt, "Pants": svgPants, "Shirt": svgShirt, "Sneakers": svgSneaker };
    return map[type] || svgTshirt;
  }

  // ── Helper: render a palette strip with enrichment ──
  function renderStrip(combo, y, index) {
    const stripX = 48;
    const stripW = W - 96;
    const colorH = 180;
    const colW = stripW / combo.colors.length;
    const isEnriched = combo.garments !== null;
    const silH = isEnriched ? 120 : 0;
    const metaH = 90;
    const totalH = colorH + silH + metaH;

    let svg = "";

    // Card background
    svg += `<rect x="${stripX}" y="${y}" width="${stripW}" height="${totalH}" rx="32" fill="white" stroke="${HAIRLINE}" stroke-width="1.5"/>`;

    // Clip for color blocks (top rounded)
    svg += `<clipPath id="strip-clip-${index}"><rect x="${stripX}" y="${y}" width="${stripW}" height="${colorH}" rx="32"/></clipPath>`;
    svg += `<g clip-path="url(#strip-clip-${index})">`;
    // Bottom corners should be square, so overlay a rect
    svg += `<rect x="${stripX}" y="${y + colorH - 40}" width="${stripW}" height="40" fill="white"/>`;
    combo.colors.forEach((c, i) => {
      svg += `<rect x="${stripX + i * colW}" y="${y}" width="${colW + 1}" height="${colorH}" fill="${c}"/>`;
      if (i > 0) svg += `<line x1="${stripX + i * colW}" y1="${y}" x2="${stripX + i * colW}" y2="${y + colorH}" stroke="${HAIRLINE}" stroke-width="1.5"/>`;
    });
    svg += `</g>`;

    // Badge
    if (combo.badge === "complete") {
      svg += `<rect x="${stripX + stripW - 320}" y="${y}" width="280" height="60" rx="0" fill="#e8f5e2" stroke="#b8d9b0" stroke-width="1"/>`;
      svg += `<rect x="${stripX + stripW - 320}" y="${y + 50}" width="280" height="16" rx="8" fill="#e8f5e2"/>`;
      svg += `<text x="${stripX + stripW - 180}" y="${y + 40}" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" fill="#4a7a40" font-weight="500">✓ Outfit completo</text>`;
    } else if (combo.badge === "partial") {
      svg += `<rect x="${stripX + stripW - 280}" y="${y}" width="240" height="60" rx="0" fill="#fdf4e3" stroke="#e8d0a0" stroke-width="1"/>`;
      svg += `<rect x="${stripX + stripW - 280}" y="${y + 50}" width="240" height="16" rx="8" fill="#fdf4e3"/>`;
      svg += `<text x="${stripX + stripW - 160}" y="${y + 40}" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" fill="#8b6020" font-weight="500">2 de 3 asignadas</text>`;
    }

    // Heart icon
    svg += `<text x="${stripX + stripW - 50}" y="${y + colorH + metaH + silH - 30}" font-size="48" fill="${FAV_RED}" text-anchor="end">♥</text>`;

    // Silhouette enrichment row
    if (isEnriched) {
      const silY = y + colorH;
      svg += `<line x1="${stripX + 24}" y1="${silY}" x2="${stripX + stripW - 24}" y2="${silY}" stroke="${DIVIDER}" stroke-width="1"/>`;

      combo.garments.forEach((g, i) => {
        const gx = stripX + 60 + i * (stripW / combo.colors.length);
        const gy = silY + 16;
        const gw = 64;
        const gh = 80;

        if (g === "—") {
          // Empty suggestion slot
          svg += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="6 4"/>`;
          svg += `<line x1="${gx + gw/2}" y1="${gy + gh/2 - 12}" x2="${gx + gw/2}" y2="${gy + gh/2 + 12}" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round"/>`;
          svg += `<line x1="${gx + gw/2 - 12}" y1="${gy + gh/2}" x2="${gx + gw/2 + 12}" y2="${gy + gh/2}" stroke="${ACCENT}" stroke-width="2.5" stroke-linecap="round"/>`;
          svg += `<text x="${gx + gw/2}" y="${gy + gh + 26}" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="${ACCENT}">Assign</text>`;
        } else {
          // Garment silhouette
          svg += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12" fill="${combo.colors[i]}"/>`;
          svg += `<svg x="${gx + 12}" y="${gy + 8}" width="${gw - 24}" height="${gh - 24}" viewBox="0 0 40 52">${garmentSvg(g)}</svg>`;
          svg += `<text x="${gx + gw/2}" y="${gy + gh + 26}" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="${TEXT_TER}">${g}</text>`;
        }
      });
    }

    // Color names
    const metaY = y + colorH + silH + 20;
    svg += `<text x="${stripX + 28}" y="${metaY + 24}" font-family="'Noto Serif JP',Georgia,serif" font-size="28" fill="${TEXT_PRI}">${combo.nameJp}</text>`;
    svg += `<text x="${stripX + 28}" y="${metaY + 56}" font-family="Inter,sans-serif" font-size="24" fill="${TEXT_TER}">${combo.nameEn}</text>`;

    return { svg, height: totalH };
  }

  // ── Build full screen SVG ──
  console.log("1/4  Building screen layout...");

  let screenSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="20%" r="80%">
        <stop offset="0%" stop-color="#f5efe6"/>
        <stop offset="100%" stop-color="#ebe5da"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>`;

  // ── Status bar ──
  screenSvg += `
    <rect width="${W}" height="140" fill="${PAPER}"/>
    <text x="56" y="76" font-family="Inter,sans-serif" font-size="36" font-weight="600" fill="${TEXT_PRI}">09:41</text>
    <text x="${W - 56}" y="76" text-anchor="end" font-family="Inter,sans-serif" font-size="28" fill="${TEXT_PRI}">●●● ▐ 🔋</text>`;

  // ── Screen title ──
  screenSvg += `
    <rect y="140" width="${W}" height="180" fill="${PAPER}"/>
    <text x="${W/2}" y="240" text-anchor="middle" font-family="'Noto Serif JP',Georgia,serif" font-size="52" font-weight="500" fill="${TEXT_PRI}">Favorites</text>
    <text x="${W/2}" y="290" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" fill="${TEXT_TER}">3 saved combinations · 2 with outfits</text>
    <line x1="0" y1="320" x2="${W}" y2="320" stroke="${DIVIDER}" stroke-width="1.5"/>`;

  // ── Strips ──
  let currentY = 370;

  const s1 = renderStrip(COMBO_1, currentY, 0);
  screenSvg += s1.svg;
  currentY += s1.height + 48;

  const s2 = renderStrip(COMBO_2, currentY, 1);
  screenSvg += s2.svg;
  currentY += s2.height + 48;

  const s3 = renderStrip(COMBO_3, currentY, 2);
  screenSvg += s3.svg;
  currentY += s3.height + 48;

  // ── Hint text ──
  screenSvg += `
    <text x="${W/2}" y="${currentY + 20}" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" font-weight="500" fill="${ACCENT}" letter-spacing="3">PERSONALIZE YOUR FAVORITES</text>
    <text x="${W/2}" y="${currentY + 56}" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" fill="${TEXT_TER}">Tap a favorite to assign garments to each color</text>`;

  // ── Tab bar ──
  const tabY = H - 220;
  screenSvg += `
    <rect y="${tabY}" width="${W}" height="220" fill="${PAPER}"/>
    <line x1="0" y1="${tabY}" x2="${W}" y2="${tabY}" stroke="${DIVIDER}" stroke-width="1.5"/>`;

  // Tab: Colors
  screenSvg += `
    <g transform="translate(${W/6}, ${tabY + 30})">
      <circle cx="0" cy="20" r="18" fill="#c26b4a" opacity="0.7"/>
      <circle cx="12" cy="20" r="18" fill="#7b9e7a" opacity="0.7"/>
      <text x="6" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" fill="${TEXT_TER}">Colors</text>
    </g>`;
  // Tab: Favorites (active)
  screenSvg += `
    <g transform="translate(${W/2}, ${tabY + 30})">
      <text x="0" y="24" text-anchor="middle" font-size="44" fill="${TEXT_PRI}">♥</text>
      <text x="0" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" font-weight="500" fill="${TEXT_PRI}">Favorites</text>
    </g>`;
  // Tab: Settings
  screenSvg += `
    <g transform="translate(${W*5/6}, ${tabY + 30})">
      <text x="0" y="24" text-anchor="middle" font-size="40" fill="${TEXT_TER}">⚙</text>
      <text x="0" y="68" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" fill="${TEXT_TER}">Settings</text>
    </g>`;

  screenSvg += `</svg>`;

  // ── Render SVG to PNG ──
  console.log("2/4  Rendering SVG...");
  const svgPath = resolve(OUTPUT_DIR, "_wardrobe.svg");
  writeFileSync(svgPath, screenSvg);
  execSync(`rsvg-convert -w ${W} -h ${H} "${svgPath}" -o "${resolve(OUTPUT_DIR, "_wardrobe_raw.png")}"`, { stdio: "pipe" });

  // ── Wrap in iPhone frame ──
  console.log("3/4  Compositing iPhone frame...");
  const PHONE_W = 780;
  const PHONE_H = 1690;
  const PHONE_R = 110;
  const BEZEL = 24;
  const SCREEN_R = 90;
  const screenW = PHONE_W - BEZEL * 2;
  const screenH = PHONE_H - BEZEL * 2;

  // Resize screen content
  const screenContent = await sharp(resolve(OUTPUT_DIR, "_wardrobe_raw.png"))
    .resize(screenW, screenH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  // Mask with rounded corners
  const maskSvg = `<svg width="${screenW}" height="${screenH}"><rect width="${screenW}" height="${screenH}" rx="${SCREEN_R}" fill="white"/></svg>`;
  const maskedScreen = await sharp(screenContent)
    .composite([{ input: Buffer.from(maskSvg), blend: "dest-in" }])
    .png()
    .toBuffer();

  // Dynamic Island
  const diSvg = `<svg width="${screenW}" height="${screenH}"><rect x="${(screenW-200)/2}" y="36" width="200" height="56" rx="28" fill="#1c1c1e"/></svg>`;
  const screenWithDI = await sharp(maskedScreen)
    .composite([{ input: Buffer.from(diSvg), blend: "over" }])
    .png()
    .toBuffer();

  // Phone body
  const phoneSvg = `<svg width="${PHONE_W}" height="${PHONE_H}">
    <defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a2a2c"/><stop offset="50%" stop-color="#1c1c1e"/><stop offset="100%" stop-color="#141416"/>
    </linearGradient></defs>
    <rect width="${PHONE_W}" height="${PHONE_H}" rx="${PHONE_R}" fill="url(#fg)"/>
    <rect x="1" y="1" width="${PHONE_W-2}" height="${PHONE_H-2}" rx="${PHONE_R}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <rect x="${PHONE_W-1}" y="340" width="4" height="140" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="280" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="380" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="200" width="4" height="48" rx="2" fill="#2a2a2a"/>
  </svg>`;

  const phoneBody = await sharp(Buffer.from(phoneSvg))
    .composite([{ input: screenWithDI, left: BEZEL, top: BEZEL }])
    .png()
    .toBuffer();

  // Phone shadow
  const phonePath = resolve(OUTPUT_DIR, "_wardrobe_phone.png");
  await sharp(phoneBody).toFile(phonePath);
  const shadowPath = resolve(OUTPUT_DIR, "_wardrobe_phone_shadow.png");
  execSync(`magick "${phonePath}" \\( +clone -background "rgba(0,0,0,0.12)" -shadow 60x40+0+24 \\) +swap -background none -layers merge +repage "${shadowPath}"`, { stdio: "pipe" });

  const phoneShadow = await sharp(shadowPath).png().toBuffer();
  const phoneMeta = await sharp(phoneShadow).metadata();

  // ── Final composition: paper bg + title + phone ──
  console.log("4/4  Final composition...\n");

  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="wg" cx="50%" cy="25%" r="80%">
        <stop offset="0%" stop-color="#f5efe6"/><stop offset="50%" stop-color="#f0ece4"/><stop offset="100%" stop-color="#ebe5da"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#wg)"/>
    <!-- Wada dots -->
    <rect x="${W-160}" y="100" width="32" height="32" rx="6" fill="#c26b4a"/>
    <rect x="${W-116}" y="100" width="32" height="32" rx="6" fill="#7b9e7a"/>
    <rect x="${W-72}" y="100" width="32" height="32" rx="6" fill="#f0d5b0"/>
    <!-- Title -->
    <text x="108" y="240" font-family="Inter,Helvetica Neue,sans-serif" font-size="120" font-weight="700" fill="${TEXT_PRI}" letter-spacing="-2">Your wardrobe,</text>
    <text x="108" y="370" font-family="Inter,Helvetica Neue,sans-serif" font-size="120" font-weight="700" fill="${TEXT_PRI}" letter-spacing="-2">color-curated</text>
    <text x="108" y="460" font-family="Inter,Helvetica Neue,sans-serif" font-size="46" fill="#8a7e72">Assign real garments to Wada palettes.</text>
    <text x="108" y="520" font-family="Inter,Helvetica Neue,sans-serif" font-size="46" fill="#8a7e72">Your favorites become your closet.</text>
    <!-- Hairline -->
    <rect x="108" y="590" width="300" height="3" rx="1.5" fill="#d4c4b0" opacity="0.5"/>
    <!-- Feature label -->
    <text x="108" y="${H-72}" font-family="Inter,sans-serif" font-size="30" fill="#b0a898" letter-spacing="2">CONCEPT</text>
    <text x="${W-108}" y="${H-72}" text-anchor="end" font-family="Inter,sans-serif" font-size="32" font-weight="500" fill="#b0a898" letter-spacing="4">OUTFINDER</text>
  </svg>`;

  const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  const phoneX = Math.round((W - (phoneMeta.width || PHONE_W)) / 2);
  const phoneY = 660;

  await sharp(bgBuffer)
    .composite([{ input: phoneShadow, left: Math.max(0, phoneX), top: phoneY }])
    .png({ quality: 100 })
    .toFile(resolve(OUTPUT_DIR, "wardrobe-prototype.png"));

  // Verify
  const meta = await sharp(resolve(OUTPUT_DIR, "wardrobe-prototype.png")).metadata();
  console.log(`✅ wardrobe-prototype.png`);
  console.log(`   Dimensions: ${meta.width}×${meta.height}`);
  console.log(`   Path: ${resolve(OUTPUT_DIR, "wardrobe-prototype.png")}`);

  // Cleanup
  execSync(`rm -f "${svgPath}" "${resolve(OUTPUT_DIR, "_wardrobe_raw.png")}" "${phonePath}" "${shadowPath}"`, { stdio: "pipe" });

  console.log("\n🎨 Virtual Wardrobe prototype ready!");
}

main().catch(console.error);
