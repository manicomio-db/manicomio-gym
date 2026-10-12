import type { Routine, RoutineFeedback, WorkoutLog } from "@/lib/types";

export const DIFFICULTY_LABEL: Record<RoutineFeedback["dificultad"], string> = {
  muy_facil: "Muy fácil",
  adecuada: "Adecuada",
  muy_dificil: "Muy difícil",
};

export const GOAL_LABEL: Record<RoutineFeedback["objetivo_logrado"], string> = {
  si: "Sí, lo logré",
  parcial: "Parcialmente",
  no: "No lo logré",
};

/** Agrupa "Sentadilla", " sentadilla " y "SENTADILLA" como el mismo ejercicio. */
export function normalizeExercise(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Fuerza estimada de 1 repetición máxima (fórmula de Epley). Null si no hay peso. */
export function estimate1RM(weightKg: number | null, reps: number): number | null {
  if (!weightKg || weightKg <= 0) return null;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export type SetPoint = { date: string; weight: number | null; reps: number; sets: number | null; e1rm: number | null };

export type ExerciseProgress = {
  exercise: string;
  sessions: number;
  first: SetPoint;
  last: SetPoint;
  bestWeight: number | null;
  weightDelta: number | null;
  weightPct: number | null;
  repsDelta: number;
  e1rmPct: number | null;
};

function toPoint(l: WorkoutLog): SetPoint {
  const weight = l.weight_kg === null ? null : Number(l.weight_kg);
  return { date: l.log_date, weight, reps: l.reps, sets: l.sets, e1rm: estimate1RM(weight, l.reps) };
}

/** De varias series del mismo día se toma la "serie top" (la de mayor fuerza estimada). */
function topSet(points: SetPoint[]): SetPoint {
  return points.reduce((best, p) => {
    const a = p.e1rm ?? p.reps;
    const b = best.e1rm ?? best.reps;
    return a > b ? p : best;
  });
}

function pct(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return Math.round(((to - from) / from) * 1000) / 10;
}

/** Progreso por ejercicio: cómo empezó, cómo va y cuánto cambió. */
export function analyzeProgress(logs: WorkoutLog[]): ExerciseProgress[] {
  const groups = new Map<string, { name: string; byDate: Map<string, SetPoint[]> }>();

  for (const l of logs) {
    const key = normalizeExercise(l.exercise);
    if (!key) continue;
    const g = groups.get(key) ?? { name: l.exercise.trim(), byDate: new Map() };
    const day = g.byDate.get(l.log_date) ?? [];
    day.push(toPoint(l));
    g.byDate.set(l.log_date, day);
    groups.set(key, g);
  }

  const result: ExerciseProgress[] = [];
  for (const g of groups.values()) {
    const dates = [...g.byDate.keys()].sort();
    const first = topSet(g.byDate.get(dates[0])!);
    const last = topSet(g.byDate.get(dates[dates.length - 1])!);
    const weights = [...g.byDate.values()].flat().map((p) => p.weight ?? 0);
    const bestWeight = Math.max(...weights);

    result.push({
      exercise: g.name,
      sessions: dates.length,
      first,
      last,
      bestWeight: bestWeight > 0 ? bestWeight : null,
      weightDelta:
        first.weight !== null && last.weight !== null
          ? Math.round((last.weight - first.weight) * 100) / 100
          : null,
      weightPct: pct(first.weight, last.weight),
      repsDelta: last.reps - first.reps,
      e1rmPct: pct(first.e1rm, last.e1rm),
    });
  }

  return result.sort((a, b) => b.sessions - a.sessions || a.exercise.localeCompare(b.exercise));
}

export function describePoint(p: SetPoint): string {
  const w = p.weight && p.weight > 0 ? `${p.weight} kg` : "peso corporal";
  return `${p.sets ? `${p.sets}×` : ""}${p.reps} reps · ${w}`;
}

function signed(n: number, suffix = ""): string {
  return `${n > 0 ? "+" : ""}${n}${suffix}`;
}

export function describeChange(p: ExerciseProgress): string {
  if (p.sessions < 2) return "Solo 1 registro";
  const parts: string[] = [];
  if (p.weightDelta !== null && (p.first.weight || p.last.weight)) {
    parts.push(
      `${signed(p.weightDelta, " kg")}${p.weightPct !== null ? ` (${signed(p.weightPct, "%")})` : ""}`
    );
  }
  parts.push(`${signed(p.repsDelta)} reps`);
  if (p.e1rmPct !== null) parts.push(`fuerza est. ${signed(p.e1rmPct, "%")}`);
  return parts.join(" · ");
}

/** Resumen en texto del progreso, la rutina anterior y la opinión del socio, para la IA. */
export function progressSummaryForPrompt(opts: {
  previous: Routine | null;
  progress: ExerciseProgress[];
  feedback: RoutineFeedback | null;
}): string {
  const lines: string[] = [];

  if (opts.previous) {
    lines.push(`Rutina anterior: "${opts.previous.title}"`);
    for (const d of opts.previous.contenido.dias ?? []) {
      lines.push(
        `  • ${d.dia}: ${d.ejercicios.map((e) => `${e.nombre} ${e.series}x${e.reps}`).join(", ")}`
      );
    }
  } else {
    lines.push("No hay una rutina anterior registrada.");
  }

  if (opts.progress.length > 0) {
    lines.push("Progreso registrado durante la rutina anterior (inicio → último registro):");
    for (const p of opts.progress) {
      lines.push(
        `  • ${p.exercise} (${p.sessions} sesiones): ${describePoint(p.first)} → ${describePoint(p.last)}; ${describeChange(p)}`
      );
    }
  } else {
    lines.push("El socio no registró su progreso (peso/repeticiones) con la rutina anterior.");
  }

  if (opts.feedback) {
    const f = opts.feedback;
    lines.push("Opinión del socio sobre la rutina anterior:");
    lines.push(`  • Dificultad: ${DIFFICULTY_LABEL[f.dificultad]}`);
    lines.push(`  • ¿Logró su objetivo?: ${GOAL_LABEL[f.objetivo_logrado]}`);
    lines.push(`  • Días por semana que realmente entrenó: ${f.dias_por_semana ?? "no indicado"}`);
    lines.push(`  • Molestias o dolor: ${f.molestias?.trim() || "ninguno"}`);
    lines.push(`  • Comentarios: ${f.comentarios?.trim() || "ninguno"}`);
  }

  return lines.join("\n");
}
