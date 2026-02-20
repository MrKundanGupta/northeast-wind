#!/usr/bin/env node
/**
 * fetch-images.mjs
 *
 * Reads every MDX content file, uses Google Places API to:
 *   1. Find the Google Place (Text Search) → get place_id + Maps URL
 *   2. Download up to 3 photos per place (Place Photos)
 *   3. Convert to WebP via sharp
 *   4. Save to  public/images/[city-slug]/[place-id]/
 *   5. Update MDX frontmatter: map_location.Maps_url, images, hub_images
 *
 * Usage:
 *   GOOGLE_API_KEY=your-key node scripts/fetch-images.mjs
 *
 * Options:
 *   --dry-run        Show what would happen, don't download or write
 *   --limit N        Process only first N places
 *   --skip-existing  Skip places that already have 3+ downloaded images
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src/content/places");
const PUBLIC_IMAGES = path.join(ROOT, "public/images");

const API_KEY = process.env.GOOGLE_API_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_EXISTING = process.argv.includes("--skip-existing");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : Infinity;
})();

const PHOTOS_PER_PLACE = 3;
const PHOTO_MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;
const RATE_LIMIT_MS = 200; // delay between API calls

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Parse frontmatter + body from MDX file content. */
function parseMDX(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return { yaml: match[1], body: content.slice(match[0].length), fullMatch: match[0] };
}

