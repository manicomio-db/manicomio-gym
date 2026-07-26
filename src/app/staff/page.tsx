import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function StaffHomePage() {
  const { supabase } = await requireProfile();

  const [{ count: pendientes }, { count: socios }, { count: productos }] = await Promise.all([
    supabase
      .from("routine_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendiente"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "socio"),
    supabase.from("products").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de staff</h1>
        <p className="text-muted-foreground">Resumen de lo que necesita atención.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{pendientes ?? 0}</CardTitle>
            <CardDescription>Solicitudes de rutina pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" nativeButton={false} render={<Link href="/staff/rutinas" />}>
              Ver rutinas
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{socios ?? 0}</CardTitle>
            <CardDescription>Socios registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/staff/socios" />}>
              Ver socios
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{productos ?? 0}</CardTitle>
            <CardDescription>Productos en catálogo</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/staff/ventas" />}>
              Registrar venta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
