// Formatting helpers shared across both surfaces.

/** Format integer cents as a USD price string, e.g. 12900 -> "$129". */
export function formatPrice(
  cents: number,
  opts: { showCents?: boolean } = {},
): string {
  const dollars = cents / 100;
  const showCents = opts.showCents ?? !Number.isInteger(dollars);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(dollars);
}

/** Format an ISO date string as e.g. "Jul 16, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Short date without year, e.g. "Jul 16". */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Whole nights between two ISO dates (min 1). */
export function nightsBetween(checkIn: string, checkOut?: string): number {
  if (!checkOut) return 1;
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 1;
  const nights = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}
