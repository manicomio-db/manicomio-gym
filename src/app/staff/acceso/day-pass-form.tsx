"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerDayPass, type DayPassState } from "../actions";

const initialState: DayPassState = { error: null, success: false };

export function DayPassForm({
  canChooseDate,
  today,
}: {
  /** Solo el director puede capturar visitas de otro día. */
  canChooseDate: boolean;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    registerDayPass,
    initialState,
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Visita registrada.");
      // Se conserva la fecha para poder capturar varias visitas del mismo día seguidas.
      if (nameRef.current) nameRef.current.value = "";
      if (amountRef.current) amountRef.current.value = "";
      nameRef.current?.focus();
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {canChooseDate && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="pass_date">Fecha de la visita</Label>
            <Input
              id="pass_date"
              name="pass_date"
              type="date"
              max={today}
              defaultValue={today}
              required
              className="w-44"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="visitor_name">Nombre del visitante</Label>
          <Input
            ref={nameRef}
            id="visitor_name"
            name="visitor_name"
            required
            maxLength={80}
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Monto cobrado (MXN)</Label>
          <Input
            ref={amountRef}
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min={1}
            required
            className="w-32"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Registrar visita"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
