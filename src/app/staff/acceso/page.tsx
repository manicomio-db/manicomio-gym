import { requireProfile } from "@/lib/supabase/session";
import {
  todayLocal,
  formatDateOnlyLocal,
  formatTimeLocal,
  formatDateTimeLocal,
  startOfLocalDayIso,
} from "@/lib/date";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CheckIn, DayPass } from "@/lib/types";
import { CheckInForm } from "./check-in-form";
import { DayPassForm } from "./day-pass-form";
import { PageHeader } from "@/components/page-header";

const HISTORY_LIMIT = 300;
const DAY_PASS_LIMIT = 200;

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
  const { profile, supabase } = await requireProfile();
  const isDueno = profile.role === "dueno";
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
    .select("*, profiles!check_ins_socio_id_fkey(full_name, member_number)")
    .gte("created_at", startOfLocalDayIso(from))
    .lt("created_at", startOfLocalDayIso(toExclusiveStr))
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (q) {
    checkInsQuery = checkInsQuery.ilike("profiles.full_name", `%${q}%`);
  }

  const [{ data: checkIns }, { data: dayPasses }] = await Promise.all([
    checkInsQuery.returns<
      (CheckIn & {
        profiles: {
          full_name: string | null;
          member_number: number | null;
        } | null;
      })[]
    >(),
    supabase
      .from("day_passes")
      .select("*")
      .gte("pass_date", from)
      .lte("pass_date", to)
      .order("pass_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(DAY_PASS_LIMIT)
      .returns<DayPass[]>(),
  ]);

  const dayPassTotal = (dayPasses ?? []).reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Control de acceso"
        subtitle="Busca al socio por su número para registrar su entrada."
      />

      <CheckInForm />

      <Card>
        <CardHeader>
          <CardTitle>Historial de entradas</CardTitle>
          <CardDescription>
            Filtra por fecha y, si quieres, por nombre del socio.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="from">Desde</Label>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={from}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="to">Hasta</Label>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={to}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="q">Nombre del socio</Label>
              <Input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Opcional"
                className="w-48"
              />
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
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkIns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.profiles?.full_name ?? "—"}</TableCell>
                      <TableCell>#{c.profiles?.member_number ?? "—"}</TableCell>
                      <TableCell>{formatDateOnlyLocal(c.created_at)}</TableCell>
                      <TableCell>{formatTimeLocal(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {checkIns.length === HISTORY_LIMIT && (
                <p className="text-xs text-muted-foreground">
                  Mostrando los primeros {HISTORY_LIMIT} resultados — acota el
                  rango de fechas para ver menos entradas a la vez.
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              No hay entradas en ese rango de fechas.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pase de visita (un día)</CardTitle>
          <CardDescription>
            Para personas que no son socias.
            {isDueno &&
              " Como director puedes elegir la fecha para capturar visitas de días pasados."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DayPassForm canChooseDate={isDueno} today={todayLocal()} />

          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Visitas del {formatDateOnlyLocal(`${from}T12:00:00Z`)} al{" "}
              {formatDateOnlyLocal(`${to}T12:00:00Z`)} (mismo rango de fechas
              del filtro de arriba).
            </p>
            <p className="text-sm font-semibold">
              {(dayPasses ?? []).length}{" "}
              {(dayPasses ?? []).length === 1 ? "visita" : "visitas"} · $
              {dayPassTotal.toLocaleString("es-MX")}
            </p>
          </div>

          {dayPasses && dayPasses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Capturada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dayPasses.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {formatDateOnlyLocal(`${d.pass_date}T12:00:00Z`)}
                    </TableCell>
                    <TableCell>{d.visitor_name}</TableCell>
                    <TableCell>${d.amount.toLocaleString("es-MX")}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTimeLocal(d.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              No hay visitas en ese rango de fechas.
            </p>
          )}
          {dayPasses && dayPasses.length === DAY_PASS_LIMIT && (
            <p className="text-xs text-muted-foreground">
              Mostrando las primeras {DAY_PASS_LIMIT} visitas — acota el rango
              de fechas para ver menos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
