import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RoutineRequest } from "@/lib/types";
import { RoutineComposer } from "./routine-composer";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

export default async function StaffRutinasPage() {
  const { supabase } = await requireProfile();

  const { data: requests } = await supabase
    .from("routine_requests")
    .select("*, profiles(full_name)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<(RoutineRequest & { profiles: { full_name: string | null } | null })[]>();

  const activos = (requests ?? []).filter((r) => r.status !== "completado");
  const completados = (requests ?? []).filter((r) => r.status === "completado").slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Solicitudes de rutina</h1>
        <p className="text-muted-foreground">
          Genera un borrador con IA, ajústalo y asígnalo al socio.
        </p>
      </div>

      {activos.length === 0 && (
        <p className="text-muted-foreground">No hay solicitudes pendientes.</p>
      )}

      <div className="flex flex-col gap-4">
        {activos.map((r) => (
          <RoutineComposer
            key={r.id}
            request={{
              id: r.id,
              socioId: r.socio_id,
              socioNombre: r.profiles?.full_name ?? "Socio",
              objetivo: r.objetivo,
              nivel: r.nivel,
              lesiones: r.lesiones,
              sesionesSemana: r.sesiones_semana,
              status: r.status,
            }}
          />
        ))}
      </div>

      {completados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completadas recientemente</CardTitle>
            <CardDescription>Últimas 10 solicitudes atendidas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {completados.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>
                  {r.profiles?.full_name ?? "Socio"} — {r.objetivo}
                </span>
                <Badge variant="secondary">{STATUS_LABEL[r.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
