import { atom, computed } from 'nanostores';
import type { GeneratedTrip, TripActivity } from '../lib/trip-algorithm';
import { VISIT_DURATIONS } from '../lib/trip-algorithm';
import { $sidebarOpen } from './trip-cart';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

export interface SavedTrip extends GeneratedTrip {
  id: string;
  createdAt: number;
  updatedAt: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Store atoms
───────────────────────────────────────────────────────────────────────────── */

export const $trips      = atom<SavedTrip[]>([]);
export const $activeTrip = atom<SavedTrip | null>(null);
export const $wizardOpen = atom<boolean>(false);
export const $wizardStep = atom<number>(0);

export const $tripCount  = computed($trips, t => t.length);

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'axomor-trips-v1';

function persist(trips: SavedTrip[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trips)); } catch { /* quota */ }
}

function patchTrip(id: string, patcher: (t: SavedTrip) => SavedTrip): SavedTrip[] {
  const trips = $trips.get();
  const updated = trips.map(t => t.id === id ? patcher(t) : t);
  $trips.set(updated);
  persist(updated);
  const active = $activeTrip.get();
  if (active?.id === id) $activeTrip.set(updated.find(t => t.id === id) ?? null);
  return updated;
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function uid(): string { return Math.random().toString(36).slice(2, 10); }

/* ─────────────────────────────────────────────────────────────────────────────
   Trip CRUD
───────────────────────────────────────────────────────────────────────────── */

export function saveTrip(trip: GeneratedTrip): SavedTrip {
  const now = Date.now();
  const saved: SavedTrip = {
    ...trip,
    id: `trip_${now}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  const next = [saved, ...$trips.get()];
  $trips.set(next);
  persist(next);
  $activeTrip.set(saved);
  return saved;
}

export function deleteTrip(id: string) {
  const next = $trips.get().filter(t => t.id !== id);
  $trips.set(next);
  persist(next);
  if ($activeTrip.get()?.id === id) $activeTrip.set(null);
}

/** Open the "My Trip" sidebar showing a specific trip's itinerary. */
export function openSidebarWithTrip(tripId: string) {
  const trip = $trips.get().find(t => t.id === tripId);
  if (!trip) return;
  $activeTrip.set(trip);
  $sidebarOpen.set(true);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Activity editing
───────────────────────────────────────────────────────────────────────────── */

export function updateActivityTime(
  tripId: string,
  dayNum: number,
  activityId: string,
  startTime: string,
  endTime: string,
) {
  patchTrip(tripId, trip => ({
    ...trip,
    updatedAt: Date.now(),
    days: trip.days.map(day => {
      if (day.dayNumber !== dayNum) return day;
      return {
        ...day,
        activities: day.activities.map(act =>
          act.id === activityId ? { ...act, startTime, endTime, userOverride: true } : act
        ),
      };
    }),
  }));
}

export function removeActivityFromTrip(tripId: string, dayNum: number, activityId: string) {
  patchTrip(tripId, trip => ({
    ...trip,
    updatedAt: Date.now(),
    totalPlaces: Math.max(0, trip.totalPlaces - 1),
    days: trip.days.map(day => {
      if (day.dayNumber !== dayNum) return day;
      return { ...day, activities: day.activities.filter(a => a.id !== activityId) };
    }),
  }));
}

export function moveActivityUp(tripId: string, dayNum: number, activityId: string) {
  patchTrip(tripId, trip => ({
    ...trip,
    updatedAt: Date.now(),
    days: trip.days.map(day => {
      if (day.dayNumber !== dayNum) return day;
      const acts = [...day.activities];
      const idx = acts.findIndex(a => a.id === activityId);
      if (idx <= 0) return day;
      [acts[idx - 1], acts[idx]] = [acts[idx], acts[idx - 1]];
      return { ...day, activities: acts };
    }),
  }));
}

export function moveActivityDown(tripId: string, dayNum: number, activityId: string) {
  patchTrip(tripId, trip => ({
    ...trip,
    updatedAt: Date.now(),
    days: trip.days.map(day => {
      if (day.dayNumber !== dayNum) return day;
      const acts = [...day.activities];
      const idx = acts.findIndex(a => a.id === activityId);
      if (idx < 0 || idx >= acts.length - 1) return day;
      [acts[idx], acts[idx + 1]] = [acts[idx + 1], acts[idx]];
      return { ...day, activities: acts };
    }),
  }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Add place from + button to active trip
───────────────────────────────────────────────────────────────────────────── */

export function addPlaceToActiveTrip(place: {
  id: string;
  name: string;
  category: string;
  state: string;
  googleRating: number | null;
  image?: string;
}): boolean {
  const active = $activeTrip.get();
  if (!active) return false;

  // Find day with fewest visit activities
  let targetDayIdx = 0;
  let minVisits = Infinity;
  active.days.forEach((day, i) => {
    const v = day.activities.filter(a => a.type === 'visit').length;
    if (v < minVisits) { minVisits = v; targetDayIdx = i; }
  });

  const day = active.days[targetDayIdx];
  const lastVisit = [...day.activities].reverse().find(a => a.type === 'visit');
  const startMins = lastVisit ? parseTime(lastVisit.endTime) + 15 : 9 * 60;
  const duration  = VISIT_DURATIONS[place.category] ?? 75;

  const newAct: TripActivity = {
    id: uid(),
    type: 'visit',
    startTime: minutesToTime(startMins),
    endTime:   minutesToTime(startMins + duration),
    label:     place.name,
    placeId:   place.id,
    placeName: place.name,
    placeCategory: place.category,
    placeImage:    place.image,
    placeRating:   place.googleRating,
    placeState:    place.state,
    visitDurationMins: duration,
  };

  patchTrip(active.id, trip => ({
    ...trip,
    updatedAt: Date.now(),
    totalPlaces: trip.totalPlaces + 1,
    days: trip.days.map((day, i) => {
      if (i !== targetDayIdx) return day;
      const acts = [...day.activities];
      const overnightIdx = acts.findIndex(a => a.type === 'overnight');
      overnightIdx >= 0 ? acts.splice(overnightIdx, 0, newAct) : acts.push(newAct);
      return { ...day, activities: acts };
    }),
  }));

  $sidebarOpen.set(true);
  return true;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Wizard
───────────────────────────────────────────────────────────────────────────── */

export function openWizard()  { $wizardOpen.set(true);  $wizardStep.set(0); }
export function closeWizard() { $wizardOpen.set(false); $wizardStep.set(0); }

/* ─────────────────────────────────────────────────────────────────────────────
   Persistence
───────────────────────────────────────────────────────────────────────────── */

export function loadTripsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedTrip[];
      $trips.set(Array.isArray(parsed) ? parsed : []);
    }
  } catch { /* corrupt */ }
}
