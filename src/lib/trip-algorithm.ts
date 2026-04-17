/* ─────────────────────────────────────────────────────────────────────────────
   Trip Algorithm
   - Haversine distance between any two lat/lng points
   - Road-factor-corrected drive time estimates for NE India terrain
   - Nearest-neighbour route optimisation (greedy TSP)
   - Day-by-day itinerary builder with auto-lunch, drive slots, visit windows
───────────────────────────────────────────────────────────────────────────── */

export interface PlaceData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  subCategory: string;
  state: string;
  city: string;
  rating: number | null;
  image: string | null;
  tags: string[];
  visitingHours: { open_time?: string; close_time?: string } | null;
  logistics: { hub_name: string; drive_time_mins: number; distance_km: number }[];
}

export type TravelMode = 'car' | 'bike' | 'public';
export type Pace       = 'relaxed' | 'moderate' | 'explorer';

export interface TripParams {
  startingPoint: { id: string; name: string; lat: number; lng: number };
  durationDays: number;
  interests: string[];   // user-selected interest slugs
  travelMode: TravelMode;
  pace: Pace;
  startDate?: string;    // ISO date string, optional
}

export interface TripActivity {
  id: string;
  type: 'start' | 'travel' | 'visit' | 'meal' | 'overnight';
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  label: string;
  // visit-specific
  placeId?: string;
  placeName?: string;
  placeCategory?: string;
  placeImage?: string | null;
  placeRating?: number | null;
  placeState?: string;
  visitDurationMins?: number;
  userOverride?: boolean;
  // travel-specific
  travelTimeMins?: number;
  distanceKm?: number;
  fromName?: string;
  toName?: string;
  // meal
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  // future placeholders
  hotelId?: string;
  restaurantId?: string;
  carRentalId?: string;
}

export interface TripDay {
  dayNumber: number;
  date?: string;         // ISO date if startDate provided
  overnightAt: string;
  activities: TripActivity[];
  // Future placeholder slots
  hotel?: null;
  suggestedRestaurant?: null;
}

