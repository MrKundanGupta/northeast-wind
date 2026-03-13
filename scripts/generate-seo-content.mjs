#!/usr/bin/env node
/**
 * generate-seo-content.mjs
 *
 * Generates unique 150-word SEO descriptions for:
 *   1. Place pages  → replaces ## About section in MDX body
 *   2. City hubs    → writes to src/data/seo-descriptions.json
 *   3. Niche pages  → writes to src/data/seo-descriptions.json
 *
 * Uses Claude API via @anthropic-ai/sdk (claude-3-5-haiku).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-seo-content.mjs [options]
 *
 * Options:
 *   --dry-run          Preview prompts without calling API or writing files
 *   --limit N          Process only first N items per type
 *   --skip-existing    Skip items that already have generated content
 *   --type TYPE        "places", "cities", "niches", or "all" (default: all)
 *   --delay MS         Delay between API calls in ms (default: 500)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src/content/places");
const DATA_DIR = path.join(ROOT, "src/data");
const JSON_PATH = path.join(DATA_DIR, "seo-descriptions.json");

/* ── CLI args ────────────────────────────────────────────────────────── */

const API_KEY = process.env.ANTHROPIC_API_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_EXISTING = process.argv.includes("--skip-existing");

const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : Infinity;
})();

const TYPE = (() => {
  const idx = process.argv.indexOf("--type");
  return idx !== -1 ? process.argv[idx + 1] : "all";
})();

const DELAY = (() => {
  const idx = process.argv.indexOf("--delay");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : 500;
})();

/* ── Helpers ─────────────────────────────────────────────────────────── */

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

