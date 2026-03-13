import { useRef, useEffect, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS = {
  Waterfall: "#3b82f6",
  "Wildlife & Nature": "#16a34a",
  Spiritual: "#a855f7",
  Heritage: "#f59e0b",
  Museum: "#6366f1",
  "Art Museum": "#6366f1",
  "Science Museum": "#6366f1",
  "Lake / Nature": "#06b6d4",
  Lake: "#06b6d4",
  "Viewpoint / Passes": "#ef4444",
  "Caving / Adventure": "#f97316",
  "Tourist Attraction": "#ec4899",
  Attraction: "#ec4899",
  Bridge: "#64748b",
  "Hiking Area": "#84cc16",
  Garden: "#22c55e",
  "Picnic Ground": "#22c55e",
  "Scenic Spot": "#0ea5e9",
  "Mountain Peak": "#dc2626",
  Park: "#22c55e",
  "Golf Course": "#4ade80",
  "Home Stay": "#d946ef",
  "Eco-Stays / Accommodation": "#d946ef",
  "River Port": "#0891b2",
};

const DEFAULT_COLOR = "#6b7280";
const RADIUS_KM = 50;
const NE_CENTER = [26.2, 92.9];
const NE_ZOOM = 6;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function fmtDrive(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function googleMapsUrl(originLat, originLng, destLat, destLng) {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
}

function getColor(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function TripPlannerMap({ places, hubs }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersLayer = useRef(null);
  const radiusCircle = useRef(null);
  const hubMarker = useRef(null);

  const [selectedHub, setSelectedHub] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [placesInRadius, setPlacesInRadius] = useState(0);

  /* ---- Init map -------------------------------------------------- */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const m = L.map(mapContainer.current, {
      zoomControl: false,
    }).setView(NE_CENTER, NE_ZOOM);

    L.control.zoom({ position: "bottomright" }).addTo(m);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(m);

    markersLayer.current = L.layerGroup().addTo(m);
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  /* ---- Plot all place markers ------------------------------------ */
  useEffect(() => {
    if (!map.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();

    const originLat = selectedHub === "my-location" ? userCoords?.[0] : hubs.find((h) => h.slug === selectedHub)?.lat;
    const originLng = selectedHub === "my-location" ? userCoords?.[1] : hubs.find((h) => h.slug === selectedHub)?.lng;
    const hasOrigin = originLat != null && originLng != null;

    let insideCount = 0;

    places.forEach((p) => {
      const color = getColor(p.category);
      const dist = hasOrigin ? haversine(originLat, originLng, p.lat, p.lng) : null;
      const inside = dist != null && dist <= RADIUS_KM;
      if (inside) insideCount++;

      // Find drive time from the selected hub (if it's a known hub)
      let driveTime = null;
      if (selectedHub && selectedHub !== "my-location") {
        const hubData = hubs.find((h) => h.slug === selectedHub);
        if (hubData) {
          const match = p.logistics.find((l) => l.hub_name === hubData.fullName);
          if (match) driveTime = match.drive_time_mins;
        }
      }

      // Estimate drive time for user location (~35 km/h avg NE India roads)
      if (selectedHub === "my-location" && dist != null) {
        driveTime = Math.round((dist * 1.4) / 35 * 60);
      }

      const marker = L.circleMarker([p.lat, p.lng], {
        radius: inside ? 9 : 7,
        fillColor: color,
        color: inside ? "#fff" : color,
        weight: inside ? 2.5 : 1.5,
        fillOpacity: inside ? 0.95 : 0.6,
        opacity: inside ? 1 : 0.5,
      });

      // Popup
      const directionsLink = hasOrigin
        ? `<a href="${googleMapsUrl(originLat, originLng, p.lat, p.lng)}" target="_blank" rel="noopener" class="directions-btn">Get Directions</a>`
        : "";

      const driveHtml = driveTime != null
        ? `<div class="popup-drive">Drive Time: <strong>${fmtDrive(driveTime)}</strong></div>`
        : "";

      const distHtml = dist != null
        ? `<div class="popup-dist">${Math.round(dist)} km away</div>`
        : "";

      marker.bindPopup(
        `<div class="place-popup">
          <div class="popup-cat" style="background:${color}">${p.category}</div>
          <div class="popup-name">${p.name}</div>
          <div class="popup-state">${p.state}${p.rating ? ` · ★ ${p.rating}` : ""}</div>
          ${driveHtml}
          ${distHtml}
          ${directionsLink}
          <a href="/places/${p.id}" class="popup-detail">View Details →</a>
        </div>`,
        { maxWidth: 260, className: "custom-popup" }
      );

      markersLayer.current.addLayer(marker);
    });

    setPlacesInRadius(insideCount);
  }, [places, selectedHub, userCoords, hubs]);

  /* ---- Radius circle + hub marker -------------------------------- */
  useEffect(() => {
    if (!map.current) return;

    // Remove old
    if (radiusCircle.current) {
      map.current.removeLayer(radiusCircle.current);
      radiusCircle.current = null;
    }
    if (hubMarker.current) {
      map.current.removeLayer(hubMarker.current);
      hubMarker.current = null;
    }

    let center = null;
    let label = "";

    if (selectedHub === "my-location" && userCoords) {
      center = userCoords;
      label = "You are here";
    } else if (selectedHub) {
      const hub = hubs.find((h) => h.slug === selectedHub);
      if (hub) {
        center = [hub.lat, hub.lng];
        label = hub.name;
      }
    }

    if (center) {
      radiusCircle.current = L.circle(center, {
        radius: RADIUS_KM * 1000,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.06,
        weight: 2,
        dashArray: "8 4",
      }).addTo(map.current);

      hubMarker.current = L.marker(center, {
        icon: L.divIcon({
          className: "hub-icon",
          html: `<div class="hub-pin"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      })
        .addTo(map.current)
        .bindPopup(`<strong>${label}</strong><br>${RADIUS_KM} km radius shown`)
        .openPopup();

      map.current.flyTo(center, 9, { duration: 1.2 });
    } else {
      map.current.flyTo(NE_CENTER, NE_ZOOM, { duration: 1 });
    }
  }, [selectedHub, userCoords, hubs]);

  /* ---- Geolocation ----------------------------------------------- */
  const findNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation not supported by your browser.");
      return;
    }
    setGeoStatus("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setSelectedHub("my-location");
        setGeoStatus("");
      },
      (err) => {
        setGeoStatus(
          err.code === 1
            ? "Location permission denied."
            : "Unable to retrieve location."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ---- Unique categories for legend ------------------------------ */
  const categories = [...new Set(places.map((p) => p.category))].sort();

  /* ---- Render ---------------------------------------------------- */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 65px)",
      }}
    >
      {/* ── Controls bar ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 1000,
        }}
      >
        {/* Hub dropdown */}
        <select
          value={selectedHub}
          onChange={(e) => setSelectedHub(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            minWidth: "220px",
            background: "#fff",
          }}
        >
          <option value="">Select Starting Point</option>
          {userCoords && <option value="my-location">📍 My Location</option>}
          <optgroup label="Airports">
            {hubs
              .filter((h) => h.type === "airport")
              .map((h) => (
                <option key={h.slug} value={h.slug}>
                  ✈ {h.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="Railway Stations">
            {hubs
              .filter((h) => h.type === "train")
              .map((h) => (
                <option key={h.slug} value={h.slug}>
                  🚂 {h.name}
                </option>
              ))}
          </optgroup>
        </select>

        {/* Geolocation button */}
        <button
          onClick={findNearMe}
          style={{
            padding: "0.5rem 1rem",
            background: "#059669",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📍 Find Places Near Me
        </button>

        {geoStatus && (
          <span style={{ fontSize: "0.8rem", color: "#dc2626" }}>
            {geoStatus}
          </span>
        )}

        {selectedHub && (
          <span
            style={{
              fontSize: "0.8rem",
              color: "#6b7280",
              marginLeft: "auto",
            }}
          >
            <strong style={{ color: "#ef4444" }}>{placesInRadius}</strong> places
            within {RADIUS_KM} km radius
          </span>
        )}

        {selectedHub && (
          <button
            onClick={() => {
              setSelectedHub("");
              setUserCoords(null);
            }}
            style={{
              padding: "0.35rem 0.75rem",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Map + Legend ─────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />

        {/* Category legend */}
        <div
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "1rem",
            background: "rgba(255,255,255,0.95)",
            borderRadius: "0.5rem",
            padding: "0.75rem",
            fontSize: "0.7rem",
            maxHeight: "260px",
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: "0.25rem",
              fontSize: "0.75rem",
            }}
          >
            Categories
          </div>
          {categories.map((cat) => (
            <div
              key={cat}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: getColor(cat),
                  flexShrink: 0,
                }}
              />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inline styles for popups & hub pin ─────── */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 0.75rem;
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          min-width: 200px;
        }
        .place-popup {
          padding: 0.75rem;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .popup-cat {
          display: inline-block;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.15rem 0.5rem;
          border-radius: 1rem;
          margin-bottom: 0.35rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .popup-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
        }
        .popup-state {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.15rem;
        }
        .popup-drive {
          margin-top: 0.5rem;
          padding: 0.35rem 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          font-size: 0.8rem;
          color: #dc2626;
        }
        .popup-dist {
          font-size: 0.7rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }
        .directions-btn {
          display: block;
          margin-top: 0.5rem;
          padding: 0.4rem 0;
          text-align: center;
          background: #2563eb;
          color: #fff !important;
          border-radius: 0.375rem;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
        }
        .directions-btn:hover {
          background: #1d4ed8;
        }
        .popup-detail {
          display: block;
          margin-top: 0.35rem;
          text-align: center;
          font-size: 0.75rem;
          color: #059669 !important;
          text-decoration: none;
          font-weight: 500;
        }
        .popup-detail:hover {
          text-decoration: underline;
        }
        .hub-pin {
          width: 20px;
          height: 20px;
          background: #dc2626;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 2px #dc2626, 0 2px 8px rgba(0,0,0,0.3);
        }
        .hub-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