/** Extract a simple scalar field from YAML text. */
function extractField(yaml, regex) {
  const m = yaml.match(regex);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

/* ------------------------------------------------------------------ */
/*  Google Places API                                                  */
/* ------------------------------------------------------------------ */

/**
 * Text Search → returns { place_id, mapsUrl, photoRefs[] }
 */
async function searchPlace(name, city, lat, lng) {
  const query = `${name}, ${city}`;
  const url = "https://maps.googleapis.com/maps/api/place/textsearch/json";

  const resp = await axios.get(url, {
    params: {
      query,
      location: `${lat},${lng}`,
      radius: 5000,
      key: API_KEY,
    },
  });

  const result = resp.data.results?.[0];
  if (!result) return null;

  const photoRefs = (result.photos || [])
    .slice(0, PHOTOS_PER_PLACE)
    .map((p) => p.photo_reference);

  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${result.place_id}`;

  return { place_id: result.place_id, mapsUrl, photoRefs };
}

/**
 * Download a Place Photo by reference → returns Buffer.
 */
async function downloadPhoto(photoRef) {
  const url = "https://maps.googleapis.com/maps/api/place/photo";
  const resp = await axios.get(url, {
    params: {
      maxwidth: PHOTO_MAX_WIDTH,
      photo_reference: photoRef,
      key: API_KEY,
    },
    responseType: "arraybuffer",
  });
  return Buffer.from(resp.data);
}

/* ------------------------------------------------------------------ */
/*  Image processing                                                   */
/* ------------------------------------------------------------------ */

async function convertToWebP(buffer) {
  return sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
}

/* ------------------------------------------------------------------ */
/*  Frontmatter updater                                                */
/* ------------------------------------------------------------------ */

/**
 * Replace or insert a scalar field in YAML.
 * Handles both quoted and unquoted values.
 */
function upsertScalarField(yaml, indent, fieldName, value) {
  const regex = new RegExp(`^(${indent}${fieldName}:\\s*).*$`, "m");
  const newLine = `${indent}${fieldName}: "${value}"`;
  if (regex.test(yaml)) {
    return yaml.replace(regex, newLine);
  }
  return yaml + "\n" + newLine;
}

/**
 * Replace the Maps_url inside the map_location block.
 */
function updateMapsUrl(yaml, newUrl) {
  return yaml.replace(
    /^(\s+Maps_url:\s*).*$/m,
    `$1"${newUrl}"`
  );
}

/**
 * Replace an array field in YAML with new items.
 */
function replaceArrayField(yaml, fieldName, items) {
  // Match the field and its indented list items
  const regex = new RegExp(
    `^${fieldName}:\\n(?:\\s+-\\s+.+\\n?)*`,
    "m"
  );
  const newBlock =
    `${fieldName}:\n` + items.map((i) => `  - ${i}`).join("\n") + "\n";

  if (regex.test(yaml)) {
    return yaml.replace(regex, newBlock);
  }
  return yaml + "\n" + newBlock;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  if (!API_KEY) {
    console.error("ERROR: Set GOOGLE_API_KEY environment variable.");
    console.error("  GOOGLE_API_KEY=AIza... node scripts/fetch-images.mjs");
    process.exit(1);
  }

  console.log(`\n  Google Places Image Fetcher`);
  console.log(`  ${DRY_RUN ? "DRY RUN — no files will be modified" : "LIVE RUN"}`);
  console.log(`  Content dir: ${CONTENT_DIR}`);
  console.log(`  Output dir:  ${PUBLIC_IMAGES}\n`);

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  const toProcess = files.slice(0, LIMIT);

  console.log(`  Found ${files.length} places, processing ${toProcess.length}\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of toProcess) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseMDX(content);
    if (!parsed) { console.log(`  SKIP (no frontmatter): ${file}`); skipped++; continue; }

    const { yaml, body } = parsed;
    const placeId = extractField(yaml, /^id:\s*(.+)$/m);
    const name = extractField(yaml, /^name:\s*(.+)$/m);
    const city = extractField(yaml, /^city:\s*(.+)$/m);
    const lat = extractField(yaml, /^\s+lat:\s*([\d.]+)/m);
    const lng = extractField(yaml, /^\s+lng:\s*([\d.]+)/m);

    if (!name || !lat || !lng) {
      console.log(`  SKIP (missing data): ${file}`);
      skipped++;
      continue;
    }

    const citySlug = slugify(city || name.split(" ")[0]);
    const imageDir = path.join(PUBLIC_IMAGES, citySlug, placeId);
    const relDir = `/images/${citySlug}/${placeId}`;

    // Check existing images
    if (SKIP_EXISTING && fs.existsSync(imageDir)) {
      const existing = fs.readdirSync(imageDir).filter((f) => f.endsWith(".webp"));
      if (existing.length >= PHOTOS_PER_PLACE) {
        console.log(`  SKIP (${existing.length} images exist): ${name}`);
        skipped++;
        continue;
      }
    }

    console.log(`  [${success + failed + skipped + 1}/${toProcess.length}] ${name} (${city})`);

    try {
      // 1. Search Google Places
      const placeData = await searchPlace(name, city || "", lat, lng);
      await sleep(RATE_LIMIT_MS);

      if (!placeData) {
        console.log(`    ⨉ Not found on Google Places`);
        failed++;
        continue;
      }

      console.log(`    ✓ Found place_id: ${placeData.place_id} (${placeData.photoRefs.length} photos)`);

      if (placeData.photoRefs.length === 0) {
        console.log(`    ⨉ No photos available`);
        failed++;
        continue;
      }

      // 2. Download + convert photos
      const imagePaths = [];

      if (!DRY_RUN) {
        fs.mkdirSync(imageDir, { recursive: true });
      }

      for (let i = 0; i < placeData.photoRefs.length; i++) {
        const ref = placeData.photoRefs[i];
        const filename = `${placeId}-${i + 1}.webp`;
        const localPath = path.join(imageDir, filename);
        const publicPath = `${relDir}/${filename}`;

        if (!DRY_RUN) {
          const raw = await downloadPhoto(ref);
          await sleep(RATE_LIMIT_MS);
          const webp = await convertToWebP(raw);
          fs.writeFileSync(localPath, webp);
          const sizeKB = (webp.length / 1024).toFixed(0);
          console.log(`    ✓ ${filename} (${sizeKB} KB)`);
        } else {
          console.log(`    → would save ${filename}`);
        }

        imagePaths.push(publicPath);
      }

      // Pad to 3 if fewer photos available (duplicate last)
      while (imagePaths.length < PHOTOS_PER_PLACE && imagePaths.length > 0) {
        imagePaths.push(imagePaths[imagePaths.length - 1]);
      }

      // 3. Update frontmatter
      if (!DRY_RUN) {
        let updatedYaml = yaml;

        // Update map_location.Maps_url
        updatedYaml = updateMapsUrl(updatedYaml, placeData.mapsUrl);

        // Update images array
        updatedYaml = replaceArrayField(updatedYaml, "images", imagePaths);

        // Update hub_images array
        updatedYaml = replaceArrayField(updatedYaml, "hub_images", imagePaths);

        const newContent = "---\n" + updatedYaml + "\n---" + body;
        fs.writeFileSync(filePath, newContent, "utf-8");
        console.log(`    ✓ Frontmatter updated`);
      }

      success++;
    } catch (err) {
      console.log(`    ⨉ Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n  Done: ${success} OK, ${skipped} skipped, ${failed} failed.\n`);
}

main();
