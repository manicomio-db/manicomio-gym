import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CheckIn } from "@/lib/types";
import { CheckInForm } from "./check-in-form";

export default async function StaffAccesoPage() {
  const { supabase } = await requireProfile();

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("*, profiles(full_name, member_number)")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<(CheckIn & { profiles: { full_name: string | null; member_number: number | null } | null })[]>();

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
    </div>
  );
}
