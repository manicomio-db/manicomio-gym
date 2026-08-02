import Link from "next/link";
import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { currentMonthParam, monthLabel, monthRange, shiftMonth } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Expense, ExpenseCategory } from "@/lib/types";
import {
  createExpense,
  deleteExpense,
  upsertExpenseCategory,
  deleteExpenseCategory,
} from "../actions";

export default async function DuenoGastosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase } = await requireProfile();
  const params = await searchParams;
  const month = params.month || currentMonthParam();
  const { start: monthStart, end: monthEnd } = monthRange(month);
  const thisMonth = currentMonthParam();

  const [{ data: categories }, { data: expenses }] = await Promise.all([
    supabase
      .from("expense_categories")
      .select("*")
      .order("name")
      .returns<ExpenseCategory[]>(),
    supabase
      .from("expenses")
      .select("*, expense_categories(name)")
      .gte("expense_date", monthStart)
      .lt("expense_date", monthEnd)
      .order("expense_date", { ascending: false })
      .returns<Expense[]>(),
  ]);

  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = new Map<string, number>();
  for (const e of expenses ?? []) {
    const name = e.expense_categories?.name ?? "Sin categoría";
    byCategory.set(name, (byCategory.get(name) ?? 0) + Number(e.amount));
  }

  const defaultExpenseDate = month === thisMonth ? todayLocal() : monthStart;
  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">{monthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href={`/dueno/gastos?month=${prevMonth}`} />}>
            ← Mes anterior
          </Button>
          {month !== thisMonth && (
            <Button size="sm" variant="ghost" render={<Link href={`/dueno/gastos?month=${thisMonth}`} />}>
              Hoy
            </Button>
          )}
          <Button size="sm" variant="outline" render={<Link href={`/dueno/gastos?month=${nextMonth}`} />}>
            Mes siguiente →
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>${total.toLocaleString("es-MX")}</CardTitle>
          <CardDescription>Total de gastos ({expenses?.length ?? 0} registros)</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
          <CardDescription>
            Organiza tus gastos (renta, nómina, servicios, mantenimiento, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={upsertExpenseCategory} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nueva categoría</Label>
              <Input id="name" name="name" placeholder="Ej: Renta, Nómina, Servicios" required className="w-56" />
            </div>
            <Button type="submit">Agregar</Button>
          </form>

          {categories && categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <form key={c.id} action={deleteExpenseCategory} className="flex items-center gap-1">
                  <span className="rounded-md border px-3 py-1.5 text-sm">{c.name}</span>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                    ✕
                  </Button>
                </form>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Aún no tienes categorías. Agrega la primera arriba.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar gasto</CardTitle>
          <CardDescription>
            Puedes poner una fecha pasada para ir capturando gastos de meses anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createExpense} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category_id">Categoría</Label>
              <Select name="category_id">
                <SelectTrigger id="category_id" className="w-48">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" placeholder="Ej: Pago de luz julio" required className="w-56" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Monto (MXN)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min={1} required className="w-32" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense_date">Fecha</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                defaultValue={defaultExpenseDate}
              />
            </div>
            <Button type="submit">Registrar gasto</Button>
          </form>
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
                    <TableCell>${amount.toLocaleString("es-MX")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Sin gastos registrados en este mes.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos registrados</CardTitle>
          <CardDescription>Borra un registro si fue una prueba o un error.</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses && expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{e.expense_categories?.name ?? "—"}</TableCell>
                    <TableCell>${Number(e.amount).toLocaleString("es-MX")}</TableCell>
                    <TableCell>{e.expense_date}</TableCell>
                    <TableCell>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
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
            <p className="text-muted-foreground">Sin registros en este mes.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
