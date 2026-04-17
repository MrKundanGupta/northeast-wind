import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import {
  $wizardOpen,
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
} from '../lib/trip-algorithm';

/* ─────────────────────────────────────────────────────────────────────────────
   Static state data
───────────────────────────────────────────────────────────────────────────── */

const NE_STATES = [
  { name: 'Assam',             slug: 'assam',             lat: 26.2006, lng: 92.9376, icon: '🦏', note: 'Rhinos, tea & rivers' },
  { name: 'Meghalaya',         slug: 'meghalaya',         lat: 25.4670, lng: 91.3662, icon: '🌧️', note: 'Living root bridges & falls' },
  { name: 'Sikkim',            slug: 'sikkim',            lat: 27.5330, lng: 88.5122, icon: '🏔️', note: 'Himalayan peaks & lakes' },
  { name: 'Arunachal Pradesh', slug: 'arunachal-pradesh', lat: 28.2180, lng: 94.7278, icon: '🌄', note: 'Tawang, Ziro & monasteries' },
  { name: 'Nagaland',          slug: 'nagaland',          lat: 26.1584, lng: 94.5624, icon: '🎭', note: 'Tribal culture & Dzukou' },
  { name: 'Manipur',           slug: 'manipur',           lat: 24.6637, lng: 93.9063, icon: '💧', note: 'Loktak & floating islands' },
  { name: 'Mizoram',           slug: 'mizoram',           lat: 23.1645, lng: 92.9376, icon: '🌿', note: 'Hills, valleys & wildlife' },
  { name: 'Tripura',           slug: 'tripura',           lat: 23.9408, lng: 91.9882, icon: '🏛️', note: 'Palaces & Unakoti' },
];

const DURATION_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 10, 14];

const INTEREST_OPTIONS = [
  { slug: 'waterfalls', label: 'Waterfalls',     icon: '💧' },
  { slug: 'viewpoints', label: 'Viewpoints',     icon: '🏔️' },
  { slug: 'wildlife',   label: 'Wildlife',       icon: '🐘' },
  { slug: 'heritage',   label: 'Heritage',       icon: '🏛️' },
  { slug: 'spiritual',  label: 'Spiritual',      icon: '🙏' },
  { slug: 'adventure',  label: 'Adventure',      icon: '🥾' },
  { slug: 'culture',    label: 'Local Culture',  icon: '🎭' },
];

const MODE_OPTIONS: { value: TravelMode; label: string; icon: string; note: string }[] = [
  { value: 'car',    label: 'Self-drive Car',   icon: '🚗', note: 'Fastest & most flexible' },
  { value: 'car',    label: 'Hired Car',         icon: '🚕', note: 'Convenient with driver' },
  { value: 'bike',   label: 'Bike / Scooter',   icon: '🏍️', note: 'Great for adventurers' },
  { value: 'public', label: 'Public Transport', icon: '🚌', note: 'Budget-friendly option' },
];

