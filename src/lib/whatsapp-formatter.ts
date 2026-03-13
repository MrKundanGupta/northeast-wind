import type { CartPlace } from "../stores/trip-cart";
import { fmtDrive } from "./hub-utils";

/**
 * Build a clean WhatsApp-friendly text with state grouping, drive times, and ratings.
 */
export function formatItineraryForWhatsApp(
  groups: Record<string, CartPlace[]>,
  hub: string,
  totalMins: number,
): string {
  const lines: string[] = [];

  lines.push("*My Northeast India Trip*");
  lines.push("");

  if (hub) {
    lines.push(`Starting from: ${hub}`);
    lines.push(`Total drive time: ${fmtDrive(totalMins)} (approx.)`);
    lines.push("");
  }

  for (const [state, places] of Object.entries(groups)) {
    lines.push(`*${state}* (${places.length} places)`);

    for (const p of places) {
      let line = `  - ${p.name} [${p.category}]`;
      if (p.googleRating) line += ` ${p.googleRating}`;

      if (hub) {
        const l = p.logistics.find((x) => x.hub_name === hub);
        if (l) line += ` | ${fmtDrive(l.drive_time_mins)} drive`;
      }

      lines.push(line);
    }

    lines.push("");
  }

  lines.push("Planned with Northeast Explorer");

  return lines.join("\n");
}

/** Returns a wa.me share URL with the given text. */
export function getWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
