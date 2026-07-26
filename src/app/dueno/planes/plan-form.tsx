"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MembershipPlan } from "@/lib/types";
import { upsertPlan, deletePlan } from "../actions";

export function PlanForm({ plan, onDone }: { plan?: MembershipPlan; onDone?: () => void }) {
  const [pending, setPending] = useState(false);

  async function action(formData: FormData) {
    setPending(true);
    try {
      await upsertPlan(formData);
      toast.success(plan ? "Plan actualizado." : "Plan creado.");
      onDone?.();
    } catch {
      toast.error("No se pudo guardar el plan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <div className="flex flex-col gap-2">
        <Label>Nombre</Label>
        <Input name="name" defaultValue={plan?.name} required />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Label>Precio (MXN)</Label>
          <Input name="price" type="number" step="0.01" defaultValue={plan?.price} required />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label>Duración (días)</Label>
          <Input name="duration_days" type="number" defaultValue={plan?.duration_days ?? 30} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Descripción</Label>
        <Textarea name="description" defaultValue={plan?.description ?? ""} />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : plan ? "Guardar cambios" : "Crear plan"}
      </Button>
    </form>
  );
}

export function PlanCard({ plan }: { plan: MembershipPlan }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <PlanForm plan={plan} onDone={() => setEditing(false)} />
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
        <CardTitle>{plan.name}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <form
            action={async (formData) => {
              await deletePlan(formData);
              toast.success("Plan eliminado.");
            }}
          >
            <input type="hidden" name="id" value={plan.id} />
            <Button size="sm" variant="destructive" type="submit">
              Eliminar
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          ${plan.price} <span className="text-sm font-normal text-muted-foreground">/ {plan.duration_days} días</span>
        </p>
        {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
      </CardContent>
    </Card>
  );
}
