#!/usr/bin/env python3
"""
Set our_rating in all place and hub-city MDX files.
Ratings are on a 1.0–5.0 scale (0.1 precision).
Logic:
  1. Explicit overrides for iconic / well-known places
  2. Use google_rating as proxy (capped at 4.7 for non-iconic)
  3. Category default when no google_rating present
"""
import os, re, sys

PLACES_DIR   = "src/content/places"
HUB_DIR      = "src/content/hub-cities"

# ── Category defaults (used when no google_rating) ──────────────────────────
CATEGORY_DEFAULTS = {
    "Waterfall":              4.0,
    "Viewpoint / Passes":     3.8,
    '"Wildlife & Nature"':    4.0,
    "Wildlife & Nature":      4.0,
    "Spiritual":              3.9,
    "Religious & Spiritual":  3.9,
    "Heritage":               3.8,
    "History & Heritage":     3.8,
    "Museum":                 3.7,
    "Culture & Museum":       3.7,
    "Science Museum":         3.6,
    "Lake / Nature":          3.9,
    "Lakes & Rivers":         3.9,
    "Lake":                   3.9,
    "Caving / Adventure":     4.0,
    "Adventure & Sports":     4.0,
    "Trekking & Hiking":      4.2,
    "Valley & Landscape":     4.1,
    "Tourist Attraction":     3.7,
    "Attraction":             3.6,
    "City & Town":            3.5,
}

# ── Explicit overrides (place_id → our_rating) ───────────────────────────────
OVERRIDES = {
    # ── World-class (5.0) ──────────────────────────────────────────────────
    "dzukou-valley":                                     5.0,
    "kaziranga-national-park":                           5.0,
    "double-decker-living-root-bridge":                  5.0,
    "tawang-monastery":                                  5.0,
    "keibul-lamjao-national-park":                       4.9,

    # ── Exceptional places (4.7–4.9) ──────────────────────────────────────
    "nohkalikai-falls":                                  4.9,
    "loktak-lake":                                       4.8,
    "riwai-living-root-bridge":                          4.7,
    "rainbow-falls":                                     4.6,
    "seeh-lake-biirii-ziro":                             4.6,
    "tsomgo-lake":                                       4.7,
    "kamakhya-temple":                                   4.5,
    "tawang-war-memorial":                               4.4,
    "dibru-saikhowa-national-park":                      4.5,
    "pobitora-wildlife-sanctuary":                       4.4,
    "nameri-national-park-and-forest-reserve":           4.3,
    "shillong-peak":                                     4.3,
    "elephant-falls-shillong":                           4.3,
    "ward-s-lake":                                       4.0,
    "kaziranga-national-orchid-and-biodiversity-park":   4.2,

    # ── Hub-city overrides ─────────────────────────────────────────────────
    "shillong-hub-city-meghalaya":          4.7,
    "gangtok-hub-city-sikkim":              4.6,
    "tawang-hub-city-arunachal-pradesh":    4.9,
    "cherrapunji-hub-city-meghalaya":       4.8,
    "majuli-hub-city-assam":                4.7,
    "ziro-hub-city-arunachal-pradesh":      4.8,
    "dawki-hub-city-meghalaya":             4.8,
    "mawlynnong-hub-city-meghalaya":        4.7,
    "nongriat-hub-city-meghalaya":          4.7,
    "lachen-hub-city-sikkim":               4.6,
    "lachung-hub-city-sikkim":              4.5,
    "loktak-lake-hub-city-manipur":         4.7,
    "mechuka-hub-city-arunachal-pradesh":   4.7,
    "ukhrul-hub-city-manipur":              4.4,
    "mon-hub-city-nagaland":                4.4,
    "unakoti-hub-city-tripura":             4.4,
    "pelling-hub-city-sikkim":              4.5,
    "dirang-hub-city-arunachal-pradesh":    4.3,
    "guwahati-hub-city-assam":              4.2,
    "bomdila-hub-city-arunachal-pradesh":   4.2,
    "neermahal-hub-city-tripura":           4.2,
    "ravangla-hub-city-sikkim":             4.2,
    "kohima-hub-city-nagaland":             4.1,
    "mokokchung-hub-city-nagaland":         4.0,
    "sivasagar-hub-city-assam":             4.1,
    "jowai-hub-city-meghalaya":             4.0,
    "haflong-hub-city-assam":               4.0,
    "champhai-hub-city-mizoram":            4.1,
    "roing-hub-city-arunachal-pradesh":     4.1,
    "kaziranga-hub-city-assam":             4.6,
    "imphal-hub-city-manipur":              3.8,
    "aizawl-hub-city-mizoram":              3.7,
    "tezpur-hub-city-assam":                3.9,
    "jorhat-hub-city-assam":                3.7,
    "itanagar-hub-city-arunachal-pradesh":  3.5,
    "agartala-hub-city-tripura":            3.6,
    "dibrugarh-hub-city-assam":             3.8,
    "dimapur-hub-city-nagaland":            3.4,
    "silchar-hub-city-assam":               3.3,
    "lunglei-hub-city-mizoram":             3.8,
    "serchhip-hub-city-mizoram":            3.7,
    "wokha-hub-city-nagaland":              3.9,
    "tura-hub-city-meghalaya":              3.7,
    "udaipur-hub-city-tripura":             3.8,
    "tinsukia-hub-city-assam":              3.5,
    "pasighat-hub-city-arunachal-pradesh":  3.9,
}