export interface GeneratedTrip {
  name: string;
  startingPoint: TripParams['startingPoint'];
  durationDays: number;
  travelMode: TravelMode;
  pace: Pace;
  interests: string[];
  startDate?: string;
  days: TripDay[];
  totalPlaces: number;
  totalDriveKm: number;
  totalDriveMins: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PACE_CONFIG: Record<Pace, { placesPerDay: number; startMins: number; endMins: number }> = {
  relaxed:  { placesPerDay: 2, startMins: 9 * 60,  endMins: 17 * 60 },
  moderate: { placesPerDay: 4, startMins: 8 * 60 + 30, endMins: 18 * 60 },
  explorer: { placesPerDay: 6, startMins: 7 * 60 + 30, endMins: 19 * 60 },
};

// NE India mountain roads: conservative avg 32 km/h, road-factor 1.5x
const ROAD_SPEED_BY_MODE: Record<TravelMode, number> = {
  car:    32,
  bike:   28,
  public: 22,
};
const ROAD_FACTOR = 1.5;

// Visit durations in minutes per category
export const VISIT_DURATIONS: Record<string, number> = {
  'Waterfall':              75,
  'Viewpoint / Passes':     50,
  'Wildlife & Nature':     120,
  '"Wildlife & Nature"':   120,
  'Spiritual':              60,
  'Religious & Spiritual':  60,
  'Heritage':               90,
  'History & Heritage':     90,
  'Museum':                 90,
  'Culture & Museum':       90,
  'Science Museum':         90,
  'Lake / Nature':          60,
  'Lakes & Rivers':         60,
  'Lake':                   60,
  'Caving / Adventure':    120,
  'Adventure & Sports':    150,
  'Trekking & Hiking':     180,
  'Valley & Landscape':     60,
  'Tourist Attraction':     75,
  'Attraction':             60,
  'City & Town':            45,
};

// Interest labels → category strings they match
export const INTEREST_MAP: Record<string, string[]> = {
  waterfalls:  ['Waterfall'],
  viewpoints:  ['Viewpoint / Passes', 'Valley & Landscape'],
  wildlife:    ['Wildlife & Nature', '"Wildlife & Nature"'],
  heritage:    ['Heritage', 'History & Heritage', 'Museum', 'Culture & Museum'],
  spiritual:   ['Spiritual', 'Religious & Spiritual'],
  adventure:   ['Caving / Adventure', 'Adventure & Sports', 'Trekking & Hiking'],
  culture:     ['Tourist Attraction', 'Attraction', 'City & Town', 'Lake / Nature', 'Lakes & Rivers', 'Lake'],
};

// ── Haversine ────────────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDriveTimeMins(distanceKm: number, mode: TravelMode): number {
  if (distanceKm <= 0) return 0;
  const speed = ROAD_SPEED_BY_MODE[mode];
  return Math.round((distanceKm * ROAD_FACTOR / speed) * 60);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getVisitDuration(category: string): number {
  return VISIT_DURATIONS[category] ?? 75;
}

// ── Nearest-neighbour route optimiser ────────────────────────────────────────

function nearestNeighbourRoute(
  places: PlaceData[],
  startLat: number,
  startLng: number,
): PlaceData[] {
  const remaining = [...places];
  const route: PlaceData[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(curLat, curLng, remaining[i].lat, remaining[i].lng);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    route.push(remaining[bestIdx]);
    curLat = remaining[bestIdx].lat;
    curLng = remaining[bestIdx].lng;
    remaining.splice(bestIdx, 1);
  }
  return route;
}

// ── Day timeline builder ──────────────────────────────────────────────────────

function buildDayTimeline(
  dayNum: number,
  places: PlaceData[],
  fromLat: number,
  fromLng: number,
  fromName: string,
  params: TripParams,
  date?: string,
): TripDay {
  const { startMins, endMins } = PACE_CONFIG[params.pace];
  const activities: TripActivity[] = [];
  let cursor = startMins;
  let curLat = fromLat;
  let curLng = fromLng;
  let curName = fromName;
  let lunchDone = false;
  let driveKm = 0;
  let driveMins = 0;

  for (const place of places) {
    const distKm = haversineKm(curLat, curLng, place.lat, place.lng);
    const travelMins = estimateDriveTimeMins(distKm, params.travelMode);

    // Travel segment
    if (travelMins > 0) {
      activities.push({
        id: uid(),
        type: 'travel',
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(cursor + travelMins),
        label: `Drive to ${place.name}`,
        travelTimeMins: travelMins,
        distanceKm: Math.round(distKm),
        fromName: curName,
        toName: place.name,
      });
      cursor += travelMins;
      driveKm += distKm;
      driveMins += travelMins;
    }

    // Inject lunch around 12:30 if not yet done
    if (!lunchDone && cursor >= 12 * 60 + 30 && cursor < 14 * 60) {
      const lunchMins = 60;
      activities.push({
        id: uid(),
        type: 'meal',
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(cursor + lunchMins),
        label: 'Lunch',
        mealType: 'lunch',
      });
      cursor += lunchMins;
      lunchDone = true;
    }

    const visitMins = getVisitDuration(place.category);

    // Stop if we'd run past end of day
    if (cursor + visitMins > endMins) break;

    activities.push({
      id: uid(),
      type: 'visit',
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cursor + visitMins),
      label: place.name,
      placeId: place.id,
      placeName: place.name,
      placeCategory: place.category,
      placeImage: place.image,
      placeRating: place.rating,
      placeState: place.state,
      visitDurationMins: visitMins,
    });
    cursor += visitMins;
    curLat = place.lat;
    curLng = place.lng;
    curName = place.name;
  }

  // Overnight marker
  activities.push({
    id: uid(),
    type: 'overnight',
    startTime: minutesToTime(Math.max(cursor, endMins - 60)),
    endTime: minutesToTime(Math.max(cursor, endMins)),
    label: `Overnight at ${curName}`,
    hotel: undefined,
  } as TripActivity);

