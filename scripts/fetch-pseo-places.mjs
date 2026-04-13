#!/usr/bin/env node
/**
 * fetch-pseo-places.mjs
 *
 * Fetches Google Places data for the programmatic SEO "near me" pages.
 * Reads city + category config from pseo-config.json, queries Google Places
 * Text Search API, downloads photos, converts to WebP, and writes results
 * to pseo-places.json.
 *
 * Usage:
 *   GOOGLE_API_KEY=AIza... node scripts/fetch-pseo-places.mjs [options]
 *
 * Options:
 *   --dry-run        Show what would happen, don't download or write
 *   --limit N        Process first N cities only
 *   --city SLUG      Process a single city
 *   --skip-existing  Skip city+category combos that already have data
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "src/data/pseo-config.json");
const OUTPUT_PATH = path.join(ROOT, "src/data/pseo-places.json");
const PUBLIC_IMAGES = path.join(ROOT, "public/images/pseo");

const API_KEY = process.env.GOOGLE_API_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_EXISTING = process.argv.includes("--skip-existing");

const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : Infinity;
})();

const CITY_FILTER = (() => {
  const idx = process.argv.indexOf("--city");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const MAX_RESULTS = 10;
const PHOTO_MAX_WIDTH = 800;
const WEBP_QUALITY = 80;
const RATE_LIMIT_MS = 200;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------------ */
/*  Google Places API                                                  */
/* ------------------------------------------------------------------ */

async function textSearch(query, lat, lng, type) {
  const url = "https://maps.googleapis.com/maps/api/place/textsearch/json";
  const resp = await axios.get(url, {
    params: {
      query,
      location: `${lat},${lng}`,
      radius: 5000,
      type,
      key: API_KEY,
    },
  });
  return (resp.data.results || []).slice(0, MAX_RESULTS);
}

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

async function convertToWebP(buffer) {
  return sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  if (!API_KEY && !DRY_RUN) {
    console.error("ERROR: Set GOOGLE_API_KEY environment variable.");
    console.error("  GOOGLE_API_KEY=AIza... node scripts/fetch-pseo-places.mjs");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  let output = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));

  // Filter to google-sourced categories only
  const googleCategories = config.categories.filter((c) => c.source === "google");

  // Filter cities
  let citiesToProcess = config.cities;
  if (CITY_FILTER) {
    citiesToProcess = citiesToProcess.filter((c) => c.slug === CITY_FILTER);
    if (citiesToProcess.length === 0) {
      console.error(`ERROR: City "${CITY_FILTER}" not found in config.`);
      process.exit(1);
    }
  }
  citiesToProcess = citiesToProcess.slice(0, LIMIT);

  console.log(`\n  PSEO Google Places Fetcher`);
  console.log(`  ${DRY_RUN ? "DRY RUN — no files will be modified" : "LIVE RUN"}`);
  console.log(`  Cities: ${citiesToProcess.length}, Categories: ${googleCategories.length}`);
  console.log(`  Output: ${OUTPUT_PATH}\n`);

  let totalFetched = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const city of citiesToProcess) {
    console.log(`\n  ── ${city.name} (${city.state}) ──`);

    if (!output.places[city.slug]) {
      output.places[city.slug] = {};
    }

    for (const cat of googleCategories) {
      const existing = output.places[city.slug][cat.slug];

      if (SKIP_EXISTING && existing && existing.length > 0) {
        console.log(`    SKIP ${cat.label} (${existing.length} exist)`);
        totalSkipped++;
        continue;
      }

      const query = `best ${cat.label} in ${city.name}`;
      console.log(`    ${cat.label}: searching "${query}" (type: ${cat.googlePlaceType})`);

      if (DRY_RUN) {
        console.log(`      → would fetch up to ${MAX_RESULTS} results`);
        totalSkipped++;
        continue;
      }

      try {
        const results = await textSearch(query, city.lat, city.lng, cat.googlePlaceType);
        await sleep(RATE_LIMIT_MS);

        if (results.length === 0) {
          console.log(`      ⨉ No results`);
          output.places[city.slug][cat.slug] = [];
          totalFailed++;
          continue;
        }

        console.log(`      ✓ Found ${results.length} results`);

        const places = [];
        const imageDir = path.join(PUBLIC_IMAGES, city.slug, cat.slug);
        fs.mkdirSync(imageDir, { recursive: true });

        for (const r of results) {
          const photos = [];

          // Download first photo if available
          if (r.photos && r.photos.length > 0) {
            try {
              const ref = r.photos[0].photo_reference;
              const filename = `${slugify(r.name).slice(0, 40)}.webp`;
              const localPath = path.join(imageDir, filename);
              const publicPath = `/images/pseo/${city.slug}/${cat.slug}/${filename}`;

              const raw = await downloadPhoto(ref);
              await sleep(RATE_LIMIT_MS);
              const webp = await convertToWebP(raw);
              fs.writeFileSync(localPath, webp);

              const sizeKB = (webp.length / 1024).toFixed(0);
              console.log(`        📷 ${filename} (${sizeKB} KB)`);
              photos.push(publicPath);
            } catch (photoErr) {
              console.log(`        ⨉ Photo error: ${photoErr.message}`);
            }
          }

          places.push({
            name: r.name,
            place_id: r.place_id,
            address: r.formatted_address || "",
            lat: r.geometry?.location?.lat || 0,
            lng: r.geometry?.location?.lng || 0,
            rating: r.rating || 0,
            reviewCount: r.user_ratings_total || 0,
            photos,
            types: r.types || [],
          });
        }

        output.places[city.slug][cat.slug] = places;
        totalFetched++;

        // Save after each city+category (crash-safe)
        output.fetchedAt = new Date().toISOString();
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
        console.log(`      ✓ Saved ${places.length} places`);
      } catch (err) {
        console.log(`      ⨉ Error: ${err.message}`);
        totalFailed++;
      }
    }
  }

  console.log(`\n  Done: ${totalFetched} fetched, ${totalSkipped} skipped, ${totalFailed} failed.\n`);
}

main();
