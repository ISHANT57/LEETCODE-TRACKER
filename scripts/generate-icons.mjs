// Generates all PWA / Android / favicon assets from a single master SVG.
// Run: node scripts/generate-icons.mjs
// Output: client/public/*  (Vite copies this verbatim into dist/public)
//
// Brand mark matches the sidebar: lucide "Code2" glyph (`< >` + slash) in white
// on a blue->indigo rounded square. Brand blue = #2563eb, indigo = #4f46e5,
// dark surface = #0f172a.

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "client", "public");

// The lucide "Code2" glyph, drawn with round caps/joins, centered in a 512 box.
// Rendered at a nominal 24px viewBox then scaled — we hand-scale the points so
// the stroke stays crisp at large sizes.
function code2Glyph({ size = 512, stroke = "#ffffff", inset = 0.30 } = {}) {
  // Map lucide's 24px coordinate space into our `size` box, leaving `inset`
  // padding on each side so the glyph occupies the middle (1 - 2*inset).
  const scale = (size * (1 - 2 * inset)) / 24;
  const off = size * inset;
  const p = (x, y) => `${(x * scale + off).toFixed(2)} ${(y * scale + off).toFixed(2)}`;
  const sw = (size / 24) * 2 * (1 - 2 * inset); // proportional stroke width
  return `
    <g fill="none" stroke="${stroke}" stroke-width="${sw.toFixed(2)}"
       stroke-linecap="round" stroke-linejoin="round">
      <polyline points="${p(18, 16)} ${p(22, 12)} ${p(18, 8)}" />
      <polyline points="${p(6, 8)} ${p(2, 12)} ${p(6, 16)}" />
      <line x1="${(14.5 * scale + off).toFixed(2)}" y1="${(4 * scale + off).toFixed(2)}"
            x2="${(9.5 * scale + off).toFixed(2)}" y2="${(20 * scale + off).toFixed(2)}" />
    </g>`;
}

// Full brand tile: rounded gradient square + glyph. `radius` as fraction of size.
function brandSVG({ size = 512, radius = 0.22, glyphInset = 0.30, bg = true } = {}) {
  const r = size * radius;
  const bgRect = bg
    ? `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#g)" />`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#4f46e5" />
      </linearGradient>
    </defs>
    ${bgRect}
    ${code2Glyph({ size, inset: glyphInset })}
  </svg>`;
}

// Maskable: full-bleed background (no rounded corners), glyph kept inside the
// ~80% safe zone so Android's circle/squircle mask never clips it.
function maskableSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#4f46e5" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)" />
    ${code2Glyph({ size, inset: 0.34 })}
  </svg>`;
}

// Monochrome: single-color glyph on transparent (for Android themed icons).
function monochromeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${code2Glyph({ size, stroke: "#ffffff", inset: 0.28 })}
  </svg>`;
}

async function svgToPng(svg, size, file) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(resolve(OUT, file), buf);
  return buf;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // Standard "any" icons — opaque brand tile.
  const anySizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const s of anySizes) {
    await svgToPng(brandSVG({ size: s }), s, `icon-${s}.png`);
  }

  // Maskable (padded safe zone).
  for (const s of [192, 512]) {
    await svgToPng(maskableSVG(s), s, `maskable-icon-${s}.png`);
  }

  // Monochrome (transparent).
  await svgToPng(monochromeSVG(512), 512, "monochrome-icon.png");

  // Apple touch icon — 180x180, opaque (iOS renders black behind transparency).
  await svgToPng(brandSVG({ size: 180 }), 180, "apple-touch-icon.png");

  // Favicons.
  const fav32 = await svgToPng(brandSVG({ size: 32, radius: 0.18, glyphInset: 0.22 }), 32, "favicon-32.png");
  const fav16 = await svgToPng(brandSVG({ size: 16, radius: 0.15, glyphInset: 0.20 }), 16, "favicon-16.png");
  const ico = await pngToIco([fav16, fav32]);
  await writeFile(resolve(OUT, "favicon.ico"), ico);

  // Keep a crisp SVG source available too.
  await writeFile(resolve(OUT, "icon.svg"), brandSVG({ size: 512 }));

  console.log("✔ Icons written to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