  return {
    dayNumber: dayNum,
    date,
    overnightAt: curName,
    activities,
    hotel: null,
    suggestedRestaurant: null,
    _driveKm: driveKm,
    _driveMins: driveMins,
  } as TripDay & { _driveKm: number; _driveMins: number };
}

// ── Main entry point ─────────────────────────────────────────────────────────

export function buildTrip(params: TripParams, allPlaces: PlaceData[]): GeneratedTrip {
  const { startingPoint, durationDays, interests, travelMode, pace } = params;
  const paceConf = PACE_CONFIG[pace];

  // 1. Resolve which MDX categories the user's interests cover
  const wantedCategories = new Set<string>(
    interests.flatMap(i => INTEREST_MAP[i] ?? [])
  );
  // If no specific interests selected, take everything
  const useAll = wantedCategories.size === 0;

  // 2. Filter to relevant places within a loose geographic radius
  //    Radius grows with duration so longer trips can spread further out
  const maxRadiusKm = Math.min(250, 60 + durationDays * 30);

  let candidates = allPlaces.filter(p => {
    const dist = haversineKm(startingPoint.lat, startingPoint.lng, p.lat, p.lng);
    if (dist > maxRadiusKm) return false;
    if (!useAll && !wantedCategories.has(p.category)) return false;
    // Filter out hub-city entries (they're starting points, not attractions)
    if (p.category === 'City & Town') return false;
    // Filter bad city strings (Google Maps Plus codes etc.)
    if (/^[A-Z0-9]{4}\+/.test(p.city)) return false;
    return true;
  });

  // 3. Score by rating + proximity
  candidates = candidates.sort((a, b) => {
    const distA = haversineKm(startingPoint.lat, startingPoint.lng, a.lat, a.lng);
    const distB = haversineKm(startingPoint.lat, startingPoint.lng, b.lat, b.lng);
    const scoreA = (a.rating ?? 4.0) * 15 - distA * 0.1;
    const scoreB = (b.rating ?? 4.0) * 15 - distB * 0.1;
    return scoreB - scoreA;
  });

  // 4. How many places total
  const placesPerDay = paceConf.placesPerDay;
  const totalTarget = placesPerDay * durationDays;
  const selected = candidates.slice(0, Math.min(totalTarget, candidates.length));

  // 5. Global nearest-neighbour ordering
  const ordered = nearestNeighbourRoute(selected, startingPoint.lat, startingPoint.lng);

  // 6. Split into day-sized chunks
  const chunks: PlaceData[][] = [];
  for (let i = 0; i < durationDays; i++) {
    chunks.push(ordered.slice(i * placesPerDay, (i + 1) * placesPerDay));
  }

  // 7. Build per-day timelines
  let prevLat = startingPoint.lat;
  let prevLng = startingPoint.lng;
  let prevName = startingPoint.name;
  let totalDriveKm = 0;
  let totalDriveMins = 0;

  const days: TripDay[] = chunks.map((chunk, i) => {
    const dayDate = params.startDate
      ? new Date(new Date(params.startDate).getTime() + i * 86400000)
          .toISOString()
          .slice(0, 10)
      : undefined;

    const day = buildDayTimeline(i + 1, chunk, prevLat, prevLng, prevName, params, dayDate) as TripDay & { _driveKm: number; _driveMins: number };
    totalDriveKm  += day._driveKm ?? 0;
    totalDriveMins += day._driveMins ?? 0;
    if (chunk.length > 0) {
      const last = chunk[chunk.length - 1];
      prevLat = last.lat; prevLng = last.lng; prevName = last.name;
    }
    return day;
  });

  const visitPlaces = days.flatMap(d => d.activities.filter(a => a.type === 'visit'));

  return {
    name: `${startingPoint.name} · ${durationDays} Day${durationDays > 1 ? 's' : ''}`,
    startingPoint,
    durationDays,
    travelMode,
    pace,
    interests,
    startDate: params.startDate,
    days,
    totalPlaces: visitPlaces.length,
    totalDriveKm: Math.round(totalDriveKm),
    totalDriveMins,
  };
}
