import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ExpenseCategory, Product } from "@/lib/types";
import { ProductForm, ProductCard } from "./product-form";

export default async function DuenoTiendaPage() {
  const { supabase } = await requireProfile();

  const [{ data: products }, { data: sales }, { data: expenseCategories }] = await Promise.all([
    supabase.from("products").select("*").order("name").returns<Product[]>(),
    supabase.from("sales").select("total"),
    supabase.from("expense_categories").select("*").order("name").returns<ExpenseCategory[]>(),
  ]);

  const ingresos = (sales ?? []).reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Tienda</h1>
        <p className="text-muted-foreground">Catálogo, stock e ingresos por ventas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>${ingresos.toLocaleString("es-MX")}</CardTitle>
          <CardDescription>Ingresos históricos por ventas de productos</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => (
          <ProductCard key={p.id} product={p} expenseCategories={expenseCategories ?? []} />
        ))}
      </div>
    </div>
  );
}
