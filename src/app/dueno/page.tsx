import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { todayLocal } from "@/lib/date";
import { getExpiredSocios } from "@/lib/memberships";

export default async function DuenoHomePage() {
  const { supabase } = await requireProfile();
  const today = todayLocal();

  const [{ count: sociosActivos }, { count: sociosTotal }, { count: pendientes }, { data: sales }, expiredSocios] =
    await Promise.all([
      supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .gte("end_date", today),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "socio"),
      supabase
        .from("routine_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendiente"),
      supabase.from("sales").select("total"),
      getExpiredSocios(supabase),
    ]);

  const ingresos = (sales ?? []).reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del gimnasio.</p>
      </div>

      {expiredSocios.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              {expiredSocios.length} {expiredSocios.length === 1 ? "socio con" : "socios con"} membresía
              vencida
            </CardTitle>
            <CardDescription>
              {expiredSocios
                .slice(0, 5)
                .map((s) => `${s.full_name ?? "Sin nombre"} (#${s.member_number})`)
                .join(", ")}
              {expiredSocios.length > 5 && ` y ${expiredSocios.length - 5} más`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="destructive" render={<Link href="/staff/socios?status=vencida" />}>
              Ver y renovar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{sociosActivos ?? 0}</CardTitle>
            <CardDescription>Membresías activas</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{sociosTotal ?? 0}</CardTitle>
            <CardDescription>Socios registrados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{pendientes ?? 0}</CardTitle>
            <CardDescription>Solicitudes de rutina pendientes</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>${ingresos.toLocaleString("es-MX")}</CardTitle>
            <CardDescription>Ingresos por ventas (histórico)</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
