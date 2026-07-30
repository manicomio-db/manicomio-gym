import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MONTH_LABEL = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

export default async function DuenoIngresosPage() {
  const { supabase } = await requireProfile();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: memberships }, { data: dayPasses }, { data: sales }] = await Promise.all([
    supabase
      .from("memberships")
      .select("amount_paid, membership_plans(name)")
      .gte("created_at", monthStart)
      .not("amount_paid", "is", null)
      .returns<{ amount_paid: number; membership_plans: { name: string } | null }[]>(),
    supabase.from("day_passes").select("amount").gte("created_at", monthStart).returns<{ amount: number }[]>(),
    supabase.from("sales").select("total").gte("created_at", monthStart).returns<{ total: number }[]>(),
  ]);

  const membershipTotal = (memberships ?? []).reduce((sum, m) => sum + Number(m.amount_paid), 0);
  const dayPassTotal = (dayPasses ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const salesTotal = (sales ?? []).reduce((sum, s) => sum + Number(s.total), 0);
  const grandTotal = membershipTotal + dayPassTotal + salesTotal;

  const byPlan = new Map<string, { count: number; total: number }>();
  for (const m of memberships ?? []) {
    const name = m.membership_plans?.name ?? "Sin plan";
    const entry = byPlan.get(name) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(m.amount_paid);
    byPlan.set(name, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Ingresos</h1>
        <p className="text-muted-foreground capitalize">{MONTH_LABEL.format(now)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>${grandTotal.toLocaleString("es-MX")}</CardTitle>
            <CardDescription>Total del mes</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>${membershipTotal.toLocaleString("es-MX")}</CardTitle>
            <CardDescription>Membresías ({memberships?.length ?? 0})</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>${dayPassTotal.toLocaleString("es-MX")}</CardTitle>
            <CardDescription>Pases de visita ({dayPasses?.length ?? 0})</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>${salesTotal.toLocaleString("es-MX")}</CardTitle>
            <CardDescription>Tienda</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membresías por plan</CardTitle>
          <CardDescription>Este mes</CardDescription>
        </CardHeader>
        <CardContent>
          {byPlan.size > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(byPlan.entries()).map(([name, data]) => (
                  <TableRow key={name}>
                    <TableCell>{name}</TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell>${data.total.toLocaleString("es-MX")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              Aún no hay membresías activadas/renovadas este mes con monto registrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
