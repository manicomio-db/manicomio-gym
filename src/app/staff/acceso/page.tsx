import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CheckIn, DayPass } from "@/lib/types";
import { CheckInForm } from "./check-in-form";
import { registerDayPass } from "../actions";

const HISTORY_LIMIT = 300;

function daysAgo(days: number): string {
  const d = new Date(todayLocal() + "T00:00:00");
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function StaffAccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string }>;
}) {
  const { supabase } = await requireProfile();
  const params = await searchParams;

  const from = params.from || daysAgo(6); // últimos 7 días por defecto (hoy incluido)
  const to = params.to || todayLocal();
  const q = params.q?.trim() ?? "";
  // límite exclusivo: el día siguiente a "to", a medianoche
  const toExclusive = new Date(to + "T00:00:00");
  toExclusive.setDate(toExclusive.getDate() + 1);
  const toExclusiveStr = toExclusive.toISOString().slice(0, 10);

  let checkInsQuery = supabase
    .from("check_ins")
    .select("*, profiles!inner(full_name, member_number)")
    .gte("created_at", from)
    .lt("created_at", toExclusiveStr)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (q) {
    checkInsQuery = checkInsQuery.ilike("profiles.full_name", `%${q}%`);
  }

  const [{ data: checkIns }, { data: dayPasses }] = await Promise.all([
    checkInsQuery.returns<
      (CheckIn & { profiles: { full_name: string | null; member_number: number | null } | null })[]
    >(),
    supabase
      .from("day_passes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<DayPass[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Control de acceso</h1>
        <p className="text-muted-foreground">Busca al socio por su número para registrar su entrada.</p>
      </div>

      <CheckInForm />

      <Card>
        <CardHeader>
          <CardTitle>Historial de entradas</CardTitle>
          <CardDescription>Filtra por fecha y, si quieres, por nombre del socio.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="from">Desde</Label>
              <Input id="from" name="from" type="date" defaultValue={from} className="w-40" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="to">Hasta</Label>
              <Input id="to" name="to" type="date" defaultValue={to} className="w-40" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="q">Nombre del socio</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Opcional" className="w-48" />
            </div>
            <Button type="submit">Filtrar</Button>
          </form>

          {checkIns && checkIns.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Socio</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha y hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkIns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.profiles?.full_name ?? "—"}</TableCell>
                      <TableCell>#{c.profiles?.member_number ?? "—"}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleString("es-MX")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {checkIns.length === HISTORY_LIMIT && (
                <p className="text-xs text-muted-foreground">
                  Mostrando los primeros {HISTORY_LIMIT} resultados — acota el rango de fechas para ver
                  menos entradas a la vez.
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No hay entradas en ese rango de fechas.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pase de visita (un día)</CardTitle>
          <CardDescription>Para personas que no son socias.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={registerDayPass} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="visitor_name">Nombre del visitante</Label>
              <Input id="visitor_name" name="visitor_name" required className="w-56" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Monto cobrado (MXN)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min={1} required className="w-32" />
            </div>
            <Button type="submit">Registrar visita</Button>
          </form>

          {dayPasses && dayPasses.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dayPasses.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.visitor_name}</TableCell>
                    <TableCell>${d.amount.toLocaleString("es-MX")}</TableCell>
                    <TableCell>{new Date(d.created_at).toLocaleString("es-MX")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
