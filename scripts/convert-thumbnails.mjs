/**
 * Generate -sm.webp thumbnails (700px max, quality 70) for use in
 * PlaceCard and state card grids. Full-size .webp files (1200px, q82)
 * are kept for place detail hero images.
 */
import { createRequire } from 'module';
import { readdir, stat } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, '..', 'public', 'images');

const MAX_PX = 700;
const QUALITY = 70;

let converted = 0, skipped = 0, errors = 0;

async function* walkDir(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkDir(full);
    else yield full;
  }
}

async function run() {
  console.log(`Generating -sm.webp thumbnails (${MAX_PX}px, q${QUALITY})...\n`);
  const start = Date.now();

  for await (const file of walkDir(IMAGES_DIR)) {
    const ext = extname(file).toLowerCase();
    if (!['.jpg','.jpeg','.png'].includes(ext)) continue;

    const out = file.replace(/\.(jpe?g|png)$/i, '-sm.webp');
    try { await stat(out); skipped++; continue; } catch {}

    try {
      await sharp(file)
        .resize({ width: MAX_PX, height: MAX_PX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);
      converted++;
      if (converted % 100 === 0) process.stdout.write(`  ${converted} done...\n`);
    } catch (e) {
      errors++;
      console.error(`  ✗ ${file.split('/public/')[1]}: ${e.message}`);
    }
  }

  console.log(`\nDone in ${((Date.now()-start)/1000).toFixed(1)}s`);
  console.log(`  ✓ Created: ${converted} | Skipped: ${skipped} | Errors: ${errors}`);
}

run().catch(console.error);
