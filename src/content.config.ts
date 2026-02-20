import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const places = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/places" }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    sub_category: z.string(),
    tags: z.array(z.string()),
    high_intent_motivation: z.string(),

    ratings: z.object({
      google_rating: z.number().nullable(),
      google_reviews_count: z.string().nullable(),
      our_rating: z.number().nullable(),
    }),

    entry_fees: z.object({
      indian_inr: z.string(),
      foreigner_inr: z.string(),
      special_entry_notes: z.string(),
    }),

    location: z.object({
      lat: z.number(),
      lng: z.number(),
      address: z.string(),
      state: z.string(),
    }),

    permit_requirements: z.object({
      ilp_required: z.boolean(),
      pap_required: z.boolean(),
      permit_details: z.string(),
    }),

    visiting_hours: z.object({
      open_time: z.string(),
      close_time: z.string(),
      closed_days: z.array(z.string()),
      notes: z.string(),
    }),

    seasonality: z.object({
      best_months: z.array(z.string()),
      peak_events: z.array(z.string()),
    }),

    logistics: z.array(
      z.object({
        hub_name: z.string(),
        hub_type: z.string(),
        distance_km: z.number(),
        drive_time_mins: z.number(),
        best_time_to_leave: z.string().optional(),
      })
    ),

    seo: z.object({
      meta_title: z.string(),
      meta_description: z.string(),
      schema_org_type: z.string(),
    }),

    images: z.array(z.string()),
  }),
});

export const collections = { places };
