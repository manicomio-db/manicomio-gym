"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONDITIONS, PARQ_QUESTIONS, SEX_LABEL, ACTIVITY_LABEL } from "@/lib/health";
import type { HealthProfile } from "@/lib/types";
import { saveHealthProfile, type SaveHealthState } from "./ficha-actions";

const initialState: SaveHealthState = { error: null, success: false };

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function HealthProfileForm({
  socioId,
  initial,
  maxDate,
}: {
  /** Solo cuando el staff la llena a nombre de un socio. */
  socioId?: string;
  initial: HealthProfile | null;
  /** Fecha de hoy (YYYY-MM-DD) para limitar la fecha de nacimiento. */
  maxDate: string;
}) {
  const [state, formAction, pending] = useActionState(saveHealthProfile, initialState);

  useEffect(() => {
    if (state.success) toast.success("Ficha de salud guardada.");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {socioId && <input type="hidden" name="socio_id" value={socioId} />}

      <section className="flex flex-col gap-4">
        <h3 className="font-semibold">Datos generales</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_date">Fecha de nacimiento *</Label>
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              max={maxDate}
              defaultValue={initial?.birth_date ?? ""}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sex">Sexo</Label>
            <select id="sex" name="sex" defaultValue={initial?.sex ?? ""} className={selectClass}>
              <option value="">Sin indicar</option>
              {Object.entries(SEX_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="weight_kg">Peso (kg)</Label>
            <Input
              id="weight_kg"
              name="weight_kg"
              type="number"
              step="0.1"
              min={20}
              max={400}
              defaultValue={initial?.weight_kg ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="height_cm">Estatura (cm)</Label>
            <Input
              id="height_cm"
              name="height_cm"
              type="number"
              step="0.1"
              min={80}
              max={250}
              defaultValue={initial?.height_cm ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="activity_level">¿Cuánto ejercicio haces actualmente?</Label>
            <select
              id="activity_level"
              name="activity_level"
              defaultValue={initial?.activity_level ?? ""}
              className={selectClass}
            >
              <option value="">Sin indicar</option>
              {Object.entries(ACTIVITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-semibold">Condiciones de salud</h3>
        <p className="text-sm text-muted-foreground">Marca todas las que apliquen.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONDITIONS.map((c) => (
            <label key={c.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="conditions"
                value={c.value}
                defaultChecked={initial?.conditions.includes(c.value)}
                className="size-4 accent-primary"
              />
              {c.label}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="conditions_other">Otra condición o enfermedad</Label>
          <Input
            id="conditions_other"
            name="conditions_other"
            placeholder="Ej: fibromialgia, epilepsia..."
            defaultValue={initial?.conditions_other ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="injuries">Lesiones o cirugías (actuales o pasadas)</Label>
          <Textarea
            id="injuries"
            name="injuries"
            placeholder="Ej: operación de rodilla izquierda en 2023, dolor de hombro derecho..."
            defaultValue={initial?.injuries ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="medications">Medicamentos que tomas</Label>
          <Input
            id="medications"
            name="medications"
            placeholder="Ej: losartán, metformina, ninguno"
            defaultValue={initial?.medications ?? ""}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-semibold">Cuestionario de aptitud para el ejercicio (PAR-Q) *</h3>
        <div className="flex flex-col gap-3">
          {PARQ_QUESTIONS.map((q, i) => (
            <fieldset key={q.key} className="flex flex-col gap-2 rounded-md border p-3">
              <legend className="px-1 text-sm">
                {i + 1}. {q.text}
              </legend>
              <div className="flex gap-6 text-sm">
                {(["si", "no"] as const).map((value) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`parq_${q.key}`}
                      value={value}
                      defaultChecked={
                        initial ? (value === "si") === Boolean(initial.parq?.[q.key]) : false
                      }
                      required
                      className="size-4 accent-primary"
                    />
                    {value === "si" ? "Sí" : "No"}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-semibold">Contacto de emergencia y notas</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="emergency_name">Nombre del contacto</Label>
            <Input id="emergency_name" name="emergency_name" defaultValue={initial?.emergency_name ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="emergency_phone">Teléfono del contacto</Label>
            <Input
              id="emergency_phone"
              name="emergency_phone"
              type="tel"
              defaultValue={initial?.emergency_phone ?? ""}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Algo más que el instructor deba saber</Label>
          <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-primary/40 p-4">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-primary" />
          <span>
            Autorizo a Manicomio Gym a usar esta información de salud solo para diseñar y ajustar mi
            rutina y para mi seguridad durante el entrenamiento. *
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          Esta ficha no sustituye una valoración médica. Si algo cambia en tu salud, actualízala.
        </p>
      </section>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : "Guardar ficha"}
      </Button>
    </form>
  );
}
