export interface CategoryMeta {
  slug: string;
  label: string;
  tagline: string;
  description: string;
  img: string;
  /** Internal category values that map to this slug */
  matches: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "wildlife",
    label: "Wildlife & Nature",
    tagline: "Rhinos, elephants, rare birds & pristine forests",
    description: "Northeast India shelters some of Asia's most biodiverse habitats — from Kaziranga's one-horned rhinos to Manas's tigers and Dzukou's rare lilies.",
    img: "/images/assam/kaziranga-national-park/1.jpg",
    matches: [
      "Wildlife & Nature",
      "Wildlife Sanctuary",
      "National Park",
      "Nature Reserve",
      "Tourist Attraction",
      "Attraction",
      "Sightseeing",
      "Zoo",
    ],
  },
  {
    slug: "waterfalls",
    label: "Waterfalls",
    tagline: "Cascading giants hidden in misty hills",
    description: "Meghalaya and Arunachal Pradesh hide some of India's tallest and most dramatic waterfalls — many reachable only on foot through dense jungle.",
    img: "/images/meghalaya/nohkalikai-falls/1.jpg",
    matches: ["Waterfall"],
  },
  {
    slug: "temples",
    label: "Temples & Monasteries",
    tagline: "Sacred peaks, living shrines & ancient prayers",
    description: "From Kamakhya's tantric fire to Tawang's gold-roofed monastery perched at 10,000 ft, Northeast India's spiritual landscape is one of the most diverse on Earth.",
    img: "/images/assam/kamakhya-temple/1.jpg",
    matches: [
      "Spiritual",
      "Religious & Spiritual",
      "Hindu Temple",
      "Vaishnavite Monastery",
      "Buddhist Monastery",
    ],
  },
  {
    slug: "viewpoints",
    label: "Viewpoints & Valleys",
    tagline: "Sky-high panoramas & hidden valleys",
    description: "Stand at passes where Himalayan peaks crowd the horizon, or gaze into mist-draped valleys where rivers are born. Northeast India's viewpoints are unlike anywhere else.",
    img: "/images/arunachal-pradesh/tawang-monastery/1.jpg",
    matches: [
      "Viewpoint / Passes",
      "Scenic Viewpoint",
      "Scenic Spot",
      "Valley & Landscape",
    ],
  },
  {
    slug: "heritage",
    label: "Heritage & History",
    tagline: "Ancient kingdoms, tribal forts & forgotten palaces",
    description: "From the Ahom kingdom's grand tanks to Tripura's lake palace and Manipur's Kangla Fort, the region holds centuries of layered history waiting to be explored.",
    img: "/images/tripura/neermahal/1.jpg",
    matches: [
      "Heritage",
      "History & Heritage",
      "Museum",
      "Historical Monument",
    ],
  },
  {
    slug: "adventure",
    label: "Adventure & Trekking",
    tagline: "Caves, cliff trails & untamed ridge walks",
    description: "Caving in Meghalaya's living root bridge country, trekking Dzukou's flower valley, or crossing high-altitude passes in Arunachal — Northeast is India's adventure frontier.",
    img: "/images/nagaland/dzukou-valley/1.jpg",
    matches: [
      "Caving / Adventure",
      "Cave Exploration",
      "Trekking & Hiking",
      "Trekking",
      "Adventure & Sports",
    ],
  },
  {
    slug: "lakes",
    label: "Lakes & Rivers",
    tagline: "Floating islands, glacial mirrors & sacred waters",
    description: "Loktak's floating phumdis, Tsomgo's glacial stillness, and Manipur's sacred Keibul Lamjao — Northeast India's lakes are ecosystems, not just scenery.",
    img: "/images/manipur/loktak-lake/1.png",
    matches: [
      "Lake",
      "Lake / Nature",
      "Lakes & Rivers",
      "Sacred Lake",
    ],
  },
];

export const NE_STATES = [
  { name: "Assam",             slug: "assam"              },
  { name: "Meghalaya",         slug: "meghalaya"          },
  { name: "Sikkim",            slug: "sikkim"             },
  { name: "Arunachal Pradesh", slug: "arunachal-pradesh"  },
  { name: "Nagaland",          slug: "nagaland"           },
  { name: "Manipur",           slug: "manipur"            },
  { name: "Mizoram",           slug: "mizoram"            },
  { name: "Tripura",           slug: "tripura"            },
] as const;

/** Lookup a category by slug */
export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Map a raw internal category string to a clean slug */
export function matchCategory(rawCategory: string): string | undefined {
  for (const cat of CATEGORIES) {
    if (cat.matches.includes(rawCategory)) return cat.slug;
  }
  return undefined;
}
