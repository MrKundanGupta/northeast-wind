import { useState } from 'react';
import type { SavedTrip } from '../stores/trip-planner';
import type { TripActivity, TripDay } from '../lib/trip-algorithm';
import { updateActivityTime } from '../stores/trip-planner';

interface Props {
  trip: SavedTrip;
}

const TRAVEL_MODE_LABEL: Record<string, string> = {
  car: 'Drive', bike: 'Ride', public: 'Travel',
};

const PACE_LABEL: Record<string, string> = {
  relaxed: '☁️ Relaxed', moderate: '🌤️ Moderate', explorer: '⚡ Explorer',
};

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Activity row
───────────────────────────────────────────────────────────────────────────── */

function ActivityRow({ activity, tripId, dayNum }: { activity: TripActivity; tripId: string; dayNum: number }) {
  const [editing, setEditing] = useState(false);
  const [startT, setStartT]   = useState(activity.startTime);
  const [endT,   setEndT]     = useState(activity.endTime);

  function saveEdit() {
    updateActivityTime(tripId, dayNum, activity.id, startT, endT);
    setEditing(false);
  }

  if (activity.type === 'travel') {
    return (
      <div className="flex items-center gap-3 py-2 pl-2">
        <div className="flex flex-col items-center">
          <div className="h-2 w-2 rounded-full bg-gray-300" />
          <div className="w-0.5 flex-1 bg-gray-200 my-0.5" style={{ minHeight: 20 }} />
        </div>
        <div className="flex-1 flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <span>{activity.startTime} · {fmtMins(activity.travelTimeMins ?? 0)} drive · {activity.distanceKm} km</span>
          {activity.userOverride && <span className="text-emerald-500">✎</span>}
        </div>
      </div>
    );
  }

  if (activity.type === 'meal') {
    return (
      <div className="flex items-start gap-3 py-2 pl-2">
        <div className="flex flex-col items-center pt-1">
          <div className="h-2 w-2 rounded-full bg-amber-300" />
          <div className="w-0.5 flex-1 bg-gray-200 my-0.5" style={{ minHeight: 20 }} />
        </div>
        <div className="flex-1 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🍽️</span>
              <span className="text-sm font-medium text-amber-800">{activity.label}</span>
            </div>
            <span className="text-xs text-amber-500">{activity.startTime}</span>
          </div>
          {/* Future: restaurant placeholder */}
          <p className="mt-1 text-xs text-amber-400 italic">Restaurant recommendations coming soon</p>
        </div>
      </div>
    );
  }

  if (activity.type === 'overnight') {
    return (
      <div className="flex items-start gap-3 py-2 pl-2">
        <div className="flex flex-col items-center pt-1">
          <div className="h-2 w-2 rounded-full bg-indigo-300" />
        </div>
        <div className="flex-1 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🌙</span>
              <span className="text-sm font-medium text-indigo-700">{activity.label}</span>
            </div>
          </div>
          {/* Future: hotel placeholder */}
          <p className="mt-1 text-xs text-indigo-400 italic">Hotel booking coming soon</p>
        </div>
      </div>
    );
  }

  if (activity.type === 'visit') {
    return (
      <div className="flex items-start gap-3 py-2 pl-2">
        <div className="flex flex-col items-center pt-1">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <div className="w-0.5 flex-1 bg-gray-200 my-0.5" style={{ minHeight: 24 }} />
        </div>
        <div className="flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex">
            {activity.placeImage && (
              <img
                src={activity.placeImage}
                alt={activity.placeName}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover flex-shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 px-3 py-2.5 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{activity.placeName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.placeCategory} · {activity.placeState}</p>
                </div>
                <button
                  onClick={() => setEditing(e => !e)}
                  className="flex-shrink-0 rounded p-1 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition"
                  aria-label="Edit time"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
              </div>
              {editing ? (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <input type="time" value={startT} onChange={e => setStartT(e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs w-24 focus:border-emerald-400 focus:outline-none" />
                  <span className="text-xs text-gray-400">→</span>
                  <input type="time" value={endT} onChange={e => setEndT(e.target.value)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs w-24 focus:border-emerald-400 focus:outline-none" />
                  <button onClick={saveEdit} className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700">Save</button>
                  <button onClick={() => setEditing(false)} className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-400 hover:bg-gray-50">Cancel</button>
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    🕐 {activity.startTime} – {activity.endTime}
                    {activity.userOverride && <span className="text-emerald-500 text-[10px]">✎ edited</span>}
                  </span>
                  {activity.placeRating && (
                    <span className="text-xs text-amber-500">⭐ {activity.placeRating}</span>
                  )}
                  <a
                    href={`/places/${activity.placeId}`}
                    className="ml-auto text-[11px] font-medium text-emerald-600 hover:underline"
                    target="_blank"
                    rel="noopener"
                  >
                    Details →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Day card
───────────────────────────────────────────────────────────────────────────── */

function DayCard({ day, trip }: { day: TripDay; trip: SavedTrip }) {
  const visits = day.activities.filter(a => a.type === 'visit');
  const drives = day.activities.filter(a => a.type === 'travel');
  const totalDrive = drives.reduce((s, a) => s + (a.travelTimeMins ?? 0), 0);

  const dateStr = day.date
    ? new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Day {day.dayNumber}</span>
          {dateStr && <span className="ml-2 text-xs text-gray-400">{dateStr}</span>}
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{day.overnightAt}</p>
        </div>
        <div className="text-right text-xs text-gray-400 space-y-0.5">
          <p>{visits.length} place{visits.length !== 1 ? 's' : ''}</p>
          {totalDrive > 0 && <p>~{fmtMins(totalDrive)} driving</p>}
        </div>
      </div>

      {/* Activities */}
      <div className="px-3 py-2">
        {day.activities.map(act => (
          <ActivityRow key={act.id} activity={act} tripId={trip.id} dayNum={day.dayNumber} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main itinerary component
───────────────────────────────────────────────────────────────────────────── */

export default function TripItinerary({ trip }: Props) {
  const [activeDay, setActiveDay] = useState(1);

  const currentDay = trip.days.find(d => d.dayNumber === activeDay) ?? trip.days[0];
  if (!currentDay) return null;

  function fmtTotalDrive() {
    const h = Math.floor(trip.totalDriveMins / 60);
    const m = trip.totalDriveMins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
  }

  return (
    <div className="space-y-4">
      {/* Trip summary pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { icon: '📍', text: trip.startingPoint.name },
          { icon: '📅', text: `${trip.durationDays} days` },
          { icon: '🗺️', text: `${trip.totalPlaces} places` },
          { icon: '🚗', text: `~${trip.totalDriveKm} km` },
          { icon: '⏱️', text: fmtTotalDrive() + ' total drive' },
          { icon: '', text: PACE_LABEL[trip.pace] },
        ].map((p, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            {p.icon && <span>{p.icon}</span>}
            {p.text}
          </span>
        ))}
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {trip.days.map(day => {
          const visits = day.activities.filter(a => a.type === 'visit').length;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeDay === day.dayNumber
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Day {day.dayNumber}
              <span className={`ml-1 text-xs ${activeDay === day.dayNumber ? 'text-emerald-200' : 'text-gray-400'}`}>
                {visits}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active day card */}
      <DayCard day={currentDay} trip={trip} />
    </div>
  );
}
