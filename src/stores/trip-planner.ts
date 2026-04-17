import { atom, computed } from 'nanostores';
import type { GeneratedTrip, TripDay, TripActivity } from '../lib/trip-algorithm';

/* ─────────────────────────────────────────────────────────────────────────────
   Saved Trip (what gets persisted to localStorage)
───────────────────────────────────────────────────────────────────────────── */

export interface SavedTrip extends GeneratedTrip {
  id: string;
  createdAt: number;
  updatedAt: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Store
───────────────────────────────────────────────────────────────────────────── */

export const $trips        = atom<SavedTrip[]>([]);
export const $activeTrip   = atom<SavedTrip | null>(null);
export const $wizardOpen   = atom<boolean>(false);
export const $wizardStep   = atom<number>(0);

export const $tripCount    = computed($trips, t => t.length);

/* ─────────────────────────────────────────────────────────────────────────────
   Actions
───────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'axomor-trips-v1';

export function saveTrip(trip: GeneratedTrip): SavedTrip {
  const now = Date.now();
  const saved: SavedTrip = {
    ...trip,
    id: `trip_${now}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  const current = $trips.get();
  const next = [saved, ...current];
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

export function updateActivityTime(tripId: string, dayNum: number, activityId: string, startTime: string, endTime: string) {
  const trips = $trips.get();
  const updated = trips.map(trip => {
    if (trip.id !== tripId) return trip;
    return {
      ...trip,
      updatedAt: Date.now(),
      days: trip.days.map(day => {
        if (day.dayNumber !== dayNum) return day;
        return {
          ...day,
          activities: day.activities.map(act => {
            if (act.id !== activityId) return act;
            return { ...act, startTime, endTime, userOverride: true };
          }),
        };
      }),
    };
  });
  $trips.set(updated);
  persist(updated);
  const active = $activeTrip.get();
  if (active?.id === tripId) {
    $activeTrip.set(updated.find(t => t.id === tripId) ?? null);
  }
}

export function reorderDayActivities(tripId: string, dayNum: number, activities: TripActivity[]) {
  const trips = $trips.get();
  const updated = trips.map(trip => {
    if (trip.id !== tripId) return trip;
    return {
      ...trip,
      updatedAt: Date.now(),
      days: trip.days.map(day => day.dayNumber === dayNum ? { ...day, activities } : day),
    };
  });
  $trips.set(updated);
  persist(updated);
  const active = $activeTrip.get();
  if (active?.id === tripId) $activeTrip.set(updated.find(t => t.id === tripId) ?? null);
}

export function openWizard() {
  $wizardOpen.set(true);
  $wizardStep.set(0);
}

export function closeWizard() {
  $wizardOpen.set(false);
  $wizardStep.set(0);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Persistence
───────────────────────────────────────────────────────────────────────────── */

function persist(trips: SavedTrip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch { /* quota exceeded */ }
}

export function loadTripsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedTrip[];
      $trips.set(Array.isArray(parsed) ? parsed : []);
    }
  } catch { /* corrupt data — ignore */ }
}
