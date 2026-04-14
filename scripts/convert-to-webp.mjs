/**
 * Axomor — Bulk image → WebP conversion
 * Run: node scripts/convert-to-webp.mjs
 *
 * Converts all JPG/PNG in public/images/ to WebP alongside originals.
 * Also converts logos. Skips files that already have a .webp counterpart.
 */

import { createRequire } from 'module';
import { readdir, stat } from 'fs/promises';
import { join, extname, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const IMAGES_DIR = join(PUBLIC_DIR, 'images');

const QUALITY = 82;
const MAX_DIMENSION = 1200; // px — max width or height; never upscales

let converted = 0;
let skipped = 0;
let errors = 0;

async function* walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function convertToWebP(inputPath) {
  const ext = extname(inputPath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  const outputPath = inputPath.replace(/\.(jpe?g|png)$/i, '.webp');

  // Skip if WebP already exists
  try {
    await stat(outputPath);
    skipped++;
    return;
  } catch {
    // File doesn't exist — proceed with conversion
  }

  try {
    await sharp(inputPath)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    converted++;
    if (converted % 50 === 0) {
      process.stdout.write(`  ${converted} converted...\n`);
    }
  } catch (err) {
    errors++;
    console.error(`  ✗ Failed: ${inputPath.split('/public/')[1]} — ${err.message}`);
  }
}

async function run() {
  console.log('Converting images to WebP...\n');
  const start = Date.now();

  // Convert all place images
  for await (const filePath of walkDir(IMAGES_DIR)) {
    await convertToWebP(filePath);
  }

  // Convert logos
  for (const logo of ['logo_full.png', 'logo_icon.png']) {
    await convertToWebP(join(PUBLIC_DIR, logo));
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s`);
  console.log(`  ✓ Converted: ${converted}`);
  console.log(`  → Skipped (already exists): ${skipped}`);
  console.log(`  ✗ Errors: ${errors}`);
}

run().catch(console.error);
