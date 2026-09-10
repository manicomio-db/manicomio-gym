const GYM_TIMEZONE = "America/Mexico_City";

/**
 * "Today" as YYYY-MM-DD in the gym's local timezone, regardless of the
 * server's timezone (Vercel functions run in UTC, which can be a day ahead
 * of Mexico late in the evening).
 */
export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GYM_TIMEZONE }).format(new Date());
}

/** Suma `days` días a una fecha YYYY-MM-DD y devuelve otra fecha YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
