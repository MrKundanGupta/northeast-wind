import { useState } from 'react';
import { useStore } from "@nanostores/react";
import {
  $cartItems,
  $sidebarOpen,
  $groupedByState,
  $selectedHub,
  $availableHubs,
  $totalDriveMins,
  $cartCount,
  removeFromCart,
  clearCart,
  toggleSidebar,
  selectHub,
} from "../stores/trip-cart";
import {
  $activeTrip,
  removeActivityFromTrip,
  moveActivityUp,
  moveActivityDown,
  updateActivityTime,
} from "../stores/trip-planner";
import { fmtDrive } from "../lib/hub-utils";
import {
  formatItineraryForWhatsApp,
  getWhatsAppShareUrl,
} from "../lib/whatsapp-formatter";
import type { TripActivity } from "../lib/trip-algorithm";

/* ─── Activity row (sidebar edition) ─────────────────────────────────────── */

function SidebarActivityRow({
  activity,
  tripId,
  dayNum,
  isFirst,
  isLast,
}: {
  activity: TripActivity;
  tripId: string;
  dayNum: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [startT, setStartT] = useState(activity.startTime);
  const [endT, setEndT] = useState(activity.endTime);

  function saveEdit() {
    updateActivityTime(tripId, dayNum, activity.id, startT, endT);
    setEditing(false);
  }

  if (activity.type === 'travel') {
    return (
      <div className="flex items-center gap-2 py-1.5 text-xs text-gray-400">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <span>{activity.startTime} · {activity.travelTimeMins ?? 0} min · {activity.distanceKm} km</span>
      </div>
    );
  }

  if (activity.type === 'meal') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <span>🍽️</span>
        <span className="font-medium">{activity.label}</span>
        <span className="ml-auto text-amber-400">{activity.startTime}</span>
      </div>
    );
  }

  if (activity.type === 'overnight') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-600">
        <span>🌙</span>
        <span className="font-medium">{activity.label}</span>
      </div>
    );
  }

  if (activity.type === 'visit') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex">
          {activity.placeImage && (
            <img
              src={activity.placeImage}
              alt={activity.placeName}
              className="h-16 w-16 flex-shrink-0 object-cover"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0 px-3 py-2">
            <div className="flex items-start gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{activity.placeName}</p>
                <p className="text-xs text-gray-400 truncate">{activity.placeCategory}</p>
              </div>
              {/* Action buttons */}
              <div className="flex flex-shrink-0 gap-0.5">
                <button
                  onClick={() => moveActivityUp(tripId, dayNum, activity.id)}
                  disabled={isFirst}
                  className="rounded p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30 disabled:cursor-default"
                  aria-label="Move up"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => moveActivityDown(tripId, dayNum, activity.id)}
                  disabled={isLast}
                  className="rounded p-1 text-gray-300 hover:text-gray-500 disabled:opacity-30 disabled:cursor-default"
                  aria-label="Move down"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditing(e => !e)}
                  className="rounded p-1 text-gray-300 hover:text-emerald-500"
                  aria-label="Edit time"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
                <button
                  onClick={() => removeActivityFromTrip(tripId, dayNum, activity.id)}
                  className="rounded p-1 text-gray-300 hover:text-red-500"
                  aria-label="Remove"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {editing ? (
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <input type="time" value={startT} onChange={e => setStartT(e.target.value)}
                  className="rounded border border-gray-200 px-1.5 py-0.5 text-xs w-[90px] focus:border-emerald-400 focus:outline-none" />
                <span className="text-xs text-gray-300">→</span>
                <input type="time" value={endT} onChange={e => setEndT(e.target.value)}
                  className="rounded border border-gray-200 px-1.5 py-0.5 text-xs w-[90px] focus:border-emerald-400 focus:outline-none" />
                <button onClick={saveEdit} className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">Save</button>
                <button onClick={() => setEditing(false)} className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-400">✕</button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span>🕐 {activity.startTime}–{activity.endTime}</span>
                {activity.userOverride && <span className="text-emerald-400 text-[10px]">✎</span>}
                {activity.placeId && (
                  <a href={`/places/${activity.placeId}`} className="ml-auto text-[11px] text-emerald-600 hover:underline" target="_blank" rel="noopener">
                    Details →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Itinerary tab ───────────────────────────────────────────────────────── */

function ItineraryTab({ tripId }: { tripId: string }) {
  const trip = useStore($activeTrip);
  const [activeDay, setActiveDay] = useState(1);

  if (!trip) return null;

  const currentDay = trip.days.find(d => d.dayNumber === activeDay) ?? trip.days[0];
  const visitActivities = currentDay?.activities.filter(a => a.type === 'visit') ?? [];

  function shareOnWhatsApp() {
    const lines: string[] = [`*${trip.name}*\n`];
    trip.days.forEach(day => {
      lines.push(`*Day ${day.dayNumber}* — ${day.overnightAt}`);
      day.activities
        .filter(a => a.type === 'visit')
        .forEach(a => lines.push(`  📍 ${a.placeName} (${a.startTime}–${a.endTime})`));
    });
    lines.push(`\n_Generated by Axomor.com_`);
    const url = `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Trip meta pills */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-gray-100 text-xs">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">📍 {trip.startingPoint.name}</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">📅 {trip.durationDays}d</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">🗺️ {trip.totalPlaces} places</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">🚗 ~{trip.totalDriveKm} km</span>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-gray-100 scrollbar-none">
        {trip.days.map(day => {
          const visits = day.activities.filter(a => a.type === 'visit').length;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeDay === day.dayNumber
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Day {day.dayNumber}
              <span className={`ml-1 ${activeDay === day.dayNumber ? 'text-emerald-200' : 'text-gray-400'}`}>
                {visits}
              </span>
            </button>
          );
        })}
      </div>

      {/* Activities */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {currentDay?.activities.map((act, idx) => {
          const visitIdx = visitActivities.findIndex(v => v.id === act.id);
          const isFirstVisit = act.type === 'visit' && visitIdx === 0;
          const isLastVisit = act.type === 'visit' && visitIdx === visitActivities.length - 1;
          return (
            <SidebarActivityRow
              key={act.id}
              activity={act}
              tripId={trip.id}
              dayNum={currentDay.dayNumber}
              isFirst={isFirstVisit}
              isLast={isLastVisit}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3 space-y-2">
        <button
          onClick={shareOnWhatsApp}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </button>
        <a
          href={`/my-trips/${trip.id}`}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Full view & print
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ─── Cart / Saved Places tab ─────────────────────────────────────────────── */

function SavedPlacesTab() {
  const items = useStore($cartItems);
  const groups = useStore($groupedByState);
  const hub = useStore($selectedHub);
  const hubs = useStore($availableHubs);
  const totalMins = useStore($totalDriveMins);

  function handleShare() {
    const text = formatItineraryForWhatsApp(groups, hub, totalMins);
    const url = getWhatsAppShareUrl(text);
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
            <svg className="mb-4 h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <p className="text-lg font-semibold text-gray-900">No places saved</p>
            <p className="mt-2 text-sm text-gray-500">
              Tap the <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs">+</span> button on any place card.
            </p>
          </div>
        ) : (
          <div>
            {hubs.length > 0 && (
              <div className="border-b border-gray-100 px-5 py-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Starting Hub</label>
                <select
                  value={hub}
                  onChange={(e) => selectHub(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-emerald-300 focus:outline-none"
                >
                  <option value="">Select a hub...</option>
                  {hubs.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}

            {hub && totalMins > 0 && (
              <div className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-center">
                <p className="text-xs font-medium text-red-600">Total Drive Time (approx.)</p>
                <p className="text-lg font-bold text-red-700">{fmtDrive(totalMins)}</p>
              </div>
            )}

            <div className="px-5 py-4">
              {Object.entries(groups).map(([state, places]) => (
                <div key={state} className="mb-6 last:mb-0">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {state} <span className="text-gray-300">({places.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {places.map((p) => {
                      const logEntry = hub ? p.logistics.find((x) => x.hub_name === hub) : null;
                      return (
                        <div key={p.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.category}</p>
                            <div className="mt-1 flex items-center gap-2">
                              {p.googleRating && <span className="text-xs text-amber-500">&#9733; {p.googleRating}</span>}
                              {logEntry && <span className="text-xs text-red-500">{fmtDrive(logEntry.drive_time_mins)} drive</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(p.id)}
                            className="flex-shrink-0 rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                            aria-label={`Remove ${p.name}`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-gray-200 px-5 py-4 space-y-3">
          <button
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share on WhatsApp
          </button>
          <button
            onClick={clearCart}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main sidebar ────────────────────────────────────────────────────────── */

export default function TripSidebar() {
  const open = useStore($sidebarOpen);
  const activeTrip = useStore($activeTrip);
  const cartCount = useStore($cartCount);
  const [tab, setTab] = useState<'itinerary' | 'saved'>('itinerary');

  // When activeTrip changes, default to itinerary tab
  const hasTrip = !!activeTrip;
  const activeTab = hasTrip ? tab : 'saved';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {hasTrip ? activeTrip.name : 'My Trip'}
            </h2>
            {hasTrip && (
              <p className="text-xs text-gray-400">{activeTrip.durationDays} days · {activeTrip.totalPlaces} places</p>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 ml-3"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar (only when active trip exists) */}
        {hasTrip && (
          <div className="flex border-b border-gray-200 flex-shrink-0">
            <button
              onClick={() => setTab('itinerary')}
              className={`flex-1 py-2.5 text-sm font-medium transition border-b-2 ${
                activeTab === 'itinerary'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Itinerary
            </button>
            <button
              onClick={() => setTab('saved')}
              className={`flex-1 py-2.5 text-sm font-medium transition border-b-2 ${
                activeTab === 'saved'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved Places
              {cartCount > 0 && (
                <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{cartCount}</span>
              )}
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'itinerary' && hasTrip ? (
            <ItineraryTab tripId={activeTrip.id} />
          ) : (
            <SavedPlacesTab />
          )}
        </div>
      </div>
    </>
  );
}
