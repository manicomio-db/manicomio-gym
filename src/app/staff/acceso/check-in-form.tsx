"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { registerCheckIn, type CheckInState } from "../actions";

const initialState: CheckInState = { error: null, result: null };

const STATUS_LABEL = {
  activo: "Membresía activa",
  vencido: "Membresía vencida",
  sin_membresia: "Sin membresía registrada",
};

export function CheckInForm() {
  const [state, formAction, pending] = useActionState(registerCheckIn, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.result || state.error) {
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar entrada</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="member_number">Número de socio</Label>
            <Input
              ref={inputRef}
              id="member_number"
              name="member_number"
              type="number"
              min={1}
              autoFocus
              className="w-40"
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Buscando..." : "Registrar entrada"}
          </Button>
        </form>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        {state.result && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-semibold">
                #{state.result.memberNumber} — {state.result.name}
              </p>
              {state.result.endDate && (
                <p className="text-sm text-muted-foreground">Vence: {state.result.endDate}</p>
              )}
            </div>
            <Badge variant={state.result.status === "activo" ? "default" : "destructive"}>
              {STATUS_LABEL[state.result.status]}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
