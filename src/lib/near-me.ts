/**
 * Shared helpers for programmatic SEO "near me" pages.
 * Follows the pattern established by src/lib/hub-utils.ts.
 */

import pseoConfig from "../data/pseo-config.json";
import pseoPlacesData from "../data/pseo-places.json";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PseoCity {
  name: string;
  slug: string;
  state: string;
  stateSlug: string;
  region: string;
  lat: number;
  lng: number;
}

export interface PseoCategory {
  slug: string;
  label: string;
  source: "mdx" | "google";
  mdxCategories: string[] | "all" | null;
  googlePlaceType: string | null;
  schemaType: "TouristAttraction" | "LocalBusiness";
  metaTitleTemplate: string;
  h1Template: string;
  metaDescriptionTemplate: string;
  introTemplate: string;
}

export interface GooglePlace {
  name: string;
  place_id: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  photos: string[];
  types: string[];
}

/* ------------------------------------------------------------------ */
/*  Data re-exports                                                    */
/* ------------------------------------------------------------------ */

export const cities: PseoCity[] = pseoConfig.cities;
export const categories: PseoCategory[] = pseoConfig.categories as PseoCategory[];

/* ------------------------------------------------------------------ */
/*  Date / Month utilities                                             */
/* ------------------------------------------------------------------ */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Returns e.g. "February 2026" */
export function getMonthYear(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

/* ------------------------------------------------------------------ */
/*  Utility functions                                                  */
/* ------------------------------------------------------------------ */

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Replace template placeholders:
 * {city}, {state}, {year}, {count}, {label}, {monthYear}
 */
export function interpolate(
  template: string,
  vars: {
    city?: string;
    state?: string;
    year?: number;
    count?: number;
    label?: string;
    monthYear?: string;
  },
): string {
  let result = template;
  if (vars.city != null) result = result.replace(/\{city\}/g, vars.city);
  if (vars.state != null) result = result.replace(/\{state\}/g, vars.state);
  if (vars.year != null) result = result.replace(/\{year\}/g, String(vars.year));
  if (vars.count != null) result = result.replace(/\{count\}/g, String(vars.count));
  if (vars.label != null) result = result.replace(/\{label\}/g, vars.label);
  if (vars.monthYear != null) result = result.replace(/\{monthYear\}/g, vars.monthYear);
  return result;
}

/* ------------------------------------------------------------------ */
/*  Nearby cities (haversine distance)                                 */
/* ------------------------------------------------------------------ */

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get the N closest cities to `city`, excluding itself. */
export function getNearbyCities(city: PseoCity, n: number = 3): PseoCity[] {
  return cities
    .filter((c) => c.slug !== city.slug)
    .map((c) => ({ city: c, dist: haversineKm(city.lat, city.lng, c.lat, c.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n)
    .map((c) => c.city);
}

/* ------------------------------------------------------------------ */
/*  "Best For" tag derivation                                          */
/* ------------------------------------------------------------------ */

const BEST_FOR_MAP: Record<string, string> = {
  wildlife: "Nature Lovers",
  nature: "Nature Lovers",
  trekking: "Adventure Seekers",
  adventure: "Adventure Seekers",
  spiritual: "Spiritual Travelers",
  temple: "Spiritual Travelers",
  family: "Families",
  "eco-tourism": "Eco Travelers",
  photography: "Photographers",
  romantic: "Couples",
  safari: "Wildlife Enthusiasts",
  heritage: "History Buffs",
  "national park": "Wildlife Enthusiasts",
};

/** Derive up to 2 "Best For" labels from tags. */
export function deriveBestFor(tags: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const match = BEST_FOR_MAP[tag.toLowerCase()];
    if (match && !seen.has(match)) {
      seen.add(match);
      result.push(match);
      if (result.length >= 2) break;
    }
  }
  return result.length > 0 ? result : ["Travelers"];
}

/** Derive "Best For" from Google place types. */
export function deriveBestForGoogle(types: string[]): string[] {
  const typeMap: Record<string, string> = {
    cafe: "Remote Work",
    restaurant: "Families",
    bakery: "Sweet Tooth",
    bar: "Couples",
    night_club: "Nightlife",
    meal_takeaway: "Quick Bites",
  };
  for (const t of types) {
    if (typeMap[t]) return [typeMap[t]];
  }
  return ["Travelers"];
}

/* ------------------------------------------------------------------ */
/*  City name aliases for MDX matching                                 */
/* ------------------------------------------------------------------ */

const CITY_ALIASES: Record<string, string[]> = {
  cherrapunji: ["Cherrapunji", "Sohra"],
  pelling: ["Pelling", "Pelling City"],
  ravangla: ["Ravangla", "Rabong"],
};

function getCityNameVariants(city: PseoCity): string[] {
  const aliases = CITY_ALIASES[city.slug];
  if (aliases) return aliases;
  return [city.name];
}

/* ------------------------------------------------------------------ */
/*  MDX place matching                                                 */
/* ------------------------------------------------------------------ */

/** All known city names (lowercase) for quick lookup. */
const ALL_CITY_NAMES = new Set(
  cities.flatMap((c) => {
    const aliases = CITY_ALIASES[c.slug];
    return aliases
      ? aliases.map((a) => a.toLowerCase())
      : [c.name.toLowerCase()];
  }),
);

/** Max distance (km) for proximity-based fallback matching. */
const PROXIMITY_RADIUS_KM = 50;

/**
 * Check if a place's `city` field matches a known PSEO city name.
 * If not, it's a "garbage" value (Plus Code, village name, state name)
 * and we fall back to proximity matching.
 */
function placeMatchesCity(p: any, city: PseoCity, variants: string[]): boolean {
  const placeCity = (p.data.city || "").toLowerCase().trim();

  // Direct match on city name or alias
  if (variants.includes(placeCity)) return true;

  // If the city field IS a known PSEO city but not this one, skip
  if (ALL_CITY_NAMES.has(placeCity)) return false;

  // Garbage/unknown city value — fall back to proximity using coordinates
  const placeLat = p.data.location?.lat;
  const placeLng = p.data.location?.lng;
  if (placeLat == null || placeLng == null) return false;

  // Find the nearest PSEO city to this place
  let nearestSlug = "";
  let nearestDist = Infinity;
  for (const c of cities) {
    const dist = haversineKm(placeLat, placeLng, c.lat, c.lng);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestSlug = c.slug;
    }
  }

  // Only match if this city IS the nearest one and within radius
  return nearestSlug === city.slug && nearestDist <= PROXIMITY_RADIUS_KM;
}

/**
 * Filter MDX collection entries that match a city + category definition.
 * Uses the `city` frontmatter field with known alias support,
 * plus proximity-based fallback for unrecognized city values.
 */
export function getMdxPlacesForCity(
  allPlaces: any[],
  city: PseoCity,
  category: PseoCategory,
): any[] {
  const variants = getCityNameVariants(city).map((v) => v.toLowerCase());

  return allPlaces.filter((p) => {
    if (!placeMatchesCity(p, city, variants)) return false;

    if (category.mdxCategories === "all") return true;
    if (Array.isArray(category.mdxCategories)) {
      return category.mdxCategories.includes(p.data.category);
    }
    return false;
  });
}

/* ------------------------------------------------------------------ */
/*  Google Places lookup                                               */
/* ------------------------------------------------------------------ */

/** Safe lookup from pseo-places.json data. */
export function getGooglePlacesForCity(
  data: typeof pseoPlacesData,
  citySlug: string,
  catSlug: string,
): GooglePlace[] {
  const cityData = (data.places as Record<string, Record<string, GooglePlace[]>>)[citySlug];
  if (!cityData) return [];
  return cityData[catSlug] || [];
}

/* ------------------------------------------------------------------ */
/*  Schema.org builders                                                */
/* ------------------------------------------------------------------ */

/** Build ItemList + TouristAttraction JSON-LD for MDX-sourced places. */
export function buildTouristAttractionSchema(
  places: any[],
  city: string,
  state: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Tourist Places in ${city}, ${state}`,
    numberOfItems: places.length,
    itemListElement: places.map((p: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "TouristAttraction",
        name: p.data?.name ?? p.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressRegion: state,
          addressCountry: "IN",
        },
        ...(p.data?.ratings?.google_rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.data.ratings.google_rating,
            ...(p.data.ratings.google_reviews_count && {
              reviewCount: p.data.ratings.google_reviews_count,
            }),
          },
        }),
      },
    })),
  };
}

/** Build ItemList + LocalBusiness JSON-LD for Google-sourced places. */
export function buildLocalBusinessSchema(
  places: GooglePlace[],
  city: string,
  state: string,
  label: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${label} in ${city}, ${state}`,
    numberOfItems: places.length,
    itemListElement: places.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: p.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: p.address,
          addressLocality: city,
          addressRegion: state,
          addressCountry: "IN",
        },
        ...(p.rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: p.rating,
            reviewCount: p.reviewCount,
          },
        }),
        geo: {
          "@type": "GeoCoordinates",
          latitude: p.lat,
          longitude: p.lng,
        },
      },
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  FAQ builder (blueprint: 3 specific featured-snippet questions)     */
/* ------------------------------------------------------------------ */

