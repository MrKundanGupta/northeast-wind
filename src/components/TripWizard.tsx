import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  $wizardOpen, $wizardStep,
  openWizard, closeWizard,
  saveTrip, $tripCount,
  loadTripsFromStorage,
} from '../stores/trip-planner';
import {
  buildTrip,
  type PlaceData,
  type TripParams,
  type TravelMode,
  type Pace,
  INTEREST_MAP,
} from '../lib/trip-algorithm';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

interface WizardState {
  startingPoint: { id: string; name: string; lat: number; lng: number } | null;
  durationDays: number | null;
  interests: string[];
  travelMode: TravelMode | null;
  pace: Pace | null;
  startDate: string;
  tripName: string;
}

type Step = 'start' | 'duration' | 'interests' | 'mode' | 'pace' | 'date' | 'generating' | 'done';
const STEPS: Step[] = ['start', 'duration', 'interests', 'mode', 'pace', 'date', 'generating', 'done'];

/* ─────────────────────────────────────────────────────────────────────────────
   Bot messages per step
───────────────────────────────────────────────────────────────────────────── */

const BOT_MESSAGES: Record<Step, string | ((s: WizardState) => string)> = {
  start:      "Hey! I'm Axomor's trip assistant. Let's build your perfect Northeast India itinerary. Where are you starting your adventure?",
  duration:   s => `${s.startingPoint!.name} — great choice! How many days are you planning?`,
  interests:  s => `${s.durationDays} day${s.durationDays! > 1 ? 's' : ''} sounds perfect. What kind of experiences are you looking for? (Pick as many as you like)`,
  mode:       'How are you planning to get around?',
  pace:       'And what\'s your travel pace like?',
  date:       'When are you starting? I\'ll add dates to your itinerary. (Optional)',
  generating: s => `Building your ${s.durationDays}-day itinerary from ${s.startingPoint!.name}...`,
  done:       s => `Your trip is ready! 🗺️ I've planned ${s.durationDays} days with the best places around ${s.startingPoint!.name}.`,
};

/* ─────────────────────────────────────────────────────────────────────────────
   Chip data
───────────────────────────────────────────────────────────────────────────── */

const DURATION_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 10];

const INTEREST_OPTIONS = [
  { slug: 'waterfalls', label: 'Waterfalls', icon: '💧' },
  { slug: 'viewpoints', label: 'Viewpoints', icon: '🏔️' },
  { slug: 'wildlife',   label: 'Wildlife',   icon: '🐘' },
  { slug: 'heritage',   label: 'Heritage',   icon: '🏛️' },
  { slug: 'spiritual',  label: 'Spiritual',  icon: '🙏' },
  { slug: 'adventure',  label: 'Adventure',  icon: '🥾' },
  { slug: 'culture',    label: 'Local Culture', icon: '🎭' },
];

const MODE_OPTIONS: { value: TravelMode; label: string; icon: string; note: string }[] = [
  { value: 'car',    label: 'Self-drive Car',  icon: '🚗', note: 'Fastest & most flexible' },
  { value: 'car',    label: 'Hired Car',        icon: '🚕', note: 'Convenient with driver' },
  { value: 'bike',   label: 'Bike / Scooter',  icon: '🏍️', note: 'Great for adventurers' },
  { value: 'public', label: 'Public Transport',icon: '🚌', note: 'Budget-friendly option' },
];

