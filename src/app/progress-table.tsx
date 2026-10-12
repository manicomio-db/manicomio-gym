import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { describeChange, describePoint, type ExerciseProgress } from "@/lib/progress";

function changeClass(p: ExerciseProgress): string {
  if (p.sessions < 2) return "text-muted-foreground";
  const up = (p.weightDelta ?? 0) > 0 || p.repsDelta > 0;
  const down = (p.weightDelta ?? 0) < 0 || p.repsDelta < 0;
  if (up && !down) return "text-green-400";
  if (down && !up) return "text-red-400";
  return "text-yellow-400";
}

/** Tabla de progreso por ejercicio: inicio, último registro y cambio. */
export function ProgressTable({ progress }: { progress: ExerciseProgress[] }) {
  if (progress.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay registros de entrenamiento.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ejercicio</TableHead>
          <TableHead>Sesiones</TableHead>
          <TableHead>Inicio</TableHead>
          <TableHead>Último</TableHead>
          <TableHead>Cambio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {progress.map((p) => (
          <TableRow key={p.exercise}>
            <TableCell className="font-medium">{p.exercise}</TableCell>
            <TableCell>{p.sessions}</TableCell>
            <TableCell>{describePoint(p.first)}</TableCell>
            <TableCell>{describePoint(p.last)}</TableCell>
            <TableCell className={changeClass(p)}>{describeChange(p)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