export interface FaqItem {
  q: string;
  a: string;
}

/** Build 3 FAQ items per the SEO blueprint — targeting featured snippets. */
export function buildNearMeFaqs(
  city: string,
  state: string,
  label: string,
  count: number,
  topName: string | null,
  topRating: number | null,
): FaqItem[] {
  const lbl = label.toLowerCase();
  return [
    {
      q: `What are the most popular ${lbl} in ${city}?`,
      a: topName
        ? `The most popular include ${topName}${topRating ? ` (rated ${topRating}/5)` : ""}. In total, there are ${count} ${lbl} listed in ${city}, ${state} — ranging from well-known spots to hidden local gems.`
        : `There are ${count} ${lbl} listed in ${city}, ${state}. Check the directory above for the complete ranked list with ratings and reviews.`,
    },
    {
      q: `Which ${lbl} in ${city} are best for families or couples?`,
      a: `Most ${lbl} in ${city} welcome both families and couples. Look for spots with higher ratings (4.0+) and check the "Best For" tags on each listing. Many places in ${city} offer a relaxed, family-friendly vibe typical of ${state}.`,
    },
    {
      q: `Are there any budget-friendly ${lbl} in ${city}?`,
      a: `Yes — ${city} has ${lbl} across all price ranges. Many local favorites offer excellent value. Browse the listings above and look for entry fees and price indicators to find options that fit your budget.`,
    },
  ];
}

/** Wrap FAQ items into FAQPage JSON-LD. */
export function buildFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}