def google_to_our(g_rating: float) -> float:
    """Convert a Google rating (usually 3.0–5.0) to our rating scale."""
    if g_rating >= 4.7:  return 4.6
    if g_rating >= 4.5:  return 4.4
    if g_rating >= 4.3:  return 4.2
    if g_rating >= 4.0:  return 4.0
    if g_rating >= 3.8:  return 3.8
    if g_rating >= 3.5:  return 3.6
    return 3.4

def process_dir(directory: str):
    updated = 0
    skipped = 0
    for fname in sorted(os.listdir(directory)):
        if not fname.endswith(".mdx"):
            continue
        fpath = os.path.join(directory, fname)
        content = open(fpath, encoding="utf-8").read()

        # Extract id from frontmatter
        id_match = re.search(r'^id:\s*([^\n]+)', content, re.MULTILINE)
        if not id_match:
            skipped += 1
            continue
        place_id = id_match.group(1).strip().strip('"\'')

        # Determine our_rating
        if place_id in OVERRIDES:
            rating = OVERRIDES[place_id]
        else:
            # Try to extract google_rating
            gr_match = re.search(r'google_rating:\s*([\d.]+)', content)
            if gr_match:
                rating = google_to_our(float(gr_match.group(1)))
            else:
                # Category default
                cat_match = re.search(r'^category:\s*([^\n]+)', content, re.MULTILINE)
                category = cat_match.group(1).strip().strip('"\'') if cat_match else ""
                rating = CATEGORY_DEFAULTS.get(category, 3.5)

        rating_str = f"{rating:.1f}"

        # Replace our_rating: null  OR  our_rating: <old_value>
        new_content = re.sub(
            r'(our_rating:\s*)null',
            f'our_rating: {rating_str}',
            content,
            count=1,
            flags=re.MULTILINE
        )
        # Also handle case where it already has a numeric value (re-run safe)
        if new_content == content:
            new_content = re.sub(
                r'(our_rating:\s*)[\d.]+',
                f'our_rating: {rating_str}',
                content,
                count=1,
                flags=re.MULTILINE
            )

        if new_content != content:
            open(fpath, "w", encoding="utf-8").write(new_content)
            updated += 1
        else:
            skipped += 1

    return updated, skipped

print("Setting our_rating in places...")
u, s = process_dir(PLACES_DIR)
print(f"  Updated: {u}  Skipped (no our_rating field): {s}")

print("Setting our_rating in hub-cities...")
u, s = process_dir(HUB_DIR)
print(f"  Updated: {u}  Skipped (no our_rating field): {s}")

print("Done.")
