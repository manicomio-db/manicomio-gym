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

export function RequestRoutineForm({ hasPreviousRoutine }: { hasPreviousRoutine: boolean }) {
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
        <Label htmlFor="lesiones">Molestias o lesiones de hoy (opcional)</Label>
        <Textarea
          id="lesiones"
          name="lesiones"
          placeholder="Ej: me duele el hombro derecho desde hace 2 semanas. Tu historial completo ya está en tu ficha."
        />
      </div>
      {hasPreviousRoutine && (
        <section className="flex flex-col gap-4 rounded-md border border-primary/40 p-4">
          <div>
            <h3 className="font-semibold">¿Cómo te fue con tu rutina anterior?</h3>
            <p className="text-sm text-muted-foreground">
              Tu instructor usa tus respuestas y tu progreso registrado para diseñar la siguiente.
            </p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">¿Qué tan difícil fue? *</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {[
                ["muy_facil", "Muy fácil"],
                ["adecuada", "Adecuada"],
                ["muy_dificil", "Muy difícil"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input type="radio" name="dificultad" value={value} required className="size-4 accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">¿Lograste tu objetivo? *</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {[
                ["si", "Sí"],
                ["parcial", "Parcialmente"],
                ["no", "No"],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="objetivo_logrado"
                    value={value}
                    required
                    className="size-4 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dias_por_semana">¿Cuántos días por semana entrenaste en realidad?</Label>
            <Input
              id="dias_por_semana"
              name="dias_por_semana"
              type="number"
              min={0}
              max={7}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="molestias">¿Sentiste dolor o molestias? ¿Dónde?</Label>
            <Textarea id="molestias" name="molestias" placeholder="Ej: dolor en la rodilla con las sentadillas" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="comentarios">Comentarios (qué te gustó, qué cambiarías)</Label>
            <Textarea id="comentarios" name="comentarios" />
          </div>
        </section>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}
