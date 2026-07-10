// Captures REAL app screenshots for the PWA manifest.
// Requires the app to be running (default http://localhost:5000).
// Run:  node scripts/capture-screenshots.mjs [baseUrl]
// Output: client/public/screenshot-desktop.png (1440x1024, wide)
//         client/public/screenshot-mobile.png  (1080x1920, portrait)

import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "client", "public");
const BASE = process.argv[2] || "http://localhost:5000";

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  // Give charts / data tables a moment to paint.
  await page.waitForTimeout(2500);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // --- Desktop (wide, 1440x1024, 1x) ---
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    deviceScaleFactor: 1,
  });
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await settle(dPage);
  await dPage.screenshot({ path: resolve(OUT, "screenshot-desktop.png") });
  await desktop.close();

  // --- Mobile (portrait, 1080x1920 => logical 360x640 @ 3x) ---
  const mobile = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobile.newPage();
  await mPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await settle(mPage);
  await mPage.screenshot({ path: resolve(OUT, "screenshot-mobile.png") });
  await mobile.close();

  await browser.close();
  console.log("✔ Screenshots written to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