/** Extract a YAML array field (lines starting with "  - "). */
function extractArray(yaml, fieldName) {
  const regex = new RegExp(`^${fieldName}:\\n((?:\\s+-\\s+.+\\n?)*)`, "m");
  const m = yaml.match(regex);
  if (!m) return [];
  return m[1].split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^\s*-\s*/, "").replace(/^["']|["']$/g, "").trim());
}

/** Extract logistics array (multi-line YAML blocks). */
function extractLogistics(yaml) {
  const results = [];
  const regex = /- hub_name:\s*["']?(.+?)["']?\n\s+hub_type:\s*(\w+)\n\s+distance_km:\s*(\d+)\n\s+drive_time_mins:\s*(\d+)/g;
  let m;
  while ((m = regex.exec(yaml)) !== null) {
    results.push({
      hub_name: m[1],
      hub_type: m[2],
      distance_km: parseInt(m[3], 10),
      drive_time_mins: parseInt(m[4], 10),
    });
  }
  return results;
}

/** Template text marker — if present, the About section hasn't been customized yet. */
const TEMPLATE_MARKER = "it draws visitors looking for an authentic Northeast Indian experience";

/* ── Load JSON file (crash-safe resume) ──────────────────────────────── */

function loadJSON() {
  if (fs.existsSync(JSON_PATH)) {
    return JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  }
  return { cityHubs: {}, nicheIntersects: {} };
}

function saveJSON(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/* ── Parse all MDX files ─────────────────────────────────────────────── */

function loadAllPlaces() {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  const places = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseMDX(content);
    if (!parsed) continue;

    const { yaml, body } = parsed;

    places.push({
      file,
      filePath,
      body,
      yaml,
      id: extractField(yaml, /^id:\s*(.+)$/m),
      name: extractField(yaml, /^name:\s*(.+)$/m),
      category: extractField(yaml, /^category:\s*(.+)$/m),
      sub_category: extractField(yaml, /^sub_category:\s*(.+)$/m),
      city: extractField(yaml, /^city:\s*(.+)$/m),
      region: extractField(yaml, /^region:\s*(.+)$/m),
      google_rating: extractField(yaml, /^\s+google_rating:\s*(.+)$/m),
      google_reviews_count: extractField(yaml, /^\s+google_reviews_count:\s*(.+)$/m),
      indian_inr: extractField(yaml, /^\s+indian_inr:\s*(.+)$/m),
      foreigner_inr: extractField(yaml, /^\s+foreigner_inr:\s*(.+)$/m),
      best_months: extractArray(yaml, "  best_months"),
      seo_tags: extractArray(yaml, "seo_tags"),
      logistics: extractLogistics(yaml),
    });
  }

  return places;
}

/* ── Build city & niche maps ─────────────────────────────────────────── */

function buildMaps(places) {
  const cityMap = new Map();
  const nicheMap = new Map();

  for (const p of places) {
    const city = p.city;
    // Skip Plus Code cities and very short names
    if (!/^[A-Za-z]/.test(city) || city.length <= 2) continue;

    // City map
    if (!cityMap.has(city)) {
      cityMap.set(city, { name: city, region: p.region, slug: slugify(city), places: [] });
    }
    cityMap.get(city).places.push(p);

    // Niche map
    const nicheKey = `${slugify(city)}/${slugify(p.category)}`;
    if (!nicheMap.has(nicheKey)) {
      nicheMap.set(nicheKey, { city, category: p.category, slug: nicheKey, places: [] });
    }
    nicheMap.get(nicheKey).places.push(p);
  }

  return { cityMap, nicheMap };
}

/* ── Shared system prompt ────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a travel concierge copywriter for Northeast India. Write exactly one paragraph of approximately 150 words (140-160 words).

Rules:
- Travel concierge tone: warm, knowledgeable, inviting
- Weave target keywords naturally (do not stuff)
- Mention at least one logistics detail (distance, transport, travel time)
- No cliches like "hidden gem", "paradise on earth", "must-visit"
- No markdown formatting, no headings, no bullet points
- Output ONLY the paragraph text, nothing else
- Do not start with the place/city name directly — vary your opening`;

/* ── Prompt builders ─────────────────────────────────────────────────── */

function buildPlacePrompt(place) {
  const nearestHub = place.logistics[0];
  const hubInfo = nearestHub
    ? `${nearestHub.hub_name} (${nearestHub.hub_type}) is ${nearestHub.distance_km} km away, about ${nearestHub.drive_time_mins} mins drive`
    : "logistics details unavailable";

  return `Write a 150-word SEO description for this place page:

Name: ${place.name}
City: ${place.city}
Region: ${place.region}
Category: ${place.category}
Sub-category: ${place.sub_category}
SEO tags: ${place.seo_tags.join(", ")}
Nearest transport: ${hubInfo}
Google rating: ${place.google_rating} (${place.google_reviews_count} reviews)
Best months: ${place.best_months.join(", ")}
Entry fees: Indian ${place.indian_inr}, Foreign ${place.foreigner_inr}

Target keywords: "best ${place.category.toLowerCase()} in ${place.city}", "${place.name} ${place.city} travel guide"`;
}

function buildCityPrompt(cityData) {
  const topPlaces = [...cityData.places]
    .sort((a, b) => (parseFloat(b.google_rating) || 0) - (parseFloat(a.google_rating) || 0))
    .slice(0, 3);

  const categories = [...new Set(cityData.places.map((p) => p.category))];

  return `Write a 150-word SEO description for this city hub page:

City: ${cityData.name}
Region: ${cityData.region}
Total places: ${cityData.places.length}
Categories: ${categories.join(", ")}
Top 3 rated places: ${topPlaces.map((p) => `${p.name} (${p.google_rating})`).join(", ")}

Target keywords: "best places to visit in ${cityData.name}", "things to do in ${cityData.name}"`;
}

function buildNichePrompt(nicheData) {
  const sorted = [...nicheData.places]
    .sort((a, b) => (parseFloat(b.google_rating) || 0) - (parseFloat(a.google_rating) || 0));

  const bestMonths = sorted[0]?.best_months.slice(0, 3).join(", ") || "October–March";

  return `Write a 150-word SEO description for this niche category page:

City: ${nicheData.city}
Category: ${nicheData.category}
Number of places: ${nicheData.places.length}
Places: ${sorted.map((p) => `${p.name} (${p.google_rating})`).join(", ")}
Best months to visit: ${bestMonths}

Target keywords: "best ${nicheData.category.toLowerCase()} in ${nicheData.city}", "top ${nicheData.category.toLowerCase()} near ${nicheData.city}"`;
}

/* ── Claude API caller ───────────────────────────────────────────────── */

async function callClaude(client, userPrompt) {
  const response = await client.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content[0].text.trim();
}

/* ── MDX body updater ────────────────────────────────────────────────── */

function replaceAboutSection(body, name, newDescription) {
  // Match: ## About {name}\n\n...content...\n\n## (next heading)
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(## About ${escaped}\\n\\n)[\\s\\S]*?(?=\\n## )`,
    "m"
  );

  if (regex.test(body)) {
    return body.replace(regex, `$1${newDescription}\n`);
  }

  // Fallback: try matching any ## About heading
  const fallbackRegex = /^(## About .+\n\n)[\s\S]*?(?=\n## )/m;
  if (fallbackRegex.test(body)) {
    return body.replace(fallbackRegex, `$1${newDescription}\n`);
  }

  return body;
}

/* ── Main ────────────────────────────────────────────────────────────── */

async function main() {
  if (!API_KEY && !DRY_RUN) {
    console.error("ERROR: Set ANTHROPIC_API_KEY environment variable.");
    console.error("  ANTHROPIC_API_KEY=sk-... node scripts/generate-seo-content.mjs");
    process.exit(1);
  }

  const client = DRY_RUN ? null : new Anthropic({ apiKey: API_KEY });

  console.log(`\n  SEO Content Generator`);
  console.log(`  ${DRY_RUN ? "DRY RUN — no API calls or file writes" : "LIVE RUN"}`);
  console.log(`  Type: ${TYPE} | Limit: ${LIMIT === Infinity ? "none" : LIMIT} | Delay: ${DELAY}ms`);
  console.log(`  Skip existing: ${SKIP_EXISTING}\n`);

  // Load all places
  const allPlaces = loadAllPlaces();
  console.log(`  Loaded ${allPlaces.length} places from MDX files`);

  // Build maps
  const { cityMap, nicheMap } = buildMaps(allPlaces);
  console.log(`  Found ${cityMap.size} cities, ${nicheMap.size} niche combos\n`);

  // Load existing JSON
  const jsonData = loadJSON();

  let totalCalls = 0;

  /* ── Places ──────────────────────────────────────────────────────── */
  if (TYPE === "all" || TYPE === "places") {
    console.log(`  ═══ PLACES ═══`);

    const toProcess = allPlaces.slice(0, LIMIT);
    let done = 0;
    let skipped = 0;

    for (const place of toProcess) {
      // Skip-existing check: body doesn't contain template text
      if (SKIP_EXISTING && !place.body.includes(TEMPLATE_MARKER)) {
        skipped++;
        continue;
      }

      const prompt = buildPlacePrompt(place);

      if (DRY_RUN) {
        console.log(`\n  [${done + skipped + 1}/${toProcess.length}] ${place.name}`);
        console.log(`  PROMPT:\n${prompt.split("\n").map((l) => "    " + l).join("\n")}`);
        done++;
        continue;
      }

      console.log(`  [${done + skipped + 1}/${toProcess.length}] ${place.name}...`);

      try {
        const description = await callClaude(client, prompt);
        totalCalls++;

        // Update MDX body
        const content = fs.readFileSync(place.filePath, "utf-8");
        const parsed = parseMDX(content);
        if (parsed) {
          const newBody = replaceAboutSection(parsed.body, place.name, description);
          const newContent = "---\n" + parsed.yaml + "\n---" + newBody;
          fs.writeFileSync(place.filePath, newContent, "utf-8");
          console.log(`    ✓ Updated About section (${description.split(/\s+/).length} words)`);
        }

        done++;
        await sleep(DELAY);
      } catch (err) {
        console.log(`    ✗ Error: ${err.message}`);
      }
    }

    console.log(`  Places: ${done} updated, ${skipped} skipped\n`);
  }

  /* ── City Hubs ───────────────────────────────────────────────────── */
  if (TYPE === "all" || TYPE === "cities") {
    console.log(`  ═══ CITY HUBS ═══`);

    const cities = [...cityMap.values()].slice(0, LIMIT);
    let done = 0;
    let skipped = 0;

    for (const cityData of cities) {
      const slug = cityData.slug;

      if (SKIP_EXISTING && jsonData.cityHubs[slug]) {
        skipped++;
        continue;
      }

      const prompt = buildCityPrompt(cityData);

      if (DRY_RUN) {
        console.log(`\n  [${done + skipped + 1}/${cities.length}] ${cityData.name}`);
        console.log(`  PROMPT:\n${prompt.split("\n").map((l) => "    " + l).join("\n")}`);
        done++;
        continue;
      }

      console.log(`  [${done + skipped + 1}/${cities.length}] ${cityData.name}...`);

      try {
        const description = await callClaude(client, prompt);
        totalCalls++;

        jsonData.cityHubs[slug] = description;
        saveJSON(jsonData);
        console.log(`    ✓ Saved (${description.split(/\s+/).length} words)`);

        done++;
        await sleep(DELAY);
      } catch (err) {
        console.log(`    ✗ Error: ${err.message}`);
      }
    }

    console.log(`  Cities: ${done} generated, ${skipped} skipped\n`);
  }

  /* ── Niche Intersects ────────────────────────────────────────────── */
  if (TYPE === "all" || TYPE === "niches") {
    console.log(`  ═══ NICHE INTERSECTS ═══`);

    const niches = [...nicheMap.values()].slice(0, LIMIT);
    let done = 0;
    let skipped = 0;

    for (const nicheData of niches) {
      const key = nicheData.slug;

      if (SKIP_EXISTING && jsonData.nicheIntersects[key]) {
        skipped++;
        continue;
      }

      const prompt = buildNichePrompt(nicheData);

      if (DRY_RUN) {
        console.log(`\n  [${done + skipped + 1}/${niches.length}] ${nicheData.city} / ${nicheData.category}`);
        console.log(`  PROMPT:\n${prompt.split("\n").map((l) => "    " + l).join("\n")}`);
        done++;
        continue;
      }

      console.log(`  [${done + skipped + 1}/${niches.length}] ${nicheData.city} / ${nicheData.category}...`);

      try {
        const description = await callClaude(client, prompt);
        totalCalls++;

        jsonData.nicheIntersects[key] = description;
        saveJSON(jsonData);
        console.log(`    ✓ Saved (${description.split(/\s+/).length} words)`);

        done++;
        await sleep(DELAY);
      } catch (err) {
        console.log(`    ✗ Error: ${err.message}`);
      }
    }

    console.log(`  Niches: ${done} generated, ${skipped} skipped\n`);
  }

  console.log(`  Done. Total API calls: ${totalCalls}\n`);
}

main();
