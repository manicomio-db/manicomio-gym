import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { currentMonthParam, monthLabel, monthRange, shiftMonth, weeksInMonth, inRange } from "@/lib/reports";
import { deleteDayPass, deleteMembership, deleteSale } from "../actions";

type MembershipRow = {
  id: string;
  amount_paid: number;
  start_date: string;
  membership_plans: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

type DayPassRow = { id: string; visitor_name: string; amount: number; created_at: string };

type SaleRow = {
  id: string;
  quantity: number;
  total: number;
  sale_date: string;
  products: { name: string } | null;
};

type ExpenseRow = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  expense_categories: { name: string } | null;
};

function money(n: number) {
  return `$${n.toLocaleString("es-MX")}`;
}

export default async function DuenoIngresosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const { supabase } = await requireProfile();
  const params = await searchParams;
  const month = params.month || currentMonthParam();
  const view = params.view === "semanal" ? "semanal" : "mensual";
  const { start: monthStart, end: monthEnd } = monthRange(month);

  const [{ data: memberships }, { data: dayPasses }, { data: sales }, { data: expenses }] = await Promise.all([
    supabase
      .from("memberships")
      .select(
        "id, amount_paid, start_date, membership_plans(name), profiles!memberships_socio_id_fkey(full_name)"
      )
      .gte("start_date", monthStart)
      .lt("start_date", monthEnd)
      .not("amount_paid", "is", null)
      .order("start_date", { ascending: false })
      .returns<MembershipRow[]>(),
    supabase
      .from("day_passes")
      .select("id, visitor_name, amount, created_at")
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd)
      .order("created_at", { ascending: false })
      .returns<DayPassRow[]>(),
    supabase
      .from("sales")
      .select("id, quantity, total, sale_date, products(name)")
      .gte("sale_date", monthStart)
      .lt("sale_date", monthEnd)
      .order("sale_date", { ascending: false })
      .returns<SaleRow[]>(),
    supabase
      .from("expenses")
      .select("id, description, amount, expense_date, expense_categories(name)")
      .gte("expense_date", monthStart)
      .lt("expense_date", monthEnd)
      .order("expense_date", { ascending: false })
      .returns<ExpenseRow[]>(),
  ]);

  const membershipTotal = (memberships ?? []).reduce((sum, m) => sum + Number(m.amount_paid), 0);
  const dayPassTotal = (dayPasses ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
  const salesTotal = (sales ?? []).reduce((sum, s) => sum + Number(s.total), 0);
  const grandTotal = membershipTotal + dayPassTotal + salesTotal;
  const expensesTotal = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = grandTotal - expensesTotal;

  const byPlan = new Map<string, { count: number; total: number }>();
  for (const m of memberships ?? []) {
    const name = m.membership_plans?.name ?? "Sin plan";
    const entry = byPlan.get(name) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(m.amount_paid);
    byPlan.set(name, entry);
  }

  const byProduct = new Map<string, { qty: number; total: number }>();
  for (const s of sales ?? []) {
    const name = s.products?.name ?? "Producto eliminado";
    const entry = byProduct.get(name) ?? { qty: 0, total: 0 };
    entry.qty += s.quantity;
    entry.total += Number(s.total);
    byProduct.set(name, entry);
  }

  const byCategory = new Map<string, number>();
  for (const e of expenses ?? []) {
    const name = e.expense_categories?.name ?? "Sin categoría";
    byCategory.set(name, (byCategory.get(name) ?? 0) + Number(e.amount));
  }

  const weeks = weeksInMonth(month);
  const weeklyRows = weeks.map((w) => {
    const wMembership = (memberships ?? [])
      .filter((m) => inRange(m.start_date, w.start, w.end))
      .reduce((s, m) => s + Number(m.amount_paid), 0);
    const wDayPass = (dayPasses ?? [])
      .filter((d) => inRange(d.created_at, w.start, w.end))
      .reduce((s, d) => s + Number(d.amount), 0);
    const wSales = (sales ?? [])
      .filter((s) => inRange(s.sale_date, w.start, w.end))
      .reduce((s, sale) => s + Number(sale.total), 0);
    const wExpenses = (expenses ?? [])
      .filter((e) => inRange(e.expense_date, w.start, w.end))
      .reduce((s, e) => s + Number(e.amount), 0);
    const wIncome = wMembership + wDayPass + wSales;
    return { ...w, wMembership, wDayPass, wSales, wIncome, wExpenses, wNet: wIncome - wExpenses };
  });

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const thisMonth = currentMonthParam();

  function viewLink(v: "mensual" | "semanal") {
    return `/dueno/ingresos?month=${month}&view=${v}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ingresos</h1>
          <p className="text-muted-foreground">{monthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href={`/dueno/ingresos?month=${prevMonth}&view=${view}`} />}>
            ← Mes anterior
          </Button>
          {month !== thisMonth && (
            <Button size="sm" variant="ghost" render={<Link href={`/dueno/ingresos?month=${thisMonth}&view=${view}`} />}>
              Hoy
            </Button>
          )}
          <Button size="sm" variant="outline" render={<Link href={`/dueno/ingresos?month=${nextMonth}&view=${view}`} />}>
            Mes siguiente →
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={view === "mensual" ? "default" : "outline"}
          render={<Link href={viewLink("mensual")} />}
        >
          Vista mensual
        </Button>
        <Button
          size="sm"
          variant={view === "semanal" ? "default" : "outline"}
          render={<Link href={viewLink("semanal")} />}
        >
          Vista semanal
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{money(grandTotal)}</CardTitle>
            <CardDescription>Ingresos del mes</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{money(membershipTotal)}</CardTitle>
            <CardDescription>Membresías ({memberships?.length ?? 0})</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{money(dayPassTotal)}</CardTitle>
            <CardDescription>Pases de visita ({dayPasses?.length ?? 0})</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{money(salesTotal)}</CardTitle>
            <CardDescription>Tienda</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">-{money(expensesTotal)}</CardTitle>
            <CardDescription>
              Gastos del mes ·{" "}
              <Link href={`/dueno/gastos?month=${month}`} className="underline">
                administrar
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className={cn(netProfit >= 0 ? "text-green-400" : "text-destructive")}>
              {money(netProfit)}
            </CardTitle>
            <CardDescription>Utilidad neta (ingresos − gastos)</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {view === "semanal" ? (
        <Card>
          <CardHeader>
            <CardTitle>Desglose semanal</CardTitle>
            <CardDescription>Semanas de lunes a domingo dentro de {monthLabel(month).toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semana</TableHead>
                  <TableHead>Membresías</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Gastos</TableHead>
                  <TableHead>Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyRows.map((w) => (
                  <TableRow key={w.start}>
                    <TableCell>{w.label}</TableCell>
                    <TableCell>{money(w.wMembership)}</TableCell>
                    <TableCell>{money(w.wDayPass)}</TableCell>
                    <TableCell>{money(w.wSales)}</TableCell>
                    <TableCell>{money(w.wIncome)}</TableCell>
                    <TableCell className="text-destructive">-{money(w.wExpenses)}</TableCell>
                    <TableCell className={w.wNet >= 0 ? "text-green-400" : "text-destructive"}>
                      {money(w.wNet)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Membresías por plan</CardTitle>
              <CardDescription>{monthLabel(month)}</CardDescription>
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
                        <TableCell>{money(data.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">
                  No hay membresías con fecha de inicio en este mes con monto registrado.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ventas por producto</CardTitle>
              <CardDescription>{monthLabel(month)}</CardDescription>
            </CardHeader>
            <CardContent>
              {byProduct.size > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(byProduct.entries()).map(([name, data]) => (
                      <TableRow key={name}>
                        <TableCell>{name}</TableCell>
                        <TableCell>{data.qty}</TableCell>
                        <TableCell>{money(data.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Sin ventas este mes.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos por categoría</CardTitle>
              <CardDescription>{monthLabel(month)}</CardDescription>
            </CardHeader>
            <CardContent>
              {byCategory.size > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(byCategory.entries()).map(([name, amount]) => (
                      <TableRow key={name}>
                        <TableCell>{name}</TableCell>
                        <TableCell className="text-destructive">{money(amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Sin gastos este mes.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membresías registradas</CardTitle>
              <CardDescription>Fecha de inicio dentro de {monthLabel(month).toLowerCase()}. Borra un registro si fue una prueba o un error.</CardDescription>
            </CardHeader>
            <CardContent>
              {memberships && memberships.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Socio</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha inicio</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.profiles?.full_name ?? "—"}</TableCell>
                        <TableCell>{m.membership_plans?.name ?? "—"}</TableCell>
                        <TableCell>{money(Number(m.amount_paid))}</TableCell>
                        <TableCell>{m.start_date}</TableCell>
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
              <CardTitle>Pases de visita</CardTitle>
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
                        <TableCell>{money(Number(d.amount))}</TableCell>
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
              <CardTitle>Ventas registradas</CardTitle>
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
                        <TableCell>{money(Number(s.total))}</TableCell>
                        <TableCell>{s.sale_date}</TableCell>
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
        </>
      )}
    </div>
  );
}
