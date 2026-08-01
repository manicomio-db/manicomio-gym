"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseCategory, Product } from "@/lib/types";
import { upsertProduct, deleteProduct, restockProduct } from "../actions";

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

function RestockDialog({
  product,
  expenseCategories,
}: {
  product: Product;
  expenseCategories: ExpenseCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await restockProduct(formData);
      toast.success("Stock actualizado y gasto registrado.");
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el reabasto.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Reabastecer</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reabastecer {product.name}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="product_id" value={product.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity">Unidades que compraste</Label>
            <Input id="quantity" name="quantity" type="number" min={1} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cost">Costo total (MXN)</Label>
            <Input id="cost" name="cost" type="number" step="0.01" min={0.01} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category_id">Categoría de gasto</Label>
            <Select name="category_id">
              <SelectTrigger id="category_id">
                <SelectValue placeholder="Selecciona (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Registrar reabasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProductCard({
  product,
  expenseCategories,
}: {
  product: Product;
  expenseCategories: ExpenseCategory[];
}) {
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
          <RestockDialog product={product} expenseCategories={expenseCategories} />
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
