/**
 * generate-attractions.mjs
 *
 * 1. Creates MDX place files for every CSV attraction not yet in the database.
 * 2. Writes src/data/hub-connectivity.json — hub city → nearby places with
 *    road distance & drive time, used by the Trip Planner and destination pages.
 *
 * Run: node scripts/generate-attractions.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES_DIR = path.join(__dirname, "../src/content/places");
const CONN_FILE  = path.join(__dirname, "../src/data/hub-connectivity.json");

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function fileExists(name) {
  return fs.existsSync(path.join(PLACES_DIR, `${slugify(name)}.mdx`));
}

// ─────────────────────────────────────────────────────────────────────────────
// All missing attractions extracted from the CSV
// Format: { name, state, city (hub), category, sub_category, lat, lng,
//           description, tags, permit, bestMonths, distanceKm, driveTimeMins }
// ─────────────────────────────────────────────────────────────────────────────
const ATTRACTIONS = [

  // ── ASSAM — Guwahati ──────────────────────────────────────────────────────
  {
    name: "Kamakhya Temple",
    state: "Assam", city: "Guwahati", hubSlug: "guwahati",
    category: "Religious & Spiritual", sub_category: "Hindu Temple",
    tags: ["temple", "shakti peetha", "pilgrimage", "tantra", "assam", "northeast india"],
    lat: 26.1664, lng: 91.6135, permit: false,
    distanceKm: 8, driveTimeMins: 22,
    bestMonths: ["October","November","December","January","February","March"],
    description: "Kamakhya Temple is one of the 51 Shakti Peethas and the most sacred tantric shrine in India, perched atop Nilachal Hill overlooking Guwahati. Millions of devotees visit for its unique worship of the goddess in her menstrual form — no idol, just a yoni-shaped stone bathed by an underground spring.",
    seoTitle: "Kamakhya Temple Guwahati: Timings, Entry & How to Reach",
    seoDesc: "Kamakhya Temple on Nilachal Hill is India's most powerful Shakti Peetha. Plan your visit with timings, darshan tips, Ambubachi Mela dates and how to reach from Guwahati.",
  },
  {
    name: "Umananda Island",
    state: "Assam", city: "Guwahati", hubSlug: "guwahati",
    category: "Religious & Spiritual", sub_category: "River Island Temple",
    tags: ["island temple", "brahmaputra", "shiva temple", "boat ride", "assam", "northeast india"],
    lat: 26.1875, lng: 91.7381, permit: false,
    distanceKm: 4, driveTimeMins: 25,
    bestMonths: ["October","November","December","January","February","March","April"],
    description: "Umananda — the Shiva temple on the world's smallest inhabited river island — sits in the middle of the Brahmaputra. Reached by a short ferry from Fancy Bazaar ghat, the island is also home to the rare golden langur monkey. The temple dates to the 17th century and the views of Guwahati from the river are unforgettable.",
    seoTitle: "Umananda Island Temple, Guwahati: Ferry Timings & Guide",
    seoDesc: "Visit Umananda Island — the world's smallest inhabited river island — in the Brahmaputra. Ancient Shiva temple, golden langurs, and panoramic river views from Guwahati.",
  },
  {
    name: "Brahmaputra River Cruise",
    state: "Assam", city: "Guwahati", hubSlug: "guwahati",
    category: "Adventure & Sports", sub_category: "River Cruise",
    tags: ["river cruise", "brahmaputra", "sunset", "guwahati", "assam", "northeast india"],
    lat: 26.1895, lng: 91.7478, permit: false,
    distanceKm: 2, driveTimeMins: 8,
    bestMonths: ["October","November","December","January","February","March","April","May"],
    description: "A cruise on the mighty Brahmaputra is one of Guwahati's great pleasures — watching the sunset paint the river gold while the silhouette of the Kamakhya Temple fades on the horizon. Evening cruises from Kachari Ghat are the most popular, with riverine dolphins sometimes spotted alongside.",
    seoTitle: "Brahmaputra River Cruise Guwahati: Timings, Price & Booking",
    seoDesc: "Take a sunset cruise on the Brahmaputra in Guwahati. Discover ferry timings, ticket prices, the best ghats to board, and chances to spot the rare Gangetic river dolphin.",
  },
  {
    name: "Deepor Beel",
    state: "Assam", city: "Guwahati", hubSlug: "guwahati",
    category: "Wildlife & Nature", sub_category: "Wetland & Bird Sanctuary",
    tags: ["wetland", "birdwatching", "migratory birds", "elephants", "assam", "northeast india"],
    lat: 26.1089, lng: 91.6222, permit: false,
    distanceKm: 12, driveTimeMins: 30,
    bestMonths: ["November","December","January","February","March"],
    description: "Deepor Beel is the only Ramsar wetland site in Assam — a vast freshwater lake on Guwahati's western edge that shelters over 200 species of birds including the rare Adjutant Stork, migratory bar-headed geese, and occasional wild elephants from the nearby Rani-Garbhanga forest. A birder's paradise just 30 minutes from the city.",
    seoTitle: "Deepor Beel Wildlife Sanctuary, Guwahati: Birdwatching Guide",
    seoDesc: "Deepor Beel is Assam's only Ramsar wetland — 30 mins from Guwahati. See migratory birds, Adjutant Storks, and wild elephants. Best time, entry details and birding spots.",
  },

  // ── ASSAM — Kaziranga ─────────────────────────────────────────────────────
  {
    name: "Kakochang Waterfall",
    state: "Assam", city: "Kaziranga", hubSlug: "kaziranga",
    category: "Waterfall", sub_category: "Forest Waterfall",
    tags: ["waterfall", "tea garden", "forest", "assam", "northeast india"],
    lat: 26.5522, lng: 93.3600, permit: false,
    distanceKm: 25, driveTimeMins: 40,
    bestMonths: ["June","July","August","September","October","November"],
    description: "Kakochang Waterfall cascades through a lush tea-garden landscape near Bokakhat, making it one of Assam's most scenic waterfalls. Surrounded by rolling tea bushes and dense jungle, the falls are at their most dramatic during the monsoon season when water thunders down multiple tiers.",
    seoTitle: "Kakochang Waterfall, Kaziranga: How to Reach & Best Time",
    seoDesc: "Kakochang Waterfall near Kaziranga is a hidden gem among Assam's tea gardens. Find out the best time to visit, how to reach from Kaziranga and Jorhat, and entry details.",
  },
  {
    name: "Deopahar Ruins",
    state: "Assam", city: "Kaziranga", hubSlug: "kaziranga",
    category: "History & Heritage", sub_category: "Archaeological Ruins",
    tags: ["ruins", "archaeology", "ancient temples", "assam", "northeast india"],
    lat: 26.4800, lng: 93.5600, permit: false,
    distanceKm: 30, driveTimeMins: 50,
    bestMonths: ["October","November","December","January","February","March"],
    description: "Deopahar is an 8th–12th century archaeological site near Numaligarh featuring clusters of ruined Hindu and Buddhist temples scattered across a forested hill. The site preserves beautiful stone carvings of Vishnu, Shiva, and tantric goddesses, largely unvisited by tourists — making it one of Assam's most atmospheric hidden heritage discoveries.",
    seoTitle: "Deopahar Ruins, Assam: Ancient Temple Site Near Kaziranga",
    seoDesc: "Deopahar is a forgotten 8th–12th century temple complex near Numaligarh in Assam. Explore ancient Hindu and Buddhist ruins, stone carvings, and a forested archaeological landscape.",
  },

  // ── ASSAM — Sivasagar ─────────────────────────────────────────────────────
  {
    name: "Rang Ghar",
    state: "Assam", city: "Sivasagar", hubSlug: "sivasagar",
    category: "History & Heritage", sub_category: "Royal Amphitheatre",
    tags: ["ahom kingdom", "amphitheatre", "heritage", "assam history", "assam", "northeast india"],
    lat: 26.9983, lng: 94.6294, permit: false,
    distanceKm: 5, driveTimeMins: 12,
    bestMonths: ["October","November","December","January","February","March"],
    description: "Rang Ghar is Asia's oldest surviving amphitheatre — a two-storey pavilion built by the Ahom king Pramatta Singha in the 18th century for royal sports like buffalo and elephant fights. Its distinctive boat-shaped roof and perfectly preserved galleries make it one of the most remarkable architectural monuments in all of Northeast India.",
    seoTitle: "Rang Ghar, Sivasagar: Asia's Oldest Amphitheatre | Timings & Guide",
    seoDesc: "Rang Ghar in Sivasagar is Asia's oldest amphitheatre — a royal Ahom pavilion built for elephant fights. Visit timings, entry fees, history, and how to reach from Jorhat.",
  },
  {
    name: "Talatal Ghar",
    state: "Assam", city: "Sivasagar", hubSlug: "sivasagar",
    category: "History & Heritage", sub_category: "Royal Palace",
    tags: ["ahom palace", "underground chambers", "military architecture", "assam", "northeast india"],
    lat: 26.9861, lng: 94.7097, permit: false,
    distanceKm: 8, driveTimeMins: 18,
    bestMonths: ["October","November","December","January","February","March"],
    description: "Talatal Ghar is the largest Ahom military structure in Assam — a seven-storey palace of which four floors lie underground, riddled with secret tunnels that once allowed troops to escape to distant locations. Built by King Rajeswar Singha, it remains an extraordinary feat of 18th-century military engineering, largely unexplored.",
    seoTitle: "Talatal Ghar, Sivasagar: Underground Palace with Secret Tunnels",
    seoDesc: "Talatal Ghar is Assam's most mysterious Ahom monument — 7 floors with 4 underground, connected by secret escape tunnels. Entry fees, timings and travel guide from Sivasagar.",
  },
  {
    name: "Charaideo Maidam",
    state: "Assam", city: "Sivasagar", hubSlug: "sivasagar",
    category: "History & Heritage", sub_category: "Royal Burial Mounds",
    tags: ["ahom burial mounds", "UNESCO nomination", "royal tombs", "assam", "northeast india"],
    lat: 27.0161, lng: 94.7736, permit: false,
    distanceKm: 28, driveTimeMins: 45,
    bestMonths: ["October","November","December","January","February","March"],
    description: "Charaideo Maidam is the burial ground of the Ahom kings — a UNESCO World Heritage Site nomination featuring over 90 burial mounds (maidams) spanning 600 years of Ahom rule. Often called the 'Pyramids of Assam', these sacred mounds hold the remains of the kings, queens, and nobles who built one of medieval India's most powerful kingdoms.",
    seoTitle: "Charaideo Maidam, Assam: The Pyramids of the Ahom Kingdom",
    seoDesc: "Charaideo Maidam — Assam's UNESCO World Heritage nominee — holds 90+ royal Ahom burial mounds spanning 600 years. History, timings, entry and how to reach from Sivasagar.",
  },

  // ── ASSAM — Majuli ────────────────────────────────────────────────────────
  {
    name: "Kamalabari Satra",
    state: "Assam", city: "Majuli", hubSlug: "majuli",
    category: "Religious & Spiritual", sub_category: "Vaishnavite Monastery",
    tags: ["satra", "vaishnavism", "mask making", "dance", "assam culture", "northeast india"],
    lat: 27.0094, lng: 94.2028, permit: false,
    distanceKm: 12, driveTimeMins: 20,
    bestMonths: ["October","November","December","January","February"],
    description: "Kamalabari Satra is one of Majuli's most active and accessible satras — a Vaishnavite monastery founded in the 16th century that is a living centre of Assamese mask-making, bhaona theatre, and sattriya classical dance. Visitors can watch artisans craft elaborate masks from clay and bamboo, a tradition recognised by UNESCO.",
    seoTitle: "Kamalabari Satra, Majuli: Vaishnavite Culture & Mask Making",
    seoDesc: "Kamalabari Satra in Majuli is the best place to witness Assam's UNESCO-recognised sattriya dance and traditional mask-making. Timings, how to reach by ferry, and cultural tips.",
  },
  {
    name: "Auniati Satra",
    state: "Assam", city: "Majuli", hubSlug: "majuli",
    category: "Religious & Spiritual", sub_category: "Vaishnavite Monastery",
    tags: ["satra", "vaishnavism", "museum", "antiques", "assam culture", "northeast india"],
    lat: 26.9778, lng: 94.1878, permit: false,
    distanceKm: 8, driveTimeMins: 15,
    bestMonths: ["October","November","December","January","February"],
    description: "Auniati Satra is the wealthiest and most influential monastery on Majuli, housing an extraordinary museum of royal gifts — ancient weapons, jewellery, utensils, and manuscripts gifted by Ahom kings over centuries. The satra remains a living religious community where monks maintain Vaishnavite traditions of music, dance and philosophy.",
    seoTitle: "Auniati Satra, Majuli: Museum of Royal Ahom Gifts",
    seoDesc: "Auniati Satra in Majuli houses a museum of antiques gifted by Ahom kings — jewels, weapons, manuscripts. Visit timings, museum details, and how to reach by ferry from Jorhat.",
  },

  // ── MEGHALAYA — Shillong ─────────────────────────────────────────────────
  {
    name: "Ward's Lake",
    state: "Meghalaya", city: "Shillong", hubSlug: "shillong",
    category: "Parks & Gardens", sub_category: "Ornamental Lake",
    tags: ["lake", "boating", "garden", "colonial heritage", "shillong", "meghalaya", "northeast india"],
    lat: 25.5706, lng: 91.8836, permit: false,
    distanceKm: 1, driveTimeMins: 5,
    bestMonths: ["October","November","December","January","February","March","April","May"],
    description: "Ward's Lake is Shillong's colonial-era centrepiece — a horseshoe-shaped ornamental lake surrounded by well-manicured gardens, built by the British Chief Commissioner Ward in 1894. Row boats glide past weeping willows, Japanese bridge, and colourful flower beds. It remains the most beloved park in the city centre.",
    seoTitle: "Ward's Lake Shillong: Boating, Entry Fee & Timings",
    seoDesc: "Ward's Lake is Shillong's most charming colonial-era park. Boating, Japanese bridge and ornamental gardens in the city centre. Entry fee, timings and how to reach.",
  },
  {
    name: "Don Bosco Museum Shillong",
    state: "Meghalaya", city: "Shillong", hubSlug: "shillong",
    category: "Culture & Museum", sub_category: "Tribal Heritage Museum",
    tags: ["museum", "tribal heritage", "indigenous culture", "northeast india", "meghalaya"],
    lat: 25.5757, lng: 91.9131, permit: false,
    distanceKm: 2, driveTimeMins: 8,
    bestMonths: ["October","November","December","January","February","March","April","May"],
    description: "The Don Bosco Centre for Indigenous Cultures is the largest museum in South Asia dedicated to indigenous peoples. Seven floors document the traditions, crafts, costumes, and spiritual beliefs of the over 200 tribal communities of Northeast India. The rooftop skywalk offers sweeping views over Shillong's hills.",
    seoTitle: "Don Bosco Museum Shillong: Largest Indigenous Museum in South Asia",
    seoDesc: "Don Bosco Museum in Shillong is South Asia's largest tribal heritage museum — 7 floors of Northeast India's indigenous cultures, costumes and crafts. Entry fee, timings and guide.",
  },
  {
    name: "Mawphlang Sacred Grove",
    state: "Meghalaya", city: "Shillong", hubSlug: "shillong",
    category: "Wildlife & Nature", sub_category: "Sacred Forest",
    tags: ["sacred forest", "khasi culture", "biodiversity", "eco tourism", "meghalaya", "northeast india"],
    lat: 25.4600, lng: 91.8300, permit: false,
    distanceKm: 25, driveTimeMins: 45,
    bestMonths: ["October","November","December","January","February","March","April"],
    description: "The Mawphlang Sacred Grove is one of the last ancient sacred forests of the Khasi people — a 192-acre woodland that has been preserved for centuries by religious taboo. Nothing may be removed from this forest. Ancient monoliths stand among centuries-old trees draped in moss, orchids and medicinal plants found nowhere else.",
    seoTitle: "Mawphlang Sacred Grove, Meghalaya: Ancient Khasi Forest | Guide",
    seoDesc: "Mawphlang Sacred Grove near Shillong is a 192-acre ancient forest protected by Khasi religious law for centuries. Guided walks, biodiversity, David Scott Trail, and how to visit.",
  },

  // ── MEGHALAYA — Cherrapunji ───────────────────────────────────────────────
  {
    name: "Nohkalikai Falls",
    state: "Meghalaya", city: "Cherrapunji", hubSlug: "cherrapunji",
    category: "Waterfall", sub_category: "Plunge Waterfall",
    tags: ["waterfall", "tallest waterfall", "cherrapunji", "monsoon", "meghalaya", "northeast india"],
    lat: 25.2596, lng: 91.7000, permit: false,
    distanceKm: 7, driveTimeMins: 15,
    bestMonths: ["June","July","August","September","October"],
    description: "Nohkalikai Falls plunges 340 metres — making it India's tallest plunge waterfall. The water crashes into a strikingly green pool at the base, fed by the world's highest rainfall. Named after a tragic Khasi legend of a mother who leapt to her death, it is the most dramatic and heartbreaking waterfall in Northeast India.",
    seoTitle: "Nohkalikai Falls, Cherrapunji: India's Tallest Plunge Waterfall",
    seoDesc: "Nohkalikai Falls (340m) is India's tallest plunge waterfall in Cherrapunji. Best time to visit, viewpoint details, the legend of Nohkalikai, and how to reach from Shillong.",
  },
  {
    name: "Seven Sisters Falls",
    state: "Meghalaya", city: "Cherrapunji", hubSlug: "cherrapunji",
    category: "Waterfall", sub_category: "Cascade Waterfall",
    tags: ["waterfall", "seven sisters", "cherrapunji", "monsoon", "meghalaya", "northeast india"],
    lat: 25.2700, lng: 91.7200, permit: false,
    distanceKm: 10, driveTimeMins: 20,
    bestMonths: ["June","July","August","September","October"],
    description: "Seven Sisters Falls — locally called Nohsngithiang — is a group of seven parallel waterfalls that cascade down a cliff face during the monsoon, creating a spectacular curtain of white water. The falls are visible from the Eco Park viewpoint in Sohra and only flow fully after heavy rainfall, making a monsoon visit essential.",
    seoTitle: "Seven Sisters Falls (Nohsngithiang), Cherrapunji: Monsoon Waterfall",
    seoDesc: "Seven Sisters Falls in Cherrapunji is a spectacular monsoon waterfall — seven parallel streams cascading down a cliff. Best time to visit, viewpoint, and how to reach from Shillong.",
  },
  {
    name: "Wei Sawdong Falls",
    state: "Meghalaya", city: "Cherrapunji", hubSlug: "cherrapunji",
    category: "Waterfall", sub_category: "Tiered Waterfall",
    tags: ["waterfall", "swimming", "three-tier", "offbeat", "meghalaya", "northeast india"],
    lat: 25.3100, lng: 91.7600, permit: false,
    distanceKm: 15, driveTimeMins: 30,
    bestMonths: ["October","November","December","January","February"],
    description: "Wei Sawdong is a stunning three-tiered waterfall tucked in the forest near Cherrapunji, relatively unknown and less visited than Nohkalikai. The lower tiers have natural pools perfect for swimming, accessible via a short jungle trek. Post-monsoon (October–February) offers crystal-clear water in a lush green setting.",
    seoTitle: "Wei Sawdong Falls, Cherrapunji: Three-Tiered Hidden Waterfall",
    seoDesc: "Wei Sawdong is Cherrapunji's most beautiful hidden waterfall — three tiers with swimming pools, accessible by short trek. How to reach, best time, and trekking tips.",
  },

  // ── MEGHALAYA — Jowai ────────────────────────────────────────────────────
  {
    name: "Krang Suri Falls",
    state: "Meghalaya", city: "Jowai", hubSlug: "jowai",
    category: "Waterfall", sub_category: "Natural Pool Waterfall",
    tags: ["waterfall", "turquoise pool", "swimming", "jaintia hills", "meghalaya", "northeast india"],
    lat: 25.3300, lng: 92.3000, permit: false,
    distanceKm: 30, driveTimeMins: 50,
    bestMonths: ["October","November","December","January","February","March"],
    description: "Krang Suri Falls in the Jaintia Hills is one of Meghalaya's most photogenic waterfalls — turquoise water framed by dark cliffs and lush subtropical forest. The two-tier falls feed a swimming pool of extraordinary colour, accessible by a short forest walk. Less crowded than Cherrapunji's famous falls, this is a true hidden gem.",
    seoTitle: "Krang Suri Falls, Meghalaya: Turquoise Waterfall in Jaintia Hills",
    seoDesc: "Krang Suri Falls has the most photogenic turquoise pool in Meghalaya. Swimming, waterfall trekking, and pristine Jaintia Hills nature. Entry fee, how to reach and best time.",
  },
  {
    name: "Nartiang Monoliths",
    state: "Meghalaya", city: "Jowai", hubSlug: "jowai",
    category: "History & Heritage", sub_category: "Megalithic Site",
    tags: ["monoliths", "megalithic", "jaintia culture", "heritage", "meghalaya", "northeast india"],
    lat: 25.5100, lng: 92.3400, permit: false,
    distanceKm: 25, driveTimeMins: 40,
    bestMonths: ["October","November","December","January","February","March","April"],
    description: "Nartiang houses the largest group of monoliths in Meghalaya — tall standing stones (menhirs and table stones) erected centuries ago by Jaintia kings as memorials. The ancient Durga temple beside them is still active. Together they form one of the most atmospheric heritage sites in the Northeast, virtually undiscovered by mainstream tourism.",
    seoTitle: "Nartiang Monoliths & Durga Temple, Meghalaya: Megalithic Heritage",
    seoDesc: "Nartiang in Jaintia Hills has Meghalaya's largest monolith field — ancient standing stones beside a living Durga temple. How to visit from Jowai and Shillong, and what to expect.",
  },

  // ── MEGHALAYA — Dawki ────────────────────────────────────────────────────
  {
    name: "Shnongpdeng",
    state: "Meghalaya", city: "Dawki", hubSlug: "dawki",
    category: "Adventure & Sports", sub_category: "River Camping & Adventure",
    tags: ["camping", "river", "kayaking", "cliff jumping", "umngot", "meghalaya", "northeast india"],
    lat: 25.1600, lng: 92.0100, permit: false,
    distanceKm: 5, driveTimeMins: 10,
    bestMonths: ["October","November","December","January","February","March"],
    description: "Shnongpdeng is the adventure base on the crystal-clear Umngot River — a village where travellers camp on the riverbank, kayak through transparent water, cliff jump into deep blue pools, and snorkel over a visible riverbed. The river is at its clearest from October to March when you can see every pebble from your boat.",
    seoTitle: "Shnongpdeng, Meghalaya: Camping & Adventure on Umngot River",
    seoDesc: "Shnongpdeng is the best riverside camping spot in Meghalaya — kayaking, cliff jumping and snorkelling on the crystal-clear Umngot River. Camps, prices and how to reach from Dawki.",
  },

  // ── MEGHALAYA — Mawlynnong ───────────────────────────────────────────────
  {
    name: "Riwai Living Root Bridge",
    state: "Meghalaya", city: "Mawlynnong", hubSlug: "mawlynnong",
    category: "Natural Wonder", sub_category: "Living Root Bridge",
    tags: ["living root bridge", "khasi engineering", "trekking", "mawlynnong", "meghalaya", "northeast india"],
    lat: 25.1920, lng: 91.9000, permit: false,
    distanceKm: 1, driveTimeMins: 5,
    bestMonths: ["October","November","December","January","February","March","April"],
    description: "The Riwai Living Root Bridge near Mawlynnong is one of the most accessible single-decker living root bridges in Meghalaya — roots of ancient rubber trees trained and woven over decades into a natural crossing. A 20-minute walk from the village through a bamboo grove, it offers the living root bridge experience without the steep Nongriat trek.",
    seoTitle: "Riwai Living Root Bridge, Mawlynnong: Easy Day Trek Guide",
    seoDesc: "Riwai Living Root Bridge near Mawlynnong is the easiest root bridge trek in Meghalaya. Short 20-minute walk, ideal for families. Entry fee, directions, and trek conditions.",
  },

  // ── ARUNACHAL — Tawang ───────────────────────────────────────────────────
  {
    name: "Nuranang Falls",
    state: "Arunachal Pradesh", city: "Tawang", hubSlug: "tawang",
    category: "Waterfall", sub_category: "Mountain Waterfall",
    tags: ["waterfall", "tawang road", "himalayan waterfall", "jang falls", "arunachal pradesh", "northeast india"],
    lat: 27.3220, lng: 92.0690, permit: true,
    distanceKm: 40, driveTimeMins: 75,
    bestMonths: ["April","May","June","September","October"],
    description: "Nuranang Falls (also called Jang Falls) is a breathtaking 100-metre waterfall on the road between Bomdila and Tawang — the water crashes down a sheer cliff face into a turquoise pool below, framed by rhododendron forests. Named after a local girl from the 1962 war, it is one of the most dramatic stops on the Tawang highway.",
    seoTitle: "Nuranang Falls (Jang Falls), Arunachal Pradesh: Tawang Road Waterfall",
    seoDesc: "Nuranang Falls is Arunachal's most scenic roadside waterfall on the Tawang highway. History, ILP requirements, best time to visit, and the story behind its name.",
  },
  {
    name: "Bumla Pass",
    state: "Arunachal Pradesh", city: "Tawang", hubSlug: "tawang",
    category: "Viewpoint / Passes", sub_category: "High Altitude Pass",
    tags: ["mountain pass", "india china border", "tawang", "high altitude", "arunachal pradesh", "northeast india"],
    lat: 27.7033, lng: 91.9556, permit: true,
    distanceKm: 37, driveTimeMins: 90,
    bestMonths: ["April","May","June","September","October"],
    description: "Bumla Pass at 15,200 ft is a high-altitude border pass between India and China on the McMahon Line. The Indian Army conducts flag meetings with the Chinese PLA here on important occasions. The landscape is stark, snowbound for much of the year, and the views across the Tibetan Plateau are uniquely powerful.",
    seoTitle: "Bumla Pass, Tawang: India-China Border at 15,200 ft",
    seoDesc: "Bumla Pass in Tawang sits on the India-China border at 15,200 ft. ILP and special permit requirements, best time, how to reach from Tawang town, and what to expect.",
  },
  {
    name: "Madhuri Lake",
    state: "Arunachal Pradesh", city: "Tawang", hubSlug: "tawang",
    category: "Lakes & Rivers", sub_category: "High Altitude Lake",
    tags: ["alpine lake", "high altitude", "tawang", "arunachal pradesh", "northeast india"],
    lat: 27.7500, lng: 91.9000, permit: true,
    distanceKm: 42, driveTimeMins: 100,
    bestMonths: ["April","May","June","September","October"],
    description: "Madhuri Lake (also called Shungetser or Sangetsar Lake) is a stunning high-altitude lake near Tawang, named after Bollywood actress Madhuri Dixit filmed here in the 1990s. Set at 12,000 ft amid rhododendron forests and snow-dusted peaks, the turquoise lake reflects the surrounding Himalayas with mirror-like clarity.",
    seoTitle: "Madhuri Lake (Shungetser), Tawang: High Altitude Lake Guide",
    seoDesc: "Madhuri Lake near Tawang is a famous high-altitude Himalayan lake named after a Bollywood film shoot. ILP requirements, best time to visit and how to reach from Tawang.",
  },

  // ── ARUNACHAL — Dirang ───────────────────────────────────────────────────
  {
    name: "Sangti Valley",
    state: "Arunachal Pradesh", city: "Dirang", hubSlug: "dirang",
    category: "Valley & Landscape", sub_category: "Himalayan Valley",
    tags: ["valley", "black-necked crane", "river", "birding", "arunachal pradesh", "northeast india"],
    lat: 27.4000, lng: 92.2400, permit: true,
    distanceKm: 10, driveTimeMins: 20,
    bestMonths: ["November","December","January","February"],
    description: "Sangti Valley is a serene Himalayan valley near Dirang where the Sangti River winds through kiwi and apple orchards, riverside camping meadows, and — in winter — the sacred ground of black-necked cranes migrating from Tibet. The valley is one of the few places in India where you can watch these rare cranes in their winter habitat.",
    seoTitle: "Sangti Valley, Arunachal Pradesh: Black-Necked Crane Habitat",
    seoDesc: "Sangti Valley near Dirang is the best place in India to see black-necked cranes in winter. Camping, kiwi orchards, river walks. Best time November–February and how to reach.",
  },

  // ── NAGALAND — Kohima ────────────────────────────────────────────────────
  {
    name: "Kohima War Cemetery",
    state: "Nagaland", city: "Kohima", hubSlug: "kohima",
    category: "History & Heritage", sub_category: "War Memorial",
    tags: ["WWII", "war cemetery", "battle of kohima", "kohima", "nagaland", "northeast india"],
    lat: 25.6706, lng: 94.1081, permit: false,
    distanceKm: 1, driveTimeMins: 5,
    bestMonths: ["October","November","December","January","February","March","April"],
    description: "The Kohima War Cemetery holds the graves of 1,421 Allied soldiers who fell in the 1944 Battle of Kohima — described as the 'Stalingrad of the East' and turning point of the Pacific War. The famous inscription on the memorial stone reads: 'When you go home, tell them of us and say, for your tomorrow, we gave our today.' One of the most moving places in India.",
    seoTitle: "Kohima War Cemetery, Nagaland: Battle of Kohima Memorial",
    seoDesc: "Kohima War Cemetery holds 1,421 WWII graves from the Battle of Kohima — the turning point of the Pacific War. History, visiting timings, and the famous memorial inscription.",
  },
  {
    name: "Dzukou Valley",
    state: "Nagaland", city: "Kohima", hubSlug: "kohima",
    category: "Trekking & Hiking", sub_category: "Alpine Valley Trek",
    tags: ["trekking", "valley of flowers", "dzukou lily", "nagaland", "manipur border", "northeast india"],
    lat: 25.5400, lng: 94.1100, permit: false,
    distanceKm: 30, driveTimeMins: 60,
    bestMonths: ["June","July","August","September","October"],
    description: "Dzukou Valley is the 'Valley of Flowers' of Northeast India — a high-altitude Naga-Manipur border meadow carpeted with the endemic Dzukou lily and dozens of wildflower species. The two-day trek from Viswema or Zakhama rewards with emerald meadows, a bamboo grove stream, and overnight camping under undisturbed starlit skies.",
    seoTitle: "Dzukou Valley Trek, Nagaland: Valley of Flowers Guide",
    seoDesc: "Dzukou Valley is Northeast India's most beautiful alpine trek — Dzukou lilies, emerald meadows, and overnight camping. Trek routes from Viswema and Zakhama, best time and gear list.",
  },
  {
    name: "Japfu Peak",
    state: "Nagaland", city: "Kohima", hubSlug: "kohima",
    category: "Trekking & Hiking", sub_category: "Mountain Summit",
    tags: ["trekking", "rhododendron forest", "nagaland", "highest peak", "northeast india"],
    lat: 25.5956, lng: 94.0667, permit: false,
    distanceKm: 15, driveTimeMins: 35,
    bestMonths: ["March","April","October","November"],
    description: "Japfu Peak at 3,048 metres is the second-highest peak in Nagaland and home to the world's tallest known rhododendron tree — a towering bloom of flowers each spring. The day-trek from Khonoma village passes through oak-rhododendron forest to panoramic summit views over the Kohima hills and, on clear days, distant Himalayan peaks.",
    seoTitle: "Japfu Peak Trek, Nagaland: World's Tallest Rhododendron Tree",
    seoDesc: "Japfu Peak near Kohima has the world's tallest rhododendron tree and panoramic Nagaland views. Trek guide, best time, trailhead details and what to carry.",
  },

  // ── MANIPUR — Imphal ─────────────────────────────────────────────────────
  {
    name: "Ima Keithel",
    state: "Manipur", city: "Imphal", hubSlug: "imphal",
    category: "Culture & Museum", sub_category: "Women's Market",
    tags: ["women's market", "meitei culture", "shopping", "imphal", "manipur", "northeast india"],
    lat: 24.8084, lng: 93.9413, permit: false,
    distanceKm: 2, driveTimeMins: 8,
    bestMonths: ["October","November","December","January","February","March","April","May"],
    description: "Ima Keithel — 'Mother's Market' — is the world's largest all-women market, operating for over 500 years in the heart of Imphal. Over 5,000 women traders sell everything from handloom fabrics and fish to spices and bronze. The market is a cornerstone of Meitei culture and women's economic power, and visiting it is among the most extraordinary cultural experiences in Northeast India.",
    seoTitle: "Ima Keithel, Imphal: World's Largest All-Women Market",
    seoDesc: "Ima Keithel in Imphal is the world's largest all-women market — 5,000 Meitei women traders for 500+ years. What to buy, best time to visit, and how to reach from Imphal.",
  },

  // ── MANIPUR — Ukhrul ─────────────────────────────────────────────────────
  {
    name: "Shirui Lily Peak",
    state: "Manipur", city: "Ukhrul", hubSlug: "ukhrul",
    category: "Wildlife & Nature", sub_category: "Endemic Wildflower Site",
    tags: ["shirui lily", "endemic flower", "trekking", "ukhrul", "manipur", "northeast india"],
    lat: 25.1600, lng: 94.3800, permit: false,
    distanceKm: 12, driveTimeMins: 25,
    bestMonths: ["April","May"],
    description: "Shirui Lily Peak is the only place on Earth where the Shirui lily (Lilium macklineae) grows in the wild. This delicate pink-and-white bell-shaped flower blooms each April–May on the grassy slopes of Shirui Hill near Ukhrul, attracting botanists and nature lovers. The Shirui Lily Festival celebrates this unique natural heritage every year.",
    seoTitle: "Shirui Lily Peak, Ukhrul: World's Only Habitat of Shirui Lily",
    seoDesc: "Shirui Peak is the world's only natural habitat of the Shirui Lily — blooming April–May. Festival dates, trekking guide, permit requirements and how to reach from Imphal.",
  },

  // ── SIKKIM — Gangtok ─────────────────────────────────────────────────────
  {
    name: "Tsomgo Lake",
    state: "Sikkim", city: "Gangtok", hubSlug: "gangtok",
    category: "Lakes & Rivers", sub_category: "High Altitude Lake",
    tags: ["glacial lake", "high altitude", "yak rides", "gangtok day trip", "sikkim", "northeast india"],
    lat: 27.3750, lng: 88.7667, permit: false,
    distanceKm: 40, driveTimeMins: 75,
    bestMonths: ["March","April","May","October","November","December"],
    description: "Tsomgo Lake (Changu Lake) sits at 12,400 feet — a glacial lake that freezes in winter and blooms with wildflowers in spring. Yaks carry visitors around the shore, and a small temple dedicated to Goddess Tara overlooks the water. The lake is an easy day trip from Gangtok and often combined with Baba Mandir further up the road.",
    seoTitle: "Tsomgo Lake (Changu Lake), Sikkim: Day Trip from Gangtok",
    seoDesc: "Tsomgo Lake is a stunning glacial lake at 12,400 ft near Gangtok. Yak rides, seasonal wildflowers, and easy day-trip access. Entry fee, permit, best time and how to reach.",
  },
  {
    name: "Nathu La Pass",
    state: "Sikkim", city: "Gangtok", hubSlug: "gangtok",
    category: "Viewpoint / Passes", sub_category: "High Altitude Pass",
    tags: ["india china border", "high altitude", "silk road", "gangtok", "sikkim", "northeast india"],
    lat: 27.3875, lng: 88.8319, permit: true,
    distanceKm: 54, driveTimeMins: 90,
    bestMonths: ["May","June","September","October"],
    description: "Nathu La Pass at 14,140 ft is one of the three open trading border posts between India and China — a historic Silk Road crossing on the ancient trade route to Tibet. Indian and Chinese soldiers stand face-to-face at the border gate. The pass closes during winter and requires a special permit from Gangtok. The drive from Tsomgo Lake through the snowfields is extraordinary.",
    seoTitle: "Nathu La Pass, Sikkim: India-China Border on the Silk Road",
    seoDesc: "Nathu La Pass (14,140 ft) is an India-China border crossing on the historic Silk Road. Permit requirements, open season, how to reach from Gangtok and what to expect at the top.",
  },

  // ── SIKKIM — Pelling ─────────────────────────────────────────────────────
  {
    name: "Khecheopalri Lake",
    state: "Sikkim", city: "Pelling", hubSlug: "pelling",
    category: "Lakes & Rivers", sub_category: "Sacred Lake",
    tags: ["sacred lake", "wish-granting lake", "forest", "birding", "west sikkim", "sikkim", "northeast india"],
    lat: 27.3328, lng: 88.1903, permit: false,
    distanceKm: 28, driveTimeMins: 50,
    bestMonths: ["March","April","May","October","November"],
    description: "Khecheopalri Lake is the sacred 'wish-fulfilling lake' of West Sikkim — a perfectly still forest lake surrounded by prayer flags and the calls of rare birds. Local legend says birds remove every fallen leaf from the surface to keep the lake pristine. The lake is deeply sacred to both Buddhists and Hindus, and the atmosphere of silence and devotion is extraordinary.",
    seoTitle: "Khecheopalri Lake, Sikkim: Sacred Wish-Fulfilling Lake in West Sikkim",
    seoDesc: "Khecheopalri Lake is Sikkim's most sacred and serene lake — a wish-fulfilling forest lake in West Sikkim. How to visit from Pelling, festival timings, and birdwatching guide.",
  },

  // ── SIKKIM — Yuksom ──────────────────────────────────────────────────────
  {
    name: "Yuksom",
    state: "Sikkim", city: "Pelling", hubSlug: "pelling",
    category: "History & Heritage", sub_category: "Historic Capital",
    tags: ["first capital", "coronation site", "trekking base", "dzongri trek", "west sikkim", "sikkim", "northeast india"],
    lat: 27.2875, lng: 88.2375, permit: false,
    distanceKm: 42, driveTimeMins: 70,
    bestMonths: ["March","April","May","October","November"],
    description: "Yuksom was the first capital of Sikkim, where the first Chogyal (king) was crowned in 1642. The historic Norbugang Chorten and the ancient throne stone remain from that coronation. Today Yuksom is the trekking base for the Dzongri–Goecha La trail into Khangchendzonga National Park — one of the finest Himalayan treks in India.",
    seoTitle: "Yuksom, Sikkim: First Capital & Goecha La Trek Base Camp",
    seoDesc: "Yuksom is Sikkim's first capital and the gateway to Dzongri and Goecha La trek. Historic coronation site, ancient chorten and the start of one of India's best Himalayan treks.",
  },

  // ── MIZORAM — Champhai ───────────────────────────────────────────────────
  {
    name: "Rih Dil Lake",
    state: "Mizoram", city: "Champhai", hubSlug: "champhai",
    category: "Lakes & Rivers", sub_category: "Sacred Lake",
    tags: ["sacred lake", "heart shaped lake", "myanmar border", "mizo culture", "mizoram", "northeast india"],
    lat: 23.5300, lng: 93.3900, permit: true,
    distanceKm: 8, driveTimeMins: 20,
    bestMonths: ["October","November","December","January","February"],
    description: "Rih Dil is a heart-shaped lake that holds profound spiritual significance for the Mizo people — Mizo folklore believes the souls of the dead must pass through this lake on their journey to the afterlife. The lake actually lies across the border in Myanmar, but is clearly visible from the Indian side near Champhai. Sacred, beautiful, and hauntingly atmospheric.",
    seoTitle: "Rih Dil Lake, Champhai: Sacred Mizo Lake on India-Myanmar Border",
    seoDesc: "Rih Dil is the Mizo people's sacred soul-passage lake on the India-Myanmar border near Champhai. Its spiritual significance, ILP requirements, and how to visit from Aizawl.",
  },

  // ── NAGALAND — Wokha ─────────────────────────────────────────────────────
  {
    name: "Doyang Reservoir",
    state: "Nagaland", city: "Wokha", hubSlug: "wokha",
    category: "Wildlife & Nature", sub_category: "Reservoir & Birding Site",
    tags: ["amur falcon", "migratory birds", "reservoir", "birding", "wokha", "nagaland", "northeast india"],
    lat: 26.1800, lng: 94.2000, permit: false,
    distanceKm: 15, driveTimeMins: 30,
    bestMonths: ["October","November"],
    description: "Doyang Reservoir is one of the world's greatest migratory bird spectacles — every October and November, millions of Amur falcons descend on the reservoir from Siberia, resting before their 22,000 km non-stop flight across the Arabian Sea to southern Africa. Once hunted, the falcons are now fiercely protected by local Naga communities who have become their guardians.",
    seoTitle: "Doyang Reservoir, Nagaland: Millions of Amur Falcons in October",
    seoDesc: "Doyang Reservoir in Wokha hosts millions of Amur falcons every October-November — one of the world's greatest wildlife spectacles. Birding guide, best dates, and how to reach from Kohima.",
  },

  // ── TRIPURA — Udaipur ────────────────────────────────────────────────────
  {
    name: "Tripura Sundari Temple",
    state: "Tripura", city: "Udaipur", hubSlug: "udaipur",
    category: "Religious & Spiritual", sub_category: "Shakti Peetha",
    tags: ["shakti peetha", "pilgrimage", "temple", "tripura", "goddess", "northeast india"],
    lat: 23.4967, lng: 91.4878, permit: false,
    distanceKm: 3, driveTimeMins: 8,
    bestMonths: ["October","November","December","January","February","March","April"],
    description: "Tripura Sundari Temple is one of the 51 Shakti Peethas — a sacred site where parts of the goddess Sati's body are believed to have fallen. The present 500-year-old temple houses the Soroshi idol, one of the 10 Mahavidyas, and sits on a small hill surrounded by two lakes. The annual Navratri celebrations draw hundreds of thousands of devotees from across India.",
    seoTitle: "Tripura Sundari Temple, Udaipur: One of India's 51 Shakti Peethas",
    seoDesc: "Tripura Sundari Temple in Udaipur is one of India's 51 Shakti Peethas — a 500-year-old hilltop shrine surrounded by sacred lakes. Darshan timings, Navratri festival, and how to visit.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hub connectivity data — road distances from hub city to all linked places
// This is used by Trip Planner and destination pages
// Format: { [hubSlug]: [{ placeNamePattern, distanceKm, driveTimeMins }] }
// ─────────────────────────────────────────────────────────────────────────────
const HUB_CONNECTIVITY = {
  guwahati: [
    { name: "Kamakhya Temple",          distanceKm: 8,   driveTimeMins: 22  },
    { name: "Umananda Island",           distanceKm: 4,   driveTimeMins: 25  },
    { name: "Brahmaputra River Cruise",  distanceKm: 2,   driveTimeMins: 8   },
    { name: "Deepor Beel",              distanceKm: 12,  driveTimeMins: 30  },
    { name: "Pobitora Wildlife",        distanceKm: 55,  driveTimeMins: 80  },
    { name: "Hajo",                     distanceKm: 32,  driveTimeMins: 55  },
  ],
  kaziranga: [
    { name: "Kaziranga National Park",  distanceKm: 5,   driveTimeMins: 12  },
    { name: "Kakochang Waterfall",      distanceKm: 25,  driveTimeMins: 40  },
    { name: "Deopahar Ruins",           distanceKm: 30,  driveTimeMins: 50  },
  ],
  sivasagar: [
    { name: "Rang Ghar",                distanceKm: 5,   driveTimeMins: 12  },
    { name: "Talatal Ghar",             distanceKm: 8,   driveTimeMins: 18  },
    { name: "Charaideo Maidam",         distanceKm: 28,  driveTimeMins: 45  },
  ],
  majuli: [
    { name: "Kamalabari Satra",         distanceKm: 12,  driveTimeMins: 20  },
    { name: "Auniati Satra",            distanceKm: 8,   driveTimeMins: 15  },
  ],
  shillong: [
    { name: "Ward's Lake",              distanceKm: 1,   driveTimeMins: 5   },
    { name: "Don Bosco Museum",         distanceKm: 2,   driveTimeMins: 8   },
    { name: "Shillong Peak",            distanceKm: 10,  driveTimeMins: 25  },
    { name: "Elephant Falls",           distanceKm: 12,  driveTimeMins: 30  },
    { name: "Laitlum Canyon",           distanceKm: 25,  driveTimeMins: 50  },
    { name: "Umiam Lake",               distanceKm: 17,  driveTimeMins: 35  },
    { name: "Mawphlang Sacred Grove",   distanceKm: 25,  driveTimeMins: 45  },
  ],
  cherrapunji: [
    { name: "Nohkalikai Falls",         distanceKm: 7,   driveTimeMins: 15  },
    { name: "Seven Sisters Falls",      distanceKm: 10,  driveTimeMins: 20  },
    { name: "Wei Sawdong Falls",        distanceKm: 15,  driveTimeMins: 30  },
    { name: "Mawsmai Cave",             distanceKm: 6,   driveTimeMins: 12  },
    { name: "Arwah Cave",               distanceKm: 8,   driveTimeMins: 18  },
    { name: "Double Decker Living Root Bridge", distanceKm: 55, driveTimeMins: 90 },
  ],
  jowai: [
    { name: "Krang Suri Falls",         distanceKm: 30,  driveTimeMins: 50  },
    { name: "Phe Phe Fall",             distanceKm: 20,  driveTimeMins: 35  },
    { name: "Nartiang Monoliths",       distanceKm: 25,  driveTimeMins: 40  },
  ],
  dawki: [
    { name: "Shnongpdeng",              distanceKm: 5,   driveTimeMins: 10  },
    { name: "Mawlynnong",               distanceKm: 18,  driveTimeMins: 35  },
  ],
  mawlynnong: [
    { name: "Riwai Living Root Bridge", distanceKm: 1,   driveTimeMins: 5   },
  ],
  tawang: [
    { name: "Tawang Monastery",         distanceKm: 2,   driveTimeMins: 8   },
    { name: "Tawang War Memorial",      distanceKm: 1,   driveTimeMins: 5   },
    { name: "Nuranang Falls",           distanceKm: 40,  driveTimeMins: 75  },
    { name: "Bumla Pass",               distanceKm: 37,  driveTimeMins: 90  },
    { name: "Madhuri Lake",             distanceKm: 42,  driveTimeMins: 100 },
    { name: "Sela Lake",                distanceKm: 78,  driveTimeMins: 150 },
  ],
  dirang: [
    { name: "Sangti Valley",            distanceKm: 10,  driveTimeMins: 20  },
    { name: "Dirang Dzong",             distanceKm: 3,   driveTimeMins: 8   },
  ],
  kohima: [
    { name: "Kohima War Cemetery",      distanceKm: 1,   driveTimeMins: 5   },
    { name: "Kisama Heritage Village",  distanceKm: 12,  driveTimeMins: 20  },
    { name: "Khonoma Village",          distanceKm: 20,  driveTimeMins: 35  },
    { name: "Dzukou Valley",            distanceKm: 30,  driveTimeMins: 60  },
    { name: "Japfu Peak",               distanceKm: 15,  driveTimeMins: 35  },
  ],
  imphal: [
    { name: "Kangla Fort",              distanceKm: 3,   driveTimeMins: 10  },
    { name: "Ima Keithel",              distanceKm: 2,   driveTimeMins: 8   },
    { name: "Loktak Lake",              distanceKm: 48,  driveTimeMins: 70  },
    { name: "Keibul Lamjao National Park", distanceKm: 52, driveTimeMins: 75 },
  ],
  ukhrul: [
    { name: "Shirui Lily Peak",         distanceKm: 12,  driveTimeMins: 25  },
    { name: "Khangkhui Cave",           distanceKm: 8,   driveTimeMins: 18  },
  ],
  gangtok: [
    { name: "Tsomgo Lake",              distanceKm: 40,  driveTimeMins: 75  },
    { name: "Nathu La Pass",            distanceKm: 54,  driveTimeMins: 90  },
    { name: "Rumtek Monastery",         distanceKm: 24,  driveTimeMins: 40  },
    { name: "Enchey Monastery",         distanceKm: 3,   driveTimeMins: 10  },
  ],
  pelling: [
    { name: "Pemayangtse Monastery",    distanceKm: 2,   driveTimeMins: 8   },
    { name: "Rabdentse Ruins",          distanceKm: 5,   driveTimeMins: 12  },
    { name: "Khecheopalri Lake",        distanceKm: 28,  driveTimeMins: 50  },
    { name: "Yuksom",                   distanceKm: 42,  driveTimeMins: 70  },
  ],
  champhai: [
    { name: "Rih Dil Lake",             distanceKm: 8,   driveTimeMins: 20  },
    { name: "Murlen National Park",     distanceKm: 60,  driveTimeMins: 100 },
  ],
  wokha: [
    { name: "Doyang Reservoir",         distanceKm: 15,  driveTimeMins: 30  },
    { name: "Mount Tiyi",               distanceKm: 12,  driveTimeMins: 25  },
  ],
  udaipur: [
    { name: "Tripura Sundari Temple",   distanceKm: 3,   driveTimeMins: 8   },
    { name: "Neermahal",                distanceKm: 25,  driveTimeMins: 40  },
  ],
  agartala: [
    { name: "Ujjayanta Palace",         distanceKm: 2,   driveTimeMins: 8   },
    { name: "Neermahal",                distanceKm: 53,  driveTimeMins: 75  },
    { name: "Unakoti Rock Carvings",    distanceKm: 178, driveTimeMins: 240 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MDX template
// ─────────────────────────────────────────────────────────────────────────────
function buildMdx(a) {
  const id = slugify(a.name);
  const tagsList   = a.tags.map(t => `  - ${t}`).join("\n");
  const monthsList = a.bestMonths.map(m => `    - ${m}`).join("\n");
  const permitBlock = a.permit
    ? `  ilp_required: true\n  pap_required: false\n  permit_details: "Inner Line Permit required. Apply at the state Liaison Office or online."`
    : `  ilp_required: false\n  pap_required: false\n  permit_details: "No special permit required."`;

  return `---
id: ${id}
name: ${a.name}
category: ${a.category}
sub_category: ${a.sub_category}
tags:
${tagsList}
high_intent_motivation: "${a.sub_category} near ${a.city}, ${a.state}. ${a.description.slice(0, 100).replace(/"/g, "'")}"
ratings:
  google_rating: null
  google_reviews_count: null
  our_rating: null
entry_fees:
  indian_inr: Free
  foreigner_inr: Free
  special_entry_notes: ""
location:
  lat: ${a.lat}
  lng: ${a.lng}
  address: "${a.name}, near ${a.city}, ${a.state}"
  state: ${a.state}
permit_requirements:
${permitBlock}
visiting_hours:
  open_time: "06:00 AM"
  close_time: "06:00 PM"
  closed_days:
    - None
  notes: "Verify timings locally before visiting."
seasonality:
  best_months:
${monthsList}
  peak_events:
    - Local festivals and seasonal conditions
logistics:
  - hub_name: "${a.city}"
    hub_type: road
    distance_km: ${a.distanceKm}
    drive_time_mins: ${a.driveTimeMins}
seo:
  meta_title: "${a.seoTitle}"
  meta_description: "${a.seoDesc}"
  schema_org_type: TouristAttraction
images: []
city: "${a.city}"
region: "${a.state}"
map_location:
  lat: ${a.lat}
  lng: ${a.lng}
  Maps_url: "https://www.google.com/maps?q=${a.lat},${a.lng}"
hub_images: []
seo_tags:
${tagsList}
---

## About ${a.name}

${a.description}

## How to Reach

- **From ${a.city}:** Approximately ${a.distanceKm} km (${a.driveTimeMins} minutes by road)
${a.permit ? "- **Permit required:** Inner Line Permit (ILP) for Indian citizens" : ""}

## Best Time to Visit

Ideal months: **${a.bestMonths.join(", ")}**
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
let created = 0, skipped = 0;

for (const a of ATTRACTIONS) {
  const id = slugify(a.name);
  const filepath = path.join(PLACES_DIR, `${id}.mdx`);
  if (fs.existsSync(filepath)) {
    skipped++;
    console.log(`  SKIP  ${id}`);
  } else {
    fs.writeFileSync(filepath, buildMdx(a), "utf8");
    created++;
    console.log(`  NEW   ${id}`);
  }
}

// Write hub-connectivity.json
fs.writeFileSync(CONN_FILE, JSON.stringify(HUB_CONNECTIVITY, null, 2), "utf8");

console.log(`\n✅ ${created} new MDX files created, ${skipped} already existed`);
console.log(`✅ hub-connectivity.json written — ${Object.keys(HUB_CONNECTIVITY).length} hubs mapped`);
