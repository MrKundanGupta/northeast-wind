# Axomor — Claude Code Instructions

## Project Overview
- **Brand**: Axomor — Northeast India Travel Guide
- **Domain**: https://axomor.com
- **Stack**: Astro 5 + Cloudflare Workers + React 19 + Tailwind CSS 4
- **Content**: 250+ places, ~39 hub cities, 8 NE states
- **CMS**: Keystatic (MDX-based content at src/content/)

## Tracking IDs (never change without confirmation)
| Tool | ID |
|---|---|
| Google Tag Manager | GTM-WQNJDC4L |
| Google Analytics 4 | G-BJXMQP8HLQ |

## SEO Rules — Never Break These
1. GTM snippet (`GTM-WQNJDC4L`) must be in BOTH `<head>` AND after `<body>` in `BaseLayout.astro`
2. Do NOT add GA4 snippet directly to code — GA4 runs through GTM
3. Every page must have `<link rel="canonical">` via `BaseLayout.astro`
4. Every page must have Open Graph + Twitter Card meta tags
5. `public/robots.txt` — do not remove `Disallow: /keystatic/`
6. `public/sitemap.xml` OR `src/pages/sitemap.xml.ts` — update if new route patterns added
7. Place pages must have both `TouristAttraction`/`PlaceOfWorship` schema AND `BreadcrumbList` schema
8. `public/llms.txt` — update if site purpose or structure changes significantly

## BaseLayout.astro Props
```ts
interface Props {
  title: string;
  description?: string;
  image?: string;  // page-specific OG image — falls back to logo
}
```
Pass `image={heroImage}` from place pages for best social sharing.

## Schema Pattern for Place Pages (places/[id].astro)
- `jsonLd` — TouristAttraction or PlaceOfWorship (includes url, address, geo, aggregateRating, image array)
- `breadcrumbLd` — BreadcrumbList (Home > State > Place Name)
- Both injected via `<script slot="head" type="application/ld+json">`

## Content Structure
- `src/content/places/` — 250+ MDX files, each has `seo.meta_title`, `seo.meta_description`
- `src/content/hubCities/` — ~39 hub city MDX files
- Both served under `/places/[id]` via `export const prerender = true`

## Social Presence
- Instagram: https://www.instagram.com/axomorhq
- Facebook: https://www.facebook.com/axomorhq

## Key Files
| File | Purpose |
|---|---|
| `src/layouts/BaseLayout.astro` | GTM, canonical, OG tags, site-wide meta |
| `src/pages/places/[id].astro` | Place detail + schema |
| `src/pages/sitemap.xml.ts` | Dynamic XML sitemap |
| `public/robots.txt` | Crawler directives |
| `public/llms.txt` | AI crawler context |
| `astro.config.mjs` | Site URL, integrations |
