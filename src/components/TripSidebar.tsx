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
import { fmtDrive } from "../lib/hub-utils";
import {
  formatItineraryForWhatsApp,
  getWhatsAppShareUrl,
} from "../lib/whatsapp-formatter";

export default function TripSidebar() {
  const open = useStore($sidebarOpen);
  const items = useStore($cartItems);
  const groups = useStore($groupedByState);
  const hub = useStore($selectedHub);
  const hubs = useStore($availableHubs);
  const totalMins = useStore($totalDriveMins);
  const count = useStore($cartCount);

  function handleShare() {
    const text = formatItineraryForWhatsApp(groups, hub, totalMins);
    const url = getWhatsAppShareUrl(text);
    window.open(url, "_blank", "noopener");
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            My Trip {count > 0 && <span className="text-gray-400">({count})</span>}
          </h2>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
              <svg className="mb-4 h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <p className="text-lg font-semibold text-gray-900">No places yet</p>
              <p className="mt-2 text-sm text-gray-500">
                Tap the <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs">+</span> button on any place card to start building your trip.
              </p>
            </div>
          ) : (
            <div>
              {/* Hub selector */}
              {hubs.length > 0 && (
                <div className="border-b border-gray-100 px-5 py-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Starting Hub
                  </label>
                  <select
                    value={hub}
                    onChange={(e) => selectHub(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                  >
                    <option value="">Select a hub...</option>
                    {hubs.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Drive time banner */}
              {hub && totalMins > 0 && (
                <div className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium text-red-600">Total Drive Time (approx.)</p>
                  <p className="text-lg font-bold text-red-700">{fmtDrive(totalMins)}</p>
                </div>
              )}

              {/* Grouped places */}
              <div className="px-5 py-4">
                {Object.entries(groups).map(([state, places]) => (
                  <div key={state} className="mb-6 last:mb-0">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {state} <span className="text-gray-300">({places.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {places.map((p) => {
                        const logEntry = hub
                          ? p.logistics.find((x) => x.hub_name === hub)
                          : null;

                        return (
                          <div
                            key={p.id}
                            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                          >
                            {/* Thumbnail */}
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91" />
                                </svg>
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500">{p.category}</p>
                              <div className="mt-1 flex items-center gap-2">
                                {p.googleRating && (
                                  <span className="text-xs text-amber-500">
                                    &#9733; {p.googleRating}
                                  </span>
                                )}
                                {logEntry && (
                                  <span className="text-xs text-red-500">
                                    {fmtDrive(logEntry.drive_time_mins)} drive
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Remove button */}
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

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            {/* WhatsApp share */}
            <button
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share on WhatsApp
            </button>

            {/* Clear all */}
            <button
              onClick={clearCart}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </>
  );
}
