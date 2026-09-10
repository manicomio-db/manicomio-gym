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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MembershipPlan } from "@/lib/types";
import { activateMembershipWithProof } from "../actions";

export function RegisterPaymentDialog({
  socioId,
  socioNombre,
  plans,
}: {
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
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Adjunta la foto o el comprobante del pago.");
      return;
    }
    setPending(true);
    try {
      await activateMembershipWithProof(formData);
      toast.success("Pago registrado y membresía activada.");
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el pago.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Registrar pago</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago de {socioNombre}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="socio_id" value={socioId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="rp_plan_id">Plan pagado</Label>
            <Select
              name="plan_id"
              onValueChange={(value) => {
                const plan = plans.find((p) => p.id === value);
                if (plan) setAmount(plan.price.toString());
              }}
            >
              <SelectTrigger id="rp_plan_id">
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
            <Label htmlFor="rp_amount">Monto recibido (MXN)</Label>
            <Input
              id="rp_amount"
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
            <Label htmlFor="rp_file">Foto del comprobante o del efectivo recibido</Label>
            <Input id="rp_file" name="file" type="file" accept="image/*,.pdf" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rp_note">Nota (opcional)</Label>
            <Textarea id="rp_note" name="note" placeholder="Ej: pago en efectivo en recepción" />
          </div>
          <p className="text-sm text-muted-foreground">
            El vencimiento se calcula solo: si la membresía sigue vigente se suma a la fecha actual,
            si ya venció arranca hoy.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando..." : "Registrar y activar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
