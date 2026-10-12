import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { analyzeProgress, DIFFICULTY_LABEL, GOAL_LABEL } from "@/lib/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Profile, Routine, RoutineRequest, WorkoutLog } from "@/lib/types";
import { WorkoutLogForm } from "../../../../workout-log-form";
import { ProgressTable } from "../../../../progress-table";
import { WorkoutHistory } from "../../../../workout-history";

export default async function StaffProgresoPage({
  params,
}: {
  params: Promise<{ socioId: string }>;
}) {
  const { supabase } = await requireProfile();
  const { socioId } = await params;

  const [{ data: socio }, { data: routine }, { data: lastRequest }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", socioId).maybeSingle<Profile>(),
    supabase
      .from("routines")
      .select("*")
      .eq("socio_id", socioId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Routine>(),
    supabase
      .from("routine_requests")
      .select("*")
      .eq("socio_id", socioId)
      .not("feedback", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<RoutineRequest>(),
  ]);

  let logsQuery = supabase
    .from("workout_logs")
    .select("*")
    .eq("socio_id", socioId)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  logsQuery = routine ? logsQuery.eq("routine_id", routine.id) : logsQuery;
  const { data: logs } = await logsQuery.returns<WorkoutLog[]>();

  const progress = analyzeProgress(logs ?? []);
  const exercises = [
    ...new Set((routine?.contenido.dias ?? []).flatMap((d) => d.ejercicios.map((e) => e.nombre))),
  ].filter(Boolean);
  const f = lastRequest?.feedback ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/staff/socios" className="text-sm text-muted-foreground underline">
          ← Socios
        </Link>
        <h1 className="text-2xl font-bold">
          Progreso — {socio?.full_name ?? "Socio"}{" "}
          <span className="text-lg font-normal text-muted-foreground">#{socio?.member_number}</span>
        </h1>
        <p className="text-muted-foreground">
          {routine ? `Rutina actual: ${routine.title}` : "Aún no tiene una rutina asignada."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cómo va</CardTitle>
          <CardDescription>Desde el primer registro hasta el más reciente de esta rutina.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressTable progress={progress} />
        </CardContent>
      </Card>

      {f && (
        <Card>
          <CardHeader>
            <CardTitle>Opinión del socio sobre su rutina anterior</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>Dificultad: {DIFFICULTY_LABEL[f.dificultad]}</p>
            <p>¿Logró su objetivo?: {GOAL_LABEL[f.objetivo_logrado]}</p>
            <p>Días por semana que entrenó: {f.dias_por_semana ?? "no indicado"}</p>
            <p>Molestias: {f.molestias?.trim() || "ninguna"}</p>
            <p>Comentarios: {f.comentarios?.trim() || "ninguno"}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Anotar entrenamiento a nombre del socio</CardTitle>
          <CardDescription>Útil si lo registras tú mientras entrena.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkoutLogForm socioId={socioId} exercises={exercises} today={todayLocal()} />
        </CardContent>
      </Card>

      {(logs ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos registros</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkoutHistory logs={(logs ?? []).slice(0, 30)} socioId={socioId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
