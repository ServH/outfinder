/**
 * Outfinder Design Toolkit — Reusable Component Library
 *
 * Build any screen by composing: phone(), statusBar(), tabBar(), paletteStrip(), etc.
 * Renders via hybrid HTML+Playwright (real fonts) + sharp (shadows, compositing).
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMP = resolve(__dirname, "..", "output", "_temp");
const ASSETS = resolve(__dirname, "..", "..", "..", "assets", "garments");

// ── Design Tokens ──
export const T = {
  paper: "#fafaf8",
  bgWarm: "#f0ece4",
  bgWarmLight: "#f5efe6",
  bgWarmDark: "#ebe5da",
  textPri: "#1a1a1a",
  textSec: "#6b6b6b",
  textTer: "#9b9b9b",
  textTaupe: "#a09080",
  accent: "#c4a265",
  favRed: "#E74C3C",
  divider: "rgba(0,0,0,0.06)",
  hairline: "rgba(0,0,0,0.08)",
  wadaRed: "#D4534A",
  wadaNavy: "#2B4570",
  wadaBeige: "#E8D3B4",
  wadaGold: "#F5C542",
  wadaGreen: "#8FBC8F",
  wadaInk: "#1B1B1B",
};

// ── Screen dimensions ──
export const SCREEN_W = 1284;
export const SCREEN_H = 2778;

// ═══════════════════════════════════════════════
// HTML RENDERER — Playwright with real fonts
// ═══════════════════════════════════════════════

let _browser = null;

export async function initRenderer() {
  mkdirSync(TEMP, { recursive: true });
  _browser = await chromium.launch();
}

export async function closeRenderer() {
  if (_browser) await _browser.close();
  execSync(`rm -rf "${TEMP}"`, { stdio: "pipe" });
}

/**
 * Render an HTML string to a PNG buffer at exact pixel dimensions.
 */
export async function htmlToPng(html, width, height) {
  const page = await _browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const fullHtml = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${width}px; height:${height}px; overflow:hidden; font-family:'Inter',sans-serif; -webkit-font-smoothing:antialiased; }
</style>
</head><body>${html}</body></html>`;
  await page.setContent(fullHtml, { waitUntil: "networkidle" });
  await page.waitForTimeout(500); // font load
  const buf = await page.screenshot({ type: "png" });
  await page.close();
  return buf;
}

// ═══════════════════════════════════════════════
// COMPONENT: Status Bar
// ═══════════════════════════════════════════════

export function statusBar({ time = "09:41", light = false } = {}) {
  const color = light ? "white" : T.textPri;
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 28px 8px;position:relative;z-index:10;">
    <span style="font-size:17px;font-weight:600;color:${color};font-variant-numeric:tabular-nums;">${time}</span>
    <div style="display:flex;gap:6px;align-items:center;">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="${color}"><rect x="0" y="5" width="3.5" height="7" rx="0.8"/><rect x="5" y="3.5" width="3.5" height="8.5" rx="0.8"/><rect x="10" y="1.5" width="3.5" height="10.5" rx="0.8"/><rect x="15" y="0" width="3.5" height="12" rx="0.8" opacity="0.35"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="${color}" stroke-width="1.2"><path d="M1 8.5C3.5 5 6.5 3 8 3s4.5 2 7 5.5"/><path d="M3.5 8.5C5 6.5 6.5 5.5 8 5.5s3 1 4.5 3"/><circle cx="8" cy="9.5" r="1.2" fill="${color}" stroke="none"/></svg>
      <svg width="27" height="12" viewBox="0 0 27 12" fill="${color}"><rect x="0" y="0.5" width="23" height="11" rx="2.5" fill="none" stroke="${color}" stroke-width="1"/><rect x="24" y="3.5" width="2.5" height="5" rx="1" opacity="0.4"/><rect x="2" y="2.5" width="17" height="7" rx="1.3"/></svg>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Navigation Bar
// ═══════════════════════════════════════════════

export function navBar({ title, backLabel = null, rightLabel = null, light = false } = {}) {
  const color = light ? "white" : T.textPri;
  const accent = light ? "rgba(255,255,255,0.7)" : T.accent;
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 20px 14px;position:relative;z-index:10;">
    ${backLabel ? `<span style="font-size:17px;color:${accent};cursor:pointer;">‹ ${backLabel}</span>` : '<span></span>'}
    <span style="font-family:'Noto Serif JP',Georgia,serif;font-size:18px;font-weight:500;color:${color};letter-spacing:0.5px;">${title}</span>
    ${rightLabel ? `<span style="font-size:14px;color:${accent};">${rightLabel}</span>` : '<span></span>'}
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Tab Bar
// ═══════════════════════════════════════════════

export function tabBar({ active = "colors" } = {}) {
  const tab = (id, icon, label) => {
    const isActive = active === id;
    const color = isActive ? T.textPri : T.textTer;
    const weight = isActive ? "font-weight:500;" : "";
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 20px;">
      <span style="font-size:22px;color:${color};">${icon}</span>
      <span style="font-size:10px;color:${color};${weight}">${label}</span>
    </div>`;
  };
  return `<div style="position:absolute;bottom:0;left:0;right:0;height:84px;background:${T.paper};border-top:1px solid ${T.divider};display:flex;justify-content:space-around;align-items:flex-start;padding-top:8px;z-index:10;">
    ${tab("colors", "🎨", "Colors")}
    ${tab("favorites", "♥", "Favorites")}
    ${tab("settings", "⚙", "Settings")}
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Palette Strip
// ═══════════════════════════════════════════════

export function paletteStrip({ colors, nameJp, nameEn, favorited = false, showHanger = true }) {
  const colorDivs = colors.map((c, i) =>
    `<div style="flex:1;background:${c};${i > 0 ? `border-left:1px solid ${T.hairline};` : ''}position:relative;"></div>`
  ).join("");

  return `<div style="background:white;border-radius:16px;border:1px solid ${T.hairline};overflow:hidden;margin:0 20px;">
    <div style="display:flex;height:110px;position:relative;">
      ${colorDivs}
      <div style="position:absolute;top:10px;right:10px;font-size:22px;color:${favorited ? T.favRed : T.textTer};">${favorited ? "♥" : "♡"}</div>
      ${showHanger ? `<div style="position:absolute;bottom:10px;right:10px;width:28px;height:28px;background:rgba(0,0,0,0.25);border-radius:6px;display:flex;align-items:center;justify-content:center;"><span style="font-size:12px;">👕</span></div>` : ''}
    </div>
    <div style="padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-family:'Noto Serif JP',Georgia,serif;font-size:13px;color:${T.textPri};">${nameJp}</div>
        <div style="font-size:11px;color:${T.textTer};margin-top:2px;">${nameEn}</div>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Color Header
