"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestRoutine, type RequestRoutineState } from "../actions";

const initialState: RequestRoutineState = { error: null, success: false };

export function RequestRoutineForm() {
  const [state, formAction, pending] = useActionState(requestRoutine, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("¡Solicitud enviada! Tu instructor la revisará pronto.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Input id="objetivo" name="objetivo" placeholder="Ej: Bajar de peso, ganar fuerza" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nivel">Nivel</Label>
        <Select name="nivel" defaultValue="intermedio">
          <SelectTrigger id="nivel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="principiante">Principiante</SelectItem>
            <SelectItem value="intermedio">Intermedio</SelectItem>
            <SelectItem value="avanzado">Avanzado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sesiones_semana">Sesiones por semana</Label>
        <Input
          id="sesiones_semana"
          name="sesiones_semana"
          type="number"
          min={1}
          max={7}
          defaultValue={3}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lesiones">Lesiones o condiciones previas</Label>
        <Textarea id="lesiones" name="lesiones" placeholder="Rodilla, hombro, ninguna..." />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}
