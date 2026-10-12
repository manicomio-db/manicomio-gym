"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/session";
import { todayLocal } from "@/lib/date";
import { CONDITIONS, PARQ_QUESTIONS, ageFromBirthDate } from "@/lib/health";

export type SaveHealthState = { error: string | null; success: boolean };

const VALID_CONDITIONS = new Set(CONDITIONS.map((c) => c.value));
const VALID_SEX = new Set(["femenino", "masculino", "otro", "prefiero_no_decir"]);
const VALID_ACTIVITY = new Set(["sedentario", "ligero", "moderado", "activo"]);

function text(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v ? v : null;
}

function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Guarda la ficha de salud. El socio solo puede guardar la suya; staff/dueño
 * la de cualquier socio (campo oculto socio_id).
 */
export async function saveHealthProfile(
  _prev: SaveHealthState,
  formData: FormData
): Promise<SaveHealthState> {
  const { profile, supabase } = await requireProfile();

  const isStaff = profile.role === "staff" || profile.role === "dueno";
  const socioId = isStaff ? String(formData.get("socio_id") ?? "") : profile.id;
  if (!socioId) return { error: "Falta el socio.", success: false };

  const birthDate = String(formData.get("birth_date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || birthDate > todayLocal()) {
    return { error: "Escribe una fecha de nacimiento válida.", success: false };
  }
  const age = ageFromBirthDate(birthDate);
  if (age < 5 || age > 100) {
    return { error: "Revisa la fecha de nacimiento: la edad no parece correcta.", success: false };
  }

  const weight = num(formData, "weight_kg");
  const height = num(formData, "height_cm");
  if (weight !== null && (Number.isNaN(weight) || weight < 20 || weight > 400)) {
    return { error: "El peso debe estar entre 20 y 400 kg.", success: false };
  }
  if (height !== null && (Number.isNaN(height) || height < 80 || height > 250)) {
    return { error: "La estatura debe estar entre 80 y 250 cm.", success: false };
  }

  const parq: Record<string, boolean> = {};
  for (const q of PARQ_QUESTIONS) {
    const answer = String(formData.get(`parq_${q.key}`) ?? "");
    if (answer !== "si" && answer !== "no") {
      return { error: "Contesta todas las preguntas del cuestionario (Sí o No).", success: false };
    }
    parq[q.key] = answer === "si";
  }

  if (formData.get("consent") !== "on") {
    return { error: "Debes aceptar el uso de tu información de salud para guardar la ficha.", success: false };
  }

  const sex = String(formData.get("sex") ?? "");
  const activity = String(formData.get("activity_level") ?? "");

  const { error } = await supabase.from("health_profiles").upsert(
    {
      socio_id: socioId,
      birth_date: birthDate,
      sex: VALID_SEX.has(sex) ? sex : null,
      weight_kg: weight,
      height_cm: height,
      activity_level: VALID_ACTIVITY.has(activity) ? activity : null,
      conditions: formData.getAll("conditions").map(String).filter((c) => VALID_CONDITIONS.has(c)),
      conditions_other: text(formData, "conditions_other"),
      injuries: text(formData, "injuries"),
      medications: text(formData, "medications"),
      parq,
      emergency_name: text(formData, "emergency_name"),
      emergency_phone: text(formData, "emergency_phone"),
      notes: text(formData, "notes"),
      consent_at: new Date().toISOString(),
      filled_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "socio_id" }
  );

  if (error) {
    console.error("saveHealthProfile error:", error);
    return { error: "No se pudo guardar la ficha. Intenta de nuevo.", success: false };
  }

  revalidatePath("/socio");
  revalidatePath("/socio/ficha");
  revalidatePath("/socio/rutina");
  revalidatePath("/staff/socios");
  revalidatePath(`/staff/socios/${socioId}/ficha`);
  revalidatePath("/staff/rutinas");
  revalidatePath("/dueno/informes");

  return { error: null, success: true };
}
