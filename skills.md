# Axomor — Implementation Skills & Patterns

## Image Optimisation

### Convert all images to WebP (run once or after adding new images)
```bash
node scripts/convert-to-webp.mjs      # full-size: 1200px, q82 → .webp
node scripts/convert-thumbnails.mjs   # thumbnails: 700px, q70 → -sm.webp
```

### Use in components
```astro
{/* Thumbnail (PlaceCard, state cards) */}
<picture>
  <source srcset={image.replace(/\.(jpe?g|png)$/i, '-sm.webp')} type="image/webp" />
  <img src={image} alt={name} loading="lazy" width="400" height="250" />
</picture>

{/* Hero (place detail page) */}
<picture>
  <source srcset={heroImage.replace(/\.(jpe?g|png)$/i, '.webp')} type="image/webp" />
  <img src={heroImage} alt={name} loading="eager" fetchpriority="high" />
</picture>
```

## Performance Patterns

### Non-blocking Google Fonts
In `BaseLayout.astro` — never use CSS @import for fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?..." media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?..." /></noscript>
```

### Deferred GTM (protects LCP)
```js
window.dataLayer = window.dataLayer || [];
window.addEventListener('load', function () {
  var run = function () { /* GTM snippet */ };
  'requestIdleCallback' in window ? requestIdleCallback(run) : setTimeout(run, 1000);
});
```

### Hero image LCP pattern (homepage)
```astro
{/* In <head> via slot — preload before CSS even loads */}
<link slot="head" rel="preload" as="image"
  href="hero.jpg"
  imagesrcset="hero-828.jpg 828w, hero-1280.jpg 1280w"
  imagesizes="100vw"
  fetchpriority="high" />

{/* In body — <img> not CSS background so scanner finds it */}
<img src="hero.jpg" srcset="..." sizes="100vw"
  fetchpriority="high" loading="eager" decoding="async"
  style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />
```

### React hydration deferral
```astro
{/* Avoid client:load in nav/layout components */}
<CartToggleButton client:idle />   {/* loads during browser idle */}
<TripSidebar client:idle />        {/* loads during browser idle */}
<AddToTripButton client:visible /> {/* loads when in viewport */}
```

## SEO Patterns

### BaseLayout.astro required props
```ts
interface Props {
  title: string;       // page-specific, under 60 chars
  description?: string; // under 160 chars
  image?: string;      // OG image — pass place hero image from detail pages
}
```

### Place page dual schema
```astro
<script slot="head" type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
<script slot="head" type="application/ld+json" set:html={JSON.stringify(breadcrumbLd)} />
```
- `jsonLd`: TouristAttraction or PlaceOfWorship (url, address, geo, aggregateRating, image array)
- `breadcrumbLd`: BreadcrumbList (Home → State → Place)

### Sitemap endpoint pattern (Astro server mode)
Dynamic sitemap in `src/pages/sitemap.xml.ts` — uses `getCollection()` to enumerate all routes.
Returns `application/xml` with 1hr cache header.

### After adding new places
1. Run image conversion scripts
2. Ensure MDX frontmatter has `seo.meta_title` and `seo.meta_description`
3. Resubmit sitemap in Google Search Console

## Cloudflare

### Cache headers
`public/_headers` sets 1-year immutable cache on all images, fonts, CSS bundles.
Update this file if new asset types are added.

### Deployment
Pushes to `main` on `MrKundanGupta/northeast-wind` auto-deploy via Cloudflare Pages.
Switch git account if needed: `gh auth switch --user MrKundanGupta`
