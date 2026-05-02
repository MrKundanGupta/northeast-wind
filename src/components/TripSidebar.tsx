import { useState, useEffect, useRef } from 'react';
import { useStore } from "@nanostores/react";
import { $sidebarOpen, toggleSidebar } from "../stores/trip-cart";
import {
  $trips,
  $activeTrip,
  openSidebarWithTrip,
  clearActiveTrip,
  deleteTrip,
  openWizard,
  removeActivityFromTrip,
  moveActivityUp,
  moveActivityDown,
  updateActivityTime,
  addPlaceToActiveTrip,
} from "../stores/trip-planner";
import type { TripActivity } from "../lib/trip-algorithm";

/* ─── helpers ────────────────────────────────────────────────────────────── */

function fmtMins(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const PACE_LABEL: Record<string, string> = {
  relaxed: '☁️ Relaxed', moderate: '🌤️ Moderate', explorer: '⚡ Explorer',
};

/* ─── Activity row ────────────────────────────────────────────────────────── */

function ActivityRow({
  activity, tripId, dayNum, visitIdx, totalVisits,
}: {
  activity: TripActivity;
  tripId: string;
  dayNum: number;
  visitIdx: number;   // -1 if not a visit
  totalVisits: number;
}) {
  const [editing, setEditing] = useState(false);
  const [startT, setStartT] = useState(activity.startTime);
  const [endT,   setEndT]   = useState(activity.endTime);

  function saveEdit() {
    updateActivityTime(tripId, dayNum, activity.id, startT, endT);
    setEditing(false);
  }

  if (activity.type === 'travel') {
    return (
      <div className="flex items-center gap-2 py-1.5 text-xs text-gray-400">
        <span className="text-gray-300">🚗</span>
        <span>{activity.startTime} · {fmtMins(activity.travelTimeMins ?? 0)} · {activity.distanceKm} km</span>
      </div>
    );
  }

  if (activity.type === 'meal') {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-amber-800">🍽️ {activity.label}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-amber-400">{activity.startTime}</span>
            <button
              onClick={() => setEditing(e => !e)}
              className="rounded p-1 text-amber-300 hover:text-amber-600"
              aria-label="Edit meal time"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </button>
            <button
              onClick={() => removeActivityFromTrip(tripId, dayNum, activity.id)}
              className="rounded p-1 text-amber-200 hover:text-red-500"
              aria-label="Remove"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {editing && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <input type="time" value={startT} onChange={e => setStartT(e.target.value)}
              className="rounded border border-amber-200 px-1.5 py-0.5 text-xs w-[90px] focus:border-amber-400 focus:outline-none bg-white" />
            <span className="text-xs text-amber-300">→</span>
            <input type="time" value={endT} onChange={e => setEndT(e.target.value)}
              className="rounded border border-amber-200 px-1.5 py-0.5 text-xs w-[90px] focus:border-amber-400 focus:outline-none bg-white" />
            <button onClick={saveEdit} className="rounded bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">Save</button>
            <button onClick={() => setEditing(false)} className="rounded border px-2 py-0.5 text-[11px] text-gray-400">✕</button>
          </div>
        )}
        {!editing && <p className="mt-0.5 text-[11px] text-amber-300 italic">Restaurant suggestions coming soon</p>}
      </div>
    );
  }

  if (activity.type === 'overnight') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm">
        <span>🌙</span>
        <span className="font-medium text-indigo-700 truncate">{activity.label}</span>
        <span className="ml-auto text-[11px] text-indigo-300 italic whitespace-nowrap">Hotel soon</span>
      </div>
    );
  }

  if (activity.type === 'visit') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex">
          {activity.placeImage && (
            <img src={activity.placeImage} alt={activity.placeName}
              className="h-16 w-16 flex-shrink-0 object-cover" loading="lazy" />
          )}
          <div className="flex-1 min-w-0 px-3 py-2">
            <div className="flex items-start gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{activity.placeName}</p>
                <p className="text-xs text-gray-400 truncate">{activity.placeCategory} · {activity.placeState}</p>
              </div>
              <div className="flex flex-shrink-0 gap-0.5">
                <button onClick={() => moveActivityUp(tripId, dayNum, activity.id)}
                  disabled={visitIdx === 0}
                  className="rounded p-1 text-gray-300 hover:text-gray-500 disabled:opacity-25"
                  aria-label="Move up">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button onClick={() => moveActivityDown(tripId, dayNum, activity.id)}
                  disabled={visitIdx === totalVisits - 1}
                  className="rounded p-1 text-gray-300 hover:text-gray-500 disabled:opacity-25"
                  aria-label="Move down">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <button onClick={() => setEditing(e => !e)}
                  className="rounded p-1 text-gray-300 hover:text-emerald-500"
                  aria-label="Edit time">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
                <button onClick={() => removeActivityFromTrip(tripId, dayNum, activity.id)}
                  className="rounded p-1 text-gray-300 hover:text-red-500"
                  aria-label="Remove">
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
                  <a href={`/places/${activity.placeId}/`}
                    className="ml-auto text-[11px] text-emerald-600 hover:underline"
                    target="_blank" rel="noopener">
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

