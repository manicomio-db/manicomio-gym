import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CheckIn, DayPass } from "@/lib/types";
import { CheckInForm } from "./check-in-form";
import { registerDayPass } from "../actions";

export default async function StaffAccesoPage() {
  const { supabase } = await requireProfile();

  const [{ data: checkIns }, { data: dayPasses }] = await Promise.all([
    supabase
      .from("check_ins")
      .select("*, profiles(full_name, member_number)")
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<(CheckIn & { profiles: { full_name: string | null; member_number: number | null } | null })[]>(),
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
          <CardTitle>Entradas recientes</CardTitle>
          <CardDescription>Últimas 30</CardDescription>
        </CardHeader>
        <CardContent>
          {checkIns && checkIns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Hora</TableHead>
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
          ) : (
            <p className="text-muted-foreground">Aún no hay entradas registradas.</p>
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
