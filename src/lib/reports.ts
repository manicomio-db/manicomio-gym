import { todayLocal } from "@/lib/date";

export function currentMonthParam(): string {
  return todayLocal().slice(0, 7);
}

export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { start, end: `${nextMonth}-01` };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const label = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtShort(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(d);
}

export type Week = { start: string; end: string; label: string };

/** Semanas (lunes a domingo) que tocan el mes dado. `end` es exclusivo. */
export function weeksInMonth(month: string): Week[] {
  const { start, end } = monthRange(month);
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  const cursor = new Date(startDate);
  const day = cursor.getDay(); // 0=domingo..6=sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  cursor.setDate(cursor.getDate() + diffToMonday);

  const weeks: Week[] = [];
  let weekNum = 1;
  while (cursor < endDate) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const lastDay = new Date(weekEnd);
    lastDay.setDate(lastDay.getDate() - 1);
    weeks.push({
      start: toISODate(weekStart),
      end: toISODate(weekEnd),
      label: `Semana ${weekNum} (${fmtShort(weekStart)} – ${fmtShort(lastDay)})`,
    });
    cursor.setDate(cursor.getDate() + 7);
    weekNum++;
  }
  return weeks;
}

/** true si la fecha (YYYY-MM-DD o timestamp ISO) cae en [start, end). */
export function inRange(dateStr: string, start: string, end: string): boolean {
  const d = dateStr.slice(0, 10);
  return d >= start && d < end;
}
