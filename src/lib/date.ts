const GYM_TIMEZONE = "America/Mexico_City";

/**
 * "Today" as YYYY-MM-DD in the gym's local timezone, regardless of the
 * server's timezone (Vercel functions run in UTC, which can be a day ahead
 * of Mexico late in the evening).
 */
export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GYM_TIMEZONE }).format(new Date());
}
