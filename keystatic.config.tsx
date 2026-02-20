import { config, fields, collection } from "@keystatic/core";

export default config({
  storage: { kind: "cloud" },
  cloud: { project: "mrkundangupta/northeast-wind" },

  collections: {
    places: collection({
      label: "Places",
      slugField: "id",
      path: "src/content/places/*",
      format: { contentField: "body" },
      entryLayout: "form",
      schema: {
        id: fields.text({
          label: "ID",
          validation: { isRequired: true, length: { min: 1 } },
        }),
        name: fields.text({
          label: "Name",
          validation: { isRequired: true },
        }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Waterfall", value: "Waterfall" },
            { label: "Wildlife & Nature", value: "Wildlife & Nature" },
            { label: "Spiritual", value: "Spiritual" },
            { label: "Heritage", value: "Heritage" },
            { label: "Museum", value: "Museum" },
            { label: "Art Museum", value: "Art Museum" },
            { label: "Science Museum", value: "Science Museum" },
            { label: "Lake / Nature", value: "Lake / Nature" },
            { label: "Lake", value: "Lake" },
            { label: "Viewpoint / Passes", value: "Viewpoint / Passes" },
            { label: "Caving / Adventure", value: "Caving / Adventure" },
            { label: "Tourist Attraction", value: "Tourist Attraction" },
            { label: "Attraction", value: "Attraction" },
            { label: "Bridge", value: "Bridge" },
            { label: "Hiking Area", value: "Hiking Area" },
            { label: "Garden", value: "Garden" },
            { label: "Picnic Ground", value: "Picnic Ground" },
            { label: "Scenic Spot", value: "Scenic Spot" },
            { label: "Mountain Peak", value: "Mountain Peak" },
            { label: "Park", value: "Park" },
            { label: "Golf Course", value: "Golf Course" },
            { label: "Home Stay", value: "Home Stay" },
            { label: "Eco-Stays / Accommodation", value: "Eco-Stays / Accommodation" },
            { label: "River Port", value: "River Port" },
          ],
          defaultValue: "Tourist Attraction",
        }),
        sub_category: fields.text({
          label: "Sub-Category",
          validation: { isRequired: true },
        }),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tags",
          itemLabel: (props) => props.value || "New tag",
        }),
        high_intent_motivation: fields.text({
          label: "High-Intent Motivation",
          multiline: true,
        }),

        // ── Ratings ─────────────────────────────────────
        ratings: fields.object(
          {
            google_rating: fields.number({
              label: "Google Rating",
              step: 0.1,
              validation: { min: 0, max: 5 },
            }),
            google_reviews_count: fields.text({
              label: "Google Reviews Count",
            }),
            our_rating: fields.number({
              label: "Our Rating",
              step: 0.1,
              validation: { min: 0, max: 5 },
            }),
          },
          { label: "Ratings" }
        ),

        // ── Entry Fees ──────────────────────────────────
        entry_fees: fields.object(
          {
            indian_inr: fields.text({ label: "Indian (INR)" }),
            foreigner_inr: fields.text({ label: "Foreigner (INR)" }),
            special_entry_notes: fields.text({ label: "Special Entry Notes" }),
          },
          { label: "Entry Fees" }
        ),

        // ── Location ────────────────────────────────────
        location: fields.object(
          {
            lat: fields.number({
              label: "Latitude",
              step: 0.0001,
              validation: { isRequired: true },
            }),
            lng: fields.number({
              label: "Longitude",
              step: 0.0001,
              validation: { isRequired: true },
            }),
            address: fields.text({ label: "Address" }),
            state: fields.select({
              label: "State",
              options: [
                { label: "Arunachal Pradesh", value: "Arunachal Pradesh" },
                { label: "Assam", value: "Assam" },
                { label: "Manipur", value: "Manipur" },
                { label: "Meghalaya", value: "Meghalaya" },
                { label: "Mizoram", value: "Mizoram" },
                { label: "Nagaland", value: "Nagaland" },
                { label: "Sikkim", value: "Sikkim" },
                { label: "Tripura", value: "Tripura" },
              ],
              defaultValue: "Assam",
            }),
          },
          { label: "Location" }
        ),

        // ── Permit Requirements ─────────────────────────
        permit_requirements: fields.object(
          {
            ilp_required: fields.checkbox({
              label: "ILP Required",
              defaultValue: false,
            }),
            pap_required: fields.checkbox({
              label: "PAP Required",
              defaultValue: false,
            }),
            permit_details: fields.text({
              label: "Permit Details",
              multiline: true,
            }),
          },
          { label: "Permit Requirements" }
        ),

        // ── Visiting Hours ──────────────────────────────
        visiting_hours: fields.object(
          {
            open_time: fields.text({
              label: "Open Time",
              description: "e.g. 06:00 AM",
            }),
            close_time: fields.text({
              label: "Close Time",
              description: "e.g. 06:00 PM",
            }),
            closed_days: fields.array(fields.text({ label: "Day" }), {
              label: "Closed Days",
              itemLabel: (props) => props.value || "New day",
            }),
            notes: fields.text({ label: "Notes" }),
          },
          { label: "Visiting Hours" }
        ),

        // ── Seasonality ─────────────────────────────────
        seasonality: fields.object(
          {
            best_months: fields.multiselect({
              label: "Best Months",
              options: [
                { label: "January", value: "January" },
                { label: "February", value: "February" },
                { label: "March", value: "March" },
                { label: "April", value: "April" },
                { label: "May", value: "May" },
                { label: "June", value: "June" },
                { label: "July", value: "July" },
                { label: "August", value: "August" },
                { label: "September", value: "September" },
                { label: "October", value: "October" },
                { label: "November", value: "November" },
                { label: "December", value: "December" },
              ],
            }),
            peak_events: fields.array(fields.text({ label: "Event" }), {
              label: "Peak Events",
              itemLabel: (props) => props.value || "New event",
            }),
          },
          { label: "Seasonality" }
        ),

        // ── Logistics ───────────────────────────────────
        logistics: fields.array(
          fields.object({
            hub_name: fields.select({
              label: "Hub Name",
              options: [
                { label: "Guwahati Airport (GAU)", value: "Lokpriya Gopinath Bordoloi International Airport, Guwahati (GAU)" },
                { label: "Guwahati Railway Station", value: "Guwahati Railway Station" },
                { label: "Donyi Polo Airport (HGI)", value: "Donyi Polo Airport, Itanagar (HGI)" },
                { label: "Tezpur Airport (TEZ)", value: "Tezpur Airport (TEZ)" },
                { label: "Naharlagun Railway Station", value: "Naharlagun Railway Station" },
                { label: "Imphal Airport (IMF)", value: "Imphal Airport (IMF)" },
                { label: "Jiribam Railway Station", value: "Jiribam Railway Station" },
                { label: "Dimapur Airport (DMU)", value: "Dimapur Airport (DMU)" },
                { label: "Dimapur Railway Station", value: "Dimapur Railway Station" },
                { label: "Pakyong Airport (PYG)", value: "Pakyong Airport (PYG)" },
                { label: "Bagdogra Airport (IXB)", value: "Bagdogra Airport (IXB)" },
                { label: "New Jalpaiguri Railway Station (NJP)", value: "New Jalpaiguri Railway Station (NJP)" },
                { label: "Agartala Airport (IXA)", value: "Agartala Airport (IXA)" },
                { label: "Agartala Railway Station", value: "Agartala Railway Station" },
                { label: "Lengpui Airport (AJL)", value: "Lengpui Airport (AJL)" },
                { label: "Bairabi Railway Station", value: "Bairabi Railway Station" },
                { label: "Umroi Airport (SHL)", value: "Umroi Airport (SHL)" },
              ],
              defaultValue: "Lokpriya Gopinath Bordoloi International Airport, Guwahati (GAU)",
            }),
            hub_type: fields.select({
              label: "Hub Type",
              options: [
                { label: "Airport", value: "airport" },
                { label: "Railway Station", value: "train" },
              ],
              defaultValue: "airport",
            }),
            distance_km: fields.number({
              label: "Distance (km)",
              step: 0.1,
              validation: { isRequired: true, min: 0 },
            }),
            drive_time_mins: fields.integer({
              label: "Drive Time (mins)",
              validation: { isRequired: true, min: 0 },
            }),
            best_time_to_leave: fields.text({
              label: "Best Time to Leave",
            }),
          }),
          {
            label: "Logistics",
            itemLabel: (props) => {
              const hub = props.fields.hub_name.value;
              const dist = props.fields.distance_km.value;
              return `${hub} — ${dist} km`;
            },
          }
        ),

        // ── SEO ─────────────────────────────────────────
        seo: fields.object(
          {
            meta_title: fields.text({ label: "Meta Title" }),
            meta_description: fields.text({
              label: "Meta Description",
              multiline: true,
            }),
            schema_org_type: fields.select({
              label: "Schema.org Type",
              options: [
                { label: "TouristAttraction", value: "TouristAttraction" },
                { label: "PlaceOfWorship", value: "PlaceOfWorship" },
                { label: "NaturalFeature", value: "NaturalFeature" },
                { label: "LandmarksOrHistoricalBuildings", value: "LandmarksOrHistoricalBuildings" },
                { label: "Park", value: "Park" },
                { label: "Museum", value: "Museum" },
              ],
              defaultValue: "TouristAttraction",
            }),
          },
          { label: "SEO" }
        ),

        // ── Images ──────────────────────────────────────
        images: fields.array(fields.text({ label: "Image path" }), {
          label: "Images",
          itemLabel: (props) => props.value || "New image",
        }),

        // ── Hub & Spoke SEO ────────────────────────────
        city: fields.text({
          label: "City",
          description: "e.g. Guwahati",
          validation: { isRequired: true },
        }),
        region: fields.text({
          label: "Region",
          description: "e.g. Assam",
          validation: { isRequired: true },
        }),
        map_location: fields.object(
          {
            lat: fields.number({
              label: "Latitude",
              step: 0.0001,
              validation: { isRequired: true },
            }),
            lng: fields.number({
              label: "Longitude",
              step: 0.0001,
              validation: { isRequired: true },
            }),
            Maps_url: fields.url({
              label: "Google Maps URL",
            }),
          },
          { label: "Map Location" }
        ),
        hub_images: fields.array(fields.text({ label: "Image path" }), {
          label: "Hub Images (min 3)",
          itemLabel: (props) => props.value || "New image",
          validation: { length: { min: 3 } },
        }),
        seo_tags: fields.array(fields.text({ label: "Tag" }), {
          label: "SEO Tags",
          itemLabel: (props) => props.value || "New tag",
        }),

        // ── Body (MDX content) ──────────────────────────
        body: fields.mdx({
          label: "Body",
        }),
      },
    }),
  },
});
