/**
 * Outfinder Design Toolkit — App Store Hero Screenshot Generator
 *
 * Generates a production-quality 1284x2778 App Store screenshot using:
 * - SVG for pixel-perfect typography and vector elements
 * - sharp for image compositing (layers, shadows, masks)
 * - ImageMagick for the iPhone frame with realistic shadow
 * - Real simulator screenshot embedded
 *
 * Usage: node tools/design-toolkit/generate-appstore-hero.mjs
 * Output: tools/design-toolkit/output/hero-screenshot.png
 */

import { execSync } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "output");
const SCREENSHOT_SRC = resolve(
  __dirname,
  "../../docs/img_screenshot/simulator_screenshot_999BD298-DE15-457D-9E85-511F7543D1B6.png"
);

// App Store dimensions (iPhone 6.5")
const W = 1284;
const H = 2778;

// Design tokens
const PAPER_BG = "#f0ece4";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#8a7e72";
const ACCENT_WARM = "#d4c4b0";
const WADA_RED = "#D4534A";
const WADA_NAVY = "#2B4570";
const WADA_BEIGE = "#E8D3B4";

// Phone frame dimensions
const PHONE_W = 780;
const PHONE_H = 1690;
const PHONE_RADIUS = 110;
const PHONE_BEZEL = 24;
const SCREEN_RADIUS = 90;
const PHONE_X = Math.round((W - PHONE_W) / 2);
const PHONE_Y = 780;

mkdirSync(OUTPUT_DIR, { recursive: true });

