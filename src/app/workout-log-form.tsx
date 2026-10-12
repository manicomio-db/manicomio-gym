"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logWorkout, type LogWorkoutState } from "./progreso-actions";

const initialState: LogWorkoutState = { error: null, success: false };

export function WorkoutLogForm({
  socioId,
  exercises,
  today,
}: {
  /** Solo cuando el staff registra a nombre de un socio. */
  socioId?: string;
  /** Ejercicios de la rutina actual, como sugerencias. */
  exercises: string[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(logWorkout, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Registro guardado.");
      // Conserva la fecha y el ejercicio para anotar la siguiente serie rápido.
      const reps = formRef.current?.elements.namedItem("reps") as HTMLInputElement | null;
      if (reps) reps.value = "";
    }
  }, [state]);

  const listId = `exercise-options-${socioId ?? "own"}`;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {socioId && <input type="hidden" name="socio_id" value={socioId} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-2 lg:col-span-2">
          <Label htmlFor={`exercise-${listId}`}>Ejercicio</Label>
          <Input
            id={`exercise-${listId}`}
            name="exercise"
            list={listId}
            placeholder="Elige de tu rutina o escribe otro"
            maxLength={80}
            required
          />
          <datalist id={listId}>
            {exercises.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`weight-${listId}`}>Peso (kg)</Label>
          <Input
            id={`weight-${listId}`}
            name="weight_kg"
            type="number"
            step="0.25"
            min={0}
            max={1000}
            placeholder="0 = peso corporal"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`reps-${listId}`}>Repeticiones</Label>
          <Input id={`reps-${listId}`} name="reps" type="number" min={1} max={500} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`sets-${listId}`}>Series</Label>
          <Input id={`sets-${listId}`} name="sets" type="number" min={1} max={50} defaultValue={3} />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`date-${listId}`}>Fecha</Label>
          <Input
            id={`date-${listId}`}
            name="log_date"
            type="date"
            max={today}
            defaultValue={today}
            className="w-44"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar registro"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
