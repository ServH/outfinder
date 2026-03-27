/**
 * Outfinder Design Toolkit — "Color of the Day" Feature Prototype
 *
 * Generates a complete multi-screen prototype:
 *   1. Hero splash — immersive full-color editorial presentation
 *   2. Discovery — top combinations for this color
 *   3. Outfit — suggested outfit using the daily color
 *   4. Flow overview — all screens annotated side by side
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "output", "color-of-day");
mkdirSync(OUT, { recursive: true });

const W = 1284;
const H = 2778;
const PAPER = "#fafaf8";
const TEXT_PRI = "#1a1a1a";
const TEXT_SEC = "#6b6b6b";
const TEXT_TER = "#9b9b9b";
const ACCENT = "#c4a265";
const DIVIDER = "rgba(0,0,0,0.06)";

// Today's color: 朱色 Vermilion
const DAILY = {
  hex: "#D4534A",
  hexDark: "#a83a33",
  jp: "朱色",
  en: "Vermilion",
  desc: "A warm, earthy red used in Japanese lacquerware and torii gates. Wada paired it with navy and gold for balance.",
  combos: [
    { colors: ["#D4534A", "#2B4570", "#E8D3B4"], nameJp: "朱 · 紺 · 亜麻", nameEn: "Vermilion · Navy · Linen" },
    { colors: ["#D4534A", "#F5C542", "#1B1B1B"], nameJp: "朱 · 金 · 墨", nameEn: "Vermilion · Gold · Ink" },
    { colors: ["#D4534A", "#8FBC8F", "#C4A882"], nameJp: "朱 · 若草 · 枯草", nameEn: "Vermilion · Grass · Straw" },
  ],
  outfit: {
    garments: [
      { type: "T-shirt", color: "#D4534A" },
      { type: "Pants", color: "#2B4570" },
      { type: "Sneakers", color: "#E8D3B4" },
    ],
  },
};

// SVG helpers
function phoneSvg(screenSvgContent, id) {
  const PW = 780, PH = 1690, PR = 110, BZ = 24, SR = 90;
  const SW = PW - BZ * 2, SH = PH - BZ * 2;
  return `<svg width="${PW}" height="${PH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="frame-${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2a2a2c"/><stop offset="50%" stop-color="#1c1c1e"/><stop offset="100%" stop-color="#141416"/>
      </linearGradient>
      <clipPath id="screenClip-${id}"><rect x="${BZ}" y="${BZ}" width="${SW}" height="${SH}" rx="${SR}"/></clipPath>
    </defs>
    <rect width="${PW}" height="${PH}" rx="${PR}" fill="url(#frame-${id})"/>
    <rect x="1" y="1" width="${PW-2}" height="${PH-2}" rx="${PR}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <rect x="${PW-1}" y="340" width="4" height="140" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="280" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="380" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <g clip-path="url(#screenClip-${id})">
      <rect x="${BZ}" y="${BZ}" width="${SW}" height="${SH}" fill="${PAPER}"/>
      <g transform="translate(${BZ},${BZ})">${screenSvgContent}</g>
    </g>
    <rect x="${(PW-200)/2}" y="${BZ+12}" width="200" height="56" rx="28" fill="#1c1c1e"/>
  </svg>`;
}

async function renderSvgToFile(svg, w, h, filename) {
  const svgPath = resolve(OUT, `_${filename}.svg`);
  writeFileSync(svgPath, `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`);
  execSync(`rsvg-convert -w ${w} -h ${h} "${svgPath}" -o "${resolve(OUT, filename)}"`, { stdio: "pipe" });
  execSync(`rm "${svgPath}"`, { stdio: "pipe" });
  return resolve(OUT, filename);
}

async function addShadowToPhone(inputPath, outputPath) {
  execSync(`magick "${inputPath}" \\( +clone -background "rgba(0,0,0,0.14)" -shadow 50x35+0+20 \\) +swap -background none -layers merge +repage "${outputPath}"`, { stdio: "pipe" });
}

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  COLOR OF THE DAY — Feature Prototype        ║");
  console.log("║  Today: 朱色 Vermilion #D4534A               ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ═══════════════════════════════════════
  // SCREEN 1: Hero Splash
  // ═══════════════════════════════════════
  console.log("━━━ Screen 1/3: Hero Splash ━━━");

  const SW = 732, SH = 1642;

  const screen1 = `
    <!-- Full color background -->
    <rect width="${SW}" height="${SH}" fill="${DAILY.hex}"/>

    <!-- Subtle gradient overlay for depth -->
    <defs>
      <linearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${DAILY.hex}" stop-opacity="1"/>
        <stop offset="60%" stop-color="${DAILY.hex}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${DAILY.hexDark}" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="textFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
      </linearGradient>
    </defs>
    <rect width="${SW}" height="${SH}" fill="url(#heroFade)"/>
    <rect y="${SH - 700}" width="${SW}" height="700" fill="url(#textFade)"/>

    <!-- Status bar -->
    <text x="40" y="56" font-family="Inter,sans-serif" font-size="32" font-weight="600" fill="white">09:41</text>

    <!-- Date badge -->
    <rect x="${SW/2 - 100}" y="140" width="200" height="52" rx="26" fill="rgba(255,255,255,0.15)"/>
    <text x="${SW/2}" y="174" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" fill="rgba(255,255,255,0.9)" letter-spacing="2">MARCH 26</text>

    <!-- Large Japanese character -->
    <text x="${SW/2}" y="${SH/2 - 80}" text-anchor="middle" font-family="'Noto Serif JP',Georgia,serif" font-size="280" font-weight="500" fill="white" opacity="0.12">${DAILY.jp}</text>

    <!-- Central color swatch -->
    <rect x="${SW/2 - 90}" y="${SH/2 - 100}" width="180" height="180" rx="24" fill="white" opacity="0.95"/>
    <rect x="${SW/2 - 78}" y="${SH/2 - 88}" width="156" height="156" rx="16" fill="${DAILY.hex}"/>

    <!-- Color name -->
    <text x="${SW/2}" y="${SH/2 + 150}" text-anchor="middle" font-family="'Noto Serif JP',Georgia,serif" font-size="72" fill="white" font-weight="500">${DAILY.jp}</text>
    <text x="${SW/2}" y="${SH/2 + 210}" text-anchor="middle" font-family="Inter,sans-serif" font-size="40" fill="rgba(255,255,255,0.7)">${DAILY.en}</text>
    <text x="${SW/2}" y="${SH/2 + 260}" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" fill="rgba(255,255,255,0.5)">${DAILY.hex}</text>

    <!-- Description -->
    <text x="60" y="${SH - 300}" font-family="Inter,sans-serif" font-size="28" fill="rgba(255,255,255,0.75)" width="${SW - 120}">
      <tspan x="60" dy="0">A warm, earthy red used in Japanese</tspan>
      <tspan x="60" dy="40">lacquerware and torii gates. Wada paired</tspan>
      <tspan x="60" dy="40">it with navy and gold for balance.</tspan>
    </text>

    <!-- CTA -->
    <rect x="${SW/2 - 160}" y="${SH - 160}" width="320" height="72" rx="36" fill="white"/>
    <text x="${SW/2}" y="${SH - 114}" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="${DAILY.hex}">Explore combinations →</text>

    <!-- Bottom label -->
    <text x="${SW/2}" y="${SH - 50}" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" fill="rgba(255,255,255,0.35)" letter-spacing="3">COLOR OF THE DAY</text>
  `;

  const phone1Svg = phoneSvg(screen1, "s1");
  await renderSvgToFile(phone1Svg, 780, 1690, "_phone1.png");
  await addShadowToPhone(resolve(OUT, "_phone1.png"), resolve(OUT, "_phone1_shadow.png"));

  // ═══════════════════════════════════════
  // SCREEN 2: Combinations Discovery
  // ═══════════════════════════════════════
  console.log("━━━ Screen 2/3: Combinations ━━━");

  function comboStrip(combo, y) {
    const mx = 40, cw = SW - 80, ch = 160, colW = cw / combo.colors.length;
    let s = `<rect x="${mx}" y="${y}" width="${cw}" height="${ch + 100}" rx="24" fill="white" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>`;
    s += `<clipPath id="cc-${y}"><rect x="${mx}" y="${y}" width="${cw}" height="${ch}" rx="24"/></clipPath>`;
    s += `<g clip-path="url(#cc-${y})"><rect x="${mx}" y="${y + ch - 30}" width="${cw}" height="30" fill="white"/>`;
    combo.colors.forEach((c, i) => {
      s += `<rect x="${mx + i * colW}" y="${y}" width="${colW + 1}" height="${ch}" fill="${c}"/>`;
    });
    s += `</g>`;
    s += `<text x="${mx + 20}" y="${y + ch + 40}" font-family="'Noto Serif JP',Georgia,serif" font-size="26" fill="${TEXT_PRI}">${combo.nameJp}</text>`;
    s += `<text x="${mx + 20}" y="${y + ch + 72}" font-family="Inter,sans-serif" font-size="22" fill="${TEXT_TER}">${combo.nameEn}</text>`;
    s += `<text x="${mx + cw - 20}" y="${y + ch + 56}" text-anchor="end" font-size="36" fill="${TEXT_TER}">♡</text>`;
    return s;
  }

  const screen2 = `
    <rect width="${SW}" height="${SH}" fill="${PAPER}"/>
    <!-- Status bar -->
    <text x="40" y="56" font-family="Inter,sans-serif" font-size="32" font-weight="600" fill="${TEXT_PRI}">09:41</text>
    <!-- Back + title -->
    <text x="40" y="130" font-family="Inter,sans-serif" font-size="32" fill="${ACCENT}">‹ Back</text>
    <!-- Color header -->
    <rect x="40" y="180" width="64" height="64" rx="14" fill="${DAILY.hex}"/>
    <text x="120" y="210" font-family="'Noto Serif JP',Georgia,serif" font-size="36" fill="${TEXT_PRI}">${DAILY.jp}</text>
    <text x="120" y="240" font-family="Inter,sans-serif" font-size="24" fill="${TEXT_TER}">${DAILY.en} · ${DAILY.combos.length} combinations today</text>
    <line x1="40" y1="280" x2="${SW-40}" y2="280" stroke="${DIVIDER}" stroke-width="1.5"/>

    <!-- Section label -->
    <text x="40" y="340" font-family="Inter,sans-serif" font-size="22" font-weight="500" fill="${ACCENT}" letter-spacing="3">BEST COMBINATIONS</text>

    ${comboStrip(DAILY.combos[0], 380)}
    ${comboStrip(DAILY.combos[1], 680)}
    ${comboStrip(DAILY.combos[2], 980)}

    <!-- CTA -->
    <rect x="${SW/2 - 180}" y="1300" width="360" height="72" rx="36" fill="${DAILY.hex}"/>
    <text x="${SW/2}" y="1346" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="white">Visualize outfit →</text>

    <!-- Tab bar -->
    <rect y="${SH - 160}" width="${SW}" height="160" fill="${PAPER}"/>
    <line x1="0" y1="${SH-160}" x2="${SW}" y2="${SH-160}" stroke="${DIVIDER}" stroke-width="1.5"/>
    <text x="${SW/6}" y="${SH - 80}" text-anchor="middle" font-size="24" fill="${TEXT_TER}">Colors</text>
    <text x="${SW/2}" y="${SH - 80}" text-anchor="middle" font-size="24" font-weight="500" fill="${TEXT_PRI}">♥ Favorites</text>
    <text x="${SW*5/6}" y="${SH - 80}" text-anchor="middle" font-size="24" fill="${TEXT_TER}">Settings</text>
  `;

  const phone2Svg = phoneSvg(screen2, "s2");
  await renderSvgToFile(phone2Svg, 780, 1690, "_phone2.png");
  await addShadowToPhone(resolve(OUT, "_phone2.png"), resolve(OUT, "_phone2_shadow.png"));

  // ═══════════════════════════════════════
  // SCREEN 3: Outfit Suggestion
  // ═══════════════════════════════════════
  console.log("━━━ Screen 3/3: Outfit Suggestion ━━━");

  const garments = DAILY.outfit.garments;
  const cardW = 400, cardX = (SW - cardW) / 2;

  const screen3 = `
    <rect width="${SW}" height="${SH}" fill="${PAPER}"/>
    <!-- Warm gradient -->
    <defs>
      <radialGradient id="warmBg" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#f5efe6"/><stop offset="100%" stop-color="#ebe5da"/>
      </radialGradient>
      <radialGradient id="aur" cx="50%" cy="40%" r="35%">
        <stop offset="0%" stop-color="${DAILY.hex}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="${DAILY.hex}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${SW}" height="${SH}" fill="url(#warmBg)"/>
    <rect width="${SW}" height="${SH}" fill="url(#aur)"/>

    <text x="40" y="56" font-family="Inter,sans-serif" font-size="32" font-weight="600" fill="${TEXT_PRI}">09:41</text>
    <text x="40" y="130" font-family="Inter,sans-serif" font-size="32" fill="${ACCENT}">‹ Back</text>

    <!-- Wada header -->
    <text x="${SW/2}" y="220" text-anchor="middle" font-family="'Noto Serif JP',Georgia,serif" font-size="48" font-weight="500" fill="#2c2c2c" letter-spacing="3">${DAILY.combos[0].nameJp}</text>
    <text x="${SW/2}" y="268" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" fill="#a09080">3 colors · Sanzo Wada · Color of the Day</text>

    <!-- Outfit card -->
    <rect x="${cardX}" y="320" width="${cardW}" height="900" rx="32" fill="white" opacity="0.95"/>
    <rect x="${cardX}" y="320" width="${cardW}" height="900" rx="32" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>

    <!-- Garments as colored blocks with labels -->
    <rect x="${cardX + 40}" y="370" width="${cardW - 80}" height="240" rx="12" fill="${garments[0].color}"/>
    <text x="${cardX + cardW/2}" y="500" text-anchor="middle" font-family="Inter,sans-serif" font-size="26" fill="rgba(255,255,255,0.5)" font-weight="500">${garments[0].type}</text>

    <rect x="${cardX + 40}" y="630" width="${cardW - 80}" height="300" rx="12" fill="${garments[1].color}"/>
    <text x="${cardX + cardW/2}" y="790" text-anchor="middle" font-family="Inter,sans-serif" font-size="26" fill="rgba(255,255,255,0.5)" font-weight="500">${garments[1].type}</text>

    <rect x="${cardX + 40}" y="950" width="${cardW - 80}" height="140" rx="12" fill="${garments[2].color}"/>
    <text x="${cardX + cardW/2}" y="1030" text-anchor="middle" font-family="Inter,sans-serif" font-size="26" fill="rgba(0,0,0,0.25)" font-weight="500">${garments[2].type}</text>

    <!-- Gold underline on first garment (selected) -->
    <rect x="${cardX + cardW/2 - 60}" y="618" width="120" height="6" rx="3" fill="${ACCENT}" opacity="0.8"/>

    <!-- Mini palette -->
    <g transform="translate(${(SW - 300)/2}, 1280)">
      <rect width="300" height="32" rx="16" fill="white" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
      <clipPath id="mp"><rect width="300" height="32" rx="16"/></clipPath>
      <g clip-path="url(#mp)">
        <rect x="0" y="0" width="100" height="32" fill="${garments[0].color}"/>
        <rect x="100" y="0" width="100" height="32" fill="${garments[1].color}"/>
        <rect x="200" y="0" width="100" height="32" fill="${garments[2].color}"/>
      </g>
    </g>

    <text x="${SW/2 - 80}" y="1350" font-family="Inter,sans-serif" font-size="20" fill="#a09080">Vermilion</text>
    <text x="${SW/2 + 10}" y="1350" font-family="Inter,sans-serif" font-size="20" fill="#a09080">Navy</text>
    <text x="${SW/2 + 80}" y="1350" font-family="Inter,sans-serif" font-size="20" fill="#a09080">Linen</text>

    <!-- Share -->
    <rect x="${SW/2 - 100}" y="1420" width="200" height="64" rx="32" fill="white" stroke="rgba(0,0,0,0.08)" stroke-width="1.5"/>
    <text x="${SW/2}" y="1462" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="500" fill="${TEXT_PRI}">Share Outfit</text>

    <text x="${SW/2}" y="1540" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" font-weight="500" fill="#a09080">Outfinder</text>
  `;

  const phone3Svg = phoneSvg(screen3, "s3");
  await renderSvgToFile(phone3Svg, 780, 1690, "_phone3.png");
  await addShadowToPhone(resolve(OUT, "_phone3.png"), resolve(OUT, "_phone3_shadow.png"));

  // ═══════════════════════════════════════
  // OVERVIEW: All 3 screens + annotations
  // ═══════════════════════════════════════
  console.log("\n━━━ Compositing overview ━━━");

  const OW = 3200, OH = 2400;

  // Background
  const overviewBg = await sharp({
    create: { width: OW, height: OH, channels: 4, background: { r: 17, g: 17, b: 17, alpha: 255 } }
  }).png().toBuffer();

  // Load phone shadows
  const p1 = await sharp(resolve(OUT, "_phone1_shadow.png")).resize(null, 1500, { fit: "inside" }).png().toBuffer();
  const p2 = await sharp(resolve(OUT, "_phone2_shadow.png")).resize(null, 1500, { fit: "inside" }).png().toBuffer();
  const p3 = await sharp(resolve(OUT, "_phone3_shadow.png")).resize(null, 1500, { fit: "inside" }).png().toBuffer();

  const p1m = await sharp(p1).metadata();
  const p2m = await sharp(p2).metadata();
  const p3m = await sharp(p3).metadata();

  // Annotations SVG
  const annoSvg = `<svg width="${OW}" height="${OH}" xmlns="http://www.w3.org/2000/svg">
    <!-- Title -->
    <text x="${OW/2}" y="80" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="500" fill="#c4a265" letter-spacing="5">FEATURE CONCEPT</text>
    <text x="${OW/2}" y="140" text-anchor="middle" font-family="Inter,sans-serif" font-size="56" font-weight="700" fill="white" letter-spacing="-1">Color of the Day</text>
    <text x="${OW/2}" y="190" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" fill="#888">Daily curated Wada color with combinations and outfit suggestions</text>

    <!-- Screen labels -->
    <text x="300" y="2200" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="#c4a265">1. HERO SPLASH</text>
    <text x="300" y="2240" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">Immersive daily color</text>
    <text x="300" y="2270" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">presentation with cultural</text>
    <text x="300" y="2300" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">context and Wada identity</text>

    <text x="${OW/2}" y="2200" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="#c4a265">2. COMBINATIONS</text>
    <text x="${OW/2}" y="2240" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">Top 3 Wada combinations</text>
    <text x="${OW/2}" y="2270" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">featuring today's color with</text>
    <text x="${OW/2}" y="2300" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">favorite and visualize actions</text>

    <text x="${OW - 300}" y="2200" text-anchor="middle" font-family="Inter,sans-serif" font-size="28" font-weight="600" fill="#c4a265">3. OUTFIT SUGGESTION</text>
    <text x="${OW - 300}" y="2240" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">Automatic outfit visualization</text>
    <text x="${OW - 300}" y="2270" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">with warm Wada aesthetic,</text>
    <text x="${OW - 300}" y="2300" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#666">gold selection bar, and share</text>

    <!-- Flow arrows -->
    <line x1="620" y1="1200" x2="980" y2="1200" stroke="#c4a265" stroke-width="2" opacity="0.5"/>
    <polygon points="980,1194 996,1200 980,1206" fill="#c4a265" opacity="0.5"/>
    <line x1="2180" y1="1200" x2="2540" y2="1200" stroke="#c4a265" stroke-width="2" opacity="0.5"/>
    <polygon points="2540,1194 2556,1200 2540,1206" fill="#c4a265" opacity="0.5"/>

    <!-- Arrow labels -->
    <text x="800" y="1180" text-anchor="middle" font-family="Inter,sans-serif" font-size="18" fill="#c4a265" opacity="0.7">Explore →</text>
    <text x="2360" y="1180" text-anchor="middle" font-family="Inter,sans-serif" font-size="18" fill="#c4a265" opacity="0.7">Visualize →</text>

    <!-- Footer -->
    <text x="${OW/2}" y="${OH - 30}" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#444" letter-spacing="3">OUTFINDER · DESIGN TOOLKIT · CONCEPT PROTOTYPE</text>
  </svg>`;

  const annoPath = resolve(OUT, "_anno.png");
  writeFileSync(resolve(OUT, "_anno.svg"), annoSvg);
  execSync(`rsvg-convert -w ${OW} -h ${OH} "${resolve(OUT, "_anno.svg")}" -o "${annoPath}"`, { stdio: "pipe" });

  // Compose everything
  const phoneY = 280;
  const gap = 140;
  const totalPhonesW = (p1m.width || 600) + (p2m.width || 600) + (p3m.width || 600) + gap * 2;
  const startX = Math.round((OW - totalPhonesW) / 2);

  const overview = await sharp(overviewBg)
    .composite([
      { input: annoPath, left: 0, top: 0 },
      { input: p1, left: startX, top: phoneY },
      { input: p2, left: startX + (p1m.width || 600) + gap, top: phoneY },
      { input: p3, left: startX + (p1m.width || 600) + (p2m.width || 600) + gap * 2, top: phoneY },
    ])
    .png()
    .toFile(resolve(OUT, "overview.png"));

  // ═══════════════════════════════════════
  // Individual screen exports
  // ═══════════════════════════════════════
  console.log("━━━ Exporting individual screens ━━━");

  for (const [i, label] of ["hero", "combinations", "outfit"].entries()) {
    const phoneShadow = await sharp(resolve(OUT, `_phone${i+1}_shadow.png`)).png().toBuffer();
    const pm = await sharp(phoneShadow).metadata();

    const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="ibg-${i}" cx="50%" cy="25%" r="80%">
        <stop offset="0%" stop-color="#f5efe6"/><stop offset="50%" stop-color="#f0ece4"/><stop offset="100%" stop-color="#ebe5da"/>
      </radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#ibg-${i})"/>
    </svg>`;
    const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();

    const px = Math.round((W - (pm.width || 780)) / 2);
    const py = Math.round((H - (pm.height || 1690)) / 2);

    await sharp(bg)
      .composite([{ input: phoneShadow, left: Math.max(0, px), top: Math.max(0, py) }])
      .png()
      .toFile(resolve(OUT, `screen-${i+1}-${label}.png`));
  }

  // Cleanup temp files
  execSync(`rm -f ${OUT}/_*.png ${OUT}/_*.svg`, { stdio: "pipe" });

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  ✅ All outputs generated!                    ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  overview.png           — 3 screens + flow   ║`);
  console.log(`║  screen-1-hero.png      — Hero splash         ║`);
  console.log(`║  screen-2-combinations.png — Combos          ║`);
  console.log(`║  screen-3-outfit.png    — Outfit suggestion   ║`);
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`\nPath: ${OUT}`);
}

main().catch(console.error);
