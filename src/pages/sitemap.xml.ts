import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://axomor.com';

const NE_STATES = [
  'assam', 'meghalaya', 'sikkim', 'arunachal-pradesh',
  'nagaland', 'manipur', 'mizoram', 'tripura',
];

export const GET: APIRoute = async () => {
  const places = await getCollection('places');
  const hubCities = await getCollection('hubCities');

  const staticUrls = [
    { loc: `${SITE}/`,       priority: '1.0', changefreq: 'weekly'   },
    { loc: `${SITE}/states`, priority: '0.9', changefreq: 'monthly'  },
    { loc: `${SITE}/plan`,   priority: '0.8', changefreq: 'monthly'  },
    { loc: `${SITE}/map`,    priority: '0.7', changefreq: 'monthly'  },
  ];

  const stateUrls = NE_STATES.map(s => ({
    loc: `${SITE}/states/${s}`,
    priority: '0.9',
    changefreq: 'monthly',
  }));

  const placeUrls = [...places, ...hubCities].map(p => ({
    loc: `${SITE}/places/${p.id}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));

  const allUrls = [...staticUrls, ...stateUrls, ...placeUrls];

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