/* ─── Place search panel ──────────────────────────────────────────────────── */

interface PlaceResult {
  id: string; name: string; category: string; state: string;
  image: string | null; rating: number | null;
}

function PlaceSearch({ tripId, dayNum, onClose }: { tripId: string; dayNum: number; onClose: () => void }) {
  const [query, setQuery]       = useState('');
  const [all, setAll]           = useState<PlaceResult[]>([]);
  const [results, setResults]   = useState<PlaceResult[]>([]);
  const [loading, setLoading]   = useState(true);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetch('/places-data.json')
      .then(r => r.json())
      .then((data: PlaceResult[]) => {
        setAll(data.filter(p => p.name && p.state));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(
      all.filter(p => p.name.toLowerCase().includes(q) || p.state.toLowerCase().includes(q)).slice(0, 6)
    );
  }, [query, all]);

  function addPlace(p: PlaceResult) {
    addPlaceToActiveTrip({
      id: p.id, name: p.name, category: p.category,
      state: p.state, googleRating: p.rating, image: p.image ?? undefined,
    }, dayNum);
    onClose();
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-emerald-700">Add a place to Day {dayNum}</span>
        <button onClick={onClose} className="ml-auto text-emerald-400 hover:text-emerald-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={loading ? "Loading places…" : "Search by name or state…"}
        disabled={loading}
        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      />
      {results.length > 0 && (
        <div className="mt-2 space-y-1 max-h-52 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => addPlace(p)}
              className="flex w-full items-center gap-2.5 rounded-lg bg-white px-3 py-2 text-left hover:bg-emerald-100 transition"
            >
              {p.image && (
                <img src={p.image} alt={p.name} className="h-9 w-9 flex-shrink-0 rounded object-cover" loading="lazy" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500 truncate">{p.category} · {p.state}</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          ))}
        </div>
      )}
      {!loading && query.trim() && results.length === 0 && (
        <p className="mt-2 text-center text-xs text-emerald-500">No places found</p>
      )}
    </div>
  );
}

/* ─── Trip detail view ────────────────────────────────────────────────────── */

function TripDetailView() {
  const trip        = useStore($activeTrip);
  const [activeDay, setActiveDay]     = useState(1);
  const [searching, setSearching]     = useState(false);

  if (!trip) return null;

  const currentDay  = trip.days.find(d => d.dayNumber === activeDay) ?? trip.days[0];
  const visitActs   = currentDay?.activities.filter(a => a.type === 'visit') ?? [];

  function shareWA() {
    const lines = [
      `*${trip.name}*`,
      `📍 ${trip.startingPoint.name} · ${trip.durationDays} days · ${trip.totalPlaces} places`,
      '',
      ...trip.days.flatMap(day => {
        const visits = day.activities.filter(a => a.type === 'visit');
        return [
          `*Day ${day.dayNumber}* — ${day.overnightAt}`,
          ...visits.map(v => `  📍 ${v.placeName} (${v.startTime}–${v.endTime})`),
          '',
        ];
      }),
      '_Planned with Axomor · axomor.com_',
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  }

  function handleDelete() {
    if (confirm('Delete this trip?')) {
      deleteTrip(trip.id);
      clearActiveTrip();
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Trip meta */}
      <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            `📍 ${trip.startingPoint.name}`,
            `📅 ${trip.durationDays} days`,
            `🗺️ ${trip.totalPlaces} places`,
            `🚗 ~${trip.totalDriveKm} km`,
            PACE_LABEL[trip.pace],
          ].map((t, i) => (
            <span key={i} className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">{t}</span>
          ))}
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex-shrink-0 flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-gray-100 scrollbar-none">
        {trip.days.map(day => {
          const v = day.activities.filter(a => a.type === 'visit').length;
          return (
            <button key={day.dayNumber} onClick={() => { setActiveDay(day.dayNumber); setSearching(false); }}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeDay === day.dayNumber ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              Day {day.dayNumber}
              <span className={`ml-1 ${activeDay === day.dayNumber ? 'text-emerald-200' : 'text-gray-400'}`}>{v}</span>
            </button>
          );
        })}
      </div>

      {/* Activities */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {currentDay?.activities.map(act => {
          const vi = act.type === 'visit' ? visitActs.findIndex(v => v.id === act.id) : -1;
          return (
            <ActivityRow
              key={act.id}
              activity={act}
              tripId={trip.id}
              dayNum={currentDay.dayNumber}
              visitIdx={vi}
              totalVisits={visitActs.length}
            />
          );
        })}

        {/* Add place */}
        {searching ? (
          <PlaceSearch tripId={trip.id} dayNum={activeDay} onClose={() => setSearching(false)} />
        ) : (
          <button
            onClick={() => setSearching(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add a place to Day {activeDay}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 space-y-2">
        <button onClick={shareWA}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition">
            🖨️ Save PDF
          </button>
          <button onClick={handleDelete}
            className="flex-1 rounded-lg border border-red-100 py-2 text-sm font-medium text-red-400 hover:bg-red-50 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Trip list view ──────────────────────────────────────────────────────── */

function TripListView() {
  const trips = useStore($trips);

  function fmtDate(ts: number) {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <svg className="mb-4 h-14 w-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <p className="text-base font-semibold text-gray-900">No trips yet</p>
            <p className="mt-1 text-sm text-gray-400">Plan your first Northeast India adventure.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <div key={trip.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">{trip.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Saved {fmtDate(trip.createdAt)}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {trip.durationDays}d
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>📍 {trip.startingPoint.name}</span>
                    <span>🗺️ {trip.totalPlaces} places</span>
                    <span>🚗 ~{trip.totalDriveKm} km</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-2">
                  <button
                    onClick={() => openSidebarWithTrip(trip.id)}
                    className="text-xs font-medium text-emerald-600 hover:underline"
                  >
                    View itinerary →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3">
        <button
          onClick={() => { openWizard(); toggleSidebar(); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Plan New Trip
        </button>
      </div>
    </div>
  );
}

/* ─── Main sidebar ────────────────────────────────────────────────────────── */

export default function TripSidebar() {
  const open       = useStore($sidebarOpen);
  const activeTrip = useStore($activeTrip);

  const showTrip = !!activeTrip;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={toggleSidebar} />
      )}

      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center border-b border-gray-200 px-5 py-4">
          {showTrip ? (
            <button
              onClick={clearActiveTrip}
              className="mr-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              All Trips
            </button>
          ) : null}

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {showTrip ? activeTrip.name : 'My Trips'}
            </h2>
            {showTrip && (
              <p className="text-xs text-gray-400">{activeTrip.durationDays} days · {activeTrip.totalPlaces} places</p>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {showTrip ? <TripDetailView /> : <TripListView />}
        </div>
      </div>
    </>
  );
}
