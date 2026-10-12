import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateOnlyLocal } from "@/lib/date";
import { describePoint } from "@/lib/progress";
import type { WorkoutLog } from "@/lib/types";
import { deleteWorkoutLog } from "./progreso-actions";

/** Últimos registros, con botón para borrar uno si hubo un error al anotarlo. */
export function WorkoutHistory({ logs, socioId }: { logs: WorkoutLog[]; socioId: string }) {
  if (logs.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Ejercicio</TableHead>
          <TableHead>Registro</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((l) => (
          <TableRow key={l.id}>
            <TableCell>{formatDateOnlyLocal(`${l.log_date}T12:00:00Z`)}</TableCell>
            <TableCell>{l.exercise}</TableCell>
            <TableCell>
              {describePoint({
                date: l.log_date,
                weight: l.weight_kg === null ? null : Number(l.weight_kg),
                reps: l.reps,
                sets: l.sets,
                e1rm: null,
              })}
            </TableCell>
            <TableCell className="text-right">
              <form action={deleteWorkoutLog}>
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="socio_id" value={socioId} />
                <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                  Borrar
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
