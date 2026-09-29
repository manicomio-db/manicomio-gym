const GYM_TIMEZONE = "America/Mexico_City";

/**
 * "Today" as YYYY-MM-DD in the gym's local timezone, regardless of the
 * server's timezone (Vercel functions run in UTC, which can be a day ahead
 * of Mexico late in the evening).
 */
export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GYM_TIMEZONE }).format(new Date());
}

/** Fecha YYYY-MM-DD, en la zona horaria del gimnasio, de un instante (Date o ISO). */
export function localDateOf(value: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GYM_TIMEZONE }).format(new Date(value));
}

/**
 * Hora (h:mm a. m./p. m.) de un instante en la zona del gimnasio. Se usa en vez
 * de toLocaleTimeString a secas porque estas pantallas se renderizan en el
 * servidor (Vercel corre en UTC) o en el dispositivo del staff, y en ambos
 * casos la hora debe ser siempre la de Ciudad de México, no la del ambiente.
 */
export function formatTimeLocal(value: Date | string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: GYM_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/** Fecha y hora de un instante en la zona del gimnasio (ver formatTimeLocal). */
export function formatDateTimeLocal(value: Date | string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: GYM_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/** Fecha (sin hora) de un instante en la zona del gimnasio (ver formatTimeLocal). */
export function formatDateOnlyLocal(value: Date | string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: GYM_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** Suma `days` días a una fecha YYYY-MM-DD y devuelve otra fecha YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