const PACE_OPTIONS: { value: Pace; label: string; icon: string; note: string }[] = [
  { value: 'relaxed',  label: 'Relaxed',  icon: '☁️', note: '2–3 places/day, unhurried' },
  { value: 'moderate', label: 'Moderate', icon: '🌤️', note: '3–4 places/day, balanced' },
  { value: 'explorer', label: 'Explorer', icon: '⚡', note: '5+ places/day, go-getter' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Typewriter hook
───────────────────────────────────────────────────────────────────────────── */

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return { displayed, done };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */

export default function TripWizard() {
  const open  = useStore($wizardOpen);
  const trips = useStore($tripCount);

  const [step, setStep]   = useState<Step>('start');
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [hubCities, setHubCities] = useState<{ id: string; name: string; lat: number; lng: number; state: string }[]>([]);
  const [state, setState] = useState<WizardState>({
    startingPoint: null,
    durationDays:  null,
    interests:     [],
    travelMode:    null,
    pace:          null,
    startDate:     '',
    tripName:      '',
  });
  const [generatedTripId, setGeneratedTripId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load localStorage trips once
  useEffect(() => { loadTripsFromStorage(); }, []);

  // Fetch place data once on first open
  useEffect(() => {
    if (!open || places.length > 0 || loadingPlaces) return;
    setLoadingPlaces(true);
    fetch('/places-data.json')
      .then(r => r.json())
      .then((data: PlaceData[]) => {
        setPlaces(data);
        // Extract unique hub cities (lat/lng known)
        const seen = new Set<string>();
        const hubs: typeof hubCities = [];
        for (const p of data) {
          if (p.category === 'City & Town' && p.lat && p.lng && p.city && !seen.has(p.city)) {
            seen.add(p.city);
            hubs.push({ id: p.id, name: p.city, lat: p.lat, lng: p.lng, state: p.state });
          }
        }
        // Also add destinations from pseo-config
        setHubCities(hubs);
      })
      .catch(console.error)
      .finally(() => setLoadingPlaces(false));
  }, [open]);

  // Scroll to bottom on step change
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
  }, [step]);

  const botMsg = typeof BOT_MESSAGES[step] === 'function'
    ? (BOT_MESSAGES[step] as (s: WizardState) => string)(state)
    : BOT_MESSAGES[step] as string;

  const { displayed: typedMsg, done: typeDone } = useTypewriter(open ? botMsg : '');

  // ── Step handlers ───────────────────────────────────────────────────────

  function selectStart(point: typeof state.startingPoint) {
    setState(s => ({ ...s, startingPoint: point }));
    setStep('duration');
  }

  function selectDuration(days: number) {
    setState(s => ({ ...s, durationDays: days }));
    setStep('interests');
  }

  function toggleInterest(slug: string) {
    setState(s => ({
      ...s,
      interests: s.interests.includes(slug)
        ? s.interests.filter(i => i !== slug)
        : [...s.interests, slug],
    }));
  }

  function confirmInterests() {
    setStep('mode');
  }

  function selectMode(mode: TravelMode) {
    setState(s => ({ ...s, travelMode: mode }));
    setStep('pace');
  }

  function selectPace(pace: Pace) {
    setState(s => ({ ...s, pace }));
    setStep('date');
  }

  function confirmDate(date: string) {
    setState(s => ({ ...s, startDate: date }));
    generate({ ...state, startDate: date });
  }

  function generate(finalState: WizardState) {
    if (!finalState.startingPoint || !finalState.durationDays || !finalState.travelMode || !finalState.pace) return;
    setStep('generating');

    const params: TripParams = {
      startingPoint:  finalState.startingPoint,
      durationDays:   finalState.durationDays,
      interests:      finalState.interests,
      travelMode:     finalState.travelMode,
      pace:           finalState.pace,
      startDate:      finalState.startDate || undefined,
    };

    // Small delay to let the "generating" animation show
    setTimeout(() => {
      try {
        const trip = buildTrip(params, places);
        const saved = saveTrip(trip);
        setGeneratedTripId(saved.id);
        setStep('done');
      } catch (e) {
        console.error(e);
        setStep('done');
      }
    }, 1800);
  }

  function resetWizard() {
    setStep('start');
    setState({ startingPoint: null, durationDays: null, interests: [], travelMode: null, pace: null, startDate: '', tripName: '' });
    setGeneratedTripId(null);
  }

  if (!open) {
    return (
      <button
        onClick={openWizard}
        aria-label="Plan a trip"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg transition hover:bg-emerald-700 active:scale-95 sm:h-16 sm:w-16"
      >
        {trips > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {trips > 9 ? '9+' : trips}
          </span>
        )}
        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeWizard} />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[420px] sm:rounded-2xl sm:max-h-[85dvh]">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg">🗺️</span>
            <span className="font-semibold text-gray-900">Trip Planner</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/my-trips" className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
              My Trips {trips > 0 && `(${trips})`}
            </a>
            <button onClick={closeWizard} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversation area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Bot bubble */}
          <div className="flex gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm text-white font-bold">A</div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-800 leading-relaxed">
              {typedMsg}
              {!typeDone && <span className="ml-1 inline-block animate-pulse">▋</span>}
            </div>
          </div>

          {/* Response area — only show when typewriter done */}
          {typeDone && (
            <>
              {/* ── Step: start ─────────────────────────────────── */}
              {step === 'start' && (
                <div className="pl-10">
                  {loadingPlaces ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="animate-spin">⟳</span> Loading destinations...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {hubCities.map(city => (
                        <button
                          key={city.id}
                          onClick={() => selectStart(city)}
                          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          {city.name}
                          <span className="ml-1 text-xs text-gray-400">{city.state.slice(0, 3)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step: duration ──────────────────────────────── */}
              {step === 'duration' && (
                <div className="pl-10 flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => selectDuration(d)}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {d} {d === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Step: interests ─────────────────────────────── */}
              {step === 'interests' && (
                <div className="pl-10 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(opt => {
                      const active = state.interests.includes(opt.slug);
                      return (
                        <button
                          key={opt.slug}
                          onClick={() => toggleInterest(opt.slug)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition border ${
                            active
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                          }`}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                          {active && <span className="text-emerald-500">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={confirmInterests}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {state.interests.length === 0 ? 'Show me everything →' : `Continue with ${state.interests.length} interest${state.interests.length > 1 ? 's' : ''} →`}
                  </button>
                </div>
              )}

              {/* ── Step: mode ──────────────────────────────────── */}
              {step === 'mode' && (
                <div className="pl-10 space-y-2">
                  {MODE_OPTIONS.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectMode(m.value)}
                      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                        <p className="text-xs text-gray-400">{m.note}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Step: pace ──────────────────────────────────── */}
              {step === 'pace' && (
                <div className="pl-10 space-y-2">
                  {PACE_OPTIONS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => selectPace(p.value)}
                      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                        <p className="text-xs text-gray-400">{p.note}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Step: date ──────────────────────────────────── */}
              {step === 'date' && (
                <div className="pl-10 space-y-2">
                  <input
                    type="date"
                    value={state.startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setState(s => ({ ...s, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmDate(state.startDate)}
                      disabled={!state.startDate}
                      className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                    >
                      Set date →
                    </button>
                    <button
                      onClick={() => confirmDate('')}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step: generating ────────────────────────────── */}
              {step === 'generating' && (
                <div className="pl-10 space-y-2 text-sm text-gray-500">
                  {['Finding the best places...', 'Optimising your route...', 'Building your timeline...'].map((msg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="animate-spin text-emerald-500" style={{ animationDelay: `${i * 0.3}s` }}>⟳</span>
                      {msg}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Step: done ──────────────────────────────────── */}
              {step === 'done' && (
                <div className="pl-10 space-y-2">
                  <a
                    href={generatedTripId ? `/my-trips/${generatedTripId}` : '/my-trips'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <span>View Your Itinerary</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                  <button
                    onClick={resetWizard}
                    className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
                  >
                    Plan another trip
                  </button>
                </div>
              )}
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-gray-100">
          {STEPS.filter(s => s !== 'generating' && s !== 'done').map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                STEPS.indexOf(step) > i
                  ? 'w-4 bg-emerald-500'
                  : STEPS.indexOf(step) === i
                  ? 'w-4 bg-emerald-400'
                  : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
