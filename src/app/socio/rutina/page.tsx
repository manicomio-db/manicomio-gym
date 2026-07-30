import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Routine, RoutineRequest } from "@/lib/types";
import { RequestRoutineForm } from "./request-form";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

export default async function SocioRutinaPage() {
  const { profile, supabase } = await requireProfile();

  const [{ data: routine }, { data: requests }] = await Promise.all([
    supabase
      .from("routines")
      .select("*")
      .eq("socio_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Routine>(),
    supabase
      .from("routine_requests")
      .select("*")
      .eq("socio_id", profile.id)
      .order("created_at", { ascending: false })
      .returns<RoutineRequest[]>(),
  ]);

  const activeRequest = requests?.find(
    (r) => r.status === "pendiente" || r.status === "en_progreso"
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi rutina</h1>
        <p className="text-muted-foreground">
          Consulta tu rutina asignada o pide una nueva a tu instructor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rutina actual</CardTitle>
          {routine && (
            <CardDescription>
              {routine.title} · {routine.source === "ia" ? "Generada con IA" : "Manual"}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {routine ? (
            <div className="flex flex-col gap-4">
              {routine.contenido.resumen && (
                <p className="text-sm text-muted-foreground">{routine.contenido.resumen}</p>
              )}
              {routine.contenido.dias?.map((dia, i) => (
                <div key={i} className="rounded-md border p-3">
                  <p className="font-semibold">{dia.dia}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {dia.ejercicios.map((ej, j) => (
                      <li key={j}>
                        {ej.nombre} — {ej.series} series x {ej.reps} reps
                        {ej.notas && <span className="text-muted-foreground"> ({ej.notas})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aún no tienes una rutina asignada.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedir nueva rutina</CardTitle>
          <CardDescription>Tu instructor la revisará y te la asignará.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeRequest ? (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{activeRequest.objetivo}</p>
                <Badge variant="secondary">{STATUS_LABEL[activeRequest.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Ya tienes una solicitud en trámite. Cuando tu instructor te asigne la rutina,
                aparecerá arriba y podrás pedir una nueva.
              </p>
            </div>
          ) : (
            <RequestRoutineForm />
          )}
        </CardContent>
      </Card>

      {requests && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de solicitudes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>{r.objetivo}</span>
                <Badge variant="secondary">{STATUS_LABEL[r.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
