import { atom, computed } from "nanostores";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LogisticsEntry {
  hub_name: string;
  hub_type: string;
  distance_km: number;
  drive_time_mins: number;
}

export interface CartPlace {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  state: string;
  googleRating: number | null;
  image?: string;
  logistics: LogisticsEntry[];
}

/* ------------------------------------------------------------------ */
/*  Atoms                                                              */
/* ------------------------------------------------------------------ */

export const $cartItems = atom<CartPlace[]>([]);
export const $selectedHub = atom<string>("");
export const $sidebarOpen = atom(false);

/* ------------------------------------------------------------------ */
/*  Computed                                                           */
/* ------------------------------------------------------------------ */

export const $cartCount = computed($cartItems, (items) => items.length);

export const $groupedByState = computed($cartItems, (items) => {
  const groups: Record<string, CartPlace[]> = {};
  for (const item of items) {
    (groups[item.state] ??= []).push(item);
  }
  return groups;
});

/** All hubs that appear in any cart item's logistics, sorted by coverage count descending. */
export const $availableHubs = computed($cartItems, (items) => {
  const hubCount = new Map<string, number>();
  for (const item of items) {
    for (const l of item.logistics) {
      hubCount.set(l.hub_name, (hubCount.get(l.hub_name) ?? 0) + 1);
    }
  }
  return [...hubCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
});

/** Total drive time (in minutes) from the selected hub for all cart items that have that hub. */
export const $totalDriveMins = computed(
  [$cartItems, $selectedHub],
  (items, hub) => {
    if (!hub) return 0;
    let total = 0;
    for (const item of items) {
      const l = item.logistics.find((x) => x.hub_name === hub);
      if (l) total += l.drive_time_mins;
    }
    return total;
  },
);

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "ne-trip-cart";
const HUB_KEY = "ne-trip-hub";

export function addToCart(place: CartPlace) {
  const current = $cartItems.get();
  if (current.some((p) => p.id === place.id)) return;
  const next = [...current, place];
  $cartItems.set(next);
  saveToStorage(next);
  // Auto-select hub if none selected
  if (!$selectedHub.get()) {
    const hubs = $availableHubs.get();
    if (hubs.length > 0) {
      $selectedHub.set(hubs[0]);
      saveHubToStorage(hubs[0]);
    }
  }
  $sidebarOpen.set(true);
}

export function removeFromCart(id: string) {
  const next = $cartItems.get().filter((p) => p.id !== id);
  $cartItems.set(next);
  saveToStorage(next);
}

export function clearCart() {
  $cartItems.set([]);
  $selectedHub.set("");
  saveToStorage([]);
  saveHubToStorage("");
}

export function toggleSidebar() {
  $sidebarOpen.set(!$sidebarOpen.get());
}

export function selectHub(hub: string) {
  $selectedHub.set(hub);
  saveHubToStorage(hub);
}

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

function saveToStorage(items: CartPlace[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* quota exceeded — silently ignore */ }
}

function saveHubToStorage(hub: string) {
  try {
    localStorage.setItem(HUB_KEY, hub);
  } catch {}
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) $cartItems.set(JSON.parse(raw));
    const hub = localStorage.getItem(HUB_KEY);
    if (hub) $selectedHub.set(hub);
  } catch {}
}
