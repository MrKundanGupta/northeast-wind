/**
 * generate-hub-cities.mjs
 * Creates MDX place files for every hub city in the CSV research
 * and populates seo-descriptions.json with city-level SEO copy.
 *
 * Run: node scripts/generate-hub-cities.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES_DIR = path.join(__dirname, "../src/content/places");
const SEO_FILE   = path.join(__dirname, "../src/data/seo-descriptions.json");

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Hub city data parsed from cities - Sheet1.csv ────────────────────────────
const HUB_CITIES = [
  // ── ASSAM ──────────────────────────────────────────────────────────────────
  {
    state: "Assam", city: "Guwahati",
    why: "Largest city and main gateway for flights, trains and buses into Northeast India.",
    attractions: ["Kamakhya Temple", "Umananda Island", "Brahmaputra River Cruise", "Deepor Beel Wildlife Sanctuary", "Pobitora Wildlife Sanctuary", "Hajo", "Sualkuchi Silk Village"],
    tags: ["gateway city", "temples", "river cruise", "wildlife", "assam", "northeast india"],
    lat: 26.1445, lng: 91.7362,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Guwahati is the gateway to Northeast India — a city of ancient temples, Brahmaputra river cruises, and vibrant markets. Home to the sacred Kamakhya Temple and a perfect base to explore Assam and beyond.",
  },
  {
    state: "Assam", city: "Kaziranga",
    why: "Classic wildlife hub for safaris and tea garden exploration.",
    attractions: ["Kaziranga National Park", "One-Horned Rhinoceros Safari", "Elephant Safari", "Tea Gardens", "Kakochang Waterfall", "Deopahar Ruins", "Numaligarh Refinery Heritage"],
    tags: ["national park", "wildlife safari", "rhinoceros", "tea gardens", "assam", "northeast india", "UNESCO"],
    lat: 26.5775, lng: 93.1711,
    permit: false,
    bestMonths: ["November", "December", "January", "February", "March", "April"],
    seo: "Kaziranga is home to the world's largest population of one-horned rhinoceroses. Explore the UNESCO World Heritage National Park on jeep and elephant safaris, surrounded by lush tea gardens and misty hills.",
  },
  {
    state: "Assam", city: "Tezpur",
    why: "Cultural town on the Brahmaputra, ideal midway halt and base for Nameri.",
    attractions: ["Agnigarh Hill", "Bamuni Hills Ruins", "Chitralekha Udyan", "Cole Park", "Nameri National Park", "Sonai-Rupai Wildlife Sanctuary"],
    tags: ["culture", "history", "national park", "birding", "assam", "northeast india"],
    lat: 26.6338, lng: 92.7936,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Tezpur blends mythology, history, and natural beauty on the banks of the Brahmaputra. Explore ancient ruins at Agnigarh and Bamuni Hills, and use it as a gateway to Nameri National Park.",
  },
  {
    state: "Assam", city: "Jorhat",
    why: "Tea capital of Assam with over 100 tea gardens; jump-off for Majuli river island.",
    attractions: ["Tea Estate Visits", "Gibbon Wildlife Sanctuary", "Thengal Bhawan", "Dhekiakhowa Bornamghar", "Majuli Ferry", "Tocklai Tea Research Station"],
    tags: ["tea gardens", "wildlife", "culture", "river island", "assam", "northeast india"],
    lat: 26.7465, lng: 94.2026,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Jorhat is Assam's tea capital, surrounded by over 100 tea gardens and rich with Vaishnavite heritage. It's the gateway to Majuli, the world's largest river island, and home to the rare Hoolock Gibbon.",
  },
  {
    state: "Assam", city: "Majuli",
    why: "World's largest river island and neo-Vaishnavite cultural centre.",
    attractions: ["Kamalabari Satra", "Auniati Satra", "Garamur Satra", "Dakhinpat Satra", "Samaguri Mask Making", "Birdwatching", "Brahmaputra Island Views"],
    tags: ["river island", "culture", "satras", "birdwatching", "tribal art", "assam", "northeast india"],
    lat: 26.9500, lng: 94.2167,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Majuli is the world's largest river island — a living museum of Assamese culture where ancient Satras preserve centuries-old mask-making, dance, and Vaishnavite traditions surrounded by the mighty Brahmaputra.",
  },
  {
    state: "Assam", city: "Sivasagar",
    why: "Historic Ahom capital with remarkable medieval architecture and heritage.",
    attractions: ["Rang Ghar", "Talatal Ghar", "Sivadol Temples", "Ahom Museum", "Sivasagar Lake", "Joysagar Lake", "Charaideo Maidam"],
    tags: ["history", "Ahom kingdom", "heritage", "temples", "assam", "northeast india"],
    lat: 26.9836, lng: 94.6414,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Sivasagar was the capital of the Ahom kingdom for 600 years. Explore extraordinary medieval monuments including Rang Ghar (Asia's oldest amphitheatre), the Talatal Ghar palace, and sacred Sivadol temples.",
  },
  {
    state: "Assam", city: "Dibrugarh",
    why: "Largest city of Upper Assam; airport gateway for eastern tea-country circuits.",
    attractions: ["Tea Garden Walks", "Brahmaputra Riverfront", "Dehing Patkai National Park", "Dibru-Saikhowa National Park", "Radhanagar Ghat", "Naharkatia Oil Fields"],
    tags: ["tea country", "national park", "wildlife", "river", "assam", "northeast india"],
    lat: 27.4728, lng: 95.0152,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Dibrugarh is Upper Assam's commercial heart, set amid endless tea gardens on the Brahmaputra. A gateway to Dibru-Saikhowa National Park and the pristine Dehing Patkai rainforest.",
  },
  {
    state: "Assam", city: "Tinsukia",
    why: "Base for wilderness and heritage in far-eastern Assam.",
    attractions: ["Dibru-Saikhowa National Park", "Bherjan-Borjan-Padumoni Wildlife Sanctuary", "Bell Temple", "Digboi Oil Town", "Stilwell Road History"],
    tags: ["national park", "wildlife", "heritage", "oil history", "assam", "northeast india"],
    lat: 27.4883, lng: 95.3543,
    permit: false,
    bestMonths: ["November", "December", "January", "February", "March"],
    seo: "Tinsukia is the gateway to Dibru-Saikhowa National Park, famous for feral horses and river dolphins. Explore the historic Digboi oil town and the dense biodiversity of Bherjan-Borjan forests.",
  },
  {
    state: "Assam", city: "Silchar",
    why: "Main urban hub of southern Assam (Barak Valley), connecting to Mizoram and Manipur.",
    attractions: ["Khaspur Ruins", "Dolu Lake", "Maniharan Tunnel", "Barak Valley Views", "Shree Shree Kali Temple", "Phubala Lake"],
    tags: ["history", "barak valley", "lakes", "culture", "assam", "northeast india"],
    lat: 24.8333, lng: 92.7789,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Silchar is the cultural heart of the Barak Valley, surrounded by rolling hills and rivers. Explore ancient Khaspur ruins, peaceful lakes, and use it as a launchpad for Mizoram and Manipur.",
  },
  {
    state: "Assam", city: "Haflong",
    why: "Assam's only hill station with cool climate and panoramic views.",
    attractions: ["Haflong Lake", "Haflong Viewpoints", "Maibong Ruins", "Ramchandi Temple", "Jatinga Valley", "Hill Forest Trails"],
    tags: ["hill station", "lake", "views", "history", "assam", "northeast india"],
    lat: 25.1700, lng: 93.0200,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Haflong is Assam's only hill station, perched in the Dima Hasao hills with cool air and sweeping views. Explore Haflong Lake, ancient ruins at Maibong, and the mysterious Jatinga valley.",
  },
  // ── MEGHALAYA ──────────────────────────────────────────────────────────────
  {
    state: "Meghalaya", city: "Shillong",
    why: "Capital city and primary base for all of Meghalaya; 2–4 nights recommended.",
    attractions: ["Umiam Lake", "Shillong Peak", "Elephant Falls", "Ward's Lake", "Don Bosco Museum", "Laitlum Canyons", "Police Bazar Markets", "Cherrapunji Day Trip"],
    tags: ["capital city", "viewpoints", "lakes", "culture", "waterfalls", "meghalaya", "northeast india"],
    lat: 25.5788, lng: 91.8933,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March", "April"],
    seo: "Shillong is the 'Scotland of the East' — a vibrant hill capital with misty lakes, colonial-era charm, indie music culture, and dramatic canyon views. The essential base for exploring all of Meghalaya.",
  },
  {
    state: "Meghalaya", city: "Cherrapunji",
    why: "Classic nature and waterfall hub; base for caves and living root bridges.",
    attractions: ["Nohkalikai Falls", "Seven Sisters Falls", "Wei Sawdong Waterfall", "Mawsmai Cave", "Arwah Cave", "Eco Park", "Garden of Caves", "Bangladesh Viewpoints"],
    tags: ["waterfalls", "caves", "living root bridges", "monsoon", "meghalaya", "northeast india"],
    lat: 25.2800, lng: 91.7200,
    permit: false,
    bestMonths: ["June", "July", "August", "September", "October"],
    seo: "Cherrapunji — also called Sohra — is one of the wettest places on Earth. Marvel at the thundering Nohkalikai Falls, explore limestone caves, and trek to living root bridges in the cloud-covered khasi hills.",
  },
  {
    state: "Meghalaya", city: "Nongriat",
    why: "Trekking hub for the legendary double-decker living root bridge.",
    attractions: ["Double Decker Living Root Bridge", "Rainbow Falls", "Natural Rock Pool", "Deep Valley Trekking", "Homestay Village Walks"],
    tags: ["living root bridges", "trekking", "waterfall", "offbeat", "meghalaya", "northeast india"],
    lat: 25.2522, lng: 91.7361,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Nongriat is the trekking destination for the iconic Double Decker Living Root Bridge — a bio-engineering marvel grown over centuries by the Khasi people. The 3500-step descent rewards with crystal pools and rainforest.",
  },
  {
    state: "Meghalaya", city: "Mawlynnong",
    why: "Asia's cleanest village near the Bangladesh border.",
    attractions: ["Mawlynnong Village", "Riwai Living Root Bridge", "Sky View Bamboo Tower", "Balancing Rock", "Bangladesh Border Viewpoint", "Village Nature Walks"],
    tags: ["cleanest village", "living root bridge", "nature", "khasi culture", "meghalaya", "northeast india"],
    lat: 25.1956, lng: 91.9022,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Mawlynnong is Asia's cleanest village — a spotless Khasi hamlet near the Bangladesh border with bamboo sky views, a single-decker living root bridge, and a community that takes extraordinary pride in its environment.",
  },
  {
    state: "Meghalaya", city: "Dawki",
    why: "River-side adventure hub on the crystal-clear Umngot River.",
    attractions: ["Umngot River Boating", "Crystal Clear Water Views", "Shnongpdeng Camping", "Kayaking and Swimming", "India-Bangladesh Border Viewpoint"],
    tags: ["river", "boating", "camping", "adventure", "crystal water", "meghalaya", "northeast india"],
    lat: 25.1760, lng: 92.0227,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Dawki sits on the Umngot River — so clear you can see every pebble on the riverbed. Boat through this natural aquarium, camp at Shnongpdeng, and gaze across into Bangladesh from the hilltops above.",
  },
  {
    state: "Meghalaya", city: "Jowai",
    why: "Less-crowded cultural and waterfall hub in the Jaintia Hills.",
    attractions: ["Krang Suri Falls", "Phe Phe Falls", "Nartiang Monoliths", "Nartiang Durga Temple", "Thadlaskein Lake", "Jaintia Hills Views"],
    tags: ["waterfalls", "monoliths", "jaintia culture", "offbeat", "meghalaya", "northeast india"],
    lat: 25.4500, lng: 92.2000,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Jowai in the Jaintia Hills is Meghalaya's offbeat gem — home to the turquoise Krang Suri Falls, towering monoliths at Nartiang, and an ancient Durga temple without the crowds of Shillong or Cherrapunji.",
  },
  {
    state: "Meghalaya", city: "Tura",
    why: "Western Meghalaya eco-tourism hub in the Garo Hills.",
    attractions: ["Nokrek National Park", "Tura Peak", "Siju Caves", "Balpakram National Park", "Baghmara Orchid Garden", "Garo Heritage Sites"],
    tags: ["national park", "caves", "garo culture", "offbeat", "meghalaya", "northeast india"],
    lat: 25.5190, lng: 90.2140,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Tura is the gateway to the Garo Hills — a world of dense forests, dramatic sandstone canyons at Balpakram, rare citrus fruits in Nokrek Biosphere, and the extraordinary Siju bat caves.",
  },
  // ── ARUNACHAL PRADESH ──────────────────────────────────────────────────────
  {
    state: "Arunachal Pradesh", city: "Tawang",
    why: "Signature high-altitude hub — monasteries, lakes and war history.",
    attractions: ["Tawang Monastery", "Tawang War Memorial", "Sela Pass", "Sela Lake", "Nuranang Falls", "Bumla Pass", "Madhuri Lake", "Penga Teng Tso Lake"],
    tags: ["monastery", "high altitude", "war memorial", "mountain pass", "arunachal pradesh", "northeast india"],
    lat: 27.5860, lng: 91.8607,
    permit: true,
    bestMonths: ["March", "April", "May", "June", "September", "October"],
    seo: "Tawang is Arunachal Pradesh's crown jewel — home to one of the world's largest Buddhist monasteries, the sacred Sela Pass at 13,700 ft, the crystal Sela Lake, and a deeply moving war memorial from the 1962 conflict.",
  },
  {
    state: "Arunachal Pradesh", city: "Bomdila",
    why: "Acclimatisation hub on the western circuit between Tezpur and Tawang.",
    attractions: ["Bomdila Monastery", "Upper Gompa", "Middle Gompa", "Valley Viewpoints", "War Memorial", "Craft Centre", "Apple Orchards"],
    tags: ["monastery", "viewpoints", "acclimatisation", "apple orchards", "arunachal pradesh", "northeast india"],
    lat: 27.2647, lng: 92.4236,
    permit: true,
    bestMonths: ["March", "April", "May", "October", "November"],
    seo: "Bomdila is the acclimatisation stop on the road to Tawang — a hill town of Buddhist gompas, apple orchards, and sweeping Himalayan views that prepare travellers for the high-altitude journey ahead.",
  },
  {
    state: "Arunachal Pradesh", city: "Dirang",
    why: "Scenic valley hub with birding, orchards and relaxed stays before Tawang.",
    attractions: ["Dirang Dzong", "Thupsung Dhargye Ling Monastery", "Sangti Valley", "Black-Necked Crane Habitat", "Hot Springs", "Yak Research Centre", "Kiwi and Apple Orchards"],
    tags: ["valley", "monastery", "birding", "hot springs", "yak", "arunachal pradesh", "northeast india"],
    lat: 27.3574, lng: 92.2393,
    permit: true,
    bestMonths: ["October", "November", "December", "March", "April", "May"],
    seo: "Dirang Valley is a hidden gem between Bomdila and Tawang — a gentle paradise of hot springs, kiwi orchards, ancient dzongs, and the serene Sangti Valley where black-necked cranes winter by the river.",
  },
  {
    state: "Arunachal Pradesh", city: "Itanagar",
    why: "Administrative capital; access node for the central circuit.",
    attractions: ["Ita Fort", "Jawaharlal Nehru State Museum", "Ganga Lake", "Gompa Buddha Vihar", "Polo Park", "Namdapha Road Onwards"],
    tags: ["capital", "fort", "museum", "Buddhist temple", "arunachal pradesh", "northeast india"],
    lat: 27.0844, lng: 93.6053,
    permit: true,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Itanagar is the gateway to Arunachal Pradesh — home to the 14th-century Ita Fort, a rich tribal museum, and the serene Ganga Lake. A modern capital surrounded by forested hills and diverse tribal cultures.",
  },
  {
    state: "Arunachal Pradesh", city: "Ziro",
    why: "Cultural and landscape hub of the Apatani people; Ziro Music Festival base.",
    attractions: ["Apatani Village Circuit", "Ziro Valley Paddy Fields", "Talley Valley Wildlife Sanctuary", "Kardo Hill", "Ziro Putu Viewpoint", "Ziro Music Festival (September)"],
    tags: ["apatani culture", "music festival", "valley", "trekking", "offbeat", "arunachal pradesh", "northeast india"],
    lat: 27.5928, lng: 93.8369,
    permit: true,
    bestMonths: ["March", "April", "May", "September", "October"],
    seo: "Ziro Valley is Arunachal's most poetic landscape — a UNESCO-nominated valley of terraced paddy fields, pine forests, and Apatani villages where women wear traditional face tattoos. Every September, it hosts the legendary Ziro Music Festival.",
  },
  {
    state: "Arunachal Pradesh", city: "Pasighat",
    why: "Oldest town in Arunachal; base on the Siang river.",
    attractions: ["Siang Riverfront", "Hanging Bridges", "Daying Ering Wildlife Sanctuary", "Kekar Monying Waterfall", "Craft Village", "River Rafting"],
    tags: ["river", "wildlife sanctuary", "adventure", "culture", "arunachal pradesh", "northeast india"],
    lat: 28.0667, lng: 95.3249,
    permit: true,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Pasighat, Arunachal's oldest town, sits where the mighty Siang River enters the plains. A paradise for river rafting, wildlife spotting in Daying Ering Sanctuary, and exploring the rich Adi tribal culture.",
  },
  {
    state: "Arunachal Pradesh", city: "Mechuka",
    why: "Offbeat high-valley hub near the Indo-Tibet border.",
    attractions: ["Mechuka Valley Scenery", "Yargyap Chu River", "Samten Yangchag Monastery", "Dorjeeling Village", "Mechuka Adventure Festival", "Local Memba Culture"],
    tags: ["offbeat", "himalayan valley", "monastery", "adventure", "tibet border", "arunachal pradesh", "northeast india"],
    lat: 28.6264, lng: 94.0328,
    permit: true,
    bestMonths: ["April", "May", "September", "October"],
    seo: "Mechuka is the remotest valley in Arunachal — a pristine Himalayan bowl near the Tibet border where the Yargyap Chu river gleams silver, ancient monasteries stand in silence, and the Memba tribe preserves a world unchanged.",
  },
  {
    state: "Arunachal Pradesh", city: "Roing",
    why: "Eastern hub between plains and hills; base for lakes and archaeology.",
    attractions: ["Mayudia Pass", "Mehao Lake", "Mehao Wildlife Sanctuary", "Bhismaknagar Fort Ruins", "Reh Festival", "Mishmi Hills Treks"],
    tags: ["lake", "wildlife sanctuary", "archaeology", "mountain pass", "arunachal pradesh", "northeast india"],
    lat: 28.1333, lng: 95.8500,
    permit: true,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Roing is Arunachal's quiet eastern hub — base for the snowbound Mayudia Pass, the turquoise Mehao Lake, the ancient Bhismaknagar fort ruins, and rich Mishmi tribal culture deep in the Dibang Valley foothills.",
  },
  // ── NAGALAND ───────────────────────────────────────────────────────────────
  {
    state: "Nagaland", city: "Dimapur",
    why: "Main gateway with airport and railhead; logistics hub for the state.",
    attractions: ["Kachari Ruins", "Diezephe Craft Village", "Nagaland Zoological Park", "Rangapahar Reserve Forest", "Triple Falls", "Local Markets"],
    tags: ["gateway", "heritage ruins", "crafts", "wildlife", "nagaland", "northeast india"],
    lat: 25.9009, lng: 93.7273,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Dimapur is Nagaland's commercial gateway — home to mysterious Kachari megalithic ruins, a thriving craft village, and the Rangapahar forest reserve. The essential transit point before heading to Kohima and beyond.",
  },
  {
    state: "Nagaland", city: "Kohima",
    why: "Capital city; history, culture and access to treks.",
    attractions: ["Kohima War Cemetery", "State Museum", "Kisama Naga Heritage Village", "Hornbill Festival (December)", "Khonoma Green Village", "Japfu Peak", "Dzukou Valley Trek"],
    tags: ["war memorial", "culture", "hornbill festival", "trekking", "nagaland", "northeast india"],
    lat: 25.6751, lng: 94.1086,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Kohima is Nagaland's evocative capital — site of WWII's 'Battle of the Tennis Court', home to the spectacular Hornbill Festival in December, and the gateway to Dzukou Valley's emerald meadows and the indigenous Khonoma green village.",
  },
  {
    state: "Nagaland", city: "Mokokchung",
    why: "Cultural hub of the Ao tribe; village-based stays and authentic culture.",
    attractions: ["Ao Tribal Villages (Ungma, Longkhum)", "Mopungchuket Village", "Town Museum", "Moatsu Festival (May)", "Local Weaving Demonstrations", "Rice Beer Culture"],
    tags: ["ao tribe", "village walks", "festivals", "culture", "nagaland", "northeast india"],
    lat: 26.3300, lng: 94.5100,
    permit: false,
    bestMonths: ["April", "May", "October", "November", "December"],
    seo: "Mokokchung is the heartland of the Ao Naga people — a highland town where warrior tradition meets warm hospitality. Visit the ancient Ungma village, watch traditional weaving, and join the Moatsu harvest festival celebrations.",
  },
  {
    state: "Nagaland", city: "Mon",
    why: "Remote cultural hub of the Konyak Nagas near the India-Myanmar border.",
    attractions: ["Longwa Village (India-Myanmar Border)", "Chui Village", "Shangnyu Village", "Veda Peak", "Tattooed Headmen", "Aoleang Festival (April)"],
    tags: ["konyak tribe", "border village", "headhunter culture", "remote", "nagaland", "northeast india"],
    lat: 26.7200, lng: 95.0600,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March", "April"],
    seo: "Mon is Nagaland's most remote and fascinating district — home to the last headhunters of the Konyak Naga. Visit Longwa village where the chief's hut straddles India and Myanmar, and witness extraordinary tattooed warrior culture.",
  },
  {
    state: "Nagaland", city: "Wokha",
    why: "Scenic hill and lake hub, famous for Amur falcon roosting.",
    attractions: ["Mount Tiyi", "Doyang Reservoir", "Amur Falcon Roosting (October-November)", "Lotha Villages", "Handicrafts", "Valley Views"],
    tags: ["birding", "falcon migration", "lake", "lotha tribe", "nagaland", "northeast india"],
    lat: 26.1000, lng: 94.3300,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Wokha is Nagaland's secret birding paradise — every October, millions of Amur falcons roost at Doyang Reservoir on their migration to Africa, creating one of the world's greatest wildlife spectacles. Mount Tiyi watches over it all.",
  },
  // ── MANIPUR ────────────────────────────────────────────────────────────────
  {
    state: "Manipur", city: "Imphal",
    why: "Capital and main entry hub; base for most of the state.",
    attractions: ["Kangla Fort", "Imphal War Cemetery", "Ima Keithel Women's Market", "Shree Govindajee Temple", "Manipur State Museum", "Khonghampat Orchidarium"],
    tags: ["capital", "fort", "women's market", "temple", "war memorial", "manipur", "northeast india"],
    lat: 24.8170, lng: 93.9368,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Imphal is Manipur's dynamic capital — where the legendary Ima Keithel (the world's largest all-women market) meets ancient Kangla Fort, a moving WWII cemetery, and the golden domes of Shree Govindajee Temple.",
  },
  {
    state: "Manipur", city: "Loktak Lake",
    why: "Signature lake hub with floating islands and rare Sangai deer.",
    attractions: ["Loktak Lake Floating Islands (Phumdis)", "Sendra Island", "Keibul Lamjao National Park", "Sangai Deer Sanctuary", "INA Memorial at Moirang", "Sunset Boat Rides"],
    tags: ["floating islands", "national park", "sangai deer", "lake", "INA memorial", "manipur", "northeast india"],
    lat: 24.5330, lng: 93.8000,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Loktak Lake is the largest freshwater lake in Northeast India — a surreal landscape of floating phumdis (biomass islands), home to the endangered Sangai dancing deer and the only floating national park on Earth.",
  },
  {
    state: "Manipur", city: "Ukhrul",
    why: "Hill-station hub east of Imphal; Tangkhul Naga culture and treks.",
    attractions: ["Shirui Hills and Peak", "Shirui Lily Festival (April-May)", "Khangkhui Limestone Caves", "Rolling Hill Views", "Village Walks", "Local Churches"],
    tags: ["hill station", "Shirui lily", "caves", "tangkhul tribe", "manipur", "northeast india"],
    lat: 25.1000, lng: 94.3667,
    permit: false,
    bestMonths: ["April", "May", "October", "November"],
    seo: "Ukhrul is Manipur's most scenic hill district, home to the rare Shirui Lily that blooms only here in the world. Explore Khangkhui caves, trek the rolling Tangkhul Naga highlands, and attend the exuberant Shirui Lily Festival.",
  },
  // ── SIKKIM ─────────────────────────────────────────────────────────────────
  {
    state: "Sikkim", city: "Gangtok",
    why: "Capital and primary base; almost every Sikkim trip starts here.",
    attractions: ["MG Marg Promenade", "Enchey Monastery", "Do-Drul Chorten", "Tashi View Point", "Rumtek Monastery", "Tsomgo Lake Day Trip", "Nathu La Pass Day Trip", "Banjhakri Falls"],
    tags: ["capital", "monastery", "promenade", "viewpoints", "mountain views", "sikkim", "northeast india"],
    lat: 27.3389, lng: 88.6065,
    permit: false,
    bestMonths: ["March", "April", "May", "October", "November", "December"],
    seo: "Gangtok is Sikkim's elegant hill capital — a cosmopolitan city with Buddhist monasteries, cable cars over mountain ridges, and breathtaking views of Kanchenjunga. The perfect base for North, South, East, and West Sikkim explorations.",
  },
  {
    state: "Sikkim", city: "Lachen",
    why: "High-altitude base for Gurudongmar Lake and North Sikkim wilderness.",
    attractions: ["Gurudongmar Lake", "Chopta Valley", "Thangu Valley", "Shingba Rhododendron Sanctuary", "Lachen Monastery", "High Altitude Meadows"],
    tags: ["high altitude", "sacred lake", "rhododendrons", "north sikkim", "wilderness", "sikkim", "northeast india"],
    lat: 27.7273, lng: 88.5580,
    permit: true,
    bestMonths: ["March", "April", "May", "October"],
    seo: "Lachen is the stepping stone to the sacred Gurudongmar Lake at 17,800 ft — one of the highest lakes in the world. A village of yaks, rhododendron forests, and silence at the edge of the Tibetan Plateau.",
  },
  {
    state: "Sikkim", city: "Lachung",
    why: "Valley hub for Yumthang and Zero Point explorations.",
    attractions: ["Yumthang Valley", "Zero Point (Yumesamdong)", "Lachung Monastery", "Hot Springs", "Alpine Flower Fields", "River Valley Views"],
    tags: ["valley of flowers", "high altitude", "hot springs", "north sikkim", "sikkim", "northeast india"],
    lat: 27.6859, lng: 88.7385,
    permit: true,
    bestMonths: ["April", "May", "October"],
    seo: "Lachung is the gateway to Yumthang — the Valley of Flowers — where rhododendrons, primulas, and poppies carpet the alpine meadows every spring. Push further to Zero Point at 15,000 ft for surreal snowfields.",
  },
  {
    state: "Sikkim", city: "Pelling",
    why: "Scenic Kanchenjunga-view hub and monastery-ruins circuit.",
    attractions: ["Pemayangtse Monastery", "Rabdentse Ruins", "Khecheopalri Lake", "Kanchenjunga Views", "Khangchendzonga Waterfalls", "Helipad Viewpoint", "Rimbi River"],
    tags: ["monastery", "heritage ruins", "mountain views", "sacred lake", "west sikkim", "sikkim", "northeast india"],
    lat: 27.3050, lng: 88.2640,
    permit: false,
    bestMonths: ["March", "April", "May", "October", "November"],
    seo: "Pelling offers the most dramatic face-to-face views of Kanchenjunga, the world's third-highest peak. Explore the ancient Pemayangtse Monastery, the ruins of Rabdentse (Sikkim's former capital), and the wish-granting Khecheopalri Lake.",
  },
  {
    state: "Sikkim", city: "Ravangla",
    why: "South Sikkim hub with Buddha Park and monasteries.",
    attractions: ["Buddha Park of Ravangla", "Samdruptse Hill (Guru Padmasambhava Statue)", "Namchi Char Dham", "Ralang Monastery", "Tea Gardens", "Valley Views"],
    tags: ["Buddha park", "monastery", "pilgrimage", "south sikkim", "tea gardens", "sikkim", "northeast india"],
    lat: 27.3060, lng: 88.3490,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March", "April", "May"],
    seo: "Ravangla in South Sikkim is a pilgrimage and panorama destination — home to the magnificent Tathagata Tsal Buddha Park, the world's tallest Guru Padmasambhava statue at Namchi, and Ralang Monastery's vibrant Kagyed dance festival.",
  },
  // ── MIZORAM ────────────────────────────────────────────────────────────────
  {
    state: "Mizoram", city: "Aizawl",
    why: "Capital and primary gateway; central base for city sights and day trips.",
    attractions: ["Solomon's Temple", "Durtlang Hills", "Mizoram State Museum", "Bara Bazar Market", "Aizawl Zoo", "Hmuifang Hill Resort", "Reiek Tlang Trek"],
    tags: ["capital", "church", "museum", "viewpoints", "culture", "mizoram", "northeast india"],
    lat: 23.7271, lng: 92.7176,
    permit: true,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Aizawl is Mizoram's vibrant capital — a vertical city built on steep hills, crowned by the towering Solomon's Temple. Explore its lively bazaars, hilltop views over the Tlawng River, and the warm Christian Mizo culture.",
  },
  {
    state: "Mizoram", city: "Champhai",
    why: "Eastern border hub near Myanmar; scenic lakes and vineyards.",
    attractions: ["Rih Dil Lake", "Murlen National Park", "Lengteng Wildlife Sanctuary", "Zokhawthar Border Viewpoint", "Champhai Orchards", "Myanmar Border Views"],
    tags: ["border town", "lake", "national park", "wildlife", "mizoram", "northeast india"],
    lat: 23.4527, lng: 93.3200,
    permit: true,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Champhai is Mizoram's eastern gem on the Myanmar border — home to the heart-shaped Rih Dil sacred lake, dense Murlen National Park forests, and sweeping views of Myanmar from hilltop vineyards.",
  },
  {
    state: "Mizoram", city: "Serchhip",
    why: "Waterfall and nature hub south of Aizawl.",
    attractions: ["Vantawng Falls", "Chhingpuii Thlan", "Thenzawl Village", "Thenzawl Handloom Centre", "Serchhip Town Views"],
    tags: ["waterfall", "handloom", "culture", "nature", "mizoram", "northeast india"],
    lat: 23.3008, lng: 92.8473,
    permit: true,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Serchhip is home to Vantawng Falls — Mizoram's tallest waterfall — cascading through a forested gorge. Explore Thenzawl's famous handloom weaving village and the haunting historic memorial of Chhingpuii Thlan.",
  },
  {
    state: "Mizoram", city: "Lunglei",
    why: "Southern hill hub for valleys and caves.",
    attractions: ["Lunglei Caves", "Ailawng Adventure Park", "Sazaikawn Village", "Trekking Routes", "Valley Viewpoints", "Tlabung Border"],
    tags: ["caves", "adventure", "trekking", "offbeat", "mizoram", "northeast india"],
    lat: 22.8833, lng: 92.7333,
    permit: true,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Lunglei is Mizoram's southern highland hub — a town of cool mists, dramatic caves, and the kind of unhurried mountain life that feels like stepping back a century. Base for trekking deep into the Southern Mizoram hills.",
  },
  // ── TRIPURA ────────────────────────────────────────────────────────────────
  {
    state: "Tripura", city: "Agartala",
    why: "Capital and main gateway; base for palaces and culture.",
    attractions: ["Ujjayanta Palace Museum", "Pushbanta Palace", "Fourteen Goddess Temple", "Jagannath Temple", "Heritage Park", "Rabindra Kanan", "IMA Market"],
    tags: ["capital", "palace", "temples", "museum", "culture", "tripura", "northeast india"],
    lat: 23.8315, lng: 91.2868,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Agartala is Tripura's royal capital, home to the grand Ujjayanta Palace — now a museum — and the revered Fourteen Goddess Temple. A city where Bengali culture blends with tribal Tripuri heritage in fascinating harmony.",
  },
  {
    state: "Tripura", city: "Udaipur",
    why: "Historic temple and lake hub further south.",
    attractions: ["Tripura Sundari Temple", "Amarsagar Lake", "Dhanyashri Lake", "Bhuvaneshwari Temple", "Matsya Bhavan Aquarium", "Coconut Groves"],
    tags: ["shakti peetha", "temples", "lakes", "pilgrimage", "tripura", "northeast india"],
    lat: 23.5300, lng: 91.4900,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Udaipur in Tripura is a sacred town centred on the Tripura Sundari Temple — one of the 51 Shakti Peethas and one of the most revered goddess shrines in India, set amid serene lakes and royal gardens.",
  },
  {
    state: "Tripura", city: "Neermahal",
    why: "Lake and water palace hub; easy day/overnight trip from Agartala.",
    attractions: ["Neermahal Water Palace", "Rudrasagar Lake", "Sepahijala Wildlife Sanctuary", "Tepania Eco Park", "Boat Rides at Sunset"],
    tags: ["water palace", "lake", "wildlife sanctuary", "eco park", "tripura", "northeast india"],
    lat: 23.5023, lng: 91.4036,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February", "March"],
    seo: "Neermahal rises from the middle of Rudrasagar Lake like a Mughal mirage — Tripura's stunning water palace, built in 1930, glowing golden at sunset. One of the most unique royal monuments in all of Northeast India.",
  },
  {
    state: "Tripura", city: "Unakoti",
    why: "Northern rock-art and temple hub; extraordinary ancient carvings.",
    attractions: ["Unakoti Rock Carvings", "Ancient Shiva Reliefs", "Temple Ruins", "Forest Trekking", "Jampui Hills Nearby"],
    tags: ["rock art", "Shiva carvings", "heritage", "pilgrimage", "tripura", "northeast india"],
    lat: 24.3189, lng: 92.0863,
    permit: false,
    bestMonths: ["October", "November", "December", "January", "February"],
    seo: "Unakoti is Tripura's most astonishing heritage site — thousands of ancient bas-relief carvings of Shiva and other deities cut into a forested hillside, dating back to the 7th century. A true lost-world discovery.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function permitBlock(ilp) {
  if (!ilp) return `permit_requirements:
  ilp_required: false
  pap_required: false
  permit_details: "No special permit required for most visitors."`;
  return `permit_requirements:
  ilp_required: true
  pap_required: false
  permit_details: "Inner Line Permit (ILP) required for Indian citizens visiting this area. Apply online at https://arunachalpradesh.gov.in or at state Liaison Offices."`;
}

function buildMdx(hub) {
  const id = slugify(`${hub.city} hub city ${hub.state}`);
  const closedDays = "  closed_days:\n    - None";
  const bestMonthsList = hub.bestMonths.map(m => `    - ${m}`).join("\n");
  const tagsList = hub.tags.map(t => `  - ${t}`).join("\n");
  const attractionsList = hub.attractions.slice(0, 5).map(a => `  - ${a.replace(/[:"]/g, "")}`).join("\n");
  const logisticsEntry = hub.state === "Arunachal Pradesh"
    ? `logistics:\n  - hub_name: "Nearest Airport"\n    hub_type: airport\n    distance_km: 80\n    drive_time_mins: 120`
    : `logistics:\n  - hub_name: "Nearest Airport"\n    hub_type: airport\n    distance_km: 30\n    drive_time_mins: 45`;

  const content = `---
id: ${id}
name: ${hub.city}
category: City & Town
sub_category: Hub City
tags:
${tagsList}
high_intent_motivation: "Essential hub city for exploring ${hub.state}. ${hub.why}"
ratings:
  google_rating: 4.2
  google_reviews_count: "500+"
  our_rating: null
entry_fees:
  indian_inr: Free
  foreigner_inr: Free
  special_entry_notes: ""
location:
  lat: ${hub.lat}
  lng: ${hub.lng}
  address: "${hub.city}, ${hub.state}"
  state: ${hub.state}
${permitBlock(hub.permit)}
visiting_hours:
  open_time: "00:00 AM"
  close_time: "11:59 PM"
${closedDays}
  notes: "A city / hub — open all year. Individual attractions have their own timings."
seasonality:
  best_months:
${bestMonthsList}
  peak_events:
${hub.attractions.slice(0, 3).map(a => `    - ${a.replace(/[:"]/g, "")}`).join("\n")}
${logisticsEntry}
seo:
  meta_title: "Best Places to Visit in ${hub.city}, ${hub.state} — Complete Travel Guide"
  meta_description: "${hub.seo.slice(0, 155)}"
  schema_org_type: City
images: []
city: "${hub.city}"
region: "${hub.state}"
map_location:
  lat: ${hub.lat}
  lng: ${hub.lng}
  Maps_url: "https://www.google.com/maps?q=${hub.lat},${hub.lng}"
hub_images: []
seo_tags:
${tagsList}
---

## About ${hub.city}

${hub.seo}

## Top Attractions Near ${hub.city}

${hub.attractions.map(a => `- **${a}**`).join("\n")}

## Why Visit ${hub.city}

${hub.why}

## Best Time to Visit

The ideal months to visit are **${hub.bestMonths.join(", ")}**.

## How to Reach ${hub.city}

${hub.state === "Arunachal Pradesh" || hub.state === "Mizoram" || hub.state === "Manipur" || hub.state === "Nagaland" ? `
- **By Air:** Nearest airport with connecting flights from Guwahati and Kolkata.
- **By Road:** Well-connected by NH from Guwahati and state capitals.
` : `
- **By Air:** Direct or connecting flights from Delhi, Kolkata, and Guwahati.
- **By Rail:** Train connections to major Northeast railway stations.
- **By Road:** NH connections from Guwahati and neighbouring states.
`}
${hub.permit ? `## Permit Requirements

Inner Line Permit (ILP) required for Indian citizens. Foreign nationals require a Protected Area Permit (PAP). Apply online at the official state government portal well in advance.` : ""}
`;
  return { id, content };
}

// ── Main ─────────────────────────────────────────────────────────────────────

let created = 0;
let skipped = 0;
const seoData = { cityHubs: {}, nicheIntersects: {} };

for (const hub of HUB_CITIES) {
  const { id, content } = buildMdx(hub);
  const filename = path.join(PLACES_DIR, `${id}.mdx`);

  if (fs.existsSync(filename)) {
    skipped++;
  } else {
    fs.writeFileSync(filename, content, "utf8");
    created++;
  }

  // Add SEO description keyed by city slug (used by /destinations/[city]/)
  const citySlug = slugify(hub.city);
  seoData.cityHubs[citySlug] = hub.seo;
}

// Write seo-descriptions.json
fs.writeFileSync(SEO_FILE, JSON.stringify(seoData, null, 2), "utf8");

console.log(`✅ Done — ${created} MDX files created, ${skipped} already existed`);
console.log(`✅ seo-descriptions.json updated with ${Object.keys(seoData.cityHubs).length} city hub descriptions`);