// ═══════════════════════════════════════════════

export function colorHeader({ hex, nameJp, nameEn, comboCount }) {
  return `<div style="display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid ${T.divider};">
    <div style="width:44px;height:44px;border-radius:10px;background:${hex};flex-shrink:0;${hex === '#1B1B1B' || hex === '#1a1a1a' ? `border:1px solid ${T.hairline};` : ''}"></div>
    <div style="flex:1;">
      <div style="font-family:'Noto Serif JP',Georgia,serif;font-size:17px;color:${T.textPri};">${nameJp}</div>
      <div style="font-size:12px;color:${T.textTer};">${nameEn}</div>
    </div>
    <div style="font-size:12px;color:${T.textTer};">${comboCount} combinations</div>
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Outfit Card (with real garment PNGs)
// ═══════════════════════════════════════════════

export function outfitCard({ slots, selectedIndex = -1, width = 220 }) {
  const garmentHtml = slots.map((slot, i) => {
    const isSelected = i === selectedIndex;
    const isShoes = slot.type.toLowerCase().includes("sneaker") || slot.type.toLowerCase().includes("shoe");
    const h = isShoes ? 65 : slot.type.toLowerCase().includes("pant") ? 160 : 105;
    const mt = i > 0 ? (isShoes ? -20 : 6) : 0;

    return `<div style="margin-top:${mt}px;text-align:center;position:relative;">
      <div style="width:${width - 28}px;height:${h}px;background:${slot.color};border-radius:6px;display:flex;align-items:center;justify-content:center;margin:0 auto;">
        <span style="font-size:11px;color:rgba(255,255,255,0.45);font-weight:500;">${slot.type}</span>
      </div>
      ${isSelected ? `<div style="width:60%;height:4px;background:${T.accent};border-radius:2px;margin:5px auto 0;opacity:0.8;"></div>` : ''}
    </div>`;
  }).join("");

  return `<div style="width:${width}px;background:${T.paper};border-radius:16px;padding:14px;box-shadow:0 8px 24px rgba(0,0,0,0.06);display:flex;flex-direction:column;align-items:center;">
    ${garmentHtml}
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Mini Palette Strip
// ═══════════════════════════════════════════════

export function miniPalette({ colors, labels }) {
  const barDivs = colors.map(c => `<div style="flex:1;background:${c};"></div>`).join("");
  const labelSpans = labels.map(l => `<span style="font-size:9px;color:${T.textTaupe};text-align:center;">${l}</span>`).join("");
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:60%;">
    <div style="display:flex;width:100%;height:18px;border-radius:9px;overflow:hidden;">${barDivs}</div>
    <div style="display:flex;gap:16px;">${labelSpans}</div>
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Wada Header
// ═══════════════════════════════════════════════

export function wadaHeader({ nameJp, colorCount }) {
  return `<div style="text-align:center;padding:20px 0;">
    <div style="font-family:'Noto Serif JP',Georgia,serif;font-size:20px;font-weight:500;color:#2c2c2c;letter-spacing:2px;">${nameJp}</div>
    <div style="font-size:10px;color:${T.textTaupe};margin-top:4px;">${colorCount} colors · Sanzo Wada</div>
  </div>`;
}

// ═══════════════════════════════════════════════
// COMPONENT: Warm Background
// ═══════════════════════════════════════════════

export function warmBackground() {
  return `<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 30%,${T.bgWarmLight} 0%,${T.bgWarm} 40%,${T.bgWarmDark} 100%);"></div>`;
}

// ═══════════════════════════════════════════════
// PHONE FRAME WRAPPER — renders content in iPhone
// ═══════════════════════════════════════════════

export async function renderInPhone(contentHtml, opts = {}) {
  const { width = SCREEN_W, height = SCREEN_H, phoneBg = T.paper } = opts;

  // Render screen content
  const screenW = 732;
  const screenH = 1584;
  const contentBuf = await htmlToPng(
    `<div style="width:${screenW}px;height:${screenH}px;background:${phoneBg};overflow:hidden;position:relative;">${contentHtml}</div>`,
    screenW, screenH
  );

  // Phone frame
  const PW = 780, PH = 1690, BZ = 24, PR = 110, SR = 90;
  const frameSvg = `<svg width="${PW}" height="${PH}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a2a2c"/><stop offset="50%" stop-color="#1c1c1e"/><stop offset="100%" stop-color="#141416"/>
    </linearGradient></defs>
    <rect width="${PW}" height="${PH}" rx="${PR}" fill="url(#fr)"/>
    <rect x="1" y="1" width="${PW-2}" height="${PH-2}" rx="${PR}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <rect x="${PW-1}" y="340" width="4" height="140" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="280" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="380" width="4" height="80" rx="2" fill="#2a2a2a"/>
    <rect x="-3" y="200" width="4" height="48" rx="2" fill="#2a2a2a"/>
  </svg>`;

  // Screen mask
  const maskSvg = `<svg width="${screenW}" height="${screenH}"><rect width="${screenW}" height="${screenH}" rx="${SR}" fill="white"/></svg>`;
  const maskedScreen = await sharp(contentBuf)
    .composite([{ input: Buffer.from(maskSvg), blend: "dest-in" }])
    .png().toBuffer();

  // Dynamic Island
  const diSvg = `<svg width="${screenW}" height="${screenH}"><rect x="${(screenW-200)/2}" y="10" width="200" height="56" rx="28" fill="#1c1c1e"/></svg>`;
  const screenFinal = await sharp(maskedScreen)
    .composite([{ input: Buffer.from(diSvg), blend: "over" }])
    .png().toBuffer();

  // Compose phone
  const phone = await sharp(Buffer.from(frameSvg))
    .composite([{ input: screenFinal, left: BZ, top: BZ + 40 }])
    .png().toBuffer();

  // Shadow
  const phonePath = resolve(TEMP, "_phone_tmp.png");
  await sharp(phone).toFile(phonePath);
  const shadowPath = resolve(TEMP, "_phone_shadow.png");
  execSync(`magick "${phonePath}" \\( +clone -background "rgba(0,0,0,0.13)" -shadow 55x38+0+22 \\) +swap -background none -layers merge +repage "${shadowPath}"`, { stdio: "pipe" });
  const phoneShadow = await sharp(shadowPath).png().toBuffer();
  const phoneMeta = await sharp(phoneShadow).metadata();

  // Final: paper bg + phone centered
  const bgSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="pbg" cx="50%" cy="25%" r="80%">
      <stop offset="0%" stop-color="${T.bgWarmLight}"/>
      <stop offset="50%" stop-color="${T.bgWarm}"/>
      <stop offset="100%" stop-color="${T.bgWarmDark}"/>
    </radialGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#pbg)"/>
  </svg>`;
  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  const px = Math.round((width - (phoneMeta.width || PW)) / 2);
  const py = Math.round((height - (phoneMeta.height || PH)) / 2);

  return sharp(bg)
    .composite([{ input: phoneShadow, left: Math.max(0, px), top: Math.max(0, py) }])
    .png().toBuffer();
}

// ═══════════════════════════════════════════════
// EXPORT HELPERS
// ═══════════════════════════════════════════════

export async function saveImage(buffer, outputPath) {
  await sharp(buffer).toFile(outputPath);
  const meta = await sharp(outputPath).metadata();
  console.log(`  ✅ ${outputPath.split("/").pop()} (${meta.width}×${meta.height})`);
}
