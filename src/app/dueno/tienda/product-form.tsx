"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { upsertProduct, deleteProduct } from "../actions";

export function ProductForm({ product, onDone }: { product?: Product; onDone?: () => void }) {
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null);

  async function action(formData: FormData) {
    setPending(true);
    try {
      await upsertProduct(formData);
      toast.success(product ? "Producto actualizado." : "Producto creado.");
      onDone?.();
    } catch {
      toast.error("No se pudo guardar el producto.");
    } finally {
      setPending(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="existing_image_url" value={product?.image_url ?? ""} />
      <div className="flex flex-col gap-2">
        <Label>Nombre</Label>
        <Input name="name" defaultValue={product?.name} required />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label>Precio (MXN)</Label>
          <Input name="price" type="number" step="0.01" defaultValue={product?.price} required />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label>Stock</Label>
          <Input name="stock" type="number" defaultValue={product?.stock ?? 0} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Categoría</Label>
        <Input name="category" defaultValue={product?.category ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Descripción</Label>
        <Textarea name="description" defaultValue={product?.description ?? ""} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Imagen</Label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-32 w-32 rounded-md object-cover" />
        )}
        <Input name="image" type="file" accept="image/*" onChange={handleImageChange} />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : product ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ProductForm product={product} onDone={() => setEditing(false)} />
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="mt-2">
            Cancelar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{product.name}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <form
            action={async (formData) => {
              await deleteProduct(formData);
              toast.success("Producto eliminado.");
            }}
          >
            <input type="hidden" name="id" value={product.id} />
            <Button size="sm" variant="destructive" type="submit">
              Eliminar
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="mb-2 h-32 w-full rounded-md object-cover"
          />
        )}
        <p className="text-2xl font-bold">${product.price}</p>
        <p className="text-sm text-muted-foreground">
          Stock: {product.stock} {product.category && `· ${product.category}`}
        </p>
      </CardContent>
    </Card>
  );
}
