"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { MembershipPlan } from "@/lib/types";
import { updateMembership } from "../actions";

export function MembershipDialog({
  socioId,
  socioNombre,
  plans,
  currentPlanId,
  currentEndDate,
}: {
  socioId: string;
  socioNombre: string;
  plans: MembershipPlan[];
  currentPlanId: string | null;
  currentEndDate: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState(
    () => plans.find((p) => p.id === currentPlanId)?.price.toString() ?? ""
  );

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await updateMembership(formData);
      toast.success("Membresía actualizada.");
      setOpen(false);
    } catch {
      toast.error("No se pudo actualizar la membresía.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Actualizar membresía
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Membresía de {socioNombre}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="socio_id" value={socioId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan_id">Plan</Label>
            <Select
              name="plan_id"
              defaultValue={currentPlanId ?? undefined}
              onValueChange={(value) => {
                const plan = plans.find((p) => p.id === value);
                if (plan) setAmount(plan.price.toString());
              }}
            >
              <SelectTrigger id="plan_id">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — ${p.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount_paid">Monto cobrado (MXN)</Label>
            <Input
              id="amount_paid"
              name="amount_paid"
              type="number"
              step="0.01"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="start_date">Fecha de inicio</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="end_date">Fecha de vencimiento</Label>
            <Input id="end_date" name="end_date" type="date" defaultValue={currentEndDate ?? ""} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
