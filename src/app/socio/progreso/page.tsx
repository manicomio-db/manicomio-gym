import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { analyzeProgress } from "@/lib/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Routine, WorkoutLog } from "@/lib/types";
import { WorkoutLogForm } from "../../workout-log-form";
import { ProgressTable } from "../../progress-table";
import { WorkoutHistory } from "../../workout-history";

export default async function SocioProgresoPage() {
  const { profile, supabase } = await requireProfile();

  const { data: routine } = await supabase
    .from("routines")
    .select("*")
    .eq("socio_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Routine>();

  let logsQuery = supabase
    .from("workout_logs")
    .select("*")
    .eq("socio_id", profile.id)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  logsQuery = routine ? logsQuery.eq("routine_id", routine.id) : logsQuery;
  const { data: logs } = await logsQuery.returns<WorkoutLog[]>();

  const progress = analyzeProgress(logs ?? []);
  const exercises = [
    ...new Set((routine?.contenido.dias ?? []).flatMap((d) => d.ejercicios.map((e) => e.nombre))),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi progreso</h1>
        <p className="text-muted-foreground">
          Anota el peso y las repeticiones de tus ejercicios. Cuando pidas una rutina nueva, tu
          instructor la diseñará a partir de tu avance.
        </p>
      </div>

      {!routine && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Aún no tienes una rutina asignada</CardTitle>
            <CardDescription>
              Puedes anotar ejercicios de todos modos; se ligarán a tu próxima rutina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" render={<Link href="/socio/rutina" />}>
              Ir a Mi rutina
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registrar entrenamiento</CardTitle>
          <CardDescription>
            Una línea por ejercicio: el peso y las repeticiones de tu mejor serie del día.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkoutLogForm exercises={exercises} today={todayLocal()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cómo vas{routine ? ` con "${routine.title}"` : ""}</CardTitle>
          <CardDescription>Desde tu primer registro hasta el más reciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressTable progress={progress} />
        </CardContent>
      </Card>

      {(logs ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos registros</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkoutHistory logs={(logs ?? []).slice(0, 20)} socioId={profile.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
