import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES } from '../data/categories';

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
    { loc: `${SITE}/plan`,        priority: '0.8', changefreq: 'monthly' },
    { loc: `${SITE}/map`,         priority: '0.7', changefreq: 'monthly' },
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

  // ── Place pages ──────────────────────────────────────
  const placeUrls = [...places, ...hubCities].map(p => ({
    loc: `${SITE}/places/${p.id}`,
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

  const allUrls = [
    ...staticUrls,
    ...stateUrls,
    ...destUrls,
    ...catUrls,
    ...catStateUrls,
    ...placeUrls,
  ];

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
