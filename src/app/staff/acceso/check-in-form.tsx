"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseSocioQrPayload } from "@/lib/qr";
import { registerCheckIn, type CheckInState } from "../actions";
import { QrScanner } from "./qr-scanner";

const initialState: CheckInState = { error: null, result: null };

const STATUS_LABEL = {
  activo: "Membresía activa",
  vencido: "Membresía vencida",
  sin_membresia: "Sin membresía registrada",
};

export function CheckInForm() {
  const [state, formAction, pending] = useActionState(registerCheckIn, initialState);
  const [mode, setMode] = useState<"manual" | "qr">("manual");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.result || state.error) {
      formRef.current?.reset();
      if (mode === "manual") inputRef.current?.focus();
    }
  }, [state, mode]);

  function handleQrDetect(payload: string) {
    const memberNumber = parseSocioQrPayload(payload);
    if (!memberNumber) {
      toast.error("Ese QR no es de un socio de Manicomio Gym.");
      return;
    }
    if (inputRef.current) inputRef.current.value = String(memberNumber);
    formRef.current?.requestSubmit();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar entrada</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "manual" ? "default" : "outline"}
            onClick={() => setMode("manual")}
          >
            Número manual
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "qr" ? "default" : "outline"}
            onClick={() => setMode("qr")}
          >
            Registrar con QR
          </Button>
        </div>

        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
          <div className={mode === "manual" ? "flex flex-col gap-2" : "hidden"}>
            <Label htmlFor="member_number">Número de socio</Label>
            <Input
              ref={inputRef}
              id="member_number"
              name="member_number"
              type="number"
              min={1}
              autoFocus={mode === "manual"}
              className="w-40"
              required
            />
          </div>
          {mode === "manual" && (
            <Button type="submit" disabled={pending}>
              {pending ? "Buscando..." : "Registrar entrada"}
            </Button>
          )}
        </form>

        {mode === "qr" && <QrScanner active={mode === "qr"} onDetect={handleQrDetect} />}

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        {state.result && (
          <div
            className={
              state.result.status === "activo"
                ? "flex flex-col gap-3 rounded-md border-2 border-green-500 bg-green-500/15 p-4"
                : "flex flex-col gap-3 rounded-md border-2 border-red-500 bg-red-500/15 p-4"
            }
          >
            <p
              className={
                state.result.status === "activo"
                  ? "text-xl font-bold text-green-400"
                  : "text-xl font-bold text-red-400"
              }
            >
              {state.result.alreadyRegistered
                ? `Ya registró su entrada hoy a las ${new Date(state.result.checkedInAt).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true })}`
                : state.result.status === "activo"
                  ? "Entrada registrada"
                  : "Entrada registrada — membresía no vigente"}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {state.result.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.result.avatarUrl}
                    alt={state.result.name}
                    className="h-14 w-14 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-muted text-xs text-muted-foreground">
                    Sin foto
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    #{state.result.memberNumber} — {state.result.name}
                  </p>
                  {state.result.endDate && (
                    <p className="text-sm text-muted-foreground">Vence: {state.result.endDate}</p>
                  )}
                </div>
              </div>
              <Badge variant={state.result.status === "activo" ? "default" : "destructive"}>
                {STATUS_LABEL[state.result.status]}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
