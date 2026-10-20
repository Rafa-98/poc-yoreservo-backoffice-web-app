export const DEFAULT_VENUE_TIMEZONE = "America/Caracas";

export const COMMON_IANA_TIMEZONES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "America/Caracas", label: "America/Caracas (GMT-4 · Venezuela)" },
  { value: "America/Bogota", label: "America/Bogota (GMT-5 · Colombia)" },
  { value: "America/Panama", label: "America/Panama (GMT-5 · Panamá)" },
  { value: "America/Lima", label: "America/Lima (GMT-5 · Perú)" },
  { value: "America/Santiago", label: "America/Santiago (Chile)" },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "America/Argentina/Buenos_Aires (GMT-3 · Argentina)",
  },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (GMT-3 · Brasil)" },
  { value: "America/Mexico_City", label: "America/Mexico_City (GMT-6 · México)" },
  { value: "America/New_York", label: "America/New_York (ET · EE.UU.)" },
  { value: "America/Chicago", label: "America/Chicago (CT · EE.UU.)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PT · EE.UU.)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET · España)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

/**
 * Returns YYYY-MM-DD in the given IANA timezone (defaults to America/Caracas).
 * Prevents the UTC midnight bug where 8:00 PM in Caracas is already the next day in UTC.
 */
export function todayInTimezone(timeZone: string = DEFAULT_VENUE_TIMEZONE): string {
  const tz = timeZone || DEFAULT_VENUE_TIMEZONE;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_VENUE_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
}

/**
 * Adds a number of calendar days to an ISO date string (YYYY-MM-DD) using UTC calendar math.
 */
export function addDaysToIsoDate(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  if (!y || !m || !d) {
    return dateIso;
  }
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

/**
 * Returns the short GMT offset label for an IANA timezone (e.g. "GMT-4").
 */
export function getTimezoneOffsetLabel(timeZone: string = DEFAULT_VENUE_TIMEZONE): string {
  const tz = timeZone || DEFAULT_VENUE_TIMEZONE;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value || "GMT-4";
  } catch {
    return "GMT-4";
  }
}

/**
 * Returns the current browser's IANA timezone, falling back to DEFAULT_VENUE_TIMEZONE.
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_VENUE_TIMEZONE;
  } catch {
    return DEFAULT_VENUE_TIMEZONE;
  }
}

/**
 * Returns true when the venue's IANA timezone differs from the user's browser timezone.
 */
export function isTimezoneDifferentFromBrowser(venueTimezone?: string | null): boolean {
  const targetTz = venueTimezone || DEFAULT_VENUE_TIMEZONE;
  return targetTz !== getBrowserTimezone();
}
