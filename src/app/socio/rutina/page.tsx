import { requireProfile } from "@/lib/supabase/session";
import { requestRoutine } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Routine, RoutineRequest } from "@/lib/types";

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
          <form action={requestRoutine} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Input id="objetivo" name="objetivo" placeholder="Ej: Bajar de peso, ganar fuerza" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nivel">Nivel</Label>
              <Select name="nivel" defaultValue="intermedio">
                <SelectTrigger id="nivel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principiante">Principiante</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sesiones_semana">Sesiones por semana</Label>
              <Input
                id="sesiones_semana"
                name="sesiones_semana"
                type="number"
                min={1}
                max={7}
                defaultValue={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lesiones">Lesiones o condiciones previas</Label>
              <Textarea id="lesiones" name="lesiones" placeholder="Rodilla, hombro, ninguna..." />
            </div>
            <Button type="submit" className="w-fit">
              Enviar solicitud
            </Button>
          </form>
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