async function main() {
  console.log("Generating App Store Hero Screenshot...\n");

  // ──────────────── STEP 1: Background with subtle paper texture ────────────────
  console.log("1/7  Background layer...");
  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="warmGlow" cx="50%" cy="25%" r="80%">
        <stop offset="0%" stop-color="#f5efe6" />
        <stop offset="50%" stop-color="#f0ece4" />
        <stop offset="100%" stop-color="#ebe5da" />
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
        <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended"/>
        <feComponentTransfer in="blended">
          <feFuncA type="linear" slope="0.03"/>
        </feComponentTransfer>
        <feComposite in="SourceGraphic" operator="atop"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#warmGlow)"/>
    <rect width="${W}" height="${H}" fill="url(#warmGlow)" filter="url(#grain)" opacity="0.5"/>
  </svg>`;
  const bgBuffer = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  // ──────────────── STEP 2: Typography layer (SVG) ────────────────
  console.log("2/7  Typography layer...");
  const textSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&amp;display=swap');
    </style>

    <!-- Wada color dots -->
    <rect x="${W - 160}" y="120" width="32" height="32" rx="6" fill="${WADA_RED}"/>
    <rect x="${W - 116}" y="120" width="32" height="32" rx="6" fill="${WADA_NAVY}"/>
    <rect x="${W - 72}" y="120" width="32" height="32" rx="6" fill="${WADA_BEIGE}"/>

    <!-- Headline -->
    <text x="108" y="260" font-family="Inter, Helvetica Neue, sans-serif" font-size="128" font-weight="700" fill="${TEXT_PRIMARY}" letter-spacing="-2">See your outfit</text>
    <text x="108" y="400" font-family="Inter, Helvetica Neue, sans-serif" font-size="128" font-weight="700" fill="${TEXT_PRIMARY}" letter-spacing="-2">before you dress</text>

    <!-- Subtitle -->
    <text x="108" y="500" font-family="Inter, Helvetica Neue, sans-serif" font-size="46" font-weight="400" fill="${TEXT_SECONDARY}" letter-spacing="0.5">Visualize color-coordinated outfits</text>
    <text x="108" y="560" font-family="Inter, Helvetica Neue, sans-serif" font-size="46" font-weight="400" fill="${TEXT_SECONDARY}" letter-spacing="0.5">using Sanzo Wada's timeless palettes</text>

    <!-- Hairline -->
    <rect x="108" y="640" width="300" height="3" rx="1.5" fill="${ACCENT_WARM}" opacity="0.5"/>

    <!-- Page number -->
    <text x="108" y="${H - 72}" font-family="Inter, Helvetica Neue, sans-serif" font-size="30" font-weight="400" fill="#b0a898" letter-spacing="2">1 / 3</text>

    <!-- Brand -->
    <text x="${W - 108}" y="${H - 72}" font-family="Inter, Helvetica Neue, sans-serif" font-size="32" font-weight="500" fill="#b0a898" letter-spacing="4" text-anchor="end">OUTFINDER</text>
  </svg>`;

  // Render SVG text via rsvg-convert for proper font rendering
  const textSvgPath = resolve(OUTPUT_DIR, "_text.svg");
  writeFileSync(textSvgPath, textSvg);
  execSync(
    `rsvg-convert -w ${W} -h ${H} "${textSvgPath}" -o "${resolve(OUTPUT_DIR, "_text.png")}"`,
    { stdio: "pipe" }
  );
  const textBuffer = await sharp(resolve(OUTPUT_DIR, "_text.png")).png().toBuffer();

  // ──────────────── STEP 3: Process screenshot ────────────────
  console.log("3/7  Processing simulator screenshot...");
  const screenW = PHONE_W - PHONE_BEZEL * 2;
  const screenH = PHONE_H - PHONE_BEZEL * 2;
  const screenshotBuffer = await sharp(SCREENSHOT_SRC)
    .resize(screenW, screenH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  // ──────────────── STEP 4: iPhone frame with rounded screen mask ────────────────
  console.log("4/7  iPhone frame + screen mask...");

  // Create rounded rectangle mask for screen
  const screenMaskSvg = `<svg width="${screenW}" height="${screenH}">
    <rect width="${screenW}" height="${screenH}" rx="${SCREEN_RADIUS}" ry="${SCREEN_RADIUS}" fill="white"/>
  </svg>`;
  const maskedScreen = await sharp(screenshotBuffer)
    .composite([
      {
        input: Buffer.from(screenMaskSvg),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  // Create Dynamic Island
  const diW = 200;
  const diH = 56;
  const diX = Math.round((screenW - diW) / 2);
  const diY = 36;

  const dynamicIslandSvg = `<svg width="${screenW}" height="${screenH}">
    <rect x="${diX}" y="${diY}" width="${diW}" height="${diH}" rx="28" fill="#1c1c1e"/>
  </svg>`;

  const screenWithIsland = await sharp(maskedScreen)
    .composite([
      {
        input: Buffer.from(dynamicIslandSvg),
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  // Create phone body (dark frame)
  const phoneSvg = `<svg width="${PHONE_W}" height="${PHONE_H}">
    <defs>
      <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2a2a2c"/>
        <stop offset="50%" stop-color="#1c1c1e"/>
        <stop offset="100%" stop-color="#141416"/>
      </linearGradient>
    </defs>
    <!-- Frame body -->
    <rect width="${PHONE_W}" height="${PHONE_H}" rx="${PHONE_RADIUS}" fill="url(#frameGrad)"/>
    <!-- Subtle edge highlight -->
    <rect x="1" y="1" width="${PHONE_W - 2}" height="${PHONE_H - 2}" rx="${PHONE_RADIUS}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <!-- Side buttons -->
    <rect x="${PHONE_W - 1}" y="340" width="4" height="140" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="280" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="380" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="200" width="4" height="48" rx="2" fill="#2a2a2a"/>
  </svg>`;

  const phoneBody = await sharp(Buffer.from(phoneSvg))
    .composite([
      {
        input: screenWithIsland,
        left: PHONE_BEZEL,
        top: PHONE_BEZEL,
      },
    ])
    .png()
    .toBuffer();

  // ──────────────── STEP 5: Phone shadow ────────────────
  console.log("5/7  Realistic phone shadow...");

  // Create shadow using ImageMagick (much better shadow control)
  const phonePath = resolve(OUTPUT_DIR, "_phone.png");
  await sharp(phoneBody).toFile(phonePath);

  const shadowPath = resolve(OUTPUT_DIR, "_phone_shadow.png");
  execSync(
    `magick "${phonePath}" \\( +clone -background "rgba(0,0,0,0.12)" -shadow 60x40+0+24 \\) +swap -background none -layers merge +repage "${shadowPath}"`,
    { stdio: "pipe" }
  );

  const phoneShadowBuffer = await sharp(shadowPath).png().toBuffer();
  const phoneShadowMeta = await sharp(phoneShadowBuffer).metadata();

  // ──────────────── STEP 6: Aureola glow behind phone ────────────────
  console.log("6/7  Warm aureola glow...");
  const aureolaSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="aureola" cx="50%" cy="45%" r="30%">
        <stop offset="0%" stop-color="${WADA_RED}" stop-opacity="0.06"/>
        <stop offset="50%" stop-color="${WADA_BEIGE}" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="${WADA_BEIGE}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#aureola)"/>
  </svg>`;
  const aureolaBuffer = await sharp(Buffer.from(aureolaSvg)).png().toBuffer();

  // ──────────────── STEP 7: Final composition ────────────────
  console.log("7/7  Compositing all layers...\n");

  // Calculate phone shadow position (shadow adds padding around the image)
  const shadowPadX = Math.round(((phoneShadowMeta.width || PHONE_W) - PHONE_W) / 2);
  const shadowPadY = Math.round(((phoneShadowMeta.height || PHONE_H) - PHONE_H) / 2);

  const finalImage = await sharp(bgBuffer)
    .composite([
      // Aureola glow
      { input: aureolaBuffer, blend: "over", left: 0, top: 0 },
      // Text layer
      { input: textBuffer, blend: "over", left: 0, top: 0 },
      // Phone with shadow
      {
        input: phoneShadowBuffer,
        blend: "over",
        left: Math.max(0, PHONE_X - shadowPadX),
        top: Math.max(0, PHONE_Y - shadowPadY),
      },
    ])
    .png({ quality: 100 })
    .toFile(resolve(OUTPUT_DIR, "hero-screenshot.png"));

  // Verify dimensions
  const meta = await sharp(resolve(OUTPUT_DIR, "hero-screenshot.png")).metadata();
  console.log(`✅ hero-screenshot.png`);
  console.log(`   Dimensions: ${meta.width}×${meta.height}`);
  console.log(`   Path: ${resolve(OUTPUT_DIR, "hero-screenshot.png")}`);

  // Cleanup temp files
  execSync(
    `rm -f "${resolve(OUTPUT_DIR, "_text.svg")}" "${resolve(OUTPUT_DIR, "_text.png")}" "${phonePath}" "${shadowPath}"`,
    { stdio: "pipe" }
  );

  console.log("\n🎨 Done! Open the output to compare with the HTML version.");
}

main().catch(console.error);
