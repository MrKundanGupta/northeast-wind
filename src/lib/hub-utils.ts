/**
 * Shared utilities for transport-hub slug generation and formatting.
 */

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Turn a verbose hub name into a short URL-friendly slug.
 *
 *  "Lokpriya Gopinath Bordoloi International Airport, Guwahati (GAU)"
 *      → "guwahati-airport"
 *
 *  "Guwahati Railway Station"
 *      → "guwahati-railway-station"
 *
 *  "Bagdogra Airport (IXB)"
 *      → "bagdogra-airport"
 */
export function hubToSlug(hubName: string): string {
  const cleaned = hubName.replace(/\([^)]*\)/g, "").trim();

  if (/airport/i.test(hubName) && cleaned.includes(",")) {
    const city = cleaned.split(",").pop()!.trim();
    return slugify(`${city} airport`);
  }
  return slugify(cleaned);
}

/** "guwahati-airport" → "Guwahati Airport" */
export function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** 45 → "45 min"  |  135 → "2h 15m" */
export function fmtDrive(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const TIME_BRACKETS = [
  { slug: "under-30-min", label: "Under 30 min", maxMins: 30 },
  { slug: "under-1-hour", label: "Under 1 hour", maxMins: 60 },
  { slug: "under-2-hours", label: "Under 2 hours", maxMins: 120 },
  { slug: "under-3-hours", label: "Under 3 hours", maxMins: 180 },
  { slug: "under-5-hours", label: "Under 5 hours", maxMins: 300 },
  { slug: "under-8-hours", label: "Under 8 hours", maxMins: 480 },
] as const;
