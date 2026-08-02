import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product, Sale } from "@/lib/types";
import { registerSale } from "../actions";

export default async function StaffVentasPage() {
  const { supabase } = await requireProfile();

  const [{ data: products }, { data: sales }] = await Promise.all([
    supabase.from("products").select("*").order("name").returns<Product[]>(),
    supabase
      .from("sales")
      .select("*, products(name)")
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<(Sale & { products: { name: string } | null })[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Ventas</h1>
        <p className="text-muted-foreground">Registra la venta de un producto y controla el stock.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar venta</CardTitle>
          <CardDescription>
            Puedes poner una fecha pasada para ir capturando ventas de días anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerSale} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product_id">Producto</Label>
              <Select name="product_id" required>
                <SelectTrigger id="product_id" className="w-64">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {(products ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={p.stock === 0}>
                      {p.name} — ${p.price} ({p.stock} en stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} className="w-24" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sale_date">Fecha</Label>
              <Input id="sale_date" name="sale_date" type="date" defaultValue={todayLocal()} className="w-40" />
            </div>
            <Button type="submit">Registrar venta</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas ventas</CardTitle>
          <CardDescription>20 más recientes</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.products?.name ?? "—"}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>${s.total.toLocaleString("es-MX")}</TableCell>
                    <TableCell>{s.sale_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Aún no hay ventas registradas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
