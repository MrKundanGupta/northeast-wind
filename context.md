# Axomor — Project Context

## What This Is
Axomor is a Northeast India travel guide — 250+ handpicked destinations across all 8 sister states.
It is NOT a booking platform. It is a discovery and planning tool.

## Business Goal
Rank on Google Search and Google Maps for Northeast India travel queries.
Primary audience: Indian domestic travelers + NRI travelers planning NE India trips.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Astro 5 (server mode) |
| Deployment | Cloudflare Workers |
| UI | React 19 (islands) + Tailwind CSS 4 |
| CMS | Keystatic (MDX-based) |
| Maps | Leaflet |
| AI Content | Anthropic SDK (dev tooling) |

## Content Scale
- 250+ place pages (`/places/[id]`)
- ~39 hub city pages
- 8 state pages (`/states/[state]`)
- 765 images, all available in JPG + WebP (full) + WebP (thumbnail `-sm.webp`)

## Key URLs
- Homepage: https://axomor.com
- Sitemap: https://axomor.com/sitemap.xml
- GitHub: https://github.com/MrKundanGupta/northeast-wind

## Tracking
- Google Search Console: DNS verified
- GTM: GTM-WQNJDC4L (deferred load — after window load + requestIdleCallback)
- GA4: G-BJXMQP8HLQ (via GTM)
- Social: @axomorhq (Instagram + Facebook)

## Performance Status (April 2026)
| Metric | Score |
|---|---|
| Mobile Performance | 86 (target: 90+) |
| Desktop Performance | 91 |
| SEO | 100 |
| Best Practices | 100 |
| Accessibility | 95 |

## Known Bottlenecks
1. 250 place cards all rendered on homepage (DOM: 7,834 elements) — needs pagination
2. GTM/GA4 ~268 KiB even when deferred — inherent 3rd party cost
3. React bundle (57 KiB) — cart/sidebar components

## Image Architecture
- Full WebP (1200px, q82): used for place detail hero + gallery
- Thumbnail WebP (700px, q70, `-sm.webp` suffix): used for PlaceCard + state cards
- All images in `public/images/[state]/[place-slug]/1.jpg` (+ .webp + -sm.webp)
