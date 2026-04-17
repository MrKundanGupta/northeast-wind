export const prerender = true;
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const places    = await getCollection('places');
  const hubCities = await getCollection('hubCities');

  const allEntries = [...places, ...hubCities];

  const data = allEntries
    .filter(p => {
      const { lat, lng } = p.data.location ?? {};
      return typeof lat === 'number' && typeof lng === 'number';
    })
    .map(p => ({
      id:       p.id,
      name:     p.data.name,
      lat:      p.data.location.lat,
      lng:      p.data.location.lng,
      category: p.data.category,
      subCategory: p.data.sub_category ?? '',
      state:    p.data.location.state,
      city:     p.data.city ?? '',
      rating:   p.data.ratings?.google_rating ?? null,
      image:    p.data.hub_images?.[0] ?? p.data.images?.[0] ?? null,
      tags:     p.data.tags ?? [],
      visitingHours: p.data.visiting_hours ?? null,
      logistics: (p.data.logistics ?? []).map((l: any) => ({
        hub_name:       l.hub_name,
        drive_time_mins: l.drive_time_mins,
        distance_km:    l.distance_km,
      })),
    }));

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
