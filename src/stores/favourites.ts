import { atom, computed } from 'nanostores';

export interface FavouritePlace {
  id: string;
  name: string;
  category: string;
  state: string;
  image?: string | null;
  googleRating?: number | null;
}

export const $favourites     = atom<FavouritePlace[]>([]);
export const $favouriteCount = computed($favourites, f => f.length);
export const $favouriteIds   = computed($favourites, f => new Set(f.map(p => p.id)));

const STORAGE_KEY = 'axomor-favourites-v1';

function persist(items: FavouritePlace[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota */ }
}

export function toggleFavourite(place: FavouritePlace) {
  const current = $favourites.get();
  const exists  = current.some(p => p.id === place.id);
  const next    = exists ? current.filter(p => p.id !== place.id) : [place, ...current];
  $favourites.set(next);
  persist(next);
}

export function removeFavourite(id: string) {
  const next = $favourites.get().filter(p => p.id !== id);
  $favourites.set(next);
  persist(next);
}

export function loadFavouritesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      $favourites.set(Array.isArray(parsed) ? parsed : []);
    }
  } catch { /* corrupt */ }
}
