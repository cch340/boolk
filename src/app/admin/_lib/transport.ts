import type { TransportInfo, TransportMode } from "@/lib/types";

/** All transport modes, in display order (source of truth for admin UI). */
export const TRANSPORT_MODES: TransportMode[] = [
  "flight",
  "train",
  "bus",
  "ferry",
  "transfer",
];

/** Options for a transport mode <Select>. */
export const TRANSPORT_MODE_OPTIONS = TRANSPORT_MODES.map((m) => ({
  value: m,
  label: m.charAt(0).toUpperCase() + m.slice(1),
}));

/**
 * Short route summary for a transport listing/booking, e.g. "HND → SIN · flight".
 * Prefers airport/station codes, falling back to city names. Returns null when
 * no transport metadata is present.
 */
export function routeSummary(transport?: TransportInfo | null): string | null {
  if (!transport) return null;
  const from = transport.originCode || transport.originCity;
  const to = transport.destinationCode || transport.destinationCity;
  return `${from} → ${to} · ${transport.mode}`;
}
