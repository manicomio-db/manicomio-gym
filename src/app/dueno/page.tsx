import { requireProfile } from "@/lib/supabase/session";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { todayLocal } from "@/lib/date";

export default async function DuenoHomePage() {
  const { supabase } = await requireProfile();
  const today = todayLocal();

  const [{ count: sociosActivos }, { count: sociosTotal }, { count: pendientes }, { data: sales }] =
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
    ]);

  const ingresos = (sales ?? []).reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del gimnasio.</p>
      </div>

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
