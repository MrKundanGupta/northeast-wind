/**
 * Generate MDX content files from places.json
 * Run: node generate-mdx.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const PLACES_JSON = join("..", "places.json");
const OUTPUT_DIR = join("src", "content", "places");

// Read places.json
const data = JSON.parse(readFileSync(PLACES_JSON, "utf-8"));
const places = data.places;

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

// Generate body content for each place
function generateBody(place) {
  const lines = [];

  lines.push(`## About ${place.name}`);
  lines.push("");
  lines.push(
    `${place.name} is a popular **${place.category}** destination located in **${place.location.state}**, Northeast India. ` +
      `Categorized as *${place.sub_category}*, it draws visitors looking for an authentic Northeast Indian experience.`
  );
  lines.push("");

  // Entry fees section
  lines.push(`## Entry Fees`);
  lines.push("");
  lines.push(`| Visitor Type | Fee |`);
  lines.push(`|---|---|`);
  lines.push(`| Indian Nationals | ${place.entry_fees.indian_inr} |`);
  lines.push(`| Foreign Nationals | ${place.entry_fees.foreigner_inr} |`);
  if (place.entry_fees.special_entry_notes) {
    lines.push("");
    lines.push(`> ${place.entry_fees.special_entry_notes}`);
  }
  lines.push("");

  // How to reach
  lines.push(`## How to Reach`);
  lines.push("");
  for (const hub of place.logistics) {
    const icon = hub.hub_type === "airport" ? "By Air" : "By Train";
    lines.push(
      `- **${icon}:** ${hub.hub_name} — approximately ${hub.distance_km} km (${hub.drive_time_mins} mins drive)`
    );
  }
  lines.push("");

  // Best time to visit
  lines.push(`## Best Time to Visit`);
  lines.push("");
  lines.push(`The ideal months to visit are **${place.seasonality.best_months.join(", ")}**.`);
  if (place.seasonality.peak_events.length > 0) {
    lines.push("");
    lines.push(`### Events & Festivals`);
    lines.push("");
    for (const event of place.seasonality.peak_events) {
      lines.push(`- ${event}`);
    }
  }
  lines.push("");

  // Permits
  if (place.permit_requirements.ilp_required || place.permit_requirements.pap_required) {
    lines.push(`## Permit Requirements`);
    lines.push("");
    lines.push(`${place.permit_requirements.permit_details}`);
    lines.push("");
  }

  // Visiting hours
  lines.push(`## Visiting Hours`);
  lines.push("");
  lines.push(`- **Opens:** ${place.visiting_hours.open_time}`);
  lines.push(`- **Closes:** ${place.visiting_hours.close_time}`);
  if (
    place.visiting_hours.closed_days.length > 0 &&
    place.visiting_hours.closed_days[0] !== "None"
  ) {
    lines.push(`- **Closed on:** ${place.visiting_hours.closed_days.join(", ")}`);
  }
  if (place.visiting_hours.notes) {
    lines.push(`- **Note:** ${place.visiting_hours.notes}`);
  }
  lines.push("");

  return lines.join("\n");
}

// YAML serialization helpers
function yamlValue(val) {
  if (val === null || val === undefined) return "null";
  if (typeof val === "boolean") return val.toString();
  if (typeof val === "number") return val.toString();
  // Strings that need quoting
  if (typeof val === "string") {
    if (
      val === "" ||
      val.includes(":") ||
      val.includes("#") ||
      val.includes('"') ||
      val.includes("'") ||
      val.includes("\n") ||
      val.includes("[") ||
      val.includes("]") ||
      val.includes("{") ||
      val.includes("}") ||
      val.includes(",") ||
      val.includes("&") ||
      val.includes("*") ||
      val.includes("!") ||
      val.includes("|") ||
      val.includes(">") ||
      val.includes("%") ||
      val.includes("@") ||
      val.includes("`") ||
      val.startsWith("- ") ||
      val.startsWith("? ") ||
      /^\s/.test(val) ||
      /\s$/.test(val) ||
      val === "true" ||
      val === "false" ||
      val === "null" ||
      val === "yes" ||
      val === "no"
    ) {
      // Use double quotes and escape internal double quotes
      return `"${val.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    // Check if it looks like a number
    if (/^[\d.]+$/.test(val) || /^-[\d.]+$/.test(val)) {
      return `"${val}"`;
    }
    return val;
  }
  return JSON.stringify(val);
}

function toFrontmatter(place) {
  const lines = [];

  lines.push(`id: ${yamlValue(place.id)}`);
  lines.push(`name: ${yamlValue(place.name)}`);
  lines.push(`category: ${yamlValue(place.category)}`);
  lines.push(`sub_category: ${yamlValue(place.sub_category)}`);

  // tags
  lines.push(`tags:`);
  for (const tag of place.tags) {
    lines.push(`  - ${yamlValue(tag)}`);
  }

  lines.push(`high_intent_motivation: ${yamlValue(place.high_intent_motivation)}`);

  // ratings
  lines.push(`ratings:`);
  lines.push(`  google_rating: ${yamlValue(place.ratings.google_rating)}`);
  lines.push(`  google_reviews_count: ${yamlValue(place.ratings.google_reviews_count)}`);
  lines.push(`  our_rating: ${yamlValue(place.ratings.our_rating)}`);

  // entry_fees
  lines.push(`entry_fees:`);
  lines.push(`  indian_inr: ${yamlValue(place.entry_fees.indian_inr)}`);
  lines.push(`  foreigner_inr: ${yamlValue(place.entry_fees.foreigner_inr)}`);
  lines.push(`  special_entry_notes: ${yamlValue(place.entry_fees.special_entry_notes)}`);

  // location
  lines.push(`location:`);
  lines.push(`  lat: ${place.location.lat}`);
  lines.push(`  lng: ${place.location.lng}`);
  lines.push(`  address: ${yamlValue(place.location.address)}`);
  lines.push(`  state: ${yamlValue(place.location.state)}`);

  // permit_requirements
  lines.push(`permit_requirements:`);
  lines.push(`  ilp_required: ${place.permit_requirements.ilp_required}`);
  lines.push(`  pap_required: ${place.permit_requirements.pap_required}`);
  lines.push(`  permit_details: ${yamlValue(place.permit_requirements.permit_details)}`);

  // visiting_hours
  lines.push(`visiting_hours:`);
  lines.push(`  open_time: ${yamlValue(place.visiting_hours.open_time)}`);
  lines.push(`  close_time: ${yamlValue(place.visiting_hours.close_time)}`);
  lines.push(`  closed_days:`);
  for (const day of place.visiting_hours.closed_days) {
    lines.push(`    - ${yamlValue(day)}`);
  }
  lines.push(`  notes: ${yamlValue(place.visiting_hours.notes)}`);

  // seasonality
  lines.push(`seasonality:`);
  lines.push(`  best_months:`);
  for (const month of place.seasonality.best_months) {
    lines.push(`    - ${yamlValue(month)}`);
  }
  lines.push(`  peak_events:`);
  for (const event of place.seasonality.peak_events) {
    lines.push(`    - ${yamlValue(event)}`);
  }

  // logistics
  lines.push(`logistics:`);
  for (const hub of place.logistics) {
    lines.push(`  - hub_name: ${yamlValue(hub.hub_name)}`);
    lines.push(`    hub_type: ${yamlValue(hub.hub_type)}`);
    lines.push(`    distance_km: ${hub.distance_km}`);
    lines.push(`    drive_time_mins: ${hub.drive_time_mins}`);
    if (hub.best_time_to_leave) {
      lines.push(`    best_time_to_leave: ${yamlValue(hub.best_time_to_leave)}`);
    }
  }

  // seo
  lines.push(`seo:`);
  lines.push(`  meta_title: ${yamlValue(place.seo.meta_title)}`);
  lines.push(`  meta_description: ${yamlValue(place.seo.meta_description)}`);
  lines.push(`  schema_org_type: ${yamlValue(place.seo.schema_org_type)}`);

  // images
  lines.push(`images:`);
  for (const img of place.images) {
    lines.push(`  - ${yamlValue(img)}`);
  }

  return lines.join("\n");
}

// Generate MDX files
let count = 0;
for (const place of places) {
  const frontmatter = toFrontmatter(place);
  const body = generateBody(place);
  const mdxContent = `---\n${frontmatter}\n---\n\n${body}\n`;

  const filename = `${place.id}.mdx`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, mdxContent, "utf-8");
  count++;
}

console.log(`Generated ${count} MDX files in ${OUTPUT_DIR}/`);
