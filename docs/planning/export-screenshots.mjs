import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, 'app-store-screenshots.html');
const outputDir = resolve(__dirname, '..', 'img_screenshot');

async function exportScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
  });

  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  // Wait for fonts to load
  await page.waitForTimeout(2000);

  const screenshots = ['ss1', 'ss2', 'ss3'];
  const names = [
    'appstore-1-outfit-visualizer.png',
    'appstore-2-color-grid.png',
    'appstore-3-combinations.png',
  ];

  for (let i = 0; i < screenshots.length; i++) {
    const el = await page.locator(`#${screenshots[i]}`);
    const path = resolve(outputDir, names[i]);
    await el.screenshot({ path });

    // Verify dimensions
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const { stdout } = await execAsync(`sips -g pixelWidth -g pixelHeight "${path}"`);
    console.log(`${names[i]}:`);
    console.log(stdout.trim());
    console.log('');
  }

  await browser.close();
  console.log(`Done! Files saved to ${outputDir}`);
}

exportScreenshots().catch(console.error);