const PACE_OPTIONS: { value: Pace; label: string; icon: string; note: string }[] = [
  { value: 'relaxed',  label: 'Relaxed',  icon: '☁️', note: '2–3 places/day, unhurried' },
  { value: 'moderate', label: 'Moderate', icon: '🌤️', note: '3–4 places/day, balanced' },
  { value: 'explorer', label: 'Explorer', icon: '⚡', note: '5+ places/day, go-getter' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Types & steps
───────────────────────────────────────────────────────────────────────────── */

type Step = 'state' | 'destination' | 'duration' | 'interests' | 'mode' | 'pace' | 'date' | 'generating' | 'done';
const PROGRESS_STEPS: Step[] = ['state', 'destination', 'duration', 'interests', 'mode', 'pace', 'date'];

interface WizardState {
  selectedState: typeof NE_STATES[0] | null;
  startingPoint: { id: string; name: string; lat: number; lng: number } | null;
  durationDays: number | null;
  interests: string[];
  travelMode: TravelMode | null;
  pace: Pace | null;
  startDate: string;
}

const BOT_MESSAGES: Record<Step, string | ((s: WizardState) => string)> = {
  state:       "Hey! Let's build your perfect Northeast India itinerary. Which state are you visiting?",
  destination: s => `${s.selectedState!.icon} ${s.selectedState!.name} — great choice! Want to start from a specific destination, or explore the whole state?`,
  duration:    s => `${s.startingPoint!.name} it is! How many days are you planning?`,
  interests:   s => `${s.durationDays} day${s.durationDays! > 1 ? 's' : ''} — perfect. What kind of experiences are you looking for?`,
  mode:        'How are you planning to get around?',
  pace:        "And what's your travel pace like?",
  date:        "When are you starting? I'll add dates to your itinerary. (Optional)",
  generating:  s => `Building your ${s.durationDays}-day itinerary from ${s.startingPoint!.name}...`,
  done:        s => `Your trip is ready! 🗺️ I've planned ${s.durationDays} days with the best places in ${s.selectedState!.name}.`,
};

/* ─────────────────────────────────────────────────────────────────────────────
   Typewriter hook
───────────────────────────────────────────────────────────────────────────── */

function useTypewriter(text: string, speed = 16) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false);
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
  const open   = useStore($wizardOpen);
  const trips  = useStore($tripCount);

  const [step, setStep]     = useState<Step>('state');
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [state, setState]   = useState<WizardState>({
    selectedState: null,
    startingPoint: null,
    durationDays: null,
    interests: [],
    travelMode: null,
    pace: null,
    startDate: '',
  });
  const [generatedTripId, setGeneratedTripId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadTripsFromStorage(); }, []);

  // Fetch place data once on first open
  useEffect(() => {
    if (!open || places.length > 0 || loading) return;
    setLoading(true);
    fetch('/places-data.json')
      .then(r => r.json())
      .then((data: PlaceData[]) => setPlaces(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
  }, [step]);

  const botMsg = typeof BOT_MESSAGES[step] === 'function'
    ? (BOT_MESSAGES[step] as (s: WizardState) => string)(state)
    : (BOT_MESSAGES[step] as string);

  const { displayed: typedMsg, done: typeDone } = useTypewriter(open ? botMsg : '');

  // Hub cities for the selected state, sorted by ourRating desc
  const stateCities = state.selectedState
    ? places
        .filter(p =>
          p.category === 'City & Town' &&
          p.state === state.selectedState!.name &&
          p.lat && p.lng &&
          !/^[A-Z0-9]{4}\+/.test(p.city)
        )
        .sort((a, b) => ((b as any).ourRating ?? b.rating ?? 3.5) - ((a as any).ourRating ?? a.rating ?? 3.5))
        .slice(0, 12)
    : [];

  // ── Handlers ───────────────────────────────────────────────────────────

  function pickState(s: typeof NE_STATES[0]) {
    setState(prev => ({ ...prev, selectedState: s, startingPoint: null }));
    setStep('destination');
  }

  function pickDestination(point: WizardState['startingPoint']) {
    setState(prev => ({ ...prev, startingPoint: point }));
    setStep('duration');
  }

  function exploreWholeState() {
    const s = state.selectedState!;
    pickDestination({ id: `state-${s.slug}`, name: s.name, lat: s.lat, lng: s.lng });
  }

  function pickDuration(days: number) {
    setState(prev => ({ ...prev, durationDays: days }));
    setStep('interests');
  }

  function toggleInterest(slug: string) {
    setState(prev => ({
      ...prev,
      interests: prev.interests.includes(slug)
        ? prev.interests.filter(i => i !== slug)
        : [...prev.interests, slug],
    }));
  }

  function pickMode(mode: TravelMode) {
    setState(prev => ({ ...prev, travelMode: mode }));
    setStep('pace');
  }

  function pickPace(pace: Pace) {
    setState(prev => ({ ...prev, pace }));
    setStep('date');
  }

  function confirmDate(date: string) {
    setState(prev => ({ ...prev, startDate: date }));
    generate({ ...state, startDate: date });
  }

  function generate(finalState: WizardState) {
    if (!finalState.startingPoint || !finalState.durationDays || !finalState.travelMode || !finalState.pace) return;
    setStep('generating');

    const params: TripParams = {
      startingPoint: finalState.startingPoint,
      durationDays:  finalState.durationDays,
      interests:     finalState.interests,
      travelMode:    finalState.travelMode,
      pace:          finalState.pace,
      startDate:     finalState.startDate || undefined,
    };

    setTimeout(() => {
      try {
        const trip  = buildTrip(params, places);
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
    setStep('state');
    setState({ selectedState: null, startingPoint: null, durationDays: null, interests: [], travelMode: null, pace: null, startDate: '' });
    setGeneratedTripId(null);
  }

  /* ── Closed state: floating FAB ──────────────────────────────────────── */
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

  /* ── Open state: bottom sheet / modal ────────────────────────────────── */
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeWizard} />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[420px] sm:rounded-2xl sm:max-h-[88dvh]">

        {/* Drag handle (mobile) */}
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
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-800 leading-relaxed">
              {typedMsg}
              {!typeDone && <span className="ml-1 inline-block animate-pulse">▋</span>}
            </div>
          </div>

          {typeDone && (
            <>
              {/* ── State selection ─────────────────────────────── */}
              {step === 'state' && (
                <div className="pl-10 grid grid-cols-2 gap-2">
                  {NE_STATES.map(s => (
                    <button
                      key={s.slug}
                      onClick={() => pickState(s)}
                      className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.98]"
                    >
                      <span className="text-xl leading-none mt-0.5">{s.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{s.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{s.note}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Destination selection (optional) ────────────── */}
              {step === 'destination' && (
                <div className="pl-10 space-y-2">
                  {/* Explore whole state button — primary */}
                  <button
                    onClick={exploreWholeState}
                    className="flex w-full items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-left transition hover:bg-emerald-700"
                  >
                    <span className="text-2xl">{state.selectedState?.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">Explore all of {state.selectedState?.name}</p>
                      <p className="text-xs text-emerald-200">Best places across the whole state</p>
                    </div>
                  </button>

                  {/* Or pick specific destination */}
                  {stateCities.length > 0 && (
                    <>
                      <p className="text-xs text-gray-400 pt-1 pb-0.5 text-center">— or start from a specific destination —</p>
                      <div className="flex flex-wrap gap-2">
                        {loading ? (
                          <span className="text-xs text-gray-400 animate-pulse">Loading destinations...</span>
                        ) : stateCities.map(city => (
                          <button
                            key={city.id}
                            onClick={() => pickDestination({ id: city.id, name: city.city || city.name, lat: city.lat, lng: city.lng })}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            {city.city || city.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Duration ────────────────────────────────────── */}
              {step === 'duration' && (
                <div className="pl-10 flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => pickDuration(d)}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {d} {d === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Interests ───────────────────────────────────── */}
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
                    onClick={() => setStep('mode')}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {state.interests.length === 0 ? 'Show me everything →' : `Continue with ${state.interests.length} interest${state.interests.length > 1 ? 's' : ''} →`}
                  </button>
                </div>
              )}

              {/* ── Travel mode ─────────────────────────────────── */}
              {step === 'mode' && (
                <div className="pl-10 space-y-2">
                  {MODE_OPTIONS.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => pickMode(m.value)}
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

              {/* ── Pace ────────────────────────────────────────── */}
              {step === 'pace' && (
                <div className="pl-10 space-y-2">
                  {PACE_OPTIONS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => pickPace(p.value)}
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

              {/* ── Start date ──────────────────────────────────── */}
              {step === 'date' && (
                <div className="pl-10 space-y-2">
                  <input
                    type="date"
                    value={state.startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setState(prev => ({ ...prev, startDate: e.target.value }))}
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

              {/* ── Generating ──────────────────────────────────── */}
              {step === 'generating' && (
                <div className="pl-10 space-y-2 text-sm text-gray-500">
                  {[
                    'Finding top-rated places...',
                    'Optimising your route...',
                    'Building your day-by-day plan...',
                  ].map((msg, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ animationDelay: `${i * 0.3}s` }}>
                      <span className="animate-spin text-emerald-500">⟳</span>
                      {msg}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Done ────────────────────────────────────────── */}
              {step === 'done' && (
                <div className="pl-10 space-y-2">
                  <a
                    href={generatedTripId ? `/my-trips/${generatedTripId}` : '/my-trips'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    View Your Itinerary
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
          {PROGRESS_STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                PROGRESS_STEPS.indexOf(step) > i
                  ? 'w-4 bg-emerald-500'
                  : PROGRESS_STEPS.indexOf(step) === i
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
