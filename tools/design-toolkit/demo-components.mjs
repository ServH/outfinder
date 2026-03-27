/**
 * DEMO: Build 3 complete screens using the component library.
 * Compare: previous script was ~400 lines. This is ~80.
 */

import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  T, SCREEN_W, SCREEN_H,
  initRenderer, closeRenderer, htmlToPng,
  statusBar, navBar, tabBar, paletteStrip, colorHeader, outfitCard, miniPalette, wadaHeader, warmBackground,
  renderInPhone, saveImage,
} from "./lib/components.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "output", "demo");
mkdirSync(OUT, { recursive: true });

async function main() {
  await initRenderer();
  console.log("Building 3 screens with component library...\n");

  // ════════════════════════════════════════════
  // SCREEN 1: Color Home — swatch grid + tabs
  // ════════════════════════════════════════════
  console.log("Screen 1: Color Home");

  const wadaColors = [
    "#E8D3B4","#C4A882","#D4C4AE","#B0C4DE","#F0E68C",
    "#D4534A","#8B7355","#E6735A","#4A6FA5","#FFD700",
    "#2B4570","#6B8E23","#9B59B6","#C41E3A","#8FBC8F",
    "#CD853F","#708090","#DDA0DD","#CD5C5C","#87CEEB",
    "#A0522D","#BDB76B","#556B2F","#F08080","#4169E1",
    "#1B1B1B","#3D3D3D","#BC8F8F","#F5C542","#E8A317",
  ];

  const swatchGrid = wadaColors.map(c =>
    `<div style="aspect-ratio:1;background:${c};border-radius:3px;"></div>`
  ).join("");

  const filterTabs = ["All", "Pale & Light", "Red & Brown", "Blue & Lavender", "Dark & Deep", "Vivid & Bold"].map((t, i) =>
    `<span style="padding:10px 14px;font-size:12px;color:${i === 0 ? T.textPri : T.textTer};${i === 0 ? 'font-weight:500;border-bottom:2px solid '+T.textPri+';' : 'border-bottom:2px solid transparent;'}white-space:nowrap;">${t}</span>`
  ).join("");

  const screen1Html = `
    <div style="background:${T.paper};min-height:100%;">
      ${statusBar()}
      <div style="padding:16px 20px 4px;font-family:'Noto Serif JP',Georgia,serif;font-size:22px;color:${T.textPri};">Outfinder</div>
      <div style="display:flex;padding:0 6px;border-bottom:1px solid ${T.divider};overflow-x:auto;">${filterTabs}</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:12px 16px;">
        ${swatchGrid}
      </div>
      ${tabBar({ active: "colors" })}
    </div>`;

  const phone1 = await renderInPhone(screen1Html);
  await saveImage(phone1, resolve(OUT, "1-color-home.png"));

  // ════════════════════════════════════════════
  // SCREEN 2: Combinations
  // ════════════════════════════════════════════
  console.log("Screen 2: Combinations");

  const screen2Html = `
    <div style="background:${T.paper};min-height:100%;">
      ${statusBar()}
      ${navBar({ title: "Outfit Visualizer", backLabel: "Colors" })}
      ${colorHeader({ hex: "#D4534A", nameJp: "朱色", nameEn: "Vermilion", comboCount: 14 })}
      <div style="padding:16px 0;display:flex;flex-direction:column;gap:20px;">
        ${paletteStrip({ colors: ["#D4534A", "#2B4570", "#E8D3B4"], nameJp: "朱 · 紺 · 亜麻", nameEn: "Vermilion · Navy · Linen", favorited: true })}
        ${paletteStrip({ colors: ["#D4534A", "#F5C542", "#1B1B1B"], nameJp: "朱 · 金 · 墨", nameEn: "Vermilion · Gold · Ink" })}
        ${paletteStrip({ colors: ["#D4534A", "#8FBC8F", "#C4A882"], nameJp: "朱 · 若草 · 枯草", nameEn: "Vermilion · Grass · Straw" })}
      </div>
      ${tabBar({ active: "colors" })}
    </div>`;

  const phone2 = await renderInPhone(screen2Html);
  await saveImage(phone2, resolve(OUT, "2-combinations.png"));

  // ════════════════════════════════════════════
  // SCREEN 3: Outfit Visualizer
  // ════════════════════════════════════════════
  console.log("Screen 3: Outfit Visualizer");

  const screen3Html = `
    <div style="position:relative;min-height:100%;">
      ${warmBackground()}
      <div style="position:relative;z-index:1;">
        ${statusBar()}
        ${navBar({ title: "" , backLabel: "Colors" })}
        ${wadaHeader({ nameJp: "朱 · 紺 · 亜麻", colorCount: 3 })}
        <div style="display:flex;justify-content:center;margin-top:8px;">
          ${outfitCard({
            slots: [
              { type: "T-shirt", color: "#D4534A" },
              { type: "Pants", color: "#2B4570" },
              { type: "Sneakers", color: "#E8D3B4" },
            ],
            selectedIndex: 0,
            width: 220,
          })}
        </div>
        <div style="display:flex;justify-content:center;margin-top:24px;">
          ${miniPalette({ colors: ["#D4534A", "#2B4570", "#E8D3B4"], labels: ["Vermilion", "Navy", "Linen"] })}
        </div>
        <div style="text-align:center;margin-top:8px;font-size:13px;color:${T.textTaupe};font-weight:500;">Outfinder</div>
        <div style="display:flex;justify-content:center;margin-top:16px;">
          <div style="padding:12px 32px;background:white;border:1px solid ${T.hairline};border-radius:10px;font-size:14px;font-weight:500;color:${T.textPri};">Share Outfit</div>
        </div>
        <div style="text-align:center;margin-top:16px;font-size:11px;color:${T.textTaupe};">Tap a garment to select · Swipe to change style</div>
      </div>
    </div>`;

  const phone3 = await renderInPhone(screen3Html, { phoneBg: "transparent" });
  await saveImage(phone3, resolve(OUT, "3-visualizer.png"));

  // ════════════════════════════════════════════
  // OVERVIEW: Side by side
  // ════════════════════════════════════════════
  console.log("\nCompositing overview...");

  const import_sharp = (await import("sharp")).default;
  const phones = [];
  for (const f of ["1-color-home.png", "2-combinations.png", "3-visualizer.png"]) {
    phones.push(await import_sharp(resolve(OUT, f)).resize(null, 1800, { fit: "inside" }).png().toBuffer());
  }
  const metas = await Promise.all(phones.map(p => import_sharp(p).metadata()));

  const OW = 3400, OH = 2200;
  const gap = 60;
  const totalW = metas.reduce((s, m) => s + (m.width || 0), 0) + gap * 2;
  const startX = Math.round((OW - totalW) / 2);
  const phoneY = 240;

  const labels = ["1. COLOR HOME", "2. COMBINATIONS", "3. OUTFIT VISUALIZER"];
  const descs = [
    "159 Wada colors in a browseable grid\\nwith family filter tabs",
    "Palette strips with favorites, hanger\\nbutton, and Japanese color names",
    "Editorial outfit card with gold selection\\nbar, swipe hints, and share"
  ];

  let annoSvg = `<svg width="${OW}" height="${OH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${OW}" height="${OH}" fill="#111"/>
    <text x="${OW/2}" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" font-weight="500" fill="#c4a265" letter-spacing="5">COMPONENT LIBRARY DEMO</text>
    <text x="${OW/2}" y="120" text-anchor="middle" font-family="Inter,sans-serif" font-size="48" font-weight="700" fill="white">3 Screens, ~80 Lines of Code</text>
    <text x="${OW/2}" y="165" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" fill="#666">Built with reusable components: statusBar() + navBar() + paletteStrip() + outfitCard() + ...</text>`;

  let cx = startX;
  for (let i = 0; i < 3; i++) {
    const w = metas[i].width || 600;
    const centerX = cx + w / 2;
    annoSvg += `<text x="${centerX}" y="${phoneY + 1620}" text-anchor="middle" font-family="Inter,sans-serif" font-size="24" font-weight="600" fill="#c4a265">${labels[i]}</text>`;
    descs[i].split("\\n").forEach((line, li) => {
      annoSvg += `<text x="${centerX}" y="${phoneY + 1660 + li * 28}" text-anchor="middle" font-family="Inter,sans-serif" font-size="18" fill="#666">${line}</text>`;
    });
    if (i < 2) {
      const arrowX = cx + w + gap / 2;
      annoSvg += `<text x="${arrowX}" y="${phoneY + 800}" text-anchor="middle" font-size="28" fill="#c4a265" opacity="0.6">→</text>`;
    }
    cx += w + gap;
  }
  annoSvg += `<text x="${OW/2}" y="${OH - 30}" text-anchor="middle" font-family="Inter,sans-serif" font-size="18" fill="#444" letter-spacing="3">OUTFINDER DESIGN TOOLKIT</text></svg>`;

  const annoBuf = await htmlToPng(`<div style="width:${OW}px;height:${OH}px;"><img src="data:image/svg+xml;base64,${Buffer.from(annoSvg).toString("base64")}" width="${OW}" height="${OH}"/></div>`, OW, OH);

  // Build overview with sharp
  const overviewBg = await import_sharp({ create: { width: OW, height: OH, channels: 4, background: { r: 17, g: 17, b: 17, alpha: 255 } } }).png().toBuffer();

  const composites = [{ input: annoBuf, left: 0, top: 0 }];
  cx = startX;
  for (let i = 0; i < 3; i++) {
    composites.push({ input: phones[i], left: cx, top: phoneY });
    cx += (metas[i].width || 600) + gap;
  }

  const overviewBuf = await import_sharp(overviewBg).composite(composites).png().toBuffer();
  await saveImage(overviewBuf, resolve(OUT, "overview.png"));

  await closeRenderer();
  console.log(`\n🎨 Done! All files in: ${OUT}`);
}

main().catch(console.error);
