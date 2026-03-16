#!/usr/bin/env node
/**
 * Generate brand assets for breacher.net from the BreacherLogo SVG.
 *
 * Outputs:
 *   public/favicon.ico          — 16×16 + 32×32 ICO
 *   public/favicon-16x16.png    — 16×16 PNG
 *   public/favicon-32x32.png    — 32×32 PNG
 *   public/apple-touch-icon.png — 180×180 PNG (padded on brand bg)
 *   public/icon-192.png         — 192×192 PNG (PWA icon)
 *   public/icon-512.png         — 512×512 PNG (PWA icon)
 *   public/og-image.png         — 1200×630 OG image with logo + text
 *   src/app/favicon.ico         — copy for Next.js app router
 *
 * Usage: node scripts/generate-assets.mjs
 *
 * Requires: sharp (available via next dependency)
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const APP = join(ROOT, "src", "app");

// Brand colors
const BG_COLOR = "#031A22";
const ACCENT = "#038ADF";
const ACCENT2 = "#00D4EB";
const MINT = "#00FF9D";

// Source SVG path — from community-ops (copy it in, or reference directly)
const SVG_PATH =
  process.env.LOGO_SVG ||
  join(ROOT, "..", "community-ops", "assets", "svg", "BreacherLogo.svg");

const svgBuffer = readFileSync(SVG_PATH);

// ============================================================
// Helper: Create ICO from multiple PNG buffers
// ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
// ============================================================
function createIco(pngBuffers, sizes) {
  // ICO header: 6 bytes
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;

  let dataOffset = headerSize + dirSize;
  const entries = [];
  for (let i = 0; i < numImages; i++) {
    const size = sizes[i];
    entries.push({
      width: size === 256 ? 0 : size, // 0 means 256
      height: size === 256 ? 0 : size,
      dataSize: pngBuffers[i].length,
      dataOffset,
    });
    dataOffset += pngBuffers[i].length;
  }

  const totalSize = dataOffset;
  const ico = Buffer.alloc(totalSize);

  // Header
  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // ICO type
  ico.writeUInt16LE(numImages, 4); // number of images

  // Directory entries
  for (let i = 0; i < numImages; i++) {
    const offset = headerSize + i * dirEntrySize;
    ico.writeUInt8(entries[i].width, offset); // width
    ico.writeUInt8(entries[i].height, offset + 1); // height
    ico.writeUInt8(0, offset + 2); // color palette
    ico.writeUInt8(0, offset + 3); // reserved
    ico.writeUInt16LE(1, offset + 4); // color planes
    ico.writeUInt16LE(32, offset + 6); // bits per pixel
    ico.writeUInt32LE(entries[i].dataSize, offset + 8); // data size
    ico.writeUInt32LE(entries[i].dataOffset, offset + 12); // data offset
  }

  // Image data
  for (let i = 0; i < numImages; i++) {
    pngBuffers[i].copy(ico, entries[i].dataOffset);
  }

  return ico;
}

// ============================================================
// Helper: Render SVG at a specific size with optional padding
// ============================================================
async function renderSvgAt(size, padding = 0) {
  const innerSize = size - padding * 2;
  const logo = await sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  if (padding > 0) {
    return sharp(logo)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: BG_COLOR,
      })
      .png()
      .toBuffer();
  }
  return logo;
}

// ============================================================
// Generate favicon PNGs and ICO
// ============================================================
async function generateFavicons() {
  console.log("Generating favicons...");

  const png16 = await renderSvgAt(16);
  const png32 = await renderSvgAt(32);

  writeFileSync(join(PUBLIC, "favicon-16x16.png"), png16);
  writeFileSync(join(PUBLIC, "favicon-32x32.png"), png32);
  console.log("  ✓ favicon-16x16.png, favicon-32x32.png");

  // ICO with both sizes
  const ico = createIco([png16, png32], [16, 32]);
  writeFileSync(join(PUBLIC, "favicon.ico"), ico);
  // Also copy to src/app/ for Next.js app router
  copyFileSync(join(PUBLIC, "favicon.ico"), join(APP, "favicon.ico"));
  console.log("  ✓ favicon.ico (public/ + src/app/)");
}

// ============================================================
// Generate apple-touch-icon (180×180 with padding on brand bg)
// ============================================================
async function generateAppleTouchIcon() {
  console.log("Generating apple-touch-icon...");

  // Logo at 140px centered on 180×180 dark background
  const logo = await sharp(svgBuffer)
    .resize(140, 140, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const icon = await sharp({
    create: { width: 180, height: 180, channels: 4, background: BG_COLOR },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();

  writeFileSync(join(PUBLIC, "apple-touch-icon.png"), icon);
  console.log("  ✓ apple-touch-icon.png (180×180)");
}

// ============================================================
// Generate PWA icons (192 and 512)
// ============================================================
async function generatePwaIcons() {
  console.log("Generating PWA icons...");

  for (const size of [192, 512]) {
    const padding = Math.round(size * 0.12); // ~12% padding
    const logo = await sharp(svgBuffer)
      .resize(size - padding * 2, size - padding * 2, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const icon = await sharp({
      create: { width: size, height: size, channels: 4, background: BG_COLOR },
    })
      .composite([{ input: logo, gravity: "centre" }])
      .png()
      .toBuffer();

    writeFileSync(join(PUBLIC, `icon-${size}.png`), icon);
    console.log(`  ✓ icon-${size}.png`);
  }
}

// ============================================================
// Generate OG image (1200×630) — logo + BREACH//NET text
// ============================================================
async function generateOgImage() {
  console.log("Generating OG image...");

  const width = 1200;
  const height = 630;

  // Render logo at a good size for the OG image
  const logoSize = 200;
  const logo = await sharp(svgBuffer)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Create the text overlay as SVG
  const textSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${ACCENT};stop-opacity:0.15" />
          <stop offset="100%" style="stop-color:${MINT};stop-opacity:0.05" />
        </linearGradient>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${ACCENT}" />
          <stop offset="100%" style="stop-color:${ACCENT2}" />
        </linearGradient>
      </defs>

      <!-- Subtle gradient overlay -->
      <rect width="${width}" height="${height}" fill="url(#grad)" />

      <!-- Top accent line -->
      <rect x="0" y="0" width="${width}" height="3" fill="url(#textGrad)" />

      <!-- Bottom accent line -->
      <rect x="0" y="${height - 3}" width="${width}" height="3" fill="url(#textGrad)" />

      <!-- BREACH//NET title -->
      <text x="${width / 2}" y="${height / 2 + 60}"
            font-family="'Space Grotesk', 'Arial Black', sans-serif"
            font-size="72" font-weight="900" letter-spacing="8"
            fill="${ACCENT}" text-anchor="middle">
        BREACH<tspan fill="${ACCENT2}">//</tspan>NET
      </text>

      <!-- Subtitle -->
      <text x="${width / 2}" y="${height / 2 + 110}"
            font-family="'JetBrains Mono', monospace"
            font-size="18" letter-spacing="6"
            fill="#5A8A9A" text-anchor="middle">
        BREACHERS OF TOMORROW
      </text>

      <!-- Tagline -->
      <text x="${width / 2}" y="${height / 2 + 150}"
            font-family="'JetBrains Mono', monospace"
            font-size="14" letter-spacing="3"
            fill="#3A6A7A" text-anchor="middle">
        COMMUNITY HUB FOR THE MARATHON ARG
      </text>

      <!-- Corner decorations -->
      <line x1="30" y1="30" x2="80" y2="30" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
      <line x1="30" y1="30" x2="30" y2="80" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
      <line x1="${width - 30}" y1="30" x2="${width - 80}" y2="30" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
      <line x1="${width - 30}" y1="30" x2="${width - 30}" y2="80" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
      <line x1="30" y1="${height - 30}" x2="80" y2="${height - 30}" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
      <line x1="30" y1="${height - 30}" x2="30" y2="${height - 80}" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
      <line x1="${width - 30}" y1="${height - 30}" x2="${width - 80}" y2="${height - 30}" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
      <line x1="${width - 30}" y1="${height - 30}" x2="${width - 30}" y2="${height - 80}" stroke="${ACCENT}" stroke-width="1" opacity="0.4" />
    </svg>
  `);

  // Compose: dark background + text overlay + logo
  const ogImage = await sharp({
    create: { width, height, channels: 4, background: BG_COLOR },
  })
    .composite([
      { input: textSvg, top: 0, left: 0 },
      {
        input: logo,
        top: Math.round(height / 2 - logoSize - 30), // Above the text
        left: Math.round(width / 2 - logoSize / 2),
      },
    ])
    .png({ quality: 90 })
    .toBuffer();

  writeFileSync(join(PUBLIC, "og-image.png"), ogImage);
  console.log("  ✓ og-image.png (1200×630)");
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log("=== breacher.net asset generator ===\n");
  console.log(`Source SVG: ${SVG_PATH}\n`);

  await generateFavicons();
  await generateAppleTouchIcon();
  await generatePwaIcons();
  await generateOgImage();

  console.log("\n✅ All assets generated successfully.");
  console.log("   Run 'npm run build' to verify.");
}

main().catch((err) => {
  console.error("Asset generation failed:", err);
  process.exit(1);
});
