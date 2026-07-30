import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteDayPass, deleteMembership, deleteSale } from "../actions";

const MONTH_LABEL = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

type MembershipRow = {
  id: string;
  amount_paid: number;
  created_at: string;
  membership_plans: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

type DayPassRow = { id: string; visitor_name: string; amount: number; created_at: string };

type SaleRow = {
  id: string;
  quantity: number;
  total: number;
  created_at: string;
  products: { name: string } | null;
};

export default async function DuenoIngresosPage() {
  const { supabase } = await requireProfile();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: memberships }, { data: dayPasses }, { data: sales }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, amount_paid, created_at, membership_plans(name), profiles(full_name)")
      .gte("created_at", monthStart)
      .not("amount_paid", "is", null)
      .order("created_at", { ascending: false })
      .returns<MembershipRow[]>(),
    supabase
      .from("day_passes")
      .select("id, visitor_name, amount, created_at")
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false })
      .returns<DayPassRow[]>(),
    supabase
      .from("sales")
      .select("id, quantity, total, created_at, products(name)")
      .gte("created_at", monthStart)
      .order("created_at", { ascending: false })
      .returns<SaleRow[]>(),
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

      <Card>
        <CardHeader>
          <CardTitle>Membresías registradas este mes</CardTitle>
          <CardDescription>Borra un registro si fue una prueba o un error.</CardDescription>
        </CardHeader>
        <CardContent>
          {memberships && memberships.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.profiles?.full_name ?? "—"}</TableCell>
                    <TableCell>{m.membership_plans?.name ?? "—"}</TableCell>
                    <TableCell>${Number(m.amount_paid).toLocaleString("es-MX")}</TableCell>
                    <TableCell>{new Date(m.created_at).toLocaleDateString("es-MX")}</TableCell>
                    <TableCell>
                      <form action={deleteMembership}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Borrar
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Sin registros este mes.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pases de visita este mes</CardTitle>
          <CardDescription>Borra un registro si fue una prueba o un error.</CardDescription>
        </CardHeader>
        <CardContent>
          {dayPasses && dayPasses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dayPasses.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.visitor_name}</TableCell>
                    <TableCell>${Number(d.amount).toLocaleString("es-MX")}</TableCell>
                    <TableCell>{new Date(d.created_at).toLocaleDateString("es-MX")}</TableCell>
                    <TableCell>
                      <form action={deleteDayPass}>
                        <input type="hidden" name="id" value={d.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Borrar
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Sin registros este mes.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventas registradas este mes</CardTitle>
          <CardDescription>Borra un registro si fue una prueba o un error.</CardDescription>
        </CardHeader>
        <CardContent>
          {sales && sales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.products?.name ?? "—"}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>${Number(s.total).toLocaleString("es-MX")}</TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleDateString("es-MX")}</TableCell>
                    <TableCell>
                      <form action={deleteSale}>
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Borrar
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Sin registros este mes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
