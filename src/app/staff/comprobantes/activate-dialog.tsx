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
import { activateMembershipFromProof } from "../actions";

export function ActivateDialog({
  proofId,
  socioId,
  socioNombre,
  plans,
}: {
  proofId: string;
  socioId: string;
  socioNombre: string;
  plans: MembershipPlan[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState("");

  async function handleSubmit(formData: FormData) {
    if (!formData.get("plan_id")) {
      toast.error("Elige el plan que pagó.");
      return;
    }
    setPending(true);
    try {
      await activateMembershipFromProof(formData);
      toast.success("Membresía activada y comprobante marcado como revisado.");
      setOpen(false);
    } catch {
      toast.error("No se pudo activar la membresía.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Activar membresía</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activar plan de {socioNombre}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="proof_id" value={proofId} />
          <input type="hidden" name="socio_id" value={socioId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan_id">Plan pagado</Label>
            <Select
              name="plan_id"
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
                    {p.name} — ${p.price} ({p.duration_days} días)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount_paid">Monto recibido (MXN)</Label>
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
          <p className="text-sm text-muted-foreground">
            El vencimiento se calcula solo: si la membresía sigue vigente se suma a la fecha actual,
            si ya venció arranca hoy.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Activando..." : "Activar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
