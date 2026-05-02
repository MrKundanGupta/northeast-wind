import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../data/categories';
import pseoConfig from '../data/pseo-config.json';

const SITE = 'https://axomor.com';

const NE_STATES = [
  { name: 'Assam',             slug: 'assam'              },
  { name: 'Meghalaya',         slug: 'meghalaya'          },
  { name: 'Sikkim',            slug: 'sikkim'             },
  { name: 'Arunachal Pradesh', slug: 'arunachal-pradesh'  },
  { name: 'Nagaland',          slug: 'nagaland'           },
  { name: 'Manipur',           slug: 'manipur'            },
  { name: 'Mizoram',           slug: 'mizoram'            },
  { name: 'Tripura',           slug: 'tripura'            },
];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const GET: APIRoute = async () => {
  const places    = await getCollection('places');
  const hubCities = await getCollection('hubCities');

  // ── Static pages ────────────────────────────────────
  const staticUrls = [
    { loc: `${SITE}/`,            priority: '1.0', changefreq: 'weekly'  },
    { loc: `${SITE}/states`,      priority: '0.9', changefreq: 'monthly' },
    { loc: `${SITE}/destinations`,priority: '0.9', changefreq: 'monthly' },
    { loc: `${SITE}/categories`,  priority: '0.9', changefreq: 'monthly' },
    { loc: `${SITE}/map`,         priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE}/my-trips`,   priority: '0.6', changefreq: 'monthly' },
  ];

  // ── State pages ─────────────────────────────────────
  const stateUrls = NE_STATES.map(s => ({
    loc: `${SITE}/states/${s.slug}`,
    priority: '0.9',
    changefreq: 'monthly',
  }));

  // ── Destination (hub city) pages ─────────────────────
  const citySlugsSeen = new Set<string>();
  const destUrls = hubCities
    .map(h => {
      const s = slugify(h.data.city);
      if (citySlugsSeen.has(s)) return null;
      citySlugsSeen.add(s);
      return { loc: `${SITE}/destinations/${s}`, priority: '0.8', changefreq: 'monthly' };
    })
    .filter(Boolean) as { loc: string; priority: string; changefreq: string }[];

  // ── Destination × category pages ─────────────────────
  const destCatSeen = new Set<string>();
  const destCatUrls: { loc: string; priority: string; changefreq: string }[] = [];
  for (const p of places) {
    const city = p.data.city as string | undefined;
    if (!city || !/^[A-Za-z]/.test(city) || city.length <= 2) continue;
    const key = `${slugify(city)}::${slugify(p.data.category)}`;
    if (destCatSeen.has(key)) continue;
    destCatSeen.add(key);
    destCatUrls.push({
      loc: `${SITE}/destinations/${slugify(city)}/${slugify(p.data.category)}`,
      priority: '0.75',
      changefreq: 'monthly',
    });
  }

  // ── Place pages ──────────────────────────────────────
  const placeUrls = [...places, ...hubCities].map(p => ({
    loc: `${SITE}/places/${encodeURIComponent(p.id)}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));

  // ── Category index pages ─────────────────────────────
  const catUrls = CATEGORIES.map(cat => ({
    loc: `${SITE}/categories/${cat.slug}`,
    priority: '0.85',
    changefreq: 'weekly',
  }));

  // ── Category × state pages (core SEO pages) ──────────
  const catStateUrls = CATEGORIES.flatMap(cat =>
    NE_STATES.map(st => ({
      loc: `${SITE}/categories/${cat.slug}/${st.slug}`,
      priority: '0.85',
      changefreq: 'weekly',
    }))
  );

  // ── PSEO city hub pages (/[state]/[city]) ────────────
  const pseoCityUrls = pseoConfig.cities.map(city => ({
    loc: `${SITE}/${city.stateSlug}/${city.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));

  // ── PSEO city × category pages ───────────────────────
  const pseoCatUrls = pseoConfig.cities.flatMap(city =>
    pseoConfig.categories.map(cat => ({
      loc: `${SITE}/${city.stateSlug}/${city.slug}/${cat.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
    }))
  );

  const allUrls = [
    ...staticUrls,
    ...stateUrls,
    ...destUrls,
    ...destCatUrls,
    ...catUrls,
    ...catStateUrls,
    ...pseoCityUrls,
    ...pseoCatUrls,
    ...placeUrls,
  ].map(u => ({ ...u, loc: u.loc.endsWith('/') ? u.loc : u.loc + '/' }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
    .map(
      ({ loc, priority, changefreq }) =>
        `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
