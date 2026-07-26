import { requireProfile } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

export default async function SocioTiendaPage() {
  const { supabase } = await requireProfile();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .returns<Product[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Tienda</h1>
        <p className="text-muted-foreground">
          Productos disponibles en recepción. Pregunta al staff para comprarlos.
        </p>
      </div>

      {products && products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                {p.category && <CardDescription>{p.category}</CardDescription>}
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-40 w-full rounded-md object-cover"
                  />
                )}
                <p className="text-2xl font-bold">${p.price.toLocaleString("es-MX")}</p>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                <Badge variant={p.stock > 0 ? "secondary" : "destructive"} className="w-fit">
                  {p.stock > 0 ? `${p.stock} disponibles` : "Agotado"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Aún no hay productos publicados.</p>
      )}
    </div>
  );
}
